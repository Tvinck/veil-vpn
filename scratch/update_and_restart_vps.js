import { Client } from 'ssh2';

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH Ready. Updating code and restarting services on VPS...');
  
  const script = `
    cd /root/veil-vpn-bot
    echo "=== Discarding local changes on VPS ==="
    git reset --hard HEAD
    git clean -fd
    
    echo ""
    echo "=== Pulling latest changes from GitHub ==="
    git pull origin main
    
    echo ""
    echo "=== Installing dependencies ==="
    npm install
    cd tg-bot
    npm install
    cd ..
    
    echo ""
    echo "=== Restarting PM2 processes ==="
    pm2 restart veil-sync || pm2 restart 1
    pm2 restart veil-bot || pm2 restart 23
    pm2 restart veil-monitor || pm2 restart 2
    
    echo ""
    echo "=== PM2 Status ==="
    pm2 status
  `;
  
  conn.exec(script, (err, stream) => {
    if (err) {
      console.error('Exec error:', err);
      conn.end();
      return;
    }
    let out = '';
    stream.on('close', () => {
      console.log('\n--- VPS UPDATE OUTPUT ---');
      console.log(out);
      conn.end();
    }).on('data', (data) => {
      out += data;
    }).stderr.on('data', (data) => {
      out += data;
    });
  });
}).connect({
  host: '185.142.99.185',
  port: 22,
  username: 'root',
  password: 'iW@Bz+,dM42Ln+'
});
