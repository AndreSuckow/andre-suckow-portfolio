import * as T from './vendor/three/three.module.js';
import { GLTFLoader } from './vendor/three/GLTFLoader.js';
import { loadCareerChief } from './career-models.js?v=cs-mode-3';

const WIDTH = 480;
const HEIGHT = 720;

export async function createOutroMasterChief() {
  const { root, parts } = await loadCareerChief({
    Loader: GLTFLoader,
    Box3: T.Box3,
    Vector3: T.Vector3,
    Group: T.Group,
    Mesh: T.Mesh,
    BasicMaterial: T.MeshBasicMaterial,
  });
  const scene = new T.Scene();
  const resources = new Set();
  let renderer;

  try {
    root.traverse((object) => {
      if (!object.isMesh) return;
      const source = object.material;
      const material = new T.MeshStandardMaterial({
        map: source.map,
        side: source.side,
        alphaTest: source.alphaTest,
        transparent: source.transparent,
        roughness: 0.82,
        metalness: 0.12,
      });
      if (material.map) {
        material.map.colorSpace = T.SRGBColorSpace;
        material.map.magFilter = T.NearestFilter;
        material.map.minFilter = T.NearestFilter;
        material.map.generateMipmaps = false;
        material.map.needsUpdate = true;
      }
      resources.add(object.geometry);
      resources.add(material);
      object.material = material;
      object.castShadow = true;
      source.dispose();
    });

    const bounds = new T.Box3().setFromObject(root);
    const height = bounds.max.y - bounds.min.y;
    if (!height) throw Error('Master Chief model has no height');
    root.scale.setScalar(2.55 / height);
    root.rotation.y += 0.12;
    parts.leftArm.rotation.x = -0.12;
    parts.rightArm.rotation.x = 0.08;
    scene.add(root);

    const floorGeometry = new T.CircleGeometry(0.68, 64);
    const floorMaterial = new T.MeshStandardMaterial({
      color: '#172126',
      metalness: 0.42,
      roughness: 0.72,
    });
    resources.add(floorGeometry);
    resources.add(floorMaterial);
    const floor = new T.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, -0.055, 0.16);
    floor.receiveShadow = true;
    scene.add(floor);

    const ringGeometry = new T.TorusGeometry(0.42, 0.045, 8, 48);
    const ringMaterial = new T.MeshStandardMaterial({
      color: '#a43e32',
      emissive: '#66251f',
      emissiveIntensity: 0.45,
      metalness: 0.18,
      roughness: 0.55,
    });
    resources.add(ringGeometry);
    resources.add(ringMaterial);
    const ring = new T.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    ring.scale.set(1.35, 0.78, 1);
    ring.position.set(0, 0.015, 0.43);
    scene.add(ring);

    scene.add(new T.HemisphereLight(0xd5ecec, 0x1b2428, 2.2));
    const keyLight = new T.DirectionalLight(0xffe6c4, 3.2);
    keyLight.position.set(-2.8, 4.4, 4.2);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(WIDTH, HEIGHT);
    keyLight.shadow.camera.left = -2.4;
    keyLight.shadow.camera.right = 2.4;
    keyLight.shadow.camera.top = 4;
    keyLight.shadow.camera.bottom = -0.5;
    scene.add(keyLight);
    const rimLight = new T.DirectionalLight(0x71c8d0, 2.4);
    rimLight.position.set(2.6, 2.8, -1.6);
    scene.add(rimLight);

    const aspect = WIDTH / HEIGHT;
    const camera = new T.OrthographicCamera(-1.98 * aspect, 1.98 * aspect, 1.98, -1.98, 0.1, 30);
    camera.position.set(0, 1.78, 6);
    camera.lookAt(0, 1.78, 0);

    renderer = new T.WebGLRenderer({
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(1);
    renderer.setSize(WIDTH, HEIGHT, false);
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.setClearColor(0x000000, 0);
    renderer.render(scene, camera);

    const portrait = document.createElement('canvas');
    portrait.width = WIDTH;
    portrait.height = HEIGHT;
    portrait.getContext('2d').drawImage(renderer.domElement, 0, 0);
    return portrait;
  } finally {
    for (const resource of resources) resource.dispose();
    root.traverse((object) => {
      if (!object.isMesh) return;
      object.material.map?.dispose();
    });
    renderer?.dispose();
    renderer?.forceContextLoss();
  }
}
