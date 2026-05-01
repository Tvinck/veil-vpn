import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const XUI_URL = process.env.XUI_URL || 'http://95.140.154.47:2053';
const XUI_USER = process.env.XUI_USER || 'admin';
const XUI_PASS = process.env.XUI_PASS;
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || '';

export default async function handler(req, res) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const results = [];

    try {
        // 1. Check all online servers
        const { data: servers } = await supabase
            .from('veil_servers')
            .select('*')
            .in('status', ['online', 'active']);

        for (const server of (servers || [])) {
            const check = { 
                id: server.id, 
                name: server.name, 
                host: server.host,
                status: 'unknown',
                latency: null 
            };

            try {
                // Try to reach the panel login page
                const start = Date.now();
                const resp = await fetch(`http://${server.host}:2053/login`, {
                    method: 'GET',
                    signal: AbortSignal.timeout(8000)
                });
                
                check.latency = Date.now() - start;
                check.status = resp.status < 500 ? 'healthy' : 'degraded';
                check.httpCode = resp.status;
            } catch (e) {
                check.status = 'down';
                check.error = e.message;

                // Update server status in DB
                await supabase
                    .from('veil_servers')
                    .update({ status: 'offline' })
                    .eq('id', server.id);

                // Alert admin via Telegram
                if (ADMIN_CHAT_ID && BOT_TOKEN) {
                    try {
                        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                chat_id: ADMIN_CHAT_ID,
                                text: `🔴 SERVER DOWN: ${server.name} (${server.host})\n⏰ ${new Date().toISOString()}\n❌ ${e.message}`,
                                parse_mode: 'HTML'
                            })
                        });
                    } catch (_) {}
                }
            }

            results.push(check);
        }

        // 2. Deactivate expired subscription keys
        const { data: expiredUsers } = await supabase
            .from('veil_users')
            .select('id')
            .lt('subscription_expires_at', new Date().toISOString())
            .neq('subscription_tier', 'free');

        let deactivatedKeys = 0;
        if (expiredUsers && expiredUsers.length > 0) {
            const userIds = expiredUsers.map(u => u.id);
            // Count active keys before deactivating
            const { count: activeCount } = await supabase
                .from('veil_keys')
                .select('*', { count: 'exact', head: true })
                .in('user_id', userIds)
                .eq('is_active', true);

            // Deactivate keys
            await supabase
                .from('veil_keys')
                .update({ is_active: false })
                .in('user_id', userIds)
                .eq('is_active', true);
            
            deactivatedKeys = activeCount || 0;
            
            // Reset tier to free
            await supabase
                .from('veil_users')
                .update({ subscription_tier: 'free' })
                .in('id', userIds);
        }

        // 3. Restore servers that were marked offline but are now reachable
        for (const r of results) {
            if (r.status === 'healthy') {
                await supabase
                    .from('veil_servers')
                    .update({ status: 'online' })
                    .eq('id', r.id)
                    .neq('status', 'coming_soon');
            }
        }

        return res.status(200).json({
            ok: true,
            timestamp: new Date().toISOString(),
            servers: results,
            expired: {
                users: expiredUsers?.length || 0,
                keysDeactivated: deactivatedKeys
            }
        });

    } catch (error) {
        console.error('Health check error:', error);
        return res.status(500).json({ ok: false, error: error.message });
    }
}
