import net from 'net';

const client = new net.Socket();
client.setTimeout(3000);

console.log('Connecting to 185.142.99.185:443...');

client.connect(443, '185.142.99.185', () => {
  console.log('SUCCESS: Connected to 185.142.99.185 on port 443!');
  client.destroy();
});

client.on('error', (err) => {
  console.error('ERROR connecting to 185.142.99.185 on port 443:', err.message);
  client.destroy();
});

client.on('timeout', () => {
  console.error('TIMEOUT: Connection to 185.142.99.185 on port 443 timed out.');
  client.destroy();
});
