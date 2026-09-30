// ═════════════════════════════════════════════════════════════════════════════
// 📸 Crear publicación — Herramientas → Marketing y publicidad.
//
// Publica UNA o VARIAS fotos de productos propios en la Página de Facebook
// conectada, en un solo post. Pasos: 1) producto · 2) fotos · 3) texto ·
// 4) Página, vista previa y publicar.
//
// Props:
//   productos  productos publicados del vendedor, ya filtrados por el padre
//              (producto, activo, aprobado, sin archivar):
//              [{ id, title, price, currency, description, images[] }]
//              El filtro es solo visual: fb-publish vuelve a comprobarlo todo.
//   onBack     salir de la herramienta (solo desde el paso 1).
//   dark       tema de la app (true = oscuro).
//   onRecargar (opcional) pedir al padre la lista de productos actualizada.
//              Se usa cuando fb-publish avisa de que las fotos cambiaron.
//
// Fotos: la primera del producto elegido viene marcada; se pueden añadir más
// (también de otros productos propios) hasta FB_FOTOS_MAX, quitarlas y moverlas.
// Cada foto se guarda como { productoId, indice, url }: se envía la POSICIÓN
// (foto_indice) y la url solo como foto_esperada; fb-publish toma la URL de la
// base. Con 1 foto se publica como 'photo'; con 2 o más, como 'photos'.
//
// Texto: el sugerido sale de textoPublicacion() del producto elegido. Si el
// vendedor lo edita, ya no se sustituye (ni al cambiar fotos ni de producto).
//
// Doble publicación: una sola clave (idempotency_key) por borrador. Tras un
// corte de red se reintenta con la MISMA clave; solo "Crear otra", un fallo
// definitivo o un borrador nuevo (sin intento dudoso) la cambian.
//
// Conectar Facebook desde aquí: OAuth de siempre (fbConectar) con volverA
// "producto"; el callback devuelve a esta pantalla. Antes de salir se guarda el
// borrador (producto, fotos, texto y Página) y al volver se recupera.
// ═════════════════════════════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from "react";
import { money, thumbUrlOf } from "../../shared/backend.js";
import { fbPublicarProducto, fbPublicarFotos, FB_FOTOS_MAX } from "../promoVideo/v8/facebook.js";
import textoPublicacion, { LIMITE_TEXTO } from "./textoPublicacion.js";
import { useConexionFacebook, AvisoFacebook, SelectorPaginas, coloresDe } from "./conexionFacebook.jsx";

const FOTOS_POR_TANDA = 12;
const PASOS = ["Producto", "Fotos", "Texto", "Publicar"];
// Intentos cuyo resultado no está cerrado: mientras dure, la clave no cambia.
const INCIERTOS = ["red", "pendiente", "en_curso"];

// Borrador guardado mientras el usuario está en Facebook conectando. Se usa una
// sola vez y caduca a los 30 min. Nunca contiene tokens ni datos de Facebook.
const CLAVE_BORRADOR = "retador_fb_borrador_publicacion";
const BORRADOR_MAX_MS = 30 * 60 * 1000;
const guardarBorrador = (b) => { try { localStorage.setItem(CLAVE_BORRADOR, JSON.stringify({ ...b, t: Date.now() })); } catch (_e) { /* sin almacenamiento */ } };
const quitarBorrador = () => { try { localStorage.removeItem(CLAVE_BORRADOR); } catch (_e) { /* sin almacenamiento */ } };
const leerBorrador = () => {
  try {
    const b = JSON.parse(localStorage.getItem(CLAVE_BORRADOR) || "null");
    return b && typeof b.p === "string" && Array.isArray(b.s) && Date.now() - Number(b.t) < BORRADOR_MAX_MS ? b : null;
  } catch (_e) { return null; }
};

const esHttps = (u) => typeof u === "string" && /^https:\/\//.test(u.trim());
// Fotos publicables con su POSICIÓN ORIGINAL en products.images.
const fotosDe = (p) => (Array.isArray(p?.images) ? p.images : [])
  .map((url, indice) => ({ indice, url: typeof url === "string" ? url.trim() : "" }))
  .filter((f) => esHttps(f.url));
const precioDe = (p) => {
  const n = Number(p?.price);
  return Number.isFinite(n) && n > 0 ? money(n, p.currency) : "";
};
// Primer enlace que aparece en el texto (fb-publish no añade ninguno a las fotos).
const enlaceEnTexto = (t) => (String(t || "").match(/(?:https?:\/\/)?[a-z0-9.-]+\.[a-z]{2,}\/[^\s]*/i) || [])[0] || "";
const horaDe = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
};
const mismaFoto = (a, b) => a.productoId === b.productoId && a.indice === b.indice;
// ¿Sigue la foto en el mismo sitio del producto? (si no, hay que volver a elegirla)
const fotoVigente = (productos, s) => {
  const p = productos.find((x) => x.id === s.productoId);
  return !!p && fotosDe(p).some((f) => f.indice === s.indice && f.url === s.url);
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
  const c = coloresDe(dark);
  const ORO = "#FFC01E", FB = "#1877F2";

  // ── Estado (lo demás se deriva) ──────────────────────────────────────────
  const [restaurar, setRestaurar] = useState(leerBorrador); // borrador a recuperar tras conectar, o null
  const [paso, setPaso] = useState(1);
  const [productoId, setProductoId] = useState(null);
  const [seleccion, setSeleccion] = useState([]);       // [{ productoId, indice, url }] en el orden a publicar
  const [fotosVisibles, setFotosVisibles] = useState(FOTOS_POR_TANDA);
  const [otrosAbiertos, setOtrosAbiertos] = useState(false);
  const [otroAbierto, setOtroAbierto] = useState(null); // id del otro producto cuyas fotos se ven
  const [texto, setTexto] = useState("");
  const [textoEditado, setTextoEditado] = useState(false);
  const [pub, setPub] = useState({ estado: "inactivo" });
  const clave = useRef(null);                           // idempotency_key del borrador
  const enviando = useRef(false);                       // freno síncrono contra doble toque

  const producto = useMemo(() => productos.find((p) => p.id === productoId) || null, [productos, productoId]);
  const fotos = useMemo(() => fotosDe(producto), [producto]);
  const sugerido = useMemo(() => (producto ? textoPublicacion(producto) : ""), [producto]);
  const otros = useMemo(() => productos.filter((p) => p.id !== productoId && fotosDe(p).length), [productos, productoId]);
  const lleno = seleccion.length >= FB_FOTOS_MAX;

  const con = useConexionFacebook({
    volverA: "producto",
    paginaInicial: restaurar?.g,
    antesDeSalir: () => {
      if (producto) guardarBorrador({ p: producto.id, s: seleccion.map((s) => ({ p: s.productoId, i: s.indice, f: s.url })), x: texto, e: textoEditado, g: con.paginaId });
    },
    alQuedarse: quitarBorrador,
  });
  const { pagina, puedePublicar } = con;

  // Vuelta de conectar Facebook: el borrador se lee una vez y se borra. La
  // lista de productos puede llegar después, por eso se espera a encontrarlo.
  useEffect(quitarBorrador, []);
  useEffect(() => {
    if (!restaurar) return;
    const p = productos.find((x) => x.id === restaurar.p);
    if (!p) return;
    const sel = restaurar.s
      .map((s) => ({ productoId: String(s.p), indice: Number(s.i), url: String(s.f) }))
      .filter((s) => fotoVigente(productos, s)).slice(0, FB_FOTOS_MAX);
    setProductoId(p.id);
    setSeleccion(sel);
    setTexto(typeof restaurar.x === "string" ? restaurar.x.slice(0, LIMITE_TEXTO) : textoPublicacion(p));
    setTextoEditado(!!restaurar.e);
    setPaso(sel.length ? 4 : 2); // si alguna foto ya no está igual, se vuelve a elegir
    setRestaurar(null);
  }, [restaurar, productos]);

  // Si el producto elegido desaparece de la lista (se archivó, se vendió…), volver al inicio.
  useEffect(() => { if (productoId && !producto) { setProductoId(null); setSeleccion([]); setPaso(1); } }, [productoId, producto]);
  // Fotos que ya no están igual en su producto (lista recargada): fuera de la selección.
  useEffect(() => {
    setSeleccion((sel) => { const ok = sel.filter((s) => fotoVigente(productos, s)); return ok.length === sel.length ? sel : ok; });
  }, [productos]);

  // Cambiar el contenido = borrador nuevo, salvo que haya un intento de
  // resultado incierto: entonces se conserva la clave para no publicar dos veces.
  const tocarBorrador = () => {
    if (!INCIERTOS.includes(pub.estado)) {
      clave.current = null;
      if (pub.estado !== "inactivo") setPub({ estado: "inactivo" });
    }
  };

  const elegirProducto = (p) => {
    setRestaurar(null); // el usuario ya eligió: no recuperar un borrador viejo encima
    if (p.id !== productoId) {
      tocarBorrador();
      setProductoId(p.id);
      const primera = fotosDe(p)[0];
      setSeleccion(primera ? [{ productoId: p.id, indice: primera.indice, url: primera.url }] : []);
      setFotosVisibles(FOTOS_POR_TANDA);
      setOtrosAbiertos(false); setOtroAbierto(null);
      if (!textoEditado) setTexto(textoPublicacion(p));
    }
    setPaso(2);
  };
  // Tocar una foto: si está elegida se quita; si no, se añade al final (hasta el máximo).
  const alternarFoto = (p, f) => {
    const s = { productoId: p.id, indice: f.indice, url: f.url };
    const ya = seleccion.some((x) => mismaFoto(x, s));
    if (!ya && lleno) return;
    tocarBorrador();
    setSeleccion(ya ? seleccion.filter((x) => !mismaFoto(x, s)) : [...seleccion, s]);
  };
  const quitarFoto = (i) => { tocarBorrador(); setSeleccion(seleccion.filter((_, k) => k !== i)); };
  const moverAntes = (i) => {
    if (i < 1) return;
    tocarBorrador();
    const n = [...seleccion]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; setSeleccion(n);
  };
  const cambiarTexto = (v) => { tocarBorrador(); setTextoEditado(true); setTexto(v.slice(0, LIMITE_TEXTO)); };
  const restaurarSugerido = () => { tocarBorrador(); setTextoEditado(false); setTexto(sugerido); };

  const publicar = async () => {
    if (enviando.current || !seleccion.length || !pagina || !puedePublicar) return;
    enviando.current = true;
    if (!clave.current) clave.current = crypto.randomUUID();
    setPub({ estado: "enviando" });
    try {
      // Exactamente lo que muestra la vista previa: estas fotos, este texto y esta Página.
      const r = seleccion.length === 1
        ? await fbPublicarProducto({
          productoId: seleccion[0].productoId, paginaId: pagina.id, texto, tipo: "photo",
          fotoIndice: seleccion[0].indice, fotoEsperada: seleccion[0].url, idempotencyKey: clave.current,
        })
        : await fbPublicarFotos({
          paginaId: pagina.id, texto, idempotencyKey: clave.current,
          fotos: seleccion.map((s) => ({ productoId: s.productoId, fotoIndice: s.indice, fotoEsperada: s.url })),
        });
      if (r.status === "published") setPub({ estado: "publicado", enlace: r.enlace, reutilizada: r.reutilizada });
      else if (r.status === "failed") {
        clave.current = null; // el intento anterior terminó: otro necesita clave nueva
        setPub({ estado: "fallido", mensaje: "Facebook no aceptó la publicación. Inténtalo más tarde." });
      } else setPub({ estado: "pendiente" }); // pending / processing: sigue en curso
    } catch (e) {
      if (e?.red) setPub({ estado: "red" });
      else if (e?.motivo === "foto_cambiada" || e?.motivo === "foto_no_disponible") {
        clave.current = null;
        setPub({ estado: "foto_cambiada" });
        if (onRecargar) onRecargar(); // al llegar la lista nueva, las fotos que cambiaron salen de la selección
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
    setProductoId(null); setSeleccion([]); setTexto(""); setTextoEditado(false); setFotosVisibles(FOTOS_POR_TANDA);
    setPaso(1);
  };
  const volver = () => {
    if (pub.estado === "enviando") return;
    if (paso === 1) { onBack && onBack(); return; }
    setPaso(paso - 1);
  };

  // ── Piezas de interfaz ───────────────────────────────────────────────────
  const tarjeta = { background: c.card, border: `1px solid ${c.bd}`, borderRadius: 16 };
  const boton = (fondo, color, extra = {}) => ({ width: "100%", height: 46, borderRadius: 12, border: "none", background: fondo, color, fontSize: 14, fontWeight: 800, cursor: "pointer", ...extra });
  const secundario = boton("transparent", c.t1, { border: `1.5px solid ${c.bd}`, fontWeight: 700 });
  const titulo = (t) => <h2 style={{ fontSize: 16, fontWeight: 800, color: c.t1, margin: "4px 0 10px" }}>{t}</h2>;
  const nota = (t, color = c.t2) => <p style={{ fontSize: 12.5, color, lineHeight: 1.5, margin: "8px 0 0" }}>{t}</p>;
  const bloqueado = pub.estado === "enviando";
  const cerrado = pub.estado === "publicado";
  const marca = (n) => <span style={{ position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: 11, background: ORO, color: "#1a1200", fontSize: 12, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>{n}</span>;

  // Rejilla de fotos de un producto: tocar = elegir / quitar (numeradas en el orden elegido).
  const rejilla = (p, lista, limite) => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 10 }}>
      {lista.slice(0, limite).map((f) => {
        const pos = seleccion.findIndex((s) => s.productoId === p.id && s.indice === f.indice);
        const elegida = pos >= 0;
        return (
          <button key={f.indice} onClick={() => alternarFoto(p, f)} aria-pressed={elegida} aria-label={`${p.title || "Producto"} · foto ${f.indice + 1}`}
            disabled={!elegida && lleno}
            style={{ position: "relative", padding: 0, border: `2px solid ${elegida ? ORO : "transparent"}`, borderRadius: 12, overflow: "hidden", background: c.card2, cursor: !elegida && lleno ? "default" : "pointer", aspectRatio: "1 / 1", opacity: !elegida && lleno ? .45 : 1 }}>
            <Foto url={f.url} estilo={{ width: "100%", height: "100%" }} />
            {elegida && marca(pos + 1)}
          </button>
        );
      })}
    </div>
  );

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
    if (e === "foto_cambiada") return caja("⚠️", "Alguna foto cambió o ya no está. Revisa la selección.", "", <>
      <button onClick={() => { setPub({ estado: "inactivo" }); setPaso(2); }} style={secundario}>Revisar las fotos</button>
    </>);
    if (e === "en_curso") return caja("⏳", pub.mensaje, "", null);
    if (e === "limite") return caja("⏱️", pub.mensaje, pub.hora ? `Podrás volver a publicar a partir de las ${pub.hora}.` : "", null);
    if (e === "reconectar") return caja("⚠️", pub.mensaje, "", <>
      <button onClick={() => con.conectar(true)} disabled={con.yendoAFacebook} style={{ ...boton(FB, "#fff"), opacity: con.yendoAFacebook ? .6 : 1 }}>{con.yendoAFacebook ? "Abriendo Facebook…" : "Volver a conectar Facebook"}</button>
    </>);
    return caja("⚠️", pub.mensaje, "", <>
      <button onClick={publicar} style={secundario}>Intentar de nuevo</button>
    </>);
  };

  // Vista previa: la MISMA Página, el MISMO texto y las MISMAS fotos (en orden) que se envían.
  const vistaPrevia = () => {
    const enlace = enlaceEnTexto(texto);
    const n = seleccion.length;
    const nombreDe = (s) => productos.find((p) => p.id === s.productoId)?.title || "Producto";
    return (
      <div style={{ ...tarjeta, overflow: "hidden", marginTop: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px" }}>
          <div style={{ width: 36, height: 36, borderRadius: 18, background: FB, color: "#fff", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>f</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: c.t1 }}>{pagina ? pagina.page_name : "Tu Página de Facebook"}</div>
            <div style={{ fontSize: 11.5, color: c.t2 }}>Así se verá</div>
          </div>
        </div>
        {texto && <p style={{ fontSize: 14, color: c.t1, lineHeight: 1.5, whiteSpace: "pre-wrap", overflowWrap: "anywhere", margin: 0, padding: "0 14px 12px" }}>{texto}</p>}
        {n === 1
          ? <Foto url={seleccion[0].url} miniatura={false} alt={nombreDe(seleccion[0])} estilo={{ width: "100%", aspectRatio: "1 / 1" }} />
          : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2 }}>
              {seleccion.map((s, i) => (
                <div key={s.productoId + ":" + s.indice} style={{ position: "relative", aspectRatio: "1 / 1" }}>
                  <Foto url={s.url} alt={nombreDe(s)} estilo={{ width: "100%", height: "100%" }} />
                  {marca(i + 1)}
                </div>
              ))}
            </div>
          )}
        <div style={{ padding: "10px 14px", borderTop: `1px solid ${c.bd}`, fontSize: 12, color: c.t2, lineHeight: 1.5, overflowWrap: "anywhere" }}>
          <div>{n === 1 ? "1 foto" : `${n} fotos en una sola publicación`}</div>
          <div>{enlace ? <>Enlace incluido en el texto: <span style={{ color: FB }}>{enlace}</span></> : "El texto no incluye ningún enlace."}</div>
        </div>
      </div>
    );
  };

  // ── Pantalla ─────────────────────────────────────────────────────────────
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
          {titulo("Elige las fotos")}
          {/* Fotos seleccionadas, en el orden en que se publicarán */}
          <div style={{ ...tarjeta, padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: c.t1 }}>
              <span>Fotos seleccionadas: {seleccion.length}</span>
              <span style={{ color: lleno ? ORO : c.t2 }}>máximo {FB_FOTOS_MAX}</span>
            </div>
            {seleccion.length === 0 ? nota("Toca una foto para añadirla.") : (
              <div style={{ display: "flex", gap: 8, overflowX: "auto", marginTop: 10, paddingBottom: 2 }}>
                {seleccion.map((s, i) => (
                  <div key={s.productoId + ":" + s.indice} style={{ position: "relative", width: 72, height: 72, flexShrink: 0, borderRadius: 10, overflow: "hidden", background: c.card2 }}>
                    <Foto url={s.url} estilo={{ width: "100%", height: "100%" }} />
                    <span style={{ position: "absolute", left: 4, top: 4, fontSize: 11, fontWeight: 900, color: "#1a1200", background: ORO, borderRadius: 8, padding: "1px 6px" }}>{i + 1}</span>
                    <button onClick={() => quitarFoto(i)} aria-label={`Quitar foto ${i + 1}`} style={{ position: "absolute", right: 3, top: 3, width: 22, height: 22, borderRadius: 11, border: "none", background: "rgba(0,0,0,.65)", color: "#fff", fontSize: 12, cursor: "pointer" }}>✕</button>
                    {i > 0 && <button onClick={() => moverAntes(i)} aria-label={`Mover la foto ${i + 1} antes`} style={{ position: "absolute", left: 3, bottom: 3, width: 22, height: 22, borderRadius: 11, border: "none", background: "rgba(0,0,0,.65)", color: "#fff", fontSize: 13, cursor: "pointer" }}>‹</button>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {nota(producto.title)}
          {fotos.length === 0 ? (
            <div style={{ ...tarjeta, padding: 18, marginTop: 12 }}>{nota("Este producto no tiene fotos que se puedan publicar.")}</div>
          ) : (<>
            {rejilla(producto, fotos, fotosVisibles)}
            {fotos.length > fotosVisibles && (
              <button onClick={() => setFotosVisibles((n) => n + FOTOS_POR_TANDA)} style={{ ...secundario, marginTop: 12 }}>
                Mostrar más ({fotos.length - fotosVisibles})
              </button>
            )}
          </>)}

          {/* Añadir fotos de otros productos propios (solo se cargan al abrir) */}
          {otros.length > 0 && (!otrosAbiertos ? (
            <button onClick={() => setOtrosAbiertos(true)} disabled={lleno} style={{ ...secundario, marginTop: 14, opacity: lleno ? .5 : 1 }}>＋ Añadir fotos de otros productos</button>
          ) : (
            <div style={{ ...tarjeta, overflow: "hidden", marginTop: 14 }}>
              {otros.map((p, i) => {
                const lista = fotosDe(p);
                const abierto = otroAbierto === p.id;
                return (
                  <div key={p.id} style={{ borderTop: i ? `1px solid ${c.bd}` : "none", padding: "10px 12px" }}>
                    <button onClick={() => setOtroAbierto(abierto ? null : p.id)} aria-expanded={abierto} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, background: "transparent", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}>
                      <Foto url={lista[0].url} estilo={{ width: 40, height: 40, borderRadius: 8, flexShrink: 0 }} />
                      <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 600, color: c.t1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.title || "Producto"}</span>
                      <span style={{ fontSize: 12, color: c.t2 }}>{lista.length} {lista.length === 1 ? "foto" : "fotos"} {abierto ? "▴" : "▾"}</span>
                    </button>
                    {abierto && rejilla(p, lista, FOTOS_POR_TANDA)}
                  </div>
                );
              })}
            </div>
          ))}

          <button onClick={() => setPaso(3)} disabled={!seleccion.length} style={{ ...boton(ORO, "#1a1200"), marginTop: 16, opacity: seleccion.length ? 1 : .5 }}>Continuar</button>
        </>)}

        {paso === 3 && producto && seleccion.length > 0 && (<>
          {titulo("Revisa el texto")}
          <textarea value={texto} onChange={(ev) => cambiarTexto(ev.target.value)} maxLength={LIMITE_TEXTO} rows={10} aria-label="Texto de la publicación"
            style={{ width: "100%", boxSizing: "border-box", background: c.card, color: c.t1, border: `1px solid ${c.bd}`, borderRadius: 14, padding: 12, fontSize: 14, lineHeight: 1.5, fontFamily: "inherit", resize: "vertical" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
            <button onClick={restaurarSugerido} disabled={texto === sugerido}
              style={{ background: "transparent", border: "none", color: texto === sugerido ? c.t2 : ORO, fontSize: 12.5, fontWeight: 700, cursor: texto === sugerido ? "default" : "pointer", padding: 0 }}>
              Restaurar texto sugerido
            </button>
            <span style={{ fontSize: 12, color: texto.length >= LIMITE_TEXTO ? "#ef4444" : c.t2 }}>{texto.length} / {LIMITE_TEXTO}</span>
          </div>
          <button onClick={() => setPaso(4)} style={{ ...boton(ORO, "#1a1200"), marginTop: 16 }}>Continuar</button>
        </>)}

        {paso === 4 && producto && seleccion.length > 0 && (<>
          {titulo("Página y vista previa")}
          <AvisoFacebook con={con} c={c} />
          <SelectorPaginas con={con} c={c} bloqueado={bloqueado} alElegir={tocarBorrador} />
          {vistaPrevia()}
          {!cerrado && (
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button onClick={() => setPaso(2)} disabled={bloqueado} style={{ ...secundario, height: 38, fontSize: 13 }}>Cambiar fotos</button>
              <button onClick={() => setPaso(3)} disabled={bloqueado} style={{ ...secundario, height: 38, fontSize: 13 }}>Editar texto</button>
            </div>
          )}
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
