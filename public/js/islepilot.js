// Module giao tiếp với IslePilot API (Proxy qua Python Backend)
const IslePilot = {
  config: null,

  async init() {
    try {
      const res = await fetch('/api/config');
      this.config = await res.json();
      this.applyConfig();
    } catch (e) {
      console.error("Lỗi tải config:", e);
    }
  },

  applyConfig() {
    if (!this.config) return;
    document.querySelectorAll('.server-name-text').forEach(el => el.textContent = this.config.server_name);
    document.querySelectorAll('.server-ip-text').forEach(el => el.textContent = `${this.config.server_ip}:${this.config.server_port}`);
    document.querySelectorAll('.server-motd-text').forEach(el => el.textContent = this.config.server_motd);
    
    const discordLinks = document.querySelectorAll('.discord-link');
    discordLinks.forEach(el => el.href = this.config.discord_url);

    // Điền thông tin ngân hàng donate nếu có
    if (this.config.bank_info) {
      const b = this.config.bank_info;
      const bankNameEl = document.getElementById('donate-bank-name');
      const bankAccEl = document.getElementById('donate-bank-acc');
      const bankHolderEl = document.getElementById('donate-bank-holder');
      const momoPhoneEl = document.getElementById('donate-momo-phone');
      const transferNoteEl = document.getElementById('donate-transfer-note');
      
      if (bankNameEl) bankNameEl.textContent = b.BANK_NAME || 'VCB';
      if (bankAccEl) bankAccEl.textContent = b.ACCOUNT_NUMBER || '9899996836';
      if (bankHolderEl) bankHolderEl.textContent = b.ACCOUNT_HOLDER || 'CHỦ SỞ HỮU SERVER';
      if (transferNoteEl) {
        const u = JSON.parse(localStorage.getItem('steam_user') || 'null');
        if (u && u.name) {
          transferNoteEl.textContent = u.name;
        } else {
          transferNoteEl.textContent = b.TRANSFER_NOTE || 'TÊN INGAME';
        }
      }
      if (momoPhoneEl) momoPhoneEl.textContent = b.MOMO_PHONE || '---';

      // Hiển thị ảnh QR chuẩn
      const qrImg = document.getElementById('vietqr-image');
      if (qrImg) {
        if (b.QR_IMAGE) {
          qrImg.src = b.QR_IMAGE;
        } else if (b.BANK_NAME && b.ACCOUNT_NUMBER) {
          qrImg.src = `https://img.vietqr.io/image/${b.BANK_NAME}-${b.ACCOUNT_NUMBER}-compact2.png?amount=50000&addInfo=3MGAMING%20Ung%20ho&accountName=${encodeURIComponent(b.ACCOUNT_HOLDER || '')}`;
        }
      }
    }
  },

  async fetchStatus() {
    try {
      const res = await fetch('/api/server/status');
      return await res.json();
    } catch (e) {
      console.warn("Không thể lấy trạng thái server:", e);
      return null;
    }
  },

  async fetchLeaderboard(mode = '') {
    try {
      const q = mode ? `?mode=${mode}` : '';
      const res = await fetch(`/api/server/leaderboard${q}`);
      return await res.json();
    } catch (e) {
      console.warn("Không thể lấy BXH:", e);
      return [];
    }
  },

  async fetchKillfeed() {
    try {
      const res = await fetch('/api/server/killfeed');
      return await res.json();
    } catch (e) {
      console.warn("Không thể lấy Killfeed:", e);
      return [];
    }
  },

  async fetchGarage() {
    try {
      const res = await fetch('/api/server/garage');
      return await res.json();
    } catch (e) {
      console.warn("Không thể lấy dữ liệu Gara:", e);
      return null;
    }
  },

  async fetchEvent() {
    try {
      const res = await fetch('/api/server/event');
      return await res.json();
    } catch (e) {
      console.warn("Không thể lấy sự kiện:", e);
      return null;
    }
  },

  async fetchMapData() {
    try {
      const res = await fetch('/api/server/map');
      return await res.json();
    } catch (e) {
      console.warn("Không thể lấy dữ liệu bản đồ:", e);
      return null;
    }
  }
};
