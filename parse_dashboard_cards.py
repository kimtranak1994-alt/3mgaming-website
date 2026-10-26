import urllib.request
import re

req = urllib.request.Request('https://3mgaming.islepilot.eu/', headers={
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
})
try:
    with urllib.request.urlopen(req, timeout=8) as resp:
        html = resp.read().decode('utf-8')
        # Find where data-slot="card" is inside <a href=...
        cards = re.findall(r'<a[^>]+href="(/[^"]+)"[^>]*>.*?<div[^>]+data-slot="card".*?</div>\s*</div>\s*</a>', html, re.DOTALL)
        print("Total card links:", len(cards))
        for match in re.finditer(r'<a[^>]+href="(/[^"]+)"[^>]*>(.*?)</a>', html, re.DOTALL):
            href = match.group(1)
            content = match.group(2)
            if 'card' in content:
                clean = re.sub(r'<[^>]+>', ' ', content)
                text = ' '.join(clean.split())
                print(f"Card {href}: {text[:160]}")
except Exception as e:
    print(e)
