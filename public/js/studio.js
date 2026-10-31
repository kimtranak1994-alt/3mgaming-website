/**
 * 3MGAMING EVRIMA 3D SKIN STUDIO & MOD WORKSHOP
 * Fully featured local & web 3D Dino Skin Customizer matching Elysium Studio layout
 * Supports importing any external mod skin (.json / .txt / Evrima Code / Blueprint)
 */

const Studio = {
  // State
  species: 'Tyrannosaurus',
  sex: 'male',
  pattern: 0,
  variation: 0,
  theme: 0,
  growth: 1.0,
  designName: 'My Evrima Skin',

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
  chamberPreset: 'amber',
  exposure: 1.15,
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

  // Color layers
  palette: {
    body: '#4a543b',
    markings: '#2b3221',
    flank: '#647050',
    underbelly: '#c4baa1',
    detail: '#1f1512',
    male_display: '#a83c24',
    eyes: '#e08f24',
    teeth: '#dedede',
    mouth: '#a83c24',
    claws: '#1f1512'
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

  // Saved skins cache
  savedSkins: [],

  // Init
  init() {
    this.populateSpeciesSelector();
    this.initThree();
    this.initEventListeners();
    this.renderChannels();
    this.renderPatternChips();
    this.loadSavedSkins();
    this.loadSpecies(this.species);
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

    // Scene
    this.scene = new THREE.Scene();
    this.applyChamberPreset(this.chamberPreset);

    // Camera
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    this.camera.position.set(0, 1.4, 6.5);

    // Renderer
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

    // Controls
    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, canvas);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxPolarAngle = Math.PI / 2 + 0.05;
      this.controls.minDistance = 2.0;
      this.controls.maxDistance = 14.0;
      this.controls.target.set(0, 0.8, 0);
    }

    // Lights
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

    // Ground Grid / Pedestal
    const grid = new THREE.GridHelper(12, 24, 0xff2a85, 0x223046);
    grid.position.y = -0.01;
    this.scene.add(grid);

    // Start render loop
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

    // Window resize
    window.addEventListener('resize', () => {
      if (!this.renderer || !this.camera || !canvas.parentElement) return;
      const w = canvas.parentElement.clientWidth;
      const h = canvas.parentElement.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
  },

  // Apply Chamber Lighting & Background Presets
  applyChamberPreset(name, customHex = null) {
    this.chamberPreset = name;
    let colorSet = this.chamberColors[name] || this.chamberColors.amber;
    if (name === 'custom' && customHex) {
      colorSet = { bg: '#080a10', light: customHex, ground: '#151922' };
    }

    if (this.scene) {
      this.scene.background = new THREE.Color(colorSet.bg);
      this.scene.fog = new THREE.FogExp2(colorSet.bg, 0.05);
    }
    if (this.dirLight) {
      this.dirLight.color.set(colorSet.light);
    }
    if (this.ambientLight) {
      this.ambientLight.color.set(colorSet.light);
    }

    document.querySelectorAll('.chamber-swatch').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.chamber === name);
    });
  },

  // Load 3D Model with GLTF & dynamic texture composition
  async loadSpecies(speciesName) {
    this.species = speciesName;
    const loadingElem = document.getElementById('viewport-loading');
    if (loadingElem) loadingElem.style.display = 'block';

    const sel = document.getElementById('spec-select');
    if (sel) sel.value = speciesName;
    this.updateDietBadge();

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

      this.cachedTextures[speciesName] = {
        diffuse: diffImg,
        pattern: patImg,
        tintMask: maskImg
      };

      const model = gltf.scene;

      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const mat = new THREE.MeshStandardMaterial({
            color: '#ffffff',
            roughness: 0.95,
            metalness: 0.05,
            side: THREE.FrontSide
          });
          child.material = mat;
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
      this.showToast(`Đã tải loài: ${speciesName}`);
    } catch (err) {
      console.warn(`Lỗi tải 3D cho ${speciesName}:`, err);
      if (loadingElem) loadingElem.style.display = 'none';
      this.showToast(`Đang tải dữ liệu 3D cho ${speciesName}...`, 'info');
    }
  },

  // Compose dynamic textures (Diffuse + Pattern + Mask) according to user palette
  updateMaterialTexture() {
    if (!this.dinoModel) return;
    const tex = this.cachedTextures[this.species];
    if (!tex || !tex.diffuse) return;

    const hexToRgb = (hex) => {
      const t = (hex || '#5A6B48').replace('#', '');
      const val = parseInt(t.length === 3 ? t.split('').map(c => c + c).join('') : t, 16) || 0;
      return { r: (val >> 16) & 255, g: (val >> 8) & 255, b: val & 255 };
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
      const patCtx = patCanvas.getContext('2d');
      patCtx.drawImage(tex.pattern, 0, 0, width, height);
      const patData = patCtx.getImageData(0, 0, width, height);

      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = width; maskCanvas.height = height;
      const maskCtx = maskCanvas.getContext('2d');
      maskCtx.drawImage(tex.tintMask, 0, 0, width, height);
      const maskData = maskCtx.getImageData(0, 0, width, height);

      const bodyRgb = hexToRgb(this.palette.body);
      const markingsRgb = hexToRgb(this.palette.markings);
      const flankRgb = hexToRgb(this.palette.flank);
      const underbellyRgb = hexToRgb(this.palette.underbelly);
      const detailRgb = hexToRgb(this.palette.detail);

      const data = outData.data;
      const pData = patData.data;
      const mData = maskData.data;
      const len = data.length;

      for (let i = 0; i < len; i += 4) {
        if (data[i + 3] === 0) continue;
        const mr = mData[i] / 255.0;
        const mg = mData[i + 1] / 255.0;
        const mb = mData[i + 2] / 255.0;
        const pat = pData[i] / 255.0;

        let tr = (bodyRgb.r * (1 - mg) + underbellyRgb.r * mg) * (1 - mr) + flankRgb.r * mr;
        let tg = (bodyRgb.g * (1 - mg) + underbellyRgb.g * mg) * (1 - mr) + flankRgb.g * mr;
        let tb = (bodyRgb.b * (1 - mg) + underbellyRgb.b * mg) * (1 - mr) + flankRgb.b * mr;

        if (pat > 0.1) {
          tr = tr * (1 - pat) + markingsRgb.r * pat;
          tg = tg * (1 - pat) + markingsRgb.g * pat;
          tb = tb * (1 - pat) + markingsRgb.b * pat;
        }

        if (mb > 0.2) {
          tr = tr * (1 - mb) + detailRgb.r * mb;
          tg = tg * (1 - mb) + detailRgb.g * mb;
          tb = tb * (1 - mb) + detailRgb.b * mb;
        }

        data[i] = Math.round((data[i] / 255.0) * tr);
        data[i + 1] = Math.round((data[i + 1] / 255.0) * tg);
        data[i + 2] = Math.round((data[i + 2] / 255.0) * tb);
      }
      ctx.putImageData(outData, 0, 0);
    }

    const newTex = new THREE.CanvasTexture(canvas);
    newTex.flipY = false;
    newTex.colorSpace = THREE.SRGBColorSpace;

    this.dinoModel.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        child.material.map = newTex;
        child.material.needsUpdate = true;
      }
    });
  },

  // Render Color Channels in Deck
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

  // Render Pattern Chips
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

  // Randomise colors
  randomise() {
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
    this.showToast('Đã tạo màu ngẫu nhiên!');
  },

  // Generate Evrima compact code
  generateSkinCode() {
    const p = this.palette;
    const num = `${this.pattern}${this.variation}${this.theme}`;
    const cleanHex = (h) => (h || '#5A6B48').replace('#', '').toUpperCase().padEnd(6, '0').slice(0, 6) + 'FF';
    const hexes = [
      cleanHex(p.underbelly), cleanHex(p.body), cleanHex(p.flank),
      cleanHex(p.markings), cleanHex(p.male_display), cleanHex(p.eyes)
    ].join('');
    return `${this.species}${num}${hexes}`;
  },

  // Generate Unreal Engine 4 Evrima Blueprint JSON
  generateBlueprintJson() {
    const hexToFloatRgba = (hex) => {
      const clean = (hex || '#808080').replace('#', '');
      const num = parseInt(clean, 16) || 0;
      const r = ((num >> 16) & 255) / 255.0;
      const g = ((num >> 8) & 255) / 255.0;
      const b = (num & 255) / 255.0;
      return [Number(r.toFixed(4)), Number(g.toFixed(4)), Number(b.toFixed(4)), 1.0];
    };

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
  // Supports .json / .txt / Evrima Code / UE4 Blueprint / Custom Mod packs
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

    // Helper: float array [r, g, b, (a)] to Hex
    const floatToHex = (arr) => {
      if (!Array.isArray(arr) || arr.length < 3) return null;
      const to255 = (v) => Math.max(0, Math.min(255, Math.round(v <= 1.0 ? v * 255 : v)));
      const r = to255(arr[0]).toString(16).padStart(2, '0');
      const g = to255(arr[1]).toString(16).padStart(2, '0');
      const b = to255(arr[2]).toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    };

    // Helper: normalize any color (string hex, array, object)
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

    // 1. Try parsing JSON
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

      // Extract species
      const rawClass = data.class || data.blueprint || data.character || '';
      if (rawClass) {
        const m = rawClass.match(/BP_([a-zA-Z0-9]+)_C/i) || rawClass.match(/([a-zA-Z]+)/);
        if (m) detectedSpecies = m[1];
      }
      if (!detectedSpecies && (data.species || data.dino || data.dinosaur)) {
        detectedSpecies = data.species || data.dino || data.dinosaur;
      }

      // Extract pattern & sex
      if (data.pattern !== undefined) detectedPattern = parseInt(data.pattern, 10) || 0;
      if (data.female !== undefined) detectedSex = data.female ? 'female' : 'male';
      if (data.sex) detectedSex = String(data.sex).toLowerCase().includes('fe') ? 'female' : 'male';

      // Map color layers from JSON keys or nested palette object
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
      // 2. Try parsing Evrima Compact Code String (e.g. Tyrannosaurus000...)
      const match = text.match(/^([A-Za-z]+?)(\d{3,})((?:[0-9A-Fa-f]{8})+)$/);
      if (match) {
        detectedSpecies = match[1];
        const digits = match[2];
        detectedPattern = parseInt(digits[:-2] || digits[0], 10) || 0;

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

    // Match species with valid list
    if (detectedSpecies) {
      const found = this.speciesList.find(s => s.id.toLowerCase() === detectedSpecies.toLowerCase());
      if (found) {
        this.species = found.id;
      }
    }

    this.pattern = detectedPattern;
    this.sex = detectedSex;
    this.palette = newPalette;

    // Refresh UI
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

    this.showToast(`✅ Đã nạp thành công Mod Skin (${this.species})!`);
    return true;
  },

  // Apply in Game (Connects to backend /api/studio/apply or IslePilot API)
  async applyInGame() {
    const btn = document.getElementById('btn-apply-ingame');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span>⏳ Đang gửi vào game...</span>';
    }

    const bpPayload = this.generateBlueprintJson();
    const activeUser = JSON.parse(localStorage.getItem('steam_user') || 'null');
    const steamId = (activeUser && activeUser.steamid) ? activeUser.steamid : '';

    try {
      const res = await fetch('/api/studio/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          steam_id: steamId,
          species: this.species,
          payload: bpPayload,
          confirm: true
        })
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data && (data.ok || data.success)) {
        this.showToast('🎉 THÀNH CÔNG! Skin đã được cập nhật trực tiếp vào khủng long trong server!', 'success');
        const alertBox = document.getElementById('mod-import-status');
        if (alertBox) {
          alertBox.className = 'status-alert status-success';
          alertBox.innerHTML = `⚡ <b>Skin đã áp dụng thành công!</b> Hãy kiểm tra khủng long của bạn trên đảo.`;
          alertBox.style.display = 'flex';
        }
      } else {
        const msg = (data && (data.message || data.error)) || 'Máy chủ IslePilot từ chối hoặc người chơi chưa spawn khủng long.';
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

  // Save current design to local / drafts
  saveDesign() {
    const name = (document.getElementById('design-name')?.value || '').trim() || `${this.species} Custom`;
    const draft = {
      id: `skin_${Date.now()}`,
      name: name,
      species: this.species,
      sex: this.sex,
      pattern: this.pattern,
      palette: { ...this.palette },
      date: new Date().toLocaleDateString('vi-VN')
    };

    this.savedSkins.unshift(draft);
    localStorage.setItem('3m_saved_skins', JSON.stringify(this.savedSkins));
    this.renderSavedSkins();
    this.showToast(`💾 Đã lưu thiết kế: "${name}"`);
  },

  loadSavedSkins() {
    try {
      this.savedSkins = JSON.parse(localStorage.getItem('3m_saved_skins') || '[]');
    } catch (e) {
      this.savedSkins = [];
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
          <div class="saved-info-name">${skin.name}</div>
          <div class="saved-info-meta">${skin.species} · Pattern ${skin.pattern + 1} · ${skin.date}</div>
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

    this.species = skin.species;
    this.sex = skin.sex || 'male';
    this.pattern = skin.pattern || 0;
    this.palette = { ...skin.palette };
    this.designName = skin.name;

    const nameInput = document.getElementById('design-name');
    if (nameInput) nameInput.value = skin.name;

    this.populateSpeciesSelector();
    this.renderChannels();
    this.renderPatternChips();
    this.loadSpecies(this.species);

    // Switch back to editor tab
    this.switchTab('editor');
    this.showToast(`Đã mở bản lưu: ${skin.name}`);
  },

  deleteSavedSkin(idx) {
    this.savedSkins.splice(idx, 1);
    localStorage.setItem('3m_saved_skins', JSON.stringify(this.savedSkins));
    this.renderSavedSkins();
    this.showToast('Đã xóa bản lưu.');
  },

  // Export & Copy Helpers
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

  // Tab switcher
  switchTab(tabId) {
    document.querySelectorAll('.deck-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));
    document.querySelectorAll('.deck-pane').forEach(p => p.style.display = p.id === `pane-${tabId}` ? 'flex' : 'none');
  },

  // Toast notification
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

  // Setup UI event listeners
  initEventListeners() {
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

    // Apply In Game button
    const btnApply = document.getElementById('btn-apply-ingame');
    if (btnApply) {
      btnApply.addEventListener('click', () => this.applyInGame());
    }

    // Randomise button
    const btnRand = document.getElementById('btn-randomise');
    if (btnRand) {
      btnRand.addEventListener('click', () => this.randomise());
    }

    // Save design button
    const btnSave = document.getElementById('btn-save-design');
    if (btnSave) {
      btnSave.addEventListener('click', () => this.saveDesign());
    }

    // Copy buttons
    const btnCopyCode = document.getElementById('btn-copy-code');
    if (btnCopyCode) btnCopyCode.addEventListener('click', () => this.copyCode());

    const btnCopyJson = document.getElementById('btn-copy-json');
    if (btnCopyJson) btnCopyJson.addEventListener('click', () => this.copyJson());

    const btnDownload = document.getElementById('btn-download-json');
    if (btnDownload) btnDownload.addEventListener('click', () => this.downloadJson());
  }
};

// Auto-run when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  Studio.init();
});
