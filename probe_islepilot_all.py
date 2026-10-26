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

def test_req(method, endpoint, body=None):
    sep = "&" if "?" in endpoint else "?"
    url = f"{base_url}{endpoint}{sep}serverId={server_id}"
    data_bytes = json.dumps(body).encode('utf-8') if body else None
    req = urllib.request.Request(url, data=data_bytes, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=4) as resp:
            return resp.status, resp.read().decode('utf-8')
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8')
    except Exception as e:
        return 0, str(e)

# 1. Test Apply Skin
# Player has owned skin: cmvmr8qx51rv7ny01fx25x06e (Hồng Nam Tính)
# Player has garage dino: cmvlbfsiy0bk2rq01zv6u3r1o
print("--- 1. TEST APPLY SKIN ---")
skin_id = "cmvmr8qx51rv7ny01fx25x06e"
dino_id = "cmvlbfsiy0bk2rq01zv6u3r1o"
for ep, m, b in [
    (f"/players/{steam_id}/skins/{skin_id}/apply", "POST", {}),
    (f"/players/{steam_id}/skins/{skin_id}/apply", "POST", {"dinoId": dino_id}),
    (f"/players/{steam_id}/skins/apply", "POST", {"skinId": skin_id, "dinoId": dino_id}),
    (f"/players/{steam_id}/garage/{dino_id}/skin", "POST", {"skinId": skin_id}),
    (f"/players/{steam_id}/skin", "POST", {"skinId": skin_id}),
    (f"/players/{steam_id}/skins/{skin_id}/equip", "POST", {}),
]:
    status, text = test_req(m, ep, b)
    if status != 404:
        print(f"{m} {ep}: {status} -> {text[:150]}")

# 2. Test Quests Claim
print("\n--- 2. TEST QUESTS CLAIM ---")
# Quest id cmvlbma250fqvmp01m2oww6pq is completed! (đăng nhập hàng ngày)
quest_id = "cmvlbma250fqvmp01m2oww6pq"
for ep, m, b in [
    (f"/players/{steam_id}/quests/{quest_id}/claim", "POST", {}),
    (f"/players/{steam_id}/quests/claim", "POST", {"questId": quest_id}),
    (f"/quests/{quest_id}/claim", "POST", {"steamId": steam_id}),
]:
    status, text = test_req(m, ep, b)
    if status != 404:
        print(f"{m} {ep}: {status} -> {text[:150]}")

# 3. Test Buy Dino
print("\n--- 3. TEST BUY DINO ---")
# Dino pack in shop: cmv4q5f3l04aums01t7w1vwte (Allosaurus 0.9)
dino_pack_id = "cmv4q5f3l04aums01t7w1vwte"
for ep, m, b in [
    (f"/shop/dinos/{dino_pack_id}/buy", "POST", {"steamId": steam_id}),
    (f"/players/{steam_id}/dinos/{dino_pack_id}/buy", "POST", {}),
    (f"/players/{steam_id}/shop/dinos/{dino_pack_id}", "POST", {}),
    (f"/players/{steam_id}/dinos", "POST", {"shopDinoId": dino_pack_id}),
    (f"/players/{steam_id}/packs", "POST", {"packId": dino_pack_id}),
]:
    status, text = test_req(m, ep, b)
    if status != 404:
        print(f"{m} {ep}: {status} -> {text[:150]}")

# 4. Test Carcass
print("\n--- 4. TEST CARCASS ---")
for ep, m, b in [
    (f"/players/{steam_id}/carcass", "POST", {"type": "goat"}),
    (f"/players/{steam_id}/carcass", "GET", None),
    (f"/carcass/spawns", "GET", None),
    (f"/carcass", "GET", None),
    (f"/carcass/types", "GET", None),
    (f"/players/{steam_id}/spawn/carcass", "POST", {"type": "goat"}),
]:
    status, text = test_req(m, ep, b)
    if status != 404:
        print(f"{m} {ep}: {status} -> {text[:150]}")

# 5. Test Referral
print("\n--- 5. TEST REFERRAL ---")
for ep, m, b in [
    (f"/players/{steam_id}/referral", "GET", None),
    (f"/referral", "GET", None),
    (f"/referrals", "GET", None),
    (f"/players/{steam_id}/invites", "GET", None),
    (f"/economy/referrals", "GET", None),
]:
    status, text = test_req(m, ep, b)
    if status != 404:
        print(f"{m} {ep}: {status} -> {text[:150]}")
