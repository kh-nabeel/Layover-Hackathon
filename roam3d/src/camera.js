// src/camera.js
// Camera controller supporting:
// 1. Street View (Cockpit / First-person street level down the avenue)
// 2. Chase Cam (Close 3D follow cam behind the vehicle)
// 3. Drone 3D (Elevated cinematic aerial view)
// 4. Map View (Top-down navigation satellite view)

export const CAM_MODES = ['street', 'chase', 'orbit', 'top'];

// Offset geographic coordinates by distance along a bearing
function offsetLngLat([lng, lat], bearingDeg, distM) {
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
    this._smoothBearing = 0;
    this._smoothPitch = 83;
    this._isFlying = false;
  }

  /** Cycle to next camera mode */
  nextMode() {
    this.modeIndex = (this.modeIndex + 1) % CAM_MODES.length;
    return CAM_MODES[this.modeIndex];
  }

  get mode() { return CAM_MODES[this.modeIndex]; }

  /**
   * Called every frame to position the camera.
   * @param {number[]} lngLat  vehicle position [lng, lat]
   * @param {number}   bearing road heading (degrees CW from North)
   * @param {number}   dt      frame delta (seconds)
   */
  update(lngLat, bearing, dt) {
    if (this._isFlying || !lngLat) return;

    // Smooth bearing lerp
    const delta = shortestAngle(this._smoothBearing, bearing);
    const alpha = Math.min(1, dt * 5.0);
    this._smoothBearing = this._smoothBearing + delta * alpha;

    switch (this.mode) {
      case 'street': {
        // True Street View: camera right at street level, looking down the boulevard
        this._smoothPitch += (83 - this._smoothPitch) * alpha;
        const targetCenter = offsetLngLat(lngLat, this._smoothBearing, 14);
        this.map.jumpTo({
          center: targetCenter,
          bearing: this._smoothBearing,
          pitch: this._smoothPitch,
          zoom: 19.3,
        });
        break;
      }

      case 'chase': {
        // Third-person vehicle chase view
        this._smoothPitch += (76 - this._smoothPitch) * alpha;
        const targetCenter = offsetLngLat(lngLat, this._smoothBearing, 8);
        this.map.jumpTo({
          center: targetCenter,
          bearing: this._smoothBearing,
          pitch: this._smoothPitch,
          zoom: 18.2,
        });
        break;
      }

      case 'orbit': {
        // Elevated cinematic 3D drone camera
        this._smoothPitch += (60 - this._smoothPitch) * alpha;
        this.map.jumpTo({
          center: lngLat,
          bearing: this._smoothBearing,
          pitch: this._smoothPitch,
          zoom: 17.0,
        });
        break;
      }

      case 'top': {
        // Top-down navigation map
        this._smoothPitch += (0 - this._smoothPitch) * alpha;
        this.map.jumpTo({
          center: lngLat,
          bearing: 0,
          pitch: 0,
          zoom: 15.5,
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
