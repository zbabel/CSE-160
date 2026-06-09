# Three.js Assignment — Alien Island Base

This project is a minimal Vite + Three.js scene for the "Alien Island Base" assignment.

Wow Point: animated glowing alien energy core with moving lights.

Place a GLB model at `public/models/model.glb`. If you don't have one, download a free `.glb` from Poly Pizza or Free3D and put it there.

How to run
1. Install dependencies:

```powershell
npm install
```

2. Start dev server:

```powershell
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173`).

Model source
- Put your `.glb` at `public/models/model.glb`.
- If the model fails to load the app adds a simple fallback spaceship created from primitives.

Assignment checklist (all implemented):

- **Create a complete 3D scene/world using Three.js** — scene, camera, renderer, island, objects present.
- **Include at least 20 primary 3D shapes** — boxes(6)+spheres(5)+cylinders(4)+cones(4)+torus(3) = 22 primitives (see `src/main.js` comments).
- **Use at least 3 different primitive shape types** — BoxGeometry, SphereGeometry, CylinderGeometry, ConeGeometry, TorusGeometry used.
- **At least one primitive shape is textured** — several primitives use CanvasTexture (see `makePatternTexture`).
- **At least one primitive shape is animated** — torusGroup rotates; floating objects bob/orbit.
- **Include at least one textured custom 3D model** — load `/models/model.glb` via GLTFLoader; fallback provided.
- **Include at least 3 different light source types** — AmbientLight, HemisphereLight, DirectionalLight, PointLight, SpotLight.
- **Include a textured skybox** — procedural skybox created via six CanvasTextures.
- **Use a PerspectiveCamera** — implemented.
- **Add mouse navigation controls using OrbitControls** — implemented.
- **Add an extra “Wow Point” feature** — animated glowing alien energy core with animated rings, internal PointLight, and orbiting spheres.
- **Include a visible note describing the Wow Point** — overlay in `index.html` and `README.md`.

Notes:
- The project uses Vite. If you prefer another dev server, adapt `package.json` accordingly.
- The GLTF model is not included in the repo. Place your downloaded `model.glb` into `public/models/`.
