#!/bin/bash
# ═══════════════════════════════════
# FIX v3: direct=default, catch-all→WARP, RU→direct
# Key insight: Supercell games connect to IP addresses, 
# not domains. We need ALL non-RU traffic → WARP.
# ═══════════════════════════════════
set -euo pipefail

X_UI_DB="/etc/x-ui/x-ui.db"
[[ ! -f "$X_UI_DB" ]] && X_UI_DB="/usr/local/x-ui/x-ui.db"

echo "[FIX3] Building template with catch-all WARP..."

TEMPLATE=$(python3 << 'PYEOF'
import json

template = {
    "log": {
        "loglevel": "warning",
        "access": "",
        "error": "",
        "dnsLog": False,
        "maskAddress": ""
    },
    "api": {
        "tag": "api",
        "services": ["HandlerService", "LoggerService", "StatsService"]
    },
    "stats": {},
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
                "address": "1.1.1.1",
                "domains": ["geosite:geolocation-!cn"],
                "skipFallback": True
            },
            {
                "address": "8.8.8.8",
                "domains": ["geosite:geolocation-!cn"],
                "skipFallback": True
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
            "tag": "direct",
            "protocol": "freedom",
            "settings": {
                "domainStrategy": "UseIPv4"
            }
        },
        {
            "tag": "warp-out",
            "protocol": "socks",
            "settings": {
                "servers": [{"address": "127.0.0.1", "port": 40000}]
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
            # 1. Internal API
            {"type": "field", "inboundTag": ["api"], "outboundTag": "api"},
            # 2. DNS queries
            {"type": "field", "protocol": ["dns"], "outboundTag": "dns-out"},
            # 3. Block torrents
            {"type": "field", "protocol": ["bittorrent"], "outboundTag": "blocked"},
            # 4. Block private IPs
            {"type": "field", "ip": ["geoip:private"], "outboundTag": "blocked"},
            # 5. Block ads
            {"type": "field", "domain": ["geosite:category-ads-all"], "outboundTag": "blocked"},
            # 6. Russian domains → DIRECT (bypass WARP)
            {
                "ruleTag": "ru-domains-direct",
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
                    "domain:pochta.ru","domain:cdek.ru","domain:boxberry.ru",
                    "domain:ggsel.com","domain:ggsel.net",
                    "domain:digiseller.com","domain:digiseller.ru","domain:plati.market",
                    "domain:timeweb.cloud","domain:timeweb.com","domain:timeweb.ru"
                ],
                "outboundTag": "direct"
            },
            # 7. Russian IPs → DIRECT
            {
                "ruleTag": "ru-ip-direct",
                "type": "field",
                "ip": ["geoip:ru"],
                "outboundTag": "direct"
            },
            # 8. EVERYTHING ELSE → WARP (catches game server IPs, etc.)
            {
                "ruleTag": "all-other-warp",
                "type": "field",
                "network": "tcp,udp",
                "outboundTag": "warp-out"
            }
        ]
    }
}

s = json.dumps(template, ensure_ascii=True)
print(s.replace("'", "''"))
PYEOF
)

echo "[FIX3] Template: ${#TEMPLATE} bytes"

echo "[FIX3] Updating DB..."
sqlite3 "$X_UI_DB" "UPDATE settings SET value='$TEMPLATE' WHERE key='xrayTemplateConfig';"

echo "[FIX3] Removing immutable flag..."
chattr -i /usr/local/x-ui/bin/config.json 2>/dev/null || true

echo "[FIX3] Restarting x-ui..."
systemctl restart x-ui
sleep 5

echo ""
echo "=== VERIFY ==="
XRAY_CONFIG="/usr/local/x-ui/bin/config.json"
echo -n "Default outbound: "
jq -r '.outbounds[0].tag' "$XRAY_CONFIG"
echo -n "All outbounds: "
jq -r '[.outbounds[].tag] | join(", ")' "$XRAY_CONFIG"
echo -n "Rules count: "
jq '.routing.rules | length' "$XRAY_CONFIG"
echo -n "Last rule tag: "
jq -r '.routing.rules[-1].ruleTag // .routing.rules[-1].outboundTag' "$XRAY_CONFIG"
echo -n "Last rule outbound: "
jq -r '.routing.rules[-1].outboundTag' "$XRAY_CONFIG"
echo -n "DNS servers: "
jq '.dns.servers | length' "$XRAY_CONFIG"

echo ""
echo "=== CONNECTIVITY ==="
echo -n "Yandex (direct→RU): "
curl -sS --connect-timeout 5 https://yandex.ru -o /dev/null -w '%{http_code}' 2>&1
echo ""
echo -n "Google (warp): "
curl -sS --connect-timeout 5 https://google.com -o /dev/null -w '%{http_code}' 2>&1
echo ""
echo -n "Supercell ID (warp): "
curl -sS --connect-timeout 5 https://id.supercell.com -o /dev/null -w '%{http_code}' 2>&1
echo ""
echo -n "Xray: "
pgrep -f xray > /dev/null && echo "RUNNING" || echo "DEAD"
echo -n "Port 443: "
ss -tlnp | grep -q ":443 " && echo "OK" || echo "DOWN"
echo ""

# Test what IP the VPN clients see
echo "=== EXIT IP TEST ==="
echo -n "Server direct IP: "
curl -sS --connect-timeout 5 https://ipinfo.io/ip 2>&1
echo ""
echo -n "WARP IP: "
curl -sS --socks5-hostname 127.0.0.1:40000 --connect-timeout 5 https://ipinfo.io/ip 2>&1
echo ""
echo -n "WARP country: "
curl -sS --socks5-hostname 127.0.0.1:40000 --connect-timeout 5 https://ipinfo.io/country 2>&1
echo ""

echo ""
echo "[FIX3] ✅ Done!"
echo "[FIX3] Layout: direct=default, RU→direct, ALL OTHER→WARP"
echo "[FIX3] Supercell game IPs will now go through WARP (DE)"
