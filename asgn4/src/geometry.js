// Geometry generators: positions and normals
export function createCube(size = 1) {
  const s = size / 2;
  // 6 faces, 2 triangles each, 4 verts per face -> 24 vertices
  const positions = [
    // +X
    s, -s, -s,  s, -s, s,  s, s, s,  s, s, -s,
    // -X
    -s, -s, s,  -s, -s, -s,  -s, s, -s,  -s, s, s,
    // +Y
    -s, s, -s,  s, s, -s,  s, s, s,  -s, s, s,
    // -Y
    -s, -s, s,  s, -s, s,  s, -s, -s,  -s, -s, -s,
    // +Z
    -s, -s, -s,  s, -s, -s,  s, s, -s,  -s, s, -s,
    // -Z
    s, -s, s,  -s, -s, s,  -s, s, s,  s, s, s
  ];
  const normals = [
    // +X
    1,0,0, 1,0,0, 1,0,0, 1,0,0,
    // -X
    -1,0,0, -1,0,0, -1,0,0, -1,0,0,
    // +Y
    0,1,0, 0,1,0, 0,1,0, 0,1,0,
    // -Y
    0,-1,0, 0,-1,0, 0,-1,0, 0,-1,0,
    // +Z
    0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1,
    // -Z
    0,0,1, 0,0,1, 0,0,1, 0,0,1
  ];
  const indices = [];
  for (let f = 0; f < 6; ++f) {
    const base = f*4;
    indices.push(base, base+1, base+2, base, base+2, base+3);
  }
  return { positions, normals, indices };
}

export function createPlane(size=10) {
  const s = size/2;
  const positions = [ -s,0,-s,  s,0,-s,  s,0,s,  -s,0,s ];
  const normals = [ 0,1,0, 0,1,0, 0,1,0, 0,1,0 ];
  const indices = [0,1,2, 0,2,3];
  return { positions, normals, indices };
}

export function createSphere(radius=1, latBands=24, longBands=24) {
  const positions = [];
  const normals = [];
  const indices = [];
  for (let lat = 0; lat <= latBands; ++lat) {
    const theta = lat * Math.PI / latBands;
    const sinT = Math.sin(theta), cosT = Math.cos(theta);
    for (let lon = 0; lon <= longBands; ++lon) {
      const phi = lon * 2 * Math.PI / longBands;
      const sinP = Math.sin(phi), cosP = Math.cos(phi);
      const x = cosP * sinT;
      const y = cosT;
      const z = sinP * sinT;
      positions.push(radius * x, radius * y, radius * z);
      normals.push(x, y, z);
    }
  }
  for (let lat=0; lat<latBands; ++lat) {
    for (let lon=0; lon<longBands; ++lon) {
      const first = lat*(longBands+1)+lon;
      const second = first + longBands +1;
      indices.push(first, second, first+1);
      indices.push(second, second+1, first+1);
    }
  }
  return { positions, normals, indices };
}
