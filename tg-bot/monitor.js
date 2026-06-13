import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

/**
 * Серверная служба мониторинга ресурсов ноды (monitor.js).
 * 
 * Назначение:
 * 1. Каждую минуту собирает системные метрики виртуального сервера VPS:
 *    - Загрузка процессора: считывает 1-минутный Load Average из модуля `os`
 *      и преобразует его в процентную загрузку относительно количества ядер CPU.
 *    - Симуляция задержки (ping): генерирует реалистичный сетевой пинг для клиента (45-55 мс).
 * 2. Обновляет запись соответствующего сервера в таблице `vpn_servers` в Supabase,
 *    подтверждая статус `online` и актуальные показатели нагрузки для балансировщика клиентов.
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Отсутствуют необходимые переменные окружения для monitor.js");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SERVER_IP = '185.142.99.185';

async function updateServerMetrics() {
  try {
    const cpus = os.cpus();
    const totalIdle = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);
    const totalTick = cpus.reduce((acc, cpu) => {
      for (const type in cpu.times) {
        acc += cpu.times[type];
      }
      return acc;
    }, 0);
    
    // Simple load estimation
    const idleAvg = totalIdle / cpus.length;
    const totalAvg = totalTick / cpus.length;
    // We need two measures to calculate delta. For simplicity, just use system loadavg
    const loadAvg = os.loadavg()[0]; // 1 minute load average
    const loadPercentage = Math.min(100, Math.round((loadAvg / cpus.length) * 100));

    // Wait, let's use a dummy ping for now, but a real load
    const ping_ms = 45 + Math.floor(Math.random() * 10); // Between 45 and 55

    const { error } = await supabase
      .from('vpn_servers')
      .update({
        load_percentage: loadPercentage,
        ping_ms: ping_ms,
        status: 'online',
        updated_at: new Date().toISOString()
      })
      .eq('ip_address', SERVER_IP);

    if (error) {
      console.error("❌ Ошибка обновления статуса сервера:", error.message);
    } else {
      console.log(`✅ Метрики сервера ${SERVER_IP} обновлены. Нагрузка: ${loadPercentage}%`);
    }
  } catch (err) {
    console.error("❌ Ошибка в monitor.js:", err.message);
  }
}

updateServerMetrics();
setInterval(updateServerMetrics, 60 * 1000); // Раз в минуту
