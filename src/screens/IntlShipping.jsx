import { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo } from "react";
import { LiveSlot } from "../shared/index.js";

const IntlShippingApp = (() => {

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────
const STATUSES = {
  solicitud_creada:       { label:"Solicitud creada",           color:"#6366F1", bg:"#EEF2FF", step:0 },
  recibido_transportista: { label:"Recibido por transportista", color:"#0284C7", bg:"#E0F2FE", step:1 },
  preparando_envio:       { label:"Preparando envío",           color:"#7C3AED", bg:"#F5F3FF", step:2 },
  paquete_enviado:        { label:"Paquete enviado",            color:"#1D4ED8", bg:"#DBEAFE", step:3 },
  en_aduana:              { label:"En aduana",                  color:"#D97706", bg:"#FEF3C7", step:4 },
  en_reparto:             { label:"En reparto",                 color:"#0F766E", bg:"#CCFBF1", step:5 },
  entregado:              { label:"Entregado",                  color:"#15803D", bg:"#DCFCE7", step:6 },
};
const SK = Object.keys(STATUSES);

const RATES = {
  "España":         { aereo:8,  maritimo:4 },
  "Estados Unidos": { aereo:9,  maritimo:5 },
};
// Lee las tarifas que el dueño edita en el panel (Economía). Si no hay, usa las por defecto.
function getLiveRates(){
  try{ const r=localStorage.getItem('retador_admincfg'); if(r){ const c=JSON.parse(r); if(c&&c.rates) return c.rates; } }catch{}
  return RATES;
}
function rateFor(origin, transport){
  const lr=getLiveRates();
  return (lr[origin]&&lr[origin][transport]!=null) ? lr[origin][transport] : (RATES[origin]?.[transport]||0);
}

const PROVINCES = [
  "Pinar del Río","Artemisa","La Habana","Mayabeque","Matanzas",
  "Cienfuegos","Villa Clara","Sancti Spíritus","Ciego de Ávila",
  "Camagüey","Las Tunas","Holguín","Granma","Santiago de Cuba",
  "Guantánamo","Isla de la Juventud",
];

const MO = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

// Seed reviews shown in the Reviews view (aggregate public reviews)
const SEED_REVIEWS = [
  { id:"sr1", origin:"España",         rating:5, text:"Todo llegó perfectamente. Mi familia en La Habana quedó muy contenta.", date:"2026-06-01", author:"M. Fernández" },
  { id:"sr2", origin:"España",         rating:4, text:"Buen servicio, hubo un pequeño retraso en aduana pero llegó todo bien.", date:"2026-05-18", author:"R. López" },
  { id:"sr3", origin:"España",         rating:5, text:"Excelente. Ya lo he usado 3 veces y siempre impecable.", date:"2026-05-02", author:"C. Martínez" },
  { id:"sr4", origin:"Estados Unidos", rating:5, text:"Rápido y seguro. Mi familia recibió todo sin problemas.", date:"2026-06-05", author:"A. Pérez" },
  { id:"sr5", origin:"Estados Unidos", rating:4, text:"Servicio confiable. El marítimo tarda más pero el precio es mejor.", date:"2026-05-22", author:"L. García" },
  { id:"sr6", origin:"Estados Unidos", rating:5, text:"Primera vez que uso este servicio y lo recomendaría sin duda.", date:"2026-05-10", author:"J. Rodríguez" },
];

const SEED = [
  {
    id:"CE-2026-0042", origin:"España", transport:"aereo",
    description:"Zapatos deportivos para familiar", weight:5.5, cost:44,
    status:"en_aduana", createdAt:"2026-07-14T09:30:00", deliveredAt:null,
    rating:null, reviewText:null,
    sender:{name:"Carlos Martínez García",docType:"DNI",docNumber:"47382910X",phone:"+34 612 345 678",email:"carlos@email.com"},
    recipient:{name:"María García López",docType:"CI",docNumber:"87654321A",phone:"+53 5 234 5678",address:"Calle 23 #405 e/ F y G",province:"La Habana",city:"Vedado"},
    history:[
      {status:"solicitud_creada",      date:"2026-07-14T09:30:00",user:"Sistema",  note:"Solicitud de envío creada correctamente."},
      {status:"recibido_transportista",date:"2026-07-15T10:20:00",user:"Operador", note:"Paquete recibido en almacén Madrid. Peso confirmado: 5.5 lb."},
      {status:"preparando_envio",      date:"2026-07-16T17:45:00",user:"Sistema",  note:"Paquete clasificado y preparado para envío aéreo."},
      {status:"paquete_enviado",       date:"2026-07-18T10:35:00",user:"Sistema",  note:"Paquete enviado vía aérea desde Madrid."},
      {status:"en_aduana",             date:"2026-07-20T21:12:00",user:"Sistema",  note:"El paquete llegó al país de destino y está siendo procesado en aduana."},
    ],
    addressModified:false, photos:[], incidents:[], paymentStatus:"pagado", paymentMethod:"Tarjeta de crédito",
  },
  {
    id:"CE-2026-0039", origin:"Estados Unidos", transport:"maritimo",
    description:"Medicamentos y artículos de aseo personal", weight:12, cost:60,
    status:"paquete_enviado", createdAt:"2026-07-05T14:00:00", deliveredAt:null,
    rating:null, reviewText:null,
    sender:{name:"Ana Rodríguez Fernández",docType:"Pasaporte",docNumber:"A12345678",phone:"+1 786 234 5678",email:"ana@email.com"},
    recipient:{name:"Roberto Rodríguez",docType:"CI",docNumber:"76543210B",phone:"+53 5 876 5432",address:"Ave. de los Libertadores #12",province:"Santiago de Cuba",city:"Santiago de Cuba"},
    history:[
      {status:"solicitud_creada",      date:"2026-07-05T14:00:00",user:"Sistema",  note:"Solicitud creada correctamente."},
      {status:"recibido_transportista",date:"2026-07-06T09:00:00",user:"Operador", note:"Recibido en Miami. Peso confirmado: 12 lb."},
      {status:"preparando_envio",      date:"2026-07-08T11:00:00",user:"Sistema",  note:"En proceso de consolidación marítima."},
      {status:"paquete_enviado",       date:"2026-07-10T08:00:00",user:"Sistema",  note:"Contenedor marítimo enviado desde Miami."},
    ],
    addressModified:false, photos:[], incidents:[], paymentStatus:"pagado", paymentMethod:"Transferencia bancaria",
  },
  {
    id:"CE-2026-0031", origin:"España", transport:"aereo",
    description:"Ropa y artículos del hogar", weight:8, cost:64,
    status:"entregado", createdAt:"2026-06-10T10:00:00", deliveredAt:"2026-06-18T15:30:00",
    rating:null, reviewText:null,
    sender:{name:"Luis Pérez Sánchez",docType:"DNI",docNumber:"12345678Z",phone:"+34 655 123 456",email:"luis@email.com"},
    recipient:{name:"Elena Pérez",docType:"CI",docNumber:"65432100C",phone:"+53 5 123 4567",address:"Calle Real #56",province:"Holguín",city:"Holguín"},
    history:[
      {status:"solicitud_creada",      date:"2026-06-10T10:00:00",user:"Sistema",  note:"Solicitud de envío creada."},
      {status:"recibido_transportista",date:"2026-06-11T09:30:00",user:"Operador", note:"Paquete recibido en Barcelona."},
      {status:"preparando_envio",      date:"2026-06-12T14:00:00",user:"Sistema",  note:"Preparando para envío aéreo."},
      {status:"paquete_enviado",       date:"2026-06-13T07:00:00",user:"Sistema",  note:"Enviado vía aérea desde Barcelona."},
      {status:"en_aduana",             date:"2026-06-15T12:00:00",user:"Sistema",  note:"En proceso aduanero."},
      {status:"en_reparto",            date:"2026-06-17T08:00:00",user:"Sistema",  note:"Paquete en reparto local."},
      {status:"entregado",             date:"2026-06-18T15:30:00",user:"Mensajero",note:"Entregado al destinatario en mano."},
    ],
    addressModified:false, photos:[], incidents:[], paymentStatus:"pagado", paymentMethod:"Efectivo",
  },
];

// ─────────────────────────────────────────────────────────────
// SHARED STYLES
// ─────────────────────────────────────────────────────────────
const IS = {
  width:"100%", padding:"10px 12px", borderRadius:10,
  border:"1.5px solid var(--is-border)", fontSize:14, color:"var(--is-t1)",
  background:"var(--is-fill)", outline:"none", boxSizing:"border-box", fontFamily:"inherit",
};
const LS = { display:"block", fontSize:12, fontWeight:600, color:"var(--is-t2)", marginBottom:4 };

// ─────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return "—";
  const dt = new Date(d), h = dt.getHours(), m = dt.getMinutes();
  return `${dt.getDate()} ${MO[dt.getMonth()]} ${dt.getFullYear()} · ${((h%12)||12).toString().padStart(2,"0")}:${m.toString().padStart(2,"0")} ${h>=12?"PM":"AM"}`;
}
function fmtShort(d) {
  if (!d) return "—";
  const dt = new Date(d);
  return `${dt.getDate()} ${MO[dt.getMonth()]} ${dt.getFullYear()}`;
}
function calcCost(origin, transport, weight) {
  return +((rateFor(origin,transport))*(parseFloat(weight)||0)).toFixed(2);
}
function nextId(list) {
  const mx = list.reduce((m,s)=>{ const n=parseInt(s.id.split("-")[2]||0); return n>m?n:m; },42);
  return `CE-2026-${String(mx+1).padStart(4,"0")}`;
}
function routeRating(ships, origin) {
  const fromShips = ships.filter(s=>s.origin===origin&&s.rating!==null).map(s=>s.rating);
  const fromSeeds = SEED_REVIEWS.filter(r=>r.origin===origin).map(r=>r.rating);
  const all = [...fromSeeds, ...fromShips];
  const count = all.length;
  const avg = count>0 ? Math.round((all.reduce((a,b)=>a+b,0)/count)*10)/10 : 0;
  return { avg, count };
}

// ─────────────────────────────────────────────────────────────
// PROGRESS RAIL
// ─────────────────────────────────────────────────────────────
function ProgressRail({ status }) {
  const cur = STATUSES[status]?.step??0;
  return (
    <div style={{ display:"flex", alignItems:"center", padding:"6px 0 2px" }}>
      {SK.map((k,i)=>{
        const done=i<=cur, active=i===cur, s=STATUSES[k];
        return (
          <div key={k} style={{ display:"flex", alignItems:"center", flex:i<SK.length-1?1:0 }}>
            <div title={s.label} style={{
              width:active?13:7, height:active?13:7, borderRadius:"50%", flexShrink:0,
              background:done?s.color:"var(--is-border)",
              boxShadow:active?`0 0 0 3px ${s.bg},0 0 0 5px ${s.color}44`:"none",
              transition:"all 0.2s",
            }}/>
            {i<SK.length-1&&<div style={{flex:1,height:2,background:i<cur?"var(--is-t3)":"var(--is-border)",margin:"0 2px"}}/>}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// BADGE
// ─────────────────────────────────────────────────────────────
function Badge({ status, sm }) {
  const s=STATUSES[status]; if(!s) return null;
  return (
    <span style={{ display:"inline-block", padding:sm?"2px 8px":"4px 10px", borderRadius:20,
      background:s.bg, color:s.color, fontSize:sm?11:12, fontWeight:600,
      letterSpacing:"0.01em", whiteSpace:"nowrap" }}>{s.label}</span>
  );
}

// ─────────────────────────────────────────────────────────────
// STARS
// ─────────────────────────────────────────────────────────────
function Stars({ value, onRate, size=16, invert=false }) {
  const [hover, setHover] = useState(null);
  const shown = hover??value??0;
  return (
    <div style={{ display:"flex", gap:1 }}>
      {[1,2,3,4,5].map(i=>(
        <span key={i}
          onClick={onRate?()=>onRate(i):undefined}
          onMouseEnter={onRate?()=>setHover(i):undefined}
          onMouseLeave={onRate?()=>setHover(null):undefined}
          style={{ fontSize:size, cursor:onRate?"pointer":"default", lineHeight:1, userSelect:"none",
            color:i<=shown?"#F59E0B":(invert?"rgba(255,255,255,0.22)":"#D1D5DB"),
            transition:"color 0.1s" }}
        >★</span>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION + ROW
// ─────────────────────────────────────────────────────────────
function Section({ title, action, children }) {
  return (
    <div style={{ background:"var(--is-card)", borderRadius:14, border:"1px solid var(--is-border)", padding:"14px 16px", marginBottom:12 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <div style={{ fontSize:13, fontWeight:700, color:"var(--is-t1)" }}>{title}</div>
        {action||null}
      </div>
      {children}
    </div>
  );
}
function Row({ label, value, mono }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"6px 0", borderBottom:"1px solid var(--is-border)" }}>
      <div style={{ fontSize:12, color:"var(--is-t3)", flexShrink:0, minWidth:88 }}>{label}</div>
      <div style={{ fontSize:13, color:"var(--is-t1)", textAlign:"right", flex:1, wordBreak:"break-all",
        fontFamily:mono?"monospace":"inherit", letterSpacing:mono?"0.04em":"normal" }}>{value}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// REVIEW SECTION (inside Detail, only when entregado)
// ─────────────────────────────────────────────────────────────
function ReviewSection({ shipment, onUpdate }) {
  const [stars, setStars] = useState(shipment.rating||0);
  const [text, setText]   = useState(shipment.reviewText||"");

  function submit() {
    if (!stars) return;
    onUpdate({ ...shipment, rating:stars, reviewText:text.trim() });
  }

  if (shipment.rating) {
    return (
      <Section title="Tu reseña">
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:shipment.reviewText?10:4 }}>
          <Stars value={shipment.rating} size={20}/>
          <span style={{ fontSize:14, fontWeight:800, color:"var(--is-t1)" }}>{shipment.rating}.0</span>
        </div>
        {shipment.reviewText&&(
          <div style={{ fontSize:13, color:"var(--is-t2)", lineHeight:1.6, fontStyle:"italic", padding:"10px 12px", background:"var(--is-fill)", borderRadius:8, marginBottom:8 }}>
            "{shipment.reviewText}"
          </div>
        )}
        <div style={{ fontSize:11, color:"#15803D", fontWeight:600 }}>✓ Reseña publicada</div>
      </Section>
    );
  }

  return (
    <Section title="Dejar reseña">
      <div style={{ fontSize:13, color:"var(--is-t2)", marginBottom:12 }}>¿Cómo fue tu experiencia con este envío?</div>
      <Stars value={stars} onRate={setStars} size={32}/>
      {stars>0&&(
        <>
          <textarea value={text} onChange={e=>setText(e.target.value)}
            placeholder="Cuéntanos tu experiencia (opcional)..."
            style={{ ...IS, minHeight:72, resize:"none", marginTop:14, marginBottom:10 }}/>
          <button onClick={submit} style={{ width:"100%", padding:"10px 0", borderRadius:10, border:"none", background:"linear-gradient(180deg,#2563EB 0%,#1C3FAA 100%)", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", boxShadow:"0 4px 14px rgba(30,58,138,0.35),0 2px 4px rgba(0,0,0,0.12),inset 0 1px 0 rgba(255,255,255,0.13)" }}>
            Publicar reseña
          </button>
        </>
      )}
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────
// TRACKING TIMELINE
// ─────────────────────────────────────────────────────────────
function Timeline({ shipment }) {
  return (
    <div style={{ padding:"4px 0" }}>
      {SK.map((k,i)=>{
        const s=STATUSES[k];
        const entry=shipment.history.find(h=>h.status===k);
        const done=!!entry, active=shipment.status===k, last=i===SK.length-1;
        return (
          <div key={k} style={{ display:"flex", gap:12 }}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", width:32 }}>
              <div style={{ width:32, height:32, borderRadius:"50%", flexShrink:0,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:13, fontWeight:700,
                background:done?s.bg:"var(--is-fill)", color:done?s.color:"var(--is-t4)",
                border:`2px solid ${done?s.color:"var(--is-border)"}`,
                boxShadow:active?`0 0 0 4px ${s.bg}`:"none" }}>
                {done?"✓":i+1}
              </div>
              {!last&&<div style={{ flex:1, width:2, background:done?s.color+"55":"var(--is-border)", margin:"4px 0", minHeight:16 }}/>}
            </div>
            <div style={{ flex:1, paddingBottom:last?0:16, paddingTop:6 }}>
              <div style={{ fontSize:14, fontWeight:done?700:500, color:done?"var(--is-t1)":"var(--is-t4)", marginBottom:2 }}>{s.label}</div>
              {entry?(
                <>
                  <div style={{ fontSize:12, color:"var(--is-t2)", marginBottom:entry.note?4:0 }}>{fmtDate(entry.date)}</div>
                  {entry.note&&<div style={{ fontSize:12, color:"var(--is-t3)", lineHeight:1.5 }}>{entry.note}</div>}
                </>
              ):(
                <div style={{ fontSize:12, color:"var(--is-t4)" }}>Pendiente</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SHIPMENT CARD — single CTA button
// ─────────────────────────────────────────────────────────────
function ShipCard({ s, onOpen }) {
  const flag=s.origin==="España"?"🇪🇸":"🇺🇸";
  const last=s.history[s.history.length-1];
  const st=STATUSES[s.status];
  return (
    <div style={{ background:"var(--is-card)", borderRadius:16, border:"1px solid var(--is-border)",
      boxShadow:"0 1px 4px rgba(0,0,0,0.05)", overflow:"hidden", marginBottom:12 }}>
      <div style={{ height:3, background:st?.color||"#6366F1" }}/>
      <div style={{ padding:"14px 16px" }}>
        {/* Top row */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
          <div style={{ flex:1, minWidth:0, paddingRight:8 }}>
            <div style={{ fontSize:15, fontWeight:700, color:"var(--is-t1)", marginBottom:3, lineHeight:1.3,
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.description}</div>
            <div style={{ fontSize:12, color:"var(--is-t2)", display:"flex", alignItems:"center", gap:3 }}>
              {flag} {s.origin}
              <span style={{ color:"var(--is-t4)", margin:"0 3px" }}>→</span>
              🇨🇺 Cuba
              <span style={{ color:"var(--is-t4)", margin:"0 4px" }}>·</span>
              {s.transport==="aereo"?"✈️":"🚢"}
            </div>
          </div>
          <div style={{ textAlign:"right", flexShrink:0 }}>
            <div style={{ fontSize:11, color:"var(--is-t3)", fontFamily:"monospace", letterSpacing:"0.04em" }}>{s.id}</div>
            <div style={{ fontSize:15, fontWeight:800, color:"var(--is-accentText)", marginTop:2 }}>${s.cost}</div>
          </div>
        </div>
        {/* Progress rail */}
        <ProgressRail status={s.status}/>
        {/* Status + date */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", margin:"8px 0 6px" }}>
          <Badge status={s.status} sm/>
          <div style={{ fontSize:11, color:"var(--is-t3)" }}>{fmtShort(last?.date)}</div>
        </div>
        {/* Last note */}
        {last?.note&&(
          <div style={{ fontSize:12, color:"var(--is-t2)", background:"var(--is-fill)", borderRadius:8,
            padding:"8px 10px", marginBottom:10, borderLeft:`3px solid ${st?.color}`, lineHeight:1.5 }}>
            {last.note}
          </div>
        )}
        {/* Stars if rated */}
        {s.rating&&(
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10 }}>
            <Stars value={s.rating} size={13}/>
            <span style={{ fontSize:11, color:"var(--is-t3)", fontWeight:600 }}>{s.rating}.0</span>
          </div>
        )}
        {/* Single CTA */}
        <button onClick={()=>onOpen(s,"detalles")} style={{ width:"100%", padding:"10px 0", borderRadius:10,
          border:"none", background:"linear-gradient(180deg,#2563EB 0%,#1C3FAA 100%)", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", boxShadow:"0 4px 14px rgba(30,58,138,0.35),0 2px 4px rgba(0,0,0,0.12),inset 0 1px 0 rgba(255,255,255,0.13)" }}>
          Ver envío
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HISTORY CARD
// ─────────────────────────────────────────────────────────────
function HistCard({ s, onOpen }) {
  const flag=s.origin==="España"?"🇪🇸":"🇺🇸";
  return (
    <div onClick={()=>onOpen(s,"detalles")} style={{ background:"var(--is-card)", borderRadius:12,
      border:"1px solid var(--is-border)", padding:"12px 14px", marginBottom:8, cursor:"pointer",
      display:"flex", justifyContent:"space-between", alignItems:"center", gap:8 }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:14, fontWeight:600, color:"var(--is-t1)", marginBottom:3,
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.description}</div>
        <div style={{ fontSize:11, color:"var(--is-t3)", display:"flex", gap:4, alignItems:"center", flexWrap:"wrap" }}>
          <span>{flag} → 🇨🇺</span><span>·</span>
          <span>{s.transport==="aereo"?"✈️":"🚢"}</span><span>·</span>
          <span>{fmtShort(s.deliveredAt||s.history[s.history.length-1]?.date)}</span>
        </div>
        {s.rating&&(
          <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:5 }}>
            <Stars value={s.rating} size={12}/>
            <span style={{ fontSize:11, color:"var(--is-t3)" }}>{s.rating}.0</span>
          </div>
        )}
      </div>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4, flexShrink:0 }}>
        <Badge status={s.status} sm/>
        <div style={{ fontSize:13, fontWeight:700, color:"var(--is-accentText)" }}>${s.cost}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ROUTE CARD — with aggregate rating + "Ver reseñas"
// ─────────────────────────────────────────────────────────────
function RouteCard({ origin, onCreate, onReviews, ships }) {
  const isES=origin==="España";
  const flag=isES?"🇪🇸":"🇺🇸";
  const grad=isES
    ?"linear-gradient(140deg,#1e3a8a 0%,#2563eb 100%)"
    :"linear-gradient(140deg,#312e81 0%,#4f46e5 100%)";
  const { avg, count } = routeRating(ships, origin);

  return (
    <div style={{ background:grad, borderRadius:18, padding:"18px", color:"#fff",
      minWidth:210, maxWidth:245, flex:"0 0 auto",
      boxShadow:"0 6px 20px rgba(30,58,138,0.32)", position:"relative", overflow:"hidden" }}>
      {/* Decorative bg icon */}
      <div style={{ position:"absolute", right:-8, top:-6, fontSize:76, opacity:0.07,
        transform:"rotate(-12deg)", userSelect:"none", pointerEvents:"none" }}>
        {isES?"✈️":"🚢"}
      </div>
      <div style={{ fontSize:26, marginBottom:4 }}>{flag} → 🇨🇺</div>
      <div style={{ fontSize:17, fontWeight:800, marginBottom:1, letterSpacing:"-0.01em" }}>{origin}</div>
      <div style={{ fontSize:12, opacity:0.6, marginBottom:10 }}>Cuba</div>

      {/* Rating row */}
      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:14 }}>
        <Stars value={avg} size={12} invert/>
        <span style={{ fontSize:12, color:"rgba(255,255,255,0.85)", fontWeight:700 }}>{avg}</span>
        <button onClick={onReviews} style={{ fontSize:11, color:"rgba(255,255,255,0.6)", background:"none",
          border:"none", cursor:"pointer", textDecoration:"underline", padding:0, marginLeft:2 }}>
          {count} reseñas
        </button>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:5, marginBottom:14 }}>
        <div style={{ background:"rgba(255,255,255,0.12)", borderRadius:7, padding:"4px 10px", fontSize:12 }}>
          ✈️ Aéreo · ${rateFor(origin,'aereo')}/lb
        </div>
        <div style={{ background:"rgba(255,255,255,0.12)", borderRadius:7, padding:"4px 10px", fontSize:12 }}>
          🚢 Marítimo · ${rateFor(origin,'maritimo')}/lb
        </div>
      </div>
      <button onClick={()=>onCreate(origin)} className="bp" style={{ width:"100%", padding:"10px 0", borderRadius:10,
        border:"none", background:"rgba(255,255,255,0.95)", color:"var(--is-accentText)",
        fontSize:13, fontWeight:800, cursor:"pointer",
        boxShadow:"0 4px 14px rgba(0,0,0,0.18),inset 0 1px 0 rgba(255,255,255,1)",
        letterSpacing:"0.01em" }}>
        Crear envío
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FIELD — reusable form input
// ─────────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, type="text", inputMode, optional, textarea }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={LS}>
        {label}
        {optional&&<span style={{ color:"var(--is-t3)", fontWeight:400 }}> (opcional)</span>}
      </label>
      {textarea?(
        <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
          style={{ ...IS, minHeight:70, resize:"none" }}/>
      ):(
        <input type={type} inputMode={inputMode} value={value}
          onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={IS}/>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CREATE FORM — origin is pre-set, no toggle shown
// ─────────────────────────────────────────────────────────────
function CreateForm({ initOrigin, onClose, onCreated }) {
  const origin = initOrigin || "España";
  const flag   = origin === "España" ? "🇪🇸" : "🇺🇸";

  const [f, setF] = useState({
    transport:"aereo",
    description:"", weight:"",
    sName:"", sDt:"DNI",  sDn:"", sPhone:"", sEmail:"",
    rName:"", rDt:"CI",   rDn:"", rPhone:"",
    rAddr:"", rProv:"La Habana", rCity:"",
  });
  function set(k,v){ setF(p=>({...p,[k]:v})); }

  const wt   = parseFloat(f.weight)||0;
  const cost = wt>0 ? calcCost(origin,f.transport,wt) : 0;
  const valid = f.description.trim()&&wt>0&&f.sName.trim()&&f.sPhone.trim()
    &&f.rName.trim()&&f.rPhone.trim()&&f.rAddr.trim()&&f.rCity.trim();

  function submit(){
    if(!valid) return;
    onCreated({
      origin, transport:f.transport, description:f.description.trim(), weight:wt, cost,
      sender:  {name:f.sName,docType:f.sDt,docNumber:f.sDn,phone:f.sPhone,email:f.sEmail},
      recipient:{name:f.rName,docType:f.rDt,docNumber:f.rDn,phone:f.rPhone,address:f.rAddr,province:f.rProv,city:f.rCity},
    });
  }

  const SS={background:"var(--is-card)",borderRadius:14,border:"1px solid var(--is-border)",padding:"14px 16px",marginBottom:12};
  const ST={fontSize:13,fontWeight:700,color:"var(--is-t1)",marginBottom:14};

  function Pill({ value, current, onClick, children }){
    const on=current===value;
    return (
      <button onClick={()=>onClick(value)} style={{ flex:1, padding:"10px 6px", borderRadius:10,
        border:`2px solid ${on?"#2563EB":"var(--is-border)"}`,
        background:on?"linear-gradient(180deg,rgba(37,99,235,.14) 0%,rgba(37,99,235,.05) 100%)":"linear-gradient(180deg,var(--is-card) 0%,var(--is-fill) 100%)",
        color:on?"var(--is-accentText)":"var(--is-t2)", fontSize:12, fontWeight:on?700:500, cursor:"pointer",
        boxShadow:on?"0 2px 10px rgba(37,99,235,0.2),inset 0 1px 0 rgba(255,255,255,0.9)":"0 1px 4px rgba(0,0,0,0.07),inset 0 1px 0 rgba(255,255,255,0.9)" }}>
        {children}
      </button>
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", flex:1, minHeight:0, overflow:"hidden", background:"var(--is-bg)",
      fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif" }}>
      {/* Header */}
      <div style={{ background:"var(--is-card)", borderBottom:"1px solid var(--is-border)", padding:"14px 16px",
        display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, zIndex:10 }}>
        <button onClick={onClose} className="bn" style={{ background:"linear-gradient(180deg,var(--is-card) 0%,var(--is-fill) 100%)", border:"1px solid var(--is-border)", borderRadius:10,
          width:36, height:36, cursor:"pointer", fontSize:18, color:"var(--is-t2)",
          display:"flex", alignItems:"center", justifyContent:"center",
          boxShadow:"0 2px 6px rgba(0,0,0,0.08),inset 0 1px 0 rgba(255,255,255,0.9)" }}>✕</button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:16, fontWeight:800, color:"var(--is-t1)" }}>Nuevo envío</div>
          <div style={{ fontSize:12, color:"var(--is-t2)" }}>Destino: 🇨🇺 Cuba</div>
        </div>
        {/* Origin chip — read-only */}
        <div style={{ background:"#EFF6FF", border:"1.5px solid #BFDBFE", borderRadius:10,
          padding:"6px 12px", display:"flex", alignItems:"center", gap:5 }}>
          <span style={{ fontSize:16 }}>{flag}</span>
          <span style={{ fontSize:12, fontWeight:700, color:"#1D4ED8" }}>{origin}</span>
        </div>
      </div>

      {/* Form */}
      <div style={{ flex:1, overflowY:"auto", padding:16 }}>
        <div style={SS}>
          <div style={ST}>Información del envío</div>

          {/* Transport */}
          <div style={{ marginBottom:14 }}>
            <label style={LS}>Tipo de transporte</label>
            <div style={{ display:"flex", gap:8 }}>
              <Pill value="aereo"    current={f.transport} onClick={v=>set("transport",v)}>✈️ Aéreo</Pill>
              <Pill value="maritimo" current={f.transport} onClick={v=>set("transport",v)}>🚢 Marítimo</Pill>
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom:6 }}>
            <label style={LS}>Descripción del contenido</label>
            <textarea value={f.description} onChange={e=>set("description",e.target.value)}
              placeholder="Ej: Zapatos deportivos, medicamentos, ropa, documentos..."
              style={{ ...IS, minHeight:68, resize:"none" }}/>
          </div>
          <div style={{ fontSize:11, color:"var(--is-t3)", marginBottom:14 }}>Describe claramente lo que vas a enviar.</div>

          {/* Weight */}
          <div>
            <label style={LS}>Peso</label>
            <div style={{ position:"relative" }}>
              <input type="number" inputMode="decimal" min="0.1" step="0.1"
                value={f.weight} onChange={e=>set("weight",e.target.value)}
                placeholder="0.0" style={{ ...IS, paddingRight:40 }}/>
              <span style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
                fontSize:13, color:"var(--is-t3)", fontWeight:600 }}>lb</span>
            </div>
          </div>
        </div>

        {/* Remitente */}
        <div style={SS}>
          <div style={ST}>Datos del remitente</div>
          <Field label="Nombre completo" value={f.sName} onChange={v=>set("sName",v)} placeholder="Nombre y apellidos"/>
          <div style={{ display:"flex", gap:8, marginBottom:14 }}>
            <div style={{ width:"42%" }}>
              <label style={LS}>Tipo doc.</label>
              <select value={f.sDt} onChange={e=>set("sDt",e.target.value)} style={IS}>
                {["DNI","NIE","Pasaporte","Otro"].map(d=><option key={d}>{d}</option>)}
              </select>
            </div>
            <div style={{ flex:1 }}>
              <label style={LS}>Nº documento</label>
              <input value={f.sDn} onChange={e=>set("sDn",e.target.value)} placeholder="12345678X" style={IS}/>
            </div>
          </div>
          <Field label="Teléfono" value={f.sPhone} onChange={v=>set("sPhone",v)}
            placeholder="+34 600 000 000" type="tel" inputMode="tel"/>
          <Field label="Correo electrónico" value={f.sEmail} onChange={v=>set("sEmail",v)}
            placeholder="correo@email.com" type="email" optional/>
        </div>

        {/* Destinatario */}
        <div style={SS}>
          <div style={ST}>Datos del destinatario</div>
          <Field label="Nombre completo" value={f.rName} onChange={v=>set("rName",v)} placeholder="Nombre y apellidos"/>
          <div style={{ display:"flex", gap:8, marginBottom:14 }}>
            <div style={{ width:"42%" }}>
              <label style={LS}>Tipo doc.</label>
              <select value={f.rDt} onChange={e=>set("rDt",e.target.value)} style={IS}>
                {["CI","Pasaporte","Otro"].map(d=><option key={d}>{d}</option>)}
              </select>
            </div>
            <div style={{ flex:1 }}>
              <label style={LS}>Nº documento</label>
              <input value={f.rDn} onChange={e=>set("rDn",e.target.value)} placeholder="87654321A" style={IS}/>
            </div>
          </div>
          <Field label="Teléfono" value={f.rPhone} onChange={v=>set("rPhone",v)}
            placeholder="+53 5 000 0000" type="tel" inputMode="tel"/>
          <Field label="Dirección completa" value={f.rAddr} onChange={v=>set("rAddr",v)} placeholder="Calle, número, referencia..."/>
          <div style={{ marginBottom:14 }}>
            <label style={LS}>Provincia</label>
            <select value={f.rProv} onChange={e=>set("rProv",e.target.value)} style={IS}>
              {PROVINCES.map(p=><option key={p}>{p}</option>)}
            </select>
          </div>
          <Field label="Ciudad / Municipio" value={f.rCity} onChange={v=>set("rCity",v)} placeholder="Municipio de entrega"/>
        </div>
        <div style={{ height:8 }}/>
      </div>

      {/* Sticky summary + CTA */}
      <div style={{ background:"var(--is-card)", borderTop:"1px solid var(--is-border)", padding:"14px 16px" }}>
        {valid && (<>
        <div style={{ fontSize:10, fontWeight:800, color:"var(--is-t3)", textTransform:"uppercase",
          letterSpacing:"0.1em", marginBottom:8 }}>Resumen del envío</div>
        <div style={{ display:"flex", alignItems:"center", background:"var(--is-fill)", borderRadius:10,
          padding:"10px 12px", marginBottom:12, gap:8 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:10, color:"var(--is-t3)", marginBottom:1 }}>Ruta</div>
            <div style={{ fontSize:13, fontWeight:700, color:"var(--is-t1)" }}>{flag} → 🇨🇺</div>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:10, color:"var(--is-t3)", marginBottom:1 }}>Transporte</div>
            <div style={{ fontSize:13, fontWeight:700, color:"var(--is-t1)" }}>{f.transport==="aereo"?"✈️ Aéreo":"🚢 Marítimo"}</div>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:10, color:"var(--is-t3)", marginBottom:1 }}>Peso</div>
            <div style={{ fontSize:13, fontWeight:700, color:"var(--is-t1)" }}>{f.weight||"—"} lb</div>
          </div>
          <div style={{ textAlign:"right", flexShrink:0 }}>
            <div style={{ fontSize:10, color:"var(--is-t3)", marginBottom:1 }}>Coste est.</div>
            <div style={{ fontSize:20, fontWeight:900, color:"var(--is-accentText)" }}>{wt>0?`$${cost}`:"—"}</div>
          </div>
        </div>
        </>)}
        <button onClick={submit} disabled={!valid} style={{ width:"100%", padding:"13px 0", borderRadius:12,
          border:"none", fontSize:15, fontWeight:700, cursor:valid?"pointer":"not-allowed", letterSpacing:"0.01em",
          background:valid?"linear-gradient(160deg,#2563EB 0%,#1C3FAA 100%)":"var(--is-fill)",
          color:valid?"#fff":"var(--is-t3)",
          boxShadow:valid?"0 6px 20px rgba(30,58,138,0.42),0 2px 6px rgba(0,0,0,0.12),inset 0 1px 0 rgba(255,255,255,0.13)":"none" }}>
          {valid?"✓  Confirmar envío":"Completa el formulario"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SHIPMENT DETAIL
// ─────────────────────────────────────────────────────────────
function Detail({ shipment, onBack, onUpdate, initTab }) {
  const [tab, setTab]         = useState(initTab||"detalles");
  const [editAddr, setEditAddr] = useState(false);
  const [addr, setAddr]       = useState({
    address:shipment.recipient.address,
    province:shipment.recipient.province,
    city:shipment.recipient.city,
  });
  const [incident, setIncident] = useState("");

  const curStep = STATUSES[shipment.status]?.step??0;
  const canEdit = !shipment.addressModified&&curStep<3;

  function saveAddr() {
    onUpdate({
      ...shipment,
      recipient:{...shipment.recipient,...addr},
      addressModified:true,
      history:[...shipment.history,{status:shipment.status,date:new Date().toISOString(),user:"Usuario",
        note:`Dirección modificada: ${addr.address}, ${addr.city}, ${addr.province}`}],
    });
    setEditAddr(false);
  }

  function reportIncident() {
    if(!incident.trim()) return;
    onUpdate({...shipment,incidents:[...shipment.incidents,
      {id:Date.now(),text:incident,date:new Date().toISOString(),status:"Abierta"}]});
    setIncident("");
  }

  const TABS=[
    ["detalles","Detalles"],
    ["seguimiento","Seguimiento"],
    ["incidencias",shipment.incidents.length>0?`Incidencias (${shipment.incidents.length})`:"Incidencias"],
  ];

  return (
    <div style={{ flex:1, minHeight:0, overflow:"hidden", background:"var(--is-bg)", display:"flex", flexDirection:"column",
      fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif" }}>
      {/* Header */}
      <div style={{ background:"var(--is-card)", borderBottom:"1px solid var(--is-border)", position:"sticky", top:0, zIndex:10 }}>
        <div style={{ padding:"14px 16px 0" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
            <button onClick={onBack} className="bn" style={{ background:"linear-gradient(180deg,var(--is-card) 0%,var(--is-fill) 100%)", border:"1px solid var(--is-border)", borderRadius:10,
              width:36, height:36, fontSize:16, cursor:"pointer", color:"var(--is-accentText)",
              display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
              boxShadow:"0 2px 6px rgba(0,0,0,0.08),inset 0 1px 0 rgba(255,255,255,0.9)" }}>←</button>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:11, color:"var(--is-t3)", fontFamily:"monospace", letterSpacing:"0.05em" }}>{shipment.id}</div>
              <div style={{ fontSize:15, fontWeight:700, color:"var(--is-t1)", overflow:"hidden",
                textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{shipment.description}</div>
            </div>
          </div>
          <div style={{ background:STATUSES[shipment.status]?.bg, borderRadius:12, padding:"10px 12px", marginBottom:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
              <Badge status={shipment.status}/>
              <div style={{ fontSize:11, color:"var(--is-t2)" }}>{fmtShort(shipment.history[shipment.history.length-1]?.date)}</div>
            </div>
            <ProgressRail status={shipment.status}/>
          </div>
          <div style={{ display:"flex", background:"var(--is-fill)", borderRadius:10, padding:3 }}>
            {TABS.map(([id,lbl])=>(
              <button key={id} onClick={()=>setTab(id)} style={{ flex:1, padding:"7px 4px", borderRadius:8,
                border:"none", background:tab===id?"var(--is-card)":"transparent", color:tab===id?"var(--is-t1)":"var(--is-t2)",
                fontSize:12, fontWeight:tab===id?700:500, cursor:"pointer",
                boxShadow:tab===id?"0 2px 8px rgba(0,0,0,0.09),inset 0 1px 0 rgba(255,255,255,0.9)":"none",
                transition:"all 0.15s", whiteSpace:"nowrap" }}>{lbl}</button>
            ))}
          </div>
        </div>
        <div style={{ height:1, background:"var(--is-fill)", marginTop:10 }}/>
      </div>

      {/* Content */}
      <div style={{ flex:1, overflowY:"auto", padding:16 }}>
        {tab==="detalles"&&(
          <>
            <Section title="Información general">
              <Row label="ID" value={shipment.id} mono/>
              <Row label="Origen" value={`${shipment.origin==="España"?"🇪🇸":"🇺🇸"} ${shipment.origin} → 🇨🇺 Cuba`}/>
              <Row label="Transporte" value={shipment.transport==="aereo"?"✈️ Aéreo":"🚢 Marítimo"}/>
              <Row label="Creación" value={fmtDate(shipment.createdAt)}/>
              {shipment.deliveredAt&&<Row label="Entrega" value={fmtDate(shipment.deliveredAt)}/>}
            </Section>

            <Section title="Remitente">
              <Row label="Nombre" value={shipment.sender.name}/>
              <Row label="Documento" value={`${shipment.sender.docType} ${shipment.sender.docNumber}`}/>
              <Row label="Teléfono" value={shipment.sender.phone}/>
              {shipment.sender.email&&<Row label="Email" value={shipment.sender.email}/>}
            </Section>

            <Section title="Destinatario"
              action={
                canEdit&&!editAddr
                  ?<button onClick={()=>setEditAddr(true)} style={{ fontSize:12,color:"#2563EB",background:"none",border:"none",cursor:"pointer",fontWeight:600,padding:0 }}>Modificar dirección</button>
                  :shipment.addressModified
                    ?<span style={{ fontSize:11,color:"#D97706",background:"#FEF3C7",borderRadius:4,padding:"2px 6px",fontWeight:600 }}>Modificada</span>
                    :null
              }>
              <Row label="Nombre" value={shipment.recipient.name}/>
              <Row label="Documento" value={`${shipment.recipient.docType} ${shipment.recipient.docNumber}`}/>
              <Row label="Teléfono" value={shipment.recipient.phone}/>
              {!editAddr?(
                <>
                  <Row label="Dirección" value={shipment.recipient.address}/>
                  <Row label="Provincia" value={shipment.recipient.province}/>
                  <Row label="Ciudad" value={shipment.recipient.city}/>
                </>
              ):(
                <div style={{ marginTop:8 }}>
                  <label style={LS}>Dirección</label>
                  <input value={addr.address} onChange={e=>setAddr(a=>({...a,address:e.target.value}))} style={{...IS,marginBottom:10}}/>
                  <label style={LS}>Provincia</label>
                  <select value={addr.province} onChange={e=>setAddr(a=>({...a,province:e.target.value}))} style={{...IS,marginBottom:10}}>
                    {PROVINCES.map(p=><option key={p}>{p}</option>)}
                  </select>
                  <label style={LS}>Ciudad / Municipio</label>
                  <input value={addr.city} onChange={e=>setAddr(a=>({...a,city:e.target.value}))} style={{...IS,marginBottom:12}}/>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={()=>setEditAddr(false)} style={{ flex:1,padding:"9px 0",borderRadius:10,border:"1.5px solid var(--is-border)",background:"linear-gradient(180deg,var(--is-card) 0%,var(--is-fill) 100%)",color:"var(--is-t2)",fontSize:13,fontWeight:600,cursor:"pointer",boxShadow:"0 2px 6px rgba(0,0,0,0.07),inset 0 1px 0 rgba(255,255,255,0.95)" }}>Cancelar</button>
                    <button onClick={saveAddr} style={{ flex:1,padding:"9px 0",borderRadius:10,border:"none",background:"linear-gradient(180deg,#2563EB 0%,#1C3FAA 100%)",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",boxShadow:"0 4px 12px rgba(30,58,138,0.32),inset 0 1px 0 rgba(255,255,255,0.12)" }}>Guardar</button>
                  </div>
                </div>
              )}
            </Section>

            <Section title="Paquete">
              <Row label="Descripción" value={shipment.description}/>
              <Row label="Peso" value={`${shipment.weight} lb`}/>
            </Section>

            <Section title="Información económica">
              <Row label="Coste" value={<span style={{ fontWeight:700,color:"var(--is-accentText)" }}>${shipment.cost}</span>}/>
              <Row label="Estado pago" value={<span style={{ color:shipment.paymentStatus==="pagado"?"#15803D":"#D97706",fontWeight:600 }}>{shipment.paymentStatus==="pagado"?"✓ Pagado":"Pendiente"}</span>}/>
              <Row label="Método" value={shipment.paymentMethod}/>
            </Section>

            {/* Review section only after delivery */}
            {shipment.status==="entregado"&&(
              <ReviewSection shipment={shipment} onUpdate={onUpdate}/>
            )}
          </>
        )}

        {tab==="seguimiento"&&(
          <div style={{ background:"var(--is-card)", borderRadius:14, border:"1px solid var(--is-border)", padding:"16px" }}>
            <Timeline shipment={shipment}/>
          </div>
        )}

        {tab==="incidencias"&&(
          <>
            <Section title="Reportar incidencia">
              <textarea value={incident} onChange={e=>setIncident(e.target.value)}
                placeholder="Describe el problema: daño, error de datos, demora inusual..."
                style={{ ...IS,minHeight:90,resize:"none",marginBottom:10 }}/>
              <button onClick={reportIncident} disabled={!incident.trim()} style={{
                width:"100%",padding:"10px 0",borderRadius:10,border:"none",
                background:incident.trim()?"linear-gradient(180deg,#2563EB 0%,#1C3FAA 100%)":"var(--is-fill)",
                color:incident.trim()?"#fff":"var(--is-t3)",fontSize:13,fontWeight:600,
                cursor:incident.trim()?"pointer":"not-allowed",
                boxShadow:incident.trim()?"0 4px 12px rgba(30,58,138,0.32),inset 0 1px 0 rgba(255,255,255,0.12)":"none" }}>
                Enviar reporte
              </button>
            </Section>
            {shipment.incidents.length>0?(
              <Section title={`Incidencias registradas (${shipment.incidents.length})`}>
                {shipment.incidents.map(inc=>(
                  <div key={inc.id} style={{ background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,padding:"10px 12px",marginBottom:8 }}>
                    <div style={{ display:"flex",justifyContent:"space-between",marginBottom:6 }}>
                      <span style={{ fontSize:11,fontWeight:600,color:"#DC2626",background:"#FEE2E2",padding:"2px 8px",borderRadius:8 }}>{inc.status}</span>
                      <span style={{ fontSize:11,color:"var(--is-t3)" }}>{fmtShort(inc.date)}</span>
                    </div>
                    <div style={{ fontSize:13,color:"#7F1D1D",lineHeight:1.5 }}>{inc.text}</div>
                  </div>
                ))}
              </Section>
            ):(
              <div style={{ textAlign:"center",padding:"32px 16px",color:"var(--is-t3)" }}>
                <div style={{ fontSize:36,marginBottom:8 }}>✅</div>
                <div style={{ fontSize:14,fontWeight:600,color:"var(--is-t2)",marginBottom:4 }}>Sin incidencias</div>
                <div style={{ fontSize:12 }}>Este envío no tiene ningún problema registrado</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// REVIEWS LIST VIEW
// ─────────────────────────────────────────────────────────────
function ReviewsList({ origin, ships, onBack }) {
  const flag = origin==="España"?"🇪🇸":"🇺🇸";
  const { avg, count } = routeRating(ships, origin);

  const fromShips = ships
    .filter(s=>s.origin===origin&&s.rating!==null)
    .map(s=>({ id:s.id, rating:s.rating, text:s.reviewText, date:s.deliveredAt||s.createdAt, author:"Usuario verificado" }));
  const fromSeeds = SEED_REVIEWS.filter(r=>r.origin===origin);
  const all = [...fromShips, ...fromSeeds].sort((a,b)=>new Date(b.date)-new Date(a.date));

  // Distribution per star level
  const dist = [5,4,3,2,1].map(star=>{
    const n = all.filter(r=>r.rating===star).length;
    return { star, n, pct: count>0?Math.round(n/count*100):0 };
  });

  return (
    <div style={{ flex:1, minHeight:0, overflowY:"auto", background:"var(--is-bg)",
      fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif" }}>
      {/* Header */}
      <div style={{ background:"var(--is-card)", borderBottom:"1px solid var(--is-border)", padding:"14px 16px",
        display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, zIndex:10 }}>
        <button onClick={onBack} className="bn" style={{ background:"linear-gradient(180deg,var(--is-card) 0%,var(--is-fill) 100%)",border:"1px solid var(--is-border)",borderRadius:10,
          width:36,height:36,fontSize:16,cursor:"pointer",color:"var(--is-accentText)",
          display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
          boxShadow:"0 2px 6px rgba(0,0,0,0.08),inset 0 1px 0 rgba(255,255,255,0.9)" }}>←</button>
        <div>
          <div style={{ fontSize:16,fontWeight:800,color:"var(--is-t1)" }}>Reseñas</div>
          <div style={{ fontSize:12,color:"var(--is-t2)" }}>{flag} {origin} → 🇨🇺 Cuba</div>
        </div>
      </div>

      <div style={{ padding:16 }}>
        {/* Summary card */}
        <div style={{ background:"var(--is-card)",borderRadius:16,border:"1px solid var(--is-border)",padding:"20px",marginBottom:16,display:"flex",gap:20,alignItems:"center" }}>
          <div style={{ textAlign:"center",flexShrink:0 }}>
            <div style={{ fontSize:48,fontWeight:900,color:"var(--is-t1)",lineHeight:1 }}>{avg}</div>
            <Stars value={avg} size={18}/>
            <div style={{ fontSize:12,color:"var(--is-t3)",marginTop:4 }}>{count} reseñas</div>
          </div>
          <div style={{ flex:1 }}>
            {dist.map(({star,n,pct})=>(
              <div key={star} style={{ display:"flex",alignItems:"center",gap:6,marginBottom:4 }}>
                <span style={{ fontSize:11,color:"var(--is-t2)",width:10,textAlign:"right",flexShrink:0 }}>{star}</span>
                <span style={{ fontSize:11,color:"#F59E0B" }}>★</span>
                <div style={{ flex:1,height:6,background:"var(--is-fill)",borderRadius:3,overflow:"hidden" }}>
                  <div style={{ height:"100%",width:`${pct}%`,background:"#F59E0B",borderRadius:3 }}/>
                </div>
                <span style={{ fontSize:11,color:"var(--is-t3)",width:24,textAlign:"right",flexShrink:0 }}>{n}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Individual reviews */}
        {all.map((r,i)=>(
          <div key={r.id||i} style={{ background:"var(--is-card)",borderRadius:12,border:"1px solid var(--is-border)",padding:"14px",marginBottom:10 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8 }}>
              <Stars value={r.rating} size={14}/>
              <span style={{ fontSize:11,color:"var(--is-t3)" }}>{fmtShort(r.date)}</span>
            </div>
            {r.text&&<div style={{ fontSize:13,color:"#374151",lineHeight:1.6,marginBottom:8 }}>{r.text}</div>}
            <div style={{ fontSize:11,color:"var(--is-t3)",fontStyle:"italic" }}>— {r.author}</div>
          </div>
        ))}

        {all.length===0&&(
          <div style={{ textAlign:"center",padding:"48px 16px",color:"var(--is-t3)" }}>
            <div style={{ fontSize:40,marginBottom:12 }}>⭐</div>
            <div style={{ fontSize:15,fontWeight:600,color:"var(--is-t2)",marginBottom:6 }}>Sin reseñas aún</div>
            <div style={{ fontSize:13 }}>Sé el primero en dejar una reseña</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SUCCESS SCREEN
// ─────────────────────────────────────────────────────────────
function Success({ id, onHome, onViewDetail }) {
  return (
    <div style={{ flex:1, minHeight:0, overflowY:"auto", background:"var(--is-bg)", display:"flex", alignItems:"center",
      justifyContent:"center", padding:24,
      fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif" }}>
      <div style={{ background:"var(--is-card)",borderRadius:24,padding:"36px 24px",textAlign:"center",
        maxWidth:320,width:"100%",boxShadow:"0 8px 32px rgba(0,0,0,0.1)" }}>
        <div style={{ width:76,height:76,background:"#DCFCE7",borderRadius:"50%",
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:34,margin:"0 auto 18px" }}>📦</div>
        <div style={{ fontSize:22,fontWeight:900,color:"var(--is-t1)",marginBottom:8,letterSpacing:"-0.02em" }}>¡Envío creado!</div>
        <div style={{ fontSize:14,color:"var(--is-t2)",marginBottom:22,lineHeight:1.6 }}>
          Tu solicitud ha sido registrada correctamente.<br/>Recibirás actualizaciones del estado.
        </div>
        <div style={{ background:"var(--is-fill)",borderRadius:12,padding:"12px 16px",marginBottom:24 }}>
          <div style={{ fontSize:11,color:"#6366F1",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4 }}>ID del envío</div>
          <div style={{ fontSize:22,fontWeight:900,color:"var(--is-t1)",fontFamily:"monospace",letterSpacing:"0.06em" }}>{id}</div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={onHome} style={{ flex:1,padding:"11px 0",borderRadius:10,border:"1.5px solid var(--is-border)",background:"linear-gradient(180deg,var(--is-card) 0%,var(--is-fill) 100%)",color:"var(--is-accentText)",fontSize:13,fontWeight:700,cursor:"pointer",boxShadow:"0 2px 6px rgba(0,0,0,0.07),inset 0 1px 0 rgba(255,255,255,0.95)" }}>Inicio</button>
          <button onClick={onViewDetail} style={{ flex:1,padding:"11px 0",borderRadius:10,border:"none",background:"linear-gradient(180deg,#2563EB 0%,#1C3FAA 100%)",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 14px rgba(30,58,138,0.38),inset 0 1px 0 rgba(255,255,255,0.12)" }}>Ver detalles</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────
function EmptyState({ icon, title, sub }) {
  return (
    <div style={{ textAlign:"center",padding:"48px 16px" }}>
      <div style={{ fontSize:44,marginBottom:12 }}>{icon}</div>
      <div style={{ fontSize:17,fontWeight:700,color:"var(--is-t2)",marginBottom:6 }}>{title}</div>
      <div style={{ fontSize:13,color:"var(--is-t3)",lineHeight:1.6 }}>{sub}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────
function App({ onBack, onNav }) {
  const [ships, setShips]         = useState(SEED);
  const [view, setView]           = useState("dash"); // dash | create | detail | success | reviews
  const [selected, setSelected]   = useState(null);
  const [detailTab, setDetailTab] = useState("detalles");
  const [createOrigin, setCreateOrigin] = useState("España");
  const [dashTab, setDashTab]     = useState("activos");
  const [createdId, setCreatedId] = useState(null);
  const [reviewsOrigin, setReviewsOrigin] = useState(null);

  const active  = ships.filter(s=>s.status!=="entregado");
  const history = ships.filter(s=>s.status==="entregado");

  function openCreate(origin)       { setCreateOrigin(origin); setView("create"); }
  function openDetail(s,tab="detalles") { setSelected(s); setDetailTab(tab); setView("detail"); }
  function openReviews(origin)      { setReviewsOrigin(origin); setView("reviews"); }

  function handleCreate(data) {
    const now=new Date().toISOString(), id=nextId(ships);
    const ship={
      ...data, id, status:"solicitud_creada", createdAt:now, deliveredAt:null,
      rating:null, reviewText:null,
      history:[{status:"solicitud_creada",date:now,user:"Sistema",note:"Solicitud de envío creada correctamente."}],
      addressModified:false, photos:[], incidents:[], paymentStatus:"pendiente", paymentMethod:"—",
    };
    setShips(prev=>[ship,...prev]);
    setCreatedId(id);
    setView("success");
  }

  function handleUpdate(updated) {
    setShips(prev=>prev.map(s=>s.id===updated.id?updated:s));
    setSelected(updated);
  }

  // ── VIEWS ─────────────────────────────────────────────────

  if (view==="reviews"&&reviewsOrigin) {
    return <ReviewsList origin={reviewsOrigin} ships={ships} onBack={()=>setView("dash")}/>;
  }

  if (view==="success") {
    const ship=ships.find(s=>s.id===createdId);
    return (
      <Success id={createdId}
        onHome={()=>{setDashTab("activos");setView("dash");}}
        onViewDetail={()=>openDetail(ship,"detalles")}/>
    );
  }

  if (view==="create") {
    return <CreateForm initOrigin={createOrigin} onClose={()=>setView("dash")} onCreated={handleCreate}/>;
  }

  if (view==="detail"&&selected) {
    const ship=ships.find(s=>s.id===selected.id)||selected;
    return <Detail key={selected.id} shipment={ship} onBack={()=>setView("dash")} onUpdate={handleUpdate} initTab={detailTab}/>;
  }

  // ── DASHBOARD ─────────────────────────────────────────────
  return (
    <div style={{ flex:1, minHeight:0, overflowY:"auto", background:"var(--is-bg)",
      fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif" }}>
      <style>{`
  .sx::-webkit-scrollbar{display:none}
  .sx{scrollbar-width:none;-ms-overflow-style:none}
  .bp:active{transform:translateY(1px);filter:brightness(0.93)}
  .bs:active{transform:translateY(1px);filter:brightness(0.96)}
  .bn:active{transform:scale(0.93)}
  .bp,.bs,.bn{transition:transform 0.1s,filter 0.1s,box-shadow 0.1s}
`}</style>

      {/* Header — compact */}
      <div style={{ background:"var(--is-header)", padding:"9px 16px", position:"sticky", top:0, zIndex:10 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <button onClick={onBack} aria-label="Volver" style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:8, width:30, height:30, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0, padding:0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </button>
            <div style={{ fontSize:15,fontWeight:900,color:"#fff",letterSpacing:"-0.02em" }}>Centro de Envíos</div>
            <div style={{ width:1,height:13,background:"rgba(255,255,255,0.15)" }}/>
            <div style={{ fontSize:11,color:"var(--is-t2)",fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase" }}>Internacional</div>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:5,background:"rgba(255,255,255,0.07)",borderRadius:8,padding:"5px 10px",border:"1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ width:6,height:6,borderRadius:"50%",background:"#22C55E" }}/>
            <span style={{ fontSize:11,color:"var(--is-t3)",fontWeight:500 }}>{active.length} activo{active.length!==1?"s":""}</span>
          </div>
        </div>
      </div>

      <div style={{ padding:"16px 0 40px" }}>
        {/* Tramo: antes de crear envío */}
        <LiveSlot page="delivery_intl" from="di_h" to="di_create" onNav={onNav} pad="0 16px 16px" />
        {/* Route cards — EE.UU. primero, España segundo */}
        <div style={{ padding:"0 16px", marginBottom:22 }}>
          <div style={{ fontSize:11,fontWeight:700,color:"var(--is-t3)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:12 }}>
            Crear nuevo envío
          </div>
          <div className="sx" style={{ display:"flex", gap:12, overflowX:"auto", paddingBottom:6 }}>
            <RouteCard origin="Estados Unidos" onCreate={openCreate} ships={ships}
              onReviews={()=>openReviews("Estados Unidos")}/>
            <RouteCard origin="España" onCreate={openCreate} ships={ships}
              onReviews={()=>openReviews("España")}/>
            <div style={{ minWidth:8,flexShrink:0 }}/>
          </div>
        </div>

        {/* Tramo: entre crear envío y las pestañas */}
        <LiveSlot page="delivery_intl" from="di_create" to="di_tabs" onNav={onNav} pad="0 16px 14px" />

        {/* Tabs */}
        <div style={{ padding:"0 16px", marginBottom:14 }}>
          <div style={{ display:"flex", background:"var(--is-fill)", borderRadius:13, padding:4 }}>
            {[["activos",`Mis envíos${active.length?` (${active.length})`:""}`],["historial","Historial"]].map(([id,lbl])=>(
              <button key={id} onClick={()=>setDashTab(id)} style={{ flex:1,padding:"9px 4px",borderRadius:10,
                border:"none",
                background:dashTab===id?"linear-gradient(160deg,#2563EB 0%,#1C3FAA 100%)":"transparent",
                color:dashTab===id?"#fff":"#64748B", fontSize:13,
                fontWeight:dashTab===id?700:500, cursor:"pointer",
                boxShadow:dashTab===id?"0 3px 10px rgba(30,58,138,0.3),inset 0 1px 0 rgba(255,255,255,0.15)":"none",
                transition:"all 0.15s",letterSpacing:dashTab===id?"0.01em":"normal" }}>{lbl}</button>
            ))}
          </div>
        </div>

        {/* Tramo: entre las pestañas y la lista */}
        <LiveSlot page="delivery_intl" from="di_tabs" to="di_list" onNav={onNav} pad="0 16px 14px" />

        {/* List */}
        <div style={{ padding:"0 16px" }}>
          {dashTab==="activos"&&(
            active.length===0
              ?<EmptyState icon="📦" title="Sin envíos activos" sub="Crea tu primer envío usando las tarjetas de arriba"/>
              :active.map(s=><ShipCard key={s.id} s={s} onOpen={openDetail}/>)
          )}
          {dashTab==="historial"&&(
            history.length===0
              ?<EmptyState icon="📋" title="Sin historial aún" sub="Los envíos completados aparecerán aquí"/>
              :<>
                <div style={{ fontSize:12,color:"var(--is-t3)",marginBottom:10 }}>
                  {history.length} envío{history.length!==1?"s":""} completado{history.length!==1?"s":""}
                </div>
                {history.map(s=><HistCard key={s.id} s={s} onOpen={openDetail}/>)}
              </>
          )}
        </div>

        {/* Tramo: después de la lista de envíos */}
        <LiveSlot page="delivery_intl" from="di_list" to={null} onNav={onNav} pad="14px 16px 0" />
      </div>
    </div>
  );
}
  return App;
})();
export default IntlShippingApp;
