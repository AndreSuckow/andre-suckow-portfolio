// Local browser modules for the project pages, independent of the room engine.
import { mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
const target = 'public/vendor/three';
mkdirSync(target, { recursive: true });
copyFileSync('node_modules/three/build/three.module.min.js', `${target}/three.module.js`);
copyFileSync('node_modules/three/LICENSE', `${target}/LICENSE`);
for (const [source, name] of [
  ['loaders/GLTFLoader.js', 'GLTFLoader.js'],
  ['utils/BufferGeometryUtils.js', 'BufferGeometryUtils.js'],
  ['renderers/CSS3DRenderer.js', 'CSS3DRenderer.js'],
]) {
  const code = readFileSync(`node_modules/three/examples/jsm/${source}`, 'utf8')
    .replaceAll("from 'three'", "from './three.module.js'")
    .replaceAll("'../utils/BufferGeometryUtils.js'", "'./BufferGeometryUtils.js'");
  writeFileSync(`${target}/${name}`, code);
}
