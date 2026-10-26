import urllib.request
import re

req = urllib.request.Request('https://3mgaming.islepilot.eu/', headers={
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
})
try:
    with urllib.request.urlopen(req, timeout=8) as resp:
        html = resp.read().decode('utf-8')
        # Find all cards linking to these routes
        for route in ['/skinshop', '/skins', '/skin', '/referral', '/teleport', '/quests', '/packs', '/carcass', '/claim']:
            idx = html.find(f'href="{route}"')
            if idx != -1:
                chunk = html[idx:idx+800]
                # clean tags
                clean = re.sub(r'<[^>]+>', ' | ', chunk)
                print(f"=== {route} ===")
                print(' '.join(clean.split())[:300])
except Exception as e:
    print(e)
