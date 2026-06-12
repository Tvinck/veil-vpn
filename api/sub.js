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
      .from('subscriptions')
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

    if (subscription_key && (subscription_key.startsWith('vless://') || subscription_key.startsWith('vmess://'))) {
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
