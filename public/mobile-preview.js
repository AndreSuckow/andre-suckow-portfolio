// Shared by project pages. Assets load only after opening the dialog.
const desktop = matchMedia('(hover: hover) and (pointer: fine)');
let dialog, video, origin, overflow, viewer, controller;
const status = text => { dialog.querySelector('[role="status"]').textContent = text; };
function releasePreview() {
  if (!controller || controller.signal.aborted) return;
  controller.abort();
  viewer?.dispose(); viewer = null;
  video.pause(); video.removeAttribute('src'); video.load();
  document.documentElement.style.overflow = overflow;
  origin?.focus();
}
function createPreview() {
  dialog = document.createElement('dialog');
  dialog.className = 'mobile-preview';
  dialog.setAttribute('aria-labelledby', 'mobile-preview-title');
  dialog.setAttribute('aria-describedby', 'mobile-preview-description');
  dialog.innerHTML = `<header class="mobile-preview__header"><div><p class="eyebrow">Experiência mobile</p><h2 id="mobile-preview-title"></h2></div><button class="btn" type="button" data-close autofocus>Fechar</button></header>
    <p id="mobile-preview-description">O projeto na palma da mão. Dê play na tela do celular para assistir à gravação.</p>
    <div class="mobile-preview__stage" aria-busy="true"><video controls playsinline preload="none" aria-label="Demonstração mobile do projeto"></video></div>
    <div class="mobile-preview__controls"><label for="mobile-preview-angle">Girar celular</label><input id="mobile-preview-angle" type="range" min="-40" max="40" value="-16" disabled><button class="btn" type="button" data-front disabled>Ver de frente</button><button class="btn" type="button" data-retry hidden>Tentar novamente</button></div>
    <p class="mobile-preview__status" role="status"></p>
    <p class="mobile-preview__credit">Modelo: <a href="https://sketchfab.com/3d-models/low-poly-mobile-phone-4ff99cf17b164e7b9790638c5d2ef4ce" target="_blank" rel="noopener">Low Poly Mobile Phone</a>, por k. · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a></p>`;
  document.body.append(dialog);
  video = dialog.querySelector('video');
  const angle = dialog.querySelector('input');
  angle.addEventListener('input', () => viewer?.rotate(Number(angle.value)));
  dialog.querySelector('[data-front]').addEventListener('click', () => { angle.value = 0; viewer?.rotate(0); });
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    if (!dialog.open) releasePreview();
  });
  video.addEventListener('loadeddata', () => { if (dialog.open) status('Pronto. Pressione play para assistir.'); });
  video.addEventListener('playing', () => status('Reproduzindo a demonstração.'));
  video.addEventListener('waiting', () => status('Carregando vídeo…'));
  video.addEventListener('error', () => {
    if (!dialog.open || !video.hasAttribute('src')) return;
    status('Não foi possível reproduzir o vídeo. Tente novamente ou acesse o projeto online.');
    dialog.querySelector('[data-retry]').hidden = false;
  });
  dialog.querySelector('[data-retry]').addEventListener('click', () => {
    dialog.querySelector('[data-retry]').hidden = true;
    status('Carregando vídeo…'); video.load();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) video.pause(); });
  desktop.addEventListener('change', () => { if (!desktop.matches && dialog.open) dialog.close(); });
}
document.addEventListener('click', async event => {
  const button = event.target.closest('[data-mobile-preview]');
  if (!button || !desktop.matches || dialog?.open) return;
  if (!dialog) createPreview();
  releasePreview();
  origin = button;
  dialog.querySelector('h2').textContent = button.dataset.projectTitle;
  const angle = dialog.querySelector('input'), front = dialog.querySelector('[data-front]');
  angle.value = -16; angle.disabled = front.disabled = true;
  dialog.querySelector('[data-retry]').hidden = true;
  const stage = dialog.querySelector('.mobile-preview__stage');
  stage.setAttribute('aria-busy', 'true');
  delete stage.dataset.fallback;
  status('Carregando celular e vídeo…');
  overflow = document.documentElement.style.overflow;
  document.documentElement.style.overflow = 'hidden';
  controller = new AbortController();
  const signal = controller.signal;
  dialog.showModal();
  video.src = button.dataset.mobilePreview;
  video.preload = 'auto'; video.load();
  try {
    const { createPhoneViewer } = await import('./mobile-phone-viewer.js?v=cs-mode-3');
    if (signal.aborted) return;
    const nextViewer = await createPhoneViewer(stage, video, signal);
    if (signal.aborted) { nextViewer?.dispose(); return; }
    viewer = nextViewer;
    angle.disabled = front.disabled = false;
  } catch {
    if (signal.aborted) return;
    stage.dataset.fallback = 'true';
    status('O celular 3D não carregou. Você pode assistir ao vídeo aqui.');
  } finally {
    if (!signal.aborted) stage.setAttribute('aria-busy', 'false');
  }
});
