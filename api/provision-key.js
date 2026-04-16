import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const XUI_URL = process.env.XUI_URL || 'http://95.140.154.47:2053';
const XUI_USER = process.env.XUI_USER || 'admin';
const XUI_PASS = process.env.XUI_PASS;
const SERVER_IP = process.env.XUI_SERVER_IP || '95.140.154.47';

const PUBLIC_KEY = process.env.XUI_PUBLIC_KEY || 'GQKrWnAmhKsH52QUknCF8HZwfEc53-dYuxcMn0egPmY';
const SHORT_ID = process.env.XUI_SHORT_ID || '85f0b85fc5247fc1';

if (!XUI_PASS) {
    console.error('❌ XUI_PASS environment variable is not set!');
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { user_id, server_id, force_new } = req.body;
    if (!user_id || !server_id) return res.status(400).json({ error: 'Missing user_id or server_id' });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    try {
        // 1. Check if user already has an active key for this server
        if (!force_new) {
            const { data: existingKeys, error: fetchErr } = await supabase
                .from('veil_keys')
                .select('*')
                .eq('user_id', user_id)
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(1);

            if (existingKeys && existingKeys.length > 0) {
                return res.status(200).json({ success: true, key: existingKeys[0] });
            }
        }

        // 2. Fetch user to verify subscription status and enforce limits
        const { data: user } = await supabase.from('veil_users')
            .select('telegram_id, subscription_tier, subscription_expires_at')
            .eq('id', user_id).single();
        const tgId = user ? user.telegram_id : 0;

        // Subscription enforcement — check expiry
        if (user && user.subscription_tier !== 'free') {
            const expiresAt = user.subscription_expires_at ? new Date(user.subscription_expires_at) : null;
            if (expiresAt && expiresAt < new Date()) {
                // Deactivate existing keys
                await supabase.from('veil_keys')
                    .update({ is_active: false })
                    .eq('user_id', user_id)
                    .eq('is_active', true);
                
                return res.status(403).json({ 
                    success: false, 
                    error: 'Подписка истекла. Продлите в разделе Подписка.',
                    expired: true
                });
            }
        }

        // Device limit enforcement
        const maxDevices = user?.subscription_tier === 'pro' ? 3 : 1;
        const { count: activeKeyCount } = await supabase
            .from('veil_keys')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user_id)
            .eq('is_active', true);

        if (activeKeyCount >= maxDevices && !force_new) {
            // Return existing key instead of creating new
            const { data: existingKey } = await supabase
                .from('veil_keys')
                .select('*')
                .eq('user_id', user_id)
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(1);
            
            if (existingKey && existingKey.length > 0) {
                return res.status(200).json({ success: true, key: existingKey[0] });
            }
        }

        // 3. Login to 3x-ui
        const loginParams = new URLSearchParams();
        loginParams.append('username', XUI_USER);
        loginParams.append('password', XUI_PASS);

        const loginRes = await fetch(`${XUI_URL}/login`, {
            method: 'POST',
            body: loginParams
        });
        
        const cookie = loginRes.headers.get('set-cookie');
        if (!cookie) throw new Error('Failed to login to 3x-ui');

        // 4. Generate client config
        const clientUUID = crypto.randomUUID();
        const subId = crypto.randomBytes(8).toString('hex');
        const email = `veil-user-${tgId}-${Date.now().toString().slice(-4)}`;

        const clientData = {
            id: clientUUID,
            flow: 'xtls-rprx-vision',
            email: email,
            limitIp: 2,
            totalGB: 0,
            expiryTime: 0,
            enable: true,
            tgId: tgId ? tgId.toString() : '',
            subId: subId
        };

        // 5. Add client to Inbound #1
        const addRes = await fetch(`${XUI_URL}/panel/api/inbounds/addClient`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookie,
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                id: 1,
                settings: JSON.stringify({ clients: [clientData] })
            })
        });

        const addResult = await addRes.json();
        if (!addResult.success) {
            throw new Error(`3x-ui API error: ${addResult.msg}`);
        }

        // 6. Construct VLESS URL
        const remark = encodeURIComponent(`VEIL-DE-${tgId || 'VPN'}`);
        const configUrl = `vless://${clientUUID}@${SERVER_IP}:443?type=tcp&security=reality&pbk=${PUBLIC_KEY}&fp=chrome&sni=yahoo.com&sid=${SHORT_ID}&spx=%2F&flow=xtls-rprx-vision&encryption=none&headerType=none#${remark}`;

        // 7. Save to database
        const newKey = {
            user_id,
            server_id,
            vless_uuid: clientUUID,
            config_url: configUrl,
            is_active: true
        };

        const { data: savedKey, error: saveErr } = await supabase
            .from('veil_keys')
            .insert([newKey])
            .select()
            .single();

        if (saveErr) throw new Error(`DB save error: ${saveErr.message}`);

        return res.status(200).json({ success: true, key: savedKey });

    } catch (error) {
        console.error('Provisioning error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
