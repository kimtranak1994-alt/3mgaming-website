/**
 * Admin Panel - Quản trị viên điều khiển toàn diện Server IslePilot & The Isle: Evrima
 * Phong cách 3D Hồng & Đen Obsidian Cyberpunk
 * Tuân thủ nghiêm ngặt: khi thực thi lệnh chỉ thông báo "Thành công" hoặc "Thất bại"
 */
const AdminPanel = {
  authenticated: false,
  players: [],
  bans: [],
  whitelist: null,
  activeSubTab: 'players', // players | garage | shopskin | announce | bans
  searchQuery: '',
  filterCategory: 'all', // all | online | offline | herbivore | carnivore
  selectedPlayer: null,
  customSkins: [],
  garageSettings: { maxSlots: 5, parkSeconds: 30 },
  teleportLocations: [],

  HERBIVORES: ['Triceratops', 'Stegosaurus', 'Tenontosaurus', 'Pachycephalosaurus', 'Hypsilophodon', 'Gallimimus', 'Maiasaura', 'Puerta', 'Puertasaurus', 'Diabloceratops', 'Dryosaurus', 'Ankylosaurus', 'Beipiaosaurus', 'Therizinosaurus'],
  
  ALL_SPECIES: [
    'Allosaurus', 'Ankylosaurus', 'Baryonyx', 'Beipiaosaurus', 'Carnotaurus',
    'Ceratosaurus', 'Deinosuchus', 'Diabloceratops', 'Dilophosaurus', 'Dryosaurus',
    'Gallimimus', 'Giganotosaurus', 'Herrerasaurus', 'Hypsilophodon', 'IndoRex',
    'Maiasaura', 'Omniraptor', 'Pachycephalosaurus', 'Pteranodon', 'Puerta',
    'Puertasaurus', 'Spinosaurus', 'Stegosaurus', 'Tenontosaurus', 'Therizinosaurus',
    'Triceratops', 'Troodon', 'Tyrannosaurus'
  ],

  MUTATION_LIST: [
    'None',
    'Wader',
    'Cellular Regeneration',
    'Efficient Digestion',
    'Featherweight',
    'Osteosclerosis',
    'Hydrodynamic',
    'Hydroregenerative',
    'Multichambered Lungs',
    'Epidermal Fibrosis',
    'Cannibalistic',
    'Hemomania',
    'Hematophagy',
    'Accelerated Prey Drive',
    'Enlarged Meniscus',
    'Nocturnal',
    'Photosynthetic Tissue',
    'Submerged Optical Retention',
    'Congenital Hypoalgesia',
    'Hypermetabolic Inanition',
    'Gastronomic Regeneration',
    'Enhanced Digestion',
    'Photosynthetic Regeneration',
    'Sustained Hydration',
    'Tactile Endurance',
    'Truculency',
    'Xerocole Adaptation',
    'Infrasound Communication'
  ],

  async render() {
    const container = document.getElementById('view-admin');
    if (!container) return;

    // Kiểm tra trạng thái quyền admin
    const check = await this.checkAuth();
    if (!check.isAdmin) {
      this.renderLoginForm(container);
      return;
    }

    this.authenticated = true;
    const mainWrap = document.querySelector('.main-wrapper');
    if (mainWrap) mainWrap.style.maxWidth = '1600px';
    container.innerHTML = `
      <div class="admin-wrapper">
        <!-- Admin Header -->
        <div class="admin-header-card card">
          <div class="admin-header-top">
            <div class="admin-title-box">
              <span class="admin-shield-icon">👑</span>
              <div>
                <h2 class="admin-main-title">TRUNG TÂM ĐIỀU HÀNH QUẢN TRỊ VIÊN</h2>
                <p class="admin-subtitle">Quản lý toàn diện server, can thiệp người chơi, gara & shop skin</p>
              </div>
            </div>
            <div class="admin-actions-bar">
              <button class="btn-refresh-admin" onclick="AdminPanel.refreshAll()">
                <span>🔄</span> Làm mới dữ liệu
              </button>
              <button class="btn-logout-admin" onclick="AdminPanel.logout()">
                <span>🚪</span> Đăng xuất
              </button>
            </div>
          </div>

          <!-- Quick Stats Counter -->
          <div class="admin-stats-grid">
            <div class="admin-stat-card">
              <div class="admin-stat-icon online-pulse">🟢</div>
              <div class="admin-stat-info">
                <span class="admin-stat-label">Online Hiện Tại</span>
                <span class="admin-stat-val" id="admin-stat-online">--</span>
              </div>
            </div>
            <div class="admin-stat-card">
              <div class="admin-stat-icon">👥</div>
              <div class="admin-stat-info">
                <span class="admin-stat-label">Tổng người chơi</span>
                <span class="admin-stat-val" id="admin-stat-total">--</span>
              </div>
            </div>
            <div class="admin-stat-card">
              <div class="admin-stat-icon">🚗</div>
              <div class="admin-stat-info">
                <span class="admin-stat-label">Gara / Đếm ngược</span>
                <span class="admin-stat-val" id="admin-stat-garage">5 slot / 30s</span>
              </div>
            </div>
            <div class="admin-stat-card">
              <div class="admin-stat-icon">🎨</div>
              <div class="admin-stat-info">
                <span class="admin-stat-label">Skin Admin Tạo</span>
                <span class="admin-stat-val" id="admin-stat-skins">--</span>
              </div>
            </div>
          </div>

          <!-- Admin Sub Navigation Tabs -->
          <div class="admin-nav-tabs">
            <button class="admin-tab-btn active" data-subtab="players" onclick="AdminPanel.switchSubTab('players')">
              👥 Bảng Xếp Hạng & Người Chơi
            </button>
            <button class="admin-tab-btn" data-subtab="garage" onclick="AdminPanel.switchSubTab('garage')">
              🚗 Cài Đặt Gara & Tặng Khủng Long
            </button>
            <button class="admin-tab-btn" data-subtab="shopskin" onclick="AdminPanel.switchSubTab('shopskin')">
              🎨 Tạo Skin Đưa Lên Shop
            </button>
            <button class="admin-tab-btn" data-subtab="announce" onclick="AdminPanel.switchSubTab('announce')">
              📢 Thông Báo Server
            </button>
            <button class="admin-tab-btn" data-subtab="bans" onclick="AdminPanel.switchSubTab('bans')">
              🚫 Danh Sách Cấm (Bans) & Whitelist
            </button>
          </div>
        </div>

        <!-- Subtab Content Container -->
        <div id="admin-subtab-container" style="margin-top: 24px;">

          <!-- SUBTAB 1: BẢNG XẾP HẠNG & NGƯỜI CHƠI (ONLINE PHÍA TRÊN, OFFLINE PHÍA DƯỚI) -->
          <div id="admin-sec-players" class="admin-sec-content active">
            <div class="admin-filter-bar card">
              <div class="admin-search-wrap">
                <span class="search-icon">🔍</span>
                <input type="text" id="admin-player-search" class="admin-search-input" 
                  placeholder="Tìm kiếm theo Tên người chơi, Steam ID, Loài..." 
                  oninput="AdminPanel.onSearchChange(this.value)">
              </div>
              <div class="admin-filter-pills">
                <button class="admin-pill active" data-cat="all" onclick="AdminPanel.setFilterCat('all')">🏆 Tất cả (Online trên, Offline dưới)</button>
                <button class="admin-pill" data-cat="online" onclick="AdminPanel.setFilterCat('online')">🟢 Đang Online</button>
                <button class="admin-pill" data-cat="offline" onclick="AdminPanel.setFilterCat('offline')">⚫ Offline</button>
                <button class="admin-pill" data-cat="herbivore" onclick="AdminPanel.setFilterCat('herbivore')">🌿 Ăn Cỏ</button>
                <button class="admin-pill" data-cat="carnivore" onclick="AdminPanel.setFilterCat('carnivore')">🥩 Ăn Thịt</button>
              </div>
            </div>

            <!-- Bảng Xếp Hạng & Danh Sách Người Chơi -->
            <div id="admin-players-list" class="admin-players-container" style="width: 100%;">
              <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                <div class="spinner" style="margin: 0 auto 12px;"></div>
                Đang tải dữ liệu người chơi...
              </div>
            </div>
          </div>

          <!-- SUBTAB 3: CÀI ĐẶT GARA SERVER & TẶNG KHỦNG LONG -->
          <div id="admin-sec-garage" class="admin-sec-content" style="display: none;">
            <div class="admin-grid-two-cols">
              <!-- Cột 1: Cài đặt Gara Server -->
              <div class="card">
                <div class="card-header">
                  <h3 class="card-title">🚗 CÀI ĐẶT GARA CHO TOÀN SERVER</h3>
                </div>
                <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 20px;">
                  Tùy chỉnh số lượng slot cất tối đa và thời gian đếm ngược an toàn khi người chơi bấm cất khủng long vào gara.
                </p>
                <div class="admin-form-group" style="margin-bottom: 16px;">
                  <label class="admin-form-label">Số Lượng Slot Cất Gara Tối Đa (Max Slots):</label>
                  <input type="number" id="setting-garage-maxslots" class="admin-search-input" min="1" max="50" value="5">
                  <small style="color: var(--text-muted); font-size: 0.78rem;">Mặc định: 5 slots. Áp dụng cho tất cả người chơi khi mở gara.</small>
                </div>
                <div class="admin-form-group" style="margin-bottom: 20px;">
                  <label class="admin-form-label">Thời Gian Đếm Ngược Cất Gara An Toàn (Giây):</label>
                  <input type="number" id="setting-garage-parkseconds" class="admin-search-input" min="5" max="300" value="30">
                  <small style="color: var(--text-muted); font-size: 0.78rem;">Mặc định: 30 giây. Người chơi phải đứng yên trong game trong khoảng thời gian này.</small>
                </div>
                <div style="text-align: right;">
                  <button class="btn-primary" onclick="AdminPanel.saveGarageSettings()">
                    💾 Lưu Cài Đặt Gara Server
                  </button>
                </div>
              </div>

              <!-- Cột 2: Thêm Khủng Long Cho User -->
              <div class="card">
                <div class="card-header">
                  <h3 class="card-title">🎁 THÊM / TẶNG KHỦNG LONG CHO USER</h3>
                </div>
                <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 20px;">
                  Thêm trực tiếp khủng long bất kỳ vào tài khoản người chơi (đổi khủng long in-game và thêm vào danh sách gara cá nhân).
                </p>
                <div class="admin-form-group" style="margin-bottom: 14px;">
                  <label class="admin-form-label">Steam ID Người Nhận (76561198...):</label>
                  <input type="text" id="gift-dino-steamid" class="admin-search-input" placeholder="Nhập Steam ID người nhận...">
                </div>
                <div style="display: flex; gap: 12px; margin-bottom: 14px;">
                  <div style="flex: 1;">
                    <label class="admin-form-label">Loài Khủng Long:</label>
                    <select id="gift-dino-species" class="admin-select"></select>
                  </div>
                  <div style="width: 140px;">
                    <label class="admin-form-label">Giới Tính:</label>
                    <select id="gift-dino-gender" class="admin-select">
                      <option value="Female">♀ Cái (Female)</option>
                      <option value="Male">♂ Đực (Male)</option>
                    </select>
                  </div>
                </div>
                <div class="admin-form-group" style="margin-bottom: 14px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <label class="admin-form-label">Độ Lớn (Growth):</label>
                    <b id="lbl-gift-growth" style="color: var(--accent);">100% (Full Adult)</b>
                  </div>
                  <input type="range" id="gift-dino-growth" min="0.1" max="1.0" step="0.05" value="1.0" style="width: 100%;" oninput="document.getElementById('lbl-gift-growth').textContent = Math.round(this.value * 100) + '%'">
                </div>
                <div style="text-align: right; margin-top: 18px;">
                  <button class="btn-primary" style="background: linear-gradient(135deg, #10b981, #059669);" onclick="AdminPanel.submitGiftDino()">
                    🎁 Thêm Khủng Long Cho User
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- SUBTAB 4: TẠO SKIN ĐƯA LÊN SHOP CHO USER -->
          <div id="admin-sec-shopskin" class="admin-sec-content" style="display: none;">
            <div class="admin-grid-two-cols">
              <!-- Form tạo skin mới -->
              <div class="card">
                <div class="card-header">
                  <h3 class="card-title">🎨 TẠO SKIN MỚI ĐƯA LÊN SHOP</h3>
                </div>
                <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 20px;">
                  Tạo mẫu skin khủng long tùy chỉnh và đưa thẳng lên mục Shop Skin trên trang web để người chơi có thể mua bằng Xu.
                </p>
                <div class="admin-form-group" style="margin-bottom: 12px;">
                  <label class="admin-form-label">Tên Skin:</label>
                  <input type="text" id="skin-create-name" class="admin-search-input" placeholder="Ví dụ: Hồng Ánh Kim 3D, Huyết Ma Dạ Xoa...">
                </div>
                <div style="display: flex; gap: 12px; margin-bottom: 12px;">
                  <div style="flex: 1;">
                    <label class="admin-form-label">Áp Dụng Cho Loài:</label>
                    <select id="skin-create-species" class="admin-select"></select>
                  </div>
                  <div style="width: 150px;">
                    <label class="admin-form-label">Giá Bán (Xu):</label>
                    <input type="number" id="skin-create-price" class="admin-search-input" min="0" step="50" value="500">
                  </div>
                </div>
                <div style="display: flex; gap: 12px; margin-bottom: 12px;">
                  <div style="flex: 1;">
                    <label class="admin-form-label">Màu Chủ Đạo 1:</label>
                    <input type="color" id="skin-create-c1" value="#ff2a85" style="width: 100%; height: 38px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: transparent; cursor: pointer;">
                  </div>
                  <div style="flex: 1;">
                    <label class="admin-form-label">Màu Phụ 2:</label>
                    <input type="color" id="skin-create-c2" value="#d91b6e" style="width: 100%; height: 38px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: transparent; cursor: pointer;">
                  </div>
                  <div style="flex: 1;">
                    <label class="admin-form-label">Kiểu Họa Tiết:</label>
                    <select id="skin-create-pattern" class="admin-select">
                      <option value="Stripes">Sọc vằn (Stripes)</option>
                      <option value="Spots">Đốm hoa (Spots)</option>
                      <option value="Blotches">Mảng loang (Blotches)</option>
                      <option value="Gradient">Chuyển sắc 3D (Gradient)</option>
                    </select>
                  </div>
                </div>
                <div class="admin-form-group" style="margin-bottom: 16px;">
                  <label class="admin-form-label">Mô Tả Skin:</label>
                  <textarea id="skin-create-desc" class="admin-textarea" rows="2" placeholder="Nhập mô tả skin độc quyền..."></textarea>
                </div>
                <div style="text-align: right;">
                  <button class="btn-primary" onclick="AdminPanel.submitCreateSkin()">
                    🎨 Đưa Skin Lên Shop Cho User
                  </button>
                </div>
              </div>

              <!-- Danh sách skin Admin đã tạo -->
              <div class="card">
                <div class="card-header">
                  <h3 class="card-title">🛍️ DANH SÁCH SKIN ADMIN ĐÃ TẠO</h3>
                </div>
                <div id="admin-custom-skins-list" style="max-height: 480px; overflow-y: auto;">
                  <div style="text-align: center; padding: 30px; color: var(--text-muted);">Chưa có skin nào do Admin tạo.</div>
                </div>
              </div>
            </div>
          </div>

          <!-- SUBTAB 5: THÔNG BÁO SERVER -->
          <div id="admin-sec-announce" class="admin-sec-content" style="display: none;">
            <div class="card admin-broadcast-card">
              <div class="card-header">
                <h3 class="card-title">📢 PHÁT THÔNG BÁO TOÀN SERVER (ANNOUNCE)</h3>
              </div>
              <p style="color: var(--text-muted); margin-bottom: 20px;">
                Tin nhắn này sẽ hiển thị trực tiếp trên màn hình của toàn bộ người chơi đang online trong game The Isle: Evrima.
              </p>
              <div class="admin-form-group">
                <label class="admin-form-label">Nội dung thông báo (1 - 512 ký tự):</label>
                <textarea id="admin-announce-msg" class="admin-textarea" rows="4" 
                  placeholder="Nhập thông báo gửi toàn server (ví dụ: Bảo trì server trong 15 phút nữa, vui lòng cất dino an toàn)..."></textarea>
              </div>
              <div style="text-align: right; margin-top: 16px;">
                <button class="btn-primary" onclick="AdminPanel.sendAnnouncement()">
                  <span>📢</span> Gửi Thông Báo Ngay
                </button>
              </div>
            </div>
          </div>

          <!-- SUBTAB 6: DANH SÁCH CẤM & WHITELIST -->
          <div id="admin-sec-bans" class="admin-sec-content" style="display: none;">
            <div class="card" style="margin-bottom: 20px;">
              <div class="card-header">
                <h3 class="card-title">🚫 DANH SÁCH NGƯỜI CHƠI BỊ CẤM (BANS)</h3>
              </div>
              <div id="admin-bans-list">
                <div style="text-align: center; padding: 30px; color: var(--text-muted);">Đang tải danh sách cấm...</div>
              </div>
            </div>

            <div class="card">
              <div class="card-header">
                <h3 class="card-title">📋 CẤU HÌNH & DANH SÁCH WHITELIST</h3>
              </div>
              <div id="admin-whitelist-content">
                <div style="text-align: center; padding: 30px; color: var(--text-muted);">Đang tải thông tin Whitelist...</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    `;

    // Populate dropdowns with dino species
    this.populateSpeciesDropdowns();

    // Tải dữ liệu ban đầu
    await this.refreshAll();
  },

  populateSpeciesDropdowns() {
    const list = this.ALL_SPECIES.map(s => `<option value="${s}">${s}</option>`).join('');
    const s1 = document.getElementById('gift-dino-species');
    const s2 = document.getElementById('skin-create-species');
    if (s1) s1.innerHTML = list;
    if (s2) s2.innerHTML = list;
  },

  renderLoginForm(container) {
    container.innerHTML = `
      <div class="admin-login-wrap">
        <div class="admin-login-card card">
          <div class="admin-login-icon">👑</div>
          <h2 style="font-weight: 800; font-size: 1.5rem; margin-bottom: 8px; color: #fff;">XÁC THỰC QUẢN TRỊ VIÊN</h2>
          <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 24px;">
            Trang dành riêng cho Quản trị viên điều hành Server The Isle: Evrima. Vui lòng nhập mã bảo mật để tiếp tục.
          </p>
          <div class="admin-form-group" style="text-align: left; margin-bottom: 18px;">
            <label class="admin-form-label">Mã Quản Trị Bảo Mật:</label>
            <input type="password" id="admin-passcode-input" class="admin-search-input" 
              placeholder="Nhập mã quản trị..." 
              onkeydown="if(event.key === 'Enter') AdminPanel.submitAuth()">
          </div>
          <button class="btn-primary" style="width: 100%; justify-content: center; padding: 14px;" onclick="AdminPanel.submitAuth()">
            <span>🔓</span> Đăng Nhập Quản Trị
          </button>
          <div style="margin-top: 18px; font-size: 0.8rem; color: var(--text-muted);">
            💡 Mã quản trị mặc định: <code style="color: #ff2a85; font-weight: 700;">admin3m</code> (hoặc đăng nhập Steam Admin).
          </div>
        </div>
      </div>
    `;
  },

  async checkAuth() {
    try {
      const user = JSON.parse(localStorage.getItem('steam_user') || 'null');
      const param = user && user.steamId ? `?steam_id=${user.steamId}` : '';
      const res = await fetch(`/api/admin/check${param}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}
    return { isAdmin: false };
  },

  async submitAuth() {
    const input = document.getElementById('admin-passcode-input');
    if (!input || !input.value.trim()) return;

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: input.value.trim() })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        localStorage.setItem('admin_passcode', input.value.trim());
        localStorage.setItem('admin_authenticated', '1');
        window.realAdminVerified = true;
        window.isUserAdmin = true;
        this.authenticated = true;
        if (window.App) App.applyAdminViewMode('admin');
        this.showNotification('Thành công', true);
        this.render();
      } else {
        this.showNotification('Thất bại', false);
      }
    } catch (e) {
      this.showNotification('Thất bại', false);
    }
  },

  async logout() {
    const mainWrap = document.querySelector('.main-wrapper');
    if (mainWrap) mainWrap.style.maxWidth = '';
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch (e) {}
    localStorage.removeItem('admin_passcode');
    localStorage.removeItem('admin_authenticated');
    this.authenticated = false;
    this.render();
  },

  switchSubTab(tab) {
    this.activeSubTab = tab;
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-subtab') === tab);
    });
    document.querySelectorAll('.admin-sec-content').forEach(sec => {
      sec.style.display = (sec.id === `admin-sec-${tab}`) ? 'block' : 'none';
    });

    if (tab === 'garage') {
      this.loadGarageSettings();
    } else if (tab === 'shopskin') {
      this.loadCustomSkins();
    } else if (tab === 'bans') {
      this.renderBansList();
      this.renderWhitelist();
    }
  },

  async refreshAll() {
    await Promise.all([
      this.loadPlayers(),
      this.loadBans(),
      this.loadWhitelist(),
      this.loadGarageSettings(),
      this.loadCustomSkins(),
      this.loadTeleportLocations()
    ]);
  },

  async loadPlayers() {
    try {
      const user = JSON.parse(localStorage.getItem('steam_user') || 'null');
      const adminSid = (user && user.steamId) ? user.steamId : '';
      const param = adminSid ? `?steam_id=${adminSid}&admin_steam_id=${adminSid}` : '';
      const res = await fetch(`/api/admin/players${param}`, {
        headers: { 'X-Admin-Steam-Id': adminSid }
      });
      if (res.ok) {
        const data = await res.json();
        let raw = data.players || [];
        
        // Dữ liệu từ server đã được tổng hợp từ Bảng Xếp Hạng & Live Players
        // Người chơi Online đã được xếp ở phía trên, Offline ở phía dưới chuẩn xác
        this.players = raw;
        this.updateStatsCounters();
        this.renderPlayersList();
        this.renderVitalsTargetDropdown();
      }
    } catch (e) {
      console.error(e);
    }
  },

  async loadBans() {
    try {
      const res = await fetch('/api/admin/bans');
      if (res.ok) {
        const data = await res.json();
        this.bans = data.bans || [];
      }
    } catch (e) {}
  },

  async loadWhitelist() {
    try {
      const res = await fetch('/api/admin/whitelist');
      if (res.ok) {
        const data = await res.json();
        this.whitelist = data.whitelist || {};
      }
    } catch (e) {}
  },

  async loadGarageSettings() {
    try {
      const res = await fetch('/api/admin/garage/settings');
      if (res.ok) {
        const data = await res.json();
        this.garageSettings = {
          maxSlots: data.maxSlots || 5,
          parkSeconds: data.parkSeconds || 30
        };
        const elSlots = document.getElementById('setting-garage-maxslots');
        const elSecs = document.getElementById('setting-garage-parkseconds');
        const statEl = document.getElementById('admin-stat-garage');
        if (elSlots) elSlots.value = this.garageSettings.maxSlots;
        if (elSecs) elSecs.value = this.garageSettings.parkSeconds;
        if (statEl) statEl.textContent = `${this.garageSettings.maxSlots} slot / ${this.garageSettings.parkSeconds}s`;
      }
    } catch (e) {}
  },

  async loadCustomSkins() {
    try {
      const res = await fetch('/api/admin/shop/skins');
      if (res.ok) {
        const data = await res.json();
        this.customSkins = data.skins || [];
        const statEl = document.getElementById('admin-stat-skins');
        if (statEl) statEl.textContent = this.customSkins.length;
        this.renderCustomSkinsList();
      }
    } catch (e) {}
  },

  async loadTeleportLocations() {
    try {
      const res = await fetch('/api/server/teleport/locations');
      if (res.ok) {
        const data = await res.json();
        this.teleportLocations = data.locations || [];
        const select = document.getElementById('v-teleport-loc');
        if (select && this.teleportLocations.length > 0) {
          select.innerHTML = this.teleportLocations.map(l => `<option value="${l.id}">📍 ${l.name}</option>`).join('');
        }
      }
    } catch (e) {}
  },

  updateStatsCounters() {
    const totalEl = document.getElementById('admin-stat-total');
    const onlineEl = document.getElementById('admin-stat-online');
    if (totalEl) totalEl.textContent = this.players.length;
    if (onlineEl) {
      const onlineCount = this.players.filter(p => p.online).length;
      onlineEl.textContent = onlineCount;
    }
  },

  onSearchChange(val) {
    this.searchQuery = val.trim().toLowerCase();
    this.renderPlayersList();
  },

  setFilterCat(cat) {
    this.filterCategory = cat;
    document.querySelectorAll('.admin-pill').forEach(p => {
      p.classList.toggle('active', p.getAttribute('data-cat') === cat);
    });
    this.renderPlayersList();
  },

  // 1. Render Bảng Xếp Hạng Người Chơi (Toàn bộ Online ở trên, Offline ở dưới)
  renderPlayersList() {
    const listEl = document.getElementById('admin-players-list');
    if (!listEl) return;

    let filtered = this.players.filter(p => {
      if (this.searchQuery) {
        const name = (p.name || '').toLowerCase();
        const sid = (p.steamId || '').toLowerCase();
        const species = (p.species || '').toLowerCase();
        if (!name.includes(this.searchQuery) && !sid.includes(this.searchQuery) && !species.includes(this.searchQuery)) {
          return false;
        }
      }

      if (this.filterCategory === 'online') {
        return !!p.online;
      } else if (this.filterCategory === 'offline') {
        return !p.online;
      } else if (this.filterCategory === 'herbivore') {
        return this.HERBIVORES.includes(p.species);
      } else if (this.filterCategory === 'carnivore') {
        return !this.HERBIVORES.includes(p.species);
      }
      return true;
    });

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius); border: 1px dashed var(--border-color);">
          Không tìm thấy người chơi nào phù hợp.
        </div>
      `;
      return;
    }

    const onlineList = filtered.filter(p => p.online);
    const offlineList = filtered.filter(p => !p.online);

    const renderRow = (p) => {
      const isOnline = !!p.online;
      let badgeClass = 'rank-other';
      if (p.rank === 1) badgeClass = 'rank-1';
      else if (p.rank === 2) badgeClass = 'rank-2';
      else if (p.rank === 3) badgeClass = 'rank-3';

      const isHerb = this.HERBIVORES.includes(p.species);
      const dietIcon = isHerb ? '🌿' : '🥩';
      const sid = p.steamId || p.steam_id || '';

      return `
        <tr class="admin-bxh-row ${isOnline ? 'is-online-row' : 'is-offline-row'}">
          <td style="text-align: center;">
            <span class="rank-badge ${badgeClass}">#${p.rank}</span>
          </td>
          <td>
            <div class="clickable-player-name" onclick="window.AdminPanel.openPlayerModerationModal('${sid}')" style="cursor: pointer; display: inline-flex; align-items: center; gap: 4px;" title="Kích vào để mở bảng quản trị IslePilot">
              <span class="player-avatar-icon" style="font-size: 1.1rem; margin-right: 4px;">${dietIcon}</span>
              <b style="color: #fff; font-size: 0.95rem;">${p.name || 'Người chơi'}</b>
              <span style="font-size: 0.75rem; color: #ff2a85;">⚙️</span>
            </div>
          </td>
          <td class="col-steamid" style="white-space: nowrap; min-width: 210px;">
            <span style="font-family: monospace; font-size: 0.88rem; color: #38bdf8; font-weight: 600; letter-spacing: 0.5px;">${sid}</span>
            <button class="btn-copy-mini" onclick="navigator.clipboard.writeText('${sid}'); window.AdminPanel.showNotification('Thành công', true);" title="Sao chép SteamID" style="margin-left: 6px; padding: 2px 6px; cursor: pointer; background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 4px; color: #fbbf24;">📋</button>
          </td>
          <td>
            ${isOnline ? '<span class="status-badge-mini online">🟢 ONLINE</span>' : '<span class="status-badge-mini offline">⚫ OFFLINE</span>'}
          </td>
          <td>
            <span style="color: #38bdf8; font-weight: 600;">${p.species || 'Chưa chọn'}</span>
          </td>
          <td style="text-align: center; color: #f87171; font-weight: 700;">${p.kills || 0}</td>
          <td style="text-align: center; color: #9ca3af;">${p.deaths || 0}</td>
          <td style="text-align: center; color: #fbbf24; font-weight: 700;">${p.kd || '0.00'}</td>
          <td style="text-align: center; color: #ff2a85; font-weight: 800;">${(p.score || 0).toLocaleString()}</td>
          <td style="text-align: right;">
            <button class="btn-action-intervene" onclick="window.AdminPanel.openPlayerModerationModal('${sid}')" style="background: linear-gradient(135deg, #ea580c, #c2410c); font-weight: 700; padding: 5px 12px; font-size: 0.8rem; margin: 0; cursor: pointer;" title="Mở bảng quản trị IslePilot">
              <span>⚙️</span> Quản Trị
            </button>
          </td>
        </tr>
      `;
    };

    let tableBodyHtml = '';
    if (this.filterCategory === 'all') {
      if (onlineList.length > 0) {
        tableBodyHtml += `
          <tr class="admin-group-header-row">
            <td colspan="10" style="background: rgba(16, 185, 129, 0.15); color: #34d399; font-weight: 800; font-size: 0.88rem; padding: 12px 18px; border-left: 4px solid #10b981;">
              🟢 NGƯỜI CHƠI ĐANG HOẠT ĐỘNG TRỰC TIẾP (${onlineList.length} người đang online - Kích vào tên để Quản trị)
            </td>
          </tr>
        `;
        tableBodyHtml += onlineList.map(renderRow).join('');
      }

      if (offlineList.length > 0) {
        tableBodyHtml += `
          <tr class="admin-group-header-row">
            <td colspan="10" style="background: rgba(100, 116, 139, 0.12); color: #94a3b8; font-weight: 800; font-size: 0.88rem; padding: 12px 18px; border-left: 4px solid #64748b;">
              ⚫ NGƯỜI CHƠI OFFLINE (${offlineList.length} người)
            </td>
          </tr>
        `;
        tableBodyHtml += offlineList.map(renderRow).join('');
      }
    } else {
      tableBodyHtml = filtered.map(renderRow).join('');
    }

    listEl.innerHTML = `
      <div class="table-responsive card" style="padding: 0; overflow-x: auto; width: 100%; border: 1px solid var(--border-color); border-radius: var(--radius); box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
        <table class="bxh-table admin-bxh-table" style="margin: 0; width: 100%; min-width: 1150px;">
          <thead>
            <tr>
              <th style="width: 70px; text-align: center;">Hạng</th>
              <th class="col-player" style="min-width: 220px;">Người chơi (Bấm tên để Quản trị)</th>
              <th class="col-steamid" style="min-width: 210px;">Steam ID</th>
              <th style="min-width: 120px;">Trạng thái</th>
              <th style="min-width: 150px;">Loài khủng long</th>
              <th style="text-align: center; width: 75px;">Kills</th>
              <th style="text-align: center; width: 75px;">Deaths</th>
              <th style="text-align: center; width: 80px;">K/D</th>
              <th style="text-align: center; width: 110px;">Điểm BXH</th>
              <th style="text-align: right; width: 130px;">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            ${tableBodyHtml}
          </tbody>
        </table>
      </div>
    `;
  },

  // 2. Vitals Target Dropdown & Selection
  renderVitalsTargetDropdown() {
    const select = document.getElementById('vitals-target-select');
    if (!select) return;

    select.innerHTML = '<option value="">-- Chọn người chơi từ danh sách --</option>' + 
      this.players.map(p => {
        const dot = p.online ? '🟢' : '⚪';
        return `<option value="${p.steamId}">${dot} ${p.name || 'Player'} (${p.species || 'Khủng long'} - ${p.steamId})</option>`;
      }).join('');
  },

  openVitalsForPlayer(steamId) {
    this.switchSubTab('vitals');
    const select = document.getElementById('vitals-target-select');
    if (select) select.value = steamId;
    this.onVitalsTargetChange(steamId);
  },

  onVitalsTargetChange(steamId) {
    const inputSid = document.getElementById('vitals-target-sid');
    if (inputSid) inputSid.value = steamId;

    const player = this.players.find(p => p.steamId === steamId);
    if (!player) return;

    this.selectedPlayer = player;
    document.getElementById('vitals-p-name').textContent = player.name || 'Người chơi';
    document.getElementById('vitals-p-species').textContent = player.species || 'Chưa có';
    document.getElementById('vitals-p-status').textContent = `${player.female ? '♀ Cái' : '♂ Đực'} • ${player.online ? '🟢 Online' : '⚪ Offline'}`;
    
    const growthPct = Math.round((player.growth || 0.25) * 100);
    document.getElementById('vitals-p-growth').textContent = `${growthPct}%`;

    const sliderGrowth = document.getElementById('v-val-growth');
    if (sliderGrowth) {
      sliderGrowth.value = player.growth || 1.0;
      document.getElementById('lbl-v-growth').textContent = `${growthPct}%`;
    }

    // Tự động cập nhật Tọa độ X Y Z của người chơi được chọn
    const coordsEl = document.getElementById('vitals-p-coords');
    if (coordsEl) {
      if (player.position && (player.position.x !== undefined || player.position.y !== undefined)) {
        const mX = Math.round((player.position.x || 0) * 0.01);
        const mY = Math.round((player.position.y || 0) * 0.01);
        const mZ = Math.round((player.position.z || 0) * 0.01);
        coordsEl.innerHTML = `<span style="color: #38bdf8;">X: ${mX}, Y: ${mY}, Z: ${mZ}</span> <button type="button" class="btn-copy-mini" onclick="navigator.clipboard.writeText('${mX}, ${mY}, ${mZ}'); window.App.showToast('📋 Đã sao chép X Y Z: ${mX}, ${mY}, ${mZ}');" title="Sao chép X Y Z" style="background: none; border: none; cursor: pointer; color: #fbbf24; font-size: 0.85rem; padding: 0 4px;">📋</button>`;
      } else {
        coordsEl.textContent = player.online ? 'Đang cập nhật...' : '⚪ Offline (Chưa có tọa độ)';
      }
    }
  },

  onVitalsManualSid(sid) {
    const steamId = sid.trim();
    if (!steamId) return;
    const player = this.players.find(p => p.steamId === steamId);
    if (player) {
      this.onVitalsTargetChange(steamId);
    } else {
      this.selectedPlayer = { steamId: steamId, name: 'Tùy chỉnh' };
      document.getElementById('vitals-p-name').textContent = steamId;
      document.getElementById('vitals-p-species').textContent = 'Thủ công';
      document.getElementById('vitals-p-status').textContent = 'Nhập trực tiếp';
      document.getElementById('vitals-p-growth').textContent = '--%';

      const coordsEl = document.getElementById('vitals-p-coords');

      if (coordsEl) coordsEl.textContent = '--';
    }
  },

  getTargetSteamId() {
    const input = document.getElementById('vitals-target-sid');
    if (input && input.value.trim()) return input.value.trim();
    if (this.selectedPlayer && this.selectedPlayer.steamId) return this.selectedPlayer.steamId;
    const select = document.getElementById('vitals-target-select');
    if (select && select.value) return select.value;
    return null;
  },

  // Can thiệp: Hồi phục / Đặt giá trị chỉ số (Máu, No, Nước, Stamina)
  async setVitalsStat(statName, value) {
    const steamId = this.getTargetSteamId();
    if (!steamId) {
      this.showNotification('Thất bại', false);
      return;
    }
    const params = { [statName]: parseFloat(value) };
    await this.executeCommand('setstats', steamId, params);
  },

  async applyVitalsCustom(statName) {
    const slider = document.getElementById(`v-val-${statName}`);
    if (!slider) return;
    await this.setVitalsStat(statName, slider.value);
  },

  // Can thiệp: Chảy máu (Bleed)
  async setVitalsBleed(val) {
    const steamId = this.getTargetSteamId();
    if (!steamId) {
      this.showNotification('Thất bại', false);
      return;
    }
    await this.executeCommand('setstats', steamId, { bleed: parseFloat(val) });
  },

  // Can thiệp: Tăng trưởng (Growth)
  async applyVitalsGrowth() {
    const steamId = this.getTargetSteamId();
    if (!steamId) {
      this.showNotification('Thất bại', false);
      return;
    }
    const slider = document.getElementById('v-val-growth');
    const freezeCb = document.getElementById('v-growth-freeze');
    const growth = parseFloat(slider.value);
    const frozen = !!(freezeCb && freezeCb.checked);

    await this.executeCommand('setgrowth', steamId, { growth, frozen });
  },

  // Can thiệp: Bộ 3 Dưỡng Chất A, B, Y (Nutritions)
  async applyFullNutritions() {
    const steamId = this.getTargetSteamId();
    if (!steamId) {
      this.showNotification('Thất bại', false);
      return;
    }
    await this.executeCommand('setnutrition', steamId, {
      carb: 100,
      protein: 100,
      lipid: 100
    });
  },

  async applyCustomNutritions() {
    const steamId = this.getTargetSteamId();
    if (!steamId) {
      this.showNotification('Thất bại', false);
      return;
    }
    const a = parseFloat(document.getElementById('v-nut-a').value || 100);
    const b = parseFloat(document.getElementById('v-nut-b').value || 100);
    const y = parseFloat(document.getElementById('v-nut-y').value || 100);

    await this.executeCommand('setnutrition', steamId, {
      carb: a,
      protein: b,
      lipid: y
    });
  },

  // Can thiệp: Dịch chuyển (Teleport)
  async applyTeleport() {
    const steamId = this.getTargetSteamId();
    if (!steamId) {
      this.showNotification('Thất bại', false);
      return;
    }
    const locSelect = document.getElementById('v-teleport-loc');
    const locId = locSelect ? locSelect.value : 'cmvm99rrk5fvula01pwetdn17';
    await this.executeCommand('teleport', steamId, { locationId: locId });
  },

  // Can thiệp: Giết người chơi (Slay)
  async applySlayVitals() {
    const steamId = this.getTargetSteamId();
    if (!steamId) {
      this.showNotification('Thất bại', false);
      return;
    }
    await this.executeCommand('slay', steamId, {});
  },

  // 3. Quản lý Gara Server & Tặng Khủng Long
  async saveGarageSettings() {
    const elSlots = document.getElementById('setting-garage-maxslots');
    const elSecs = document.getElementById('setting-garage-parkseconds');
    const maxSlots = elSlots ? parseInt(elSlots.value) : 5;
    const parkSeconds = elSecs ? parseInt(elSecs.value) : 30;

    try {
      const res = await fetch('/api/admin/garage/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxSlots, parkSeconds })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        this.showNotification('Thành công', true);
        this.garageSettings.maxSlots = maxSlots;
        this.garageSettings.parkSeconds = parkSeconds;
        const statEl = document.getElementById('admin-stat-garage');
        if (statEl) statEl.textContent = `${maxSlots} slot / ${parkSeconds}s`;
      } else {
        this.showNotification('Thất bại', false);
      }
    } catch (e) {
      this.showNotification('Thất bại', false);
    }
  },

  async submitGiftDino() {
    const sidInput = document.getElementById('gift-dino-steamid');
    const specSelect = document.getElementById('gift-dino-species');
    const genderSelect = document.getElementById('gift-dino-gender');
    const growthSlider = document.getElementById('gift-dino-growth');

    const steamId = sidInput ? sidInput.value.trim() : '';
    if (!steamId) {
      this.showNotification('Thất bại', false);
      return;
    }

    const species = specSelect ? specSelect.value : 'Carnotaurus';
    const gender = genderSelect ? genderSelect.value : 'Female';
    const growth = growthSlider ? parseFloat(growthSlider.value) : 1.0;

    try {
      const res = await fetch('/api/admin/garage/add-dino', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          steamId,
          species,
          gender,
          growth,
          name: `${species} (${Math.round(growth * 100)}% Tặng Bởi Admin)`
        })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        this.showNotification('Thành công', true);
        sidInput.value = '';
      } else {
        this.showNotification('Thất bại', false);
      }
    } catch (e) {
      this.showNotification('Thất bại', false);
    }
  },

  // 4. Tạo Skin Đưa Lên Shop
  async submitCreateSkin() {
    const nameInput = document.getElementById('skin-create-name');
    const specSelect = document.getElementById('skin-create-species');
    const priceInput = document.getElementById('skin-create-price');
    const c1Input = document.getElementById('skin-create-c1');
    const c2Input = document.getElementById('skin-create-c2');
    const patternSelect = document.getElementById('skin-create-pattern');
    const descInput = document.getElementById('skin-create-desc');

    const name = nameInput ? nameInput.value.trim() : '';
    if (!name) {
      this.showNotification('Thất bại', false);
      return;
    }

    const species = specSelect ? specSelect.value : 'Allosaurus';
    const price = priceInput ? parseInt(priceInput.value) : 500;
    const c1 = c1Input ? c1Input.value : '#ff2a85';
    const c2 = c2Input ? c2Input.value : '#d91b6e';
    const pattern = patternSelect ? patternSelect.value : 'Stripes';
    const desc = descInput ? descInput.value.trim() : 'Skin đặc biệt do Quản trị viên đưa lên Shop';

    try {
      const res = await fetch('/api/admin/shop/skins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          species,
          price,
          colorPrimary: c1,
          colorSecondary: c2,
          colors: [c1, c2, '#120e18'],
          pattern,
          description: desc,
          image: `assets/images/dinos/${species.toLowerCase()}.png`
        })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        this.showNotification('Thành công', true);
        nameInput.value = '';
        if (descInput) descInput.value = '';
        await this.loadCustomSkins();
      } else {
        this.showNotification('Thất bại', false);
      }
    } catch (e) {
      this.showNotification('Thất bại', false);
    }
  },

  renderCustomSkinsList() {
    const container = document.getElementById('admin-custom-skins-list');
    if (!container) return;

    if (this.customSkins.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-muted);">
          <span style="font-size: 2.2rem; display: block; margin-bottom: 8px;">🎨</span>
          Chưa có skin nào do Admin tạo. Bạn có thể tạo skin ở form bên trái!
        </div>
      `;
      return;
    }

    container.innerHTML = this.customSkins.map(s => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; background: rgba(10, 8, 14, 0.7); border: 1px solid var(--border-color); border-radius: var(--radius-sm); margin-bottom: 10px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 24px; height: 24px; border-radius: 50%; background: linear-gradient(135deg, ${s.palette?.primary || s.colors?.[0] || '#ff2a85'}, ${s.palette?.secondary || s.colors?.[1] || '#d91b6e'}); box-shadow: 0 0 10px rgba(255, 42, 133, 0.4);"></div>
          <div>
            <h4 style="font-size: 0.95rem; font-weight: 800; color: #fff;">${s.name}</h4>
            <span style="font-size: 0.78rem; color: var(--text-muted);">${s.species} • Giá: <b style="color: #fbbf24;">${s.price} Xu</b></span>
          </div>
        </div>
        <button class="btn-primary" style="padding: 5px 12px; font-size: 0.78rem; background: linear-gradient(135deg, #ef4444, #991b1b);" onclick="AdminPanel.deleteCustomSkin('${s.id}')">
          Xóa
        </button>
      </div>
    `).join('');
  },

  async deleteCustomSkin(skinId) {
    try {
      const res = await fetch('/api/admin/shop/skins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', skinId })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        this.showNotification('Thành công', true);
        await this.loadCustomSkins();
      } else {
        this.showNotification('Thất bại', false);
      }
    } catch (e) {
      this.showNotification('Thất bại', false);
    }
  },

  // 5. Thông báo server
  async sendAnnouncement() {
    const input = document.getElementById('admin-announce-msg');
    if (!input || !input.value.trim()) {
      this.showNotification('Thất bại', false);
      return;
    }
    const msg = input.value.trim();
    await this.executeCommand('announce', null, { message: msg });
    input.value = '';
  },

  // 6. Quick actions từ danh sách người chơi
  async quickHeal(steamId) {
    await this.executeCommand('setstats', steamId, {
      health: 100, hunger: 100, thirst: 100, stamina: 100
    });
  },

  async quickKick(steamId) {
    await this.executeCommand('kick', steamId, {
      reason: 'Admin kick từ Web Dashboard'
    });
  },

  // Thực thi lệnh tới API (chỉ thông báo Thành công / Thất bại)
  async executeCommand(action, steamId, params, silent = false) {
    try {
      const u = JSON.parse(localStorage.getItem('steam_user') || 'null');
      const adminSid = (u && u.steamId) ? u.steamId : '76561199175571899';
      const adminPass = localStorage.getItem('admin_passcode') || 'admin3m';
      const res = await fetch(`/api/admin/player-action?admin_steam_id=${adminSid}&passcode=${adminPass}`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 
          'Content-Type': 'application/json',
          'X-Admin-Steam-Id': adminSid,
          'X-Admin-Passcode': adminPass
        },
        body: JSON.stringify({ action, steamId, params, admin_steam_id: adminSid, passcode: adminPass })
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        if (!silent) this.showNotification('Thành công', true);
        setTimeout(() => this.loadPlayers(), 1500);
        return true;
      } else {
        if (!silent) this.showNotification('Thất bại', false);
        return false;
      }
    } catch (e) {
      if (!silent) this.showNotification('Thất bại', false);
      return false;
    }
  },

  // Render Danh sách Cấm
  renderBansList() {
    const container = document.getElementById('admin-bans-list');
    if (!container) return;

    if (!this.bans || this.bans.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-muted);">
          <span style="font-size: 2rem; display: block; margin-bottom: 8px;">🛡️</span>
          Hiện tại không có người chơi nào bị cấm trên server.
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="admin-table-responsive">
        <table class="admin-data-table">
          <thead>
            <tr>
              <th>Steam ID</th>
              <th>Lý Do</th>
              <th>Thời Gian Cấm</th>
              <th style="text-align: right;">Hành Động</th>
            </tr>
          </thead>
          <tbody>
            ${this.bans.map(b => `
              <tr>
                <td style="font-family: monospace; font-weight: 700;">${b.steamId || b.id}</td>
                <td>${b.reason || 'Vi phạm quy định'}</td>
                <td>${b.createdAt ? new Date(b.createdAt).toLocaleString('vi-VN') : 'Không xác định'}</td>
                <td style="text-align: right;">
                  <button class="btn-primary" style="padding: 6px 14px; font-size: 0.8rem; background: linear-gradient(135deg, #10b981, #059669);" 
                    onclick="AdminPanel.applyUnban('${b.steamId || b.id}')">
                    Gỡ Cấm (Unban)
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  // Render Whitelist
  renderWhitelist() {
    const container = document.getElementById('admin-whitelist-content');
    if (!container) return;

    const wl = this.whitelist || { enabled: false, entries: [] };
    const entries = wl.entries || [];

    container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px; background: rgba(255, 42, 133, 0.08); border-radius: var(--radius-sm); border: 1px solid var(--border-color); margin-bottom: 20px;">
        <div>
          <h4 style="font-size: 1.1rem; color: #fff; margin-bottom: 4px;">Trạng Thái Danh Sách Trắng: 
            <span style="color: ${wl.enabled ? '#ff2a85' : 'var(--text-muted)'}; font-weight: 800;">
              ${wl.enabled ? 'ĐANG BẬT 🟢' : 'ĐANG TẮT ⚪'}
            </span>
          </h4>
          <p style="font-size: 0.85rem; color: var(--text-muted);">
            Thông báo khi bị chặn: "${wl.kickMessage || 'You are not whitelisted on this server.'}"
          </p>
        </div>
      </div>

      <h4 style="margin-bottom: 12px; font-size: 1rem; color: #fff;">Danh Sách Được Phép Vào Server (${entries.length} thành viên):</h4>
      <div class="admin-table-responsive">
        <table class="admin-data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Steam ID / Discord ID</th>
              <th>Ghi Chú</th>
              <th>Ngày Thêm</th>
            </tr>
          </thead>
          <tbody>
            ${entries.length === 0 ? '<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">Trống</td></tr>' : 
              entries.map(e => `
                <tr>
                  <td style="font-family: monospace;">${e.id}</td>
                  <td style="font-family: monospace; font-weight: 700;">${e.steamId || e.discordId || 'N/A'}</td>
                  <td>${e.note || '--'}</td>
                  <td>${e.createdAt ? new Date(e.createdAt).toLocaleDateString('vi-VN') : '--'}</td>
                </tr>
              `).join('')
            }
          </tbody>
        </table>
      </div>
    `;
  },

  async applyUnban(steamId) {
    await this.executeCommand('unban', steamId, {});
    await this.loadBans();
    this.renderBansList();
  },

  // ==========================================
  // ISLEPILOT MODERATION MODAL & ACTIONS
  // ==========================================
  async openPlayerModerationModal(steamId) {
    if (!steamId || steamId === 'undefined' || steamId === 'null') {
      console.warn('openPlayerModerationModal: Invalid steamId', steamId);
      this.showNotification('Thất bại', false);
      return;
    }
    this.closeModerationModal();

    const overlay = document.createElement('div');
    overlay.id = 'mod-modal-overlay';
    overlay.className = 'mod-modal-overlay';
    overlay.innerHTML = `
      <div class="mod-modal-container">
        <div class="mod-modal-header">
          <div class="mod-breadcrumbs">
            <span>3m gaming - low rules</span> &gt; <span>Players & Moderation</span> &gt; <span>Đang tải...</span>
          </div>
          <button class="mod-close-btn" onclick="window.AdminPanel.closeModerationModal()">✕</button>
        </div>
        <div class="mod-modal-body" style="text-align: center; padding: 60px;">
          <div class="spinner" style="margin: 0 auto 16px;"></div>
          <p style="color: #9ca3af;">Đang tải dữ liệu chi tiết người chơi từ IslePilot...</p>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    try {
      const u = JSON.parse(localStorage.getItem('steam_user') || 'null');
      const adminSid = (u && u.steamId) ? u.steamId : '76561199175571899';
      const adminPass = localStorage.getItem('admin_passcode') || 'admin3m';
      const adminParam = `&admin_steam_id=${adminSid}&passcode=${adminPass}`;
      const res = await fetch(`/api/admin/player-detail?steam_id=${steamId}${adminParam}`, {
        credentials: 'same-origin',
        headers: {
          'X-Admin-Steam-Id': adminSid,
          'X-Admin-Passcode': adminPass
        }
      });
      const data = await res.json();
      if (!res.ok || !data.ok || !data.player) {
        // Fallback profile if player list already has summary info
        const localP = (this.players || []).find(x => (x.steamId === steamId || x.steam_id === steamId));
        if (localP) {
          this.renderModerationModalContent({
            steamId: steamId,
            name: localP.name || `Player_${String(steamId).slice(-4)}`,
            species: localP.species || 'Chưa chọn',
            health: localP.health || 10000,
            maxHealth: localP.maxHealth || 10000,
            hunger: localP.hunger || 3500,
            maxHunger: localP.maxHunger || 4000,
            thirst: localP.thirst || 900,
            maxThirst: localP.maxThirst || 1000,
            growth: localP.growth || 1.0,
            wallet: { balance: 240 }
          });
          return;
        }
        this.showNotification('Thất bại', false);
        this.closeModerationModal();
        return;
      }
      this.renderModerationModalContent(data.player, data.garage || [], data.skins || [], data.warnings || []);
    } catch (e) {
      console.error('Error fetching player detail:', e);
      const localP = (this.players || []).find(x => (x.steamId === steamId || x.steam_id === steamId));
      if (localP) {
        this.renderModerationModalContent({
          steamId: steamId,
          name: localP.name || `Player_${String(steamId).slice(-4)}`,
          species: localP.species || 'Chưa chọn',
          health: localP.health || 10000,
          maxHealth: localP.maxHealth || 10000,
          hunger: localP.hunger || 3500,
          maxHunger: localP.maxHunger || 4000,
          thirst: localP.thirst || 900,
          maxThirst: localP.maxThirst || 1000,
          growth: localP.growth || 1.0,
          wallet: { balance: 240 }
        });
      } else {
        this.showNotification('Thất bại', false);
        this.closeModerationModal();
      }
    }
  },

  closeModerationModal() {
    const existing = document.getElementById('mod-modal-overlay');
    if (existing) existing.remove();
  },

  renderModerationModalContent(p, garage = [], skins = [], warnings = []) {
    const overlay = document.getElementById('mod-modal-overlay');
    if (!overlay) return;

    const health = Math.round(p.health || 0);
    const maxHealth = Math.round(p.maxHealth || 12274);
    const hunger = Math.round(p.hunger || 0);
    const maxHunger = Math.round(p.maxHunger || 4050);
    const thirst = Math.round(p.thirst || 0);
    const maxThirst = Math.round(p.maxThirst || 1000);
    const growthVal = Math.round((p.growth || 1.0) * 100);
    const balance = (p.wallet && typeof p.wallet.balance === 'number') ? p.wallet.balance : 8110;
    const prime = p.prime || {};
    const isOnline = !!p.online;
    const lastSeen = p.lastSeenAt ? new Date(p.lastSeenAt).toLocaleString('en-US') : 'Vừa xong';
    const lastJoin = p.lastJoinAt ? new Date(p.lastJoinAt).toLocaleString('en-US') : (p.lastSeenAt ? new Date(p.lastSeenAt).toLocaleString('en-US') : 'Hôm nay');
    const playHours = Math.round((p.totalPlaySec || 0) / 3600);
    const pos = p.position || { x: 0, y: 0, z: 0, yaw: 0 };
    const discord = p.discord || null;
    const mutations = p.mutationSlots || { active: [], parent: [], elderA: [], elderB: [] };
    this.currentMutations = JSON.parse(JSON.stringify(mutations));

    const quests = (prime.quests && prime.quests.length) ? prime.quests : [
      { name: "Visit a Sanctuary as a juvenile", done: true },
      { name: "Get nested in", done: true },
      { name: "Get perfect diet (1% of each)", done: true },
      { name: "Visit Mass Migration zone", done: true },
      { name: "Visit 2 Migration zones", done: false },
      { name: "Visit 4 Patrol zones", done: true },
      { name: "Never be Infertile", done: true },
      { name: "Never get Muscle spasms", done: true },
      { name: "Raise children to Subadult", done: true },
      { name: "Be a Hypsi, Troodon, Beipi, Dryo or Deino", done: true }
    ];

    const completedQuests = quests.filter(q => q.done).length;

    overlay.innerHTML = `
      <div class="mod-modal-container">
        <!-- Header -->
        <div class="mod-modal-header">
          <div class="mod-breadcrumbs">
            <span>3m gaming - low rules</span> &gt; <span>Players & Moderation</span> &gt; 
            <span class="mod-player-name-crumb">${p.name || 'Player'} (${p.steamId})</span>
            <span class="status-badge-mini ${isOnline ? 'online' : 'offline'}" style="margin-left: 8px;">
              ${isOnline ? '🟢 ONLINE' : '⚫ OFFLINE'}
            </span>
            <span class="status-badge-mini" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3);">
              ${p.species || 'Unknown'} ${p.female ? '♀ Female' : '♂ Male'}
            </span>
          </div>
          <button class="mod-close-btn" onclick="window.AdminPanel.closeModerationModal()" title="Đóng (Esc)">✕</button>
        </div>

        <!-- Modal Subtab Navigation (Ghim cố định trên đỉnh, không bị che khuất khi cuộn) -->
        <div class="mod-nav-pills">
          <button class="mod-pill-btn active" data-modtab="stats" onclick="window.AdminPanel.switchModalTab('stats')">
            ⚡ Sinh Lực & Chỉ Số (Stats)
          </button>
          <button class="mod-pill-btn" data-modtab="mutations" onclick="window.AdminPanel.switchModalTab('mutations')">
            🧬 Đột Biến Gen (${(mutations.active || []).filter(m => m !== 'None').length})
          </button>
          <button class="mod-pill-btn" data-modtab="garage" onclick="window.AdminPanel.switchModalTab('garage')">
            🦖 Gara Khủng Long (${garage.length})
          </button>
          <button class="mod-pill-btn" data-modtab="skins" onclick="window.AdminPanel.switchModalTab('skins')">
            🎨 Kho Skin (${skins.length})
          </button>
          <button class="mod-pill-btn" data-modtab="warnings" onclick="window.AdminPanel.switchModalTab('warnings')">
            ⚠️ Cảnh Báo (${warnings.length})
          </button>
        </div>

        <!-- Body -->
        <div class="mod-modal-body">
          <!-- Top Progress Bars -->
          <div class="mod-top-bars">
            <div class="mod-bar-item">
              <div class="mod-bar-label">
                <span>Health</span>
                <span class="mod-bar-val" style="color: #06b6d4;">${health} / ${maxHealth}</span>
              </div>
              <div class="mod-bar-track">
                <div class="mod-bar-fill health" style="width: ${Math.min(100, Math.round((health / maxHealth) * 100))}%;"></div>
              </div>
            </div>

            <div class="mod-bar-item">
              <div class="mod-bar-label">
                <span>Hunger</span>
                <span class="mod-bar-val" style="color: #eab308;">${hunger} / ${maxHunger}</span>
              </div>
              <div class="mod-bar-track">
                <div class="mod-bar-fill hunger" style="width: ${Math.min(100, Math.round((hunger / maxHunger) * 100))}%;"></div>
              </div>
            </div>

            <div class="mod-bar-item">
              <div class="mod-bar-label">
                <span>Thirst</span>
                <span class="mod-bar-val" style="color: #38bdf8;">${thirst} / ${maxThirst}</span>
              </div>
              <div class="mod-bar-track">
                <div class="mod-bar-fill thirst" style="width: ${Math.min(100, Math.round((thirst / maxThirst) * 100))}%;"></div>
              </div>
            </div>

            <div class="mod-bar-item">
              <div class="mod-bar-label">
                <span>Stamina</span>
                <span class="mod-bar-val" style="color: #10b981;">100 / 100</span>
              </div>
              <div class="mod-bar-track">
                <div class="mod-bar-fill stamina" style="width: 100%; background: #10b981;"></div>
              </div>
            </div>

            <div class="mod-bar-item">
              <div class="mod-bar-label">
                <span>Growth %</span>
                <span class="mod-bar-val" style="color: #ec4899;">${growthVal}%</span>
              </div>
              <div class="mod-bar-track">
                <div class="mod-bar-fill growth" style="width: ${Math.min(100, growthVal)}%; background: linear-gradient(90deg, #ec4899, #f43f5e);"></div>
              </div>
            </div>
          </div>

          <!-- Main Grid -->
          <div class="mod-main-grid">
            <!-- Left Column (Tab Contents) -->
            <div class="mod-left-col">

              <!-- TAB 1: STATS & DINO ACTIONS -->
              <div id="mod-tab-stats" class="mod-tab-pane active">
                <!-- Set live values -->
                <div class="mod-section">
                  <h4 class="mod-sec-title">🎯 ĐIỀU CHỈNH CHỈ SỐ SINH LỰC TRỰC TIẾP (SET LIVE VALUES)</h4>
                  <p class="mod-section-hint">Chỉ số sinh lực áp dụng lên khủng long ngay lập tức trong game qua IslePilot Commands API.</p>
                  
                  <div class="mod-inputs-row">
                    <div class="mod-field-box">
                      <label>Health (max ${maxHealth})</label>
                      <input type="number" id="mod-val-health" value="${health}">
                    </div>
                    <div class="mod-field-box">
                      <label>Hunger (max ${maxHunger})</label>
                      <input type="number" id="mod-val-hunger" value="${hunger}">
                    </div>
                    <div class="mod-field-box">
                      <label>Thirst (max ${maxThirst})</label>
                      <input type="number" id="mod-val-thirst" value="${thirst}">
                    </div>
                    <div class="mod-field-box">
                      <label>Bleed (0 - 100)</label>
                      <input type="number" id="mod-val-bleed" value="0">
                    </div>
                    <div class="mod-field-box">
                      <label>Stamina (0 - 100)</label>
                      <input type="number" id="mod-val-stamina" value="100">
                    </div>
                    <div class="mod-field-box">
                      <label>Growth % (0 - 100%)</label>
                      <input type="number" id="mod-val-growth" value="${growthVal}">
                    </div>
                  </div>

                  <!-- 3 Dưỡng chất A B Y -->
                  <div style="margin-top: 14px; background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06);">
                    <div style="font-size: 0.82rem; font-weight: 700; color: #ff70a6; margin-bottom: 8px;">
                      🧪 3 DƯỠNG CHẤT DINH DƯỠNG (NUTRITION A - B - Y)
                    </div>
                    <div class="mod-inputs-row" style="grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));">
                      <div class="mod-field-box">
                        <label>🌿 Dưỡng chất A (Carb %)</label>
                        <input type="number" id="mod-val-nutr-a" value="100">
                      </div>
                      <div class="mod-field-box">
                        <label>🥩 Dưỡng chất B (Protein %)</label>
                        <input type="number" id="mod-val-nutr-b" value="100">
                      </div>
                      <div class="mod-field-box">
                        <label>🥑 Dưỡng chất Y (Lipid %)</label>
                        <input type="number" id="mod-val-nutr-y" value="100">
                      </div>
                    </div>
                  </div>

                  <div class="mod-btn-row" style="margin-top: 14px;">
                    <button class="btn-mod-orange" onclick="window.AdminPanel.modApplyStats('${p.steamId}')" style="box-shadow: 0 0 15px rgba(234, 88, 12, 0.4);">
                      ⚡ Apply stats (Áp dụng ngay)
                    </button>
                    <button class="btn-mod-dark" onclick="window.AdminPanel.modTogglePrime('${p.steamId}', ${!prime.eligible})">
                      ${prime.eligible ? 'Remove prime eligibility' : 'Set prime eligible'}
                    </button>
                    <input type="number" id="mod-val-elder-stacks" class="mod-elder-input" placeholder="Elder stacks" style="width: 110px; background: #14171d; border: 1px solid #2b303b; border-radius: 6px; padding: 8px 10px; color: #fff;">
                    <button class="btn-mod-dark" onclick="window.AdminPanel.modSetElderStacks('${p.steamId}')">Set elder stacks</button>
                  </div>
                </div>

                <!-- Dino actions -->
                <div class="mod-section">
                  <h4 class="mod-sec-title">🦖 ĐIỀU KHIỂN & CAN THIỆP KHỦNG LONG (DINO ACTIONS)</h4>
                  <p class="mod-section-hint">Thực thi can thiệp khủng long tức thì trong game: Hồi phục, Xử tử, Giáng sét, Đổi loài, Dịch chuyển.</p>
                  
                  <div class="mod-btn-row">
                    <button class="btn-mod-dark" onclick="window.AdminPanel.modHeal('${p.steamId}', ${maxHealth}, ${maxHunger}, ${maxThirst})" style="background: linear-gradient(135deg, #059669, #047857); color: #fff; font-weight: 700;">
                      💚 Heal (Hồi đầy sinh lực)
                    </button>
                    <button class="btn-mod-slay" onclick="window.AdminPanel.modSlay('${p.steamId}')">
                      💀 Slay dino (Xử tử)
                    </button>
                    <button class="btn-mod-smite" onclick="window.AdminPanel.modSmite('${p.steamId}')">
                      ⚡ Smite (Giáng sét)
                    </button>
                    <button class="btn-mod-dark" onclick="window.AdminPanel.modGoTo('${p.steamId}')">
                      🚀 Go to (Đến chỗ người chơi)
                    </button>
                    <button class="btn-mod-dark" onclick="window.AdminPanel.modBring('${p.steamId}')">
                      🧲 Bring (Kéo về chỗ Admin)
                    </button>
                    <button class="btn-mod-dark" onclick="window.AdminPanel.modTeleportHub('${p.steamId}')">
                      🏰 Teleport Hub
                    </button>
                    <button class="btn-mod-dark" onclick="window.AdminPanel.modResetDino('${p.steamId}')">
                      🔄 Reset vị trí
                    </button>
                  </div>

                  <div class="mod-swap-wrap" style="margin-top: 14px; background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06); display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                    <span style="font-size: 0.85rem; font-weight: 700; color: #38bdf8;">🔄 Swap loài khủng long:</span>
                    <select id="mod-val-swap-species" style="background: #14171d; border: 1px solid #2b303b; border-radius: 6px; padding: 7px 12px; color: #fff;">
                      ${this.ALL_SPECIES.map(s => `<option value="${s}" ${s === p.species ? 'selected' : ''}>${s}</option>`).join('')}
                    </select>
                    <input type="number" id="mod-val-swap-growth" placeholder="Growth % (tùy chọn)" style="width: 150px; background: #14171d; border: 1px solid #2b303b; border-radius: 6px; padding: 7px 12px; color: #fff;">
                    <button class="btn-mod-orange" onclick="window.AdminPanel.modSwapSpecies('${p.steamId}')">
                      Swap species
                    </button>
                    <button class="btn-mod-dark" onclick="window.AdminPanel.modZombieInfect('${p.steamId}')" style="background: #581c87; color: #d8b4fe;">
                      🧟 Zombie infect (Nhiễm virus)
                    </button>
                  </div>
                </div>

                <!-- Prime progress -->
                <div class="mod-prime-card">
                  <div class="mod-prime-header">
                    <span class="mod-prime-title">👑 Prime progress (Tiến hóa Prime Elder)</span>
                    <span class="mod-prime-badge" style="background: rgba(234, 179, 8, 0.2); color: #fbbf24; border: 1px solid rgba(234, 179, 8, 0.4); padding: 3px 10px; border-radius: 12px; font-weight: 700; font-size: 0.8rem;">
                      ${prime.isElder ? 'Prime Elder' : (prime.eligible ? 'Prime Eligible' : 'Standard')}
                    </span>
                  </div>
                  <p class="mod-section-hint" style="margin-bottom: 4px;">Hoàn thành ít nhất 5 trong số 10 điều kiện để tiến hóa Prime Elder.</p>
                  <div class="mod-prime-summary" style="font-weight: 700; color: #38bdf8; margin: 8px 0;">
                    ${completedQuests} of 10 conditions (5 needed)
                  </div>

                  <div class="mod-quest-grid">
                    ${quests.map(q => `
                      <div class="mod-quest-item ${q.done ? 'is-done' : 'not-done'}">
                        <span class="mod-quest-icon">${q.done ? '✓' : '◯'}</span>
                        <span class="mod-quest-txt">${q.name}</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>

              <!-- TAB 2: MUTATIONS (ĐỘT BIẾN GEN - LIVE MUTATIONS) -->
              <div id="mod-tab-mutations" class="mod-tab-pane" style="display: none;">
                <div class="mod-section" style="background: rgba(14, 23, 42, 0.7); border: 1px solid rgba(249, 115, 22, 0.4); border-radius: 10px; margin-bottom: 20px; padding: 20px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 10px;">
                    <div>
                      <h3 style="font-size: 1.25rem; font-weight: 800; color: #fff; margin: 0; display: flex; align-items: center; gap: 8px;">
                        <span>🧬</span> Live mutations
                      </h3>
                      <p style="font-size: 0.84rem; color: #9ca3af; margin: 4px 0 0 0;">
                        Prefilled with the dino's current mutations. Overwrites all slots on apply; empty slots are cleared.
                      </p>
                    </div>
                    <span style="font-size: 0.75rem; color: #fb923c; background: rgba(249, 115, 22, 0.15); padding: 4px 10px; border-radius: 6px; border: 1px solid rgba(249, 115, 22, 0.35); font-weight: 700;">
                      The Isle Evrima
                    </span>
                  </div>

                  <!-- 1. ACTIVE MUTATIONS (4 SLOTS) -->
                  <div style="margin-top: 18px; margin-bottom: 22px;">
                    <div style="font-size: 0.95rem; font-weight: 800; color: #38bdf8; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
                      <span>🟢</span> Active mutations
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px;">
                      ${[1, 2, 3, 4].map(slot => {
                        const curVal = (mutations.active && mutations.active[slot-1]) ? mutations.active[slot-1] : 'None';
                        return `
                          <div style="background: #14171d; border: 1px solid #2b303b; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 6px;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                              <span style="font-size: 0.76rem; font-weight: 700; color: #9ca3af; background: rgba(255,255,255,0.06); padding: 2px 7px; border-radius: 4px;">Slot ${slot}</span>
                              <span style="font-size: 0.72rem; color: ${curVal !== 'None' ? '#34d399' : '#6b7280'}; font-weight: 600;">${curVal !== 'None' ? 'Đã kích hoạt' : 'Trống'}</span>
                            </div>
                            <select id="mod-live-mut-active-${slot}" style="background: #0f1217; border: 1px solid #374151; color: #fff; font-size: 0.82rem; padding: 7px 8px; border-radius: 6px; outline: none; width: 100%;">
                              <option value="None" ${curVal === 'None' ? 'selected' : ''}>-- Empty (None) --</option>
                              ${this.MUTATION_LIST.filter(x => x !== 'None').map(mut => `<option value="${mut}" ${curVal === mut ? 'selected' : ''}>${mut}</option>`).join('')}
                            </select>
                          </div>
                        `;
                      }).join('')}
                    </div>
                  </div>

                  <!-- 2. PARENT MUTATIONS (4 SLOTS) -->
                  <div style="margin-bottom: 22px;">
                    <div style="font-size: 0.95rem; font-weight: 800; color: #c084fc; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
                      <span>🧬</span> Parent
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px;">
                      ${[1, 2, 3, 4].map(slot => {
                        const curVal = (mutations.parent && mutations.parent[slot-1]) ? mutations.parent[slot-1] : 'None';
                        return `
                          <div style="background: #14171d; border: 1px solid #2b303b; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 6px;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                              <span style="font-size: 0.76rem; font-weight: 700; color: #9ca3af; background: rgba(255,255,255,0.06); padding: 2px 7px; border-radius: 4px;">Slot ${slot}</span>
                              <span style="font-size: 0.72rem; color: ${curVal !== 'None' ? '#c084fc' : '#6b7280'}; font-weight: 600;">${curVal !== 'None' ? 'Di truyền' : 'Trống'}</span>
                            </div>
                            <select id="mod-live-mut-parent-${slot}" style="background: #0f1217; border: 1px solid #374151; color: #fff; font-size: 0.82rem; padding: 7px 8px; border-radius: 6px; outline: none; width: 100%;">
                              <option value="None" ${curVal === 'None' ? 'selected' : ''}>-- Empty (None) --</option>
                              ${this.MUTATION_LIST.filter(x => x !== 'None').map(mut => `<option value="${mut}" ${curVal === mut ? 'selected' : ''}>${mut}</option>`).join('')}
                            </select>
                          </div>
                        `;
                      }).join('')}
                    </div>
                  </div>

                  <!-- 3. ELDER A MUTATIONS (4 SLOTS) -->
                  <div style="margin-bottom: 22px;">
                    <div style="font-size: 0.95rem; font-weight: 800; color: #fbbf24; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
                      <span>👑</span> Elder A
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px;">
                      ${[1, 2, 3, 4].map(slot => {
                        const curVal = (mutations.elderA && mutations.elderA[slot-1]) ? mutations.elderA[slot-1] : 'None';
                        return `
                          <div style="background: #14171d; border: 1px solid #2b303b; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 6px;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                              <span style="font-size: 0.76rem; font-weight: 700; color: #9ca3af; background: rgba(255,255,255,0.06); padding: 2px 7px; border-radius: 4px;">Slot ${slot}</span>
                              <span style="font-size: 0.72rem; color: ${curVal !== 'None' ? '#fbbf24' : '#6b7280'}; font-weight: 600;">${curVal !== 'None' ? 'Elder A' : 'Trống'}</span>
                            </div>
                            <select id="mod-live-mut-elderA-${slot}" style="background: #0f1217; border: 1px solid #374151; color: #fff; font-size: 0.82rem; padding: 7px 8px; border-radius: 6px; outline: none; width: 100%;">
                              <option value="None" ${curVal === 'None' ? 'selected' : ''}>-- Empty (None) --</option>
                              ${this.MUTATION_LIST.filter(x => x !== 'None').map(mut => `<option value="${mut}" ${curVal === mut ? 'selected' : ''}>${mut}</option>`).join('')}
                            </select>
                          </div>
                        `;
                      }).join('')}
                    </div>
                  </div>

                  <!-- 4. ELDER B MUTATIONS (4 SLOTS) -->
                  <div style="margin-bottom: 24px;">
                    <div style="font-size: 0.95rem; font-weight: 800; color: #f59e0b; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
                      <span>👑</span> Elder B
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px;">
                      ${[1, 2, 3, 4].map(slot => {
                        const curVal = (mutations.elderB && mutations.elderB[slot-1]) ? mutations.elderB[slot-1] : 'None';
                        return `
                          <div style="background: #14171d; border: 1px solid #2b303b; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 6px;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                              <span style="font-size: 0.76rem; font-weight: 700; color: #9ca3af; background: rgba(255,255,255,0.06); padding: 2px 7px; border-radius: 4px;">Slot ${slot}</span>
                              <span style="font-size: 0.72rem; color: ${curVal !== 'None' ? '#f59e0b' : '#6b7280'}; font-weight: 600;">${curVal !== 'None' ? 'Elder B' : 'Trống'}</span>
                            </div>
                            <select id="mod-live-mut-elderB-${slot}" style="background: #0f1217; border: 1px solid #374151; color: #fff; font-size: 0.82rem; padding: 7px 8px; border-radius: 6px; outline: none; width: 100%;">
                              <option value="None" ${curVal === 'None' ? 'selected' : ''}>-- Empty (None) --</option>
                              ${this.MUTATION_LIST.filter(x => x !== 'None').map(mut => `<option value="${mut}" ${curVal === mut ? 'selected' : ''}>${mut}</option>`).join('')}
                            </select>
                          </div>
                        `;
                      }).join('')}
                    </div>
                  </div>

                  <!-- BOTTOM BUTTON BAR (APPLY MUTATIONS BUTTON CHUẨN ISLEPILOT) -->
                  <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px; flex-wrap: wrap; gap: 12px;">
                    <button class="btn-primary" onclick="window.AdminPanel.modApplyAllMutations('${p.steamId}')" style="background: linear-gradient(135deg, #f97316, #ea580c); border: none; padding: 11px 28px; font-weight: 800; font-size: 0.95rem; border-radius: 8px; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; color: #fff; box-shadow: 0 4px 18px rgba(249, 115, 22, 0.45);">
                      <span>⚡</span> Apply mutations
                    </button>
                    <button class="btn-mod-dark" onclick="window.AdminPanel.modClearAllMutations('${p.steamId}')" style="font-size: 0.84rem; padding: 10px 18px; color: #fca5a5; border-color: rgba(239, 68, 68, 0.4); cursor: pointer;">
                      🧹 Clear all slots
                    </button>
                  </div>
                </div>
              </div>

              <!-- TAB 3: GARAGE (GARA KHỦNG LONG) -->
              <div id="mod-tab-garage" class="mod-tab-pane" style="display: none;">
                <!-- KHUNG THÊM / CẤP KHỦNG LONG VÀO GARA CHO NGƯỜI CHƠI (DÀNH CHO ADMIN) -->
                <div class="mod-section" style="background: rgba(14, 23, 42, 0.7); border: 1px solid rgba(56, 189, 248, 0.35); border-radius: 10px; margin-bottom: 20px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid rgba(56, 189, 248, 0.2); padding-bottom: 8px;">
                    <h4 style="font-size: 0.95rem; font-weight: 800; color: #38bdf8; display: flex; align-items: center; gap: 8px; margin: 0;">
                      <span>➕</span> CẤP / THÊM KHỦNG LONG VÀO GARA CHO NGƯỜI CHƠI
                    </h4>
                    <span style="font-size: 0.75rem; color: #38bdf8; background: rgba(56, 189, 248, 0.15); padding: 3px 8px; border-radius: 4px; border: 1px solid rgba(56, 189, 248, 0.3); font-weight: 700;">
                      Admin Garage Grant
                    </span>
                  </div>
                  <p class="mod-section-hint">Thêm một cá thể khủng long trực tiếp vào ô Gara của người chơi (${p.name || p.steamId}). Khủng long sẽ có sẵn trong Gara để người chơi hoặc Admin rút ra chơi bất cứ lúc nào.</p>
                  
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 14px;">
                    <!-- Chọn loài -->
                    <div class="mod-field-box">
                      <label>Loài Khủng Long (Species):</label>
                      <select id="mod-grant-species" style="background: #14171d; border: 1px solid #2b303b; border-radius: 6px; padding: 8px 10px; color: #fff; font-size: 0.88rem; outline: none;">
                        <optgroup label="🥩 Ăn Thịt (Carnivores)">
                          <option value="Tyrannosaurus" selected>Tyrannosaurus (T-Rex)</option>
                          <option value="Spinosaurus">Spinosaurus</option>
                          <option value="Giganotosaurus">Giganotosaurus (Giga)</option>
                          <option value="Allosaurus">Allosaurus</option>
                          <option value="Carnotaurus">Carnotaurus</option>
                          <option value="Ceratosaurus">Ceratosaurus</option>
                          <option value="Deinosuchus">Deinosuchus (Cá Sấu)</option>
                          <option value="Dilophosaurus">Dilophosaurus (Dilo)</option>
                          <option value="Herrerasaurus">Herrerasaurus</option>
                          <option value="Omniraptor">Omniraptor (Utahraptor)</option>
                          <option value="Troodon">Troodon</option>
                          <option value="Pteranodon">Pteranodon (Dực Long)</option>
                          <option value="Baryonyx">Baryonyx</option>
                          <option value="IndoRex">IndoRex (Indominus Rex)</option>
                        </optgroup>
                        <optgroup label="🌿 Ăn Cỏ (Herbivores)">
                          <option value="Stegosaurus">Stegosaurus (Thằn Lằn Gai)</option>
                          <option value="Triceratops">Triceratops (Tam Giác Long)</option>
                          <option value="Maiasaura">Maiasaura</option>
                          <option value="Ankylosaurus">Ankylosaurus</option>
                          <option value="Diabloceratops">Diabloceratops</option>
                          <option value="Pachycephalosaurus">Pachycephalosaurus</option>
                          <option value="Tenontosaurus">Tenontosaurus</option>
                          <option value="Gallimimus">Gallimimus</option>
                          <option value="Hypsilophodon">Hypsilophodon</option>
                          <option value="Beipiaosaurus">Beipiaosaurus</option>
                          <option value="Dryosaurus">Dryosaurus</option>
                          <option value="Puerta">Puertasaurus (Puerta)</option>
                          <option value="Therizinosaurus">Therizinosaurus (Theri)</option>
                        </optgroup>
                      </select>
                    </div>

                    <!-- Giới tính -->
                    <div class="mod-field-box">
                      <label>Giới Tính (Gender):</label>
                      <select id="mod-grant-gender" style="background: #14171d; border: 1px solid #2b303b; border-radius: 6px; padding: 8px 10px; color: #fff; font-size: 0.88rem; outline: none;">
                        <option value="Female">♀ Cái (Female)</option>
                        <option value="Male">♂ Đực (Male)</option>
                      </select>
                    </div>

                    <!-- Độ tăng trưởng -->
                    <div class="mod-field-box">
                      <label>Tăng Trưởng (% Growth):</label>
                      <div style="display: flex; gap: 6px;">
                        <input type="number" id="mod-grant-growth" min="1" max="100" value="100" style="width: 70px; background: #14171d; border: 1px solid #2b303b; border-radius: 6px; padding: 8px; color: #fff; text-align: center; font-weight: 700;">
                        <select onchange="document.getElementById('mod-grant-growth').value=this.value" style="flex: 1; background: #14171d; border: 1px solid #2b303b; border-radius: 6px; padding: 8px; color: #9ca3af; font-size: 0.82rem; outline: none;">
                          <option value="100">100% (Adult - Trưởng thành)</option>
                          <option value="80">80% (Sub-adult)</option>
                          <option value="50">50% (Juvenile)</option>
                          <option value="20">20% (Baby)</option>
                        </select>
                      </div>
                    </div>

                    <!-- Trạng thái Prime Elder -->
                    <div class="mod-field-box">
                      <label>Thăng Hoa (Prime Elder):</label>
                      <select id="mod-grant-prime" style="background: #14171d; border: 1px solid #2b303b; border-radius: 6px; padding: 8px 10px; color: #fff; font-size: 0.88rem; outline: none;">
                        <option value="false">◯ Khủng Long Bình Thường</option>
                        <option value="true">🌟 Prime Elder (Thăng Hoa - Chuẩn 13 Tấn & Scale)</option>
                      </select>
                    </div>
                  </div>

                  <!-- ĐỘT BIẾN GEN (MUTATIONS) KHI CẤP KHỦNG LONG (4 SLOTS) -->
                  <div style="margin-top: 4px; padding-top: 10px; border-top: 1px dashed rgba(255,255,255,0.1); margin-bottom: 14px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                      <label style="font-size: 0.84rem; font-weight: 700; color: #34d399; display: flex; align-items: center; gap: 6px; margin: 0;">
                        <span>🧬</span> Cấp Đột Biến Gen Ban Đầu (Mutations Slot 1 - 4):
                      </label>
                      <span style="font-size: 0.72rem; color: #9ca3af;">(Khủng long rút ra game sẽ tự động mang đủ 4 gen này)</span>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px;">
                      <div class="mod-field-box">
                        <label style="font-size: 0.75rem; color: #9ca3af;">🧬 Gen Slot 1:</label>
                        <select id="mod-grant-mut-1" style="background: #14171d; border: 1px solid #2b303b; border-radius: 6px; padding: 7px 10px; color: #fff; font-size: 0.85rem; outline: none;">
                          <option value="">-- Không chọn (Trống) --</option>
                          ${this.MUTATION_LIST.filter(x => x !== 'None').map(m => `<option value="${m}">${m}</option>`).join('')}
                        </select>
                      </div>
                      <div class="mod-field-box">
                        <label style="font-size: 0.75rem; color: #9ca3af;">🧬 Gen Slot 2:</label>
                        <select id="mod-grant-mut-2" style="background: #14171d; border: 1px solid #2b303b; border-radius: 6px; padding: 7px 10px; color: #fff; font-size: 0.85rem; outline: none;">
                          <option value="">-- Không chọn (Trống) --</option>
                          ${this.MUTATION_LIST.filter(x => x !== 'None').map(m => `<option value="${m}">${m}</option>`).join('')}
                        </select>
                      </div>
                      <div class="mod-field-box">
                        <label style="font-size: 0.75rem; color: #9ca3af;">🧬 Gen Slot 3:</label>
                        <select id="mod-grant-mut-3" style="background: #14171d; border: 1px solid #2b303b; border-radius: 6px; padding: 7px 10px; color: #fff; font-size: 0.85rem; outline: none;">
                          <option value="">-- Không chọn (Trống) --</option>
                          ${this.MUTATION_LIST.filter(x => x !== 'None').map(m => `<option value="${m}">${m}</option>`).join('')}
                        </select>
                      </div>
                      <div class="mod-field-box">
                        <label style="font-size: 0.75rem; color: #9ca3af;">🧬 Gen Slot 4:</label>
                        <select id="mod-grant-mut-4" style="background: #14171d; border: 1px solid #2b303b; border-radius: 6px; padding: 7px 10px; color: #fff; font-size: 0.85rem; outline: none;">
                          <option value="">-- Không chọn (Trống) --</option>
                          ${this.MUTATION_LIST.filter(x => x !== 'None').map(m => `<option value="${m}">${m}</option>`).join('')}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div style="display: flex; justify-content: flex-end; gap: 10px; flex-wrap: wrap;">
                    <button class="btn-primary" onclick="window.AdminPanel.modGrantDinoLive('${p.steamId}')" style="background: linear-gradient(135deg, #10b981, #059669); border: none; padding: 9px 20px; font-weight: 700; font-size: 0.88rem; border-radius: 8px; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; color: #fff; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.35);">
                      <span>⚡</span> Cấp Trực Tiếp Vào Game Ngay
                    </button>
                    <button class="btn-primary" onclick="window.AdminPanel.modAddDinoToGarage('${p.steamId}')" style="background: linear-gradient(135deg, #0ea5e9, #0284c7); border: none; padding: 9px 20px; font-weight: 700; font-size: 0.88rem; border-radius: 8px; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; color: #fff; box-shadow: 0 4px 15px rgba(14, 165, 233, 0.35);">
                      <span>📥</span> Thêm Vào Gara Dự Trữ
                    </button>
                  </div>
                </div>

                <!-- DANH SÁCH KHỦNG LONG TRONG GARA -->
                <div class="mod-section">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <h4 class="mod-sec-title">🦖 DANH SÁCH GARA (${garage.length} con đang lưu trữ)</h4>
                    <button class="btn-mod-orange" onclick="window.AdminPanel.modParkGarageDino('${p.steamId}')" style="font-size: 0.8rem; padding: 6px 14px;">
                      📥 Cất khủng long hiện tại vào Gara
                    </button>
                  </div>
                  
                  ${garage.length === 0 ? `
                    <div style="text-align: center; padding: 40px; color: #9ca3af; background: rgba(0,0,0,0.2); border-radius: 8px; border: 1px dashed rgba(255,255,255,0.1);">
                      Người chơi này hiện chưa có khủng long nào trong Gara. Bạn có thể sử dụng khung phía trên để cấp khủng long vào Gara.
                    </div>
                  ` : `
                    <div class="mod-garage-list">
                      ${garage.map(d => `
                        <div class="mod-garage-item card">
                          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                            <div>
                              <div style="font-size: 1.05rem; font-weight: 800; color: #38bdf8; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                                <span>🦖 ${d.species}</span>
                                <span style="font-size: 0.82rem; color: #9ca3af;">(${d.gender || 'Unknown'})</span>
                                ${d.source === 'admin_granted' ? '<span style="font-size: 0.72rem; background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.4); padding: 2px 6px; border-radius: 4px;">🎁 Admin cấp</span>' : ''}
                                ${(d.isPrimeElder || d.is_prime_elder) ? '<span style="font-size: 0.72rem; background: rgba(234, 179, 8, 0.2); color: #eab308; border: 1px solid rgba(234, 179, 8, 0.4); padding: 2px 6px; border-radius: 4px;">🌟 Prime Elder</span>' : ''}
                              </div>
                              <div style="font-size: 0.82rem; color: #9ca3af; margin-top: 4px;">
                                Độ lớn: <b style="color: #ec4899;">${Math.round((d.growth || 0)*100)}%</b> &bull; 
                                Cân nặng: <b style="color: #10b981;">${(() => {
                                  const isPrime = Boolean(d.isPrimeElder || d.is_prime_elder);
                                  const sName = (d.species || '').toLowerCase();
                                  if (sName.includes('spino') && isPrime) return '15.0 Tấn (15,000 kg)';
                                  if (sName.includes('trice') && isPrime) return '13.0 Tấn (13,000 kg)';
                                  if (d.weight_label) return d.weight_label;
                                  return isPrime ? 'Chuẩn Prime Elder' : 'Chuẩn';
                                })()}</b> &bull; 
                                Máu: <b>${Math.round((d.health || 0)*100)}%</b> &bull; 
                                No: <b>${Math.round((d.hunger || 0)*100)}%</b> &bull; 
                                Nước: <b>${Math.round((d.thirst || 0)*100)}%</b>
                                ${d.stored_at ? ` &bull; Cất lúc: <span>${d.stored_at}</span>` : ''}
                              </div>
                              ${(() => {
                                const rawM = d.mutations || (d.mutationSlots && (d.mutationSlots.active || [])) || [];
                                const mList = Array.isArray(rawM) ? rawM.filter(x => x && x !== 'None') : [];
                                if (mList.length > 0) {
                                  return `
                                    <div style="margin-top: 6px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                                      <span style="font-size: 0.74rem; font-weight: 700; color: #34d399;">🧬 Đột biến (${mList.length}/4 Slot):</span>
                                      ${mList.map((m, idx) => `<span style="font-size: 0.72rem; background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.35); padding: 2px 7px; border-radius: 4px; font-weight: 600;">Slot ${idx+1}: ${m}</span>`).join('')}
                                    </div>
                                  `;
                                } else {
                                  return `
                                    <div style="margin-top: 5px; font-size: 0.72rem; color: #6b7280; font-style: italic;">
                                      🧬 Chưa có đột biến gen
                                    </div>
                                  `;
                                }
                              })()}
                            </div>
                            <div style="display: flex; gap: 8px;">
                              <button class="btn-mod-orange" onclick="window.AdminPanel.modRestoreGarageDino('${p.steamId}', '${d.id}')" style="font-size: 0.82rem; padding: 6px 14px;">
                                🚀 Lấy ra game (Restore)
                              </button>
                              <button class="btn-mod-dark" onclick="window.AdminPanel.modDeleteGarageDino('${p.steamId}', '${d.id}')" style="font-size: 0.82rem; padding: 6px 12px; color: #fca5a5; border-color: rgba(239, 68, 68, 0.4);" title="Xóa khỏi Gara">
                                🗑️ Xóa
                              </button>
                            </div>
                          </div>
                        </div>
                      `).join('')}
                    </div>
                  `}
                </div>
              </div>

              <!-- TAB 4: SKINS (KHO SKIN) -->
              <div id="mod-tab-skins" class="mod-tab-pane" style="display: none;">
                <div class="mod-section">
                  <h4 class="mod-sec-title">🎨 KHO SKIN NGƯỜI CHƠI ĐANG SỞ HỮU (${skins.length} skin)</h4>
                  <p class="mod-section-hint">Các mẫu skin do Admin tạo hoặc người chơi đã mua từ Shop IslePilot.</p>
                  
                  ${skins.length === 0 ? `
                    <div style="text-align: center; padding: 40px; color: #9ca3af; background: rgba(0,0,0,0.2); border-radius: 8px; border: 1px dashed rgba(255,255,255,0.1);">
                      Người chơi này chưa sở hữu skin nào.
                    </div>
                  ` : `
                    <div class="mod-skins-grid">
                      ${skins.map(s => `
                        <div class="mod-skin-item card">
                          <div style="font-weight: 800; color: #ff70a6; font-size: 0.95rem;">${s.name || 'Skin'}</div>
                          <div style="font-size: 0.8rem; color: #9ca3af; margin: 4px 0;">Loài: <b style="color: #38bdf8;">${s.species}</b></div>
                          <button class="btn-mod-dark" onclick="window.AdminPanel.modApplyPlayerSkin('${p.steamId}', '${s.id}')" style="width: 100%; justify-content: center; margin-top: 8px; font-size: 0.8rem; padding: 6px;">
                            ✨ Áp dụng Skin ngay
                          </button>
                        </div>
                      `).join('')}
                    </div>
                  `}
                </div>
              </div>

              <!-- TAB 5: WARNINGS (LỊCH SỬ CẢNH BÁO) -->
              <div id="mod-tab-warnings" class="mod-tab-pane" style="display: none;">
                <div class="mod-section">
                  <h4 class="mod-sec-title">⚠️ LỊCH SỬ CẢNH BÁO & GHI CHÚ VI PHẠM (${warnings.length} bản ghi)</h4>
                  
                  ${warnings.length === 0 ? `
                    <div style="text-align: center; padding: 40px; color: #10b981; background: rgba(16,185,129,0.08); border-radius: 8px; border: 1px solid rgba(16,185,129,0.2);">
                      🛡️ Người chơi có lý lịch tốt, chưa từng bị cảnh báo hay xử phạt trên máy chủ.
                    </div>
                  ` : `
                    <div class="mod-warnings-list">
                      ${warnings.map(w => `
                        <div class="mod-warning-item card">
                          <div style="display: flex; justify-content: space-between; align-items: center;">
                            <b style="color: #f87171;">⚠️ ${w.reason || w.message || 'Cảnh báo vi phạm'}</b>
                            <span style="font-size: 0.78rem; color: #9ca3af;">${w.createdAt ? new Date(w.createdAt).toLocaleString('en-US') : ''}</span>
                          </div>
                          <div style="font-size: 0.82rem; color: #9ca3af; margin-top: 4px;">Người xử lý: <b>${w.adminName || 'Admin'}</b></div>
                        </div>
                      `).join('')}
                    </div>
                  `}
                </div>
              </div>

            </div>

            <!-- Right Column (Sidebar) -->
            <div class="mod-right-col">
              <!-- Ban -->
              <div class="mod-side-card">
                <label>Ban</label>
                <div class="mod-input-group">
                  <input type="text" id="mod-ban-reason" placeholder="Ban reason (optional)">
                  <input type="number" id="mod-ban-hours" placeholder="Hours (0 = perm)" style="width: 105px;">
                  <button class="btn-mod-red" onclick="window.AdminPanel.modBan('${p.steamId}')">Ban</button>
                </div>
              </div>

              <!-- Panel ban -->
              <div class="mod-side-card">
                <label>Panel ban</label>
                <div class="mod-input-group">
                  <input type="text" id="mod-panel-ban-reason" placeholder="Reason (optional)">
                  <button class="btn-mod-red" onclick="window.AdminPanel.modPanelBan('${p.steamId}')">Panel ban</button>
                </div>
              </div>

              <!-- Voice ban -->
              <div class="mod-side-card">
                <label>Voice ban</label>
                <div class="mod-input-group">
                  <input type="text" id="mod-voice-ban-reason" placeholder="Voice ban reason (optional)">
                  <input type="number" id="mod-voice-ban-hours" placeholder="Hours (0 = perm)" style="width: 105px;">
                  <button class="btn-mod-red" onclick="window.AdminPanel.modVoiceBan('${p.steamId}')">Voice ban</button>
                </div>
              </div>

              <!-- Kick & Warn -->
              <div class="mod-side-card">
                <label>Kick & Warn</label>
                <div class="mod-input-group" style="margin-bottom: 8px;">
                  <input type="text" id="mod-kick-reason" placeholder="Lý do kick...">
                  <button class="btn-mod-red" onclick="window.AdminPanel.modKick('${p.steamId}')">Kick</button>
                </div>
                <div class="mod-input-group">
                  <input type="text" id="mod-warn-msg" placeholder="Nội dung cảnh báo...">
                  <button class="btn-mod-dark" onclick="window.AdminPanel.modWarn('${p.steamId}')">Warn</button>
                </div>
              </div>

              <!-- Balance -->
              <div class="mod-side-card mod-balance-card">
                <label>Balance (Số dư Ví IslePilot)</label>
                <div class="mod-balance-val">$ <span id="mod-balance-display">${balance}</span></div>
                <div class="mod-balance-actions">
                  <input type="number" id="mod-balance-amount" placeholder="Amount (Số tiền)">
                  <button class="btn-mod-orange" onclick="window.AdminPanel.modGiveBalance('${p.steamId}')">Give</button>
                  <button class="btn-mod-dark" onclick="window.AdminPanel.modTakeBalance('${p.steamId}')">Take</button>
                </div>
              </div>

              <!-- Activity & Details -->
              <div class="mod-side-card mod-activity-card">
                <label>Activity & Info</label>
                <div class="mod-activity-row"><span>Status</span> <b style="color: ${isOnline ? '#34d399' : '#9ca3af'};">${isOnline ? '🟢 Online' : '⚫ Offline'}</b></div>
                <div class="mod-activity-row"><span>Last seen</span> <b>${lastSeen}</b></div>
                <div class="mod-activity-row"><span>Last join</span> <b>${lastJoin}</b></div>
                <div class="mod-activity-row"><span>Play time</span> <b>${playHours} giờ</b></div>
                <div class="mod-activity-row"><span>Tọa độ X Y Z</span> <b style="font-family: monospace; font-size: 0.82rem; color: #38bdf8;">X: ${Math.round((pos.x || 0) * 0.01)}, Y: ${Math.round((pos.y || 0) * 0.01)}, Z: ${Math.round((pos.z || 0) * 0.01)} <button type="button" onclick="navigator.clipboard.writeText('${Math.round((pos.x || 0) * 0.01)}, ${Math.round((pos.y || 0) * 0.01)}, ${Math.round((pos.z || 0) * 0.01)}'); window.App.showToast('📋 Đã sao chép X Y Z: ${Math.round((pos.x || 0) * 0.01)}, ${Math.round((pos.y || 0) * 0.01)}, ${Math.round((pos.z || 0) * 0.01)}');" style="background:none;border:none;cursor:pointer;color:#fbbf24;font-size:0.85rem;" title="Sao chép X Y Z">📋</button></b></div>
                ${discord ? `
                  <div class="mod-activity-row" style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed rgba(255,255,255,0.1);">
                    <span>Discord</span> <b style="color: #818cf8;">@${discord.username || discord.id}</b>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    if (this.activeModalTab) {
      this.switchModalTab(this.activeModalTab);
    }
  },

  switchModalTab(tabId) {
    this.activeModalTab = tabId;
    document.querySelectorAll('.mod-pill-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-modtab') === tabId);
    });
    document.querySelectorAll('.mod-tab-pane').forEach(pane => {
      pane.style.display = (pane.id === `mod-tab-${tabId}`) ? 'block' : 'none';
      pane.classList.toggle('active', pane.id === `mod-tab-${tabId}`);
    });
  },

  async modApplyStats(steamId) {
    const health = parseFloat(document.getElementById('mod-val-health')?.value || 100);
    const hunger = parseFloat(document.getElementById('mod-val-hunger')?.value || 100);
    const thirst = parseFloat(document.getElementById('mod-val-thirst')?.value || 100);
    const stamina = parseFloat(document.getElementById('mod-val-stamina')?.value || 100);
    const bleed = parseFloat(document.getElementById('mod-val-bleed')?.value || 0);
    const growth = parseFloat(document.getElementById('mod-val-growth')?.value || 100) / 100;

    const carb = parseFloat(document.getElementById('mod-val-nutr-a')?.value || 100);
    const prot = parseFloat(document.getElementById('mod-val-nutr-b')?.value || 100);
    const fat = parseFloat(document.getElementById('mod-val-nutr-y')?.value || 100);

    // 1. Áp dụng sinh lực toàn diện (Health, Hunger, Thirst, Stamina, Bleed, Growth) trong 1 lệnh duy nhất
    const ok = await this.executeCommand('setstats', steamId, {
      health,
      hunger,
      thirst,
      stamina,
      bleed,
      growth
    });

    // 2. Cập nhật 3 dưỡng chất dinh dưỡng A B Y (Chuẩn IslePilot API: carb, protein, lipid)
    if (document.getElementById('mod-val-nutr-a')) {
      await this.executeCommand('setnutrition', steamId, {
        carb: carb,
        protein: prot,
        lipid: fat
      }, true);
    }
  },

  async modTogglePrime(steamId, eligible) {
    await this.executeCommand('setprime', steamId, { 
      eligible, 
      conditions: eligible ? 10 : 0, 
      isElder: eligible, 
      stacks: eligible ? 10 : 0 
    });
    if (eligible) {
      await this.executeCommand('scale', steamId, { scale: 1.37 }, true);
    }
  },

  async modSetElderStacks(steamId) {
    const stacks = parseInt(document.getElementById('mod-val-elder-stacks')?.value || 10);
    await this.executeCommand('setprime', steamId, { eligible: true, conditions: 10, isElder: true, stacks });
    await this.executeCommand('scale', steamId, { scale: 1.37 }, true);
  },

  async modHeal(steamId, maxH, maxHu, maxT) {
    const ok = await this.executeCommand('setstats', steamId, {
      health: maxH || 10000,
      hunger: maxHu || 4000,
      thirst: maxT || 1000,
      stamina: 100,
      bleed: 0,
      growth: 1.0
    });
    if (ok) {
      await this.executeCommand('setnutrition', steamId, {
        carbohydrate: 100,
        protein: 100,
        fat: 100
      }, true);
    }
  },

  async modSlay(steamId) {
    await this.executeCommand('slay', steamId, {});
  },

  async modSmite(steamId) {
    await this.executeCommand('smite', steamId, { reason: 'Smited with lightning' });
  },

  async modGoTo(steamId) {
    const u = JSON.parse(localStorage.getItem('steam_user') || 'null');
    const adminSid = (u && u.steamId) ? u.steamId : '76561199175571899';
    await this.executeCommand('goto', steamId, { adminSteamId: adminSid });
  },

  async modBring(steamId) {
    const u = JSON.parse(localStorage.getItem('steam_user') || 'null');
    const adminSid = (u && u.steamId) ? u.steamId : '76561199175571899';
    await this.executeCommand('bring', steamId, { adminSteamId: adminSid });
  },

  async modTeleportHub(steamId) {
    await this.executeCommand('teleporthub', steamId, {});
  },

  async modResetDino(steamId) {
    await this.executeCommand('reset', steamId, {});
  },

  async modSwapSpecies(steamId) {
    const species = document.getElementById('mod-val-swap-species')?.value;
    const growthInput = document.getElementById('mod-val-swap-growth')?.value;
    if (!species) {
      this.showNotification('Thất bại', false);
      return;
    }
    const r1 = await this.executeCommand('swap', steamId, { species, gender: 'Female' }, true);
    if (growthInput) {
      const growth = parseFloat(growthInput) / 100;
      await this.executeCommand('setgrowth', steamId, { growth, frozen: false }, true);
    }
    if (r1) {
      this.showNotification('Thành công', true);
    } else {
      this.showNotification('Thất bại', false);
    }
  },

  async modZombieInfect(steamId) {
    await this.executeCommand('setpowers', steamId, { powers: true });
  },

  async modBan(steamId) {
    const reason = document.getElementById('mod-ban-reason')?.value || 'Vi phạm nội quy';
    const hours = parseInt(document.getElementById('mod-ban-hours')?.value || 0);
    await this.executeCommand('ban', steamId, { reason, hours });
  },

  async modPanelBan(steamId) {
    const reason = document.getElementById('mod-panel-ban-reason')?.value || 'Cấm truy cập Panel';
    await this.executeCommand('ban', steamId, { reason, type: 'panel' });
  },

  async modVoiceBan(steamId) {
    const reason = document.getElementById('mod-voice-ban-reason')?.value || 'Cấm Voice chat';
    const hours = parseInt(document.getElementById('mod-voice-ban-hours')?.value || 0);
    await this.executeCommand('warn', steamId, { message: `[Voice Ban] ${reason} (${hours}h)` });
  },

  async modKick(steamId) {
    const reason = document.getElementById('mod-kick-reason')?.value || 'Admin kick từ Web Dashboard';
    await this.executeCommand('kick', steamId, { reason });
  },

  async modWarn(steamId) {
    const message = document.getElementById('mod-warn-msg')?.value || 'Cảnh báo từ Quản trị viên';
    await this.executeCommand('warn', steamId, { message });
  },

  async modSetSlotMutation(steamId, category, slotNumber, mutationName) {
    if (!mutationName) return;
    const muts = this.currentMutations || { active: [], parent: [], elderA: [], elderB: [] };
    if (!muts[category]) muts[category] = ['None', 'None', 'None', 'None'];
    muts[category][slotNumber - 1] = mutationName;
    this.currentMutations = muts;

    const ok = await this.executeCommand('mutations', steamId, {
      mutation: mutationName,
      slot: slotNumber,
      category: category,
      mutationSlots: muts
    });

    if (ok) {
      this.activeModalTab = 'mutations';
      await this.openModerationModal(steamId);
      this.switchModalTab('mutations');
    }
  },

  async modApplyCustomMutation(steamId) {
    const category = document.getElementById('mod-mut-cat')?.value || 'active';
    const slot = parseInt(document.getElementById('mod-mut-slot')?.value || 1);
    const mutation = document.getElementById('mod-mut-select')?.value || 'Submerged Optical Retention';

    await this.modSetSlotMutation(steamId, category, slot, mutation);
  },

  async modApplyAllMutations(steamId) {
    const categories = ['active', 'parent', 'elderA', 'elderB'];
    const payloadSlots = {
      active: [],
      parent: [],
      elderA: [],
      elderB: []
    };

    categories.forEach(cat => {
      for (let i = 1; i <= 4; i++) {
        const el = document.getElementById(`mod-live-mut-${cat}-${i}`);
        const val = el ? el.value : 'None';
        payloadSlots[cat].push(val || 'None');
      }
    });

    const ok = await this.executeCommand('mutations', steamId, {
      active: payloadSlots.active,
      parent: payloadSlots.parent,
      elderA: payloadSlots.elderA,
      elderB: payloadSlots.elderB,
      mutationSlots: payloadSlots
    });

    if (ok) {
      this.activeModalTab = 'mutations';
      await this.openModerationModal(steamId);
      this.switchModalTab('mutations');
    }
  },

  async modClearAllMutations(steamId) {
    if (!confirm('Bạn có chắc chắn muốn xóa toàn bộ đột biến gen của khủng long này?')) return;
    this.currentMutations = {
      active: ['None', 'None', 'None', 'None'],
      parent: ['None', 'None', 'None', 'None'],
      elderA: ['None', 'None', 'None', 'None'],
      elderB: ['None', 'None', 'None', 'None']
    };
    const ok = await this.executeCommand('mutations', steamId, {
      clear: true,
      mutations: []
    });
    if (ok) {
      this.activeModalTab = 'mutations';
      await this.openModerationModal(steamId);
      this.switchModalTab('mutations');
    }
  },

  async modGrantDinoLive(steamId) {
    const species = document.getElementById('mod-grant-species')?.value || 'Tyrannosaurus';
    const gender = document.getElementById('mod-grant-gender')?.value || 'Female';
    const growth = parseFloat(document.getElementById('mod-grant-growth')?.value || 100);
    const isPrimeElder = document.getElementById('mod-grant-prime')?.value === 'true';

    const m1 = document.getElementById('mod-grant-mut-1')?.value || '';
    const m2 = document.getElementById('mod-grant-mut-2')?.value || '';
    const m3 = document.getElementById('mod-grant-mut-3')?.value || '';
    const m4 = document.getElementById('mod-grant-mut-4')?.value || '';
    const mutations = [m1, m2, m3, m4].filter(Boolean);

    const ok = await this.executeCommand('grant_dino_live', steamId, {
      species,
      gender,
      growth,
      isPrimeElder,
      mutations
    });

    if (ok) {
      this.activeModalTab = 'overview';
      await this.openModerationModal(steamId);
      this.switchModalTab('overview');
    }
  },

  async modAddDinoToGarage(steamId) {
    const species = document.getElementById('mod-grant-species')?.value || 'Tyrannosaurus';
    const gender = document.getElementById('mod-grant-gender')?.value || 'Female';
    const growth = parseFloat(document.getElementById('mod-grant-growth')?.value || 100);
    const isPrimeElder = document.getElementById('mod-grant-prime')?.value === 'true';

    const m1 = document.getElementById('mod-grant-mut-1')?.value || '';
    const m2 = document.getElementById('mod-grant-mut-2')?.value || '';
    const m3 = document.getElementById('mod-grant-mut-3')?.value || '';
    const m4 = document.getElementById('mod-grant-mut-4')?.value || '';
    const mutations = [m1, m2, m3, m4].filter(Boolean);

    const ok = await this.executeCommand('add_garage_dino', steamId, {
      species,
      gender,
      growth,
      isPrimeElder,
      mutations
    });

    if (ok) {
      this.activeModalTab = 'garage';
      await this.openModerationModal(steamId);
      this.switchModalTab('garage');
    }
  },

  async modDeleteGarageDino(steamId, garageDinoId) {
    if (!confirm('Bạn có chắc chắn muốn xóa con khủng long này khỏi Gara người chơi?')) return;
    const ok = await this.executeCommand('delete_garage_dino', steamId, { garageDinoId });
    if (ok) {
      this.activeModalTab = 'garage';
      await this.openModerationModal(steamId);
      this.switchModalTab('garage');
    }
  },

  async modRestoreGarageDino(steamId, garageDinoId) {
    const ok = await this.executeCommand('restore_garage_dino', steamId, { garageDinoId });
    if (ok) {
      this.activeModalTab = 'garage';
      await this.openModerationModal(steamId);
      this.switchModalTab('garage');
    }
  },

  async modParkGarageDino(steamId) {
    await this.executeCommand('park_garage_dino', steamId, {});
  },

  async modApplyPlayerSkin(steamId, presetId) {
    await this.executeCommand('apply_skin', steamId, { presetId });
  },

  async modGiveBalance(steamId) {
    const amount = parseFloat(document.getElementById('mod-balance-amount')?.value || 0);
    if (!amount || amount <= 0) {
      this.showNotification('Thất bại', false);
      return;
    }
    const ok = await this.executeCommand('adjust_balance', steamId, { amount: +amount });
    if (ok) {
      const disp = document.getElementById('mod-balance-display');
      if (disp) {
        disp.textContent = Math.round(parseFloat(disp.textContent || 0) + amount);
      }
    }
  },

  async modTakeBalance(steamId) {
    const amount = parseFloat(document.getElementById('mod-balance-amount')?.value || 0);
    if (!amount || amount <= 0) {
      this.showNotification('Thất bại', false);
      return;
    }
    const ok = await this.executeCommand('adjust_balance', steamId, { amount: -amount });
    if (ok) {
      const disp = document.getElementById('mod-balance-display');
      if (disp) {
        disp.textContent = Math.max(0, Math.round(parseFloat(disp.textContent || 0) - amount));
      }
    }
  },
  // Chỉ hiển thị "Thành công" hoặc "Thất bại"
  showNotification(text, isSuccess) {
    if (window.App && typeof window.App.showToast === 'function') {
      window.App.showToast(text, isSuccess ? 'success' : 'error');
    } else {
      alert(text);
    }
  }
};

// Đảm bảo AdminPanel luôn khả dụng toàn cục trên window
window.AdminPanel = AdminPanel;
