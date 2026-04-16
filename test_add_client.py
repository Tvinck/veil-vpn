import urllib.request
import urllib.parse
import json

base_url = "http://95.140.154.47:2053"
login_data = urllib.parse.urlencode({'username': 'admin', 'password': 'veil_admin_pass'}).encode()

# Login
req = urllib.request.Request(f'{base_url}/login', data=login_data)
res = urllib.request.urlopen(req)
cookie = res.headers.get('Set-Cookie')
print("Session cookie:", cookie)

# Call API 
import uuid
client_uuid = str(uuid.uuid4())
client_data = {
    "clients": [{
        "id": client_uuid,
        "flow": "xtls-rprx-vision",
        "email": "test-email-2",
        "limitIp": 2,
        "totalGB": 0,
        "expiryTime": 0,
        "enable": True,
        "tgId": "",
        "subId": "abcdef"
    }]
}

post_data = json.dumps({
    "id": 1,
    "settings": json.dumps(client_data)
}).encode()

req2 = urllib.request.Request(f'{base_url}/panel/api/inbounds/addClient', data=post_data)
req2.add_header('Cookie', cookie)
req2.add_header('Content-Type', 'application/json')
res2 = urllib.request.urlopen(req2)
print("Add result:", res2.read().decode())

# Print list
req3 = urllib.request.Request(f'{base_url}/panel/api/inbounds/list')
req3.add_header('Cookie', cookie)
res3 = urllib.request.urlopen(req3)
print("List result:", res3.read().decode()[:500])
