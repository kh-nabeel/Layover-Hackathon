// src/customLayer.js
// MapLibre custom layer that hosts a THREE.js scene for the vehicle.
// Matches MapLibre WebGL coordinate system with Three.js metric space.
// Compatible with MapLibre GL JS v4, v5, and v6.

import * as THREE from 'three';
import { MercatorCoordinate } from 'maplibre-gl';
import { buildCar, buildBike } from './vehicle.js';

export class VehicleLayer {
  constructor() {
    this.id = 'vehicle-layer';
    this.type = 'custom';
    this.renderingMode = '3d';

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.map = null;

    // Current vehicle group (car or bike)
    this._vehicleGroup = null;
    this._vehicleType = 'car';

    // Current world position (Mercator)
    this._mercPos = null;
    // Current bearing in degrees
    this._bearing = 0;
    // Altitude offset (metres) – lifts vehicle so wheels sit on road surface
    this._altOffset = 1.2;
  }

  /** Called once by MapLibre when the layer is added */
  onAdd(map, gl) {
    this.map = map;

    // THREE.js scene setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.Camera();

    // Daylight lighting setup: ambient + directional sun + soft fill
    const ambient = new THREE.AmbientLight(0xffffff, 1.4);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfff5e6, 2.2);
    sun.position.set(20, 60, 40);
    this.scene.add(sun);

    const fill = new THREE.DirectionalLight(0x90caf9, 0.9);
    fill.position.set(-20, 30, -30);
    this.scene.add(fill);

    // Add subtle fog to match MapLibre atmosphere
    this.scene.fog = new THREE.Fog(0xdce5ef, 200, 1200);

    // Build initial vehicle mesh
    this._buildVehicle(this._vehicleType);

    // Share MapLibre's existing WebGL context
    this.renderer = new THREE.WebGLRenderer({
      canvas: map.getCanvas(),
      context: gl,
      antialias: true,
    });
    this.renderer.autoClear = false;
    this.renderer.shadowMap.enabled = false;
    this.renderer.state.reset();
  }

  /** Switch vehicle type and rebuild mesh */
  setVehicleType(type) {
    if (this._vehicleType === type && this._vehicleGroup) return;
    this._vehicleType = type;
    this._buildVehicle(type);
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

    // Scale factor: 1 meter in Mercator units at this latitude
    const meterScale = merc.meterInMercatorCoordinateUnits();

    // In Three.js, our vehicle is built in true metric meters (4.3m car).
    // Scaling by 1.15x meterScale fits standard Paris avenue lanes perfectly.
    const vehicleScale = meterScale * 1.15;

    // 1. MapLibre view-projection matrix
    const projMatrix = new THREE.Matrix4().fromArray(matrixArr);

    // 2. Translate to vehicle's geographic Mercator position
    const translateM = new THREE.Matrix4().makeTranslation(
      merc.x, merc.y, merc.z
    );

    // 3. Tip up from Three.js horizontal ground (Y-up) to Mercator ground (Z-up)
    const rotX = new THREE.Matrix4().makeRotationX(Math.PI / 2);

    // 4. Heading rotation around vehicle's local UP axis:
    // Bearing is degrees clockwise from North.
    // rotX * rotY(rad) maps:
    // 0 deg -> North (0, -1, 0)
    // 90 deg -> East (1, 0, 0)
    // 180 deg -> South (0, 1, 0)
    // 270 deg -> West (-1, 0, 0)
    const bearingRad = (this._bearing * Math.PI) / 180;
    const rotY = new THREE.Matrix4().makeRotationY(bearingRad);

    // 5. Metric scale
    const scaleM = new THREE.Matrix4().makeScale(
      vehicleScale,
      vehicleScale,
      vehicleScale
    );

    // Final camera projectionMatrix = projection × translation × rotX × rotY × scale
    this.camera.projectionMatrix = projMatrix
      .multiply(translateM)
      .multiply(rotX)
      .multiply(rotY)
      .multiply(scaleM);

    this.renderer.state.reset();
    this.renderer.render(this.scene, this.camera);
    this.map.triggerRepaint();
  }

  onRemove() {
    if (this._vehicleGroup) {
      this.scene?.remove(this._vehicleGroup);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}
