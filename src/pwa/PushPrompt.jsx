import { useState, useEffect } from "react";
import { enablePush, isPushSupported, isIOS, isStandalone } from "./push.js";
import { getDeferredPrompt, clearDeferredPrompt, onPromptChange } from "./installState.js";

const GOLD = "#F5B301";
const dismissKey = (uid) => `retador_push_dismissed_${uid || "anon"}`;

// Tarjeta discreta de "Activar avisos". Aparece UNA sola vez (se recuerda si se
// descartó) y nunca pide el permiso del navegador de golpe: el permiso solo se
// solicita cuando el usuario toca "Activar".
export default function PushPrompt({ userId, flash }) {
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState("activate"); // activate | ios-install
  const [busy, setBusy] = useState(false);
  const [hasInstallPrompt, setHasInstallPrompt] = useState(!!getDeferredPrompt());

  useEffect(() => {
    if (!userId) return;
    if (typeof Notification === "undefined") return; // el navegador no soporta notificaciones
    let dismissed = false;
    try { dismissed = localStorage.getItem(dismissKey(userId)) === "1"; } catch (e) {}
    if (dismissed) return;

    const iosNotInstalled = isIOS() && !isStandalone();
    // Si ya se concedió/denegó el permiso, no hay nada que ofrecer (salvo el caso
    // iOS-sin-instalar, que es un paso previo distinto al permiso del navegador).
    if (!iosNotInstalled && Notification.permission !== "default") return;
    if (!iosNotInstalled && !isPushSupported()) return;

    const t = setTimeout(() => {
      setMode(iosNotInstalled ? "ios-install" : "activate");
      setVisible(true);
    }, 2600);
    return () => clearTimeout(t);
  }, [userId]);

  useEffect(() => onPromptChange((e) => setHasInstallPrompt(!!e)), []);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    try { localStorage.setItem(dismissKey(userId), "1"); } catch (e) {}
  };

  const activate = async () => {
    setBusy(true);
    const r = await enablePush(userId);
    setBusy(false);
    if (r.ok) flash && flash("🔔 Avisos activados");
    else if (r.reason === "denied") flash && flash("Bloqueaste los avisos — actívalos desde los ajustes del navegador.");
    dismiss();
  };

  const installAndroid = async () => {
    const p = getDeferredPrompt();
    if (!p) return;
    p.prompt();
    try { await p.userChoice; } catch (e) {}
    clearDeferredPrompt();
  };

  const btnBase = { flex: 1, borderRadius: 12, padding: "11px 12px", fontSize: 13, fontWeight: 800, cursor: "pointer", WebkitTapHighlightColor: "transparent" };

  return (
    <div style={{
      position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 99999,
      display: "flex", justifyContent: "center",
      padding: "0 12px calc(14px + env(safe-area-inset-bottom, 0px))",
      pointerEvents: "none",
    }}>
      <style>{`@keyframes pushUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{
        pointerEvents: "auto", width: "100%", maxWidth: 430,
        background: "linear-gradient(180deg,#17130b 0%,#0f0f0f 100%)",
        border: "1px solid rgba(245,179,1,.28)", borderRadius: 18,
        boxShadow: "0 12px 40px rgba(0,0,0,.6)", padding: 16,
        animation: "pushUp .28s ease both",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: `${GOLD}1e`, border: `1px solid ${GOLD}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🔔</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "#ffffff", fontSize: 15, fontWeight: 800, letterSpacing: "-0.01em" }}>
              {mode === "ios-install" ? "Recibe avisos en tu iPhone" : "Activar avisos"}
            </div>
            <div style={{ color: "#a2a2a2", fontSize: 12.5, marginTop: 3, lineHeight: 1.4 }}>
              {mode === "ios-install"
                ? "Añade RETADOR a tu pantalla de inicio: toca Compartir y luego “Añadir a pantalla de inicio”."
                : "Entérate de tus ventas y mensajes aunque la app esté cerrada."}
            </div>
          </div>
        </div>

        {mode === "ios-install" ? (
          <div style={{ marginTop: 14 }}>
            <button onClick={dismiss} style={{ ...btnBase, width: "100%", flex: "none", background: GOLD, color: "#0a0a0a", border: "none" }}>Entendido</button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            <button onClick={dismiss} disabled={busy} style={{ ...btnBase, background: "transparent", color: "#dcdcdc", border: "1px solid rgba(255,255,255,.18)" }}>Ahora no</button>
            {hasInstallPrompt && (
              <button onClick={installAndroid} style={{ ...btnBase, background: "transparent", color: GOLD, border: `1px solid ${GOLD}55` }}>Instalar app</button>
            )}
            <button onClick={activate} disabled={busy} style={{ ...btnBase, background: "linear-gradient(180deg,#FFD873,#F2A900)", color: "#0a0a0a", border: "none" }}>{busy ? "…" : "Activar"}</button>
          </div>
        )}
      </div>
    </div>
  );
}
