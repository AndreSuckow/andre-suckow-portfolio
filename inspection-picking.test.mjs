import test from 'node:test';
import assert from 'node:assert/strict';
import { createInspectionTree, queryInspectionTree } from './public/inspection-picking.js';

test('spatial picking finds the closest triangle and rejects empty space without scanning the dense mesh', () => {
  const values = [];
  for (const z of [5, 10])
    for (let x = 0; x < 5000; x++) values.push(x, 0, z, x + 1, 0, z, x, 1, z);
  const position = {
      count: values.length / 3,
      getX: (i) => values[i * 3],
      getY: (i) => values[i * 3 + 1],
      getZ: (i) => values[i * 3 + 2],
    },
    tree = createInspectionTree(position, null);
  for (const [x, y, expected] of [
    [25.2, 0.2, 5],
    [4920.1, 0.7, 5],
    [25.8, 0.8, Infinity],
    [-1, 0.2, Infinity],
  ]) {
    const result = queryInspectionTree(tree, { x, y, z: 0 }, { x: 0, y: 0, z: 1 }, (triangle) => {
      const v = tree.vertex(triangle, 0),
        dx = x - position.getX(v);
      return dx >= 0 && y >= 0 && dx + y <= 1 ? position.getZ(v) : Infinity;
    });
    assert.equal(result.distance, expected);
    assert(result.visited < 60, 'Dense mesh picking must prune unrelated triangles');
  }
  const miss = queryInspectionTree(tree, { x: 25, y: 2, z: 0 }, { x: 1, y: 0, z: 0 }, () => {
    throw Error('Parallel ray cannot hit this mesh');
  });
  assert.equal(miss.triangle, -1);
});

test('indexed geometry resolves triangle vertices without changing the source index', () => {
  const data = [0, 0, 4, 1, 0, 4, 0, 1, 4],
    indices = [2, 0, 1],
    position = {
      count: 3,
      getX: (i) => data[i * 3],
      getY: (i) => data[i * 3 + 1],
      getZ: (i) => data[i * 3 + 2],
    },
    index = { count: 3, getX: (i) => indices[i] };
  const tree = createInspectionTree(position, index);
  assert.deepEqual(
    [0, 1, 2].map((i) => tree.vertex(0, i)),
    indices,
  );
  assert.deepEqual(indices, [2, 0, 1]);
  const hit = queryInspectionTree(tree, { x: 0.2, y: 0.2, z: 8 }, { x: 0, y: 0, z: -1 }, () => 4);
  assert.equal(hit.distance, 4);
});
