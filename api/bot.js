import { Telegraf, Markup } from 'telegraf';
import { createClient } from '@supabase/supabase-js';

const WEBAPP_URL = process.env.WEBAPP_URL || 'https://veil-vpn.vercel.app';
const BOT_TOKEN = process.env.BOT_TOKEN;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!BOT_TOKEN) throw new Error("BOT_TOKEN is missing");
const bot = new Telegraf(BOT_TOKEN);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const REFERRAL_BONUS_DAYS = 3;

bot.start(async (ctx) => {
    try {
        await ctx.setChatMenuButton({
            type: 'web_app',
            text: '🔑 Открыть VPN',
            web_app: { url: WEBAPP_URL }
        });

        // ── Parse referral code from /start payload ──
        const startPayload = ctx.startPayload; // e.g. "VEIL-12345"
        const telegramId = ctx.from.id;

        if (startPayload && startPayload.startsWith('VEIL-')) {
            const refCode = startPayload; // e.g. "VEIL-56799"

            // Check if this user already exists
            const { data: existingUser } = await supabase
                .from('veil_users')
                .select('id, referred_by')
                .eq('telegram_id', telegramId)
                .single();

            // Find the referrer by exact referral_code
            const { data: referrer } = await supabase
                .from('veil_users')
                .select('id, telegram_id, subscription_expires_at, total_referrals')
                .eq('referral_code', refCode)
                .single();

            if (referrer) {
                // ── ANTI-FRAUD: Self-referral check ──
                if (String(referrer.telegram_id) === String(telegramId)) {
                    console.log(`⚠️ Self-referral blocked: ${telegramId}`);
                } else if (!existingUser) {
                    // New user — create pending referral (will be processed by sync-user)
                    await supabase.from('veil_referrals').insert({
                        referrer_id: referrer.id,
                        referrer_telegram_id: referrer.telegram_id,
                        referred_telegram_id: telegramId,
                        bonus_days: REFERRAL_BONUS_DAYS,
                        status: 'pending'
                    });
                    console.log(`📎 Referral registered: ${telegramId} -> referrer ${referrer.telegram_id}`);
                } else if (existingUser && !existingUser.referred_by) {
                    // Existing user but no referrer yet — late referral binding
                    // This handles the case where user opened the app before clicking referral link
                    
                    // Check if this user was already referred (anti-duplicate)
                    const { data: existingRef } = await supabase
                        .from('veil_referrals')
                        .select('id')
                        .eq('referred_telegram_id', telegramId)
                        .in('status', ['pending', 'completed'])
                        .single();

                    if (!existingRef) {
                        // Award bonus directly (user already exists, no need for pending)
                        const now = new Date();
                        let expiry = referrer.subscription_expires_at 
                            ? new Date(referrer.subscription_expires_at) 
                            : now;
                        if (expiry < now) expiry = now;
                        expiry.setDate(expiry.getDate() + REFERRAL_BONUS_DAYS);

                        await supabase.from('veil_users')
                            .update({
                                subscription_expires_at: expiry.toISOString(),
                                total_referrals: (referrer.total_referrals || 0) + 1
                            })
                            .eq('id', referrer.id);

                        await supabase.from('veil_users')
                            .update({ referred_by: referrer.id })
                            .eq('id', existingUser.id);

                        await supabase.from('veil_referrals').insert({
                            referrer_id: referrer.id,
                            referrer_telegram_id: referrer.telegram_id,
                            referred_telegram_id: telegramId,
                            referred_user_id: existingUser.id,
                            bonus_days: REFERRAL_BONUS_DAYS,
                            status: 'completed',
                            completed_at: new Date().toISOString()
                        });

                        console.log(`✅ Late referral completed: ${telegramId} -> referrer ${referrer.telegram_id}, +${REFERRAL_BONUS_DAYS} days`);
                    }
                } else {
                    console.log(`⚠️ User ${telegramId} already referred, ignoring.`);
                }
            }
        }

        const welcomeText = `👋 Добро пожаловать в **VEIL VPN**!\n\n` +
            `Мы предоставляем быстрый, безопасный и неблокируемый VPN доступ во всем мире.\n\n` +
            `👇 Нажмите кнопку ниже, чтобы запустить приложение и управлять подпиской!`;

        await ctx.replyWithMarkdown(welcomeText, Markup.inlineKeyboard([
            Markup.button.webApp('🚀 Открыть приложение', WEBAPP_URL)
        ]));
    } catch (error) {
        console.error('Error in /start:', error);
    }
});

bot.help((ctx) => {
    ctx.reply('Нужна помощь? Напишите в поддержку или используйте кнопку меню для запуска интерфейса VPN.');
});

bot.on('pre_checkout_query', (ctx) => {
    return ctx.answerPreCheckoutQuery(true);
});

bot.on('successful_payment', async (ctx) => {
    const payment = ctx.message.successful_payment;
    console.log('✅ Successful Payment:', payment);

    const payload = payment.invoice_payload;
    if (payload && payload.startsWith('sub_')) {
        const parts = payload.split('_'); // sub_123456_30
        const telegramIdFromPayload = parseInt(parts[1]);
        const planDuration = parseInt(parts[2]);

        try {
            // Fetch user by telegram_id — get UUID for transactions
            const { data: user, error: fetchErr } = await supabase
                .from('veil_users')
                .select('id, subscription_expires_at')
                .eq('telegram_id', telegramIdFromPayload)
                .single();

            if (!fetchErr && user) {
                const now = new Date();
                let currentExp = user.subscription_expires_at ? new Date(user.subscription_expires_at) : now;
                if (currentExp < now) currentExp = now;

                currentExp.setDate(currentExp.getDate() + planDuration);

                // Update subscription — use subscription_tier (not subscription_status)
                const { error: updateErr } = await supabase
                    .from('veil_users')
                    .update({
                        subscription_expires_at: currentExp.toISOString(),
                        subscription_tier: 'premium'
                    })
                    .eq('telegram_id', telegramIdFromPayload);

                if (!updateErr) {
                    await ctx.reply(`🎉 Спасибо за покупку! Ваша PRO-подписка успешно продлена на ${planDuration} дней.`);
                    
                    // Record transaction with correct UUID user_id
                    await supabase.from('veil_transactions').insert({
                        user_id: user.id,  // UUID, not telegram_id string
                        amount: payment.total_amount,
                        currency: payment.currency,
                        status: 'completed',
                        payment_method: 'telegram_stars'
                    });
                    
                    // Also record in veil_payments
                    await supabase.from('veil_payments').insert({
                        user_id: user.id,
                        amount: payment.total_amount,
                        currency: payment.currency,
                        tier: 'premium',
                        duration_days: planDuration,
                        payment_method: 'telegram_stars',
                        status: 'completed'
                    });
                    
                    return;
                } else {
                    console.error('❌ Update subscription error:', updateErr);
                }
            } else {
                console.error('❌ User not found for payment:', telegramIdFromPayload, fetchErr);
            }
        } catch (dbError) {
            console.error('Error updating DB after payment:', dbError);
        }
    }
    await ctx.reply('🎉 Платёж успешен, но возникла небольшая проблема при начислении. Пожалуйста, напишите в поддержку.');
});

// Экспорт обработчика для Vercel Serverless
export default async function handler(request, response) {
    if (request.method === 'POST') {
        try {
            await bot.handleUpdate(request.body, response);
        } catch (e) {
            console.error(e);
            response.status(500).send('Error');
        }
    } else {
        try {
            const url = 'https://veil-vpn.vercel.app/api/bot';
            await bot.telegram.setWebhook(url, {
                allowed_updates: ['message', 'pre_checkout_query']
            });
            response.status(200).send(`Bot backend is running. Webhook set successfully to ${url}`);
        } catch (error) {
            response.status(500).send('Failed to set webhook: ' + error.message);
        }
    }
}
