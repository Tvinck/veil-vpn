const apiKey = '372a1c75d983024c4634dc6b64d238d4f4251c6455b42ad7f1935d2f47ef275f';

async function testEndpoint(url, headers) {
  try {
    const res = await fetch(url, { headers });
    console.log(`URL: ${url}`);
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log(`Body: ${text.slice(0, 300)}\n`);
  } catch (err) {
    console.error(`Error fetching ${url}:`, err.message);
  }
}

async function run() {
  const url1 = 'https://seller.ggsel.com/api_sellers/api/sellers/account/balance/info';
  const url2 = 'https://seller.ggsel.com/api_sellers/api/purchases/unique-code/dummy_code';
  
  console.log('Testing plain API key on V1 endpoints...');
  await testEndpoint(url1, { 'Authorization': apiKey, 'Accept': 'application/json' });
  await testEndpoint(url2, { 'Authorization': apiKey, 'Accept': 'application/json' });
}

run();
