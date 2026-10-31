================================================================================
👑 BỘ FILE MOD RIÊNG: HẮC BĂNG LÔI ĐIỆN (100% ĐỘC LẬP - KHÔNG CẦN ISLEPILOT)
================================================================================

Bộ Mod này được thiết kế để bạn sử dụng trực tiếp 100% mà KHÔNG phụ thuộc vào IslePilot,
bao gồm 4 cách sử dụng tùy theo nhu cầu của bạn (Client Game, Server Save, 3D Texture Mod, và Web Studio):

--------------------------------------------------------------------------------
CÁCH 1: CÀI TRỰC TIẾP VÀO GAME CLIENT (DÙNG CHO MỌI SERVER - KHÔNG CẦN ISLEPILOT)
--------------------------------------------------------------------------------
1. Chạy file: `1_Cai_Dat_Mod_Skin_Vao_Game_Client.bat`
2. File này sẽ tự động ghi bộ màu Hắc Băng Lôi Điện (cho cả 26 loài khủng long) vào:
   `%LOCALAPPDATA%\TheIsle\Saved\Config\WindowsClient\Skins.ini`
   và tự động Copy mã Skin Code vào bộ nhớ tạm (Clipboard).
3. Vào game The Isle Evrima -> Mục chọn Skin -> Chọn preset `HacBangLoiDien` hoặc
   nhấn `Ctrl + V` để dán mã Skin Code trực tiếp!

--------------------------------------------------------------------------------
CÁCH 2: NẠP THẲNG VÀO FILE SAVE CỦA DEDICATED SERVER (KHÔNG QUA API ISLEPILOT)
--------------------------------------------------------------------------------
1. Chạy file: `2_Chay_Nap_Skin_Server_Save.bat` (hoặc chạy `2_Injector_Server_Save_Khong_Can_IslePilot.py`)
2. Nhập đường dẫn tới thư mục lưu nhân vật của Server:
   `<Thư_mục_Server_TheIsle>\TheIsle\Saved\Databases\Survival\Players`
3. Nhập SteamID của người chơi (hoặc nhấn Enter để áp dụng cho toàn bộ người chơi).
   Tool sẽ sửa trực tiếp file `<SteamID>.json` với đầy đủ các đường sáng xanh trên
   Bụng, Lưng, Chân, Đầu, Mào và Gai lưng mà không cần dùng IslePilot!

--------------------------------------------------------------------------------
CÁCH 3: BỘ TEXTURE 3D ĐÃ BAKE 100% TIA SÉT (`Textures_3D_Baked/`)
--------------------------------------------------------------------------------
Thư mục `Textures_3D_Baked/` chứa 3 file Texture gốc 1024x1024 đã được vẽ (bake)
sẵn 100% các tia sét Trắng băng & Xanh ngọc trên Đầu, Lưng, Bụng, Chân, Mào, Gai lưng:
- `diffuse_hac_bang.png`   : Texture bề mặt vảy Đen Huyền + Tia sét Băng Lôi Điện 100% giống ảnh mẫu.
- `tint_mask_hac_bang.png` : Mặt nạ phân vùng kênh màu UE4 đã khắc sẵn tia sét vào kênh Blue/Cyan.
- `pattern_hac_bang.png`   : Hoa văn độ sáng tia sét dùng để đóng gói `.pak` Unreal Engine 4/5.

--------------------------------------------------------------------------------
CÁCH 4: FILE MOD JSON ĐỘC LẬP (`Hac_Bang_Loi_Dien_Mod_Standalone.json`)
--------------------------------------------------------------------------------
- Dùng để kéo-thả trực tiếp vào mục "Nạp Mod Skin" trên giao diện Studio (`/studio`)
  hoặc tích hợp vào bất kỳ hệ thống quản lý Server nào mà không cần IslePilot.

================================================================================
MÃ SKIN CODE CHUẨN CHO CÁC LOÀI PHỔ BIẾN:
- Diabloceratops : Diabloceratops10000D9FFFFA6F7FFFF00E5FFFF06080EFF00FFFFFF00FFFFFF
- Tyrannosaurus  : Tyrannosaurus10000D9FFFFA6F7FFFF00E5FFFF06080EFF00FFFFFF00FFFFFF
- Triceratops    : Triceratops10000D9FFFFA6F7FFFF00E5FFFF06080EFF00FFFFFF00FFFFFF
- Stegosaurus    : Stegosaurus10000D9FFFFA6F7FFFF00E5FFFF06080EFF00FFFFFF00FFFFFF
- Carnotaurus    : Carnotaurus10000D9FFFFA6F7FFFF00E5FFFF06080EFF00FFFFFF00FFFFFF
- Deinosuchus    : Deinosuchus10000D9FFFFA6F7FFFF00E5FFFF06080EFF00FFFFFF00FFFFFF
- Omniraptor     : Omniraptor10000D9FFFFA6F7FFFF00E5FFFF06080EFF00FFFFFF00FFFFFF
================================================================================
