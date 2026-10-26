// Module Quản lý Gara Khủng Long (IslePilot Dino Garage)
const Garage = {
  dinos: [],
  slotsTotal: 5,
  currentMode: 'all',

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

  async render() {
    this.renderActiveDino();
    const container = document.getElementById('garage-container');
    if (!container) return;

    const user = JSON.parse(localStorage.getItem('steam_user') || 'null');
    const garageUrl = user ? `/api/server/garage?steam_id=${user.steamId}` : '/api/server/garage';

    let data = null;
    try {
      const res = await fetch(garageUrl);
      data = await res.json();
    } catch (e) {
      console.warn("Không thể tải Gara:", e);
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

    this.dinos = data.dinos;
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

          <!-- Ô Đột Biến Gen Từ Server -->
          ${validMutations.length > 0 ? `
            <div class="dino-mutations-box">
              <div class="mutations-header">🧬 Đột Biến Gen (${validMutations.length}):</div>
              <div class="mutations-list">
                ${validMutations.map(m => {
                  const dict = {
                    "Hemomania": { name: "Cuồng Huyết (Hemomania)", icon: "🩸" },
                    "Osteosclerosis": { name: "Xương Cốt Thép (Osteosclerosis)", icon: "🦴" },
                    "Epidermal Fibrosis": { name: "Da Xơ Hóa (Epidermal Fibrosis)", icon: "🛡️" },
                    "Gastronomic Regeneration": { name: "Hấp Thụ Nhanh (Gastronomic Regeneration)", icon: "🧬" },
                    "Photosynthetic Regeneration": { name: "Quang Hợp Hồi Phục (Photosynthetic)", icon: "🌱" },
                    "Accelerated Prey Drive": { name: "Tăng Tốc Săn Mồi (Prey Drive)", icon: "⚡" },
                    "Nocturnal": { name: "Thích Nghi Đêm (Nocturnal)", icon: "🌙" },
                    "Social Behavior": { name: "Tập Tính Bầy Đàn (Social)", icon: "🐾" },
                    "Congenital Hypoalgesia": { name: "Giảm Đau Bẩm Sinh", icon: "🛡️" }
                  };
                  const item = dict[m] || { name: m, icon: "🧬" };
                  return `<div class="mutation-tag"><span>${item.icon} <b>${item.name}</b></span> <span style="color: var(--accent); font-size: 0.7rem;">Kích hoạt</span></div>`;
                }).join('')}
              </div>
            </div>
          ` : ''}

          <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 14px;">
            Cất lúc: <b style="color: #e5e7eb;">${this.formatStoredTime(dino.stored_at || dino.parked_at)}</b>
          </div>

          <div class="dino-actions">
            <button class="btn-spawn" onclick="Garage.actionSpawn('${dino.id}', '${dino.species}')">
              ⚡ Rút Dino vào game
            </button>
            <button class="btn-store" onclick="Garage.actionRename('${dino.id}', '${dino.name || dino.species}')">
              ✏️ Đổi Tên
            </button>
          </div>
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

  async actionSpawn(id, species) {
    const user = JSON.parse(localStorage.getItem('steam_user') || 'null');
    const steamId = user ? user.steamId : '76561199259679997';

    try {
      const res = await fetch('/api/server/garage/spawn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dino_id: id, species: species, steam_id: steamId })
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
  }
};
