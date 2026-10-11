// src/driving.js
// Advanced vehicle simulation engine supporting:
// 1. True free-roam WASD driving with realistic Ackermann/bicycle kinematics,
//    speed-sensitive steering, reverse gear, and drifting.
// 2. Guided cruise autopilot mode along the Paris tour route.
// 3. Seamless transition between free-roam and guided autopilot.

import { VEHICLES, AUTOPILOT_SPEED } from './config.js';
import { positionAtDist, bearingAtDist, getTotalLength } from './route.js';

export class DrivingState {
  constructor() {
    // Spatial state
    this.coord = [2.29348, 48.859039]; // Current [lng, lat] (starts at Eiffel Tower)
    this.bearing = 45;                  // Heading in degrees (0 = North CW)
    this.speedKmh = 0;                  // Current velocity in km/h (-25 to maxSpeed)
    this.steeringAngle = 0;             // Front wheel steering angle (-30° to +30°)
    this.distKm = 0;                    // Cumulative distance traveled in km

    // Flags
    this.paused = false;
    this.turbo = false;
    this.autopilot = false;
    this.vehicleType = 'car';
    this.finished = false;

    // Dynamics settings multipliers
    this.accelerationMultiplier = 1.0;
    this.steeringSensitivity = 0.5;
    this.carMaxSpeed = VEHICLES.car.maxSpeed;

    // Collision state
    this.lastSafeCoord = [2.29348, 48.859039];
    this.collisionCooldown = 0;
    this.hasCollided = false;

    // User input state
    this._keys = {
      forward: false,
      back: false,
      left: false,
      right: false,
    };
    this.isUserDriving = false; // true when user is pressing WASD or pedals

    this._boundKeyDown = this._onKeyDown.bind(this);
    this._boundKeyUp = this._onKeyUp.bind(this);

    window.addEventListener('keydown', this._boundKeyDown);
    window.addEventListener('keyup', this._boundKeyUp);
  }

  handleCollision() {
    if (this.collisionCooldown > 0) return false;
    const moveDir = this.speedKmh >= 0 ? 1 : -1;
    const currentSpeedMag = Math.abs(this.speedKmh);

    // Push back slightly away from the obstacle along reverse heading
    const pushBackMeters = 1.8;
    const headingRad = (this.bearing * Math.PI) / 180;
    const dx = -moveDir * pushBackMeters * Math.sin(headingRad);
    const dy = -moveDir * pushBackMeters * Math.cos(headingRad);
    const lat = this.lastSafeCoord[1];
    const dLng = dx / (111320 * Math.cos((lat * Math.PI) / 180));
    const dLat = dy / 111320;
    this.coord = [this.lastSafeCoord[0] + dLng, this.lastSafeCoord[1] + dLat];

    // Rebound back with dampening and minimum bounce velocity for clean separation
    const reboundSpeed = Math.max(8, currentSpeedMag * 0.45);
    this.speedKmh = -moveDir * reboundSpeed;
    this.collisionCooldown = 0.45; // cooldown seconds to allow clean separation
    this.hasCollided = true;
    return true;
  }

  _onKeyDown(e) {
    switch (e.code) {
      case 'KeyW': case 'ArrowUp':
        this._keys.forward = true;
        this.autopilot = false; // throttle = manual takeover
        break;
      case 'KeyS': case 'ArrowDown':
        this._keys.back = true;
        this.autopilot = false; // braking = manual takeover
        break;
      case 'KeyA': case 'ArrowLeft':
        this._keys.left = true;
        // NOTE: steering does NOT cancel autopilot — only W/S do
        break;
      case 'KeyD': case 'ArrowRight':
        this._keys.right = true;
        break;
      case 'Space':
        this.paused = !this.paused;
        e.preventDefault();
        break;
      case 'KeyT':
        this.turbo = !this.turbo;
        break;
    }
  }

  _onKeyUp(e) {
    switch (e.code) {
      case 'KeyW': case 'ArrowUp':    this._keys.forward = false; break;
      case 'KeyS': case 'ArrowDown':  this._keys.back = false;    break;
      case 'KeyA': case 'ArrowLeft':  this._keys.left = false;    break;
      case 'KeyD': case 'ArrowRight': this._keys.right = false;   break;
    }
  }

  setForward(pressed) {
    this._keys.forward = !!pressed;
    if (pressed) this.autopilot = false;
  }

  setBack(pressed) {
    this._keys.back = !!pressed;
    if (pressed) this.autopilot = false;
  }

  setLeft(pressed) {
    this._keys.left = !!pressed;
  }

  setRight(pressed) {
    this._keys.right = !!pressed;
  }

  /**
   * Advance simulation by dt seconds.
   * Returns { lngLat, bearing, speedKmh, distKm, progress, steeringAngle, isUserDriving, paused }
   */
  tick(dt) {
    this.isUserDriving = this._keys.forward || this._keys.back || this._keys.left || this._keys.right;

    const spec = VEHICLES[this.vehicleType] || VEHICLES.car;
    const configuredMax = this.vehicleType === 'car' ? this.carMaxSpeed : spec.maxSpeed;
    const maxSpeed = this.turbo
      ? (this.vehicleType === 'car' ? Math.max(configuredMax, Math.round(configuredMax * 1.33)) : spec.turboSpeed)
      : configuredMax;
    const maxReverse = -25;
    const wheelbase = this.vehicleType === 'car' ? 2.7 : 1.4;

    if (!this.paused) {
      if (this.autopilot) {
        // ── Autopilot Guided Tour Mode ──────────────────────────────────────
        const targetSpeed = this.turbo ? spec.turboSpeed : AUTOPILOT_SPEED;
        if (this.speedKmh < targetSpeed) {
          this.speedKmh = Math.min(this.speedKmh + spec.acceleration * dt * 4, targetSpeed);
        } else {
          this.speedKmh = Math.max(this.speedKmh - spec.braking * dt * 2, targetSpeed);
        }

        const distDelta = (this.speedKmh / 3600) * dt;
        this.distKm = Math.min(this.distKm + distDelta, getTotalLength());

        if (this.distKm >= getTotalLength() - 0.001) {
          this.finished = true;
        }

        this.coord = positionAtDist(this.distKm);
        this.bearing = bearingAtDist(this.distKm);
        this.steeringAngle = 0;
      } else {
        if (this.collisionCooldown > 0) {
          this.collisionCooldown -= dt;
        }

        const effectiveAccel = spec.acceleration * (this.accelerationMultiplier || 1.0);

        // ── Free Roam WASD Kinematic Driving ────────────────────────────────
        // 1. Throttle & Braking / Reverse
        if (this._keys.forward) {
          if (this.speedKmh < 0) {
            // Braking while in reverse
            this.speedKmh = Math.min(this.speedKmh + spec.braking * dt * 10, 0);
          } else {
            // Forward acceleration
            this.speedKmh = Math.min(this.speedKmh + effectiveAccel * dt * 8, maxSpeed);
          }
        } else if (this._keys.back) {
          if (this.speedKmh > 1) {
            // Braking from forward motion
            this.speedKmh = Math.max(this.speedKmh - spec.braking * dt * 10, 0);
          } else {
            // Reverse acceleration
            this.speedKmh = Math.max(this.speedKmh - effectiveAccel * dt * 4, maxReverse);
          }
        } else {
          // Rolling friction / drag deceleration
          if (this.speedKmh > 0) {
            this.speedKmh = Math.max(this.speedKmh - spec.braking * dt * 1.5, 0);
          } else if (this.speedKmh < 0) {
            this.speedKmh = Math.min(this.speedKmh + spec.braking * dt * 1.5, 0);
          }
        }

        // 2. Dynamic Speed-Sensitive Steering
        const maxSteerDeg = 32 * (this.steeringSensitivity || 1.0);
        let targetSteer = 0;
        if (this._keys.left) targetSteer -= maxSteerDeg;
        if (this._keys.right) targetSteer += maxSteerDeg;

        // Speed sensitivity: tighter turning at low speed, stable at high speed
        const speedRatio = Math.min(1, Math.abs(this.speedKmh) / 100);
        const steerAtten = 1 - speedRatio * 0.45; // allows 55% steer lock even at 100 km/h
        const effectiveTarget = targetSteer * steerAtten;

        // Smooth steering angle response
        this.steeringAngle += (effectiveTarget - this.steeringAngle) * Math.min(1, dt * 12);

        // 3. Turning physics (Bicycle Model)
        const vMps = (this.speedKmh / 3.6); // speed in m/s
        if (Math.abs(vMps) > 0.05 && Math.abs(this.steeringAngle) > 0.5) {
          const steerRad = (this.steeringAngle * Math.PI) / 180;
          // Angular velocity omega in radians/sec
          const omega = (vMps / wheelbase) * Math.sin(steerRad);
          const dHeadingDeg = (omega * 180 / Math.PI) * dt;
          this.bearing = (this.bearing + dHeadingDeg + 360) % 360;
        }

        // 4. Geographic Position Integration
        const distStepMeters = vMps * dt;
        const bearingRad = (this.bearing * Math.PI) / 180;
        const dxMeters = distStepMeters * Math.sin(bearingRad); // East
        const dyMeters = distStepMeters * Math.cos(bearingRad); // North

        const lat = this.coord[1];
        const dLng = dxMeters / (111320 * Math.cos((lat * Math.PI) / 180));
        const dLat = dyMeters / 111320;

        this.coord = [this.coord[0] + dLng, this.coord[1] + dLat];

        // Increment cumulative distance traveled
        this.distKm += Math.abs(distStepMeters) / 1000;
      }
    } else {
      // While paused
      this.speedKmh = 0;
    }

    const total = getTotalLength();
    const progress = total > 0 ? Math.min(1, this.distKm / total) : 0;

    return {
      lngLat: this.coord,
      bearing: this.bearing,
      speedKmh: this.speedKmh,
      distKm: this.distKm,
      progress,
      steeringAngle: this.steeringAngle,
      isUserDriving: this.isUserDriving,
      paused: this.paused,
    };
  }

  reset(startCoord = [2.29348, 48.859039], startBearing = 45) {
    this.coord = [...startCoord];
    this.bearing = startBearing;
    this.speedKmh = 0;
    this.steeringAngle = 0;
    this.distKm = 0;
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
