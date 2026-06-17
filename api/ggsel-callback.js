import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

/**
 * Серверный обработчик (Serverless Function) для обработки обратных вызовов (callback)
 * от платежного шлюза / маркетплейса GGsel (Digiseller).
 * 
 * Логика работы:
 * 1. Разрешает CORS-запросы с любого источника.
 * 2. Получает уникальный код покупки `uniqueCode` и опционального реферера `referrer`.
 * 3. Валидирует формат уникального кода (16 символов, состоящих из латинских букв и цифр).
 * 4. Авторизуется в API Digiseller, используя подпись на базе HMAC/SHA256 от API ключа и текущего времени.
 * 5. Проверяет статус уникального кода через API Digiseller.
 * 6. На основе ID купленного товара (id_goods) определяет количество дней подписки.
 * 7. В базе данных Supabase:
 *    - Если пользователь с таким email (username) уже существует, его подписка продлевается.
 *    - Если пользователя нет, создается новая запись подписки (регенерируется UUID, токен доступа, временный ключ).
 *    - Если указан корректный пригласивший пользователь (referrer), обоим участникам начисляется реферальный бонус (+30 дней).
 *    - В таблицу `vpn_orders` добавляется запись о транзакции.
 * 8. Подтверждает доставку цифрового товара в Digiseller API (перевод состояния уникального кода).
 * 9. Возвращает фронтенду токен кабинета, дату истечения подписки и флаг успешного создания.
 * 
 * @param {import('vercel').VercelRequest} req - Объект HTTP-запроса Vercel
 * @param {import('vercel').VercelResponse} res - Объект HTTP-ответа Vercel
 * @returns {Promise<void>}
 */
export default async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Support both POST (JSON body) and GET (query params)
  const uniqueCode = (req.body?.uniqueCode || req.query?.uniqueCode || '').trim();
  const referrer = (req.body?.referrer || req.query?.referrer || '').trim().toLowerCase();

  if (!uniqueCode) {
    return res.status(400).json({ error: 'Параметр uniqueCode обязателен' });
  }

  // Validate uniqueCode format (usually 16 hex/alphanumeric characters)
  if (!/^[A-Za-z0-9]{16}$/.test(uniqueCode)) {
    return res.status(400).json({ error: 'Неверный формат уникального кода' });
  }

  // Credentials
  const apiKey = process.env.GGSEL_API_KEY || '372a1c75d983024c4634dc6b64d238d4f4251c6455b42ad7f1935d2f47ef275f';
  const sellerId = process.env.GGSEL_SELLER_ID || '1140096';

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase config missing on server');
    return res.status(500).json({ error: 'Ошибка конфигурации сервера базы данных' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 0. Create database log entry
  let logId = null;
  try {
    const { data: logObj } = await supabase
      .from('vpn_ggsel_logs')
      .insert({
        unique_code: uniqueCode,
        status: 'received'
      })
      .select('id')
      .maybeSingle();
    logId = logObj?.id;
  } catch (logErr) {
    console.error('Failed to create ggsel log entry:', logErr);
  }

  // Helper to respond and update log status
  const sendResponse = async (status, payload) => {
    if (logId) {
      try {
        const isSuccess = status === 200;
        await supabase
          .from('vpn_ggsel_logs')
          .update({
            status: isSuccess ? 'processed' : 'failed',
            email: payload.email || null,
            product_id: payload.productId || null,
            amount: payload.amount || null,
            error_message: isSuccess ? null : (payload.error || JSON.stringify(payload)),
            raw_response: payload
          })
          .eq('id', logId);
      } catch (logUpdErr) {
        console.error('Failed to update ggsel log entry:', logUpdErr);
      }
    }
    return res.status(status).json(payload);
  };

  try {
    // 1. Authenticate with GGsel/Digiseller API
    const timestamp = Math.floor(Date.now() / 1000);
    const sign = crypto.createHash('sha256').update(apiKey + timestamp).digest('hex');

    console.log(`Authenticating with GGsel for seller ${sellerId}...`);
    const authRes = await fetch('https://seller.ggsel.com/api_sellers/api/apilogin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        seller_id: Number(sellerId),
        timestamp: timestamp,
        sign: sign
      })
    });

    if (!authRes.ok) {
      const authErrText = await authRes.text();
      console.error('GGsel auth request failed:', authRes.status, authErrText);
      return sendResponse(500, { error: 'Не удалось авторизоваться в GGsel API' });
    }

    const authData = await authRes.json();
    const token = authData.token;

    if (!token) {
      console.error('GGsel apilogin returned no token:', authData);
      return sendResponse(500, { error: 'Не удалось получить токен авторизации GGsel' });
    }

    // 2. Verify unique code
    console.log(`Verifying unique code: ${uniqueCode}...`);
    const verifyRes = await fetch(`https://seller.ggsel.com/api_sellers/api/purchases/unique-code/${uniqueCode}?token=${token}`, {
      headers: { 'Accept': 'application/json' }
    });

    if (!verifyRes.ok) {
      const verifyErrText = await verifyRes.text();
      console.error('GGsel code verification request failed:', verifyRes.status, verifyErrText);
      return sendResponse(500, { error: 'Ошибка при связи с сервером GGsel' });
    }

    const verifyData = await verifyRes.json();

    if (verifyData.retval !== 0) {
      console.warn('GGsel unique code verification failed:', verifyData);
      return sendResponse(400, { error: verifyData.retdesc || 'Уникальный код недействителен' });
    }

    const email = (verifyData.email || '').trim().toLowerCase();
    const productId = verifyData.id_goods;
    const uniqueCodeState = verifyData.unique_code_state?.state;

    if (!email) {
      console.error('GGsel transaction contains no email:', verifyData);
      return sendResponse(400, { error: 'В транзакции отсутствует email покупателя' });
    }

    // 3. Determine subscription duration based on productId map
    let durationDays = 30; // Default to 1 month
    if (process.env.GGSEL_PRODUCT_MAP) {
      try {
        const map = JSON.parse(process.env.GGSEL_PRODUCT_MAP);
        if (map[productId]) {
          durationDays = Number(map[productId]);
        }
      } catch (err) {
        console.error('Failed to parse GGSEL_PRODUCT_MAP:', err.message);
      }
    }

    console.log(`Product ID: ${productId}, mapping to ${durationDays} days of subscription`);

    // 4. Update or Create subscription in Supabase
    console.log(`Updating database for email: ${email}...`);
    
    // Check if subscription already exists for this email (field: username)
    const { data: existingSub, error: findErr } = await supabase
      .from('vpn_subscriptions')
      .select('*')
      .eq('username', email)
      .maybeSingle();

    if (findErr) {
      console.error('Supabase query error:', findErr);
      return sendResponse(500, { error: 'Ошибка базы данных при поиске подписки' });
    }

    let resultToken = '';
    let isNew = false;
    let newExpiresAt = null;

    if (existingSub) {
      // Extend existing subscription
      const currentExpires = new Date(existingSub.expires_at);
      const baseDate = currentExpires > new Date() ? currentExpires : new Date();
      newExpiresAt = new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

      const { error: updateErr } = await supabase
        .from('vpn_subscriptions')
        .update({
          expires_at: newExpiresAt.toISOString(),
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSub.id);

      if (updateErr) {
        console.error('Supabase update error:', updateErr);
        return sendResponse(500, { error: 'Не удалось обновить подписку в базе данных' });
      }

      resultToken = existingSub.token;
      console.log(`Extended subscription for ${email}. New expiration: ${newExpiresAt.toISOString()}`);
    } else {
      // Create new subscription
      isNew = true;
      resultToken = crypto.randomUUID().replace(/-/g, '');
      const tempKey = crypto.randomUUID(); // sync.js will generate real VLESS key

      // Check if referrer is valid and not self-referring
      let referrerValid = false;
      let referrerSub = null;
      if (referrer && referrer !== email) {
        const { data: refSub } = await supabase
          .from('vpn_subscriptions')
          .select('*')
          .eq('username', referrer)
          .maybeSingle();
        if (refSub) {
          referrerSub = refSub;
          referrerValid = true;
        }
      }

      // If referred, referee gets +30 days bonus to their initial purchase duration
      const refereeBonusDays = referrerValid ? 30 : 0;
      newExpiresAt = new Date(Date.now() + (durationDays + refereeBonusDays) * 24 * 60 * 60 * 1000);

      const { error: insertErr } = await supabase
        .from('vpn_subscriptions')
        .insert({
          id: crypto.randomUUID(),
          username: email,
          token: resultToken,
          subscription_key: tempKey,
          status: 'active',
          traffic_limit: 536870912000, // 500 GB
          expires_at: newExpiresAt.toISOString(),
          ip_limit: 3,
          traffic_used: 0,
          tg_bot_linked: false,
          tg_channel_subscribed: false
        });

      if (insertErr) {
        console.error('Supabase insert error:', insertErr);
        return sendResponse(500, { error: 'Не удалось создать подписку в базе данных' });
      }

      console.log(`Created new subscription for ${email}. Token: ${resultToken}`);

      // Process referrer reward
      if (referrerValid && referrerSub) {
        // Extend referrer's subscription by 30 days
        const refCurrentExpires = new Date(referrerSub.expires_at);
        const refBaseDate = refCurrentExpires > new Date() ? refCurrentExpires : new Date();
        const refNewExpiresAt = new Date(refBaseDate.getTime() + 30 * 24 * 60 * 60 * 1000);

        await supabase
          .from('vpn_subscriptions')
          .update({
            expires_at: refNewExpiresAt.toISOString(),
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', referrerSub.id);

        // Record the referral relationship in vpn_referrals
        await supabase
          .from('vpn_referrals')
          .insert({
            id: crypto.randomUUID(),
            referrer_username: referrer,
            referred_username: email,
            status: 'active',
            bonus_days: 30
          });

        console.log(`Referral credited! Referrer ${referrer} (+30 days), Referee ${email} (+30 days).`);
      }
    }

    // 4.5 Insert transaction record into vpn_orders
    let tariffMonths = 1;
    if (durationDays >= 360) {
      tariffMonths = 12;
    } else if (durationDays >= 80) {
      tariffMonths = 3;
    } else {
      tariffMonths = 1;
    }

    console.log(`Inserting order for ${email} in vpn_orders...`);
    const { error: orderErr } = await supabase
      .from('vpn_orders')
      .insert({
        id: crypto.randomUUID(),
        username: email,
        amount: Number(verifyData.amount),
        currency: verifyData.type_curr || 'RUB',
        status: 'paid',
        tariff_months: tariffMonths,
        created_at: new Date().toISOString()
      });

    if (orderErr) {
      console.error('Failed to insert into vpn_orders:', orderErr);
    }

    // 5. Confirm delivery in GGsel/Digiseller (change state from 1/5 to delivered)
    // state 1 = not verified, state 5 = verified but not delivered
    if (uniqueCodeState === 1 || uniqueCodeState === 5) {
      console.log(`Confirming delivery for code ${uniqueCode}...`);
      const deliverRes = await fetch(`https://seller.ggsel.com/api_sellers/api/purchases/unique-code/${uniqueCode}/deliver?token=${token}`, {
        method: 'PUT',
        headers: { 'Accept': 'application/json' }
      });

      if (deliverRes.ok) {
        const deliverData = await deliverRes.json();
        console.log('GGsel delivery confirmation response:', deliverData);
      } else {
        console.error('Failed to confirm delivery on GGsel:', deliverRes.status, await deliverRes.text());
        // We do not fail the request here, since the DB update was successful.
      }
    }

    return sendResponse(200, {
      success: true,
      email: email,
      token: resultToken,
      isNew: isNew,
      expiresAt: newExpiresAt.toISOString(),
      durationDays: durationDays,
      productId: productId,
      amount: Number(verifyData.amount)
    });

  } catch (error) {
    console.error('GGsel callback handler error:', error);
    return sendResponse(500, { error: 'Внутренняя ошибка сервера' });
  }
}
