// Shader programs
var VSHADER_SOURCE = 'attribute vec4 a_Position;\nuniform float u_Size;\nvoid main() {\n  gl_Position = a_Position;\n  gl_PointSize = u_Size;\n}';

var FSHADER_SOURCE = 'precision mediump float;\nuniform vec4 u_FragColor;\nvoid main() {\n  gl_FragColor = u_FragColor;\n}';

// Globals
var canvas;
var gl;
var a_Position;
var u_FragColor;
var u_Size;

const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

var g_selectedType = POINT;
var g_selectedColor = [1.0, 0.0, 0.0, 1.0];
var g_selectedSize = 12;
var g_selectedSegments = 12;

var g_shapesList = [];
var g_lastPaintPos = null;

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  addActionsForHtmlUI();

  canvas.onmousedown = function(ev) {
    click(ev);
  };

  canvas.onmousemove = function(ev) {
    if (ev.buttons === 1) {
      click(ev);
    }
  };

  canvas.onmouseup = function() {
    g_lastPaintPos = null;
  };

  canvas.onmouseleave = function() {
    g_lastPaintPos = null;
  };

  canvas.oncontextmenu = function(ev) {
    ev.preventDefault();
  };

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  renderAllShapes();
  updateSliderText();
}

function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });

  if (!gl) {
    gl = canvas.getContext('experimental-webgl', { preserveDrawingBuffer: true });
  }

  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.');
    return;
  }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get storage location of a_Position');
    return;
  }

  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get storage location of u_FragColor');
    return;
  }

  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get storage location of u_Size');
    return;
  }
}

function addActionsForHtmlUI() {
  document.getElementById('pointButton').onclick = function() {
    g_selectedType = POINT;
  };

  document.getElementById('triButton').onclick = function() {
    g_selectedType = TRIANGLE;
  };

  document.getElementById('circleButton').onclick = function() {
    g_selectedType = CIRCLE;
  };

  document.getElementById('clearButton').onclick = function() {
    g_shapesList = [];
    g_lastPaintPos = null;
    renderAllShapes();
  };

  document.getElementById('pictureButton').onclick = function() {
    g_shapesList = buildPicture();
    g_lastPaintPos = null;
    renderAllShapes();
  };

  document.getElementById('redSlide').oninput = function() {
    g_selectedColor[0] = this.value / 100;
    updateSliderText();
  };

  document.getElementById('greenSlide').oninput = function() {
    g_selectedColor[1] = this.value / 100;
    updateSliderText();
  };

  document.getElementById('blueSlide').oninput = function() {
    g_selectedColor[2] = this.value / 100;
    updateSliderText();
  };

  document.getElementById('sizeSlide').oninput = function() {
    g_selectedSize = Number(this.value);
    updateSliderText();
  };

  document.getElementById('segmentSlide').oninput = function() {
    g_selectedSegments = Number(this.value);
    updateSliderText();
  };
}

function updateSliderText() {
  document.getElementById('redValue').textContent = Math.round(g_selectedColor[0] * 100);
  document.getElementById('greenValue').textContent = Math.round(g_selectedColor[1] * 100);
  document.getElementById('blueValue').textContent = Math.round(g_selectedColor[2] * 100);
  document.getElementById('sizeValue').textContent = g_selectedSize;
  document.getElementById('segmentValue').textContent = g_selectedSegments;
}

function click(ev) {
  let [x, y] = convertCoordinatesEventToGL(ev);

  if (ev.type === 'mousemove' && g_lastPaintPos !== null) {
    let dx = x - g_lastPaintPos[0];
    let dy = y - g_lastPaintPos[1];
    let dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < (g_selectedSize / canvas.width) * 2.0) {
      return;
    }
  }

  let shape;

  if (g_selectedType === POINT) {
    shape = new Point();
  } else if (g_selectedType === TRIANGLE) {
    shape = new Triangle();
  } else {
    shape = new Circle();
    shape.segments = g_selectedSegments;
  }

  shape.position = [x, y];
  shape.color = g_selectedColor.slice();
  shape.size = g_selectedSize;

  g_shapesList.push(shape);
  g_lastPaintPos = [x, y];

  renderAllShapes();
}

function convertCoordinatesEventToGL(ev) {
  let rect = ev.target.getBoundingClientRect();

  let x = ev.clientX - rect.left;
  let y = ev.clientY - rect.top;

  x = (x - canvas.width / 2) / (canvas.width / 2);
  y = (canvas.height / 2 - y) / (canvas.height / 2);

  return [x, y];
}

function renderAllShapes() {
  let startTime = performance.now();

  gl.clear(gl.COLOR_BUFFER_BIT);

  for (let i = 0; i < g_shapesList.length; i++) {
    g_shapesList[i].render();
  }

  let duration = performance.now() - startTime;
  document.getElementById('status').textContent =
    'Shapes: ' + g_shapesList.length + ' | Render: ' + duration.toFixed(2) + ' ms';
}