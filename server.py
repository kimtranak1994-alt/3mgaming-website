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
            "female": (str(sex).lower() == "female"),
            "variation": int(variation or 0),
            "pattern": int(pattern if pattern is not None else 1),
            "theme": int(theme or 0),
            "body": [0.003, 0.005, 0.010, 1.0],
            "underbelly": [0.003, 0.005, 0.010, 1.0],
            "flank": [0.0, 0.85, 1.0, 1.0],
            "markings": [0.82, 0.98, 1.0, 1.0],
            "detail1": [0.0, 0.88, 1.0, 1.0],
            "male_display": [0.0, 0.95, 1.0, 1.0],
            "eyes": [0.0, 1.0, 1.0, 1.0],
            "teeth": [0.93, 0.97, 1.0, 1.0],
            "mouth": [0.02, 0.08, 0.14, 1.0],
            "claws": [0.0, 0.85, 1.0, 1.0]
        }

    return {
        "class": bp_class,
        "female": (str(sex).lower() == "female"),
        "variation": int(variation or 0),
        "pattern": int(pattern or 0),
        "theme": int(theme or 0),
        "body": hex_to_float_rgba(pal.get("body", "#06080E")),
        "markings": hex_to_float_rgba(pal.get("markings", "#00D9FF")),
        "flank": hex_to_float_rgba(pal.get("flank", "#00D9FF")),
        "underbelly": hex_to_float_rgba(pal.get("underbelly", "#06080E")),
        "detail1": hex_to_float_rgba(pal.get("detail1") or pal.get("detail", "#00E0FF")),
        "eyes": hex_to_float_rgba(pal.get("eyes", "#00FFFF")),
        "male_display": hex_to_float_rgba(pal.get("male_display") or pal.get("display", "#00F2FF")),
        "teeth": hex_to_float_rgba(pal.get("teeth", "#EEF8FF")),
        "mouth": hex_to_float_rgba(pal.get("mouth", "#0A2233")),
        "claws": hex_to_float_rgba(pal.get("claws", "#00D9FF"))
    }

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

