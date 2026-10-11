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

/** Update Day / Night cycle button label & icon */
export function updateDayNightBtn(mode) {
  const btn = document.getElementById('btn-daynight');
  if (!btn) return;
  const label = document.getElementById('label-daynight');
  const sunSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
  const sunsetSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M12 10V2"/><path d="m4.93 10.93 1.41-1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41-1.41"/><path d="M22 22H2"/><path d="m16 6-4 4-4-4"/><path d="M16 18a4 4 0 0 0-8 0"/></svg>`;
  const moonSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;
  const cycleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>`;

  let svg = sunSvg;
  let text = 'Day';
  if (mode === 'day') {
    svg = sunSvg;
    text = 'Day';
    btn.classList.remove('active');
  } else if (mode === 'sunset') {
    svg = sunsetSvg;
    text = 'Sunset';
    btn.classList.add('active');
  } else if (mode === 'night') {
    svg = moonSvg;
    text = 'Night';
    btn.classList.add('active');
  } else {
    svg = cycleSvg;
    text = 'Cycle';
    btn.classList.add('active');
  }
  btn.innerHTML = `${svg}<span>${text}</span>`;
}
