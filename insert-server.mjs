import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://fhwrdhebhgywhvoeqpxj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZod3JkaGViaGd5d2h2b2VxcHhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTkyOTQyNywiZXhwIjoyMDk1NTA1NDI3fQ.IIIIpJ7yXhuxp6i1N183ldsqRIHfltsQIPZA27sRMo4'
)

async function run() {
  const { data, error } = await supabase.from('vpn_servers').insert({
    name: 'Финляндия (FI)',
    country_code: 'FI',
    ip_address: '185.142.99.185',
    ping_ms: 24,
    load_percentage: 12,
    status: 'online'
  })
  
  if (error) {
    console.error('Error inserting:', error)
  } else {
    console.log('Inserted successfully:', data)
  }
}

run()
