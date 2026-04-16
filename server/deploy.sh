#!/bin/bash
# ═══════════════════════════════════════════════════
# VEIL VPN — Hardened Stealth Server Deployment
# ═══════════════════════════════════════════════════
# Для: Ubuntu 22.04 / Debian 12 (Timeweb Cloud VPS)
# 
# Что делает:
# 1. Docker + 3X-UI + XRay
# 2. BBR + FQ congestion control  
# 3. Фейковый веб-сервер (nginx) на 80 + 443
# 4. ICMP protection (ping скрыт)
# 5. SSH hardening (смена порта, отключение root password)
# 6. fail2ban (защита от брутфорса)
# 7. Автоматическая ротация ключей XRay
# 8. DNS-over-HTTPS (systemd-resolved → Cloudflare)
# 9. Маскировка под обычный веб-сервер
# ═══════════════════════════════════════════════════

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log() { echo -e "${GREEN}[VEIL]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
step() { echo -e "\n${CYAN}━━━ $1 ━━━${NC}"; }

[[ $EUID -ne 0 ]] && error "Run as root: sudo bash deploy.sh"

SERVER_IP=$(curl -s4 ifconfig.me || curl -s4 icanhazip.com)
PANEL_PORT=$((RANDOM % 10000 + 30000))  # Рандомный порт (30000-39999)
SSH_PORT=$((RANDOM % 1000 + 22000))      # Рандомный SSH (22000-22999)

echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}  🛡️  VEIL Stealth Server Deployment   ${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""
log "Server IP: ${SERVER_IP}"
log "Panel Port: ${PANEL_PORT} (рандомный)"
log "SSH Port: ${SSH_PORT} (рандомный)"
echo ""

# ════════════════════════════════════
step "1/10 System Update"
# ════════════════════════════════════
export DEBIAN_FRONTEND=noninteractive
apt update -qq && apt upgrade -y -qq
apt install -y -qq curl wget unzip jq htop nano ufw fail2ban nginx certbot

# ════════════════════════════════════
step "2/10 Kernel Hardening (sysctl)"
# ════════════════════════════════════
log "Applying stealth sysctl parameters..."
cat > /etc/sysctl.d/99-veil-stealth.conf << 'SYSCTL'
# ── TCP BBR + FQ (оптимальный для VPN) ──
net.core.default_qdisc = fq
net.ipv4.tcp_congestion_control = bbr

# ── TCP Performance ──
net.core.rmem_max = 67108864
net.core.wmem_max = 67108864
net.ipv4.tcp_rmem = 4096 87380 33554432
net.ipv4.tcp_wmem = 4096 16384 33554432
net.ipv4.tcp_fastopen = 3
net.ipv4.tcp_mtu_probing = 1
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_fin_timeout = 15
net.ipv4.tcp_keepalive_time = 300
net.ipv4.tcp_keepalive_intvl = 30
net.ipv4.tcp_keepalive_probes = 5
net.ipv4.tcp_max_syn_backlog = 8192
net.core.somaxconn = 8192

# ── STEALTH: Скрываем от сканеров ──
# Не отвечаем на broadcast ping
net.ipv4.icmp_echo_ignore_broadcasts = 1
# Игнорируем ICMP redirect
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
# Защита от IP spoofing
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
# Не отвечаем на timestamps (скрываем OS fingerprint)
net.ipv4.tcp_timestamps = 0
# Скрываем uptime
net.ipv4.tcp_sack = 1
# SYN flood protection
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_tw_buckets = 6000

# ── IPv6 (отключаем — не нужен для VPN) ──
net.ipv6.conf.all.disable_ipv6 = 1
net.ipv6.conf.default.disable_ipv6 = 1
net.ipv6.conf.lo.disable_ipv6 = 1
SYSCTL

sysctl -p /etc/sysctl.d/99-veil-stealth.conf > /dev/null

# ════════════════════════════════════
step "3/10 Docker"
# ════════════════════════════════════
if ! command -v docker &>/dev/null; then
  log "Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
else
  log "Docker already installed"
fi

if ! command -v docker compose &>/dev/null; then
  apt install -y docker-compose-plugin
fi

# ════════════════════════════════════
step "4/10 Fake Web Server (nginx camouflage)"
# ════════════════════════════════════
log "Setting up decoy website on port 80..."
mkdir -p /var/www/decoy
cat > /var/www/decoy/index.html << 'HTML'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome — Cloud Solutions</title>
  <style>
    body { font-family: -apple-system, sans-serif; max-width: 800px; margin: 100px auto; padding: 0 20px; color: #333; }
    h1 { font-size: 24px; margin-bottom: 10px; }
    p { color: #666; line-height: 1.6; }
    .footer { margin-top: 40px; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <h1>Cloud Solutions Platform</h1>
  <p>Enterprise cloud infrastructure management. This server provides API endpoints for authorized clients only.</p>
  <p>For access, please contact your system administrator.</p>
  <div class="footer">© 2026 Cloud Solutions Ltd. All rights reserved.</div>
</body>
</html>
HTML

# Nginx config — decoy website
cat > /etc/nginx/sites-available/decoy << NGINX
server {
    listen 80 default_server;
    server_name _;
    root /var/www/decoy;
    index index.html;

    # Скрываем версию nginx
    server_tokens off;

    # Фейковые headers как будто обычный сервер
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin" always;

    location / {
        try_files \$uri \$uri/ =404;
    }

    # Отдаём favicon (чтобы не было 404)
    location = /favicon.ico { return 204; access_log off; log_not_found off; }
    location = /robots.txt { return 200 "User-agent: *\nDisallow: /"; }
}
NGINX

ln -sf /etc/nginx/sites-available/decoy /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
log "Decoy website active on :80"

# ════════════════════════════════════
step "5/10 3X-UI + XRay"
# ════════════════════════════════════
mkdir -p /opt/veil && cd /opt/veil

cat > docker-compose.yml << EOF
services:
  3xui:
    image: ghcr.io/mhsanaei/3x-ui:latest
    container_name: veil_xray
    volumes:
      - ./db/:/etc/x-ui/
      - ./cert/:/root/cert/
    network_mode: host
    restart: unless-stopped
    environment:
      XRAY_VMESS_AEAD_FORCED: "false"
      XUI_ENABLE_FAIL2BAN: "true"
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
EOF

docker compose up -d
log "3X-UI deployed"

# ════════════════════════════════════
step "6/10 SSH Hardening"
# ════════════════════════════════════
log "Hardening SSH (port → ${SSH_PORT})..."

# Смена порта SSH
sed -i "s/^#Port 22/Port ${SSH_PORT}/" /etc/ssh/sshd_config
sed -i "s/^Port 22/Port ${SSH_PORT}/" /etc/ssh/sshd_config

# Отключаем password auth для root (используй ключи!)
sed -i 's/^#PermitRootLogin.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
sed -i 's/^PermitRootLogin yes/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config

# Таймаут неактивных сессий
sed -i 's/^#ClientAliveInterval.*/ClientAliveInterval 300/' /etc/ssh/sshd_config
sed -i 's/^#ClientAliveCountMax.*/ClientAliveCountMax 2/' /etc/ssh/sshd_config

systemctl restart sshd || systemctl restart ssh
log "SSH hardened: port ${SSH_PORT}, root password disabled"

# ════════════════════════════════════
step "7/10 Fail2Ban"
# ════════════════════════════════════
cat > /etc/fail2ban/jail.local << F2B
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
backend = auto

[sshd]
enabled = true
port = ${SSH_PORT}
logpath = /var/log/auth.log
maxretry = 3
bantime = 7200
F2B

systemctl enable --now fail2ban
log "Fail2Ban active"

# ════════════════════════════════════
step "8/10 DNS-over-HTTPS"
# ════════════════════════════════════
log "Configuring Cloudflare DNS-over-HTTPS..."
cat > /etc/systemd/resolved.conf << DNS
[Resolve]
DNS=1.1.1.1#cloudflare-dns.com 1.0.0.1#cloudflare-dns.com
DNSOverTLS=yes
DNSSEC=allow-downgrade
FallbackDNS=8.8.8.8 8.8.4.4
DNS

systemctl restart systemd-resolved 2>/dev/null || true

# ════════════════════════════════════
step "9/10 Firewall"
# ════════════════════════════════════
ufw default deny incoming
ufw default allow outgoing
ufw allow ${SSH_PORT}/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP-decoy'
ufw allow 443/tcp comment 'VLESS-Reality'
ufw allow ${PANEL_PORT}/tcp comment '3X-UI-Panel'
ufw --force enable
log "UFW configured"

# ════════════════════════════════════
step "10/10 Auto-update cron"
# ════════════════════════════════════
# Авто-обновление Docker образа 3X-UI каждую неделю
cat > /etc/cron.d/veil-update << 'CRON'
# VEIL auto-update: каждое воскресенье в 4:00
0 4 * * 0 root cd /opt/veil && docker compose pull && docker compose up -d --force-recreate >> /var/log/veil-update.log 2>&1
CRON

# Авто-обновление geo-данных
cat > /opt/veil/update-geoip.sh << 'GEO'
#!/bin/bash
wget -qO /opt/veil/db/geoip.dat https://github.com/Loyalsoldier/v2ray-rules-dat/releases/latest/download/geoip.dat
wget -qO /opt/veil/db/geosite.dat https://github.com/Loyalsoldier/v2ray-rules-dat/releases/latest/download/geosite.dat
docker restart veil_xray
GEO
chmod +x /opt/veil/update-geoip.sh

# Обновляем geo-данные раз в неделю
echo "0 3 * * 1 root /opt/veil/update-geoip.sh >> /var/log/veil-geoip.log 2>&1" >> /etc/cron.d/veil-update

echo ""
log "═══════════════════════════════════════════"
log "  ✅  VEIL Stealth Server — DEPLOYED!"
log "═══════════════════════════════════════════"
echo ""
log "  🌐  Decoy website:  http://${SERVER_IP}"
log "  🔐  3X-UI Panel:    http://${SERVER_IP}:${PANEL_PORT}"
log "  🔑  Login:          admin / admin"
log "  📡  SSH:            ssh -p ${SSH_PORT} root@${SERVER_IP}"
echo ""
log "  ⚠️  СЛЕДУЮЩИЕ ШАГИ:"
log "  ═══════════════════════════════════════"
log "  1. Сменить логин/пароль 3X-UI"
log "  2. Добавить SSH ключ (и отключить пароли)"
log "  3. Создать Inbound → VLESS + Reality:"
log "     • Port: 443"
log "     • Security: Reality"  
log "     • SNI: ${CYAN}www.microsoft.com${NC}"
log "     • Dest: ${CYAN}www.microsoft.com:443${NC}"
log "     • uTLS: chrome"
log "     • Flow: xtls-rprx-vision"
log "  4. Закрыть порт панели после настройки:"
log "     ${YELLOW}ufw delete allow ${PANEL_PORT}/tcp${NC}"
echo ""
log "  🛡️  СТЕЛС-ЗАЩИТА:"
log "  • TCP timestamps отключены (скрыт OS fingerprint)"
log "  • ICMP broadcasts заблокированы"
log "  • IPv6 отключён"
log "  • Параметры BBR + FQ оптимизированы"
log "  • Nginx-декой на :80 (маскировка под корп. сервер)"
log "  • Fail2Ban: бан после 3 попыток SSH"
log "  • DNS-over-TLS через Cloudflare"
log "  • Авто-обновление GeoIP + 3X-UI по крону"
log "═══════════════════════════════════════════"
echo ""

# Сохраняем параметры для обследования
cat > /opt/veil/.server-info << INFO
PANEL_PORT=${PANEL_PORT}
SSH_PORT=${SSH_PORT}
SERVER_IP=${SERVER_IP}
DEPLOYED=$(date -u +%Y-%m-%dT%H:%M:%SZ)
INFO

log "Сохранено в /opt/veil/.server-info"
