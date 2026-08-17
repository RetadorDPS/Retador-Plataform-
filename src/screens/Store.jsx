// ═══════════════════════════════════════════════════════════════════════════
// TIENDA PRO — Fase 1. Adaptado del diseño ya aprobado (business-stores-
// system.jsx) a datos y funciones reales de RETADOR.
//
// Decisiones de integración (ver reporte de la ronda para el detalle):
// · Categorías de tienda = subcategorías REALES ya usadas por los productos
//   del vendedor (derivadas, de solo lectura) — nunca una lista aparte que
//   se pueda desincronizar de lo que Búsqueda/categoría ya indexan.
// · "Nuevo Producto" abre el formulario real (PubSheet → PublishProductForm),
//   nunca un formulario paralelo.
// · Archivar/Recuperar/Eliminar/Editar reutilizan los mismos handlers reales
//   que ya usa "Mis productos" en el perfil Free (confirmArchiveProduct,
//   confirmDeleteProduct, handleUnarchive, setEditProd) — cero lógica nueva.
// · Nombre/precio/límite de plan se leen SIEMPRE de getPlans() (tabla real
//   `plans`), nunca fijos.
// · "Seguir" queda igual que en el resto de la app (decorativo, sin tocar —
//   así lo pidió el dueño: "seguidores... nunca se toca").
// ═══════════════════════════════════════════════════════════════════════════
import { useState, useEffect, useMemo, useRef } from "react";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ShoppingCart, TrendingUp, Package, LayoutDashboard, Bell, Eye, Plus, Zap, Check, ChevronLeft, ChevronRight, Edit2, Trash2, X, Upload, GripVertical, ChevronDown, Grid, List, Save, Palette, CreditCard, Settings as SettingsIcon, Star, Copy, Link2 } from "lucide-react";
import { useAt, money, getMyPlanRequest, submitPlanRequest, getOrCreateReferralCode, getReferralStats, requestPlanPromo } from "../shared/index.js";

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
const SC = { pendiente:"#FBBF24", enviado:"#818CF8", entregado:"#34D399", confirmado:"#34D399", completado:"#34D399", asignado:"#818CF8", cancelado:"#F87171" };
const STATUS_LABEL = { pendiente:"Pendiente", enviado:"Enviado", entregado:"Entregado", confirmado:"Confirmado", completado:"Completado", asignado:"Asignado", cancelado:"Cancelado" };

function useSTk() {
  const { isDark } = useAt();
  return isDark ? S_DARK : S_LIGHT;
}

/* ── ÁTOMOS ─────────────────────────────────────────────────────────────── */
const Lbl = ({ c, C }) => <div style={{ fontSize:10, fontWeight:600, color:C.m, marginBottom:7, textTransform:"uppercase", letterSpacing:"0.09em" }}>{c}</div>;
const Card = ({ children, style, C }) => <div style={{ borderRadius:14, background:C.s2, border:`1px solid ${C.b}`, padding:18, ...style }}>{children}</div>;
const SBadge = ({ s, C }) => { const k = String(s||"").toLowerCase(); const lb = STATUS_LABEL[k] || s; const cl = SC[k] || C.m; return <span style={{ fontSize:10, fontWeight:600, color:cl, background:`${cl}18`, padding:"3px 8px", borderRadius:20, whiteSpace:"nowrap" }}>{lb}</span>; };
const SHdr = ({ title, sub, btn, onBtn, ac, C }) => (
  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
    <div>
      <div style={{ fontSize:18, fontWeight:800, color:C.t }}>{title}</div>
      {sub && <div style={{ fontSize:12, color:C.m, marginTop:2 }}>{sub}</div>}
    </div>
    {btn && <button onClick={onBtn} style={{ padding:"7px 14px", borderRadius:8, background:ac, border:"none", cursor:"pointer", color:"#000", fontSize:12, fontWeight:700, display:"flex", alignItems:"center", gap:5 }}><Plus size={12}/>{btn}</button>}
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
// Categorías de tienda = subcategorías REALES ya usadas por los productos del
// vendedor (derivado, no una lista aparte) — ver nota al inicio del archivo.
function deriveCategories(products) {
  const map = new Map();
  products.forEach(p => { if (p.subcat) map.set(p.subcat, (map.get(p.subcat)||0) + 1); });
  return [...map.entries()].map(([name, count]) => ({ id: name, name, count }));
}

/* ── STOREFRONT (vista pública) ────────────────────────────────────────── */
export function StoreFront({ cfg, products, sellerName, headerStats, ratingInfo, isOwner, onDash, onBack, onChat, onProduct, embedded = false }) {
  const C = useSTk();
  const [tab, setTab] = useState("inicio");
  const [selCat, setSelCat] = useState("all");
  const ac = cfg.accent || "#FFC01E", r = toRgb(ac);
  const cats = useMemo(() => deriveCategories(products), [products]);
  const hero = cfg.banner_url ? { backgroundImage:`url(${cfg.banner_url})`, backgroundSize:"cover", backgroundPosition:"center" } : { background: BANNERS[0] };
  const filt = useMemo(() => selCat === "all" ? products : products.filter(p => p.subcat === selCat), [products, selCat]);
  const visSecs = (cfg.sections || []).filter(s => s.visible);

  const prodCard = (p, h, fz) => (
    <div key={p.id} onClick={() => onProduct?.(p)} style={{ borderRadius:13, background:C.s2, border:`1px solid ${C.b}`, overflow:"hidden", cursor:"pointer" }}>
      <PImg p={p} h={h} fz={fz} C={C}/>
      <div style={{ padding:11 }}>
        <div style={{ fontSize:12, fontWeight:500, marginBottom:4, color:C.t }}>{p.title}</div>
        <div style={{ fontSize:14, fontWeight:800, color:C.t }}>{money(p.price, p.currency)}</div>
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
    return null;
  };

  return (
    <div style={{ background:C.bg, color:C.t, minHeight:"100%" }}>
      <div style={{ position:"relative", height:260, overflow:"hidden", ...hero }}>
        {cfg.banner_url && <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.48)" }}/>}
        {!embedded && <button onClick={onBack} style={{ position:"absolute", top:14, left:14, background:"rgba(0,0,0,0.45)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:8, padding:"6px 10px", color:"#fff", fontSize:11, cursor:"pointer", zIndex:2, display:"flex", alignItems:"center", gap:4 }}><ChevronLeft size={13}/> Volver</button>}
        {isOwner && <button onClick={onDash} style={{ position:"absolute", top:14, right:14, background:`linear-gradient(135deg,#3730a3,${ac})`, border:"none", borderRadius:20, padding:"6px 14px", color:"#fff", fontSize:11, fontWeight:800, cursor:"pointer", zIndex:2 }}>⚡ Mi Panel</button>}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"0 20px 18px", zIndex:2 }}>
          <div style={{ display:"flex", alignItems:"flex-end", gap:14, marginBottom:12 }}>
            {cfg.logo_url
              ? <img src={cfg.logo_url} style={{ width:64, height:64, borderRadius:"50%", objectFit:"cover", border:"3px solid #09090B", flexShrink:0 }}/>
              : <div style={{ width:64, height:64, borderRadius:"50%", background:`linear-gradient(135deg,#3730a3,${ac})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, border:"3px solid #09090B", flexShrink:0 }}>{cfg.logo_emoji || "🛍️"}</div>}
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                <h1 style={{ fontSize:20, fontWeight:800, color:"#fff" }}>{cfg.name || sellerName}</h1>
                <div style={{ width:16, height:16, borderRadius:"50%", background:ac, display:"flex", alignItems:"center", justifyContent:"center" }}><Check size={9} color="#000" strokeWidth={3}/></div>
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
              <button style={{ flex:1, padding:"9px 0", borderRadius:9, border:"none", cursor:"pointer", fontSize:13, fontWeight:700, background:ac, color:"#000" }}>+ Seguir</button>
              <button onClick={onChat} style={{ padding:"9px 14px", borderRadius:9, border:"1px solid rgba(255,255,255,.18)", background:"rgba(255,255,255,.08)", cursor:"pointer", color:"#fff", fontSize:13 }}>💬 Chat</button>
            </div>
          )}
        </div>
      </div>

      <div style={{ display:"flex", borderBottom:`1px solid ${C.b}`, overflowX:"auto" }}>
        {["Inicio","Productos"].map(t => (
          <button key={t} onClick={() => setTab(t.toLowerCase())} style={{ padding:"12px 16px", background:"none", border:"none", cursor:"pointer", fontSize:13, fontWeight:600, whiteSpace:"nowrap", color:tab===t.toLowerCase()?ac:C.m, borderBottom:tab===t.toLowerCase()?`2px solid ${ac}`:"2px solid transparent" }}>{t}</button>
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
      </div>

      {cfg.show_footer !== false && (
        <div style={{ borderTop:`1px solid ${C.b}`, padding:"20px", background:C.s1 }}>
          <div style={{ fontSize:14, fontWeight:800, marginBottom:4, color:C.t }}>{cfg.logo_emoji} {cfg.name || sellerName}</div>
          {cfg.location && <div style={{ fontSize:11, color:C.m, marginBottom:6 }}>📍 {cfg.location}</div>}
          {cfg.schedule && <div style={{ fontSize:11, color:C.m }}>🕐 {cfg.schedule}</div>}
        </div>
      )}
    </div>
  );
}

/* ── OVERVIEW (datos reales) ────────────────────────────────────────────── */
function Overview({ cfg, products, orders, C, ac }) {
  const r = toRgb(ac);
  const active = products.filter(p => !p.archived_at);
  const revenue = orders.reduce((a,o) => a + (Number(o.amount)||0), 0);
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
  const mets = [
    { l:"Ingresos", v: money(revenue, orders[0]?.currency || "USD"), I:TrendingUp },
    { l:"Pedidos", v:String(orders.length), I:ShoppingCart },
    { l:"Productos activos", v:String(active.length), I:Package },
  ];
  return (
    <div>
      <SHdr title="Resumen" sub="Datos reales de tu tienda" ac={ac} C={C}/>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
        {mets.map((m,i) => (
          <div key={i} style={{ borderRadius:14, background:C.s2, border:`1px solid ${C.b}`, padding:15, gridColumn: i===2 ? "1 / -1" : undefined }}>
            <div style={{ width:30, height:30, borderRadius:7, background:`rgba(${r},0.12)`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:10 }}><m.I size={14} color={ac}/></div>
            <div style={{ fontSize:21, fontWeight:800, marginBottom:2, color:C.t }}>{m.v}</div>
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
      <Card C={C} style={{ padding:0 }}>
        <div style={{ padding:"14px 18px", borderBottom:`1px solid ${C.b}` }}><div style={{ fontSize:14, fontWeight:800, color:C.t }}>Pedidos recientes</div></div>
        {orders.slice(0,4).map((o,i) => (
          <div key={o.id} style={{ padding:"12px 18px", borderBottom:i<3?`1px solid ${C.b}`:"none", display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:8, background:C.s3, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>📦</div>
            <div style={{ flex:1, minWidth:0 }}><div style={{ fontSize:12, fontWeight:500, color:C.t }}>{o.title || "Pedido"}</div><div style={{ fontSize:10, color:C.m }}>#{String(o.id).slice(0,8)}</div></div>
            <div style={{ textAlign:"right" }}><div style={{ fontSize:13, fontWeight:800, marginBottom:3, color:C.t }}>{money(o.amount, o.currency)}</div><SBadge s={o.status} C={C}/></div>
          </div>
        ))}
        {orders.length === 0 && <div style={{ padding:"30px", textAlign:"center", color:C.m, fontSize:13 }}>Aún no tienes pedidos.</div>}
      </Card>
    </div>
  );
}

/* ── PEDIDOS (solo lectura del estado real) ────────────────────────────── */
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
          {[["Producto",cur.title],["Cantidad",cur.qty],["Total",money(cur.amount, cur.currency)]].map(([l,v]) => (
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
            <div style={{ flex:1, minWidth:0 }}><div style={{ fontSize:12, fontWeight:600, marginBottom:2, color:C.t }}>#{String(o.id).slice(0,8)}</div><div style={{ fontSize:11, color:C.m, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{o.title}</div></div>
            <div style={{ textAlign:"right", flexShrink:0 }}><div style={{ fontSize:14, fontWeight:800, marginBottom:4, color:C.t }}>{money(o.amount, o.currency)}</div><SBadge s={o.status} C={C}/></div>
            <ChevronRight size={14} color={C.m}/>
          </div>
        ))}
        {list.length === 0 && <div style={{ padding:"40px", textAlign:"center", color:C.m, fontSize:13 }}>Sin pedidos.</div>}
      </Card>
    </div>
  );
}

/* ── PRODUCTOS (reutiliza formulario y funciones reales) ───────────────── */
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

/* ── DISEÑO (branding + secciones + categorías derivadas) ──────────────── */
function Diseno({ cfg, products, onUpdateConfig, C, ac, flash }) {
  const [draft, setDraft] = useState(cfg);
  useEffect(() => { setDraft(cfg); }, [cfg]);
  const [tab, setTab] = useState("branding");
  const [dIdx, setDIdx] = useState(null);
  const [dOver, setDOver] = useState(null);
  const [saving, setSaving] = useState(false);
  const logoRef = useRef(null), banRef = useRef(null);
  const cats = useMemo(() => deriveCategories(products), [products]);
  const r = toRgb(ac);

  const upd = (k,v) => setDraft(p => ({ ...p, [k]:v }));
  const updSec = (i,key,val) => setDraft(p => ({ ...p, sections: p.sections.map((s,ix) => ix===i ? { ...s,[key]:val } : s) }));
  const reorder = (from,to) => setDraft(p => { const arr=[...p.sections]; const [it]=arr.splice(from,1); arr.splice(to,0,it); return { ...p, sections:arr }; });
  const handleLogo = (e) => { const f=e.target.files[0]; if(!f) return; upd("_logoFile", f); const rd=new FileReader(); rd.onload=ev=>upd("logo_url", ev.target.result); rd.readAsDataURL(f); };
  const handleBan  = (e) => { const f=e.target.files[0]; if(!f) return; upd("_banFile", f); const rd=new FileReader(); rd.onload=ev=>upd("banner_url", ev.target.result); rd.readAsDataURL(f); };

  const save = async () => {
    setSaving(true);
    try { await onUpdateConfig(draft); flash?.("⚡ Cambios publicados"); }
    catch (e) { flash?.("⚠️ " + (e?.message || "No se pudo guardar")); }
    setSaving(false);
  };

  return (
    <div style={{ display:"flex", height:"100%", position:"relative" }}>
      <div style={{ width:260, flexShrink:0, background:C.s1, borderRight:`1px solid ${C.b}`, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ padding:"14px 16px", borderBottom:`1px solid ${C.b}` }}>
          <div style={{ fontSize:13, fontWeight:800, color:C.t }}>Editor de Tienda</div>
        </div>
        <div style={{ display:"flex", borderBottom:`1px solid ${C.b}` }}>
          {["branding","secciones","categorías"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex:1, padding:"9px 4px", background:"none", border:"none", cursor:"pointer", fontSize:10, fontWeight:600, textTransform:"capitalize", color:tab===t?ac:C.m, borderBottom:tab===t?`2px solid ${ac}`:"2px solid transparent" }}>{t}</button>
          ))}
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:14 }}>
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
              <input value={draft.name||""} onChange={e=>upd("name",e.target.value)} style={{ ...inpStyle(C), marginBottom:12 }}/>
              <Lbl c="Tagline" C={C}/>
              <input value={draft.tagline||""} onChange={e=>upd("tagline",e.target.value)} style={{ ...inpStyle(C), marginBottom:12 }}/>
              <Lbl c="Color de marca" C={C}/>
              <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginBottom:16 }}>
                {COLORS.map(c => <button key={c} onClick={() => upd("accent",c)} style={{ width:26, height:26, borderRadius:"50%", background:c, cursor:"pointer", border:`3px solid ${draft.accent===c?C.t:"transparent"}` }}/>)}
              </div>
              <Lbl c="Banner de portada" C={C}/>
              <input ref={banRef} type="file" accept="image/*" onChange={handleBan} style={{ display:"none" }}/>
              {draft.banner_url
                ? <div style={{ height:54, borderRadius:8, backgroundImage:`url(${draft.banner_url})`, backgroundSize:"cover", backgroundPosition:"center", marginBottom:8, border:`1px solid ${C.b}`, position:"relative" }}>
                    <button onClick={() => upd("banner_url", null)} style={{ position:"absolute", top:4, right:4, width:20, height:20, borderRadius:"50%", background:"rgba(0,0,0,.6)", border:"none", cursor:"pointer", color:"#fff" }}><X size={10}/></button>
                  </div>
                : <button onClick={() => banRef.current?.click()} style={{ width:"100%", padding:10, borderRadius:8, border:`1px dashed ${C.b}`, background:"transparent", color:C.m, fontSize:11, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}><Upload size={13}/>Subir foto de portada</button>}
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
      <div style={{ flex:1, background:"#040406", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
        <div style={{ width:288, height:500, borderRadius:22, border:"1px solid rgba(255,255,255,.1)", overflow:"hidden", background:"#09090B", boxShadow:"0 24px 60px rgba(0,0,0,.8)" }}>
          <div style={{ overflowY:"auto", height:"100%" }}>
            <div style={{ height:120, position:"relative", background: draft.banner_url ? undefined : BANNERS[0], backgroundImage: draft.banner_url ? `url(${draft.banner_url})` : undefined, backgroundSize:"cover", backgroundPosition:"center" }}>
              {draft.banner_url && <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.45)" }}/>}
              <div style={{ position:"absolute", bottom:10, left:10, right:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  {draft.logo_url ? <img src={draft.logo_url} style={{ width:36, height:36, borderRadius:"50%", objectFit:"cover", border:"2px solid #09090B" }}/> : <div style={{ width:36, height:36, borderRadius:"50%", background:`linear-gradient(135deg,#3730a3,${draft.accent||ac})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, border:"2px solid #09090B" }}>{draft.logo_emoji||"🛍️"}</div>}
                  <div style={{ fontSize:12, fontWeight:800, color:"#fff" }}>{draft.name || "Tu tienda"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── SUSCRIPCIÓN — plan real + Pro gratis (compartir/referidos) ─────────── */
function Billing({ user, myPlan, plans, C, ac, flash, onPlanRequested }) {
  const [pending, setPending] = useState(null);
  const [loading, setLoading] = useState(true);
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
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [user.id]);

  const setLink = (i,v) => setLinks(p => p.map((l,idx)=>idx===i?v:l));
  const addLinkRow = () => links.length < REQUIRED && setLinks(p => [...p,""]);
  const removeLinkRow = (i) => setLinks(p => p.filter((_,idx)=>idx!==i));
  const filled = links.filter(l => l.trim().length > 5).length;
  const realReferrals = referrals.filter(r => r.qualifies).length;
  const nextPaidPlan = plans.find(p => p.id !== "gratis" && p.id !== myPlan?.id) || plans.find(p => p.id !== "gratis");

  const requestUpgrade = async (planId) => {
    setBusy(true);
    try { await submitPlanRequest(user.id, planId); setPending({ plan: planId, status:"pending" }); flash?.("✅ Solicitud enviada — el equipo la revisa pronto"); }
    catch (e) { flash?.("⚠️ " + (e?.message || "No se pudo enviar")); }
    setBusy(false);
  };
  const sendPromo = async () => {
    setBusy(true);
    try {
      const plan = nextPaidPlan?.id || "pro";
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

      {myPlan?.id === "gratis" && (
        <div style={{ borderRadius:14, border:`1px dashed rgba(${toRgb(ac)},0.4)`, background:C.s2, marginBottom:20, overflow:"hidden" }}>
          <div onClick={() => setPromoOpen(o=>!o)} style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 16px", cursor:"pointer" }}>
            <span style={{ fontSize:15 }}>🎁</span>
            <div style={{ fontSize:13, fontWeight:800, flex:1, color:C.t }}>¿Prefieres no pagar? Consigue Pro gratis</div>
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

/* ── DASHBOARD (panel de gestión Pro) ───────────────────────────────────── */
export function StoreDashboard({ user, cfg, products, orders, plans, myPlan, api, onStore, flash }) {
  const C = useSTk();
  const [sec, setSec] = useState("overview");
  const [col, setCol] = useState(false);
  const [toast, setToast] = useState(null);
  const ac = cfg.accent || "#FFC01E", r = toRgb(ac), ag = `rgba(${r},0.12)`;
  const isDesign = sec === "design";
  const NAVS = [
    { id:"overview", label:"Resumen", icon:LayoutDashboard },
    { id:"orders", label:"Pedidos", icon:ShoppingCart },
    { id:"products", label:"Productos", icon:Package },
    { id:"design", label:"Diseño", icon:Palette },
    { id:"billing", label:"Suscripción", icon:CreditCard },
  ];
  const pendingCount = orders.filter(o => String(o.status).toLowerCase() === "pendiente").length;

  const notify = (msg, type="ok") => { setToast({ msg, type }); setTimeout(()=>setToast(null), 2500); };

  const renderSec = () => {
    if (sec === "overview") return <Overview cfg={cfg} products={products} orders={orders} C={C} ac={ac}/>;
    if (sec === "orders")   return <Pedidos orders={orders} C={C} ac={ac}/>;
    if (sec === "products") return <ProdsSection products={products} C={C} ac={ac}
      onNewProduct={api.onNewProduct}
      onEditProduct={api.onEditProduct}
      onArchiveProduct={api.onArchiveProduct}
      onUnarchiveProduct={api.onUnarchiveProduct}
      onDeleteProduct={api.onDeleteProduct}
      maxProducts={myPlan?.max_products}/>;
    if (sec === "design")   return <Diseno cfg={cfg} products={products} onUpdateConfig={api.onUpdateConfig} C={C} ac={ac} flash={notify}/>;
    if (sec === "billing")  return <Billing user={user} myPlan={myPlan} plans={plans} C={C} ac={ac} flash={notify} onPlanRequested={api.onPlanRequested}/>;
    return null;
  };

  return (
    <div style={{ display:"flex", height:"100%", overflow:"hidden", background:C.bg, color:C.t }}>
      <Toast msg={toast?.msg} type={toast?.type} C={C}/>
      <div style={{ width:col?50:200, background:C.s1, borderRight:`1px solid ${C.b}`, display:"flex", flexDirection:"column", flexShrink:0, transition:"width .25s ease", overflow:"hidden" }}>
        <div style={{ padding:col?"13px 0":"13px 14px", borderBottom:`1px solid ${C.b}`, display:"flex", alignItems:"center", justifyContent:col?"center":"space-between" }}>
          {!col && <div style={{ display:"flex", alignItems:"center", gap:9 }}>
            {cfg.logo_url ? <img src={cfg.logo_url} style={{ width:26, height:26, borderRadius:7, objectFit:"cover" }}/> : <div style={{ width:26, height:26, borderRadius:7, background:`linear-gradient(135deg,#3730a3,${ac})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13 }}>{cfg.logo_emoji||"🛍️"}</div>}
            <div><div style={{ fontSize:12, fontWeight:800, whiteSpace:"nowrap" }}>{(cfg.name || "Mi tienda").slice(0,13)}</div><div style={{ fontSize:8, color:ac, fontWeight:800, letterSpacing:".08em" }}>{(myPlan?.name || "PRO").toUpperCase()}</div></div>
          </div>}
          <button onClick={() => setCol(!col)} style={{ width:20, height:20, borderRadius:5, background:C.s3, border:`1px solid ${C.b}`, cursor:"pointer", color:C.m, display:"flex", alignItems:"center", justifyContent:"center", marginLeft:col?"auto":0 }}>{col ? <ChevronRight size={11}/> : <ChevronLeft size={11}/>}</button>
        </div>
        <nav style={{ flex:1, padding:"8px 6px", overflowY:"auto" }}>
          {NAVS.map(item => {
            const Icon = item.icon, active = sec === item.id;
            const badge = item.id === "orders" ? pendingCount : 0;
            return (
              <button key={item.id} onClick={() => setSec(item.id)} title={item.label} style={{ width:"100%", display:"flex", alignItems:"center", gap:col?0:9, padding:col?"9px 0":"8px 9px", justifyContent:col?"center":"flex-start", borderRadius:8, border:"none", cursor:"pointer", marginBottom:2, background:active?ag:"transparent", color:active?ac:C.m }}>
                <Icon size={15}/>
                {!col && <span style={{ fontSize:12, fontWeight:active?700:500, flex:1, whiteSpace:"nowrap" }}>{item.label}</span>}
                {!col && badge>0 && <span style={{ background:ac, borderRadius:9, padding:"1px 6px", fontSize:9, fontWeight:800, color:"#000" }}>{badge}</span>}
              </button>
            );
          })}
        </nav>
        {!col && <div style={{ padding:"8px 10px", borderTop:`1px solid ${C.b}` }}>
          <button onClick={onStore} style={{ width:"100%", padding:7, borderRadius:8, border:`1px solid ${C.b}`, background:"transparent", color:C.m, fontSize:11, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}><Eye size={11}/> Ver tienda</button>
        </div>}
      </div>
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:isDesign?"hidden":"auto", minWidth:0 }}>
        {!isDesign && <div style={{ padding:"14px 22px", flex:1 }}>{renderSec()}</div>}
        {isDesign && <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>{renderSec()}</div>}
      </div>
    </div>
  );
}
