import { createProgram } from './glUtils.js';
import { createCube, createSphere, createPlane } from './geometry.js';

async function loadText(url){ const r = await fetch(url); return await r.text(); }

function createGLBuffer(gl, data, itemSize, usage = gl.STATIC_DRAW) {
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), usage);
  return { buf, itemSize, num: data.length / itemSize };
}

function createIndexBuffer(gl, data) {
  const b = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data), gl.STATIC_DRAW);
  return { buf: b, num: data.length };
}

function setAttribute(gl, program, name, bufferInfo) {
  const loc = gl.getAttribLocation(program, name);
  if (loc < 0) return;
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferInfo.buf);
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, bufferInfo.itemSize, gl.FLOAT, false, 0, 0);
}

async function main() {
  const canvas = document.getElementById('glcanvas');
  const gl = canvas.getContext('webgl');
  if (!gl) { alert('WebGL not supported'); return; }
  canvas.width = innerWidth; canvas.height = innerHeight;

  const vsSrc = await loadText('shaders/phong.vert');
  const fsSrc = await loadText('shaders/phong.frag');
  const program = createProgram(gl, vsSrc, fsSrc);
  gl.useProgram(program);

  // locations
  const uni = {
    model: gl.getUniformLocation(program, 'u_model'),
    view: gl.getUniformLocation(program, 'u_view'),
    proj: gl.getUniformLocation(program, 'u_proj'),
    normalMatrix: gl.getUniformLocation(program, 'u_normalMatrix'),
    lightPos: gl.getUniformLocation(program, 'u_lightPos'),
    cameraPos: gl.getUniformLocation(program, 'u_cameraPos'),
    color: gl.getUniformLocation(program, 'u_color'),
    lightOn: gl.getUniformLocation(program, 'u_lightOn'),
    showNormal: gl.getUniformLocation(program, 'u_showNormal'),
    spotOn: gl.getUniformLocation(program, 'u_spotOn'),
    spotPos: gl.getUniformLocation(program, 'u_spotPos'),
    spotDir: gl.getUniformLocation(program, 'u_spotDir'),
    spotCut: gl.getUniformLocation(program, 'u_spotCutoff')
  };

  // create geometries
  const cube = createCube(1);
  const sphere = createSphere(1, 36, 36);
  const plane = createPlane(20);

  function createVAOFromGeom(geom) {
    const posBuf = createGLBuffer(gl, geom.positions, 3);
    const normBuf = createGLBuffer(gl, geom.normals, 3);
    const idxBuf = createIndexBuffer(gl, geom.indices);
    return { posBuf, normBuf, idxBuf };
  }

  const cubeVAO = createVAOFromGeom(cube);
  const sphereVAO = createVAOFromGeom(sphere);
  const planeVAO = createVAOFromGeom(plane);
  let objVAO = null;
  // Simple OBJ loader: supports v and f (triangles), computes normals if missing
  async function loadOBJ(path) {
    const src = await loadText(path);
    const lines = src.split('\n');
    const verts = [];
    const normals = [];
    const faces = [];
    for (let l of lines) {
      l = l.trim(); if (!l || l.startsWith('#')) continue;
      const parts = l.split(/\s+/);
      if (parts[0] === 'v') verts.push([+parts[1], +parts[2], +parts[3]]);
      else if (parts[0] === 'vn') normals.push([+parts[1], +parts[2], +parts[3]]);
      else if (parts[0] === 'f') {
        const idx = parts.slice(1).map(p=>p.split('/').map(x=>x?parseInt(x,10):undefined));
        if (idx.length===3) faces.push(idx);
        else for (let i=1;i<idx.length-1;i++) faces.push([idx[0], idx[i], idx[i+1]]);
      }
    }
    const outPos = [];
    const outNorm = [];
    for (const f of faces) {
      for (const v of f) {
        const vi = v[0]-1; const ni = v[2] ? v[2]-1 : -1;
        const p = verts[vi]; outPos.push(p[0], p[1], p[2]);
        if (ni>=0) { const n = normals[ni]; outNorm.push(n[0], n[1], n[2]); }
        else outNorm.push(0,0,0);
      }
    }
    // if normals were missing, compute averaged per-vertex normals
    let hasNormals = normals.length>0;
    if (!hasNormals) {
      // compute face normals and accumulate
      const accum = new Array(outPos.length).fill(0);
      for (let i=0;i<outPos.length;i+=9) {
        const p0 = [outPos[i], outPos[i+1], outPos[i+2]];
        const p1 = [outPos[i+3], outPos[i+4], outPos[i+5]];
        const p2 = [outPos[i+6], outPos[i+7], outPos[i+8]];
        const u = vec3.create(), v = vec3.create(), n = vec3.create();
        vec3.subtract(u, p1, p0); vec3.subtract(v, p2, p0); vec3.cross(n, u, v); vec3.normalize(n, n);
        for (let k=0;k<3;k++) { accum[i+3*k]+=n[0]; accum[i+3*k+1]+=n[1]; accum[i+3*k+2]+=n[2]; }
      }
      for (let i=0;i<accum.length;i+=3) { const n = vec3.fromValues(accum[i],accum[i+1],accum[i+2]); vec3.normalize(n,n); outNorm[i]=n[0]; outNorm[i+1]=n[1]; outNorm[i+2]=n[2]; }
    }
    const posBuf = createGLBuffer(gl, outPos, 3);
    const normBuf = createGLBuffer(gl, outNorm, 3);
    // create index array sequential
    const idx = new Uint16Array(outPos.length/3);
    for (let i=0;i<idx.length;i++) idx[i]=i;
    const idxBuf = createIndexBuffer(gl, idx);
    return { posBuf, normBuf, idxBuf };
  }
  // try to load assets/simple.obj if present
  loadOBJ('assets/simple.obj').then(v=>{ objVAO = v; }).catch(()=>{ /* ignore */ });

  // set common attributes function
  function bindAttributes(vao) {
    setAttribute(gl, program, 'a_position', vao.posBuf);
    setAttribute(gl, program, 'a_normal', vao.normBuf);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vao.idxBuf.buf);
  }

  // camera
  const cam = { theta: 0.4, phi: 0.4, radius: 8 };
  let mouseDown=false, lastX=0, lastY=0;
  canvas.addEventListener('mousedown', (e)=>{ mouseDown=true; lastX=e.clientX; lastY=e.clientY; });
  window.addEventListener('mouseup', ()=>mouseDown=false);
  window.addEventListener('mousemove', (e)=>{ if(!mouseDown) return; const dx=(e.clientX-lastX)/200; const dy=(e.clientY-lastY)/200; lastX=e.clientX; lastY=e.clientY; cam.theta+=dx; cam.phi=Math.max(0.05, Math.min(Math.PI-0.05, cam.phi+dy)); });
  canvas.addEventListener('wheel', (e)=>{ cam.radius += e.deltaY * 0.01; cam.radius = Math.max(2, Math.min(50, cam.radius)); });

  // UI
  const toggleLightBtn = document.getElementById('toggleLight');
  const toggleNormalBtn = document.getElementById('toggleNormal');
  const toggleSpotBtn = document.getElementById('toggleSpot');
  const lightAngle = document.getElementById('lightAngle');
  const lightRadius = document.getElementById('lightRadius');
  let lightOn = true, showNormal=false, spotOn=true;
  toggleLightBtn.onclick = ()=> lightOn = !lightOn;
  toggleNormalBtn.onclick = ()=> showNormal = !showNormal;
  toggleSpotBtn.onclick = ()=> spotOn = !spotOn;

  gl.enable(gl.DEPTH_TEST);

  function drawObject(vao, modelMat, color) {
    bindAttributes(vao);
    // normal matrix
    const normalMat = mat3.create();
    mat3.normalFromMat4(normalMat, modelMat);
    gl.uniformMatrix4fv(uni.model, false, modelMat);
    gl.uniformMatrix3fv(uni.normalMatrix, false, normalMat);
    gl.uniform4fv(uni.color, color);
    gl.drawElements(gl.TRIANGLES, vao.idxBuf.num, gl.UNSIGNED_SHORT, 0);
  }

  function resize() { canvas.width = innerWidth; canvas.height = innerHeight; gl.viewport(0,0,canvas.width,canvas.height); }
  window.addEventListener('resize', resize); resize();

  const projMat = mat4.create();
  const viewMat = mat4.create();
  const modelMat = mat4.create();

  let t0 = performance.now();
  function render(t) {
    const dt = (t - t0) * 0.001; t0 = t;
    gl.clearColor(0.6,0.8,1.0,1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // camera
    const camX = cam.radius * Math.sin(cam.phi) * Math.cos(cam.theta);
    const camY = cam.radius * Math.cos(cam.phi);
    const camZ = cam.radius * Math.sin(cam.phi) * Math.sin(cam.theta);
    const eye = vec3.fromValues(camX, camY, camZ);
    const center = vec3.fromValues(0,0,0);
    const up = vec3.fromValues(0,1,0);
    mat4.perspective(projMat, Math.PI/4, canvas.width/canvas.height, 0.1, 100.0);
    mat4.lookAt(viewMat, eye, center, up);
    gl.uniformMatrix4fv(uni.view, false, viewMat);
    gl.uniformMatrix4fv(uni.proj, false, projMat);
    gl.uniform3fv(uni.cameraPos, eye);
    gl.uniform1i(uni.lightOn, lightOn);
    gl.uniform1i(uni.showNormal, showNormal);
    gl.uniform1i(uni.spotOn, spotOn);

    // light animation
    const angleDeg = parseFloat(lightAngle.value);
    const angle = (angleDeg * Math.PI/180) + t*0.0005;
    const radius = parseFloat(lightRadius.value);
    const lightPos = [radius * Math.cos(angle), 2.0 + Math.sin(t*0.001)*0.5, radius * Math.sin(angle)];
    gl.uniform3fv(uni.lightPos, lightPos);

    // spotlight params (pointing downwards from above)
    const spotPos = [0,5,0];
    const spotDir = [0,-1,0];
    gl.uniform3fv(uni.spotPos, spotPos);
    gl.uniform3fv(uni.spotDir, spotDir);
    gl.uniform1f(uni.spotCut, Math.cos(radians(25)));

    // draw ground
    mat4.identity(modelMat);
    mat4.translate(modelMat, modelMat, [0,-1,0]);
    mat4.scale(modelMat, modelMat, [1,1,1]);
    drawObject(planeVAO, modelMat, [0.8,0.8,0.8,1.0]);

    // draw cube
    mat4.identity(modelMat);
    mat4.translate(modelMat, modelMat, [-2,0,0]);
    mat4.rotateY(modelMat, modelMat, t*0.0007);
    drawObject(cubeVAO, modelMat, [1.0,0.3,0.3,1.0]);

    // draw sphere
    mat4.identity(modelMat);
    mat4.translate(modelMat, modelMat, [2,0,0]);
    mat4.rotateY(modelMat, modelMat, t*0.0009);
    mat4.scale(modelMat, modelMat, [1,1,1]);
    drawObject(sphereVAO, modelMat, [0.3,0.6,1.0,1.0]);

    // draw OBJ model if loaded
    if (objVAO) {
      mat4.identity(modelMat);
      mat4.translate(modelMat, modelMat, [0,0, -3]);
      mat4.scale(modelMat, modelMat, [1,1,1]);
      drawObject(objVAO, modelMat, [0.9,0.7,0.5,1.0]);
    }

    // draw light cube marker
    mat4.identity(modelMat);
    mat4.translate(modelMat, modelMat, lightPos);
    mat4.scale(modelMat, modelMat, [0.15,0.15,0.15]);
    drawObject(cubeVAO, modelMat, [1.0,1.0,0.2,1.0]);

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

function radians(d){ return d * Math.PI / 180; }

main().catch(e=>{ console.error(e); alert(e.message); });
