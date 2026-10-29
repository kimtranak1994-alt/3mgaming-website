// Module Bản Đồ Vệ Tinh Gateway Tương Tác Siêu Nét & Hệ Thống Đại Di Cư (The Isle: Evrima - 3MGAMING)
const GatewayMap = {
  activeFilter: 'all',
  showRegions: true,
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

  // Danh sách các vùng / khu vực chính thức chuẩn bản đồ Gateway (The Isle: Evrima)
  regionsList: [
    {
      id: "delta",
      name: "DELTA",
      subName: "Cầu Delta / Đồng Bằng Sông (River Delta)",
      x: 63,
      y: 58,
      size: "large",
      tag: "Cửa sông & Cầu vượt",
      desc: "Vùng đồng bằng cửa sông Delta rộng lớn với hệ thống cầu bê tông bắc ngang sông, kênh rạch và bãi cạn. Điểm nóng di cư và phục kích Deino.",
      color: "#38bdf8"
    },
    {
      id: "west_rail",
      name: "WEST RAIL",
      subName: "Wesrell / Đường Ray Tây & Hồ West Rail",
      x: 22,
      y: 54,
      size: "large",
      tag: "Hồ & Tuyến đường ray",
      desc: "Tuyến đường sắt công nghiệp phía Tây nối giữa đầm lầy và cao nguyên. Nổi tiếng với hồ nước ngọt West Rail Pond và bãi cỏ xanh.",
      color: "#fbbf24"
    },
    {
      id: "water_access",
      name: "WATER ACCESS",
      subName: "Đập Nước Water Access & Hồ Lớn Phía Bắc",
      x: 52,
      y: 31,
      size: "large",
      tag: "Đập nước khổng lồ & Hồ chứa",
      desc: "Hồ chứa nước ngọt khổng lồ phía Bắc có công trình đập bê tông xả tràn. Điểm tụ họp uống nước và săn mồi nhộn nhịp bậc nhất.",
      color: "#0ea5e9"
    },
    {
      id: "highlands",
      name: "HIGHLANDS",
      subName: "Cao Nguyên / Hồ Highland Lake & Sanctuary",
      x: 42,
      y: 43,
      size: "large",
      tag: "Đỉnh núi & Sanctuary",
      desc: "Vùng núi cao nguyên mát mẻ, địa hình dốc đá hùng vĩ với hồ Highland Lake trên đỉnh núi và khu bảo hộ Sanctuary an toàn cho baby dino.",
      color: "#a855f7"
    },
    {
      id: "south_plains",
      name: "SOUTH PLAINS",
      subName: "Thảo Nguyên Phía Nam (Hotspot PVP)",
      x: 54,
      y: 74,
      size: "large",
      tag: "Bình nguyên trung tâm PVP",
      desc: "Bình nguyên đồng cỏ rộng lớn bậc nhất phía Nam Gateway. Nơi tụ họp đông đúc nhất của các loài khủng long ăn cỏ và thợ săn Apex Carnivore.",
      color: "#f43f5e"
    },
    {
      id: "dome_facility",
      name: "GATEWAY DOME",
      subName: "Mái Vòm Nghiên Cứu Sinh Thái (Bio Dome)",
      x: 42,
      y: 65,
      size: "large",
      tag: "Căn cứ khoa học ngầm",
      desc: "Khu phức hợp nhà vòm nhân tạo và hệ thống phòng thí nghiệm ngầm của con người trên đảo Gateway, nằm giữa đồng bằng và rừng rậm.",
      color: "#ec4899"
    },
    {
      id: "swamp",
      name: "SWAMP & MUDFLATS",
      subName: "Vùng Đầm Lầy & Rừng Ngập Mặn Phía Nam",
      x: 36,
      y: 86,
      size: "large",
      tag: "Lãnh địa Cá Sấu Deinosuchus",
      desc: "Vùng đầm lầy âm u, nhiều kênh rạch sâu, bãi bùn lầy và bèo tây. Địa bàn săn mồi số một của sát thủ rình rập Deinosuchus.",
      color: "#14b8a6"
    },
    {
      id: "volcano",
      name: "VOLCANO (CRATER)",
      subName: "Miệng Núi Lửa & Lòng Chảo Đông Bắc",
      x: 70,
      y: 32,
      size: "large",
      tag: "Miệng núi lửa cổ",
      desc: "Lòng chảo núi lửa cổ với hồ nước sâu và vách đá dốc đứng cheo leo hiểm trở, giáp ranh tán rừng nguyên sinh.",
      color: "#f97316"
    },
    {
      id: "center_lake",
      name: "CENTER VALLEY",
      subName: "Thung Lũng & Hồ Trung Tâm Gateway",
      x: 48,
      y: 50,
      size: "large",
      tag: "Trái tim Gateway",
      desc: "Lòng chảo thung lũng và hồ nước ngọt trung tâm đảo, ngã ba huyết mạch giao tranh quyết liệt giữa các bầy đàn khủng long.",
      color: "#06b6d4"
    },
    {
      id: "north_plains",
      name: "NORTH PLAINS",
      subName: "Thảo Nguyên Bắc (North Steppe)",
      x: 40,
      y: 22,
      size: "large",
      tag: "Đồng cỏ hoang sơ",
      desc: "Khu vực đồng bằng phía Bắc dãy núi, thảm thực vật phong phú, nhiều rễ cây và nấm, ít kẻ săn mồi lớn rình rập.",
      color: "#34d399"
    },
    {
      id: "nw_steppe",
      name: "NW STEPPE",
      subName: "Bình Nguyên Tây Bắc (NW Coast)",
      x: 24,
      y: 32,
      size: "medium",
      tag: "Bờ biển & Đồi núi",
      desc: "Vùng đồi thảo nguyên giáp bờ biển Tây Bắc, không khí thoáng đãng, nhiều rễ cây và hoa màu dinh dưỡng.",
      color: "#10b981"
    },
    {
      id: "east_jungle",
      name: "EAST JUNGLE",
      subName: "Rừng Rậm Đông & Thung Lũng Cổ",
      x: 78,
      y: 44,
      size: "large",
      tag: "Tán rừng nhiệt đới cổ",
      desc: "Khu rừng già phía Đông với tán cây cao rậm rạp, thảm thực vật nhiệt đới phong phú cho loài ăn quả và thợ săn rình mồi.",
      color: "#10b981"
    },
    {
      id: "south_cliffs",
      name: "SOUTH CLIFFS",
      subName: "Vách Đá & Bờ Biển Nam (South Coast)",
      x: 52,
      y: 88,
      size: "medium",
      tag: "Vách đá ven biển",
      desc: "Vùng đồng cỏ ven biển ôn hòa phía Nam, chân các vách đá cao nhìn ra đại dương bao la.",
      color: "#eab308"
    },
    {
      id: "airfield",
      name: "AIRFIELD & HARBOR",
      subName: "Sân Bay & Bến Cảng Tây Nam",
      x: 12,
      y: 82,
      size: "medium",
      tag: "Căn cứ bỏ hoang",
      desc: "Mũi đất Tây Nam với đường băng cất cánh quân sự, container rỉ sét và ngọn hải đăng cổ bỏ hoang.",
      color: "#64748b"
    }
  ],

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

  // Ước tính độ cao địa hình (Z) tự động của Gateway theo tọa độ in-game (mét)
  getElevationZ(ingameX, ingameY) {
    const dist = Math.sqrt(ingameX * ingameX + ingameY * ingameY);
    if (dist > 6500) return 0; // Ngoài biển

    // 1. Vùng Cao nguyên Đông Bắc (Highlands Sanctuary): Đỉnh núi cao
    const distNorthHighlands = Math.hypot(ingameX - 2200, ingameY + 2500);
    let peakBonus = 0;
    if (distNorthHighlands < 2600) {
      peakBonus += Math.cos((distNorthHighlands / 2600) * (Math.PI / 2)) * 260;
    }

    // 2. Vách đá & Rặng núi Nam
    const distSouthRidge = Math.hypot(ingameX - 1000, ingameY - 3500);
    if (distSouthRidge < 2200) {
      peakBonus += Math.cos((distSouthRidge / 2200) * (Math.PI / 2)) * 165;
    }

    // 3. Vùng Đầm lầy phía Tây (Swamp Lowlands): Trũng sát mực nước biển
    const distWestSwamp = Math.hypot(ingameX + 3000, ingameY - 1500);
    let swampReduction = 0;
    if (distWestSwamp < 2000) {
      swampReduction = 25;
    }

    // 4. Độ cao nền thoai thoải từ bờ biển (0m) vào lõi thung lũng (~40m)
    const baseElev = Math.max(0, Math.min(45, (1 - dist / 6200) * 45));
    let z = Math.round(baseElev + peakBonus - swampReduction);
    return Math.max(0, Math.min(420, z));
  },

  // Cấu hình Sự kiện Đại Di Cư (Great Migration)
  greatMigration: {
    active: true,
    title: "Cao Nguyên (Highlands Sanctuary Corridor)",
    corridorName: "Thung Lũng Trung Tâm ➔ Cao Nguyên",
    center: { x: 42, y: 43 }, // Phần trăm (%)
    ingameCoord: "X: -550, Y: -1200",
    radius: 90, // Bán kính trên hệ tọa độ SVG 1000x1000
    diets: "🌾 Cỏ non (Lines), Củ ngọt (Dots), Cây bụi (Slices)",
    herbivores: "Stegosaurus, Tenontosaurus, Gallimimus, Diabloceratops, Pachy",
    threats: "Tyrannosaurus Rex, Carnotaurus, Ceratosaurus, Herrerasaurus",
    buffText: "+100% Tốc độ tăng trưởng khi ăn cỏ/thịt tại vùng di cư",
    corridors: [
      { from: { x: 480, y: 500 }, to: { x: 420, y: 430 }, name: "Hành lang Trung Tâm ➔ Cao Nguyên" },
      { from: { x: 630, y: 580 }, to: { x: 480, y: 500 }, name: "Hành lang Delta ➔ Thung Lũng Trung Tâm" },
      { from: { x: 220, y: 540 }, to: { x: 420, y: 430 }, name: "Hành lang West Rail ➔ Cao Nguyên" }
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
      x: 42, 
      y: 43, 
      danger: "CỰC ĐỘ (Chiến trường toàn server)", 
      desc: "Tâm chấn Đại Di Cư hiện tại tại vùng Cao Nguyên. Nơi tụ họp đàn khủng long ăn cỏ khổng lồ và các loài Apex Carnivore săn mồi. Buff x2 Tốc độ phát triển!",
      diets: "🌾 Đầy đủ 3 dưỡng chất Lines // Dots / Slices"
    },
    { 
      name: "Vùng Di Cư: Cầu & Cửa Sông Delta (Delta River)", 
      type: "migration", 
      x: 63, 
      y: 58, 
      danger: "Rất cao (Deinosuchus & Carnivore phục kích)", 
      desc: "Đồng bằng cửa sông Delta rộng lớn với hệ thống cầu vượt bê tông và bãi cạn. Hành lang di chuyển trọng điểm.",
      diets: "🌾 Dưỡng chất Lines & Slices"
    },
    { 
      name: "Vùng Di Cư: West Rail (Wesrell Access)", 
      type: "migration", 
      x: 22, 
      y: 54, 
      danger: "Cao (Giao tranh đường sắt)", 
      desc: "Hành lang đường sắt công nghiệp và hồ nước West Rail Pond, nguồn thức ăn và nước uống dồi dào.",
      diets: "🌾 Dưỡng chất Dots ngọt & Lines"
    },
    { 
      name: "Vùng Di Cư: Thung Lũng Trung Tâm (Center Valley)", 
      type: "migration", 
      x: 48, 
      y: 50, 
      danger: "Rất cao (Ngã ba giao tranh)", 
      desc: "Vùng đồng cỏ chuyển tiếp lớn nhất giữa Đông và Tây Gateway, đàn di cư thường trung chuyển qua đây.",
      diets: "🌾 Dưỡng chất Lines & Dots"
    },
    { 
      name: "Vùng Di Cư: Thảo Nguyên Phía Nam (South Plains)", 
      type: "migration", 
      x: 54, 
      y: 74, 
      danger: "Cực độ (Hotspot PVP)", 
      desc: "Cánh đồng cỏ rộng bát ngát phía Nam, dồi dào cỏ mọng cho Gallimimus, Tenontosaurus và Diabloceratops.",
      diets: "🌾 Dưỡng chất Slices & Dots"
    },
    { 
      name: "Vùng Di Cư: Bình Nguyên Tây Bắc (North-West Steppe)", 
      type: "migration", 
      x: 24, 
      y: 32, 
      danger: "Trung bình", 
      desc: "Khu vực thảo nguyên đồi núi Tây Bắc, khí hậu trong lành, nhiều cụm nấm và rễ cây.",
      diets: "🌾 Dưỡng chất Lines & Slices"
    },
    { 
      name: "Vùng Di Cư: Vùng Trũng Đầm Lầy (Swamp Mudflats)", 
      type: "migration", 
      x: 36, 
      y: 86, 
      danger: "Cao (Cá sấu phục kích)", 
      desc: "Vùng cây bụi đầm lầy và rừng ngập mặn phía Nam chứa nhiều loại rễ và hoa sen dồi dào dinh dưỡng cho khủng long ăn củ.",
      diets: "🌾 Dưỡng chất Dots ngọt"
    },
    { 
      name: "Vùng Di Cư: Thung Lũng Rừng Đông (East Jungle Basin)", 
      type: "migration", 
      x: 78, 
      y: 44, 
      danger: "Cao (Thợ săn rình rập)", 
      desc: "Vạt rừng già với tán cây rậm rạp, trái cây nhiệt đới phong phú cho các loài ăn quả.",
      diets: "🌾 Dưỡng chất Slices"
    },
    { 
      name: "Vùng Di Cư: Đồng Cỏ Bờ Biển Nam (South Coast)", 
      type: "migration", 
      x: 52, 
      y: 88, 
      danger: "Thấp - Trung bình", 
      desc: "Vùng đồng cỏ ven biển ôn hòa phía nam vách đá.",
      diets: "🌾 Dưỡng chất Lines non"
    },
    { 
      name: "Vùng Di Cư: Thảo Nguyên Bắc (North Plains)", 
      type: "migration", 
      x: 40, 
      y: 22, 
      danger: "Trung bình", 
      desc: "Đồng cỏ cao nguyên phía bắc thung lũng, thưa thớt bóng người.",
      diets: "🌾 Dưỡng chất Lines & Dots"
    },

    // ==============================================================
    // 🛡️ 2. SANCTUARY (KHU AN TOÀN NẤM CHO BABY DINO)
    // ==============================================================
    { name: "Sanctuary Cao Nguyên (Highland Sanctuary)", type: "sanctuary", x: 42, y: 43, danger: "An toàn (Chỉ khủng long con)", desc: "Khu nấm an toàn cao nguyên, ong bắp cày bảo vệ baby khỏi khủng long lớn" },
    { name: "Sanctuary Đầm Lầy Nam (South Swamp Sanctuary)", type: "sanctuary", x: 36, y: 86, danger: "An toàn (Chỉ khủng long con)", desc: "Khu nấm an toàn trong rừng ngập mặn phía Nam cho baby dino" },
    { name: "Sanctuary Rừng Rậm Đông (East Jungle Sanctuary)", type: "sanctuary", x: 78, y: 44, danger: "An toàn (Chỉ khủng long con)", desc: "Khu trú ẩn trong thung lũng rậm rạp phía đông, râm mát và kín đáo" },
    { name: "Sanctuary Vách Đá Nam (South Cliffs Sanctuary)", type: "sanctuary", x: 52, y: 88, danger: "An toàn (Chỉ khủng long con)", desc: "Khu trú ẩn vách đá phía nam gần bờ biển" },
    { name: "Sanctuary Bờ Biển Tây Bắc (NW Coast Sanctuary)", type: "sanctuary", x: 24, y: 32, danger: "An toàn (Chỉ khủng long con)", desc: "Khu bảo hộ baby dino giáp bờ biển tây bắc" },
    { name: "Sanctuary Hồ Miệng Núi Lửa (East Crater Sanctuary)", type: "sanctuary", x: 70, y: 32, danger: "An toàn (Chỉ khủng long con)", desc: "Khu trú ẩn ẩn sâu trong lòng chảo núi lửa đông bắc" },

    // ==============================================================
    // 💧 3. NGUỒN NƯỚC, HỒ & CỬA SÔNG (WATER SOURCES)
    // ==============================================================
    { name: "Hồ Lớn Trung Tâm (Center Lake)", type: "water", x: 48, y: 50, danger: "Cực độ (Apex Carnivore)", desc: "Điểm uống nước nhộn nhịp nhất Gateway, thường xuyên diễn ra giao tranh đẫm máu" },
    { name: "Đập Nước Water Access (North Dam Reservoir)", type: "water", x: 52, y: 31, danger: "Cao (Phục kích bờ đập)", desc: "Hồ nước ngọt mênh mông với công trình đập thủy lợi khổng lồ ngăn dòng" },
    { name: "Hồ West Rail (West Rail Pond)", type: "water", x: 22, y: 54, danger: "Cao (Điểm nóng phục kích)", desc: "Hồ nước ngọt trong xanh bên tuyến đường sắt phía Tây, địa điểm tụ họp quen thuộc" },
    { name: "Hồ Cao Nguyên (Highland Lake)", type: "water", x: 42, y: 43, danger: "Rất cao (Chiến trường săn mồi)", desc: "Hồ nước lớn trên đỉnh cao nguyên dốc đá, nguồn nước chính của khu bảo tồn" },
    { name: "Hồ Miệng Núi Lửa (East Crater Lake)", type: "water", x: 70, y: 32, danger: "Cao (Phục kích bờ dốc)", desc: "Hồ nước nằm sâu trong lòng chảo núi lửa cổ phía đông bắc" },
    { name: "Sông & Cầu Delta (Delta River Forks)", type: "water", x: 63, y: 58, danger: "Cực độ (Deinosuchus rình mồi)", desc: "Hệ thống sông phân nhánh Delta đổ ra biển đông với bãi cát bồi và vùng nước cạn" },
    { name: "Đầm Lầy Phía Nam (Swamp & Mudflats Water)", type: "water", x: 36, y: 86, danger: "Rất cao (Lãnh địa Cá Sấu)", desc: "Mạng lưới kênh rạch ngập mặn chằng chịt, sào huyệt của sát thủ đầm lầy Deinosuchus" },

    // ==============================================================
    // 💀 4. ĐIỂM NÓNG PVP & CHIẾN TRƯỜNG (HOTSPOTS)
    // ==============================================================
    { name: "Thung Lũng Trung Tâm (Center Valley Hotspot)", type: "hotspot", x: 48, y: 50, danger: "TỬ ĐỊA (T-Rex, Cera, Carno)", desc: "Điểm nóng PVP lớn nhất server 3MGAMING, liên tục diễn ra các cuộc săn lùng tử thần" },
    { name: "Thảo Nguyên Nam (South Plains Hotspot)", type: "hotspot", x: 54, y: 74, danger: "Cực độ (Săn rượt đuổi tốc độ)", desc: "Bình nguyên đồng cỏ bát ngát phía Nam, nơi các đàn khủng long chạm trán khốc liệt" },
    { name: "Cầu Delta (Delta Bridge Hotspot)", type: "hotspot", x: 63, y: 58, danger: "Rất cao (Phục kích cầu & cửa sông)", desc: "Cây cầu bê tông bắc ngang sông Delta, nơi thường xuyên diễn ra các cuộc đột kích nghẹt thở" },
    { name: "Hồ West Rail (West Rail Pond Hotspot)", type: "hotspot", x: 22, y: 54, danger: "Cao (Chiến trường Tây)", desc: "Điểm giao chiến ác liệt quanh hồ nước ngọt West Rail và hành lang đường sắt" },
    { name: "Cao Nguyên (Highlands Hotspot)", type: "hotspot", x: 42, y: 43, danger: "Cực độ (Săn mồi cao nguyên)", desc: "Đỉnh cao nguyên lộng gió, địa hình vách đá tạo lợi thế chiến thuật tuyệt vời" },

    // ==============================================================
    // 🏛️ 5. CÔNG TRÌNH CON NGƯỜI & DI TÍCH (LANDMARKS)
    // ==============================================================
    { name: "Mái Vòm Nghiên Cứu Gateway (Bio Dome Facility)", type: "landmark", x: 42, y: 65, danger: "Bí ẩn", desc: "Mái vòm sinh học nhân tạo khổng lồ và phòng thí nghiệm ngầm bỏ hoang" },
    { name: "Đập Nước Water Access (North Dam Concrete)", type: "landmark", x: 52, y: 31, danger: "Nguy hiểm (Độ cao lớn)", desc: "Công trình đập bê tông khổng lồ kiểm soát dòng chảy lưu vực Bắc" },
    { name: "Cầu Cao Tốc Delta (Delta Highway Bridge)", type: "landmark", x: 63, y: 58, danger: "Cao (Gãy nhịp)", desc: "Cầu vượt bê tông hiện đại bắc ngang dòng sông Delta chảy ra biển" },
    { name: "Sân Bay & Bến Cảng Tây Nam (Airfield & Harbor)", type: "landmark", x: 12, y: 82, danger: "Thấp", desc: "Đường băng cất cánh quân sự và tổ hợp kho bãi container rỉ sét bỏ hoang" },
    { name: "Hải Đăng Tây Nam (South-West Lighthouse)", type: "landmark", x: 12, y: 84, danger: "Thấp", desc: "Ngọn hải đăng cổ kính đứng sừng sững trên mỏm đá bờ biển phía Tây Nam" },

    // ==============================================================
    // 🪺 6. KHU VỰC LÀM TỔ & AN TOÀN (NESTING GROUNDS)
    // ==============================================================
    { name: "Khu Làm Tổ Rừng Thông Bắc (North Pine Nesting)", type: "nesting", x: 40, y: 22, danger: "Yên tĩnh", desc: "Khu vực rừng thông râm mát, kín gió, nguồn thức ăn gần, hoàn hảo để làm tổ đẻ trứng" },
    { name: "Khu Làm Tổ Thung Lũng Kín (Hidden Valley Nesting)", type: "nesting", x: 74, y: 40, danger: "Kín đáo", desc: "Thung lũng trũng sâu được vách đá bao bọc, rất khó bị kẻ săn mồi phát hiện" },
    { name: "Khu Làm Tổ Vịnh Bờ Nam (South Bay Nesting)", type: "nesting", x: 52, y: 88, danger: "Yên bình", desc: "Bãi cát thoai thoải đón nắng ấm, an toàn cho khủng long ăn cỏ ấp trứng" }
  ],

  init() {
    this.setupInteractions();
    this.populatePoiSelect();
    this.updateBanner();
    this.fitToView();
    this.render();
    this.renderRegions();
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
      { id: 'regions', label: '🗺️ Các Vùng Bản Đồ Lớn (Delta, Wesrell...)' },
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
      if (g.id === 'regions') {
        items = this.regionsList.map(r => ({ name: `${r.name} (${r.subName})`, x: r.x, y: r.y }));
      } else if (g.id === 'greatmigration') {
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
    let pt = this.poiList.find(p => p.name === poiName);
    if (!pt) {
      const reg = this.regionsList.find(r => poiName.includes(r.name));
      if (reg) pt = { name: `${reg.name} (${reg.subName})`, x: reg.x, y: reg.y };
    }
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

      // 2. Tính toán tọa độ chuột theo hệ tọa độ Ingame của Gateway (X, Y, Z tự động)
      const rect = viewport.getBoundingClientRect();
      if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
        const surfaceX = (e.clientX - rect.left - this.panX) / this.zoom;
        const surfaceY = (e.clientY - rect.top - this.panY) / this.zoom;

        const pctX = (surfaceX / this.baseSize) * 100;
        const pctY = (surfaceY / this.baseSize) * 100;
        
        const world = this.normalizedToWorld(pctX / 100, pctY / 100);
        const ingameX = Math.round(world.worldX * 0.01);
        const ingameY = Math.round(world.worldY * 0.01);
        const ingameZ = this.getElevationZ(ingameX, ingameY);

        if (coordText) {
          coordText.textContent = `X: ${ingameX}, Y: ${ingameY}, Z: ${ingameZ}`;
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

    // 4. Click trên bản đồ để copy tọa độ X, Y, Z
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
      const ingameZ = this.getElevationZ(ingameX, ingameY);

      navigator.clipboard.writeText(`${ingameX}, ${ingameY}, ${ingameZ}`).then(() => {
        App.showToast(`📍 Đã sao chép tọa độ: X: ${ingameX}, Y: ${ingameY}, Z: ${ingameZ}`);
      }).catch(() => {
        App.showToast(`Tọa độ: X: ${ingameX}, Y: ${ingameY}, Z: ${ingameZ}`);
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
      App.showToast("⚠️ Vui lòng nhập tọa độ hoặc tên khu vực (Ví dụ: Delta, Wesrell, -200, 150)!");
      return;
    }

    const val = input.value.trim();
    const qLower = val.toLowerCase();

    // 1. Kiểm tra tìm theo tên khu vực Gateway (Delta, Wesrell, West Rail, Highlands...)
    const matchedRegion = this.regionsList.find(r => 
      r.id.toLowerCase().includes(qLower) || 
      r.name.toLowerCase().includes(qLower) || 
      r.subName.toLowerCase().includes(qLower) ||
      (qLower.includes('wesrell') && r.id === 'west_rail') ||
      (qLower.includes('west rail') && r.id === 'west_rail') ||
      (qLower.includes('delta') && r.id === 'delta') ||
      (qLower.includes('water') && r.id === 'water_access') ||
      (qLower.includes('highland') && r.id === 'highlands') ||
      (qLower.includes('swamp') && r.id === 'swamp') ||
      (qLower.includes('dome') && r.id === 'dome_facility') ||
      (qLower.includes('crater') && r.id === 'volcano') ||
      (qLower.includes('volcano') && r.id === 'volcano')
    );
    if (matchedRegion) {
      this.flyTo(matchedRegion.x, matchedRegion.y, 2.0);
      const world = this.normalizedToWorld(matchedRegion.x / 100, matchedRegion.y / 100);
      const ingameX = Math.round(world.worldX * 0.01);
      const ingameY = Math.round(world.worldY * 0.01);
      const ingameZ = this.getElevationZ(ingameX, ingameY);
      App.showToast(`🎯 Đã định vị khu vực: ${matchedRegion.name} (${matchedRegion.subName}) - Tọa độ: X: ${ingameX}, Y: ${ingameY}, Z: ${ingameZ}`);
      return;
    }

    // 2. Phân tích tọa độ số X, Y, Z
    const parts = val.split(/[,\s]+/).map(Number);
    if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) {
      App.showToast("⚠️ Vui lòng nhập tọa độ hợp lệ (X, Y, Z) hoặc tên khu vực (VD: Delta, Wesrell)!");
      return;
    }

    const ingameX = parts[0];
    const ingameY = parts[1];
    const ingameZ = (!isNaN(parts[2]) && parts[2] !== undefined) ? parts[2] : this.getElevationZ(ingameX, ingameY);

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
        Tọa độ X Y Z: X: ${ingameX}, Y: ${ingameY}, Z: ${ingameZ}
      </div>
    `;

    layer.appendChild(pin);
    this.userPin = pin;

    // Bay tới vị trí và zoom 2.0x
    this.flyTo(pctX, pctY, 2.0);
    App.showToast(`🎯 Đã định vị thành công: X: ${ingameX}, Y: ${ingameY}, Z: ${ingameZ}`);
  },

  // Hiển thị tên các khu vực chính thức chuẩn bản đồ Gateway (Delta, West Rail / Wesrell, South Plains...)
  renderRegions() {
    const layer = document.getElementById('map-regions-layer');
    if (!layer) return;

    if (!this.showRegions) {
      layer.style.display = 'none';
      return;
    }
    layer.style.display = 'block';
    layer.innerHTML = '';

    this.regionsList.forEach(r => {
      const el = document.createElement('div');
      el.className = `map-region-label region-size-${r.size || 'large'}`;
      el.style.left = `${r.x}%`;
      el.style.top = `${r.y}%`;
      el.setAttribute('data-region-id', r.id);

      const world = this.normalizedToWorld(r.x / 100, r.y / 100);
      const ingameX = Math.round(world.worldX * 0.01);
      const ingameY = Math.round(world.worldY * 0.01);
      const ingameZ = this.getElevationZ(ingameX, ingameY);

      el.innerHTML = `
        <div class="region-badge-pill" style="border-left: 3px solid ${r.color};">
          <span class="region-badge-dot" style="background: ${r.color}; box-shadow: 0 0 8px ${r.color};"></span>
          <span class="region-main-name">${r.name}</span>
        </div>
        <div class="region-sub-name">${r.subName}</div>
        <div class="map-tooltip region-tooltip">
          <strong style="color: ${r.color}; font-size: 0.92rem;">📍 Khu Vực: ${r.name}</strong><br>
          <span style="color: #fff; font-weight: 600;">${r.subName}</span><br>
          <span style="color: var(--text-muted); font-size: 0.8rem;">${r.desc}</span><br>
          <span style="color: #60a5fa; font-family: monospace; font-size: 0.82rem;">Tọa độ Gateway: X: ${ingameX}, Y: ${ingameY}, Z: ${ingameZ}</span><br>
          <span style="color: #fbbf24; font-size: 0.78rem;">👉 Bấm để phóng to và sao chép tọa độ</span>
        </div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this.flyTo(r.x, r.y, 2.0);
        navigator.clipboard.writeText(`${ingameX}, ${ingameY}, ${ingameZ}`).then(() => {
          App.showToast(`📍 Đã bay tới: ${r.name} (${r.subName}) - Đã sao chép X: ${ingameX}, Y: ${ingameY}, Z: ${ingameZ}`);
        }).catch(() => {
          App.showToast(`📍 ${r.name} (${r.subName}) - Tọa độ: X: ${ingameX}, Y: ${ingameY}, Z: ${ingameZ}`);
        });
      });

      layer.appendChild(el);
    });
  },

  toggleRegions(btn) {
    this.showRegions = !this.showRegions;
    if (btn) {
      btn.classList.toggle('active', this.showRegions);
    }
    this.renderRegions();
    App.showToast(this.showRegions ? "🗺️ Đã bật hiển thị tên khu vực Gateway" : "🗺️ Đã tắt hiển thị tên khu vực");
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
      const ingameZ = this.getElevationZ(ingameX, ingameY);

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
          <span style="color: #60a5fa;">Tọa độ Ingame: X: ${ingameX}, Y: ${ingameY}, Z: ${ingameZ}</span>
        </div>
      `;

      pin.addEventListener('click', (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(`${ingameX}, ${ingameY}, ${ingameZ}`).then(() => {
          App.showToast(`📌 ${pt.name} (Đã sao chép X: ${ingameX}, Y: ${ingameY}, Z: ${ingameZ})`);
        }).catch(() => {
          App.showToast(`📌 ${pt.name} (Tọa độ: X: ${ingameX}, Y: ${ingameY}, Z: ${ingameZ})`);
        });
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
    this.renderRegions();
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
      const mySteamId = (currentUser && currentUser.steamId) ? String(currentUser.steamId).trim() : '';
      const viewMode = localStorage.getItem('admin_view_mode') || 'guest';
      const isRealAdmin = !!(window.realAdminVerified || window.isUserAdmin);
      const isMapAdmin = !!window.isMapAdmin || (mySteamId === '76561199319732549');
      const isAdminView = (isRealAdmin && (viewMode !== 'guest')) || isMapAdmin;

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
    const isMapAdmin = !!window.isMapAdmin || (mySteamId === '76561199319732549');
    const isAdminView = (isRealAdmin && (viewMode !== 'guest')) || isMapAdmin;

    let displayedPlayers = [];
    if (isAdminView) {
      // Chế độ Admin hoặc Quyền Xem Bản Đồ: Hiển thị đầy đủ tất cả người chơi
      displayedPlayers = onlinePlayers;
      if (countEl) {
        countEl.textContent = `${onlinePlayers.length} người chơi`;
      }
      if (unitEl) {
        unitEl.textContent = isRealAdmin ? '(Toàn bộ Server - Chế độ Admin)' : '(Toàn bộ Server - Quyền Xem Bản Đồ)';
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
            <span style="color: #60a5fa; font-family: monospace;">Tọa độ X Y Z: X: ${coords.mX}, Y: ${coords.mY}, Z: ${coords.alt}</span><br>
            <span style="color: #94a3b8;">Hướng nhìn (Yaw): ${Math.round(coords.yaw)}°</span>
          </div>
        `;

        pin.addEventListener('click', (e) => {
          e.stopPropagation();
          this.flyTo(coords.pctX, coords.pctY, 2.2);
          navigator.clipboard.writeText(`${coords.mX}, ${coords.mY}, ${coords.alt}`).then(() => {
            App.showToast(`🎯 ${isMe ? 'Vị trí của bạn' : 'Người chơi'}: ${playerName} - Đã sao chép X: ${coords.mX}, Y: ${coords.mY}, Z: ${coords.alt}`);
          }).catch(() => {
            App.showToast(`🎯 ${isMe ? 'Vị trí của bạn' : 'Người chơi'}: ${playerName} (${speciesName}) - Tọa độ: X: ${coords.mX}, Y: ${coords.mY}, Z: ${coords.alt}`);
          });
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
            <span style="color: #60a5fa; font-family: monospace;">Tọa độ X Y Z: X: ${coords.mX}, Y: ${coords.mY}, Z: ${coords.alt}</span><br>
            <span style="color: #94a3b8;">Hướng nhìn (Yaw): ${Math.round(coords.yaw)}°</span>
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
