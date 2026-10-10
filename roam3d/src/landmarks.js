// src/landmarks.js
// Manages landmark map markers, proximity detection, info cards, and speech.

import { Marker } from 'maplibre-gl';
import { LANDMARKS, LANDMARK_TRIGGER_DIST } from './config.js';

// Haversine distance in metres between two [lng,lat] points
function haversineM([lng1, lat1], [lng2, lat2]) {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export class LandmarkManager {
  constructor(map) {
    this.map = map;
    this.visited = new Set();
    this._speechEnabled = true;
    this._cardShown = false;
    this._markers = [];
    this._visible = true;
    this._onVisit = null; // callback(landmark, visitedCount)
    this._cardTimer = null;

    this._initMarkers();
    this._bindCard();
  }

  onVisit(cb) { this._onVisit = cb; }

  _initMarkers() {
    // Add pulsing HTML markers for each landmark
    LANDMARKS.forEach((lm, i) => {
      const el = document.createElement('div');
      el.className = 'landmark-marker';
      // SVG pin marker (no emoji)
      const pinSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
      el.innerHTML = `<div class="marker-pin">${pinSvg}</div><span class="marker-label">${lm.name}</span>`;
      el.dataset.id = lm.id;
      el.dataset.index = i;

      const marker = new Marker({ element: el, anchor: 'bottom' })
        .setLngLat(lm.coord)
        .addTo(this.map);

      this._markers.push({ marker, lm, el, index: i });
    });
  }

  _bindCard() {
    const closeBtn = document.getElementById('card-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        document.getElementById('landmark-card').style.display = 'none';
        this._cardShown = false;
      });
    }
  }

  /**
   * Check vehicle position against all landmarks.
   * @param {number[]} lngLat  [longitude, latitude]
   */
  check(lngLat) {
    LANDMARKS.forEach((lm) => {
      if (this.visited.has(lm.id)) return;
      const dist = haversineM(lngLat, lm.coord);
      if (dist <= LANDMARK_TRIGGER_DIST) {
        this._trigger(lm);
      }
    });
  }

  _trigger(lm) {
    this.visited.add(lm.id);

    // Mark the map marker as visited
    const entry = this._markers.find(m => m.lm.id === lm.id);
    if (entry) {
      entry.el.classList.add('visited');
    }

    // Show card
    this._showCard(lm);

    // Speech synthesis (silently skipped if unsupported)
    if (this._speechEnabled && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel(); // stop any ongoing speech
        const utt = new SpeechSynthesisUtterance(`${lm.name}. ${lm.desc}`);
        utt.rate = 0.92;
        utt.pitch = 1.0;
        utt.volume = 0.9;
        window.speechSynthesis.speak(utt);
      } catch (e) { /* silently skip */ }
    }

    if (this._onVisit) this._onVisit(lm, this.visited.size);
  }

  _showCard(lm) {
    const card = document.getElementById('landmark-card');
    if (!card) return;

    // SVG pin icon for the card (monochromatic)
    const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
    document.getElementById('card-icon').innerHTML = iconSvg;
    document.getElementById('card-name').textContent = lm.name;
    document.getElementById('card-count').textContent = `${this.visited.size} / 6 visited`;
    document.getElementById('card-desc').textContent = lm.desc;
    card.style.display = 'flex';
    this._cardShown = true;

    // Auto-hide after 7 seconds
    if (this._cardTimer) clearTimeout(this._cardTimer);
    this._cardTimer = setTimeout(() => {
      card.style.display = 'none';
      this._cardShown = false;
    }, 7000);
  }

  setSpeech(enabled) {
    this._speechEnabled = enabled;
    if (!enabled && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (e) {}
    }
  }

  setVisible(visible) {
    this._visible = visible;
    this._markers.forEach(entry => {
      entry.el.style.display = visible ? '' : 'none';
    });
    if (!visible) {
      const card = document.getElementById('landmark-card');
      if (card) card.style.display = 'none';
      if ('speechSynthesis' in window) {
        try { window.speechSynthesis.cancel(); } catch (e) {}
      }
    }
  }

  toggleVisible() {
    this.setVisible(!this._visible);
    return this._visible;
  }

  isVisible() { return this._visible; }

  getVisitedCount() { return this.visited.size; }
  isAllVisited()    { return this.visited.size >= LANDMARKS.length; }
}
