// ═════════════════════════════════════════════════════════════════════════════
// BLOQUES EN VIVO — banners del Editor Visual, guardados en la CONFIG GLOBAL
// (platform_config.config.blocks). El admin los edita en el panel → llegan por
// realtime a todos los teléfonos y la tienda los pinta al instante.
// ═════════════════════════════════════════════════════════════════════════════
import { useState } from "react";
import { usePlatformCfg } from "./theme.jsx";

// Fondos predefinidos con la identidad RETADOR (nada de gradientes demo).
export const BLOCK_BG_PRESETS = {
  oro:    { name: "Negro · Dorado",  bg: "linear-gradient(135deg,#181203 0%,#3d2f07 100%)", accent: "#FFC01E" },
  negro:  { name: "Negro puro",      bg: "#0d0d0d",                                          accent: "#FFC01E" },
  exito:  { name: "Verde éxito",     bg: "linear-gradient(135deg,#03150d 0%,#0b3a26 100%)", accent: "#22C55E" },
  oferta: { name: "Rojo oferta",     bg: "linear-gradient(135deg,#230505 0%,#5c1010 100%)", accent: "#F87171" },
};
export const BLOCK_TARGETS = [
  ["busqueda", "Explorar"],
  ["ofertas", "Ofertas"],
  ["nuevos", "Nuevos"],
  ["mas_vendidos", "Más vendidos"],
  ["subastas", "Subastas"],
  ["delivery_local", "Delivery local"],
];
// Bloques iniciales RETADOR (neutros y útiles): un hero activo y una oferta de
// ejemplo DESACTIVADA para que el admin la encienda cuando quiera.
export const DEFAULT_BLOCKS = {
  marketplace: [
    { id: "mk_hero",   active: true,  badge: "RETADOR", title: "Bienvenido a RETADOR — todo en un lugar", sub: "Compra, vende y recibe en tu puerta.", cta: "Explorar", target: "busqueda", preset: "oro" },
    { id: "mk_oferta", active: false, badge: "OFERTA",  title: "Ofertas de la semana", sub: "Descuentos reales de vendedores de la plataforma.", cta: "Ver ofertas", target: "ofertas", preset: "oferta" },
  ],
  delivery: { label: "RETADOR · MENSAJERÍA URBANA", sub: "Mensajería urbana profesional · toda Cuba" },
};

// Tarjeta de banner con identidad RETADOR. La MISMA se usa en la tienda y en la
// vista previa del editor, así lo que el admin ve es exactamente lo que sale.
export function BannerCard({ b, onNav }) {
  const p = BLOCK_BG_PRESETS[b.preset] || BLOCK_BG_PRESETS.oro;
  return (
    <div style={{ position: "relative", borderRadius: 18, overflow: "hidden", padding: "20px 18px", background: p.bg, border: `1px solid ${p.accent}30`, minHeight: 132, display: "flex", flexDirection: "column", justifyContent: "center" }}>
      {b.badge && <span style={{ alignSelf: "flex-start", fontSize: 9, fontWeight: 800, letterSpacing: 1.2, color: p.accent, background: `${p.accent}1c`, border: `1px solid ${p.accent}45`, padding: "3px 10px", borderRadius: 20, marginBottom: 9, textTransform: "uppercase" }}>{b.badge}</span>}
      {b.title && <div style={{ fontSize: 19, fontWeight: 900, color: "#fff", marginBottom: 5, lineHeight: 1.2 }}>{b.title}</div>}
      {b.sub && <div style={{ fontSize: 12, color: "rgba(255,255,255,.72)", marginBottom: b.cta ? 13 : 0, maxWidth: 440, lineHeight: 1.5 }}>{b.sub}</div>}
      {b.cta && (
        <button onClick={() => onNav && onNav(b.target || "busqueda")} style={{ alignSelf: "flex-start", background: p.accent, color: "#000", border: "none", fontSize: 12, fontWeight: 800, padding: "9px 18px", borderRadius: 22, cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>{b.cta}</button>
      )}
    </div>
  );
}

// Carrusel de banners del MARKETPLACE (bloques activos de la config global).
// 1 activo → tarjeta simple; varios → deslizable con puntitos. 0 → nada.
export function MarketBanners({ onNav }) {
  const cfg = usePlatformCfg();
  const blocks = (cfg.blocks?.marketplace || []).filter(b => b && b.active);
  const [idx, setIdx] = useState(0);
  if (!blocks.length) return null;
  if (blocks.length === 1) {
    return <div style={{ padding: "12px 16px 4px" }}><BannerCard b={blocks[0]} onNav={onNav} /></div>;
  }
  return (
    <div style={{ padding: "12px 0 4px" }}>
      <div onScroll={e => { const el = e.currentTarget; setIdx(Math.round(el.scrollLeft / el.clientWidth)); }}
        style={{ display: "flex", overflowX: "auto", scrollSnapType: "x mandatory", scrollbarWidth: "none", gap: 0 }}>
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

// ── Compatibilidad con pantallas antiguas (envío intl.) ──────────────────────
// El sistema viejo de localStorage quedó retirado: estos helpers ya no pintan nada.
export function getPageLayout() { return []; }
export function liveSlot() { return []; }
export function LiveBlock() { return null; }
export function LiveSlot() { return null; }
