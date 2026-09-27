import { useState } from "react";
import { cancelAccountDeletion, signOutUser } from "../shared/index.js";

// Fecha del borrado definitivo, completa y en español (hora del teléfono).
// Ej.: "domingo, 26 de octubre de 2026, 14:05".
export function fechaBorradoTexto(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return String(iso);
  return d.toLocaleString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ── CUENTA PENDIENTE DE ELIMINACIÓN ──────────────────────────────────────────
// Se muestra en lugar de la app cuando alguien que pidió eliminar su cuenta
// vuelve a entrar antes de la fecha. Puede cancelar (el servidor restaura todo,
// incluido el plan que tenía) o salir sin cambiar nada.
export function PantallaEliminacionPendiente({ fecha, dark = true, onCancelled }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const c = dark
    ? { bg: "#080808", t1: "#f0f0f0", t2: "rgba(255,255,255,.6)", card: "#141414", bd: "#222" }
    : { bg: "#FFFFFF", t1: "#050505", t2: "#65676B", card: "#F2F3F5", bd: "#E4E6EB" };
  async function cancelar() {
    setBusy(true); setErr("");
    try {
      const r = await cancelAccountDeletion();
      if (r?.ok || r?.motivo === "No hay ninguna eliminación pendiente.") { await onCancelled?.(); return; }
      setErr(r?.motivo || "No se pudo cancelar. Intenta de nuevo.");
    } catch (e) { setErr("No se pudo cancelar. Revisa tu conexión e intenta de nuevo."); }
    setBusy(false);
  }
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: c.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "32px 24px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div style={{ fontSize: 52, marginBottom: 14 }}>🗓️</div>
      <h1 style={{ color: c.t1, fontSize: 21, fontWeight: 800, margin: 0, maxWidth: 340 }}>Tu cuenta está pendiente de eliminación</h1>
      <p style={{ color: c.t2, fontSize: 14, lineHeight: 1.5, marginTop: 12, maxWidth: 340 }}>Se borrará definitivamente el</p>
      <p style={{ color: "#DC2626", fontSize: 18, fontWeight: 800, margin: "4px 0 0", maxWidth: 340 }}>{fechaBorradoTexto(fecha)}</p>
      <div style={{ background: c.card, border: `1px solid ${c.bd}`, borderRadius: 14, padding: "12px 14px", marginTop: 18, maxWidth: 340, color: c.t1, fontSize: 13, lineHeight: 1.5, textAlign: "left" }}>
        Mientras tanto tu tienda, tus productos y tu perfil no los ve nadie. Si cancelas, vuelve todo como estaba, incluido tu plan.
      </div>
      {err && <p style={{ color: "#DC2626", fontSize: 13, marginTop: 12, maxWidth: 340 }}>{err}</p>}
      <button onClick={cancelar} disabled={busy} style={{ marginTop: 20, background: "#FFC01E", color: "#000", fontWeight: 800, fontSize: 15, minHeight: 48, padding: "0 24px", borderRadius: 12, border: "none", width: "100%", maxWidth: 340, opacity: busy ? .7 : 1, cursor: "pointer" }}>
        {busy ? "Cancelando…" : "Cancelar la eliminación"}
      </button>
      <button onClick={() => signOutUser()} disabled={busy} style={{ marginTop: 10, background: "none", border: "none", color: c.t2, fontSize: 13, textDecoration: "underline", minHeight: 44, cursor: "pointer" }}>
        Salir sin cancelar
      </button>
    </div>
  );
}
