import { createClient } from "@supabase/supabase-js";

// ═════════════════════════════════════════════════════════════════════════════
// RETADOR — CONFIGURACIÓN / CONEXIÓN A SUPABASE   ◀── EDITAR AQUÍ
// ─────────────────────────────────────────────────────────────────────────────
// Estas dos llaves conectan la app con el backend (el "puente").
// La PUBLISHABLE key es pública a propósito: lo que protege los datos es el RLS
// y los candados del backend. (En Claude Code se pueden mover a variables de
// entorno si se quiere; aquí funcionan tal cual.)
// ═════════════════════════════════════════════════════════════════════════════
const SUPABASE_URL = "https://qsxtjuhueqdxoduyroli.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_VbX-xBAVLKl_SnrkOTxc2w_oTe5-1Va";

// Una sola conexión, reutilizada por toda la app.
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// ── Prueba de conexión (Fase 1) ──────────────────────────────────────────────
// Comprobación discreta y temporal: confirma que el puente quedó tendido.
// No daña nada. La quitaremos cuando la app esté conectada del todo.
(async () => {
  try {
    const { error } = await supabase
      .from("categories")
      .select("id", { head: true, count: "exact" });
    if (error) throw error;
    console.log("%c✅ RETADOR: puente con Supabase CONECTADO.", "color:#16a34a;font-weight:bold");
  } catch (e) {
    console.error("❌ RETADOR: no se pudo conectar con Supabase →", e?.message || e);
  }
})();
