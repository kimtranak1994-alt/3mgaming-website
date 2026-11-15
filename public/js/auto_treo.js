/**
 * 3MGAMING - MODULE AUTO TREO KHỦNG LONG (AFK AUTO MANAGER)
 * Tự động hóa tiến trình phát triển và bảo quản khủng long 24/7
 * - Auto Mutation: 26% -> Slot 1 | 50% -> Slot 2 | 76% -> Slot 3 & 4
 * - Auto Store Garage: Cất Gara an toàn khi đạt mốc tăng trưởng chọn sẵn
 */

const AutoTreo = {
  data: null,
  pollTimer: null,
  isLoading: false,

  MUTATIONS: [
    { id: "None", name: "-- Không Chọn (Để Trống) --", icon: "⚪", desc: "Không tự động cộng đột biến cho ô này." },
    { id: "Hematophagy", name: "Hút Máu Hồi Phục", icon: "🩸", desc: "Hồi phục một lượng sinh lực dựa trên lượng sát thương gây ra cho đối thủ." },
    { id: "Multichambered Lungs", name: "Phổi Đa Ngăn", icon: "🫁", desc: "Tăng dung tích phổi, nín thở dưới nước lâu hơn và tăng mạnh hồi thể lực (Stamina)." },
    { id: "Osteosclerosis", name: "Xương Cốt Thép", icon: "🦴", desc: "Tăng mật độ và độ cứng xương, giảm tỷ lệ gãy chân và thời gian choáng." },
    { id: "Epidermal Fibrosis", name: "Da Xơ Hóa (Giáp Da)", icon: "🛡️", desc: "Lớp da dày sừng hóa bảo vệ, giảm đáng kể sát thương vật lý nhận vào." },
    { id: "Hemomania", name: "Cuồng Huyết Chiến", icon: "🩸", desc: "Tăng mạnh lực cắn và tốc độ khi tấn công mục tiêu đang bị chảy máu." },
    { id: "Gastronomic Regeneration", name: "Hấp Thụ Nhanh", icon: "🧬", desc: "Hồi phục máu và thể lực nhanh chóng sau khi ăn no thức ăn phù hợp." },
    { id: "Photosynthetic Tissue", name: "Mô Quang Hợp", icon: "🌿", desc: "Giảm tốc độ tiêu hao thức ăn và tăng trao đổi chất khi có ánh nắng mặt trời." },
    { id: "Photosynthetic Regeneration", name: "Quang Hợp Hồi Phục", icon: "🌱", desc: "Tăng tốc độ tự hồi phục sức khỏe khi đứng dưới ánh nắng ban ngày." },
    { id: "Sustained Hydration", name: "Duy Trì Độ Ẩm", icon: "💧", desc: "Giảm tốc độ tụt nước, tăng khả năng sống sót trong môi trường khô cằn." },
    { id: "Xerocole Adaptation", name: "Thích Nghi Sa Mạc", icon: "🏜️", desc: "Giảm mất nước cực mạnh, tăng khả năng chịu nhiệt dưới thời tiết khắc nghiệt." },
    { id: "Enhanced Digestion", name: "Tăng Cường Tiêu Hóa", icon: "⚡", desc: "Hấp thụ tối đa 3 loại dưỡng chất giúp đẩy nhanh tốc độ phát triển." },
    { id: "Efficient Digestion", name: "Tiêu Hóa Hiệu Quả", icon: "🌾", desc: "Giảm lượng thức ăn tiêu hao khi chạy nhanh và săn mồi liên tục." },
    { id: "Tactile Endurance", name: "Sức Bền Xúc Giác", icon: "💪", desc: "Tối ưu hóa cơ bắp, giảm tiêu hao thể lực khi chạy nước rút và bật nhảy." },
    { id: "Nocturnal", name: "Thích Nghi Ban Đêm", icon: "🌙", desc: "Tăng tầm nhìn đêm Night Vision sắc nét và tăng tốc độ di chuyển khi trời tối." },
    { id: "Cellular Regeneration", name: "Tái Tạo Tế Bào", icon: "🩸", desc: "Tự động khép miệng vết thương và cầm máu với tốc độ vượt trội." },
    { id: "Accelerated Prey Drive", name: "Tăng Tốc Săn Mồi", icon: "⚡", desc: "Tăng tốc độ bứt phá khi đuổi theo con mồi hoặc khủng long bị thương." },
    { id: "Reniculate Kidneys", name: "Thận Hình Lựu", icon: "🫘", desc: "Lọc độc tố hiệu quả, giảm mạnh tác động của nọc độc Troodon và vi khuẩn." },
    { id: "Truculency", name: "Hung Hãn Chiến Đấu", icon: "⚔️", desc: "Tăng sát thương chí mạng khi lượng máu xuống dưới mức báo động." },
    { id: "Congenital Hypoalgesia", name: "Giảm Đau Bẩm Sinh", icon: "🛡️", desc: "Bỏ qua trạng thái đi khập khiễng do đau đớn, giữ vững phản xạ chiến đấu." },
    { id: "Hypermetabolic Inanition", name: "Đổi Đói Lấy Sức Mạnh", icon: "🍖", desc: "Kích phát tiềm năng cơ bắp tối đa đổi lấy tốc độ tiêu hao dạ dày." },
    { id: "Enlarged Meniscus", name: "Sụn Chêm Phóng Đại", icon: "🦵", desc: "Khớp chân dẻo dai, giảm sát thương khi rơi từ vách đá cao và nhảy xa hơn." },
    { id: "Hydrodynamic", name: "Thủy Động Lực", icon: "🐬", desc: "Cơ thể thuôn mượt, tăng tốc độ bơi tối đa và tăng khả năng cơ động dưới nước." },
    { id: "Hydroregenerative", name: "Hồi Phục Thủy Sinh", icon: "💧", desc: "Hồi phục vết thương nhanh hơn đáng kể khi ngâm mình dưới dòng nước mát." },
    { id: "Cannibalistic", name: "Đồng Loại Tương Tàn", icon: "💀", desc: "Có thể ăn thịt đồng loại mà không phải chịu hình phạt co giật hay trúng độc." },
    { id: "Social Behavior", name: "Tập Tính Bầy Đàn", icon: "🐾", desc: "Tăng chỉ số phòng thủ và phục hồi khi ở gần các cá thể cùng loài." },
    { id: "Hypervigilance", name: "Cảnh Giác Cao Độ", icon: "👁️", desc: "Tăng tầm ngửi mùi thức ăn và phát hiện kẻ săn mồi rình rập từ xa." },
    { id: "Wader", name: "Lội Nước Nhanh", icon: "🌊", desc: "Giảm lực cản của nước nông và bùn lầy, di chuyển thanh thoát qua đầm lầy." },
    { id: "Featherweight", name: "Nhẹ Như Lông Hồng", icon: "🪶", desc: "Giảm trọng lượng cơ thể giúp tiếng bước chân trở nên êm ái, khó bị phát hiện." },
    { id: "Submerged Optical Retention", name: "Mắt Thủy Cung", icon: "👁️", desc: "Nhìn rõ ràng dưới đáy hồ sâu tăm tối mà không bị mờ nhòe." }
  ],

  getDinoImageUrl(species) {
    if (window.Garage && typeof Garage.getDinoImageUrl === 'function') {
      return Garage.getDinoImageUrl(species);
    }
    if (!species) return '/assets/images/Tyrannosaurus.webp';
    const formattedName = species.charAt(0).toUpperCase() + species.slice(1).split(' ')[0];
    return `https://islepilot.eu/cdn/dino-art/render/${formattedName}.webp`;
  },

  async render() {
    const container = document.getElementById('view-autotreo');
    if (!container) return;

    if (!this.data) {
      container.innerHTML = `
        <div style="text-align: center; padding: 70px 20px;">
          <div class="spinner" style="margin: 0 auto 16px;"></div>
          <p style="color: #94a3b8; font-size: 1.05rem;">Đang kết nối hệ thống AUTO TREO máy chủ 3MGAMING...</p>
        </div>
      `;
    }

    await this.fetchData(true);
    this.startAutoRefresh();
  },

  async fetchData(forceRender = false) {
    if (this.isLoading) return;
    this.isLoading = true;

    try {
      const user = JSON.parse(localStorage.getItem('steam_user') || 'null');
      const steamId = (user && (user.steamId || user.steam_id)) || (window.Garage && Garage.currentSteamId) || '';
      const steamParam = steamId ? `?steam_id=${encodeURIComponent(steamId)}&` : '?';

      const res = await fetch(`/api/player/autotreo/settings${steamParam}_t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const newData = await res.json();
        this.data = newData;
        if (forceRender || document.getElementById('autotreo-logs-list') === null) {
          this.renderUI();
        } else {
          this.updateDynamicStatus();
        }
      } else {
        const user = JSON.parse(localStorage.getItem('steam_user') || 'null');
        this.data = { logged_in: false };
        this.renderUI();
      }
    } catch (e) {
      console.error("[AutoTreo] Lỗi tải dữ liệu:", e);
      if (!this.data) {
        this.data = { logged_in: false };
        this.renderUI();
      }
    } finally {
      this.isLoading = false;
    }
  },

  startAutoRefresh() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = setInterval(() => {
      const curTab = document.body.getAttribute('data-current-tab');
      if (curTab === 'autotreo' || window.location.hash === '#autotreo') {
        this.fetchData(false);
      }
    }, 4500);
  },

  renderUI() {
    const container = document.getElementById('view-autotreo');
    if (!container) return;

    if (!this.data || !this.data.logged_in) {
      container.innerHTML = this.renderNotLoggedIn();
      return;
    }

    const { settings, state, has_active_dino, dino, garage } = this.data;
    const autoMut = Boolean(settings && settings.auto_mutation_enabled);
    const autoGar = Boolean(settings && settings.auto_garage_enabled);
    const targetGrowth = Number(settings && settings.target_growth_percent) || 100;

    const s1 = (settings && settings.slot1_mutation) || 'None';
    const s2 = (settings && settings.slot2_mutation) || 'None';
    const s3 = (settings && settings.slot3_mutation) || 'None';
    const s4 = (settings && settings.slot4_mutation) || 'None';

    const logs = (state && state.logs) || [];
    const appliedSlots = (state && state.applied_slots) || [];

    const dinoGrowthPct = dino ? Number(dino.growth_percent || (dino.growth * 100) || 0) : 0;
    const dinoSpecies = dino ? dino.species : 'Chưa có khủng long ngoài map';
    const dinoImg = dino ? this.getDinoImageUrl(dino.species) : '/assets/images/Tyrannosaurus.webp';

    container.innerHTML = `
      <!-- HEADER HERO BANNER -->
      <div style="background: linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(16, 185, 129, 0.1)); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 16px; padding: 24px; margin-bottom: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.3);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div>
            <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(56, 189, 248, 0.2); border: 1px solid #38bdf8; color: #38bdf8; padding: 4px 12px; border-radius: 20px; font-size: 0.78rem; font-weight: 800; text-transform: uppercase; margin-bottom: 8px;">
              <span>⚡</span> TÍNH NĂNG AFK AUTO MANAGER 24/7
            </div>
            <h1 style="font-size: 1.9rem; font-weight: 900; color: #fff; margin: 0; display: flex; align-items: center; gap: 10px;">
              <span>🤖</span> AUTO TREO KHỦNG LONG
            </h1>
            <p style="color: #94a3b8; font-size: 0.95rem; margin: 6px 0 0; line-height: 1.5;">
              Tự động chọn Đột Biến Gen theo mốc tăng trưởng và Tự động Cất Gara an toàn khi đạt độ lớn mong muốn.
            </p>
          </div>
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <button onclick="AutoTreo.fetchData(true)" class="btn-secondary" style="padding: 10px 18px; font-size: 0.9rem; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px; cursor: pointer;">
              🔄 Làm Mới Dữ Liệu
            </button>
            <button onclick="AutoTreo.saveSettings()" class="btn-primary" style="padding: 10px 22px; font-size: 0.92rem; font-weight: 800; border-radius: 8px; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; box-shadow: 0 0 16px rgba(255, 42, 133, 0.4);">
              💾 LƯU CẤU HÌNH AUTO
            </button>
          </div>
        </div>
      </div>

      <!-- LIVE DINO SPOTLIGHT & AUTO STATUS -->
      <div class="card" style="margin-bottom: 24px; padding: 22px; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px;">
        <div style="display: grid; grid-template-columns: minmax(180px, 240px) 1fr; gap: 24px; align-items: center;">
          
          <div style="text-align: center; background: radial-gradient(circle, rgba(56, 189, 248, 0.15), transparent 70%); border-radius: 14px; padding: 14px; border: 1px solid rgba(56, 189, 248, 0.2);">
            <img src="${dinoImg}" alt="${dinoSpecies}" style="width: 100%; max-height: 140px; object-fit: contain; filter: drop-shadow(0 8px 14px rgba(0,0,0,0.6));">
            <div style="margin-top: 10px; font-weight: 800; color: #fff; font-size: 1.05rem;">${dinoSpecies}</div>
            <div style="font-size: 0.8rem; color: #94a3b8;">${has_active_dino ? (dino.female ? 'Cái (Female ♀)' : 'Đực (Male ♂)') : 'Chưa có nhân vật sống'}</div>
          </div>

          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 12px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-weight: 800; color: #fff; font-size: 1.15rem;">Tiến Trình Tăng Trưởng Hiện Tại:</span>
                <span id="autotreo-growth-badge" style="background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid #10b981; font-weight: 900; font-size: 1rem; padding: 3px 12px; border-radius: 14px;">
                  ${dinoGrowthPct.toFixed(1)}%
                </span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 0.8rem; color: #94a3b8;">Gara:</span>
                <span style="font-size: 0.82rem; font-weight: 800; color: #fbbf24; background: rgba(245, 158, 11, 0.15); border: 1px solid #f59e0b; padding: 2px 8px; border-radius: 6px;">
                  ${garage ? `${garage.tier_name} (${garage.count}/${garage.max_slots} Slot)` : 'Đang tải...'}
                </span>
              </div>
            </div>

            <!-- VISUAL GROWTH BAR WITH 26%, 50%, 76% AND TARGET MILESTONES -->
            <div style="position: relative; margin: 24px 0 28px;">
              <div style="background: rgba(0,0,0,0.6); height: 16px; border-radius: 8px; overflow: hidden; border: 1px solid rgba(255,255,255,0.15);">
                <div id="autotreo-progress-fill" style="background: linear-gradient(90deg, #0284c7, #38bdf8, #10b981); width: ${Math.min(100, Math.max(0, dinoGrowthPct))}%; height: 100%; border-radius: 8px; transition: width 0.4s ease; box-shadow: 0 0 12px rgba(56, 189, 248, 0.5);"></div>
              </div>

              <!-- Marker 26% -->
              <div style="position: absolute; left: 26%; top: -8px; transform: translateX(-50%); text-align: center;">
                <div style="width: 2px; height: 32px; background: #38bdf8; margin: 0 auto;"></div>
                <span style="font-size: 0.72rem; font-weight: 800; color: ${dinoGrowthPct >= 26 ? '#38bdf8' : '#94a3b8'}; background: #0f172a; padding: 2px 6px; border-radius: 4px; border: 1px solid ${dinoGrowthPct >= 26 ? '#38bdf8' : 'rgba(255,255,255,0.2)'};">
                  26% (Slot 1) ${appliedSlots.includes(1) ? '✅' : ''}
                </span>
              </div>

              <!-- Marker 50% -->
              <div style="position: absolute; left: 50%; top: -8px; transform: translateX(-50%); text-align: center;">
                <div style="width: 2px; height: 32px; background: #10b981; margin: 0 auto;"></div>
                <span style="font-size: 0.72rem; font-weight: 800; color: ${dinoGrowthPct >= 50 ? '#10b981' : '#94a3b8'}; background: #0f172a; padding: 2px 6px; border-radius: 4px; border: 1px solid ${dinoGrowthPct >= 50 ? '#10b981' : 'rgba(255,255,255,0.2)'};">
                  50% (Slot 2) ${appliedSlots.includes(2) ? '✅' : ''}
                </span>
              </div>

              <!-- Marker 76% -->
              <div style="position: absolute; left: 76%; top: -8px; transform: translateX(-50%); text-align: center;">
                <div style="width: 2px; height: 32px; background: #fbbf24; margin: 0 auto;"></div>
                <span style="font-size: 0.72rem; font-weight: 800; color: ${dinoGrowthPct >= 76 ? '#fbbf24' : '#94a3b8'}; background: #0f172a; padding: 2px 6px; border-radius: 4px; border: 1px solid ${dinoGrowthPct >= 76 ? '#fbbf24' : 'rgba(255,255,255,0.2)'};">
                  76% (Slot 3 & 4) ${appliedSlots.includes(3) && appliedSlots.includes(4) ? '✅' : ''}
                </span>
              </div>

              <!-- Marker Target Garage -->
              <div style="position: absolute; left: ${Math.min(98, Math.max(10, targetGrowth))}%; top: 20px; transform: translateX(-50%); text-align: center;">
                <span style="font-size: 0.72rem; font-weight: 800; color: #ff2a85; background: #0f172a; padding: 2px 8px; border-radius: 4px; border: 1px solid #ff2a85;">
                  🎯 Cất Gara (${targetGrowth}%)
                </span>
              </div>
            </div>

            <!-- OVERVIEW BADGES -->
            <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-top: 18px;">
              <div style="display: inline-flex; align-items: center; gap: 8px; font-size: 0.85rem; padding: 6px 14px; border-radius: 8px; background: ${autoMut ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.15)'}; border: 1px solid ${autoMut ? '#10b981' : 'rgba(148, 163, 184, 0.3)'}; color: ${autoMut ? '#34d399' : '#94a3b8'};">
                <span>🧬 Auto Mutation:</span>
                <b>${autoMut ? 'ĐANG BẬT (HOẠT ĐỘNG)' : 'ĐÃ TẮT'}</b>
              </div>
              <div style="display: inline-flex; align-items: center; gap: 8px; font-size: 0.85rem; padding: 6px 14px; border-radius: 8px; background: ${autoGar ? 'rgba(56, 189, 248, 0.2)' : 'rgba(148, 163, 184, 0.15)'}; border: 1px solid ${autoGar ? '#38bdf8' : 'rgba(148, 163, 184, 0.3)'}; color: ${autoGar ? '#38bdf8' : '#94a3b8'};">
                <span>🦖 Auto Cất Gara:</span>
                <b>${autoGar ? `ĐANG BẬT (Mốc ${targetGrowth}%)` : 'ĐÃ TẮT'}</b>
              </div>
            </div>

          </div>

        </div>
      </div>

      <!-- MAIN CONFIGURATION GRID (FEATURE 1 & FEATURE 2) -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); gap: 24px; margin-bottom: 24px;">

        <!-- ========================================== -->
        <!-- FEATURE 1: TỰ ĐỘNG CỘNG MUTATION GEN -->
        <!-- ========================================== -->
        <div class="card" style="padding: 24px; background: rgba(15, 23, 42, 0.95); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.35);">
          
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 16px; padding-bottom: 14px; border-bottom: 1px solid rgba(255,255,255,0.08);">
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 1.4rem;">🧬</span>
                <h3 style="font-size: 1.25rem; font-weight: 900; color: #fff; margin: 0;">1. Tự Động Nhận Mutation</h3>
              </div>
              <p style="color: #94a3b8; font-size: 0.85rem; margin: 4px 0 0;">
                Tự động gán đột biến đã chọn khi khủng long đạt mốc 26%, 50% và 76%.
              </p>
            </div>
            <div>
              <button type="button" id="btn-toggle-auto-mutation" onclick="AutoTreo.toggleFeature('mutation')" style="padding: 8px 16px; border-radius: 8px; font-weight: 800; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; border: 1px solid ${autoMut ? '#10b981' : 'rgba(255,255,255,0.2)'}; background: ${autoMut ? 'linear-gradient(135deg, #059669, #10b981)' : 'rgba(0,0,0,0.4)'}; color: #fff;">
                ${autoMut ? '✅ ĐANG BẬT' : '⚪ ĐANG TẮT'}
              </button>
            </div>
          </div>

          <!-- 4 SLOTS SELECTORS -->
          <div style="display: flex; flex-direction: column; gap: 16px;">
            
            <!-- SLOT 1 (26%) -->
            <div style="background: rgba(0,0,0,0.35); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 12px; padding: 14px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="background: rgba(56, 189, 248, 0.2); color: #38bdf8; font-weight: 900; font-size: 0.75rem; padding: 2px 8px; border-radius: 6px; border: 1px solid #38bdf8;">
                    MỐC 26%
                  </span>
                  <span style="font-weight: 800; color: #fff; font-size: 0.95rem;">Đột Biến Slot 1</span>
                </div>
                ${appliedSlots.includes(1) ? '<span style="color: #34d399; font-size: 0.78rem; font-weight: 800;">✅ Đã Áp Dụng</span>' : '<span style="color: #94a3b8; font-size: 0.76rem;">Chờ đạt 26%</span>'}
              </div>
              <select id="autotreo-slot-1" onchange="AutoTreo.updateMutationPreview(1, this.value)" style="width: 100%; padding: 10px 12px; background: #0f172a; color: #fff; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; font-size: 0.92rem; outline: none; cursor: pointer;">
                ${this.renderMutationOptions(s1)}
              </select>
              <div id="autotreo-slot-1-desc" style="font-size: 0.78rem; color: #94a3b8; margin-top: 6px; line-height: 1.4;">
                ${this.getMutationDesc(s1)}
              </div>
            </div>

            <!-- SLOT 2 (50%) -->
            <div style="background: rgba(0,0,0,0.35); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 14px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="background: rgba(16, 185, 129, 0.2); color: #34d399; font-weight: 900; font-size: 0.75rem; padding: 2px 8px; border-radius: 6px; border: 1px solid #10b981;">
                    MỐC 50%
                  </span>
                  <span style="font-weight: 800; color: #fff; font-size: 0.95rem;">Đột Biến Slot 2</span>
                </div>
                ${appliedSlots.includes(2) ? '<span style="color: #34d399; font-size: 0.78rem; font-weight: 800;">✅ Đã Áp Dụng</span>' : '<span style="color: #94a3b8; font-size: 0.76rem;">Chờ đạt 50%</span>'}
              </div>
              <select id="autotreo-slot-2" onchange="AutoTreo.updateMutationPreview(2, this.value)" style="width: 100%; padding: 10px 12px; background: #0f172a; color: #fff; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; font-size: 0.92rem; outline: none; cursor: pointer;">
                ${this.renderMutationOptions(s2)}
              </select>
              <div id="autotreo-slot-2-desc" style="font-size: 0.78rem; color: #94a3b8; margin-top: 6px; line-height: 1.4;">
                ${this.getMutationDesc(s2)}
              </div>
            </div>

            <!-- SLOT 3 & 4 (76%) -->
            <div style="background: rgba(0,0,0,0.35); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; padding: 14px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="background: rgba(245, 158, 11, 0.2); color: #fbbf24; font-weight: 900; font-size: 0.75rem; padding: 2px 8px; border-radius: 6px; border: 1px solid #f59e0b;">
                    MỐC 76% (ĐÔI)
                  </span>
                  <span style="font-weight: 800; color: #fff; font-size: 0.95rem;">Đột Biến Slot 3 & Slot 4</span>
                </div>
                ${(appliedSlots.includes(3) && appliedSlots.includes(4)) ? '<span style="color: #34d399; font-size: 0.78rem; font-weight: 800;">✅ Đã Áp Dụng Đủ</span>' : '<span style="color: #94a3b8; font-size: 0.76rem;">Chờ đạt 76%</span>'}
              </div>

              <!-- Slot 3 -->
              <div style="margin-bottom: 12px;">
                <label style="font-size: 0.78rem; font-weight: 700; color: #cbd5e1; margin-bottom: 4px; display: block;">Slot 3 (Đột Biến Thứ 3):</label>
                <select id="autotreo-slot-3" onchange="AutoTreo.updateMutationPreview(3, this.value)" style="width: 100%; padding: 10px 12px; background: #0f172a; color: #fff; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; font-size: 0.92rem; outline: none; cursor: pointer;">
                  ${this.renderMutationOptions(s3)}
                </select>
                <div id="autotreo-slot-3-desc" style="font-size: 0.78rem; color: #94a3b8; margin-top: 4px; line-height: 1.4;">
                  ${this.getMutationDesc(s3)}
                </div>
              </div>

              <!-- Slot 4 -->
              <div>
                <label style="font-size: 0.78rem; font-weight: 700; color: #cbd5e1; margin-bottom: 4px; display: block;">Slot 4 (Đột Biến Thứ 4):</label>
                <select id="autotreo-slot-4" onchange="AutoTreo.updateMutationPreview(4, this.value)" style="width: 100%; padding: 10px 12px; background: #0f172a; color: #fff; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; font-size: 0.92rem; outline: none; cursor: pointer;">
                  ${this.renderMutationOptions(s4)}
                </select>
                <div id="autotreo-slot-4-desc" style="font-size: 0.78rem; color: #94a3b8; margin-top: 4px; line-height: 1.4;">
                  ${this.getMutationDesc(s4)}
                </div>
              </div>

            </div>

          </div>

        </div>

        <!-- ========================================== -->
        <!-- FEATURE 2: TỰ ĐỘNG CẤT GARA -->
        <!-- ========================================== -->
        <div class="card" style="padding: 24px; background: rgba(15, 23, 42, 0.95); border: 1px solid rgba(56, 189, 248, 0.35); border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.35); display: flex; flex-direction: column; justify-content: space-between;">
          
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 16px; padding-bottom: 14px; border-bottom: 1px solid rgba(255,255,255,0.08);">
              <div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 1.4rem;">🦖</span>
                  <h3 style="font-size: 1.25rem; font-weight: 900; color: #fff; margin: 0;">2. Tự Động Cất Vào Gara</h3>
                </div>
                <p style="color: #94a3b8; font-size: 0.85rem; margin: 4px 0 0;">
                  Bảo vệ khủng long an toàn, tự động cất vào Gara khi đạt mốc tăng trưởng.
                </p>
              </div>
              <div>
                <button type="button" id="btn-toggle-auto-garage" onclick="AutoTreo.toggleFeature('garage')" style="padding: 8px 16px; border-radius: 8px; font-weight: 800; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; border: 1px solid ${autoGar ? '#38bdf8' : 'rgba(255,255,255,0.2)'}; background: ${autoGar ? 'linear-gradient(135deg, #0284c7, #38bdf8)' : 'rgba(0,0,0,0.4)'}; color: #fff;">
                  ${autoGar ? '✅ ĐANG BẬT' : '⚪ ĐANG TẮT'}
                </button>
              </div>
            </div>

            <!-- CHỌN MỐC TĂNG TRƯỞNG -->
            <div style="background: rgba(0,0,0,0.35); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 18px; margin-bottom: 18px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <label style="font-weight: 800; color: #fff; font-size: 0.95rem;">
                  Mốc Tăng Trưởng Cần Cất:
                </label>
                <span id="autotreo-target-growth-val" style="font-size: 1.4rem; font-weight: 900; color: #ff2a85; font-family: monospace;">
                  ${targetGrowth}%
                </span>
              </div>

              <!-- SLIDER -->
              <input type="range" id="autotreo-target-growth-slider" min="20" max="100" step="1" value="${targetGrowth}" oninput="AutoTreo.onGrowthSliderChange(this.value)" style="width: 100%; height: 8px; border-radius: 4px; accent-color: #ff2a85; cursor: pointer;">
              
              <!-- QUICK PICK BUTTONS -->
              <div style="display: flex; gap: 8px; margin-top: 14px; flex-wrap: wrap;">
                <button type="button" onclick="AutoTreo.setTargetGrowth(50)" class="btn-secondary" style="padding: 5px 12px; font-size: 0.8rem; border-radius: 6px;">50%</button>
                <button type="button" onclick="AutoTreo.setTargetGrowth(75)" class="btn-secondary" style="padding: 5px 12px; font-size: 0.8rem; border-radius: 6px;">75%</button>
                <button type="button" onclick="AutoTreo.setTargetGrowth(80)" class="btn-secondary" style="padding: 5px 12px; font-size: 0.8rem; border-radius: 6px;">80%</button>
                <button type="button" onclick="AutoTreo.setTargetGrowth(90)" class="btn-secondary" style="padding: 5px 12px; font-size: 0.8rem; border-radius: 6px;">90%</button>
                <button type="button" onclick="AutoTreo.setTargetGrowth(100)" class="btn-primary" style="padding: 5px 14px; font-size: 0.82rem; font-weight: 800; border-radius: 6px; background: linear-gradient(135deg, #f59e0b, #ef4444);">
                  100% (Full Adult)
                </button>
              </div>
            </div>

            <!-- GARAGE CAPACITY NOTE -->
            <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 12px; padding: 14px; margin-bottom: 18px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                <span style="font-size: 1.1rem;">🛡️</span>
                <span style="font-weight: 800; color: #fbbf24; font-size: 0.9rem;">Kiểm Tra Sức Chứa Gara:</span>
              </div>
              <p style="color: #94a3b8; font-size: 0.82rem; line-height: 1.5; margin: 0;">
                Tài khoản của bạn hiện thuộc <b>${garage ? garage.tier_name : 'Cấp Gara'}</b> (Đã dùng <b>${garage ? garage.count : 0}/${garage ? garage.max_slots : 5} Slot</b>). Hệ thống sẽ chỉ cất dino khi Gara còn slot trống.
              </p>
            </div>
          </div>

          <!-- ACTION BUTTON -->
          <div>
            <button onclick="AutoTreo.saveSettings()" class="btn-primary" style="width: 100%; padding: 12px; font-size: 1rem; font-weight: 900; border-radius: 10px; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer;">
              <span>💾</span> LƯU CÀI ĐẶT & KÍCH HOẠT AUTO TREO
            </button>
          </div>

        </div>

      </div>

      <!-- ========================================== -->
      <!-- FEATURE 3: NHẬT KÝ HOẠT ĐỘNG AUTO TREO -->
      <!-- ========================================== -->
      <div class="card" style="padding: 24px; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 1.3rem;">📋</span>
            <div>
              <h3 style="font-size: 1.15rem; font-weight: 900; color: #fff; margin: 0;">Nhật Ký Tự Động Hoá (Activity Logs)</h3>
              <p style="color: #94a3b8; font-size: 0.8rem; margin: 2px 0 0;">Lịch sử các hành động hệ thống máy chủ đã tự động thực thi cho bạn</p>
            </div>
          </div>
          <div>
            <button onclick="AutoTreo.clearLogs()" class="btn-secondary" style="padding: 6px 14px; font-size: 0.8rem; border-radius: 6px; cursor: pointer;">
              🗑️ Xóa Lịch Sử
            </button>
          </div>
        </div>

        <div id="autotreo-logs-list" style="display: flex; flex-direction: column; gap: 8px; max-height: 280px; overflow-y: auto; padding-right: 4px;">
          ${this.renderLogsHtml(logs)}
        </div>
      </div>
    `;
  },

  renderMutationOptions(selectedId) {
    return this.MUTATIONS.map(m => {
      const isSel = m.id === selectedId;
      return `<option value="${m.id}" ${isSel ? 'selected' : ''}>${m.icon} ${m.name}</option>`;
    }).join('');
  },

  getMutationDesc(mutId) {
    const found = this.MUTATIONS.find(m => m.id === mutId);
    return found ? found.desc : 'Đột biến sinh tồn trong game The Isle: Evrima.';
  },

  updateMutationPreview(slotNum, val) {
    const descEl = document.getElementById(`autotreo-slot-1-desc`);
    if (slotNum === 1) {
      document.getElementById('autotreo-slot-1-desc').textContent = this.getMutationDesc(val);
    } else if (slotNum === 2) {
      document.getElementById('autotreo-slot-2-desc').textContent = this.getMutationDesc(val);
    } else if (slotNum === 3) {
      document.getElementById('autotreo-slot-3-desc').textContent = this.getMutationDesc(val);
    } else if (slotNum === 4) {
      document.getElementById('autotreo-slot-4-desc').textContent = this.getMutationDesc(val);
    }
  },

  onGrowthSliderChange(val) {
    const el = document.getElementById('autotreo-target-growth-val');
    if (el) el.textContent = `${val}%`;
  },

  setTargetGrowth(val) {
    const slider = document.getElementById('autotreo-target-growth-slider');
    const valEl = document.getElementById('autotreo-target-growth-val');
    if (slider) slider.value = val;
    if (valEl) valEl.textContent = `${val}%`;
  },

  toggleFeature(type) {
    if (type === 'mutation') {
      const btn = document.getElementById('btn-toggle-auto-mutation');
      const isCurrentlyOn = btn.textContent.includes('ĐANG BẬT');
      if (isCurrentlyOn) {
        btn.textContent = '⚪ ĐANG TẮT';
        btn.style.background = 'rgba(0,0,0,0.4)';
        btn.style.borderColor = 'rgba(255,255,255,0.2)';
      } else {
        btn.textContent = '✅ ĐANG BẬT';
        btn.style.background = 'linear-gradient(135deg, #059669, #10b981)';
        btn.style.borderColor = '#10b981';
      }
    } else if (type === 'garage') {
      const btn = document.getElementById('btn-toggle-auto-garage');
      const isCurrentlyOn = btn.textContent.includes('ĐANG BẬT');
      if (isCurrentlyOn) {
        btn.textContent = '⚪ ĐANG TẮT';
        btn.style.background = 'rgba(0,0,0,0.4)';
        btn.style.borderColor = 'rgba(255,255,255,0.2)';
      } else {
        btn.textContent = '✅ ĐANG BẬT';
        btn.style.background = 'linear-gradient(135deg, #0284c7, #38bdf8)';
        btn.style.borderColor = '#38bdf8';
      }
    }
  },

  async saveSettings() {
    const user = JSON.parse(localStorage.getItem('steam_user') || 'null');
    const steamId = (user && (user.steamId || user.steam_id)) || (window.Garage && Garage.currentSteamId) || '';

    if (!steamId) {
      alert("Vui lòng đăng nhập Steam trước khi lưu cài đặt Auto Treo!");
      return;
    }

    const btnMut = document.getElementById('btn-toggle-auto-mutation');
    const btnGar = document.getElementById('btn-toggle-auto-garage');
    const autoMut = btnMut ? btnMut.textContent.includes('ĐANG BẬT') : false;
    const autoGar = btnGar ? btnGar.textContent.includes('ĐANG BẬT') : false;

    const s1 = (document.getElementById('autotreo-slot-1') || {}).value || 'None';
    const s2 = (document.getElementById('autotreo-slot-2') || {}).value || 'None';
    const s3 = (document.getElementById('autotreo-slot-3') || {}).value || 'None';
    const s4 = (document.getElementById('autotreo-slot-4') || {}).value || 'None';

    const targetGrowth = Number((document.getElementById('autotreo-target-growth-slider') || {}).value) || 100;

    const payload = {
      steam_id: steamId,
      action: "save_settings",
      auto_mutation_enabled: autoMut,
      slot1_mutation: s1,
      slot2_mutation: s2,
      slot3_mutation: s3,
      slot4_mutation: s4,
      auto_garage_enabled: autoGar,
      target_growth_percent: targetGrowth
    };

    try {
      const res = await fetch('/api/player/autotreo/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        if (window.App && typeof App.showToast === 'function') {
          App.showToast("🎉 Đã lưu cài đặt AUTO TREO thành công! Máy chủ đang tự động giám sát dino.", "success");
        } else {
          alert("Đã lưu cài đặt AUTO TREO thành công!");
        }
        await this.fetchData(true);
      } else {
        alert(data.message || data.error || "Lưu cài đặt thất bại!");
      }
    } catch (e) {
      console.error("[AutoTreo Save Error]", e);
      alert("Lỗi kết nối khi gửi cài đặt Auto Treo!");
    }
  },

  async clearLogs() {
    const user = JSON.parse(localStorage.getItem('steam_user') || 'null');
    const steamId = (user && (user.steamId || user.steam_id)) || (window.Garage && Garage.currentSteamId) || '';
    if (!confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử nhật ký Auto Treo?")) return;

    try {
      const res = await fetch('/api/player/autotreo/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steam_id: steamId, action: "clear_logs" })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        await this.fetchData(true);
      }
    } catch (e) {
      console.error("[AutoTreo Clear Logs Error]", e);
    }
  },

  renderLogsHtml(logs) {
    if (!logs || logs.length === 0) {
      return `
        <div style="text-align: center; padding: 24px; color: #64748b; font-size: 0.9rem;">
          Chưa có nhật ký hoạt động nào. Hãy bật Auto Mutation hoặc Auto Cất Gara và lưu cấu hình để bắt đầu!
        </div>
      `;
    }

    return logs.map(item => {
      let color = '#94a3b8';
      let bg = 'rgba(0,0,0,0.3)';
      let border = 'rgba(255,255,255,0.06)';

      if (item.type === 'success') {
        color = '#34d399';
        bg = 'rgba(16, 185, 129, 0.12)';
        border = 'rgba(16, 185, 129, 0.35)';
      } else if (item.type === 'warning') {
        color = '#fbbf24';
        bg = 'rgba(245, 158, 11, 0.12)';
        border = 'rgba(245, 158, 11, 0.35)';
      } else if (item.type === 'error') {
        color = '#f87171';
        bg = 'rgba(239, 68, 68, 0.12)';
        border = 'rgba(239, 68, 68, 0.35)';
      }

      return `
        <div style="background: ${bg}; border: 1px solid ${border}; border-radius: 8px; padding: 8px 12px; display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 0.84rem;">
          <div style="color: ${color}; line-height: 1.4;">${item.message}</div>
          <div style="color: #64748b; font-size: 0.74rem; font-family: monospace; white-space: nowrap;">${item.time || ''}</div>
        </div>
      `;
    }).join('');
  },

  updateDynamicStatus() {
    if (!this.data) return;
    const { dino, state } = this.data;
    const growthPct = dino ? Number(dino.growth_percent || (dino.growth * 100) || 0) : 0;
    
    const badge = document.getElementById('autotreo-growth-badge');
    if (badge) badge.textContent = `${growthPct.toFixed(1)}%`;

    const bar = document.getElementById('autotreo-progress-fill');
    if (bar) bar.style.width = `${Math.min(100, Math.max(0, growthPct))}%`;

    const logsContainer = document.getElementById('autotreo-logs-list');
    if (logsContainer && state && state.logs) {
      logsContainer.innerHTML = this.renderLogsHtml(state.logs);
    }
  },

  renderNotLoggedIn() {
    return `
      <div style="text-align: center; padding: 80px 20px; max-width: 580px; margin: 0 auto;">
        <div style="width: 88px; height: 88px; margin: 0 auto 20px; border-radius: 50%; background: radial-gradient(circle, rgba(56, 189, 248, 0.25), transparent); border: 2px solid #38bdf8; display: flex; align-items: center; justify-content: center; font-size: 2.8rem; box-shadow: 0 0 25px rgba(56, 189, 248, 0.4);">
          ⚡
        </div>
        <h2 style="font-size: 1.9rem; font-weight: 900; color: #fff; margin-bottom: 12px;">
          Tính Năng AUTO TREO Khủng Long 24/7
        </h2>
        <p style="color: #94a3b8; font-size: 0.98rem; line-height: 1.6; margin-bottom: 24px;">
          Vui lòng đăng nhập Steam để thiết lập tính năng Tự Động Nhận Mutation (mốc 26%, 50%, 76%) và Tự Động Cất Gara an toàn khi bạn vắng mặt!
        </p>
        <a href="/api/player/steam/login?redirect=%2F#autotreo" class="btn-primary" style="display: inline-flex; align-items: center; gap: 10px; font-size: 1.05rem; padding: 12px 28px; border-radius: 10px; text-decoration: none;">
          <span>🎮</span> Đăng Nhập Steam Để Sử Dụng
        </a>
      </div>
    `;
  }
};

window.AutoTreo = AutoTreo;
