import http from 'http';
import https from 'https';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import ws from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Отсутствуют переменные окружения для Supabase в sub_server.js');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
  realtime: { transport: ws },
});

function getFlagEmoji(countryCode) {
  if (!countryCode) return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  try {
    return String.fromCodePoint(...codePoints);
  } catch (e) {
    return '🌐';
  }
}

function generateClashYaml(proxies, proxyNames, expiryText, trafficUsed, trafficLimit) {
  const proxyGroupNames = proxyNames.map(n => `      - "${n}"`).join('\n');
  const proxiesYaml = proxies.map(p => {
    if (p.network === 'grpc') {
      return `  - name: "${p.name}"
    type: vless
    server: ${p.server}
    port: ${p.port}
    uuid: ${p.uuid}
    network: grpc
    tls: true
    udp: true
    servername: ${p.sni}
    grpc-opts:
      grpc-service-name: "${p.serviceName || 'grpc'}"
    reality-opts:
      public-key: ${p.pbk}
      short-id: "${p.sid}"
    client-fingerprint: ${p.fp}`;
    } else {
      return `  - name: "${p.name}"
    type: vless
    server: ${p.server}
    port: ${p.port}
    uuid: ${p.uuid}
    network: tcp
    tls: true
    udp: true
    xudp: true
    flow: ${p.flow}
    servername: ${p.sni}
    reality-opts:
      public-key: ${p.pbk}
      short-id: "${p.sid}"
    client-fingerprint: ${p.fp}`;
    }
  }).join('\n');

  return `port: 7890
socks-port: 7891
allow-lan: false
mode: rule
log-level: info
ipv6: false
external-controller: 127.0.0.1:9090

profile:
  store-selected: true
  store-fake-ip: false

dns:
  enable: true
  listen: 0.0.0.0:53
  ipv6: false
  enhanced-mode: redir-host
  nameserver:
    - 8.8.8.8
    - 1.1.1.1

proxies:
  - name: "ℹ️ ${expiryText}"
    type: direct
  - name: "📊 Трафик: ${(trafficUsed / (1024*1024*1024)).toFixed(2)}GB / ${trafficLimit ? (trafficLimit / (1024*1024*1024)).toFixed(0) + 'GB' : 'Безлимит'}"
    type: direct
${proxiesYaml}

proxy-groups:
  - name: "🚀 Выбор сервера"
    type: select
    proxies:
      - "⚡ Автовыбор"
${proxyGroupNames}

  - name: "⚡ Автовыбор"
    type: url-test
    url: "http://www.gstatic.com/generate_204"
    interval: 300
    tolerance: 50
    proxies:
${proxyGroupNames}

  - name: "ℹ️ Информация"
    type: select
    proxies:
      - "ℹ️ ${expiryText}"
      - "📊 Трафик: ${(trafficUsed / (1024*1024*1024)).toFixed(2)}GB / ${trafficLimit ? (trafficLimit / (1024*1024*1024)).toFixed(0) + 'GB' : 'Безлимит'}"

rules:
  # Split Tunneling для российских сайтов (прямое подключение)
  - DOMAIN-SUFFIX,ru,DIRECT
  - DOMAIN-SUFFIX,su,DIRECT
  - DOMAIN-SUFFIX,рф,DIRECT
  - DOMAIN-KEYWORD,yandex,DIRECT
  - DOMAIN-KEYWORD,vk,DIRECT
  - DOMAIN-KEYWORD,mail,DIRECT
  - DOMAIN-KEYWORD,gosuslugi,DIRECT
  - DOMAIN-KEYWORD,tinkoff,DIRECT
  - DOMAIN-KEYWORD,sber,DIRECT
  - DOMAIN-KEYWORD,kinopoisk,DIRECT
  - MATCH,🚀 Выбор сервера
`;
}

function extractUuid(key) {
  if (!key) return null;
  if (key.startsWith('vless://')) {
    const match = key.match(/vless:\/\/([^@]+)@/);
    return match ? match[1] : null;
  }
  return key;
}

const requestHandler = async (req, res) => {
  try {
    let reqUrl;
    try {
      reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    } catch (e) {
      reqUrl = new URL(req.url, 'http://localhost');
    }
    
    // ACME challenge handler for certbot
    if (reqUrl.pathname.startsWith('/.well-known/acme-challenge/')) {
      const fileName = path.basename(reqUrl.pathname);
      const fullPath = path.join('/opt/bazzar-sync/.well-known/acme-challenge', fileName);
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end(content);
        return;
      } catch (e) {
        res.statusCode = 404;
        res.end('Not Found');
        return;
      }
    }
    
    // Поддерживаем как /api/sub так и /sub
    if (reqUrl.pathname !== '/api/sub' && reqUrl.pathname !== '/sub') {
      res.statusCode = 404;
      res.end('Not Found');
      return;
    }

    const token = reqUrl.searchParams.get('token');
    if (!token) {
      res.statusCode = 400;
      res.end('Token is required');
      return;
    }

    const { data: subscription, error } = await supabase
      .from('vpn_subscriptions')
      .select('traffic_used, traffic_limit, expires_at, subscription_key, status')
      .eq('token', token)
      .single();

    if (error || !subscription) {
      res.statusCode = 404;
      res.end('Subscription not found');
      return;
    }

    const { traffic_used, traffic_limit, expires_at, subscription_key, status } = subscription;
    const isExpired = expires_at ? new Date(expires_at) < new Date() : false;
    const isSuspended = status !== 'active';
    const totalTraffic = traffic_limit || 536870912000;
    
    let expireTimestamp = 0;
    let daysLeft = 0;
    if (expires_at) {
      const expDate = new Date(expires_at);
      expireTimestamp = Math.floor(expDate.getTime() / 1000);
      daysLeft = Math.max(0, Math.ceil((expDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    }

    let expiryNodeText = expires_at ? `⏳ До окончания подписки - ${daysLeft} дней` : `⏳ Подписка бессрочная (активна)`;
    if (isExpired) {
      expiryNodeText = `❌ Подписка ИСТЕКЛА (${new Date(expires_at).toLocaleDateString()}) — продлите её в боте!`;
    } else if (isSuspended) {
      expiryNodeText = `❌ Подписка ЗАБЛОКИРОВАНА (статус: ${status}) — свяжитесь с поддержкой!`;
    }

    const clientUuid = extractUuid(subscription_key);
    let proxyConfigs = [];
    
    if (!isExpired && !isSuspended && clientUuid) {
      const { data: dbServers } = await supabase.from('vpn_servers').select('*').order('name');
      const servers = dbServers || [];
      
      if (servers.length > 0) {
        servers.forEach(s => {
          const s_pbk = s.reality_public_key || 'QScEWDolcox0fyfXNODCepp59KaN5O5WCwLu-QxbL2g';
          const s_sni = s.reality_sni || 'www.microsoft.com';
          const s_sid = s.reality_short_id || 'ca';
          const s_flow = s.reality_flow || 'xtls-rprx-vision';
          
          if (s.ip_address && s_pbk) {
            // TCP
            proxyConfigs.push({
              name: `${getFlagEmoji(s.country_code)} ${s.name || 'Сервер'} (TCP)`,
              server: s.ip_address,
              port: s.port || 443,
              uuid: clientUuid,
              pbk: s_pbk,
              sni: s_sni,
              sid: s_sid,
              fp: 'chrome',
              flow: s_flow,
              network: 'tcp'
            });
            // gRPC
            proxyConfigs.push({
              name: `${getFlagEmoji(s.country_code)} ${s.name || 'Сервер'} (gRPC)`,
              server: s.ip_address,
              port: 444,
              uuid: clientUuid,
              pbk: s_pbk,
              sni: 'github.com',
              sid: s_sid,
              fp: 'chrome',
              network: 'grpc',
              serviceName: 'grpc'
            });
          }
        });
      }
    }

    res.setHeader('profile-update-interval', '24');
    res.setHeader('profile-title', 'Veil.Net');
    res.setHeader('Subscription-Userinfo', `upload=0; download=${traffic_used}; total=${totalTraffic}; expire=${expireTimestamp}`);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

    const userAgent = (req.headers['user-agent'] || '').toLowerCase();
    const isClash = userAgent.includes('clash') || userAgent.includes('stash') || userAgent.includes('meta') || userAgent.includes('surfboard');

    if (isClash) {
      const proxyNames = proxyConfigs.map(p => p.name);
      const yamlContent = generateClashYaml(proxyConfigs, proxyNames, expiryNodeText, traffic_used, traffic_limit);
      res.setHeader('Content-Type', 'application/yaml; charset=utf-8');
      res.end(yamlContent);
    } else {
      let vlessLinks = proxyConfigs.map(p => {
        if (p.network === 'grpc') {
          return `vless://${p.uuid}@${p.server}:${p.port}?encryption=none&type=grpc&mode=gun&security=reality&pbk=${encodeURIComponent(p.pbk)}&sni=${encodeURIComponent(p.sni)}&fp=${p.fp}&sid=${p.sid}&serviceName=grpc&spx=%2F#${encodeURIComponent(p.name)}`;
        } else {
          return `vless://${p.uuid}@${p.server}:${p.port}?encryption=none&type=tcp&security=reality&pbk=${encodeURIComponent(p.pbk)}&sni=${encodeURIComponent(p.sni)}&fp=${p.fp}&sid=${p.sid}&spx=%2F&flow=${p.flow}#${encodeURIComponent(p.name)}`;
        }
      });

      const fakeNodes = [
        `vless://${clientUuid}@127.0.0.1:10080?type=tcp&security=none#${encodeURIComponent(expiryNodeText)}`,
        `vless://${clientUuid}@127.0.0.1:10080?type=tcp&security=none#${encodeURIComponent('🛠 Поддержка - в боте @Veil_Vps_bot 🛩')}`,
        `vless://${clientUuid}@127.0.0.1:10080?type=tcp&security=none#${encodeURIComponent('🌐 veil.net - подключение без ограничений 😎')}`
      ];

      const finalCopyText = fakeNodes.join('\n') + '\n' + vlessLinks.join('\n');
      const base64Data = Buffer.from(finalCopyText).toString('base64');
      
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end(base64Data);
    }
  } catch (err) {
    console.error('Error in sub server:', err);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
};

// Start HTTP Server on port 80
const httpServer = http.createServer(requestHandler);
httpServer.listen(80, '0.0.0.0', () => {
  console.log('✅ HTTP Subscription server is running on port 80');
});

// Try to start HTTPS Server on port 2053
let sslOptions = {};
try {
  sslOptions = {
    key: fs.readFileSync('/etc/letsencrypt/live/185-142-99-185.sslip.io/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/185-142-99-185.sslip.io/fullchain.pem')
  };
  
  const httpsServer = https.createServer(sslOptions, requestHandler);
  httpsServer.listen(2053, '0.0.0.0', () => {
    console.log('🔒 HTTPS Subscription server is running on port 2053');
  });
} catch (e) {
  console.log('⚠️ HTTPS certificate not found or failed to load. Running HTTP-only on port 80.');
}
