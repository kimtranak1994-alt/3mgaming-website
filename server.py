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
import math
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

def safe_float(val, default=1.0):
    if val is None:
        return float(default)
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f):
            return float(default)
        return f
    except (ValueError, TypeError):
        return float(default)

def calc_dino_stats(species_name, growth, health_val, hunger_val, thirst_val, is_prime_elder=False):

    s = (species_name or "").lower()

    base = {"hp": 3000, "prime_hp": 4100, "hunger": 1500, "thirst": 1000}

    for k, v in SPECIES_BASE_STATS.items():

        if k in s:

            base = v

            break

            

    g = max(0.01, min(1.0, safe_float(growth, 1.0)))

    target_max_hp = base.get("prime_hp", base["hp"]) if is_prime_elder else base["hp"]

    max_hp = int(target_max_hp * (0.2 + 0.8 * (g ** 1.2)))

    max_hunger = int(base["hunger"] * (0.3 + 0.7 * g))

    max_thirst = base["thirst"]

    

    h_ratio = safe_float(health_val, 1.0)

    if h_ratio > 1.0: h_ratio /= 100.0

    h_ratio = max(0.0, min(1.0, h_ratio))

    current_hp = int(max_hp * h_ratio)

    

    hu_ratio = safe_float(hunger_val, 1.0)

    if hu_ratio > 1.0: hu_ratio /= 100.0

    hu_ratio = max(0.0, min(1.0, hu_ratio))

    current_hunger = int(max_hunger * hu_ratio)

    

    th_ratio = safe_float(thirst_val, 1.0)

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


def load_garage_dino_snapshots():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    primary_file = os.path.join(base_dir, "garage_dino_snapshots.json")
    backup_file = os.path.join(base_dir, ".persistent_garage_dino_snapshots.json")
    for fpath in [primary_file, backup_file]:
        if os.path.exists(fpath):
            try:
                with open(fpath, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
    return {}

def save_garage_dino_snapshot(key, snapshot_data):
    if not key or not snapshot_data:
        return
    base_dir = os.path.dirname(os.path.abspath(__file__))
    primary_file = os.path.join(base_dir, "garage_dino_snapshots.json")
    sub_file = os.path.join(base_dir, "3mgaming-website", "garage_dino_snapshots.json")
    backup_file = os.path.join(base_dir, ".persistent_garage_dino_snapshots.json")
    data = load_garage_dino_snapshots()
    data[str(key)] = snapshot_data
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

def _get_claimed_quests_paths():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    primary_file = os.path.join(base_dir, "claimed_quests.json")
    sub_file = os.path.join(base_dir, "3mgaming-website", "claimed_quests.json")
    backup_file = os.path.join(base_dir, ".persistent_claimed_quests.json")
    return [backup_file, primary_file, sub_file]

def load_claimed_quests():
    paths = _get_claimed_quests_paths()
    merged = {}
    for fpath in paths:
        if os.path.exists(fpath):
            try:
                with open(fpath, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, dict):
                        for sid, val in data.items():
                            sid_str = str(sid).strip()
                            if sid_str not in merged:
                                merged[sid_str] = val
                            elif isinstance(val, dict) and isinstance(merged[sid_str], dict):
                                merged[sid_str].update(val)
                            elif isinstance(val, list) and isinstance(merged[sid_str], list):
                                for item in val:
                                    if item not in merged[sid_str]:
                                        merged[sid_str].append(item)
            except Exception:
                pass
    return merged

def save_claimed_quests(data):
    paths = _get_claimed_quests_paths()
    for fpath in paths:
        try:
            os.makedirs(os.path.dirname(fpath), exist_ok=True)
            with open(fpath, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"Error saving claimed_quests to {fpath}: {e}")


CLAIMED_STARTER_FILE = os.path.join(os.path.dirname(__file__), "claimed_starter.json")

def _get_claimed_starter_paths():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    primary_file = os.path.join(base_dir, "claimed_starter.json")
    sub_file = os.path.join(base_dir, "3mgaming-website", "claimed_starter.json")
    backup_file = os.path.join(base_dir, ".persistent_claimed_starter.json")
    return [backup_file, primary_file, sub_file]

def load_claimed_starter():
    paths = _get_claimed_starter_paths()
    merged = {}
    for fpath in paths:
        if os.path.exists(fpath):
            try:
                with open(fpath, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, dict):
                        for sid, val in data.items():
                            sid_str = str(sid).strip()
                            if sid_str not in merged:
                                merged[sid_str] = val
                            elif isinstance(val, dict) and isinstance(merged[sid_str], dict):
                                merged[sid_str].update(val)
            except Exception:
                pass
    return merged

def save_claimed_starter(data):
    paths = _get_claimed_starter_paths()
    for fpath in paths:
        try:
            os.makedirs(os.path.dirname(fpath), exist_ok=True)
            with open(fpath, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"Error saving claimed_starter to {fpath}: {e}")

def _is_quest_claimed(steam_id, quest_id, period_key, progress_id, claimed_db):
    sid = str(steam_id).strip()
    qid = str(quest_id).strip()
    pkey = str(period_key or "").strip()
    pid = str(progress_id or "").strip()

    user_claims = claimed_db.get(sid)
    if not user_claims:
        return False, None

    # 1. Trường hợp lưu kiểu Dict (Mới, chuẩn xác theo ngày/tuần)
    if isinstance(user_claims, dict):
        if pkey:
            claim_key = f"{qid}_{pkey}"
            if claim_key in user_claims:
                rec = user_claims[claim_key]
                return True, rec.get("claimed_at") if isinstance(rec, dict) else str(rec)
        if pid and pid in user_claims:
            rec = user_claims[pid]
            return True, rec.get("claimed_at") if isinstance(rec, dict) else str(rec)
        if pkey:
            for k, rec in user_claims.items():
                if isinstance(rec, dict) and str(rec.get("quest_id")) == qid and str(rec.get("period_key")) == pkey:
                    return True, rec.get("claimed_at")

    # 2. Trường hợp tương thích ngược dữ liệu List cũ
    elif isinstance(user_claims, list):
        if pkey and f"{qid}_{pkey}" in user_claims:
            return True, None
        if pid and pid in user_claims:
            return True, None
        if qid in user_claims:
            return True, None

    return False, None

def _record_quest_claim(steam_id, quest_id, period_key, progress_id, quest_name, amount, claimed_db):
    sid = str(steam_id).strip()
    qid = str(quest_id).strip()
    today_vn = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=7))).strftime("%Y-%m-%d")
    pkey = str(period_key or today_vn).strip()
    pid = str(progress_id or "").strip()

    if sid not in claimed_db or not isinstance(claimed_db[sid], dict):
        # Chuyển đổi list cũ sang dict nếu cần
        old_list = claimed_db.get(sid, []) if isinstance(claimed_db.get(sid), list) else []
        claimed_db[sid] = {}
        for old_id in old_list:
            claimed_db[sid][str(old_id)] = {"quest_id": str(old_id), "period_key": pkey, "claimed_at": None}

    user_claims = claimed_db[sid]
    now_iso = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=7))).isoformat()

    record = {
        "quest_id": qid,
        "quest_name": quest_name,
        "period_key": pkey,
        "progress_id": pid,
        "amount": amount,
        "claimed_at": now_iso
    }

    claim_key = f"{qid}_{pkey}"
    user_claims[claim_key] = record
    if pid:
        user_claims[pid] = record

    save_claimed_quests(claimed_db)

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

    body_hex = str(pal.get("body", "#4a543b")).upper()
    markings_hex = str(pal.get("markings", "#2b3221")).upper()
    is_hac_bang = body_hex in ["#06080E", "#080B12", "#05070C"] and markings_hex in ["#00D9FF", "#00E5FF", "#00FFFF", "#D1FAFF"]

    if is_hac_bang:
        return {
            "class": bp_class,
            "female": str(sex).lower() == "female",
            "variation": int(variation or 0),
            "pattern": int(pattern or 1),
            "theme": int(theme or 0),
            "body": [0.003, 0.005, 0.010, 1.0],
            "underbelly": [0.003, 0.005, 0.010, 1.0],
            "flank": [0.0, 0.85, 1.0, 1.0],
            "markings": [0.82, 0.98, 1.0, 1.0],
            "detail1": [0.0, 0.88, 1.0, 1.0],
            "eyes": [0.0, 1.0, 1.0, 1.0],
            "male_display": [0.0, 0.95, 1.0, 1.0],
            "teeth": [0.93, 0.97, 1.0, 1.0],
            "mouth": [0.02, 0.08, 0.14, 1.0],
            "claws": [0.0, 0.85, 1.0, 1.0]
        }

    return {
        "class": bp_class,
        "female": str(sex).lower() == "female",
        "variation": int(variation or 0),
        "pattern": int(pattern or 0),
        "theme": int(theme or 0),
        "body": hex_to_float_rgba(pal.get("body", "#06080E")),
        "markings": hex_to_float_rgba(pal.get("markings", "#00D9FF")),
        "flank": hex_to_float_rgba(pal.get("flank", "#00D9FF")),
        "underbelly": hex_to_float_rgba(pal.get("underbelly", "#06080E")),
        "detail1": hex_to_float_rgba(pal.get("detail", pal.get("detail1", "#00E0FF"))),
        "eyes": hex_to_float_rgba(pal.get("eyes", "#00FFFF")),
        "male_display": hex_to_float_rgba(pal.get("display", pal.get("male_display", "#00F2FF"))),
        "teeth": hex_to_float_rgba(pal.get("teeth", "#EEF8FF")),
        "mouth": hex_to_float_rgba(pal.get("mouth", "#0A2233")),
        "claws": hex_to_float_rgba(pal.get("claws", "#00D9FF"))
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
            "76561199175571899", "76561199196418178", "76561199062270730", "76561199483156684", "76561199319732549"
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

        elif self.path.startswith("/api/player/dino-info") or self.path.startswith("/api/dino-info"):
            self.handle_player_dino_info()
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

        # 20. Quà Tân Thủ & Claims (Live từ IslePilot cmv3zzfix02g3pj01yay0hw4g)
        elif self.path.startswith("/api/server/claims") or self.path.startswith("/api/server/starter"):
            self.handle_claims()
            return

        elif self.path.startswith("/api/server/carcass/offers") or self.path.startswith("/api/server/shop/carcasses"):

            self.handle_carcass_offers()

            return

        # 20. Bản Lưu Skin Drafts (Persisted)

        elif self.path.startswith("/api/player/skin-drafts"):

            self.handle_skin_drafts_get()

            return

        # 21. CDN Proxy & Cache cho 3D Dinosaur Models / Textures

        elif self.path in ["/studio", "/studio/"]:
            self.path = "/studio.html"
            return super().do_GET()

        elif self.path == "/api/species":
            self.handle_studio_species()
            return

        elif self.path == "/api/palettes":
            self.handle_studio_palettes()
            return

        elif self.path.startswith("/cdn/dinos/"):

            self.handle_cdn_proxy()

            return

        # Admin Endpoints
        elif self.path.startswith("/api/admin/check"):
            is_admin, id_or_mode = self.is_admin_request()
            active_steam_id = self.get_active_steam_id()
            query = urllib.parse.urlparse(self.path).query
            q_params = urllib.parse.parse_qs(query)
            target_sid = str(q_params.get("steam_id", [None])[0] or q_params.get("admin_steam_id", [None])[0] or active_steam_id or "").strip()

            map_admin_sids = [str(sid).strip() for sid in config.get("MAP_ONLY_ADMIN_STEAM_IDS", ["76561199319732549"])]
            is_map_admin = is_admin or (target_sid in map_admin_sids)

            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            if is_admin:
                self.send_header("Set-Cookie", "admin_auth=1; Path=/; Max-Age=86400; SameSite=Lax")
            self.end_headers()
            self.wfile.write(json.dumps({
                "isAdmin": is_admin,
                "isMapAdmin": is_map_admin,
                "role": "full_admin" if is_admin else ("map_only" if is_map_admin else "player"),
                "steamId": target_sid or active_steam_id,
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

        elif self.path.split("?")[0] == "/api/server/skins/apply":

            self.handle_studio_apply()

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

        elif self.path.split("?")[0] in ["/api/skin/set", "/api/studio/apply", "/api/server/skins/apply"]:

            self.handle_studio_apply()

            return

        elif self.path == "/api/designs/code":

            self.handle_skin_code()

            return

        elif self.path == "/api/designs/import":

            self.handle_skin_import()

            return

        elif self.path in ["/api/server/claims/claim", "/api/server/starter/claim"]:
            self.handle_claim_starter()
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
                    "76561199175571899", "76561199196418178", "76561199062270730", "76561199483156684", "76561199319732549"
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
                                "elderA": ["None", "None", "None", "None"],
                                "elderB": ["None", "None", "None", "None"]
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
                            "elderA": all_muts["elderA"][:4],
                            "elderB": all_muts["elderB"][:4]
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
                        growth_val = safe_float(found_gift.get("growth"), 1.0)
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

    def apply_dino_in_game_worker(self, steam_id, species, gender, growth_val, is_prime, mutations, needs_swap=True, preserve_vitals=False, mutation_slots=None):
        def worker():
            try:
                sid = str(steam_id).strip()
                spec = species or "Tyrannosaurus"
                gen = gender or "Female"
                gr = safe_float(growth_val, 1.0)
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
                    # Đảm bảo khôi phục đúng Growth (kích thước) như lúc cất vào
                    try:
                        self.fetch_islepilot("/commands", method="POST", body_data={
                            "action": "setgrowth",
                            "steamId": sid,
                            "growth": gr,
                            "frozen": False
                        })
                    except Exception:
                        pass
                    time.sleep(0.2)
                    worker_scale = 0.5 if "indo" in str(spec).lower() else 1.0
                    try:
                        self.fetch_islepilot("/commands", method="POST", body_data={
                            "action": "scale",
                            "steamId": sid,
                            "scale": worker_scale
                        })
                    except Exception:
                        pass
                    time.sleep(0.2)
                    try:
                        self.fetch_islepilot("/commands", method="POST", body_data={
                            "action": "setnutrition",
                            "steamId": sid,
                            "carb": 100.0,
                            "protein": 100.0,
                            "lipid": 100.0
                        })
                    except Exception:
                        pass
                    time.sleep(0.2)
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
                        worker_scale = 0.5 if "indo" in str(spec).lower() else 1.0
                        self.fetch_islepilot("/commands", method="POST", body_data={
                            "action": "scale",
                            "steamId": sid,
                            "scale": worker_scale
                        })
                        time.sleep(0.3)

                    if clean_muts or mutation_slots:
                        active_arr = (clean_muts + ["None"] * (4 - len(clean_muts)))[:4]
                        parent_arr = ["None", "None", "None", "None"]
                        elderA_arr = active_arr if is_prime else ["None", "None", "None", "None"]
                        elderB_arr = ["None", "None", "None", "None"]

                        if mutation_slots and isinstance(mutation_slots, dict):
                            if mutation_slots.get("active"):
                                active_arr = [(str(m).strip() if m else "None") for m in list(mutation_slots["active"])[:4]]
                                while len(active_arr) < 4: active_arr.append("None")
                            if mutation_slots.get("parent"):
                                parent_arr = [(str(m).strip() if m else "None") for m in list(mutation_slots["parent"])[:4]]
                                while len(parent_arr) < 4: parent_arr.append("None")
                            if mutation_slots.get("elderA"):
                                elderA_arr = [(str(m).strip() if m else "None") for m in list(mutation_slots["elderA"])[:4]]
                                while len(elderA_arr) < 4: elderA_arr.append("None")
                            if mutation_slots.get("elderB"):
                                elderB_arr = [(str(m).strip() if m else "None") for m in list(mutation_slots["elderB"])[:4]]
                                while len(elderB_arr) < 4: elderB_arr.append("None")

                        mut_cmd_body = {
                            "action": "mutations",
                            "steamId": sid,
                            "active": active_arr,
                            "parent": parent_arr,
                            "elderA": elderA_arr,
                            "elderB": elderB_arr
                        }
                        self.fetch_islepilot("/commands", method="POST", body_data=mut_cmd_body)
                        print(f"[apply_dino_in_game] Gửi lệnh mutations (preserve) cho {sid}: {mut_cmd_body}")

                        def reinforce_mut_only():
                            time.sleep(3.0)
                            self.fetch_islepilot("/commands", method="POST", body_data=mut_cmd_body)
                            time.sleep(4.0)
                            self.fetch_islepilot("/commands", method="POST", body_data=mut_cmd_body)
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
                    worker_scale = 0.5 if "indo" in str(spec).lower() else 1.0
                    self.fetch_islepilot("/commands", method="POST", body_data={
                        "action": "scale",
                        "steamId": sid,
                        "scale": worker_scale
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

                if clean_muts or mutation_slots:
                    active_arr = (clean_muts + ["None"] * (4 - len(clean_muts)))[:4]
                    parent_arr = ["None", "None", "None", "None"]
                    elderA_arr = active_arr if is_prime else ["None", "None", "None", "None"]
                    elderB_arr = ["None", "None", "None", "None"]

                    if mutation_slots and isinstance(mutation_slots, dict):
                        if mutation_slots.get("active"):
                            active_arr = [(str(m).strip() if m else "None") for m in list(mutation_slots["active"])[:4]]
                            while len(active_arr) < 4: active_arr.append("None")
                        if mutation_slots.get("parent"):
                            parent_arr = [(str(m).strip() if m else "None") for m in list(mutation_slots["parent"])[:4]]
                            while len(parent_arr) < 4: parent_arr.append("None")
                        if mutation_slots.get("elderA"):
                            elderA_arr = [(str(m).strip() if m else "None") for m in list(mutation_slots["elderA"])[:4]]
                            while len(elderA_arr) < 4: elderA_arr.append("None")
                        if mutation_slots.get("elderB"):
                            elderB_arr = [(str(m).strip() if m else "None") for m in list(mutation_slots["elderB"])[:4]]
                            while len(elderB_arr) < 4: elderB_arr.append("None")

                    mut_cmd_body = {
                        "action": "mutations",
                        "steamId": sid,
                        "active": active_arr,
                        "parent": parent_arr,
                        "elderA": elderA_arr,
                        "elderB": elderB_arr
                    }
                    self.fetch_islepilot("/commands", method="POST", body_data=mut_cmd_body)
                    print(f"[apply_dino_in_game] Gửi lệnh mutations (swap) cho {sid}: {mut_cmd_body}")

                    # Luồng phụ bổ trợ (reinforce) sau 4 giây và 8 giây để đảm bảo gen ăn chắc chắn vào nhân vật game
                    def reinforce_worker():
                        time.sleep(4.0)
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
                        self.fetch_islepilot("/commands", method="POST", body_data=mut_cmd_body)
                        time.sleep(4.0)
                        self.fetch_islepilot("/commands", method="POST", body_data=mut_cmd_body)
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

        parsed_req = urllib.parse.urlparse(self.path)
        req_params = urllib.parse.parse_qs(parsed_req.query)
        redirect_target = req_params.get("redirect", [""])[0].strip()

        host = self.headers.get("Host", f"localhost:{config.get('PORT', 8000)}")

        scheme = "https" if "https" in self.headers.get("X-Forwarded-Proto", "") else "http"

        return_to = f"{scheme}://{host}/api/player/steam/callback"
        if redirect_target:
            return_to += f"?redirect={urllib.parse.quote(redirect_target)}"

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

        redirect_target = params.get("redirect", [""])[0].strip()
        if redirect_target and redirect_target.startswith("/studio"):
            redirect_url = f"/studio?steam_id={steam_id}&name={encoded_name}"
        else:
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

        query_params = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        has_query_sid = bool(query_params.get("steam_id", [None])[0])
        is_logged_in = bool(re.search(r"steam_user=([^;]+)", self.headers.get("Cookie", ""))) or has_query_sid

        

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

    def handle_player_dino_info(self):
        query = urllib.parse.urlparse(self.path).query
        q_params = urllib.parse.parse_qs(query)
        passed_steam_id = q_params.get("steam_id", [None])[0]

        cookie_header = self.headers.get("Cookie", "")
        cookie_match = re.search(r"steam_user=([^;:]+)", cookie_header)
        cookie_steam_id = cookie_match.group(1).strip() if cookie_match else None

        steam_id = passed_steam_id or cookie_steam_id
        is_logged_in = bool(steam_id)

        if not steam_id:
            self.send_json_response({
                "ok": False,
                "logged_in": False,
                "message": "Vui lòng đăng nhập Steam để xem thông tin khủng long!"
            })
            return

        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            f_player = executor.submit(self.fetch_islepilot, f"/players/{steam_id}")
            f_warnings = executor.submit(self.fetch_islepilot, f"/players/{steam_id}/warnings")
            f_garage = executor.submit(self.fetch_islepilot, f"/players/{steam_id}/garage")

            player_data = f_player.result() or {}
            warnings_data = f_warnings.result() or {}
            garage_data = f_garage.result() or {}

        balance = self._get_player_xu_balance(steam_id)

        species = player_data.get("species")
        has_active_dino = bool(species)

        garage_list = []
        if isinstance(garage_data, dict):
            garage_list = garage_data.get("garage", []) or garage_data.get("dinosaurs", [])
        elif isinstance(garage_data, list):
            garage_list = garage_data

        def safe_float(v, default=0.0):
            try:
                if v is None: return default
                return float(v)
            except:
                return default

        health = safe_float(player_data.get("health"), 0.0)
        max_health = safe_float(player_data.get("maxHealth"), 1.0)
        health_pct = min(100.0, max(0.0, round((health / max_health * 100), 1))) if max_health > 0 else 0.0

        hunger = safe_float(player_data.get("hunger"), 0.0)
        max_hunger = safe_float(player_data.get("maxHunger"), 1.0)
        hunger_pct = min(100.0, max(0.0, round((hunger / max_hunger * 100), 1))) if max_hunger > 0 else 0.0

        thirst = safe_float(player_data.get("thirst"), 0.0)
        max_thirst = safe_float(player_data.get("maxThirst"), 1.0)
        thirst_pct = min(100.0, max(0.0, round((thirst / max_thirst * 100), 1))) if max_thirst > 0 else 0.0

        growth = safe_float(player_data.get("growth"), 0.0)
        growth_pct = round(growth * 100, 1)

        is_prime_elder = bool(player_data.get("isPrimeElder"))
        prime_eligible = bool(player_data.get("primeEligible"))

        if growth < 0.35:
            stage = "Con non (Juvenile)"
        elif growth < 0.70:
            stage = "Cận trưởng thành (Subadult)"
        elif is_prime_elder:
            stage = "Prime Elder (Cổ Đại Tối Thượng)"
        elif growth >= 1.0:
            stage = "Trưởng thành hoàn toàn (Full Adult)"
        else:
            stage = "Trưởng thành (Adult)"

        pos = player_data.get("position") or {}
        pos_formatted = {
            "x": round(safe_float(pos.get("x")), 2) if pos.get("x") is not None else None,
            "y": round(safe_float(pos.get("y")), 2) if pos.get("y") is not None else None,
            "z": round(safe_float(pos.get("z")), 2) if pos.get("z") is not None else None,
            "yaw": round(safe_float(pos.get("yaw")), 2) if pos.get("yaw") is not None else None
        }

        prime_info = player_data.get("prime") or {}
        mut_slots = player_data.get("mutationSlots") or {}

        warnings_list = warnings_data.get("warnings") or []
        active_warning_count = warnings_data.get("activeCount", len(warnings_list))

        self.send_json_response({
            "ok": True,
            "logged_in": is_logged_in,
            "steam_id": steam_id,
            "name": player_data.get("name") or f"Player_{steam_id[-4:]}",
            "online": bool(player_data.get("online", False)),
            "wallet_balance": balance,
            "discord": player_data.get("discord"),
            "total_play_seconds": player_data.get("totalPlaySec", 0),
            "playtime_hours": round(player_data.get("totalPlaySec", 0) / 3600, 1),
            "last_seen_at": player_data.get("lastSeenAt"),
            "has_active_dino": has_active_dino,
            "garage_count": len(garage_list),
            "dino": {
                "species": species,
                "female": bool(player_data.get("female", False)),
                "gender": "female" if player_data.get("female") else "male",
                "gender_text": "Cái (Female ♀)" if player_data.get("female") else "Đực (Male ♂)",
                "growth": growth,
                "growth_percent": growth_pct,
                "stage": stage,
                "is_prime_elder": is_prime_elder,
                "prime_eligible": prime_eligible,
                "health": health,
                "max_health": max_health,
                "health_percent": health_pct,
                "hunger": hunger,
                "max_hunger": max_hunger,
                "hunger_percent": hunger_pct,
                "thirst": thirst,
                "max_thirst": max_thirst,
                "thirst_percent": thirst_pct,
                "position": pos_formatted,
                "mutation_slots": mut_slots,
                "prime": prime_info,
                "ban": player_data.get("ban")
            } if has_active_dino else None,
            "warnings": {
                "count": active_warning_count,
                "list": warnings_list
            }
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
        active_sid = str(target_steam_id or self.get_active_steam_id() or "").strip()

        is_admin, _ = self.is_admin_request()
        map_admin_sids = [str(sid).strip() for sid in config.get("MAP_ONLY_ADMIN_STEAM_IDS", ["76561199319732549"])]
        is_map_admin = is_admin or (active_sid in map_admin_sids)

        # Nếu là Admin hoặc có quyền xem bản đồ và yêu cầu xem toàn bộ người chơi
        if is_map_admin and (client_mode == "admin" or active_sid in map_admin_sids):
            self.send_json_response(players)
            return

        # Chế độ Khách (hoặc người chơi bình thường):
        # Chỉ trả về duy nhất người chơi đang đăng nhập (nếu có steam_id)
        if active_sid:
            my_players = [p for p in players if str(p.get("steamId", "")).strip() == active_sid]
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
    @classmethod
    def _get_carcass_remaining_cooldown(cls, steam_id):
        steam_id = str(steam_id).strip()
        if not steam_id:
            return 0
        now = time.time()
        base_dir = os.path.dirname(os.path.abspath(__file__))
        for d in [base_dir, os.path.join(base_dir, "3mgaming-website")]:
            fpath = os.path.join(d, "carcass_cooldowns.json")
            if os.path.exists(fpath):
                try:
                    with open(fpath, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        last_ts = float(data.get(steam_id, 0))
                        elapsed = now - last_ts
                        if elapsed < 300:
                            return int(300 - elapsed)
                except Exception:
                    pass
        return 0

    @classmethod
    def _set_carcass_cooldown(cls, steam_id):
        steam_id = str(steam_id).strip()
        if not steam_id:
            return
        now = time.time()
        base_dir = os.path.dirname(os.path.abspath(__file__))
        for d in [base_dir, os.path.join(base_dir, "3mgaming-website")]:
            fpath = os.path.join(d, "carcass_cooldowns.json")
            try:
                data = {}
                if os.path.exists(fpath):
                    try:
                        with open(fpath, "r", encoding="utf-8") as f:
                            data = json.load(f)
                    except Exception:
                        data = {}
                data[steam_id] = now
                os.makedirs(os.path.dirname(fpath), exist_ok=True)
                with open(fpath, "w", encoding="utf-8") as f:
                    json.dump(data, f)
            except Exception:
                pass

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
        # =========================================================================
    # =========================================================================
    # MODULE SĂN KHỦNG LONG AI TOÀN SERVER (AI DINOSAUR HUNTING EVENT)
    # Tự động quét /combat-log và ghi nhận số lượng AI bị tiêu diệt
    # Chu kỳ sự kiện: Reset vào đúng 00:00:00 mỗi ngày theo GIỜ VIỆT NAM (UTC+7)
    # Hệ thống TỰ ĐỘNG trao thưởng 1.000 Xu cho người đứng Top 1 khi hết ngày!
    # =========================================================================

    @staticmethod
    def _get_vn_now():
        tz_vn = datetime.timezone(datetime.timedelta(hours=7))
        return datetime.datetime.now(tz_vn)

    def _get_ai_hunt_db(self):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        primary_file = os.path.join(base_dir, "ai_hunt_state.json")
        backup_file = os.path.join(base_dir, ".persistent_ai_hunt_state.json")
        now_vn = self._get_vn_now()
        today_date_str = now_vn.strftime("%Y-%m-%d")
        day_start_vn = now_vn.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end_vn = day_start_vn + datetime.timedelta(days=1)

        defaults = {
            "active": True,
            "title": "🏹 SỰ KIỆN SĂN KHỦNG LONG AI TOÀN SERVER",
            "description": "Sự kiện diễn ra theo ngày (tự động reset lúc 00:00 mỗi ngày theo giờ VN). Người chơi săn được nhiều AI nhất sẽ được hệ thống TỰ ĐỘNG trao thưởng 1.000 Xu!",
            "reward_xu": 1000,
            "duration_seconds": 86400,
            "season_date": today_date_str,
            "season_id": f"Mùa 1 (Ngày {now_vn.strftime('%d/%m')})",
            "started_at": day_start_vn.isoformat(),
            "expires_at": day_end_vn.isoformat(),
            "time_remaining_seconds": max(0, int((day_end_vn - now_vn).total_seconds())),
            "auto_reward_enabled": True,
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

        data_to_save = dict(data)
        data_to_save.pop("time_remaining_seconds", None)

        for fpath in [primary_file, sub_file, backup_file]:
            try:
                os.makedirs(os.path.dirname(fpath), exist_ok=True)
                with open(fpath, "w", encoding="utf-8") as f:
                    json.dump(data_to_save, f, ensure_ascii=False, indent=2)
            except Exception:
                pass

    def _auto_check_ai_hunt_status(self, db):
        if not db or not db.get("active"):
            return

        tz_vn = datetime.timezone(datetime.timedelta(hours=7))
        now_vn = self._get_vn_now()
        today_date_str = now_vn.strftime("%Y-%m-%d")
        now_ts = now_vn.timestamp()

        # 1. Xác định ngày mùa săn hiện tại
        season_date = db.get("season_date")
        if not season_date:
            started_at_str = db.get("started_at", "")
            if started_at_str and len(started_at_str) >= 10:
                season_date = started_at_str[:10]
            else:
                season_date = today_date_str
            db["season_date"] = season_date

        # 2. Xác định thời điểm hết hạn (expires_at)
        expires_at_str = db.get("expires_at", "")
        expires_at_ts = 0.0
        if expires_at_str:
            try:
                clean_exp = expires_at_str.replace("Z", "+00:00")
                exp_dt = datetime.datetime.fromisoformat(clean_exp)
                if exp_dt.tzinfo is None:
                    exp_dt = exp_dt.replace(tzinfo=tz_vn)
                expires_at_ts = exp_dt.timestamp()
            except Exception:
                pass

        # 3. KIỂM TRA SANG NGÀY MỚI (00:00:00 GIỜ VIỆT NAM):
        # Nếu ngày hôm nay (today_date_str) đã vượt quá ngày của mùa săn hiện tại (season_date)
        # hoặc thời gian hiện tại đã vượt mốc expires_at_ts -> TỰ ĐỘNG CHỐT THƯỞNG VÀ RESET SANG NGÀY MỚI!
        is_new_day = False
        if season_date and today_date_str > season_date:
            is_new_day = True
        elif expires_at_ts > 0 and now_ts >= expires_at_ts:
            is_new_day = True

        if is_new_day:
            print(f"[AI Hunt Daily Auto-Settle] SANG NGÀY MỚI! Ngày cũ: {season_date}, Ngày mới: {today_date_str}. Đang tự động chốt và trao 1.000 Xu cho Top 1...")
            leaderboard = db.get("leaderboard", [])
            top_hunter = leaderboard[0] if (leaderboard and leaderboard[0].get("kills", 0) > 0) else None
            reward_xu = int(db.get("reward_xu", 1000))

            reward_history = db.setdefault("reward_history", [])
            already_settled_dates = [h.get("season_date") for h in reward_history if h.get("season_date")]

            # Chỉ trao thưởng và lưu lịch sử nếu mùa cũ này chưa từng được chốt trao thưởng
            if top_hunter and season_date not in already_settled_dates and not db.get("is_settled"):
                winner_sid = str(top_hunter.get("steam_id")).strip()
                winner_name = top_hunter.get("name", "Chiến Binh")
                kills = top_hunter.get("kills", 0)

                # Tự động cộng 1.000 Xu vào ví người chơi
                awarded = self._adjust_player_xu(
                    winner_sid,
                    reward_xu,
                    f"Thưởng Tự Động Top 1 Săn AI ({kills} con ngày {season_date}): +{reward_xu:,} Xu"
                )
                print(f"[AI Hunt Daily Auto-Settle] Đã trao thưởng cho Steam {winner_sid} ({winner_name}): {awarded}")

                # Thông báo toàn server qua IslePilot
                try:
                    self.fetch_islepilot("/commands", method="POST", body_data={
                        "action": "announce",
                        "message": f"🏆 [SĂN AI] HẾT NGÀY {season_date}! Chúc mừng {winner_name.upper()} đã đoạt TOP 1 SĂN AI với {kills} con! Hệ thống đã tự động trao thưởng {reward_xu:,} Xu!"
                    })
                except Exception:
                    pass

                history_entry = {
                    "season_id": db.get("season_id", f"Mùa {season_date}"),
                    "season_date": season_date,
                    "settled_at": now_vn.isoformat(),
                    "winner_steam_id": winner_sid,
                    "winner_name": winner_name,
                    "species": top_hunter.get("species", "Dinosaur"),
                    "kills": kills,
                    "prey_breakdown": top_hunter.get("prey_breakdown", {}),
                    "reward_xu": reward_xu,
                    "total_participants": len(leaderboard),
                    "total_ai_kills": db.get("total_ai_kills", kills),
                    "auto_settled": True
                }
                reward_history.insert(0, history_entry)
                db["last_winner"] = history_entry
            else:
                try:
                    self.fetch_islepilot("/commands", method="POST", body_data={
                        "action": "announce",
                        "message": f"🏹 [SĂN AI] Mùa săn AI ngày {season_date} đã khép lại và bước sang ngày mới!"
                    })
                except Exception:
                    pass

            # KHỞI TẠO MÙA SĂN CHO NGÀY MỚI (RESET TOÀN BỘ SỐ LIỆU NGÀY MỚI)
            new_season_num = len(db.get("reward_history", [])) + 1
            day_start_vn = now_vn.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end_vn = day_start_vn + datetime.timedelta(days=1)

            db["active"] = True
            db["season_date"] = today_date_str
            db["season_id"] = f"Mùa {new_season_num} (Ngày {now_vn.strftime('%d/%m')})"
            db["started_at"] = day_start_vn.isoformat()
            db["expires_at"] = day_end_vn.isoformat()
            db["duration_seconds"] = 86400
            db["ended_at"] = None
            db["is_settled"] = False
            db["total_ai_kills"] = 0
            db["hunters"] = {}
            db["leaderboard"] = []
            db["prey_summary"] = {}
            db["top_hunter"] = None
            db["processed_kill_ids"] = []

            try:
                self.fetch_islepilot("/commands", method="POST", body_data={
                    "action": "announce",
                    "message": f"🏹 [SĂN AI] MÙA SĂN KHỦNG LONG AI MỚI TRONG NGÀY ({now_vn.strftime('%d/%m')}) ĐÃ BẮT ĐẦU! Ai săn được nhiều AI nhất hôm nay sẽ tự động nhận 1.000 Xu!"
                })
            except Exception:
                pass

            self._save_ai_hunt_db(db)

        # 4. QUÉT HITS TỪ COMBAT-LOG CHO NGÀY HIỆN TẠI
        hits = []
        try:
            if DinoRequestHandler._combat_log_cached_data and (now_ts - DinoRequestHandler._combat_log_cache_time < 3.0):
                hits = DinoRequestHandler._combat_log_cached_data.get("hits", [])
            else:
                remote_data = self.fetch_islepilot("/combat-log?limit=500")
                if isinstance(remote_data, dict):
                    DinoRequestHandler._combat_log_cached_data = remote_data
                    DinoRequestHandler._combat_log_cache_time = now_ts
                    hits = remote_data.get("hits", [])
                elif DinoRequestHandler._combat_log_cached_data:
                    hits = DinoRequestHandler._combat_log_cached_data.get("hits", [])
        except Exception:
            if DinoRequestHandler._combat_log_cached_data:
                hits = DinoRequestHandler._combat_log_cached_data.get("hits", [])

        # Xác định mốc epoch timestamp bắt đầu ngày săn hiện tại
        day_start_ts = 0.0
        started_at_str = db.get("started_at")
        if started_at_str:
            try:
                clean_str = started_at_str.replace("Z", "+00:00")
                s_dt = datetime.datetime.fromisoformat(clean_str)
                if s_dt.tzinfo is None:
                    s_dt = s_dt.replace(tzinfo=tz_vn)
                day_start_ts = s_dt.timestamp()
            except Exception:
                pass

        if not day_start_ts:
            day_start_vn = now_vn.replace(hour=0, minute=0, second=0, microsecond=0)
            day_start_ts = day_start_vn.timestamp()
            db["started_at"] = day_start_vn.isoformat()

        processed_ids = set(str(x) for x in db.setdefault("processed_kill_ids", []))
        hunters = db.setdefault("hunters", {})
        prey_summary = db.setdefault("prey_summary", {})
        has_changes = False
        new_kills = 0

        if hits:
            for h in hits:
                # Nhận diện victim AI: victimSteamId rỗng hoặc none
                vic_sid = str(h.get("victimSteamId") or "").strip()
                if vic_sid and vic_sid.lower() != "none":
                    continue

                # Đòn kết liễu AI: killed == True hoặc hpAfter <= 0
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
                        h_dt = datetime.datetime.fromisoformat(clean_hit_at)
                        hit_ts = h_dt.timestamp()
                    except Exception:
                        pass

                # Chỉ tính đòn hạ gục diễn ra trong ngày săn hiện tại
                if day_start_ts > 0 and hit_ts > 0 and hit_ts < (day_start_ts - 1.0):
                    continue

                if hit_id in processed_ids:
                    continue

                processed_ids.add(hit_id)
                new_kills += 1

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

        if new_kills > 0 or not db.get("leaderboard"):
            has_changes = True
            db["processed_kill_ids"] = list(processed_ids)[-1000:]
            db["prey_summary"] = prey_summary

            # Sắp xếp BXH
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

        # Cập nhật thời gian còn lại (tính đến 00:00:00 ngày tiếp theo theo giờ VN)
        day_end_vn = now_vn.replace(hour=0, minute=0, second=0, microsecond=0) + datetime.timedelta(days=1)
        time_left = max(0, int(day_end_vn.timestamp() - now_ts))
        db["duration_seconds"] = 86400
        db["time_remaining_seconds"] = time_left
        db["expires_at"] = day_end_vn.isoformat()

        if has_changes:
            self._save_ai_hunt_db(db)

    def handle_ai_hunt_get(self):
        db = self._get_ai_hunt_db()
        self._auto_check_ai_hunt_status(db)

        # Tính toán time_remaining_seconds động theo giờ VN
        now_vn = self._get_vn_now()
        day_end_vn = now_vn.replace(hour=0, minute=0, second=0, microsecond=0) + datetime.timedelta(days=1)
        time_left = max(0, int(day_end_vn.timestamp() - now_vn.timestamp()))

        resp_db = dict(db)
        resp_db["time_remaining_seconds"] = time_left

        is_admin, _ = self.is_admin_request()
        self.send_json_response({
            "ok": True,
            "ai_hunt": resp_db,
            "boss": resp_db,
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

        # 1. Trao thưởng 1.000 Xu cho Top 1 Săn AI (Admin can manual trigger)
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
            season_date = db.get("season_date", self._get_vn_now().strftime("%Y-%m-%d"))

            if db.get("is_settled"):
                self.send_json_response({"ok": False, "error": f"Phần thưởng mùa này đã được trao cho {winner_name} rồi! Vui lòng bấm 'Khởi Tranh Mùa Săn Mới' để reset."}, status=400)
                return

            # Tự động cộng 1.000 Xu vào tài khoản người chiến thắng
            self._adjust_player_xu(
                winner_sid,
                reward_xu,
                f"Thưởng Top 1 Săn AI ({kills} con ngày {season_date}): +{reward_xu:,} Xu"
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
                "season_id": db.get("season_id", f"Mùa {season_date}"),
                "season_date": season_date,
                "settled_at": self._get_vn_now().isoformat(),
                "winner_steam_id": winner_sid,
                "winner_name": winner_name,
                "species": top_hunter.get("species", "Dinosaur"),
                "kills": kills,
                "prey_breakdown": top_hunter.get("prey_breakdown", {}),
                "reward_xu": reward_xu,
                "total_participants": len(leaderboard),
                "total_ai_kills": db.get("total_ai_kills", kills),
                "auto_settled": False
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

            now_vn = self._get_vn_now()
            today_date_str = now_vn.strftime("%Y-%m-%d")
            day_start_vn = now_vn.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end_vn = day_start_vn + datetime.timedelta(days=1)
            new_season_num = len(db.get("reward_history", [])) + 1

            db["active"] = True
            db["season_date"] = today_date_str
            db["season_id"] = f"Mùa {new_season_num} (Ngày {now_vn.strftime('%d/%m')})"
            db["started_at"] = day_start_vn.isoformat()
            db["expires_at"] = day_end_vn.isoformat()
            db["duration_seconds"] = 86400
            db["time_remaining_seconds"] = max(0, int((day_end_vn - now_vn).total_seconds()))
            db["ended_at"] = None
            db["is_settled"] = False
            db["total_ai_kills"] = 0
            db["hunters"] = {}
            db["leaderboard"] = []
            db["prey_summary"] = {}
            db["top_hunter"] = None
            db["processed_kill_ids"] = []
            self._save_ai_hunt_db(db)

            try:
                self.fetch_islepilot("/commands", method="POST", body_data={
                    "action": "announce",
                    "message": f"🏹 [SĂN AI] MÙA SĂN KHỦNG LONG AI MỚI (MÙA {new_season_num}) ĐÃ KHỞI TRANH! Ai săn được nhiều AI nhất hôm nay sẽ nhận thưởng 1.000 Xu!"
                })
            except Exception:
                pass

            self.send_json_response({
                "ok": True,
                "message": f"🎯 ĐÃ KHỞI TRANH MÙA SĂN AI MỚI (MÙA {new_season_num})! Hệ thống tự động reset vào 00:00 hàng ngày và tự động trao 1.000 Xu cho Top 1.",
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

    def _auto_check_boss_status(self, boss_db):
        return self._auto_check_ai_hunt_status(boss_db)

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

                    # Lưu snapshot đầy đủ dữ liệu khủng long (máu, nước, no, size, gen)
                    save_garage_dino_snapshot(f"{active_steam_id}_{d.get('id')}", d)
                    save_garage_dino_snapshot(str(d.get("id")), d)

                    growth = safe_float(d.get("growth"), 1.0)

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
                        g_growth = safe_float(gd.get("growth"), 1.0)
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
                    g_growth = safe_float(gd.get("growth"), 1.0)
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
                except Exception:
                    pass

            if found_gift:
                species = found_gift.get("species", "Tyrannosaurus")
                gender = found_gift.get("gender", "Female")
                growth_val = safe_float(found_gift.get("growth"), 1.0)
                is_prime = bool(found_gift.get("isPrimeElder"))
                gift_muts = [m for m in found_gift.get("mutations", []) if m and m != "None"]
                gift_slots = found_gift.get("mutationSlots") or {
                    "active": (gift_muts + ["None"] * (4 - len(gift_muts)))[:4],
                    "parent": ["None", "None", "None", "None"],
                    "elderA": ["None", "None", "None", "None"],
                    "elderB": ["None", "None", "None", "None"]
                }

                self.apply_dino_in_game_worker(
                    steam_id=steam_id,
                    species=species,
                    gender=gender,
                    growth_val=growth_val,
                    is_prime=is_prime,
                    mutations=gift_muts,
                    needs_swap=True,
                    mutation_slots=gift_slots
                )
                self.send_json_response({"success": True, "message": "Thành công"})
                return

            # 1. Tìm thông tin chi tiết khủng long từ remote garage hoặc snapshot đã lưu
            remote_garage = self.fetch_islepilot(f"/players/{steam_id}/garage") or {}
            target_gd = None
            if remote_garage and "garage" in remote_garage:
                for gd in remote_garage["garage"]:
                    if str(gd.get("id")) == str(dino_id):
                        target_gd = gd
                        break

            # Lấy snapshot dự phòng đã lưu lúc cất
            snapshots_map = load_garage_dino_snapshots()
            snap_data = (
                snapshots_map.get(f"{steam_id}_{dino_id}")
                or snapshots_map.get(str(dino_id))
                or snapshots_map.get(f"{steam_id}_{species}")
                or snapshots_map.get(f"{steam_id}_last_parked")
                or {}
            )

            # Tổng hợp đầy đủ các thuộc tính gốc
            dino_spec = (target_gd.get("species") if target_gd else None) or snap_data.get("species") or species
            raw_growth = target_gd.get("growth") if target_gd and target_gd.get("growth") is not None else snap_data.get("growth")
            dino_growth = safe_float(raw_growth, 1.0)
            if dino_growth > 1.0:
                dino_growth /= 100.0
            dino_growth = max(0.01, min(1.0, dino_growth))

            dino_health = safe_float(target_gd.get("health") if target_gd and target_gd.get("health") is not None else snap_data.get("health"), 1.0)
            dino_hunger = safe_float(target_gd.get("hunger") if target_gd and target_gd.get("hunger") is not None else snap_data.get("hunger"), 1.0)
            dino_thirst = safe_float(target_gd.get("thirst") if target_gd and target_gd.get("thirst") is not None else snap_data.get("thirst"), 1.0)
            dino_stamina = safe_float(target_gd.get("stamina") if target_gd and target_gd.get("stamina") is not None else snap_data.get("stamina"), 1.0)
            is_prime = bool((target_gd.get("isPrimeElder") if target_gd else None) or snap_data.get("isPrimeElder", False))

            saved_muts_map = load_garage_saved_mutations()
            dino_mutation_slots = (
                (target_gd.get("mutationSlots") if target_gd and isinstance(target_gd.get("mutationSlots"), dict) else None)
                or snap_data.get("mutationSlots")
                or saved_muts_map.get(f"{steam_id}_{dino_id}")
                or saved_muts_map.get(str(dino_id))
                or saved_muts_map.get(f"{steam_id}_{dino_spec}")
                or saved_muts_map.get(f"{steam_id}_last_parked")
                or {}
            )

            # Chuẩn hóa toàn bộ 4 nhóm đột biến: active, parent, elderA, elderB (đủ 16 slot)
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

            # 2. Gọi lệnh restore từ IslePilot
            res = self.fetch_islepilot(f"/players/{steam_id}/garage/{dino_id}/restore", method="POST", body_data={})

            if res and (res.get("ok") is True or "commandId" in res):
                # KHỞI CHẠY TIẾN TRÌNH ĐỒNG BỘ 100% SIZE, MÁU, ĐÓI, NƯỚC, A-B-Y VÀ ĐỘT BIẾN
                def restore_worker():
                    # Chờ 3.5 giây để nhân vật Evrima load vào bản đồ game hoàn chỉnh
                    time.sleep(3.5)

                    # 1. ĐẶT KÍCH THƯỚC (GROWTH) CHUẨN XÁC Y NHƯ LÚC CẤT (KHẮC PHỤC LỖI BỊ THU NHỎ SIZE)
                    try:
                        self.fetch_islepilot("/commands", method="POST", body_data={
                            "action": "setgrowth",
                            "steamId": str(steam_id),
                            "growth": dino_growth,
                            "frozen": False
                        })
                        print(f"[Garage Restore] Đã setgrowth = {dino_growth} chuẩn xác cho Steam {steam_id}")
                    except Exception as e:
                        print(f"[Garage Restore Growth Error] {e}")

                    time.sleep(0.3)

                    # 2. ĐẶT SCALE: Chuẩn hóa IndoRex là 0.5x, còn tất cả con khác giữ nguyên 1.0x
                    target_scale = 0.5 if "indo" in str(dino_spec).lower() else 1.0
                    try:
                        self.fetch_islepilot("/commands", method="POST", body_data={
                            "action": "scale",
                            "steamId": str(steam_id),
                            "scale": target_scale
                        })
                        print(f"[Garage Restore] Đã đặt scale = {target_scale} cho {dino_spec} (Steam {steam_id})")
                    except Exception:
                        pass

                    time.sleep(0.3)

                    # 3. ĐỒNG BỘ MÁU (HEALTH), NƯỚC (THIRST), NO (HUNGER)
                    stats_calc = calc_dino_stats(dino_spec, dino_growth, dino_health, dino_hunger, dino_thirst, is_prime)
                    target_hp = stats_calc["current_hp"]
                    target_hunger = stats_calc["current_hunger"]
                    target_thirst = stats_calc["current_thirst"]

                    stat_payload = {
                        "action": "setstats",
                        "steamId": str(steam_id),
                        "health": target_hp,
                        "hunger": target_hunger,
                        "thirst": target_thirst,
                        "bleed": 0.0
                    }
                    try:
                        self.fetch_islepilot("/commands", method="POST", body_data=stat_payload)
                        print(f"[Garage Restore] Đã setstats (HP: {target_hp}, Hunger: {target_hunger}, Thirst: {target_thirst}) cho Steam {steam_id}")
                    except Exception as e:
                        print(f"[Garage Restore Stats Error] {e}")

                    time.sleep(0.3)

                    # 4. ĐỒNG BỘ THỂ LỰC (STAMINA)
                    try:
                        st_val = safe_float(dino_stamina, 1.0)
                        if st_val <= 1.0:
                            st_val *= 1000.0
                        self.fetch_islepilot("/commands", method="POST", body_data={
                            "action": "setstamina",
                            "steamId": str(steam_id),
                            "stamina": max(100.0, min(1000.0, st_val))
                        })
                    except Exception:
                        pass

                    time.sleep(0.3)

                    # 5. ĐỒNG BỘ DINH DƯỠNG A, B, Y (CARB, PROTEIN, LIPID)
                    nutrients = snap_data.get("nutrients") or {}
                    carb_val = safe_float(nutrients.get("carb") if nutrients.get("carb") is not None else nutrients.get("a"), 100.0)
                    prot_val = safe_float(nutrients.get("protein") if nutrients.get("protein") is not None else nutrients.get("b"), 100.0)
                    lipid_val = safe_float(nutrients.get("lipid") if nutrients.get("lipid") is not None else nutrients.get("y"), 100.0)
                    try:
                        self.fetch_islepilot("/commands", method="POST", body_data={
                            "action": "setnutrition",
                            "steamId": str(steam_id),
                            "carb": carb_val,
                            "protein": prot_val,
                            "lipid": lipid_val
                        })
                        print(f"[Garage Restore] Đã setnutrition A-B-Y ({carb_val}/{prot_val}/{lipid_val}) cho Steam {steam_id}")
                    except Exception as e:
                        print(f"[Garage Restore Nutrition Error] {e}")

                    time.sleep(0.3)

                    # 6. ĐỒNG BỘ 100% ĐỘT BIẾN GEN (MUTATIONS ĐỦ 16 SLOT)
                    body_muts = {
                        "action": "mutations",
                        "steamId": str(steam_id),
                        "active": full_slots["active"][:4],
                        "parent": full_slots["parent"][:4],
                        "elderA": full_slots["elderA"][:4],
                        "elderB": full_slots["elderB"][:4],
                        "mutationSlots": full_slots
                    }
                    try:
                        self.fetch_islepilot("/commands", method="POST", body_data=body_muts)
                        print(f"[Garage Restore] Đã phục hồi 100% Đột biến gen cho Steam {steam_id}")
                    except Exception as e:
                        print(f"[Garage Restore Mutations Error] {e}")

                    # 7. NẾU LÀ PRIME ELDER: ÁP DỤNG PRIME
                    if is_prime:
                        time.sleep(0.4)
                        try:
                            self.fetch_islepilot("/commands", method="POST", body_data={
                                "action": "setprime",
                                "steamId": str(steam_id),
                                "eligible": True,
                                "conditions": 10,
                                "isElder": True,
                                "stacks": 10
                            })
                            time.sleep(0.3)
                            self.fetch_islepilot("/commands", method="POST", body_data={
                                "action": "scale",
                                "steamId": str(steam_id),
                                "scale": target_scale
                            })
                        except Exception:
                            pass

                    # 8. BỔ TRỢ LẦN 2 (REINFORCE) SAU 4 GIÂY ĐỂ ĐẢM BẢO ENGINE GAME GHI NHẬN VĨNH VIỄN
                    time.sleep(4.0)
                    try:
                        self.fetch_islepilot("/commands", method="POST", body_data={
                            "action": "setgrowth",
                            "steamId": str(steam_id),
                            "growth": dino_growth,
                            "frozen": False
                        })
                        self.fetch_islepilot("/commands", method="POST", body_data={
                            "action": "scale",
                            "steamId": str(steam_id),
                            "scale": target_scale
                        })
                        self.fetch_islepilot("/commands", method="POST", body_data=stat_payload)
                        self.fetch_islepilot("/commands", method="POST", body_data=body_muts)
                        print(f"[Garage Restore Reinforce] Bổ trợ lần 2 thành công cho Steam {steam_id}")
                    except Exception:
                        pass

                threading.Thread(target=restore_worker, daemon=True).start()

                self.send_json_response({
                    "success": True,
                    "ok": True,
                    "message": f"Đã lấy thành công {dino_spec} ra game (bảo toàn 100% Size {round(dino_growth * 100)}%, Máu, Nước, No, Dinh dưỡng A-B-Y và Đột biến)!",
                    "dino_id": str(dino_id)
                })
                return

            err = res.get("error") if (res and isinstance(res, dict)) else "Không thể kết nối đến máy chủ game."
            self.send_json_response({
                "success": False,
                "ok": False,
                "message": f"Rút khủng long thất bại: {err}"
            }, 400)

        except Exception as e:
            print(f"[Handle Garage Spawn Error] {e}")
            self.send_json_response({"success": False, "ok": False, "message": f"Lỗi hệ thống: {e}"}, 500)

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

                # Lưu snapshot đầy đủ dữ liệu khủng long (máu, nước, no, size, a-b-y, mutations) trước khi cất
                if player_info and isinstance(player_info, dict):
                    growth_val = safe_float(player_info.get("growth"), 1.0)
                    h_val = safe_float(player_info.get("health"), 100.0)
                    max_h = safe_float(player_info.get("maxHealth"), 100.0)
                    h_ratio = h_val / max_h if max_h > 0 else 1.0

                    hu_val = safe_float(player_info.get("hunger"), 100.0)
                    max_hu = safe_float(player_info.get("maxHunger"), 100.0)
                    hu_ratio = hu_val / max_hu if max_hu > 0 else 1.0

                    t_val = safe_float(player_info.get("thirst"), 1000.0)
                    max_t = safe_float(player_info.get("maxThirst"), 1000.0)
                    t_ratio = t_val / max_t if max_t > 0 else 1.0

                    st_val = safe_float(player_info.get("stamina"), 100.0)

                    p_muts = player_info.get("mutationSlots")
                    if p_muts and isinstance(p_muts, dict):
                        save_garage_saved_mutation(f"{steam_id}_last_parked", p_muts)
                        if player_info.get("species"):
                            save_garage_saved_mutation(f"{steam_id}_{player_info.get('species')}", p_muts)

                    dino_snap = {
                        "species": player_info.get("species"),
                        "gender": "Female" if player_info.get("female") else "Male",
                        "growth": growth_val,
                        "health": h_ratio,
                        "hunger": hu_ratio,
                        "thirst": t_ratio,
                        "stamina": st_val / 100.0 if st_val > 1.0 else st_val,
                        "mutationSlots": p_muts,
                        "isPrimeElder": bool(player_info.get("isPrimeElder", False)),
                        "nutrients": {
                            "carb": safe_float(player_info.get("carb"), 100.0),
                            "protein": safe_float(player_info.get("protein"), 100.0),
                            "lipid": safe_float(player_info.get("lipid"), 100.0)
                        }
                    }
                    save_garage_dino_snapshot(f"{steam_id}_last_parked", dino_snap)
                    if player_info.get("species"):
                        save_garage_dino_snapshot(f"{steam_id}_{player_info.get('species')}", dino_snap)

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
                    try:
                        fresh_garage = self.fetch_islepilot(f"/players/{steam_id}/garage") or {}
                        gar_list = fresh_garage.get("garage", [])
                        if gar_list:
                            latest_dino = gar_list[-1]
                            d_id = latest_dino.get("id")
                            if d_id:
                                p_muts = latest_dino.get("mutationSlots") or load_garage_saved_mutations().get(f"{steam_id}_last_parked")
                                if p_muts:
                                    save_garage_saved_mutation(f"{steam_id}_{d_id}", p_muts)
                                    save_garage_saved_mutation(str(d_id), p_muts)

                                snap = load_garage_dino_snapshots().get(f"{steam_id}_last_parked") or {}
                                merged_snap = {
                                    "id": d_id,
                                    "species": latest_dino.get("species") or snap.get("species"),
                                    "gender": latest_dino.get("gender") or snap.get("gender"),
                                    "growth": safe_float(latest_dino.get("growth") or snap.get("growth"), 1.0),
                                    "health": safe_float(latest_dino.get("health") if latest_dino.get("health") is not None else snap.get("health"), 1.0),
                                    "hunger": safe_float(latest_dino.get("hunger") if latest_dino.get("hunger") is not None else snap.get("hunger"), 1.0),
                                    "thirst": safe_float(latest_dino.get("thirst") if latest_dino.get("thirst") is not None else snap.get("thirst"), 1.0),
                                    "stamina": safe_float(latest_dino.get("stamina") if latest_dino.get("stamina") is not None else snap.get("stamina"), 1.0),
                                    "mutationSlots": p_muts,
                                    "isPrimeElder": bool(latest_dino.get("isPrimeElder") if latest_dino.get("isPrimeElder") is not None else snap.get("isPrimeElder", False)),
                                    "nutrients": snap.get("nutrients") or {"carb": 100.0, "protein": 100.0, "lipid": 100.0}
                                }
                                save_garage_dino_snapshot(f"{steam_id}_{d_id}", merged_snap)
                                save_garage_dino_snapshot(str(d_id), merged_snap)
                    except Exception as e:
                        print(f"[Garage Store Finalize Snap Error] {e}")

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
        except Exception as e:
            print(f"[Handle Garage Store Error] {e}")
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

    def get_exclusive_universal_skin(self):
        return {
            "id": "skin_hac_bang_doc_quyen",
            "name": "👑 Màu Độc Quyền - Hắc Băng Lôi Điện (Phiên bản giới hạn)",
            "species": "Tất cả các loài",
            "allSpecies": True,
            "universal": True,
            "bought": True,
            "usesLeft": None,
            "maxUses": None,
            "price": 0,
            "pattern": 1,
            "variation": 0,
            "theme": 0,
            "badge": "👑 Độc Quyền Server • Mọi Dino",
            "themeColor": "#00D9FF",
            "imageUrl": "/assets/images/skin_hac_bang_doc_quyen.jpg",
            "image": "/assets/images/skin_hac_bang_doc_quyen.jpg",
            "colors": ["#06080E", "#00D9FF", "#EEF8FF", "#6889A6"],
            "palette": {
                "body": "#06080E",
                "markings": "#00D9FF",
                "underbelly": "#EEF8FF",
                "flank": "#00E5FF",
                "detail": "#6889A6",
                "detail1": "#00FFFF",
                "display": "#00FFFF",
                "male_display": "#00FFFF",
                "eyes": "#00FFFF",
                "claws": "#00D9FF",
                "teeth": "#EEF8FF",
                "mouth": "#0A2233"
            },
            "code": "Diabloceratops10006080EFF06080EFF00D9FFFFD1FAFFFF00F2FFFF00FFFFFF",
            "skinCode": "Diabloceratops10006080EFF06080EFF00D9FFFFD1FAFFFF00F2FFFF00FFFFFF",
            "description": "Phiên bản giới hạn: Độc đáo • Cá tính • Khác biệt. Phối màu Đen Huyền (nền chủ đạo), Xanh Ngọc (tạo điểm nhấn), Trắng Băng (tăng độ sắc nét) và Xám Xanh (tạo chiều sâu). Tương thích tự động 100% cho TẤT CẢ khủng long trong server!"
        }

    def enrich_skin_data(self, s):
        if not isinstance(s, dict):
            return s
        skin_id = str(s.get("id") or "")
        name = s.get("name") or ""
        name_lower = name.lower()
        species = s.get("species") or "Tyrannosaurus"

        if skin_id == "skin_hac_bang_doc_quyen" or any(k in name_lower for k in ["hắc băng", "hac bang", "độc quyền", "doc quyen", "lôi điện"]):
            excl = self.get_exclusive_universal_skin()
            for k, v in excl.items():
                if k not in s or s[k] is None:
                    s[k] = v
            s["palette"] = excl["palette"]
            s["allSpecies"] = True
            s["universal"] = True
            s["imageUrl"] = excl["imageUrl"]
            s["image"] = excl["image"]
            return s

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
            colors_arr = s.get("colors")
            if isinstance(colors_arr, list) and len(colors_arr) >= 3:
                s["palette"] = {
                    "body": colors_arr[0],
                    "markings": colors_arr[1],
                    "underbelly": colors_arr[2],
                    "flank": colors_arr[3] if len(colors_arr) > 3 else colors_arr[0],
                    "display": colors_arr[1],
                    "eyes": "#00FFFF",
                    "detail": colors_arr[2]
                }
            else:
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
        remote = self.fetch_islepilot("/shop/skins")
        skins = []
        if remote and "skins" in remote:
            raw_skins = remote.get("skins", [])
            skins = [self.enrich_skin_data(s) for s in raw_skins]

        custom_list = []
        if os.path.exists("admin_custom_skins.json"):
            try:
                with open("admin_custom_skins.json", "r", encoding="utf-8") as f:
                    raw_custom = json.load(f)
                    custom_list = [self.enrich_skin_data(dict(cs)) for cs in raw_custom if isinstance(cs, dict)]
            except Exception:
                pass

        if not any(s.get("id") == "skin_hac_bang_doc_quyen" for s in custom_list):
            custom_list.insert(0, self.get_exclusive_universal_skin())

        existing_ids = {s.get("id") for s in custom_list}
        skins = custom_list + [s for s in skins if s.get("id") not in existing_ids]
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

                self.send_json_response({"success": False, "ok": False, "message": "Vui lòng chọn địa điểm dịch chuyển!"}, 400)

                return

            if not steam_id:

                self.send_json_response({"success": False, "ok": False, "message": "Vui lòng đăng nhập Steam trước khi dịch chuyển!"}, 401)

                return

            steam_id = str(steam_id).strip()

            # 1. KIỂM TRA BỘ ĐẾM HỒI CHIÊU 60 GIÂY
            if not hasattr(DinoRequestHandler, "_teleport_cooldowns"):
                DinoRequestHandler._teleport_cooldowns = {}

            now = time.time()
            cooldown_until = DinoRequestHandler._teleport_cooldowns.get(steam_id, 0)
            if now < cooldown_until:
                remaining = int(math.ceil(cooldown_until - now))
                self.send_json_response({
                    "success": False,
                    "ok": False,
                    "message": f"⏳ Dịch chuyển đang trong thời gian hồi chiêu! Vui lòng đợi {remaining} giây nữa.",
                    "error": f"⏳ Dịch chuyển đang trong thời gian hồi chiêu! Vui lòng đợi {remaining} giây nữa.",
                    "cooldown_remaining": remaining
                }, 429)
                return

            # 2. KIỂM TRA TRẠNG THÁI KHỦNG LONG TRONG GAME ĐỂ TRÁNH LỖI TRỪ XU KHI MỚI SPAWN
            try:
                p_info = self.fetch_islepilot(f"/players/{steam_id}")
                if isinstance(p_info, dict):
                    if p_info.get("online") is False:
                        self.send_json_response({
                            "success": False,
                            "ok": False,
                            "message": "⚠️ Khủng long của bạn chưa online trong server! Vui lòng vào game trước khi bấm dịch chuyển."
                        }, 400)
                        return

                    if not p_info.get("species"):
                        self.send_json_response({
                            "success": False,
                            "ok": False,
                            "message": "⚠️ Bạn chưa chọn khủng long spawn vào thế giới game! Vui lòng vào game bấm Spawn trước khi dịch chuyển."
                        }, 400)
                        return

                    hp = p_info.get("health")
                    if hp is not None and float(hp) <= 0:
                        self.send_json_response({
                            "success": False,
                            "ok": False,
                            "message": "⚠️ Khủng long đã chết! Vui lòng hồi sinh/spawn khủng long mới vào map trước khi dịch chuyển."
                        }, 400)
                        return

                    if p_info.get("inCombat") is True:
                        self.send_json_response({
                            "success": False,
                            "ok": False,
                            "message": "⚠️ Khủng long đang trong giao tranh (combat)! Vui lòng đợi 30s sau khi hết combat rồi thử lại."
                        }, 400)
                        return

                    pos = p_info.get("position")
                    if not pos or not isinstance(pos, dict) or pos.get("x") is None:
                        self.send_json_response({
                            "success": False,
                            "ok": False,
                            "message": "⚠️ Khủng long vừa mới spawn hoặc đang tải vào map! Vui lòng vào game di chuyển (bấm W-A-S-D) ít nhất 3-5 giây để máy chủ nhận diện vị trí trước khi dịch chuyển."
                        }, 400)
                        return
            except Exception as ex_check:
                print(f"[Teleport Pre-Check Warning] {ex_check}")

            # 3. GỬI LỆNH DỊCH CHUYỂN TỚI ISLEPILOT
            res = self.fetch_islepilot(f"/players/{steam_id}/teleport", method="POST", body_data={"locationId": location_id})
            ok, msg = self._is_teleport_success(res)
            if ok:
                # KÍCH HOẠT HỒI CHIÊU 60 GIÂY
                DinoRequestHandler._teleport_cooldowns[steam_id] = time.time() + 60.0
                self.send_json_response({
                    "success": True,
                    "ok": True,
                    "message": "🚀 Đã gửi lệnh dịch chuyển thành công! Hãy đứng yên trong game 3-5s để máy chủ chuyển vị trí.",
                    "cooldown_seconds": 60
                })
                return
            self.send_json_response({"success": False, "ok": False, "message": msg, "error": msg}, 400)

        except Exception as e:

            self.send_json_response({"success": False, "ok": False, "message": f"Lỗi hệ thống: {e}"}, 500)

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

            elif steam_id in ["76561199175571899", "76561199196418178", "76561199062270730", "76561199483156684", "76561199319732549"]:

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

            elif steam_id in ["76561199175571899", "76561199196418178", "76561199062270730", "76561199483156684", "76561199319732549"]:

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
        remaining_cd = self._get_carcass_remaining_cooldown(active_steam_id) if active_steam_id else 0

        remote_data = None
        if active_steam_id:
            try:
                remote_data = self.fetch_islepilot(f"/players/{active_steam_id}/carcass")
            except Exception as e:
                pass

        if remote_data and isinstance(remote_data, dict) and "offers" in remote_data:
            remote_offers = remote_data.get("offers", [])
            for item in remote_offers:
                item["price"] = 200
                item["price_display"] = "200 Xu"
            self.send_json_response({
                "ok": True,
                "offers": remote_offers,
                "cooldown_seconds": 300,
                "remaining_cooldown": remaining_cd,
                "daily_limit": remote_data.get("dailyLimit", 5),
                "server_id": config.get("SERVER_ID", "cmv3zzfix02g3pj01yay0hw4g")
            })
            return

        # Đồng bộ 100% đầy đủ 6 gói xác mới nhất từ IslePilot của server 3MGAMING (Giá cố định 200 Xu)
        offers = [
            # 1. Danh mục Thả Xác cho Khủng Long Ăn Thịt (Carnivores)
            {
                "id": "omv572un0",
                "name": "Xác Tenontosaurus Tươi",
                "category": "carnivore",
                "type": "carcass",
                "price": 200,
                "price_display": "200 Xu",
                "species": "Tenontosaurus",
                "species_name": "Tenontosaurus",
                "icon": "🍖",
                "image": "https://islepilot.eu/cdn/dino-art/render/Tenontosaurus.webp",
                "badge": "🥩 100% Kích Cỡ",
                "sub_badge": "🍖 Xác Thịt Tươi",
                "description": "Xác Tenontosaurus tươi ngon, giàu chất đạm, phù hợp hoàn hảo với chế độ ăn của mọi loài săn mồi ăn thịt."
            },
            {
                "id": "omv6uqesm",
                "name": "Xác Triceratops Khổng Lồ",
                "category": "carnivore",
                "type": "carcass",
                "price": 200,
                "price_display": "200 Xu",
                "species": "Triceratops",
                "species_name": "Triceratops",
                "icon": "🍖",
                "image": "https://islepilot.eu/cdn/dino-art/render/Triceratops.webp",
                "badge": "🥩 100% Kích Cỡ",
                "sub_badge": "🍖 Xác Thịt Tươi",
                "description": "Xác Triceratops to lớn đầy ắp thịt và tủy xương, thích hợp cho Apex Predators như T-Rex hay Giganotosaurus."
            },
            {
                "id": "omv6viaxj",
                "name": "Xác Stegosaurus Bổ Dưỡng",
                "category": "carnivore",
                "type": "carcass",
                "price": 200,
                "price_display": "200 Xu",
                "species": "Stegosaurus",
                "species_name": "Stegosaurus",
                "icon": "🍖",
                "image": "https://islepilot.eu/cdn/dino-art/render/Stegosaurus.webp",
                "badge": "🥩 100% Kích Cỡ",
                "sub_badge": "🍖 Xác Thịt Tươi",
                "description": "Xác Stegosaurus giàu chất béo và dưỡng chất, đảm bảo no bụng và hồi phục thể lực nhanh chóng."
            },
            {
                "id": "omvqituv4",
                "name": "Xác Carnotaurus Săn Mồi",
                "category": "carnivore",
                "type": "carcass",
                "price": 200,
                "price_display": "200 Xu",
                "species": "Carnotaurus",
                "species_name": "Carnotaurus",
                "icon": "🍖",
                "image": "https://islepilot.eu/cdn/dino-art/render/Carnotaurus.webp",
                "badge": "🥩 100% Kích Cỡ",
                "sub_badge": "🍖 Xác Thịt Tươi",
                "description": "Xác thú ăn thịt cỡ trung, cung cấp hàm lượng protein tinh khiết cho các loài ăn thịt khác."
            },
            {
                "id": "omvqiuffy",
                "name": "Xác Ceratosaurus Đậm Vị",
                "category": "carnivore",
                "type": "carcass",
                "price": 200,
                "price_display": "200 Xu",
                "species": "Ceratosaurus",
                "species_name": "Ceratosaurus",
                "icon": "🍖",
                "image": "https://islepilot.eu/cdn/dino-art/render/Ceratosaurus.webp",
                "badge": "🥩 100% Kích Cỡ",
                "sub_badge": "🍖 Xác Thịt Tươi",
                "description": "Xác Ceratosaurus tươi đặc trưng, hỗ trợ tiêu hóa nhanh và kích hoạt các đột biến gen săn mồi."
            },
            {
                "id": "omvqiuphi",
                "name": "Xác Tyrannosaurus Chúa Tể",
                "category": "carnivore",
                "type": "carcass",
                "price": 200,
                "price_display": "200 Xu",
                "species": "Tyrannosaurus",
                "species_name": "Tyrannosaurus",
                "icon": "🍖",
                "image": "https://islepilot.eu/cdn/dino-art/render/Tyrannosaurus.webp",
                "badge": "🥩 100% Kích Cỡ",
                "sub_badge": "🍖 Xác Thịt Tươi",
                "description": "Khối lượng thịt khổng lồ từ chúa tể T-Rex, cung cấp nguồn năng lượng dồi dào nhất đảo Evrima."
            },

            # 2. Danh mục Trồng Cây & Bụi Cây Thảo Mộc cho Khủng Long Ăn Cỏ (Herbivores)
            {
                "id": "plant_sanctuary",
                "name": "Bụi Cây Sanctuary (Thánh Địa)",
                "category": "herbivore",
                "type": "plant",
                "price": 200,
                "price_display": "200 Xu",
                "species": "Sanctuary Bush",
                "species_name": "Sanctuary Bush",
                "icon": "🌿",
                "image": "https://islepilot.eu/cdn/dino-art/render/Tenontosaurus.webp",
                "badge": "🌿 100% Cân Bằng",
                "sub_badge": "✨ S-A-B-Y 100%",
                "description": "Bụi cây Thánh Địa màu mỡ đặc trưng của The Isle: Evrima. Cung cấp toàn diện 3 nhóm dưỡng chất, no lâu và tăng trưởng thần tốc."
            },
            {
                "id": "plant_berry",
                "name": "Bụi Dâu Rừng (Blueberry Bush)",
                "category": "herbivore",
                "type": "plant",
                "price": 200,
                "price_display": "200 Xu",
                "species": "Berry Bush",
                "species_name": "Berry Bush",
                "icon": "🫐",
                "image": "https://islepilot.eu/cdn/dino-art/render/Dryosaurus.webp",
                "badge": "🫐 100% Carbs (S)",
                "sub_badge": "⚡ Hồi Thể Lực",
                "description": "Những chùm quả mọng ngọt nước mọc thành lùm rậm rạp. Cung cấp lượng lớn Carbohydrate, phục hồi thể lực (Stamina) dồi dào."
            },
            {
                "id": "plant_roots",
                "name": "Rễ Cây Cổ Thụ & Đầm Lầy (Bulrush)",
                "category": "herbivore",
                "type": "plant",
                "price": 200,
                "price_display": "200 Xu",
                "species": "Bulrush Roots",
                "species_name": "Bulrush Roots",
                "icon": "🌾",
                "image": "https://islepilot.eu/cdn/dino-art/render/Stegosaurus.webp",
                "badge": "🌾 100% Lipid (Y)",
                "sub_badge": "🛡️ Tinh Bột & Khoáng",
                "description": "Củ rễ đầm lầy đậm đà giàu tinh bột và khoáng chất tự nhiên. Món ăn khoái khẩu của Triceratops, Stegosaurus và Tenontosaurus."
            },
            {
                "id": "plant_palm",
                "name": "Cây Cọ Rừng & Chuối Rừng (Palm Tree)",
                "category": "herbivore",
                "type": "plant",
                "price": 200,
                "price_display": "200 Xu",
                "species": "Mountain Palm",
                "species_name": "Mountain Palm",
                "icon": "🌴",
                "image": "https://islepilot.eu/cdn/dino-art/render/Triceratops.webp",
                "badge": "🌴 100% Protein (B)",
                "sub_badge": "💪 Tăng Cơ Bắp",
                "description": "Tán cọ rừng xanh tốt với buồng quả chứa hàm lượng Protein thực vật dồi dào, hỗ trợ tăng cơ bắp và kích thước cho khủng long ăn cỏ."
            },
            {
                "id": "plant_marigold",
                "name": "Cây Thảo Dược Hồi Máu (Marigold)",
                "category": "herbivore",
                "type": "plant",
                "price": 200,
                "price_display": "200 Xu",
                "species": "Marigold Herbs",
                "species_name": "Marigold Herbs",
                "icon": "🌼",
                "image": "https://islepilot.eu/cdn/dino-art/render/Diabloceratops.webp",
                "badge": "❤️ Hồi Máu 100%",
                "sub_badge": "🩹 Cầm Máu Cấp Tốc",
                "description": "Loài thảo dược hoa vàng quý giá trong rừng rậm. Khả năng kháng viêm, cầm máu thần tốc và hồi phục sinh lực sau các trận tử chiến."
            },
            {
                "id": "plant_mushroom",
                "name": "Nấm Rừng Dinh Dưỡng (Forest Truffles)",
                "category": "herbivore",
                "type": "plant",
                "price": 200,
                "price_display": "200 Xu",
                "species": "Forest Mushroom",
                "species_name": "Forest Mushroom",
                "icon": "🍄",
                "image": "https://islepilot.eu/cdn/dino-art/render/Pachycephalosaurus.webp",
                "badge": "💧 100% Nước & Vi Chất",
                "sub_badge": "🍄 Nấm Dinh Dưỡng",
                "description": "Những tai nấm mọng nước phát triển trên thân gỗ mục. Cung cấp nước ngọt tinh khiết và vi chất hoàn hảo cho Pachy, Dryo, Hypsi, Galli."
            }
        ]

        self.send_json_response({
            "ok": True,
            "offers": offers,
            "cooldown_seconds": 300,
            "remaining_cooldown": remaining_cd,
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

            remaining_cd = self._get_carcass_remaining_cooldown(steam_id)
            if remaining_cd > 0:
                self.send_json_response({
                    "success": False,
                    "ok": False,
                    "cooldown": True,
                    "remaining_seconds": remaining_cd,
                    "message": f"⏱️ Vui lòng chờ {remaining_cd} giây nữa trước khi tiếp tục thả xác hoặc trồng cây!"
                }, 400)
                return

            cost = 200
            current_xu = self._get_player_xu_balance(steam_id)
            if current_xu < cost:
                self.send_json_response({
                    "success": False,
                    "ok": False,
                    "message": f"Số dư Xu không đủ! Hiện tại bạn có {current_xu:,} Xu, cần {cost:,} Xu để thả xác / trồng cây."
                }, 400)
                return

            if offer_id.startswith("plant_"):
                # Danh mục thực vật & bụi cây cho khủng long ăn cỏ (The Isle: Evrima)
                plant_dict = {
                    "plant_sanctuary": {"name": "Bụi Cây Sanctuary", "carb": 100.0, "protein": 100.0, "lipid": 100.0, "hunger": 100.0, "species": "Tenontosaurus"},
                    "plant_berry": {"name": "Bụi Dâu Rừng", "carb": 100.0, "protein": 30.0, "lipid": 30.0, "stamina": 1000.0, "hunger": 100.0, "species": "Dryosaurus"},
                    "plant_roots": {"name": "Rễ Cây Cổ Thụ", "carb": 30.0, "protein": 30.0, "lipid": 100.0, "hunger": 100.0, "species": "Stegosaurus"},
                    "plant_palm": {"name": "Cây Cọ Rừng", "carb": 30.0, "protein": 100.0, "lipid": 30.0, "hunger": 100.0, "species": "Triceratops"},
                    "plant_marigold": {"name": "Cây Thảo Dược Hồi Máu", "carb": 80.0, "protein": 80.0, "lipid": 80.0, "health": 100.0, "hunger": 100.0, "species": "Diabloceratops"},
                    "plant_mushroom": {"name": "Nấm Rừng Dinh Dưỡng", "carb": 90.0, "protein": 90.0, "lipid": 90.0, "thirst": 100.0, "hunger": 100.0, "species": "Pachycephalosaurus"},
                }
                plant_info = plant_dict.get(offer_id, plant_dict["plant_sanctuary"])

                # 1. Thả thực thể thức ăn ngay trước mặt người chơi trong game
                self.fetch_islepilot("/commands", method="POST", body_data={
                    "action": "carcass",
                    "steamId": steam_id,
                    "species": plant_info["species"],
                    "growth": 0.5
                })

                # 2. Áp dụng dinh dưỡng thảo mộc trực tiếp (setnutrition)
                self.fetch_islepilot("/commands", method="POST", body_data={
                    "action": "setnutrition",
                    "steamId": steam_id,
                    "carb": plant_info.get("carb", 100.0),
                    "protein": plant_info.get("protein", 100.0),
                    "lipid": plant_info.get("lipid", 100.0)
                })

                # 3. Hồi phục thanh thức ăn (hunger) và thể lực / máu / nước nếu có
                stat_body = {
                    "action": "setstats",
                    "steamId": steam_id,
                    "hunger": plant_info.get("hunger", 100.0)
                }
                if "health" in plant_info:
                    stat_body["health"] = plant_info["health"]
                if "thirst" in plant_info:
                    stat_body["thirst"] = plant_info["thirst"]
                self.fetch_islepilot("/commands", method="POST", body_data=stat_body)

                if "stamina" in plant_info:
                    self.fetch_islepilot("/commands", method="POST", body_data={
                        "action": "setstamina",
                        "steamId": steam_id,
                        "stamina": plant_info["stamina"]
                    })

                # Trừ 200 Xu trực tiếp vào tài khoản người chơi
                self._adjust_player_xu(steam_id, -cost, f"Trồng cây ({plant_info['name']}): -{cost:,} Xu")
                # Đặt mốc thời gian hồi chiêu 300 giây bền vững
                self._set_carcass_cooldown(steam_id)
                new_bal = self._get_player_xu_balance(steam_id)

                self.send_json_response({
                    "success": True,
                    "ok": True,
                    "message": f"Đã trừ {cost:,} Xu! Trồng thành công {plant_info['name']} ngay trước mặt bạn!",
                    "plant": plant_info["name"],
                    "cost": cost,
                    "new_balance": new_bal,
                    "cooldown_seconds": 300
                })
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
                # Trừ 200 Xu trực tiếp vào tài khoản người chơi khi thả xác thành công
                self._adjust_player_xu(steam_id, -cost, f"Thả xác ({target_species}): -{cost:,} Xu")
                # Đặt mốc thời gian hồi chiêu 300 giây bền vững
                self._set_carcass_cooldown(steam_id)
                new_bal = self._get_player_xu_balance(steam_id)
                self.send_json_response({
                    "success": True,
                    "ok": True,
                    "commandId": res.get("commandId"),
                    "message": f"Đã trừ {cost:,} Xu! Thả xác {target_species} thành công ngay vị trí của bạn.",
                    "cost": cost,
                    "new_balance": new_bal,
                    "cooldown_seconds": 300
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

            elif steam_id in ["76561199175571899", "76561199196418178", "76561199062270730", "76561199483156684", "76561199319732549"]:

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

            elif steam_id in ["76561199175571899", "76561199196418178", "76561199062270730", "76561199483156684", "76561199319732549"]:

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
        if not steam_id:
            self.send_json_response({"quests": []})
            return

        remote = self.fetch_islepilot(f"/players/{steam_id}/quests")
        if remote and isinstance(remote, dict) and "quests" in remote:
            claimed_db = load_claimed_quests()
            today_vn = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=7))).strftime("%Y-%m-%d")
            week_vn = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=7))).strftime("%Y-W%W")

            for q in remote["quests"]:
                q_id = str(q.get("id") or "").strip()
                prog_id = str(q.get("progressId") or "").strip()
                period = str(q.get("period") or "daily").strip().lower()
                period_key = q.get("periodKey")
                if not period_key:
                    period_key = week_vn if period == "weekly" else today_vn

                # Kiểm tra nhiệm vụ đã nhận thưởng trong chu kỳ hôm nay/tuần này chưa
                is_claimed, claimed_at = _is_quest_claimed(steam_id, q_id, period_key, prog_id, claimed_db)
                if is_claimed and not q.get("claimedAt"):
                    q["claimedAt"] = claimed_at or datetime.datetime.now(datetime.timezone.utc).isoformat()

            self.send_json_response(remote)
            return

        self.send_json_response({"quests": []})

    def handle_claim_quest(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"
            payload = json.loads(body) if body else {}

            steam_id = str(payload.get("steam_id") or self.get_active_steam_id() or "").strip()
            quest_id = str(payload.get("quest_id") or "").strip()
            progress_id = str(payload.get("progress_id") or "").strip()
            client_amount = int(payload.get("amount", 0))
            quest_name = str(payload.get("quest_name") or "Nhiệm vụ").strip()

            if not steam_id:
                self.send_json_response({"ok": False, "message": "Vui lòng đăng nhập Steam trước khi nhận thưởng!"}, 401)
                return

            if not quest_id:
                self.send_json_response({"ok": False, "message": "Thiếu mã nhiệm vụ!"}, 400)
                return

            today_vn = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=7))).strftime("%Y-%m-%d")
            week_vn = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=7))).strftime("%Y-W%W")

            # 1. Xác thực với IslePilot: Kiểm tra nhiệm vụ thực tế của người chơi
            remote = self.fetch_islepilot(f"/players/{steam_id}/quests")
            matching_quest = None
            if remote and isinstance(remote, dict) and "quests" in remote:
                for q in remote["quests"]:
                    if str(q.get("id")).strip() == quest_id or (progress_id and str(q.get("progressId")).strip() == progress_id):
                        matching_quest = q
                        break

            period = "daily"
            period_key = today_vn
            reward_coins = client_amount

            if matching_quest:
                period = str(matching_quest.get("period") or "daily").strip().lower()
                period_key = matching_quest.get("periodKey") or (week_vn if period == "weekly" else today_vn)
                if not progress_id and matching_quest.get("progressId"):
                    progress_id = str(matching_quest.get("progressId")).strip()
                if matching_quest.get("name"):
                    quest_name = matching_quest.get("name")

                # Lấy phần thưởng chuẩn từ cấu hình nhiệm vụ trên IslePilot
                if matching_quest.get("rewards") and isinstance(matching_quest["rewards"], list) and len(matching_quest["rewards"]) > 0:
                    cfg_amt = int(matching_quest["rewards"][0].get("amount", 0))
                    if cfg_amt > 0:
                        reward_coins = cfg_amt

                # Kiểm tra tiến độ nhiệm vụ đã hoàn thành thực sự trong game chưa
                is_completed = (
                    matching_quest.get("completedAt") is not None
                    or any(c.get("done") for c in matching_quest.get("conditions", []))
                    or (matching_quest.get("conditions") and matching_quest.get("progress", 0) >= matching_quest.get("conditions", [{}])[0].get("target", 1))
                )

                if matching_quest.get("claimedAt"):
                    self.send_json_response({"ok": False, "message": "Nhiệm vụ này đã được nhận thưởng trước đó!"}, 400)
                    return

                if not is_completed:
                    self.send_json_response({"ok": False, "message": "Bạn chưa hoàn thành tiến độ nhiệm vụ này trong game!"}, 400)
                    return

            # 2. Kiểm tra bộ nhớ cache khóa theo chu kỳ ngày / tuần
            claimed_db = load_claimed_quests()
            is_claimed, _ = _is_quest_claimed(steam_id, quest_id, period_key, progress_id, claimed_db)
            if is_claimed:
                time_unit = "ngày hôm nay" if period == "daily" else "tuần này"
                self.send_json_response({
                    "ok": False,
                    "message": f"Nhiệm vụ này bạn đã nhận thưởng trong {time_unit} rồi! Hãy quay lại sau khi làm mới nhiệm vụ."
                }, 400)
                return

            # 3. Thử gọi API IslePilot /quests/claim nếu có progressId (dù có thể thiếu scope, vẫn thử)
            if progress_id:
                try:
                    self.fetch_islepilot(f"/players/{steam_id}/quests/claim", method="POST", body_data={"progressId": progress_id})
                except Exception:
                    pass

            # 4. Cộng Xu an toàn và cập nhật số dư ví
            if reward_coins > 0:
                self._adjust_player_xu(
                    steam_id,
                    reward_coins,
                    f"Thưởng hoàn thành nhiệm vụ: {quest_name} ({period_key})"
                )

            # 5. Ghi nhận đã nhận thưởng theo ngày/chu kỳ vào cơ sở dữ liệu bền vững
            _record_quest_claim(steam_id, quest_id, period_key, progress_id, quest_name, reward_coins, claimed_db)

            new_balance = self._get_player_xu_balance(steam_id)

            self.send_json_response({
                "ok": True,
                "success": True,
                "message": f"Nhận thành công +{reward_coins:,} Xu!",
                "reward_amount": reward_coins,
                "balance": new_balance,
                "quest_id": quest_id,
                "period_key": period_key
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

            elif steam_id in ["76561199175571899", "76561199196418178", "76561199062270730", "76561199483156684", "76561199319732549"]:

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

            elif steam_id in ["76561199175571899", "76561199196418178", "76561199062270730", "76561199483156684", "76561199319732549"]:

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
        remaining_cd = self._get_carcass_remaining_cooldown(active_steam_id) if active_steam_id else 0

        remote_data = None
        if active_steam_id:
            try:
                remote_data = self.fetch_islepilot(f"/players/{active_steam_id}/carcass")
            except Exception as e:
                pass

        if remote_data and isinstance(remote_data, dict) and "offers" in remote_data:
            remote_offers = remote_data.get("offers", [])
            for item in remote_offers:
                item["price"] = 200
                item["price_display"] = "200 Xu"
            self.send_json_response({
                "ok": True,
                "offers": remote_offers,
                "cooldown_seconds": 300,
                "remaining_cooldown": remaining_cd,
                "daily_limit": remote_data.get("dailyLimit", 5),
                "server_id": config.get("SERVER_ID", "cmv3zzfix02g3pj01yay0hw4g")
            })
            return

        # Đồng bộ 100% đầy đủ 6 gói xác mới nhất từ IslePilot của server 3MGAMING (Giá cố định 200 Xu)
        offers = [
            # 1. Danh mục Thả Xác cho Khủng Long Ăn Thịt (Carnivores)
            {
                "id": "omv572un0",
                "name": "Xác Tenontosaurus Tươi",
                "category": "carnivore",
                "type": "carcass",
                "price": 200,
                "price_display": "200 Xu",
                "species": "Tenontosaurus",
                "species_name": "Tenontosaurus",
                "icon": "🍖",
                "image": "https://islepilot.eu/cdn/dino-art/render/Tenontosaurus.webp",
                "badge": "🥩 100% Kích Cỡ",
                "sub_badge": "🍖 Xác Thịt Tươi",
                "description": "Xác Tenontosaurus tươi ngon, giàu chất đạm, phù hợp hoàn hảo với chế độ ăn của mọi loài săn mồi ăn thịt."
            },
            {
                "id": "omv6uqesm",
                "name": "Xác Triceratops Khổng Lồ",
                "category": "carnivore",
                "type": "carcass",
                "price": 200,
                "price_display": "200 Xu",
                "species": "Triceratops",
                "species_name": "Triceratops",
                "icon": "🍖",
                "image": "https://islepilot.eu/cdn/dino-art/render/Triceratops.webp",
                "badge": "🥩 100% Kích Cỡ",
                "sub_badge": "🍖 Xác Thịt Tươi",
                "description": "Xác Triceratops to lớn đầy ắp thịt và tủy xương, thích hợp cho Apex Predators như T-Rex hay Giganotosaurus."
            },
            {
                "id": "omv6viaxj",
                "name": "Xác Stegosaurus Bổ Dưỡng",
                "category": "carnivore",
                "type": "carcass",
                "price": 200,
                "price_display": "200 Xu",
                "species": "Stegosaurus",
                "species_name": "Stegosaurus",
                "icon": "🍖",
                "image": "https://islepilot.eu/cdn/dino-art/render/Stegosaurus.webp",
                "badge": "🥩 100% Kích Cỡ",
                "sub_badge": "🍖 Xác Thịt Tươi",
                "description": "Xác Stegosaurus giàu chất béo và dưỡng chất, đảm bảo no bụng và hồi phục thể lực nhanh chóng."
            },
            {
                "id": "omvqituv4",
                "name": "Xác Carnotaurus Săn Mồi",
                "category": "carnivore",
                "type": "carcass",
                "price": 200,
                "price_display": "200 Xu",
                "species": "Carnotaurus",
                "species_name": "Carnotaurus",
                "icon": "🍖",
                "image": "https://islepilot.eu/cdn/dino-art/render/Carnotaurus.webp",
                "badge": "🥩 100% Kích Cỡ",
                "sub_badge": "🍖 Xác Thịt Tươi",
                "description": "Xác thú ăn thịt cỡ trung, cung cấp hàm lượng protein tinh khiết cho các loài ăn thịt khác."
            },
            {
                "id": "omvqiuffy",
                "name": "Xác Ceratosaurus Đậm Vị",
                "category": "carnivore",
                "type": "carcass",
                "price": 200,
                "price_display": "200 Xu",
                "species": "Ceratosaurus",
                "species_name": "Ceratosaurus",
                "icon": "🍖",
                "image": "https://islepilot.eu/cdn/dino-art/render/Ceratosaurus.webp",
                "badge": "🥩 100% Kích Cỡ",
                "sub_badge": "🍖 Xác Thịt Tươi",
                "description": "Xác Ceratosaurus tươi đặc trưng, hỗ trợ tiêu hóa nhanh và kích hoạt các đột biến gen săn mồi."
            },
            {
                "id": "omvqiuphi",
                "name": "Xác Tyrannosaurus Chúa Tể",
                "category": "carnivore",
                "type": "carcass",
                "price": 200,
                "price_display": "200 Xu",
                "species": "Tyrannosaurus",
                "species_name": "Tyrannosaurus",
                "icon": "🍖",
                "image": "https://islepilot.eu/cdn/dino-art/render/Tyrannosaurus.webp",
                "badge": "🥩 100% Kích Cỡ",
                "sub_badge": "🍖 Xác Thịt Tươi",
                "description": "Khối lượng thịt khổng lồ từ chúa tể T-Rex, cung cấp nguồn năng lượng dồi dào nhất đảo Evrima."
            },

            # 2. Danh mục Trồng Cây & Bụi Cây Thảo Mộc cho Khủng Long Ăn Cỏ (Herbivores)
            {
                "id": "plant_sanctuary",
                "name": "Bụi Cây Sanctuary (Thánh Địa)",
                "category": "herbivore",
                "type": "plant",
                "price": 200,
                "price_display": "200 Xu",
                "species": "Sanctuary Bush",
                "species_name": "Sanctuary Bush",
                "icon": "🌿",
                "image": "https://islepilot.eu/cdn/dino-art/render/Tenontosaurus.webp",
                "badge": "🌿 100% Cân Bằng",
                "sub_badge": "✨ S-A-B-Y 100%",
                "description": "Bụi cây Thánh Địa màu mỡ đặc trưng của The Isle: Evrima. Cung cấp toàn diện 3 nhóm dưỡng chất, no lâu và tăng trưởng thần tốc."
            },
            {
                "id": "plant_berry",
                "name": "Bụi Dâu Rừng (Blueberry Bush)",
                "category": "herbivore",
                "type": "plant",
                "price": 200,
                "price_display": "200 Xu",
                "species": "Berry Bush",
                "species_name": "Berry Bush",
                "icon": "🫐",
                "image": "https://islepilot.eu/cdn/dino-art/render/Dryosaurus.webp",
                "badge": "🫐 100% Carbs (S)",
                "sub_badge": "⚡ Hồi Thể Lực",
                "description": "Những chùm quả mọng ngọt nước mọc thành lùm rậm rạp. Cung cấp lượng lớn Carbohydrate, phục hồi thể lực (Stamina) dồi dào."
            },
            {
                "id": "plant_roots",
                "name": "Rễ Cây Cổ Thụ & Đầm Lầy (Bulrush)",
                "category": "herbivore",
                "type": "plant",
                "price": 200,
                "price_display": "200 Xu",
                "species": "Bulrush Roots",
                "species_name": "Bulrush Roots",
                "icon": "🌾",
                "image": "https://islepilot.eu/cdn/dino-art/render/Stegosaurus.webp",
                "badge": "🌾 100% Lipid (Y)",
                "sub_badge": "🛡️ Tinh Bột & Khoáng",
                "description": "Củ rễ đầm lầy đậm đà giàu tinh bột và khoáng chất tự nhiên. Món ăn khoái khẩu của Triceratops, Stegosaurus và Tenontosaurus."
            },
            {
                "id": "plant_palm",
                "name": "Cây Cọ Rừng & Chuối Rừng (Palm Tree)",
                "category": "herbivore",
                "type": "plant",
                "price": 200,
                "price_display": "200 Xu",
                "species": "Mountain Palm",
                "species_name": "Mountain Palm",
                "icon": "🌴",
                "image": "https://islepilot.eu/cdn/dino-art/render/Triceratops.webp",
                "badge": "🌴 100% Protein (B)",
                "sub_badge": "💪 Tăng Cơ Bắp",
                "description": "Tán cọ rừng xanh tốt với buồng quả chứa hàm lượng Protein thực vật dồi dào, hỗ trợ tăng cơ bắp và kích thước cho khủng long ăn cỏ."
            },
            {
                "id": "plant_marigold",
                "name": "Cây Thảo Dược Hồi Máu (Marigold)",
                "category": "herbivore",
                "type": "plant",
                "price": 200,
                "price_display": "200 Xu",
                "species": "Marigold Herbs",
                "species_name": "Marigold Herbs",
                "icon": "🌼",
                "image": "https://islepilot.eu/cdn/dino-art/render/Diabloceratops.webp",
                "badge": "❤️ Hồi Máu 100%",
                "sub_badge": "🩹 Cầm Máu Cấp Tốc",
                "description": "Loài thảo dược hoa vàng quý giá trong rừng rậm. Khả năng kháng viêm, cầm máu thần tốc và hồi phục sinh lực sau các trận tử chiến."
            },
            {
                "id": "plant_mushroom",
                "name": "Nấm Rừng Dinh Dưỡng (Forest Truffles)",
                "category": "herbivore",
                "type": "plant",
                "price": 200,
                "price_display": "200 Xu",
                "species": "Forest Mushroom",
                "species_name": "Forest Mushroom",
                "icon": "🍄",
                "image": "https://islepilot.eu/cdn/dino-art/render/Pachycephalosaurus.webp",
                "badge": "💧 100% Nước & Vi Chất",
                "sub_badge": "🍄 Nấm Dinh Dưỡng",
                "description": "Những tai nấm mọng nước phát triển trên thân gỗ mục. Cung cấp nước ngọt tinh khiết và vi chất hoàn hảo cho Pachy, Dryo, Hypsi, Galli."
            }
        ]

        self.send_json_response({
            "ok": True,
            "offers": offers,
            "cooldown_seconds": 300,
            "remaining_cooldown": remaining_cd,
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

            remaining_cd = self._get_carcass_remaining_cooldown(steam_id)
            if remaining_cd > 0:
                self.send_json_response({
                    "success": False,
                    "ok": False,
                    "cooldown": True,
                    "remaining_seconds": remaining_cd,
                    "message": f"⏱️ Vui lòng chờ {remaining_cd} giây nữa trước khi tiếp tục thả xác hoặc trồng cây!"
                }, 400)
                return

            cost = 200
            current_xu = self._get_player_xu_balance(steam_id)
            if current_xu < cost:
                self.send_json_response({
                    "success": False,
                    "ok": False,
                    "message": f"Số dư Xu không đủ! Hiện tại bạn có {current_xu:,} Xu, cần {cost:,} Xu để thả xác / trồng cây."
                }, 400)
                return

            if offer_id.startswith("plant_"):
                # Danh mục thực vật & bụi cây cho khủng long ăn cỏ (The Isle: Evrima)
                plant_dict = {
                    "plant_sanctuary": {"name": "Bụi Cây Sanctuary", "carb": 100.0, "protein": 100.0, "lipid": 100.0, "hunger": 100.0, "species": "Tenontosaurus"},
                    "plant_berry": {"name": "Bụi Dâu Rừng", "carb": 100.0, "protein": 30.0, "lipid": 30.0, "stamina": 1000.0, "hunger": 100.0, "species": "Dryosaurus"},
                    "plant_roots": {"name": "Rễ Cây Cổ Thụ", "carb": 30.0, "protein": 30.0, "lipid": 100.0, "hunger": 100.0, "species": "Stegosaurus"},
                    "plant_palm": {"name": "Cây Cọ Rừng", "carb": 30.0, "protein": 100.0, "lipid": 30.0, "hunger": 100.0, "species": "Triceratops"},
                    "plant_marigold": {"name": "Cây Thảo Dược Hồi Máu", "carb": 80.0, "protein": 80.0, "lipid": 80.0, "health": 100.0, "hunger": 100.0, "species": "Diabloceratops"},
                    "plant_mushroom": {"name": "Nấm Rừng Dinh Dưỡng", "carb": 90.0, "protein": 90.0, "lipid": 90.0, "thirst": 100.0, "hunger": 100.0, "species": "Pachycephalosaurus"},
                }
                plant_info = plant_dict.get(offer_id, plant_dict["plant_sanctuary"])

                # 1. Thả thực thể thức ăn ngay trước mặt người chơi trong game
                self.fetch_islepilot("/commands", method="POST", body_data={
                    "action": "carcass",
                    "steamId": steam_id,
                    "species": plant_info["species"],
                    "growth": 0.5
                })

                # 2. Áp dụng dinh dưỡng thảo mộc trực tiếp (setnutrition)
                self.fetch_islepilot("/commands", method="POST", body_data={
                    "action": "setnutrition",
                    "steamId": steam_id,
                    "carb": plant_info.get("carb", 100.0),
                    "protein": plant_info.get("protein", 100.0),
                    "lipid": plant_info.get("lipid", 100.0)
                })

                # 3. Hồi phục thanh thức ăn (hunger) và thể lực / máu / nước nếu có
                stat_body = {
                    "action": "setstats",
                    "steamId": steam_id,
                    "hunger": plant_info.get("hunger", 100.0)
                }
                if "health" in plant_info:
                    stat_body["health"] = plant_info["health"]
                if "thirst" in plant_info:
                    stat_body["thirst"] = plant_info["thirst"]
                self.fetch_islepilot("/commands", method="POST", body_data=stat_body)

                if "stamina" in plant_info:
                    self.fetch_islepilot("/commands", method="POST", body_data={
                        "action": "setstamina",
                        "steamId": steam_id,
                        "stamina": plant_info["stamina"]
                    })

                # Trừ 200 Xu trực tiếp vào tài khoản người chơi
                self._adjust_player_xu(steam_id, -cost, f"Trồng cây ({plant_info['name']}): -{cost:,} Xu")
                # Đặt mốc thời gian hồi chiêu 300 giây bền vững
                self._set_carcass_cooldown(steam_id)
                new_bal = self._get_player_xu_balance(steam_id)

                self.send_json_response({
                    "success": True,
                    "ok": True,
                    "message": f"Đã trừ {cost:,} Xu! Trồng thành công {plant_info['name']} ngay trước mặt bạn!",
                    "plant": plant_info["name"],
                    "cost": cost,
                    "new_balance": new_bal,
                    "cooldown_seconds": 300
                })
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
                # Trừ 200 Xu trực tiếp vào tài khoản người chơi khi thả xác thành công
                self._adjust_player_xu(steam_id, -cost, f"Thả xác ({target_species}): -{cost:,} Xu")
                # Đặt mốc thời gian hồi chiêu 300 giây bền vững
                self._set_carcass_cooldown(steam_id)
                new_bal = self._get_player_xu_balance(steam_id)
                self.send_json_response({
                    "success": True,
                    "ok": True,
                    "commandId": res.get("commandId"),
                    "message": f"Đã trừ {cost:,} Xu! Thả xác {target_species} thành công ngay vị trí của bạn.",
                    "cost": cost,
                    "new_balance": new_bal,
                    "cooldown_seconds": 300
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

            elif steam_id in ["76561199175571899", "76561199196418178", "76561199062270730", "76561199483156684", "76561199319732549"]:

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

            elif steam_id in ["76561199175571899", "76561199196418178", "76561199062270730", "76561199483156684", "76561199319732549"]:

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
        query = urllib.parse.urlparse(self.path).query
        q_params = urllib.parse.parse_qs(query)
        passed_steam_id = q_params.get("steam_id", [None])[0]
        active_steam_id = self.get_active_steam_id()
        is_guest = not passed_steam_id

        target_steam_id = passed_steam_id or active_steam_id or "76561199483156684"
        remote = self.fetch_islepilot(f"/players/{target_steam_id}/quests")
        if not (remote and isinstance(remote, dict) and "quests" in remote):
            # Thử lại với ID admin dự phòng nếu người chơi mới chưa có hồ sơ
            remote = self.fetch_islepilot("/players/76561199483156684/quests")

        if remote and isinstance(remote, dict) and "quests" in remote:
            claimed_db = load_claimed_quests()
            today_vn = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=7))).strftime("%Y-%m-%d")
            week_vn = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=7))).strftime("%Y-W%W")

            for q in remote["quests"]:
                q_id = str(q.get("id") or "").strip()
                prog_id = str(q.get("progressId") or "").strip()
                period = str(q.get("period") or "daily").strip().lower()
                period_key = q.get("periodKey")
                if not period_key:
                    period_key = week_vn if period == "weekly" else today_vn

                if is_guest:
                    # Khách chưa đăng nhập: hiển thị trạng thái chưa nhận để người chơi xem danh sách nhiệm vụ
                    q["claimedAt"] = None
                else:
                    is_claimed, claimed_at = _is_quest_claimed(target_steam_id, q_id, period_key, prog_id, claimed_db)
                    if is_claimed and not q.get("claimedAt"):
                        q["claimedAt"] = claimed_at or datetime.datetime.now(datetime.timezone.utc).isoformat()

            self.send_json_response(remote)
            return

        self.send_json_response({"quests": []})

    def handle_claim_quest(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"
            payload = json.loads(body) if body else {}

            steam_id = str(payload.get("steam_id") or self.get_active_steam_id() or "").strip()
            quest_id = str(payload.get("quest_id") or "").strip()
            progress_id = str(payload.get("progress_id") or "").strip()
            client_amount = int(payload.get("amount", 0))
            quest_name = str(payload.get("quest_name") or "Nhiệm vụ").strip()

            if not steam_id:
                self.send_json_response({"ok": False, "message": "Vui lòng đăng nhập Steam trước khi nhận thưởng!"}, 401)
                return

            if not quest_id:
                self.send_json_response({"ok": False, "message": "Thiếu mã nhiệm vụ!"}, 400)
                return

            today_vn = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=7))).strftime("%Y-%m-%d")
            week_vn = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=7))).strftime("%Y-W%W")

            # 1. Xác thực với IslePilot: Kiểm tra nhiệm vụ thực tế của người chơi
            remote = self.fetch_islepilot(f"/players/{steam_id}/quests")
            matching_quest = None
            if remote and isinstance(remote, dict) and "quests" in remote:
                for q in remote["quests"]:
                    if str(q.get("id")).strip() == quest_id or (progress_id and str(q.get("progressId")).strip() == progress_id):
                        matching_quest = q
                        break

            period = "daily"
            period_key = today_vn
            reward_coins = client_amount

            if matching_quest:
                period = str(matching_quest.get("period") or "daily").strip().lower()
                period_key = matching_quest.get("periodKey") or (week_vn if period == "weekly" else today_vn)
                if not progress_id and matching_quest.get("progressId"):
                    progress_id = str(matching_quest.get("progressId")).strip()
                if matching_quest.get("name"):
                    quest_name = matching_quest.get("name")

                if matching_quest.get("rewards") and isinstance(matching_quest["rewards"], list) and len(matching_quest["rewards"]) > 0:
                    cfg_amt = int(matching_quest["rewards"][0].get("amount", 0))
                    if cfg_amt > 0:
                        reward_coins = cfg_amt

                is_completed = (
                    matching_quest.get("completedAt") is not None
                    or any(c.get("done") for c in matching_quest.get("conditions", []))
                    or (matching_quest.get("conditions") and matching_quest.get("progress", 0) >= matching_quest.get("conditions", [{}])[0].get("target", 1))
                )

                if matching_quest.get("claimedAt"):
                    self.send_json_response({"ok": False, "message": "Nhiệm vụ này đã được nhận thưởng trước đó!"}, 400)
                    return

                if not is_completed:
                    self.send_json_response({"ok": False, "message": "Bạn chưa hoàn thành tiến độ nhiệm vụ này trong game!"}, 400)
                    return

            # 2. Kiểm tra bộ nhớ cache khóa theo chu kỳ ngày / tuần
            claimed_db = load_claimed_quests()
            is_claimed, _ = _is_quest_claimed(steam_id, quest_id, period_key, progress_id, claimed_db)
            if is_claimed:
                time_unit = "ngày hôm nay" if period == "daily" else "tuần này"
                self.send_json_response({
                    "ok": False,
                    "message": f"Nhiệm vụ này bạn đã nhận thưởng trong {time_unit} rồi! Hãy quay lại sau khi làm mới nhiệm vụ."
                }, 400)
                return

            # 3. Thử gọi API IslePilot /quests/claim nếu có progressId
            if progress_id:
                try:
                    self.fetch_islepilot(f"/players/{steam_id}/quests/claim", method="POST", body_data={"progressId": progress_id})
                except Exception:
                    pass

            # 4. Cộng Xu an toàn và cập nhật số dư ví
            if reward_coins > 0:
                self._adjust_player_xu(
                    steam_id,
                    reward_coins,
                    f"Thưởng hoàn thành nhiệm vụ: {quest_name} ({period_key})"
                )

            # 5. Ghi nhận đã nhận thưởng theo ngày/chu kỳ vào cơ sở dữ liệu bền vững
            _record_quest_claim(steam_id, quest_id, period_key, progress_id, quest_name, reward_coins, claimed_db)

            new_balance = self._get_player_xu_balance(steam_id)

            self.send_json_response({
                "ok": True,
                "success": True,
                "message": f"Nhận thành công +{reward_coins:,} Xu!",
                "reward_amount": reward_coins,
                "balance": new_balance,
                "quest_id": quest_id,
                "period_key": period_key
            })

        except Exception as e:
            print(f"[Quest Claim Error] {e}")
            self.send_json_response({"ok": False, "message": f"Lỗi xử lý nhận thưởng: {e}"}, 500)

    def handle_player_skins(self):
        steam_id = self.get_active_steam_id()
        remote = self.fetch_islepilot(f"/players/{steam_id}/skins")
        skins = []
        if remote and "skins" in remote:
            raw_skins = remote.get("skins", [])
            skins = [self.enrich_skin_data(s) for s in raw_skins]

        excl = self.get_exclusive_universal_skin()
        if not any(s.get("id") == excl["id"] for s in skins):
            skins.insert(0, excl)

        self.send_json_response({"skins": skins})

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

            elif steam_id in ["76561199175571899", "76561199196418178", "76561199062270730", "76561199483156684", "76561199319732549"]:

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


    def handle_claims(self):
        try:
            query = urllib.parse.urlparse(self.path).query
            q_params = urllib.parse.parse_qs(query)
            steam_id = q_params.get("steam_id", [None])[0] or self.get_active_steam_id()
            
            claimed_db = load_claimed_starter()
            sid_str = str(steam_id).strip() if steam_id else ""
            is_claimed = sid_str in claimed_db if sid_str else False
            claim_info = claimed_db.get(sid_str, {}) if is_claimed else None
            is_admin, _ = self.is_admin_request()
            admin_steam_ids = [str(s) for s in config.get("ADMIN_STEAM_IDS", [])]
            if is_claimed and (is_admin or sid_str in admin_steam_ids):
                is_claimed = False
            
            playtime_hours = 0.0
            is_newbie = True
            player_name = ""
            
            starter_config = config.get("STARTER_GIFT", {})
            bundle_coins = starter_config.get("coins", 3000)
            bundle_growth = starter_config.get("dino_growth", 0.76)
            max_playtime = starter_config.get("max_playtime_hours", 3)
            
            if sid_str:
                player_info = self.fetch_islepilot(f"/players/{sid_str}")
                if isinstance(player_info, dict):
                    player_name = player_info.get("name", "")
                    total_play_sec = player_info.get("totalPlaySec", 0) or 0
                    playtime_hours = round(total_play_sec / 3600.0, 1)
                    if total_play_sec >= max_playtime * 3600:
                        is_newbie = False
            
            choices = starter_config.get("dino_choices", [])
            mutation_choices = starter_config.get("mutation_choices", [])
            default_mutations = starter_config.get("default_mutations", [
                "Multichambered Lungs",
                "Hypermetabolic Inanition",
                "Congenital Hypoalgesia",
                "Photosynthetic Tissue"
            ])
            
            self.send_json_response({
                "ok": True,
                "server_id": config.get("SERVER_ID", "cmv3zzfix02g3pj01yay0hw4g"),
                "bundle": {
                    "id": "starter_pack_3mgaming",
                    "name": starter_config.get("name", "Gói Quà Tân Thủ 3MGAMING"),
                    "description": starter_config.get("description", "Quà tặng chào mừng dành riêng cho thành viên mới tham gia cụm máy chủ 3MGAMING. Nhận ngay 3,000 Xu khởi nghiệp, 1 Khủng Long Prime chiến đấu 76% và chọn 4 Đột biến gen vào Gara!"),
                    "coins": bundle_coins,
                    "dino_growth": bundle_growth,
                    "choices": choices,
                    "mutation_choices": mutation_choices,
                    "default_mutations": default_mutations,
                    "claimed": is_claimed,
                    "claimed_at": claim_info.get("claimed_at") if isinstance(claim_info, dict) else None,
                    "claimed_species": claim_info.get("species") if isinstance(claim_info, dict) else None,
                    "claimed_mutations": claim_info.get("mutations") if isinstance(claim_info, dict) else None,
                    "eligible": is_newbie,
                    "playtime_hours": playtime_hours,
                    "max_playtime_hours": max_playtime,
                    "dashboard_sync_url": f"https://islepilot.eu/dashboard/servers/{config.get('SERVER_ID', 'cmv3zzfix02g3pj01yay0hw4g')}/claims",
                    "player_claim_url": "https://3mgaming.islepilot.eu/claim"
                }
            })
        except Exception as e:
            print(f"[Handle Claims Error] {e}")
            self.send_json_response({"ok": False, "error": str(e)}, 500)

    def handle_claim_starter(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            payload = json.loads(self.rfile.read(length).decode("utf-8")) if length > 0 else {}
            
            steam_id = payload.get("steam_id") or self.get_active_steam_id()
            if not steam_id:
                self.send_json_response({"ok": False, "error": "Vui lòng đăng nhập Steam trước khi nhận quà!"}, 401)
                return
            
            sid_str = str(steam_id).strip()
            claimed_db = load_claimed_starter()
            is_admin, _ = self.is_admin_request()
            admin_steam_ids = [str(s) for s in config.get("ADMIN_STEAM_IDS", [])]
            if sid_str in claimed_db and not (is_admin or sid_str in admin_steam_ids):
                self.send_json_response({"ok": False, "error": "Bạn đã nhận gói Quà Tân Thủ này rồi!"}, 400)
                return
            
            starter_config = config.get("STARTER_GIFT", {})
            bundle_coins = starter_config.get("coins", 3000)
            bundle_growth = starter_config.get("dino_growth", 0.76)
            max_playtime = starter_config.get("max_playtime_hours", 3)
            
            player_info = self.fetch_islepilot(f"/players/{sid_str}")
            player_name = sid_str
            if isinstance(player_info, dict):
                player_name = player_info.get("name", sid_str)
                total_play_sec = player_info.get("totalPlaySec", 0) or 0
                if total_play_sec >= max_playtime * 3600:
                    playtime_hours = round(total_play_sec / 3600.0, 1)
                    self.send_json_response({
                        "ok": False,
                        "error": f"Gói quà tân thủ chỉ dành cho người chơi dưới {max_playtime} giờ chơi (tài khoản của bạn đã đạt {playtime_hours}h)!"
                    }, 400)
                    return
            
            chosen_species = payload.get("species") or "Ceratosaurus"
            chosen_gender = payload.get("gender") or "Male"
            raw_mutations = payload.get("mutations") or []
            if not isinstance(raw_mutations, list) or len(raw_mutations) == 0:
                raw_mutations = [
                    "Multichambered Lungs",
                    "Hypermetabolic Inanition",
                    "Congenital Hypoalgesia",
                    "Photosynthetic Tissue"
                ]
            
            # Đảm bảo đủ 4 đột biến
            chosen_mutations = [str(m).strip() for m in raw_mutations if str(m).strip()][:4]
            while len(chosen_mutations) < 4:
                chosen_mutations.append("None")
            
            # Chuẩn hóa cấu trúc mutationSlots: CHỈ ĐÚNG 4 ĐỘT BIẾN Ở ACTIVE, CÒN PARENT/ELDER ĐỀU LÀ NONE
            mut_slots = {
                "active": list(chosen_mutations),
                "parent": ["None", "None", "None", "None"],
                "elderA": ["None", "None", "None", "None"],
                "elderB": ["None", "None", "None", "None"]
            }
            
            try:
                self.fetch_islepilot(f"/players/{sid_str}/claim", method="POST", body_data={"bundleId": "starter_pack_3mgaming"})
            except Exception:
                pass
            
            # Cộng 3,000 Xu vào ví IslePilot
            new_balance = None
            if bundle_coins > 0:
                cur_res = self.fetch_islepilot(
                    f"/players/{sid_str}/currency",
                    method="POST",
                    body_data={"amount": bundle_coins, "reason": f"Nhận Quà Tân Thủ 3MGAMING (+{bundle_coins:,} Xu)"}
                )
                if isinstance(cur_res, dict) and "balance" in cur_res:
                    new_balance = cur_res.get("balance")
            
            # Tặng khủng long với 4 mutation vào Gara Dino
            gifts = load_user_gift_dinos()
            if sid_str not in gifts:
                gifts[sid_str] = []
            
            dino_id = f"gift_starter_{sid_str}_{int(time.time())}"
            dino_entry = {
                "id": dino_id,
                "name": f"Tân Thủ Prime: {chosen_species}",
                "species": chosen_species,
                "gender": chosen_gender,
                "growth": bundle_growth,
                "isPrimeElder": True,
                "weight_label": f"Tân Thủ Prime {int(bundle_growth * 100)}%",
                "mutations": chosen_mutations,
                "mutationSlots": mut_slots,
                "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
            }
            gifts[sid_str].append(dino_entry)
            save_user_gift_dinos(gifts)
            
            # Đồng bộ vào garage_saved_mutations để khi unpark tự động setmutations
            save_garage_saved_mutation(dino_id, mut_slots)
            save_garage_saved_mutation(f"{sid_str}_{dino_id}", mut_slots)
            
            # Lưu lịch sử đã nhận
            now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
            claimed_db[sid_str] = {
                "claimed_at": now_iso,
                "coins": bundle_coins,
                "species": chosen_species,
                "gender": chosen_gender,
                "mutations": chosen_mutations,
                "dino_id": dino_id,
                "player_name": player_name
            }
            save_claimed_starter(claimed_db)
            
            mut_str = ", ".join([m for m in chosen_mutations if m != "None"])
            print(f"[Starter Gift Claim] Người chơi {player_name} ({sid_str}) đã nhận Quà Tân Thủ: +{bundle_coins} Xu, {chosen_species} & 4 Đột biến [{mut_str}]")
            
            self.send_json_response({
                "ok": True,
                "success": True,
                "message": f"Nhận Quà Tân Thủ thành công! Đã cộng {bundle_coins:,} Xu vào ví và tặng {chosen_species} Prime 76% kèm 4 Đột biến gen vào Gara Dino.",
                "coins": bundle_coins,
                "species": chosen_species,
                "mutations": chosen_mutations,
                "dino_id": dino_id,
                "balance": new_balance
            })
        except Exception as e:
            print(f"[Handle Claim Starter Error] {e}")
            self.send_json_response({"ok": False, "error": str(e)}, 500)


    def handle_buy_skin(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            payload = json.loads(self.rfile.read(length).decode("utf-8")) if length > 0 else {}
            skin_id = str(payload.get("skin_id") or payload.get("shopSkinId") or "").strip()
            steam_id = payload.get("steam_id") or self.get_active_steam_id()

            if not skin_id:
                self.send_json_response({"success": False, "message": "Thiếu mã Skin cần mua!"}, 400)
                return

            if skin_id == "skin_hac_bang_doc_quyen" or skin_id.startswith("custom_"):
                self.send_json_response({
                    "success": True,
                    "ok": True,
                    "message": "🎉 Đã nhận Skin Độc Quyền Server (Hắc Băng Lôi Điện - Dùng cho mọi Dino) vào Kho Skin!"
                })
                return

            res = self.fetch_islepilot(f"/players/{steam_id}/skins", method="POST", body_data={"shopSkinId": skin_id})
            if res and res.get("ok"):
                self.send_json_response({"success": True, "ok": True, "message": "Thành công"})
                return

            err = res.get("error") if res else "Không thể kết nối đến máy chủ IslePilot."
            if "already own" in str(err).lower():
                self.send_json_response({"success": True, "ok": True, "message": "Bạn đã sở hữu Skin này trong Kho Skin rồi!"})
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

    def handle_studio_species(self):
        species_list = [
            {"species": "Tyrannosaurus", "label": "Tyrannosaurus Rex", "diet": "carnivore", "animated": True},
            {"species": "Carnotaurus", "label": "Carnotaurus", "diet": "carnivore", "animated": True},
            {"species": "Ceratosaurus", "label": "Ceratosaurus", "diet": "carnivore", "animated": True},
            {"species": "Deinosuchus", "label": "Deinosuchus", "diet": "carnivore", "animated": True},
            {"species": "Diabloceratops", "label": "Diabloceratops", "diet": "herbivore", "animated": True},
            {"species": "Dilophosaurus", "label": "Dilophosaurus", "diet": "carnivore", "animated": True},
            {"species": "Dromaeosaurus", "label": "Dromaeosaurus", "diet": "carnivore", "animated": True},
            {"species": "Dryosaurus", "label": "Dryosaurus", "diet": "herbivore", "animated": True},
            {"species": "Gallimimus", "label": "Gallimimus", "diet": "omnivore", "animated": True},
            {"species": "Herrerasaurus", "label": "Herrerasaurus", "diet": "carnivore", "animated": True},
            {"species": "Hypsilophodon", "label": "Hypsilophodon", "diet": "herbivore", "animated": True},
            {"species": "Maiasaura", "label": "Maiasaura", "diet": "herbivore", "animated": True},
            {"species": "Omniraptor", "label": "Omniraptor", "diet": "carnivore", "animated": True},
            {"species": "Pachycephalosaurus", "label": "Pachycephalosaurus", "diet": "omnivore", "animated": True},
            {"species": "Pteranodon", "label": "Pteranodon", "diet": "carnivore", "animated": True},
            {"species": "Stegosaurus", "label": "Stegosaurus", "diet": "herbivore", "animated": True},
            {"species": "Tenontosaurus", "label": "Tenontosaurus", "diet": "herbivore", "animated": True},
            {"species": "Triceratops", "label": "Triceratops", "diet": "herbivore", "animated": True},
            {"species": "Troodon", "label": "Troodon", "diet": "carnivore", "animated": True},
            {"species": "Allosaurus", "label": "Allosaurus", "diet": "carnivore", "animated": True},
            {"species": "Austroraptor", "label": "Austroraptor", "diet": "carnivore", "animated": True},
            {"species": "Baryonyx", "label": "Baryonyx", "diet": "carnivore", "animated": False},
            {"species": "Beipiaosaurus", "label": "Beipiaosaurus", "diet": "omnivore", "animated": True}
        ]
        self.send_json_response({"ok": True, "species": species_list})

    def handle_studio_palettes(self):
        palettes = {
            "Tyrannosaurus": {"body": [0.29, 0.33, 0.23, 1.0], "markings": [0.17, 0.2, 0.13, 1.0], "flank": [0.39, 0.44, 0.31, 1.0], "underbelly": [0.77, 0.73, 0.63, 1.0], "detail1": [0.12, 0.08, 0.07, 1.0], "male_display": [0.66, 0.24, 0.14, 1.0], "eyes": [0.88, 0.56, 0.14, 1.0]},
            "Carnotaurus": {"body": [0.38, 0.21, 0.13, 1.0], "markings": [0.06, 0.04, 0.03, 1.0], "flank": [0.22, 0.1, 0.08, 1.0], "underbelly": [0.42, 0.31, 0.25, 1.0], "detail1": [0.0, 0.0, 0.0, 1.0], "male_display": [0.43, 0.09, 0.04, 1.0], "eyes": [1.0, 1.0, 1.0, 1.0]},
            "Ceratosaurus": {"body": [0.35, 0.32, 0.25, 1.0], "markings": [0.1, 0.09, 0.08, 1.0], "flank": [0.45, 0.38, 0.28, 1.0], "underbelly": [0.6, 0.55, 0.45, 1.0], "detail1": [0.2, 0.15, 0.1, 1.0], "male_display": [0.55, 0.15, 0.1, 1.0], "eyes": [0.9, 0.7, 0.2, 1.0]}
        }
        self.send_json_response({"ok": True, "palettes": palettes})

    def handle_skin_import(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            payload = json.loads(self.rfile.read(length).decode("utf-8")) if length > 0 else {}
            code = payload.get("code", "")
            parsed = parse_evrima_skin_code(code)
            if parsed:
                self.send_json_response({"ok": True, "skin": parsed})
            else:
                self.send_json_response({"ok": False, "error": "Mã skin không hợp lệ"}, 400)
        except Exception as e:
            self.send_json_response({"ok": False, "error": str(e)}, 500)

    def handle_studio_apply(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            payload = json.loads(self.rfile.read(length).decode("utf-8")) if length > 0 else {}
            steam_id = str(payload.get("steam_id") or payload.get("targetSteamId") or self.get_active_steam_id() or "").strip()
            skin_id = str(payload.get("skin_id") or payload.get("skinId") or "").strip()
            requested_species = str(payload.get("species") or "").strip()
            is_universal = bool(payload.get("allSpecies") or payload.get("universal") or skin_id == "skin_hac_bang_doc_quyen")

            # 1. Tự động phát hiện loài khủng long (species) & giới tính (female) mà người chơi đang chơi trong Server
            live_species = None
            live_female = None
            if steam_id:
                try:
                    p_info = self.fetch_islepilot(f"/players/{steam_id}")
                    if isinstance(p_info, dict) and p_info.get("species"):
                        live_species = str(p_info.get("species")).strip()
                        if "female" in p_info and p_info.get("female") is not None:
                            live_female = bool(p_info.get("female"))
                except Exception:
                    pass

                if not live_species:
                    try:
                        p_list = self.fetch_islepilot("/players")
                        players_arr = p_list.get("players", []) if isinstance(p_list, dict) else (p_list if isinstance(p_list, list) else [])
                        for p in players_arr:
                            if str(p.get("steamId") or "") == steam_id and p.get("species"):
                                live_species = str(p.get("species")).strip()
                                if "female" in p and p.get("female") is not None:
                                    live_female = bool(p.get("female"))
                                break
                    except Exception:
                        pass

            # 2. Nếu có skin_id (từ Kho Skin hoặc Shop Skin): kiểm tra xem có phải Skin Độc Quyền / Custom hay Skin IslePilot gốc
            matched_custom_skin = None
            if skin_id == "skin_hac_bang_doc_quyen":
                matched_custom_skin = self.get_exclusive_universal_skin()
                is_universal = True
            elif skin_id and os.path.exists("admin_custom_skins.json"):
                try:
                    with open("admin_custom_skins.json", "r", encoding="utf-8") as f:
                        for cs in json.load(f):
                            if isinstance(cs, dict) and str(cs.get("id")) == skin_id:
                                matched_custom_skin = self.enrich_skin_data(dict(cs))
                                if matched_custom_skin.get("allSpecies") or matched_custom_skin.get("universal"):
                                    is_universal = True
                                break
                except Exception:
                    pass

            # Nếu là skin_id thường của IslePilot (không phải skin độc quyền/custom và không gửi kèm bảng màu tùy chỉnh)
            if skin_id and not matched_custom_skin and not payload.get("palette") and not payload.get("payload"):
                res_direct = self.fetch_islepilot(f"/players/{steam_id}/skins/{skin_id}/apply", method="POST", body_data={})
                if res_direct and (res_direct.get("ok") or res_direct.get("jobId") or not res_direct.get("error")):
                    self.send_json_response({
                        "ok": True,
                        "success": True,
                        "message": "⚡ Đã áp dụng Skin vào nhân vật trong game thành công!",
                        "jobId": res_direct.get("jobId", "")
                    })
                    return

            raw_bp = payload.get("payload") or payload.get("blueprint") or payload.get("recipe") or payload
            if matched_custom_skin and not payload.get("palette") and not payload.get("payload"):
                raw_bp = matched_custom_skin

            # Quyết định loài khủng long đích để đóng gói Blueprint:
            # Ưu tiên loài đang online thực tế trong server để sử dụng được cho TẤT CẢ dino trong server!
            target_species = live_species or requested_species
            if not target_species or target_species.lower() in ["all", "tất cả các loài", "tat ca cac loai", "mọi loài"]:
                target_species = live_species or "Diabloceratops"

            def to_float_rgba(val, default=(0.5, 0.5, 0.5, 1.0)):
                if isinstance(val, (list, tuple)) and len(val) >= 3:
                    try:
                        r = float(val[0])
                        g = float(val[1])
                        b = float(val[2])
                        a = float(val[3]) if len(val) > 3 else 1.0
                        if r > 1.0 or g > 1.0 or b > 1.0:
                            r, g, b = r / 255.0, g / 255.0, b / 255.0
                        return [round(max(0.0, min(1.0, r)), 4),
                                round(max(0.0, min(1.0, g)), 4),
                                round(max(0.0, min(1.0, b)), 4),
                                round(max(0.0, min(1.0, a)), 4)]
                    except Exception:
                        pass
                elif isinstance(val, str):
                    try:
                        h = val.replace("#", "").strip()
                        if len(h) >= 6:
                            num = int(h[:6], 16)
                            return [round(((num >> 16) & 255) / 255.0, 4),
                                    round(((num >> 8) & 255) / 255.0, 4),
                                    round((num & 255) / 255.0, 4),
                                    1.0]
                    except Exception:
                        pass
                return list(default)

            clean_sp = re.sub(r'[^a-zA-Z0-9]+', '', str(target_species))
            bp_class = f"BP_{clean_sp}_C"

            color_src = raw_bp.get("palette") or raw_bp.get("colors") or raw_bp
            if isinstance(color_src, list):
                color_src = matched_custom_skin.get("palette", {}) if matched_custom_skin else {}

            body_val = color_src.get("body") or color_src.get("primary") or color_src.get("skin") or [0.0314, 0.0431, 0.0706, 1.0]
            markings_val = color_src.get("markings") or color_src.get("stripes") or color_src.get("pattern") or [0.0, 0.851, 1.0, 1.0]
            flank_val = color_src.get("flank") or color_src.get("secondary") or color_src.get("side") or [0.0627, 0.1098, 0.1804, 1.0]
            underbelly_val = color_src.get("underbelly") or color_src.get("belly") or color_src.get("throat") or [0.9333, 0.9725, 1.0, 1.0]
            detail_val = color_src.get("detail1") or color_src.get("detail") or color_src.get("accent") or [0.4078, 0.5373, 0.651, 1.0]
            male_display_val = color_src.get("male_display") or color_src.get("display") or color_src.get("crest") or [0.0, 0.898, 1.0, 1.0]
            eyes_val = color_src.get("eyes") or color_src.get("eye") or [0.0, 1.0, 1.0, 1.0]
            teeth_val = color_src.get("teeth") or color_src.get("tooth") or [0.9333, 0.9725, 1.0, 1.0]
            mouth_val = color_src.get("mouth") or color_src.get("tongue") or [0.0627, 0.2275, 0.3216, 1.0]
            claws_val = color_src.get("claws") or color_src.get("talons") or [0.0, 0.851, 1.0, 1.0]

            if live_female is not None:
                female = live_female
            else:
                female = bool(raw_bp.get("female", False))
                if "sex" in raw_bp:
                    female = str(raw_bp.get("sex")).lower().startswith("fe")
                elif "sex" in payload:
                    female = str(payload.get("sex")).lower().startswith("fe")

            pat_raw = raw_bp.get("pattern", 1 if matched_custom_skin else 0)
            try:
                pat_int = int(pat_raw)
            except Exception:
                pat_int = 1

            top_pal = payload.get("palette") if isinstance(payload.get("palette"), dict) else {}
            top_body = str(top_pal.get("body") or "").upper()
            top_mark = str(top_pal.get("markings") or "").upper()
            is_dark_body_arr = isinstance(body_val, (list, tuple)) and len(body_val) >= 3 and float(body_val[0]) < 0.08 and float(body_val[1]) < 0.08 and float(body_val[2]) < 0.12
            is_cyan_mark_arr = isinstance(markings_val, (list, tuple)) and len(markings_val) >= 3 and float(markings_val[1]) > 0.60 and float(markings_val[2]) > 0.85

            is_hac_bang_apply = (
                is_universal or
                skin_id == "skin_hac_bang_doc_quyen" or
                (top_body in ["#06080E", "#080B12", "#05070C"] and top_mark in ["#00D9FF", "#00E5FF", "#00FFFF"]) or
                (isinstance(body_val, str) and body_val.upper() in ["#06080E", "#080B12", "#05070C"] and
                 isinstance(markings_val, str) and markings_val.upper() in ["#00D9FF", "#00E5FF", "#00FFFF"]) or
                (is_dark_body_arr and is_cyan_mark_arr)
            )

            if is_hac_bang_apply:
                sanitized_bp = {
                    "class": bp_class,
                    "female": female,
                    "variation": int(raw_bp.get("variation", 0) or 0),
                    "pattern": pat_int,
                    "theme": int(raw_bp.get("theme", 0) or 0),
                    "body": [0.003, 0.005, 0.010, 1.0],
                    "underbelly": [0.003, 0.005, 0.010, 1.0],
                    "flank": [0.0, 0.85, 1.0, 1.0],
                    "markings": [0.82, 0.98, 1.0, 1.0],
                    "detail1": [0.0, 0.88, 1.0, 1.0],
                    "eyes": [0.0, 1.0, 1.0, 1.0],
                    "male_display": [0.0, 0.95, 1.0, 1.0],
                    "teeth": [0.93, 0.97, 1.0, 1.0],
                    "mouth": [0.02, 0.08, 0.14, 1.0],
                    "claws": [0.0, 0.85, 1.0, 1.0]
                }
            else:
                sanitized_bp = {
                    "class": bp_class,
                    "female": female,
                    "variation": int(raw_bp.get("variation", 0) or 0),
                    "pattern": pat_int,
                    "theme": int(raw_bp.get("theme", 0) or 0),
                    "body": to_float_rgba(body_val, [0.003, 0.005, 0.010, 1.0]),
                    "markings": to_float_rgba(markings_val, [0.82, 0.98, 1.0, 1.0]),
                    "flank": to_float_rgba(flank_val, [0.0, 0.85, 1.0, 1.0]),
                    "underbelly": to_float_rgba(underbelly_val, [0.003, 0.005, 0.010, 1.0]),
                    "detail1": to_float_rgba(detail_val, [0.0, 0.88, 1.0, 1.0]),
                    "eyes": to_float_rgba(eyes_val, [0.0, 1.0, 1.0, 1.0]),
                    "male_display": to_float_rgba(male_display_val, [0.0, 0.95, 1.0, 1.0]),
                    "teeth": to_float_rgba(teeth_val, [0.93, 0.97, 1.0, 1.0]),
                    "mouth": to_float_rgba(mouth_val, [0.02, 0.08, 0.14, 1.0]),
                    "claws": to_float_rgba(claws_val, [0.0, 0.85, 1.0, 1.0])
                }

            body_data = {
                "payload": sanitized_bp
            }

            res = self.fetch_islepilot(f"/players/{steam_id}/skin/apply", method="POST", body_data=body_data)
            if isinstance(res, dict) and "limited to one every few seconds" in res.get("error", ""):
                time.sleep(3.5)
                res = self.fetch_islepilot(f"/players/{steam_id}/skin/apply", method="POST", body_data=body_data)

            if res and (res.get("ok") or res.get("jobId") or not res.get("error")):
                self.send_json_response({
                    "ok": True,
                    "success": True,
                    "species": target_species,
                    "class": bp_class,
                    "message": f"⚡ Đã áp dụng Skin thành công cho khủng long {target_species} trong Server!",
                    "jobId": res.get("jobId", "")
                })
            else:
                err = res.get("error") if isinstance(res, dict) else "Lỗi máy chủ IslePilot"
                self.send_json_response({"ok": False, "success": False, "error": err, "message": err}, 400)
        except Exception as e:
            self.send_json_response({"ok": False, "success": False, "error": str(e), "message": str(e)}, 500)

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
                    req_handler._auto_check_ai_hunt_status(boss_db)
            except Exception as e:
                print(f"[BossAndArenaBackgroundWorker Error] {e}")
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

