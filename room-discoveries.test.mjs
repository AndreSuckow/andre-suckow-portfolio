import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';
const html = fs.readFileSync('src/room-discoveries.html', 'utf8');
test('Discman touch controls follow device changes without reopening the player', () => {
  const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'http://localhost:4173/' }),
    w = dom.window,
    d = w.document,
    media = new w.EventTarget();
  media.matches = true;
  w.matchMedia = (query) => (query.includes('max-width') ? media : { matches: false });
  w.HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  w.eval(fs.readFileSync('public/room-discoveries.js', 'utf8').replace(/^import .*;\r?\n/gm, ''));
  const modal = d.getElementById('games-notebook');
  let opens = 0;
  d.addEventListener('room:notebook-view', () => opens++);
  d.querySelector('[data-notebook-canvas]').dataset.ready = 'true';
  d.querySelector('[data-room-inspect=discman]').click();
  d.dispatchEvent(new w.CustomEvent('room:drawer-ready'));
  assert.equal(modal.dataset.touchControls, 'true');
  assert.match(d.querySelector('#notebook-description').textContent, /botões grandes/);
  media.matches = false;
  media.dispatchEvent(new w.Event('change'));
  assert.equal(modal.dataset.touchControls, 'false');
  assert.match(d.querySelector('#notebook-description').textContent, /pontos âmbar/);
  media.matches = true;
  media.dispatchEvent(new w.Event('change'));
  assert(modal.open);
  assert.equal(opens, 1);
  assert(!d.querySelector('[data-discman-player]').hidden);
  assert.equal(modal.dataset.touchControls, 'true');
  dom.window.close();
});
test('cached engines keep loading the imported portrait through its original URL', () => {
  const root = 'public/models',
    legacy = JSON.parse(fs.readFileSync(path.join(root, 'family-frame.gltf'), 'utf8'));
  const portrait = JSON.parse(
    fs.readFileSync(path.join(root, 'portrait/family-frame.gltf'), 'utf8'),
  );
  for (const key of ['buffers', 'images'])
    legacy[key].forEach((item, i) => {
      assert.equal(item.uri, 'portrait/' + portrait[key][i].uri);
      assert(
        fs
          .readFileSync(path.join(root, item.uri))
          .equals(fs.readFileSync(path.join(root, 'portrait', portrait[key][i].uri))),
      );
      item.uri = portrait[key][i].uri;
    });
  assert.deepEqual(legacy, portrait, 'Both URLs describe the same supplied model');
  const loader = fs.readFileSync('public/model-loader.js', 'utf8');
  assert(loader.includes('./models/portrait/family-frame.gltf?v=cs-mode-3'));
});

test('inspection has only plus/minus manipulation controls and the Bible link in the same side actions', () => {
  const dom = new JSDOM(html),
    d = dom.window.document;
  assert.deepEqual(
    [...d.querySelectorAll('.notebook-inspector__tools button')].map(
      (button) => button.dataset.notebookView,
    ),
    ['in', 'out'],
  );
  assert.equal(
    d.querySelectorAll(
      '[data-notebook-tool],[data-notebook-view="left"],[data-notebook-view="right"],[data-notebook-view="reset"]',
    ).length,
    0,
  );
  assert(d.querySelector('.notebook-inspector__actions [data-room-bible]'));
  dom.window.close();
});
test('second drawer waits for its animation and opens only the Discman controls', () => {
  const dom = new JSDOM('<html data-mode="3d"><body>' + html + '</body></html>', {
      runScripts: 'outside-only',
      url: 'http://localhost:4173/',
    }),
    w = dom.window,
    d = w.document;
  w.matchMedia = () => ({ matches: false });
  w.HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  w.HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
    this.dispatchEvent(new w.Event('close'));
  };
  w.eval(fs.readFileSync('public/room-discoveries.js', 'utf8').replace(/^import .*;\r?\n/gm, ''));
  const changes = [];
  d.addEventListener('room:drawer', (e) => changes.push(JSON.parse(JSON.stringify(e.detail))));
  d.querySelector('[data-room-inspect="discman"]').click();
  const modal = d.getElementById('games-notebook');
  assert(!modal.open);
  assert.deepEqual(changes, [{ open: true, kind: 'discman' }]);
  d.dispatchEvent(new w.CustomEvent('room:drawer-opened'));
  assert(!modal.open);
  d.dispatchEvent(new w.CustomEvent('room:drawer-ready'));
  assert(modal.open);
  assert.equal(modal.dataset.object, 'discman');
  assert(!d.querySelector('[data-discman-player]').hidden);
  assert(d.querySelector('[data-room-bible]').hidden);
  assert(d.querySelector('.notebook-inspector__text').hidden);
  modal.close();
  assert.deepEqual(changes[1], { open: false, kind: 'discman' });
  dom.window.close();
});

test('Discman supports playback, pause, missing audio and reserved tracks without false playback', async () => {
  const dom = new JSDOM('<body>' + html + '</body>', {
      runScripts: 'outside-only',
      url: 'http://localhost:4173/',
    }),
    w = dom.window,
    d = w.document;
  let audio;
  class FakeAudio extends w.EventTarget {
    constructor() {
      super();
      this.paused = true;
      this.ended = false;
      this.src = '';
      audio = this;
    }
    pause() {
      this.paused = true;
      this.dispatchEvent(new w.Event('pause'));
    }
    async play() {
      if (this.fail)
        throw Object.assign(Error('missing'), {
          name: this.fail === 'blocked' ? 'NotAllowedError' : 'Error',
        });
      this.paused = false;
      this.dispatchEvent(new w.Event('play'));
    }
    load() {}
    removeAttribute() {
      this.src = '';
    }
  }
  const playlist = [
    { title: 'CPM 22 - Dias Atrás', file: '01-cpm22-dias-atras.mp3' },
    ...Array.from({ length: 4 }, (_, i) => ({ title: `Faixa ${i + 2} · a escolher`, file: null })),
  ];
  w.Audio = FakeAudio;
  w.matchMedia = () => ({ matches: false });
  w.fetch = async () => ({ ok: true, json: async () => playlist });
  w.eval(
    fs
      .readFileSync('public/discman-player.js', 'utf8')
      .replace('export const', 'const')
      .replaceAll('import.meta.url', "'http://localhost:4173/discman-player.js'"),
  );
  const modal = d.getElementById('games-notebook');
  modal.setAttribute('open', '');
  modal.dataset.object = 'discman';
  d.dispatchEvent(new w.CustomEvent('room:notebook-view', { detail: 'discman' }));
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(d.querySelectorAll('[data-discman-track]').length, 5);
  const toggle = d.querySelector('[data-discman-toggle]');
  toggle.click();
  await new Promise((r) => setTimeout(r, 0));
  assert(!audio.paused);
  assert.equal(toggle.getAttribute('aria-pressed'), 'true');
  assert(audio.src.endsWith('/audio/discman/01-cpm22-dias-atras.mp3'));
  d.dispatchEvent(new w.CustomEvent('discman:control', { detail: 'pause' }));
  assert(audio.paused);
  assert.equal(discmanTrackIndex(), 0, 'The physical stop button pauses without changing track');
  toggle.click();
  await new Promise((r) => setTimeout(r, 0));
  assert(!audio.paused);
  d.querySelector('[data-discman-pause]').click();
  assert(audio.paused);
  audio.fail = true;
  toggle.click();
  await new Promise((r) => setTimeout(r, 0));
  assert(d.querySelector('[data-discman-status]').textContent.includes('MP3 autorizado'));
  assert.equal(toggle.getAttribute('aria-pressed'), 'false');
  d.querySelector('[data-discman-track="1"]').click();
  toggle.click();
  await new Promise((r) => setTimeout(r, 0));
  assert(audio.paused);
  assert(d.querySelector('[data-discman-status]').textContent.includes('reservada'));
  d.querySelector('[data-discman-track="0"]').click();
  audio.fail = 'blocked';
  toggle.click();
  await new Promise((r) => setTimeout(r, 0));
  assert(audio.paused);
  assert(d.querySelector('[data-discman-status]').textContent.includes('navegador bloqueou'));
  audio.fail = false;
  toggle.click();
  await new Promise((r) => setTimeout(r, 0));
  assert(!audio.paused, 'Playback can be retried after browser rejection');
  d.dispatchEvent(new w.CustomEvent('discman:control', { detail: 'play' }));
  assert(!audio.paused, 'Ouvir never toggles playback off');
  d.dispatchEvent(new w.CustomEvent('discman:volume', { detail: 2 }));
  assert.equal(audio.volume, 1);
  assert.equal(d.querySelector('[data-discman-volume-value]').textContent, '100%');
  d.dispatchEvent(new w.CustomEvent('discman:volume', { detail: -1 }));
  assert.equal(audio.volume, 0);
  const volume = d.querySelector('[data-discman-volume]');
  volume.value = '35';
  volume.dispatchEvent(new w.Event('input'));
  assert.equal(audio.volume, 0.35);
  d.dispatchEvent(new w.CustomEvent('room:notebook-view', { detail: false }));
  assert(audio.paused);
  dom.window.close();
  function discmanTrackIndex() {
    return +d.querySelector('[data-discman-track][aria-current="true"]').dataset.discmanTrack;
  }
});
test('drawer opens one notebook, preserves the game lists, and restores focus and scroll', () => {
  const dom = new JSDOM(
      '<html data-mode="3d" data-room-version="novo-quarto-3d"><body>' + html + '</body></html>',
      { runScripts: 'outside-only', url: 'http://localhost:4173/' },
    ),
    w = dom.window,
    d = w.document;
  const pending = [];
  w.setTimeout = (fn) => {
    pending.push(fn);
    return pending.length;
  };
  w.matchMedia = () => ({ matches: false });
  w.HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  w.HTMLDialogElement.prototype.close = function () {
    if (this.open) {
      this.removeAttribute('open');
      this.dispatchEvent(new w.Event('close'));
    }
  };
  w.eval(fs.readFileSync('public/room-discoveries.js', 'utf8').replace(/^import .*;\r?\n/gm, ''));
  const trigger = d.querySelector('[data-room-notebook]'),
    dialog = d.getElementById('games-notebook');
  assert(!d.querySelector('[data-room-discoveries]'));
  trigger.focus();
  d.body.style.overflow = 'auto';
  const changes = [];
  let stopped = 0,
    resumed = 0;
  d.addEventListener('room:drawer', (event) => changes.push(event.detail));
  d.addEventListener('resume:skill-open', () => stopped++);
  d.addEventListener('resume:skill-close', () => resumed++);
  trigger.click();
  trigger.click();
  assert.equal(pending.length, 0);
  assert.equal(stopped, 1);
  assert.equal(d.body.style.overflow, 'hidden');
  assert(!dialog.open);
  assert.equal(d.querySelector('[data-drawer-focus]').dataset.phase, 'opening');
  d.dispatchEvent(new w.CustomEvent('room:drawer-opened'));
  assert(!dialog.open, 'Drawer must open before the notebook modal');
  assert.equal(d.querySelector('[data-drawer-focus]').dataset.phase, 'fading');
  d.dispatchEvent(new w.CustomEvent('room:drawer-ready'));
  assert(dialog.open);
  assert(d.querySelector('[data-drawer-focus]').hidden);
  assert.equal(d.activeElement, dialog.querySelector('[data-notebook-close]'));
  assert.equal(dialog.querySelectorAll('.games-notebook__completed s').length, 4);
  assert.equal(dialog.querySelectorAll('#games-pending-title + ul li').length, 10);
  assert(
    [...dialog.querySelectorAll('#games-pending-title + ul li')].some(
      (item) => item.textContent === 'Super Mario Kart',
    ),
  );
  assert(
    !dialog.querySelector('.games-notebook__completed').textContent.includes('Super Mario Kart'),
  );
  assert(
    [...dialog.querySelectorAll('.games-notebook__completed s')].some(
      (item) => item.textContent === 'Teenage Mutant Ninja Turtles IV: Turtles in Time',
    ),
  );
  assert.equal(
    dialog
      .querySelector('.games-notebook__pages > section:first-child')
      .getAttribute('aria-labelledby'),
    'games-pending-title',
  );
  assert.equal(
    dialog
      .querySelector('.games-notebook__pages > section:last-child')
      .getAttribute('aria-labelledby'),
    'games-completed-title',
  );
  assert(dialog.textContent.includes('Mega Man X'));
  assert(dialog.textContent.includes('Super Mario RPG'));
  dialog.querySelector('[data-notebook-close]').click();
  assert(!dialog.open);
  assert.equal(resumed, 1);
  assert.deepEqual(changes, [true, false]);
  assert.equal(d.body.style.overflow, 'auto');
  assert.equal(d.activeElement, trigger);
  const bible = d.querySelector('[data-room-bible]');
  assert.equal(bible.href, 'https://www.bibliaonline.com.br/ntlh/livros');
  assert.equal(bible.target, '_blank');
  assert(bible.rel.includes('noopener'));
  trigger.click();
  d.dispatchEvent(
    new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
  );
  d.dispatchEvent(new w.CustomEvent('room:drawer-ready'));
  assert(!dialog.open, 'Escape cancels pending opening and ignores a late completion');
  assert(d.querySelector('[data-drawer-focus]').hidden);
  assert.equal(d.body.style.overflow, 'auto');
  dom.window.close();
});

test('Bible, Pokedex and family share inspection controls, with the reading link only on the Bible', () => {
  const dom = new JSDOM(
      '<html data-mode="3d" data-room-version="novo-quarto-3d"><body>' + html + '</body></html>',
      { runScripts: 'outside-only', url: 'http://localhost:4173/' },
    ),
    w = dom.window,
    d = w.document,
    queue = [];
  w.matchMedia = () => ({ matches: false });
  w.setTimeout = (fn) => queue.push(fn);
  w.HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  w.HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
    this.dispatchEvent(new w.Event('close'));
  };
  w.eval(fs.readFileSync('public/room-discoveries.js', 'utf8').replace(/^import .*;\r?\n/gm, ''));
  const dialog = d.getElementById('games-notebook'),
    views = [],
    drawers = [];
  d.addEventListener('room:notebook-view', (event) => views.push(event.detail));
  d.addEventListener('room:drawer', (event) => drawers.push(event.detail));
  for (const [kind, title] of [
    ['bible', 'Bíblia Sagrada'],
    ['pokedex', 'Pokédex'],
    ['family', 'Quadro da família'],
  ]) {
    d.querySelector(`[data-room-inspect="${kind}"]`).click();
    queue.shift()();
    assert(dialog.open);
    assert.equal(dialog.dataset.object, kind);
    assert.equal(d.getElementById('notebook-title').textContent, title);
    assert.equal(dialog.querySelector('[data-room-bible]').hidden, kind !== 'bible');
    assert(dialog.querySelector('.notebook-inspector__text').hidden);
    assert.equal(dialog.querySelector('[data-family-credit]').hidden, kind !== 'family');
    assert.equal(dialog.querySelector('[data-bible-credit]').hidden, kind !== 'bible');
    assert.equal(dialog.querySelector('[data-pokedex-credit]').hidden, kind !== 'pokedex');
    if (kind === 'family')
      assert(dialog.querySelector('[data-family-credit]').textContent.includes('3dwstudio'));
    assert(
      dialog.querySelector('[data-notebook-canvas]').getAttribute('aria-label').includes(title),
    );
    dialog.querySelector('[data-notebook-close]').click();
    assert(!dialog.open);
  }
  assert.deepEqual(views, ['bible', false, 'pokedex', false, 'family', false]);
  assert.deepEqual(drawers, [], 'Inspecting tabletop objects does not open the desk drawer');
  dom.window.close();
});
