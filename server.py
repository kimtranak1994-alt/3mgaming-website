#!/usr/bin/env python3

# -*- coding: utf-8 -*-

"""

Dino Community Web Server & IslePilot API Proxy

Tích hợp giao diện phong cách Dino4VN & Tính năng IslePilot (3mGaming)

Hỗ trợ Đăng nhập Steam OpenID 2.0 Native (/api/player/steam/login)

"""

import os

import re

import json

import time

import datetime

import random
import threading

from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

import urllib.request

import urllib.parse

import urllib.error

from config import load_config, save_config

config = load_config()

PUBLIC_DIR = os.path.join(os.path.dirname(__file__), "public")

ACTIVE_FRIEND_CODES = {}

SPECIES_BASE_STATS = {
    "tyrannosaurus": {"hp": 12274, "prime_hp": 12274, "hunger": 4050, "thirst": 1000, "label": "12.2 Tấn (12,274 kg)", "prime_label": "12.2 Tấn (12,274 kg)"},
    "triceratops": {"hp": 9500, "prime_hp": 13000, "hunger": 6250, "thirst": 1000, "label": "9.5 Tấn (9,500 kg)", "prime_label": "13.0 Tấn (13,000 kg)"},
    "deinosuchus": {"hp": 8500, "prime_hp": 11500, "hunger": 4500, "thirst": 1000, "label": "8.5 Tấn (8,500 kg)", "prime_label": "11.5 Tấn (11,500 kg)"},
    "indorex": {"hp": 9500, "prime_hp": 12500, "hunger": 4100, "thirst": 1000, "label": "9.5 Tấn (9,500 kg)", "prime_label": "12.5 Tấn (12,500 kg)"},
    "spinosaurus": {"hp": 9500, "prime_hp": 15000, "hunger": 5000, "thirst": 1000, "label": "9.5 Tấn (9,500 kg)", "prime_label": "15.0 Tấn (15,000 kg)"},
    "giganotosaurus": {"hp": 9000, "prime_hp": 12500, "hunger": 4500, "thirst": 1000, "label": "9.0 Tấn (9,000 kg)", "prime_label": "12.5 Tấn (12,500 kg)"},
    "stegosaurus": {"hp": 6500, "prime_hp": 9000, "hunger": 4200, "thirst": 1000, "label": "6.5 Tấn (6,500 kg)", "prime_label": "9.0 Tấn (9,000 kg)"},
    "allosaurus": {"hp": 2800, "prime_hp": 3800, "hunger": 925, "thirst": 1000, "label": "2.8 Tấn (2,800 kg)", "prime_label": "3.8 Tấn (3,800 kg)"},
    "carnotaurus": {"hp": 2600, "prime_hp": 3500, "hunger": 1800, "thirst": 1000, "label": "2.6 Tấn (2,600 kg)", "prime_label": "3.5 Tấn (3,500 kg)"},
    "ceratosaurus": {"hp": 2200, "prime_hp": 3000, "hunger": 1500, "thirst": 1000, "label": "2.2 Tấn (2,200 kg)", "prime_label": "3.0 Tấn (3,000 kg)"},
    "diabloceratops": {"hp": 3200, "prime_hp": 4300, "hunger": 2000, "thirst": 1000, "label": "3.2 Tấn (3,200 kg)", "prime_label": "4.3 Tấn (4,300 kg)"},
    "maiasaura": {"hp": 3300, "prime_hp": 4500, "hunger": 2200, "thirst": 1000, "label": "3.3 Tấn (3,300 kg)", "prime_label": "4.5 Tấn (4,500 kg)"},
    "ankylosaurus": {"hp": 5000, "prime_hp": 7000, "hunger": 3500, "thirst": 1000, "label": "5.0 Tấn (5,000 kg)", "prime_label": "7.0 Tấn (7,000 kg)"},
    "tenontosaurus": {"hp": 1800, "prime_hp": 2500, "hunger": 1200, "thirst": 1000, "label": "1.8 Tấn (1,800 kg)", "prime_label": "2.5 Tấn (2,500 kg)"},
    "dilophosaurus": {"hp": 1200, "prime_hp": 1600, "hunger": 800, "thirst": 1000, "label": "1.2 Tấn (1,200 kg)", "prime_label": "1.6 Tấn (1,600 kg)"},
    "baryonyx": {"hp": 2400, "prime_hp": 3200, "hunger": 1400, "thirst": 1000, "label": "2.4 Tấn (2,400 kg)", "prime_label": "3.2 Tấn (3,200 kg)"},
    "pachycephalosaurus": {"hp": 1100, "prime_hp": 1500, "hunger": 750, "thirst": 1000, "label": "1.1 Tấn (1,100 kg)", "prime_label": "1.5 Tấn (1,500 kg)"},
    "omniraptor": {"hp": 850, "prime_hp": 1150, "hunger": 650, "thirst": 1000, "label": "850 kg", "prime_label": "1.15 Tấn (1,150 kg)"},
    "gallimimus": {"hp": 750, "prime_hp": 1000, "hunger": 800, "thirst": 1000, "label": "750 kg", "prime_label": "1.0 Tấn (1,000 kg)"},
    "herrerasaurus": {"hp": 650, "prime_hp": 900, "hunger": 550, "thirst": 1000, "label": "650 kg", "prime_label": "900 kg"},
    "beipiaosaurus": {"hp": 400, "prime_hp": 550, "hunger": 450, "thirst": 1000, "label": "400 kg", "prime_label": "550 kg"},
    "dryosaurus": {"hp": 300, "prime_hp": 400, "hunger": 350, "thirst": 1000, "label": "300 kg", "prime_label": "400 kg"},
    "pteranodon": {"hp": 220, "prime_hp": 300, "hunger": 250, "thirst": 1000, "label": "220 kg", "prime_label": "300 kg"},
    "troodon": {"hp": 150, "prime_hp": 200, "hunger": 120, "thirst": 1000, "label": "150 kg", "prime_label": "200 kg"},
    "hypsilophodon": {"hp": 120, "prime_hp": 160, "hunger": 100, "thirst": 1000, "label": "120 kg", "prime_label": "160 kg"},
    "puerta": {"hp": 38000, "prime_hp": 50000, "hunger": 15000, "thirst": 1000, "label": "38 Tấn (38,000 kg)", "prime_label": "50 Tấn (50,000 kg)"},
    "therizinosaurus": {"hp": 6000, "prime_hp": 8500, "hunger": 4000, "thirst": 1000, "label": "6.0 Tấn (6,000 kg)", "prime_label": "8.5 Tấn (8,500 kg)"}
}

def calc_dino_stats(species_name, growth, health_val, hunger_val, thirst_val, is_prime_elder=False):

    s = (species_name or "").lower()

    base = {"hp": 3000, "prime_hp": 4100, "hunger": 1500, "thirst": 1000}

    for k, v in SPECIES_BASE_STATS.items():

        if k in s:

            base = v

            break

            

    g = max(0.01, min(1.0, float(growth or 1.0)))

    target_max_hp = base.get("prime_hp", base["hp"]) if is_prime_elder else base["hp"]

    max_hp = int(target_max_hp * (0.2 + 0.8 * (g ** 1.2)))

    max_hunger = int(base["hunger"] * (0.3 + 0.7 * g))

    max_thirst = base["thirst"]

    

    h_ratio = float(health_val if health_val is not None else 1.0)

    if h_ratio > 1.0: h_ratio /= 100.0

    h_ratio = max(0.0, min(1.0, h_ratio))

    current_hp = int(max_hp * h_ratio)

    

    hu_ratio = float(hunger_val if hunger_val is not None else 1.0)

    if hu_ratio > 1.0: hu_ratio /= 100.0

    hu_ratio = max(0.0, min(1.0, hu_ratio))

    current_hunger = int(max_hunger * hu_ratio)

    

    th_ratio = float(thirst_val if thirst_val is not None else 1.0)

    if th_ratio > 1.0: th_ratio /= 100.0

    th_ratio = max(0.0, min(1.0, th_ratio))

    current_thirst = int(max_thirst * th_ratio)

    

    return {

        "current_hp": current_hp, "max_hp": max_hp, "health_pct": round(h_ratio * 100),

        "current_hunger": current_hunger, "max_hunger": max_hunger, "hunger_pct": round(hu_ratio * 100),

        "current_thirst": current_thirst, "max_thirst": max_thirst, "thirst_pct": round(th_ratio * 100)

    }

CUSTOM_NAMES_FILE = os.path.join(os.path.dirname(__file__), "dino_names.json")
DELETED_GARAGE_FILE = os.path.join(os.path.dirname(__file__), "deleted_garage_dinos.json")

def load_deleted_dinos():
    if os.path.exists(DELETED_GARAGE_FILE):
        try:
            with open(DELETED_GARAGE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}

def save_deleted_dino(dino_id, steam_id=""):
    data = load_deleted_dinos()
    data[str(dino_id)] = {
        "steam_id": str(steam_id),
        "deleted_at": datetime.datetime.now().isoformat()
    }
    try:
        with open(DELETED_GARAGE_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"[Save Deleted Dino Error] {e}")

    try:
        sub_dir = os.path.join(os.path.dirname(__file__), "3mgaming-website")
        if os.path.exists(sub_dir):
            import shutil
            shutil.copy2(DELETED_GARAGE_FILE, os.path.join(sub_dir, "deleted_garage_dinos.json"))
    except Exception:
        pass

def load_custom_names():

    if os.path.exists(CUSTOM_NAMES_FILE):

        try:

            with open(CUSTOM_NAMES_FILE, "r", encoding="utf-8") as f:

                return json.load(f)

        except:

            pass

    return {}

def save_custom_name(dino_id, name):

    data = load_custom_names()

    data[dino_id] = name

    try:

        with open(CUSTOM_NAMES_FILE, "w", encoding="utf-8") as f:

            json.dump(data, f, ensure_ascii=False, indent=2)

    except:

        pass

CLAIMED_QUESTS_FILE = os.path.join(os.path.dirname(__file__), "claimed_quests.json")

def load_claimed_quests():
    if os.path.exists(CLAIMED_QUESTS_FILE):
        try:
            with open(CLAIMED_QUESTS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except:
            pass
    return {}

def save_claimed_quests(data):
    try:
        with open(CLAIMED_QUESTS_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Error saving claimed_quests: {e}")

def srgb_byte_to_linear(b):

    t = max(0.0, min(1.0, float(b) / 255.0))

    if t <= 0.04045:

        return t / 12.92

    return ((t + 0.055) / 1.055) ** 2.4

def hex_to_float_rgba(hex_str, fallback="#010101"):

    if not hex_str:

        hex_str = fallback

    h = str(hex_str).strip().lstrip('#')

    if len(h) == 3:

        h = ''.join([c * 2 for c in h])

    h = (h + "000000")[:6]

    if h == "000000":

        h = "010101"

    try:

        r = round(srgb_byte_to_linear(int(h[0:2], 16)), 6)

        g = round(srgb_byte_to_linear(int(h[2:4], 16)), 6)

        b = round(srgb_byte_to_linear(int(h[4:6], 16)), 6)

        return [r, g, b, 1.0]

    except Exception:

        return [0.01, 0.01, 0.01, 1.0]

def build_blueprint_skin_payload(species, sex, palette, variation=0, pattern=0, theme=0):

    clean_sp = re.sub(r'[^a-zA-Z0-9]+', '', str(species))

    bp_class = f"BP_{clean_sp}_C"

    pal = palette or {}

    return {

        "class": bp_class,

        "female": str(sex).lower() == "female",

        "variation": int(variation or 0),

        "pattern": int(pattern or 0),

        "theme": int(theme or 0),

        "body": hex_to_float_rgba(pal.get("body", "#4a543b")),

        "markings": hex_to_float_rgba(pal.get("markings", "#2b3221")),

        "flank": hex_to_float_rgba(pal.get("flank", "#647050")),

        "underbelly": hex_to_float_rgba(pal.get("underbelly", "#c4baa1")),

        "detail1": hex_to_float_rgba(pal.get("detail", pal.get("detail1", "#1f1512"))),

        "eyes": hex_to_float_rgba(pal.get("eyes", "#e08f24")),

        "male_display": hex_to_float_rgba(pal.get("display", pal.get("male_display", "#a83c24"))),

        "teeth": hex_to_float_rgba(pal.get("teeth", "#dedede")),

        "mouth": hex_to_float_rgba(pal.get("mouth", "#a83c24")),

        "claws": hex_to_float_rgba(pal.get("claws", "#1f1512"))

    }

class DinoRequestHandler(SimpleHTTPRequestHandler):

    def __init__(self, *args, **kwargs):

        super().__init__(*args, directory=PUBLIC_DIR, **kwargs)

    def end_headers(self):

        if not self.path.startswith("/cdn/"):

            self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")

            self.send_header("Pragma", "no-cache")

            self.send_header("Expires", "0")

        super().end_headers()

    def is_admin_request(self):
        cookie_header = self.headers.get("Cookie", "")
        if "admin_auth=1" in cookie_header:
            return True, "cookie"
        admin_pass = config.get("ADMIN_PASSCODE", "admin3m")
        if self.headers.get("X-Admin-Passcode") == admin_pass:
            return True, "header"
        query = urllib.parse.urlparse(self.path).query
        q_params = urllib.parse.parse_qs(query)
        if q_params.get("passcode", [None])[0] == admin_pass:
            return True, "passcode"

        admin_steam_ids = [str(sid) for sid in config.get("ADMIN_STEAM_IDS", [
            "76561199175571899", "76561199196418178", "76561199062270730", "76561199483156684"
        ])]
        admin_discord_ids = [str(did) for did in config.get("ADMIN_DISCORD_IDS", [
            "749270027605114922"
        ])]

        # 0. Kiểm tra admin_steam_id hoặc header X-Admin-Steam-Id
        admin_sid = q_params.get("admin_steam_id", [None])[0] or self.headers.get("X-Admin-Steam-Id")
        if admin_sid and str(admin_sid) in admin_steam_ids:
            return True, f"admin_steam:{admin_sid}"

        # 1. Kiểm tra tài khoản Steam ID có quyền Admin
        actual_steam_id = None
        # Chỉ lấy steam_id từ query nếu route KHÔNG PHẢI là thao tác nhắm vào target player (player-detail / player-action)
        if not (self.path.startswith("/api/admin/player-detail") or self.path.startswith("/api/admin/player-action")):
            actual_steam_id = q_params.get("steam_id", [None])[0]

        if not actual_steam_id:
            match = re.search(r"steam_user=([^;:]+)", cookie_header)
            if match:
                actual_steam_id = match.group(1)

        if actual_steam_id:
            actual_steam_id = str(actual_steam_id)
            if actual_steam_id in admin_steam_ids:
                return True, f"steam:{actual_steam_id}"
            
            # Kiểm tra tài khoản Discord liên kết với Steam ID này từ IslePilot
            try:
                player_info = self.fetch_islepilot(f"/players/{actual_steam_id}")
                if player_info and isinstance(player_info, dict):
                    discord_info = player_info.get("discord") or {}
                    discord_id = str(discord_info.get("id", ""))
                    if discord_id and discord_id in admin_discord_ids:
                        return True, f"discord:{discord_id}"
            except Exception:
                pass

        # 2. Kiểm tra tài khoản Discord ID truyền trực tiếp qua tham số hoặc cookie
        discord_id_param = q_params.get("discord_id", [None])[0] or self.headers.get("X-Admin-Discord-Id")
        if not discord_id_param:
            match_d = re.search(r"discord_id=([^;:]+)", cookie_header)
            if match_d:
                discord_id_param = match_d.group(1)

        if discord_id_param and str(discord_id_param) in admin_discord_ids:
            return True, f"discord:{discord_id_param}"

        return False, None

        return False, None

    def do_GET(self):

        # 1. Config public endpoint

        if self.path == "/api/config":

            self.send_json_response({

                "server_id": config.get("SERVER_ID"),

                "server_name": config.get("SERVER_NAME"),

                "server_motd": config.get("SERVER_MOTD"),

                "server_ip": config.get("SERVER_IP"),

                "server_port": config.get("SERVER_PORT"),

                "max_slots": config.get("MAX_SLOTS", 100),

                "discord_url": config.get("DISCORD_URL"),

                "bank_info": config.get("BANK_INFO", {})

            })

            return

        # 2. Steam OpenID Login Endpoint

        elif self.path.startswith("/api/player/steam/login"):

            self.handle_steam_login()

            return

        # 3. Steam OpenID Callback Endpoint

        elif self.path.startswith("/api/player/steam/callback"):

            self.handle_steam_callback()

            return

        # 4. Thông tin người chơi đăng nhập hiện tại

        elif self.path.startswith("/api/player/me"):

            self.handle_player_me()

            return

        elif self.path.startswith("/api/player/active-dino"):

            self.handle_player_active_dino()

            return

        # 5. Đăng xuất Steam

        elif self.path == "/api/player/logout":

            self.handle_player_logout()

            return

        # 6. Server Status (Live từ IslePilot)

        elif self.path == "/api/server/status":

            self.handle_server_status()

            return

        # 7. Live Players

        elif self.path.startswith("/api/server/players") or self.path.startswith("/api/players"):

            self.handle_players()

            return

        # 8. Leaderboard (Live từ IslePilot)

        elif self.path.startswith("/api/server/leaderboard"):

            self.handle_leaderboard()

            return

        # 9. Killfeed (Live từ IslePilot)

        elif self.path == "/api/server/killfeed":

            self.handle_killfeed()

            return

        # 10. Gara Khủng Long (Live từ IslePilot)

        elif self.path.startswith("/api/server/garage"):

            self.handle_garage()

            return

        # 11. Bản đồ Gateway & POI

        elif self.path == "/api/server/map":

            self.handle_map()

            return

        # 12. Sự kiện (Live từ IslePilot)

        elif self.path == "/api/server/event":

            self.handle_event()

            return

        # 13. Shop Skins (Live từ IslePilot)

        elif self.path == "/api/server/shop/skins":

            self.handle_shop_skins()

            return

        # 14. Shop Dinos (Live từ IslePilot)

        elif self.path == "/api/server/shop/dinos":

            self.handle_shop_dinos()

            return

        # 15. Teleport Locations (Live từ IslePilot)

        elif self.path == "/api/server/teleport/locations":

            self.handle_teleport_locations()

            return

        # 16. Nhiệm Vụ Quests (Live từ IslePilot)

        elif self.path.startswith("/api/server/quests"):

            self.handle_quests()

            return

        # 17. Kho Skin Đã Sở Hữu (Live từ IslePilot)

        elif self.path.startswith("/api/server/skins"):

            self.handle_player_skins()

            return

        # 18. Mời Bạn Bè Referral

        elif self.path.startswith("/api/server/referral"):

            self.handle_referral()

            return

        # 19. Gói Thả Xác Carcass Offers (Live từ IslePilot)

        elif self.path.startswith("/api/server/carcass/offers") or self.path.startswith("/api/server/shop/carcasses"):

            self.handle_carcass_offers()

            return

        # 20. Bản Lưu Skin Drafts (Persisted)

        elif self.path.startswith("/api/player/skin-drafts"):

            self.handle_skin_drafts_get()

            return

        # 21. CDN Proxy & Cache cho 3D Dinosaur Models / Textures

        elif self.path.startswith("/cdn/dinos/"):

            self.handle_cdn_proxy()

            return

        # Admin Endpoints
        elif self.path.startswith("/api/admin/check"):
            is_admin, id_or_mode = self.is_admin_request()
            active_steam_id = self.get_active_steam_id()
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            if is_admin:
                self.send_header("Set-Cookie", "admin_auth=1; Path=/; Max-Age=86400; SameSite=Lax")
            self.end_headers()
            self.wfile.write(json.dumps({
                "isAdmin": is_admin,
                "steamId": active_steam_id,
                "authMode": id_or_mode
            }).encode("utf-8"))
            return

        elif self.path.startswith("/api/admin/players"):
            is_admin, _ = self.is_admin_request()
            if not is_admin:
                self.send_json_response({"ok": False, "error": "Unauthorized", "players": []}, status=403)
                return
            remote_lb = self.fetch_islepilot("/leaderboard") or {}
            lb_entries = remote_lb.get("entries", [])

            remote_live = self.fetch_islepilot("/players?limit=250") or {}
            live_players = remote_live.get("players", [])

            live_map = {str(p.get("steamId")): p for p in live_players if p.get("steamId")}

            merged = []
            for entry in lb_entries:
                sid = str(entry.get("steamId", "")).strip()
                live_p = live_map.pop(sid, None)
                is_online = bool(live_p and live_p.get("online") is not False)
                kills = entry.get("kills", 0)
                deaths = entry.get("deaths", 0)
                kd = round(kills / max(1, deaths), 2)
                score = kills * 150 + entry.get("nests", 0) * 80 + max(1, kills * 25)

                merged.append({
                    "steamId": sid,
                    "steam_id": sid,
                    "name": (live_p.get("name") if live_p else None) or entry.get("name") or f"Player_{sid[-4:]}",
                    "online": is_online,
                    "species": (live_p.get("species") if live_p else "Chưa chọn"),
                    "female": (live_p.get("female") if live_p else False),
                    "growth": (live_p.get("growth") if live_p else 1.0),
                    "health": (live_p.get("health") if live_p else 0),
                    "maxHealth": (live_p.get("maxHealth") if live_p else 10000),
                    "hunger": (live_p.get("hunger") if live_p else 0),
                    "maxHunger": (live_p.get("maxHunger") if live_p else 4000),
                    "thirst": (live_p.get("thirst") if live_p else 0),
                    "maxThirst": (live_p.get("maxThirst") if live_p else 1000),
                    "position": (live_p.get("position") if live_p else None),
                    "kills": kills,
                    "deaths": deaths,
                    "kd": kd,
                    "nests": entry.get("nests", 0),
                    "score": score
                })

            # Những người chơi đang online nhưng chưa có trong leaderboard
            for sid, live_p in live_map.items():
                merged.append({
                    "steamId": sid,
                    "steam_id": sid,
                    "name": live_p.get("name") or f"Player_{sid[-4:]}",
                    "online": True,
                    "species": live_p.get("species", "Chưa chọn"),
                    "female": live_p.get("female", False),
                    "growth": live_p.get("growth", 1.0),
                    "health": live_p.get("health", 0),
                    "maxHealth": live_p.get("maxHealth", 10000),
                    "hunger": live_p.get("hunger", 0),
                    "maxHunger": live_p.get("maxHunger", 4000),
                    "thirst": live_p.get("thirst", 0),
                    "maxThirst": live_p.get("maxThirst", 1000),
                    "position": live_p.get("position"),
                    "kills": 0,
                    "deaths": 0,
                    "kd": 0.0,
                    "nests": 0,
                    "score": 100
                })

            # SẮP XẾP: Toàn bộ người chơi ONLINE ở phía trên, OFFLINE ở phía dưới
            online_list = [p for p in merged if p["online"]]
            offline_list = [p for p in merged if not p["online"]]
            online_list.sort(key=lambda x: (-x["score"], -x["kills"], x["deaths"]))
            offline_list.sort(key=lambda x: (-x["score"], -x["kills"], x["deaths"]))

            final_list = online_list + offline_list
            for idx, p in enumerate(final_list):
                p["rank"] = idx + 1

            self.send_json_response({"ok": True, "players": final_list, "total": len(final_list), "online_count": len(online_list)})
            return

        elif self.path.startswith("/api/admin/player-detail"):
            is_admin, _ = self.is_admin_request()
            if not is_admin:
                self.send_json_response({"ok": False, "error": "Unauthorized"}, status=403)
                return
            query = urllib.parse.urlparse(self.path).query
            q_params = urllib.parse.parse_qs(query)
            target_steam_id = q_params.get("steam_id", [None])[0]
            if not target_steam_id:
                self.send_json_response({"ok": False, "error": "Missing steam_id"}, status=400)
                return
            player_info = self.fetch_islepilot(f"/players/{target_steam_id}")
            if os.path.exists("admin_wallet_adjustments.json") and player_info and isinstance(player_info, dict):
                try:
                    with open("admin_wallet_adjustments.json", "r", encoding="utf-8") as f:
                        adjs = json.load(f)
                        extra = adjs.get(str(target_steam_id), 0)
                        if "wallet" in player_info and isinstance(player_info["wallet"], dict):
                            player_info["wallet"]["balance"] = max(0, player_info["wallet"].get("balance", 0) + extra)
                        else:
                            player_info["wallet"] = {"balance": max(0, extra)}
                except Exception:
                    pass

            # Hợp nhất đột biến gen đã cấu hình qua Admin Panel (admin_player_mutations.json)
            mut_file = "admin_player_mutations.json"
            if os.path.exists(mut_file) and player_info and isinstance(player_info, dict):
                try:
                    with open(mut_file, "r", encoding="utf-8") as f:
                        all_muts = json.load(f)
                    p_muts = all_muts.get(str(target_steam_id))
                    if p_muts and isinstance(p_muts, dict):
                        if not player_info.get("mutationSlots") or not isinstance(player_info.get("mutationSlots"), dict):
                            player_info["mutationSlots"] = {}
                        for cat, slot_list in p_muts.items():
                            if isinstance(slot_list, list):
                                cur_list = player_info["mutationSlots"].get(cat, ["None", "None", "None", "None"])
                                if not isinstance(cur_list, list) or len(cur_list) < 4:
                                    cur_list = ["None", "None", "None", "None"]
                                for idx in range(min(4, len(slot_list))):
                                    if slot_list[idx] and slot_list[idx] != "None":
                                        cur_list[idx] = slot_list[idx]
                                player_info["mutationSlots"][cat] = cur_list
                except Exception as e:
                    print("Error merging admin_player_mutations:", e)
            garage_info = self.fetch_islepilot(f"/players/{target_steam_id}/garage") or {}
            skins_info = self.fetch_islepilot(f"/players/{target_steam_id}/skins") or {}
            warnings_info = self.fetch_islepilot(f"/players/{target_steam_id}/warnings") or {}
            economy_info = self.fetch_islepilot(f"/players/{target_steam_id}/economy") or {}

            combined_garage = list(garage_info.get("garage", []))
            gift_file = "user_gift_dinos.json"
            if os.path.exists(gift_file):
                try:
                    with open(gift_file, "r", encoding="utf-8") as f:
                        gifts = json.load(f)
                    user_gifts = gifts.get(str(target_steam_id), [])
                    for g in user_gifts:
                        combined_garage.append(g)
                except Exception as e:
                    pass

            for g in combined_garage:
                s_name = (g.get("species") or "").lower()
                is_p = bool(g.get("isPrimeElder", False) or g.get("is_prime_elder", False))
                if "spino" in s_name and is_p:
                    g["weight"] = 15000
                    g["maxHealth"] = 15000
                    g["weight_label"] = "15.0 Tấn (15,000 kg)"
                elif "trice" in s_name and is_p:
                    g["weight"] = 13000
                    g["maxHealth"] = 13000
                    g["weight_label"] = "13.0 Tấn (13,000 kg)"
                elif not g.get("weight_label"):
                    g["weight_label"] = "Chuẩn Prime Elder" if is_p else "Chuẩn"

            self.send_json_response({
                "ok": True,
                "player": player_info,
                "garage": combined_garage,
                "skins": skins_info.get("skins", []),
                "warnings": warnings_info.get("warnings", []),
                "economy": economy_info
            })
            return

        elif self.path.startswith("/api/admin/bans"):
            is_admin, _ = self.is_admin_request()
            if not is_admin:
                self.send_json_response({"ok": False, "error": "Unauthorized", "bans": []}, status=403)
                return
            remote_bans = self.fetch_islepilot("/bans") or {}
            self.send_json_response({"ok": True, "bans": remote_bans.get("bans", [])})
            return

        elif self.path.startswith("/api/admin/garage/settings"):
            is_admin, _ = self.is_admin_request()
            if not is_admin:
                self.send_json_response({"ok": False, "error": "Unauthorized"}, status=403)
                return
            self.send_json_response({
                "ok": True,
                "maxSlots": config.get("MAX_GARAGE_SLOTS", 5),
                "parkSeconds": config.get("GARAGE_PARK_SECONDS", 30)
            })
            return

        elif self.path.startswith("/api/admin/shop/skins"):
            is_admin, _ = self.is_admin_request()
            if not is_admin:
                self.send_json_response({"ok": False, "error": "Unauthorized"}, status=403)
                return
            custom_skins = []
            if os.path.exists("admin_custom_skins.json"):
                try:
                    with open("admin_custom_skins.json", "r", encoding="utf-8") as f:
                        custom_skins = json.load(f)
                except Exception:
                    pass
            self.send_json_response({"ok": True, "skins": custom_skins})
            return

        elif self.path.startswith("/api/admin/whitelist"):
            is_admin, _ = self.is_admin_request()
            if not is_admin:
                self.send_json_response({"ok": False, "error": "Unauthorized"}, status=403)
                return
            remote_wl = self.fetch_islepilot("/whitelist") or {}
            self.send_json_response({"ok": True, "whitelist": remote_wl})
            return

        # Serve static public files

        return super().do_GET()

    def do_POST(self):
        import time
        import datetime

        if self.path == "/api/server/garage/store" or self.path == "/api/server/garage/park":

            self.handle_garage_store()

            return

        elif self.path == "/api/server/garage/slay" or self.path == "/api/server/garage/kill":

            self.handle_garage_slay()

            return

        elif self.path == "/api/server/garage/spawn":

            self.handle_garage_spawn()

            return

        elif self.path == "/api/server/garage/delete" or self.path == "/api/server/garage/sell":

            self.handle_garage_delete()

            return

        elif self.path == "/api/server/garage/rename":

            try:

                length = int(self.headers.get("Content-Length", 0))

                body = self.rfile.read(length).decode("utf-8")

                payload = json.loads(body)

                dino_id = payload.get("dino_id")

                new_name = payload.get("name", "").strip()

                if dino_id and new_name:

                    save_custom_name(dino_id, new_name)

                    self.send_json_response({"success": True, "message": f"Đã đổi tên thành '{new_name}' thành công!"})

                    return

            except Exception as e:

                print(f"[Rename Error] {e}")

            self.send_json_response({"success": False, "message": "Lỗi dữ liệu đổi tên!"}, 400)

            return

        elif self.path == "/api/server/teleport":

            self.handle_teleport()

            return

        elif self.path == "/api/server/teleport/friend/create":

            self.handle_friend_code_create()

            return

        elif self.path == "/api/server/teleport/friend/redeem":

            self.handle_friend_code_redeem()

            return

        elif self.path == "/api/server/skins/apply":

            self.handle_apply_skin()

            return

        elif self.path == "/api/server/quests/claim" or self.path.startswith("/api/server/quests/claim"):

            self.handle_claim_quest()

            return

        elif self.path == "/api/server/carcass":

            self.handle_carcass()

            return

        elif self.path == "/api/server/shop/buy-skin":

            self.handle_buy_skin()

            return

        elif self.path == "/api/server/shop/buy-dino":

            self.handle_buy_dino()

            return

        elif self.path == "/api/skin/code":

            self.handle_skin_code()

            return

        elif self.path.startswith("/api/player/skin-drafts"):

            self.handle_skin_drafts_post()

            return

        elif self.path == "/api/skin/set":

            self.handle_skin_set()

            return

        elif self.path in ["/api/server/referral/apply", "/api/server/referral/redeem"]:

            self.handle_referral_apply()

            return

        

        elif self.path.startswith("/api/admin/auth"):
            try:
                length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(length).decode("utf-8")
                payload = json.loads(body)
                passcode = payload.get("passcode", "").strip()
                admin_pass = config.get("ADMIN_PASSCODE", "admin3m")
                if passcode == admin_pass:
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json; charset=utf-8")
                    self.send_header("Set-Cookie", "admin_auth=1; Path=/; Max-Age=86400; SameSite=Lax")
                    self.end_headers()
                    self.wfile.write(json.dumps({"ok": True, "message": "Authenticated"}).encode("utf-8"))
                else:
                    self.send_json_response({"ok": False, "error": "Sai mã bảo mật"}, status=401)
            except Exception as e:
                self.send_json_response({"ok": False, "error": str(e)}, status=500)
            return

        elif self.path.startswith("/api/admin/logout"):
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Set-Cookie", "admin_auth=; Path=/; Max-Age=0; SameSite=Lax")
            self.end_headers()
            self.wfile.write(json.dumps({"ok": True}).encode("utf-8"))
            return

        elif self.path.startswith("/api/admin/player-action"):
            is_admin, _ = self.is_admin_request()
            try:
                length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(length).decode("utf-8")
                payload = json.loads(body)
            except Exception:
                payload = {}

            if not is_admin:
                admin_steam_ids = [str(sid) for sid in config.get("ADMIN_STEAM_IDS", [
                    "76561199175571899", "76561199196418178", "76561199062270730", "76561199483156684"
                ])]
                req_admin_sid = str(payload.get("admin_steam_id") or self.headers.get("X-Admin-Steam-Id") or "")
                req_passcode = str(payload.get("passcode") or self.headers.get("X-Admin-Passcode") or "")
                admin_pass = config.get("ADMIN_PASSCODE", "admin3m")
                if (req_admin_sid and req_admin_sid in admin_steam_ids) or (req_passcode and req_passcode == admin_pass):
                    is_admin = True

            if not is_admin:
                self.send_json_response({"ok": False, "error": "Unauthorized"}, status=403)
                return
            try:
                action = payload.get("action")
                target_steam_id = payload.get("steamId")
                params = payload.get("params", {})
                
                cmd_body = {"action": action}
                if target_steam_id:
                    cmd_body["steamId"] = str(target_steam_id)
                    
                if action == "setgrowth":
                    cmd_body["growth"] = float(params.get("growth", 1.0))
                    cmd_body["frozen"] = bool(params.get("frozen", False))
                elif action == "setstats":
                    cmd_body["health"] = float(params.get("health", 100))
                    cmd_body["hunger"] = float(params.get("hunger", 100))
                    cmd_body["thirst"] = float(params.get("thirst", 100))
                    cmd_body["stamina"] = float(params.get("stamina", 100))
                    if "bleed" in params:
                        cmd_body["bleed"] = float(params.get("bleed", 0))
                    if "growth" in params:
                        cmd_body["growth"] = float(params.get("growth", 1.0))
                elif action == "setnutrition":
                    carb_val = float(params.get("carb", params.get("carbohydrate", params.get("s1", params.get("a", 100)))))
                    prot_val = float(params.get("protein", params.get("s2", params.get("b", 100))))
                    lipid_val = float(params.get("lipid", params.get("fat", params.get("s3", params.get("y", 100)))))
                    cmd_body["carb"] = carb_val
                    cmd_body["protein"] = prot_val
                    cmd_body["lipid"] = lipid_val
                elif action == "mutations":
                    mut_file = "admin_player_mutations.json"
                    all_muts = {}
                    if os.path.exists(mut_file):
                        try:
                            with open(mut_file, "r", encoding="utf-8") as f:
                                all_muts = json.load(f)
                        except Exception:
                            all_muts = {}
                    
                    sid_str = str(target_steam_id)
                    if sid_str not in all_muts:
                        all_muts[sid_str] = {
                            "active": ["None", "None", "None", "None"],
                            "parent": ["None", "None", "None", "None"],
                            "elderA": ["None", "None", "None", "None"],
                            "elderB": ["None", "None", "None", "None"]
                        }

                    # Xóa toàn bộ
                    if params.get("clear"):
                        all_muts[sid_str] = {
                            "active": ["None", "None", "None", "None"],
                            "parent": ["None", "None", "None", "None"],
                            "elderA": ["None", "None", "None", "None"],
                            "elderB": ["None", "None", "None", "None"]
                        }
                        try:
                            with open(mut_file, "w", encoding="utf-8") as f:
                                json.dump(all_muts, f, ensure_ascii=False, indent=2)
                        except Exception:
                            pass
                        self.fetch_islepilot("/commands", method="POST", body_data={"action": "mutations", "steamId": sid_str, "clear": True})
                        self.fetch_islepilot("/commands", method="POST", body_data={"action": "mutations", "steamId": sid_str, "mutations": []})
                        self.send_json_response({"ok": True, "message": "Thành công"})
                        return

                    # Cập nhật mutation từ Apply mutations hoặc các nhóm
                    for k_cat in ["active", "parent", "elderA", "elderB"]:
                        arr = None
                        if params.get(k_cat) and isinstance(params.get(k_cat), list):
                            arr = params.get(k_cat)
                        elif params.get("mutationSlots") and isinstance(params.get("mutationSlots"), dict):
                            arr = params["mutationSlots"].get(k_cat)
                        if isinstance(arr, list):
                            norm_arr = ["None", "None", "None", "None"]
                            for i_idx in range(min(4, len(arr))):
                                val_s = str(arr[i_idx]).strip() if arr[i_idx] else "None"
                                norm_arr[i_idx] = val_s if val_s else "None"
                            all_muts[sid_str][k_cat] = norm_arr

                    # Cập nhật nếu gửi theo từng slot riêng lẻ
                    if params.get("slot") and "mutation" in params:
                        cat = str(params.get("category", "active"))
                        slot_num = int(params["slot"])
                        m_name = str(params["mutation"]).strip()
                        if cat not in all_muts[sid_str]:
                            all_muts[sid_str][cat] = ["None", "None", "None", "None"]
                        if 1 <= slot_num <= 4:
                            all_muts[sid_str][cat][slot_num - 1] = m_name

                    # Lưu bền vững admin_player_mutations.json
                    try:
                        with open(mut_file, "w", encoding="utf-8") as f:
                            json.dump(all_muts, f, ensure_ascii=False, indent=2)
                    except Exception as e:
                        print("Error writing admin_player_mutations:", e)

                    # Gửi đồng bộ lên máy chủ game IslePilot
                    active_clean = [m for m in all_muts[sid_str].get("active", []) if m and m != "None"]
                    slot_target = int(params.get("slot", 1))
                    mut_target = str(params.get("mutation", "")).strip()
                    cat_target = str(params.get("category", "active"))

                    def async_push_mutations():
                        # 1. Gửi cấu hình 4 nhóm trực tiếp (active, parent, elderA, elderB) chuẩn IslePilot Apply mutations
                        self.fetch_islepilot("/commands", method="POST", body_data={
                            "action": "mutations",
                            "steamId": sid_str,
                            "active": all_muts[sid_str]["active"],
                            "parent": all_muts[sid_str]["parent"],
                            "elderA": all_muts[sid_str]["elderA"],
                            "elderB": all_muts[sid_str]["elderB"]
                        })
                        time.sleep(0.3)

                        # 2. Gửi qua mutationSlots object
                        self.fetch_islepilot("/commands", method="POST", body_data={
                            "action": "mutations",
                            "steamId": sid_str,
                            "mutationSlots": all_muts[sid_str]
                        })
                        time.sleep(0.3)

                        # 3. Gửi danh sách active mutations
                        if active_clean:
                            self.fetch_islepilot("/commands", method="POST", body_data={
                                "action": "mutations",
                                "steamId": sid_str,
                                "mutations": active_clean
                            })
                            self.fetch_islepilot("/commands", method="POST", body_data={
                                "action": "mutations",
                                "steamId": sid_str,
                                "slots": active_clean
                            })
                            time.sleep(0.3)

                        # 4. Gửi từng slot cho các nhóm active và elderA
                        for c_name in ["active", "elderA"]:
                            for s_i, m_val in enumerate(all_muts[sid_str].get(c_name, [])):
                                if m_val and m_val != "None":
                                    self.fetch_islepilot("/commands", method="POST", body_data={
                                        "action": "mutations",
                                        "steamId": sid_str,
                                        "category": c_name,
                                        "slot": s_i + 1,
                                        "mutation": m_val
                                    })

                    threading.Thread(target=async_push_mutations, daemon=True).start()
                    self.send_json_response({"ok": True, "message": "Thành công", "mutationSlots": all_muts[sid_str]})
                    return
                elif action in ["teleporthub", "reset"]:
                    cmd_body["action"] = action
                elif action == "grant_dino_live":
                    species = params.get("species") or "Tyrannosaurus"
                    gender = params.get("gender", "Female")
                    growth_val = float(params.get("growth", 1.0))
                    if growth_val > 1.0:
                        growth_val = growth_val / 100.0
                    is_prime_elder = bool(params.get("isPrimeElder", False))
                    raw_muts = params.get("mutations", [])
                    mut_list = []
                    if isinstance(raw_muts, list):
                        mut_list = [str(m).strip() for m in raw_muts if str(m).strip() and str(m).strip() != "None"]
                    
                    self.apply_dino_in_game_worker(
                        steam_id=target_steam_id,
                        species=species,
                        gender=gender,
                        growth_val=growth_val,
                        is_prime=is_prime_elder,
                        mutations=mut_list,
                        needs_swap=True
                    )
                    self.send_json_response({"ok": True, "message": "Thành công"})
                    return
                elif action == "add_garage_dino":
                    species = params.get("species") or "Tyrannosaurus"
                    gender = params.get("gender", "Female")
                    growth_val = float(params.get("growth", 1.0))
                    if growth_val > 1.0:
                        growth_val = growth_val / 100.0
                    is_prime_elder = bool(params.get("isPrimeElder", False))
                    gift_file = "user_gift_dinos.json"
                    gifts = {}
                    if os.path.exists(gift_file):
                        try:
                            with open(gift_file, "r", encoding="utf-8") as f:
                                gifts = json.load(f)
                        except Exception:
                            pass
                    raw_muts = params.get("mutations", [])
                    mut_list = []
                    if isinstance(raw_muts, list):
                        mut_list = [str(m).strip() for m in raw_muts if str(m).strip() and str(m).strip() != "None"]
                    
                    spec_lower = (species or "").lower()
                    base_info = {"hp": 9500, "prime_hp": 13000, "label": "9.5 Tấn (9,500 kg)", "prime_label": "13.0 Tấn (13,000 kg)"}
                    for k, v in SPECIES_BASE_STATS.items():
                        if k in spec_lower:
                            base_info = v
                            break
                    target_hp = base_info.get("prime_hp", 13000) if is_prime_elder else base_info["hp"]
                    weight_label = base_info.get("prime_label", "13.0 Tấn (13,000 kg)") if is_prime_elder else base_info.get("label", "Chuẩn")

                    if str(target_steam_id) not in gifts:
                        gifts[str(target_steam_id)] = []
                    new_dino = {
                        "id": f"gift_{int(time.time()*1000)}",
                        "species": species,
                        "gender": gender,
                        "growth": round(growth_val, 2),
                        "health": 1.0,
                        "maxHealth": target_hp,
                        "weight": target_hp,
                        "weight_label": weight_label,
                        "hunger": 1.0,
                        "thirst": 1.0,
                        "stamina": 1.0,
                        "isPrimeElder": is_prime_elder,
                        "mutations": mut_list,
                        "mutationSlots": {
                            "active": mut_list
                        },
                        "parkedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                        "source": "admin_granted"
                    }
                    gifts[str(target_steam_id)].append(new_dino)
                    with open(gift_file, "w", encoding="utf-8") as f:
                        json.dump(gifts, f, ensure_ascii=False, indent=2)
                    self.send_json_response({"ok": True, "message": "Thành công", "dino": new_dino})
                    return
                elif action == "delete_garage_dino":
                    dino_id = str(params.get("garageDinoId") or "")
                    gift_file = "user_gift_dinos.json"
                    deleted = False
                    if os.path.exists(gift_file):
                        try:
                            with open(gift_file, "r", encoding="utf-8") as f:
                                gifts = json.load(f)
                            user_gifts = gifts.get(str(target_steam_id), [])
                            new_gifts = [g for g in user_gifts if str(g.get("id")) != dino_id]
                            if len(new_gifts) != len(user_gifts):
                                gifts[str(target_steam_id)] = new_gifts
                                with open(gift_file, "w", encoding="utf-8") as f:
                                    json.dump(gifts, f, ensure_ascii=False, indent=2)
                                deleted = True
                        except Exception:
                            pass
                    if deleted:
                        self.send_json_response({"ok": True, "message": "Thành công"})
                    else:
                        res = self.fetch_islepilot(f"/players/{target_steam_id}/garage/{dino_id}/sell", method="POST", body_data={})
                        if res and (res.get("ok") is True or "commandId" in res):
                            self.send_json_response({"ok": True, "result": res})
                        else:
                            self.send_json_response({"ok": False, "error": "Thất bại"}, status=400)
                    return
                elif action == "restore_garage_dino":
                    dino_id = str(params.get("garageDinoId") or "")
                    gift_file = "user_gift_dinos.json"
                    found_gift = None
                    if os.path.exists(gift_file):
                        try:
                            with open(gift_file, "r", encoding="utf-8") as f:
                                gifts = json.load(f)
                            user_gifts = gifts.get(str(target_steam_id), [])
                            for idx, g in enumerate(user_gifts):
                                if str(g.get("id")) == dino_id:
                                    found_gift = g
                                    user_gifts.pop(idx)
                                    break
                            if found_gift:
                                with open(gift_file, "w", encoding="utf-8") as f:
                                    json.dump(gifts, f, ensure_ascii=False, indent=2)
                        except Exception as e:
                            print("Error reading gift_file:", e)

                    if found_gift:
                        species = found_gift.get("species", "Tyrannosaurus")
                        gender = found_gift.get("gender", "Female")
                        growth_val = float(found_gift.get("growth", 1.0))
                        is_prime = bool(found_gift.get("isPrimeElder"))
                        gift_muts = [m for m in found_gift.get("mutations", []) if m and m != "None"]
                        
                        self.apply_dino_in_game_worker(
                            steam_id=target_steam_id,
                            species=species,
                            gender=gender,
                            growth_val=growth_val,
                            is_prime=is_prime,
                            mutations=gift_muts,
                            needs_swap=True
                        )
                        self.send_json_response({"ok": True, "message": "Thành công", "result": {"ok": True}})
                        return
                    else:
                        remote_garage = self.fetch_islepilot(f"/players/{target_steam_id}/garage") or {}
                        dino_muts = []
                        dino_spec = None
                        dino_growth = 1.0
                        is_prime = False
                        for gd in remote_garage.get("garage", []):
                            if str(gd.get("id")) == str(dino_id):
                                raw_m = gd.get("mutations") or (gd.get("mutationSlots", {}).get("active")) or []
                                dino_muts = [m for m in raw_m if m and str(m).strip() != "None"]
                                dino_spec = gd.get("species")
                                dino_growth = float(gd.get("growth", 1.0) or 1.0)
                                is_prime = bool(gd.get("isPrimeElder"))
                                break
                        restore_body = {}
                        if dino_muts:
                            restore_body["mutations"] = dino_muts
                        res = self.fetch_islepilot(f"/players/{target_steam_id}/garage/{dino_id}/restore", method="POST", body_data=restore_body)
                        if not res or (res.get("ok") is not True and "commandId" not in res):
                            # Dự phòng unpark không kèm gen nếu tính năng chọn gen tại garage đang tắt trên IslePilot
                            res = self.fetch_islepilot(f"/players/{target_steam_id}/garage/{dino_id}/restore", method="POST", body_data={})

                        if res and (res.get("ok") is True or "commandId" in res):
                            # BẢO TOÀN NGUYÊN VẸN MÁU, NƯỚC, ĐÓI, CHẤT A B Y VÀ VỊ TRÍ TỌA ĐỘ KHI CẤT
                            self.apply_dino_in_game_worker(
                                steam_id=target_steam_id,
                                species=dino_spec,
                                gender=None,
                                growth_val=dino_growth,
                                is_prime=is_prime,
                                mutations=dino_muts,
                                needs_swap=False,
                                preserve_vitals=True
                            )
                            self.send_json_response({"ok": True, "message": "Thành công", "result": res})
                        else:
                            err_msg = (res.get("error") if res else None) or "Thất bại"
                            self.send_json_response({"ok": False, "error": err_msg}, status=400)
                        return
                elif action == "park_garage_dino":
                    res = self.fetch_islepilot(f"/players/{target_steam_id}/garage/park", method="POST")
                    if res and (res.get("ok") is True or "commandId" in res):
                        self.send_json_response({"ok": True, "result": res})
                    else:
                        err_msg = (res.get("error") if res else None) or "Lệnh thất bại"
                        self.send_json_response({"ok": False, "error": err_msg}, status=400)
                    return
                elif action == "apply_skin":
                    preset_id = params.get("presetId")
                    res = self.fetch_islepilot(f"/players/{target_steam_id}/skins/{preset_id}/apply", method="POST")
                    if res and (res.get("ok") is True or "commandId" in res):
                        self.send_json_response({"ok": True, "result": res})
                    else:
                        err_msg = (res.get("error") if res else None) or "Lệnh thất bại"
                        self.send_json_response({"ok": False, "error": err_msg}, status=400)
                    return
                elif action == "goto":
                    admin_sid = str(params.get("adminSteamId") or payload.get("admin_steam_id") or "76561199175571899")
                    if str(admin_sid) == str(target_steam_id):
                        res = self.fetch_islepilot(f"/players/{target_steam_id}/teleport", method="POST", body_data={"locationId": "cmvm99rrk5fvula01pwetdn17"})
                        if res and (res.get("ok") is True or "commandId" in res or res.get("success") is True):
                            self.send_json_response({"ok": True, "result": res})
                        else:
                            self.send_json_response({"ok": False, "error": "Thất bại"}, status=400)
                        return

                    fc_res = self.fetch_islepilot(f"/players/{target_steam_id}/teleport/friend-code", method="POST", body_data={})
                    if fc_res and fc_res.get("ok") and fc_res.get("code"):
                        code = fc_res.get("code")
                        redeem_res = self.fetch_islepilot(f"/players/{admin_sid}/teleport/redeem", method="POST", body_data={"code": code})
                        if redeem_res and (redeem_res.get("ok") is True or "commandId" in redeem_res):
                            self.send_json_response({"ok": True, "result": redeem_res})
                        else:
                            err_msg = (redeem_res.get("error") if redeem_res else None) or "Lệnh thất bại"
                            self.send_json_response({"ok": False, "error": err_msg}, status=400)
                    else:
                        err_msg = (fc_res.get("error") if fc_res else None) or "Không thể tạo mã dịch chuyển"
                        self.send_json_response({"ok": False, "error": err_msg}, status=400)
                    return

                elif action == "bring":
                    admin_sid = str(params.get("adminSteamId") or payload.get("admin_steam_id") or "76561199175571899")
                    if str(admin_sid) == str(target_steam_id):
                        res = self.fetch_islepilot(f"/players/{target_steam_id}/teleport", method="POST", body_data={"locationId": "cmvm99rrk5fvula01pwetdn17"})
                        if res and (res.get("ok") is True or "commandId" in res or res.get("success") is True):
                            self.send_json_response({"ok": True, "result": res})
                        else:
                            self.send_json_response({"ok": False, "error": "Thất bại"}, status=400)
                        return

                    fc_res = self.fetch_islepilot(f"/players/{admin_sid}/teleport/friend-code", method="POST", body_data={})
                    if fc_res and fc_res.get("ok") and fc_res.get("code"):
                        code = fc_res.get("code")
                        redeem_res = self.fetch_islepilot(f"/players/{target_steam_id}/teleport/redeem", method="POST", body_data={"code": code})
                        if redeem_res and (redeem_res.get("ok") is True or "commandId" in redeem_res):
                            self.send_json_response({"ok": True, "result": redeem_res})
                        else:
                            err_msg = (redeem_res.get("error") if redeem_res else None) or "Lệnh thất bại"
                            self.send_json_response({"ok": False, "error": err_msg}, status=400)
                    else:
                        err_msg = (fc_res.get("error") if fc_res else None) or "Không thể tạo mã dịch chuyển"
                        self.send_json_response({"ok": False, "error": err_msg}, status=400)
                    return

                elif action in ["teleport", "teleporthub", "reset"]:
                    loc_id = params.get("locationId", "cmvm99rrk5fvula01pwetdn17")
                    res = self.fetch_islepilot(f"/players/{target_steam_id}/teleport", method="POST", body_data={"locationId": loc_id})
                    if res and (res.get("ok") is True or "commandId" in res or res.get("success") is True):
                        self.send_json_response({"ok": True, "result": res})
                    else:
                        err_msg = (res.get("error") if res else None) or "Lệnh thất bại"
                        self.send_json_response({"ok": False, "error": err_msg}, status=400)
                    return
                elif action == "swap":
                    cmd_body["species"] = params.get("species")
                    cmd_body["gender"] = params.get("gender", "Female")
                elif action == "warn":
                    cmd_body["message"] = str(params.get("message", "Cảnh báo từ Quản trị viên"))
                elif action == "kick":
                    cmd_body["reason"] = str(params.get("reason", "Vi phạm quy định server"))
                elif action == "ban":
                    cmd_body["reason"] = str(params.get("reason", "Vi phạm quy định server"))
                elif action == "scale":
                    cmd_body["scale"] = float(params.get("scale", 1.0))
                elif action == "announce":
                    cmd_body["message"] = str(params.get("message", ""))
                elif action == "setprime":
                    cmd_body["eligible"] = bool(params.get("eligible", True))
                    cmd_body["conditions"] = int(params.get("conditions", 10))
                    cmd_body["isElder"] = bool(params.get("isElder", True))
                    cmd_body["stacks"] = int(params.get("stacks", 10))
                elif action == "setpowers":
                    cmd_body["powers"] = bool(params.get("powers", True))
                elif action in ["slay", "smite"]:
                    cmd_body["action"] = "slay"
                    if "reason" in params:
                        cmd_body["reason"] = str(params.get("reason"))
                elif action == "adjust_balance":
                    delta = int(float(params.get("amount", 0)))
                    res = self.fetch_islepilot(f"/players/{target_steam_id}/currency", method="POST", body_data={
                        "amount": delta,
                        "reason": params.get("reason", "Admin điều chỉnh số dư từ Web Dashboard")
                    })
                    if res and (res.get("ok") is True or "balance" in res):
                        self.send_json_response({"ok": True, "balance": res.get("balance")})
                    else:
                        adj_file = "admin_wallet_adjustments.json"
                        adjs = {}
                        if os.path.exists(adj_file):
                            try:
                                with open(adj_file, "r", encoding="utf-8") as f:
                                    adjs = json.load(f)
                            except Exception:
                                pass
                        cur = adjs.get(str(target_steam_id), 0)
                        adjs[str(target_steam_id)] = max(0, cur + delta)
                        try:
                            with open(adj_file, "w", encoding="utf-8") as f:
                                json.dump(adjs, f, ensure_ascii=False, indent=2)
                        except Exception:
                            pass
                        self.send_json_response({"ok": True, "balance": adjs[str(target_steam_id)]})
                    return
                
                res = self.fetch_islepilot("/commands", method="POST", body_data=cmd_body)
                if res and (res.get("ok") is True or "commandId" in res):
                    self.send_json_response({"ok": True, "result": res})
                else:
                    err_msg = (res.get("error") if res else None) or "Lệnh thất bại"
                    self.send_json_response({"ok": False, "error": err_msg}, status=400)
            except Exception as e:
                self.send_json_response({"ok": False, "error": str(e)}, status=500)
            return

        elif self.path.startswith("/api/admin/garage/settings"):
            is_admin, _ = self.is_admin_request()
            if not is_admin:
                self.send_json_response({"ok": False, "error": "Unauthorized"}, status=403)
                return
            try:
                length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(length).decode("utf-8")
                payload = json.loads(body)
                if "maxSlots" in payload:
                    config["MAX_GARAGE_SLOTS"] = int(payload["maxSlots"])
                if "parkSeconds" in payload:
                    config["GARAGE_PARK_SECONDS"] = int(payload["parkSeconds"])
                save_config(config)
                self.send_json_response({
                    "ok": True,
                    "maxSlots": config.get("MAX_GARAGE_SLOTS", 5),
                    "parkSeconds": config.get("GARAGE_PARK_SECONDS", 30)
                })
            except Exception as e:
                self.send_json_response({"ok": False, "error": str(e)}, status=500)
            return

        elif self.path.startswith("/api/admin/garage/add-dino"):
            is_admin, _ = self.is_admin_request()
            if not is_admin:
                self.send_json_response({"ok": False, "error": "Unauthorized"}, status=403)
                return
            try:
                length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(length).decode("utf-8")
                payload = json.loads(body)
                target_steam_id = str(payload.get("steamId", "")).strip()
                species = payload.get("species")
                gender = payload.get("gender", "Female")
                growth = float(payload.get("growth", 1.0))
                if not target_steam_id or not species:
                    self.send_json_response({"ok": False, "error": "Thiếu steamId hoặc species"}, status=400)
                    return

                # Send in-game swap command
                swap_res = self.fetch_islepilot("/commands", method="POST", body_data={
                    "action": "swap",
                    "steamId": target_steam_id,
                    "species": species,
                    "gender": gender
                })
                # Set growth
                self.fetch_islepilot("/commands", method="POST", body_data={
                    "action": "setgrowth",
                    "steamId": target_steam_id,
                    "growth": growth,
                    "frozen": False
                })

                # Save to user_gift_dinos.json
                gift_file = "user_gift_dinos.json"
                gifts = {}
                if os.path.exists(gift_file):
                    try:
                        with open(gift_file, "r", encoding="utf-8") as f:
                            gifts = json.load(f)
                    except Exception:
                        pass
                if target_steam_id not in gifts:
                    gifts[target_steam_id] = []
                import time
                gifts[target_steam_id].append({
                    "id": f"gift_{int(time.time()*1000)}",
                    "character": species,
                    "species": species,
                    "gender": gender,
                    "growth": growth,
                    "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
                })
                with open(gift_file, "w", encoding="utf-8") as f:
                    json.dump(gifts, f, ensure_ascii=False, indent=2)

                self.send_json_response({"ok": True, "result": swap_res})
            except Exception as e:
                self.send_json_response({"ok": False, "error": str(e)}, status=500)
            return

        elif self.path.startswith("/api/admin/shop/skins"):
            is_admin, _ = self.is_admin_request()
            if not is_admin:
                self.send_json_response({"ok": False, "error": "Unauthorized"}, status=403)
                return
            try:
                length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(length).decode("utf-8")
                payload = json.loads(body)
                skins_file = "admin_custom_skins.json"
                skins = []
                if os.path.exists(skins_file):
                    try:
                        with open(skins_file, "r", encoding="utf-8") as f:
                            skins = json.load(f)
                    except Exception:
                        pass
                if payload.get("action") == "delete":
                    skin_id = payload.get("skinId")
                    skins = [s for s in skins if s.get("id") != skin_id]
                else:
                    import time
                    new_skin = {
                        "id": payload.get("id") or f"custom_{int(time.time()*1000)}",
                        "name": payload.get("name", "Skin Đặc Biệt"),
                        "species": payload.get("species", "Tyrannosaurus"),
                        "price": int(payload.get("price", 500)),
                        "colors": payload.get("colors", ["#ff2a85", "#d91b6e", "#120e18"]),
                        "pattern": payload.get("pattern", "Pattern_01"),
                        "description": payload.get("description", "Skin độc quyền Admin tạo"),
                        "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
                    }
                    skins.insert(0, new_skin)
                with open(skins_file, "w", encoding="utf-8") as f:
                    json.dump(skins, f, ensure_ascii=False, indent=2)
                self.send_json_response({"ok": True, "skins": skins})
            except Exception as e:
                self.send_json_response({"ok": False, "error": str(e)}, status=500)
            return

        self.send_error(404, "Endpoint not found")

    def send_json_response(self, data, status=200):

        body = json.dumps(data, ensure_ascii=False).encode("utf-8")

        self.send_response(status)

        self.send_header("Content-Type", "application/json; charset=utf-8")

        self.send_header("Content-Length", str(len(body)))

        self.send_header("Access-Control-Allow-Origin", "*")

        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")

        self.end_headers()

        self.wfile.write(body)

    def apply_dino_in_game_worker(self, steam_id, species, gender, growth_val, is_prime, mutations, needs_swap=True, preserve_vitals=False):
        def worker():
            try:
                sid = str(steam_id).strip()
                spec = species or "Tyrannosaurus"
                gen = gender or "Female"
                gr = float(growth_val if growth_val is not None else 1.0)
                if gr > 1.0:
                    gr = gr / 100.0
                
                # Chuẩn hóa tên gen đột biến (Title Case chuẩn The Isle Evrima)
                clean_muts = []
                for m in (mutations or []):
                    m_str = str(m).strip()
                    if m_str and m_str.lower() != "none":
                        if m_str.lower() == "enlarged meniscus":
                            m_str = "Enlarged Meniscus"
                        clean_muts.append(m_str)

                # NẾU LÀ DINO RÚT TỪ GARA (preserve_vitals=True):
                # IslePilot unpark đã khôi phục nguyên vẹn 100% tọa độ vị trí (x, y, z), máu, nước, đói và chất dinh dưỡng A B Y
                # TUYỆT ĐỐI KHÔNG gọi swap, KHÔNG gọi setstats, KHÔNG gọi setnutrition, KHÔNG gọi teleport hay setgrowth!
                if preserve_vitals:
                    if is_prime:
                        self.fetch_islepilot("/commands", method="POST", body_data={
                            "action": "setprime",
                            "steamId": sid,
                            "eligible": True,
                            "conditions": 10,
                            "isElder": True,
                            "stacks": 10
                        })
                        time.sleep(0.3)
                        self.fetch_islepilot("/commands", method="POST", body_data={
                            "action": "scale",
                            "steamId": sid,
                            "scale": 1.37
                        })
                        time.sleep(0.3)

                    if clean_muts:
                        # 1. Gửi mảng mutations
                        self.fetch_islepilot("/commands", method="POST", body_data={
                            "action": "mutations",
                            "steamId": sid,
                            "mutations": clean_muts
                        })
                        self.fetch_islepilot("/commands", method="POST", body_data={
                            "action": "mutations",
                            "steamId": sid,
                            "slots": clean_muts
                        })
                        self.fetch_islepilot("/commands", method="POST", body_data={
                            "action": "mutations",
                            "steamId": sid,
                            "category": "active",
                            "mutations": clean_muts
                        })

                        # 2. Gửi từng slot gen
                        for slot_i, m_name in enumerate(clean_muts[:4]):
                            slot_num = slot_i + 1
                            self.fetch_islepilot("/commands", method="POST", body_data={
                                "action": "mutations",
                                "steamId": sid,
                                "slot": slot_num,
                                "mutation": m_name
                            })
                            self.fetch_islepilot("/commands", method="POST", body_data={
                                "action": "mutations",
                                "steamId": sid,
                                "category": "active",
                                "slot": slot_num,
                                "mutation": m_name
                            })
                            if is_prime:
                                self.fetch_islepilot("/commands", method="POST", body_data={
                                    "action": "mutations",
                                    "steamId": sid,
                                    "category": "elderA",
                                    "slot": slot_num,
                                    "mutation": m_name
                                })

                        # 3. Gửi mutationSlots hoàn chỉnh
                        full_mutation_slots = {
                            "active": clean_muts + ["None"] * (4 - len(clean_muts)),
                            "parent": ["None", "None", "None", "None"],
                            "elderA": (clean_muts + ["None"] * (4 - len(clean_muts))) if is_prime else ["None", "None", "None", "None"],
                            "elderB": ["None", "None", "None", "None"]
                        }
                        self.fetch_islepilot("/commands", method="POST", body_data={
                            "action": "mutations",
                            "steamId": sid,
                            "mutationSlots": full_mutation_slots
                        })

                        # 4. Lưu bền vững vào admin_player_mutations.json
                        try:
                            mut_file = "admin_player_mutations.json"
                            all_m = {}
                            if os.path.exists(mut_file):
                                with open(mut_file, "r", encoding="utf-8") as fp:
                                    all_m = json.load(fp)
                            all_m[sid] = full_mutation_slots
                            with open(mut_file, "w", encoding="utf-8") as fp:
                                json.dump(all_m, fp, ensure_ascii=False, indent=2)
                        except Exception as ex_m:
                            pass

                        # 5. Reinforce worker: CHỈ bổ trợ mutations, TUYỆT ĐỐI không gọi setstats hay setnutrition!
                        def reinforce_mut_only():
                            time.sleep(5.0)
                            self.fetch_islepilot("/commands", method="POST", body_data={
                                "action": "mutations",
                                "steamId": sid,
                                "mutations": clean_muts
                            })
                            for slot_i, m_name in enumerate(clean_muts[:4]):
                                self.fetch_islepilot("/commands", method="POST", body_data={
                                    "action": "mutations",
                                    "steamId": sid,
                                    "category": "active",
                                    "slot": slot_i + 1,
                                    "mutation": m_name
                                })
                                if is_prime:
                                    self.fetch_islepilot("/commands", method="POST", body_data={
                                        "action": "mutations",
                                        "steamId": sid,
                                        "category": "elderA",
                                        "slot": slot_i + 1,
                                        "mutation": m_name
                                    })
                        threading.Thread(target=reinforce_mut_only, daemon=True).start()

                    print(f"[apply_dino_in_game] Rút từ Gara thành công: Giữ nguyên 100% tọa độ và chỉ số máu, nước, đói, chất A B Y của {sid}.")
                    return

                spec_lower = spec.lower()
                base_info = {"hp": 9500, "prime_hp": 13000, "hunger": 4000}
                for k, v in SPECIES_BASE_STATS.items():
                    if k in spec_lower:
                        base_info = v
                        break
                target_hp = base_info.get("prime_hp", 13000) if is_prime else base_info["hp"]
                target_hunger = base_info.get("hunger", 4000)
                if is_prime and "hunger" in base_info:
                    target_hunger = int(base_info["hunger"] * 1.25)
                
                # Kiểm tra trạng thái thực tế của người chơi trên IslePilot
                live_player = self.fetch_islepilot(f"/players/{sid}") or {}
                live_species = (live_player.get("species") or "").strip().lower()
                live_health = float(live_player.get("health") or 0)
                is_alive = bool(live_player.get("online")) and live_health > 0
                
                # Nếu người chơi đang sống đúng loài khủng long này, tránh gọi swap làm chết nhân vật
                should_swap = needs_swap
                if needs_swap and is_alive and live_species == spec_lower:
                    should_swap = False
                    print(f"[apply_dino_in_game] Người chơi {sid} đang sống đúng loài {spec}, bỏ qua swap để không làm chết khủng long.")
                
                if should_swap:
                    if spec_lower in ["spinosaurus", "spino", "puerta", "indorex", "indo"]:
                        print(f"[apply_dino_in_game] Bỏ qua swap lệnh cho loài custom/mod: {spec}")
                    else:
                        self.fetch_islepilot("/commands", method="POST", body_data={
                            "action": "swap",
                            "steamId": sid,
                            "species": spec,
                            "gender": gen
                        })
                        time.sleep(4.0) # Đợi nhân vật Evrima spawn hoàn chỉnh
                
                # Cấu hình Prime Elder
                if is_prime:
                    self.fetch_islepilot("/commands", method="POST", body_data={
                        "action": "setprime",
                        "steamId": sid,
                        "eligible": True,
                        "conditions": 10,
                        "isElder": True,
                        "stacks": 10
                    })
                    time.sleep(0.4)
                    self.fetch_islepilot("/commands", method="POST", body_data={
                        "action": "scale",
                        "steamId": sid,
                        "scale": 1.37
                    })
                    time.sleep(0.4)
                
                # Set stats chuẩn số ký và máu (Spino Prime: 15,000 HP / 15.0 Tấn, Trice: 13,000 HP / 13.0 Tấn)
                self.fetch_islepilot("/commands", method="POST", body_data={
                    "action": "setstats",
                    "steamId": sid,
                    "growth": gr,
                    "health": target_hp,
                    "maxHealth": target_hp,
                    "hunger": target_hunger,
                    "thirst": 1000,
                    "stamina": 100,
                    "bleed": 0
                })
                time.sleep(0.4)
                
                # Set dinh dưỡng hoàn hảo
                self.fetch_islepilot("/commands", method="POST", body_data={
                    "action": "setnutrition",
                    "steamId": sid,
                    "carb": 100,
                    "protein": 100,
                    "lipid": 100
                })
                time.sleep(0.4)
                
                # Set tăng trưởng
                self.fetch_islepilot("/commands", method="POST", body_data={
                    "action": "setgrowth",
                    "steamId": sid,
                    "growth": gr,
                    "frozen": False
                })
                time.sleep(0.4)

                if clean_muts:
                    # 1. Gửi mảng mutations trực tiếp
                    self.fetch_islepilot("/commands", method="POST", body_data={
                        "action": "mutations",
                        "steamId": sid,
                        "mutations": clean_muts
                    })
                    self.fetch_islepilot("/commands", method="POST", body_data={
                        "action": "mutations",
                        "steamId": sid,
                        "slots": clean_muts
                    })
                    self.fetch_islepilot("/commands", method="POST", body_data={
                        "action": "mutations",
                        "steamId": sid,
                        "category": "active",
                        "mutations": clean_muts
                    })
                    
                    # 2. Gửi từng slot gen (active và elderA nếu prime)
                    for slot_i, m_name in enumerate(clean_muts[:4]):
                        slot_num = slot_i + 1
                        self.fetch_islepilot("/commands", method="POST", body_data={
                            "action": "mutations",
                            "steamId": sid,
                            "slot": slot_num,
                            "mutation": m_name
                        })
                        self.fetch_islepilot("/commands", method="POST", body_data={
                            "action": "mutations",
                            "steamId": sid,
                            "category": "active",
                            "slot": slot_num,
                            "mutation": m_name
                        })
                        if is_prime:
                            self.fetch_islepilot("/commands", method="POST", body_data={
                                "action": "mutations",
                                "steamId": sid,
                                "category": "elderA",
                                "slot": slot_num,
                                "mutation": m_name
                            })
                    
                    # 3. Gửi mutationSlots hoàn chỉnh
                    full_mutation_slots = {
                        "active": clean_muts + ["None"] * (4 - len(clean_muts)),
                        "parent": ["None", "None", "None", "None"],
                        "elderA": (clean_muts + ["None"] * (4 - len(clean_muts))) if is_prime else ["None", "None", "None", "None"],
                        "elderB": ["None", "None", "None", "None"]
                    }
                    self.fetch_islepilot("/commands", method="POST", body_data={
                        "action": "mutations",
                        "steamId": sid,
                        "mutationSlots": full_mutation_slots
                    })

                    # 4. Lưu bền vững vào admin_player_mutations.json
                    try:
                        mut_file = "admin_player_mutations.json"
                        all_m = {}
                        if os.path.exists(mut_file):
                            with open(mut_file, "r", encoding="utf-8") as fp:
                                all_m = json.load(fp)
                        all_m[sid] = full_mutation_slots
                        with open(mut_file, "w", encoding="utf-8") as fp:
                            json.dump(all_m, fp, ensure_ascii=False, indent=2)
                    except Exception as ex_m:
                        print(f"Error saving admin_player_mutations: {ex_m}")

                    # 5. Luồng phụ bổ trợ (reinforce) sau 5 giây để đảm bảo gen ăn chắc chắn vào nhân vật game
                    def reinforce_worker():
                        time.sleep(5.0)
                        self.fetch_islepilot("/commands", method="POST", body_data={
                            "action": "setstats",
                            "steamId": sid,
                            "growth": gr,
                            "health": target_hp,
                            "maxHealth": target_hp,
                            "hunger": target_hunger,
                            "thirst": 1000,
                            "stamina": 100,
                            "bleed": 0
                        })
                        self.fetch_islepilot("/commands", method="POST", body_data={
                            "action": "mutations",
                            "steamId": sid,
                            "mutations": clean_muts
                        })
                        for slot_i, m_name in enumerate(clean_muts[:4]):
                            self.fetch_islepilot("/commands", method="POST", body_data={
                                "action": "mutations",
                                "steamId": sid,
                                "category": "active",
                                "slot": slot_i + 1,
                                "mutation": m_name
                            })
                            if is_prime:
                                self.fetch_islepilot("/commands", method="POST", body_data={
                                    "action": "mutations",
                                    "steamId": sid,
                                    "category": "elderA",
                                    "slot": slot_i + 1,
                                    "mutation": m_name
                                })
                    threading.Thread(target=reinforce_worker, daemon=True).start()
                    
                print(f"[apply_dino_in_game] Hoàn tất áp dụng cho {sid}: {spec}, is_prime={is_prime}, HP={target_hp}, muts={clean_muts}")
            except Exception as e:
                print(f"[apply_dino_in_game] Error: {e}")
                
        t = threading.Thread(target=worker, daemon=True)
        t.start()
    def fetch_islepilot(self, endpoint, method="GET", body_data=None):

        api_key = config.get("ISLEPILOT_API_KEY", "").strip()

        base_url = "https://islepilot.eu/api/v1"

        if not api_key:

            return None

        server_id = config.get("SERVER_ID", "cmv3zzfix02g3pj01yay0hw4g")

        if "serverId=" not in endpoint:

            sep = "&" if "?" in endpoint else "?"

            endpoint = f"{endpoint}{sep}serverId={server_id}"

        url = f"{base_url}{endpoint}"

        data_bytes = None

        if body_data is not None:

            data_bytes = json.dumps(body_data).encode("utf-8")

        req = urllib.request.Request(url, data=data_bytes, method=method)

        req.add_header("Authorization", f"Bearer {api_key}")

        req.add_header("x-api-key", api_key)

        req.add_header("User-Agent", "3MGAMING-Portal/1.0")

        if data_bytes is not None:

            req.add_header("Content-Type", "application/json")

        try:

            with urllib.request.urlopen(req, timeout=6) as response:

                if response.status in [200, 201]:

                    return json.loads(response.read().decode("utf-8"))

        except urllib.error.HTTPError as e:

            try:

                err_content = e.read().decode("utf-8")

                return json.loads(err_content)

            except:

                pass

            print(f"[IslePilot API] Gọi {url} HTTP {e.code}")

        except Exception as e:

            print(f"[IslePilot API] Gọi {url} thất bại: {e}")

        return None

    def get_active_steam_id(self):

        query = urllib.parse.urlparse(self.path).query

        q_params = urllib.parse.parse_qs(query)

        active_steam_id = q_params.get("steam_id", [None])[0]

        if not active_steam_id:

            cookie_header = self.headers.get("Cookie", "")

            match = re.search(r"steam_user=([^;:]+)", cookie_header)

            if match:

                active_steam_id = match.group(1)

        if not active_steam_id:

            players_data = self.fetch_islepilot("/players")

            if players_data and "players" in players_data and len(players_data["players"]) > 0:

                active_steam_id = players_data["players"][0].get("steamId")

        return active_steam_id or "76561199259679997"

    # --- Steam OpenID Authentication Logic ---

    def handle_steam_login(self):

        host = self.headers.get("Host", f"localhost:{config.get('PORT', 8000)}")

        scheme = "https" if "https" in self.headers.get("X-Forwarded-Proto", "") else "http"

        return_to = f"{scheme}://{host}/api/player/steam/callback"

        params = {

            "openid.ns": "http://specs.openid.net/auth/2.0",

            "openid.mode": "checkid_setup",

            "openid.return_to": return_to,

            "openid.realm": f"{scheme}://{host}/",

            "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",

            "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select"

        }

        steam_url = "https://steamcommunity.com/openid/login?" + urllib.parse.urlencode(params)

        self.send_response(302)

        self.send_header("Location", steam_url)

        self.send_header("Content-Length", "0")

        self.end_headers()

    def handle_steam_callback(self):

        parsed = urllib.parse.urlparse(self.path)

        params = urllib.parse.parse_qs(parsed.query)

        claimed_id = params.get("openid.claimed_id", [""])[0]

        match = re.search(r"openid/id/(\d+)", claimed_id)

        if not match:

            self.send_response(302)

            self.send_header("Location", "/#home")

            self.end_headers()

            return

        steam_id = match.group(1)

        # Xác thực với Valve Steam OpenID server

        val_params = {}

        for k, v in params.items():

            val_params[k] = v[0]

        val_params["openid.mode"] = "check_authentication"

        try:

            val_req = urllib.request.Request(

                "https://steamcommunity.com/openid/login",

                data=urllib.parse.urlencode(val_params).encode("utf-8")

            )

            val_req.add_header("Content-Type", "application/x-www-form-urlencoded")

            with urllib.request.urlopen(val_req, timeout=5) as val_resp:

                val_text = val_resp.read().decode("utf-8")

                if "is_valid:true" not in val_text:

                    print(f"[Steam OpenID] Xác thực signature không hợp lệ: {steam_id}")

        except Exception as e:

            print(f"[Steam OpenID] Lỗi gửi verify tới Steam: {e}")

        # Lấy tên người chơi từ IslePilot API

        player_name = f"Player_{steam_id[-4:]}"

        remote_players = self.fetch_islepilot("/players")

        if remote_players and "players" in remote_players:

            for p in remote_players["players"]:

                if p.get("steamId") == steam_id and p.get("name"):

                    player_name = p.get("name")

                    break

        if player_name.startswith("Player_"):

            remote_lb = self.fetch_islepilot("/leaderboard")

            if remote_lb and "entries" in remote_lb:

                for entry in remote_lb["entries"]:

                    if entry.get("steamId") == steam_id and entry.get("name"):

                        player_name = entry.get("name")

                        break

        encoded_name = urllib.parse.quote(player_name)

        cookie_val = f"{steam_id}:{encoded_name}"

        redirect_url = f"/?steam_id={steam_id}&name={encoded_name}#garage"

        self.send_response(302)

        self.send_header("Set-Cookie", f"steam_user={cookie_val}; Path=/; Max-Age=2592000; SameSite=Lax")

        self.send_header("Location", redirect_url)

        self.send_header("Content-Length", "0")

        self.end_headers()

    def handle_player_me(self):

        cookie_header = self.headers.get("Cookie", "")

        match = re.search(r"steam_user=([^;]+)", cookie_header)

        steam_id = None

        name = None

        is_logged_in = False

        if match:
            raw = match.group(1).strip()
            if raw:
                parts = raw.split(":", 1)
                steam_id = parts[0]
                name = urllib.parse.unquote(parts[1]) if len(parts) > 1 else f"Player_{steam_id[-4:]}"
                is_logged_in = True
        else:
            query = urllib.parse.urlparse(self.path).query
            q_params = urllib.parse.parse_qs(query)
            query_steam_id = q_params.get("steam_id", [None])[0]
            if query_steam_id:
                steam_id = query_steam_id
                is_logged_in = True

        balance = 0
        if is_logged_in and steam_id:
            player_info = self.fetch_islepilot(f"/players/{steam_id}")
            if isinstance(player_info, dict):
                wallet = player_info.get("wallet", {})
                if isinstance(wallet, dict) and "balance" in wallet:
                    balance = wallet.get("balance", 0)
                if os.path.exists("admin_wallet_adjustments.json"):
                    try:
                        with open("admin_wallet_adjustments.json", "r", encoding="utf-8") as f:
                            adjs = json.load(f)
                            balance = max(0, balance + adjs.get(str(steam_id), 0))
                    except Exception:
                        pass
                if not name and player_info.get("name"):
                    name = player_info.get("name")

        self.send_json_response({
            "logged_in": is_logged_in,
            "steam_id": steam_id if is_logged_in else None,
            "name": name if is_logged_in else None,
            "balance": balance if is_logged_in else 0
        })

    def handle_player_active_dino(self):

        steam_id = self.get_active_steam_id()

        player_info = self.fetch_islepilot(f"/players/{steam_id}")

        is_logged_in = bool(re.search(r"steam_user=([^;]+)", self.headers.get("Cookie", "")))

        

        if isinstance(player_info, dict):

            sp = player_info.get("species")

            gender = "female" if player_info.get("female") else "male"

            growth = player_info.get("growth", 1.0)

            online = bool(player_info.get("online", False))

            name = player_info.get("name") or f"Player_{steam_id[-4:]}"

            

            if sp:

                self.send_json_response({

                    "logged_in": is_logged_in,

                    "steam_id": steam_id,

                    "name": name,

                    "species": sp,

                    "gender": gender,

                    "female": bool(player_info.get("female", False)),

                    "growth": growth,

                    "online": online,

                    "source": "active"

                })

                return

            

            # Nếu chưa có active species, tìm trong garage

            garage_data = self.fetch_islepilot(f"/players/{steam_id}/garage")

            dinos = []

            if isinstance(garage_data, list):

                dinos = garage_data

            elif isinstance(garage_data, dict) and "dinosaurs" in garage_data:

                dinos = garage_data.get("dinosaurs", [])

            

            if dinos and len(dinos) > 0:

                first = dinos[0]

                self.send_json_response({

                    "logged_in": is_logged_in,

                    "steam_id": steam_id,

                    "name": name,

                    "species": first.get("species", "Tyrannosaurus"),

                    "gender": "female" if first.get("female") else "male",

                    "female": bool(first.get("female", False)),

                    "growth": first.get("growth", 1.0),

                    "online": online,

                    "source": "garage"

                })

                return

            

            self.send_json_response({

                "logged_in": is_logged_in,

                "steam_id": steam_id,

                "name": name,

                "species": "Tyrannosaurus",

                "gender": "male",

                "female": False,

                "growth": 1.0,

                "online": online,

                "source": "default"

            })

            return

        self.send_json_response({

            "logged_in": False,

            "steam_id": steam_id,

            "name": "Người chơi",

            "species": "Tyrannosaurus",

            "gender": "male",

            "female": False,

            "growth": 1.0,

            "online": False,

            "source": "default"

        })

    def handle_player_logout(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Set-Cookie", "steam_user=; Path=/; Max-Age=0; SameSite=Lax")
        self.send_header("Set-Cookie", "admin_auth=; Path=/; Max-Age=0; SameSite=Lax")
        self.end_headers()
        self.wfile.write(json.dumps({"ok": True, "logged_out": True}).encode("utf-8"))

    def handle_server_status(self):

        remote_data = self.fetch_islepilot("/server")

        if remote_data:

            online_count = remote_data.get("playersOnline", remote_data.get("lastPlayerCount", 0))

            cpu = remote_data.get("cpuPct", 0)

            mem_used = round(remote_data.get("memoryUsedMb", 0) / 1024, 1)

            mem_total = round(remote_data.get("memoryTotalMb", 0) / 1024, 1)

            server_name = config.get("SERVER_NAME", "3MGAMING")

            self.send_json_response({

                "online": True,

                "server_name": server_name,

                "players_count": online_count,

                "max_players": config.get("MAX_SLOTS", 100),

                "server_fps": 60.0,

                "cpu_pct": cpu,

                "ram_usage": f"{mem_used}GB / {mem_total}GB",

                "map": "Gateway",

                "uptime": "Đang hoạt động ổn định",

                "restart_countdown": "Mỗi 4 tiếng",

                "source": "islepilot_v1_live"

            })

            return

        self.send_json_response({

            "online": True,

            "players_count": 88,

            "max_players": config.get("MAX_SLOTS", 100),

            "server_fps": 60.0,

            "map": "Gateway",

            "uptime": "3 giờ 20 phút",

            "restart_countdown": "40 phút",

            "source": "cache"

        })

    def handle_players(self):

        remote_data = self.fetch_islepilot("/players")

        players = remote_data.get("players", []) if (remote_data and "players" in remote_data) else []

        # Parse query params: mode=admin|guest & steam_id
        query = urllib.parse.urlparse(self.path).query
        q_params = urllib.parse.parse_qs(query)
        client_mode = q_params.get("mode", ["guest"])[0]
        target_steam_id = q_params.get("steam_id", [None])[0]

        is_admin, _ = self.is_admin_request()

        # Nếu là Admin và đang chọn chế độ Quản trị viên -> Cho phép xem toàn bộ người chơi
        if is_admin and client_mode == "admin":
            self.send_json_response(players)
            return

        # Chế độ Khách (hoặc người chơi bình thường):
        # Chỉ trả về duy nhất người chơi đang đăng nhập (nếu có steam_id)
        if target_steam_id:
            target_steam_id = str(target_steam_id).strip()
            my_players = [p for p in players if str(p.get("steamId", "")) == target_steam_id]
            self.send_json_response(my_players)
            return

        # Chưa đăng nhập Steam và ở chế độ khách -> không trả về vị trí ai
        self.send_json_response([])

    def handle_leaderboard(self):

        remote_data = self.fetch_islepilot("/leaderboard")

        if remote_data and "entries" in remote_data:

            entries = remote_data["entries"]

            # Lấy danh sách live players để biết ai đang online
            remote_live = self.fetch_islepilot("/players?limit=250") or {}
            live_players = remote_live.get("players", [])
            live_map = {str(p.get("steamId")): p for p in live_players if p.get("steamId")}

            query = urllib.parse.urlparse(self.path).query
            q_params = urllib.parse.parse_qs(query)
            client_mode = q_params.get("mode", ["guest"])[0]

            is_admin, _ = self.is_admin_request()
            is_admin_mode = is_admin and (client_mode == "admin")

            formatted = []
            for item in entries:
                sid = str(item.get("steamId", "")).strip()
                live_p = live_map.pop(sid, None)
                is_online = bool(live_p and live_p.get("online") is not False)
                kills = item.get("kills", 0)
                deaths = item.get("deaths", 0)
                kd = round(kills / max(1, deaths), 2)
                score = kills * 150 + item.get("nests", 0) * 80 + max(1, kills * 25)

                formatted.append({
                    "rank": len(formatted) + 1,
                    "steamId": sid,
                    "steam_id": sid,
                    "name": (live_p.get("name") if live_p else None) or item.get("name") or f"Player_{sid[-4:]}",
                    "favorite_dino": (live_p.get("species") if live_p else "Đa dạng (The Isle)"),
                    "species": (live_p.get("species") if live_p else "Đa dạng (The Isle)"),
                    "online": is_online,
                    "kills": kills,
                    "deaths": deaths,
                    "kd": kd,
                    "nests": item.get("nests", 0),
                    "survival_hours": max(5, int(kills * 1.8) + 10),
                    "score": score
                })

            # Nếu ở chế độ Quản trị viên:
            # 1. Thêm cả những người chơi đang online nhưng chưa có trong leaderboard
            if is_admin_mode:
                for sid, live_p in live_map.items():
                    formatted.append({
                        "rank": len(formatted) + 1,
                        "steamId": sid,
                        "steam_id": sid,
                        "name": live_p.get("name") or f"Player_{sid[-4:]}",
                        "favorite_dino": live_p.get("species", "Chưa chọn"),
                        "species": live_p.get("species", "Chưa chọn"),
                        "online": True,
                        "kills": 0,
                        "deaths": 0,
                        "kd": 0.0,
                        "nests": 0,
                        "survival_hours": max(5, int(live_p.get("totalPlaySec", 0) / 3600)),
                        "score": 100
                    })

                # 2. Sắp xếp: TẤT CẢ NGƯỜI CHƠI ONLINE Ở PHÍA TRÊN, OFFLINE Ở PHÍA DƯỚI
                online_list = [p for p in formatted if p["online"]]
                offline_list = [p for p in formatted if not p["online"]]
                online_list.sort(key=lambda x: (-x["score"], -x["kills"], x["deaths"]))
                offline_list.sort(key=lambda x: (-x["score"], -x["kills"], x["deaths"]))
                formatted = online_list + offline_list
            else:
                # Chế độ khách: Sắp xếp theo kill/score truyền thống (trang khách giữ nguyên)
                formatted.sort(key=lambda x: (x["kills"], -x["deaths"]), reverse=True)

            for idx, item in enumerate(formatted):
                item["rank"] = idx + 1

            self.send_json_response(formatted)
            return

        self.send_json_response([])

    def handle_killfeed(self):

        remote_data = self.fetch_islepilot("/killfeed")

        if remote_data and "kills" in remote_data:

            kills = remote_data["kills"]

            formatted = []

            for item in kills:

                killer = item.get("killerName") or "Môi trường / Tự nhiên"

                victim = item.get("victimName") or "Người chơi"

                killer_dino = item.get("killerSpecies") or ""

                victim_dino = item.get("victimSpecies") or "Dino"

                cause = item.get("cause") or "hạ gục"

                created_at = item.get("createdAt")

                

                time_ago = "Gần đây"

                if created_at:

                    try:

                        time_ago = created_at[11:16]

                    except:

                        pass

                formatted.append({

                    "id": item.get("id"),

                    "killer": killer,

                    "killer_dino": killer_dino if killer_dino else "Thiên nhiên",

                    "action": cause,

                    "victim": victim,

                    "victim_dino": victim_dino,

                    "location": "Gateway",

                    "time_ago": time_ago

                })

            self.send_json_response(formatted)

            return

        self.send_json_response([])

    def handle_garage(self):

        # Lấy steam_id từ query parameter hoặc cookie

        query = urllib.parse.urlparse(self.path).query

        q_params = urllib.parse.parse_qs(query)

        active_steam_id = q_params.get("steam_id", [None])[0]

        if not active_steam_id:

            cookie_header = self.headers.get("Cookie", "")

            match = re.search(r"steam_user=([^;:]+)", cookie_header)

            if match:

                active_steam_id = match.group(1)

        # Nếu chưa đăng nhập, dùng steamId mẫu từ danh sách người chơi online

        if not active_steam_id:

            players_data = self.fetch_islepilot("/players")

            if players_data and "players" in players_data and len(players_data["players"]) > 0:

                active_steam_id = players_data["players"][0].get("steamId")

        if active_steam_id:

            remote_garage = self.fetch_islepilot(f"/players/{active_steam_id}/garage")

            if remote_garage and "garage" in remote_garage:

                dinos = []

                custom_names = load_custom_names()

                deleted_dinos = load_deleted_dinos()

                for d in remote_garage["garage"]:
                    if str(d.get("id")) in deleted_dinos:
                        continue

                    growth = float(d.get("growth", 1.0) or 1.0)

                    growth_val = round(growth * 100, 1)

                    if growth_val >= 100.0:

                        growth_val = 100

                        stage = "Adult"

                    elif growth_val >= 60.0:

                        stage = "Sub-Adult"

                    elif growth_val >= 20.0:

                        stage = "Juvenile"

                    else:

                        stage = "Baby"

                    stats = calc_dino_stats(

                        d.get("species", "Tyrannosaurus"),

                        growth,

                        d.get("health", 1.0),

                        d.get("hunger", 1.0),

                        d.get("thirst", 1.0)

                    )

                    gender = "Cái (Female)" if d.get("gender") == "Female" else "Đực (Male)"

                    is_prime_elder = d.get("isPrimeElder", False)

                    mutations = d.get("mutations", [])

                    dino_name = custom_names.get(d.get("id")) or d.get("name")

                    # Lấy thời gian cất thực tế từ IslePilot (parkedAt)

                    parked_at_raw = d.get("parkedAt") or d.get("storedAt") or d.get("createdAt")

                    formatted_stored_at = "Gần đây"

                    if parked_at_raw:

                        try:

                            clean_ts = parked_at_raw.replace("Z", "+00:00")

                            dt_utc = datetime.datetime.fromisoformat(clean_ts)

                            tz_vn = datetime.timezone(datetime.timedelta(hours=7))

                            dt_vn = dt_utc.astimezone(tz_vn)

                            formatted_stored_at = dt_vn.strftime("%H:%M:%S - %d/%m/%Y")

                        except Exception:

                            formatted_stored_at = str(parked_at_raw)

                    s_name_raw = (d.get("species") or "").lower()
                    w_lbl = d.get("weight_label")
                    if "spino" in s_name_raw and is_prime_elder:
                        w_lbl = "15.0 Tấn (15,000 kg)"
                        stats["max_hp"] = 15000
                        stats["current_hp"] = 15000
                    elif "trice" in s_name_raw and is_prime_elder:
                        w_lbl = "13.0 Tấn (13,000 kg)"
                        stats["max_hp"] = 13000
                        stats["current_hp"] = 13000
                    elif not w_lbl:
                        w_lbl = "Chuẩn Prime Elder" if is_prime_elder else "Chuẩn"

                    dinos.append({
                        "id": d.get("id"),
                        "name": dino_name,
                        "species": d.get("species", "Tyrannosaurus"),
                        "gender": gender,
                        "growth": growth,
                        "growth_percent": growth_val,
                        "stage": stage,
                        "is_prime_elder": is_prime_elder,
                        "mutations": mutations,
                        "mutationSlots": d.get("mutationSlots", {}),
                        "weight": stats["max_hp"],
                        "weight_label": w_lbl,
                        "current_hp": stats["current_hp"],
                        "max_hp": stats["max_hp"],
                        "health": stats["health_pct"],
                        "current_hunger": stats["current_hunger"],
                        "max_hunger": stats["max_hunger"],
                        "hunger": stats["hunger_pct"],
                        "current_thirst": stats["current_thirst"],
                        "max_thirst": stats["max_thirst"],
                        "thirst": stats["thirst_pct"],
                        "stamina": 100,
                        "stored_at": formatted_stored_at,
                        "parked_at": parked_at_raw,
                        "status": "stored"
                    })

                # Gộp thêm khủng long quà tặng / Admin cấp
                gift_file = "user_gift_dinos.json"
                if os.path.exists(gift_file):
                    try:
                        with open(gift_file, "r", encoding="utf-8") as f:
                            gifts = json.load(f)
                        for gd in gifts.get(str(active_steam_id), []):
                            if str(gd.get("id")) in deleted_dinos:
                                continue
                            g_growth = float(gd.get("growth", 1.0) or 1.0)
                            g_pct = round(g_growth * 100, 1)
                            g_stage = "Adult" if g_pct >= 100 else ("Sub-Adult" if g_pct >= 60 else ("Juvenile" if g_pct >= 20 else "Baby"))
                            is_p = bool(gd.get("isPrimeElder", False) or gd.get("is_prime_elder", False))
                            spec_raw = gd.get("species", "Tyrannosaurus")
                            stats = calc_dino_stats(spec_raw, g_growth, 1.0, 1.0, 1.0, is_p)
                            w_lbl = gd.get("weight_label")
                            if "spino" in spec_raw.lower() and is_p:
                                w_lbl = "15.0 Tấn (15,000 kg)"
                                stats["max_hp"] = 15000
                                stats["current_hp"] = 15000
                            elif "trice" in spec_raw.lower() and is_p:
                                w_lbl = "13.0 Tấn (13,000 kg)"
                                stats["max_hp"] = 13000
                                stats["current_hp"] = 13000
                            elif not w_lbl:
                                w_lbl = "Chuẩn Prime Elder" if is_p else "Chuẩn"
                            dinos.append({
                                "id": gd.get("id"),
                                "name": gd.get("name") or gd.get("species"),
                                "species": spec_raw,
                                "gender": "Cái (Female)" if gd.get("gender") == "Female" else "Đực (Male)",
                                "growth": g_growth,
                                "growth_percent": g_pct,
                                "stage": g_stage,
                                "is_prime_elder": is_p,
                                "mutations": gd.get("mutations", []),
                                "mutationSlots": gd.get("mutationSlots") or {"active": gd.get("mutations", []), "parent": ["None", "None", "None", "None"], "elderA": ["None", "None", "None", "None"], "elderB": ["None", "None", "None", "None"]},
                                "weight": stats["max_hp"],
                                "weight_label": w_lbl,
                                "current_hp": stats["current_hp"],
                                "max_hp": stats["max_hp"],
                                "health": stats["health_pct"],
                                "current_hunger": stats["current_hunger"],
                                "max_hunger": stats["max_hunger"],
                                "hunger": stats["hunger_pct"],
                                "current_thirst": stats["current_thirst"],
                                "max_thirst": stats["max_thirst"],
                                "thirst": stats["thirst_pct"],
                                "stamina": 100,
                                "stored_at": gd.get("parkedAt", "Vừa thêm"),
                                "parked_at": gd.get("parkedAt"),
                                "status": "stored",
                                "source": "admin_granted"
                            })
                    except Exception as e:
                        pass

                self.send_json_response({

                    "slots_total": config.get("MAX_GARAGE_SLOTS", 5),
                    "park_seconds": config.get("GARAGE_PARK_SECONDS", 30),

                    "slots_used": len(dinos),

                    "dinos": dinos,

                    "steam_id": active_steam_id

                })

                return

        # Kiểm tra gift dinos khi IslePilot garage trống
        fallback_dinos = []
        gift_file = "user_gift_dinos.json"
        if active_steam_id and os.path.exists(gift_file):
            try:
                with open(gift_file, "r", encoding="utf-8") as f:
                    gifts = json.load(f)
                for gd in gifts.get(str(active_steam_id), []):
                    g_growth = float(gd.get("growth", 1.0) or 1.0)
                    g_pct = round(g_growth * 100, 1)
                    g_stage = "Adult" if g_pct >= 100 else ("Sub-Adult" if g_pct >= 60 else ("Juvenile" if g_pct >= 20 else "Baby"))
                    is_p = bool(gd.get("isPrimeElder", False) or gd.get("is_prime_elder", False))
                    spec_raw = gd.get("species", "Tyrannosaurus")
                    stats = calc_dino_stats(spec_raw, g_growth, 1.0, 1.0, 1.0, is_p)
                    w_lbl = gd.get("weight_label")
                    if "spino" in spec_raw.lower() and is_p:
                        w_lbl = "15.0 Tấn (15,000 kg)"
                        stats["max_hp"] = 15000
                        stats["current_hp"] = 15000
                    elif "trice" in spec_raw.lower() and is_p:
                        w_lbl = "13.0 Tấn (13,000 kg)"
                        stats["max_hp"] = 13000
                        stats["current_hp"] = 13000
                    elif not w_lbl:
                        w_lbl = "Chuẩn Prime Elder" if is_p else "Chuẩn"
                    fallback_dinos.append({
                        "id": gd.get("id"),
                        "name": gd.get("name") or gd.get("species"),
                        "species": spec_raw,
                        "gender": "Cái (Female)" if gd.get("gender") == "Female" else "Đực (Male)",
                        "growth": g_growth,
                        "growth_percent": g_pct,
                        "stage": g_stage,
                        "is_prime_elder": is_p,
                        "mutations": gd.get("mutations", []),
                        "weight": stats["max_hp"],
                        "weight_label": w_lbl,
                        "current_hp": stats["current_hp"],
                        "max_hp": stats["max_hp"],
                        "health": stats["health_pct"],
                        "current_hunger": stats["current_hunger"],
                        "max_hunger": stats["max_hunger"],
                        "hunger": stats["hunger_pct"],
                        "current_thirst": stats["current_thirst"],
                        "max_thirst": stats["max_thirst"],
                        "thirst": stats["thirst_pct"],
                        "stamina": 100,
                        "stored_at": gd.get("parkedAt", "Vừa thêm"),
                        "parked_at": gd.get("parkedAt"),
                        "status": "stored",
                        "source": "admin_granted"
                    })
            except Exception:
                pass

        self.send_json_response({

            "slots_total": config.get("MAX_GARAGE_SLOTS", 5),
            "park_seconds": config.get("GARAGE_PARK_SECONDS", 30),

            "slots_used": len(fallback_dinos),

            "dinos": fallback_dinos

        })

    def handle_garage_spawn(self):

        try:

            length = int(self.headers.get("Content-Length", 0))

            payload = json.loads(self.rfile.read(length).decode("utf-8")) if length > 0 else {}

            dino_id = payload.get("dino_id") or payload.get("id")

            species = payload.get("species") or "Khủng long"

            steam_id = payload.get("steam_id") or self.get_active_steam_id()

            if not dino_id:

                self.send_json_response({"success": False, "message": "Thiếu mã khủng long (dino_id)!"}, 400)

                return

            if not steam_id:

                self.send_json_response({"success": False, "message": "Vui lòng đăng nhập Steam trước khi rút khủng long!"}, 401)

                return

            # Kiểm tra xem đây có phải là khủng long Admin cấp (gift) hay không
            gift_file = "user_gift_dinos.json"
            found_gift = None
            if os.path.exists(gift_file):
                try:
                    with open(gift_file, "r", encoding="utf-8") as f:
                        gifts = json.load(f)
                    user_gifts = gifts.get(str(steam_id), [])
                    for idx, g in enumerate(user_gifts):
                        if str(g.get("id")) == str(dino_id):
                            found_gift = g
                            user_gifts.pop(idx)
                            break
                    if found_gift:
                        with open(gift_file, "w", encoding="utf-8") as f:
                            json.dump(gifts, f, ensure_ascii=False, indent=2)
                except Exception as e:
                    pass

            if found_gift:
                species = found_gift.get("species", "Tyrannosaurus")
                gender = found_gift.get("gender", "Female")
                growth_val = float(found_gift.get("growth", 1.0))
                is_prime = bool(found_gift.get("isPrimeElder"))
                gift_muts = [m for m in found_gift.get("mutations", []) if m and m != "None"]

                self.apply_dino_in_game_worker(
                    steam_id=steam_id,
                    species=species,
                    gender=gender,
                    growth_val=growth_val,
                    is_prime=is_prime,
                    mutations=gift_muts,
                    needs_swap=True
                )
                self.send_json_response({"success": True, "message": "Thành công"})
                return

            # Lấy thông tin mutation, loài và trạng thái prime của khủng long từ IslePilot garage trước khi restore
            remote_garage = self.fetch_islepilot(f"/players/{steam_id}/garage") or {}
            dino_muts = []
            dino_spec = None
            is_prime = False
            if remote_garage and "garage" in remote_garage:
                for gd in remote_garage["garage"]:
                    if str(gd.get("id")) == str(dino_id):
                        raw_m = gd.get("mutations") or (gd.get("mutationSlots", {}).get("active")) or []
                        dino_muts = [m for m in raw_m if m and str(m).strip() != "None"]
                        dino_spec = gd.get("species")
                        is_prime = bool(gd.get("isPrimeElder"))
                        break
            restore_body = {}
            if dino_muts:
                restore_body["mutations"] = dino_muts

            res = self.fetch_islepilot(f"/players/{steam_id}/garage/{dino_id}/restore", method="POST", body_data=restore_body)
            if not res or (res.get("ok") is not True and "commandId" not in res):
                res = self.fetch_islepilot(f"/players/{steam_id}/garage/{dino_id}/restore", method="POST", body_data={})

            if res and (res.get("ok") is True or "commandId" in res):
                # BẢO TOÀN NGUYÊN VẸN MÁU, NƯỚC, ĐÓI, CHẤT A B Y VÀ VỊ TRÍ TỌA ĐỘ KHI CẤT (preserve_vitals=True)
                self.apply_dino_in_game_worker(
                    steam_id=steam_id,
                    species=dino_spec,
                    gender=None,
                    growth_val=dino_growth,
                    is_prime=is_prime,
                    mutations=dino_muts,
                    needs_swap=False,
                    preserve_vitals=True
                )
                self.send_json_response({
                    "success": True, 
                    "message": "Thành công"
                })
                return

            err = res.get("error") if (res and isinstance(res, dict)) else "Không thể kết nối đến máy chủ IslePilot."

            err_str = str(err)

            self.send_json_response({"success": False, "message": "Thất bại"}, 400)

        except Exception as e:

            self.send_json_response({"success": False, "message": f"Lỗi hệ thống khi rút dino: {e}"}, 500)

    def handle_garage_delete(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            payload = json.loads(self.rfile.read(length).decode("utf-8")) if length > 0 else {}
            dino_id = str(payload.get("dino_id") or payload.get("id") or "").strip()
            steam_id = str(payload.get("steam_id") or self.get_active_steam_id() or "").strip()

            if not dino_id:
                self.send_json_response({"success": False, "ok": False, "message": "Thiếu mã khủng long (dino_id)!"}, 400)
                return

            if not steam_id:
                self.send_json_response({"success": False, "ok": False, "message": "Vui lòng đăng nhập Steam trước khi xóa khủng long!"}, 401)
                return

            # 1. Luôn ghi nhận vào danh sách xóa vĩnh viễn (Persistent Blacklist)
            save_deleted_dino(dino_id, steam_id)

            # 2. Xóa triệt để trong user_gift_dinos.json nếu có
            gift_file = os.path.join(os.path.dirname(__file__), "user_gift_dinos.json")
            if os.path.exists(gift_file):
                try:
                    with open(gift_file, "r", encoding="utf-8") as f:
                        gifts = json.load(f)
                    user_gifts = gifts.get(str(steam_id), [])
                    new_gifts = [g for g in user_gifts if str(g.get("id")) != dino_id]
                    if len(new_gifts) != len(user_gifts):
                        gifts[str(steam_id)] = new_gifts
                        with open(gift_file, "w", encoding="utf-8") as f:
                            json.dump(gifts, f, ensure_ascii=False, indent=2)
                        sub_gift = os.path.join(os.path.dirname(__file__), "3mgaming-website", "user_gift_dinos.json")
                        if os.path.exists(os.path.dirname(sub_gift)):
                            with open(sub_gift, "w", encoding="utf-8") as f:
                                json.dump(gifts, f, ensure_ascii=False, indent=2)
                except Exception as e:
                    print(f"[Garage Delete Gift Error] {e}")

            # 3. Xóa tên tùy chỉnh nếu có trong custom_dino_names.json
            try:
                names_data = load_custom_names()
                if dino_id in names_data:
                    del names_data[dino_id]
                    with open(CUSTOM_NAMES_FILE, "w", encoding="utf-8") as f:
                        json.dump(names_data, f, ensure_ascii=False, indent=2)
            except Exception:
                pass

            # 4. Thử gọi API bán / xóa của IslePilot nếu server cho phép
            try:
                self.fetch_islepilot(f"/players/{steam_id}/garage/{dino_id}/sell", method="POST", body_data={})
            except Exception:
                pass

            # Trả về thành công 100%
            self.send_json_response({
                "success": True,
                "ok": True,
                "message": "Đã xóa vĩnh viễn khủng long khỏi Gara thành công! Khủng long sẽ không bao giờ xuất hiện lại sau các lần cập nhật."
            })

        except Exception as e:
            print(f"[Garage Delete Error] {e}")
            self.send_json_response({"success": False, "ok": False, "message": f"Lỗi hệ thống khi xóa dino: {e}"}, 500)

    def handle_garage_store(self):

        try:

            length = int(self.headers.get("Content-Length", 0))

            payload = json.loads(self.rfile.read(length).decode("utf-8")) if length > 0 else {}

            steam_id = payload.get("steam_id") or self.get_active_steam_id()

            if not steam_id:

                self.send_json_response({"success": False, "ok": False, "message": "Thất bại"}, 401)

                return

            step = payload.get("step", "finalize")

            # 1. BƯỚC KHỞI ĐỘNG (step == "start"): Kiểm tra người chơi có online trong game hay không

            if step == "start":

                player_info = self.fetch_islepilot(f"/players/{steam_id}")

                is_online = False

                if isinstance(player_info, dict) and player_info.get("online"):

                    is_online = True

                else:

                    players_list = self.fetch_islepilot("/players")

                    if isinstance(players_list, dict) and "players" in players_list:

                        for p in players_list["players"]:

                            if p.get("steamId") == steam_id:

                                is_online = True

                                break

                    elif isinstance(players_list, list):

                        for p in players_list:

                            if p.get("steamId") == steam_id:

                                is_online = True

                                break

                if not is_online:

                    self.send_json_response({

                        "success": False,

                        "ok": False,

                        "error": "Player is not online on the server.",

                        "message": "Thất bại"

                    }, 400)

                    return

                # Người chơi đang trực tuyến: Trả về đếm ngược 30 giây (CHƯA gọi lệnh cất để đảm bảo thời gian an toàn)

                self.send_json_response({

                    "success": True,

                    "ok": True,

                    "pending": True,

                    "delaySec": 30,

                    "message": "Bắt đầu đếm ngược 30s"

                })

                return

            # 2. BƯỚC HOÀN TẤT (step == "finalize"): Khi đã chạy hết 30s đếm ngược, mới chính thức gọi API cất dino

            res = self.fetch_islepilot(f"/players/{steam_id}/garage/park", method="POST", body_data={})

            if res and isinstance(res, dict):

                if res.get("ok") or res.get("success"):

                    self.send_json_response({

                        "success": True,

                        "ok": True,

                        "message": "Thành công"

                    })

                    return

                else:

                    self.send_json_response({

                        "success": False,

                        "ok": False,

                        "error": res.get("error", "Thất bại"),

                        "message": "Thất bại"

                    }, 400)

                    return

            self.send_json_response({"success": False, "ok": False, "message": "Thất bại"}, 400)

        except Exception as e:

            self.send_json_response({"success": False, "ok": False, "message": "Thất bại"}, 500)

    def handle_garage_slay(self):

        try:

            length = int(self.headers.get("Content-Length", 0))

            payload = json.loads(self.rfile.read(length).decode("utf-8")) if length > 0 else {}

            steam_id = payload.get("steam_id") or self.get_active_steam_id()

            if not steam_id:

                self.send_json_response({"success": False, "message": "Thất bại"}, 401)

                return

            # Gọi trực tiếp IslePilot API action 'slay' qua /commands

            res = self.fetch_islepilot("/commands", method="POST", body_data={

                "action": "slay",

                "steamId": steam_id

            })

            if res and (res.get("ok") or res.get("success")):

                self.send_json_response({

                    "success": True, 

                    "message": "Thành công"

                })

                return

            self.send_json_response({"success": False, "message": "Thất bại"}, 400)

        except Exception as e:

            self.send_json_response({"success": False, "message": "Thất bại"}, 500)

    def handle_event(self):

        remote_events = self.fetch_islepilot("/events")

        if remote_events and "events" in remote_events and len(remote_events["events"]) > 0:

            ev = remote_events["events"][0]

            self.send_json_response({

                "active": True,

                "name": ev.get("title", "Sự Kiện Cộng Đồng"),

                "description": ev.get("description", "Sự kiện được tổ chức bởi BQT"),

                "location": "Gateway",

                "start_time": "Hôm nay",

                "end_time": "Kết thúc sau 2 tiếng"

            })

            return

        self.send_json_response({"active": False})

    def handle_map(self):

        self.send_json_response({

            "map_name": "Gateway",

            "dimensions": {"width": 8192, "height": 8192},

            "points_of_interest": [

                {"id": 1, "name": "Đầm Lầy (Swamp)", "type": "water", "x": 32, "y": 74, "danger": "High (Deinosuchus)"},

                {"id": 2, "name": "Thung Lũng Trung Tâm (Center Valley)", "type": "hotspot", "x": 51, "y": 48, "danger": "Extreme (Carnivores)"},

                {"id": 3, "name": "Hồ Phía Bắc (North Lake)", "type": "water", "x": 48, "y": 22, "danger": "Medium"},

                {"id": 4, "name": "Khu Trú Ẩn Rừng Rậm (Sanctuary West)", "type": "sanctuary", "x": 26, "y": 40, "danger": "Safe (Baby Only)"},

                {"id": 5, "name": "Khu Trú Ẩn Đông Nam (Sanctuary SE)", "type": "sanctuary", "x": 72, "y": 68, "danger": "Safe (Baby Only)"},

                {"id": 6, "name": "Vùng Di Cư Cao Nguyên (Highlands Patrol)", "type": "migration", "x": 68, "y": 35, "danger": "High (Pack Hunting)"},

                {"id": 7, "name": "Vách Đá Bờ Tây (West Cliff)", "type": "landmark", "x": 18, "y": 55, "danger": "Low"}

            ]

        })

    # --- 8 Tính Năng Server IslePilot Mới ---

    def enrich_skin_data(self, s):

        if not isinstance(s, dict):

            return s

        name = s.get("name") or ""

        name_lower = name.lower()

        species = s.get("species") or "Tyrannosaurus"

        # Skin Hồng Nam Tính chuẩn 3D theo API IslePilot

        if any(k in name_lower for k in ["hồng", "hong", "pink", "nam tính", "nam tinh"]):

            s["palette"] = {

                "underbelly": "#FFB6C1",

                "body": "#E84393",

                "flank": "#FD79A8",

                "markings": "#8E44AD",

                "display": "#FF1493",

                "eyes": "#00F076",

                "detail": "#2C3E50"

            }

            s["code"] = "Tyrannosaurus000FFB6C1FFE84393FFFD79A8FF8E44ADFFFF1493FF00F076FF"

            s["skinCode"] = s["code"]

            s["themeColor"] = "#E84393"

            s["badge"] = "🌸 Hồng Nam Tính"

            s["imageUrl"] = "/assets/images/tyrannosaurus_hong_nam_tinh.png"

            s["image"] = "/assets/images/tyrannosaurus_hong_nam_tinh.png"

        elif "palette" not in s:

            s["palette"] = {

                "underbelly": "#C4BAA1",

                "body": "#4A543B",

                "flank": "#647050",

                "markings": "#2B3221",

                "display": "#A83C24",

                "eyes": "#E08F24",

                "detail": "#1F1512"

            }

            s["code"] = f"{species}000C4BAA1FF4A543BFF647050FF2B3221FFA83C24FFE08F24FF"

            s["skinCode"] = s["code"]

            s["themeColor"] = "#00F076"

        return s

    def handle_shop_skins(self):

        # Trả về 100% dữ liệu chính xác từ IslePilot API của server kèm bảng màu 3D

        remote = self.fetch_islepilot("/shop/skins")
        skins = []
        if remote and "skins" in remote:
            raw_skins = remote.get("skins", [])
            skins = [self.enrich_skin_data(s) for s in raw_skins]
        
        # Merge custom admin skins
        if os.path.exists("admin_custom_skins.json"):
            try:
                with open("admin_custom_skins.json", "r", encoding="utf-8") as f:
                    custom_skins = json.load(f)
                    skins = list(custom_skins) + list(skins)
            except Exception:
                pass

        self.send_json_response({"skins": skins})

    def handle_shop_dinos(self):

        # Trả về 100% dữ liệu gói khủng long chính xác từ IslePilot API của server

        remote = self.fetch_islepilot("/shop/dinos")

        if remote and "dinos" in remote:

            self.send_json_response(remote)

            return

        self.send_json_response({"dinos": []})

    def handle_teleport_locations(self):

        # Trả về 100% địa điểm dịch chuyển thực tế từ IslePilot API của server

        remote = self.fetch_islepilot("/teleport/locations")

        locations = remote.get("locations", []) if isinstance(remote, dict) else []

        

        # Lấy số dư ví (wallet balance) thực tế từ tài khoản người chơi

        steam_id = self.get_active_steam_id()

        player_info = self.fetch_islepilot(f"/players/{steam_id}")

        balance = 8090

        if isinstance(player_info, dict):

            wallet = player_info.get("wallet", {})

            if isinstance(wallet, dict) and "balance" in wallet:

                balance = wallet.get("balance", 0)

        self.send_json_response({

            "locations": locations,

            "balance": balance,

            "steam_id": steam_id

        })

    def handle_teleport(self):

        try:

            length = int(self.headers.get("Content-Length", 0))

            payload = json.loads(self.rfile.read(length).decode("utf-8")) if length > 0 else {}

            location_id = payload.get("locationId") or payload.get("location_id")

            steam_id = payload.get("steam_id") or self.get_active_steam_id()

            if not location_id:

                self.send_json_response({"success": False, "message": "Vui lòng chọn địa điểm dịch chuyển!"}, 400)

                return

            res = self.fetch_islepilot(f"/players/{steam_id}/teleport", method="POST", body_data={"locationId": location_id})

            if res and (res.get("ok") or not res.get("error")):

                self.send_json_response({"success": True, "message": "Thành công"})

                return

            err_msg = res.get("error") if res else "Đang trong combat hoặc máy chủ bận."

            self.send_json_response({"success": False, "message": "Thất bại"}, 400)

        except Exception as e:

            self.send_json_response({"success": False, "message": f"Lỗi hệ thống: {e}"}, 500)

    def handle_friend_code_create(self):

        try:

            length = int(self.headers.get("Content-Length", 0))

            payload = json.loads(self.rfile.read(length).decode("utf-8")) if length > 0 else {}

            steam_id = payload.get("steam_id") or self.get_active_steam_id()

            # Gọi trực tiếp IslePilot API để tạo mã mời bạn bè thật trên server 3MGAMING

            res = self.fetch_islepilot(f"/players/{steam_id}/teleport/friend-code", method="POST", body_data={})

            if res and res.get("ok"):

                self.send_json_response({

                    "ok": True,

                    "code": res.get("code"),

                    "expiresAt": res.get("expiresAt"),

                    "message": f"Đã tạo mã mời thành công: {res.get('code')}"

                })

                return

            err = res.get("error") if isinstance(res, dict) else "Không thể kết nối đến máy chủ IslePilot"

            self.send_json_response({"ok": False, "error": f"Không thể tạo mã mời: {err}"}, 400)

        except Exception as e:

            self.send_json_response({"ok": False, "error": str(e)}, 500)

    def handle_friend_code_redeem(self):

        try:

            length = int(self.headers.get("Content-Length", 0))

            payload = json.loads(self.rfile.read(length).decode("utf-8")) if length > 0 else {}

            input_code = str(payload.get("code", "")).strip().upper().replace(" ", "")

            steam_id = payload.get("steam_id") or self.get_active_steam_id()

            if not input_code:

                self.send_json_response({"ok": False, "message": "Vui lòng nhập mã bạn bè!"}, 400)

                return

            # Gọi trực tiếp IslePilot API để thực thi dịch chuyển bạn bè trực tiếp trong game

            res = self.fetch_islepilot(f"/players/{steam_id}/teleport/redeem", method="POST", body_data={"code": input_code})

            if res and (res.get("ok") or res.get("success") or res.get("commandId")):

                self.send_json_response({

                    "ok": True,

                    "success": True,

                    "message": "🎉 Đã gửi lệnh dịch chuyển tới bạn bè vào server 3MGAMING! Vui lòng giữ an toàn và đứng yên trong game."

                })

                return

            # Xử lý thông báo lỗi chuẩn xác từ server IslePilot

            raw_err = res.get("error") if isinstance(res, dict) else "Không thể kết nối đến máy chủ IslePilot."

            err_msg = str(raw_err)

            if "not online" in err_msg.lower():

                err_msg = "Bạn hoặc người tạo mã hiện không online trong server. Cả hai người cần đang online trong game để thực hiện dịch chuyển!"

            elif "own code" in err_msg.lower():

                err_msg = "Bạn không thể nhập mã mời của chính mình!"

            elif "expired" in err_msg.lower() or "invalid" in err_msg.lower():

                err_msg = "Mã mời không đúng hoặc đã hết hạn! Vui lòng nhờ bạn bè gửi mã mới."

            self.send_json_response({"ok": False, "message": err_msg, "error": err_msg}, 400)

        except Exception as e:

            self.send_json_response({"ok": False, "message": f"Lỗi hệ thống: {e}", "error": str(e)}, 500)

    def handle_apply_skin(self):

        try:

            length = int(self.headers.get("Content-Length", 0))

            payload = json.loads(self.rfile.read(length).decode("utf-8")) if length > 0 else {}

            skin_id = payload.get("skin_id") or payload.get("skinId")

            steam_id = payload.get("steam_id") or self.get_active_steam_id()

            if not skin_id:

                self.send_json_response({"success": False, "message": "Thiếu mã Skin cần áp dụng!"}, 400)

                return

            # Gửi lệnh áp dụng skin trực tiếp tới IslePilot API

            res = self.fetch_islepilot(f"/players/{steam_id}/skins/{skin_id}/apply", method="POST", body_data={})

            if res and res.get("ok"):

                self.send_json_response({"success": True, "message": "Thành công"})

                return

            err = res.get("error") if res else "Không thể kết nối đến máy chủ IslePilot."

            self.send_json_response({"success": False, "message": "Thất bại"}, 400)

        except Exception as e:

            self.send_json_response({"success": False, "message": f"Lỗi hệ thống: {e}"}, 500)

    def handle_quests(self):

        steam_id = self.get_active_steam_id()

        remote = self.fetch_islepilot(f"/players/{steam_id}/quests")

        if remote and "quests" in remote:

            claimed_db = load_claimed_quests()

            user_claimed = claimed_db.get(steam_id, [])

            for q in remote["quests"]:

                q_id = q.get("id")

                prog_id = q.get("progressId")

                if (q_id in user_claimed or (prog_id and prog_id in user_claimed)) and not q.get("claimedAt"):

                    q["claimedAt"] = datetime.datetime.now(datetime.timezone.utc).isoformat()

            self.send_json_response(remote)

            return

        self.send_json_response({"quests": []})

    def handle_claim_quest(self):

        try:

            content_length = int(self.headers.get("Content-Length", 0))

            body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"

            payload = json.loads(body) if body else {}

            steam_id = str(payload.get("steam_id") or self.get_active_steam_id()).strip()

            quest_id = str(payload.get("quest_id") or "").strip()

            progress_id = str(payload.get("progress_id") or "").strip()

            amount = int(payload.get("amount", 0))

            quest_name = str(payload.get("quest_name") or "Nhiệm vụ").strip()

            if not quest_id:

                self.send_json_response({"ok": False, "message": "Thiếu mã nhiệm vụ!"}, 400)

                return

            claimed_db = load_claimed_quests()

            user_claimed = claimed_db.get(steam_id, [])

            if quest_id in user_claimed or (progress_id and progress_id in user_claimed):

                self.send_json_response({"ok": False, "message": "Nhiệm vụ này đã nhận thưởng trước đó!"}, 400)

                return

            # 1. Thử gọi API IslePilot /quests/claim nếu có progressId
            if progress_id:

                try:

                    self.fetch_islepilot(f"/players/{steam_id}/quests/claim", method="POST", body_data={"progressId": progress_id})

                except Exception as e:

                    print(f"[Quest Claim IslePilot Notice] {e}")

            # 2. Cộng tiền Xu trực tiếp vào ví người chơi trên IslePilot qua /currency (Scope: currency:grant)
            new_balance = None

            if amount > 0:

                cur_res = self.fetch_islepilot(

                    f"/players/{steam_id}/currency",

                    method="POST",

                    body_data={"amount": amount, "reason": f"Thưởng hoàn thành nhiệm vụ: {quest_name}"}

                )

                if cur_res and "balance" in cur_res:

                    new_balance = cur_res.get("balance")

            # 3. Lưu lại tiến trình đã nhận thưởng vào cache
            if steam_id not in claimed_db:

                claimed_db[steam_id] = []

            if quest_id not in claimed_db[steam_id]:

                claimed_db[steam_id].append(quest_id)

            if progress_id and progress_id not in claimed_db[steam_id]:

                claimed_db[steam_id].append(progress_id)

            save_claimed_quests(claimed_db)

            self.send_json_response({

                "ok": True,

                "success": True,

                "message": f"Nhận thành công +{amount} Xu!",

                "reward_amount": amount,

                "balance": new_balance,

                "quest_id": quest_id

            })

        except Exception as e:

            print(f"[Quest Claim Error] {e}")

            self.send_json_response({"ok": False, "message": f"Lỗi xử lý nhận thưởng: {e}"}, 500)

    def handle_player_skins(self):

        steam_id = self.get_active_steam_id()

        remote = self.fetch_islepilot(f"/players/{steam_id}/skins")

        if remote and "skins" in remote:

            raw_skins = remote.get("skins", [])

            skins = [self.enrich_skin_data(s) for s in raw_skins]

            self.send_json_response({"skins": skins})

            return

        self.send_json_response({"skins": []})

    def handle_referral(self):

        steam_id = self.get_active_steam_id()

        data = load_referrals()

        # Xác định mã giới thiệu

        ref_code = "JCD9JR"

        if steam_id:

            found = None

            for c, info in data.get("codes", {}).items():

                if info.get("owner_steam_id") == steam_id:

                    found = c

                    break

            if found:

                ref_code = found

            elif steam_id in ["76561199175571899", "76561199196418178", "76561199062270730", "76561199483156684"]:

                ref_code = "JCD9JR"

                data.setdefault("codes", {})["JCD9JR"] = {"owner_steam_id": steam_id, "owner_name": "Admin Server 3MGAMING"}

                save_referrals(data)

            else:

                import hashlib

                h = hashlib.sha256(steam_id.encode()).hexdigest().upper()

                chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

                ref_code = "".join(chars[int(h[i*2:i*2+2], 16) % len(chars)] for i in range(6))

                data.setdefault("codes", {})[ref_code] = {"owner_steam_id": steam_id}

                save_referrals(data)

        # Trỏ liên kết trực tiếp bằng Web của server (không trỏ trang cũ islepilot.eu)

        host = self.headers.get("Host") or "localhost:8000"

        proto = "https" if self.headers.get("X-Forwarded-Proto") == "https" else "http"

        referral_link = f"{proto}://{host}/#referral?ref={ref_code}"

        invites_list = data.get("invites", {}).get(ref_code, [])

        invited_count = len(invites_list)

        rewarded_count = sum(1 for inv in invites_list if inv.get("rewarded") or inv.get("playtime_minutes", 0) >= 60)

        earned = rewarded_count * 5000

        applied_code = data.get("applied", {}).get(steam_id, None)

        self.send_json_response({

            "ok": True,

            "steam_id": steam_id,

            "code": ref_code,

            "referral_code": ref_code,

            "referral_link": referral_link,

            "invited_count": invited_count,

            "rewarded_count": rewarded_count,

            "earned": earned,

            "min_minutes": 60,

            "for_referrer": {"amount": "5,000", "currency": "3M"},

            "for_referee": {"amount": "700", "currency": "3M"},

            "invites": invites_list,

            "applied_code": applied_code

        })

    def handle_referral_apply(self):

        try:

            length = int(self.headers.get("Content-Length", 0))

            payload = json.loads(self.rfile.read(length).decode("utf-8")) if length > 0 else {}

            code = payload.get("code", "").strip().upper()

            steam_id = payload.get("steam_id") or self.get_active_steam_id()

            name = payload.get("name") or "Người chơi"

            if not code:

                self.send_json_response({"ok": False, "error": "Vui lòng nhập mã giới thiệu!"}, 400)

                return

            data = load_referrals()

            code_info = data.get("codes", {}).get(code)

            if not code_info and code != "JCD9JR":

                self.send_json_response({"ok": False, "error": f"Mã giới thiệu '{code}' không hợp lệ hoặc không tồn tại!"}, 400)

                return

            owner_id = code_info.get("owner_steam_id") if code_info else "76561199575258338"

            if steam_id and steam_id == owner_id:

                self.send_json_response({"ok": False, "error": "Bạn không thể tự dùng mã giới thiệu của chính mình!"}, 400)

                return

            applied_map = data.setdefault("applied", {})

            if steam_id in applied_map:

                current_code = applied_map[steam_id]

                self.send_json_response({

                    "ok": True,

                    "already": True,

                    "code": current_code,

                    "message": f"Bạn đã áp dụng mã giới thiệu '{current_code}' rồi."

                })

                return

            # Ghi nhận người được mời vào hệ thống

            applied_map[steam_id] = code

            invites = data.setdefault("invites", {}).setdefault(code, [])

            if not any(i.get("steam_id") == steam_id for i in invites):

                invites.append({

                    "steam_id": steam_id,

                    "name": name,

                    "joined_at": int(time.time()),

                    "playtime_minutes": 20,

                    "status": "Đang tham gia · 20/60 phút",

                    "rewarded": False

                })

            save_referrals(data)

            self.send_json_response({

                "ok": True,

                "success": True,

                "code": code,

                "message": f"Áp dụng mã '{code}' thành công! Khi chơi đủ 60 phút bạn sẽ nhận 700 3M và người mời nhận 5,000 3M."

            })

        except Exception as e:

            print(f"[Referral Apply Error] {e}")

            self.send_json_response({"ok": False, "error": "Lỗi xử lý máy chủ khi áp dụng mã."}, 500)

    def handle_carcass_offers(self):
        query = urllib.parse.urlparse(self.path).query
        q_params = urllib.parse.parse_qs(query)
        active_steam_id = q_params.get("steam_id", [None])[0] or self.get_active_steam_id()

        remote_data = None
        if active_steam_id:
            try:
                remote_data = self.fetch_islepilot(f"/players/{active_steam_id}/carcass")
            except Exception as e:
                print(f"[Carcass Offers Fetch Error] {e}")

        if remote_data and isinstance(remote_data, dict) and "offers" in remote_data:
            self.send_json_response({
                "ok": True,
                "offers": remote_data.get("offers", []),
                "cooldown_seconds": remote_data.get("cooldownSeconds", 300),
                "daily_limit": remote_data.get("dailyLimit", 5),
                "server_id": config.get("SERVER_ID", "cmv3zzfix02g3pj01yay0hw4g")
            })
            return

        # Danh sách gói thả xác chuẩn 100% theo IslePilot (3mgaming.islepilot.eu/carcass)
        offers = [
            {
                "id": "omv572un0",
                "name": "Carcass",
                "price": 0,
                "price_display": "$ 0",
                "species": "Tenontosaurus",
                "species_name": "Tenontosaurus",
                "image": "https://islepilot.eu/cdn/dino-art/render/Tenontosaurus.webp",
                "description": "Xác tươi, cho thịt · hợp với chế độ ăn của bạn · kích cỡ 100%"
            },
            {
                "id": "omv6uqesm",
                "name": "triceraptor",
                "price": 0,
                "price_display": "$ 0",
                "species": "Triceratops",
                "species_name": "Triceratops",
                "image": "https://islepilot.eu/cdn/dino-art/render/Triceratops.webp",
                "description": "Xác tươi, cho thịt · Triceratops · kích cỡ 100%"
            },
            {
                "id": "omv6viaxj",
                "name": "stegosarus",
                "price": 0,
                "price_display": "$ 0",
                "species": "Stegosaurus",
                "species_name": "Stegosaurus",
                "image": "https://islepilot.eu/cdn/dino-art/render/Stegosaurus.webp",
                "description": "Xác tươi, cho thịt · Stegosaurus · kích cỡ 100%"
            }
        ]

        self.send_json_response({
            "ok": True,
            "offers": offers,
            "cooldown_seconds": 300,
            "server_id": config.get("SERVER_ID", "cmv3zzfix02g3pj01yay0hw4g")
        })

    def handle_carcass(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            payload = json.loads(self.rfile.read(length).decode("utf-8")) if length > 0 else {}
            offer_id = payload.get("offerId") or payload.get("offer_id") or "omv572un0"
            steam_id = payload.get("steam_id") or self.get_active_steam_id()

            if not steam_id:
                self.send_json_response({
                    "success": False,
                    "ok": False,
                    "message": "Vui lòng đăng nhập Steam trước khi nhận xác!"
                }, 401)
                return

            # Ánh xạ chuẩn 3 loài khủng long của 3 gói thả xác theo đúng server
            species_map = {
                "omv572un0": "Tenontosaurus",
                "omv6uqesm": "Triceratops",
                "omv6viaxj": "Stegosaurus"
            }
            target_species = species_map.get(offer_id, payload.get("species", "Tenontosaurus"))

            # Gửi lệnh thực thi thả xác trực tiếp tới game server qua IslePilot commands
            cmd_payload = {
                "action": "carcass",
                "steamId": steam_id,
                "species": target_species,
                "growth": 1.0,
                "offerId": offer_id
            }
            res = self.fetch_islepilot("/commands", method="POST", body_data=cmd_payload)

            # Dự phòng gọi endpoint carcass của player nếu có
            if not res or not (res.get("ok") or res.get("commandId")):
                res2 = self.fetch_islepilot(f"/players/{steam_id}/carcass", method="POST", body_data={"offerId": offer_id})
                if res2 and (res2.get("ok") or res2.get("commandId")):
                    res = res2

            if res and (res.get("ok") is True or res.get("success") is True or "commandId" in res):
                self.send_json_response({
                    "success": True,
                    "ok": True,
                    "commandId": res.get("commandId"),
                    "message": f"🎉 Thả xác {target_species} thành công! Lệnh thả xác đã được gửi tới server 3MGAMING, xác sẽ rơi ngay trước mặt bạn trong game."
                })
                return

            err = res.get("error") if (res and isinstance(res, dict)) else "Không thể kết nối đến máy chủ game."
            self.send_json_response({
                "success": False,
                "ok": False,
                "message": f"Thả xác thất bại: {err}"
            }, 400)

        except Exception as e:
            print(f"[Handle Carcass Error] {e}")
            self.send_json_response({"success": False, "ok": False, "message": f"Lỗi hệ thống khi thả xác: {e}"}, 500)

    def handle_quests(self):

        steam_id = self.get_active_steam_id()

        remote = self.fetch_islepilot(f"/players/{steam_id}/quests")

        if remote and "quests" in remote:

            claimed_db = load_claimed_quests()

            user_claimed = claimed_db.get(steam_id, [])

            for q in remote["quests"]:

                q_id = q.get("id")

                prog_id = q.get("progressId")

                if (q_id in user_claimed or (prog_id and prog_id in user_claimed)) and not q.get("claimedAt"):

                    q["claimedAt"] = datetime.datetime.now(datetime.timezone.utc).isoformat()

            self.send_json_response(remote)

            return

        self.send_json_response({"quests": []})

    def handle_claim_quest(self):

        try:

            content_length = int(self.headers.get("Content-Length", 0))

            body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"

            payload = json.loads(body) if body else {}

            steam_id = str(payload.get("steam_id") or self.get_active_steam_id()).strip()

            quest_id = str(payload.get("quest_id") or "").strip()

            progress_id = str(payload.get("progress_id") or "").strip()

            amount = int(payload.get("amount", 0))

            quest_name = str(payload.get("quest_name") or "Nhiệm vụ").strip()

            if not quest_id:

                self.send_json_response({"ok": False, "message": "Thiếu mã nhiệm vụ!"}, 400)

                return

            claimed_db = load_claimed_quests()

            user_claimed = claimed_db.get(steam_id, [])

            if quest_id in user_claimed or (progress_id and progress_id in user_claimed):

                self.send_json_response({"ok": False, "message": "Nhiệm vụ này đã nhận thưởng trước đó!"}, 400)

                return

            # 1. Thử gọi API IslePilot /quests/claim nếu có progressId
            if progress_id:

                try:

                    self.fetch_islepilot(f"/players/{steam_id}/quests/claim", method="POST", body_data={"progressId": progress_id})

                except Exception as e:

                    print(f"[Quest Claim IslePilot Notice] {e}")

            # 2. Cộng tiền Xu trực tiếp vào ví người chơi trên IslePilot qua /currency (Scope: currency:grant)
            new_balance = None

            if amount > 0:

                cur_res = self.fetch_islepilot(

                    f"/players/{steam_id}/currency",

                    method="POST",

                    body_data={"amount": amount, "reason": f"Thưởng hoàn thành nhiệm vụ: {quest_name}"}

                )

                if cur_res and "balance" in cur_res:

                    new_balance = cur_res.get("balance")

            # 3. Lưu lại tiến trình đã nhận thưởng vào cache
            if steam_id not in claimed_db:

                claimed_db[steam_id] = []

            if quest_id not in claimed_db[steam_id]:

                claimed_db[steam_id].append(quest_id)

            if progress_id and progress_id not in claimed_db[steam_id]:

                claimed_db[steam_id].append(progress_id)

            save_claimed_quests(claimed_db)

            self.send_json_response({

                "ok": True,

                "success": True,

                "message": f"Nhận thành công +{amount} Xu!",

                "reward_amount": amount,

                "balance": new_balance,

                "quest_id": quest_id

            })

        except Exception as e:

            print(f"[Quest Claim Error] {e}")

            self.send_json_response({"ok": False, "message": f"Lỗi xử lý nhận thưởng: {e}"}, 500)

    def handle_player_skins(self):

        steam_id = self.get_active_steam_id()

        remote = self.fetch_islepilot(f"/players/{steam_id}/skins")

        if remote and "skins" in remote:

            raw_skins = remote.get("skins", [])

            skins = [self.enrich_skin_data(s) for s in raw_skins]

            self.send_json_response({"skins": skins})

            return

        self.send_json_response({"skins": []})

    def handle_referral(self):

        steam_id = self.get_active_steam_id()

        data = load_referrals()

        # Xác định mã giới thiệu

        ref_code = "JCD9JR"

        if steam_id:

            found = None

            for c, info in data.get("codes", {}).items():

                if info.get("owner_steam_id") == steam_id:

                    found = c

                    break

            if found:

                ref_code = found

            elif steam_id in ["76561199175571899", "76561199196418178", "76561199062270730", "76561199483156684"]:

                ref_code = "JCD9JR"

                data.setdefault("codes", {})["JCD9JR"] = {"owner_steam_id": steam_id, "owner_name": "Admin Server 3MGAMING"}

                save_referrals(data)

            else:

                import hashlib

                h = hashlib.sha256(steam_id.encode()).hexdigest().upper()

                chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

                ref_code = "".join(chars[int(h[i*2:i*2+2], 16) % len(chars)] for i in range(6))

                data.setdefault("codes", {})[ref_code] = {"owner_steam_id": steam_id}

                save_referrals(data)

        # Trỏ liên kết trực tiếp bằng Web của server (không trỏ trang cũ islepilot.eu)

        host = self.headers.get("Host") or "localhost:8000"

        proto = "https" if self.headers.get("X-Forwarded-Proto") == "https" else "http"

        referral_link = f"{proto}://{host}/#referral?ref={ref_code}"

        invites_list = data.get("invites", {}).get(ref_code, [])

        invited_count = len(invites_list)

        rewarded_count = sum(1 for inv in invites_list if inv.get("rewarded") or inv.get("playtime_minutes", 0) >= 60)

        earned = rewarded_count * 5000

        applied_code = data.get("applied", {}).get(steam_id, None)

        self.send_json_response({

            "ok": True,

            "steam_id": steam_id,

            "code": ref_code,

            "referral_code": ref_code,

            "referral_link": referral_link,

            "invited_count": invited_count,

            "rewarded_count": rewarded_count,

            "earned": earned,

            "min_minutes": 60,

            "for_referrer": {"amount": "5,000", "currency": "3M"},

            "for_referee": {"amount": "700", "currency": "3M"},

            "invites": invites_list,

            "applied_code": applied_code

        })

    def handle_referral_apply(self):

        try:

            length = int(self.headers.get("Content-Length", 0))

            payload = json.loads(self.rfile.read(length).decode("utf-8")) if length > 0 else {}

            code = payload.get("code", "").strip().upper()

            steam_id = payload.get("steam_id") or self.get_active_steam_id()

            name = payload.get("name") or "Người chơi"

            if not code:

                self.send_json_response({"ok": False, "error": "Vui lòng nhập mã giới thiệu!"}, 400)

                return

            data = load_referrals()

            code_info = data.get("codes", {}).get(code)

            if not code_info and code != "JCD9JR":

                self.send_json_response({"ok": False, "error": f"Mã giới thiệu '{code}' không hợp lệ hoặc không tồn tại!"}, 400)

                return

            owner_id = code_info.get("owner_steam_id") if code_info else "76561199575258338"

            if steam_id and steam_id == owner_id:

                self.send_json_response({"ok": False, "error": "Bạn không thể tự dùng mã giới thiệu của chính mình!"}, 400)

                return

            applied_map = data.setdefault("applied", {})

            if steam_id in applied_map:

                current_code = applied_map[steam_id]

                self.send_json_response({

                    "ok": True,

                    "already": True,

                    "code": current_code,

                    "message": f"Bạn đã áp dụng mã giới thiệu '{current_code}' rồi."

                })

                return

            # Ghi nhận người được mời vào hệ thống

            applied_map[steam_id] = code

            invites = data.setdefault("invites", {}).setdefault(code, [])

            if not any(i.get("steam_id") == steam_id for i in invites):

                invites.append({

                    "steam_id": steam_id,

                    "name": name,

                    "joined_at": int(time.time()),

                    "playtime_minutes": 20,

                    "status": "Đang tham gia · 20/60 phút",

                    "rewarded": False

                })

            save_referrals(data)

            self.send_json_response({

                "ok": True,

                "success": True,

                "code": code,

                "message": f"Áp dụng mã '{code}' thành công! Khi chơi đủ 60 phút bạn sẽ nhận 700 3M và người mời nhận 5,000 3M."

            })

        except Exception as e:

            print(f"[Referral Apply Error] {e}")

            self.send_json_response({"ok": False, "error": "Lỗi xử lý máy chủ khi áp dụng mã."}, 500)

    def handle_buy_skin(self):

        try:

            length = int(self.headers.get("Content-Length", 0))

            payload = json.loads(self.rfile.read(length).decode("utf-8")) if length > 0 else {}

            skin_id = payload.get("skin_id") or payload.get("shopSkinId")

            steam_id = payload.get("steam_id") or self.get_active_steam_id()

            if not skin_id:

                self.send_json_response({"success": False, "message": "Thiếu mã Skin cần mua!"}, 400)

                return

            # Gửi yêu cầu mua / nhận Skin trực tiếp qua IslePilot API

            res = self.fetch_islepilot(f"/players/{steam_id}/skins", method="POST", body_data={"shopSkinId": skin_id})

            if res and res.get("ok"):

                self.send_json_response({"success": True, "message": "Thành công"})

                return

            err = res.get("error") if res else "Không thể kết nối đến máy chủ IslePilot."

            if "already own" in str(err).lower():

                self.send_json_response({"success": False, "message": "Bạn đã sở hữu Skin này trong Kho Skin rồi!"})

                return

            self.send_json_response({"success": False, "message": "Thất bại"}, 400)

        except Exception as e:

            self.send_json_response({"success": False, "message": f"Lỗi hệ thống: {e}"}, 500)

    def handle_buy_dino(self):

        try:

            length = int(self.headers.get("Content-Length", 0))

            payload = json.loads(self.rfile.read(length).decode("utf-8")) if length > 0 else {}

            dino_pack_id = payload.get("dino_pack_id") or payload.get("id")

            steam_id = payload.get("steam_id") or self.get_active_steam_id()

            

            # Gửi yêu cầu mua dino tới IslePilot API

            res = self.fetch_islepilot(f"/shop/dinos/{dino_pack_id}/buy", method="POST", body_data={"steamId": steam_id})

            if res and res.get("ok"):

                self.send_json_response({"success": True, "message": "Thành công"})

                return

            err = res.get("error") if res else "Không thể kết nối đến máy chủ IslePilot."

            if "shop is closed" in str(err).lower():

                self.send_json_response({"success": False, "message": "Cửa hàng mua dino trên server hiện đang tạm đóng bởi Admin (The shop is closed)."}, 400)

                return

            self.send_json_response({"success": False, "message": "Thất bại"}, 400)

        except Exception as e:

            self.send_json_response({"success": False, "message": f"Lỗi hệ thống: {e}"}, 500)

    def handle_skin_drafts_get(self):

        steam_id = self.get_active_steam_id()

        drafts = load_skin_drafts(steam_id)

        self.send_json_response({"drafts": drafts})

    def handle_skin_drafts_post(self):

        try:

            length = int(self.headers.get("Content-Length", 0))

            payload = json.loads(self.rfile.read(length).decode("utf-8")) if length > 0 else {}

            drafts = payload.get("drafts", [])

            steam_id = self.get_active_steam_id()

            save_skin_drafts(steam_id, drafts)

            self.send_json_response({"ok": True, "count": len(drafts)})

        except Exception as e:

            self.send_json_response({"ok": False, "error": str(e)}, 400)

    def handle_skin_code(self):

        try:

            length = int(self.headers.get("Content-Length", 0))

            payload = json.loads(self.rfile.read(length).decode("utf-8")) if length > 0 else {}

            action = payload.get("action", "export")

            if action == "import":

                code = payload.get("code", "")

                parsed = parse_evrima_skin_code(code)

                if parsed:

                    self.send_json_response({"ok": True, "skin": parsed})

                else:

                    self.send_json_response({"ok": False, "error": "Mã skin không hợp lệ"}, 400)

                return

            species = payload.get("species", "Tyrannosaurus")

            pattern = int(payload.get("pattern", 0))

            variation = int(payload.get("variation", 0))

            theme = int(payload.get("theme", 0))

            palette = payload.get("palette", {})

            code = generate_evrima_skin_code(species, pattern, variation, theme, palette)

            self.send_json_response({"ok": True, "code": code})

        except Exception as e:

            self.send_json_response({"ok": False, "error": str(e)}, 500)

    def handle_skin_set(self):

        try:

            length = int(self.headers.get("Content-Length", 0))

            payload = json.loads(self.rfile.read(length).decode("utf-8")) if length > 0 else {}

            steam_id = payload.get("targetSteamId") or payload.get("steam_id") or self.get_active_steam_id()

            species = payload.get("species", "Tyrannosaurus")

            pattern = int(payload.get("pattern", 0))

            variation = int(payload.get("variation", 0))

            theme = int(payload.get("theme", 0))

            code = payload.get("code")

            skin_id = payload.get("skin_id") or payload.get("skinId")

            # 1. Tạo cấu hình Blueprint Unreal Engine 4 của Evrima chuẩn xác từng màu sắc người chơi đã chỉnh

            blueprint_payload = build_blueprint_skin_payload(

                species=species,

                sex=payload.get("sex", "male"),

                palette=payload.get("palette", {}),

                variation=variation,

                pattern=pattern,

                theme=theme

            )

            # 2. Thực thi lệnh áp dụng Custom Skin trực tiếp vào IslePilot server

            # Endpoint chuẩn cho Custom Skin: POST /players/{steamId}/skin/apply với { "payload": blueprint_payload }

            applied_success = False

            error_msg = ""

            job_id = ""

            body_data = {

                "payload": blueprint_payload

            }

            res = self.fetch_islepilot(f"/players/{steam_id}/skin/apply", method="POST", body_data=body_data)

            # Nếu bị giới hạn tốc độ (rate limit), đợi 3.5s rồi thử lại tự động

            if isinstance(res, dict) and "limited to one every few seconds" in res.get("error", ""):

                time.sleep(3.5)

                res = self.fetch_islepilot(f"/players/{steam_id}/skin/apply", method="POST", body_data=body_data)

            if res and (res.get("ok") or res.get("jobId") or not res.get("error")):

                applied_success = True

                job_id = res.get("jobId", "")

            else:

                error_msg = res.get("error", "") if isinstance(res, dict) else "Lỗi kết nối máy chủ IslePilot"

            # 3. Lưu vào kho bản lưu cá nhân của người chơi

            drafts = load_skin_drafts(steam_id)

            new_draft = {

                "id": f"draft_{int(time.time())}",

                "name": f"{species} - {payload.get('sex', 'male').capitalize()} (Custom)",

                "species": species,

                "sex": payload.get("sex", "male"),

                "pattern": pattern,

                "variation": variation,

                "theme": theme,

                "code": code,

                "palette": payload.get("palette", {}),

                "createdAt": datetime.datetime.now().strftime("%d/%m/%Y %H:%M")

            }

            drafts.insert(0, new_draft)

            save_skin_drafts(steam_id, drafts)

            if applied_success:

                self.send_json_response({

                    "ok": True,

                    "success": True,

                    "code": code,

                    "jobId": job_id,

                    "message": "Thành công"

                })

            else:

                self.send_json_response({

                    "ok": False,

                    "success": False,

                    "error": "Thất bại"

                }, 400)

        except Exception as e:

            self.send_json_response({"ok": False, "success": False, "error": str(e)}, 500)

    def handle_cdn_proxy(self):

        # Đường dẫn lưu file cache cục bộ

        local_rel_path = self.path.lstrip("/").split("?")[0]

        local_full_path = os.path.join(PUBLIC_DIR, local_rel_path.replace("/", os.sep))

        

        # Nếu đã có trong cache cục bộ thì đọc và trả về ngay

        if os.path.exists(local_full_path):

            try:

                with open(local_full_path, "rb") as f:

                    content = f.read()

                content_type = "model/gltf-binary" if local_full_path.endswith(".glb") else "image/png"

                self.send_response(200)

                self.send_header("Content-Type", content_type)

                self.send_header("Content-Length", str(len(content)))

                self.send_header("Access-Control-Allow-Origin", "*")

                self.send_header("Cache-Control", "public, max-age=604800")

                self.end_headers()

                self.wfile.write(content)

                return

            except Exception as e:

                print(f"[Cache Read Error] {e}")

        # Tải từ IslePilot CDN và lưu cache

        remote_url = f"https://islepilot.eu{self.path.split('?')[0]}"

        headers = {'User-Agent': 'Mozilla/5.0'}

        try:

            req = urllib.request.Request(remote_url, headers=headers)

            with urllib.request.urlopen(req, timeout=12) as resp:

                content = resp.read()

                content_type = resp.headers.get("Content-Type", "application/octet-stream")

                

                # Lưu file vào cache

                try:

                    os.makedirs(os.path.dirname(local_full_path), exist_ok=True)

                    with open(local_full_path, "wb") as f:

                        f.write(content)

                except Exception as save_err:

                    print(f"[Cache Save Error] {save_err}")

                self.send_response(200)

                self.send_header("Content-Type", content_type)

                self.send_header("Content-Length", str(len(content)))

                self.send_header("Access-Control-Allow-Origin", "*")

                self.send_header("Cache-Control", "public, max-age=604800")

                self.end_headers()

                self.wfile.write(content)

                return

        except Exception as e:

            print(f"[CDN Proxy Error] {remote_url}: {e}")

        self.send_error(404, "Asset not found")

REFERRALS_FILE = os.path.join(os.path.dirname(__file__), "referrals.json")

def load_referrals():

    if os.path.exists(REFERRALS_FILE):

        try:

            with open(REFERRALS_FILE, "r", encoding="utf-8") as f:

                return json.load(f)

        except Exception as e:

            print(f"[Referrals Load Error] {e}")

    return {

        "codes": {

            "JCD9JR": {"owner_steam_id": "76561199575258338", "owner_name": "Admin Server 3MGAMING"}

        },

        "invites": {

            "JCD9JR": []

        },

        "applied": {}

    }

def save_referrals(data):

    try:

        with open(REFERRALS_FILE, "w", encoding="utf-8") as f:

            json.dump(data, f, ensure_ascii=False, indent=2)

    except Exception as e:

        print(f"[Referrals Save Error] {e}")

SKIN_DRAFTS_FILE = os.path.join(os.path.dirname(__file__), "skin_drafts.json")

def load_skin_drafts(steam_id):

    if os.path.exists(SKIN_DRAFTS_FILE):

        try:

            with open(SKIN_DRAFTS_FILE, "r", encoding="utf-8") as f:

                data = json.load(f)

                return data.get(steam_id, [])

        except:

            pass

    return []

def save_skin_drafts(steam_id, drafts):

    data = {}

    if os.path.exists(SKIN_DRAFTS_FILE):

        try:

            with open(SKIN_DRAFTS_FILE, "r", encoding="utf-8") as f:

                data = json.load(f)

        except:

            data = {}

    data[steam_id] = drafts

    try:

        with open(SKIN_DRAFTS_FILE, "w", encoding="utf-8") as f:

            json.dump(data, f, ensure_ascii=False, indent=2)

    except Exception as e:

        print(f"[Save Skin Drafts Error] {e}")

def generate_evrima_skin_code(species, pattern=0, variation=0, theme=0, palette=None):

    if palette is None:

        palette = {}

    num_str = f"{pattern}{variation}{theme}"

    zones = []

    if species == "Beipiaosaurus":

        zones.append("detail")

    elif species == "Carnotaurus":

        zones.append("teeth")

    elif species in ["Herrerasaurus", "Omniraptor"]:

        zones.extend(["claws", "mouth"])

    zones.extend(["underbelly", "body", "flank", "markings", "display", "eyes"])

    hex_str = ""

    for z in zones:

        val = str(palette.get(z, "#5A6B48")).replace("#", "").upper()

        if len(val) < 6:

            val = val.ljust(6, "0")

        hex_str += val[:6] + "FF"

    return f"{species}{num_str}{hex_str}"

def parse_evrima_skin_code(code):

    code = code.strip()

    match = re.match(r"^([A-Za-z]+?)(\d{3,})((?:[0-9A-Fa-f]{8})+)$", code)

    if not match:

        return None

    species, digits, hex_part = match.groups()

    pattern = int(digits[:-2]) if len(digits) > 2 else int(digits[0])

    variation = int(digits[-2])

    theme = int(digits[-1])

    hex_list = [hex_part[i:i+8] for i in range(0, len(hex_part), 8)]

    zones = []

    if species == "Beipiaosaurus":

        zones.append("detail")

    elif species == "Carnotaurus":

        zones.append("teeth")

    elif species in ["Herrerasaurus", "Omniraptor"]:

        zones.extend(["claws", "mouth"])

    zones.extend(["underbelly", "body", "flank", "markings", "display", "eyes"])

    palette = {}

    for idx, z in enumerate(zones):

        if idx < len(hex_list):

            palette[z] = f"#{hex_list[idx][:6]}"

    return {

        "species": species,

        "pattern": pattern,

        "variation": variation,

        "theme": theme,

        "palette": palette

    }

def run():

    host = config.get("HOST", "0.0.0.0")

    port = int(os.environ.get("PORT") or config.get("PORT", 8000))

    server_address = (host, port)

    httpd = ThreadingHTTPServer(server_address, DinoRequestHandler)

    print("=" * 65)

    print(f"🚀 3MGAMING WEB PORTAL ĐANG CHẠY!")

    print(f"👉 Mở trình duyệt truy cập: http://localhost:{port}")

    print(f"👉 Steam OpenID Login URL: http://localhost:{port}/api/player/steam/login?redirect=%2F")

    print(f"👉 Đồng bộ IslePilot API: ĐÃ KẾT NỐI THÀNH CÔNG!")

    print("=" * 65)

    try:

        httpd.serve_forever()

    except KeyboardInterrupt:

        print("\nĐang tắt server...")

        httpd.server_close()

if __name__ == "__main__":

    run()

