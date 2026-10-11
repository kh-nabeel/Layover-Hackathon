# Roam3D — Land in Paris

[![TinkerHub Layover 2026](https://img.shields.io/badge/TinkerHub-Layover%202026-6366f1?style=for-the-badge&logo=rocket)](https://github.com/kh-nabeel/Layover-Hackathon)
[![Three.js](https://img.shields.io/badge/Three.js-r186-black?style=for-the-badge&logo=threedotjs)](https://threejs.org/)
[![MapLibre GL](https://img.shields.io/badge/MapLibre_GL-v6.13-blue?style=for-the-badge&logo=maplibre)](https://maplibre.org/)
[![Vite](https://img.shields.io/badge/Vite-v8.3-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![OpenFreeMap](https://img.shields.io/badge/Tiles-OpenFreeMap-emerald?style=for-the-badge)](https://openfreemap.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

> *"AI dreams imaginary worlds. We let you drive the real one."*

**Roam3D** is an interactive, browser-based 3D driving and exploration simulator set in the real streets of Paris. Built for the **TinkerHub Layover 2026 Hackathon**, Roam3D fuses high-performance WebGL rendering (**Three.js**) directly with real-world geospatial vector tiles (**MapLibre GL JS** & **OpenFreeMap**), rendering extruded architectural buildings, procedural vehicles, dynamic atmospheric lighting, and street furniture with zero API keys and zero heavy game engine downloads.

---

## 🌟 Highlights & Key Features

### 🗺️ Real Paris Geospatial World
- **OpenFreeMap Liberty Vector Tiles**: High-definition street network and vector building footprints rendered entirely in client-side WebGL without vendor lock-in or API keys.
- **3D Extruded Haussmann Architecture**: Dynamic building heights with procedural Parisian zinc roofs, stone facades, and illuminated window textures.
- **Real-World Metric Alignment**: 1:1 scale mapping utilizing `MercatorCoordinate` synchronization between MapLibre's camera matrix and Three.js's 3D projection space.

### 🏎️ Procedural 3D Vehicles & Physics Dynamics
- **Custom Three.js Sports Car**: Aerodynamic chassis, tinted cabin, rear spoiler, alloy wheels with realistic rim geometry, illuminated LED headlights, and brake lights.
- **Procedural Motorcycle**: Dual-wheel frame with fork suspension, handlebars, spokes, and rider silhouette.
- **Driving Physics Model**:
  - Realistic throttle acceleration curves and responsive brake deceleration.
  - Directional steering with wheel alignment and momentum-based drift damping.
  - **Collision Detection & Impact Response**: Physical boundary checks against 3D buildings with bounce-back inertia and visual impact alerts.
  - **Turbo Boost**: Hit `T` to surge past speed limits (up to 240 km/h in cars, 130 km/h on motorcycles).

### 🎮 Multiple Game Modes
1. **Free Roam**: Unrestricted exploration across Parisian boulevards, bridges, and alleys with full orbit camera control.
2. **Checkpoint Race**: Compete against 3 AI rival vehicles (`R1`, `R2`, `R3`) along an authentic Parisian grand tour route from landmark to landmark.
3. **Time Attack / 10-Minute Challenge**: Test your speed and navigation skills by visiting all 6 major landmarks before the countdown timer hits zero.

### 🏛️ Iconic Parisian Landmarks & Audio Guide
Automatic proximity detection (within 80m) displays curated historical cards and provides voiced narration via the **Web Speech API**:
1. 🗼 **Eiffel Tower** — Built for the 1889 World's Fair, standing ~330 m tall.
2. ⛩️ **Arc de Triomphe** — Commissioned by Napoleon in 1806, anchoring 12 radiating avenues.
3. 🏛️ **Place de la Concorde** — Historic square home to the 3,000-year-old Luxor Obelisk.
4. 🎨 **The Louvre** — Former royal palace turned world's most-visited museum, featuring I. M. Pei's glass pyramid.
5. ⛪ **Notre-Dame de Paris** — Iconic Gothic cathedral begun in 1163, celebrated after its December 2024 reopening.
6. 🕌 **Sacré-Cœur** — Roman-Byzantine white basilica perched atop the Montmartre hill.

### 🌆 Dynamic Atmosphere & Day/Night Cycle
- **Daylight**: Bright afternoon sun with sharp building shadows and clear visibility.
- **Sunset Golden Hour**: Warm amber gradients over the Seine and reflective golden window highlights.
- **Paris Midnight**: Moody nighttime illumination featuring warm street lanterns, vehicle headlight cones, and nocturnal window luminescence.
- **24-Hour Cycle**: Continuous smooth time progression matching real-world day-night transitions.

### 🌳 Procedural Street Furniture & Urban Props
Configurable 3D environmental props placed along street corridors:
- **Parisian Cast-Iron Lampposts**: Ornate lamppost structures with warm lantern point lights.
- **Haussmann Sidewalk Benches**: Classic green wooden slat benches.
- **Boulevard Plane Trees**: Procedural trunks and lush spherical foliage canopies.
- **Fire Braziers & Torches**: Animated glowing embers with flickering fire particles.

### ⚙️ Live In-Game Simulation Settings Modal
Fine-tune graphics and mechanics on the fly (press `O` or click the settings cog):
- Toggle and adjust prop counts (streetlights, benches, trees, fire braziers).
- Switch environment lighting modes.
- Adjust building render distance (from 300 m to 3,000 m).
- Tune vehicle top speed (120 – 260 km/h), acceleration (4 – 25 m/s²), and steering sensitivity.

---

## 🎮 Controls & Shortcuts

| Action | Keyboard Key | On-Screen HUD Control |
| :--- | :---: | :---: |
| **Accelerate / Throttle** | `W` or `↑` | **Gas** button |
| **Brake / Reverse** | `S` or `↓` | **Brake** button |
| **Steer Left** | `A` or `←` | **Steer Left** button |
| **Steer Right** | `D` or `→` | **Steer Right** button |
| **Turbo Boost** | `T` | — |
| **Toggle Camera View** | `C` | **Cam** button (Chase / Street View) |
| **Switch Vehicle (Car / Bike)** | `V` | **Vehicle** button |
| **Toggle Landmark Pins** | `L` | **Landmarks** button |
| **Toggle Headlights** | `H` | **Lights** button |
| **Time of Day (Day / Sunset / Night / Cycle)** | `N` | **Day/Night** button |
| **Autopilot / Cinematic Demo** | `P` | **Demo** button |
| **Audio Voice Narration** | — | **Voice** button |
| **10-Minute Challenge** | — | **Challenge** button |
| **Simulation Settings** | `O` | **Settings** button |
| **Orbit Camera** | Left-click & Drag | Mouse interaction |
| **Camera Zoom** | Mouse Wheel Scroll | Mouse interaction |

---

## 🏗️ Architecture & Technical Stack

```
┌─────────────────────────────────────────────────────────────┐
│                       Browser Window                        │
├─────────────────────────────────────────────────────────────┤
│   DOM Layer: HUD, Landing Page, Settings Modal, Cards       │
├─────────────────────────────────────────────────────────────┤
│                      MapLibre GL JS                         │
│   • Vector Map Canvas (Web Mercator Projection)             │
│   • OpenFreeMap Liberty Vector Tiles                        │
│   • 3D Extruded Building Layer (OSM building footprints)   │
│   • Coordinate & Camera Transform Sync                      │
├─────────────────────────────────────────────────────────────┤
│                   Three.js WebGL Custom Layer               │
│   • Shared WebGLContext & Projection Matrix Sync            │
│   • Procedural 3D Vehicle Models (Car, Bike, AI Rivals)     │
│   • Street Props (Lampposts, Benches, Trees, Braziers)      │
│   • Dynamic Lighting, Shadows & Particle Systems            │
│   • Building Collision Raycasting / Proximity Checks        │
├─────────────────────────────────────────────────────────────┤
│                    Data & Routing Engine                    │
│   • OSRM (Open Source Routing Machine) Tour Paths           │
│   • Turf.js Geospatial Math (along, length, nearest-point)  │
│   • Web Speech API Landmark Audio Synthesis                 │
└─────────────────────────────────────────────────────────────┘
```

### Core Technologies
- **[MapLibre GL JS](https://maplibre.org/)**: Open-source fork of Mapbox GL, providing fast 60 FPS vector tile rendering and 3D terrain/building extrusion.
- **[Three.js](https://threejs.org/)**: 3D library managing procedural meshes, lighting, materials, and particle animations embedded via MapLibre's custom layer interface.
- **[Turf.js](https://turfjs.org/)**: High-performance spatial analysis for route interpolation, distance calculations, and waypoint tracking.
- **[OpenFreeMap](https://openfreemap.org/)**: Free, open-source vector tile hosting powered by OpenStreetMap data.
- **[Vite](https://vitejs.dev/)**: Next-generation frontend build tooling and development server.

---

## 📂 Project Structure

```
Layover/
├── package.json              # Root workspace scripts (dev, build, preview)
├── vercel.json               # Root Vercel deployment configuration
├── .gitignore                # Workspace git ignore rules
├── README.md                 # Project documentation
└── roam3d/                   # Main application directory
    ├── index.html            # Main HTML entrypoint, HUD, landing UI & modals
    ├── package.json          # Application dependencies and scripts
    ├── vite.config.js        # Vite bundler configuration
    ├── vercel.json           # Vercel SPA configuration
    ├── public/
    │   └── routes/
    │       └── tour.json     # Pre-calculated OSRM GeoJSON grand tour route
    ├── scripts/
    │   └── fetch-routes.mjs  # Route generator script querying public OSRM API
    └── src/
        ├── main.js           # App orchestration, mode management, game loops
        ├── config.js         # Landmark coordinates, vehicle specs, defaults
        ├── customLayer.js    # Three.js CustomLayer for MapLibre GL integration
        ├── driving.js        # Vehicle physics, steering, collisions, inertia
        ├── vehicle.js        # Procedural 3D car and motorcycle mesh generators
        ├── landmarks.js      # Landmark markers, proximity triggers, voice TTS
        ├── props.js          # Procedural street lamps, benches, trees, braziers
        ├── textures.js       # Procedural canvas textures (zinc roofs, windows)
        ├── camera.js         # Third-person, first-person, and orbit camera logic
        ├── hud.js            # Speedometer, progress bars, interactive HUD controls
        ├── settings.js       # Settings modal state and live config tuning
        ├── race.js           # Checkpoint tracker and AI rival car logic
        ├── route.js          # Route length, distance, and heading calculations
        ├── landing.js        # Landing screen transitions and vehicle selection
        └── style.css         # Modern glassmorphism dark-theme styling
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18.x or later installed
- **npm** (comes with Node.js)

### 1. Clone the Repository
```bash
git clone https://github.com/kh-nabeel/Layover-Hackathon.git
cd Layover-Hackathon
```

### 2. Install Dependencies
You can install dependencies directly inside the `roam3d` directory:
```bash
cd roam3d
npm install
```

### 3. Run the Development Server
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

### 4. Build for Production
```bash
npm run build
```
The optimized production bundle will be generated in `roam3d/dist`.

To preview the production build locally:
```bash
npm run preview
```

### 5. (Optional) Re-fetch Driving Routes
To re-fetch the official landmark route directly from the public OSRM engine:
```bash
npm run fetch-routes
```

---

## 🌐 Deployment to Vercel

The repository is configured for one-click deployment to **Vercel** with the included root `vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm --prefix roam3d install && npm --prefix roam3d run build",
  "outputDirectory": "roam3d/dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

1. Push your repository to GitHub.
2. Import the repository into your [Vercel Dashboard](https://vercel.com/).
3. Vercel will automatically detect the build settings and deploy your application.

---

## 🏆 Hackathon Context

This project was built for **TinkerHub Layover 2026**, demonstrating how modern WebGL standards and open geospatial data can transform digital travel and virtual tourism into an engaging, tangible, and high-performance real-time simulation.

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

## 🤝 Acknowledgments

- **TinkerHub Foundation** for organizing the Layover Hackathon.
- **OpenFreeMap** for providing reliable, high-speed vector tiles without API keys.
- **OpenStreetMap Contributors** for the comprehensive road and building data of Paris.
- **MapLibre & Three.js Communities** for pioneering open 3D web graphics standards.
