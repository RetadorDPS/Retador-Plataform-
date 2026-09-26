// ═════════════════════════════════════════════════════════════════════════════
// Generador de Video Promocional v8.7 — MOTOR DE DIBUJO (tiempo, temas, emojis, dibujo base, elementos compartidos)
// Copiado TAL CUAL del prototipo aprobado (retador-video-generador-v8.7.html).
// Los cambios de integración van marcados con [integración]; todo lo demás es
// idéntico línea a línea (se verifica con un script, ver README).
// ═════════════════════════════════════════════════════════════════════════════

// ============================================================
// Tiempo — todo en fotogramas, nunca en reloj real
// ============================================================
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

// [v8.3] Efectos del cierre compartido (drawLogo): whoosh al entrar, brillo
// cuando se dibuja la línea y pop cuando aparece la frase final.
function logoSfx(segmentFrames, opts) {
  const S = segmentFrames / FPS, n = ((opts && opts.storeName) || "RETADOR").length;
  const ev = [{ t: Math.max(0, S - 0.12), type: "whoosh" }, { t: S + n * 0.075 + 0.15, type: "chime" }];
  if (opts && (opts.cta || "").trim()) ev.push({ t: S + n * 0.075 + 0.5, type: "pop" });
  return ev;
}

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
// [v8.0] Desenfoque de verdad (tipo gaussiano: 3 pasadas de caja) hecho UNA sola vez
// al subir la foto, a media resolución, y ampliado ×2 ya suave. Antes se
// ampliaba una miniatura de 90×160 y salía cuadriculada.
function boxBlurRGBA(src, w, h, r) {
  const tmp = new Uint8ClampedArray(src.length), div = r * 2 + 1;
  function pass(inp, out, horiz) {
    const lines = horiz ? h : w, len = horiz ? w : h;
    for (let l = 0; l < lines; l++) {
      for (let c = 0; c < 4; c++) {
        const idx = i => (horiz ? (l * w + i) : (i * w + l)) * 4 + c;
        let acc = 0;
        for (let i = -r; i <= r; i++) acc += inp[idx(clamp(i, 0, len - 1))];
        for (let i = 0; i < len; i++) {
          out[idx(i)] = acc / div;
          acc += inp[idx(Math.min(i + r + 1, len - 1))] - inp[idx(Math.max(i - r, 0))];
        }
      }
    }
  }
  for (let k = 0; k < 3; k++) { pass(src, tmp, true); pass(tmp, src, false); }
}
function prepareBlurredBackground(img) {
  const sw = W / 2, sh = H / 2;
  const small = document.createElement("canvas");
  small.width = sw; small.height = sh;
  const sctx = small.getContext("2d");
  const ir = img.naturalWidth / img.naturalHeight, br = sw / sh;
  let dw, dh;
  if (ir > br) { dh = sh; dw = sh * ir; } else { dw = sw; dh = sw / ir; }
  sctx.imageSmoothingEnabled = true; sctx.imageSmoothingQuality = "high";
  sctx.drawImage(img, (sw - dw) / 2, (sh - dh) / 2, dw, dh);
  try {
    const id = sctx.getImageData(0, 0, sw, sh);
    boxBlurRGBA(id.data, sw, sh, 14);
    sctx.putImageData(id, 0, 0);
  } catch (e) { /* si el navegador no deja leer píxeles, queda la foto sin desenfocar bajo el velo */ }
  const big = document.createElement("canvas");
  big.width = W; big.height = H;
  const bctx = big.getContext("2d");
  bctx.imageSmoothingEnabled = true;
  bctx.imageSmoothingQuality = "high";
  bctx.drawImage(small, 0, 0, W, H);
  return big;
}

// [v8.0] Grano fino y FIJO (no cambia entre fotogramas) que se pinta sobre los
// fondos degradados: rompe las "bandas"/escalones que se ven en los fondos
// oscuros con brillo de color, sobre todo después de comprimir el video.
let grainPattern = null;
function getGrain(ctx) {
  if (grainPattern) return grainPattern;
  const g = document.createElement("canvas"); g.width = 256; g.height = 256;
  const gx = g.getContext("2d"), id = gx.createImageData(256, 256);
  let seed = 1337;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i = 0; i < id.data.length; i += 4) {
    const v = Math.floor(rnd() * 256);
    id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255;
  }
  gx.putImageData(id, 0, 0);
  grainPattern = ctx.createPattern(g, "repeat");
  return grainPattern;
}
function drawGrain(ctx, x, y, w, h, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = getGrain(ctx);
  ctx.fillRect(x, y, w, h);
  ctx.restore();
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
// [v8.7] Monedas con uso real para los vendedores de RETADOR. Siempre detrás
// del número ("32 USD") para no confundir el $ del dólar con el del peso.
// MLC se deja al final por si alguien la necesita.
let currency = "USD";
const CURRENCIES = [
  { id: "USD", label: "USD (dólar)", sym: "USD" },
  { id: "EUR", label: "€ (euro)", sym: "€" },
  { id: "CUP", label: "CUP (peso cubano)", sym: "CUP" },
  { id: "ZELLE", label: "Zelle", sym: "Zelle" },
  { id: "MLC", label: "MLC", sym: "MLC" }
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
  return raw + " " + c.sym;
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
  // [v8.0] Brillo con caída suave (varias paradas en vez de 2 = sin borde marcado)
  const g = ctx.createRadialGradient(W / 2, glowY, 0, W / 2, glowY, W * 0.85);
  const a = theme.glow;
  [[0, 1], [0.25, 0.78], [0.5, 0.45], [0.75, 0.16], [1, 0]].forEach(st => g.addColorStop(st[0], hexToRgba(accent, a * st[1])));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // Grano solo en fondos oscuros o con foto: es donde se notan las bandas
  if (theme.usesPhoto || theme.id === "oscuro") drawGrain(ctx, 0, 0, W, H, 0.035);
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

// [integración] La interfaz vive en otro módulo: estas dos variables se asignan por aquí.
export function setBgPhoto(img, blurred) { bgPhoto = img; bgPhotoBlurred = blurred; }
export function setCurrency(c) { currency = c; }

export {
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
};
