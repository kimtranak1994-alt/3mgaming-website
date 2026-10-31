#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CÔNG CỤ NẠP TRỰC TIẾP MOD SKIN HẮC BĂNG LÔI ĐIỆN VÀO FILE SAVE CỦA SERVER THE ISLE EVRIMA
Hoạt động độc lập 100% - KHÔNG CẦN THÔNG QUA ISLEPILOT!
Hỗ trợ nạp cho 1 SteamID hoặc toàn bộ người chơi trong thư mục Saved/Databases/Survival/Players
"""
import os
import sys
import json
import glob
from pathlib import Path

HAC_BANG_UE4_CHANNELS = {
    "Pattern": 1,
    "Variation": 0,
    "Theme": 0,
    # Chuẩn kênh màu UE4 The Isle Evrima (có đầy đủ vệt sáng xanh ở Bụng, Lưng, Chân, Đầu, Mào, Gai lưng)
    "Markings": {"R": 0.003, "G": 0.005, "B": 0.010, "A": 1.0},      # Nền da chính Đen Huyền
    "Flank": {"R": 0.0, "G": 0.92, "B": 1.0, "A": 1.0},              # Sọc sáng trên Lưng, Đầu, Chân, Sườn
    "Underbelly": {"R": 0.0, "G": 0.86, "B": 1.0, "A": 1.0},         # Vệt sáng dưới Bụng, Cổ, Họng, Gầm đuôi
    "Body": {"R": 0.65, "G": 0.97, "B": 1.0, "A": 1.0},              # Tia sét Trắng băng dọc Chân, Viền bụng, Đầu
    "Detail1": {"R": 0.0, "G": 1.0, "B": 1.0, "A": 1.0},             # Vảy cứng trên Lưng & Đầu
    "MaleDisplay": {"R": 0.0, "G": 1.0, "B": 1.0, "A": 1.0},         # Gai sống lưng, Viền mào & Sừng
    "EyeColor": {"R": 0.0, "G": 1.0, "B": 1.0, "A": 1.0},
    "Teeth": {"R": 0.93, "G": 0.97, "B": 1.0, "A": 1.0},
    "Mouth": {"R": 0.02, "G": 0.08, "B": 0.14, "A": 1.0},
    "Claws": {"R": 0.0, "G": 0.90, "B": 1.0, "A": 1.0},
    # Mảng float tương thích mọi phiên bản Save JSON của Evrima
    "markings": [0.003, 0.005, 0.010, 1.0],
    "flank": [0.0, 0.92, 1.0, 1.0],
    "underbelly": [0.0, 0.86, 1.0, 1.0],
    "body": [0.65, 0.97, 1.0, 1.0],
    "detail1": [0.0, 1.0, 1.0, 1.0],
    "male_display": [0.0, 1.0, 1.0, 1.0],
    "eyes": [0.0, 1.0, 1.0, 1.0],
    "teeth": [0.93, 0.97, 1.0, 1.0],
    "mouth": [0.02, 0.08, 0.14, 1.0],
    "claws": [0.0, 0.90, 1.0, 1.0]
}

def patch_player_save_file(json_path: Path) -> bool:
    try:
        raw = json.loads(json_path.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"[!] Không đọc được {json_path}: {e}")
        return False

    species_raw = str(raw.get("Class") or raw.get("class") or "Diabloceratops")
    clean_sp = species_raw.replace("BP_", "").replace("_C", "").strip() or "Diabloceratops"
    skin_code = f"{clean_sp}10000D9FFFFA6F7FFFF00E5FFFF06080EFF00FFFFFF00FFFFFF"

    # Cập nhật trực tiếp các trường Skin trong file Save của Server The Isle Evrima
    raw["SkinCode"] = skin_code
    raw["skinCode"] = skin_code
    raw["Pattern"] = 1
    raw["pattern"] = 1
    raw["Variation"] = 0
    raw["variation"] = 0
    raw["Theme"] = 0
    raw["theme"] = 0

    for k, v in HAC_BANG_UE4_CHANNELS.items():
        raw[k] = v

    if isinstance(raw.get("SkinData"), dict):
        raw["SkinData"].update(HAC_BANG_UE4_CHANNELS)
        raw["SkinData"]["SkinCode"] = skin_code

    if isinstance(raw.get("Skin"), dict):
        raw["Skin"].update(HAC_BANG_UE4_CHANNELS)
        raw["Skin"]["SkinCode"] = skin_code

    backup_path = json_path.with_suffix(".json.bak")
    if not backup_path.exists():
        backup_path.write_bytes(json_path.read_bytes())

    json_path.write_text(json.dumps(raw, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[✓] Đã nạp Mod Hắc Băng Lôi Điện trực tiếp vào: {json_path.name} (Loài: {clean_sp})")
    return True

def main():
    print("=" * 76)
    print("  👑 CÔNG CỤ NẠP TRỰC TIẾP SKIN HẮC BĂNG LÔI ĐIỆN VÀO SERVER SAVE (NO ISLEPILOT)")
    print("=" * 76)
    target_path = sys.argv[1] if len(sys.argv) > 1 else input("Nhập đường dẫn thư mục Players (Saved/Databases/Survival/Players) hoặc file <SteamID>.json: ").strip().strip('"')
    if not target_path:
        print("[!] Bạn chưa nhập đường dẫn.")
        return

    p = Path(target_path)
    if p.is_file() and p.suffix.lower() == ".json":
        patch_player_save_file(p)
    elif p.is_dir():
        steam_id = input("Nhập SteamID cần nạp (hoặc nhấn Enter để nạp cho TẤT CẢ người chơi trong thư mục): ").strip()
        if steam_id:
            f_path = p / f"{steam_id}.json"
            if f_path.exists():
                patch_player_save_file(f_path)
            else:
                print(f"[!] Không tìm thấy file {f_path}")
        else:
            count = 0
            for jf in sorted(p.glob("*.json")):
                if patch_player_save_file(jf):
                    count += 1
            print(f"\n[HOÀN TẤT] Đã nạp trực tiếp Mod Skin cho {count} nhân vật trên Server!")
    else:
        print(f"[!] Đường dẫn không tồn tại: {target_path}")

if __name__ == "__main__":
    main()
