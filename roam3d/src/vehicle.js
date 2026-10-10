// src/vehicle.js
// Procedural 3D car and bike models built from THREE.js primitives.
// Fully self-contained, 0 external assets, exact real-world metric dimensions.
// Coordinate system: +Z = FORWARD, +Y = UP, +X = RIGHT.

import * as THREE from 'three';

// Procedural drop shadow texture so vehicles are grounded on the asphalt
function createShadowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(64, 64, 10, 64, 64, 60);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
  gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.35)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/**
 * Build a sleek, highly accurate Parisian sports coupe / cab.
 * Real-world dimensions: 4.4m length (Z: -2.2 to +2.2), 1.9m width (X), 1.4m height (Y).
 * Forward is +Z, Roof is +Y.
 */
export function buildCar(color = 0x0284c7) {
  const group = new THREE.Group();

  // Materials
  const paintMat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.25,
    metalness: 0.65,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.6,
    metalness: 0.2,
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x0f172a,
    roughness: 0.1,
    metalness: 0.1,
    transmission: 0.6,
    transparent: true,
    opacity: 0.85,
  });
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.9,
  });
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.2,
    metalness: 0.85,
  });
  const headlightMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
  });
  const taillightMat = new THREE.MeshBasicMaterial({
    color: 0xef4444,
  });
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xfef9c3,
    transparent: true,
    opacity: 0.18,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  // 1. Drop shadow plane (under chassis on asphalt)
  const shadowGeo = new THREE.PlaneGeometry(2.6, 5.2);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: createShadowTexture(),
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, 0.02, 0);
  group.add(shadow);

  // 2. Main lower body / chassis
  const bodyGeo = new THREE.BoxGeometry(1.85, 0.52, 4.3);
  const body = new THREE.Mesh(bodyGeo, paintMat);
  body.position.set(0, 0.45, 0);
  group.add(body);

  // 3. Front hood slope
  const hoodGeo = new THREE.BoxGeometry(1.8, 0.25, 1.4);
  const hood = new THREE.Mesh(hoodGeo, paintMat);
  hood.position.set(0, 0.62, 1.35);
  hood.rotation.x = -0.08;
  group.add(hood);

  // 4. Cabin & Roof pillars
  const cabinGeo = new THREE.BoxGeometry(1.55, 0.52, 2.1);
  const cabin = new THREE.Mesh(cabinGeo, trimMat);
  cabin.position.set(0, 0.94, -0.15);
  group.add(cabin);

  // 5. Roof shell
  const roofGeo = new THREE.BoxGeometry(1.45, 0.08, 1.6);
  const roof = new THREE.Mesh(roofGeo, paintMat);
  roof.position.set(0, 1.22, -0.18);
  group.add(roof);

  // 6. Windshield (Front glass)
  const frontGlassGeo = new THREE.PlaneGeometry(1.45, 0.65);
  const frontGlass = new THREE.Mesh(frontGlassGeo, glassMat);
  frontGlass.position.set(0, 0.96, 0.92);
  frontGlass.rotation.x = -Math.PI / 5;
  group.add(frontGlass);

  // 7. Rear Glass
  const rearGlassGeo = new THREE.PlaneGeometry(1.4, 0.58);
  const rearGlass = new THREE.Mesh(rearGlassGeo, glassMat);
  rearGlass.position.set(0, 0.98, -1.22);
  rearGlass.rotation.x = Math.PI / 4.5;
  group.add(rearGlass);

  // 8. Side mirrors
  const mirrorGeo = new THREE.BoxGeometry(0.22, 0.12, 0.15);
  [-0.98, 0.98].forEach(x => {
    const mirror = new THREE.Mesh(mirrorGeo, paintMat);
    mirror.position.set(x, 0.85, 0.75);
    group.add(mirror);
  });

  // 9. Wheels & Rims with Steering Pivots
  const wheelGeo = new THREE.CylinderGeometry(0.33, 0.33, 0.22, 16);
  const rimGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.24, 8);
  const frontSteerGroups = [];

  // Front wheels (pivot when steering with A/D)
  [-0.92, 0.92].forEach(x => {
    const steerPivot = new THREE.Group();
    steerPivot.position.set(x, 0.33, 1.35);

    const tire = new THREE.Mesh(wheelGeo, tireMat);
    tire.rotation.z = Math.PI / 2;
    steerPivot.add(tire);

    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.z = Math.PI / 2;
    steerPivot.add(rim);

    group.add(steerPivot);
    frontSteerGroups.push(steerPivot);
  });

  // Rear wheels
  [-0.92, 0.92].forEach(x => {
    const tire = new THREE.Mesh(wheelGeo, tireMat);
    tire.rotation.z = Math.PI / 2;
    tire.position.set(x, 0.33, -1.35);
    group.add(tire);

    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.z = Math.PI / 2;
    rim.position.set(x, 0.33, -1.35);
    group.add(rim);
  });

  group.userData.setSteering = (steerDeg) => {
    const rad = (steerDeg * Math.PI) / 180;
    frontSteerGroups.forEach(g => { g.rotation.y = rad; });
  };

  // 10. Front Headlights (Bright LED)
  const headGeo = new THREE.BoxGeometry(0.32, 0.14, 0.08);
  const headlightMeshes = [];
  [-0.62, 0.62].forEach(x => {
    const hl = new THREE.Mesh(headGeo, headlightMat);
    hl.position.set(x, 0.52, 2.16);
    group.add(hl);
    headlightMeshes.push(hl);
  });

  // 11. Headlight Light Cones / Beams (Cast on road ahead in Street View)
  const beamGeo = new THREE.ConeGeometry(1.3, 8.5, 16, 1, true);
  const beamMeshes = [];
  [-0.55, 0.55].forEach(x => {
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.rotation.x = -Math.PI / 2 + 0.08;
    beam.position.set(x, 0.45, 6.0);
    group.add(beam);
    beamMeshes.push(beam);
  });

  // Dual forward illumination lights
  const headlampLights = [];
  [-0.55, 0.55].forEach(x => {
    const lamp = new THREE.PointLight(0xfff7d6, 2.5, 25);
    lamp.position.set(x, 0.55, 2.5);
    group.add(lamp);
    headlampLights.push(lamp);
  });

  group.userData.setHeadlights = (enabled) => {
    beamMeshes.forEach(b => { b.visible = enabled; });
    headlampLights.forEach(l => { l.intensity = enabled ? 2.5 : 0; });
    headlightMeshes.forEach(m => {
      m.material = enabled ? headlightMat : trimMat;
    });
  };

  // 12. Rear Taillight Strip (Glowing Red)
  const tailGeo = new THREE.BoxGeometry(1.7, 0.1, 0.06);
  const taillight = new THREE.Mesh(tailGeo, taillightMat);
  taillight.position.set(0, 0.65, -2.16);
  group.add(taillight);

  group.name = 'car';
  return group;
}

/**
 * Build an authentic Parisian bicycle with rider.
 * Forward is +Z, Roof is +Y.
 */
export function buildBike(color = 0x10b981) {
  const group = new THREE.Group();

  const frameMat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.3,
    metalness: 0.5,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.8,
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.2,
    metalness: 0.8,
  });

  // 1. Drop shadow
  const shadowGeo = new THREE.PlaneGeometry(0.8, 2.4);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: createShadowTexture(),
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, 0.02, 0);
  group.add(shadow);

  // Helper tube
  function addTube(sx, sy, sz, ex, ey, ez, r = 0.035, mat = frameMat) {
    const dx = ex - sx, dy = ey - sy, dz = ez - sz;
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const geo = new THREE.CylinderGeometry(r, r, len, 8);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set((sx + ex) / 2, (sy + ey) / 2, (sz + ez) / 2);
    mesh.lookAt(ex, ey, ez);
    mesh.rotateX(Math.PI / 2);
    group.add(mesh);
  }

  // Frame (Forward is +Z)
  // Bottom bracket at (0, 0.38, 0)
  addTube(0, 0.38, 0, 0, 0.82, 0.65);       // Down tube to headset
  addTube(0, 0.38, 0, 0, 0.95, -0.2);       // Seat tube
  addTube(0, 0.95, -0.2, 0, 0.85, 0.65);    // Top tube
  addTube(0, 0.38, 0, 0, 0.35, -0.75);      // Chainstay to rear wheel
  addTube(0, 0.95, -0.2, 0, 0.35, -0.75);   // Seatstay to rear wheel

  // Front fork to front wheel (at +Z)
  addTube(0, 0.85, 0.65, 0, 0.35, 0.75, 0.03, chromeMat);

  // Handlebars
  addTube(-0.28, 0.95, 0.65, 0.28, 0.95, 0.65, 0.025, darkMat);

  // Saddle
  const saddleGeo = new THREE.BoxGeometry(0.18, 0.06, 0.28);
  const saddle = new THREE.Mesh(saddleGeo, darkMat);
  saddle.position.set(0, 0.98, -0.2);
  group.add(saddle);

  // Wheels (Front at +Z, Rear at -Z)
  const wheelGeo = new THREE.TorusGeometry(0.34, 0.038, 8, 20);
  const frontWheel = new THREE.Mesh(wheelGeo, darkMat);
  frontWheel.rotation.y = Math.PI / 2;
  frontWheel.position.set(0, 0.35, 0.75);
  group.add(frontWheel);

  const rearWheel = new THREE.Mesh(wheelGeo, darkMat);
  rearWheel.rotation.y = Math.PI / 2;
  rearWheel.position.set(0, 0.35, -0.75);
  group.add(rearWheel);

  // Rider figure (casual commuter jacket + helmet)
  const riderBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.45, 0.25),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 })
  );
  riderBody.position.set(0, 1.25, 0.05);
  riderBody.rotation.x = 0.38;
  group.add(riderBody);

  const riderHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 }) // yellow helmet
  );
  riderHead.position.set(0, 1.55, 0.22);
  group.add(riderHead);

  group.name = 'bike';
  return group;
}
