// ═════════════════════════════════════════════════════════════════════════════
// 📸 Crear publicación — Herramientas → Marketing y publicidad.
//
// Publica UNA foto de un producto propio en la Página de Facebook conectada.
// Pasos: 1) producto · 2) foto · 3) texto · 4) página, vista previa y publicar.
//
// Props:
//   productos  productos publicados del vendedor, ya filtrados por el padre
//              (producto, activo, aprobado, sin archivar):
//              [{ id, title, price, currency, description, images[] }]
//              El filtro es solo visual: fb-publish vuelve a comprobarlo todo.
//   onBack     salir de la herramienta (solo desde el paso 1).
//   dark       tema de la app (true = oscuro). Lo decide el padre, igual que
//              en la pantalla de Herramientas.
//   onRecargar (opcional) pedir al padre la lista de productos actualizada.
//              Se usa cuando fb-publish avisa de que las fotos cambiaron: sin
//              recargar, el vendedor volvería a elegir sobre la lista vieja.
//
// Seguridad: la foto se envía como POSICIÓN (fotoIndice) dentro de
// products.images; fb-publish toma la URL de la base. fotoEsperada solo sirve
// para que el servidor avise si el orden de fotos cambió. Nunca se envía una
// URL como fuente de verdad.
//
// Doble publicación: una sola clave (idempotency_key) por borrador. Tras un
// corte de red se reintenta con la MISMA clave; solo "Crear otra", un fallo
// definitivo o un borrador nuevo (sin intento dudoso) la cambian.
// ═════════════════════════════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from "react";
import { money, thumbUrlOf } from "../../shared/backend.js";
import { fbEstado, fbConectar, fbPublicarProducto } from "../promoVideo/v8/facebook.js";
import textoPublicacion, { LIMITE_TEXTO } from "./textoPublicacion.js";

const FOTOS_POR_TANDA = 12;
const PASOS = ["Producto", "Foto", "Texto", "Publicar"];
// Mismos textos que Ajustes → Integración con redes sociales.
const MOTIVOS_PLAN = {
  plan_no_permitido: "Disponible en los planes Pro y Premium.",
  cuenta_suspendida: "Tu cuenta está suspendida.",
  eliminacion_pendiente: "Tu cuenta tiene una eliminación pendiente.",
};
// Intentos cuyo resultado no está cerrado: mientras dure, la clave no cambia.
const INCIERTOS = ["red", "pendiente", "en_curso"];

const esHttps = (u) => typeof u === "string" && /^https:\/\//.test(u.trim());
// Fotos publicables con su POSICIÓN ORIGINAL en products.images.
const fotosDe = (p) => (Array.isArray(p?.images) ? p.images : [])
  .map((url, indice) => ({ indice, url: typeof url === "string" ? url.trim() : "" }))
  .filter((f) => esHttps(f.url));
const precioDe = (p) => {
  const n = Number(p?.price);
  return Number.isFinite(n) && n > 0 ? money(n, p.currency) : "";
};
const horaDe = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
};

// Imagen con miniatura propia de RETADOR si existe; si falla, la original; si
// también falla, un recuadro vacío (nunca una foto rota).
function Foto({ url, miniatura = true, alt = "", estilo }) {
  const primera = miniatura ? thumbUrlOf(url) : url;
  const [src, setSrc] = useState(primera);
  const [rota, setRota] = useState(false);
  useEffect(() => { setSrc(primera); setRota(false); }, [primera]);
  if (rota) return <div aria-hidden="true" style={{ ...estilo, background: "rgba(128,128,128,.15)" }} />;
  return (
    <img src={src} alt={alt} loading="lazy" decoding="async" referrerPolicy="no-referrer" style={{ ...estilo, objectFit: "cover", display: "block" }}
      onError={() => { if (src !== url) setSrc(url); else setRota(true); }} />
  );
}

export default function CreadorPublicaciones({ productos = [], onBack, onRecargar, dark = true }) {
  const c = dark
    ? { bg: "#0a0a0a", card: "#141417", card2: "#1c1c22", t1: "#f0f0f2", t2: "#9494a0", bd: "rgba(255,255,255,.08)", aviso: "#1a1410" }
    : { bg: "#f1f5f9", card: "#ffffff", card2: "#f1f5f9", t1: "#0f172a", t2: "#64748b", bd: "rgba(0,0,0,.08)", aviso: "#fff7ed" };
  const ORO = "#FFC01E", FB = "#1877F2";

  // ── Estado (lo demás se deriva) ──────────────────────────────────────────
  const [paso, setPaso] = useState(1);
  const [productoId, setProductoId] = useState(null);
  const [foto, setFoto] = useState(null);             // { indice, url } — url = fotoEsperada
  const [fotosVisibles, setFotosVisibles] = useState(FOTOS_POR_TANDA);
  const [texto, setTexto] = useState("");
  const [fb, setFb] = useState({ cargando: true, datos: null, error: "" });
  const [paginaId, setPaginaId] = useState(null);     // social_page_id (id interno), no el id de Facebook
  const [pub, setPub] = useState({ estado: "inactivo" });
  const clave = useRef(null);                         // idempotency_key del borrador
  const enviando = useRef(false);                     // freno síncrono contra doble toque

  const producto = useMemo(() => productos.find((p) => p.id === productoId) || null, [productos, productoId]);
  const fotos = useMemo(() => fotosDe(producto), [producto]);
  const sugerido = useMemo(() => (producto ? textoPublicacion(producto) : ""), [producto]);
  const paginas = useMemo(() => [...(fb.datos?.paginas || [])]
    .sort((a, b) => Number(!!b.is_default) - Number(!!a.is_default)), [fb.datos]);
  const pagina = paginas.find((p) => p.id === paginaId) || null;
  const conexion = fb.datos?.conexion || null;
  const puedePublicar = !!(fb.datos?.configurado && fb.datos?.permitido && conexion?.status === "active" && pagina);

  // Una sola llamada a fbEstado() (con reintento manual si falla).
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

  // Si el producto elegido desaparece de la lista (se archivó, se vendió…), volver al inicio.
  useEffect(() => { if (productoId && !producto) { setProductoId(null); setFoto(null); setPaso(1); } }, [productoId, producto]);

  // Cambiar el contenido = borrador nuevo, salvo que haya un intento de
  // resultado incierto: entonces se conserva la clave para no publicar dos veces.
  const tocarBorrador = () => {
    if (!INCIERTOS.includes(pub.estado)) {
      clave.current = null;
      if (pub.estado !== "inactivo") setPub({ estado: "inactivo" });
    }
  };

  const elegirProducto = (p) => {
    if (p.id !== productoId) {
      tocarBorrador();
      setProductoId(p.id);
      setFoto(null);
      setFotosVisibles(FOTOS_POR_TANDA);
      setTexto(textoPublicacion(p));
    }
    setPaso(2);
  };
  const elegirFoto = (f) => {
    if (!foto || foto.indice !== f.indice || foto.url !== f.url) { tocarBorrador(); setFoto(f); }
    setPaso(3);
  };
  const cambiarTexto = (v) => { tocarBorrador(); setTexto(v.slice(0, LIMITE_TEXTO)); };
  const elegirPagina = (id) => { if (id !== paginaId) { tocarBorrador(); setPaginaId(id); } };

  const publicar = async () => {
    if (enviando.current || !producto || !foto || !pagina || !puedePublicar) return;
    enviando.current = true;
    if (!clave.current) clave.current = crypto.randomUUID();
    setPub({ estado: "enviando" });
    try {
      const r = await fbPublicarProducto({
        productoId: producto.id, paginaId: pagina.id, texto, tipo: "photo",
        fotoIndice: foto.indice, fotoEsperada: foto.url, idempotencyKey: clave.current,
      });
      if (r.status === "published") setPub({ estado: "publicado", enlace: r.enlace, reutilizada: r.reutilizada });
      else if (r.status === "failed") {
        clave.current = null; // el intento anterior terminó: otro necesita clave nueva
        setPub({ estado: "fallido", mensaje: "Facebook no aceptó la publicación. Inténtalo más tarde." });
      } else setPub({ estado: "pendiente" }); // pending / processing: sigue en curso
    } catch (e) {
      if (e?.red) setPub({ estado: "red" });
      else if (e?.motivo === "foto_cambiada") {
        clave.current = null;
        setPub({ estado: "foto_cambiada" });
        if (onRecargar) onRecargar();
      }
      else if (e?.motivo === "publicacion_en_curso") setPub({ estado: "en_curso", mensaje: e.message });
      else if (e?.motivo === "limite_por_hora") setPub({ estado: "limite", mensaje: e.message, hora: horaDe(e.reintentarDespues) });
      else if (e?.motivo === "reconectar") { clave.current = null; setPub({ estado: "reconectar", mensaje: e.message }); }
      else {
        if (e?.motivo === "error_meta") clave.current = null; // quedó "failed" en la base
        setPub({ estado: "error", mensaje: e?.message || "No se pudo completar la acción con Facebook." });
      }
    } finally {
      enviando.current = false;
    }
  };

  const crearOtra = () => {
    clave.current = null;
    setPub({ estado: "inactivo" });
    setProductoId(null); setFoto(null); setTexto(""); setFotosVisibles(FOTOS_POR_TANDA);
    setPaso(1);
  };
  const volver = () => {
    if (pub.estado === "enviando") return;
    if (paso === 1) { onBack && onBack(); return; }
    setPaso(paso - 1);
  };
  const conectar = (reconectar = false) => fbConectar({ volverA: "ajustes", reconectar })
    .catch((e) => setFb((f) => ({ ...f, error: e?.message || "No se pudo conectar con Facebook." })));

  // ── Piezas de interfaz ───────────────────────────────────────────────────
  const tarjeta = { background: c.card, border: `1px solid ${c.bd}`, borderRadius: 16 };
  const boton = (fondo, color, extra = {}) => ({ width: "100%", height: 46, borderRadius: 12, border: "none", background: fondo, color, fontSize: 14, fontWeight: 800, cursor: "pointer", ...extra });
  const secundario = boton("transparent", c.t1, { border: `1.5px solid ${c.bd}`, fontWeight: 700 });
  const titulo = (t) => <h2 style={{ fontSize: 16, fontWeight: 800, color: c.t1, margin: "4px 0 10px" }}>{t}</h2>;
  const nota = (t, color = c.t2) => <p style={{ fontSize: 12.5, color, lineHeight: 1.5, margin: "8px 0 0" }}>{t}</p>;

  const avisoFacebook = () => {
    if (fb.cargando) return nota("Consultando tu conexión con Facebook…");
    if (fb.error) return (
      <div style={{ ...tarjeta, padding: 14, background: c.aviso }}>
        {nota(fb.error, c.t1)}
        <button onClick={cargarFb} style={{ ...secundario, marginTop: 10 }}>Reintentar</button>
      </div>
    );
    const d = fb.datos || {};
    let mensaje = "", accion = null;
    if (!d.configurado) mensaje = "La conexión con Facebook todavía no está disponible.";
    else if (!d.permitido) mensaje = MOTIVOS_PLAN[d.motivo] || "Tu plan no incluye esta función.";
    else if (conexion?.status === "expired") { mensaje = "Facebook retiró el permiso. Vuelve a conectar."; accion = ["Volver a conectar Facebook", () => conectar(true)]; }
    else if (conexion?.status !== "active") { mensaje = "Conecta Facebook para publicar"; accion = ["Conectar Facebook", () => conectar(false)]; }
    else if (!paginas.length) mensaje = "No encontramos Páginas donde puedas publicar. Revisa tu rol en la Página o vuelve a conectar.";
    if (!mensaje) return null;
    return (
      <div style={{ ...tarjeta, padding: 14, background: c.aviso, borderColor: "rgba(245,182,0,.3)" }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: c.t1, margin: 0 }}>{mensaje}</p>
        {accion && <button onClick={accion[1]} style={{ ...boton(FB, "#fff"), marginTop: 12 }}>{accion[0]}</button>}
      </div>
    );
  };

  const resultado = () => {
    const e = pub.estado;
    if (e === "inactivo" || e === "enviando") return null;
    const caja = (icono, tituloTxt, cuerpo, acciones) => (
      <div role="status" style={{ ...tarjeta, padding: 16, marginTop: 14 }}>
        <p style={{ fontSize: 15, fontWeight: 800, color: c.t1, margin: 0 }}>{icono} {tituloTxt}</p>
        {cuerpo && nota(cuerpo)}
        <div style={{ display: "grid", gap: 8, marginTop: 12 }}>{acciones}</div>
      </div>
    );
    if (e === "publicado") return caja("✅", "Publicado", pub.reutilizada ? "Esta publicación ya estaba hecha." : "", <>
      {esHttps(pub.enlace) && <a href={pub.enlace} target="_blank" rel="noopener noreferrer" style={{ ...boton(FB, "#fff"), display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>Ver en Facebook</a>}
      <button onClick={crearOtra} style={secundario}>Crear otra</button>
    </>);
    if (e === "pendiente") return caja("⏳", "La publicación sigue en proceso", "No hace falta volver a publicarla. Puedes comprobarlo de nuevo en unos minutos.", <>
      <button onClick={publicar} style={secundario}>Comprobar de nuevo</button>
    </>);
    if (e === "red") return caja("📶", "No sabemos si la publicación llegó a Facebook.", "Reintentar es seguro: si ya llegó, no se publica dos veces.", <>
      <button onClick={publicar} style={boton(ORO, "#1a1200")}>Reintentar</button>
    </>);
    if (e === "foto_cambiada") return caja("⚠️", "La fotografía cambió. Vuelve a seleccionarla.", "", <>
      <button onClick={() => { setFoto(null); setPub({ estado: "inactivo" }); setPaso(2); }} style={secundario}>Elegir la foto de nuevo</button>
    </>);
    if (e === "en_curso") return caja("⏳", pub.mensaje, "", null);
    if (e === "limite") return caja("⏱️", pub.mensaje, pub.hora ? `Podrás volver a publicar a partir de las ${pub.hora}.` : "", null);
    if (e === "reconectar") return caja("⚠️", pub.mensaje, "", <>
      <button onClick={() => conectar(true)} style={boton(FB, "#fff")}>Volver a conectar Facebook</button>
    </>);
    return caja("⚠️", pub.mensaje, "", <>
      <button onClick={publicar} style={secundario}>Intentar de nuevo</button>
    </>);
  };

  // ── Pantalla ─────────────────────────────────────────────────────────────
  const bloqueado = pub.estado === "enviando";
  const cerrado = pub.estado === "publicado";
  return (
    <div style={{ minHeight: "100%", background: c.bg, color: c.t1, padding: "18px 16px 40px" }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <button onClick={volver} disabled={bloqueado} style={{ background: "transparent", border: `1px solid ${c.bd}`, color: c.t2, borderRadius: 9, padding: "7px 13px", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 14, opacity: bloqueado ? .5 : 1 }}>‹ Volver</button>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: c.t1, letterSpacing: "-.02em", margin: 0 }}>📸 Crear publicación</h1>
          <span style={{ fontSize: 12, fontWeight: 700, color: c.t2 }}>Paso {paso} de 4 · {PASOS[paso - 1]}</span>
        </div>
        <div style={{ display: "flex", gap: 4, margin: "10px 0 18px" }}>
          {PASOS.map((p, i) => <span key={p} style={{ flex: 1, height: 3, borderRadius: 3, background: i < paso ? ORO : c.bd }} />)}
        </div>

        {paso === 1 && (<>
          {titulo("Elige un producto")}
          {productos.length === 0 ? (
            <div style={{ ...tarjeta, padding: 18, textAlign: "center" }}>{nota("Todavía no tienes productos publicados en tu tienda.")}</div>
          ) : (
            <div style={{ ...tarjeta, overflow: "hidden" }}>
              {productos.map((p, i) => {
                const primera = fotosDe(p)[0];
                return (
                  <button key={p.id} onClick={() => elegirProducto(p)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "transparent", border: "none", borderTop: i ? `1px solid ${c.bd}` : "none", cursor: "pointer", textAlign: "left" }}>
                    {primera ? <Foto url={primera.url} estilo={{ width: 48, height: 48, borderRadius: 10, flexShrink: 0 }} />
                      : <div style={{ width: 48, height: 48, borderRadius: 10, flexShrink: 0, background: c.card2 }} />}
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: c.t1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.title || "Producto"}</span>
                      {precioDe(p) && <span style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: ORO, marginTop: 2 }}>{precioDe(p)}</span>}
                    </span>
                    <span aria-hidden="true" style={{ color: c.t2, fontSize: 18 }}>›</span>
                  </button>
                );
              })}
            </div>
          )}
        </>)}

        {paso === 2 && producto && (<>
          {titulo("Elige la foto")}
          {nota(producto.title)}
          {fotos.length === 0 ? (
            <div style={{ ...tarjeta, padding: 18, marginTop: 12 }}>{nota("Este producto no tiene fotos que se puedan publicar.")}</div>
          ) : (<>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 12 }}>
              {fotos.slice(0, fotosVisibles).map((f) => {
                const elegida = foto?.indice === f.indice;
                return (
                  <button key={f.indice} onClick={() => elegirFoto(f)} aria-pressed={elegida} aria-label={`Foto ${f.indice + 1}`}
                    style={{ position: "relative", padding: 0, border: `2px solid ${elegida ? ORO : "transparent"}`, borderRadius: 12, overflow: "hidden", background: c.card2, cursor: "pointer", aspectRatio: "1 / 1" }}>
                    <Foto url={f.url} estilo={{ width: "100%", height: "100%" }} />
                    {elegida && <span style={{ position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: 11, background: ORO, color: "#1a1200", fontSize: 13, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>✓</span>}
                  </button>
                );
              })}
            </div>
            {fotos.length > fotosVisibles && (
              <button onClick={() => setFotosVisibles((n) => n + FOTOS_POR_TANDA)} style={{ ...secundario, marginTop: 12 }}>
                Mostrar más ({fotos.length - fotosVisibles})
              </button>
            )}
          </>)}
        </>)}

        {paso === 3 && producto && foto && (<>
          {titulo("Revisa el texto")}
          <textarea value={texto} onChange={(ev) => cambiarTexto(ev.target.value)} maxLength={LIMITE_TEXTO} rows={10}
            style={{ width: "100%", boxSizing: "border-box", background: c.card, color: c.t1, border: `1px solid ${c.bd}`, borderRadius: 14, padding: 12, fontSize: 14, lineHeight: 1.5, fontFamily: "inherit", resize: "vertical" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
            <button onClick={() => cambiarTexto(sugerido)} disabled={texto === sugerido}
              style={{ background: "transparent", border: "none", color: texto === sugerido ? c.t2 : ORO, fontSize: 12.5, fontWeight: 700, cursor: texto === sugerido ? "default" : "pointer", padding: 0 }}>
              Restaurar texto sugerido
            </button>
            <span style={{ fontSize: 12, color: texto.length >= LIMITE_TEXTO ? "#ef4444" : c.t2 }}>{texto.length} / {LIMITE_TEXTO}</span>
          </div>
          <button onClick={() => setPaso(4)} style={{ ...boton(ORO, "#1a1200"), marginTop: 16 }}>Continuar</button>
        </>)}

        {paso === 4 && producto && foto && (<>
          {titulo("Página y vista previa")}
          {avisoFacebook()}
          {paginas.length > 1 && (
            <div style={{ ...tarjeta, overflow: "hidden", marginTop: 10 }}>
              {paginas.map((pg, i) => (
                <button key={pg.id} onClick={() => elegirPagina(pg.id)} disabled={bloqueado} aria-pressed={pg.id === paginaId}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "transparent", border: "none", borderTop: i ? `1px solid ${c.bd}` : "none", cursor: "pointer", textAlign: "left" }}>
                  <span style={{ width: 18, height: 18, borderRadius: 9, border: `2px solid ${pg.id === paginaId ? ORO : c.t2}`, background: pg.id === paginaId ? ORO : "transparent", flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: c.t1 }}>{pg.page_name}</span>
                  {pg.is_default && <span style={{ fontSize: 11, color: c.t2 }}>Predeterminada</span>}
                </button>
              ))}
            </div>
          )}

          <div style={{ ...tarjeta, overflow: "hidden", marginTop: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px" }}>
              <div style={{ width: 36, height: 36, borderRadius: 18, background: FB, color: "#fff", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>f</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: c.t1 }}>{pagina ? pagina.page_name : "Tu Página de Facebook"}</div>
                <div style={{ fontSize: 11.5, color: c.t2 }}>Así se verá</div>
              </div>
            </div>
            {texto && <p style={{ fontSize: 14, color: c.t1, lineHeight: 1.5, whiteSpace: "pre-wrap", overflowWrap: "anywhere", margin: 0, padding: "0 14px 12px" }}>{texto}</p>}
            <Foto url={foto.url} miniatura={false} alt={producto.title || ""} estilo={{ width: "100%", aspectRatio: "1 / 1" }} />
          </div>

          {!cerrado && (
            <button onClick={publicar} disabled={bloqueado || !puedePublicar}
              style={{ ...boton(FB, "#fff"), marginTop: 14, opacity: bloqueado || !puedePublicar ? .55 : 1, cursor: bloqueado || !puedePublicar ? "default" : "pointer" }}>
              {bloqueado ? "Publicando…" : "Publicar en Facebook"}
            </button>
          )}
          {resultado()}
          {nota("RETADOR publica solo cuando tú lo pides, como máximo 5 veces por hora en cada Página.")}
        </>)}
      </div>
    </div>
  );
}
