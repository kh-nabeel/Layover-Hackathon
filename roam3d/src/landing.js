// src/landing.js
// Controls the landing screen, finish screen, and start-game flow.

export function initLanding(onStart) {
  const landing = document.getElementById('landing-screen');
  let chosenVehicle = 'car';
  let chosenMode = 'free-roam';

  // Vehicle choice buttons
  const btnCar  = document.getElementById('btn-car');
  const btnBike = document.getElementById('btn-bike');

  btnCar.addEventListener('click', () => {
    chosenVehicle = 'car';
    btnCar.classList.add('active');
    btnBike.classList.remove('active');
  });
  btnBike.addEventListener('click', () => {
    chosenVehicle = 'bike';
    btnBike.classList.add('active');
    btnCar.classList.remove('active');
  });

  const modeButtons = [...document.querySelectorAll('.mode-btn')];
  const startButton = document.getElementById('btn-start');
  modeButtons.forEach((button) => button.addEventListener('click', () => {
    chosenMode = button.dataset.mode;
    modeButtons.forEach((item) => item.classList.toggle('active', item === button));
    const labels = { 'free-roam': 'Start Free Roam', race: 'Start Race', 'time-attack': 'Start Time Attack' };
    startButton.querySelector('span').textContent = labels[chosenMode];
  }));

  // Start selected game mode.
  document.getElementById('btn-start').addEventListener('click', () => {
    document.activeElement?.blur();
    hideLanding();
    onStart({ vehicle: chosenVehicle, mode: chosenMode, autopilot: false });
  });

  // Error retry button (now has an id instead of onclick)
  const retryBtn = document.getElementById('btn-error-retry');
  if (retryBtn) retryBtn.addEventListener('click', () => location.reload());

  function hideLanding() {
    landing.style.opacity  = '0';
    landing.style.pointerEvents = 'none';
    setTimeout(() => { landing.style.display = 'none'; }, 700);
  }
}

/** Show the HUD */
export function showHUD() {
  document.getElementById('hud').style.display = 'flex';
}

/** SVG icons for finish screen stats */
const ICON_LANDMARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
const ICON_CLOCK    = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
const ICON_MAP      = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>`;

/** Show the finish screen with stats */
export function showFinish(visitedCount, elapsedSeconds, mode = 'free-roam') {
  document.getElementById('hud').style.display = 'none';
  document.getElementById('landmark-card').style.display = 'none';
  const finish = document.getElementById('finish-screen');
  const mins = Math.floor(elapsedSeconds / 60);
  const secs = Math.floor(elapsedSeconds % 60);
  const modeLabel = mode === 'race' ? 'Race over' : mode === 'time-attack' ? 'Time Attack over' : 'Tour complete';
  document.getElementById('finish-stats').innerHTML = `
    <div class="finish-stat">${ICON_LANDMARK} <strong>${visitedCount} / 6</strong> checkpoints reached</div>
    <div class="finish-stat">${ICON_CLOCK} Time: <strong>${mins}m ${secs}s</strong></div>
    <div class="finish-stat">${ICON_MAP} ${modeLabel}</div>
  `;
  finish.style.display = 'flex';

  document.getElementById('btn-restart').addEventListener('click', () => {
    location.reload();
  }, { once: true });
}
