/**
 * 3MGAMING EVRIMA 3D SKIN STUDIO & MOD WORKSHOP
 * Fully featured local & web 3D Dino Skin Customizer matching Elysium Studio layout
 * Synchronized with Steam OpenID, IslePilot Active Dinosaur, and External Mod Skins
 */

const Studio = {
  // State
  species: 'Diabloceratops',
  sex: 'male',
  pattern: 1,
  variation: 0,
  theme: 0,
  growth: 1.0,
  isExclusiveHacBang: true,
  designName: '👑 Màu Độc Quyền - Hắc Băng Lôi Điện',

  // Steam Auth & Active Dino State
  steamUser: null,
  activeDino: null,

  // Three.js instances
  scene: null,
  camera: null,
  renderer: null,
  controls: null,
  dinoModel: null,
  ambientLight: null,
  dirLight: null,
  fillLight: null,
  hemiLight: null,
  cachedTextures: {},

  // Chamber settings
  chamberPreset: 'blue',
  exposure: 1.18,
  autoRotate: false,
  rotSpeed: 0.8,
  cleanView: false,

  // Species metadata
  speciesList: [
    { id: 'Tyrannosaurus', label: 'Tyrannosaurus Rex', diet: 'carnivore' },
    { id: 'Carnotaurus', label: 'Carnotaurus', diet: 'carnivore' },
    { id: 'Ceratosaurus', label: 'Ceratosaurus', diet: 'carnivore' },
    { id: 'Deinosuchus', label: 'Deinosuchus', diet: 'carnivore' },
    { id: 'Diabloceratops', label: 'Diabloceratops', diet: 'herbivore' },
    { id: 'Dilophosaurus', label: 'Dilophosaurus', diet: 'carnivore' },
    { id: 'Dromaeosaurus', label: 'Dromaeosaurus', diet: 'carnivore' },
    { id: 'Dryosaurus', label: 'Dryosaurus', diet: 'herbivore' },
    { id: 'Gallimimus', label: 'Gallimimus', diet: 'omnivore' },
    { id: 'Herrerasaurus', label: 'Herrerasaurus', diet: 'carnivore' },
    { id: 'Hypsilophodon', label: 'Hypsilophodon', diet: 'herbivore' },
    { id: 'Maiasaura', label: 'Maiasaura', diet: 'herbivore' },
    { id: 'Omniraptor', label: 'Omniraptor', diet: 'carnivore' },
    { id: 'Pachycephalosaurus', label: 'Pachycephalosaurus', diet: 'omnivore' },
    { id: 'Pteranodon', label: 'Pteranodon', diet: 'carnivore' },
    { id: 'Stegosaurus', label: 'Stegosaurus', diet: 'herbivore' },
    { id: 'Tenontosaurus', label: 'Tenontosaurus', diet: 'herbivore' },
    { id: 'Triceratops', label: 'Triceratops', diet: 'herbivore' },
    { id: 'Troodon', label: 'Troodon', diet: 'carnivore' },
    { id: 'Allosaurus', label: 'Allosaurus', diet: 'carnivore' },
    { id: 'Austroraptor', label: 'Austroraptor', diet: 'carnivore' },
    { id: 'Baryonyx', label: 'Baryonyx', diet: 'carnivore' },
    { id: 'Beipiaosaurus', label: 'Beipiaosaurus', diet: 'omnivore' }
  ],

  // Chamber background presets
  chamberColors: {
    jade:  { bg: '#061a14', light: '#2dd4bf', ground: '#0f382c' },
    ember: { bg: '#1c0f08', light: '#f97316', ground: '#3d1d0e' },
    blue:  { bg: '#081226', light: '#38bdf8', ground: '#0f244a' },
    green: { bg: '#07170c', light: '#22c55e', ground: '#0d3618' },
    amber: { bg: '#171107', light: '#f59e0b', ground: '#36240d' },
    white: { bg: '#111317', light: '#f8fafc', ground: '#1e2430' },
    red:   { bg: '#1a0808', light: '#ef4444', ground: '#3b1010' },
    pink:  { bg: '#1c0817', light: '#ec4899', ground: '#3b1232' }
  },

  // Color layers (Mặc định: Màu Độc Quyền - Hắc Băng Lôi Điện)
  palette: {
    body: '#06080E',
    markings: '#00D9FF',
    flank: '#00E5FF',
    underbelly: '#EEF8FF',
    detail: '#6889A6',
    male_display: '#00FFFF',
    eyes: '#00FFFF',
    teeth: '#EEF8FF',
    mouth: '#0A2233',
    claws: '#00D9FF'
  },

  channelDefs: [
    { id: 'body', label: 'Thân chính (Body)', sub: 'Lớp vảy bề mặt chủ đạo' },
    { id: 'markings', label: 'Hoa văn sọc (Markings)', sub: 'Sọc lưng & hoa văn trang trí' },
    { id: 'flank', label: 'Mạng sườn (Flank)', sub: 'Chuyển sắc hai bên hông' },
    { id: 'underbelly', label: 'Bụng & Cổ (Underbelly)', sub: 'Màu sáng phần ức và yếm dưới' },
    { id: 'detail', label: 'Chi tiết sừng/gai (Detail)', sub: 'Gai lưng, sừng và vảy cứng' },
    { id: 'male_display', label: 'Yếm tán tỉnh (Male Display)', sub: 'Vùng màu sặc sỡ của con đực' },
    { id: 'eyes', label: 'Mắt (Eyes)', sub: 'Mống mắt phát sáng' },
    { id: 'teeth', label: 'Răng (Teeth)', sub: 'Màu răng & men răng' },
    { id: 'mouth', label: 'Vòm miệng (Mouth)', sub: 'Lưỡi và niêm mạc miệng' },
    { id: 'claws', label: 'Móng vuốt (Claws)', sub: 'Móng chân và vuốt trước' }
  ],

  savedSkins: [],

  async init() {
    this.populateSpeciesSelector();
    this.initThree();
    this.initEventListeners();
    this.renderChannels();
    this.renderPatternChips();
    await this.checkSteamAuth();
    await this.loadSavedSkins();
    await this.syncActiveDino(true);
  },

  // ==========================================
  // STEAM AUTHENTICATION & SYNCHRONIZATION
  // ==========================================
  getStoredSteamUser() {
    try {
      const raw = JSON.parse(localStorage.getItem('steam_user') || 'null');
      if (!raw) return null;
      const sid = raw.steamId || raw.steamid || raw.steam_id || '';
      if (!sid) return null;
      return {
        steamId: String(sid).trim(),
        name: raw.name || `Player_${String(sid).slice(-4)}`,
        balance: raw.balance || 0
      };
    } catch (e) {
      return null;
    }
  },

  async checkSteamAuth() {
    // 1. Check URL query params from Steam OpenID callback
    const params = new URLSearchParams(window.location.search);
    if (params.has('steam_id')) {
      const sid = params.get('steam_id').trim();
      const name = params.get('name') || `Player_${sid.slice(-4)}`;
      if (sid) {
        const userObj = { steamId: sid, name: decodeURIComponent(name), balance: 0 };
        localStorage.setItem('steam_user', JSON.stringify(userObj));
        document.cookie = `steam_user=${sid}:${encodeURIComponent(userObj.name)}; Path=/; Max-Age=2592000; SameSite=Lax`;
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
        this.showToast(`🎉 Đã liên kết Steam thành công: ${userObj.name}!`, 'success');
      }
    }

    // 2. Read from localStorage & verify with /api/player/me
    let user = this.getStoredSteamUser();
    const steamParam = (user && user.steamId) ? `?steam_id=${encodeURIComponent(user.steamId)}` : '';

    try {
      const res = await fetch(`/api/player/me${steamParam}`, { credentials: 'same-origin' });
      if (res.ok) {
        const data = await res.json();
        if (data.logged_in && data.steam_id) {
          user = {
            steamId: String(data.steam_id),
            name: data.name || (user && user.name) || `Player_${String(data.steam_id).slice(-4)}`,
            balance: typeof data.balance === 'number' ? data.balance : 0
          };
          localStorage.setItem('steam_user', JSON.stringify(user));
        } else if (!user) {
          user = null;
        }
      }
    } catch (e) {
      console.warn('checkSteamAuth error:', e);
    }

    this.steamUser = user;
    this.updateSteamUI();
  },

  updateSteamUI() {
    const guestBox = document.getElementById('studio-steam-guest');
    const loggedBox = document.getElementById('studio-steam-logged');
    const nameEl = document.getElementById('studio-user-name');
    const sidEl = document.getElementById('studio-user-steamid');
    const balEl = document.getElementById('studio-user-balance');
    const readoutSteam = document.getElementById('readout-steam');
    const deckUser = document.getElementById('deck-steam-user');
    const deckLoginCta = document.getElementById('deck-steam-login-cta');

    if (this.steamUser && this.steamUser.steamId) {
      if (guestBox) guestBox.style.display = 'none';
      if (loggedBox) loggedBox.style.display = 'inline-flex';
      if (nameEl) nameEl.textContent = this.steamUser.name;
      if (sidEl) sidEl.textContent = `(${this.steamUser.steamId})`;
      if (balEl) balEl.textContent = `💰 ${(this.steamUser.balance || 0).toLocaleString('vi-VN')} Xu`;
      if (readoutSteam) {
        readoutSteam.textContent = `${this.steamUser.name} (${this.steamUser.steamId.slice(-4)})`;
        readoutSteam.style.color = '#4ade80';
      }
      if (deckUser) {
        deckUser.innerHTML = `<span style="color:#4ade80;">🟢 ${this.steamUser.name}</span> <small style="color:#94a3b8;font-family:var(--font-mono);">(${this.steamUser.steamId})</small>`;
      }
      if (deckLoginCta) deckLoginCta.style.display = 'none';
    } else {
      if (guestBox) guestBox.style.display = 'inline-flex';
      if (loggedBox) loggedBox.style.display = 'none';
      if (readoutSteam) {
        readoutSteam.textContent = 'CHƯA ĐĂNG NHẬP';
        readoutSteam.style.color = '#f87171';
      }
      if (deckUser) {
        deckUser.innerHTML = `<span style="color:#f87171;">⚠️ Chưa đăng nhập Steam</span>`;
      }
      if (deckLoginCta) deckLoginCta.style.display = 'block';
    }
  },

  async promptManualSteamId() {
    const cur = (this.steamUser && this.steamUser.steamId) || '';
    const input = window.prompt('Nhập mã SteamID64 (17 chữ số, bắt đầu bằng 7656119...) để đồng bộ trực tiếp với tài khoản trên Server:', cur);
    if (!input) return;
    const sid = input.trim();
    if (!/^7656119\d{10}$/.test(sid)) {
      this.showToast('⚠️ Mã SteamID64 không hợp lệ! Phải gồm 17 chữ số bắt đầu bằng 7656119...', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/player/me?steam_id=${encodeURIComponent(sid)}`, { credentials: 'same-origin' });
      const data = await res.json().catch(() => ({}));
      const name = data.name || `Player_${sid.slice(-4)}`;
      const balance = data.balance || 0;
      const userObj = { steamId: sid, name, balance };
      localStorage.setItem('steam_user', JSON.stringify(userObj));
      document.cookie = `steam_user=${sid}:${encodeURIComponent(name)}; Path=/; Max-Age=2592000; SameSite=Lax`;
      this.steamUser = userObj;
      this.updateSteamUI();
      await this.loadSavedSkins();
      await this.syncActiveDino();
      this.showToast(`✅ Đã đồng bộ Steam: ${name} (${sid})`, 'success');
    } catch (e) {
      this.showToast('Lỗi kiểm tra SteamID!', 'error');
    }
  },

  async logoutSteam() {
    try {
      await fetch('/api/player/logout', { credentials: 'same-origin' });
    } catch (e) {}
    localStorage.removeItem('steam_user');
    document.cookie = 'steam_user=; Path=/; Max-Age=0; SameSite=Lax';
    this.steamUser = null;
    this.activeDino = null;
    this.updateSteamUI();
    const deckDino = document.getElementById('deck-active-dino');
    if (deckDino) deckDino.textContent = 'Chưa đồng bộ';
    this.showToast('Đã đăng xuất tài khoản Steam.');
  },

  // Synchronize with player's active dinosaur on the server
  async syncActiveDino(initialLoad = false) {
    const sid = (this.steamUser && this.steamUser.steamId) ? this.steamUser.steamId : '';
    const deckDino = document.getElementById('deck-active-dino');

    if (!sid) {
      if (deckDino) deckDino.innerHTML = '<span style="color:#94a3b8;">Đăng nhập Steam để đồng bộ</span>';
      if (initialLoad) {
        await this.loadSpecies(this.species);
      } else {
        this.showToast('⚠️ Vui lòng đăng nhập Steam trước để đồng bộ khủng long từ Server!', 'error');
      }
      return;
    }

    try {
      const res = await fetch(`/api/player/active-dino?steam_id=${encodeURIComponent(sid)}`, { credentials: 'same-origin' });
      const data = await res.json().catch(() => null);
      if (data && data.species) {
        this.activeDino = data;
        let sp = data.species;
        const match = this.speciesList.find(s => s.id.toLowerCase() === sp.toLowerCase());
        if (match) {
          this.species = match.id;
        } else if (sp.toLowerCase().includes('rex')) {
          this.species = 'Tyrannosaurus';
        }

        if (data.gender) this.sex = data.gender;
        if (data.female !== undefined) this.sex = data.female ? 'female' : 'male';
        this.updateSexButtons();

        if (typeof data.growth === 'number') {
          this.growth = Math.max(0.1, Math.min(1.0, data.growth));
          const slider = document.getElementById('growth-slider');
          const readout = document.getElementById('growth-readout');
          const pct = Math.round(this.growth * 100);
          if (slider) slider.value = pct;
          if (readout) {
            const stageName = pct < 25 ? 'Hatchling (Con non)' : pct < 50 ? 'Juvenile (Mới lớn)' : pct < 75 ? 'Subadult (Tiền trưởng thành)' : 'Adult (Trưởng thành)';
            readout.textContent = `${pct}% · ${stageName}`;
          }
        }

        if (data.name && this.steamUser && this.steamUser.name.startsWith('Player_')) {
          this.steamUser.name = data.name;
          localStorage.setItem('steam_user', JSON.stringify(this.steamUser));
          this.updateSteamUI();
        }

        if (deckDino) {
          const pct = Math.round((data.growth || 1) * 100);
          const statusTag = data.online
            ? '<span style="color:#4ade80;">🟢 Đang trong Game</span>'
            : (data.source === 'garage' ? '<span style="color:#fbbf24;">📦 Trong Gara</span>' : '<span style="color:#38bdf8;">🦕 Trên Server</span>');
          deckDino.innerHTML = `${data.species} (${pct}% · ${this.sex === 'female' ? '♀ Cái' : '♂ Đực'}) · ${statusTag}`;
        }

        this.populateSpeciesSelector();
        await this.loadSpecies(this.species);
        this.showToast(`✅ Đã đồng bộ khủng long của ${this.steamUser.name}: ${data.species} (${Math.round(this.growth * 100)}%)`, 'success');
      } else {
        if (deckDino) deckDino.textContent = 'Chưa có khủng long';
        if (initialLoad) await this.loadSpecies(this.species);
      }
    } catch (e) {
      console.warn('syncActiveDino error:', e);
      if (initialLoad) await this.loadSpecies(this.species);
    }
  },

  updateSexButtons() {
    const maleBtn = document.getElementById('btn-sex-male');
    const femaleBtn = document.getElementById('btn-sex-female');
    if (maleBtn) maleBtn.classList.toggle('active', this.sex === 'male');
    if (femaleBtn) femaleBtn.classList.toggle('active', this.sex === 'female');
  },

  populateSpeciesSelector() {
    const sel = document.getElementById('spec-select');
    if (!sel) return;
    sel.innerHTML = '';
    this.speciesList.forEach(sp => {
      const opt = document.createElement('option');
      opt.value = sp.id;
      opt.textContent = sp.label;
      sel.appendChild(opt);
    });
    sel.value = this.species;
    this.updateDietBadge();
  },

  updateDietBadge() {
    const badge = document.getElementById('spec-diet');
    if (!badge) return;
    const cur = this.speciesList.find(s => s.id === this.species);
    const diet = cur ? cur.diet : 'carnivore';
    badge.className = `diet-pill diet-${diet}`;
    badge.textContent = diet === 'carnivore' ? '🥩 Ăn Thịt' : diet === 'herbivore' ? '🌿 Ăn Cỏ' : '🌾 Ăn Tạp';

    const readoutSp = document.getElementById('readout-species');
    const readoutDiet = document.getElementById('readout-diet');
    if (readoutSp) readoutSp.textContent = this.species;
    if (readoutDiet) readoutDiet.textContent = diet.toUpperCase();
  },

  // Initialize Three.js WebGL Chamber
  initThree() {
    const canvas = document.getElementById('stage-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const container = canvas.parentElement;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || (window.innerHeight - 52);

    this.scene = new THREE.Scene();
    this.applyChamberPreset(this.chamberPreset);

    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    this.camera.position.set(0, 1.4, 6.5);

    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: true
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = this.exposure;

    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, canvas);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxPolarAngle = Math.PI / 2 + 0.05;
      this.controls.minDistance = 2.0;
      this.controls.maxDistance = 14.0;
      this.controls.target.set(0, 0.8, 0);
    }

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x1a2030, 0.8);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    this.dirLight.position.set(4, 8, 5);
    this.scene.add(this.dirLight);

    this.fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    this.fillLight.position.set(-4, 3, -4);
    this.scene.add(this.fillLight);

    const grid = new THREE.GridHelper(12, 24, 0xff2a85, 0x223046);
    grid.position.y = -0.01;
    this.scene.add(grid);

    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (this.controls) {
        if (this.autoRotate && this.dinoModel) {
          this.dinoModel.rotation.y += delta * this.rotSpeed;
        }
        this.controls.update();
      }

      this.renderer.render(this.scene, this.camera);
    };
    animate();

    window.addEventListener('resize', () => {
      if (!this.renderer || !this.camera || !canvas.parentElement) return;
      const w = canvas.parentElement.clientWidth;
      const h = canvas.parentElement.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
  },

  applyChamberPreset(name, customHex = null) {
    this.chamberPreset = name;
    let colorSet = this.chamberColors[name] || this.chamberColors.blue;
    if (name === 'custom' && customHex) {
      colorSet = { bg: '#080a10', light: customHex, ground: '#151922' };
    }

    if (this.scene) {
      this.scene.background = new THREE.Color(colorSet.bg);
      this.scene.fog = new THREE.FogExp2(colorSet.bg, 0.045);
    }
    if (this.dirLight) {
      this.dirLight.color.set('#ffffff');
    }
    if (this.ambientLight) {
      this.ambientLight.color.set('#f4f8ff');
    }
    if (this.fillLight) {
      this.fillLight.color.set(colorSet.light);
    }

    document.querySelectorAll('.chamber-swatch').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.chamber === name);
    });
  },

  buildSmoothUv3DMap(model) {
    const SW = 512, SH = 512;
    const bufX = new Float32Array(SW * SH);
    const bufY = new Float32Array(SW * SH);
    const bufZ = new Float32Array(SW * SH);
    const bufV = new Uint8Array(SW * SH);
    const NBINS = 120;
    const yTopBins = new Float32Array(NBINS);

    let maxX = 0.001;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    const meshes = [];
    model.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        const matName = `${child.name || ''} ${(child.material && child.material.name) || ''}`.toLowerCase();
        if (/eye|iris|pupil/.test(matName)) return;
        const posAttr = child.geometry.attributes.position;
        const uvAttr = child.geometry.attributes.uv;
        if (!posAttr || !uvAttr) return;
        meshes.push(child.geometry);
        const count = posAttr.count;
        for (let i = 0; i < count; i++) {
          const x = Math.abs(posAttr.getX(i));
          const y = posAttr.getY(i);
          const z = posAttr.getZ(i);
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          if (z < minZ) minZ = z;
          if (z > maxZ) maxZ = z;
        }
      }
    });

    if (meshes.length === 0 || maxY <= minY || maxZ <= minZ) return null;
    const spanY = Math.max(0.001, maxY - minY);
    const spanZ = Math.max(0.001, maxZ - minZ);

    for (const geom of meshes) {
      const posAttr = geom.attributes.position;
      const count = posAttr.count;
      for (let i = 0; i < count; i++) {
        const yn = (posAttr.getY(i) - minY) / spanY;
        const zn = (posAttr.getZ(i) - minZ) / spanZ;
        const b = Math.min(NBINS - 1, Math.max(0, Math.floor(zn * NBINS)));
        if (yn > yTopBins[b]) yTopBins[b] = yn;
      }
    }

    let yTopSmooth = new Float32Array(yTopBins);
    for (let pass = 0; pass < 2; pass++) {
      const next = new Float32Array(NBINS);
      for (let i = 0; i < NBINS; i++) {
        const prev = yTopSmooth[Math.max(0, i - 1)];
        const cur = yTopSmooth[i];
        const nxt = yTopSmooth[Math.min(NBINS - 1, i + 1)];
        next[i] = (prev + cur * 2 + nxt) / 4.0;
      }
      yTopSmooth = next;
    }

    for (const geom of meshes) {
      const posAttr = geom.attributes.position;
      const uvAttr = geom.attributes.uv;
      const idxAttr = geom.index;
      const triCount = idxAttr ? idxAttr.count : posAttr.count;

      for (let i = 0; i < triCount; i += 3) {
        const i0 = idxAttr ? idxAttr.getX(i) : i;
        const i1 = idxAttr ? idxAttr.getX(i + 1) : i + 1;
        const i2 = idxAttr ? idxAttr.getX(i + 2) : i + 2;

        const u0 = ((uvAttr.getX(i0) % 1) + 1) % 1;
        const v0 = ((uvAttr.getY(i0) % 1) + 1) % 1;
        const u1 = ((uvAttr.getX(i1) % 1) + 1) % 1;
        const v1 = ((uvAttr.getY(i1) % 1) + 1) % 1;
        const u2 = ((uvAttr.getX(i2) % 1) + 1) % 1;
        const v2 = ((uvAttr.getY(i2) % 1) + 1) % 1;

        if (Math.max(u0, u1, u2) - Math.min(u0, u1, u2) > 0.35 ||
            Math.max(v0, v1, v2) - Math.min(v0, v1, v2) > 0.35) {
          continue;
        }

        const x0 = u0 * SW, y0 = v0 * SH;
        const x1 = u1 * SW, y1 = v1 * SH;
        const x2 = u2 * SW, y2 = v2 * SH;
        const denom = (y1 - y2) * (x0 - x2) + (x2 - x1) * (y0 - y2);
        if (Math.abs(denom) < 1e-6) continue;
        const invD = 1.0 / denom;

        const xn0 = Math.abs(posAttr.getX(i0)) / maxX;
        const yn0 = (posAttr.getY(i0) - minY) / spanY;
        const zn0 = (posAttr.getZ(i0) - minZ) / spanZ;

        const xn1 = Math.abs(posAttr.getX(i1)) / maxX;
        const yn1 = (posAttr.getY(i1) - minY) / spanY;
        const zn1 = (posAttr.getZ(i1) - minZ) / spanZ;

        const xn2 = Math.abs(posAttr.getX(i2)) / maxX;
        const yn2 = (posAttr.getY(i2) - minY) / spanY;
        const zn2 = (posAttr.getZ(i2) - minZ) / spanZ;

        const minPx = Math.max(0, Math.floor(Math.min(x0, x1, x2)) - 1);
        const maxPx = Math.min(SW - 1, Math.ceil(Math.max(x0, x1, x2)) + 1);
        const minPy = Math.max(0, Math.floor(Math.min(y0, y1, y2)) - 1);
        const maxPy = Math.min(SH - 1, Math.ceil(Math.max(y0, y1, y2)) + 1);

        for (let py = minPy; py <= maxPy; py++) {
          const pyc = py + 0.5;
          const rowOff = py * SW;
          for (let px = minPx; px <= maxPx; px++) {
            const pxc = px + 0.5;
            const w0 = ((y1 - y2) * (pxc - x2) + (x2 - x1) * (pyc - y2)) * invD;
            const w1 = ((y2 - y0) * (pxc - x2) + (x0 - x2) * (pyc - y2)) * invD;
            const w2 = 1.0 - w0 - w1;
            if (w0 >= -0.08 && w1 >= -0.08 && w2 >= -0.08) {
              let cw0 = Math.max(0, w0), cw1 = Math.max(0, w1), cw2 = Math.max(0, w2);
              const s = cw0 + cw1 + cw2;
              if (s > 0) {
                cw0 /= s; cw1 /= s; cw2 /= s;
                const idx = rowOff + px;
                bufX[idx] = cw0 * xn0 + cw1 * xn1 + cw2 * xn2;
                bufY[idx] = cw0 * yn0 + cw1 * yn1 + cw2 * yn2;
                bufZ[idx] = cw0 * zn0 + cw1 * zn1 + cw2 * zn2;
                bufV[idx] = 1;
              }
            }
          }
        }
      }
    }

    return { SW, SH, bufX, bufY, bufZ, bufV, yTopSmooth, NBINS };
  },

  async loadSpecies(speciesName) {
    this.species = speciesName;
    const loadingElem = document.getElementById('viewport-loading');
    if (loadingElem) loadingElem.style.display = 'block';

    const sel = document.getElementById('spec-select');
    if (sel) sel.value = speciesName;
    this.updateDietBadge();
    this.updateSkinCodeDisplay();

    const meshUrl = `/cdn/dinos/${encodeURIComponent(speciesName)}/mesh.glb`;
    const diffUrl = `/cdn/dinos/${encodeURIComponent(speciesName)}/diffuse.png`;
    const patUrl = `/cdn/dinos/${encodeURIComponent(speciesName)}/pattern_adult.png`;
    const maskUrl = `/cdn/dinos/${encodeURIComponent(speciesName)}/tint_mask.png`;

    const loadImage = (url) => new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });

    if (typeof THREE.GLTFLoader === 'undefined') {
      if (loadingElem) loadingElem.style.display = 'none';
      return;
    }

    const loader = new THREE.GLTFLoader();

    try {
      const [gltf, diffImg, patImg, maskImg] = await Promise.all([
        new Promise((resolve, reject) => loader.load(meshUrl, resolve, undefined, reject)),
        loadImage(diffUrl),
        loadImage(patUrl),
        loadImage(maskUrl)
      ]);

      if (this.dinoModel) {
        this.scene.remove(this.dinoModel);
        this.dinoModel = null;
      }

      const model = gltf.scene;
      const uv3d = this.buildSmoothUv3DMap(model);

      this.cachedTextures[speciesName] = {
        diffuse: diffImg,
        pattern: patImg,
        tintMask: maskImg,
        uv3d: uv3d
      };

      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const origMats = Array.isArray(child.material) ? child.material : [child.material];
          const newMats = origMats.map(origMat => {
            const mat = new THREE.MeshStandardMaterial({
              color: '#ffffff',
              roughness: 0.62,
              metalness: 0.08,
              transparent: origMat && 'transparent' in origMat && !!origMat.transparent,
              opacity: origMat && 'opacity' in origMat ? Number(origMat.opacity) : 1,
              side: THREE.FrontSide
            });
            mat.name = `${child.name} ${(origMat && origMat.name) || ''}`.toLowerCase();
            return mat;
          });
          child.material = Array.isArray(child.material) ? newMats : newMats[0];
        }
      });

      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      const maxBound = Math.max(size.y, size.z * 0.45, size.x * 0.75, 1.0);
      const baseScale = (this.sex === 'female' ? 2.3 : 2.45) / maxBound;
      const growthFactor = 0.4 + 0.6 * this.growth;

      const group = new THREE.Group();
      group.scale.setScalar(baseScale * growthFactor);
      model.position.set(-center.x, -box.min.y, -center.z);
      group.add(model);

      this.scene.add(group);
      this.dinoModel = group;

      if (this.controls) {
        this.controls.target.set(0, (size.y * baseScale * growthFactor) * 0.45, 0);
      }

      this.updateMaterialTexture();

      if (loadingElem) loadingElem.style.display = 'none';
    } catch (err) {
      console.warn(`Lỗi tải 3D cho ${speciesName}:`, err);
      if (loadingElem) loadingElem.style.display = 'none';
    }
  },

  applyExclusivePreset() {
    this.isExclusiveHacBang = true;
    this.pattern = 1;
    this.variation = 0;
    this.theme = 0;
    this.palette = {
      body: '#06080E',
      markings: '#00D9FF',
      underbelly: '#EEF8FF',
      flank: '#00E5FF',
      detail: '#6889A6',
      male_display: '#00FFFF',
      eyes: '#00FFFF',
      teeth: '#EEF8FF',
      mouth: '#0A2233',
      claws: '#00D9FF'
    };
    const nameInput = document.getElementById('design-name');
    if (nameInput) nameInput.value = '👑 Màu Độc Quyền - Hắc Băng Lôi Điện';
    this.renderPatternChips();
    this.renderChannels();
    this.updateMaterialTexture();
    this.updateSkinCodeDisplay();
    this.showToast(`👑 Đã nạp Màu Độc Quyền (Hắc Băng Lôi Điện) chuẩn 100% lên ${this.species}!`, 'success');
  },

  async applyExclusivePresetInGame() {
    this.applyExclusivePreset();
    await this.applyInGame();
  },

  updateMaterialTexture() {
    if (!this.dinoModel) return;
    const tex = this.cachedTextures[this.species];
    if (!tex || !tex.diffuse) return;

    const hexToRgb = (hex) => {
      const t = (hex || '#5A6B48').replace('#', '');
      const val = parseInt(t.length === 3 ? t.split('').map(c => c + c).join('') : t, 16) || 0;
      return { r: (val >> 16) & 255, g: (val >> 8) & 255, b: val & 255 };
    };
    const lerp = (a, b, t) => Math.round(a * (1 - t) + b * t);
    const clamp01 = (v) => Math.max(0, Math.min(1, v));
    const distToSeg = (px, py, x1, y1, x2, y2) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const l2 = dx * dx + dy * dy;
      if (l2 === 0) return [Math.hypot(px - x1, py - y1), 0];
      const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / l2));
      return [Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy)), t];
    };

    const canvas = document.createElement('canvas');
    const width = 1024;
    const height = 1024;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.drawImage(tex.diffuse, 0, 0, width, height);
    const outData = ctx.getImageData(0, 0, width, height);

    if (tex.pattern && tex.tintMask) {
      const patCanvas = document.createElement('canvas');
      patCanvas.width = width; patCanvas.height = height;
      const patCtx = patCanvas.getContext('2d', { willReadFrequently: true });
      patCtx.drawImage(tex.pattern, 0, 0, width, height);
      const patData = patCtx.getImageData(0, 0, width, height);

      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = width; maskCanvas.height = height;
      const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
      maskCtx.drawImage(tex.tintMask, 0, 0, width, height);
      const maskData = maskCtx.getImageData(0, 0, width, height);

      const bodyRgb = hexToRgb(this.palette.body || '#06080E');
      const markingsRgb = hexToRgb(this.palette.markings || '#00D9FF');
      const flankRgb = hexToRgb(this.palette.flank || '#06080E');
      const underbellyRgb = hexToRgb(this.palette.underbelly || '#EEF8FF');
      const detailRgb = hexToRgb(this.palette.detail || '#6889A6');
      const displayRgb = hexToRgb(this.palette.male_display || this.palette.display || '#00D9FF');
      const isDisplayBlack = displayRgb.r === 0 && displayRgb.g === 0 && displayRgb.b === 0;

      const isHacBang = Boolean(
        this.isExclusiveHacBang ||
        (bodyRgb.r <= 20 && bodyRgb.g <= 25 && bodyRgb.b <= 38 && markingsRgb.b >= 200 && markingsRgb.g >= 170)
      );

      const data = outData.data;
      const pData = patData.data;
      const mData = maskData.data;
      const uv3d = tex.uv3d;

      if (isHacBang && uv3d) {
        const { SW, SH, bufX, bufY, bufZ, bufV, yTopSmooth, NBINS } = uv3d;

        const bolts = [
          // 1. ĐẦU, MÕM, MÁ, TRÁN & HÀM DƯỚI (Head, Snout, Cheek, Brow & Jaw: zn = 0.76..0.96, yn = 0.34..0.82)
          [0.77, 0.57, 0.87, 0.51, 0.017, 1.04],
          [0.87, 0.51, 0.95, 0.44, 0.015, 1.00],
          [0.77, 0.48, 0.86, 0.41, 0.016, 1.00],
          [0.80, 0.43, 0.90, 0.36, 0.014, 0.96],
          [0.74, 0.60, 0.77, 0.84, 0.016, 1.00],
          // 2. CỔ & ỨC TRƯỚC (Neck & Throat: zn = 0.68..0.80, yn = 0.28..0.60)
          [0.71, 0.59, 0.72, 0.42, 0.015, 1.02],
          [0.72, 0.42, 0.68, 0.28, 0.014, 0.98],
          [0.75, 0.55, 0.76, 0.36, 0.013, 0.96],
          [0.79, 0.50, 0.80, 0.35, 0.012, 0.94],
          // 3. LƯNG TRÊN, LƯNG GIỮA & LƯNG SAU (Shoulder, Upper/Mid/Rear Back: zn = 0.28..0.67, yn = 0.48..0.66)
          [0.67, 0.35, 0.60, 0.53, 0.017, 1.06],
          [0.60, 0.53, 0.49, 0.66, 0.016, 1.04],
          [0.63, 0.42, 0.56, 0.55, 0.013, 0.96],
          [0.56, 0.55, 0.47, 0.62, 0.012, 0.94],
          [0.58, 0.58, 0.44, 0.63, 0.016, 1.02],
          [0.44, 0.63, 0.31, 0.57, 0.015, 1.00],
          [0.51, 0.59, 0.38, 0.50, 0.014, 0.96],
          [0.39, 0.57, 0.27, 0.48, 0.014, 0.95],
          // 4. BỤNG DƯỚI & LỒNG NGỰC (Belly & Under-Ribcage: zn = 0.36..0.66, yn = 0.23..0.38)
          [0.66, 0.27, 0.52, 0.33, 0.018, 1.04],
          [0.52, 0.25, 0.38, 0.32, 0.018, 1.04],
          [0.60, 0.24, 0.44, 0.27, 0.016, 1.00],
          // 5. CHÂN TRƯỚC & CHÂN SAU (Front & Hind Legs: zn = 0.61..0.70 & 0.34..0.46, yn = 0.05..0.46)
          [0.66, 0.35, 0.63, 0.19, 0.016, 1.02],
          [0.63, 0.19, 0.66, 0.06, 0.014, 0.98],
          [0.64, 0.24, 0.68, 0.11, 0.012, 0.92],
          [0.68, 0.33, 0.67, 0.14, 0.013, 0.94],
          [0.36, 0.47, 0.40, 0.31, 0.017, 1.02],
          [0.40, 0.31, 0.43, 0.17, 0.015, 0.98],
          [0.43, 0.17, 0.41, 0.06, 0.014, 0.96],
          [0.41, 0.28, 0.45, 0.15, 0.012, 0.92],
          [0.38, 0.43, 0.37, 0.16, 0.014, 0.95],
          // 6. ĐUÔI (Tail: zn = 0.06..0.35, yn = 0.35..0.47)
          [0.35, 0.46, 0.23, 0.41, 0.015, 1.00],
          [0.23, 0.41, 0.08, 0.37, 0.014, 0.98],
          [0.27, 0.43, 0.15, 0.36, 0.012, 0.92]
        ];

        const flameTongues = [
          [0.61, 0.28, 0.53, 0.55, 0.040],
          [0.57, 0.26, 0.48, 0.53, 0.048],
          [0.53, 0.25, 0.44, 0.47, 0.046],
          [0.48, 0.25, 0.41, 0.41, 0.042],
          [0.62, 0.30, 0.56, 0.51, 0.032],
          [0.44, 0.27, 0.38, 0.39, 0.036]
        ];

        const frillRays = [
          [0.00, 0.55, 0.00, 0.79, 0.040, 1.00],
          [0.03, 0.57, 0.15, 0.73, 0.026, 0.95],
          [0.09, 0.64, 0.22, 0.71, 0.018, 0.85],
          [0.05, 0.56, 0.29, 0.70, 0.028, 0.95],
          [0.16, 0.62, 0.35, 0.66, 0.018, 0.85],
          [0.06, 0.55, 0.42, 0.65, 0.026, 0.92],
          [0.22, 0.59, 0.46, 0.61, 0.018, 0.82],
          [0.07, 0.54, 0.48, 0.58, 0.024, 0.90]
        ];

        for (let y = 0; y < height; y++) {
          const sy = Math.min(SH - 1, (y * SH) >> 10);
          const rowOff = sy * SW;
          for (let x = 0; x < width; x++) {
            const i = (y * width + x) << 2;
            if (data[i + 3] === 0) continue;

            const dr = data[i];
            const dg = data[i + 1];
            const db = data[i + 2];
            const t = mData[i] / 255.0;
            const rMask = mData[i + 1] / 255.0;
            const nMask = mData[i + 2] / 255.0;
            const patVal = (pData[i] + pData[i + 1] + pData[i + 2]) / 765.0;

            const lum = (0.299 * dr + 0.587 * dg + 0.114 * db) / 255.0;
            const sc = clamp01((lum - 0.16) / 0.70);
            const scPow = sc * sc * (3.0 - 2.0 * sc);
            const spec = Math.pow(Math.max(0.0, (lum - 0.50) / 0.50), 1.80);

            let outR = (bodyRgb.r * 0.35) + scPow * 16.0 + spec * 36.0;
            let outG = (bodyRgb.g * 0.35) + scPow * 22.0 + spec * 48.0;
            let outB = (bodyRgb.b * 0.42) + scPow * 32.0 + spec * 66.0;

            // A0. Kết hợp vân hoa văn gốc (tint_mask 001 Flank, 011 Body, 010 Underbelly) tạo đường sáng tự nhiên trên lưng, bụng, chân, đầu
            const wFlank = (1.0 - t) * (1.0 - rMask) * nMask;
            const wBodyStripes = (1.0 - t) * rMask * nMask;
            const wBelly = (1.0 - t) * rMask * (1.0 - nMask);
            const natStripe = clamp01((wFlank * 0.85 + wBodyStripes * 1.15 + wBelly * 0.75) * Math.max(0.42, patVal * 1.35));
            if (natStripe > 0.18) {
              const sBlend = Math.min(0.88, (natStripe - 0.18) * 1.45) * (0.55 + 0.55 * sc);
              const useIce = natStripe > 0.68;
              const nr = useIce ? underbellyRgb.r : markingsRgb.r;
              const ng = useIce ? underbellyRgb.g : markingsRgb.g;
              const nb = useIce ? underbellyRgb.b : markingsRgb.b;
              outR = outR * (1.0 - sBlend) + nr * sBlend;
              outG = outG * (1.0 - sBlend) + ng * sBlend;
              outB = outB * (1.0 - sBlend) + nb * sBlend;
            }

            const sx = Math.min(SW - 1, (x * SW) >> 10);
            const idx = rowOff + sx;
            if (bufV[idx]) {
              const xn = bufX[idx];
              const yn = bufY[idx];
              const zn = bufZ[idx];

              const n1 = Math.sin(zn * 125.0 + yn * 85.0) * 0.5 + Math.cos(zn * 230.0 - yn * 175.0) * 0.35 + (lum - 0.5) * 0.25;
              const jZn = zn + n1 * 0.0075;
              const jYn = yn + Math.cos(zn * 155.0 + yn * 105.0) * 0.0065;

              // A. Hàng gai sống lưng & đuôi (Dorsal Spines)
              const zBin = Math.min(NBINS - 1, Math.max(0, Math.floor(zn * NBINS)));
              const yTop = yTopSmooth[zBin];
              if (zn >= 0.05 && zn <= 0.65 && yn > 0.35 && xn < 0.075) {
                const distTop = Math.max(0.0, yTop - yn);
                const spineBand = zn > 0.25 ? 0.026 : 0.019;
                if (distTop < spineBand) {
                  const slantZ = zn + distTop * 0.55;
                  const phase = (slantZ * 28.0) % 1.0;
                  const toothH = clamp01(0.84 - Math.abs(phase - 0.42) * 2.0);
                  if (distTop < spineBand * toothH) {
                    let spineT = 1.0 - (distTop / Math.max(0.001, spineBand * toothH));
                    const xFade = clamp01((0.075 - xn) / 0.045);
                    spineT *= xFade;
                    if (spineT > 0.10) {
                      let sr, sg, sb;
                      if (spineT < 0.52) {
                        sr = markingsRgb.r; sg = markingsRgb.g; sb = markingsRgb.b;
                      } else {
                        const tw = (spineT - 0.52) / 0.48;
                        sr = markingsRgb.r * (1.0 - tw) + underbellyRgb.r * tw;
                        sg = markingsRgb.g * (1.0 - tw) + underbellyRgb.g * tw;
                        sb = markingsRgb.b * (1.0 - tw) + underbellyRgb.b * tw;
                      }
                      const scaleM = 0.65 + 0.50 * sc;
                      const blend = Math.min(1.0, spineT * 1.6);
                      outR = outR * (1.0 - blend) + sr * scaleM * blend;
                      outG = outG * (1.0 - blend) + sg * scaleM * blend;
                      outB = outB * (1.0 - blend) + sb * scaleM * blend;
                    }
                  }
                }
              }

              // B. Vân tia sét tỏa ra trong mào (Frill Inner Radial Veins)
              if (zn >= 0.71 && zn <= 0.83 && yn >= 0.52 && yn <= 0.80 && t > 0.45) {
                const jXn = xn + Math.sin(yn * 140.0 + xn * 90.0) * 0.010;
                let bestFrill = 0.0;
                for (let k = 0; k < frillRays.length; k++) {
                  const [fx1, fy1, fx2, fy2, fw, fint] = frillRays[k];
                  const [dF, tF] = distToSeg(jXn, jYn, fx1, fy1, fx2, fy2);
                  const curFw = fw * (1.0 - 0.55 * tF);
                  if (dF < curFw) {
                    const vf = (1.0 - dF / curFw) * fint;
                    if (vf > bestFrill) bestFrill = vf;
                  }
                }
                if (bestFrill > 0.10) {
                  let vr, vg, vb;
                  if (bestFrill < 0.50) {
                    vr = markingsRgb.r; vg = markingsRgb.g; vb = markingsRgb.b;
                  } else if (bestFrill < 0.72) {
                    vr = detailRgb.r; vg = Math.min(255, detailRgb.g + 45); vb = Math.min(255, detailRgb.b + 55);
                  } else {
                    vr = underbellyRgb.r; vg = underbellyRgb.g; vb = underbellyRgb.b;
                  }
                  const scaleM = 0.58 + 0.58 * sc;
                  const bf = Math.min(1.0, (bestFrill - 0.08) * 3.2);
                  outR = outR * (1.0 - bf) + vr * scaleM * bf;
                  outG = outG * (1.0 - bf) + vg * scaleM * bf;
                  outB = outB * (1.0 - bf) + vb * scaleM * bf;
                }
              }

              // C. Vùng lửa băng bên sườn dưới / bụng (Lower Ribcage & Belly Flame Patch)
              if (zn >= 0.36 && zn <= 0.65 && yn >= 0.20 && yn <= 0.56) {
                let flameVal = 0.0;
                const dzB = (jZn - 0.510) / 0.105;
                const dyB = (jYn - 0.300) / 0.082;
                const baseD = Math.hypot(dzB, dyB);
                if (baseD < 1.0) {
                  flameVal = (1.0 - baseD) * 0.98;
                }
                for (let k = 0; k < flameTongues.length; k++) {
                  const [fz1, fy1, fz2, fy2, fw] = flameTongues[k];
                  const tEst = clamp01((jYn - fy1) / Math.max(0.01, fy2 - fy1));
                  const curveZ = Math.sin(tEst * Math.PI) * 0.014;
                  const [dSeg, tSeg] = distToSeg(jZn + curveZ, jYn, fz1, fy1, fz2, fy2);
                  const curW = fw * (1.0 - 0.72 * tSeg);
                  if (dSeg < curW) {
                    const vf = (1.0 - dSeg / curW) * (1.0 - 0.08 * tSeg);
                    if (vf > flameVal) flameVal = vf;
                  }
                }
                if (flameVal > 0.12) {
                  let fr, fg, fb;
                  if (flameVal < 0.42) {
                    fr = markingsRgb.r; fg = markingsRgb.g; fb = markingsRgb.b;
                  } else if (flameVal < 0.66) {
                    fr = detailRgb.r; fg = Math.min(255, detailRgb.g + 28); fb = Math.min(255, detailRgb.b + 38);
                  } else {
                    fr = underbellyRgb.r; fg = underbellyRgb.g; fb = underbellyRgb.b;
                  }
                  const scaleMod = 0.52 + 0.64 * sc;
                  const bFl = Math.min(1.0, (flameVal - 0.10) * 3.2);
                  outR = outR * (1.0 - bFl) + fr * scaleMod * bFl;
                  outG = outG * (1.0 - bFl) + fg * scaleMod * bFl;
                  outB = outB * (1.0 - bFl) + fb * scaleMod * bFl;
                }
              }

              // D. Tia sét Trắng băng & Xanh ngọc xé dọc đầu, lưng, bụng, chân, đuôi (Diagonal Lightning Bolts)
              let bestBolt = 0.0;
              for (let k = 0; k < bolts.length; k++) {
                const [bz1, by1, bz2, by2, bw, bint] = bolts[k];
                const [dB, tB] = distToSeg(jZn, jYn, bz1, by1, bz2, by2);
                const endTaper = Math.min(1.0, Math.min(tB * 4.5, (1.0 - tB) * 4.0) + 0.20);
                const effW = bw * endTaper;
                if (dB < effW) {
                  const bVal = (1.0 - dB / effW) * bint;
                  if (bVal > bestBolt) bestBolt = bVal;
                }
              }
              if (bestBolt > 0.10) {
                let lr, lg, lb;
                if (bestBolt < 0.48) {
                  lr = markingsRgb.r; lg = markingsRgb.g; lb = markingsRgb.b;
                } else if (bestBolt < 0.66) {
                  lr = detailRgb.r; lg = Math.min(255, detailRgb.g + 45); lb = Math.min(255, detailRgb.b + 55);
                } else {
                  lr = underbellyRgb.r; lg = underbellyRgb.g; lb = underbellyRgb.b;
                }
                const scaleMod = 0.58 + 0.58 * sc;
                const bLt = Math.min(1.0, (bestBolt - 0.08) * 3.5);
                outR = outR * (1.0 - bLt) + lr * scaleMod * bLt;
                outG = outG * (1.0 - bLt) + lg * scaleMod * bLt;
                outB = outB * (1.0 - bLt) + lb * scaleMod * bLt;
              }

              // E. Đầu móng chân Xanh ngọc & Trắng băng (Claw Tips Only)
              if (yn < 0.024) {
                const clawT = clamp01((0.024 - yn) / 0.024);
                const cr = (markingsRgb.r * (1.0 - clawT) + underbellyRgb.r * clawT) * (0.65 + 0.5 * sc);
                const cg = (markingsRgb.g * (1.0 - clawT) + underbellyRgb.g * clawT) * (0.65 + 0.5 * sc);
                const cb = (markingsRgb.b * (1.0 - clawT) + underbellyRgb.b * clawT) * (0.65 + 0.5 * sc);
                const bCl = Math.min(1.0, clawT * 1.8);
                outR = outR * (1.0 - bCl) + cr * bCl;
                outG = outG * (1.0 - bCl) + cg * bCl;
                outB = outB * (1.0 - bCl) + cb * bCl;
              }
            }

            data[i] = Math.min(255, Math.max(0, Math.round(outR)));
            data[i + 1] = Math.min(255, Math.max(0, Math.round(outG)));
            data[i + 2] = Math.min(255, Math.max(0, Math.round(outB)));
          }
        }
      } else {
        const len = data.length;
        for (let i = 0; i < len; i += 4) {
          if (data[i + 3] === 0) continue;
          const t = mData[i] / 255.0;
          const r = mData[i + 1] / 255.0;
          const n = mData[i + 2] / 255.0;
          const patVal = (pData[i] + pData[i + 1] + pData[i + 2]) / 765.0;

          const baseR = data[i];
          const baseG = data[i + 1];
          const baseB = data[i + 2];

          // 101 Magenta (m) = Main Upper Body/Back/Head; 011 Cyan (u) = Lower Ribcage Markings
          const m = t * (1 - r) * n;
          const u = (1 - t) * r * n * patVal;
          const j = (1 - t) * (1 - r) * n;
          const w = (1 - t) * r * (1 - n);
          const N = t * r * (1 - n) * patVal;
          const C = t * (1 - r) * (1 - n) * Math.max(0.35, patVal);
          const S = u + m + j + w + N + C;
          const L = S > 0 ? S : 1;

          const M = (bodyRgb.r * m + markingsRgb.r * u + flankRgb.r * j + underbellyRgb.r * w + detailRgb.r * N + displayRgb.r * C) / L;
          const E = (bodyRgb.g * m + markingsRgb.g * u + flankRgb.g * j + underbellyRgb.g * w + detailRgb.g * N + displayRgb.g * C) / L;
          const F = (bodyRgb.b * m + markingsRgb.b * u + flankRgb.b * j + underbellyRgb.b * w + detailRgb.b * N + displayRgb.b * C) / L;

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

          data[i] = P;
          data[i + 1] = B;
          data[i + 2] = U;
        }
      }
      ctx.putImageData(outData, 0, 0);
    }

    const newTex = new THREE.CanvasTexture(canvas);
    newTex.flipY = false;
    newTex.colorSpace = THREE.SRGBColorSpace;

    const eyesColor = new THREE.Color(this.palette.eyes || '#00FFFF');
    const defaultWhite = new THREE.Color('#ffffff');

    this.dinoModel.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        for (const mat of mats) {
          const matName = (mat.name || '').toLowerCase();
          mat.map = newTex;
          mat.color.copy(defaultWhite);
          mat.emissive.set('#000000');
          mat.emissiveIntensity = 0;

          if (/eye|iris|pupil/.test(matName)) {
            mat.color.copy(eyesColor);
            mat.emissive.copy(eyesColor);
            mat.emissiveIntensity = 0.45;
            mat.map = null;
          }
          mat.needsUpdate = true;
        }
      }
    });
  },

  renderChannels() {
    const list = document.getElementById('channel-list');
    if (!list) return;
    list.innerHTML = '';

    this.channelDefs.forEach(ch => {
      const row = document.createElement('div');
      row.className = 'channel-row';

      const curColor = this.palette[ch.id] || '#5A6B48';

      row.innerHTML = `
        <div class="channel-info">
          <div class="channel-swatch-box" style="background-color: ${curColor};">
            <input type="color" class="channel-picker-input" value="${curColor}" data-channel="${ch.id}">
          </div>
          <div>
            <div class="channel-name">${ch.label}</div>
            <div class="channel-sub">${ch.sub}</div>
          </div>
        </div>
        <div class="channel-right">
          <span class="channel-hex" id="hex-${ch.id}">${curColor.toUpperCase()}</span>
        </div>
      `;

      const input = row.querySelector('.channel-picker-input');
      const box = row.querySelector('.channel-swatch-box');
      const hexSpan = row.querySelector(`#hex-${ch.id}`);

      input.addEventListener('input', (e) => {
        const val = e.target.value;
        this.palette[ch.id] = val;
        box.style.backgroundColor = val;
        hexSpan.textContent = val.toUpperCase();
        this.updateMaterialTexture();
        this.updateSkinCodeDisplay();
      });

      list.appendChild(row);
    });

    this.updateSkinCodeDisplay();
  },

  renderPatternChips() {
    const container = document.getElementById('pattern-chips');
    if (!container) return;
    container.innerHTML = '';

    for (let i = 0; i < 5; i++) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `pattern-chip ${this.pattern === i ? 'active' : ''}`;
      chip.textContent = `Pattern ${i + 1}`;
      chip.addEventListener('click', () => {
        this.pattern = i;
        this.renderPatternChips();
        this.updateMaterialTexture();
        this.updateSkinCodeDisplay();
      });
      container.appendChild(chip);
    }
  },

  randomise() {
    this.isExclusiveHacBang = false;
    const naturalTones = [
      '#2b3a2a', '#44533c', '#5e6f53', '#7a896d', '#8c9c7e',
      '#403020', '#5c4530', '#7b5e43', '#9c7959', '#bfa07d',
      '#20242b', '#353c48', '#4b5566', '#677388', '#8694ab',
      '#3b1c1c', '#592929', '#7a3838', '#9e4a4a', '#c46666',
      '#e08f24', '#f59e0b', '#d97706', '#b45309', '#78350f'
    ];
    const pick = () => naturalTones[Math.floor(Math.random() * naturalTones.length)];

    this.palette.body = pick();
    this.palette.markings = pick();
    this.palette.flank = pick();
    this.palette.underbelly = pick();
    this.palette.detail = pick();
    this.palette.male_display = pick();
    this.palette.eyes = pick();
    this.palette.teeth = '#dedede';
    this.palette.mouth = '#a83c24';
    this.palette.claws = '#1a1818';

    this.renderChannels();
    this.updateMaterialTexture();
    this.showToast('🎲 Đã tạo màu ngẫu nhiên!');
  },

  generateSkinCode() {
    const p = this.palette;
    const num = `${this.pattern}${this.variation}${this.theme}`;
    if (this.isExclusiveHacBang) {
      return `${this.species}${num}06080EFF06080EFF00D9FFFFD1FAFFFF00F2FFFF00FFFFFF`;
    }
    const cleanHex = (h) => (h || '#5A6B48').replace('#', '').toUpperCase().padEnd(6, '0').slice(0, 6) + 'FF';
    const hexes = [
      cleanHex(p.underbelly), cleanHex(p.body), cleanHex(p.flank),
      cleanHex(p.markings), cleanHex(p.male_display), cleanHex(p.eyes)
    ].join('');
    return `${this.species}${num}${hexes}`;
  },

  generateBlueprintJson() {
    const hexToFloatRgba = (hex) => {
      const clean = (hex || '#808080').replace('#', '');
      const num = parseInt(clean, 16) || 0;
      const r = ((num >> 16) & 255) / 255.0;
      const g = ((num >> 8) & 255) / 255.0;
      const b = (num & 255) / 255.0;
      return [Number(r.toFixed(4)), Number(g.toFixed(4)), Number(b.toFixed(4)), 1.0];
    };

    if (this.isExclusiveHacBang) {
      return {
        class: `BP_${this.species.replace(/[^a-zA-Z0-9]/g, '')}_C`,
        female: this.sex === 'female',
        variation: this.variation,
        pattern: this.pattern,
        theme: this.theme,
        body: [0.003, 0.005, 0.01, 1.0],
        underbelly: [0.003, 0.005, 0.01, 1.0],
        flank: [0.0, 0.85, 1.0, 1.0],
        markings: [0.82, 0.98, 1.0, 1.0],
        detail1: [0.0, 0.88, 1.0, 1.0],
        male_display: [0.0, 0.95, 1.0, 1.0],
        eyes: [0.0, 1.0, 1.0, 1.0],
        teeth: [0.93, 0.97, 1.0, 1.0],
        mouth: [0.02, 0.08, 0.14, 1.0],
        claws: [0.0, 0.85, 1.0, 1.0]
      };
    }

    return {
      class: `BP_${this.species.replace(/[^a-zA-Z0-9]/g, '')}_C`,
      female: this.sex === 'female',
      variation: this.variation,
      pattern: this.pattern,
      theme: this.theme,
      body: hexToFloatRgba(this.palette.body),
      markings: hexToFloatRgba(this.palette.markings),
      flank: hexToFloatRgba(this.palette.flank),
      underbelly: hexToFloatRgba(this.palette.underbelly),
      detail1: hexToFloatRgba(this.palette.detail),
      eyes: hexToFloatRgba(this.palette.eyes),
      male_display: hexToFloatRgba(this.palette.male_display),
      teeth: hexToFloatRgba(this.palette.teeth),
      mouth: hexToFloatRgba(this.palette.mouth),
      claws: hexToFloatRgba(this.palette.claws)
    };
  },

  updateSkinCodeDisplay() {
    const code = this.generateSkinCode();
    const box = document.getElementById('skin-code-display');
    if (box) box.value = code;
  },

  // ==========================================
  // EXTERNAL MOD SKIN PARSER & VALIDATOR
  // ==========================================
  importExternalModSkin(rawContent) {
    if (!rawContent || !rawContent.trim()) {
      this.showToast('Vui lòng cung cấp nội dung mod skin!', 'error');
      return false;
    }

    const text = rawContent.trim();
    let detectedSpecies = null;
    let detectedPattern = 0;
    let detectedSex = this.sex;
    let newPalette = { ...this.palette };

    const floatToHex = (arr) => {
      if (!Array.isArray(arr) || arr.length < 3) return null;
      const to255 = (v) => Math.max(0, Math.min(255, Math.round(v <= 1.0 ? v * 255 : v)));
      const r = to255(arr[0]).toString(16).padStart(2, '0');
      const g = to255(arr[1]).toString(16).padStart(2, '0');
      const b = to255(arr[2]).toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    };

    const normalizeColor = (val) => {
      if (!val) return null;
      if (typeof val === 'string') {
        const clean = val.trim().replace(/^0x/i, '').replace('#', '');
        if (clean.length === 6 || clean.length === 8) {
          return `#${clean.slice(0, 6)}`;
        }
      }
      if (Array.isArray(val)) {
        return floatToHex(val);
      }
      if (typeof val === 'object' && val.r !== undefined) {
        return floatToHex([val.r, val.g, val.b]);
      }
      return null;
    };

    let isJson = false;
    let parsedJson = null;
    try {
      parsedJson = JSON.parse(text);
      isJson = true;
    } catch (e) {
      isJson = false;
    }

    if (isJson && parsedJson) {
      const data = parsedJson.payload || parsedJson.skin || parsedJson.recipe || parsedJson;

      const rawClass = data.class || data.blueprint || data.character || '';
      if (rawClass) {
        const m = rawClass.match(/BP_([a-zA-Z0-9]+)_C/i) || rawClass.match(/([a-zA-Z]+)/);
        if (m) detectedSpecies = m[1];
      }
      if (!detectedSpecies && (data.species || data.dino || data.dinosaur)) {
        detectedSpecies = data.species || data.dino || data.dinosaur;
      }

      if (data.pattern !== undefined) detectedPattern = parseInt(data.pattern, 10) || 0;
      if (data.female !== undefined) detectedSex = data.female ? 'female' : 'male';
      if (data.sex) detectedSex = String(data.sex).toLowerCase().includes('fe') ? 'female' : 'male';

      const colorSource = data.palette || data.colors || data;
      const keyMap = {
        body: ['body', 'primary', 'skin', 'base', 'base_color', 'diffuse'],
        markings: ['markings', 'stripes', 'spots', 'pattern', 'pattern_color'],
        flank: ['flank', 'secondary', 'side', 'sides'],
        underbelly: ['underbelly', 'belly', 'throat', 'tertiary'],
        detail: ['detail', 'detail1', 'accent', 'horns', 'scutes'],
        male_display: ['male_display', 'display', 'crest', 'feathers', 'quills', 'dewlap'],
        eyes: ['eyes', 'eye', 'iris'],
        teeth: ['teeth', 'tooth'],
        mouth: ['mouth', 'tongue', 'gums'],
        claws: ['claws', 'talons', 'nails']
      };

      for (const [targetChannel, aliases] of Object.entries(keyMap)) {
        for (const alias of aliases) {
          if (colorSource[alias] !== undefined) {
            const hex = normalizeColor(colorSource[alias]);
            if (hex) {
              newPalette[targetChannel] = hex;
              break;
            }
          }
        }
      }
    } else {
      const match = text.match(/^([A-Za-z]+?)(\d{3,})((?:[0-9A-Fa-f]{8})+)$/);
      if (match) {
        detectedSpecies = match[1];
        const digits = match[2];
        detectedPattern = parseInt(digits.length > 2 ? digits.slice(0, -2) : digits[0], 10) || 0;

        const hexPart = match[3];
        const hexList = [];
        for (let i = 0; i < hexPart.length; i += 8) {
          hexList.push('#' + hexPart.slice(i, i + 6));
        }

        const zones = ['underbelly', 'body', 'flank', 'markings', 'male_display', 'eyes'];
        zones.forEach((z, idx) => {
          if (idx < hexList.length) newPalette[z] = hexList[idx];
        });
      } else {
        this.showToast('Không thể nhận diện định dạng mod skin! Hãy kiểm tra lại file.', 'error');
        return false;
      }
    }

    if (detectedSpecies) {
      const found = this.speciesList.find(s => s.id.toLowerCase() === detectedSpecies.toLowerCase());
      if (found) {
        this.species = found.id;
      }
    }

    this.pattern = detectedPattern;
    this.sex = detectedSex;
    this.palette = newPalette;

    this.updateSexButtons();
    this.populateSpeciesSelector();
    this.renderChannels();
    this.renderPatternChips();
    this.loadSpecies(this.species);

    const alertBox = document.getElementById('mod-import-status');
    if (alertBox) {
      alertBox.className = 'status-alert status-success';
      alertBox.innerHTML = `✅ <b>Nạp Mod Skin thành công!</b> Loài: <i>${this.species}</i> (Pattern ${this.pattern + 1}). Sẵn sàng áp dụng vào server!`;
      alertBox.style.display = 'flex';
    }

    this.showToast(`✅ Đã nạp thành công Mod Skin (${this.species})!`, 'success');
    return true;
  },

  // Apply in Game (Connects to backend /api/studio/apply with SteamID)
  async applyInGame() {
    const stored = this.getStoredSteamUser();
    const steamId = (this.steamUser && this.steamUser.steamId) || (stored && stored.steamId) || '';

    if (!steamId) {
      this.showToast('⚠️ Bạn chưa đăng nhập Steam! Hãy đăng nhập Steam để áp dụng skin vào khủng long của bạn.', 'error');
      const confirmLogin = window.confirm('Bạn cần liên kết tài khoản Steam để áp dụng Skin vào khủng long trong Server.\n\nBấm OK để chuyển tới trang Đăng nhập Steam ngay!');
      if (confirmLogin) {
        window.location.href = '/api/player/steam/login?redirect=%2Fstudio';
      }
      return;
    }

    const btn = document.getElementById('btn-apply-ingame');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span>⏳ Đang áp dụng vào Server...</span>';
    }

    const bpPayload = this.generateBlueprintJson();

    try {
      const res = await fetch(`/api/studio/apply?steam_id=${encodeURIComponent(steamId)}`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          steam_id: steamId,
          targetSteamId: steamId,
          species: this.species,
          sex: this.sex,
          pattern: this.pattern,
          variation: this.variation,
          theme: this.theme,
          palette: this.palette,
          payload: bpPayload,
          confirm: true
        })
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data && (data.ok || data.success)) {
        this.showToast(`🎉 THÀNH CÔNG! Đã áp dụng Skin lên khủng long của ${this.steamUser ? this.steamUser.name : steamId}!`, 'success');
        const alertBox = document.getElementById('mod-import-status');
        if (alertBox) {
          alertBox.className = 'status-alert status-success';
          alertBox.innerHTML = `⚡ <b>Skin đã áp dụng thành công cho SteamID ${steamId}!</b> Hãy kiểm tra khủng long của bạn trên đảo.`;
          alertBox.style.display = 'flex';
        }
      } else {
        const msg = (data && (data.message || data.error)) || 'Máy chủ IslePilot từ chối hoặc khủng long chưa spawn trong game.';
        this.showToast(`⚠️ Không áp dụng được: ${msg}`, 'error');
      }
    } catch (err) {
      this.showToast(`Lỗi kết nối máy chủ: ${err.message}`, 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    }
  },

  // Save current design to local & Steam server drafts
  async saveDesign() {
    const name = (document.getElementById('design-name')?.value || '').trim() || `${this.species} Custom`;
    const draft = {
      id: `skin_${Date.now()}`,
      name: name,
      species: this.species,
      sex: this.sex,
      pattern: this.pattern,
      palette: { ...this.palette },
      code: this.generateSkinCode(),
      date: new Date().toLocaleDateString('vi-VN')
    };

    this.savedSkins.unshift(draft);
    localStorage.setItem('3m_saved_skins', JSON.stringify(this.savedSkins));
    await this.syncSavedSkinsToServer();
    this.renderSavedSkins();
    this.showToast(`💾 Đã lưu thiết kế: "${name}"`, 'success');
  },

  async syncSavedSkinsToServer() {
    const sid = (this.steamUser && this.steamUser.steamId) || '';
    if (!sid) return;
    try {
      await fetch(`/api/player/skin-drafts?steam_id=${encodeURIComponent(sid)}`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drafts: this.savedSkins })
      });
    } catch (e) {}
  },

  async loadSavedSkins() {
    try {
      this.savedSkins = JSON.parse(localStorage.getItem('3m_saved_skins') || '[]');
    } catch (e) {
      this.savedSkins = [];
    }

    const sid = (this.steamUser && this.steamUser.steamId) || '';
    if (sid) {
      try {
        const res = await fetch(`/api/player/skin-drafts?steam_id=${encodeURIComponent(sid)}`, { credentials: 'same-origin' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.drafts) && data.drafts.length > 0) {
            const existingIds = new Set(this.savedSkins.map(s => s.id));
            data.drafts.forEach(d => {
              if (d && d.id && !existingIds.has(d.id)) {
                this.savedSkins.push(d);
              }
            });
            localStorage.setItem('3m_saved_skins', JSON.stringify(this.savedSkins));
          }
        }
      } catch (e) {}
    }

    this.renderSavedSkins();
  },

  renderSavedSkins() {
    const list = document.getElementById('saved-skins-list');
    if (!list) return;
    list.innerHTML = '';

    if (!this.savedSkins.length) {
      list.innerHTML = '<div style="color: var(--text-dim); font-size: 0.85rem; text-align: center; padding: 20px;">Chưa có bản thiết kế nào được lưu.</div>';
      return;
    }

    this.savedSkins.forEach((skin, idx) => {
      const card = document.createElement('div');
      card.className = 'saved-card';
      card.innerHTML = `
        <div>
          <div class="saved-info-name">${skin.name || skin.species}</div>
          <div class="saved-info-meta">${skin.species} · Pattern ${(skin.pattern || 0) + 1} · ${skin.date || ''}</div>
        </div>
        <div class="saved-actions">
          <button class="btn-deck" style="padding: 4px 10px; font-size: 0.75rem;" onclick="Studio.applySavedSkin(${idx})">Tải lên</button>
          <button class="btn-icon-subtle" onclick="Studio.deleteSavedSkin(${idx})" title="Xóa">🗑️</button>
        </div>
      `;
      list.appendChild(card);
    });
  },

  applySavedSkin(idx) {
    const skin = this.savedSkins[idx];
    if (!skin) return;

    this.species = skin.species || 'Tyrannosaurus';
    this.sex = skin.sex || 'male';
    this.pattern = skin.pattern || 0;
    this.palette = { ...this.palette, ...(skin.palette || {}) };
    this.designName = skin.name || this.species;

    const nameInput = document.getElementById('design-name');
    if (nameInput) nameInput.value = this.designName;

    this.updateSexButtons();
    this.populateSpeciesSelector();
    this.renderChannels();
    this.renderPatternChips();
    this.loadSpecies(this.species);

    this.switchTab('editor');
    this.showToast(`Đã mở bản lưu: ${this.designName}`);
  },

  async deleteSavedSkin(idx) {
    this.savedSkins.splice(idx, 1);
    localStorage.setItem('3m_saved_skins', JSON.stringify(this.savedSkins));
    await this.syncSavedSkinsToServer();
    this.renderSavedSkins();
    this.showToast('Đã xóa bản lưu.');
  },

  copyCode() {
    const code = this.generateSkinCode();
    navigator.clipboard.writeText(code).then(() => {
      this.showToast('📋 Đã sao chép mã Evrima Code!');
    });
  },

  copyJson() {
    const jsonStr = JSON.stringify(this.generateBlueprintJson(), null, 2);
    navigator.clipboard.writeText(jsonStr).then(() => {
      this.showToast('📋 Đã sao chép JSON Blueprint!');
    });
  },

  downloadJson() {
    const jsonStr = JSON.stringify(this.generateBlueprintJson(), null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.species}_${this.designName.replace(/\s+/g, '_')}_skin.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('💾 Đã tải xuống file mod skin!');
  },

  switchTab(tabId) {
    document.querySelectorAll('.deck-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));
    document.querySelectorAll('.deck-pane').forEach(p => p.style.display = p.id === `pane-${tabId}` ? 'flex' : 'none');
  },

  showToast(msg, type = 'normal') {
    let toast = document.getElementById('studio-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'studio-toast';
      toast.className = 'studio-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.borderColor = type === 'error' ? 'var(--accent)' : type === 'success' ? 'var(--success)' : 'rgba(255,255,255,0.2)';
    toast.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  },

  initEventListeners() {
    // Steam manual link & logout
    const btnManualSteam = document.getElementById('btn-studio-manual-steam');
    if (btnManualSteam) {
      btnManualSteam.addEventListener('click', () => this.promptManualSteamId());
    }

    const btnLogout = document.getElementById('btn-studio-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => this.logoutSteam());
    }

    // Sex toggle buttons
    const btnMale = document.getElementById('btn-sex-male');
    const btnFemale = document.getElementById('btn-sex-female');
    if (btnMale) {
      btnMale.addEventListener('click', () => {
        this.sex = 'male';
        this.updateSexButtons();
        this.loadSpecies(this.species);
      });
    }
    if (btnFemale) {
      btnFemale.addEventListener('click', () => {
        this.sex = 'female';
        this.updateSexButtons();
        this.loadSpecies(this.species);
      });
    }

    // Species dropdown
    const sel = document.getElementById('spec-select');
    if (sel) {
      sel.addEventListener('change', (e) => this.loadSpecies(e.target.value));
    }

    // Prev / Next species buttons
    const prevBtn = document.getElementById('spec-prev');
    const nextBtn = document.getElementById('spec-next');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        const idx = this.speciesList.findIndex(s => s.id === this.species);
        const nextIdx = (idx - 1 + this.speciesList.length) % this.speciesList.length;
        this.loadSpecies(this.speciesList[nextIdx].id);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const idx = this.speciesList.findIndex(s => s.id === this.species);
        const nextIdx = (idx + 1) % this.speciesList.length;
        this.loadSpecies(this.speciesList[nextIdx].id);
      });
    }

    // Growth slider
    const growthSlider = document.getElementById('growth-slider');
    const growthReadout = document.getElementById('growth-readout');
    if (growthSlider) {
      growthSlider.addEventListener('input', (e) => {
        this.growth = parseFloat(e.target.value) / 100.0;
        const pct = Math.round(this.growth * 100);
        const stageName = pct < 25 ? 'Hatchling (Con non)' : pct < 50 ? 'Juvenile (Mới lớn)' : pct < 75 ? 'Subadult (Tiền trưởng thành)' : 'Adult (Trưởng thành)';
        if (growthReadout) growthReadout.textContent = `${pct}% · ${stageName}`;

        if (this.dinoModel) {
          const factor = 0.4 + 0.6 * this.growth;
          this.dinoModel.scale.setScalar(factor);
        }
      });
    }

    // Auto-rotate toggle
    const arBtn = document.getElementById('btn-autorotate');
    if (arBtn) {
      arBtn.addEventListener('click', () => {
        this.autoRotate = !this.autoRotate;
        arBtn.classList.toggle('active', this.autoRotate);
      });
    }

    // Chamber Light Exposure
    const expSlider = document.getElementById('exposure-slider');
    if (expSlider) {
      expSlider.addEventListener('input', (e) => {
        this.exposure = parseFloat(e.target.value);
        if (this.renderer) this.renderer.toneMappingExposure = this.exposure;
      });
    }

    // Chamber preset color buttons
    document.querySelectorAll('.chamber-swatch').forEach(btn => {
      btn.addEventListener('click', () => {
        this.applyChamberPreset(btn.dataset.chamber);
      });
    });

    const customPicker = document.getElementById('bg-custom-picker');
    if (customPicker) {
      customPicker.addEventListener('input', (e) => {
        this.applyChamberPreset('custom', e.target.value);
      });
    }

    // Clean View button
    const cleanBtn = document.getElementById('btn-clean-view');
    if (cleanBtn) {
      cleanBtn.addEventListener('click', () => {
        const deck = document.querySelector('.studio-deck');
        const header = document.querySelector('.studio-header');
        const nav = document.querySelector('.specimen-nav');
        const chamber = document.querySelector('.chamber-controls');
        const foot = document.querySelector('.stage-foot');
        const hint = document.getElementById('viewport-hint');

        const isHidden = deck.style.display === 'none';
        deck.style.display = isHidden ? 'flex' : 'none';
        header.style.display = isHidden ? 'flex' : 'none';
        nav.style.display = isHidden ? 'flex' : 'none';
        chamber.style.display = isHidden ? 'flex' : 'none';
        foot.style.display = isHidden ? 'flex' : 'none';
        if (hint) hint.textContent = isHidden ? 'Kéo chuột để xoay 360° · Cuộn chuột để thu phóng' : 'Nhấp chuột bất kỳ đâu để hiện lại bảng điều khiển';
      });
    }

    // Deck tab clicks
    document.querySelectorAll('.deck-tab').forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });

    // File Drop Zone for External Mod Skins
    const dropzone = document.getElementById('mod-dropzone');
    const fileInput = document.getElementById('mod-file-input');

    if (dropzone && fileInput) {
      dropzone.addEventListener('click', () => fileInput.click());

      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });

      dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
      });

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files.length) {
          const file = e.dataTransfer.files[0];
          const reader = new FileReader();
          reader.onload = (event) => {
            this.importExternalModSkin(event.target.result);
          };
          reader.readAsText(file);
        }
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (event) => {
            this.importExternalModSkin(event.target.result);
          };
          reader.readAsText(file);
        }
      });
    }

    // Direct Mod text paste button
    const btnParseMod = document.getElementById('btn-parse-mod');
    if (btnParseMod) {
      btnParseMod.addEventListener('click', () => {
        const text = document.getElementById('mod-textarea')?.value;
        this.importExternalModSkin(text);
      });
    }

    const btnSync = document.getElementById('btn-sync-dino');
    if (btnSync) {
      btnSync.addEventListener('click', () => this.syncActiveDino(false));
    }

    const btnApply = document.getElementById('btn-apply-ingame');
    if (btnApply) {
      btnApply.addEventListener('click', () => this.applyInGame());
    }

    const btnRand = document.getElementById('btn-randomise');
    if (btnRand) {
      btnRand.addEventListener('click', () => this.randomise());
    }

    const btnSave = document.getElementById('btn-save-design');
    if (btnSave) {
      btnSave.addEventListener('click', () => this.saveDesign());
    }

    const btnCopyCode = document.getElementById('btn-copy-code');
    if (btnCopyCode) btnCopyCode.addEventListener('click', () => this.copyCode());

    const btnCopyJson = document.getElementById('btn-copy-json');
    if (btnCopyJson) btnCopyJson.addEventListener('click', () => this.copyJson());

    const btnDownload = document.getElementById('btn-download-json');
    if (btnDownload) btnDownload.addEventListener('click', () => this.downloadJson());
  }
};

window.Studio = Studio;
window.StudioApp = Studio;

document.addEventListener('DOMContentLoaded', () => {
  Studio.init();
});
