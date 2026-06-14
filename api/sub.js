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

  return \`port: 7890
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
  - name: "ℹ️ \${expiryText}"
    type: direct
  - name: "📊 Трафик: \${(trafficUsed / (1024*1024*1024)).toFixed(2)}GB / \${trafficLimit ? (trafficLimit / (1024*1024*1024)).toFixed(0) + 'GB' : 'Безлимит'}"
    type: direct
\${proxiesYaml}

proxy-groups:
  - name: "🚀 Выбор сервера"
    type: select
    proxies:
      - "⚡ Автовыбор"
\${proxyGroupNames}

  - name: "⚡ Автовыбор"
    type: url-test
    url: "http://www.gstatic.com/generate_204"
    interval: 300
    tolerance: 50
    proxies:
\${proxyGroupNames}

  - name: "ℹ️ Информация"
    type: select
    proxies:
      - "ℹ️ \${expiryText}"
      - "📊 Трафик: \${(trafficUsed / (1024*1024*1024)).toFixed(2)}GB / \${trafficLimit ? (trafficLimit / (1024*1024*1024)).toFixed(0) + 'GB' : 'Безлимит'}"

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
\`;
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

    let expiryNodeText = expires_at ? \`⏳ До окончания подписки - \${daysLeft} дней\` : \`⏳ Подписка бессрочная (активна)\`;
    if (isExpired) {
      expiryNodeText = \`❌ Подписка ИСТЕКЛА (\${new Date(expires_at).toLocaleDateString()}) — продлите её в боте!\`;
    } else if (isSuspended) {
      expiryNodeText = \`❌ Подписка ЗАБЛОКИРОВАНА (статус: \${status}) — свяжитесь с поддержкой!\`;
    }

    // Determine nodes
    const isUuid = !subscription_key.startsWith('vless://') && !subscription_key.startsWith('vmess://');
    let proxyConfigs = [];
    
    if (!isExpired && !isSuspended && subscription_key) {
      const { data: servers } = await supabase.from('vpn_servers').select('*').order('name');
      
      const serverIp = process.env.VLESS_SERVER_IP;
      const port = process.env.VLESS_PORT || '443';
      const pbk = process.env.VLESS_PBK;
      const sni = process.env.VLESS_SNI || 'yahoo.com';
      const sid = process.env.VLESS_SID || '';
      const fp = process.env.VLESS_FP || 'chrome';
      const flow = process.env.VLESS_FLOW || 'xtls-rprx-vision';

      // Use static regions if DB is empty or lacks IP/PBK
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

      if (isUuid && serverIp && pbk) {
        staticRegions.forEach(region => {
          proxyConfigs.push({
            name: region,
            server: serverIp,
            port: port,
            uuid: subscription_key,
            pbk: pbk,
            sni: sni,
            sid: sid,
            fp: fp,
            flow: flow
          });
        });
      }
    }

    // Set auto-update headers for ALL clients
    res.setHeader('profile-update-interval', '24');
    res.setHeader('profile-title', 'Veil.Net 🚀');
    res.setHeader('Subscription-Userinfo', \`upload=0; download=\${traffic_used}; total=\${totalTraffic}; expire=\${expireTimestamp}\`);
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
      // Return Base64 for standard clients (v2rayNG, Shadowrocket, Streisand)
      let vlessLinks = proxyConfigs.map(p => {
        return \`vless://\${p.uuid}@\${p.server}:\${p.port}?type=tcp&security=reality&pbk=\${encodeURIComponent(p.pbk)}&sni=\${encodeURIComponent(p.sni)}&fp=\${p.fp}&sid=\${p.sid}&spx=%2F&flow=\${p.flow}#\${encodeURIComponent(p.name)}\`;
      });

      // Avoid ping errors on fake nodes by omitting host and using proper remarks
      const fakeNodes = [
        \`vless://00000000-0000-0000-0000-000000000000@1.1.1.1:80?type=tcp&security=none#\${encodeURIComponent(expiryNodeText)}\`,
        \`vless://00000000-0000-0000-0000-000000000000@1.1.1.1:80?type=tcp&security=none#\${encodeURIComponent('🛠 Техподдержка - нажмите на Самолетик 🛩')}\`,
        \`vless://00000000-0000-0000-0000-000000000000@1.1.1.1:80?type=tcp&security=none#\${encodeURIComponent('🌐 veil.net - подключение без ограничений 😎')}\`
      ];

      const finalCopyText = fakeNodes.join('\\n') + '\\n' + vlessLinks.join('\\n');
      const base64Data = Buffer.from(finalCopyText).toString('base64');
      
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.status(200).send(base64Data);
    }

  } catch (err) {
    console.error('Error fetching subscription:', err);
    return res.status(500).send('Internal Server Error');
  }
}
