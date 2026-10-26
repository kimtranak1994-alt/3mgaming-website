# DinoVN Web Portal - The Isle: Evrima (IslePilot Integration)

Trang web cộng đồng máy chủ **The Isle: Evrima** được thiết kế dựa trên ngôn ngữ giao diện của **Dino4VN** và tích hợp toàn bộ các tính năng máy chủ từ **IslePilot** (tương tự như 3mGaming).

---

## 🌟 Tính Năng Chính

1. **Giao Diện Chuẩn Phong Cách Dino4VN:**
   - Dark theme rừng rậm nhiệt đới (`#07130e`, `#0E2419`, `#00f076`).
   - Font chữ chuẩn tiếng Việt `Be Vietnam Pro`.
   - Responsive hoàn hảo trên điện thoại và máy tính.
   - Thanh chạy chữ thông báo (Announcement ticker).
   - Nút 1-chạm sao chép IP:Port có thông báo Toast.

2. **Tích Hợp Đầy Đủ IslePilot API (Như 3mGaming):**
   - **Trạng thái Server Live:** Số người chơi online/max slots, Tickrate (FPS), Uptime, Thời gian đếm ngược tự động restart.
   - **Bảng Xếp Hạng & Bục Vinh Danh Podium:** Top 3 thợ săn xuất sắc nhất trang chủ và bảng xếp hạng chi tiết (Kills, Deaths, K/D, Giờ sống sót, Điểm số).
   - **Live Killfeed (Nhật ký chiến trận):** Dòng sự kiện thời gian thực khủng long hạ gục nhau.
   - **Gara Khủng Long (Dino Garage):** Hiển thị slot khủng long của người chơi, thanh chỉ số Máu/Đói/Khát, độ tuổi (Growth %), nút Rút Dino vào game và Đổi màu da (Skin).
   - **Bản Đồ Tương Tác Gateway:** Bản đồ định vị nguồn nước, khu trú ẩn Sanctuary cho dino con, điểm nóng PVP và vùng di cư.
   - **Hướng Dẫn & Voice Launcher:** Các bước chuyển nhánh Evrima, tìm server và tải Proximity Voice launcher.
   - **Nội Quy Server Chuẩn:** Quy tắc Body Down, KOS, chống ghép đàn bừa bãi (Mix-packing).
   - **Trang Ủng Hộ (Donate):** Tự động sinh mã **VietQR** chuyển khoản theo thông tin ngân hàng và quyền lợi VIP.

---

## 🚀 Cách Chạy Server

Server sử dụng Python chuẩn (không cần cài thêm thư viện bên ngoài):

```powershell
python server.py
```

Sau khi chạy, mở trình duyệt truy cập:
👉 **http://localhost:8000**

---

## ⚙️ Cấu Hình IslePilot API & Thông Tin Server

Mở file `config.json` tại thư mục gốc để chỉnh sửa:

```json
{
  "SERVER_ID": "cmv3zzfix02g3pj01yay0hw4g",
  "ISLEPILOT_API_KEY": "ĐIỀN_API_KEY_CỦA_BẠN_VÀO_ĐÂY",
  "ISLEPILOT_BASE_URL": "https://islepilot.eu/api",
  "SERVER_NAME": "DinoVN Community - The Isle Evrima",
  "SERVER_MOTD": "Server The Isle: Evrima dành cho cộng đồng Việt Nam. Luật rõ ràng. Xử nhanh. Không thiên vị.",
  "SERVER_IP": "103.179.189.50",
  "SERVER_PORT": 7777,
  "MAX_SLOTS": 100,
  "DISCORD_URL": "https://discord.gg/dino4vn",
  "BANK_INFO": {
    "BANK_NAME": "MBBANK",
    "ACCOUNT_NUMBER": "999988887777",
    "ACCOUNT_HOLDER": "CHU SO HUU SERVER",
    "MOMO_PHONE": "0987654321"
  }
}
```

* **Lưu ý bảo mật:** API Key của bạn được lưu an toàn tại backend (`server.py`), trình duyệt người dùng **không bao giờ nhìn thấy mã khóa này**.
* Khi chưa điền API Key, hệ thống sẽ tự động chạy chế độ **Demo Mock Data** mô phỏng chân thực để bạn duyệt thử nghiệm toàn bộ giao diện và tính năng. Khi bạn điền API Key thật từ IslePilot, dữ liệu live sẽ được đồng bộ ngay lập tức!
