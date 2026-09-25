// ═════════════════════════════════════════════════════════════════════════════
// Generador de Video Promocional — MOTOR (dibujo + exportación)
// ─────────────────────────────────────────────────────────────────────────────
// Copiado TAL CUAL del prototipo aprobado (promo-video-generator.html): temas,
// emojis, tarjetas, precios, reseñas, urgencia, barra de progreso, los 5
// estilos, velocidad y exportación MP4/WebM. Las curvas y los tiempos NO se
// tocan. Únicos cambios de adaptación a módulo (ver README de la herramienta):
//   · mp4-muxer se importa del paquete (antes venía de un CDN como global).
//   · setProgress, la moneda y la foto de fondo eran variables del prototipo:
//     aquí se asignan desde la interfaz con setProgressHandler/setCurrency/
//     setBackgroundPhoto.
//   · Añadido NUEVO (no modifica nada existente): drawWatermark/withWatermark.
// Todo se calcula por número de fotograma, nunca por reloj real.
// ═════════════════════════════════════════════════════════════════════════════
import * as Mp4Muxer from "mp4-muxer";

// La interfaz decide qué hacer con el avance de la exportación.
let setProgress = () => {};
export function setProgressHandler(fn) { setProgress = typeof fn === "function" ? fn : () => {}; }

const FPS = 60, MS_PER_FRAME = 1000 / FPS, W = 1080, H = 1920;
const msToFrames = ms => Math.round((ms / 1000) * FPS);
const wrapFrame = (f, total) => ((f % total) + total) % total;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
const easeOutBack = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
// Curva de avance: rápido al entrar, lento en el centro, rápido al salir.
// Derivada 1 + a·cos(2πt) > 0 siempre, así que nunca retrocede ni da tirones.
const dwell = (t, a) => t + (a * Math.sin(2 * Math.PI * t)) / (2 * Math.PI);

const LOGO_FRAMES = msToFrames(4200);

// ============================================================
// Temas: fondo, texto, tarjeta y sombra
// ============================================================
const THEMES = {
  crema:  { id: "crema",  label: "Crema (marca)",  bg: "#F7F3EA", text: "#161510", cardBg: "#FFFFFF", cardShadow: "rgba(22,21,16,0.22)", cardBorder: "rgba(22,21,16,0.07)", glow: 0.10, defaultAccent: "#F26B0F" },
  oscuro: { id: "oscuro", label: "Oscuro premium", bg: "#161510", text: "#F7F3EA", cardBg: "#26221B", cardShadow: "rgba(0,0,0,0.6)",     cardBorder: "rgba(255,255,255,0.08)", glow: 0.18, defaultAccent: "#F26B0F" },
  foto:   { id: "foto",   label: "Foto propia",    bg: "#161510", text: "#F7F3EA", cardBg: "#26221B", cardShadow: "rgba(0,0,0,0.6)",     cardBorder: "rgba(255,255,255,0.10)", glow: 0.14, defaultAccent: "#F26B0F", usesPhoto: true }
};
const THEME_ORDER = ["crema", "oscuro", "foto"];

// Fondo con foto: se desenfoca UNA sola vez al subirla (reducir y volver a
// ampliar = desenfoque que funciona en todos los navegadores, incluido
// Safari) y luego cada fotograma solo pinta la imagen ya lista + un velo
// oscuro fijo, para que productos y texto siempre se lean.
let bgPhoto = null, bgPhotoBlurred = null;
const BG_VEIL = 0.55;
function prepareBlurredBackground(img) {
  const small = document.createElement("canvas");
  small.width = 90; small.height = 160;
  const sctx = small.getContext("2d");
  const ir = img.naturalWidth / img.naturalHeight, br = 90 / 160;
  let dw, dh;
  if (ir > br) { dh = 160; dw = 160 * ir; } else { dw = 90; dh = 90 / ir; }
  sctx.drawImage(img, (90 - dw) / 2, (160 - dh) / 2, dw, dh);
  const big = document.createElement("canvas");
  big.width = W; big.height = H;
  const bctx = big.getContext("2d");
  bctx.imageSmoothingEnabled = true;
  bctx.imageSmoothingQuality = "high";
  bctx.drawImage(small, 0, 0, W, H);
  return big;
}

// ============================================================
// Emojis — usan la fuente de emoji del propio dispositivo
// ============================================================
const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Twemoji Mozilla",sans-serif';
const QUICK_EMOJIS = ["🏪", "🛍️", "📦", "🚚", "💳", "💬", "❤️", "⭐"];
const EMOJI_CATS = [
  { id: "tienda", label: "Tienda", list: ["🏪","🛍️","🛒","📦","🏷️","💳","💵","🧾","🎁","🚚","✈️","📱","🏬","💰","🪙","📮"] },
  { id: "moda", label: "Moda", list: ["👗","👕","👖","👟","👠","👜","🕶️","⌚","💍","💄","🧢","🎒","👙","🧥","👔","🩴"] },
  { id: "hogar", label: "Hogar y tech", list: ["📺","💻","🎧","📷","🔌","🔋","🛋️","🛏️","🍳","🧺","💡","🧴","🖥️","🎮","🧹","🪴"] },
  { id: "comida", label: "Comida", list: ["🍔","🍕","🍰","🍩","☕","🥤","🍗","🥑","🍎","🧁","🍫","🍺","🍦","🥩","🍞","🧃"] },
  { id: "emocion", label: "Emoción", list: ["❤️","🔥","⭐","✨","🎉","💯","👍","😍","🤩","👏","💥","✅","🥳","😎","🙌","💪"] },
  { id: "info", label: "Avisos", list: ["💬","📞","📍","⏰","🔔","🆕","🆓","⚡","🎯","📣","🔝","💎","🏆","📢","🕐","🚀"] }
];

function extractEmoji(str) {
  const s = (str || "").trim();
  if (!s) return null;
  let first;
  if (window.Intl && Intl.Segmenter) {
    const it = new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(s)[Symbol.iterator]().next();
    first = it.value && it.value.segment;
  } else {
    first = Array.from(s)[0];
  }
  try { if (!/\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(first)) return null; } catch (e) { /* navegador sin \p: se acepta */ }
  return first;
}

// ============================================================
// Dibujo base
// ============================================================
function roundRectPath(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawEmoji(ctx, emoji, x, y, size) {
  ctx.save();
  ctx.font = Math.round(size) + "px " + EMOJI_FONT;
  ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#000";
  ctx.fillText(emoji, x, y + size * 0.05);
  ctx.restore();
}

function drawPhotoCover(ctx, img, x, y, w, h, r) {
  ctx.save();
  roundRectPath(ctx, x, y, w, h, r);
  ctx.clip();
  const ir = img.naturalWidth / img.naturalHeight, br = w / h;
  let dw, dh;
  if (ir > br) { dh = h; dw = h * ir; } else { dw = w; dh = w / ir; }
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.restore();
}

// Etiqueta de precio: precio anterior tachado (opcional) + precio actual
// destacado. Se dibuja SIN rotar (independiente del ángulo de la tarjeta)
// para que el número siempre se lea derecho, anclada a su esquina superior
// derecha en espacio de pantalla.
// ---------- Moneda y porcentaje ----------
// currency es global (una sola moneda por video). Si el vendedor escribe
// solo el número, se le añade el símbolo; si ya escribió un símbolo, se
// respeta tal cual.
let currency = "$";
const CURRENCIES = [
  { id: "$", label: "$ (dólar)", before: true },
  { id: "US$", label: "US$", before: true },
  { id: "€", label: "€ (euro)", before: true },
  { id: "CUP", label: "CUP", before: false },
  { id: "MLC", label: "MLC", before: false }
];
function parsePrice(v) {
  const s = String(v || "").replace(/[^0-9.,]/g, "").replace(",", ".");
  const n = parseFloat(s);
  return isFinite(n) ? n : null;
}
function fmtPrice(v) {
  const raw = String(v || "").trim();
  if (!raw) return "";
  if (!/^[0-9]+([.,][0-9]+)?$/.test(raw)) return raw; // ya trae símbolo o texto propio
  const c = CURRENCIES.find(x => x.id === currency) || CURRENCIES[0];
  return c.before ? c.id + raw : raw + " " + c.id;
}
function discountPct(item) {
  const b = parsePrice(item.priceBefore), n = parsePrice(item.priceNow);
  if (b === null || n === null || b <= 0 || n >= b) return null;
  return Math.round(((b - n) / b) * 100);
}

function drawPriceBadge(ctx, item, cx, cy, size, alpha, accent) {
  if (!item.priceNow) return;
  item = Object.assign({}, item, { priceBefore: fmtPrice(item.priceBefore), priceNow: fmtPrice(item.priceNow), _pct: item.showPct ? discountPct(item) : null });
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx + size * 0.36, cy - size * 0.42);
  const nowFont = Math.round(size * 0.15), beforeFont = Math.round(size * 0.095);
  ctx.font = "800 " + nowFont + "px Manrope, system-ui, sans-serif";
  const nowW = ctx.measureText(item.priceNow).width;
  ctx.font = "700 " + beforeFont + "px Manrope, system-ui, sans-serif";
  const beforeW = item.priceBefore ? ctx.measureText(item.priceBefore).width : 0;
  const padX = size * 0.055, padY = size * 0.045;
  const boxW = Math.max(nowW, beforeW) + padX * 2;
  const boxH = (item.priceBefore ? nowFont + beforeFont * 0.9 : nowFont) + padY * 2.4;
  ctx.shadowColor = "rgba(0,0,0,0.28)"; ctx.shadowBlur = size * 0.04; ctx.shadowOffsetY = size * 0.012;
  roundRectPath(ctx, -boxW / 2, -boxH / 2, boxW, boxH, boxH * 0.24);
  ctx.fillStyle = accent; ctx.fill();
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.textAlign = "center";
  if (item.priceBefore) {
    ctx.font = "700 " + beforeFont + "px Manrope, system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.78)";
    const by = -boxH / 2 + padY + beforeFont * 0.62;
    ctx.textBaseline = "middle";
    ctx.fillText(item.priceBefore, 0, by);
    const bw = ctx.measureText(item.priceBefore).width;
    ctx.strokeStyle = "rgba(255,255,255,0.85)"; ctx.lineWidth = Math.max(1.5, size * 0.006);
    ctx.beginPath(); ctx.moveTo(-bw / 2 - 2, by); ctx.lineTo(bw / 2 + 2, by); ctx.stroke();
    ctx.font = "800 " + nowFont + "px Manrope, system-ui, sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(item.priceNow, 0, by + beforeFont * 0.6 + nowFont * 0.62);
  } else {
    ctx.font = "800 " + nowFont + "px Manrope, system-ui, sans-serif";
    ctx.fillStyle = "#FFFFFF"; ctx.textBaseline = "middle";
    ctx.fillText(item.priceNow, 0, 0);
  }
  ctx.restore();
  if (item._pct) drawPctSeal(ctx, item._pct, cx - size * 0.38, cy - size * 0.40, size, alpha);
}

// Sello redondo "-75%" en la esquina opuesta a la etiqueta de precio.
function drawPctSeal(ctx, pct, x, y, size, alpha) {
  const r = size * 0.13;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(-0.18);
  ctx.shadowColor = "rgba(0,0,0,0.3)"; ctx.shadowBlur = size * 0.04; ctx.shadowOffsetY = size * 0.012;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = "#D7263D"; ctx.fill();
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.fillStyle = "#FFFFFF"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.font = "800 " + Math.round(r * 0.72) + "px Manrope, system-ui, sans-serif";
  ctx.fillText("-" + pct + "%", 0, r * 0.04);
  ctx.restore();
}

// Tarjeta de producto nítida: sin desenfoque, profundidad solo por
// tamaño y sombra. size es en píxeles reales (sin ctx.scale), porque
// shadowBlur no se escala con la transformación del canvas.
function drawProductCard(ctx, item, cx, cy, size, angle, alpha, depth, theme, accent) {
  const h = size / 2, r = size * 0.14;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.save();
  ctx.shadowColor = theme.cardShadow;
  ctx.shadowBlur = size * (0.05 + 0.11 * depth);
  ctx.shadowOffsetY = size * (0.02 + 0.06 * depth);
  roundRectPath(ctx, -h, -h, size, size, r);
  ctx.fillStyle = theme.cardBg;
  ctx.fill();
  ctx.restore();
  roundRectPath(ctx, -h, -h, size, size, r);
  ctx.lineWidth = Math.max(2, size * 0.006);
  ctx.strokeStyle = theme.cardBorder;
  ctx.stroke();
  if (item.photo) {
    const p = size * 0.035;
    drawPhotoCover(ctx, item.photo, -h + p, -h + p, size - 2 * p, size - 2 * p, r * 0.8);
  } else {
    drawEmoji(ctx, item.icon || "🛍️", 0, 0, size * 0.58);
  }
  ctx.restore();
  if (item.priceNow) drawPriceBadge(ctx, item, cx, cy, size, alpha, accent || "#F26B0F");
}

function hexToRgba(hex, a) {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? h.split("").map(c => c + c).join("") : h;
  const n = parseInt(f, 16);
  return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
}

function drawBackground(ctx, theme, accent, glowY) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, W, H);
  if (theme.usesPhoto && bgPhotoBlurred) {
    ctx.drawImage(bgPhotoBlurred, 0, 0, W, H);
    ctx.fillStyle = "rgba(10,9,7," + BG_VEIL + ")";
    ctx.fillRect(0, 0, W, H);
  }
  const g = ctx.createRadialGradient(W / 2, glowY, 0, W / 2, glowY, W * 0.8);
  g.addColorStop(0, hexToRgba(accent, theme.glow));
  g.addColorStop(1, hexToRgba(accent, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function drawArrivalRing(ctx, cx, cy, size, t, accent) {
  const rt = (t - 0.40) / 0.30;
  if (rt <= 0 || rt >= 1) return;
  ctx.save();
  ctx.strokeStyle = hexToRgba(accent, (1 - rt) * 0.6);
  ctx.lineWidth = 8;
  const s = size * (1.02 + 0.35 * easeOutCubic(rt));
  roundRectPath(ctx, cx - s / 2, cy - s / 2, s, s, s * 0.16);
  ctx.stroke();
  ctx.restore();
}

// Titular con una o varias palabras resaltadas con brillo; parte en
// líneas automáticamente y entra con un fundido suave.
function drawHeadline(ctx, text, keyword, theme, accent, frame, localMs, y) {
  if (!text || !text.trim()) return;
  const norm = s => s.toLowerCase().replace(/[.,!?¡¿:;"'()]/g, "");
  const kw = (keyword || "").trim().split(/\s+/).map(norm).filter(Boolean);
  const inT = easeOutCubic(clamp(localMs / 450, 0, 1));
  ctx.save();
  ctx.globalAlpha = inT;
  ctx.font = "800 70px Manrope, system-ui, sans-serif";
  ctx.textBaseline = "middle"; ctx.textAlign = "left";
  const space = ctx.measureText(" ").width;
  const maxW = W * 0.86;
  const lines = []; let cur = [], curW = 0;
  text.trim().split(/\s+/).forEach(function (w) {
    const ww = ctx.measureText(w).width;
    const add = cur.length ? space + ww : ww;
    if (cur.length && curW + add > maxW) { lines.push({ words: cur, w: curW }); cur = [w]; curW = ww; }
    else { cur.push(w); curW += add; }
  });
  if (cur.length) lines.push({ words: cur, w: curW });
  const lh = 84, top = y - ((lines.length - 1) * lh) / 2 + (1 - inT) * 24;
  const glow = 24 + Math.sin(frame / 10) * 10;
  lines.forEach(function (ln, li) {
    let x = W / 2 - ln.w / 2;
    ln.words.forEach(function (w) {
      if (kw.indexOf(norm(w)) >= 0) { ctx.shadowColor = accent; ctx.shadowBlur = glow; ctx.fillStyle = accent; }
      else { ctx.shadowBlur = 0; ctx.fillStyle = theme.text; }
      ctx.fillText(w, x, top + li * lh);
      x += ctx.measureText(w).width + space;
    });
  });
  ctx.restore();
}

function drawLogo(ctx, opts, localMs) {
  const theme = opts.theme, accent = opts.accentColor;
  drawBackground(ctx, theme, accent, H * 0.5);
  const letters = opts.storeName.split("");
  let fontPx = 112;
  ctx.save();
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  let widths, total;
  do {
    ctx.font = "800 " + fontPx + "px Manrope, system-ui, sans-serif";
    widths = letters.map(l => ctx.measureText(l).width);
    total = widths.reduce((a, b) => a + b, 0);
    fontPx -= 4;
  } while (total > W * 0.86 && fontPx > 40);
  let x = W / 2 - total / 2;
  const stagger = 75, dur = 450, y = H * 0.46;
  letters.forEach(function (l, i) {
    const lt = clamp((localMs - i * stagger) / dur, 0, 1);
    ctx.globalAlpha = clamp((localMs - i * stagger) / 200, 0, 1);
    ctx.fillStyle = theme.text;
    ctx.fillText(l, x + widths[i] / 2, y + (1 - easeOutBack(lt)) * -70);
    x += widths[i];
  });
  ctx.globalAlpha = 1;
  const lineT = clamp((localMs - letters.length * stagger - 150) / 400, 0, 1);
  if (lineT > 0) {
    ctx.strokeStyle = accent; ctx.lineWidth = 7; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(W / 2 - (total / 2) * lineT, y + 78); ctx.lineTo(W / 2 + (total / 2) * lineT, y + 78); ctx.stroke();
  }
  const cta = (opts.cta || "").trim();
  const ctaT = clamp((localMs - letters.length * stagger - 450) / 380, 0, 1);
  if (cta && ctaT > 0) {
    const s = easeOutBack(ctaT);
    ctx.font = "800 46px Manrope, system-ui, sans-serif";
    const tw = ctx.measureText(cta).width, pw = tw + 96, ph = 104;
    ctx.save();
    ctx.translate(W / 2, y + 230);
    ctx.scale(s, s);
    ctx.shadowColor = hexToRgba(accent, 0.5); ctx.shadowBlur = 36; ctx.shadowOffsetY = 10;
    roundRectPath(ctx, -pw / 2, -ph / 2, pw, ph, ph / 2);
    ctx.fillStyle = accent; ctx.fill();
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(cta, 0, 3);
    ctx.restore();
  }
  ctx.restore();
}

// ============================================================
// Elementos compartidos entre TODOS los estilos: barra de progreso,
// aviso de urgencia y tarjeta de reseña. Un solo lugar para cambiarlos,
// en vez de repetir la lógica en cada estilo.
// ============================================================
function drawProgressBar(ctx, frame, total, accent, theme) {
  const h = 9;
  ctx.save();
  ctx.fillStyle = theme.id === "oscuro" ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)";
  ctx.fillRect(0, H - h, W, h);
  ctx.fillStyle = accent;
  ctx.fillRect(0, H - h, W * clamp(frame / Math.max(1, total - 1), 0, 1), h);
  ctx.restore();
}

// Aviso FIJO de texto — a propósito nunca es un reloj corriendo: un video
// exportado es un archivo estático, así que un cronómetro real se vería
// absurdo o directamente falso si alguien lo ve al día siguiente.
function drawUrgencyBadge(ctx, text, accent, theme, frame) {
  const alpha = clamp(frame / 20, 0, 1);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = "800 30px Manrope, system-ui, sans-serif";
  const label = "⚡ " + text;
  const tw = ctx.measureText(label).width, padX = 26, h = 62;
  const w = tw + padX * 2, x = 34, y = 40;
  ctx.shadowColor = "rgba(0,0,0,0.25)"; ctx.shadowBlur = 14; ctx.shadowOffsetY = 4;
  roundRectPath(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = accent; ctx.fill();
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.fillStyle = "#FFFFFF"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
  ctx.fillText(label, x + padX, y + h / 2 + 2);
  ctx.restore();
}

// Reseñas / prueba social: hasta 4, se turnan una tras otra durante el
// recorrido, en la zona de pantalla que el vendedor elige (6 posiciones).
const REVIEW_POSITIONS = [
  { id: "tl", label: "Arriba a la izquierda" }, { id: "tr", label: "Arriba a la derecha" },
  { id: "ml", label: "En medio, a la izquierda" }, { id: "mr", label: "En medio, a la derecha" },
  { id: "bl", label: "Abajo a la izquierda" }, { id: "br", label: "Abajo a la derecha" }
];

function drawReviewBox(ctx, review, pos, alpha, tx, theme, accent) {
  const pad = 26, lh = 40, maxW = W * 0.44;
  ctx.save();
  ctx.font = "600 32px Manrope, system-ui, sans-serif";
  const words = ('"' + review.quote + '"').split(" ");
  const lines = []; let line = "";
  words.forEach(function (w) {
    const t = line ? line + " " + w : w;
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else { line = t; }
  });
  if (line) lines.push(line);
  const textW = Math.max.apply(null, lines.map(l => ctx.measureText(l).width).concat([5 * 32, 250]));
  const boxW = Math.min(maxW, textW) + pad * 2;
  const boxH = pad + 34 + lines.length * lh + 12 + 30 + pad - 6;
  const col = pos.charAt(1), row = pos.charAt(0);
  const x = (col === "l" ? 36 : W - 36 - boxW) + tx;
  const y = row === "t" ? H * 0.20 : row === "m" ? H * 0.46 - boxH / 2 : H * 0.82 - boxH;
  ctx.globalAlpha = alpha;
  ctx.shadowColor = "rgba(0,0,0,0.25)"; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8;
  roundRectPath(ctx, x, y, boxW, boxH, 24);
  ctx.fillStyle = theme.cardBg; ctx.fill();
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.lineWidth = 2; ctx.strokeStyle = theme.cardBorder; ctx.stroke();
  ctx.textAlign = "left"; ctx.textBaseline = "middle";
  ctx.font = "30px sans-serif";
  const stars = clamp(review.stars || 5, 1, 5);
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i < stars ? "#F5B301" : hexToRgba(theme.text, 0.2);
    ctx.fillText("★", x + pad + i * 32, y + pad + 16);
  }
  ctx.font = "600 32px Manrope, system-ui, sans-serif";
  ctx.fillStyle = theme.text;
  lines.forEach((l, i) => ctx.fillText(l, x + pad, y + pad + 34 + lh * i + lh / 2 + 4));
  ctx.font = "700 23px Manrope, system-ui, sans-serif";
  ctx.fillStyle = accent;
  ctx.fillText("✓ Cliente verificado", x + pad, y + boxH - pad - 4);
  ctx.restore();
}

function drawReviews(ctx, list, pos, frame, segment, theme, accent) {
  const start = segment * 0.10, end = segment * 0.94;
  if (frame < start || frame >= end) return;
  const slot = (end - start) / list.length;
  const i = Math.floor((frame - start) / slot);
  const review = list[i];
  if (!review) return;
  const local = frame - start - i * slot;
  const fadeIn = 16, fadeOut = 14;
  let p = 1;
  if (local < fadeIn) p = local / fadeIn;
  else if (local > slot - fadeOut) p = (slot - local) / fadeOut;
  p = easeOutCubic(clamp(p, 0, 1));
  const dir = pos.charAt(1) === "l" ? -1 : 1;
  drawReviewBox(ctx, review, pos, p, dir * (1 - p) * 70, theme, accent);
}

function drawChrome(ctx, frame, tl, opts) {
  if (opts.showProgress) drawProgressBar(ctx, frame, tl.total, opts.accentColor, opts.theme);
  if (frame < tl.segment) {
    if (opts.urgencyText) drawUrgencyBadge(ctx, opts.urgencyText, opts.accentColor, opts.theme, frame);
    if (opts.reviews && opts.reviews.length) drawReviews(ctx, opts.reviews, opts.reviewPos || "bl", frame, tl.segment, opts.theme, opts.accentColor);
  }
}

// ============================================================
// ESTILO 1 — Acercamiento
// ============================================================
const AP_TRAVEL = msToFrames(3200);
const AP_SPACING = Math.round(AP_TRAVEL * 0.62);
const AP_HEAD = Math.round(AP_TRAVEL * 0.18);
const AP_BASE = 560;

const StyleAcercamiento = {
  id: "acercamiento", icon: "🎯", label: "Acercamiento",
  description: "Cada producto vuela hacia la cámara, se detiene en el centro para lucirse y sigue de largo.",
  buildTimeline: function (d) {
    const items = d.items.slice(0, 6);
    const segment = (items.length - 1) * AP_SPACING + AP_TRAVEL - AP_HEAD;
    return { items: items, headline: d.headline, keyword: d.keyword, segment: segment, total: segment + LOGO_FRAMES };
  },
  renderFrame: function (ctx, frameIndex, tl, opts) {
    const frame = wrapFrame(frameIndex, tl.total);
    const theme = opts.theme, accent = opts.accentColor;
    if (frame >= tl.segment) {
      drawLogo(ctx, opts, (frame - tl.segment) * MS_PER_FRAME);
    } else {
      drawBackground(ctx, theme, accent, H * 0.57);
      const start = { x: W * 1.25, y: H * 0.84 }, end = { x: -W * 0.25, y: H * 0.30 };
      const visible = [];
      tl.items.forEach(function (item, i) {
        const local = frame + AP_HEAD - i * AP_SPACING;
        if (local < 0 || local > AP_TRAVEL) return;
        const t = local / AP_TRAVEL;
        const pos = dwell(t, 0.82);
        const bell = Math.sin(pos * Math.PI);
        const size = AP_BASE * opts.sizeScale * (0.32 + 0.68 * Math.pow(bell, 0.65));
        let alpha = 1;
        if (t < 0.05) alpha = t / 0.05; else if (t > 0.95) alpha = (1 - t) / 0.05;
        visible.push({
          item: item, t: t, size: size, bell: bell, alpha: clamp(alpha, 0, 1),
          x: start.x + (end.x - start.x) * pos, y: start.y + (end.y - start.y) * pos,
          angle: 0.38 * (1 - 2 * pos)
        });
      });
      visible.sort((a, b) => a.size - b.size);
      visible.forEach(function (v) {
        drawArrivalRing(ctx, v.x, v.y, v.size, v.t, accent);
        drawProductCard(ctx, v.item, v.x, v.y, v.size, v.angle, v.alpha, v.bell, theme, accent);
      });
      drawHeadline(ctx, tl.headline, tl.keyword, theme, accent, frame, frame * MS_PER_FRAME, H * 0.13);
    }
    drawChrome(ctx, frame, tl, opts);
  }
};

// ============================================================
// ESTILO 2 — Noria horizontal
// ============================================================
const NO_TRAVEL = msToFrames(3000);
const NO_SPACING = Math.round(NO_TRAVEL * 0.5);
const NO_HEAD = Math.round(NO_TRAVEL * 0.2);
const NO_BASE = 480;

const StyleNoria = {
  id: "noria", icon: "🎡", label: "Noria horizontal",
  description: "Los productos cruzan de lado a lado sobre un arco, se enderezan en el centro. Titular fijo arriba.",
  buildTimeline: function (d) {
    const items = d.items.slice(0, 6);
    const segment = (items.length - 1) * NO_SPACING + NO_TRAVEL - NO_HEAD;
    return { items: items, headline: d.headline, keyword: d.keyword, segment: segment, total: segment + LOGO_FRAMES };
  },
  renderFrame: function (ctx, frameIndex, tl, opts) {
    const frame = wrapFrame(frameIndex, tl.total);
    const theme = opts.theme, accent = opts.accentColor;
    if (frame >= tl.segment) {
      drawLogo(ctx, opts, (frame - tl.segment) * MS_PER_FRAME);
    } else {
      drawBackground(ctx, theme, accent, H * 0.58);
      const visible = [];
      tl.items.forEach(function (item, i) {
        const local = frame + NO_HEAD - i * NO_SPACING;
        if (local < 0 || local > NO_TRAVEL) return;
        const t = local / NO_TRAVEL;
        const pos = dwell(t, 0.55);
        const x = W * 1.4 - W * 1.8 * pos;
        const dx = (x - W / 2) / (W * 0.9);
        const y = H * 0.58 + dx * dx * H * 0.12;
        const slope = (2 * dx * H * 0.12) / (W * 0.9);
        const near = Math.max(0, 1 - dx * dx);
        const pop = near > 0.88 ? (near - 0.88) * 1.4 : 0; // pequeño rebote al centrarse
        let alpha = 1;
        if (t < 0.05) alpha = t / 0.05; else if (t > 0.95) alpha = (1 - t) / 0.05;
        visible.push({
          item: item, t: t, x: x, y: y, angle: Math.atan(slope) * 1.3, alpha: clamp(alpha, 0, 1),
          size: NO_BASE * opts.sizeScale * (0.62 + 0.38 * near + pop), depth: near
        });
      });
      visible.sort((a, b) => a.size - b.size);
      visible.forEach(function (v) {
        drawArrivalRing(ctx, v.x, v.y, v.size, v.t, accent);
        drawProductCard(ctx, v.item, v.x, v.y, v.size, v.angle, v.alpha, v.depth, theme, accent);
      });
      drawHeadline(ctx, tl.headline, tl.keyword, theme, accent, frame, frame * MS_PER_FRAME, H * 0.14);
    }
    drawChrome(ctx, frame, tl, opts);
  }
};

// ============================================================
// ESTILO 3 — Escenas secuenciales
// ============================================================
const SEQ_TARGET = msToFrames(14500), SEQ_FADE_IN = 350, SEQ_FADE_OUT = 300;

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" "); let line = ""; const lines = [];
  words.forEach(function (w) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w; } else { line = test; }
  });
  if (line) lines.push(line);
  const off = ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((l, i) => ctx.fillText(l, x, y - off + i * lineHeight));
}

const StyleSecuencial = {
  id: "secuencial", icon: "🎬", label: "Escenas secuenciales",
  description: "Una frase con su emoji o foto entra, se queda y sale. Ideal para contar algo paso a paso.",
  buildTimeline: function (d) {
    const scenes = d.scenes.slice(0, 5);
    const n = Math.max(1, scenes.length);
    const sceneFrames = clamp(Math.round((SEQ_TARGET - LOGO_FRAMES) / n), msToFrames(2000), msToFrames(2300));
    return { scenes: scenes, sceneFrames: sceneFrames, segment: n * sceneFrames, total: n * sceneFrames + LOGO_FRAMES };
  },
  renderFrame: function (ctx, frameIndex, tl, opts) {
    const frame = wrapFrame(frameIndex, tl.total);
    const theme = opts.theme, accent = opts.accentColor;
    if (frame >= tl.segment) {
      drawLogo(ctx, opts, (frame - tl.segment) * MS_PER_FRAME);
    } else {
      drawBackground(ctx, theme, accent, H * 0.40);
      const idx = Math.floor(frame / tl.sceneFrames);
      const scene = tl.scenes[idx];
      const tMs = (frame - idx * tl.sceneFrames) * MS_PER_FRAME;
      const durMs = tl.sceneFrames * MS_PER_FRAME;
      let alpha = 1, ty = 0;
      if (tMs < SEQ_FADE_IN) { const p = easeOutCubic(tMs / SEQ_FADE_IN); alpha = p; ty = (1 - p) * 40; }
      else if (tMs > durMs - SEQ_FADE_OUT) { const p = (tMs - (durMs - SEQ_FADE_OUT)) / SEQ_FADE_OUT; alpha = 1 - p; ty = -p * 30; }
      alpha = clamp(alpha, 0, 1);
      const pop = easeOutBack(clamp(tMs / 450, 0, 1));
      const float = Math.sin(tMs / 600) * 12;
      const cy = H * 0.40 + ty + float;
      if (scene.photo) {
        drawProductCard(ctx, scene, W / 2, cy, 420 * opts.sizeScale * pop, 0, alpha, 1, theme, accent);
      } else {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = hexToRgba(accent, 0.13);
        ctx.beginPath(); ctx.arc(W / 2, cy, 210 * opts.sizeScale * pop, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.globalAlpha = alpha;
        drawEmoji(ctx, scene.icon || "🏪", W / 2, cy, 280 * opts.sizeScale * pop);
        ctx.restore();
        if (scene.priceNow) drawPriceBadge(ctx, scene, W / 2, cy, 280 * opts.sizeScale * pop, alpha, accent);
      }
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = theme.text;
      ctx.font = "700 60px Manrope, system-ui, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      wrapText(ctx, scene.text, W / 2, H * 0.74 + ty, W * 0.82, 72);
      ctx.restore();
    }
    drawChrome(ctx, frame, tl, opts);
  }
};

// ============================================================
// ESTILO 4 — Antes / Después (transformación a pantalla completa)
// ============================================================
// 1) El "antes" ocupa toda la pantalla, apagado en gris, y le cae un sello ✕.
// 2) Una raya de luz cruza de izquierda a derecha BORRANDO el antes y
//    destapando el "después" a pantalla completa y a todo color.
// 3) Al terminar: destello, el producto entra con golpe de escala y cae
//    el sello ✓. La raya ya no es decorativa: es la que transforma.
const BA_HOLD_BEFORE = msToFrames(1000);
const BA_SWEEP = msToFrames(750);
const BA_HOLD_AFTER = msToFrames(2000);
const BA_PAIR_TOTAL = BA_HOLD_BEFORE + BA_SWEEP + BA_HOLD_AFTER;
const BA_FADE = msToFrames(250);
const BA_OK = "#1E9E5A", BA_BAD = "#D7263D";

function drawStamp(ctx, x, y, r, color, kind, p) {
  if (p <= 0) return;
  const s = easeOutBack(clamp(p, 0, 1));
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(kind === "x" ? -0.2 : 0.15);
  ctx.scale(s, s);
  ctx.shadowColor = "rgba(0,0,0,0.35)"; ctx.shadowBlur = r * 0.4; ctx.shadowOffsetY = r * 0.12;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = color; ctx.fill();
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = r * 0.2; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath();
  if (kind === "x") { const k = r * 0.38; ctx.moveTo(-k, -k); ctx.lineTo(k, k); ctx.moveTo(k, -k); ctx.lineTo(-k, k); }
  else { ctx.moveTo(-r * 0.42, 0); ctx.lineTo(-r * 0.1, r * 0.32); ctx.lineTo(r * 0.45, -r * 0.3); }
  ctx.stroke();
  ctx.restore();
}

function drawBALabel(ctx, text, color, textColor) {
  ctx.save();
  ctx.font = "800 38px Manrope, system-ui, sans-serif";
  const w = ctx.measureText(text).width + 64, h = 76;
  roundRectPath(ctx, W / 2 - w / 2, H * 0.17 - h / 2, w, h, h / 2);
  ctx.fillStyle = color; ctx.fill();
  ctx.fillStyle = textColor; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(text, W / 2, H * 0.17 + 2);
  ctx.restore();
}

// Dibuja un lado completo (antes o después) a pantalla completa.
function drawBASide(ctx, half, which, theme, accent, sizeScale, scale, stampP) {
  const isBefore = which === "before";
  drawBackground(ctx, theme, isBefore ? "#808080" : accent, H * 0.44);
  const size = 520 * sizeScale * scale;
  const cy = H * 0.45;
  ctx.save();
  if (isBefore && "filter" in ctx) ctx.filter = "grayscale(1)";
  if (half.photo) {
    drawProductCard(ctx, half, W / 2, cy, size, 0, 1, 1, theme, accent);
  } else {
    ctx.fillStyle = isBefore ? "rgba(128,128,128,0.16)" : hexToRgba(accent, 0.16);
    ctx.beginPath(); ctx.arc(W / 2, cy, size * 0.5, 0, Math.PI * 2); ctx.fill();
    drawEmoji(ctx, half.icon || (isBefore ? "😩" : "😍"), W / 2, cy, size * 0.62);
  }
  ctx.restore();
  if (isBefore) {
    // Velo gris: garantiza el aspecto "apagado" aunque el navegador no aplique el filtro
    ctx.fillStyle = theme.id === "crema" ? "rgba(247,243,234,0.38)" : "rgba(20,18,14,0.38)";
    ctx.fillRect(0, 0, W, H);
  }
  if (half.text) {
    ctx.save();
    ctx.fillStyle = isBefore ? hexToRgba(theme.text, 0.6) : theme.text;
    ctx.font = "800 64px Manrope, system-ui, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    wrapText(ctx, half.text, W / 2, H * 0.71, W * 0.84, 76);
    ctx.restore();
  }
  drawBALabel(ctx, isBefore ? "ANTES" : "DESPUÉS", isBefore ? "rgba(120,120,120,0.9)" : accent, "#FFFFFF");
  drawStamp(ctx, W / 2 + size * 0.36, cy - size * 0.36, Math.max(60, size * 0.13), isBefore ? BA_BAD : BA_OK, isBefore ? "x" : "check", stampP);
}

const StyleAntesDespues = {
  id: "antesdespues", icon: "↔️", label: "Antes / Después",
  description: "El antes aparece apagado, una raya de luz lo borra y revela el después a todo color.",
  buildTimeline: function (d) {
    const pairs = d.pairs.slice(0, 3);
    const segment = pairs.length * BA_PAIR_TOTAL;
    return { pairs: pairs, headline: d.headline, keyword: d.keyword, segment: segment, total: segment + LOGO_FRAMES };
  },
  renderFrame: function (ctx, frameIndex, tl, opts) {
    const frame = wrapFrame(frameIndex, tl.total);
    const theme = opts.theme, accent = opts.accentColor;
    if (frame >= tl.segment) {
      drawLogo(ctx, opts, (frame - tl.segment) * MS_PER_FRAME);
    } else {
      const idx = clamp(Math.floor(frame / BA_PAIR_TOTAL), 0, tl.pairs.length - 1);
      const pair = tl.pairs[idx];
      const local = frame - idx * BA_PAIR_TOTAL;
      const sweepStart = BA_HOLD_BEFORE, sweepEnd = BA_HOLD_BEFORE + BA_SWEEP;
      const beforeStamp = clamp((local - msToFrames(300)) / msToFrames(350), 0, 1);
      const lineX = local < sweepStart ? 0 : local < sweepEnd ? W * easeOutCubic((local - sweepStart) / BA_SWEEP) : W;

      // Capa 1: el antes, entero
      if (lineX < W) drawBASide(ctx, pair.before, "before", theme, accent, opts.sizeScale, 1, beforeStamp);
      // Capa 2: el después, solo en la zona que la raya ya borró
      if (lineX > 0) {
        const afterLocal = local - sweepEnd;
        const punch = afterLocal < 0 ? 0.92 : easeOutBack(clamp(afterLocal / msToFrames(420), 0, 1)) * 0.08 + 0.92;
        const afterStamp = clamp((afterLocal - msToFrames(200)) / msToFrames(350), 0, 1);
        ctx.save();
        ctx.beginPath(); ctx.rect(0, 0, lineX, H); ctx.clip();
        drawBASide(ctx, pair.after, "after", theme, accent, opts.sizeScale, punch, afterStamp);
        ctx.restore();
      }
      // La raya de luz
      if (local >= sweepStart && local < sweepEnd) {
        ctx.save();
        const g = ctx.createLinearGradient(lineX - 90, 0, lineX + 30, 0);
        g.addColorStop(0, hexToRgba(accent, 0));
        g.addColorStop(0.75, hexToRgba(accent, 0.45));
        g.addColorStop(1, hexToRgba(accent, 0));
        ctx.fillStyle = g; ctx.fillRect(lineX - 90, 0, 120, H);
        ctx.shadowColor = accent; ctx.shadowBlur = 40;
        ctx.fillStyle = "#FFFFFF"; ctx.fillRect(lineX - 4, 0, 8, H);
        ctx.restore();
      }
      // Destello al terminar de cruzar
      const flashT = (local - sweepEnd) / msToFrames(320);
      if (flashT >= 0 && flashT < 1) {
        ctx.save();
        ctx.fillStyle = "rgba(255,255,255," + (0.6 * (1 - flashT)).toFixed(3) + ")";
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }
      drawHeadline(ctx, tl.headline, tl.keyword, theme, accent, frame, frame * MS_PER_FRAME, H * 0.87);
      // Fundido entre comparaciones
      let fade = 0;
      if (idx > 0 && local < BA_FADE) fade = 1 - local / BA_FADE;
      if (local > BA_PAIR_TOTAL - BA_FADE) fade = (local - (BA_PAIR_TOTAL - BA_FADE)) / BA_FADE;
      if (fade > 0) { ctx.save(); ctx.globalAlpha = clamp(fade, 0, 1); ctx.fillStyle = theme.bg; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    }
    drawChrome(ctx, frame, tl, opts);
  }
};

// ============================================================
// ESTILO 5 — Mosaico de catálogo
// ============================================================
const MO_STAGGER = msToFrames(220);
const MO_POP = msToFrames(420);
const MO_HOLD = msToFrames(2600);

function mosaicGrid(n) {
  const cols = n <= 2 ? n : n <= 4 ? 2 : 3;
  const rows = Math.ceil(n / cols);
  return { cols: cols, rows: rows };
}

const StyleMosaico = {
  id: "mosaico", icon: "🧩", label: "Mosaico de catálogo",
  description: "Varios productos van llenando una cuadrícula, uno por uno, hasta formar tu mini-catálogo.",
  buildTimeline: function (d) {
    const items = d.items.slice(0, 6);
    const segment = (items.length - 1) * MO_STAGGER + MO_POP + MO_HOLD;
    return { items: items, headline: d.headline, keyword: d.keyword, segment: segment, total: segment + LOGO_FRAMES };
  },
  renderFrame: function (ctx, frameIndex, tl, opts) {
    const frame = wrapFrame(frameIndex, tl.total);
    const theme = opts.theme, accent = opts.accentColor;
    if (frame >= tl.segment) {
      drawLogo(ctx, opts, (frame - tl.segment) * MS_PER_FRAME);
    } else {
      drawBackground(ctx, theme, accent, H * 0.5);
      const n = tl.items.length, grid = mosaicGrid(n);
      const areaTop = H * 0.24, areaBottom = H * 0.86;
      const cellW = W * 0.86 / grid.cols, cellH = (areaBottom - areaTop) / grid.rows;
      const cell = Math.min(cellW, cellH) * 0.86 * opts.sizeScale;
      const gridW = cellW * grid.cols, gridH = cellH * grid.rows;
      const originX = W / 2 - gridW / 2, originY = areaTop + (areaBottom - areaTop - gridH) / 2;
      tl.items.forEach(function (item, i) {
        const local = frame - i * MO_STAGGER;
        if (local < 0) return;
        const col = i % grid.cols, row = Math.floor(i / grid.cols);
        const cx = originX + cellW * (col + 0.5), cy = originY + cellH * (row + 0.5);
        const p = clamp(local / MO_POP, 0, 1);
        const scale = easeOutBack(p);
        const alpha = clamp(local / (MO_POP * 0.6), 0, 1);
        drawProductCard(ctx, item, cx, cy, cell * scale, (1 - p) * 0.3, alpha, 1, theme, accent);
      });
      drawHeadline(ctx, tl.headline, tl.keyword, theme, accent, frame, frame * MS_PER_FRAME, H * 0.12);
    }
    drawChrome(ctx, frame, tl, opts);
  }
};

const STYLES = { acercamiento: StyleAcercamiento, noria: StyleNoria, secuencial: StyleSecuencial, antesdespues: StyleAntesDespues, mosaico: StyleMosaico };
const STYLE_ORDER = ["acercamiento", "noria", "secuencial", "antesdespues", "mosaico"];

// ============================================================
// Adaptación a módulo: estado que en el prototipo era global
// ============================================================
export function setCurrency(c) { currency = c; }
export function getCurrency() { return currency; }
export function setBackgroundPhoto(img) {
  bgPhoto = img || null;
  bgPhotoBlurred = img ? prepareBlurredBackground(img) : null;
}
export function getBackgroundPhoto() { return bgPhoto; }

// ============================================================
// Marca de agua (plan gratis) — NUEVO, no modifica nada existente
// ============================================================
// Logotipo real de RETADOR + "Hecho con RETADOR" como una sola pieza, dentro
// de una píldora oscura semitransparente para que se lea igual sobre Crema,
// Oscuro premium y Foto propia. Esquina inferior derecha, por encima de la
// barra de progreso. Se dibuja al FINAL de cada fotograma (vista previa y
// exportación), así queda dentro del archivo descargado.
// El logo DEBE venir del mismo dominio de la app: una imagen de otro dominio
// sin CORS "contamina" el canvas y la exportación falla.
let watermarkLogo = null;
export function loadWatermarkLogo(src) {
  return new Promise(function (resolve) {
    const img = new Image();
    img.onload = function () { watermarkLogo = img; resolve(img); };
    img.onerror = function () { resolve(null); };
    img.src = src;
  });
}

const WM_TEXT = "Hecho con RETADOR";
export function drawWatermark(ctx) {
  const logo = 56, padX = 14, gap = 14, h = 78;
  ctx.save();
  ctx.font = "800 30px Manrope, system-ui, sans-serif";
  const tw = ctx.measureText(WM_TEXT).width;
  const w = padX + logo + gap + tw + padX + 10;
  const x = W - 32 - w, y = H - 9 - 24 - h;
  ctx.globalAlpha = 0.88;
  ctx.shadowColor = "rgba(0,0,0,0.30)"; ctx.shadowBlur = 18; ctx.shadowOffsetY = 4;
  roundRectPath(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = "rgba(12,11,9,0.48)"; ctx.fill();
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  const lx = x + padX, ly = y + (h - logo) / 2;
  if (watermarkLogo) {
    ctx.save();
    roundRectPath(ctx, lx, ly, logo, logo, logo * 0.23);
    ctx.clip();
    ctx.drawImage(watermarkLogo, lx, ly, logo, logo);
    ctx.restore();
  }
  ctx.shadowColor = "rgba(0,0,0,0.45)"; ctx.shadowBlur = 6;
  ctx.fillStyle = "#FFFFFF"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
  ctx.fillText(WM_TEXT, lx + logo + gap, y + h / 2 + 1);
  ctx.restore();
}

// Envuelve un estilo sin tocarlo: dibuja su fotograma de siempre y encima la
// marca de agua. Lo usan igual la vista previa y la exportación.
export function withWatermark(style) {
  return Object.assign({}, style, {
    renderFrame: function (ctx, frameIndex, tl, opts) {
      style.renderFrame(ctx, frameIndex, tl, opts);
      drawWatermark(ctx);
    }
  });
}

// ============================================================
// Exportación (copiada tal cual del prototipo)
// ============================================================
// 1080×1920 necesita un perfil H.264 nivel 4.x; el nivel 3.1 (42001f)
// solo llega a 1280×720 y fallaría. Se pregunta al navegador cuál soporta.
async function pickAvcCodec() {
  if (typeof window.VideoEncoder === "undefined" || typeof window.VideoFrame === "undefined" || typeof Mp4Muxer.Muxer === "undefined") return null;
  const candidates = ["avc1.640028", "avc1.4d0028", "avc1.420028", "avc1.640032"];
  for (const codec of candidates) {
    try {
      const r = await VideoEncoder.isConfigSupported({ codec: codec, width: W, height: H, bitrate: 8000000, framerate: FPS });
      if (r && r.supported) return codec;
    } catch (e) { /* probar el siguiente */ }
  }
  return null;
}

async function exportMp4(style, tl, opts, canvas, codec) {
  const ctx = canvas.getContext("2d");
  const muxer = new Mp4Muxer.Muxer({ target: new Mp4Muxer.ArrayBufferTarget(), video: { codec: "avc", width: W, height: H }, fastStart: "in-memory" });
  let encErr = null;
  const encoder = new VideoEncoder({ output: (chunk, meta) => muxer.addVideoChunk(chunk, meta), error: e => { encErr = e; } });
  encoder.configure({ codec: codec, width: W, height: H, bitrate: 8000000, framerate: FPS });
  // La velocidad cambia cuántos fotogramas de salida dura el video; cada
  // fotograma sigue calculándose de forma exacta, así que sigue fluido.
  const outTotal = Math.ceil(tl.total / opts.speed);
  for (let f = 0; f < outTotal; f++) {
    if (encErr) throw encErr;
    style.renderFrame(ctx, Math.min(f * opts.speed, tl.total - 0.001), tl, opts);
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

function exportWebm(style, tl, opts, canvas) {
  return new Promise(function (resolve, reject) {
    const ctx = canvas.getContext("2d");
    let stream;
    try { stream = canvas.captureStream(60); } catch (e) { reject(new Error("Este navegador no soporta captura de canvas.")); return; }
    const mime = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find(m => window.MediaRecorder && MediaRecorder.isTypeSupported(m));
    if (!mime) { reject(new Error("Este navegador no soporta grabación de video.")); return; }
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6000000 });
    const chunks = [];
    rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
    rec.onstop = () => resolve(new Blob(chunks, { type: mime }));
    rec.onerror = e => reject(e.error || new Error("Error grabando el video."));
    const totalMs = Math.ceil(tl.total / opts.speed) * MS_PER_FRAME, t0 = performance.now();
    rec.start();
    (function tick() {
      const el = performance.now() - t0;
      setProgress((el / totalMs) * 100, "Grabando en tiempo real…");
      if (el >= totalMs) { style.renderFrame(ctx, tl.total - 1, tl, opts); rec.stop(); return; }
      style.renderFrame(ctx, Math.min(Math.floor(el / MS_PER_FRAME) * opts.speed, tl.total - 0.001), tl, opts);
      requestAnimationFrame(tick);
    })();
  });
}

export {
  FPS, MS_PER_FRAME, W, H, clamp,
  THEMES, THEME_ORDER, QUICK_EMOJIS, EMOJI_CATS, extractEmoji,
  CURRENCIES, parsePrice, discountPct, REVIEW_POSITIONS,
  STYLES, STYLE_ORDER, pickAvcCodec, exportMp4, exportWebm
};
