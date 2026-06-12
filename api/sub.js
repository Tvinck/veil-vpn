import { createClient } from '@supabase/supabase-js'

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

export default async function handler(req, res) {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send('Token is required');
  }

  // Use environment variables available in Vercel
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase credentials not configured in Vercel');
    return res.status(500).send('Server configuration error');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { data: subscription, error } = await supabase
      .from('vpn_subscriptions')
      .select('traffic_used, traffic_limit, expires_at, subscription_key')
      .eq('token', token)
      .single();

    if (error || !subscription) {
      return res.status(404).send('Subscription not found');
    }

    const { traffic_used, traffic_limit, expires_at, subscription_key } = subscription;

    // Default limit to 500GB (536870912000 bytes) if null, or a huge number to show "infinity"
    const totalTraffic = traffic_limit || 536870912000;
    
    // Calculate expiration in seconds timestamp
    let expireTimestamp = 0;
    let daysLeft = 0;
    if (expires_at) {
      const expDate = new Date(expires_at);
      expireTimestamp = Math.floor(expDate.getTime() / 1000);
      const diffMs = expDate.getTime() - Date.now();
      daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (daysLeft < 0) daysLeft = 0;
    }

    // Fetch vpn_servers from Supabase in real-time
    const { data: servers } = await supabase
      .from('vpn_servers')
      .select('*')
      .order('name');

    let vlessLinks = [];
    if (subscription_key) {
      const isUuid = !subscription_key.startsWith('vless://') && !subscription_key.startsWith('vmess://');
      
      if (isUuid) {
        if (servers && servers.length > 0) {
          for (const s of servers) {
            if (s.ip_address && s.reality_public_key) {
              const srvPort = s.port || 443;
              const srvSni = s.reality_sni || 'yahoo.com';
              const srvSid = s.reality_short_id || '';
              const srvFlow = s.reality_flow || 'xtls-rprx-vision';
              const emoji = getFlagEmoji(s.country_code);
              const nodeName = `${emoji} ${s.name || 'Сервер'} (Premium)`;
              const link = `vless://${subscription_key}@${s.ip_address}:${srvPort}?type=tcp&security=reality&pbk=${s.reality_public_key}&sni=${srvSni}&fp=chrome&sid=${srvSid}&spx=%2F&flow=${srvFlow}#${nodeName}`;
              vlessLinks.push(link);
            }
          }
        }
        
        // Fallback to env-vars if database doesn't have custom servers with keys
        if (vlessLinks.length === 0) {
          const serverIp = process.env.VLESS_SERVER_IP;
          const port = process.env.VLESS_PORT || '443';
          const pbk = process.env.VLESS_PBK;
          const sni = process.env.VLESS_SNI || 'yahoo.com';
          const sid = process.env.VLESS_SID || '';
          const fp = process.env.VLESS_FP || 'chrome';
          const type = process.env.VLESS_TYPE || 'tcp';
          const flow = process.env.VLESS_FLOW || 'xtls-rprx-vision';

          if (serverIp && pbk) {
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
            const baseUrl = `vless://${subscription_key}@${serverIp}:${port}?type=${type}&security=reality&pbk=${pbk}&sni=${sni}&fp=${fp}&sid=${sid}&spx=%2F&flow=${flow}`;
            vlessLinks = staticRegions.map(region => `${baseUrl}#${region}`);
          }
        }
      } else {
        // subscription_key is already a full node URL
        const baseUrl = subscription_key.split('#')[0];
        if (servers && servers.length > 0) {
          for (const s of servers) {
            const emoji = getFlagEmoji(s.country_code);
            const nodeName = `${emoji} ${s.name || 'Сервер'} (Premium)`;
            vlessLinks.push(`${baseUrl}#${nodeName}`);
          }
        }
        if (vlessLinks.length === 0) {
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
          vlessLinks = staticRegions.map(region => `${baseUrl}#${region}`);
        }
      }
    }

    const expiryNodeText = expires_at ? `⏳ До окончания подписки - ${daysLeft} дней` : `⏳ Подписка бессрочная (активна)`;

    const fakeNodes = [
      `vless://00000000-0000-0000-0000-000000000000@127.0.0.1:443?type=tcp&security=none#${expiryNodeText}`,
      `vless://00000000-0000-0000-0000-000000000000@127.0.0.1:443?type=tcp&security=none#🛠 Техподдержка - нажмите на Самолетик 🛩`,
      `vless://00000000-0000-0000-0000-000000000000@127.0.0.1:443?type=tcp&security=none#🌐 veil-vpn.com - купить VPN без VPN 😎`
    ];

    const finalCopyText = fakeNodes.join('\n') + '\n' + vlessLinks.join('\n');

    // Set standard X-UI subscription headers
    res.setHeader('profile-update-interval', '24');
    res.setHeader('profile-title', 'Veil VPN 🚀');
    res.setHeader('Subscription-Userinfo', `upload=0; download=${traffic_used}; total=${totalTraffic}; expire=${expireTimestamp}`);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    
    // Convert to Base64 (Standard for v2ray subscriptions)
    const base64Data = Buffer.from(finalCopyText).toString('base64');
    
    return res.status(200).send(base64Data);

  } catch (err) {
    console.error('Error fetching subscription:', err);
    return res.status(500).send('Internal Server Error');
  }
}
