import * as T from './vendor/three/three.module.js';
import { GLTFLoader } from './vendor/three/GLTFLoader.js';
import { CSS3DObject, CSS3DRenderer } from './vendor/three/CSS3DRenderer.js';

// Keep the supplied model intact; its original face defines the screen placement.
export async function createPhoneViewer(stage, screenElement, signal) {
  const { scene: model } = await new GLTFLoader().loadAsync(new URL('./models/mobile/scene.gltf', import.meta.url).href);
  let renderer, observer, css, frame = 0;
  const screenStyle = screenElement.getAttribute('style');
  const restoreScreen = () => {
    if (screenStyle === null) screenElement.removeAttribute('style');
    else screenElement.setAttribute('style', screenStyle);
  };
  const disposeModel = () => model.traverse(node => {
    node.geometry?.dispose();
    if (node.material) for (const material of [].concat(node.material)) material.dispose();
  });
  if (signal.aborted) { disposeModel(); return null; }
  try {
    renderer = new T.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    renderer.domElement.className = 'mobile-preview__canvas';
    const scene = new T.Scene(), phone = new T.Group();
    model.rotation.x = Math.PI / 4;
    model.updateMatrixWorld(true);
    const center = new T.Box3().setFromObject(model).getCenter(new T.Vector3());
    model.position.sub(center);
    phone.add(model);
    scene.add(phone);
    model.updateWorldMatrix(true, true);
    scene.add(new T.HemisphereLight(0xfff4df, 0x323b59, 2.5));
    const light = new T.DirectionalLight(0xffffff, 3);
    light.position.set(-2, 3, 4);
    scene.add(light);
    const face = model.getObjectByName('Phone_Case_PhoneFace_Mat_0');
    if (!face) throw Error('Phone screen missing');
    const bounds = new T.Box3().setFromObject(face);
    const size = bounds.getSize(new T.Vector3());
    const position = bounds.getCenter(new T.Vector3());
    css = new CSS3DRenderer();
    css.domElement.className = 'mobile-preview__screen-layer';
    const screenScene = new T.Scene(), screenGroup = new T.Group();
    const screen = new CSS3DObject(screenElement);
    const width = size.x * 0.965, height = size.y * 0.94;
    screenElement.style.width = '300px';
    screenElement.style.height = `${300 * height / width}px`;
    screen.scale.setScalar(width / 300);
    screen.position.copy(position);
    screen.position.y -= size.y * 0.018;
    screen.position.z = bounds.max.z + 0.001;
    screenGroup.add(screen);
    screenScene.add(screenGroup);
    const camera = new T.PerspectiveCamera(34, 1, 0.01, 10);
    camera.position.z = 1.12;
    stage.append(renderer.domElement, css.domElement);
    stage.dataset.phone = 'ready';
    const render = () => {
      const width = stage.clientWidth, height = stage.clientHeight;
      if (!width || !height || signal.aborted) return;
      camera.aspect = width / height;
      camera.position.z = Math.max(1.12, 0.19 / (Math.tan(17 * Math.PI / 180) * camera.aspect));
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      css.setSize(width, height);
      renderer.render(scene, camera);
      css.render(screenScene, camera);
    };
    let angle = -10, manual = false, pointer = null, dragged = false;
    const rotate = degrees => {
      angle = Math.max(-35, Math.min(35, degrees));
      phone.rotation.set(-0.015, angle * Math.PI / 180, 0);
      screenGroup.rotation.copy(phone.rotation);
      render();
    };
    observer = new ResizeObserver(render);
    observer.observe(stage);
    const ray = new T.Raycaster(), mouse = new T.Vector2();
    const hitTest = (x, y) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.set((x - rect.left) / rect.width * 2 - 1, -(y - rect.top) / rect.height * 2 + 1);
      ray.setFromCamera(mouse, camera);
      return ray.intersectObject(phone, true).length > 0;
    };
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const video = screenElement.querySelector('video');
    const canMove = () => screenElement.dataset.mode === 'video' && !signal.aborted && !document.hidden && video.paused && !manual && !reduced.matches;
    const animate = time => {
      frame = 0;
      if (!canMove()) return;
      rotate(-10 + Math.sin(time / 1900) * 7);
      frame = requestAnimationFrame(animate);
    };
    const syncMotion = () => {
      cancelAnimationFrame(frame); frame = 0;
      if (canMove()) frame = requestAnimationFrame(animate);
    };
    stage.addEventListener('pointerdown', event => {
      if (event.target !== renderer.domElement || !hitTest(event.clientX, event.clientY)) return;
      manual = true; syncMotion(); dragged = false;
      pointer = { id: event.pointerId, x: event.clientX, angle };
      renderer.domElement.setPointerCapture(event.pointerId);
    }, { signal });
    stage.addEventListener('pointermove', event => {
      if (!pointer || pointer.id !== event.pointerId) return;
      const delta = event.clientX - pointer.x;
      dragged ||= Math.abs(delta) > 4;
      rotate(pointer.angle + delta * 0.2);
    }, { signal });
    const endDrag = () => { pointer = null; };
    stage.addEventListener('pointerup', endDrag, { signal });
    stage.addEventListener('pointercancel', endDrag, { signal });
    stage.addEventListener('keydown', event => {
      if (event.target !== stage || !['ArrowLeft', 'ArrowRight', 'Home'].includes(event.key)) return;
      event.preventDefault(); manual = true; syncMotion();
      rotate(event.key === 'Home' ? 0 : angle + (event.key === 'ArrowLeft' ? -5 : 5));
    }, { signal });
    video.addEventListener('play', () => { syncMotion(); rotate(0); }, { signal });
    video.addEventListener('pause', syncMotion, { signal });
    document.addEventListener('visibilitychange', syncMotion, { signal });
    reduced.addEventListener('change', syncMotion, { signal });
    rotate(-10); syncMotion();
    return {
      rotate,
      hitTest,
      consumeDrag() { const moved = dragged; dragged = false; return moved; },
      syncMotion,
      dispose() {
        cancelAnimationFrame(frame);
        observer.disconnect();
        stage.append(screenElement);
        restoreScreen();
        renderer.dispose();
        renderer.forceContextLoss();
        renderer.domElement.remove();
        css.domElement.remove();
        delete stage.dataset.phone;
        disposeModel();
      },
    };
  } catch (error) {
    cancelAnimationFrame(frame);
    observer?.disconnect();
    stage.append(screenElement);
    restoreScreen();
    renderer?.dispose();
    renderer?.domElement.remove();
    css?.domElement.remove();
    disposeModel();
    throw error;
  }
}
