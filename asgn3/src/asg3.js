// Shaders

var VERTEX_SHADER = `
    precision mediump float;

    attribute vec3 a_Position;
    attribute vec3 a_Color;
    attribute vec2 a_UV;

    varying vec3 v_Color;
    varying vec2 v_UV;

    uniform mat4 u_ModelMatrix;
    uniform mat4 u_viewMatrix;
    uniform mat4 u_projectionMatrix;

    void main() {
        v_Color = a_Color;
        v_UV = a_UV;
        gl_Position = u_projectionMatrix * u_viewMatrix * u_ModelMatrix * vec4(a_Position, 1.0);
    }
`;

var FRAGMENT_SHADER = `
    precision mediump float;

    varying vec3 v_Color;
    varying vec2 v_UV;

    uniform sampler2D u_Sampler;
    uniform vec4 u_BaseColor;
    uniform float u_texColorWeight;

    void main() {
        vec4 texColor = texture2D(u_Sampler, v_UV);
        vec4 baseColor = u_BaseColor * vec4(v_Color, 1.0);
        gl_FragColor = mix(baseColor, texColor, u_texColorWeight);
    }
`;

let gl;
let camera;
let texture;
let worldMap = [];
let worldShapes = [];
let staticShapes = [];
let sharedCube = null;
let staticBuffer = null;
let worldBuffer = null;
let staticVertexCount = 0;
let worldVertexCount = 0;
let u_ModelMatrixLoc;
let u_ViewMatrixLoc;
let u_ProjectionMatrixLoc;
let u_BaseColorLoc;
let u_TexColorWeightLoc;
let u_SamplerLoc;
let lastFrameTime = 0;
let fpsCounter = null;

const WORLD_SIZE = 32;
const TILE_SPACING = 1.0;
const MAP_OFFSET = (WORLD_SIZE - 1) / 2;
const MAX_WALL_HEIGHT = 4;

const WORLD_MAP_RAW = [
  "22222222222222222222222222222222",
  "20000000000000000000000000000002",
  "20003333000000000000003333000002",
  "20003223000001111000002223000002",
  "20003333000001001000003333000002",
  "20000000000001111000000000000002",
  "20000000000000000000000000000002",
  "20001111000000000000001111000002",
  "20001001000000000000001001000002",
  "20001111000003333300001111000002",
  "20000000000003434000000000000002",
  "20000000000003434000000000000002",
  "20011111100003434000001111110002",
  "20010000100000000000001000010002",
  "20010000100044440000001000010002",
  "20011111100040004000001111110002",
  "20000000000040004000000000000002",
  "20000022222000000000002222200002",
  "20000021112000000000002111200002",
  "20000022222000000000002222200002",
  "20000000000000000000000000000002",
  "20000000000000000000000000000002",
  "20003333000000000000003333000002",
  "20003003000000000000003003000002",
  "20003333000000000000003333000002",
  "20000000000000000000000000000002",
  "20002222220000000000222222000002",
  "20002111220000000000211122000002",
  "20002222220000000000222222000002",
  "20000000000000000000000000000002",
  "20000000000000000000000000000002",
  "22222222222222222222222222222222"
];

function parseWorldMap() {
  worldMap = WORLD_MAP_RAW.map(row => row.split("").map(ch => parseInt(ch, 10)));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function createCube(x, y, z, color, texWeight = 1.0) {
  let shape = new cube();
  shape.baseColor = new Float32Array(color);
  shape.texWeight = texWeight;
  shape.translate(x, y, z);
  shape.scale(0.5, 0.5, 0.5);
  shape.updateModelMatrix();
  return shape;
}

function appendShapeVertices(target, shape) {
  const src = sharedCube.vertices;
  const m = shape.modelMatrix.elements;
  for (let i = 0; i < src.length; i += 8) {
    const x = src[i];
    const y = src[i + 1];
    const z = src[i + 2];
    const u = src[i + 6];
    const v = src[i + 7];
    const tx = m[0] * x + m[4] * y + m[8] * z + m[12];
    const ty = m[1] * x + m[5] * y + m[9] * z + m[13];
    const tz = m[2] * x + m[6] * y + m[10] * z + m[14];
    target.push(tx, ty, tz, shape.baseColor[0], shape.baseColor[1], shape.baseColor[2], u, v);
  }
}

function buildBufferFromShapes(buffer, shapesArray) {
  const vertexData = [];
  for (const shape of shapesArray) {
    appendShapeVertices(vertexData, shape);
  }
  const typed = new Float32Array(vertexData);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, typed, gl.STATIC_DRAW);
  return typed.length / 8;
}

function buildSky() {
  let sky = createCube(0, 0, 0, [0.48, 0.75, 0.95, 1.0], 0.0);
  sky.scale(100, 100, 100);
  sky.updateModelMatrix();
  staticShapes.push(sky);
}

function buildGround() {
  let ground = createCube(0, -0.05, 0, [0.18, 0.65, 0.24, 1.0], 0.0);
  ground.scale(MAP_OFFSET + 0.5, 0.05, MAP_OFFSET + 0.5);
  ground.updateModelMatrix();
  staticShapes.push(ground);
}

function buildCreature() {
  let body = createCube(3.5, 0.35, 4.0, [0.85, 0.35, 0.30, 1.0], 0.0);
  body.scale(0.4, 0.4, 0.8);
  body.updateModelMatrix();
  staticShapes.push(body);

  let head = createCube(3.5, 0.95, 4.0, [0.95, 0.45, 0.40, 1.0], 0.0);
  head.scale(0.3, 0.3, 0.3);
  head.updateModelMatrix();
  staticShapes.push(head);

  let leftLeg = createCube(3.0, 0.15, 3.6, [0.75, 0.25, 0.22, 1.0], 0.0);
  leftLeg.scale(0.15, 0.3, 0.15);
  leftLeg.updateModelMatrix();
  staticShapes.push(leftLeg);

  let rightLeg = createCube(4.0, 0.15, 3.6, [0.75, 0.25, 0.22, 1.0], 0.0);
  rightLeg.scale(0.15, 0.3, 0.15);
  rightLeg.updateModelMatrix();
  staticShapes.push(rightLeg);

  let signPost = createCube(5.8, 0.55, 5.0, [0.35, 0.20, 0.10, 1.0], 0.0);
  signPost.scale(0.1, 0.9, 0.1);
  signPost.updateModelMatrix();
  staticShapes.push(signPost);

  let signBoard = createCube(5.8, 1.05, 5.0, [0.95, 0.85, 0.40, 1.0], 0.0);
  signBoard.scale(0.6, 0.2, 0.05);
  signBoard.updateModelMatrix();
  staticShapes.push(signBoard);
}

function buildStoryPath() {
  let pathColor = [0.45, 0.35, 0.25, 1.0];
  for (let i = 10; i < 14; i++) {
    let pathBlock = createCube(i - MAP_OFFSET, 0.05, -4.5, pathColor, 0.0);
    pathBlock.scale(0.45, 0.02, 0.45);
    pathBlock.updateModelMatrix();
    staticShapes.push(pathBlock);
  }
}

function buildWorldBlocks() {
  worldShapes = [];
  for (let row = 0; row < WORLD_SIZE; row++) {
    for (let col = 0; col < WORLD_SIZE; col++) {
      let height = worldMap[row][col];
      if (height <= 0) {
        continue;
      }
      let worldX = (col - MAP_OFFSET) * TILE_SPACING;
      let worldZ = (row - MAP_OFFSET) * TILE_SPACING;
      for (let level = 0; level < height; level++) {
        let block = createCube(worldX, 0.5 + level * 1.0, worldZ, [0.9, 0.85, 0.75, 1.0], 1.0);
        worldShapes.push(block);
      }
    }
  }
}

function rebuildWorld() {
  buildWorldBlocks();
  worldVertexCount = buildBufferFromShapes(worldBuffer, worldShapes);
}

function setupScene() {
  staticShapes = [];
  parseWorldMap();
  buildSky();
  buildGround();
  buildCreature();
  buildStoryPath();
  buildWorldBlocks();
  staticVertexCount = buildBufferFromShapes(staticBuffer, staticShapes);
  worldVertexCount = buildBufferFromShapes(worldBuffer, worldShapes);
}

function initUniformLocations() {
  u_ModelMatrixLoc = gl.getUniformLocation(gl.program, "u_ModelMatrix");
  u_ViewMatrixLoc = gl.getUniformLocation(gl.program, "u_viewMatrix");
  u_ProjectionMatrixLoc = gl.getUniformLocation(gl.program, "u_projectionMatrix");
  u_BaseColorLoc = gl.getUniformLocation(gl.program, "u_BaseColor");
  u_TexColorWeightLoc = gl.getUniformLocation(gl.program, "u_texColorWeight");
  u_SamplerLoc = gl.getUniformLocation(gl.program, "u_Sampler");
  gl.uniform1i(u_SamplerLoc, 0);
  let identity = new Matrix4();
  identity.setIdentity();
  gl.uniformMatrix4fv(u_ModelMatrixLoc, false, identity.elements);
}

function loadWorld(){
  texture = gl.createTexture();
  let img = new Image();
  img.src = "../textures/block.jpg";
  img.onload = function(){
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
    setupScene();
    requestAnimationFrame(animate);
  };
  img.onerror = function() {
    console.error("Failed to load texture.");
    setupScene();
    requestAnimationFrame(animate);
  };
}

function animate(){
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.uniformMatrix4fv(u_ViewMatrixLoc, false, camera.viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrixLoc, false, camera.projectionMatrix.elements);

  gl.bindBuffer(gl.ARRAY_BUFFER, staticBuffer);
  setVertexAttribPointers();
  gl.uniform4fv(u_BaseColorLoc, new Float32Array([1, 1, 1, 1]));
  gl.uniform1f(u_TexColorWeightLoc, 0.0);
  gl.drawArrays(gl.TRIANGLES, 0, staticVertexCount);

  gl.bindBuffer(gl.ARRAY_BUFFER, worldBuffer);
  setVertexAttribPointers();
  gl.uniform4fv(u_BaseColorLoc, new Float32Array([1, 1, 1, 1]));
  gl.uniform1f(u_TexColorWeightLoc, 1.0);
  gl.drawArrays(gl.TRIANGLES, 0, worldVertexCount);

  let now = performance.now();
  if (lastFrameTime) {
    let fps = 1000 / (now - lastFrameTime);
    if (fpsCounter) {
      fpsCounter.textContent = `FPS: ${fps.toFixed(1)}`;
    }
  }
  lastFrameTime = now;

  requestAnimationFrame(animate);
}

function setVertexAttribPointers(){
  let FLOAT_SIZE = Float32Array.BYTES_PER_ELEMENT;
  let a_Position = gl.getAttribLocation(gl.program, "a_Position");
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 8 * FLOAT_SIZE, 0);
  gl.enableVertexAttribArray(a_Position);

  let a_Color = gl.getAttribLocation(gl.program, "a_Color");
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, 8 * FLOAT_SIZE, 3 * FLOAT_SIZE);
  gl.enableVertexAttribArray(a_Color);

  let a_UV = gl.getAttribLocation(gl.program, "a_UV");
  gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 8 * FLOAT_SIZE, 6 * FLOAT_SIZE);
  gl.enableVertexAttribArray(a_UV);
}

function getMapIndexForPosition(worldX, worldZ) {
  let col = Math.round(worldX / TILE_SPACING + MAP_OFFSET);
  let row = Math.round(worldZ / TILE_SPACING + MAP_OFFSET);
  col = clamp(col, 0, WORLD_SIZE - 1);
  row = clamp(row, 0, WORLD_SIZE - 1);
  return {row, col};
}

function getTargetMapCell() {
  let targetX = camera.eye.elements[0] + camera.direction.elements[0] * 2.0;
  let targetZ = camera.eye.elements[2] + camera.direction.elements[2] * 2.0;
  return getMapIndexForPosition(targetX, targetZ);
}

function keydown(ev) {
  switch (ev.code) {
    case "KeyW":
      camera.moveForward();
      break;
    case "KeyS":
      camera.moveBackwards();
      break;
    case "KeyA":
      camera.moveRight();
      break;
    case "KeyD":
      camera.moveLeft();
      break;
    case "KeyQ":
      camera.panRight();
      break;
    case "KeyE":
      camera.panLeft();
      break;
    case "KeyF": {
      let {row, col} = getTargetMapCell();
      if (worldMap[row][col] < MAX_WALL_HEIGHT) {
        worldMap[row][col] += 1;
        rebuildWorld();
      }
      break;
    }
    case "KeyR": {
      let {row, col} = getTargetMapCell();
      if (worldMap[row][col] > 0) {
        worldMap[row][col] -= 1;
        rebuildWorld();
      }
      break;
    }
    default:
      return;
  }

  ev.preventDefault();
}

function main() {
  let canvas = document.getElementById("webgl");
  gl = getWebGLContext(canvas);
  if (!gl) {
    console.error("Failed to get WebGL context.");
    return -1;
  }

  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0.5, 0.8, 1.0, 1.0);

  if (!initShaders(gl, VERTEX_SHADER, FRAGMENT_SHADER)) {
    console.error("Failed to compile and load shaders.");
    return -1;
  }

  staticBuffer = gl.createBuffer();
  worldBuffer = gl.createBuffer();
  sharedCube = new cube();

  camera = new Camera(canvas.width / canvas.height, 0.1, 1000);
  initUniformLocations();

  document.addEventListener("keydown", keydown);
  fpsCounter = document.getElementById("fps-display");

  canvas.onclick = function() {
    canvas.requestPointerLock();
  };

  document.addEventListener("mousemove", function(ev) {
    if (document.pointerLockElement === canvas) {
      camera.panRight(ev.movementX * 0.12);
    }
  });

  loadWorld();
}
