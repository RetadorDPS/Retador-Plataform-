// ═══════════════════════════════════════════════════════════════════════════
// TIENDA PRO — Integración definitiva, fiel a business-stores-system.jsx:
// 9 secciones del Panel (Resumen, Pedidos, Productos, Estadísticas, Clientes,
// Diseño con sus 3 pestañas, Promociones, Configuración, Suscripción) + los 4
// bloques configurables de la Tienda pública (Destacados, Categorías, Todos
// los Productos, Reseñas). Con datos y funciones reales de RETADOR — nunca
// texto de marketing ni números de ejemplo inventados.
//
// Reglas de esta ronda (ver reporte):
// · Regla #2 — el nombre por defecto es el nombre REAL del perfil del
//   vendedor (cfg.name || profileRealName), nunca un nombre de tienda
//   inventado ni genérico. El vendedor puede cambiarlo en Diseño → Branding.
// · Regla #4 — las categorías de la tienda son SIEMPRE las subcategorías
//   reales de los productos del vendedor (derivadas, de solo lectura) — no
//   hay forma de escribir un nombre de categoría a mano.
// · Regla #5 — @usuario NO se conecta aquí (queda dormido, para una función
//   futura de buscar personas en el chat).
// · Regla #6 — la barra inferior de la app nunca se oculta al entrar a esta
//   pantalla en su raíz (pScr="main"): NAV_CLEARANCE reserva su espacio real
//   para que ningún botón quede atrapado debajo de ella.
// ═══════════════════════════════════════════════════════════════════════════
import { useState, useEffect, useMemo, useRef } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import {
  ShoppingCart, TrendingUp, Package, BarChart2, Settings as SettingsIcon, Palette, Tag, CreditCard,
  LayoutDashboard, Bell, Eye, Plus, Zap, Check, Users, ChevronLeft, ChevronRight, Edit2, Trash2,
  Search, X, Upload, GripVertical, ChevronDown, Grid, List, Save, Star,
} from "lucide-react";
import { useAt, useR, money, getMyPlanRequest, submitPlanRequest, getOrCreateReferralCode, getReferralStats, requestPlanPromo, submitSellerReview, getMySellerReview, deleteSellerReview, AvatarUser, toggleFollow } from "../shared/index.js";

/* ── TEMA — propio y compacto, como el resto de paneles "premium" de la app ── */
const S_DARK = {
  bg:"#09090B", s1:"#0F0F14", s2:"#16161E", s3:"#1E1E28",
  b:"rgba(255,255,255,0.07)", t:"#F0F0F8", m:"#6A6A7B", d:"#2E2E3E",
  ok:"#34D399", warn:"#FBBF24", err:"#F87171",
};
const S_LIGHT = {
  bg:"#F7F7FA", s1:"#FFFFFF", s2:"#FFFFFF", s3:"#F0F0F5",
  b:"rgba(0,0,0,0.08)", t:"#111116", m:"#6B6B78", d:"#D8D8E0",
  ok:"#059669", warn:"#B45309", err:"#DC2626",
};
function toRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}` : "255,192,30";
}
const BANNERS = [
  "linear-gradient(140deg,#08080F,#10102A 55%,#090910)",
  "linear-gradient(140deg,#0a0a0a,#0d1f0d 55%,#050a05)",
  "linear-gradient(140deg,#0a050a,#1a0a1a 55%,#05050a)",
  "linear-gradient(140deg,#0a0808,#1a0f0a 55%,#0a0505)",
];
const COLORS = ["#FFC01E","#818CF8","#EC4899","#10B981","#F59E0B","#EF4444","#06B6D4","#8B5CF6"];
// banner_url guarda o una foto real (URL) o uno de estos degradados — se
// distinguen por el propio valor (un degradado siempre empieza así), sin
// columna aparte. Vivos y coordinados con el Color de Marca elegido: se
// generan a partir del accent real, nunca un set fijo desconectado de él.
const isGradientBanner = (v) => typeof v === "string" && /^(linear|radial)-gradient\(/.test(v);
const vividBanners = (ac) => ([
  `linear-gradient(135deg, ${ac}, #1a1033 85%)`,
  `linear-gradient(140deg, #0b0b14, ${ac} 130%)`,
  `radial-gradient(130% 130% at 15% 15%, ${ac}, #0a0a12 72%)`,
  `linear-gradient(120deg, ${ac}, #3730a3)`,
]);
const SC = { pendiente:"#FBBF24", enviado:"#818CF8", entregado:"#34D399", confirmado:"#34D399", completado:"#34D399", asignado:"#818CF8", cancelado:"#F87171" };
const STATUS_LABEL = { pendiente:"Pendiente", enviado:"Enviado", entregado:"Entregado", confirmado:"Confirmado", completado:"Completado", asignado:"Asignado", cancelado:"Cancelado" };
// Reserva real del espacio de la barra inferior de la app (position:absolute,
// se superpone al contenido) — Regla #6: nada puede quedar atrapado debajo.
const NAV_CLEARANCE = "calc(80px + env(safe-area-inset-bottom, 0px))";

function useSTk() {
  const { isDark } = useAt();
  return isDark ? S_DARK : S_LIGHT;
}

/* ── ÁTOMOS ─────────────────────────────────────────────────────────────── */
const Lbl = ({ c, C }) => <div style={{ fontSize:10, fontWeight:600, color:C.m, marginBottom:7, textTransform:"uppercase", letterSpacing:"0.09em" }}>{c}</div>;
const Card = ({ children, style, C }) => <div style={{ borderRadius:14, background:C.s2, border:`1px solid ${C.b}`, padding:18, ...style }}>{children}</div>;
const SBadge = ({ s, C }) => { const k = String(s||"").toLowerCase(); const lb = STATUS_LABEL[k] || s; const cl = SC[k] || C.m; return <span style={{ fontSize:10, fontWeight:600, color:cl, background:`${cl}18`, padding:"3px 8px", borderRadius:20, whiteSpace:"nowrap" }}>{lb}</span>; };
const SHdr = ({ title, sub, btn, onBtn, ac, C }) => (
  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20, gap:10 }}>
    <div style={{ minWidth:0 }}>
      <div style={{ fontSize:18, fontWeight:800, color:C.t }}>{title}</div>
      {sub && <div style={{ fontSize:12, color:C.m, marginTop:2 }}>{sub}</div>}
    </div>
    {btn && <button onClick={onBtn} style={{ padding:"7px 14px", borderRadius:8, background:ac, border:"none", cursor:"pointer", color:"#000", fontSize:12, fontWeight:700, display:"flex", alignItems:"center", gap:5, flexShrink:0 }}><Plus size={12}/>{btn}</button>}
  </div>
);
function inpStyle(C) { return { width:"100%", padding:"9px 12px", borderRadius:8, border:`1px solid ${C.b}`, background:C.s3, color:C.t, fontSize:12, outline:"none" }; }
const PImg = ({ p, h, fz, C }) => (
  <div style={{ height:h||130, background:p.g || `linear-gradient(140deg,${C.s3},${C.d})`, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", position:"relative", flexShrink:0, width:"100%" }}>
    {p.image ? <img src={p.image} style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : <span style={{ fontSize:fz||40, opacity:.55 }}>📦</span>}
  </div>
);
const Toggle = ({ on, onChange, C }) => (
  <div onClick={onChange} style={{ width:36, height:20, borderRadius:10, background:on?C.ok:C.d, cursor:"pointer", position:"relative", transition:"background .2s", flexShrink:0 }}>
    <div style={{ position:"absolute", top:2, width:16, height:16, borderRadius:"50%", background:"#fff", transition:"all .2s", left:on?18:2 }}/>
  </div>
);
function Toast({ msg, type, C }) {
  if (!msg) return null;
  const bg = type === "ok" ? C.ok : type === "err" ? C.err : "#818CF8";
  return <div style={{ position:"fixed", bottom:24, right:24, zIndex:6000, background:bg, color:"#fff", padding:"10px 18px", borderRadius:10, fontSize:13, fontWeight:600, boxShadow:"0 8px 24px rgba(0,0,0,.4)", display:"flex", alignItems:"center", gap:8 }}><Check size={14}/>{msg}</div>;
}
// Regla #4: las categorías de la tienda son SIEMPRE las subcategorías REALES
// que ya usan los productos del vendedor (derivadas, de solo lectura) — nunca
// una lista aparte que se pueda escribir a mano ni desincronizar de lo que
// Búsqueda/categoría ya indexan en toda la plataforma.
function deriveCategories(products) {
  const map = new Map();
  products.forEach(p => { if (p.subcat) map.set(p.subcat, (map.get(p.subcat)||0) + 1); });
  return [...map.entries()].map(([name, count]) => ({ id: name, name, count }));
}

// Dejar/editar/borrar MI reseña libre sobre este vendedor — EXACTAMENTE el
// mismo sistema real que ya usa el perfil Free (submitSellerReview/
// getMySellerReview/deleteSellerReview): una sola, libre, sin necesitar un
// pedido, nunca sobre uno mismo. onSaved recarga la lista/promedio reales
// en el padre (App.jsx), que es quien de verdad los tiene cargados.
function WriteReview({ sellerId, viewerId, C, ac, onSaved }) {
  const canReview = !!viewerId && !!sellerId && viewerId !== sellerId;
  const [myReview, setMyReview] = useState(null);
  const [open, setOpen] = useState(false);
  const [stars, setStars] = useState(0);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!canReview) { setMyReview(null); return; }
    let alive = true;
    getMySellerReview(sellerId, viewerId).then(r => { if (alive) setMyReview(r); }).catch(() => {});
    return () => { alive = false; };
  }, [canReview, sellerId, viewerId]);

  if (!canReview) return null;

  const openEditor = () => { setStars(myReview?.rating || 0); setText(myReview?.comment || ""); setErr(""); setOpen(true); };
  const save = async () => {
    if (!stars || busy) return;
    setBusy(true); setErr("");
    try { await submitSellerReview(sellerId, viewerId, stars, text.trim()); setOpen(false); onSaved?.(); }
    catch (e) { setErr(e?.message || "No se pudo guardar tu reseña"); }
    setBusy(false);
  };
  const remove = async () => {
    if (busy) return;
    setBusy(true); setErr("");
    try { await deleteSellerReview(sellerId, viewerId); setOpen(false); onSaved?.(); }
    catch (e) { setErr(e?.message || "No se pudo eliminar"); }
    setBusy(false);
  };

  if (!open) {
    return (
      <button onClick={openEditor} style={{ width:"100%", marginBottom:14, padding:11, borderRadius:10, border:`1px solid ${ac}`, background:"transparent", color:ac, fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
        <Star size={14} fill={myReview ? ac : "none"}/> {myReview ? "Editar mi reseña" : "Dejar una reseña"}
      </button>
    );
  }
  return (
    <Card C={C} style={{ marginBottom:14 }}>
      <div style={{ fontSize:13, fontWeight:800, color:C.t, marginBottom:10 }}>{myReview ? "Editar mi reseña" : "Dejar una reseña"}</div>
      <div style={{ display:"flex", gap:6, marginBottom:12 }}>
        {[1,2,3,4,5].map(n => (
          <button key={n} onClick={() => setStars(n)} style={{ background:"none", border:"none", cursor:"pointer", padding:0 }}>
            <Star size={22} color="#FBBF24" fill={n<=stars ? "#FBBF24" : "none"}/>
          </button>
        ))}
      </div>
      <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="¿Qué te pareció esta tienda? (opcional)" rows={3} style={{ ...inpStyle(C), resize:"vertical", marginBottom:10 }}/>
      {err && <div style={{ fontSize:11, color:C.err, marginBottom:10 }}>{err}</div>}
      <div style={{ display:"flex", gap:8 }}>
        <button onClick={() => setOpen(false)} style={{ flex:1, padding:9, borderRadius:8, border:`1px solid ${C.b}`, background:"transparent", color:C.m, fontSize:12, cursor:"pointer" }}>Cancelar</button>
        {myReview && <button onClick={remove} disabled={busy} style={{ flex:1, padding:9, borderRadius:8, border:`1px solid ${C.err}`, background:"transparent", color:C.err, fontSize:12, cursor:"pointer" }}>Eliminar</button>}
        <button onClick={save} disabled={!stars || busy} style={{ flex:1, padding:9, borderRadius:8, border:"none", background:(!stars||busy)?C.s3:ac, color:(!stars||busy)?C.m:"#000", fontSize:12, fontWeight:700, cursor:(!stars||busy)?"default":"pointer" }}>{busy?"Guardando…":"Guardar"}</button>
      </div>
    </Card>
  );
}

// Reseñas REALES (seller_reviews) — se usa tanto en el bloque "Reseñas" de
// Inicio como en la pestaña dedicada "Reviews", sin duplicar el marcado.
function ReviewsList({ ratingInfo, reviews, C, ac, sellerId, viewerId, onReviewChanged }) {
  return (
    <>
      {ratingInfo?.rating != null && (
        <Card C={C} style={{ marginBottom:12, display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ fontSize:32, fontWeight:800, color:C.t, lineHeight:1 }}>{ratingInfo.rating.toFixed(1)}</div>
          <div>
            <div style={{ color:"#FBBF24", fontSize:13 }}>{"★".repeat(Math.round(ratingInfo.rating))}{"☆".repeat(5-Math.round(ratingInfo.rating))}</div>
            <div style={{ fontSize:11, color:C.m, marginTop:2 }}>{ratingInfo.count} reseña{ratingInfo.count !== 1 ? "s" : ""}</div>
          </div>
        </Card>
      )}
      <WriteReview sellerId={sellerId} viewerId={viewerId} C={C} ac={ac} onSaved={onReviewChanged}/>
      {reviews.length === 0 && <div style={{ textAlign:"center", padding:"30px 0", color:C.m, fontSize:13 }}>Aún no tiene reseñas.</div>}
      {reviews.slice(0, 5).map(rv => (
        <div key={rv.id} style={{ borderRadius:13, background:C.s2, border:`1px solid ${C.b}`, padding:14, marginBottom:8 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
              <div style={{ width:28, height:28, borderRadius:"50%", background:`linear-gradient(135deg,#3730a3,${ac})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#fff" }}>{(rv.name||"U")[0]}</div>
              <div><div style={{ fontSize:12, fontWeight:600, color:C.t }}>{rv.name}</div><div style={{ color:"#FBBF24", fontSize:10 }}>{"★".repeat(rv.rating)}</div></div>
            </div>
            <span style={{ fontSize:10, color:C.m }}>{rv.createdAt ? new Date(rv.createdAt).toLocaleDateString("es-ES") : ""}</span>
          </div>
          {rv.comment && <p style={{ fontSize:12, color:C.m, lineHeight:1.55 }}>{rv.comment}</p>}
        </div>
      ))}
    </>
  );
}

/* ── STOREFRONT (vista pública — los 4 bloques configurables) ──────────── */
export function StoreFront({ cfg, products, headerStats, ratingInfo, reviews = [], isOwner, onDash, onBack, onMenu, onSettings, onChat, onProduct, embedded = false, profileRealName, isVerified = false, sellerId = null, viewerId = null, onReviewChanged, flash }) {
  const C = useSTk();
  const [tab, setTab] = useState("inicio");
  const [selCat, setSelCat] = useState("all");
  // Punto 2 — Seguir REAL: el estado inicial viene del dato real de la cabecera
  // (headerStats.sigoYo, ya provisto por get_profile_header_stats). Optimista al
  // tocar, pero revierte si toggle_follow (la función real) falla.
  const [following, setFollowing] = useState(!!headerStats?.sigoYo);
  const [followBusy, setFollowBusy] = useState(false);
  useEffect(() => { setFollowing(!!headerStats?.sigoYo); }, [headerStats?.sigoYo, sellerId]);
  const onFollowClick = async () => {
    if (!viewerId || !sellerId || followBusy) { if (!viewerId) flash?.("Inicia sesión para seguir a este vendedor"); return; }
    const next = !following;
    setFollowing(next); setFollowBusy(true);
    try { const real = await toggleFollow(sellerId); setFollowing(real); }
    catch (e) { setFollowing(!next); flash?.("⚠️ No se pudo actualizar: " + (e?.message || "error")); }
    finally { setFollowBusy(false); }
  };
  const ac = cfg.accent || "#FFC01E", r = toRgb(ac);
  // Regla #2: el nombre por defecto es el nombre REAL del perfil — nunca
  // inventado ni genérico. cfg.name (Diseño → Branding) lo reemplaza si el
  // vendedor lo cambió.
  const storeName = cfg.name || profileRealName || "Vendedor";
  const cats = useMemo(() => deriveCategories(products), [products]);
  const hero = cfg.banner_url
    ? (isGradientBanner(cfg.banner_url) ? { background: cfg.banner_url } : { backgroundImage:`url(${cfg.banner_url})`, backgroundSize:"cover", backgroundPosition:"center" })
    : { background: BANNERS[0] };
  const filt = useMemo(() => selCat === "all" ? products : products.filter(p => p.subcat === selCat), [products, selCat]);
  const visSecs = (cfg.sections || []).filter(s => s.visible);
  // Ofertas reales: productos con precio original mayor al precio actual —
  // el mismo dato que ya usa Promociones en el Panel, nunca inventado.
  const onSale = useMemo(() => products.filter(p => p.orig_price != null && Number(p.orig_price) > Number(p.price)), [products]);
  // Regla de fondo: sin foto/emoji propios todavía, el logo por defecto es la
  // FOTO REAL del perfil (nunca una tienda "en blanco" como si fuera cuenta
  // nueva) — logo_emoji trae "🛍️" de fábrica en TODA fila nueva de
  // store_config, así que solo lo tratamos como elección real si es distinto.
  const customEmoji = cfg.logo_emoji && cfg.logo_emoji !== "🛍️" ? cfg.logo_emoji : null;

  const prodCard = (p, h, fz) => (
    <div key={p.id} onClick={() => onProduct?.(p)} style={{ borderRadius:13, background:C.s2, border:`1px solid ${C.b}`, overflow:"hidden", cursor:"pointer" }}>
      <PImg p={p} h={h} fz={fz} C={C}/>
      <div style={{ padding:11 }}>
        <div style={{ fontSize:12, fontWeight:500, marginBottom:4, color:C.t }}>{p.title}</div>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <div style={{ fontSize:14, fontWeight:800, color:p.orig_price ? C.ok : C.t }}>{money(p.price, p.currency)}</div>
          {p.orig_price != null && <div style={{ fontSize:10, color:C.m, textDecoration:"line-through" }}>{money(p.orig_price, p.currency)}</div>}
        </div>
      </div>
    </div>
  );

  const renderSec = (sec) => {
    if (sec.id === "featured") {
      if (!products.length) return null;
      const feat = products[0];
      return (
        <div key="feat" style={{ marginBottom:28 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
            <h2 style={{ fontSize:16, fontWeight:800, color:C.t }}>{sec.label}</h2>
            <span onClick={() => setTab("productos")} style={{ fontSize:12, color:ac, cursor:"pointer", fontWeight:600 }}>Ver todo →</span>
          </div>
          <div onClick={() => onProduct?.(feat)} style={{ borderRadius:16, overflow:"hidden", border:`1px solid rgba(${r},0.25)`, cursor:"pointer" }}>
            <PImg p={feat} h={150} fz={64} C={C}/>
            <div style={{ padding:"14px 18px", background:C.s2 }}>
              <div style={{ fontSize:18, fontWeight:800, color:C.t, marginBottom:6 }}>{feat.title}</div>
              <div style={{ fontSize:20, fontWeight:800, color:C.t }}>{money(feat.price, feat.currency)}</div>
            </div>
          </div>
        </div>
      );
    }
    if (sec.id === "categories") {
      if (!cats.length) return null;
      return (
        <div key="cats" style={{ marginBottom:28 }}>
          <h2 style={{ fontSize:16, fontWeight:800, marginBottom:12, color:C.t }}>{sec.label}</h2>
          <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:2 }}>
            {cats.map(c => <div key={c.id} onClick={() => { setSelCat(c.id); setTab("productos"); }} style={{ padding:"9px 16px", borderRadius:11, background:C.s2, border:`1px solid ${C.b}`, whiteSpace:"nowrap", cursor:"pointer", fontSize:12, fontWeight:500, flexShrink:0, color:C.t }}>{c.name}</div>)}
          </div>
        </div>
      );
    }
    if (sec.id === "allProducts") {
      return (
        <div key="allp" style={{ marginBottom:28 }}>
          <h2 style={{ fontSize:16, fontWeight:800, marginBottom:14, color:C.t }}>{sec.label}</h2>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>{products.slice(0,4).map(p => prodCard(p, 110, 38))}</div>
        </div>
      );
    }
    // Reseñas REALES (seller_reviews) — sin datos inventados: si no hay
    // reseñas todavía, se dice explícitamente en vez de mostrar algo vacío.
    if (sec.id === "reviews") {
      return (
        <div key="revs" style={{ marginBottom:28 }}>
          <h2 style={{ fontSize:16, fontWeight:800, marginBottom:14, color:C.t }}>{sec.label}</h2>
          <ReviewsList ratingInfo={ratingInfo} reviews={reviews} C={C} ac={ac} sellerId={sellerId} viewerId={viewerId} onReviewChanged={onReviewChanged}/>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ background:C.bg, color:C.t, flex:1, minHeight:0, overflowY:"auto", overscrollBehaviorY:"contain", WebkitOverflowScrolling:"touch", paddingBottom: (embedded && isOwner) ? NAV_CLEARANCE : 0 }}>
      <div style={{ position:"relative", height:260, overflow:"hidden", ...hero }}>
        {cfg.banner_url && !isGradientBanner(cfg.banner_url) && <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.48)" }}/>}
        {/* Acceso SIEMPRE disponible al resto de la app: ☰ Menú en la raíz
            (mismo botón que usa el perfil Free), o Volver en pantallas de detalle. */}
        {onMenu && <button onClick={onMenu} style={{ position:"absolute", top:14, left:14, background:"rgba(0,0,0,0.45)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:8, padding:"6px 12px", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", zIndex:2, display:"flex", alignItems:"center", gap:6 }}><span style={{ fontSize:15, lineHeight:1 }}>☰</span> Menú</button>}
        {!onMenu && !embedded && <button onClick={onBack} style={{ position:"absolute", top:14, left:14, background:"rgba(0,0,0,0.45)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:8, padding:"6px 10px", color:"#fff", fontSize:11, cursor:"pointer", zIndex:2, display:"flex", alignItems:"center", gap:4 }}><ChevronLeft size={13}/> Volver</button>}
        {isOwner && (
          <div style={{ position:"absolute", top:14, right:14, zIndex:2, display:"flex", alignItems:"center", gap:6 }}>
            {onSettings && <button onClick={onSettings} aria-label="Configuración" style={{ background:"rgba(0,0,0,0.45)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:8, width:28, height:28, color:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><SettingsIcon size={13}/></button>}
            <button onClick={onDash} style={{ background:`linear-gradient(135deg,#3730a3,${ac})`, border:"none", borderRadius:20, padding:"6px 14px", color:"#fff", fontSize:11, fontWeight:800, cursor:"pointer" }}>⚡ Mi Panel</button>
          </div>
        )}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"0 20px 18px", zIndex:2 }}>
          <div style={{ display:"flex", alignItems:"flex-end", gap:14, marginBottom:12 }}>
            {cfg.logo_url
              ? <img src={cfg.logo_url} style={{ width:64, height:64, borderRadius:"50%", objectFit:"cover", border:"3px solid #09090B", flexShrink:0 }}/>
              : customEmoji
                ? <div style={{ width:64, height:64, borderRadius:"50%", background:`linear-gradient(135deg,#3730a3,${ac})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, border:"3px solid #09090B", flexShrink:0 }}>{customEmoji}</div>
                : <AvatarUser userId={sellerId} name={storeName} size={64} verified={false} style={{ border:"3px solid #09090B" }}/>}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                <h1 style={{ fontSize:20, fontWeight:800, color:"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{storeName}</h1>
                {isVerified && <div style={{ width:16, height:16, borderRadius:"50%", background:ac, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Check size={9} color="#000" strokeWidth={3}/></div>}
              </div>
              {cfg.tagline && <p style={{ color:"rgba(255,255,255,.62)", fontSize:12, lineHeight:1.45, marginBottom:8 }}>{cfg.tagline}</p>}
              <div style={{ display:"flex", gap:18 }}>
                {[[ratingInfo?.rating != null ? ratingInfo.rating.toFixed(1)+"★" : "—","Rating"], [String(headerStats?.seguidores ?? 0),"Seguidores"], [String(headerStats?.ventas ?? 0),"Ventas"]].map(([v,l]) => (
                  <div key={l}><div style={{ fontSize:13, fontWeight:700, color:"#fff" }}>{v}</div><div style={{ fontSize:10, color:"rgba(255,255,255,.45)" }}>{l}</div></div>
                ))}
              </div>
            </div>
          </div>
          {!isOwner && (
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={onFollowClick} disabled={followBusy} style={{ flex:1, padding:"9px 0", borderRadius:9, border: following ? `1px solid rgba(255,255,255,.25)` : "none", cursor: followBusy ? "default" : "pointer", fontSize:13, fontWeight:700, background: following ? "rgba(255,255,255,.08)" : ac, color: following ? "#fff" : "#000", opacity: followBusy ? .7 : 1 }}>{following ? "✓ Siguiendo" : "+ Seguir"}</button>
              <button onClick={onChat} style={{ padding:"9px 14px", borderRadius:9, border:"1px solid rgba(255,255,255,.18)", background:"rgba(255,255,255,.08)", cursor:"pointer", color:"#fff", fontSize:13 }}>💬 Chat</button>
            </div>
          )}
        </div>
      </div>

      {/* Insignias de confianza — datos reales de store_config (ship_days /
          return_days), nunca números fijos de ejemplo. "Verificado" depende
          del estado REAL de verificación de la cuenta (igual que el perfil
          Free) — nunca se muestra fija. */}
      <div style={{ padding:"8px 14px", display:"flex", gap:5, borderBottom:`1px solid ${C.b}` }}>
        {[["🛡️","Compra Segura"], ["⚡", `Envío ${cfg.ship_days ?? 3}d`], ["↩️", `${cfg.return_days ?? 30}d Cambios`], ...(isVerified ? [["✅","Verificado"]] : [])].map(([ic,lb]) => (
          <div key={lb} style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:4, padding:"6px 2px", borderRadius:10, background:C.s2, border:`1px solid ${C.b}`, minWidth:0 }}>
            <span style={{ fontSize:11, flexShrink:0 }}>{ic}</span>
            <span style={{ fontSize:9, color:C.m, fontWeight:600, textAlign:"center", lineHeight:1.2 }}>{lb}</span>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", borderBottom:`1px solid ${C.b}`, overflowX:"auto" }}>
        {[["inicio","Inicio"],["productos","Productos"],["categorias","Categorías"],["ofertas","Ofertas"],["reviews","Reviews"],["info","Info"]].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding:"12px 16px", background:"none", border:"none", cursor:"pointer", fontSize:13, fontWeight:600, whiteSpace:"nowrap", color:tab===id?ac:C.m, borderBottom:tab===id?`2px solid ${ac}`:"2px solid transparent" }}>{label}</button>
        ))}
      </div>

      <div style={{ padding:"22px 20px" }}>
        {tab === "inicio" && (visSecs.length ? visSecs.map(renderSec) : (
          <div style={{ textAlign:"center", padding:"40px 0", color:C.m, fontSize:13 }}>{isOwner ? "Publica tu primer producto para que tu tienda cobre vida." : "Esta tienda aún no tiene productos."}</div>
        ))}
        {tab === "productos" && (
          <div>
            <div style={{ display:"flex", gap:8, overflowX:"auto", marginBottom:18, paddingBottom:2 }}>
              <button onClick={() => setSelCat("all")} style={{ padding:"7px 14px", borderRadius:20, border:`1px solid ${selCat==="all"?ac:C.b}`, background:selCat==="all"?`rgba(${r},0.12)`:"transparent", color:selCat==="all"?ac:C.m, fontSize:12, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}>Todos</button>
              {cats.map(c => <button key={c.id} onClick={() => setSelCat(c.id)} style={{ padding:"7px 14px", borderRadius:20, border:`1px solid ${selCat===c.id?ac:C.b}`, background:selCat===c.id?`rgba(${r},0.12)`:"transparent", color:selCat===c.id?ac:C.m, fontSize:12, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}>{c.name}</button>)}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>{filt.map(p => prodCard(p, 110, 38))}</div>
            {filt.length === 0 && <div style={{ textAlign:"center", padding:"40px 0", color:C.m, fontSize:13 }}>Sin productos en esta categoría.</div>}
          </div>
        )}
        {tab === "categorias" && (
          <div>
            {cats.length === 0 && <div style={{ textAlign:"center", padding:"40px 0", color:C.m, fontSize:13 }}>Esta tienda aún no tiene categorías.</div>}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {cats.map(c => (
                <div key={c.id} onClick={() => { setSelCat(c.id); setTab("productos"); }} style={{ borderRadius:13, background:C.s2, border:`1px solid ${C.b}`, padding:16, cursor:"pointer" }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.t, marginBottom:4 }}>{c.name}</div>
                  <div style={{ fontSize:11, color:C.m }}>{c.count} producto{c.count !== 1 ? "s" : ""}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === "ofertas" && (
          <div>
            {onSale.length === 0 && <div style={{ textAlign:"center", padding:"40px 0", color:C.m, fontSize:13 }}>Esta tienda no tiene ofertas activas ahora.</div>}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>{onSale.map(p => prodCard(p, 110, 38))}</div>
          </div>
        )}
        {tab === "reviews" && (
          <div>
            <ReviewsList ratingInfo={ratingInfo} reviews={reviews} C={C} ac={ac} sellerId={sellerId} viewerId={viewerId} onReviewChanged={onReviewChanged}/>
          </div>
        )}
        {tab === "info" && (
          <div>
            {[["📍","Ubicación",cfg.location],["🕐","Horario",cfg.schedule],["🌐","Sitio web",cfg.website],["📷","Instagram",cfg.instagram],["📘","Facebook",cfg.facebook]].filter(([,,v]) => v).map(([ic,lb,v]) => (
              <div key={lb} style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 14px", borderRadius:12, background:C.s2, border:`1px solid ${C.b}`, marginBottom:8 }}>
                <span style={{ fontSize:17, flexShrink:0 }}>{ic}</span>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:10, color:C.m, fontWeight:600, textTransform:"uppercase", letterSpacing:".05em" }}>{lb}</div>
                  <div style={{ fontSize:13, color:C.t, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{v}</div>
                </div>
              </div>
            ))}
            {!cfg.location && !cfg.schedule && !cfg.website && !cfg.instagram && !cfg.facebook && (
              <div style={{ textAlign:"center", padding:"40px 0", color:C.m, fontSize:13 }}>Esta tienda todavía no agregó información de contacto.</div>
            )}
          </div>
        )}
      </div>

      {cfg.show_footer !== false && (
        <div style={{ borderTop:`1px solid ${C.b}`, padding:"18px 20px", background:C.s1, display:"flex", alignItems:"center", gap:12 }}>
          {cfg.logo_url
            ? <img src={cfg.logo_url} style={{ width:38, height:38, borderRadius:"50%", objectFit:"cover", flexShrink:0 }}/>
            : customEmoji
              ? <div style={{ width:38, height:38, borderRadius:"50%", background:`linear-gradient(135deg,#3730a3,${ac})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, flexShrink:0 }}>{customEmoji}</div>
              : <AvatarUser userId={sellerId} name={storeName} size={38} verified={false}/>}
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:14, fontWeight:800, color:C.t, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{storeName}</div>
            {cfg.location && <div style={{ fontSize:11, color:C.m, marginTop:2 }}>📍 {cfg.location}</div>}
            {cfg.schedule && <div style={{ fontSize:11, color:C.m, marginTop:1 }}>🕐 {cfg.schedule}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── 1) RESUMEN (Overview) ──────────────────────────────────────────────── */
function Overview({ cfg, products, orders, C, ac }) {
  const r = toRgb(ac);
  const active = products.filter(p => !p.archived_at);
  const revenue = orders.reduce((a,o) => a + (Number(o.amount)||0), 0);
  const avgOrder = orders.length ? revenue / orders.length : 0;
  const week = useMemo(() => {
    const days = ["D","L","M","X","J","V","S"];
    const now = Date.now(), buckets = Array.from({length:7},(_,i)=>({ d: days[new Date(now - (6-i)*86400000).getDay()], v:0 }));
    orders.forEach(o => {
      const t = o.created_at ? new Date(o.created_at).getTime() : 0;
      const diffDays = Math.floor((now - t) / 86400000);
      if (diffDays >= 0 && diffDays < 7) buckets[6-diffDays].v += Number(o.amount)||0;
    });
    return buckets;
  }, [orders]);
  const topProducts = useMemo(() => [...active].sort((a,b) => (b.sold_count||0) - (a.sold_count||0)).slice(0,4), [active]);
  const mets = [
    { l:"Ingresos", v: money(revenue, orders[0]?.currency || "USD"), I:TrendingUp },
    { l:"Pedidos", v:String(orders.length), I:ShoppingCart },
    { l:"Productos activos", v:String(active.length), I:Package },
    { l:"Valor promedio", v: money(avgOrder, orders[0]?.currency || "USD"), I:BarChart2 },
  ];
  return (
    <div>
      <SHdr title="Resumen" sub="Datos reales de tu tienda" ac={ac} C={C}/>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
        {mets.map((m,i) => (
          <div key={i} style={{ borderRadius:14, background:C.s2, border:`1px solid ${C.b}`, padding:15, minWidth:0, overflow:"hidden" }}>
            <div style={{ width:30, height:30, borderRadius:7, background:`rgba(${r},0.12)`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:10 }}><m.I size={14} color={ac}/></div>
            <div style={{ fontSize:17, fontWeight:800, marginBottom:2, color:C.t, overflowWrap:"anywhere" }}>{m.v}</div>
            <div style={{ fontSize:11, color:C.m }}>{m.l}</div>
          </div>
        ))}
      </div>
      <Card C={C} style={{ marginBottom:20 }}>
        <div style={{ fontSize:14, fontWeight:800, marginBottom:4, color:C.t }}>Ingresos · Últimos 7 días</div>
        <div style={{ fontSize:11, color:C.m, marginBottom:14 }}>Basado en tus pedidos reales</div>
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={week} margin={{ top:5, right:0, left:-30, bottom:0 }}>
            <defs><linearGradient id="ovg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={ac} stopOpacity={.25}/><stop offset="100%" stopColor={ac} stopOpacity={0}/></linearGradient></defs>
            <XAxis dataKey="d" tick={{ fill:C.m, fontSize:10 }} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={{ background:C.s3, border:`1px solid ${C.b}`, borderRadius:8, color:C.t, fontSize:11 }} formatter={v=>[money(v,"USD"),"Ingresos"]} labelStyle={{ color:C.m }}/>
            <Area type="monotone" dataKey="v" stroke={ac} strokeWidth={2} fill="url(#ovg)"/>
          </AreaChart>
        </ResponsiveContainer>
      </Card>
      <Card C={C} style={{ padding:0, marginBottom:20 }}>
        <div style={{ padding:"14px 18px", borderBottom:`1px solid ${C.b}` }}><div style={{ fontSize:14, fontWeight:800, color:C.t }}>Pedidos recientes</div></div>
        {orders.slice(0,4).map((o,i) => (
          <div key={o.id} style={{ padding:"12px 18px", borderBottom:i<3?`1px solid ${C.b}`:"none", display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:8, background:C.s3, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>📦</div>
            <div style={{ flex:1, minWidth:0, overflow:"hidden" }}><div style={{ fontSize:12, fontWeight:500, color:C.t }}>{o.title || "Pedido"}</div><div style={{ fontSize:10, color:C.m }}>#{String(o.id).slice(0,8)}</div></div>
            <div style={{ textAlign:"right" }}><div style={{ fontSize:13, fontWeight:800, marginBottom:3, color:C.t }}>{money(o.amount, o.currency)}</div><SBadge s={o.status} C={C}/></div>
          </div>
        ))}
        {orders.length === 0 && <div style={{ padding:"30px", textAlign:"center", color:C.m, fontSize:13 }}>Aún no tienes pedidos.</div>}
      </Card>
      <Card C={C} style={{ padding:0 }}>
        <div style={{ padding:"14px 18px", borderBottom:`1px solid ${C.b}` }}><div style={{ fontSize:14, fontWeight:800, color:C.t }}>Top Productos</div></div>
        {topProducts.map((p,i) => (
          <div key={p.id} style={{ padding:"11px 18px", borderBottom:i<topProducts.length-1?`1px solid ${C.b}`:"none", display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:11, color:C.m, width:14 }}>{i+1}</span>
            <div style={{ width:34, height:34, borderRadius:8, overflow:"hidden", flexShrink:0 }}><PImg p={p} h={34} fz={18} C={C}/></div>
            <div style={{ flex:1, minWidth:0, overflow:"hidden" }}><div style={{ fontSize:12, fontWeight:500, color:C.t, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.title}</div><div style={{ fontSize:10, color:C.m }}>{p.sold_count||0} vendidos</div></div>
            <div style={{ fontSize:13, fontWeight:800, color:C.t }}>{money(p.price, p.currency)}</div>
          </div>
        ))}
        {topProducts.length === 0 && <div style={{ padding:"30px", textAlign:"center", color:C.m, fontSize:13 }}>Aún no tienes productos.</div>}
      </Card>
    </div>
  );
}

/* ── 2) PEDIDOS (solo lectura del estado real) ─────────────────────────── */
function Pedidos({ orders, C, ac }) {
  const r = toRgb(ac);
  const [filt, setFilt] = useState("Todos");
  const [sel, setSel] = useState(null);
  const STS = ["Todos", ...new Set(orders.map(o => STATUS_LABEL[String(o.status).toLowerCase()] || o.status))];
  const list = filt === "Todos" ? orders : orders.filter(o => (STATUS_LABEL[String(o.status).toLowerCase()] || o.status) === filt);

  if (sel) {
    const cur = orders.find(o => o.id === sel.id) || sel;
    return (
      <div>
        <button onClick={() => setSel(null)} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", cursor:"pointer", color:C.m, fontSize:13, marginBottom:20, padding:0 }}><ChevronLeft size={16}/> Volver</button>
        <Card C={C} style={{ marginBottom:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
            <div><div style={{ fontSize:18, fontWeight:800, marginBottom:4, color:C.t }}>#{String(cur.id).slice(0,8)}</div><div style={{ fontSize:12, color:C.m }}>{cur.created_at ? new Date(cur.created_at).toLocaleDateString("es-ES") : ""}</div></div>
            <SBadge s={cur.status} C={C}/>
          </div>
          {[["Cliente", cur.buyerName || "—"],["Producto",cur.title],["Cantidad",cur.qty],["Total",money(cur.amount, cur.currency)]].map(([l,v]) => (
            <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid ${C.b}` }}><span style={{ fontSize:12, color:C.m }}>{l}</span><span style={{ fontSize:12, fontWeight:600, color:C.t }}>{v}</span></div>
          ))}
        </Card>
        <div style={{ fontSize:11, color:C.m, fontStyle:"italic" }}>El estado se actualiza solo, siguiendo el pedido real — no se cambia desde aquí.</div>
      </div>
    );
  }

  return (
    <div>
      <SHdr title="Pedidos" sub={`${orders.length} en total`} ac={ac} C={C}/>
      <div style={{ display:"flex", gap:8, marginBottom:18, overflowX:"auto", paddingBottom:2 }}>
        {STS.map(s => <button key={s} onClick={() => setFilt(s)} style={{ padding:"6px 14px", borderRadius:20, border:`1px solid ${filt===s?ac:C.b}`, background:filt===s?`rgba(${r},0.12)`:"transparent", color:filt===s?ac:C.m, cursor:"pointer", fontSize:12, fontWeight:600, whiteSpace:"nowrap", flexShrink:0 }}>{s}</button>)}
      </div>
      <Card C={C} style={{ padding:0 }}>
        {list.map((o,i) => (
          <div key={o.id} onClick={() => setSel(o)} style={{ padding:"14px 18px", borderBottom:i<list.length-1?`1px solid ${C.b}`:"none", display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
            <div style={{ width:36, height:36, borderRadius:9, background:C.s3, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>📦</div>
            <div style={{ flex:1, minWidth:0, overflow:"hidden" }}><div style={{ fontSize:12, fontWeight:600, marginBottom:2, color:C.t }}>#{String(o.id).slice(0,8)}</div><div style={{ fontSize:11, color:C.m, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{o.title}</div></div>
            <div style={{ textAlign:"right", flexShrink:0 }}><div style={{ fontSize:14, fontWeight:800, marginBottom:4, color:C.t }}>{money(o.amount, o.currency)}</div><SBadge s={o.status} C={C}/></div>
            <ChevronRight size={14} color={C.m}/>
          </div>
        ))}
        {list.length === 0 && <div style={{ padding:"40px", textAlign:"center", color:C.m, fontSize:13 }}>Sin pedidos.</div>}
      </Card>
    </div>
  );
}

/* ── 3) PRODUCTOS (reutiliza formulario y funciones reales) ─────────────── */
function ProdsSection({ products, C, ac, onNewProduct, onEditProduct, onArchiveProduct, onUnarchiveProduct, onDeleteProduct, maxProducts }) {
  const [view, setView] = useState("activos");
  const activos = products.filter(p => !p.archived_at);
  const archivados = products.filter(p => p.archived_at);
  const shown = view === "activos" ? activos : archivados;
  const limitTxt = maxProducts ? `${activos.length} de ${maxProducts} publicados` : `${activos.length} publicados`;
  return (
    <div>
      <SHdr title="Productos" sub={limitTxt} btn="Nuevo Producto" onBtn={onNewProduct} ac={ac} C={C}/>
      <div style={{ display:"flex", gap:6, marginBottom:16, background:C.s1, borderRadius:10, padding:3 }}>
        {[["activos",`Activos (${activos.length})`],["archivados",`Archivados (${archivados.length})`]].map(([id,lb]) => (
          <button key={id} onClick={() => setView(id)} style={{ flex:1, padding:"7px", borderRadius:8, border:"none", cursor:"pointer", fontSize:12, fontWeight:700, background:view===id?ac:"transparent", color:view===id?"#000":C.m }}>{lb}</button>
        ))}
      </div>
      {shown.length === 0 && <div style={{ padding:"40px", textAlign:"center", color:C.m, fontSize:13 }}>{view==="activos" ? "Aún no has publicado nada." : "No tienes productos archivados."}</div>}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        {shown.map(prod => (
          <div key={prod.id} style={{ borderRadius:13, background:C.s2, border:`1px solid ${C.b}`, overflow:"hidden", opacity:prod.archived_at?.6:1 }}>
            <PImg p={prod} h={110} fz={36} C={C}/>
            <div style={{ padding:11 }}>
              <div style={{ fontSize:12, fontWeight:500, marginBottom:2, color:C.t }}>{prod.title}</div>
              <div style={{ fontSize:10, color:C.m, marginBottom:8 }}>{prod.subcat || "Sin categoría"}</div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:14, fontWeight:800, color:C.t }}>{money(prod.price, prod.currency)}</span>
                <div style={{ display:"flex", gap:5 }}>
                  {!prod.archived_at ? (<>
                    <button onClick={() => onEditProduct(prod)} style={{ width:26, height:26, borderRadius:6, background:C.s3, border:`1px solid ${C.b}`, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><Edit2 size={11} color={ac}/></button>
                    <button onClick={() => onArchiveProduct(prod.id)} title="Archivar" style={{ width:26, height:26, borderRadius:6, background:C.s3, border:`1px solid ${C.b}`, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><Package size={11} color={C.m}/></button>
                  </>) : (
                    <button onClick={() => onUnarchiveProduct(prod.id)} title="Recuperar" style={{ width:26, height:26, borderRadius:6, background:`${ac}22`, border:`1px solid ${ac}`, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><Upload size={11} color={ac}/></button>
                  )}
                  <button onClick={() => onDeleteProduct(prod.id)} style={{ width:26, height:26, borderRadius:6, background:C.s3, border:`1px solid ${C.b}`, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><Trash2 size={11} color={C.err}/></button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 4) ESTADÍSTICAS (Analytics — todo derivado de pedidos/productos reales) */
function Analytics({ products, orders, C, ac }) {
  const r = toRgb(ac);
  const [period, setPeriod] = useState("week");
  const [drop, setDrop] = useState(false);
  const PERS = [{ id:"today", l:"Hoy" }, { id:"week", l:"Esta semana" }, { id:"month", l:"Este mes" }, { id:"year", l:"Este año" }];
  const active = products.filter(p => !p.archived_at);
  const cats = useMemo(() => deriveCategories(products), [products]);

  const chartData = useMemo(() => {
    const now = Date.now();
    if (period === "today") {
      const buckets = Array.from({ length:6 }, (_,i) => ({ d:`${i*4}h`, v:0 }));
      orders.forEach(o => { const t = o.created_at ? new Date(o.created_at) : null; if (!t || (now - t.getTime()) > 86400000) return; buckets[Math.min(5, Math.floor(t.getHours()/4))].v += Number(o.amount)||0; });
      return buckets;
    }
    if (period === "week") {
      const days = ["D","L","M","X","J","V","S"];
      const buckets = Array.from({ length:7 }, (_,i) => ({ d: days[new Date(now - (6-i)*86400000).getDay()], v:0 }));
      orders.forEach(o => { const t = o.created_at ? new Date(o.created_at).getTime() : 0; const diff = Math.floor((now-t)/86400000); if (diff>=0 && diff<7) buckets[6-diff].v += Number(o.amount)||0; });
      return buckets;
    }
    if (period === "month") {
      const buckets = Array.from({ length:4 }, (_,i) => ({ d:`Sem ${i+1}`, v:0 }));
      orders.forEach(o => { const t = o.created_at ? new Date(o.created_at) : null; if (!t) return; const diffDays = Math.floor((now - t.getTime())/86400000); if (diffDays>=0 && diffDays<28) buckets[3-Math.floor(diffDays/7)].v += Number(o.amount)||0; });
      return buckets;
    }
    const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    const buckets = Array.from({ length:12 }, (_,i) => ({ d: meses[i], v:0 }));
    const y = new Date().getFullYear();
    orders.forEach(o => { const t = o.created_at ? new Date(o.created_at) : null; if (!t || t.getFullYear()!==y) return; buckets[t.getMonth()].v += Number(o.amount)||0; });
    return buckets;
  }, [orders, period]);

  const catData = useMemo(() => {
    const byId = new Map(products.map(p => [p.id, p]));
    const tally = new Map();
    orders.forEach(o => {
      const p = byId.get(o.productId);
      const key = p?.subcat || null;
      if (!key) return;
      tally.set(key, (tally.get(key)||0) + (Number(o.amount)||0));
    });
    return cats.map(c => ({ name:c.name, v: tally.get(c.name) || 0 }));
  }, [orders, products, cats]);

  const revenue = orders.reduce((a,o) => a + (Number(o.amount)||0), 0);
  const avgOrder = orders.length ? revenue / orders.length : 0;
  const miniStats = [
    { l:"Valor promedio", v: money(avgOrder, orders[0]?.currency || "USD") },
    { l:"Pedidos totales", v: String(orders.length) },
    { l:"Productos activos", v: String(active.length) },
    { l:"Categorías", v: String(cats.length) },
  ];

  return (
    <div>
      <SHdr title="Estadísticas" sub="Métricas y rendimiento reales" ac={ac} C={C}/>
      <Card C={C} style={{ marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
          <div><div style={{ fontSize:14, fontWeight:800, color:C.t }}>Ingresos</div><div style={{ fontSize:11, color:C.m }}>Pedidos reales del período</div></div>
          <div style={{ position:"relative" }}>
            <button onClick={() => setDrop(!drop)} style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 10px", borderRadius:7, border:`1px solid ${C.b}`, background:C.s3, color:C.t, fontSize:11, fontWeight:500, cursor:"pointer" }}>
              {PERS.find(p=>p.id===period)?.l}<ChevronDown size={11}/>
            </button>
            {drop && (
              <div style={{ position:"absolute", right:0, top:"calc(100% + 4px)", background:C.s3, border:`1px solid ${C.b}`, borderRadius:9, overflow:"hidden", zIndex:20, minWidth:120, boxShadow:"0 8px 24px rgba(0,0,0,0.4)" }}>
                {PERS.map(p => <div key={p.id} onClick={() => { setPeriod(p.id); setDrop(false); }} style={{ padding:"9px 14px", fontSize:12, cursor:"pointer", color:period===p.id?ac:C.t, background:period===p.id?`rgba(${r},0.1)`:"transparent", fontWeight:period===p.id?600:400 }}>{p.l}</div>)}
              </div>
            )}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={150}>
          <AreaChart data={chartData} margin={{ top:5, right:0, left:-30, bottom:0 }}>
            <defs><linearGradient id="ang" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={ac} stopOpacity={0.25}/><stop offset="100%" stopColor={ac} stopOpacity={0}/></linearGradient></defs>
            <XAxis dataKey="d" tick={{ fill:C.m, fontSize:10 }} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={{ background:C.s3, border:`1px solid ${C.b}`, borderRadius:8, color:C.t, fontSize:11 }} formatter={v=>[money(v,"USD"),"Ingresos"]} labelStyle={{ color:C.m }}/>
            <Area type="monotone" dataKey="v" stroke={ac} strokeWidth={2} fill="url(#ang)"/>
          </AreaChart>
        </ResponsiveContainer>
      </Card>
      <Card C={C} style={{ marginBottom:16 }}>
        <div style={{ fontSize:14, fontWeight:800, marginBottom:4, color:C.t }}>Ventas por Categoría</div>
        <div style={{ fontSize:11, color:C.m, marginBottom:14 }}>Basado en pedidos reales, por subcategoría</div>
        {catData.length === 0
          ? <div style={{ textAlign:"center", padding:"20px", color:C.m, fontSize:12 }}>Publica productos para ver estadísticas por categoría.</div>
          : <ResponsiveContainer width="100%" height={150}>
              <BarChart data={catData} margin={{ top:5, right:10, left:10, bottom:30 }}>
                <XAxis dataKey="name" tick={{ fill:C.m, fontSize:9 }} axisLine={false} tickLine={false} interval={0} angle={-15} textAnchor="end"/>
                <Tooltip contentStyle={{ background:C.s3, border:`1px solid ${C.b}`, borderRadius:8, color:C.t, fontSize:11 }} formatter={v=>[money(v,"USD"),"Ingresos"]} labelStyle={{ color:C.m }}/>
                <Bar dataKey="v" radius={[4,4,0,0]}>{catData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} opacity={0.85}/>)}</Bar>
              </BarChart>
            </ResponsiveContainer>
        }
      </Card>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        {miniStats.map((m,i) => (
          <Card key={i} C={C} style={{ padding:14, minWidth:0, overflow:"hidden" }}>
            <div style={{ fontSize:11, color:C.m, marginBottom:6 }}>{m.l}</div>
            <div style={{ fontSize:16, fontWeight:800, color:C.t, overflowWrap:"anywhere" }}>{m.v}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ── 5) CLIENTES (derivados de pedidos reales — nunca una lista aparte) ─── */
function Clientes({ orders, C, ac }) {
  const [search, setSearch] = useState("");
  const [sel, setSel] = useState(null);
  const custs = useMemo(() => {
    const map = new Map();
    orders.forEach(o => {
      if (!o.buyerId) return;
      const cur = map.get(o.buyerId) || { id:o.buyerId, name:o.buyerName || "Comprador", orders:0, total:0, last:null, currency:o.currency };
      cur.orders += 1;
      cur.total += Number(o.amount) || 0;
      const t = o.created_at ? new Date(o.created_at) : null;
      if (t && (!cur.last || t > cur.last)) cur.last = t;
      map.set(o.buyerId, cur);
    });
    return [...map.values()].sort((a,b) => b.total - a.total);
  }, [orders]);
  const list = custs.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  if (sel) {
    const co = orders.filter(o => o.buyerId === sel.id);
    return (
      <div>
        <button onClick={() => setSel(null)} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", cursor:"pointer", color:C.m, fontSize:13, marginBottom:20, padding:0 }}><ChevronLeft size={16}/> Volver</button>
        <Card C={C} style={{ marginBottom:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20 }}>
            <div style={{ width:56, height:56, borderRadius:"50%", background:`linear-gradient(135deg,#3730a3,${ac})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:700, color:"#fff", flexShrink:0 }}>{sel.name[0]}</div>
            <div><div style={{ fontSize:17, fontWeight:800, marginBottom:3, color:C.t }}>{sel.name}</div><div style={{ fontSize:12, color:C.m }}>{sel.orders} pedido{sel.orders!==1?"s":""} real{sel.orders!==1?"es":""}</div></div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[["Total gastado", money(sel.total, sel.currency)],["Último pedido", sel.last ? sel.last.toLocaleDateString("es-ES") : "—"]].map(([l,v]) => (
              <div key={l} style={{ textAlign:"center", padding:"10px", background:C.s3, borderRadius:10 }}>
                <div style={{ fontSize:14, fontWeight:800, marginBottom:2, color:C.t }}>{v}</div>
                <div style={{ fontSize:9, color:C.m }}>{l}</div>
              </div>
            ))}
          </div>
        </Card>
        <div style={{ fontSize:14, fontWeight:800, marginBottom:12, color:C.t }}>Historial de pedidos</div>
        <Card C={C} style={{ padding:0 }}>
          {co.map((o,i) => (
            <div key={o.id} style={{ padding:"12px 16px", borderBottom:i<co.length-1?`1px solid ${C.b}`:"none", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div><div style={{ fontSize:12, fontWeight:500, marginBottom:2, color:C.t }}>#{String(o.id).slice(0,8)}</div><div style={{ fontSize:11, color:C.m }}>{o.title} · {o.created_at ? new Date(o.created_at).toLocaleDateString("es-ES") : ""}</div></div>
              <div style={{ textAlign:"right" }}><div style={{ fontSize:13, fontWeight:700, marginBottom:3, color:C.t }}>{money(o.amount, o.currency)}</div><SBadge s={o.status} C={C}/></div>
            </div>
          ))}
        </Card>
      </div>
    );
  }

  return (
    <div>
      <SHdr title="Clientes" sub={`${custs.length} cliente${custs.length!==1?"s":""} real${custs.length!==1?"es":""}`} ac={ac} C={C}/>
      <div style={{ position:"relative", marginBottom:18 }}>
        <Search size={14} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:C.m, pointerEvents:"none" }}/>
        <input placeholder="Buscar por nombre..." value={search} onChange={e=>setSearch(e.target.value)} style={{ ...inpStyle(C), paddingLeft:34 }}/>
      </div>
      <Card C={C} style={{ padding:0 }}>
        {list.map((c,i) => (
          <div key={c.id} onClick={() => setSel(c)} style={{ padding:"14px 18px", borderBottom:i<list.length-1?`1px solid ${C.b}`:"none", display:"flex", alignItems:"center", gap:12, cursor:"pointer" }}>
            <div style={{ width:38, height:38, borderRadius:"50%", background:`linear-gradient(135deg,#3730a3,${ac})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:"#fff", flexShrink:0 }}>{c.name[0]}</div>
            <div style={{ flex:1, minWidth:0, overflow:"hidden" }}><div style={{ fontSize:13, fontWeight:500, color:C.t, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.name}</div><div style={{ fontSize:11, color:C.m }}>{c.orders} pedido{c.orders!==1?"s":""}</div></div>
            <div style={{ fontSize:13, fontWeight:700, color:C.t, flexShrink:0 }}>{money(c.total, c.currency)}</div>
            <ChevronRight size={14} color={C.m}/>
          </div>
        ))}
        {list.length === 0 && <div style={{ padding:"40px", textAlign:"center", color:C.m, fontSize:13 }}>{custs.length === 0 ? "Aún no tienes pedidos de clientes." : "Sin resultados."}</div>}
      </Card>
    </div>
  );
}

/* ── 6) DISEÑO (branding + secciones + categorías derivadas, con vista previa) */
function Diseno({ cfg, products, onUpdateConfig, C, ac, flash, profileRealName }) {
  const [draft, setDraft] = useState(cfg);
  useEffect(() => { setDraft(cfg); }, [cfg]);
  const [tab, setTab] = useState("branding");
  const [device, setDevice] = useState("mobile");
  // Plegar/desplegar el EDITOR (izquierda): plegado, la vista previa
  // (derecha) gana ese espacio y se ve más grande; desplegado, vuelven a
  // convivir editor + vista previa.
  const [editorCollapsed, setEditorCollapsed] = useState(false);
  const [dIdx, setDIdx] = useState(null);
  const [dOver, setDOver] = useState(null);
  const [saving, setSaving] = useState(false);
  const logoRef = useRef(null), banRef = useRef(null);
  const cats = useMemo(() => deriveCategories(products), [products]);
  const r = toRgb(ac);
  const previewName = draft.name || profileRealName || "Vendedor";

  const upd = (k,v) => setDraft(p => ({ ...p, [k]:v }));
  const updSec = (i,key,val) => setDraft(p => ({ ...p, sections: p.sections.map((s,ix) => ix===i ? { ...s,[key]:val } : s) }));
  const reorder = (from,to) => setDraft(p => { const arr=[...p.sections]; const [it]=arr.splice(from,1); arr.splice(to,0,it); return { ...p, sections:arr }; });
  const handleLogo = (e) => { const f=e.target.files[0]; if(!f) return; const rd=new FileReader(); rd.onload=ev=>upd("logo_url", ev.target.result); rd.readAsDataURL(f); };
  const handleBan  = (e) => { const f=e.target.files[0]; if(!f) return; const rd=new FileReader(); rd.onload=ev=>upd("banner_url", ev.target.result); rd.readAsDataURL(f); };

  const save = async () => {
    setSaving(true);
    try { await onUpdateConfig(draft); flash?.("⚡ Cambios publicados"); }
    catch (e) { flash?.("⚠️ " + (e?.message || "No se pudo guardar")); }
    setSaving(false);
  };

  const previewHero = draft.banner_url
    ? (isGradientBanner(draft.banner_url) ? { background: draft.banner_url } : { backgroundImage:`url(${draft.banner_url})`, backgroundSize:"cover", backgroundPosition:"center" })
    : { background: BANNERS[0] };
  const gradientOpts = useMemo(() => vividBanners(draft.accent || ac), [draft.accent, ac]);

  return (
    <div style={{ display:"flex", height:"100%", position:"relative" }}>
      {/* Placeholder con contraste real — el gris apagado del navegador por
          defecto se veía casi invisible sobre el fondo oscuro de estos campos. */}
      <style>{`.rtd-ph::placeholder{color:${C.m};opacity:1}`}</style>
      <div style={{ flex: editorCollapsed ? "0 0 0px" : "0 0 268px", minWidth:0, background:C.s1, borderRight: editorCollapsed ? "none" : `1px solid ${C.b}`, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ padding:"14px 16px", borderBottom:`1px solid ${C.b}` }}>
          <div style={{ fontSize:13, fontWeight:800, color:C.t, whiteSpace:"nowrap" }}>Editor de Tienda</div>
        </div>
        <div style={{ display:"flex", borderBottom:`1px solid ${C.b}` }}>
          {["branding","secciones","categorías"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex:1, padding:"9px 4px", background:"none", border:"none", cursor:"pointer", fontSize:10, fontWeight:600, textTransform:"capitalize", color:tab===t?ac:C.m, borderBottom:tab===t?`2px solid ${ac}`:"2px solid transparent" }}>{t}</button>
          ))}
        </div>
        <div style={{ flex:1, minHeight:0, overflowY:"auto", padding:14 }}>
          {tab === "branding" && (
            <div>
              <Lbl c="Ícono / Logo" C={C}/>
              <input ref={logoRef} type="file" accept="image/*" onChange={handleLogo} style={{ display:"none" }}/>
              {draft.logo_url
                ? <div style={{ marginBottom:14, display:"flex", alignItems:"center", gap:10 }}>
                    <img src={draft.logo_url} style={{ width:44, height:44, borderRadius:"50%", objectFit:"cover", border:`2px solid ${ac}` }}/>
                    <button onClick={() => upd("logo_url", null)} style={{ fontSize:10, color:C.err, background:"none", border:"none", cursor:"pointer" }}>Eliminar</button>
                  </div>
                : <div>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
                      {["🛍️","⚡","🧸","🏆","⭐"].map(e => <button key={e} onClick={() => upd("logo_emoji", e)} style={{ width:32, height:32, borderRadius:7, border:`2px solid ${draft.logo_emoji===e?ac:C.b}`, background:C.s2, cursor:"pointer", fontSize:15 }}>{e}</button>)}
                    </div>
                    <button onClick={() => logoRef.current?.click()} style={{ width:"100%", padding:8, borderRadius:8, border:`1px dashed ${C.b}`, background:"transparent", color:C.m, fontSize:11, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5, marginBottom:14 }}><Upload size={12}/>O sube una foto real</button>
                  </div>}
              <Lbl c="Nombre de tienda" C={C}/>
              <input className="rtd-ph" value={draft.name || ""} onChange={e=>upd("name",e.target.value)} placeholder={profileRealName || "Tu nombre real"} style={{ ...inpStyle(C), marginBottom:6 }}/>
              <div style={{ fontSize:10, color:C.m, marginBottom:12, lineHeight:1.5 }}>Vacío = se muestra tu nombre real de perfil ({profileRealName || "—"}).</div>
              <Lbl c="Tagline" C={C}/>
              <input className="rtd-ph" value={draft.tagline || ""} onChange={e=>upd("tagline",e.target.value)} placeholder="Ej: Envíos rápidos, atención todos los días" style={{ ...inpStyle(C), marginBottom:12 }}/>
              <Lbl c="Color de marca" C={C}/>
              <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginBottom:16 }}>
                {COLORS.map(c => <button key={c} onClick={() => upd("accent",c)} style={{ width:26, height:26, borderRadius:"50%", background:c, cursor:"pointer", border:`3px solid ${draft.accent===c?C.t:"transparent"}` }}/>)}
              </div>
              <Lbl c="Banner de portada" C={C}/>
              <input ref={banRef} type="file" accept="image/*" onChange={handleBan} style={{ display:"none" }}/>
              {draft.banner_url && (
                <div style={{ height:54, borderRadius:8, ...(isGradientBanner(draft.banner_url) ? { background:draft.banner_url } : { backgroundImage:`url(${draft.banner_url})`, backgroundSize:"cover", backgroundPosition:"center" }), marginBottom:8, border:`1px solid ${C.b}`, position:"relative" }}>
                  <button onClick={() => upd("banner_url", null)} style={{ position:"absolute", top:4, right:4, width:20, height:20, borderRadius:"50%", background:"rgba(0,0,0,.6)", border:"none", cursor:"pointer", color:"#fff" }}><X size={10}/></button>
                </div>
              )}
              <button onClick={() => banRef.current?.click()} style={{ width:"100%", padding:10, borderRadius:8, border:`1px dashed ${C.b}`, background:"transparent", color:C.m, fontSize:11, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6, marginBottom:10 }}><Upload size={13}/>Subir foto de portada</button>
              <div style={{ fontSize:10, color:C.m, marginBottom:8 }}>O elige un degradado, coordinado con tu color de marca:</div>
              <div style={{ display:"flex", gap:7, marginBottom:4 }}>
                {gradientOpts.map((g,i) => (
                  <button key={i} onClick={() => upd("banner_url", g)} style={{ flex:1, height:34, borderRadius:8, background:g, border:`2px solid ${draft.banner_url===g?C.t:"transparent"}`, cursor:"pointer" }}/>
                ))}
              </div>
            </div>
          )}
          {tab === "secciones" && (
            <div>
              <div style={{ fontSize:11, color:C.m, marginBottom:12, lineHeight:1.5 }}>Arrastra para reordenar · Activa o desactiva</div>
              {(draft.sections||[]).map((sec,i) => (
                <div key={sec.id} draggable
                  onDragStart={() => setDIdx(i)}
                  onDragOver={e => { e.preventDefault(); if (i!==dIdx) setDOver(i); }}
                  onDrop={() => { if (dIdx!==null && dIdx!==i) reorder(dIdx,i); setDIdx(null); setDOver(null); }}
                  onDragEnd={() => { setDIdx(null); setDOver(null); }}
                  style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 10px", marginBottom:4, borderRadius:9, border:`1px solid ${dOver===i?ac:C.b}`, cursor:"grab" }}>
                  <GripVertical size={14} color={C.d} style={{ flexShrink:0 }}/>
                  <span style={{ flex:1, fontSize:12, fontWeight:500, color:C.t }}>{sec.label}</span>
                  <Toggle on={sec.visible} onChange={() => updSec(i,"visible",!sec.visible)} C={C}/>
                </div>
              ))}
              <div style={{ marginTop:16, padding:14, borderRadius:12, background:C.s3, border:`1px solid ${C.b}` }}>
                <div style={{ fontSize:10, fontWeight:600, color:C.m, marginBottom:10, textTransform:"uppercase" }}>Presentación</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  {[{id:"grid",label:"Grid",Icon:Grid},{id:"list",label:"Lista",Icon:List}].map(opt => {
                    const active = draft.layout === opt.id;
                    return <button key={opt.id} onClick={() => upd("layout",opt.id)} style={{ padding:"10px 8px", borderRadius:9, border:`1px solid ${active?ac:C.b}`, background:active?`rgba(${r},0.12)`:"transparent", color:active?ac:C.m, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}><opt.Icon size={16}/><span style={{ fontSize:11 }}>{opt.label}</span></button>;
                  })}
                </div>
              </div>
              <div style={{ marginTop:12, paddingTop:12, borderTop:`1px solid ${C.b}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:12, color:C.t }}>Footer / Info</span>
                <Toggle on={draft.show_footer !== false} onChange={() => upd("show_footer", draft.show_footer===false)} C={C}/>
              </div>
            </div>
          )}
          {tab === "categorías" && (
            <div>
              {/* Regla #4: solo lectura — nunca un campo para escribir un
                  nombre de categoría a mano. Se derivan de la subcategoría
                  real que el vendedor ya elige del catálogo al publicar. */}
              <div style={{ fontSize:11, color:C.m, marginBottom:14, lineHeight:1.6 }}>Tus categorías son las subcategorías reales que ya usas al publicar — se crean solas cuando publicas un producto, para que Búsqueda nunca se desconecte de tu tienda.</div>
              {cats.length === 0 && <div style={{ textAlign:"center", padding:"20px 0", color:C.m, fontSize:12 }}>Publica productos y aquí aparecerán sus categorías.</div>}
              {cats.map(c => (
                <div key={c.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:`1px solid ${C.b}` }}>
                  <div style={{ fontSize:13, fontWeight:500, color:C.t }}>{c.name}</div>
                  <div style={{ fontSize:10, color:C.m }}>{c.count} producto{c.count!==1?"s":""}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ padding:"12px 14px", borderTop:`1px solid ${C.b}` }}>
          <button onClick={save} disabled={saving} style={{ width:"100%", padding:11, borderRadius:9, border:"none", cursor:"pointer", background:`linear-gradient(135deg,#3730a3,${ac})`, color:"#fff", fontSize:13, fontWeight:800, opacity:saving?.7:1 }}>{saving?"Guardando…":"⚡ Publicar cambios"}</button>
        </div>
      </div>
      <div style={{ flex:1, background:C.bg, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0 }}>
        <div style={{ padding:"10px 16px", borderBottom:`1px solid ${C.b}`, display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0, gap:8 }}>
          <button onClick={() => setEditorCollapsed(v => !v)} title={editorCollapsed ? "Mostrar editor" : "Plegar editor (agrandar vista previa)"} style={{ width:26, height:26, borderRadius:6, border:`1px solid ${C.b}`, background:C.s3, color:C.m, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            {editorCollapsed ? <ChevronRight size={13}/> : <ChevronLeft size={13}/>}
          </button>
          <div style={{ display:"flex", gap:6 }}>
            {[{ id:"mobile", e:"📱" }, { id:"desktop", e:"🖥️" }].map(d => (
              <button key={d.id} onClick={() => setDevice(d.id)} style={{ padding:"4px 10px", borderRadius:6, cursor:"pointer", fontSize:13, border:`1px solid ${device===d.id?ac:C.b}`, background:device===d.id?`rgba(${r},0.12)`:"transparent", color:device===d.id?ac:C.m }}>{d.e}</button>
            ))}
          </div>
        </div>
        <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:16, overflow:"hidden" }}>
          <div style={{ width:device==="mobile"?288:480, height:device==="mobile"?500:420, borderRadius:device==="mobile"?22:12, border:`1px solid ${C.b}`, overflow:"hidden", background:C.s1, boxShadow:"0 24px 60px rgba(0,0,0,.35)" }}>
            <div style={{ overflowY:"auto", height:"100%" }}>
              <div style={{ height:120, position:"relative", ...previewHero }}>
                {draft.banner_url && !isGradientBanner(draft.banner_url) && <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.45)" }}/>}
                <div style={{ position:"absolute", bottom:10, left:10, right:10 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    {draft.logo_url ? <img src={draft.logo_url} style={{ width:36, height:36, borderRadius:"50%", objectFit:"cover", border:`2px solid ${C.s1}` }}/> : <div style={{ width:36, height:36, borderRadius:"50%", background:`linear-gradient(135deg,#3730a3,${draft.accent||ac})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, border:`2px solid ${C.s1}` }}>{draft.logo_emoji||"🛍️"}</div>}
                    <div style={{ fontSize:12, fontWeight:800, color:"#fff" }}>{previewName}</div>
                  </div>
                </div>
              </div>
              <div style={{ padding:10 }}>
                {(draft.sections||[]).filter(s=>s.visible).map(sec => {
                  if (sec.id==="featured") return products.length>0 ? (
                    <div key="fp" style={{ marginBottom:10 }}>
                      <div style={{ fontSize:10, fontWeight:700, marginBottom:6, color:C.t }}>{sec.label}</div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:5 }}>
                        {products.slice(0,2).map(p=><div key={p.id} style={{ borderRadius:7, overflow:"hidden" }}><PImg p={p} h={50} fz={20} C={C}/><div style={{ padding:"4px 6px", background:C.s2 }}><div style={{ fontSize:8, fontWeight:500, color:C.t }}>{p.title}</div><div style={{ fontSize:9, fontWeight:700, color:ac }}>{money(p.price,p.currency)}</div></div></div>)}
                      </div>
                    </div>
                  ) : null;
                  if (sec.id==="categories") return cats.length>0 ? (
                    <div key="cp" style={{ marginBottom:10 }}>
                      <div style={{ fontSize:10, fontWeight:700, marginBottom:6, color:C.t }}>{sec.label}</div>
                      <div style={{ display:"flex", gap:4, overflowX:"auto" }}>
                        {cats.map(c=><div key={c.id} style={{ padding:"3px 8px", borderRadius:6, background:C.s2, border:`1px solid ${C.b}`, whiteSpace:"nowrap", fontSize:8, flexShrink:0, color:C.t }}>{c.name}</div>)}
                      </div>
                    </div>
                  ) : null;
                  if (sec.id==="allProducts") return (
                    <div key="app" style={{ marginBottom:10 }}>
                      <div style={{ fontSize:10, fontWeight:700, marginBottom:6, color:C.t }}>{sec.label}</div>
                      <div style={{ display:"grid", gridTemplateColumns:draft.layout==="list"?"1fr":"1fr 1fr", gap:4 }}>
                        {products.slice(0,4).map(p=>(
                          <div key={p.id} style={{ borderRadius:7, overflow:"hidden", display:draft.layout==="list"?"flex":"block", alignItems:"center" }}>
                            <div style={{ width:draft.layout==="list"?32:undefined, flexShrink:0 }}><PImg p={p} h={32} fz={14} C={C}/></div>
                            <div style={{ padding:"3px 5px", background:C.s2, flex:1 }}><div style={{ fontSize:7, fontWeight:500, color:C.t }}>{p.title}</div><div style={{ fontSize:8, fontWeight:700, color:ac }}>{money(p.price,p.currency)}</div></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                  if (sec.id==="reviews") return <div key="rp" style={{ marginBottom:10, fontSize:10, fontWeight:700, color:C.t }}>{sec.label}</div>;
                  return null;
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── 7) PROMOCIONES ────────────────────────────────────────────────────── */
function Promos({ cfg, products, onUpdateProduct, C, ac }) {
  const [code, setCode] = useState("");
  const [disc, setDisc] = useState("");
  // RETADOR no tiene todavía un sistema de códigos de descuento persistido —
  // se maneja aquí en memoria (arranca vacío, nunca con códigos de ejemplo
  // inventados) hasta que exista una tabla real para esto.
  const [codes, setCodes] = useState([]);
  const active = products.filter(p => !p.archived_at);
  const addCode = () => {
    if (!code || !disc) return;
    setCodes(prev => [...prev, { code: code.toUpperCase(), discount: Number(disc), uses: 0 }]);
    setCode(""); setDisc("");
  };
  // Real: marca/desmarca oferta escribiendo products.orig_price de verdad.
  const toggleSale = (prod) => {
    onUpdateProduct(prod.id, prod.orig_price != null
      ? { origPrice: null }
      : { origPrice: prod.price, price: Math.round(prod.price * 0.85 * 100) / 100 });
  };
  return (
    <div>
      <SHdr title="Promociones" sub="Descuentos y ofertas activas" ac={ac} C={C}/>
      <Card C={C} style={{ marginBottom:20 }}>
        <div style={{ fontSize:14, fontWeight:800, marginBottom:4, color:C.t }}>Códigos de descuento</div>
        <div style={{ fontSize:11, color:C.m, marginBottom:14 }}>Aún no hay un sistema de cupones persistido en RETADOR — estos códigos se guardan solo en esta sesión.</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 60px 38px", gap:8, marginBottom:14 }}>
          <input placeholder="CÓDIGO" value={code} onChange={e=>setCode(e.target.value.toUpperCase())} style={{ ...inpStyle(C), letterSpacing:"0.1em" }}/>
          <input type="number" placeholder="%" value={disc} onChange={e=>setDisc(e.target.value)} style={inpStyle(C)}/>
          <button onClick={addCode} style={{ borderRadius:8, background:ac, border:"none", cursor:"pointer", color:"#000", fontSize:18, fontWeight:700 }}>+</button>
        </div>
        {codes.length === 0 && <div style={{ textAlign:"center", padding:"14px 0", color:C.m, fontSize:12 }}>Sin códigos todavía.</div>}
        {codes.map((c,i) => (
          <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:i<codes.length-1?`1px solid ${C.b}`:"none" }}>
            <div><div style={{ fontSize:12, fontWeight:700, letterSpacing:"0.1em", color:ac }}>{c.code}</div><div style={{ fontSize:10, color:C.m }}>{c.uses} usos</div></div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:16, fontWeight:800, color:C.ok }}>-{c.discount}%</span>
              <button onClick={() => setCodes(prev => prev.filter((_,j)=>j!==i))} style={{ width:24, height:24, borderRadius:6, background:C.s3, border:`1px solid ${C.b}`, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={11} color={C.err}/></button>
            </div>
          </div>
        ))}
      </Card>
      <Card C={C}>
        <div style={{ fontSize:14, fontWeight:800, marginBottom:14, color:C.t }}>Productos en oferta</div>
        {active.length === 0 && <div style={{ textAlign:"center", padding:"14px 0", color:C.m, fontSize:12 }}>Aún no tienes productos publicados.</div>}
        {active.map(prod => (
          <div key={prod.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:`1px solid ${C.b}` }}>
            <div style={{ width:36, height:36, borderRadius:8, overflow:"hidden", flexShrink:0 }}><PImg p={prod} h={36} fz={18} C={C}/></div>
            <div style={{ flex:1, minWidth:0, overflow:"hidden" }}><div style={{ fontSize:12, fontWeight:500, color:C.t, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{prod.title}</div><div style={{ fontSize:10, color:C.m }}>{money(prod.price, prod.currency)}{prod.orig_price!=null && <span style={{ color:C.ok }}> ← {money(prod.orig_price, prod.currency)}</span>}</div></div>
            <Toggle on={prod.orig_price != null} onChange={() => toggleSale(prod)} C={C}/>
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ── 8) CONFIGURACIÓN (de la Tienda — campos reales de store_config) ────── */
function Config({ cfg, onUpdateConfig, C, ac, flash }) {
  const r = toRgb(ac);
  const [tab, setTab] = useState("envios");
  const [draft, setDraft] = useState(cfg);
  useEffect(() => { setDraft(cfg); }, [cfg]);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const dUpd = (k,v) => setDraft(p => ({ ...p, [k]:v }));
  const togPay = (m) => setDraft(p => ({ ...p, payments: (p.payments||[]).includes(m) ? (p.payments||[]).filter(x=>x!==m) : [...(p.payments||[]), m] }));

  const saveAll = async () => {
    setSaving(true);
    try {
      await onUpdateConfig(draft);
      setSaved(true); setTimeout(()=>setSaved(false), 2500);
    } catch (e) { flash?.("⚠️ " + (e?.message || "No se pudo guardar")); }
    setSaving(false);
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20, gap:10 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:800, color:C.t }}>Configuración</div>
          <div style={{ fontSize:12, color:C.m, marginTop:2 }}>Ajustes visibles en tu tienda pública</div>
        </div>
        <button onClick={saveAll} disabled={saving} style={{ padding:"7px 14px", borderRadius:8, background:saved?C.ok:ac, border:"none", cursor:"pointer", color:saved?"#fff":"#000", fontSize:12, fontWeight:700, display:"flex", alignItems:"center", gap:5, flexShrink:0 }}>
          {saved ? <><Check size={13}/>Guardado</> : <><Save size={13}/>Guardar</>}
        </button>
      </div>
      <div style={{ display:"flex", gap:6, marginBottom:20, overflowX:"auto", paddingBottom:2 }}>
        {[["envios","Envíos"],["pagos","Pagos"],["politicas","Políticas"],["contacto","Información"],["notif","Notificaciones"]].map(([id,l]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding:"6px 14px", borderRadius:20, border:`1px solid ${tab===id?ac:C.b}`, background:tab===id?`rgba(${r},0.12)`:"transparent", color:tab===id?ac:C.m, cursor:"pointer", fontSize:12, fontWeight:600, whiteSpace:"nowrap", flexShrink:0 }}>{l}</button>
        ))}
      </div>
      {tab==="envios" && <Card C={C}>
        <Lbl c="Zonas de envío (visible en el pie de tu tienda)" C={C}/>
        <input value={draft.zones||""} onChange={e=>dUpd("zones",e.target.value)} style={{ ...inpStyle(C), marginBottom:14 }}/>
        <Lbl c="Días estimados de envío (insignia de confianza)" C={C}/>
        <input type="number" value={draft.ship_days??3} onChange={e=>dUpd("ship_days",Number(e.target.value))} style={inpStyle(C)}/>
      </Card>}
      {tab==="pagos" && <Card C={C}>
        <Lbl c="Métodos aceptados" C={C}/>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
          {["Tarjeta","Transferencia","Efectivo","PayPal"].map(m => {
            const a = (draft.payments||[]).includes(m);
            return (<div key={m} onClick={()=>togPay(m)} style={{ padding:12, borderRadius:10, border:`1px solid ${a?ac:C.b}`, background:a?`rgba(${r},0.08)`:"transparent", cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
              {a && <Check size={13} color={ac}/>}<span style={{ fontSize:12, fontWeight:a?600:400, color:a?ac:C.m }}>{m}</span>
            </div>);
          })}
        </div>
        <Lbl c="Tus métodos propios" C={C}/>
        {(draft.custom_payments||[]).map((m,i) => (
          <div key={i} style={{ display:"flex", gap:6, marginBottom:6 }}>
            <input value={m} onChange={e=>dUpd("custom_payments",(draft.custom_payments||[]).map((x,idx)=>idx===i?e.target.value:x))} style={{ ...inpStyle(C), flex:1 }}/>
            <button onClick={()=>dUpd("custom_payments",(draft.custom_payments||[]).filter((_,idx)=>idx!==i))} style={{ width:32, borderRadius:8, border:`1px solid ${C.b}`, background:"transparent", color:C.m, cursor:"pointer" }}><X size={13}/></button>
          </div>
        ))}
        <button onClick={()=>dUpd("custom_payments",[...(draft.custom_payments||[]),""])} style={{ width:"100%", padding:8, borderRadius:8, border:`1px dashed ${C.b}`, background:"transparent", color:C.m, fontSize:12, cursor:"pointer" }}>+ Agregar método propio</button>
      </Card>}
      {tab==="politicas" && <Card C={C}>
        <Lbl c="Días para devolución (insignia de confianza)" C={C}/>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <input type="number" value={draft.return_days??30} onChange={e=>dUpd("return_days",Number(e.target.value))} style={{ ...inpStyle(C), width:80 }}/>
          <span style={{ fontSize:13, color:C.m }}>días</span>
        </div>
      </Card>}
      {tab==="contacto" && <Card C={C}>
        {[["Ubicación","location"],["Horario","schedule"],["Sitio web","website"],["Instagram","instagram"],["Facebook","facebook"]].map(([l,k]) => (
          <div key={k}><Lbl c={l} C={C}/><input value={draft[k]||""} onChange={e=>dUpd(k,e.target.value)} style={{ ...inpStyle(C), marginBottom:12 }}/></div>
        ))}
        <div style={{ fontSize:11, color:C.m }}>Esta información aparece en la pestaña Info y el pie de tu tienda.</div>
      </Card>}
      {tab==="notif" && <Card C={C}>
        <Lbl c="Notificaciones" C={C}/>
        {[["notify_orders","Nuevos pedidos"],["notify_reviews","Nuevas reseñas"],["notify_marketing","Novedades de RETADOR"]].map(([k,l]) => (
          <div key={k} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:`1px solid ${C.b}` }}>
            <span style={{ fontSize:13, color:C.t }}>{l}</span>
            <Toggle on={draft[k] !== false} onChange={()=>dUpd(k, draft[k] === false)} C={C}/>
          </div>
        ))}
      </Card>}
      {!saved && <div style={{ marginTop:16, fontSize:11, color:C.m, textAlign:"center" }}>Los cambios no se aplican hasta presionar Guardar.</div>}
    </div>
  );
}

/* ── 9) SUSCRIPCIÓN — plan real + Pro gratis (compartir/referidos) ──────── */
function Billing({ user, myPlan, plans, C, ac, flash, onPlanRequested }) {
  const [pending, setPending] = useState(null);
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoTab, setPromoTab] = useState("compartir");
  const [links, setLinks] = useState([""]);
  const [refCode, setRefCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [referrals, setReferrals] = useState([]);
  const [busy, setBusy] = useState(false);
  const REQUIRED = 12;

  useEffect(() => {
    let alive = true;
    (async () => {
      const [pr, code, refs] = await Promise.all([
        getMyPlanRequest(user.id), getOrCreateReferralCode(), getReferralStats(),
      ]);
      if (!alive) return;
      setPending(pr && pr.status === "pending" ? pr : null);
      setRefCode(code || "");
      setReferrals(refs || []);
    })();
    return () => { alive = false; };
  }, [user.id]);

  const setLink = (i,v) => setLinks(p => p.map((l,idx)=>idx===i?v:l));
  const addLinkRow = () => links.length < REQUIRED && setLinks(p => [...p,""]);
  const removeLinkRow = (i) => setLinks(p => p.filter((_,idx)=>idx!==i));
  const filled = links.filter(l => l.trim().length > 5).length;
  const realReferrals = referrals.filter(r => r.qualifies).length;

  const requestUpgrade = async (planId) => {
    setBusy(true);
    try { await submitPlanRequest(user.id, planId); setPending({ plan: planId, status:"pending" }); flash?.("✅ Solicitud enviada — el equipo la revisa pronto"); }
    catch (e) { flash?.("⚠️ " + (e?.message || "No se pudo enviar")); }
    setBusy(false);
  };
  const sendPromo = async () => {
    setBusy(true);
    try {
      // Aquí SIEMPRE se llega ya siendo Pro/Premium (can_customize) — la
      // tarjeta ofrece mantener el plan PROPIO gratis, no "pasar" a otro.
      const plan = myPlan?.id;
      if (promoTab === "compartir") await requestPlanPromo(plan, "compartir", links.filter(l=>l.trim().length>5));
      else await requestPlanPromo(plan, "referidos", null);
      setPending({ plan, status:"pending" });
      flash?.("✅ Enviado, en revisión");
      onPlanRequested?.();
    } catch (e) { flash?.("⚠️ " + (e?.message || "No se pudo enviar")); }
    setBusy(false);
  };

  return (
    <div>
      <SHdr title="Suscripción" sub="Plan y facturación" ac={ac} C={C}/>
      {plans.map(pl => {
        const active = pl.id === myPlan?.id;
        const r = toRgb(ac);
        return (
          <div key={pl.id} style={{ borderRadius:16, border:`1px solid ${active?ac:C.b}`, background:active?`rgba(${r},0.06)`:C.s2, padding:18, marginBottom:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
                  <div style={{ fontSize:16, fontWeight:800, color:C.t }}>{pl.name}</div>
                  {active && <div style={{ background:`linear-gradient(135deg,#3730a3,${ac})`, borderRadius:20, padding:"2px 10px", fontSize:9, fontWeight:800, color:"#fff" }}>ACTIVO</div>}
                </div>
                <div style={{ fontSize:11, color:C.m }}>{pl.max_products} productos · {Number(pl.commission_pct)}% comisión</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:20, fontWeight:800, color:C.t }}>{Number(pl.price)===0?"Gratis":money(pl.price, pl.currency)}</div>
                {Number(pl.price)>0 && <div style={{ fontSize:10, color:C.m }}>/mes</div>}
              </div>
            </div>
            {!active && (
              pending?.plan === pl.id
                ? <div style={{ width:"100%", marginTop:8, padding:8, borderRadius:8, background:C.s3, color:C.m, fontSize:12, textAlign:"center" }}>🕐 Solicitud en revisión</div>
                : <button onClick={() => pl.id === "gratis" ? null : requestUpgrade(pl.id)} disabled={busy || pl.id==="gratis"} style={{ width:"100%", marginTop:8, padding:8, borderRadius:8, border:`1px solid ${C.b}`, background:"transparent", color:C.m, fontSize:12, cursor:pl.id==="gratis"?"default":"pointer" }}>{pl.id==="gratis" ? "Plan inicial" : `Solicitar ${pl.name}`}</button>
            )}
          </div>
        );
      })}

      {/* Se llega a "Mi Panel" SIEMPRE ya siendo Pro/Premium (can_customize) —
          la condición real para esta tarjeta es "pagas algo ahora mismo",
          nunca myPlan.id==="gratis" (eso nunca puede ser cierto aquí: quien
          está en el plan gratis no ve la Tienda ni este panel en absoluto,
          así que ese gate dejaba la tarjeta dormida para siempre). */}
      {Number(myPlan?.price) > 0 && (
        <div style={{ borderRadius:14, border:`1px dashed rgba(${toRgb(ac)},0.4)`, background:C.s2, marginBottom:20, overflow:"hidden" }}>
          <div onClick={() => setPromoOpen(o=>!o)} style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 16px", cursor:"pointer" }}>
            <span style={{ fontSize:15 }}>🎁</span>
            <div style={{ fontSize:13, fontWeight:800, flex:1, color:C.t }}>¿Prefieres no pagar? Consigue {myPlan?.name || "tu plan"} gratis</div>
            <ChevronDown size={15} color={C.m} style={{ transform:promoOpen?"rotate(180deg)":"none", transition:"transform .2s" }}/>
          </div>
          {promoOpen && <div style={{ padding:"0 16px 16px" }}>
            <div style={{ fontSize:11, color:C.m, marginBottom:14 }}>Dos formas de mantener tu plan activo sin tarjeta — se revisan cada mes.</div>
            <div style={{ display:"flex", gap:6, marginBottom:16, background:C.s1, borderRadius:10, padding:3 }}>
              {[["compartir","📤 Compartir"],["referidos","🔗 Referidos"]].map(([id,lb]) => (
                <button key={id} onClick={() => setPromoTab(id)} style={{ flex:1, padding:7, borderRadius:8, border:"none", cursor:"pointer", fontSize:12, fontWeight:700, background:promoTab===id?ac:"transparent", color:promoTab===id?"#000":C.m }}>{lb}</button>
              ))}
            </div>
            {promoTab === "compartir" && (
              <div>
                <div style={{ fontSize:12, color:C.t, marginBottom:3 }}>Comparte RETADOR o tus publicaciones <b style={{ color:ac }}>{REQUIRED} veces al mes</b> en tus redes.</div>
                <div style={{ fontSize:11, color:C.m, marginBottom:12 }}>Pega aquí el enlace real de cada publicación — el equipo lo revisa.</div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <span style={{ fontSize:11, color:C.m }}>{filled} de {REQUIRED} enlaces</span>
                  <div style={{ width:100, height:5, borderRadius:3, background:C.s3 }}><div style={{ height:"100%", borderRadius:3, background:filled>=REQUIRED?C.ok:ac, width:`${Math.min(100,(filled/REQUIRED)*100)}%` }}/></div>
                </div>
                <div style={{ maxHeight:170, overflowY:"auto", marginBottom:10 }}>
                  {links.map((l,i) => (
                    <div key={i} style={{ display:"flex", gap:6, marginBottom:6 }}>
                      <input style={{ ...inpStyle(C), flex:1 }} placeholder={`Enlace de tu publicación #${i+1}`} value={l} onChange={e=>setLink(i,e.target.value)}/>
                      {links.length>1 && <button onClick={()=>removeLinkRow(i)} style={{ width:32, borderRadius:8, border:`1px solid ${C.b}`, background:"transparent", color:C.m, cursor:"pointer" }}><X size={13}/></button>}
                    </div>
                  ))}
                </div>
                {links.length < REQUIRED && <button onClick={addLinkRow} style={{ width:"100%", padding:8, borderRadius:8, border:`1px dashed ${C.b}`, background:"transparent", color:C.m, fontSize:12, cursor:"pointer", marginBottom:10 }}>+ Agregar otro enlace</button>}
                <button onClick={sendPromo} disabled={filled<REQUIRED || busy || !!pending} style={{ width:"100%", padding:10, borderRadius:9, border:"none", cursor:(filled<REQUIRED||pending)?"default":"pointer", background:(filled<REQUIRED||pending)?C.s3:ac, color:(filled<REQUIRED||pending)?C.m:"#000", fontSize:13, fontWeight:800 }}>
                  {pending ? "🕐 En revisión" : filled<REQUIRED ? `Faltan ${REQUIRED-filled} enlaces` : "Enviar para revisión"}
                </button>
              </div>
            )}
            {promoTab === "referidos" && (
              <div>
                <div style={{ fontSize:12, color:C.t, marginBottom:3 }}>Cada persona que entra con tu enlace y <b style={{ color:ac }}>publica o compra de verdad</b> cuenta como referido real.</div>
                <div style={{ fontSize:11, color:C.m, marginBottom:14 }}>No hace falta un número fijo — mientras traigas gente real y activa, tu plan se mantiene.</div>
                <div style={{ display:"flex", gap:8, marginBottom:14 }}>
                  <div style={{ flex:1, padding:"10px 12px", borderRadius:9, background:C.s1, border:`1px solid ${C.b}`, fontSize:11, fontFamily:"monospace", color:ac, fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{refCode || "generando…"}</div>
                  <button onClick={() => { navigator.clipboard?.writeText(refCode); setCopied(true); setTimeout(()=>setCopied(false),1800); }} style={{ padding:"0 16px", borderRadius:9, border:"none", background:copied?C.ok:ac, color:copied?"#fff":"#000", fontSize:12, fontWeight:700, cursor:"pointer" }}>{copied?"✓ Copiado":"Copiar"}</button>
                </div>
                <div style={{ fontSize:13, fontWeight:800, marginBottom:8, color:C.t }}>Tus referidos — {realReferrals} reales</div>
                {referrals.length === 0 && <div style={{ fontSize:12, color:C.m, textAlign:"center", padding:"14px 0" }}>Aún no tienes referidos.</div>}
                {referrals.map((rf,i) => (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 0", borderBottom:i<referrals.length-1?`1px solid ${C.b}`:"none" }}>
                    <span style={{ fontSize:12, color:C.t }}>{rf.referred_name}</span>
                    <SBadge s={rf.qualifies ? "entregado" : "pendiente"} C={C}/>
                  </div>
                ))}
                <button onClick={sendPromo} disabled={realReferrals<1 || busy || !!pending} style={{ width:"100%", marginTop:14, padding:10, borderRadius:9, border:"none", cursor:(realReferrals<1||pending)?"default":"pointer", background:(realReferrals<1||pending)?C.s3:ac, color:(realReferrals<1||pending)?C.m:"#000", fontSize:13, fontWeight:800 }}>
                  {pending ? "🕐 En revisión" : realReferrals<1 ? "Aún sin referidos reales" : "Enviar para revisión"}
                </button>
              </div>
            )}
          </div>}
        </div>
      )}
    </div>
  );
}

/* ── DASHBOARD (panel de gestión Pro — las 9 secciones) ─────────────────── */
export function StoreDashboard({ user, cfg, products, orders, plans, myPlan, api, onStore, onMenu, onBack, flash, profileRealName }) {
  const C = useSTk();
  const { isMobile } = useR();
  const [sec, setSec] = useState("overview");
  // En móvil arranca colapsada (solo íconos): con la barra completa (200px)
  // no queda espacio real para el contenido — se probó y el texto de las
  // filas (pedidos, clientes) se encimaba de verdad. El usuario puede
  // expandirla con el botón si quiere, pero el punto de partida es el que
  // realmente cabe en una pantalla de teléfono.
  const [col, setCol] = useState(isMobile);
  const [toast, setToast] = useState(null);
  const ac = cfg.accent || "#FFC01E", r = toRgb(ac), ag = `rgba(${r},0.12)`;
  const isDesign = sec === "design";
  const NAVS = [
    { id:"overview", label:"Resumen", icon:LayoutDashboard },
    { id:"orders", label:"Pedidos", icon:ShoppingCart },
    { id:"products", label:"Productos", icon:Package },
    { id:"analytics", label:"Estadísticas", icon:BarChart2 },
    { id:"customers", label:"Clientes", icon:Users },
    { id:"design", label:"Diseño", icon:Palette },
    { id:"promotions", label:"Promociones", icon:Tag },
    { id:"settings", label:"Configuración", icon:SettingsIcon },
    { id:"billing", label:"Suscripción", icon:CreditCard },
  ];
  const pendingCount = orders.filter(o => String(o.status).toLowerCase() === "pendiente").length;
  const storeName = cfg.name || profileRealName || "Vendedor";

  const notify = (msg, type="ok") => { setToast({ msg, type }); setTimeout(()=>setToast(null), 2500); };

  const renderSec = () => {
    if (sec === "overview")   return <Overview cfg={cfg} products={products} orders={orders} C={C} ac={ac}/>;
    if (sec === "orders")     return <Pedidos orders={orders} C={C} ac={ac}/>;
    if (sec === "products")   return <ProdsSection products={products} C={C} ac={ac}
      onNewProduct={api.onNewProduct} onEditProduct={api.onEditProduct}
      onArchiveProduct={api.onArchiveProduct} onUnarchiveProduct={api.onUnarchiveProduct}
      onDeleteProduct={api.onDeleteProduct} maxProducts={myPlan?.max_products}/>;
    if (sec === "analytics")  return <Analytics products={products} orders={orders} C={C} ac={ac}/>;
    if (sec === "customers")  return <Clientes orders={orders} C={C} ac={ac}/>;
    if (sec === "design")     return <Diseno cfg={cfg} products={products} onUpdateConfig={api.onUpdateConfig} C={C} ac={ac} flash={notify} profileRealName={profileRealName}/>;
    if (sec === "promotions") return <Promos cfg={cfg} products={products} onUpdateProduct={api.onUpdateProduct} C={C} ac={ac}/>;
    if (sec === "settings")   return <Config cfg={cfg} onUpdateConfig={api.onUpdateConfig} C={C} ac={ac} flash={notify}/>;
    if (sec === "billing")    return <Billing user={user} myPlan={myPlan} plans={plans} C={C} ac={ac} flash={notify} onPlanRequested={api.onPlanRequested}/>;
    return null;
  };

  // "Mi Panel" es SIEMPRE una capa a pantalla completa (position absolute,
  // fuera del árbol de la barra inferior general — ver integración en
  // App.jsx), nunca coexiste con esa barra: no hay nada real que reservarle
  // espacio. Antes esto reservaba NAV_CLEARANCE cuando onMenu estaba presente
  // (regla heredada de cuando el panel vivía embebido junto a la barra), lo
  // que dejaba un espacio negro vacío fijo al final — regresión ya corregida.

  return (
    <div style={{ display:"flex", height:"100%", overflow:"hidden", background:C.bg, color:C.t, boxSizing:"border-box" }}>
      <Toast msg={toast?.msg} type={toast?.type} C={C}/>
      <div style={{ width:col?50:200, background:C.s1, borderRight:`1px solid ${C.b}`, display:"flex", flexDirection:"column", flexShrink:0, transition:"width .25s ease", overflow:"hidden" }}>
        <div style={{ padding:col?"13px 0":"13px 14px", borderBottom:`1px solid ${C.b}`, display:"flex", alignItems:"center", justifyContent:col?"center":"space-between" }}>
          {!col && <div style={{ display:"flex", alignItems:"center", gap:9, minWidth:0 }}>
            {cfg.logo_url ? <img src={cfg.logo_url} style={{ width:26, height:26, borderRadius:7, objectFit:"cover", flexShrink:0 }}/> : <div style={{ width:26, height:26, borderRadius:7, background:`linear-gradient(135deg,#3730a3,${ac})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, flexShrink:0 }}>{cfg.logo_emoji||"🛍️"}</div>}
            <div style={{ minWidth:0 }}><div style={{ fontSize:12, fontWeight:800, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{storeName}</div><div style={{ fontSize:8, color:ac, fontWeight:800, letterSpacing:".08em" }}>{(myPlan?.name || "PRO").toUpperCase()}</div></div>
          </div>}
          <button onClick={() => setCol(!col)} title={col ? "Expandir menú" : "Colapsar menú"} style={{ width:20, height:20, borderRadius:5, background:C.s3, border:`1px solid ${C.b}`, cursor:"pointer", color:C.m, display:"flex", alignItems:"center", justifyContent:"center", marginLeft:col?"auto":0, flexShrink:0 }}>{col ? <ChevronRight size={11}/> : <ChevronLeft size={11}/>}</button>
        </div>
        <nav style={{ flex:1, padding:"8px 6px", overflowY:"auto" }}>
          {NAVS.map(item => {
            const Icon = item.icon, active = sec === item.id;
            const badge = item.id === "orders" ? pendingCount : 0;
            return (
              <button key={item.id} onClick={() => setSec(item.id)} title={item.label} style={{ width:"100%", display:"flex", alignItems:"center", gap:col?0:9, padding:col?"9px 0":"8px 9px", justifyContent:col?"center":"flex-start", borderRadius:8, border:"none", cursor:"pointer", marginBottom:2, background:active?ag:"transparent", color:active?ac:C.m }}>
                <Icon size={15}/>
                {!col && <span style={{ fontSize:12, fontWeight:active?700:500, flex:1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", textAlign:"left" }}>{item.label}</span>}
                {!col && badge>0 && <span style={{ background:ac, borderRadius:9, padding:"1px 6px", fontSize:9, fontWeight:800, color:"#000" }}>{badge}</span>}
              </button>
            );
          })}
        </nav>
        {!col && <div style={{ padding:"8px 10px", borderTop:`1px solid ${C.b}` }}>
          <button onClick={onStore} style={{ width:"100%", padding:9, borderRadius:8, border:"none", background:ac, color:"#000", fontSize:12, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}><Eye size={13}/> Ver tienda</button>
        </div>}
      </div>
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:isDesign?"hidden":"auto", minWidth:0, minHeight:0 }}>
        {/* Acceso SIEMPRE disponible al resto de la app, en TODAS las secciones
            del panel — nunca una pantalla donde el dueño quede atrapado sin
            ☰, sin Atrás y sin Configuración de la app. */}
        {(onMenu || onBack) && (
          <div style={{ padding:"9px 22px", borderBottom:`1px solid ${C.b}`, display:"flex", alignItems:"center", flexShrink:0 }}>
            {onMenu
              // ☰ Menú ya da acceso a Configuración (ProfileMenuDrawer) — el ⚙️
              // que vivía aquí navegaba pScr="settings" en la pantalla de abajo,
              // invisible detrás de esta capa a pantalla completa: nunca abría
              // nada de verdad. Se quita en vez de arreglarlo, por ser redundante.
              ? <button onClick={onMenu} style={{ background:"none", border:`1px solid ${C.b}`, borderRadius:6, height:30, padding:"0 12px", cursor:"pointer", display:"flex", alignItems:"center", gap:7, color:C.t, fontSize:12, fontWeight:700 }}><span style={{ fontSize:15, lineHeight:1 }}>☰</span> Menú</button>
              : onBack
                ? <button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer", padding:0, display:"flex", alignItems:"center", gap:6, color:C.m, fontSize:12, fontWeight:600 }}><ChevronLeft size={15}/> Atrás</button>
                : null}
          </div>
        )}
        {!isDesign && <div style={{ padding:"14px 22px", flex:1 }}>{renderSec()}</div>}
        {isDesign && <div style={{ flex:1, minHeight:0, overflow:"hidden", display:"flex", flexDirection:"column" }}>{renderSec()}</div>}
      </div>
    </div>
  );
}
