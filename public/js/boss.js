// =========================================================================
// MODULE SĂN KHỦNG LONG AI TOÀN SERVER (AI DINOSAUR HUNTING EVENT)
// Chu kỳ: Reset sau 1 ngày (24 giờ)
// Hệ thống TỰ ĐỘNG trao thưởng 1.000 Xu cho người đứng Top 1 khi hết ngày!
// =========================================================================

const BossHunt = {
  data: null,
  pollTimer: null,
  countdownTimer: null,

  // Nhận diện thông minh tất cả loài AI / Động vật / Khủng long trên đảo
  getSpeciesInfo(rawSpecies) {
    if (!rawSpecies) return { name: 'Động vật AI', icon: '🦖' };
    const clean = String(rawSpecies).toLowerCase().replace(/_/g, ' ').trim();

    if (clean.includes('deer')) return { name: 'Hươu Rừng', icon: '🦌' };
    if (clean.includes('boar') || clean.includes('pig')) return { name: 'Lợn Rừng', icon: '🐗' };
    if (clean.includes('goat')) return { name: 'Dê Núi', icon: '🐐' };
    if (clean.includes('dryo')) return { name: 'Dryosaurus', icon: '🦎' };
    if (clean.includes('turtle')) return { name: 'Rùa Biển', icon: '🐢' };
    if (clean.includes('chicken')) return { name: 'Gà Rừng', icon: '🐔' };
    if (clean.includes('rabbit')) return { name: 'Thỏ Rừng', icon: '🐇' };
    if (clean.includes('psittaco') || clean.includes('taco')) return { name: 'Taco (Két)', icon: '🦜' };
    if (clean.includes('compy') || clean.includes('compsognathus')) return { name: 'Compy AI', icon: '🦎' };
    if (clean.includes('galli')) return { name: 'Gallimimus', icon: '🦤' };
    if (clean.includes('pachy')) return { name: 'Pachy', icon: '🦏' };
    if (clean.includes('tenonto')) return { name: 'Tenonto', icon: '🦕' };
    if (clean.includes('tyranno') || clean.includes('trex')) return { name: 'T-Rex AI', icon: '🦖' };
    if (clean.includes('spino')) return { name: 'Spino AI', icon: '🐊' };
    if (clean.includes('giga')) return { name: 'Giga AI', icon: '🦖' };
    if (clean.includes('carno')) return { name: 'Carno AI', icon: '🐂' };
    if (clean.includes('cerato')) return { name: 'Cerato AI', icon: '🦏' };
    if (clean.includes('stego')) return { name: 'Stego AI', icon: '🦕' };
    if (clean.includes('frog')) return { name: 'Ếch AI', icon: '🐸' };
    if (clean.includes('crab')) return { name: 'Cua Biển', icon: '🦀' };

    return { name: rawSpecies.replace(/_/g, ' '), icon: '🦖' };
  },

  getSpeciesBadge(rawSpecies, count) {
    if (!rawSpecies) return '';
    const info = this.getSpeciesInfo(rawSpecies);
    return `<span style="background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 6px; padding: 4px 9px; font-size: 0.78rem; color: #cbd5e1; display: inline-flex; align-items: center; gap: 5px; margin: 2px;">
      <span>${info.icon}</span>
      <span>${info.name}:</span>
      <b style="color: #38bdf8; font-size: 0.85rem;">${count}</b>
    </span>`;
  },

  async render() {
    const container = document.getElementById('view-boss');
    if (!container) return;

    container.innerHTML = `
      <div style="text-align: center; padding: 60px 20px;">
        <div class="spinner" style="margin: 0 auto 16px;"></div>
        <p style="color: #94a3b8; font-size: 1.05rem;">Đang kết nối sự kiện Săn AI từ máy chủ...</p>
      </div>
    `;

    await this.fetchData();
    this.startAutoRefresh();
  },

  async fetchData() {
    const user = JSON.parse(localStorage.getItem('steam_user') || 'null');
    const steamParam = (user && user.steamId) ? `&steam_id=${user.steamId}` : '';
    const adminParam = (user && user.steamId) ? `&admin_steam_id=${user.steamId}` : '';

    try {
      const res = await fetch(`/api/ai-hunt?_t=${Date.now()}${steamParam}${adminParam}`);
      if (res.ok) {
        this.data = await res.json();
        this.renderUI();
      }
    } catch (e) {
      console.error("[AIHunt] Lỗi nạp dữ liệu:", e);
    }
  },

  startAutoRefresh() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = setInterval(() => {
      const curTab = document.body.getAttribute('data-current-tab');
      if (curTab === 'boss' || curTab === 'ai-hunt') {
        this.fetchData();
      }
    }, 3500);

    if (this.countdownTimer) clearInterval(this.countdownTimer);
    this.countdownTimer = setInterval(() => {
      const curTab = document.body.getAttribute('data-current-tab');
      if (curTab === 'boss' || curTab === 'ai-hunt') {
        this.updateCountdown();
      }
    }, 1000);
  },

  updateCountdown() {
    const cdElem = document.getElementById('ai-hunt-countdown');
    if (!cdElem || !this.data || !this.data.ai_hunt) return;

    const hunt = this.data.ai_hunt;
    let remainingSec = 0;

    if (hunt.expires_at) {
      const expiresTs = new Date(hunt.expires_at).getTime();
      const nowTs = Date.now();
      remainingSec = Math.max(0, Math.floor((expiresTs - nowTs) / 1000));
    } else if (hunt.time_remaining_seconds !== undefined) {
      remainingSec = Math.max(0, hunt.time_remaining_seconds);
    }

    if (remainingSec <= 0) {
      cdElem.innerHTML = `<span style="color: #10b981; font-size: 1rem;">🎉 Đang tự động trao thưởng & sang ngày mới...</span>`;
      return;
    }

    const hours = Math.floor(remainingSec / 3600);
    const minutes = Math.floor((remainingSec % 3600) / 60);
    const seconds = remainingSec % 60;
    const pad = (n) => String(n).padStart(2, '0');

    cdElem.innerHTML = `⏱️ ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  },

  renderUI() {
    const container = document.getElementById('view-boss');
    if (!container || !this.data) return;

    const hunt = this.data.ai_hunt || this.data.boss || {};
    const isAdmin = this.data.is_admin || window.isUserAdmin || false;
    const isSettled = !!hunt.is_settled;
    const leaderboard = hunt.leaderboard || [];
    const topHunter = hunt.top_hunter || (leaderboard.length > 0 && leaderboard[0].kills > 0 ? leaderboard[0] : null);
    const rewardXu = hunt.reward_xu || 1000;
    const totalAiKills = hunt.total_ai_kills || 0;
    const preySummary = hunt.prey_summary || {};
    const rewardHistory = hunt.reward_history || [];
    const seasonId = hunt.season_id || 'Mùa hôm nay';

    let statusBadge = '';
    if (!isSettled) {
      statusBadge = `<span style="background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.4); padding: 6px 14px; border-radius: 20px; font-weight: 700; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 6px;">
        <span style="width: 8px; height: 8px; border-radius: 50%; background: #10b981; animation: pulse 1.5s infinite;"></span>
        🟢 ĐANG DIỄN RA (${seasonId.toUpperCase()})
      </span>`;
    } else {
      statusBadge = `<span style="background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); padding: 6px 14px; border-radius: 20px; font-weight: 700; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 6px;">
        🏆 ĐÃ TRAO THƯỞNG (+1.000 XU)
      </span>`;
    }

    container.innerHTML = `
      <style>
        .ai-hunt-card {
          background: linear-gradient(145deg, rgba(20, 24, 40, 0.85), rgba(12, 16, 28, 0.95));
          border: 1px solid rgba(56, 189, 248, 0.25);
          border-radius: 14px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4), 0 0 20px rgba(56, 189, 248, 0.08);
          position: relative;
        }
        .spotlight-card {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(15, 23, 42, 0.95));
          border: 2px solid rgba(245, 158, 11, 0.5);
          border-radius: 14px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 0 25px rgba(245, 158, 11, 0.2);
          position: relative;
        }
        .stat-chip {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 14px 18px;
          border-radius: 10px;
        }
        .stat-chip-label {
          font-size: 0.78rem;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        .stat-chip-val {
          font-size: 1.25rem;
          font-weight: 800;
          color: #fff;
        }
      </style>

      <!-- HERO BANNER SỰ KIỆN SĂN AI & ĐỒNG HỒ ĐẾM NGƯỢC 24H -->
      <div class="card" style="margin-bottom: 24px; background: linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(15, 23, 42, 0.95)); border: 1px solid rgba(14, 165, 233, 0.4);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div style="max-width: 650px;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 6px;">
              <span style="font-size: 2.2rem;">🏹</span>
              <h1 style="font-size: 1.85rem; font-weight: 900; margin: 0; background: linear-gradient(90deg, #38bdf8, #818cf8, #fbbf24); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                SỰ KIỆN SĂN KHỦNG LONG AI TOÀN SERVER
              </h1>
            </div>
            <p style="color: #cbd5e1; font-size: 0.95rem; margin: 0 0 8px;">
              Săn lùng các loài khủng long và động vật AI trên toàn bản đồ Gateway &bull; <b>Ai săn được nhiều AI nhất trong ngày sẽ được hệ thống TỰ ĐỘNG trao thưởng 💰 1.000 XU!</b>
            </p>
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
              ${statusBadge}
              <span style="background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); padding: 4px 10px; border-radius: 12px; font-size: 0.78rem; font-weight: 700;">
                🔄 Reset sau 1 ngày & tự động phát thưởng
              </span>
            </div>
          </div>

          <!-- ĐỒNG HỒ ĐẾM NGƯỢC CHU KỲ 1 NGÀY -->
          <div style="background: rgba(0, 0, 0, 0.55); border: 2px solid rgba(245, 158, 11, 0.5); border-radius: 14px; padding: 14px 20px; text-align: right; box-shadow: 0 6px 20px rgba(0,0,0,0.4);">
            <div style="font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 4px;">
              ⏳ THỜI GIAN CÒN LẠI TRONG NGÀY
            </div>
            <div id="ai-hunt-countdown" style="font-size: 1.6rem; font-weight: 900; color: #fbbf24; font-family: 'Courier New', monospace; letter-spacing: 1.5px; text-shadow: 0 0 12px rgba(245, 158, 11, 0.5);">
              --:--:--
            </div>
            <div style="font-size: 0.76rem; color: #10b981; font-weight: 700; margin-top: 4px; display: flex; align-items: center; justify-content: flex-end; gap: 5px;">
              <span>🤖</span>
              <span>Hết giờ: Tự trao 1.000 Xu & sang ngày mới</span>
            </div>
          </div>
        </div>
      </div>

      <!-- SPOTLIGHT TOP 1 THỢ SĂN ĐỈNH CAO -->
      <div class="spotlight-card">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;">
          <div style="display: flex; align-items: center; gap: 18px;">
            <div style="width: 76px; height: 76px; border-radius: 16px; background: radial-gradient(circle, rgba(245, 158, 11, 0.4), rgba(0,0,0,0.8)); border: 2px solid #fbbf24; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; box-shadow: 0 0 20px rgba(245, 158, 11, 0.4);">
              👑
            </div>
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 0.8rem; font-weight: 800; background: rgba(245, 158, 11, 0.25); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); padding: 2px 8px; border-radius: 4px;">
                  TOP 1 THỢ SĂN HÔM NAY
                </span>
                <span style="font-size: 0.8rem; color: #10b981; font-weight: 700;">(🤖 Hệ thống sẽ tự động chuyển 1.000 Xu khi hết giờ)</span>
              </div>
              <h2 style="font-size: 1.6rem; font-weight: 900; margin: 4px 0 2px; color: #fff;">
                ${topHunter ? topHunter.name : 'Chưa có thợ săn nào ghi điểm hôm nay'}
              </h2>
              <div style="color: #94a3b8; font-size: 0.85rem; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                ${topHunter ? `
                  <span>Steam: <b style="color: #cbd5e1;">${topHunter.steam_id}</b></span> &bull;
                  <span>Dino sử dụng: <b style="color: #38bdf8;">${topHunter.species || 'Dinosaur'}</b></span> &bull;
                  <span>Con mồi gần nhất: <b style="color: #f43f5e;">${this.getSpeciesInfo(topHunter.last_prey).name}</b></span>
                ` : `
                  <span>Hãy vào game săn khủng long AI ngay để đứng đầu bảng hôm nay và ẵm 1.000 Xu!</span>
                `}
              </div>
            </div>
          </div>

          <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
            <div style="font-size: 0.85rem; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Thành tích & Phần thưởng</div>
            <div style="font-size: 1.8rem; font-weight: 900; color: #fbbf24; text-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);">
              ${topHunter ? `${topHunter.kills} CON AI` : '0 CON'}
            </div>
            <div style="background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 8px; padding: 4px 12px; color: #10b981; font-weight: 800; font-size: 0.95rem;">
              🎁 TỰ ĐỘNG THƯỞNG: +1.000 XU
            </div>
          </div>
        </div>

        ${topHunter && topHunter.prey_breakdown && Object.keys(topHunter.prey_breakdown).length > 0 ? `
          <div style="margin-top: 16px; padding-top: 14px; border-top: 1px solid rgba(255, 255, 255, 0.08); display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <span style="font-size: 0.82rem; color: #94a3b8; font-weight: 700;">CHI TIẾT CON MỒI ĐÃ SĂN:</span>
            ${Object.entries(topHunter.prey_breakdown).map(([sp, cnt]) => this.getSpeciesBadge(sp, cnt)).join('')}
          </div>
        ` : ''}
      </div>

      <!-- LƯỚI THÔNG SỐ SỰ KIỆN SĂN AI -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 14px; margin-bottom: 24px;">
        <div class="stat-chip">
          <div class="stat-chip-label">🎯 Tổng AI Bị Săn Hôm Nay</div>
          <div class="stat-chip-val" style="color: #38bdf8;">${totalAiKills.toLocaleString('vi-VN')} Con</div>
        </div>
        <div class="stat-chip">
          <div class="stat-chip-label">💰 Giải Thưởng Top 1</div>
          <div class="stat-chip-val" style="color: #fbbf24;">${rewardXu.toLocaleString('vi-VN')} Xu (Tự Động)</div>
        </div>
        <div class="stat-chip">
          <div class="stat-chip-label">⏱️ Chu Kỳ Reset</div>
          <div class="stat-chip-val" style="color: #a855f7;">Sau 1 Ngày (24h)</div>
        </div>
        <div class="stat-chip">
          <div class="stat-chip-label">🏹 Thợ Săn Đang Đua Top</div>
          <div class="stat-chip-val" style="color: #10b981;">${leaderboard.length} Người Chơi</div>
        </div>
      </div>

      <!-- BẢNG ĐIỀU KHIỂN DÀNH CHO ADMIN -->
      ${isAdmin ? this.renderAdminControls(hunt, topHunter) : ''}

      <!-- BẢNG XẾP HẠNG THỢ SĂN AI (LIVE LEADERBOARD) -->
      <div class="card" style="margin-bottom: 24px;">
        <div class="card-header" style="border: none; padding-bottom: 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; flex-wrap: wrap; gap: 12px;">
            <div>
              <h2 class="card-title" style="display: flex; align-items: center; gap: 8px;">
                <span>🎯</span> BẢNG XẾP HẠNG SĂN AI TRONG NGÀY (TOP 1 NHẬN 1.000 XU)
              </h2>
              <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 4px;">
                Tự động ghi nhận số lượng khủng long AI bị cắn chết trên toàn server. Khi hết 1 ngày, hệ thống sẽ tự động trao 1.000 Xu cho Top 1!
              </p>
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="btn-primary" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; font-weight: 700; border-radius: 8px; font-size: 0.85rem;" onclick="BossHunt.fetchData()">
                🔄 Làm Mới
              </button>
            </div>
          </div>
        </div>

        <div style="margin-top: 16px; overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
            <thead>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: #94a3b8;">
                <th style="padding: 12px 14px; width: 70px;">Hạng</th>
                <th style="padding: 12px 14px;">Thợ Săn</th>
                <th style="padding: 12px 14px; text-align: center; width: 140px;">Số AI Đã Săn</th>
                <th style="padding: 12px 14px;">Chi Tiết Con Mồi</th>
                <th style="padding: 12px 14px; width: 160px;">Hoạt Động Gần Nhất</th>
                <th style="padding: 12px 14px; text-align: right; width: 220px;">Phần Thưởng</th>
              </tr>
            </thead>
            <tbody>
              ${leaderboard.length > 0 ? leaderboard.map((p, idx) => {
                const isTop1 = (idx === 0 && p.kills > 0);
                const breakdown = p.prey_breakdown || {};
                const topDiff = (topHunter && topHunter.kills > p.kills) ? (topHunter.kills - p.kills) : 0;

                return `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); background: ${isTop1 ? 'rgba(245, 158, 11, 0.08)' : 'transparent'};">
                  <td style="padding: 14px; font-weight: 900; font-size: 1.05rem; color: ${idx === 0 ? '#fbbf24' : idx === 1 ? '#cbd5e1' : idx === 2 ? '#b45309' : '#94a3b8'};">
                    ${idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                  </td>
                  <td style="padding: 14px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <b style="color: #fff; font-size: 0.95rem;">${p.name || 'Thợ săn'}</b>
                      ${isTop1 ? '<span style="background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); padding: 1px 6px; border-radius: 4px; font-size: 0.72rem; font-weight: 800;">TOP 1</span>' : ''}
                    </div>
                    <div style="font-size: 0.78rem; color: #64748b; margin-top: 2px;">
                      Steam: ${p.steam_id} &bull; Dino: <span style="color: #38bdf8;">${p.species || 'Dino'}</span>
                    </div>
                  </td>
                  <td style="padding: 14px; text-align: center;">
                    <span style="font-size: 1.3rem; font-weight: 900; color: ${isTop1 ? '#fbbf24' : '#38bdf8'};">
                      ${p.kills}
                    </span>
                    <span style="font-size: 0.8rem; color: #94a3b8; display: block;">con AI</span>
                  </td>
                  <td style="padding: 14px;">
                    <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                      ${Object.keys(breakdown).length > 0 ?
                        Object.entries(breakdown).map(([sp, cnt]) => this.getSpeciesBadge(sp, cnt)).join('')
                        : '<span style="color: #64748b; font-size: 0.8rem;">Đang cập nhật...</span>'}
                    </div>
                  </td>
                  <td style="padding: 14px; color: #94a3b8; font-size: 0.82rem;">
                    ${p.last_kill_at ? new Date(p.last_kill_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date(p.last_kill_at).toLocaleDateString('vi-VN') : 'Vừa xong'}
                  </td>
                  <td style="padding: 14px; text-align: right;">
                    ${isTop1 ? `
                      <span style="background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.4); padding: 5px 12px; border-radius: 6px; font-weight: 800; font-size: 0.9rem; display: inline-block;">
                        💰 +${rewardXu.toLocaleString('vi-VN')} Xu (Tự Động)
                      </span>
                    ` : `
                      <span style="color: #94a3b8; font-size: 0.8rem;">
                        Kém Top 1: <b style="color: #f43f5e;">-${topDiff}</b> con
                      </span>
                    `}
                  </td>
                </tr>
              `;}).join('') : `
                <tr>
                  <td colspan="6" style="text-align: center; padding: 36px; color: #64748b;">
                    Chưa có người chơi nào săn AI trong ngày hôm nay. Hãy vào game và săn khủng long AI đầu tiên!
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      </div>

      <!-- BẢNG VÀNG THỢ SĂN VÔ ĐỊCH QUA CÁC NGÀY -->
      <div class="card">
        <div class="card-header" style="border: none; padding-bottom: 0;">
          <div>
            <h2 class="card-title" style="display: flex; align-items: center; gap: 8px;">
              <span>🏆</span> BẢNG VÀNG QUÁN QUÂN QUA CÁC NGÀY (ĐÃ NHẬN 1.000 XU)
            </h2>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 4px;">
              Lịch sử các Thợ Săn Vô Địch được hệ thống tự động chốt và trao 1.000 Xu sau mỗi 24 giờ
            </p>
          </div>
        </div>

        <div style="margin-top: 16px; overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
            <thead>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: #94a3b8;">
                <th style="padding: 12px 14px; width: 140px;">Mùa / Ngày</th>
                <th style="padding: 12px 14px;">Thợ Săn Đoạt Giải</th>
                <th style="padding: 12px 14px; text-align: center;">Số AI Đã Săn</th>
                <th style="padding: 12px 14px;">Thời Điểm Trao Giải</th>
                <th style="padding: 12px 14px; text-align: right;">Phần Thưởng</th>
              </tr>
            </thead>
            <tbody>
              ${rewardHistory.length > 0 ? rewardHistory.map((h, idx) => `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                  <td style="padding: 12px 14px; color: #fbbf24; font-weight: 800;">
                    ${h.season_id || `Mùa ${rewardHistory.length - idx}`}
                  </td>
                  <td style="padding: 12px 14px;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                      <b style="color: #fff;">${h.winner_name || 'Quán Quân'}</b>
                      ${h.auto_settled ? '<span style="background: rgba(16, 185, 129, 0.2); color: #10b981; font-size: 0.72rem; padding: 1px 6px; border-radius: 4px; font-weight: 700;">Tự động</span>' : ''}
                    </div>
                    <div style="font-size: 0.78rem; color: #64748b;">(${h.winner_steam_id}) &bull; ${h.species || 'Dino'}</div>
                  </td>
                  <td style="padding: 12px 14px; text-align: center; color: #38bdf8; font-weight: 800;">
                    ${h.kills || 0} con AI
                  </td>
                  <td style="padding: 12px 14px; color: #94a3b8; font-size: 0.82rem;">
                    ${h.settled_at ? new Date(h.settled_at).toLocaleString('vi-VN') : 'Đã trao'}
                  </td>
                  <td style="padding: 12px 14px; text-align: right; color: #10b981; font-weight: 800;">
                    +${(h.reward_xu || 1000).toLocaleString('vi-VN')} Xu
                  </td>
                </tr>
              `).join('') : `
                <tr>
                  <td colspan="5" style="text-align: center; padding: 32px; color: #64748b;">
                    Chưa có mùa săn nào kết thúc. Mùa săn hôm nay đang đếm ngược và sẽ tự động trao thưởng!
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.updateCountdown();
  },

  renderAdminControls(hunt, topHunter) {
    const topName = topHunter ? topHunter.name : 'Chưa có';
    const topKills = topHunter ? topHunter.kills : 0;

    return `
      <div class="card" style="border: 1px solid rgba(245, 158, 11, 0.4); background: linear-gradient(135deg, rgba(30, 20, 10, 0.65), rgba(15, 23, 42, 0.95)); margin-bottom: 24px;">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 14px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 1.6rem;">👑</span>
            <div>
              <h3 style="margin: 0; color: #fbbf24; font-size: 1.15rem; font-weight: 800;">
                BẢNG ĐIỀU KHIỂN SỰ KIỆN SĂN AI (QUẢN TRỊ VIÊN)
              </h3>
              <p style="margin: 2px 0 0; color: #94a3b8; font-size: 0.82rem;">
                🤖 Hệ thống đang chạy <b>TỰ ĐỘNG 24/7</b>: Tự động đếm AI, hết 1 ngày tự động thưởng 1.000 Xu cho Top 1 và reset ngày mới!
              </p>
            </div>
          </div>
          <span style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 700;">
            TỰ ĐỘNG HÓA 24H: BẬT 🟢
          </span>
        </div>

        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
          <button class="btn-primary" style="background: linear-gradient(135deg, #10b981, #059669); font-size: 0.92rem; font-weight: 800; padding: 10px 20px; border-radius: 8px; display: inline-flex; align-items: center; gap: 8px; cursor: pointer;" onclick="BossHunt.settleSeason()">
            🏆 TRAO THƯỞNG 1.000 XU NGAY (${topName} - ${topKills} AI)
          </button>

          <button class="btn-primary" style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); font-size: 0.92rem; font-weight: 800; padding: 10px 20px; border-radius: 8px; display: inline-flex; align-items: center; gap: 8px; cursor: pointer;" onclick="BossHunt.startNewSeason()">
            🎯 KHỞI TRANH NGÀY SĂN MỚI NGAY (RESET 24H)
          </button>
        </div>
      </div>
    `;
  },

  async settleSeason() {
    const hunt = (this.data && this.data.ai_hunt) || {};
    const leaderboard = hunt.leaderboard || [];
    if (!leaderboard || leaderboard.length === 0 || leaderboard[0].kills <= 0) {
      alert("⚠️ Hiện tại chưa có người chơi nào săn được AI để trao thưởng!");
      return;
    }

    const topHunter = leaderboard[0];
    const confirmMsg = `🏆 XÁC NHẬN TRAO THƯỞNG TOP 1 SĂN AI:\n\n` +
      `Thợ Săn Quán Quân: ${topHunter.name}\n` +
      `Steam ID: ${topHunter.steam_id}\n` +
      `Số AI đã săn: ${topHunter.kills} con\n` +
      `Phần Thưởng: +1.000 Xu\n\n` +
      `Hệ thống sẽ cộng ngay 1.000 Xu vào ví và thông báo toàn server!`;

    if (!confirm(confirmMsg)) return;

    if (window.App && App.showToast) App.showToast("⏳ Đang xử lý trao thưởng 1.000 Xu...");

    try {
      const user = JSON.parse(localStorage.getItem('steam_user') || 'null');
      const adminSid = user ? user.steamId : '';
      const res = await fetch(`/api/ai-hunt/settle?admin_steam_id=${adminSid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const resData = await res.json();
      if (resData.ok) {
        if (window.App && App.showToast) App.showToast(resData.message || "✅ Đã trao thưởng thành công!");
        else alert(resData.message || "✅ Đã trao thưởng thành công!");
        await this.fetchData();
      } else {
        alert("❌ " + (resData.error || "Lỗi trao thưởng!"));
      }
    } catch (e) {
      alert("❌ Lỗi: " + e.message);
    }
  },

  async startNewSeason() {
    const confirmMsg = `🎯 XÁC NHẬN KHỞI TRANH NGÀY SĂN AI MỚI:\n\n` +
      `Bảng xếp hạng trong ngày sẽ được làm mới về 0 cho tất cả người chơi.\n` +
      `Đồng hồ đếm ngược 24 giờ sẽ được thiết lập lại từ đầu.\n\n` +
      `Bạn có chắc chắn muốn khởi tranh ngày săn mới ngay bây giờ?`;

    if (!confirm(confirmMsg)) return;

    if (window.App && App.showToast) App.showToast("⏳ Đang khởi tạo ngày săn AI mới...");

    try {
      const user = JSON.parse(localStorage.getItem('steam_user') || 'null');
      const adminSid = user ? user.steamId : '';
      const res = await fetch(`/api/ai-hunt/reset?admin_steam_id=${adminSid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const resData = await res.json();
      if (resData.ok) {
        if (window.App && App.showToast) App.showToast(resData.message || "🎯 Đã bắt đầu ngày săn mới!");
        else alert(resData.message || "🎯 Đã bắt đầu ngày săn mới!");
        await this.fetchData();
      } else {
        alert("❌ " + (resData.error || "Lỗi khởi tạo!"));
      }
    } catch (e) {
      alert("❌ Lỗi: " + e.message);
    }
  },

  async teleportToBoss() {
    const user = JSON.parse(localStorage.getItem('steam_user') || 'null');
    if (!user || !user.steamId) {
      alert("Vui lòng đăng nhập Steam để thực hiện dịch chuyển!");
      return;
    }
    if (!confirm("Bạn có muốn dịch chuyển đến Khu Săn Bắn ngay bây giờ?")) return;

    if (window.App && App.showToast) App.showToast("⏳ Đang yêu cầu dịch chuyển...");
    try {
      const res = await fetch('/api/ai-hunt/teleport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steam_id: user.steamId })
      });
      const resData = await res.json();
      if (resData.ok) {
        if (window.App && App.showToast) App.showToast(resData.message || "✅ Dịch chuyển thành công!");
        else alert(resData.message || "✅ Dịch chuyển thành công!");
      } else {
        alert(resData.error || "Lỗi dịch chuyển!");
      }
    } catch (e) {
      alert("Lỗi kết nối: " + e.message);
    }
  }
};

window.BossHunt = BossHunt;
window.AIHunt = BossHunt;
