/**
 * 3MGAMING - Module Check Dame / Combat Log thời gian thực
 * Cho phép người chơi tự tra cứu lịch sử sát thương gây ra và nhận vào từ IslePilot
 */

const DamageChecker = {
  activeTab: 'all', // 'all', 'outgoing', 'incoming', 'kills'
  currentSteamId: '',
  searchQuery: '',
  hitsData: [],
  statsData: {
    totalHits: 0,
    damageDealt: 0,
    damageReceived: 0,
    kills: 0
  },
  isLoading: false,
  autoRefreshTimer: null,

  init() {
    // Tự động lấy steam_id từ người dùng đang đăng nhập nếu có
    const user = JSON.parse(localStorage.getItem('steam_user') || 'null');
    if (user && user.steamId) {
      this.currentSteamId = user.steamId;
    }
  },

  async render() {
    const container = document.getElementById('view-damage');
    if (!container) return;

    if (!this.currentSteamId) {
      const user = JSON.parse(localStorage.getItem('steam_user') || 'null');
      if (user && user.steamId) {
        this.currentSteamId = user.steamId;
      }
    }

    container.innerHTML = `
      <div class="damage-view-wrapper" style="max-width: 1300px; margin: 0 auto; padding: 20px 10px;">
        <!-- Header Banner -->
        <div class="card" style="margin-bottom: 24px; background: linear-gradient(135deg, rgba(255, 42, 133, 0.12) 0%, rgba(18, 14, 24, 0.85) 100%); border: 1px solid rgba(255, 42, 133, 0.4); box-shadow: 0 0 25px rgba(255, 42, 133, 0.15);">
          <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 16px;">
            <div>
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                <span style="font-size: 2rem;">⚔️</span>
                <h1 style="font-size: 1.6rem; font-weight: 800; color: #fff; text-shadow: 0 0 12px rgba(255, 42, 133, 0.5); margin: 0;">
                  NHẬT KÝ CHIẾN ĐẤU & CHECK DAME
                </h1>
                <span style="background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); padding: 3px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 5px;">
                  <span style="width: 7px; height: 7px; background: #34d399; border-radius: 50%; display: inline-block; box-shadow: 0 0 8px #34d399;"></span> LIVE ISLEPILOT
                </span>
              </div>
              <p style="color: var(--text-muted); font-size: 0.92rem; margin: 0;">
                Tra cứu chi tiết từng đòn đánh, sát thương gây ra và nhận vào, lượng máu trừ và các pha kết liễu trong server.
              </p>
            </div>
            
            <div style="display: flex; align-items: center; gap: 10px;">
              <button id="btn-damage-my-steam" class="btn-primary" style="padding: 9px 16px; font-size: 0.88rem; display: flex; align-items: center; gap: 6px; cursor: pointer;">
                <span>🎯</span> Của tôi
              </button>
              <button id="btn-damage-refresh" class="btn-secondary" style="padding: 9px 16px; font-size: 0.88rem; display: flex; align-items: center; gap: 6px; cursor: pointer;">
                <span>🔄</span> Làm mới
              </button>
            </div>
          </div>

          <!-- Thanh Tìm Kiếm & Tra Cứu Steam ID -->
          <div style="margin-top: 20px; padding-top: 18px; border-top: 1px solid rgba(255, 255, 255, 0.08); display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
            <div style="flex: 1; min-width: 260px; position: relative;">
              <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 1rem; color: var(--text-muted);">🔍</span>
              <input type="text" id="damage-search-input" value="${this.currentSteamId || ''}" 
                placeholder="Nhập Steam ID (17 số) hoặc tên người chơi, loài khủng long, kỹ năng..." 
                style="width: 100%; padding: 11px 12px 11px 38px; background: rgba(10, 8, 14, 0.8); border: 1px solid var(--border-color); border-radius: 8px; color: #fff; font-size: 0.92rem; outline: none; transition: border-color 0.2s;"
              />
            </div>
            <button id="btn-damage-search" class="btn-primary" style="padding: 11px 22px; font-size: 0.92rem; font-weight: 700; cursor: pointer;">
              Tra cứu
            </button>
            <button id="btn-damage-clear" class="btn-secondary" style="padding: 11px 16px; font-size: 0.92rem; cursor: pointer;" title="Xem toàn server">
              Toàn server
            </button>
          </div>

          <!-- Trạng thái đang xem -->
          <div id="damage-current-target-label" style="margin-top: 12px; font-size: 0.85rem; color: var(--text-muted);">
            ${this.getTargetLabelHtml()}
          </div>
        </div>

        <!-- Thẻ thống kê nhanh (Stats Cards) -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px;">
          <div class="card" style="padding: 16px 20px; background: rgba(18, 14, 24, 0.75); border: 1px solid rgba(255, 255, 255, 0.08); display: flex; align-items: center; gap: 16px;">
            <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(255, 255, 255, 0.06); display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
              💥
            </div>
            <div>
              <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Tổng đòn đánh</div>
              <div id="stat-total-hits" style="font-size: 1.5rem; font-weight: 800; color: #fff;">--</div>
            </div>
          </div>

          <div class="card" style="padding: 16px 20px; background: rgba(18, 14, 24, 0.75); border: 1px solid rgba(16, 185, 129, 0.3); display: flex; align-items: center; gap: 16px;">
            <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(16, 185, 129, 0.15); color: #34d399; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
              ⚔️
            </div>
            <div>
              <div style="font-size: 0.8rem; color: #34d399; text-transform: uppercase; font-weight: 600;">Sát thương gây ra</div>
              <div id="stat-dmg-dealt" style="font-size: 1.5rem; font-weight: 800; color: #34d399;">--</div>
            </div>
          </div>

          <div class="card" style="padding: 16px 20px; background: rgba(18, 14, 24, 0.75); border: 1px solid rgba(239, 68, 68, 0.3); display: flex; align-items: center; gap: 16px;">
            <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(239, 68, 68, 0.15); color: #f87171; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
              🛡️
            </div>
            <div>
              <div style="font-size: 0.8rem; color: #f87171; text-transform: uppercase; font-weight: 600;">Sát thương nhận vào</div>
              <div id="stat-dmg-received" style="font-size: 1.5rem; font-weight: 800; color: #f87171;">--</div>
            </div>
          </div>

          <div class="card" style="padding: 16px 20px; background: rgba(18, 14, 24, 0.75); border: 1px solid rgba(245, 158, 11, 0.3); display: flex; align-items: center; gap: 16px;">
            <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(245, 158, 11, 0.15); color: #fbbf24; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
              💀
            </div>
            <div>
              <div style="font-size: 0.8rem; color: #fbbf24; text-transform: uppercase; font-weight: 600;">Mạng hạ gục (Kills)</div>
              <div id="stat-kills" style="font-size: 1.5rem; font-weight: 800; color: #fbbf24;">--</div>
            </div>
          </div>
        </div>

        <!-- Thanh phân loại Tabs (All / Outgoing / Incoming / Kills) -->
        <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="display: flex; gap: 8px; flex-wrap: wrap;" id="damage-filter-tabs">
            <button class="damage-tab-btn ${this.activeTab === 'all' ? 'active' : ''}" data-type="all" style="padding: 8px 18px; border-radius: 20px; font-size: 0.88rem; font-weight: 700; cursor: pointer; transition: all 0.2s;">
              📋 Tất cả nhật ký
            </button>
            <button class="damage-tab-btn ${this.activeTab === 'outgoing' ? 'active' : ''}" data-type="outgoing" style="padding: 8px 18px; border-radius: 20px; font-size: 0.88rem; font-weight: 700; cursor: pointer; transition: all 0.2s;">
              ⚔️ Đã gây ra (Outgoing)
            </button>
            <button class="damage-tab-btn ${this.activeTab === 'incoming' ? 'active' : ''}" data-type="incoming" style="padding: 8px 18px; border-radius: 20px; font-size: 0.88rem; font-weight: 700; cursor: pointer; transition: all 0.2s;">
              🛡️ Đã nhận (Incoming)
            </button>
            <button class="damage-tab-btn ${this.activeTab === 'kills' ? 'active' : ''}" data-type="kills" style="padding: 8px 18px; border-radius: 20px; font-size: 0.88rem; font-weight: 700; cursor: pointer; transition: all 0.2s;">
              💀 Đòn kết liễu (Kills)
            </button>
          </div>

          <div style="font-size: 0.85rem; color: var(--text-muted);" id="damage-records-count">
            Đang tải dữ liệu...
          </div>
        </div>

        <!-- Bảng danh sách đòn đánh -->
        <div class="card" style="padding: 0; overflow: hidden; background: rgba(18, 14, 24, 0.85); border: 1px solid var(--border-color);">
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.88rem;">
              <thead>
                <tr style="background: rgba(255, 42, 133, 0.08); border-bottom: 1px solid rgba(255, 42, 133, 0.2); color: var(--text-highlight); text-transform: uppercase; font-size: 0.78rem; letter-spacing: 0.5px;">
                  <th style="padding: 14px 16px;">Thời gian</th>
                  <th style="padding: 14px 16px;">Kẻ tấn công (Attacker)</th>
                  <th style="padding: 14px 16px;">Kỹ năng & Khoảng cách</th>
                  <th style="padding: 14px 16px; text-align: center;">Sát thương</th>
                  <th style="padding: 14px 16px;">Nạn nhân (Victim)</th>
                  <th style="padding: 14px 16px;">Máu trước ➔ sau</th>
                  <th style="padding: 14px 16px; text-align: center;">Kết quả</th>
                </tr>
              </thead>
              <tbody id="damage-hits-tbody">
                <tr>
                  <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted);">
                    <div style="font-size: 1.5rem; margin-bottom: 8px;">⏳</div>
                    Đang đồng bộ dữ liệu chiến đấu từ IslePilot...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
    await this.fetchAndRender();
  },

  getTargetLabelHtml() {
    if (this.currentSteamId && this.currentSteamId.length >= 15) {
      const user = JSON.parse(localStorage.getItem('steam_user') || 'null');
      const isMyAccount = user && user.steamId === this.currentSteamId;
      return `
        <span style="color: #34d399; font-weight: 600;">
          ${isMyAccount ? '👤 Tài khoản của bạn' : '🎯 Đang lọc theo Steam ID'}:
        </span> 
        <code style="background: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 4px; color: #fff;">${this.currentSteamId}</code>
        ${isMyAccount ? `<span style="color: var(--accent-gold); font-weight: bold; margin-left: 6px;">(${user.name})</span>` : ''}
      `;
    }
    return `<span style="color: var(--text-muted);">🌐 Đang hiển thị lịch sử chiến đấu toàn server (100 đòn đánh mới nhất). Nhập Steam ID để tra cứu riêng.</span>`;
  },

  bindEvents() {
    // Nút tab lọc
    const tabBtns = document.querySelectorAll('.damage-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        tabBtns.forEach(b => {
          b.classList.remove('active');
          b.style.background = 'rgba(255,255,255,0.05)';
          b.style.color = 'var(--text-muted)';
          b.style.borderColor = 'transparent';
        });
        btn.classList.add('active');
        btn.style.background = 'var(--accent)';
        btn.style.color = '#fff';
        btn.style.borderColor = 'var(--accent)';

        this.activeTab = btn.getAttribute('data-type');
        this.fetchAndRender();
      });
    });

    // Style ban đầu cho nút tab
    this.updateTabStyles();

    // Nút làm mới
    const refreshBtn = document.getElementById('btn-damage-refresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.fetchAndRender();
      });
    }

    // Nút "Của tôi"
    const mySteamBtn = document.getElementById('btn-damage-my-steam');
    if (mySteamBtn) {
      mySteamBtn.addEventListener('click', () => {
        const user = JSON.parse(localStorage.getItem('steam_user') || 'null');
        if (user && user.steamId) {
          this.currentSteamId = user.steamId;
          const input = document.getElementById('damage-search-input');
          if (input) input.value = user.steamId;
          this.activeTab = 'all';
          this.fetchAndRender();
        } else {
          if (window.App && window.App.showToast) {
            window.App.showToast('Vui lòng đăng nhập Steam ở góc trên để tự động nhận diện tài khoản!', 'warning');
          } else {
            alert('Vui lòng đăng nhập Steam để tự động nhận diện tài khoản!');
          }
        }
      });
    }

    // Nút tìm kiếm
    const searchBtn = document.getElementById('btn-damage-search');
    const searchInput = document.getElementById('damage-search-input');
    if (searchBtn && searchInput) {
      const executeSearch = () => {
        const val = searchInput.value.trim();
        if (val.match(/^\d{15,20}$/)) {
          this.currentSteamId = val;
          this.searchQuery = '';
        } else {
          this.searchQuery = val;
        }
        this.fetchAndRender();
      };

      searchBtn.addEventListener('click', executeSearch);
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') executeSearch();
      });
    }

    // Nút toàn server
    const clearBtn = document.getElementById('btn-damage-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.currentSteamId = '';
        this.searchQuery = '';
        const input = document.getElementById('damage-search-input');
        if (input) input.value = '';
        this.activeTab = 'all';
        this.fetchAndRender();
      });
    }
  },

  updateTabStyles() {
    const tabBtns = document.querySelectorAll('.damage-tab-btn');
    tabBtns.forEach(btn => {
      const type = btn.getAttribute('data-type');
      if (type === this.activeTab) {
        btn.style.background = 'var(--accent)';
        btn.style.color = '#fff';
        btn.style.border = '1px solid var(--accent)';
      } else {
        btn.style.background = 'rgba(255,255,255,0.05)';
        btn.style.color = 'var(--text-muted)';
        btn.style.border = '1px solid rgba(255,255,255,0.1)';
      }
    });
  },

  async fetchAndRender() {
    if (this.isLoading) return;
    this.isLoading = true;

    const tbody = document.getElementById('damage-hits-tbody');
    const countEl = document.getElementById('damage-records-count');
    const targetLabel = document.getElementById('damage-current-target-label');
    if (targetLabel) targetLabel.innerHTML = this.getTargetLabelHtml();

    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 35px; color: var(--text-muted);">
            <div style="display: inline-block; animation: spin 1s infinite linear; font-size: 1.4rem;">🔄</div>
            <div style="margin-top: 8px;">Đang tải nhật ký chiến đấu mới nhất...</div>
          </td>
        </tr>
      `;
    }

    let url = `/api/combat-log?type=${this.activeTab}`;
    if (this.currentSteamId && this.currentSteamId.length >= 15) {
      url += `&steam_id=${encodeURIComponent(this.currentSteamId)}`;
    }
    if (this.searchQuery) {
      url += `&search=${encodeURIComponent(this.searchQuery)}`;
    }

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (!data.ok && !Array.isArray(data.hits)) {
        throw new Error(data.error || 'Không thể tải dữ liệu từ máy chủ');
      }

      this.hitsData = data.hits || [];
      this.statsData = data.stats || {
        totalHits: this.hitsData.length,
        damageDealt: 0,
        damageReceived: 0,
        kills: 0
      };

      this.renderStats();
      this.renderHitsTable();

      if (countEl) {
        countEl.innerHTML = `Hiển thị <strong>${this.hitsData.length}</strong> bản ghi chiến đấu`;
      }
    } catch (err) {
      console.error('Lỗi khi tải combat log:', err);
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; padding: 35px; color: #f87171;">
              ⚠️ Lỗi: ${err.message || 'Không thể kết nối máy chủ'}. Hãy thử tải lại.
            </td>
          </tr>
        `;
      }
    } finally {
      this.isLoading = false;
    }
  },

  renderStats() {
    const hitsEl = document.getElementById('stat-total-hits');
    const dealtEl = document.getElementById('stat-dmg-dealt');
    const recvEl = document.getElementById('stat-dmg-received');
    const killsEl = document.getElementById('stat-kills');

    if (hitsEl) hitsEl.textContent = Number(this.statsData.totalHits || 0).toLocaleString();
    if (dealtEl) dealtEl.textContent = Number(this.statsData.damageDealt || 0).toLocaleString() + ' HP';
    if (recvEl) recvEl.textContent = Number(this.statsData.damageReceived || 0).toLocaleString() + ' HP';
    if (killsEl) killsEl.textContent = Number(this.statsData.kills || 0).toLocaleString();
  },

  renderHitsTable() {
    const tbody = document.getElementById('damage-hits-tbody');
    if (!tbody) return;

    if (!this.hitsData || this.hitsData.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 50px 20px; color: var(--text-muted);">
            <div style="font-size: 2.2rem; margin-bottom: 10px;">🛡️</div>
            <div style="font-size: 1.05rem; font-weight: 700; color: #fff;">Chưa có bản ghi chiến đấu nào!</div>
            <div style="font-size: 0.88rem; margin-top: 6px;">Không tìm thấy đòn đánh nào theo bộ lọc hiện tại.</div>
          </td>
        </tr>
      `;
      return;
    }

    const rows = this.hitsData.map(hit => {
      const isOutgoing = hit.isOutgoing;
      const isIncoming = hit.isIncoming;

      let rowBg = 'transparent';
      let borderLeft = 'none';

      if (isOutgoing) {
        rowBg = 'rgba(16, 185, 129, 0.05)';
        borderLeft = '3px solid #10b981';
      } else if (isIncoming) {
        rowBg = 'rgba(239, 68, 68, 0.05)';
        borderLeft = '3px solid #ef4444';
      }

      const timeFormatted = this.formatTime(hit.timestamp);

      // Kẻ tấn công
      const atk = hit.attacker || {};
      const atkIsMe = this.currentSteamId && atk.steamId === this.currentSteamId;

      // Nạn nhân
      const vic = hit.victim || {};
      const vicIsMe = this.currentSteamId && vic.steamId === this.currentSteamId;

      // Badges
      const killedBadge = hit.killed
        ? `<span style="background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.5); padding: 3px 8px; border-radius: 6px; font-weight: 800; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 4px; animation: pulse 2s infinite;">💀 HẠ GỤC</span>`
        : `<span style="background: rgba(255, 255, 255, 0.05); color: var(--text-muted); padding: 3px 8px; border-radius: 6px; font-size: 0.75rem;">🩸 Sát thương</span>`;

      return `
        <tr style="background: ${rowBg}; border-left: ${borderLeft}; border-bottom: 1px solid rgba(255, 255, 255, 0.06); transition: background 0.15s;" onmouseover="this.style.background='rgba(255, 42, 133, 0.06)'" onmouseout="this.style.background='${rowBg}'">
          <!-- Thời gian -->
          <td style="padding: 12px 16px; white-space: nowrap; color: var(--text-muted); font-size: 0.82rem;">
            ${timeFormatted}
          </td>

          <!-- Kẻ tấn công -->
          <td style="padding: 12px 16px;">
            <div style="font-weight: 700; color: ${atkIsMe ? '#34d399' : '#fff'}; display: flex; align-items: center; gap: 6px;">
              ${atkIsMe ? '<span style="color: #34d399;">(Bạn)</span>' : ''}
              <span>${this.escapeHtml(atk.name || 'NPC / Ẩn danh')}</span>
            </div>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">
              <span style="color: var(--accent-gold); font-weight: 600;">${atk.species || 'Khủng long'}</span> 
              • ${atk.growth}% lớn
            </div>
            ${atk.steamId ? `
              <div style="margin-top: 3px;">
                <a href="javascript:void(0)" onclick="DamageChecker.filterBySteamId('${atk.steamId}')" style="font-size: 0.72rem; color: var(--text-muted); text-decoration: none;" title="Bấm để lọc người này">
                  🆔 ${atk.steamId}
                </a>
              </div>
            ` : ''}
          </td>

          <!-- Kỹ năng & Khoảng cách -->
          <td style="padding: 12px 16px;">
            <div style="font-weight: 600; color: #ff70a6;">
              ${this.escapeHtml(hit.ability || 'Tấn công')}
            </div>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">
              📏 Cự ly: <strong>${hit.distance}m</strong>
            </div>
          </td>

          <!-- Sát thương -->
          <td style="padding: 12px 16px; text-align: center;">
            <span style="font-size: 1.05rem; font-weight: 800; color: #f87171; background: rgba(239, 68, 68, 0.12); padding: 4px 10px; border-radius: 6px; border: 1px solid rgba(239, 68, 68, 0.3); display: inline-block;">
              -${Number(hit.damage).toFixed(1)}
            </span>
          </td>

          <!-- Nạn nhân -->
          <td style="padding: 12px 16px;">
            <div style="font-weight: 700; color: ${vicIsMe ? '#f87171' : '#fff'}; display: flex; align-items: center; gap: 6px;">
              ${vicIsMe ? '<span style="color: #f87171;">(Bạn)</span>' : ''}
              <span>${this.escapeHtml(vic.name || 'NPC / Ẩn danh')}</span>
            </div>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">
              <span style="color: var(--accent-gold); font-weight: 600;">${vic.species || 'Khủng long'}</span> 
              • ${vic.growth}% lớn
            </div>
            ${vic.steamId ? `
              <div style="margin-top: 3px;">
                <a href="javascript:void(0)" onclick="DamageChecker.filterBySteamId('${vic.steamId}')" style="font-size: 0.72rem; color: var(--text-muted); text-decoration: none;" title="Bấm để lọc người này">
                  🆔 ${vic.steamId}
                </a>
              </div>
            ` : ''}
          </td>

          <!-- Máu trước -> sau -->
          <td style="padding: 12px 16px; white-space: nowrap;">
            <div style="font-size: 0.84rem; display: flex; align-items: center; gap: 6px;">
              <span style="color: #34d399; font-weight: 600;">${Number(hit.hpBefore).toFixed(0)}</span>
              <span style="color: var(--text-muted);">➔</span>
              <span style="color: ${hit.killed ? '#ef4444' : '#fbbf24'}; font-weight: 700;">${Number(hit.hpAfter).toFixed(0)}</span>
            </div>
            <div style="width: 100%; max-width: 110px; height: 5px; background: rgba(255, 255, 255, 0.1); border-radius: 3px; margin-top: 5px; overflow: hidden;">
              <div style="height: 100%; width: ${Math.max(0, Math.min(100, Math.round((hit.hpAfter / (hit.hpBefore || 1)) * 100)))}%; background: ${hit.killed ? '#ef4444' : '#34d399'};"></div>
            </div>
          </td>

          <!-- Kết quả -->
          <td style="padding: 12px 16px; text-align: center; white-space: nowrap;">
            ${killedBadge}
          </td>
        </tr>
      `;
    }).join('');

    tbody.innerHTML = rows;
  },

  filterBySteamId(steamId) {
    if (!steamId) return;
    this.currentSteamId = steamId;
    this.searchQuery = '';
    const input = document.getElementById('damage-search-input');
    if (input) input.value = steamId;
    this.fetchAndRender();
  },

  formatTime(isoStr) {
    if (!isoStr) return '--:--';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;

      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');

      return `<strong style="color: #fff;">${hours}:${minutes}:${seconds}</strong><br><span style="font-size: 0.72rem;">${day}/${month}</span>`;
    } catch (e) {
      return isoStr;
    }
  },

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
};

window.DamageChecker = DamageChecker;
