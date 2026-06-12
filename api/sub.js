import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send('Token is required');
  }

  // Use environment variables available in Vercel
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

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
    if (expires_at) {
      expireTimestamp = Math.floor(new Date(expires_at).getTime() / 1000);
    }

    const regions = [
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

    let finalCopyText = subscription_key;

    // Автоматическая генерация VLESS-ссылки из UUID, если включена через ENV
    if (subscription_key && !subscription_key.startsWith('vless://') && !subscription_key.startsWith('vmess://')) {
      const serverIp = process.env.VLESS_SERVER_IP;
      const port = process.env.VLESS_PORT || '443';
      const pbk = process.env.VLESS_PBK;
      const sni = process.env.VLESS_SNI || 'yahoo.com';
      const sid = process.env.VLESS_SID || '';
      const fp = process.env.VLESS_FP || 'chrome';
      const type = process.env.VLESS_TYPE || 'tcp';
      const flow = process.env.VLESS_FLOW || 'xtls-rprx-vision';

      if (serverIp && pbk) {
        const baseUrl = `vless://${subscription_key}@${serverIp}:${port}?type=${type}&security=reality&pbk=${pbk}&sni=${sni}&fp=${fp}&sid=${sid}&spx=%2F&flow=${flow}`;
        finalCopyText = regions.map(region => `${baseUrl}#${encodeURIComponent(region)}`).join('\n');
      } else {
        // Если переменные не заданы в Vercel, но мы пытаемся вернуть ссылку
        console.warn('VLESS env variables not set. Cannot auto-generate VLESS link from UUID.');
      }
    } else if (subscription_key && (subscription_key.startsWith('vless://') || subscription_key.startsWith('vmess://'))) {
      const baseUrl = subscription_key.split('#')[0];
      finalCopyText = regions.map(region => `${baseUrl}#${encodeURIComponent(region)}`).join('\n');
    }

    // Set standard X-UI subscription headers
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
