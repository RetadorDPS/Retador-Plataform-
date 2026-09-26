// ═════════════════════════════════════════════════════════════════════════════
// Generador de Video Promocional v8.7 — SALIDA (formatos, calidad, marca de agua, render final y exportación MP4/grabación)
// Copiado TAL CUAL del prototipo aprobado (retador-video-generador-v8.7.html).
// Los cambios de integración van marcados con [integración]; todo lo demás es
// idéntico línea a línea (se verifica con un script, ver README).
// ═════════════════════════════════════════════════════════════════════════════
import * as Mp4Muxer from "mp4-muxer";
import {
  BG_VEIL,
  CURRENCIES,
  EMOJI_CATS,
  EMOJI_FONT,
  FPS,
  H,
  LOGO_FRAMES,
  MS_PER_FRAME,
  QUICK_EMOJIS,
  REVIEW_POSITIONS,
  THEMES,
  THEME_ORDER,
  W,
  bgPhoto,
  bgPhotoBlurred,
  boxBlurRGBA,
  clamp,
  currency,
  discountPct,
  drawArrivalRing,
  drawBackground,
  drawChrome,
  drawEmoji,
  drawGrain,
  drawHeadline,
  drawLogo,
  drawPctSeal,
  drawPhotoCover,
  drawPriceBadge,
  drawProductCard,
  drawProgressBar,
  drawReviewBox,
  drawReviews,
  drawUrgencyBadge,
  dwell,
  easeOutBack,
  easeOutCubic,
  extractEmoji,
  fmtPrice,
  getGrain,
  grainPattern,
  hexToRgba,
  logoSfx,
  msToFrames,
  parsePrice,
  prepareBlurredBackground,
  roundRectPath,
  wrapFrame
} from "./motor.js";
import {
  MUSIC_DEFS,
  MUSIC_MOODS,
  SFX,
  VOICES,
  _irCache,
  _noiseCache,
  _softCurve,
  aacSupported,
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
} from "./audio.js";

// [integración] setProgress vivía en la interfaz; aquí se conecta con setProgressHandler.
let setProgress = () => {};
export function setProgressHandler(fn) { setProgress = typeof fn === "function" ? fn : () => {}; }

// ============================================================
// [v8.0] Formato de salida
// Los 6 estilos se diseñan en vertical 1080×1920. Para Feed (4:5) y
// Cuadrado (1:1) el fotograma vertical se centra completo sobre un fondo
// desenfocado del mismo video: no se recorta nada y funciona igual en
// todos los navegadores (el desenfoque sale de escalar una copia diminuta).
// ============================================================
const FORMATS = [
  { id: "vertical", label: "Vertical", sub: "Reel · 9:16", w: 1080, h: 1920, fb: "reel", cls: "",
    hint: "Ideal para Reels, Stories, TikTok y WhatsApp. En Facebook se publica como Reel." },
  { id: "feed", label: "Feed", sub: "4:5", w: 1080, h: 1350, fb: "feed", cls: "fmt-feed",
    hint: "Ocupa más pantalla en el muro. En Facebook se publica como video normal en tu página." },
  { id: "cuadrado", label: "Cuadrado", sub: "1:1", w: 1080, h: 1080, fb: "feed", cls: "fmt-square",
    hint: "Se ve bien en cualquier lugar, también en grupos y Marketplace. En Facebook se publica como video normal." }
];
let currentFormat = "vertical";
function fmt() { return FORMATS.find(f => f.id === currentFormat) || FORMATS[0]; }

const stageCanvas = document.createElement("canvas"); stageCanvas.width = W; stageCanvas.height = H;
const stageCtx = stageCanvas.getContext("2d");
// Muestra de color de los bordes del video (2 columnas × 12 alturas)
const edgeCanvas = document.createElement("canvas"); edgeCanvas.width = 2; edgeCanvas.height = 12;
const edgeCtx = edgeCanvas.getContext("2d", { willReadFrequently: true });

// [v8.0] Plan del vendedor. En la plataforma NO sale de este selector: se lee
// del plan real (can_customize). Gratis / sin sesión / desconocido → con marca.
// [integración] Lo fija la app con setPlan (getPlanPerks); por defecto, con marca.
let currentPlan = "gratis";
// [v8.7] Calidad de exportación. "Ligera" = 720p (×2/3) y menos bitrate:
// ≈3–4 MB en vez de ≈10–12 MB, para subir con datos móviles.
const QUALITIES = {
  alta: { label: "Alta", sub: "1080p · ≈10–12 MB", scale: 1, bitrate: 10000000, rec: 9000000 },
  ligera: { label: "Ligera", sub: "720p · ≈3–4 MB", scale: 2 / 3, bitrate: 3200000, rec: 3500000 }
};
let currentQuality = "alta";
function Q() { return QUALITIES[currentQuality] || QUALITIES.alta; }
function outDims() { return { w: Math.round(fmt().w * Q().scale), h: Math.round(fmt().h * Q().scale) }; }
function hasWatermark() { return currentPlan !== "pro"; }

// [v8.0] Marca de agua "Hecho con RETADOR": se dibuja DENTRO de cada fotograma
// sobre el lienzo final, así queda en la descarga, en Feed/Cuadrado y en lo que
// se publica en Facebook. Esquina inferior; si las reseñas están abajo a la
// derecha, se pasa a la izquierda para no taparlas.
// [integración] El símbolo "R" provisional se sustituyó por el logotipo oficial de
// RETADOR (public/icons/icon-192.png, mismo dominio: el canvas no queda contaminado).
let watermarkLogo = null;
export function setWatermarkLogo(img) { watermarkLogo = img || null; }
function drawWatermark(ctx, OW, OH, opts) {
  const s = OW / 1080;
  const text = "Hecho con RETADOR";
  ctx.save();
  ctx.font = "800 " + Math.round(26 * s) + "px Manrope, system-ui, sans-serif";
  const tw = ctx.measureText(text).width;
  const logo = 40 * s, padX = 14 * s, gap = 10 * s, h = 60 * s;
  const w = padX + logo + gap + tw + padX + 4 * s;
  const margin = 32 * s, bottom = OH - margin - 22 * s;
  const left = (opts.reviewPos === "br") ? margin : OW - margin - w;
  ctx.globalAlpha = 0.88;
  ctx.fillStyle = "rgba(15,13,10,0.55)";
  roundRectPath(ctx, left, bottom - h, w, h, h / 2); ctx.fill();
  ctx.globalAlpha = 1;
  // [integración] logotipo oficial en el mismo cuadrado que ocupaba la "R" provisional
  if (watermarkLogo) {
    ctx.save();
    roundRectPath(ctx, left + padX, bottom - h / 2 - logo / 2, logo, logo, 10 * s); ctx.clip();
    ctx.drawImage(watermarkLogo, left + padX, bottom - h / 2 - logo / 2, logo, logo);
    ctx.restore();
  }
  ctx.textBaseline = "middle";
  ctx.font = "800 " + Math.round(26 * s) + "px Manrope, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.fillText(text, left + padX + logo + gap, bottom - h / 2 + 1 * s);
  ctx.restore();
}

// Devuelve una función que dibuja el fotograma f en outCanvas con el formato actual.
// [v8.4] scale < 1 solo para las vistas previas (se dibujan a media resolución:
// 4 veces menos píxeles, más fluido en teléfonos). El archivo final SIEMPRE se
// genera a resolución completa (scale = 1), fotograma a fotograma.
const PREVIEW_SCALE = 0.5;
const _stages = {};
function getStage(sc) {
  const k = String(sc);
  if (!_stages[k]) {
    if (sc === 1) _stages[k] = { canvas: stageCanvas, ctx: stageCtx };
    else { const c = document.createElement("canvas"); c.width = Math.round(W * sc); c.height = Math.round(H * sc); _stages[k] = { canvas: c, ctx: c.getContext("2d") }; }
  }
  return _stages[k];
}
function makeRenderer(style, tl, opts, outCanvas, format, scale) {
  const F = format || fmt(), sc = scale || 1;
  const ow = Math.round(F.w * sc), oh = Math.round(F.h * sc);
  if (outCanvas.width !== ow || outCanvas.height !== oh) { outCanvas.width = ow; outCanvas.height = oh; }
  const out = outCanvas.getContext("2d");
  const wm = hasWatermark();
  const base = makeBaseRenderer(style, tl, opts, out, F, sc);
  return function (f) {
    out.setTransform(sc, 0, 0, sc, 0, 0);
    base(f);
    if (wm) drawWatermark(out, F.w, F.h, opts);
  };
}
function makeBaseRenderer(style, tl, opts, out, F, sc) {
  if (F.id === "vertical") return function (f) { style.renderFrame(out, f, tl, opts); };
  const stage = getStage(sc), stageC = stage.canvas, stageX = stage.ctx;
  const fit = Math.min(F.w / W, F.h / H), fw = Math.round(W * fit), fh = Math.round(H * fit);
  const fx = Math.round((F.w - fw) / 2), fy = Math.round((F.h - fh) / 2);
  let prev = null; // suavizado entre fotogramas para que el color no salte
  function sideGradient(colors, x0, x1) {
    const g = out.createLinearGradient(0, fy, 0, fy + fh);
    colors.forEach((c, i) => g.addColorStop(i / (colors.length - 1), "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")"));
    out.fillStyle = g; out.fillRect(x0, 0, x1 - x0, F.h);
  }
  return function (f) {
    stageX.setTransform(sc, 0, 0, sc, 0, 0);
    style.renderFrame(stageX, f, tl, opts);
    // Promedia una franja de 24 px de cada borde en 12 tramos de altura
    edgeCtx.imageSmoothingEnabled = true; edgeCtx.imageSmoothingQuality = "high";
    edgeCtx.drawImage(stageC, 0, 0, 24 * sc, stageC.height, 0, 0, 1, 12);
    edgeCtx.drawImage(stageC, stageC.width - 24 * sc, 0, 24 * sc, stageC.height, 1, 0, 1, 12);
    let left = [], right = [];
    try {
      const d = edgeCtx.getImageData(0, 0, 2, 12).data;
      for (let i = 0; i < 12; i++) {
        left.push([d[i * 8], d[i * 8 + 1], d[i * 8 + 2]]);
        right.push([d[i * 8 + 4], d[i * 8 + 5], d[i * 8 + 6]]);
      }
    } catch (e) {
      const bg = (opts.theme && opts.theme.bg) || "#161510";
      const n = parseInt(bg.slice(1), 16), c = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
      for (let i = 0; i < 12; i++) { left.push(c); right.push(c); }
    }
    if (prev) {
      const mix = (a, b) => a.map((c, i) => c.map((v, j) => Math.round(b[i][j] + (v - b[i][j]) * 0.35)));
      left = mix(left, prev.l); right = mix(right, prev.r);
    }
    prev = { l: left, r: right };
    sideGradient(left, 0, fx + 2);
    sideGradient(right, fx + fw - 2, F.w);
    if (fy > 0) { out.fillStyle = "rgb(" + left[0].join(",") + ")"; out.fillRect(0, 0, F.w, fy); out.fillStyle = "rgb(" + left[11].join(",") + ")"; out.fillRect(0, fy + fh, F.w, F.h - fy - fh); }
    out.save();
    out.imageSmoothingEnabled = true; out.imageSmoothingQuality = "high";
    out.shadowColor = "rgba(0,0,0,0.22)"; out.shadowBlur = 36;
    out.drawImage(stageC, fx, fy, fw, fh);
    out.restore();
  };
}

// 1080×1920 necesita un perfil H.264 nivel 4.x; el nivel 3.1 (42001f)
// solo llega a 1280×720 y fallaría. Se pregunta al navegador cuál soporta.
async function pickAvcCodec(w, h) {
  w = w || outDims().w; h = h || outDims().h;
  if (typeof window.VideoEncoder === "undefined" || typeof window.VideoFrame === "undefined" || typeof Mp4Muxer.Muxer === "undefined") return null; // [integración] mp4-muxer viene del paquete, no de un CDN
  const candidates = ["avc1.640028", "avc1.4d0028", "avc1.420028", "avc1.640032"];
  for (const codec of candidates) {
    try {
      const r = await VideoEncoder.isConfigSupported({ codec: codec, width: w, height: h, bitrate: Q().bitrate, framerate: FPS });
      if (r && r.supported) return codec;
    } catch (e) { /* probar el siguiente */ }
  }
  return null;
}

async function exportMp4(style, tl, opts, canvas, codec, withAudio) {
  const draw = makeRenderer(style, tl, opts, canvas, null, Q().scale);
  const OW = canvas.width, OH = canvas.height;
  // [v8.1] Música: se genera primero el audio completo y se mete como pista AAC.
  let audioBuf = null;
  if (withAudio) {
    setProgress(0, "Preparando la música…");
    audioBuf = await renderMusicBuffer(Math.ceil(tl.total / opts.speed) / FPS, style, tl, opts);
    if (!audioBuf) throw new Error("No se pudo generar la música.");
  }
  const muxCfg = { target: new Mp4Muxer.ArrayBufferTarget(), video: { codec: "avc", width: OW, height: OH }, fastStart: "in-memory", firstTimestampBehavior: "offset" };
  if (audioBuf) muxCfg.audio = { codec: "aac", numberOfChannels: 2, sampleRate: 48000 };
  const muxer = new Mp4Muxer.Muxer(muxCfg);
  if (audioBuf) await encodeAudioInto(muxer, audioBuf);
  let encErr = null;
  const encoder = new VideoEncoder({ output: (chunk, meta) => muxer.addVideoChunk(chunk, meta), error: e => { encErr = e; } });
  encoder.configure({ codec: codec, width: OW, height: OH, bitrate: Q().bitrate, framerate: FPS });
  // La velocidad cambia cuántos fotogramas de salida dura el video; cada
  // fotograma sigue calculándose de forma exacta, así que sigue fluido.
  const outTotal = Math.ceil(tl.total / opts.speed);
  for (let f = 0; f < outTotal; f++) {
    if (encErr) throw encErr;
    draw(Math.min(f * opts.speed, tl.total - 0.001));
    const vf = new VideoFrame(canvas, { timestamp: Math.round((f * 1e6) / FPS), duration: Math.round(1e6 / FPS) });
    encoder.encode(vf, { keyFrame: f % 60 === 0 });
    vf.close();
    while (encoder.encodeQueueSize > 6) await new Promise(r => setTimeout(r, 0));
    if (f % 4 === 0) { setProgress((f / outTotal) * 100, "Generando fotograma " + f + " de " + outTotal); await new Promise(r => setTimeout(r, 0)); }
  }
  await encoder.flush();
  if (encErr) throw encErr;
  muxer.finalize();
  setProgress(100, "Empaquetando video…");
  return new Blob([muxer.target.buffer], { type: "video/mp4" });
}

// Respaldo: grabación en tiempo real. [v8.1] Puede llevar la música (pista
// de audio en vivo) y acepta MP4 si el navegador solo graba MP4 (Safari).
function exportWebm(style, tl, opts, canvas, withAudio) {
  return new Promise(function (resolve, reject) {
    const draw = makeRenderer(style, tl, opts, canvas, null, Q().scale);
    let stream;
    try { stream = canvas.captureStream(60); } catch (e) { reject(new Error("Este navegador no soporta captura de canvas.")); return; }
    const cands = withAudio
      ? ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/mp4;codecs=avc1.42E01E,mp4a.40.2", "video/webm", "video/mp4"]
      : ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4"];
    const mime = cands.find(m => window.MediaRecorder && MediaRecorder.isTypeSupported(m));
    if (!mime) { reject(new Error("Este navegador no soporta grabación de video.")); return; }
    let actx = null, audioDest = null, master = null, mixChain = null;
    if (withAudio) {
      actx = getAudioCtx();
      if (actx) { audioDest = actx.createMediaStreamDestination(); audioDest.stream.getAudioTracks().forEach(t => stream.addTrack(t)); }
    }
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: Q().rec });
    const chunks = [];
    const ext = mime.indexOf("mp4") >= 0 ? "mp4" : "webm";
    rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
    rec.onstop = () => { try { master && master.disconnect(); mixChain && mixChain.out.disconnect(); } catch (e) {} resolve({ blob: new Blob(chunks, { type: mime.split(";")[0] }), ext: ext, audio: !!audioDest }); };
    rec.onerror = e => reject(e.error || new Error("Error grabando el video."));
    const totalMs = Math.ceil(tl.total / opts.speed) * MS_PER_FRAME, t0 = performance.now();
    rec.start();
    if (audioDest) { mixChain = makeMixChain(actx, audioDest); master = scheduleAudio(actx, mixChain, actx.currentTime + 0.02, totalMs / 1000, style, tl, opts); }
    (function tick() {
      const el = performance.now() - t0;
      setProgress((el / totalMs) * 100, "Grabando en tiempo real…");
      if (el >= totalMs) { draw(tl.total - 1); rec.stop(); return; }
      draw(Math.min(Math.floor(el / MS_PER_FRAME) * opts.speed, tl.total - 0.001));
      requestAnimationFrame(tick);
    })();
  });
}

// [v8.1] Punto único de exportación (descarga y Facebook usan esto).
// Devuelve { blob, ext, audio, note }.
async function exportVideo(style, tl, opts, canvas) {
  const wantMusic = audioWanted(style);
  const noMusicNote = "Tu navegador no pudo añadir el sonido; el video salió mudo.";
  const codec = await pickAvcCodec();
  if (codec) {
    if (!wantMusic) return { blob: await exportMp4(style, tl, opts, canvas, codec, false), ext: "mp4", audio: false };
    if (await aacSupported()) {
      try { return { blob: await exportMp4(style, tl, opts, canvas, codec, true), ext: "mp4", audio: true }; }
      catch (e) { /* se reintenta abajo */ }
    }
    const recMime = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/mp4;codecs=avc1.42E01E,mp4a.40.2"]
      .find(m => window.MediaRecorder && MediaRecorder.isTypeSupported(m));
    if (recMime && getAudioCtx()) {
      try { return await exportWebm(style, tl, opts, canvas, true); } catch (e) { /* último recurso: sin música */ }
    }
    return { blob: await exportMp4(style, tl, opts, canvas, codec, false), ext: "mp4", audio: false, note: noMusicNote };
  }
  const r = await exportWebm(style, tl, opts, canvas, wantMusic);
  if (wantMusic && !r.audio) r.note = noMusicNote;
  return r;
}
// [integración] Formato, calidad y plan los elige la interfaz (otro módulo).
export function setFormat(id) { currentFormat = id; }
export function setQuality(id) { currentQuality = id; }
export function setPlan(p) { currentPlan = p; }

export {
  FORMATS,
  PREVIEW_SCALE,
  Q,
  QUALITIES,
  _stages,
  currentFormat,
  currentPlan,
  currentQuality,
  drawWatermark,
  edgeCanvas,
  edgeCtx,
  exportMp4,
  exportVideo,
  exportWebm,
  fmt,
  getStage,
  hasWatermark,
  makeBaseRenderer,
  makeRenderer,
  outDims,
  pickAvcCodec,
  stageCanvas,
  stageCtx
};
