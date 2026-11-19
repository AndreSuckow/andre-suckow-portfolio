// Sony D150 by mittelwerk, CC BY 4.0; see CREDITS.md and models/discman_d150/license.txt.
// The locally modeled player remains available if the supplied asset cannot load.
export function drawDiscmanDisplay(canvas, state = {}, time = 0) {
  const c = canvas.getContext('2d'),
    w = canvas.width,
    h = canvas.height;
  c.fillStyle = '#a7b596';
  c.fillRect(0, 0, w, h);
  c.fillStyle = '#26382c';
  c.font = 'bold 25px monospace';
  c.fillText(
    `${String((state.index || 0) + 1).padStart(2, '0')} / 05   ${state.playing ? 'PLAY' : 'PAUSE'}`,
    14,
    29,
  );
  c.save();
  c.beginPath();
  c.rect(12, 40, w - 24, h - 44);
  c.clip();
  c.font = 'bold 34px monospace';
  const title = (state.title || 'CPM 22 - Dias Atrás') + '     •     ',
    width = c.measureText(title).width;
  const offset = state.reduced ? 0 : (time * 0.055) % width;
  for (let x = 14 - offset; x < w; x += width) c.fillText(title, x, 81);
  c.restore();
}
export function createDiscman(T) {
  if (T.discmanScene) return createImportedDiscman(T);
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
  root.name = 'Discman with orange headphones';
  const materials = [],
    resources = [];
  const mat = (color) => {
    const m = new Material({ color, roughness: 0.5, metalness: 0.25 });
    materials.push(m);
    return m;
  };
  const silver = mat('#bcc2c8'),
    lid = mat('#d4d7d9'),
    dark = mat('#30343d'),
    orange = mat('#eea31e');
  function box(x, y, z, w, h, d, m, parent = root) {
    const g = new BoxGeometry(w, h, d);
    resources.push(g);
    const mesh = new Mesh(g, m);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }
  function cylinder(x, y, z, r, h, m, parent = root) {
    const p = [],
      uv = [],
      idx = [],
      n = 64;
    for (let j = 0; j < 2; j++)
      for (let i = 0; i <= n; i++) {
        const a = (i / n) * Math.PI * 2;
        p.push(Math.cos(a) * r, (j - 0.5) * h, Math.sin(a) * r);
        uv.push(0.5 + Math.cos(a) * 0.5, 0.5 + Math.sin(a) * 0.5);
      }
    for (let i = 0; i < n; i++) {
      const a = i,
        b = i + n + 1;
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
    for (const top of [false, true]) {
      const center = p.length / 3;
      p.push(0, (top ? 0.5 : -0.5) * h, 0);
      uv.push(0.5, 0.5);
      const start = top ? n + 1 : 0;
      for (let i = 0; i < n; i++)
        idx.push(center, start + (top ? i + 1 : i), start + (top ? i : i + 1));
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(p), 3));
    g.setAttribute('uv', new BufferAttribute(new Float32Array(uv), 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    resources.push(g);
    const mesh = new Mesh(g, m);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }
  cylinder(0, 0, 0, 0.14, 0.034, silver);
  cylinder(0, 0.019, -0.008, 0.127, 0.012, lid);
  box(0, 0.02, 0.085, 0.15, 0.019, 0.065, silver);
  const screen = document.createElement('canvas');
  screen.width = 512;
  screen.height = 96;
  drawDiscmanDisplay(screen);
  const map = new CanvasTexture(screen);
  map.colorSpace = SRGB;
  resources.push(map);
  const screenMat = new Material({ map, roughness: 0.6 });
  materials.push(screenMat);
  const display = new Mesh(new PlaneGeometry(0.13, 0.035), screenMat);
  resources.push(display.geometry);
  display.position.set(0, 0.031, 0.088);
  display.rotation.x = -Math.PI / 2;
  display.userData.discmanScreen = true;
  root.add(display);
  const label = document.createElement('canvas');
  label.width = 512;
  label.height = 256;
  const c = label.getContext('2d');
  c.fillStyle = '#d4d7d9';
  c.fillRect(0, 0, 512, 256);
  c.textAlign = 'center';
  c.fillStyle = '#68727c';
  c.font = 'bold 34px sans-serif';
  c.fillText('SONY', 256, 65);
  c.fillStyle = '#b39660';
  c.font = 'italic bold 60px sans-serif';
  c.fillText('Discman', 256, 155);
  c.font = '19px sans-serif';
  c.fillText('CD COMPACT PLAYER · ESP', 256, 196);
  const lm = new CanvasTexture(label);
  lm.colorSpace = SRGB;
  resources.push(lm);
  const labelMat = new Material({ map: lm });
  materials.push(labelMat);
  const face = new Mesh(new PlaneGeometry(0.16, 0.085), labelMat);
  resources.push(face.geometry);
  face.rotation.x = -Math.PI / 2;
  face.position.set(0, 0.026, -0.035);
  root.add(face);
  for (const [x, action] of [
    [-0.085, 'previous'],
    [0.085, 'next'],
    [0.113, 'toggle'],
  ]) {
    const z = action === 'toggle' ? 0.065 : 0.03,
      button = cylinder(x, 0.033, z, 0.014, 0.009, dark);
    button.userData.discmanAction = action;
    const icon = document.createElement('canvas');
    icon.width = 128;
    icon.height = 128;
    const c = icon.getContext('2d');
    c.fillStyle = '#30343d';
    c.fillRect(0, 0, 128, 128);
    c.fillStyle = '#f4f1e8';
    c.font = 'bold 65px sans-serif';
    c.textAlign = 'center';
    c.fillText(action === 'toggle' ? '▶' : action === 'next' ? '»' : '«', 64, 86);
    const map = new CanvasTexture(icon);
    map.colorSpace = SRGB;
    resources.push(map);
    const m = new Material({ map });
    materials.push(m);
    const surface = new Mesh(new PlaneGeometry(0.021, 0.021), m);
    resources.push(surface.geometry);
    surface.rotation.x = -Math.PI / 2;
    surface.position.set(x, 0.038, z);
    surface.userData.discmanAction = action;
    root.add(surface);
  }
  // Headband curves behind the player; orange earpads sit at either side.
  for (let i = 0; i < 32; i++) {
    const a = Math.PI + (i / 31) * Math.PI;
    const x = Math.cos(a) * 0.18,
      z = Math.sin(a) * 0.17;
    const band = box(x, 0.034, z, 0.022, 0.012, 0.012, dark);
    band.rotation.y = -a - Math.PI / 2;
  }
  for (const sign of [-1, 1]) {
    cylinder(sign * 0.166, 0.025, 0.018, 0.035, 0.042, orange);
    box(sign * 0.166, 0.05, 0.018, 0.023, 0.014, 0.035, dark);
  }
  return {
    root,
    dispose() {
      for (const r of resources) r.dispose();
      for (const m of materials) m.dispose();
    },
  };
}

function createImportedDiscman(T) {
  const {
    Group,
    Mesh,
    PlaneGeometry,
    Material,
    BasicMaterial,
    CanvasTexture,
    Box3,
    Vector3,
    SRGB,
  } = T;
  const root = new Group();
  root.name = 'Sony Discman D150';
  root.userData.discmanModel = 'sony-d150';
  const source = T.discmanScene,
    resources = new Set(),
    materials = new Set();
  source.updateMatrixWorld(true);
  const bounds = new Box3().setFromObject(source),
    center = bounds.getCenter(new Vector3()),
    size = bounds.getSize(new Vector3());
  // Authoring coordinates have the front facing +X. Center and turn it toward +Z.
  const scale = 0.28 / Math.max(size.x, size.z),
    body = new Group();
  body.rotation.y = -Math.PI / 2;
  body.scale.setScalar(scale);
  source.position.sub(center);
  body.add(source);
  root.add(body);
  root.updateMatrixWorld(true);
  let displayBounds = null,
    frontTextBounds = null,
    volumeControl = null;
  const frontControls = new Map();
  source.traverse((object) => {
    const name = object.name.replaceAll('_', ' ');
    if (object.name === 'Empty_59')
      object.userData.discmanLid = { open: object.rotation.z, closed: 0 };
    if (/discman open button/.test(name))
      object.traverse((mesh) => {
        if (mesh.isMesh) mesh.userData.discmanAction = 'lid';
      });
    const frontAction = { button00246: 'previous', button45: 'play', button00144: 'pause' }[
      object.name.replace(/[^a-z0-9]/gi, '').toLowerCase()
    ];
    if (frontAction) {
      frontControls.set(frontAction, object);
      object.traverse((mesh) => {
        if (mesh.isMesh) mesh.userData.discmanAction = frontAction;
      });
    }
    if (/volume button/.test(name)) {
      volumeControl = object;
      object.userData.discmanVolumeWheel = true;
      object.traverse((mesh) => {
        if (mesh.isMesh) mesh.userData.discmanAction = 'volume';
      });
    }
    if (/discman control buttons/.test(name))
      object.traverse((mesh) => {
        if (
          mesh.isMesh &&
          (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).some(
            (material) => material.name === 'discman_silk_screen',
          )
        ) {
          frontTextBounds = new Box3().setFromObject(mesh);
          mesh.visible = false;
        }
      });
    if (/discman play button/.test(name))
      object.traverse((mesh) => {
        if (mesh.isMesh) mesh.userData.discmanAction = 'play';
      });
    if (/discman stop button/.test(name))
      object.traverse((mesh) => {
        if (mesh.isMesh) mesh.userData.discmanAction = 'pause';
      });
    if (!object.isMesh) return;
    resources.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material);
      for (const value of Object.values(material)) if (value?.isTexture) resources.add(value);
      if (material.name === 'lcd_pane') displayBounds = new Box3().setFromObject(object);
      if (['lcd_digit', 'lcd_glass'].includes(material.name)) object.visible = false;
    }
  });
  root.updateMatrixWorld(true);
  // Replace the original front-panel lettering with labels attached to the model.
  if (frontControls.size === 3) {
    const controls = ['previous', 'play', 'pause'].map((action) => {
      const bounds = new Box3().setFromObject(frontControls.get(action));
      return { bounds, center: bounds.getCenter(new Vector3()) };
    });
    const spacing = Math.abs(controls[1].center.x - controls[0].center.x),
      buttonHeight = Math.max(
        ...controls.map((control) => control.bounds.max.y - control.bounds.min.y),
      ),
      buttonY = Math.max(...controls.map((control) => control.center.y));
    const volumeX = volumeControl
      ? new Box3().setFromObject(volumeControl).getCenter(new Vector3()).x
      : controls[2].center.x + spacing;
    const left = controls[0].center.x - spacing * 0.55,
      right = volumeX + spacing * 0.8,
      bottom = buttonY + buttonHeight * 0.62,
      top = buttonY + buttonHeight * 2.2;
    const width = right - left,
      height = top - bottom,
      rowY = buttonY + buttonHeight * 1.08;
    const frontZ =
      (frontTextBounds?.max.z ?? Math.max(...controls.map((control) => control.bounds.max.z))) +
      0.00004;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = Math.round((canvas.width * height) / width);
    const context = canvas.getContext('2d');
    context.fillStyle = '#10100f';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#ded8c6';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = '500 ' + Math.round(canvas.height * 0.23) + 'px Arial, sans-serif';
    const print = (text, x, maxWidth) =>
      context.fillText(
        text,
        ((x - left) / width) * canvas.width,
        ((top - rowY) / height) * canvas.height,
        (maxWidth / width) * canvas.width,
      );
    ['Retroceder', 'Ouvir', 'Pausar'].forEach((text, index) =>
      print(text, controls[index].center.x, spacing * 0.92),
    );
    if (volumeControl) print('VOLUME', volumeX, spacing * 1.4);
    const map = new CanvasTexture(canvas);
    map.colorSpace = SRGB;
    map.anisotropy = 4;
    resources.add(map);
    // The opaque ink surface also covers lettering embossed into the metal finish.
    const material = new BasicMaterial({ map, toneMapped: false });
    materials.add(material);
    const geometry = new PlaneGeometry(width, height);
    resources.add(geometry);
    const label = new Mesh(geometry, material);
    label.name = 'Discman front labels: Retroceder, Ouvir, Pausar, VOLUME';
    label.userData.discmanControlLabel = 'Retroceder / Ouvir / Pausar / VOLUME';
    label.position.set((left + right) / 2, (top + bottom) / 2, frontZ);
    root.add(label);
  }
  if (displayBounds) {
    // Bounds above are already in normalized room coordinates, after the root transform.
    const lcdCenter = displayBounds.getCenter(new Vector3()),
      lcdSize = displayBounds.getSize(new Vector3());
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 96;
    drawDiscmanDisplay(canvas);
    const map = new CanvasTexture(canvas);
    map.colorSpace = SRGB;
    resources.add(map);
    const material = new Material({ map, roughness: 0.48, metalness: 0 });
    materials.add(material);
    const geometry = new PlaneGeometry(lcdSize.x * 0.96, lcdSize.y * 0.9);
    resources.add(geometry);
    const display = new Mesh(geometry, material);
    display.position.copy(lcdCenter);
    display.position.z = displayBounds.max.z + 0.0003;
    display.userData.discmanScreen = true;
    root.add(display);
  }
  return {
    root,
    dispose() {
      for (const resource of resources) resource.dispose();
      for (const material of materials) material.dispose();
    },
  };
}
