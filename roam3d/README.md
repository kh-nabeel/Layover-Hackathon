# Roam3D

Roam3D is a browser based 3D driving game set on real streets in Paris. It combines a live map with a Three.js vehicle and environment layer, letting players explore a route between well-known landmarks such as the Eiffel Tower, Arc de Triomphe, the Louvre, Notre-Dame, and Sacré-Cœur.

Choose a car or motorcycle, select a game mode, and drive the route yourself or switch on demo mode. The game is designed as a small, playable travel experience: real geography provides the roads and setting, while checkpoints, landmark notes, and racing add a game layer.

## Game modes

- **Free Roam** — explore the Paris route with no checkpoint challenge.
- **Race** — reach the checkpoints while racing three rival cars.
- **Time Attack** — reach all six checkpoints before the ten minute timer expires.

The start screen lets players choose a vehicle and mode. During play, the HUD shows speed, route progress, the next landmark, and landmark information as locations are reached.

## Controls

| Input | Action |
| --- | --- |
| `W` / `↑` | Accelerate |
| `S` / `↓` | Brake / reverse |
| `A` / `←` | Steer left |
| `D` / `→` | Steer right |
| `T` | Toggle turbo |
| `Space` | Pause or resume |
| `C` | Change camera view |
| `V` | Switch between car and motorcycle |
| `L` | Toggle landmark markers |
| `P` | Toggle demo autopilot |
| `H` | Toggle headlights |
| `O` | Open or close settings |
| Drag map | Orbit / change map bearing |
| Scroll | Zoom the map |

Touch and on-screen controls are also available on smaller screens.

## Run locally

Use Node.js **22.12 or newer** (or Node.js 20.19 or newer) and npm. From the `roam3d` directory:

```sh
npm ci
npm run dev
```

Vite prints a local URL in the terminal. Open that URL in a modern browser. To create and preview a production build:

```sh
npm run build
npm run preview
```

The route data is included at `public/routes/tour.json`. To regenerate it from the public OSRM routing service, run:

```sh
npm run fetch-routes
```

## Tech and project layout

- **Vite** builds and serves the client application.
- **MapLibre GL JS** displays the Paris map, vector buildings, roads, and map controls.
- **Three.js** renders the player vehicle, rival vehicles, and procedural 3D props in a custom map layer.
- **Turf.js** measures and interpolates positions along the route.
- Procedural canvas textures provide building facades, rooftop AC details, road markings, zebra crossings, water, and sky effects.

Key source files:

| File | Purpose |
| --- | --- |
| `src/main.js` | Map setup, layers, game loop, HUD wiring, and game modes |
| `src/config.js` | Map center, landmark data, vehicle specs, and defaults |
| `src/route.js` | Load route GeoJSON and calculate route positions |
| `src/driving.js` | Vehicle movement, steering, acceleration, and input |
| `src/vehicle.js` | Procedural car and motorcycle models |
| `src/customLayer.js` | Three.js map integration and vehicle/prop placement |
| `src/props.js` | Trees, street furniture, and other 3D props |
| `src/textures.js` | Procedural game textures |
| `src/race.js` | Checkpoint tracking and race rivals |
| `public/routes/tour.json` | Precomputed Paris landmark route |

## GitHub Pages deployment

The repository deploys the Vite build with the workflow at the repository root: `.github/workflows/deploy.yml`. It builds the app from `roam3d/` and publishes `roam3d/dist` when changes are pushed to `main`.

For the first deployment, select **Settings → Pages → Build and deployment → GitHub Actions** in the repository. The project site URL is:

<https://kh-nabeel.github.io/Layover-Hackathon/>

## External services

The game loads map styles and vector tiles from OpenFreeMap, satellite imagery from Esri World Imagery, and route data from the checked-in GeoJSON file. Rebuilding route data uses the public OSRM demo server. These services require an internet connection in the browser.
