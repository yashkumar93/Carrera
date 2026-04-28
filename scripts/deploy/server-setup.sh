#!/usr/bin/env bash
# =============================================================================
# Careerra — DigitalOcean Droplet One-Time Setup Script
#
# Run this ONCE as root on a fresh Ubuntu 24.04 droplet:
#   ssh root@YOUR_DROPLET_IP "bash -s" < scripts/deploy/server-setup.sh
#
# What it does:
#   1. Updates system packages
#   2. Installs Docker + Compose plugin
#   3. Creates a non-root 'deploy' user with docker access
#   4. Creates the persistent directory structure under /srv/careerra
#   5. Installs Certbot for SSL (Let's Encrypt)
#   6. Hardens SSH (disable root login, disable password auth)
#   7. Configures UFW firewall (allow 22, 80, 443 only)
# =============================================================================

set -euo pipefail

# ── Colour helpers ─────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }

[[ $EUID -ne 0 ]] && error "Run this script as root (ssh root@IP)"

# ── 1. System update ───────────────────────────────────────────────────────
info "Updating system packages..."
apt-get update -qq && apt-get upgrade -y -qq

# ── 2. Install Docker ──────────────────────────────────────────────────────
info "Installing Docker..."
if ! command -v docker &>/dev/null; then
    curl -fsSL https://get.docker.com | sh
else
    warn "Docker already installed — skipping."
fi

# Ensure compose plugin is present
apt-get install -y -qq docker-compose-plugin

# ── 3. Create deploy user ──────────────────────────────────────────────────
info "Creating 'deploy' user..."
if ! id deploy &>/dev/null; then
    useradd -m -s /bin/bash deploy
fi
usermod -aG docker deploy

# Set up SSH for deploy user
DEPLOY_SSH="/home/deploy/.ssh"
mkdir -p "$DEPLOY_SSH"
chmod 700 "$DEPLOY_SSH"

# Copy root's authorized_keys so the same SSH key works for deploy user.
# In the GitHub Actions workflow we'll add the dedicated deploy key separately.
if [[ -f /root/.ssh/authorized_keys ]]; then
    cp /root/.ssh/authorized_keys "$DEPLOY_SSH/authorized_keys"
    chmod 600 "$DEPLOY_SSH/authorized_keys"
    chown -R deploy:deploy "$DEPLOY_SSH"
fi

# ── 4. Create persistent directory structure ───────────────────────────────
info "Creating /srv/careerra directory structure..."
DIRS=(
    /srv/careerra
    /srv/careerra/chroma_db          # ChromaDB vector store (persistent)
    /srv/careerra/nginx              # Nginx config
    /srv/careerra/nginx/logs         # Nginx access/error logs
)
for d in "${DIRS[@]}"; do
    mkdir -p "$d"
done
chown -R deploy:deploy /srv/careerra
info "Directory structure:"
find /srv/careerra -type d | sort | sed 's|^|  |'

# ── 5. Install Certbot ─────────────────────────────────────────────────────
info "Installing Certbot..."
apt-get install -y -qq certbot python3-certbot-nginx

# ── 6. Harden SSH ─────────────────────────────────────────────────────────
info "Hardening SSH..."
SSHD=/etc/ssh/sshd_config
# Only modify if not already set
grep -q "^PermitRootLogin no" "$SSHD" || sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' "$SSHD"
grep -q "^PasswordAuthentication no" "$SSHD" || sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' "$SSHD"
systemctl reload ssh || systemctl reload sshd

warn "Root SSH login is now DISABLED. Use 'deploy' user going forward."

# ── 7. Configure UFW firewall ──────────────────────────────────────────────
info "Configuring UFW firewall..."
apt-get install -y -qq ufw
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp   comment 'SSH'
ufw allow 80/tcp   comment 'HTTP'
ufw allow 443/tcp  comment 'HTTPS'
ufw --force enable
ufw status verbose

# ── 8. Add SSL renewal cron ────────────────────────────────────────────────
info "Adding SSL auto-renewal cron..."
CRON_CMD="0 3 * * * certbot renew --quiet --deploy-hook 'docker compose -f /srv/careerra/docker-compose.yml restart nginx'"
(crontab -l 2>/dev/null | grep -q "certbot renew") || \
    (crontab -l 2>/dev/null; echo "$CRON_CMD") | crontab -

# ── Done ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}=========================================================${NC}"
echo -e "${GREEN}  Droplet setup complete!${NC}"
echo -e "${GREEN}=========================================================${NC}"
echo ""
echo "  Next steps:"
echo "  1. Add your GitHub Actions deploy public key:"
echo "     echo 'YOUR_PUBLIC_KEY' >> /home/deploy/.ssh/authorized_keys"
echo ""
echo "  2. Point your domain DNS A record → $(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_IP')"
echo ""
echo "  3. Get SSL certificate (after DNS propagates):"
echo "     certbot certonly --standalone -d yourdomain.com"
echo ""
echo "  4. SCP Firebase service account JSON:"
echo "     scp firebase-sa.json deploy@$(curl -s ifconfig.me 2>/dev/null):/srv/careerra/firebase-sa.json"
echo ""
echo "  5. Run the bootstrap deploy script (scripts/deploy/bootstrap-deploy.sh)"
echo ""
