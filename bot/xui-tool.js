import fetch from 'node-fetch';

const URL = 'http://95.140.154.47:2053';
const USERNAME = 'admin';
const PASSWORD = 'veil_admin_pass';

async function run() {
    try {
        console.log('Logging in...');
        const loginRes = await fetch(`${URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ username: USERNAME, password: PASSWORD })
        });
        
        const cookie = loginRes.headers.get('set-cookie');
        console.log('Login res:', loginRes.status, cookie ? 'Cookie received' : 'No cookie');

        const inboundsRes = await fetch(`${URL}/panel/api/inbounds/list`, {
            method: 'GET',
            headers: { 'Cookie': cookie }
        });
        const inbounds = await inboundsRes.json();
        console.log('Inbounds:', JSON.stringify(inbounds, null, 2));

    } catch(e) {
        console.error(e);
    }
}

run();
