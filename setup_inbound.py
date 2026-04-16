import urllib.request
import urllib.parse
import json

URL = 'http://95.140.154.47:2053'
USERNAME = 'admin'
PASSWORD = 'veil_admin_pass'

def req(path, method='GET', data=None, cookie=None):
    if data and isinstance(data, dict):
        data = urllib.parse.urlencode(data).encode()
    request = urllib.request.Request(f'{URL}{path}', data=data, method=method)
    if cookie:
        request.add_header('Cookie', cookie)
    request.add_header('Accept', 'application/json')
    try:
        with urllib.request.urlopen(request) as response:
            return response, response.read().decode()
    except Exception as e:
        print(f"Error requesting {path}: {e}")
        return None, None

_, login_res = req('/login', 'POST', {'username': USERNAME, 'password': PASSWORD})
cookie = _.headers.get('Set-Cookie')
print("Login:", cookie is not None)

import uuid
admin_uuid = str(uuid.uuid4())

import secrets
short_id = secrets.token_hex(8)

private_key = "2Nl98CMJyfFGzqbxPBDDOsENhdqHAST3KThImatB_ns"
public_key = "GQKrWnAmhKsH52QUknCF8HZwfEc53-dYuxcMn0egPmY"

inbound_api_data = {
    'up': 0, 'down': 0, 'total': 0,
    'remark': 'Veil-VLESS-Reality',
    'enable': True,
    'expiryTime': 0,
    'listen': '',
    'port': 443,
    'protocol': 'vless',
    'settings': json.dumps({
        'clients': [{
            'id': admin_uuid,
            'flow': 'xtls-rprx-vision',
            'email': 'admin-master',
            'limitIp': 0,
            'totalGB': 0,
            'expiryTime': 0,
            'enable': True,
            'tgId': '',
            'subId': secrets.token_hex(8)
        }],
        'decryption': 'none',
        'fallbacks': []
    }),
    'streamSettings': json.dumps({
        'network': 'tcp',
        'security': 'reality',
        'realitySettings': {
            'show': False,
            'dest': 'yahoo.com:443',
            'xver': 0,
            'serverNames': ['yahoo.com', 'www.yahoo.com'],
            'privateKey': private_key,
            'minClientVer': '',
            'maxClientVer': '',
            'maxTimeDiff': 0,
            'shortIds': [short_id],
            'settings': {
                'publicKey': public_key,
                'fingerprint': 'chrome',
                'serverName': 'yahoo.com',
                'spiderX': '/'
            }
        },
        'tcpSettings': {
            'acceptProxyProtocol': False,
            'header': {'type': 'none'}
        }
    }),
    'sniffing': json.dumps({
        'enabled': True,
        'destOverride': ['http', 'tls', 'quic'],
        'routeOnly': False
    })
}

print("Adding Inbound...")
_, add_res = req('/panel/api/inbounds/add', 'POST', inbound_api_data, cookie)
if add_res:
    res_obj = json.loads(add_res)
    print("Add result:", res_obj)
    if res_obj.get("success"):
        print("Successfully created inbound!")
    else:
        print("API returned false:", res_obj)
