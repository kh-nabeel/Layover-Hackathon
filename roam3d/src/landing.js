// src/landing.js
// Controls the landing screen, finish screen, and start-game flow.

export function initLanding(onStart) {
  const landing = document.getElementById('landing-screen');
  let chosenVehicle = 'car';

  // Vehicle choice buttons
  const btnCar = document.getElementById('btn-car');
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

  // Start drive button
  document.getElementById('btn-start').addEventListener('click', () => {
    document.activeElement?.blur();
    hideLanding();
    onStart({ vehicle: chosenVehicle, autopilot: false });
  });

  // Demo mode button
  document.getElementById('btn-autopilot-start').addEventListener('click', () => {
    document.activeElement?.blur();
    hideLanding();
    onStart({ vehicle: chosenVehicle, autopilot: true });
  });

  function hideLanding() {
    landing.style.opacity = '0';
    landing.style.pointerEvents = 'none';
    setTimeout(() => { landing.style.display = 'none'; }, 600);
  }
}

/** Show the HUD */
export function showHUD() {
  document.getElementById('hud').style.display = 'flex';
}

/** Show the finish screen with stats */
export function showFinish(visitedCount, elapsedSeconds) {
  document.getElementById('hud').style.display = 'none';
  document.getElementById('landmark-card').style.display = 'none';
  const finish = document.getElementById('finish-screen');
  const mins = Math.floor(elapsedSeconds / 60);
  const secs = Math.floor(elapsedSeconds % 60);
  document.getElementById('finish-stats').innerHTML = `
    <div class="finish-stat">🏛️ <strong>${visitedCount} / 6</strong> landmarks visited</div>
    <div class="finish-stat">⏱ Time: <strong>${mins}m ${secs}s</strong></div>
    <div class="finish-stat">🗺️ Full Paris tour complete</div>
  `;
  finish.style.display = 'flex';

  document.getElementById('btn-restart').addEventListener('click', () => {
    location.reload();
  }, { once: true });
}
