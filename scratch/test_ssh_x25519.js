import { Client } from 'ssh2';

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH Ready. Checking x25519 keys...');
  
  const script = `
    /usr/local/x-ui/bin/xray-linux-amd64 x25519 -i "uHiiRKqSaiVBGECefqAXzhNVG7qwxWf5RdaBkdtFOUs"
  `;
  
  conn.exec(script, (err, stream) => {
    if (err) {
      console.error('Exec error:', err);
      conn.end();
      return;
    }
    let out = '';
    stream.on('close', () => {
      console.log('\n--- X25519 KEY CHECK ---');
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
