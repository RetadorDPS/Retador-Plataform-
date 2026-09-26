// ═════════════════════════════════════════════════════════════════════════════
// Generador de Video Promocional v8.7 — INTERFAZ (formularios, vista previa, compartir, texto del post, Facebook)
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
import {
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
} from "./estilos.js";
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
import {
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
} from "./salida.js";

// [integración] El prototipo corría como IIFE al cargar la página; aquí la misma
// interfaz arranca cuando la app le pasa los datos reales (P).
// [integración] asignadores de estado que vive en otros módulos + Facebook (apagado)
import { setBgPhoto, setCurrency } from "./motor.js";
import { setFormat, setQuality, setPlan, setProgressHandler, setFps, cancelExport, estimateBytes, outFps, PROBAR_OPUS } from "./salida.js";
import { FACEBOOK_PUBLICAR, fbConectar, fbListarPaginas, fbSubirVideo, fbPublicar, fbEsperarProcesado } from "./facebook.js";

export function iniciarEditor(P) {
  // ============================================================
  // Estado
  // ============================================================
  let currentStyle = "acercamiento";
  let currentThemeId = "crema";
  let currentTab = "contenido";
  let sizeScale = 1;
  let openPickerKey = null;
  let pickerCat = "tienda";
  // [v8.8] "Ideal" = 0,65 de la velocidad de antes; rango 0,40–1,50.
  const SPEED_IDEAL = 0.65;
  let speed = SPEED_IDEAL;
  const reviews = [{ quote: "¡Llegó rapidísimo y como en las fotos!", stars: 5 }];
  let reviewPos = "bl";

  const approachState = {
    dir: "dg-izq",
    headline: "Llegó lo que estabas esperando", keyword: "esperando",
    items: [{ icon: "🛍️", photo: null }, { icon: "👟", photo: null }, { icon: "🎁", photo: null }]
  };
  const noriaState = {
    dir: "izq",
    headline: "Todo en un solo lugar", keyword: "un solo lugar",
    items: [{ icon: "🏪", photo: null }, { icon: "📱", photo: null }, { icon: "🚚", photo: null }]
  };
  const scenes = [
    { text: "Tu tienda, lista en minutos", icon: "🏪", photo: null },
    { text: "Sube tus productos fácil", icon: "📦", photo: null },
    { text: "Chatea directo con tus clientes", icon: "💬", photo: null }
  ];
  const mosaicoState = {
    headline: "Descubre nuestro catálogo", keyword: "catálogo",
    items: [{ icon: "🏪", photo: null }, { icon: "👗", photo: null }, { icon: "👟", photo: null }, { icon: "🎒", photo: null }]
  };
  const antesDespuesState = {
    headline: "El antes y el después", keyword: "después",
    pairs: [{
      before: { icon: "😩", photo: null, text: "Buscando en varias tiendas" },
      after: { icon: "😍", photo: null, text: "Todo en RETADOR" }
    }]
  };
  const directoState = {
    headline: "Combo aceite y arroz para la familia",
    item: { icon: "🛍️", photo: null, priceNow: "32", priceBefore: "", showPct: false },
    palette: "original", speed: "normal",
    topText: "AHORA EN RETADOR", close1: "CÓMPRALO", close2: "EN MI TIENDA", button: "Ver en la tienda"
  };
  // [v8.5]
  const vitrinaState = {
    intro: "Lo nuevo ya llegó", phrase: "Pídelo desde cualquier lugar", ring: "Envío a domicilio",
    banner: "Novedades de la semana", featured: "Productos destacados",
    items: [{ icon: "👜", name: "Bolso lima", priceNow: "150", photo: null }, { icon: "🎒", name: "Mochila rosa", priceNow: "95", photo: null },
      { icon: "👟", name: "Zapatillas blancas", priceNow: "70", photo: null }, { icon: "🕶️", name: "Gafas de sol", priceNow: "35", photo: null }]
  };
  // [v8.2]
  const desfileState = {
    label: "Tienda online", headline: "Ofertas -30%", keyword: "-30%", subtitle: "en toda la tienda esta semana", path: "diagonal", dir: "izq", bg: "oscuro",
    items: [{ icon: "👕", photo: null }, { icon: "🧢", photo: null }, { icon: "🕶️", photo: null }, { icon: "👖", photo: null }, { icon: "🎧", photo: null }]
  };

  const $ = id => document.getElementById(id);
  const els = {
    tabList: $("tabList"), themeGrid: $("themeGrid"), fieldsCard: $("fieldsCard"),
    sizeRange: $("sizeRange"), sizeOut: $("sizeOut"),
    storeName: $("storeName"), ctaText: $("ctaText"), accentColor: $("accentColor"), accentColorHex: $("accentColorHex"),
    progressToggle: $("progressToggle"), reviewToggle: $("reviewToggle"), reviewEditor: $("reviewEditor"), speedRange: $("speedRange"), speedOut: $("speedOut"), urgencyText: $("urgencyText"),
    styleCarousel: $("styleCarousel"), carouselPrev: $("carouselPrev"), carouselNext: $("carouselNext"), carouselDots: $("carouselDots"),
    previewCanvas: $("previewCanvas"), emptyState: $("emptyState"), replayBtn: $("replayBtn"),
    generateBtn: $("generateBtn"), statusMsg: $("statusMsg"), downloadLink: $("downloadLink"), exportDetail: $("exportDetail"),
    progressWrap: $("progressWrap"), progressTrack: $("progressTrack"), progressFill: $("progressFill"), progressText: $("progressText"), progressPct: $("progressPct")
  };

  function currentOpts() {
    return {
      accentColor: els.accentColor.value || "#F26B0F",
      storeName: (els.storeName.value || "").trim() || "RETADOR",
      cta: els.ctaText.value,
      theme: THEMES[currentThemeId],
      sizeScale: sizeScale,
      showProgress: els.progressToggle.checked,
      urgencyText: (els.urgencyText.value || "").trim(),
      speed: speed,
      reviews: els.reviewToggle.checked ? reviews.filter(r => r.quote.trim()).map(r => ({ quote: r.quote.trim(), stars: r.stars })) : [],
      reviewPos: reviewPos
    };
  }
  function currentData() {
    if (currentStyle === "acercamiento") return approachState;
    if (currentStyle === "noria") return noriaState;
    if (currentStyle === "mosaico") return mosaicoState;
    if (currentStyle === "antesdespues") return antesDespuesState;
    if (currentStyle === "directo") return directoState;
    if (currentStyle === "desfile") return desfileState;
    if (currentStyle === "vitrina") return vitrinaState;
    return { scenes: scenes.filter(s => s.text.trim().length > 0) };
  }
  function hasEnoughData() {
    if (currentStyle === "secuencial") return currentData().scenes.length > 0;
    if (currentStyle === "antesdespues") return currentData().pairs.length > 0;
    if (currentStyle === "directo") return !!(currentData().headline && currentData().headline.trim());
    if (currentStyle === "vitrina") return currentData().items.length >= 1;
    return currentData().items.length >= 2;
  }

  // ============================================================
  // Interfaz — pestañas
  // ============================================================
  const TAB_ORDER = ["contenido", "marca", "tema", "musica", "extras"];
  function renderTabs() {
    TAB_ORDER.forEach(function (id) {
      const sel = currentTab === id;
      $("tabBtn-" + id).setAttribute("aria-selected", String(sel));
      const p = $("tabPanel-" + id);
      p.className = "card tab-panel" + (sel ? " active" : "");
    });
  }
  els.tabList.addEventListener("click", function (e) {
    const b = e.target.closest(".tab-btn");
    if (!b) return;
    currentTab = b.dataset.tab; renderTabs();
  });

  // ---------- Carrusel de estilos ----------
  let carouselTimer = null, carouselSyncing = false;
  function renderStyleCarousel() {
    els.styleCarousel.innerHTML = ""; els.carouselDots.innerHTML = "";
    STYLE_ORDER.forEach(function (id) {
      const s = STYLES[id], active = currentStyle === id;
      const slide = document.createElement("button");
      slide.type = "button";
      slide.className = "style-slide" + (active ? " active" : "");
      slide.setAttribute("aria-pressed", String(active));
      slide.innerHTML = '<span class="style-slide-icon">' + s.icon + "</span><strong>" + s.label + '</strong><span class="desc">' + s.description + "</span>";
      slide.addEventListener("click", () => selectStyle(id, true));
      els.styleCarousel.appendChild(slide);
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "carousel-dot" + (active ? " active" : "");
      dot.setAttribute("aria-label", "Ver estilo " + s.label);
      dot.addEventListener("click", () => selectStyle(id, true));
      els.carouselDots.appendChild(dot);
    });
    const i = STYLE_ORDER.indexOf(currentStyle);
    els.carouselPrev.disabled = i <= 0;
    els.carouselNext.disabled = i >= STYLE_ORDER.length - 1;
  }
  function applyStyle(id) {
    currentStyle = id; openPickerKey = null;
    renderStyleCarousel(); renderFieldsCard(); renderSoundBtn(); rebuildPreview();
  }
  function selectStyle(id, scroll) {
    if (currentStyle !== id) applyStyle(id);
    if (scroll) {
      carouselSyncing = true;
      els.styleCarousel.scrollTo({ left: STYLE_ORDER.indexOf(id) * els.styleCarousel.clientWidth, behavior: "smooth" });
      setTimeout(() => { carouselSyncing = false; }, 450);
    }
  }
  els.styleCarousel.addEventListener("scroll", function () {
    if (carouselSyncing) return;
    clearTimeout(carouselTimer);
    carouselTimer = setTimeout(function () {
      const i = clamp(Math.round(els.styleCarousel.scrollLeft / (els.styleCarousel.clientWidth || 1)), 0, STYLE_ORDER.length - 1);
      if (STYLE_ORDER[i] !== currentStyle) applyStyle(STYLE_ORDER[i]);
    }, 120);
  });
  els.carouselPrev.addEventListener("click", function () { const i = STYLE_ORDER.indexOf(currentStyle); if (i > 0) selectStyle(STYLE_ORDER[i - 1], true); });
  els.carouselNext.addEventListener("click", function () { const i = STYLE_ORDER.indexOf(currentStyle); if (i < STYLE_ORDER.length - 1) selectStyle(STYLE_ORDER[i + 1], true); });

  // ---------- Temas ----------
  function renderThemeGrid() {
    els.themeGrid.innerHTML = "";
    THEME_ORDER.forEach(function (id) {
      const t = THEMES[id], active = currentThemeId === id;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "theme-card" + (active ? " active" : "");
      b.setAttribute("aria-pressed", String(active));
      b.innerHTML = '<span class="theme-swatch" style="background:' + t.bg + ";color:" + t.text + '">Aa</span><strong>' + t.label + "</strong>";
      if (t.usesPhoto) {
        const sw = b.querySelector(".theme-swatch");
        if (bgPhoto) { sw.style.backgroundImage = "url(" + bgPhoto.src + ")"; sw.style.backgroundSize = "cover"; sw.style.backgroundPosition = "center"; sw.textContent = ""; }
        else { sw.textContent = "📷"; sw.style.fontSize = "14px"; }
      }
      b.addEventListener("click", function () { currentThemeId = id; renderThemeGrid(); rebuildPreview(); });
      els.themeGrid.appendChild(b);
    });
    renderBgPhotoControls();
  }

  function renderBgPhotoControls() {
    let box = document.getElementById("bgPhotoBox");
    if (!box) {
      box = document.createElement("div");
      box.id = "bgPhotoBox";
      box.style.marginTop = "10px";
      els.themeGrid.parentNode.appendChild(box);
    }
    box.innerHTML = "";
    if (currentThemeId !== "foto") return;
    const row = document.createElement("div");
    row.className = "photo-row";
    if (bgPhoto) {
      const th = document.createElement("img");
      th.className = "photo-thumb"; th.src = bgPhoto.src; th.alt = "Foto de fondo";
      row.appendChild(th);
    }
    const btn = document.createElement("button");
    btn.type = "button"; btn.className = "upload-btn";
    btn.textContent = bgPhoto ? "Cambiar foto de fondo" : "📷 Subir foto de fondo";
    const input = document.createElement("input");
    input.type = "file"; input.accept = "image/*"; input.tabIndex = -1;
    input.style.cssText = "position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;";
    input.addEventListener("change", function () {
      const f = input.files && input.files[0];
      if (!f) return;
      loadImageFile(f).then(function (img) {
        setBgPhoto(img, prepareBlurredBackground(img)); // [integración]
        renderThemeGrid(); rebuildPreview();
      }).catch(err => setStatus(err.message, "error"));
    });
    btn.addEventListener("click", () => input.click());
    row.append(btn, input);
    box.appendChild(row);
    const hint = document.createElement("p");
    hint.className = "hint"; hint.style.margin = "7px 0 0";
    hint.textContent = bgPhoto
      ? "Se desenfoca y oscurece sola para que tus productos y textos resalten encima."
      : "Sube una foto (tu local, tu marca, un ambiente). Mientras tanto se usa fondo oscuro.";
    box.appendChild(hint);
  }

  // ---------- Editor de emoji / foto por elemento ----------
  function refreshFields() { renderFieldsCard(); rebuildPreview(); }

  function loadImageFile(file) {
    return new Promise(function (resolve, reject) {
      if (file.size > 8 * 1024 * 1024) { reject(new Error("La foto pesa demasiado (máx. 8MB).")); return; }
      const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("No se pudo leer esa imagen.")); };
      img.src = url;
    });
  }

  // [v8.0] onProduct(product, target) — opcional: se llama cuando el vendedor elige
  // un producto del catálogo, ANTES del refresco, para que el estilo que
  // llama pueda copiar además el precio (o, en Directo, el título).
  function makePhotoRow(target, onProduct) {
    const wrap = document.createElement("div");
    const row = document.createElement("div");
    row.className = "photo-row";
    if (target.photo) {
      const th = document.createElement("img");
      th.className = "photo-thumb"; th.src = target.photo.src; th.alt = "Foto de tu producto";
      const rm = document.createElement("button");
      rm.type = "button"; rm.className = "remove-photo"; rm.textContent = "Quitar foto";
      rm.addEventListener("click", function () { target.photo = null; target.product = null; refreshFields(); });
      row.append(th, rm);
    } else {
      const btn = document.createElement("button");
      btn.type = "button"; btn.className = "upload-btn"; btn.textContent = "📷 Usar foto de tu producto";
      const input = document.createElement("input");
      input.type = "file"; input.accept = "image/*"; input.tabIndex = -1;
      input.style.cssText = "position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;";
      input.addEventListener("change", function () {
        const f = input.files && input.files[0];
        if (!f) return;
        loadImageFile(f).then(function (img) { target.photo = img; target.product = null; openPickerKey = null; refreshFields(); })
          .catch(err => setStatus(err.message, "error"));
      });
      btn.addEventListener("click", () => input.click());
      row.append(btn, input);
    }
    wrap.appendChild(row);
    const pickBtn = document.createElement("button");
    pickBtn.type = "button"; pickBtn.className = "link-pick";
    pickBtn.textContent = "🏷️ O selecciona un producto de tu tienda";
    pickBtn.addEventListener("click", function () {
      openProductPicker(function (product, img) {
        target.photo = img; target.product = product; openPickerKey = null;
        if (onProduct) onProduct(product, target);
        refreshFields();
      });
    });
    wrap.appendChild(pickBtn);
    return wrap;
  }

  function makePicker(target) {
    const box = document.createElement("div");
    box.className = "picker";
    const cats = document.createElement("div");
    cats.className = "picker-cats";
    EMOJI_CATS.forEach(function (c) {
      const chip = document.createElement("button");
      chip.type = "button"; chip.className = "cat-chip" + (pickerCat === c.id ? " active" : "");
      chip.textContent = c.label;
      chip.addEventListener("click", function () { pickerCat = c.id; renderFieldsCard(); });
      cats.appendChild(chip);
    });
    const grid = document.createElement("div");
    grid.className = "picker-grid";
    const cat = EMOJI_CATS.find(c => c.id === pickerCat) || EMOJI_CATS[0];
    cat.list.forEach(function (e) {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = e; b.setAttribute("aria-label", "Usar " + e);
      b.addEventListener("click", function () { target.icon = e; target.photo = null; openPickerKey = null; refreshFields(); });
      grid.appendChild(b);
    });
    const custom = document.createElement("div");
    custom.className = "picker-custom";
    const inp = document.createElement("input");
    inp.type = "text"; inp.placeholder = "O pega cualquier emoji de tu teclado 😀"; inp.setAttribute("aria-label", "Pegar un emoji");
    const ok = document.createElement("button");
    ok.type = "button"; ok.textContent = "Usar";
    const note = document.createElement("div");
    note.className = "picker-note";
    function useCustom() {
      const e = extractEmoji(inp.value);
      if (!e) { note.textContent = "Eso no parece un emoji. Prueba con uno del teclado."; return; }
      target.icon = e; target.photo = null; openPickerKey = null; refreshFields();
    }
    ok.addEventListener("click", useCustom);
    inp.addEventListener("keydown", e => { if (e.key === "Enter") useCustom(); });
    custom.append(inp, ok);
    box.append(cats, grid, custom, note);
    return box;
  }

  function makeVisualEditor(target, key, skipPrice) {
    const wrap = document.createElement("div");
    const row = document.createElement("div");
    row.className = "emoji-row";
    let list = QUICK_EMOJIS.slice();
    if (!target.photo && target.icon && list.indexOf(target.icon) < 0) list = [target.icon].concat(list.slice(0, 7));
    list.forEach(function (e) {
      const active = !target.photo && target.icon === e;
      const b = document.createElement("button");
      b.type = "button"; b.className = "emoji-btn" + (active ? " active" : "");
      b.textContent = e; b.setAttribute("aria-label", "Usar " + e); b.setAttribute("aria-pressed", String(active));
      b.addEventListener("click", function () { target.icon = e; target.photo = null; openPickerKey = null; refreshFields(); });
      row.appendChild(b);
    });
    const more = document.createElement("button");
    more.type = "button"; more.className = "emoji-btn more"; more.textContent = "+";
    more.setAttribute("aria-label", "Más emojis");
    more.setAttribute("aria-expanded", String(openPickerKey === key));
    more.addEventListener("click", function () { openPickerKey = openPickerKey === key ? null : key; renderFieldsCard(); });
    row.appendChild(more);
    wrap.appendChild(row);
    if (openPickerKey === key) wrap.appendChild(makePicker(target));
    wrap.appendChild(makePhotoRow(target, function (product, t) { if (!skipPrice) t.priceNow = product.price; if ("name" in t) t.name = product.title; }));
    if (!skipPrice) wrap.appendChild(makePriceRow(target));
    return wrap;
  }

  // Bloque "Precio con descuento": precio normal (sale tachado) + precio de
  // oferta. El % se calcula solo; la casilla decide si se muestra en el video.
  function makePriceRow(target) {
    const box = document.createElement("div");
    box.className = "price-box";
    const title = document.createElement("div");
    title.className = "price-title";
    title.innerHTML = "🏷️ Precio con descuento <span>(opcional)</span>";
    box.appendChild(title);

    const row = document.createElement("div");
    row.className = "price-row";
    function field(labelText, key, ph) {
      const w = document.createElement("label");
      w.className = "price-field";
      const l = document.createElement("span"); l.textContent = labelText;
      const i = document.createElement("input");
      i.type = "text"; i.inputMode = "decimal"; i.placeholder = ph; i.maxLength = 12;
      i.value = target[key] || "";
      i.addEventListener("input", function () { target[key] = i.value; updatePct(); rebuildPreview(); });
      w.append(l, i);
      return w;
    }
    const cur = document.createElement("label");
    cur.className = "price-field price-cur";
    const cl = document.createElement("span"); cl.textContent = "Moneda";
    const sel = document.createElement("select");
    CURRENCIES.forEach(function (c) {
      const o = document.createElement("option");
      o.value = c.id; o.textContent = c.label; if (c.id === currency) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener("change", function () { setCurrency(sel.value); renderFieldsCard(); rebuildPreview(); }); // [integración]
    cur.append(cl, sel);
    row.append(field("Precio normal (sale tachado)", "priceBefore", "Ej: 120"), field("Precio de oferta", "priceNow", "Ej: 90"), cur);
    box.appendChild(row);

    const pctRow = document.createElement("label");
    pctRow.className = "pct-row";
    const chk = document.createElement("input");
    chk.type = "checkbox"; chk.checked = !!target.showPct;
    chk.addEventListener("change", function () { target.showPct = chk.checked; rebuildPreview(); });
    const pctText = document.createElement("span");
    pctRow.append(chk, pctText);
    box.appendChild(pctRow);

    function updatePct() {
      const pct = discountPct(target);
      if (pct) {
        pctText.innerHTML = "Descuento calculado: <strong>" + pct + "%</strong> — mostrar en el video";
        chk.disabled = false; pctRow.classList.remove("off");
      } else {
        const b = parsePrice(target.priceBefore), n = parsePrice(target.priceNow);
        pctText.textContent = (b !== null && n !== null && n >= b)
          ? "El precio de oferta debe ser menor que el normal para calcular el %"
          : "Escribe los dos precios y el % se calcula solo";
        chk.disabled = true; pctRow.classList.add("off");
      }
    }
    updatePct();
    return box;
  }

  function makeTextField(labelText, value, max, onInput) {
    const frag = document.createDocumentFragment();
    const id = "f" + Math.random().toString(36).slice(2, 8);
    const l = document.createElement("label");
    l.className = "field-label"; l.htmlFor = id; l.textContent = labelText;
    const i = document.createElement("input");
    i.type = "text"; i.id = id; i.maxLength = max; i.value = value; i.className = "field-gap";
    i.addEventListener("input", function () { onInput(i.value); rebuildPreview(); });
    frag.append(l, i);
    return frag;
  }

  // [v8.4] Selector de dirección de los productos (estilos con movimiento)
  const DIR_OPTIONS = {
    ap: [["dg-izq", "↖ Diagonal", "hacia la izquierda"], ["dg-der", "↗ Diagonal", "hacia la derecha"], ["h-izq", "← Horizontal", "hacia la izquierda"], ["h-der", "→ Horizontal", "hacia la derecha"]],
    no: [["izq", "← Hacia la izquierda", "el de siempre"], ["der", "→ Hacia la derecha", "al revés"]],
    ds: [["izq", "← Hacia la izquierda", "el de siempre"], ["der", "→ Hacia la derecha", "al revés"]]
  };
  function makeDirControl(state, options, key) {
    const k = key || "dir";
    const wrap = document.createElement("div");
    wrap.appendChild(diSectionTitle("Dirección de los productos"));
    const seg = document.createElement("div"); seg.className = "di-seg";
    seg.style.gridTemplateColumns = "1fr 1fr"; seg.style.marginBottom = "12px";
    options.forEach(function (o) {
      const b = document.createElement("button"); b.type = "button";
      b.setAttribute("aria-pressed", state[k] === o[0] ? "true" : "false");
      b.innerHTML = o[1] + "<small>" + o[2] + "</small>";
      b.addEventListener("click", function () { state[k] = o[0]; refreshFields(); });
      seg.appendChild(b);
    });
    wrap.appendChild(seg);
    return wrap;
  }

  function renderItemList(state, styleKey) {
    const box = els.fieldsCard;
    box.appendChild(makeTextField("Titular (se queda fijo arriba)", state.headline, 40, v => { state.headline = v; }));
    box.appendChild(makeTextField("Palabra o frase que brilla (debe estar en el titular)", state.keyword, 24, v => { state.keyword = v; }));
    if (DIR_OPTIONS[styleKey]) box.appendChild(makeDirControl(state, DIR_OPTIONS[styleKey]));
    state.items.forEach(function (item, i) {
      const div = document.createElement("div"); div.className = "item";
      const head = document.createElement("div"); head.className = "item-head";
      const n = document.createElement("span"); n.className = "n"; n.textContent = "Producto " + (i + 1);
      head.appendChild(n);
      if (state.items.length > 2) {
        const rm = document.createElement("button");
        rm.type = "button"; rm.className = "remove"; rm.textContent = "Quitar";
        rm.addEventListener("click", function () { state.items.splice(i, 1); openPickerKey = null; refreshFields(); });
        head.appendChild(rm);
      }
      div.append(head, makeVisualEditor(item, styleKey + ":" + i));
      box.appendChild(div);
    });
    const add = document.createElement("button");
    add.type = "button"; add.className = "add-item"; add.textContent = "+ Añadir producto";
    add.disabled = state.items.length >= 6;
    add.addEventListener("click", function () { if (state.items.length < 6) { state.items.push({ icon: "⭐", photo: null }); refreshFields(); } });
    box.appendChild(add);
  }

  function renderSceneList() {
    const box = els.fieldsCard;
    scenes.forEach(function (scene, i) {
      const div = document.createElement("div"); div.className = "item";
      const head = document.createElement("div"); head.className = "item-head";
      const n = document.createElement("span"); n.className = "n"; n.textContent = "Escena " + (i + 1);
      head.appendChild(n);
      if (scenes.length > 1) {
        const rm = document.createElement("button");
        rm.type = "button"; rm.className = "remove"; rm.textContent = "Quitar";
        rm.addEventListener("click", function () { scenes.splice(i, 1); openPickerKey = null; refreshFields(); });
        head.appendChild(rm);
      }
      const inp = document.createElement("input");
      inp.type = "text"; inp.maxLength = 60; inp.value = scene.text; inp.placeholder = "Ej: Envíos a toda Cuba";
      inp.setAttribute("aria-label", "Texto de la escena " + (i + 1));
      inp.addEventListener("input", function () { scene.text = inp.value; rebuildPreview(); });
      div.append(head, inp, makeVisualEditor(scene, "seq:" + i));
      box.appendChild(div);
    });
    const add = document.createElement("button");
    add.type = "button"; add.className = "add-item"; add.textContent = "+ Añadir escena";
    add.disabled = scenes.length >= 5;
    add.addEventListener("click", function () { if (scenes.length < 5) { scenes.push({ text: "", icon: "✨", photo: null }); refreshFields(); } });
    box.appendChild(add);
  }

  function makeHalfEditor(half, label, key) {
    const box = document.createElement("div");
    box.style.cssText = "flex:1; min-width:0;";
    const l = document.createElement("div");
    l.style.cssText = "font-size:11.5px; font-weight:800; color:var(--text-muted); margin-bottom:5px;";
    l.textContent = label;
    box.appendChild(l);
    const inp = document.createElement("input");
    inp.type = "text"; inp.maxLength = 30; inp.value = half.text || ""; inp.placeholder = "Texto corto";
    inp.className = "field-gap";
    inp.addEventListener("input", function () { half.text = inp.value; rebuildPreview(); });
    box.appendChild(inp);
    box.appendChild(makeVisualEditor(half, key, true));
    return box;
  }

  function renderAntesDespuesFields() {
    const box = els.fieldsCard;
    box.appendChild(makeTextField("Titular (aparece abajo)", antesDespuesState.headline, 40, v => { antesDespuesState.headline = v; }));
    box.appendChild(makeTextField("Palabra o frase que brilla", antesDespuesState.keyword, 24, v => { antesDespuesState.keyword = v; }));
    antesDespuesState.pairs.forEach(function (pair, i) {
      const div = document.createElement("div"); div.className = "item";
      const head = document.createElement("div"); head.className = "item-head";
      const n = document.createElement("span"); n.className = "n"; n.textContent = "Comparación " + (i + 1);
      head.appendChild(n);
      if (antesDespuesState.pairs.length > 1) {
        const rm = document.createElement("button");
        rm.type = "button"; rm.className = "remove"; rm.textContent = "Quitar";
        rm.addEventListener("click", function () { antesDespuesState.pairs.splice(i, 1); openPickerKey = null; refreshFields(); });
        head.appendChild(rm);
      }
      div.appendChild(head);
      const cols = document.createElement("div");
      cols.style.cssText = "display:flex; gap:10px;";
      cols.append(
        makeHalfEditor(pair.before, "ANTES", "ba" + i + ":before"),
        makeHalfEditor(pair.after, "DESPUÉS", "ba" + i + ":after")
      );
      div.appendChild(cols);
      box.appendChild(div);
    });
    const add = document.createElement("button");
    add.type = "button"; add.className = "add-item"; add.textContent = "+ Añadir comparación";
    add.disabled = antesDespuesState.pairs.length >= 3;
    add.addEventListener("click", function () {
      if (antesDespuesState.pairs.length < 3) {
        antesDespuesState.pairs.push({ before: { icon: "😕", photo: null, text: "" }, after: { icon: "😄", photo: null, text: "" } });
        refreshFields();
      }
    });
    box.appendChild(add);
  }

  // [v8.5] Formulario del estilo Vitrina
  function renderVitrinaFields() {
    const box = els.fieldsCard, st = vitrinaState;
    box.appendChild(makeTextField("Frase de entrada (con tu logo encima)", st.intro, 36, v => { st.intro = v; }));
    box.appendChild(makeTextField("Segunda frase", st.phrase, 40, v => { st.phrase = v; }));
    box.appendChild(makeTextField("Texto del anillo que gira alrededor del producto", st.ring, 26, v => { st.ring = v; }));
    box.appendChild(makeTextField("Texto del banner promocional", st.banner, 34, v => { st.banner = v; }));
    box.appendChild(makeTextField("Título de la tarjeta de destacados", st.featured, 28, v => { st.featured = v; }));
    st.items.forEach(function (item, i) {
      const div = document.createElement("div"); div.className = "item";
      const head = document.createElement("div"); head.className = "item-head";
      const n = document.createElement("span"); n.className = "n"; n.textContent = i === 0 ? "Producto principal" : "Producto " + (i + 1);
      head.appendChild(n);
      if (st.items.length > 1) {
        const rm = document.createElement("button");
        rm.type = "button"; rm.className = "remove"; rm.textContent = "Quitar";
        rm.addEventListener("click", function () { st.items.splice(i, 1); openPickerKey = null; refreshFields(); });
        head.appendChild(rm);
      }
      div.append(head, makeTextField("Nombre del producto", item.name, 28, v => { item.name = v; }), makeVisualEditor(item, "vt:" + i));
      box.appendChild(div);
    });
    const add = document.createElement("button");
    add.type = "button"; add.className = "add-item"; add.textContent = "+ Añadir producto";
    add.disabled = st.items.length >= 6;
    add.addEventListener("click", function () { if (st.items.length < 6) { st.items.push({ icon: "⭐", name: "Producto", priceNow: "", photo: null }); refreshFields(); } });
    box.appendChild(add);
    const hint = document.createElement("p"); hint.className = "hint"; hint.style.marginTop = "8px";
    hint.textContent = "El producto principal abre y cierra el video, y su color tiñe la nube del inicio. Cada escena del medio muestra un producto distinto, y todos forman el muro de fotos que se mueve detrás: con 4 a 6 productos el video tiene mucha más variedad. Mejor con fotos reales (ideal PNG sin fondo). El botón final usa la Frase final de Marca.";
    box.appendChild(hint);
  }

  // [v8.2] Formulario del estilo Desfile
  function renderDesfileFields() {
    const box = els.fieldsCard, st = desfileState;
    box.appendChild(makeTextField("Etiqueta junto al nombre de la tienda (arriba)", st.label, 18, v => { st.label = v; }));
    box.appendChild(makeTextField("Titular", st.headline, 22, v => { st.headline = v; }));
    box.appendChild(makeTextField("Palabra que brilla (debe estar en el titular)", st.keyword, 14, v => { st.keyword = v; }));
    box.appendChild(makeTextField("Subtítulo", st.subtitle, 44, v => { st.subtitle = v; }));
    box.appendChild(diSectionTitle("Recorrido de los productos"));
    const seg = document.createElement("div"); seg.className = "di-seg"; seg.style.gridTemplateColumns = "1fr 1fr"; seg.style.marginBottom = "12px";
    [["diagonal", "Diagonal", "el de siempre"], ["curva", "Sube y gira", "como el anuncio"]].forEach(function (o) {
      const b = document.createElement("button"); b.type = "button";
      b.setAttribute("aria-pressed", st.path === o[0] ? "true" : "false");
      b.innerHTML = o[1] + "<small>" + o[2] + "</small>";
      b.addEventListener("click", function () { st.path = o[0]; refreshFields(); });
      seg.appendChild(b);
    });
    box.appendChild(seg);
    box.appendChild(makeDirControl(st, DIR_OPTIONS.ds));
    box.appendChild(diSectionTitle("Fondo"));
    const bseg = document.createElement("div"); bseg.className = "di-seg"; bseg.style.gridTemplateColumns = "1fr 1fr"; bseg.style.marginBottom = "12px";
    [["oscuro", "Oscuro difuminado", "como el anuncio"], ["claro", "Claro", "fondo luminoso"]].forEach(function (o) {
      const b = document.createElement("button"); b.type = "button";
      b.setAttribute("aria-pressed", st.bg === o[0] ? "true" : "false");
      b.innerHTML = o[1] + "<small>" + o[2] + "</small>";
      b.addEventListener("click", function () { st.bg = o[0]; refreshFields(); });
      bseg.appendChild(b);
    });
    box.appendChild(bseg);
    st.items.forEach(function (item, i) {
      const div = document.createElement("div"); div.className = "item";
      const head = document.createElement("div"); head.className = "item-head";
      const n = document.createElement("span"); n.className = "n"; n.textContent = "Producto " + (i + 1);
      head.appendChild(n);
      if (st.items.length > 2) {
        const rm = document.createElement("button");
        rm.type = "button"; rm.className = "remove"; rm.textContent = "Quitar";
        rm.addEventListener("click", function () { st.items.splice(i, 1); openPickerKey = null; refreshFields(); });
        head.appendChild(rm);
      }
      div.append(head, makeVisualEditor(item, "ds:" + i)); // [v8.8] con precio
      box.appendChild(div);
    });
    const add = document.createElement("button");
    add.type = "button"; add.className = "add-item"; add.textContent = "+ Añadir producto";
    add.disabled = st.items.length >= 6;
    add.addEventListener("click", function () { if (st.items.length < 6) { st.items.push({ icon: "⭐", photo: null }); refreshFields(); } });
    box.appendChild(add);
    const hint = document.createElement("p"); hint.className = "hint"; hint.style.marginTop = "8px";
    hint.textContent = "Consejo: las fotos SIN fondo (PNG transparente) flotan sueltas como en los anuncios grandes. Las fotos con fondo salen en una tarjeta blanca. Usa el color de acento de la pestaña Marca.";
    box.appendChild(hint);
  }

  function renderDirectoFields() {
    const box = els.fieldsCard;
    box.appendChild(makeTextField("Título del producto", directoState.headline, 60, v => { directoState.headline = v; }));
    const div = document.createElement("div"); div.className = "item";
    const head = document.createElement("div"); head.className = "item-head";
    const n = document.createElement("span"); n.className = "n"; n.textContent = "Foto y precio del producto";
    head.appendChild(n);
    const inner = document.createElement("div");
    inner.appendChild(makePhotoRow(directoState.item, function (product) {
      directoState.item.priceNow = product.price;
      directoState.headline = product.title;
    }));
    inner.appendChild(makePriceRow(directoState.item));
    div.append(head, inner);
    box.appendChild(div);
    const hint = document.createElement("p");
    hint.className = "hint"; hint.style.marginTop = "8px";
    hint.textContent = "Sin foto, se muestra una ilustración de ejemplo. Los colores de este estilo se eligen aquí abajo (no cambian con el Tema).";
    box.appendChild(hint);

    // ---- Colores ----
    box.appendChild(diSectionTitle("Colores"));
    const pals = document.createElement("div"); pals.className = "di-pals";
    DI_PALETTES.forEach(function (pal) {
      const b = document.createElement("button");
      b.type = "button"; b.className = "di-pal";
      b.setAttribute("aria-pressed", directoState.palette === pal.id ? "true" : "false");
      b.innerHTML = '<span class="di-dots"><i style="background:' + pal.dark + '"></i><i style="background:' + pal.accent + '"></i><i style="background:' + pal.highlight + '"></i><i style="background:' + pal.badge + '"></i></span>' +
        '<span>' + pal.label + (pal.id === "original" ? ' <small>· por defecto</small>' : '') + '</span>';
      b.addEventListener("click", function () { directoState.palette = pal.id; refreshFields(); });
      pals.appendChild(b);
    });
    box.appendChild(pals);

    // ---- Velocidad ----
    box.appendChild(diSectionTitle("Velocidad"));
    const seg = document.createElement("div"); seg.className = "di-seg"; seg.setAttribute("role", "group"); seg.setAttribute("aria-label", "Velocidad del video");
    DI_SPEEDS.forEach(function (sp) {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-pressed", directoState.speed === sp.id ? "true" : "false");
      b.innerHTML = sp.label + '<small>' + (9.2 / sp.f).toFixed(1).replace(".", ",") + ' s</small>';
      b.addEventListener("click", function () { directoState.speed = sp.id; refreshFields(); });
      seg.appendChild(b);
    });
    box.appendChild(seg);

    // ---- Textos ----
    box.appendChild(diSectionTitle("Textos del video"));
    box.appendChild(makeTextField("Encabezado de la escena del producto", directoState.topText, 22, v => { directoState.topText = v; }));
    box.appendChild(makeTextField("Cierre — primera línea", directoState.close1, 14, v => { directoState.close1 = v; }));
    box.appendChild(makeTextField("Cierre — segunda línea", directoState.close2, 18, v => { directoState.close2 = v; }));

    const tip = document.createElement("p");
    tip.className = "hint"; tip.style.marginTop = "2px";
    tip.textContent = "La tercera línea del cierre es el nombre de tu tienda y el botón final muestra la \"Frase final\" (las dos en la pestaña Marca, iguales para todos los estilos). Deja un campo vacío para quitar esa línea.";
    box.appendChild(tip);
    const reset = document.createElement("button");
    reset.type = "button"; reset.className = "ghost"; reset.style.width = "100%"; reset.style.marginTop = "6px";
    reset.textContent = "↺ Volver al diseño original";
    reset.addEventListener("click", function () {
      Object.assign(directoState, { palette: "original", speed: "normal", topText: "AHORA EN RETADOR", close1: "CÓMPRALO", close2: "EN MI TIENDA" });
      refreshFields();
    });
    box.appendChild(reset);
  }
  function diSectionTitle(t) {
    const h = document.createElement("div"); h.className = "di-section"; h.textContent = t; return h;
  }

  function renderFieldsCard() {
    const tn = $("themeNote");
    if (tn) {
      const own = currentStyle === "directo" ? "Directo tiene sus propios colores: elígelos en Contenido → Colores." :
        currentStyle === "desfile" ? "Desfile tiene su propio fondo (oscuro difuminado o claro): elígelo en Contenido → Fondo. Sí usa el color de acento de Marca." :
        currentStyle === "vitrina" ? "Vitrina toma sus fondos de los colores de tu producto principal y del color de acento de Marca." : "";
      tn.textContent = own; tn.style.display = own ? "" : "none";
    }
    els.fieldsCard.innerHTML = "";
    if (currentStyle === "acercamiento") renderItemList(approachState, "ap");
    else if (currentStyle === "noria") renderItemList(noriaState, "no");
    else if (currentStyle === "mosaico") renderItemList(mosaicoState, "mo");
    else if (currentStyle === "antesdespues") renderAntesDespuesFields();
    else if (currentStyle === "directo") renderDirectoFields();
    else if (currentStyle === "desfile") renderDesfileFields();
    else if (currentStyle === "vitrina") renderVitrinaFields();
    else renderSceneList();
  }

  // ---------- Controles globales ----------
  els.sizeRange.addEventListener("input", function () {
    sizeScale = Number(els.sizeRange.value) / 100;
    els.sizeOut.textContent = els.sizeRange.value + "%";
    rebuildPreview();
  });
  // [v8.0] Colores rápidos: el naranja RETADOR siempre queda a mano, primero y marcado.
  const ACCENT_DEFAULT = "#F26B0F";
  const ACCENT_PRESETS = [
    { hex: ACCENT_DEFAULT, label: "Naranja RETADOR", isDefault: true },
    { hex: "#0FB5A6", label: "Turquesa" }, { hex: "#1E8E5A", label: "Verde" }, { hex: "#2563EB", label: "Azul" },
    { hex: "#7C3AED", label: "Morado" }, { hex: "#DB2777", label: "Rosa" }, { hex: "#DC2626", label: "Rojo" }, { hex: "#EAB308", label: "Amarillo" }
  ];
  function setAccent(hex) {
    els.accentColor.value = hex;
    els.accentColorHex.textContent = hex.toUpperCase();
    renderAccentSwatches(); rebuildPreview();
  }
  function renderAccentSwatches() {
    const box = $("accentSwatches"); box.innerHTML = "";
    const cur = (els.accentColor.value || "").toUpperCase();
    ACCENT_PRESETS.forEach(function (p) {
      const b = document.createElement("button");
      b.type = "button"; b.className = "acc-sw" + (p.isDefault ? " default" : "");
      b.style.background = p.hex;
      b.setAttribute("aria-label", p.label + (p.isDefault ? " (predeterminado)" : ""));
      b.title = p.label;
      b.setAttribute("aria-pressed", cur === p.hex.toUpperCase() ? "true" : "false");
      if (p.isDefault) b.textContent = "Naranja RETADOR";
      b.addEventListener("click", () => setAccent(p.hex));
      box.appendChild(b);
    });
  }
  els.accentColor.addEventListener("input", function () { els.accentColorHex.textContent = els.accentColor.value.toUpperCase(); renderAccentSwatches(); rebuildPreview(); });
  els.storeName.addEventListener("input", rebuildPreview);
  els.ctaText.addEventListener("input", rebuildPreview);
  els.reviewToggle.addEventListener("change", rebuildPreview);
  els.progressToggle.addEventListener("change", rebuildPreview);
  els.speedRange.addEventListener("input", function () {
    const v = Number(els.speedRange.value);
    speed = v / 100;
    // [v8.8] se muestra respecto a la velocidad ideal (la rayita)
    els.speedOut.textContent = v === Math.round(SPEED_IDEAL * 100) ? "Ideal" : (speed / SPEED_IDEAL).toFixed(2).replace(/0$/, "") + "×";
    rebuildPreview();
  });

  // ---------- Editor de reseñas ----------
  function renderReviewEditor() {
    const box = els.reviewEditor;
    box.innerHTML = "";
    if (!els.reviewToggle.checked) return;
    reviews.forEach(function (r, i) {
      const row = document.createElement("div");
      row.className = "review-row";
      const q = document.createElement("input");
      q.type = "text"; q.maxLength = 60; q.value = r.quote; q.placeholder = "Lo que dijo tu cliente";
      q.setAttribute("aria-label", "Reseña " + (i + 1));
      q.addEventListener("input", function () { r.quote = q.value; rebuildPreview(); });
      const st = document.createElement("select");
      st.setAttribute("aria-label", "Estrellas de la reseña " + (i + 1));
      [5, 4, 3, 2, 1].forEach(function (n) {
        const o = document.createElement("option");
        o.value = n; o.textContent = n + " ★"; if (n === r.stars) o.selected = true;
        st.appendChild(o);
      });
      st.addEventListener("change", function () { r.stars = Number(st.value); rebuildPreview(); });
      const rm = document.createElement("button");
      rm.type = "button"; rm.textContent = "✕"; rm.setAttribute("aria-label", "Quitar reseña " + (i + 1));
      rm.style.visibility = reviews.length > 1 ? "visible" : "hidden";
      rm.addEventListener("click", function () { reviews.splice(i, 1); renderReviewEditor(); rebuildPreview(); });
      row.append(q, st, rm);
      box.appendChild(row);
    });
    const add = document.createElement("button");
    add.type = "button"; add.className = "add-item"; add.textContent = "+ Añadir reseña";
    add.disabled = reviews.length >= 4;
    add.addEventListener("click", function () {
      if (reviews.length < 4) { reviews.push({ quote: "", stars: 5 }); renderReviewEditor(); }
    });
    box.appendChild(add);

    const wrap = document.createElement("div");
    wrap.className = "pos-wrap";
    const phone = document.createElement("div");
    phone.className = "pos-phone";
    phone.setAttribute("role", "group");
    phone.setAttribute("aria-label", "Posición de las reseñas en la pantalla");
    REVIEW_POSITIONS.forEach(function (p) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = p.id === reviewPos ? "active" : "";
      b.setAttribute("aria-label", p.label);
      b.setAttribute("aria-pressed", String(p.id === reviewPos));
      b.addEventListener("click", function () { reviewPos = p.id; renderReviewEditor(); rebuildPreview(); });
      phone.appendChild(b);
    });
    const lbl = document.createElement("div");
    lbl.className = "pos-label";
    const cur = REVIEW_POSITIONS.find(p => p.id === reviewPos);
    lbl.innerHTML = "<strong>Dónde aparecen</strong>" + cur.label + ". Toca un recuadro del teléfono para moverlas donde no tapen tus productos.";
    wrap.append(phone, lbl);
    box.appendChild(wrap);
  }
  els.reviewToggle.addEventListener("change", renderReviewEditor);
  els.urgencyText.addEventListener("input", rebuildPreview);
  els.replayBtn.addEventListener("click", rebuildPreview);

  function audioLabel(hasAudio) {
    if (!hasAudio) return "sin sonido";
    const parts = [];
    if (music.mood !== "none") parts.push("música " + moodLabel());
    if (sfxOn() && STYLES[currentStyle].sfxEvents) parts.push("efectos");
    return "con " + parts.join(" + ");
  }


  function renderQualityUI() {
    const seg = $("qualSeg"); seg.innerHTML = "";
    Object.keys(QUALITIES).forEach(function (k) {
      const q = QUALITIES[k], b = document.createElement("button");
      b.type = "button"; b.setAttribute("aria-pressed", currentQuality === k ? "true" : "false");
      b.innerHTML = '<span class="t">' + q.label + "</span><small>" + q.sub.split(" · ")[0] + "</small>"; // [v8.8] el peso sale en "Tamaño estimado"
      b.addEventListener("click", function () { setQuality(k); renderQualityUI(); renderSizeEstimate(); }); // [integración]
      seg.appendChild(b);
    });
    $("qualHint").textContent = currentQuality === "ligera" // [v8.8] explicaciones de una línea
      ? "Pesa unas 3 veces menos: ideal con datos móviles."
      : "Máxima nitidez. Con datos móviles, prueba \"Ligera\".";
  }
  // [v8.8] Fluidez: 60 fps (máxima) o 30 fps (se genera casi el doble de rápido y pesa menos)
  function renderFpsUI() {
    const seg = $("fpsSeg"); seg.innerHTML = "";
    [[60, "60 fps", "Máxima"], [30, "30 fps", "Más rápido"]].forEach(function (o) {
      const b = document.createElement("button");
      b.type = "button"; b.setAttribute("aria-pressed", outFps() === o[0] ? "true" : "false");
      b.innerHTML = '<span class="t">' + o[1] + "</span><small>" + o[2] + "</small>";
      b.addEventListener("click", function () { setFps(o[0]); renderFpsUI(); renderSizeEstimate(); });
      seg.appendChild(b);
    });
    $("fpsHint").textContent = outFps() === 30
      ? "Se genera casi el doble de rápido y pesa menos."
      : "Lo más suave. Si tu teléfono tarda, prueba \"30 fps\".";
  }
  // [v8.8] Tamaño estimado antes de generar (duración real del estilo y la velocidad)
  function renderSizeEstimate() {
    const el = $("sizeEst");
    if (!el) return;
    if (!hasEnoughData()) { el.textContent = ""; return; }
    const style = STYLES[currentStyle], tl = style.buildTimeline(currentData()), opts = currentOpts();
    const mb = estimateBytes(tl, opts, audioWanted(style)) / 1048576, secs = Math.ceil(tl.total / opts.speed) / FPS;
    el.textContent = "Peso estimado ≈ " + mb.toFixed(1).replace(".", ",") + " MB · dura " + Math.round(secs) + " s";
  }

  // [integración] Se quitó el selector "Plan del vendedor (solo para probar)".
  // El plan real llega de la app (getPlanPerks → can_customize) en P.conMarcaDeAgua.
  function renderPlanNotice() {
    $("planNotice").style.display = hasWatermark() ? "" : "none";
  }

  // [v8.1] Pestaña Música
  function renderMusicUI() {
    const g = $("moodGrid"); g.innerHTML = "";
    MUSIC_MOODS.forEach(function (m) {
      const b = document.createElement("button");
      b.type = "button"; b.className = "mood-card";
      b.setAttribute("aria-pressed", music.mood === m.id ? "true" : "false");
      b.innerHTML = '<span class="mi">' + m.icon + '</span><span><b>' + m.label + '</b><small>' + m.desc + '</small></span>';
      b.addEventListener("click", function () {
        music.mood = m.id;
        if (previewSound) unlockAudio();
        renderMusicUI(); renderSoundBtn(); rebuildPreview();
      });
      g.appendChild(b);
    });
  }
  $("musicVol").addEventListener("input", function () {
    music.volume = Number(this.value) / 100;
    $("musicVolVal").textContent = this.value + "%";
  });
  $("musicVol").addEventListener("change", rebuildPreview);
  $("sfxSceneToggle").addEventListener("change", function () { music.sfxScene = this.checked; renderSoundBtn(); rebuildPreview(); });
  $("sfxItemToggle").addEventListener("change", function () { music.sfxItem = this.checked; renderSoundBtn(); rebuildPreview(); });
  $("soundBtn").addEventListener("click", function () {
    previewSound = !previewSound;
    if (previewSound) {
      const c = getAudioCtx();
      if (!c) { previewSound = false; toast("Este navegador no puede reproducir la música."); renderSoundBtn(); return; }
      c.resume().then(function () { renderSoundBtn(); rebuildPreview(); });
      return;
    }
    renderSoundBtn(); rebuildPreview();
  });

  function renderFormatUI() {
    const seg = $("fmtSeg"); seg.innerHTML = "";
    FORMATS.forEach(function (F) {
      const b = document.createElement("button");
      b.type = "button"; b.setAttribute("aria-pressed", F.id === currentFormat ? "true" : "false");
      const sw = 14, sh = Math.round(14 * F.h / F.w);
      // [v8.8] fila compacta: el dibujo de la forma va junto al nombre
      b.innerHTML = '<span class="t"><span class="shape" style="width:' + (F.id === "vertical" ? 7 : Math.round(sw * 0.7)) + 'px;height:' + (F.id === "vertical" ? 13 : Math.round(Math.min(sh, 18) * 0.7)) + 'px;"></span>' + F.label + '</span><small>' + F.sub.replace("Reel · ", "") + '</small>';
      b.addEventListener("click", function () { setFormat(F.id); renderFormatUI(); rebuildPreview(); }); // [integración]
      seg.appendChild(b);
    });
    $("fmtHint").textContent = fmt().hint.split(". ")[0].replace(/\.$/, "") + "."; // [v8.8] una línea (Facebook sigue apagado)
    document.querySelector(".phone").className = "phone" + (fmt().cls ? " " + fmt().cls : "");
  }

  // ============================================================
  // Vista previa en vivo
  // ============================================================
  let previewRaf = null;
  // [v8.1] Música de la vista previa: se programa por vueltas del video y el
  // reloj de audio manda sobre la animación, así imagen y sonido van juntos.
  let previewSound = false, previewMusic = null;
  function stopPreviewMusic() {
    if (!previewMusic) return;
    clearInterval(previewMusic.timer);
    const c = audioCtx;
    const ch = previewMusic.chain;
    try { ch.out.gain.cancelScheduledValues(0); ch.out.gain.setValueAtTime(ch.out.gain.value, c.currentTime); ch.out.gain.linearRampToValueAtTime(0, c.currentTime + 0.03); } catch (e) {}
    const groups = previewMusic.masters;
    setTimeout(function () {
      groups.forEach(m => { try { m && m.disconnect(); } catch (e) {} });
      try { ch.out.disconnect(); } catch (e) {}
    }, 80);
    previewMusic = null;
  }
  function stopPreview() { if (previewRaf) { cancelAnimationFrame(previewRaf); previewRaf = null; } stopPreviewMusic(); }
  function renderSoundBtn() {
    const b = $("soundBtn");
    if (!audioWanted(STYLES[currentStyle])) { b.style.display = "none"; return; }
    b.style.display = "";
    b.textContent = previewSound ? "🔊 Sonando · Silenciar" : "🔈 Escuchar sonido";
  }
  function rebuildPreview() {
    stopPreview();
    const ctx = els.previewCanvas.getContext("2d");
    const F = fmt();
    const pw = Math.round(F.w * PREVIEW_SCALE), ph = Math.round(F.h * PREVIEW_SCALE);
    if (els.previewCanvas.width !== pw || els.previewCanvas.height !== ph) { els.previewCanvas.width = pw; els.previewCanvas.height = ph; }
    if (!hasEnoughData()) {
      renderSizeEstimate();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = THEMES[currentThemeId].bg; ctx.fillRect(0, 0, pw, ph);
      els.emptyState.style.display = "block";
      return;
    }
    els.emptyState.style.display = "none";
    renderSizeEstimate();
    const style = STYLES[currentStyle], tl = style.buildTimeline(currentData()), opts = currentOpts();
    const draw = makeRenderer(style, tl, opts, els.previewCanvas, F, PREVIEW_SCALE);
    let clock;
    const c = audioCtx;
    if (previewSound && audioWanted(style) && c && c.state === "running") {
      const period = (tl.total / opts.speed) / FPS, start = c.currentTime + 0.08;
      const pm = { masters: [], next: 0, timer: null, chain: makeMixChain(c, c.destination) };
      const queue = function () {
        while (c.currentTime > start + pm.next * period - 1.5) {
          pm.masters.push(scheduleAudio(c, pm.chain, start + pm.next * period, period, style, tl, opts));
          pm.next++;
          if (pm.masters.length > 3) { const old = pm.masters.shift(); setTimeout(() => { try { old && old.disconnect(); } catch (e) {} }, (period + 1) * 1000); }
        }
      };
      queue(); pm.timer = setInterval(queue, 250);
      previewMusic = pm;
      clock = () => Math.max(0, (c.currentTime - start) * 1000);
    } else {
      const startedAt = performance.now();
      clock = () => performance.now() - startedAt;
    }
    (function tick() {
      draw(Math.floor(clock() / MS_PER_FRAME) * opts.speed);
      previewRaf = requestAnimationFrame(tick);
    })();
  }

  // ============================================================
  // Exportación
  // ============================================================
  function setStatus(text, kind) { els.statusMsg.textContent = text; els.statusMsg.className = "status show" + (kind ? " " + kind : ""); }
  function clearStatus() { els.statusMsg.className = "status"; els.statusMsg.textContent = ""; }
  function setProgress(pct, label) {
    els.progressWrap.className = "progress-wrap show";
    els.progressFill.style.width = clamp(pct, 0, 100) + "%";
    els.progressPct.textContent = Math.round(pct) + "%";
    els.progressText.textContent = label;
    els.progressTrack.setAttribute("aria-valuenow", String(Math.round(pct)));
  }
  function hideProgress() { els.progressWrap.className = "progress-wrap"; }


  // [v8.7] Compartir con el menú nativo del teléfono (WhatsApp, Instagram,
  // Telegram…). Sin backend ni aprobación de Meta. Tiene que ser un toque
  // aparte (los navegadores solo dejan compartir justo después de un toque).
  let shareFile = null;
  function prepareShare(blob, filename) {
    shareFile = null;
    const btn = $("shareBtn");
    try {
      const f = new File([blob], filename, { type: blob.type || "video/mp4" });
      if (navigator.canShare && navigator.canShare({ files: [f] })) { shareFile = f; btn.style.display = "block"; return; }
    } catch (e) { /* sin soporte */ }
    btn.style.display = "none";
  }
  $("shareBtn").addEventListener("click", async function () {
    if (!shareFile) { toast("Este navegador no permite compartir archivos. Usa \"Descargar video\"."); return; }
    let text = "";
    try { text = buildCaption("directo", captionContext(), false); } catch (e) { text = ""; }
    try { await navigator.share({ files: [shareFile], title: currentOpts().storeName, text: text }); }
    catch (e) { if (!e || e.name !== "AbortError") toast("No se pudo abrir el menú de compartir. Usa \"Descargar video\"."); }
  });

  els.generateBtn.addEventListener("click", async function () {
    if (audioWanted(STYLES[currentStyle])) unlockAudio();
    if (!hasEnoughData()) {
      const msg = currentStyle === "secuencial" ? "Escribe al menos una frase."
        : currentStyle === "antesdespues" ? "Añade al menos una comparación."
        : currentStyle === "directo" ? "Escribe el título del producto."
        : "Añade al menos 2 productos.";
      setStatus(msg, "error");
      return;
    }
    clearStatus();
    els.downloadLink.style.display = "none";
    $("shareBtn").style.display = "none";
    $("shareNote").style.display = "none";
    els.exportDetail.textContent = ""; $("diagLine").textContent = "";
    els.generateBtn.disabled = true; els.generateBtn.textContent = "Generando…";
    const cancelBtn = $("cancelBtn"); cancelBtn.disabled = false; cancelBtn.textContent = "Cancelar";
    stopPreview();
    setProgress(0, "Preparando…");
    const style = STYLES[currentStyle], tl = style.buildTimeline(currentData()), opts = currentOpts();
    const t0 = performance.now();
    try {
      const r = await exportVideo(style, tl, opts, els.previewCanvas);
      const blob = r.blob, codec = r.ext === "mp4", secs = (performance.now() - t0) / 1000;
      const name = opts.storeName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "retador";
      els.downloadLink.href = URL.createObjectURL(blob);
      els.downloadLink.download = name + "-promo-" + fmt().id + "." + r.ext;
      els.downloadLink.style.display = "block";
      prepareShare(blob, els.downloadLink.download);
      $("shareNote").style.display = "";
      els.exportDetail.textContent = "Video " + fmt().label.toLowerCase() + " (." + r.ext + ") · " + audioLabel(r.audio) + "." + (r.note ? " " + r.note : "") + (codec ? "" : " (Modo de compatibilidad.)");
      // [v8.8] línea de diagnóstico: ruta, fps, medidas, peso real y tiempo de generación
      $("diagLine").textContent = r.ruta + " · " + r.fps + " fps · " + r.w + "×" + r.h + " · " + (blob.size / 1048576).toFixed(1).replace(".", ",") + " MB · generado en " + (secs < 60 ? Math.round(secs) + " s" : Math.floor(secs / 60) + " min " + Math.round(secs % 60) + " s") + (PROBAR_OPUS ? " · modo prueba Opus" : "");
      setStatus(shareFile ? "Video listo. Descárgalo o compártelo directo." : "Video listo. Ya puedes descargarlo.", "success");
    } catch (err) {
      if (err && err.cancelado) setStatus("Generación cancelada. Puedes cambiar lo que quieras y volver a generar.", "");
      else setStatus((err && err.message) || "No se pudo generar el video.", "error");
    } finally {
      els.generateBtn.disabled = false; els.generateBtn.textContent = "Generar y descargar video";
      hideProgress(); rebuildPreview();
    }
  });
  // [v8.8] Cancelar a mitad de la generación
  $("cancelBtn").addEventListener("click", function () { cancelExport(); this.disabled = true; this.textContent = "Cancelando…"; });

  // ============================================================
  // [v8.0] Catálogo de la tienda (simulado — fotos de ejemplo, no son productos
  // reales) y el selector "🏷️ Seleccionar producto de tu tienda" que
  // aparece junto a CADA foto, en cualquier estilo. Un solo lugar por
  // campo: elegir un producto rellena esa foto (y su precio) ahí mismo.
  // ============================================================
  // [integración] Productos REALES publicados por el vendedor. Los manda la app:
  // tabla products con status="active", moderation_status="approved", sin
  // archivar y kind="product" → { id, title, price, currency, stock, image }.
  let CATALOG = (P.productos || []).slice();
  // products.currency usa los mismos códigos que CURRENCIES del prototipo (USD, EUR, CUP).
  const PRODUCT_CURRENCY = { USD: "USD", EUR: "EUR", CUP: "CUP" };
  const NO_CORS_PHOTO = "La foto de este producto no se puede usar en el video. Súbela desde tu teléfono con \"Usar foto de tu producto\".";
  // La foto se pide con permiso CORS: si su servidor no lo da, el canvas quedaría
  // "contaminado" y la exportación fallaría, así que en ese caso no se usa.
  function loadProductPhoto(url) {
    return new Promise(function (resolve) {
      if (!url) { resolve(null); return; }
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }
  function pickRealProduct(item, onPick) {
    loadProductPhoto(item.image).then(function (img) {
      if (!img && item.image) toast(NO_CORS_PHOTO);
      if (PRODUCT_CURRENCY[item.currency]) setCurrency(PRODUCT_CURRENCY[item.currency]);
      onPick(item, img);
    });
  }

  const pickScrim = $("pickScrim"), pickSheet = $("pickSheet");
  pickScrim.addEventListener("click", function (e) { if (e.target === pickScrim) pickScrim.className = "scrim"; });
  function openProductPicker(onPick) {
    pickSheet.innerHTML =
      '<div class="sheet-grab"></div><h2>Selecciona un producto</h2>' +
      '<p class="sheet-hint">' + (CATALOG.length ? 'Se precarga su foto y su precio aquí mismo.' : 'Todavía no tienes productos publicados en tu tienda.') + '</p>' + // [integración]
      '<div class="catalog-row" id="pickCatalogRow"></div>' +
      '<button class="ghost" id="pickCancel" style="width:100%;">Cancelar</button>';
    const row = $("pickCatalogRow");
    CATALOG.forEach(function (item) { // [integración] datos reales: se escapan (texto del vendedor)
      const btn = document.createElement("button");
      btn.type = "button"; btn.className = "catalog-card";
      btn.innerHTML = '<img src="' + escHtml(item.image || "").replace(/"/g, "&quot;") + '" alt=""><b>' + escHtml(item.title) + '</b><span>' + escHtml(fmtPrice(item.price)) + '</span>';
      btn.addEventListener("click", function () { pickScrim.className = "scrim"; pickRealProduct(item, onPick); });
      row.appendChild(btn);
    });
    $("pickCancel").addEventListener("click", () => { pickScrim.className = "scrim"; });
    pickScrim.className = "scrim on";
  }

  // ============================================================
  // [v8.0] Publicar en Facebook — conectar página (simulado) + publicar
  // (la grabación del video SÍ es real: usa el mismo exportMp4 / exportWebm
  // que "Generar y descargar video"; lo demás — subir, llamar a Meta,
  // procesar — se simula porque aún no existe el backend ni la app de Meta)
  // ============================================================
  // [integración] Sin páginas de ejemplo: las da el backend (ver facebook.js).
  let FB_PAGES = [], fbPageId = null;
  let fbConnected = false, fbPage = null, fbBusy = false;
  const fbScrim = $("fbScrim"), fbSheet = $("fbSheet"), toastEl = $("toast");

  function toast(msg) {
    toastEl.textContent = msg; toastEl.style.display = "block";
    clearTimeout(toast._t); toast._t = setTimeout(() => { toastEl.style.display = "none"; }, 2600);
  }
  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
  function openFbSheet(html) { fbSheet.innerHTML = '<div class="sheet-grab"></div>' + html; fbScrim.className = "scrim on"; }
  function closeFbSheet() {
    if (fbBusy) return;
    const hadCompose = !!composeRaf;
    stopComposeLoop();
    fbScrim.className = "scrim"; fbSheet.innerHTML = "";
    if (hadCompose) rebuildPreview();
  }
  fbScrim.addEventListener("click", function (e) { if (e.target === fbScrim) closeFbSheet(); });

  // ============================================================
  // [v8.0] Texto de la publicación — plantillas deterministas (sin IA),
  // precargadas con los datos del producto elegido de la tienda.
  // ============================================================
  // [integración] Dominio y rutas reales: los mismos enlaces de invitado que ya
  // abren la app sin cuenta (?openProduct= / ?openProfile=, ver App.jsx).
  const LINK_BASE = "retadormarketplace.es";
  function slugify(t) { return String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "tienda"; }
  function storeUrl(opts) { return P.vendedorId ? LINK_BASE + "/?openProfile=" + P.vendedorId : LINK_BASE; } // [integración]
  function productUrl(p) { return LINK_BASE + "/?openProduct=" + p.id; } // [integración]

  // Reúne lo que el texto necesita saber, según el estilo actual.
  function captionContext() {
    const data = currentData(), opts = currentOpts();
    const store = opts.storeName, sUrl = storeUrl(opts);
    if (currentStyle === "directo") {
      const it = data.item || {}, p = it.product;
      return { kind: "single", store: store, storeUrl: sUrl,
        title: (data.headline || (p && p.title) || "").trim(),
        price: fmtPrice(it.priceNow || (p && p.price) || ""),
        stock: p ? p.stock : null,
        url: p ? productUrl(p) : sUrl };
    }
    const items = (data.items || []).filter(Boolean);
    const linked = items.filter(i => i.product);
    if (linked.length === 1 && items.length <= 1) {
      const p = linked[0].product;
      return { kind: "single", store: store, storeUrl: sUrl, title: p.title, price: fmtPrice(linked[0].priceNow || p.price), stock: p.stock, url: productUrl(p) };
    }
    const list = items.map(function (i) {
      const name = i.product ? i.product.title : (i.label || "");
      return { name: name, price: fmtPrice(i.priceNow || (i.product && i.product.price) || "") };
    }).filter(x => x.name);
    const head = (data.headline || (data.scenes && data.scenes[0] && data.scenes[0].text) || "").trim();
    return { kind: "multi", store: store, storeUrl: sUrl, head: head, list: list.slice(0, 5) };
  }

  const CAPTION_TEMPLATES = [
    { id: "directo", label: "Directo" },
    { id: "oferta", label: "🔥 Oferta" },
    { id: "sencillo", label: "Sin emojis" }
  ];
  function buildCaption(tplId, c, withTags) {
    const L = [];
    if (c.kind === "single") {
      const title = c.title || "Producto nuevo";
      if (tplId === "oferta") {
        L.push("🔥 ¡OFERTA EN " + c.store.toUpperCase() + "! 🔥", "");
        L.push(title + (c.price ? " a solo " + c.price : ""));
        if (c.stock != null && c.stock <= 5) L.push("⏳ ¡Solo quedan " + c.stock + "! No te quedes sin el tuyo");
        else L.push("⏳ Unidades limitadas — no te quedes sin el tuyo");
        L.push("", "👉 Pídelo ya: " + c.url);
      } else if (tplId === "sencillo") {
        L.push(title);
        if (c.price) L.push("Precio: " + c.price);
        if (c.stock != null) L.push("Disponibles: " + c.stock);
        L.push("", "Pídelo en mi tienda " + c.store + ": " + c.url);
      } else {
        L.push(title + " 🛒");
        if (c.price) L.push("💵 " + c.price);
        if (c.stock != null) L.push("📦 Quedan " + c.stock + " disponibles");
        L.push("👉 Pídelo aquí: " + c.url, "", "Cómpralo en mi tienda " + c.store);
      }
    } else {
      const rows = c.list.map(x => x.price ? x.name + " — " + x.price : x.name);
      if (tplId === "oferta") {
        L.push("🔥 ¡OFERTAS EN " + c.store.toUpperCase() + "! 🔥", "");
        if (c.head) L.push(c.head, "");
        rows.forEach(r => L.push("✅ " + r));
        L.push("", "⏳ Por tiempo limitado", "👉 Mira todo aquí: " + c.storeUrl);
      } else if (tplId === "sencillo") {
        L.push(c.head || ("Novedades en mi tienda " + c.store));
        if (rows.length) { L.push(""); rows.forEach(r => L.push("- " + r)); }
        L.push("", "Pide en mi tienda " + c.store + ": " + c.storeUrl);
      } else {
        L.push((c.head || ("Mira lo que tengo en mi tienda " + c.store)) + " 🛍️");
        if (rows.length) { L.push(""); rows.forEach(r => L.push("• " + r)); }
        L.push("", "👉 Ver todo: " + c.storeUrl);
      }
    }
    if (withTags) L.push("", "#" + slugify(c.store).replace(/-/g, "") + " #RETADOR #ComprasOnline");
    return L.join("\n");
  }

  function escHtml(t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function captionToHtml(t) {
    if (!t.trim()) return '<span class="empty">Sin texto — tu video saldrá solo.</span>';
    return escHtml(t).replace(/((?:https?:\/\/)?[a-z0-9.-]+\.[a-z]{2,}\/[^\s]*)/gi, '<span class="lnk">$1</span>')
      .replace(/(^|\s)(#[\wáéíóúñ]+)/gi, '$1<span class="lnk">$2</span>');
  }

  // Estado del paso de texto (se conserva mientras la hoja esté abierta)
  let composeRaf = null;
  const compose = { tpl: "directo", tags: false, edited: false };
  function stopComposeLoop() { if (composeRaf) cancelAnimationFrame(composeRaf); composeRaf = null; }

  function showCaptionStep(keepText) {
    const ctxInfo = captionContext();
    const prevText = keepText != null ? keepText : null;
    openFbSheet(
      '<h2>Texto de tu publicación</h2>' +
      '<span class="fmt-tag">' + (fmt().fb === "reel" ? "Se publicará como Reel (vertical)" : "Se publicará como video en tu página (" + fmt().label.toLowerCase() + ")") + '</span>' +
      '<p class="sheet-hint">Lo armamos con los datos de tu producto. Elige un estilo de texto o escríbelo a tu manera. Para cambiar el formato, usa "Formato del video" junto al botón de publicar.</p>' +
      '<div class="cap-chips" id="capChips">' + CAPTION_TEMPLATES.map(t =>
        '<button type="button" class="cap-chip" data-t="' + t.id + '" aria-pressed="false">' + t.label + '</button>').join("") + '</div>' +
      '<textarea class="cap-text" id="capText" maxlength="2200" aria-label="Texto de la publicación"></textarea>' +
      '<div class="cap-meta"><label><input type="checkbox" id="capTags"> Añadir hashtags</label>' +
      '<span id="capCount"></span><button type="button" id="capReset">↺ Restablecer</button></div>' +
      '<div class="cap-section">Así se verá en Facebook</div>' +
      '<div class="fb-post"><div class="fb-post-head"><span class="av">' + escHtml(fbPage.charAt(0)) + '</span>' +
      '<span><b>' + escHtml(fbPage) + '</b><small>Ahora · 🌐</small></span></div>' +
      '<div class="fb-post-text" id="capPreview"></div>' +
      '<div class="fb-post-video' + (fmt().id === "feed" ? " feed" : fmt().id === "cuadrado" ? " square" : "") + '"><canvas id="capCanvas" width="' + fmt().w + '" height="' + fmt().h + '"></canvas></div>' +
      '<div class="fb-post-foot"><span>👍 Me gusta</span><span>💬 Comentar</span><span>↗ Compartir</span></div></div>' +
      '<button class="fb-btn" id="capPublish"><span class="fb-glyph">f</span>Publicar en ' + escHtml(fbPage) + '</button>' +
      '<button class="ghost" id="capBack" style="width:100%;">Volver a editar el video</button>'
    );
    const ta = $("capText"), prev = $("capPreview"), count = $("capCount"), tags = $("capTags");
    tags.checked = compose.tags;
    function paintChips() {
      Array.prototype.forEach.call(document.querySelectorAll(".cap-chip"), b =>
        b.setAttribute("aria-pressed", (!compose.edited && b.dataset.t === compose.tpl) ? "true" : "false"));
    }
    function paint() { prev.innerHTML = captionToHtml(ta.value); count.textContent = ta.value.length + " caracteres"; }
    function regenerate() { ta.value = buildCaption(compose.tpl, ctxInfo, compose.tags); compose.edited = false; paintChips(); paint(); }
    if (prevText != null && compose.edited) { ta.value = prevText; paintChips(); paint(); } else regenerate();

    $("capChips").addEventListener("click", function (e) {
      const b = e.target.closest(".cap-chip"); if (!b) return;
      compose.tpl = b.dataset.t; regenerate();
    });
    ta.addEventListener("input", function () { compose.edited = true; paintChips(); paint(); });
    tags.addEventListener("change", function () {
      compose.tags = tags.checked;
      if (!compose.edited) { regenerate(); return; }
      const tagLine = "#" + slugify(ctxInfo.store).replace(/-/g, "") + " #RETADOR #ComprasOnline";
      if (tags.checked && ta.value.indexOf(tagLine) < 0) ta.value = ta.value.replace(/\s*$/, "") + "\n\n" + tagLine;
      if (!tags.checked) ta.value = ta.value.replace("\n\n" + tagLine, "").replace(tagLine, "");
      paint();
    });
    $("capReset").addEventListener("click", regenerate);
    $("capBack").addEventListener("click", function () { stopComposeLoop(); closeFbSheet(); rebuildPreview(); });
    $("capPublish").addEventListener("click", function () {
      if (audioWanted(STYLES[currentStyle])) unlockAudio();
      const finalText = ta.value;
      stopComposeLoop();
      runFbPublish(finalText);
    });

    // Vista previa del video dentro del post (misma animación que se publicará)
    stopPreview();
    const style = STYLES[currentStyle], tl = style.buildTimeline(currentData()), opts = currentOpts();
    const drawCap = makeRenderer(style, tl, opts, $("capCanvas"), null, PREVIEW_SCALE), t0 = performance.now();
    stopComposeLoop();
    (function loop(now) {
      const c = $("capCanvas"); if (!c) { composeRaf = null; return; }
      drawCap(Math.floor((now - t0) / MS_PER_FRAME) * opts.speed);
      composeRaf = requestAnimationFrame(loop);
    })(t0);
  }

  els.fbPublishBtn = $("fbPublishBtn");
  els.fbPublishBtn.addEventListener("click", startFbFlow);

  function startFbFlow() {
    if (fbBusy) return;
    if (!hasEnoughData()) {
      const msg = currentStyle === "secuencial" ? "Escribe al menos una frase antes de publicar."
        : currentStyle === "antesdespues" ? "Añade al menos una comparación antes de publicar."
        : currentStyle === "directo" ? "Escribe el título del producto antes de publicar."
        : "Añade al menos 2 productos antes de publicar.";
      toast(msg);
      return;
    }
    if (!fbConnected) showFbConnect(); else showCaptionStep();
  }

  function showFbConnect() {
    openFbSheet(
      '<h2>Conecta tu página de Facebook</h2>' +
      '<p class="sheet-hint">Para publicar necesitas conectar la página de tu tienda. Solo lo haces una vez.</p>' +
      '<button class="fb-btn" id="fbGo"><span class="fb-glyph">f</span>Continuar con Facebook</button>' +
      '<button class="ghost" id="fbCancel" style="width:100%;">Ahora no</button>' +
      '<p class="export-detail" style="margin-top:12px;">RETADOR solo publicará cuando tú toques "Publicar en Facebook".</p>'
    );
    $("fbGo").addEventListener("click", async function () { // [integración] conexión real vía backend
      try { await fbConectar(); FB_PAGES = await fbListarPaginas(); showFbPagePicker(); }
      catch (e) { toast((e && e.message) || "No se pudo conectar con Facebook."); }
    });
    $("fbCancel").addEventListener("click", closeFbSheet);
  }

  function showFbPagePicker() {
    let sel = 0;
    openFbSheet(
      '<h2>Elige la página de tu tienda</h2>' +
      '<p class="sheet-hint">RETADOR podrá publicar videos en la página que elijas.</p>' +
      '<div class="fb-page-pick" id="fbPagePick">' + FB_PAGES.map((p, i) =>
        '<button type="button" class="fb-page" data-i="' + i + '" aria-pressed="' + (i === 0) + '"><span class="av">' + p.i + '</span><span><b>' + p.n + '</b><small>Administrador</small></span></button>'
      ).join("") + '</div>' +
      '<button class="fb-btn" id="fbConfirm"><span class="fb-glyph">f</span>Conectar página</button>'
    );
    $("fbPagePick").addEventListener("click", function (e) {
      const b = e.target.closest(".fb-page"); if (!b) return;
      sel = Number(b.dataset.i);
      Array.prototype.forEach.call(document.querySelectorAll(".fb-page"), x => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
    });
    $("fbConfirm").addEventListener("click", function () {
      fbConnected = true; fbPage = FB_PAGES[sel].n; fbPageId = FB_PAGES[sel].id; // [integración]
      toast("Página conectada");
      showCaptionStep();
    });
  }

  function setFbStep(i, cls, detail) {
    const li = fbSheet.querySelector('.fb-steps li[data-s="' + i + '"]');
    if (!li) return;
    li.className = cls;
    if (detail !== undefined) li.querySelector("small").innerHTML = detail;
  }
  function setFbBar(pct, label) {
    const bar = $("fbBar"), lbl = $("fbBarLabel");
    if (bar) bar.style.width = clamp(pct, 0, 100) + "%";
    if (lbl && label) lbl.textContent = label;
  }

  let lastCaption = "";
  async function runFbPublish(captionText) {
    if (typeof captionText === "string") lastCaption = captionText;
    fbBusy = true;
    openFbSheet(
      '<h2>Publicando en ' + fbPage + '</h2>' +
      '<p class="sheet-hint">No cierres esta pantalla. Tarda unos segundos.</p>' +
      '<ol class="fb-steps">' +
      '<li data-s="1" class="run"><span class="ic"></span><span style="flex:1;"><b>Creando el video</b><small>Grabando fotograma a fotograma…</small><div class="fb-meter"><i id="fbBar"></i></div><small id="fbBarLabel" style="display:block;margin-top:3px;"></small></span></li>' +
      '<li data-s="2"><span class="ic"></span><span><b>Enviando a RETADOR</b><small></small></span></li>' +
      '<li data-s="3"><span class="ic"></span><span><b>' + (fmt().fb === "reel" ? "Publicando como Reel" : "Publicando en tu página") + '</b><small></small></span></li>' +
      '<li data-s="4"><span class="ic"></span><span><b>Facebook está procesando el video</b><small></small></span></li>' +
      '</ol><div id="fbEnd"></div>'
    );
    stopPreview();
    const style = STYLES[currentStyle], data = currentData(), tl = style.buildTimeline(data), opts = currentOpts();
    const originalSetProgress = setProgress;
    setProgress = function (pct, label) { setFbBar(pct, label); };
    let blob = null, err = null, isMp4 = false, expInfo = null;
    try {
      expInfo = await exportVideo(style, tl, opts, els.previewCanvas);
      blob = expInfo.blob; isMp4 = expInfo.ext === "mp4";
    } catch (e) { err = e; }
    setProgress = originalSetProgress;
    rebuildPreview();
    if (err || !blob) {
      setFbStep(1, "error", (err && err.message) || "No se pudo generar el video.");
      fbBusy = false;
      return;
    }
    setFbStep(1, "done", "Video listo · " + fmt().label + " " + outDims().w + "×" + outDims().h + " · " + (isMp4 ? "MP4" : "WebM") + " · " +
      audioLabel(expInfo.audio) + " · " + (blob.size / 1048576).toFixed(1) + " MB" + (expInfo.note ? "<br>" + expInfo.note : ""));

    // [integración] Subida y publicación reales por el backend (nada simulado).
    let paso = 2, link = "";
    try {
      setFbStep(2, "run", "Subiendo el video…");
      const subida = await fbSubirVideo(blob, { ext: expInfo.ext });
      setFbStep(2, "done", "Recibido por RETADOR");
      paso = 3; setFbStep(3, "run", "El servidor envía el video a tu página…");
      const pub = await fbPublicar({ subidaId: subida.id, paginaId: fbPageId, texto: lastCaption, tipo: fmt().fb });
      setFbStep(3, "done", "Meta recibió el video");
      paso = 4; setFbStep(4, "run", "Esto puede tardar unos segundos");
      const fin = await fbEsperarProcesado(pub.id);
      setFbStep(4, "done", "Publicado");
      link = fin.enlace;
    } catch (e) {
      setFbStep(paso, "error", escHtml((e && e.message) || "No se pudo publicar."));
      fbBusy = false;
      return;
    }

    const caption = lastCaption;
    $("fbEnd").innerHTML =
      '<div class="fb-result"><h3>' + (fmt().fb === "reel" ? "Tu Reel ya está en Facebook" : "Tu video ya está en Facebook") + '</h3>' +
      '<a href="' + escHtml(link) + '" target="_blank" rel="noopener" id="fbViewLink">' + escHtml(link) + '</a>' + (caption.trim() ? '<pre>' + escHtml(caption) + '</pre>' : '<pre>(Publicado sin texto)</pre>') + '</div>' +
      '<button class="fb-btn" id="fbDone"><span class="fb-glyph">f</span>Listo</button>' +
      '<button class="ghost" id="fbAgain" style="width:100%;">Publicar de nuevo</button>';
    fbBusy = false;
    $("fbDone").addEventListener("click", closeFbSheet);
    $("fbAgain").addEventListener("click", function () { showCaptionStep(lastCaption); });
  }

  // ---------- Inicio ----------
  // [integración] Datos reales de la plataforma antes del primer dibujo.
  setProgressHandler(function (pct, label) { setProgress(pct, label); });
  setPlan(P.conMarcaDeAgua === false ? "pro" : "gratis");
  if (/^#[0-9a-f]{6}$/i.test(P.acento || "")) { els.accentColor.value = P.acento; els.accentColorHex.textContent = P.acento.toUpperCase(); }
  els.storeName.value = P.nombreTienda || "";
  if (!FACEBOOK_PUBLICAR) els.fbPublishBtn.style.display = "none";
  $("planLink").addEventListener("click", function () { if (P.onPlanes) P.onPlanes(); });
  renderTabs();
  renderStyleCarousel();
  renderThemeGrid();
  renderFieldsCard();
  renderReviewEditor();
  renderFormatUI();
  renderQualityUI();
  renderFpsUI(); // [v8.8]
  renderPlanNotice(); // [integración]
  renderAccentSwatches();
  renderMusicUI();
  renderSoundBtn();
  rebuildPreview();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(rebuildPreview);

  // [integración] Entrada desde "Producto publicado": estilo Directo con ESE
  // producto ya cargado (lo mismo que hace elegirlo en "Selecciona un producto").
  if (P.inicial && P.inicial.producto) {
    const pr = P.inicial.producto;
    selectStyle(P.inicial.estilo || "directo", true);
    pickRealProduct(pr, function (product, img) {
      directoState.item.photo = img; directoState.item.product = product; openPickerKey = null;
      directoState.item.priceNow = product.price;
      directoState.headline = product.title;
      refreshFields();
    });
  }

  // [integración] La app puede mandar datos nuevos (plan cargado tarde, productos).
  return {
    actualizar: function (N) {
      if (!N) return;
      if ("conMarcaDeAgua" in N) { setPlan(N.conMarcaDeAgua === false ? "pro" : "gratis"); renderPlanNotice(); rebuildPreview(); }
      if (N.productos) CATALOG = N.productos.slice();
    }
  };
}
