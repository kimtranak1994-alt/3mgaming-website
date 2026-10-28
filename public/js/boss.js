// =========================================================================
// MODULE SĂN BOSS TRICERATOPS 100.000 HP (BOSS HUNTING & PROPORTIONAL REWARDS)
// Sát thương Boss mặc định: 1.000 Dame / Hít
// Trừ HP Boss theo đúng lực cắn / dame dino của người chơi
// Phần thưởng 5.000 Xu chia cho tất cả người chơi tham gia cắn theo tỉ lệ Dame
// =========================================================================

const BossHunt = {
  data: null,
  pollTimer: null,

  async render() {
    const container = document.getElementById('view-boss');
    if (!container) return;

    container.innerHTML = `
      <div style="text-align: center; padding: 60px 20px;">
        <div class="spinner" style="margin: 0 auto 16px;"></div>
        <p style="color: #94a3b8; font-size: 1.05rem;">Đang kết nối dữ liệu Săn Boss từ máy chủ...</p>
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
      const res = await fetch(`/api/boss?_t=${Date.now()}${steamParam}${adminParam}`);
      if (res.ok) {
        this.data = await res.json();
        this.renderUI();
      }
    } catch (e) {
      console.error("[BossHunt] Lỗi nạp dữ liệu:", e);
    }
  },

  startAutoRefresh() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = setInterval(() => {
      if (document.body.getAttribute('data-current-tab') === 'boss') {
        this.fetchData();
      }
    }, 3500);
  },

  renderUI() {
    const container = document.getElementById('view-boss');
    if (!container || !this.data) return;

    const boss = this.data.boss || {};
    const isAdmin = this.data.is_admin || window.isUserAdmin || false;
    const isActive = !!boss.active;
    const maxHp = boss.max_hp || 100000;
    const curHp = isActive ? Math.max(0, boss.current_hp !== undefined ? boss.current_hp : maxHp) : 0;
    const hpPct = Math.min(100, Math.max(0, Math.round((curHp / maxHp) * 100)));
    const killHistory = boss.kill_history || [];
    const dpsRanking = boss.dps_ranking || [];
    const lastRewards = boss.last_rewards || [];

    let statusBadge = '';
    if (isActive && curHp > 0) {
      statusBadge = `<span style="background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.4); padding: 6px 14px; border-radius: 20px; font-weight: 700; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 6px;">
        <span style="width: 8px; height: 8px; border-radius: 50%; background: #10b981; animation: pulse 1.5s infinite;"></span>
        🟢 ĐANG HOẠT ĐỘNG (SẴN SÀNG CHIẾN ĐẤU)
      </span>`;
    } else if (isActive && curHp <= 0) {
      statusBadge = `<span style="background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.4); padding: 6px 14px; border-radius: 20px; font-weight: 700; font-size: 0.85rem;">
        💀 VỪA BỊ HẠ GỤC (+5.000 XU ĐÃ CHIA THƯỞNG)
      </span>`;
    } else {
      statusBadge = `<span style="background: rgba(148, 163, 184, 0.2); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.3); padding: 6px 14px; border-radius: 20px; font-weight: 700; font-size: 0.85rem;">
        ⚪ CHƯA KÍCH HOẠT (CHỜ ADMIN THẢ BOSS)
      </span>`;
    }

    container.innerHTML = `
      <style>
        .boss-card {
          background: linear-gradient(145deg, rgba(26, 16, 37, 0.85), rgba(15, 10, 24, 0.95));
          border: 1px solid rgba(255, 42, 133, 0.3);
          border-radius: 14px;
          padding: 28px;
          margin-bottom: 24px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 42, 133, 0.1);
          position: relative;
          overflow: hidden;
        }
        .boss-hp-track {
          width: 100%;
          height: 34px;
          background: rgba(0, 0, 0, 0.65);
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.15);
          position: relative;
          box-shadow: inset 0 2px 6px rgba(0,0,0,0.8);
          margin: 16px 0;
        }
        .boss-hp-bar {
          height: 100%;
          background: linear-gradient(90deg, #dc2626, #ef4444, #f59e0b, #ec4899);
          transition: width 0.4s ease;
          box-shadow: 0 0 16px rgba(239, 68, 68, 0.6);
        }
        .boss-hp-text {
          position: absolute;
          width: 100%;
          top: 0;
          left: 0;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.95rem;
          color: #ffffff;
          text-shadow: 0 2px 4px rgba(0,0,0,0.95);
          letter-spacing: 0.5px;
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
          font-size: 1.15rem;
          font-weight: 800;
          color: #fff;
        }
        .dps-bar-bg {
          width: 100%;
          height: 8px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 4px;
          overflow: hidden;
          margin-top: 6px;
        }
        .dps-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #ec4899);
          border-radius: 4px;
        }
      </style>

      <!-- HERO BANNER SĂN BOSS -->
      <div class="card" style="margin-bottom: 24px; background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(15, 23, 42, 0.9)); border: 1px solid rgba(239, 68, 68, 0.4);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
              <span style="font-size: 2rem;">👑</span>
              <h1 style="font-size: 1.8rem; font-weight: 900; margin: 0; background: linear-gradient(90deg, #f87171, #fbbf24, #f43f5e); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                ĐẤU TRƯỜNG SĂN BOSS HƯƠU THẦN THOẠI
              </h1>
            </div>
            <p style="color: #cbd5e1; font-size: 0.95rem; margin: 0;">
              Thách thức <b>Boss Hươu AI 100.000 HP</b> • Sát thương mặc định <b>1.000 Dame / Hít</b> • Kho thưởng <b>💰 5.000 Xu</b> chia đều theo tỉ lệ sát thương đóng góp!
            </p>
          </div>
          <div>
            ${statusBadge}
          </div>
        </div>
      </div>

      <!-- CARD THÔNG TIN BOSS VÀ THANH MÁU -->
      <div class="boss-card">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 20px;">
          <div style="display: flex; align-items: center; gap: 18px;">
            <div style="width: 80px; height: 80px; border-radius: 16px; background: radial-gradient(circle, rgba(239, 68, 68, 0.4), rgba(0,0,0,0.8)); border: 2px solid #ef4444; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; box-shadow: 0 0 20px rgba(239, 68, 68, 0.5);">
              🦌
            </div>
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <h2 style="font-size: 1.5rem; font-weight: 900; margin: 0; color: #fff;">
                  ${boss.boss_name || '👑 BOSS HƯƠU BẠO THẦN (100.000 HP)'}
                </h2>
                <span class="badge" style="background: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.4); font-size: 0.75rem; font-weight: 800;">
                  BẠO THẦN HƯƠU 100K HP
                </span>
              </div>
              <p style="color: #94a3b8; font-size: 0.88rem; margin: 4px 0 0;">
                Khu vực xuất hiện: <b style="color: #38bdf8;">📍 ${boss.location_name || 'ĐẤU TRƯỜNG'}</b> &bull; Boss sống mãi đến khi Admin bấm Tắt!
              </p>
            </div>
          </div>

          <div style="display: flex; gap: 10px;">
            <button class="btn-primary" style="background: linear-gradient(135deg, #0284c7, #0369a1); display: inline-flex; align-items: center; gap: 6px; padding: 10px 20px; font-weight: 700; border-radius: 8px;" onclick="BossHunt.teleportToBoss()">
              🚀 Dịch Chuyển Đến Đấu Trường
            </button>
            <button class="btn-primary" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); display: inline-flex; align-items: center; gap: 6px; padding: 10px 16px; font-weight: 700; border-radius: 8px;" onclick="BossHunt.fetchData()">
              🔄 Làm Mới
            </button>
          </div>
        </div>

        <!-- THANH MÁU BOSS 100K HP -->
        <div style="margin-top: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 6px;">
            <span style="font-weight: 800; font-size: 0.95rem; color: #ef4444; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px;">
              <span>🩸 SINH LỰC BOSS:</span>
            </span>
            <span style="font-size: 0.9rem; color: #f1f5f9; font-weight: 700;">
              ${curHp.toLocaleString('vi-VN')} / ${maxHp.toLocaleString('vi-VN')} HP (${hpPct}%)
            </span>
          </div>

          <div class="boss-hp-track">
            <div class="boss-hp-bar" style="width: ${hpPct}%;"></div>
            <div class="boss-hp-text">
              ${isActive ? (curHp > 0 ? `${curHp.toLocaleString('vi-VN')} / ${maxHp.toLocaleString('vi-VN')} HP` : '💀 ĐÃ BỊ TIÊU DIỆT') : 'CHƯA KÍCH HOẠT'}
            </div>
          </div>
        </div>

        <!-- LƯỚI THÔNG SỐ CHIẾN ĐẤU CẬP NHẬT -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 14px; margin-top: 20px;">
          <div class="stat-chip">
            <div class="stat-chip-label">🛡️ Máu Tối Đa</div>
            <div class="stat-chip-val" style="color: #ef4444;">100.000 HP</div>
          </div>
          <div class="stat-chip">
            <div class="stat-chip-label">⚔️ Sát Thương Boss</div>
            <div class="stat-chip-val" style="color: #f43f5e;">1.000 Dame / Hít</div>
          </div>
          <div class="stat-chip">
            <div class="stat-chip-label">🤖 Cơ Chế AI Tấn Công</div>
            <div class="stat-chip-val" style="color: #a855f7;">Tự Động Phản Đòn & Quét 15m</div>
          </div>
          <div class="stat-chip">
            <div class="stat-chip-label">🦷 Sát Thương Dino Người Chơi</div>
            <div class="stat-chip-val" style="color: #38bdf8;">Trừ HP theo Lực Cắn</div>
          </div>
          <div class="stat-chip">
            <div class="stat-chip-label">💰 Tổng Kho Thưởng Xu</div>
            <div class="stat-chip-val" style="color: #10b981;">5.000 Xu (Chia theo % Dame)</div>
          </div>
        </div>

        ${lastRewards && lastRewards.length > 0 ? `
          <div style="margin-top: 20px; padding: 16px 20px; border-radius: 10px; background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.3);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; flex-wrap: wrap; gap: 8px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 1.3rem;">🎉</span>
                <span style="font-weight: 800; color: #10b981; font-size: 0.95rem;">CHI TIẾT PHÂN CHIA THƯỞNG 5.000 XU LƯỢT VỪA QUA:</span>
              </div>
              <span style="font-size: 0.85rem; color: #94a3b8;">${lastRewards.length} dũng sĩ đã nhận thưởng</span>
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 10px;">
              ${lastRewards.map(r => `
                <div style="background: rgba(0,0,0,0.4); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 8px; padding: 8px 14px; display: inline-flex; align-items: center; gap: 8px;">
                  <span style="font-weight: 700; color: #fff;">${r.name || 'Người chơi'}</span>
                  <span style="color: #94a3b8; font-size: 0.8rem;">(${r.damage_pct !== undefined ? r.damage_pct : (r.percent !== undefined ? r.percent : 0)}%)</span>
                  <span style="color: #fbbf24; font-weight: 800;">+${(r.reward_xu || 0).toLocaleString('vi-VN')} Xu</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>

      <!-- BẢNG ĐIỀU KHIỂN DÀNH CHO ADMIN (NẾU LÀ ADMIN) -->
      ${isAdmin ? this.renderAdminControls(boss) : ''}

      <!-- BẢNG THEO DÕI SÁT THƯƠNG THỜI GIAN THỰC (LIVE DPS RANKING & CHIA THƯỞNG DỰ KIẾN) -->
      <div class="card" style="margin-bottom: 24px;">
        <div class="card-header" style="border: none; padding-bottom: 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; flex-wrap: wrap; gap: 12px;">
            <div>
              <h2 class="card-title" style="display: flex; align-items: center; gap: 8px;">
                <span>🎯</span> BẢNG XẾP HẠNG GÂY DAME & ƯỚC TÍNH PHẦN THƯỞNG
              </h2>
              <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 4px;">
                Mỗi cú cắn của bạn làm tụt HP Boss theo lực cắn và tích lũy % phần thưởng 5.000 Xu hệ thống!
              </p>
            </div>
            <span style="background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); padding: 4px 10px; border-radius: 6px; font-size: 0.8rem; font-weight: 700;">
              CẬP NHẬT TRỰC TIẾP
            </span>
          </div>
        </div>

        <div style="margin-top: 16px; overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
            <thead>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: #94a3b8;">
                <th style="padding: 12px 14px; width: 60px;">Hạng</th>
                <th style="padding: 12px 14px;">Dũng Sĩ Tấn Công</th>
                <th style="padding: 12px 14px; text-align: right;">Sát Thương Gây Ra</th>
                <th style="padding: 12px 14px; width: 220px;">Tỉ Lệ Đóng Góp (%)</th>
                <th style="padding: 12px 14px; text-align: right;">Xu Ước Tính Nhận Được</th>
              </tr>
            </thead>
            <tbody>
              ${dpsRanking.length > 0 ? dpsRanking.map((p, idx) => {
                const pct = p.damage_pct !== undefined ? p.damage_pct : (p.percent !== undefined ? p.percent : 0);
                const estXu = p.estimated_xu !== undefined ? p.estimated_xu : (p.est_reward !== undefined ? p.est_reward : 0);
                return `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); background: ${idx === 0 ? 'rgba(245, 158, 11, 0.05)' : 'transparent'};">
                  <td style="padding: 12px 14px; font-weight: 800; color: ${idx === 0 ? '#fbbf24' : idx === 1 ? '#cbd5e1' : idx === 2 ? '#b45309' : '#94a3b8'};">
                    ${idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                  </td>
                  <td style="padding: 12px 14px;">
                    <b style="color: #fff;">${p.name || 'Người chơi'}</b>
                    <span style="font-size: 0.78rem; color: #64748b; margin-left: 6px;">(${p.steam_id})</span>
                  </td>
                  <td style="padding: 12px 14px; text-align: right; color: #f87171; font-weight: 700;">
                    ${(p.damage || 0).toLocaleString('vi-VN')} HP
                  </td>
                  <td style="padding: 12px 14px;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: #cbd5e1;">
                      <span>Đóng góp:</span>
                      <b>${pct}%</b>
                    </div>
                    <div class="dps-bar-bg">
                      <div class="dps-bar-fill" style="width: ${pct}%;"></div>
                    </div>
                  </td>
                  <td style="padding: 12px 14px; text-align: right; color: #fbbf24; font-weight: 800; font-size: 1rem;">
                    +${estXu.toLocaleString('vi-VN')} Xu
                  </td>
                </tr>
              `;}).join('') : `
                <tr>
                  <td colspan="5" style="text-align: center; padding: 32px; color: #64748b;">
                    Chưa có người chơi nào tấn công Boss trong đợt này. Hãy đến Đấu Trường và cắn Boss để nhận Xu thưởng!
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      </div>

      <!-- BẢNG VÀNG DIỆT BOSS -->
      <div class="card">
        <div class="card-header" style="border: none; padding-bottom: 0;">
          <div>
            <h2 class="card-title" style="display: flex; align-items: center; gap: 8px;">
              <span>🏆</span> BẢNG VÀNG DŨNG SĨ SĂN BOSS
            </h2>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 4px;">
              Lịch sử các đợt hạ gục Boss Triceratops và danh sách chia thưởng 5.000 Xu theo tỉ lệ Dame
            </p>
          </div>
        </div>

        <div style="margin-top: 16px; overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
            <thead>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: #94a3b8;">
                <th style="padding: 12px 14px;">#</th>
                <th style="padding: 12px 14px;">Đòn Kết Liễu</th>
                <th style="padding: 12px 14px;">Danh Sách Người Nhận Thưởng (Tỉ Lệ Dame)</th>
                <th style="padding: 12px 14px;">Thời Gian</th>
                <th style="padding: 12px 14px; text-align: right;">Tổng Thưởng</th>
              </tr>
            </thead>
            <tbody>
              ${killHistory.length > 0 ? killHistory.map((k, idx) => {
                const recList = (k.rewards && k.rewards.length > 0) ? k.rewards : ((k.participants && k.participants.length > 0) ? k.participants : []);
                return `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                  <td style="padding: 12px 14px; color: #f59e0b; font-weight: 800;">#${idx + 1}</td>
                  <td style="padding: 12px 14px;">
                    <b style="color: #fff;">${k.killer_name || 'Chiến Binh'}</b>
                    <div style="font-size: 0.78rem; color: #64748b;">(${k.killer_steam_id})</div>
                  </td>
                  <td style="padding: 12px 14px;">
                    ${recList.length > 0 ? `
                      <div style="display: flex; flex-direction: column; gap: 4px;">
                        ${recList.map(p => `
                          <div style="font-size: 0.82rem; color: #cbd5e1; display: flex; align-items: center; gap: 6px;">
                            <span style="color: #38bdf8; font-weight: 700;">${p.name || 'Dũng Sĩ'}:</span>
                            <span>${(p.damage || 0).toLocaleString('vi-VN')} Dame (${p.damage_pct !== undefined ? p.damage_pct : (p.percent !== undefined ? p.percent : 0)}%)</span>
                            <span style="color: #fbbf24; font-weight: 800;">➜ +${(p.reward_xu || 0).toLocaleString('vi-VN')} Xu</span>
                          </div>
                        `).join('')}
                      </div>
                    ` : `
                      <span style="color: #10b981; font-weight: 700;">+${(k.reward_xu || k.total_reward_xu || 5000).toLocaleString('vi-VN')} Xu</span>
                    `}
                  </td>
                  <td style="padding: 12px 14px; color: #94a3b8; font-size: 0.82rem;">
                    ${new Date(k.killed_at).toLocaleString('vi-VN')}
                  </td>
                  <td style="padding: 12px 14px; text-align: right; color: #10b981; font-weight: 800;">
                    +${(k.total_reward_xu || k.reward_xu || 5000).toLocaleString('vi-VN')} Xu
                  </td>
                </tr>
              `;}).join('') : `
                <tr>
                  <td colspan="5" style="text-align: center; padding: 32px; color: #64748b;">
                    Chưa có đợt diệt Boss nào được ghi nhận. Hãy là những người đầu tiên lập kỳ tích!
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderAdminControls(boss) {
    const isActive = !!boss.active;
    const curHp = boss.current_hp !== undefined ? boss.current_hp : 100000;
    const configuredBotSid = (this.data && this.data.boss_bot_steam_id) || boss.boss_steam_id || '76561198975489051';
    const currentSpecies = boss.species || 'Puerta';

    return `
      <div class="card" style="border: 1px solid rgba(245, 158, 11, 0.4); background: linear-gradient(135deg, rgba(30, 20, 10, 0.65), rgba(15, 23, 42, 0.95)); margin-bottom: 24px;">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 1.6rem;">👑</span>
            <div>
              <h3 style="margin: 0; color: #fbbf24; font-size: 1.15rem; font-weight: 800;">
                BẢNG ĐIỀU KHIỂN BOSS DÀNH CHO QUẢN TRỊ VIÊN (ADMIN)
              </h3>
              <p style="margin: 2px 0 0; color: #94a3b8; font-size: 0.82rem;">
                Triển khai Bot Boss chuyên dụng tự động — Nhân vật chơi của Admin được bảo toàn 100% không bị ảnh hưởng!
              </p>
            </div>
          </div>
          <span style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 700;">
            QUYỀN QUẢN TRỊ ADMIN
          </span>
        </div>

        <!-- CẤU HÌNH BOT BOSS CHUYÊN DỤNG CỐ ĐỊNH -->
        <div style="background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 14px 18px; margin-bottom: 16px;">
          <div style="font-weight: 800; color: #cbd5e1; font-size: 0.9rem; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
            <span>⚙️</span> CẤU HÌNH TÀI KHOẢN BOT PHỤ LÀM BOSS (CỐ ĐỊNH)
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; align-items: flex-end;">
            <div>
              <label style="display: block; font-size: 0.8rem; color: #94a3b8; margin-bottom: 4px; font-weight: 700;">
                🤖 Steam ID Tài Khoản Bot Boss Phụ:
              </label>
              <input type="text" id="boss-bot-steam-id-input" class="form-input" style="width: 100%;" value="${configuredBotSid}" placeholder="Nhập Steam ID của tài khoản Bot phụ...">
            </div>
            <div>
              <label style="display: block; font-size: 0.8rem; color: #94a3b8; margin-bottom: 4px; font-weight: 700;">
                🦖 Chủng Loài Siêu Boss:
              </label>
              <select id="boss-bot-species-select" class="form-input" style="width: 100%;">
                <option value="Puerta" ${currentSpecies === 'Puerta' ? 'selected' : ''}>👑 Puerta (Puertasaurus Siêu Khổng Lồ Max Size - Khuyên Dùng)</option>
                <option value="Triceratops" ${currentSpecies === 'Triceratops' ? 'selected' : ''}>Triceratops (Trice Sừng Khổng Lồ)</option>
                <option value="Stegosaurus" ${currentSpecies === 'Stegosaurus' ? 'selected' : ''}>Stegosaurus (Gai Đuôi)</option>
                <option value="Tenontosaurus" ${currentSpecies === 'Tenontosaurus' ? 'selected' : ''}>Tenontosaurus</option>
                <option value="Tyrannosaurus" ${currentSpecies === 'Tyrannosaurus' ? 'selected' : ''}>Tyrannosaurus (T-Rex)</option>
              </select>
            </div>
            <div>
              <button class="btn-primary" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); font-size: 0.85rem; padding: 10px 16px; border-radius: 6px; cursor: pointer;" onclick="BossHunt.saveBotConfig()">
                💾 Lưu Cấu Hình Bot
              </button>
            </div>
          </div>
          <p style="margin: 8px 0 0; color: #64748b; font-size: 0.78rem;">
            * Tài khoản Bot này sẽ tự động biến hình và dịch chuyển vào Đấu Trường. Bạn không cần phải chọn lại nhiều lần.
          </p>
        </div>

        <!-- THAO TÁC THẢ / TẮT BOSS -->
        <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 78, 59, 0.3)); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 12px; padding: 18px 22px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
          <div>
            <div style="font-weight: 900; color: #34d399; font-size: 1.15rem; display: flex; align-items: center; gap: 8px;">
              <span>⚡</span> SIÊU BOSS AI 100.000 HP (TỰ ĐỘNG PHẢN ĐÒN & QUÉT 15M)
            </div>
            <p style="margin: 6px 0 0; color: #cbd5e1; font-size: 0.88rem; line-height: 1.5;">
              • Chủng loại: <b style="color: #fbbf24;">${currentSpecies} (Max Size 3.0x)</b> &bull; Máu tối đa: <b style="color: #ef4444;">100.000 HP</b> &bull; Phản đòn: <b style="color: #f43f5e;">1.000 Dame/hit</b><br>
              • Vị trí: <b style="color: #38bdf8;">ĐẤU TRƯỜNG</b> &bull; Phần thưởng: <b style="color: #10b981;">5.000 Xu chia theo % sát thương</b><br>
              • Trạng thái hiện tại: <b>${isActive ? (curHp > 0 ? '🟢 Đang hoạt động (' + curHp.toLocaleString('vi-VN') + ' HP)' : '💀 Đã bị tiêu diệt') : '⚪ Đang Tắt'}</b>
            </p>
          </div>
          <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            ${!isActive ? `
              <button class="btn-primary" style="background: linear-gradient(135deg, #10b981, #047857); font-size: 1.05rem; font-weight: 900; padding: 14px 28px; border-radius: 10px; display: inline-flex; align-items: center; gap: 10px; box-shadow: 0 0 20px rgba(16, 185, 129, 0.4); cursor: pointer;" onclick="BossHunt.toggleBossAi('enable')">
                🚀 BẬT THẢ BOSS AI 100.000 HP
              </button>
            ` : `
              <button class="btn-primary" style="background: linear-gradient(135deg, #ef4444, #b91c1c); font-size: 0.95rem; font-weight: 800; padding: 12px 22px; border-radius: 8px; display: inline-flex; align-items: center; gap: 8px; cursor: pointer;" onclick="BossHunt.toggleBossAi('disable')">
                🛑 TẮT BOSS AI / THU HỒI
              </button>
              <button class="btn-primary" style="background: linear-gradient(135deg, #d97706, #b45309); font-size: 0.95rem; font-weight: 800; padding: 12px 22px; border-radius: 8px; display: inline-flex; align-items: center; gap: 8px; cursor: pointer;" onclick="BossHunt.toggleBossAi('respawn')">
                🔄 HỒI ĐẦY 100K HP
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  },

  async saveBotConfig() {
    const botSidInput = document.getElementById('boss-bot-steam-id-input');
    const speciesSelect = document.getElementById('boss-bot-species-select');
    const botSid = botSidInput ? botSidInput.value.trim() : '';
    const species = speciesSelect ? speciesSelect.value : 'Puerta';

    if (!botSid) {
      alert("Vui lòng nhập Steam ID của tài khoản Bot!");
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem('steam_user') || 'null');
      const adminSid = user ? user.steamId : '';
      const res = await fetch(`/api/boss/save-bot?admin_steam_id=${adminSid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boss_bot_steam_id: botSid, species: species })
      });
      const data = await res.json();
      if (data.ok) {
        if (window.App && App.showToast) App.showToast(data.message);
        else alert(data.message);
        await this.fetchData();
      } else {
        alert("❌ " + (data.error || "Lỗi lưu cấu hình!"));
      }
    } catch (e) {
      alert("❌ Lỗi: " + e.message);
    }
  },

  async toggleBossAi(action) {
    const botSidInput = document.getElementById('boss-bot-steam-id-input');
    const speciesSelect = document.getElementById('boss-bot-species-select');
    const botSid = botSidInput ? botSidInput.value.trim() : '';
    const species = speciesSelect ? speciesSelect.value : 'Puerta';

    let confirmMsg = "";
    if (action === 'enable') {
      confirmMsg = "⚠️ XÁC NHẬN THẢ BOSS AI 100.000 HP:\n\nBạn có muốn kích hoạt thả Siêu Boss AI 100.000 HP tại Đấu Trường ngay bây giờ?\n\n⭐ Tài khoản Bot (" + botSid + ") sẽ hóa thân thành Boss Khổng Lồ 1.8x, tự phản đòn 1.000 dame và chia 5.000 Xu!";
    } else if (action === 'disable') {
      confirmMsg = "⚠️ XÁC NHẬN TẮT BOSS AI:\n\nBạn có chắc chắn muốn TẮT Boss AI và thu hồi khỏi Đấu Trường?";
    } else {
      confirmMsg = "⚠️ XÁC NHẬN HỒI ĐẦY MÁU BOSS:\n\nBạn có muốn hồi phục đầy đủ 100.000 HP cho Boss AI?";
    }

    if (!confirm(confirmMsg)) return;

    if (window.App && App.showToast) {
      App.showToast("⏳ Đang gửi lệnh máy chủ xử lý Boss AI...");
    }

    try {
      const user = JSON.parse(localStorage.getItem('steam_user') || 'null');
      const adminSid = user ? user.steamId : '';

      const res = await fetch(`/api/boss/toggle?admin_steam_id=${adminSid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: action,
          boss_bot_steam_id: botSid,
          species: species
        })
      });

      const resData = await res.json();
      if (resData.ok) {
        if (window.App && App.showToast) {
          App.showToast(resData.message || "✅ Thao tác Boss AI thành công!");
        } else {
          alert(resData.message || "✅ Thao tác Boss AI thành công!");
        }
        await this.fetchData();
      } else {
        alert("❌ " + (resData.error || "Lỗi thao tác!"));
      }
    } catch (e) {
      alert("❌ Lỗi kết nối khi gửi lệnh Boss: " + e.message);
    }
  },

  // Aliases for compatibility
  async spawnAutoAiBoss() {
    return this.toggleBossAi('enable');
  },

  async adminToggle(action) {
    return this.toggleBossAi(action);
  },

  async teleportToBoss() {
    const user = JSON.parse(localStorage.getItem('steam_user') || 'null');
    if (!user || !user.steamId) {
      alert("Vui lòng đăng nhập Steam để thực hiện dịch chuyển đến Đấu Trường Săn Boss!");
      return;
    }

    if (!confirm("Bạn có chắc chắn muốn dịch chuyển đến Đấu Trường Săn Boss ngay bây giờ?")) {
      return;
    }

    App.showToast("⏳ Đang yêu cầu dịch chuyển đến Đấu Trường...");

    try {
      const res = await fetch('/api/boss/teleport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steam_id: user.steamId })
      });

      const resData = await res.json();
      if (resData.ok) {
        App.showToast(resData.message || "✅ Dịch chuyển thành công!");
      } else {
        alert(resData.error || "Không thể dịch chuyển, vui lòng thử lại sau ít giây!");
      }
    } catch (e) {
      alert("Lỗi kết nối dịch chuyển: " + e.message);
    }
  }
};

window.BossHunt = BossHunt;
