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
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // 1. Base limestone wall color with subtle warm stone variation
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#5a6268'); // Zinc roof tint at top
  grad.addColorStop(0.2, '#ded3c2'); // Top floor limestone
  grad.addColorStop(0.7, '#ece3d4'); // Middle floors warm Parisian stone
  grad.addColorStop(1.0, '#3a3530'); // Ground floor dark shopfront base
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // 2. Horizontal architectural stringcourses (cornices between floors)
  const cornices = [90, 200, 310, 410];
  ctx.fillStyle = '#c7bca9';
  cornices.forEach(y => {
    ctx.fillRect(0, y - 4, 512, 8);
    ctx.fillStyle = '#8b8070';
    ctx.fillRect(0, y + 4, 512, 2); // shadow under cornice
    ctx.fillStyle = '#c7bca9';
  });

  // 3. Stone masonry ashlar block lines
  ctx.strokeStyle = 'rgba(140, 130, 115, 0.35)';
  ctx.lineWidth = 1;
  for (let y = 90; y < 410; y += 30) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
    // Vertical joints staggered
    const offset = (y % 60 === 0) ? 0 : 32;
    for (let x = offset; x < 512; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 30);
      ctx.stroke();
    }
  }

  // Helper: Draw detailed French window with glass reflections & balcony
  function drawFrenchWindow(x, y, w, h, hasBalcony = true) {
    // Stone surround & arch
    ctx.fillStyle = '#c8bba7';
    ctx.fillRect(x - 5, y - 10, w + 10, h + 14);

    // Decorative lintel pediment
    ctx.fillStyle = '#b3a590';
    ctx.beginPath();
    ctx.moveTo(x - 8, y - 10);
    ctx.lineTo(x + w / 2, y - 20);
    ctx.lineTo(x + w + 8, y - 10);
    ctx.fill();

    // Window frame (dark charcoal wood)
    ctx.fillStyle = '#1c2024';
    ctx.fillRect(x, y, w, h);

    // Glass panes with sky reflection gradient
    const glassGrad = ctx.createLinearGradient(x, y, x + w, y + h);
    glassGrad.addColorStop(0, '#2c4a6f');
    glassGrad.addColorStop(0.4, '#4f7ba8');
    glassGrad.addColorStop(0.5, '#6a98c7');
    glassGrad.addColorStop(1, '#1b324d');
    ctx.fillStyle = glassGrad;
    ctx.fillRect(x + 3, y + 3, w - 6, h - 6);

    // Window mullions (cross bars)
    ctx.fillStyle = '#d5dfeb';
    ctx.fillRect(x + w / 2 - 1, y, 2, h); // vertical
    ctx.fillRect(x, y + h * 0.45, w, 2);  // horizontal
    ctx.fillRect(x, y + h * 0.75, w, 2);  // lower transom

    // Wrought-iron balcony railing
    if (hasBalcony) {
      const by = y + h - 22;
      const bh = 24;
      // Balcony stone slab
      ctx.fillStyle = '#b8ab96';
      ctx.fillRect(x - 7, by + bh - 3, w + 14, 5);

      // Black iron railings
      ctx.strokeStyle = '#0f1115';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 6, by, w + 12, bh);

      // Vertical balusters & decorative swirls
      ctx.lineWidth = 1.5;
      for (let bx = x - 4; bx <= x + w + 4; bx += 6) {
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx, by + bh);
        ctx.stroke();
      }
      // Top handrail highlight
      ctx.fillStyle = '#404552';
      ctx.fillRect(x - 7, by - 1, w + 14, 2);
    }
  }

  // Draw 3 rows of French windows (3 columns)
  const windowCols = [50, 190, 330, 450];
  // 2nd floor windows (piano nobile - tall with grand balcony)
  windowCols.forEach(x => {
    drawFrenchWindow(x, 225, 42, 75, true);
  });
  // 3rd floor windows
  windowCols.forEach(x => {
    drawFrenchWindow(x, 115, 38, 68, true);
  });
  // 4th floor windows
  windowCols.forEach(x => {
    drawFrenchWindow(x, 325, 38, 65, false);
  });

  // 4. Ground floor: Parisian boutique storefront (Y: 410 to 512)
  ctx.fillStyle = '#22262c'; // Dark painted wood
  ctx.fillRect(0, 410, 512, 102);

  // Shop awning / fascia sign
  ctx.fillStyle = '#14171a';
  ctx.fillRect(20, 416, 472, 24);
  ctx.fillStyle = '#eab308'; // Gold boutique lettering
  ctx.font = 'bold 12px serif';
  ctx.textAlign = 'center';
  ctx.fillText('LIBRAIRIE & CAFÉ DE PARIS', 256, 432);

  // Display windows with warm interior glow
  const shopGrad = ctx.createLinearGradient(40, 445, 40, 505);
  shopGrad.addColorStop(0, '#fef08a');
  shopGrad.addColorStop(0.3, '#fde047');
  shopGrad.addColorStop(1, '#ca8a04');

  // Left display window
  ctx.fillStyle = shopGrad;
  ctx.fillRect(40, 445, 170, 60);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 3;
  ctx.strokeRect(40, 445, 170, 60);

  // Entrance door in center
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(225, 445, 62, 67);
  ctx.fillStyle = '#cbd5e1'; // Glass pane in door
  ctx.fillRect(233, 452, 46, 38);
  ctx.fillStyle = '#f59e0b'; // Brass handle
  ctx.fillRect(272, 480, 4, 12);

  // Right display window
  ctx.fillStyle = shopGrad;
  ctx.fillRect(300, 445, 170, 60);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 3;
  ctx.strokeRect(300, 445, 170, 60);

  // 5. Roof level: Zinc roof plates, dormers, and rooftop Air Conditioning Units! (Y: 0 to 90)
  ctx.fillStyle = '#475569'; // Parisian zinc roofing
  ctx.fillRect(0, 0, 512, 90);

  // Standing seams on zinc roof
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  for (let x = 0; x < 512; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 90);
    ctx.stroke();
  }

  // Rooftop Dormer Windows (Lucarnes)
  [80, 220, 360].forEach(x => {
    // Zinc dormer casing
    ctx.fillStyle = '#64748b';
    ctx.fillRect(x - 4, 25, 34, 45);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x, 30, 26, 36);
    ctx.fillStyle = '#93c5fd';
    ctx.fillRect(x + 2, 32, 22, 32);
    // Triangular pediment
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(x - 6, 25);
    ctx.lineTo(x + 13, 10);
    ctx.lineTo(x + 32, 25);
    ctx.fill();
  });

  // Rooftop Air Conditioning Condenser Unit & ventilation duct
  // AC Unit 1
  ctx.fillStyle = '#94a3b8'; // Metal casing
  ctx.fillRect(430, 30, 50, 40);
  ctx.fillStyle = '#334155'; // Ventilation fan grille
  ctx.beginPath();
  ctx.arc(455, 50, 14, 0, Math.PI * 2);
  ctx.fill();
  // Fan blades
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 2) {
    ctx.beginPath();
    ctx.moveTo(455, 50);
    ctx.lineTo(455 + Math.cos(a) * 12, 50 + Math.sin(a) * 12);
    ctx.stroke();
  }
  // Refrigerant service pipes
  ctx.strokeStyle = '#b45309'; // Copper pipe
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(430, 60);
  ctx.lineTo(415, 60);
  ctx.lineTo(415, 80);
  ctx.stroke();

  // Chimney pots (terracotta)
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(10, 15, 24, 30);
  ctx.fillStyle = '#991b1b';
  ctx.fillRect(8, 12, 28, 6);

  return ctx.getImageData(0, 0, 512, 512);
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
