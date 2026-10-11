import { LANDMARKS } from './config.js';
import { bearingAtDist, getTotalLength, positionAtDist } from './route.js';

const CHECKPOINT_RADIUS_M = 85;

function distanceMeters(a, b) {
  const toRad = Math.PI / 180;
  const dLat = (b[1] - a[1]) * toRad;
  const dLng = (b[0] - a[0]) * toRad;
  const lat1 = a[1] * toRad;
  const lat2 = b[1] * toRad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export class CheckpointTracker {
  constructor() {
    this.index = 0;
  }

  get next() { return LANDMARKS[this.index] || null; }
  get complete() { return this.index >= LANDMARKS.length; }

  update(coord) {
    if (this.next && distanceMeters(coord, this.next.coord) <= CHECKPOINT_RADIUS_M) {
      this.index++;
      return true;
    }
    return false;
  }
}

export class RaceRivals {
  constructor(vehicleLayer, vehicleType = 'car') {
    this.vehicleLayer = vehicleLayer;
    this.elapsed = 0;
    const rivalSpeeds = vehicleType === 'bike' ? [68, 78, 88] : [112, 124, 136];
    this.rivals = [
      { speed: rivalSpeeds[0], offsetKm: 0.18, color: '#ff665e', label: 'R1' },
      { speed: rivalSpeeds[1], offsetKm: 0.36, color: '#55d6be', label: 'R2' },
      { speed: rivalSpeeds[2], offsetKm: 0.54, color: '#f5bd4f', label: 'R3' },
    ];
    this.vehicleLayer.setRivalVehicles(this.rivals);
    this.updatePositions();
  }

  updatePositions() {
    const total = getTotalLength();
    const positions = this.rivals.map((rival) => {
      const distKm = Math.min(total, rival.offsetKm + rival.speed * this.elapsed / 3600);
      return { coord: positionAtDist(distKm), bearing: bearingAtDist(distKm), finished: distKm >= total };
    });
    this.vehicleLayer.setRivalPositions(positions);
    return positions.some((position) => position.finished);
  }

  update(dt) {
    this.elapsed += dt;
    return this.updatePositions();
  }

  destroy() {
    this.vehicleLayer.clearRivalVehicles();
  }
}
