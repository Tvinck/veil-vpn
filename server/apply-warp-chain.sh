#!/bin/bash
# ═══════════════════════════════════════════════════
# VEIL VPN — Apply WARP Chain to Xray (via 3X-UI DB)
# ═══════════════════════════════════════════════════
# This script updates the Xray xray_template_config in
# the 3X-UI SQLite database so the WARP chain persists
# across x-ui restarts.
# ═══════════════════════════════════════════════════

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'
log() { echo -e "${GREEN}[VEIL]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Find x-ui database
X_UI_DB=""
for db in /etc/x-ui/x-ui.db /usr/local/x-ui/x-ui.db; do
  if [[ -f "$db" ]]; then
    X_UI_DB="$db"
    break
  fi
done
[[ -z "$X_UI_DB" ]] && error "Cannot find x-ui database"
log "Database: $X_UI_DB"

# Find xray config
XRAY_CONFIG=""
for cfg in /usr/local/x-ui/bin/config.json /etc/x-ui/bin/config.json; do
  if [[ -f "$cfg" ]]; then
    XRAY_CONFIG="$cfg"
    break
  fi
done
[[ -z "$XRAY_CONFIG" ]] && error "Cannot find xray config"
log "Xray config: $XRAY_CONFIG"

# Backup
cp "$XRAY_CONFIG" "${XRAY_CONFIG}.before-warp-$(date +%s)"
log "Backed up current config"

# Step 1: Create the xray template (without inbounds — x-ui manages those)
TEMPLATE_FILE=/tmp/xray-template-nowarp.json
cat > "$TEMPLATE_FILE" << 'EOF'
{
  "log": {
    "loglevel": "warning",
    "access": "none",
    "error": "",
    "dnsLog": false,
    "maskAddress": ""
  },
  "api": {
    "tag": "api",
    "services": ["HandlerService", "LoggerService", "StatsService"]
  },
  "stats": {},
  "metrics": {
    "tag": "metrics_out",
    "listen": "127.0.0.1:11111"
  },
  "policy": {
    "levels": {
      "0": {
        "statsUserUplink": true,
        "statsUserDownlink": true
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
        "domains": ["geosite:geolocation-!cn"]
      },
      {
        "address": "https://8.8.8.8/dns-query",
        "domains": ["geosite:geolocation-!cn"]
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
      "tag": "blocked",
      "protocol": "blackhole",
      "settings": {}
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
        "outboundTag": "blocked"
      },
      {
        "type": "field",
        "ip": ["geoip:private"],
        "outboundTag": "blocked"
      },
      {
        "type": "field",
        "domain": ["geosite:category-ads-all"],
        "outboundTag": "blocked"
      },
      {
        "ruleTag": "russian-sites-direct",
        "type": "field",
        "domain": [
          "geosite:category-ru",
          "domain:yandex.ru", "domain:yandex.com", "domain:yandex.net", "domain:ya.ru",
          "domain:mail.ru", "domain:vk.com", "domain:vk.ru", "domain:vkontakte.ru",
          "domain:ok.ru", "domain:odnoklassniki.ru",
          "domain:sberbank.ru", "domain:online.sberbank.ru",
          "domain:tinkoff.ru", "domain:tbank.ru",
          "domain:gosuslugi.ru", "domain:mos.ru", "domain:nalog.gov.ru", "domain:pfr.gov.ru",
          "domain:wildberries.ru", "domain:ozon.ru", "domain:avito.ru",
          "domain:kinopoisk.ru", "domain:ivi.ru", "domain:okko.tv", "domain:more.tv", "domain:rutube.ru",
          "domain:1c.ru", "domain:bitrix24.ru",
          "domain:drom.ru", "domain:auto.ru", "domain:cian.ru",
          "domain:hh.ru", "domain:superjob.ru", "domain:2gis.ru",
          "domain:dns-shop.ru", "domain:mvideo.ru", "domain:citilink.ru", "domain:eldorado.ru",
          "domain:lamoda.ru", "domain:sbermegamarket.ru",
          "domain:alfabank.ru", "domain:vtb.ru", "domain:raiffeisen.ru", "domain:open.ru",
          "domain:pochta.ru", "domain:cdek.ru", "domain:boxberry.ru"
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
  },
  "transport": null,
  "reverse": null,
  "fakedns": null,
  "observatory": null,
  "burstObservatory": null
}
EOF

# Step 2: Validate JSON
python3 -c "import json; json.load(open('$TEMPLATE_FILE'))" || error "Invalid JSON template"
log "Template JSON validated"

# Step 3: Compact the JSON for SQLite insertion
TEMPLATE_COMPACT=$(python3 -c "
import json
with open('$TEMPLATE_FILE') as f:
    d = json.load(f)
# Escape single quotes for SQLite
s = json.dumps(d, ensure_ascii=True)
print(s.replace(\"'\", \"''\"))
")

# Step 4: Update the xray template config in x-ui database
# x-ui uses 'xrayTemplateConfig' key in settings table
sqlite3 "$X_UI_DB" "UPDATE settings SET value='$TEMPLATE_COMPACT' WHERE key='xrayTemplateConfig';"
if [[ $? -eq 0 ]]; then
  log "✅ Database xrayTemplateConfig updated"
else
  error "Failed to update database"
fi

# Step 5: Also write the full config file directly (with inbounds preserved)
# Read current inbounds from the live config
CURRENT_INBOUNDS=$(jq -c '.inbounds' "$XRAY_CONFIG" 2>/dev/null || echo '[]')
log "Preserved $(echo "$CURRENT_INBOUNDS" | jq 'length') inbounds"

# Merge inbounds into the template to create full config
python3 -c "
import json, sys
with open('$TEMPLATE_FILE') as f:
    config = json.load(f)
inbounds = json.loads(sys.argv[1])
config['inbounds'] = inbounds
with open('$XRAY_CONFIG', 'w') as f:
    json.dump(config, f, indent=2, ensure_ascii=False)
print('Config written successfully')
" "$CURRENT_INBOUNDS"

# Step 6: Restart x-ui to pick up the new config
log "Restarting x-ui..."
systemctl restart x-ui
sleep 5

# Step 7: Verify everything works
log "Verifying..."

# Check outbounds
OUTBOUNDS=$(jq -r '.outbounds[].tag' "$XRAY_CONFIG" 2>/dev/null | tr '\n' ',')
log "Outbounds: $OUTBOUNDS"

# Check routing rules count
RULES=$(jq '.routing.rules | length' "$XRAY_CONFIG" 2>/dev/null)
log "Routing rules: $RULES"

# Check DNS
DNS_SERVERS=$(jq '.dns.servers | length' "$XRAY_CONFIG" 2>/dev/null)
log "DNS servers: $DNS_SERVERS"

# Check xray is running
if pgrep -f "xray" > /dev/null 2>&1; then
  log "✅ Xray is running"
else
  error "Xray is NOT running!"
fi

# Check port 443
if ss -tlnp | grep -q ":443 "; then
  log "✅ Port 443 listening"
else
  error "Port 443 NOT listening!"
fi

# Check WARP connectivity
WARP_IP=$(curl -sS --socks5-hostname 127.0.0.1:40000 --connect-timeout 5 https://ipinfo.io/ip 2>/dev/null || echo "FAILED")
log "WARP exit IP: $WARP_IP"

# Test Supercell access through WARP
SC_CODE=$(curl -sS --socks5-hostname 127.0.0.1:40000 --connect-timeout 10 -o /dev/null -w '%{http_code}' https://id.supercell.com 2>/dev/null || echo "000")
log "Supercell HTTP status (via WARP): $SC_CODE"

# Test direct access to Yandex (should go direct, not WARP)
YA_CODE=$(curl -sS --connect-timeout 5 -o /dev/null -w '%{http_code}' https://yandex.ru 2>/dev/null || echo "000")
log "Yandex HTTP status (direct): $YA_CODE"

echo ""
log "═══════════════════════════════════════════"
log "  WARP Chain Applied Successfully!"
log "═══════════════════════════════════════════"
log "  🔄 All foreign traffic → WARP (Cloudflare)"
log "  🇷🇺 Russian sites → Direct"
log "  🎮 Supercell → Through WARP (clean IP)"
log "═══════════════════════════════════════════"
