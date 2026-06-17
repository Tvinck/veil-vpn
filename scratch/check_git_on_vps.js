import { Client } from 'ssh2';

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH Ready. Checking git on VPS...');
  
  const script = `
    cd /root/veil-vpn-bot
    git status
    git remote -v
  `;
  
  conn.exec(script, (err, stream) => {
    if (err) {
      console.error('Exec error:', err);
      conn.end();
      return;
    }
    let out = '';
    stream.on('close', () => {
      console.log('\n--- GIT REMOTE ON VPS ---');
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
