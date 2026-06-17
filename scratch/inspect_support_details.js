import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fhwrdhebhgywhvoeqpxj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZod3JkaGViaGd5d2h2b2VxcHhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTkyOTQyNywiZXhwIjoyMDk1NTA1NDI3fQ.IIIIpJ7yXhuxp6i1N183ldsqRIHfltsQIPZA27sRMo4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Try querying users and project_members
  const testEmail = 'tester@example.com';
  
  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('*')
    .limit(1)
    .single();
    
  if (userErr) {
    console.error('Error fetching user:', userErr.message);
  } else {
    console.log('Fetched user:', user);
    
    // Now fetch project members for this user
    const { data: members, error: memErr } = await supabase
      .from('project_members')
      .select('role, projects(name, slug)')
      .eq('user_id', user.id);
      
    if (memErr) {
      console.error('Error fetching members:', memErr.message);
    } else {
      console.log('Project memberships:', members);
    }
  }
}

run();
