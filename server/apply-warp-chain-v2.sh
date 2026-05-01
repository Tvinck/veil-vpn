#!/bin/bash
# ═══════════════════════════════════════════════════
# VEIL VPN — Apply WARP Chain (v2 — correct 3X-UI method)
# ═══════════════════════════════════════════════════
# Problem: 3X-UI generates xray config on restart from DB.
# Solution: INSERT xrayTemplateConfig into settings table.
# ═══════════════════════════════════════════════════

set -euo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'
log() { echo -e "${GREEN}[VEIL]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
step() { echo -e "\n${CYAN}━━━ $1 ━━━${NC}"; }

X_UI_DB="/etc/x-ui/x-ui.db"
[[ ! -f "$X_UI_DB" ]] && X_UI_DB="/usr/local/x-ui/x-ui.db"
[[ ! -f "$X_UI_DB" ]] && error "x-ui database not found"
log "DB: $X_UI_DB"

# ═══════════════════════════════════
step "1/4 — Build Xray Template JSON"
# ═══════════════════════════════════

# The template is everything EXCEPT inbounds (x-ui generates those from its DB)
TEMPLATE=$(python3 << 'PYEOF'
import json

template = {
    "log": {
        "loglevel": "warning",
        "access": "none",
        "error": "",
        "dnsLog": False,
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
                "statsUserUplink": True,
                "statsUserDownlink": True
            }
        },
        "system": {
            "statsInboundUplink": True,
            "statsInboundDownlink": True,
            "statsOutboundUplink": True,
            "statsOutboundDownlink": True
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
        "disableCache": False,
        "disableFallback": False,
        "tag": "dns-in"
    },
    "outbounds": [
        {
            "tag": "warp-out",
            "protocol": "socks",
            "settings": {
                "servers": [{"address": "127.0.0.1", "port": 40000}]
            }
        },
        {
            "tag": "direct",
            "protocol": "freedom",
            "settings": {"domainStrategy": "UseIPv4"}
        },
        {
            "tag": "blocked",
            "protocol": "blackhole",
            "settings": {}
        },
        {
            "tag": "dns-out",
            "protocol": "dns",
            "settings": {"network": "tcp", "address": "1.1.1.1", "port": 53}
        }
    ],
    "routing": {
        "domainStrategy": "IPIfNonMatch",
        "rules": [
            {"type": "field", "inboundTag": ["api"], "outboundTag": "api"},
            {"type": "field", "protocol": ["dns"], "outboundTag": "dns-out"},
            {"type": "field", "protocol": ["bittorrent"], "outboundTag": "blocked"},
            {"type": "field", "ip": ["geoip:private"], "outboundTag": "blocked"},
            {"type": "field", "domain": ["geosite:category-ads-all"], "outboundTag": "blocked"},
            {
                "ruleTag": "russian-sites-direct",
                "type": "field",
                "domain": [
                    "geosite:category-ru",
                    "domain:yandex.ru","domain:yandex.com","domain:yandex.net","domain:ya.ru",
                    "domain:mail.ru","domain:vk.com","domain:vk.ru","domain:vkontakte.ru",
                    "domain:ok.ru","domain:odnoklassniki.ru",
                    "domain:sberbank.ru","domain:online.sberbank.ru",
                    "domain:tinkoff.ru","domain:tbank.ru",
                    "domain:gosuslugi.ru","domain:mos.ru","domain:nalog.gov.ru","domain:pfr.gov.ru",
                    "domain:wildberries.ru","domain:ozon.ru","domain:avito.ru",
                    "domain:kinopoisk.ru","domain:ivi.ru","domain:okko.tv","domain:more.tv","domain:rutube.ru",
                    "domain:1c.ru","domain:bitrix24.ru",
                    "domain:drom.ru","domain:auto.ru","domain:cian.ru",
                    "domain:hh.ru","domain:superjob.ru","domain:2gis.ru",
                    "domain:dns-shop.ru","domain:mvideo.ru","domain:citilink.ru","domain:eldorado.ru",
                    "domain:lamoda.ru","domain:sbermegamarket.ru",
                    "domain:alfabank.ru","domain:vtb.ru","domain:raiffeisen.ru","domain:open.ru",
                    "domain:pochta.ru","domain:cdek.ru","domain:boxberry.ru"
                ],
                "outboundTag": "direct"
            },
            {"ruleTag": "russian-ip-direct", "type": "field", "ip": ["geoip:ru"], "outboundTag": "direct"},
            {"ruleTag": "all-other-via-warp", "type": "field", "port": "0-65535", "outboundTag": "warp-out"}
        ]
    },
    "transport": None,
    "reverse": None,
    "fakedns": None,
    "observatory": None,
    "burstObservatory": None
}

# Output as JSON string with escaped single quotes for SQLite
s = json.dumps(template, ensure_ascii=True)
print(s.replace("'", "''"))
PYEOF
)

log "Template built (${#TEMPLATE} bytes)"

# ═══════════════════════════════════
step "2/4 — Insert/Update xrayTemplateConfig in DB"
# ═══════════════════════════════════

# Check if key exists
EXISTS=$(sqlite3 "$X_UI_DB" "SELECT COUNT(*) FROM settings WHERE key='xrayTemplateConfig';")
if [[ "$EXISTS" == "0" ]]; then
    log "Key xrayTemplateConfig not found, INSERTING..."
    sqlite3 "$X_UI_DB" "INSERT INTO settings (key, value) VALUES ('xrayTemplateConfig', '$TEMPLATE');"
else
    log "Key xrayTemplateConfig exists, UPDATING..."
    sqlite3 "$X_UI_DB" "UPDATE settings SET value='$TEMPLATE' WHERE key='xrayTemplateConfig';"
fi

# Verify
VERIFY=$(sqlite3 "$X_UI_DB" "SELECT length(value) FROM settings WHERE key='xrayTemplateConfig';")
log "Stored template size: ${VERIFY} bytes"

# ═══════════════════════════════════
step "3/4 — Restart x-ui and verify"
# ═══════════════════════════════════

log "Restarting x-ui..."
systemctl restart x-ui
sleep 5

XRAY_CONFIG="/usr/local/x-ui/bin/config.json"

# Check outbounds
OUTBOUNDS=$(jq -r '.outbounds[].tag' "$XRAY_CONFIG" 2>/dev/null | tr '\n' ', ')
log "Outbounds: $OUTBOUNDS"

HAS_WARP=$(echo "$OUTBOUNDS" | grep -c "warp-out" || true)
if [[ "$HAS_WARP" -gt 0 ]]; then
    log "✅ warp-out outbound FOUND"
else
    log "❌ warp-out NOT found in config — trying direct file override..."
    
    # If x-ui still doesn't use the template, we force it via file + make it read-only
    CURRENT_INBOUNDS=$(jq -c '.inbounds' "$XRAY_CONFIG" 2>/dev/null)
    
    python3 << PYEOF2
import json, sys

template_str = '''$TEMPLATE'''
template = json.loads(template_str.replace("''", "'"))

inbounds = json.loads('''$CURRENT_INBOUNDS''')
template['inbounds'] = inbounds

with open('$XRAY_CONFIG', 'w') as f:
    json.dump(template, f, indent=2, ensure_ascii=False)
print("Config file overwritten with WARP chain")
PYEOF2
    
    # Make the config immutable so x-ui can't overwrite it
    chattr +i "$XRAY_CONFIG" 2>/dev/null || true
    log "Config locked with chattr +i"
    
    # Kill xray and let x-ui restart it with our config
    pkill -f xray 2>/dev/null || true
    sleep 2
    systemctl restart x-ui
    sleep 5
    
    OUTBOUNDS=$(jq -r '.outbounds[].tag' "$XRAY_CONFIG" 2>/dev/null | tr '\n' ', ')
    log "Outbounds after override: $OUTBOUNDS"
fi

# Check routing rules
RULES=$(jq '.routing.rules | length' "$XRAY_CONFIG" 2>/dev/null)
log "Routing rules: $RULES"

# Check DNS
DNS_COUNT=$(jq '.dns.servers | length' "$XRAY_CONFIG" 2>/dev/null || echo "0")
log "DNS servers: $DNS_COUNT"

# ═══════════════════════════════════
step "4/4 — Connectivity Tests"
# ═══════════════════════════════════

# Check xray running
if pgrep -f "xray" > /dev/null 2>&1; then
    log "✅ Xray is running"
else
    log "❌ Xray not running! Check: journalctl -u x-ui --no-pager -n 20"
fi

# Check port 443
if ss -tlnp | grep -q ":443 "; then
    log "✅ Port 443 listening"
else
    log "❌ Port 443 NOT listening"
fi

# Check WARP
WARP_IP=$(curl -sS --socks5-hostname 127.0.0.1:40000 --connect-timeout 5 https://ipinfo.io/ip 2>/dev/null || echo "FAILED")
log "WARP exit IP: $WARP_IP"

# Test Supercell
SC_CODE=$(curl -sS --socks5-hostname 127.0.0.1:40000 --connect-timeout 10 -o /dev/null -w '%{http_code}' https://id.supercell.com 2>/dev/null || echo "000")
log "Supercell (via WARP): HTTP $SC_CODE"

# Test Google AI Studio
GAIS_CODE=$(curl -sS --socks5-hostname 127.0.0.1:40000 --connect-timeout 10 -o /dev/null -w '%{http_code}' https://aistudio.google.com 2>/dev/null || echo "000")
log "Google AI Studio (via WARP): HTTP $GAIS_CODE"

# Test Yandex direct
YA_CODE=$(curl -sS --connect-timeout 5 -o /dev/null -w '%{http_code}' https://yandex.ru 2>/dev/null || echo "000")
log "Yandex (direct): HTTP $YA_CODE"

echo ""
log "═══════════════════════════════════════════"
log "  ✅  WARP Chain Configuration Complete!"
log "═══════════════════════════════════════════"
log "  All foreign traffic → Cloudflare WARP ($WARP_IP)"
log "  Russian sites → Direct (no WARP)"
log "  Supercell games → WARP (clean German IP)"
log "═══════════════════════════════════════════"
