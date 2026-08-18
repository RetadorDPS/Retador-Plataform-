import { useState, useEffect } from "react";
import { getDeferredPrompt, onPromptChange, clearDeferredPrompt } from "./installState.js";

// ¿La app ya está corriendo instalada (pantalla completa)?
function isStandalone() {
  return (
    (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
    window.navigator.standalone === true
  );
}
// iOS no soporta el prompt de instalación → se instala a mano desde Compartir.
function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
}

// ── Marca persistente de "ya se instaló en ESTE navegador" ──────────────────
// isStandalone() SOLO es true mientras la app corre desde el ícono instalado
// — si luego se abre la MISMA app en una pestaña normal del navegador (no
// desde el ícono), isStandalone() vuelve a dar false y, sin esta marca, el
// cartel de "Instalar" reaparecía aunque ya estuviera instalada. Se guarda en
// cuanto detectamos standalone=true (o justo al confirmarse la instalación
// con nuestro propio botón) y desde ahí el cartel no vuelve a ofrecerse EN
// ESE NAVEGADOR — pero con un LÍMITE DE TIEMPO (ver más abajo), nunca a
// perpetuidad: la web no tiene forma de saber si la app se desinstaló
// después (evento real "se desinstaló" que ninguna página puede recibir), así
// que una marca eterna terminaba escondiendo el cartel PARA SIEMPRE en
// cualquier navegador donde alguna vez se instaló y luego se desinstaló —
// confirmado con reproducción real: marca puesta + display-mode NO standalone
// (el estado real de "ya no instalada") → el cartel nunca volvía a aparecer.
// Por eso ahora se guarda un SELLO DE TIEMPO (no un booleano fijo) y se trata
// como respaldo temporal: isStandalone() sigue siendo la fuente de verdad
// PRINCIPAL en cada carga; el sello solo cubre, por un tiempo acotado, el
// caso legítimo de "instalada de verdad pero abierta ahora en una pestaña
// normal". Pasada la ventana sin un standalone=true real que la renueve, se
// vuelve a confiar en el estado real y el cartel puede reaparecer — así se
// autocorrige sin depender de un evento de desinstalación que la web no tiene.
// ⚠️ LÍMITE REAL que sigue existiendo (no se puede evitar del todo): esta
// marca vive en el localStorage de ESE navegador/perfil. Si la app se instaló
// desde Chrome pero luego se abre desde el navegador interno de WhatsApp/
// Facebook/Instagram (u otro navegador), es un almacenamiento COMPLETAMENTE
// separado que no puede saber que ya existe una instalación en otro lado —
// ahí el cartel puede volver a aparecer. No es un descuido: ningún sitio
// puede leer el localStorage de otro navegador.
const INSTALLED_FLAG_KEY = "retador_pwa_installed_confirmed";
const INSTALLED_TRUST_MS = 30 * 24 * 60 * 60 * 1000; // 30 días de respaldo sin confirmación nueva
function markInstalledIfStandalone() {
  try { if (isStandalone()) localStorage.setItem(INSTALLED_FLAG_KEY, String(Date.now())); } catch (e) {}
}
function wasInstalledBefore() {
  try {
    const raw = localStorage.getItem(INSTALLED_FLAG_KEY);
    if (!raw) return false;
    // Migra la marca vieja ("1", sin sello de tiempo, de antes de este cambio):
    // sin fecha real no se puede saber su antigüedad, así que no cuenta como
    // respaldo válido — se deja que isStandalone() decida de verdad ahora.
    const t = Number(raw);
    if (!Number.isFinite(t)) return false;
    return (Date.now() - t) < INSTALLED_TRUST_MS;
  } catch (e) { return false; }
}

const GOLD = "#F5B301";
const ICON = (import.meta.env.BASE_URL || "/") + "icons/icon-192.png";

// Cartel de instalación PROPIO de RETADOR (no el automático de Chrome).
// Oscuro, legible, con "Instalar" y "Recordármelo más tarde".
export default function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    markInstalledIfStandalone(); // corre instalada AHORA → guarda la marca para el futuro
    if (isStandalone() || wasInstalledBefore()) return; // ya instalada (ahora o antes, en este navegador) → nunca molestar

    // Si el evento llega tarde y ya cerramos, no reaparece hasta la próxima carga.
    const off = onPromptChange((e) => {
      if (!e) { // appinstalled: se acaba de instalar de verdad — marca ya mismo, sin esperar al próximo arranque
        setVisible(false);
        try { localStorage.setItem(INSTALLED_FLAG_KEY, String(Date.now())); } catch (err) {}
      }
    });

    const iosDevice = isIOS() && !isStandalone();
    // Esperamos unos segundos tras cargar para no ser agresivos.
    const t = setTimeout(() => {
      if (isStandalone() || wasInstalledBefore()) return;
      if (getDeferredPrompt()) setVisible(true);        // Android/Chrome/Edge…
      else if (iosDevice) { setIos(true); setVisible(true); } // iOS: instrucciones
      // Si el navegador no soporta instalación (ni iOS) → no se muestra nada.
    }, 3500);

    return () => { off(); clearTimeout(t); };
  }, []);

  if (!visible) return null;

  // "Recordármelo más tarde": cierra el cartel. Como no guardamos ningún flag,
  // vuelve a aparecer en la PRÓXIMA visita/carga de la app.
  const later = () => setVisible(false);

  const install = async () => {
    const p = getDeferredPrompt();
    if (!p) { setVisible(false); return; }
    p.prompt();
    try { await p.userChoice; } catch (e) { /* el usuario cerró el diálogo */ }
    clearDeferredPrompt();
    setVisible(false);
  };

  const btnBase = {
    flex: 1, borderRadius: 12, padding: "12px 14px", fontSize: 14, fontWeight: 800,
    cursor: "pointer", WebkitTapHighlightColor: "transparent",
  };

  return (
    <div style={{
      position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 100000,
      display: "flex", justifyContent: "center",
      padding: "0 12px calc(14px + env(safe-area-inset-bottom, 0px))",
      pointerEvents: "none",
    }}>
      <style>{`@keyframes pwaUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{
        pointerEvents: "auto", width: "100%", maxWidth: 430,
        background: "linear-gradient(180deg,#17130b 0%,#0f0f0f 100%)",
        border: "1px solid rgba(245,179,1,.28)", borderRadius: 18,
        boxShadow: "0 12px 40px rgba(0,0,0,.6)", padding: 16,
        animation: "pwaUp .28s ease both",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src={ICON} alt="RETADOR" width={46} height={46}
            style={{ borderRadius: 12, flexShrink: 0, border: "1px solid rgba(255,255,255,.08)" }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "#ffffff", fontSize: 15.5, fontWeight: 800, letterSpacing: "-0.01em" }}>
              Instala RETADOR
            </div>
            <div style={{ color: "#a2a2a2", fontSize: 12.5, marginTop: 2, lineHeight: 1.35 }}>
              {ios
                ? "Toca Compartir y luego “Añadir a pantalla de inicio”."
                : "Ábrela a pantalla completa desde tu pantalla de inicio."}
            </div>
          </div>
        </div>

        {ios ? (
          <div style={{ marginTop: 14 }}>
            <button onClick={later} style={{ ...btnBase, width: "100%", flex: "none",
              background: GOLD, color: "#0a0a0a", border: "none" }}>
              Entendido
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button onClick={later} style={{ ...btnBase,
              background: "transparent", color: "#dcdcdc", border: "1px solid rgba(255,255,255,.18)" }}>
              Recordármelo más tarde
            </button>
            <button onClick={install} style={{ ...btnBase,
              background: `linear-gradient(180deg,#FFD873,#F2A900)`, color: "#0a0a0a", border: "none" }}>
              Instalar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
