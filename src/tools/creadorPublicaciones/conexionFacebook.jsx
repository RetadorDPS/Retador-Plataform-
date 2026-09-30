// ═════════════════════════════════════════════════════════════════════════════
// Conexión con Facebook compartida por "Crear publicación" y "Publicar en
// Facebook" (video terminado). No es otro sistema: usa fbEstado() y el OAuth de
// siempre (fbConectar); aquí solo vive la parte común de pantalla:
//  · estado REAL de la conexión (una llamada a fbEstado, con reintento manual);
//  · Página elegida: la predeterminada primero; con una sola, esa;
//  · "Conectar Facebook" con freno contra doble toque (un solo OAuth). Antes de
//    salir hacia Meta se llama a antesDeSalir() (guardar el borrador) y se
//    ESPERA a que termine; si al final no se sale (ya estaba conectado o hubo
//    error), se llama a alQuedarse() (borrar ese borrador).
// ═════════════════════════════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from "react";
import { fbEstado, fbConectar } from "../promoVideo/v8/facebook.js";

// Mismos textos que Ajustes → Integración con redes sociales.
export const MOTIVOS_PLAN = {
  plan_no_permitido: "Disponible en los planes Pro y Premium.",
  cuenta_suspendida: "Tu cuenta está suspendida.",
  eliminacion_pendiente: "Tu cuenta tiene una eliminación pendiente.",
};
const FB = "#1877F2", ORO = "#FFC01E";

export function useConexionFacebook({ volverA, paginaInicial = null, antesDeSalir, alQuedarse } = {}) {
  const [fb, setFb] = useState({ cargando: true, datos: null, error: "" });
  const [paginaId, setPaginaId] = useState(typeof paginaInicial === "string" ? paginaInicial : null); // social_page_id (id interno)
  const [yendoAFacebook, setYendoAFacebook] = useState(false);
  const conectando = useRef(false);

  const cargarFb = () => {
    setFb({ cargando: true, datos: null, error: "" });
    fbEstado()
      .then((datos) => {
        setFb({ cargando: false, datos, error: "" });
        const lista = datos?.paginas || [];
        const pred = lista.find((p) => p.is_default) || (lista.length === 1 ? lista[0] : null);
        setPaginaId((actual) => (lista.some((p) => p.id === actual) ? actual : pred?.id ?? null));
      })
      .catch((e) => setFb({ cargando: false, datos: null, error: e?.message || "No se pudo consultar la conexión." }));
  };
  useEffect(cargarFb, []);

  const paginas = useMemo(() => [...(fb.datos?.paginas || [])]
    .sort((a, b) => Number(!!b.is_default) - Number(!!a.is_default)), [fb.datos]);
  const pagina = paginas.find((p) => p.id === paginaId) || null;
  const conexion = fb.datos?.conexion || null;
  const puedePublicar = !!(fb.datos?.configurado && fb.datos?.permitido && conexion?.status === "active" && pagina);

  // OAuth existente. Si sale bien, la página se va a Facebook y el callback vuelve a volverA.
  const conectar = async (reconectar = false) => {
    if (conectando.current) return;
    conectando.current = true;
    setYendoAFacebook(true);
    const terminar = () => { conectando.current = false; setYendoAFacebook(false); if (alQuedarse) alQuedarse(); };
    try {
      if (antesDeSalir) await antesDeSalir();
      await fbConectar({ volverA, reconectar });
      terminar(); cargarFb(); // ya estaba conectado: no se salió
    } catch (e) {
      terminar();
      setFb((f) => ({ ...f, error: e?.message || "No se pudo conectar con Facebook." }));
    }
  };

  return { fb, cargarFb, paginas, pagina, paginaId, setPaginaId, conexion, puedePublicar, conectar, yendoAFacebook };
}

// Aviso del estado de la conexión (o "✓ conectado como …").
export function AvisoFacebook({ con, c }) {
  const { fb, cargarFb, conexion, paginas, conectar, yendoAFacebook } = con;
  const tarjeta = { background: c.aviso, border: `1px solid ${c.bd}`, borderRadius: 16, padding: 14 };
  const nota = (t, color = c.t2) => <p style={{ fontSize: 12.5, color, lineHeight: 1.5, margin: "8px 0 0" }}>{t}</p>;
  const boton = { width: "100%", height: 46, borderRadius: 12, border: "none", background: FB, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", marginTop: 12 };
  if (fb.cargando) return nota("Consultando tu conexión con Facebook…");
  if (fb.error) return (
    <div style={tarjeta}>
      {nota(fb.error, c.t1)}
      <button onClick={cargarFb} style={{ ...boton, background: "transparent", color: c.t1, border: `1.5px solid ${c.bd}`, fontWeight: 700, marginTop: 10 }}>Reintentar</button>
    </div>
  );
  const d = fb.datos || {};
  let mensaje = "", accion = null;
  if (!d.configurado) mensaje = "La conexión con Facebook todavía no está disponible.";
  else if (!d.permitido) mensaje = MOTIVOS_PLAN[d.motivo] || "Tu plan no incluye esta función.";
  else if (conexion?.status === "expired") { mensaje = "Facebook retiró el permiso. Vuelve a conectar."; accion = ["Volver a conectar Facebook", () => conectar(true)]; }
  else if (conexion?.status !== "active") { mensaje = "Conecta Facebook para publicar"; accion = ["Conectar Facebook", () => conectar(false)]; }
  else if (!paginas.length) mensaje = "No encontramos Páginas donde puedas publicar. Revisa tu rol en la Página o vuelve a conectar.";
  if (!mensaje) return nota(`✓ Facebook conectado${conexion.external_name ? ` como ${conexion.external_name}` : ""}.`);
  return (
    <div style={{ ...tarjeta, borderColor: "rgba(245,182,0,.3)" }}>
      <p style={{ fontSize: 14, fontWeight: 700, color: c.t1, margin: 0 }}>{mensaje}</p>
      {accion && <button onClick={accion[1]} disabled={yendoAFacebook} style={{ ...boton, opacity: yendoAFacebook ? .6 : 1 }}>{yendoAFacebook ? "Abriendo Facebook…" : accion[0]}</button>}
    </div>
  );
}

// Selector de Página (solo si hay más de una). La predeterminada va primero.
export function SelectorPaginas({ con, c, bloqueado = false, alElegir }) {
  const { paginas, paginaId, setPaginaId } = con;
  if (paginas.length < 2) return null;
  return (
    <div style={{ background: c.card, border: `1px solid ${c.bd}`, borderRadius: 16, overflow: "hidden", marginTop: 10 }}>
      {paginas.map((pg, i) => (
        <button key={pg.id} onClick={() => { if (pg.id !== paginaId) { if (alElegir) alElegir(pg.id); setPaginaId(pg.id); } }} disabled={bloqueado} aria-pressed={pg.id === paginaId}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "transparent", border: "none", borderTop: i ? `1px solid ${c.bd}` : "none", cursor: "pointer", textAlign: "left" }}>
          <span style={{ width: 18, height: 18, borderRadius: 9, border: `2px solid ${pg.id === paginaId ? ORO : c.t2}`, background: pg.id === paginaId ? ORO : "transparent", flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: c.t1 }}>{pg.page_name}</span>
          {pg.is_default && <span style={{ fontSize: 11, color: c.t2 }}>Predeterminada</span>}
        </button>
      ))}
    </div>
  );
}

// Colores de las dos pantallas (mismo aspecto que Herramientas).
export const coloresDe = (dark) => (dark
  ? { bg: "#0a0a0a", card: "#141417", card2: "#1c1c22", t1: "#f0f0f2", t2: "#9494a0", bd: "rgba(255,255,255,.08)", aviso: "#1a1410" }
  : { bg: "#f1f5f9", card: "#ffffff", card2: "#f1f5f9", t1: "#0f172a", t2: "#64748b", bd: "rgba(0,0,0,.08)", aviso: "#fff7ed" });
