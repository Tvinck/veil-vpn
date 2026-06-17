import https from 'https';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const XUI_URL = 'https://185.142.99.185:36537/qsgoOThSkfHypc0BSW';
const XUI_USER = 'Uvt5i4YUGZ';
const XUI_PASS = 'ffeYdCd65h';

async function run() {
  try {
    console.log('Logging in to X-UI...');
    const formData = new URLSearchParams();
    formData.append('username', XUI_USER);
    formData.append('password', XUI_PASS);

    const homeRes = await fetch(XUI_URL);
    const homeCookies = homeRes.headers.get('set-cookie');
    const homeHtml = await homeRes.text();
    const csrfMatch = homeHtml.match(/name="csrf-token"\s+content="([^"]+)"/);
    const csrfToken = csrfMatch ? csrfMatch[1] : '';

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

    const loginCookies = loginRes.headers.get('set-cookie');
    const finalCookie = loginCookies ? loginCookies.split(';')[0] : (homeCookies ? homeCookies.split(';')[0] : '');

    console.log('Fetching inbounds list...');
    const inboundsRes = await fetch(`${XUI_URL}/panel/api/inbounds/list`, {
      method: 'GET',
      headers: {
        'Cookie': finalCookie,
        'X-Csrf-Token': csrfToken
      }
    });

    const data = await inboundsRes.json();
    if (!data || !data.success) {
      console.error('Failed to retrieve inbounds:', data);
      return;
    }

    const inbounds = data.obj || [];
    const vless = inbounds.find(i => i.protocol === 'vless');
    if (!vless) {
      console.error('No VLESS inbound found.');
      return;
    }

    const settings = typeof vless.settings === 'string' ? JSON.parse(vless.settings) : vless.settings;
    const clients = settings.clients || [];
    console.log(`Updating ${clients.length} clients in X-UI...`);

    for (const client of clients) {
      console.log(`Updating client: ${client.email} (${client.id})...`);
      
      // Fetch the full client object first
      const getRes = await fetch(`${XUI_URL}/panel/api/clients/get/${encodeURIComponent(client.email)}`, {
        headers: {
          'Cookie': finalCookie,
          'X-Csrf-Token': csrfToken
        }
      });
      const getObj = await getRes.json();
      if (!getObj || !getObj.success) {
        console.error(`Failed to get client ${client.email}`);
        continue;
      }
      
      const fullClient = getObj.obj.client;
      
      // Update with flow: 'xtls-rprx-vision'
      const payload = {
        ...fullClient,
        id: fullClient.uuid, // Use uuid string as id for API compatibility
        flow: 'xtls-rprx-vision'
      };

      const updateRes = await fetch(`${XUI_URL}/panel/api/clients/update/${encodeURIComponent(client.email)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': finalCookie,
          'X-Csrf-Token': csrfToken
        },
        body: JSON.stringify(payload)
      });
      
      const updateResult = await updateRes.json();
      if (updateResult && updateResult.success) {
        console.log(`Client ${client.email} updated successfully!`);
      } else {
        console.error(`Failed to update ${client.email}:`, updateResult);
      }
    }

    console.log('All clients processed.');
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
