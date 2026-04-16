import urllib.request
import json

SUPABASE_URL = 'https://djodaxpjnzxzdspvvyuw.supabase.co'
SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqb2RheHBqbnp4emRzcHZ2eXV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjM1MTM3MCwiZXhwIjoyMDkxOTI3MzcwfQ.aGgDEh_4wt5smapyMQZc1YbE7vZiM-KTcJuCQgA6SXQ'

req = urllib.request.Request(f'{SUPABASE_URL}/rest/v1/veil_keys?select=*')
req.add_header('apikey', SUPABASE_SERVICE_ROLE_KEY)
req.add_header('Authorization', f'Bearer {SUPABASE_SERVICE_ROLE_KEY}')

try:
    with urllib.request.urlopen(req) as response:
        print(response.read().decode())
except Exception as e:
    print(f"Error: {e}")
