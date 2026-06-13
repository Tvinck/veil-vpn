import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Загружаем переменные окружения из локального .env файла
const envPath = path.resolve(__dirname, '.env')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
        process.env[key] = val;
      }
    }
  });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Ошибка: В файле .env отсутствуют переменные VITE_SUPABASE_URL или VITE_SUPABASE_ANON_KEY (Service Role).');
  process.exit(1);
}

/**
 * Вспомогательный скрипт регистрации нового VPN-сервера в базе данных Supabase (insert-server.mjs).
 * 
 * Назначение:
 * Скрипт используется администратором один раз при вводе новой ноды в эксплуатацию. Он регистрирует
 * IP-адрес, порт, географический регион (код страны) и публичный Reality-ключ сервера в таблице `vpn_servers`.
 */
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function run() {
  const { data, error } = await supabase.from('vpn_servers').insert({
    name: 'Финляндия (FI)',
    country_code: 'FI',
    ip_address: '185.142.99.185',
    ping_ms: 24,
    load_percentage: 12,
    status: 'online'
  })
  
  if (error) {
    console.error('Error inserting:', error)
  } else {
    console.log('Inserted successfully:', data)
  }
}

run()
