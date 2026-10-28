/**
 * 3MGAMING - Đấu Trường PK & Đặt Cược Xu (PvP Arena & System Coin Betting)
 * Đồng bộ thời gian thực với IslePilot API
 */

const Arena = {
  currentTab: 'open', // 'open', 'my_matches', 'history', 'rules'
  matches: [],
  mySteamId: '',
  myBalance: 0,
  isLoading: false,
  autoRefreshTimer: null,

  init() {
    const user = JSON.parse(localStorage.getItem('steam_user') || 'null');
    if (user && (user.steamId || user.steam_id)) {
      this.mySteamId = String(user.steamId || user.steam_id);
    }
  },

  async render() {
    const container = document.getElementById('view-arena');
    if (!container) return;

    this.init();

    container.innerHTML = `
      <div class="arena-wrapper" style="max-width: 1300px; margin: 0 auto; padding: 20px 10px;">
        <!-- Header Banner Đấu Trường -->
        <div class="card" style="margin-bottom: 24px; background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(18, 14, 24, 0.9) 60%, rgba(245, 158, 11, 0.12) 100%); border: 1px solid rgba(239, 68, 68, 0.4); box-shadow: 0 0 30px rgba(239, 68, 68, 0.15);">
          <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 16px;">
            <div>
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                <span style="font-size: 2.2rem; filter: drop-shadow(0 0 10px rgba(239, 68, 68, 0.6));">🥊</span>
                <h1 style="font-size: 1.7rem; font-weight: 800; color: #fff; text-shadow: 0 0 14px rgba(239, 68, 68, 0.6); margin: 0; letter-spacing: 0.5px;">
                  ĐẤU TRƯỜNG PK & ĐẶT CƯỢC XU
                </h1>
                <span style="background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.5); padding: 3px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 5px;">
                  <span style="width: 7px; height: 7px; background: #f87171; border-radius: 50%; display: inline-block; box-shadow: 0 0 8px #f87171;"></span> SÀN ĐẤU SINH TỬ
                </span>
              </div>
              <p style="color: var(--text-muted); font-size: 0.92rem; margin: 0; max-width: 780px;">
                Sàn đấu danh dự 1v1 dành riêng cho các chiến binh khủng long 3MGAMING. Tạo kèo thách đấu, dịch chuyển vào sân đấu, phân định thắng thua qua hệ thống Combat Log và nhận thưởng Xu tự động!
              </p>
            </div>

            <!-- Hành động người chơi & Số dư Xu -->
            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 10px;">
              <div style="background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.4); padding: 8px 16px; border-radius: 10px; display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 1.2rem;">🪙</span>
                <div>
                  <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Số dư của bạn</div>
                  <div id="arena-player-balance" style="font-size: 1.1rem; font-weight: 800; color: #fbbf24;">
                    Đang tải...
                  </div>
                </div>
              </div>

              <button id="btn-arena-create-match" class="btn-primary" style="padding: 10px 18px; font-size: 0.92rem; font-weight: 700; display: flex; align-items: center; gap: 8px; cursor: pointer; background: linear-gradient(135deg, #ef4444 0%, #ff2a85 100%); border: none; box-shadow: 0 0 15px rgba(239, 68, 68, 0.4);">
                <span>➕</span> Tạo Kèo Thách Đấu
              </button>

              <button id="btn-arena-teleport-hub" class="btn-secondary" style="padding: 10px 14px; font-size: 0.88rem; display: flex; align-items: center; gap: 6px; cursor: pointer;" title="Dịch chuyển dino của bạn tới ĐẤU TRƯỜNG">
                <span>🚀</span> Vào Sân Đấu
              </button>

              <button id="btn-arena-refresh" class="btn-secondary" style="padding: 10px 14px; font-size: 0.88rem; cursor: pointer;" title="Làm mới dữ liệu">
                <span>🔄</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Thống Kê Tổng Quan Sàn Đấu (Stats Cards) -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px;">
          <div class="card" style="padding: 16px 20px; background: rgba(18, 14, 24, 0.75); border: 1px solid rgba(255, 255, 255, 0.08); display: flex; align-items: center; gap: 16px;">
            <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(239, 68, 68, 0.15); color: #f87171; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
              🏟️
            </div>
            <div>
              <div style="font-size: 0.78rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Kèo đang mở / chiến đấu</div>
              <div id="stat-arena-active" style="font-size: 1.45rem; font-weight: 800; color: #f87171;">--</div>
            </div>
          </div>

          <div class="card" style="padding: 16px 20px; background: rgba(18, 14, 24, 0.75); border: 1px solid rgba(245, 158, 11, 0.25); display: flex; align-items: center; gap: 16px;">
            <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(245, 158, 11, 0.15); color: #fbbf24; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
              🪙
            </div>
            <div>
              <div style="font-size: 0.78rem; color: #fbbf24; text-transform: uppercase; font-weight: 600;">Tổng Xu đã đặt cược</div>
              <div id="stat-arena-wagered" style="font-size: 1.45rem; font-weight: 800; color: #fbbf24;">--</div>
            </div>
          </div>

          <div class="card" style="padding: 16px 20px; background: rgba(18, 14, 24, 0.75); border: 1px solid rgba(16, 185, 129, 0.25); display: flex; align-items: center; gap: 16px;">
            <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(16, 185, 129, 0.15); color: #34d399; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
              🏆
            </div>
            <div>
              <div style="font-size: 0.78rem; color: #34d399; text-transform: uppercase; font-weight: 600;">Tổng trận PK tổ chức</div>
              <div id="stat-arena-total" style="font-size: 1.45rem; font-weight: 800; color: #34d399;">--</div>
            </div>
          </div>

          <div class="card" style="padding: 16px 20px; background: rgba(18, 14, 24, 0.75); border: 1px solid rgba(59, 130, 246, 0.25); display: flex; align-items: center; gap: 16px;">
            <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(59, 130, 246, 0.15); color: #60a5fa; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
              📍
            </div>
            <div>
              <div style="font-size: 0.78rem; color: #60a5fa; text-transform: uppercase; font-weight: 600;">Địa điểm sân thi đấu</div>
              <div style="font-size: 1.15rem; font-weight: 800; color: #fff;">ĐẤU TRƯỜNG</div>
            </div>
          </div>
        </div>

        <!-- Thanh Tabs Phân Loại Kèo -->
        <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 20px;">
          <div style="display: flex; gap: 8px; flex-wrap: wrap;" id="arena-subtabs">
            <button class="arena-tab-btn ${this.currentTab === 'open' ? 'active' : ''}" data-tab="open" style="padding: 9px 20px; border-radius: 20px; font-size: 0.88rem; font-weight: 700; cursor: pointer; transition: all 0.2s;">
              🏟️ Sàn Đấu Đang Mở
            </button>
            <button class="arena-tab-btn ${this.currentTab === 'my_matches' ? 'active' : ''}" data-tab="my_matches" style="padding: 9px 20px; border-radius: 20px; font-size: 0.88rem; font-weight: 700; cursor: pointer; transition: all 0.2s;">
              ⚔️ Trận PK Của Tôi
            </button>
            <button class="arena-tab-btn ${this.currentTab === 'history' ? 'active' : ''}" data-tab="history" style="padding: 9px 20px; border-radius: 20px; font-size: 0.88rem; font-weight: 700; cursor: pointer; transition: all 0.2s;">
              📜 Lịch Sử & Bảng Vàng
            </button>
            <button class="arena-tab-btn ${this.currentTab === 'rules' ? 'active' : ''}" data-tab="rules" style="padding: 9px 20px; border-radius: 20px; font-size: 0.88rem; font-weight: 700; cursor: pointer; transition: all 0.2s;">
              📖 Luật Đấu & Hướng Dẫn
            </button>
          </div>

          <div style="font-size: 0.85rem; color: var(--text-muted);" id="arena-matches-count">
            Đang tải dữ liệu sàn đấu...
          </div>
        </div>

        <!-- Vùng hiển thị nội dung theo Tab -->
        <div id="arena-tab-content">
          <!-- Sẽ được điền động -->
        </div>

        <!-- Container Modal -->
        <div id="arena-modal-container"></div>
      </div>
    `;

    this.bindEvents();
    this.updateTabStyles();
    await this.fetchData();
    this.startAutoRefresh();
  },

  bindEvents() {
    // Chuyển Tab
    const tabBtns = document.querySelectorAll('.arena-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        this.switchSubTab(tab);
      });
    });

    // Nút làm mới
    const refreshBtn = document.getElementById('btn-arena-refresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.fetchData());
    }

    // Nút Tạo Kèo
    const createBtn = document.getElementById('btn-arena-create-match');
    if (createBtn) {
      createBtn.addEventListener('click', () => this.openCreateMatchModal());
    }

    // Nút Teleport vào Sân Đấu
    const tpBtn = document.getElementById('btn-arena-teleport-hub');
    if (tpBtn) {
      tpBtn.addEventListener('click', () => this.teleportToArena());
    }
  },

  switchSubTab(tab) {
    this.currentTab = tab;
    this.updateTabStyles();
    this.renderCurrentTabContent();
  },

  updateTabStyles() {
    const tabBtns = document.querySelectorAll('.arena-tab-btn');
    tabBtns.forEach(btn => {
      const tab = btn.getAttribute('data-tab');
      if (tab === this.currentTab) {
        btn.classList.add('active');
        btn.style.background = 'linear-gradient(135deg, #ef4444 0%, #ff2a85 100%)';
        btn.style.color = '#fff';
        btn.style.border = '1px solid #ff2a85';
        btn.style.boxShadow = '0 0 12px rgba(239, 68, 68, 0.4)';
      } else {
        btn.classList.remove('active');
        btn.style.background = 'rgba(255, 255, 255, 0.05)';
        btn.style.color = 'var(--text-muted)';
        btn.style.border = '1px solid rgba(255, 255, 255, 0.1)';
        btn.style.boxShadow = 'none';
      }
    });
  },

  startAutoRefresh() {
    this.stopAutoRefresh();
    this.autoRefreshTimer = setInterval(() => {
      const isArenaTab = window.location.hash === '#arena' || document.body.getAttribute('data-current-tab') === 'arena';
      if (isArenaTab) {
        // Chỉ refresh nền nếu modal tạo kèo/đặt cược không mở
        if (!document.getElementById('arena-create-modal') && !document.getElementById('arena-bet-modal')) {
          this.fetchData(true);
        }
      }
    }, 4500);
  },

  stopAutoRefresh() {
    if (this.autoRefreshTimer) {
      clearInterval(this.autoRefreshTimer);
      this.autoRefreshTimer = null;
    }
  },

  async fetchData(isBackground = false) {
    if (this.isLoading && !isBackground) return;
    if (!isBackground) this.isLoading = true;

    try {
      this.init();
      const url = `/api/arena/matches?steam_id=${encodeURIComponent(this.mySteamId || '')}&_t=${Date.now()}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!data.ok) throw new Error(data.error || 'Lỗi tải dữ liệu đấu trường');

      this.matches = data.matches || [];
      this.myBalance = data.my_balance || 0;
      if (!this.mySteamId && data.my_steam_id) {
        this.mySteamId = String(data.my_steam_id);
      }

      // Cập nhật số dư
      const balanceEl = document.getElementById('arena-player-balance');
      if (balanceEl) {
        balanceEl.textContent = `${Number(this.myBalance).toLocaleString()} Xu`;
      }

      // Cập nhật stats
      const stats = data.stats || {};
      const activeEl = document.getElementById('stat-arena-active');
      const wageredEl = document.getElementById('stat-arena-wagered');
      const totalEl = document.getElementById('stat-arena-total');

      if (activeEl) activeEl.textContent = stats.activeMatches || 0;
      if (wageredEl) wageredEl.textContent = `${Number(stats.totalXuWagered || 0).toLocaleString()} Xu`;
      if (totalEl) totalEl.textContent = stats.totalMatches || 0;

      this.renderCurrentTabContent();
    } catch (err) {
      if (!isBackground) {
        console.error('Lỗi Arena fetchData:', err);
        const content = document.getElementById('arena-tab-content');
        if (content) {
          content.innerHTML = `
            <div class="card" style="text-align: center; padding: 40px; color: #f87171;">
              ⚠️ Không thể kết nối dữ liệu Đấu Trường: ${err.message}. Hãy thử bấm làm mới.
            </div>
          `;
        }
      }
    } finally {
      if (!isBackground) this.isLoading = false;
    }
  },

  renderCurrentTabContent() {
    const container = document.getElementById('arena-tab-content');
    const countEl = document.getElementById('arena-matches-count');
    if (!container) return;

    if (this.currentTab === 'rules') {
      if (countEl) countEl.textContent = 'Quy chế sàn đấu 3MGAMING';
      container.innerHTML = this.renderRulesTab();
      return;
    }

    let filteredMatches = [];
    if (this.currentTab === 'open') {
      filteredMatches = this.matches.filter(m => m.status === 'waiting' || m.status === 'in_progress');
      if (countEl) countEl.innerHTML = `Đang có <strong>${filteredMatches.length}</strong> kèo đấu mở`;
    } else if (this.currentTab === 'my_matches') {
      filteredMatches = this.matches.filter(m => 
        (m.creator && String(m.creator.steamId) === String(this.mySteamId)) ||
        (m.opponent && String(m.opponent.steamId) === String(this.mySteamId)) ||
        (m.spectatorBets && m.spectatorBets.some(b => String(b.steamId) === String(this.mySteamId)))
      );
      if (countEl) countEl.innerHTML = `Bạn đang tham gia / đặt cược <strong>${filteredMatches.length}</strong> kèo`;
    } else if (this.currentTab === 'history') {
      filteredMatches = this.matches.filter(m => m.status === 'finished');
      if (countEl) countEl.innerHTML = `Lịch sử <strong>${filteredMatches.length}</strong> trận đấu đã phân định`;
    }

    if (filteredMatches.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align: center; padding: 60px 20px; background: rgba(18, 14, 24, 0.75);">
          <div style="font-size: 3rem; margin-bottom: 12px; filter: grayscale(0.5);">🥊</div>
          <h3 style="font-size: 1.25rem; font-weight: 700; color: #fff; margin-bottom: 8px;">
            ${this.currentTab === 'open' ? 'Hiện chưa có kèo đấu PK nào đang mở!' : 
              this.currentTab === 'my_matches' ? 'Bạn chưa tạo kèo hoặc chưa tham gia trận PK nào!' : 
              'Chưa có lịch sử trận đấu đã kết thúc!'}
          </h3>
          <p style="color: var(--text-muted); font-size: 0.9rem; max-width: 500px; margin: 0 auto 20px;">
            ${this.currentTab === 'open' ? 'Hãy là người tiên phong tạo kèo thách đấu đầu tiên để các đấu sĩ khác cùng so tài!' : 'Hãy khám phá Sàn Đấu Đang Mở và nhận kèo thách đấu ngay!'}
          </p>
          <button onclick="Arena.openCreateMatchModal()" class="btn-primary" style="padding: 10px 22px; font-weight: 700; cursor: pointer; background: linear-gradient(135deg, #ef4444 0%, #ff2a85 100%); border: none;">
            <span>➕</span> Tạo Kèo Thách Đấu Ngay
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 20px;">
        ${filteredMatches.map(m => this.renderMatchCard(m)).join('')}
      </div>
    `;
  },

  renderMatchCard(m) {
    const isCreator = this.mySteamId && m.creator && String(m.creator.steamId) === String(this.mySteamId);
    const isOpponent = this.mySteamId && m.opponent && String(m.opponent.steamId) === String(this.mySteamId);
    const isFighter = isCreator || isOpponent;

    // Status Badge
    let statusBadge = '';
    let cardGlowBorder = 'rgba(255, 255, 255, 0.1)';

    if (m.status === 'waiting') {
      statusBadge = `<span style="background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.5); padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 5px;">
        <span style="width: 6px; height: 6px; background: #fbbf24; border-radius: 50%; display: inline-block;"></span> ĐANG CHỜ ĐỐI THỦ
      </span>`;
      cardGlowBorder = 'rgba(245, 158, 11, 0.35)';
    } else if (m.status === 'in_progress') {
      statusBadge = `<span style="background: rgba(239, 68, 68, 0.25); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.6); padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 800; display: inline-flex; align-items: center; gap: 5px; animation: pulse 2s infinite;">
        ⚔️ ĐANG PK NẢY LỬA
      </span>`;
      cardGlowBorder = 'rgba(239, 68, 68, 0.5)';
    } else if (m.status === 'finished') {
      statusBadge = `<span style="background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.5); padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 700;">
        🏆 ĐÃ KẾT THÚC
      </span>`;
      cardGlowBorder = 'rgba(16, 185, 129, 0.35)';
    } else if (m.status === 'cancelled') {
      statusBadge = `<span style="background: rgba(107, 114, 128, 0.2); color: #9ca3af; border: 1px solid rgba(107, 114, 128, 0.4); padding: 4px 10px; border-radius: 12px; font-size: 0.75rem;">
        ĐÃ HỦY KÈO
      </span>`;
    }

    // Spectator Bets Pool Summary
    const spectatorBets = m.spectatorBets || [];
    const creatorBets = spectatorBets.filter(b => b.chosenFighter === 'creator');
    const oppBets = spectatorBets.filter(b => b.chosenFighter === 'opponent');
    const creatorBetTotal = creatorBets.reduce((sum, b) => sum + b.amount, 0);
    const oppBetTotal = oppBets.reduce((sum, b) => sum + b.amount, 0);

    return `
      <div class="card match-card" style="padding: 20px; background: rgba(18, 14, 24, 0.85); border: 1px solid ${cardGlowBorder}; display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 8px 25px rgba(0,0,0,0.4)';" onmouseout="this.style.transform='none'; this.style.boxShadow='none';">
        <!-- Top bar: Title & Status -->
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 12px;">
            <div>
              <div style="font-size: 0.78rem; color: var(--accent-gold); font-weight: 700; text-transform: uppercase; margin-bottom: 2px;">
                🥋 ${this.escapeHtml(m.tier || 'Tự do')}
              </div>
              <h3 style="font-size: 1.15rem; font-weight: 800; color: #fff; margin: 0; line-height: 1.3;">
                ${this.escapeHtml(m.title)}
              </h3>
            </div>
            <div>
              ${statusBadge}
            </div>
          </div>

          <!-- Mức cược Xu & Quỹ Thưởng -->
          <div style="background: rgba(245, 158, 11, 0.08); border: 1px dashed rgba(245, 158, 11, 0.35); border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <span style="font-size: 0.78rem; color: var(--text-muted); text-transform: uppercase;">Mức cược:</span>
              <div style="font-size: 1.05rem; font-weight: 800; color: #fbbf24;">
                🪙 ${m.betAmount} Xu / người
              </div>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 0.78rem; color: var(--text-muted); text-transform: uppercase;">Quỹ thưởng Đấu sĩ:</span>
              <div style="font-size: 1.25rem; font-weight: 900; color: #34d399; text-shadow: 0 0 10px rgba(52, 211, 153, 0.4);">
                🏆 ${m.totalFighterPool} Xu
              </div>
            </div>
          </div>

          <!-- 2 Đấu Sĩ Đối Kháng (VS) -->
          <div style="background: rgba(10, 8, 14, 0.85); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 10px; padding: 14px; margin-bottom: 16px; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 10px;">
            <!-- Đấu sĩ A (Creator) -->
            <div style="text-align: center;">
              <div style="width: 44px; height: 44px; border-radius: 50%; background: rgba(59, 130, 246, 0.15); border: 2px solid #3b82f6; display: flex; align-items: center; justify-content: center; margin: 0 auto 6px; font-size: 1.3rem;">
                🦖
              </div>
              <div style="font-weight: 800; font-size: 0.88rem; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${this.escapeHtml(m.creator.name)}
              </div>
              <div style="font-size: 0.75rem; color: var(--accent-gold); font-weight: 600;">
                ${this.escapeHtml(m.creator.species)}
              </div>
              <div style="font-size: 0.7rem; color: var(--text-muted);">
                ${m.creator.growth}% lớn
              </div>
              ${m.status === 'finished' && m.winner === 'creator' ? `
                <div style="margin-top: 6px; background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid #10b981; font-weight: 800; font-size: 0.7rem; border-radius: 4px; padding: 2px 4px;">
                  👑 CHIẾN THẮNG
                </div>
              ` : ''}
              <div style="margin-top: 4px; font-size: 0.72rem; color: #60a5fa;">
                Cược: <strong>${creatorBetTotal} Xu</strong>
              </div>
            </div>

            <!-- VS Badge -->
            <div style="text-align: center;">
              <div style="width: 34px; height: 34px; border-radius: 50%; background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; color: #f87171; font-weight: 900; font-size: 0.82rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px rgba(239, 68, 68, 0.4);">
                VS
              </div>
            </div>

            <!-- Đấu sĩ B (Opponent) -->
            <div style="text-align: center;">
              ${m.opponent ? `
                <div style="width: 44px; height: 44px; border-radius: 50%; background: rgba(239, 68, 68, 0.15); border: 2px solid #ef4444; display: flex; align-items: center; justify-content: center; margin: 0 auto 6px; font-size: 1.3rem;">
                  🦕
                </div>
                <div style="font-weight: 800; font-size: 0.88rem; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  ${this.escapeHtml(m.opponent.name)}
                </div>
                <div style="font-size: 0.75rem; color: var(--accent-gold); font-weight: 600;">
                  ${this.escapeHtml(m.opponent.species)}
                </div>
                <div style="font-size: 0.7rem; color: var(--text-muted);">
                  ${m.opponent.growth}% lớn
                </div>
                ${m.status === 'finished' && m.winner === 'opponent' ? `
                  <div style="margin-top: 6px; background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid #10b981; font-weight: 800; font-size: 0.7rem; border-radius: 4px; padding: 2px 4px;">
                    👑 CHIẾN THẮNG
                  </div>
                ` : ''}
                <div style="margin-top: 4px; font-size: 0.72rem; color: #f87171;">
                  Cược: <strong>${oppBetTotal} Xu</strong>
                </div>
              ` : `
                <div style="width: 44px; height: 44px; border-radius: 50%; background: rgba(255, 255, 255, 0.05); border: 2px dashed rgba(255, 255, 255, 0.2); display: flex; align-items: center; justify-content: center; margin: 0 auto 6px; font-size: 1.1rem; color: var(--text-muted);">
                  ❓
                </div>
                <div style="font-weight: 700; font-size: 0.82rem; color: var(--text-muted);">
                  Đang tìm đối thủ
                </div>
                <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">
                  Bấm 'Nhận Kèo' bên dưới
                </div>
              `}
            </div>
          </div>

          <!-- Luật Đấu -->
          <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 16px;">
            📜 <strong>Luật:</strong> ${this.escapeHtml(m.rules || 'Solo 1v1 đến chết')}
          </div>
        </div>

        <!-- Action Buttons -->
        <div style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 14px;">
          ${this.renderCardActions(m, isCreator, isOpponent, isFighter)}
        </div>
      </div>
    `;
  },

  renderCardActions(m, isCreator, isOpponent, isFighter) {
    if (m.status === 'waiting') {
      if (isCreator) {
        return `
          <div style="display: flex; gap: 8px;">
            <button onclick="Arena.cancelMatch('${m.id}')" class="btn-secondary" style="flex: 1; padding: 8px 12px; font-size: 0.84rem; color: #f87171; border-color: rgba(239,68,68,0.4); cursor: pointer;">
              ❌ Hủy Kèo & Hoàn Xu
            </button>
            <button onclick="Arena.teleportToArena()" class="btn-primary" style="padding: 8px 14px; font-size: 0.84rem; cursor: pointer;">
              🚀 Vào Sân Chờ
            </button>
          </div>
        `;
      } else {
        return `
          <div style="display: flex; gap: 8px;">
            <button onclick="Arena.acceptMatch('${m.id}', ${m.betAmount})" class="btn-primary" style="flex: 1; padding: 9px 14px; font-size: 0.88rem; font-weight: 800; background: linear-gradient(135deg, #ef4444 0%, #ff2a85 100%); border: none; cursor: pointer; box-shadow: 0 0 12px rgba(239, 68, 68, 0.4);">
              🥊 Nhận Thách Đấu (${m.betAmount} Xu)
            </button>
            <button onclick="Arena.openSpectatorBetModal('${m.id}')" class="btn-secondary" style="padding: 9px 12px; font-size: 0.84rem; cursor: pointer;" title="Đặt cược khán giả">
              🎯 Cược
            </button>
          </div>
        `;
      }
    } else if (m.status === 'in_progress') {
      if (isFighter) {
        return `
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; gap: 8px;">
              <button onclick="Arena.teleportToArena()" class="btn-primary" style="flex: 1; padding: 8px 12px; font-size: 0.85rem; font-weight: 700; background: #10b981; border: none; cursor: pointer;">
                🚀 Vào Sân Đấu PK
              </button>
              <button onclick="Arena.checkMatchResult('${m.id}')" class="btn-secondary" style="padding: 8px 12px; font-size: 0.85rem; cursor: pointer;" title="Quét combat log kiểm tra xem ai đã hạ gục ai">
                🔄 Kiểm Tra Kết Quả
              </button>
            </div>
            <button onclick="Arena.concedeMatch('${m.id}')" class="btn-secondary" style="padding: 6px 10px; font-size: 0.78rem; color: var(--text-muted); border-color: rgba(255,255,255,0.1); cursor: pointer;">
              🏳️ Tôi nhận thua (Concede)
            </button>
          </div>
        `;
      } else {
        return `
          <div style="display: flex; gap: 8px;">
            <button onclick="Arena.openSpectatorBetModal('${m.id}')" class="btn-primary" style="flex: 1; padding: 8px 14px; font-size: 0.85rem; font-weight: 700; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border: none; cursor: pointer;">
              🎯 Đặt Cược Khán Giả
            </button>
            <button onclick="Arena.teleportToArena()" class="btn-secondary" style="padding: 8px 12px; font-size: 0.85rem; cursor: pointer;" title="Xem trực tiếp trong game">
              👀 Khán Đài
            </button>
          </div>
        `;
      }
    } else if (m.status === 'finished') {
      const winnerName = (m.winner && m[m.winner] && m[m.winner].name) ? m[m.winner].name : 'Đấu sĩ';
      return `
        <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 6px; padding: 8px 12px; font-size: 0.8rem; color: #34d399; text-align: center;">
          🏆 <strong>${this.escapeHtml(winnerName)}</strong> chiến thắng (+${m.totalFighterPool} Xu)
          ${m.winReason ? `<div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">${this.escapeHtml(m.winReason)}</div>` : ''}
        </div>
      `;
    }
    return '';
  },

  renderRulesTab() {
    return `
      <div class="card" style="padding: 24px; background: rgba(18, 14, 24, 0.85); border: 1px solid var(--border-color); line-height: 1.8;">
        <h2 style="font-size: 1.3rem; font-weight: 800; color: #fff; margin-bottom: 16px; display: flex; align-items: center; gap: 10px;">
          <span>📖</span> QUY CHẾ ĐẤU TRƯỜNG & ĐẶT CƯỢC XU 3MGAMING
        </h2>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
          <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 18px;">
            <h3 style="font-size: 1.05rem; font-weight: 700; color: #f87171; margin-bottom: 10px;">
              🥊 1. Thể Thức Tạo Kèo & Nhận Kèo
            </h3>
            <ul style="padding-left: 18px; font-size: 0.88rem; color: var(--text-muted);">
              <li>Người chơi có thể tạo bất kỳ kèo 1v1 nào với mức cược tối thiểu <strong>10 Xu</strong>.</li>
              <li>Hệ thống tự động trừ tiền cược và tạm giữ trong Quỹ Đấu Trường (Escrow).</li>
              <li>Người nhận kèo phải có đủ số Xu bằng với mức cược của người tạo.</li>
              <li>Khi cả 2 đã vào trận, trận đấu chính thức bắt đầu và không thể hủy ngang.</li>
            </ul>
          </div>

          <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 18px;">
            <h3 style="font-size: 1.05rem; font-weight: 700; color: #fbbf24; margin-bottom: 10px;">
              🎯 2. Đặt Cược Khán Giả (Spectator)
            </h3>
            <ul style="padding-left: 18px; font-size: 0.88rem; color: var(--text-muted);">
              <li>Khán giả có thể cược cho Đấu Sĩ A hoặc Đấu Sĩ B (tối thiểu <strong>5 Xu</strong>).</li>
              <li>Đấu sĩ trực tiếp tham gia trận đấu không được đặt cược khán giả vào trận của mình.</li>
              <li>Số tiền thắng cược của khán giả được chia theo tỷ lệ tổng quỹ cược của bên thua.</li>
            </ul>
          </div>

          <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 18px;">
            <h3 style="font-size: 1.05rem; font-weight: 700; color: #34d399; margin-bottom: 10px;">
              🏆 3. Phân Định Thắng Thua & Trả Thưởng
            </h3>
            <ul style="padding-left: 18px; font-size: 0.88rem; color: var(--text-muted);">
              <li><strong>Tự động 100%:</strong> Hệ thống quét IslePilot Live Combat Log. Đấu sĩ nào có đòn kết liễu hạ gục đối thủ sẽ lập tức được công nhận chiến thắng.</li>
              <li>Đấu sĩ thắng nhận trọn vẹn <strong>100% Quỹ Thưởng (2x tiền cược)</strong> cộng thẳng vào ví.</li>
              <li>Nếu một bên nhận thua (Concede), đối thủ sẽ lập tức được xử thắng.</li>
            </ul>
          </div>

          <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 18px;">
            <h3 style="font-size: 1.05rem; font-weight: 700; color: #60a5fa; margin-bottom: 10px;">
              🚀 4. Sân Đấu Đấu Trường (Arena)
            </h3>
            <ul style="padding-left: 18px; font-size: 0.88rem; color: var(--text-muted);">
              <li>Bấm nút <strong>"🚀 Vào Sân Đấu"</strong> để hệ thống tự động gửi lệnh dịch chuyển dino của bạn vào khu vực <strong>ĐẤU TRƯỜNG</strong> trong game.</li>
              <li>Hãy đứng yên 5 giây sau khi bấm lệnh để máy chủ xử lý dịch chuyển an toàn.</li>
            </ul>
          </div>
        </div>
      </div>
    `;
  },

  openCreateMatchModal() {
    this.init();
    if (!this.mySteamId) {
      if (window.App && window.App.showToast) {
        window.App.showToast('Vui lòng đăng nhập Steam ở góc trên để tạo kèo PK!', 'warning');
      } else {
        alert('Vui lòng đăng nhập Steam để tạo kèo PK!');
      }
      return;
    }

    const modalContainer = document.getElementById('arena-modal-container');
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div class="modal-overlay active" id="arena-create-modal" style="display: flex; align-items: center; justify-content: center; position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); z-index: 9999; padding: 20px;">
        <div class="card modal-content" style="max-width: 520px; width: 100%; background: #120e18; border: 1px solid rgba(239, 68, 68, 0.5); box-shadow: 0 0 35px rgba(239, 68, 68, 0.25); border-radius: 16px; padding: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 1.5rem;">🥊</span>
              <h3 style="font-size: 1.25rem; font-weight: 800; color: #fff; margin: 0;">Tạo Kèo Thách Đấu PK</h3>
            </div>
            <button onclick="Arena.closeModal()" style="background: none; border: none; color: var(--text-muted); font-size: 1.4rem; cursor: pointer;">✕</button>
          </div>

          <form id="arena-create-form" onsubmit="event.preventDefault(); Arena.submitCreateMatch();">
            <div style="margin-bottom: 16px;">
              <label style="display: block; font-size: 0.85rem; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">
                Tiêu đề kèo đấu:
              </label>
              <input type="text" id="create-match-title" placeholder="VD: Rex Prime vs Rex Prime 1v1" required
                style="width: 100%; padding: 10px 14px; background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); border-radius: 8px; color: #fff; font-size: 0.92rem; outline: none;" />
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
              <div>
                <label style="display: block; font-size: 0.85rem; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">
                  Hạng cân / Loài:
                </label>
                <select id="create-match-tier" style="width: 100%; padding: 10px 12px; background: #1a1424; border: 1px solid var(--border-color); border-radius: 8px; color: #fff; font-size: 0.88rem; outline: none;">
                  <option value="Apex (T-Rex / Giga / Spino)">Apex (T-Rex / Giga / Spino)</option>
                  <option value="Mid-tier (Cerato / Carno / Dilo)">Mid-tier (Cerato / Carno / Dilo)</option>
                  <option value="Herbivore (Trike / Stego / Diablo)">Herbivore (Trike / Stego / Diablo)</option>
                  <option value="Tự do Solo All Tiers">Tự do Solo All Tiers</option>
                </select>
              </div>

              <div>
                <label style="display: block; font-size: 0.85rem; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">
                  Mức cược (Xu):
                </label>
                <input type="number" id="create-match-bet" min="10" step="10" value="50" required
                  style="width: 100%; padding: 10px 14px; background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); border-radius: 8px; color: #fbbf24; font-size: 0.95rem; font-weight: 700; outline: none;" />
              </div>
            </div>

            <!-- Nút chọn nhanh mức cược -->
            <div style="display: flex; gap: 6px; margin-bottom: 16px;">
              ${[20, 50, 100, 200, 500].map(val => `
                <button type="button" onclick="document.getElementById('create-match-bet').value=${val}" class="btn-secondary" style="padding: 4px 10px; font-size: 0.78rem; border-radius: 6px; cursor: pointer;">
                  ${val} Xu
                </button>
              `).join('')}
            </div>

            <div style="margin-bottom: 20px;">
              <label style="display: block; font-size: 0.85rem; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">
                Luật thi đấu bổ sung:
              </label>
              <input type="text" id="create-match-rules" value="Solo 1v1 đến chết, không ăn thịt hồi máu"
                style="width: 100%; padding: 10px 14px; background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); border-radius: 8px; color: #fff; font-size: 0.88rem; outline: none;" />
            </div>

            <!-- Thông báo số dư -->
            <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; padding: 10px 14px; font-size: 0.82rem; color: #fbbf24; margin-bottom: 20px;">
              🪙 Số dư hiện tại của bạn: <strong>${Number(this.myBalance).toLocaleString()} Xu</strong>. Tiền cược sẽ được tạm giữ ngay khi tạo kèo.
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 10px;">
              <button type="button" onclick="Arena.closeModal()" class="btn-secondary" style="padding: 10px 18px; font-size: 0.9rem; cursor: pointer;">
                Hủy bỏ
              </button>
              <button type="submit" id="btn-submit-create-match" class="btn-primary" style="padding: 10px 22px; font-size: 0.9rem; font-weight: 800; background: linear-gradient(135deg, #ef4444 0%, #ff2a85 100%); border: none; cursor: pointer;">
                Xác Nhận Tạo Kèo
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  async submitCreateMatch() {
    this.init();
    const title = document.getElementById('create-match-title').value.trim();
    const tier = document.getElementById('create-match-tier').value;
    const betAmount = parseInt(document.getElementById('create-match-bet').value, 10);
    const rules = document.getElementById('create-match-rules').value.trim();
    const submitBtn = document.getElementById('btn-submit-create-match');

    if (betAmount < 10) {
      alert('Mức cược tối thiểu là 10 Xu!');
      return;
    }
    if (this.myBalance < betAmount) {
      alert(`Số dư không đủ! Bạn có ${this.myBalance} Xu, cần ${betAmount} Xu.`);
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Đang khởi tạo...';
    }

    try {
      const res = await fetch('/api/arena/matches/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          steam_id: this.mySteamId,
          title,
          tier,
          bet_amount: betAmount,
          rules
        })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Lỗi tạo kèo');

      // Đóng modal
      this.closeModal();

      // Cập nhật ngay lập tức vào danh sách hiển thị
      if (data.match) {
        this.matches = this.matches.filter(m => m.id !== data.match.id);
        this.matches.unshift(data.match);
      }

      // TỰ ĐỘNG CHUYỂN SANG TAB "SÀN ĐẤU ĐANG MỞ" ĐỂ HIỆN NGAY TRẬN VỪA TẠO
      this.switchSubTab('open');

      if (window.App && window.App.showToast) {
        window.App.showToast(data.message || 'Tạo kèo thành công!', 'success');
      } else {
        alert(data.message || 'Tạo kèo thành công!');
      }

      // Đồng bộ lại với máy chủ
      await this.fetchData();
    } catch (err) {
      alert(`Lỗi: ${err.message}`);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Xác Nhận Tạo Kèo';
      }
    }
  },

  async acceptMatch(matchId, betAmount) {
    this.init();
    if (!this.mySteamId) {
      if (window.App && window.App.showToast) {
        window.App.showToast('Vui lòng đăng nhập Steam để nhận kèo thách đấu!', 'warning');
      } else {
        alert('Vui lòng đăng nhập Steam để nhận thách đấu!');
      }
      return;
    }

    if (this.myBalance < betAmount) {
      alert(`Số dư của bạn không đủ! Bạn có ${this.myBalance} Xu, cần ${betAmount} Xu để nhận kèo này.`);
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn cược ${betAmount} Xu và nhận thách đấu trận PK này không?`)) {
      return;
    }

    try {
      const res = await fetch('/api/arena/matches/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          match_id: matchId,
          steam_id: this.mySteamId
        })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Lỗi nhận kèo');

      // Cập nhật ngay vào danh sách local
      if (data.match) {
        const idx = this.matches.findIndex(m => m.id === data.match.id);
        if (idx !== -1) this.matches[idx] = data.match;
      }

      this.switchSubTab('open');

      if (window.App && window.App.showToast) {
        window.App.showToast('🎉 Đã nhận kèo PK thành công! Trận đấu bắt đầu.', 'success');
      } else {
        alert('Đã nhận kèo thành công! Trận đấu bắt đầu.');
      }
      await this.fetchData();
    } catch (err) {
      alert(`Lỗi: ${err.message}`);
    }
  },

  async cancelMatch(matchId) {
    if (!confirm('Bạn có chắc chắn muốn hủy kèo này và nhận lại toàn bộ Xu cược không?')) {
      return;
    }

    try {
      const res = await fetch('/api/arena/matches/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          match_id: matchId,
          steam_id: this.mySteamId
        })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Lỗi hủy kèo');

      this.matches = this.matches.filter(m => m.id !== matchId);
      this.switchSubTab('open');

      if (window.App && window.App.showToast) {
        window.App.showToast(data.message || 'Đã hủy kèo!', 'info');
      }
      await this.fetchData();
    } catch (err) {
      alert(`Lỗi: ${err.message}`);
    }
  },

  async concedeMatch(matchId) {
    if (!confirm('Bạn có chắc chắn muốn đầu hàng (nhận thua) trong trận PK này không? Tiền cược sẽ thuộc về đối thủ.')) {
      return;
    }

    try {
      const res = await fetch('/api/arena/matches/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          match_id: matchId,
          steam_id: this.mySteamId,
          action: 'concede'
        })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Lỗi nhận thua');

      if (window.App && window.App.showToast) {
        window.App.showToast(data.message || 'Đã xác nhận kết quả!', 'info');
      }
      await this.fetchData();
    } catch (err) {
      alert(`Lỗi: ${err.message}`);
    }
  },

  async checkMatchResult(matchId) {
    try {
      const res = await fetch('/api/arena/matches/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          match_id: matchId,
          steam_id: this.mySteamId,
          action: 'check_combat'
        })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Lỗi kiểm tra kết quả');

      if (data.settled) {
        if (window.App && window.App.showToast) {
          window.App.showToast(data.message, 'success');
        } else {
          alert(data.message);
        }
      } else {
        if (window.App && window.App.showToast) {
          window.App.showToast('Chưa ghi nhận đòn kết liễu trong hệ thống. Trận đấu vẫn đang tiếp tục!', 'info');
        } else {
          alert('Chưa ghi nhận đòn kết liễu. Trận đấu vẫn đang tiếp tục!');
        }
      }
      await this.fetchData();
    } catch (err) {
      alert(`Lỗi: ${err.message}`);
    }
  },

  openSpectatorBetModal(matchId) {
    this.init();
    if (!this.mySteamId) {
      if (window.App && window.App.showToast) {
        window.App.showToast('Vui lòng đăng nhập Steam để đặt cược khán giả!', 'warning');
      } else {
        alert('Vui lòng đăng nhập Steam để đặt cược khán giả!');
      }
      return;
    }

    const match = this.matches.find(m => m.id === matchId);
    if (!match) return;

    const modalContainer = document.getElementById('arena-modal-container');
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div class="modal-overlay active" id="arena-bet-modal" style="display: flex; align-items: center; justify-content: center; position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); z-index: 9999; padding: 20px;">
        <div class="card modal-content" style="max-width: 480px; width: 100%; background: #120e18; border: 1px solid rgba(245, 158, 11, 0.5); box-shadow: 0 0 35px rgba(245, 158, 11, 0.25); border-radius: 16px; padding: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 1.5rem;">🎯</span>
              <h3 style="font-size: 1.2rem; font-weight: 800; color: #fff; margin: 0;">Đặt Cược Khán Giả</h3>
            </div>
            <button onclick="Arena.closeModal()" style="background: none; border: none; color: var(--text-muted); font-size: 1.4rem; cursor: pointer;">✕</button>
          </div>

          <form id="arena-bet-form" onsubmit="event.preventDefault(); Arena.submitSpectatorBet('${matchId}');">
            <div style="font-size: 0.9rem; color: var(--text-highlight); font-weight: 700; margin-bottom: 14px;">
              ${this.escapeHtml(match.title)}
            </div>

            <div style="margin-bottom: 16px;">
              <label style="display: block; font-size: 0.85rem; font-weight: 700; color: var(--text-main); margin-bottom: 8px;">
                Chọn đấu thủ bạn dự đoán chiến thắng:
              </label>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <label style="background: rgba(59, 130, 246, 0.1); border: 2px solid #3b82f6; border-radius: 8px; padding: 12px; cursor: pointer; text-align: center; display: block;">
                  <input type="radio" name="chosen_fighter" value="creator" checked style="margin-right: 6px;" />
                  <div style="font-weight: 800; color: #fff; margin-top: 4px;">${this.escapeHtml(match.creator.name)}</div>
                  <div style="font-size: 0.75rem; color: #60a5fa;">${this.escapeHtml(match.creator.species)}</div>
                </label>

                <label style="background: rgba(239, 68, 68, 0.1); border: 2px solid #ef4444; border-radius: 8px; padding: 12px; cursor: pointer; text-align: center; display: block;">
                  <input type="radio" name="chosen_fighter" value="opponent" style="margin-right: 6px;" ${!match.opponent ? 'disabled' : ''} />
                  <div style="font-weight: 800; color: #fff; margin-top: 4px;">${match.opponent ? this.escapeHtml(match.opponent.name) : '(Chờ đối thủ)'}</div>
                  <div style="font-size: 0.75rem; color: #f87171;">${match.opponent ? this.escapeHtml(match.opponent.species) : '--'}</div>
                </label>
              </div>
            </div>

            <div style="margin-bottom: 16px;">
              <label style="display: block; font-size: 0.85rem; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">
                Số Xu muốn cược:
              </label>
              <input type="number" id="spectator-bet-amount" min="5" step="5" value="20" required
                style="width: 100%; padding: 10px 14px; background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); border-radius: 8px; color: #fbbf24; font-size: 1rem; font-weight: 700; outline: none;" />
            </div>

            <!-- Nút chọn nhanh mức cược -->
            <div style="display: flex; gap: 6px; margin-bottom: 16px;">
              ${[10, 20, 50, 100].map(val => `
                <button type="button" onclick="document.getElementById('spectator-bet-amount').value=${val}" class="btn-secondary" style="padding: 4px 10px; font-size: 0.78rem; border-radius: 6px; cursor: pointer;">
                  ${val} Xu
                </button>
              `).join('')}
            </div>

            <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; padding: 10px 14px; font-size: 0.82rem; color: #fbbf24; margin-bottom: 20px;">
              🪙 Số dư hiện tại của bạn: <strong>${Number(this.myBalance).toLocaleString()} Xu</strong>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 10px;">
              <button type="button" onclick="Arena.closeModal()" class="btn-secondary" style="padding: 10px 18px; font-size: 0.9rem; cursor: pointer;">
                Hủy bỏ
              </button>
              <button type="submit" class="btn-primary" style="padding: 10px 22px; font-size: 0.9rem; font-weight: 800; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border: none; cursor: pointer;">
                Xác Nhận Đặt Cược
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  async submitSpectatorBet(matchId) {
    const chosenRadio = document.querySelector('input[name="chosen_fighter"]:checked');
    if (!chosenRadio) return;
    const chosenFighter = chosenRadio.value;
    const amount = parseInt(document.getElementById('spectator-bet-amount').value, 10);

    if (amount < 5) {
      alert('Mức cược tối thiểu là 5 Xu!');
      return;
    }
    if (this.myBalance < amount) {
      alert(`Số dư không đủ! Bạn có ${this.myBalance} Xu, cần ${amount} Xu.`);
      return;
    }

    try {
      const res = await fetch('/api/arena/matches/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          match_id: matchId,
          steam_id: this.mySteamId,
          chosen_fighter: chosenFighter,
          amount
        })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Lỗi đặt cược');

      this.closeModal();
      if (window.App && window.App.showToast) {
        window.App.showToast(data.message || 'Đặt cược thành công!', 'success');
      } else {
        alert(data.message || 'Đặt cược thành công!');
      }
      await this.fetchData();
    } catch (err) {
      alert(`Lỗi: ${err.message}`);
    }
  },

  async teleportToArena() {
    this.init();
    if (!this.mySteamId) {
      if (window.App && window.App.showToast) {
        window.App.showToast('Vui lòng đăng nhập Steam để gửi lệnh dịch chuyển!', 'warning');
      } else {
        alert('Vui lòng đăng nhập Steam để gửi lệnh dịch chuyển!');
      }
      return;
    }

    if (!confirm('Dịch chuyển khủng long của bạn tới ĐẤU TRƯỜNG ngay bây giờ? Hãy chắc chắn bạn đang vào game và đứng yên an toàn!')) {
      return;
    }

    try {
      const res = await fetch('/api/arena/matches/teleport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steam_id: this.mySteamId })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Lỗi dịch chuyển');

      if (window.App && window.App.showToast) {
        window.App.showToast(data.message || 'Đã gửi lệnh dịch chuyển!', 'success');
      } else {
        alert(data.message || 'Đã gửi lệnh dịch chuyển!');
      }
    } catch (err) {
      alert(`Lỗi dịch chuyển: ${err.message}`);
    }
  },

  closeModal() {
    const modal = document.querySelector('.modal-overlay.active');
    if (modal) modal.remove();
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

window.Arena = Arena;
