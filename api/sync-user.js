import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BOT_TOKEN = process.env.BOT_TOKEN;

const REFERRAL_BONUS_DAYS = 3;


// Verify Telegram Mini App initData
function verifyTelegramWebAppData(initData) {
    if (!initData) return false;
    
    // For local mocking / dev testing, if it's the exact mock user id and no real initData, allow
    if (initData.includes('12345678') && process.env.NODE_ENV !== 'production') return true;

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

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { initData, tgUser } = req.body;
    
    if (!tgUser || !tgUser.id) {
        return res.status(400).json({ error: 'Missing tgUser data' });
    }

    // Simple auth check in production
    if (initData) {
        const isValid = verifyTelegramWebAppData(initData);
        if (!isValid && process.env.NODE_ENV === 'production') {
            return res.status(401).json({ error: 'Invalid init data' });
        }
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    try {
        let { data: existingUser, error } = await supabase
            .from('veil_users')
            .select('*')
            .eq('telegram_id', tgUser.id)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        if (!existingUser) {
            // ── New user registration — give 3 days free trial ──
            const trialExpiry = new Date();
            trialExpiry.setDate(trialExpiry.getDate() + 3);
            
            // Generate unique referral code: VEIL- + 8 random alphanumeric chars
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No 0/O/1/I confusion
            let refCode = 'VEIL-';
            for (let i = 0; i < 8; i++) {
                refCode += chars.charAt(Math.floor(Math.random() * chars.length));
            }

            const { data: newUser, error: insertError } = await supabase
                .from('veil_users')
                .insert([{
                    telegram_id: tgUser.id,
                    username: tgUser.username,
                    first_name: tgUser.first_name,
                    subscription_tier: 'free',
                    subscription_expires_at: trialExpiry.toISOString(),
                    referral_code: refCode,
                    is_banned: false
                }])
                .select()
                .single();
                
            if (insertError) throw insertError;
            existingUser = newUser;

            // ── Process pending referral (created by bot /start) ──
            const { data: pendingRef } = await supabase
                .from('veil_referrals')
                .select('*')
                .eq('referred_telegram_id', tgUser.id)
                .eq('status', 'pending')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (pendingRef) {
                // ── ANTI-FRAUD CHECKS ──
                
                // 1. Self-referral (should already be blocked in bot, but double-check)
                if (String(pendingRef.referrer_telegram_id) === String(tgUser.id)) {
                    await supabase.from('veil_referrals')
                        .update({ status: 'fraud_self_referral' })
                        .eq('id', pendingRef.id);
                    console.log(`🚫 Self-referral blocked for ${tgUser.id}`);
                } else {
                    // 2. Find referrer and award bonus
                    const { data: referrer } = await supabase
                        .from('veil_users')
                        .select('id, total_referrals, subscription_expires_at')
                        .eq('id', pendingRef.referrer_id)
                        .single();

                    if (referrer) {
                        // ✅ All checks passed — award the bonus
                        const now = new Date();
                        let expiry = referrer.subscription_expires_at 
                            ? new Date(referrer.subscription_expires_at) 
                            : now;
                        if (expiry < now) expiry = now;
                        expiry.setDate(expiry.getDate() + REFERRAL_BONUS_DAYS);

                        // Update referrer: +3 days + increment referral counter
                        await supabase
                            .from('veil_users')
                            .update({
                                subscription_expires_at: expiry.toISOString(),
                                total_referrals: (referrer.total_referrals || 0) + 1
                            })
                            .eq('id', referrer.id);

                        // Update new user: mark who referred them
                        await supabase
                            .from('veil_users')
                            .update({ referred_by: referrer.id })
                            .eq('id', existingUser.id);

                        // Mark referral as completed
                        await supabase.from('veil_referrals')
                            .update({ 
                                status: 'completed',
                                referred_user_id: existingUser.id,
                                completed_at: new Date().toISOString()
                            })
                            .eq('id', pendingRef.id);

                        // Refresh the user data to return the updated version
                        const { data: refreshed } = await supabase
                            .from('veil_users')
                            .select('*')
                            .eq('id', existingUser.id)
                            .single();
                        if (refreshed) existingUser = refreshed;

                        console.log(`✅ Referral completed: ${tgUser.id} referred by ${pendingRef.referrer_telegram_id}, +${REFERRAL_BONUS_DAYS} days`);
                    }
                }
            }
        }

        // Compute is_premium flag
        if (existingUser) {
            existingUser.is_premium = existingUser.subscription_expires_at && new Date(existingUser.subscription_expires_at) > new Date();
        }

        return res.status(200).json({ user: existingUser });

    } catch (error) {
        console.error('Sync User Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
