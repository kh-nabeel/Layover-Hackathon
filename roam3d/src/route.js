// src/route.js
// Loads pre-fetched route GeoJSON, merges legs, and provides
// helper functions for position-along-route interpolation.

import turfAlong from '@turf/along';
import turfLength from '@turf/length';

/** Loaded and merged route line (GeoJSON LineString feature) */
let routeLine = null;
/** Total route length in kilometres */
let totalLengthKm = 0;
/** Landmark progress points { landmarkIndex, distKm } */
let landmarkPoints = [];

/**
 * Load the pre-fetched route from /routes/tour.json.
 * Returns { routeLine, totalLengthKm, landmarkPoints }
 */
export async function loadRoute() {
  const res = await fetch(`${import.meta.env.BASE_URL}routes/tour.json`);
  if (!res.ok) throw new Error(`Failed to load route: ${res.status}`);
  const data = await res.json();

  // data.route is a GeoJSON LineString feature
  // data.landmarks is an array of { name, distKm }
  routeLine = data.route;
  totalLengthKm = turfLength(routeLine, { units: 'kilometers' });
  landmarkPoints = data.landmarks;

  return { routeLine, totalLengthKm, landmarkPoints };
}

/**
 * Get the [lng, lat] position at a given distance (km) along the route.
 * Clamps to [0, totalLengthKm].
 */
export function positionAtDist(distKm) {
  if (!routeLine || totalLengthKm <= 0) return [2.2945, 48.8584];
  const clamped = Math.max(0, Math.min(distKm, totalLengthKm));
  try {
    const pt = turfAlong(routeLine, clamped, { units: 'kilometers' });
    return pt.geometry.coordinates; // [lng, lat]
  } catch (e) {
    return [2.2945, 48.8584];
  }
}

/**
 * Get the bearing (degrees) between two route positions.
 */
export function bearingAtDist(distKm, lookAheadKm = 0.02) {
  if (!routeLine || totalLengthKm <= 0) return 0;
  let a = positionAtDist(distKm);
  let b = positionAtDist(Math.min(distKm + lookAheadKm, totalLengthKm));
  let dLng = b[0] - a[0];
  let dLat = b[1] - a[1];

  // If at route end or identical points, sample backward
  if (Math.abs(dLng) < 1e-8 && Math.abs(dLat) < 1e-8) {
    a = positionAtDist(Math.max(0, distKm - lookAheadKm));
    b = positionAtDist(distKm);
    dLng = b[0] - a[0];
    dLat = b[1] - a[1];
  }

  let bearing = (Math.atan2(dLng, dLat) * 180) / Math.PI;
  if (bearing < 0) bearing += 360;
  return isNaN(bearing) ? 0 : bearing;
}

/** Return the raw GeoJSON feature for the route line */
export function getRouteLine() { return routeLine; }

/** Return total route length in km */
export function getTotalLength() { return totalLengthKm; }

/** Return landmark waypoint array */
export function getLandmarkPoints() { return landmarkPoints; }
