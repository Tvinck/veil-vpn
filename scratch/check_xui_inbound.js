import https from 'https';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const XUI_URL = 'https://185.142.99.185:36537/qsgoOThSkfHypc0BSW';
const XUI_USER = 'Uvt5i4YUGZ';
const XUI_PASS = 'ffeYdCd65h';

async function run() {
  try {
    console.log('Fetching X-UI home page for CSRF token and session cookie...');
    const homeRes = await fetch(XUI_URL, {
      method: 'GET'
    });
    
    const homeCookies = homeRes.headers.get('set-cookie');
    console.log('Initial cookies:', homeCookies);
    
    const homeHtml = await homeRes.text();
    const csrfMatch = homeHtml.match(/name="csrf-token"\s+content="([^"]+)"/);
    const csrfToken = csrfMatch ? csrfMatch[1] : '';
    console.log('CSRF Token:', csrfToken);

    const formData = new URLSearchParams();
    formData.append('username', XUI_USER);
    formData.append('password', XUI_PASS);

    console.log('Logging in to X-UI...');
    const loginRes = await fetch(`${XUI_URL}/login`, {
      method: 'POST',
      body: formData,
      headers: {
        'Origin': 'https://185.142.99.185:36537',
        'Referer': `${XUI_URL}/`,
        'X-Csrf-Token': csrfToken,
        'Cookie': homeCookies ? homeCookies.split(';')[0] : ''
      }
    });

    console.log('Login Status:', loginRes.status);
    const loginCookies = loginRes.headers.get('set-cookie');
    console.log('Auth cookies:', loginCookies);

    const finalCookie = loginCookies ? loginCookies.split(';')[0] : (homeCookies ? homeCookies.split(';')[0] : '');

    console.log('Fetching inbounds list...');
    const inboundsRes = await fetch(`${XUI_URL}/panel/api/inbounds/list`, {
      method: 'GET',
      headers: {
        'Cookie': finalCookie,
        'X-Csrf-Token': csrfToken
      }
    });

    console.log('List Status:', inboundsRes.status);
    const data = await inboundsRes.json();
    
    if (data && data.success) {
      const inbounds = data.obj || [];
      console.log(`Found ${inbounds.length} inbounds.`);
      
      const vless = inbounds.find(i => i.protocol === 'vless');
      if (vless) {
        console.log('\n--- VLESS Inbound Details ---');
        console.log('ID:', vless.id);
        console.log('Port:', vless.port);
        console.log('Protocol:', vless.protocol);
        console.log('Settings:', typeof vless.settings === 'string' ? JSON.stringify(JSON.parse(vless.settings), null, 2) : JSON.stringify(vless.settings, null, 2));
        console.log('Stream Settings:', typeof vless.streamSettings === 'string' ? JSON.stringify(JSON.parse(vless.streamSettings), null, 2) : JSON.stringify(vless.streamSettings, null, 2));
        console.log('Remark:', vless.remark);
        console.log('Enable:', vless.enable);
      } else {
        console.log('No VLESS inbound found.');
      }
    } else {
      console.error('Failed to retrieve inbounds:', data);
    }

  } catch (err) {
    console.error('Error running check:', err);
  }
}

run();
