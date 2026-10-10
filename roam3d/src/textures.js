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
 * Creates high-resolution rooftop texture (256x256) with:
 * - Zinc standing-seam roof plates
 * - Air conditioning chiller & fan condenser units
 * - Satellite dishes & ventilation ducts
 */
export function createRooftopTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Base zinc slate grey
  ctx.fillStyle = '#4b5563';
  ctx.fillRect(0, 0, 256, 256);

  // Gravel rooftop border / waterproof membrane
  ctx.fillStyle = '#374151';
  ctx.fillRect(10, 10, 236, 236);

  // Standing seams
  ctx.strokeStyle = '#1f2937';
  ctx.lineWidth = 2;
  for (let x = 20; x < 240; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 10);
    ctx.lineTo(x, 246);
    ctx.stroke();
  }

  // Large Dual-Fan Rooftop Air Conditioner Unit (Center)
  ctx.fillStyle = '#9ca3af'; // Heavy metal chassis
  ctx.fillRect(50, 60, 90, 55);
  ctx.fillStyle = '#111827';
  // Fan 1
  ctx.beginPath();
  ctx.arc(75, 87, 18, 0, Math.PI * 2);
  ctx.fill();
  // Fan 2
  ctx.beginPath();
  ctx.arc(115, 87, 18, 0, Math.PI * 2);
  ctx.fill();

  // Fan grilles & blades
  ctx.strokeStyle = '#f3f4f6';
  ctx.lineWidth = 2;
  [75, 115].forEach(fx => {
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
      ctx.beginPath();
      ctx.moveTo(fx, 87);
      ctx.lineTo(fx + Math.cos(a) * 16, 87 + Math.sin(a) * 16);
      ctx.stroke();
    }
  });

  // AC Unit 2 (Single fan condenser)
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(160, 140, 50, 45);
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(185, 162, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#f8fafc';
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 2) {
    ctx.beginPath();
    ctx.moveTo(185, 162);
    ctx.lineTo(185 + Math.cos(a) * 14, 162 + Math.sin(a) * 14);
    ctx.stroke();
  }

  // Ventilation duct work (galvanized steel pipes)
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(95, 115);
  ctx.lineTo(95, 180);
  ctx.lineTo(150, 180);
  ctx.stroke();

  // Satellite dish
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.arc(50, 190, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.arc(50, 190, 6, 0, Math.PI * 2);
  ctx.fill();

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
