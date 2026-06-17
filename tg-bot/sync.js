import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import axios from 'axios';

// Загрузка .env из корневой папки, а затем из папки tg-bot (для перезаписи)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '.env') });


/**
 * Серверная служба синхронизации X-UI и базы данных Connect (sync.js).
 * 
 * Назначение:
 * 1. Авторизация на панели X-UI по API с использованием сессионных Cookie и CSRF-токена,
 *    динамически извлекаемого из HTML разметки главной страницы.
 * 2. Двусторонняя периодическая синхронизация (каждые 2 минуты):
 *    - Чтение списка активных подписок `vpn_subscriptions` из Supabase.
 *    - Синхронизация расхода трафика: передает метрики (up + down байты) клиентов из X-UI обратно в БД.
 *    - Добавление новых активных профилей во VLESS inbound в X-UI.
 *    - Автоматическая деактивация/блокировка истекших или заблокированных клиентов.
 *    - Удаление сиротских клиентов (orphans), отсутствующих в базе данных.
 * 3. Реалтайм-обновление: подписывается на Postgres Realtime канал Supabase `vpn_subscriptions`
 *    и мгновенно триггерит синхронизацию при любых изменениях в таблице.
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
const XUI_URL     = process.env.XUI_URL;      // e.g. https://IP:PORT/basepath
const XUI_USER    = process.env.XUI_USERNAME;
const XUI_PASS    = process.env.XUI_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_KEY || !XUI_URL || !XUI_USER || !XUI_PASS) {
  console.error('❌ Отсутствуют переменные окружения. Проверь .env');
  console.error('  Нужны: SUPABASE_URL (или VITE_SUPABASE_URL), SUPABASE_KEY (или VITE_SUPABASE_ANON_KEY), XUI_URL, XUI_USERNAME, XUI_PASSWORD');
  process.exit(1);
}

// ws для Supabase Realtime на Node.js < 22
import ws from 'ws';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
  realtime: { transport: ws },
});

// axios с игнорированием self-signed сертификатов X-UI
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// baseURL должен заканчиваться на /
const baseURL = XUI_URL.endsWith('/') ? XUI_URL : XUI_URL + '/';
const api = axios.create({ baseURL, httpsAgent, withCredentials: true });

// ──────────────────────────────────────────────
// АВТОРИЗАЦИЯ (cookie + CSRF)
// ──────────────────────────────────────────────
async function loginXUI() {
  try {
    // Сбрасываем старые авторизационные заголовки перед новым входом
    delete api.defaults.headers.common['Cookie'];
    delete api.defaults.headers.common['X-Csrf-Token'];

    // 1. GET / -> получаем session cookie + CSRF token из HTML
    const homeRes = await api.get('');
    
    // Извлекаем CSRF из <meta name="csrf-token" content="...">
    const html = typeof homeRes.data === 'string' ? homeRes.data : '';
    const csrfMatch = html.match(/name="csrf-token"\s+content="([^"]+)"/);
    const csrfToken = csrfMatch ? csrfMatch[1] : '';

    // Собираем session cookie из ответа и очищаем от атрибутов (Path, Max-Age и т.д.)
    const rawCookies = homeRes.headers['set-cookie'] || [];
    const rawSessionCookie = Array.isArray(rawCookies) ? rawCookies[0] : rawCookies;
    const sessionCookie = rawSessionCookie ? rawSessionCookie.split(';')[0] : '';

    // 2. POST login с CSRF token + session cookie
    const loginRes = await api.post('login',
      { username: XUI_USER, password: XUI_PASS },
      {
        headers: {
          'X-Csrf-Token': csrfToken,
          'Cookie': sessionCookie,
        },
      },
    );

    if (!loginRes.data || !loginRes.data.success) {
      console.error('❌ Ошибка входа в X-UI:', loginRes.data?.msg);
      return false;
    }

    // Сохраняем auth cookie для последующих запросов, также очищая от атрибутов
    const authCookies = loginRes.headers['set-cookie'] || [];
    const rawAuthCookie = Array.isArray(authCookies) ? authCookies[0] : authCookies;
    const authCookie = rawAuthCookie ? rawAuthCookie.split(';')[0] : '';
    api.defaults.headers.common['Cookie'] = authCookie || sessionCookie;
    api.defaults.headers.common['X-Csrf-Token'] = csrfToken;

    console.log('✅ Авторизован в X-UI');
    return true;
  } catch (err) {
    console.error('❌ Ошибка авторизации X-UI:', err.message);
    if (err.response) console.error('   HTTP', err.response.status);
    return false;
  }
}

// ──────────────────────────────────────────────
// ПОЛУЧЕНИЕ INBOUNDS
// ──────────────────────────────────────────────
async function getInbounds() {
  try {
    const res = await api.get('panel/api/inbounds/list');
    if (res.data?.success) return res.data.obj || [];
    console.error('❌ inbounds/list вернул success=false:', res.data?.msg);
    return null;
  } catch (err) {
    console.error('❌ Ошибка получения inbounds:', err.message);
    return null;
  }
}

// ──────────────────────────────────────────────
// ПОЛУЧЕНИЕ КЛИЕНТОВ X-UI
// ──────────────────────────────────────────────
async function getXUIClients() {
  try {
    const res = await api.get('panel/api/clients/list');
    if (res.data?.success) return res.data.obj || [];
    return [];
  } catch (err) {
    console.error('❌ Ошибка получения клиентов X-UI:', err.message);
    return [];
  }
}

function extractUuid(key) {
  if (!key) return null;
  if (key.startsWith('vless://')) {
    const match = key.match(/vless:\/\/([^@]+)@/);
    return match ? match[1] : null;
  }
  return key;
}

// ──────────────────────────────────────────────
// ДОБАВЛЕНИЕ КЛИЕНТА (новый API /panel/api/clients/add)
// ──────────────────────────────────────────────
async function addClient(inboundId, sub) {
  try {
    const expiryMs = sub.expires_at ? new Date(sub.expires_at).getTime() : 0;
    const totalBytes = sub.traffic_limit || 0; // 0 = unlimited
    const clientUuid = extractUuid(sub.subscription_key);

    const payload = {
      client: {
        id: clientUuid,
        email: sub.token,
        flow: 'xtls-rprx-vision',
        totalGB: totalBytes,
        expiryTime: expiryMs,
        limitIp: sub.ip_limit || 3,
        enable: sub.status === 'active',
        tgId: (sub.telegram_username && !isNaN(sub.telegram_username)) ? parseInt(sub.telegram_username, 10) : 0,
      },
      inboundIds: [inboundId],
    };

    const res = await api.post('panel/api/clients/add', payload);

    if (res.data?.success) {
      console.log(`  ✅ Добавлен клиент: ${sub.token} с UUID: ${clientUuid}`);
      return true;
    }
    console.error(`  ❌ Не добавлен ${sub.token}:`, res.data?.msg);
    return false;
  } catch (err) {
    console.error(`  ❌ Ошибка добавления ${sub.token}:`, err.message);
    return false;
  }
}

// ──────────────────────────────────────────────
// ОБНОВЛЕНИЕ ТРАФИКА
// ──────────────────────────────────────────────
async function updateTrafficInSupabase(subId, usedBytes) {
  const { error } = await supabase
    .from('vpn_subscriptions')
    .update({ traffic_used: usedBytes, updated_at: new Date().toISOString() })
    .eq('id', subId);
  if (error) console.error('  ❌ Ошибка обновления трафика:', error.message);
}

// ──────────────────────────────────────────────
// ДЕАКТИВАЦИЯ / АКТИВАЦИЯ КЛИЕНТА В X-UI
// ──────────────────────────────────────────────
// ──────────────────────────────────────────────
// ОБНОВЛЕНИЕ КЛИЕНТА В X-UI (статус, лимиты)
// ──────────────────────────────────────────────
async function updateClientInXUI(email, updates) {
  try {
    const clientRes = await api.get(`panel/api/clients/get/${encodeURIComponent(email)}`);
    if (!clientRes.data?.success || !clientRes.data.obj?.client) {
      console.error(`  ❌ Не удалось получить клиента ${email} для обновления:`, clientRes.data?.msg);
      return false;
    }

    const client = clientRes.data.obj.client;
    
    // Подготовка тела запроса с плоской структурой и id в виде UUID строки
    const payload = {
      ...client,
      id: client.uuid, // Обязательно передаем UUID строку как id
      ...updates
    };

    const res = await api.post(`panel/api/clients/update/${encodeURIComponent(client.email)}`, payload);

    if (res.data?.success) {
      return true;
    }
    console.error(`  ❌ Ошибка обновления клиента ${email} в X-UI:`, res.data?.msg);
    return false;
  } catch (err) {
    console.error(`  ❌ Ошибка обновления клиента ${email}:`, err.message);
    return false;
  }
}

// ──────────────────────────────────────────────
// УДАЛЕНИЕ КЛИЕНТА ИЗ X-UI
// ──────────────────────────────────────────────
async function deleteClientFromXUI(email) {
  try {
    const res = await api.post(`panel/api/clients/del/${encodeURIComponent(email)}`);
    if (res.data?.success) {
      return true;
    }
    console.error(`  ❌ Ошибка удаления клиента ${email} из X-UI:`, res.data?.msg);
    return false;
  } catch (err) {
    console.error(`  ❌ Ошибка при запросе на удаление ${email}:`, err.message);
    return false;
  }
}

// ──────────────────────────────────────────────
// ГЛАВНАЯ СИНХРОНИЗАЦИЯ
// ──────────────────────────────────────────────
async function syncTraffic() {
  console.log('\n🔄 Запуск синхронизации...', new Date().toLocaleString('ru'));

  const loggedIn = await loginXUI();
  if (!loggedIn) return;

  // Получаем inbounds и клиентов X-UI
  const inbounds = await getInbounds();
  if (!inbounds) return;

  const vlessInbound = inbounds.find(i => i.protocol === 'vless');
  if (!vlessInbound) {
    console.error('❌ Не найден VLESS inbound в X-UI. Создайте его в панели.');
    return;
  }

  console.log(`  📡 Inbound: ${vlessInbound.remark} (id=${vlessInbound.id}, port=${vlessInbound.port})`);

  // Карта клиентов X-UI: email -> { up, down, enable, total, expiryTime, limitIp }
  const xuiMap = new Map();
  try {
    const settings = typeof vlessInbound.settings === 'string' ? JSON.parse(vlessInbound.settings) : vlessInbound.settings;
    if (settings && settings.clients) {
      for (const c of settings.clients) {
        xuiMap.set(c.email, {
          email: c.email,
          enable: c.enable,
          total: c.totalGB || 0,
          expiryTime: c.expiryTime || 0,
          limitIp: c.limitIp || 3,
          flow: c.flow || '',
          traffic: 0
        });
      }
    }
  } catch (err) {
    console.error('⚠️ Ошибка парсинга settings inbound:', err.message);
  }

  if (vlessInbound.clientStats) {
    for (const s of vlessInbound.clientStats) {
      const existing = xuiMap.get(s.email) || {};
      xuiMap.set(s.email, {
        ...existing,
        traffic: s.up + s.down,
        enable: s.enable !== undefined ? s.enable : existing.enable,
        total: s.total !== undefined ? s.total : existing.total,
        expiryTime: s.expiryTime !== undefined ? s.expiryTime : existing.expiryTime
      });
    }
  }

  // Получаем подписки из Supabase
  const { data: subs, error } = await supabase
    .from('vpn_subscriptions')
    .select('id, subscription_key, token, traffic_used, traffic_limit, status, expires_at, telegram_username, ip_limit');

  if (error) {
    console.error('❌ Ошибка Supabase:', error.message);
    return;
  }

  let added = 0, updated = 0, deactivated = 0;

  for (const sub of subs) {
    const xuiClient = xuiMap.get(sub.token);

    if (!xuiClient) {
      // Клиента нет в X-UI — добавляем, если он активен и не истек
      const isExpired = sub.expires_at && new Date(sub.expires_at) < new Date();
      if (sub.status === 'active' && !isExpired) {
        const ok = await addClient(vlessInbound.id, sub);
        if (ok) added++;
      }
    } else {
      // Клиент есть — синхронизируем потраченный трафик в Supabase
      const usedBytes = xuiClient.traffic;
      if (usedBytes !== sub.traffic_used) {
        await updateTrafficInSupabase(sub.id, usedBytes);
        updated++;
      }

      // Вычисляем целевые параметры на основе Supabase
      const isExpired = sub.expires_at && new Date(sub.expires_at) < new Date();
      const shouldEnable = sub.status === 'active' && !isExpired;
      const subExpiryMs = sub.expires_at ? new Date(sub.expires_at).getTime() : 0;
      const subTrafficLimit = sub.traffic_limit || 0;
      const subIpLimit = sub.ip_limit || 3;

      // Проверяем, изменились ли параметры (статус, лимит трафика, срок действия, лимит IP или поток)
      const statusChanged = xuiClient.enable !== shouldEnable;
      const trafficLimitChanged = xuiClient.total !== subTrafficLimit;
      const expiryChanged = Math.abs((xuiClient.expiryTime || 0) - subExpiryMs) > 1000;
      const limitIpChanged = xuiClient.limitIp !== subIpLimit;
      const flowChanged = xuiClient.flow !== 'xtls-rprx-vision';

      if (statusChanged || trafficLimitChanged || expiryChanged || limitIpChanged || flowChanged) {
        console.log(`  ⚙️ Изменились параметры для ${sub.token}: statusChanged=${statusChanged}, trafficLimitChanged=${trafficLimitChanged}, expiryChanged=${expiryChanged}, limitIpChanged=${limitIpChanged}, flowChanged=${flowChanged}`);
        const ok = await updateClientInXUI(sub.token, {
          enable: shouldEnable,
          totalGB: subTrafficLimit,
          expiryTime: subExpiryMs,
          limitIp: subIpLimit,
          flow: 'xtls-rprx-vision'
        });
        if (ok && statusChanged) {
          if (!shouldEnable) {
            deactivated++;
            console.log(`    🚫 Клиент деактивирован: ${sub.token} (${isExpired ? 'истёк' : 'статус ' + sub.status})`);
          } else {
            console.log(`    ✅ Клиент активирован: ${sub.token}`);
          }
        }
      }
    }
  }

  // Очистка сиротских клиентов (orphan clients), которых больше нет в Supabase vpn_subscriptions.
  // Мы ищем клиентов с 32-символьным hex-email (UUID-токен созданный CRM Connect)
  let deleted = 0;
  const dbTokens = new Set(subs.map(s => s.token));
  for (const [email] of xuiMap.entries()) {
    if (/^[0-9a-f]{32}$/.test(email) && !dbTokens.has(email)) {
      console.log(`  🗑️ Обнаружен удаленный клиент в базе. Удаляем из X-UI: ${email}`);
      const ok = await deleteClientFromXUI(email);
      if (ok) deleted++;
    }
  }

  console.log(`✅ Готово. Добавлено: ${added}, трафик обновлён: ${updated}, деактивировано: ${deactivated}, удалено сиротских клиентов: ${deleted}`);
}

// Очередь и дебаунс для синхронизации
let isSyncing = false;
let pendingSync = false;
let debounceTimeout = null;

async function executeSync() {
  if (isSyncing) {
    pendingSync = true;
    console.log('⏳ Синхронизация уже выполняется. Запрос поставлен в очередь.');
    return;
  }
  
  isSyncing = true;
  try {
    await syncTraffic();
  } catch (err) {
    console.error('❌ Ошибка во время syncTraffic:', err.message);
  } finally {
    isSyncing = false;
    if (pendingSync) {
      pendingSync = false;
      console.log('🔄 Запуск отложенной синхронизации из очереди через 5 секунд...');
      setTimeout(executeSync, 5000);
    }
  }
}

function triggerSync() {
  if (debounceTimeout) clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    debounceTimeout = null;
    executeSync();
  }, 3000); // 3 секунды дебаунс
}

// Запуск сразу + каждые 2 минуты
executeSync().catch(console.error);
setInterval(() => executeSync().catch(console.error), 2 * 60 * 1000);

// Подписка на изменения в реальном времени
console.log('🔌 Подключаемся к Supabase Realtime...');
supabase
  .channel('vpn_subs_changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'vpn_subscriptions' }, (payload) => {
    if (payload.eventType === 'UPDATE') {
      const oldVal = payload.old || {};
      const newVal = payload.new || {};
      
      const importantKeys = ['status', 'expires_at', 'traffic_limit', 'subscription_key', 'token', 'ip_limit'];
      const hasImportantChange = importantKeys.some(key => {
        return JSON.stringify(oldVal[key]) !== JSON.stringify(newVal[key]);
      });
      
      if (!hasImportantChange) {
        // Игнорируем обновление, так как изменились только служебные данные (например, трафик или дата обновления)
        return;
      }
    }
    
    console.log('⚡ Получено realtime-изменение в таблице vpn_subscriptions:', payload.eventType);
    triggerSync();
  })
  .subscribe((status) => {
    console.log(`🔌 Статус Realtime-подключения: ${status}`);
  });
