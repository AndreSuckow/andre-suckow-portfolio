// Fit the object's rotation envelope inside the viewport, reserving its side actions.
export const inspectionZoom = { min: 0.55, initial: 0.78, max: 1 };
export const clampInspectionZoom = (value) =>
  Math.max(inspectionZoom.min, Math.min(inspectionZoom.max, value));
// A mesh's eight box corners conservatively contain every vertex, at any rotation.
export function inspectionBoundsPoints({ min, max }) {
  const points = [];
  for (const x of [min.x, max.x])
    for (const y of [min.y, max.y]) for (const z of [min.z, max.z]) points.push({ x, y, z });
  return points;
}
// Fit and center the visible geometry without clipping the open lid or the controls.
export function inspectionPointDistance({ width, height, points, fov = 38, padding = 24 }) {
  const tangent = Math.tan((fov * Math.PI) / 360),
    vertical = tangent * Math.max(0.1, (height - 2 * padding) / height),
    horizontal = tangent * Math.max(0.1, (width - 2 * padding) / height);
  let distance = 0.2;
  for (const { x, y, z } of points)
    distance = Math.max(
      distance,
      z + 0.2,
      z + Math.abs(x) / horizontal,
      z + Math.abs(y) / vertical,
    );
  return distance;
}
export function inspectionPointFrame({ width, height, points, fov = 38, padding = 24 }) {
  const vertices = [];
  let nearest = 0.2;
  for (const { x, y, z } of points) {
    vertices.push({ x, y, z });
    nearest = Math.max(nearest, z + 0.2);
  }
  const factor = height / (2 * Math.tan((fov * Math.PI) / 360));
  const project = (distance) => {
    let left = Infinity,
      right = -Infinity,
      bottom = Infinity,
      top = -Infinity;
    for (const { x, y, z } of vertices) {
      const px = (x / (distance - z)) * factor,
        py = (y / (distance - z)) * factor;
      left = Math.min(left, px);
      right = Math.max(right, px);
      bottom = Math.min(bottom, py);
      top = Math.max(top, py);
    }
    return { left, right, bottom, top };
  };
  let low = nearest,
    high = Math.max(
      nearest,
      inspectionPointDistance({ width, height, points: vertices, fov, padding }),
    );
  for (let i = 0; i < 26; i++) {
    const middle = (low + high) / 2,
      bounds = project(middle);
    if (
      bounds.right - bounds.left > width - 2 * padding ||
      bounds.top - bounds.bottom > height - 2 * padding
    )
      low = middle;
    else high = middle;
  }
  const bounds = project(high);
  return {
    distance: high,
    viewOffsetX: (bounds.left + bounds.right) / 2,
    viewOffsetY: -(bounds.top + bounds.bottom) / 2,
  };
}
export function inspectionLayout({ width, height, actionsWidth, radius, fov = 38, padding = 24 }) {
  const reserved = actionsWidth + 32,
    tangent = Math.tan((fov * Math.PI) / 360);
  const vertical = tangent * Math.max(0.1, (height - 2 * padding) / height);
  const horizontal = tangent * Math.max(0.1, (width - reserved - 2 * padding) / height);
  const shift = (tangent * reserved) / height;
  // The horizontal bound also accounts for the off-center camera's perspective.
  const distance = Math.max(
    6.2,
    (radius * Math.hypot(1, vertical)) / vertical,
    (radius * Math.hypot(1, horizontal + shift)) / horizontal,
  );
  return { distance, offsetX: distance * shift };
}
