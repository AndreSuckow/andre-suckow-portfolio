// Original low-poly handheld. Local axes: front +z, top +y.
export function createGameBoyModel(T) {
  const { Group, Mesh, BoxGeometry, PlaneGeometry, Material, BasicMaterial, CanvasTexture, SRGB } =
    T;
  const root = new Group();
  root.name = 'Game Boy on desk';
  const resources = [];
  const material = (color) => {
    const m = new Material({ color, roughness: 0.7, metalness: 0.03 });
    resources.push(m);
    return m;
  };
  const shell = material('#c6c4bb'),
    edge = material('#989a94'),
    bezel = material('#666777'),
    black = material('#25262a'),
    berry = material('#8c244d');
  function box(name, x, y, z, w, h, d, m) {
    const geo = new BoxGeometry(w, h, d);
    resources.push(geo);
    const mesh = new Mesh(geo, m);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = mesh.receiveShadow = true;
    root.add(mesh);
    return mesh;
  }
  box('Handheld back', 0, 0, -0.004, 0.125, 0.205, 0.021, edge);
  box('Handheld shell', 0, 0, 0.003, 0.128, 0.21, 0.022, shell);
  box('Screen bezel', 0, 0.039, 0.016, 0.112, 0.098, 0.004, bezel);
  const image = document.createElement('canvas');
  image.width = 320;
  image.height = 288;
  const c = image.getContext('2d');
  c.fillStyle = '#91a75b';
  c.fillRect(0, 0, 320, 288);
  c.fillStyle = '#253d2b';
  c.textAlign = 'center';
  c.font = 'bold 28px monospace';
  c.fillText('GAME BOY', 160, 125);
  c.font = '16px monospace';
  c.fillText('CLIQUE PARA JOGAR', 160, 163);
  const map = new CanvasTexture(image);
  map.colorSpace = SRGB;
  resources.push(map);
  const screenMaterial = new BasicMaterial({ map, toneMapped: false });
  resources.push(screenMaterial);
  const geometry = new PlaneGeometry(0.081, 0.073);
  resources.push(geometry);
  const screen = new Mesh(geometry, screenMaterial);
  screen.position.set(0.006, 0.039, 0.019);
  root.add(screen);
  box('D-pad horizontal', -0.037, -0.034, 0.018, 0.043, 0.014, 0.009, black);
  box('D-pad vertical', -0.037, -0.034, 0.018, 0.014, 0.043, 0.009, black);
  for (const [name, x, y] of [
    ['B', 0.026, -0.043],
    ['A', 0.049, -0.029],
  ]) {
    const button = box('Button ' + name, x, y, 0.019, 0.018, 0.018, 0.009, berry);
    button.rotation.z = 0.1;
  }
  for (const x of [-0.012, 0.012]) {
    const button = box('Start select', x, -0.078, 0.018, 0.02, 0.006, 0.005, bezel);
    button.rotation.z = 0.25;
  }
  for (let i = 0; i < 5; i++)
    box('Speaker slit', 0.026 + i * 0.008, -0.079 + i * 0.002, 0.016, 0.003, 0.026, 0.003, edge);
  box('Red cartridge', 0, 0.109, -0.003, 0.062, 0.034, 0.012, berry);
  box('Cartridge label', 0, 0.11, 0.004, 0.044, 0.018, 0.002, shell);
  root.scale.setScalar(0.72);
  root.rotation.set(-Math.PI / 2, 0, -0.22);
  root.position.set(0.48, 0.523, -0.82);
  return {
    root,
    dispose() {
      for (const resource of resources) resource.dispose();
    },
  };
}

export function createBlueCartridge(T) {
  const { Group, Mesh, BoxGeometry, PlaneGeometry, Material, BasicMaterial, CanvasTexture, SRGB } =
    T;
  const root = new Group();
  root.name = 'Pokemon Blue cartridge';
  const resources = [];
  const shell = new Material({ color: '#2860a8', roughness: 0.75 });
  resources.push(shell);
  const shape = new BoxGeometry(0.057, 0.064, 0.011);
  resources.push(shape);
  const body = new Mesh(shape, shell);
  root.add(body);
  body.castShadow = body.receiveShadow = true;
  const image = document.createElement('canvas');
  image.width = 256;
  image.height = 224;
  const c = image.getContext('2d');
  c.fillStyle = '#e5d99d';
  c.fillRect(0, 0, 256, 224);
  c.fillStyle = '#2450a4';
  c.fillRect(8, 8, 240, 208);
  c.fillStyle = '#f5db5a';
  c.textAlign = 'center';
  c.font = 'bold 34px monospace';
  c.fillText('POKÉMON', 128, 70);
  c.fillStyle = '#fff4cd';
  c.font = 'bold 27px monospace';
  c.fillText('BLUE', 128, 119);
  c.font = '18px monospace';
  c.fillText('GAME BOY', 128, 182);
  const map = new CanvasTexture(image);
  map.colorSpace = SRGB;
  resources.push(map);
  const label = new BasicMaterial({ map, toneMapped: false });
  resources.push(label);
  const geometry = new PlaneGeometry(0.047, 0.041);
  resources.push(geometry);
  const front = new Mesh(geometry, label);
  front.position.set(0, -0.004, 0.0056);
  root.add(front);
  root.rotation.set(-Math.PI / 2, 0, 0.22);
  root.position.set(0.61, 0.509, -0.79);
  return {
    root,
    dispose() {
      for (const resource of resources) resource.dispose();
    },
  };
}
