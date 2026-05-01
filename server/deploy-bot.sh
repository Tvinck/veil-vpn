#!/bin/bash
# ═══════════════════════════════════════════════════
# VEIL VPN Bot — Production Deployment to Server
# ═══════════════════════════════════════════════════
# Usage: bash server/deploy-bot.sh <server-ip> [ssh-port]
#
# Deploys the Telegram bot to a remote server with:
# - Node.js 20 LTS (via nvm)
# - PM2 process manager (auto-restart, logs, monitoring)
# - systemd integration
# - Proper .env configuration
# ═══════════════════════════════════════════════════

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log() { echo -e "${GREEN}[VEIL]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
step() { echo -e "\n${CYAN}━━━ $1 ━━━${NC}"; }

# ── Arguments ──
SERVER_IP="${1:-}"
SSH_PORT="${2:-22}"
SSH_USER="${3:-root}"
DEPLOY_DIR="/opt/veil-bot"
SERVICE_NAME="veil-bot"

if [[ -z "$SERVER_IP" ]]; then
    error "Usage: bash server/deploy-bot.sh <server-ip> [ssh-port] [ssh-user]"
fi

SSH_CMD="ssh -o StrictHostKeyChecking=no -p ${SSH_PORT} ${SSH_USER}@${SERVER_IP}"
SCP_CMD="scp -o StrictHostKeyChecking=no -P ${SSH_PORT}"

echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}  🛡️  VEIL Bot — Production Deploy     ${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""
log "Server: ${SSH_USER}@${SERVER_IP}:${SSH_PORT}"
log "Deploy dir: ${DEPLOY_DIR}"
echo ""

# ═══════════════════════════════════════
step "1/6 Creating deployment package"
# ═══════════════════════════════════════

TMPDIR=$(mktemp -d)
trap "rm -rf $TMPDIR" EXIT

# Copy only bot-relevant files
mkdir -p "$TMPDIR/bot"
cp bot/index.js "$TMPDIR/bot/"
cp bot/supabaseClient.js "$TMPDIR/bot/"
cp package.json "$TMPDIR/"
cp .env "$TMPDIR/"

log "Package created: $(du -sh $TMPDIR | cut -f1)"

# ═══════════════════════════════════════
step "2/6 Uploading to server"
# ═══════════════════════════════════════

$SSH_CMD "mkdir -p ${DEPLOY_DIR}"
$SCP_CMD -r "$TMPDIR/bot" "${SSH_USER}@${SERVER_IP}:${DEPLOY_DIR}/"
$SCP_CMD "$TMPDIR/package.json" "${SSH_USER}@${SERVER_IP}:${DEPLOY_DIR}/"
$SCP_CMD "$TMPDIR/.env" "${SSH_USER}@${SERVER_IP}:${DEPLOY_DIR}/"

log "Files uploaded ✅"

# ═══════════════════════════════════════
step "3/6 Installing Node.js & dependencies"
# ═══════════════════════════════════════

$SSH_CMD << 'REMOTE_INSTALL'
set -e

# Install Node.js 20 if not present
if ! command -v node &> /dev/null || [[ "$(node -v)" != v20* && "$(node -v)" != v22* ]]; then
    echo "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

echo "Node.js: $(node -v)"
echo "npm: $(npm -v)"

# Install PM2 globally
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    pm2 startup systemd -u root --hp /root
fi

echo "PM2: $(pm2 -v)"
REMOTE_INSTALL

log "Runtime installed ✅"

# ═══════════════════════════════════════
step "4/6 Installing project dependencies"
# ═══════════════════════════════════════

$SSH_CMD << REMOTE_DEPS
set -e
cd ${DEPLOY_DIR}

# Install only production dependencies
npm install --omit=dev --ignore-scripts 2>/dev/null

echo "Dependencies installed ✅"
REMOTE_DEPS

log "Dependencies ready ✅"

# ═══════════════════════════════════════
step "5/6 Creating PM2 ecosystem config"
# ═══════════════════════════════════════

$SSH_CMD << REMOTE_PM2
set -e
cd ${DEPLOY_DIR}

cat > ecosystem.config.cjs << 'PM2CONFIG'
module.exports = {
  apps: [{
    name: 'veil-bot',
    script: 'bot/index.js',
    cwd: '/opt/veil-bot',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '256M',
    env: {
      NODE_ENV: 'production',
    },
    error_file: '/var/log/veil-bot/error.log',
    out_file: '/var/log/veil-bot/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_restarts: 10,
    restart_delay: 5000,
  }]
};
PM2CONFIG

# Create log directory
mkdir -p /var/log/veil-bot

echo "PM2 config created ✅"
REMOTE_PM2

log "PM2 ecosystem configured ✅"

# ═══════════════════════════════════════
step "6/6 Starting bot with PM2"
# ═══════════════════════════════════════

$SSH_CMD << REMOTE_START
set -e
cd ${DEPLOY_DIR}

# Stop existing if running
pm2 delete veil-bot 2>/dev/null || true

# Start with ecosystem
pm2 start ecosystem.config.cjs

# Save PM2 state (auto-start on reboot)
pm2 save

# Show status
echo ""
pm2 status
echo ""
pm2 logs veil-bot --lines 5 --nostream

echo ""
echo "═══════════════════════════════════════"
echo "  🛡️  VEIL Bot is LIVE!"
echo "═══════════════════════════════════════"
REMOTE_START

echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅  DEPLOYMENT COMPLETE!              ${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""
echo -e "  🤖 Bot: Running on ${SERVER_IP}"
echo -e "  📱 Mini App: https://tvinck.github.io/veil-vpn/"
echo -e "  📊 Monitoring: ssh ${SSH_USER}@${SERVER_IP} -p ${SSH_PORT} 'pm2 monit'"
echo -e "  📜 Logs: ssh ${SSH_USER}@${SERVER_IP} -p ${SSH_PORT} 'pm2 logs veil-bot'"
echo ""
echo -e "  Commands:"
echo -e "    pm2 restart veil-bot    # Restart bot"
echo -e "    pm2 stop veil-bot       # Stop bot"
echo -e "    pm2 logs veil-bot       # View logs"
echo -e "    pm2 monit               # Real-time monitoring"
echo ""
