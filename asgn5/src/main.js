// Main entry for the Three.js Alien Island Base
// Assignment requirements are annotated in comments near where they are implemented.

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const container = document.getElementById('app');

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

// Scene
const scene = new THREE.Scene();

// Camera (Requirement 9: Use a PerspectiveCamera)
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(30, 20, 40);

// Controls (Requirement 10: OrbitControls)
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 4, 0);
controls.update();

// Resize
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize, false);
onWindowResize();

// Skybox (Requirement 8: textured skybox)
function makeSkybox() {
  // Procedural skybox using CanvasTexture for each face
  const size = 512;
  const faces = [];
  for (let i = 0; i < 6; i++) {
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    // gradient
    const grad = ctx.createLinearGradient(0, 0, 0, size);
    if (i === 4) { // top
      grad.addColorStop(0, '#001022'); grad.addColorStop(1, '#003050');
    } else if (i === 5) { // bottom
      grad.addColorStop(0, '#002040'); grad.addColorStop(1, '#001018');
    } else {
      grad.addColorStop(0, '#003050'); grad.addColorStop(1, '#001018');
    }
    ctx.fillStyle = grad; ctx.fillRect(0, 0, size, size);
    // stars
    for (let s = 0; s < 60; s++) {
      ctx.fillStyle = 'rgba(200,255,255,' + (Math.random() * 0.8) + ')';
      ctx.fillRect(Math.random() * size, Math.random() * size, Math.random() * 2, Math.random() * 2);
    }
    const tex = new THREE.CanvasTexture(canvas);
    faces.push(new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide }));
  }
  const skyGeo = new THREE.BoxGeometry(1000, 1000, 1000);
  const sky = new THREE.Mesh(skyGeo, faces);
  sky.name = 'skybox';
  scene.add(sky);
}
makeSkybox();

// Lights (Requirement 7: include at least 3 different light types)
// AmbientLight
const ambient = new THREE.AmbientLight(0x8899aa, 0.4);
scene.add(ambient);

// HemisphereLight
const hemi = new THREE.HemisphereLight(0x99ddff, 0x222233, 0.3);
scene.add(hemi);

// DirectionalLight (sun) with shadows
const dir = new THREE.DirectionalLight(0xfff2cc, 0.9);
dir.position.set(50, 60, 10);
dir.castShadow = true;
dir.shadow.mapSize.set(2048, 2048);
dir.shadow.camera.left = -100; dir.shadow.camera.right = 100;
dir.shadow.camera.top = 100; dir.shadow.camera.bottom = -100;
scene.add(dir);

// SpotLight (accent)
const spot = new THREE.SpotLight(0xffaa88, 0.6, 100, Math.PI / 8, 0.2, 1);
spot.position.set(-20, 30, -10);
spot.castShadow = true;
scene.add(spot);

// Ground / Island (Requirement 1: create a 3D scene with island/ground)
const islandGroup = new THREE.Group();
scene.add(islandGroup);

// Create an island using a large cylinder
const islandCanvas = document.createElement('canvas');
islandCanvas.width = 512; islandCanvas.height = 512;
const ictx = islandCanvas.getContext('2d');
ictx.fillStyle = '#2a4b2a';
ictx.fillRect(0, 0, 512, 512);
ictx.fillStyle = '#123322';
for (let i = 0; i < 2000; i++) {
  ictx.fillStyle = `rgba(20,${30 + (i % 120)},20,${0.02 + Math.random() * 0.06})`;
  ictx.fillRect(Math.random() * 512, Math.random() * 512, 1, 1);
}
const islandTex = new THREE.CanvasTexture(islandCanvas);
const islandGeo = new THREE.CylinderGeometry(25, 40, 8, 64);
const islandMat = new THREE.MeshStandardMaterial({ map: islandTex, roughness: 1 });
const island = new THREE.Mesh(islandGeo, islandMat);
island.rotation.x = -Math.PI / 2;
island.receiveShadow = true;
island.position.y = -4;
islandGroup.add(island);

// Water ring
const waterGeo = new THREE.RingGeometry(40, 60, 64);
const waterMat = new THREE.MeshBasicMaterial({ color: 0x003355, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
const water = new THREE.Mesh(waterGeo, waterMat);
water.rotation.x = -Math.PI / 2;
water.position.y = -4.1;
islandGroup.add(water);

// Helper: create a canvas texture with a color and optional stripes
function makePatternTexture(color, stripe) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = color; ctx.fillRect(0, 0, 256, 256);
  if (stripe) {
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    for (let i = 0; i < 20; i++) ctx.fillRect(0, i * 12, 256, 6);
  }
  return new THREE.CanvasTexture(c);
}

// Create many primitives around the island (Requirement 2 & 3 & Scene reqs)
// We'll add: boxes, spheres, cylinders, cones, toruses -> total 22+ primitives
const primitives = [];
// Boxes (6)
for (let i = 0; i < 6; i++) {
  const geo = new THREE.BoxGeometry(3, 3, 3);
  const mat = new THREE.MeshStandardMaterial({ map: makePatternTexture('#8aa', true) });
  const m = new THREE.Mesh(geo, mat);
  m.position.set((Math.random() - 0.5) * 30, Math.random() * 4 + 0.5, (Math.random() - 0.5) * 30);
  m.castShadow = true; m.receiveShadow = true;
  scene.add(m); primitives.push(m);
}

// Spheres (5)
for (let i = 0; i < 5; i++) {
  const geo = new THREE.SphereGeometry(1.6, 24, 16);
  const mat = new THREE.MeshStandardMaterial({ color: 0x66ff99 });
  const m = new THREE.Mesh(geo, mat);
  m.position.set((Math.random() - 0.5) * 20, 1.6, (Math.random() - 0.5) * 20);
  m.castShadow = true; m.receiveShadow = true;
  scene.add(m); primitives.push(m);
}

// Cylinders (4)
for (let i = 0; i < 4; i++) {
  const geo = new THREE.CylinderGeometry(1, 1, 4, 16);
  const mat = new THREE.MeshStandardMaterial({ map: makePatternTexture('#886644') });
  const m = new THREE.Mesh(geo, mat);
  m.position.set((Math.random() - 0.5) * 22, 2, (Math.random() - 0.5) * 22);
  m.castShadow = true; m.receiveShadow = true;
  scene.add(m); primitives.push(m);
}

// Cones (4)
for (let i = 0; i < 4; i++) {
  const geo = new THREE.ConeGeometry(1.6, 4, 16);
  const mat = new THREE.MeshStandardMaterial({ color: 0xcc8844 });
  const m = new THREE.Mesh(geo, mat);
  m.position.set((Math.random() - 0.5) * 20, 2, (Math.random() - 0.5) * 20);
  m.castShadow = true; m.receiveShadow = true;
  scene.add(m); primitives.push(m);
}

// Torus (3) - one of these will be animated (Requirement 5 animated primitive)
const torusGroup = new THREE.Group();
scene.add(torusGroup);
for (let i = 0; i < 3; i++) {
  const geo = new THREE.TorusGeometry(2 + i * 0.6, 0.4, 16, 64);
  const mat = new THREE.MeshStandardMaterial({ color: 0xff66aa, metalness: 0.3, roughness: 0.5 });
  const m = new THREE.Mesh(geo, mat);
  m.position.set(6 + i * 2, 6 + i * 0.4, 0);
  m.castShadow = true; m.receiveShadow = true;
  torusGroup.add(m); primitives.push(m);
}

// Make sure we have at least 22 primitives (requirement asks 20+)
// Count included in code comments: boxes(6)+spheres(5)+cylinders(4)+cones(4)+torus(3)=22 primitives

// Buildings / crates (boxes with textures)
for (let i = 0; i < 5; i++) {
  const geo = new THREE.BoxGeometry(2.5, 3 + Math.random() * 4, 2.5);
  const mat = new THREE.MeshStandardMaterial({ map: makePatternTexture('#665533', true) });
  const m = new THREE.Mesh(geo, mat);
  m.position.set((Math.random() - 0.5) * 18, (m.geometry.parameters.height / 2) - 1, (Math.random() - 0.5) * 18);
  m.castShadow = true; m.receiveShadow = true;
  scene.add(m);
}

// Lamps (glowing) - poles with point lights
for (let i = 0; i < 6; i++) {
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4), new THREE.MeshStandardMaterial({ color: 0x334455 }));
  pole.position.set((Math.random() - 0.5) * 30, 2, (Math.random() - 0.5) * 30);
  pole.castShadow = true; pole.receiveShadow = true; scene.add(pole);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 8), new THREE.MeshStandardMaterial({ emissive: 0xffcc88, emissiveIntensity: 1 }));
  bulb.position.set(pole.position.x, 3.1, pole.position.z); scene.add(bulb);
  const pLight = new THREE.PointLight(0xffcc88, 0.8, 12, 2);
  pLight.position.copy(bulb.position); pLight.castShadow = true; scene.add(pLight);
}

// Rocks (using scaled spheres/cylinders)
for (let i = 0; i < 8; i++) {
  const geo = Math.random() > 0.5 ? new THREE.SphereGeometry(1 + Math.random() * 1.2, 12, 10) : new THREE.CylinderGeometry(0.6, 1.2, 1 + Math.random() * 2, 8);
  const mat = new THREE.MeshStandardMaterial({ color: 0x556655 });
  const m = new THREE.Mesh(geo, mat);
  m.position.set((Math.random() - 0.5) * 28, 0.2, (Math.random() - 0.5) * 28);
  m.rotation.y = Math.random() * Math.PI;
  m.scale.setScalar(0.8 + Math.random() * 1.6);
  m.castShadow = true; m.receiveShadow = true; scene.add(m);
}

// Floating objects (animated) - some small orbs orbiting (Requirement: animated floating objects)
const floating = [];
for (let i = 0; i < 8; i++) {
  const geo = new THREE.SphereGeometry(0.4 + Math.random() * 0.6, 12, 8);
  const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(Math.random(), 0.8, 0.5), emissive: 0x002222, emissiveIntensity: 0.2 });
  const m = new THREE.Mesh(geo, mat);
  m.position.set(Math.random() * 20 - 10, 4 + Math.random() * 6, Math.random() * 20 - 10);
  scene.add(m); floating.push({mesh: m, speed: 0.3 + Math.random() * 0.7, radius: 2 + Math.random() * 8, angle: Math.random() * Math.PI * 2});
}

// Custom model (Requirement 6)
const loader = new GLTFLoader();
let customModel = null;
loader.load(
  '/models/model.glb',
  (g) => {
    customModel = g.scene;
    customModel.position.set(-8, 0, -6);
    customModel.scale.setScalar(2.2);
    customModel.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
    scene.add(customModel);
  },
  undefined,
  (err) => {
    console.warn('Model failed to load; adding fallback object.', err);
    // Fallback model: a simple spaceship made of boxes
    const ship = new THREE.Group();
    const body = new THREE.Mesh(new THREE.ConeGeometry(1.2, 4, 12), new THREE.MeshStandardMaterial({ color: 0x8844cc }));
    body.rotation.x = Math.PI / 2; ship.add(body);
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2, 4), new THREE.MeshStandardMaterial({ color: 0x223344 })); wingL.position.set(-1.3, 0, 0); ship.add(wingL);
    const wingR = wingL.clone(); wingR.position.x = 1.3; ship.add(wingR);
    ship.position.set(-8, 2, -6); ship.scale.setScalar(1.8);
    ship.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
    scene.add(ship);
  }
);

// Wow Point: animated glowing alien energy core (Requirement 11 + Wow Point specifics)
const coreGroup = new THREE.Group();
coreGroup.position.set(6, 6, 6);
scene.add(coreGroup);

// glowing sphere
const glowMat = new THREE.MeshStandardMaterial({ color: 0x66ffff, emissive: 0x66eeff, emissiveIntensity: 3, metalness: 0.1, roughness: 0.2 });
const coreSphere = new THREE.Mesh(new THREE.SphereGeometry(1.5, 32, 24), glowMat);
coreSphere.castShadow = true; coreSphere.receiveShadow = true; coreGroup.add(coreSphere);

// point light inside the core (Requirement: PointLight inside core)
const coreLight = new THREE.PointLight(0x66ffdd, 2.2, 30, 2);
coreLight.castShadow = true; coreGroup.add(coreLight);

// rotating torus rings around the core
const coreRings = new THREE.Group(); coreGroup.add(coreRings);
for (let i = 0; i < 3; i++) {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.5 + i * 0.6, 0.12, 8, 64), new THREE.MeshStandardMaterial({ emissive: 0x55eeff, emissiveIntensity: 1.6, color: 0x0033aa }));
  ring.rotation.x = Math.random() * Math.PI;
  coreRings.add(ring);
}

// orbiting small spheres
const orbiters = [];
for (let i = 0; i < 6; i++) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), new THREE.MeshStandardMaterial({ emissive: 0xffee88, color: 0xffcc66 }));
  const a = Math.random() * Math.PI * 2; const r = 2.6 + Math.random() * 2.4; const s = 0.8 + Math.random() * 1.4;
  m.position.set(Math.cos(a) * r, (Math.random() - 0.3) * 0.6, Math.sin(a) * r);
  coreGroup.add(m); orbiters.push({ mesh: m, angle: a, radius: r, speed: s });
}

// animation loop
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  // Rotate one torus continuously (Requirement: rotate at least one object)
  torusGroup.rotation.y = t * 0.6;

  // Bob floating objects and make them orbit (Requirement: bob up/down or move in circle)
  floating.forEach((f, idx) => {
    const m = f.mesh;
    f.angle += 0.01 * f.speed;
    m.position.x = Math.cos(f.angle) * f.radius;
    m.position.z = Math.sin(f.angle) * f.radius;
    m.position.y = 4 + Math.sin(t * f.speed + idx) * 1.2;
    m.rotation.y += 0.01 * (1 + idx * 0.2);
  });

  // Animate core rings and light intensity/color (Wow Point animations)
  coreRings.children.forEach((r, i) => { r.rotation.y = t * (0.6 + i * 0.3); r.rotation.x = t * (0.2 + i * 0.1); });
  coreLight.intensity = 1.6 + Math.sin(t * 3) * 0.6;
  coreLight.color.setHSL(0.55 + Math.sin(t * 2) * 0.02, 0.8, 0.6 + Math.sin(t * 4) * 0.02);

  // Orbiters
  orbiters.forEach(o => { o.angle += 0.02 * o.speed; o.mesh.position.x = Math.cos(o.angle) * o.radius; o.mesh.position.z = Math.sin(o.angle) * o.radius; });

  // keep controls updating
  controls.update();
  renderer.render(scene, camera);
}
animate();

// Initial renderer size (already set in resize handler)
onWindowResize();

// Expose scene info for debugging
window.__APP = { scene, camera, renderer };

// End of main
