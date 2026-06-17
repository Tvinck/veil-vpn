const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

/**
 * Скрипт автоматизированного деплоя службы синхронизации и бота на удаленный VPS (deploy_sync.cjs).
 * 
 * Назначение:
 * 1. Устанавливает SSH-соединение с целевым сервером по протоколу SFTP.
 * 2. Копирует локальные исполняемые файлы (`sync.js`, `.env`, `bot.js`) в соответствующие директории на VPS (`/opt/bazzar-sync`, `/root/veil-vpn-bot/tg-bot`).
 * 3. Генерирует удаленный `package.json` и запускает удаленную установку npm-зависимостей.
 * 4. Регистрирует и перезапускает процессы в менеджере задач PM2 (`bazzar-sync`, `veil-bot`).
 * 5. Ждет стабилизации процессов и выводит последние строки логов PM2.
 * 
 * ⚠️ КРИТИЧЕСКАЯ УЯЗВИМОСТЬ БЕЗОПАСНОСТИ:
 * Данные доступа SSH_CONFIG (пароль root-пользователя) зашиты в коде скрипта в открытом виде.
 * Рекомендуется вынести эти данные в переменные окружения (.env) или использовать авторизацию по SSH-ключам.
 */
// Локальные пути к файлам
const SYNC_FILE = path.resolve(__dirname, 'tg-bot/sync.js');
const SYNC_ENV  = path.resolve(__dirname, '.env');
const BOT_FILE  = path.resolve(__dirname, 'tg-bot/bot.js');
const BOT_ENV   = path.resolve(__dirname, 'tg-bot/.env');
const MONITOR_FILE = path.resolve(__dirname, 'tg-bot/monitor.js');
const SUB_SERVER_FILE = path.resolve(__dirname, 'tg-bot/sub_server.js');

// Загружаем переменные окружения из локального .env файла
const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
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

const SSH_CONFIG = {
  host: process.env.SSH_HOST || '185.142.99.185',
  port: parseInt(process.env.SSH_PORT || '22', 10),
  username: process.env.SSH_USER || 'root',
  password: process.env.SSH_PASS
};

if (!SSH_CONFIG.password) {
  console.error('❌ Ошибка: В файле .env отсутствует переменная SSH_PASS с паролем от сервера.');
  process.exit(1);
}

const SYNC_REMOTE_DIR = '/opt/bazzar-sync';
const BOT_REMOTE_DIR  = '/root/veil-vpn-bot/tg-bot';

// package.json для VPS (bazzar-sync)
const packageJson = JSON.stringify({
  name: 'bazzar-sync',
  version: '1.0.0',
  type: 'module',
  dependencies: {
    '@supabase/supabase-js': '^2.43.4',
    'axios': '^1.7.2',
    'dotenv': '^16.4.5',
    'ws': '^8.18.0'
  }
}, null, 2);

function execCmd(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '', errOut = '';
      stream.on('close', (code) => {
        if (errOut) process.stderr.write(errOut);
        resolve({ code, out });
      });
      stream.on('data', d => { out += d; process.stdout.write(String(d)); });
      stream.stderr.on('data', d => { errOut += d; process.stderr.write(String(d)); });
    });
  });
}

function sftpUpload(sftp, localPath, remotePath, content) {
  return new Promise((resolve, reject) => {
    const buf = content !== undefined ? Buffer.from(content) : fs.readFileSync(localPath);
    sftp.open(remotePath, 'w', (err, handle) => {
      if (err) return reject(err);
      sftp.write(handle, buf, 0, buf.length, 0, (werr) => {
        if (werr) return reject(werr);
        sftp.close(handle, (cerr) => {
          if (cerr) return reject(cerr);
          console.log(`  📤 Загружен: ${remotePath}`);
          resolve();
        });
      });
    });
  });
}

async function deploy() {
  const conn = new Client();

  await new Promise((resolve, reject) => {
    conn.on('ready', resolve);
    conn.on('error', reject);
    conn.connect(SSH_CONFIG);
  });

  console.log('✅ SSH подключён\n');

  // 1. Создаём директорию bazzar-sync
  await execCmd(conn, `mkdir -p ${SYNC_REMOTE_DIR}`);

  // 2. SFTP — загружаем файлы
  const sftp = await new Promise((resolve, reject) => {
    conn.sftp((err, s) => err ? reject(err) : resolve(s));
  });

  console.log('\n📁 Загружаем файлы для bazzar-sync и sub_server через SFTP...');
  await sftpUpload(sftp, SYNC_FILE,  `${SYNC_REMOTE_DIR}/sync.js`);
  await sftpUpload(sftp, SYNC_ENV,   `${SYNC_REMOTE_DIR}/.env`);
  await sftpUpload(sftp, SUB_SERVER_FILE, `${SYNC_REMOTE_DIR}/sub_server.js`);
  await sftpUpload(sftp, null, `${SYNC_REMOTE_DIR}/package.json`, packageJson);

  console.log('\n📁 Загружаем файлы для veil-bot и monitor через SFTP...');
  await sftpUpload(sftp, BOT_FILE,  `${BOT_REMOTE_DIR}/bot.js`);
  await sftpUpload(sftp, BOT_ENV,   `${BOT_REMOTE_DIR}/.env`);
  await sftpUpload(sftp, MONITOR_FILE, `${BOT_REMOTE_DIR}/monitor.js`);

  sftp.end();

  // 3. npm install для bazzar-sync и bot
  console.log('\n📦 Устанавливаем зависимости для bazzar-sync...');
  await execCmd(conn, `cd ${SYNC_REMOTE_DIR} && npm install --omit=dev 2>&1`);

  console.log('\n📦 Устанавливаем ws для veil-bot...');
  await execCmd(conn, `cd ${BOT_REMOTE_DIR} && npm install ws --save 2>&1`);

  // 4. Перезапускаем процессы в PM2
  console.log('\n🔄 Перезапускаем bazzar-sync в PM2...');
  await execCmd(conn, `pm2 delete bazzar-sync 2>/dev/null || true`);
  await execCmd(conn, `cd ${SYNC_REMOTE_DIR} && pm2 start sync.js --name bazzar-sync --interpreter node`);

  console.log('\n🔄 Перезапускаем bazzar-sub-server в PM2...');
  await execCmd(conn, `pm2 delete bazzar-sub-server 2>/dev/null || true`);
  await execCmd(conn, `cd ${SYNC_REMOTE_DIR} && pm2 start sub_server.js --name bazzar-sub-server --interpreter node`);

  console.log('\n🔄 Перезапускаем veil-bot в PM2...');
  await execCmd(conn, `pm2 delete veil-bot 2>/dev/null || true`);
  await execCmd(conn, `cd ${BOT_REMOTE_DIR} && pm2 start bot.js --name veil-bot --interpreter node`);

  console.log('\n🔄 Перезапускаем veil-monitor в PM2...');
  await execCmd(conn, `pm2 delete veil-monitor 2>/dev/null || true`);
  await execCmd(conn, `cd ${BOT_REMOTE_DIR} && pm2 start monitor.js --name veil-monitor --interpreter node`);

  await execCmd(conn, `pm2 save`);

  // 5. Ждём 5 сек и смотрим логи
  console.log('\n⏳ Ждём 5 секунд для стабилизации процессов...');
  await new Promise(r => setTimeout(r, 5000));

  console.log('\n📋 Логи bazzar-sync:');
  await execCmd(conn, `pm2 logs bazzar-sync --lines 20 --nostream`);

  console.log('\n📋 Логи bazzar-sub-server:');
  await execCmd(conn, `pm2 logs bazzar-sub-server --lines 20 --nostream`);

  console.log('\n📋 Логи veil-bot:');
  await execCmd(conn, `pm2 logs veil-bot --lines 20 --nostream`);

  console.log('\n📋 Логи veil-monitor:');
  await execCmd(conn, `pm2 logs veil-monitor --lines 20 --nostream`);

  conn.end();
  console.log('\n✅ Деплой завершён!');
}

deploy().catch(err => {
  console.error('❌ Ошибка деплоя:', err.message);
  process.exit(1);
});
