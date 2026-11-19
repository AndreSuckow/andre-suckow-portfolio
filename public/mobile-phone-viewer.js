import * as T from './vendor/three/three.module.js';
import { GLTFLoader } from './vendor/three/GLTFLoader.js';
import { CSS3DObject, CSS3DRenderer } from './vendor/three/CSS3DRenderer.js';

// Keep the supplied model intact; its original face defines the video placement.
export async function createPhoneViewer(stage, video, signal) {
  const { scene: model } = await new GLTFLoader().loadAsync(new URL('./models/mobile/scene.gltf', import.meta.url).href);
  let renderer, observer, css;
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
    const screen = new CSS3DObject(video);
    const width = size.x * 0.965, height = size.y * 0.94;
    video.style.width = '300px';
    video.style.height = `${300 * height / width}px`;
    screen.scale.setScalar(width / 300);
    screen.position.copy(position);
    screen.position.y -= size.y * 0.018;
    screen.position.z = bounds.max.z + 0.001;
    screenGroup.add(screen);
    screenScene.add(screenGroup);
    const camera = new T.PerspectiveCamera(34, 1, 0.01, 10);
    camera.position.z = 1.18;
    stage.append(renderer.domElement, css.domElement);
    stage.dataset.phone = 'ready';
    const render = () => {
      const width = stage.clientWidth, height = stage.clientHeight;
      if (!width || !height || signal.aborted) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      css.setSize(width, height);
      renderer.render(scene, camera);
      css.render(screenScene, camera);
    };
    const rotate = degrees => {
      phone.rotation.set(-0.035, degrees * Math.PI / 180, 0);
      screenGroup.rotation.copy(phone.rotation);
      render();
    };
    observer = new ResizeObserver(render);
    observer.observe(stage);
    rotate(-16);
    return {
      rotate,
      dispose() {
        observer.disconnect();
        stage.append(video);
        video.removeAttribute('style');
        renderer.dispose();
        renderer.forceContextLoss();
        renderer.domElement.remove();
        css.domElement.remove();
        delete stage.dataset.phone;
        disposeModel();
      },
    };
  } catch (error) {
    observer?.disconnect();
    stage.append(video);
    video.removeAttribute('style');
    renderer?.dispose();
    renderer?.domElement.remove();
    css?.domElement.remove();
    disposeModel();
    throw error;
  }
}
