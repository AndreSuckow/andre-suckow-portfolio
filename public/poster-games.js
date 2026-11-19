const dialog = document.getElementById('games-notebook');
const games = JSON.parse(document.getElementById('poster-games').textContent);
const play = dialog.querySelector('[data-poster-play]');
const player = dialog.querySelector('[data-poster-game]');
const frame = player.querySelector('iframe');
const status = player.querySelector('[data-game-status]');
const fullscreen = player.querySelector('[data-game-fullscreen]');
const exit = player.querySelector('[data-game-exit]');
const input = dialog.querySelector('[data-rom-file]');
const error = dialog.querySelector('[data-rom-error]');
const localPlayer = new URL('./emulator/index.html', import.meta.url);
let epoch = 0,
  activeGame = null,
  selectedFile = null,
  mode = null,
  slowTimer = 0,
  pickerObject = null;
function syncFullscreen() {
  fullscreen.textContent =
    document.fullscreenElement === player ? 'Sair da tela cheia' : 'Tela cheia';
  fullscreen.setAttribute('aria-pressed', String(document.fullscreenElement === player));
}
function requestFullscreen() {
  const token = epoch;
  if (!player.requestFullscreen) {
    status.textContent = 'Tela cheia indisponível neste navegador. Você pode jogar nesta janela.';
    return;
  }
  try {
    Promise.resolve(player.requestFullscreen({ navigationUI: 'hide' }))
      .then(() => {
        if (!activeGame && token !== epoch && document.fullscreenElement === player)
          document.exitFullscreen?.().catch(() => {});
        syncFullscreen();
      })
      .catch(() => {
        if (token === epoch && activeGame)
          status.textContent = 'O navegador não liberou tela cheia. Você pode jogar nesta janela.';
      });
  } catch {
    status.textContent = 'O navegador não liberou tela cheia. Você pode jogar nesta janela.';
  }
}
function clearError() {
  error.hidden = true;
  error.textContent = '';
  input.removeAttribute('aria-invalid');
}
function stopGame() {
  epoch++;
  clearTimeout(slowTimer);
  activeGame = null;
  selectedFile = null;
  mode = null;
  pickerObject = null;
  delete dialog.dataset.playing;
  frame.removeAttribute('src');
  frame.title = 'Jogo';
  player.hidden = true;
  input.value = '';
  clearError();
  if (document.fullscreenElement === player) document.exitFullscreen?.().catch(() => {});
  syncFullscreen();
}
function exitGame() {
  if (!activeGame) return;
  stopGame();
  dialog.close();
}
function loadGame() {
  clearTimeout(slowTimer);
  epoch++;
  status.textContent =
    mode === 'local'
      ? 'Carregando o emulador para ' + selectedFile.name + '…'
      : 'Abrindo jogo… O site pode pedir um clique para iniciar.';
  if (mode === 'local') {
    const url = new URL(localPlayer);
    url.searchParams.set('session', String(epoch));
    frame.src = url.href;
  } else frame.src = activeGame.embedUrl;
  const token = epoch;
  slowTimer = setTimeout(() => {
    if (token === epoch && activeGame)
      status.textContent =
        mode === 'local'
          ? 'O emulador está demorando. Confira sua conexão e tente novamente ou escolha outra ROM.'
          : 'Se o jogo não aparecer, tente novamente ou use “Abrir no site”.';
  }, 30000);
}
function startGame(file = null) {
  const game = games.find((item) => item.id === dialog.dataset.object);
  if (!game || !dialog.open) return;
  activeGame = game;
  selectedFile = file;
  mode = file ? 'local' : 'external';
  clearError();
  document.dispatchEvent(new CustomEvent('room:notebook-view', { detail: false }));
  player.querySelector('[data-game-title]').textContent = file ? file.name : game.gameTitle;
  const external = player.querySelector('[data-game-external]');
  external.href = game.url;
  external.hidden = !!file;
  player.querySelector('[data-rom-choose]').hidden = !file;
  frame.title = file ? 'Emulador de Super Nintendo: ' + file.name : 'Jogar ' + game.gameTitle;
  player.hidden = false;
  dialog.dataset.playing = 'true';
  loadGame();
  if (document.fullscreenElement !== player) requestFullscreen();
  exit.focus({ preventScroll: true });
}
play.addEventListener('click', () => {
  if (!activeGame) startGame();
});
dialog.querySelectorAll('[data-rom-choose]').forEach((button) =>
  button.addEventListener('click', () => {
    if (!dialog.open) return;
    pickerObject = dialog.dataset.object;
    input.value = '';
    input.click();
  }),
);
input.addEventListener('change', () => {
  const file = input.files?.[0];
  if (!file || !dialog.open || pickerObject !== dialog.dataset.object) return;
  let message = '';
  if (!/\.(sfc|smc)$/i.test(file.name))
    message = 'Escolha uma ROM de SNES no formato .sfc ou .smc.';
  else if (file.size < 32768)
    message = 'O arquivo está vazio ou pequeno demais para uma ROM de SNES. Escolha outro arquivo.';
  else if (file.size > 16 * 1024 * 1024)
    message = 'A ROM deve ter até 16 MB. Escolha outro arquivo.';
  if (message) {
    input.setAttribute('aria-invalid', 'true');
    if (activeGame) status.textContent = message;
    else {
      error.textContent = message;
      error.hidden = false;
    }
    return;
  }
  startGame(file);
});
frame.addEventListener('load', () => {
  if (!activeGame || mode === 'local') return;
  clearTimeout(slowTimer);
  status.textContent =
    'Use os controles do jogo para iniciar. Se não aparecer, escolha “Abrir no site”.';
});
frame.addEventListener('error', () => {
  if (activeGame) {
    clearTimeout(slowTimer);
    status.textContent = 'Não foi possível abrir. Tente novamente ou escolha outra opção de jogo.';
  }
});
window.addEventListener('message', (event) => {
  const data = event.data;
  if (
    mode !== 'local' ||
    !activeGame ||
    event.source !== frame.contentWindow ||
    event.origin !== location.origin ||
    data?.session !== String(epoch)
  )
    return;
  if (data.type === 'local-rom:ready')
    frame.contentWindow.postMessage(
      { type: 'local-rom:load', session: String(epoch), file: selectedFile },
      location.origin,
    );
  if (data.type === 'local-rom:status') {
    if (data.state === 'fullscreen' && document.fullscreenElement !== player) requestFullscreen();
    if (data.state === 'started') {
      clearTimeout(slowTimer);
      status.textContent =
        'ROM local: ' + selectedFile.name + '. Use o menu do emulador para consultar os controles.';
    }
    if (data.state === 'error') {
      clearTimeout(slowTimer);
      status.textContent = 'Não foi possível iniciar a ROM. Tente novamente ou use “Trocar ROM”.';
    }
  }
});
exit.addEventListener('click', exitGame);
fullscreen.addEventListener('click', () => {
  if (!activeGame) return;
  if (document.fullscreenElement === player) document.exitFullscreen?.().catch(() => {});
  else requestFullscreen();
});
player.querySelector('[data-game-retry]').addEventListener('click', () => {
  if (activeGame) loadGame();
});
dialog.addEventListener('cancel', (event) => {
  if (activeGame) {
    event.preventDefault();
    exitGame();
  }
});
dialog.addEventListener('close', stopGame);
document.addEventListener('fullscreenchange', syncFullscreen);
document.addEventListener('room:notebook-view', (event) => {
  if (event.detail && !activeGame) clearError();
});
