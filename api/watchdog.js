import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || ''; // Your Telegram user ID for alerts

async function sendTelegramAlert(message) {
    if (!BOT_TOKEN || !ADMIN_CHAT_ID) return;
    try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: ADMIN_CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });
    } catch (e) {
        console.error('Failed to send Telegram alert:', e);
    }
}

async function checkAndRestartXUI(serverConfig) {
    const { name, host, xui_port, xui_user, xui_pass } = serverConfig;
    const xuiUrl = `http://${host}:${xui_port}`;
    
    // Step 1: Check if x-ui is reachable
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch(`${xuiUrl}/login`, {
            signal: controller.signal
        });
        
        clearTimeout(timeout);
        
        if (response.ok) {
            // x-ui is running, now check xray status
            try {
                const loginResp = await fetch(`${xuiUrl}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `username=${encodeURIComponent(xui_user)}&password=${encodeURIComponent(xui_pass)}`
                });
                
                const cookies = loginResp.headers.get('set-cookie') || '';
                
                if (cookies) {
                    const statusResp = await fetch(`${xuiUrl}/server/status`, {
                        headers: { 'Cookie': cookies }
                    });
                    
                    if (statusResp.ok) {
                        const data = await statusResp.json();
                        if (data.success && data.obj) {
                            const xrayVersion = data.obj.xray?.version;
                            if (!xrayVersion) {
                                // xray core is not running — restart
                                console.log(`⚠️ [${name}] xray core not running, attempting restart...`);
                                
                                const restartResp = await fetch(`${xuiUrl}/server/restartXrayService`, {
                                    method: 'POST',
                                    headers: { 'Cookie': cookies }
                                });
                                
                                if (restartResp.ok) {
                                    await sendTelegramAlert(`🔄 <b>Watchdog:</b> xray на <b>${name}</b> был перезапущен автоматически.`);
                                    return { status: 'restarted', server: name };
                                } else {
                                    await sendTelegramAlert(`🚨 <b>Watchdog:</b> Не удалось перезапустить xray на <b>${name}</b>!`);
                                    return { status: 'restart_failed', server: name };
                                }
                            }
                            return { status: 'healthy', server: name, xray: xrayVersion };
                        }
                    }
                }
            } catch (apiErr) {
                console.error(`[${name}] API check error:`, apiErr.message);
            }
            
            return { status: 'panel_ok_api_fail', server: name };
        }
    } catch (err) {
        // x-ui panel is completely unreachable
        console.error(`🚨 [${name}] Panel unreachable:`, err.message);
        await sendTelegramAlert(`🚨 <b>Watchdog ALERT:</b> x-ui на <b>${name}</b> (${host}) не отвечает! Требуется ручное вмешательство.`);
        return { status: 'unreachable', server: name, error: err.message };
    }
    
    return { status: 'unknown', server: name };
}

export default async function handler(req, res) {
    // This endpoint is designed to be called by a cron job (Vercel Cron)
    // Also can be called manually from admin panel
    
    // Auth: either cron secret or admin initData
    const cronSecret = req.headers['authorization'];
    const isAuthorizedCron = cronSecret === `Bearer ${process.env.CRON_SECRET}`;
    
    // Or admin check
    let isAdmin = false;
    if (req.method === 'POST') {
        try {
            const params = new URLSearchParams(req.body?.initData || '');
            const userData = params.get('user');
            const user = userData ? JSON.parse(userData) : null;
            isAdmin = user?.username === 'artykosh';
        } catch {}
    }
    
    if (!isAuthorizedCron && !isAdmin && req.method !== 'GET') {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const results = [];

    try {
        // Fetch ALL servers from DB except coming soon
        const { data: servers } = await supabase
            .from('veil_servers')
            .select('id, name, host, status')
            .neq('status', 'coming_soon');

        if (!servers || servers.length === 0) {
            return res.status(200).json({ timestamp: new Date().toISOString(), results: [], note: 'No active servers' });
        }

        for (const server of servers) {
            // Get credentials dynamically based on country/ID, fallback to defaults
            const xui_port = process.env[`${server.country_code}_XUI_PORT`] || process.env.XUI_PORT || '2053';
            const xui_user = process.env[`${server.country_code}_XUI_USER`] || process.env.XUI_USER || 'admin';
            const xui_pass = process.env[`${server.country_code}_XUI_PASS`] || process.env.XUI_PASS || '';

            if (!xui_pass) {
                results.push({ status: 'skipped', server: server.name, reason: 'No credentials' });
                continue;
            }
            
            const result = await checkAndRestartXUI({
                name: server.name,
                host: server.host,
                xui_port,
                xui_user,
                xui_pass
            });
            
            results.push(result);

            // Update server status in DB based on watchdog result
            if (result.status === 'unreachable') {
                if (server.status !== 'maintenance') {
                    await supabase.from('veil_servers').update({ status: 'maintenance' }).eq('id', server.id);
                }
            } else if (result.status === 'healthy' || result.status === 'restarted') {
                if (server.status !== 'online') {
                    await supabase.from('veil_servers').update({ status: 'online' }).eq('id', server.id);
                }
            }
        }

        return res.status(200).json({ 
            timestamp: new Date().toISOString(),
            results 
        });
    } catch (dbErr) {
        console.error('Watchdog DB error:', dbErr);
        return res.status(500).json({ error: 'Failed to fetch servers' });
    }
}

