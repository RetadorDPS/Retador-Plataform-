// ═════════════════════════════════════════════════════════════════════════════
// Generador de Video Promocional — EDITOR (interfaz)
// Reconstrucción en React del editor del prototipo aprobado, con todas sus
// funciones. El dibujo y la exportación viven en ./engine.js (copiado tal
// cual del prototipo). Todo ocurre en el dispositivo: nada se sube a ningún
// servidor. Cero IA.
//
// Props (las decide App.jsx con getPlanPerks, único lugar de la regla de plan):
//   conMarcaDeAgua  true = plan gratis / desconocido → video con "Hecho con RETADOR"
//   accentDeMarca   color de marca de Diseño (store_config.accent) o null
//   nombreTienda    nombre de tienda de Diseño (store_config.name) o ""
//   dark            tema real de la app
//   onClose, onOpenPlans
// ═════════════════════════════════════════════════════════════════════════════
import { useState, useEffect, useRef, useMemo, useId } from "react";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "@fontsource/manrope/800.css";
import { PROMO_VIDEO_CSS } from "./styles.js";
import {
  W, H, MS_PER_FRAME, clamp,
  THEMES, THEME_ORDER, QUICK_EMOJIS, EMOJI_CATS, extractEmoji,
  CURRENCIES, parsePrice, discountPct, REVIEW_POSITIONS,
  STYLES, STYLE_ORDER, pickAvcCodec, exportMp4, exportWebm,
  setCurrency, setBackgroundPhoto, setProgressHandler, loadWatermarkLogo, withWatermark,
} from "./engine.js";

// Logo de la marca de agua: del MISMO dominio de la app (evita canvas contaminado).
const LOGO_SRC = import.meta.env.BASE_URL + "icons/icon-192.png";
const DEFAULT_ACCENT = "#F26B0F";
const isHex = (v) => typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v.trim());

const TABS = [
  { id: "contenido", label: "Contenido" },
  { id: "marca", label: "Marca" },
  { id: "tema", label: "Tema" },
  { id: "extras", label: "Extras" },
];

// Contenido inicial: el mismo del prototipo.
function initialData() {
  return {
    acercamiento: {
      headline: "Llegó lo que estabas esperando", keyword: "esperando",
      items: [{ icon: "🛍️", photo: null }, { icon: "👟", photo: null }, { icon: "🎁", photo: null }],
    },
    noria: {
      headline: "Todo en un solo lugar", keyword: "un solo lugar",
      items: [{ icon: "🏪", photo: null }, { icon: "📱", photo: null }, { icon: "🚚", photo: null }],
    },
    secuencial: {
      scenes: [
        { text: "Tu tienda, lista en minutos", icon: "🏪", photo: null },
        { text: "Sube tus productos fácil", icon: "📦", photo: null },
        { text: "Chatea directo con tus clientes", icon: "💬", photo: null },
      ],
    },
    mosaico: {
      headline: "Descubre nuestro catálogo", keyword: "catálogo",
      items: [{ icon: "🏪", photo: null }, { icon: "👗", photo: null }, { icon: "👟", photo: null }, { icon: "🎒", photo: null }],
    },
    antesdespues: {
      headline: "El antes y el después", keyword: "después",
      pairs: [{
        before: { icon: "😩", photo: null, text: "Buscando en varias tiendas" },
        after: { icon: "😍", photo: null, text: "Todo en RETADOR" },
      }],
    },
  };
}

function setIn(obj, path, fn) {
  if (!path.length) return fn(obj);
  const [k, ...rest] = path;
  const copy = Array.isArray(obj) ? obj.slice() : { ...obj };
  copy[k] = setIn(obj[k], rest, fn);
  return copy;
}

function currentData(styleId, data) {
  if (styleId === "secuencial") return { scenes: data.secuencial.scenes.filter(s => s.text.trim().length > 0) };
  return data[styleId];
}
function hasEnoughData(styleId, data) {
  if (styleId === "secuencial") return currentData(styleId, data).scenes.length > 0;
  if (styleId === "antesdespues") return data.antesdespues.pairs.length > 0;
  return data[styleId].items.length >= 2;
}

function loadImageFile(file) {
  return new Promise(function (resolve, reject) {
    if (file.size > 8 * 1024 * 1024) { reject(new Error("La foto pesa demasiado (máx. 8MB).")); return; }
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("No se pudo leer esa imagen.")); };
    img.src = url;
  });
}

// ─── Piezas del formulario ──────────────────────────────────────────────────
function TextField({ label, value, max, onChange }) {
  const id = useId();
  return (
    <>
      <label className="field-label" htmlFor={id}>{label}</label>
      <input type="text" id={id} maxLength={max} value={value} className="field-gap" onChange={e => onChange(e.target.value)} />
    </>
  );
}

// Botón real (no <label>) que dispara un input de archivo oculto: así se llega con teclado.
function FileButton({ className, children, onFile }) {
  const inputRef = useRef(null);
  return (
    <>
      <button type="button" className={className} onClick={() => inputRef.current?.click()}>{children}</button>
      <input ref={inputRef} type="file" accept="image/*" tabIndex={-1}
        style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
        onChange={e => { const f = e.target.files && e.target.files[0]; e.target.value = ""; if (f) onFile(f); }} />
    </>
  );
}

function PhotoRow({ target, onPatch, onError }) {
  if (target.photo) {
    return (
      <div className="photo-row">
        <img className="photo-thumb" src={target.photo.src} alt="Foto de tu producto" />
        <button type="button" className="remove-photo" onClick={() => onPatch({ photo: null })}>Quitar foto</button>
      </div>
    );
  }
  return (
    <div className="photo-row">
      <FileButton className="upload-btn" onFile={f => loadImageFile(f).then(img => onPatch({ photo: img }, true)).catch(err => onError(err.message))}>
        📷 Usar foto de tu producto
      </FileButton>
    </div>
  );
}

function EmojiPicker({ pickerCat, setPickerCat, onPick }) {
  const [custom, setCustom] = useState("");
  const [note, setNote] = useState("");
  const cat = EMOJI_CATS.find(c => c.id === pickerCat) || EMOJI_CATS[0];
  const usarEmojiPegado = () => {
    const e = extractEmoji(custom);
    if (!e) { setNote("Eso no parece un emoji. Prueba con uno del teclado."); return; }
    onPick(e);
  };
  return (
    <div className="picker">
      <div className="picker-cats">
        {EMOJI_CATS.map(c => (
          <button key={c.id} type="button" className={"cat-chip" + (pickerCat === c.id ? " active" : "")} onClick={() => setPickerCat(c.id)}>{c.label}</button>
        ))}
      </div>
      <div className="picker-grid">
        {cat.list.map(e => <button key={e} type="button" aria-label={"Usar " + e} onClick={() => onPick(e)}>{e}</button>)}
      </div>
      <div className="picker-custom">
        <input type="text" placeholder="O pega cualquier emoji de tu teclado 😀" aria-label="Pegar un emoji" value={custom}
          onChange={e => setCustom(e.target.value)} onKeyDown={e => { if (e.key === "Enter") usarEmojiPegado(); }} />
        <button type="button" onClick={usarEmojiPegado}>Usar</button>
      </div>
      <div className="picker-note">{note}</div>
    </div>
  );
}

// Bloque "Precio con descuento": precio normal (sale tachado) + precio de
// oferta. El % se calcula solo; la casilla decide si se muestra en el video.
function PriceBox({ target, onPatch, currency, onCurrency }) {
  const pct = discountPct(target);
  const b = parsePrice(target.priceBefore), n = parsePrice(target.priceNow);
  const pctText = pct
    ? <>Descuento calculado: <strong>{pct}%</strong> — mostrar en el video</>
    : (b !== null && n !== null && n >= b)
      ? "El precio de oferta debe ser menor que el normal para calcular el %"
      : "Escribe los dos precios y el % se calcula solo";
  const field = (labelText, key, ph) => (
    <label className="price-field">
      <span>{labelText}</span>
      <input type="text" inputMode="decimal" placeholder={ph} maxLength={12} value={target[key] || ""} onChange={e => onPatch({ [key]: e.target.value })} />
    </label>
  );
  return (
    <div className="price-box">
      <div className="price-title">🏷️ Precio con descuento <span>(opcional)</span></div>
      <div className="price-row">
        {field("Precio normal (sale tachado)", "priceBefore", "Ej: 120")}
        {field("Precio de oferta", "priceNow", "Ej: 90")}
        <label className="price-field price-cur">
          <span>Moneda</span>
          <select value={currency} onChange={e => onCurrency(e.target.value)}>
            {CURRENCIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </label>
      </div>
      <label className={"pct-row" + (pct ? "" : " off")}>
        <input type="checkbox" checked={!!target.showPct} disabled={!pct} onChange={e => onPatch({ showPct: e.target.checked })} />
        <span>{pctText}</span>
      </label>
    </div>
  );
}

function VisualEditor({ target, pickerKey, picker, onPatch, onError, skipPrice, currency, onCurrency }) {
  const { openPickerKey, setOpenPickerKey, pickerCat, setPickerCat } = picker;
  let list = QUICK_EMOJIS.slice();
  if (!target.photo && target.icon && list.indexOf(target.icon) < 0) list = [target.icon].concat(list.slice(0, 7));
  const choose = (e) => { onPatch({ icon: e, photo: null }); setOpenPickerKey(null); };
  const open = openPickerKey === pickerKey;
  return (
    <div>
      <div className="emoji-row">
        {list.map(e => {
          const active = !target.photo && target.icon === e;
          return <button key={e} type="button" className={"emoji-btn" + (active ? " active" : "")} aria-label={"Usar " + e} aria-pressed={active} onClick={() => choose(e)}>{e}</button>;
        })}
        <button type="button" className="emoji-btn more" aria-label="Más emojis" aria-expanded={open}
          onClick={() => setOpenPickerKey(open ? null : pickerKey)}>+</button>
      </div>
      {open && <EmojiPicker pickerCat={pickerCat} setPickerCat={setPickerCat} onPick={choose} />}
      <PhotoRow target={target} onError={onError} onPatch={(p, closePicker) => { onPatch(p); if (closePicker) setOpenPickerKey(null); }} />
      {!skipPrice && <PriceBox target={target} onPatch={onPatch} currency={currency} onCurrency={onCurrency} />}
    </div>
  );
}

// ─── Componente principal ───────────────────────────────────────────────────
export default function PromoVideoTool({ conMarcaDeAgua = true, accentDeMarca = null, nombreTienda = "", dark = false, onClose, onOpenPlans }) {
  const [styleId, setStyleId] = useState("acercamiento");
  const [themeId, setThemeId] = useState("crema");
  const [tab, setTab] = useState("contenido");
  const [size, setSize] = useState(100);
  const [speedPct, setSpeedPct] = useState(100);
  const [openPickerKey, setOpenPickerKey] = useState(null);
  const [pickerCat, setPickerCat] = useState("tienda");
  const [currency, setCurrencyState] = useState("$");
  const [data, setData] = useState(initialData);
  const [storeName, setStoreName] = useState(nombreTienda || "");
  const [cta, setCta] = useState("Pide el tuyo hoy");
  const [accent, setAccent] = useState(isHex(accentDeMarca) ? accentDeMarca.trim() : DEFAULT_ACCENT);
  const [showProgress, setShowProgress] = useState(true);
  const [reviewOn, setReviewOn] = useState(false);
  const [reviews, setReviews] = useState([{ quote: "¡Llegó rapidísimo y como en las fotos!", stars: 5 }]);
  const [reviewPos, setReviewPos] = useState("bl");
  const [urgency, setUrgency] = useState("");
  const [bgPhoto, setBgPhoto] = useState(null);
  const [fontsReady, setFontsReady] = useState(false);
  const [logoReady, setLogoReady] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [prog, setProg] = useState(null);
  const [status, setStatus] = useState(null);
  const [download, setDownload] = useState(null);
  const [exportDetail, setExportDetail] = useState("");
  const [replayKey, setReplayKey] = useState(0);

  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const carouselRef = useRef(null);
  const syncingRef = useRef(false);
  const scrollTimerRef = useRef(null);
  const accentTouched = useRef(false);
  const nameTouched = useRef(false);
  const downloadRef = useRef(null);

  // Los datos de Diseño pueden llegar después de abrir la herramienta: se
  // aplican mientras el vendedor no haya editado ese campo a mano.
  useEffect(() => { if (!accentTouched.current) setAccent(isHex(accentDeMarca) ? accentDeMarca.trim() : DEFAULT_ACCENT); }, [accentDeMarca]);
  useEffect(() => { if (!nameTouched.current) setStoreName((nombreTienda || "").trim()); }, [nombreTienda]);

  // Manrope DEBE estar cargada antes de dibujar/exportar (el canvas no espera
  // a la fuente por su cuenta). El logo de la marca de agua también.
  useEffect(() => {
    let alive = true;
    const loads = ["500", "600", "700", "800"].map(w => document.fonts ? document.fonts.load(w + " 40px Manrope") : Promise.resolve());
    Promise.all(loads).catch(() => {}).then(() => { if (alive) setFontsReady(true); });
    loadWatermarkLogo(LOGO_SRC).then(() => { if (alive) setLogoReady(true); });
    return () => { alive = false; };
  }, []);

  const stopPreview = () => { if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; } };

  useEffect(() => () => {
    stopPreview();
    setProgressHandler(null);
    if (downloadRef.current) URL.revokeObjectURL(downloadRef.current);
  }, []);

  const opts = useMemo(() => ({
    accentColor: accent || DEFAULT_ACCENT,
    storeName: storeName.trim() || "RETADOR",
    cta,
    theme: THEMES[themeId],
    sizeScale: size / 100,
    showProgress,
    urgencyText: urgency.trim(),
    speed: speedPct / 100,
    reviews: reviewOn ? reviews.filter(r => r.quote.trim()).map(r => ({ quote: r.quote.trim(), stars: r.stars })) : [],
    reviewPos,
  }), [accent, storeName, cta, themeId, size, showProgress, urgency, speedPct, reviewOn, reviews, reviewPos]);

  const enough = hasEnoughData(styleId, data);
  const readyToRender = fontsReady && (logoReady || !conMarcaDeAgua);

  // ─── Vista previa en vivo (requestAnimationFrame; la exportación es por fotograma) ───
  useEffect(() => {
    if (exporting) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    stopPreview();
    setCurrency(currency);
    if (!enough) { ctx.fillStyle = THEMES[themeId].bg; ctx.fillRect(0, 0, W, H); return undefined; }
    const base = STYLES[styleId];
    const style = conMarcaDeAgua ? withWatermark(base) : base;
    const tl = base.buildTimeline(currentData(styleId, data));
    const startedAt = performance.now();
    const tick = () => {
      style.renderFrame(ctx, Math.floor((performance.now() - startedAt) / MS_PER_FRAME) * opts.speed, tl, opts);
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
    return stopPreview;
  }, [styleId, data, opts, themeId, currency, conMarcaDeAgua, exporting, enough, replayKey, fontsReady, logoReady, bgPhoto]);

  // ─── Edición del contenido ───
  const patchAt = (path) => (p) => setData(d => setIn(d, path, cur => ({ ...cur, ...p })));
  const setAt = (path, v) => setData(d => setIn(d, path, () => v));
  const picker = { openPickerKey, setOpenPickerKey, pickerCat, setPickerCat };
  const showError = (msg) => setStatus({ text: msg, kind: "error" });
  const veProps = { picker, onError: showError, currency, onCurrency: setCurrencyState };

  // ─── Carrusel de estilos (sincronizado en ambas direcciones) ───
  const applyStyle = (id) => { setStyleId(id); setOpenPickerKey(null); };
  const selectStyle = (id, scroll) => {
    if (id !== styleId) applyStyle(id);
    if (scroll && carouselRef.current) {
      syncingRef.current = true;
      carouselRef.current.scrollTo({ left: STYLE_ORDER.indexOf(id) * carouselRef.current.clientWidth, behavior: "smooth" });
      setTimeout(() => { syncingRef.current = false; }, 450);
    }
  };
  const onCarouselScroll = () => {
    if (syncingRef.current) return;
    clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      const el = carouselRef.current;
      if (!el) return;
      const i = clamp(Math.round(el.scrollLeft / (el.clientWidth || 1)), 0, STYLE_ORDER.length - 1);
      setStyleId(cur => { if (STYLE_ORDER[i] !== cur) { setOpenPickerKey(null); return STYLE_ORDER[i]; } return cur; });
    }, 120);
  };
  const styleIdx = STYLE_ORDER.indexOf(styleId);

  // ─── Exportación ───
  const generar = async () => {
    if (!enough) {
      const msg = styleId === "secuencial" ? "Escribe al menos una frase."
        : styleId === "antesdespues" ? "Añade al menos una comparación."
        : "Añade al menos 2 productos.";
      showError(msg);
      return;
    }
    setStatus(null);
    if (downloadRef.current) { URL.revokeObjectURL(downloadRef.current); downloadRef.current = null; }
    setDownload(null);
    setExportDetail("");
    stopPreview();
    setExporting(true);
    setProg({ pct: 0, label: "Preparando…" });
    setProgressHandler((pct, label) => setProg({ pct: clamp(pct, 0, 100), label }));
    setCurrency(currency);
    const base = STYLES[styleId];
    const style = conMarcaDeAgua ? withWatermark(base) : base;
    const tl = base.buildTimeline(currentData(styleId, data));
    try {
      const codec = await pickAvcCodec();
      const blob = codec ? await exportMp4(style, tl, opts, canvasRef.current, codec) : await exportWebm(style, tl, opts, canvasRef.current);
      const name = opts.storeName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "retador";
      const url = URL.createObjectURL(blob);
      downloadRef.current = url;
      setDownload({ url, name: name + "-promo." + (codec ? "mp4" : "webm") });
      setExportDetail(codec ? "Video en calidad 1080×1920 a 60fps (.mp4)." : "Video listo en formato WebM (modo de compatibilidad).");
      setStatus({ text: "Video listo. Ya puedes descargarlo.", kind: "success" });
    } catch (err) {
      showError((err && err.message) || "No se pudo generar el video.");
    } finally {
      setProgressHandler(null);
      setProg(null);
      setExporting(false);
    }
  };

  // ─── Formularios por estilo ───
  const renderItemList = (key, pk) => {
    const st = data[key];
    return (
      <>
        <TextField label="Titular (se queda fijo arriba)" value={st.headline} max={40} onChange={v => setAt([key, "headline"], v)} />
        <TextField label="Palabra o frase que brilla (debe estar en el titular)" value={st.keyword} max={24} onChange={v => setAt([key, "keyword"], v)} />
        {st.items.map((item, i) => (
          <div className="item" key={i}>
            <div className="item-head">
              <span className="n">Producto {i + 1}</span>
              {st.items.length > 2 && <button type="button" className="remove" onClick={() => { setData(d => setIn(d, [key, "items"], a => a.filter((_, j) => j !== i))); setOpenPickerKey(null); }}>Quitar</button>}
            </div>
            <VisualEditor target={item} pickerKey={pk + ":" + i} onPatch={patchAt([key, "items", i])} {...veProps} />
          </div>
        ))}
        <button type="button" className="add-item" disabled={st.items.length >= 6}
          onClick={() => { if (st.items.length < 6) setData(d => setIn(d, [key, "items"], a => [...a, { icon: "⭐", photo: null }])); }}>+ Añadir producto</button>
      </>
    );
  };

  const renderSceneList = () => {
    const scenes = data.secuencial.scenes;
    return (
      <>
        {scenes.map((scene, i) => (
          <div className="item" key={i}>
            <div className="item-head">
              <span className="n">Escena {i + 1}</span>
              {scenes.length > 1 && <button type="button" className="remove" onClick={() => { setData(d => setIn(d, ["secuencial", "scenes"], a => a.filter((_, j) => j !== i))); setOpenPickerKey(null); }}>Quitar</button>}
            </div>
            <input type="text" maxLength={60} value={scene.text} placeholder="Ej: Envíos a toda Cuba" aria-label={"Texto de la escena " + (i + 1)}
              onChange={e => patchAt(["secuencial", "scenes", i])({ text: e.target.value })} />
            <VisualEditor target={scene} pickerKey={"seq:" + i} onPatch={patchAt(["secuencial", "scenes", i])} {...veProps} />
          </div>
        ))}
        <button type="button" className="add-item" disabled={scenes.length >= 5}
          onClick={() => { if (scenes.length < 5) setData(d => setIn(d, ["secuencial", "scenes"], a => [...a, { text: "", icon: "✨", photo: null }])); }}>+ Añadir escena</button>
      </>
    );
  };

  const renderHalf = (i, side, label) => {
    const half = data.antesdespues.pairs[i][side];
    const path = ["antesdespues", "pairs", i, side];
    return (
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "11.5px", fontWeight: 800, color: "var(--text-muted)", marginBottom: 5 }}>{label}</div>
        <input type="text" maxLength={30} value={half.text || ""} placeholder="Texto corto" className="field-gap" onChange={e => patchAt(path)({ text: e.target.value })} />
        <VisualEditor target={half} pickerKey={"ba" + i + ":" + side} onPatch={patchAt(path)} skipPrice {...veProps} />
      </div>
    );
  };

  const renderAntesDespues = () => {
    const st = data.antesdespues;
    return (
      <>
        <TextField label="Titular (aparece abajo)" value={st.headline} max={40} onChange={v => setAt(["antesdespues", "headline"], v)} />
        <TextField label="Palabra o frase que brilla" value={st.keyword} max={24} onChange={v => setAt(["antesdespues", "keyword"], v)} />
        {st.pairs.map((_, i) => (
          <div className="item" key={i}>
            <div className="item-head">
              <span className="n">Comparación {i + 1}</span>
              {st.pairs.length > 1 && <button type="button" className="remove" onClick={() => { setData(d => setIn(d, ["antesdespues", "pairs"], a => a.filter((_, j) => j !== i))); setOpenPickerKey(null); }}>Quitar</button>}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {renderHalf(i, "before", "ANTES")}
              {renderHalf(i, "after", "DESPUÉS")}
            </div>
          </div>
        ))}
        <button type="button" className="add-item" disabled={st.pairs.length >= 3}
          onClick={() => { if (st.pairs.length < 3) setData(d => setIn(d, ["antesdespues", "pairs"], a => [...a, { before: { icon: "😕", photo: null, text: "" }, after: { icon: "😄", photo: null, text: "" } }])); }}>+ Añadir comparación</button>
      </>
    );
  };

  const renderFields = () => {
    if (styleId === "acercamiento") return renderItemList("acercamiento", "ap");
    if (styleId === "noria") return renderItemList("noria", "no");
    if (styleId === "mosaico") return renderItemList("mosaico", "mo");
    if (styleId === "antesdespues") return renderAntesDespues();
    return renderSceneList();
  };

  const onBgPhoto = (f) => loadImageFile(f).then(img => { setBackgroundPhoto(img); setBgPhoto(img); }).catch(err => showError(err.message));
  const curPos = REVIEW_POSITIONS.find(p => p.id === reviewPos);
  const speedLabel = speedPct === 100 ? "Ideal" : (speedPct / 100).toFixed(2).replace(/0$/, "") + "×";

  return (
    <div className={"rpv" + (dark ? " rpv-dark" : "")}>
      <style>{PROMO_VIDEO_CSS}</style>
      <div className="wrap">
        <button type="button" className="ghost" onClick={onClose} style={{ marginBottom: 14 }}>‹ Volver</button>
        <header className="top">
          <div className="mark">RETA<span>DOR</span></div>
          <div className="sub">Generador de video promocional</div>
        </header>
        <p className="lede">Elige tus productos (fotos o emojis), escribe tu titular y descarga un video vertical listo para Reels, Stories o TikTok.</p>

        <div className="layout">
          <div className="editor-col">
            <div className="tablist" role="tablist">
              {TABS.map(t => (
                <button key={t.id} type="button" className="tab-btn" role="tab" id={"rpv-tab-" + t.id} aria-controls={"rpv-panel-" + t.id}
                  aria-selected={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</button>
              ))}
            </div>

            {tab === "contenido" && (
              <div className="card tab-panel active" role="tabpanel" id="rpv-panel-contenido" aria-labelledby="rpv-tab-contenido">
                <div className="sliders">
                  <div className="slider-row">
                    <label htmlFor="rpv-size">Tamaño de productos</label>
                    <div className="slider-wrap">
                      <div className="slider-track"></div>
                      <input type="range" className="nice-range" id="rpv-size" min="100" max="160" step="5" value={size} onChange={e => setSize(Number(e.target.value))} />
                    </div>
                    <output htmlFor="rpv-size">{size}%</output>
                  </div>
                  <div className="slider-row">
                    <label htmlFor="rpv-speed">Velocidad de animación</label>
                    <div className="slider-wrap">
                      <div className="slider-track"></div>
                      <span className="slider-default" style={{ "--pos": 0.5 }} aria-hidden="true"></span>
                      <input type="range" className="nice-range" id="rpv-speed" min="50" max="150" step="5" value={speedPct} aria-describedby="rpv-speed-hint" onChange={e => setSpeedPct(Number(e.target.value))} />
                    </div>
                    <output htmlFor="rpv-speed">{speedLabel}</output>
                  </div>
                  <p className="hint" id="rpv-speed-hint" style={{ margin: "6px 0 0" }}>La rayita marca la velocidad ideal. Más lenta alarga el video; más rápida lo acorta.</p>
                </div>
                <div>{renderFields()}</div>
              </div>
            )}

            {tab === "marca" && (
              <div className="card tab-panel active" role="tabpanel" id="rpv-panel-marca" aria-labelledby="rpv-tab-marca">
                <p className="hint">Así cierra tu video: el nombre de tu tienda y una frase que invite a comprar.</p>
                <label className="field-label" htmlFor="rpv-store">Nombre de la tienda</label>
                <input type="text" id="rpv-store" maxLength={18} value={storeName} placeholder="Escribe el nombre de tu tienda" className="field-gap"
                  onChange={e => { nameTouched.current = true; setStoreName(e.target.value); }} />
                <label className="field-label" htmlFor="rpv-cta">Frase final (llamado a la acción)</label>
                <input type="text" id="rpv-cta" maxLength={28} value={cta} className="field-gap" onChange={e => setCta(e.target.value)} />
                <label className="field-label" htmlFor="rpv-accent">Color de acento</label>
                <div className="swatch-input">
                  <input type="color" id="rpv-accent" value={accent.toLowerCase()} onChange={e => { accentTouched.current = true; setAccent(e.target.value); }} />
                  <span>{accent.toUpperCase()}</span>
                </div>
                {isHex(accentDeMarca) && <p className="hint" style={{ margin: "8px 0 0" }}>Viene del color de marca de tu tienda (Diseño). Cambiarlo aquí solo afecta a este video.</p>}
              </div>
            )}

            {tab === "tema" && (
              <div className="card tab-panel active" role="tabpanel" id="rpv-panel-tema" aria-labelledby="rpv-tab-tema">
                <p className="hint">Fondo y textos del video. El estilo de animación se elige deslizando en la vista previa.</p>
                <div className="theme-grid">
                  {THEME_ORDER.map(id => {
                    const t = THEMES[id], active = themeId === id;
                    const photoSwatch = t.usesPhoto && bgPhoto;
                    return (
                      <button key={id} type="button" className={"theme-card" + (active ? " active" : "")} aria-pressed={active} onClick={() => setThemeId(id)}>
                        <span className="theme-swatch" style={photoSwatch
                          ? { backgroundImage: "url(" + bgPhoto.src + ")", backgroundSize: "cover", backgroundPosition: "center" }
                          : { background: t.bg, color: t.text, fontSize: t.usesPhoto ? 14 : undefined }}>
                          {photoSwatch ? "" : t.usesPhoto ? "📷" : "Aa"}
                        </span>
                        <strong>{t.label}</strong>
                      </button>
                    );
                  })}
                </div>
                {themeId === "foto" && (
                  <div style={{ marginTop: 10 }}>
                    <div className="photo-row">
                      {bgPhoto && <img className="photo-thumb" src={bgPhoto.src} alt="Foto de fondo" />}
                      <FileButton className="upload-btn" onFile={onBgPhoto}>{bgPhoto ? "Cambiar foto de fondo" : "📷 Subir foto de fondo"}</FileButton>
                    </div>
                    <p className="hint" style={{ margin: "7px 0 0" }}>
                      {bgPhoto ? "Se desenfoca y oscurece sola para que tus productos y textos resalten encima."
                        : "Sube una foto (tu local, tu marca, un ambiente). Mientras tanto se usa fondo oscuro."}
                    </p>
                  </div>
                )}
              </div>
            )}

            {tab === "extras" && (
              <div className="card tab-panel active" role="tabpanel" id="rpv-panel-extras" aria-labelledby="rpv-tab-extras">
                <p className="hint">Opcionales — se apagan solos si los dejas vacíos. Aparecen en los 5 estilos.</p>
                <label className="field-label" style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", marginBottom: 12 }}>
                  <input type="checkbox" checked={showProgress} onChange={e => setShowProgress(e.target.checked)} /> Mostrar barra de progreso abajo
                </label>
                <label className="field-label" style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer" }}>
                  <input type="checkbox" checked={reviewOn} onChange={e => setReviewOn(e.target.checked)} /> Mostrar reseñas de clientes
                </label>
                {reviewOn && (
                  <div>
                    {reviews.map((r, i) => (
                      <div className="review-row" key={i}>
                        <input type="text" maxLength={60} value={r.quote} placeholder="Lo que dijo tu cliente" aria-label={"Reseña " + (i + 1)}
                          onChange={e => setReviews(rs => rs.map((x, j) => j === i ? { ...x, quote: e.target.value } : x))} />
                        <select aria-label={"Estrellas de la reseña " + (i + 1)} value={r.stars}
                          onChange={e => setReviews(rs => rs.map((x, j) => j === i ? { ...x, stars: Number(e.target.value) } : x))}>
                          {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} ★</option>)}
                        </select>
                        <button type="button" aria-label={"Quitar reseña " + (i + 1)} style={{ visibility: reviews.length > 1 ? "visible" : "hidden" }}
                          onClick={() => setReviews(rs => rs.filter((_, j) => j !== i))}>✕</button>
                      </div>
                    ))}
                    <button type="button" className="add-item" disabled={reviews.length >= 4}
                      onClick={() => { if (reviews.length < 4) setReviews(rs => [...rs, { quote: "", stars: 5 }]); }}>+ Añadir reseña</button>
                    <div className="pos-wrap">
                      <div className="pos-phone" role="group" aria-label="Posición de las reseñas en la pantalla">
                        {REVIEW_POSITIONS.map(p => (
                          <button key={p.id} type="button" className={p.id === reviewPos ? "active" : ""} aria-label={p.label} aria-pressed={p.id === reviewPos} onClick={() => setReviewPos(p.id)} />
                        ))}
                      </div>
                      <div className="pos-label"><strong>Dónde aparecen</strong>{curPos.label}. Toca un recuadro del teléfono para moverlas donde no tapen tus productos.</div>
                    </div>
                  </div>
                )}
                <label className="field-label" htmlFor="rpv-urgency" style={{ marginTop: 6 }}>Aviso de urgencia (texto fijo, sin cronómetro)</label>
                <input type="text" id="rpv-urgency" maxLength={30} placeholder="Ej: ¡Últimas unidades!" value={urgency} onChange={e => setUrgency(e.target.value)} />
                <p className="hint" style={{ marginTop: 6 }}>No es un reloj corriendo — es un aviso fijo, porque el video queda grabado y un cronómetro real no tendría sentido después.</p>
              </div>
            )}

            <div className="card action-card">
              <button className="primary" type="button" disabled={exporting || !readyToRender} onClick={generar}>
                {exporting ? "Generando…" : readyToRender ? "Generar y descargar video" : "Preparando herramienta…"}
              </button>
              {conMarcaDeAgua && (
                <p className="hint" style={{ margin: "8px 0 0", textAlign: "center" }}>
                  Tu video incluye la marca &apos;Hecho con RETADOR&apos;. Quítala con el{" "}
                  <button type="button" onClick={onOpenPlans} style={{ background: "none", border: "none", padding: 0, color: "var(--accent-dark)", fontWeight: 700, fontSize: "inherit", textDecoration: "underline", cursor: "pointer" }}>plan Pro</button>.
                </p>
              )}
              <div className={"progress-wrap" + (prog ? " show" : "")}>
                <div className="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(prog?.pct || 0)}>
                  <div className="progress-fill" style={{ width: (prog?.pct || 0) + "%" }}></div>
                </div>
                <div className="progress-label"><span aria-live="polite">{prog?.label || "Preparando…"}</span><span>{Math.round(prog?.pct || 0)}%</span></div>
              </div>
              <div className={"status" + (status ? " show " + (status.kind || "") : "")} aria-live="polite">{status?.text || ""}</div>
              {download && <a className="download-link" href={download.url} download={download.name}>Descargar video</a>}
              <div className="export-detail">{exportDetail}</div>
              <details className="tech">
                <summary>Calidad del video</summary>
                <div>Video vertical 1080×1920 a 60 fotogramas por segundo, en formato MP4 listo para Instagram, Facebook, TikTok y WhatsApp. La generación puede tardar un poco más en teléfonos antiguos, pero el resultado final siempre sale fluido.</div>
              </details>
            </div>
          </div>

          <div className="preview-col">
            <div className="preview-panel">
              <div className="phone"><canvas ref={canvasRef} width={W} height={H} aria-hidden="true"></canvas></div>
              {!enough && <p className="empty-state">Añade contenido para ver la vista previa.</p>}
              <div className="carousel-nav">
                <button type="button" className="carousel-arrow" aria-label="Estilo anterior" disabled={styleIdx <= 0} onClick={() => { if (styleIdx > 0) selectStyle(STYLE_ORDER[styleIdx - 1], true); }}>‹</button>
                <div className="carousel-viewport">
                  <div className="style-carousel" ref={carouselRef} onScroll={onCarouselScroll}>
                    {STYLE_ORDER.map(id => {
                      const s = STYLES[id], active = styleId === id;
                      return (
                        <button key={id} type="button" className={"style-slide" + (active ? " active" : "")} aria-pressed={active} onClick={() => selectStyle(id, true)}>
                          <span className="style-slide-icon">{s.icon}</span>
                          <strong>{s.label}</strong>
                          <span className="desc">{s.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <button type="button" className="carousel-arrow" aria-label="Siguiente estilo" disabled={styleIdx >= STYLE_ORDER.length - 1} onClick={() => { if (styleIdx < STYLE_ORDER.length - 1) selectStyle(STYLE_ORDER[styleIdx + 1], true); }}>›</button>
              </div>
              <div className="carousel-dots">
                {STYLE_ORDER.map(id => (
                  <button key={id} type="button" className={"carousel-dot" + (styleId === id ? " active" : "")} aria-label={"Ver estilo " + STYLES[id].label} onClick={() => selectStyle(id, true)} />
                ))}
              </div>
              <p className="carousel-hint">Desliza o usa las flechas para cambiar de estilo</p>
            </div>
            <div className="fps-badge"><span className="dot"></span> Vista previa en vivo — el archivo final se genera fotograma a fotograma</div>
            <button type="button" className="ghost" onClick={() => setReplayKey(k => k + 1)}>Reiniciar vista previa</button>
          </div>
        </div>
      </div>
    </div>
  );
}
