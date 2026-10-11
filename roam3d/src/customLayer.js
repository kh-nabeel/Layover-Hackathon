// src/customLayer.js
// MapLibre custom layer that hosts a THREE.js scene for the vehicle.
// Matches MapLibre WebGL coordinate system with Three.js metric space.
// Compatible with MapLibre GL JS v4, v5, and v6.

import * as THREE from 'three';
import { MercatorCoordinate } from 'maplibre-gl';
import { buildCar, buildBike } from './vehicle.js';
import { PropsManager } from './props.js';
import { createSkyTexture } from './textures.js';

export const PARIS_ANCHOR_LNG_LAT = [2.2945, 48.8584];
export const PARIS_ANCHOR_MERC = MercatorCoordinate.fromLngLat(
  { lng: PARIS_ANCHOR_LNG_LAT[0], lat: PARIS_ANCHOR_LNG_LAT[1] },
  0
);
export const PARIS_METER_SCALE = PARIS_ANCHOR_MERC.meterInMercatorCoordinateUnits();

export function lngLatToWorld(lng, lat) {
  const merc = MercatorCoordinate.fromLngLat({ lng, lat }, 0);
  const x = (merc.x - PARIS_ANCHOR_MERC.x) / PARIS_METER_SCALE;
  const z = -(merc.y - PARIS_ANCHOR_MERC.y) / PARIS_METER_SCALE;
  return { x, z };
}

export class VehicleLayer {
  constructor() {
    this.id = 'vehicle-layer';
    this.type = 'custom';
    this.renderingMode = '3d';

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.map = null;
    this.propsManager = null;
    this.skyMesh = null;
    this.sun = null;
    this.fill = null;

    // Current vehicle group (car or bike)
    this._vehicleGroup = null;
    this._vehicleType = 'car';
    this._headlightsOn = true;
    this._rivalGroups = [];

    // Current world position (Mercator)
    this._mercPos = null;
    // Current bearing in degrees
    this._bearing = 0;
    // Altitude offset (metres) – 0.02m so wheels roll cleanly on road plane without floating or clipping
    this._altOffset = 0.02;

    // Day & Night Cycle State
    this.dayNightMode = 'day'; // 'day', 'sunset', 'night', 'cycle'
    this.dayNightProgress = 0; // 0..1 in cycle mode
    this.nightFactor = 0;      // 0 = full daylight, 0.45 = sunset/dusk, 1 = full midnight
    this.ambient = null;
  }

  /** Called once by MapLibre when the layer is added */
  onAdd(map, gl) {
    this.map = map;

    // THREE.js scene setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.Camera();

    // Lighting setup: ambient + directional sun + soft fill
    this.ambient = new THREE.AmbientLight(0xffffff, 1.4);
    this.scene.add(this.ambient);

    this.sun = new THREE.DirectionalLight(0xfff5e6, 2.2);
    this.sun.position.set(20, 60, 40);
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);

    this.fill = new THREE.DirectionalLight(0x90caf9, 0.9);
    this.fill.position.set(-20, 30, -30);
    this.scene.add(this.fill);
    this.scene.add(this.fill.target);

    // Subtle atmospheric fog
    this.scene.fog = new THREE.Fog(0xdce5ef, 200, 1600);

    // ── Textured Sky Hemisphere Dome ──────────────────────────────────────────
    try {
      const skyImgData = createSkyTexture();
      const skyCanvas = document.createElement('canvas');
      skyCanvas.width = 512;
      skyCanvas.height = 512;
      skyCanvas.getContext('2d').putImageData(skyImgData, 0, 0);
      const skyTex = new THREE.CanvasTexture(skyCanvas);
      skyTex.colorSpace = THREE.SRGBColorSpace;
      skyTex.wrapS = THREE.RepeatWrapping;
      skyTex.wrapT = THREE.ClampToEdgeWrapping;

      const skyGeo = new THREE.SphereGeometry(450, 32, 16);
      const skyMat = new THREE.MeshBasicMaterial({
        map: skyTex,
        side: THREE.BackSide,
        depthWrite: false,
        depthTest: false,
      });
      this.skyMesh = new THREE.Mesh(skyGeo, skyMat);
      this.skyMesh.renderOrder = -1;
      this.skyMesh.position.y = 30;
      this.scene.add(this.skyMesh);
    } catch (e) {
      console.warn('Sky texture init notice:', e);
    }

    // Initialize 3D City Props (Street Lights, Benches, Trees, Fire, Dividers)
    this.propsManager = new PropsManager(this.scene);

    // Build initial vehicle mesh
    this._buildVehicle(this._vehicleType);

    // Share MapLibre's existing WebGL context
    this.renderer = new THREE.WebGLRenderer({
      canvas: map.getCanvas(),
      context: gl,
      antialias: false,
    });
    this.renderer.autoClear = false;
    this.renderer.shadowMap.enabled = false;
    this.renderer.state.reset();
  }

  /**
   * Set Day / Night mode: 'day', 'sunset', 'night', or 'cycle'
   */
  setDayNightMode(mode) {
    this.dayNightMode = mode;
    this._updateDayNightLighting();
  }

  _updateDayNightLighting() {
    let factor = 0;
    if (this.dayNightMode === 'day') {
      factor = 0;
    } else if (this.dayNightMode === 'sunset') {
      factor = 0.45;
    } else if (this.dayNightMode === 'night') {
      factor = 1.0;
    } else if (this.dayNightMode === 'cycle') {
      // 90 seconds full cycle: day -> dusk -> night -> dawn
      const t = (performance.now() / 1000 / 90) % 1;
      // 0..0.4 = day (factor 0), 0.4..0.5 = sunset (0->1), 0.5..0.9 = night (1), 0.9..1.0 = sunrise (1->0)
      if (t < 0.4) {
        factor = 0;
      } else if (t < 0.5) {
        factor = (t - 0.4) / 0.1;
      } else if (t < 0.85) {
        factor = 1.0;
      } else {
        factor = 1.0 - (t - 0.85) / 0.15;
      }
    }
    this.nightFactor = factor;

    if (!this.sun || !this.ambient || !this.fill) return;

    if (factor < 0.3) {
      // Daytime
      this.sun.color.setHex(0xfff5e6);
      this.sun.intensity = 2.2 * (1 - factor);
      this.fill.color.setHex(0x90caf9);
      this.fill.intensity = 0.9 * (1 - factor * 0.5);
      this.ambient.color.setHex(0xffffff);
      this.ambient.intensity = 1.4 - factor * 0.6;
      if (this.scene.fog) this.scene.fog.color.setHex(0xdce5ef);
      if (this.skyMesh) {
        this.skyMesh.material.color.setHex(0xffffff);
      }
    } else if (factor < 0.7) {
      // Golden Hour / Sunset Dusk
      const blend = (factor - 0.3) / 0.4;
      this.sun.color.setHex(0xff7722);
      this.sun.intensity = 2.4 * (1 - blend * 0.5);
      this.fill.color.setHex(0x8b5cf6);
      this.fill.intensity = 0.8;
      this.ambient.color.setHex(0xfdba74);
      this.ambient.intensity = 0.9 - blend * 0.3;
      if (this.scene.fog) this.scene.fog.color.setHex(0xd97757);
      if (this.skyMesh) {
        this.skyMesh.material.color.setHex(0xffaa77);
      }
    } else {
      // Night (Cool moonlight & city atmosphere)
      this.sun.color.setHex(0x93c5fd);
      this.sun.intensity = 0.45;
      this.fill.color.setHex(0x1e293b);
      this.fill.intensity = 0.3;
      this.ambient.color.setHex(0x0f172a);
      this.ambient.intensity = 0.4;
      if (this.scene.fog) this.scene.fog.color.setHex(0x0a0f1d);
      if (this.skyMesh) {
        this.skyMesh.material.color.setHex(0x223355);
      }
    }

    if (this.propsManager) {
      this.propsManager.setNightFactor(factor);
    }

    // Auto headlights at night or if user enabled
    if (this._vehicleGroup?.userData?.setHeadlights) {
      this._vehicleGroup.userData.setHeadlights(this._headlightsOn || factor > 0.35);
    }
  }

  /** Switch vehicle type and rebuild mesh */
  setVehicleType(type) {
    if (this._vehicleType === type && this._vehicleGroup) return;
    this._vehicleType = type;
    this._buildVehicle(type);
  }

  setRivalVehicles(rivals) {
    this.clearRivalVehicles();
    rivals.forEach(({ color }) => {
      const vehicle = buildCar(color);
      vehicle.userData.setHeadlights?.(false);
      this.scene.add(vehicle);
      this._rivalGroups.push(vehicle);
    });
  }

  setRivalPositions(rivals) {
    rivals.forEach(({ coord, bearing }, index) => {
      const group = this._rivalGroups[index];
      if (!group) return;
      const merc = MercatorCoordinate.fromLngLat({ lng: coord[0], lat: coord[1] }, this._altOffset);
      group.position.set(
        (merc.x - PARIS_ANCHOR_MERC.x) / PARIS_METER_SCALE,
        this._altOffset,
        -(merc.y - PARIS_ANCHOR_MERC.y) / PARIS_METER_SCALE
      );
      group.rotation.y = (bearing * Math.PI) / 180;
    });
  }

  clearRivalVehicles() {
    this._rivalGroups.forEach((group) => {
      this.scene?.remove(group);
      group.traverse((object) => {
        object.geometry?.dispose();
        if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
        else object.material?.dispose();
      });
    });
    this._rivalGroups = [];
  }

  setHeadlights(enabled) {
    this._headlightsOn = enabled;
    if (this._vehicleGroup?.userData?.setHeadlights) {
      this._vehicleGroup.userData.setHeadlights(enabled || this.nightFactor > 0.35);
    }
  }

  updateProps(key, value, state) {
    if (!this.propsManager) return;
    if (key === 'streetLightsEnabled' || key === 'streetLightsCount') {
      this.propsManager.updateStreetLights(state.streetLightsEnabled, state.streetLightsCount);
    } else if (key === 'benchesEnabled' || key === 'benchesCount') {
      this.propsManager.updateBenches(state.benchesEnabled, state.benchesCount);
    } else if (key === 'treesEnabled' || key === 'treesCount') {
      this.propsManager.updateTrees(state.treesEnabled, state.treesCount);
    } else if (key === 'fireEnabled' || key === 'fireCount') {
      this.propsManager.updateFire(state.fireEnabled, state.fireCount);
    }
  }

  _buildVehicle(type) {
    if (this._vehicleGroup && this.scene) {
      this.scene.remove(this._vehicleGroup);
      this._vehicleGroup.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (Array.isArray(o.material)) o.material.forEach(m => m.dispose());
          else o.material.dispose();
        }
      });
    }
    this._vehicleGroup = type === 'car' ? buildCar() : buildBike();
    if (this._vehicleGroup?.userData?.setHeadlights) {
      this._vehicleGroup.userData.setHeadlights(this._headlightsOn);
    }
    if (this.scene) this.scene.add(this._vehicleGroup);
  }

  /**
   * Update vehicle position.
   * @param {number[]} lngLat  [longitude, latitude]
   * @param {number}   bearing  Road heading in degrees (map bearing, 0=North CW)
   */
  setPosition(lngLat, bearing) {
    this._mercPos = MercatorCoordinate.fromLngLat(
      { lng: lngLat[0], lat: lngLat[1] },
      this._altOffset
    );
    this._bearing = bearing;
  }

  setSteering(angleDeg) {
    if (this._vehicleGroup?.userData?.setSteering) {
      this._vehicleGroup.userData.setSteering(angleDeg);
    }
  }

  /**
   * Called every frame by MapLibre.
   * @param {WebGLRenderingContext} gl
   * @param {Float64Array|object} matrixOrOptions  The projection matrix or options object
   */
  render(gl, matrixOrOptions) {
    if (!this._mercPos || !this._vehicleGroup) return;

    let rawMatrix = matrixOrOptions;
    if (matrixOrOptions && matrixOrOptions.defaultProjectionData?.mainMatrix) {
      rawMatrix = matrixOrOptions.defaultProjectionData.mainMatrix;
    }
    if (!rawMatrix) return;

    const matrixArr = (rawMatrix instanceof Float64Array || rawMatrix instanceof Float32Array)
      ? Array.from(rawMatrix)
      : Array.isArray(rawMatrix) ? rawMatrix : null;
    if (!matrixArr || matrixArr.length < 16) return;

    const merc = this._mercPos;

    // 1. MapLibre view-projection matrix
    const projMatrix = new THREE.Matrix4().fromArray(matrixArr);

    // 2. Fixed world anchor translation in Mercator space
    const anchorTranslate = new THREE.Matrix4().makeTranslation(
      PARIS_ANCHOR_MERC.x,
      PARIS_ANCHOR_MERC.y,
      PARIS_ANCHOR_MERC.z
    );

    // 3. Tip up from Three.js horizontal ground (Y-up) to Mercator ground (Z-up)
    const rotX = new THREE.Matrix4().makeRotationX(Math.PI / 2);

    // 4. Metric scale
    const scaleM = new THREE.Matrix4().makeScale(
      PARIS_METER_SCALE,
      PARIS_METER_SCALE,
      PARIS_METER_SCALE
    );

    // Final camera projectionMatrix is anchored to the FIXED world frame:
    this.camera.projectionMatrix = projMatrix
      .multiply(anchorTranslate)
      .multiply(rotX)
      .multiply(scaleM);

    // 5. Update vehicle transform in world space
    const vx = (merc.x - PARIS_ANCHOR_MERC.x) / PARIS_METER_SCALE;
    const vy = this._altOffset;
    const vz = -(merc.y - PARIS_ANCHOR_MERC.y) / PARIS_METER_SCALE;

    this._vehicleGroup.position.set(vx, vy, vz);
    this._vehicleGroup.rotation.y = (this._bearing * Math.PI) / 180;

    // Advance dynamic day/night cycle
    if (this.dayNightMode === 'cycle') {
      this._updateDayNightLighting();
    }

    // 6. Update sky and environment lights to follow the vehicle
    if (this.skyMesh) {
      this.skyMesh.position.set(vx, vy + 50, vz);
    }
    if (this.sun && this.fill) {
      this.sun.position.set(vx + 20, vy + 60, vz + 40);
      this.sun.target.position.set(vx, vy, vz);
      this.fill.position.set(vx - 20, vy + 30, vz - 30);
      this.fill.target.position.set(vx, vy, vz);
    }

    // 7. Update active props around the vehicle
    if (this.propsManager) {
      this.propsManager.updateVehiclePosition(vx, vz);
      this.propsManager.tick(performance.now() / 1000);
    }

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    this.renderer.state.reset();
    this.renderer.render(this.scene, this.camera);
  }

  onRemove() {
    this.clearRivalVehicles();
    if (this._vehicleGroup) {
      this.scene?.remove(this._vehicleGroup);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}
