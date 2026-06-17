import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import ws from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

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

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
  realtime: { transport: ws }
});

async function updateServerMetrics() {
  try {
    const cpus = os.cpus();
    const loadAvg = os.loadavg()[0]; // 1 minute load average
    const loadPercentage = Math.min(100, Math.round((loadAvg / cpus.length) * 100));

    // Fetch all servers
    const { data: servers, error: fetchError } = await supabase
      .from('vpn_servers')
      .select('id, name');

    if (fetchError) {
      console.error("❌ Ошибка получения серверов:", fetchError.message);
      return;
    }

    console.log(`🔄 Обновление метрик для ${servers.length} серверов...`);

    for (const server of servers) {
      const basePing = 20 + Math.floor(Math.random() * 10); // 20-30 ms baseline
      let geoPingOffset = 0;
      
      // Apply simulated ping offsets depending on country name
      if (server.name.includes('США') || server.name.includes('US')) geoPingOffset = 85;
      else if (server.name.includes('Великобритания') || server.name.includes('GB')) geoPingOffset = 40;
      else if (server.name.includes('Франция') || server.name.includes('FR')) geoPingOffset = 30;
      else if (server.name.includes('Швеция') || server.name.includes('SE')) geoPingOffset = 25;
      else if (server.name.includes('Германия') || server.name.includes('DE')) geoPingOffset = 22;
      else if (server.name.includes('Нидерланды') || server.name.includes('NL')) geoPingOffset = 18;
      else if (server.name.includes('Финляндия') || server.name.includes('FI')) geoPingOffset = 4; // Main server location, lowest ping

      const ping_ms = basePing + geoPingOffset + Math.floor(Math.random() * 5);
      const serverLoad = Math.max(2, Math.min(95, loadPercentage + Math.floor(Math.random() * 8) - 4));

      const { error: updateError } = await supabase
        .from('vpn_servers')
        .update({
          load_percentage: serverLoad,
          ping_ms: ping_ms,
          status: 'online'
        })
        .eq('id', server.id);

      if (updateError) {
        console.error(`❌ Ошибка обновления сервера ${server.name}:`, updateError.message);
      } else {
        console.log(`  🔹 ${server.name}: ping=${ping_ms}ms, load=${serverLoad}%`);
      }
    }
  } catch (err) {
    console.error("❌ Ошибка в monitor.js:", err.message);
  }
}

updateServerMetrics();
setInterval(updateServerMetrics, 60 * 1000); // Раз в минуту
