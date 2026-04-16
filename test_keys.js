import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://djodaxpjnzxzdspvvyuw.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqb2RheHBqbnp4emRzcHZ2eXV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjM1MTM3MCwiZXhwIjoyMDkxOTI3MzcwfQ.aGgDEh_4wt5smapyMQZc1YbE7vZiM-KTcJuCQgA6SXQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function test() {
    const { data: keys, error: keysErr } = await supabase.from('veil_keys').select('*').limit(1);
    console.log('keys:', keys, 'err:', keysErr);
}

test();
