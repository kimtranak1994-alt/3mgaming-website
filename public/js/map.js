// Module Bản Đồ Vệ Tinh Gateway Tương Tác Siêu Nét & Hệ Thống Đại Di Cư (The Isle: Evrima - 3MGAMING)
const GatewayMap = {
  activeFilter: 'all',
  zoom: 0.35,
  panX: 0,
  panY: 0,
  isDragging: false,
  startX: 0,
  startY: 0,
  userPin: null,
  baseSize: 2048, // Kích thước chuẩn vuông 1:1 của map surface
  livePlayers: [],
  pollTimer: null,
  pollIntervalMs: 1500, // Quét và cập nhật vị trí trực tiếp liên tục mỗi 1.5 giây
  isPolling: false,

  // Chuẩn Calibration chính thức của IslePilot trên bản đồ Gateway v0.21.7 (server 3MGAMING)
  calibration: {
    a: { worldX: 534057.925, worldY: -267245.9, u: 0.9320964895641363, v: 0.3053043426801558 },
    b: { worldX: 87931.248, worldY: -104086.204, u: 0.5356221651318197, v: 0.4496109559223209 }
  },

  worldToNormalized(worldX, worldY) {
    const cal = this.calibration;
    const o = (worldX - cal.a.worldX) / (cal.b.worldX - cal.a.worldX);
    const i = (worldY - cal.a.worldY) / (cal.b.worldY - cal.a.worldY);
    return {
      u: cal.a.u + o * (cal.b.u - cal.a.u),
      v: cal.a.v + i * (cal.b.v - cal.a.v)
    };
  },

  normalizedToWorld(u, v) {
    const cal = this.calibration;
    const l = cal.b.u - cal.a.u;
    const n = cal.b.v - cal.a.v;
    if (l === 0 || n === 0) return { worldX: 0, worldY: 0 };
    const o = (u - cal.a.u) / l;
    const i = (v - cal.a.v) / n;
    return {
      worldX: cal.a.worldX + o * (cal.b.worldX - cal.a.worldX),
      worldY: cal.a.worldY + i * (cal.b.worldY - cal.a.worldY)
    };
  },

  // Cấu hình Sự kiện Đại Di Cư (Great Migration)
  greatMigration: {
    active: true,
    title: "Cao Nguyên Đông Bắc (Highlands Sanctuary Corridor)",
    corridorName: "Thung Lũng Trung Tâm ➔ Cao Nguyên Đông Bắc",
    center: { x: 59, y: 37 }, // Phần trăm (%)
    ingameCoord: "X: 144, Y: -208",
    radius: 90, // Bán kính trên hệ tọa độ SVG 1000x1000
    diets: "🌾 Cỏ non (Lines), Củ ngọt (Dots), Cây bụi (Slices)",
    herbivores: "Stegosaurus, Tenontosaurus, Gallimimus, Diabloceratops, Pachy",
    threats: "Tyrannosaurus Rex, Carnotaurus, Ceratosaurus, Herrerasaurus",
    buffText: "+100% Tốc độ tăng trưởng khi ăn cỏ/thịt tại vùng di cư",
    corridors: [
      { from: { x: 520, y: 520 }, to: { x: 590, y: 370 }, name: "Hành lang Trung Tâm ➔ Cao Nguyên" },
      { from: { x: 740, y: 520 }, to: { x: 590, y: 370 }, name: "Hành lang Rừng Đông ➔ Cao Nguyên" },
      { from: { x: 340, y: 640 }, to: { x: 520, y: 520 }, name: "Hành lang Đầm Lầy ➔ Thung Lũng Trung Tâm" }
    ]
  },

  // Danh mục điểm quan trọng trên bản đồ Gateway (POI) đầy đủ toàn diện
  poiList: [
    // ==============================================================
    // ⚡ 1. ĐẠI DI CƯ & VÙNG DI CƯ (MIGRATION ZONES)
    // ==============================================================
    { 
      name: "⚡ TÂM CHẤN ĐẠI DI CƯ (Highlands)", 
      type: "greatmigration", 
      x: 59, 
      y: 37, 
      danger: "CỰC ĐỘ (Chiến trường toàn server)", 
      desc: "Tâm chấn Đại Di Cư hiện tại. Nơi tụ họp đàn khủng long ăn cỏ khổng lồ và các loài Apex Carnivore săn mồi. Buff x2 Tốc độ phát triển!",
      diets: "🌾 Đầy đủ 3 dưỡng chất Lines // Dots / Slices"
    },
    { 
      name: "Vùng Di Cư: Thung Lũng Trung Tâm (Center Valley)", 
      type: "migration", 
      x: 52, 
      y: 52, 
      danger: "Rất cao (Ngã ba giao tranh)", 
      desc: "Vùng đồng cỏ chuyển tiếp lớn nhất giữa Đông và Tây Gateway, đàn di cư thường trung chuyển qua đây.",
      diets: "🌾 Dưỡng chất Lines & Dots"
    },
    { 
      name: "Vùng Di Cư: Thảo Nguyên Đông Nam (South-East Plains)", 
      type: "migration", 
      x: 68, 
      y: 72, 
      danger: "Trung bình", 
      desc: "Cánh đồng cỏ rộng bát ngát, dồi dào cỏ mọng cho Gallimimus, Tenontosaurus và Pachycephalosaurus.",
      diets: "🌾 Dưỡng chất Slices & Dots"
    },
    { 
      name: "Vùng Di Cư: Bình Nguyên Tây Bắc (North-West Steppe)", 
      type: "migration", 
      x: 32, 
      y: 26, 
      danger: "Trung bình", 
      desc: "Khu vực thảo nguyên đồi núi Tây Bắc, khí hậu trong lành, nhiều cụm nấm và rễ cây.",
      diets: "🌾 Dưỡng chất Lines & Slices"
    },
    { 
      name: "Vùng Di Cư: Vùng Trũng Đầm Lầy (Swamp Lowlands)", 
      type: "migration", 
      x: 28, 
      y: 66, 
      danger: "Cao (Cá sấu phục kích)", 
      desc: "Vùng cây bụi đầm lầy chứa nhiều loại rễ và hoa sen dồi dào dinh dưỡng cho khủng long ăn củ.",
      diets: "🌾 Dưỡng chất Dots ngọt"
    },
    { 
      name: "Vùng Di Cư: Thung Lũng Rừng Đông (East Jungle Basin)", 
      type: "migration", 
      x: 74, 
      y: 44, 
      danger: "Cao (Thợ săn rình rập)", 
      desc: "Vạt rừng già với tán cây rậm rạp, trái cây nhiệt đới phong phú cho các loài ăn quả.",
      diets: "🌾 Dưỡng chất Slices"
    },
    { 
      name: "Vùng Di Cư: Đồng Cỏ Bờ Biển Nam (South Coast)", 
      type: "migration", 
      x: 48, 
      y: 82, 
      danger: "Thấp - Trung bình", 
      desc: "Vùng đồng cỏ ven biển ôn hòa phía nam vách đá.",
      diets: "🌾 Dưỡng chất Lines non"
    },
    { 
      name: "Vùng Di Cư: Thảo Nguyên Bắc (North Highlands)", 
      type: "migration", 
      x: 44, 
      y: 16, 
      danger: "Trung bình", 
      desc: "Đồng cỏ cao nguyên phía bắc dãy núi tuyết, thưa thớt bóng người.",
      diets: "🌾 Dưỡng chất Lines & Dots"
    },

    // ==============================================================
    // 🛡️ 2. SANCTUARY (KHU AN TOÀN NẤM CHO BABY DINO)
    // ==============================================================
    { name: "Sanctuary Cao Nguyên Bắc (North Highland)", type: "sanctuary", x: 40, y: 28, danger: "An toàn (Chỉ khủng long con)", desc: "Khu nấm an toàn cao nguyên phía bắc, ong bắp cày bảo vệ baby khỏi khủng long lớn" },
    { name: "Sanctuary Đầm Lầy Tây (West Swamp)", type: "sanctuary", x: 22, y: 64, danger: "An toàn (Chỉ khủng long con)", desc: "Khu nấm bổ sung 3 loại dưỡng chất an toàn cho dino bé vùng đầm lầy" },
    { name: "Sanctuary Rừng Rậm Đông (East Jungle)", type: "sanctuary", x: 74, y: 48, danger: "An toàn (Chỉ khủng long con)", desc: "Khu trú ẩn trong thung lũng rậm rạp phía đông, râm mát và kín đáo" },
    { name: "Sanctuary Vách Đá Nam (South Cliffs)", type: "sanctuary", x: 56, y: 80, danger: "An toàn (Chỉ khủng long con)", desc: "Khu trú ẩn vách đá phía nam gần bờ biển" },
    { name: "Sanctuary Ven Hồ Trung Tâm (Center Edge)", type: "sanctuary", x: 42, y: 44, danger: "An toàn (Chỉ khủng long con)", desc: "Khu trú ẩn an toàn ven rìa hồ trung tâm" },
    { name: "Sanctuary Bờ Biển Tây Bắc (NW Coast)", type: "sanctuary", x: 20, y: 32, danger: "An toàn (Chỉ khủng long con)", desc: "Khu bảo hộ baby dino giáp bờ biển tây bắc" },
    { name: "Sanctuary Hẻm Núi Đông Bắc (NE Gorge)", type: "sanctuary", x: 66, y: 26, danger: "An toàn (Chỉ khủng long con)", desc: "Khu trú ẩn ẩn sâu trong hẻm núi đá cao tầng" },

    // ==============================================================
    // 💧 3. NGUỒN NƯỚC, HỒ & CỬA SÔNG (WATER SOURCES)
    // ==============================================================
    { name: "Hồ Lớn Trung Tâm (Center Lake)", type: "water", x: 50, y: 49, danger: "Cực độ (Apex Carnivore)", desc: "Điểm uống nước nhộn nhịp nhất Gateway, thường xuyên diễn ra giao tranh đẫm máu" },
    { name: "Đầm Lầy Phía Tây (West Swamp Marsh)", type: "water", x: 26, y: 72, danger: "Rất cao (Deinosuchus rình mồi)", desc: "Vùng bùn lầy sâu, địa bàn săn mồi số 1 của sát thủ đầm lầy Deinosuchus" },
    { name: "Hồ Nước Ngọt Phía Bắc (North Lake)", type: "water", x: 44, y: 22, danger: "Trung bình", desc: "Hồ nước trong lành trên sườn núi phía bắc" },
    { name: "Hồ Miệng Núi Lửa (East Crater Lake)", type: "water", x: 68, y: 46, danger: "Cao (Phục kích bờ dốc)", desc: "Hồ nước nằm sâu trong lòng chảo núi lửa cổ phía đông" },
    { name: "Thác Nước Cao Nguyên (Highland Waterfall)", type: "water", x: 64, y: 34, danger: "Cao (Bầy đàn phục kích)", desc: "Thác nước hùng vĩ đổ từ vách núi đá cao nguyên xuống dòng suối" },
    { name: "Thác Nước Vách Đá Nam (South Waterfall)", type: "water", x: 52, y: 78, danger: "Trung bình", desc: "Dòng thác mát lạnh đổ thẳng ra vùng trũng đồng bằng phía nam" },
    { name: "Nhánh Sông Đông (East River Delta)", type: "water", x: 76, y: 62, danger: "Cao (Cá sấu & Thợ săn)", desc: "Cửa sông rộng lớn nhiều bãi cát bồi đổ ra biển đông" },
    { name: "Sông Uốn Khúc Phía Tây (West River)", type: "water", x: 32, y: 58, danger: "Cao (Rình rập trong nước)", desc: "Nhánh sông dài uốn quanh vạt rừng rậm rạp" },
    { name: "Đầm Nước Mặn Nam (South Salt Marsh)", type: "water", x: 46, y: 86, danger: "Thấp", desc: "Vùng nước cạn ngập mặn trải dài ven bờ biển phía nam" },
    { name: "Hồ Rừng Rậm Bí Mật (Hidden Jungle Pond)", type: "water", x: 62, y: 58, danger: "Trung bình", desc: "Vũng nước tĩnh lặng được bao bọc bởi tán cây dương xỉ rậm rạp" },

    // ==============================================================
    // 💀 4. ĐIỂM NÓNG PVP & CHIẾN TRƯỜNG (HOTSPOTS)
    // ==============================================================
    { name: "Thung Lũng Trung Tâm (Center Valley Hotspot)", type: "hotspot", x: 52, y: 52, danger: "TỬ ĐỊA (T-Rex, Cera, Carno)", desc: "Điểm nóng PVP lớn nhất server 3MGAMING, liên tục diễn ra các cuộc săn lùng tử thần" },
    { name: "Bình Nguyên Cao Nguyên (Highlands Plains Hotspot)", type: "hotspot", x: 58, y: 38, danger: "Cực độ (Săn rượt đuổi tốc độ)", desc: "Địa hình đồng cỏ rộng mở, nơi các bầy Carno và Raptor phô diễn tốc độ" },
    { name: "Bìa Rừng Đầm Lầy (Swamp Border Ambush)", type: "hotspot", x: 32, y: 68, danger: "Cao (Phục kích bất ngờ)", desc: "Vùng ranh giới râm mát giữa rừng rậm và đầm lầy, thường bị phục kích" },
    { name: "Vách Đá Bờ Đông (East Coastal Ridge)", type: "hotspot", x: 78, y: 50, danger: "Cao (Rơi vực & Đẩy ngã)", desc: "Vách đá cheo leo nhìn ra biển lớn, chiến trường của Herrerasaurus và Raptor" },
    { name: "Giao Lộ Ba Tuyến Đường (Three Ways Crossroads)", type: "hotspot", x: 46, y: 38, danger: "Rất cao (Ngã ba giao thông)", desc: "Điểm nghẽn giao thông huyết mạch kết nối Bắc - Trung Tâm - Tây" },

    // ==============================================================
    // 🏛️ 5. CÔNG TRÌNH CON NGƯỜI & DI TÍCH (LANDMARKS)
    // ==============================================================
    { name: "Mái Vòm Sinh Học Alpha (Bio Dome Alpha)", type: "landmark", x: 66, y: 44, danger: "Bí ẩn", desc: "Mái vòm nghiên cứu khoa học bỏ hoang khổng lồ thời tiền sử" },
    { name: "Mái Vòm Sinh Học Beta (Bio Dome Beta)", type: "landmark", x: 48, y: 34, danger: "Bí ẩn", desc: "Mái vòm sinh thái thứ hai đổ nát trên sườn đồi" },
    { name: "Trạm Radar Bờ Tây (Radar Tower)", type: "landmark", x: 16, y: 36, danger: "Thấp", desc: "Tháp radar liên lạc tọa lạc trên đỉnh vách đá bờ biển tây" },
    { name: "Bến Cảng Bỏ Hoang (Abandoned Docks)", type: "landmark", x: 14, y: 78, danger: "Trung bình", desc: "Khu cảng công nghiệp với container rỉ sét và cần cẩu cổ" },
    { name: "Nhà Máy Xử Lý Nước (Water Treatment)", type: "landmark", x: 38, y: 54, danger: "Trung bình", desc: "Tổ hợp bể lọc nước nhân tạo lớn giữa thung lũng" },
    { name: "Lối Vào Căn Cứ Ngầm (Underground Bunker)", type: "landmark", x: 54, y: 42, danger: "Nguy hiểm", desc: "Cửa thép hầm ngầm của tổ chức nghiên cứu Gateway" },
    { name: "Hải Đăng Tây Nam (South-West Lighthouse)", type: "landmark", x: 12, y: 84, danger: "Thấp", desc: "Ngọn hải đạo cổ kính soi sáng bờ biển phía tây nam" },
    { name: "Cầu Bê Tông Sập (Broken Highway Bridge)", type: "landmark", x: 60, y: 64, danger: "Cao (Rơi sụp)", desc: "Đoạn cầu vượt cao tốc bị gãy đôi bắc qua hẻm vực sâu" },
    { name: "Trạm Quan Trắc Đỉnh Núi Bắc (North Summit)", type: "landmark", x: 46, y: 12, danger: "Thấp (Lạnh giá)", desc: "Trạm thời tiết trên đỉnh núi tuyết cao nhất đảo Gateway" },

    // ==============================================================
    // 🪺 6. KHU VỰC LÀM TỔ & AN TOÀN (NESTING GROUNDS)
    // ==============================================================
    { name: "Khu Làm Tổ Rừng Thông Bắc (North Pine Nesting)", type: "nesting", x: 36, y: 18, danger: "Yên tĩnh", desc: "Khu vực rừng thông râm mát, kín gió, nguồn thức ăn gần, hoàn hảo để làm tổ đẻ trứng" },
    { name: "Khu Làm Tổ Thung Lũng Kín (Hidden Valley Nesting)", type: "nesting", x: 72, y: 36, danger: "Kín đáo", desc: "Thung lũng trũng sâu được vách đá bao bọc, rất khó bị kẻ săn mồi phát hiện" },
    { name: "Khu Làm Tổ Vịnh Bờ Nam (South Bay Nesting)", type: "nesting", x: 42, y: 88, danger: "Yên bình", desc: "Bãi cát thoai thoải đón nắng ấm, an toàn cho khủng long ăn cỏ ấp trứng" },
    { name: "Khu Làm Tổ Đồi Núi Phía Tây (West Hills Nesting)", type: "nesting", x: 22, y: 48, danger: "Kín đáo", desc: "Rừng cây rậm rạp trên triền đồi tây, thích hợp cho đàn nhỏ trú ngụ" }
  ],

  init() {
    this.setupInteractions();
    this.populatePoiSelect();
    this.updateBanner();
    this.fitToView();
    this.render();
    this.startLiveTracking();
  },

  updateBanner() {
    const titleEl = document.getElementById('gm-banner-title');
    const corridorEl = document.getElementById('gm-banner-corridor');
    if (titleEl && this.greatMigration) {
      titleEl.textContent = this.greatMigration.title;
    }
    if (corridorEl && this.greatMigration) {
      corridorEl.textContent = this.greatMigration.corridorName;
    }
  },

  populatePoiSelect() {
    const select = document.getElementById('map-poi-select');
    if (!select) return;

    select.innerHTML = '<option value="">🎯 Bay nhanh tới địa danh...</option>';

    const groups = [
      { id: 'greatmigration', label: '⚡ Đại Di Cư & Vùng Di Cư' },
      { id: 'sanctuary', label: '🛡️ Khu Trú Ẩn Sanctuary' },
      { id: 'water', label: '💧 Nguồn Nước & Hồ Lớn' },
      { id: 'hotspot', label: '💀 Điểm Nóng Săn Mồi PVP' },
      { id: 'landmark', label: '🏛️ Công Trình & Di Tích' },
      { id: 'nesting', label: '🪺 Khu Vực Làm Tổ' }
    ];

    groups.forEach(g => {
      const optGroup = document.createElement('optgroup');
      optGroup.label = g.label;

      let items = [];
      if (g.id === 'greatmigration') {
        items = this.poiList.filter(p => p.type === 'greatmigration' || p.type === 'migration');
      } else {
        items = this.poiList.filter(p => p.type === g.id);
      }

      items.forEach(pt => {
        const opt = document.createElement('option');
        opt.value = pt.name;
        opt.textContent = pt.name;
        optGroup.appendChild(opt);
      });

      select.appendChild(optGroup);
    });
  },

  onSelectPoi(poiName) {
    if (!poiName) return;
    const pt = this.poiList.find(p => p.name === poiName);
    if (!pt) return;

    this.flyTo(pt.x, pt.y, 1.8);
    const world = this.normalizedToWorld(pt.x / 100, pt.y / 100);
    const ingameX = Math.round(world.worldX * 0.01);
    const ingameY = Math.round(world.worldY * 0.01);
    App.showToast(`📌 Đã bay tới: ${pt.name} (Tọa độ: X: ${ingameX}, Y: ${ingameY})`);
  },

  // Bay và phóng to tới tọa độ phần trăm cụ thể
  flyTo(pctX, pctY, targetZoom = 1.8) {
    const viewport = document.getElementById('map-viewport');
    if (!viewport) return;

    const vWidth = viewport.clientWidth;
    const vHeight = viewport.clientHeight;

    this.zoom = targetZoom;
    const surfaceX = (pctX / 100) * this.baseSize;
    const surfaceY = (pctY / 100) * this.baseSize;

    this.panX = (vWidth / 2) - (surfaceX * this.zoom);
    this.panY = (vHeight / 2) - (surfaceY * this.zoom);

    this.applyTransform();
  },

  // Phóng to thu nhỏ toàn cảnh hiển thị trọn vẹn cả hòn đảo (Zoom xa tối đa)
  fitToView() {
    const viewport = document.getElementById('map-viewport');
    if (!viewport) return;

    const vW = viewport.clientWidth || 1000;
    const vH = viewport.clientHeight || 740;

    // Tính toán tỉ lệ zoom sao cho toàn bộ 2048x2048 nằm gọn trong viewport với margin đẹp
    const fitZoom = Math.min(vW / this.baseSize, vH / this.baseSize) * 0.94;
    this.zoom = Math.max(0.18, fitZoom);

    // Căn giữa map surface
    this.panX = (vW - (this.baseSize * this.zoom)) / 2;
    this.panY = (vH - (this.baseSize * this.zoom)) / 2;

    this.applyTransform();
    App.showToast("⤢ Đã thu nhỏ toàn cảnh trọn vẹn bản đồ Gateway");
  },

  // Bật/tắt chế độ toàn màn hình (Fullscreen)
  toggleFullscreen() {
    const viewport = document.getElementById('map-viewport');
    const btn = document.getElementById('btn-fullscreen');
    if (!viewport) return;

    viewport.classList.toggle('is-fullscreen');
    const isFull = viewport.classList.contains('is-fullscreen');

    if (btn) {
      btn.textContent = isFull ? '✕' : '⛶';
      btn.title = isFull ? 'Thoát toàn màn hình' : 'Toàn màn hình';
    }

    setTimeout(() => {
      this.fitToView();
      if (isFull) {
        App.showToast("⛶ Đã mở chế độ bản đồ toàn màn hình (Bấm ✕ hoặc ESC để thoát)");
      }
    }, 100);
  },

  // Focus & Zoom ngay lập tức vào tâm Đại Di Cư
  focusGreatMigration() {
    const gm = this.greatMigration;
    this.flyTo(gm.center.x, gm.center.y, 2.0);
    App.showToast(`⚡ Đang tập trung vào Tâm Chấn Đại Di Cư: ${gm.title} (${gm.ingameCoord})`);
  },

  // Vẽ các đường di cư và vòng Đại Di Cư trên SVG
  renderSvgLayer() {
    const svg = document.getElementById('map-svg-layer');
    if (!svg) return;

    const shouldShow = ['all', 'greatmigration', 'migration'].includes(this.activeFilter);
    if (!shouldShow) {
      svg.innerHTML = '';
      return;
    }

    const gm = this.greatMigration;
    const cx = gm.center.x * 10;
    const cy = gm.center.y * 10;

    let pathsHtml = '';
    gm.corridors.forEach(c => {
      const midX = (c.from.x + c.to.x) / 2 + (c.from.y < c.to.y ? 30 : -30);
      const midY = (c.from.y + c.to.y) / 2;
      pathsHtml += `
        <path class="migration-route-path" d="M ${c.from.x} ${c.from.y} Q ${midX} ${midY} ${c.to.x} ${c.to.y}" marker-end="url(#arrowhead)" />
      `;
    });

    const secondaryZones = [
      { x: 520, y: 520, r: 45 },
      { x: 680, y: 720, r: 40 },
      { x: 320, y: 260, r: 35 },
      { x: 280, y: 660, r: 35 },
      { x: 740, y: 440, r: 35 },
      { x: 440, y: 160, r: 35 },
      { x: 480, y: 820, r: 35 }
    ];

    let secondaryZonesHtml = '';
    secondaryZones.forEach(sz => {
      secondaryZonesHtml += `
        <circle cx="${sz.x}" cy="${sz.y}" r="${sz.r}" fill="rgba(217, 119, 6, 0.12)" stroke="rgba(251, 191, 36, 0.55)" stroke-width="1.8" stroke-dasharray="5 4" />
      `;
    });

    svg.innerHTML = `
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <polygon points="0 0, 6 3, 0 6" fill="#fbbf24" />
        </marker>
        <radialGradient id="gmGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="rgba(245, 158, 11, 0.45)" />
          <stop offset="70%" stop-color="rgba(245, 158, 11, 0.15)" />
          <stop offset="100%" stop-color="rgba(245, 158, 11, 0)" />
        </radialGradient>
      </defs>

      <!-- Vùng Di Cư Phụ -->
      ${secondaryZonesHtml}

      <!-- Tuyến Đường Hành Lang Di Cư -->
      ${pathsHtml}

      <!-- Vòng Năng Lượng Tâm Chấn Đại Di Cư -->
      <circle cx="${cx}" cy="${cy}" r="${gm.radius}" fill="url(#gmGlow)" class="great-migration-circle" />
      <circle cx="${cx}" cy="${cy}" r="${gm.radius * 0.4}" fill="rgba(245, 158, 11, 0.3)" stroke="#fbbf24" stroke-width="2.5" />
      <circle cx="${cx}" cy="${cy}" r="14" fill="#f59e0b" filter="drop-shadow(0 0 10px #f59e0b)" />
    `;
  },

  setupInteractions() {
    const viewport = document.getElementById('map-viewport');
    const surface = document.getElementById('map-surface');
    const coordText = document.getElementById('map-coord-text');
    if (!viewport || !surface) return;

    // 1. Kéo thả bản đồ (Pan)
    viewport.addEventListener('mousedown', (e) => {
      if (e.target.closest('.map-controls') || e.target.closest('.map-coord-search') || e.target.closest('.map-zoom-controls')) return;
      this.isDragging = true;
      this.startX = e.clientX - this.panX;
      this.startY = e.clientY - this.panY;
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        this.panX = e.clientX - this.startX;
        this.panY = e.clientY - this.startY;
        this.applyTransform();
      }

      // 2. Tính toán tọa độ chuột theo hệ tọa độ Ingame của Gateway (-800 đến +800)
      const rect = viewport.getBoundingClientRect();
      if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
        const surfaceX = (e.clientX - rect.left - this.panX) / this.zoom;
        const surfaceY = (e.clientY - rect.top - this.panY) / this.zoom;

        const pctX = (surfaceX / this.baseSize) * 100;
        const pctY = (surfaceY / this.baseSize) * 100;
        
        const world = this.normalizedToWorld(pctX / 100, pctY / 100);
        const ingameX = Math.round(world.worldX * 0.01);
        const ingameY = Math.round(world.worldY * 0.01);

        if (coordText) {
          coordText.textContent = `X: ${ingameX}, Y: ${ingameY}`;
        }
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    // 3. Cuộn chuột để phóng to / thu nhỏ linh hoạt - Tự động Neo theo con trỏ chuột (Anchor Zoom)
    viewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = viewport.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Vị trí trên bề mặt map trước khi zoom
      const surfaceX = (mouseX - this.panX) / this.zoom;
      const surfaceY = (mouseY - this.panY) / this.zoom;

      // Giảm hoặc tăng zoom mượt mà
      const zoomFactor = e.deltaY < 0 ? 1.25 : 0.8;
      // Cho phép zoom xa ra 0.15x (toàn bộ đảo từ ngoài biển) và zoom gần tới 4.5x (soi từng con suối)
      const newZoom = Math.max(0.15, Math.min(4.5, this.zoom * zoomFactor));

      // Cập nhật panX, panY sao cho điểm dưới con trỏ chuột giữ nguyên vị trí
      this.panX = mouseX - (surfaceX * newZoom);
      this.panY = mouseY - (surfaceY * newZoom);
      this.zoom = newZoom;

      this.applyTransform();
    }, { passive: false });

    // 4. Click trên bản đồ để copy tọa độ
    surface.addEventListener('click', (e) => {
      if (e.target.closest('.map-pin')) return;
      const rect = viewport.getBoundingClientRect();
      const surfaceX = (e.clientX - rect.left - this.panX) / this.zoom;
      const surfaceY = (e.clientY - rect.top - this.panY) / this.zoom;

      const pctX = (surfaceX / this.baseSize) * 100;
      const pctY = (surfaceY / this.baseSize) * 100;

      const world = this.normalizedToWorld(pctX / 100, pctY / 100);
      const ingameX = Math.round(world.worldX * 0.01);
      const ingameY = Math.round(world.worldY * 0.01);

      navigator.clipboard.writeText(`${ingameX}, ${ingameY}`).then(() => {
        App.showToast(`📍 Đã sao chép tọa độ: X: ${ingameX}, Y: ${ingameY}`);
      }).catch(() => {
        App.showToast(`Tọa độ: X: ${ingameX}, Y: ${ingameY}`);
      });
    });

    // Thoát fullscreen bằng phím Escape
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && viewport.classList.contains('is-fullscreen')) {
        this.toggleFullscreen();
      }
    });

    // Cập nhật lại khung nhìn khi resize cửa sổ
    window.addEventListener('resize', () => {
      if (!this.isDragging) {
        this.applyTransform();
      }
    });
  },

  applyTransform() {
    const surface = document.getElementById('map-surface');
    if (surface) {
      surface.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
    }

    // Cập nhật huy hiệu % Zoom
    const badge = document.getElementById('zoom-level-badge');
    if (badge) {
      badge.textContent = `${Math.round(this.zoom * 100)}%`;
    }
  },

  zoomIn() {
    const viewport = document.getElementById('map-viewport');
    if (!viewport) return;
    const vW = viewport.clientWidth / 2;
    const vH = viewport.clientHeight / 2;

    const surfaceX = (vW - this.panX) / this.zoom;
    const surfaceY = (vH - this.panY) / this.zoom;

    const newZoom = Math.min(4.5, this.zoom * 1.3);
    this.panX = vW - (surfaceX * newZoom);
    this.panY = vH - (surfaceY * newZoom);
    this.zoom = newZoom;

    this.applyTransform();
  },

  zoomOut() {
    const viewport = document.getElementById('map-viewport');
    if (!viewport) return;
    const vW = viewport.clientWidth / 2;
    const vH = viewport.clientHeight / 2;

    const surfaceX = (vW - this.panX) / this.zoom;
    const surfaceY = (vH - this.panY) / this.zoom;

    const newZoom = Math.max(0.15, this.zoom * 0.77);
    this.panX = vW - (surfaceX * newZoom);
    this.panY = vH - (surfaceY * newZoom);
    this.zoom = newZoom;

    this.applyTransform();
  },

  resetZoom() {
    this.fitToView();
  },

  searchCoords() {
    const input = document.getElementById('map-search-input');
    if (!input || !input.value.trim()) {
      App.showToast("⚠️ Vui lòng nhập tọa độ (Ví dụ: -200, 150)!");
      return;
    }

    const val = input.value.trim();
    const parts = val.split(/[,\s]+/).map(Number);
    if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) {
      App.showToast("⚠️ Định dạng tọa độ không hợp lệ! Hãy nhập dạng: X, Y (Ví dụ: -150, 220)");
      return;
    }

    const ingameX = parts[0];
    const ingameY = parts[1];

    let worldX = ingameX;
    let worldY = ingameY;
    if (Math.abs(worldX) < 10000 && Math.abs(worldY) < 10000) {
      worldX = worldX * 100;
      worldY = worldY * 100;
    }
    const norm = this.worldToNormalized(worldX, worldY);
    const pctX = Math.max(0.5, Math.min(99.5, norm.u * 100));
    const pctY = Math.max(0.5, Math.min(99.5, norm.v * 100));

    if (this.userPin) {
      this.userPin.remove();
    }

    const layer = document.getElementById('map-pins-layer');
    if (!layer) return;

    const pin = document.createElement('div');
    pin.className = 'map-pin pin-user';
    pin.style.left = `${pctX}%`;
    pin.style.top = `${pctY}%`;
    pin.innerHTML = `
      <div class="pin-icon">🎯</div>
      <div class="map-tooltip" style="opacity: 1; bottom: 42px;">
        <strong style="color: var(--accent);">Vị trí đã tìm kiếm</strong><br>
        Tọa độ: X: ${ingameX}, Y: ${ingameY}
      </div>
    `;

    layer.appendChild(pin);
    this.userPin = pin;

    // Bay tới vị trí và zoom 2.0x
    this.flyTo(pctX, pctY, 2.0);
    App.showToast(`🎯 Đã định vị thành công: X: ${ingameX}, Y: ${ingameY}`);
  },

  render() {
    const layer = document.getElementById('map-pins-layer');
    if (!layer) return;

    layer.innerHTML = '';

    this.poiList.forEach(pt => {
      if (this.activeFilter === 'greatmigration') {
        if (pt.type !== 'greatmigration' && pt.type !== 'migration') return;
      } else if (this.activeFilter === 'migration') {
        if (pt.type !== 'migration' && pt.type !== 'greatmigration') return;
      } else if (this.activeFilter !== 'all' && pt.type !== this.activeFilter) {
        return;
      }

      const pin = document.createElement('div');
      pin.className = `map-pin pin-${pt.type}`;
      pin.style.left = `${pt.x}%`;
      pin.style.top = `${pt.y}%`;

      let icon = '📍';
      if (pt.type === 'greatmigration') icon = '⚡';
      else if (pt.type === 'migration') icon = '🌾';
      else if (pt.type === 'water') icon = '💧';
      else if (pt.type === 'sanctuary') icon = '🛡️';
      else if (pt.type === 'hotspot') icon = '💀';
      else if (pt.type === 'landmark') icon = '🏛️';
      else if (pt.type === 'nesting') icon = '🪺';

      const world = this.normalizedToWorld(pt.x / 100, pt.y / 100);
      const ingameX = Math.round(world.worldX * 0.01);
      const ingameY = Math.round(world.worldY * 0.01);

      let extraInfo = '';
      if (pt.diets) {
        extraInfo = `<br><span style="color: #fbbf24;">Dưỡng chất: ${pt.diets}</span>`;
      }

      pin.innerHTML = `
        <div class="pin-icon">${icon}</div>
        <div class="map-tooltip">
          <strong style="color: #fff; font-size: 0.88rem;">${pt.name}</strong><br>
          <span style="color: var(--text-muted);">${pt.desc}</span><br>
          <span style="color: var(--accent);">Nguy hiểm: ${pt.danger}</span>
          ${extraInfo}<br>
          <span style="color: #60a5fa;">Tọa độ Ingame: X: ${ingameX}, Y: ${ingameY}</span>
        </div>
      `;

      pin.addEventListener('click', (e) => {
        e.stopPropagation();
        App.showToast(`📌 ${pt.name} (Tọa độ: X: ${ingameX}, Y: ${ingameY})`);
      });

      layer.appendChild(pin);
    });

    if (this.userPin) {
      layer.appendChild(this.userPin);
    }

    this.renderSvgLayer();
  },

  filter(type, btnElement) {
    this.activeFilter = type;
    document.querySelectorAll('.map-controls .map-filter-btn').forEach(btn => btn.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');
    this.render();
  },

  // ==============================================================
  // 🎯 HỆ THỐNG RADAR THEO DÕI VỊ TRÍ NGƯỜI CHƠI TRỰC TIẾP (LIVE)
  // ==============================================================

  // Chuyển đổi tọa độ in-game / Unreal sang % trên bề mặt bản đồ Gateway
  posToPct(pos) {
    if (!pos) return null;
    let rawX = Number(pos.x);
    let rawY = Number(pos.y);
    if (isNaN(rawX) || isNaN(rawY)) return null;

    // Nếu tọa độ nhỏ (< 10000), nhân 100 đổi mét sang cm Unreal
    let worldX = rawX;
    let worldY = rawY;
    if (Math.abs(worldX) < 10000 && Math.abs(worldY) < 10000) {
      worldX = worldX * 100;
      worldY = worldY * 100;
    }

    const norm = this.worldToNormalized(worldX, worldY);
    let pctX = norm.u * 100;
    let pctY = norm.v * 100;

    pctX = Math.max(0.5, Math.min(99.5, pctX));
    pctY = Math.max(0.5, Math.min(99.5, pctY));

    let mX = Math.round(worldX * 0.01);
    let mY = Math.round(worldY * 0.01);
    let alt = Math.round((Number(pos.z) || 0) * 0.01);
    let yaw = typeof pos.yaw === 'number' ? pos.yaw : 0;

    return { pctX, pctY, mX, mY, alt, yaw };
  },

  getSpeciesIcon(species) {
    if (!species) return '🦖';
    const s = species.toLowerCase();
    if (s.includes('tyranno') || s.includes('rex')) return '🦖';
    if (s.includes('deino') || s.includes('crocodile')) return '🐊';
    if (s.includes('carno')) return '🐂';
    if (s.includes('cera')) return '🦏';
    if (s.includes('stego')) return '🦕';
    if (s.includes('tri') || s.includes('diablo')) return '🦏';
    if (s.includes('ptera')) return '🦅';
    if (s.includes('omni') || s.includes('raptor') || s.includes('troodon')) return '🦎';
    if (s.includes('galli') || s.includes('hypsi') || s.includes('beipia')) return '🦤';
    return '🦕';
  },

  async updateLivePlayers() {
    if (this.isPolling) return;
    this.isPolling = true;

    try {
      const currentUser = JSON.parse(localStorage.getItem('steam_user') || 'null');
      const mySteamId = (currentUser && currentUser.steamId) ? currentUser.steamId : '';
      const viewMode = localStorage.getItem('admin_view_mode') || 'guest';
      const isRealAdmin = !!(window.realAdminVerified || window.isUserAdmin);
      const isAdminView = isRealAdmin && (viewMode !== 'guest');

      const params = new URLSearchParams({
        t: Date.now(),
        mode: isAdminView ? 'admin' : 'guest'
      });
      if (mySteamId) {
        params.append('steam_id', mySteamId);
      }

      const res = await fetch(`/api/server/players?${params.toString()}`);
      const players = await res.json();
      this.livePlayers = Array.isArray(players) ? players : [];
      this.renderLivePlayers();
    } catch (e) {
      // Giữ nguyên trạng thái nếu mạng chập chờn
    } finally {
      this.isPolling = false;
    }
  },

  renderLivePlayers() {
    const layer = document.getElementById('map-players-layer');
    const countEl = document.getElementById('live-player-count');
    const unitEl = document.getElementById('live-player-unit');
    const btnTrackMe = document.getElementById('btn-track-my-dino');
    if (!layer) return;

    const currentUser = JSON.parse(localStorage.getItem('steam_user') || 'null');
    let mySteamId = (currentUser && currentUser.steamId) ? currentUser.steamId : null;

    // Lọc danh sách người chơi đang online và có dữ liệu tọa độ
    const onlinePlayers = this.livePlayers.filter(p => p.online !== false && p.position);
    let myPlayer = mySteamId ? onlinePlayers.find(p => p.steamId === mySteamId) : null;

    // Phân quyền chế độ hiển thị: Admin vs Khách (Người chơi)
    const viewMode = localStorage.getItem('admin_view_mode') || 'guest';
    const isRealAdmin = !!(window.realAdminVerified || window.isUserAdmin);
    const isAdminView = isRealAdmin && (viewMode !== 'guest');

    let displayedPlayers = [];
    if (isAdminView) {
      // Chế độ Admin: Hiển thị đầy đủ tất cả người chơi
      displayedPlayers = onlinePlayers;
      if (countEl) {
        countEl.textContent = `${onlinePlayers.length} người chơi`;
      }
      if (unitEl) {
        unitEl.textContent = '(Toàn bộ Server - Chế độ Admin)';
      }
    } else {
      // Chế độ Khách: Chỉ hiện đúng người chơi đang đăng nhập, không hiện người khác
      if (myPlayer) {
        displayedPlayers = [myPlayer];
        if (countEl) {
          countEl.textContent = '1/1 Đang theo dõi';
        }
        if (unitEl) {
          unitEl.textContent = '(Vị trí của bạn - Chế độ Khách)';
        }
      } else {
        displayedPlayers = [];
        if (countEl) {
          countEl.textContent = '0 người chơi';
        }
        if (unitEl) {
          unitEl.textContent = mySteamId ? '(Khủng long của bạn đang Offline)' : '(Chế độ Khách - Đăng nhập Steam để xem)';
        }
      }
    }

    let hasMe = !!myPlayer;
    const currentSteamIds = new Set();

    displayedPlayers.forEach(p => {
      currentSteamIds.add(p.steamId);
      const coords = this.posToPct(p.position);
      if (!coords) return;

      const isMe = (mySteamId && p.steamId === mySteamId);
      const icon = this.getSpeciesIcon(p.species);
      const playerName = p.name || `Player_${p.steamId.slice(-4)}`;
      const speciesName = p.species || 'Khủng long';

      let pin = layer.querySelector(`[data-steam-id="${p.steamId}"]`);
      if (!pin) {
        pin = document.createElement('div');
        pin.className = `map-player-pin ${isMe ? 'is-me' : 'is-other'}`;
        pin.setAttribute('data-steam-id', p.steamId);
        pin.style.left = `${coords.pctX}%`;
        pin.style.top = `${coords.pctY}%`;

        pin.innerHTML = `
          <div class="player-yaw-wrapper" style="transform: rotate(${coords.yaw}deg);">
            <div class="player-yaw-arrow"></div>
          </div>
          <div class="player-beacon">${icon}</div>
          <div class="player-pin-label">
            <span>${isMe ? '⭐ ' : ''}${playerName}</span>
            <span class="player-species-tag">${speciesName}</span>
          </div>
          <div class="map-tooltip">
            <strong style="color: #38bdf8; font-size: 0.9rem;">${isMe ? "⭐ Vị Trí Của Bạn: " : "🦖 "} ${playerName}</strong><br>
            <span style="color: #fff;">Loài: <b>${speciesName}</b></span> | Trạng thái: <b style="color: #00f076;">Đang Online</b><br>
            <span style="color: #60a5fa;">Tọa độ Ingame: X: ${coords.mX}, Y: ${coords.mY}</span><br>
            <span style="color: #94a3b8;">Độ cao (Z): ${coords.alt}m | Hướng nhìn (Yaw): ${Math.round(coords.yaw)}°</span>
          </div>
        `;

        pin.addEventListener('click', (e) => {
          e.stopPropagation();
          this.flyTo(coords.pctX, coords.pctY, 2.2);
          App.showToast(`🎯 ${isMe ? 'Vị trí của bạn' : 'Người chơi'}: ${playerName} (${speciesName}) - Tọa độ: X: ${coords.mX}, Y: ${coords.mY}`);
        });

        layer.appendChild(pin);
      } else {
        // Cập nhật vị trí và góc nhìn chuyển động mượt mà bằng CSS transitions
        pin.style.left = `${coords.pctX}%`;
        pin.style.top = `${coords.pctY}%`;

        const yawWrapper = pin.querySelector('.player-yaw-wrapper');
        if (yawWrapper) {
          yawWrapper.style.transform = `rotate(${coords.yaw}deg)`;
        }

        const tooltip = pin.querySelector('.map-tooltip');
        if (tooltip) {
          tooltip.innerHTML = `
            <strong style="color: #38bdf8; font-size: 0.9rem;">${isMe ? "⭐ Vị Trí Của Bạn: " : "🦖 "} ${playerName}</strong><br>
            <span style="color: #fff;">Loài: <b>${speciesName}</b></span> | Trạng thái: <b style="color: #00f076;">Đang Online</b><br>
            <span style="color: #60a5fa;">Tọa độ Ingame: X: ${coords.mX}, Y: ${coords.mY}</span><br>
            <span style="color: #94a3b8;">Độ cao (Z): ${coords.alt}m | Hướng nhìn (Yaw): ${Math.round(coords.yaw)}°</span>
          `;
        }
      }
    });

    // Dọn dẹp các marker không còn nằm trong danh sách hiển thị
    const allPins = layer.querySelectorAll('.map-player-pin');
    allPins.forEach(pin => {
      const sid = pin.getAttribute('data-steam-id');
      if (!currentSteamIds.has(sid)) {
        pin.remove();
      }
    });

    if (btnTrackMe) {
      btnTrackMe.style.display = hasMe ? 'inline-flex' : 'none';
    }
  },

  // Focus ngay lập tức tới vị trí của người chơi
  focusMyPlayer() {
    const currentUser = JSON.parse(localStorage.getItem('steam_user') || 'null');
    const myPin = document.querySelector(`.map-player-pin.is-me`);
    if (myPin) {
      const pctX = parseFloat(myPin.style.left);
      const pctY = parseFloat(myPin.style.top);
      if (!isNaN(pctX) && !isNaN(pctY)) {
        this.flyTo(pctX, pctY, 2.2);
        App.showToast("⭐ Đã căn giữa góc nhìn theo vị trí khủng long của bạn!");
      }
    } else {
      App.showToast("⚠️ Khủng long của bạn hiện chưa online trong server!");
    }
  },

  // Vòng lặp cập nhật vị trí trực tiếp liên tục nhanh nhất
  startLiveTracking() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.updateLivePlayers();
    this.pollTimer = setInterval(() => {
      if (!document.hidden) {
        this.updateLivePlayers();
      }
    }, this.pollIntervalMs);
  },

  stopLiveTracking() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }
};
