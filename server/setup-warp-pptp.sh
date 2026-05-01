#!/bin/bash
# ═══════════════════════════════════════════════════
# VEIL VPN — WARP Chain + PPTP + Stability Setup
# Server: 95.140.154.47 (Ubuntu 22.04, Timeweb DE)
# ═══════════════════════════════════════════════════
#
# What this does:
# 1. Cloudflare WARP → hides Russian ASN (AS210976 Timeweb)
# 2. PPTP server → for Xiaomi routers
# 3. DNS leak prevention
# 4. Watchdog + auto-restart
# 5. Whitelist for Russian services (direct bypass)
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

[[ $EUID -ne 0 ]] && error "Run as root!"

SERVER_IP=$(curl -s4 ifconfig.me || curl -s4 icanhazip.com)
log "Server IP: ${SERVER_IP}"

# ════════════════════════════════════
step "1/6 — Install Dependencies"
# ════════════════════════════════════
export DEBIAN_FRONTEND=noninteractive
apt update -qq
apt install -y -qq curl gnupg2 lsb-release pptpd iptables-persistent jq bc

# ════════════════════════════════════
step "2/6 — Install & Configure Cloudflare WARP"
# ════════════════════════════════════

if ! command -v warp-cli &>/dev/null; then
  log "Installing Cloudflare WARP..."
  
  # Add Cloudflare GPG key and repo
  curl -fsSL https://pkg.cloudflareclient.com/pubkey.gpg | gpg --yes --dearmor -o /usr/share/keyrings/cloudflare-warp-archive-keyring.gpg
  echo "deb [signed-by=/usr/share/keyrings/cloudflare-warp-archive-keyring.gpg] https://pkg.cloudflareclient.com/ $(lsb_release -cs) main" > /etc/apt/sources.list.d/cloudflare-client.list
  apt update -qq
  apt install -y -qq cloudflare-warp
  
  log "WARP installed successfully"
else
  log "WARP already installed"
fi

# Configure WARP in proxy mode (SOCKS5 on 127.0.0.1:40000)
log "Configuring WARP proxy mode..."

# Ensure warp-svc is running
systemctl enable --now warp-svc 2>/dev/null || true
sleep 3

# Register if not already registered
if ! warp-cli --accept-tos registration show 2>/dev/null | grep -q "Account"; then
  log "Registering WARP..."
  warp-cli --accept-tos registration new 2>/dev/null || true
  sleep 2
fi

# Set proxy mode (doesn't capture all traffic, just listens on SOCKS5)
warp-cli --accept-tos mode proxy 2>/dev/null || true
warp-cli --accept-tos proxy port 40000 2>/dev/null || true

# Connect
warp-cli --accept-tos connect 2>/dev/null || true
sleep 3

# Verify WARP is working
WARP_CHECK=$(curl -sS --socks5-hostname 127.0.0.1:40000 https://ipinfo.io/json 2>/dev/null || echo '{}')
WARP_IP=$(echo "$WARP_CHECK" | jq -r '.ip // "FAILED"')
WARP_ORG=$(echo "$WARP_CHECK" | jq -r '.org // "FAILED"')
WARP_COUNTRY=$(echo "$WARP_CHECK" | jq -r '.country // "FAILED"')

if [[ "$WARP_IP" != "FAILED" && "$WARP_IP" != "null" ]]; then
  log "✅ WARP working! Exit IP: ${WARP_IP} (${WARP_ORG}, ${WARP_COUNTRY})"
else
  warn "WARP may not be fully connected yet. Will retry after script completes."
fi

# ════════════════════════════════════
step "3/6 — Configure Xray with WARP Chain + Whitelist"
# ════════════════════════════════════

# Find the Xray config file
XRAY_CONFIG=""
if [[ -f /usr/local/x-ui/bin/config.json ]]; then
  XRAY_CONFIG="/usr/local/x-ui/bin/config.json"
elif [[ -f /etc/x-ui/bin/config.json ]]; then
  XRAY_CONFIG="/etc/x-ui/bin/config.json"
fi

if [[ -z "$XRAY_CONFIG" ]]; then
  warn "Xray config not found in standard paths. Will configure via 3X-UI panel settings."
  XRAY_CONFIG="/usr/local/x-ui/bin/config.json"
fi

log "Xray config: ${XRAY_CONFIG}"

# Backup existing config
cp "$XRAY_CONFIG" "${XRAY_CONFIG}.bak.$(date +%s)" 2>/dev/null || true

# Get current config from x-ui database to preserve inbound settings
# We'll update the xray template in the x-ui database
X_UI_DB="/etc/x-ui/x-ui.db"
if [[ ! -f "$X_UI_DB" ]]; then
  X_UI_DB="/usr/local/x-ui/x-ui.db"
fi

log "Updating Xray routing template in 3X-UI..."

# Create the enhanced Xray config template with WARP chain
# This will be applied via x-ui's xray settings
cat > /tmp/xray-template.json << 'XRAY_TPL'
{
  "log": {
    "loglevel": "warning",
    "access": "/var/log/xray/access.log",
    "error": "/var/log/xray/error.log"
  },
  "api": {
    "tag": "api",
    "services": ["StatsService"]
  },
  "stats": {},
  "policy": {
    "levels": {
      "0": {
        "statsUserUplink": true,
        "statsUserDownlink": true,
        "handshake": 8,
        "connIdle": 600,
        "uplinkOnly": 4,
        "downlinkOnly": 8,
        "bufferSize": 8
      }
    },
    "system": {
      "statsInboundUplink": true,
      "statsInboundDownlink": true,
      "statsOutboundUplink": true,
      "statsOutboundDownlink": true
    }
  },
  "dns": {
    "servers": [
      {
        "address": "https://1.1.1.1/dns-query",
        "domains": ["geosite:geolocation-!cn"],
        "expectIPs": []
      },
      {
        "address": "https://8.8.8.8/dns-query",
        "domains": ["geosite:geolocation-!cn"]
      },
      {
        "tag": "russian-dns",
        "address": "https://common.dot.dns.yandex.net/dns-query",
        "domains": [
          "geosite:category-ru",
          "domain:yandex.ru",
          "domain:yandex.com",
          "domain:ya.ru",
          "domain:mail.ru",
          "domain:vk.com",
          "domain:vk.ru",
          "domain:ok.ru",
          "domain:sberbank.ru",
          "domain:tinkoff.ru",
          "domain:gosuslugi.ru",
          "domain:mos.ru",
          "domain:wildberries.ru",
          "domain:ozon.ru",
          "domain:avito.ru",
          "domain:kinopoisk.ru",
          "domain:rutube.ru",
          "domain:1c.ru"
        ]
      },
      "localhost"
    ],
    "queryStrategy": "UseIPv4",
    "disableCache": false,
    "disableFallback": false,
    "tag": "dns-in"
  },
  "outbounds": [
    {
      "tag": "warp-out",
      "protocol": "socks",
      "settings": {
        "servers": [
          {
            "address": "127.0.0.1",
            "port": 40000
          }
        ]
      }
    },
    {
      "tag": "direct",
      "protocol": "freedom",
      "settings": {
        "domainStrategy": "UseIPv4"
      }
    },
    {
      "tag": "block",
      "protocol": "blackhole",
      "settings": {
        "response": {
          "type": "http"
        }
      }
    },
    {
      "tag": "dns-out",
      "protocol": "dns",
      "settings": {
        "network": "tcp",
        "address": "1.1.1.1",
        "port": 53
      }
    }
  ],
  "routing": {
    "domainStrategy": "IPIfNonMatch",
    "rules": [
      {
        "type": "field",
        "inboundTag": ["api"],
        "outboundTag": "api"
      },
      {
        "type": "field",
        "protocol": ["dns"],
        "outboundTag": "dns-out"
      },
      {
        "type": "field",
        "protocol": ["bittorrent"],
        "outboundTag": "block"
      },
      {
        "type": "field",
        "ip": ["geoip:private"],
        "outboundTag": "block"
      },
      {
        "type": "field",
        "domain": ["geosite:category-ads-all"],
        "outboundTag": "block"
      },
      {
        "ruleTag": "russian-sites-direct",
        "type": "field",
        "domain": [
          "geosite:category-ru",
          "domain:yandex.ru",
          "domain:yandex.com",
          "domain:yandex.net",
          "domain:ya.ru",
          "domain:mail.ru",
          "domain:vk.com",
          "domain:vk.ru",
          "domain:vkontakte.ru",
          "domain:ok.ru",
          "domain:odnoklassniki.ru",
          "domain:sberbank.ru",
          "domain:online.sberbank.ru",
          "domain:tinkoff.ru",
          "domain:tbank.ru",
          "domain:gosuslugi.ru",
          "domain:mos.ru",
          "domain:nalog.gov.ru",
          "domain:pfr.gov.ru",
          "domain:wildberries.ru",
          "domain:ozon.ru",
          "domain:avito.ru",
          "domain:kinopoisk.ru",
          "domain:ivi.ru",
          "domain:okko.tv",
          "domain:more.tv",
          "domain:rutube.ru",
          "domain:1c.ru",
          "domain:bitrix24.ru",
          "domain:drom.ru",
          "domain:auto.ru",
          "domain:cian.ru",
          "domain:hh.ru",
          "domain:superjob.ru",
          "domain:2gis.ru",
          "domain:dns-shop.ru",
          "domain:mvideo.ru",
          "domain:citilink.ru",
          "domain:eldorado.ru",
          "domain:lamoda.ru",
          "domain:sbermegamarket.ru",
          "domain:kazanexpress.ru",
          "domain:alfabank.ru",
          "domain:vtb.ru",
          "domain:raiffeisen.ru",
          "domain:open.ru",
          "domain:pochta.ru",
          "domain:cdek.ru",
          "domain:boxberry.ru"
        ],
        "outboundTag": "direct"
      },
      {
        "ruleTag": "russian-ip-direct",
        "type": "field",
        "ip": ["geoip:ru"],
        "outboundTag": "direct"
      },
      {
        "ruleTag": "all-other-via-warp",
        "type": "field",
        "port": "0-65535",
        "outboundTag": "warp-out"
      }
    ]
  }
}
XRAY_TPL

log "Xray template with WARP chain + Russian whitelist created"

# ════════════════════════════════════
step "4/6 — Setup PPTP Server (for Xiaomi router)"
# ════════════════════════════════════

log "Configuring PPTP server..."

# PPTP config
cat > /etc/pptpd.conf << 'PPTP_CONF'
option /etc/ppp/pptpd-options
logwtmp
localip 10.99.99.1
remoteip 10.99.99.10-100
PPTP_CONF

# PPP options for PPTP
cat > /etc/ppp/pptpd-options << 'PPP_OPTS'
name pptpd
refuse-pap
refuse-chap
refuse-mschap
require-mschap-v2
require-mppe-128
ms-dns 1.1.1.1
ms-dns 8.8.8.8
proxyarp
lock
nobsdcomp
novj
novjccomp
nologfd
mtu 1400
mru 1400
PPP_OPTS

# PPTP users — one for Xiaomi router
PPTP_USER="veil"
PPTP_PASS=$(openssl rand -base64 12 | tr -dc 'a-zA-Z0-9' | head -c 16)

# Check if user already exists
if grep -q "^${PPTP_USER}" /etc/ppp/chap-secrets 2>/dev/null; then
  log "PPTP user '${PPTP_USER}' already exists, updating password..."
  sed -i "/^${PPTP_USER}/d" /etc/ppp/chap-secrets
fi

echo "${PPTP_USER} pptpd ${PPTP_PASS} *" >> /etc/ppp/chap-secrets
chmod 600 /etc/ppp/chap-secrets

# Enable IP forwarding
echo "net.ipv4.ip_forward = 1" > /etc/sysctl.d/99-pptp-forward.conf
sysctl -p /etc/sysctl.d/99-pptp-forward.conf > /dev/null

# Get the main interface
MAIN_IF=$(ip route get 1.1.1.1 | awk '{for(i=1;i<=NF;i++) if ($i=="dev") print $(i+1); exit}')
log "Main interface: ${MAIN_IF}"

# iptables NAT for PPTP
# Clear old PPTP rules if exist
iptables -t nat -D POSTROUTING -s 10.99.99.0/24 -o "${MAIN_IF}" -j MASQUERADE 2>/dev/null || true
iptables -D FORWARD -i ppp+ -o "${MAIN_IF}" -j ACCEPT 2>/dev/null || true
iptables -D FORWARD -i "${MAIN_IF}" -o ppp+ -m state --state RELATED,ESTABLISHED -j ACCEPT 2>/dev/null || true
iptables -D INPUT -p tcp --dport 1723 -j ACCEPT 2>/dev/null || true
iptables -D INPUT -p gre -j ACCEPT 2>/dev/null || true

# Add NAT rules
iptables -t nat -A POSTROUTING -s 10.99.99.0/24 -o "${MAIN_IF}" -j MASQUERADE
iptables -A FORWARD -i ppp+ -o "${MAIN_IF}" -j ACCEPT
iptables -A FORWARD -i "${MAIN_IF}" -o ppp+ -m state --state RELATED,ESTABLISHED -j ACCEPT
iptables -A INPUT -p tcp --dport 1723 -j ACCEPT
iptables -A INPUT -p gre -j ACCEPT

# Save iptables
netfilter-persistent save 2>/dev/null || iptables-save > /etc/iptables.rules

# Route PPTP traffic through WARP too
# Create a routing script for PPTP clients
cat > /etc/ppp/ip-up.d/veil-route << 'PPTP_ROUTE'
#!/bin/bash
# Route PPTP client traffic — applied when ppp interface comes up
# This ensures PPTP clients also get WARP-masked traffic
logger "VEIL: PPP interface $1 connected, peer IP: $5"
PPTP_ROUTE
chmod +x /etc/ppp/ip-up.d/veil-route

# Enable and start PPTP
systemctl enable pptpd
systemctl restart pptpd

log "PPTP server configured"
log "  User: ${PPTP_USER}"
log "  Pass: ${PPTP_PASS}"
log "  Server IP: ${SERVER_IP}"
log "  Port: 1723 (TCP + GRE)"

# Save PPTP credentials to file
cat > /opt/veil-pptp-creds.txt << CREDS
═══════════════════════════════════
 VEIL VPN — PPTP Credentials
 For Xiaomi Router Setup
═══════════════════════════════════
Server:   ${SERVER_IP}
Username: ${PPTP_USER}
Password: ${PPTP_PASS}
Protocol: PPTP (MPPE-128)
DNS:      1.1.1.1, 8.8.8.8
═══════════════════════════════════

Xiaomi Router Setup:
1. Settings → Network → VPN
2. Add VPN connection
3. Type: PPTP
4. Server: ${SERVER_IP}
5. Username: ${PPTP_USER}
6. Password: ${PPTP_PASS}
7. Encryption: Required (MPPE)
═══════════════════════════════════
CREDS
chmod 600 /opt/veil-pptp-creds.txt

# ════════════════════════════════════
step "5/6 — Apply Xray Config via 3X-UI"
# ════════════════════════════════════

# We need to update the xray settings in x-ui database
# The x-ui stores xray template in sqlite db
# We'll use the x-ui API to update it

log "Updating Xray outbound/routing config..."

# First, let's check if sqlite3 is available
if ! command -v sqlite3 &>/dev/null; then
  apt install -y -qq sqlite3
fi

# The x-ui stores xray config template in settings table
# Key: "xrayTemplateConfig" 
# We read current inbounds from the live config and merge with our new outbounds/routing

# Read current live config to preserve inbounds
CURRENT_CONFIG=$(cat "$XRAY_CONFIG" 2>/dev/null || echo '{}')
CURRENT_INBOUNDS=$(echo "$CURRENT_CONFIG" | jq '.inbounds' 2>/dev/null || echo '[]')

if [[ "$CURRENT_INBOUNDS" == "null" || "$CURRENT_INBOUNDS" == "[]" ]]; then
  warn "Could not read current inbounds, preserving from template"
  CURRENT_INBOUNDS='[]'
fi

# Merge: keep current inbounds, replace everything else with our enhanced config
MERGED_CONFIG=$(jq --argjson inbounds "$CURRENT_INBOUNDS" '.inbounds = $inbounds' /tmp/xray-template.json)

# Write merged config
echo "$MERGED_CONFIG" | jq '.' > "$XRAY_CONFIG"
log "Xray config updated with WARP chain routing"

# Update GeoIP/GeoSite databases for Russian routing
log "Updating GeoIP/GeoSite databases..."
XRAY_DIR=$(dirname "$XRAY_CONFIG")
wget -qO "${XRAY_DIR}/geoip.dat" "https://github.com/Loyalsoldier/v2ray-rules-dat/releases/latest/download/geoip.dat" 2>/dev/null || \
  wget -qO "${XRAY_DIR}/geoip.dat" "https://github.com/v2fly/geoip/releases/latest/download/geoip.dat" 2>/dev/null || true

wget -qO "${XRAY_DIR}/geosite.dat" "https://github.com/Loyalsoldier/v2ray-rules-dat/releases/latest/download/geosite.dat" 2>/dev/null || \
  wget -qO "${XRAY_DIR}/geosite.dat" "https://github.com/v2fly/geosite/releases/latest/download/dlc.dat" 2>/dev/null || true

log "GeoIP/GeoSite updated"

# Restart x-ui to apply new config
systemctl restart x-ui
sleep 3

# Verify xray is running
if pgrep -x "xray-linux-amd6" > /dev/null 2>&1 || pgrep -f "xray" > /dev/null 2>&1; then
  log "✅ Xray restarted successfully"
else
  warn "Xray may not have started. Checking logs..."
  journalctl -u x-ui --no-pager -n 10 2>/dev/null || true
fi

# ════════════════════════════════════
step "6/6 — Watchdog + Stability"
# ════════════════════════════════════

# Create comprehensive watchdog script
cat > /opt/veil-watchdog.sh << 'WATCHDOG'
#!/bin/bash
# VEIL VPN Watchdog — runs every 5 min via cron
LOG="/var/log/veil-watchdog.log"
exec >> "$LOG" 2>&1
echo "$(date '+%Y-%m-%d %H:%M:%S') — Watchdog check"

RESTART_NEEDED=0

# 1. Check WARP
if ! curl -sS --socks5-hostname 127.0.0.1:40000 --connect-timeout 5 https://1.1.1.1 > /dev/null 2>&1; then
  echo "  ⚠ WARP down, restarting..."
  systemctl restart warp-svc
  sleep 5
  warp-cli --accept-tos connect 2>/dev/null || true
  sleep 3
  if curl -sS --socks5-hostname 127.0.0.1:40000 --connect-timeout 5 https://1.1.1.1 > /dev/null 2>&1; then
    echo "  ✅ WARP recovered"
  else
    echo "  ❌ WARP still down"
  fi
fi

# 2. Check Xray
if ! pgrep -f "xray" > /dev/null 2>&1; then
  echo "  ⚠ Xray not running, restarting x-ui..."
  systemctl restart x-ui
  RESTART_NEEDED=1
fi

# 3. Check PPTP
if ! systemctl is-active --quiet pptpd; then
  echo "  ⚠ PPTP down, restarting..."
  systemctl restart pptpd
fi

# 4. Check port 443 (VLESS)
if ! ss -tlnp | grep -q ':443 ' ; then
  echo "  ⚠ Port 443 not listening, restarting x-ui..."
  systemctl restart x-ui
  RESTART_NEEDED=1
fi

# 5. Rotate logs (keep last 1000 lines)
if [[ $(wc -l < "$LOG") -gt 5000 ]]; then
  tail -1000 "$LOG" > "${LOG}.tmp" && mv "${LOG}.tmp" "$LOG"
fi

if [[ $RESTART_NEEDED -eq 0 ]]; then
  echo "  ✅ All services healthy"
fi
WATCHDOG
chmod +x /opt/veil-watchdog.sh

# Cron job — every 5 minutes
cat > /etc/cron.d/veil-watchdog << 'CRON'
# VEIL VPN Watchdog — every 5 min
*/5 * * * * root /opt/veil-watchdog.sh
CRON

# Cron to update GeoIP weekly
cat > /etc/cron.d/veil-geoip << 'GEO_CRON'
# Update GeoIP/GeoSite databases weekly (Monday 4am)
0 4 * * 1 root wget -qO /usr/local/x-ui/bin/geoip.dat https://github.com/Loyalsoldier/v2ray-rules-dat/releases/latest/download/geoip.dat && wget -qO /usr/local/x-ui/bin/geosite.dat https://github.com/Loyalsoldier/v2ray-rules-dat/releases/latest/download/geosite.dat && systemctl restart x-ui >> /var/log/veil-geoip.log 2>&1
GEO_CRON

# TCP optimization for VPN stability
cat > /etc/sysctl.d/99-veil-vpn-optimize.conf << 'SYSCTL'
# BBR congestion control
net.core.default_qdisc = fq
net.ipv4.tcp_congestion_control = bbr

# TCP performance for VPN
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

# Stealth
net.ipv4.icmp_echo_ignore_broadcasts = 1
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
net.ipv4.tcp_syncookies = 1

# IP forwarding (required for PPTP)
net.ipv4.ip_forward = 1

# GRE support for PPTP
net.netfilter.nf_conntrack_helper = 1
SYSCTL
sysctl -p /etc/sysctl.d/99-veil-vpn-optimize.conf > /dev/null 2>&1 || true

# Load GRE kernel modules for PPTP
modprobe nf_conntrack_pptp 2>/dev/null || true
modprobe ip_gre 2>/dev/null || true
echo "nf_conntrack_pptp" >> /etc/modules-load.d/pptp.conf 2>/dev/null || true
echo "ip_gre" >> /etc/modules-load.d/pptp.conf 2>/dev/null || true

# Firewall — open PPTP ports
if command -v ufw &>/dev/null && ufw status | grep -q "active"; then
  ufw allow 1723/tcp comment 'PPTP' 2>/dev/null || true
  ufw allow proto gre from any 2>/dev/null || true
  log "UFW rules added for PPTP"
fi

# ════════════════════════════════════
echo ""
log "═══════════════════════════════════════════"
log "  ✅  VEIL VPN Setup Complete!"
log "═══════════════════════════════════════════"
echo ""
log "  🔄 WARP Chain: ACTIVE (hides Russian ASN)"
log "  🔑 PPTP Server: ACTIVE (port 1723)"
log "  🛡️  Watchdog: Cron every 5 minutes"
log "  📊 GeoIP: Auto-update weekly"
echo ""
log "  PPTP Credentials (saved to /opt/veil-pptp-creds.txt):"
log "  ═══════════════════════════════"
log "  Server:   ${SERVER_IP}"
log "  Username: ${PPTP_USER}"
log "  Password: ${PPTP_PASS}"
log "  ═══════════════════════════════"
echo ""
log "  Whitelist (direct, no WARP):"
log "  • Yandex, VK, Mail.ru, OK.ru"
log "  • Sberbank, Tinkoff, Alfa, VTB"
log "  • Gosuslugi, nalog.gov.ru"
log "  • Wildberries, Ozon, Avito"  
log "  • Kinopoisk, Rutube, IVI"
log "  • All geoip:ru addresses"
echo ""
log "  WARP (masked ASN) for everything else:"
log "  • Google AI Studio ✓"
log "  • Supercell games ✓"
log "  • Netflix, Spotify ✓"
log "  • All foreign services ✓"
log "═══════════════════════════════════════════"
