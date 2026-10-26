import urllib.request
import re

req = urllib.request.Request('https://3mgaming.islepilot.eu/', headers={
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
})
try:
    with urllib.request.urlopen(req, timeout=8) as resp:
        html = resp.read().decode('utf-8')
        for word in ['skin', 'referral', 'teleport', 'quest', 'carcass', 'pack', 'claim']:
            matches = [m.start() for m in re.finditer(f'/{word}', html, re.I)]
            print(f"Match /{word}: {len(matches)}")
            for idx in matches[:3]:
                print("   ", html[max(0, idx-40):min(len(html), idx+80)])
except Exception as e:
    print(e)
