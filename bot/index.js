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
const SUPPORT_URL = process.env.SUPPORT_URL || 'https://t.me/veil_support';
const CHANNEL_URL = process.env.CHANNEL_URL || 'https://t.me/veil_vpn_channel';

// ═══════════════════════════════════════════════
// 🎨 BRANDING — Стильные тексты и эмодзи
// ═══════════════════════════════════════════════

const BRAND = {
    logo: '🛡',
    name: 'VEIL VPN',
    tagline: 'Невидимый. Быстрый. Свободный.',
    divider: '━━━━━━━━━━━━━━━━━━━━',
    dot: '▸',
    check: '✦',
    star: '⭐',
    speed: '⚡',
    lock: '🔐',
    globe: '🌍',
    rocket: '🚀',
    gift: '🎁',
    crown: '👑',
    chart: '📊',
    key: '🔑',
    shield: '🛡',
    fire: '🔥',
    sparkle: '✨',
    link: '🔗',
    warn: '⚠️',
    success: '✅',
    heart: '💜',
};

// ═══════════════════════════════════════════════
// 📝 СООБЩЕНИЯ
// ═══════════════════════════════════════════════

function welcomeMessage(firstName) {
    return [
        `${BRAND.shield} *VEIL VPN*`,
        `${BRAND.divider}`,
        ``,
        `Привет, *${firstName}*! ${BRAND.sparkle}`,
        ``,
        `Добро пожаловать в VEIL — VPN нового поколения`,
        `на базе протокола *VLESS + Reality*.`,
        ``,
        `${BRAND.dot} Невозможно заблокировать`,
        `${BRAND.dot} Невозможно обнаружить`,
        `${BRAND.dot} Скорость без ограничений`,
        ``,
        `${BRAND.divider}`,
        `${BRAND.speed} *Серверы:*  🇩🇪 Франкфурт`,
        `${BRAND.lock} *Протокол:*  VLESS Reality`,
        `${BRAND.globe} *Доступ:*  Весь мир без границ`,
        `${BRAND.divider}`,
    ].join('\n');
}

function helpMessage() {
    return [
        `${BRAND.shield} *VEIL VPN — Справка*`,
        `${BRAND.divider}`,
        ``,
        `*Команды:*`,
        ``,
        `/start — Главное меню`,
        `/connect — Получить VPN-ключ ${BRAND.key}`,
        `/status — Статус подписки ${BRAND.chart}`,
        `/servers — Доступные серверы ${BRAND.globe}`,
        `/referral — Реферальная программа ${BRAND.gift}`,
        `/help — Эта справка`,
        ``,
        `${BRAND.divider}`,
        ``,
        `*Как начать:*`,
        ``,
        `1${BRAND.dot} Нажмите /connect или откройте приложение`,
        `2${BRAND.dot} Скопируйте VLESS-ключ`,
        `3${BRAND.dot} Вставьте в *v2rayNG* / *Streisand* / *Hiddify*`,
        `4${BRAND.dot} Готово! ${BRAND.success}`,
        ``,
        `${BRAND.divider}`,
        `${BRAND.heart} Поддержка: @veil\\_support`,
    ].join('\n');
}

function statusMessage(user) {
    const tier = user?.subscription_tier || 'free';
    const tierName = tier === 'pro' ? `${BRAND.crown} PRO` : tier === 'premium' ? `${BRAND.star} Premium` : '🆓 Free';
    const expiresAt = user?.subscription_expires_at;
    let expiryText = 'Бессрочно';
    let daysLeft = '∞';
    
    if (expiresAt) {
        const exp = new Date(expiresAt);
        const now = new Date();
        const diff = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
        daysLeft = diff > 0 ? `${diff} дн.` : 'Истекла';
        expiryText = exp.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    const progressBar = createProgressBar(user);

    return [
        `${BRAND.shield} *VEIL VPN — Статус*`,
        `${BRAND.divider}`,
        ``,
        `${BRAND.dot} *Тариф:*  ${tierName}`,
        `${BRAND.dot} *Осталось:*  ${daysLeft}`,
        `${BRAND.dot} *До:*  ${expiryText}`,
        ``,
        progressBar,
        ``,
        `${BRAND.divider}`,
        tier === 'free' ? `\n${BRAND.fire} Обновитесь до *PRO* для максимальной скорости и 3 устройств!` : '',
    ].join('\n');
}

function createProgressBar(user) {
    if (!user?.subscription_expires_at) return `${'▓'.repeat(10)} 100%`;
    
    const exp = new Date(user.subscription_expires_at);
    const now = new Date();
    const total = 30; // assume 30-day cycle
    const diff = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
    const pct = Math.max(0, Math.min(100, Math.round((diff / total) * 100)));
    const filled = Math.round(pct / 10);
    const empty = 10 - filled;
    
    return `${'▓'.repeat(filled)}${'░'.repeat(empty)} ${pct}%`;
}

function serversMessage() {
    return [
        `${BRAND.shield} *VEIL VPN — Серверы*`,
        `${BRAND.divider}`,
        ``,
        `🇩🇪  *Frankfurt, DE*`,
        `     ${BRAND.check} Статус: Онлайн`,
        `     ${BRAND.check} Нагрузка: Низкая`,
        `     ${BRAND.check} Пинг: ~45ms`,
        `     ${BRAND.check} Протокол: VLESS Reality`,
        `     ${BRAND.check} WARP: Активен`,
        ``,
        `${BRAND.divider}`,
        ``,
        `${BRAND.sparkle} Новые серверы скоро:`,
        `     🇳🇱  Амстердам`,
        `     🇫🇮  Хельсинки`,
        `     🇺🇸  Нью-Йорк`,
        ``,
        `${BRAND.divider}`,
    ].join('\n');
}

function referralMessage(user) {
    const code = user?.referral_code || 'VEIL-XXXXX';
    const refLink = `https://t.me/VeilVPN_bot?start=${code}`;
    
    return [
        `${BRAND.gift} *VEIL VPN — Реферальная программа*`,
        `${BRAND.divider}`,
        ``,
        `Приглашайте друзей и получайте`,
        `*бонусные дни* к подписке! ${BRAND.sparkle}`,
        ``,
        `${BRAND.dot} За каждого друга: *+7 дней* PRO`,
        `${BRAND.dot} Другу: *+3 дня* PRO`,
        ``,
        `${BRAND.divider}`,
        ``,
        `${BRAND.link} *Ваша ссылка:*`,
        `\`${refLink}\``,
        ``,
        `${BRAND.key} *Ваш код:*  \`${code}\``,
        ``,
        `${BRAND.divider}`,
        ``,
        `_Просто отправьте ссылку другу!_`,
    ].join('\n');
}

function connectMessage(configUrl) {
    return [
        `${BRAND.key} *VEIL VPN — Ваш ключ*`,
        `${BRAND.divider}`,
        ``,
        `Скопируйте ключ ниже и вставьте`,
        `в приложение *v2rayNG* / *Streisand* / *Hiddify*`,
        ``,
        `${BRAND.divider}`,
        ``,
        `\`${configUrl}\``,
        ``,
        `${BRAND.divider}`,
        ``,
        `*Инструкция:*`,
        ``,
        `1${BRAND.dot} Скачайте *v2rayNG* (Android)`,
        `   или *Streisand* (iOS)`,
        `2${BRAND.dot} Нажмите *+* → *Импорт из буфера*`,
        `3${BRAND.dot} Включите VPN ${BRAND.success}`,
        ``,
        `${BRAND.divider}`,
        `🇩🇪 Сервер: *Frankfurt* | Протокол: *VLESS Reality*`,
    ].join('\n');
}

function paymentSuccessMessage(planDuration) {
    return [
        `${BRAND.sparkle} *Оплата прошла успешно!*`,
        `${BRAND.divider}`,
        ``,
        `${BRAND.crown} Подписка *PRO* активирована`,
        `${BRAND.dot} Срок: *+${planDuration} дней*`,
        ``,
        `*Что доступно в PRO:*`,
        ``,
        `${BRAND.check} До 3 устройств одновременно`,
        `${BRAND.check} Double VPN (двойной туннель)`,
        `${BRAND.check} Максимальная скорость`,
        `${BRAND.check} Приоритетная поддержка`,
        ``,
        `${BRAND.divider}`,
        `${BRAND.heart} Спасибо, что выбрали VEIL!`,
    ].join('\n');
}

// ═══════════════════════════════════════════════
// 🤖 КОМАНДЫ БОТА
// ═══════════════════════════════════════════════

bot.start(async (ctx) => {
    try {
        const startPayload = ctx.startPayload;
        let webAppUrl = WEBAPP_URL;
        
        // Обработка реферальных ссылок
        if (startPayload && startPayload.startsWith('VEIL-')) {
            webAppUrl = `${WEBAPP_URL}?ref=${startPayload}`;
            console.log(`📎 Referral deep link: ${startPayload} from user ${ctx.from.id}`);
            
            try {
                const { data: referrer } = await supabase
                    .from('veil_users')
                    .select('id, telegram_id')
                    .eq('referral_code', startPayload)
                    .single();
                
                if (referrer && String(referrer.telegram_id) !== String(ctx.from.id)) {
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
                        console.log(`✅ Pending referral: ${ctx.from.id} → referrer ${referrer.telegram_id}`);
                    }
                }
            } catch (refErr) {
                console.error('Referral error:', refErr.message);
            }
        }

        // Устанавливаем кнопку меню
        await ctx.setChatMenuButton({
            type: 'web_app',
            text: '🛡 VEIL VPN',
            web_app: { url: WEBAPP_URL }
        });

        const firstName = ctx.from.first_name || 'друг';
        
        await ctx.replyWithMarkdown(
            welcomeMessage(firstName),
            Markup.inlineKeyboard([
                [Markup.button.webApp(`${BRAND.rocket} Открыть приложение`, webAppUrl)],
                [
                    Markup.button.callback(`${BRAND.key} Получить ключ`, 'action_connect'),
                    Markup.button.callback(`${BRAND.chart} Статус`, 'action_status'),
                ],
                [
                    Markup.button.callback(`${BRAND.globe} Серверы`, 'action_servers'),
                    Markup.button.callback(`${BRAND.gift} Рефералы`, 'action_referral'),
                ],
                [Markup.button.callback('❓ Помощь', 'action_help')],
            ])
        );
    } catch (error) {
        console.error('Error in /start:', error);
    }
});

// ═══════════════════════════════════════════════
// 📋 ТЕКСТОВЫЕ КОМАНДЫ
// ═══════════════════════════════════════════════

bot.help((ctx) => {
    ctx.replyWithMarkdown(helpMessage(), Markup.inlineKeyboard([
        [Markup.button.webApp(`${BRAND.rocket} Открыть приложение`, WEBAPP_URL)],
        [Markup.button.callback('◀️ Главное меню', 'action_back')],
    ]));
});

bot.command('connect', async (ctx) => {
    await handleConnect(ctx);
});

bot.command('status', async (ctx) => {
    await handleStatus(ctx);
});

bot.command('servers', (ctx) => {
    ctx.replyWithMarkdown(serversMessage(), Markup.inlineKeyboard([
        [Markup.button.callback(`${BRAND.key} Получить ключ`, 'action_connect')],
        [Markup.button.callback('◀️ Главное меню', 'action_back')],
    ]));
});

bot.command('referral', async (ctx) => {
    await handleReferral(ctx);
});

// ═══════════════════════════════════════════════
// 🎯 CALLBACK ACTIONS (кнопки)
// ═══════════════════════════════════════════════

bot.action('action_connect', async (ctx) => {
    await ctx.answerCbQuery();
    await handleConnect(ctx);
});

bot.action('action_status', async (ctx) => {
    await ctx.answerCbQuery();
    await handleStatus(ctx);
});

bot.action('action_servers', async (ctx) => {
    await ctx.answerCbQuery();
    ctx.replyWithMarkdown(serversMessage(), Markup.inlineKeyboard([
        [Markup.button.callback(`${BRAND.key} Получить ключ`, 'action_connect')],
        [Markup.button.callback('◀️ Главное меню', 'action_back')],
    ]));
});

bot.action('action_referral', async (ctx) => {
    await ctx.answerCbQuery();
    await handleReferral(ctx);
});

bot.action('action_help', async (ctx) => {
    await ctx.answerCbQuery();
    ctx.replyWithMarkdown(helpMessage(), Markup.inlineKeyboard([
        [Markup.button.webApp(`${BRAND.rocket} Открыть приложение`, WEBAPP_URL)],
        [Markup.button.callback('◀️ Главное меню', 'action_back')],
    ]));
});

bot.action('action_back', async (ctx) => {
    await ctx.answerCbQuery();
    const firstName = ctx.from.first_name || 'друг';
    ctx.replyWithMarkdown(
        welcomeMessage(firstName),
        Markup.inlineKeyboard([
            [Markup.button.webApp(`${BRAND.rocket} Открыть приложение`, WEBAPP_URL)],
            [
                Markup.button.callback(`${BRAND.key} Получить ключ`, 'action_connect'),
                Markup.button.callback(`${BRAND.chart} Статус`, 'action_status'),
            ],
            [
                Markup.button.callback(`${BRAND.globe} Серверы`, 'action_servers'),
                Markup.button.callback(`${BRAND.gift} Рефералы`, 'action_referral'),
            ],
            [Markup.button.callback('❓ Помощь', 'action_help')],
        ])
    );
});

bot.action('action_copy_key', async (ctx) => {
    await ctx.answerCbQuery('Ключ скопирован! Вставьте в VPN-приложение');
});

// ═══════════════════════════════════════════════
// 🔧 HANDLER FUNCTIONS
// ═══════════════════════════════════════════════

async function handleConnect(ctx) {
    const telegramId = ctx.from.id;
    
    try {
        // Ищем существующий ключ
        const { data: user } = await supabase
            .from('veil_users')
            .select('id')
            .eq('telegram_id', telegramId)
            .single();

        if (!user) {
            return ctx.replyWithMarkdown(
                `${BRAND.warn} *Аккаунт не найден*\n\nОткройте приложение и зарегистрируйтесь:`,
                Markup.inlineKeyboard([
                    [Markup.button.webApp(`${BRAND.rocket} Открыть приложение`, WEBAPP_URL)],
                ])
            );
        }

        const { data: keys } = await supabase
            .from('veil_keys')
            .select('config_url')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1);

        if (keys && keys.length > 0) {
            const configUrl = keys[0].config_url;
            
            await ctx.replyWithMarkdown(connectMessage(configUrl), Markup.inlineKeyboard([
                [Markup.button.webApp('📱 Инструкция в приложении', WEBAPP_URL)],
                [Markup.button.callback('◀️ Главное меню', 'action_back')],
            ]));
        } else {
            await ctx.replyWithMarkdown(
                `${BRAND.key} *Ключ ещё не создан*\n\nОткройте приложение и нажмите «Подключиться»:`,
                Markup.inlineKeyboard([
                    [Markup.button.webApp(`${BRAND.rocket} Создать ключ`, WEBAPP_URL)],
                    [Markup.button.callback('◀️ Главное меню', 'action_back')],
                ])
            );
        }
    } catch (err) {
        console.error('Connect error:', err);
        ctx.replyWithMarkdown(`${BRAND.warn} Произошла ошибка. Попробуйте позже.`);
    }
}

async function handleStatus(ctx) {
    const telegramId = ctx.from.id;
    
    try {
        const { data: user } = await supabase
            .from('veil_users')
            .select('subscription_tier, subscription_expires_at, referral_code')
            .eq('telegram_id', telegramId)
            .single();

        if (!user) {
            return ctx.replyWithMarkdown(
                `${BRAND.warn} *Аккаунт не найден*\n\nОткройте приложение для регистрации:`,
                Markup.inlineKeyboard([
                    [Markup.button.webApp(`${BRAND.rocket} Открыть приложение`, WEBAPP_URL)],
                ])
            );
        }

        const tier = user.subscription_tier || 'free';
        
        await ctx.replyWithMarkdown(statusMessage(user), Markup.inlineKeyboard([
            tier === 'free' ? [Markup.button.callback(`${BRAND.crown} Обновить до PRO`, 'action_upgrade')] : [],
            [Markup.button.callback(`${BRAND.key} Мой ключ`, 'action_connect')],
            [Markup.button.callback('◀️ Главное меню', 'action_back')],
        ].filter(row => row.length > 0)));
    } catch (err) {
        console.error('Status error:', err);
        ctx.replyWithMarkdown(`${BRAND.warn} Не удалось получить статус. Попробуйте позже.`);
    }
}

async function handleReferral(ctx) {
    const telegramId = ctx.from.id;
    
    try {
        const { data: user } = await supabase
            .from('veil_users')
            .select('referral_code')
            .eq('telegram_id', telegramId)
            .single();

        if (!user) {
            return ctx.replyWithMarkdown(
                `${BRAND.warn} *Аккаунт не найден*\n\nОткройте приложение для регистрации:`,
                Markup.inlineKeyboard([
                    [Markup.button.webApp(`${BRAND.rocket} Открыть приложение`, WEBAPP_URL)],
                ])
            );
        }

        await ctx.replyWithMarkdown(referralMessage(user), Markup.inlineKeyboard([
            [Markup.button.url('📤 Поделиться', `https://t.me/share/url?url=${encodeURIComponent(`https://t.me/VeilVPN_bot?start=${user.referral_code}`)}&text=${encodeURIComponent('🛡 VEIL VPN — быстрый и невидимый VPN. Попробуй бесплатно!')}`)],
            [Markup.button.callback('◀️ Главное меню', 'action_back')],
        ]));
    } catch (err) {
        console.error('Referral error:', err);
        ctx.replyWithMarkdown(`${BRAND.warn} Произошла ошибка. Попробуйте позже.`);
    }
}

bot.action('action_upgrade', async (ctx) => {
    await ctx.answerCbQuery();
    ctx.replyWithMarkdown(
        [
            `${BRAND.crown} *Обновление до PRO*`,
            `${BRAND.divider}`,
            ``,
            `*Что входит в PRO:*`,
            ``,
            `${BRAND.check} До *3 устройств* одновременно`,
            `${BRAND.check} *Double VPN* — двойной туннель`,
            `${BRAND.check} *Максимальная скорость*`,
            `${BRAND.check} *Приоритетная поддержка*`,
            ``,
            `${BRAND.divider}`,
            ``,
            `*Тарифы:*`,
            ``,
            `${BRAND.dot} 30 дней — *100 ⭐*`,
            `${BRAND.dot} 90 дней — *250 ⭐* (скидка 17%)`,
            `${BRAND.dot} 365 дней — *800 ⭐* (скидка 34%)`,
            ``,
            `${BRAND.divider}`,
            `_Оплата через Telegram Stars_`,
        ].join('\n'),
        Markup.inlineKeyboard([
            [Markup.button.webApp(`${BRAND.star} Оплатить в приложении`, WEBAPP_URL)],
            [Markup.button.callback('◀️ Назад', 'action_status')],
        ])
    );
});

// ═══════════════════════════════════════════════
// 💳 ПЛАТЕЖИ
// ═══════════════════════════════════════════════

bot.on('pre_checkout_query', (ctx) => {
    return ctx.answerPreCheckoutQuery(true);
});

bot.on('successful_payment', async (ctx) => {
    const payment = ctx.message.successful_payment;
    console.log('✅ Payment:', payment);

    const payload = payment.invoice_payload;
    if (payload.startsWith('sub_')) {
        const [_, tgIdStr, planDurationStr] = payload.split('_');
        const telegramId = parseInt(tgIdStr);
        const planDuration = parseInt(planDurationStr);

        try {
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
                    await ctx.replyWithMarkdown(paymentSuccessMessage(planDuration));
                    
                    await supabase.from('veil_payments').insert({
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
            console.error('Payment DB error:', dbError);
        }
    }

    ctx.replyWithMarkdown(`${BRAND.warn} Платёж прошёл, но возникла проблема. Напишите в поддержку.`);
});

// ═══════════════════════════════════════════════
// 🌐 EXPRESS API
// ═══════════════════════════════════════════════

app.post('/api/create-invoice', async (req, res) => {
    const { userId, title, description, amount, planDuration } = req.body;

    if (!userId || !amount) {
        return res.status(400).json({ error: 'Missing parameters' });
    }

    try {
        const invoiceLink = await bot.telegram.createInvoiceLink({
            title: title || '🛡 VEIL VPN PRO',
            description: description || `Подписка PRO на ${planDuration} дней`,
            payload: `sub_${userId}_${planDuration}`,
            provider_token: '',
            currency: 'XTR',
            prices: [{ label: 'VEIL PRO', amount: amount }],
        });

        res.json({ invoiceUrl: invoiceLink });
    } catch (error) {
        console.error('Invoice error:', error);
        res.status(500).json({ error: 'Failed to create invoice' });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', bot: 'running', timestamp: new Date().toISOString() });
});

// ═══════════════════════════════════════════════
// 🚀 ЗАПУСК
// ═══════════════════════════════════════════════

bot.launch()
    .then(() => console.log('🤖 VEIL Bot started!'))
    .catch(err => console.error('❌ Bot error:', err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 API on port ${PORT}`);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
