import os
import json

# Mặc định cấu hình server IslePilot của bạn
DEFAULT_CONFIG = {
    "SERVER_ID": "cmv3zzfix02g3pj01yay0hw4g",
    "ISLEPILOT_API_KEY": "",  # Điền API Key lấy từ https://islepilot.eu/dashboard/servers/cmv3zzfix02g3pj01yay0hw4g/api
    "ISLEPILOT_BASE_URL": "https://islepilot.eu/api",
    "SERVER_NAME": "3MGAMING",
    "SERVER_MOTD": "Server The Isle: Evrima cho người Việt. Map Gateway, Voice chat trong game, không mật khẩu, luật rõ ràng.",
    "SERVER_IP": "103.179.189.50",
    "SERVER_PORT": 7777,
    "MAX_SLOTS": 100,
    "MAX_GARAGE_SLOTS": 5,
    "GARAGE_PARK_SECONDS": 30,
    "DISCORD_URL": "https://discord.gg/f3R9mMAfms",
    "PORT": 8000,
    "HOST": "0.0.0.0",
    "ADMIN_STEAM_IDS": ["76561199175571899", "76561199196418178", "76561199062270730", "76561199483156684"],
    "MAP_ONLY_ADMIN_STEAM_IDS": ["76561199319732549"],
    "ADMIN_DISCORD_IDS": ["749270027605114922"],
    "ADMIN_PASSCODE": "admin3m"
}

CONFIG_FILE = "config.json"

def load_config():
    config = DEFAULT_CONFIG.copy()
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                saved = json.load(f)
                config.update(saved)
        except Exception as e:
            print(f"[Config] Lỗi đọc {CONFIG_FILE}: {e}")
    
    # Ghi đè bằng biến môi trường nếu có
    for key in config:
        if key in os.environ:
            val = os.environ[key]
            if isinstance(config[key], int):
                try:
                    val = int(val)
                except ValueError:
                    pass
            config[key] = val
            
    return config

def save_config(cfg):
    try:
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(cfg, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"[Config] Lỗi lưu {CONFIG_FILE}: {e}")
        return False

