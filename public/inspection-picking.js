// Spatially index static geometry once; picking visits only nearby triangles.
export function createInspectionTree(position, index) {
  const count = Math.floor((index ? index.count : position.count) / 3),
    order = new Uint32Array(count),
    bounds = new Float32Array(count * 6),
    centers = new Float32Array(count * 3);
  const vertex = (triangle, corner) =>
    index ? index.getX(triangle * 3 + corner) : triangle * 3 + corner;
  for (let triangle = 0; triangle < count; triangle++) {
    order[triangle] = triangle;
    for (let axis = 0; axis < 3; axis++) {
      const get = axis === 0 ? 'getX' : axis === 1 ? 'getY' : 'getZ',
        a = position[get](vertex(triangle, 0)),
        b = position[get](vertex(triangle, 1)),
        c = position[get](vertex(triangle, 2));
      bounds[triangle * 6 + axis] = Math.min(a, b, c);
      bounds[triangle * 6 + axis + 3] = Math.max(a, b, c);
      centers[triangle * 3 + axis] = (a + b + c) / 3;
    }
  }
  function build(start, end) {
    const min = [Infinity, Infinity, Infinity],
      max = [-Infinity, -Infinity, -Infinity];
    for (let i = start; i < end; i++)
      for (let axis = 0; axis < 3; axis++) {
        const offset = order[i] * 6;
        min[axis] = Math.min(min[axis], bounds[offset + axis]);
        max[axis] = Math.max(max[axis], bounds[offset + axis + 3]);
      }
    const node = { min, max, start, end };
    if (end - start > 12) {
      let axis = 0;
      for (let i = 1; i < 3; i++) if (max[i] - min[i] > max[axis] - min[axis]) axis = i;
      order.subarray(start, end).sort((a, b) => centers[a * 3 + axis] - centers[b * 3 + axis]);
      const middle = (start + end) >>> 1;
      node.left = build(start, middle);
      node.right = build(middle, end);
    }
    return node;
  }
  return { root: build(0, count), order, vertex };
}

export function queryInspectionTree(tree, origin, direction, intersectTriangle) {
  let best = Infinity,
    triangle = -1,
    visited = 0;
  const o = [origin.x, origin.y, origin.z],
    d = [direction.x, direction.y, direction.z],
    stack = [tree.root];
  while (stack.length) {
    const node = stack.pop();
    let near = 0,
      far = best;
    for (let axis = 0; axis < 3; axis++) {
      if (Math.abs(d[axis]) < 1e-12) {
        if (o[axis] < node.min[axis] || o[axis] > node.max[axis]) {
          far = -1;
          break;
        }
        continue;
      }
      const a = (node.min[axis] - o[axis]) / d[axis],
        b = (node.max[axis] - o[axis]) / d[axis];
      near = Math.max(near, Math.min(a, b));
      far = Math.min(far, Math.max(a, b));
      if (near > far) break;
    }
    if (near > far) continue;
    if (node.left) {
      stack.push(node.right, node.left);
      continue;
    }
    for (let i = node.start; i < node.end; i++) {
      visited++;
      const candidate = tree.order[i],
        distance = intersectTriangle(candidate);
      if (distance >= 0 && distance < best) {
        best = distance;
        triangle = candidate;
      }
    }
  }
  return { triangle, distance: best, visited };
}

export function accelerateInspectionPicking(mesh, Vector3) {
  // Skinning and material groups need their original per-face handling.
  if (mesh.isSkinnedMesh || Array.isArray(mesh.material)) return;
  const position = mesh.geometry.attributes.position,
    index = mesh.geometry.index,
    tree = createInspectionTree(position, index);
  const inverse = mesh.matrixWorld.clone(),
    a = new Vector3(),
    b = new Vector3(),
    c = new Vector3(),
    point = new Vector3();
  let localRay;
  mesh.raycast = function (raycaster, hits) {
    inverse.copy(this.matrixWorld).invert();
    localRay ??= raycaster.ray.clone();
    localRay.copy(raycaster.ray).applyMatrix4(inverse);
    const result = queryInspectionTree(tree, localRay.origin, localRay.direction, (triangle) => {
      a.fromBufferAttribute(position, tree.vertex(triangle, 0));
      b.fromBufferAttribute(position, tree.vertex(triangle, 1));
      c.fromBufferAttribute(position, tree.vertex(triangle, 2));
      const hit =
        this.material.side === 1
          ? localRay.intersectTriangle(c, b, a, true, point)
          : localRay.intersectTriangle(a, b, c, this.material.side !== 2, point);
      return hit ? localRay.origin.distanceTo(point) : Infinity;
    });
    if (result.triangle < 0) return;
    const world = localRay.at(result.distance, point).clone().applyMatrix4(this.matrixWorld),
      distance = raycaster.ray.origin.distanceTo(world);
    if (distance >= raycaster.near && distance <= raycaster.far)
      hits.push({ distance, point: world, object: this, faceIndex: result.triangle });
  };
}
