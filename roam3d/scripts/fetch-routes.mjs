#!/usr/bin/env node
// scripts/fetch-routes.mjs
// Fetches driving route from the public OSRM demo server.
// Run ONCE: node scripts/fetch-routes.mjs
// Writes: public/routes/tour.json
//
// Rate: 1 request/second max (OSRM demo server courtesy limit)
// Profile: driving (car). If bike profile is unavailable we reuse car route.
//
// Landmark order:
// 1 Eiffel Tower     [2.2945, 48.8584]
// 2 Arc de Triomphe  [2.2950, 48.8738]
// 3 Place Concorde   [2.3212, 48.8656]
// 4 Louvre           [2.3376, 48.8606]
// 5 Notre-Dame       [2.3499, 48.8530]
// 6 Sacré-Cœur       [2.3431, 48.8867]

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'routes');

// Landmark waypoints [lng, lat] – snapped to nearest drivable road
const LANDMARKS = [
  { name: 'Eiffel Tower',         coord: [2.2945, 48.8584] },
  { name: 'Arc de Triomphe',      coord: [2.2950, 48.8738] },
  { name: 'Place de la Concorde', coord: [2.3212, 48.8656] },
  { name: 'Louvre',               coord: [2.3376, 48.8606] },
  { name: 'Notre-Dame',           coord: [2.3499, 48.8530] },
  { name: 'Sacré-Cœur',           coord: [2.3431, 48.8867] },
];

// OSRM public demo server – driving profile
const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/** Fetch one route leg between two [lng,lat] points */
async function fetchLeg(from, to, legIndex) {
  const coords = `${from[0]},${from[1]};${to[0]},${to[1]}`;
  const url = `${OSRM_BASE}/${coords}?geometries=geojson&overview=full`;
  console.log(`  Fetching leg ${legIndex}: ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM HTTP ${res.status} for leg ${legIndex}`);
  const json = await res.json();
  if (json.code !== 'Ok') throw new Error(`OSRM code=${json.code} for leg ${legIndex}`);
  return json.routes[0].geometry; // GeoJSON LineString geometry
}

/** Merge multiple LineString coordinate arrays into one */
function mergeCoords(geometries) {
  const coords = [];
  geometries.forEach((geom, i) => {
    const pts = geom.coordinates;
    // Skip first point of subsequent legs to avoid duplicates
    const start = i === 0 ? 0 : 1;
    coords.push(...pts.slice(start));
  });
  return coords;
}

/** Compute cumulative distances (km) along a coordinate array using Haversine */
function cumulativeDistances(coords) {
  const dists = [0];
  for (let i = 1; i < coords.length; i++) {
    const [lng1, lat1] = coords[i - 1];
    const [lng2, lat2] = coords[i];
    const R = 6371;
    const φ1 = lat1 * Math.PI / 180, φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180, Δλ = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
    dists.push(dists[i-1] + R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
  }
  return dists;
}

/** Find distance along route (km) closest to a given [lng,lat] */
function distToLandmark(routeCoords, cumDists, targetCoord) {
  let minDist = Infinity, bestCumDist = 0;
  routeCoords.forEach(([lng, lat], i) => {
    const d = Math.hypot(lng - targetCoord[0], lat - targetCoord[1]);
    if (d < minDist) { minDist = d; bestCumDist = cumDists[i]; }
  });
  return bestCumDist;
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const legs = [];
  for (let i = 0; i < LANDMARKS.length - 1; i++) {
    const from = LANDMARKS[i].coord;
    const to   = LANDMARKS[i + 1].coord;
    try {
      const geom = await fetchLeg(from, to, i + 1);
      legs.push(geom);
      console.log(`  ✓ Leg ${i+1} fetched (${geom.coordinates.length} points)`);
    } catch (err) {
      console.error(`  ✗ Leg ${i+1} failed: ${err.message}`);
      console.error('    Cannot invent geometry. Paste the route manually or retry.');
      process.exit(1);
    }
    if (i < LANDMARKS.length - 2) {
      await sleep(1100); // 1 req/s rate limit
    }
  }

  // Merge all leg coordinates
  const allCoords = mergeCoords(legs);
  const cumDists = cumulativeDistances(allCoords);
  const totalKm = cumDists[cumDists.length - 1];
  console.log(`\nTotal route: ${totalKm.toFixed(2)} km, ${allCoords.length} points`);

  // Compute landmark distances along merged route
  const landmarkPoints = LANDMARKS.map((lm, i) => ({
    name: lm.name,
    distKm: distToLandmark(allCoords, cumDists, lm.coord),
  }));

  landmarkPoints.forEach((lp, i) => {
    console.log(`  ${LANDMARKS[i].name}: ${lp.distKm.toFixed(3)} km along route`);
  });

  // Build output
  const output = {
    route: {
      type: 'Feature',
      properties: { name: 'Paris Tour', totalKm },
      geometry: { type: 'LineString', coordinates: allCoords },
    },
    landmarks: landmarkPoints,
  };

  const outFile = join(OUT_DIR, 'tour.json');
  writeFileSync(outFile, JSON.stringify(output, null, 2));
  console.log(`\n✅ Wrote ${outFile}`);
  console.log('Run: npm run dev');
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
