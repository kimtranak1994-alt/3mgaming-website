"""SkinArt (xam / skin co san) for the 3M site: pages /xam and /xam-admin plus the /api/skinart/* endpoints.

The website cannot write into the game's Saved folder, so every action is forwarded to the SkinArt gateway that runs next to the
game (see the gateway's docs). Requests are HMAC-signed with SKINART_SECRET. The gateway owns the list of which skin each player
was granted and re-checks everything; this file only decides WHO is asking, using the site's own login:

  * player  = the `steam_user` cookie the site already sets after Steam login
  * admin   = the site's existing `is_admin_request()`

Config (environment, config.json or skinart_config.json): SKINART_GATEWAY_URL (e.g. https://host:port, no trailing slash) and SKINART_SECRET (32+ chars).
Without them the pages say "not configured" and nothing is sent anywhere.
"""
import hashlib
import hmac
import json
import os
import re
import secrets
import time
import urllib.error
import urllib.parse
import urllib.request

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PAGES = {"/xam": "xam.html", "/xam-admin": "xam_admin.html"}
STEAM = re.compile(r"7656119[0-9]{10}\Z")
MAX_BODY = 20000
GATEWAY_TIMEOUT_S = 8
# preview picture of each skin (public/cdn/skins) and which species have a 3D model on this site
SKIN_IMG = {"yakuza": "rex_yakuza", "vipjjk0001": "rex_jujutsu_kaisen", "viptek0001": "rex_huyet_mach_tek", "vipsaku001": "trice_anh_dao",
            "vipsaku002": "rex_anh_dao", "vipcyber01": "rex_cyber", "vipdora001": "rex_doraemon", "viprobot01": "rex_robot",
            "viprobot03": "rex_robot_v3", "vipyakuza1": "rex_yakuza", "vipindoma1": "indo_titan_magma", "vipindoma2": "indo_sat_thu_titan",
            "vipindoma3": "indorex_emerald_jade", "vipindoma4": "indorex_gold_hex", "vipindoma5": "indorex_4k_cyber",
            "vipindoma6": "indorex_tiger_jungle", "vipindoma7": "indorex_ngu_sac", "vipquetz01": "quetz_tien_dieu",
            "vipquetz02": "quetz_khong_tuoc", "vipquetz03": "quetz_tinh_van"}
PREVIEW_SPECIES = ("Allosaurus", "Carnotaurus", "Ceratosaurus", "Deinosuchus", "Hypsilophodon", "Omniraptor", "Triceratops", "Tyrannosaurus")


def wants(path):
    p = path.split("?")[0]
    return p in PAGES or p.startswith("/api/skinart/")


def _file_config():
    """skinart_config.json next to this file (SKINART_CONFIG_FILE overrides the path; tests point it at nothing)."""
    path = os.environ.get("SKINART_CONFIG_FILE", os.path.join(BASE_DIR, "skinart_config.json"))
    try:
        with open(path, "r", encoding="utf-8") as f:
            v = json.load(f)
        return v if isinstance(v, dict) else {}
    except (OSError, ValueError):
        return {}


def _setting(config, key):
    return os.environ.get(key) or config.get(key) or _file_config().get(key) or ""


def _gateway(config, op, body):
    """Signed POST to the gateway. Returns (http_status, dict). A dead gateway is a clean 502, never an exception."""
    base, secret = _setting(config, "SKINART_GATEWAY_URL").rstrip("/"), _setting(config, "SKINART_SECRET")
    if not base or len(secret) < 32:
        return 503, {"ok": False, "error": "SkinArt chưa được cấu hình trên web."}
    path = f"/skinart/{op}"
    data = json.dumps(body, ensure_ascii=False).encode("utf-8")
    ts, nonce = str(int(time.time())), secrets.token_hex(16)
    msg = f"POST\n{path}\n{ts}\n{nonce}\n{hashlib.sha256(data).hexdigest()}".encode()
    sig = hmac.new(secret.encode(), msg, hashlib.sha256).hexdigest()
    req = urllib.request.Request(base + path, data=data, method="POST",
                                 headers={"Content-Type": "application/json", "X-SA-Time": ts, "X-SA-Nonce": nonce, "X-SA-Sig": sig})
    try:
        with urllib.request.urlopen(req, timeout=GATEWAY_TIMEOUT_S) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read())
        except ValueError:
            return 502, {"ok": False, "error": "Game server trả lời không hợp lệ."}
    except (urllib.error.URLError, OSError, ValueError):
        return 502, {"ok": False, "error": "Không kết nối được game server. Thử lại sau."}


def _who(handler):
    """(steam_id or None, display name) from the cookie the site's Steam login already sets."""
    m = re.search(r"steam_user=([^;:]+)(?::([^;]*))?", handler.headers.get("Cookie", ""))
    if not m or not STEAM.fullmatch(m.group(1)):
        return None, ""
    return m.group(1), urllib.parse.unquote(m.group(2) or "") or f"Player_{m.group(1)[-4:]}"


def _json_body(handler):
    n = int(handler.headers.get("Content-Length") or 0)
    if n > MAX_BODY or "application/json" not in (handler.headers.get("Content-Type") or ""):
        raise ValueError("bad request")
    body = json.loads(handler.rfile.read(n) or b"{}")
    if not isinstance(body, dict):
        raise ValueError("bad request")
    return body


def _page(handler, name):
    with open(os.path.join(BASE_DIR, "public", name), "rb") as f:
        data = f.read()
    handler.send_response(200)
    handler.send_header("Content-Type", "text/html; charset=utf-8")
    handler.send_header("Content-Length", str(len(data)))
    handler.end_headers()
    handler.wfile.write(data)


def _catalog(config, cache={}):   # the mutable default is the cache on purpose
    """Skin names/species from the gateway, cached 5 minutes, with this site's picture added."""
    hit = cache.get("v")
    if hit and time.time() - hit[0] < 300:
        return hit[1]
    status, out = _gateway(config, "catalog", {})
    if status != 200:
        return None
    out["baked"] = [dict(k, img=f"/cdn/skins/{SKIN_IMG[k['kind']]}.webp") for k in out["baked"] if k["kind"] in SKIN_IMG]
    cache["v"] = (time.time(), out)
    return out


def handle(handler, config):
    """Called from server.py for every path wants() accepts."""
    path = handler.path.split("?")[0]
    method = handler.command
    if method == "GET" and path in PAGES:
        return _page(handler, PAGES[path])
    sid, name = _who(handler)
    is_admin = bool(handler.is_admin_request()[0])
    reply = handler.send_json_response
    if method == "POST" and (handler.headers.get("Sec-Fetch-Site") or "same-origin") not in ("same-origin", "same-site", "none"):
        return reply({"ok": False, "error": "forbidden"}, 403)             # a page on another site may not drive this API
    try:
        if method == "GET" and path == "/api/skinart/state":
            cat = _catalog(config)
            out = {"ok": True, "configured": bool(_setting(config, "SKINART_GATEWAY_URL") and len(_setting(config, "SKINART_SECRET")) >= 32),
                   "logged_in": bool(sid), "name": name, "steam_id": sid, "is_admin": is_admin, "demo": False, "owned": [], "allowed": False,
                   "game_online": False, "preview_species": list(PREVIEW_SPECIES), "baked": [], "species": [], "designs": {}, "fonts": []}
            if cat:
                out.update({k: cat[k] for k in ("baked", "species", "designs", "fonts")})
            if sid and cat:
                status, st = _gateway(config, "state", {"account": sid, "admin": is_admin})
                if status == 200:
                    out.update({k: st[k] for k in ("game_online", "allowed", "owned")})
            return reply(out)
        if method == "GET" and path == "/api/skinart/result":
            rid = urllib.parse.parse_qs(urllib.parse.urlparse(handler.path).query).get("rid", [""])[0]
            if not sid:
                return reply({"ok": False, "error": "Cần đăng nhập Steam."}, 401)
            status, out = _gateway(config, "result", {"account": sid, "rid": rid})
            return reply(out, status)
        if path.startswith("/api/skinart/admin/"):
            if not is_admin:
                return reply({"ok": False, "error": "Chỉ admin mới dùng được trang này."}, 403)
            op = path.rsplit("/", 1)[-1]
            if method == "GET" and op == "grants":
                status, out = _gateway(config, "admin_list", {})
                cat = _catalog(config)
                if status == 200:
                    out["baked"] = cat["baked"] if cat else []
                return reply(out, status)
            if method == "POST" and op in ("grant", "revoke"):
                body = _json_body(handler)
                status, out = _gateway(config, "admin_" + op, {"account": str(body.get("account", "")).strip(), "kinds": body.get("kinds"),
                                                                 "note": body.get("note", ""), "by": sid or "site-admin"})
                return reply(out, status)
        if method == "POST" and path in ("/api/skinart/skin", "/api/skinart/apply", "/api/skinart/remove"):
            if not sid:
                return reply({"ok": False, "error": "Cần đăng nhập Steam."}, 401)
            body = _json_body(handler)
            op = path.rsplit("/", 1)[-1]
            req = {"account": sid, "admin": is_admin}
            if op == "skin":
                req.update(kind=body.get("kind"), species=body.get("species"))
            elif op == "apply":
                req["design"] = body
            status, out = _gateway(config, op, req)
            return reply(out, status)
        return reply({"ok": False, "error": "not found"}, 404)
    except (ValueError, KeyError, TypeError):
        return reply({"ok": False, "error": "yêu cầu không hợp lệ"}, 400)
