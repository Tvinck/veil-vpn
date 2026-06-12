import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import https from 'https';

// Загрузка переменных окружения
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const XUI_URL = process.env.XUI_URL;
const XUI_USERNAME = process.env.XUI_USERNAME;
const XUI_PASSWORD = process.env.XUI_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_KEY || !XUI_URL || !XUI_USERNAME || !XUI_PASSWORD) {
  console.error("❌ Отсутствуют необходимые переменные окружения для sync.js");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Игнорируем самоподписанные сертификаты для X-UI
const httpsAgent = new https.Agent({ rejectUnauthorized: false });
const api = axios.create({ baseURL: XUI_URL, httpsAgent });

/**
 * Авторизация в X-UI
 */
async function loginXUI() {
  try {
    const res = await api.post('/login', { username: XUI_USERNAME, password: XUI_PASSWORD });
    const cookie = res.headers['set-cookie'] ? res.headers['set-cookie'][0] : '';
    api.defaults.headers.common['Cookie'] = cookie;
    return true;
  } catch (err) {
    console.error("❌ Ошибка авторизации в X-UI:", err.message);
    return false;
  }
}

/**
 * Получение всех Inbounds и клиентов из X-UI
 */
async function getXUIInbounds() {
  try {
    const res = await api.get('/panel/api/inbounds/list');
    if (res.data && res.data.success) {
      return res.data.obj;
    }
    return [];
  } catch (err) {
    console.error("❌ Ошибка получения Inbounds из X-UI:", err.message);
    return null;
  }
}

/**
 * Добавление нового клиента в X-UI
 */
async function addClientToXUI(inboundId, sub) {
  try {
    const client = {
      id: sub.subscription_key,
      flow: "xtls-rprx-vision",
      email: sub.token,
      limitIp: 3,
      totalGB: 536870912000, // 500GB in bytes
      expiryTime: new Date(sub.expires_at).getTime(),
      enable: true,
      tgId: "",
      subId: sub.token
    };
    
    const settings = {
      clients: [client]
    };
    
    const res = await api.post('/panel/api/inbounds/addClient', {
      id: inboundId,
      settings: JSON.stringify(settings)
    });
    
    if (res.data && res.data.success) {
      console.log(`✅ Добавлен клиент в X-UI: ${sub.token}`);
      return true;
    } else {
      console.error(`❌ Ошибка добавления клиента ${sub.token}:`, res.data.msg);
      return false;
    }
  } catch (err) {
    console.error("❌ Ошибка запроса добавления клиента:", err.message);
    return false;
  }
}

/**
 * Синхронизация трафика и пользователей
 */
async function syncTraffic() {
  console.log("🔄 Запуск синхронизации...");

  const isLoggedIn = await loginXUI();
  if (!isLoggedIn) return;

  const inbounds = await getXUIInbounds();
  if (!inbounds || inbounds.length === 0) {
    console.log("⚠️ Inbounds не найдены.");
    return;
  }

  // Берем первый попавшийся VLESS inbound для добавления клиентов
  const vlessInbound = inbounds.find(i => i.protocol === 'vless');
  if (!vlessInbound) {
    console.error("❌ Не найден VLESS inbound в X-UI");
    return;
  }

  const xuiClientMap = new Map();
  if (vlessInbound.clientStats) {
     for (const stat of vlessInbound.clientStats) {
        xuiClientMap.set(stat.email, {
           traffic: stat.up + stat.down,
           enable: stat.enable
        });
     }
  } else {
     const settings = JSON.parse(vlessInbound.settings);
     for (const c of settings.clients) {
         xuiClientMap.set(c.email, { traffic: 0, enable: c.enable });
     }
  }

  const { data: subs, error } = await supabase
    .from('subscriptions')
    .select('id, subscription_key, token, traffic_used, status, expires_at');

  if (error) {
    console.error("❌ Ошибка получения подписок из Supabase:", error.message);
    return;
  }

  let updatedCount = 0;
  let addedCount = 0;

  for (const sub of subs) {
    const xuiClient = xuiClientMap.get(sub.token);

    if (!xuiClient) {
      // Клиента нет в X-UI -> создаем его
      if (sub.status === 'active') {
         await addClientToXUI(vlessInbound.id, sub);
         addedCount++;
      }
    } else {
      // Обновляем трафик
      if (xuiClient.traffic !== undefined && xuiClient.traffic !== sub.traffic_used) {
        const { error: updateErr } = await supabase
          .from('subscriptions')
          .update({ traffic_used: xuiClient.traffic })
          .eq('id', sub.id);
          
        if (!updateErr) updatedCount++;
      }
    }
  }

  console.log(`✅ Итерация завершена. Синхронизировано трафика: ${updatedCount}. Добавлено новых клиентов: ${addedCount}`);
}

syncTraffic();
setInterval(syncTraffic, 5 * 60 * 1000);
