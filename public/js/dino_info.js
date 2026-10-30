/**
 * 3MGAMING - MODULE THÔNG TIN KHỦNG LONG TRỰC TIẾP (LIVE DINO INFO)
 * Tương thích và đồng bộ 100% theo IslePilot Player Profile (/me)
 */

const DinoInfo = {
  data: null,
  pollTimer: null,
  isLoading: false,

  PRIME_QUESTS_VI: {
    1: { en: "Visit a Sanctuary as a juvenile", vi: "Ghé thăm Thánh Địa (Sanctuary) khi còn là con non" },
    2: { en: "Get nested in", vi: "Được ấp nở sinh ra từ tổ của người chơi khác" },
    3: { en: "Get perfect diet (1% of each)", vi: "Đạt chế độ ăn hoàn hảo (đầy đủ 3 dưỡng chất S, //, :)" },
    4: { en: "Visit Mass Migration zone", vi: "Đến khu vực Đại Di Cư (Mass Migration)" },
    5: { en: "Visit 2 Migration zones", vi: "Đến 2 khu vực Di Cư (Migration) khác nhau" },
    6: { en: "Visit 4 Patrol zones", vi: "Đến 4 khu vực Tuần Tra (Patrol Zones)" },
    7: { en: "Never be Infertile", vi: "Không bao giờ bị vô sinh trong suốt vòng đời" },
    8: { en: "Never get Muscle spasms", vi: "Không bị co giật cơ (không ăn thịt đồng loại)" },
    9: { en: "Raise children to Subadult", vi: "Nuôi dưỡng con non trong tổ lớn đến tuổi cận trưởng thành" },
    10: { en: "Be a Hypsi, Troodon, Beipi, Dryo or Deino", vi: "Thuộc loài đặc thù (Hypsi, Troodon, Beipi, Dryo, Deino)" }
  },

  MUTATION_DESC_VI: {
    "hematophagy": "Hút máu hồi phục sinh lực khi tấn công",
    "multichambered lungs": "Phổi nhiều ngăn - Tăng mạnh hồi thể lực (Stamina)",
    "hydrodynamic": "Thủy động lực - Tăng tốc bơi lội & giảm tiêu hao oxy",
    "cannibalistic": "Ăn thịt đồng loại mà không bị co giật",
    "osteosclerosis": "Xương đặc - Giảm mạnh tỉ lệ gãy xương",
    "epidermal fibrosis": "Xơ hóa biểu bì - Tăng giáp da chống cắn xé",
    "xerocole adaptation": "Thích nghi khô hạn - Tiêu hao nước cực chậm",
    "sustained hydration": "Giữ nước bền bỉ - Tăng sức chịu đựng khi khát",
    "gastronomic regeneration": "Hồi phục no bụng - Tăng tốc độ hồi máu khi no",
    "hemomania": "Cuồng chiến - Tăng sát thương khi đối phương chảy máu",
    "nocturnal": "Tầm nhìn đêm - Mắt sáng rõ trong bóng tối",
    "photosynthetic tissue": "Mô quang hợp - Giảm tiêu hao thức ăn",
    "none": "Ô trống (Chưa có đột biến)"
  },

  getDinoImageUrl(species) {
    if (window.Garage && typeof Garage.getDinoImageUrl === 'function') {
      return Garage.getDinoImageUrl(species);
    }
    if (!species) return '/assets/images/Tyrannosaurus.webp';
    const formattedName = species.charAt(0).toUpperCase() + species.slice(1).split(' ')[0];
    return `https://islepilot.eu/cdn/dino-art/render/${formattedName}.webp`;
  },

  isCarnivore(species) {
    if (window.Garage && typeof Garage.isCarnivore === 'function') {
      return Garage.isCarnivore(species);
    }
    const s = (species || '').toLowerCase();
    const herbivores = [
      'tenonto', 'pachy', 'hypsi', 'dryo', 'stego', 'diablo',
      'galli', 'beipi', 'maia', 'anky', 'bronto', 'para',
      'trike', 'camara', 'shant', 'theri', 'puerta'
    ];
    for (const h of herbivores) {
      if (s.includes(h)) return false;
    }
    return true;
  },

  async render() {
    const container = document.getElementById('view-dino-info');
    if (!container) return;

    if (!this.data) {
      container.innerHTML = `
        <div style="text-align: center; padding: 70px 20px;">
          <div class="spinner" style="margin: 0 auto 16px;"></div>
          <p style="color: #94a3b8; font-size: 1.05rem;">Đang tải hồ sơ & chỉ số trực tiếp từ máy chủ...</p>
        </div>
      `;
    } else {
      this.renderUI();
    }

    await this.fetchData();
    this.startAutoRefresh();
  },

  async fetchData() {
    if (this.isLoading) return;
    this.isLoading = true;

    const user = JSON.parse(localStorage.getItem('steam_user') || 'null');
    const steamParam = (user && user.steamId) ? `?steam_id=${user.steamId}` : '';

    try {
      const res = await fetch(`/api/player/dino-info${steamParam}&_t=${Date.now()}`);
      if (res.ok) {
        this.data = await res.json();
        this.renderUI();
      }
    } catch (e) {
      console.error("[DinoInfo] Lỗi tải dữ liệu:", e);
    } finally {
      this.isLoading = false;
    }
  },

  startAutoRefresh() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = setInterval(() => {
      const curTab = document.body.getAttribute('data-current-tab');
      const isInfoTab = curTab === 'dino-info' || curTab === 'dinoinfo' || window.location.hash === '#dino-info';
      if (isInfoTab) {
        this.fetchData();
      }
    }, 4000);
  },

  copyText(text, label) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      if (window.App && typeof App.showToast === 'function') {
        App.showToast(`📋 Đã sao chép ${label || 'tọa độ'}!`, 'success');
      } else {
        alert(`Đã sao chép: ${text}`);
      }
    }).catch(() => {
      prompt("Sao chép thủ công:", text);
    });
  },

  renderUI() {
    const container = document.getElementById('view-dino-info');
    if (!container) return;

    if (!this.data || !this.data.logged_in) {
      container.innerHTML = this.renderNotLoggedIn();
      return;
    }

    const { name, steam_id, online, wallet_balance, discord, playtime_hours, has_active_dino, dino, warnings, garage_count } = this.data;

    if (!has_active_dino || !dino) {
      container.innerHTML = this.renderNoActiveDino(name, steam_id, garage_count, wallet_balance);
      return;
    }

    const isCarno = this.isCarnivore(dino.species);
    const dietBadge = isCarno ? '🥩 Ăn Thịt (Carnivore)' : '🌿 Ăn Cỏ (Herbivore)';
    const dietClass = isCarno ? 'diet-carnivore' : 'diet-herbivore';
    const dinoImg = this.getDinoImageUrl(dino.species);

    // Vitals Percentages
    const hpPct = Math.min(100, Math.max(0, dino.health_percent || 0));
    const hungerPct = Math.min(100, Math.max(0, dino.hunger_percent || 0));
    const thirstPct = Math.min(100, Math.max(0, dino.thirst_percent || 0));

    // Vitals Status Tags
    const hpTag = hpPct < 30 ? '<span style="color: #ef4444; font-weight: 800;">⚠️ Nguy Kịch</span>' : '<span style="color: #10b981;">Khỏe Mạnh</span>';
    const hungerTag = hungerPct < 25 ? '<span style="color: #f59e0b; font-weight: 800;">⚠️ Đang Đói</span>' : '<span style="color: #38bdf8;">Đủ Dinh Dưỡng</span>';
    const thirstTag = thirstPct < 25 ? '<span style="color: #06b6d4; font-weight: 800;">⚠️ Khát Nước</span>' : '<span style="color: #3b82f6;">Đủ Nước</span>';

    // Position Coordinates
    const pos = dino.position || {};
    const posStr = (pos.x !== null && pos.x !== undefined) ? `X: ${pos.x}, Y: ${pos.y}, Z: ${pos.z}` : 'Đang cập nhật...';

    // Mutation Slots
    const mutSlots = dino.mutation_slots || {};
    const activeMuts = (mutSlots.active && mutSlots.active.length > 0) ? mutSlots.active : [];
    const parentMuts = (mutSlots.parent && mutSlots.parent.length > 0) ? mutSlots.parent : [];
    const elderAMuts = (mutSlots.elderA && mutSlots.elderA.length > 0) ? mutSlots.elderA : [];
    const elderBMuts = (mutSlots.elderB && mutSlots.elderB.length > 0) ? mutSlots.elderB : [];

    // Prime Elder Progression
    const prime = dino.prime || {};
    const primeQuests = prime.quests || [];
    const primeCompleted = prime.completed || 0;
    const primeRequired = prime.required || 5;
    const primeEligible = prime.eligible || (primeCompleted >= primeRequired);
    const isElder = dino.is_prime_elder || prime.isElder;

    let primeStatusBadge = '';
    if (isElder) {
      primeStatusBadge = `<span style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(217, 119, 6, 0.4)); color: #fbbf24; border: 1px solid #f59e0b; padding: 6px 14px; border-radius: 20px; font-weight: 800; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 0 14px rgba(245, 158, 11, 0.35);">
        👑 PRIME ELDER (CỔ ĐẠI TỐI THƯỢNG)
      </span>`;
    } else if (primeEligible) {
      primeStatusBadge = `<span style="background: rgba(16, 185, 129, 0.25); color: #34d399; border: 1px solid #10b981; padding: 6px 14px; border-radius: 20px; font-weight: 800; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 6px;">
        🚀 ĐỦ ĐIỀU KIỆN PRIME ELDER (${primeCompleted}/${primeRequired})
      </span>`;
    } else {
      primeStatusBadge = `<span style="background: rgba(148, 163, 184, 0.15); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.3); padding: 6px 14px; border-radius: 20px; font-weight: 700; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 6px;">
        ⏳ TIẾN ĐỘ PRIME: ${primeCompleted}/${primeRequired} NHIỆM VỤ
      </span>`;
    }

    container.innerHTML = `
      <!-- TOP ACTION BAR -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 24px;">
        <div>
          <h1 style="font-size: 1.8rem; font-weight: 900; color: #fff; margin: 0; display: flex; align-items: center; gap: 10px;">
            <span>🦕</span> Thông Tin Khủng Long Trực Tiếp
          </h1>
          <p style="color: #94a3b8; font-size: 0.92rem; margin: 4px 0 0;">
            Đồng bộ thời gian thực theo chuẩn IslePilot & Máy chủ 3MGAMING (Evrima)
          </p>
        </div>
        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <button class="btn-secondary" onclick="DinoInfo.fetchData()" style="padding: 8px 16px; font-size: 0.88rem; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px;">
            🔄 Làm Mới
          </button>
          <a href="#map" class="btn-secondary" style="padding: 8px 16px; font-size: 0.88rem; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px; text-decoration: none;">
            🗺️ Bản Đồ Gateway
          </a>
          <a href="#garage" class="btn-primary" style="padding: 8px 18px; font-size: 0.88rem; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px; text-decoration: none;">
            🦖 Gara Dino (${garage_count})
          </a>
        </div>
      </div>

      <!-- MAIN SPOTLIGHT CARD -->
      <div class="card" style="margin-bottom: 24px; padding: 24px; background: linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(30, 41, 59, 0.9)); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);">
        <div style="display: grid; grid-template-columns: minmax(220px, 300px) 1fr; gap: 28px; align-items: center;">
          
          <!-- DINO IMAGE & STAGE -->
          <div style="position: relative; text-align: center; background: radial-gradient(circle, rgba(56, 189, 248, 0.12), transparent 70%); border-radius: 14px; padding: 16px; border: 1px solid rgba(56, 189, 248, 0.2);">
            <img src="${dinoImg}" alt="${dino.species}" style="width: 100%; max-height: 220px; object-fit: contain; filter: drop-shadow(0 10px 18px rgba(0,0,0,0.6)); transition: transform 0.3s;" onerror="this.src='/assets/images/Tyrannosaurus.webp'">
            
            <div style="position: absolute; top: 12px; left: 12px;">
              <span class="diet-badge ${dietClass}" style="font-size: 0.78rem; padding: 4px 10px; border-radius: 6px;">
                ${dietBadge}
              </span>
            </div>

            <div style="position: absolute; top: 12px; right: 12px;">
              <span style="background: rgba(0,0,0,0.7); color: #cbd5e1; border: 1px solid rgba(255,255,255,0.2); font-size: 0.78rem; padding: 4px 10px; border-radius: 6px; font-weight: 700;">
                ${dino.gender_text}
              </span>
            </div>

            <div style="margin-top: 12px; display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;">
              <span style="background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid #10b981; font-weight: 800; font-size: 0.85rem; padding: 4px 12px; border-radius: 20px;">
                Tăng Trưởng: ${dino.growth_percent}%
              </span>
              <span style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); font-weight: 700; font-size: 0.82rem; padding: 4px 10px; border-radius: 20px;">
                ${dino.stage}
              </span>
            </div>
          </div>

          <!-- DINO & PLAYER DETAILS -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px; margin-bottom: 12px;">
              <div>
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
                  <span style="font-size: 0.85rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">
                    KHỦNG LONG HIỆN TẠI
                  </span>
                  ${online ? `
                    <span style="background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid #10b981; font-size: 0.74rem; font-weight: 800; padding: 2px 8px; border-radius: 12px; display: inline-flex; align-items: center; gap: 4px;">
                      <span style="width: 6px; height: 6px; border-radius: 50%; background: #10b981; animation: pulse 1.5s infinite;"></span>
                      ONLINE TRONG GAME
                    </span>
                  ` : `
                    <span style="background: rgba(148, 163, 184, 0.2); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.4); font-size: 0.74rem; font-weight: 700; padding: 2px 8px; border-radius: 12px;">
                      ⚪ OFFLINE (NGOẠI TUYẾN)
                    </span>
                  `}
                </div>
                <h2 style="font-size: 2.2rem; font-weight: 900; color: #fff; margin: 0; line-height: 1.1;">
                  ${dino.species}
                </h2>
              </div>
              <div>
                ${primeStatusBadge}
              </div>
            </div>

            <!-- PLAYER PROFILE MINI GRID -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06); padding: 14px; border-radius: 12px;">
              <div>
                <div style="font-size: 0.78rem; color: #94a3b8;">Người Chơi Steam</div>
                <div style="font-weight: 800; color: #fff; font-size: 1.05rem;">${name}</div>
                <div style="font-size: 0.76rem; color: #64748b; font-family: monospace; display: flex; align-items: center; gap: 4px; margin-top: 2px;">
                  <span>${steam_id}</span>
                  <button onclick="DinoInfo.copyText('${steam_id}', 'Steam ID')" style="background: none; border: none; color: #38bdf8; cursor: pointer; padding: 0 4px; font-size: 0.8rem;" title="Copy Steam ID">📋</button>
                </div>
              </div>

              <div>
                <div style="font-size: 0.78rem; color: #94a3b8;">Ví Xu 3MGAMING</div>
                <div style="font-weight: 800; color: #fbbf24; font-size: 1.15rem;">${(wallet_balance || 0).toLocaleString('vi-VN')} Xu</div>
                <div style="font-size: 0.76rem; color: #10b981;">Đồng bộ IslePilot</div>
              </div>

              <div>
                <div style="font-size: 0.78rem; color: #94a3b8;">Discord Liên Kết</div>
                <div style="font-weight: 700; color: #818cf8; font-size: 0.95rem;">
                  ${discord ? discord.username || discord.id : 'Chưa liên kết'}
                </div>
                <div style="font-size: 0.76rem; color: #64748b;">
                  ${discord ? `ID: ${discord.id}` : 'Link qua IslePilot'}
                </div>
              </div>

              <div>
                <div style="font-size: 0.78rem; color: #94a3b8;">Thời Gian Chơi</div>
                <div style="font-weight: 800; color: #38bdf8; font-size: 1.05rem;">${playtime_hours} Giờ</div>
                <div style="font-size: 0.76rem; color: #64748b;">Tổng thời gian sống</div>
              </div>
            </div>

          </div>

        </div>
      </div>

      <!-- LIVE VITALS (MÁU, ĐÓI, KHÁT) -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 18px; margin-bottom: 24px;">
        
        <!-- HEALTH CARD -->
        <div class="card" style="padding: 18px; background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.3rem;">❤️</span>
              <span style="font-weight: 800; color: #fff; font-size: 0.98rem;">MÁU (HEALTH)</span>
            </div>
            <div>${hpTag}</div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
            <span style="font-size: 1.4rem; font-weight: 900; color: #f87171; font-family: monospace;">
              ${Math.round(dino.health).toLocaleString('vi-VN')} <span style="font-size: 0.85rem; color: #94a3b8; font-weight: normal;">/ ${Math.round(dino.max_health).toLocaleString('vi-VN')} HP</span>
            </span>
            <span style="font-weight: 800; color: #f87171; font-size: 1.1rem;">${hpPct}%</span>
          </div>
          <div style="background: rgba(0,0,0,0.5); height: 12px; border-radius: 6px; overflow: hidden; border: 1px solid rgba(239, 68, 68, 0.2);">
            <div style="background: linear-gradient(90deg, #ef4444, #f43f5e); width: ${hpPct}%; height: 100%; border-radius: 6px; transition: width 0.4s ease; box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);"></div>
          </div>
        </div>

        <!-- HUNGER CARD -->
        <div class="card" style="padding: 18px; background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.3rem;">🍖</span>
              <span style="font-weight: 800; color: #fff; font-size: 0.98rem;">THỨC ĂN (HUNGER)</span>
            </div>
            <div>${hungerTag}</div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
            <span style="font-size: 1.4rem; font-weight: 900; color: #fbbf24; font-family: monospace;">
              ${Math.round(dino.hunger).toLocaleString('vi-VN')} <span style="font-size: 0.85rem; color: #94a3b8; font-weight: normal;">/ ${Math.round(dino.max_hunger).toLocaleString('vi-VN')}</span>
            </span>
            <span style="font-weight: 800; color: #fbbf24; font-size: 1.1rem;">${hungerPct}%</span>
          </div>
          <div style="background: rgba(0,0,0,0.5); height: 12px; border-radius: 6px; overflow: hidden; border: 1px solid rgba(245, 158, 11, 0.2);">
            <div style="background: linear-gradient(90deg, #f59e0b, #fbbf24); width: ${hungerPct}%; height: 100%; border-radius: 6px; transition: width 0.4s ease; box-shadow: 0 0 10px rgba(245, 158, 11, 0.5);"></div>
          </div>
        </div>

        <!-- THIRST CARD -->
        <div class="card" style="padding: 18px; background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(6, 182, 212, 0.3); border-radius: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.3rem;">💧</span>
              <span style="font-weight: 800; color: #fff; font-size: 0.98rem;">NƯỚC UỐNG (THIRST)</span>
            </div>
            <div>${thirstTag}</div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
            <span style="font-size: 1.4rem; font-weight: 900; color: #38bdf8; font-family: monospace;">
              ${Math.round(dino.thirst).toLocaleString('vi-VN')} <span style="font-size: 0.85rem; color: #94a3b8; font-weight: normal;">/ ${Math.round(dino.max_thirst).toLocaleString('vi-VN')}</span>
            </span>
            <span style="font-weight: 800; color: #38bdf8; font-size: 1.1rem;">${thirstPct}%</span>
          </div>
          <div style="background: rgba(0,0,0,0.5); height: 12px; border-radius: 6px; overflow: hidden; border: 1px solid rgba(6, 182, 212, 0.2);">
            <div style="background: linear-gradient(90deg, #0284c7, #38bdf8); width: ${thirstPct}%; height: 100%; border-radius: 6px; transition: width 0.4s ease; box-shadow: 0 0 10px rgba(56, 189, 248, 0.5);"></div>
          </div>
        </div>

      </div>

      <!-- GPS POSITION BAR -->
      <div class="card" style="padding: 18px 24px; margin-bottom: 24px; background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div style="width: 44px; height: 44px; border-radius: 10px; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); display: flex; align-items: center; justify-content: center; font-size: 1.4rem;">
              🧭
            </div>
            <div>
              <div style="font-size: 0.78rem; font-weight: 800; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px;">TỌA ĐỘ VỊ TRÍ GPS (LIVE COORDINATES)</div>
              <div style="font-size: 1.15rem; font-weight: 800; color: #fff; font-family: monospace; letter-spacing: 0.5px;">
                ${pos.x !== null ? `X: <b style="color: #38bdf8;">${pos.x}</b> &nbsp;&bull;&nbsp; Y: <b style="color: #38bdf8;">${pos.y}</b> &nbsp;&bull;&nbsp; Z (Độ cao): <b style="color: #38bdf8;">${pos.z}</b> &nbsp;&bull;&nbsp; Góc quay: <b style="color: #fbbf24;">${pos.yaw}°</b>` : 'Đang ở sảnh hoặc chưa định vị'}
              </div>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 10px;">
            ${pos.x !== null ? `
              <button onclick="DinoInfo.copyText('${posStr}', 'Tọa độ GPS')" class="btn-secondary" style="padding: 8px 14px; font-size: 0.84rem; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px;">
                📋 Sao Chép Tọa Độ
              </button>
            ` : ''}
            <a href="#map" class="btn-primary" style="padding: 8px 16px; font-size: 0.84rem; border-radius: 8px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
              🗺️ Mở Bản Đồ Gateway
            </a>
          </div>
        </div>
      </div>

      <!-- MUTATION SLOTS (HỆ THỐNG ĐỘT BIẾN GEN) -->
      <div class="card" style="padding: 24px; margin-bottom: 24px; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; flex-wrap: wrap; gap: 10px;">
          <div>
            <h3 style="font-size: 1.25rem; font-weight: 900; color: #fff; margin: 0; display: flex; align-items: center; gap: 8px;">
              <span>🧬</span> Hệ Thống Đột Biến Gen (Mutation Slots)
            </h3>
            <p style="color: #94a3b8; font-size: 0.85rem; margin: 2px 0 0;">
              Các đột biến gen hiện tại đang kích hoạt và kế thừa từ gia phả của khủng long
            </p>
          </div>
          <span style="background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid #10b981; font-size: 0.8rem; font-weight: 800; padding: 4px 12px; border-radius: 14px;">
            4 Gen Kích Hoạt &bull; 4 Gen Kế Thừa
          </span>
        </div>

        <!-- 4 ACTIVE MUTATIONS -->
        <div style="margin-bottom: 20px;">
          <div style="font-size: 0.82rem; font-weight: 800; color: #34d399; text-transform: uppercase; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
            <span>⚡</span> Gen Đang Kích Hoạt (Active Mutations):
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px;">
            ${this.renderMutationCards(activeMuts, '#10b981')}
          </div>
        </div>

        <!-- 4 PARENT MUTATIONS -->
        <div>
          <div style="font-size: 0.82rem; font-weight: 800; color: #818cf8; text-transform: uppercase; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
            <span>🧬</span> Gen Di Truyền Bố Mẹ (Parent Mutations):
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px;">
            ${this.renderMutationCards(parentMuts, '#6366f1')}
          </div>
        </div>
      </div>

      <!-- PRIME ELDER EVOLUTION & QUEST CHECKLIST -->
      <div class="card" style="padding: 24px; margin-bottom: 24px; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; flex-wrap: wrap; gap: 10px;">
          <div>
            <h3 style="font-size: 1.25rem; font-weight: 900; color: #fff; margin: 0; display: flex; align-items: center; gap: 8px;">
              <span>🌟</span> Tiến Trình Prime Elder (Tiến Hóa Cổ Đại)
            </h3>
            <p style="color: #94a3b8; font-size: 0.85rem; margin: 2px 0 0;">
              Hoàn thành tối thiểu <b>5/10 nhiệm vụ</b> trong vòng đời để đủ điều kiện hóa thành Prime Elder!
            </p>
          </div>
          <div style="font-size: 0.95rem; font-weight: 800; color: #fbbf24; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); padding: 6px 14px; border-radius: 8px;">
            Tiến độ: ${primeCompleted} / 10 (${primeCompleted >= 5 ? '✅ Đạt Tiêu Chuẩn' : `Thiếu ${5 - primeCompleted} nhiệm vụ`})
          </div>
        </div>

        <!-- PROGRESS BAR -->
        <div style="background: rgba(0,0,0,0.5); height: 14px; border-radius: 7px; overflow: hidden; margin-bottom: 20px; border: 1px solid rgba(245, 158, 11, 0.2);">
          <div style="background: linear-gradient(90deg, #f59e0b, #eab308, #10b981); width: ${Math.min(100, (primeCompleted / 5) * 100)}%; height: 100%; border-radius: 7px; transition: width 0.4s ease; box-shadow: 0 0 12px rgba(245, 158, 11, 0.5);"></div>
        </div>

        <!-- 10 QUESTS GRID -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 12px;">
          ${this.renderPrimeQuestsList(primeQuests)}
        </div>
      </div>

      <!-- ACCOUNT SAFETY & STATUS -->
      <div class="card" style="padding: 18px 24px; background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 1.3rem;">🛡️</span>
            <div>
              <div style="font-weight: 800; color: #fff; font-size: 0.95rem;">Tình Trạng Tài Khoản & Vi Phạm</div>
              <div style="font-size: 0.8rem; color: #94a3b8;">Hệ thống IslePilot Warning & Ban Check</div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 16px;">
            <div>
              <span style="color: #94a3b8; font-size: 0.82rem;">Cảnh báo: </span>
              <span style="color: ${(warnings && warnings.count > 0) ? '#ef4444' : '#10b981'}; font-weight: 800;">
                ${(warnings && warnings.count > 0) ? `${warnings.count} Cảnh Báo` : '0 Vi Phạm (Tốt)'}
              </span>
            </div>
            <div>
              <span style="color: #94a3b8; font-size: 0.82rem;">Lệnh cấm: </span>
              <span style="color: #10b981; font-weight: 800;">Không có</span>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderMutationCards(mutList, accentColor) {
    let slots = mutList.slice(0, 4);
    while (slots.length < 4) slots.push("None");

    return slots.map((mut, idx) => {
      const isNone = !mut || mut.toLowerCase() === 'none';
      const cleanMut = mut ? mut.toLowerCase().trim() : 'none';
      const desc = this.MUTATION_DESC_VI[cleanMut] || (isNone ? 'Chưa nhận đột biến gen' : 'Đột biến sinh tồn Evrima');

      return `
        <div style="background: rgba(0,0,0,0.35); border: 1px solid ${isNone ? 'rgba(255,255,255,0.08)' : accentColor}; padding: 12px 14px; border-radius: 10px; display: flex; align-items: flex-start; gap: 10px;">
          <div style="width: 32px; height: 32px; border-radius: 8px; background: ${isNone ? 'rgba(255,255,255,0.05)' : 'rgba(16, 185, 129, 0.15)'}; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0;">
            ${isNone ? '⚪' : '🧬'}
          </div>
          <div>
            <div style="font-size: 0.72rem; color: #64748b; font-weight: 700; text-transform: uppercase;">Slot ${idx + 1}</div>
            <div style="font-size: 0.92rem; font-weight: 800; color: ${isNone ? '#64748b' : '#fff'}; margin: 1px 0;">
              ${isNone ? 'Trống (None)' : mut}
            </div>
            <div style="font-size: 0.76rem; color: #94a3b8; line-height: 1.3;">
              ${desc}
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  renderPrimeQuestsList(quests) {
    if (!quests || quests.length === 0) {
      // Fallback 10 standard quests
      quests = [1,2,3,4,5,6,7,8,9,10].map(i => ({
        index: i,
        name: this.PRIME_QUESTS_VI[i]?.en || `Nhiệm vụ Prime ${i}`,
        done: false
      }));
    }

    return quests.map(q => {
      const qInfo = this.PRIME_QUESTS_VI[q.index] || { en: q.name, vi: q.name };
      const isDone = !!q.done;

      return `
        <div style="background: ${isDone ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0,0,0,0.3)'}; border: 1px solid ${isDone ? 'rgba(16, 185, 129, 0.35)' : 'rgba(255,255,255,0.06)'}; padding: 12px 16px; border-radius: 10px; display: flex; align-items: center; justify-content: space-between; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 28px; height: 28px; border-radius: 50%; background: ${isDone ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)'}; display: flex; align-items: center; justify-content: center; font-size: 0.95rem; flex-shrink: 0;">
              ${isDone ? '✅' : '⏳'}
            </div>
            <div>
              <div style="font-weight: 800; font-size: 0.88rem; color: ${isDone ? '#34d399' : '#cbd5e1'};">
                ${qInfo.vi}
              </div>
              <div style="font-size: 0.74rem; color: #64748b;">
                ${qInfo.en}
              </div>
            </div>
          </div>
          <div>
            <span style="font-size: 0.74rem; font-weight: 800; padding: 3px 8px; border-radius: 6px; ${isDone ? 'background: rgba(16, 185, 129, 0.2); color: #34d399;' : 'background: rgba(255,255,255,0.05); color: #64748b;'}">
              ${isDone ? 'HOÀN THÀNH' : 'CHƯA ĐẠT'}
            </span>
          </div>
        </div>
      `;
    }).join('');
  },

  renderNotLoggedIn() {
    return `
      <div style="text-align: center; padding: 70px 20px; max-width: 580px; margin: 0 auto;">
        <div style="width: 88px; height: 88px; margin: 0 auto 20px; border-radius: 50%; background: radial-gradient(circle, rgba(56, 189, 248, 0.2), transparent); border: 2px solid #38bdf8; display: flex; align-items: center; justify-content: center; font-size: 2.8rem; box-shadow: 0 0 25px rgba(56, 189, 248, 0.3);">
          🦕
        </div>
        <h2 style="font-size: 1.8rem; font-weight: 900; color: #fff; margin-bottom: 12px;">
          Xem Hồ Sơ & Chỉ Số Khủng Long Trực Tiếp
        </h2>
        <p style="color: #94a3b8; font-size: 0.98rem; line-height: 1.6; margin-bottom: 24px;">
          Vui lòng đăng nhập Steam để xem chỉ số sinh tồn thời gian thực (Máu, Đói, Khát), tọa độ GPS, 16 đột biến gen và tiến độ Prime Elder của bạn!
        </p>
        <a href="/api/player/steam/login?redirect=%2F#dino-info" class="btn-primary" style="display: inline-flex; align-items: center; gap: 10px; font-size: 1.05rem; padding: 12px 28px; border-radius: 10px; text-decoration: none;">
          <span>🎮</span> Đăng Nhập Bằng Steam Ngay
        </a>
      </div>
    `;
  },

  renderNoActiveDino(name, steam_id, garage_count, wallet_balance) {
    return `
      <div class="card" style="text-align: center; padding: 60px 24px; max-width: 680px; margin: 20px auto; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px;">
        <div style="font-size: 3.5rem; margin-bottom: 16px;">🦖</div>
        <h2 style="font-size: 1.7rem; font-weight: 900; color: #fff; margin-bottom: 8px;">
          Xin chào, ${name}!
        </h2>
        <p style="color: #38bdf8; font-weight: 700; font-size: 1.05rem; margin-bottom: 12px;">
          Hiện bạn chưa có khủng long nào đang sống ngoài bản đồ máy chủ.
        </p>
        <p style="color: #94a3b8; font-size: 0.92rem; line-height: 1.6; margin-bottom: 24px;">
          Khủng long của bạn có thể đang được cất an toàn trong <b>Gara Dino</b> hoặc bạn vừa mới chết/chưa vào server tạo nhân vật. Bạn có thể mở Gara để rút dino ra map chơi ngay!
        </p>

        <div style="display: inline-flex; gap: 12px; flex-wrap: wrap; justify-content: center;">
          <a href="#garage" class="btn-primary" style="padding: 12px 24px; font-size: 0.95rem; border-radius: 8px; text-decoration: none; display: inline-flex; align-items: center; gap: 8px;">
            🦕 Mở Gara Dino (${garage_count} Khủng Long)
          </a>
          <button onclick="DinoInfo.fetchData()" class="btn-secondary" style="padding: 12px 20px; font-size: 0.95rem; border-radius: 8px; display: inline-flex; align-items: center; gap: 8px;">
            🔄 Kiểm Tra Lại
          </button>
        </div>
      </div>
    `;
  }
};

window.DinoInfo = DinoInfo;
