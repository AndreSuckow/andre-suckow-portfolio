import { whatsappMessage } from './cs-model.js';

const copyTooltip = document.createElement('span');
copyTooltip.className = 'copy-tooltip';
copyTooltip.hidden = true;
copyTooltip.setAttribute('role', 'status');
copyTooltip.setAttribute('aria-live', 'polite');
document.body.append(copyTooltip);
let copyTimer = 0,
  copyBusy = false,
  pointer = { x: innerWidth / 2, y: innerHeight / 2 };
document.addEventListener(
  'pointermove',
  (event) => {
    pointer = { x: event.clientX, y: event.clientY };
  },
  { passive: true },
);
async function copyEmail(value) {
  try {
    await navigator.clipboard.writeText(value);
    return;
  } catch {}
  const field = document.createElement('textarea');
  field.value = value;
  field.style.cssText = 'position:fixed;opacity:0;pointer-events:none;';
  const focused = document.activeElement;
  document.body.append(field);
  field.select();
  try {
    if (!document.execCommand('copy')) throw Error('Clipboard unavailable');
  } finally {
    field.remove();
    focused?.focus({ preventScroll: true });
  }
}
function showCopyTooltip(text, target) {
  clearTimeout(copyTimer);
  copyTooltip.textContent = text;
  copyTooltip.hidden = false;
  const rect = target.getBoundingClientRect();
  const point =
    document.documentElement.dataset.mode === '3d'
      ? pointer
      : { x: rect.left + rect.width / 2, y: rect.top };
  const width = copyTooltip.offsetWidth,
    height = copyTooltip.offsetHeight;
  copyTooltip.style.left = `${Math.max(8, Math.min(innerWidth - width - 8, point.x - width / 2))}px`;
  copyTooltip.style.top = `${Math.max(8, Math.min(innerHeight - height - 8, point.y - height - 12))}px`;
  copyTimer = setTimeout(() => {
    copyTooltip.hidden = true;
  }, 2200);
}
document.addEventListener('click', async (event) => {
  const target = event.target.closest('[data-copy-email]');
  if (!target) return;
  event.preventDefault();
  if (copyBusy) return;
  copyBusy = true;
  try {
    await copyEmail(target.dataset.copyEmail);
    showCopyTooltip('✓ Copiado', target);
  } catch {
    showCopyTooltip('Não foi possível copiar. Tente novamente.', target);
  } finally {
    copyBusy = false;
  }
});

document.querySelectorAll('[data-whatsapp]').forEach((link) => {
  const refresh = () => {
    link.href = `https://wa.me/5541995830758?text=${encodeURIComponent(whatsappMessage(new Date()))}`;
  };
  refresh();
  link.addEventListener('pointerdown', refresh);
  link.addEventListener('click', refresh);
  link.addEventListener('focus', refresh);
});
document.querySelectorAll('.attribute__trigger').forEach((button) => {
  const row = button.closest('.attribute');
  button.addEventListener('click', () => {
    document.querySelectorAll('.attribute.is-open').forEach((item) => {
      if (item !== row) item.classList.remove('is-open');
    });
    row.classList.toggle('is-open');
  });
  button.addEventListener('pointerleave', () => row.classList.remove('tooltip-dismissed'));
  button.addEventListener('focus', () => row.classList.remove('tooltip-dismissed'));
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape')
    document.querySelectorAll('.attribute').forEach((row) => {
      row.classList.remove('is-open');
      row.classList.add('tooltip-dismissed');
    });
});
document.addEventListener('click', (event) => {
  if (!event.target.closest('.attribute'))
    document
      .querySelectorAll('.attribute.is-open')
      .forEach((row) => row.classList.remove('is-open'));
});

// Count only while the last section is actually visible. Leaving it cancels the timer.
const end = document.getElementById('fim'),
  counter = document.getElementById('continue-count'),
  dialog = document.getElementById('game-over-dialog');
let timer = 0,
  remaining = 9,
  active = false,
  shown = false,
  returnFocus = null;
const visible = () => {
  const r = end.getBoundingClientRect();
  return r.top < innerHeight * 0.65 && r.bottom > innerHeight * 0.4;
};
function stop() {
  clearInterval(timer);
  timer = 0;
  active = false;
}
function openGameOver() {
  if (shown || !visible()) return;
  if (document.querySelector('dialog[open]')) return;
  shown = true;
  returnFocus = document.activeElement;
  dialog.showModal();
  document.dispatchEvent(new CustomEvent('resume:skill-open'));
  dialog.querySelector('#game-over-title').focus({ preventScroll: true });
}
function update() {
  if (shown || document.hidden || !visible()) {
    stop();
    return;
  }
  if (active) return;
  active = true;
  remaining = 9;
  counter.textContent = '9';
  timer = setInterval(() => {
    if (document.hidden || !visible()) {
      stop();
      return;
    }
    if (document.querySelector('dialog[open]')) return;
    remaining = Math.max(0, remaining - 1);
    counter.textContent = String(remaining);
    if (remaining === 0) {
      stop();
      openGameOver();
    }
  }, 1000);
}
document.addEventListener('scroll', update, { passive: true });
window.addEventListener('resize', update);
document.addEventListener('visibilitychange', update);
update();
dialog.querySelector('[data-game-over-close]').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => {
  document.dispatchEvent(new CustomEvent('resume:skill-close'));
  returnFocus?.focus({ preventScroll: true });
});
document.querySelectorAll('[data-reload]').forEach((button) =>
  button.addEventListener('click', () => {
    history.scrollRestoration = 'manual';
    history.replaceState(null, '', location.pathname);
    window.scrollTo(0, 0);
    location.reload();
  }),
);
