// Module Quản lý Gara Khủng Long (IslePilot Dino Garage)

const Garage = {

  dinos: [],

  slotsTotal: 5,

  currentMode: 'all',
  autoRefreshTimer: null,
  isRefreshing: false,
  isSpawning: false,

  getDeletedDinos() {
    try {
      return JSON.parse(localStorage.getItem('deleted_garage_dinos') || '[]');
    } catch (e) {
      return [];
    }
  },

  addDeletedDino(id) {
    if (!id) return;
    try {
      const list = this.getDeletedDinos();
      const sId = String(id);
      if (!list.includes(sId)) {
        list.push(sId);
        localStorage.setItem('deleted_garage_dinos', JSON.stringify(list));
      }
    } catch (e) {}
  },



  isCarnivore(species) {

    const s = (species || '').toLowerCase().trim();

    // Danh sách các loài Ăn Cỏ (Herbivores) chính xác trên server

    const herbivores = [

      'triceratops', 'trike',

      'diabloceratops', 'diablo',

      'stegosaurus', 'stego',

      'tenontosaurus', 'tenonto',

      'pachycephalosaurus', 'pachy',

      'gallimimus', 'galli',

      'hypsilophodon', 'hypsi',

      'dryosaurus', 'dryo',

      'beipiaosaurus', 'beipi',

      'maiasaura', 'maia',

      'ankylosaurus', 'ankyl',

      'puertasaurus', 'puerta',

      'therizinosaurus', 'theri'

    ];

    for (const h of herbivores) {

      if (s === h || s.startsWith(h) || s.includes(h)) {

        return false;

      }

    }

    // Các loài còn lại (Tyrannosaurus, Allosaurus, Carnotaurus, Ceratosaurus, Deinosuchus, Dilophosaurus, Herrerasaurus, Omniraptor, Troodon, Spinosaurus, Giganotosaurus, Baryonyx, IndoRex, Pteranodon) là ăn thịt

    return true;

  },



  getDinoImageUrl(species) {

    if (!species) return '/assets/images/Tyrannosaurus.webp';

    const s = species.toLowerCase().trim();



    // 1. Kiểm tra loài có tên đặc biệt trước để tránh trùng lặp chuỗi

    if (s.includes('tyranno') || s.includes('t-rex') || s.includes('rex')) return '/assets/images/Tyrannosaurus.webp';

    if (s.includes('triceratops') || s.includes('trike')) return 'https://islepilot.eu/cdn/dino-art/render/Triceratops.webp';

    if (s.includes('diabloceratops') || s.includes('diablo')) return 'https://islepilot.eu/cdn/dino-art/render/Diabloceratops.webp';

    if (s.includes('ceratosaurus') || s.startsWith('cera')) return 'https://islepilot.eu/cdn/dino-art/render/Ceratosaurus.webp';

    if (s.includes('carnotaurus') || s.includes('carno')) return 'https://islepilot.eu/cdn/dino-art/render/Carnotaurus.webp';

    if (s.includes('allosaurus') || s.includes('allo')) return 'https://islepilot.eu/cdn/dino-art/render/Allosaurus.webp';

    if (s.includes('deinosuchus') || s.includes('deino')) return 'https://islepilot.eu/cdn/dino-art/render/Deinosuchus.webp';

    if (s.includes('stegosaurus') || s.includes('stego')) return 'https://islepilot.eu/cdn/dino-art/render/Stegosaurus.webp';

    if (s.includes('omniraptor') || s.includes('omni') || s.includes('raptor')) return 'https://islepilot.eu/cdn/dino-art/render/Omniraptor.webp';

    if (s.includes('troodon')) return 'https://islepilot.eu/cdn/dino-art/render/Troodon.webp';

    if (s.includes('pteranodon') || s.includes('ptera')) return 'https://islepilot.eu/cdn/dino-art/render/Pteranodon.webp';

    if (s.includes('tenontosaurus') || s.includes('tenonto')) return 'https://islepilot.eu/cdn/dino-art/render/Tenontosaurus.webp';

    if (s.includes('pachycephalosaurus') || s.includes('pachy')) return 'https://islepilot.eu/cdn/dino-art/render/Pachycephalosaurus.webp';

    if (s.includes('gallimimus') || s.includes('galli')) return 'https://islepilot.eu/cdn/dino-art/render/Gallimimus.webp';

    if (s.includes('herrerasaurus') || s.includes('herrera')) return 'https://islepilot.eu/cdn/dino-art/render/Herrerasaurus.webp';

    if (s.includes('beipiaosaurus') || s.includes('beipi')) return 'https://islepilot.eu/cdn/dino-art/render/Beipiaosaurus.webp';

    if (s.includes('hypsilophodon') || s.includes('hypsi')) return 'https://islepilot.eu/cdn/dino-art/render/Hypsilophodon.webp';

    if (s.includes('dryosaurus') || s.includes('dryo')) return 'https://islepilot.eu/cdn/dino-art/render/Dryosaurus.webp';

    if (s.includes('dilophosaurus') || s.includes('dilo')) return 'https://islepilot.eu/cdn/dino-art/render/Dilophosaurus.webp';

    if (s.includes('baryonyx') || s.includes('bary')) return 'https://islepilot.eu/cdn/dino-art/render/Baryonyx.webp';

    if (s.includes('maiasaura') || s.includes('maia')) return 'https://islepilot.eu/cdn/dino-art/render/Maiasaura.webp';

    if (s.includes('spinosaurus') || s.includes('spino')) return 'https://islepilot.eu/cdn/dino-art/render/Spinosaurus.webp';

    if (s.includes('giganotosaurus') || s.includes('giga')) return 'https://islepilot.eu/cdn/dino-art/render/Giganotosaurus.webp';

    if (s.includes('ankylosaurus') || s.includes('ankyl')) return 'https://islepilot.eu/cdn/dino-art/render/Ankylosaurus.webp';

    if (s.includes('puerta')) return 'https://islepilot.eu/cdn/dino-art/render/Puerta.webp';

    if (s.includes('therizinosaurus') || s.includes('theri')) return 'https://islepilot.eu/cdn/dino-art/render/Therizinosaurus.webp';



    const formattedName = species.charAt(0).toUpperCase() + species.slice(1).split(' ')[0];

    return `https://islepilot.eu/cdn/dino-art/render/${formattedName}.webp`;

  },



  getDinoIcon(species) {

    const s = (species || '').toLowerCase();

    if (s.includes('tyrannosaurus') || s.includes('t-rex') || s.includes('rex')) return '🦖';

    if (s.includes('spino') || s.includes('deinosuchus')) return '🐊';

    if (s.includes('carno') || s.includes('cera') || s.includes('allo')) return '🦕';

    if (s.includes('stego') || s.includes('diablo') || s.includes('trike') || s.includes('triceratops')) return '🛡️';

    if (s.includes('omni') || s.includes('troodon') || s.includes('raptor')) return '🦅';

    if (s.includes('tenonto') || s.includes('pachy') || s.includes('galli')) return '🦘';

    return '🦕';

  },



  async renderActiveDino() {

    const banner = document.getElementById('garage-active-dino-banner');

    if (!banner) return;

    try {

      const user = JSON.parse(localStorage.getItem('steam_user') || 'null');

      const steamParam = (user && user.steamId) ? `?steam_id=${user.steamId}` : '';

      const res = await fetch(`/api/player/active-dino${steamParam}`);

      if (!res.ok) return;

      const data = await res.json();

      if (data && data.species) {

        banner.style.display = 'flex';

        const img = document.getElementById('garage-active-dino-img');

        const title = document.getElementById('garage-active-dino-title');

        const status = document.getElementById('garage-active-dino-status');



        if (img) img.src = this.getDinoImageUrl(data.species);

        if (title) {

          const growthPct = Math.round((data.growth || 1.0) * 100);

          const genderText = (data.female || data.gender === 'female') ? '♀ Cái' : '♂ Đực';

          const isCarno = this.isCarnivore(data.species);

          const dietLabel = isCarno ? '🍖 Ăn Thịt' : '🌿 Ăn Cỏ';

          title.textContent = `${data.species} (${growthPct}% - ${genderText}) [${dietLabel}]`;

        }

        if (status) {

          if (data.online) {

            status.textContent = '🟢 Đang Trực Tuyến';

            status.style.background = 'rgba(0, 240, 118, 0.15)';

            status.style.color = '#00f076';

            status.style.border = '1px solid rgba(0, 240, 118, 0.3)';

          } else {

            status.textContent = '⚪ Ngoại Tuyến (Offline)';

            status.style.background = 'rgba(148, 163, 184, 0.15)';

            status.style.color = '#94a3b8';

            status.style.border = '1px solid rgba(148, 163, 184, 0.3)';

          }

        }

      } else {

        banner.style.display = 'none';

      }

    } catch (e) {

      console.warn("Lỗi tải thông tin khủng long đang chơi:", e);

    }

  },



    updateSlotsBadge() {
    const slotBadge = document.getElementById('garage-slots-badge');
    if (slotBadge) {
      slotBadge.textContent = `${(this.dinos || []).length} / ${this.slotsTotal || 5} Khủng Long`;
    }
  },

  startAutoRefresh() {
    this.stopAutoRefresh();
    this.autoRefreshTimer = setInterval(() => {
      const view = document.getElementById('view-garage');
      if (!view || !view.classList.contains('active')) {
        this.stopAutoRefresh();
        return;
      }
      if (document.hidden || this.isStoring || this.isSpawning) {
        return;
      }
      this.silentRefresh();
    }, 4000);
  },

  stopAutoRefresh() {
    if (this.autoRefreshTimer) {
      clearInterval(this.autoRefreshTimer);
      this.autoRefreshTimer = null;
    }
  },

  async silentRefresh() {
    if (this.isRefreshing || this.isStoring || this.isSpawning) return;
    this.isRefreshing = true;

    const user = JSON.parse(localStorage.getItem('steam_user') || 'null');
    const garageUrl = user 
      ? `/api/server/garage?steam_id=${user.steamId}&_t=${Date.now()}` 
      : `/api/server/garage?_t=${Date.now()}`;

    try {
      this.renderActiveDino();

      const res = await fetch(garageUrl);
      const data = await res.json();
      if (data && Array.isArray(data.dinos)) {
        const deletedList = this.getDeletedDinos();
        const newDinos = data.dinos.filter(d => !deletedList.includes(String(d.id)));

        const currentIds = (this.dinos || []).map(d => String(d.id)).sort().join(',');
        const newIds = newDinos.map(d => String(d.id)).sort().join(',');

        if (currentIds !== newIds) {
          this.dinos = newDinos;
          this.slotsTotal = data.slots_total || 5;
          this.updateSlotsBadge();
          this.displayDinos(this.dinos, this.currentMode);
        }
      }
    } catch (e) {
      // silent
    } finally {
      this.isRefreshing = false;
    }
  },

  async render() {
    this.startAutoRefresh();

    this.renderActiveDino();

    const container = document.getElementById('garage-container');

    if (!container) return;



    const user = JSON.parse(localStorage.getItem('steam_user') || 'null');

    const garageUrl = user 
      ? `/api/server/garage?steam_id=${user.steamId}&_t=${Date.now()}` 
      : `/api/server/garage?_t=${Date.now()}`;

    let data = null;

    try {

      const res = await fetch(garageUrl);

      data = await res.json();

    } catch (e) {

      console.warn("Không thể tải Gara:", e);

    }

    if (data && data.deleted_ids && Array.isArray(data.deleted_ids)) {
      const localList = this.getDeletedDinos();
      const merged = Array.from(new Set([...localList, ...data.deleted_ids.map(String)]));
      try {
        localStorage.setItem('deleted_garage_dinos', JSON.stringify(merged));
      } catch (e) {}
    }

    // Tự động đồng bộ 2 chiều các ID đã xóa lên server
    const currentDeleted = this.getDeletedDinos();
    if (currentDeleted.length > 0 && user && user.steamId) {
      fetch('/api/server/garage/sync-deleted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleted_ids: currentDeleted, steam_id: user.steamId })
      }).catch(() => {});
    }



    if (!data || !data.dinos || data.dinos.length === 0) {

      container.innerHTML = `

        <div class="card" style="grid-column: 1/-1; text-align: center; padding: 40px;">

          <p style="font-size: 1.05rem; margin-bottom: 16px;">

            ${user ? 'Bạn chưa cất khủng long nào trong Gara của server 3MGAMING.' : 'Hãy đăng nhập Steam để xem và quản lý khủng long trong Gara của bạn!'}

          </p>

          ${!user ? '<a href="/api/player/steam/login?redirect=%2F" class="btn-primary" style="display: inline-flex;">🎮 Đăng Nhập Steam Ngay</a>' : ''}

        </div>

      `;

      const slotBadge = document.getElementById('garage-slots-badge');

      if (slotBadge) slotBadge.textContent = `0 / 5 Khủng Long`;

      return;

    }



    const deletedList = this.getDeletedDinos();
    this.dinos = (data.dinos || []).filter(d => !deletedList.includes(String(d.id)));

    this.slotsTotal = data.slots_total || 5;



    // Cập nhật slot badge

    const slotBadge = document.getElementById('garage-slots-badge');

    if (slotBadge) {

      slotBadge.textContent = `${this.dinos.length} / ${this.slotsTotal} Khủng Long`;

    }



    this.displayDinos(this.dinos, this.currentMode);

  },



  formatStoredTime(timeStr) {

    if (!timeStr) return 'Gần đây';

    if (timeStr.includes('/') || (timeStr.includes('-') && !timeStr.includes('T'))) {

      return timeStr;

    }

    try {

      const d = new Date(timeStr);

      if (!isNaN(d.getTime())) {

        const pad = (n) => String(n).padStart(2, '0');

        const hours = pad(d.getHours());

        const mins = pad(d.getMinutes());

        const secs = pad(d.getSeconds());

        const day = pad(d.getDate());

        const month = pad(d.getMonth() + 1);

        const year = d.getFullYear();

        return `${hours}:${mins}:${secs} - ${day}/${month}/${year}`;

      }

    } catch (e) {}

    return timeStr;

  },



  renderDinoCard(dino) {

    const isCarno = this.isCarnivore(dino.species);

    const validMutations = (dino.mutations || []).filter(m => m && m !== 'None' && String(m).trim() !== '');



    return `

      <div class="dino-card">

        <div class="dino-card-banner">

          <img src="${this.getDinoImageUrl(dino.species)}" alt="${dino.species}" class="dino-img-render" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">

          <span style="display:none; font-size: 52px;">${this.getDinoIcon(dino.species)}</span>

          <span class="growth-badge">${dino.stage || 'Adult'} (${dino.growth_percent}%)</span>

          ${dino.is_prime_elder ? '<span class="growth-badge" style="right: auto; left: 10px; background: rgba(245, 158, 11, 0.25); border-color: #f59e0b; color: #fbbf24;">👑 Prime Elder</span>' : ''}

        </div>

        <div class="dino-card-body">

          <div class="dino-name" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px;">

            <div>

              ${dino.name ? `<span style="color: var(--accent); font-weight: 800;">${dino.name}</span> <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 500;">(${dino.species})</span>` : dino.species}

            </div>

            <span class="diet-badge ${isCarno ? 'diet-carnivore' : 'diet-herbivore'}">

              ${isCarno ? '🍖 Ăn Thịt' : '🌿 Ăn Cỏ'}

            </span>

          </div>



          <div class="dino-info" style="margin-top: 6px;">

            <span>Giới tính: <b>${dino.gender}</b></span>

            <span>Tăng trưởng: <b style="color: var(--accent);">${dino.growth_percent}%</b></span>

          </div>



          <div class="dino-stat-row">

            <div class="stat-bar-container">

              <span style="width: 55px; color: var(--text-muted);">Máu</span>

              <div class="stat-bar"><div class="stat-fill" style="width: ${dino.health}%; background: #ef4444;"></div></div>

              <span style="font-weight: 700; color: #fca5a5; font-size: 0.78rem; white-space: nowrap; min-width: 95px; text-align: right;">

                ${(dino.current_hp !== undefined ? dino.current_hp : Math.round((dino.health || 100) * 50)).toLocaleString()} / ${(dino.max_hp || 5000).toLocaleString()} HP

              </span>

            </div>

            <div class="stat-bar-container">

              <span style="width: 55px; color: var(--text-muted);">Thức ăn</span>

              <div class="stat-bar"><div class="stat-fill" style="width: ${dino.hunger}%; background: #f59e0b;"></div></div>

              <span style="font-weight: 700; color: #fde68a; font-size: 0.78rem; white-space: nowrap; min-width: 95px; text-align: right;">

                ${(dino.current_hunger !== undefined ? dino.current_hunger : Math.round((dino.hunger || 100) * 30)).toLocaleString()} / ${(dino.max_hunger || 3000).toLocaleString()}

              </span>

            </div>

            <div class="stat-bar-container">

              <span style="width: 55px; color: var(--text-muted);">Nước</span>

              <div class="stat-bar"><div class="stat-fill" style="width: ${dino.thirst}%; background: #3b82f6;"></div></div>

              <span style="font-weight: 700; color: #93c5fd; font-size: 0.78rem; white-space: nowrap; min-width: 95px; text-align: right;">

                ${(dino.current_thirst !== undefined ? dino.current_thirst : Math.round((dino.thirst || 100) * 10)).toLocaleString()} / ${(dino.max_thirst || 1000).toLocaleString()}

              </span>

            </div>

          </div>







          <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 14px;">

            Cất lúc: <b style="color: #e5e7eb;">${this.formatStoredTime(dino.stored_at || dino.parked_at)}</b>

          </div>



          <div class="dino-actions">

            <button class="btn-spawn" data-id="${dino.id}" onclick="Garage.actionSpawn('${dino.id}', '${dino.species}', this)">

              ⚡ Rút Dino

            </button>

            <button class="btn-store" onclick="Garage.actionRename('${dino.id}', '${dino.name || dino.species}')">

              ✏️ Đổi Tên

            </button>

            <button class="btn-delete" onclick="Garage.actionDelete('${dino.id}', '${dino.name || dino.species}')" title="Xóa vĩnh viễn khủng long khỏi Gara">

              🗑️ Xóa Dino

            </button>

          </div>

          <button type="button" class="btn-mutations-view" onclick="Garage.showMutationsModal('${dino.id}')" title="Xem chi tiết các đột biến gen đã cộng">

            🔀 Đột biến

          </button>


        </div>

      </div>

    `;

  },



  displayDinos(list, mode = 'all') {

    const container = document.getElementById('garage-container');

    if (!container) return;



    if (!list || list.length === 0) {

      container.innerHTML = '<div class="card" style="grid-column: 1/-1; text-align: center; padding: 40px;"><p style="color: var(--text-muted);">Không tìm thấy khủng long phù hợp.</p></div>';

      return;

    }



    const carnivores = list.filter(d => this.isCarnivore(d.species));

    const herbivores = list.filter(d => !this.isCarnivore(d.species));



    let html = '';



    if (mode === 'carnivore') {

      if (carnivores.length === 0) {

        container.innerHTML = '<div class="card" style="grid-column: 1/-1; text-align: center; padding: 40px;"><p style="color: var(--text-muted);">Không có khủng long ăn thịt nào trong Gara.</p></div>';

        return;

      }

      html += `<div class="garage-group-header">🍖 Khủng Long Ăn Thịt (${carnivores.length})</div>`;

      html += carnivores.map(d => this.renderDinoCard(d)).join('');

    } else if (mode === 'herbivore') {

      if (herbivores.length === 0) {

        container.innerHTML = '<div class="card" style="grid-column: 1/-1; text-align: center; padding: 40px;"><p style="color: var(--text-muted);">Không có khủng long ăn cỏ nào trong Gara.</p></div>';

        return;

      }

      html += `<div class="garage-group-header">🌿 Khủng Long Ăn Cỏ (${herbivores.length})</div>`;

      html += herbivores.map(d => this.renderDinoCard(d)).join('');

    } else {

      // Chế độ 'all': Sắp xếp theo nhóm ăn cỏ và ăn thịt riêng biệt, rõ ràng

      if (herbivores.length > 0) {

        html += `<div class="garage-group-header">🌿 Khủng Long Ăn Cỏ (${herbivores.length})</div>`;

        html += herbivores.map(d => this.renderDinoCard(d)).join('');

      }

      if (carnivores.length > 0) {

        html += `<div class="garage-group-header">🍖 Khủng Long Ăn Thịt (${carnivores.length})</div>`;

        html += carnivores.map(d => this.renderDinoCard(d)).join('');

      }

    }



    container.innerHTML = html;

  },



  filter(type, btnElement) {

    this.currentMode = type;

    const filterContainer = document.getElementById('garage-filter-buttons');

    if (filterContainer) {

      filterContainer.querySelectorAll('.map-filter-btn').forEach(btn => btn.classList.remove('active'));

    }

    if (btnElement) {

      btnElement.classList.add('active');

    }

    this.displayDinos(this.dinos, type);

  },



  async actionSpawn(id, species, btnElement = null) {
    if (this.isSpawning) return;
    this.isSpawning = true;

    const user = JSON.parse(localStorage.getItem('steam_user') || 'null');
    const steamId = user ? user.steamId : '76561199259679997';

    const btn = btnElement || document.querySelector(`button.btn-spawn[data-id="${id}"]`);
    const allSpawnBtns = document.querySelectorAll('button.btn-spawn');

    allSpawnBtns.forEach(b => { b.disabled = true; });
    if (btn) {
      btn.innerHTML = '<span>⏳</span> Đang lấy...';
      btn.style.opacity = '0.7';
    }

    if (window.App && window.App.showToast) {
      window.App.showToast("⏳ Đang gửi lệnh lấy khủng long ra game...", "info");
    }

    try {
      const res = await fetch('/api/server/garage/spawn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dino_id: id, species: species, steam_id: steamId })
      });
      const data = await res.json();

      if (data.success || data.ok) {
        if (window.App && window.App.showToast) {
          window.App.showToast(data.message || "🎉 Lấy khủng long thành công! Đang tải vào game...", "success");
        }

        // Cập nhật giao diện ngay lập tức (Optimistic UI) mà KHÔNG CẦN double click hay reload trang!
        this.dinos = (this.dinos || []).filter(d => String(d.id) !== String(id));
        this.updateSlotsBadge();
        this.displayDinos(this.dinos, this.currentMode);

        // Cập nhật ngay banner active dino
        this.renderActiveDino();

        // Đồng bộ ngầm lại sau 1s để đảm bảo khớp dữ liệu với server
        setTimeout(() => this.silentRefresh(), 1000);
      } else {
        const errMsg = data.message || "Rút khủng long thất bại! Vui lòng thử lại.";
        if (window.App && window.App.showToast) {
          window.App.showToast(`⚠️ ${errMsg}`, "error");
        } else {
          alert(`⚠️ ${errMsg}`);
        }
        if (btn) {
          btn.innerHTML = '⚡ Rút Dino';
          btn.style.opacity = '1';
        }
      }
    } catch (e) {
      if (window.App && window.App.showToast) {
        window.App.showToast("⚠️ Lỗi kết nối khi rút khủng long! Vui lòng thử lại.", "error");
      }
      if (btn) {
        btn.innerHTML = '⚡ Rút Dino';
        btn.style.opacity = '1';
      }
    } finally {
      this.isSpawning = false;
      allSpawnBtns.forEach(b => { b.disabled = false; });
    }
  },



  storeCountdownTimer: null,

  isStoring: false,



  cancelStore() {

    if (this.storeCountdownTimer) {

      clearInterval(this.storeCountdownTimer);

      this.storeCountdownTimer = null;

    }

    this.isStoring = false;

    const btnStore = document.getElementById('garage-btn-store') || document.querySelector('.btn-garage-store');

    const btnCancel = document.getElementById('garage-btn-cancel-store');

    const btnSlay = document.getElementById('garage-btn-slay');



    if (btnStore) {

      btnStore.textContent = "📥 Cất Vào Gara";

      btnStore.disabled = false;

      btnStore.style.background = "";

    }

    if (btnCancel) btnCancel.style.display = "none";

    if (btnSlay) btnSlay.style.display = "inline-block";

    App.showToast("Đã hủy cất dino");

  },



  async actionStore() {

    if (this.isStoring) return;



    const user = JSON.parse(localStorage.getItem('steam_user') || 'null');

    const steamId = user ? user.steamId : '76561199259679997';



    const btnStore = document.getElementById('garage-btn-store') || document.querySelector('.btn-garage-store');

    const btnCancel = document.getElementById('garage-btn-cancel-store');

    const btnSlay = document.getElementById('garage-btn-slay');



    try {

      if (btnStore) {

        btnStore.textContent = "⏳ Đang kiểm tra...";

        btnStore.disabled = true;

      }



      // Bước 1: Gửi step: "start" lên server để xác nhận trạng thái trực tuyến

      const resStart = await fetch('/api/server/garage/store', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ steam_id: steamId, step: 'start' })

      });

      const dataStart = await resStart.json();



      if (!dataStart.ok && !dataStart.success) {

        if (btnStore) {

          btnStore.textContent = "📥 Cất Vào Gara";

          btnStore.disabled = false;

        }

        App.showToast("Thất bại");

        return;

      }



      // Bước 2: Bắt đầu đếm ngược 30 giây (đứng yên trong game)

      this.isStoring = true;

      let remaining = dataStart.delaySec || 30;



      if (btnCancel) btnCancel.style.display = "inline-block";

      if (btnSlay) btnSlay.style.display = "none";



      if (btnStore) {

        btnStore.textContent = `⏳ Cất sau ${remaining}s (Đứng yên)...`;

        btnStore.disabled = true;

        btnStore.style.background = "linear-gradient(135deg, #f59e0b, #d97706)";

      }



      await new Promise((resolve) => {

        this.storeCountdownTimer = setInterval(() => {

          remaining--;

          if (remaining > 0) {

            if (btnStore) {

              btnStore.textContent = `⏳ Cất sau ${remaining}s (Đứng yên)...`;

            }

          } else {

            clearInterval(this.storeCountdownTimer);

            this.storeCountdownTimer = null;

            resolve();

          }

        }, 1000);

      });



      // Nếu người chơi bấm Hủy trong lúc đếm ngược 30s

      if (!this.isStoring) return;



      if (btnCancel) btnCancel.style.display = "none";

      if (btnStore) {

        btnStore.textContent = "⏳ Đang cất vào Gara...";

        btnStore.style.background = "";

      }



      // Bước 3: Đã hết 30 giây an toàn -> Gọi API chính thức để cất dino vào Gara

      const resFinalize = await fetch('/api/server/garage/store', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ steam_id: steamId, step: 'finalize' })

      });

      const dataFinal = await resFinalize.json();



      this.isStoring = false;

      if (btnStore) {

        btnStore.textContent = "📥 Cất Vào Gara";

        btnStore.disabled = false;

      }

      if (btnSlay) btnSlay.style.display = "inline-block";



      if (dataFinal.ok || dataFinal.success) {

        App.showToast("Thành công");

        setTimeout(() => this.render(), 1200);

      } else {

        App.showToast("Thất bại");

      }

    } catch (e) {

      this.isStoring = false;

      if (btnStore) {

        btnStore.textContent = "📥 Cất Vào Gara";

        btnStore.disabled = false;

        btnStore.style.background = "";

      }

      if (btnCancel) btnCancel.style.display = "none";

      if (btnSlay) btnSlay.style.display = "inline-block";

      App.showToast("Thất bại");

    }

  },



  async actionSlay() {

    const confirmed = confirm("Thao tác này sẽ giết dino hiện tại của bạn trong game. Bạn chắc chứ?");

    if (!confirmed) return;



    const user = JSON.parse(localStorage.getItem('steam_user') || 'null');

    const steamId = user ? user.steamId : '76561199259679997';



    try {

      const res = await fetch('/api/server/garage/slay', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ steam_id: steamId })

      });

      const data = await res.json();

      if (data.success || data.ok) {

        App.showToast("Thành công");

        setTimeout(() => this.render(), 1200);

      } else {

        App.showToast("Thất bại");

      }

    } catch (e) {

      App.showToast("Thất bại");

    }

  },



  async actionRename(id, currentName) {

    const newName = prompt(`Nhập tên mới cho khủng long (hiện tại: ${currentName}):`, currentName !== 'Tyrannosaurus' ? currentName : '');

    if (!newName || !newName.trim()) return;



    try {

      const res = await fetch('/api/server/garage/rename', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ dino_id: id, name: newName.trim() })

      });

      const data = await res.json();

      if (data.success) {

        App.showToast("Thành công");

        this.render();

      } else {

        App.showToast("Thất bại");

      }

    } catch (e) {

      App.showToast("Thất bại");

    }

  },

  async actionDelete(id, name) {
    const displayName = name || "khủng long này";
    const confirmed = confirm(`⚠️ CẢNH BÁO XÓA KHỦNG LONG:\n\nBạn có chắc chắn muốn XÓA VĨNH VIỄN ${displayName} khỏi Gara không?\n\nThao tác này sẽ loại bỏ vĩnh viễn khủng long khỏi Gara và KHÔNG THỂ HOÀN TÁC!`);
    if (!confirmed) return;

    const user = JSON.parse(localStorage.getItem("steam_user") || "null");
    const steamId = user ? user.steamId : "";

    // Ghi nhận xóa vĩnh viễn ngay lập tức trên LocalStorage & loại bỏ khỏi màn hình
    this.addDeletedDino(id);
    this.dinos = (this.dinos || []).filter(d => String(d.id) !== String(id));
    const slotBadge = document.getElementById('garage-slots-badge');
    if (slotBadge) {
      slotBadge.textContent = `${this.dinos.length} / ${this.slotsTotal} Khủng Long`;
    }
    this.displayDinos(this.dinos, this.currentMode);
    App.showToast("⏳ Đang xử lý xóa vĩnh viễn khủng long khỏi server...");

    try {
      const res = await fetch("/api/server/garage/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dino_id: id, steam_id: steamId })
      });
      const data = await res.json();
      if (data.ok || data.success) {
        App.showToast("✅ Đã xóa vĩnh viễn khủng long khỏi Gara thành công!");
      } else {
        App.showToast("✅ Đã loại bỏ khủng long khỏi Gara thành công!");
      }
    } catch (e) {
      console.error("Lỗi gửi yêu cầu xóa dino:", e);
      App.showToast("✅ Đã loại bỏ khủng long khỏi Gara!");
    }
  },


  MUTATION_DICT: {
    "Hemomania": { name: "Cuồng Huyết", icon: "🩸", desc: "Tăng mạnh lực cắn và tốc độ khi tấn công mục tiêu đang bị chảy máu." },
    "Osteosclerosis": { name: "Xương Cốt Thép", icon: "🦴", desc: "Tăng mật độ và độ cứng xương, giảm tỷ lệ gãy chân và thời gian choáng." },
    "Epidermal Fibrosis": { name: "Da Xơ Hóa", icon: "🛡️", desc: "Lớp da dày sừng hóa bảo vệ, giảm đáng kể sát thương vật lý nhận vào." },
    "Gastronomic Regeneration": { name: "Hấp Thụ Nhanh", icon: "🧬", desc: "Hồi phục máu và thể lực nhanh chóng sau khi ăn no thức ăn phù hợp." },
    "Photosynthetic Regeneration": { name: "Quang Hợp Hồi Phục", icon: "🌱", desc: "Tăng tốc độ tự hồi phục sức khỏe khi đứng dưới ánh nắng ban ngày." },
    "Photosynthetic Tissue": { name: "Mô Quang Hợp", icon: "🌿", desc: "Giảm tốc độ tiêu hao thức ăn và tăng trao đổi chất khi có ánh nắng." },
    "Multichambered Lungs": { name: "Phổi Đa Ngăn", icon: "🫁", desc: "Tăng dung tích phổi, nín thở dưới nước lâu hơn và tăng độ bền thể lực." },
    "Sustained Hydration": { name: "Duy Trì Độ Ẩm", icon: "💧", desc: "Giảm tốc độ tụt nước, tăng khả năng sống sót trong môi trường khô cằn." },
    "Enhanced Digestion": { name: "Tăng Cường Tiêu Hóa", icon: "⚡", desc: "Hấp thụ tối đa 3 loại dưỡng chất giúp đẩy nhanh tốc độ phát triển." },
    "Efficient Digestion": { name: "Tiêu Hóa Hiệu Quả", icon: "🌾", desc: "Giảm lượng thức ăn tiêu hao khi chạy nhanh và săn mồi liên tục." },
    "Xerocole Adaptation": { name: "Thích Nghi Sa Mạc", icon: "🏜️", desc: "Giảm mất nước cực mạnh, tăng khả năng chịu nhiệt dưới thời tiết khắc nghiệt." },
    "Tactile Endurance": { name: "Sức Bền Xúc Giác", icon: "💪", desc: "Tối ưu hóa cơ bắp, giảm tiêu hao thể lực khi chạy nước rút và bật nhảy." },
    "Nocturnal": { name: "Thích Nghi Đêm", icon: "🌙", desc: "Tăng tầm nhìn đêm Night Vision sắc nét và tăng tốc độ di chuyển khi trời tối." },
    "Social Behavior": { name: "Tập Tính Bầy Đàn", icon: "🐾", desc: "Tăng chỉ số phòng thủ và phục hồi khi ở gần các cá thể cùng loài." },
    "Hypervigilance": { name: "Cảnh Giác Cao Độ", icon: "👁️", desc: "Tăng tầm ngửi mùi thức ăn và phát hiện kẻ săn mồi rình rập từ xa." },
    "Enlarged Meniscus": { name: "Sụn Chêm Phóng Đại", icon: "🦵", desc: "Khớp chân dẻo dai, giảm sát thương khi rơi từ vách đá cao và nhảy xa hơn." },
    "Cellular Regeneration": { name: "Tái Tạo Tế Bào", icon: "🩸", desc: "Tự động khép miệng vết thương và cầm máu với tốc độ vượt trội." },
    "Accelerated Prey Drive": { name: "Tăng Tốc Săn Mồi", icon: "⚡", desc: "Tăng tốc độ bứt phá khi đuổi theo con mồi hoặc khủng long bị thương." },
    "Reniculate Kidneys": { name: "Thận Hình Lựu", icon: "🫘", desc: "Lọc độc tố hiệu quả, giảm mạnh tác động của nọc độc Troodon và vi khuẩn." },
    "Truculency": { name: "Hung Hãn Chiến Đấu", icon: "⚔️", desc: "Tăng sát thương chí mạng khi lượng máu xuống dưới mức báo động." },
    "Congenital Hypoalgesia": { name: "Giảm Đau Bẩm Sinh", icon: "🛡️", desc: "Bỏ qua trạng thái đi khập khiễng do đau đớn, giữ vững phản xạ chiến đấu." },
    "Hypermetabolic Inanition": { name: "Đổi Đói Lấy Sức Mạnh", icon: "🍖", desc: "Kích phát tiềm năng cơ bắp tối đa đổi lấy tốc độ tiêu hao dạ dày." },
    "Wader": { name: "Lội Nước Nhanh", icon: "🌊", desc: "Giảm lực cản của nước nông và bùn lầy, di chuyển thanh thoát qua đầm lầy." },
    "Hydrodynamic": { name: "Thủy Động Lực", icon: "🐬", desc: "Cơ thể thuôn mượt, tăng tốc độ bơi tối đa và tăng khả năng cơ động dưới nước." },
    "Hydroregenerative": { name: "Hồi Phục Thủy Sinh", icon: "💧", desc: "Hồi phục vết thương nhanh hơn đáng kể khi ngâm mình dưới dòng nước mát." },
    "Cannibalistic": { name: "Đồng Loại Tương Tàn", icon: "💀", desc: "Có thể ăn thịt đồng loại mà không phải chịu hình phạt co giật hay trúng độc." },
    "Hematophagy": { name: "Hút Máu Hồi Phục", icon: "🩸", desc: "Hồi phục một lượng sinh lực dựa trên lượng sát thương gây ra cho đối thủ." },
    "Featherweight": { name: "Nhẹ Như Lông Hồng", icon: "🪶", desc: "Giảm trọng lượng cơ thể giúp tiếng bước chân trở nên êm ái, khó bị phát hiện." },
    "Submerged Optical Retention": { name: "Mắt Thủy Cung", icon: "👁️", desc: "Nhìn rõ ràng dưới đáy hồ sâu tăm tối mà không bị mờ nhòe." }
  },

  showMutationsModal(dinoId) {
    const dino = (this.dinos || []).find(d => String(d.id) === String(dinoId));
    if (!dino) {
      App.showToast("⚠️ Không tìm thấy thông tin khủng long!");
      return;
    }

    const modal = document.getElementById("dino-mutations-modal");
    const titleEl = document.getElementById("mut-modal-dino-title");
    const subEl = document.getElementById("mut-modal-dino-sub");
    const bodyEl = document.getElementById("mut-modal-body");
    if (!modal || !bodyEl) return;

    const displayName = dino.name ? `${dino.name} (${dino.species})` : dino.species;
    if (titleEl) titleEl.textContent = `🧬 Đột Biến Gen - ${displayName}`;
    if (subEl) subEl.textContent = `Loài: ${dino.species} • Giai đoạn: ${dino.stage || "Adult"} (${dino.growth_percent}%) • Giới tính: ${dino.gender}`;

    const slots = dino.mutationSlots || {};
    const activeMut = (slots.active && slots.active.length > 0) ? slots.active : (dino.mutations || []);
    const parentMut = slots.parent || [];
    const elderAMut = slots.elderA || [];
    const elderBMut = slots.elderB || [];

    const dict = this.MUTATION_DICT;

    const renderSlotItem = (mutName, slotIndex, typeColor, typeBadge) => {
      const isNone = !mutName || mutName === "None" || String(mutName).trim() === "";
      if (isNone) {
        return `
          <div class="mutation-slot-card slot-empty">
            <div class="slot-head">
              <span class="slot-badge" style="background: rgba(255,255,255,0.06); color: #9ca3af; border: 1px solid rgba(255,255,255,0.1);">Slot ${slotIndex} • ${typeBadge}</span>
              <span style="font-size: 0.72rem; color: #6b7280; font-weight: 600;">Chưa kích hoạt</span>
            </div>
            <div class="slot-empty-text">--- Trống (None) ---</div>
          </div>
        `;
      }
      const info = dict[mutName] || { name: mutName, icon: "🧬", desc: "Đột biến gen đặc trưng của The Isle: Evrima." };
      return `
        <div class="mutation-slot-card slot-active" style="border-left: 3px solid ${typeColor};">
          <div class="slot-head">
            <span class="slot-badge" style="background: ${typeColor}22; color: ${typeColor}; border: 1px solid ${typeColor}55;">Slot ${slotIndex} • ${typeBadge}</span>
            <span class="slot-status-active" style="color: ${typeColor};">● Đã Kích Hoạt</span>
          </div>
          <div class="slot-title">
            <span class="slot-icon">${info.icon}</span>
            <div style="min-width: 0;">
              <div class="slot-main-name">${info.name}</div>
              <div class="slot-raw-name">${mutName}</div>
            </div>
          </div>
          <div class="slot-desc">${info.desc}</div>
        </div>
      `;
    };

    const validActive = activeMut.filter(m => m && m !== "None" && String(m).trim() !== "");
    const validParent = parentMut.filter(m => m && m !== "None" && String(m).trim() !== "");
    const validElderA = elderAMut.filter(m => m && m !== "None" && String(m).trim() !== "");
    const validElderB = elderBMut.filter(m => m && m !== "None" && String(m).trim() !== "");
    const totalValid = validActive.length + validParent.length + validElderA.length + validElderB.length;

    let html = `
      <div class="mut-total-badge">
        <span>📊 Tổng số đột biến gen đã cộng: <b style="color: #10b981; font-size: 1.05rem;">${totalValid}</b> đột biến</span>
        <span style="font-size: 0.78rem; color: #94a3b8;">Đồng bộ 100% từ máy chủ game IslePilot</span>
      </div>

      <!-- 1. ACTIVE MUTATIONS (4 SLOTS) -->
      <div class="mut-group-section">
        <div class="mut-group-title" style="color: #10b981;">
          <span>⚡ Đột Biến Đang Kích Hoạt (Active Mutations)</span>
          <span class="mut-count-pill" style="border: 1px solid rgba(16,185,129,0.3); color: #10b981;">${validActive.length}/4</span>
        </div>
        <div class="mut-slots-grid">
          ${[1, 2, 3, 4].map(i => renderSlotItem(activeMut[i - 1], i, "#10b981", "Active")).join("")}
        </div>
      </div>

      <!-- 2. PARENT MUTATIONS (4 SLOTS) -->
      <div class="mut-group-section">
        <div class="mut-group-title" style="color: #c084fc;">
          <span>🧬 Đột Biến Di Truyền Bố Mẹ (Parent Mutations)</span>
          <span class="mut-count-pill" style="border: 1px solid rgba(192,132,252,0.3); color: #c084fc;">${validParent.length}/4</span>
        </div>
        <div class="mut-slots-grid">
          ${[1, 2, 3, 4].map(i => renderSlotItem(parentMut[i - 1], i, "#c084fc", "Parent")).join("")}
        </div>
      </div>

      <!-- 3. ELDER A & B MUTATIONS (8 SLOTS) -->
      <div class="mut-group-section">
        <div class="mut-group-title" style="color: #fbbf24;">
          <span>👑 Đột Biến Trưởng Lão (Elder A & B Mutations)</span>
          <span class="mut-count-pill" style="border: 1px solid rgba(251,191,36,0.3); color: #fbbf24;">${validElderA.length + validElderB.length}/8</span>
        </div>
        <div class="mut-slots-grid">
          ${[1, 2, 3, 4].map(i => renderSlotItem(elderAMut[i - 1], i, "#fbbf24", "Elder A")).join("")}
          ${[1, 2, 3, 4].map(i => renderSlotItem(elderBMut[i - 1], i + 4, "#f59e0b", "Elder B")).join("")}
        </div>
      </div>
    `;

    bodyEl.innerHTML = html;
    modal.classList.add("active");
  },

  closeMutationsModal() {
    const modal = document.getElementById("dino-mutations-modal");
    if (modal) modal.classList.remove("active");
  }

};

