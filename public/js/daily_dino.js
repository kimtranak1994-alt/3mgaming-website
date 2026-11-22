/**
 * 3MGAMING - Chức năng Nhận Khủng Long Mỗi 24 Giờ (Daily Prime Dino 89% & 4 Mutations)
 * Mỗi tài khoản Steam sau mỗi 24 giờ được chọn 1 loài khủng long, 89% Prime, 4 Đột biến tự chọn vào Gara!
 */

const DailyDino = {
  data: null,
  selectedSpecies: 'Tyrannosaurus',
  selectedGender: 'Male',
  selectedMutations: [
    'Multichambered Lungs',
    'Hypermetabolic Inanition',
    'Congenital Hypoalgesia',
    'Photosynthetic Tissue'
  ],
  filterCategory: 'all',
  searchQuery: '',
  timerInterval: null,
  isClaiming: false,

  async render() {
    const container = document.getElementById('nhandino-container');
    if (!container) return;

    container.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; color: var(--text-muted);">
        <i class="fas fa-spinner fa-spin" style="font-size: 2.2rem; margin-bottom: 14px; color: #38bdf8;"></i>
        <div style="font-size: 1.05rem; font-weight: 600; color: #e2e8f0;">Đang kiểm tra lượt nhận khủng long 24 giờ...</div>
      </div>
    `;

    const user = JSON.parse(localStorage.getItem('steam_user') || 'null');
    const steamId = user && user.steamId ? user.steamId : '';

    try {
      const url = steamId ? `/api/player/daily-dino?steam_id=${encodeURIComponent(steamId)}` : '/api/player/daily-dino';
      const res = await fetch(url);
      const json = await res.json();
      if (json && json.ok) {
        this.data = json;
        if (json.default_mutations && (!this.selectedMutations || this.selectedMutations.length === 0)) {
          this.selectedMutations = [...json.default_mutations];
        }
      } else {
        this.data = null;
      }
    } catch (e) {
      console.warn("Lỗi tải thông tin nhận dino 24h:", e);
      this.data = null;
    }

    this.displayView();
  },

  displayView() {
    const container = document.getElementById('nhandino-container');
    if (!container) return;

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    const user = JSON.parse(localStorage.getItem('steam_user') || 'null');
    const isLoggedIn = !!(user && user.steamId);
    const d = this.data;

    const canClaim = isLoggedIn && d && d.can_claim;
    let remainingSec = d ? (d.remaining_seconds || 0) : 0;

    // Danh sách loài & đột biến
    const speciesList = (d && d.species_list && d.species_list.length > 0) ? d.species_list : this.getFallbackSpecies();
    const mutationList = (d && d.mutation_list && d.mutation_list.length > 0) ? d.mutation_list : this.getFallbackMutations();

    // Lọc theo Category và Search
    const filteredSpecies = speciesList.filter(s => {
      const matchCat = this.filterCategory === 'all' || s.category === this.filterCategory;
      const sName = (s.name || s.species || '').toLowerCase();
      const matchSearch = !this.searchQuery || sName.includes(this.searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });

    // Tạo HTML các thẻ khủng long
    const speciesCardsHtml = filteredSpecies.map(s => {
      const isSel = this.selectedSpecies === s.species;
      const isCarno = s.category === 'carnivore';
      const imgUrl = typeof Garage !== 'undefined' && Garage.getDinoImageUrl 
        ? Garage.getDinoImageUrl(s.species) 
        : `https://islepilot.eu/cdn/dino-art/icon-sm/${s.species}.webp`;

      return `
        <div class="daily-dino-card ${isSel ? 'active' : ''}" 
             data-species="${s.species}"
             onclick="DailyDino.selectSpecies('${s.species}')"
             style="cursor: pointer; border: 1.5px solid ${isSel ? '#38bdf8' : 'rgba(255,255,255,0.08)'}; background: ${isSel ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(14, 165, 233, 0.08) 100%)' : 'rgba(255,255,255,0.025)'}; padding: 12px; border-radius: 12px; display: flex; align-items: center; gap: 12px; transition: all 0.2s ease; position: relative; box-shadow: ${isSel ? '0 0 16px rgba(56, 189, 248, 0.25)' : 'none'};">
          <img src="${imgUrl}" 
               alt="${s.species}" 
               style="width: 44px; height: 44px; object-fit: contain; border-radius: 10px; background: rgba(0,0,0,0.4); padding: 4px; border: 1px solid rgba(255,255,255,0.08);"
               onerror="this.src='https://islepilot.eu/cdn/dino-art/icon-sm/Ceratosaurus.webp'">
          <div style="flex: 1; text-align: left; min-width: 0;">
            <div style="font-weight: 700; color: #fff; font-size: 0.92rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${s.name || s.species}
            </div>
            <div style="font-size: 0.76rem; color: ${isCarno ? '#f87171' : '#34d399'}; display: flex; align-items: center; gap: 6px; margin-top: 2px;">
              <span>${isCarno ? '🥩 Ăn thịt' : '🌿 Ăn cỏ'}</span> &bull; 
              <span style="color: #38bdf8; font-weight: 700;">👑 89% Prime</span>
            </div>
          </div>
          <div style="color: ${isSel ? '#38bdf8' : 'rgba(255,255,255,0.2)'}; font-size: 1.25rem;">
            ${isSel ? '✔️' : '⚪'}
          </div>
        </div>
      `;
    }).join('');

    // HTML 4 ô chọn đột biến gen
    const mutationSlotsHtml = [0, 1, 2, 3].map(idx => {
      const curMut = this.selectedMutations[idx] || (this.data && this.data.default_mutations ? this.data.default_mutations[idx] : 'None');
      const optionsHtml = mutationList.map(m => `
        <option value="${m.id}" ${curMut === m.id ? 'selected' : ''}>
          ${m.name}
        </option>
      `).join('');

      return `
        <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(56, 189, 248, 0.25); padding: 12px 14px; border-radius: 12px; display: flex; flex-direction: column; gap: 6px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.82rem; font-weight: 800; color: #38bdf8; display: flex; align-items: center; gap: 6px;">
              <span>🧬</span> Slot Đột Biến ${idx + 1}
            </span>
            <span style="font-size: 0.72rem; color: #94a3b8; background: rgba(255,255,255,0.06); padding: 2px 8px; border-radius: 999px;">Active Slot</span>
          </div>
          <select id="daily-dino-mutation-${idx}" 
                  onchange="DailyDino.setMutation(${idx}, this.value)"
                  style="width: 100%; background: #0b1120; color: #f8fafc; border: 1px solid rgba(56, 189, 248, 0.35); padding: 8px 10px; border-radius: 8px; font-size: 0.85rem; outline: none; cursor: pointer; transition: border-color 0.2s;">
            ${optionsHtml}
          </select>
        </div>
      `;
    }).join('');

    // Banner trạng thái
    let statusBannerHtml = '';
    if (!isLoggedIn) {
      statusBannerHtml = `
        <div style="background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.35); border-radius: 12px; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 1.8rem;">⚠️</span>
            <div>
              <div style="font-weight: 700; color: #fca5a5; font-size: 0.95rem;">Bạn chưa đăng nhập Steam</div>
              <div style="color: #cbd5e1; font-size: 0.82rem;">Vui lòng đăng nhập tài khoản Steam để nhận khủng long 89% Prime mỗi 24 giờ.</div>
            </div>
          </div>
          <a href="/api/player/steam/login?redirect=%2F#nhandino" class="btn-steam" style="padding: 9px 18px; font-weight: 700;">
            <span>🎮 Đăng nhập Steam</span>
          </a>
        </div>
      `;
    } else if (canClaim) {
      statusBannerHtml = `
        <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 12px; padding: 16px 20px; display: flex; align-items: center; gap: 14px; box-shadow: 0 0 20px rgba(16, 185, 129, 0.12);">
          <span style="font-size: 2rem;">🎉</span>
          <div>
            <div style="font-weight: 800; color: #6ee7b7; font-size: 1.05rem; display: flex; align-items: center; gap: 8px;">
              <span>SẴN SÀNG NHẬN DINO HÔM NAY!</span>
              <span class="pulse-dot" style="background: #10b981; box-shadow: 0 0 10px #10b981;"></span>
            </div>
            <div style="color: #cbd5e1; font-size: 0.85rem; margin-top: 3px;">
              Tài khoản của bạn đã đủ điều kiện! Hãy chọn 1 loài khủng long yêu thích và 4 đột biến gen rồi bấm Xác nhận bên dưới.
            </div>
          </div>
        </div>
      `;
    } else {
      statusBannerHtml = `
        <div style="background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.35); border-radius: 12px; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 14px;">
            <span style="font-size: 2rem;">⏱️</span>
            <div>
              <div style="font-weight: 800; color: #fbbf24; font-size: 1rem;">Bạn đã nhận Dino hôm nay!</div>
              <div style="color: #cbd5e1; font-size: 0.85rem; margin-top: 2px;">
                Mỗi tài khoản được nhận 1 khủng long sau mỗi 24 giờ. Lượt tiếp theo mở sau:
              </div>
            </div>
          </div>
          <div id="daily-dino-countdown" style="font-size: 1.25rem; font-weight: 900; color: #fbbf24; background: rgba(0,0,0,0.4); padding: 8px 16px; border-radius: 10px; border: 1px solid rgba(245, 158, 11, 0.3); letter-spacing: 1px; font-family: monospace;">
            Đang tính...
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <!-- Header Card -->
      <div class="card" style="margin-bottom: 22px; border: 1px solid rgba(56, 189, 248, 0.3); background: radial-gradient(circle at 10% 10%, rgba(56, 189, 248, 0.12) 0%, rgba(10, 8, 16, 0.95) 70%);">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px; margin-bottom: 14px;">
          <div>
            <h1 style="font-size: 1.6rem; font-weight: 800; color: #fff; margin-bottom: 6px; display: flex; align-items: center; gap: 10px;">
              <span>🦕</span> Nhận Khủng Long Mỗi 24 Giờ
              <span style="font-size: 0.72rem; background: linear-gradient(135deg, #0284c7, #0369a1); color: #fff; padding: 3px 10px; border-radius: 999px; font-weight: 800; text-transform: uppercase;">Chu Kỳ 24H</span>
            </h1>
            <p style="color: #94a3b8; font-size: 0.9rem; margin: 0; line-height: 1.55;">
              Mỗi tài khoản Steam sau mỗi 24 giờ được chọn 1 loài khủng long bất kỳ với kích thước <b style="color: #38bdf8;">89% Prime</b> và <b style="color: #38bdf8;">4 Đột Biến Gen</b> tùy chọn. Khủng long sẽ được chuyển thẳng vào <b style="color: #fbbf24;">Gara Dino</b> để bạn rút vào game bất kỳ lúc nào!
            </p>
          </div>
        </div>

        ${statusBannerHtml}
      </div>

      <!-- Main Selection Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; margin-bottom: 24px;">
        
        <!-- Cột Trái: Chọn Loài Khủng Long (27 Loài) -->
        <div class="card" style="display: flex; flex-direction: column;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 10px;">
            <div style="font-weight: 800; color: #fff; font-size: 1.05rem; display: flex; align-items: center; gap: 8px;">
              <span style="color: #38bdf8;">1.</span> Chọn Loài Khủng Long (${speciesList.length} Loài)
            </div>
          </div>

          <!-- Bộ lọc & Ô Tìm kiếm -->
          <div style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
            <button type="button" class="map-filter-btn ${this.filterCategory === 'all' ? 'active' : ''}" onclick="DailyDino.setCategory('all')" style="padding: 6px 12px; font-size: 0.8rem;">
              Tất Cả (${speciesList.length})
            </button>
            <button type="button" class="map-filter-btn ${this.filterCategory === 'carnivore' ? 'active' : ''}" onclick="DailyDino.setCategory('carnivore')" style="padding: 6px 12px; font-size: 0.8rem; border-color: rgba(239, 68, 68, 0.3); color: #f87171;">
              🥩 Ăn Thịt
            </button>
            <button type="button" class="map-filter-btn ${this.filterCategory === 'herbivore' ? 'active' : ''}" onclick="DailyDino.setCategory('herbivore')" style="padding: 6px 12px; font-size: 0.8rem; border-color: rgba(16, 185, 129, 0.3); color: #34d399;">
              🌿 Ăn Cỏ
            </button>
          </div>

          <div style="margin-bottom: 14px;">
            <input type="text" 
                   placeholder="🔍 Tìm tên khủng long (T-Rex, Cera, Stego, Deino...)" 
                   value="${this.searchQuery}" 
                   oninput="DailyDino.setSearch(this.value)"
                   style="width: 100%; background: #0b1120; border: 1px solid rgba(255,255,255,0.12); padding: 8px 14px; border-radius: 8px; color: #fff; font-size: 0.85rem; outline: none;">
          </div>

          <!-- Danh sách thẻ khủng long cuộn mượt -->
          <div style="flex: 1; max-height: 480px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 4px;">
            ${speciesCardsHtml.length > 0 ? speciesCardsHtml : '<div style="text-align: center; color: var(--text-muted); padding: 40px 10px;">Không tìm thấy khủng long phù hợp.</div>'}
          </div>
        </div>

        <!-- Cột Phải: Giới Tính & Chọn 4 Đột Biến Gen -->
        <div style="display: flex; flex-direction: column; gap: 20px;">
          
          <!-- Thẻ Giới Tính & Chỉ Số Cố Định -->
          <div class="card">
            <div style="font-weight: 800; color: #fff; font-size: 1.05rem; margin-bottom: 14px; display: flex; align-items: center; gap: 8px;">
              <span style="color: #38bdf8;">2.</span> Giới Tính & Chỉ Số Khủng Long
            </div>

            <!-- Giới tính -->
            <div style="margin-bottom: 16px;">
              <label style="font-size: 0.84rem; font-weight: 700; color: #cbd5e1; margin-bottom: 8px; display: block;">
                Giới tính khủng long:
              </label>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <button type="button" 
                        onclick="DailyDino.setGender('Male')"
                        style="cursor: pointer; padding: 10px 14px; border-radius: 10px; border: 1.5px solid ${this.selectedGender === 'Male' ? '#38bdf8' : 'rgba(255,255,255,0.1)'}; background: ${this.selectedGender === 'Male' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.03)'}; color: #fff; font-weight: 700; font-size: 0.9rem; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s;">
                  <span>♂️</span> Con Đực (Male)
                </button>
                <button type="button" 
                        onclick="DailyDino.setGender('Female')"
                        style="cursor: pointer; padding: 10px 14px; border-radius: 10px; border: 1.5px solid ${this.selectedGender === 'Female' ? '#f43f5e' : 'rgba(255,255,255,0.1)'}; background: ${this.selectedGender === 'Female' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(255,255,255,0.03)'}; color: #fff; font-weight: 700; font-size: 0.9rem; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s;">
                  <span>♀️</span> Con Cái (Female)
                </button>
              </div>
            </div>

            <!-- Chỉ số Prime cố định -->
            <div style="background: rgba(56, 189, 248, 0.08); border: 1px dashed rgba(56, 189, 248, 0.35); border-radius: 10px; padding: 12px 16px; display: flex; flex-direction: column; gap: 6px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 0.84rem; color: #94a3b8;">Kích thước tăng trưởng:</span>
                <span style="font-weight: 900; color: #38bdf8; font-size: 1rem;">89% (Adult Prime)</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 0.84rem; color: #94a3b8;">Trạng thái chủng tộc:</span>
                <span style="font-weight: 800; color: #fbbf24; font-size: 0.88rem;">👑 Prime Elder</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 0.84rem; color: #94a3b8;">Nơi nhận khủng long:</span>
                <span style="font-weight: 700; color: #34d399; font-size: 0.85rem;">🦖 Gara Dino Của Bạn</span>
              </div>
            </div>
          </div>

          <!-- Thẻ Chọn 4 Đột Biến Gen -->
          <div class="card">
            <div style="font-weight: 800; color: #fff; font-size: 1.05rem; margin-bottom: 6px; display: flex; align-items: center; gap: 8px;">
              <span style="color: #38bdf8;">3.</span> Chọn 4 Đột Biến Gen Tùy Chọn
            </div>
            <p style="color: #94a3b8; font-size: 0.82rem; margin-bottom: 14px;">
              Chọn 4 kỹ năng đột biến gen phù hợp với lối chơi chiến đấu hoặc sinh tồn của bạn:
            </p>

            <div style="display: flex; flex-direction: column; gap: 10px;">
              ${mutationSlotsHtml}
            </div>
          </div>

        </div>

      </div>

      <!-- Action Footer Card -->
      <div class="card" style="text-align: center; padding: 24px; border: 1px solid rgba(56, 189, 248, 0.3); background: linear-gradient(180deg, rgba(15, 23, 42, 0.8) 0%, rgba(10, 8, 16, 0.95) 100%);">
        <div style="max-width: 640px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; gap: 14px;">
          <div style="font-size: 0.95rem; color: #cbd5e1;">
            Khủng long đã chọn: <b style="color: #fff; font-size: 1.1rem;">${this.selectedSpecies}</b> &bull; 
            Giới tính: <b style="color: #fff;">${this.selectedGender === 'Male' ? 'Đực (Male)' : 'Cái (Female)'}</b> &bull; 
            Size: <b style="color: #38bdf8;">89% Prime</b>
          </div>

          <button type="button" 
                  id="btn-claim-daily-dino"
                  onclick="DailyDino.claimDino()"
                  ${!canClaim || this.isClaiming ? 'disabled' : ''}
                  style="cursor: ${!canClaim || this.isClaiming ? 'not-allowed' : 'pointer'}; opacity: ${!canClaim || this.isClaiming ? '0.6' : '1'}; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #fff; font-size: 1.1rem; font-weight: 800; padding: 14px 36px; border-radius: 12px; border: 1px solid #38bdf8; box-shadow: ${canClaim ? '0 0 25px rgba(56, 189, 248, 0.4)' : 'none'}; display: inline-flex; align-items: center; gap: 10px; transition: all 0.25s;">
            <span>${this.isClaiming ? '⏳' : '⚡'}</span>
            <span>${this.isClaiming ? 'ĐANG XỬ LÝ NHẬN DINO...' : 'XÁC NHẬN NHẬN DINO (89% PRIME)'}</span>
          </button>

          <div style="font-size: 0.8rem; color: #64748b;">
            Sau khi nhận thành công, khủng long sẽ có sẵn trong mục <a href="#garage" style="color: #38bdf8; text-decoration: underline;">Gara Dino</a> để bạn rút vào game khi vào server.
          </div>
        </div>
      </div>
    `;

    // Khởi động đồng hồ đếm ngược nếu đang trong thời gian hồi 24h
    if (!canClaim && remainingSec > 0) {
      this.startCountdown(remainingSec);
    }
  },

  startCountdown(seconds) {
    let rem = seconds;
    const el = document.getElementById('daily-dino-countdown');

    const updateTimer = () => {
      if (rem <= 0) {
        if (this.timerInterval) clearInterval(this.timerInterval);
        if (el) el.innerHTML = '✅ ĐÃ MỞ LƯỢT MỚI!';
        setTimeout(() => this.render(), 1500);
        return;
      }

      const h = Math.floor(rem / 3600);
      const m = Math.floor((rem % 3600) / 60);
      const s = rem % 60;
      const str = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      if (el) el.innerHTML = str;
      rem--;
    };

    updateTimer();
    this.timerInterval = setInterval(updateTimer, 1000);
  },

  selectSpecies(species) {
    this.selectedSpecies = species;
    this.displayView();
  },

  setGender(gender) {
    this.selectedGender = gender;
    this.displayView();
  },

  setCategory(cat) {
    this.filterCategory = cat;
    this.displayView();
  },

  setSearch(q) {
    this.searchQuery = q;
    this.displayView();
  },

  setMutation(slotIdx, mutationId) {
    this.selectedMutations[slotIdx] = mutationId;
  },

  async claimDino() {
    const user = JSON.parse(localStorage.getItem('steam_user') || 'null');
    if (!user || !user.steamId) {
      if (typeof App !== 'undefined' && App.showToast) {
        App.showToast("⚠️ Vui lòng đăng nhập Steam trước khi nhận khủng long!");
      } else {
        alert("Vui lòng đăng nhập Steam trước khi nhận khủng long!");
      }
      return;
    }

    if (this.isClaiming) return;
    this.isClaiming = true;
    this.displayView();

    try {
      const res = await fetch('/api/player/daily-dino/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          steam_id: user.steamId,
          species: this.selectedSpecies,
          gender: this.selectedGender,
          mutations: this.selectedMutations
        })
      });

      const data = await res.json();
      if (data && data.ok) {
        if (typeof App !== 'undefined' && App.showToast) {
          App.showToast(`🎉 ${data.message || 'Đã nhận thành công Dino Prime 89% vào Gara!'}`);
        }

        // Hiển thị modal chúc mừng và nút chuyển tới Gara
        this.showSuccessModal(this.selectedSpecies, this.selectedGender);
        await this.render();
      } else {
        const err = (data && data.error) ? data.error : 'Không thể nhận khủng long. Vui lòng thử lại sau!';
        if (typeof App !== 'undefined' && App.showToast) {
          App.showToast(`❌ ${err}`);
        } else {
          alert(err);
        }
        this.isClaiming = false;
        this.displayView();
      }
    } catch (e) {
      console.error("Lỗi khi nhận dino:", e);
      if (typeof App !== 'undefined' && App.showToast) {
        App.showToast("❌ Lỗi kết nối máy chủ khi nhận khủng long.");
      }
      this.isClaiming = false;
      this.displayView();
    }
  },

  showSuccessModal(species, gender) {
    const modalId = 'daily-dino-success-modal';
    let modal = document.getElementById(modalId);
    if (!modal) {
      modal = document.createElement('div');
      modal.id = modalId;
      modal.className = 'modal-overlay active';
      document.body.appendChild(modal);
    }

    const imgUrl = typeof Garage !== 'undefined' && Garage.getDinoImageUrl 
      ? Garage.getDinoImageUrl(species) 
      : `https://islepilot.eu/cdn/dino-art/icon-sm/${species}.webp`;

    modal.innerHTML = `
      <div class="modal-box" style="max-width: 460px; text-align: center; border: 1.5px solid #38bdf8; background: #0b1120; box-shadow: 0 0 35px rgba(56, 189, 248, 0.4);">
        <div style="font-size: 2.8rem; margin-bottom: 8px;">🎉</div>
        <h2 style="color: #fff; font-size: 1.4rem; font-weight: 800; margin-bottom: 8px;">Nhận Dino Thành Công!</h2>
        <div style="margin: 16px 0; background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 12px; padding: 14px; display: flex; align-items: center; gap: 14px; justify-content: center;">
          <img src="${imgUrl}" alt="${species}" style="width: 56px; height: 56px; object-fit: contain; border-radius: 10px; background: rgba(0,0,0,0.5); padding: 4px;">
          <div style="text-align: left;">
            <div style="font-weight: 800; color: #fff; font-size: 1.1rem;">${species}</div>
            <div style="font-size: 0.85rem; color: #38bdf8; font-weight: 700;">👑 89% Prime &bull; ${gender === 'Male' ? 'Con Đực' : 'Con Cái'}</div>
            <div style="font-size: 0.76rem; color: #94a3b8;">Đã lưu 4 đột biến gen</div>
          </div>
        </div>
        <p style="color: #cbd5e1; font-size: 0.9rem; line-height: 1.5; margin-bottom: 20px;">
          Khủng long đã được chuyển thành công vào <b>Gara Dino</b> của bạn. Hãy vào game và bấm <b>⚡ Rút Dino</b> để trải nghiệm ngay!
        </p>
        <div style="display: flex; gap: 10px; justify-content: center;">
          <button type="button" class="btn-primary" onclick="DailyDino.closeModal('${modalId}'); window.location.hash='#garage';" style="background: linear-gradient(135deg, #0284c7, #0369a1); border-color: #38bdf8; padding: 10px 20px; font-weight: 700;">
            🦖 Đến Gara Dino Ngay
          </button>
          <button type="button" class="btn-secondary" onclick="DailyDino.closeModal('${modalId}')" style="padding: 10px 16px;">
            Đóng
          </button>
        </div>
      </div>
    `;
    modal.classList.add('active');
  },

  closeModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) m.classList.remove('active');
  },

  getFallbackSpecies() {
    return [
      { species: 'Tyrannosaurus', name: 'Tyrannosaurus Rex (Bạo Chúa Săn Mồi)', category: 'carnivore' },
      { species: 'Triceratops', name: 'Triceratops (Tam Giác Long Khổng Lồ)', category: 'herbivore' },
      { species: 'Ceratosaurus', name: 'Ceratosaurus (Khủng Long Sừng Mũi)', category: 'carnivore' },
      { species: 'Carnotaurus', name: 'Carnotaurus (Tên Lửa Tốc Độ)', category: 'carnivore' },
      { species: 'Deinosuchus', name: 'Deinosuchus (Thủy Quái Cá Sấu)', category: 'carnivore' },
      { species: 'Diabloceratops', name: 'Diabloceratops (Sừng Quỷ Chiến Binh)', category: 'herbivore' },
      { species: 'Dilophosaurus', name: 'Dilophosaurus (Ảo Ảnh Đêm)', category: 'carnivore' },
      { species: 'Omniraptor', name: 'Omniraptor (Thợ Săn Bầy Đàn)', category: 'carnivore' },
      { species: 'Stegosaurus', name: 'Stegosaurus (Khủng Long Gai Đuôi)', category: 'herbivore' },
      { species: 'Tenontosaurus', name: 'Tenontosaurus (Khủng Long Đuôi Roi)', category: 'herbivore' },
      { species: 'Pachycephalosaurus', name: 'Pachycephalosaurus (Thiết Đầu Công)', category: 'herbivore' },
      { species: 'Pteranodon', name: 'Pteranodon (Chúa Tể Bầu Trời)', category: 'carnivore' },
      { species: 'Gallimimus', name: 'Gallimimus (Vận Động Viên Điền Kinh)', category: 'herbivore' },
      { species: 'Herrerasaurus', name: 'Herrerasaurus (Sát Thủ Bụi Rậm)', category: 'carnivore' },
      { species: 'Troodon', name: 'Troodon (Kẻ Ám Ảnh Độc Dược)', category: 'carnivore' },
      { species: 'Hypsilophodon', name: 'Hypsilophodon (Linh Khuyển Đào Tẩu)', category: 'herbivore' },
      { species: 'Beipiaosaurus', name: 'Beipiaosaurus (Vịt Lội Nước)', category: 'herbivore' },
      { species: 'Dryosaurus', name: 'Dryosaurus (Nhanh Nhẹn Nhút Nhát)', category: 'herbivore' },
      { species: 'Maiasaura', name: 'Maiasaura (Người Mẹ Nhân Từ)', category: 'herbivore' }
    ];
  },

  getFallbackMutations() {
    return [
      { id: 'Multichambered Lungs', name: 'Multichambered Lungs (Phổi Đa Ngăn - Tăng Thể Lực)' },
      { id: 'Hypermetabolic Inanition', name: 'Hypermetabolic Inanition (Tiêu Hóa Nhanh - Kháng Đói)' },
      { id: 'Congenital Hypoalgesia', name: 'Congenital Hypoalgesia (Giảm Đau Bẩm Sinh - Kháng Choáng)' },
      { id: 'Photosynthetic Tissue', name: 'Photosynthetic Tissue (Mô Quang Hợp - Hồi Máu Dưới Nắng)' },
      { id: 'Hemomania', name: 'Hemomania (Cuồng Huyết - Tăng Sát Thương Khi Máu Thấp)' },
      { id: 'Osteoderms', name: 'Osteoderms (Vảy Cốt Hóa - Tăng Giáp)' },
      { id: 'Adrenaline Glands', name: 'Adrenaline Glands (Tuyến Thượng Thận - Bứt Tốc)' }
    ];
  }
};

window.DailyDino = DailyDino;
