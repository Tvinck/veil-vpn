import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env file and set environment variables
const envPath = path.resolve('c:/Users/Николай/Desktop/BAZZAR PROD/veil-vpn/.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    process.env[key] = value.trim();
  }
});

console.log('Loaded env:');
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length);

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
  const proxiesYaml = proxies.map(p => `  - name: "${p.name}"
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
    client-fingerprint: ${p.fp}`).join('\n');

  return `port: 7890
socks-port: 7891
allow-lan: false
mode: rule
log-level: info
ipv6: false
external-controller: 127.0.0.1:9090

profile:
  store-selected: true
  store-fake-ip: true

dns:
  enable: true
  listen: 0.0.0.0:53
  ipv6: false
  enhanced-mode: fake-ip
  fake-ip-range: 198.18.0.1/16
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

async function testHandler() {
  const token = '6a913ac8b84f4f2c8771e950ece22ce4'; // valid token
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Server configuration error: missing credentials');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { data: subscription, error } = await supabase
      .from('vpn_subscriptions')
      .select('traffic_used, traffic_limit, expires_at, subscription_key, status')
      .eq('token', token)
      .single();

    if (error || !subscription) {
      console.error('Subscription not found:', error);
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
          if (s.ip_address && s.reality_public_key) {
            proxyConfigs.push({
              name: `${getFlagEmoji(s.country_code)} ${s.name || 'Сервер'} (Premium)`,
              server: s.ip_address,
              port: s.port || 443,
              uuid: clientUuid,
              pbk: s.reality_public_key,
              sni: s.reality_sni || 'www.intel.com',
              sid: s.reality_short_id || '',
              fp: 'chrome',
              flow: s.reality_flow || 'xtls-rprx-vision'
            });
          }
        });
      }
    }

    console.log('Successfully generated proxyConfigs:', proxyConfigs);
    
    // Set auto-update headers
    const userAgent = 'hiddify';
    const isClash = userAgent.includes('clash') || userAgent.includes('stash') || userAgent.includes('meta') || userAgent.includes('surfboard');

    if (isClash) {
      const proxyNames = proxyConfigs.map(p => p.name);
      const yamlContent = generateClashYaml(proxyConfigs, proxyNames, expiryNodeText, traffic_used, traffic_limit);
      console.log('Successfully generated Clash YAML');
    } else {
      let vlessLinks = proxyConfigs.map(p => {
        return `vless://${p.uuid}@${p.server}:${p.port}?type=tcp&security=reality&pbk=${encodeURIComponent(p.pbk)}&sni=${encodeURIComponent(p.sni)}&fp=${p.fp}&sid=${p.sid}&spx=%2F&flow=${p.flow}#${encodeURIComponent(p.name)}`;
      });

      const fakeNodes = [
        `vless://00000000-0000-0000-0000-000000000000@1.1.1.1:80?type=tcp&security=none#${encodeURIComponent(expiryNodeText)}`,
        `vless://00000000-0000-0000-0000-000000000000@1.1.1.1:80?type=tcp&security=none#${encodeURIComponent('🛠 Техподдержка - нажмите на Самолетик 🛩')}`,
        `vless://00000000-0000-0000-0000-000000000000@1.1.1.1:80?type=tcp&security=none#${encodeURIComponent('🌐 veil.net - подключение без ограничений 😎')}`
      ];

      const finalCopyText = fakeNodes.join('\n') + '\n' + vlessLinks.join('\n');
      const base64Data = Buffer.from(finalCopyText).toString('base64');
      console.log('Successfully generated Base64 subscription data');
    }

  } catch (err) {
    console.error('Error fetching subscription:', err);
  }
}

testHandler();
