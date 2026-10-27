// Module Các Tính Năng Server IslePilot (3MGAMING)

// Tích hợp 100% theo IslePilot API: Shop Skin, Garage Skin, Chỉnh sửa Skin, Mời bạn bè, Dịch chuyển, Nhiệm vụ, Mua Dino, Thả xác



// HELPER: Tính toán Texture màu sắc IslePilot UV Maps cho 3D Model

function computeIslePilotTextureDirect(tex, palette) {

  if (!tex || !tex.diffuse || !tex.pattern || !tex.tintMask) return null;



  const hexToRgb = (hex) => {

    const t = (hex || '#5A6B48').replace('#', '');

    const val = parseInt(t.length === 3 ? t.split('').map(c => c + c).join('') : t, 16) || 0;

    return { r: (val >> 16) & 255, g: (val >> 8) & 255, b: val & 255 };

  };

  const lerp = (a, b, t) => Math.round(a * (1 - t) + b * t);

  const clamp01 = (v) => Math.max(0, Math.min(1, v));



  const canvas = document.createElement('canvas');

  const maxDim = Math.max(tex.diffuse.naturalWidth || 1024, tex.diffuse.naturalHeight || 1024);

  const scale = maxDim > 1024 ? 1024 / maxDim : 1;

  canvas.width = Math.max(1, Math.round((tex.diffuse.naturalWidth || 1024) * scale));

  canvas.height = Math.max(1, Math.round((tex.diffuse.naturalHeight || 1024) * scale));



  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) return null;

  ctx.drawImage(tex.diffuse, 0, 0, canvas.width, canvas.height);

  const outData = ctx.getImageData(0, 0, canvas.width, canvas.height);



  const patCanvas = document.createElement('canvas');

  patCanvas.width = canvas.width;

  patCanvas.height = canvas.height;

  const patCtx = patCanvas.getContext('2d', { willReadFrequently: true });



  const maskCanvas = document.createElement('canvas');

  maskCanvas.width = canvas.width;

  maskCanvas.height = canvas.height;

  const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });



  if (!patCtx || !maskCtx) return null;

  patCtx.drawImage(tex.pattern, 0, 0, canvas.width, canvas.height);

  maskCtx.drawImage(tex.tintMask, 0, 0, canvas.width, canvas.height);



  const patData = patCtx.getImageData(0, 0, canvas.width, canvas.height);

  const maskData = maskCtx.getImageData(0, 0, canvas.width, canvas.height);



  const bodyRgb = hexToRgb(palette.body || '#E84393');

  const markingsRgb = hexToRgb(palette.markings || '#8E44AD');

  const flankRgb = hexToRgb(palette.flank || '#FD79A8');

  const underbellyRgb = hexToRgb(palette.underbelly || '#FFB6C1');

  const detailRgb = hexToRgb(palette.detail || '#2C3E50');

  const displayRgb = hexToRgb(palette.display || '#FF1493');

  const isDisplayBlack = displayRgb.r === 0 && displayRgb.g === 0 && displayRgb.b === 0;



  for (let i = 0; i < outData.data.length; i += 4) {

    const t = maskData.data[i] / 255;

    const r = maskData.data[i + 1] / 255;

    const n = maskData.data[i + 2] / 255;

    const patVal = (patData.data[i] + patData.data[i + 1] + patData.data[i + 2]) / 765;



    const baseR = outData.data[i];

    const baseG = outData.data[i + 1];

    const baseB = outData.data[i + 2];



    const u = (1 - t) * r * n;

    const m = t * (1 - r) * n * patVal;

    const j = (1 - t) * (1 - r) * n;

    const w = (1 - t) * r * (1 - n);

    const N = t * r * (1 - n) * patVal;

    const C = t * (1 - r) * (1 - n) * Math.max(0.35, patVal);

    const S = u + m + j + w + N + C;

    const L = S > 0 ? S : 1;



    const M = (bodyRgb.r * u + markingsRgb.r * m + flankRgb.r * j + underbellyRgb.r * w + detailRgb.r * N + displayRgb.r * C) / L;

    const E = (bodyRgb.g * u + markingsRgb.g * m + flankRgb.g * j + underbellyRgb.g * w + detailRgb.g * N + displayRgb.g * C) / L;

    const F = (bodyRgb.b * u + markingsRgb.b * m + flankRgb.b * j + underbellyRgb.b * w + detailRgb.b * N + displayRgb.b * C) / L;



    const z = 0.28 + (0.299 * baseR + 0.587 * baseG + 0.114 * baseB) / 255 * 0.9;

    const I = 255 * clamp01(M / 255 * z);

    const T = 255 * clamp01(E / 255 * z);

    const A = 255 * clamp01(F / 255 * z);

    const _ = clamp01(1.35 * S);



    const D = clamp01(_ + 0.45 * (1 - Math.max(M, E, F) / 255));

    let P = lerp(baseR, I, D);

    let B = lerp(baseG, T, D);

    let U = lerp(baseB, A, D);



    if (isDisplayBlack && C > 0.01) {

      const e = clamp01(2.6 * C + 0.22 * patVal);

      P = lerp(P, 0, e);

      B = lerp(B, 0, e);

      U = lerp(U, 0, e);

      if (C > 0.32) { P = 0; B = 0; U = 0; }

    }



    outData.data[i] = P;

    outData.data[i + 1] = B;

    outData.data[i + 2] = U;

  }



  ctx.putImageData(outData, 0, 0);

  return canvas;

}



// HELPER: Vẽ 2D Dinosaur Tinted Canvas tức thì làm nền/fallback

function drawDino2DPreview(canvas, palette, species) {

  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  if (!ctx) return;

  const imgUrl = (window.Garage && Garage.getDinoImageUrl) ? Garage.getDinoImageUrl(species) : '/cdn/dino-art/render/Tyrannosaurus.webp';

  const img = new Image();

  img.crossOrigin = 'anonymous';

  img.onload = () => {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const buffer = document.createElement('canvas');

    buffer.width = canvas.width;

    buffer.height = canvas.height;

    const bCtx = buffer.getContext('2d');

    if (!bCtx) return;



    bCtx.drawImage(img, 0, 0, canvas.width, canvas.height);



    const pal = palette || {};

    const bodyColor = pal.body || '#E84393';

    const flankColor = pal.flank || '#FD79A8';

    const underbellyColor = pal.underbelly || '#FFB6C1';

    const markingsColor = pal.markings || '#8E44AD';

    const displayColor = pal.display || '#FF1493';

    const eyeColor = pal.eyes || '#00F076';



    bCtx.globalCompositeOperation = 'source-atop';

    const grad = bCtx.createLinearGradient(0, canvas.height * 0.15, 0, canvas.height * 0.95);

    grad.addColorStop(0, bodyColor);

    grad.addColorStop(0.35, bodyColor);

    grad.addColorStop(0.65, flankColor);

    grad.addColorStop(1, underbellyColor);



    bCtx.fillStyle = grad;

    bCtx.globalAlpha = 0.65;

    bCtx.fillRect(0, 0, canvas.width, canvas.height);



    bCtx.globalAlpha = 0.75;

    bCtx.fillStyle = markingsColor;

    for (let s = 60; s < canvas.width - 60; s += 22) {

      bCtx.beginPath();

      bCtx.ellipse(s, canvas.height * 0.40 + Math.sin(s * 0.05) * 12, 6, 28 + (s % 18), -0.22, 0, Math.PI * 2);

      bCtx.fill();

    }



    bCtx.globalAlpha = 0.85;

    bCtx.fillStyle = displayColor;

    bCtx.beginPath();

    bCtx.arc(canvas.width * 0.28, canvas.height * 0.32, 26, 0, Math.PI * 2);

    bCtx.fill();



    bCtx.globalAlpha = 1.0;

    bCtx.fillStyle = eyeColor;

    bCtx.shadowColor = eyeColor;

    bCtx.shadowBlur = 10;

    bCtx.beginPath();

    bCtx.arc(canvas.width * 0.25, canvas.height * 0.30, 4.5, 0, Math.PI * 2);

    bCtx.fill();

    bCtx.shadowBlur = 0;



    bCtx.globalCompositeOperation = 'multiply';

    bCtx.globalAlpha = 0.60;

    bCtx.drawImage(img, 0, 0, canvas.width, canvas.height);



    ctx.drawImage(buffer, 0, 0);

  };

  img.src = imgUrl;

}



// 1. SHOP SKIN (ISLEPILOT REAL API - 3D PREVIEW CHUẨN MÀU THEO API)

const SkinShop = {

  skins: [],

  ownedSkins: [],

  activeFilter: 'all',



  getSkinImageUrl(item) {

    if (!item) return '/assets/images/tyrannosaurus_hong_nam_tinh.png';

    if (item.imageUrl) return item.imageUrl;

    if (item.image) return item.image;

    const name = (item.name || '').toLowerCase();

    if (name.includes('hồng') || name.includes('hong') || name.includes('pink') || name.includes('nam tính')) {

      return '/assets/images/tyrannosaurus_hong_nam_tinh.png';

    }

    const sp = item.species || 'Tyrannosaurus';

    if (sp.toLowerCase().includes('tyranno')) {

      return '/assets/images/tyrannosaurus_hong_nam_tinh.png';

    }

    return (window.Garage && Garage.getDinoImageUrl) ? Garage.getDinoImageUrl(sp) : '/assets/images/Tyrannosaurus.webp';

  },



  async render() {

    const container = document.getElementById('skinshop-container');

    if (!container) return;



    container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">Đang tải dữ liệu Skin 3D từ máy chủ IslePilot...</div>';



    const user = JSON.parse(localStorage.getItem('steam_user') || 'null');

    const steamId = user ? user.steamId : '76561199259679997';



    try {

      const [resShop, resOwned] = await Promise.all([

        fetch('/api/server/shop/skins'),

        fetch(`/api/server/skins?steam_id=${steamId}`)

      ]);

      const dataShop = await resShop.json();

      const dataOwned = await resOwned.json();

      this.skins = dataShop.skins || [];

      this.ownedSkins = dataOwned.skins || [];

    } catch (e) {

      console.warn("Lỗi tải Shop Skin:", e);

      this.skins = [];

    }



    this.updateFilterButtons();

    this.displaySkins();

  },



  updateFilterButtons() {

    const filterBox = document.getElementById('skinshop-filters');

    if (!filterBox) return;



    const speciesList = Array.from(new Set(this.skins.map(s => s.species).filter(Boolean)));

    if (speciesList.length <= 1) {

      filterBox.style.display = 'none';

      return;

    }



    filterBox.style.display = 'flex';

    filterBox.innerHTML = `

      <button type="button" class="map-filter-btn ${this.activeFilter === 'all' ? 'active' : ''}" onclick="SkinShop.filter('all', this)">Tất cả (${this.skins.length})</button>

      ${speciesList.map(sp => `

        <button type="button" class="map-filter-btn ${this.activeFilter.toLowerCase() === sp.toLowerCase() ? 'active' : ''}" onclick="SkinShop.filter('${sp}', this)">${sp}</button>

      `).join('')}

    `;

  },



  displaySkins() {

    const container = document.getElementById('skinshop-container');

    if (!container) return;



    let list = this.skins;

    if (this.activeFilter !== 'all') {

      list = list.filter(s => (s.species || '').toLowerCase().includes(this.activeFilter.toLowerCase()));

    }



    if (list.length === 0) {

      container.innerHTML = '<div class="card" style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">Hiện tại chưa có Skin nào được mở bán trên server.</div>';

      return;

    }



    container.innerHTML = list.map(item => {

      const isFree = !item.price || item.price === 0;

      const priceText = isFree ? 'Miễn Phí (0 Xu)' : `${item.price.toLocaleString()} Xu`;

      

      const isOwned = this.ownedSkins.some(owned => 

        (owned.id === item.id) || 

        (owned.name && item.name && owned.name.toLowerCase() === item.name.toLowerCase())

      );



      const pal = item.palette || {

        underbelly: '#FFB6C1',

        body: '#E84393',

        flank: '#FD79A8',

        markings: '#8E44AD',

        display: '#FF1493',

        eyes: '#00F076'

      };



      const skinCode = item.skinCode || item.code || 'Tyrannosaurus000FFB6C1FFE84393FFFD79A8FF8E44ADFFFF1493FF00F076FF';

      const itemImgUrl = this.getSkinImageUrl(item);



      return `

        <div class="dino-card" style="border: 1px solid rgba(232, 67, 147, 0.45); background: rgba(14, 18, 25, 0.95); box-shadow: 0 10px 30px rgba(232, 67, 147, 0.15); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column;">

          

          <!-- 3D Dinosaur Render Banner (Hiển thị 100% sắc nét tức thì) -->

          <div class="dino-card-banner" style="position: relative; height: 240px; background: radial-gradient(circle at 50% 55%, rgba(232, 67, 147, 0.28) 0%, rgba(9, 13, 20, 0.98) 75%); overflow: hidden; display: flex; align-items: center; justify-content: center; cursor: pointer;" onclick="SkinShop.openInStudio('${item.id}')" title="Bấm để xem & xoay 3D trong Studio">

            

            <img src="${itemImgUrl}" alt="${item.name}" class="dino-img-render" style="max-height: 210px; width: 100%; object-fit: contain; filter: drop-shadow(0 8px 24px rgba(232, 67, 147, 0.4)); transition: transform 0.3s ease;" onmouseover="this.style.transform='scale(1.04)'" onmouseout="this.style.transform='scale(1)'">

            

            <span class="growth-badge" style="background: rgba(232, 67, 147, 0.32); border-color: #e84393; color: #ffb6c1; position: absolute; top: 12px; right: 12px; backdrop-filter: blur(4px);">

              ✨ Khủng Long 3D: ${item.name}

            </span>





          </div>



          <div class="dino-card-body" style="flex: 1; display: flex; flex-direction: column; padding: 16px;">

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">

              <h3 style="font-size: 1.22rem; color: #fff; font-weight: 800; margin: 0;">${item.name}</h3>

              <span class="diet-badge diet-carnivore" style="font-size: 0.75rem;">${item.species}</span>

            </div>







            <!-- Bảng Màu 3D 6 Phân Vùng -->

            <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(232, 67, 147, 0.22); border-radius: 8px; padding: 8px 10px; margin-bottom: 12px;">

              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">

                <span style="font-size: 0.73rem; color: #fda4af; font-weight: 700;">🎨 Bảng màu phối 3D:</span>

                <span style="font-size: 0.68rem; color: var(--text-muted);">6 Phân vùng</span>

              </div>

              <div style="display: flex; gap: 6px; flex-wrap: wrap;">

                <div style="display: flex; align-items: center; gap: 4px; background: rgba(0,0,0,0.4); padding: 2px 7px; border-radius: 4px; font-size: 0.72rem; border: 1px solid rgba(255,255,255,0.08);" title="Thân chính: ${pal.body}">

                  <span style="width: 10px; height: 10px; border-radius: 50%; background: ${pal.body}; display: inline-block; border: 1px solid #fff;"></span>

                  <span style="color: #e2e8f0;">Thân</span>

                </div>

                <div style="display: flex; align-items: center; gap: 4px; background: rgba(0,0,0,0.4); padding: 2px 7px; border-radius: 4px; font-size: 0.72rem; border: 1px solid rgba(255,255,255,0.08);" title="Bụng dưới: ${pal.underbelly}">

                  <span style="width: 10px; height: 10px; border-radius: 50%; background: ${pal.underbelly}; display: inline-block; border: 1px solid #fff;"></span>

                  <span style="color: #e2e8f0;">Bụng</span>

                </div>

                <div style="display: flex; align-items: center; gap: 4px; background: rgba(0,0,0,0.4); padding: 2px 7px; border-radius: 4px; font-size: 0.72rem; border: 1px solid rgba(255,255,255,0.08);" title="Sườn hông: ${pal.flank}">

                  <span style="width: 10px; height: 10px; border-radius: 50%; background: ${pal.flank}; display: inline-block; border: 1px solid #fff;"></span>

                  <span style="color: #e2e8f0;">Sườn</span>

                </div>

                <div style="display: flex; align-items: center; gap: 4px; background: rgba(0,0,0,0.4); padding: 2px 7px; border-radius: 4px; font-size: 0.72rem; border: 1px solid rgba(255,255,255,0.08);" title="Vằn hoa văn: ${pal.markings}">

                  <span style="width: 10px; height: 10px; border-radius: 50%; background: ${pal.markings}; display: inline-block; border: 1px solid #fff;"></span>

                  <span style="color: #e2e8f0;">Vằn</span>

                </div>

                <div style="display: flex; align-items: center; gap: 4px; background: rgba(0,0,0,0.4); padding: 2px 7px; border-radius: 4px; font-size: 0.72rem; border: 1px solid rgba(255,255,255,0.08);" title="Mào khoe sắc: ${pal.display}">

                  <span style="width: 10px; height: 10px; border-radius: 50%; background: ${pal.display}; display: inline-block; border: 1px solid #fff;"></span>

                  <span style="color: #e2e8f0;">Mào</span>

                </div>

                <div style="display: flex; align-items: center; gap: 4px; background: rgba(0,0,0,0.4); padding: 2px 7px; border-radius: 4px; font-size: 0.72rem; border: 1px solid rgba(255,255,255,0.08);" title="Mắt: ${pal.eyes}">

                  <span style="width: 10px; height: 10px; border-radius: 50%; background: ${pal.eyes}; display: inline-block; border: 1px solid #fff;"></span>

                  <span style="color: #e2e8f0;">Mắt</span>

                </div>

              </div>

            </div>



            <!-- Game Skin Code Evrima -->

            <div style="background: rgba(0, 0, 0, 0.45); border: 1px solid rgba(232, 67, 147, 0.25); border-radius: 6px; padding: 6px 10px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; gap: 8px;">

              <div style="font-size: 0.72rem; font-family: monospace; color: #e2e8f0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">

                ${skinCode}

              </div>

              <button type="button" class="btn-secondary" style="padding: 3px 10px; font-size: 0.72rem; white-space: nowrap; border-color: rgba(232,67,147,0.4); color: #fda4af;" onclick="SkinShop.copyCode('${skinCode}')">

                📋 Copy Code

              </button>

            </div>



            <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 14px; line-height: 1.6;">

              Loài áp dụng: <b style="color: #fff;">${item.allSpecies ? 'Tất cả các loài' : item.species}</b><br>

              Thời hạn sở hữu: <b style="color: #fbbf24;">${item.maxUses ? `${item.maxUses} lần` : 'Vĩnh viễn'}</b> | Giá server: <b style="color: ${isFree ? 'var(--accent)' : '#fbbf24'};">${priceText}</b>

            </div>



            <!-- Actions Row -->

            <div style="display: flex; gap: 8px; margin-top: auto; padding-top: 12px; border-top: 1px solid var(--border-color);">

              <button type="button" class="btn-secondary" style="flex: 1; padding: 8px 10px; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; gap: 4px; border-color: rgba(232, 67, 147, 0.5); color: #fda4af;" onclick="SkinShop.openInStudio('${item.id}')">

                🎮 Xem 3D Studio

              </button>

              ${isOwned ? `

                <button class="btn-primary" style="flex: 1; padding: 8px 10px; font-size: 0.8rem; background: rgba(0, 240, 118, 0.15); border: 1px solid var(--accent); color: var(--accent); cursor: pointer;" onclick="App.switchTab('skins')">

                  ✓ Đã Có (Vào Gara)

                </button>

              ` : `

                <button class="btn-primary" style="flex: 1; padding: 8px 10px; font-size: 0.8rem;" onclick="SkinShop.buySkin('${item.id}', '${item.name}', ${item.price || 0})">

                  ${isFree ? '🎁 Nhận Ngay' : '🛒 Mua Skin'}

                </button>

              `}

            </div>



          </div>

        </div>

      `;

    }).join('');

  },



  filter(species, btn) {

    this.activeFilter = species;

    document.querySelectorAll('#skinshop-filters button').forEach(b => b.classList.remove('active'));

    if (btn) btn.classList.add('active');

    this.displaySkins();

  },



  copyCode(code) {

    if (!code) return;

    navigator.clipboard.writeText(code).then(() => {

      App.showToast("📋 Đã sao chép Game Skin Code Evrima!");

    }).catch(() => {

      prompt("Mã Skin:", code);

    });

  },



  openInStudio(skinId) {

    const item = this.skins.find(s => s.id === skinId) || this.skins[0];

    if (window.SkinEditor) {

      SkinEditor._pendingSkin = item;

    }

    App.switchTab('skineditor');

    setTimeout(() => {

      if (window.SkinEditor && SkinEditor.loadSkinObject) {

        SkinEditor.loadSkinObject(item);

      }

    }, 120);

  },



  async buySkin(id, name, price) {

    const user = JSON.parse(localStorage.getItem('steam_user') || 'null');

    if (!user) {

      App.showToast("Thất bại");

      return;

    }



    try {

      const res = await fetch('/api/server/shop/buy-skin', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ skin_id: id, steam_id: user.steamId })

      });

      const data = await res.json();

      if (data.success || data.ok) {

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



// 2. GARAGE SKIN (KHO SKIN ĐÃ SỞ HỮU - THỰC THI TRỰC TIẾP VÀO SERVER)

const GarageSkins = {

  skins: [],



  async render() {

    const container = document.getElementById('skins-container');

    if (!container) return;



    const user = JSON.parse(localStorage.getItem('steam_user') || 'null');

    const steamId = user ? user.steamId : '76561199259679997';



    try {

      const res = await fetch(`/api/server/skins?steam_id=${steamId}`);

      const data = await res.json();

      this.skins = data.skins || [];

    } catch (e) {

      this.skins = [];

    }



    if (this.skins.length === 0) {

      container.innerHTML = `

        <div class="card" style="grid-column: 1/-1; text-align: center; padding: 40px;">

          <h3 style="color: #fff; margin-bottom: 8px;">🎒 Kho Skin Của Bạn Đang Trống</h3>

          <p style="color: var(--text-muted); margin-bottom: 20px;">

            Bạn chưa sở hữu skin nào. Hãy ghé thăm Shop Skin để nhận skin miễn phí hoặc mua skin độc quyền!

          </p>

          <button class="btn-primary" onclick="App.switchTab('skinshop')">🛍️ Ghé Thăm Shop Skin Ngay</button>

        </div>

      `;

      return;

    }



    container.innerHTML = this.skins.map(s => {

      const pal = s.palette || {

        underbelly: '#FFB6C1',

        body: '#E84393',

        flank: '#FD79A8',

        markings: '#8E44AD',

        display: '#FF1493',

        eyes: '#00F076'

      };

      const skinImgUrl = SkinShop.getSkinImageUrl(s);



      return `

        <div class="dino-card" style="border: 1px solid rgba(0, 240, 118, 0.45); background: rgba(14, 18, 25, 0.95); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column;">

          <div class="dino-card-banner" style="position: relative; height: 240px; background: radial-gradient(circle at 50% 55%, rgba(0, 240, 118, 0.18) 0%, rgba(9, 13, 20, 0.98) 75%); overflow: hidden; display: flex; align-items: center; justify-content: center; cursor: pointer;" onclick="SkinShop.openInStudio('${s.id}')" title="Bấm để xem & xoay 3D trong Studio">

            

            <img src="${skinImgUrl}" alt="${s.name}" class="dino-img-render" style="max-height: 210px; width: 100%; object-fit: contain; filter: drop-shadow(0 8px 24px rgba(0, 240, 118, 0.35)); transition: transform 0.3s ease;" onmouseover="this.style.transform='scale(1.04)'" onmouseout="this.style.transform='scale(1)'">



            <span class="growth-badge" style="background: rgba(0, 240, 118, 0.2); border-color: var(--accent); color: var(--accent); position: absolute; top: 12px; right: 12px;">

              ✓ Đã Sở Hữu Trong Gara

            </span>



          </div>

          <div class="dino-card-body" style="flex: 1; display: flex; flex-direction: column; padding: 16px;">

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">

              <h3 style="color: #fff; font-size: 1.22rem; font-weight: 800; margin: 0;">${s.name}</h3>

              <span class="diet-badge diet-carnivore" style="font-size: 0.75rem;">${s.species}</span>

            </div>





            <!-- Bảng màu 6 vùng -->

            <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(0, 240, 118, 0.2); border-radius: 8px; padding: 8px 10px; margin-bottom: 12px;">

              <div style="display: flex; gap: 6px; flex-wrap: wrap;">

                <div style="display: flex; align-items: center; gap: 4px; background: rgba(0,0,0,0.4); padding: 2px 7px; border-radius: 4px; font-size: 0.72rem; border: 1px solid rgba(255,255,255,0.08);">

                  <span style="width: 10px; height: 10px; border-radius: 50%; background: ${pal.body}; display: inline-block; border: 1px solid #fff;"></span>

                  <span style="color: #e2e8f0;">Thân</span>

                </div>

                <div style="display: flex; align-items: center; gap: 4px; background: rgba(0,0,0,0.4); padding: 2px 7px; border-radius: 4px; font-size: 0.72rem; border: 1px solid rgba(255,255,255,0.08);">

                  <span style="width: 10px; height: 10px; border-radius: 50%; background: ${pal.underbelly}; display: inline-block; border: 1px solid #fff;"></span>

                  <span style="color: #e2e8f0;">Bụng</span>

                </div>

                <div style="display: flex; align-items: center; gap: 4px; background: rgba(0,0,0,0.4); padding: 2px 7px; border-radius: 4px; font-size: 0.72rem; border: 1px solid rgba(255,255,255,0.08);">

                  <span style="width: 10px; height: 10px; border-radius: 50%; background: ${pal.flank}; display: inline-block; border: 1px solid #fff;"></span>

                  <span style="color: #e2e8f0;">Sườn</span>

                </div>

                <div style="display: flex; align-items: center; gap: 4px; background: rgba(0,0,0,0.4); padding: 2px 7px; border-radius: 4px; font-size: 0.72rem; border: 1px solid rgba(255,255,255,0.08);">

                  <span style="width: 10px; height: 10px; border-radius: 50%; background: ${pal.markings}; display: inline-block; border: 1px solid #fff;"></span>

                  <span style="color: #e2e8f0;">Vằn</span>

                </div>

                <div style="display: flex; align-items: center; gap: 4px; background: rgba(0,0,0,0.4); padding: 2px 7px; border-radius: 4px; font-size: 0.72rem; border: 1px solid rgba(255,255,255,0.08);">

                  <span style="width: 10px; height: 10px; border-radius: 50%; background: ${pal.display}; display: inline-block; border: 1px solid #fff;"></span>

                  <span style="color: #e2e8f0;">Mào</span>

                </div>

                <div style="display: flex; align-items: center; gap: 4px; background: rgba(0,0,0,0.4); padding: 2px 7px; border-radius: 4px; font-size: 0.72rem; border: 1px solid rgba(255,255,255,0.08);">

                  <span style="width: 10px; height: 10px; border-radius: 50%; background: ${pal.eyes}; display: inline-block; border: 1px solid #fff;"></span>

                  <span style="color: #e2e8f0;">Mắt</span>

                </div>

              </div>

            </div>



            <div style="color: var(--text-muted); font-size: 0.82rem; margin-bottom: 14px; line-height: 1.6;">

              Loài áp dụng: <b style="color: #fff;">${s.species}</b><br>

              Trạng thái: <b style="color: var(--accent);">${s.bought ? 'Vĩnh viễn' : 'Khả dụng'}</b> | Lượt dùng: <b style="color: #60a5fa;">${s.usesLeft !== null ? s.usesLeft + ' lần' : 'Không giới hạn'}</b>

            </div>



            <div style="display: flex; gap: 8px; margin-top: auto;">

              <button class="btn-secondary" style="flex: 1; padding: 10px; font-size: 0.82rem;" onclick="SkinShop.openInStudio('${s.id}')">

                🎮 Xem 3D Studio

              </button>

              <button class="btn-primary" style="flex: 1.2; padding: 10px; font-weight: 700; font-size: 0.85rem;" onclick="GarageSkins.applySkin('${s.id}', '${s.name}')">

                ⚡ Áp Dụng Ngay

              </button>

            </div>

          </div>

        </div>

      `;

    }).join('');

  },



  async applySkin(skinId, skinName) {

    const user = JSON.parse(localStorage.getItem('steam_user') || 'null');

    const steamId = user ? user.steamId : '76561199259679997';



    try {

      const res = await fetch('/api/server/skins/apply', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ skin_id: skinId, steam_id: steamId })

      });

      const data = await res.json();

      if (data.success || data.ok) {

        App.showToast("Thành công");

      } else {

        App.showToast("Thất bại");

      }

    } catch (e) {

      App.showToast("Thất bại");

    }

  }

};



// 3. CHỈNH SỬA SKIN (CHUẨN ISLEPILOT /skin THE ISLE EVRIMA)

const SkinEditor = {

  species: 'Tyrannosaurus',

  sex: 'male',

  pattern: 0,

  variation: 0,

  theme: 0,

  renderMode: 'standard',

  growth: 1.0,

  zoom: 1.0,

  yaw: 0.35,

  pitch: -0.08,

  distance: 5.2,

  distMin: 2.8,

  distMax: 8.5,

  distMin: 3.5,

  distMax: 9.5,

  isAutoRotating: false,

  autoRotateTimer: null,

  threeRenderer: null,

  threeScene: null,

  threeCamera: null,

  threeModel: null,

  threeTexture: null,

  _tintRaf: null,

  cachedTextures: {},

  lockedZones: {},

  drafts: [],

  palette: {},



  defaults: {

    Tyrannosaurus: { body: '#4a543b', markings: '#2b3221', flank: '#647050', underbelly: '#c4baa1', display: '#a83c24', eyes: '#e08f24', detail: '#1f1512' },

    Carnotaurus: { body: '#6e473b', markings: '#361e17', flank: '#8a5c4d', underbelly: '#d4c2b2', display: '#c4371d', eyes: '#f0ad2b', detail: '#1f1512' },

    Ceratosaurus: { body: '#524b3a', markings: '#2e271c', flank: '#6b634e', underbelly: '#b5ab94', display: '#ab331f', eyes: '#d97d23', detail: '#1a1610' },

    Allosaurus: { body: '#404c54', markings: '#1e262b', flank: '#5b6b75', underbelly: '#b8c4cb', display: '#c73a24', eyes: '#eba128', detail: '#1a2024' },

    Deinosuchus: { body: '#334033', markings: '#1c241c', flank: '#485748', underbelly: '#9aa89a', display: '#405240', eyes: '#d1aa36', detail: '#141a14' },

    Dilophosaurus: { body: '#3a4740', markings: '#1f2923', flank: '#506157', underbelly: '#a8b8b0', display: '#d64727', eyes: '#f2b32c', detail: '#19211c' },

    Gallimimus: { body: '#695844', markings: '#382e22', flank: '#857057', underbelly: '#d9cdbe', display: '#c95232', eyes: '#de902a', detail: '#241c14' },

    Herrerasaurus: { body: '#57483b', markings: '#2e241c', flank: '#73604f', underbelly: '#c4b5a5', display: '#bd4228', eyes: '#e89e2c', detail: '#1c1510' },

    Hypsilophodon: { body: '#495945', markings: '#263323', flank: '#61755c', underbelly: '#b8c7b4', display: '#c24b2b', eyes: '#e09828', detail: '#192117' },

    Omniraptor: { body: '#4d473d', markings: '#29241e', flank: '#696154', underbelly: '#c2b8ab', display: '#b83b23', eyes: '#e39427', detail: '#1c1813' },

    Pachycephalosaurus: { body: '#5c5445', markings: '#302a20', flank: '#786e5b', underbelly: '#cfc6b6', display: '#ad4028', eyes: '#d98b25', detail: '#1f1a13' },

    Pteranodon: { body: '#4b555e', markings: '#242b30', flank: '#63707d', underbelly: '#bcc8d4', display: '#cf3c23', eyes: '#e89e2e', detail: '#191d21' },

    Stegosaurus: { body: '#47543d', markings: '#26301e', flank: '#5e6e52', underbelly: '#b8c7ad', display: '#a83c27', eyes: '#dba02c', detail: '#1a2114' },

    Tenontosaurus: { body: '#5c4e3f', markings: '#33291f', flank: '#786653', underbelly: '#c7b9a9', display: '#ad4b31', eyes: '#db952e', detail: '#1c150e' },

    Troodon: { body: '#3b434a', markings: '#1e2329', flank: '#515c66', underbelly: '#aab5bf', display: '#c23c21', eyes: '#ebaa2f', detail: '#15191d' },

    Beipiaosaurus: { body: '#423d38', markings: '#24201c', flank: '#5c554e', underbelly: '#b8b0a5', display: '#b84428', eyes: '#e09a2b', detail: '#191613' },

    Diabloceratops: { body: '#574538', markings: '#2e2219', flank: '#735c4b', underbelly: '#c2b09f', display: '#ba3c23', eyes: '#e69d2c', detail: '#1f150e' },

    Triceratops: { body: '#54463b', markings: '#2b231d', flank: '#705e50', underbelly: '#c5b8a5', display: '#c24125', eyes: '#e09a2b', detail: '#1f1814' },

    Spinosaurus: { body: '#3b4e47', markings: '#1a2622', flank: '#4e695f', underbelly: '#a9bdb4', display: '#c43d23', eyes: '#e5a328', detail: '#18211e' },

    Giganotosaurus: { body: '#4a443e', markings: '#26221f', flank: '#635b54', underbelly: '#b5aca1', display: '#b83b23', eyes: '#dba02a', detail: '#1c1815' },

    IndoRex: { body: '#3a3a3c', markings: '#1a1a1c', flank: '#525256', underbelly: '#a3a3a8', display: '#b81e28', eyes: '#dc2626', detail: '#121214' },

    Baryonyx: { body: '#3d484d', markings: '#1e2529', flank: '#526169', underbelly: '#b0bcc2', display: '#ba3c21', eyes: '#dea52d', detail: '#161c1f' },

    Dryosaurus: { body: '#635b49', markings: '#332e24', flank: '#7d745f', underbelly: '#d2cbba', display: '#bd4e30', eyes: '#df9e2c', detail: '#211d17' },

    Maiasaura: { body: '#544c3e', markings: '#2b261e', flank: '#6e6453', underbelly: '#c7bfaa', display: '#b8452c', eyes: '#dba32b', detail: '#1e1a14' },

    Ankylosaurus: { body: '#4f473e', markings: '#27221c', flank: '#695f54', underbelly: '#bcb3a6', display: '#af3d24', eyes: '#d69728', detail: '#1c1712' },

    Puerta: { body: '#4a4f44', markings: '#242921', flank: '#636b5d', underbelly: '#b6bfb0', display: '#a8412a', eyes: '#d99d2b', detail: '#1a1d17' },

    Therizinosaurus: { body: '#47423e', markings: '#23201d', flank: '#605b55', underbelly: '#b5ada5', display: '#bf3d27', eyes: '#e09e2e', detail: '#1a1714' }

  },



  zoneLabels: {

    underbelly: { name: 'Bụng Dưới (Underbelly)', desc: 'Vùng bụng và dưới cổ' },

    body: { name: 'Thân Chính (Body)', desc: 'Màu nền da lưng và toàn thân' },

    flank: { name: 'Màu Sườn (Flank)', desc: 'Chuyển sắc giữa thân và bụng' },

    markings: { name: 'Hoa Văn (Markings)', desc: 'Vệt sọc, đốm hoa văn sống lưng' },

    display: { name: 'Mào Khoe Sắc (Display)', desc: 'Màu sặc sỡ đầu/mào (chỉ con đực)' },

    detail: { name: 'Chi Tiết & Gai (Detail)', desc: 'Gai lưng, sừng, vuốt móng' },

    eyes: { name: 'Màu Mắt (Eyes)', desc: 'Tròng mắt và viền mắt' }

  },



  presetSwatches: [

    '#2b3221', '#4a543b', '#647050', '#8a5c4d', '#c4371d', '#e08f24',

    '#c4baa1', '#334033', '#1e262b', '#5b6b75', '#a8b8b0', '#f43f5e',

    '#00f076', '#38bdf8', '#a855f7', '#fbbf24', '#ffffff', '#18181b',

    '#78350f', '#065f46', '#1e3a8a', '#581c87', '#831843', '#475569'

  ],



  async syncPlayerActiveDino() {

    try {

      const user = JSON.parse(localStorage.getItem('steam_user') || 'null');

      const steamParam = (user && user.steamId) ? `?steam_id=${user.steamId}` : '';

      const res = await fetch(`/api/player/active-dino${steamParam}`);

      if (!res.ok) return;

      const data = await res.json();

      

      const badgeStatus = document.getElementById('skineditor-active-dino-status');

      if (data && data.species) {

        if (badgeStatus) {

          const stateLabel = data.online ? 'Đang chơi' : (data.source === 'garage' ? 'Trong Gara' : 'Khủng long');

          badgeStatus.textContent = `🟢 ${stateLabel}: ${data.species}`;

          badgeStatus.style.display = 'inline-block';

        }



        // Tự động chọn loài khủng long đang chơi nếu người chơi chưa tự chuyển loài thủ công

        if (!this._userInteractedSpecies) {

          const selectSp = document.getElementById('skineditor-select-species');

          if (selectSp) {

            selectSp.value = data.species;

          }

          this.species = data.species;

          if (data.gender) {

            this.setSex(data.gender);

          }

          if (typeof data.growth === 'number') {

            const growthPct = Math.round(data.growth * 100);

            this.setGrowth(growthPct);

            const sliderGrowth = document.getElementById('skineditor-range-growth');

            if (sliderGrowth) sliderGrowth.value = growthPct;

          }

          const def = this.defaults[data.species] || this.defaults.Tyrannosaurus;

          for (const key of Object.keys(def)) {

            if (!this.lockedZones[key]) {

              this.palette[key] = def[key];

            }

          }

          const badgeSp = document.getElementById('skineditor-badge-species');

          if (badgeSp) badgeSp.textContent = data.species;



          this.renderZones();

          this.updatePreview();

          this.loadThreeModel(data.species);

        }

      } else if (badgeStatus) {

        badgeStatus.style.display = 'none';

      }

    } catch (err) {

      console.warn("Lỗi đồng bộ khủng long đang chơi:", err);

    }

  },



  loadSkinObject(item) {

    if (!item) return;

    this.species = item.species || 'Tyrannosaurus';

    this.palette = { ...(item.palette || this.defaults[this.species] || this.defaults.Tyrannosaurus) };

    const badgeSp = document.getElementById('skineditor-badge-species');

    if (badgeSp) badgeSp.textContent = this.species;

    const selectSp = document.getElementById('skineditor-select-species');

    if (selectSp) selectSp.value = this.species;



    this.renderZones();

    this.updatePreview();

    this.loadThreeModel(this.species);

    if (!this.isAutoRotating) {

      this.toggleAutoRotate(true);

    }

    App.showToast(`🌸 Đang hiển thị 3D Skin: "${item.name}" với màu chuẩn API!`);

  },



  init() {

    if (this._pendingSkin) {

      const p = this._pendingSkin;

      this._pendingSkin = null;

      this._userInteractedSpecies = true;

      this.species = p.species || 'Tyrannosaurus';

      this.palette = { ...(p.palette || this.defaults[this.species] || this.defaults.Tyrannosaurus) };

    } else {

      if (!this.palette || Object.keys(this.palette).length === 0) {

        this.palette = { ...(this.defaults[this.species] || this.defaults.Tyrannosaurus) };

      }

      this.syncPlayerActiveDino();

    }



    const user = JSON.parse(localStorage.getItem('steam_user') || 'null');

    const steamInput = document.getElementById('skineditor-target-steamid');

    const playerInput = document.getElementById('skineditor-target-player');

    if (steamInput && user) steamInput.value = user.steamId || '76561199259679997';

    if (playerInput && user) playerInput.value = user.personaName || 'Người chơi';



    this.setupStageControls();

    this.initThreeJs();

    this.loadDrafts();

    this.renderZones();

    this.updatePreview();



    setTimeout(() => {

      this.resizeViewport();

    }, 80);

  },



  resizeViewport() {

    const canvas = document.getElementById('skineditor-3d-canvas');

    if (!canvas || !canvas.parentElement || !this.threeRenderer || !this.threeCamera) return;

    const w = canvas.parentElement.clientWidth || 450;

    const h = canvas.parentElement.clientHeight || 400;

    if (w > 0 && h > 0) {

      this.threeRenderer.setSize(w, h, false);

      this.threeCamera.aspect = w / h;

      this.threeCamera.updateProjectionMatrix();

      this.renderScene();

    }

  },



  initThreeJs() {

    const canvas = document.getElementById('skineditor-3d-canvas');

    if (!canvas || typeof THREE === 'undefined') return;



    const container = canvas.parentElement;

    const width = (container && container.clientWidth) ? container.clientWidth : 450;

    const height = (container && container.clientHeight) ? container.clientHeight : 400;



    if (this.threeRenderer && this.threeCamera) {

      this.resizeViewport();

      return;

    }



    try {

      const scene = new THREE.Scene();

      scene.fog = new THREE.Fog('#1b202d', 7, 16);



      const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);

      camera.position.set(0, 1.15, this.distance);

      camera.lookAt(0, 0.95, 0);



      const renderer = new THREE.WebGLRenderer({

        canvas: canvas,

        alpha: true,

        antialias: true,

        powerPreference: 'high-performance'

      });

      renderer.setSize(width, height, false);

      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      renderer.setClearAlpha(0);



      if ('outputColorSpace' in renderer && THREE.SRGBColorSpace) {

        renderer.outputColorSpace = THREE.SRGBColorSpace;

      } else if ('outputEncoding' in renderer && THREE.sRGBEncoding) {

        renderer.outputEncoding = THREE.sRGBEncoding;

      }



      if (THREE.ACESFilmicToneMapping) {

        renderer.toneMapping = THREE.ACESFilmicToneMapping;

        renderer.toneMappingExposure = 1.35;

      }



      const hemiLight = new THREE.HemisphereLight('#f4f6ff', '#454f68', 2.6);

      const ambLight = new THREE.AmbientLight('#ffffff', 1.75);



      const keyLight = new THREE.DirectionalLight('#fff8df', 3.1);

      keyLight.position.set(4.5, 7.5, 5.5);



      const rimLight = new THREE.DirectionalLight('#b8ffe0', 1.8);

      rimLight.position.set(-4, 3.5, -4);



      const fillLight = new THREE.DirectionalLight('#b2cfff', 1.25);

      fillLight.position.set(-2.5, 4.5, 6.5);



      const spotLight = new THREE.SpotLight('#f8ffdc', 1.6, 0, 0.55, 0.7);

      spotLight.position.set(0, 7.5, 3);



      scene.add(hemiLight, ambLight, keyLight, rimLight, fillLight, spotLight);



      this.threeScene = scene;

      this.threeCamera = camera;

      this.threeRenderer = renderer;



      window.addEventListener('resize', () => this.resizeViewport());



      this.loadThreeModel(this.species);

    } catch (e) {

      console.warn("Lỗi khởi tạo Three.js WebGL:", e);

    }

  },



  renderScene() {

    if (!this.threeRenderer || !this.threeScene || !this.threeCamera) return;

    this.threeCamera.position.set(0, 1.15, this.distance);

    this.threeCamera.lookAt(0, 0.95, 0);

    this.threeRenderer.render(this.threeScene, this.threeCamera);

  },



  async loadThreeModel(species) {

    if (!this.threeScene || typeof THREE.GLTFLoader === 'undefined') return;



    const loader = new THREE.GLTFLoader();

    const meshUrl = `/cdn/dinos/${encodeURIComponent(species)}/mesh.glb`;

    const diffUrl = `/cdn/dinos/${encodeURIComponent(species)}/diffuse.png`;

    const patUrl = `/cdn/dinos/${encodeURIComponent(species)}/pattern_adult.png`;

    const maskUrl = `/cdn/dinos/${encodeURIComponent(species)}/tint_mask.png`;



    const loadImage = (url) => new Promise((resolve) => {

      const img = new Image();

      img.crossOrigin = 'anonymous';

      img.onload = () => resolve(img);

      img.onerror = () => resolve(null);

      img.src = url;

    });



    try {

      const [gltf, diffImg, patImg, maskImg] = await Promise.all([

        new Promise((resolve, reject) => loader.load(meshUrl, resolve, undefined, reject)),

        loadImage(diffUrl),

        loadImage(patUrl),

        loadImage(maskUrl)

      ]);



      if (this.threeModel) {

        this.threeScene.remove(this.threeModel);

        this.threeModel = null;

      }



      this.cachedTextures[species] = {

        diffuse: diffImg,

        pattern: patImg,

        tintMask: maskImg

      };



      const model = gltf.scene;



      model.traverse((child) => {

        if (child instanceof THREE.Mesh) {

          const mats = Array.isArray(child.material) ? child.material : [child.material];

          const newMats = mats.map(origMat => {

            const mat = new THREE.MeshStandardMaterial({

              color: '#ffffff',

              roughness: 0.98,

              metalness: 0,

              transparent: 'transparent' in origMat && !!origMat.transparent,

              opacity: 'opacity' in origMat ? Number(origMat.opacity) : 1,

              side: THREE.FrontSide

            });

            mat.name = `${child.name} ${origMat.name || ''}`.toLowerCase();

            return mat;

          });

          child.material = Array.isArray(child.material) ? newMats : newMats[0];

        }

      });



      const box = new THREE.Box3().setFromObject(model);

      const size = box.getSize(new THREE.Vector3());

      const center = box.getCenter(new THREE.Vector3());

      this._rawModelSize = size;



      // Chuẩn hóa kích thước khủng long lớn, cân đối màn hình (chiếm ~75% chiều cao)

      const baseScale = (this.sex === 'female' ? 2.3 : 2.45) / Math.max(size.y, 1);

      const growthFactor = 0.5 + 0.5 * this.growth;

      const group = new THREE.Group();

      group.scale.setScalar(baseScale * growthFactor);

      group.rotation.x = this.pitch;

      group.rotation.y = this.yaw;



      // Căn giữa ngang và đặt chân đứng vững ngay trên mặt bục xoay pedestal

      model.position.set(-center.x, -box.min.y, -center.z);

      group.add(model);

      this.threeScene.add(group);

      this.threeModel = group;



      this.distance = 5.2;

      this.distMin = 2.8;

      this.distMax = 8.5;



      this.updateThreeTexture();



      const tintCanvas = document.getElementById('skineditor-tint-canvas');

      if (tintCanvas) tintCanvas.style.display = 'none';



      this.renderScene();

    } catch (err) {

      console.warn("Không tải được 3D GLTF, sử dụng 2D render:", err);

      const tintCanvas = document.getElementById('skineditor-tint-canvas');

      if (tintCanvas) tintCanvas.style.display = 'block';

    }

  },



  computeIslePilotTexture() {

    const tex = this.cachedTextures[this.species];

    if (!tex || !tex.diffuse || !tex.pattern || !tex.tintMask) return null;



    const hexToRgb = (hex) => {

      const t = (hex || '#5A6B48').replace('#', '');

      const val = parseInt(t.length === 3 ? t.split('').map(c => c + c).join('') : t, 16) || 0;

      return { r: (val >> 16) & 255, g: (val >> 8) & 255, b: val & 255 };

    };

    const lerp = (a, b, t) => Math.round(a * (1 - t) + b * t);

    const clamp01 = (v) => Math.max(0, Math.min(1, v));



    const canvas = document.createElement('canvas');

    const maxDim = Math.max(tex.diffuse.naturalWidth || 1024, tex.diffuse.naturalHeight || 1024);

    const scale = maxDim > 1024 ? 1024 / maxDim : 1;

    canvas.width = Math.max(1, Math.round((tex.diffuse.naturalWidth || 1024) * scale));

    canvas.height = Math.max(1, Math.round((tex.diffuse.naturalHeight || 1024) * scale));



    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) return null;

    ctx.drawImage(tex.diffuse, 0, 0, canvas.width, canvas.height);

    const outData = ctx.getImageData(0, 0, canvas.width, canvas.height);



    const patCanvas = document.createElement('canvas');

    patCanvas.width = canvas.width;

    patCanvas.height = canvas.height;

    const patCtx = patCanvas.getContext('2d', { willReadFrequently: true });



    const maskCanvas = document.createElement('canvas');

    maskCanvas.width = canvas.width;

    maskCanvas.height = canvas.height;

    const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });



    if (!patCtx || !maskCtx) return null;

    patCtx.drawImage(tex.pattern, 0, 0, canvas.width, canvas.height);

    maskCtx.drawImage(tex.tintMask, 0, 0, canvas.width, canvas.height);



    const patData = patCtx.getImageData(0, 0, canvas.width, canvas.height);

    const maskData = maskCtx.getImageData(0, 0, canvas.width, canvas.height);



    const bodyRgb = hexToRgb(this.palette.body || '#4a543b');

    const markingsRgb = hexToRgb(this.palette.markings || '#2b3221');

    const flankRgb = hexToRgb(this.palette.flank || '#647050');

    const underbellyRgb = hexToRgb(this.palette.underbelly || '#c4baa1');

    const detailRgb = hexToRgb(this.palette.detail || '#1f1512');

    const displayRgb = hexToRgb(this.palette.display || '#a83c24');

    const isDisplayBlack = displayRgb.r === 0 && displayRgb.g === 0 && displayRgb.b === 0;



    for (let i = 0; i < outData.data.length; i += 4) {

      const t = maskData.data[i] / 255;

      const r = maskData.data[i + 1] / 255;

      const n = maskData.data[i + 2] / 255;

      const patVal = (patData.data[i] + patData.data[i + 1] + patData.data[i + 2]) / 765;



      const baseR = outData.data[i];

      const baseG = outData.data[i + 1];

      const baseB = outData.data[i + 2];



      const u = (1 - t) * r * n;

      const m = t * (1 - r) * n * patVal;

      const j = (1 - t) * (1 - r) * n;

      const w = (1 - t) * r * (1 - n);

      const N = t * r * (1 - n) * patVal;

      const C = t * (1 - r) * (1 - n) * Math.max(0.35, patVal);

      const S = u + m + j + w + N + C;

      const L = S > 0 ? S : 1;



      const M = (bodyRgb.r * u + markingsRgb.r * m + flankRgb.r * j + underbellyRgb.r * w + detailRgb.r * N + displayRgb.r * C) / L;

      const E = (bodyRgb.g * u + markingsRgb.g * m + flankRgb.g * j + underbellyRgb.g * w + detailRgb.g * N + displayRgb.g * C) / L;

      const F = (bodyRgb.b * u + markingsRgb.b * m + flankRgb.b * j + underbellyRgb.b * w + detailRgb.b * N + displayRgb.b * C) / L;



      const z = 0.28 + (0.299 * baseR + 0.587 * baseG + 0.114 * baseB) / 255 * 0.9;

      const I = 255 * clamp01(M / 255 * z);

      const T = 255 * clamp01(E / 255 * z);

      const A = 255 * clamp01(F / 255 * z);

      const _ = clamp01(1.35 * S);



      const D = clamp01(_ + 0.45 * (1 - Math.max(M, E, F) / 255));

      let P = lerp(baseR, I, D);

      let B = lerp(baseG, T, D);

      let U = lerp(baseB, A, D);



      if (isDisplayBlack && C > 0.01) {

        const e = clamp01(2.6 * C + 0.22 * patVal);

        P = lerp(P, 0, e);

        B = lerp(B, 0, e);

        U = lerp(U, 0, e);

        if (C > 0.32) { P = 0; B = 0; U = 0; }

      }



      outData.data[i] = P;

      outData.data[i + 1] = B;

      outData.data[i + 2] = U;

    }



    ctx.putImageData(outData, 0, 0);

    return canvas;

  },



  queueTextureUpdate() {

    if (this._tintRaf) return;

    this._tintRaf = requestAnimationFrame(() => {

      this._tintRaf = null;

      this.updateThreeTexture();

    });

  },



  updateThreeTexture() {

    if (!this.threeModel) return;



    const canvas = this.computeIslePilotTexture();

    if (!canvas) return;



    if (!this.threeTexture) {

      this.threeTexture = new THREE.CanvasTexture(canvas);

      if ('colorSpace' in this.threeTexture && THREE.SRGBColorSpace) {

        this.threeTexture.colorSpace = THREE.SRGBColorSpace;

      } else if ('encoding' in this.threeTexture && THREE.sRGBEncoding) {

        this.threeTexture.encoding = THREE.sRGBEncoding;

      }

      this.threeTexture.flipY = false;

    } else {

      this.threeTexture.image = canvas;

      this.threeTexture.needsUpdate = true;

    }



    const eyesColor = new THREE.Color(this.palette.eyes || '#e08f24');

    const displayColor = new THREE.Color(this.palette.display || '#a83c24');

    const isDisplayBlack = displayColor.getHex() === 0;

    const defaultWhite = new THREE.Color('#ffffff');



    this.threeModel.traverse(child => {

      if (child instanceof THREE.Mesh) {

        const mats = Array.isArray(child.material) ? child.material : [child.material];

        for (const mat of mats) {

          const matName = (mat.name || '').toLowerCase();

          mat.map = this.threeTexture;

          mat.color.copy(defaultWhite);

          mat.emissive.set('#000000');

          mat.emissiveIntensity = 0;



          if (/eye|iris|pupil/.test(matName)) {

            mat.color.copy(eyesColor);

            mat.emissive.copy(eyesColor);

            mat.emissiveIntensity = 0.45;

            mat.map = null;

          } else if (/display|crest|horn|spike/.test(matName)) {

            mat.color.copy(displayColor);

            mat.map = isDisplayBlack ? null : this.threeTexture;

            mat.emissive.copy(displayColor);

            mat.emissiveIntensity = 0.15 * (!isDisplayBlack ? 1 : 0);

          }

          mat.needsUpdate = true;

        }

      }

    });



    this.renderScene();

  },



  setupStageControls() {

    const stage = document.getElementById('skineditor-stage-wrapper');

    if (!stage || stage._initMultiDrag) return;

    stage._initMultiDrag = true;



    let isDragging = false;

    let startX = 0;

    let startY = 0;



    const onPointerDown = (e) => {

      isDragging = true;

      startX = e.clientX;

      startY = e.clientY;

      stage.style.cursor = 'grabbing';

      if (this.isAutoRotating) this.toggleAutoRotate(false);

    };



    const onPointerMove = (e) => {

      if (!isDragging) return;

      const deltaX = e.clientX - startX;

      const deltaY = e.clientY - startY;

      startX = e.clientX;

      startY = e.clientY;



      this.yaw = (this.yaw + deltaX * 0.008);

      this.pitch = Math.max(-0.65, Math.min(0.65, this.pitch + deltaY * 0.004));



      if (this.threeModel) {

        this.threeModel.rotation.y = this.yaw;

        this.threeModel.rotation.x = this.pitch;

        this.renderScene();

      }

      this.updateAngleReadout();

    };



    const onPointerUp = () => {

      isDragging = false;

      if (stage) stage.style.cursor = 'grab';

    };



    stage.addEventListener('mousedown', onPointerDown);

    window.addEventListener('mousemove', onPointerMove);

    window.addEventListener('mouseup', onPointerUp);



    stage.addEventListener('touchstart', (e) => {

      if (e.touches.length === 1) {

        isDragging = true;

        startX = e.touches[0].clientX;

        startY = e.touches[0].clientY;

        if (this.isAutoRotating) this.toggleAutoRotate(false);

      }

    }, { passive: true });



    window.addEventListener('touchmove', (e) => {

      if (!isDragging || e.touches.length !== 1) return;

      const deltaX = e.touches[0].clientX - startX;

      const deltaY = e.touches[0].clientY - startY;

      startX = e.touches[0].clientX;

      startY = e.touches[0].clientY;



      this.yaw = (this.yaw + deltaX * 0.008);

      this.pitch = Math.max(-0.65, Math.min(0.65, this.pitch + deltaY * 0.004));



      if (this.threeModel) {

        this.threeModel.rotation.y = this.yaw;

        this.threeModel.rotation.x = this.pitch;

        this.renderScene();

      }

      this.updateAngleReadout();

    }, { passive: true });



    window.addEventListener('touchend', () => { isDragging = false; });



    stage.addEventListener('wheel', (e) => {

      e.preventDefault();

      this.distance = Math.max(this.distMin, Math.min(this.distMax, this.distance + 0.003 * e.deltaY));

      this.renderScene();

      this.updateAngleReadout();

    }, { passive: false });

  },



  updateAngleReadout() {

    const readout = document.getElementById('skineditor-angle-readout');

    if (!readout) return;

    const degX = Math.round(this.pitch * 180 / Math.PI);

    let degY = Math.round(this.yaw * 180 / Math.PI) % 360;

    if (degY < 0) degY += 360;

    const zoomPct = Math.round((5.2 / this.distance) * 100);

    readout.textContent = `Góc X: ${degX}° | Y: ${degY}° | Zoom: ${zoomPct}%`;

  },



  zoomIn() {

    this.distance = Math.max(this.distMin, this.distance - 0.45);

    this.renderScene();

    this.updateAngleReadout();

  },



  zoomOut() {

    this.distance = Math.min(this.distMax, this.distance + 0.45);

    this.renderScene();

    this.updateAngleReadout();

  },



  setPresetView(preset) {

    if (preset === 'side') {

      this.yaw = 0;

      this.pitch = 0;

    } else if (preset === 'front') {

      this.yaw = Math.PI / 2;

      this.pitch = 0;

    }

    if (this.threeModel) {

      this.threeModel.rotation.y = this.yaw;

      this.threeModel.rotation.x = this.pitch;

    }

    this.renderScene();

    this.updateAngleReadout();

  },



  resetCamera() {

    this.yaw = 0.35;

    this.pitch = -0.08;

    this.distance = 5.2;

    if (this.threeModel) {

      this.threeModel.rotation.y = this.yaw;

      this.threeModel.rotation.x = this.pitch;

    }

    this.renderScene();

    this.updateAngleReadout();

    App.showToast("🎯 Đã đặt lại góc nhìn camera chuẩn!");

  },



  toggleAutoRotate(forceState) {

    this.isAutoRotating = forceState !== undefined ? forceState : !this.isAutoRotating;

    const btn = document.getElementById('skineditor-btn-autorotate');

    if (btn) btn.classList.toggle('active', this.isAutoRotating);



    if (this.isAutoRotating) {

      App.showToast("🔄 Đã bật chế độ tự động xoay 360°!");

      const rotateStep = () => {

        if (!this.isAutoRotating) return;

        this.yaw += 0.008;

        if (this.threeModel) {

          this.threeModel.rotation.y = this.yaw;

        }

        this.renderScene();

        this.updateAngleReadout();

        this.autoRotateTimer = requestAnimationFrame(rotateStep);

      };

      this.autoRotateTimer = requestAnimationFrame(rotateStep);

    } else {

      if (this.autoRotateTimer) cancelAnimationFrame(this.autoRotateTimer);

      this.autoRotateTimer = null;

    }

  },



  setGrowth(val) {

    const num = parseInt(val, 10) || 100;

    this.growth = num / 100;

    const label = document.getElementById('skineditor-growth-label');

    if (label) label.textContent = `${num}%`;



    if (this.threeModel) {

      const rawY = (this._rawModelSize && this._rawModelSize.y) ? this._rawModelSize.y : 1;

      const baseScale = (this.sex === 'female' ? 2.3 : 2.45) / Math.max(rawY, 1);

      const growthFactor = 0.5 + 0.5 * this.growth;

      this.threeModel.scale.setScalar(baseScale * growthFactor);

      this.renderScene();

    }

  },



  setSpecies(sp) {

    this._userInteractedSpecies = true;

    this.species = sp;

    const def = this.defaults[sp] || this.defaults.Tyrannosaurus;

    for (const key of Object.keys(def)) {

      if (!this.lockedZones[key]) {

        this.palette[key] = def[key];

      }

    }

    const badgeSp = document.getElementById('skineditor-badge-species');

    if (badgeSp) badgeSp.textContent = sp;



    this.renderZones();

    this.updatePreview();

    this.loadThreeModel(sp);

  },



  setSex(s) {

    this.sex = s;

    const btnMale = document.getElementById('skineditor-btn-male');

    const btnFemale = document.getElementById('skineditor-btn-female');

    const badgeSex = document.getElementById('skineditor-badge-sex');



    if (btnMale) btnMale.classList.toggle('active', s === 'male');

    if (btnFemale) btnFemale.classList.toggle('active', s === 'female');



    if (badgeSex) {

      badgeSex.textContent = s === 'male' ? '♂ Đực (Male)' : '♀ Cái (Female)';

      badgeSex.style.color = s === 'male' ? '#60a5fa' : '#f472b6';

      badgeSex.style.borderColor = s === 'male' ? 'rgba(59, 130, 246, 0.4)' : 'rgba(244, 114, 182, 0.4)';

    }



    this.renderZones();

    this.updatePreview();

    this.queueTextureUpdate();

  },



  setPattern(p) {

    this.pattern = parseInt(p, 10) || 0;

    this.updatePreview();

    this.queueTextureUpdate();

  },



  setVariation(v) {

    this.variation = parseInt(v, 10) || 0;

    this.updatePreview();

  },



  setTheme(t) {

    this.theme = parseInt(t, 10) || 0;

    this.updatePreview();

  },



  setRenderMode(m) {

    this.renderMode = m;

    const btnStd = document.getElementById('skineditor-btn-mode-std');

    const btnGlitch = document.getElementById('skineditor-btn-mode-glitch');

    if (btnStd) btnStd.classList.toggle('active', m === 'standard');

    if (btnGlitch) btnGlitch.classList.toggle('active', m === 'glitched');

    this.updatePreview();

    this.queueTextureUpdate();

  },



  updateColor(zone, color) {

    if (!color) return;

    this.palette[zone] = color;



    const pickerWrap = document.getElementById(`skineditor-picker-wrap-${zone}`);

    const colorInput = document.getElementById(`skineditor-color-${zone}`);

    const hexInput = document.getElementById(`skineditor-hex-${zone}`);



    if (pickerWrap) pickerWrap.style.backgroundColor = color;

    if (colorInput) colorInput.value = color;

    if (hexInput && hexInput.value.toUpperCase() !== color.toUpperCase()) {

      hexInput.value = color.toUpperCase();

    }



    this.queueTextureUpdate();

    this.updatePreview();

  },



  toggleLock(zone) {

    this.lockedZones[zone] = !this.lockedZones[zone];

    const btn = document.getElementById(`skineditor-lock-${zone}`);

    if (btn) {

      btn.classList.toggle('locked', this.lockedZones[zone]);

      btn.innerHTML = this.lockedZones[zone] ? '🔒' : '🔓';

      btn.title = this.lockedZones[zone] ? 'Đã khóa màu' : 'Mở khóa màu';

    }

  },



  resetZone(zone) {

    const def = (this.defaults[this.species] || {})[zone] || '#4a543b';

    this.updateColor(zone, def);

    App.showToast(`🔄 Đã khôi phục màu mặc định cho: ${this.zoneLabels[zone]?.name || zone}`);

  },



  resetAll() {

    const def = this.defaults[this.species] || this.defaults.Tyrannosaurus;

    for (const key of Object.keys(def)) {

      if (!this.lockedZones[key]) {

        this.updateColor(key, def[key]);

      }

    }

    this.variation = 0;

    this.pattern = 0;

    this.theme = 0;



    const inVar = document.getElementById('skineditor-input-variation');

    const inPat = document.getElementById('skineditor-input-pattern');

    const inThm = document.getElementById('skineditor-input-theme');

    if (inVar) inVar.value = 0;

    if (inPat) inPat.value = 0;

    if (inThm) inThm.value = 0;



    this.renderZones();

    App.showToast("🔄 Đã khôi phục toàn bộ bảng màu gốc chuẩn của loài!");

  },



  randomize() {

    const randPreset = this.presetSwatches;

    for (const key of Object.keys(this.zoneLabels)) {

      if (!this.lockedZones[key]) {

        const randColor = randPreset[Math.floor(Math.random() * randPreset.length)];

        this.palette[key] = randColor;

      }

    }

    this.renderZones();

    this.queueTextureUpdate();

    this.updatePreview();

    App.showToast("🎲 Đã phối màu ngẫu nhiên hài hòa cho khủng long!");

  },



  renderZones() {

    const container = document.getElementById('skineditor-zones-container');

    if (!container) return;



    const zones = ['underbelly', 'body', 'flank', 'markings'];

    if (this.sex === 'male') {

      zones.push('display');

    }

    zones.push('detail', 'eyes');



    container.innerHTML = zones.map(key => {

      const info = this.zoneLabels[key] || { name: key, desc: '' };

      const curColor = this.palette[key] || '#4a543b';

      const isLocked = !!this.lockedZones[key];



      return `

        <div class="skineditor-zone-card">

          <div class="skineditor-zone-header">

            <div>

              <span style="font-weight: 700; color: #fff; font-size: 0.85rem;">${info.name}</span>

              <div style="font-size: 0.72rem; color: #94a3b8;">${info.desc}</div>

            </div>

            <div style="display: flex; gap: 4px;">

              <button type="button" class="skineditor-icon-btn ${isLocked ? 'locked' : ''}" id="skineditor-lock-${key}" title="${isLocked ? 'Đã khóa màu' : 'Khóa màu này'}" onclick="SkinEditor.toggleLock('${key}')">

                ${isLocked ? '🔒' : '🔓'}

              </button>

              <button type="button" class="skineditor-icon-btn" title="Khôi phục mặc định" onclick="SkinEditor.resetZone('${key}')">

                🔄

              </button>

            </div>

          </div>



          <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">

            <div class="skineditor-color-input-group">

              <div class="skineditor-color-picker-wrap" id="skineditor-picker-wrap-${key}" style="background-color: ${curColor};">

                <input type="color" id="skineditor-color-${key}" value="${curColor}" oninput="SkinEditor.updateColor('${key}', this.value)" onchange="SkinEditor.updateColor('${key}', this.value)">

              </div>

              <input type="text" class="skineditor-hex-input" id="skineditor-hex-${key}" value="${curColor.toUpperCase()}" oninput="SkinEditor.updateColor('${key}', this.value)" onchange="SkinEditor.updateColor('${key}', this.value)">

            </div>



            <div class="skineditor-mini-swatches">

              ${this.presetSwatches.slice(0, 7).map(hex => `

                <div class="skineditor-mini-swatch" style="background-color: ${hex};" title="${hex}" onclick="SkinEditor.updateColor('${key}', '${hex}')"></div>

              `).join('')}

            </div>

          </div>

        </div>

      `;

    }).join('');

  },



  generateGameCode() {

    const numStr = `${this.pattern}${this.variation}${this.theme}`;

    const zones = [];

    if (this.species === 'Beipiaosaurus') zones.push('detail');

    else if (this.species === 'Carnotaurus') zones.push('teeth');

    else if (this.species === 'Herrerasaurus' || this.species === 'Omniraptor') zones.push('claws', 'mouth');



    zones.push('underbelly', 'body', 'flank', 'markings', 'display', 'eyes');



    let hexStr = '';

    for (const z of zones) {

      const hex = (this.palette[z] || '#5A6B48').replace('#', '').toUpperCase();

      hexStr += hex.padEnd(6, '0') + 'FF';

    }

    return `${this.species}${numStr}${hexStr}`;

  },



  renderDinoSkinDirectly() {

    const canvas = document.getElementById('skineditor-tint-canvas');

    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (!ctx) return;



    const img = document.getElementById('skineditor-img');

    if (!img) return;



    const drawSkin = (sourceImg) => {

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const buffer = document.createElement('canvas');

      buffer.width = canvas.width;

      buffer.height = canvas.height;

      const bCtx = buffer.getContext('2d');

      if (!bCtx) return;



      bCtx.drawImage(sourceImg, 0, 0, canvas.width, canvas.height);



      const bodyColor = this.palette.body || '#4a543b';

      const flankColor = this.palette.flank || '#647050';

      const underbellyColor = this.palette.underbelly || '#c4baa1';

      const markingsColor = this.palette.markings || '#2b3221';

      const displayColor = this.palette.display || '#a83c24';

      const eyeColor = this.palette.eyes || '#e08f24';



      bCtx.globalCompositeOperation = 'source-atop';

      const skinGrad = bCtx.createLinearGradient(0, canvas.height * 0.15, 0, canvas.height * 0.95);

      skinGrad.addColorStop(0, bodyColor);

      skinGrad.addColorStop(0.35, bodyColor);

      skinGrad.addColorStop(0.65, flankColor);

      skinGrad.addColorStop(1, underbellyColor);



      bCtx.fillStyle = skinGrad;

      bCtx.globalAlpha = 0.58;

      bCtx.fillRect(0, 0, canvas.width, canvas.height);



      bCtx.globalAlpha = 0.70;

      bCtx.fillStyle = markingsColor;

      for (let s = 60; s < canvas.width - 60; s += 22) {

        bCtx.beginPath();

        bCtx.ellipse(s, canvas.height * 0.40 + Math.sin(s * 0.05) * 12, 6, 28 + (s % 18), -0.22, 0, Math.PI * 2);

        bCtx.fill();

      }



      if (this.sex === 'male') {

        bCtx.globalAlpha = 0.75;

        bCtx.fillStyle = displayColor;

        bCtx.beginPath();

        bCtx.arc(canvas.width * 0.28, canvas.height * 0.32, 26, 0, Math.PI * 2);

        bCtx.fill();

      }



      bCtx.globalAlpha = 0.95;

      bCtx.fillStyle = eyeColor;

      bCtx.shadowColor = eyeColor;

      bCtx.shadowBlur = 8;

      bCtx.beginPath();

      bCtx.arc(canvas.width * 0.25, canvas.height * 0.30, 4.5, 0, Math.PI * 2);

      bCtx.fill();

      bCtx.shadowBlur = 0;



      bCtx.globalCompositeOperation = 'multiply';

      bCtx.globalAlpha = 0.62;

      bCtx.drawImage(sourceImg, 0, 0, canvas.width, canvas.height);



      ctx.drawImage(buffer, 0, 0);

    };



    if (img.complete && img.naturalWidth > 0) {

      drawSkin(img);

    } else {

      img.onload = () => drawSkin(img);

    }

  },



  updatePreview() {

    const previewImg = document.getElementById('skineditor-img');

    const codeInput = document.getElementById('skineditor-code');



    if (previewImg && window.Garage) {

      const newSrc = Garage.getDinoImageUrl(this.species);

      if (previewImg.src !== newSrc) {

        previewImg.src = newSrc;

      }

    }



    this.renderDinoSkinDirectly();



    const code = this.generateGameCode();

    if (codeInput) {

      codeInput.value = code;

    }

  },



  copySkinCode() {

    const codeInput = document.getElementById('skineditor-code');

    if (!codeInput) return;

    navigator.clipboard.writeText(codeInput.value).then(() => {

      App.showToast("📋 Đã sao chép Evrima Game Skin Code! Bạn có thể dán trực tiếp vào The Isle.");

    }).catch(() => {

      App.showToast("Mã Skin: " + codeInput.value);

    });

  },



  async pasteSkinCode() {

    try {

      const text = await navigator.clipboard.readText();

      if (text && text.trim()) {

        this.applyImportedCode(text.trim());

      } else {

        this.promptImportCode();

      }

    } catch (e) {

      this.promptImportCode();

    }

  },



  promptImportCode() {

    const code = prompt("Nhập mã Skin Game Code Evrima (ví dụ: Tyrannosaurus000...):");

    if (!code || !code.trim()) return;

    this.applyImportedCode(code.trim());

  },



  importFromInput() {

    const input = document.getElementById('skineditor-quick-import-input');

    if (!input || !input.value.trim()) {

      App.showToast("⚠️ Vui lòng dán mã Skin Game vào ô nhập!");

      return;

    }

    this.applyImportedCode(input.value.trim());

  },



  applyImportedCode(code) {

    const parsed = this.parseGameSkinCode(code);

    if (!parsed) {

      App.showToast("⚠️ Mã Skin không đúng định dạng Evrima!");

      return;

    }



    if (parsed.species) {

      this.species = parsed.species;

      const selectSp = document.getElementById('skineditor-select-species');

      if (selectSp) selectSp.value = parsed.species;

      const badgeSp = document.getElementById('skineditor-badge-species');

      if (badgeSp) badgeSp.textContent = parsed.species;

    }



    this.pattern = parsed.pattern || 0;

    this.variation = parsed.variation || 0;

    this.theme = parsed.theme || 0;



    const inVar = document.getElementById('skineditor-input-variation');

    const inPat = document.getElementById('skineditor-input-pattern');

    const inThm = document.getElementById('skineditor-input-theme');

    if (inVar) inVar.value = this.variation;

    if (inPat) inPat.value = this.pattern;

    if (inThm) inThm.value = this.theme;



    if (parsed.palette) {

      this.palette = { ...this.palette, ...parsed.palette };

    }



    this.renderZones();

    this.loadThreeModel(this.species);

    this.updatePreview();

    App.showToast(`🎉 Đã nhập thành công Skin cho loài: ${this.species}!`);

  },



  parseGameSkinCode(code) {

    const match = /^([A-Za-z]+?)(\d{3,})((?:[0-9A-Fa-f]{8})+)$/.exec(code.trim());

    if (!match) return null;

    const [, species, l, hexPart] = match;

    const pattern = parseInt(l.slice(0, -2), 10) || 0;

    const variation = parseInt(l[l.length - 2], 10) || 0;

    const theme = parseInt(l[l.length - 1], 10) || 0;



    const hexes = [];

    for (let i = 0; i < hexPart.length; i += 8) {

      hexes.push('#' + hexPart.slice(i, i + 6));

    }

    const zones = [];

    if (species === 'Beipiaosaurus') zones.push('detail');

    else if (species === 'Carnotaurus') zones.push('teeth');

    else if (species === 'Herrerasaurus' || species === 'Omniraptor') zones.push('claws', 'mouth');

    zones.push('underbelly', 'body', 'flank', 'markings', 'display', 'eyes');



    const palette = {};

    zones.forEach((z, idx) => {

      if (hexes[idx]) palette[z] = hexes[idx];

    });



    return { species, pattern, variation, theme, palette };

  },



  copySkinJson() {

    const payload = {

      species: this.species,

      sex: this.sex,

      variation: this.variation,

      pattern: this.pattern,

      theme: this.theme,

      code: this.generateGameCode(),

      palette: this.palette,

      renderMode: this.renderMode

    };

    navigator.clipboard.writeText(JSON.stringify(payload, null, 2)).then(() => {

      App.showToast("📋 Đã sao chép cấu hình Skin JSON vào bộ nhớ tạm!");

    });

  },



  downloadSkinFile() {

    const payload = {

      species: this.species,

      sex: this.sex,

      variation: this.variation,

      pattern: this.pattern,

      theme: this.theme,

      code: this.generateGameCode(),

      palette: this.palette,

      renderMode: this.renderMode,

      exportedAt: new Date().toISOString()

    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });

    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');

    a.href = url;

    a.download = `Skin_${this.species}_${this.sex}_${Date.now()}.json`;

    a.click();

    URL.revokeObjectURL(url);

    App.showToast("📥 Đã tải xuống tệp skin JSON thành công!");

  },



  async applyToServer() {

    const steamInput = document.getElementById('skineditor-target-steamid');

    const user = JSON.parse(localStorage.getItem('steam_user') || 'null');

    const steamId = (steamInput && steamInput.value.trim()) || (user ? user.steamId : '76561199259679997');



    const code = this.generateGameCode();

    try {

      const res = await fetch('/api/skin/set', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({

          targetSteamId: steamId,

          steam_id: steamId,

          species: this.species,

          sex: this.sex,

          variation: this.variation,

          pattern: this.pattern,

          theme: this.theme,

          code: code,

          palette: this.palette

        })

      });

      const data = await res.json();

      if (data.ok || data.success) {

        if (navigator.clipboard) {

          navigator.clipboard.writeText(code).catch(() => {});

        }

        App.showToast("Thành công");

        this.loadDrafts();

      } else {

        App.showToast("Thất bại");

      }

    } catch (e) {

      App.showToast("Thất bại");

    }

  },



  savePresetFromInput() {

    const input = document.getElementById('skineditor-preset-name-input');

    const name = (input && input.value.trim()) || `${this.species} - ${this.sex === 'male' ? 'Đực' : 'Cái'} (Custom)`;

    this.createAndSaveDraft(name);

    if (input) input.value = '';

  },



  saveDraftPrompt() {

    const name = prompt("Nhập tên cho bản nháp Skin:", `${this.species} - ${this.sex === 'male' ? 'Đực' : 'Cái'} (Custom)`);

    if (!name || !name.trim()) return;

    this.createAndSaveDraft(name.trim());

  },



  createAndSaveDraft(name) {

    const newDraft = {

      id: 'draft_' + Date.now(),

      name: name,

      species: this.species,

      sex: this.sex,

      pattern: this.pattern,

      variation: this.variation,

      theme: this.theme,

      renderMode: this.renderMode,

      palette: { ...this.palette },

      createdAt: new Date().toLocaleDateString('vi-VN')

    };



    this.drafts.unshift(newDraft);



    const user = JSON.parse(localStorage.getItem('steam_user') || 'null');

    const steamId = user ? user.steamId : '76561199259679997';

    localStorage.setItem(`skin_drafts_${steamId}`, JSON.stringify(this.drafts));



    fetch(`/api/player/skin-drafts?steam_id=${steamId}`, {

      method: 'POST',

      headers: { 'Content-Type': 'application/json' },

      body: JSON.stringify({ drafts: this.drafts, steam_id: steamId })

    }).catch(() => {});



    this.renderDrafts();

    App.showToast(`💾 Đã lưu "${name}" vào Kho Bản Lưu Cá Nhân!`);

  },



  async loadDrafts() {

    const user = JSON.parse(localStorage.getItem('steam_user') || 'null');

    const steamId = user ? user.steamId : '76561199259679997';



    try {

      const res = await fetch(`/api/player/skin-drafts?steam_id=${steamId}`);

      const data = await res.json();

      if (data && data.drafts && data.drafts.length > 0) {

        this.drafts = data.drafts;

        localStorage.setItem(`skin_drafts_${steamId}`, JSON.stringify(this.drafts));

        this.renderDrafts();

        return;

      }

    } catch (e) {}



    const saved = localStorage.getItem(`skin_drafts_${steamId}`) || localStorage.getItem('skin_drafts_local');

    if (saved) {

      try {

        this.drafts = JSON.parse(saved);

      } catch (e) {

        this.drafts = [];

      }

    } else {

      this.drafts = [

        {

          id: 'draft_1',

          name: 'Hồng Nam Tính (Default)',

          species: 'Tyrannosaurus',

          sex: 'male',

          palette: { body: '#831843', markings: '#4c0519', flank: '#be185d', underbelly: '#fbcfe8', display: '#f43f5e', eyes: '#fbbf24', detail: '#1f1512' },

          createdAt: new Date().toLocaleDateString('vi-VN')

        }

      ];

    }

    this.renderDrafts();

  },



  renderDrafts() {

    const container = document.getElementById('skineditor-drafts-container');

    if (!container) return;



    if (this.drafts.length === 0) {

      container.innerHTML = '<div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 0.82rem;">Chưa có bản lưu cá nhân nào. Hãy phối màu và bấm "Lưu"!</div>';

      return;

    }



    container.innerHTML = this.drafts.map(d => {

      const dots = ['body', 'markings', 'flank', 'underbelly', 'display']

        .filter(k => d.palette && d.palette[k])

        .map(k => `<span class="color-dot" style="background-color: ${d.palette[k]};" title="${k}"></span>`)

        .join(' ');



      return `

        <div class="skineditor-draft-item">

          <div>

            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">

              <span style="font-weight: 700; color: #fff; font-size: 0.88rem;">${d.name}</span>

              <span class="badge" style="background: rgba(0, 240, 118, 0.15); color: var(--accent); font-size: 0.72rem; padding: 2px 6px; border-radius: 4px;">${d.species}</span>

              <span style="font-size: 0.75rem; color: ${d.sex === 'male' ? '#60a5fa' : '#f472b6'};">${d.sex === 'male' ? '♂ Đực' : '♀ Cái'}</span>

            </div>

            <div style="display: flex; align-items: center; gap: 6px;">

              <span style="font-size: 0.72rem; color: #94a3b8;">${d.createdAt || 'Mới đây'}</span>

              <span style="color: #64748b; font-size: 0.72rem;">•</span>

              <div style="display: flex; gap: 4px;">${dots}</div>

            </div>

          </div>



          <div style="display: flex; gap: 6px;">

            <button type="button" class="btn-secondary" style="font-size: 0.75rem; padding: 5px 10px;" onclick="SkinEditor.loadDraft('${d.id}')">

              📂 Tải

            </button>

            <button type="button" class="btn-primary" style="font-size: 0.75rem; padding: 5px 10px;" onclick="SkinEditor.applyDraft('${d.id}')">

              ⚡ Áp Dụng

            </button>

            <button type="button" class="btn-secondary" style="font-size: 0.75rem; padding: 5px 8px; color: #ef4444;" onclick="SkinEditor.deleteDraft('${d.id}')">

              🗑️

            </button>

          </div>

        </div>

      `;

    }).join('');

  },



  loadDraft(id) {

    const draft = this.drafts.find(d => d.id === id);

    if (!draft) return;



    this.species = draft.species || 'Tyrannosaurus';

    this.sex = draft.sex || 'male';

    this.pattern = draft.pattern || 0;

    this.variation = draft.variation || 0;

    this.theme = draft.theme || 0;

    this.renderMode = draft.renderMode || 'standard';

    this.palette = { ...draft.palette };



    const selectSp = document.getElementById('skineditor-select-species');

    if (selectSp) selectSp.value = this.species;

    const badgeSp = document.getElementById('skineditor-badge-species');

    if (badgeSp) badgeSp.textContent = this.species;



    const inVar = document.getElementById('skineditor-input-variation');

    const inPat = document.getElementById('skineditor-input-pattern');

    const inThm = document.getElementById('skineditor-input-theme');

    if (inVar) inVar.value = this.variation;

    if (inPat) inPat.value = this.pattern;

    if (inThm) inThm.value = this.theme;



    this.setSex(this.sex);

    this.renderZones();

    this.loadThreeModel(this.species);

    this.updatePreview();

    App.showToast(`📂 Đã tải mẫu skin: ${draft.name}`);

  },



  deleteDraft(id) {

    if (!confirm("Bạn có chắc chắn muốn xóa bản lưu skin này?")) return;

    this.drafts = this.drafts.filter(d => d.id !== id);



    const user = JSON.parse(localStorage.getItem('steam_user') || 'null');

    const steamId = user ? user.steamId : '76561199259679997';

    localStorage.setItem(`skin_drafts_${steamId}`, JSON.stringify(this.drafts));



    fetch(`/api/player/skin-drafts?steam_id=${steamId}`, {

      method: 'POST',

      headers: { 'Content-Type': 'application/json' },

      body: JSON.stringify({ drafts: this.drafts, steam_id: steamId })

    }).catch(() => {});



    this.renderDrafts();

    App.showToast("🗑️ Đã xóa mẫu Skin thành công!");

  },



  applyDraft(id) {

    this.loadDraft(id);

    this.applyToServer();

  }

};



const Referral = {

  code: 'JCD9JR',

  link: '',



  async render() {

    const user = JSON.parse(localStorage.getItem('steam_user') || 'null');

    const steamId = user ? user.steamId : '76561199575258338';



    // Tạo link mời chuẩn xác từ domain website hiện tại của người dùng

    const origin = window.location.origin;

    this.link = `${origin}/#referral?ref=${this.code}`;



    // Kiểm tra mã mời trên URL (nếu bạn bè click vào link)

    this.checkUrlReferral();



    try {

      const res = await fetch(`/api/server/referral?steam_id=${steamId}`);

      const data = await res.json();



      if (data.code) {

        this.code = data.code;

        this.link = data.referral_link || `${origin}/#referral?ref=${this.code}`;

      }



      // Render 6 character boxes

      const boxesWrap = document.getElementById('referral-boxes-wrap');

      if (boxesWrap && this.code) {

        boxesWrap.innerHTML = this.code

          .split('')

          .map(c => `<span class="referral-char-box">${c}</span>`)

          .join('');

      }



      // Stats

      const statInvited = document.getElementById('referral-stat-invited');

      const statRewarded = document.getElementById('referral-stat-rewarded');

      const statEarned = document.getElementById('referral-stat-earned');



      if (statInvited) statInvited.textContent = (data.invited_count !== undefined) ? data.invited_count : 0;

      if (statRewarded) statRewarded.textContent = (data.rewarded_count !== undefined) ? data.rewarded_count : 0;

      if (statEarned) statEarned.textContent = `$ ${data.earned !== undefined ? data.earned.toLocaleString() : 0}`;



      // Rewards amount

      if (data.for_referrer && data.for_referrer.amount) {

        const el = document.getElementById('referral-reward-you');

        if (el) el.textContent = data.for_referrer.amount;

      }

      if (data.for_referee && data.for_referee.amount) {

        const el = document.getElementById('referral-reward-friend');

        if (el) el.textContent = data.for_referee.amount;

      }



      // Nếu đã từng áp dụng mã, hiển thị trạng thái

      if (data.applied_code) {

        const statusEl = document.getElementById('referral-applied-status');

        if (statusEl) {

          statusEl.style.display = 'block';

          statusEl.style.color = '#00f076';

          statusEl.textContent = `✅ Đã áp dụng mã bạn bè: ${data.applied_code}`;

        }

      }



      // Invites list

      const invitesWrap = document.getElementById('referral-invites-list-wrap');

      const invitesTotal = document.getElementById('referral-invites-total-count');

      if (invitesTotal) invitesTotal.textContent = data.invited_count || 0;



      if (invitesWrap) {

        if (!data.invites || data.invites.length === 0) {

          invitesWrap.innerHTML = '<p class="referral-invites-empty">Chưa ai dùng mã của bạn.</p>';

        } else {

          invitesWrap.innerHTML = data.invites.map(inv => `

            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.06);">

              <div style="font-weight: 600; color: #fff;">${inv.name || 'Người chơi'}</div>

              <div style="font-size: 0.85rem; color: #94a3b8;">${inv.status || 'Đang chơi'}</div>

            </div>

          `).join('');

        }

      }

    } catch (e) {

      console.warn("Lỗi tải referral:", e);

    }

  },



  checkUrlReferral() {

    const urlParams = new URLSearchParams(window.location.search);

    let ref = urlParams.get('ref') || urlParams.get('code');

    if (!ref && window.location.hash.includes('ref=')) {

      const parts = window.location.hash.split('ref=');

      if (parts[1]) ref = parts[1].split('&')[0];

    }

    if (ref) {

      ref = ref.trim().toUpperCase();

      const input = document.getElementById('referral-input-code');

      if (input && !input.value) input.value = ref;

      const lastApplied = localStorage.getItem('last_auto_applied_ref');

      if (lastApplied !== ref) {

        this.applyCode(ref, true);

      }

    }

  },



  async applyCode(manualCode, isAuto = false) {

    const input = document.getElementById('referral-input-code');

    const code = manualCode || (input ? input.value.trim().toUpperCase() : '');

    if (!code) {

      if (!isAuto && typeof App !== 'undefined' && App.showToast) {

        App.showToast("⚠️ Vui lòng nhập mã giới thiệu của bạn bè!");

      }

      return;

    }

    const user = JSON.parse(localStorage.getItem('steam_user') || 'null');

    const steamId = user ? user.steamId : '76561199575258338';

    const name = user ? user.name : 'Người chơi';



    try {

      const res = await fetch('/api/server/referral/apply', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ code, steam_id: steamId, name })

      });

      const data = await res.json();

      if (data.ok || data.success) {

        localStorage.setItem('last_auto_applied_ref', code);

        const statusEl = document.getElementById('referral-applied-status');

        if (statusEl) {

          statusEl.style.display = 'block';

          statusEl.style.color = '#00f076';

          statusEl.textContent = `✅ ${data.message || 'Đã áp dụng mã giới thiệu ' + code}`;

        }

        if (typeof App !== 'undefined' && App.showToast) {

          App.showToast("🎉 " + (data.message || "Áp dụng mã giới thiệu thành công!"));

        }

      } else {

        if (!isAuto && typeof App !== 'undefined' && App.showToast) {

          App.showToast("⚠️ " + (data.error || data.message || "Không thể áp dụng mã này."));

        }

      }

    } catch (e) {

      if (!isAuto && typeof App !== 'undefined' && App.showToast) {

        App.showToast("⚠️ Lỗi kết nối khi gửi mã giới thiệu.");

      }

    }

  },



  copyCode() {

    const code = this.code || 'JCD9JR';

    navigator.clipboard.writeText(code).then(() => {

      const btn = document.getElementById('btn-copy-code');

      const txt = document.getElementById('btn-copy-code-text');

      if (btn && txt) {

        const oldTxt = txt.textContent;

        btn.classList.add('copied');

        txt.textContent = 'Đã sao chép!';

        setTimeout(() => {

          btn.classList.remove('copied');

          txt.textContent = oldTxt;

        }, 1500);

      }

      if (typeof App !== 'undefined' && App.showToast) {

        App.showToast("📋 Đã sao chép mã mời: " + code);

      }

    }).catch(() => {

      if (typeof App !== 'undefined' && App.showToast) {

        App.showToast("Mã mời: " + code);

      }

    });

  },



  copyLink() {

    const code = this.code || 'JCD9JR';

    // Trỏ liên kết trực tiếp bằng Web của bạn (không dùng islepilot.eu)

    const link = `${window.location.origin}/#referral?ref=${code}`;

    navigator.clipboard.writeText(link).then(() => {

      const btn = document.getElementById('btn-copy-link');

      const txt = document.getElementById('btn-copy-link-text');

      if (btn && txt) {

        const oldTxt = txt.textContent;

        btn.classList.add('copied');

        txt.textContent = 'Đã sao chép!';

        setTimeout(() => {

          btn.classList.remove('copied');

          txt.textContent = oldTxt;

        }, 1500);

      }

      if (typeof App !== 'undefined' && App.showToast) {

        App.showToast("🔗 Đã sao chép liên kết mời web bạn: " + link);

      }

    }).catch(() => {

      if (typeof App !== 'undefined' && App.showToast) {

        App.showToast("Liên kết mời: " + link);

      }

    });

  }

};



// 5. DỊCH CHUYỂN (ISLEPILOT REAL TELEPORT API)

// 5. DỊCH CHUYỂN (ISLEPILOT REAL TELEPORT API)

const Teleport = {

  locations: [],

  balance: 8090,

  activeCode: null,

  timerInterval: null,



  async render() {

    const container = document.getElementById('teleport-locations-container');

    const balanceEl = document.getElementById('teleport-balance-val');



    try {

      const res = await fetch('/api/server/teleport/locations');

      const data = await res.json();

      this.locations = data.locations || [];

      if (typeof data.balance === 'number') {

        this.balance = data.balance;

        if (balanceEl) balanceEl.textContent = `$ ${data.balance.toLocaleString('en-US')}`;

      }

    } catch (e) {

      console.warn('Lỗi tải locations:', e);

    }



    if (!container) return;



    if (this.locations.length === 0) {

      container.innerHTML = '<div style="text-align: center; padding: 30px; color: #94a3b8; grid-column: 1/-1;">Hiện không có điểm đến nào khả dụng trên máy chủ.</div>';

      return;

    }



    container.innerHTML = this.locations.map(loc => {

      const isFree = !loc.cost || loc.cost === 0;

      const tagText = isFree ? 'Miễn phí' : `${loc.cost.toLocaleString('en-US')} Xu`;



      return `

        <div class="teleport-loc-card">

          <div>

            <div class="teleport-loc-header">

              <div class="teleport-loc-icon">

                📍

              </div>

              <h3 class="teleport-loc-name" title="${loc.name}">${loc.name}</h3>

            </div>

            <div class="teleport-loc-tag">

              <span>🔗</span> <span>${tagText}</span>

            </div>

          </div>

          <button type="button" class="teleport-btn-action" onclick="Teleport.actionTeleport('${loc.id}', '${loc.name}')">

            Dịch chuyển

          </button>

        </div>

      `;

    }).join('');

  },



  async actionTeleport(locationId, locationName) {

    const user = JSON.parse(localStorage.getItem('steam_user') || 'null');

    const steamId = user ? user.steamId : '76561199175571899';



    try {

      const res = await fetch('/api/server/teleport', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ locationId, steam_id: steamId })

      });

      const data = await res.json();

      if (data.success || data.ok) {

        App.showToast("Thành công");

      } else {

        App.showToast("Thất bại");

      }

    } catch (e) {

      App.showToast("Thất bại");

    }

  },



  onCodeInput(val) {

    const btn = document.getElementById('teleport-friend-btn-submit');

    if (btn) {

      if (val && val.trim().length >= 4) {

        btn.classList.add('active');

      } else {

        btn.classList.remove('active');

      }

    }

  },



  async createFriendCode() {

    const wrap = document.getElementById('teleport-invite-action-wrap');

    if (!wrap) return;



    wrap.innerHTML = '<span style="font-size: 0.85rem; color: #00f076;">⏳ Đang tạo mã mời...</span>';



    const user = JSON.parse(localStorage.getItem('steam_user') || 'null');

    const steamId = user ? user.steamId : '76561199175571899';



    try {

      const res = await fetch('/api/server/teleport/friend/create', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ steam_id: steamId })

      });

      const data = await res.json();

      if (data.ok && data.code) {

        this.activeCode = data.code;

        this.renderActiveCode(data.code, data.expiresAt);

        App.showToast(`🎉 Mã mời của bạn: ${data.code} (Bấm để sao chép)`);

      } else {

        App.showToast(`⚠️ ${data.error || 'Không thể tạo mã lúc này'}`);

        this.resetInviteButton();

      }

    } catch (e) {

      App.showToast(`⚠️ Lỗi kết nối khi tạo mã!`);

      this.resetInviteButton();

    }

  },



  renderActiveCode(code, expiresAt) {

    const wrap = document.getElementById('teleport-invite-action-wrap');

    if (!wrap) return;



    if (this.timerInterval) clearInterval(this.timerInterval);



    wrap.innerHTML = `

      <div style="display: flex; flex-direction: column; gap: 8px;">

        <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(0, 0, 0, 0.6); border: 1.5px solid #00f076; border-radius: 8px; padding: 10px 16px; cursor: pointer; transition: all 0.2s;" onclick="Teleport.copyFriendCode('${code}')" title="Bấm để sao chép mã">

          <span style="font-family: monospace; font-size: 1.35rem; font-weight: 800; letter-spacing: 0.25em; color: #00f076;">${code}</span>

          <span style="font-size: 1rem; color: #94a3b8;">📋</span>

        </div>

        <div style="display: flex; justify-content: space-between; align-items: center;">

          <span style="font-size: 0.75rem; color: #94a3b8;" id="friend-code-timer">Hết hạn sau: 05:00</span>

          <button type="button" style="background: none; border: none; color: #00f076; font-size: 0.78rem; cursor: pointer; text-decoration: underline;" onclick="Teleport.createFriendCode()">Tạo mã mới</button>

        </div>

      </div>

    `;



    const timerEl = document.getElementById('friend-code-timer');

    this.timerInterval = setInterval(() => {

      const expSec = typeof expiresAt === 'number' ? expiresAt : (new Date(expiresAt).getTime() / 1000);

      const remainingSec = Math.max(0, Math.floor(expSec - Date.now() / 1000));

      const m = String(Math.floor(remainingSec / 60)).padStart(2, '0');

      const s = String(remainingSec % 60).padStart(2, '0');

      if (timerEl) timerEl.textContent = `Hết hạn sau: ${m}:${s}`;

      if (remainingSec <= 0) {

        clearInterval(this.timerInterval);

        this.resetInviteButton();

      }

    }, 1000);

  },



  resetInviteButton() {

    const wrap = document.getElementById('teleport-invite-action-wrap');

    if (!wrap) return;

    wrap.innerHTML = `

      <button type="button" class="teleport-btn-ticket" onclick="Teleport.createFriendCode()">

        <span>🎟️</span> <span>Tạo mã</span>

      </button>

    `;

  },



  copyFriendCode(code) {

    const c = code || this.activeCode;

    if (!c) return;

    if (navigator.clipboard) {

      navigator.clipboard.writeText(c).then(() => {

        App.showToast(`📋 Đã sao chép mã ${c} vào bộ nhớ tạm!`);

      }).catch(() => {});

    }

  },



  async redeemFriendCode() {

    const input = document.getElementById('teleport-friend-code-input');

    const code = (input && input.value.trim().toUpperCase()) || '';



    if (!code) {

      App.showToast("⚠️ Vui lòng nhập mã bạn bè đưa!");

      if (input) input.focus();

      return;

    }



    const user = JSON.parse(localStorage.getItem('steam_user') || 'null');

    const steamId = user ? user.steamId : '76561199175571899';



    App.showToast(`⏳ Đang xác thực mã ${code} và gửi lệnh dịch chuyển...`);



    try {

      const res = await fetch('/api/server/teleport/friend/redeem', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ code, steam_id: steamId })

      });

      const data = await res.json();

      if (data.ok || data.success) {

        App.showToast(data.message || `🎉 Đã gửi lệnh dịch chuyển tới bạn bè!`);

        if (input) input.value = '';

        this.onCodeInput('');

      } else {

        App.showToast(`⚠️ ${data.message || 'Mã không hợp lệ hoặc đã hết hạn!'}`);

      }

    } catch (e) {

      App.showToast(`⚠️ Lỗi kết nối máy chủ!`);

    }

  }

};





// 6. NHIỆM VỤ (ISLEPILOT REAL QUESTS API)

const Quests = {

  quests: [],

  activeFilter: 'all',



  async render() {

    const container = document.getElementById('quests-container');

    if (!container) return;



    container.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-muted);">Đang tải danh sách nhiệm vụ từ máy chủ IslePilot...</div>';



    const user = JSON.parse(localStorage.getItem('steam_user') || 'null');

    const steamId = user ? user.steamId : '76561199259679997';



    try {

      const res = await fetch(`/api/server/quests?steam_id=${steamId}`);

      const data = await res.json();

      this.quests = data.quests || [];

    } catch (e) {

      console.warn("Lỗi tải nhiệm vụ:", e);

      this.quests = [];

    }



    this.displayQuests();

  },



  displayQuests() {
    const container = document.getElementById('quests-container');
    if (!container) return;

    // Tự động ẩn các nhiệm vụ đã nhận thưởng để không làm rối giao diện
    let list = (this.quests || []).filter(q => !q.claimedAt);

    if (this.activeFilter === 'daily') {
      list = list.filter(q => q.period === 'daily');
    } else if (this.activeFilter === 'weekly') {
      list = list.filter(q => q.period === 'weekly');
    }

    if (list.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align: center; padding: 45px 20px; color: var(--text-muted); background: rgba(7, 19, 14, 0.75); border: 1px dashed rgba(255, 42, 133, 0.35); border-radius: 12px;">
          <div style="font-size: 2.2rem; margin-bottom: 10px;">🎉</div>
          <div style="font-size: 1.1rem; font-weight: 700; color: #fff;">Đã hoàn thành và nhận hết nhiệm vụ!</div>
          <div style="margin-top: 6px; font-size: 0.88rem; color: #9ca3af;">Các nhiệm vụ đã nhận thưởng đã được cất đi. Hãy quay lại vào đợt làm mới tiếp theo nhé!</div>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(q => {
      const rewardCoins = (q.rewards && q.rewards[0]) ? q.rewards[0].amount : 100;
      const isDone = q.completedAt !== null || (q.conditions && q.conditions[0] && q.conditions[0].done);
      const isClaimed = q.claimedAt !== null;

      let progressText = '';
      let progressPct = 0;
      if (q.conditions && q.conditions[0] && q.conditions[0].target) {
        const cur = q.progress || 0;
        const tgt = q.conditions[0].target;
        progressPct = Math.min(100, Math.round((cur / tgt) * 100));
        progressText = `${cur} / ${tgt} (${q.conditions[0].label || ''})`;
      } else {
        progressPct = isDone ? 100 : Math.min(100, (q.progress || 0) * 50);
        progressText = isDone ? 'Đã hoàn thành' : `${q.progress || 0} lần`;
      }

      const qNameSafe = (q.name || '').replace(/'/g, "\\'");
      const qDescSafe = q.description || '';

      return `
        <div class="card" id="quest-card-${q.id}" style="padding: 20px; margin-bottom: 14px; border: 1px solid var(--border-color); background: rgba(7, 19, 14, 0.75); transition: opacity 0.3s ease, transform 0.3s ease;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span class="diet-badge ${q.period === 'weekly' ? 'diet-carnivore' : 'diet-herbivore'}" style="font-size: 0.72rem;">
                  ${q.period === 'weekly' ? '📅 Hàng Tuần' : '⭐ Hàng Ngày'}
                </span>
                <h3 style="color: #fff; font-size: 1.05rem; font-weight: 700; text-transform: capitalize;">${q.name}</h3>
              </div>
              <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 4px;">${qDescSafe}</p>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 0.75rem; color: var(--text-muted);">Phần thưởng:</span>
              <div style="font-weight: 800; color: #fbbf24; font-size: 1.1rem;">+${rewardCoins} Xu</div>
            </div>
          </div>

          <div style="margin-top: 14px;">
            <div style="display: flex; justify-content: space-between; font-size: 0.78rem; color: var(--text-muted); margin-bottom: 6px;">
              <span>Tiến độ: <b style="color: #d1d5db;">${progressText}</b></span>
              <span style="color: var(--accent); font-weight: 700;">${progressPct}%</span>
            </div>
            <div class="stat-bar" style="height: 8px; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden;">
              <div class="stat-fill" style="width: ${progressPct}%; background: ${isDone ? 'var(--accent)' : '#3b82f6'};"></div>
            </div>
          </div>

          <div style="margin-top: 14px; display: flex; justify-content: flex-end;">
            ${isDone ? `
              <button class="btn-primary" style="padding: 7px 18px; font-size: 0.85rem; font-weight: 700;" onclick="Quests.claimReward('${q.id}', '${q.progressId || ''}', ${rewardCoins}, '${qNameSafe}', this)">
                🎁 Nhận ${rewardCoins} Xu
              </button>
            ` : `
              <span style="color: #9ca3af; font-size: 0.82rem;">Đang thực hiện trong game</span>
            `}
          </div>
        </div>
      `;
    }).join('');
  },

  filter(period, btn) {
    this.activeFilter = period;
    document.querySelectorAll('#quests-filters button').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    this.displayQuests();
  },

  async claimReward(questId, progressId, amount, questName, btnEl) {
    if (btnEl) {
      btnEl.disabled = true;
      btnEl.innerHTML = '⏳ Đang nhận...';
    }

    const user = JSON.parse(localStorage.getItem('steam_user') || 'null');
    const steamId = user ? user.steamId : '';

    if (!steamId) {
      App.showToast('Vui lòng đăng nhập Steam để nhận thưởng!', 'warning');
      if (btnEl) {
        btnEl.disabled = false;
        btnEl.innerHTML = `🎁 Nhận ${amount} Xu`;
      }
      return;
    }

    try {
      const res = await fetch('/api/server/quests/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          steam_id: steamId,
          quest_id: questId,
          progress_id: progressId,
          amount: amount,
          quest_name: questName
        })
      });

      const data = await res.json();
      if (res.ok && (data.ok || data.success)) {
        App.showToast(`🎉 Chúc mừng! Bạn đã nhận thành công +${amount} Xu vào tài khoản!`, 'success');

        // Cập nhật số dư xu trên giao diện
        if (data.balance !== undefined && data.balance !== null) {
          App.updateUserBalanceUI(data.balance);
          if (user) {
            user.balance = data.balance;
            localStorage.setItem('steam_user', JSON.stringify(user));
          }
        } else if (App.refreshBalance) {
          App.refreshBalance();
        }

        // Đánh dấu nhiệm vụ này đã nhận thưởng
        const q = this.quests.find(item => item.id === questId);
        if (q) {
          q.claimedAt = new Date().toISOString();
        }

        // Hiệu ứng biến mất mượt mà của thẻ nhiệm vụ
        const card = document.getElementById(`quest-card-${questId}`);
        if (card) {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.95)';
          setTimeout(() => {
            this.displayQuests();
          }, 350);
        } else {
          this.displayQuests();
        }
      } else {
        App.showToast(data.message || 'Không thể nhận thưởng, vui lòng thử lại sau!', 'error');
        if (btnEl) {
          btnEl.disabled = false;
          btnEl.innerHTML = `🎁 Nhận ${amount} Xu`;
        }
      }
    } catch (e) {
      console.error('Lỗi nhận thưởng:', e);
      App.showToast('Lỗi kết nối khi nhận thưởng, vui lòng thử lại!', 'error');
      if (btnEl) {
        btnEl.disabled = false;
        btnEl.innerHTML = `🎁 Nhận ${amount} Xu`;
      }
    }
  }
};



// 7. MUA DINO (ISLEPILOT REAL SHOP DINOS API)

const BuyDino = {

  dinos: [],



  async render() {

    const container = document.getElementById('buydino-container');

    if (!container) return;



    container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">Đang tải danh sách khủng long từ máy chủ IslePilot...</div>';



    try {

      const res = await fetch('/api/server/shop/dinos');

      const data = await res.json();

      this.dinos = data.dinos || [];

    } catch (e) {

      this.dinos = [];

    }



    if (this.dinos.length === 0) {

      container.innerHTML = '<div class="card" style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">Hiện không có gói khủng long nào mở bán trên server.</div>';

      return;

    }



    container.innerHTML = this.dinos.map(d => {

      const growthPct = Math.round((d.growth || 1.0) * 100);

      const isCarno = Garage.isCarnivore(d.species);



      return `

        <div class="dino-card" style="border: 1px solid rgba(245, 158, 11, 0.4); background: rgba(7, 19, 14, 0.85);">

          <div class="dino-card-banner">

            <img src="${Garage.getDinoImageUrl(d.species)}" alt="${d.species}" class="dino-img-render">

            <span class="growth-badge">${growthPct}% Tăng Trưởng</span>

            ${d.isPrimeElder ? '<span class="growth-badge" style="right: auto; left: 10px; background: rgba(245, 158, 11, 0.25); border-color: #f59e0b; color: #fbbf24;">👑 Prime Elder</span>' : ''}

          </div>

          <div class="dino-card-body">

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">

              <h3 style="color: #fff; font-size: 1.15rem; font-weight: 800;">${d.species}</h3>

              <span class="diet-badge ${isCarno ? 'diet-carnivore' : 'diet-herbivore'}">${isCarno ? '🍖 Ăn Thịt' : '🌿 Ăn Cỏ'}</span>

            </div>

            

            <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 10px;">

              Giới tính: <b>${d.gender === 'Female' ? 'Cái' : d.gender === 'Male' ? 'Đực' : 'Ngẫu Nhiên'}</b> | Độ tuổi: <b style="color: var(--accent);">${growthPct}%</b>

            </div>



            ${d.mutations && d.mutations.length > 0 ? `

              <div class="dino-mutations-box" style="margin-bottom: 12px;">

                <div class="mutations-header">🧬 Đột Biến Sẵn Có (${d.mutations.length}):</div>

                <div class="mutations-list">

                  ${d.mutations.map(m => `<div class="mutation-tag"><span>🧬 <b>${m}</b></span></div>`).join('')}

                </div>

              </div>

            ` : ''}



            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 12px; border-top: 1px solid var(--border-color);">

              <div>

                <span style="font-size: 0.72rem; color: var(--text-muted);">Giá bán:</span>

                <div style="font-weight: 800; color: #fbbf24; font-size: 1.15rem;">${d.price ? d.price.toLocaleString() : '1,000'} Xu</div>

              </div>

              <button class="btn-primary" style="padding: 7px 16px; font-size: 0.85rem;" onclick="BuyDino.actionBuy('${d.id}', '${d.species}', ${d.price || 1000})">

                🛒 Mua Vào Gara

              </button>

            </div>

          </div>

        </div>

      `;

    }).join('');

  },



  async actionBuy(id, species, price) {

    const user = JSON.parse(localStorage.getItem('steam_user') || 'null');

    const steamId = user ? user.steamId : '76561199259679997';



    try {

      const res = await fetch('/api/server/shop/buy-dino', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ dino_pack_id: id, steam_id: steamId })

      });

      const data = await res.json();

      if (data.success || data.ok) {

        App.showToast("Thành công");

        setTimeout(() => {

          App.switchTab('garage');

        }, 1000);

      } else {

        App.showToast("Thất bại");

      }

    } catch (e) {

      App.showToast("Thất bại");

    }

  }

};



// 8. THẢ XÁC (CARCASS - GIỐNG 100% 3MGAMING.ISLEPILOT.EU/CARCASS)

const Carcass = {

  offers: [],

  cooldownEnd: 0,

  cooldownTimer: null,



  async render() {

    const container = document.getElementById('carcass-grid-container');

    const hintEl = document.getElementById('carcass-auth-hint');



    const user = JSON.parse(localStorage.getItem('steam_user') || 'null');

    if (hintEl) {

      if (user) {

        hintEl.innerHTML = `Đã đăng nhập: <b style="color: #00f076;">${user.personaName || user.steamId}</b>. Bấm <b>"Mua"</b> để mở trang thả xác IslePilot và nhận xác rơi trước mặt bạn trong game.`;

      } else {

        hintEl.innerHTML = `Đăng nhập bằng Steam để mua. <a href="/api/player/steam/login" style="color: #00f076; text-decoration: underline; margin-left: 6px;">Đăng nhập ngay</a>`;

      }

    }



    if (!container) return;



    container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">⏳ Đang đồng bộ danh sách xác từ máy chủ...</div>';



    try {

      const res = await fetch('/api/server/carcass/offers');

      const data = await res.json();

      this.offers = data.offers || [];

    } catch (e) {

      console.warn("Lỗi tải carcass offers:", e);

      this.offers = [];

    }



    if (this.offers.length === 0) {

      this.offers = [

        {

          id: "omv572un0",

          name: "Carcass",

          price_display: "$ 0",

          species: "Tenontosaurus",

          image: "https://islepilot.eu/cdn/dino-art/render/Tenontosaurus.webp",

          description: "Xác tươi, cho thịt · hợp với chế độ ăn của bạn · kích cỡ 100%"

        },

        {

          id: "omv6uqesm",

          name: "triceraptor",

          price_display: "$ 0",

          species: "Triceratops",

          image: "https://islepilot.eu/cdn/dino-art/render/Triceratops.webp",

          description: "Xác tươi, cho thịt · Triceratops · kích cỡ 100%"

        },

        {

          id: "omv6viaxj",

          name: "stegosarus",

          price_display: "$ 0",

          species: "Stegosaurus",

          image: "https://islepilot.eu/cdn/dino-art/render/Stegosaurus.webp",

          description: "Xác tươi, cho thịt · Stegosaurus · kích cỡ 100%"

        }

      ];

    }



    this.displayCards();

  },



  displayCards() {

    const container = document.getElementById('carcass-grid-container');

    if (!container) return;



    const isCooldown = Date.now() < this.cooldownEnd;

    const remainingSec = Math.max(0, Math.ceil((this.cooldownEnd - Date.now()) / 1000));



    container.innerHTML = this.offers.map((item) => {

      const dinoImg = item.image || (window.Garage ? Garage.getDinoImageUrl(item.species) : `https://islepilot.eu/cdn/dino-art/render/${item.species || 'Tyrannosaurus'}.webp`);



      return `

        <div class="carcass-card">

          <div class="carcass-banner">

            <img src="${dinoImg}" alt="${item.name}" class="carcass-img-render" onerror="this.src='https://islepilot.eu/cdn/dino-art/render/Tyrannosaurus.webp'">

            <span class="growth-badge" style="background: rgba(16, 185, 129, 0.2); border-color: #10b981; color: #10b981;">

              🥩 100% Kích Cỡ

            </span>

            <span class="growth-badge" style="right: auto; left: 10px; background: rgba(0, 240, 118, 0.15); border-color: var(--accent); color: var(--accent);">

              ${item.species || 'Evrima'}

            </span>

          </div>



          <div class="carcass-body">

            <div class="carcass-card-header">

              <span class="carcass-card-name">${item.name}</span>

              <span class="carcass-card-price">${item.price_display || '$ 0'}</span>

            </div>



            <p class="carcass-card-desc">

              ${item.description}

            </p>



            <div style="margin-top: auto; padding-top: 8px;">

              <button id="carcass-btn-${item.id}" class="carcass-btn-buy" ${isCooldown ? 'disabled' : ''} onclick="Carcass.actionDrop('${item.id}', '${item.name}')">

                ${isCooldown ? `Chờ (${remainingSec}s)` : 'Mua'}

              </button>

            </div>

          </div>

        </div>

      `;

    }).join('');



    if (isCooldown && !this.cooldownTimer) {

      this.startCooldownInterval();

    }

  },



  startCooldownInterval() {

    if (this.cooldownTimer) clearInterval(this.cooldownTimer);

    this.cooldownTimer = setInterval(() => {

      const remainingSec = Math.max(0, Math.ceil((this.cooldownEnd - Date.now()) / 1000));

      document.querySelectorAll('.carcass-btn-buy').forEach(btn => {

        if (remainingSec > 0) {

          btn.disabled = true;

          btn.textContent = `Chờ (${remainingSec}s)`;

        } else {

          btn.disabled = false;

          btn.textContent = 'Mua';

        }

      });

      if (remainingSec <= 0) {

        clearInterval(this.cooldownTimer);

        this.cooldownTimer = null;

      }

    }, 1000);

  },



  actionDrop(offerId, name) {
    const displayName = name || 'Carcass';
    App.showToast(`🥩 Đang mở trang thả xác IslePilot để nhận ${displayName}...`);
    window.open('https://3mgaming.islepilot.eu/carcass', '_blank');
  }
};

