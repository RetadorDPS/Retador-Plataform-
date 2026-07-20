// ═════════════════════════════════════════════════════════════════════════════
// BLOQUES EN VIVO — banners del Editor Visual, guardados en la CONFIG GLOBAL
// (platform_config.config.blocks) y servidos por realtime a todos los teléfonos.
//
// RENDER POSICIONAL: cada página del editor es una LISTA ORDENADA de bloques. Los
// bloques de SISTEMA (syszone: encabezado, filtros… / productzone: zona de productos)
// son ANCLAS de las partes reales de la pantalla y NUNCA se pintan como banner. Los
// banners (hero/promo/slider/cta) activos se pintan EXACTAMENTE en el hueco donde el
// dueño los colocó dentro de esa lista. Reordenar en el editor (drag&drop) cambia el
// orden guardado → la tienda refleja la nueva posición en vivo.
// Estructura de bloque: { id, type, active, bg, image, title, sub, cta, badge,
//   ctaAction, cta2, cta2Action, campaign, items }.
// ═════════════════════════════════════════════════════════════════════════════
import { useState } from "react";
import { usePlatformCfg } from "./theme.jsx";

// Fondos predefinidos con la identidad RETADOR (se ofrecen también en el editor).
export const BLOCK_BG_PRESETS = {
  oro:    { name: "Negro · Dorado", bg: "linear-gradient(135deg,#181203 0%,#3d2f07 100%)", accent: "#FFC01E" },
  negro:  { name: "Negro puro",     bg: "#0d0d0d",                                          accent: "#FFC01E" },
  exito:  { name: "Verde éxito",    bg: "linear-gradient(135deg,#03150d 0%,#0b3a26 100%)", accent: "#22C55E" },
  oferta: { name: "Rojo oferta",    bg: "linear-gradient(135deg,#230505 0%,#5c1010 100%)", accent: "#F87171" },
};
// SIN contenido inicial inventado. La tienda pinta ÚNICAMENTE los bloques que el
// dueño crea y guarda en su Editor Visual. Si no hay banners activos, no pinta ninguno.
export const DEFAULT_BLOCKS = {};

// Tipos que se pintan como banner. Los demás (syszone/productzone) son ANCLAS de
// posición de la pantalla real y nunca se pintan como banner.
const RENDERABLE = new Set(["hero", "promo", "slider", "cta"]);

// Tarjeta de banner (misma en la tienda y en la vista previa del editor).
export function BannerCard({ b, onNav }) {
  const ov = "rgba(0,0,0,.46)";
  const bg = b.image ? `linear-gradient(${ov},${ov}), url(${b.image}) center/cover` : (b.bg && b.bg !== "transparent" ? b.bg : "linear-gradient(135deg,#181203 0%,#3d2f07 100%)");
  const Btn = (txt, act, primary) => txt ? (
    <button onClick={() => onNav && onNav(act || "busqueda")} style={{ background: primary ? "#FFC01E" : "rgba(255,255,255,.14)", color: primary ? "#000" : "#fff", border: primary ? "none" : "1px solid rgba(255,255,255,.4)", fontSize: 12, fontWeight: 800, padding: "9px 18px", borderRadius: 22, cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>{txt}</button>
  ) : null;
  return (
    <div style={{ position: "relative", borderRadius: 18, overflow: "hidden", padding: "22px 18px", background: bg, minHeight: b.type === "hero" ? 150 : 116, display: "flex", flexDirection: "column", justifyContent: "center", boxShadow: "0 6px 20px rgba(0,0,0,.22)" }}>
      {b.badge && <span style={{ alignSelf: "flex-start", fontSize: 9, fontWeight: 800, letterSpacing: 1.2, color: "#fff", background: "rgba(255,255,255,.18)", padding: "3px 10px", borderRadius: 20, marginBottom: 9, textTransform: "uppercase" }}>{b.badge}</span>}
      {b.title && <div style={{ fontSize: 19, fontWeight: 900, color: "#fff", marginBottom: 6, lineHeight: 1.18, textShadow: "0 1px 8px rgba(0,0,0,.35)" }}>{b.title}</div>}
      {b.sub && <div style={{ fontSize: 12, color: "rgba(255,255,255,.85)", marginBottom: (b.cta || b.cta2) ? 14 : 0, maxWidth: 440, lineHeight: 1.5 }}>{b.sub}</div>}
      {(b.cta || b.cta2) && <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>{Btn(b.cta, b.ctaAction, true)}{Btn(b.cta2, b.cta2Action, false)}</div>}
    </div>
  );
}

// Carrusel reutilizable de un HUECO: 0 banners → no ocupa espacio; 1 → tarjeta simple;
// varios (contiguos en el mismo hueco) → deslizable con puntitos.
function BannerCarousel({ blocks, onNav, pad = "12px 16px 4px" }) {
  const [idx, setIdx] = useState(0);
  if (!blocks || !blocks.length) return null;
  if (blocks.length === 1) return <div style={{ padding: pad }}><BannerCard b={blocks[0]} onNav={onNav} /></div>;
  return (
    <div style={{ padding: pad }}>
      <div onScroll={e => { const el = e.currentTarget; setIdx(Math.round(el.scrollLeft / Math.max(1, el.clientWidth))); }}
        style={{ display: "flex", overflowX: "auto", scrollSnapType: "x mandatory", scrollbarWidth: "none" }}>
        {blocks.map(b => (
          <div key={b.id} style={{ flex: "0 0 100%", scrollSnapAlign: "center", boxSizing: "border-box" }}>
            <BannerCard b={b} onNav={onNav} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 8 }}>
        {blocks.map((b, i) => <span key={b.id} style={{ width: i === idx ? 16 : 6, height: 6, borderRadius: 999, background: i === idx ? "#FFC01E" : "rgba(128,128,128,.4)", transition: "width .2s" }} />)}
      </div>
    </div>
  );
}

const isBanner = b => b && b.active && RENDERABLE.has(b.type) && (b.title || b.image);

// Banners activos y renderables de `page` que caen ENTRE la ancla `from` y la `to`,
// respetando el ORDEN guardado en la config global. from=null → desde el principio;
// to=null → hasta el final. Si la ancla `from` no existe, devuelve [] (no adivina).
function slotBlocks(cfg, page, from, to) {
  const arr = Array.isArray(cfg.blocks?.[page]) ? cfg.blocks[page] : [];
  if (!arr.length) return [];
  let start = from == null ? 0 : arr.findIndex(b => b && b.id === from) + 1;
  if (from != null && start === 0) return []; // ancla de inicio no encontrada
  let end = to == null ? arr.length : arr.findIndex(b => b && b.id === to);
  if (to != null && end < 0) end = arr.length;
  return arr.slice(start, end).filter(isBanner);
}

// Todos los banners activos de una página completa (para páginas sin anclas: Banners/Promociones).
function pageBanners(cfg, page) {
  return (Array.isArray(cfg.blocks?.[page]) ? cfg.blocks[page] : []).filter(isBanner);
}

// TRAMO POSICIONAL: pinta los banners que el dueño colocó ENTRE dos anclas de una
// página, en su posición real dentro de la pantalla. No ocupa espacio si está vacío.
export function LiveSlot({ page, from = null, to = null, onNav, pad = "12px 16px 4px" }) {
  const cfg = usePlatformCfg();
  return <BannerCarousel blocks={slotBlocks(cfg, page, from, to)} onNav={onNav} pad={pad} />;
}

// GRUPO SUPERIOR del inicio (entre el Encabezado y los Filtros): banners que el dueño
// puso en ese hueco de la página "inicio" + las páginas "Banners" y "Promociones"
// (que se pintan arriba del feed). Varios → carrusel en ese mismo hueco.
export function MarketBanners({ onNav }) {
  const cfg = usePlatformCfg();
  const blocks = [
    ...slotBlocks(cfg, "inicio", "in_h", "in_f"),
    ...pageBanners(cfg, "banners"),
    ...pageBanners(cfg, "promotions"),
  ];
  return <BannerCarousel blocks={blocks} onNav={onNav} pad="12px 16px 4px" />;
}

// ── Compatibilidad ───────────────────────────────────────────────────────────
// La fuente de verdad es la config global (usePlatformCfg), no localStorage.
export function getPageLayout() { return []; }
export function liveSlot() { return []; }
export const LiveBlock = BannerCard;
