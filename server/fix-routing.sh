#!/bin/bash
# ═══════════════════════════════════
# FIX: Make direct the default, warp-out only for non-RU
# ═══════════════════════════════════
set -euo pipefail

X_UI_DB="/etc/x-ui/x-ui.db"
[[ ! -f "$X_UI_DB" ]] && X_UI_DB="/usr/local/x-ui/x-ui.db"

echo "[FIX] Building corrected template..."

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
                "domains": ["geosite:geolocation-!cn"]
            },
            {
                "address": "8.8.8.8",
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
            {"type": "field", "inboundTag": ["api"], "outboundTag": "api"},
            {"type": "field", "protocol": ["dns"], "outboundTag": "dns-out"},
            {"type": "field", "protocol": ["bittorrent"], "outboundTag": "blocked"},
            {"type": "field", "ip": ["geoip:private"], "outboundTag": "blocked"},
            {"type": "field", "domain": ["geosite:category-ads-all"], "outboundTag": "blocked"},
            {
                "ruleTag": "supercell-warp",
                "type": "field",
                "domain": [
                    "domain:supercell.com",
                    "domain:supercell.net",
                    "domain:brawlstars.com",
                    "domain:clashofclans.com",
                    "domain:clashroyale.com",
                    "domain:boombeach.com",
                    "domain:hayday.com",
                    "domain:squadbusters.com"
                ],
                "outboundTag": "warp-out"
            },
            {
                "ruleTag": "blocked-services-warp",
                "type": "field",
                "domain": [
                    "domain:openai.com",
                    "domain:chat.openai.com",
                    "domain:claude.ai",
                    "domain:anthropic.com",
                    "domain:aistudio.google.com",
                    "domain:bard.google.com",
                    "domain:gemini.google.com",
                    "domain:perplexity.ai",
                    "domain:discord.com",
                    "domain:discord.gg",
                    "domain:discordapp.com",
                    "domain:spotify.com",
                    "domain:scdn.co",
                    "domain:netflix.com",
                    "domain:nflxvideo.net",
                    "domain:linkedin.com",
                    "domain:medium.com",
                    "domain:notion.so",
                    "domain:notion.com"
                ],
                "outboundTag": "warp-out"
            },
            {
                "ruleTag": "google-warp",
                "type": "field",
                "domain": [
                    "domain:google.com",
                    "domain:googleapis.com",
                    "domain:googlevideo.com",
                    "domain:youtube.com",
                    "domain:ytimg.com",
                    "domain:ggpht.com",
                    "domain:gstatic.com",
                    "domain:googleusercontent.com",
                    "domain:google.de",
                    "domain:google.co.uk"
                ],
                "outboundTag": "warp-out"
            },
            {
                "ruleTag": "meta-warp",
                "type": "field",
                "domain": [
                    "domain:facebook.com",
                    "domain:fbcdn.net",
                    "domain:instagram.com",
                    "domain:cdninstagram.com",
                    "domain:whatsapp.com",
                    "domain:whatsapp.net",
                    "domain:meta.com",
                    "domain:threads.net",
                    "domain:twitter.com",
                    "domain:x.com",
                    "domain:twimg.com"
                ],
                "outboundTag": "warp-out"
            }
        ]
    }
}

s = json.dumps(template, ensure_ascii=True)
print(s.replace("'", "''"))
PYEOF
)

echo "[FIX] Template built (${#TEMPLATE} bytes)"

echo "[FIX] Updating database..."
sqlite3 "$X_UI_DB" "UPDATE settings SET value='$TEMPLATE' WHERE key='xrayTemplateConfig';"
echo "[FIX] DB updated"

echo "[FIX] Unlocking config file..."
chattr -i /usr/local/x-ui/bin/config.json 2>/dev/null || true

echo "[FIX] Restarting x-ui..."
systemctl restart x-ui
sleep 5

echo "=== VERIFY ==="
echo -n "Default outbound: "
jq -r '.outbounds[0].tag' /usr/local/x-ui/bin/config.json
echo -n "Outbounds: "
jq -r '[.outbounds[].tag] | join(", ")' /usr/local/x-ui/bin/config.json
echo -n "Rules: "
jq '.routing.rules | length' /usr/local/x-ui/bin/config.json
echo -n "DNS: "
jq '.dns.servers | length' /usr/local/x-ui/bin/config.json

echo ""
echo "=== CONNECTIVITY ==="
echo -n "Google (should work): "
curl -sS --connect-timeout 5 https://google.com -o /dev/null -w '%{http_code}' 2>&1
echo ""
echo -n "Yandex (direct): "
curl -sS --connect-timeout 5 https://yandex.ru -o /dev/null -w '%{http_code}' 2>&1
echo ""
echo -n "Supercell (WARP): "
curl -sS --socks5-hostname 127.0.0.1:40000 --connect-timeout 5 https://id.supercell.com -o /dev/null -w '%{http_code}' 2>&1
echo ""
echo -n "WARP IP: "
curl -sS --socks5-hostname 127.0.0.1:40000 --connect-timeout 5 https://ipinfo.io/ip 2>&1
echo ""
echo -n "Xray running: "
pgrep -f xray > /dev/null && echo "YES" || echo "NO"
echo -n "Port 443: "
ss -tlnp | grep -q ":443 " && echo "LISTENING" || echo "DOWN"
echo ""
echo "[FIX] Done! direct=default, only specific blocked services go through WARP"
