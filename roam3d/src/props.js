// src/props.js
// Procedural 3D street models: Street Lights, Benches, Trees, Fire Braziers,
// and Raised Road Median Divider.
import * as THREE from 'three';
import { PARIS_ANCHOR_LNG_LAT, lngLatToWorld } from './customLayer.js';

// ─── 1. Parisian Ornate Cast-Iron Street Light (Lamppost) ───────────────────
export function buildStreetLight() {
  const group = new THREE.Group();

  // Dark green / bronze Parisian iron finish
  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x1d2d24,
    roughness: 0.45,
    metalness: 0.65,
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.3,
    metalness: 0.85,
  });

  const glassMat = new THREE.MeshBasicMaterial({
    color: 0xfff3c4,
  });

  // Base fluted pedestal
  const baseGeo = new THREE.CylinderGeometry(0.28, 0.38, 0.8, 8);
  const base = new THREE.Mesh(baseGeo, ironMat);
  base.position.y = 0.4;
  group.add(base);

  // Decorative ring
  const ringGeo = new THREE.TorusGeometry(0.25, 0.05, 8, 16);
  const ring = new THREE.Mesh(ringGeo, goldMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.82;
  group.add(ring);

  // Main column (tapered)
  const poleGeo = new THREE.CylinderGeometry(0.09, 0.16, 3.4, 8);
  const pole = new THREE.Mesh(poleGeo, ironMat);
  pole.position.y = 2.5;
  group.add(pole);

  // Lantern capital bracket
  const capGeo = new THREE.CylinderGeometry(0.22, 0.1, 0.35, 6);
  const cap = new THREE.Mesh(capGeo, ironMat);
  cap.position.y = 4.3;
  group.add(cap);

  // Hexagonal lantern body (glowing glass)
  const lanternGeo = new THREE.CylinderGeometry(0.26, 0.16, 0.55, 6);
  const lantern = new THREE.Mesh(lanternGeo, glassMat);
  lantern.position.y = 4.7;
  group.add(lantern);

  // Lantern roof & finial
  const roofGeo = new THREE.ConeGeometry(0.32, 0.4, 6);
  const roof = new THREE.Mesh(roofGeo, ironMat);
  roof.position.y = 5.15;
  group.add(roof);

  const finialGeo = new THREE.SphereGeometry(0.06, 8, 8);
  const finial = new THREE.Mesh(finialGeo, goldMat);
  finial.position.y = 5.4;
  group.add(finial);

  // Downward warm light cone
  const coneGeo = new THREE.ConeGeometry(2.4, 4.8, 12, 1, true);
  const coneMat = new THREE.MeshBasicMaterial({
    color: 0xffea9f,
    transparent: true,
    opacity: 0.12,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const lightCone = new THREE.Mesh(coneGeo, coneMat);
  lightCone.position.y = 2.4;
  group.add(lightCone);

  group.name = 'street-light';
  return group;
}

// ─── 2. Parisian Wooden Park Bench with Cast-Iron Frame ─────────────────────
export function buildBench() {
  const group = new THREE.Group();

  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x16241b,
    roughness: 0.5,
    metalness: 0.5,
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8a532b,
    roughness: 0.7,
    metalness: 0.1,
  });

  // Iron legs (left & right)
  const legGeo = new THREE.BoxGeometry(0.08, 0.52, 0.65);
  [-0.9, 0.9].forEach(x => {
    const leg = new THREE.Mesh(legGeo, ironMat);
    leg.position.set(x, 0.26, 0);
    group.add(leg);

    // Backrest upright support
    const uprightGeo = new THREE.BoxGeometry(0.06, 0.5, 0.08);
    const upright = new THREE.Mesh(uprightGeo, ironMat);
    upright.position.set(x, 0.65, -0.28);
    upright.rotation.x = -0.15;
    group.add(upright);
  });

  // Seat wood slats (4 horizontal planks)
  const slatGeo = new THREE.BoxGeometry(1.95, 0.04, 0.12);
  [-0.2, -0.06, 0.08, 0.22].forEach(z => {
    const slat = new THREE.Mesh(slatGeo, woodMat);
    slat.position.set(0, 0.48, z);
    group.add(slat);
  });

  // Backrest wood slats (3 planks)
  const backSlatGeo = new THREE.BoxGeometry(1.95, 0.1, 0.035);
  [0.6, 0.72, 0.84].forEach(y => {
    const backSlat = new THREE.Mesh(backSlatGeo, woodMat);
    backSlat.position.set(0, y, -0.28);
    backSlat.rotation.x = -0.15;
    group.add(backSlat);
  });

  group.name = 'bench';
  return group;
}

// ─── 3. Tree Builders – 5 distinct species with size & shape variation ──────

/** Parisian Boulevard Platane (wide spreading canopy, large) */
function buildPlataneTree(scale) {
  const group = new THREE.Group();
  const s = scale;
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4a36, roughness: 0.9, metalness: 0.05 });
  const leafMat  = new THREE.MeshStandardMaterial({ color: 0x2e6b35, roughness: 0.75, metalness: 0.1 });
  const leafMat2 = new THREE.MeshStandardMaterial({ color: 0x3a7f42, roughness: 0.7,  metalness: 0.1 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22 * s, 0.36 * s, 3.6 * s, 8), trunkMat);
  trunk.position.y = 1.8 * s;
  group.add(trunk);
  const layers = [
    { r: 2.4 * s, mat: leafMat,  y: 4.2 * s, ox: 0,       sx: 1.15, sy: 0.85, sz: 1.15 },
    { r: 2.0 * s, mat: leafMat2, y: 5.4 * s, ox: 0.5 * s, sx: 1.0,  sy: 1.0,  sz: 1.0  },
    { r: 1.5 * s, mat: leafMat,  y: 4.8 * s, ox:-0.5 * s, sx: 1.1,  sy: 0.9,  sz: 1.1  },
    { r: 1.2 * s, mat: leafMat2, y: 5.8 * s, ox: 0.3 * s, sx: 1.0,  sy: 0.85, sz: 1.0  },
  ];
  layers.forEach(({ r, mat, y, ox, sx, sy, sz }) => {
    const f = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 1), mat);
    f.position.set(ox, y, 0);
    f.scale.set(sx, sy, sz);
    group.add(f);
  });
  group.name = 'tree-platane';
  return group;
}

/** Tall Poplar / Lombardy tree (narrow columnar) */
function buildPoplarTree(scale) {
  const group = new THREE.Group();
  const s = scale;
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3d2c, roughness: 0.85, metalness: 0.05 });
  const leafMat  = new THREE.MeshStandardMaterial({ color: 0x1f5c28, roughness: 0.7,  metalness: 0.1 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16 * s, 0.28 * s, 5.5 * s, 7), trunkMat);
  trunk.position.y = 2.75 * s;
  group.add(trunk);
  for (let i = 0; i < 3; i++) {
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.85 * s, 8, 7), leafMat);
    f.scale.set(0.55, 1.4 + i * 0.15, 0.55);
    f.position.y = (5.2 + i * 1.0) * s;
    group.add(f);
  }
  group.name = 'tree-poplar';
  return group;
}

/** Horse Chestnut / Marronier (dense round crown, medium) */
function buildChestnutTree(scale) {
  const group = new THREE.Group();
  const s = scale;
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2e1c, roughness: 0.92, metalness: 0.05 });
  const leafMat  = new THREE.MeshStandardMaterial({ color: 0x3a7a2e, roughness: 0.8,  metalness: 0.1 });
  const leafMat2 = new THREE.MeshStandardMaterial({ color: 0x4c9139, roughness: 0.75, metalness: 0.1 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3 * s, 0.45 * s, 3.0 * s, 8), trunkMat);
  trunk.position.y = 1.5 * s;
  group.add(trunk);
  const crown = new THREE.Mesh(new THREE.SphereGeometry(2.6 * s, 9, 8), leafMat);
  crown.scale.set(1.0, 0.78, 1.0);
  crown.position.y = 4.8 * s;
  group.add(crown);
  [[-0.8, 5.4, 0.6], [0.9, 5.1, -0.5], [0, 6.1, 0.2]].forEach(([ox, y, oz], i) => {
    const r = (1.4 + i * 0.15) * s;
    const b = new THREE.Mesh(new THREE.SphereGeometry(r, 7, 6), leafMat2);
    b.position.set(ox * s, y * s, oz * s);
    group.add(b);
  });
  group.name = 'tree-chestnut';
  return group;
}

/** Mediterranean Cypress (very tall, dark, pencil-shaped) */
function buildCypressTree(scale) {
  const group = new THREE.Group();
  const s = scale;
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x2e200e, roughness: 0.95, metalness: 0.03 });
  const leafMat  = new THREE.MeshStandardMaterial({ color: 0x1a4020, roughness: 0.65, metalness: 0.1 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * s, 0.22 * s, 2.5 * s, 6), trunkMat);
  trunk.position.y = 1.25 * s;
  group.add(trunk);
  for (let i = 0; i < 5; i++) {
    const r = (1.0 - i * 0.12) * s;
    const c = new THREE.Mesh(new THREE.ConeGeometry(r, 1.8 * s, 7), leafMat);
    c.position.y = (2.5 + i * 1.3) * s;
    group.add(c);
  }
  group.name = 'tree-cypress';
  return group;
}

/** Dense shrub / bush (low ground cover) */
function buildShrub(scale) {
  const group = new THREE.Group();
  const s = scale;
  const leafMat  = new THREE.MeshStandardMaterial({ color: 0x4a8a2c, roughness: 0.85, metalness: 0.05 });
  const leafMat2 = new THREE.MeshStandardMaterial({ color: 0x5fa838, roughness: 0.8,  metalness: 0.05 });
  [[-0.4, 0.7, 0.1], [0.5, 0.65, -0.3], [0, 0.9, 0.4], [-0.3, 0.6, -0.5], [0.2, 0.55, 0.6]].forEach(([ox, y, oz], i) => {
    const r = (0.55 + i * 0.08) * s;
    const b = new THREE.Mesh(new THREE.SphereGeometry(r, 7, 6), i % 2 === 0 ? leafMat : leafMat2);
    b.position.set(ox * s, y * s, oz * s);
    b.scale.set(1, 0.7, 1);
    group.add(b);
  });
  group.name = 'tree-shrub';
  return group;
}

/** Parisian Weeping Willow (Saule pleureur with cascading branches) */
function buildWeepingWillowTree(scale) {
  const group = new THREE.Group();
  const s = scale;
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3722, roughness: 0.9, metalness: 0.04 });
  const leafMat  = new THREE.MeshStandardMaterial({ color: 0x4f8730, roughness: 0.8, metalness: 0.08 });
  const leafMat2 = new THREE.MeshStandardMaterial({ color: 0x3d6e24, roughness: 0.75, metalness: 0.08 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.24 * s, 0.42 * s, 3.2 * s, 8), trunkMat);
  trunk.position.y = 1.6 * s;
  group.add(trunk);
  const mainDome = new THREE.Mesh(new THREE.SphereGeometry(2.2 * s, 8, 7), leafMat);
  mainDome.scale.set(1.15, 0.75, 1.15);
  mainDome.position.y = 3.6 * s;
  group.add(mainDome);
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const r = 1.8 * s;
    const frond = new THREE.Mesh(new THREE.ConeGeometry(0.55 * s, 2.4 * s, 5), i % 2 === 0 ? leafMat : leafMat2);
    frond.position.set(Math.cos(angle) * r, 2.5 * s, Math.sin(angle) * r);
    frond.rotation.z = Math.cos(angle) * 0.15;
    frond.rotation.x = Math.sin(angle) * 0.15;
    group.add(frond);
  }
  group.name = 'tree-willow';
  return group;
}

const TREE_FACTORIES = [
  buildPlataneTree, buildPlataneTree,
  buildChestnutTree, buildChestnutTree,
  buildCypressTree, buildCypressTree,
  buildPoplarTree, buildPoplarTree,
  buildWeepingWillowTree, buildWeepingWillowTree,
  buildShrub,
];

/** Master factory — picks a random species + size variation (0.55x to 1.45x) */
export function buildTree() {
  const idx = Math.floor(Math.random() * TREE_FACTORIES.length);
  const scaleFactor = 0.55 + Math.random() * 0.90; // 0.55x (young sapling) – 1.45x (mature giant)
  const tree = TREE_FACTORIES[idx](scaleFactor);
  tree.name = 'tree';
  return tree;
}


// ─── 4. Parisian Stone Fire Brazier / Torch ─────────────────────────────────
export function buildFireTorch() {
  const group = new THREE.Group();

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x374151,
    roughness: 0.7,
    metalness: 0.3,
  });

  const flameMat = new THREE.MeshBasicMaterial({
    color: 0xff6600,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
  });

  const coreFlameMat = new THREE.MeshBasicMaterial({
    color: 0xffdd44,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
  });

  // Stone Pedestal
  const pedGeo = new THREE.CylinderGeometry(0.35, 0.45, 1.1, 8);
  const ped = new THREE.Mesh(pedGeo, stoneMat);
  ped.position.y = 0.55;
  group.add(ped);

  // Brazier Bowl
  const bowlGeo = new THREE.CylinderGeometry(0.55, 0.25, 0.4, 8);
  const bowl = new THREE.Mesh(bowlGeo, stoneMat);
  bowl.position.y = 1.25;
  group.add(bowl);

  // Flame outer mesh
  const flameGeo = new THREE.ConeGeometry(0.38, 0.85, 8);
  const flame = new THREE.Mesh(flameGeo, flameMat);
  flame.position.y = 1.8;
  group.add(flame);

  // Flame bright core
  const coreGeo = new THREE.ConeGeometry(0.22, 0.55, 8);
  const core = new THREE.Mesh(coreGeo, coreFlameMat);
  core.position.y = 1.7;
  group.add(core);

  // Emissive Point Light
  const fireLight = new THREE.PointLight(0xff7700, 2.0, 14);
  fireLight.position.y = 1.8;
  group.add(fireLight);

  group.userData.flame = flame;
  group.userData.core = core;
  group.userData.fireLight = fireLight;
  group.name = 'fire-torch';
  return group;
}

// ─── 5. Raised 3D Road Median Divider ───────────────────────────────────────
export function buildMedianDivider(lengthM = 24) {
  const group = new THREE.Group();

  const curbMat = new THREE.MeshStandardMaterial({
    color: 0xd1d5db, // light concrete curb
    roughness: 0.6,
    metalness: 0.2,
  });

  const markerMat = new THREE.MeshBasicMaterial({
    color: 0xfacc15, // yellow retroreflective cat-eye marker
  });

  // Raised curb block: 0.7m width, 0.35m height
  const curbGeo = new THREE.BoxGeometry(0.7, 0.35, lengthM);
  const curb = new THREE.Mesh(curbGeo, curbMat);
  curb.position.y = 0.175;
  group.add(curb);

  // Reflector markers along the divider
  const markerGeo = new THREE.BoxGeometry(0.12, 0.08, 0.2);
  const step = 4;
  for (let z = -lengthM / 2 + 2; z < lengthM / 2; z += step) {
    [-0.32, 0.32].forEach(x => {
      const m = new THREE.Mesh(markerGeo, markerMat);
      m.position.set(x, 0.22, z);
      group.add(m);
    });
  }

  group.name = 'median-divider';
  return group;
}

// ─── Geographic & Spatial Helpers ──────────────────────────────────────────
function offsetLngLat([lng, lat], bearingDeg, distM) {
  if (distM === 0) return [lng, lat];
  const rad = (bearingDeg * Math.PI) / 180;
  const dLat = (distM * Math.cos(rad)) / 111320;
  const dLng = (distM * Math.sin(rad)) / (111320 * Math.cos((lat * Math.PI) / 180));
  return [lng + dLng, lat + dLat];
}

function bearingBetween([lng1, lat1], [lng2, lat2]) {
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);
  let brng = Math.atan2(y, x) * 180 / Math.PI;
  return (brng + 360) % 360;
}

function distanceMeters([lng1, lat1], [lng2, lat2]) {
  const dLat = (lat2 - lat1) * 111320;
  const dLng = (lng2 - lng1) * 111320 * Math.cos((lat1 * Math.PI) / 180);
  return Math.hypot(dLat, dLng);
}

// ─── Deterministic Paris Green-Zone Geo Definitions ─────────────────────────
// Known Paris green zones visible in satellite photography:
// [centerLng, centerLat, halfWidthM, halfHeightM, densityMultiplier]
export const PARIS_GREEN_ZONES = [
  // Champ de Mars / Eiffel
  [2.2984, 48.8557, 340, 200, 1.8],
  // Esplanade des Invalides (grand central lawn)
  [2.3125, 48.8580, 150, 260, 1.6],
  // Bois de Boulogne (large, west)
  [2.2529, 48.8590, 950, 1050, 2.0],
  // Jardin du Trocadéro
  [2.2876, 48.8626, 140, 110, 1.4],
  // Jardins des Tuileries
  [2.3283, 48.8640, 420, 130, 1.4],
  // Jardin du Palais-Royal
  [2.3370, 48.8639, 90, 110, 1.2],
  // Jardin du Luxembourg
  [2.3372, 48.8462, 230, 230, 1.6],
  // Parc Monceau
  [2.3086, 48.8796, 210, 180, 1.5],
  // Parc des Buttes-Chaumont
  [2.3823, 48.8800, 360, 290, 1.7],
  // Bois de Vincennes (large, east)
  [2.4339, 48.8290, 880, 980, 2.0],
  // Parc de la Villette
  [2.3943, 48.8937, 360, 290, 1.4],
  // Parc Montsouris
  [2.3388, 48.8218, 280, 230, 1.5],
  // Parc Georges Brassens
  [2.2985, 48.8359, 210, 180, 1.3],
  // Père Lachaise cemetery (heavily treed)
  [2.3961, 48.8604, 360, 330, 1.6],
  // Cimetière Montparnasse
  [2.3233, 48.8381, 230, 210, 1.3],
  // Square du Vert-Galant (tip of Île de la Cité)
  [2.3418, 48.8570, 70, 45, 1.2],
  // Île Saint-Louis green shores
  [2.3561, 48.8516, 80, 55, 1.0],
  // Jardin des Plantes
  [2.3601, 48.8445, 230, 200, 1.5],
  // Parc Citroën
  [2.2774, 48.8426, 260, 210, 1.4],
  // Square du Temple
  [2.3621, 48.8641, 85, 85, 1.0],
  // Parc de la Bagatelle (within Bois de Boulogne)
  [2.2427, 48.8679, 210, 190, 1.5],
  // Coulée verte / Promenade Plantée
  [2.3803, 48.8511, 720, 45, 1.3],
  // Grand Palais & Petit Palais surrounding park groves
  [2.3135, 48.8660, 170, 130, 1.4],
  // Berge de Seine / green esplanade
  [2.3162, 48.8586, 210, 35, 1.1],
  // Parc Kellermann
  [2.3484, 48.8140, 180, 150, 1.2],
  // Parc de Belleville
  [2.3817, 48.8699, 160, 180, 1.3],
  // Cimetière de Montmartre
  [2.3304, 48.8851, 170, 150, 1.2],
];

let _greenZoneWorldsCache = null;
function getGreenZoneWorlds() {
  if (!_greenZoneWorldsCache) {
    _greenZoneWorldsCache = PARIS_GREEN_ZONES.map(([lng, lat, hw, hh, density]) => {
      const center = lngLatToWorld(lng, lat);
      return { cx: center.x, cz: center.z, hw, hh, density };
    });
  }
  return _greenZoneWorldsCache;
}

export function isInGreenZone(gx, gz) {
  const zones = getGreenZoneWorlds();
  for (let i = 0; i < zones.length; i++) {
    const z = zones[i];
    if (Math.abs(gx - z.cx) < z.hw && Math.abs(gz - z.cz) < z.hh) {
      return z.density;
    }
  }
  return 0;
}

// ─── Spatial Hash Catalog for Fixed Geographic Objects ─────────────────────
export class SpatialCatalog {
  constructor(cellSize = 75) {
    this.cellSize = cellSize;
    this.buckets = new Map();
  }

  _key(x, z) {
    return `${Math.floor(x / this.cellSize)},${Math.floor(z / this.cellSize)}`;
  }

  add(item) {
    const k = this._key(item.x, item.z);
    let list = this.buckets.get(k);
    if (!list) {
      list = [];
      this.buckets.set(k, list);
    }
    list.push(item);
  }

  query(x, z, radiusM) {
    const minX = Math.floor((x - radiusM) / this.cellSize);
    const maxX = Math.floor((x + radiusM) / this.cellSize);
    const minZ = Math.floor((z - radiusM) / this.cellSize);
    const maxZ = Math.floor((z + radiusM) / this.cellSize);

    const r2 = radiusM * radiusM;
    const results = [];

    for (let cx = minX; cx <= maxX; cx++) {
      for (let cz = minZ; cz <= maxZ; cz++) {
        const list = this.buckets.get(`${cx},${cz}`);
        if (list) {
          for (let i = 0; i < list.length; i++) {
            const it = list[i];
            const dx = it.x - x;
            const dz = it.z - z;
            if (dx * dx + dz * dz <= r2) {
              results.push(it);
            }
          }
        }
      }
    }
    return results;
  }
}

// ─── Props Manager ──────────────────────────────────────────────────────────
export class PropsManager {
  constructor(scene) {
    this.scene = scene;
    this.propsGroup = new THREE.Group();
    this.propsGroup.name = 'city-props-group';
    this.scene.add(this.propsGroup);

    this.catalog = new SpatialCatalog(75);

    // Reusable mesh pools
    this.pools = {
      streetLights: [],
      benches: [],
      trees: [],
      fires: [],
      dividers: [],
    };
    this.flameObjects = [];

    // State settings
    this.streetLightsEnabled = true;
    this.streetLightsCount = 40;
    this.benchesEnabled = true;
    this.benchesCount = 20;
    this.treesEnabled = true;
    this.treesCount = 45;
    this.fireEnabled = true;
    this.fireCount = 15;
    this.dividersEnabled = true;

    this.lastVehicleX = -999999;
    this.lastVehicleZ = -999999;
    this._forceRefresh = true;

    // Seed Paris iconic boulevards & landmarks into catalog
    this._seedParisPlazasAndBoulevards();

    // Initialize mesh pools
    this._initPools();
  }

  _seedParisPlazasAndBoulevards() {
    // 1. Champ de Mars / Eiffel Tower Allées (Avenue Gustave Eiffel, Avenue Anatole France)
    const eiffelCenter = [2.2945, 48.8584];
    for (let dist = -250; dist <= 350; dist += 22) {
      // Avenue along Champ de Mars parkway (heading ~135° SE)
      const p1 = offsetLngLat(eiffelCenter, 135, dist);
      const left = offsetLngLat(p1, 45, 14);
      const right = offsetLngLat(p1, 225, 14);
      const wL = lngLatToWorld(left[0], left[1]);
      const wR = lngLatToWorld(right[0], right[1]);
      const wC = lngLatToWorld(p1[0], p1[1]);

      const rotRoad = (135 * Math.PI) / 180;
      this.catalog.add({ type: 'streetLight', x: wL.x, z: wL.z, rotY: rotRoad + Math.PI / 2 });
      this.catalog.add({ type: 'streetLight', x: wR.x, z: wR.z, rotY: rotRoad - Math.PI / 2 });
      this.catalog.add({ type: 'tree', x: wL.x + 1.5, z: wL.z, rotY: Math.random() * Math.PI * 2 });
      this.catalog.add({ type: 'tree', x: wR.x - 1.5, z: wR.z, rotY: Math.random() * Math.PI * 2 });
      if (Math.abs(dist) % 44 === 0) {
        this.catalog.add({ type: 'bench', x: wL.x, z: wL.z - 2, rotY: rotRoad + Math.PI / 2 });
        this.catalog.add({ type: 'bench', x: wR.x, z: wR.z - 2, rotY: rotRoad - Math.PI / 2 });
      }
      this.catalog.add({ type: 'divider', x: wC.x, z: wC.z, rotY: rotRoad });
    }

    // Eiffel Tower base stone fire torches
    [-20, 20].forEach(ox => {
      [-20, 20].forEach(oz => {
        const p = offsetLngLat(eiffelCenter, ox > 0 ? 90 : 270, Math.abs(ox));
        const p2 = offsetLngLat(p, oz > 0 ? 0 : 180, Math.abs(oz));
        const w = lngLatToWorld(p2[0], p2[1]);
        this.catalog.add({ type: 'fire', x: w.x, z: w.z, rotY: 0 });
      });
    });

    // 2. Pont d'Iéna bridge across the Seine (heading 315° NW)
    for (let d = 50; d <= 230; d += 20) {
      const pt = offsetLngLat(eiffelCenter, 315, d);
      const left = offsetLngLat(pt, 225, 9.5);
      const right = offsetLngLat(pt, 45, 9.5);
      const wL = lngLatToWorld(left[0], left[1]);
      const wR = lngLatToWorld(right[0], right[1]);
      const wC = lngLatToWorld(pt[0], pt[1]);
      this.catalog.add({ type: 'streetLight', x: wL.x, z: wL.z, rotY: (315 + 90) * Math.PI / 180 });
      this.catalog.add({ type: 'streetLight', x: wR.x, z: wR.z, rotY: (315 - 90) * Math.PI / 180 });
      this.catalog.add({ type: 'divider', x: wC.x, z: wC.z, rotY: (315 * Math.PI) / 180 });
      if (d === 50 || d === 230) {
        this.catalog.add({ type: 'fire', x: wL.x, z: wL.z, rotY: 0 });
        this.catalog.add({ type: 'fire', x: wR.x, z: wR.z, rotY: 0 });
      }
    }

    // 3. Deterministic Paris Green-Zone Tree Placement
    // Only seed trees inside verified green areas (parks, gardens, cemeteries) visible
    // as green in the satellite image. Non-green grid cells get street furniture instead.
    for (let gx = -1800; gx <= 2800; gx += 45) {
      for (let gz = -1600; gz <= 2000; gz += 45) {
        // Deterministic pseudo-random hash of grid coordinate
        const seed = Math.sin(gx * 12.9898 + gz * 78.233) * 43758.5453;
        const frac = seed - Math.floor(seed);
        const rot = (frac * Math.PI * 2);

        const greenDensity = isInGreenZone(gx, gz);
        if (greenDensity > 0) {
          // Inside a green/park zone: predominantly trees with high density
          // Secondary frac for sub-variation within zone
          const seed2 = Math.sin(gx * 6.7234 + gz * 43.9823) * 12345.6789;
          const frac2 = seed2 - Math.floor(seed2);
          // Place trees much more densely: nearly every cell in zone
          if (frac2 < 0.80 * greenDensity / 2.0) {
            // Dense tree clusters — pack them tighter in green zones
            this.catalog.add({ type: 'tree', x: gx, z: gz, rotY: rot });
            // Sometimes add a second offset tree for park density
            if (frac2 < 0.35 && greenDensity > 1.2) {
              const ox = (frac * 20) - 10;
              const oz = (frac2 * 20) - 10;
              this.catalog.add({ type: 'tree', x: gx + ox, z: gz + oz, rotY: rot + 0.5 });
            }
          } else if (frac2 < 0.88) {
            // Occasional bench / path furniture inside parks
            this.catalog.add({ type: 'bench', x: gx, z: gz, rotY: rot });
          }
          // No street lights or road dividers inside green zones
        } else {
          // Outside green zones: urban street furniture only, NO trees
          if (frac > 0.65) {
            this.catalog.add({ type: 'streetLight', x: gx, z: gz, rotY: rot });
          } else if (frac > 0.22) {
            // benches instead of trees in non-green urban grid
            if (frac > 0.35 && frac < 0.50) {
              this.catalog.add({ type: 'bench', x: gx, z: gz, rotY: rot });
            }
          } else if (frac > 0.18) {
            this.catalog.add({ type: 'divider', x: gx, z: gz, rotY: rot });
          }
        }
      }
    }
  }


  /**
   * Load real Tour GeoJSON route and populate sidewalks along all 14.6 km of Paris streets.
   */
  loadRouteProps(routeLine) {
    if (!routeLine?.geometry?.coordinates) return;
    const coords = routeLine.geometry.coordinates;
    if (coords.length < 2) return;

    for (let i = 0; i < coords.length - 1; i++) {
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const segDist = distanceMeters(p1, p2);
      if (segDist < 1) continue;

      const bearing = bearingBetween(p1, p2);
      const rotRoad = (bearing * Math.PI) / 180;
      const step = 20; // sample every 20 meters along sidewalk

      for (let d = 0; d < segDist; d += step) {
        const frac = d / segDist;
        const pt = [
          p1[0] + (p2[0] - p1[0]) * frac,
          p1[1] + (p2[1] - p1[1]) * frac,
        ];

        // 7.5m offset for left and right sidewalks
        const leftCoord = offsetLngLat(pt, bearing - 90, 7.8);
        const rightCoord = offsetLngLat(pt, bearing + 90, 7.8);
        const wL = lngLatToWorld(leftCoord[0], leftCoord[1]);
        const wR = lngLatToWorld(rightCoord[0], rightCoord[1]);
        const wC = lngLatToWorld(pt[0], pt[1]);

        // Street Lights along sidewalks (pointing toward street)
        this.catalog.add({ type: 'streetLight', x: wL.x, z: wL.z, rotY: rotRoad + Math.PI / 2 });
        this.catalog.add({ type: 'streetLight', x: wR.x, z: wR.z, rotY: rotRoad - Math.PI / 2 });

        // Boulevard Trees: Placed ONLY in verified green satellite areas
        if (Math.floor(d) % 40 === 0) {
          if (isInGreenZone(wL.x, wL.z) > 0) {
            this.catalog.add({ type: 'tree', x: wL.x, z: wL.z + 1.2, rotY: Math.random() * Math.PI * 2 });
          }
          if (isInGreenZone(wR.x, wR.z) > 0) {
            this.catalog.add({ type: 'tree', x: wR.x, z: wR.z - 1.2, rotY: Math.random() * Math.PI * 2 });
          }
        }

        // Sidewalk Benches
        if (Math.floor(d) % 60 === 0) {
          this.catalog.add({ type: 'bench', x: wL.x, z: wL.z, rotY: rotRoad + Math.PI / 2 });
        }

        // Center Median Dividers
        if (Math.floor(d) % 30 === 0) {
          this.catalog.add({ type: 'divider', x: wC.x, z: wC.z, rotY: rotRoad });
        }

        // Fire Braziers along bridges and key corners
        if (Math.floor(d) % 120 === 0) {
          this.catalog.add({ type: 'fire', x: wL.x, z: wL.z, rotY: 0 });
        }
      }
    }

    this._forceRefresh = true;
  }

  _initPools() {
    this._adjustPool('streetLights', buildStreetLight, this.streetLightsCount);
    this._adjustPool('benches', buildBench, this.benchesCount);
    this._adjustPool('trees', buildTree, this.treesCount);
    this._adjustPool('fires', buildFireTorch, this.fireCount);
    this._adjustPool('dividers', () => buildMedianDivider(22), 16);
  }

  _adjustPool(name, factory, targetCount) {
    const pool = this.pools[name];
    while (pool.length < targetCount) {
      const mesh = factory();
      mesh.visible = false;
      this.propsGroup.add(mesh);
      pool.push(mesh);
    }
    // If pool is larger, hide excess
    for (let i = targetCount; i < pool.length; i++) {
      pool[i].visible = false;
    }
  }

  updateStreetLights(enabled, count) {
    this.streetLightsEnabled = enabled;
    this.streetLightsCount = count;
    this._adjustPool('streetLights', buildStreetLight, enabled ? count : 0);
    this._forceRefresh = true;
  }

  updateBenches(enabled, count) {
    this.benchesEnabled = enabled;
    this.benchesCount = count;
    this._adjustPool('benches', buildBench, enabled ? count : 0);
    this._forceRefresh = true;
  }

  updateTrees(enabled, count) {
    this.treesEnabled = enabled;
    this.treesCount = count;
    this._adjustPool('trees', buildTree, enabled ? count : 0);
    this._forceRefresh = true;
  }

  updateFire(enabled, count) {
    this.fireEnabled = enabled;
    this.fireCount = count;
    this._adjustPool('fires', buildFireTorch, enabled ? count : 0);
    this._forceRefresh = true;
  }

  updateDividers(enabled) {
    this.dividersEnabled = enabled;
    this._adjustPool('dividers', () => buildMedianDivider(22), enabled ? 16 : 0);
    this._forceRefresh = true;
  }

  /**
   * Called every frame with the vehicle's real-world metric coordinates.
   * Only reassigns mesh positions when the vehicle has moved > 2.5m,
   * guaranteeing that props are 100% stationary and never follow the vehicle!
   */
  updateVehiclePosition(vx, vz) {
    const distMoved = Math.hypot(vx - this.lastVehicleX, vz - this.lastVehicleZ);
    if (distMoved < 2.5 && !this._forceRefresh) {
      return;
    }

    this.lastVehicleX = vx;
    this.lastVehicleZ = vz;
    this._forceRefresh = false;

    // Query all fixed catalog items within 230 meters of vehicle
    const nearby = this.catalog.query(vx, vz, 230);

    const types = [
      { key: 'streetLights', type: 'streetLight', enabled: this.streetLightsEnabled, max: this.streetLightsCount },
      { key: 'benches', type: 'bench', enabled: this.benchesEnabled, max: this.benchesCount },
      { key: 'trees', type: 'tree', enabled: this.treesEnabled, max: this.treesCount },
      { key: 'fires', type: 'fire', enabled: this.fireEnabled, max: this.fireCount },
      { key: 'dividers', type: 'divider', enabled: this.dividersEnabled, max: 16 },
    ];

    this.flameObjects = [];

    types.forEach(({ key, type, enabled, max }) => {
      const pool = this.pools[key];
      if (!enabled || max <= 0) {
        pool.forEach(m => { m.visible = false; });
        return;
      }

      // Filter and sort by distance to vehicle
      const items = nearby
        .filter(it => it.type === type)
        .sort((a, b) => {
          const da = (a.x - vx) * (a.x - vx) + (a.z - vz) * (a.z - vz);
          const db = (b.x - vx) * (b.x - vx) + (b.z - vz) * (b.z - vz);
          return da - db;
        });

      for (let i = 0; i < pool.length; i++) {
        const mesh = pool[i];
        if (i < items.length && i < max) {
          const it = items[i];
          // Assign to FIXED geographic spot
          mesh.position.set(it.x, 0, it.z);
          mesh.rotation.y = it.rotY || 0;
          mesh.visible = true;

          if (type === 'fire') {
            this.flameObjects.push(mesh);
          }
        } else {
          mesh.visible = false;
        }
      }
    });
  }

  tick(timeSec) {
    // Animate flickering fire flames on active torches
    this.flameObjects.forEach((f, idx) => {
      if (!f.visible) return;
      const flame = f.userData.flame;
      const core = f.userData.core;
      const light = f.userData.fireLight;
      if (flame && core) {
        const flicker = Math.sin(timeSec * 15 + idx * 2.3) * 0.15 + 1.0;
        flame.scale.set(flicker, flicker * 1.1, flicker);
        core.scale.set(flicker * 0.9, flicker * 1.05, flicker * 0.9);
        if (light) {
          light.intensity = 1.6 + Math.sin(timeSec * 22 + idx) * 0.6;
        }
      }
    });
  }

  destroy() {
    Object.values(this.pools).forEach(pool => {
      pool.forEach(obj => {
        this.propsGroup.remove(obj);
        obj.traverse(o => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) {
            if (Array.isArray(o.material)) o.material.forEach(m => m.dispose());
            else o.material.dispose();
          }
        });
      });
      pool.length = 0;
    });
    this.flameObjects.length = 0;
    if (this.propsGroup && this.scene) {
      this.scene.remove(this.propsGroup);
    }
  }
}

