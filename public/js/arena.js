/**
 * 3MGAMING - Đấu Trường PK & Đặt Cược Xu (PvP Arena & System Coin Betting)
 * Đồng bộ thời gian thực với IslePilot API
 * Cập nhật: Khi trận chiến kết thúc, người thắng được cộng Xu cược (+Xu), người thua tự động bị trừ Xu (-Xu) trong ví.
 */

const Arena = {
  currentTab: 'open', // 'open', 'my_matches', 'history', 'rules'
  matches: [],
  mySteamId: '',
  myBalance: 0,
  isLoading: false,
  autoRefreshTimer: null,

  init() {
    let sid = '';
    const user = JSON.parse(localStorage.getItem('steam_user') || 'null');
    if (user) {
      sid = user.steamId || user.steam_id || user.id || user.steamid || '';
    }
    if (!sid) {
      // Thử đọc từ cookie steam_user
      const m = document.cookie.match(/steam_user=([^;:]+)/);
      if (m && m[1]) sid = decodeURIComponent(m[1]);
    }
    if (!sid && window.currentUser && window.currentUser.steamId) {
      sid = window.currentUser.steamId;
    }
    if (sid) {
      this.mySteamId = String(sid).trim();
    }
  },

  isUserMatch(sid1, sid2) {
    if (!sid1 || !sid2) return false;
    return String(sid1).trim().toLowerCase() === String(sid2).trim().toLowerCase();
  },

  getFighterSteamId(fighter) {
    if (!fighter) return '';
    return String(fighter.steamId || fighter.steam_id || fighter.id || '').trim();
  },

  isAdmin() {
    if (window.realAdminVerified) return true;
    const adminIds = ['76561199175571899', '76561199196418178', '76561199062270730', '76561199483156684'];
    const mySid = String(this.mySteamId || '').trim();
    if (adminIds.includes(mySid)) return true;
    try {
      const u = JSON.parse(localStorage.getItem('steam_user') || 'null');
      if (u && (adminIds.includes(String(u.steam_id)) || adminIds.includes(String(u.steamId)))) return true;
    } catch (e) {}
    return false;
  },

  async deleteMatch(matchId) {
    if (!confirm('Bạn có chắc chắn muốn xóa vĩnh viễn kèo đấu này khỏi hệ thống không?')) return;
    try {
      const res = await fetch('/api/arena/matches/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match_id: matchId, steam_id: this.mySteamId })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Lỗi xóa kèo');
      this.matches = this.matches.filter(m => m.id !== matchId);
      this.renderMatches();
      if (window.App && window.App.showToast) {
        window.App.showToast(data.message || 'Đã xóa kèo thành công!', 'success');
      } else {
        alert(data.message || 'Đã xóa kèo thành công!');
      }
      await this.fetchData();
    } catch (err) {
      alert(`Lỗi: `);
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
                Sàn đấu danh dự 1v1 dành riêng cho các chiến binh khủng long 3MGAMING. Đặt cược thách đấu, dịch chuyển vào sân đấu, khi kết thúc người thắng được cộng Xu, người thua tự động bị trừ Xu trong ví!
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

              <button id="btn-arena-teleport-hub" class="btn-secondary" style="padding: 10px 14px; font-size: 0.88rem; display: flex; align-items: center; gap: 6px; cursor: pointer; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); color: #34d399; font-weight: 700;" title="Dịch chuyển dino của bạn tới ĐẤU TRƯỜNG">
                <span>🚀</span> Dịch Chuyển Vào Đấu Trường
              </button>

              <button id="btn-arena-refresh" class="btn-secondary" style="padding: 10px 14px; font-size: 0.88rem; cursor: pointer;" title="Làm mới dữ liệu">
                <span>🔄</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Banner Thông Báo Nếu Bạn Có Trận PK Đang Chiến Đấu -->
        <div id="arena-active-fighter-banner"></div>

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
        // Chỉ refresh nền nếu modal tạo kèo/đặt cược/teleport không mở
        if (!document.getElementById('arena-create-modal') && !document.getElementById('arena-bet-modal') && !document.getElementById('arena-teleport-prompt-modal')) {
          this.fetchData(true);
        }
      }
    }, 4000);
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
      if (data.my_balance !== undefined && data.my_balance !== null) {
        this.myBalance = Number(data.my_balance);
        if (window.App && window.App.updateUserBalanceUI) {
          window.App.updateUserBalanceUI(this.myBalance);
        }
        try {
          const u = JSON.parse(localStorage.getItem('steam_user') || 'null');
          if (u) {
            u.balance = this.myBalance;
            localStorage.setItem('steam_user', JSON.stringify(u));
          }
        } catch (e) {}
      } else {
        const u = JSON.parse(localStorage.getItem('steam_user') || 'null');
        if (u && u.balance !== undefined) {
          this.myBalance = Number(u.balance);
        }
      }
      if (!this.mySteamId && data.my_steam_id) {
        this.mySteamId = String(data.my_steam_id).trim();
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

      // Cập nhật banner active PK của chính mình
      this.renderActiveFighterBanner();

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

  renderActiveFighterBanner() {
    const bannerEl = document.getElementById('arena-active-fighter-banner');
    if (!bannerEl) return;

    if (!this.mySteamId) {
      bannerEl.innerHTML = '';
      return;
    }

    const myActiveMatch = this.matches.find(m => {
      if (m.status !== 'in_progress') return false;
      const cSid = this.getFighterSteamId(m.creator);
      const oSid = this.getFighterSteamId(m.opponent);
      return this.isUserMatch(this.mySteamId, cSid) || this.isUserMatch(this.mySteamId, oSid);
    });

    if (myActiveMatch) {
      bannerEl.innerHTML = `
        <div style="margin-bottom: 24px; padding: 16px 20px; border-radius: 12px; background: linear-gradient(135deg, rgba(16, 185, 129, 0.22), rgba(6, 78, 59, 0.4)); border: 2px solid #10b981; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px; box-shadow: 0 0 25px rgba(16, 185, 129, 0.25);">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div style="width: 48px; height: 48px; border-radius: 50%; background: #10b981; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; box-shadow: 0 0 15px #10b981;">
              ⚔️
            </div>
            <div>
              <div style="font-weight: 800; color: #fff; font-size: 1.05rem;">
                BẠN ĐANG CÓ TRẬN PK CHIẾN ĐẤU: <span style="color: #fbbf24;">${this.escapeHtml(myActiveMatch.title)}</span>
              </div>
              <div style="font-size: 0.85rem; color: #a7f3d0; margin-top: 2px;">
                Mức cược: <b>${myActiveMatch.betAmount} Xu</b> (Thắng: +${myActiveMatch.betAmount} Xu • Thua: -${myActiveMatch.betAmount} Xu)
              </div>
            </div>
          </div>
          <button onclick="Arena.teleportToArena(true)" class="btn-primary" style="background: linear-gradient(135deg, #10b981, #059669); font-weight: 900; padding: 12px 22px; border-radius: 8px; border: none; box-shadow: 0 0 20px rgba(16, 185, 129, 0.6); cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 0.95rem;">
            <span>🚀</span> Dịch Chuyển Vào Đấu Trường Ngay
          </button>
        </div>
      `;
    } else {
      bannerEl.innerHTML = '';
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
      const mySid = this.mySteamId || '';
      filteredMatches = this.matches.filter(m => {
        const cSid = this.getFighterSteamId(m.creator);
        const oSid = this.getFighterSteamId(m.opponent);
        const isParticipant = this.isUserMatch(mySid, cSid) || this.isUserMatch(mySid, oSid);
        const isBettor = m.spectatorBets && m.spectatorBets.some(b => this.isUserMatch(mySid, b.steamId || b.steam_id));
        return isParticipant || isBettor;
      });
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
    const mySid = this.mySteamId || '';
    const cSid = this.getFighterSteamId(m.creator);
    const oSid = this.getFighterSteamId(m.opponent);

    const isCreator = this.isUserMatch(mySid, cSid);
    const isOpponent = this.isUserMatch(mySid, oSid);
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
    const creatorBetTotal = creatorBets.reduce((sum, b) => sum + (b.amount || 0), 0);
    const oppBetTotal = oppBets.reduce((sum, b) => sum + (b.amount || 0), 0);

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
            <div style="display: flex; align-items: center; gap: 6px;">
              ${statusBadge}
              ${this.isAdmin() ? `
                <button onclick="event.stopPropagation(); Arena.deleteMatch('${m.id}')" style="background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.5); color: #f87171; border-radius: 6px; padding: 3px 8px; font-size: 0.72rem; cursor: pointer; font-weight: 700; transition: all 0.2s;" title="Xóa vĩnh viễn kèo đấu này khỏi hệ thống (Admin)">
                  🗑️ Xóa
                </button>
              ` : ''}
            </div>
          </div>

          <!-- Mức cược Xu & Cơ cấu Thưởng/Trừ -->
          <div style="background: rgba(245, 158, 11, 0.08); border: 1px dashed rgba(245, 158, 11, 0.35); border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <span style="font-size: 0.78rem; color: var(--text-muted); text-transform: uppercase;">Mức cược trận:</span>
              <div style="font-size: 1.05rem; font-weight: 800; color: #fbbf24;">
                🪙 ${m.betAmount} Xu / người
              </div>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 0.78rem; color: var(--text-muted); text-transform: uppercase;">Thưởng chiến thắng:</span>
              <div style="font-size: 1.25rem; font-weight: 900; color: #34d399; text-shadow: 0 0 10px rgba(52, 211, 153, 0.4);">
                🏆 +${m.betAmount} Xu
              </div>
              <div style="font-size: 0.72rem; color: #f87171; font-weight: 600;">(Thua tự động trừ: -${m.betAmount} Xu)</div>
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
                ${this.escapeHtml(m.creator ? m.creator.name : 'Người tạo')}
              </div>
              <div style="font-size: 0.75rem; color: var(--accent-gold); font-weight: 600;">
                ${this.escapeHtml(m.creator ? m.creator.species : 'Dino')}
              </div>
              <div style="font-size: 0.7rem; color: var(--text-muted);">
                ${m.creator ? m.creator.growth : 100}% lớn
              </div>
              ${m.status === 'finished' && m.winner === 'creator' ? `
                <div style="margin-top: 6px; background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid #10b981; font-weight: 800; font-size: 0.7rem; border-radius: 4px; padding: 2px 4px;">
                  👑 CHIẾN THẮNG (+${m.betAmount} Xu)
                </div>
              ` : ''}
              ${m.status === 'finished' && m.winner === 'opponent' ? `
                <div style="margin-top: 6px; background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); font-weight: 700; font-size: 0.7rem; border-radius: 4px; padding: 2px 4px;">
                  💀 THẤT BẠI (-${m.betAmount} Xu)
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
                    👑 CHIẾN THẮNG (+${m.betAmount} Xu)
                  </div>
                ` : ''}
                ${m.status === 'finished' && m.winner === 'creator' ? `
                  <div style="margin-top: 6px; background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); font-weight: 700; font-size: 0.7rem; border-radius: 4px; padding: 2px 4px;">
                    💀 THẤT BẠI (-${m.betAmount} Xu)
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
                  Bấm 'Nhận Thách Đấu' bên dưới
                </div>
              `}
            </div>
          </div>

          <!-- Nhãn Báo Bạn Đang Trong Trận PK Này -->
          ${m.status === 'in_progress' && isFighter ? `
            <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 8px; padding: 8px 12px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
              <span style="font-size: 0.82rem; font-weight: 800; color: #34d399; display: flex; align-items: center; gap: 6px;">
                <span style="width: 8px; height: 8px; background: #34d399; border-radius: 50%; display: inline-block; box-shadow: 0 0 8px #34d399;"></span>
                BẠN ĐANG TRONG TRẬN ĐẤU NÀY!
              </span>
              <span style="font-size: 0.75rem; color: #a7f3d0; font-weight: 600;">(Đấu Trường)</span>
            </div>
          ` : ''}

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
    const mySid = String(this.mySteamId || '').trim();
    const myBet = m.spectatorBets && m.spectatorBets.find(b => this.isUserMatch(mySid, b.steamId || b.steam_id));

    if (m.status === 'waiting') {
      if (isCreator) {
        return `
          <div style="display: flex; gap: 8px;">
            <button onclick="Arena.cancelMatch('${m.id}')" class="btn-secondary" style="flex: 1; padding: 8px 12px; font-size: 0.84rem; color: #f87171; border-color: rgba(239,68,68,0.4); cursor: pointer;">
              ❌ Hủy Kèo
            </button>
            <button onclick="Arena.teleportToArena()" class="btn-primary" style="padding: 8px 14px; font-size: 0.84rem; cursor: pointer; display: flex; align-items: center; gap: 6px;">
              🚀 Dịch Chuyển Vào Đấu Trường
            </button>
          </div>
        `;
      } else {
        return `
          <div style="display: flex; gap: 8px; align-items: center;">
            <button onclick="Arena.acceptMatch('${m.id}', ${m.betAmount})" class="btn-primary" style="flex: 1; padding: 10px 14px; font-size: 0.88rem; font-weight: 800; background: linear-gradient(135deg, #ef4444 0%, #ff2a85 100%); border: none; cursor: pointer; box-shadow: 0 0 14px rgba(239, 68, 68, 0.4); display: flex; align-items: center; justify-content: center; gap: 6px;">
              <span>🥊</span> Nhận Thách Đấu (${m.betAmount} Xu)
            </button>
            ${myBet ? `
              <span style="padding: 9px 12px; font-size: 0.78rem; font-weight: 700; color: #fbbf24; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 8px; white-space: nowrap;" title="Bạn đã đặt cược (mỗi người chỉ được cược 1 lần)">
                ✅ Đã cược ${myBet.amount} Xu
              </span>
            ` : `
              <button onclick="Arena.openSpectatorBetModal('${m.id}')" class="btn-secondary" style="padding: 10px 12px; font-size: 0.84rem; cursor: pointer;" title="Đặt cược khán giả">
                🎯 Cược
              </button>
            `}
          </div>
        `;
      }
    } else if (m.status === 'in_progress') {
      if (isFighter) {
        return `
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <button onclick="Arena.teleportToArena(true)" class="btn-primary" style="width: 100%; padding: 10px 14px; font-size: 0.92rem; font-weight: 800; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border: none; cursor: pointer; box-shadow: 0 0 16px rgba(16, 185, 129, 0.5); display: flex; align-items: center; justify-content: center; gap: 8px; border-radius: 8px;">
              <span>🚀</span> Dịch Chuyển Vào Đấu Trường Ngay
            </button>
            <div style="display: flex; gap: 8px;">
              <button onclick="Arena.checkMatchResult('${m.id}')" class="btn-secondary" style="flex: 1; padding: 8px 10px; font-size: 0.82rem; cursor: pointer;" title="Quét combat log kiểm tra xem ai đã hạ gục ai">
                🔄 Kiểm Tra Kết Quả
              </button>
              <button onclick="Arena.concedeMatch('${m.id}')" class="btn-secondary" style="padding: 8px 10px; font-size: 0.82rem; color: #f87171; border-color: rgba(239,68,68,0.3); cursor: pointer;">
                🏳️ Đầu Hàng
              </button>
            </div>
          </div>
        `;
      } else {
        return `
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${myBet ? `
              <div style="padding: 9px 12px; background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 8px; text-align: center; font-size: 0.82rem; color: #fbbf24; font-weight: 700;">
                🎯 Bạn đã cược: <strong>${myBet.amount} Xu</strong> cho <strong>${this.escapeHtml((m[myBet.chosenFighter] && m[myBet.chosenFighter].name) || myBet.chosenFighter)}</strong><br />
                <span style="font-size: 0.74rem; color: #94a3b8; font-weight: 500;">(Đã khóa cược • Mỗi người chỉ được cược 1 lần trong suốt trận)</span>
              </div>
              <button onclick="Arena.teleportToArena()" class="btn-secondary" style="width: 100%; padding: 9px 12px; font-size: 0.85rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;" title="Dịch chuyển tới Đấu Trường xem trực tiếp">
                <span>🚀</span> Vào Đấu Trường Xem Trận
              </button>
            ` : `
              <div style="display: flex; gap: 8px;">
                <button onclick="Arena.openSpectatorBetModal('${m.id}')" class="btn-primary" style="flex: 1; padding: 9px 12px; font-size: 0.85rem; font-weight: 700; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border: none; cursor: pointer;">
                  🎯 Đặt Cược Khán Giả
                </button>
                <button onclick="Arena.teleportToArena()" class="btn-secondary" style="flex: 1; padding: 9px 12px; font-size: 0.85rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;" title="Dịch chuyển tới Đấu Trường xem trực tiếp">
                  <span>🚀</span> Vào Đấu Trường
                </button>
              </div>
            `}
          </div>
        `;
      }
    } else if (m.status === 'finished') {
      const winnerName = (m.winner && m[m.winner] && m[m.winner].name) ? m[m.winner].name : 'Đấu sĩ';
      const loserName = m.loserName || ((m.winner === 'creator' && m.opponent) ? m.opponent.name : ((m.winner === 'opponent' && m.creator) ? m.creator.name : ''));
      return `
        <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 8px; padding: 10px 14px; text-align: center;">
          <div style="font-size: 0.88rem; color: #34d399; font-weight: 800;">
            🏆 <strong>${this.escapeHtml(winnerName)}</strong> thắng trận (+${m.betAmount} Xu)
          </div>
          ${loserName ? `
            <div style="font-size: 0.78rem; color: #f87171; margin-top: 3px; font-weight: 700;">
              💀 <strong>${this.escapeHtml(loserName)}</strong> thua trận (đã trừ -${m.betAmount} Xu)
            </div>
          ` : ''}
          ${m.winReason ? `<div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">${this.escapeHtml(m.winReason)}</div>` : ''}
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
              <li>Hệ thống kiểm tra số dư ví nhưng <strong>không trừ Xu trước</strong>. Xu chỉ được cộng/trừ khi trận chiến kết thúc.</li>
              <li>Người nhận kèo phải có đủ số Xu bằng với mức cược của người tạo.</li>
              <li>Khi cả 2 đã vào trận, trận đấu chính thức bắt đầu và nút <strong>🚀 Dịch chuyển vào Đấu Trường</strong> sẽ hiện ngay lập tức!</li>
            </ul>
          </div>

          <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 18px;">
            <h3 style="font-size: 1.05rem; font-weight: 700; color: #fbbf24; margin-bottom: 10px;">
              🎯 2. Đặt Cược Khán Giả (Spectator)
            </h3>
            <ul style="padding-left: 18px; font-size: 0.88rem; color: var(--text-muted);">
              <li>Khán giả có thể cược cho Đấu Sĩ A hoặc Đấu Sĩ B (tối thiểu <strong>5 Xu</strong>).</li>
              <li><strong>Giới hạn 1 lần cược:</strong> Mỗi người chơi chỉ được đặt cược <strong>1 lần duy nhất</strong> trong suốt trận đấu. Sau khi đã cược, hệ thống sẽ khóa không cho đặt cược thêm nữa.</li>
              <li>Đấu sĩ trực tiếp tham gia trận đấu không được đặt cược khán giả vào trận của mình.</li>
              <li>Số tiền thắng cược của khán giả: Tỷ lệ thưởng chuẩn <strong>1:1</strong> (ví dụ cược 2,000 Xu thì khi thắng nhận lại đúng 2,000 Xu gốc + 2,000 Xu tiền lãi = 4,000 Xu tổng nhận về).</li>
            </ul>
          </div>

          <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 18px;">
            <h3 style="font-size: 1.05rem; font-weight: 700; color: #34d399; margin-bottom: 10px;">
              🏆 3. Phân Định Thắng Thua & Cộng/Trừ Xu
            </h3>
            <ul style="padding-left: 18px; font-size: 0.88rem; color: var(--text-muted);">
              <li><strong>Tự động 100%:</strong> Hệ thống quét IslePilot Live Combat Log. Đấu sĩ nào có đòn kết liễu hạ gục đối thủ sẽ lập tức được công nhận chiến thắng.</li>
              <li><strong>Cộng/Trừ Xu tự động:</strong> Khi trận chiến kết thúc, người thắng sẽ được cộng thêm Xu tương ứng mức cược (+X Xu), người thua sẽ bị hệ thống tự động trừ Xu trong ví (-X Xu).</li>
              <li>Nếu một bên nhận thua (Concede), đối thủ sẽ lập tức được xử thắng và hệ thống xử lý cộng/trừ Xu ngay lập tức.</li>
            </ul>
          </div>

          <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 18px;">
            <h3 style="font-size: 1.05rem; font-weight: 700; color: #60a5fa; margin-bottom: 10px;">
              🚀 4. Sân Đấu Đấu Trường (Arena)
            </h3>
            <ul style="padding-left: 18px; font-size: 0.88rem; color: var(--text-muted);">
              <li>Bấm nút <strong>"🚀 Dịch Chuyển Vào Đấu Trường"</strong> để hệ thống tự động gửi lệnh dịch chuyển dino của bạn vào khu vực <strong>ĐẤU TRƯỜNG</strong> trong game.</li>
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
              🪙 Số dư hiện tại của bạn: <strong>${Number(this.myBalance).toLocaleString()} Xu</strong>.<br />
              💡 <b>Lưu ý:</b> Hệ thống không trừ trước. Khi trận chiến kết thúc, người thắng sẽ được cộng (+Xu) và người thua sẽ tự động bị trừ (-Xu) trong ví!
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
    const userObj = JSON.parse(localStorage.getItem('steam_user') || 'null');
    const effectiveBal = Math.max(Number(this.myBalance || 0), Number((userObj && userObj.balance) || 0));
    if (effectiveBal < betAmount) {
      alert(`Số dư không đủ! Bạn có ${effectiveBal} Xu, cần ${betAmount} Xu.`);
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

    const userObj = JSON.parse(localStorage.getItem('steam_user') || 'null');
    const effectiveBal = Math.max(Number(this.myBalance || 0), Number((userObj && userObj.balance) || 0));
    if (effectiveBal < betAmount) {
      alert(`Số dư của bạn không đủ! Bạn có ${effectiveBal} Xu, cần ${betAmount} Xu để nhận kèo này.`);
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn nhận thách đấu trận PK này không?\n\n• Mức cược: ${betAmount} Xu\n• Khi kết thúc: Thắng được cộng +${betAmount} Xu, Thua bị tự động trừ -${betAmount} Xu trong ví.`)) {
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
      let targetMatch = data.match;
      if (targetMatch) {
        const idx = this.matches.findIndex(m => m.id === targetMatch.id);
        if (idx !== -1) {
          this.matches[idx] = targetMatch;
        } else {
          this.matches.unshift(targetMatch);
        }
      } else {
        targetMatch = this.matches.find(m => m.id === matchId);
      }

      this.switchSubTab('open');

      if (window.App && window.App.showToast) {
        window.App.showToast('🎉 Đã nhận kèo PK thành công! Trận đấu bắt đầu.', 'success');
      }

      // HIỆN NGAY BẢNG MODAL HỎI DỊCH CHUYỂN VÀO ĐẤU TRƯỜNG
      this.showTeleportPromptModal(targetMatch);

      await this.fetchData();
    } catch (err) {
      alert(`Lỗi: ${err.message}`);
    }
  },

  showTeleportPromptModal(match) {
    const modalContainer = document.getElementById('arena-modal-container');
    if (!modalContainer) return;

    const title = (match && match.title) ? this.escapeHtml(match.title) : 'Trận Đấu PK';
    const bet = (match && match.betAmount) ? match.betAmount : 50;
    const oppSid = (match && match.opponent && match.opponent.steamId) ? String(match.opponent.steamId).trim() : (this.mySteamId || '');

    modalContainer.innerHTML = `
      <div class="modal-overlay active" id="arena-teleport-prompt-modal" style="display: flex; align-items: center; justify-content: center; position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); z-index: 10000; padding: 20px;">
        <div class="card modal-content" style="max-width: 500px; width: 100%; background: linear-gradient(145deg, #181224 0%, #0d0a14 100%); border: 2px solid #10b981; box-shadow: 0 0 40px rgba(16, 185, 129, 0.4); border-radius: 16px; padding: 28px; text-align: center;">
          <div style="width: 72px; height: 72px; border-radius: 50%; background: rgba(16, 185, 129, 0.2); border: 2px solid #10b981; display: flex; align-items: center; justify-content: center; font-size: 2.2rem; margin: 0 auto 16px; box-shadow: 0 0 20px rgba(16, 185, 129, 0.5);">
            🥊
          </div>

          <h3 style="font-size: 1.45rem; font-weight: 900; color: #fff; margin: 0 0 8px;">
            🎉 NHẬN KÈO PK THÀNH CÔNG!
          </h3>
          <p style="color: #cbd5e1; font-size: 0.95rem; margin: 0 0 16px; line-height: 1.5;">
            Bạn đã chấp nhận thách đấu kèo <b>${title}</b>.<br />
            Mức cược: <span style="color: #fbbf24; font-weight: 800;">🪙 ${bet} Xu</span> (Thắng nhận +${bet} Xu • Thua trừ -${bet} Xu).
          </p>

          <div style="background: rgba(16, 185, 129, 0.1); border: 1px dashed rgba(16, 185, 129, 0.4); border-radius: 10px; padding: 14px; margin-bottom: 20px; font-size: 0.88rem; color: #a7f3d0; text-align: left; line-height: 1.5;">
            📍 <b>Địa điểm thi đấu:</b> ĐẤU TRƯỜNG<br />
            ⚠️ <b>Quan trọng:</b> Hãy đảm bảo khủng long của bạn <b>đang online trong game và đứng yên</b> trước khi bấm lệnh dịch chuyển!
          </div>

          <div id="modal-teleport-status-box" style="display: none; margin-bottom: 16px; padding: 12px; border-radius: 8px; font-size: 0.9rem; text-align: left; line-height: 1.4;"></div>

          <div style="display: flex; flex-direction: column; gap: 10px;">
            <button id="btn-modal-teleport-action" onclick="Arena.handleTeleportPrompt('${oppSid}')" class="btn-primary" style="padding: 14px 20px; font-size: 1.05rem; font-weight: 800; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border: none; cursor: pointer; box-shadow: 0 0 20px rgba(16, 185, 129, 0.5); border-radius: 10px; display: flex; align-items: center; justify-content: center; gap: 8px;">
              <span>🚀</span> DỊCH CHUYỂN VÀO ĐẤU TRƯỜNG NGAY
            </button>
            <button onclick="Arena.closeModal()" class="btn-secondary" style="padding: 10px 16px; font-size: 0.88rem; cursor: pointer;">
              Để sau (Tôi sẽ tự dịch chuyển)
            </button>
          </div>
        </div>
      </div>
    `;
  },

  async handleTeleportPrompt(targetSid) {
    const btn = document.getElementById('btn-modal-teleport-action');
    const statusBox = document.getElementById('modal-teleport-status-box');

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span>⏳</span> Đang gửi lệnh dịch chuyển...';
    }

    const sid = targetSid || this.mySteamId;
    const ok = await this.teleportToArena(true, sid);

    if (ok) {
      if (btn) {
        btn.innerHTML = '<span>✅</span> ĐÃ GỬI LỆNH THÀNH CÔNG!';
        btn.style.background = '#059669';
      }
      if (statusBox) {
        statusBox.style.display = 'block';
        statusBox.style.background = 'rgba(16, 185, 129, 0.2)';
        statusBox.style.border = '1px solid #10b981';
        statusBox.style.color = '#a7f3d0';
        statusBox.innerHTML = '🚀 <b>Đã gửi lệnh dịch chuyển tới game!</b><br />Vui lòng vào màn hình game và <b>ĐỨNG YÊN 3 - 5 GIÂY</b> để máy chủ chuyển bạn tới sàn đấu.';
      }
      setTimeout(() => {
        this.closeModal();
      }, 4000);
    } else {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span>🚀</span> Thử Dịch Chuyển Lại';
      }
      if (statusBox) {
        statusBox.style.display = 'block';
        statusBox.style.background = 'rgba(239, 68, 68, 0.15)';
        statusBox.style.border = '1px solid #ef4444';
        statusBox.style.color = '#fca5a5';
        statusBox.innerHTML = '⚠️ <b>Dịch chuyển chưa thành công!</b><br />Hãy chắc chắn khủng long của bạn đã ở trong game, không bị combat và đang đứng yên.';
      }
    }
  },

  async cancelMatch(matchId) {
    if (!confirm('Bạn có chắc chắn muốn hủy kèo này không?')) {
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
    if (!confirm('Bạn có chắc chắn muốn đầu hàng (nhận thua) trong trận PK này không? Hệ thống sẽ tự động trừ Xu cược trong ví của bạn và cộng cho đối thủ.')) {
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

    // Kiểm tra: Mỗi người chơi chỉ được đặt cược 1 lần duy nhất trong suốt trận đấu
    const mySid = String(this.mySteamId || '').trim();
    const existingBet = match.spectatorBets && match.spectatorBets.find(b => this.isUserMatch(mySid, b.steamId || b.steam_id));
    if (existingBet) {
      const chosenName = (match[existingBet.chosenFighter] && match[existingBet.chosenFighter].name) || existingBet.chosenFighter;
      const msg = `Bạn đã đặt cược ${existingBet.amount} Xu cho ${chosenName} rồi! Mỗi người chơi chỉ được đặt cược 1 lần duy nhất trong suốt trận đấu.`;
      if (window.App && window.App.showToast) {
        window.App.showToast(msg, 'warning');
      } else {
        alert(msg);
      }
      return;
    }

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
                  <div style="font-weight: 800; color: #fff; margin-top: 4px;">${this.escapeHtml(match.creator ? match.creator.name : 'Người tạo')}</div>
                  <div style="font-size: 0.75rem; color: #60a5fa;">${this.escapeHtml(match.creator ? match.creator.species : 'Dino')}</div>
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
            <div style="display: flex; gap: 6px; margin-bottom: 16px; flex-wrap: wrap;">
              ${[20, 50, 100, 500, 1000, 2000].map(val => `
                <button type="button" onclick="document.getElementById('spectator-bet-amount').value=${val}" class="btn-secondary" style="padding: 4px 10px; font-size: 0.78rem; border-radius: 6px; cursor: pointer;">
                  ${val.toLocaleString()} Xu
                </button>
              `).join('')}
            </div>

            <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; padding: 10px 14px; font-size: 0.82rem; color: #fbbf24; margin-bottom: 20px;">
              🪙 Số dư hiện tại của bạn: <strong>${Number(this.myBalance).toLocaleString()} Xu</strong><br />
              💡 <b>Tỷ lệ thưởng 1:1 chuẩn xác:</b> Khi thắng, bạn nhận lại 100% tiền cược gốc + 100% tiền lãi (Ví dụ cược 2,000 Xu thắng nhận tổng 4,000 Xu, tăng đúng +2,000 Xu ròng).
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

  async teleportToArena(skipConfirm = false, customSteamId = null) {
    this.init();
    const sid = customSteamId || this.mySteamId;
    if (!sid) {
      const msg = 'Vui lòng đăng nhập Steam để gửi lệnh dịch chuyển!';
      if (window.App && window.App.showToast) {
        window.App.showToast(msg, 'warning');
      } else {
        alert(msg);
      }
      return false;
    }

    if (!skipConfirm) {
      if (!confirm('Dịch chuyển khủng long của bạn tới ĐẤU TRƯỜNG ngay bây giờ? Hãy chắc chắn bạn đang vào game và đứng yên an toàn!')) {
        return false;
      }
    }

    if (window.App && window.App.showToast) {
      window.App.showToast('⏳ Đang gửi lệnh dịch chuyển vào Đấu Trường...', 'info');
    }

    try {
      const res = await fetch('/api/arena/matches/teleport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steam_id: sid })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Lỗi dịch chuyển');

      if (window.App && window.App.showToast) {
        window.App.showToast(data.message || '✅ Đã gửi lệnh dịch chuyển thành công!', 'success');
      } else {
        alert(data.message || 'Đã gửi lệnh dịch chuyển thành công!');
      }
      return true;
    } catch (err) {
      const errMsg = err.message || 'Lỗi kết nối máy chủ';
      if (window.App && window.App.showToast) {
        window.App.showToast(`⚠️ ${errMsg}`, 'error');
      }
      alert(`⚠️ Không thể dịch chuyển: ${errMsg}`);
      return false;
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
