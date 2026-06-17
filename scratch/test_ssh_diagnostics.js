import { Client } from 'ssh2';

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH Ready. Running diagnostics...');
  
  const script = `
    echo "=== Xray Listening Ports ==="
    ss -tulpn | grep 443 || echo "Port 443 is NOT listening!"
    
    echo ""
    echo "=== Xray / X-UI Process Status ==="
    systemctl status xray --no-pager || ps aux | grep xray
    systemctl status x-ui --no-pager || ps aux | grep x-ui
    
    echo ""
    echo "=== Firewall Rules (UFW) ==="
    ufw status || echo "ufw not installed or inactive"
    
    echo ""
    echo "=== IPTables Port 443 Rules ==="
    iptables -L -n -v | grep 443 || echo "No explicit iptables rule for 443"
    
    echo ""
    echo "=== Xray Last Logs ==="
    tail -n 30 /var/log/xray/access.log || tail -n 30 /var/log/xray/error.log || journalctl -u xray -n 30 --no-pager
  `;
  
  conn.exec(script, (err, stream) => {
    if (err) {
      console.error('Exec error:', err);
      conn.end();
      return;
    }
    let out = '';
    stream.on('close', () => {
      console.log('\n--- DIAGNOSTICS OUTPUT ---');
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
