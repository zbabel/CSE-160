// Three.js Assignment - Alien Island Base
// Following the structured tutorials from three.js.org

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// ============================================
// 1. CREATE A SIMPLE THREE.JS SCENE
// ============================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x001a33);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(30, 25, 40);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('app').appendChild(renderer.domElement);

// ============================================
// 2. ADD TEXTURES - Helper function
// ============================================
function createCanvasTexture(color, pattern = false) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 256, 256);
  
  if (pattern) {
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 256; i += 16) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 256);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(256, i);
      ctx.stroke();
    }
  }
  
  return new THREE.CanvasTexture(canvas);
}

// ============================================
// 5. ADD EXTRA LIGHT SOURCES (3+ types)
// ============================================
// Ambient Light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Directional Light (Sun)
const dirLight = new THREE.DirectionalLight(0xfff0cc, 0.8);
dirLight.position.set(50, 50, 30);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.camera.left = -100;
dirLight.shadow.camera.right = 100;
dirLight.shadow.camera.top = 100;
dirLight.shadow.camera.bottom = -100;
scene.add(dirLight);

// Hemisphere Light
const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x3d2817, 0.4);
scene.add(hemiLight);

// Spot Light
const spotLight = new THREE.SpotLight(0xff6600, 1.2, 100, Math.PI / 6, 0.5, 2);
spotLight.position.set(-30, 40, -30);
spotLight.castShadow = true;
scene.add(spotLight);

// Point Light
const pointLight = new THREE.PointLight(0x00ff88, 0.8, 50);
pointLight.position.set(0, 20, 0);
pointLight.castShadow = true;
scene.add(pointLight);

// ============================================
// 6. ADD A SKYBOX
// ============================================
const skyboxTextures = [];
for (let i = 0; i < 6; i++) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  // Gradient background
  const gradient = ctx.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, '#0d1b2a');
  gradient.addColorStop(1, '#1b4965');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);
  
  // Add stars
  ctx.fillStyle = 'white';
  for (let j = 0; j < 100; j++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const size = Math.random() * 2;
    ctx.globalAlpha = Math.random() * 0.8;
    ctx.fillRect(x, y, size, size);
  }
  ctx.globalAlpha = 1;
  
  skyboxTextures.push(new THREE.CanvasTexture(canvas));
}

const skyboxGeometry = new THREE.BoxGeometry(1000, 1000, 1000);
const skyboxMaterials = skyboxTextures.map(tex => 
  new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide })
);
const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterials);
scene.add(skybox);

// ============================================
// 7. ADD MORE 3D OBJECTS (20+)
// ============================================

// Ground/Island
const islandTex = createCanvasTexture('#2d5016', true);
const islandGeo = new THREE.CylinderGeometry(30, 40, 8, 64);
const islandMat = new THREE.MeshStandardMaterial({ map: islandTex, roughness: 0.8 });
const island = new THREE.Mesh(islandGeo, islandMat);
island.castShadow = true;
island.receiveShadow = true;
island.position.y = -4;
scene.add(island);

// Helper group for primitives
const primitivesGroup = new THREE.Group();
scene.add(primitivesGroup);
let primitiveCount = 0;

// Helper function to add a primitive with shadow
function addPrimitive(geometry, material, x, y, z, scale = 1) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.scale.setScalar(scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  primitivesGroup.add(mesh);
  primitiveCount++;
  return mesh;
}

// Boxes (5)
for (let i = 0; i < 5; i++) {
  const boxTex = createCanvasTexture('#8b6f47', true);
  const boxGeo = new THREE.BoxGeometry(3, 3, 3);
  const boxMat = new THREE.MeshStandardMaterial({ map: boxTex });
  addPrimitive(boxGeo, boxMat, 
    (Math.random() - 0.5) * 30, 
    Math.random() * 4 + 1.5, 
    (Math.random() - 0.5) * 30
  );
}

// Spheres (4)
for (let i = 0; i < 4; i++) {
  const sphereGeo = new THREE.SphereGeometry(2, 32, 32);
  const sphereMat = new THREE.MeshStandardMaterial({ 
    color: new THREE.Color().setHSL(Math.random(), 0.8, 0.6),
    metalness: 0.3,
    roughness: 0.4
  });
  addPrimitive(sphereGeo, sphereMat, 
    (Math.random() - 0.5) * 25, 
    2.5, 
    (Math.random() - 0.5) * 25
  );
}

// Cylinders (4)
for (let i = 0; i < 4; i++) {
  const cylTex = createCanvasTexture('#cd853f');
  const cylGeo = new THREE.CylinderGeometry(1.2, 1.2, 4, 16);
  const cylMat = new THREE.MeshStandardMaterial({ map: cylTex });
  addPrimitive(cylGeo, cylMat, 
    (Math.random() - 0.5) * 25, 
    2, 
    (Math.random() - 0.5) * 25
  );
}

// Cones (4)
for (let i = 0; i < 4; i++) {
  const coneGeo = new THREE.ConeGeometry(1.5, 4, 16);
  const coneMat = new THREE.MeshStandardMaterial({ color: 0xff9500 });
  addPrimitive(coneGeo, coneMat, 
    (Math.random() - 0.5) * 25, 
    2.5, 
    (Math.random() - 0.5) * 25
  );
}

// Toruses (3)
for (let i = 0; i < 3; i++) {
  const torusGeo = new THREE.TorusGeometry(2 + i * 0.5, 0.5, 16, 64);
  const torusMat = new THREE.MeshStandardMaterial({ color: 0xff1493 });
  addPrimitive(torusGeo, torusMat, 
    5 + i * 3, 
    5 + i * 1, 
    5
  );
}

// Pyramids (made with cone geometry) (3)
for (let i = 0; i < 3; i++) {
  const pyramidGeo = new THREE.ConeGeometry(2, 3, 4);
  const pyramidMat = new THREE.MeshStandardMaterial({ color: 0x4b0082 });
  addPrimitive(pyramidGeo, pyramidMat, 
    (Math.random() - 0.5) * 25, 
    2.5, 
    (Math.random() - 0.5) * 25
  );
}

// Dodecahedrons (2)
for (let i = 0; i < 2; i++) {
  const dodecaGeo = new THREE.DodecahedronGeometry(1.5);
  const dodecaMat = new THREE.MeshStandardMaterial({ color: 0x20b2aa });
  addPrimitive(dodecaGeo, dodecaMat, 
    (Math.random() - 0.5) * 25, 
    2.5, 
    (Math.random() - 0.5) * 25
  );
}

// Octahedrons (2)
for (let i = 0; i < 2; i++) {
  const octaGeo = new THREE.OctahedronGeometry(1.5);
  const octaMat = new THREE.MeshStandardMaterial({ color: 0xffd700 });
  addPrimitive(octaGeo, octaMat, 
    (Math.random() - 0.5) * 25, 
    2.5, 
    (Math.random() - 0.5) * 25
  );
}

// Tetrahedrons (1)
const tetraGeo = new THREE.TetrahedronGeometry(2);
const tetraMat = new THREE.MeshStandardMaterial({ color: 0xff6347 });
addPrimitive(tetraGeo, tetraMat, 0, 3, 0);

console.log(`Total primitives: ${primitiveCount}`);

// ============================================
// 3. ADD A CUSTOM 3D MODEL
// ============================================
const loader = new GLTFLoader();
let modelLoaded = false;

loader.load(
  './models/model.glb',
  (gltf) => {
    const model = gltf.scene;
    model.position.set(-15, 0, -15);
    model.scale.setScalar(2);
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    scene.add(model);
    modelLoaded = true;
    console.log('Custom model loaded');
  },
  undefined,
  (error) => {
    console.warn('Model not found, using fallback:', error);
    // Fallback: simple cone spaceship
    const shipGroup = new THREE.Group();
    const bodyGeo = new THREE.ConeGeometry(1.5, 4, 8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1e90ff });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.z = Math.PI / 2;
    body.castShadow = true;
    shipGroup.add(body);
    
    const wingGeo = new THREE.BoxGeometry(0.3, 2, 3);
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const wing1 = new THREE.Mesh(wingGeo, wingMat);
    wing1.position.y = 1;
    wing1.castShadow = true;
    shipGroup.add(wing1);
    
    const wing2 = wing1.clone();
    wing2.position.y = -1;
    shipGroup.add(wing2);
    
    shipGroup.position.set(-15, 2, -15);
    shipGroup.scale.setScalar(1.8);
    scene.add(shipGroup);
  }
);

// ============================================
// 4. ADD CONTROLS TO CAMERA (OrbitControls)
// ============================================
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 5, 0);
controls.autoRotate = false;
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.update();

// ============================================
// 8. WOW POINT - Animated glowing energy core
// ============================================
const coreGroup = new THREE.Group();
coreGroup.position.set(10, 10, 10);
scene.add(coreGroup);

const coreSphere = new THREE.Mesh(
  new THREE.SphereGeometry(2, 32, 32),
  new THREE.MeshStandardMaterial({
    color: 0x00ffff,
    emissive: 0x00ffff,
    emissiveIntensity: 2,
    metalness: 0.5,
    roughness: 0.2
  })
);
coreSphere.castShadow = true;
coreGroup.add(coreSphere);

const coreLight = new THREE.PointLight(0x00ffff, 3, 60);
coreLight.castShadow = true;
coreGroup.add(coreLight);

// Orbiting particles around core
const orbiterCount = 8;
const orbiters = [];
for (let i = 0; i < orbiterCount; i++) {
  const angle = (i / orbiterCount) * Math.PI * 2;
  const orbGeo = new THREE.SphereGeometry(0.3, 16, 16);
  const orbMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(0.55, 1, 0.6),
    emissive: 0xffff00,
    emissiveIntensity: 1
  });
  const orb = new THREE.Mesh(orbGeo, orbMat);
  orb.position.set(Math.cos(angle) * 4, Math.sin(angle) * 2, Math.sin(angle) * 4);
  coreGroup.add(orb);
  orbiters.push({
    mesh: orb,
    angle: angle,
    radius: 4,
    speed: 0.02 + Math.random() * 0.01
  });
}

// ============================================
// ANIMATION LOOP
// ============================================
function animate() {
  requestAnimationFrame(animate);
  
  const time = Date.now() * 0.001;
  
  // Rotate first torus group
  primitivesGroup.rotation.y += 0.003;
  
  // Animate core
  coreSphere.rotation.x += 0.005;
  coreSphere.rotation.y += 0.003;
  coreLight.intensity = 2 + Math.sin(time * 2) * 0.8;
  
  // Animate orbiters
  orbiters.forEach((orb, idx) => {
    orb.angle += orb.speed;
    orb.mesh.position.x = Math.cos(orb.angle) * orb.radius;
    orb.mesh.position.y = Math.sin(orb.angle * 0.5) * 2;
    orb.mesh.position.z = Math.sin(orb.angle) * orb.radius;
    orb.mesh.rotation.x += 0.02;
    orb.mesh.rotation.y += 0.03;
  });
  
  controls.update();
  renderer.render(scene, camera);
}

// ============================================
// HANDLE WINDOW RESIZE
// ============================================
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start animation
animate();

// Expose for debugging
window.scene = scene;
window.camera = camera;
