const desktop = matchMedia('(hover: hover) and (pointer: fine)');
let dialog, iframe, video, screen, origin, overflow, viewer, controller, iframeTimer;
let iframeFailed = false;

function status(text, error = false) {
  dialog.querySelector('[role="status"]').textContent = text;
  dialog.dataset.error = String(error);
}

function showVideo() {
  if (!video.src) {
    video.src = video.dataset.source;
    video.preload = 'auto';
    video.load();
  }
  screen.dataset.mode = 'video';
  iframe.hidden = true;
  video.hidden = false;
  dialog.querySelector('[data-show-video]').hidden = !iframeFailed;
  dialog.querySelector('[data-show-site]').hidden = false;
  status('Carregando a gravação da versão mobile.');
  viewer?.syncMotion();
}

function showSite() {
  video.pause();
  screen.dataset.mode = 'site';
  iframe.hidden = false;
  video.hidden = true;
  dialog.querySelector('[data-show-video]').hidden = true;
  dialog.querySelector('[data-show-site]').hidden = true;
  status('Site interativo aberto. Role e clique dentro da tela do celular.');
  viewer?.syncMotion();
}

function releasePreview() {
  if (!controller || controller.signal.aborted) return;
  clearTimeout(iframeTimer);
  iframeTimer = null;
  controller.abort();
  viewer?.dispose();
  viewer = null;
  iframe.removeAttribute('src');
  iframe.dataset.requested = 'false';
  video.pause();
  video.removeAttribute('src');
  video.load();
  screen.dataset.mode = 'site';
  iframe.hidden = false;
  video.hidden = true;
  iframeFailed = false;
  dialog.querySelector('[data-show-video]').hidden = true;
  dialog.querySelector('[data-show-site]').hidden = true;
  document.documentElement.style.overflow = overflow;
  const returnFocus = origin;
  requestAnimationFrame(() => {
    if (dialog.open) return;
    const target =
      returnFocus?.isConnected && returnFocus.getClientRects().length
        ? returnFocus
        : document.getElementById('stage-canvas');
    target?.focus({ preventScroll: true });
  });
  document.dispatchEvent(new CustomEvent('resume:skill-close'));
}

function createPreview() {
  dialog = document.createElement('dialog');
  dialog.className = 'mobile-preview';
  dialog.setAttribute('aria-label', 'Demonstração interativa do projeto no celular');
  dialog.innerHTML = `<button class="mobile-preview__close" type="button" data-close aria-label="Fechar demonstração" autofocus>×</button>
    <div class="mobile-preview__stage" tabindex="0" role="group" aria-label="Celular 3D. Role e clique no site dentro da tela. Arraste a carcaça ou use as setas para girar." aria-busy="true">
      <div class="mobile-preview__screen" data-preview-screen data-mode="site">
        <iframe title="Site do projeto no celular" referrerpolicy="strict-origin-when-cross-origin"></iframe>
        <video controls playsinline preload="none" aria-label="Gravação da versão mobile do projeto" hidden></video>
      </div>
    </div>
    <div class="mobile-preview__actions" role="group" aria-label="Opções da demonstração">
      <button class="btn" type="button" data-show-video hidden>Assistir gravação</button>
      <button class="btn" type="button" data-show-site hidden>Voltar ao site</button>
    </div>
    <div class="mobile-preview__feedback"><p role="status" aria-live="polite"></p><button class="btn" type="button" data-retry hidden>Tentar vídeo novamente</button></div>`;
  document.body.append(dialog);
  iframe = dialog.querySelector('iframe');
  video = dialog.querySelector('video');
  screen = dialog.querySelector('[data-preview-screen]');

  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-show-video]').addEventListener('click', showVideo);
  dialog.querySelector('[data-show-site]').addEventListener('click', showSite);
  dialog.querySelector('[data-retry]').addEventListener('click', () => {
    dialog.querySelector('[data-retry]').hidden = true;
    status('Tentando carregar a gravação.');
    video.src = video.dataset.source;
    video.load();
  });
  iframe.addEventListener('load', () => {
    if (!dialog.open || iframe.dataset.requested !== 'true') return;
    clearTimeout(iframeTimer);
    if (screen.dataset.mode === 'site')
      status('Site interativo carregado. Use rolagem e clique na tela do celular.');
  });
  iframe.addEventListener('error', () => {
    if (!dialog.open || screen.dataset.mode !== 'site') return;
    clearTimeout(iframeTimer);
    iframeFailed = true;
    dialog.querySelector('[data-show-video]').hidden = false;
    status('Não foi possível carregar o site interativo. Você pode assistir à gravação mobile.', true);
  });
  video.addEventListener('loadeddata', () => {
    if (dialog.open && screen.dataset.mode === 'video') status('Gravação pronta. Pressione play para assistir.');
  });
  video.addEventListener('playing', () => status('Reproduzindo a gravação.'));
  video.addEventListener('waiting', () => status('Carregando a gravação…'));
  video.addEventListener('error', () => {
    if (!dialog.open || !video.hasAttribute('src')) return;
    status('Não foi possível reproduzir a gravação.', true);
    dialog.querySelector('[data-retry]').hidden = false;
  });
  dialog.addEventListener('click', event => {
    if (event.target.closest('button, a, video, iframe, [data-preview-screen]')) return;
    if (viewer?.consumeDrag()) return;
    if (!viewer?.hitTest(event.clientX, event.clientY)) dialog.close();
  });
  dialog.addEventListener('close', () => { if (!dialog.open) releasePreview(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) video.pause(); });
  desktop.addEventListener('change', () => { if (!desktop.matches && dialog.open) dialog.close(); });
}

document.addEventListener('click', async event => {
  const button = event.target.closest('[data-mobile-preview]');
  if (!button || !desktop.matches || document.querySelector('dialog[open]')) return;
  if (!dialog) createPreview();
  releasePreview();
  origin = button;
  dialog.setAttribute('aria-label', `Demonstração de ${button.dataset.projectTitle} no celular`);
  iframe.title = `Site ${button.dataset.projectTitle} em uma tela de celular`;
  dialog.querySelector('[data-retry]').hidden = true;
  dialog.querySelector('[data-show-video]').hidden = true;
  dialog.querySelector('[data-show-site]').hidden = true;
  const stage = dialog.querySelector('.mobile-preview__stage');
  stage.setAttribute('aria-busy', 'true');
  delete stage.dataset.fallback;
  status('Carregando o aparelho e o site em visualização mobile.');
  overflow = document.documentElement.style.overflow;
  document.documentElement.style.overflow = 'hidden';
  controller = new AbortController();
  const signal = controller.signal;
  video.dataset.source = button.dataset.mobilePreview;
  video.removeAttribute('src');
  video.hidden = true;
  screen.dataset.mode = 'site';
  iframe.hidden = false;
  iframe.dataset.requested = 'true';
  iframeFailed = false;
  dialog.querySelector('[data-show-video]').hidden = true;
  dialog.showModal();
  document.dispatchEvent(new CustomEvent('resume:skill-open'));
  iframe.src = button.dataset.mobileDemo;
  iframeTimer = setTimeout(() => {
    if (dialog.open && screen.dataset.mode === 'site') {
      iframeFailed = true;
      dialog.querySelector('[data-show-video]').hidden = false;
      status('O site ainda não carregou. Você pode assistir à gravação mobile.', true);
    }
  }, 8000);
  try {
    const { createPhoneViewer } = await import('./mobile-phone-viewer.js?v=cs-mode-3');
    if (signal.aborted) return;
    const nextViewer = await createPhoneViewer(stage, screen, signal);
    if (signal.aborted) { nextViewer?.dispose(); return; }
    viewer = nextViewer;
  } catch {
    if (signal.aborted) return;
    stage.dataset.fallback = 'true';
    status('Não foi possível carregar o celular 3D. O site permanece disponível na visualização mobile.', true);
  } finally {
    if (!signal.aborted) stage.setAttribute('aria-busy', 'false');
  }
});
