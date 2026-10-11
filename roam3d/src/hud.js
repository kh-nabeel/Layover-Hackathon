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

// SVG snippets for camera mode labels (inline, monochromatic)
const CAM_SVGS = {
  street: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`,
  chase:  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2l2-3h10l2 3h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/><circle cx="7.5" cy="17" r="2.5"/><circle cx="16.5" cy="17" r="2.5"/></svg>`,
  orbit:  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`,
  top:    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>`,
};
const CAM_LABELS = {
  street: 'Street View',
  chase:  'Chase Cam',
  orbit:  'Drone 3D',
  top:    'Map View',
};

/** Update autopilot button label */
export function updateAutopilotBtn(on) {
  const btn = document.getElementById('btn-autopilot');
  const playIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
  const pauseIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;
  btn.innerHTML = `${on ? pauseIcon : playIcon}<span>${on ? 'Auto ON' : 'Demo'}</span>`;
  btn.classList.toggle('active', on);
}

/** Update camera button label */
export function updateCamBtn(mode) {
  const btn = document.getElementById('btn-cam');
  if (!btn) return;
  const svg = CAM_SVGS[mode] || CAM_SVGS.street;
  const label = CAM_LABELS[mode] || 'Street View';
  btn.innerHTML = `${svg}<span>${label}</span>`;
}

/** Update vehicle button label */
export function updateVehicleBtn(type) {
  const btn = document.getElementById('btn-vehicle-switch');
  const carIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2l2-3h10l2 3h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/><circle cx="7.5" cy="17" r="2.5"/><circle cx="16.5" cy="17" r="2.5"/></svg>`;
  const bikeIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><circle cx="5" cy="17" r="3"/><circle cx="19" cy="17" r="3"/><path d="M5 17l4-7h5l5 7M9 10l-2-3h3m2 3 2-3h3M9 13h6"/></svg>`;
  const label = type === 'car' ? 'Car' : 'Motorcycle';
  btn.innerHTML = `${type === 'car' ? carIcon : bikeIcon}<span>${label}</span>`;
}

/** Update challenge timer display */
export function updateChallengeTimer(secondsLeft) {
  const mins = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
  const secs = Math.floor(secondsLeft % 60).toString().padStart(2, '0');
  document.getElementById('challenge-time').textContent = `${mins}:${secs}`;
}
