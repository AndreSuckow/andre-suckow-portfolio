const desktop = matchMedia('(hover: hover) and (pointer: fine)');
let dialog, iframe, screen, stage, origin, overflow, viewer, controller, iframeTimer, iframeEpoch = 0;

function status(text, error = false) {
  dialog.querySelector('[data-preview-status]').textContent = text;
  dialog.dataset.error = String(error);
}

function showFallback(message) {
  if (!dialog.open || dialog.querySelector('[data-mobile-fallback]').hidden === false) return;
  clearTimeout(iframeTimer);
  iframeTimer = null;
  iframe.dataset.requested = 'false';
  iframe.hidden = true;
  stage.setAttribute('aria-busy', 'false');
  dialog.querySelector('[data-project-url]').value = iframe.dataset.projectUrl;
  dialog.querySelector('[data-copy-feedback]').textContent = '';
  dialog.querySelector('[data-mobile-fallback]').hidden = false;
  status(message, true);
  dialog.querySelector('[data-mobile-fallback]').focus({ preventScroll: true });
}

function requestSite(url) {
  const epoch = ++iframeEpoch;
  const wasFallbackOpen = !dialog.querySelector('[data-mobile-fallback]').hidden;
  clearTimeout(iframeTimer);
  iframeTimer = null;
  dialog.querySelector('[data-mobile-fallback]').hidden = true;
  if (wasFallbackOpen) stage.focus({ preventScroll: true });
  iframe.hidden = false;
  iframe.dataset.projectUrl = url;
  iframe.dataset.requested = 'false';
  stage.setAttribute('aria-busy', 'true');
  status('Carregando o site do projeto na tela do celular.');
  requestAnimationFrame(() => {
    if (!dialog.open || epoch !== iframeEpoch) return;
    iframe.dataset.requested = 'true';
    iframe.src = url;
    iframeTimer = setTimeout(() => {
      if (dialog.open && epoch === iframeEpoch && iframe.dataset.requested === 'true')
        showFallback('A prévia não respondeu. Você ainda pode abrir o projeto no celular.');
    }, 8000);
  });
}

async function copyProjectUrl() {
  const input = dialog.querySelector('[data-project-url]');
  let timeout;
  try {
    input.focus();
    input.select();
    if (!navigator.clipboard?.writeText) throw Error('Clipboard unavailable');
    await Promise.race([
      navigator.clipboard.writeText(input.value),
      new Promise((_, reject) => {
        timeout = setTimeout(() => reject(Error('Clipboard request timed out')), 2000);
      }),
    ]);
    dialog.querySelector('[data-copy-feedback]').textContent =
      'Link copiado. Envie-o para você no celular e abra no navegador.';
  } catch {
    dialog.querySelector('[data-copy-feedback]').textContent =
      'Não foi possível copiar automaticamente. Selecione o endereço exibido e envie para o celular.';
  } finally {
    clearTimeout(timeout);
  }
}

function releasePreview() {
  if (!controller || controller.signal.aborted) return;
  clearTimeout(iframeTimer);
  iframeTimer = null;
  iframeEpoch++;
  controller.abort();
  viewer?.dispose();
  viewer = null;
  iframe.removeAttribute('src');
  iframe.dataset.requested = 'false';
  delete iframe.dataset.projectUrl;
  iframe.hidden = false;
  dialog.querySelector('[data-mobile-fallback]').hidden = true;
  dialog.querySelector('[data-project-url]').value = '';
  dialog.querySelector('[data-copy-feedback]').textContent = '';
  stage.removeAttribute('data-fallback');
  stage.setAttribute('aria-busy', 'true');
  dialog.removeAttribute('data-error');
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
      </div>
    </div>
    <section class="mobile-preview__fallback" data-mobile-fallback hidden role="alert" aria-labelledby="mobile-preview-fallback-title" aria-describedby="mobile-preview-fallback-description" tabindex="-1">
      <p class="eyebrow">Prévia indisponível</p>
      <h2 id="mobile-preview-fallback-title">Veja o projeto no celular</h2>
      <p id="mobile-preview-fallback-description">Não foi possível carregar a prévia interativa. Siga estes passos para abrir o site no seu celular:</p>
      <ol>
        <li>Toque em <strong>Copiar endereço do projeto</strong>.</li>
        <li>Envie o link para você mesmo pelo WhatsApp ou e-mail.</li>
        <li>Abra essa mensagem no celular e toque no link.</li>
        <li>O site abrirá no navegador do celular; role a página para explorar.</li>
      </ol>
      <label class="mobile-preview__url">Endereço do projeto<input type="url" readonly data-project-url></label>
      <div class="mobile-preview__fallback-actions">
        <button class="btn btn--primary" type="button" data-copy-project>Copiar endereço do projeto</button>
        <button class="btn" type="button" data-retry-site>Tentar prévia novamente</button>
      </div>
      <p class="mobile-preview__copy-feedback" data-copy-feedback role="status" aria-live="polite"></p>
    </section>
    <div class="mobile-preview__feedback"><p data-preview-status role="status" aria-live="polite"></p></div>`;
  document.body.append(dialog);
  iframe = dialog.querySelector('iframe');
  screen = dialog.querySelector('[data-preview-screen]');
  stage = dialog.querySelector('.mobile-preview__stage');
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-copy-project]').addEventListener('click', copyProjectUrl);
  dialog.querySelector('[data-retry-site]').addEventListener('click', () =>
    requestSite(iframe.dataset.projectUrl),
  );
  iframe.addEventListener('load', () => {
    if (!dialog.open || iframe.dataset.requested !== 'true') return;
    clearTimeout(iframeTimer);
    iframeTimer = null;
    const wasFallbackOpen = !dialog.querySelector('[data-mobile-fallback]').hidden;
    dialog.querySelector('[data-mobile-fallback]').hidden = true;
    if (wasFallbackOpen) stage.focus({ preventScroll: true });
    iframe.hidden = false;
    stage.setAttribute('aria-busy', 'false');
    status('Site interativo aberto. Role e clique dentro da tela do celular.');
  });
  iframe.addEventListener('error', () =>
    showFallback('Não foi possível carregar a prévia. Você ainda pode abrir o projeto no celular.'),
  );
  dialog.addEventListener('click', event => {
    if (event.target.closest('button, a, input, iframe, [data-preview-screen], [data-mobile-fallback]')) return;
    if (viewer?.consumeDrag()) return;
    if (!viewer?.hitTest(event.clientX, event.clientY)) dialog.close();
  });
  dialog.addEventListener('close', () => { if (!dialog.open) releasePreview(); });
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
  stage.setAttribute('aria-busy', 'true');
  delete stage.dataset.fallback;
  dialog.querySelector('[data-mobile-fallback]').hidden = true;
  dialog.querySelector('[data-project-url]').value = button.dataset.mobileDemo;
  dialog.querySelector('[data-copy-feedback]').textContent = '';
  status('Carregando o aparelho e o site em visualização mobile.');
  overflow = document.documentElement.style.overflow;
  document.documentElement.style.overflow = 'hidden';
  controller = new AbortController();
  const signal = controller.signal;
  iframe.hidden = false;
  dialog.showModal();
  document.dispatchEvent(new CustomEvent('resume:skill-open'));
  requestSite(button.dataset.mobileDemo);
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
