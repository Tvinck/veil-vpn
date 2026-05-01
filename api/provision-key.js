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

// Double tunnel — second (exit) server credentials
const XUI_EXIT_URL = process.env.XUI_EXIT_URL || XUI_URL;
const XUI_EXIT_USER = process.env.XUI_EXIT_USER || XUI_USER;
const XUI_EXIT_PASS = process.env.XUI_EXIT_PASS || XUI_PASS;
const EXIT_SERVER_IP = process.env.XUI_EXIT_SERVER_IP || SERVER_IP;
const EXIT_PUBLIC_KEY = process.env.XUI_EXIT_PUBLIC_KEY || PUBLIC_KEY;
const EXIT_SHORT_ID = process.env.XUI_EXIT_SHORT_ID || SHORT_ID;

if (!XUI_PASS) {
    console.error('❌ XUI_PASS environment variable is not set!');
}

/** Login to a 3x-ui panel and return session cookie */
async function xuiLogin(url, user, pass) {
    const params = new URLSearchParams();
    params.append('username', user);
    params.append('password', pass);
    const res = await fetch(`${url}/login`, { method: 'POST', body: params });
    const cookie = res.headers.get('set-cookie');
    if (!cookie) throw new Error(`Failed to login to 3x-ui at ${url}`);
    return cookie;
}

/** Add a client to a 3x-ui inbound */
async function xuiAddClient(url, cookie, clientData, inboundId = 1) {
    const res = await fetch(`${url}/panel/api/inbounds/addClient`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': cookie, 'Accept': 'application/json' },
        body: JSON.stringify({ id: inboundId, settings: JSON.stringify({ clients: [clientData] }) })
    });
    const result = await res.json();
    if (!result.success) throw new Error(`3x-ui API error: ${result.msg}`);
    return result;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { user_id, server_id, force_new, double_tunnel } = req.body;
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

        // 2. Check server status — only allow provisioning for online servers
        const { data: server } = await supabase.from('veil_servers')
            .select('status, name')
            .eq('id', server_id).single();
        
        if (!server || server.status !== 'online') {
            return res.status(400).json({ 
                success: false, 
                error: `Сервер "${server?.name || 'Unknown'}" пока недоступен. Выберите активный сервер.`,
                server_unavailable: true
            });
        }

        // 3. Fetch user to verify subscription status and enforce limits
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

        // Double tunnel requires 'pro' tier
        if (double_tunnel && user?.subscription_tier !== 'pro') {
            return res.status(403).json({
                success: false,
                error: 'Double VPN доступен только на тарифе Pro.',
                upgrade_required: true
            });
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

        // 4. Generate client config
        const clientUUID = crypto.randomUUID();
        const subId = crypto.randomBytes(8).toString('hex');
        const email = `veil-user-${tgId}-${Date.now().toString().slice(-4)}`;
        const SNI = process.env.XUI_SNI || 'www.microsoft.com';

        const clientData = {
            id: clientUUID,
            flow: double_tunnel ? '' : 'xtls-rprx-vision',  // No flow for chaining entry
            email: email,
            limitIp: 2,
            totalGB: 0,
            expiryTime: 0,
            enable: true,
            tgId: tgId ? tgId.toString() : '',
            subId: subId
        };

        // ═══════════════════════════════════════════════════
        // DOUBLE TUNNEL: provision on both entry + exit
        // ═══════════════════════════════════════════════════
        if (double_tunnel) {
            // Login to entry server
            const entryCookie = await xuiLogin(XUI_URL, XUI_USER, XUI_PASS);
            await xuiAddClient(XUI_URL, entryCookie, clientData);

            // Login to exit server and add client there too
            const exitUUID = crypto.randomUUID();
            const exitEmail = `veil-exit-${tgId}-${Date.now().toString().slice(-4)}`;
            const exitClientData = {
                ...clientData,
                id: exitUUID,
                email: exitEmail,
                flow: 'xtls-rprx-vision',  // Exit node uses normal flow
                subId: crypto.randomBytes(8).toString('hex'),
            };

            const exitCookie = await xuiLogin(XUI_EXIT_URL, XUI_EXIT_USER, XUI_EXIT_PASS);
            await xuiAddClient(XUI_EXIT_URL, exitCookie, exitClientData);

            // Build double tunnel config URL
            // Entry remark: first hop
            const entryRemark = encodeURIComponent(`🇩🇪 VEIL • Entry → Frankfurt`);
            const exitRemark = encodeURIComponent(`🇩🇪 VEIL • Exit → Frankfurt`);
            const entrySNI = process.env.XUI_ENTRY_SNI || 'dl.google.com';
            const exitSNI = process.env.XUI_EXIT_SNI || SNI;

            // Store both URLs so client can configure chain
            const entryUrl = `vless://${clientUUID}@${SERVER_IP}:443?type=tcp&security=reality&pbk=${PUBLIC_KEY}&fp=chrome&sni=${entrySNI}&sid=${SHORT_ID}&spx=%2F&flow=&encryption=none&headerType=none#${entryRemark}`;
            const exitUrl = `vless://${exitUUID}@${EXIT_SERVER_IP}:443?type=tcp&security=reality&pbk=${EXIT_PUBLIC_KEY}&fp=chrome&sni=${exitSNI}&sid=${EXIT_SHORT_ID}&spx=%2F&flow=xtls-rprx-vision&encryption=none&headerType=none#${exitRemark}`;

            // Combined config URL — both URLs separated by newline (subscription format)
            const configUrl = `${entryUrl}\n${exitUrl}`;

            // Save to database with double_tunnel flag
            const newKey = {
                user_id,
                server_id,
                vless_uuid: clientUUID,
                config_url: configUrl,
                is_active: true,
                is_double_tunnel: true,
            };

            const { data: savedKey, error: saveErr } = await supabase
                .from('veil_keys')
                .insert([newKey])
                .select()
                .single();

            if (saveErr) throw new Error(`DB save error: ${saveErr.message}`);

            return res.status(200).json({ 
                success: true, 
                key: savedKey, 
                double_tunnel: true,
                entry: { ip: SERVER_IP, uuid: clientUUID, sni: entrySNI },
                exit: { ip: EXIT_SERVER_IP, uuid: exitUUID, sni: exitSNI },
            });
        }

        // ═══════════════════════════════════════════════════
        // SINGLE TUNNEL (standard flow)
        // ═══════════════════════════════════════════════════
        const cookie = await xuiLogin(XUI_URL, XUI_USER, XUI_PASS);
        await xuiAddClient(XUI_URL, cookie, { ...clientData, flow: 'xtls-rprx-vision' });

        // Construct VLESS URL
        const remark = encodeURIComponent(`🇩🇪 VEIL • Frankfurt`);
        const configUrl = `vless://${clientUUID}@${SERVER_IP}:443?type=tcp&security=reality&pbk=${PUBLIC_KEY}&fp=chrome&sni=${SNI}&sid=${SHORT_ID}&spx=%2F&flow=xtls-rprx-vision&encryption=none&headerType=none#${remark}`;

        // Save to database
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
