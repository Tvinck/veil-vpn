import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client } from 'ssh2';

// Загрузка переменных окружения
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SSH_HOST = process.env.SSH_HOST;
const SSH_USER = process.env.SSH_USER;
const SSH_PASS = process.env.SSH_PASS;

if (!SUPABASE_URL || !SUPABASE_KEY || !SSH_HOST || !SSH_USER || !SSH_PASS) {
  console.error("❌ Отсутствуют необходимые переменные окружения для sync.js");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Выполнение команды по SSH и возврат результата
 */
function execSSH(cmd) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn.on('ready', () => {
      conn.exec(cmd, (err, stream) => {
        if (err) {
          conn.end();
          return reject(err);
        }
        let data = '';
        stream.on('close', (code, signal) => {
          conn.end();
          if (code !== 0) return reject(new Error(`Exit code ${code}`));
          resolve(data.trim());
        }).on('data', (chunk) => {
          data += chunk;
        }).stderr.on('data', (data) => {
          // ignore stderr
        });
      });
    }).on('error', (err) => {
      reject(err);
    }).connect({
      host: SSH_HOST,
      port: 22,
      username: SSH_USER,
      password: SSH_PASS,
      readyTimeout: 10000
    });
  });
}

/**
 * Получение списка клиентов и их трафика из БД 3X-UI через SSH
 */
async function getXuiTrafficsSSH() {
  try {
    const script = `sqlite3 -json /etc/x-ui/x-ui.db "SELECT email, up, down FROM client_traffics;"`;
    const result = await execSSH(script);
    
    if (!result) return new Map();
    
    const rows = JSON.parse(result);
    const clientMap = new Map();
    
    for (const row of rows) {
      if (row.email) {
        const totalTrafficBytes = (row.up || 0) + (row.down || 0);
        clientMap.set(row.email, totalTrafficBytes);
      }
    }
    return clientMap;
  } catch (err) {
    console.error("❌ Ошибка запроса БД 3x-ui через SSH:", err.message);
    return null;
  }
}

/**
 * Синхронизация трафика с БД Supabase
 */
async function syncTraffic() {
  console.log("🔄 Запуск синхронизации трафика...");

  const clientTraffics = await getXuiTrafficsSSH();
  if (!clientTraffics) {
    console.log("⚠️ Не удалось получить трафик, пропуск итерации.");
    return;
  }

  // Получаем все активные подписки из Supabase
  const { data: subs, error } = await supabase
    .from('subscriptions')
    .select('id, subscription_key, token, traffic_used');

  if (error) {
    console.error("❌ Ошибка получения подписок из Supabase:", error.message);
    return;
  }

  let updatedCount = 0;

  for (const sub of subs) {
    let trafficUsed = clientTraffics.get(sub.token);
    if (trafficUsed === undefined) {
      trafficUsed = clientTraffics.get(sub.subscription_key);
    }
    
    if (trafficUsed !== undefined && trafficUsed !== sub.traffic_used) {
      const { error: updateErr } = await supabase
        .from('subscriptions')
        .update({ traffic_used: trafficUsed })
        .eq('id', sub.id);
        
      if (!updateErr) {
        updatedCount++;
      }
    }
  }

  console.log(`✅ Синхронизация завершена. Обновлено подписок: ${updatedCount}`);
}

// Запуск при старте скрипта
syncTraffic();

// Периодический запуск каждые 5 минут
setInterval(syncTraffic, 5 * 60 * 1000);
