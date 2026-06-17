import https from 'https';

const options = {
  hostname: '216.198.79.65',
  port: 443,
  path: '/api/sub?token=6a913ac8b84f4f2c8771e950ece22ce4',
  method: 'GET',
  headers: {
    'Host': 'www.veil-vps.online',
    'User-Agent': 'hiddify'
  },
  rejectUnauthorized: false // Ignore SSL cert mismatch since we use IP
};

const req = https.request(options, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Body:', data);
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.end();
