import { Telegraf } from 'telegraf';

const BOT_TOKEN = process.env.BOT_TOKEN;
const bot = new Telegraf(BOT_TOKEN);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { tgUserId, planName, planDuration, priceRub } = req.body;

    if (!tgUserId || !planDuration || !priceRub) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Telegram Stars requires XTR currency. Since users pay in typical currencies or Stars
    // and the prompt specifies Telegram Stars, the currency is XTR, and price is the amount.
    // Assuming priceRub represents Stars if Telegram Stars is used, or we just map it.
    // For XTR, 1 Star = 1 unit. Price array must be [{ label, amount: priceRub }]
    const amountXTR = parseInt(priceRub);

    const title = `VEIL VPN PRO - ${planName}`;
    const description = `Подписка на быстрый и защищённый VPN на ${planDuration} дней. Без ограничений скорости и трафика.`;
    const payload = `sub_${tgUserId}_${planDuration}`; // Handled by bot.js

    try {
        const invoiceLink = await bot.telegram.createInvoiceLink({
            title: title,
            description: description,
            payload: payload,
            provider_token: '',  // Empty means XTR (Telegram Stars)
            currency: 'XTR',
            prices: [{ label: 'VEIL Premium', amount: amountXTR }]
        });

        res.status(200).json({ invoiceUrl: invoiceLink });
    } catch (e) {
        console.error('Invoice Creation Error:', e);
        res.status(500).json({ error: e.message || 'Error generating invoice' });
    }
}
