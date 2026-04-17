import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_USERNAME = 'artykosh';

function verifyTelegramWebAppData(initData) {
    if (!initData) return false;
    try {
        const urlParams = new URLSearchParams(initData);
        const hash = urlParams.get('hash');
        urlParams.delete('hash');
        urlParams.sort();

        let dataCheckString = '';
        for (const [key, value] of urlParams.entries()) {
            dataCheckString += `${key}=${value}\n`;
        }
        dataCheckString = dataCheckString.slice(0, -1);

        const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
        const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

        return calculatedHash === hash;
    } catch (e) {
        return false;
    }
}

function extractUsername(initData) {
    try {
        const urlParams = new URLSearchParams(initData);
        const userJson = urlParams.get('user');
        if (userJson) {
            const user = JSON.parse(userJson);
            return user.username?.toLowerCase() || '';
        }
    } catch (e) {}
    return '';
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { initData, action, targetUserId, data } = req.body;
    
    if (!initData || !action || !targetUserId) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify Telegram auth
    const isValid = verifyTelegramWebAppData(initData);
    if (!isValid && process.env.NODE_ENV === 'production') {
        return res.status(401).json({ error: 'Invalid init data' });
    }

    // Verify admin username
    const username = extractUsername(initData);
    if (username !== ADMIN_USERNAME.toLowerCase()) {
        return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    try {
        switch (action) {
            case 'ban': {
                const { error } = await supabase
                    .from('veil_users')
                    .update({ is_banned: true })
                    .eq('id', targetUserId);
                if (error) throw error;
                return res.json({ success: true, message: 'User banned' });
            }

            case 'unban': {
                const { error } = await supabase
                    .from('veil_users')
                    .update({ is_banned: false })
                    .eq('id', targetUserId);
                if (error) throw error;
                return res.json({ success: true, message: 'User unbanned' });
            }

            case 'add_subscription': {
                const days = data?.days || 30;
                const { data: user } = await supabase
                    .from('veil_users')
                    .select('subscription_expires_at')
                    .eq('id', targetUserId)
                    .single();

                const now = new Date();
                let currentExp = (user?.subscription_expires_at && new Date(user.subscription_expires_at) > now)
                    ? new Date(user.subscription_expires_at)
                    : now;
                
                const newExp = new Date(currentExp);
                newExp.setDate(newExp.getDate() + days);

                const { error } = await supabase
                    .from('veil_users')
                    .update({ subscription_expires_at: newExp.toISOString() })
                    .eq('id', targetUserId);
                if (error) throw error;
                return res.json({ success: true, message: `Subscription extended by ${days} days`, newExpiry: newExp.toISOString() });
            }

            default:
                return res.status(400).json({ error: `Unknown action: ${action}` });
        }
    } catch (err) {
        console.error('Admin action error:', err);
        return res.status(500).json({ error: 'Internal error' });
    }
}
