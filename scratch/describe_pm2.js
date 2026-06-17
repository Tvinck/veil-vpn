import { Client } from 'ssh2';

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH Ready. Describing PM2 processes...');
  
  const script = `
    pm2 show 1 | grep "cwd" || pm2 show 1
    pm2 show 22 | grep "cwd" || pm2 show 22
  `;
  
  conn.exec(script, (err, stream) => {
    if (err) {
      console.error('Exec error:', err);
      conn.end();
      return;
    }
    let out = '';
    stream.on('close', () => {
      console.log('\n--- PM2 DESCRIBE ---');
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
