const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data: keys } = await supabase.from('veil_keys').select('*');
    for (const key of keys) {
        if (!key.config_url.includes('encryption=')) {
            const urlParts = key.config_url.split('#');
            const newUrl = urlParts[0] + '&encryption=none&headerType=none#' + (urlParts[1] || 'VEIL-DE');
            await supabase.from('veil_keys').update({ config_url: newUrl }).eq('id', key.id);
            console.log('Updated key:', key.id);
        }
    }
    console.log('Update complete.');
}
run();
