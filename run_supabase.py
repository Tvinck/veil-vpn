import urllib.request
import json
import sys

try:
    with open("/Users/macbookpro/Desktop/hub/veil-vpn/supabase_schema.sql", "r", encoding="utf-8") as f:
        sql = f.read()

    url = "https://api.supabase.com/v1/projects/djodaxpjnzxzdspvvyuw/database/query"
    headers = {
        "Authorization": "Bearer sbp_cfe5718d2e5b674bd1232a407c3de0d7917b0d5f",
        "Content-Type": "application/json"
    }
    data = json.dumps({"query": sql}).encode("utf-8")

    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    with urllib.request.urlopen(req) as res:
        print("Success:", res.read().decode("utf-8"))
except Exception as e:
    if hasattr(e, 'read'):
        print("API Error Response:", e.read().decode("utf-8"))
    else:
        print("Error:", e)
    sys.exit(1)
