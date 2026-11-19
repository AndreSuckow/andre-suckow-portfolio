// "porta retrato" by 3dwstudio, CC BY 4.0. Original files and license in models/portrait/.
// Preserve the author atlas; a supplied portrait replaces only the photo surface.
export function createFamilyFrame(T) {
  const { Group, Box3, Vector3 } = T,
    root = new Group(),
    source = T.familyFrameScene,
    resources = new Set();
  root.name = 'Imported family portrait · 3dwstudio';
  root.userData.familyFrameModel = '3dwstudio';
  source.traverse((mesh) => {
    if (!mesh.isMesh) return;
    resources.add(mesh.geometry);
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      resources.add(material);
      for (const value of Object.values(material)) if (value?.isTexture) resources.add(value);
    }
    if (T.familyPortraitImage) {
      const geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone(),
        uv = geometry.attributes.uv,
        position = geometry.attributes.position;
      const frame = [],
        photo = [],
        isPhoto = (i) => uv.getX(i) > 0.5 && uv.getX(i) < 0.87 && uv.getY(i) < 0.29;
      for (let i = 0; i < position.count; i += 3)
        ([i, i + 1, i + 2].every(isPhoto) ? photo : frame).push(i, i + 1, i + 2);
      if (photo.length) {
        const ys = photo.map((i) => position.getY(i)),
          zs = photo.map((i) => position.getZ(i));
        const minY = Math.min(...ys),
          minZ = Math.min(...zs),
          width = Math.max(...ys) - minY,
          height = Math.max(...zs) - minZ;
        const image = T.familyPortraitImage,
          aspect = image.width / image.height,
          target = width / height;
        const scaleU = Math.min(1, target / aspect),
          scaleV = Math.min(1, aspect / target);
        for (const i of photo)
          uv.setXY(
            i,
            (1 - scaleU) / 2 + ((position.getY(i) - minY) / width) * scaleU,
            (1 - scaleV) / 2 + ((position.getZ(i) - minZ) / height) * scaleV,
          );
        uv.needsUpdate = true;
        geometry.setIndex([...frame, ...photo]);
        geometry.clearGroups();
        geometry.addGroup(0, frame.length, 0);
        geometry.addGroup(frame.length, photo.length, 1);
        const map = new T.CanvasTexture(image);
        map.colorSpace = T.SRGB;
        map.anisotropy = 4;
        const photoMaterial = new T.BasicMaterial({ map });
        resources.add(map);
        resources.add(photoMaterial);
        resources.add(geometry);
        mesh.geometry = geometry;
        mesh.material = [mesh.material, photoMaterial];
        root.userData.customPortrait = true;
      } else geometry.dispose();
    }
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  });
  source.updateMatrixWorld(true);
  const bounds = new Box3().setFromObject(source),
    center = bounds.getCenter(new Vector3()),
    size = bounds.getSize(new Vector3());
  const body = new Group();
  body.rotation.y = -Math.PI / 2;
  body.scale.setScalar(0.23 / size.y);
  source.position.sub(center);
  body.add(source);
  root.add(body);
  return {
    root,
    dispose() {
      for (const resource of resources) resource.dispose();
    },
  };
}
