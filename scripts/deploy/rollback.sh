#!/usr/bin/env bash
# =============================================================================
# Careerra — Production Rollback Script
#
# Rolls back to any previously deployed image tag in under 60 seconds.
# Because images are immutable (tagged with git SHA), rollback is just
# pulling the old tag and doing a docker compose up.
#
# Usage — roll back to a specific git SHA:
#   export DO_HOST=YOUR_DROPLET_IP
#   bash scripts/deploy/rollback.sh sha-abc1234
#
# Usage — list available tags (pick one):
#   bash scripts/deploy/rollback.sh --list
#
# Usage — interactive (prompts for a tag):
#   bash scripts/deploy/rollback.sh
#
# Environment variables:
#   DO_HOST        — Droplet IP (required)
#   DO_USER        — SSH user (default: deploy)
#   DO_PORT        — SSH port (default: 22)
#   SSH_KEY        — Path to SSH private key (default: ~/.ssh/id_ed25519)
#   GITHUB_USER    — GitHub username / org (default: yashkumar93)
# =============================================================================

set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }

: "${DO_HOST:?Set DO_HOST to your Droplet IP}"
DO_USER="${DO_USER:-deploy}"
DO_PORT="${DO_PORT:-22}"
SSH_KEY="${SSH_KEY:-~/.ssh/id_ed25519}"
GITHUB_USER="${GITHUB_USER:-yashkumar93}"

SSH="ssh -i $SSH_KEY -p $DO_PORT $DO_USER@$DO_HOST"

# ── List available tags ────────────────────────────────────────────────────
list_tags() {
    info "Recent backend image tags on the server:"
    $SSH "docker images ghcr.io/$GITHUB_USER/careerra-backend \
          --format '{{.Tag}}\t{{.CreatedAt}}' \
          | grep '^sha-' \
          | sort -t'-' -k2 -r \
          | head -20" || warn "Could not list tags. Are images pulled on the server?"
}

if [[ "${1:-}" == "--list" ]]; then
    list_tags
    exit 0
fi

# ── Determine target tag ───────────────────────────────────────────────────
TARGET_TAG="${1:-}"

if [[ -z "$TARGET_TAG" ]]; then
    list_tags
    echo ""
    read -rp "Enter the tag to roll back to (e.g. sha-abc1234): " TARGET_TAG
fi

[[ -z "$TARGET_TAG" ]] && error "No tag provided."
[[ "$TARGET_TAG" == "latest" ]] && \
    warn "Rolling back to 'latest' is the same as a forward deploy. Use a sha-* tag instead."

info "Rolling back to tag: $TARGET_TAG"

# ── Verify the images exist on server before switching ─────────────────────
info "Verifying images are available..."
$SSH "docker images --format '{{.Repository}}:{{.Tag}}' \
      | grep -q 'careerra-backend:$TARGET_TAG'" \
|| {
    warn "Image not found locally on server. Attempting to pull from GHCR..."
    $SSH "docker pull ghcr.io/$GITHUB_USER/careerra-frontend:$TARGET_TAG && \
          docker pull ghcr.io/$GITHUB_USER/careerra-backend:$TARGET_TAG" \
    || error "Could not pull images for tag $TARGET_TAG. The tag may not exist."
}

# ── Capture current tag before switching (for rollback-of-rollback) ────────
CURRENT_TAG=$($SSH "cd /srv/careerra && grep '^IMAGE_TAG=' .env 2>/dev/null | cut -d= -f2 || echo unknown")
info "Current live tag: $CURRENT_TAG"
info "Switching to:     $TARGET_TAG"

# ── Perform rollback ───────────────────────────────────────────────────────
$SSH "cd /srv/careerra && \
      sed -i 's/^IMAGE_TAG=.*/IMAGE_TAG=$TARGET_TAG/' .env && \
      docker compose up -d --no-build --remove-orphans"

# ── Health check ───────────────────────────────────────────────────────────
info "Health checking backend (up to 90s)..."
HEALTHY=0
for i in $(seq 1 18); do
    STATUS=$($SSH "docker inspect --format='{{.State.Health.Status}}' careerra_backend 2>/dev/null || echo missing")
    if [[ "$STATUS" == "healthy" ]]; then
        info "Backend is healthy after $((i*5))s."
        HEALTHY=1
        break
    fi
    echo "  Attempt $i/18: $STATUS"
    sleep 5
done

if [[ $HEALTHY -eq 0 ]]; then
    error "Health check failed after rollback to $TARGET_TAG. \
Previous tag was $CURRENT_TAG. \
To restore: bash scripts/deploy/rollback.sh $CURRENT_TAG"
fi

# ── Done ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}=====================================================${NC}"
echo -e "${GREEN}  Rollback complete!${NC}"
echo -e "${GREEN}=====================================================${NC}"
echo ""
echo "  Now running:  $TARGET_TAG"
echo "  Previous tag: $CURRENT_TAG"
echo ""
echo "  To undo this rollback (go back to $CURRENT_TAG):"
echo "    bash scripts/deploy/rollback.sh $CURRENT_TAG"
echo ""
