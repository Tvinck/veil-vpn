import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://djodaxpjnzxzdspvvyuw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqb2RheHBqbnp4emRzcHZ2eXV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNTEzNzAsImV4cCI6MjA5MTkyNzM3MH0.WRtHjutxh7r1977wBLawGox-tnNbcx5pSX5j4N8JjSg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
