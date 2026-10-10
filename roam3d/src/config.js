// src/config.js
// Central configuration for landmarks, constants, and game settings.

/** Paris map center (Louvre) */
export const PARIS_CENTER = [2.3376, 48.8606];

/** Map style – OpenFreeMap liberty (no API key required) */
export const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

/** Initial map settings */
export const MAP_INIT = {
  center: PARIS_CENTER,
  zoom: 15,
  pitch: 60,
  maxPitch: 85,
  bearing: 0,
};

/** Landmark definitions (all facts verified from the prompt) */
export const LANDMARKS = [
  {
    id: 'eiffel',
    name: 'Eiffel Tower',
    coord: [2.2945, 48.8584],
    icon: '🗼',
    desc: 'Built for the 1889 World\'s Fair, about 330 m tall including antennas.',
  },
  {
    id: 'arc',
    name: 'Arc de Triomphe',
    coord: [2.2950, 48.8738],
    icon: '⛩️',
    desc: 'Commissioned by Napoleon in 1806, completed 1836; twelve avenues meet around it.',
  },
  {
    id: 'concorde',
    name: 'Place de la Concorde',
    coord: [2.3212, 48.8656],
    icon: '🏛️',
    desc: 'Holds the 3,000-year-old Luxor Obelisk from Egypt, placed in 1836.',
  },
  {
    id: 'louvre',
    name: 'Louvre',
    coord: [2.3376, 48.8606],
    icon: '🎨',
    desc: 'Former royal palace, now the world\'s most-visited art museum; glass pyramid added 1989.',
  },
  {
    id: 'notredame',
    name: 'Notre-Dame',
    coord: [2.3499, 48.8530],
    icon: '⛪',
    desc: 'Gothic cathedral begun in 1163; reopened in December 2024 after the 2019 fire.',
  },
  {
    id: 'sacrecoeur',
    name: 'Sacré-Cœur',
    coord: [2.3431, 48.8867],
    icon: '🕌',
    desc: 'White basilica on Montmartre hill, completed 1914.',
  },
];

/** Vehicle specs */
export const VEHICLES = {
  car: {
    label: 'Car',
    icon: '🚗',
    maxSpeed: 110,   // km/h (increased for high responsiveness)
    turboSpeed: 175,  // km/h
    acceleration: 14, // m/s^2
    braking: 18,
  },
  bike: {
    label: 'Bike',
    icon: '🚲',
    maxSpeed: 35,
    turboSpeed: 75,
    acceleration: 6,
    braking: 10,
  },
};

/** Default environment, props, and gameplay settings */
export const DEFAULT_SETTINGS = {
  streetLightsEnabled: true,
  streetLightsCount: 40,
  benchesEnabled: true,
  benchesCount: 20,
  treesEnabled: true,
  treesCount: 45,
  fireEnabled: true,
  fireCount: 15,
  buildingRenderDistance: 1500, // metres
  carAcceleration: 14,          // m/s^2
  steeringSensitivity: 0.5,     // multiplier (lowered for comfortable, smooth steering)
  headlights: true,
};

/** How close (metres) to trigger a landmark card */
export const LANDMARK_TRIGGER_DIST = 80;

/** Autopilot speed factor (km/h, fast for demo) */
export const AUTOPILOT_SPEED = 85;

/** Layover challenge duration (seconds) */
export const CHALLENGE_DURATION = 600;
