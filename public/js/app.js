// DinoVN Community Application Controller
const App = {
  currentTab: 'home',

  async init() {
    await IslePilot.init();
    await this.checkSteamAuth();
    await this.checkAdminAccess();
    this.setupNavigation();
    this.setupEvents();
    this.refreshLiveStatus();
    this.refreshLeaderboard();
    this.refreshKillfeed();
    this.refreshEventBanner();

    // Tự động làm mới dữ liệu mỗi 30 giây
    setInterval(() => {
      this.refreshLiveStatus();
      this.refreshKillfeed();
      if (window.BossHunt && typeof window.BossHunt.fetchData === 'function') {
        const curTab = document.body.getAttribute('data-current-tab');
        if (curTab !== 'boss' && curTab !== 'ai-hunt' && window.location.hash !== '#boss') {
          window.BossHunt.fetchData();
        }
      }
    }, 30000);
  },

  setupNavigation() {
    // Chuyển tab qua hash URL hoặc click
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '') || 'home';
      this.switchTab(hash);
    });

    const initialHash = window.location.hash.replace('#', '') || 'home';
    this.switchTab(initialHash);
  },

  switchTab(tabId) {
    const validTabs = [
      'home', 'bxh', 'damage', 'boss', 'ai-hunt', 'arena', 'garage', 'starter', 
      'skinshop', 'skins', 'skineditor', 'referral', 'teleport', 'quests', 'buydino', 'carcass',
      'map', 'guide', 'rules', 'donate', 'admin'
    ];
    const currentMode = localStorage.getItem('admin_view_mode') || 'admin';
    if (tabId === 'admin' && currentMode === 'guest') {
      tabId = 'home';
      window.location.hash = '#home';
    }
    if (!validTabs.includes(tabId)) tabId = 'home';

    this.currentTab = tabId;
    document.body.setAttribute('data-current-tab', tabId);

    // Cập nhật nút điều hướng active
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });

    // Ẩn/hiện các view
    document.querySelectorAll('.view-section').forEach(view => {
      view.classList.toggle('active', view.id === `view-${tabId}`);
    });

    // Kích hoạt load chuyên biệt cho từng tab
    if (tabId === 'damage') {
      if (window.DamageChecker && typeof window.DamageChecker.render === 'function') {
        window.DamageChecker.render();
      }
    } else if (tabId === 'boss' || tabId === 'ai-hunt') {
      if (window.BossHunt && typeof window.BossHunt.render === 'function') {
        window.BossHunt.render();
      }
    } else if (tabId === 'arena') {
      if (window.Arena && typeof window.Arena.render === 'function') {
        window.Arena.render();
      }
    } else if (tabId === 'garage') {
      Garage.render();
    } else if (tabId === 'starter') {
      if (window.StarterGift && typeof window.StarterGift.render === 'function') {
        window.StarterGift.render();
      }
    } else if (tabId === 'skinshop') {
      SkinShop.render();
    } else if (tabId === 'skins') {
      GarageSkins.render();
    } else if (tabId === 'skineditor') {
      SkinEditor.init();
    } else if (tabId === 'referral') {
      Referral.render();
    } else if (tabId === 'teleport') {
      Teleport.render();
    } else if (tabId === 'quests') {
      Quests.render();
    } else if (tabId === 'buydino') {
      BuyDino.render();
    } else if (tabId === 'carcass') {
      Carcass.render();
    } else if (tabId === 'map') {
      GatewayMap.init();
    } else if (tabId === 'bxh') {
      this.renderFullLeaderboard();
    } else if (tabId === 'admin') {
      if (window.AdminPanel && typeof window.AdminPanel.render === 'function') {
        window.AdminPanel.render();
      } else if (typeof AdminPanel !== 'undefined' && typeof AdminPanel.render === 'function') {
        AdminPanel.render();
      }
    }

    // Đóng menu mobile nếu đang mở
    const navLinks = document.getElementById('nav-links');
    if (navLinks) navLinks.classList.remove('open');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  setupEvents() {
    // Nút copy IP
    const copyBtn = document.getElementById('btn-copy-ip');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const ip = IslePilot.config ? `${IslePilot.config.server_ip}:${IslePilot.config.server_port}` : '103.179.189.50:7777';
        navigator.clipboard.writeText(ip).then(() => {
          this.showToast(`📋 Đã sao chép IP Server: ${ip}`);
        }).catch(() => {
          this.showToast(`IP Server: ${ip}`);
        });
      });
    }

    // Nút mở menu mobile
    const toggleBtn = document.getElementById('menu-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const nav = document.getElementById('nav-links');
        if (nav) nav.classList.toggle('open');
      });
    }

  },

  async checkSteamAuth() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('steam_id')) {
      const steamId = params.get('steam_id');
      const name = params.get('name') || `Player_${steamId.slice(-4)}`;
      localStorage.setItem('steam_user', JSON.stringify({ steamId, name }));

      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);
      this.showToast(`🎉 Chào mừng ${name} đã đăng nhập Steam thành công!`);
    }

    let user = JSON.parse(localStorage.getItem('steam_user') || 'null');
    const steamParam = (user && user.steamId) ? `?steam_id=${user.steamId}` : '';

    try {
      const res = await fetch(`/api/player/me${steamParam}`);
      if (res.ok) {
        const data = await res.json();
        if (data.logged_in && data.steam_id) {
          user = { steamId: data.steam_id, name: data.name, balance: data.balance };
          localStorage.setItem('steam_user', JSON.stringify(user));
          this.updateUserBalanceUI(data.balance);
        } else {
          user = null;
          localStorage.removeItem('steam_user');
          this.updateUserBalanceUI(null);
        }
      }
    } catch (e) {}

    const btnLink = document.getElementById('btn-steam-login');
    const logoutBtn = document.getElementById('btn-steam-logout');

    if (user && user.steamId) {
      if (btnLink) {
        btnLink.removeAttribute('href');
        btnLink.style.cursor = 'default';
        btnLink.innerHTML = `<span>👤</span> <span id="steam-btn-text">${user.name}</span>`;
      }
      if (logoutBtn) logoutBtn.style.display = 'inline-flex';
      if (user.balance !== undefined) {
        this.updateUserBalanceUI(user.balance);
      }
      const donateNoteEl = document.getElementById('donate-transfer-note');
      if (donateNoteEl) donateNoteEl.textContent = user.name || 'TÊN INGAME';
    } else {
      if (btnLink) {
        btnLink.setAttribute('href', '/api/player/steam/login?redirect=%2F');
        btnLink.style.cursor = 'pointer';
        btnLink.innerHTML = '<span>🎮</span> <span id="steam-btn-text">Đăng nhập Steam</span>';
      }
      if (logoutBtn) logoutBtn.style.display = 'none';
      this.updateUserBalanceUI(null);
    }
  },

  async checkAdminAccess() {
    try {
      const user = JSON.parse(localStorage.getItem('steam_user') || 'null');
      const steamParam = (user && user.steamId) ? `?steam_id=${user.steamId}&admin_steam_id=${user.steamId}` : '';
      const res = await fetch(`/api/admin/check${steamParam}`);
      if (res.ok) {
        const data = await res.json();
        window.realAdminVerified = !!data.isAdmin;
        window.isMapAdmin = !!data.isMapAdmin;
        if (window.realAdminVerified) {
          document.cookie = "admin_auth=1; Path=/; Max-Age=86400; SameSite=Lax";
        }
      }
    } catch (e) {
      window.realAdminVerified = false;
    }
    const savedMode = localStorage.getItem('admin_view_mode') || 'admin';
    this.applyAdminViewMode(savedMode);
    return window.realAdminVerified;
  },

  setAdminViewMode(mode) {
    localStorage.setItem('admin_view_mode', mode);
    this.applyAdminViewMode(mode);
    if (mode === 'guest') {
      this.showToast('👤 Đã chuyển sang chế độ Khách (Người chơi)', 'info');
      if (this.currentTab === 'admin') {
        this.switchTab('home');
        window.location.hash = '#home';
      }
    } else {
      this.showToast('👑 Đã kích hoạt chế độ Quản trị viên', 'success');
      this.switchTab('admin');
      window.location.hash = '#admin';
    }
  },

  applyAdminViewMode(mode) {
    const isGuest = (mode === 'guest') || !window.realAdminVerified;
    window.isUserAdmin = !!(window.realAdminVerified && !isGuest);

    // Cập nhật trạng thái các nút chuyển đổi chế độ trên Header
    if (window.isUserAdmin) {
      document.documentElement.classList.add('admin-mode-active');
      document.documentElement.classList.remove('guest-mode-active');
      document.body.classList.add('admin-mode-active');
      document.body.classList.remove('guest-mode-active');
    } else {
      document.documentElement.classList.remove('admin-mode-active');
      document.documentElement.classList.add('guest-mode-active');
      document.body.classList.remove('admin-mode-active');
      document.body.classList.add('guest-mode-active');
    }

    const btnAdmin = document.getElementById('btn-mode-admin');
    const btnGuest = document.getElementById('btn-mode-guest');
    if (btnAdmin) btnAdmin.classList.toggle('active', !isGuest);
    if (btnGuest) btnGuest.classList.toggle('active', isGuest);

    // Chỉ hiển thị thanh chuyển đổi chế độ với Admin, người chơi bình thường ẩn hoàn toàn
    const togglePill = document.getElementById('admin-mode-toggle');
    if (togglePill) {
      togglePill.style.display = window.realAdminVerified ? 'inline-flex' : 'none';
    }

    // Cập nhật huy hiệu nổi phía dưới góc màn hình
    const floatingPill = document.getElementById('floating-guest-pill');
    if (floatingPill) {
      floatingPill.style.display = 'none';
    }

    // Ẩn/hiện nút Quản Trị trên menu
    const navItem = document.getElementById('nav-item-admin');
    if (navItem) {
      navItem.style.display = isGuest ? 'none' : 'inline-block';
    }

    // Cập nhật lại bản đồ trực tiếp theo chế độ vừa chuyển đổi
    if (window.GatewayMap) {
      if (typeof window.GatewayMap.updateLivePlayers === 'function') {
        window.GatewayMap.updateLivePlayers();
      } else if (typeof window.GatewayMap.renderLivePlayers === 'function') {
        window.GatewayMap.renderLivePlayers();
      }
    }

    // Cập nhật lại Bảng Xếp Hạng nếu đang mở tab bxh
    if (this.currentTab === 'bxh') {
      this.renderFullLeaderboard();
    }

    // Nếu đang ở tab admin mà chuyển sang khách, điều hướng về home
    if (isGuest && (window.location.hash === '#admin' || this.currentTab === 'admin')) {
      this.switchTab('home');
      window.location.hash = '#home';
    }
  },

  async logoutSteam() {
    localStorage.removeItem('steam_user');
    localStorage.removeItem('admin_view_mode');
    window.isUserAdmin = false;
    window.realAdminVerified = false;

    // Reset UI ngay lập tức
    const btnLink = document.getElementById('btn-steam-login');
    const logoutBtn = document.getElementById('btn-steam-logout');
    const balanceBadge = document.getElementById('user-balance-badge');
    const floatingPill = document.getElementById('floating-guest-pill');

    if (btnLink) {
      btnLink.setAttribute('href', '/api/player/steam/login?redirect=%2F');
      btnLink.style.cursor = 'pointer';
      btnLink.innerHTML = '<span>🎮</span> <span id="steam-btn-text">Đăng nhập Steam</span>';
    }
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (balanceBadge) balanceBadge.style.display = 'none';
    if (floatingPill) floatingPill.style.display = 'none';

    // Xóa cookie trên trình duyệt
    document.cookie = "steam_user=; Path=/; Max-Age=0; SameSite=Lax";
    document.cookie = "admin_auth=; Path=/; Max-Age=0; SameSite=Lax";

    try {
      await fetch('/api/player/logout');
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch (e) {}

    this.showToast('Đã đăng xuất thành công!', 'info');
    this.switchTab('home');
    window.location.hash = '#home';
  },

  updateUserBalanceUI(balance) {
    const badge = document.getElementById('user-balance-badge');
    const textEl = document.getElementById('user-balance-text');
    if (!badge || !textEl) return;

    if (balance !== undefined && balance !== null) {
      const formatted = Number(balance).toLocaleString('vi-VN');
      textEl.textContent = `${formatted} Xu`;
      badge.style.display = 'inline-flex';
    } else {
      badge.style.display = 'none';
    }
  },

  async refreshBalance() {
    try {
      const user = JSON.parse(localStorage.getItem('steam_user') || 'null');
      const steamParam = (user && user.steamId) ? `?steam_id=${user.steamId}` : '';
      const res = await fetch(`/api/player/me${steamParam}`);
      if (res.ok) {
        const data = await res.json();
        this.updateUserBalanceUI(data.balance);
        if (user && data.balance !== undefined) {
          user.balance = data.balance;
          localStorage.setItem('steam_user', JSON.stringify(user));
        }
      }
    } catch (e) {}
  },

  async refreshLiveStatus() {
    const status = await IslePilot.fetchStatus();
    if (!status) return;

    const elOnline = document.getElementById('status-players');
    const elFps = document.getElementById('status-fps');
    const elRestart = document.getElementById('status-restart');
    const elMap = document.getElementById('status-map');

    if (elOnline) elOnline.textContent = `${status.players_count} / ${status.max_players}`;
    if (elFps) elFps.textContent = `${status.server_fps} FPS`;
    if (elRestart) elRestart.textContent = status.restart_countdown || '45 phút';
    if (elMap) elMap.textContent = status.map || 'Gateway';
  },

  async refreshLeaderboard() {
    const board = await IslePilot.fetchLeaderboard();
    if (!board || board.length === 0) return;

    // Sắp xếp thứ tự từ người có Kill nhiều nhất đến người ít hơn
    board.sort((a, b) => b.kills - a.kills || a.deaths - b.deaths);

    // Render Top 3 lên bục Podium trang chủ (kiểu Dino4VN)
    const p1 = board[0];
    const p2 = board[1];
    const p3 = board[2];

    const elP1Name = document.getElementById('podium-1-name');
    const elP1Score = document.getElementById('podium-1-score');
    const elP2Name = document.getElementById('podium-2-name');
    const elP2Score = document.getElementById('podium-2-score');
    const elP3Name = document.getElementById('podium-3-name');
    const elP3Score = document.getElementById('podium-3-score');

    if (p1 && elP1Name) {
      elP1Name.textContent = p1.name;
      elP1Score.textContent = `${p1.kills} Kills • ${p1.survival_hours}h sinh tồn`;
    }
    if (p2 && elP2Name) {
      elP2Name.textContent = p2.name;
      elP2Score.textContent = `${p2.kills} Kills • ${p2.survival_hours}h`;
    }
    if (p3 && elP3Name) {
      elP3Name.textContent = p3.name;
      elP3Score.textContent = `${p3.kills} Kills • ${p3.survival_hours}h`;
    }
  },

  async renderFullLeaderboard() {
    const user = JSON.parse(localStorage.getItem('steam_user') || 'null');
    const adminSid = (user && user.steamId) ? user.steamId : '';
    const isGuest = (localStorage.getItem('admin_view_mode') === 'guest') || !window.realAdminVerified;
    const isAdminView = window.realAdminVerified && !isGuest;
    const mode = isAdminView ? 'admin' : 'guest';
    const adminParam = (isAdminView && adminSid) ? `&admin_steam_id=${adminSid}` : '';
    const board = await IslePilot.fetchLeaderboard(mode + adminParam);
    const tbody = document.getElementById('bxh-table-body');
    if (!tbody || !board) return;

    if (isAdminView) {
      // CHẾ ĐỘ QUẢN TRỊ VIÊN:
      // 1. Người chơi online ở phía trên (kèm huy hiệu 🟢 Online), offline ở phía dưới
      // 2. Kích vào tên người chơi để mở Bảng Quản Trị IslePilot
      tbody.innerHTML = board.map((item, index) => {
        let badgeClass = 'rank-other';
        if (item.rank === 1) badgeClass = 'rank-1';
        else if (item.rank === 2) badgeClass = 'rank-2';
        else if (item.rank === 3) badgeClass = 'rank-3';

        const isOnline = !!item.online;
        const onlineTag = isOnline 
          ? '<span class="status-badge-mini online" style="margin-left: 6px; font-size: 0.72rem; padding: 2px 7px;">🟢 ONLINE</span>' 
          : '<span class="status-badge-mini offline" style="margin-left: 6px; font-size: 0.72rem; padding: 2px 7px;">⚫ OFFLINE</span>';

        const sid = item.steam_id || item.steamId || '';
        return `
          <tr class="${isOnline ? 'is-online-row' : 'is-offline-row'}">
            <td><span class="rank-badge ${badgeClass}">#${item.rank}</span></td>
            <td>
              <span class="clickable-player-name" onclick="if(window.AdminPanel){window.AdminPanel.openPlayerModerationModal('${sid}');}else if(typeof AdminPanel!=='undefined'){AdminPanel.openPlayerModerationModal('${sid}');}" style="cursor: pointer; font-weight: 700; color: #fff; display: inline-flex; align-items: center; gap: 4px;" title="Kích vào để mở bảng quản trị IslePilot">
                ${item.name} ${onlineTag} <span style="font-size: 0.75rem; color: #ff2a85;">⚙️</span>
              </span>
            </td>
            <td><span style="color: var(--accent); font-weight: 600;">${item.species || item.favorite_dino}</span></td>
            <td style="color: #f87171; font-weight: 700;">${item.kills}</td>
            <td>${item.deaths}</td>
            <td><b>${item.kd}</b></td>
            <td>${item.survival_hours} giờ</td>
            <td style="color: var(--accent-gold); font-weight: 800;">${item.score.toLocaleString()}</td>
          </tr>
        `;
      }).join('');
    } else {
      // CHẾ ĐỘ KHÁCH (TRANG KHÁCH GIỮ NGUYÊN)
      tbody.innerHTML = board.map((item, index) => {
        let badgeClass = 'rank-other';
        if (item.rank === 1) badgeClass = 'rank-1';
        else if (item.rank === 2) badgeClass = 'rank-2';
        else if (item.rank === 3) badgeClass = 'rank-3';

        return `
          <tr>
            <td><span class="rank-badge ${badgeClass}">${item.rank}</span></td>
            <td><b>${item.name}</b></td>
            <td><span style="color: var(--accent);">${item.favorite_dino}</span></td>
            <td style="color: #f87171; font-weight: 700;">${item.kills}</td>
            <td>${item.deaths}</td>
            <td><b>${item.kd}</b></td>
            <td>${item.survival_hours} giờ</td>
            <td style="color: var(--accent-gold); font-weight: 800;">${item.score.toLocaleString()}</td>
          </tr>
        `;
      }).join('');
    }
  },

  async refreshKillfeed() {
    const feed = await IslePilot.fetchKillfeed();
    const list = document.getElementById('killfeed-container');
    if (!list || !feed) return;

    list.innerHTML = feed.map(item => `
      <div class="killfeed-item">
        <div>
          <span class="kill-killer">${item.killer}</span>
          <span class="kill-dino">${item.killer_dino}</span>
          <span style="color: var(--text-muted); margin: 0 4px;">⚔️</span>
          <span class="kill-victim">${item.victim}</span>
          <span class="kill-dino">${item.victim_dino}</span>
        </div>
        <div>
          <span class="kill-time">${item.time_ago}</span>
        </div>
      </div>
    `).join('');
  },

  async refreshEventBanner() {
    const ev = await IslePilot.fetchEvent();
    if (!ev || !ev.active) return;

    const titleEl = document.getElementById('event-banner-title');
    const descEl = document.getElementById('event-banner-desc');
    if (titleEl) titleEl.textContent = ev.name;
    if (descEl) descEl.textContent = `${ev.description} • Địa điểm: ${ev.location}`;
  },

  showToast(message) {
    let toast = document.getElementById('app-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app-toast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }
};

window.addEventListener('DOMContentLoaded', () => {
  App.init();
});
