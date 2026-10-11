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
import { settings } from './settings.js';
import { CheckpointTracker, RaceRivals } from './race.js';
import {
  createHaussmannFacadeTexture,
  createDarkBlueGlassFacadeTexture,
  createCityModernFacadeTexture,
  createHaussmannWarmFacadeTexture,
  createRooftopTexture,
  createZebraCrossingTexture,
  createWaterRippleTexture,
  createSkyTexture
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

let mapInitialized = false;
function setLoadingProgress(value) {
  const fill = document.getElementById('loading-progress-fill');
  const bar = fill?.parentElement;
  if (fill) fill.style.width = `${value}%`;
  if (bar) bar.setAttribute('aria-valuenow', String(value));
}
setLoadingProgress(5);

function finishLoadingAndStart() {
  if (mapInitialized) return;
  mapInitialized = true;
  clearTimeout(tileLoadTimer);
  setLoadingProgress(25);
  onMapLoaded().then(() => {
    setLoadingProgress(100);
    setTimeout(() => {
      if (loadingEl) {
        loadingEl.style.opacity = '0';
        setTimeout(() => { loadingEl.style.display = 'none'; }, 400);
      }
    }, 250);
  });
}

// 1. Primary: map load event
map.on('load', finishLoadingAndStart);

// 2. Secondary: style.load event (fires early when style JSON is parsed)
map.on('style.load', () => {
  setTimeout(finishLoadingAndStart, 1500);
});

// 3. Fallback: never block the user on Loading Paris longer than 3.5 seconds
const tileLoadTimer = setTimeout(finishLoadingAndStart, 3500);

map.on('error', (e) => {
  console.warn('MapLibre error:', e.error);
});

// ─── State ─────────────────────────────────────────────────────────────────
let vehicleLayer = null;
let driving = null;
let camera = null;
let landmarks = null;
let gameRunning = false;
let startTime = 0;
let gameMode = 'free-roam';
let checkpoints = null;
let raceRivals = null;

// Challenge mode
let challengeActive = false;
let challengeTimeLeft = CHALLENGE_DURATION;
let challengeInterval = null;

// ─── Map Loaded ─────────────────────────────────────────────────────────────
async function onMapLoaded() {
  // ── Phase 1: 3D Buildings & Environment ──────────────────────────────────
  try {
    setup3DBuildings();
  } catch (err) {
    console.warn('setup3DBuildings notice:', err);
  }
  setLoadingProgress(60);

  // ── Load route ────────────────────────────────────────────────────────
  try {
    await loadRoute();
    drawRouteOnMap();
  } catch (err) {
    console.warn('Route load notice:', err);
  }
  setLoadingProgress(88);
  // Hold the opaque loader while initial building and raster tiles settle.
  if (!map.loaded()) {
    await new Promise((resolve) => {
      let timeoutId;
      const finish = () => {
        clearTimeout(timeoutId);
        map.off('idle', finish);
        resolve();
      };
      timeoutId = setTimeout(finish, 3000);
      map.once('idle', finish);
    });
  }
  setLoadingProgress(96);

  // ── Landing screen ────────────────────────────────────────────────────
  initLanding(({ vehicle, autopilot, mode }) => {
    startGame(vehicle, autopilot, mode);
  });
}

// ─── Helper: Apply Building Render Distance ────────────────────────────────
function applyBuildingRenderDistance(distMeters) {
  // Keep the base buildings visible at the game's starting zoom. Rooftop
  // layers have their own zoom bands and must not be flattened to one range.
  const minz = Math.max(12.0, Math.min(14.5, 16.2 - (distMeters / 600)));
  const style = map.getStyle();
  if (style && style.layers) {
    const bLayers = style.layers.filter(
      l => l.type === 'fill-extrusion' && !l.id.startsWith('roam3d-rooftop-caps')
    );
    bLayers.forEach(l => {
      try { map.setLayerZoomRange(l.id, minz, 24); } catch (e) {}
    });
  }
  try {
    if (typeof map.setFog === 'function') {
      map.setFog({
        range: [0.5, Math.max(3, distMeters / 140)],
        color: '#dce5ef',
        'horizon-blend': 0.08,
        'high-color': '#a5c8e8',
        'space-color': '#c7ddf0',
      });
    }
  } catch (e) {}
}

// ─── 3D Buildings, Textures & Satellite Environment Setup ──────────────────
function setup3DBuildings() {
  const rooftopPatternAtZoom = (zoom) => [
    'match', ['%', ['abs', ['to-number', ['id'], 0]], 4],
    0, `roof-ac-units-0-z${zoom}`,
    1, `roof-ac-units-1-z${zoom}`,
    2, `roof-ac-units-2-z${zoom}`,
    `roof-ac-units-3-z${zoom}`,
  ];
  // 1. Register high-resolution procedural textures with real-world architectural scaling
  try {
    if (!map.hasImage('facade-glass-blue')) {
      map.addImage('facade-glass-blue', createDarkBlueGlassFacadeTexture(), { pixelRatio: 5 });
    }
    if (!map.hasImage('facade-city-modern')) {
      map.addImage('facade-city-modern', createCityModernFacadeTexture(), { pixelRatio: 5 });
    }
    if (!map.hasImage('facade-haussmann')) {
      map.addImage('facade-haussmann', createHaussmannFacadeTexture(), { pixelRatio: 5 });
    }
    if (!map.hasImage('facade-haussmann-warm')) {
      map.addImage('facade-haussmann-warm', createHaussmannWarmFacadeTexture(), { pixelRatio: 5 });
    }
    if (!map.hasImage('water-seine-ripples')) {
      // River Seine procedural water ripples & wave caustics texture
      map.addImage('water-seine-ripples', createWaterRippleTexture(), { pixelRatio: 2 });
    }
    if (!map.hasImage('crosswalk-zebra')) {
      map.addImage('crosswalk-zebra', createZebraCrossingTexture(), { pixelRatio: 4 });
    }
    // Register seeded roof variants at each zoom level. Fill patterns are
    // pixel-sized by MapLibre; changing pixelRatio by zoom keeps the AC units
    // at a stable size relative to roof geometry as the map zooms.
    const roofTextures = Array.from({ length: 4 }, (_, variant) => createRooftopTexture(variant));
    const ROOF_BASE_ZOOM = 16;
    for (let variant = 0; variant < roofTextures.length; variant++) {
      for (let zoom = 13; zoom <= 22; zoom++) {
        const imageId = `roof-ac-units-${variant}-z${zoom}`;
        if (!map.hasImage(imageId)) {
          const pixelRatio = 2 ** (ROOF_BASE_ZOOM - zoom);
          map.addImage(imageId, roofTextures[variant], { pixelRatio });
        }
      }
    }
  } catch (err) {
    console.warn('Texture registration notice:', err);
  }

  const layers = map.getStyle().layers;

  // Identify building layer ID so all ground, satellite, road, and route layers
  // are guaranteed to be placed BEFORE (underneath) buildings.
  const buildingLayer = layers.find(
    l => l.type === 'fill-extrusion' || (l.type === 'fill' && (l['source-layer'] === 'building' || l.id.includes('building')))
  );
  const buildingBeforeId = buildingLayer ? buildingLayer.id : undefined;

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

    const firstRoad = layers.find(
      l => l['source-layer'] === 'transportation' || l.id.includes('road') || l.id.includes('tunnel')
    );
    const roadBeforeId = firstRoad ? firstRoad.id : buildingBeforeId;

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

  // 3. Seine River Textured Water Layer
  try {
    if (!map.getLayer('roam3d-water-textured')) {
      map.addLayer({
        id: 'roam3d-water-textured',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'water',
        paint: {
          'fill-pattern': 'water-seine-ripples',
          'fill-opacity': 0.95,
        },
      }, buildingBeforeId);
    }
  } catch (e) {
    console.warn('Water texture layer notice:', e);
  }

  // 4. Real-World Scaled Road Surfaces & High-Resolution Textures
  try {
    // A. Major Boulevards & Avenues (Champs-Élysées, Saint-Germain ~20m real width)
    if (!map.getLayer('roam3d-roads-primary')) {
      map.addLayer({
        id: 'roam3d-roads-primary',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: ['in', 'class', 'motorway', 'trunk', 'primary'],
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#181c22',
          'line-width': [
            'interpolate', ['linear'], ['zoom'],
            14, 3.5,
            16, 14,
            17, 28,
            18, 56,
            19, 112,
            20, 224,
          ],
          'line-opacity': 0.98,
        },
      }, buildingBeforeId);
    }

    // B. Secondary Thoroughfares & City Streets (~13m real width)
    if (!map.getLayer('roam3d-roads-secondary')) {
      map.addLayer({
        id: 'roam3d-roads-secondary',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: ['in', 'class', 'secondary', 'tertiary'],
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#1d2128',
          'line-width': [
            'interpolate', ['linear'], ['zoom'],
            14, 2.5,
            16, 9.5,
            17, 19,
            18, 38,
            19, 74,
            20, 148,
          ],
          'line-opacity': 0.96,
        },
      }, buildingBeforeId);
    }

    // C. Minor & Residential Parisian Rues (~8m real width)
    if (!map.getLayer('roam3d-roads-minor')) {
      map.addLayer({
        id: 'roam3d-roads-minor',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: ['!in', 'class', 'motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'rail'],
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#20252d',
          'line-width': [
            'interpolate', ['linear'], ['zoom'],
            14, 1.5,
            16, 5.5,
            17, 11,
            18, 22,
            19, 44,
            20, 88,
          ],
          'line-opacity': 0.94,
        },
      }, buildingBeforeId);
    }

    // D. White Dashed Center Lane Stripes on Boulevards
    if (!map.getLayer('roam3d-roads-lanes')) {
      map.addLayer({
        id: 'roam3d-roads-lanes',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: ['in', 'class', 'motorway', 'trunk', 'primary', 'secondary'],
        paint: {
          'line-color': '#ffffff',
          'line-width': [
            'interpolate', ['linear'], ['zoom'],
            16, 1.2,
            17, 1.8,
            18, 3.2,
            19, 5.8,
            20, 11.2,
          ],
          'line-dasharray': [3, 4],
          'line-opacity': 0.9,
        },
      }, buildingBeforeId);
    }

    // Zebra markings on pedestrian crossings included in the road vector data.
    if (!map.getLayer('roam3d-zebra-crossings')) {
      map.addLayer({
        id: 'roam3d-zebra-crossings',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: ['any', ['==', ['get', 'subclass'], 'crossing'], ['==', ['get', 'class'], 'crossing']],
        layout: { 'line-cap': 'butt', 'line-join': 'miter' },
        paint: {
          'line-pattern': 'crosswalk-zebra',
          'line-width': ['interpolate', ['linear'], ['zoom'], 15, 2, 17, 4, 19, 7],
          'line-opacity': 0.95,
        },
      }, buildingBeforeId);
    }
  } catch (e) {
    console.warn('Road overlays notice:', e);
  }

  // 5. 3D Buildings – Authentic window facades on walls + 3D AC outdoor unit caps on roofs
  try {
    // Window facade textures for building walls (towers get dark blue glass, mid-rise modern, classic Haussmann)
    const buildingPatternExpression = [
      'case',
      ['>', ['coalesce', ['get', 'render_height'], ['get', 'height'], 20], 28], 'facade-glass-blue',
      ['>', ['coalesce', ['get', 'render_height'], ['get', 'height'], 20], 22], 'facade-city-modern',
      ['==', ['%', ['coalesce', ['to-number', ['id']], 0], 2], 0], 'facade-haussmann',
      'facade-haussmann-warm'
    ];

    const existingExtrusionLayer = layers.find(
      l => l.type === 'fill-extrusion' && (l['source-layer'] === 'building' || l.id.includes('building'))
    );

    if (existingExtrusionLayer) {
      map.setPaintProperty(existingExtrusionLayer.id, 'fill-extrusion-pattern', buildingPatternExpression);
      map.setPaintProperty(existingExtrusionLayer.id, 'fill-extrusion-opacity', 1.0);
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
      try { map.setPaintProperty(existingExtrusionLayer.id, 'fill-extrusion-vertical-gradient', true); } catch (e) {}
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
          'fill-extrusion-pattern': buildingPatternExpression,
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
          'fill-extrusion-opacity': 1.0,
          'fill-extrusion-vertical-gradient': true,
        },
      }, beforeId);
    }

    // Dedicated 3D Rooftop Cap layer: Renders the AC outdoor unit texture directly on the roofs
    // Base is 0.2m below roof height, so the top face displays the AC unit texture
    // without repeating it down the sides of the buildings!
    if (map.getLayer('roam3d-rooftop-caps')) {
      map.removeLayer('roam3d-rooftop-caps');
    }
    for (let zoom = 13; zoom <= 22; zoom++) {
      const layerId = `roam3d-rooftop-caps-z${zoom}`;
      if (map.getLayer(layerId)) continue;
      map.addLayer({
        id: layerId,
        type: 'fill-extrusion',
        source: 'openmaptiles',
        'source-layer': 'building',
        minzoom: zoom,
        maxzoom: zoom + 1,
        paint: {
          // The active zoom band selects one pre-sized pattern. Using separate
          // layers avoids mixing camera and feature expressions, which some
          // MapLibre versions reject for resolved image properties.
          'fill-extrusion-pattern': rooftopPatternAtZoom(zoom),
          'fill-extrusion-height': [
            'interpolate', ['linear'], ['zoom'],
            13.5, 0,
            14.5, ['+', ['coalesce', ['get', 'render_height'], ['get', 'height'], 20], 0.08],
          ],
          'fill-extrusion-base': [
            'interpolate', ['linear'], ['zoom'],
            13.5, 0,
            14.5, ['max', 0, ['-', ['coalesce', ['get', 'render_height'], ['get', 'height'], 20], 0.20]],
          ],
          'fill-extrusion-opacity': 0.98,
        },
      });
    }

    // Clean up any old ground-level flat rooftop fill layer
    if (map.getLayer('roam3d-rooftops')) {
      try { map.removeLayer('roam3d-rooftops'); } catch (e) {}
    }
  } catch (e) {
    console.warn('3D Buildings setup notice:', e);
  }

  // Apply initial building render distance setting
  applyBuildingRenderDistance(settings.get('buildingRenderDistance'));

  // 6. Realistic daylight Paris sky & atmospheric horizon for Street View
  try {
    if (typeof map.setSky === 'function') {
      map.setSky({
        'sky-color': '#1a3f8f',
        'horizon-color': '#82bde8',
        'fog-color': '#b9d9f0',
        'atmosphere-blend': 0.92,
        'sky-horizon-blend': 0.5,
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

  const layers = map.getStyle().layers;
  const buildingLayer = layers.find(
    l => l.type === 'fill-extrusion' || (l.type === 'fill' && (l['source-layer'] === 'building' || l.id.includes('building')))
  );
  const buildingBeforeId = buildingLayer ? buildingLayer.id : undefined;

  // Route outline (glow)
  if (!map.getLayer('route-glow')) {
    map.addLayer({
      id: 'route-glow',
      type: 'line',
      source: 'route',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': '#0288d1',
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          14, 6,
          16, 12,
          18, 24,
          20, 48,
        ],
        'line-opacity': 0.35,
        'line-blur': 3,
      },
    }, buildingBeforeId);
  }

  // Route main line
  if (!map.getLayer('route-line')) {
    map.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': '#00e5ff',
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          14, 2.5,
          16, 6,
          18, 12,
          20, 24,
        ],
        'line-opacity': 0.9,
      },
    }, buildingBeforeId);
  }
}

// ─── Start Game ────────────────────────────────────────────────────────────
function startGame(vehicleType, autopilotMode, selectedMode = 'free-roam') {
  showHUD();
  gameRunning = true;
  startTime = performance.now();
  gameMode = selectedMode;
  checkpoints = new CheckpointTracker();

  // Driving state
  driving = new DrivingState();
  driving.vehicleType = vehicleType;
  driving.autopilot = autopilotMode;
  driving.accelerationMultiplier = (settings.get('carAcceleration') || 14) / 14;
  driving.carMaxSpeed = settings.get('carMaxSpeed') || VEHICLES.car.maxSpeed;
  driving.steeringSensitivity = settings.get('steeringSensitivity') ?? 0.5;

  // Camera
  camera = new CameraController(map);

  // Vehicle layer: added directly on top of all map & road layers
  vehicleLayer = new VehicleLayer();
  map.addLayer(vehicleLayer);
  vehicleLayer.setVehicleType(vehicleType);

  const routeLine = getRouteLine();
  if (routeLine && vehicleLayer.propsManager) {
    vehicleLayer.propsManager.loadRouteProps(routeLine);
  }

  // Sync initial props settings
  ['streetLights', 'benches', 'trees', 'fire'].forEach(prop => {
    vehicleLayer.updateProps(`${prop}Enabled`, settings.get(`${prop}Enabled`), settings.state);
  });
  vehicleLayer.setHeadlights(settings.get('headlights'));

  // Landmarks
  landmarks = new LandmarkManager(map);
  landmarks.onVisit((lm, count) => {
    const idx = LANDMARKS.findIndex(l => l.id === lm.id);
    markLandmarkVisited(idx);
  });

  if (gameMode === 'race') raceRivals = new RaceRivals(vehicleLayer, vehicleType);
  const challengeButton = document.getElementById('btn-challenge');
  if (challengeButton) challengeButton.style.display = 'none';
  const timerEl = document.getElementById('challenge-timer');
  if (gameMode === 'time-attack') {
    challengeTimeLeft = CHALLENGE_DURATION;
    timerEl.style.display = 'flex';
    updateChallengeTimer(challengeTimeLeft);
    challengeInterval = setInterval(() => {
      challengeTimeLeft--;
      updateChallengeTimer(challengeTimeLeft);
      if (challengeTimeLeft <= 0) endGame();
    }, 1000);
  }

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

  // ─── Wire up HUD Buttons ──────────────────────────────────────────────────
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

  // ─── Toggle All Writings & Landmarks On/Off ───────────────────────────────
  const btnLandmarks = document.getElementById('btn-landmarks');
  function toggleAllWritings() {
    const visible = landmarks.toggleVisible();
    try {
      const style = map.getStyle();
      if (style && style.layers) {
        style.layers.forEach(l => {
          if (l.type === 'symbol') {
            map.setLayoutProperty(l.id, 'visibility', visible ? 'visible' : 'none');
          }
        });
      }
    } catch (e) {}

    const hudLm = document.getElementById('hud-landmark-block');
    if (hudLm) {
      hudLm.style.opacity = visible ? '1' : '0';
    }

    if (btnLandmarks) {
      btnLandmarks.classList.toggle('active', visible);
      const span = btnLandmarks.querySelector('span');
      if (span) span.textContent = visible ? 'Landmarks' : 'Labels Off';
    }
    return visible;
  }

  if (btnLandmarks) {
    btnLandmarks.addEventListener('click', toggleAllWritings);
  }

  // ─── Headlights Toggle ────────────────────────────────────────────────────
  let headlightsOn = settings.get('headlights');
  const btnHeadlights = document.getElementById('btn-headlights');
  function toggleHeadlights() {
    headlightsOn = !headlightsOn;
    settings.set('headlights', headlightsOn);
    if (vehicleLayer) vehicleLayer.setHeadlights(headlightsOn);
    if (btnHeadlights) btnHeadlights.classList.toggle('active', headlightsOn);
  }
  if (btnHeadlights) {
    btnHeadlights.classList.toggle('active', headlightsOn);
    btnHeadlights.addEventListener('click', toggleHeadlights);
  }

  // ─── Settings Modal Wiring ────────────────────────────────────────────────
  const settingsModal = document.getElementById('settings-modal');
  const btnSettings = document.getElementById('btn-settings');
  const btnSettingsClose = document.getElementById('btn-settings-close');
  const btnSettingsDone = document.getElementById('btn-settings-done');
  const btnSettingsReset = document.getElementById('btn-settings-reset');

  function openSettings() {
    if (settingsModal) settingsModal.style.display = 'flex';
  }
  function closeSettings() {
    if (settingsModal) settingsModal.style.display = 'none';
  }

  if (btnSettings) btnSettings.addEventListener('click', openSettings);
  if (btnSettingsClose) btnSettingsClose.addEventListener('click', closeSettings);
  if (btnSettingsDone) btnSettingsDone.addEventListener('click', closeSettings);
  document.querySelector('.settings-backdrop')?.addEventListener('click', closeSettings);

  // Sync settings inputs with current state
  function syncSettingsUI() {
    const s = settings.state;
    // Lights
    const tLights = document.getElementById('setting-lights-toggle');
    const cLights = document.getElementById('setting-lights-count');
    if (tLights) tLights.checked = s.streetLightsEnabled;
    if (cLights) { cLights.value = s.streetLightsCount; document.getElementById('val-lights-count').textContent = s.streetLightsCount; }
    // Benches
    const tBenches = document.getElementById('setting-benches-toggle');
    const cBenches = document.getElementById('setting-benches-count');
    if (tBenches) tBenches.checked = s.benchesEnabled;
    if (cBenches) { cBenches.value = s.benchesCount; document.getElementById('val-benches-count').textContent = s.benchesCount; }
    // Trees
    const tTrees = document.getElementById('setting-trees-toggle');
    const cTrees = document.getElementById('setting-trees-count');
    if (tTrees) tTrees.checked = s.treesEnabled;
    if (cTrees) { cTrees.value = s.treesCount; document.getElementById('val-trees-count').textContent = s.treesCount; }
    // Fire
    const tFire = document.getElementById('setting-fire-toggle');
    const cFire = document.getElementById('setting-fire-count');
    if (tFire) tFire.checked = s.fireEnabled;
    if (cFire) { cFire.value = s.fireCount; document.getElementById('val-fire-count').textContent = s.fireCount; }
    // Render dist
    const rDist = document.getElementById('setting-render-dist');
    if (rDist) { rDist.value = s.buildingRenderDistance; document.getElementById('val-render-dist').textContent = `${s.buildingRenderDistance} m`; }
    // Accel & Steering
    const cAccel = document.getElementById('setting-car-accel');
    if (cAccel) { cAccel.value = s.carAcceleration; document.getElementById('val-car-accel').textContent = `${s.carAcceleration} m/s²`; }
    const carMaxSpeed = document.getElementById('setting-car-max-speed');
    if (carMaxSpeed) {
      carMaxSpeed.value = s.carMaxSpeed;
      document.getElementById('val-car-max-speed').textContent = `${s.carMaxSpeed} km/h`;
    }
    const sSens = document.getElementById('setting-steering-sens');
    if (sSens) { sSens.value = s.steeringSensitivity; document.getElementById('val-steering-sens').textContent = `${s.steeringSensitivity}x`; }
  }
  syncSettingsUI();

  // Settings Input Listeners
  document.getElementById('setting-lights-toggle')?.addEventListener('change', (e) => {
    settings.set('streetLightsEnabled', e.target.checked);
    vehicleLayer.updateProps('streetLightsEnabled', e.target.checked, settings.state);
  });
  document.getElementById('setting-lights-count')?.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    document.getElementById('val-lights-count').textContent = val;
    settings.set('streetLightsCount', val);
    vehicleLayer.updateProps('streetLightsCount', val, settings.state);
  });

  document.getElementById('setting-benches-toggle')?.addEventListener('change', (e) => {
    settings.set('benchesEnabled', e.target.checked);
    vehicleLayer.updateProps('benchesEnabled', e.target.checked, settings.state);
  });
  document.getElementById('setting-benches-count')?.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    document.getElementById('val-benches-count').textContent = val;
    settings.set('benchesCount', val);
    vehicleLayer.updateProps('benchesCount', val, settings.state);
  });

  document.getElementById('setting-trees-toggle')?.addEventListener('change', (e) => {
    settings.set('treesEnabled', e.target.checked);
    vehicleLayer.updateProps('treesEnabled', e.target.checked, settings.state);
  });
  document.getElementById('setting-trees-count')?.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    document.getElementById('val-trees-count').textContent = val;
    settings.set('treesCount', val);
    vehicleLayer.updateProps('treesCount', val, settings.state);
  });

  document.getElementById('setting-fire-toggle')?.addEventListener('change', (e) => {
    settings.set('fireEnabled', e.target.checked);
    vehicleLayer.updateProps('fireEnabled', e.target.checked, settings.state);
  });
  document.getElementById('setting-fire-count')?.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    document.getElementById('val-fire-count').textContent = val;
    settings.set('fireCount', val);
    vehicleLayer.updateProps('fireCount', val, settings.state);
  });

  document.getElementById('setting-render-dist')?.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    document.getElementById('val-render-dist').textContent = `${val} m`;
    settings.set('buildingRenderDistance', val);
    applyBuildingRenderDistance(val);
  });

  document.getElementById('setting-car-accel')?.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    document.getElementById('val-car-accel').textContent = `${val} m/s²`;
    settings.set('carAcceleration', val);
    driving.accelerationMultiplier = val / 14;
  });

  document.getElementById('setting-car-max-speed')?.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    document.getElementById('val-car-max-speed').textContent = `${val} km/h`;
    settings.set('carMaxSpeed', val);
    driving.carMaxSpeed = val;
  });

  document.getElementById('setting-steering-sens')?.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    document.getElementById('val-steering-sens').textContent = `${val.toFixed(1)}x`;
    settings.set('steeringSensitivity', val);
    driving.steeringSensitivity = val;
  });

  if (btnSettingsReset) {
    btnSettingsReset.addEventListener('click', () => {
      localStorage.removeItem('roam3d_settings');
      location.reload();
    });
  }

  document.getElementById('btn-vehicle-switch').addEventListener('click', () => {
    driving.vehicleType = driving.vehicleType === 'car' ? 'bike' : 'car';
    vehicleLayer.setVehicleType(driving.vehicleType);
    updateVehicleBtn(driving.vehicleType);
  });
  document.getElementById('btn-challenge').addEventListener('click', toggleChallenge);

  // Shortcut keys (V = vehicle, C = camera, P = autopilot, L = landmarks, H = headlights, O = settings)
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
    if (e.code === 'KeyL') {
      toggleAllWritings();
    }
    if (e.code === 'KeyH') {
      toggleHeadlights();
    }
    if (e.code === 'KeyO') {
      if (settingsModal.style.display === 'flex') closeSettings();
      else openSettings();
    }
  });

  // Update button states
  updateAutopilotBtn(autopilotMode);
  updateCamBtn('street');
  updateVehicleBtn(vehicleType);

  // Wire on-screen gas and brake pedals
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
      const span = btnSat.querySelector('span');
      if (span) span.textContent = satActive ? 'Satellite' : 'Map';
    });
  }

  // Tab visibility: pause when hidden, resume when visible
  document.addEventListener('visibilitychange', () => {
    driving.paused = document.hidden;
  });

  // ─── Start Game Loop ──────────────────────────────────────────────────────
  let lastTs = performance.now();
  function loop(ts) {
    if (!gameRunning) return;
    const dt = Math.min((ts - lastTs) / 1000, 0.1); // cap at 100ms
    lastTs = ts;

    if (!document.hidden) {
      const result = driving.tick(dt);
      if (result) {
        // ─── 3D Building Collision Detection ────────────────────────────────
        // Building collision checks are disabled for the hackathon demo.

        // Update vehicle layer position and front wheel steering
        vehicleLayer.setPosition(result.lngLat, result.bearing);
        vehicleLayer.setSteering(result.steeringAngle);

        // Update camera (with auto-realignment when user drives with WASD!)
        camera.update(result.lngLat, result.bearing, dt, result.isUserDriving, result.speedKmh);

        // Check landmarks
        landmarks.check(result.lngLat);

        if (gameMode !== 'free-roam' && checkpoints.update(result.lngLat) && checkpoints.complete) {
          endGame();
        }
        if (gameMode === 'race' && raceRivals?.update(dt)) {
          endGame();
        }

        const nextLm = gameMode !== 'free-roam'
          ? checkpoints.next
          : LANDMARKS.find(lm => !landmarks.visited.has(lm.id));
        const distToNext = nextLm
          ? haversineM(result.lngLat, nextLm.coord)
          : 0;

        updateHUD(result, nextLm, distToNext);

        if (driving.finished && gameMode !== 'free-roam') {
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
  if (!gameRunning) return;
  gameRunning = false;
  if (challengeInterval) clearInterval(challengeInterval);
  const timerEl = document.getElementById('challenge-timer');
  if (timerEl) timerEl.style.display = 'none';
  raceRivals?.destroy();
  raceRivals = null;
  const elapsed = (performance.now() - startTime) / 1000;
  const count = gameMode === 'free-roam' ? landmarks.getVisitedCount() : checkpoints.index;
  showFinish(count, elapsed, gameMode);
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
