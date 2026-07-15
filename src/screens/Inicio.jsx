import { Zap, Search, Loader2 } from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════
// PANTALLA DE INICIO (login) — diseño aprobado, conectado a Supabase Auth
//   Valores editables (badge/versión/stats) en INICIO_CFG: al armar el panel de
//   admin, leerlos de una tabla de ajustes del backend y editarlos desde ahí.
// ═══════════════════════════════════════════════════════════════════════════
const INICIO_CFG = {
  version: "Marketplace v1.0",
  badge: { text: "AHORA EN BETA PÚBLICA", color: "#F5B301" },
  tagline: ["Compra.", "Vende.", "Escala."],
  search: "Explora productos o empieza a vender...",
  // Etiquetas de las estadísticas. Los VALORES son SIEMPRE reales (get_platform_stats),
  // nunca inventados: si no hay datos, no se muestra la fila.
  statLabels: [
    { key: "products",  label: "PRODUCTOS" },
    { key: "sellers",   label: "VENDEDORES" },
    { key: "delivered", label: "VENTAS" },
  ],
};
// Formatea un número real de forma compacta (1.2k, 8.5k) sin inventar nada.
function fmtStat(n) {
  const v = Number(n) || 0;
  if (v >= 1000) return (v / 1000).toFixed(v >= 10000 ? 0 : 1).replace(/\.0$/, "") + "k";
  return String(v);
}
const INICIO_GOLD = INICIO_CFG.badge.color;
const INICIO_DISPLAY = "'Arial Black', 'Helvetica Neue', system-ui, sans-serif";

function GoogleG({ size = 19 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.3 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.3 0 10.1-2 13.7-5.3l-6.3-5.2C29.3 35 26.8 36 24 36c-5.2 0-9.6-3.3-11.2-7.9l-6.5 5C9.6 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.3 5.2C41.4 36.3 44 30.7 44 24c0-1.3-.1-2.3-.4-3.5z"/>
    </svg>
  );
}

export function RetadorInicio({ onGoogle, stats = null }) {
  return (
    <div style={{ minHeight: "100vh", width: "100%", background: "#080808", display: "flex", justifyContent: "center", WebkitFontSmoothing: "antialiased" }}>
      <style>{`
        @keyframes retShine { 0%{background-position:200% 0} 22%{background-position:-80% 0} 100%{background-position:-80% 0} }
        @keyframes retGlow { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:.8;transform:scale(1.06)} }
        .ret-base{ background:linear-gradient(90deg,#ffffff 0%,#f6f6f7 36%,#ffe9ad 47%,#F5B301 60%,#E08600 100%); -webkit-background-clip:text;background-clip:text;color:transparent; }
        .ret-shine{ background:linear-gradient(110deg,transparent 38%,rgba(255,255,255,.9) 50%,transparent 62%); background-size:250% 100%; -webkit-background-clip:text;background-clip:text;color:transparent; animation:retShine 5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce){ .ret-shine{animation:none} .ret-glow{animation:none!important} }
      `}</style>
      <div style={{ position: "relative", width: "100%", maxWidth: 430, background: "#080808", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)", backgroundSize: "58px 58px" }} />
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(120% 80% at 50% 0%, transparent 55%, #080808 100%)" }} />
        <div style={{ position: "relative", zIndex: 10, padding: "26px 24px 34px", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: "#fff", fontSize: 14, letterSpacing: "0.18em", fontWeight: 800, fontStyle: "italic", fontFamily: INICIO_DISPLAY }}>RETADOR</span>
            <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "rgba(255,255,255,.45)", fontFamily: "ui-monospace, Menlo, monospace" }}>
              <span style={{ height: 8, width: 8, borderRadius: 999, background: INICIO_GOLD }} />{INICIO_CFG.version}
            </span>
          </div>
          <div style={{ marginTop: 34, display: "flex", justifyContent: "center" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 999, padding: "5px 12px", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.12em", color: INICIO_GOLD, border: "1px solid " + INICIO_GOLD + "44", background: "rgba(245,179,1,.05)" }}>
              <Zap size={11} fill={INICIO_GOLD} strokeWidth={0} />{INICIO_CFG.badge.text}
            </div>
          </div>
          <div style={{ marginTop: 30, position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div className="ret-glow" style={{ position: "absolute", height: 150, width: 280, borderRadius: 999, filter: "blur(48px)", background: "radial-gradient(circle, rgba(245,179,1,.35) 0%, transparent 70%)", animation: "retGlow 4s ease-in-out infinite" }} />
            <div style={{ position: "relative", userSelect: "none", fontFamily: INICIO_DISPLAY }}>
              <h1 className="ret-base" style={{ fontSize: 74, lineHeight: 1, fontWeight: 900, letterSpacing: "-0.02em", margin: 0 }}>RETADOR</h1>
              <h1 className="ret-shine" aria-hidden="true" style={{ position: "absolute", inset: 0, fontSize: 74, lineHeight: 1, fontWeight: 900, letterSpacing: "-0.02em", margin: 0 }}>RETADOR</h1>
            </div>
            <div style={{ marginTop: 10, color: "rgba(255,255,255,.4)", fontSize: 15, fontWeight: 300, letterSpacing: "0.5em", paddingLeft: "0.5em" }}>MARKETPLACE</div>
          </div>
          <div style={{ marginTop: 34, display: "flex", alignItems: "center", justifyContent: "center", gap: 14, fontSize: 16, fontWeight: 500, color: "rgba(255,255,255,.85)" }}>
            {INICIO_CFG.tagline.map((w, i) => (
              <span key={w} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                {i > 0 && <span style={{ height: 5, width: 5, borderRadius: 999, background: INICIO_GOLD }} />}{w}
              </span>
            ))}
          </div>
          <div style={{ marginTop: 28, display: "flex", alignItems: "center", gap: 10, borderRadius: 14, border: "1px solid rgba(255,255,255,.09)", background: "rgba(255,255,255,.03)", padding: "12px 15px" }}>
            <Search size={17} style={{ color: "rgba(255,255,255,.38)", flexShrink: 0 }} />
            <span style={{ color: "rgba(255,255,255,.38)", fontSize: 13.5 }}>{INICIO_CFG.search}</span>
          </div>
          <div style={{ marginTop: 22 }}>
            <button onClick={onGoogle} style={{ width: "100%", borderRadius: 14, background: "#fff", color: "#000", border: "none", cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontSize: 15, padding: "13px 16px" }}>
              <GoogleG size={19} /> Entrar con Google
            </button>
            <p style={{ marginTop: 10, textAlign: "center", fontSize: 11.5, color: "rgba(255,255,255,.3)" }}>Con tu cuenta de Google. Rápido y seguro.</p>
          </div>
          {/* Estadísticas REALES (get_platform_stats). Si no hay datos o todo es 0,
              no se muestra la fila: cero números inventados. */}
          {stats && (stats.products || stats.sellers || stats.delivered) ? (
            <div style={{ marginTop: "auto", paddingTop: 34, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
              {INICIO_CFG.statLabels.map((s) => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <div style={{ color: "#fff", fontSize: 28, fontWeight: 900, lineHeight: 1, fontFamily: INICIO_DISPLAY }}>{fmtStat(stats[s.key])}</div>
                  <div style={{ marginTop: 7, fontSize: 10.5, letterSpacing: "0.14em", color: "rgba(255,255,255,.34)", fontWeight: 500 }}>{s.label}</div>
                </div>
              ))}
            </div>
          ) : <div style={{ marginTop: "auto" }} />}
        </div>
      </div>
    </div>
  );
}

// Pantalla breve mientras se comprueba si hay sesión guardada.
export function PantallaCargando() {
  return (
    <div style={{ minHeight: "100vh", background: "#080808", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Loader2 size={30} style={{ color: INICIO_GOLD, animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
