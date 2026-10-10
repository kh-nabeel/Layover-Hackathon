// src/main.js
// Entry point: initialises MapLibre map, loads route, and runs the game loop.

import { Map, setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';


import { MAP_STYLE, MAP_INIT, LANDMARKS, VEHICLES, CHALLENGE_DURATION } from './config.js';
import { loadRoute, getRouteLine, getLandmarkPoints, bearingAtDist, positionAtDist } from './route.js';
import { VehicleLayer } from './customLayer.js';
import { DrivingState } from './driving.js';
import { CameraController } from './camera.js';
import { LandmarkManager } from './landmarks.js';
import {
  initProgressBar, updateHUD, markLandmarkVisited,
  updateAutopilotBtn, updateCamBtn, updateVehicleBtn, updateChallengeTimer
} from './hud.js';
import { initLanding, showHUD, showFinish } from './landing.js';
import {
  createHaussmannFacadeTexture,
  createRooftopTexture,
  createRoadAsphaltTexture,
  createZebraCrossingTexture,
  createPavementTexture
} from './textures.js';

// Vite worker setup (required by OpenFreeMap quick-start docs)
setWorkerUrl(workerUrl);

// Expose maplibregl namespace so landmarks.js can use Marker
import * as maplibregl from 'maplibre-gl';
window.maplibregl = maplibregl;

// ─── Map Initialisation ────────────────────────────────────────────────────
const map = new Map({
  container: 'map',
  style: MAP_STYLE,
  ...MAP_INIT,
  attributionControl: true, // shows OpenFreeMap / OpenMapTiles / OSM
});

// ─── Loading / Error state ─────────────────────────────────────────────────
const loadingEl = document.getElementById('loading-overlay');
const errorEl = document.getElementById('error-overlay');

let tileLoadTimer = setTimeout(() => {
  // If map hasn't loaded in 12 s, show error hint (tiles may be slow, not broken)
}, 12000);

map.on('load', () => {
  clearTimeout(tileLoadTimer);
  loadingEl.style.opacity = '0';
  setTimeout(() => { loadingEl.style.display = 'none'; }, 500);
  onMapLoaded();
});

map.on('error', (e) => {
  console.warn('MapLibre error:', e.error);
  // Only show hard error if map canvas is completely blank after 15 s
});

// ─── State ─────────────────────────────────────────────────────────────────
let vehicleLayer = null;
let driving = null;
let camera = null;
let landmarks = null;
let gameRunning = false;
let startTime = 0;

// Challenge mode
let challengeActive = false;
let challengeTimeLeft = CHALLENGE_DURATION;
let challengeInterval = null;

// ─── Map Loaded ─────────────────────────────────────────────────────────────
async function onMapLoaded() {
  // ── Phase 1: 3D Buildings ──────────────────────────────────────────────
  setup3DBuildings();

  // ── Load route ────────────────────────────────────────────────────────
  let routeLoaded = false;
  try {
    await loadRoute();
    routeLoaded = true;
  } catch (err) {
    console.error('Route load failed:', err);
    errorEl.style.display = 'flex';
    errorEl.querySelector('.error-msg').textContent =
      'Could not load route data. Make sure /routes/tour.json exists.';
    return;
  }

  // Draw route line on map
  drawRouteOnMap();

  // ── Landing screen ────────────────────────────────────────────────────
  initLanding(({ vehicle, autopilot }) => {
    startGame(vehicle, autopilot);
  });
}

// ─── 3D Buildings, Textures & Satellite Environment Setup ──────────────────
function setup3DBuildings() {
  // 1. Register high-resolution procedural textures
  try {
    if (!map.hasImage('facade-haussmann')) {
      map.addImage('facade-haussmann', createHaussmannFacadeTexture());
    }
    if (!map.hasImage('roof-ac-units')) {
      map.addImage('roof-ac-units', createRooftopTexture());
    }
    if (!map.hasImage('road-asphalt')) {
      map.addImage('road-asphalt', createRoadAsphaltTexture());
    }
    if (!map.hasImage('crosswalk-zebra')) {
      map.addImage('crosswalk-zebra', createZebraCrossingTexture());
    }
    if (!map.hasImage('pavement-stone')) {
      map.addImage('pavement-stone', createPavementTexture());
    }
  } catch (err) {
    console.warn('Texture registration notice:', err);
  }

  // 2. High-Resolution Satellite Ground Layer (ESRI World Imagery)
  try {
    if (!map.getSource('satellite-imagery')) {
      map.addSource('satellite-imagery', {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        maxzoom: 19,
      });
    }

    const layers = map.getStyle().layers;
    const firstRoad = layers.find(
      l => l['source-layer'] === 'transportation' || l.id.includes('road') || l.id.includes('tunnel')
    );
    const roadBeforeId = firstRoad ? firstRoad.id : undefined;

    if (!map.getLayer('satellite-base')) {
      map.addLayer({
        id: 'satellite-base',
        type: 'raster',
        source: 'satellite-imagery',
        paint: {
          'raster-opacity': 0.88,
          'raster-saturation': 0.15,
          'raster-contrast': 0.1,
        },
      }, roadBeforeId);
    }
  } catch (e) {
    console.warn('Satellite layer notice:', e);
  }

  // 3. High-Resolution Road Surface, Center Lane Stripes, and Sidewalk Overlays
  try {
    if (!map.getLayer('roam3d-roads-hd')) {
      map.addLayer({
        id: 'roam3d-roads-hd',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: ['!=', 'class', 'rail'],
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#1e2229',
          'line-width': [
            'interpolate', ['exponential', 1.5], ['zoom'],
            13, 3,
            15, 8,
            17, 18,
            19, 36,
          ],
          'line-opacity': 0.94,
        },
      });
    }

    // White dashed center lane lines on main roads
    if (!map.getLayer('roam3d-roads-lanes')) {
      map.addLayer({
        id: 'roam3d-roads-lanes',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: ['in', 'class', 'primary', 'secondary', 'trunk', 'motorway', 'main'],
        paint: {
          'line-color': '#ffffff',
          'line-width': [
            'interpolate', ['linear'], ['zoom'],
            16, 1.2,
            18, 2.5,
            20, 4.0,
          ],
          'line-dasharray': [2, 3],
          'line-opacity': 0.88,
        },
      });
    }

    // Parisian sidewalk pavements
    if (!map.getLayer('roam3d-pavements')) {
      map.addLayer({
        id: 'roam3d-pavements',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: ['in', 'class', 'path', 'pedestrian', 'footway'],
        paint: {
          'line-color': '#d5cbbd',
          'line-width': [
            'interpolate', ['linear'], ['zoom'],
            15, 2,
            18, 6,
            20, 12,
          ],
          'line-opacity': 0.85,
        },
      });
    }
  } catch (e) {
    console.warn('Road overlays notice:', e);
  }

  // 4. 3D Textured Buildings with Window/Facade Texture & Rooftop Details
  const layers = map.getStyle().layers;
  const existingExtrusionLayer = layers.find(
    l => l.type === 'fill-extrusion' && (l['source-layer'] === 'building' || l.id.includes('building'))
  );

  if (existingExtrusionLayer) {
    map.setPaintProperty(existingExtrusionLayer.id, 'fill-extrusion-pattern', 'facade-haussmann');
    map.setPaintProperty(existingExtrusionLayer.id, 'fill-extrusion-opacity', 0.96);
    map.setPaintProperty(existingExtrusionLayer.id, 'fill-extrusion-height', [
      'interpolate', ['linear'], ['zoom'],
      13.5, 0,
      14.5, ['coalesce', ['get', 'render_height'], ['get', 'height'], 20],
    ]);
    map.setPaintProperty(existingExtrusionLayer.id, 'fill-extrusion-base', [
      'interpolate', ['linear'], ['zoom'],
      13.5, 0,
      14.5, ['coalesce', ['get', 'render_min_height'], ['get', 'min_height'], 0],
    ]);
    try {
      map.setPaintProperty(existingExtrusionLayer.id, 'fill-extrusion-vertical-gradient', true);
    } catch (e) {}
  } else {
    const labelLayer = layers.find(l => l.type === 'symbol');
    const beforeId = labelLayer ? labelLayer.id : undefined;

    map.addLayer({
      id: 'roam3d-buildings',
      type: 'fill-extrusion',
      source: 'openmaptiles',
      'source-layer': 'building',
      minzoom: 13.5,
      paint: {
        'fill-extrusion-pattern': 'facade-haussmann',
        'fill-extrusion-height': [
          'interpolate', ['linear'], ['zoom'],
          13.5, 0,
          14.5, ['coalesce', ['get', 'render_height'], ['get', 'height'], 20],
        ],
        'fill-extrusion-base': [
          'interpolate', ['linear'], ['zoom'],
          13.5, 0,
          14.5, ['coalesce', ['get', 'render_min_height'], ['get', 'min_height'], 0],
        ],
        'fill-extrusion-opacity': 0.96,
        'fill-extrusion-vertical-gradient': true,
      },
    }, beforeId);
  }

  // 5. Realistic daylight Paris sky & atmospheric horizon for Street View
  try {
    if (typeof map.setSky === 'function') {
      map.setSky({
        'sky-color': '#7ec0ee',
        'horizon-color': '#dceaf7',
        'fog-color': '#cfdfee',
        'atmosphere-blend': 0.85,
      });
    }
  } catch (e) {}

  // 6. Atmospheric fog for immersive street-level depth
  try {
    if (typeof map.setFog === 'function') {
      map.setFog({
        'range': [0.5, 12],
        'color': '#dce5ef',
        'horizon-blend': 0.08,
        'high-color': '#a5c8e8',
        'space-color': '#c7ddf0',
        'star-intensity': 0,
      });
    }
  } catch (e) {}
}

// ─── Draw Route Line ──────────────────────────────────────────────────────
function drawRouteOnMap() {
  const routeLine = getRouteLine();
  if (!routeLine) return;

  // Add route source
  if (!map.getSource('route')) {
    map.addSource('route', {
      type: 'geojson',
      data: routeLine,
    });
  }

  // Route outline (glow)
  if (!map.getLayer('route-glow')) {
    map.addLayer({
      id: 'route-glow',
      type: 'line',
      source: 'route',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': '#4fc3f7',
        'line-width': 10,
        'line-opacity': 0.25,
        'line-blur': 4,
      },
    });
  }

  // Route main line
  if (!map.getLayer('route-line')) {
    map.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': '#29b6f6',
        'line-width': 4,
        'line-opacity': 0.85,
      },
    });
  }
}

// ─── Start Game ────────────────────────────────────────────────────────────
function startGame(vehicleType, autopilotMode) {
  showHUD();
  gameRunning = true;
  startTime = performance.now();

  // Driving state
  driving = new DrivingState();
  driving.vehicleType = vehicleType;
  driving.autopilot = autopilotMode;

  // Camera
  camera = new CameraController(map);

  // Vehicle layer
  vehicleLayer = new VehicleLayer();
  map.addLayer(vehicleLayer);
  vehicleLayer.setVehicleType(vehicleType);

  // Landmarks
  landmarks = new LandmarkManager(map);
  landmarks.onVisit((lm, count) => {
    const idx = LANDMARKS.findIndex(l => l.id === lm.id);
    markLandmarkVisited(idx);
    if (landmarks.isAllVisited()) {
      // slight delay so last card is visible
      setTimeout(() => endGame(), 3000);
    }
  });

  // Init progress bar
  initProgressBar();

  // Set initial position and bearing along route
  const startCoord = positionAtDist(0) || LANDMARKS[0].coord;
  const startBearing = bearingAtDist(0) || 0;
  vehicleLayer.setPosition(startCoord, startBearing);

  // Smooth cinematic landing flyTo from overview down to street level
  driving.paused = true;
  camera.flyToStart(startCoord, startBearing, () => {
    driving.paused = false;
  });

  // Wire up HUD buttons
  document.getElementById('btn-autopilot').addEventListener('click', () => {
    driving.autopilot = !driving.autopilot;
    updateAutopilotBtn(driving.autopilot);
  });
  document.getElementById('btn-cam').addEventListener('click', () => {
    const mode = camera.nextMode();
    updateCamBtn(mode);
  });
  document.getElementById('btn-speech').addEventListener('click', () => {
    const el = document.getElementById('btn-speech');
    const enabled = el.classList.toggle('active');
    landmarks.setSpeech(!enabled); // toggle
    el.textContent = enabled ? '🔇 Voice' : '🔊 Voice';
  });
  document.getElementById('btn-vehicle-switch').addEventListener('click', () => {
    driving.vehicleType = driving.vehicleType === 'car' ? 'bike' : 'car';
    vehicleLayer.setVehicleType(driving.vehicleType);
    updateVehicleBtn(driving.vehicleType);
  });
  document.getElementById('btn-challenge').addEventListener('click', toggleChallenge);

  // Shortcut keys (V = vehicle, C = camera, P = autopilot)
  // NOTE: A/D are reserved for WASD steering — do NOT bind autopilot to A!
  window.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    if (e.code === 'KeyV') {
      driving.vehicleType = driving.vehicleType === 'car' ? 'bike' : 'car';
      vehicleLayer.setVehicleType(driving.vehicleType);
      updateVehicleBtn(driving.vehicleType);
    }
    if (e.code === 'KeyC') {
      const mode = camera.nextMode();
      updateCamBtn(mode);
    }
    if (e.code === 'KeyP') {
      driving.autopilot = !driving.autopilot;
      updateAutopilotBtn(driving.autopilot);
    }
  });

  // Update button states
  updateAutopilotBtn(autopilotMode);
  updateCamBtn('street');
  updateVehicleBtn(vehicleType);

  // Wire on-screen gas and brake pedals (for touch/click driving)
  const btnGas = document.getElementById('btn-gas');
  const btnBrake = document.getElementById('btn-brake');
  const btnSteerLeft = document.getElementById('btn-steer-left');
  const btnSteerRight = document.getElementById('btn-steer-right');
  const btnSat = document.getElementById('btn-satellite');

  if (btnGas) {
    btnGas.addEventListener('mousedown', () => driving.setForward(true));
    btnGas.addEventListener('mouseup', () => driving.setForward(false));
    btnGas.addEventListener('mouseleave', () => driving.setForward(false));
    btnGas.addEventListener('touchstart', (e) => { e.preventDefault(); driving.setForward(true); });
    btnGas.addEventListener('touchend', (e) => { e.preventDefault(); driving.setForward(false); });
  }
  if (btnBrake) {
    btnBrake.addEventListener('mousedown', () => driving.setBack(true));
    btnBrake.addEventListener('mouseup', () => driving.setBack(false));
    btnBrake.addEventListener('mouseleave', () => driving.setBack(false));
    btnBrake.addEventListener('touchstart', (e) => { e.preventDefault(); driving.setBack(true); });
    btnBrake.addEventListener('touchend', (e) => { e.preventDefault(); driving.setBack(false); });
  }
  if (btnSteerLeft) {
    btnSteerLeft.addEventListener('mousedown', () => driving.setLeft(true));
    btnSteerLeft.addEventListener('mouseup', () => driving.setLeft(false));
    btnSteerLeft.addEventListener('mouseleave', () => driving.setLeft(false));
    btnSteerLeft.addEventListener('touchstart', (e) => { e.preventDefault(); driving.setLeft(true); });
    btnSteerLeft.addEventListener('touchend', (e) => { e.preventDefault(); driving.setLeft(false); });
  }
  if (btnSteerRight) {
    btnSteerRight.addEventListener('mousedown', () => driving.setRight(true));
    btnSteerRight.addEventListener('mouseup', () => driving.setRight(false));
    btnSteerRight.addEventListener('mouseleave', () => driving.setRight(false));
    btnSteerRight.addEventListener('touchstart', (e) => { e.preventDefault(); driving.setRight(true); });
    btnSteerRight.addEventListener('touchend', (e) => { e.preventDefault(); driving.setRight(false); });
  }

  let satActive = true;
  if (btnSat) {
    btnSat.addEventListener('click', () => {
      satActive = !satActive;
      if (map.getLayer('satellite-base')) {
        map.setPaintProperty('satellite-base', 'raster-opacity', satActive ? 0.88 : 0);
      }
      btnSat.classList.toggle('active', satActive);
      btnSat.textContent = satActive ? '🛰️ Satellite' : '🗺️ Map';
    });
  }

  // Tab visibility: pause when hidden, resume when visible
  document.addEventListener('visibilitychange', () => {
    driving.paused = document.hidden;
  });

  // Start game loop
  let lastTs = performance.now();
  function loop(ts) {
    if (!gameRunning) return;
    const dt = Math.min((ts - lastTs) / 1000, 0.1); // cap at 100ms
    lastTs = ts;

    if (!document.hidden) {
      const result = driving.tick(dt);
      if (result) {
        // Update vehicle layer position and front wheel steering
        vehicleLayer.setPosition(result.lngLat, result.bearing);
        vehicleLayer.setSteering(result.steeringAngle);

        // Update camera (with auto-realignment when user drives with WASD!)
        camera.update(result.lngLat, result.bearing, dt, result.isUserDriving, result.speedKmh);

        // Check landmarks
        landmarks.check(result.lngLat);

        // Compute next landmark
        const landmarkPts = getLandmarkPoints();
        const nextPt = landmarkPts.find(p => {
          const lm = LANDMARKS[landmarkPts.indexOf(p)];
          return lm && !landmarks.visited.has(lm.id);
        });
        // Simpler: find first unvisited landmark by distance
        const nextLm = LANDMARKS.find(lm => !landmarks.visited.has(lm.id));
        const distToNext = nextLm
          ? haversineM(result.lngLat, nextLm.coord)
          : 0;

        updateHUD(result, nextLm, distToNext);

        if (driving.finished && !landmarks.isAllVisited()) {
          // Route ended but not all landmarks visited – show finish anyway
          endGame();
        }
      }
    }

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // Window resize handler
  window.addEventListener('resize', () => {
    map.resize();
  });
}

// ─── End Game ─────────────────────────────────────────────────────────────
function endGame() {
  gameRunning = false;
  if (challengeInterval) clearInterval(challengeInterval);
  const elapsed = (performance.now() - startTime) / 1000;
  showFinish(landmarks.getVisitedCount(), elapsed);
}

// ─── Challenge Mode ────────────────────────────────────────────────────────
function toggleChallenge() {
  challengeActive = !challengeActive;
  const timerEl = document.getElementById('challenge-timer');

  if (challengeActive) {
    challengeTimeLeft = CHALLENGE_DURATION;
    timerEl.style.display = 'flex';
    challengeInterval = setInterval(() => {
      challengeTimeLeft--;
      updateChallengeTimer(challengeTimeLeft);
      if (challengeTimeLeft <= 0) {
        clearInterval(challengeInterval);
        challengeActive = false;
        timerEl.style.display = 'none';
        if (!landmarks.isAllVisited()) {
          alert(`⏱ Time's up! You visited ${landmarks.getVisitedCount()} / 6 landmarks.`);
          endGame();
        }
      }
    }, 1000);
  } else {
    clearInterval(challengeInterval);
    timerEl.style.display = 'none';
  }
}

// Haversine helper (also used in hud next-distance)
function haversineM([lng1, lat1], [lng2, lat2]) {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
