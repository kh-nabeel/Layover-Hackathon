// src/camera.js
// Advanced 3D camera controller supporting:
// 1. Vehicle-centered 360° orbit rotation via mouse drag (left, middle, right) & trackpad 2-finger gesture.
// 2. Smooth zoom in/out via mouse scroll wheel & trackpad pinch gesture.
// 3. Dynamic camera modes: Street View (cockpit/first-person), Chase Cam, Drone 3D, Map View.
// 4. Automatic camera realignment: when the user drives with WASD, the camera smoothly
//    springs back from manual rotation to follow directly behind the vehicle.

export const CAM_MODES = ['street', 'chase', 'orbit', 'top'];

// Offset geographic coordinates by distance (meters) along a bearing
function offsetLngLat([lng, lat], bearingDeg, distM) {
  if (distM === 0) return [lng, lat];
  const rad = (bearingDeg * Math.PI) / 180;
  const dLat = (distM * Math.cos(rad)) / 111320;
  const dLng = (distM * Math.sin(rad)) / (111320 * Math.cos((lat * Math.PI) / 180));
  return [lng + dLng, lat + dLat];
}

// Shortest signed angle between two bearings to prevent 359° -> 0° spin
function shortestAngle(from, to) {
  return ((to - from) % 360 + 540) % 360 - 180;
}

export class CameraController {
  constructor(map) {
    this.map = map;
    this.modeIndex = 0; // 'street' view is default!

    // Base smooth properties
    this._smoothBearing = 0;
    this._smoothPitch = 83;
    this.currentZoom = 19.3;
    this._isFlying = false;

    // Manual user orbit offsets (vehicle remains anchored at center)
    this.userOrbitYaw = 0;     // degrees relative to vehicle heading
    this.userOrbitPitch = 0;   // degrees relative to default pitch
    this.isDragging = false;
    this._lastMouseX = 0;
    this._lastMouseY = 0;

    // Touch gesture tracking
    this._touchStartDist = 0;

    this._bindControls();
  }

  _bindControls() {
    const canvas = this.map.getCanvasContainer() || this.map.getCanvas();

    // Disable MapLibre default drag handlers that pan center away from vehicle
    if (this.map.dragPan) this.map.dragPan.disable();
    if (this.map.dragRotate) this.map.dragRotate.disable();
    if (this.map.scrollZoom) this.map.scrollZoom.disable();
    if (this.map.doubleClickZoom) this.map.doubleClickZoom.disable();
    if (this.map.touchZoomRotate) this.map.touchZoomRotate.disable();

    // ── Mouse Drag to Orbit ───────────────────────────────────────────────
    canvas.addEventListener('mousedown', (e) => {
      // Middle button (1), Right button (2), or Left button (0)
      this.isDragging = true;
      this._lastMouseX = e.clientX;
      this._lastMouseY = e.clientY;
      if (e.button === 1 || e.button === 2) e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this._lastMouseX;
      const dy = e.clientY - this._lastMouseY;
      this._lastMouseX = e.clientX;
      this._lastMouseY = e.clientY;

      // Orbit yaw and pitch sensitivity
      this.userOrbitYaw += dx * 0.35;
      this.userOrbitPitch -= dy * 0.25;

      // Clamp total pitch
      const targetPitch = this._smoothPitch + this.userOrbitPitch;
      if (targetPitch > 85) this.userOrbitPitch = 85 - this._smoothPitch;
      if (targetPitch < 15) this.userOrbitPitch = 15 - this._smoothPitch;
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // ── Mouse Wheel & Trackpad Pinch/Scroll to Zoom ────────────────────────
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();

      if (e.ctrlKey) {
        // Trackpad pinch zoom
        const zoomDelta = -e.deltaY * 0.02;
        this.currentZoom = Math.max(15.5, Math.min(20.3, this.currentZoom + zoomDelta));
      } else if (Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.5) {
        // Trackpad two-finger horizontal swipe rotates view
        this.userOrbitYaw += e.deltaX * 0.25;
      } else {
        // Standard mouse scroll wheel zoom
        const zoomDelta = -e.deltaY * 0.003;
        this.currentZoom = Math.max(15.5, Math.min(20.3, this.currentZoom + zoomDelta));
      }
    }, { passive: false });

    // ── Touch Events (Mobile & Trackpad Multi-Touch) ───────────────────────
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this._lastMouseX = e.touches[0].clientX;
        this._lastMouseY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        this.isDragging = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        this._touchStartDist = Math.sqrt(dx * dx + dy * dy);
      }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && this.isDragging) {
        const dx = e.touches[0].clientX - this._lastMouseX;
        const dy = e.touches[0].clientY - this._lastMouseY;
        this._lastMouseX = e.touches[0].clientX;
        this._lastMouseY = e.touches[0].clientY;

        this.userOrbitYaw += dx * 0.35;
        this.userOrbitPitch -= dy * 0.25;
      } else if (e.touches.length === 2) {
        // Two-finger pinch zoom & rotate
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (this._touchStartDist > 0) {
          const delta = (dist - this._touchStartDist) * 0.01;
          this.currentZoom = Math.max(15.5, Math.min(20.3, this.currentZoom + delta));
        }
        this._touchStartDist = dist;
      }
    }, { passive: true });

    canvas.addEventListener('touchend', () => {
      this.isDragging = false;
      this._touchStartDist = 0;
    });
  }

  /** Cycle to next camera mode */
  nextMode() {
    this.modeIndex = (this.modeIndex + 1) % CAM_MODES.length;
    this.userOrbitYaw = 0;
    this.userOrbitPitch = 0;

    switch (this.mode) {
      case 'street': this.currentZoom = 19.3; break;
      case 'chase':  this.currentZoom = 18.2; break;
      case 'orbit':  this.currentZoom = 17.0; break;
      case 'top':    this.currentZoom = 15.5; break;
    }
    return CAM_MODES[this.modeIndex];
  }

  get mode() { return CAM_MODES[this.modeIndex]; }

  /**
   * Called every frame to position the camera.
   * @param {number[]} lngLat        vehicle position [lng, lat]
   * @param {number}   bearing       road heading (degrees CW from North)
   * @param {number}   dt            frame delta (seconds)
   * @param {boolean}  isUserDriving true if user is actively driving with WASD
   * @param {number}   speedKmh     current vehicle speed in km/h
   */
  update(lngLat, bearing, dt, isUserDriving = false, speedKmh = 0) {
    if (this._isFlying || !lngLat) return;

    // Track speed for dynamic look-ahead
    this._lastSpeed = speedKmh;

    // ── Requirement 6: Smoothly realign camera when user drives with WASD ──
    if (isUserDriving && !this.isDragging) {
      const realignRate = Math.min(1, dt * 3.5);
      this.userOrbitYaw += (0 - this.userOrbitYaw) * realignRate;
      this.userOrbitPitch += (0 - this.userOrbitPitch) * realignRate;
    }

    // Smooth base bearing lerp
    const delta = shortestAngle(this._smoothBearing, bearing);
    const alpha = Math.min(1, dt * 5.0);
    this._smoothBearing += delta * alpha;

    // Compute effective bearing and pitch with manual orbit offsets
    const finalBearing = (this._smoothBearing + this.userOrbitYaw + 360) % 360;

    switch (this.mode) {
      case 'street': {
        // True Street View: camera at eye-level looking down the avenue
        this._smoothPitch += (83 - this._smoothPitch) * alpha;
        const finalPitch = Math.max(15, Math.min(85, this._smoothPitch + this.userOrbitPitch));
        // Speed-responsive look-ahead: further down the road at higher speed
        const speedFactor = this._lastSpeed ? Math.min(1, this._lastSpeed / 60) : 0;
        const baseLookAhead = 14 + speedFactor * 10; // 14m standing, 24m at 60km/h
        const lookAheadM = (Math.abs(this.userOrbitYaw) < 30) ? baseLookAhead : 0;
        const targetCenter = offsetLngLat(lngLat, this._smoothBearing, lookAheadM);

        this.map.jumpTo({
          center: targetCenter,
          bearing: finalBearing,
          pitch: finalPitch,
          zoom: this.currentZoom,
        });
        break;
      }

      case 'chase': {
        // Third-person vehicle chase view
        this._smoothPitch += (76 - this._smoothPitch) * alpha;
        const finalPitch = Math.max(15, Math.min(85, this._smoothPitch + this.userOrbitPitch));
        const lookAheadM = (Math.abs(this.userOrbitYaw) < 30) ? 8 : 0;
        const targetCenter = offsetLngLat(lngLat, this._smoothBearing, lookAheadM);

        this.map.jumpTo({
          center: targetCenter,
          bearing: finalBearing,
          pitch: finalPitch,
          zoom: this.currentZoom,
        });
        break;
      }

      case 'orbit': {
        // Elevated cinematic 3D drone camera
        this._smoothPitch += (60 - this._smoothPitch) * alpha;
        const finalPitch = Math.max(15, Math.min(85, this._smoothPitch + this.userOrbitPitch));

        this.map.jumpTo({
          center: lngLat,
          bearing: finalBearing,
          pitch: finalPitch,
          zoom: this.currentZoom,
        });
        break;
      }

      case 'top': {
        // Top-down satellite view
        this._smoothPitch += (0 - this._smoothPitch) * alpha;

        this.map.jumpTo({
          center: lngLat,
          bearing: this.userOrbitYaw,
          pitch: 0,
          zoom: this.currentZoom,
        });
        break;
      }
    }
  }

  /** Fly from overview to start position for the intro touchdown */
  flyToStart(lngLat, bearing = 0, onComplete) {
    this._isFlying = true;
    this._smoothBearing = bearing;
    this._smoothPitch = 83;
    this.currentZoom = 19.3;
    this.userOrbitYaw = 0;
    this.userOrbitPitch = 0;

    const targetCenter = offsetLngLat(lngLat, bearing, 14);
    this.map.flyTo({
      center: targetCenter,
      zoom: 19.3,
      pitch: 83,
      bearing: bearing,
      duration: 2500,
      essential: true,
    });
    setTimeout(() => {
      this._isFlying = false;
      if (onComplete) onComplete();
    }, 2600);
  }
}
