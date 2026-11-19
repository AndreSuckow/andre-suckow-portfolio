// One audio context for the HTML controls, keyboard/gamepad navigation and the 3D TV.
const preferenceKey = 'andre:prefs';
function preferences() {
  try {
    return JSON.parse(localStorage.getItem(preferenceKey) || '{}');
  } catch {
    return {};
  }
}
export class PortfolioAudio {
  constructor(enabled = true) {
    this.enabled = enabled;
    this.ctx = null;
    this.master = null;
    this.noiseBuf = null;
    this.resuming = null;
    this.unlock = () => {
      if (this.enabled) this.ensure();
    };
    for (const type of ['pointerdown', 'keydown', 'touchend'])
      window.addEventListener(type, this.unlock, { capture: true, passive: true });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.enabled && this.ctx) this.ensure();
    });
  }
  setEnabled(enabled) {
    this.enabled = enabled;
    try {
      localStorage.setItem(preferenceKey, JSON.stringify({ ...preferences(), sound: enabled }));
    } catch {}
    if (enabled) this.ensure();
    else this.ctx?.suspend().catch(() => {});
    updateSoundButton();
    return this.resuming || Promise.resolve();
  }
  ensure() {
    if (!this.enabled) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    if (!this.ctx || this.ctx.state === 'closed') {
      try {
        this.ctx = new AudioContext();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.22;
        this.master.connect(this.ctx.destination);
        this.noiseBuf = this.ctx.createBuffer(
          1,
          Math.floor(this.ctx.sampleRate * 0.6),
          this.ctx.sampleRate,
        );
        const samples = this.noiseBuf.getChannelData(0);
        for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
      } catch {
        return;
      }
    }
    if (this.ctx.state !== 'running' && !this.resuming) {
      this.resuming = this.ctx
        .resume()
        .catch(() => {})
        .finally(() => {
          this.resuming = null;
        });
    }
  }
  tone(frequency, duration, type = 'square', volume = 0.5, delay = 0, endFrequency) {
    if (!this.enabled) return;
    this.ensure();
    if (!this.ctx || !this.master || this.ctx.state !== 'running') return;
    const time = this.ctx.currentTime + delay,
      oscillator = this.ctx.createOscillator(),
      gain = this.ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, time);
    if (endFrequency)
      oscillator.frequency.exponentialRampToValueAtTime(endFrequency, time + duration);
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    oscillator.connect(gain).connect(this.master);
    oscillator.start(time);
    oscillator.stop(time + duration + 0.02);
  }
  noise(duration, volume = 0.4, frequency = 2000, delay = 0) {
    if (!this.enabled) return;
    this.ensure();
    if (!this.ctx || !this.master || !this.noiseBuf || this.ctx.state !== 'running') return;
    const time = this.ctx.currentTime + delay,
      source = this.ctx.createBufferSource(),
      filter = this.ctx.createBiquadFilter(),
      gain = this.ctx.createGain();
    source.buffer = this.noiseBuf;
    filter.type = 'bandpass';
    filter.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    source.connect(filter).connect(gain).connect(this.master);
    source.start(time);
    source.stop(time + duration + 0.02);
  }
  blip() {
    this.tone(880, 0.05, 'square', 0.25);
  }
  select() {
    this.tone(660, 0.06, 'square', 0.3);
    this.tone(990, 0.08, 'square', 0.3, 0.06);
  }
  back() {
    this.tone(520, 0.07, 'square', 0.28, 0, 300);
  }
  tab() {
    this.tone(740, 0.04, 'triangle', 0.4);
  }
  power(on) {
    this.noise(on ? 0.35 : 0.25, 0.5, on ? 900 : 500);
    this.tone(on ? 60 : 90, 0.3, 'sine', 0.6, 0, on ? 120 : 40);
  }
  boot() {
    [523.25, 659.25, 783.99, 1046.5].forEach((note, i) =>
      this.tone(note, 0.18, 'triangle', 0.45, 0.9 + i * 0.11),
    );
    this.tone(1318.5, 0.5, 'triangle', 0.4, 1.34);
  }
  start() {
    this.tone(784, 0.07, 'square', 0.3);
    this.tone(1175, 0.18, 'square', 0.3, 0.07);
  }
  insert() {
    this.noise(0.08, 0.6, 3000);
    this.tone(140, 0.09, 'square', 0.4, 0.02);
  }
  eject() {
    this.tone(200, 0.25, 'triangle', 0.5, 0, 900);
    this.noise(0.05, 0.4, 3500);
  }
  error() {
    this.tone(220, 0.12, 'square', 0.35);
    this.tone(160, 0.2, 'square', 0.35, 0.12);
  }
  secret() {
    [523, 659, 784, 1047, 784, 1047].forEach((note, i) =>
      this.tone(note, 0.1, 'square', 0.3, i * 0.09),
    );
  }
  staticBurst(duration = 0.3) {
    this.noise(duration, 0.25, 4000);
  }
}
export const portfolioAudio = new PortfolioAudio(preferences().sound !== false);
function updateSoundButton() {
  const button = document.querySelector('[data-toggle="sound"]');
  if (!button) return;
  button.setAttribute('aria-pressed', String(portfolioAudio.enabled));
  const label = portfolioAudio.enabled
    ? 'Som ligado — clique para silenciar'
    : 'Som desligado — clique para ativar';
  button.setAttribute('aria-label', label);
  button.title = `${label} (M)`;
}
async function toggleSound() {
  await portfolioAudio.setEnabled(!portfolioAudio.enabled);
  if (portfolioAudio.enabled) portfolioAudio.select();
  const announcer = document.getElementById('announcer');
  if (announcer) announcer.textContent = portfolioAudio.enabled ? 'Som ligado' : 'Som desligado';
}
document.querySelector('[data-toggle="sound"]')?.addEventListener('click', toggleSound);
document.addEventListener('keydown', (event) => {
  if (
    document.documentElement.dataset.mode === '3d' ||
    event.repeat ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey ||
    event.target.closest('input,textarea,select,[contenteditable="true"]')
  )
    return;
  if (event.key.toLowerCase() === 'm') toggleSound();
});
function control(target) {
  const element = target.closest('button,a');
  if (
    !element ||
    element.disabled ||
    element.getAttribute('aria-disabled') === 'true' ||
    element.matches('[data-toggle="sound"]')
  )
    return null;
  if (document.documentElement.dataset.mode === '3d' && element.matches('[data-tv],[data-pad]'))
    return null;
  return element;
}
let lastHover = null,
  lastBlip = 0;
document.addEventListener('pointerover', (event) => {
  if (event.pointerType === 'touch') return;
  const element = control(event.target);
  if (!element || element === lastHover) return;
  lastHover = element;
  if (performance.now() - lastBlip > 90) {
    lastBlip = performance.now();
    portfolioAudio.blip();
  }
});
document.addEventListener('focusin', (event) => {
  if (control(event.target) && performance.now() - lastBlip > 90) {
    lastBlip = performance.now();
    portfolioAudio.blip();
  }
});
document.addEventListener(
  'click',
  (event) => {
    if (control(event.target)) portfolioAudio.select();
  },
  true,
);
updateSoundButton();
