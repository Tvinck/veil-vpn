import dotenv from 'dotenv';
dotenv.config();
import { Telegraf, Markup } from 'telegraf';
import express from 'express';
import cors from 'cors';
import { supabase } from './supabaseClient.js';

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

app.use(cors());
app.use(express.json());

const WEBAPP_URL = process.env.WEBAPP_URL || 'https://veil-vpn.vercel.app';

// =======================
// TELEGRAM BOT LOGIC
// =======================

bot.start(async (ctx) => {
    try {
        // Parse referral code from deep link: /start VEIL-XXXXX
        const startPayload = ctx.startPayload; // e.g. "VEIL-12345"
        let webAppUrl = WEBAPP_URL;
        
        if (startPayload && startPayload.startsWith('VEIL-')) {
            webAppUrl = `${WEBAPP_URL}?ref=${startPayload}`;
            console.log(`📎 Referral deep link: ${startPayload} from user ${ctx.from.id}`);
            
            // Create pending referral in DB
            try {
                // Find the referrer by referral_code
                const { data: referrer } = await supabase
                    .from('veil_users')
                    .select('id, telegram_id')
                    .eq('referral_code', startPayload)
                    .single();
                
                if (referrer && String(referrer.telegram_id) !== String(ctx.from.id)) {
                    // Check if this user already has a referral (prevent duplicates)
                    const { data: existing } = await supabase
                        .from('veil_referrals')
                        .select('id')
                        .eq('referred_telegram_id', ctx.from.id)
                        .in('status', ['pending', 'completed'])
                        .limit(1);
                    
                    if (!existing || existing.length === 0) {
                        await supabase.from('veil_referrals').insert({
                            referrer_id: referrer.id,
                            referrer_telegram_id: referrer.telegram_id,
                            referred_telegram_id: ctx.from.id,
                            status: 'pending'
                        });
                        console.log(`✅ Pending referral created: ${ctx.from.id} → referrer ${referrer.telegram_id}`);
                    }
                } else if (referrer && String(referrer.telegram_id) === String(ctx.from.id)) {
                    console.log(`🚫 Self-referral blocked for ${ctx.from.id}`);
                }
            } catch (refErr) {
                console.error('Referral creation error:', refErr.message);
            }
        }

        await ctx.setChatMenuButton({
            type: 'web_app',
            text: '🔑 Открыть VPN',
            web_app: { url: WEBAPP_URL }
        });

        const welcomeText = `👋 Добро пожаловать в **VEIL VPN**!\n\n` +
            `Мы предоставляем быстрый, безопасный и неблокируемый VPN доступ во всем мире.\n\n` +
            `👇 Нажмите кнопку ниже, чтобы запустить приложение и управлять подпиской!`;

        await ctx.replyWithMarkdown(welcomeText, Markup.inlineKeyboard([
            Markup.button.webApp('🚀 Открыть приложение', webAppUrl)
        ]));
    } catch (error) {
        console.error('Error in /start:', error);
    }
});

bot.help((ctx) => {
    ctx.reply('Нужна помощь? Напишите в поддержку или используйте кнопку меню для запуска интерфейса VPN.');
});

// Обработка Pre-Checkout Query (проверка перед подтверждением покупки)
bot.on('pre_checkout_query', (ctx) => {
    // В реальном приложении здесь можно проверять наличие юзера в БД или статус сервера.
    // Если всё ок — одобряем.
    return ctx.answerPreCheckoutQuery(true);
});

// Обработка успешного платежа
bot.on('successful_payment', async (ctx) => {
    const payment = ctx.message.successful_payment;
    console.log('✅ Successful Payment:', payment);

    // payload: sub_{telegramId}_{days}
    const payload = payment.invoice_payload;
    if (payload.startsWith('sub_')) {
        const [_, tgIdStr, planDurationStr] = payload.split('_');
        const telegramId = parseInt(tgIdStr);
        const planDuration = parseInt(planDurationStr);

        try {
            // Fetch user by telegram_id to get UUID + current expiry
            const { data: user, error: fetchErr } = await supabase
                .from('veil_users')
                .select('id, subscription_expires_at')
                .eq('telegram_id', telegramId)
                .single();

            if (!fetchErr && user) {
                const now = new Date();
                let currentExp = user.subscription_expires_at ? new Date(user.subscription_expires_at) : now;
                if (currentExp < now) currentExp = now;

                currentExp.setDate(currentExp.getDate() + planDuration);

                const { error: updateErr } = await supabase
                    .from('veil_users')
                    .update({
                        subscription_expires_at: currentExp.toISOString(),
                        subscription_tier: 'premium'
                    })
                    .eq('telegram_id', telegramId);

                if (!updateErr) {
                    await ctx.reply(`🎉 Спасибо за покупку! Ваша PRO-подписка успешно продлена на ${planDuration} дней.`);
                    
                    // Log transaction with correct UUID (not telegram_id!)
                    await supabase.from('veil_transactions').insert({
                        user_id: user.id,
                        type: 'subscription',
                        amount: payment.total_amount,
                        currency: payment.currency,
                        status: 'completed',
                        payment_method: 'telegram_stars'
                    });
                    
                    return;
                }
            }
        } catch (dbError) {
            console.error('Error updating DB after payment:', dbError);
        }
    }

    ctx.reply('🎉 Платёж успешен, но возникла небольшая проблема при начислении подписки. Пожалуйста, напишите в поддержку.');
});

// =======================
// EXPRESS SERVER (Для создания инвойсов из WebApp)
// =======================

app.post('/api/create-invoice', async (req, res) => {
    const { userId, title, description, amount, planDuration } = req.body;

    if (!userId || !amount) {
        return res.status(400).json({ error: 'Missing parameters' });
    }

    try {
        // Создаем ссылку на счет через Bot API
        // ВАЖНО: provider_token пустой '' для Telegram Stars
        const invoiceLink = await bot.telegram.createInvoiceLink({
            title: title || 'VEIL VPN Premium',
            description: description || `Подписка на ${planDuration} дней`,
            payload: `sub_${userId}_${planDuration}`, // передаём telegram ID и срок в payload
            provider_token: '',  // Пустой токен = Stars
            currency: 'XTR',     // Telegram Stars валюта
            prices: [{ label: 'Stars', amount: amount }], // amount должен быть целым числом (например, 100 звезд = 100)
        });

        res.json({ invoiceUrl: invoiceLink });
    } catch (error) {
        console.error('Error creating invoice link:', error);
        res.status(500).json({ error: 'Failed to create invoice' });
    }
});

// Запуск бота и сервера
bot.launch()
  .then(() => console.log('🤖 Telegram Bot started!'))
  .catch(err => console.error('❌ Bot Launch Error:', err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 API Server running on port ${PORT}`);
});

// Грейсфул остановка
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
