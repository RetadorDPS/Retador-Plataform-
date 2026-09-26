// ═════════════════════════════════════════════════════════════════════════════
// Generador de Video Promocional v8.7 — contenedor en la app.
// La herramienta es la página herramientas/video.html (mismo dominio) dentro de
// un iframe: así su HTML y su CSS quedan idénticos al prototipo aprobado y a
// salvo de los estilos globales de la app. Los datos reales viajan por
// postMessage (ver src/tools/promoVideo/v8/pagina.js).
//
// Props (las decide App.jsx; la regla de plan vive en getPlanPerks):
//   conMarcaDeAgua  true = gratis / sin sesión / plan desconocido
//   accentDeMarca   store_config.accent (solo Pro/Premium) o null
//   nombreTienda    store_config.name (solo Pro/Premium) o ""
//   productos       productos publicados del vendedor [{ id, title, price, currency, stock, image }]
//   vendedorId      para el enlace de la tienda en el texto del post
//   inicial         { estilo: "directo", producto } al venir de "Producto publicado"
// ═════════════════════════════════════════════════════════════════════════════
import { useEffect, useRef } from "react";

const SRC = import.meta.env.BASE_URL + "herramientas/video.html";

export default function PromoVideoTool({ conMarcaDeAgua = true, accentDeMarca = null, nombreTienda = "", productos = [], vendedorId = null, inicial = null, dark = false, onClose, onOpenPlans }) {
  const frameRef = useRef(null);
  const iniciado = useRef(false);
  const datosRef = useRef(null);
  datosRef.current = { conMarcaDeAgua, acento: accentDeMarca, nombreTienda, productos, vendedorId, inicial, tema: dark ? "dark" : "light" };
  const planesRef = useRef(onOpenPlans);
  planesRef.current = onOpenPlans;

  const enviar = (tipo, datos) => {
    const w = frameRef.current && frameRef.current.contentWindow;
    if (w) w.postMessage({ fuente: "retador-app", tipo, datos }, window.location.origin);
  };

  useEffect(() => {
    const onMsg = (e) => {
      if (e.origin !== window.location.origin || !frameRef.current || e.source !== frameRef.current.contentWindow) return;
      const d = e.data || {};
      if (d.fuente !== "retador-video") return;
      if (d.tipo === "lista") { iniciado.current = true; enviar("iniciar", datosRef.current); }
      else if (d.tipo === "planes" && planesRef.current) planesRef.current();
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  // El plan puede terminar de cargar (o los productos refrescarse) con la herramienta abierta.
  useEffect(() => {
    if (iniciado.current) enviar("actualizar", { conMarcaDeAgua, productos });
  }, [conMarcaDeAgua, productos]);

  const barBg = dark ? "#17140F" : "#FAF6EF", barText = dark ? "#F3ECDE" : "#1E1A14", barBorder = dark ? "#3A3325" : "#E7DCC7";
  return (
    <>
      <div style={{ flexShrink: 0, padding: "8px 12px", background: barBg, borderBottom: `1px solid ${barBorder}` }}>
        <button onClick={onClose} style={{ background: "transparent", border: `1px solid ${barBorder}`, color: barText, borderRadius: 9, padding: "7px 13px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>‹ Volver</button>
      </div>
      <iframe
        ref={frameRef}
        src={SRC}
        title="Generador de video promocional"
        allow="web-share; clipboard-write; autoplay"
        style={{ flex: 1, width: "100%", border: 0, display: "block", background: barBg }}
      />
    </>
  );
}
