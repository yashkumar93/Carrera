#!/usr/bin/env bash
# =============================================================================
# Careerra — First-Time Bootstrap Deploy
#
# Run this ONCE from your LOCAL machine to seed the server before
# GitHub Actions takes over all subsequent deploys.
#
# Prerequisites:
#   1. Droplet is set up (server-setup.sh has been run)
#   2. DNS A record points to the droplet IP
#   3. SSL certificate exists on the server:
#      ssh deploy@YOUR_IP "certbot certonly --standalone -d yourdomain.com"
#   4. You have the Firebase service account JSON locally
#   5. You are logged in to ghcr.io locally:
#      echo YOUR_GHCR_PAT | docker login ghcr.io -u YOUR_GITHUB_USER --password-stdin
#
# Usage:
#   export DO_HOST=YOUR_DROPLET_IP
#   export GITHUB_USER=yashkumar93          # your GitHub username
#   export DOMAIN=yourdomain.com
#   export FIREBASE_SA=./backend/carrerbots-firebase-adminsdk-fbsvc-4f298ce4eb.json
#   bash scripts/deploy/bootstrap-deploy.sh
# =============================================================================

set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }

# ── Validate required env vars ─────────────────────────────────────────────
: "${DO_HOST:?Set DO_HOST to your Droplet IP}"
: "${GITHUB_USER:?Set GITHUB_USER to your GitHub username (lowercase)}"
: "${DOMAIN:?Set DOMAIN to your domain (e.g. careerra.ai)}"
: "${FIREBASE_SA:?Set FIREBASE_SA to path of Firebase service account JSON}"
DO_USER="${DO_USER:-deploy}"
DO_PORT="${DO_PORT:-22}"
SSH_KEY="${SSH_KEY:-~/.ssh/id_ed25519}"

[[ -f "$FIREBASE_SA" ]] || error "Firebase SA file not found: $FIREBASE_SA"

info "Bootstrap deploy to $DO_HOST as $DO_USER"
info "Domain: $DOMAIN"
info "GitHub user: $GITHUB_USER"

SSH="ssh -i $SSH_KEY -p $DO_PORT"
SCP="scp -i $SSH_KEY -P $DO_PORT"

# ── Step 1: Copy Firebase service account JSON ─────────────────────────────
info "Step 1/6 — Uploading Firebase service account..."
$SCP "$FIREBASE_SA" "$DO_USER@$DO_HOST:/srv/careerra/firebase-sa.json"
$SSH "$DO_USER@$DO_HOST" "chmod 600 /srv/careerra/firebase-sa.json"
info "firebase-sa.json uploaded."

# ── Step 2: Copy docker-compose.yml ───────────────────────────────────────
info "Step 2/6 — Uploading docker-compose.yml..."
$SCP docker-compose.yml "$DO_USER@$DO_HOST:/srv/careerra/docker-compose.yml"

# ── Step 3: Copy nginx config ──────────────────────────────────────────────
info "Step 3/6 — Uploading nginx config..."
# Replace yourdomain.com placeholder with the real domain
sed "s/yourdomain.com/$DOMAIN/g" nginx/default.conf | \
    $SSH "$DO_USER@$DO_HOST" "cat > /srv/careerra/nginx/default.conf"
info "nginx/default.conf uploaded (domain = $DOMAIN)."

# ── Step 4: Verify SSL certificate exists ─────────────────────────────────
info "Step 4/6 — Checking SSL certificate..."
CERT_EXISTS=$($SSH "$DO_USER@$DO_HOST" \
    "[ -f /etc/letsencrypt/live/$DOMAIN/fullchain.pem ] && echo yes || echo no")

if [[ "$CERT_EXISTS" == "no" ]]; then
    warn "SSL certificate not found for $DOMAIN."
    warn "Run on the server:"
    warn "  sudo certbot certonly --standalone -d $DOMAIN"
    warn "Then re-run this script."
    error "Aborting — SSL cert missing."
fi
info "SSL certificate found."

# ── Step 5: Write .env on server and pull images ───────────────────────────
info "Step 5/6 — Writing .env and pulling images on server..."

# Prompt for secrets if not already in environment
[[ -z "${GROQ_API_KEY:-}" ]] && read -rsp "GROQ_API_KEY: " GROQ_API_KEY && echo
[[ -z "${PINECONE_API_KEY:-}" ]] && read -rsp "PINECONE_API_KEY: " PINECONE_API_KEY && echo
PINECONE_INDEX_NAME="${PINECONE_INDEX_NAME:-career-insights}"

$SSH "$DO_USER@$DO_HOST" \
"GITHUB_USER='$GITHUB_USER' \
 GROQ_API_KEY='$GROQ_API_KEY' \
 PINECONE_API_KEY='$PINECONE_API_KEY' \
 PINECONE_INDEX_NAME='$PINECONE_INDEX_NAME' \
 DOMAIN='$DOMAIN' bash -s" << 'ENDSSH'
set -euo pipefail
cd /srv/careerra

cat > .env << EOF
IMAGE_TAG=latest
GITHUB_REPOSITORY_OWNER=${GITHUB_USER}
GROQ_API_KEY=${GROQ_API_KEY}
PINECONE_API_KEY=${PINECONE_API_KEY}
PINECONE_INDEX_NAME=${PINECONE_INDEX_NAME}
PINECONE_NAMESPACE=
CORS_ORIGINS_STR=https://${DOMAIN}
EOF
chmod 600 .env

echo "Logging in to ghcr.io..."
# Uses GITHUB_TOKEN if available (Actions), otherwise falls back to existing login
docker pull ghcr.io/${GITHUB_USER}/careerra-frontend:latest || true
docker pull ghcr.io/${GITHUB_USER}/careerra-backend:latest  || true
ENDSSH

# ── Step 6: Start containers ───────────────────────────────────────────────
info "Step 6/6 — Starting containers..."
$SSH "$DO_USER@$DO_HOST" "cd /srv/careerra && docker compose up -d --no-build"

# Wait for backend health
info "Waiting for backend health check (up to 90s)..."
for i in $(seq 1 18); do
    STATUS=$($SSH "$DO_USER@$DO_HOST" \
        "docker inspect --format='{{.State.Health.Status}}' careerra_backend 2>/dev/null || echo missing")
    if [[ "$STATUS" == "healthy" ]]; then
        info "Backend is healthy after $((i*5))s."
        break
    fi
    if [[ $i -eq 18 ]]; then
        error "Backend health check failed after 90s. Check: ssh $DO_USER@$DO_HOST 'docker logs careerra_backend'"
    fi
    echo "  Attempt $i/18: $STATUS"
    sleep 5
done

# ── Final summary ──────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}=====================================================${NC}"
echo -e "${GREEN}  Bootstrap deploy complete!${NC}"
echo -e "${GREEN}=====================================================${NC}"
echo ""
echo "  App:    https://$DOMAIN"
echo "  API:    https://$DOMAIN/api/health"
echo "  Docs:   https://$DOMAIN/docs"
echo ""
echo "  From now on every push to 'main' deploys automatically."
echo ""
echo "  Useful server commands:"
echo "    docker compose -f /srv/careerra/docker-compose.yml logs -f"
echo "    docker compose -f /srv/careerra/docker-compose.yml ps"
echo ""
