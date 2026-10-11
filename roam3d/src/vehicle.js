// src/vehicle.js
// Procedural 3D car and bike models built from THREE.js primitives.
// Fully self-contained, 0 external assets, exact real-world metric dimensions.
// Coordinate system: +Z = FORWARD, +Y = UP, +X = RIGHT.

import * as THREE from 'three';

// Procedural drop shadow texture so vehicles are grounded on the asphalt
let sharedShadowTexture = null;
function createShadowTexture() {
  if (sharedShadowTexture) return sharedShadowTexture;
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
  sharedShadowTexture = new THREE.CanvasTexture(canvas);
  return sharedShadowTexture;
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
    opacity: 0.75,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, 0.01, 0);
  group.add(shadow);

  // 2. Main lower body / chassis
  const bodyGeo = new THREE.BoxGeometry(1.85, 0.52, 4.3);
  const body = new THREE.Mesh(bodyGeo, paintMat);
  body.position.set(0, 0.45, 0);
  group.add(body);

  // Front sports grille & lower aero splitter
  const grilleGeo = new THREE.BoxGeometry(1.2, 0.22, 0.1);
  const grille = new THREE.Mesh(grilleGeo, trimMat);
  grille.position.set(0, 0.38, 2.16);
  group.add(grille);

  const splitterGeo = new THREE.BoxGeometry(1.88, 0.06, 0.3);
  const splitter = new THREE.Mesh(splitterGeo, trimMat);
  splitter.position.set(0, 0.18, 2.12);
  group.add(splitter);

  // Aerodynamic side skirts
  [-0.94, 0.94].forEach(x => {
    const skirtGeo = new THREE.BoxGeometry(0.08, 0.12, 2.8);
    const skirt = new THREE.Mesh(skirtGeo, trimMat);
    skirt.position.set(x, 0.22, 0);
    group.add(skirt);
  });

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

  // 9. Wheels & Rims with Steering Pivots & Red Brake Calipers
  const wheelGeo = new THREE.CylinderGeometry(0.33, 0.33, 0.22, 18);
  const rimGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.24, 10);
  const caliperMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 }); // Red sports caliper
  const caliperGeo = new THREE.BoxGeometry(0.08, 0.14, 0.1);
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

    const caliper = new THREE.Mesh(caliperGeo, caliperMat);
    caliper.position.set(x > 0 ? -0.06 : 0.06, 0.08, 0.04);
    steerPivot.add(caliper);

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

    const caliper = new THREE.Mesh(caliperGeo, caliperMat);
    caliper.position.set(x > 0 ? x - 0.06 : x + 0.06, 0.41, -1.31);
    group.add(caliper);
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
  const beamGeo = new THREE.ConeGeometry(1.4, 10.0, 16, 1, true);
  const beamMeshes = [];
  [-0.55, 0.55].forEach(x => {
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.rotation.x = -Math.PI / 2 + 0.08;
    beam.position.set(x, 0.45, 6.8);
    group.add(beam);
    beamMeshes.push(beam);
  });

  // Dual forward illumination lights
  const headlampLights = [];
  [-0.55, 0.55].forEach(x => {
    const lamp = new THREE.PointLight(0xfff7d6, 2.8, 30);
    lamp.position.set(x, 0.55, 2.6);
    group.add(lamp);
    headlampLights.push(lamp);
  });

  group.userData.setHeadlights = (enabled) => {
    beamMeshes.forEach(b => { b.visible = enabled; });
    headlampLights.forEach(l => { l.intensity = enabled ? 2.8 : 0; });
    headlightMeshes.forEach(m => {
      m.material = enabled ? headlightMat : trimMat;
    });
  };

  // 12. Rear Taillight Strip (Glowing Red) & Dual Chrome Exhaust Tips
  const tailGeo = new THREE.BoxGeometry(1.7, 0.1, 0.06);
  const taillight = new THREE.Mesh(tailGeo, taillightMat);
  taillight.position.set(0, 0.65, -2.16);
  group.add(taillight);

  const exhaustGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.22, 10);
  const exhaustMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.15 });
  [-0.45, 0.45].forEach(x => {
    const ex = new THREE.Mesh(exhaustGeo, exhaustMat);
    ex.rotation.x = Math.PI / 2;
    ex.position.set(x, 0.26, -2.2);
    group.add(ex);
  });

  group.name = 'car';
  return group;
}

/** Build a compact street motorcycle with rider. Forward is +Z, +Y is up. */
export function buildBike(color = 0x10b981) {
  const group = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color, roughness: 0.28, metalness: 0.55 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x17191d, roughness: 0.72, metalness: 0.18 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x9ba5ad, roughness: 0.25, metalness: 0.82 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x101114, roughness: 0.92 });
  const lamp = new THREE.MeshBasicMaterial({ color: 0xfff4ce });
  const tail = new THREE.MeshBasicMaterial({ color: 0xff2525 });

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1, 2.8),
    new THREE.MeshBasicMaterial({ map: createShadowTexture(), transparent: true, opacity: 0.62, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  group.add(shadow);

  const addBox = (w, h, d, material, x, y, z, rx = 0, rz = 0) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, 0, rz);
    group.add(mesh);
    return mesh;
  };
  const addSphere = (rx, ry, rz, material, x, y, z) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), material);
    mesh.scale.set(rx, ry, rz);
    mesh.position.set(x, y, z);
    group.add(mesh);
    return mesh;
  };
  const addBeam = (a, b, radius, material, segments = 8) => {
    const start = new THREE.Vector3(...a);
    const end = new THREE.Vector3(...b);
    const direction = end.clone().sub(start);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), segments), material);
    mesh.position.copy(start).add(end).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    group.add(mesh);
    return mesh;
  };

  // Road tires and cast wheels (front at +Z).
  const wheelGeo = new THREE.CylinderGeometry(0.37, 0.37, 0.16, 24);
  const rimGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.18, 20);
  [0.76, -0.78].forEach((z) => {
    const wheel = new THREE.Mesh(wheelGeo, rubber);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(0, 0.39, z);
    group.add(wheel);
    const rim = new THREE.Mesh(rimGeo, metal);
    rim.rotation.z = Math.PI / 2;
    rim.position.set(0, 0.39, z);
    group.add(rim);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.2, 12), dark);
    hub.rotation.z = Math.PI / 2;
    hub.position.set(0, 0.39, z);
    group.add(hub);
  });

  // Compact frame, engine, fuel tank and low seat.
  addBeam([0, 0.42, -0.72], [0, 0.7, 0.05], 0.055, paint);
  addBeam([0, 0.42, 0.72], [0, 0.72, 0.05], 0.045, metal);
  addBeam([0, 0.7, 0.05], [0, 0.94, -0.4], 0.045, paint);
  addBox(0.42, 0.4, 0.44, dark, 0, 0.68, -0.05);
  addSphere(0.32, 0.2, 0.45, paint, 0, 0.98, 0.08);
  addBox(0.42, 0.12, 0.55, dark, 0, 1.0, -0.42, -0.08);
  addBox(0.36, 0.16, 0.22, paint, 0, 0.82, -0.72, 0.12);

  // Fork, handlebars, front lamp, front mudguard and rear exhaust.
  [-0.12, 0.12].forEach((x) => {
    addBeam([x, 0.4, 0.76], [x * 0.65, 1.12, 0.44], 0.035, metal);
  });
  addBeam([-0.3, 1.12, 0.43], [0.3, 1.12, 0.43], 0.035, dark);
  addSphere(0.19, 0.16, 0.12, lamp, 0, 0.99, 0.53);
  addBox(0.5, 0.045, 0.55, paint, 0, 0.83, 0.74, -0.05);
  addBeam([0.18, 0.53, -0.46], [0.24, 0.57, -1.0], 0.07, metal);
  addSphere(0.14, 0.08, 0.07, tail, 0, 0.95, -0.99);

  // Rider leaning forward in a dark jacket and full-face helmet.
  const rider = new THREE.MeshStandardMaterial({ color: 0x26364a, roughness: 0.8 });
  addSphere(0.2, 0.31, 0.16, rider, 0, 1.28, -0.02);
  addBeam([-0.11, 1.32, 0.02], [-0.25, 1.1, 0.4], 0.055, rider);
  addBeam([0.11, 1.32, 0.02], [0.25, 1.1, 0.4], 0.055, rider);
  addBeam([-0.1, 1.12, -0.05], [-0.17, 0.7, -0.38], 0.065, rider);
  addBeam([0.1, 1.12, -0.05], [0.17, 0.7, -0.38], 0.065, rider);
  addSphere(0.16, 0.16, 0.16, new THREE.MeshStandardMaterial({ color: 0xffc857, roughness: 0.3, metalness: 0.25 }), 0, 1.58, 0.2);
  addBox(0.18, 0.06, 0.07, dark, 0, 1.57, 0.34);

  group.name = 'motorcycle';
  return group;
}
