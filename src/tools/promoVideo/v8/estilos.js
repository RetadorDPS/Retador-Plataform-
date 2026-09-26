// ═════════════════════════════════════════════════════════════════════════════
// Generador de Video Promocional v8.7 — LOS 8 ESTILOS
// Copiado TAL CUAL del prototipo aprobado (retador-video-generador-v8.7.html).
// Los cambios de integración van marcados con [integración]; todo lo demás es
// idéntico línea a línea (se verifica con un script, ver README).
// ═════════════════════════════════════════════════════════════════════════════
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
import { seededRand } from "./audio.js";

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
    return { items: items, headline: d.headline, keyword: d.keyword, dir: d.dir || "dg-izq", segment: segment, total: segment + LOGO_FRAMES };
  },
  // [v8.3] whoosh al entrar cada producto, pop cuando llega al centro (anillo)
  sfxEvents: function (tl, opts) {
    const ev = [];
    tl.items.forEach(function (it, i) {
      const f0 = i * AP_SPACING - AP_HEAD;
      ev.push({ t: Math.max(0.02, (f0 + 0.10 * AP_TRAVEL) / FPS), type: "whoosh", cat: "item" });
      ev.push({ t: (f0 + 0.40 * AP_TRAVEL) / FPS, type: "pop", cat: "item" });
    });
    return ev.concat(logoSfx(tl.segment, opts));
  },
  renderFrame: function (ctx, frameIndex, tl, opts) {
    const frame = wrapFrame(frameIndex, tl.total);
    const theme = opts.theme, accent = opts.accentColor;
    if (frame >= tl.segment) {
      drawLogo(ctx, opts, (frame - tl.segment) * MS_PER_FRAME);
    } else {
      drawBackground(ctx, theme, accent, H * 0.57);
      // [v8.4] Recorridos: diagonal o horizontal, hacia la izquierda o la derecha
      const horiz = tl.dir === "h-izq" || tl.dir === "h-der", toRight = tl.dir === "dg-der" || tl.dir === "h-der";
      let start = horiz ? { x: W * 1.25, y: H * 0.57 } : { x: W * 1.25, y: H * 0.84 };
      let end = horiz ? { x: -W * 0.25, y: H * 0.57 } : { x: -W * 0.25, y: H * 0.30 };
      if (toRight) { start = { x: W - start.x, y: start.y }; end = { x: W - end.x, y: end.y }; }
      const tilt = (horiz ? 0.22 : 0.38) * (toRight ? -1 : 1);
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
          angle: tilt * (1 - 2 * pos)
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
    return { items: items, headline: d.headline, keyword: d.keyword, dir: d.dir || "izq", segment: segment, total: segment + LOGO_FRAMES };
  },
  // [v8.3] whoosh al entrar por la derecha, pop al pasar por el centro
  sfxEvents: function (tl, opts) {
    const ev = [];
    tl.items.forEach(function (it, i) {
      const f0 = i * NO_SPACING - NO_HEAD;
      ev.push({ t: Math.max(0.02, (f0 + 0.18 * NO_TRAVEL) / FPS), type: "whoosh", cat: "item" });
      ev.push({ t: (f0 + 0.48 * NO_TRAVEL) / FPS, type: "pop", cat: "item" });
    });
    return ev.concat(logoSfx(tl.segment, opts));
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
        const x = tl.dir === "der" ? -W * 0.4 + W * 1.8 * pos : W * 1.4 - W * 1.8 * pos; // [v8.4] sentido
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
  // [v8.3] whoosh al cambiar de escena, pop cuando entra su contenido
  sfxEvents: function (tl, opts) {
    const ev = [];
    tl.scenes.forEach(function (sc, i) {
      const s0 = (i * tl.sceneFrames) / FPS;
      ev.push({ t: Math.max(0.02, s0 - 0.08), type: "whoosh" }, { t: s0 + 0.25, type: "pop", cat: "item" });
    });
    return ev.concat(logoSfx(tl.segment, opts));
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
  // [v8.3] pop al aparecer el "antes", subida durante el barrido, brillo al revelar el "después"
  sfxEvents: function (tl, opts) {
    const ev = [];
    tl.pairs.forEach(function (pr, i) {
      const p0 = i * BA_PAIR_TOTAL;
      ev.push({ t: (p0 + 8) / FPS, type: "pop", cat: "item" },
        { t: (p0 + BA_HOLD_BEFORE - 12) / FPS, type: "whoosh" },
        { t: (p0 + BA_HOLD_BEFORE + BA_SWEEP) / FPS, type: "chime" });
    });
    return ev.concat(logoSfx(tl.segment, opts));
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
  // [v8.3] un pop por cada casilla que aparece
  sfxEvents: function (tl, opts) {
    const ev = [{ t: 0.02, type: "whoosh" }];
    tl.items.forEach((it, i) => ev.push({ t: (i * MO_STAGGER + MO_POP * 0.45) / FPS, type: "pop", cat: "item" }));
    return ev.concat(logoSfx(tl.segment, opts));
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

// ============================================================
// [v8.0] ESTILO 6 — Directo (réplica exacta del diseño original: mismos
// colores fijos, misma tipografía Bricolage Grotesque, mismo ritmo.
// A propósito NO usa el tema/acento de marca — es un look propio,
// igual que el sello ✓/✕ fijo de Antes/Después no usa el tema tampoco.
// Tampoco usa el cierre compartido (drawLogo): trae su propia escena
// final, como en el diseño de origen.
// ============================================================
// [v8.0] Paletas del estilo Directo. "original" es el diseño de origen y va por defecto.
// Papeles: dark = fondo escenas 1 y 3 y texto de la escena 2; accent = círculos,
// cortinilla y barra; highlight = fondo escena 2, franja y botón; keyword = palabra
// destacada, bolsa y nombre de la tienda; badge/badgeText = círculo del precio.
const DI_PALETTES = [
  { id: "original", label: "Original", dark: "#0B2545", accent: "#0FB5A6", highlight: "#FFC93C", keyword: "#FFC93C", badge: "#FF5A4F", badgeText: "#FFFFFF", light: "#FFFFFF" },
  { id: "atardecer", label: "Atardecer", dark: "#2B1433", accent: "#FF7A59", highlight: "#FFD166", keyword: "#FFD166", badge: "#EF476F", badgeText: "#FFFFFF", light: "#FFFFFF" },
  { id: "bosque", label: "Bosque", dark: "#0F2E24", accent: "#2A9D8F", highlight: "#E9C46A", keyword: "#E9C46A", badge: "#E76F51", badgeText: "#FFFFFF", light: "#FFFFFF" },
  { id: "neon", label: "Neón", dark: "#14142B", accent: "#7B61FF", highlight: "#FF4D8D", keyword: "#FF4D8D", badge: "#FFC93C", badgeText: "#14142B", light: "#FFFFFF" },
  { id: "crema", label: "Crema y naranja", dark: "#161510", accent: "#F26B0F", highlight: "#F7F3EA", keyword: "#F26B0F", badge: "#F26B0F", badgeText: "#FFFFFF", light: "#FFFFFF" }
];
const DI_SPEEDS = [
  { id: "tranquilo", label: "Tranquilo", f: 0.8 },
  { id: "normal", label: "Normal", f: 1 },
  { id: "agil", label: "Ágil", f: 1.25 }
];
function diPalette(id) { return DI_PALETTES.find(x => x.id === id) || DI_PALETTES[0]; }
function diSpeed(id) { return DI_SPEEDS.find(x => x.id === id) || DI_SPEEDS[1]; }
// Achica la letra hasta que el texto quepa en el ancho dado.
function diFitFont(ctx, text, basePx, maxW, minPx) {
  let fs = basePx; ctx.font = diFont(fs);
  while (ctx.measureText(text).width > maxW && fs > minPx) { fs -= 2; ctx.font = diFont(fs); }
  return fs;
}
const DI_S = W / 540; // el diseño original se hizo para un lienzo de 540×960
const DI_T1 = msToFrames(2600), DI_T2 = msToFrames(5800), DI_TOTAL = msToFrames(9200);
function diFont(size, weight) { return (weight || 800) + ' ' + Math.round(size) + 'px "Bricolage Grotesque","Arial Black",Arial,sans-serif'; }
function diWipe(ctx, t, atSec, color) {
  const p = (t - (atSec - 0.3)) / 0.6;
  if (p <= 0 || p >= 1) return;
  ctx.fillStyle = color;
  if (p < 0.5) ctx.fillRect(0, 0, W * p * 2, H);
  else { const x = W * (p - 0.5) * 2; ctx.fillRect(x, 0, W - x, H); }
}
function diBag(ctx, cx, cy, s, p, color) {
  ctx.save();
  ctx.translate(cx - s / 2, cy - s / 2);
  ctx.strokeStyle = color; ctx.lineWidth = s * 0.07; ctx.lineCap = "round"; ctx.lineJoin = "round";
  const L1 = s * 3.4, L2 = s * 1.1;
  ctx.setLineDash([L1, L1]); ctx.lineDashOffset = L1 * (1 - clamp(p * 1.4, 0, 1));
  roundRectPath(ctx, s * 0.12, s * 0.30, s * 0.76, s * 0.62, s * 0.08); ctx.stroke();
  ctx.setLineDash([L2, L2]); ctx.lineDashOffset = L2 * (1 - clamp((p - 0.35) * 1.7, 0, 1));
  ctx.beginPath(); ctx.moveTo(s * 0.3, s * 0.34); ctx.bezierCurveTo(s * 0.3, s * 0.02, s * 0.7, s * 0.02, s * 0.7, s * 0.34); ctx.stroke();
  ctx.restore();
}
// Ilustración de ejemplo (cuando aún no hay foto real) o la foto real del producto.
function diPhoto(ctx, photo, x, y, w, h) {
  if (photo) { drawPhotoCover(ctx, photo, x, y, w, h, 0); return; }
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, "#9FE6DE"); g.addColorStop(1, "#FFE9A8");
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  const u = w / 100;
  ctx.fillStyle = "rgba(11,37,69,.10)"; ctx.beginPath(); ctx.ellipse(x + 50 * u, y + 88 * u, 34 * u, 5 * u, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#C98B4E"; roundRectPath(ctx, x + 22 * u, y + 40 * u, 56 * u, 44 * u, 4 * u); ctx.fill();
  ctx.fillStyle = "#E0A566"; ctx.fillRect(x + 22 * u, y + 40 * u, 56 * u, 9 * u);
  ctx.fillStyle = "#C98B4E"; ctx.fillRect(x + 46 * u, y + 40 * u, 8 * u, 9 * u);
  ctx.fillStyle = "#F2B705"; roundRectPath(ctx, x + 30 * u, y + 18 * u, 16 * u, 34 * u, 5 * u); ctx.fill();
  ctx.fillStyle = "#0B2545"; ctx.fillRect(x + 35 * u, y + 10 * u, 6 * u, 9 * u);
  ctx.fillStyle = "#fff"; roundRectPath(ctx, x + 32 * u, y + 30 * u, 12 * u, 12 * u, 2 * u); ctx.fill();
  ctx.fillStyle = "#FFFFFF"; roundRectPath(ctx, x + 52 * u, y + 22 * u, 22 * u, 30 * u, 3 * u); ctx.fill();
  ctx.fillStyle = "#0FB5A6"; ctx.fillRect(x + 52 * u, y + 32 * u, 22 * u, 10 * u);
  ctx.fillStyle = "#0B2545"; ctx.fillRect(x + 55 * u, y + 18 * u, 16 * u, 5 * u);
  ctx.restore();
}
function diWrapFit(ctx, text, maxW, sizes, maxLines) {
  let best = null;
  for (let si = 0; si < sizes.length; si++) {
    const size = sizes[si]; ctx.font = diFont(size);
    const words = text.split(/\s+/), lines = []; let cur = "", ok = true;
    for (let i = 0; i < words.length; i++) {
      if (ctx.measureText(words[i]).width > maxW) { ok = false; break; }
      const t = cur ? cur + " " + words[i] : words[i];
      if (ctx.measureText(t).width <= maxW) cur = t; else { lines.push(cur); cur = words[i]; }
    }
    if (!ok) continue;
    lines.push(cur);
    best = { size: size, lines: lines };
    if (lines.length <= maxLines) return best;
  }
  return best || { size: sizes[sizes.length - 1], lines: [text] };
}

const StyleDirecto = {
  id: "directo", icon: "⚡", label: "Directo",
  description: "El estilo más simple y elegante: titular, foto y precio, cierre con tu tienda. Con look propio (no cambia con el tema).",
  buildTimeline: function (d) {
    const title = (d.headline || "Tu producto").toUpperCase();
    const probe = document.createElement("canvas").getContext("2d");
    const layout = diWrapFit(probe, title, (W - 80 * DI_S), [100, 84, 70, 58, 48].map(s => s * DI_S), 4);
    const sp = diSpeed(d.speed).f;
    return {
      title: d.headline || "Tu producto", item: d.item || {}, layout: layout,
      pal: diPalette(d.palette), sp: sp,
      topText: (d.topText != null ? d.topText : "AHORA EN RETADOR").trim(),
      close1: (d.close1 != null ? d.close1 : "CÓMPRALO").trim(),
      close2: (d.close2 != null ? d.close2 : "EN MI TIENDA").trim(),
      button: (d.button != null ? d.button : "Ver en la tienda").trim(),
      total: Math.round(DI_TOTAL / sp)
    };
  },
  // [v8.3] tiempos del diseño original divididos por la velocidad propia de Directo
  sfxEvents: function (tl, opts) {
    const k = 1 / tl.sp, ev = [{ t: 0.05, type: "whoosh" }];
    ev.push({ t: 2.35 * k, type: "whoosh" }, { t: 3.15 * k, type: "impact" });
    if (tl.item && tl.item.priceNow) ev.push({ t: 3.55 * k, type: "pop", cat: "item" });
    ev.push({ t: 5.55 * k, type: "whoosh" });
    [tl.close1, tl.close2, "x"].forEach(function (l, i) { if (l) ev.push({ t: (6.6 + i * 0.25) * k, type: "pop" }); });
    ev.push({ t: 6.9 * k, type: "chime" });
    if (opts && (opts.cta || "").trim()) ev.push({ t: 7.95 * k, type: "pop" });
    return ev;
  },
  renderFrame: function (ctx, frameIndex, tl, opts) {
    const frame = wrapFrame(frameIndex, tl.total);
    const t = Math.min(9.2, (frame / FPS) * tl.sp);
    const P = tl.pal;
    const price = tl.item && tl.item.priceNow ? fmtPrice(tl.item.priceNow) : "";
    const photo = tl.item ? tl.item.photo : null;
    ctx.clearRect(0, 0, W, H);
    if (t < 2.6) {
      ctx.fillStyle = P.dark; ctx.fillRect(0, 0, W, H);
      const rp = easeOutCubic(clamp(t / 1, 0, 1));
      ctx.fillStyle = P.accent; ctx.beginPath(); ctx.arc(W * 0.95, H * 0.08, 300 * DI_S * rp, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = P.highlight; ctx.save(); ctx.translate(0, H * 0.86); ctx.rotate(-0.12);
      ctx.fillRect(-40 * DI_S, 0, (W + 80 * DI_S) * easeOutCubic(clamp(t / 0.9, 0, 1)), 26 * DI_S); ctx.restore();
      const lay = tl.layout, lh = lay.size * 1.05, y0 = H * 0.46 - (lay.lines.length * lh) / 2 + lh / 2;
      let k = 0;
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = diFont(lay.size);
      lay.lines.forEach(function (line, li) {
        const ws = line.split(" "), widths = ws.map(w => ctx.measureText(w).width), sp = ctx.measureText(" ").width;
        const total = widths.reduce((a, b) => a + b, 0) + sp * (ws.length - 1);
        let x = W / 2 - total / 2;
        ws.forEach(function (w, wi) {
          const p = clamp((t - 0.15 - k * 0.16) / 0.45, 0, 1), sc = easeOutBack(p);
          ctx.save(); ctx.globalAlpha = clamp(p * 2, 0, 1);
          ctx.translate(x + widths[wi] / 2, y0 + li * lh + (1 - p) * 40 * DI_S);
          ctx.scale(sc, sc);
          ctx.fillStyle = (k % 3 === 2) ? P.keyword : P.light;
          ctx.fillText(w, 0, 0); ctx.restore();
          x += widths[wi] + sp; k++;
        });
      });
    } else if (t < 5.8) {
      const u = t - 2.6;
      ctx.fillStyle = P.highlight; ctx.fillRect(0, 0, W, H);
      const circR = 260 * DI_S * easeOutCubic(clamp(u / 0.8, 0, 1));
      ctx.fillStyle = P.dark; ctx.beginPath(); ctx.arc(-40 * DI_S, H * 0.92, circR, 0, Math.PI * 2); ctx.fill();
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      if (tl.topText) {
        ctx.globalAlpha = clamp(u / 0.4, 0, 1); ctx.fillStyle = P.dark;
        diFitFont(ctx, tl.topText.toUpperCase(), 34 * DI_S, W - 80 * DI_S, 18 * DI_S);
        ctx.fillText(tl.topText.toUpperCase(), W / 2, H * 0.11); ctx.globalAlpha = 1;
      }
      const p = easeOutCubic(clamp(u / 0.6, 0, 1));
      ctx.save(); ctx.translate(W / 2, H * 0.38 + (1 - p) * 700 * DI_S); ctx.rotate(-0.07 * (1 - p * 0.4));
      ctx.shadowColor = "rgba(0,0,0,.25)"; ctx.shadowBlur = 30 * DI_S; ctx.shadowOffsetY = 12 * DI_S;
      ctx.fillStyle = "#fff"; roundRectPath(ctx, -214 * DI_S, -214 * DI_S, 428 * DI_S, 428 * DI_S, 26 * DI_S); ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.save(); roundRectPath(ctx, -200 * DI_S, -200 * DI_S, 400 * DI_S, 400 * DI_S, 16 * DI_S); ctx.clip();
      diPhoto(ctx, photo, -200 * DI_S, -200 * DI_S, 400 * DI_S, 400 * DI_S); ctx.restore();
      ctx.restore();
      if (price) {
        const p2 = easeOutBack(clamp((u - 0.7) / 0.5, 0, 1));
        if (p2 > 0) {
          ctx.save(); ctx.translate(W * 0.76, H * 0.585); ctx.scale(p2, p2);
          ctx.fillStyle = P.badge; ctx.beginPath(); ctx.arc(0, 0, 100 * DI_S, 0, Math.PI * 2); ctx.fill();
          let fs = 64 * DI_S; ctx.font = diFont(fs);
          while (ctx.measureText(price).width > 150 * DI_S && fs > 22 * DI_S) { fs -= 2 * DI_S; ctx.font = diFont(fs); }
          ctx.fillStyle = P.badgeText; ctx.fillText(price, 0, 3 * DI_S); ctx.restore();
        }
      }
      const tw = diWrapFit(ctx, tl.title.toUpperCase(), W - 90 * DI_S, [44, 38, 32, 28].map(s => s * DI_S), 2);
      ctx.globalAlpha = clamp((u - 1) / 0.5, 0, 1); ctx.fillStyle = P.dark; ctx.font = diFont(tw.size);
      tw.lines.slice(0, 2).forEach((l, i) => ctx.fillText(l, W / 2, H * 0.79 + i * tw.size * 1.1 + (1 - clamp((u - 1) / 0.5, 0, 1)) * 20 * DI_S));
      // [v8.4] Donde el título pasa sobre el círculo oscuro, se redibuja en color
      // claro (efecto "recorte"): se lee entero, como un diseño de dos tonos.
      ctx.save();
      ctx.beginPath(); ctx.arc(-40 * DI_S, H * 0.92, circR, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = P.light;
      tw.lines.slice(0, 2).forEach((l, i) => ctx.fillText(l, W / 2, H * 0.79 + i * tw.size * 1.1 + (1 - clamp((u - 1) / 0.5, 0, 1)) * 20 * DI_S));
      ctx.restore();
      ctx.globalAlpha = 1;
    } else {
      const v = t - 5.8;
      ctx.fillStyle = P.dark; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = P.accent; ctx.beginPath(); ctx.arc(W * 0.1, H * 0.95, 220 * DI_S, 0, Math.PI * 2); ctx.fill();
      diBag(ctx, W / 2, H * 0.27, 220 * DI_S, clamp(v / 1.1, 0, 1), P.keyword);
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const store = (opts.storeName || "RETADOR").toUpperCase();
      const L = [[tl.close1.toUpperCase(), 80, P.light], [tl.close2.toUpperCase(), 58, P.light], [store, 92, P.keyword]].filter(l => l[0]);
      L.forEach(function (l, i) {
        const p = clamp((v - 0.7 - i * 0.25) / 0.45, 0, 1);
        ctx.save(); ctx.globalAlpha = clamp(p * 2, 0, 1);
        ctx.translate(W / 2, H * 0.5 + i * 100 * DI_S + (1 - p) * 40 * DI_S);
        ctx.scale(easeOutBack(p), easeOutBack(p));
        ctx.fillStyle = l[2]; diFitFont(ctx, l[0], l[1] * DI_S, W - 80 * DI_S, 24 * DI_S); ctx.fillText(l[0], 0, 0); ctx.restore();
      });
      const btnText = (opts.cta || "").trim(); // [v8.4] el botón usa la Frase final de Marca
      if (btnText) {
      const pp = easeOutBack(clamp((v - 1.9) / 0.5, 0, 1)), pulse = 1 + Math.sin(v * 5) * 0.02 * clamp(v - 2.4, 0, 1);
      ctx.save(); ctx.translate(W / 2, H * 0.86); ctx.scale(pp * pulse, pp * pulse);
      ctx.fillStyle = P.highlight; roundRectPath(ctx, -170 * DI_S, -42 * DI_S, 340 * DI_S, 84 * DI_S, 42 * DI_S); ctx.fill();
      ctx.fillStyle = P.dark; diFitFont(ctx, btnText, 34 * DI_S, 300 * DI_S, 18 * DI_S); ctx.fillText(btnText, 0, 3 * DI_S); ctx.restore();
      }
    }
    diWipe(ctx, t, 2.6, P.accent); diWipe(ctx, t, 5.8, P.accent);
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.fillStyle = P.accent; ctx.fillRect(0, H - 8 * DI_S, W * (t / 9.2), 8 * DI_S);
  }
};

// ============================================================
// [v8.2] ESTILO 7 — Desfile (misma estructura y tiempos del anuncio de
// referencia tipo "Hostinger Ecommerce"; con la marca y los productos del
// vendedor, sin logos ni textos de terceros).
//  0,0–1,0 s  tarjeta de marca (color de acento + logo completo)
//  1,0–10,6 s escena oscura: cabecera, titular con palabra que brilla,
//             subtítulo y productos flotando en diagonal (abajo-der → arriba-izq)
//             cada uno con su insignia de color con icono
// 10,3–11,1 s capa de color de acento que lo cubre todo
// 11,3–12,8 s el símbolo se dibuja en contorno → se rellena → sale el nombre
// 12,8–14,0 s cierre quieto
// Usa el color de acento de Marca. No usa temas ni extras (look propio).
// ============================================================
const DS = { total: 14.0, introEnd: 1.0, washIn: 10.3, washFull: 11.1, draw0: 11.3, draw1: 11.9, fill1: 12.2, word1: 12.8,
  spawn0: 1.15, spawnGap: 1.35, spawnLast: 9.4, travel: 4.2 };
const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const DS_FONT = '"DM Sans", Manrope, system-ui, sans-serif';
const _cutoutCache = new WeakMap();
// ¿La foto ya viene sin fondo (PNG con transparencia)? Se mira una vez.
function isCutout(img) {
  if (!img) return false;
  if (_cutoutCache.has(img)) return _cutoutCache.get(img);
  let r = false;
  try {
    const c = document.createElement("canvas"); c.width = 24; c.height = 24;
    const x = c.getContext("2d"); x.drawImage(img, 0, 0, 24, 24);
    const d = x.getImageData(0, 0, 24, 24).data, px = [0, 23, 24 * 23, 24 * 24 - 1];
    r = px.every(i => d[i * 4 + 3] < 200);
  } catch (e) { r = false; }
  _cutoutCache.set(img, r); return r;
}
function mixHex(hex, other, t) {
  const a = parseInt(hex.slice(1), 16), b = parseInt(other.slice(1), 16);
  const ch = (v, s) => (v >> s) & 255;
  const m = s => Math.round(ch(a, s) + (ch(b, s) - ch(a, s)) * t);
  return "rgb(" + m(16) + "," + m(8) + "," + m(0) + ")";
}
// Iconos blancos de línea para las insignias (genéricos, sin marcas de terceros)
function dsIcon(ctx, kind, cx, cy, s) {
  ctx.save();
  ctx.translate(cx, cy); ctx.scale(s / 24, s / 24);
  ctx.strokeStyle = "#fff"; ctx.fillStyle = "#fff"; ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath();
  if (kind === 0) { // carrito
    ctx.moveTo(-10, -8); ctx.lineTo(-7, -8); ctx.lineTo(-4, 5); ctx.lineTo(7, 5); ctx.lineTo(9, -4); ctx.lineTo(-5.5, -4); ctx.stroke();
    ctx.beginPath(); ctx.arc(-3, 9, 1.6, 0, 7); ctx.arc(6, 9, 1.6, 0, 7); ctx.fill();
  } else if (kind === 1) { // corazón
    ctx.moveTo(0, 8); ctx.bezierCurveTo(-12, 0, -9, -10, 0, -4); ctx.bezierCurveTo(9, -10, 12, 0, 0, 8); ctx.stroke();
  } else if (kind === 2) { // camión
    ctx.rect(-11, -6, 13, 10); ctx.moveTo(2, -2); ctx.lineTo(7, -2); ctx.lineTo(10, 1); ctx.lineTo(10, 4); ctx.lineTo(2, 4); ctx.stroke();
    ctx.beginPath(); ctx.arc(-6, 7, 2, 0, 7); ctx.arc(6, 7, 2, 0, 7); ctx.fill();
  } else if (kind === 3) { // estrella
    for (let i = 0; i < 10; i++) { const r = i % 2 ? 4.2 : 10, a = -Math.PI / 2 + i * Math.PI / 5; ctx[i ? "lineTo" : "moveTo"](Math.cos(a) * r, Math.sin(a) * r); }
    ctx.closePath(); ctx.stroke();
  } else if (kind === 4) { // etiqueta
    ctx.moveTo(-9, -9); ctx.lineTo(1, -9); ctx.lineTo(10, 0); ctx.lineTo(0, 10); ctx.lineTo(-9, 1); ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.arc(-4, -4, 1.8, 0, 7); ctx.fill();
  } else { // burbuja de chat
    roundRectPath(ctx, -10, -8, 20, 14, 5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-4, 6); ctx.lineTo(-6, 10); ctx.lineTo(0, 6); ctx.stroke();
  }
  ctx.restore();
}
// Símbolo de la tienda: cuadrado redondeado con la inicial.
// drawP 0→1 = contorno dibujándose; fillP 0→1 = relleno.
function dsMark(ctx, cx, cy, size, drawP, fillP, accent, name) {
  const r = size * 0.24, x = cx - size / 2, y = cy - size / 2;
  ctx.save();
  if (drawP > 0) {
    const per = 4 * size;
    ctx.setLineDash([per, per]); ctx.lineDashOffset = per * (1 - drawP);
    ctx.strokeStyle = "#fff"; ctx.lineWidth = size * 0.06; ctx.lineJoin = "round";
    roundRectPath(ctx, x, y, size, size, r); ctx.stroke();
    ctx.setLineDash([]);
  }
  if (fillP > 0) {
    ctx.globalAlpha = fillP;
    ctx.fillStyle = "#fff"; roundRectPath(ctx, x, y, size, size, r); ctx.fill();
    ctx.fillStyle = accent; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "700 " + Math.round(size * 0.62) + "px " + DS_FONT;
    ctx.fillText((name || "R").trim().charAt(0).toUpperCase(), cx, cy + size * 0.03);
  } else if (drawP > 0.6) {
    ctx.globalAlpha = (drawP - 0.6) / 0.4 * 0.9;
    ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "700 " + Math.round(size * 0.62) + "px " + DS_FONT;
    ctx.fillText((name || "R").trim().charAt(0).toUpperCase(), cx, cy + size * 0.03);
  }
  ctx.restore();
}
// Logo de cierre: símbolo + nombre que sale deslizándose a su derecha.
function dsLogo(ctx, cx, cy, drawP, fillP, wordP, accent, name) {
  const store = (name || "RETADOR").toUpperCase();
  const mark = 150, gap = 34;
  let fs = 108; ctx.font = "700 " + fs + "px " + DS_FONT;
  while (ctx.measureText(store).width > W * 0.62 && fs > 40) { fs -= 4; ctx.font = "700 " + fs + "px " + DS_FONT; }
  const tw = ctx.measureText(store).width;
  const e = easeOutCubic(clamp(wordP, 0, 1));
  const groupW = mark + (gap + tw) * e;
  const markX = cx - groupW / 2 + mark / 2;
  dsMark(ctx, markX, cy, mark, drawP, fillP, accent, name);
  if (e > 0) {
    const tx = markX + mark / 2 + gap;
    ctx.save();
    ctx.beginPath(); ctx.rect(tx - 4, cy - fs, (tw + 8) * e, fs * 2); ctx.clip();
    ctx.fillStyle = "#fff"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.font = "700 " + fs + "px " + DS_FONT;
    ctx.fillText(store, tx - (1 - e) * 40, cy + fs * 0.04);
    ctx.restore();
  }
}
function dsBrandBg(ctx, accent) {
  ctx.fillStyle = accent; ctx.fillRect(0, 0, W, H);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "rgba(0,0,0,0.16)"); g.addColorStop(0.35, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(255,255,255,0.05)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
// [v8.4] Colores de texto según fondo (oscuro = el original; claro = nuevo)
const DS_INK = { oscuro: { text: "#FFFFFF", sub: "#FFFFFF", mark: "#FFFFFF", markInk: "#1b1c20", div: "rgba(255,255,255,0.7)" },
  claro: { text: "#17171B", sub: "#2A2B30", mark: "#17171B", markInk: "#FFFFFF", div: "rgba(23,23,27,0.45)" } };
function dsSceneBg(ctx, light) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  if (light) {
    g.addColorStop(0, "#F7F5F0"); g.addColorStop(0.45, "#EFEDE7"); g.addColorStop(0.78, "#DDE1E9"); g.addColorStop(1, "#C3CCDB");
  } else {
    g.addColorStop(0, "#1b1c20"); g.addColorStop(0.42, "#24262b"); g.addColorStop(0.72, "#343945");
    g.addColorStop(0.9, "#56607a"); g.addColorStop(1, "#8c9ab6");
  }
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  drawGrain(ctx, 0, 0, W, H, light ? 0.018 : 0.03);
}
function dsHeader(ctx, name, label, alpha, ink) {
  ink = ink || DS_INK.oscuro;
  if (alpha <= 0) return;
  const store = (name || "RETADOR").toUpperCase(), y = H * 0.10;
  ctx.save(); ctx.globalAlpha = alpha; ctx.textBaseline = "middle";
  const mark = 52, gap = 18;
  ctx.font = "700 44px " + DS_FONT; const w1 = ctx.measureText(store).width;
  ctx.font = "400 44px " + DS_FONT; const w2 = label ? ctx.measureText(label).width : 0;
  const div = label ? 46 : 0;
  const total = mark + gap + w1 + div + w2;
  let x = W / 2 - total / 2;
  ctx.fillStyle = ink.mark; roundRectPath(ctx, x, y - mark / 2, mark, mark, 12); ctx.fill();
  ctx.fillStyle = ink.markInk; ctx.textAlign = "center"; ctx.font = "700 32px " + DS_FONT;
  ctx.fillText(store.charAt(0), x + mark / 2, y + 2);
  x += mark + gap; ctx.textAlign = "left"; ctx.fillStyle = ink.text;
  ctx.font = "700 44px " + DS_FONT; ctx.fillText(store, x, y + 2); x += w1;
  if (label) {
    ctx.fillStyle = ink.div; ctx.fillRect(x + 22, y - 20, 2.5, 40);
    ctx.fillStyle = ink.text; ctx.font = "400 44px " + DS_FONT; ctx.fillText(label, x + div, y + 2);
  }
  ctx.restore();
}
function dsHeadline(ctx, text, keyword, accent, alpha, glowP, scale, ink, light) {
  ink = ink || DS_INK.oscuro;
  if (!text || alpha <= 0) return;
  const norm = s => s.toLowerCase().replace(/[.,!?¡¿:;"'()]/g, "");
  const kw = (keyword || "").trim().split(/\s+/).map(norm).filter(Boolean);
  const words = text.trim().split(/\s+/);
  let fs = 172, lines;
  const layout = function () {
    ctx.font = "700 " + fs + "px " + DS_FONT;
    const sp = ctx.measureText(" ").width; lines = []; let cur = [], w = 0;
    words.forEach(function (wd) { const ww = ctx.measureText(wd).width, add = cur.length ? sp + ww : ww;
      if (cur.length && w + add > W * 0.88) { lines.push({ ws: cur, w: w }); cur = [wd]; w = ww; } else { cur.push(wd); w += add; } });
    if (cur.length) lines.push({ ws: cur, w: w });
    return sp;
  };
  let sp = layout();
  while ((lines.length > 2 || lines.some(l => l.w > W * 0.9)) && fs > 70) { fs -= 6; sp = layout(); }
  const lh = fs * 1.02, top = H * 0.25 - ((lines.length - 1) * lh) / 2;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(W / 2, top); ctx.scale(scale, scale); ctx.translate(-W / 2, -top);
  ctx.textBaseline = "middle"; ctx.textAlign = "left";
  ctx.font = "700 " + fs + "px " + DS_FONT;
  lines.forEach(function (ln, li) {
    let x = W / 2 - ln.w / 2; const y = top + li * lh;
    ln.ws.forEach(function (wd) {
      const ww = ctx.measureText(wd).width, hit = kw.length && kw.indexOf(norm(wd)) >= 0;
      if (hit && glowP > 0 && light) {
        ctx.save();
        ctx.shadowColor = accent; ctx.shadowBlur = 30 * glowP; ctx.fillStyle = accent;
        ctx.fillText(wd, x, y);
        ctx.restore();
      } else if (hit && glowP > 0) {
        ctx.save();
        ctx.shadowColor = accent; ctx.shadowBlur = 46 * glowP; ctx.fillStyle = "#fff";
        ctx.fillText(wd, x, y); ctx.fillText(wd, x, y);
        ctx.shadowBlur = 0; ctx.globalAlpha = alpha * 0.55 * glowP;
        ctx.strokeStyle = mixHex(accent, "#FFFFFF", 0.35); ctx.lineWidth = 3; ctx.strokeText(wd, x, y);
        ctx.restore();
      } else {
        ctx.fillStyle = ink.text; ctx.fillText(wd, x, y);
      }
      x += ww + sp;
    });
  });
  ctx.restore();
}
function dsSubtitle(ctx, text, alpha, rise, ink) {
  if (!text || alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha * 0.95; ctx.fillStyle = (ink || DS_INK.oscuro).sub;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  let fs = 76; ctx.font = "500 " + fs + "px " + DS_FONT;
  const words = text.trim().split(/\s+/); let lines;
  const lay = function () { lines = []; let cur = ""; words.forEach(function (w) { const t = cur ? cur + " " + w : w;
    if (ctx.measureText(t).width > W * 0.78 && cur) { lines.push(cur); cur = w; } else cur = t; }); if (cur) lines.push(cur); };
  lay(); while (lines.length > 2 && fs > 44) { fs -= 4; ctx.font = "500 " + fs + "px " + DS_FONT; lay(); }
  const lh = fs * 1.2, y0 = H * 0.36 + rise;
  lines.slice(0, 3).forEach((l, i) => ctx.fillText(l, W / 2, y0 + i * lh));
  ctx.restore();
}
function dsProduct(ctx, item, cx, cy, size, rot, alpha) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(cx, cy); ctx.rotate(rot);
  ctx.shadowColor = dsProduct.light ? "rgba(20,24,40,0.22)" : "rgba(0,0,0,0.45)"; ctx.shadowBlur = size * 0.10; ctx.shadowOffsetY = size * 0.05;
  if (item.photo) {
    const img = item.photo;
    if (isCutout(img)) {
      const ir = img.naturalWidth / img.naturalHeight;
      const w = ir >= 1 ? size : size * ir, h = ir >= 1 ? size / ir : size;
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
    } else {
      const s = size * 0.86;
      ctx.fillStyle = "#fff"; roundRectPath(ctx, -s / 2 - 8, -s / 2 - 8, s + 16, s + 16, s * 0.1); ctx.fill();
      ctx.shadowColor = "transparent";
      drawPhotoCover(ctx, img, -s / 2, -s / 2, s, s, s * 0.08);
    }
  } else {
    ctx.font = Math.round(size * 0.82) + "px " + EMOJI_FONT;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(item.icon || "🛍️", 0, size * 0.04);
  }
  ctx.restore();
}
function dsBadge(ctx, cx, cy, s, accent, iconKind, alpha) {
  if (s <= 1 || alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.shadowColor = accent; ctx.shadowBlur = s * 0.55;
  const g = ctx.createLinearGradient(0, cy - s / 2, 0, cy + s / 2);
  g.addColorStop(0, mixHex(accent, "#FFFFFF", 0.18)); g.addColorStop(1, accent);
  ctx.fillStyle = g; roundRectPath(ctx, cx - s / 2, cy - s / 2, s, s, s * 0.24); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255,255,255,0.22)"; ctx.lineWidth = Math.max(1, s * 0.02);
  roundRectPath(ctx, cx - s / 2, cy - s / 2, s, s, s * 0.24); ctx.stroke();
  dsIcon(ctx, iconKind, cx, cy, s * 0.52);
  ctx.restore();
}

// [v8.3] Recorridos de los productos. "diagonal" = el original de v8.2.
// "curva" = como el anuncio de referencia: suben desde abajo, giran hacia la
// izquierda y salen por arriba a la izquierda (curva de Bézier cúbica).
function dsPath(id, p, k) {
  const vary = ((k % 3) - 1) * 0.06;
  if (id === "curva") {
    const e = p * 0.8 + easeInOutCubic(p) * 0.2, u = 1 - e;
    const P = [[0.66, 1.12], [0.66, 0.64], [0.42, 0.50], [-0.28, 0.40]];
    const bx = u * u * u * P[0][0] + 3 * u * u * e * P[1][0] + 3 * u * e * e * P[2][0] + e * e * e * P[3][0];
    const by = u * u * u * P[0][1] + 3 * u * u * e * P[1][1] + 3 * u * e * e * P[2][1] + e * e * e * P[3][1];
    const turn = clamp((p - 0.3) / 0.55, 0, 1), tt = turn * turn * (3 - 2 * turn);
    return { x: W * bx, y: H * by, size: W * 0.60 * (1.0 - 0.5 * p), rot: -0.08 - 0.38 * tt + vary };
  }
  const pe = p * 0.85 + easeOutCubic(p) * 0.15;
  return { x: W * (0.84 - 1.04 * pe), y: H * (1.02 - 0.58 * p) - Math.sin(Math.PI * p) * H * 0.03,
    size: W * 0.58 * (1.0 - 0.5 * p), rot: -0.30 + 0.42 * p + vary };
}

const StyleDesfile = {
  id: "desfile", icon: "✨", label: "Desfile",
  description: "Tarjeta de marca, titular con brillo y tus productos desfilando en diagonal con insignias de color. Cierre con tu logo dibujándose.",
  buildTimeline: function (d) {
    const items = (d.items || []).filter(Boolean);
    const spawns = [];
    for (let k = 0, t = DS.spawn0; t <= DS.spawnLast; k++, t += DS.spawnGap) spawns.push({ t: t, item: items[k % Math.max(1, items.length)], icon: k % 6, k: k });
    return { d: d, spawns: spawns, total: Math.round(DS.total * FPS) };
  },
  sfxEvents: function (tl, opts) {
    const ev = [{ t: DS.introEnd - 0.12, type: "whoosh" }];
    tl.spawns.forEach(s => ev.push({ t: s.t + 0.35, type: "pop", cat: "item" }));
    ev.push({ t: DS.washIn - 0.2, type: "riser" }, { t: DS.washFull, type: "impact" }, { t: DS.draw1, type: "chime" });
    if (opts && (opts.cta || "").trim()) ev.push({ t: DS.word1 + 0.15, type: "pop" });
    return ev;
  },
  renderFrame: function (ctx, frameIndex, tl, opts) {
    const frame = wrapFrame(frameIndex, tl.total), t = frame / FPS, d = tl.d;
    const accent = opts.accentColor, name = opts.storeName;
    ctx.clearRect(0, 0, W, H);
    const light = d.bg === "claro", ink = DS_INK[light ? "claro" : "oscuro"];
    if (t < DS.washFull) {
      dsSceneBg(ctx, light);
      // productos: los más lejanos (más avanzados) primero
      const live = [];
      tl.spawns.forEach(function (s) { const p = (t - s.t) / DS.travel; if (p > 0 && p < 1 && s.item) live.push({ s: s, p: p }); });
      live.sort((a, b) => b.p - a.p);
      dsProduct.light = light;
      live.forEach(function (o) {
        const p = o.p, v = dsPath(d.path, p, o.s.k), mir = d.dir === "der";
        const x = mir ? W - v.x : v.x, y = v.y, size = v.size, rot = mir ? -v.rot : v.rot;
        const a = clamp(p / 0.07, 0, 1) * clamp((1 - p) / 0.14, 0, 1);
        dsProduct(ctx, o.s.item, x, y, size, rot, a);
        const bp = easeOutBack(clamp((p - 0.04) / 0.10, 0, 1));
        const bob = Math.sin((t + o.s.k) * 2.4) * size * 0.02;
        dsBadge(ctx, x + size * 0.36 * (mir ? -1 : 1), y - size * 0.30 + bob, W * 0.16 * (1 - 0.5 * p) * bp, accent, o.s.icon, a);
      });
      // cabecera y textos
      const txtOut = 1 - clamp((t - (DS.washIn - 0.1)) / 0.6, 0, 1);
      dsHeader(ctx, name, d.label, clamp((t - 0.9) / 0.25, 0, 1) * txtOut, ink);
      const hIn = clamp((t - 1.0) / 0.4, 0, 1);
      dsHeadline(ctx, d.headline, d.keyword, accent, easeOutCubic(hIn) * txtOut, easeOutCubic(clamp((t - 1.6) / 0.6, 0, 1)), 1.04 - 0.04 * easeOutCubic(hIn), ink, light);
      const sIn = clamp((t - 1.6) / 0.4, 0, 1);
      dsSubtitle(ctx, d.subtitle, easeOutCubic(sIn) * txtOut, (1 - easeOutCubic(sIn)) * 24, ink);
      // capa de color de marca
      if (t > DS.washIn) {
        ctx.save(); ctx.globalAlpha = easeInOutCubic(clamp((t - DS.washIn) / (DS.washFull - DS.washIn), 0, 1));
        dsBrandBg(ctx, accent); ctx.restore();
      }
      // tarjeta de marca inicial
      if (t < DS.introEnd + 0.15) {
        ctx.save(); ctx.globalAlpha = t < DS.introEnd ? 1 : 1 - (t - DS.introEnd) / 0.15;
        dsBrandBg(ctx, accent); dsLogo(ctx, W / 2, H * 0.5, 1, 1, 1, accent, name); ctx.restore();
      }
    } else {
      dsBrandBg(ctx, accent);
      dsLogo(ctx, W / 2, H * 0.5,
        clamp((t - DS.draw0) / (DS.draw1 - DS.draw0), 0, 1),
        clamp((t - DS.draw1) / (DS.fill1 - DS.draw1), 0, 1),
        clamp((t - DS.fill1) / (DS.word1 - DS.fill1), 0, 1), accent, name);
      // [v8.4] Frase final (Marca) en botón tipo píldora bajo el logo
      const cta = (opts.cta || "").trim(), cp = clamp((t - (DS.word1 + 0.05)) / 0.4, 0, 1);
      if (cta && cp > 0) {
        ctx.save();
        ctx.font = "500 46px " + DS_FONT;
        const tw = Math.min(ctx.measureText(cta).width, W * 0.7), bw = tw + 96, bh = 96, by = H * 0.5 + 170;
        const sc = easeOutBack(cp);
        ctx.globalAlpha = clamp(cp * 1.6, 0, 1);
        ctx.translate(W / 2, by); ctx.scale(sc, sc);
        ctx.fillStyle = "rgba(255,255,255,0.14)"; roundRectPath(ctx, -bw / 2, -bh / 2, bw, bh, bh / 2); ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.85)"; ctx.lineWidth = 3; roundRectPath(ctx, -bw / 2, -bh / 2, bw, bh, bh / 2); ctx.stroke();
        ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        let fs = 46; while (ctx.measureText(cta).width > W * 0.7 && fs > 26) { fs -= 2; ctx.font = "500 " + fs + "px " + DS_FONT; }
        ctx.fillText(cta, 0, 2);
        ctx.restore();
      }
    }
  }
};

// ============================================================
// [v8.5] ESTILO 8 — Vitrina (estructura y tiempos del anuncio de referencia
// tipo "Shopify"; con la marca y productos del vendedor, sin recursos de
// terceros). 15,2 s a 1×:
//  0,0–1,3  nube de partículas de colores del producto + frase de entrada
//  1,3–2,5  segunda frase; las partículas empiezan a juntarse
//  2,5–4,9  el producto aparece desde la nube y un anillo de texto gira en 3D
//  4,9–11,0 [v8.6] detrás: muro de fotos de todos los productos moviéndose despacio.
//  4,9–6,6  tarjeta de cristal (2º producto)
//  6,6–8,1  banner promocional (3er producto)
//  8,1–9,7  móvil con la tienda: catálogo en 2 columnas desplazándose
//  9,7–11,0 "Productos destacados": hasta 4 productos en cascada
// 11,0–11,7 la foto con esquinas redondeadas se expande a pantalla completa
// 11,7–13,2 foto a pantalla completa con zoom suave
// 13,2–15,2 logo + botón con la Frase final
// (El humo 3D y las escenas grabadas del anuncio original no se pueden hacer
//  con plantillas: se sustituyen por partículas y zoom sobre las fotos.)
// ============================================================
const VT = { phrase: 1.3, form: 2.5, ring0: 3.0, c1: 4.9, c2: 6.6, c3: 8.1, c4: 9.7, exp: 11.0, full: 11.7, logo: 13.2, total: 15.2 };
const _colCache = new WeakMap(), _colCacheE = {};
function toHex(c) {
  if (/^#[0-9a-f]{6}$/i.test(c)) return c;
  const m = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(c || "");
  return m ? "#" + [m[1], m[2], m[3]].map(n => (+n).toString(16).padStart(2, "0")).join("") : "#F26B0F";
}
// Colores dominantes del producto (foto o emoji) para la nube de partículas.
function productColors(item, accent) {
  const key = item && item.photo ? item.photo : null, ek = item && !item.photo ? (item.icon || "") : null;
  if (key && _colCache.has(key)) return _colCache.get(key);
  if (ek != null && _colCacheE[ek]) return _colCacheE[ek];
  let out = [];
  try {
    const c = document.createElement("canvas"); c.width = 16; c.height = 16;
    const x = c.getContext("2d");
    if (key) x.drawImage(key, 0, 0, 16, 16);
    else { x.font = "14px " + EMOJI_FONT; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(ek || "🛍️", 8, 9); }
    const d = x.getImageData(0, 0, 16, 16).data, bins = [];
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2], a = d[i + 3];
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      if (a < 128 || mx < 30 || mn > 232) continue;
      const sat = mx ? (mx - mn) / mx : 0;
      let h = 0;
      if (mx !== mn) { if (mx === r) h = ((g - b) / (mx - mn)) % 6; else if (mx === g) h = (b - r) / (mx - mn) + 2; else h = (r - g) / (mx - mn) + 4; }
      const bi = ((Math.round(h) % 6) + 6) % 6, w = 0.2 + sat;
      if (!bins[bi]) bins[bi] = { r: 0, g: 0, b: 0, w: 0 };
      bins[bi].r += r * w; bins[bi].g += g * w; bins[bi].b += b * w; bins[bi].w += w;
    }
    out = bins.filter(Boolean).sort((p, q) => q.w - p.w).slice(0, 2).map(v =>
      "#" + [v.r, v.g, v.b].map(n => Math.round(n / v.w).toString(16).padStart(2, "0")).join(""));
  } catch (e) { out = []; }
  if (!out.length) out = [accent];
  if (out.length < 2) out.push(toHex(mixHex(out[0], "#FFFFFF", 0.4)));
  if (key) _colCache.set(key, out); else _colCacheE[ek] = out;
  return out;
}
const _sprites = {};
function softSprite(color) {
  if (_sprites[color]) return _sprites[color];
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const x = c.getContext("2d");
  // desvanecido real hacia transparente del mismo color
  const g2 = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g2.addColorStop(0, hexToRgba(color, 0.95)); g2.addColorStop(0.5, hexToRgba(color, 0.55)); g2.addColorStop(1, hexToRgba(color, 0));
  x.fillStyle = g2; x.fillRect(0, 0, 128, 128);
  _sprites[color] = c; return c;
}
function vtSeeded(n, seed) { const r = seededRand(seed), a = []; for (let i = 0; i < n; i++) a.push([r(), r(), r(), r(), r(), r()]); return a; }
const VT_PARTS = vtSeeded(230, 99), VT_STARS = vtSeeded(70, 7);
function vtName(it) { return ((it && (it.name || (it.product && it.product.title))) || "Tu producto").trim(); }
function vtPrice(it) { return it && it.priceNow ? fmtPrice(it.priceNow) : ""; }
function vtStars(ctx, x, y, s, color) {
  ctx.save(); ctx.fillStyle = color;
  for (let k = 0; k < 5; k++) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const r = i % 2 ? s * 0.22 : s * 0.5, a = -Math.PI / 2 + i * Math.PI / 5; ctx[i ? "lineTo" : "moveTo"](x + k * s * 1.15 + Math.cos(a) * r, y + Math.sin(a) * r); }
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
// Caja con la imagen del producto (foto sin fondo = contenida; con fondo = cubre; emoji = centrado)
function vtItemBox(ctx, it, x, y, w, h, r, bg) {
  ctx.save();
  roundRectPath(ctx, x, y, w, h, r); ctx.fillStyle = bg || "#FFFFFF"; ctx.fill();
  roundRectPath(ctx, x, y, w, h, r); ctx.clip();
  if (it && it.photo) {
    const img = it.photo;
    if (isCutout(img)) {
      const ir = img.naturalWidth / img.naturalHeight, bw = w * 0.84, bh = h * 0.84;
      const dw = ir > bw / bh ? bw : bh * ir, dh = ir > bw / bh ? bw / ir : bh;
      ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
    } else drawPhotoCover(ctx, img, x, y, w, h, 0);
  } else {
    ctx.font = Math.round(Math.min(w, h) * 0.6) + "px " + EMOJI_FONT; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText((it && it.icon) || "🛍️", x + w / 2, y + h / 2 + Math.min(w, h) * 0.03);
  }
  ctx.restore();
}
function vtText(ctx, text, x, y, size, weight, color, align, maxW) {
  ctx.save(); ctx.fillStyle = color; ctx.textAlign = align || "center"; ctx.textBaseline = "middle";
  let fs = size; ctx.font = weight + " " + fs + "px " + DS_FONT;
  if (maxW) while (ctx.measureText(text).width > maxW && fs > 18) { fs -= 2; ctx.font = weight + " " + fs + "px " + DS_FONT; }
  ctx.fillText(text, x, y); ctx.restore();
}
function vtWrapLines(ctx, text, maxW, size, weight, maxLines) {
  let fs = size, lines;
  const lay = () => { ctx.font = weight + " " + fs + "px " + DS_FONT; lines = []; let cur = "";
    text.split(/\s+/).forEach(w => { const t = cur ? cur + " " + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; });
    if (cur) lines.push(cur); };
  lay(); while (lines.length > maxLines && fs > 30) { fs -= 4; lay(); }
  return { lines: lines, fs: fs };
}
function vtCardAnim(t, a, b) {
  const p = clamp((t - a) / 0.45, 0, 1), q = clamp((t - (b - 0.3)) / 0.3, 0, 1);
  return { on: t >= a && t < b, alpha: easeOutCubic(p) * (1 - q), scale: 0.9 + 0.1 * easeOutBack(p) + 0.05 * q, dy: (1 - easeOutCubic(p)) * 70 };
}
function vtIntroBg(ctx, t, cols) {
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, mixHex(cols[0], "#FFFFFF", 0.55)); g.addColorStop(0.5, mixHex(cols[0], "#1b2030", 0.6)); g.addColorStop(1, "#0a0d14");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.fillStyle = "#FFFFFF";
  VT_STARS.forEach(function (s) {
    const x = s[0] * W, y = s[1] * H, dark = clamp(x / W + y / H - 0.95, 0, 1);
    if (dark <= 0) return;
    ctx.globalAlpha = dark * (0.35 + 0.45 * (0.5 + 0.5 * Math.sin(t * (1 + s[2] * 2) + s[3] * 6)));
    ctx.beginPath(); ctx.arc(x, y, 1.5 + s[4] * 2.5, 0, 7); ctx.fill();
  });
  ctx.restore();
  drawGrain(ctx, 0, 0, W, H, 0.025);
}
function vtStudioBg(ctx, t, cols, accent) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, mixHex(cols[0], "#F1F2EE", 0.8)); g.addColorStop(0.55, mixHex(cols[0], "#A7B1AA", 0.72)); g.addColorStop(1, mixHex(cols[0], "#4F5A54", 0.7));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.globalAlpha = 0.35; ctx.drawImage(softSprite(cols[0]), W * (0.1 + 0.05 * Math.sin(t * 0.4)) - W * 0.6, H * 0.15 - W * 0.6, W * 1.2, W * 1.2);
  ctx.globalAlpha = 0.25; ctx.drawImage(softSprite(toHex(accent)), W * (0.85 + 0.05 * Math.cos(t * 0.35)) - W * 0.55, H * 0.8 - W * 0.55, W * 1.1, W * 1.1);
  ctx.restore();
  drawGrain(ctx, 0, 0, W, H, 0.025);
}
function vtGlass(ctx, x, y, w, h, r) {
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.18)"; ctx.shadowBlur = 50; ctx.shadowOffsetY = 18;
  ctx.fillStyle = "rgba(255,255,255,0.30)"; roundRectPath(ctx, x, y, w, h, r); ctx.fill();
  ctx.shadowColor = "transparent";
  const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, "rgba(255,255,255,0.28)"); g.addColorStop(1, "rgba(255,255,255,0.06)");
  ctx.fillStyle = g; roundRectPath(ctx, x, y, w, h, r); ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.65)"; ctx.lineWidth = 2.5; roundRectPath(ctx, x, y, w, h, r); ctx.stroke();
  ctx.restore();
}
function vtMark(ctx, cx, cy, size, name, fg, ink) {
  ctx.save(); ctx.fillStyle = fg; roundRectPath(ctx, cx - size / 2, cy - size / 2, size, size, size * 0.26); ctx.fill();
  ctx.fillStyle = ink; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = "700 " + Math.round(size * 0.6) + "px " + DS_FONT;
  ctx.fillText(((name || "R").trim().charAt(0) || "R").toUpperCase(), cx, cy + size * 0.03); ctx.restore();
}
function vtBrandLine(ctx, cx, cy, name, markSize, fs, color, markInk) {
  const store = (name || "RETADOR").trim();
  ctx.save(); ctx.font = "700 " + fs + "px " + DS_FONT;
  const tw = Math.min(ctx.measureText(store).width, W * 0.66), gap = markSize * 0.32, tot = markSize + gap + tw;
  vtMark(ctx, cx - tot / 2 + markSize / 2, cy, markSize, store, color, markInk);
  vtText(ctx, store, cx - tot / 2 + markSize + gap, cy + 2, fs, 700, color, "left", W * 0.66);
  ctx.restore();
}
function vtRing(ctx, text, cx, cy, t, alpha, front) {
  if (!text || alpha <= 0) return;
  const rx = W * 0.47, ry = W * 0.075, rep = text.toUpperCase() === text ? text + "  •  " : text + "  •  ";
  ctx.save(); ctx.font = "500 76px " + DS_FONT; ctx.textBaseline = "middle"; ctx.textAlign = "center";
  const repW = ctx.measureText(rep).width, circ = 2 * Math.PI * rx * 0.92, n = Math.max(1, Math.round(circ / repW));
  const full = rep.repeat(n), chars = full.split(""), widths = chars.map(ch => ctx.measureText(ch).width), totW = widths.reduce((a, b) => a + b, 0);
  let acc = 0;
  chars.forEach(function (ch, i) {
    const th = ((acc + widths[i] / 2) / totW) * Math.PI * 2 + t * 0.85;
    acc += widths[i];
    const z = Math.cos(th);
    if ((z >= 0) !== front || ch === " ") return;
    const x = cx + rx * Math.sin(th), y = cy + ry * z;
    ctx.save(); ctx.translate(x, y); ctx.scale(Math.max(0.08, Math.abs(z)) * (z < 0 ? -1 : 1), 0.86 + 0.14 * z);
    ctx.globalAlpha = alpha * (z >= 0 ? 1 : 0.38);
    ctx.fillStyle = "#FFFFFF"; ctx.shadowColor = "rgba(0,0,0,0.25)"; ctx.shadowBlur = 12;
    ctx.fillText(ch, 0, 0); ctx.restore();
  });
  ctx.restore();
}

// [v8.6] Muro de fotos inclinado que se desplaza despacio detrás de las tarjetas
// (como el collage en movimiento del anuncio de referencia). Usa TODOS los
// productos, alternados, y un velo claro para que las tarjetas resalten.
// Rendimiento: el muro se dibuja UNA vez (a media resolución) por línea de
// tiempo y luego solo se desplaza; así no se redibujan ~60 fotos por fotograma.
const VT_PAD = 700;
function vtCollageCache(tl, items) {
  if (tl._collage) return tl._collage;
  const k = 0.5, c = document.createElement("canvas");
  c.width = Math.ceil((W + 2 * VT_PAD) * k); c.height = Math.ceil((H + 2 * VT_PAD) * k);
  const x = c.getContext("2d");
  x.setTransform(k, 0, 0, k, VT_PAD * k, VT_PAD * k);
  const tile = W * 0.34, gap = 26, step = tile + gap, n = items.length;
  for (let r = -Math.ceil(VT_PAD / step) - 1; r < Math.ceil((H + VT_PAD) / step) + 1; r++) {
    for (let col = -Math.ceil(VT_PAD / step) - 1; col < Math.ceil((W + VT_PAD) / step) + 1; col++) {
      const tx = col * step + (r % 2 ? step * 0.5 : 0), ty = r * step;
      const it = items[(((r * 3 + col) % n) + n) % n];
      x.fillStyle = "rgba(0,0,0,0.07)"; roundRectPath(x, tx + 4, ty + 8, tile, tile, 26); x.fill();
      vtItemBox(x, it, tx, ty, tile, tile, 26, "#FFFFFF");
    }
  }
  tl._collage = c; return c;
}
function vtCollage(ctx, t, tl, items, cols, alpha) {
  if (alpha <= 0) return;
  const cache = vtCollageCache(tl, items), dt = Math.max(0, t - VT.c1);
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.translate(W / 2, H / 2); ctx.rotate(-0.21); ctx.translate(-W / 2, -H / 2);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(cache, -VT_PAD + dt * 20, -VT_PAD - dt * 46, W + 2 * VT_PAD, H + 2 * VT_PAD);
  ctx.restore();
  ctx.save(); ctx.globalAlpha = alpha;
  const v = ctx.createLinearGradient(0, 0, 0, H);
  v.addColorStop(0, hexToRgba(toHex(mixHex(cols[0], "#FFFFFF", 0.8)), 0.55)); v.addColorStop(0.5, "rgba(255,255,255,0.35)"); v.addColorStop(1, hexToRgba(toHex(mixHex(cols[0], "#2b312d", 0.6)), 0.55));
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

const StyleVitrina = {
  id: "vitrina", icon: "🛍️", label: "Vitrina",
  description: "Tu producto aparece desde una nube de color con un anillo de texto girando, luego tarjetas, móvil con la ficha y foto a pantalla completa. Cierre con logo y botón.",
  buildTimeline: function (d) {
    const items = (d.items || []).filter(Boolean).slice(0, 6);
    return { d: d, items: items, hero: items[0] || { icon: "🛍️" }, total: Math.round(VT.total * FPS) };
  },
  sfxEvents: function (tl, opts) {
    const ev = [{ t: VT.phrase - 0.08, type: "whoosh" }, { t: VT.form - 0.1, type: "riser" }, { t: 3.3, type: "impact" }, { t: 3.4, type: "pop", cat: "item" }];
    [VT.c1, VT.c2, VT.c3, VT.c4, VT.exp].forEach(a => ev.push({ t: a - 0.06, type: "whoosh" }));
    for (let k = 0; k < Math.min(4, Math.max(1, tl.items.length)); k++) ev.push({ t: VT.c4 + 0.2 + k * 0.12, type: "pop", cat: "item" });
    ev.push({ t: VT.logo + 0.15, type: "chime" });
    if (opts && (opts.cta || "").trim()) ev.push({ t: VT.logo + 0.6, type: "pop" });
    return ev;
  },
  renderFrame: function (ctx, frameIndex, tl, opts) {
    const frame = wrapFrame(frameIndex, tl.total), t = frame / FPS, d = tl.d, hero = tl.hero;
    const accent = opts.accentColor, name = opts.storeName, cta = (opts.cta || "").trim();
    const cols = productColors(hero, accent), pal = [cols[0], cols[1], toHex(mixHex(cols[0], "#FFFFFF", 0.5)), toHex(accent)];
    const cx = W / 2, cy = H * 0.5;
    ctx.clearRect(0, 0, W, H);
    if (t < VT.c1) {
      // ----- nube, frases, producto y anillo -----
      vtIntroBg(ctx, t, cols);
      const conv = easeInOutCubic(clamp((t - 2.4) / 1.2, 0, 1)), fadeP = 1 - clamp((t - 3.2) / 0.9, 0, 1);
      const burst = 1.25 - 0.25 * easeOutCubic(clamp(t / 0.7, 0, 1));
      if (fadeP > 0) {
        ctx.save();
        VT_PARTS.forEach(function (p) {
          const r = (0.06 + Math.pow(p[0], 0.7) * 0.40) * W * burst * (1 - 0.86 * conv);
          const ang = p[1] * Math.PI * 2 + (p[2] - 0.5) * 1.1 * t;
          const x = cx + Math.cos(ang) * r + Math.sin(t * 1.3 + p[3] * 6) * 16;
          const y = cy + Math.sin(ang) * r * 0.82 + Math.cos(t * 1.1 + p[4] * 6) * 16;
          const s = (50 + p[5] * 130) * (1 - 0.5 * conv);
          ctx.globalAlpha = (0.22 + p[3] * 0.32) * fadeP;
          ctx.drawImage(softSprite(pal[Math.floor(p[4] * 4) % 4]), x - s / 2, y - s / 2, s, s);
        });
        ctx.restore();
      }
      const ringA = clamp((t - VT.ring0) / 0.4, 0, 1) * (1 - clamp((t - (VT.c1 - 0.25)) / 0.25, 0, 1));
      const ringCy = cy + H * 0.025;
      vtRing(ctx, d.ring, cx, ringCy, t, ringA, false);
      const hp = clamp((t - 2.9) / 0.8, 0, 1);
      if (hp > 0) { dsProduct.light = false; dsProduct(ctx, hero, cx, cy, W * 0.52 * (0.85 + 0.15 * easeOutCubic(hp)), 0, easeOutCubic(hp) * (1 - clamp((t - (VT.c1 - 0.25)) / 0.25, 0, 1))); }
      vtRing(ctx, d.ring, cx, ringCy, t, ringA, true);
      // frases
      const a1 = clamp(t / 0.3, 0, 1) * (1 - clamp((t - 1.1) / 0.25, 0, 1));
      const a2 = clamp((t - VT.phrase) / 0.3, 0, 1) * (1 - clamp((t - 2.9) / 0.3, 0, 1));
      [[d.intro, a1, true], [d.phrase, a2, false]].forEach(function (ph) {
        if (!ph[0] || ph[1] <= 0) return;
        const L = vtWrapLines(ctx, ph[0], W * 0.82, 108, 500, 2);
        ctx.save(); ctx.globalAlpha = ph[1]; ctx.fillStyle = "#FFFFFF"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(0,0,0,0.28)"; ctx.shadowBlur = 24; ctx.font = "500 " + L.fs + "px " + DS_FONT;
        const y0 = H * 0.49 - ((L.lines.length - 1) * L.fs * 1.08) / 2;
        L.lines.forEach((l, i) => ctx.fillText(l, W / 2, y0 + i * L.fs * 1.08));
        ctx.restore();
        if (ph[2]) { ctx.save(); ctx.globalAlpha = ph[1]; vtBrandLine(ctx, W / 2, y0 - L.fs * 1.05, name, 56, 44, "#FFFFFF", cols[0]); ctx.restore(); }
      });
    } else if (t < VT.exp) {
      // ----- [v8.6] parte media: muro de fotos en movimiento + un producto distinto en cada escena -----
      const n = tl.items.length || 1, pick = k => tl.items[k % n] || hero;
      vtStudioBg(ctx, t, cols, accent);
      vtCollage(ctx, t, tl, tl.items.length ? tl.items : [hero], cols, clamp((t - VT.c1) / 0.5, 0, 1));
      let A = vtCardAnim(t, VT.c1, VT.c2);
      if (A.on) { // 1) cristal con el 2º producto, entra desde la derecha con giro leve
        const it = pick(1), slide = (1 - easeOutCubic(clamp((t - VT.c1) / 0.5, 0, 1)));
        ctx.save(); ctx.globalAlpha = A.alpha; ctx.translate(cx + slide * W * 0.5, cy); ctx.rotate(slide * 0.12); ctx.scale(A.scale, A.scale); ctx.translate(-cx, -cy);
        const gw = W * 0.72, gh = W * 0.98, gx = cx - gw / 2, gy = cy - gh / 2;
        vtGlass(ctx, gx, gy, gw, gh, 44);
        vtItemBox(ctx, it, gx + 36, gy + 36, gw - 72, gw - 72, 30, "#FFFFFF");
        vtText(ctx, vtName(it).toUpperCase(), gx + 44, gy + gw + 20, 44, 500, "#FFFFFF", "left", gw - 88);
        const pr = vtPrice(it); if (pr) vtText(ctx, pr, gx + 44, gy + gw + 84, 56, 700, "#FFFFFF", "left", gw - 88);
        ctx.restore();
      }
      A = vtCardAnim(t, VT.c2, VT.c3);
      if (A.on) { // 2) banner con el 3er producto
        const it = pick(2);
        ctx.save(); ctx.globalAlpha = A.alpha; ctx.translate(cx, cy + A.dy); ctx.scale(A.scale, A.scale); ctx.translate(-cx, -cy);
        const bw = W * 0.74, bh = W * 1.06, bx = cx - bw / 2, by = cy - bh / 2;
        ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.25)"; ctx.shadowBlur = 50; ctx.shadowOffsetY = 18;
        const bg = ctx.createLinearGradient(0, by, 0, by + bh); bg.addColorStop(0, mixHex(accent, "#1d2b4a", 0.35)); bg.addColorStop(1, mixHex(accent, "#0e1526", 0.55));
        ctx.fillStyle = bg; roundRectPath(ctx, bx, by, bw, bh, 34); ctx.fill(); ctx.restore();
        ctx.save(); roundRectPath(ctx, bx, by, bw, bh, 34); ctx.clip();
        ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.fillRect(bx, by, bw, 70);
        vtText(ctx, (name || "RETADOR").toUpperCase(), bx + 30, by + 36, 30, 700, "#161510", "left", bw * 0.45);
        vtText(ctx, "Descubre lo nuevo", bx + bw - 30, by + 36, 28, 500, "#6b6b6b", "right", bw * 0.45);
        const zoom = 1 + 0.06 * clamp((t - VT.c2) / (VT.c3 - VT.c2), 0, 1);
        dsProduct.light = false; dsProduct(ctx, it, cx, by + bh * 0.56, bw * 0.62 * zoom, 0, 1);
        const words = (d.banner || "").trim().split(/\s+/), half = Math.ceil(words.length / 2);
        const top = words.slice(0, half).join(" "), bot = words.slice(half).join(" ");
        if (top) { const L = vtWrapLines(ctx, top, bw * 0.84, 84, 700, 2); L.lines.forEach((l, i) => vtText(ctx, l, cx, by + 150 + i * L.fs * 1.02, L.fs, 700, "#FFF4C2", "center", bw * 0.86)); }
        if (bot) { const L = vtWrapLines(ctx, bot, bw * 0.84, 84, 700, 2); L.lines.forEach((l, i) => vtText(ctx, l, cx, by + bh - 190 - (L.lines.length - 1 - i) * L.fs * 1.02, L.fs, 700, "#FFF4C2", "center", bw * 0.86)); }
        if (cta) { ctx.strokeStyle = "rgba(255,255,255,0.9)"; ctx.lineWidth = 2.5; roundRectPath(ctx, cx - 190, by + bh - 100, 380, 64, 8); ctx.stroke();
          vtText(ctx, cta.toUpperCase(), cx, by + bh - 67, 28, 700, "#FFFFFF", "center", 350); }
        ctx.restore(); ctx.restore();
      }
      A = vtCardAnim(t, VT.c3, VT.c4);
      if (A.on) { // 3) móvil con la tienda: catálogo en 2 columnas que se desplaza
        const slide = (1 - easeOutCubic(clamp((t - VT.c3) / 0.5, 0, 1))) * H * 0.35;
        ctx.save(); ctx.globalAlpha = A.alpha; ctx.translate(0, slide);
        const pw = W * 0.58, ph = pw * 2.05, px = cx - pw / 2, py = cy - ph / 2;
        ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.3)"; ctx.shadowBlur = 60; ctx.shadowOffsetY = 24;
        ctx.fillStyle = "#111214"; roundRectPath(ctx, px, py, pw, ph, 76); ctx.fill(); ctx.restore();
        const sx = px + 14, sy = py + 14, sw = pw - 28, sh = ph - 28;
        ctx.save(); roundRectPath(ctx, sx, sy, sw, sh, 64); ctx.clip();
        ctx.fillStyle = "#FFFFFF"; ctx.fillRect(sx, sy, sw, sh);
        // catálogo desplazándose (debajo de la cabecera)
        const gridTop = sy + 230, tileW = (sw - 24 * 3) / 2, tileH = tileW + 96;
        const scroll = easeInOutCubic(clamp((t - (VT.c3 + 0.4)) / (VT.c4 - VT.c3 - 0.5), 0, 1)) * tileH * 1.3;
        ctx.save(); ctx.beginPath(); ctx.rect(sx, gridTop - 10, sw, sh - (gridTop - sy)); ctx.clip();
        for (let k = 0; k < 8; k++) {
          const it = pick(k), col = k % 2, row = Math.floor(k / 2);
          const tx = sx + 24 + col * (tileW + 24), ty = gridTop + row * (tileH + 20) - scroll;
          if (ty > sy + sh || ty + tileH < gridTop - 10) continue;
          vtItemBox(ctx, it, tx, ty, tileW, tileW, 18, "#F3F3F1");
          vtText(ctx, vtName(it), tx + 4, ty + tileW + 30, 22, 700, "#161510", "left", tileW - 8);
          const pr = vtPrice(it); if (pr) vtText(ctx, pr, tx + 4, ty + tileW + 64, 24, 700, accent, "left", tileW - 8);
        }
        ctx.restore();
        // cabecera fija
        ctx.fillStyle = "#FFFFFF"; ctx.fillRect(sx, sy, sw, gridTop - 12 - sy);
        ctx.fillStyle = "#111214"; roundRectPath(ctx, cx - 60, sy + 16, 120, 34, 17); ctx.fill();
        vtMark(ctx, sx + 58, sy + 104, 52, name, accent, "#FFFFFF");
        vtText(ctx, name || "RETADOR", sx + 98, sy + 94, 30, 700, "#161510", "left", sw - 140);
        vtText(ctx, "4,9 ★ · " + n + (n === 1 ? " producto" : " productos"), sx + 98, sy + 124, 22, 500, "#777", "left", sw - 140);
        ctx.fillStyle = "#F1F1EF"; roundRectPath(ctx, sx + 24, sy + 158, sw - 48, 52, 26); ctx.fill();
        vtText(ctx, "🔍  Buscar en la tienda", sx + 48, sy + 185, 22, 500, "#8a8a8a", "left", sw - 96);
        ctx.restore(); ctx.restore();
      }
      A = vtCardAnim(t, VT.c4, VT.exp);
      if (A.on) { // 4) destacados: hasta 4 productos que caen en cascada
        const list = [];
        for (let k = 0; k < Math.min(4, Math.max(n, 1)); k++) list.push(pick(k));
        const cols2 = list.length >= 2 ? 2 : 1, rows = Math.ceil(list.length / cols2);
        const cw = W * 0.86, tileW = (cw - 80 - 28 * (cols2 - 1)) / cols2, tileH = tileW * (cols2 === 1 ? 0.9 : 1) + 110;
        const ch = 120 + rows * tileH + (rows - 1) * 24 + 40, x0 = cx - cw / 2, y0 = cy - ch / 2;
        ctx.save(); ctx.globalAlpha = A.alpha; ctx.translate(cx, cy + A.dy); ctx.scale(A.scale, A.scale); ctx.translate(-cx, -cy);
        ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.18)"; ctx.shadowBlur = 50; ctx.shadowOffsetY = 18;
        ctx.fillStyle = "rgba(255,255,255,0.9)"; roundRectPath(ctx, x0, y0, cw, ch, 40); ctx.fill(); ctx.restore();
        vtText(ctx, d.featured || "Productos destacados", x0 + 40, y0 + 64, 42, 700, "#161510", "left", cw - 80);
        list.forEach(function (it, k) {
          const pk = easeOutBack(clamp((t - (VT.c4 + 0.15 + k * 0.12)) / 0.35, 0, 1));
          if (pk <= 0) return;
          const col = k % cols2, row = Math.floor(k / cols2);
          const tx = x0 + 40 + col * (tileW + 28), ty = y0 + 110 + row * (tileH + 24), box = cols2 === 1 ? tileW * 0.9 : tileW;
          ctx.save(); ctx.globalAlpha = A.alpha * clamp(pk, 0, 1);
          ctx.translate(tx + tileW / 2, ty + tileH / 2); ctx.scale(0.8 + 0.2 * pk, 0.8 + 0.2 * pk); ctx.translate(-(tx + tileW / 2), -(ty + tileH / 2));
          ctx.fillStyle = "#F4F4F2"; roundRectPath(ctx, tx, ty, tileW, tileH, 24); ctx.fill();
          vtItemBox(ctx, it, tx + (tileW - box) / 2, ty, box, box, 24, "#FFFFFF");
          vtText(ctx, vtName(it).toUpperCase(), tx + 18, ty + box + 36, 24, 700, "#161510", "left", tileW - 36);
          const pr = vtPrice(it); if (pr) vtText(ctx, pr, tx + 18, ty + box + 76, 28, 700, "#161510", "left", tileW * 0.5);
          vtStars(ctx, tx + tileW - 118, ty + box + 76, 16, "#F5B301");
          ctx.restore();
        });
        ctx.restore();
      }
      // foto redondeada que empieza a entrar al final de destacados
      if (t > VT.exp - 0.25) {
        const e = clamp((t - (VT.exp - 0.25)) / 0.25, 0, 1), s = W * 0.66 * (0.9 + 0.1 * e);
        ctx.save(); ctx.globalAlpha = e; vtItemBox(ctx, hero, cx - s / 2, cy - s / 2, s, s, 70, mixHex(cols[0], "#FFFFFF", 0.7)); ctx.restore();
      }
    } else {
      // ----- expansión, pantalla completa y cierre -----
      const e = easeInOutCubic(clamp((t - VT.exp) / (VT.full - VT.exp), 0, 1));
      vtStudioBg(ctx, t, cols, accent);
      const w = W * 0.66 + (W - W * 0.66) * e, h = W * 0.66 + (H - W * 0.66) * e, r = 70 * (1 - e);
      const kb = 1 + 0.08 * clamp((t - VT.full) / (VT.total - VT.full), 0, 1);
      ctx.save();
      roundRectPath(ctx, cx - w / 2, cy - h / 2, w, h, r); ctx.clip();
      if (hero.photo && !isCutout(hero.photo)) {
        ctx.translate(cx, cy); ctx.scale(kb, kb); ctx.translate(-cx, -cy);
        drawPhotoCover(ctx, hero.photo, cx - w / 2, cy - h / 2, w, h, 0);
      } else {
        const g = ctx.createLinearGradient(0, cy - h / 2, 0, cy + h / 2);
        g.addColorStop(0, mixHex(cols[0], "#FFFFFF", 0.72)); g.addColorStop(1, mixHex(cols[0], "#8f9a93", 0.55));
        ctx.fillStyle = g; ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
        ctx.translate(cx, cy); ctx.scale(kb, kb); ctx.translate(-cx, -cy);
        dsProduct.light = true; dsProduct(ctx, hero, cx, cy, Math.min(w, h) * 0.78, 0, 1);
      }
      ctx.restore();
      if (t > VT.logo - 0.3) {
        const lp = clamp((t - (VT.logo - 0.3)) / 0.5, 0, 1);
        ctx.save(); ctx.globalAlpha = lp * 0.5;
        const gd = ctx.createLinearGradient(0, 0, 0, H); gd.addColorStop(0, "rgba(0,0,0,0.05)"); gd.addColorStop(0.5, "rgba(0,0,0,0.55)"); gd.addColorStop(1, "rgba(0,0,0,0.25)");
        ctx.fillStyle = gd; ctx.fillRect(0, 0, W, H); ctx.restore();
        const la = clamp((t - VT.logo) / 0.45, 0, 1);
        if (la > 0) {
          ctx.save(); ctx.globalAlpha = la; ctx.translate(cx, H * 0.45); const sc = 0.92 + 0.08 * easeOutBack(la); ctx.scale(sc, sc); ctx.translate(-cx, -H * 0.45);
          ctx.shadowColor = "rgba(0,0,0,0.3)"; ctx.shadowBlur = 20;
          vtBrandLine(ctx, cx, H * 0.45, name, 118, 100, "#FFFFFF", cols[0]);
          ctx.restore();
        }
        const cp = clamp((t - (VT.logo + 0.45)) / 0.4, 0, 1);
        if (cta && cp > 0) {
          ctx.save(); ctx.globalAlpha = cp; ctx.translate(cx, H * 0.535); ctx.scale(0.9 + 0.1 * easeOutBack(cp), 0.9 + 0.1 * easeOutBack(cp));
          ctx.font = "500 44px " + DS_FONT; const bw = Math.min(ctx.measureText(cta).width, W * 0.7) + 100, bh = 92;
          ctx.fillStyle = "rgba(255,255,255,0.18)"; roundRectPath(ctx, -bw / 2, -bh / 2, bw, bh, bh / 2); ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,0.9)"; ctx.lineWidth = 3; roundRectPath(ctx, -bw / 2, -bh / 2, bw, bh, bh / 2); ctx.stroke();
          ctx.restore();
          ctx.save(); ctx.globalAlpha = cp; vtText(ctx, cta, cx, H * 0.535 + 2, 44, 500, "#FFFFFF", "center", W * 0.7); ctx.restore();
        }
      }
    }
  }
};

const STYLES = { acercamiento: StyleAcercamiento, noria: StyleNoria, secuencial: StyleSecuencial, antesdespues: StyleAntesDespues, mosaico: StyleMosaico, directo: StyleDirecto, desfile: StyleDesfile, vitrina: StyleVitrina };
const STYLE_ORDER = ["acercamiento", "noria", "secuencial", "antesdespues", "mosaico", "directo", "desfile", "vitrina"];

export {
  AP_BASE,
  AP_HEAD,
  AP_SPACING,
  AP_TRAVEL,
  BA_BAD,
  BA_FADE,
  BA_HOLD_AFTER,
  BA_HOLD_BEFORE,
  BA_OK,
  BA_PAIR_TOTAL,
  BA_SWEEP,
  DI_PALETTES,
  DI_S,
  DI_SPEEDS,
  DI_T1,
  DI_T2,
  DI_TOTAL,
  DS,
  DS_FONT,
  DS_INK,
  MO_HOLD,
  MO_POP,
  MO_STAGGER,
  NO_BASE,
  NO_HEAD,
  NO_SPACING,
  NO_TRAVEL,
  SEQ_FADE_IN,
  SEQ_FADE_OUT,
  SEQ_TARGET,
  STYLES,
  STYLE_ORDER,
  StyleAcercamiento,
  StyleAntesDespues,
  StyleDesfile,
  StyleDirecto,
  StyleMosaico,
  StyleNoria,
  StyleSecuencial,
  StyleVitrina,
  VT,
  VT_PAD,
  VT_PARTS,
  VT_STARS,
  _colCache,
  _colCacheE,
  _cutoutCache,
  _sprites,
  diBag,
  diFitFont,
  diFont,
  diPalette,
  diPhoto,
  diSpeed,
  diWipe,
  diWrapFit,
  drawBALabel,
  drawBASide,
  drawStamp,
  dsBadge,
  dsBrandBg,
  dsHeader,
  dsHeadline,
  dsIcon,
  dsLogo,
  dsMark,
  dsPath,
  dsProduct,
  dsSceneBg,
  dsSubtitle,
  easeInOutCubic,
  isCutout,
  mixHex,
  mosaicGrid,
  productColors,
  softSprite,
  toHex,
  vtBrandLine,
  vtCardAnim,
  vtCollage,
  vtCollageCache,
  vtGlass,
  vtIntroBg,
  vtItemBox,
  vtMark,
  vtName,
  vtPrice,
  vtRing,
  vtSeeded,
  vtStars,
  vtStudioBg,
  vtText,
  vtWrapLines,
  wrapText
};
