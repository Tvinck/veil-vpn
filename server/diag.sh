#!/bin/bash
echo "=== XRAY LOGS ==="
journalctl -u x-ui --no-pager -n 30 2>&1 | grep -i "error\|fail\|warn\|warp" | tail -15
echo ""
echo "=== WARP SOCKS TEST ==="
curl -sS --socks5-hostname 127.0.0.1:40000 --connect-timeout 5 https://google.com -o /dev/null -w 'HTTP:%{http_code}' 2>&1
echo ""
echo "=== DIRECT TEST ==="
curl -sS --connect-timeout 5 https://google.com -o /dev/null -w 'HTTP:%{http_code}' 2>&1
echo ""
echo "=== CONFIG FIRST OUTBOUND (default) ==="
jq -r '.outbounds[0].tag' /usr/local/x-ui/bin/config.json
echo ""
echo "=== ALL OUTBOUND TAGS ==="
jq -r '.outbounds[].tag' /usr/local/x-ui/bin/config.json
echo ""
echo "=== ROUTING CATCH-ALL ==="
jq '.routing.rules[-1]' /usr/local/x-ui/bin/config.json
echo ""
echo "=== WARP-SVC STATUS ==="
systemctl is-active warp-svc
echo ""
echo "=== WARP PROXY MODE ==="
warp-cli status 2>&1 | head -5
echo ""
echo "=== XRAY ERROR LOG ==="
cat /usr/local/x-ui/bin/xray.log 2>/dev/null | tail -20 || echo "no log file"
echo ""
echo "=== XRAY ACCESS LOG ==="
journalctl -u x-ui --no-pager -n 50 2>&1 | grep -i "socks\|warp\|40000\|refused\|timeout" | tail -10
