// src/driving.js
// Manages vehicle state: position along route, speed, input, autopilot.

import { VEHICLES, AUTOPILOT_SPEED } from './config.js';
import { positionAtDist, bearingAtDist, getTotalLength } from './route.js';

export class DrivingState {
  constructor() {
    this.distKm = 0;          // current distance along route (km)
    this.speedKmh = 0;        // current speed (km/h)
    this.paused = false;
    this.turbo = false;
    this.autopilot = false;
    this.vehicleType = 'car';
    this.finished = false;

    // Keyboard state
    this._keys = { forward: false, back: false };
    this._boundKeyDown = this._onKeyDown.bind(this);
    this._boundKeyUp = this._onKeyUp.bind(this);

    window.addEventListener('keydown', this._boundKeyDown);
    window.addEventListener('keyup', this._boundKeyUp);
  }

  _onKeyDown(e) {
    switch (e.code) {
      case 'KeyW': case 'ArrowUp':    this._keys.forward = true; break;
      case 'KeyS': case 'ArrowDown':  this._keys.back = true;    break;
      case 'Space': this.paused = !this.paused; e.preventDefault(); break;
      case 'KeyT': this.turbo = !this.turbo; break;
      case 'KeyA': this.autopilot = !this.autopilot; break;
    }
  }

  _onKeyUp(e) {
    switch (e.code) {
      case 'KeyW': case 'ArrowUp':   this._keys.forward = false; break;
      case 'KeyS': case 'ArrowDown': this._keys.back = false;    break;
    }
  }

  setForward(pressed) {
    this._keys.forward = !!pressed;
  }

  setBack(pressed) {
    this._keys.back = !!pressed;
  }

  /**
   * Advance simulation by dt seconds.
   * Returns { lngLat, bearing, speedKmh, distKm, progress, paused }
   */
  tick(dt) {
    if (this.finished) {
      const lngLat = positionAtDist(this.distKm);
      const bearing = bearingAtDist(this.distKm);
      return { lngLat, bearing, speedKmh: 0, distKm: this.distKm, progress: 1, finished: true, paused: this.paused };
    }

    const spec = VEHICLES[this.vehicleType] || VEHICLES.car;
    const maxSpeed = this.turbo ? spec.turboSpeed : spec.maxSpeed;

    if (!this.paused) {
      if (this.autopilot) {
        // Cruise at autopilot speed (turbo or max, whichever is bigger)
        const targetSpeed = this.turbo ? spec.turboSpeed : AUTOPILOT_SPEED;
        if (this.speedKmh < targetSpeed) {
          this.speedKmh = Math.min(this.speedKmh + spec.acceleration * dt * 4, targetSpeed);
        } else {
          this.speedKmh = Math.max(this.speedKmh - spec.braking * dt * 2, targetSpeed);
        }
      } else {
        if (this._keys.forward) {
          this.speedKmh = Math.min(this.speedKmh + spec.acceleration * dt * 8, maxSpeed);
        } else if (this._keys.back) {
          this.speedKmh = Math.max(this.speedKmh - spec.braking * dt * 8, 0);
        } else {
          // Friction / rolling deceleration
          this.speedKmh = Math.max(this.speedKmh - spec.braking * dt * 1.5, 0);
        }
      }

      // Convert speed to distance increment: km/h × h = km
      const distDelta = (this.speedKmh / 3600) * dt; // in km
      this.distKm = Math.min(this.distKm + distDelta, getTotalLength());

      if (this.distKm >= getTotalLength() - 0.001) {
        this.finished = true;
      }
    } else {
      this.speedKmh = 0;
    }

    const lngLat = positionAtDist(this.distKm);
    const bearing = bearingAtDist(this.distKm);
    const total = getTotalLength();
    const progress = total > 0 ? this.distKm / total : 0;

    return { lngLat, bearing, speedKmh: this.speedKmh, distKm: this.distKm, progress, paused: this.paused };
  }

  reset() {
    this.distKm = 0;
    this.speedKmh = 0;
    this.paused = false;
    this.turbo = false;
    this.autopilot = false;
    this.finished = false;
  }

  destroy() {
    window.removeEventListener('keydown', this._boundKeyDown);
    window.removeEventListener('keyup', this._boundKeyUp);
  }
}
