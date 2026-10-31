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

    if (item.id === 'skin_hac_bang_doc_quyen' || name.includes('hắc băng') || name.includes('hac bang') || name.includes('độc quyền')) {
      return '/assets/images/skin_hac_bang_doc_quyen.jpg';
    }

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

      list = list.filter(s => s.allSpecies || s.universal || (s.species || '').toLowerCase().includes(this.activeFilter.toLowerCase()));

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

              ${(item.allSpecies || item.universal) ? `
                <button class="btn-primary" style="flex: 1.25; padding: 8px 10px; font-size: 0.8rem; background: linear-gradient(135deg, #00d9ff, #0284c7); border: 1px solid #38bdf8; color: #041019; font-weight: 800; cursor: pointer;" onclick="GarageSkins.applySkin('${item.id}', '${item.name}')">
                  ⚡ Áp Dụng Ngay (Mọi Dino)
                </button>
              ` : isOwned ? `

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

        App.showToast(data.message || "Thành công");

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

        App.showToast(data.message || "⚡ Đã áp dụng Skin vào khủng long trong Server thành công!");

      } else {

        App.showToast(data.message || data.error || "Thất bại");

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

  distance: 5.4,

  distMin: 2.8,

  distMax: 9.5,

  _targetLookAtY: 0.95,

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



  loadExclusiveHacBang() {
    this._isUniversalSkin = true;
    this.pattern = 1;
    this.variation = 0;
    this.theme = 0;
    this.palette = {
      body: '#080B12',
      markings: '#00D9FF',
      underbelly: '#EEF8FF',
      flank: '#101C2E',
      detail: '#6889A6',
      display: '#00E5FF',
      eyes: '#00FFFF',
      claws: '#00D9FF',
      teeth: '#EEF8FF',
      mouth: '#103A52'
    };
    const inPat = document.getElementById('skineditor-input-pattern');
    if (inPat) inPat.value = 1;
    this.renderZones();
    this.updatePreview();
    this.queueTextureUpdate();
    if (!this.isAutoRotating) {
      this.toggleAutoRotate(true);
    }
    App.showToast(`👑 Đã nạp Màu Độc Quyền Hắc Băng Lôi Điện cho ${this.species} (Hỗ trợ mọi loài Dino)!`);
  },

  loadSkinObject(item) {

    if (!item) return;

    const isUniv = Boolean(item.allSpecies || item.universal || item.id === 'skin_hac_bang_doc_quyen' || (item.species || '').toLowerCase().includes('tất cả'));
    this._isUniversalSkin = isUniv;

    if (isUniv) {
      if (!this.species || this.species.toLowerCase().includes('tất cả') || this.species === 'All') {
        this.species = 'Diabloceratops';
      }
    } else {
      this.species = item.species || 'Tyrannosaurus';
    }

    if (item.pattern !== undefined && !isNaN(parseInt(item.pattern, 10))) {
      this.pattern = parseInt(item.pattern, 10);
      const inPat = document.getElementById('skineditor-input-pattern');
      if (inPat) inPat.value = this.pattern;
    }

    this.palette = { ...(item.palette || this.defaults[this.species] || this.defaults.Tyrannosaurus) };
    if (this.palette.male_display && !this.palette.display) {
      this.palette.display = this.palette.male_display;
    }

    const badgeSp = document.getElementById('skineditor-badge-species');

    if (badgeSp) badgeSp.textContent = isUniv ? `${this.species} (Mọi Loài)` : this.species;

    const selectSp = document.getElementById('skineditor-select-species');

    if (selectSp) selectSp.value = this.species;



    this.renderZones();

    this.updatePreview();

    this.loadThreeModel(this.species);

    if (!this.isAutoRotating) {

      this.toggleAutoRotate(true);

    }

    App.showToast(`👑 Đang hiển thị 3D Skin: "${item.name}" (Có thể đổi sang bất kỳ loài Dino nào để xem & áp dụng)!`);

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

      const targetY = (this._targetLookAtY !== undefined) ? this._targetLookAtY : 0.95;

      camera.position.set(0, targetY + 0.25, this.distance);

      camera.lookAt(0, targetY, 0);



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

    const targetY = (this._targetLookAtY !== undefined) ? this._targetLookAtY : 0.95;

    this.threeCamera.position.set(0, targetY + 0.25, this.distance);

    this.threeCamera.lookAt(0, targetY, 0);

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



      // Chuẩn hóa tỷ lệ khủng long cân đối màn hình theo 3 chiều (chiều cao, chiều dài, bề ngang)

      const maxBound = Math.max(size.y, size.z * 0.45, size.x * 0.75, 1.0);

      const baseScale = (this.sex === 'female' ? 2.3 : 2.45) / maxBound;

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



      this._targetLookAtY = (size.y * baseScale * growthFactor) * 0.45;

      this.distance = 5.4;

      this.distMin = 2.8;

      this.distMax = 9.5;



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

    const zoomPct = Math.round((5.4 / this.distance) * 100);

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

    this.distance = 5.4;

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

      const size = this._rawModelSize || { x: 2, y: 3, z: 8 };

      const maxBound = Math.max(size.y, size.z * 0.45, size.x * 0.75, 1.0);

      const baseScale = (this.sex === 'female' ? 2.3 : 2.45) / maxBound;

      const growthFactor = 0.5 + 0.5 * this.growth;

      this.threeModel.scale.setScalar(baseScale * growthFactor);

      this._targetLookAtY = (size.y * baseScale * growthFactor) * 0.45;

      this.renderScene();

    }

  },



  setSpecies(sp) {

    this._userInteractedSpecies = true;

    this.species = sp;

    if (!this._isUniversalSkin) {
      const def = this.defaults[sp] || this.defaults.Tyrannosaurus;

      for (const key of Object.keys(def)) {

        if (!this.lockedZones[key]) {

          this.palette[key] = def[key];

        }

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

    if (this.threeModel && this._rawModelSize) {

      const size = this._rawModelSize;

      const maxBound = Math.max(size.y, size.z * 0.45, size.x * 0.75, 1.0);

      const baseScale = (this.sex === 'female' ? 2.3 : 2.45) / maxBound;

      const growthFactor = 0.5 + 0.5 * this.growth;

      this.threeModel.scale.setScalar(baseScale * growthFactor);

      this._targetLookAtY = (size.y * baseScale * growthFactor) * 0.45;

      this.renderScene();

    }

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



    const exclusiveBanner = `
      <div style="grid-column: 1 / -1; background: linear-gradient(135deg, rgba(8,11,18,0.96), rgba(16,28,46,0.95)); border: 1px solid rgba(0, 217, 255, 0.55); border-radius: 10px; padding: 10px 12px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; gap: 10px; box-shadow: 0 6px 20px rgba(0, 217, 255, 0.15);">
        <div style="display: flex; align-items: center; gap: 10px;">
          <img src="/assets/images/skin_hac_bang_doc_quyen.jpg" alt="Màu Độc Quyền" style="width: 48px; height: 48px; object-fit: cover; border-radius: 8px; border: 1px solid #00D9FF;">
          <div>
            <div style="font-size: 0.85rem; font-weight: 800; color: #00D9FF;">👑 Màu Độc Quyền: Hắc Băng Lôi Điện (Mọi Dino)</div>
            <div style="font-size: 0.72rem; color: #94a3b8; display: flex; gap: 6px; align-items: center; margin-top: 3px;">
              <span style="display:inline-flex;align-items:center;gap:3px;"><i style="width:8px;height:8px;border-radius:50%;background:#080B12;border:1px solid #fff;display:inline-block;"></i>Đen huyền</span>
              <span style="display:inline-flex;align-items:center;gap:3px;"><i style="width:8px;height:8px;border-radius:50%;background:#00D9FF;display:inline-block;"></i>Xanh ngọc</span>
              <span style="display:inline-flex;align-items:center;gap:3px;"><i style="width:8px;height:8px;border-radius:50%;background:#EEF8FF;display:inline-block;"></i>Trắng băng</span>
              <span style="display:inline-flex;align-items:center;gap:3px;"><i style="width:8px;height:8px;border-radius:50%;background:#6889A6;display:inline-block;"></i>Xám xanh</span>
            </div>
          </div>
        </div>
        <button type="button" class="btn-primary" style="padding: 7px 12px; font-size: 0.78rem; font-weight: 800; background: linear-gradient(135deg, #00D9FF, #0284C7); color: #041019; border: none; border-radius: 6px; white-space: nowrap; cursor: pointer;" onclick="SkinEditor.loadExclusiveHacBang()">
          ⚡ Nạp Màu Độc Quyền
        </button>
      </div>
    `;

    container.innerHTML = exclusiveBanner + zones.map(key => {

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

  cooldownInterval: null,

  getCooldownRemaining() {
    const until = parseInt(localStorage.getItem('teleport_cooldown_until') || '0', 10);
    const now = Date.now();
    if (until > now) {
      return Math.ceil((until - now) / 1000);
    }
    return 0;
  },

  startCooldown(seconds = 60) {
    const until = Date.now() + (seconds * 1000);
    localStorage.setItem('teleport_cooldown_until', until);
    this.updateCooldownUI();
  },

  updateCooldownUI() {
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
      this.cooldownInterval = null;
    }

    const banner = document.getElementById('teleport-cooldown-banner');
    const timerText = document.getElementById('teleport-cooldown-timer-text');

    const tick = () => {
      const remaining = this.getCooldownRemaining();
      const buttons = document.querySelectorAll('.teleport-btn-action');

      if (remaining > 0) {
        if (banner) {
          banner.style.display = 'flex';
        }
        if (timerText) {
          timerText.textContent = `${remaining}s`;
        }

        buttons.forEach(btn => {
          btn.disabled = true;
          btn.style.opacity = '0.6';
          btn.style.cursor = 'not-allowed';
          btn.innerHTML = `⏳ Hồi chiêu (${remaining}s)`;
        });
      } else {
        if (banner) {
          banner.style.display = 'none';
        }
        buttons.forEach(btn => {
          btn.disabled = false;
          btn.style.opacity = '1';
          btn.style.cursor = 'pointer';
          btn.innerHTML = `Dịch chuyển`;
        });

        if (this.cooldownInterval) {
          clearInterval(this.cooldownInterval);
          this.cooldownInterval = null;
        }
      }
    };

    tick();
    this.cooldownInterval = setInterval(tick, 1000);
  },



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

    this.updateCooldownUI();

  },



  async actionTeleport(locationId, locationName) {

    const remaining = this.getCooldownRemaining();
    if (remaining > 0) {
      const msg = `⏳ Dịch chuyển đang hồi chiêu! Vui lòng đợi ${remaining} giây nữa.`;
      if (window.App && window.App.showToast) App.showToast(msg);
      else alert(msg);
      return;
    }

    const user = JSON.parse(localStorage.getItem('steam_user') || 'null');

    const steamId = user ? user.steamId : '76561199175571899';

    if (window.App && window.App.showToast) {
      App.showToast(`🚀 Đang gửi lệnh dịch chuyển tới ${locationName}...`);
    }

    try {

      const res = await fetch('/api/server/teleport', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ locationId, steam_id: steamId })

      });

      const data = await res.json();

      if (data.success || data.ok) {

        const succMsg = data.message || `🚀 Đã gửi lệnh dịch chuyển tới ${locationName} thành công! Hãy đứng yên 3-5s trong game.`;
        if (window.App && window.App.showToast) App.showToast(succMsg);
        else alert(succMsg);

        // BẮT ĐẦU BỘ ĐẾM 60S HỒI CHIÊU
        this.startCooldown(data.cooldown_seconds || 60);

        if (window.App && typeof App.refreshBalance === 'function') {
          setTimeout(() => App.refreshBalance(), 1000);
        }

      } else {

        const errMsg = data.error || data.message || "Thất bại";
        if (window.App && window.App.showToast) App.showToast(errMsg);
        else alert(errMsg);

        if (data.cooldown_remaining) {
          this.startCooldown(data.cooldown_remaining);
        }

      }

    } catch (e) {

      App.showToast(`Lỗi kết nối: ${e.message}`);

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

    container.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-muted);"><i class="fas fa-spinner fa-spin" style="margin-right: 8px;"></i> Đang tải danh sách nhiệm vụ từ máy chủ IslePilot...</div>';

    const user = JSON.parse(localStorage.getItem('steam_user') || 'null');
    const steamId = user ? user.steamId : '';

    try {
      const url = steamId ? `/api/server/quests?steam_id=${encodeURIComponent(steamId)}` : '/api/server/quests';
      const res = await fetch(url);
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

    const user = JSON.parse(localStorage.getItem('steam_user') || 'null');
    const isLoggedIn = !!(user && user.steamId);

    // Luôn hiển thị đầy đủ danh sách nhiệm vụ (không lọc bỏ nhiệm vụ đã nhận thưởng)
    let list = this.quests || [];

    if (this.activeFilter === 'daily') {
      list = list.filter(q => q.period === 'daily');
    } else if (this.activeFilter === 'weekly') {
      list = list.filter(q => q.period === 'weekly');
    }

    if (list.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align: center; padding: 45px 20px; color: var(--text-muted); background: rgba(7, 19, 14, 0.75); border: 1px dashed rgba(255, 42, 133, 0.35); border-radius: 12px;">
          <div style="font-size: 2.2rem; margin-bottom: 10px;">📜</div>
          <div style="font-size: 1.1rem; font-weight: 700; color: #fff;">Chưa có nhiệm vụ nào!</div>
          <div style="margin-top: 6px; font-size: 0.88rem; color: #9ca3af;">Hiện tại hệ thống chưa phát hành nhiệm vụ trong mục này. Vui lòng quay lại sau!</div>
        </div>
      `;
      return;
    }

    let loginBannerHtml = '';
    if (!isLoggedIn) {
      loginBannerHtml = `
        <div style="margin-bottom: 16px; padding: 12px 18px; background: rgba(59, 130, 246, 0.12); border: 1px solid rgba(59, 130, 246, 0.35); border-radius: 10px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
          <div style="font-size: 0.88rem; color: #93c5fd; display: flex; align-items: center; gap: 8px;">
            <i class="fab fa-steam" style="font-size: 1.2rem;"></i>
            <span>Đang xem danh sách nhiệm vụ của Server. Hãy <b>đăng nhập Steam</b> để đồng bộ tiến độ cá nhân và nhận Xu thưởng!</span>
          </div>
          <a href="/api/player/steam/login?redirect=%2F" class="btn-primary" style="font-size: 0.8rem; padding: 6px 14px; text-decoration: none; border-radius: 6px;">
            Đăng nhập Steam
          </a>
        </div>
      `;
    }

    // Sắp xếp ưu tiên: Nhiệm vụ xong chờ nhận -> Nhiệm vụ đang làm -> Nhiệm vụ đã nhận thưởng
    const sortedList = [...list].sort((a, b) => {
      const aDone = a.completedAt !== null || (a.conditions && a.conditions[0] && a.conditions[0].done);
      const bDone = b.completedAt !== null || (b.conditions && b.conditions[0] && b.conditions[0].done);
      const aClaimed = !!a.claimedAt;
      const bClaimed = !!b.claimedAt;

      if (aDone && !aClaimed && (!bDone || bClaimed)) return -1;
      if (bDone && !bClaimed && (!aDone || aClaimed)) return 1;
      if (!aClaimed && bClaimed) return -1;
      if (aClaimed && !bClaimed) return 1;
      return 0;
    });

    const cardsHtml = sortedList.map(q => {
      const rewardCoins = (q.rewards && q.rewards[0]) ? q.rewards[0].amount : 100;
      const isDone = q.completedAt !== null || (q.conditions && q.conditions[0] && q.conditions[0].done);
      const isClaimed = !!q.claimedAt;

      let progressText = '';
      let progressPct = 0;
      if (q.conditions && q.conditions[0] && q.conditions[0].target) {
        const cur = q.progress || 0;
        const tgt = q.conditions[0].target;
        progressPct = isDone ? 100 : Math.min(100, Math.round((cur / tgt) * 100));
        progressText = `${cur} / ${tgt} (${q.conditions[0].label || ''})`;
      } else {
        progressPct = isDone ? 100 : Math.min(100, (q.progress || 0) * 50);
        progressText = isDone ? 'Đã hoàn thành' : `${q.progress || 0} lần`;
      }

      const qNameSafe = (q.name || '').replace(/'/g, "\\'");
      const qDescSafe = q.description || '';

      let cardBorder = 'border: 1px solid var(--border-color);';
      let cardBg = 'background: rgba(7, 19, 14, 0.75);';
      let cardOpacity = 'opacity: 1;';

      if (isClaimed) {
        cardBorder = 'border: 1px solid rgba(34, 197, 94, 0.35);';
        cardBg = 'background: rgba(6, 26, 16, 0.65);';
        cardOpacity = 'opacity: 0.88;';
      } else if (isDone) {
        cardBorder = 'border: 1px solid rgba(234, 179, 8, 0.65); box-shadow: 0 0 15px rgba(234, 179, 8, 0.15);';
        cardBg = 'background: rgba(20, 24, 10, 0.8);';
      }

      return `
        <div class="card" id="quest-card-${q.id}" style="padding: 20px; margin-bottom: 14px; ${cardBorder} ${cardBg} ${cardOpacity} transition: all 0.3s ease; border-radius: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span class="diet-badge ${q.period === 'weekly' ? 'diet-carnivore' : 'diet-herbivore'}" style="font-size: 0.72rem;">
                  ${q.period === 'weekly' ? '📅 Hàng Tuần' : '⭐ Hàng Ngày'}
                </span>
                <h3 style="color: #fff; font-size: 1.05rem; font-weight: 700; text-transform: capitalize;">${q.name}</h3>
                ${isClaimed ? `
                  <span style="background: rgba(34, 197, 94, 0.2); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.4); font-size: 0.72rem; padding: 2px 8px; border-radius: 4px; font-weight: 700;">
                    ✔ Đã nhận
                  </span>
                ` : ''}
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
              <span>Tiến độ: <b style="color: ${isDone ? '#4ade80' : '#d1d5db'};">${isDone ? 'Đã hoàn thành' : progressText}</b></span>
              <span style="color: ${isDone ? '#4ade80' : 'var(--accent)'}; font-weight: 700;">${progressPct}%</span>
            </div>
            <div class="stat-bar" style="height: 8px; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden;">
              <div class="stat-fill" style="width: ${progressPct}%; background: ${isClaimed ? '#22c55e' : (isDone ? '#eab308' : '#3b82f6')};"></div>
            </div>
          </div>

          <div style="margin-top: 14px; display: flex; justify-content: flex-end; align-items: center; gap: 10px;">
            ${isClaimed ? `
              <span style="color: #4ade80; font-size: 0.85rem; font-weight: 700; display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; background: rgba(34, 197, 94, 0.12); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 6px;">
                ✔ Đã nhận thưởng (+${rewardCoins} Xu)
              </span>
            ` : (isDone ? `
              <button class="btn-primary" style="padding: 8px 20px; font-size: 0.88rem; font-weight: 700; background: linear-gradient(135deg, #eab308, #ca8a04); border: none; cursor: pointer; box-shadow: 0 2px 10px rgba(234, 179, 8, 0.3);" onclick="Quests.claimReward('${q.id}', '${q.progressId || ''}', ${rewardCoins}, '${qNameSafe}', this)">
                🎁 Nhận ${rewardCoins} Xu
              </button>
            ` : `
              <span style="color: #9ca3af; font-size: 0.82rem; font-style: italic;">
                ⏳ Đang thực hiện trong game
              </span>
            `)}
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = loginBannerHtml + cardsHtml;
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

        if (data.balance !== undefined && data.balance !== null) {
          App.updateUserBalanceUI(data.balance);
          if (user) {
            user.balance = data.balance;
            localStorage.setItem('steam_user', JSON.stringify(user));
          }
        } else if (App.refreshBalance) {
          App.refreshBalance();
        }

        const q = this.quests.find(item => item.id === questId);
        if (q) {
          q.claimedAt = new Date().toISOString();
        }
        this.displayQuests();
      } else {
        App.showToast(data.message || data.error || 'Nhận thưởng thất bại. Hãy thử lại!', 'error');
        if (btnEl) {
          btnEl.disabled = false;
          btnEl.innerHTML = `🎁 Nhận ${amount} Xu`;
        }
      }
    } catch (e) {
      console.warn("Lỗi nhận thưởng:", e);
      App.showToast('Lỗi kết nối máy chủ khi nhận thưởng!', 'error');
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
  currentCategory: 'all',
  cooldownEnd: 0,
  cooldownTimer: null,

  switchCategory(category, btn) {
    this.currentCategory = category;
    document.querySelectorAll('.carcass-diet-tabs .map-filter-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    this.displayCards();
  },

  getStoredCooldown(steamId) {
    try {
      const keys = [];
      if (steamId) keys.push('carcass_cooldown_' + steamId);
      keys.push('carcass_cooldown_end');
      for (const k of keys) {
        const val = parseInt(localStorage.getItem(k) || '0', 10);
        if (val && val > Date.now()) {
          return val;
        }
      }
    } catch (e) {}
    return 0;
  },

  setStoredCooldown(steamId, endTimestamp) {
    try {
      if (steamId) {
        localStorage.setItem('carcass_cooldown_' + steamId, endTimestamp);
      }
      localStorage.setItem('carcass_cooldown_end', endTimestamp);
    } catch (e) {}
  },

  clearStoredCooldown(steamId) {
    try {
      if (steamId) {
        localStorage.removeItem('carcass_cooldown_' + steamId);
      }
      localStorage.removeItem('carcass_cooldown_end');
    } catch (e) {}
  },

  async render() {
    const container = document.getElementById('carcass-grid-container');
    if (!container) return;

    // 1. Phục hồi ngay cooldown từ localStorage để khi F5 trang lập tức hiện đếm ngược
    const user = JSON.parse(localStorage.getItem('steam_user') || 'null');
    const steamId = (user && user.steamId) ? user.steamId : '';
    const localCd = this.getStoredCooldown(steamId);
    if (localCd > Date.now()) {
      this.cooldownEnd = localCd;
    }

    container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">⏳ Đang đồng bộ danh sách xác từ máy chủ...</div>';

    try {
      const steamParam = steamId ? `?steam_id=${steamId}` : '';
      const res = await fetch(`/api/server/carcass/offers${steamParam}`);
      const data = await res.json();
      this.offers = data.offers || [];

      // 2. Đồng bộ thời gian chờ từ máy chủ nếu máy chủ báo vẫn còn cooldown
      if (data.remaining_cooldown && data.remaining_cooldown > 0) {
        const serverCdEnd = Date.now() + (data.remaining_cooldown * 1000);
        if (serverCdEnd > this.cooldownEnd) {
          this.cooldownEnd = serverCdEnd;
          this.setStoredCooldown(steamId, this.cooldownEnd);
        }
      }
    } catch (e) {
      console.warn("Lỗi tải carcass offers:", e);
      this.offers = [];
    }

    if (this.offers.length === 0) {
      this.offers = [
        {
          "id": "omv572un0",
          "name": "Xác Tenontosaurus Tươi",
          "category": "carnivore",
          "type": "carcass",
          "price": 200,
          "price_display": "200 Xu",
          "species": "Tenontosaurus",
          "species_name": "Tenontosaurus",
          "icon": "🍖",
          "image": "https://islepilot.eu/cdn/dino-art/render/Tenontosaurus.webp",
          "badge": "🥩 100% Kích Cỡ",
          "sub_badge": "🍖 Xác Thịt Tươi",
          "description": "Xác Tenontosaurus tươi ngon, giàu chất đạm, phù hợp hoàn hảo với chế độ ăn của mọi loài săn mồi ăn thịt."
        },
        {
          "id": "omv6uqesm",
          "name": "Xác Triceratops Khổng Lồ",
          "category": "carnivore",
          "type": "carcass",
          "price": 200,
          "price_display": "200 Xu",
          "species": "Triceratops",
          "species_name": "Triceratops",
          "icon": "🍖",
          "image": "https://islepilot.eu/cdn/dino-art/render/Triceratops.webp",
          "badge": "🥩 100% Kích Cỡ",
          "sub_badge": "🍖 Xác Thịt Tươi",
          "description": "Xác Triceratops to lớn đầy ắp thịt và tủy xương, thích hợp cho Apex Predators như T-Rex hay Giganotosaurus."
        },
        {
          "id": "omv6viaxj",
          "name": "Xác Stegosaurus Bổ Dưỡng",
          "category": "carnivore",
          "type": "carcass",
          "price": 200,
          "price_display": "200 Xu",
          "species": "Stegosaurus",
          "species_name": "Stegosaurus",
          "icon": "🍖",
          "image": "https://islepilot.eu/cdn/dino-art/render/Stegosaurus.webp",
          "badge": "🥩 100% Kích Cỡ",
          "sub_badge": "🍖 Xác Thịt Tươi",
          "description": "Xác Stegosaurus giàu chất béo và dưỡng chất, đảm bảo no bụng và hồi phục thể lực nhanh chóng."
        },
        {
          "id": "omvqituv4",
          "name": "Xác Carnotaurus Săn Mồi",
          "category": "carnivore",
          "type": "carcass",
          "price": 200,
          "price_display": "200 Xu",
          "species": "Carnotaurus",
          "species_name": "Carnotaurus",
          "icon": "🍖",
          "image": "https://islepilot.eu/cdn/dino-art/render/Carnotaurus.webp",
          "badge": "🥩 100% Kích Cỡ",
          "sub_badge": "🍖 Xác Thịt Tươi",
          "description": "Xác thú ăn thịt cỡ trung, cung cấp hàm lượng protein tinh khiết cho các loài ăn thịt khác."
        },
        {
          "id": "omvqiuffy",
          "name": "Xác Ceratosaurus Đậm Vị",
          "category": "carnivore",
          "type": "carcass",
          "price": 200,
          "price_display": "200 Xu",
          "species": "Ceratosaurus",
          "species_name": "Ceratosaurus",
          "icon": "🍖",
          "image": "https://islepilot.eu/cdn/dino-art/render/Ceratosaurus.webp",
          "badge": "🥩 100% Kích Cỡ",
          "sub_badge": "🍖 Xác Thịt Tươi",
          "description": "Xác Ceratosaurus tươi đặc trưng, hỗ trợ tiêu hóa nhanh và kích hoạt các đột biến gen săn mồi."
        },
        {
          "id": "omvqiuphi",
          "name": "Xác Tyrannosaurus Chúa Tể",
          "category": "carnivore",
          "type": "carcass",
          "price": 200,
          "price_display": "200 Xu",
          "species": "Tyrannosaurus",
          "species_name": "Tyrannosaurus",
          "icon": "🍖",
          "image": "https://islepilot.eu/cdn/dino-art/render/Tyrannosaurus.webp",
          "badge": "🥩 100% Kích Cỡ",
          "sub_badge": "🍖 Xác Thịt Tươi",
          "description": "Khối lượng thịt khổng lồ từ chúa tể T-Rex, cung cấp nguồn năng lượng dồi dào nhất đảo Evrima."
        },
        {
          "id": "plant_sanctuary",
          "name": "Bụi Cây Sanctuary (Thánh Địa)",
          "category": "herbivore",
          "type": "plant",
          "price": 200,
          "price_display": "200 Xu",
          "species": "Sanctuary Bush",
          "species_name": "Sanctuary Bush",
          "icon": "🌿",
          "image": "https://islepilot.eu/cdn/dino-art/render/Tenontosaurus.webp",
          "badge": "🌿 100% Cân Bằng",
          "sub_badge": "✨ S-A-B-Y 100%",
          "description": "Bụi cây Thánh Địa màu mỡ đặc trưng của The Isle: Evrima. Cung cấp toàn diện 3 nhóm dưỡng chất, no lâu và tăng trưởng thần tốc."
        },
        {
          "id": "plant_berry",
          "name": "Bụi Dâu Rừng (Blueberry Bush)",
          "category": "herbivore",
          "type": "plant",
          "price": 200,
          "price_display": "200 Xu",
          "species": "Berry Bush",
          "species_name": "Berry Bush",
          "icon": "🫐",
          "image": "https://islepilot.eu/cdn/dino-art/render/Dryosaurus.webp",
          "badge": "🫐 100% Carbs (S)",
          "sub_badge": "⚡ Hồi Thể Lực",
          "description": "Những chùm quả mọng ngọt nước mọc thành lùm rậm rạp. Cung cấp lượng lớn Carbohydrate, phục hồi thể lực (Stamina) dồi dào."
        },
        {
          "id": "plant_roots",
          "name": "Rễ Cây Cổ Thụ & Đầm Lầy (Bulrush)",
          "category": "herbivore",
          "type": "plant",
          "price": 200,
          "price_display": "200 Xu",
          "species": "Bulrush Roots",
          "species_name": "Bulrush Roots",
          "icon": "🌾",
          "image": "https://islepilot.eu/cdn/dino-art/render/Stegosaurus.webp",
          "badge": "🌾 100% Lipid (Y)",
          "sub_badge": "🛡️ Tinh Bột & Khoáng",
          "description": "Củ rễ đầm lầy đậm đà giàu tinh bột và khoáng chất tự nhiên. Món ăn khoái khẩu của Triceratops, Stegosaurus và Tenontosaurus."
        },
        {
          "id": "plant_palm",
          "name": "Cây Cọ Rừng & Chuối Rừng (Palm Tree)",
          "category": "herbivore",
          "type": "plant",
          "price": 200,
          "price_display": "200 Xu",
          "species": "Mountain Palm",
          "species_name": "Mountain Palm",
          "icon": "🌴",
          "image": "https://islepilot.eu/cdn/dino-art/render/Triceratops.webp",
          "badge": "🌴 100% Protein (B)",
          "sub_badge": "💪 Tăng Cơ Bắp",
          "description": "Tán cọ rừng xanh tốt với buồng quả chứa hàm lượng Protein thực vật dồi dào, hỗ trợ tăng cơ bắp và kích thước cho khủng long ăn cỏ."
        },
        {
          "id": "plant_marigold",
          "name": "Cây Thảo Dược Hồi Máu (Marigold)",
          "category": "herbivore",
          "type": "plant",
          "price": 200,
          "price_display": "200 Xu",
          "species": "Marigold Herbs",
          "species_name": "Marigold Herbs",
          "icon": "🌼",
          "image": "https://islepilot.eu/cdn/dino-art/render/Diabloceratops.webp",
          "badge": "❤️ Hồi Máu 100%",
          "sub_badge": "🩹 Cầm Máu Cấp Tốc",
          "description": "Loài thảo dược hoa vàng quý giá trong rừng rậm. Khả năng kháng viêm, cầm máu thần tốc và hồi phục sinh lực sau các trận tử chiến."
        },
        {
          "id": "plant_mushroom",
          "name": "Nấm Rừng Dinh Dưỡng (Forest Truffles)",
          "category": "herbivore",
          "type": "plant",
          "price": 200,
          "price_display": "200 Xu",
          "species": "Forest Mushroom",
          "species_name": "Forest Mushroom",
          "icon": "🍄",
          "image": "https://islepilot.eu/cdn/dino-art/render/Pachycephalosaurus.webp",
          "badge": "💧 100% Nước & Vi Chất",
          "sub_badge": "🍄 Nấm Dinh Dưỡng",
          "description": "Những tai nấm mọng nước phát triển trên thân gỗ mục. Cung cấp nước ngọt tinh khiết và vi chất hoàn hảo cho Pachy, Dryo, Hypsi, Galli."
        }
      ];
    }

    this.displayCards();
    if (this.cooldownEnd > Date.now()) {
      this.startCooldownInterval();
    }
  },

  displayCards() {
    const container = document.getElementById('carcass-grid-container');
    if (!container) return;

    const isCooldown = Date.now() < this.cooldownEnd;
    const remainingSec = Math.max(0, Math.ceil((this.cooldownEnd - Date.now()) / 1000));

    const filtered = (this.offers || []).filter(item => {
      if (this.currentCategory === 'all') return true;
      return item.category === this.currentCategory;
    });

    if (filtered.length === 0) {
      container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">Không tìm thấy gói thức ăn nào phù hợp.</div>';
      return;
    }

    container.innerHTML = filtered.map((item) => {
      const isPlant = item.type === 'plant' || item.category === 'herbivore';
      const dinoImg = item.image || (window.Garage ? Garage.getDinoImageUrl(item.species) : `https://islepilot.eu/cdn/dino-art/render/${item.species || 'Tenontosaurus'}.webp`);
      const cardBorder = isPlant ? 'border-color: rgba(16, 185, 129, 0.35); background: rgba(10, 24, 18, 0.88);' : '';
      const bannerBg = isPlant ? 'background: radial-gradient(circle at center, rgba(16, 185, 129, 0.18) 0%, rgba(8, 20, 15, 0.95) 100%);' : '';
      const topBadgeColor = isPlant ? 'background: rgba(16, 185, 129, 0.25); border-color: #10b981; color: #34d399;' : 'background: rgba(16, 185, 129, 0.2); border-color: #10b981; color: #10b981;';
      const subBadgeColor = isPlant ? 'background: rgba(52, 211, 153, 0.15); border-color: #34d399; color: #6ee7b7;' : 'background: rgba(255, 42, 133, 0.15); border-color: var(--accent); color: var(--accent);';
      const btnStyle = isPlant ? 'background: #10b981; color: #fff;' : 'background: #ff2a85; color: #000;';
      const btnText = isCooldown ? `Chờ (${remainingSec}s)` : (isPlant ? '🌱 Trồng Cây' : '🥩 Thả Xác');

      return `
        <div class="carcass-card ${isPlant ? 'carcass-card-plant' : ''}" style="${cardBorder}">
          <div class="carcass-banner" style="${bannerBg}">
            <img src="${dinoImg}" alt="${item.name}" class="carcass-img-render" onerror="this.src='https://islepilot.eu/cdn/dino-art/render/Tenontosaurus.webp'">
            <span class="growth-badge" style="${topBadgeColor}">
              ${item.badge || (isPlant ? '🌿 Thảo Mộc' : '🥩 100% Kích Cỡ')}
            </span>
            <span class="growth-badge" style="right: auto; left: 10px; ${subBadgeColor}">
              ${item.sub_badge || item.species || (isPlant ? 'Ăn Cỏ' : 'Ăn Thịt')}
            </span>
          </div>

          <div class="carcass-body">
            <div class="carcass-card-header">
              <span class="carcass-card-name">${isPlant ? (item.icon ? item.icon + ' ' : '🌿 ') : '🥩 '}${item.name}</span>
              <span class="carcass-card-price" style="${isPlant ? 'color: #34d399;' : 'color: #ef4444; font-weight: 700;'}">${item.price_display || '200 Xu'}</span>
            </div>

            <p class="carcass-card-desc">
              ${item.description}
            </p>

            <div style="margin-top: auto; padding-top: 8px;">
              <button id="carcass-btn-${item.id}" class="carcass-btn-buy" style="${btnStyle}" ${isCooldown ? 'disabled' : ''} onclick="Carcass.actionDrop('${item.id}', '${item.name}')">
                ${btnText}
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
    const updateCountdown = () => {
      const remainingSec = Math.max(0, Math.ceil((this.cooldownEnd - Date.now()) / 1000));
      document.querySelectorAll('.carcass-btn-buy').forEach(btn => {
        if (remainingSec > 0) {
          btn.disabled = true;
          btn.textContent = `Chờ (${remainingSec}s)`;
        } else {
          btn.disabled = false;
        }
      });
      if (remainingSec <= 0) {
        clearInterval(this.cooldownTimer);
        this.cooldownTimer = null;
        const user = JSON.parse(localStorage.getItem('steam_user') || 'null');
        const steamId = (user && user.steamId) ? user.steamId : '';
        this.clearStoredCooldown(steamId);
        this.displayCards();
      }
    };
    updateCountdown();
    this.cooldownTimer = setInterval(updateCountdown, 1000);
  },

  async actionDrop(offerId, name) {
    const user = JSON.parse(localStorage.getItem('steam_user') || 'null');
    if (!user || !user.steamId) {
      App.showToast("Vui lòng đăng nhập Steam trước khi nhận!", 'warning');
      return;
    }

    const steamId = user.steamId;
    // Kiểm tra cooldown cả trong bộ nhớ và trong localStorage
    const localCd = this.getStoredCooldown(steamId);
    if (localCd > this.cooldownEnd) {
      this.cooldownEnd = localCd;
    }

    if (Date.now() < this.cooldownEnd) {
      const remaining = Math.ceil((this.cooldownEnd - Date.now()) / 1000);
      App.showToast(`⏱️ Mỗi 300 giây mua được một lần. Vui lòng chờ ${remaining} giây!`, 'warning');
      this.startCooldownInterval();
      return;
    }

    const isPlant = String(offerId).startsWith('plant_');
    const btn = document.getElementById(`carcass-btn-${offerId}`);
    if (btn) {
      btn.disabled = true;
      btn.textContent = isPlant ? '⏳ Đang trồng...' : '⏳ Đang thả...';
    }

    try {
      const res = await fetch('/api/server/carcass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId, name, steam_id: steamId })
      });
      const data = await res.json();

      if (data.success || data.ok) {
        if (data.new_balance !== undefined) {
          user.balance = data.new_balance;
          localStorage.setItem('steam_user', JSON.stringify(user));
          if (window.App && typeof App.updateUserBalanceUI === 'function') {
            App.updateUserBalanceUI(data.new_balance);
          }
        } else if (window.App && typeof App.refreshBalance === 'function') {
          App.refreshBalance();
        }

        // Kích hoạt cooldown 300s và lưu localStorage để F5 không bị mất
        this.cooldownEnd = Date.now() + 300000;
        this.setStoredCooldown(steamId, this.cooldownEnd);
        this.startCooldownInterval();

        App.showToast(data.message || (isPlant ? 'Đã trừ 200 Xu! Trồng cây thành công!' : 'Đã trừ 200 Xu! Thả xác thành công!'), 'success');
      } else {
        // Nếu server từ chối vì đang cooldown
        if (data.cooldown && data.remaining_seconds) {
          this.cooldownEnd = Date.now() + (data.remaining_seconds * 1000);
          this.setStoredCooldown(steamId, this.cooldownEnd);
          this.startCooldownInterval();
        } else if (btn) {
          btn.disabled = false;
          btn.textContent = isPlant ? '🌱 Trồng Cây' : '🥩 Thả Xác';
        }
        App.showToast(data.message || "Thao tác thất bại!", 'error');
      }
    } catch (e) {
      App.showToast("Không thể kết nối đến máy chủ!", 'error');
      if (btn) {
        btn.disabled = false;
        btn.textContent = isPlant ? '🌱 Trồng Cây' : '🥩 Thả Xác';
      }
    }
  }
};



// ==========================================
// ==========================================
// ==========================================
// 20. MODULE QUÀ TÂN THỦ (STARTER GIFT & CLAIMS - ĐỒNG BỘ ISLEPILOT)
// ==========================================
const StarterGift = {
  bundle: null,
  selectedSpecies: 'Ceratosaurus',
  selectedGender: 'Male',
  selectedMutations: [
    'Multichambered Lungs',
    'Hypermetabolic Inanition',
    'Congenital Hypoalgesia',
    'Photosynthetic Tissue'
  ],
  filterCategory: 'all',
  searchQuery: '',
  isClaiming: false,

  async render() {
    const container = document.getElementById('starter-container');
    if (!container) return;

    container.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; color: var(--text-muted);">
        <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 12px; color: #fbbf24;"></i>
        <div style="font-size: 1rem; font-weight: 500;">Đang kết nối và đồng bộ dữ liệu gói quà tân thủ từ IslePilot...</div>
      </div>
    `;

    const user = JSON.parse(localStorage.getItem('steam_user') || 'null');
    const steamId = user ? user.steamId : '';

    try {
      const url = steamId ? `/api/server/claims?steam_id=${encodeURIComponent(steamId)}` : '/api/server/claims';
      const res = await fetch(url);
      const data = await res.json();
      this.bundle = data.bundle || null;
      if (this.bundle && this.bundle.default_mutations && (!this.selectedMutations || this.selectedMutations.length === 0)) {
        this.selectedMutations = [...this.bundle.default_mutations];
      }
    } catch (e) {
      console.warn("Lỗi tải gói quà:", e);
      this.bundle = null;
    }

    this.displayBundle();
  },

  displayBundle() {
    const container = document.getElementById('starter-container');
    if (!container) return;

    const user = JSON.parse(localStorage.getItem('steam_user') || 'null');
    const isLoggedIn = !!(user && user.steamId);

    if (!this.bundle) {
      container.innerHTML = `
        <div class="card" style="text-align: center; padding: 50px 20px; border: 1px dashed rgba(255,255,255,0.15);">
          <div style="font-size: 2.5rem; margin-bottom: 10px;">🎁</div>
          <h3 style="color: #fff; margin-bottom: 6px;">Hiện chưa có gói thưởng nào mở</h3>
          <p style="color: var(--text-muted); font-size: 0.9rem;">Vui lòng quay lại sau hoặc liên hệ ban quản trị server 3MGAMING.</p>
        </div>
      `;
      return;
    }

    const b = this.bundle;
    const isClaimed = !!b.claimed;
    const isEligible = b.eligible !== false;
    const playtimeHrs = b.playtime_hours || 0;
    const coinsReward = b.coins || 3000;
    const maxPlaytime = b.max_playtime_hours || 3;

    const allChoices = b.choices || [];
    const choicesHtml = allChoices.map(c => {
      const isSel = this.selectedSpecies === c.species;
      const isCarno = c.category === 'carnivore';
      return `
        <div class="starter-dino-option ${isSel ? 'active' : ''}" 
             data-species="${c.species}"
             data-category="${c.category || 'carnivore'}"
             data-name="${(c.name || '').toLowerCase()}"
             onclick="StarterGift.selectSpecies('${c.species}', event)"
             style="cursor: pointer; border: 1px solid ${isSel ? '#fbbf24' : 'rgba(255,255,255,0.1)'}; background: ${isSel ? 'rgba(251, 191, 36, 0.15)' : 'rgba(255,255,255,0.03)'}; padding: 10px 12px; border-radius: 12px; display: flex; align-items: center; gap: 10px; transition: all 0.2s; position: relative;">
          <img src="${typeof Garage !== 'undefined' && Garage.getDinoImageUrl ? Garage.getDinoImageUrl(c.species) : 'https://islepilot.eu/cdn/dino-art/icon-sm/' + c.species + '.webp'}" 
               alt="${c.species}" 
               style="width: 40px; height: 40px; object-fit: contain; border-radius: 8px; background: rgba(0,0,0,0.35); padding: 3px;"
               onerror="this.src='https://islepilot.eu/cdn/dino-art/icon-sm/Ceratosaurus.webp'">
          <div style="flex: 1; text-align: left; min-width: 0;">
            <div style="font-weight: 700; color: #fff; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${c.name}
            </div>
            <div style="font-size: 0.75rem; color: ${isCarno ? '#f87171' : '#34d399'}; display: flex; align-items: center; gap: 4px;">
              <span>${isCarno ? '🥩 Ăn thịt' : '🌿 Ăn cỏ'}</span> · <span style="color: #fbbf24; font-weight: 700;">👑 76% Size Prime</span>
            </div>
          </div>
          <div class="starter-check-icon" style="color: ${isSel ? '#fbbf24' : 'rgba(255,255,255,0.2)'}; font-size: 1.1rem;">
            <i class="${isSel ? 'fas fa-check-circle' : 'far fa-circle'}"></i>
          </div>
        </div>
      `;
    }).join('');

    const mutationList = b.mutation_choices || [];
    const mutationSlotsHtml = [0, 1, 2, 3].map(slotIdx => {
      const curVal = this.selectedMutations[slotIdx] || 'None';
      const optionsHtml = mutationList.map(m => `
        <option value="${m.id}" ${curVal === m.id ? 'selected' : ''}>
          ${m.name}
        </option>
      `).join('');

      return `
        <div style="display: flex; flex-direction: column; gap: 4px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); padding: 8px 12px; border-radius: 10px;">
          <label style="font-size: 0.78rem; font-weight: 700; color: #38bdf8; display: flex; justify-content: space-between;">
            <span><i class="fas fa-dna"></i> Đột biến ${slotIdx + 1}:</span>
            <span style="color: #94a3b8; font-weight: normal;">Slot ${slotIdx + 1}</span>
          </label>
          <select id="starter-mutation-slot-${slotIdx}" 
                  onchange="StarterGift.setMutation(${slotIdx}, this.value)" 
                  style="width: 100%; background: #0f172a; color: #f8fafc; border: 1px solid rgba(56, 189, 248, 0.3); padding: 6px 10px; border-radius: 6px; font-size: 0.82rem; outline: none; cursor: pointer;">
            ${optionsHtml}
          </select>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="card" style="border: 1px solid rgba(251, 191, 36, 0.35); background: linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(24, 24, 47, 0.9)); box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5); overflow: hidden; position: relative;">
        <!-- Glowing aura top -->
        <div style="position: absolute; top: -80px; right: -80px; width: 240px; height: 240px; background: radial-gradient(circle, rgba(251, 191, 36, 0.25) 0%, transparent 70%); pointer-events: none;"></div>

        <div style="display: flex; gap: 24px; flex-wrap: wrap; align-items: flex-start;">
          <!-- Left side: Summary & Badges -->
          <div style="flex: 1.1; min-width: 320px;">
            <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(251, 191, 36, 0.15); border: 1px solid rgba(251, 191, 36, 0.35); color: #fbbf24; padding: 4px 12px; border-radius: 999px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-bottom: 12px;">
              <i class="fas fa-crown"></i> Gói Phúc Lợi Tân Thủ Toàn Diện
            </div>
            <h1 style="font-size: 1.6rem; font-weight: 800; color: #fff; margin-bottom: 8px; line-height: 1.3;">
              ${b.name || 'Gói Quà Tân Thủ 3MGAMING'}
            </h1>
            <p style="color: var(--text-muted); font-size: 0.9rem; line-height: 1.5; margin-bottom: 16px;">
              Tặng ngay cho tất cả người chơi mới gia nhập: Khởi nghiệp với <b>${coinsReward.toLocaleString()} Xu</b> và nhận ngay 1 cá thể khủng long tùy chọn với <b>Đúng 4 Đột Biến Gen (Mutations)</b> tự chọn vào Gara Dino!
            </p>

            <!-- Rewards Cards -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px; margin-bottom: 18px;">
              <div style="display: flex; align-items: center; gap: 12px; background: rgba(251, 191, 36, 0.08); border: 1px solid rgba(251, 191, 36, 0.25); padding: 12px 14px; border-radius: 12px;">
                <div style="width: 42px; height: 42px; border-radius: 10px; background: rgba(251, 191, 36, 0.2); display: flex; align-items: center; justify-content: center; color: #fbbf24; font-size: 1.3rem;">
                  <i class="fas fa-coins"></i>
                </div>
                <div>
                  <div style="font-weight: 800; color: #fbbf24; font-size: 1.15rem;">+${coinsReward.toLocaleString()} Xu</div>
                  <div style="font-size: 0.75rem; color: #94a3b8;">Cộng thẳng vào ví IslePilot</div>
                </div>
              </div>

              <div style="display: flex; align-items: center; gap: 12px; background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.25); padding: 12px 14px; border-radius: 12px;">
                <div style="width: 42px; height: 42px; border-radius: 10px; background: rgba(56, 189, 248, 0.2); display: flex; align-items: center; justify-content: center; color: #38bdf8; font-size: 1.3rem;">
                  <i class="fas fa-dna"></i>
                </div>
                <div>
                  <div style="font-weight: 800; color: #38bdf8; font-size: 1.15rem;">4 Đột Biến Gen</div>
                  <div style="font-size: 0.75rem; color: #94a3b8;">Đúng 4 mutation chuẩn xác</div>
                </div>
              </div>

              <div style="display: flex; align-items: center; gap: 12px; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); padding: 12px 14px; border-radius: 12px; grid-column: 1/-1;">
                <div style="width: 42px; height: 42px; border-radius: 10px; background: rgba(16, 185, 129, 0.2); display: flex; align-items: center; justify-content: center; color: #10b981; font-size: 1.3rem;">
                  <i class="fas fa-dragon"></i>
                </div>
                <div>
                  <div style="font-weight: 800; color: #34d399; font-size: 1.1rem;">1 Khủng Long Prime Tùy Chọn (76% Size)</div>
                  <div style="font-size: 0.75rem; color: #94a3b8;">Chọn trong 27 loài có mặt trên server, tặng kèm Prime Elder, lưu thẳng vào Gara Dino</div>
                </div>
              </div>
            </div>

            <!-- 4 Mutations Selector Box -->
            <div style="background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 14px; padding: 16px; margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div style="font-size: 0.9rem; font-weight: 800; color: #38bdf8; display: flex; align-items: center; gap: 6px;">
                  <i class="fas fa-dna"></i> CHỌN 4 ĐỘT BIẾN GEN (MUTATIONS):
                </div>
                <button type="button" onclick="StarterGift.resetDefaultMutations(event)" 
                        style="background: transparent; border: 1px solid rgba(255,255,255,0.15); color: #94a3b8; font-size: 0.72rem; padding: 3px 8px; border-radius: 6px; cursor: pointer;">
                  <i class="fas fa-undo"></i> Mặc định
                </button>
              </div>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px;">
                ${mutationSlotsHtml}
              </div>
            </div>

            <!-- Conditions info -->
            <div style="display: flex; gap: 12px; flex-wrap: wrap; font-size: 0.8rem; color: #94a3b8;">
              <span style="display: inline-flex; align-items: center; gap: 5px;">
                <i class="fas fa-check-circle" style="color: #10b981;"></i> Nhận 1 lần duy nhất
              </span>
              <span style="display: inline-flex; align-items: center; gap: 5px;">
                <i class="fas fa-clock" style="color: #60a5fa;"></i> Áp dụng tài khoản &lt; ${maxPlaytime}h chơi
              </span>
              <span style="display: inline-flex; align-items: center; gap: 5px;">
                <i class="fas fa-bolt" style="color: #fbbf24;"></i> Nhận tự động vào game
              </span>
            </div>
          </div>

          <!-- Right side: Dino Selector & Claim Action -->
          <div style="flex: 1; min-width: 320px; background: rgba(0, 0, 0, 0.35); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 18px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <div style="font-weight: 700; color: #fff; font-size: 0.95rem;">
                <i class="fas fa-paw" style="color: #fbbf24; margin-right: 6px;"></i> Chọn Khủng Long (${allChoices.length} Loài)
              </div>
              <div style="display: flex; gap: 4px;">
                <button type="button" 
                        id="starter-gender-male"
                        onclick="StarterGift.setGender('Male', event)" 
                        style="padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; cursor: pointer; border: 1px solid ${this.selectedGender === 'Male' ? '#3b82f6' : 'rgba(255,255,255,0.1)'}; background: ${this.selectedGender === 'Male' ? 'rgba(59, 130, 246, 0.25)' : 'transparent'}; color: ${this.selectedGender === 'Male' ? '#60a5fa' : '#94a3b8'};">
                  Đực (Male)
                </button>
                <button type="button" 
                        id="starter-gender-female"
                        onclick="StarterGift.setGender('Female', event)" 
                        style="padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; cursor: pointer; border: 1px solid ${this.selectedGender === 'Female' ? '#ec4899' : 'rgba(255,255,255,0.1)'}; background: ${this.selectedGender === 'Female' ? 'rgba(236, 72, 153, 0.25)' : 'transparent'}; color: ${this.selectedGender === 'Female' ? '#f472b6' : '#94a3b8'};">
                  Cái (Female)
                </button>
              </div>
            </div>

            <!-- Category & Search Filters -->
            <div style="display: flex; gap: 6px; margin-bottom: 10px;">
              <button type="button" id="starter-cat-all" onclick="StarterGift.setCategory('all', event)" 
                      style="flex: 1; padding: 5px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; cursor: pointer; border: 1px solid #fbbf24; background: rgba(251,191,36,0.2); color: #fbbf24;">
                Tất cả (${allChoices.length})
              </button>
              <button type="button" id="starter-cat-carnivore" onclick="StarterGift.setCategory('carnivore', event)" 
                      style="flex: 1; padding: 5px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; cursor: pointer; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); color: #94a3b8;">
                Ăn thịt
              </button>
              <button type="button" id="starter-cat-herbivore" onclick="StarterGift.setCategory('herbivore', event)" 
                      style="flex: 1; padding: 5px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; cursor: pointer; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); color: #94a3b8;">
                Ăn cỏ
              </button>
            </div>

            <!-- Search input -->
            <div style="position: relative; margin-bottom: 12px;">
              <input type="text" 
                     id="starter-dino-search"
                     placeholder="🔍 Tìm nhanh loài khủng long..." 
                     value="${this.searchQuery}" 
                     oninput="StarterGift.setSearch(this.value)" 
                     style="width: 100%; background: #0f172a; border: 1px solid rgba(255,255,255,0.12); color: #fff; padding: 7px 12px; border-radius: 8px; font-size: 0.82rem; outline: none;">
            </div>

            <!-- Dino list grid with scroll -->
            <div id="starter-dino-list" style="display: flex; flex-direction: column; gap: 8px; max-height: 290px; overflow-y: auto; padding-right: 4px; margin-bottom: 16px;">
              ${choicesHtml}
            </div>

            <!-- Action button section -->
            <div>
              ${!isLoggedIn ? `
                <a href="/api/player/steam/login?redirect=%2F%23starter" 
                   class="btn btn-primary" 
                   style="width: 100%; justify-content: center; padding: 14px; font-size: 1rem; font-weight: 800; background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4); text-transform: uppercase;">
                  <i class="fab fa-steam" style="font-size: 1.2rem; margin-right: 8px;"></i> Đăng Nhập Bằng Steam Để Nhận
                </a>
              ` : isClaimed ? `
                <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 12px; padding: 14px; text-align: center; color: #34d399;">
                  <div style="font-size: 1.3rem; margin-bottom: 4px;"><i class="fas fa-check-circle"></i></div>
                  <div style="font-weight: 800; font-size: 0.95rem;">Bạn Đã Nhận Quà Tân Thủ Rồi!</div>
                  <div style="font-size: 0.8rem; color: #a7f3d0; margin-top: 4px;">Khủng long và 4 Mutation đã có trong Gara Dino, ${coinsReward.toLocaleString()} Xu đã được cộng vào ví.</div>
                  <a href="#garage" class="btn btn-secondary" style="margin-top: 10px; font-size: 0.8rem; padding: 6px 14px; display: inline-flex; align-items: center; gap: 6px;">
                    <i class="fas fa-warehouse"></i> Mở Gara Khủng Long Ngay
                  </a>
                </div>
              ` : !isEligible ? `
                <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 14px; text-align: center; color: #f87171;">
                  <div style="font-size: 1.3rem; margin-bottom: 4px;"><i class="fas fa-lock"></i></div>
                  <div style="font-weight: 800; font-size: 0.95rem;">Gói Quà Chỉ Dành Cho Tân Thủ</div>
                  <div style="font-size: 0.8rem; color: #fca5a5; margin-top: 4px;">Tài khoản của bạn đã đạt ${playtimeHrs} giờ chơi (yêu cầu dưới ${maxPlaytime}h).</div>
                </div>
              ` : `
                <button type="button" 
                        id="btn-claim-starter"
                        onclick="StarterGift.claim()" 
                        ${this.isClaiming ? 'disabled' : ''}
                        class="btn btn-primary" 
                        style="width: 100%; justify-content: center; padding: 14px; font-size: 1rem; font-weight: 800; background: linear-gradient(135deg, #f59e0b, #d97706); border-color: #fbbf24; box-shadow: 0 4px 20px rgba(245, 158, 11, 0.45); text-transform: uppercase;">
                  ${this.isClaiming ? '<i class="fas fa-spinner fa-spin" style="margin-right: 8px;"></i> Đang Nhận Quà...' : '<i class="fas fa-gift" style="margin-right: 8px;"></i> Nhận Quà Tân Thủ (3.000 Xu + ' + this.selectedSpecies + ')'}
                </button>
              `}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  selectSpecies(spec, ev) {
    if (ev) {
      ev.preventDefault();
      ev.stopPropagation();
    }
    this.selectedSpecies = spec;

    // Cập nhật DOM trực tiếp để TUYỆT ĐỐI KHÔNG bị reset cuộn trang
    document.querySelectorAll('.starter-dino-option').forEach(el => {
      const match = el.getAttribute('data-species') === spec;
      el.classList.toggle('active', match);
      el.style.borderColor = match ? '#fbbf24' : 'rgba(255,255,255,0.1)';
      el.style.background = match ? 'rgba(251, 191, 36, 0.15)' : 'rgba(255,255,255,0.03)';
      const iconWrap = el.querySelector('.starter-check-icon');
      if (iconWrap) {
        iconWrap.style.color = match ? '#fbbf24' : 'rgba(255,255,255,0.2)';
        iconWrap.innerHTML = match ? '<i class="fas fa-check-circle"></i>' : '<i class="far fa-circle"></i>';
      }
    });

    const btn = document.getElementById('btn-claim-starter');
    if (btn && !this.isClaiming) {
      const coins = (this.bundle && this.bundle.coins) || 3000;
      btn.innerHTML = `<i class="fas fa-gift" style="margin-right: 8px;"></i> Nhận Quà Tân Thủ (${coins.toLocaleString()} Xu + ${spec})`;
    }
  },

  setGender(gender, ev) {
    if (ev) {
      ev.preventDefault();
      ev.stopPropagation();
    }
    this.selectedGender = gender;
    const btnMale = document.getElementById('starter-gender-male');
    const btnFemale = document.getElementById('starter-gender-female');

    if (btnMale && btnFemale) {
      const isMale = gender === 'Male';
      btnMale.style.borderColor = isMale ? '#3b82f6' : 'rgba(255,255,255,0.1)';
      btnMale.style.background = isMale ? 'rgba(59, 130, 246, 0.25)' : 'transparent';
      btnMale.style.color = isMale ? '#60a5fa' : '#94a3b8';

      btnFemale.style.borderColor = !isMale ? '#ec4899' : 'rgba(255,255,255,0.1)';
      btnFemale.style.background = !isMale ? 'rgba(236, 72, 153, 0.25)' : 'transparent';
      btnFemale.style.color = !isMale ? '#f472b6' : '#94a3b8';
    }
  },

  setCategory(cat, ev) {
    if (ev) {
      ev.preventDefault();
      ev.stopPropagation();
    }
    this.filterCategory = cat;

    // Cập nhật nút tab
    const btns = {
      'all': document.getElementById('starter-cat-all'),
      'carnivore': document.getElementById('starter-cat-carnivore'),
      'herbivore': document.getElementById('starter-cat-herbivore')
    };
    for (const [key, b] of Object.entries(btns)) {
      if (b) {
        const isCur = key === cat;
        if (key === 'all') {
          b.style.borderColor = isCur ? '#fbbf24' : 'rgba(255,255,255,0.1)';
          b.style.background = isCur ? 'rgba(251,191,36,0.2)' : 'rgba(0,0,0,0.2)';
          b.style.color = isCur ? '#fbbf24' : '#94a3b8';
        } else if (key === 'carnivore') {
          b.style.borderColor = isCur ? '#ef4444' : 'rgba(255,255,255,0.1)';
          b.style.background = isCur ? 'rgba(239,68,68,0.2)' : 'rgba(0,0,0,0.2)';
          b.style.color = isCur ? '#f87171' : '#94a3b8';
        } else {
          b.style.borderColor = isCur ? '#10b981' : 'rgba(255,255,255,0.1)';
          b.style.background = isCur ? 'rgba(16,185,129,0.2)' : 'rgba(0,0,0,0.2)';
          b.style.color = isCur ? '#34d399' : '#94a3b8';
        }
      }
    }

    this.filterDinoList();
  },

  setSearch(q) {
    this.searchQuery = (q || '').trim().toLowerCase();
    this.filterDinoList();
  },

  filterDinoList() {
    const list = document.getElementById('starter-dino-list');
    if (!list) return;

    const items = list.querySelectorAll('.starter-dino-option');
    let visibleCount = 0;

    items.forEach(el => {
      const cat = el.getAttribute('data-category') || '';
      const name = (el.getAttribute('data-name') || '') + ' ' + (el.getAttribute('data-species') || '').toLowerCase();
      
      const matchCat = this.filterCategory === 'all' || (cat === this.filterCategory);
      const matchSearch = !this.searchQuery || name.includes(this.searchQuery);

      if (matchCat && matchSearch) {
        el.style.display = 'flex';
        visibleCount++;
      } else {
        el.style.display = 'none';
      }
    });

    let emptyNotice = document.getElementById('starter-dino-empty');
    if (visibleCount === 0) {
      if (!emptyNotice) {
        emptyNotice = document.createElement('div');
        emptyNotice.id = 'starter-dino-empty';
        emptyNotice.style.cssText = 'text-align: center; padding: 20px; color: var(--text-muted); font-size: 0.85rem;';
        list.appendChild(emptyNotice);
      }
      emptyNotice.textContent = `Không tìm thấy khủng long nào phù hợp`;
      emptyNotice.style.display = 'block';
    } else if (emptyNotice) {
      emptyNotice.style.display = 'none';
    }
  },

  setMutation(slotIdx, val) {
    this.selectedMutations[slotIdx] = val;
  },

  resetDefaultMutations(ev) {
    if (ev) {
      ev.preventDefault();
      ev.stopPropagation();
    }
    this.selectedMutations = [
      'Multichambered Lungs',
      'Hypermetabolic Inanition',
      'Congenital Hypoalgesia',
      'Photosynthetic Tissue'
    ];
    for (let i = 0; i < 4; i++) {
      const sel = document.getElementById(`starter-mutation-slot-${i}`);
      if (sel) {
        sel.value = this.selectedMutations[i];
      }
    }
  },

  async claim() {
    const user = JSON.parse(localStorage.getItem('steam_user') || 'null');
    if (!user || !user.steamId) {
      window.location.href = '/api/player/steam/login?redirect=%2F%23starter';
      return;
    }

    if (!this.selectedSpecies) {
      alert("Vui lòng chọn loài khủng long bạn muốn nhận!");
      return;
    }

    // Lọc chuẩn xác 4 đột biến không trùng lặp và không rỗng
    const validMuts = (this.selectedMutations || []).map(m => String(m).trim()).filter(m => m && m !== 'None');
    // Giới hạn đúng 4 đột biến
    const finalMuts = validMuts.slice(0, 4);

    this.isClaiming = true;
    const btn = document.getElementById('btn-claim-starter');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right: 8px;"></i> Đang Nhận Quà...';
    }

    try {
      const res = await fetch('/api/server/claims/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          steam_id: user.steamId,
          species: this.selectedSpecies,
          gender: this.selectedGender,
          mutations: finalMuts
        })
      });
      const data = await res.json();

      if (data.ok || data.success) {
        const coins = data.coins || 3000;
        const mutNames = (data.mutations || finalMuts).filter(m => m !== 'None').join(', ');
        if (typeof Swal !== 'undefined') {
          Swal.fire({
            title: '🎉 Nhận Quà Thành Công!',
            html: `
              <div style="font-size: 1rem; color: #e2e8f0; line-height: 1.6; text-align: left; padding: 4px 8px;">
                Chúc mừng bạn đã nhận thành công <b>Gói Quà Tân Thủ 3MGAMING</b>!<br><br>
                💰 <b>+${coins.toLocaleString()} Xu</b> đã cộng thẳng vào ví IslePilot.<br>
                🦖 <b>${this.selectedSpecies} Prime (76%)</b> (${this.selectedGender === 'Male' ? 'Đực' : 'Cái'}) đã được chuyển vào Gara của bạn.<br>
                🧬 <b>Đúng 4 Đột biến gen đã tích hợp:</b><br>
                <div style="font-size: 0.85rem; color: #38bdf8; margin-top: 4px; padding: 6px 10px; background: rgba(0,0,0,0.3); border-radius: 6px;">
                  ${mutNames || '4 Đột biến chuẩn'}
                </div>
              </div>
            `,
            icon: 'success',
            confirmButtonText: 'Đến Gara Khủng Long',
            showCancelButton: true,
            cancelButtonText: 'Ở lại trang',
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#64748b'
          }).then(result => {
            if (result.isConfirmed) {
              window.location.hash = '#garage';
            }
          });
        } else {
          alert(`🎉 Nhận thành công Quà Tân Thủ: +${coins.toLocaleString()} Xu và ${this.selectedSpecies} (kèm 4 đột biến) vào Gara!`);
        }

        // Cập nhật số dư Xu trên Header
        if (window.App && typeof App.updateUserBalanceUI === 'function' && data.balance !== undefined && data.balance !== null) {
          App.updateUserBalanceUI(data.balance);
        } else if (window.App && typeof App.refreshBalance === 'function') {
          App.refreshBalance();
        }

        // Cập nhật lại view
        await this.render();
      } else {
        const errMsg = data.error || data.message || "Nhận quà thất bại. Vui lòng thử lại!";
        if (typeof Swal !== 'undefined') {
          Swal.fire('Lỗi', errMsg, 'error');
        } else {
          alert('Lỗi: ' + errMsg);
        }
        this.isClaiming = false;
        if (btn) {
          btn.disabled = false;
          const coins = (this.bundle && this.bundle.coins) || 3000;
          btn.innerHTML = `<i class="fas fa-gift" style="margin-right: 8px;"></i> Nhận Quà Tân Thủ (${coins.toLocaleString()} Xu + ${this.selectedSpecies})`;
        }
      }
    } catch (e) {
      alert('Lỗi kết nối máy chủ: ' + e.message);
      this.isClaiming = false;
      if (btn) {
        btn.disabled = false;
        const coins = (this.bundle && this.bundle.coins) || 3000;
        btn.innerHTML = `<i class="fas fa-gift" style="margin-right: 8px;"></i> Nhận Quà Tân Thủ (${coins.toLocaleString()} Xu + ${this.selectedSpecies})`;
      }
    }
  }
};

window.StarterGift = StarterGift;
