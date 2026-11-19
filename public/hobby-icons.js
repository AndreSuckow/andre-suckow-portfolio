// Original pixel illustrations shared by the HTML cards and the CRT canvas.
const orange = '#ffad38',
  light = '#ffd178',
  shade = '#c96925',
  ink = '#141833';
export function drawHobbyIcon(ctx, kind, x, y, size, time = 0, reduced = false) {
  const frame = reduced ? 0 : Math.floor((time % 5) * 4),
    step = [0, 1, 0, -1][Math.floor(frame / 2) % 4];
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(size / 24, size / 24);
  ctx.imageSmoothingEnabled = false;
  const rect = (x, y, w, h, color = orange) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  };
  if (kind === 'family') {
    // Four adults and four children, shown as symbolic pixel figures.
    for (const [x, y] of [
      [2, 2],
      [7, 1],
      [13, 1],
      [18, 2],
    ]) {
      rect(x, y, 3, 3, light);
      rect(x - 1, y + 4, 5, 6);
      rect(x, y + 10, 1, 3, shade);
      rect(x + 2, y + 10, 1, 3, shade);
    }
    for (const [x, y] of [
      [3, 13],
      [8, 12],
      [13, 12],
      [18, 13],
    ]) {
      rect(x, y, 2, 2, light);
      rect(x - 1, y + 3, 4, 4);
      rect(x, y + 7, 1, 2, shade);
      rect(x + 2, y + 7, 1, 2, shade);
    }
    rect(10, 22, 4, 1, light);
  } else if (kind === 'football') {
    const roll = reduced ? 0 : Math.floor(frame / 5) % 4;
    ctx.translate(step, 0);
    rect(7, 3, 10, 2);
    rect(5, 5, 14, 2);
    rect(3, 7, 18, 10);
    rect(5, 17, 14, 2);
    rect(7, 19, 10, 2);
    rect(7, 5, 4, 2, light);
    rect(5, 7, 2, 4, light);
    rect(9, 10, 5, 5, ink);
    for (const [px, py] of [
      [9, 4],
      [17, 10],
      [11, 18],
      [4, 11],
    ]) {
      const turn = ([x, y]) =>
        roll === 0
          ? [x, y]
          : roll === 1
            ? [22 - y, x]
            : roll === 2
              ? [22 - x, 22 - y]
              : [y, 22 - x];
      const [a, b] = turn([px, py]);
      rect(a, b, 3, 3, shade);
    }
    rect(5, 22, 14, 1, shade);
  } else if (kind === 'gym') {
    ctx.translate(0, step);
    rect(2, 7, 3, 10);
    rect(5, 5, 3, 14);
    rect(8, 10, 8, 4);
    rect(16, 5, 3, 14);
    rect(19, 7, 3, 10);
    rect(0, 10, 2, 4, shade);
    rect(22, 10, 2, 4, shade);
    rect(5, 5, 2, 11, light);
    rect(16, 5, 2, 11, light);
    rect(8, 10, 8, 1, light);
  } else if (kind === 'gaming') {
    rect(5, 5, 14, 2);
    rect(3, 7, 18, 10);
    rect(1, 11, 4, 9);
    rect(19, 11, 4, 9);
    rect(5, 16, 3, 3);
    rect(16, 16, 3, 3);
    rect(5, 7, 13, 1, light);
    rect(6, 9, 2, 6, ink);
    rect(4, 11, 6, 2, ink);
    rect(16, 9, 2, 2, frame % 4 < 2 ? light : shade);
    rect(18, 12, 2, 2, frame % 4 < 2 ? shade : light);
    rect(11, 12, 2, 1, shade);
    rect(13, 11, 1, 1, shade);
    if (frame % 4 < 2) {
      rect(8, 1, 2, 2, light);
      rect(16, 1, 2, 2, light);
    }
  } else if (kind === 'faith') {
    ctx.translate(step, 0);
    rect(7, 1, 3, 15, shade);
    rect(2, 5, 14, 3, shade);
    rect(7, 1, 1, 14, light);
    rect(2, 5, 14, 1, orange);
    rect(14, 8, 4, 4, orange);
    rect(15, 8, 2, 1, light);
    rect(13, 12, 4, 6);
    rect(10, 11, 3, 2);
    rect(10, 8, 2, 4);
    rect(17, 13, 2, 4, shade);
    rect(13, 18, 2, 4);
    rect(16, 18, 2, 4);
    rect(11 + (frame % 4 < 2 ? 0 : 2), 21, 4, 2, light);
    rect(16 + (frame % 4 < 2 ? 0 : 1), 21, 4, 2, shade);
  } else if (kind === 'beach') {
    rect(5, 18, 15, 2);
    rect(2, 20, 21, 2);
    rect(5, 22, 15, 1, shade);
    rect(3, 23, 4, 1, shade);
    rect(18, 23, 4, 1, shade);
    rect(11, 9, 2, 10, shade);
    rect(10, 14, 2, 5, orange);
    rect(17, 12, 1, 8, shade);
    const palm = (x, y, sway) => {
      rect(x + sway, y, 3, 3);
      rect(x - 3 + sway, y - 2, 4, 2);
      rect(x - 6 + sway, y, 4, 2);
      rect(x - 7 + sway, y + 2, 2, 2);
      rect(x + 2 + sway, y - 2, 4, 2, light);
      rect(x + 5 + sway, y, 3, 2);
      rect(x + 7 + sway, y + 2, 2, 2);
      rect(x + sway, y - 4, 2, 3, light);
      rect(x - 4 + sway, y + 3, 4, 2);
      rect(x + 3 + sway, y + 3, 4, 2);
    };
    palm(10, 6, step);
    palm(16, 11, -step);
    rect(20, 1, 3, 3, light);
    rect(1 + Math.abs(step), 17, 4, 1, shade);
  }
  ctx.restore();
}

if (typeof document !== 'undefined') {
  const cards = [...document.querySelectorAll('[data-hobby-icon]')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const visible = new Set();
  let animation = 0,
    lastFrame = -1;
  function render(time = 0) {
    animation = 0;
    const frame = Math.floor(time / 250);
    if (frame !== lastFrame || reduced.matches) {
      for (const canvas of visible) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawHobbyIcon(
          ctx,
          canvas.dataset.hobbyIcon,
          0,
          0,
          canvas.width,
          time / 1000,
          reduced.matches,
        );
      }
      lastFrame = frame;
    }
    if (visible.size && !document.hidden && !reduced.matches)
      animation = requestAnimationFrame(render);
  }
  function refresh() {
    cancelAnimationFrame(animation);
    animation = 0;
    lastFrame = -1;
    render(performance.now());
  }
  if (cards.length) {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries)
        entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target);
      refresh();
    });
    for (const canvas of cards) observer.observe(canvas);
    reduced.addEventListener('change', refresh);
    document.addEventListener('visibilitychange', refresh);
  }
}
