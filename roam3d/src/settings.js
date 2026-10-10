// src/settings.js
// Central state manager for environment, props, and vehicle settings.
import { DEFAULT_SETTINGS } from './config.js';

class SettingsManager {
  constructor() {
    this.state = { ...DEFAULT_SETTINGS };
    this._listeners = [];
    this._load();
  }

  _load() {
    try {
      const saved = localStorage.getItem('roam3d_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state = { ...this.state, ...parsed };
      }
    } catch (e) {}
  }

  _save() {
    try {
      localStorage.setItem('roam3d_settings', JSON.stringify(this.state));
    } catch (e) {}
  }

  get(key) {
    return this.state[key];
  }

  set(key, value) {
    this.state[key] = value;
    this._save();
    this._notify(key, value);
  }

  setAll(newValues) {
    Object.assign(this.state, newValues);
    this._save();
    Object.keys(newValues).forEach(k => this._notify(k, newValues[k]));
  }

  onChange(cb) {
    this._listeners.push(cb);
  }

  _notify(key, value) {
    this._listeners.forEach(cb => {
      try { cb(key, value, this.state); } catch (e) { console.warn(e); }
    });
  }
}

export const settings = new SettingsManager();
