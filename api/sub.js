import { createClient } from '@supabase/supabase-js'

/**
 * Преобразует двухсимвольный код страны в соответствующий флаг-эмодзи.
 */
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

/**
 * Генерирует конфигурацию Clash Meta YAML.
 */
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

export default async function handler(req, res) {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send('Token is required');
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).send('Server configuration error');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { data: subscription, error } = await supabase
      .from('vpn_subscriptions')
      .select('traffic_used, traffic_limit, expires_at, subscription_key, status')
      .eq('token', token)
      .single();

    if (error || !subscription) {
      return res.status(404).send('Subscription not found');
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
          const s_pbk = s.reality_public_key || process.env.VLESS_PBK || 'QScEWDolcox0fyfXNODCepp59KaN5O5WCwLu-QxbL2g';
          const s_sni = s.reality_sni || process.env.VLESS_SNI || 'www.microsoft.com';
          const s_sid = s.reality_short_id || process.env.VLESS_SID || 'ca';
          const s_flow = s.reality_flow || process.env.VLESS_FLOW || 'xtls-rprx-vision';
          
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
      } else {
        // Fallback static configuration if DB has no servers
        const serverIp = process.env.VLESS_SERVER_IP;
        const port = process.env.VLESS_PORT || '443';
        const pbk = process.env.VLESS_PBK;
        const sni = process.env.VLESS_SNI || 'yahoo.com';
        const sid = process.env.VLESS_SID || '';
        const fp = process.env.VLESS_FP || 'chrome';
        const flow = process.env.VLESS_FLOW || 'xtls-rprx-vision';

        const staticRegions = [
          '🇳🇱 Нидерланды (Premium)',
          '🇩🇪 Германия (Premium)',
          '🇫🇮 Финляндия (Premium)',
          '🇷🇺 Россия (Premium)',
          '🇮🇳 Индия (Premium)',
          '🇱🇹 Литва (Premium)',
          '🇬🇧 Великобритания (Premium)',
          '🇺🇸 США (Premium)',
          '🇯🇵 Япония (Premium)'
        ];

        if (serverIp && pbk) {
          staticRegions.forEach(region => {
            proxyConfigs.push({
              name: region,
              server: serverIp,
              port: port,
              uuid: clientUuid,
              pbk: pbk,
              sni: sni,
              sid: sid,
              fp: fp,
              flow: flow
            });
          });
        }
      }
    }

    // Set auto-update headers for ALL clients
    res.setHeader('profile-update-interval', '24');
    res.setHeader('profile-title', 'Veil.Net');
    res.setHeader('Subscription-Userinfo', `upload=0; download=${traffic_used}; total=${totalTraffic}; expire=${expireTimestamp}`);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

    const userAgent = (req.headers['user-agent'] || '').toLowerCase();
    const isClash = userAgent.includes('clash') || userAgent.includes('stash') || userAgent.includes('meta') || userAgent.includes('surfboard');

    if (isClash) {
      // Return YAML for Clash-based clients
      const proxyNames = proxyConfigs.map(p => p.name);
      const yamlContent = generateClashYaml(proxyConfigs, proxyNames, expiryNodeText, traffic_used, traffic_limit);
      res.setHeader('Content-Type', 'application/yaml; charset=utf-8');
      return res.status(200).send(yamlContent);
    } else {
      // Возвращаем Base64 для обычных клиентов (v2rayNG, Shadowrocket, Streisand, Hiddify)
      let vlessLinks = proxyConfigs.map(p => {
        if (p.network === 'grpc') {
          return `vless://${p.uuid}@${p.server}:${p.port}?encryption=none&type=grpc&mode=gun&security=reality&pbk=${encodeURIComponent(p.pbk)}&sni=${encodeURIComponent(p.sni)}&fp=${p.fp}&sid=${p.sid}&serviceName=grpc&spx=%2F#${encodeURIComponent(p.name)}`;
        } else {
          return `vless://${p.uuid}@${p.server}:${p.port}?encryption=none&type=tcp&security=reality&pbk=${encodeURIComponent(p.pbk)}&sni=${encodeURIComponent(p.sni)}&fp=${p.fp}&sid=${p.sid}&spx=%2F&flow=${p.flow}#${encodeURIComponent(p.name)}`;
        }
      });

      // Avoid V2Box parsing errors (empty password) by using the real client UUID and pointing to local dummy port
      const fakeNodes = [
        `vless://${clientUuid}@127.0.0.1:10080?type=tcp&security=none#${encodeURIComponent(expiryNodeText)}`,
        `vless://${clientUuid}@127.0.0.1:10080?type=tcp&security=none#${encodeURIComponent('🛠 Поддержка - в боте @Veil_Vps_bot 🛩')}`,
        `vless://${clientUuid}@127.0.0.1:10080?type=tcp&security=none#${encodeURIComponent('🌐 veil.net - подключение без ограничений 😎')}`
      ];

      const finalCopyText = fakeNodes.join('\n') + '\n' + vlessLinks.join('\n');
      const base64Data = Buffer.from(finalCopyText).toString('base64');
      
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.status(200).send(base64Data);
    }

  } catch (err) {
    console.error('Error fetching subscription:', err);
    return res.status(500).send('Internal Server Error');
  }
}
