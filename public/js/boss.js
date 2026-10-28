// =========================================================================
// MODULE SĂN BOSS TRICERATOPS 100.000 HP (BOSS HUNTING & REWARDS)
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
    }, 4000);
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

    let statusBadge = '';
    if (isActive && curHp > 0) {
      statusBadge = `<span style="background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.4); padding: 6px 14px; border-radius: 20px; font-weight: 700; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 6px;">
        <span style="width: 8px; height: 8px; border-radius: 50%; background: #10b981; animation: pulse 1.5s infinite;"></span>
        🟢 ĐANG HOẠT ĐỘNG (SẴN SÀNG CHIẾN ĐẤU)
      </span>`;
    } else if (isActive && curHp <= 0) {
      statusBadge = `<span style="background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.4); padding: 6px 14px; border-radius: 20px; font-weight: 700; font-size: 0.85rem;">
        💀 VỪA BỊ HẠ GỤC (+5.000 XU ĐÃ RƠI)
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
          height: 32px;
          background: rgba(0, 0, 0, 0.6);
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
          text-shadow: 0 2px 4px rgba(0,0,0,0.9);
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
      </style>

      <!-- HERO BANNER SĂN BOSS -->
      <div class="card" style="margin-bottom: 24px; background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(15, 23, 42, 0.9)); border: 1px solid rgba(239, 68, 68, 0.4);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
              <span style="font-size: 2rem;">👑</span>
              <h1 style="font-size: 1.8rem; font-weight: 900; margin: 0; background: linear-gradient(90deg, #f87171, #fbbf24, #f43f5e); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                ĐẤU TRƯỜNG SĂN BOSS THẦN THOẠI
              </h1>
            </div>
            <p style="color: #cbd5e1; font-size: 0.95rem; margin: 0;">
              Thách thức <b>Boss Triceratops 100.000 HP</b> • Trọng lượng 100 Tấn • Người chơi kết liễu nhận ngay <b>💰 5.000 Xu Hệ Thống</b>!
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
              🦏
            </div>
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <h2 style="font-size: 1.5rem; font-weight: 900; margin: 0; color: #fff;">
                  ${boss.boss_name || '👑 BOSS TRICERATOPS BẠO THẦN'}
                </h2>
                <span class="badge" style="background: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.4); font-size: 0.75rem; font-weight: 800;">
                  BẠO THẦN 100K HP
                </span>
              </div>
              <p style="color: #94a3b8; font-size: 0.88rem; margin: 4px 0 0;">
                Khu vực xuất hiện: <b style="color: #38bdf8;">📍 ${boss.location_name || 'ĐẤU TRƯỜNG'}</b> &bull; Boss sống mãi đến khi Admin bấm tắt!
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

        <!-- LƯỚI THÔNG SỐ CHIẾN ĐẤU -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin-top: 20px;">
          <div class="stat-chip">
            <div class="stat-chip-label">🛡️ Máu Tối Đa</div>
            <div class="stat-chip-val" style="color: #ef4444;">100.000 HP</div>
          </div>
          <div class="stat-chip">
            <div class="stat-chip-label">⚖️ Trọng Lượng & Sức Húc</div>
            <div class="stat-chip-val" style="color: #f59e0b;">100.0 Tấn (100k kg)</div>
          </div>
          <div class="stat-chip">
            <div class="stat-chip-label">💰 Phần Thưởng Kết Liễu</div>
            <div class="stat-chip-val" style="color: #10b981;">+5.000 Xu Hệ Thống</div>
          </div>
          <div class="stat-chip">
            <div class="stat-chip-label">⚔️ Đòn Đánh Boss</div>
            <div class="stat-chip-val" style="color: #f43f5e;">Sát Thương Xuyên Giáp</div>
          </div>
        </div>

        ${boss.last_killer ? `
          <div style="margin-top: 20px; padding: 14px 18px; border-radius: 10px; background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.3); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 1.5rem;">🏆</span>
              <div>
                <span style="font-size: 0.8rem; color: #94a3b8;">CHIẾN BINH VỪA KẾT LIỄU BOSS:</span>
                <div style="font-size: 1.05rem; font-weight: 800; color: #10b981;">
                  ${boss.last_killer.killer_name} (${boss.last_killer.killer_steam_id})
                </div>
              </div>
            </div>
            <div style="font-weight: 800; color: #fbbf24; font-size: 1.1rem;">
              +5.000 Xu Nhận Thưởng
            </div>
          </div>
        ` : ''}
      </div>

      <!-- BẢNG ĐIỀU KHIỂN DÀNH CHO ADMIN (NẾU LÀ ADMIN) -->
      ${isAdmin ? this.renderAdminControls(boss) : ''}

      <!-- BẢNG VÀNG DIỆT BOSS -->
      <div class="card">
        <div class="card-header" style="border: none; padding-bottom: 0;">
          <div>
            <h2 class="card-title" style="display: flex; align-items: center; gap: 8px;">
              <span>🏆</span> BẢNG VÀNG DŨNG SĨ SĂN BOSS
            </h2>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 4px;">
              Lịch sử các cao thủ đã hạ gục Boss Triceratops và nhận thưởng 5.000 Xu
            </p>
          </div>
        </div>

        <div style="margin-top: 16px; overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
            <thead>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: #94a3b8;">
                <th style="padding: 12px 14px;">#</th>
                <th style="padding: 12px 14px;">Dũng Sĩ Kết Liễu</th>
                <th style="padding: 12px 14px;">Chiêu Thức</th>
                <th style="padding: 12px 14px;">Thời Gian</th>
                <th style="padding: 12px 14px; text-align: right;">Phần Thưởng</th>
              </tr>
            </thead>
            <tbody>
              ${killHistory.length > 0 ? killHistory.map((k, idx) => `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                  <td style="padding: 12px 14px; color: #f59e0b; font-weight: 800;">#${idx + 1}</td>
                  <td style="padding: 12px 14px;">
                    <b style="color: #fff;">${k.killer_name || 'Chiến Binh'}</b>
                    <span style="font-size: 0.78rem; color: #64748b; margin-left: 6px;">(${k.killer_steam_id})</span>
                  </td>
                  <td style="padding: 12px 14px; color: #e2e8f0;">
                    ${k.ability || 'Tấn công dứt điểm'}
                  </td>
                  <td style="padding: 12px 14px; color: #94a3b8; font-size: 0.82rem;">
                    ${new Date(k.killed_at).toLocaleString('vi-VN')}
                  </td>
                  <td style="padding: 12px 14px; text-align: right; color: #10b981; font-weight: 800;">
                    +${(k.reward_xu || 5000).toLocaleString('vi-VN')} Xu
                  </td>
                </tr>
              `).join('') : `
                <tr>
                  <td colspan="5" style="text-align: center; padding: 32px; color: #64748b;">
                    Chưa có dũng sĩ nào hạ gục được Boss Triceratops Thần Thoại. Hãy là người đầu tiên!
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
    const onlinePlayers = (this.data && this.data.online_players) || [];
    const defaultSid = boss.boss_steam_id || (onlinePlayers[0] ? onlinePlayers[0].steamId : '');

    return `
      <div class="card" style="border: 1px solid rgba(245, 158, 11, 0.4); background: linear-gradient(135deg, rgba(30, 20, 10, 0.6), rgba(15, 23, 42, 0.9)); margin-bottom: 24px;">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 1.6rem;">👑</span>
            <div>
              <h3 style="margin: 0; color: #fbbf24; font-size: 1.15rem; font-weight: 800;">
                BẢNG ĐIỀU KHIỂN BOSS DÀNH RIÊNG CHO QUẢN TRỊ VIÊN (ADMIN)
              </h3>
              <p style="margin: 2px 0 0; color: #94a3b8; font-size: 0.82rem;">
                Chỉ Admin mới có thể bật/tắt thả Boss. Boss sẽ sống mãi trong game đến khi Admin bấm Tắt!
              </p>
            </div>
          </div>
          <span style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 700;">
            QUYỀN QUẢN TRỊ ADMIN
          </span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 20px;">
          <div>
            <label style="display: block; font-size: 0.85rem; color: #cbd5e1; margin-bottom: 6px; font-weight: 700;">
              👤 Chọn tài khoản hóa thân thành Boss:
            </label>
            <select id="boss-admin-target-select" class="form-input" style="width: 100%;" onchange="document.getElementById('boss-admin-target-sid').value = this.value;">
              ${onlinePlayers.map(p => `
                <option value="${p.steamId}" ${p.steamId === defaultSid ? 'selected' : ''}>
                  ${p.name || 'Player'} (${p.species || 'Dino'}, Steam: ${p.steamId})
                </option>
              `).join('')}
              <option value="custom">-- Nhập Steam ID thủ công bên dưới --</option>
            </select>
            <input type="text" id="boss-admin-target-sid" class="form-input" style="width: 100%; margin-top: 8px;" placeholder="Nhập Steam ID của tài khoản Boss..." value="${defaultSid}">
          </div>

          <div style="display: flex; flex-direction: column; justify-content: center; gap: 8px;">
            <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: #cbd5e1; cursor: pointer;">
              <input type="checkbox" id="boss-admin-teleport" checked>
              <span>Tự động dịch chuyển Boss đến <b>Đấu Trường</b> khi thả</span>
            </label>
            <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: #cbd5e1; cursor: pointer;">
              <input type="checkbox" id="boss-admin-slay" checked>
              <span>Tiêu diệt / Slay nhân vật Boss khi bấm <b>Tắt Boss</b></span>
            </label>
          </div>
        </div>

        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
          ${!isActive ? `
            <button class="btn-primary" style="background: linear-gradient(135deg, #ef4444, #b91c1c); font-size: 1rem; font-weight: 800; padding: 12px 24px; border-radius: 8px; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 0 16px rgba(239, 68, 68, 0.4);" onclick="BossHunt.adminToggle('enable')">
              🔥 THẢ BOSS TRICERATOPS 100.000 HP NGAY
            </button>
          ` : `
            <button class="btn-primary" style="background: linear-gradient(135deg, #475569, #334155); font-size: 1rem; font-weight: 800; padding: 12px 24px; border-radius: 8px; display: inline-flex; align-items: center; gap: 8px;" onclick="BossHunt.adminToggle('disable')">
              🛑 TẮT BOSS / THU HỒI
            </button>
            <button class="btn-primary" style="background: linear-gradient(135deg, #d97706, #b45309); font-size: 1rem; font-weight: 800; padding: 12px 24px; border-radius: 8px; display: inline-flex; align-items: center; gap: 8px;" onclick="BossHunt.adminToggle('respawn')">
              🔄 HỒI ĐẦY 100K HP / HỒI SINH BOSS
            </button>
          `}
        </div>
      </div>
    `;
  },

  async adminToggle(action) {
    const targetSidInput = document.getElementById('boss-admin-target-sid');
    const targetSid = targetSidInput ? targetSidInput.value.trim() : '';
    const teleport = document.getElementById('boss-admin-teleport') ? document.getElementById('boss-admin-teleport').checked : true;
    const slay = document.getElementById('boss-admin-slay') ? document.getElementById('boss-admin-slay').checked : true;

    if (action === 'enable' && !targetSid) {
      alert('Vui lòng chọn hoặc nhập Steam ID của tài khoản để hóa thân thành Boss!');
      return;
    }

    if (action === 'enable' && !confirm(`⚠️ XÁC NHẬN KÍCH HOẠT SĂN BOSS:\n\nBạn có chắc chắn muốn thả Boss Triceratops 100.000 HP cho Steam ID ${targetSid}?\n\nBoss sẽ sống mãi cho đến khi bạn tắt!`)) {
      return;
    }

    if (action === 'disable' && !confirm(`⚠️ XÁC NHẬN TẮT BOSS:\n\nBạn có chắc chắn muốn TẮT Boss và thu hồi khỏi Đấu Trường?`)) {
      return;
    }

    App.showToast("⏳ Đang gửi lệnh máy chủ xử lý Boss...");

    try {
      const user = JSON.parse(localStorage.getItem('steam_user') || 'null');
      const adminSid = user ? user.steamId : '';

      const res = await fetch(`/api/boss/toggle?admin_steam_id=${adminSid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: action,
          target_steam_id: targetSid,
          teleport: teleport,
          slay: slay
        })
      });

      const resData = await res.json();
      if (resData.ok) {
        App.showToast(resData.message || "✅ Thao tác Boss thành công!");
        await this.fetchData();
      } else {
        alert(resData.error || "Lỗi thao tác!");
      }
    } catch (e) {
      alert("Lỗi kết nối máy chủ khi thực hiện lệnh Boss: " + e.message);
    }
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
