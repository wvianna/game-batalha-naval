// Efeitos sonoros sintetizados com Web Audio API (sem assets externos).
// Camada de UI apenas: não afeta a lógica do jogo e falha silenciosamente
// quando o navegador não suporta áudio.

let audioCtx = null;

function ensureContext() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function noiseBuffer(ctx, seconds) {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

/** Ganho com fade-in rápido e fade-out suave (evita "clicks"). */
function gainEnvelope(ctx, { start, attack = 0.01, peak = 0.3, decay, end }) {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  return gain;
}

/** Água atingida: ruído "splash" (bandpass descendo). */
export function playSplash() {
  const ctx = ensureContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  const duration = 0.45;

  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, duration);

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 1.5;
  filter.frequency.setValueAtTime(1800, t);
  filter.frequency.exponentialRampToValueAtTime(450, t + duration);

  const gain = gainEnvelope(ctx, { start: t, attack: 0.025, peak: 0.3, end: t + duration });

  src.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  src.start(t);
  src.stop(t + duration + 0.05);
}

/** Navio atingido: impacto seco (estalo + baque grave). */
export function playImpact() {
  const ctx = ensureContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  const duration = 0.3;

  // Ruído metálico filtrado.
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, duration);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(950, t);
  lp.frequency.exponentialRampToValueAtTime(200, t + duration);
  const gNoise = gainEnvelope(ctx, { start: t, attack: 0.008, peak: 0.5, end: t + duration });
  src.connect(lp);
  lp.connect(gNoise);
  gNoise.connect(ctx.destination);
  src.start(t);
  src.stop(t + duration + 0.05);

  // Baque grave (oscilador descendente).
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(48, t + duration);
  const gOsc = gainEnvelope(ctx, { start: t, attack: 0.012, peak: 0.5, end: t + duration });
  osc.connect(gOsc);
  gOsc.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duration + 0.05);
}

/** Naufrágio: explosão mais grave e longa. */
export function playExplosion() {
  const ctx = ensureContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  const duration = 0.9;

  // Explosão: ruído grave com decaimento mais longo.
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, duration);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(700, t);
  lp.frequency.exponentialRampToValueAtTime(90, t + duration);
  const gNoise = gainEnvelope(ctx, { start: t, attack: 0.01, peak: 0.6, end: t + duration });
  src.connect(lp);
  lp.connect(gNoise);
  gNoise.connect(ctx.destination);
  src.start(t);
  src.stop(t + duration + 0.05);

  // Subgrave (rumble).
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(95, t);
  osc.frequency.exponentialRampToValueAtTime(28, t + duration);
  const gOsc = gainEnvelope(ctx, { start: t, attack: 0.02, peak: 0.7, end: t + duration });
  osc.connect(gOsc);
  gOsc.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duration + 0.05);
}

/** Reproduz o efeito correspondente ao resultado de um disparo. */
export function playShotSound(result) {
  if (result === 'miss') playSplash();
  else if (result === 'sunk') playExplosion();
  else if (result === 'hit') playImpact();
}
