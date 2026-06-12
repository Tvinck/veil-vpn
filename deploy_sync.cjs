const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

// Локальные пути к файлам
const SYNC_FILE = path.resolve(__dirname, 'tg-bot/sync.js');
const SYNC_ENV  = path.resolve(__dirname, '.env');
const BOT_FILE  = path.resolve(__dirname, 'tg-bot/bot.js');
const BOT_ENV   = path.resolve(__dirname, 'tg-bot/.env');

const SSH_CONFIG = {
  host: '185.142.99.185',
  port: 22,
  username: 'root',
  password: 'iW@Bz+,dM42Ln+'
};

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

  console.log('\n📁 Загружаем файлы для bazzar-sync через SFTP...');
  await sftpUpload(sftp, SYNC_FILE,  `${SYNC_REMOTE_DIR}/sync.js`);
  await sftpUpload(sftp, SYNC_ENV,   `${SYNC_REMOTE_DIR}/.env`);
  await sftpUpload(sftp, null, `${SYNC_REMOTE_DIR}/package.json`, packageJson);

  console.log('\n📁 Загружаем файлы для veil-bot через SFTP...');
  await sftpUpload(sftp, BOT_FILE,  `${BOT_REMOTE_DIR}/bot.js`);
  await sftpUpload(sftp, BOT_ENV,   `${BOT_REMOTE_DIR}/.env`);

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

  console.log('\n🔄 Перезапускаем veil-bot в PM2...');
  await execCmd(conn, `pm2 delete veil-bot 2>/dev/null || true`);
  await execCmd(conn, `cd ${BOT_REMOTE_DIR} && pm2 start bot.js --name veil-bot --interpreter node`);

  await execCmd(conn, `pm2 save`);

  // 5. Ждём 5 сек и смотрим логи
  console.log('\n⏳ Ждём 5 секунд для стабилизации процессов...');
  await new Promise(r => setTimeout(r, 5000));

  console.log('\n📋 Логи bazzar-sync:');
  await execCmd(conn, `pm2 logs bazzar-sync --lines 20 --nostream`);

  console.log('\n📋 Логи veil-bot:');
  await execCmd(conn, `pm2 logs veil-bot --lines 20 --nostream`);

  conn.end();
  console.log('\n✅ Деплой завершён!');
}

deploy().catch(err => {
  console.error('❌ Ошибка деплоя:', err.message);
  process.exit(1);
});
