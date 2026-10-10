// src/hud.js
// HUD update functions: speed, progress bar, next landmark, camera/vehicle buttons.

import { LANDMARKS } from './config.js';
import { getTotalLength, getLandmarkPoints } from './route.js';

let _progressLandmarksRendered = false;

/** Render the progress bar landmark dots (called once after route loads) */
export function initProgressBar() {
  if (_progressLandmarksRendered) return;
  const container = document.getElementById('hud-progress-landmarks');
  const total = getTotalLength();
  const points = getLandmarkPoints();
  container.innerHTML = '';
  points.forEach((p, i) => {
    const dot = document.createElement('div');
    dot.className = 'progress-dot';
    dot.style.left = `${(p.distKm / total) * 100}%`;
    dot.title = LANDMARKS[i]?.name || '';
    dot.dataset.index = i;
    container.appendChild(dot);
  });
  _progressLandmarksRendered = true;
}

/** Update every frame */
export function updateHUD(state, nextLandmark, distToNext) {
  // Speed
  document.getElementById('hud-speed').textContent = Math.round(state.speedKmh);

  // Progress fill
  const fill = document.getElementById('hud-progress-fill');
  fill.style.width = `${state.progress * 100}%`;

  // Next landmark
  if (nextLandmark) {
    document.getElementById('hud-next').textContent = nextLandmark.name;
    document.getElementById('hud-next-dist').textContent =
      distToNext < 1000
        ? `${Math.round(distToNext)} m`
        : `${(distToNext / 1000).toFixed(1)} km`;
  } else {
    document.getElementById('hud-next').textContent = 'Finish!';
    document.getElementById('hud-next-dist').textContent = '';
  }
}

/** Mark a landmark dot as visited */
export function markLandmarkVisited(index) {
  const dot = document.querySelector(`.progress-dot[data-index="${index}"]`);
  if (dot) dot.classList.add('visited');
}

/** Update autopilot button label */
export function updateAutopilotBtn(on) {
  const btn = document.getElementById('btn-autopilot');
  btn.textContent = on ? '🎬 Auto ON' : '🎬 Demo';
  btn.classList.toggle('active', on);
}

/** Update camera button label */
export function updateCamBtn(mode) {
  const btn = document.getElementById('btn-cam');
  if (!btn) return;
  const labels = {
    street: '👁️ Street View',
    chase: '🚗 Chase Cam',
    orbit: '🚁 Drone 3D',
    top: '🗺️ Map View'
  };
  btn.textContent = labels[mode] || '👁️ Street View';
}

/** Update vehicle button label */
export function updateVehicleBtn(type) {
  const btn = document.getElementById('btn-vehicle-switch');
  btn.textContent = type === 'car' ? '🚗 Car' : '🚲 Bike';
}

/** Update challenge timer display */
export function updateChallengeTimer(secondsLeft) {
  const mins = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
  const secs = Math.floor(secondsLeft % 60).toString().padStart(2, '0');
  document.getElementById('challenge-time').textContent = `${mins}:${secs}`;
}
