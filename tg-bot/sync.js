import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import axios from 'axios';
import ws from 'ws';
import { createClient } from '@supabase/supabase-js';

// Загрузка .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
const XUI_URL     = process.env.XUI_URL;
const XUI_USER    = process.env.XUI_USERNAME;
const XUI_PASS    = process.env.XUI_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_KEY || !XUI_URL || !XUI_USER || !XUI_PASS) {
  console.error('❌ Отсутствуют переменные окружения. Проверь .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
  realtime: { transport: ws },
});

const httpsAgent = new https.Agent({ rejectUnauthorized: false });
const baseURL = XUI_URL.endsWith('/') ? XUI_URL : XUI_URL + '/';
const api = axios.create({ baseURL, httpsAgent, withCredentials: true });

// ──────────────────────────────────────────────
// АВТОРИЗАЦИЯ (cookie + CSRF)
// ──────────────────────────────────────────────
async function loginXUI() {
  try {
    delete api.defaults.headers.common['Cookie'];
    delete api.defaults.headers.common['X-Csrf-Token'];

    const homeRes = await api.get('');
    const html = typeof homeRes.data === 'string' ? homeRes.data : '';
    const csrfMatch = html.match(/name="csrf-token"\s+content="([^"]+)"/);
    const csrfToken = csrfMatch ? csrfMatch[1] : '';

    const rawCookies = homeRes.headers['set-cookie'] || [];
    const rawSessionCookie = Array.isArray(rawCookies) ? rawCookies[0] : rawCookies;
    const sessionCookie = rawSessionCookie ? rawSessionCookie.split(';')[0] : '';

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

    const authCookies = loginRes.headers['set-cookie'] || [];
    const rawAuthCookie = Array.isArray(authCookies) ? authCookies[0] : authCookies;
    const authCookie = rawAuthCookie ? rawAuthCookie.split(';')[0] : '';
    api.defaults.headers.common['Cookie'] = authCookie || sessionCookie;
    api.defaults.headers.common['X-Csrf-Token'] = csrfToken;

    console.log('✅ Авторизован в X-UI');
    return true;
  } catch (err) {
    console.error('❌ Ошибка авторизации X-UI:', err.message);
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
    return null;
  } catch (err) {
    console.error('❌ Ошибка получения inbounds:', err.message);
    return null;
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
// ДОБАВЛЕНИЕ КЛИЕНТА
// ──────────────────────────────────────────────
async function addClient(inboundIds, sub, email, flow) {
  try {
    const expiryMs = sub.expires_at ? new Date(sub.expires_at).getTime() : 0;
    const totalBytes = sub.traffic_limit || 0;
    const clientUuid = extractUuid(sub.subscription_key);

    const payload = {
      client: {
        id: clientUuid,
        email: email,
        flow: flow,
        totalGB: totalBytes,
        expiryTime: expiryMs,
        limitIp: sub.ip_limit || 3,
        enable: sub.status === 'active',
        tgId: (sub.telegram_username && !isNaN(sub.telegram_username)) ? parseInt(sub.telegram_username, 10) : 0,
      },
      inboundIds: inboundIds,
    };

    const res = await api.post('panel/api/clients/add', payload);

    if (res.data?.success) {
      console.log(`  ✅ Добавлен клиент: ${email} с UUID: ${clientUuid} в inbounds: ${inboundIds.join(',')}`);
      return true;
    }
    console.error(`  ❌ Не добавлен ${email}:`, res.data?.msg);
    return false;
  } catch (err) {
    console.error(`  ❌ Ошибка добавления ${email}:`, err.message);
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
// ОБНОВЛЕНИЕ КЛИЕНТА В X-UI
// ──────────────────────────────────────────────
async function updateClientInXUI(email, updates) {
  try {
    const clientRes = await api.get(`panel/api/clients/get/${encodeURIComponent(email)}`);
    if (!clientRes.data?.success || !clientRes.data.obj?.client) {
      console.error(`  ❌ Не удалось получить клиента ${email} для обновления:`, clientRes.data?.msg);
      return false;
    }

    const client = clientRes.data.obj.client;
    const payload = {
      ...client,
      id: client.uuid,
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

  const inbounds = await getInbounds();
  if (!inbounds) return;

  const vlessInbounds = inbounds.filter(i => i.protocol === 'vless');
  if (vlessInbounds.length === 0) {
    console.error('❌ Не найдены VLESS inbounds в X-UI. Создайте их в панели.');
    return;
  }

  // Нам нужны конкретно Inbound ID 1 (TCP) и Inbound ID 2 (gRPC)
  const tcpInbound = vlessInbounds.find(i => i.port === 443 || i.remark.toLowerCase().includes('tcp'));
  const grpcInbound = vlessInbounds.find(i => i.port === 444 || i.remark.toLowerCase().includes('grpc'));

  if (!tcpInbound) {
    console.error('❌ Не найден VLESS-TCP inbound на порту 443.');
    return;
  }
  if (!grpcInbound) {
    console.error('❌ Не найден VLESS-GRPC inbound на порту 444.');
    return;
  }

  console.log(`  📡 Найдено VLESS TCP (id=${tcpInbound.id}, port=${tcpInbound.port})`);
  console.log(`  📡 Найдено VLESS gRPC (id=${grpcInbound.id}, port=${grpcInbound.port})`);

  // Карта клиентов X-UI: email -> client details
  const xuiMap = new Map();
  for (const inbound of vlessInbounds) {
    try {
      const settings = typeof inbound.settings === 'string' ? JSON.parse(inbound.settings) : inbound.settings;
      if (settings && settings.clients) {
        for (const c of settings.clients) {
          xuiMap.set(c.email, {
            email: c.email,
            inboundId: inbound.id,
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

    if (inbound.clientStats) {
      for (const s of inbound.clientStats) {
        const existing = xuiMap.get(s.email);
        if (existing) {
          existing.traffic += s.up + s.down;
        }
      }
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
    const isExpired = sub.expires_at && new Date(sub.expires_at) < new Date();
    const shouldEnable = sub.status === 'active' && !isExpired;
    const subExpiryMs = sub.expires_at ? new Date(sub.expires_at).getTime() : 0;
    const subTrafficLimit = sub.traffic_limit || 0;
    const subIpLimit = sub.ip_limit || 3;

    // --- 1. Синхронизируем TCP (email: sub.token) ---
    const tcpEmail = sub.token;
    const tcpClient = xuiMap.get(tcpEmail);

    if (!tcpClient) {
      if (shouldEnable) {
        const ok = await addClient([tcpInbound.id], sub, tcpEmail, 'xtls-rprx-vision');
        if (ok) added++;
      }
    } else {
      const statusChanged = tcpClient.enable !== shouldEnable;
      const trafficLimitChanged = tcpClient.total !== subTrafficLimit;
      const expiryChanged = Math.abs((tcpClient.expiryTime || 0) - subExpiryMs) > 1000;
      const limitIpChanged = tcpClient.limitIp !== subIpLimit;
      const flowChanged = tcpClient.flow !== 'xtls-rprx-vision';

      if (statusChanged || trafficLimitChanged || expiryChanged || limitIpChanged || flowChanged) {
        console.log(`  ⚙️ Изменились параметры для TCP ${tcpEmail}: statusChanged=${statusChanged}, trafficLimitChanged=${trafficLimitChanged}, expiryChanged=${expiryChanged}, limitIpChanged=${limitIpChanged}, flowChanged=${flowChanged}`);
        const ok = await updateClientInXUI(tcpEmail, {
          enable: shouldEnable,
          totalGB: subTrafficLimit,
          expiryTime: subExpiryMs,
          limitIp: subIpLimit,
          flow: 'xtls-rprx-vision'
        });
        if (ok && statusChanged && !shouldEnable) deactivated++;
      }
    }

    // --- 2. Синхронизируем gRPC (email: sub.token + "-grpc") ---
    const grpcEmail = sub.token + '-grpc';
    const grpcClient = xuiMap.get(grpcEmail);

    if (!grpcClient) {
      if (shouldEnable) {
        const ok = await addClient([grpcInbound.id], sub, grpcEmail, '');
        if (ok) added++;
      }
    } else {
      const statusChanged = grpcClient.enable !== shouldEnable;
      const trafficLimitChanged = grpcClient.total !== subTrafficLimit;
      const expiryChanged = Math.abs((grpcClient.expiryTime || 0) - subExpiryMs) > 1000;
      const limitIpChanged = grpcClient.limitIp !== subIpLimit;
      const flowChanged = grpcClient.flow !== '';

      if (statusChanged || trafficLimitChanged || expiryChanged || limitIpChanged || flowChanged) {
        console.log(`  ⚙️ Изменились параметры для gRPC ${grpcEmail}: statusChanged=${statusChanged}, trafficLimitChanged=${trafficLimitChanged}, expiryChanged=${expiryChanged}, limitIpChanged=${limitIpChanged}, flowChanged=${flowChanged}`);
        const ok = await updateClientInXUI(grpcEmail, {
          enable: shouldEnable,
          totalGB: subTrafficLimit,
          expiryTime: subExpiryMs,
          limitIp: subIpLimit,
          flow: ''
        });
        if (ok && statusChanged && !shouldEnable) deactivated++;
      }
    }

    // --- 3. Синхронизируем трафик обратно в Supabase ---
    const tcpTraffic = tcpClient ? tcpClient.traffic : 0;
    const grpcTraffic = grpcClient ? grpcClient.traffic : 0;
    const totalUsedBytes = tcpTraffic + grpcTraffic;

    if (totalUsedBytes !== sub.traffic_used) {
      await updateTrafficInSupabase(sub.id, totalUsedBytes);
      updated++;
    }
  }

  // Очистка сиротских клиентов (orphan clients), которых больше нет в Supabase vpn_subscriptions.
  let deleted = 0;
  const dbTokens = new Set(subs.map(s => s.token));
  for (const [email] of xuiMap.entries()) {
    const baseToken = email.endsWith('-grpc') ? email.slice(0, -5) : email;
    if (/^[0-9a-f]{32}$/.test(baseToken) && !dbTokens.has(baseToken)) {
      console.log(`  🗑️ Обнаружен удаленный клиент в базе. Удаляем из X-UI: ${email}`);
      const ok = await deleteClientFromXUI(email);
      if (ok) deleted++;
    }
  }

  console.log(`✅ Готово. Добавлено/Восстановлено: ${added}, трафик обновлён: ${updated}, деактивировано: ${deactivated}, удалено сиротских клиентов: ${deleted}`);
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
  }, 3000);
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
        return;
      }
    }
    
    console.log('⚡ Получено realtime-изменение в таблице vpn_subscriptions:', payload.eventType);
    triggerSync();
  })
  .subscribe((status) => {
    console.log(`🔌 Статус Realtime-подключения: ${status}`);
  });
