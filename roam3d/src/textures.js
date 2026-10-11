// src/textures.js
// Procedural high-resolution textures for 3D buildings, rooftops, roads, zebra crossings, and grass.
// Built entirely with HTML5 Canvas (power-of-2 dimensions: 512x512, 256x256).
// Seamlessly registered into MapLibre GL JS sprite atlas via map.addImage().

/**
 * Creates a high-resolution Parisian Haussmann building facade (512x512).
 * Features:
 * - Ground floor: Boutique storefront, dark oak panels, entrance door, display vitrine with warm interior light.
 * - Upper floors: Fine limestone masonry blocks, tall French windows with mullions and glass reflections,
 *   ornate black wrought-iron balconies, stone pediments, and sills.
 * - Top floor: Blue-grey zinc mansard roof with dormer windows, rooftop A/C compressor units, and chimneys.
 */
export function createHaussmannFacadeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // 1. Base Parisian Lutetian limestone (Pierre de Paris) with natural warm tone
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#e8dfd1');
  grad.addColorStop(0.5, '#dfd5c4');
  grad.addColorStop(1, '#d8cdbb');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  // Subtle natural limestone grain
  for (let i = 0; i < 400; i++) {
    const rx = Math.random() * 256;
    const ry = Math.random() * 256;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(90,80,65,0.06)';
    ctx.fillRect(rx, ry, 2, 2);
  }

  // 2. Horizontal architectural stringcourses (cornices dividing floors)
  // Floor 1 (top): y 0..128, Floor 2 (bottom): y 128..256
  const stringcourses = [0, 128, 254];
  stringcourses.forEach(y => {
    // Upper highlight
    ctx.fillStyle = '#f3ebe0';
    ctx.fillRect(0, y, 256, 2);
    // Main stone mould
    ctx.fillStyle = '#c7bca9';
    ctx.fillRect(0, y + 2, 256, 4);
    // Cast shadow beneath cornice
    ctx.fillStyle = '#8b8070';
    ctx.fillRect(0, y + 6, 256, 2);
  });

  // 3. Delicate ashlar masonry block joints
  ctx.strokeStyle = 'rgba(135, 122, 105, 0.4)';
  ctx.lineWidth = 1;
  // Intermediate horizontal stone courses
  [32, 64, 96, 160, 192, 224].forEach(y => {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  });

  // Staggered vertical ashlar mortar joints
  for (let y = 0; y < 256; y += 32) {
    const shift = (y % 64 === 0) ? 0 : 32;
    for (let x = shift; x <= 256; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 32);
      ctx.stroke();
    }
  }

  // Helper: Draw authentic French window with glass reflections & optional balcony
  function drawWindow(centerX, topY, width, height, hasBalcony) {
    const leftX = centerX - width / 2;

    // A. Stone lintel / pediment above window
    ctx.fillStyle = '#c8bca9';
    ctx.fillRect(leftX - 4, topY - 7, width + 8, 6);
    // Decorative keystones in center
    ctx.fillStyle = '#b7ab97';
    ctx.fillRect(centerX - 4, topY - 10, 8, 9);

    // B. Stone window sill at bottom
    ctx.fillStyle = '#c2b5a1';
    ctx.fillRect(leftX - 4, topY + height, width + 8, 5);
    ctx.fillStyle = '#7a7060'; // sill drop shadow
    ctx.fillRect(leftX - 3, topY + height + 5, width + 6, 2);

    // C. Dark wood/graphite window frame
    ctx.fillStyle = '#16191d';
    ctx.fillRect(leftX, topY, width, height);

    // D. Reflective glass panes with sky gradient & soft ambient reflection
    const glassX = leftX + 2.5;
    const glassY = topY + 2.5;
    const glassW = width - 5;
    const glassH = height - 5;
    const glassGrad = ctx.createLinearGradient(glassX, glassY, glassX + glassW, glassY + glassH);
    glassGrad.addColorStop(0, '#2e496b');
    glassGrad.addColorStop(0.35, '#4f7ba8');
    glassGrad.addColorStop(0.5, '#76a5d4');
    glassGrad.addColorStop(1, '#1b324d');
    ctx.fillStyle = glassGrad;
    ctx.fillRect(glassX, glassY, glassW, glassH);

    // E. White interior curtains hint at edges
    ctx.fillStyle = 'rgba(255, 252, 240, 0.22)';
    ctx.fillRect(glassX, glassY, 5, glassH);
    ctx.fillRect(glassX + glassW - 5, glassY, 5, glassH);

    // F. Window cross mullions (French window dividers)
    ctx.fillStyle = '#d5dfeb';
    // Vertical center mullion
    ctx.fillRect(centerX - 1, glassY, 2, glassH);
    // Horizontal transom bars
    ctx.fillRect(glassX, glassY + glassH * 0.35, glassW, 2);
    ctx.fillRect(glassX, glassY + glassH * 0.72, glassW, 2);

    // G. Ornate Parisian wrought-iron balcony railing (Garde-corps)
    if (hasBalcony) {
      const balH = 26;
      const balY = topY + height - balH + 3;
      const balW = width + 10;
      const balL = centerX - balW / 2;

      // Balcony cantilever stone slab
      ctx.fillStyle = '#b5a794';
      ctx.fillRect(balL - 2, balY + balH - 3, balW + 4, 5);
      ctx.fillStyle = '#6e6455';
      ctx.fillRect(balL - 1, balY + balH + 2, balW + 2, 2);

      // Balcony frame (black wrought iron)
      ctx.fillStyle = '#0f1115';
      ctx.fillRect(balL, balY, balW, 2); // top rail
      ctx.fillRect(balL, balY + balH - 4, balW, 2); // bottom rail
      ctx.fillRect(balL, balY, 2, balH - 4); // left post
      ctx.fillRect(balL + balW - 2, balY, 2, balH - 4); // right post

      // Handrail polished brass / bronze highlight
      ctx.fillStyle = '#374151';
      ctx.fillRect(balL - 1, balY - 1, balW + 2, 2);

      // Vertical balusters & geometric scrolls
      ctx.strokeStyle = '#0f1115';
      ctx.lineWidth = 1.5;
      for (let bx = balL + 4; bx <= balL + balW - 4; bx += 5.5) {
        ctx.beginPath();
        ctx.moveTo(bx, balY + 1);
        ctx.lineTo(bx, balY + balH - 3);
        ctx.stroke();
      }

      // Center decorative medallion
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(centerX, balY + balH / 2 - 1, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Draw 2 stories x 2 window bays:
  // Bay centers at x: 64 and x: 192 (each bay 128px wide = 2.6m real-world width)
  const bayX = [64, 192];

  // Story 1 (top half, y: 0..128): Classic upper French windows with stone pediment
  // Window: 48px wide (~1.25m) x 74px tall (~2.0m)
  bayX.forEach(x => {
    drawWindow(x, 28, 48, 74, false);
  });

  // Story 2 (bottom half, y: 128..256): Piano Nobile with grand wrought-iron balcony
  // Window: 50px wide (~1.3m) x 78px tall (~2.1m)
  bayX.forEach(x => {
    drawWindow(x, 150, 50, 78, true);
  });

  return ctx.getImageData(0, 0, 256, 256);
}

/**
 * Creates full-glass style building windows with dark blue tint (256x256).
 * Common in modern commercial city centers, business districts, and urban offices.
 * Features:
 * - Deep navy/sapphire dark blue tinted reflective architectural glass
 * - Subtle sky reflection sheen and realistic panel gradient
 * - Thin dark anodized aluminum vertical and horizontal structural mullions
 * - Floor spandrel division bands every 3.2 meters
 * - Realistic interior soft glow on selected office windows
 */
export function createDarkBlueGlassFacadeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // 1. Base dark blue curtain-wall glass
  const baseGrad = ctx.createLinearGradient(0, 0, 256, 256);
  baseGrad.addColorStop(0, '#0d1f35'); // Deep midnight navy
  baseGrad.addColorStop(0.3, '#132d4b');
  baseGrad.addColorStop(0.6, '#183c64'); // Sapphire blue reflection
  baseGrad.addColorStop(1, '#0b192c');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, 256, 256);

  // 2. Floor spandrel beams (structural divisions between floors at y=0, 128, 256)
  [0, 128, 254].forEach(y => {
    // Spandrel dark composite band
    ctx.fillStyle = '#08111d';
    ctx.fillRect(0, y, 256, 8);
    // Dark metallic horizontal accent
    ctx.fillStyle = '#1e3852';
    ctx.fillRect(0, y + 2, 256, 2);
  });

  // 3. Grid of full-glass window panels (4 columns x 4 rows per module)
  // Each panel: 60px wide (~1.5m) x 56px tall (~1.4m)
  const cols = [4, 68, 132, 196];
  const rows = [10, 68, 138, 196];

  rows.forEach((ry, rIdx) => {
    cols.forEach((cx, cIdx) => {
      const pw = 58;
      const ph = 54;

      // Dark blue tinted glass pane with diagonal daylight reflection
      const pGrad = ctx.createLinearGradient(cx, ry, cx + pw, ry + ph);
      pGrad.addColorStop(0, '#112c4d'); // Tinted glass
      pGrad.addColorStop(0.35, '#1e4875'); // Blue sky tint
      pGrad.addColorStop(0.55, '#356e9e'); // Sun reflection sheen
      pGrad.addColorStop(0.75, '#1b3f68');
      pGrad.addColorStop(1, '#0e243f'); // Deep tint shadow

      ctx.fillStyle = pGrad;
      ctx.fillRect(cx, ry, pw, ph);

      // Office interior light hint on occasional windows (working city vibe)
      if ((rIdx + cIdx * 2) % 5 === 0) {
        ctx.fillStyle = 'rgba(254, 240, 138, 0.14)';
        ctx.fillRect(cx + 8, ry + 12, pw - 16, ph - 24);
        // Blinds / louvers silhouette
        ctx.fillStyle = 'rgba(10, 25, 45, 0.4)';
        for (let ly = ry + 14; ly < ry + ph - 14; ly += 5) {
          ctx.fillRect(cx + 8, ly, pw - 16, 1.5);
        }
      }

      // Glass bevel / perimeter edge silicone seal
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx + 0.5, ry + 0.5, pw - 1, ph - 1);
    });
  });

  // 4. Heavy structural vertical mullions (dark graphite steel)
  [0, 64, 128, 192, 254].forEach(x => {
    ctx.fillStyle = '#060d15';
    ctx.fillRect(x, 0, 4, 256);
    ctx.fillStyle = '#223c56'; // subtle edge highlight
    ctx.fillRect(x + 1, 0, 1, 256);
  });

  return ctx.getImageData(0, 0, 256, 256);
}

/**
 * Creates modern city mixed facade with dark stone & reflective blue glass (256x256).
 */
export function createCityModernFacadeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Dark architectural granite base
  ctx.fillStyle = '#1c222b';
  ctx.fillRect(0, 0, 256, 256);

  // Ashlar granite piers
  [0, 85, 170, 254].forEach(x => {
    ctx.fillStyle = '#262f3c';
    ctx.fillRect(x, 0, 12, 256);
    ctx.fillStyle = '#3a475a';
    ctx.fillRect(x + 1, 0, 2, 256);
  });

  // Floor horizontal slabs
  [0, 128, 254].forEach(y => {
    ctx.fillStyle = '#181e26';
    ctx.fillRect(0, y, 256, 10);
    ctx.fillStyle = '#323e4e';
    ctx.fillRect(0, y + 2, 256, 2);
  });

  // Large floor-to-ceiling blue tinted windows
  const windowBays = [14, 99, 184];
  const windowFloors = [12, 140];

  windowFloors.forEach(wy => {
    windowBays.forEach(wx => {
      const ww = 69;
      const wh = 114;

      // Dark blue glass
      const g = ctx.createLinearGradient(wx, wy, wx + ww, wy + wh);
      g.addColorStop(0, '#102742');
      g.addColorStop(0.4, '#1b436e');
      g.addColorStop(0.6, '#285d94');
      g.addColorStop(1, '#0d1e34');
      ctx.fillStyle = g;
      ctx.fillRect(wx, wy, ww, wh);

      // Subtle horizontal window louvers
      ctx.fillStyle = '#0a1420';
      ctx.fillRect(wx, wy + wh * 0.45, ww, 2);
      ctx.fillRect(wx, wy + wh * 0.8, ww, 2);
      ctx.fillRect(wx + ww / 2, wy, 2, wh);

      // Glass edge reflection
      ctx.strokeStyle = 'rgba(147, 197, 253, 0.25)';
      ctx.lineWidth = 1;
      ctx.strokeRect(wx, wy, ww, wh);
    });
  });

  return ctx.getImageData(0, 0, 256, 256);
}

/**
 * Creates warm cream Parisian townhouse facade with classical French windows (256x256).
 */
export function createHaussmannWarmFacadeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Warm cream stone (Pierre calcaire blonde)
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#ebe1cf');
  grad.addColorStop(0.5, '#dfd5bf');
  grad.addColorStop(1, '#d5c9b0');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  // Stringcourses
  [0, 128, 254].forEach(y => {
    ctx.fillStyle = '#f8f2e4';
    ctx.fillRect(0, y, 256, 2);
    ctx.fillStyle = '#baa98f';
    ctx.fillRect(0, y + 2, 256, 5);
    ctx.fillStyle = '#7a6a52';
    ctx.fillRect(0, y + 7, 256, 2);
  });

  // Windows
  [64, 192].forEach(x => {
    // Upper floor arched windows
    const drawArchedWindow = (cx, topY, w, h) => {
      const left = cx - w / 2;
      ctx.fillStyle = '#baa98f';
      ctx.fillRect(left - 4, topY - 5, w + 8, h + 10);
      ctx.fillStyle = '#14181d';
      ctx.fillRect(left, topY, w, h);

      // Blue sky reflection
      const g = ctx.createLinearGradient(left, topY, left + w, topY + h);
      g.addColorStop(0, '#1e3857');
      g.addColorStop(0.5, '#3b6a98');
      g.addColorStop(1, '#182b42');
      ctx.fillStyle = g;
      ctx.fillRect(left + 2, topY + 2, w - 4, h - 4);

      // White mullions
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(cx - 1, topY + 2, 2, h - 4);
      ctx.fillRect(left + 2, topY + h * 0.45, w - 4, 2);
    };

    drawArchedWindow(x, 26, 46, 76);
    drawArchedWindow(x, 152, 48, 78);
  });

  return ctx.getImageData(0, 0, 256, 256);
}

/**
 * Creates high-resolution rooftop AC outdoor unit texture (256x256).
 * Shows a realistic top-view of split-type air conditioner outdoor units:
 * - White/grey condenser box with fan grille
 * - Copper pipe connections
 * - Condenser fins visible through the grille
 * - Unit branding color stripe
 * Multiple units arranged on a flat grey membrane roof.
 */
export function createRooftopTexture(variant = 0) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  // A seeded generator keeps rooftop details identical across map reloads and
  // camera movement while allowing distinct, repeatable building variants.
  let seed = (0x4f1bbcdc + Math.max(0, variant | 0) * 0x6d2b79f5) >>> 0;
  const random = () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };

  // Base flat membrane / bitumen roof (very dark grey)
  ctx.fillStyle = '#2d3340';
  ctx.fillRect(0, 0, 256, 256);

  // Subtle gravel texture
  for (let i = 0; i < 400; i++) {
    const x = random() * 256;
    const y = random() * 256;
    const gray = Math.floor(random() * 30 + 35);
    ctx.fillStyle = `rgb(${gray},${gray+2},${gray+4})`;
    ctx.fillRect(x, y, 1.5, 1.5);
  }

  // Helper: Draw one AC outdoor unit (top-down view)
  function drawACUnit(ux, uy, unitW, unitH, rotation, finish, stripe) {
    ctx.save();
    ctx.translate(ux + unitW / 2, uy + unitH / 2);
    ctx.rotate(rotation || 0);
    ctx.translate(-unitW / 2, -unitH / 2);

    // Unit body — off-white / beige casing
    ctx.fillStyle = finish;
    ctx.fillRect(0, 0, unitW, unitH);
    ctx.strokeStyle = '#8a919e';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0, 0, unitW, unitH);

    // Brand color stripe at top of unit
    ctx.fillStyle = stripe;
    ctx.fillRect(0, 0, unitW, 5);

    // Fan grille area
    const fanCX = unitW * 0.38;
    const fanCY = unitH * 0.5;
    const fanR = Math.min(unitW, unitH) * 0.32;

    ctx.fillStyle = '#9ca3af';
    ctx.beginPath();
    ctx.arc(fanCX, fanCY, fanR + 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1c2231';
    ctx.beginPath();
    ctx.arc(fanCX, fanCY, fanR, 0, Math.PI * 2);
    ctx.fill();

    // Fan blades
    ctx.strokeStyle = '#4b5563';
    ctx.lineWidth = fanR * 0.38;
    ctx.lineCap = 'round';
    for (let b = 0; b < 3; b++) {
      const angle = (b / 3) * Math.PI * 2 + 0.4;
      ctx.beginPath();
      ctx.moveTo(fanCX + Math.cos(angle) * 4, fanCY + Math.sin(angle) * 4);
      ctx.lineTo(fanCX + Math.cos(angle) * fanR * 0.78, fanCY + Math.sin(angle) * fanR * 0.78);
      ctx.stroke();
    }
    ctx.fillStyle = '#6b7280';
    ctx.beginPath();
    ctx.arc(fanCX, fanCY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d1d5db';
    ctx.beginPath();
    ctx.arc(fanCX, fanCY, 2, 0, Math.PI * 2);
    ctx.fill();

    // Condenser fins (right side)
    const finX = unitW * 0.65;
    ctx.fillStyle = '#adb5c0';
    ctx.fillRect(finX, 6, unitW - finX - 4, unitH - 12);
    ctx.strokeStyle = '#8a939f';
    ctx.lineWidth = 0.8;
    for (let fy = 8; fy < unitH - 6; fy += 3) {
      ctx.beginPath();
      ctx.moveTo(finX + 1, fy);
      ctx.lineTo(unitW - 5, fy);
      ctx.stroke();
    }

    // Copper pipes
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(8, unitH - 2);
    ctx.lineTo(8, unitH + 5);
    ctx.stroke();
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(13, unitH - 2);
    ctx.lineTo(13, unitH + 5);
    ctx.stroke();

    ctx.restore();
  }

  // Slightly vary unit dimensions, casing finishes and accent colors by roof.
  const scale = [0.82, 0.94, 1.08, 1.20][Math.max(0, variant | 0) % 4];
  const finishes = ['#d2d4d1', '#c4cbd0', '#ded8ca', '#b9c1c6'];
  const stripes = ['#426a9a', '#a85d3b', '#407b72', '#8f564b'];
  const unitSpecs = [
    [20, 30, 70, 45, 0], [20, 82, 70, 45, 0], [110, 20, 55, 38, 0],
    [175, 20, 55, 38, 0], [140, 100, 60, 40, Math.PI / 2], [30, 160, 65, 42, 0],
    [110, 155, 55, 38, Math.PI], [175, 150, 55, 38, 0], [30, 210, 55, 35, Math.PI / 2],
    [120, 210, 55, 35, 0], [185, 210, 55, 35, Math.PI],
  ];
  unitSpecs.forEach(([x, y, w, h, rotation], index) => {
    const unitScale = scale * (0.88 + random() * 0.24);
    const unitW = w * unitScale;
    const unitH = h * unitScale;
    const jitterX = (random() - 0.5) * 7;
    const jitterY = (random() - 0.5) * 7;
    drawACUnit(x + jitterX, y + jitterY, unitW, unitH, rotation,
      finishes[(index + (variant | 0)) % finishes.length],
      stripes[(index * 3 + (variant | 0)) % stripes.length]);
  });

  // Roof drainage hatch
  ctx.fillStyle = '#1a1f2b';
  ctx.fillRect(200, 80, 28, 20);
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 1;
  ctx.strokeRect(200, 80, 28, 20);

  return ctx.getImageData(0, 0, 256, 256);
}


/**
 * Creates high-resolution road asphalt texture with white dashed lane markings (256x256).
 */
export function createRoadAsphaltTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Dark asphalt base
  ctx.fillStyle = '#262930';
  ctx.fillRect(0, 0, 256, 256);

  // Subtle aggregate grain
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.15)';
    ctx.fillRect(x, y, 1.5, 1.5);
  }

  // White lane center line (dashed)
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(124, 30, 8, 80);
  ctx.fillRect(124, 150, 8, 80);

  // Solid edge curb lines
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(10, 0, 4, 256);
  ctx.fillRect(242, 0, 4, 256);

  return ctx.getImageData(0, 0, 256, 256);
}

/**
 * Creates Parisian pedestrian zebra crossing stripes texture (256x256).
 */
export function createZebraCrossingTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Asphalt ground
  ctx.fillStyle = '#23272e';
  ctx.fillRect(0, 0, 256, 256);

  // Bold white thermoplastic zebra bars
  ctx.fillStyle = '#ffffff';
  for (let y = 16; y < 256; y += 48) {
    ctx.fillRect(20, y, 216, 26);
  }

  return ctx.getImageData(0, 0, 256, 256);
}

/**
 * Creates Parisian sidewalk paving stones / pavement texture (256x256).
 */
export function createPavementTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Granite pavement stone color
  ctx.fillStyle = '#d5cbbd';
  ctx.fillRect(0, 0, 256, 256);

  // Paving stone grid pattern
  ctx.strokeStyle = '#a89c8a';
  ctx.lineWidth = 1.5;
  for (let y = 0; y < 256; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
    const offset = (y % 64 === 0) ? 0 : 24;
    for (let x = offset; x < 256; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 32);
      ctx.stroke();
    }
  }

  return ctx.getImageData(0, 0, 256, 256);
}

/**
 * Creates ultra-detailed 512x512 asphalt road texture with aggregate mineral speckles,
 * bitumen pitch, tire wear lines, micro-fissures, and clean border curbs.
 */
export function createHighResAsphaltTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Deep matte asphalt base
  ctx.fillStyle = '#1c2027';
  ctx.fillRect(0, 0, 512, 512);

  // Crushed granite mineral speckles & bitumen texture
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 32;
    data[i] = Math.max(16, Math.min(65, data[i] + noise));
    data[i + 1] = Math.max(18, Math.min(68, data[i + 1] + noise));
    data[i + 2] = Math.max(22, Math.min(74, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  // Subtle darker oil stains in lane centers
  const stainGrad = ctx.createLinearGradient(0, 0, 512, 0);
  stainGrad.addColorStop(0, 'rgba(15, 17, 21, 0.4)');
  stainGrad.addColorStop(0.28, 'rgba(10, 12, 16, 0.65)');
  stainGrad.addColorStop(0.5, 'rgba(28, 32, 40, 0.1)');
  stainGrad.addColorStop(0.72, 'rgba(10, 12, 16, 0.65)');
  stainGrad.addColorStop(1, 'rgba(15, 17, 21, 0.4)');
  ctx.fillStyle = stainGrad;
  ctx.fillRect(0, 0, 512, 512);

  // Tar seam & micro-crack repairs
  ctx.strokeStyle = '#12151a';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(80, 0);
  ctx.bezierCurveTo(85, 160, 72, 320, 90, 512);
  ctx.moveTo(420, 0);
  ctx.bezierCurveTo(410, 180, 435, 360, 415, 512);
  ctx.stroke();

  // Crisp white dashed center lane markings
  ctx.fillStyle = '#ffffff';
  for (let y = 30; y < 512; y += 128) {
    ctx.fillRect(250, y, 12, 70);
  }

  // Solid edge shoulder lines
  ctx.fillStyle = 'rgba(240, 244, 255, 0.9)';
  ctx.fillRect(16, 0, 8, 512);
  ctx.fillRect(488, 0, 8, 512);

  return ctx.getImageData(0, 0, 512, 512);
}

/**
 * Creates 512x512 authentic Parisian sandstone & granite pavement tiles
 * with bevelled joints, chamfers, and natural stone color variation.
 */
export function createParisianPavementTileTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Warm Parisian sandstone base
  ctx.fillStyle = '#cfc5b4';
  ctx.fillRect(0, 0, 512, 512);

  // Stone block grid (32x64 interlocking pavers)
  const colors = ['#d8cebe', '#c9bfaf', '#ded4c4', '#c2b8a7', '#d3c9b8'];
  for (let y = 0; y < 512; y += 32) {
    const shift = (Math.floor(y / 32) % 2 === 0) ? 0 : 32;
    for (let x = -32 + shift; x < 544; x += 64) {
      const col = colors[Math.floor(Math.random() * colors.length)];
      ctx.fillStyle = col;
      ctx.fillRect(x + 2, y + 2, 60, 28);

      // Bevel highlight (top & left)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.fillRect(x + 2, y + 2, 60, 2);
      ctx.fillRect(x + 2, y + 2, 2, 28);

      // Bevel shadow (bottom & right)
      ctx.fillStyle = 'rgba(70, 60, 45, 0.35)';
      ctx.fillRect(x + 2, y + 28, 60, 2);
      ctx.fillRect(x + 60, y + 2, 2, 28);
    }
  }

  // Dark mortar joints
  ctx.strokeStyle = '#5a5043';
  ctx.lineWidth = 2;
  for (let y = 0; y <= 512; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  return ctx.getImageData(0, 0, 512, 512);
}

/**
 * Creates authentic Parisian aerial satellite rooftop texture (512x512).
 * Shows genuine aerial views of Paris:
 * - Blue-grey zinc standing-seam mansard panels
 * - Patina copper domes and green roofs
 * - Terracotta chimneys and ventilation stacks
 * - Internal courtyards with gravel / paving
 * - Rooftop skylights, terraces, and HVAC units
 */
export function createSatelliteRooftopTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // 1. Base Parisian zinc / slate aerial tone
  ctx.fillStyle = '#4a5568';
  ctx.fillRect(0, 0, 512, 512);

  // Zinc panel color variation (sections of roof)
  const roofSections = [
    { x: 0, y: 0, w: 256, h: 256, col: '#505d72' },
    { x: 256, y: 0, w: 256, h: 256, col: '#455062' },
    { x: 0, y: 256, w: 256, h: 256, col: '#4c586c' },
    { x: 256, y: 256, w: 256, h: 256, col: '#3e4856' },
  ];
  roofSections.forEach(s => {
    ctx.fillStyle = s.col;
    ctx.fillRect(s.x, s.y, s.w, s.h);
  });

  // 2. Standing-seam zinc roof ridges
  ctx.strokeStyle = '#2d3748';
  ctx.lineWidth = 1.5;
  for (let x = 12; x < 512; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }

  // 3. Central courtyard with paved stone / gravel
  ctx.fillStyle = '#2b313b';
  ctx.fillRect(160, 160, 192, 192);
  ctx.fillStyle = '#8c8072';
  ctx.fillRect(170, 170, 172, 172);

  // 4. Weathered copper green accent dormers (Patina de Paris)
  ctx.fillStyle = '#4e8775';
  ctx.fillRect(30, 40, 50, 70);
  ctx.fillRect(430, 40, 50, 70);
  ctx.fillRect(30, 390, 50, 70);
  ctx.fillRect(430, 390, 50, 70);

  // 5. Red terracotta chimney pots in Parisian rows
  ctx.fillStyle = '#9c4221';
  for (let x = 40; x < 480; x += 55) {
    // Top row
    ctx.beginPath();
    ctx.arc(x, 18, 5, 0, Math.PI * 2);
    ctx.fill();
    // Bottom row
    ctx.beginPath();
    ctx.arc(x, 494, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 6. Rooftop glass skylights with reflective glint
  ctx.fillStyle = '#1e3a5f';
  ctx.fillRect(80, 200, 45, 30);
  ctx.fillRect(380, 200, 45, 30);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.fillRect(82, 202, 41, 4);
  ctx.fillRect(382, 202, 41, 4);

  // 7. Rooftop A/C chillers & ventilation ducts
  ctx.fillStyle = '#a0aec0';
  ctx.fillRect(190, 60, 70, 40);
  ctx.fillStyle = '#1a202c';
  ctx.beginPath();
  ctx.arc(210, 80, 12, 0, Math.PI * 2);
  ctx.arc(245, 80, 12, 0, Math.PI * 2);
  ctx.fill();

  // Satellite dish
  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.arc(320, 90, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.arc(322, 90, 5, 0, Math.PI * 2);
  ctx.fill();

  return ctx.getImageData(0, 0, 512, 512);
}

/**
 * Creates realistic Seine River water texture (512x512) with wave ripples,
 * deep blue-green currents, and glittering sun caustics.
 */
export function createWaterRippleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Deep Seine teal-blue gradient
  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, '#153e50');
  grad.addColorStop(0.5, '#1e546d');
  grad.addColorStop(1, '#18475c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Wave ripple bands
  ctx.strokeStyle = 'rgba(102, 187, 217, 0.35)';
  ctx.lineWidth = 2.5;
  for (let y = 10; y < 512; y += 22) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= 512; x += 40) {
      const cy = y + Math.sin((x / 512) * Math.PI * 6 + y * 0.1) * 6;
      ctx.lineTo(x, cy);
    }
    ctx.stroke();
  }

  // Glittering specular sunlight caustic spots
  ctx.fillStyle = 'rgba(230, 247, 255, 0.55)';
  for (let i = 0; i < 220; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = Math.random() * 2.2 + 0.8;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  return ctx.getImageData(0, 0, 512, 512);
}

/**
 * Creates a premium atmospheric Paris sky texture (512x512) with:
 * - Deep azure to pale horizon gradient
 * - Visible sun disc with corona glow and light rays
 * - Volumetric cumulus clouds with soft layering and shadow
 * - Thin cirrus streaks near zenith
 * - Warm golden horizon glow
 */
export function createSkyTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // 1. Rich atmospheric gradient – deep azure at top to warm pale horizon
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0.00, '#0d2a6e');
  grad.addColorStop(0.12, '#1a3f8f');
  grad.addColorStop(0.30, '#2468c2');
  grad.addColorStop(0.55, '#4d92d8');
  grad.addColorStop(0.75, '#82bde8');
  grad.addColorStop(0.88, '#b9d9f0');
  grad.addColorStop(0.95, '#d4e8f5');
  grad.addColorStop(1.00, '#e8f2fa');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // 2. Sun disc with golden corona glow (upper-right area)
  const sunX = 390;
  const sunY = 85;

  // Outer corona halo
  const coronaGrad = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, 95);
  coronaGrad.addColorStop(0.0, 'rgba(255, 248, 180, 0.85)');
  coronaGrad.addColorStop(0.15, 'rgba(255, 230, 100, 0.55)');
  coronaGrad.addColorStop(0.35, 'rgba(255, 210, 60, 0.25)');
  coronaGrad.addColorStop(0.60, 'rgba(255, 195, 30, 0.10)');
  coronaGrad.addColorStop(1.0,  'rgba(255, 175, 0, 0.00)');
  ctx.fillStyle = coronaGrad;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 95, 0, Math.PI * 2);
  ctx.fill();

  // Sun body
  const sunGrad = ctx.createRadialGradient(sunX - 4, sunY - 4, 0, sunX, sunY, 22);
  sunGrad.addColorStop(0.0, '#fffbe6');
  sunGrad.addColorStop(0.5, '#ffe680');
  sunGrad.addColorStop(1.0, '#ffc840');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 22, 0, Math.PI * 2);
  ctx.fill();

  // Sun rays
  ctx.save();
  ctx.translate(sunX, sunY);
  for (let r = 0; r < 12; r++) {
    const angle = (r / 12) * Math.PI * 2;
    const rayLen = 55 + (r % 3) * 20;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * 24, Math.sin(angle) * 24);
    ctx.lineTo(Math.cos(angle) * (24 + rayLen), Math.sin(angle) * (24 + rayLen));
    ctx.strokeStyle = `rgba(255, 245, 150, ${0.06 + (r % 2) * 0.04})`;
    ctx.lineWidth = 2 + (r % 3);
    ctx.stroke();
  }
  ctx.restore();

  // 3. Cumulus clouds with shadow layers
  function drawCloud(cx, cy, size, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;

    // Shadow (slightly darker offset)
    ctx.fillStyle = 'rgba(150, 175, 205, 0.48)';
    [[cx, cy + size * 0.13, size * 0.52], [cx - size * 0.45, cy + size * 0.24, size * 0.35], [cx + size * 0.45, cy + size * 0.20, size * 0.40]].forEach(([px, py, pr]) => {
      ctx.beginPath();
      ctx.ellipse(px, py, pr, pr * 0.58, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Main white body
    ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
    [[cx, cy, size * 0.52], [cx - size * 0.45, cy + size * 0.15, size * 0.38], [cx + size * 0.42, cy + size * 0.10, size * 0.42], [cx - size * 0.22, cy - size * 0.18, size * 0.35], [cx + size * 0.20, cy - size * 0.22, size * 0.38], [cx, cy - size * 0.10, size * 0.45]].forEach(([px, py, pr]) => {
      ctx.beginPath();
      ctx.ellipse(px, py, pr, pr * 0.62, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Highlight on top
    ctx.fillStyle = 'rgba(255, 255, 255, 0.50)';
    ctx.beginPath();
    ctx.ellipse(cx - size * 0.05, cy - size * 0.08, size * 0.28, size * 0.18, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawCloud(80,  190, 70,  0.88);
  drawCloud(270, 165, 90,  0.82);
  drawCloud(440, 250, 62,  0.76);
  drawCloud(155, 315, 80,  0.70);
  drawCloud(360, 340, 65,  0.72);
  drawCloud(65,  390, 55,  0.60);
  drawCloud(470, 390, 50,  0.58);

  // 4. Thin cirrus streaks near zenith
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = '#e8f4ff';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  [[[30, 30], [160, 55], [280, 40]], [[80, 70], [200, 90], [310, 72]], [[295, 20], [410, 38], [510, 25]], [[355, 62], [445, 76]]].forEach(pts => {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
    ctx.globalAlpha = 0.12;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1] + 5);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1] + 5);
    ctx.stroke();
    ctx.globalAlpha = 0.22;
  });
  ctx.restore();

  // 5. Warm golden horizon glow overlay
  const horizonGrad = ctx.createLinearGradient(0, 390, 0, 512);
  horizonGrad.addColorStop(0, 'rgba(255, 220, 130, 0.0)');
  horizonGrad.addColorStop(1, 'rgba(255, 200, 80, 0.18)');
  ctx.fillStyle = horizonGrad;
  ctx.fillRect(0, 390, 512, 122);

  return ctx.getImageData(0, 0, 512, 512);
}
