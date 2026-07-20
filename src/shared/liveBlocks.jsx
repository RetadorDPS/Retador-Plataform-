// ═════════════════════════════════════════════════════════════════════════════
// BLOQUES EN VIVO — Editor Visual (config global platform_config.config).
//
// MODELO (renovación pedida por el dueño):
//  · config.masters = { [id]: master }  → el CONTENIDO, fuente única. Editar un
//    master actualiza todas las pantallas donde esté publicado.
//  · config.blocks  = { [screen]: [entry...] } → cada pantalla es una LISTA ORDENADA.
//    Entradas: ANCLAS del sistema (syszone/productzone, la estructura real de la
//    pantalla) y REFERENCIAS a masters ({ id, ref }). La POSICIÓN es local de cada
//    pantalla (el dueño arrastra), el CONTENIDO es compartido (el master).
//
//  master = { id, kind:'banner'|'carousel', active, format, ctaPos, lib,
//    // banner:  title, sub, badge, bg, image, cta, ctaAction, cta2, cta2Action
//    // carousel: slides:[{ id, image, bg, title, sub, badge, cta, ctaAction }] }
//
// El render es POSICIONAL: cada banner/carrusel se pinta EXACTAMENTE en el hueco
// donde el dueño lo colocó (LiveSlot entre anclas). NADA de auto-agrupar en carrusel:
// varios banners seguidos se apilan; el carrusel es un TIPO de bloque explícito.
// ═════════════════════════════════════════════════════════════════════════════
import { useState, useEffect, useRef } from "react";
import { usePlatformCfg } from "./theme.jsx";

// ── Constantes compartidas con el Editor ─────────────────────────────────────
export const SCREENS = [
  { id: "inicio",         label: "Inicio / Tienda",          icon: "⌂" },
  { id: "busqueda",       label: "Búsqueda",                 icon: "⌕" },
  { id: "delivery_local", label: "Delivery local",           icon: "🛵" },
  { id: "delivery_intl",  label: "Envíos internacionales",   icon: "✈" },
  { id: "subastas",       label: "Subastas",                 icon: "🔨" },
  { id: "stores",         label: "Tiendas premium",          icon: "⭐" },
];
export const FORMATS = [
  { v: "3:1",  l: "➖ Franja",     ratio: "3 / 1"  },
  { v: "16:9", l: "🖼️ Panorámico", ratio: "16 / 9" },
  { v: "4:3",  l: "▭ Medio",      ratio: "4 / 3"  },
  { v: "1:1",  l: "◻️ Cuadrado",   ratio: "1 / 1"  },
];
export const CTA_POS = [
  { v: "left",   l: "Izquierda" },
  { v: "center", l: "Centro" },
  { v: "right",  l: "Derecha" },
];
// Fondos de la identidad RETADOR (cuando el bloque no tiene imagen).
export const RET_BGS = [
  "linear-gradient(135deg,#181203,#3d2f07)",
  "#0d0d0d",
  "linear-gradient(135deg,#03150d,#0b3a26)",
  "linear-gradient(135deg,#230505,#5c1010)",
];
// Estructura fija (anclas de sistema) de cada pantalla. Los banners se colocan ENTRE
// estas anclas. Coinciden con las anclas que usan las pantallas reales (LiveSlot).
export const SCREEN_ANCHORS = {
  inicio: [
    { id: "in_h", type: "syszone", icon: "⌂", title: "Encabezado — buscar · publicar · notificaciones · mensajes" },
    { id: "in_f", type: "syszone", icon: "⚑", title: "Filtros — Todos · Más vendidos · Nuevos · Ofertas" },
    { id: "in_p", type: "productzone", title: "Zona de productos" },
  ],
  busqueda: [
    { id: "bq_s", type: "syszone", icon: "⌕", title: "Barra de búsqueda" },
    { id: "bq_f", type: "syszone", icon: "⚑", title: "Filtros — Todos · Ofertas · Nuevos" },
    { id: "bq_p", type: "productzone", title: "Resultados" },
  ],
  delivery_local: [
    { id: "dl_hero",  type: "syszone", icon: "🟢", title: "Tarjeta principal — mensajería" },
    { id: "dl_cta",   type: "syszone", icon: "➕", title: "Botón — Crear envío" },
    { id: "dl_act",   type: "syszone", icon: "📦", title: "En curso" },
    { id: "dl_stats", type: "syszone", icon: "📊", title: "Rendimiento" },
    { id: "dl_hist",  type: "syszone", icon: "🕓", title: "Historial" },
  ],
  delivery_intl: [
    { id: "di_h",      type: "syszone", icon: "✈️", title: "Encabezado — Centro de Envíos" },
    { id: "di_create", type: "syszone", icon: "➕", title: "Crear nuevo envío" },
    { id: "di_tabs",   type: "syszone", icon: "⇆", title: "Pestañas — Mis envíos / Historial" },
    { id: "di_list",   type: "syszone", icon: "📋", title: "Lista de envíos" },
  ],
  subastas: [
    { id: "su_dest", type: "syszone", icon: "⭐", title: "Destacadas" },
    { id: "su_vip",  type: "syszone", icon: "🔒", title: "VIP Access" },
    { id: "su_filt", type: "syszone", icon: "⚑", title: "Filtros de subastas" },
    { id: "su_feed", type: "productzone", title: "Feed de subastas" },
  ],
  stores: [
    { id: "st_top", type: "syszone", icon: "⭐", title: "Cabecera — Tiendas premium" },
    { id: "st_list", type: "productzone", title: "Lista de tiendas" },
  ],
};

let _seq = 0;
export const mkId = (p = "b") => `${p}${Date.now().toString(36)}${(_seq++).toString(36)}${Math.random().toString(36).slice(2, 5)}`;

export const ratioOf = fmt => (FORMATS.find(f => f.v === fmt) || FORMATS[0]).ratio;

export function blankMaster(kind = "banner") {
  const base = { id: mkId("m"), kind, active: true, format: "3:1", ctaPos: "left", lib: false, everyN: 0 };
  if (kind === "carousel") {
    return { ...base, slides: [
      { id: mkId("s"), bg: RET_BGS[0], title: "Slide 1", sub: "Toca para editar", badge: "", cta: "Ver más", ctaAction: "busqueda", image: "" },
      { id: mkId("s"), bg: RET_BGS[2], title: "Slide 2", sub: "Toca para editar", badge: "", cta: "Ver más", ctaAction: "busqueda", image: "" },
    ] };
  }
  return { ...base, title: "Nuevo banner", sub: "Subtítulo editable", badge: "", bg: RET_BGS[0], image: "", cta: "Ver más", ctaAction: "busqueda", cta2: "", cta2Action: "" };
}

export const isAnchor = e => !!e && (e.type === "syszone" || e.type === "productzone");

// ── Render ───────────────────────────────────────────────────────────────────
const alignOf = pos => (pos === "center" ? "center" : pos === "right" ? "flex-end" : "flex-start");
const textAlignOf = pos => (pos === "center" ? "center" : pos === "right" ? "right" : "left");

function Cta({ txt, act, onNav, primary }) {
  if (!txt) return null;
  return (
    <button onClick={() => onNav && onNav(act || "busqueda")} style={{ background: primary ? "#FFC01E" : "rgba(255,255,255,.16)", color: primary ? "#000" : "#fff", border: primary ? "none" : "1px solid rgba(255,255,255,.4)", fontSize: 12, fontWeight: 800, padding: "9px 18px", borderRadius: 22, cursor: "pointer", WebkitTapHighlightColor: "transparent", whiteSpace: "nowrap" }}>{txt}</button>
  );
}

// Contenido visual de un banner o de un slide (mismo aspecto), con formato (aspect-ratio),
// imagen object-fit cover y alineación del CTA/contenido.
function Face({ d, format, ctaPos, onNav }) {
  const ov = "rgba(0,0,0,.46)";
  const bg = d.image ? `linear-gradient(${ov},${ov}), url(${d.image}) center/cover` : (d.bg && d.bg !== "transparent" ? d.bg : RET_BGS[0]);
  const al = alignOf(ctaPos);
  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: ratioOf(format), borderRadius: 18, overflow: "hidden", background: bg, boxShadow: "0 6px 20px rgba(0,0,0,.22)", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: al, textAlign: textAlignOf(ctaPos), padding: "20px 20px" }}>
      {d.badge && <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.2, color: "#fff", background: "rgba(255,255,255,.18)", padding: "3px 10px", borderRadius: 20, marginBottom: 9, textTransform: "uppercase" }}>{d.badge}</span>}
      {d.title && <div style={{ fontSize: 19, fontWeight: 900, color: "#fff", marginBottom: 6, lineHeight: 1.18, textShadow: "0 1px 8px rgba(0,0,0,.35)", maxWidth: 560 }}>{d.title}</div>}
      {d.sub && <div style={{ fontSize: 12, color: "rgba(255,255,255,.85)", marginBottom: (d.cta || d.cta2) ? 14 : 0, maxWidth: 480, lineHeight: 1.5 }}>{d.sub}</div>}
      {(d.cta || d.cta2) && <div style={{ display: "flex", gap: 9, flexWrap: "wrap", justifyContent: al }}>
        <Cta txt={d.cta} act={d.ctaAction} onNav={onNav} primary />
        <Cta txt={d.cta2} act={d.cta2Action} onNav={onNav} />
      </div>}
    </div>
  );
}

// Banner individual (se apila con los demás; nunca se auto-agrupa).
export function BannerCard({ b, onNav }) {
  // compat: acepta tanto un master como un bloque suelto.
  return <Face d={b} format={b.format} ctaPos={b.ctaPos} onNav={onNav} />;
}

// Carrusel = TIPO de bloque: N slides, auto-avance suave + deslizable a mano + puntitos.
export function Carousel({ m, onNav }) {
  const slides = Array.isArray(m.slides) ? m.slides.filter(s => s && (s.title || s.image || s.sub || s.cta)) : [];
  const ref = useRef(null);
  const [idx, setIdx] = useState(0);
  const n = slides.length;
  useEffect(() => {
    if (n <= 1) return;
    const t = setInterval(() => {
      const el = ref.current; if (!el) return;
      const next = (Math.round(el.scrollLeft / Math.max(1, el.clientWidth)) + 1) % n;
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    }, 4200);
    return () => clearInterval(t);
  }, [n]);
  if (!n) return null;
  if (n === 1) return <Face d={slides[0]} format={m.format} ctaPos={m.ctaPos} onNav={onNav} />;
  return (
    <div>
      <div ref={ref} onScroll={e => { const el = e.currentTarget; setIdx(Math.round(el.scrollLeft / Math.max(1, el.clientWidth))); }}
        style={{ display: "flex", overflowX: "auto", scrollSnapType: "x mandatory", scrollbarWidth: "none" }}>
        {slides.map(s => (
          <div key={s.id} style={{ flex: "0 0 100%", scrollSnapAlign: "center", boxSizing: "border-box" }}>
            <Face d={s} format={m.format} ctaPos={m.ctaPos} onNav={onNav} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 8 }}>
        {slides.map((s, i) => <span key={s.id} style={{ width: i === idx ? 16 : 6, height: 6, borderRadius: 999, background: i === idx ? "#FFC01E" : "rgba(128,128,128,.4)", transition: "width .2s" }} />)}
      </div>
    </div>
  );
}

// Pinta un master (banner o carrusel) según su tipo.
export function BlockView({ m, onNav }) {
  if (!m || m.active === false) return null;
  return m.kind === "carousel" ? <Carousel m={m} onNav={onNav} /> : <Face d={m} format={m.format} ctaPos={m.ctaPos} onNav={onNav} />;
}

// Resuelve una entrada de la lista de una pantalla a su master (o null si es ancla/no válida).
function entryMaster(cfg, e) {
  if (!e || isAnchor(e)) return null;
  if (e.ref) { const m = cfg.masters?.[e.ref]; return m && !m.lib ? m : null; }
  // compat con bloques sueltos antiguos (inline)
  if ((e.title || e.image) && (e.type === "hero" || e.type === "promo" || e.type === "slider" || e.type === "cta" || e.kind === "banner")) {
    return { ...e, kind: "banner", format: e.format || "3:1", ctaPos: e.ctaPos || "left" };
  }
  return null;
}

// Banners/carruseles activos que caen ENTRE la ancla `from` y la `to` de una pantalla,
// respetando el ORDEN guardado. from=null → desde el inicio; to=null → hasta el final.
function slotMasters(cfg, screen, from, to) {
  const arr = Array.isArray(cfg.blocks?.[screen]) ? cfg.blocks[screen] : [];
  if (!arr.length) return [];
  let start = from == null ? 0 : arr.findIndex(e => e && e.id === from) + 1;
  if (from != null && start === 0) return [];
  let end = to == null ? arr.length : arr.findIndex(e => e && e.id === to);
  if (to != null && end < 0) end = arr.length;
  // Los ANUNCIOS del feed (everyN>0) no se pintan en los slots posicionales:
  // se intercalan dentro del feed de productos (ver useFeedAds/feedRows).
  return arr.slice(start, end).map(e => entryMaster(cfg, e)).filter(m => m && m.active !== false && !(Number(m.everyN) > 0));
}

// Anuncios (banner/carrusel con "repetir cada N") activos de una pantalla, para
// intercalarlos en el feed de productos. Orden estable = orden en la config.
export function useFeedAds(screen) {
  const cfg = usePlatformCfg();
  const arr = Array.isArray(cfg.blocks?.[screen]) ? cfg.blocks[screen] : [];
  const ads = [];
  arr.forEach(e => { if (isAnchor(e)) return; const m = entryMaster(cfg, e); if (m && m.active !== false && Number(m.everyN) > 0) ads.push(m); });
  return ads;
}

// Intercala anuncios en la lista de productos por POSICIÓN ABSOLUTA del índice:
// tras cada N tarjetas sale el anuncio con ese N. Varios N distintos conviven; no
// duplica el mismo anuncio seguido. Estable con paginación/scroll infinito.
export function feedRows(products, ads) {
  const list = Array.isArray(products) ? products : [];
  if (!ads || !ads.length) return list.map(p => ({ t: "p", p }));
  const rows = [];
  list.forEach((p, idx) => {
    rows.push({ t: "p", p });
    const i = idx + 1;
    ads.forEach(a => { const n = Number(a.everyN) || 0; if (n > 0 && i % n === 0) rows.push({ t: "a", m: a, key: `ad_${a.id}_${i}` }); });
  });
  return rows;
}

// TRAMO POSICIONAL entre dos anclas. Cada bloque se pinta individual, apilado.
export function LiveSlot({ page, from = null, to = null, onNav, pad = "12px 16px 4px" }) {
  const cfg = usePlatformCfg();
  const masters = slotMasters(cfg, page, from, to);
  if (!masters.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: pad }}>
      {masters.map(m => <BlockView key={m.id} m={m} onNav={onNav} />)}
    </div>
  );
}

// Grupo superior del Inicio (entre Encabezado y Filtros): banners de inicio en ese hueco.
export function MarketBanners({ onNav }) {
  return <LiveSlot page="inicio" from="in_h" to="in_f" onNav={onNav} pad="12px 16px 4px" />;
}

// ── Compatibilidad ────────────────────────────────────────────────────────────
export const DEFAULT_BLOCKS = {};
export const BLOCK_BG_PRESETS = {
  oro:    { name: "Negro · Dorado", bg: RET_BGS[0], accent: "#FFC01E" },
  negro:  { name: "Negro puro",     bg: RET_BGS[1], accent: "#FFC01E" },
  exito:  { name: "Verde éxito",    bg: RET_BGS[2], accent: "#22C55E" },
  oferta: { name: "Rojo oferta",    bg: RET_BGS[3], accent: "#F87171" },
};
export function getPageLayout() { return []; }
export function liveSlot() { return []; }
export const LiveBlock = BannerCard;
