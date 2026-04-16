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
        await ctx.setChatMenuButton({
            type: 'web_app',
            text: '🔑 Открыть VPN',
            web_app: { url: WEBAPP_URL }
        });

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

    // payload содержит данные, которые мы передали при создании инвойса (например: userId_planId)
    const payload = payment.invoice_payload;
    if (payload.startsWith('sub_')) {
        const [_, userId, planDurationStr] = payload.split('_'); // sub_123456_30
        const planDuration = parseInt(planDurationStr);

        try {
            // Если платеж прошел, начисляем подписку пользователю
            const { data: user, error: fetchErr } = await supabase
                .from('veil_users')
                .select('subscription_expires_at')
                .eq('telegram_id', userId)
                .single();

            if (!fetchErr && user) {
                const now = new Date();
                let currentExp = user.subscription_expires_at ? new Date(user.subscription_expires_at) : now;
                if (currentExp < now) currentExp = now; // Если просрочено, отсчет заново

                currentExp.setDate(currentExp.getDate() + planDuration); // Добавляем дни подписки

                const { error: updateErr } = await supabase
                    .from('veil_users')
                    .update({
                        subscription_expires_at: currentExp.toISOString(),
                        subscription_status: 'premium'
                    })
                    .eq('telegram_id', userId);

                if (!updateErr) {
                    await ctx.reply(`🎉 Спасибо за покупку! Ваша PRO-подписка успешно продлена на ${planDuration} дней.`);
                    
                    // Также логируем транзакцию
                    await supabase.from('veil_transactions').insert({
                        user_id: userId,
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
