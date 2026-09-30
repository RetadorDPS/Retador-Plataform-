// ═════════════════════════════════════════════════════════════════════════════
// Generador de Video Promocional v8.8 — contenedor en la app.
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
//   onFacebook      ({ video, productos: [ids], texto }) con el video ya terminado:
//                   la app abre "Publicar en Facebook" con el MISMO archivo que
//                   Descargar y Compartir y el texto de Compartir.
// ═════════════════════════════════════════════════════════════════════════════
import { useEffect, useRef } from "react";

// [v8.8] Modo de prueba: abrir la app con ?probarOpus=1 fuerza la ruta de audio Opus.
const SRC = import.meta.env.BASE_URL + "herramientas/video.html" + (/[?&]probarOpus=1(&|$)/.test(window.location.search) ? "?probarOpus=1" : "");

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function PromoVideoTool({ conMarcaDeAgua = true, accentDeMarca = null, nombreTienda = "", productos = [], vendedorId = null, inicial = null, dark = false, onClose, onOpenPlans, onFacebook }) {
  const frameRef = useRef(null);
  const iniciado = useRef(false);
  const datosRef = useRef(null);
  datosRef.current = { conMarcaDeAgua, acento: accentDeMarca, nombreTienda, productos, vendedorId, inicial, tema: dark ? "dark" : "light" };
  const planesRef = useRef(onOpenPlans);
  planesRef.current = onOpenPlans;
  const facebookRef = useRef(onFacebook);
  facebookRef.current = onFacebook;

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
      else if (d.tipo === "facebook" && facebookRef.current) {
        // Se valida todo lo que llega; fb-publish y el bucket lo vuelven a comprobar.
        const v = d.datos?.video || {};
        if (!(v.blob instanceof Blob) || !v.blob.size) return;
        const num = (n) => (Number.isFinite(n) && n > 0 ? n : null);
        const video = {
          blob: v.blob, ext: v.ext === "mp4" || v.ext === "webm" ? v.ext : "",
          nombre: typeof v.nombre === "string" ? v.nombre.slice(0, 120) : "video",
          fb: v.fb === "reel" ? "reel" : "feed", formato: typeof v.formato === "string" ? v.formato.slice(0, 20) : "",
          ancho: num(v.ancho), alto: num(v.alto), duracion: num(v.duracion), ruta: typeof v.ruta === "string" ? v.ruta.slice(0, 80) : "",
        };
        const ids = (Array.isArray(d.datos?.productos) ? d.datos.productos : []).filter((id) => typeof id === "string" && UUID.test(id)).slice(0, 20);
        const texto = typeof d.datos?.texto === "string" ? d.datos.texto.slice(0, 5000) : "";
        facebookRef.current({ video, productos: ids, texto });
      }
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
