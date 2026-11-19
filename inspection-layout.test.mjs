import test from 'node:test';
import assert from 'node:assert/strict';
import {
  inspectionLayout,
  inspectionPointFrame,
  inspectionBoundsPoints,
  inspectionZoom,
  clampInspectionZoom,
} from './public/inspection-layout.js';

test('eight conservative corners frame dense geometry through rotation without visiting every vertex', () => {
  const bounds = { min: { x: -1.3, y: -0.4, z: -0.7 }, max: { x: 1.7, y: 1.6, z: 0.8 } },
    corners = inspectionBoundsPoints(bounds);
  assert.equal(corners.length, 8);
  for (const angle of [0, 0.4, 1.2, 2.7]) {
    const rotate = ({ x, y, z }) => ({
      x: x * Math.cos(angle) - z * Math.sin(angle),
      y,
      z: x * Math.sin(angle) + z * Math.cos(angle),
    });
    const frame = inspectionPointFrame({ width: 664, height: 242, points: corners.map(rotate) }),
      factor = 242 / (2 * Math.tan((38 * Math.PI) / 360));
    for (let i = 0; i < 2000; i++) {
      const p = rotate({
        x: bounds.min.x + ((bounds.max.x - bounds.min.x) * (i % 37)) / 36,
        y: bounds.min.y + ((bounds.max.y - bounds.min.y) * (i % 53)) / 52,
        z: bounds.min.z + ((bounds.max.z - bounds.min.z) * (i % 29)) / 28,
      });
      const x = 332 + (p.x / (frame.distance - p.z)) * factor - frame.viewOffsetX,
        y = 121 - (p.y / (frame.distance - p.z)) * factor - frame.viewOffsetY;
      assert(x >= 23.99 && x <= 640.01);
      assert(y >= 23.99 && y <= 218.01);
    }
  }
});

test('rotatable inspection volumes stay inside landscape and portrait safe areas, away from side actions', () => {
  for (const [width, height] of [
    [844, 390],
    [667, 375],
    [568, 320],
    [390, 844],
    [1440, 1000],
  ]) {
    const actionsWidth = Math.max(96, Math.min(144, width * 0.18)),
      padding = 24,
      tangent = Math.tan((38 * Math.PI) / 360);
    for (const radius of [1.7, 2.05, 2.3]) {
      const { distance, offsetX } = inspectionLayout({
        width,
        height,
        actionsWidth,
        radius,
        padding,
      });
      // Sample the complete rotation envelope, including points toward the camera.
      for (const zoom of [inspectionZoom.min, inspectionZoom.initial, inspectionZoom.max])
        for (let latitude = -90; latitude <= 90; latitude += 10)
          for (let longitude = 0; longitude < 360; longitude += 10) {
            const a = (latitude * Math.PI) / 180,
              b = (longitude * Math.PI) / 180,
              x = radius * Math.cos(a) * Math.cos(b),
              y = radius * Math.sin(a),
              z = radius * Math.cos(a) * Math.sin(b);
            const px =
                width / 2 +
                (((x - offsetX / zoom) / (distance - z)) * height * zoom) / (2 * tangent),
              py = height / 2 - ((y / (distance - z)) * height * zoom) / (2 * tangent);
            assert(
              px >= padding - 0.01 && px <= width - actionsWidth - 32 - padding + 0.01,
              `Horizontal clipping at ${width}x${height}`,
            );
            assert(
              py >= padding - 0.01 && py <= height - padding + 0.01,
              `Vertical clipping at ${width}x${height}`,
            );
          }
    }
  }
});

test('all zoom inputs share bounded limits with room to enlarge from the opening size', () => {
  assert(
    inspectionZoom.min < inspectionZoom.initial && inspectionZoom.initial < inspectionZoom.max,
  );
  assert.equal(clampInspectionZoom(100), inspectionZoom.max);
  assert.equal(clampInspectionZoom(0.001), inspectionZoom.min);
  assert.equal(clampInspectionZoom(inspectionZoom.initial), inspectionZoom.initial);
});

test('close Discman framing keeps rotated bounding boxes inside its canvas at maximum zoom', () => {
  for (const [width, height] of [
    [1200, 708],
    [1612, 505],
    [388, 116],
    [210, 640],
  ])
    for (const size of [
      [1.65, 1.4, 0.7],
      [1.2, 1.8, 1.1],
      [1.8, 1.1, 1.6],
    ]) {
      const points = [];
      for (const x of [-size[0], size[0]])
        for (const y of [-size[1], size[1]])
          for (const z of [-size[2], size[2]]) points.push({ x: x + 0.3, y: y + 0.5, z });
      const { distance, viewOffsetX, viewOffsetY } = inspectionPointFrame({
          width,
          height,
          points,
        }),
        tangent = Math.tan((38 * Math.PI) / 360);
      for (const zoom of [0.55, 0.95, 1])
        for (const { x, y, z } of points) {
          const px =
              width / 2 +
              ((x / (distance - z)) * height * zoom) / (2 * tangent) -
              viewOffsetX * zoom,
            py =
              height / 2 -
              ((y / (distance - z)) * height * zoom) / (2 * tangent) -
              viewOffsetY * zoom;
          assert(px >= 23.99 && px <= width - 23.99);
          assert(py >= 23.99 && py <= height - 23.99);
        }
    }
});
