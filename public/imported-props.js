import { accelerateInspectionPicking } from './inspection-picking.js?v=cs-mode-3';
export function rememberPropAppearance(material) {
  if (material.emissive && !material.userData.roomAppearance)
    material.userData.roomAppearance = {
      emissive: material.emissive.toArray(),
      intensity: material.emissiveIntensity,
    };
}
export function restorePropAppearance(material) {
  const original = material.userData.roomAppearance;
  if (original && material.emissive) {
    material.emissive.fromArray(original.emissive);
    material.emissiveIntensity = original.intensity;
  }
}
// Preserve the supplied hierarchy, materials and textures; normalize authoring coordinates.
export function createImportedProp(T, source, { id, name, span, rotation = [0, 0, 0] }) {
  const { Group, Box3, Vector3 } = T,
    root = new Group(),
    scaled = new Group(),
    centered = new Group(),
    oriented = new Group(),
    resources = new Set();
  root.name = name;
  root.userData.importedProp = id;
  oriented.rotation.set(...rotation);
  oriented.add(source);
  centered.add(oriented);
  scaled.add(centered);
  root.add(scaled);
  const remove = [];
  source.traverse((object) => {
    if (object.isLight || object.isCamera) remove.push(object);
    if (!object.isMesh) return;
    resources.add(object.geometry);
    object.castShadow = true;
    object.receiveShadow = true;
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      resources.add(material);
      for (const value of Object.values(material)) if (value?.isTexture) resources.add(value);
    }
    accelerateInspectionPicking(object, Vector3);
  });
  for (const object of remove) object.removeFromParent();
  root.updateMatrixWorld(true);
  const bounds = new Box3().setFromObject(oriented),
    center = bounds.getCenter(new Vector3()),
    size = bounds.getSize(new Vector3()),
    longest = Math.max(size.x, size.y, size.z);
  if (!Number.isFinite(longest) || longest <= 0) throw Error('Invalid imported prop bounds: ' + id);
  centered.position.copy(center).multiplyScalar(-1);
  scaled.scale.setScalar(span / longest);
  return {
    root,
    dispose() {
      for (const resource of resources) resource.dispose();
    },
  };
}
