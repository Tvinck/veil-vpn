import urllib.request
import urllib.parse
import json

URL = 'http://95.140.154.47:2053'
USERNAME = 'admin'
PASSWORD = 'veil_admin_pass'

# Login
data = urllib.parse.urlencode({'username': USERNAME, 'password': PASSWORD}).encode()
req = urllib.request.Request(f'{URL}/login', data=data)
try:
    with urllib.request.urlopen(req) as response:
        cookie = response.headers.get('Set-Cookie')
        print(f"Login OK. Cookie: {cookie}")
        
        # Get inbounds
        req_inbounds = urllib.request.Request(f'{URL}/panel/api/inbounds/list')
        if cookie:
            req_inbounds.add_header('Cookie', cookie)
            
        with urllib.request.urlopen(req_inbounds) as r_inbounds:
            inbounds = json.loads(r_inbounds.read().decode())
            print("Inbounds:", json.dumps(inbounds, indent=2))
except Exception as e:
    print(f"Error: {e}")
