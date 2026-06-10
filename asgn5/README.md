# Three.js Assignment — Alien Island Base

This project is a minimal Vite + Three.js scene for the "Alien Island Base" assignment.

**Wow Point:** animated glowing alien energy core with moving lights.

## Quick Start

### Run locally
```powershell
npm install
npm run dev
```
Opens at `http://localhost:5173`

### Deploy to GitHub Pages
```powershell
npm run build
```

Then set up GitHub Pages to deploy from the `dist/` folder (see instructions below).

## GitHub Pages Setup

After running `npm run build`, choose one of these options:

**Option 1: Automatic with GitHub Actions (Recommended)**

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install && npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

**Option 2: Manual**
1. Go to repo **Settings > Pages**
2. Set Source to "Deploy from a branch"
3. Select `gh-pages` branch (you'll need to push `dist/` to this branch)

Your site will be at: `https://yourusername.github.io/asgn5/`

## Model Setup

Place your custom `.glb` model at:
```
public/models/model.glb
```

If missing, a fallback spaceship is generated automatically.

Download free models from:
- [Poly Pizza](https://poly.pizza/)
- [Free3D](https://free3d.com/)

## Features Implemented

✅ 22+ primitives (boxes, spheres, cylinders, cones, torus)  
✅ Textured primitives with CanvasTexture  
✅ Animated torus rings & floating objects  
✅ 5 light types (Ambient, Hemisphere, Directional, Point, Spot)  
✅ Procedural skybox  
✅ GLTFLoader for custom 3D model  
✅ OrbitControls for mouse navigation  
✅ Shadows & responsive resizing  
✅ Wow Point: glowing alien energy core with animated rings