// ═════════════════════════════════════════════════════════════════════════════
// Generador de Video Promocional v8.7 — AUDIO (música y efectos creados por código, mezcla)
// Copiado TAL CUAL del prototipo aprobado (retador-video-generador-v8.7.html).
// Los cambios de integración van marcados con [integración]; todo lo demás es
// idéntico línea a línea (se verifica con un script, ver README).
// ═════════════════════════════════════════════════════════════════════════════

// ============================================================
// [v8.1] MÚSICA CREADA POR CÓDIGO (sin archivos de audio, sin IA)
// Un pequeño sintetizador con la Web Audio API "toca" batería, bajo,
// acordes y arpegios a partir de patrones fijos. Mismo resultado siempre,
// costo cero y sin derechos de terceros (la música es de RETADOR).
// La misma función sirve para la vista previa (tiempo real) y para el
// archivo final (OfflineAudioContext → AAC dentro del MP4).
// ============================================================
const MUSIC_MOODS = [
  { id: "none", label: "Sin música", icon: "🔇", desc: "El video sale mudo." },
  { id: "alegre", label: "Alegre", icon: "😄", desc: "Pop animado, ideal para vender." },
  { id: "elegante", label: "Elegante", icon: "✨", desc: "Piano suave, para productos cuidados." },
  { id: "energia", label: "Energía", icon: "⚡", desc: "Ritmo bailable, para ofertas." },
  { id: "relajado", label: "Relajado", icon: "🌙", desc: "Lo-fi tranquilo, para ambiente." },
  { id: "moderno", label: "Moderno", icon: "🎛️", desc: "Electrónica actual tipo anuncio tech." }
];
// Patrones: 16 pasos por compás, progresión de 4 acordes (uno por compás).
const MUSIC_DEFS = {
  alegre: { bpm: 116, swing: 0, reverb: 0.16,
    chords: [[60, 64, 67], [59, 62, 67], [57, 60, 64], [57, 60, 65]], roots: [48, 43, 45, 41],
    kick: [0, 7, 8], clap: [4, 12], hat: [2, 6, 10, 14], hatV: 0.14,
    bass: { steps: [0, 3, 6, 8, 11, 14], len: 1.6, preset: "bassTri", v: 0.30 },
    pad: { steps: [0], len: 15, preset: "pad", v: 0.045 },
    arp: { steps: [0, 2, 4, 6, 8, 10, 12, 14], order: [0, 1, 2, 1, 0, 1, 2, 1], oct: 12, len: 1.5, preset: "pluck", v: 0.10 } },
  elegante: { bpm: 84, swing: 0.12, reverb: 0.32,
    chords: [[60, 64, 67, 71], [57, 60, 64, 67], [57, 62, 65, 69], [55, 59, 62, 65]], roots: [48, 45, 50, 43],
    kick: [0, 9], rim: [8], shaker: [2, 6, 10, 14], shakerV: 0.05,
    bass: { steps: [0, 8], len: 7, preset: "bassSine", v: 0.32 },
    hits: { steps: [0, 10], lens: [9, 5], preset: "rhodes", v: 0.08 },
    arp: { steps: [4, 12], order: [2, 3], oct: 12, len: 3, preset: "bell", v: 0.055 } },
  energia: { bpm: 124, swing: 0, reverb: 0.12,
    chords: [[57, 60, 64], [57, 60, 65], [60, 64, 67], [59, 62, 67]], roots: [45, 41, 48, 43],
    kick: [0, 4, 8, 12], clap: [4, 12], openHat: [2, 6, 10, 14], hat: [1, 3, 5, 7, 9, 11, 13, 15], hatV: 0.06,
    bass: { steps: [2, 6, 10, 14], len: 1.4, preset: "bassSaw", v: 0.26 },
    hits: { steps: [0, 3, 6], lens: [1.2, 1.2, 1.2], preset: "stab", v: 0.055 } },
  // [v8.2] Moderno: 140 bpm a medio tiempo, charles en semicorcheas, bajo largo, arpegio pulsado
  moderno: { bpm: 140, swing: 0, reverb: 0.18,
    chords: [[65, 68, 72], [61, 65, 68], [63, 67, 70], [60, 63, 67]], roots: [53, 49, 51, 48],
    kick: [0, 10], clap: [8], hat: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], hatV: 0.045, openHat: [14],
    bass: { steps: [0, 10], len: 6, preset: "bassSine", v: 0.34 },
    pad: { steps: [0], len: 15, preset: "pad", v: 0.03 },
    arp: { steps: [0, 3, 6, 8, 11, 14], order: [0, 2, 1, 2, 0, 1], oct: 12, len: 1.4, preset: "pluck", v: 0.085 } },
  relajado: { bpm: 76, swing: 0.22, reverb: 0.30,
    chords: [[65, 69, 72, 76], [64, 67, 71, 74], [62, 65, 69, 72], [60, 64, 67, 71]], roots: [53, 52, 50, 48],
    kick: [0, 10], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14], hatV: 0.06,
    bass: { steps: [0, 10], len: 5, preset: "bassSine", v: 0.30 },
    hits: { steps: [0], lens: [15], preset: "rhodes", v: 0.07 },
    arp: { steps: [6, 14], order: [3, 2], oct: 0, len: 3, preset: "bell", v: 0.04 } }
};
const VOICES = {
  bassTri: { layers: [{ type: "triangle", mult: 1 }, { type: "sine", mult: 2, lv: 0.25 }], cutoff: 900, attack: 0.008, sustain: 0.6, release: 0.08 },
  bassSine: { layers: [{ type: "sine", mult: 1 }, { type: "triangle", mult: 2, lv: 0.3 }], cutoff: 700, attack: 0.01, sustain: 0.8, release: 0.15 },
  bassSaw: { layers: [{ type: "sawtooth", mult: 1 }], cutoff: 1100, cutEnd: 350, q: 2, attack: 0.005, sustain: 0.5, release: 0.06 },
  pad: { layers: [{ type: "sawtooth", mult: 1, det: -8 }, { type: "sawtooth", mult: 1, det: 8, lv: 0.8 }], cutoff: 1100, attack: 0.25, sustain: 0.7, release: 0.6 },
  pluck: { layers: [{ type: "square", mult: 1, lv: 0.5 }, { type: "triangle", mult: 1 }], cutoff: 3200, cutEnd: 700, attack: 0.003, sustain: 0.05, release: 0.12 },
  rhodes: { layers: [{ type: "sine", mult: 1 }, { type: "triangle", mult: 2, lv: 0.22 }, { type: "sine", mult: 3, lv: 0.08 }], cutoff: 2600, attack: 0.006, sustain: 0.35, release: 0.5 },
  bell: { layers: [{ type: "sine", mult: 1 }, { type: "sine", mult: 2.01, lv: 0.3 }], cutoff: 5000, attack: 0.003, sustain: 0.02, release: 0.9 },
  stab: { layers: [{ type: "sawtooth", mult: 1, det: -6 }, { type: "sawtooth", mult: 1, det: 6, lv: 0.9 }], cutoff: 2400, cutEnd: 900, attack: 0.004, sustain: 0.2, release: 0.1 }
};
// [v8.4] Efectos en dos grupos: transiciones (cambios de escena, cierre) y
// por producto (un sonido cada vez que aparece un producto). Este último
// viene APAGADO por defecto: con muchos productos puede resultar molesto.
const music = { mood: "alegre", volume: 0.7, sfxScene: true, sfxItem: false };
const midiHz = m => 440 * Math.pow(2, (m - 69) / 12);

const _noiseCache = new WeakMap(), _irCache = new WeakMap();
function seededRand(seed) { return function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
function noiseBuf(ctx) {
  if (_noiseCache.has(ctx)) return _noiseCache.get(ctx);
  const b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), d = b.getChannelData(0), r = seededRand(7);
  for (let i = 0; i < d.length; i++) d[i] = r() * 2 - 1;
  _noiseCache.set(ctx, b); return b;
}
function impulse(ctx) {
  if (_irCache.has(ctx)) return _irCache.get(ctx);
  const len = Math.floor(ctx.sampleRate * 1.6), b = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) { const d = b.getChannelData(c), r = seededRand(11 + c); for (let i = 0; i < len; i++) d[i] = (r() * 2 - 1) * Math.pow(1 - i / len, 3); }
  _irCache.set(ctx, b); return b;
}
function vKick(ctx, out, t, v) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = "sine"; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.12);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
  o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.4);
}
function vNoise(ctx, out, t, v, type, freq, q, decay) {
  const src = ctx.createBufferSource(); src.buffer = noiseBuf(ctx);
  const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.0015); g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  src.connect(f); f.connect(g); g.connect(out);
  src.start(t, (t * 7.3) % 0.5); src.stop(t + decay + 0.02);
}
function vTone(ctx, out, t, midi, dur, v, P) {
  const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.Q.value = P.q || 0.7;
  f.frequency.setValueAtTime(P.cutoff, t);
  if (P.cutEnd) f.frequency.exponentialRampToValueAtTime(P.cutEnd, t + Math.max(0.05, dur));
  const g = ctx.createGain(), a = P.attack, r = P.release;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(v, t + a);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0001, v * P.sustain), t + Math.max(a + 0.01, dur));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur + r);
  f.connect(g); g.connect(out);
  P.layers.forEach(function (L) {
    const o = ctx.createOscillator(); o.type = L.type; o.frequency.value = midiHz(midi) * L.mult;
    if (L.det) o.detune.value = L.det;
    if (L.lv != null && L.lv !== 1) { const lg = ctx.createGain(); lg.gain.value = L.lv; o.connect(lg); lg.connect(f); } else o.connect(f);
    o.start(t); o.stop(t + dur + r + 0.03);
  });
}
// Programa la música de un ánimo entre t0 y t0+dur en el contexto dado.
// Devuelve el nodo maestro (para poder silenciarlo en la vista previa).
// [v8.3] Cadena de mezcla ÚNICA por sesión de audio (antes: un compresor y una
// reverberación por cada vuelta, que sumados saturaban y en móviles podían
// provocar cortes). Todo entra aquí: margen de volumen → compresor suave →
// recorte suave (nunca recorta en seco) → salida.
let _softCurve = null;
function softClipCurve() {
  if (_softCurve) return _softCurve;
  const n = 4096, c = new Float32Array(n), knee = 0.72;
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1, a = Math.abs(x);
    const y = a <= knee ? a : knee + (1 - knee) * Math.tanh((a - knee) / (1 - knee));
    c[i] = Math.sign(x) * y * 0.97;
  }
  _softCurve = c; return c;
}
function makeMixChain(ctx, dest) {
  const input = ctx.createGain(); input.gain.value = 0.55;
  const revIn = ctx.createGain();
  const rev = ctx.createConvolver(); rev.buffer = impulse(ctx);
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18; comp.knee.value = 12; comp.ratio.value = 3; comp.attack.value = 0.004; comp.release.value = 0.25;
  const shaper = ctx.createWaveShaper(); shaper.curve = softClipCurve(); shaper.oversample = "4x";
  const out = ctx.createGain(); out.gain.value = 0.8;
  input.connect(comp); revIn.connect(rev); rev.connect(comp);
  comp.connect(shaper); shaper.connect(out); out.connect(dest);
  return { input: input, revIn: revIn, out: out };
}
// Deja el pico del audio final en −1 dB: mismo volumen siempre y sin recortes.
function normalizeBuffer(buf, target) {
  let peak = 0;
  for (let c = 0; c < buf.numberOfChannels; c++) { const d = buf.getChannelData(c); for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > peak) peak = a; } }
  if (peak < 1e-4) return buf;
  const g = Math.min(3, (target || 0.89) / peak);
  for (let c = 0; c < buf.numberOfChannels; c++) { const d = buf.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] *= g; }
  return buf;
}

function scheduleMusic(ctx, dest, t0, dur, moodId, vol, revIn) {
  const M = MUSIC_DEFS[moodId];
  if (!M || dur <= 0.2) return null;
  const master = ctx.createGain();
  master.connect(dest);
  const level = Math.max(0.0002, 0.9 * vol), fade = Math.min(1.2, dur * 0.2);
  master.gain.setValueAtTime(0.0001, t0);
  master.gain.exponentialRampToValueAtTime(level, t0 + 0.04);
  master.gain.setValueAtTime(level, t0 + dur - fade);
  master.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  const drums = ctx.createGain(); drums.connect(master);
  const bus = ctx.createGain(); bus.connect(master);
  if (revIn) { const send = ctx.createGain(); send.gain.value = M.reverb; bus.connect(send); send.connect(revIn); }
  const step = 60 / M.bpm / 4, total = Math.ceil(dur / step), end = t0 + dur;
  const has = (arr, s) => arr && arr.indexOf(s) >= 0;
  for (let i = 0; i < total; i++) {
    const s = i % 16, ci = Math.floor(i / 16) % 4, chord = M.chords[ci];
    let t = t0 + i * step;
    if (M.swing && s % 4 === 2) t += M.swing * step;
    if (t >= end - 0.02) break;
    if (has(M.kick, s)) vKick(ctx, drums, t, 0.9);
    if (has(M.clap, s)) vNoise(ctx, drums, t, 0.42, "bandpass", 1500, 0.9, 0.16);
    if (has(M.snare, s)) vNoise(ctx, drums, t, 0.30, "bandpass", 1800, 0.8, 0.20);
    if (has(M.rim, s)) vNoise(ctx, drums, t, 0.20, "bandpass", 3200, 2.5, 0.05);
    if (has(M.hat, s)) vNoise(ctx, drums, t, M.hatV || 0.1, "highpass", 7500, 0.7, 0.045);
    if (has(M.openHat, s)) vNoise(ctx, drums, t, 0.10, "highpass", 7000, 0.7, 0.22);
    if (has(M.shaker, s)) vNoise(ctx, drums, t, M.shakerV || 0.05, "bandpass", 5000, 1.2, 0.035);
    if (M.bass && has(M.bass.steps, s)) vTone(ctx, bus, t, M.roots[ci], M.bass.len * step, M.bass.v, VOICES[M.bass.preset]);
    if (M.pad && has(M.pad.steps, s)) chord.forEach(n => vTone(ctx, bus, t, n, M.pad.len * step, M.pad.v, VOICES[M.pad.preset]));
    if (M.hits) { const k = M.hits.steps.indexOf(s); if (k >= 0) chord.forEach(n => vTone(ctx, bus, t, n, M.hits.lens[k] * step, M.hits.v, VOICES[M.hits.preset])); }
    if (M.arp) { const k = M.arp.steps.indexOf(s); if (k >= 0) { const n = chord[M.arp.order[k % M.arp.order.length] % chord.length] + M.arp.oct; vTone(ctx, bus, t, n, M.arp.len * step, M.arp.v, VOICES[M.arp.preset]); } }
  }
  return master;
}

// ---------- Audio en tiempo real (vista previa y respaldo de grabación) ----------
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { audioCtx = new AC({ latencyHint: "playback" }); } catch (e) { audioCtx = new AC(); }
  }
  return audioCtx;
}
// Llamar dentro de un toque del usuario: los navegadores móviles solo dejan
// sonar audio si se activó con un gesto.
function unlockAudio() { const c = getAudioCtx(); if (c && c.state === "suspended") c.resume(); }

// ---------- Música para el archivo final ----------
async function renderMusicBuffer(durSec, style, tl, opts) {
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!OAC || !audioWanted(style)) return null;
  const sr = 48000, off = new OAC(2, Math.ceil(durSec * sr), sr);
  scheduleAudio(off, makeMixChain(off, off.destination), 0, durSec, style, tl, opts);
  return normalizeBuffer(await off.startRendering(), 0.89);
}
async function aacSupported() {
  if (typeof window.AudioEncoder === "undefined" || typeof window.AudioData === "undefined") return false;
  try { const r = await AudioEncoder.isConfigSupported({ codec: "mp4a.40.2", sampleRate: 48000, numberOfChannels: 2, bitrate: 128000 }); return !!(r && r.supported); }
  catch (e) { return false; }
}
// [v8.8] Opus dentro del MP4: segunda opción cuando el navegador no codifica AAC.
async function opusSupported() {
  if (typeof window.AudioEncoder === "undefined" || typeof window.AudioData === "undefined") return false;
  try { const r = await AudioEncoder.isConfigSupported({ codec: "opus", sampleRate: 48000, numberOfChannels: 2, bitrate: 128000 }); return !!(r && r.supported); }
  catch (e) { return false; }
}
// codec: "aac" (por defecto) u "opus"
async function encodeAudioInto(muxer, buf, codec) {
  let err = null;
  const enc = new AudioEncoder({ output: (c, m) => muxer.addAudioChunk(c, m), error: e => { err = e; } });
  enc.configure({ codec: codec === "opus" ? "opus" : "mp4a.40.2", sampleRate: 48000, numberOfChannels: 2, bitrate: 128000 });
  const L = buf.getChannelData(0), R = buf.getChannelData(1), N = buf.length, CH = 1024;
  for (let i = 0; i < N; i += CH) {
    if (err) throw err;
    const n = Math.min(CH, N - i), data = new Float32Array(n * 2);
    data.set(L.subarray(i, i + n), 0); data.set(R.subarray(i, i + n), n);
    const ad = new AudioData({ format: "f32-planar", sampleRate: 48000, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round((i / 48000) * 1e6), data: data });
    enc.encode(ad); ad.close();
    if (enc.encodeQueueSize > 20) await new Promise(r => setTimeout(r, 0));
  }
  await enc.flush();
  if (err) throw err;
  enc.close();
}
// ============================================================
// [v8.2] EFECTOS DE SONIDO creados por código, sincronizados con los
// momentos de cada estilo que los define (style.sfxEvents → [{t, type}],
// t en segundos a velocidad 1×). Tipos: whoosh, pop, riser, impact, chime.
// ============================================================
function sfxWhoosh(ctx, out, t, v) {
  const src = ctx.createBufferSource(); src.buffer = noiseBuf(ctx);
  const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.Q.value = 1.1;
  f.frequency.setValueAtTime(350, t); f.frequency.exponentialRampToValueAtTime(3200, t + 0.28); f.frequency.exponentialRampToValueAtTime(900, t + 0.5);
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.22); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.52);
  src.connect(f); f.connect(g); g.connect(out); src.start(t, 0.1); src.stop(t + 0.55);
}
function sfxPop(ctx, out, t, v) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = "sine"; o.frequency.setValueAtTime(520, t); o.frequency.exponentialRampToValueAtTime(980, t + 0.06);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.14);
}
function sfxRiser(ctx, out, t, v) {
  const src = ctx.createBufferSource(); src.buffer = noiseBuf(ctx);
  const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.Q.value = 2;
  f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(6000, t + 0.75);
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.72); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.82);
  src.connect(f); f.connect(g); g.connect(out); src.start(t, 0.2); src.stop(t + 0.85);
}
function sfxImpact(ctx, out, t, v) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = "sine"; o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.35);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
  o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.62);
  vNoise(ctx, out, t, v * 0.25, "lowpass", 1200, 0.7, 0.18);
}
function sfxChime(ctx, out, t, v) {
  [84, 88, 91, 96].forEach((n, i) => vTone(ctx, out, t + i * 0.055, n, 0.25, v * (1 - i * 0.12), VOICES.bell));
}
const SFX = { whoosh: [sfxWhoosh, 0.22], pop: [sfxPop, 0.16], riser: [sfxRiser, 0.18], impact: [sfxImpact, 0.5], chime: [sfxChime, 0.14] };
function scheduleSfx(ctx, dest, t0, dur, events, speed) {
  const g = ctx.createGain(); g.gain.value = 0.9; g.connect(dest);
  events.forEach(function (e) {
    if (e.cat === "item" ? !music.sfxItem : !music.sfxScene) return;
    const t = t0 + e.t / speed;
    if (t < t0 || t > t0 + dur - 0.05 || !SFX[e.type]) return;
    SFX[e.type][0](ctx, g, t, SFX[e.type][1]);
  });
  return g;
}
// Música + efectos en un solo grupo (lo que se programa en cada vuelta).
function sfxOn() { return music.sfxScene || music.sfxItem; }
function audioWanted(style) {
  return music.mood !== "none" || (sfxOn() && !!(style && style.sfxEvents));
}
// chain = makeMixChain(...) (una por sesión). Devuelve el grupo de esta vuelta.
function scheduleAudio(ctx, chain, t0, dur, style, tl, opts) {
  const group = ctx.createGain(); group.connect(chain.input);
  if (music.mood !== "none") scheduleMusic(ctx, group, t0, dur, music.mood, music.volume, chain.revIn);
  if (sfxOn() && style && style.sfxEvents) scheduleSfx(ctx, group, t0, dur, style.sfxEvents(tl, opts), (opts && opts.speed) || 1);
  return group;
}

function moodLabel() { const m = MUSIC_MOODS.find(x => x.id === music.mood); return m ? m.label : ""; }

export {
  MUSIC_DEFS,
  MUSIC_MOODS,
  SFX,
  VOICES,
  _irCache,
  _noiseCache,
  _softCurve,
  aacSupported,
  opusSupported,
  audioCtx,
  audioWanted,
  encodeAudioInto,
  getAudioCtx,
  impulse,
  makeMixChain,
  midiHz,
  moodLabel,
  music,
  noiseBuf,
  normalizeBuffer,
  renderMusicBuffer,
  scheduleAudio,
  scheduleMusic,
  scheduleSfx,
  seededRand,
  sfxChime,
  sfxImpact,
  sfxOn,
  sfxPop,
  sfxRiser,
  sfxWhoosh,
  softClipCurve,
  unlockAudio,
  vKick,
  vNoise,
  vTone
};
