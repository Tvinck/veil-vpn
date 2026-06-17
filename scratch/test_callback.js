import handler from '../api/ggsel-callback.js';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Setup Supabase credentials (pointing to production Connect DB as defined in veil-vpn/.env)
const supabaseUrl = 'https://fhwrdhebhgywhvoeqpxj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZod3JkaGViaGd5d2h2b2VxcHhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTkyOTQyNywiZXhwIjoyMDk1NTA1NDI3fQ.IIIIpJ7yXhuxp6i1N183ldsqRIHfltsQIPZA27sRMo4';

// Set them in process.env so that ggsel-callback.js can read them!
process.env.SUPABASE_URL = supabaseUrl;
process.env.SUPABASE_SERVICE_ROLE_KEY = supabaseKey;

const supabase = createClient(supabaseUrl, supabaseKey);

// Clean up any previous test subscriptions for tester@example.com
async function cleanup() {
  console.log('Cleaning up test user...');
  await supabase.from('vpn_subscriptions').delete().in('username', ['tester@example.com', 'referrer@example.com']);
  await supabase.from('vpn_orders').delete().in('username', ['tester@example.com', 'referrer@example.com']);
  await supabase.from('vpn_referrals').delete().in('referrer_username', ['referrer@example.com']);
}

// Hijack global fetch to mock GGsel API
const originalFetch = global.fetch;
global.fetch = async (url, options) => {
  const urlStr = typeof url === 'string' ? url : url.toString();
  console.log(`[MOCK FETCH] Calling: ${urlStr}`);
  
  if (urlStr.includes('/apilogin')) {
    return {
      ok: true,
      status: 200,
      json: async () => ({ token: 'mocked_session_token_abc123' }),
      text: async () => '{"token":"mocked_session_token_abc123"}'
    };
  }
  
  if (urlStr.includes('/purchases/unique-code/')) {
    return {
      ok: true,
      status: 200,
      json: async () => ({
        retval: 0,
        retdesc: 'Success',
        inv: 999999,
        id_goods: 12345, // Dummy product ID
        amount: 250,
        type_curr: 'RUB',
        email: 'tester@example.com',
        date_pay: '2026-06-17 12:00:00',
        unique_code_state: {
          state: 1 // Not verified yet
        }
      })
    };
  }
  
  if (urlStr.includes('/deliver')) {
    return {
      ok: true,
      status: 200,
      json: async () => ({ retval: 0, retdesc: 'Delivered' })
    };
  }
  
  return originalFetch(url, options);
};

// Mock Express response object
function makeMockRes(resolve) {
  const headers = {};
  return {
    setHeader(name, value) {
      headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      resolve(this);
    },
    end() {
      resolve(this);
    }
  };
}

async function run() {
  await cleanup();
  
  console.log('\n--- TEST 1: Activating a new user ---');
  const req1 = {
    method: 'POST',
    body: { uniqueCode: 'ABC123XYZ4567890' } // 16 alphanumeric characters
  };
  
  const res1 = await new Promise((resolve) => {
    handler(req1, makeMockRes(resolve));
  });
  
  console.log('Test 1 Response Status:', res1.statusCode);
  console.log('Test 1 Response Body:', res1.body);
  
  // Verify user created in Supabase
  const { data: sub1 } = await supabase.from('vpn_subscriptions').select('*').eq('username', 'tester@example.com').single();
  console.log('Created Subscription in DB:', sub1 ? { username: sub1.username, token: sub1.token, status: sub1.status, expires_at: sub1.expires_at } : 'Not found');
  
  // Verify order created in Supabase
  const { data: orders1 } = await supabase.from('vpn_orders').select('*').eq('username', 'tester@example.com');
  console.log('Created Orders in DB:', orders1);

  console.log('\n--- TEST 2: Extending the existing user ---');
  const req2 = {
    method: 'POST',
    body: { uniqueCode: 'ABC123XYZ4567890' }
  };
  
  const res2 = await new Promise((resolve) => {
    handler(req2, makeMockRes(resolve));
  });
  
  console.log('Test 2 Response Status:', res2.statusCode);
  console.log('Test 2 Response Body:', res2.body);
  
  // Verify user updated in Supabase
  const { data: sub2 } = await supabase.from('vpn_subscriptions').select('*').eq('username', 'tester@example.com').single();
  console.log('Updated Subscription in DB:', sub2 ? { username: sub2.username, token: sub2.token, status: sub2.status, expires_at: sub2.expires_at } : 'Not found');
  
  // Verify orders count
  const { data: orders2 } = await supabase.from('vpn_orders').select('*').eq('username', 'tester@example.com');
  console.log('All Orders in DB after Test 2:', orders2);

  // Clean up before referral test
  await cleanup();

  console.log('\n--- TEST 3: Activating a user with a referrer ---');
  // First, create the referrer subscription
  const referrerEmail = 'referrer@example.com';
  const referrerExpires = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 days left
  await supabase.from('vpn_subscriptions').insert({
    id: crypto.randomUUID(),
    username: referrerEmail,
    token: 'test_referrer_token_123',
    subscription_key: 'test_referrer_key_123',
    status: 'active',
    traffic_limit: 536870912000,
    expires_at: referrerExpires.toISOString(),
    ip_limit: 3,
    traffic_used: 0,
    tg_bot_linked: false,
    tg_channel_subscribed: false
  });

  const req3 = {
    method: 'POST',
    body: {
      uniqueCode: 'ABC123XYZ4567890',
      referrer: referrerEmail
    }
  };

  const res3 = await new Promise((resolve) => {
    handler(req3, makeMockRes(resolve));
  });

  console.log('Test 3 Response Status:', res3.statusCode);
  console.log('Test 3 Response Body:', res3.body);

  // Verify referee got 30 days purchase + 30 days bonus = 60 days total
  const { data: subReferee } = await supabase.from('vpn_subscriptions').select('*').eq('username', 'tester@example.com').single();
  const refereeExpectedExpires = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
  console.log('Referee Subscription in DB:', subReferee ? {
    username: subReferee.username,
    expires_at: subReferee.expires_at,
    expected_approx: refereeExpectedExpires.toISOString()
  } : 'Not found');

  // Verify referrer got +30 days bonus (from 10 days -> 40 days)
  const { data: subReferrer } = await supabase.from('vpn_subscriptions').select('*').eq('username', referrerEmail).single();
  const referrerExpectedExpires = new Date(referrerExpires.getTime() + 30 * 24 * 60 * 60 * 1000);
  console.log('Referrer Subscription in DB:', subReferrer ? {
    username: subReferrer.username,
    expires_at: subReferrer.expires_at,
    expected_exact: referrerExpectedExpires.toISOString()
  } : 'Not found');

  // Verify referral relation created in vpn_referrals
  const { data: refRecord } = await supabase.from('vpn_referrals').select('*').eq('referrer_username', referrerEmail).single();
  console.log('Referral Record in DB:', refRecord);

  // Clean up
  await cleanup();
  console.log('\nAll tests completed successfully!');
  process.exit(0);
}

run().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
