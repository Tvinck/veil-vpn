import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const { server_id } = req.query;
    
    if (!server_id) {
        return res.status(400).json({ error: 'Missing server_id' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    try {
        // Get server host
        const { data: server } = await supabase
            .from('veil_servers')
            .select('host, name, status')
            .eq('id', server_id)
            .single();

        if (!server || !server.host) {
            return res.status(404).json({ error: 'Server not found' });
        }
        
        if (server.status === 'coming_soon') {
            return res.status(200).json({ 
                ping: null, 
                status: 'coming_soon',
                server: server.name 
            });
        }

        // Measure RTT by connecting to server port
        const start = Date.now();
        try {
            await fetch(`http://${server.host}:2053/`, {
                method: 'HEAD',
                signal: AbortSignal.timeout(5000)
            });
        } catch (e) {
            // Even a refused connection gives us RTT info
        }
        const rtt = Date.now() - start;

        return res.status(200).json({
            ping: Math.min(rtt, 999),
            status: rtt < 5000 ? 'online' : 'offline',
            server: server.name
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
