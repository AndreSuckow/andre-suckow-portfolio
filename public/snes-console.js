// North American SNES: gray stepped shell and purple POWER / RESET sliders.
// Keep the cartridge and raycast anchors used by the portfolio engine.
export function createSnesConsole(T) {
  const {
    Group,
    Mesh,
    BoxGeometry,
    PlaneGeometry,
    BufferGeometry,
    BufferAttribute,
    Material,
    CanvasTexture,
    SRGB,
  } = T;
  const root = new Group();
  root.name = 'Super Nintendo';
  root.userData.snes = true;
  const gray = new Material({ color: '#bcbcc3', roughness: 0.72 }),
    light = new Material({ color: '#d2d1d7', roughness: 0.7 }),
    dark = new Material({ color: '#55545d', roughness: 0.8 }),
    purple = new Material({ color: '#60409b', roughness: 0.55 });
  function box(name, x, y, z, w, h, d, mat = gray) {
    const m = new Mesh(new BoxGeometry(w, h, d), mat);
    m.name = name;
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    root.add(m);
    return m;
  }
  // Rounded horizontal outline, with a bevel around the top and bottom edges.
  function shell(name, w, h, d, y, mat) {
    const positions = [],
      indices = [],
      steps = 8,
      r = 0.012;
    const rings = [
      [y - h / 2, 0.93],
      [y - h / 2 + 0.006, 1],
      [y + h / 2 - 0.006, 1],
      [y + h / 2, 0.94],
    ];
    for (const [height, scale] of rings)
      for (let corner = 0; corner < 4; corner++)
        for (let i = 0; i <= steps; i++) {
          const angle = ((corner + i / steps) * Math.PI) / 2;
          positions.push(
            ((corner === 0 || corner === 3 ? 1 : -1) * (w / 2 - r) + Math.cos(angle) * r) * scale,
            height,
            ((corner < 2 ? 1 : -1) * (d / 2 - r) + Math.sin(angle) * r) * scale,
          );
        }
    const count = 4 * (steps + 1);
    for (let ring = 0; ring < 3; ring++)
      for (let i = 0; i < count; i++) {
        const a = ring * count + i,
          b = ring * count + ((i + 1) % count);
        indices.push(a, b, a + count, b, b + count, a + count);
      }
    for (let i = 1; i < count - 1; i++) {
      indices.push(0, i + 1, i);
      indices.push(3 * count, 3 * count + i, 3 * count + i + 1);
    }
    for (let i = 0; i < indices.length; i += 3)
      [indices[i + 1], indices[i + 2]] = [indices[i + 2], indices[i + 1]];
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    const m = new Mesh(g, mat);
    m.name = name;
    m.castShadow = true;
    m.receiveShadow = true;
    root.add(m);
    return m;
  }
  function label(name, text, x, y, z, w, d, color = '#73717a') {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const c = canvas.getContext('2d');
    c.fillStyle = color;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = 'italic bold 46px Arial';
    c.fillText(text, 256, 64, 490);
    const map = new CanvasTexture(canvas);
    map.colorSpace = SRGB;
    const m = new Mesh(
      new PlaneGeometry(w, d),
      new Material({ map, transparent: true, roughness: 0.8, depthWrite: false }),
    );
    m.name = name;
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y, z);
    root.add(m);
    return m;
  }
  shell('SNES lower shell', 0.274, 0.035, 0.256, 0.019, gray);
  shell('SNES upper shell', 0.27, 0.039, 0.25, 0.052, light);
  box('SNES rear raised housing', 0, 0.076, -0.063, 0.238, 0.027, 0.116);
  for (let i = 0; i < 7; i++)
    box('Rear ventilation', -0.084 + i * 0.028, 0.09, -0.095, 0.015, 0.001, 0.045, dark);
  box('Cartridge slot', 0, 0.078, -0.02, 0.164, 0.008, 0.026, dark);
  box('Console_Flap_F', 0, 0.082, -0.012, 0.154, 0.005, 0.012);
  box('Console_Flap_B', 0, 0.082, -0.028, 0.154, 0.005, 0.012);
  const slot = new Group();
  slot.name = 'Console_SlotAnchor';
  slot.position.set(0, 0.079, -0.02);
  root.add(slot);
  box('Console_Power', -0.083, 0.077, 0.045, 0.063, 0.014, 0.026, purple);
  box('Console_Reset', 0.083, 0.077, 0.045, 0.063, 0.014, 0.026, purple);
  box('Console_Eject', 0, 0.073, 0.062, 0.066, 0.009, 0.06, gray);
  label('Power label', 'POWER', -0.083, 0.085, 0.045, 0.047, 0.012, '#e5dff0');
  label('Reset label', 'RESET', 0.083, 0.085, 0.045, 0.047, 0.012, '#e5dff0');
  label('Eject label', 'EJECT', 0, 0.078, 0.062, 0.037, 0.012);
  label('Console_Badge', 'SUPER NINTENDO', 0, 0.092, -0.056, 0.13, 0.024);
  label('Entertainment system', 'ENTERTAINMENT SYSTEM', 0, 0.092, -0.043, 0.115, 0.009);
  box('Front panel seam', 0, 0.034, 0.128, 0.26, 0.002, 0.001, dark);
  for (const x of [-0.078, 0.078]) {
    box('Controller port', x, 0.021, 0.13, 0.059, 0.019, 0.004, dark);
    for (let i = 0; i < 7; i++)
      box('Port contact', x - 0.022 + i * 0.0073, 0.021, 0.133, 0.003, 0.005, 0.001, light);
  }
  box(
    'Console_LED',
    -0.108,
    0.074,
    0.068,
    0.006,
    0.003,
    0.005,
    new Material({ color: '#601e25', emissive: '#ff3549', emissiveIntensity: 0 }),
  );
  return root;
}

export function createSnesPad(T) {
  const { Group, Mesh, BoxGeometry, BufferGeometry, BufferAttribute, Material } = T;
  const root = new Group();
  root.name = 'SNES wired controller';
  root.position.set(...(T.onChair === false ? [0.12, 0.006, -0.28] : [0.03, 0.314, -0.35]));
  root.rotation.y = T.onChair === false ? -0.244 : -0.16;
  const shell = new Material({ color: '#c9c8d0', roughness: 0.75 }),
    dark = new Material({ color: '#34333b', roughness: 0.8 }),
    purple = new Material({ color: '#60409b', roughness: 0.6 }),
    lilac = new Material({ color: '#b9ace3', roughness: 0.6 });
  const positions = [],
    indices = [],
    segments = 48;
  for (const y of [0, 0.018])
    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      positions.push(Math.cos(a) * 0.033 + Math.sign(Math.cos(a)) * 0.047, y, Math.sin(a) * 0.033);
    }
  for (let i = 0; i < segments; i++) {
    const n = (i + 1) % segments;
    indices.push(i, i + segments, n, n, i + segments, n + segments);
  }
  for (let i = 1; i < segments - 1; i++)
    indices.push(0, i, i + 1, segments, segments + i + 1, segments + i);
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const body = new Mesh(geometry, shell);
  body.castShadow = true;
  root.add(body);
  function bar(name, x, z, w, d, angle = 0) {
    const m = new Mesh(new BoxGeometry(w, 0.005, d), dark);
    m.name = name;
    m.position.set(x, 0.021, z);
    m.rotation.y = angle;
    root.add(m);
  }
  bar('D-pad vertical', -0.047, 0, 0.01, 0.037);
  bar('D-pad horizontal', -0.047, 0, 0.037, 0.01);
  bar('SELECT', -0.009, 0.007, 0.014, 0.005, -0.6);
  bar('START', 0.01, 0.007, 0.014, 0.005, -0.6);
  for (const [name, x, z, mat] of [
    ['X', 0.046, -0.017, lilac],
    ['Y', 0.029, 0, lilac],
    ['A', 0.063, 0, purple],
    ['B', 0.046, 0.017, purple],
  ]) {
    const pos = [0, 0, 0],
      idx = [];
    for (let i = 0; i <= 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      pos.push(Math.cos(a) * 0.009, 0, Math.sin(a) * 0.009);
      if (i > 0) idx.push(0, i + 1, i);
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    const m = new Mesh(g, mat);
    m.name = 'SNES ' + name;
    m.position.set(x, 0.023, z);
    root.add(m);
  }
  return root;
}

export function createSnesCable(T) {
  const { Mesh, BufferGeometry, BufferAttribute, Material } = T;
  const paths = [
    [
      [0.035, 0.331, -0.383],
      [0.05, 0.32, -0.48],
      [0.28, 0.3, -0.53],
      [0.26, 0.515, -0.705],
    ],
    [
      [0.26, 0.515, -0.705],
      [0.24, 0.53, -0.73],
      [0.16, 0.522, -0.74],
      [0.122, 0.521, -0.787],
    ],
  ];
  function point(t) {
    const path = paths[Math.min(1, Math.floor(t * 2))],
      u = Math.min(1, t * 2 - (t < 0.5 ? 0 : 1)),
      v = 1 - u;
    return [0, 1, 2].map(
      (i) =>
        v * v * v * path[0][i] +
        3 * v * v * u * path[1][i] +
        3 * v * u * u * path[2][i] +
        u * u * u * path[3][i],
    );
  }
  const pos = [],
    uv = [],
    indices = [],
    segments = 80,
    sides = 8;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments,
      p = point(t),
      before = point(Math.max(0, t - 0.001)),
      after = point(Math.min(1, t + 0.001));
    const tangent = after.map((v, j) => v - before[j]),
      length = Math.hypot(...tangent);
    for (let j = 0; j < 3; j++) tangent[j] /= length;
    const a = [-tangent[2], 0, tangent[0]],
      al = Math.hypot(...a);
    for (let j = 0; j < 3; j++) a[j] /= al;
    const b = [tangent[1] * a[2], tangent[2] * a[0] - tangent[0] * a[2], -tangent[1] * a[0]];
    for (let j = 0; j <= sides; j++) {
      const angle = (j / sides) * Math.PI * 2;
      pos.push(...p.map((v, k) => v + 0.0024 * (Math.cos(angle) * a[k] + Math.sin(angle) * b[k])));
      uv.push(t, j / sides);
    }
  }
  for (let i = 0; i < segments; i++)
    for (let j = 0; j < sides; j++) {
      const a = i * (sides + 1) + j,
        b = a + sides + 1;
      indices.push(a, a + 1, b, a + 1, b + 1, b);
    }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  geometry.setAttribute('uv', new BufferAttribute(new Float32Array(uv), 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const mesh = new Mesh(geometry, new Material({ color: '#25252b', roughness: 0.85 }));
  mesh.name = 'SNES cable from chair to controller port';
  mesh.castShadow = true;
  return mesh;
}
