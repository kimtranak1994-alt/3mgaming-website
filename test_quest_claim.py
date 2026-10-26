import urllib.request
import json

server_id = "cmv3zzfix02g3pj01yay0hw4g"
steam_id = "76561199259679997"
api_key = "ipa_77e4d19d6459793afa72b8ae3c060d0e0ba766d27c2b8e21"
base_url = "https://islepilot.eu/api/v1"
headers = {
    'Authorization': f'Bearer {api_key}',
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0'
}

quest_id = "cmvlbma250fqvmp01m2oww6pq" # đăng nhập hàng ngày (completedAt is set, claimedAt is null!)
for ep, m, b in [
    (f"/players/{steam_id}/quests/{quest_id}/claim", "POST", {}),
    (f"/players/{steam_id}/quests/{quest_id}", "POST", {}),
    (f"/players/{steam_id}/quests/claim", "POST", {"questId": quest_id}),
    (f"/players/{steam_id}/quests", "POST", {"questId": quest_id, "action": "claim"}),
    (f"/players/{steam_id}/claim", "POST", {"questId": quest_id}),
    (f"/players/{steam_id}/claim/quest", "POST", {"questId": quest_id}),
    (f"/quests/{quest_id}/claim", "POST", {"steamId": steam_id}),
    (f"/quests/claim", "POST", {"steamId": steam_id, "questId": quest_id}),
]:
    sep = "&" if "?" in ep else "?"
    url = f"{base_url}{ep}{sep}serverId={server_id}"
    req = urllib.request.Request(url, data=json.dumps(b).encode('utf-8'), headers=headers, method=m)
    try:
        with urllib.request.urlopen(req, timeout=3) as resp:
            print(f"SUCCESS {ep}: {resp.status} -> {resp.read().decode('utf-8')}")
    except urllib.error.HTTPError as e:
        if e.code != 404:
            print(f"HTTP {e.code} {ep} -> {e.read().decode('utf-8')}")
    except Exception as e:
        pass
