function buildPicture() {
  let shapes = [];

  function addTriangle(vertices, color) {
    let t = new Triangle();
    t.color = color.slice();
    t.vertices = vertices.slice();
    shapes.push(t);
  }

  function addRect(x1, y1, x2, y2, color) {
    addTriangle([x1, y1, x2, y1, x1, y2], color);
    addTriangle([x2, y1, x2, y2, x1, y2], color);
  }

  function addQuad(p1, p2, p3, p4, color) {
    addTriangle([p1[0], p1[1], p2[0], p2[1], p3[0], p3[1]], color);
    addTriangle([p1[0], p1[1], p3[0], p3[1], p4[0], p4[1]], color);
  }

  function addDiamond(cx, cy, rx, ry, color) {
    addTriangle([cx, cy, cx, cy + ry, cx + rx, cy], color);
    addTriangle([cx, cy, cx + rx, cy, cx, cy - ry], color);
    addTriangle([cx, cy, cx, cy - ry, cx - rx, cy], color);
    addTriangle([cx, cy, cx - rx, cy, cx, cy + ry], color);
  }

  // Colors
  const ground = [0.15, 0.55, 0.22, 1.0];
  const mountain1 = [0.35, 0.25, 0.65, 1.0];
  const mountain2 = [0.25, 0.45, 0.80, 1.0];
  const snow = [0.95, 0.95, 1.0, 1.0];
  const moon = [1.0, 0.93, 0.45, 1.0];
  const zColor = [1.0, 0.55, 0.10, 1.0];
  const bColor = [0.18, 0.85, 0.95, 1.0];
  const cutout = [0.0, 0.0, 0.0, 1.0];

  // Ground
  addRect(-1.0, -1.0, 1.0, -0.65, ground);

  // Mountains
  addTriangle([-1.0, -0.65, -0.65, 0.12, -0.30, -0.65], mountain1);
  addTriangle([-0.78, -0.08, -0.65, 0.12, -0.52, -0.08], snow);

  addTriangle([-0.45, -0.65, 0.00, 0.35, 0.45, -0.65], mountain2);
  addTriangle([-0.14, 0.02, 0.00, 0.35, 0.14, 0.02], snow);

  addTriangle([0.22, -0.65, 0.62, 0.18, 1.00, -0.65], mountain1);
  addTriangle([0.49, -0.05, 0.62, 0.18, 0.75, -0.05], snow);

  // Moon / star shape
  addDiamond(-0.78, 0.62, 0.14, 0.14, moon);

  // Z for Zach
  addRect(-0.28, 0.30, 0.12, 0.44, zColor);
  addQuad(
    [0.12, 0.30],
    [-0.02, 0.44],
    [-0.30, -0.22],
    [-0.16, -0.36],
    zColor
  );
  addRect(-0.28, -0.36, 0.12, -0.22, zColor);

  // B for Babel
  addRect(0.34, -0.36, 0.46, 0.44, bColor);   // spine
  addRect(0.34, 0.30, 0.72, 0.44, bColor);    // top bar
  addRect(0.34, -0.03, 0.66, 0.11, bColor);   // middle bar
  addRect(0.34, -0.36, 0.72, -0.22, bColor);  // bottom bar
  addRect(0.60, 0.11, 0.72, 0.30, bColor);    // upper right
  addRect(0.60, -0.22, 0.72, -0.03, bColor);  // lower right

  // Cutouts to make the B look more like a B
  addRect(0.46, 0.11, 0.60, 0.30, cutout);
  addRect(0.46, -0.22, 0.60, -0.03, cutout);

  return shapes;
}