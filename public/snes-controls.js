// Native dialog shares the existing engine scroll suspension and focus behavior.
const pause = document.getElementById('pause-dialog');
const help = document.getElementById('controls-help-dialog');
const root = document.documentElement;
const previousFocus = new WeakMap();
function openOverlay(dialog) {
  if (
    root.dataset.mode !== '3d' ||
    document.querySelector('dialog[open]') ||
    document.querySelector('[data-drawer-focus]:not([hidden])')
  )
    return;
  previousFocus.set(dialog, document.activeElement);
  root.dataset.paused = 'true';
  dialog.showModal();
  document.dispatchEvent(new CustomEvent('resume:skill-open'));
  document.dispatchEvent(new CustomEvent('portfolio:pause', { detail: true }));
  dialog.querySelector('[data-unpause],[data-controls-close]').focus({ preventScroll: true });
}
function togglePause() {
  if (document.querySelector('[data-drawer-focus]:not([hidden])')) return;
  if (pause.open) {
    pause.close();
    return;
  }
  openOverlay(pause);
}
document.addEventListener('portfolio:toggle-pause', togglePause);
pause.querySelector('[data-unpause]').addEventListener('click', () => pause.close());
document.querySelector('[data-controls-help]').addEventListener('click', () => openOverlay(help));
help
  .querySelectorAll('[data-controls-close]')
  .forEach((button) => button.addEventListener('click', () => help.close()));
for (const dialog of [pause, help])
  dialog.addEventListener('close', () => {
    delete root.dataset.paused;
    document.dispatchEvent(new CustomEvent('portfolio:pause', { detail: false }));
    if (!document.querySelector('dialog[open]'))
      document.dispatchEvent(new CustomEvent('resume:skill-close'));
    if (!document.querySelector('dialog[open]'))
      previousFocus.get(dialog)?.focus({ preventScroll: true });
  });
document.addEventListener('keydown', (event) => {
  if (
    event.repeat ||
    event.isComposing ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.target.closest('input,textarea,select,[contenteditable="true"]')
  )
    return;
  if (event.code === 'KeyP' && (pause.open || !document.querySelector('dialog[open]'))) {
    event.preventDefault();
    togglePause();
  }
});
new MutationObserver(() => {
  if (root.dataset.mode !== '3d')
    for (const dialog of [pause, help]) if (dialog.open) dialog.close();
}).observe(root, { attributes: true, attributeFilter: ['data-mode'] });
