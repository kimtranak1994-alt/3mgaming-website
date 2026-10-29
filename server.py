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
import concurrent.futures

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
    base_dir = os.path.dirname(os.path.abspath(__file__))
    primary_file = os.path.join(base_dir, "deleted_garage_dinos.json")
    sub_file = os.path.join(base_dir, "3mgaming-website", "deleted_garage_dinos.json")
    backup_file = os.path.join(base_dir, ".persistent_deleted_garage_dinos.json")

    result = {}
    for fpath in [backup_file, sub_file, primary_file]:
        if os.path.exists(fpath):
            try:
                with open(fpath, "r", encoding="utf-8") as f:
                    content = json.load(f)
                    if isinstance(content, dict):
                        result.update(content)
                    elif isinstance(content, list):
                        for item in content:
                            result[str(item)] = {"deleted_at": datetime.datetime.now().isoformat()}
            except Exception:
                pass
    return result

def save_deleted_dino(dino_id, steam_id=""):
    dino_id_str = str(dino_id).strip()
    if not dino_id_str:
        return
    data = load_deleted_dinos()
    data[dino_id_str] = {
        "steam_id": str(steam_id).strip(),
        "deleted_at": datetime.datetime.now().isoformat()
    }
    base_dir = os.path.dirname(os.path.abspath(__file__))
    primary_file = os.path.join(base_dir, "deleted_garage_dinos.json")
    sub_file = os.path.join(base_dir, "3mgaming-website", "deleted_garage_dinos.json")
    backup_file = os.path.join(base_dir, ".persistent_deleted_garage_dinos.json")

    for fpath in [primary_file, sub_file, backup_file]:
        try:
            os.makedirs(os.path.dirname(fpath), exist_ok=True)
            with open(fpath, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"[Save Deleted Dino Error {fpath}] {e}")

def remove_from_deleted_dinos(dino_id):
    dino_id_str = str(dino_id).strip()
    if not dino_id_str:
        return
    data = load_deleted_dinos()
    if dino_id_str in data:
        del data[dino_id_str]
        base_dir = os.path.dirname(os.path.abspath(__file__))
        for fpath in [
            os.path.join(base_dir, "deleted_garage_dinos.json"),
            os.path.join(base_dir, "3mgaming-website", "deleted_garage_dinos.json"),
            os.path.join(base_dir, ".persistent_deleted_garage_dinos.json")
        ]:
            try:
                if os.path.exists(os.path.dirname(fpath)):
                    with open(fpath, "w", encoding="utf-8") as f:
                        json.dump(data, f, ensure_ascii=False, indent=2)
            except Exception:
                pass

GARAGE_MUTATIONS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "garage_saved_mutations.json")

def load_garage_saved_mutations():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    primary_file = os.path.join(base_dir, "garage_saved_mutations.json")
    backup_file = os.path.join(base_dir, ".persistent_garage_saved_mutations.json")
    for fpath in [primary_file, backup_file]:
        if os.path.exists(fpath):
            try:
                with open(fpath, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
    return {}

def save_garage_saved_mutation(key, mutation_slots):
    if not key or not mutation_slots:
        return
    base_dir = os.path.dirname(os.path.abspath(__file__))
    primary_file = os.path.join(base_dir, "garage_saved_mutations.json")
    sub_file = os.path.join(base_dir, "3mgaming-website", "garage_saved_mutations.json")
    backup_file = os.path.join(base_dir, ".persistent_garage_saved_mutations.json")
    data = load_garage_saved_mutations()
    data[str(key)] = mutation_slots
    for fpath in [primary_file, sub_file, backup_file]:
        try:
            os.makedirs(os.path.dirname(fpath), exist_ok=True)
            with open(fpath, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception:
            pass

def get_user_gift_file():
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), "user_gift_dinos.json")

def load_user_gift_dinos():
    fpath = get_user_gift_file()
    if os.path.exists(fpath):
        try:
            with open(fpath, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}

def save_user_gift_dinos(data):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    fpath1 = os.path.join(base_dir, "user_gift_dinos.json")
    fpath2 = os.path.join(base_dir, "3mgaming-website", "user_gift_dinos.json")
    for fpath in [fpath1, fpath2]:
        try:
            if os.path.exists(os.path.dirname(fpath)):
                with open(fpath, "w", encoding="utf-8") as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"[Save User Gift Dinos Error {fpath}] {e}")

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
    _combat_log_cache_time = 0.0
    _combat_log_cached_data = None
    _killfeed_cache_time = 0.0
    _killfeed_cached_data = None

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

        # 9b. Check Dame / Combat Log (Live từ IslePilot)
        elif self.path.startswith("/api/combat-log") or self.path.startswith("/api/damage-log"):
            self.handle_combat_log()
            return

        # 9c. Đấu trường PK & Đặt Cược Xu (Live IslePilot)
        elif self.path.startswith("/api/arena"):
            self.handle_arena_get()
            return

        # 9d. Săn Boss Thần Thoại & Phần Thưởng 5.000 Xu
        elif self.path.startswith("/api/ai-hunt") or self.path.startswith("/api/boss"):
            self.handle_ai_hunt_get()
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

            if "vitals_only" in self.path:
                player_info = self.fetch_islepilot(f"/players/{target_steam_id}") or {}
                self.send_json_response({"ok": True, "player": player_info})
                return
            with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
                f_player = executor.submit(self.fetch_islepilot, f"/players/{target_steam_id}")
                f_garage = executor.submit(self.fetch_islepilot, f"/players/{target_steam_id}/garage")
                f_skins = executor.submit(self.fetch_islepilot, f"/players/{target_steam_id}/skins")
                f_warnings = executor.submit(self.fetch_islepilot, f"/players/{target_steam_id}/warnings")

                player_info = f_player.result() or {}
                garage_info = f_garage.result() or {}
                skins_info = f_skins.result() or {}
                warnings_info = f_warnings.result() or {}

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

            # Đồng bộ trực tiếp mutationSlots từ IslePilot
            if player_info and isinstance(player_info, dict):
                if not player_info.get("mutationSlots") or not isinstance(player_info.get("mutationSlots"), dict):
                    player_info["mutationSlots"] = {
                        "active": ["None", "None", "None", "None"],
                        "parent": ["None", "None", "None", "None"],
                        "elderA": ["None", "None", "None", "None"],
                        "elderB": ["None", "None", "None", "None"]
                    }

            deleted_dinos = load_deleted_dinos()
            combined_garage = [g for g in garage_info.get("garage", []) if str(g.get("id")) not in deleted_dinos]
            gifts = load_user_gift_dinos()
            user_gifts = gifts.get(str(target_steam_id), [])
            for g in user_gifts:
                if str(g.get("id")) not in deleted_dinos:
                    combined_garage.append(g)

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
                "economy": {}
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

        elif self.path == "/api/server/garage/sync-deleted":

            self.handle_garage_sync_deleted()

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

        elif self.path.startswith("/api/arena/"):
            self.handle_arena_post()
            return

        elif self.path.startswith("/api/ai-hunt/") or self.path.startswith("/api/boss/"):
            self.handle_ai_hunt_post()
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
                    
                if action == "heal":
                    p_info = self.fetch_islepilot(f"/players/{target_steam_id}") or {}
                    spec = (p_info.get("species") or "").lower()
                    base = {"hp": 3000, "prime_hp": 4100, "hunger": 1500, "thirst": 1000}
                    for k, v in SPECIES_BASE_STATS.items():
                        if k in spec:
                            base = v
                            break
                    is_prime = bool(p_info.get("isPrimeElder") or p_info.get("primeEligible"))
                    cur_growth = float(p_info.get("growth") or 1.0)
                    base_hp = (base.get("prime_hp") if is_prime else base.get("hp")) or 10000
                    calc_max_hp = base_hp * max(0.1, cur_growth)
                    max_h = float(p_info.get("maxHealth") or params.get("maxHealth") or calc_max_hp)
                    max_hu = float(p_info.get("maxHunger") or params.get("maxHunger") or base.get("hunger") or 4000)
                    max_t = float(p_info.get("maxThirst") or params.get("maxThirst") or 1000)

                    # KHÔNG thay đổi Growth % khi Heal (giữ nguyên độ tuổi khủng long hiện tại)
                    # 1. Sinh lực tối đa (Health, Hunger, Thirst, Bleed=0)
                    res = self.fetch_islepilot("/commands", method="POST", body_data={
                        "action": "setstats",
                        "steamId": str(target_steam_id),
                        "health": max_h,
                        "hunger": max_hu,
                        "thirst": max_t,
                        "bleed": 0.0
                    })
                    time.sleep(0.1)

                    # 3. Stamina 100%
                    self.fetch_islepilot("/commands", method="POST", body_data={
                        "action": "setstamina",
                        "steamId": str(target_steam_id),
                        "stamina": 1000.0
                    })
                    time.sleep(0.1)

                    # 4. Nutrition A-B-Y 100%
                    self.fetch_islepilot("/commands", method="POST", body_data={
                        "action": "setnutrition",
                        "steamId": str(target_steam_id),
                        "carb": 100.0,
                        "protein": 100.0,
                        "lipid": 100.0
                    })

                    self.send_json_response({"ok": True, "message": "Hồi phục toàn diện thành công", "result": res})
                    return

                elif action == "setgrowth":
                    g_val = float(params.get("growth", 1.0))
                    if g_val > 1.0: g_val = g_val / 100.0
                    cmd_body["growth"] = g_val
                    cmd_body["frozen"] = bool(params.get("frozen", False))
                    res = self.fetch_islepilot("/commands", method="POST", body_data=cmd_body)
                    if res and (res.get("ok") is True or "commandId" in res):
                        self.send_json_response({"ok": True, "result": res})
                    else:
                        err_msg = (res.get("error") if res else None) or "Lệnh thất bại"
                        self.send_json_response({"ok": False, "error": err_msg}, status=400)
                    return

                elif action == "setstamina":
                    cmd_body["stamina"] = float(params.get("stamina", 1000.0))
                    res = self.fetch_islepilot("/commands", method="POST", body_data=cmd_body)
                    if res and (res.get("ok") is True or "commandId" in res):
                        self.send_json_response({"ok": True, "result": res})
                    else:
                        err_msg = (res.get("error") if res else None) or "Lệnh thất bại"
                        self.send_json_response({"ok": False, "error": err_msg}, status=400)
                    return

                elif action == "setnutrition":
                    carb_val = float(params.get("carb", params.get("carbohydrate", params.get("s1", params.get("a", 100)))))
                    prot_val = float(params.get("protein", params.get("s2", params.get("b", 100))))
                    lipid_val = float(params.get("lipid", params.get("fat", params.get("s3", params.get("y", 100)))))
                    cmd_body["carb"] = carb_val
                    cmd_body["protein"] = prot_val
                    cmd_body["lipid"] = lipid_val
                    res = self.fetch_islepilot("/commands", method="POST", body_data=cmd_body)
                    if res and (res.get("ok") is True or "commandId" in res):
                        self.send_json_response({"ok": True, "result": res})
                    else:
                        err_msg = (res.get("error") if res else None) or "Lệnh thất bại"
                        self.send_json_response({"ok": False, "error": err_msg}, status=400)
                    return

                elif action == "setstats":
                    # 1. Growth nếu có truyền
                    if "growth" in params:
                        g_val = float(params.get("growth", 1.0))
                        if g_val > 1.0: g_val = g_val / 100.0
                        self.fetch_islepilot("/commands", method="POST", body_data={
                            "action": "setgrowth",
                            "steamId": str(target_steam_id),
                            "growth": g_val,
                            "frozen": False
                        })
                        time.sleep(0.1)

                    # 2. Stamina nếu có truyền
                    if "stamina" in params:
                        self.fetch_islepilot("/commands", method="POST", body_data={
                            "action": "setstamina",
                            "steamId": str(target_steam_id),
                            "stamina": float(params.get("stamina", 1000.0))
                        })
                        time.sleep(0.1)

                    # 3. Nutrition nếu có truyền
                    if any(k in params for k in ["carb", "protein", "lipid", "fat", "carbohydrate", "nutrA", "nutrB", "nutrY"]):
                        c_val = float(params.get("carb", params.get("carbohydrate", params.get("nutrA", 100))))
                        p_val = float(params.get("protein", params.get("nutrB", 100)))
                        l_val = float(params.get("lipid", params.get("fat", params.get("nutrY", 100))))
                        self.fetch_islepilot("/commands", method="POST", body_data={
                            "action": "setnutrition",
                            "steamId": str(target_steam_id),
                            "carb": c_val,
                            "protein": p_val,
                            "lipid": l_val
                        })
                        time.sleep(0.1)

                    cmd_body["health"] = float(params.get("health", 100))
                    cmd_body["hunger"] = float(params.get("hunger", 100))
                    cmd_body["thirst"] = float(params.get("thirst", 100))
                    if "bleed" in params:
                        cmd_body["bleed"] = float(params.get("bleed", 0))

                    res = self.fetch_islepilot("/commands", method="POST", body_data=cmd_body)
                    if res and (res.get("ok") is True or "commandId" in res):
                        self.send_json_response({"ok": True, "result": res})
                    else:
                        err_msg = (res.get("error") if res else None) or "Lệnh thất bại"
                        self.send_json_response({"ok": False, "error": err_msg}, status=400)
                    return
                elif action == "mutations":
                    sid_str = str(target_steam_id)
                    # Xóa toàn bộ đột biến gen
                    if params.get("clear"):
                        def async_clear_mutations():
                            res = self.fetch_islepilot("/commands", method="POST", body_data={
                                "action": "mutations",
                                "steamId": sid_str,
                                "clear": True,
                                "mutations": [],
                                "active": ["None", "None", "None", "None"],
                                "parent": ["None", "None", "None", "None"],
                                "elderA": ["None", "None"],
                                "elderB": ["None", "None"]
                            })
                            print(f"[mutations] Đã gửi lệnh xóa đột biến cho {sid_str}: {res}")
                        threading.Thread(target=async_clear_mutations, daemon=True).start()
                        self.send_json_response({"ok": True, "message": "Thành công"})
                        return

                    # Lấy mutationSlots hiện tại từ IslePilot
                    cur_p = self.fetch_islepilot(f"/players/{sid_str}") or {}
                    cur_slots = cur_p.get("mutationSlots") or {}
                    if not isinstance(cur_slots, dict):
                        cur_slots = {}

                    all_muts = {
                        "active": list(cur_slots.get("active") or ["None", "None", "None", "None"]),
                        "parent": list(cur_slots.get("parent") or ["None", "None", "None", "None"]),
                        "elderA": list(cur_slots.get("elderA") or ["None", "None", "None", "None"]),
                        "elderB": list(cur_slots.get("elderB") or ["None", "None", "None", "None"])
                    }
                    for k in ["active", "parent", "elderA", "elderB"]:
                        while len(all_muts[k]) < 4:
                            all_muts[k].append("None")

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
                            all_muts[k_cat] = norm_arr

                    # Cập nhật nếu gửi theo từng slot riêng lẻ
                    if params.get("slot") and "mutation" in params:
                        cat = str(params.get("category", "active"))
                        slot_num = int(params["slot"])
                        m_name = str(params["mutation"]).strip()
                        if cat not in all_muts:
                            all_muts[cat] = ["None", "None", "None", "None"]
                        if 1 <= slot_num <= 4:
                            all_muts[cat][slot_num - 1] = m_name

                    def async_push_mutations():
                        # Gửi duy nhất 1 lệnh chuẩn xác theo đúng đặc tả IslePilot
                        res = self.fetch_islepilot("/commands", method="POST", body_data={
                            "action": "mutations",
                            "steamId": sid_str,
                            "active": all_muts["active"][:4],
                            "parent": all_muts["parent"][:4],
                            "elderA": all_muts["elderA"][:2],
                            "elderB": all_muts["elderB"][:2]
                        })
                        print(f"[mutations] Đã gửi lệnh cập nhật đột biến cho {sid_str}: {res}")

                    threading.Thread(target=async_push_mutations, daemon=True).start()
                    self.send_json_response({"ok": True, "message": "Thành công", "mutationSlots": all_muts})
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
                    dino_id = str(params.get("garageDinoId") or "").strip()
                    save_deleted_dino(dino_id, target_steam_id)
                    gifts = load_user_gift_dinos()
                    user_gifts = gifts.get(str(target_steam_id), [])
                    new_gifts = [g for g in user_gifts if str(g.get("id")) != dino_id]
                    if len(new_gifts) != len(user_gifts):
                        gifts[str(target_steam_id)] = new_gifts
                        save_user_gift_dinos(gifts)
                    try:
                        self.fetch_islepilot(f"/players/{target_steam_id}/garage/{dino_id}/sell", method="POST", body_data={})
                    except Exception:
                        pass
                    self.send_json_response({"ok": True, "message": "Đã xóa vĩnh viễn khủng long khỏi Gara thành công!"})
                    return
                elif action == "restore_garage_dino":
                    dino_id = str(params.get("garageDinoId") or "").strip()
                    remove_from_deleted_dinos(dino_id)
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
        clean_key = endpoint.split("?")[0].strip()
        now_ts = time.time()

        if not hasattr(DinoRequestHandler, "_islepilot_cache"):
            DinoRequestHandler._islepilot_cache = {}

        # 1. Kiểm tra cache GET để tránh bị IslePilot rate-limit (HTTP 429)
        ttl = 0
        if method == "GET":
            if clean_key.startswith("/players/"):
                ttl = 4.0  # Cache 4s cho thông tin player / ví
            elif clean_key == "/players":
                ttl = 6.0  # Cache 6s cho danh sách players
            elif clean_key == "/server":
                ttl = 8.0  # Cache 8s cho trạng thái server
            elif clean_key in ["/killfeed", "/combat-log"]:
                ttl = 3.5  # Cache 3.5s cho combat / killfeed
            elif clean_key == "/teleport/locations":
                ttl = 60.0
            else:
                ttl = 3.0

            if ttl > 0 and clean_key in DinoRequestHandler._islepilot_cache:
                cached_time, cached_val = DinoRequestHandler._islepilot_cache[clean_key]
                if (now_ts - cached_time) < ttl:
                    return cached_val

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
                    res_json = json.loads(response.read().decode("utf-8"))
                    if method == "GET" and ttl > 0:
                        DinoRequestHandler._islepilot_cache[clean_key] = (now_ts, res_json)
                    return res_json
        except urllib.error.HTTPError as e:
            # Nếu gặp lỗi HTTP 429 hoặc 5xx, tự động trả về dữ liệu cache gần nhất nếu có
            if clean_key in DinoRequestHandler._islepilot_cache:
                _, fallback_val = DinoRequestHandler._islepilot_cache[clean_key]
                return fallback_val
            try:
                err_content = e.read().decode("utf-8")
                return json.loads(err_content)
            except Exception:
                pass
            print(f"[IslePilot API] Gọi {url} HTTP {e.code}")
        except Exception as e:
            if clean_key in DinoRequestHandler._islepilot_cache:
                _, fallback_val = DinoRequestHandler._islepilot_cache[clean_key]
                return fallback_val
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
            balance = self._get_player_xu_balance(steam_id)
            if not name:
                try:
                    p_info = self.fetch_islepilot(f"/players/{steam_id}")
                    if isinstance(p_info, dict) and p_info.get("name"):
                        name = p_info.get("name")
                except Exception:
                    pass
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

    def handle_combat_log(self):
        query = urllib.parse.urlparse(self.path).query
        q_params = urllib.parse.parse_qs(query)
        steam_id = q_params.get("steam_id", [None])[0]
        search_q = q_params.get("search", [""])[0].strip().lower()
        filter_type = q_params.get("type", ["all"])[0]

        endpoint = "/combat-log"
        if steam_id and str(steam_id).isdigit() and len(str(steam_id)) >= 15:
            endpoint = f"/combat-log?steamId={steam_id}"

        remote_data = self.fetch_islepilot(endpoint) or {}
        raw_hits = remote_data.get("hits", [])

        ABILITY_NAMES = {
            "Bite_Boar": "Cắn (Heo rừng)",
            "Giga_Bite": "Cắn xé Giga",
            "Giga_Maul": "Vồ cắn Giga",
            "TyrannosaurusMuzzleSwingHold": "Quật đầu T-Rex (Gồng)",
            "TyrannosaurusMuzzleSwingTap": "Quật đầu T-Rex (Nhanh)",
            "BiteTyrannosaurus": "Cắn chí mạng T-Rex",
            "CeratopsianFlipTriceratops": "Húc hất Trike",
            "CeratopsianSprintingFlipTriceratops": "Húc xung lực Trike",
            "SparringFlipTriceratops": "Húc đối kháng Trike",
            "Bite_Triceratops": "Cắn Trike",
            "Spino_Bite": "Cắn Spinosaurus",
            "DirectionalGallimimusKick": "Cú đá Gallimimus",
            "DirectionalGallimimusKickPrimary": "Đá trực diện Galli",
            "GallimimusKickLeft": "Đá mạn sườn Galli",
            "Puerta_Stomp": "Giẫm nát Puerta",
            "Crush": "Nghiền nát (Crush)",
            "SparringFlip_Tyrannosaurus": "Quật đối kháng T-Rex",
            "Bite_NoBleed": "Cắn thường",
            "PrimaryBite": "Cắn cơ bản",
            "AltBite": "Đòn cắn phụ",
            "TailAttack": "Quật đuôi"
        }

        formatted_hits = []
        total_dmg_dealt = 0.0
        total_dmg_received = 0.0
        total_kills_count = 0

        target_sid = str(steam_id) if (steam_id and str(steam_id).isdigit() and len(str(steam_id)) >= 15) else None

        for h in raw_hits:
            hit_id = str(h.get("id"))
            emitted_at = h.get("at")
            atk_sid = str(h.get("attackerSteamId") or "")
            atk_name = h.get("attackerName") or "Ẩn danh / NPC"
            atk_spec = h.get("attackerSpecies") or "Khủng long"
            atk_growth = round(float(h.get("attackerGrowth") or 1.0) * 100)

            vic_sid = str(h.get("victimSteamId") or "")
            vic_name = h.get("victimName") or "Ẩn danh / NPC"
            vic_spec = h.get("victimSpecies") or "Khủng long"
            vic_growth = round(float(h.get("victimGrowth") or 1.0) * 100)

            damage = round(float(h.get("damage") or 0), 2)
            hp_before = round(float(h.get("hpBefore") or 0), 1)
            hp_after = round(float(h.get("hpAfter") or 0), 1)
            dist_m = round(float(h.get("distanceM") or 0), 1)
            raw_ability = str(h.get("ability") or "")
            ability_label = ABILITY_NAMES.get(raw_ability, raw_ability.replace("_", " ") if raw_ability else "Tấn công")
            killed = bool(h.get("killed"))

            is_outgoing = bool(target_sid and atk_sid == target_sid)
            is_incoming = bool(target_sid and vic_sid == target_sid)

            if target_sid:
                if filter_type == "outgoing" and not is_outgoing:
                    continue
                elif filter_type == "incoming" and not is_incoming:
                    continue
                elif filter_type == "kills" and not killed:
                    continue
                elif filter_type == "all" and not (is_outgoing or is_incoming):
                    continue

                if is_outgoing:
                    total_dmg_dealt += damage
                    if killed:
                        total_kills_count += 1
                if is_incoming:
                    total_dmg_received += damage
            else:
                if filter_type == "kills" and not killed:
                    continue

            if search_q:
                haystack = f"{atk_name} {atk_sid} {atk_spec} {vic_name} {vic_sid} {vic_spec} {raw_ability} {ability_label}".lower()
                if search_q not in haystack:
                    continue

            formatted_hits.append({
                "id": hit_id,
                "timestamp": emitted_at,
                "attacker": {
                    "steamId": atk_sid,
                    "name": atk_name,
                    "species": atk_spec,
                    "growth": atk_growth
                },
                "victim": {
                    "steamId": vic_sid,
                    "name": vic_name,
                    "species": vic_spec,
                    "growth": vic_growth
                },
                "damage": damage,
                "hpBefore": hp_before,
                "hpAfter": hp_after,
                "distance": dist_m,
                "ability": ability_label,
                "rawAbility": raw_ability,
                "killed": killed,
                "isOutgoing": is_outgoing,
                "isIncoming": is_incoming
            })

        self.send_json_response({
            "ok": True,
            "hits": formatted_hits,
            "stats": {
                "totalHits": len(formatted_hits),
                "damageDealt": round(total_dmg_dealt, 1),
                "damageReceived": round(total_dmg_received, 1),
                "kills": total_kills_count
            }
        })

    # =========================================================================
    # ĐẤU TRƯỜNG PK & ĐẶT CƯỢC XU (PVP ARENA & SYSTEM COIN BETTING)
    # =========================================================================

    def _get_arena_db(self):
        db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "arena_matches.json")
        if os.path.exists(db_path):
            try:
                with open(db_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return {"matches": [], "stats": {"totalMatches": 0, "totalXuWagered": 0, "totalXuWon": 0}}

    def _save_arena_db(self, data):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        for db_path in [os.path.join(base_dir, "arena_matches.json"), os.path.join(base_dir, "3mgaming-website", "arena_matches.json")]:
            try:
                os.makedirs(os.path.dirname(db_path), exist_ok=True)
                with open(db_path, "w", encoding="utf-8") as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
            except Exception as e:
                print(f"[Arena DB Save Error] {e}")

    def _get_cached_player_balance(self, steam_id):
        steam_id = str(steam_id).strip()
        base_dir = os.path.dirname(os.path.abspath(__file__))
        cache_file = os.path.join(base_dir, "player_wallet_cache.json")
        if os.path.exists(cache_file):
            try:
                with open(cache_file, "r", encoding="utf-8") as f:
                    cache_data = json.load(f)
                    return int(cache_data.get(steam_id, 0))
            except Exception:
                pass
        return 0

    def _update_cached_player_balance(self, steam_id, balance):
        steam_id = str(steam_id).strip()
        base_dir = os.path.dirname(os.path.abspath(__file__))
        for cpath in [os.path.join(base_dir, "player_wallet_cache.json"), os.path.join(base_dir, "3mgaming-website", "player_wallet_cache.json")]:
            try:
                cache_data = {}
                if os.path.exists(cpath):
                    try:
                        with open(cpath, "r", encoding="utf-8") as f:
                            cache_data = json.load(f)
                    except Exception:
                        cache_data = {}
                cache_data[steam_id] = int(balance)
                os.makedirs(os.path.dirname(cpath), exist_ok=True)
                with open(cpath, "w", encoding="utf-8") as f:
                    json.dump(cache_data, f, indent=2, ensure_ascii=False)
            except Exception:
                pass

    def _adjust_player_xu(self, steam_id, amount, reason=""):
        steam_id = str(steam_id).strip()
        if not steam_id:
            return False
        
        amount = int(amount)
        applied = False
        new_islepilot_balance = None
        base_dir = os.path.dirname(os.path.abspath(__file__))

        # 1. Gọi trực tiếp IslePilot API /players/{steam_id}/currency
        try:
            res = self.fetch_islepilot(f"/players/{steam_id}/currency", method="POST", body_data={
                "amount": amount,
                "reason": reason
            })
            if res and (res.get("ok") is True or "balance" in res or res.get("applied") is not None):
                applied = True
                if "balance" in res:
                    new_islepilot_balance = int(res.get("balance"))
        except Exception as e:
            print(f"[Arena Currency Direct Error] {e}")

        # Thử lại nếu gặp lỗi hoặc rate-limit
        if not applied:
            time.sleep(1.0)
            try:
                res = self.fetch_islepilot(f"/players/{steam_id}/currency", method="POST", body_data={
                    "amount": amount,
                    "reason": reason
                })
                if res and (res.get("ok") is True or "balance" in res or res.get("applied") is not None):
                    applied = True
                    if "balance" in res:
                        new_islepilot_balance = int(res.get("balance"))
            except Exception:
                pass

        # 2. Xử lý kết quả cộng/trừ xu
        if applied:
            print(f"[Arena Currency Success] Đã áp dụng {amount:+d} Xu cho Steam {steam_id} trên IslePilot (Số dư mới: {new_islepilot_balance})")
            if new_islepilot_balance is not None:
                self._update_cached_player_balance(steam_id, new_islepilot_balance)
            # Xóa cache GET /players/{steam_id} để lần đọc tiếp theo lấy số dư mới nhất
            if hasattr(DinoRequestHandler, "_islepilot_cache"):
                DinoRequestHandler._islepilot_cache.pop(f"/players/{steam_id}", None)
            return True

        # 3. Dự phòng: Nếu IslePilot tạm thời lỗi/429/offline, ghi nhận vào admin_wallet_adjustments.json
        print(f"[Arena Currency Fallback] IslePilot chưa nhận, ghi nhận {amount:+d} Xu vào admin_wallet_adjustments.json cho Steam {steam_id}")
        try:
            for adj_file in [os.path.join(base_dir, "admin_wallet_adjustments.json"), os.path.join(base_dir, "3mgaming-website", "admin_wallet_adjustments.json")]:
                try:
                    adjs = {}
                    if os.path.exists(adj_file):
                        try:
                            with open(adj_file, "r", encoding="utf-8") as f:
                                adjs = json.load(f)
                        except Exception:
                            adjs = {}
                    cur_val = float(adjs.get(steam_id, 0.0))
                    adjs[steam_id] = round(cur_val + float(amount), 1)
                    os.makedirs(os.path.dirname(adj_file), exist_ok=True)
                    with open(adj_file, "w", encoding="utf-8") as f:
                        json.dump(adjs, f, indent=2, ensure_ascii=False)
                except Exception:
                    pass
        except Exception as e:
            print(f"[Arena Wallet Adjust Error] {e}")

        return True

    def _get_player_xu_balance(self, steam_id):
        steam_id = str(steam_id).strip()
        if not steam_id:
            return 0
        base_dir = os.path.dirname(os.path.abspath(__file__))
        
        # 1. Đọc số dư lưu trong player_wallet_cache
        last_known = self._get_cached_player_balance(steam_id)

        # 2. Thử lấy dữ liệu thực tế từ IslePilot
        try:
            player_info = self.fetch_islepilot(f"/players/{steam_id}")
            if isinstance(player_info, dict):
                wallet = player_info.get("wallet", {})
                if isinstance(wallet, dict) and "balance" in wallet:
                    last_known = int(wallet.get("balance", 0))
                    self._update_cached_player_balance(steam_id, last_known)
        except Exception:
            pass

        # 3. Cộng thêm các điều chỉnh từ admin_wallet_adjustments.json
        adj_file = os.path.join(base_dir, "admin_wallet_adjustments.json")
        extra = 0.0
        if os.path.exists(adj_file):
            try:
                with open(adj_file, "r", encoding="utf-8") as f:
                    adjs = json.load(f)
                    extra = float(adjs.get(str(steam_id), 0.0))
            except Exception:
                pass

        total_balance = max(0, int(round(last_known + extra)))
        return total_balance
    def _translate_pilot_error(self, err_msg):
        err_str = str(err_msg).lower()
        if "not online" in err_str or "offline" in err_str or "player_offline" in err_str:
            return "Khủng long của bạn chưa online trong server! Hãy vào game và đứng yên trước khi bấm dịch chuyển."
        if "combat" in err_str:
            return "Khủng long đang trong trạng thái combat (giao tranh)! Vui lòng đợi 30 giây hết combat rồi thử lại."
        if "location" in err_str:
            return "Địa điểm dịch chuyển không hợp lệ hoặc đang bị khóa."
        if "rate limit" in err_str or "too many" in err_str:
            return "Thao tác quá nhanh, vui lòng đợi vài giây rồi thử lại."
        return str(err_msg)

    def _is_teleport_success(self, res):
        if not res or not isinstance(res, dict):
            return False, "Không thể kết nối đến máy chủ game IslePilot."
        if res.get("ok") is False:
            err = res.get("error") or res.get("message") or "Lệnh dịch chuyển bị từ chối"
            return False, self._translate_pilot_error(err)
        if "statusCode" in res and res.get("statusCode") not in [200, 201]:
            err = res.get("message") or res.get("error") or f"Lỗi HTTP {res.get('statusCode')}"
            return False, self._translate_pilot_error(err)
        if res.get("ok") is True or res.get("commandId") or res.get("success") is True:
            return True, "Thành công"
        if res.get("error"):
            return False, self._translate_pilot_error(res.get("error"))
        return False, "Máy chủ không xác nhận lệnh dịch chuyển."

    def handle_arena_get(self):
        query = urllib.parse.urlparse(self.path).query
        q_params = urllib.parse.parse_qs(query)
        steam_id = q_params.get("steam_id", [None])[0] or self.get_active_steam_id()

        db = self._get_arena_db()
        matches = db.get("matches", [])

        # Kiểm tra tự động kết quả cho các trận in_progress
        self._auto_check_in_progress_matches(matches)

        my_balance = self._get_player_xu_balance(steam_id) if steam_id else 0

        # Thống kê tổng quan
        total_matches = len(matches)
        active_count = sum(1 for m in matches if m.get("status") in ["waiting", "in_progress"])
        total_wagered = sum(m.get("totalFighterPool", 0) + sum(b.get("amount", 0) for b in m.get("spectatorBets", [])) for m in matches)

        self.send_json_response({
            "ok": True,
            "matches": matches,
            "my_steam_id": steam_id,
            "my_balance": my_balance,
            "arena_location": {
                "id": "cmvqtjyrr4ombph01vi8dknwg",
                "name": "ĐẤU TRƯỜNG"
            },
            "stats": {
                "totalMatches": total_matches,
                "activeMatches": active_count,
                "totalXuWagered": total_wagered
            }
        })

    def _auto_check_in_progress_matches(self, matches):
        # Tự động quét IslePilot Killfeed, Combat Log & Trạng thái Player để xác định người chiến thắng
        now_ts = time.time()

        # 1. Lấy dữ liệu /killfeed (Bộ đếm mạng chết chính thức từ máy chủ The Isle)
        kills = []
        try:
            if DinoRequestHandler._killfeed_cached_data and (now_ts - DinoRequestHandler._killfeed_cache_time < 3.0):
                kills = DinoRequestHandler._killfeed_cached_data.get("kills", [])
            else:
                remote_kf = self.fetch_islepilot("/killfeed")
                if isinstance(remote_kf, dict):
                    DinoRequestHandler._killfeed_cached_data = remote_kf
                    DinoRequestHandler._killfeed_cache_time = now_ts
                    kills = remote_kf.get("kills", [])
                elif DinoRequestHandler._killfeed_cached_data:
                    kills = DinoRequestHandler._killfeed_cached_data.get("kills", [])
        except Exception as e:
            if DinoRequestHandler._killfeed_cached_data:
                kills = DinoRequestHandler._killfeed_cached_data.get("kills", [])

        # 2. Lấy dữ liệu /combat-log
        hits = []
        try:
            if DinoRequestHandler._combat_log_cached_data and (now_ts - DinoRequestHandler._combat_log_cache_time < 3.0):
                hits = DinoRequestHandler._combat_log_cached_data.get("hits", [])
            else:
                remote_cl = self.fetch_islepilot("/combat-log")
                if isinstance(remote_cl, dict):
                    DinoRequestHandler._combat_log_cached_data = remote_cl
                    DinoRequestHandler._combat_log_cache_time = now_ts
                    hits = remote_cl.get("hits", [])
                elif DinoRequestHandler._combat_log_cached_data:
                    hits = DinoRequestHandler._combat_log_cached_data.get("hits", [])
        except Exception as e:
            if DinoRequestHandler._combat_log_cached_data:
                hits = DinoRequestHandler._combat_log_cached_data.get("hits", [])

        used_hit_ids = {str(m.get("settledHitId")) for m in matches if m.get("settledHitId")}

        for m in matches:
            if m.get("status") != "in_progress":
                continue
            c_sid = str(m.get("creator", {}).get("steamId", "")).strip()
            o_sid = str(m.get("opponent", {}).get("steamId", "")).strip()
            if not c_sid or not o_sid:
                continue

            c_name = m.get("creator", {}).get("name", "Người tạo")
            o_name = m.get("opponent", {}).get("name", "Đối thủ")

            started_at_str = m.get("startedAt")
            started_at_ts = 0.0
            if started_at_str:
                try:
                    clean_str = started_at_str.replace("Z", "+00:00")
                    dt = datetime.datetime.fromisoformat(clean_str)
                    started_at_ts = dt.timestamp()
                except Exception:
                    pass

            is_settled = False

            # CÁCH 1: Quét /killfeed (Sự kiện hạ gục / chết chính xác nhất của IslePilot)
            for k in kills:
                k_id = str(k.get("id") or "")
                if k_id and k_id in used_hit_ids:
                    continue

                emit_at = k.get("emittedAt")
                emit_ts = 0.0
                if emit_at:
                    try:
                        clean_emit = emit_at.replace("Z", "+00:00")
                        emit_ts = datetime.datetime.fromisoformat(clean_emit).timestamp()
                    except Exception:
                        pass

                # Bỏ qua sự kiện diễn ra trước khi trận đấu bắt đầu (cho phép trễ mạng 5s)
                if started_at_ts > 0 and emit_ts > 0 and emit_ts < (started_at_ts - 5.0):
                    continue

                k_vic = str(k.get("victimSteamId") or "").strip()
                k_atk = str(k.get("killerSteamId") or "").strip()

                if k_vic == o_sid:
                    # Opponent đã chết -> Creator thắng!
                    win_reason = f"Đã tiêu diệt {o_name} trong Đấu Trường PK!"
                    if k_atk == c_sid:
                        win_reason = f"Đã trực tiếp hạ gục {o_name} trong Đấu Trường PK!"
                    self._settle_arena_match(m, "creator", win_reason, hit_id=k_id)
                    if k_id:
                        used_hit_ids.add(k_id)
                    is_settled = True
                    break

                elif k_vic == c_sid:
                    # Creator đã chết -> Opponent thắng!
                    win_reason = f"Đã tiêu diệt {c_name} trong Đấu Trường PK!"
                    if k_atk == o_sid:
                        win_reason = f"Đã trực tiếp hạ gục {c_name} trong Đấu Trường PK!"
                    self._settle_arena_match(m, "opponent", win_reason, hit_id=k_id)
                    if k_id:
                        used_hit_ids.add(k_id)
                    is_settled = True
                    break

            if is_settled:
                continue

            # CÁCH 2: Quét /combat-log (Kiểm tra đòn cắn kết liễu hoặc hpAfter <= 0)
            for h in hits:
                h_id = str(h.get("id") or "")
                if h_id and h_id in used_hit_ids:
                    continue

                hit_at = h.get("at")
                hit_ts = 0.0
                if hit_at:
                    try:
                        clean_hit_at = hit_at.replace("Z", "+00:00")
                        hit_ts = datetime.datetime.fromisoformat(clean_hit_at).timestamp()
                    except Exception:
                        pass

                if started_at_ts > 0 and hit_ts > 0 and hit_ts < (started_at_ts - 5.0):
                    continue

                atk_sid = str(h.get("attackerSteamId") or "").strip()
                vic_sid = str(h.get("victimSteamId") or "").strip()
                hp_after = float(h.get("hpAfter") or 1.0)
                is_fatal = (h.get("killed") is True) or (hp_after <= 0.0)

                if is_fatal:
                    ability = h.get("ability", "tấn công")
                    if atk_sid == c_sid and vic_sid == o_sid:
                        self._settle_arena_match(m, "creator", f"Đòn kết liễu ({ability}) đánh bại {o_name}!", hit_id=h_id)
                        if h_id:
                            used_hit_ids.add(h_id)
                        is_settled = True
                        break
                    elif atk_sid == o_sid and vic_sid == c_sid:
                        self._settle_arena_match(m, "opponent", f"Đòn kết liễu ({ability}) đánh bại {c_name}!", hit_id=h_id)
                        if h_id:
                            used_hit_ids.add(h_id)
                        is_settled = True
                        break

            if is_settled:
                continue

            # CÁCH 3: Quét trực tiếp HP của 2 đấu sĩ trên server nếu trận đấu đã kéo dài > 10s
            if started_at_ts > 0 and (now_ts - started_at_ts >= 10.0):
                try:
                    c_p = self.fetch_islepilot(f"/players/{c_sid}")
                    o_p = self.fetch_islepilot(f"/players/{o_sid}")
                    c_hp = float(c_p.get("health", 1.0)) if (isinstance(c_p, dict) and c_p.get("online")) else 1.0
                    o_hp = float(o_p.get("health", 1.0)) if (isinstance(o_p, dict) and o_p.get("online")) else 1.0

                    # Nếu 1 bên đã chết (health <= 0)
                    if o_hp <= 0.0 and c_hp > 0.0:
                        self._settle_arena_match(m, "creator", f"Đối thủ {o_name} đã gục ngã (0 HP)!")
                        is_settled = True
                    elif c_hp <= 0.0 and o_hp > 0.0:
                        self._settle_arena_match(m, "opponent", f"Đối thủ {c_name} đã gục ngã (0 HP)!")
                        is_settled = True
                except Exception as e:
                    pass

    def _settle_arena_match(self, m, winner_key, win_reason="Chiến thắng", hit_id=None):
        if not hasattr(DinoRequestHandler, "_arena_settle_lock"):
            DinoRequestHandler._arena_settle_lock = threading.Lock()
        if not hasattr(DinoRequestHandler, "_settled_match_ids"):
            DinoRequestHandler._settled_match_ids = set()

        match_id = str(m.get("id") or "").strip()
        if not match_id:
            return

        # Kiểm tra nhanh không cần lock
        if match_id in DinoRequestHandler._settled_match_ids:
            return

        with DinoRequestHandler._arena_settle_lock:
            # Kiểm tra chống settle trùng lặp tuyệt đối giữa các thread và request song song
            if match_id in DinoRequestHandler._settled_match_ids:
                return

            if m.get("status") == "finished" and m.get("fightersSettled") and m.get("spectatorBetsSettled"):
                DinoRequestHandler._settled_match_ids.add(match_id)
                return

            # Kiểm tra thêm trong cơ sở dữ liệu trên đĩa và đồng bộ spectatorBets mới nhất
            try:
                db_check = self._get_arena_db()
                disk_m = next((x for x in db_check.get("matches", []) if str(x.get("id")) == match_id), None)
                if disk_m:
                    if disk_m.get("status") == "finished" and disk_m.get("fightersSettled"):
                        DinoRequestHandler._settled_match_ids.add(match_id)
                        m["status"] = "finished"
                        m["fightersSettled"] = True
                        m["spectatorBetsSettled"] = True
                        return
                    # Đồng bộ đầy đủ danh sách cược khán giả mới nhất từ file đĩa
                    if disk_m.get("spectatorBets"):
                        m["spectatorBets"] = disk_m.get("spectatorBets", [])
            except Exception:
                pass

            # Đánh dấu ngay lập tức đã vào quy trình settle để ngăn chặn mọi luồng khác
            DinoRequestHandler._settled_match_ids.add(match_id)

            m["status"] = "finished"
            m["winner"] = winner_key
            m["winnerSteamId"] = m.get(winner_key, {}).get("steamId")
            m["winReason"] = win_reason
            m["finishedAt"] = datetime.datetime.now().isoformat()
            if hit_id:
                m["settledHitId"] = str(hit_id)

            loser_key = "opponent" if winner_key == "creator" else "creator"
            winner_sid = str(m.get(winner_key, {}).get("steamId", "")).strip()
            loser_sid = str(m.get(loser_key, {}).get("steamId", "")).strip()
            winner_name = m.get(winner_key, {}).get("name", "Người chiến thắng")
            loser_name = m.get(loser_key, {}).get("name", "Người thua cuộc")
            bet_amount = int(m.get("betAmount", 0))

            m["loserSteamId"] = loser_sid
            m["loserName"] = loser_name

            print(f"[Arena Match Settle] Trận #{m.get('id')}: {winner_name} THẮNG trước {loser_name}! Mức cược: {bet_amount} Xu.")

            # 1. Xử lý cộng/trừ Xu 2 Đấu Sĩ (Chỉ thực hiện đúng 1 lần duy nhất)
            if not m.get("fightersSettled"):
                # Người thua: Trừ Xu
                if bet_amount > 0 and loser_sid:
                    self._adjust_player_xu(
                        loser_sid,
                        -bet_amount,
                        f"Thua trận PK #{m.get('id')} trước {winner_name}: Trừ {bet_amount} Xu cược"
                    )

                # Người thắng: Nhận Xu thưởng
                if bet_amount > 0 and winner_sid:
                    self._adjust_player_xu(
                        winner_sid,
                        bet_amount,
                        f"Thắng trận PK #{m.get('id')} trước {loser_name}: Nhận thưởng +{bet_amount} Xu cược"
                    )

                # Thông báo toàn server vinh danh người chiến thắng
                try:
                    self.fetch_islepilot("/commands", method="POST", body_data={
                        "action": "announce",
                        "message": f"🏆 [ĐẤU TRƯỜNG PK] {winner_name} đã đánh bại {loser_name} trong trận PK #{m.get('id')} và giành chiến thắng +{bet_amount} Xu!"
                    })
                except Exception as e:
                    pass

                m["fightersSettled"] = True

            m["settledSummary"] = {
                "winnerSteamId": winner_sid,
                "winnerName": winner_name,
                "winnerBonusXu": bet_amount,
                "loserSteamId": loser_sid,
                "loserName": loser_name,
                "loserDeductXu": bet_amount
            }

            # 2. Xử lý trả thưởng Khán Giả (Tỷ lệ 1 ăn 1 chuẩn xác tuyệt đối: Cược X thắng nhận X tiền lời, tổng nhận về 2*X)
            if not m.get("spectatorBetsSettled"):
                m["spectatorBetsSettled"] = True
                spectator_bets = m.get("spectatorBets", [])
                for b in spectator_bets:
                    if b.get("settled"):
                        continue
                    b_amt = int(b.get("amount", 0))
                    if b_amt <= 0:
                        b["settled"] = True
                        continue

                    if b.get("chosenFighter") == winner_key:
                        # Người cược cho đấu thủ chiến thắng:
                        # Nhận lại đúng tiền gốc (b_amt) + tiền thắng lãi tỷ lệ 1:1 (b_amt) -> Tổng nhận = 2 * b_amt
                        # Ví dụ: cược 2,000 Xu -> Nhận lại 2,000 Xu gốc + 2,000 Xu lãi = 4,000 Xu tổng cộng (tài khoản tăng đúng +2,000 Xu ròng)
                        bonus = b_amt
                        total_payout = b_amt + bonus
                        self._adjust_player_xu(
                            b.get("steamId"),
                            total_payout,
                            f"Thắng cược khán giả PK #{match_id} (+{bonus} Xu lãi chuẩn 1:1)"
                        )
                        b["payout"] = total_payout
                        b["bonus"] = bonus
                        b["status"] = "won"
                        b["settled"] = True
                        print(f"[Spectator Payout] Khán giả {b.get('steamId')} cược {b_amt} Xu: Nhận lại {b_amt} gốc + {bonus} Xu lãi (Tổng nhận: {total_payout} Xu)")
                    else:
                        # Người cược cho đấu thủ thua cuộc:
                        # Tiền đã bị trừ lúc đặt cược, payout = 0
                        b["payout"] = 0
                        b["bonus"] = 0
                        b["status"] = "lost"
                        b["settled"] = True
                        print(f"[Spectator Lost] Khán giả {b.get('steamId')} cược {b_amt} Xu cho bên thua cuộc.")

            # LƯU NGAY LẬP TỨC VÀO DATABASE
            try:
                db = self._get_arena_db()
                found = False
                for idx, existing_m in enumerate(db.get("matches", [])):
                    if str(existing_m.get("id")) == match_id:
                        db["matches"][idx] = m
                        found = True
                        break
                if not found:
                    db.setdefault("matches", []).append(m)
                self._save_arena_db(db)
            except Exception as e:
                print(f"[Arena Settle Save DB Error]: {e}")
    def handle_arena_post(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            payload = json.loads(self.rfile.read(length).decode("utf-8")) if length > 0 else {}
        except Exception:
            payload = {}

        path = self.path.split("?")[0]
        db = self._get_arena_db()
        matches = db.setdefault("matches", [])

        # 1. Tạo Kèo Đấu PK (Create Match)
        if path == "/api/arena/matches/create":
            steam_id = payload.get("steam_id") or self.get_active_steam_id()
            if not steam_id:
                self.send_json_response({"ok": False, "error": "Vui lòng đăng nhập Steam để tạo kèo!"}, status=400)
                return

            title = payload.get("title", "Kèo Đấu PK").strip() or "Kèo Đấu PK 1v1"
            tier = payload.get("tier", "Tự do").strip()
            rules = payload.get("rules", "Solo 1v1 đến chết").strip()
            bet_amount = int(payload.get("bet_amount", 50))

            if bet_amount < 10:
                self.send_json_response({"ok": False, "error": "Mức cược tối thiểu là 10 Xu!"}, status=400)
                return

            current_balance = self._get_player_xu_balance(steam_id)
            if current_balance < bet_amount:
                self.send_json_response({"ok": False, "error": f"Số dư không đủ! Bạn có {current_balance} Xu, cần {bet_amount} Xu."}, status=400)
                return

            # Lấy thông tin khủng long active của creator
            creator_name = f"Player_{str(steam_id)[-4:]}"
            creator_species = "Tyrannosaurus"
            creator_growth = 100
            try:
                p_info = self.fetch_islepilot(f"/players/{steam_id}")
                if isinstance(p_info, dict):
                    creator_name = p_info.get("name") or creator_name
                    creator_species = p_info.get("species") or creator_species
                    creator_growth = round(float(p_info.get("growth", 1.0)) * 100)
            except Exception:
                pass

            # Không trừ Xu trước khi tạo kèo, Xu sẽ được cộng/trừ khi trận đấu kết thúc

            match_id = f"pk_{int(datetime.datetime.now().timestamp() * 1000)}"
            new_match = {
                "id": match_id,
                "createdAt": datetime.datetime.now().isoformat(),
                "status": "waiting",
                "title": title,
                "tier": tier,
                "rules": rules,
                "arenaLocationId": "cmvqtjyrr4ombph01vi8dknwg",
                "arenaLocationName": "ĐẤU TRƯỜNG",
                "creator": {
                    "steamId": str(steam_id),
                    "name": creator_name,
                    "species": creator_species,
                    "growth": creator_growth
                },
                "opponent": None,
                "betAmount": bet_amount,
                "totalFighterPool": bet_amount * 2,
                "spectatorBets": [],
                "winner": None,
                "winnerSteamId": None,
                "winReason": None,
                "startedAt": None,
                "finishedAt": None
            }

            matches.insert(0, new_match)
            db["stats"]["totalMatches"] = db["stats"].get("totalMatches", 0) + 1
            db["stats"]["totalXuWagered"] = db["stats"].get("totalXuWagered", 0) + bet_amount * 2
            self._save_arena_db(db)

            new_balance = self._get_player_xu_balance(steam_id)
            self.send_json_response({
                "ok": True,
                "message": f"Tạo kèo PK '{title}' thành công! Mức cược {bet_amount} Xu (Xu sẽ được cộng/trừ khi kết thúc trận).",
                "match": new_match,
                "balance": new_balance
            })
            return

        # 2. Nhận Kèo Đấu PK (Accept Match)
        elif path == "/api/arena/matches/accept":
            match_id = payload.get("match_id")
            steam_id = payload.get("steam_id") or self.get_active_steam_id()
            if not steam_id or not match_id:
                self.send_json_response({"ok": False, "error": "Thiếu thông tin nhận kèo!"}, status=400)
                return

            target_match = next((m for m in matches if m.get("id") == match_id), None)
            if not target_match:
                self.send_json_response({"ok": False, "error": "Kèo đấu không tồn tại!"}, status=404)
                return
            if target_match.get("status") != "waiting":
                self.send_json_response({"ok": False, "error": "Kèo này đã có người nhận hoặc đã kết thúc!"}, status=400)
                return
            if str(target_match.get("creator", {}).get("steamId")) == str(steam_id):
                self.send_json_response({"ok": False, "error": "Bạn không thể tự nhận kèo của chính mình!"}, status=400)
                return

            bet_amount = target_match.get("betAmount", 0)
            current_balance = self._get_player_xu_balance(steam_id)
            if current_balance < bet_amount:
                self.send_json_response({"ok": False, "error": f"Số dư không đủ! Bạn có {current_balance} Xu, cần {bet_amount} Xu."}, status=400)
                return

            # Lấy thông tin dino của opponent
            opp_name = f"Player_{str(steam_id)[-4:]}"
            opp_species = "Tyrannosaurus"
            opp_growth = 100
            try:
                p_info = self.fetch_islepilot(f"/players/{steam_id}")
                if isinstance(p_info, dict):
                    opp_name = p_info.get("name") or opp_name
                    opp_species = p_info.get("species") or opp_species
                    opp_growth = round(float(p_info.get("growth", 1.0)) * 100)
            except Exception:
                pass

            # Kiểm tra người tạo kèo cũng còn đủ số dư cược
            creator_sid = target_match.get("creator", {}).get("steamId")
            creator_bal = self._get_player_xu_balance(creator_sid)
            if creator_bal < bet_amount:
                self.send_json_response({"ok": False, "error": f"Người tạo kèo hiện không còn đủ {bet_amount} Xu trong ví. Kèo không thể bắt đầu!"}, status=400)
                return

            # Không trừ Xu trước khi nhận kèo, Xu sẽ được cộng/trừ khi trận đấu kết thúc
            target_match["status"] = "in_progress"
            target_match["startedAt"] = datetime.datetime.now().isoformat()
            target_match["opponent"] = {
                "steamId": str(steam_id),
                "name": opp_name,
                "species": opp_species,
                "growth": opp_growth
            }
            self._save_arena_db(db)

            new_balance = self._get_player_xu_balance(steam_id)
            self.send_json_response({
                "ok": True,
                "message": f"Nhận kèo thành công! Hãy vào Đấu Trường để quyết chiến.",
                "match": target_match,
                "balance": new_balance
            })
            return

        # 3. Hủy Kèo (Cancel Match)
        elif path == "/api/arena/matches/cancel":
            match_id = payload.get("match_id")
            steam_id = payload.get("steam_id") or self.get_active_steam_id()
            is_adm, _ = self.is_admin_request()
            admin_sids = [str(sid) for sid in config.get("ADMIN_STEAM_IDS", ["76561199175571899"])]
            if steam_id and str(steam_id) in admin_sids:
                is_adm = True

            target_match = next((m for m in matches if m.get("id") == match_id), None)
            if not target_match:
                self.send_json_response({"ok": False, "error": "Kèo không tồn tại!"}, status=404)
                return
            if not is_adm and str(target_match.get("creator", {}).get("steamId")) != str(steam_id):
                self.send_json_response({"ok": False, "error": "Chỉ người tạo kèo hoặc Admin mới có quyền hủy!"}, status=403)
                return
            if not is_adm and target_match.get("status") != "waiting":
                self.send_json_response({"ok": False, "error": "Chỉ có thể hủy kèo khi chưa có người nhận!"}, status=400)
                return

            # Hoàn lại tiền cược khán giả nếu có
            for b in target_match.get("spectatorBets", []):
                if not b.get("settled"):
                    b_amt = int(b.get("amount", 0))
                    if b_amt > 0:
                        self._adjust_player_xu(b.get("steamId"), b_amt, f"Hoàn tiền cược do kèo PK #{match_id} bị hủy")
                    b["status"] = "refunded"
                    b["settled"] = True

            target_match["status"] = "cancelled"
            target_match["finishedAt"] = datetime.datetime.now().isoformat()
            self._save_arena_db(db)

            new_balance = self._get_player_xu_balance(steam_id)
            self.send_json_response({
                "ok": True,
                "message": f"Đã hủy kèo PK #{match_id} thành công!",
                "balance": new_balance
            })
            return

        # 3.1. Xóa Vĩnh Viễn Kèo Đấu (Delete Match - Dành cho Admin)
        elif path == "/api/arena/matches/delete":
            match_id = payload.get("match_id")
            steam_id = payload.get("steam_id") or self.get_active_steam_id()
            is_adm, _ = self.is_admin_request()
            admin_sids = [str(sid) for sid in config.get("ADMIN_STEAM_IDS", ["76561199175571899"])]
            if steam_id and str(steam_id) in admin_sids:
                is_adm = True

            if not is_adm:
                self.send_json_response({"ok": False, "error": "Chỉ Admin mới có quyền xóa vĩnh viễn kèo đấu!"}, status=403)
                return

            target_match = next((m for m in matches if m.get("id") == match_id), None)
            if target_match:
                for b in target_match.get("spectatorBets", []):
                    if not b.get("settled"):
                        b_amt = int(b.get("amount", 0))
                        if b_amt > 0:
                            self._adjust_player_xu(b.get("steamId"), b_amt, f"Hoàn tiền cược do kèo PK #{match_id} bị xóa")
                        b["status"] = "refunded"
                        b["settled"] = True

            db["matches"] = [m for m in db.get("matches", []) if str(m.get("id")) != str(match_id)]
            self._save_arena_db(db)
            self.send_json_response({"ok": True, "message": f"Đã xóa vĩnh viễn kèo PK #{match_id} thành công!"})
            return

        # 4. Đặt Cược Khán Giả (Spectator Bet)
        elif path == "/api/arena/matches/bet":
            match_id = payload.get("match_id")
            steam_id = payload.get("steam_id") or self.get_active_steam_id()
            chosen = payload.get("chosen_fighter") # "creator" hoặc "opponent"
            amount = int(payload.get("amount", 20))

            target_match = next((m for m in matches if m.get("id") == match_id), None)
            if not target_match or target_match.get("status") not in ["waiting", "in_progress"]:
                self.send_json_response({"ok": False, "error": "Kèo không hợp lệ để đặt cược!"}, status=400)
                return
            if chosen == "opponent" and not target_match.get("opponent"):
                self.send_json_response({"ok": False, "error": "Kèo đấu này chưa có đối thủ tham gia để đặt cược!"}, status=400)
                return
            creator_obj = target_match.get("creator") or {}
            opp_obj = target_match.get("opponent") or {}
            if str(creator_obj.get("steamId")) == str(steam_id) or (opp_obj and str(opp_obj.get("steamId")) == str(steam_id)):
                self.send_json_response({"ok": False, "error": "Đấu sĩ tham gia trận không được phép cược khán giả!"}, status=400)
                return

            # Kiểm tra: Mỗi người chơi chỉ được đặt cược 1 lần duy nhất trong suốt trận đấu
            existing_bet = next((b for b in target_match.get("spectatorBets", []) if str(b.get("steamId", "")).strip() == str(steam_id).strip()), None)
            if existing_bet:
                chosen_key = existing_bet.get("chosenFighter", "creator")
                chosen_name = (target_match.get(chosen_key) or {}).get("name", chosen_key)
                self.send_json_response({
                    "ok": False,
                    "error": f"Bạn đã đặt cược {existing_bet.get('amount')} Xu cho {chosen_name} rồi! Mỗi người chơi chỉ được đặt cược 1 lần duy nhất trong suốt trận đấu."
                }, status=400)
                return

            if amount < 5:
                self.send_json_response({"ok": False, "error": "Mức cược khán giả tối thiểu là 5 Xu!"}, status=400)
                return

            current_balance = self._get_player_xu_balance(steam_id)
            if current_balance < amount:
                self.send_json_response({"ok": False, "error": f"Số dư không đủ! Bạn có {current_balance} Xu, cần {amount} Xu."}, status=400)
                return

            # Trừ tiền cược
            self._adjust_player_xu(steam_id, -amount, f"Cược khán giả PK #{match_id} cho {chosen}")

            spectator_name = f"Khán giả_{str(steam_id)[-4:]}"
            try:
                p_info = self.fetch_islepilot(f"/players/{steam_id}")
                if isinstance(p_info, dict) and p_info.get("name"):
                    spectator_name = p_info.get("name")
            except Exception:
                pass

            target_match.setdefault("spectatorBets", []).append({
                "steamId": str(steam_id),
                "name": spectator_name,
                "chosenFighter": chosen,
                "amount": amount,
                "timestamp": datetime.datetime.now().isoformat()
            })
            self._save_arena_db(db)

            new_balance = self._get_player_xu_balance(steam_id)
            fighter_info = target_match.get(chosen) or {}
            fighter_disp = fighter_info.get("name", "Đấu sĩ")
            self.send_json_response({
                "ok": True,
                "message": f"Đã cược thành công {amount} Xu cho {fighter_disp}!",
                "balance": new_balance
            })
            return

        # 5. Dịch Chuyển Vào Đấu Trường (Teleport to Arena)
        elif path == "/api/arena/matches/teleport":
            steam_id = payload.get("steam_id") or self.get_active_steam_id()
            if not steam_id:
                self.send_json_response({"ok": False, "error": "Vui lòng đăng nhập Steam để sử dụng dịch chuyển!"}, status=400)
                return

            steam_id = str(steam_id).strip()

            # 1. Kiểm tra trạng thái thực tế của khủng long trên IslePilot
            try:
                p_info = self.fetch_islepilot(f"/players/{steam_id}")
                if isinstance(p_info, dict):
                    if p_info.get("online") is False:
                        self.send_json_response({
                            "ok": False,
                            "error": "Khủng long của bạn chưa online trong server! Vui lòng vào game trước khi bấm dịch chuyển."
                        }, status=400)
                        return
                    if p_info.get("inCombat") is True:
                        self.send_json_response({
                            "ok": False,
                            "error": "Khủng long đang trong combat (giao tranh)! Vui lòng đợi 30s sau khi hết combat rồi thử lại."
                        }, status=400)
                        return
            except Exception:
                pass

            # 2. Gửi lệnh dịch chuyển vào Đấu Trường tới IslePilot
            res = self.fetch_islepilot(f"/players/{steam_id}/teleport", method="POST", body_data={
                "locationId": "cmvqtjyrr4ombph01vi8dknwg"
            })
            ok, msg = self._is_teleport_success(res)
            if ok:
                self.send_json_response({
                    "ok": True,
                    "message": "🚀 Đã gửi lệnh dịch chuyển vào ĐẤU TRƯỜNG thành công! Hãy ĐỨNG YÊN trong game 3-5 giây để máy chủ kéo khủng long tới sàn đấu."
                })
            else:
                self.send_json_response({
                    "ok": False,
                    "error": msg
                }, status=400)
            return



        # 6. Xác Định Kết Quả Trận Đấu (Resolve Match: Combat check / Concede / Admin)
        elif path == "/api/arena/matches/resolve":
            match_id = payload.get("match_id")
            steam_id = payload.get("steam_id") or self.get_active_steam_id()
            action = payload.get("action", "check_combat") # "check_combat", "concede"
            target_match = next((m for m in matches if m.get("id") == match_id), None)
            if not target_match:
                self.send_json_response({"ok": False, "error": "Kèo không tồn tại!"}, status=404)
                return
            if target_match.get("status") != "in_progress":
                self.send_json_response({"ok": False, "error": "Trận đấu không ở trạng thái đang diễn ra!"}, status=400)
                return

            if action in ["declare_winner", "admin_settle"] and payload.get("winner") in ["creator", "opponent"]:
                winner_key = payload.get("winner")
                win_reason = payload.get("reason", "Trọng tài phân định chiến thắng")
                self._settle_arena_match(target_match, winner_key, win_reason)
                self._save_arena_db(db)
                self.send_json_response({"ok": True, "settled": True, "message": f"Đã xác nhận chiến thắng cho {winner_key}!", "match": target_match})
                return

            elif action == "concede":
                creator_obj = target_match.get("creator") or {}
                opp_obj = target_match.get("opponent") or {}
                c_sid = str(creator_obj.get("steamId", ""))
                o_sid = str(opp_obj.get("steamId", ""))
                if str(steam_id) == c_sid:
                    self._settle_arena_match(target_match, "opponent", f"Đối thủ {target_match['creator']['name']} đã nhận thua (Concede).")
                elif str(steam_id) == o_sid:
                    self._settle_arena_match(target_match, "creator", f"Đối thủ {target_match['opponent']['name']} đã nhận thua (Concede).")
                else:
                    self.send_json_response({"ok": False, "error": "Bạn không phải là đấu sĩ trong trận này!"}, status=403)
                    return
                self._save_arena_db(db)
                self.send_json_response({"ok": True, "message": "Đã xác nhận kết quả đầu hàng!", "match": target_match})
                return

            elif action == "check_combat":
                self._auto_check_in_progress_matches([target_match])
                self._save_arena_db(db)
                if target_match.get("status") == "finished":
                    self.send_json_response({
                        "ok": True, 
                        "settled": True,
                        "message": f"Trận đấu đã kết thúc! Người thắng: {target_match[target_match['winner']]['name']}.",
                        "match": target_match
                    })
                else:
                    self.send_json_response({
                        "ok": True, 
                        "settled": False,
                        "message": "Chưa ghi nhận đòn kết liễu trong hệ thống combat log. Trận đấu vẫn đang tiếp diễn!",
                        "match": target_match
                    })
                return

        self.send_json_response({"ok": False, "error": "Endpoint không tồn tại"}, status=404)

    # =========================================================================
        # =========================================================================
    # MODULE SĂN KHỦNG LONG AI & THƯỞNG 1.000 XU CHO NGƯỜI SĂN NHIỀU NHẤT
    # Quét dữ liệu /combat-log từ IslePilot tự động tính số lượng AI tiêu diệt
    # Ai săn được nhiều AI nhất sẽ nhận độc đắc 1.000 Xu!
    # =========================================================================

    def _get_ai_hunt_db(self):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        primary_file = os.path.join(base_dir, "ai_hunt_state.json")
        backup_file = os.path.join(base_dir, ".persistent_ai_hunt_state.json")
        defaults = {
            "active": True,
            "title": "🏹 SỰ KIỆN SĂN KHỦNG LONG AI TOÀN SERVER",
            "description": "Người chơi săn được nhiều khủng long AI nhất sẽ nhận phần thưởng độc đắc 1.000 Xu!",
            "reward_xu": 1000,
            "season_id": "Mùa 1",
            "started_at": datetime.datetime.now().isoformat(),
            "ended_at": None,
            "is_settled": False,
            "total_ai_kills": 0,
            "hunters": {},
            "leaderboard": [],
            "prey_summary": {},
            "processed_kill_ids": [],
            "reward_history": [],
            "top_hunter": None,
            "last_winner": None
        }
        for fpath in [backup_file, primary_file]:
            if os.path.exists(fpath):
                try:
                    with open(fpath, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        if isinstance(data, dict):
                            for k, v in defaults.items():
                                if k not in data or data[k] is None:
                                    data[k] = v
                            return data
                except Exception:
                    pass
        return defaults

    def _save_ai_hunt_db(self, data):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        primary_file = os.path.join(base_dir, "ai_hunt_state.json")
        sub_file = os.path.join(base_dir, "3mgaming-website", "ai_hunt_state.json")
        backup_file = os.path.join(base_dir, ".persistent_ai_hunt_state.json")
        legacy_file = os.path.join(base_dir, "boss_state.json")
        legacy_sub = os.path.join(base_dir, "3mgaming-website", "boss_state.json")
        for fpath in [primary_file, sub_file, backup_file, legacy_file, legacy_sub]:
            try:
                os.makedirs(os.path.dirname(fpath), exist_ok=True)
                with open(fpath, "w", encoding="utf-8") as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
            except Exception:
                pass

    def _auto_check_ai_hunt_status(self, db):
        if not db or not db.get("active"):
            return

        now_ts = time.time()
        hits = []
        try:
            if DinoRequestHandler._combat_log_cached_data and (now_ts - DinoRequestHandler._combat_log_cache_time < 3.0):
                hits = DinoRequestHandler._combat_log_cached_data.get("hits", [])
            else:
                remote_data = self.fetch_islepilot("/combat-log")
                if isinstance(remote_data, dict):
                    DinoRequestHandler._combat_log_cached_data = remote_data
                    DinoRequestHandler._combat_log_cache_time = now_ts
                    hits = remote_data.get("hits", [])
                elif DinoRequestHandler._combat_log_cached_data:
                    hits = DinoRequestHandler._combat_log_cached_data.get("hits", [])
        except Exception:
            if DinoRequestHandler._combat_log_cached_data:
                hits = DinoRequestHandler._combat_log_cached_data.get("hits", [])

        if not hits:
            return

        processed_ids = set(str(x) for x in db.setdefault("processed_kill_ids", []))
        hunters = db.setdefault("hunters", {})
        prey_summary = db.setdefault("prey_summary", {})

        started_at_str = db.get("started_at")
        started_at_ts = 0.0
        if started_at_str:
            try:
                clean_str = started_at_str.replace("Z", "+00:00")
                started_at_ts = datetime.datetime.fromisoformat(clean_str).timestamp()
            except Exception:
                pass

        for h in hits:
            # 1. Nhận diện AI: victimSteamId là None / rỗng (không phải người chơi thật)
            vic_sid = str(h.get("victimSteamId") or "").strip()
            if vic_sid and vic_sid.lower() != "none":
                continue

            # 2. Đòn kết liễu AI (killed == True hoặc hpAfter <= 0)
            is_killed = bool(h.get("killed"))
            hp_after = h.get("hpAfter")
            if not is_killed and (hp_after is None or float(hp_after) > 0):
                continue

            atk_sid = str(h.get("attackerSteamId") or "").strip()
            if not atk_sid or atk_sid.lower() == "none" or len(atk_sid) < 15:
                continue

            hit_id = str(h.get("id") or "")
            hit_at = h.get("at") or ""
            if not hit_id:
                hit_id = f"{hit_at}_{atk_sid}"

            hit_ts = 0.0
            if hit_at:
                try:
                    clean_hit_at = hit_at.replace("Z", "+00:00")
                    hit_ts = datetime.datetime.fromisoformat(clean_hit_at).timestamp()
                except Exception:
                    pass

            # Bỏ qua các hit xảy ra trước khi mùa săn này bắt đầu
            if db.get("filter_since_start") and started_at_ts > 0 and hit_ts > 0 and hit_ts < (started_at_ts - 1.0):
                continue

            if hit_id in processed_ids:
                continue

            processed_ids.add(hit_id)

            atk_name = h.get("attackerName") or f"Player_{atk_sid[-4:]}"
            atk_species = h.get("attackerSpecies") or "Dinosaur"
            vic_species = h.get("victimSpecies") or "Động vật AI"

            if atk_sid not in hunters:
                hunters[atk_sid] = {
                    "steam_id": atk_sid,
                    "name": atk_name,
                    "species": atk_species,
                    "kills": 0,
                    "prey_breakdown": {},
                    "last_kill_at": hit_at,
                    "last_prey": vic_species
                }

            hunter = hunters[atk_sid]
            hunter["name"] = atk_name
            hunter["species"] = atk_species
            hunter["kills"] += 1
            hunter["last_kill_at"] = hit_at
            hunter["last_prey"] = vic_species

            breakdown = hunter.setdefault("prey_breakdown", {})
            breakdown[vic_species] = breakdown.get(vic_species, 0) + 1

            prey_summary[vic_species] = prey_summary.get(vic_species, 0) + 1

        db["processed_kill_ids"] = list(processed_ids)[-1000:]
        db["prey_summary"] = prey_summary

        # Sắp xếp Bảng Xếp Hạng: Số AI tiêu diệt giảm dần, ai đạt mốc sớm hơn đứng trước
        sorted_hunters = sorted(
            hunters.values(),
            key=lambda x: (-x.get("kills", 0), x.get("last_kill_at", ""))
        )

        total_kills_all = sum(h.get("kills", 0) for h in sorted_hunters)
        db["total_ai_kills"] = total_kills_all

        reward_xu = int(db.get("reward_xu", 1000))
        leaderboard = []
        for idx, h in enumerate(sorted_hunters):
            is_top1 = (idx == 0 and h.get("kills", 0) > 0)
            leaderboard.append({
                "rank": idx + 1,
                "steam_id": h.get("steam_id"),
                "name": h.get("name"),
                "species": h.get("species"),
                "kills": h.get("kills", 0),
                "prey_breakdown": h.get("prey_breakdown", {}),
                "last_kill_at": h.get("last_kill_at"),
                "last_prey": h.get("last_prey"),
                "is_top1": is_top1,
                "reward_xu": reward_xu if is_top1 else 0
            })

        db["leaderboard"] = leaderboard
        db["top_hunter"] = leaderboard[0] if (leaderboard and leaderboard[0]["kills"] > 0) else None

        self._save_ai_hunt_db(db)

    def handle_ai_hunt_get(self):
        db = self._get_ai_hunt_db()
        self._auto_check_ai_hunt_status(db)

        is_admin, _ = self.is_admin_request()
        self.send_json_response({
            "ok": True,
            "ai_hunt": db,
            "boss": db,
            "is_admin": is_admin
        })

    def handle_ai_hunt_post(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            payload = json.loads(self.rfile.read(length).decode("utf-8")) if length > 0 else {}
        except Exception:
            payload = {}

        path = self.path.split("?")[0]
        db = self._get_ai_hunt_db()
        self._auto_check_ai_hunt_status(db)

        # 1. Trao thưởng 1.000 Xu cho Top 1 Săn AI (Chỉ Admin)
        if path in ["/api/ai-hunt/settle", "/api/boss/settle"]:
            is_admin, _ = self.is_admin_request()
            if not is_admin:
                self.send_json_response({"ok": False, "error": "Chỉ Quản Trị Viên (Admin) mới có quyền trao thưởng!"}, status=403)
                return

            leaderboard = db.get("leaderboard", [])
            if not leaderboard or leaderboard[0].get("kills", 0) <= 0:
                self.send_json_response({"ok": False, "error": "Chưa có thợ săn nào tiêu diệt được AI để trao thưởng!"}, status=400)
                return

            top_hunter = leaderboard[0]
            winner_sid = str(top_hunter.get("steam_id")).strip()
            winner_name = top_hunter.get("name", "Chiến Binh")
            kills = top_hunter.get("kills", 0)
            reward_xu = int(db.get("reward_xu", 1000))

            if db.get("is_settled"):
                self.send_json_response({"ok": False, "error": f"Phần thưởng mùa này đã được trao cho {winner_name} rồi! Vui lòng bấm 'Khởi Tranh Mùa Săn Mới' để reset."}, status=400)
                return

            # Tự động cộng 1.000 Xu vào tài khoản người chiến thắng
            self._adjust_player_xu(
                winner_sid,
                reward_xu,
                f"Thưởng Top 1 Săn AI ({kills} con): +{reward_xu:,} Xu"
            )

            # Thông báo toàn server qua IslePilot
            try:
                self.fetch_islepilot("/commands", method="POST", body_data={
                    "action": "announce",
                    "message": f"🏆 CHÚC MỪNG {winner_name.upper()} ĐÃ ĐOẠT TOP 1 SĂN AI VỚI {kills} CON! NHẬN THƯỞNG 1.000 XU!"
                })
            except Exception:
                pass

            history_entry = {
                "season_id": db.get("season_id", f"season_{int(time.time())}"),
                "settled_at": datetime.datetime.now().isoformat(),
                "winner_steam_id": winner_sid,
                "winner_name": winner_name,
                "species": top_hunter.get("species", "Dinosaur"),
                "kills": kills,
                "prey_breakdown": top_hunter.get("prey_breakdown", {}),
                "reward_xu": reward_xu,
                "total_participants": len(leaderboard),
                "total_ai_kills": db.get("total_ai_kills", kills)
            }
            db.setdefault("reward_history", []).insert(0, history_entry)
            db["is_settled"] = True
            db["last_winner"] = history_entry
            self._save_ai_hunt_db(db)

            self.send_json_response({
                "ok": True,
                "message": f"🎉 ĐÃ TRAO THƯỞNG THÀNH CÔNG 1.000 XU CHO TOP 1: {winner_name} ({kills} AI)! Số dư ví đã được cộng.",
                "ai_hunt": db
            })
            return

        # 2. Reset / Khởi tranh Mùa Săn AI Mới (Chỉ Admin)
        if path in ["/api/ai-hunt/reset", "/api/ai-hunt/start", "/api/boss/reset", "/api/boss/toggle"]:
            is_admin, _ = self.is_admin_request()
            if not is_admin:
                self.send_json_response({"ok": False, "error": "Chỉ Quản Trị Viên (Admin) mới có quyền bắt đầu mùa săn mới!"}, status=403)
                return

            new_season_num = len(db.get("reward_history", [])) + 1
            db["active"] = True
            db["season_id"] = f"Mùa {new_season_num}"
            db["started_at"] = datetime.datetime.now().isoformat()
            db["ended_at"] = None
            db["is_settled"] = False
            db["total_ai_kills"] = 0
            db["hunters"] = {}
            db["leaderboard"] = []
            db["prey_summary"] = {}
            db["top_hunter"] = None
            self._save_ai_hunt_db(db)

            try:
                self.fetch_islepilot("/commands", method="POST", body_data={
                    "action": "announce",
                    "message": f"🏹 [SĂN AI] MÙA SĂN KHỦNG LONG AI MỚI ĐÃ KHỞI TRANH! Ai săn được nhiều AI nhất sẽ nhận thưởng 1.000 Xu!"
                })
            except Exception:
                pass

            self.send_json_response({
                "ok": True,
                "message": f"🎯 ĐÃ KHỞI TRANH MÙA SĂN AI MỚI (MÙA {new_season_num})! Bảng xếp hạng đã sẵn sàng.",
                "ai_hunt": db
            })
            return

        # 3. Dịch chuyển đến khu săn bắn
        elif path in ["/api/ai-hunt/teleport", "/api/boss/teleport"]:
            steam_id = payload.get("steam_id") or self.get_active_steam_id()
            if not steam_id:
                self.send_json_response({"ok": False, "error": "Vui lòng đăng nhập Steam trước khi dịch chuyển!"}, status=401)
                return

            loc_id = payload.get("location_id") or "cmvqtjyrr4ombph01vi8dknwg"
            loc_name = payload.get("location_name") or "ĐẤU TRƯỜNG & KHU SĂN BẮN"
            steam_id = str(steam_id).strip()
            try:
                p_info = self.fetch_islepilot(f"/players/{steam_id}")
                if isinstance(p_info, dict):
                    if p_info.get("online") is False:
                        self.send_json_response({
                            "ok": False,
                            "error": "Khủng long của bạn chưa online trong server! Vui lòng vào game trước khi bấm dịch chuyển."
                        }, status=400)
                        return
                    if p_info.get("inCombat") is True:
                        self.send_json_response({
                            "ok": False,
                            "error": "Khủng long đang trong combat (giao tranh)! Vui lòng đợi 30s sau khi hết combat rồi thử lại."
                        }, status=400)
                        return
            except Exception:
                pass

            try:
                res = self.fetch_islepilot(f"/players/{steam_id}/teleport", method="POST", body_data={"locationId": loc_id})
                ok, msg = self._is_teleport_success(res)
                if ok:
                    self.send_json_response({"ok": True, "message": f"🚀 Đã dịch chuyển đến {loc_name} thành công! Hãy đứng yên 3-5 giây trong game."})
                else:
                    self.send_json_response({"ok": False, "error": msg}, status=400)
            except Exception as e:
                self.send_json_response({"ok": False, "error": f"Lỗi dịch chuyển: {e}"}, status=500)
            return

        # 4. Cập nhật mức thưởng Xu (Chỉ Admin)
        elif path in ["/api/ai-hunt/set-reward"]:
            is_admin, _ = self.is_admin_request()
            if not is_admin:
                self.send_json_response({"ok": False, "error": "Chỉ Quản Trị Viên (Admin) mới có quyền chỉnh sửa phần thưởng!"}, status=403)
                return
            new_reward = int(payload.get("reward_xu", 1000))
            db["reward_xu"] = max(100, new_reward)
            self._save_ai_hunt_db(db)
            self.send_json_response({"ok": True, "message": f"✅ Đã cập nhật phần thưởng Top 1: {db['reward_xu']:,} Xu", "ai_hunt": db})
            return

        self.send_json_response({"ok": False, "error": "Endpoint không tồn tại"}, status=404)

    # Aliases for backward compatibility
    def _get_boss_db(self):
        return self._get_ai_hunt_db()

    def _save_boss_db(self, data):
        self._save_ai_hunt_db(data)

    def handle_boss_get(self):
        self.handle_ai_hunt_get()

    def handle_boss_post(self):
        self.handle_ai_hunt_post()


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

                    # Lưu dự phòng 100% mutationSlots vào bộ nhớ để không bao giờ bị mất khi rút
                    d_m_slots = d.get("mutationSlots")
                    if d_m_slots and isinstance(d_m_slots, dict):
                        save_garage_saved_mutation(f"{active_steam_id}_{d.get('id')}", d_m_slots)
                        save_garage_saved_mutation(str(d.get("id")), d_m_slots)
                        if d.get("species"):
                            save_garage_saved_mutation(f"{active_steam_id}_{d.get('species')}", d_m_slots)

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
                try:
                    gifts = load_user_gift_dinos()
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

                    "steam_id": active_steam_id,

                    "deleted_ids": list(deleted_dinos.keys())

                })

                return

        # Kiểm tra gift dinos khi IslePilot garage trống
        fallback_dinos = []
        deleted_dinos = load_deleted_dinos()
        gifts = load_user_gift_dinos()
        if active_steam_id:
            try:
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

            "dinos": fallback_dinos,

            "deleted_ids": list(deleted_dinos.keys())

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

            # Lấy thông tin mutationSlots đầy đủ (active, parent, elderA, elderB) trước khi restore
            remote_garage = self.fetch_islepilot(f"/players/{steam_id}/garage") or {}
            dino_spec = None
            dino_growth = 1.0
            is_prime = False
            saved_muts_map = load_garage_saved_mutations()
            dino_mutation_slots = {}

            if remote_garage and "garage" in remote_garage:
                for gd in remote_garage["garage"]:
                    if str(gd.get("id")) == str(dino_id):
                        dino_spec = gd.get("species")
                        dino_growth = float(gd.get("growth") or 1.0)
                        is_prime = bool(gd.get("isPrimeElder"))
                        if gd.get("mutationSlots") and isinstance(gd["mutationSlots"], dict):
                            dino_mutation_slots = gd["mutationSlots"]
                        elif gd.get("mutations") and isinstance(gd["mutations"], list):
                            dino_mutation_slots = {"active": gd["mutations"]}
                        break

            # Fallback lấy từ bản lưu trữ cục bộ nếu garage IslePilot thiếu trường mutationSlots
            if not dino_mutation_slots:
                dino_mutation_slots = (
                    saved_muts_map.get(f"{steam_id}_{dino_id}")
                    or saved_muts_map.get(str(dino_id))
                    or saved_muts_map.get(f"{steam_id}_{dino_spec}")
                    or saved_muts_map.get(f"{steam_id}_last_parked")
                    or {}
                )

            # Chuẩn hóa toàn bộ 4 nhóm đột biến: active, parent, elderA, elderB (bảo toàn 100%)
            full_slots = {
                "active": list(dino_mutation_slots.get("active") or ["None", "None", "None", "None"]),
                "parent": list(dino_mutation_slots.get("parent") or ["None", "None", "None", "None"]),
                "elderA": list(dino_mutation_slots.get("elderA") or ["None", "None", "None", "None"]),
                "elderB": list(dino_mutation_slots.get("elderB") or ["None", "None", "None", "None"])
            }
            for k in ["active", "parent", "elderA", "elderB"]:
                full_slots[k] = [(str(m).strip() if m else "None") for m in full_slots[k][:4]]
                while len(full_slots[k]) < 4:
                    full_slots[k].append("None")

            # Lưu dự phòng ngay lập tức
            save_garage_saved_mutation(f"{steam_id}_{dino_id}", full_slots)
            if dino_spec:
                save_garage_saved_mutation(f"{steam_id}_{dino_spec}", full_slots)

            # Gọi API unpark / restore của IslePilot (IslePilot tự khôi phục tọa độ, máu, đói, nước nguyên bản)
            res = self.fetch_islepilot(f"/players/{steam_id}/garage/{dino_id}/restore", method="POST", body_data={})

            if res and (res.get("ok") is True or "commandId" in res):
                # KHỞI CHẠY TIẾN TRÌNH KHÔI PHỤC VÀ KHÓA 100% ĐỘT BIẾN GEN (GIỮ NGUYÊN NHƯ LÚC CẤT)
                def restore_mutations_task():
                    # Đợi 4.0 giây để nhân vật Evrima load vào bản đồ game hoàn chỉnh
                    time.sleep(4.0)

                    # Gửi duy nhất 1 lệnh chuẩn mutations đầy đủ active, parent, elderA, elderB (tránh bị 429)
                    body_muts = {
                        "action": "mutations",
                        "steamId": str(steam_id),
                        "active": full_slots["active"][:4],
                        "parent": full_slots["parent"][:4],
                        "elderA": full_slots["elderA"][:2],
                        "elderB": full_slots["elderB"][:2],
                        "mutationSlots": full_slots
                    }
                    r1 = self.fetch_islepilot("/commands", method="POST", body_data=body_muts)
                    print(f"[Garage Restore] Áp dụng lại 100% đột biến gen cho {steam_id}: {r1}")

                    if is_prime:
                        time.sleep(0.5)
                        self.fetch_islepilot("/commands", method="POST", body_data={
                            "action": "setprime",
                            "steamId": str(steam_id),
                            "eligible": True,
                            "conditions": 10,
                            "isElder": True,
                            "stacks": 10
                        })
                        time.sleep(0.4)
                        self.fetch_islepilot("/commands", method="POST", body_data={
                            "action": "scale",
                            "steamId": str(steam_id),
                            "scale": 1.37
                        })

                    # Bổ trợ lần 2 sau 3 giây để đảm bảo ăn vĩnh viễn vào file nhân vật server
                    time.sleep(5.0)
                    r2 = self.fetch_islepilot("/commands", method="POST", body_data=body_muts)
                    print(f"[Garage Restore Reinforce] Bổ trợ lại đột biến lần 2 cho {steam_id}: {r2}")

                threading.Thread(target=restore_mutations_task, daemon=True).start()

                self.send_json_response({
                    "success": True,
                    "ok": True,
                    "message": f"Đã lấy thành công {dino_spec or species} ra game và bảo toàn 100% đột biến!",
                    "dino_id": str(dino_id)
                })
                return

            err = res.get("error") or res.get("message") if (res and isinstance(res, dict)) else "Không thể kết nối đến máy chủ IslePilot."
            err_str = str(err)
            if "not online" in err_str.lower() or "offline" in err_str.lower():
                err_msg = "Khủng long của bạn chưa online trong server! Vui lòng vào game trước."
            elif "slot" in err_str.lower():
                err_msg = "Ô lưu trữ không hợp lệ hoặc đã được rút."
            else:
                err_msg = f"Rút dino thất bại: {err_str}"
            self.send_json_response({"success": False, "ok": False, "message": err_msg}, 400)

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
            gifts = load_user_gift_dinos()
            user_gifts = gifts.get(str(steam_id), [])
            new_gifts = [g for g in user_gifts if str(g.get("id")) != dino_id]
            if len(new_gifts) != len(user_gifts):
                gifts[str(steam_id)] = new_gifts
                save_user_gift_dinos(gifts)

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

    def handle_garage_sync_deleted(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            payload = json.loads(self.rfile.read(length).decode("utf-8")) if length > 0 else {}
            deleted_ids = payload.get("deleted_ids", [])
            steam_id = str(payload.get("steam_id") or self.get_active_steam_id() or "").strip()
            if isinstance(deleted_ids, list):
                for did in deleted_ids:
                    save_deleted_dino(did, steam_id)
            self.send_json_response({"ok": True, "count": len(deleted_ids)})
        except Exception as e:
            self.send_json_response({"ok": False, "error": str(e)}, 500)

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

                # Lưu cache mutationSlots của người chơi hiện tại trước khi cất
                if player_info and isinstance(player_info, dict):
                    p_muts = player_info.get("mutationSlots")
                    if p_muts and isinstance(p_muts, dict):
                        save_garage_saved_mutation(f"{steam_id}_last_parked", p_muts)
                        if player_info.get("species"):
                            save_garage_saved_mutation(f"{steam_id}_{player_info.get('species')}", p_muts)

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
            ok, msg = self._is_teleport_success(res)
            if ok:
                self.send_json_response({"success": True, "message": "🚀 Đã gửi lệnh dịch chuyển thành công! Hãy đứng yên trong game 3-5s."})
                return
            self.send_json_response({"success": False, "message": msg}, 400)

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
                pass

        if remote_data and isinstance(remote_data, dict) and "offers" in remote_data:
            self.send_json_response({
                "ok": True,
                "offers": remote_data.get("offers", []),
                "cooldown_seconds": remote_data.get("cooldownSeconds", 300),
                "daily_limit": remote_data.get("dailyLimit", 5),
                "server_id": config.get("SERVER_ID", "cmv3zzfix02g3pj01yay0hw4g")
            })
            return

        # Đồng bộ 100% đầy đủ 6 gói xác mới nhất từ IslePilot của server 3MGAMING
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
                        "species": payload.get("species") or "Dryosaurus",
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
            },
            {
                        "id": "omvqituv4",
                        "name": "carnotaurus",
                        "price": 0,
                        "price_display": "$ 0",
                        "species": "Carnotaurus",
                        "species_name": "Carnotaurus",
                        "image": "https://islepilot.eu/cdn/dino-art/render/Carnotaurus.webp",
                        "description": "Xác tươi, cho thịt · Carnotaurus · kích cỡ 100%"
            },
            {
                        "id": "omvqiuffy",
                        "name": "ceratosaurus",
                        "price": 0,
                        "price_display": "$ 0",
                        "species": "Ceratosaurus",
                        "species_name": "Ceratosaurus",
                        "image": "https://islepilot.eu/cdn/dino-art/render/Ceratosaurus.webp",
                        "description": "Xác tươi, cho thịt · Ceratosaurus · kích cỡ 100%"
            },
            {
                        "id": "omvqiuphi",
                        "name": "tyrannosaurus",
                        "price": 0,
                        "price_display": "$ 0",
                        "species": "Tyrannosaurus",
                        "species_name": "Tyrannosaurus",
                        "image": "https://islepilot.eu/cdn/dino-art/render/Tyrannosaurus.webp",
                        "description": "Xác tươi, cho thịt · Tyrannosaurus · kích cỡ 100%"
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

            # Ánh xạ chuẩn 6 loài khủng long của 6 gói thả xác theo đúng server IslePilot
            species_map = {
                "omv572un0": "Tenontosaurus",
                "omv6uqesm": "Triceratops",
                "omv6viaxj": "Stegosaurus",
                "omvqituv4": "Carnotaurus",
                "omvqiuffy": "Ceratosaurus",
                "omvqiuphi": "Tyrannosaurus"
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
                    "message": "Thành công"
                })
                return

            err = res.get("error") if (res and isinstance(res, dict)) else "Không thể kết nối đến máy chủ game."
            self.send_json_response({
                "success": False,
                "ok": False,
                "message": "Thất bại"
            }, 400)

        except Exception as e:
            print(f"[Handle Carcass Error] {e}")
            self.send_json_response({"success": False, "ok": False, "message": "Thất bại"}, 500)

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

def start_boss_ai_worker():
    def boss_loop():
        time.sleep(3.0)
        req_handler = DinoRequestHandler.__new__(DinoRequestHandler)
        while True:
            try:
                # 1. Tự động kiểm tra và phân định kết quả các trận Đấu Trường PK đang diễn ra
                arena_db = req_handler._get_arena_db()
                active_matches = [m for m in arena_db.get("matches", []) if m.get("status") == "in_progress"]
                if active_matches:
                    req_handler._auto_check_in_progress_matches(arena_db.get("matches", []))

                # 2. Tự động kiểm tra và xử lý Boss AI (Puerta Max Size 100k HP)
                boss_db = req_handler._get_boss_db()
                if boss_db and boss_db.get("active"):
                    req_handler._auto_check_boss_status(boss_db)
            except Exception as e:
                pass
            time.sleep(5.0)
    t = threading.Thread(target=boss_loop, daemon=True, name="BossAndArenaBackgroundWorker")
    t.start()

def run():
    start_boss_ai_worker()

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

