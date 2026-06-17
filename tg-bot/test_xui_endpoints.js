import axios from 'axios';
import https from 'https';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

const XUI_URL = process.env.XUI_URL;
const XUI_USER = process.env.XUI_USERNAME;
const XUI_PASS = process.env.XUI_PASSWORD;

const httpsAgent = new https.Agent({ rejectUnauthorized: false });
const baseURL = XUI_URL.endsWith('/') ? XUI_URL : XUI_URL + '/';
const api = axios.create({ baseURL, httpsAgent, withCredentials: true });

async function login() {
  const homeRes = await api.get('');
  const html = typeof homeRes.data === 'string' ? homeRes.data : '';
  const csrfMatch = html.match(/name="csrf-token"\s+content="([^"]+)"/);
  const csrfToken = csrfMatch ? csrfMatch[1] : '';

  const rawCookies = homeRes.headers['set-cookie'] || [];
  const rawSessionCookie = Array.isArray(rawCookies) ? rawCookies[0] : rawCookies;
  const sessionCookie = rawSessionCookie ? rawSessionCookie.split(';')[0] : '';

  const loginRes = await api.post('login',
    { username: XUI_USER, password: XUI_PASS },
    {
      headers: {
        'X-Csrf-Token': csrfToken,
        'Cookie': sessionCookie,
      },
    },
  );

  if (!loginRes.data?.success) {
    console.error('Login failed');
    process.exit(1);
  }

  const authCookies = loginRes.headers['set-cookie'] || [];
  const rawAuthCookie = Array.isArray(authCookies) ? authCookies[0] : authCookies;
  const authCookie = rawAuthCookie ? rawAuthCookie.split(';')[0] : '';
  api.defaults.headers.common['Cookie'] = authCookie || sessionCookie;
  api.defaults.headers.common['X-Csrf-Token'] = csrfToken;
  console.log('Logged in successfully!');
}

async function testEndpoints() {
  await login();

  // 1. Get inbounds list
  const listRes = await api.get('panel/api/inbounds/list');
  const inbounds = listRes.data.obj || [];
  console.log('Found inbounds:', inbounds.map(i => `${i.id}: ${i.remark}`));

  // Let's pick one client from inbound 1
  const inbound1 = inbounds.find(i => i.id === 1);
  const settings = typeof inbound1.settings === 'string' ? JSON.parse(inbound1.settings) : inbound1.settings;
  const client = settings.clients[0];
  if (!client) {
    console.log('No clients found in inbound 1');
    return;
  }

  console.log('Testing update on client:', client.email, 'with UUID:', client.id);

  // Try updating using panel/api/inbounds/updateClient/<clientUuid>
  try {
    const payload = {
      client: {
        id: client.id,
        email: client.email,
        flow: client.flow,
        totalGB: client.totalGB,
        expiryTime: client.expiryTime,
        limitIp: client.limitIp,
        enable: client.enable,
      },
      inboundIds: [1]
    };
    const updateRes = await api.post(`panel/api/inbounds/updateClient/${client.id}`, payload);
    console.log('Result of updateClient (MHSanaei style):', updateRes.data);
  } catch (err) {
    console.log('updateClient failed:', err.message);
  }

  // Test get client API
  try {
    const getRes = await api.get(`panel/api/clients/get/${encodeURIComponent(client.email)}`);
    console.log('Result of clients/get:', JSON.stringify(getRes.data, null, 2));
  } catch (err) {
    console.log('clients/get failed:', err.message);
  }
}

testEndpoints().catch(console.error);
