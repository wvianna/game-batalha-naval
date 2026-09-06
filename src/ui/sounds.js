// Efeitos sonoros sintetizados com Web Audio API (sem assets externos).
// Inclui ganho mestre, controle de volume/mudo e desbloqueio do contexto de
// áudio dentro de um gesto do usuário (autoplay). Camada de UI apenas.

let audioCtx = null;
let master = null;
let enabled = true;
let volume = 0.8;
let scheduled = 0;

const isDebug = () =>
  typeof window !== 'undefined' &&
  window.location &&
  new URLSearchParams(window.location.search).has('debug');

export function isEnabled() {
  return enabled;
}

export function setEnabled(value) {
  enabled = Boolean(value);
  if (master) master.gain.value = enabled ? volume : 0;
  syncDebug();
}

export function setVolume(value) {
  volume = Math.min(1, Math.max(0, value));
  if (master && enabled) master.gain.value = volume;
  syncDebug();
}

function ensureContext() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
    master = audioCtx.createGain();
    master.gain.value = enabled ? volume : 0;
    master.connect(audioCtx.destination);
    syncDebug();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function syncDebug() {
  if (!isDebug()) return;
  window.__battleshipAudio = {
    get state() {
      return audioCtx ? audioCtx.state : 'none';
    },
    get enabled() {
      return enabled;
    },
    get volume() {
      return master ? master.gain.value : 0;
    },
    get scheduled() {
      return scheduled;
    },
  };
}

/** Cria/retoma o contexto de áudio. Deve ser chamado dentro de um gesto. */
export function unlock() {
  ensureContext();
}

/** Blip audível (dois tons) para o usuário confirmar que o som está ativo. */
export function testSound() {
  const ctx = ensureContext();
  if (!ctx || !enabled) return;
  const t = ctx.currentTime;
  [660, 880].forEach((freq, idx) => {
    tone({ type: 'sine', f0: freq, f1: freq, dur: 0.18, peak: 0.45, attack: 0.015, delay: idx * 0.13 });
  });
  scheduled += 1;
}

function noiseBuffer(ctx, seconds) {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function toMaster(node) {
  node.connect(master);
}

function envelope(gain, start, peak, attack, end) {
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
}

function noiseBurst({ dur, type = 'lowpass', f0, f1, q = 1, peak = 0.5, attack = 0.01, delay = 0 }) {
  const ctx = audioCtx;
  const t = ctx.currentTime + delay;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, dur);
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.Q.value = q;
  filter.frequency.setValueAtTime(f0, t);
  filter.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const gain = ctx.createGain();
  envelope(gain, t, peak, attack, t + dur);
  src.connect(filter);
  filter.connect(gain);
  toMaster(gain);
  src.start(t);
  src.stop(t + dur + 0.05);
}

function tone({ type = 'sine', f0, f1, dur = 0.3, peak = 0.5, attack = 0.01, delay = 0 }) {
  const ctx = audioCtx;
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, t);
  osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const gain = ctx.createGain();
  envelope(gain, t, peak, attack, t + dur);
  osc.connect(gain);
  toMaster(gain);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

/** Água atingida: "splash" claro e audível. */
export function playSplash() {
  const ctx = ensureContext();
  if (!ctx || !enabled) return;
  noiseBurst({ dur: 0.5, type: 'bandpass', f0: 2600, f1: 500, q: 1.1, peak: 0.55, attack: 0.02 });
  tone({ type: 'sine', f0: 500, f1: 220, dur: 0.18, peak: 0.22, attack: 0.015 });
  scheduled += 1;
}

/** Navio atingido: impacto (estalo metálico + baque audível). */
export function playImpact() {
  const ctx = ensureContext();
  if (!ctx || !enabled) return;
  noiseBurst({ dur: 0.28, type: 'lowpass', f0: 1800, f1: 280, peak: 0.6, attack: 0.006 });
  noiseBurst({ dur: 0.14, type: 'bandpass', f0: 3200, f1: 1600, q: 1.6, peak: 0.3, attack: 0.004 });
  tone({ type: 'sine', f0: 240, f1: 60, dur: 0.32, peak: 0.6, attack: 0.008 });
  tone({ type: 'square', f0: 440, f1: 120, dur: 0.1, peak: 0.12, attack: 0.004 });
  scheduled += 1;
}

/** Naufrágio: explosão maior (grave + estalo + rumble). */
export function playExplosion() {
  const ctx = ensureContext();
  if (!ctx || !enabled) return;
  noiseBurst({ dur: 1.0, type: 'lowpass', f0: 900, f1: 90, peak: 0.7, attack: 0.01 });
  noiseBurst({ dur: 0.55, type: 'bandpass', f0: 1400, f1: 260, q: 0.8, peak: 0.5, attack: 0.02, delay: 0.02 });
  noiseBurst({ dur: 0.2, type: 'highpass', f0: 2000, f1: 2500, q: 1, peak: 0.35, attack: 0.004, delay: 0.05 });
  tone({ type: 'sine', f0: 160, f1: 38, dur: 1.1, peak: 0.7, attack: 0.015 });
  tone({ type: 'sawtooth', f0: 320, f1: 60, dur: 0.5, peak: 0.18, attack: 0.01, delay: 0.03 });
  scheduled += 1;
}

/** Reproduz o efeito correspondente ao resultado de um disparo. */
export function playShotSound(result) {
  if (result === 'miss') playSplash();
  else if (result === 'sunk') playExplosion();
  else if (result === 'hit') playImpact();
}
