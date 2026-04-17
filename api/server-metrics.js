import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Map server IDs to their SSH credentials from env
function getServerCreds(serverId) {
    // Format: SERVER_{id_prefix}_HOST, SERVER_{id_prefix}_PASS
    // For now, hardcode known servers, extensible via env vars
    const servers = {
        'b16d92f5-8e80-4d23-b7a4-8a6b5f8cfb9f': {
            host: process.env.GERMANY_HOST || '95.140.154.47',
            port: process.env.GERMANY_SSH_PORT || '22',
            user: 'root',
            pass: process.env.GERMANY_SSH_PASS || '',
            xui_port: process.env.GERMANY_XUI_PORT || '2053'
        }
    };
    return servers[serverId] || null;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Verify admin access
    const initData = req.body.initData || '';
    const tgUser = (() => {
        try {
            const params = new URLSearchParams(initData);
            const userData = params.get('user');
            return userData ? JSON.parse(userData) : null;
        } catch { return null; }
    })();

    if (!tgUser || tgUser.username !== 'artykosh') {
        return res.status(403).json({ error: 'Access denied' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    try {
        // Fetch all online servers
        const { data: servers } = await supabase
            .from('veil_servers')
            .select('id, name, host, port, status')
            .eq('status', 'online');

        if (!servers || servers.length === 0) {
            return res.status(200).json({ metrics: [] });
        }

        const metrics = [];

        for (const server of servers) {
            const creds = getServerCreds(server.id);
            
            if (!creds || !creds.pass) {
                // No SSH credentials — return estimated metrics from DB
                metrics.push({
                    serverId: server.id,
                    serverName: server.name,
                    cpu: null,
                    ram: null,
                    disk: null,
                    uptime: null,
                    xui_status: null,
                    error: 'No SSH credentials configured'
                });
                continue;
            }

            try {
                // Use x-ui API to check status (faster than SSH)
                const xuiUrl = `http://${creds.host}:${creds.xui_port}`;
                
                // Try to reach x-ui login page (quick connectivity check)
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 5000);
                
                const xuiResponse = await fetch(`${xuiUrl}/login`, {
                    signal: controller.signal,
                    headers: { 'Accept': 'text/html' }
                }).catch(() => null);
                
                clearTimeout(timeout);

                const xuiReachable = xuiResponse && xuiResponse.ok;

                // Use the x-ui API for server status
                // First, login
                let cpu = null, ram = null, disk = null, uptime = null;
                
                if (xuiReachable) {
                    try {
                        const loginResp = await fetch(`${xuiUrl}/login`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: `username=${encodeURIComponent(process.env.XUI_USER || 'admin')}&password=${encodeURIComponent(process.env.XUI_PASS || '')}`,
                        });
                        
                        const cookies = loginResp.headers.get('set-cookie') || '';
                        
                        if (cookies) {
                            // Get server status from x-ui
                            const statusResp = await fetch(`${xuiUrl}/server/status`, {
                                headers: { 'Cookie': cookies }
                            });
                            
                            if (statusResp.ok) {
                                const statusData = await statusResp.json();
                                if (statusData.success && statusData.obj) {
                                    const obj = statusData.obj;
                                    cpu = Math.round(obj.cpu || 0);
                                    
                                    // RAM: convert bytes to percentage
                                    if (obj.mem && obj.mem.total > 0) {
                                        ram = Math.round(((obj.mem.current || 0) / obj.mem.total) * 100);
                                    }
                                    
                                    // Disk usage percentage
                                    if (obj.disk && obj.disk.total > 0) {
                                        disk = Math.round(((obj.disk.current || 0) / obj.disk.total) * 100);
                                    }
                                    
                                    // Uptime in seconds → human readable
                                    if (obj.uptime) {
                                        const days = Math.floor(obj.uptime / 86400);
                                        const hours = Math.floor((obj.uptime % 86400) / 3600);
                                        uptime = `${days}d ${hours}h`;
                                    }
                                }
                            }
                        }
                    } catch (apiErr) {
                        console.error(`x-ui API error for ${server.name}:`, apiErr.message);
                    }
                }

                metrics.push({
                    serverId: server.id,
                    serverName: server.name,
                    cpu,
                    ram,
                    disk,
                    uptime,
                    xui_status: xuiReachable ? 'running' : 'down',
                    error: null
                });
            } catch (serverErr) {
                metrics.push({
                    serverId: server.id,
                    serverName: server.name,
                    cpu: null,
                    ram: null,
                    disk: null,
                    uptime: null,
                    xui_status: 'unknown',
                    error: serverErr.message
                });
            }
        }

        return res.status(200).json({ metrics });
    } catch (error) {
        console.error('Server metrics error:', error);
        return res.status(500).json({ error: 'Failed to fetch metrics' });
    }
}
