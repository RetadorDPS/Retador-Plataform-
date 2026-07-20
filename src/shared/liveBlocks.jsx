// ═════════════════════════════════════════════════════════════════════════════
// BLOQUES EN VIVO — banners del Editor Visual ORIGINAL, guardados en la CONFIG
// GLOBAL (platform_config.config.blocks). El admin los edita en el panel → llegan
// por realtime a todos los teléfonos y la tienda los pinta al instante.
// Estructura de bloque (la del editor original): { id, type, active, bg, image,
//   title, sub, cta, badge, ctaAction, cta2, cta2Action, campaign, items }.
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
// dueño crea y guarda en su Editor Visual (config global). Si la config no tiene
// banners activos, la tienda no pinta ninguno — cero banners fantasma.
// (El texto del bloque de Delivery cae a su valor por defecto honesto en Delivery.jsx
//  cuando el dueño aún no lo ha configurado.)
export const DEFAULT_BLOCKS = {};

// Tipos de bloque que se pintan como banner arriba del feed (los demás son
// estructurales — zonas de productos, filtros — y se ignoran aquí).
const RENDERABLE = new Set(["hero", "promo", "slider", "cta"]);
// Páginas del editor cuyos banners salen en el TOP del marketplace. IMPORTANTE:
// deben ser EXACTAMENTE páginas que el dueño ve y edita en su Editor Visual
// (ED_AREAS): Inicio, Banners y Promociones. NO se lee ninguna página oculta
// (como la vieja "marketplace"), para que no haya banners que el dueño no pueda tocar.
const MARKET_PAGES = ["inicio", "banners", "promotions"];

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

// Recolecta los banners renderables y activos del marketplace desde la config global.
function marketBlocks(cfg) {
  const blocks = cfg.blocks || {};
  const out = [];
  MARKET_PAGES.forEach(pg => {
    (Array.isArray(blocks[pg]) ? blocks[pg] : []).forEach(b => {
      if (b && b.active && RENDERABLE.has(b.type) && (b.title || b.image)) out.push(b);
    });
  });
  return out;
}

// Carrusel de banners del MARKETPLACE. 1 activo → tarjeta simple; varios →
// deslizable con puntitos. 0 → no ocupa espacio.
export function MarketBanners({ onNav }) {
  const cfg = usePlatformCfg();
  const blocks = marketBlocks(cfg);
  const [idx, setIdx] = useState(0);
  if (!blocks.length) return null;
  if (blocks.length === 1) return <div style={{ padding: "12px 16px 4px" }}><BannerCard b={blocks[0]} onNav={onNav} /></div>;
  return (
    <div style={{ padding: "12px 0 4px" }}>
      <div onScroll={e => { const el = e.currentTarget; setIdx(Math.round(el.scrollLeft / el.clientWidth)); }}
        style={{ display: "flex", overflowX: "auto", scrollSnapType: "x mandatory", scrollbarWidth: "none" }}>
        {blocks.map(b => (
          <div key={b.id} style={{ flex: "0 0 100%", scrollSnapAlign: "center", padding: "0 16px", boxSizing: "border-box" }}>
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

// ── Compatibilidad con pantallas antiguas ────────────────────────────────────
export function getPageLayout() { return []; }
export function liveSlot() { return []; }
export function LiveBlock() { return null; }
export function LiveSlot() { return null; }
