import { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo } from "react";
import IntlShippingApp from "./IntlShipping.jsx";
import { LiveSlot, useAt } from "../shared/index.js";

const DELIVERY_LOCAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@500;600;700;800&family=Outfit:wght@300;400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

@keyframes dl-pulse  {0%,100%{opacity:1;transform:scale(1)}50%{opacity:.42;transform:scale(.75)}}
@keyframes dl-ring   {0%{transform:scale(1);opacity:.6}100%{transform:scale(2.8);opacity:0}}
@keyframes dl-fadeup {from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes dl-ticker {0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
@keyframes dl-progress-fill{from{width:0%}to{width:62%}}
@keyframes dl-glow-pulse{0%,100%{box-shadow:0 0 10px 2px rgba(196,152,46,.16)}50%{box-shadow:0 0 20px 5px rgba(196,152,46,.28)}}

@keyframes ne-fadeup   {from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}
@keyframes ne-pulse    {0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.72)}}
@keyframes ne-ring     {0%{transform:scale(1);opacity:.55}100%{transform:scale(2.6);opacity:0}}
@keyframes ne-check-in {from{opacity:0;transform:scale(.6)}to{opacity:1;transform:scale(1)}}
@keyframes ne-shake    {0%,100%{transform:translateX(0)}20%{transform:translateX(-3px)}40%{transform:translateX(3px)}60%{transform:translateX(-2px)}80%{transform:translateX(2px)}}
@keyframes ne-glow     {0%,100%{box-shadow:0 0 14px 2px rgba(196,152,46,.2)}50%{box-shadow:0 0 24px 6px rgba(196,152,46,.34)}}
@keyframes ne-slide-down{from{opacity:0;transform:translateY(-3px)}to{opacity:1;transform:translateY(0)}}
@keyframes ne-summary-in{from{opacity:0;transform:translateY(5px) scale(.99)}to{opacity:1;transform:translateY(0) scale(1)}}

@keyframes screen-slide-in {from{opacity:0;transform:translateX(28px)}to{opacity:1;transform:translateX(0)}}
@keyframes screen-slide-out{from{opacity:0;transform:translateX(-18px)}to{opacity:1;transform:translateX(0)}}

@keyframes rt-fadeup      {from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}
@keyframes rt-pulse       {0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.72)}}
@keyframes rt-ring        {0%{transform:scale(1);opacity:.55}100%{transform:scale(2.8);opacity:0}}
@keyframes rt-status-glow {0%,100%{box-shadow:0 0 0 0 rgba(44,184,122,0)}50%{box-shadow:0 0 16px 3px rgba(44,184,122,.12)}}
@keyframes rt-map-shimmer {0%{opacity:.6}50%{opacity:1}100%{opacity:.6}}
@keyframes rt-courier-in  {from{opacity:0;transform:scale(.84) translateY(5px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes rt-slide-down  {from{opacity:0;max-height:0;transform:translateY(-4px)}to{opacity:1;max-height:600px;transform:translateY(0)}}

@keyframes ch-fadeup  {from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes ch-msg-in  {from{opacity:0;transform:translateY(8px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes ch-send-in {from{opacity:0;transform:translateX(10px)}to{opacity:1;transform:translateX(0)}}
@keyframes ch-pulse   {0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.72)}}
@keyframes ch-ring    {0%{transform:scale(1);opacity:.55}100%{transform:scale(2.8);opacity:0}}

.dl-noscroll::-webkit-scrollbar,.ne-scroll::-webkit-scrollbar,.rt-scroll::-webkit-scrollbar,.ch-scroll::-webkit-scrollbar{display:none}
.dl-noscroll,.ne-scroll,.rt-scroll,.ch-scroll{scrollbar-width:none;-ms-overflow-style:none}

.dl-tap,.ne-tap,.rt-tap,.ch-tap{transition:transform .11s ease,opacity .11s ease;cursor:pointer}
.dl-tap:active,.ne-tap:active,.rt-tap:active,.ch-tap:active{transform:scale(.965);opacity:.82}

.dl-cta-btn{transition:transform .16s ease,box-shadow .16s ease}
.dl-cta-btn:active{transform:scale(.965)}
.dl-progress-bar{animation:dl-progress-fill 1.4s cubic-bezier(.4,0,.2,1) .6s both}
.dl-ticker-track{animation:dl-ticker 24s linear infinite;white-space:nowrap}

.dl-s1{animation:dl-fadeup .48s ease .04s both}
.dl-s2{animation:dl-fadeup .48s ease .11s both}
.dl-s3{animation:dl-fadeup .48s ease .18s both}
.dl-s4{animation:dl-fadeup .48s ease .25s both}
.dl-s5{animation:dl-fadeup .48s ease .32s both}

.ne-field{transition:border-color .16s ease,background .16s ease,box-shadow .16s ease}
.ne-field:focus{outline:none;border-color:rgba(196,152,46,.48)!important;background:rgba(196,152,46,.04)!important;box-shadow:0 0 0 3px rgba(196,152,46,.07)}
.ne-field::placeholder{color:rgba(152,152,166,.4)}
.ne-s1{animation:ne-fadeup .4s ease .04s both}
.ne-s2{animation:ne-fadeup .4s ease .09s both}
.ne-s3{animation:ne-fadeup .4s ease .14s both}
.ne-s4{animation:ne-fadeup .4s ease .19s both}
.ne-s5{animation:ne-fadeup .4s ease .24s both}
.ne-s6{animation:ne-fadeup .4s ease .29s both}
.ne-summary {animation:ne-summary-in .32s cubic-bezier(.34,1.06,.64,1) both}
.ne-check-in{animation:ne-check-in .26s cubic-bezier(.34,1.2,.64,1) both}
.ne-btn-glow{animation:ne-glow 3s ease-in-out infinite}
.ne-shake{animation:ne-shake .33s ease}

.rt-s1{animation:rt-fadeup .42s ease .04s both}
.rt-s2{animation:rt-fadeup .42s ease .10s both}
.rt-s3{animation:rt-fadeup .42s ease .16s both}
.rt-s4{animation:rt-fadeup .42s ease .22s both}
.rt-s5{animation:rt-fadeup .42s ease .28s both}
.rt-s6{animation:rt-fadeup .42s ease .34s both}
.rt-status-card{animation:rt-status-glow 3s ease-in-out infinite}
.rt-courier-card{animation:rt-courier-in .36s cubic-bezier(.34,1.06,.64,1) .2s both}
.rt-details-open{animation:rt-slide-down .28s ease both;overflow:hidden}

.ch-s1{animation:ch-fadeup .4s ease .05s both}
.ch-s2{animation:ch-fadeup .4s ease .12s both}
.ch-s3{animation:ch-fadeup .4s ease .19s both}
.ch-field{transition:border-color .16s ease,background .16s ease}
.ch-field:focus{outline:none;border-color:rgba(196,152,46,.45)!important;background:rgba(196,152,46,.04)!important}
.ch-field::placeholder{color:rgba(152,152,166,.38)}
.ch-send-btn{transition:transform .14s ease,box-shadow .14s ease}
.ch-send-btn:active{transform:scale(.93)}

.screen-forward{animation:screen-slide-in  .26s cubic-bezier(.4,0,.2,1) both}
.screen-back   {animation:screen-slide-out .26s cubic-bezier(.4,0,.2,1) both}
`;

const DL_DARK = {
  bg:'#070709', bg1:'#0E0E11', bg2:'#131316', bg3:'#1A1A1E', bg4:'#212126',
  gold:'#E5A912', goldBright:'#FFC01E',
  goldDim:'rgba(196,152,46,0.07)', goldDim2:'rgba(196,152,46,0.13)',
  goldBorder:'rgba(196,152,46,0.22)', goldText:'#FFC01E',
  text1:'#F0F0F2', text2:'#9898A6', text3:'#50505C',
  border:'rgba(255,255,255,0.058)',
  green:'#2CB87A', greenDim:'rgba(44,184,122,0.08)', greenBdr:'rgba(44,184,122,0.22)',
  blue:'#4A90D9',  blueDim:'rgba(74,144,217,0.09)',  blueBdr:'rgba(74,144,217,0.22)',
  red:'#E05555',   redDim:'rgba(224,85,85,0.07)',     redBdr:'rgba(224,85,85,0.22)',
};
const DL_LIGHT = {
  bg:'#FFFFFF', bg1:'#FFFFFF', bg2:'#FFFFFF', bg3:'#F2F3F5', bg4:'#E4E6EB',
  gold:'#E5A912', goldBright:'#FFC01E',
  goldDim:'rgba(196,152,46,0.09)', goldDim2:'rgba(196,152,46,0.17)',
  goldBorder:'rgba(196,152,46,0.35)', goldText:'#965E00',
  text1:'#050505', text2:'#65676B', text3:'#8A8D91',
  border:'#E4E6EB',
  green:'#2CB87A', greenDim:'rgba(44,184,122,0.08)', greenBdr:'rgba(44,184,122,0.25)',
  blue:'#4A90D9',  blueDim:'rgba(74,144,217,0.09)',  blueBdr:'rgba(74,144,217,0.25)',
  red:'#E05555',   redDim:'rgba(224,85,85,0.08)',     redBdr:'rgba(224,85,85,0.25)',
};
const useC = () => { const { isDark } = useAt(); return isDark ? DL_DARK : DL_LIGHT; };
const C = DL_DARK; // alias de módulo — los componentes lo sobreescriben con useC()

/* ═══════════════════════════════════════════════════════════════════
   LÓGICA OPERATIVA — DELIVERY LOCAL
   Documentación interna para implementación en Blink
   ═══════════════════════════════════════════════════════════════════

   1. ESTADOS FINALES DE UN ENVÍO
   ──────────────────────────────
   delivered        → Entregado correctamente al destinatario.
   cancelled_client → Cancelado por el cliente en cualquier momento
                      antes de la entrega.
   cancelled_system → Cancelado automáticamente por el sistema
                      (timeout sin mensajero, falla operativa crítica,
                      sin cobertura disponible).
   failed           → Entrega intentada pero no completada.
                      Requiere motivo explícito (ver DL_FAILED_REASONS).

   2. REASIGNACIÓN DE MENSAJERO
   ─────────────────────────────
   Si el mensajero cancela ANTES de la recogida del artículo:
     → El envío NO se cancela ni finaliza.
     → El estado vuelve a "Buscando mensajero" (searching).
     → El sistema asigna un nuevo mensajero automáticamente.
     → Se registra en la bitácora del chat: "Mensajero reasignado".
   Si el mensajero cancela DESPUÉS de la recogida:
     → Evaluación operativa manual requerida.
     → Estado transitorio: "Problema operativo" hasta resolución.

   3. TRANSICIONES DE ESTADO
   ──────────────────────────
   created → searching → assigned → picked → in_route → delivered
                  ↑           ↓
              (reasign) ← (cancels before pickup)

   Estados finales: delivered | cancelled_client | cancelled_system | failed
   Desde cualquier estado activo → cancelación es posible.

   4. ARCHIVADO DE CONVERSACIÓN
   ──────────────────────────────
   La conversación se archiva automáticamente al alcanzar
   cualquier estado final: delivered | cancelled_* | failed.
   → Los mensajes permanecen visibles (solo lectura).
   → No se permiten nuevos mensajes tras el archivado.
   → La conversación se mantiene accesible desde el historial.

   5. BITÁCORA AUTOMÁTICA (mensajes de sistema en el chat)
   ────────────────────────────────────────────────────────
   Cada transición genera un mensaje tipo 'system' en la conversación:
     created          → "Solicitud creada"
     assigned         → "Mensajero asignado"
     reassigned       → "Mensajero reasignado · [nombre anterior] canceló"
     picked           → "Artículo recogido"
     delivered        → "Entrega completada"
     cancelled_client → "Envío cancelado por el cliente"
     cancelled_system → "Envío cancelado por el sistema · [motivo]"
     failed           → "Entrega no completada · [motivo]"

   6. HISTORIAL
   ─────────────
   Todos los estados finales aparecen en el historial con:
     - Indicador visual de color por tipo de estado.
     - Motivo visible cuando aplica (failed / cancelled_*).
     - Acceso a detalles completos, línea de progreso,
       conversación archivada e información del mensajero.

   7. RELACIÓN RASTREO ↔ CHAT ↔ HISTORIAL
   ─────────────────────────────────────────
   Rastrear → muestra estado en tiempo real + acceso al chat.
   Chat     → bitácora completa de la operación + mensajería.
   Historial → registro permanente con todos los datos asociados.
   ═══════════════════════════════════════════════════════════════ */

/* Config visual por estado final */
const DL_STATUS_CFG = {
  delivered:        { color:'#2CB87A', dim:'rgba(44,184,122,0.08)',  bdr:'rgba(44,184,122,0.22)',  label:'Entregado',           icon:'check'   },
  cancelled_client: { color:'#F59E0B', dim:'rgba(245,158,11,0.08)', bdr:'rgba(245,158,11,0.24)',  label:'Cancelado · cliente', icon:'x'       },
  cancelled_system: { color:'#E05555', dim:'rgba(224,85,85,0.07)',  bdr:'rgba(224,85,85,0.22)',   label:'Cancelado · sistema', icon:'x'       },
  failed:           { color:'#F97316', dim:'rgba(249,115,22,0.08)', bdr:'rgba(249,115,22,0.22)',  label:'No completada',       icon:'alert'   },
};

const DL_DL_FAILED_REASONS = [
  'Destinatario no responde',
  'Dirección incorrecta',
  'No fue posible localizar el destino',
  'Rechazada por destinatario',
  'Problema operativo',
  'Otro motivo',
];

const T = {
  display: { fontFamily:"'Syne',sans-serif",   fontWeight:800 },
  heading: { fontFamily:"'Syne',sans-serif",   fontWeight:700 },
  subhead: { fontFamily:"'Syne',sans-serif",   fontWeight:600 },
  body:    { fontFamily:"'Outfit',sans-serif", fontWeight:400 },
  medium:  { fontFamily:"'Outfit',sans-serif", fontWeight:500 },
  semibold:{ fontFamily:"'Outfit',sans-serif", fontWeight:600 },
};

/* ── ROOT ───────────────────────────────────────────────────────── */
export function LocalDelivery({ onBack, onNav, onChat }) {
  const { isDark } = useAt();
  const [screen, setScreen] = useState('home');
  // El chat del seguimiento abre el chat REAL conectado (conversations/messages),
  // no el chat local de demo. Si no hay uno específico, lleva a "Mensajes".
  const openConnectedChat = onChat || (() => onNav && onNav("perfil"));
  return (
    <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column', background: isDark ? DL_DARK.bg : DL_LIGHT.bg, fontFamily:"'Outfit',sans-serif", color: isDark ? DL_DARK.text1 : DL_LIGHT.text1 }}>
      <style>{DELIVERY_LOCAL_CSS}</style>
      {screen==='home'     && <DLHomeScreen      key="home"     onNew={()=>setScreen('nuevo')} onRastrear={()=>setScreen('rastrear')} onMenuBack={onBack} onNav={onNav}/>}
      {screen==='nuevo'    && <DLNuevoEnvioScreen key="nuevo"   onBack={()=>setScreen('home')}/>}
      {screen==='rastrear' && <DLRastrearScreen   key="rastrear" onBack={()=>setScreen('home')} onChat={openConnectedChat}/>}
    </div>
  );
}

/* ── NAV HEADER ─────────────────────────────────────────────────── */
function DLNavHeader({ title, showBack, onBack, onMenuBack }) {
  const C = useC();
  if (!showBack) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 18px', height:54, borderBottom:`1px solid ${C.border}` }}>
      <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
        <div style={{ ...T.display, fontSize:22, letterSpacing:'-0.03em', lineHeight:1, background:'linear-gradient(135deg,#FFC01E 0%,#E5A912 55%,#D99A0A 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>RETADOR</div>
        <div style={{ ...T.semibold, fontSize:8, color:C.text3, letterSpacing:'0.22em', textTransform:'uppercase', lineHeight:1 }}>SERVICIO DE ENTREGAS</div>
      </div>
      {onMenuBack && <button className="dl-tap" onClick={onMenuBack} style={{ background:'rgba(255,255,255,0.052)', border:`1px solid ${C.border}`, borderRadius:10, width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <svg width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M6 1L1 6l5 5" stroke={C.text1} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>}
    </div>
  );
  return (
    <div style={{ display:'flex', alignItems:'center', padding:'0 16px', height:48, borderBottom:`1px solid ${C.border}` }}>
      <button className="dl-tap" onClick={onBack} style={{ background:'rgba(255,255,255,0.052)', border:`1px solid ${C.border}`, borderRadius:10, width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <svg width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M6 1L1 6l5 5" stroke={C.text1} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      <div style={{ flex:1, textAlign:'center' }}><div style={{ ...T.heading, fontSize:14, color:C.text1, letterSpacing:'-0.012em' }}>{title}</div></div>
      <div style={{ width:32 }}/>
    </div>
  );
}

/* ── HOME ───────────────────────────────────────────────────────── */
function DLHomeScreen({ onNew, onRastrear, onMenuBack, onNav }) {
  const C = useC();
  const svcOn = (() => { try { const r = localStorage.getItem("retador_admincfg"); if (r) return JSON.parse(r).deliveryServiceActive !== false; } catch (e) {} return true; })();
  return (
    <div className="screen-back" style={{ height:'100%', display:'flex', flexDirection:'column' }}>
      <DLNavHeader showBack={false} onMenuBack={onMenuBack}/>
      <DLLiveTicker/>
      <div className="dl-noscroll" style={{ flex:1, overflowY:'auto' }}>
        <LiveSlot page="delivery_local" from={null} to="dl_hero" onNav={onNav} pad="10px 14px 0" />
        <div className="dl-s1"><DLHeroSection/></div>
        <LiveSlot page="delivery_local" from="dl_hero" to="dl_cta" onNav={onNav} pad="10px 14px 0" />
        <div className="dl-s2"><DLCTASection onNew={onNew}/></div>
        <LiveSlot page="delivery_local" from="dl_cta" to="dl_act" onNav={onNav} pad="10px 14px 0" />
        <div className="dl-s3"><DLActiveSection onRastrear={onRastrear}/></div>
        <LiveSlot page="delivery_local" from="dl_act" to="dl_stats" onNav={onNav} pad="10px 14px 0" />
        <div className="dl-s4"><DLStatsStrip/></div>
        <LiveSlot page="delivery_local" from="dl_stats" to="dl_hist" onNav={onNav} pad="10px 14px 0" />
        <div className="dl-s5"><DLHistorySection/></div>
        <LiveSlot page="delivery_local" from="dl_hist" to={null} onNav={onNav} pad="10px 14px 0" />
        <div style={{ height:40 }}/>
      </div>
    </div>
  );
}

function DLLiveTicker() {
  const C = useC();
  const items=['✦  Alex R. completó entrega en Vedado · hace 3 min','✦  Marco V. en ruta hacia Centro Habana · hace 7 min','✦  Nuevo envío asignado en Miramar · hace 11 min','✦  Laura M. completó entrega en Playa · hace 14 min','✦  Carlos B. disponible en La Habana Vieja · ahora'];
  const text = items.join('     ');
  return (
    <div style={{ height:27, overflow:'hidden', background:'rgba(196,152,46,0.038)', borderBottom:`1px solid rgba(196,152,46,0.08)`, display:'flex', alignItems:'center' }}>
      <div className="dl-ticker-track" style={{ display:'flex' }}>
        {[text,text].map((t,i)=><span key={i} style={{ ...T.medium, fontSize:9.5, color:'rgba(196,152,46,0.52)', letterSpacing:'0.02em', paddingRight:55 }}>{t}</span>)}
      </div>
    </div>
  );
}

function DLHeroSection() {
  const C = useC();
  const svcOn = (() => { try { const r = localStorage.getItem("retador_admincfg"); if (r) return JSON.parse(r).deliveryServiceActive !== false; } catch (e) {} return true; })();
  return (
    <div style={{ margin:'13px 14px 0', borderRadius:22, overflow:'hidden', position:'relative', minHeight:200 }}>
      <div style={{ position:'absolute', inset:0, background:'#0C0C10' }}/>
      <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%' }} viewBox="0 0 347 200" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="hg"><stop offset="0%" stopColor="#E5A912" stopOpacity=".13"/><stop offset="100%" stopColor="#E5A912" stopOpacity="0"/></radialGradient>
          <filter id="hf"><feGaussianBlur stdDeviation="1.8" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/></filter>
        </defs>
        {[44,88,132,176].map(y=><line key={y} x1="0" y1={y} x2="347" y2={y} stroke="white" strokeWidth={y===88?.6:.35} opacity={y===88?.065:.04}/>)}
        {[58,116,174,232,290].map(x=><line key={x} x1={x} y1="0" x2={x} y2="200" stroke="white" strokeWidth={x===174?.6:.35} opacity={x===174?.065:.04}/>)}
        <rect width="347" height="200" fill="url(#hg)"/>
        <path d="M 58 174 L 58 88 L 174 88 L 174 44 L 290 44" stroke="#E5A912" strokeWidth="1.5" fill="none" strokeDasharray="5,3.5" opacity=".52" filter="url(#hf)"/>
        {[[58,88],[174,88],[174,44]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="2.2" fill="#E5A912" opacity=".38"/>)}
        <circle cx="58"  cy="174" r="6.5" fill="#E5A912" opacity=".16"/><circle cx="58"  cy="174" r="4"   fill="#E5A912" opacity=".9"/><circle cx="58"  cy="174" r="1.8" fill="white" opacity=".9"/>
        <circle cx="135" cy="88"  r="7"   fill="#4A90D9" opacity=".11"/><circle cx="135" cy="88"  r="4.5" fill="#4A90D9" opacity=".85"/><circle cx="135" cy="88"  r="1.8" fill="white" opacity=".9"/>
        <circle cx="290" cy="44"  r="6.5" fill="#2CB87A" opacity=".16"/><circle cx="290" cy="44"  r="4"   fill="#2CB87A" opacity=".9"/><circle cx="290" cy="44"  r="1.8" fill="white" opacity=".9"/>
        <circle cx="232" cy="132" r="3.2" fill="#E5A912" opacity=".42"/>
        <circle cx="290" cy="132" r="3.2" fill="#E5A912" opacity=".32"/>
        <circle cx="116" cy="44"  r="3.2" fill="#E5A912" opacity=".38"/>
      </svg>
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:60, background:'linear-gradient(to bottom,transparent,rgba(12,12,16,0.94))' }}/>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:40, background:'linear-gradient(to bottom,rgba(12,12,16,0.48),transparent)' }}/>
      <div style={{ position:'relative', zIndex:2, padding:'15px 17px 18px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
          <div style={{ ...T.medium, fontSize:9, color:'rgba(196,152,46,0.48)', letterSpacing:'0.15em', textTransform:'uppercase' }}>RETADOR · MENSAJERÍA URBANA</div>
          <div style={{ display:'flex', alignItems:'center', gap:5.5, background:C.greenDim, border:`1px solid ${C.greenBdr}`, borderRadius:20, padding:'4px 10px 4px 7px' }}>
            <div style={{ position:'relative', width:7, height:7, flexShrink:0 }}>
              <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:svcOn?C.green:'#ef4444', animation:svcOn?'dl-ring 2.2s ease-out infinite':'none' }}/>
              <div style={{ position:'relative', width:7, height:7, borderRadius:'50%', background:svcOn?C.green:'#ef4444', animation:svcOn?'dl-pulse 2.2s ease-in-out infinite':'none' }}/>
            </div>
            <span style={{ ...T.semibold, fontSize:9.5, color:svcOn?C.green:'#ef4444', letterSpacing:'0.07em' }}>{svcOn?'OPERATIVO':'NO OPERATIVO'}</span>
          </div>
        </div>
        <div style={{ marginBottom:16 }}>
          <div style={{ ...T.display, fontSize:27, color:'rgba(240,240,242,0.95)', letterSpacing:'-0.026em', lineHeight:1.06, marginBottom:6 }}>Servicio<br/><span style={{ color:svcOn?C.goldBright:'#ef4444' }}>{svcOn?'Activo':'Inactivo'}</span></div>
          <div style={{ ...T.body, fontSize:11, color:'rgba(240,240,242,0.55)' }}>Mensajería urbana profesional · Ciudad de México</div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6 }}>
          {[{v:'8',l:'Mensajeros',g:false},{v:"22'",l:'Respuesta',g:true},{v:'12km',l:'Cobertura',g:false},{v:'98%',l:'Éxito',g:false}].map(({v,l,g})=>(
            <div key={l} style={{ background:g?C.goldDim:'rgba(255,255,255,0.06)', border:`1px solid ${g?C.goldBorder:'rgba(255,255,255,0.09)'}`, borderRadius:11, padding:'8px 5px', textAlign:'center' }}>
              <div style={{ ...T.heading, fontSize:14, letterSpacing:'-0.015em', lineHeight:1, color:g?C.goldBright:'rgba(240,240,242,0.92)', marginBottom:3.5 }}>{v}</div>
              <div style={{ ...T.body, fontSize:8, color:'rgba(240,240,242,0.48)', letterSpacing:'0.03em', textTransform:'uppercase' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DLCTASection({ onNew }) {
  const C = useC();
  return (
    <div style={{ padding:'11px 14px 0' }}>
      <button onClick={onNew} className="dl-cta-btn dl-tap" style={{ width:'100%', border:'none', borderRadius:18, padding:'13px 15px', background:'linear-gradient(135deg,#E5A912 0%,#FFC01E 50%,#E5A912 100%)', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', boxShadow:'0 7px 24px rgba(196,152,46,0.25),0 2px 7px rgba(196,152,46,0.13)', animation:'dl-glow-pulse 3.5s ease-in-out infinite' }}>
        <div style={{ display:'flex', alignItems:'center', gap:11 }}>
          <div style={{ width:36, height:36, background:'rgba(0,0,0,0.17)', borderRadius:11, border:'1px solid rgba(0,0,0,0.11)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 2.5v10M2.5 7.5h10" stroke="#060608" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
          <div style={{ textAlign:'left' }}>
            <div style={{ ...T.heading, fontSize:14, color:'#060608', letterSpacing:'-0.012em', marginBottom:1.5 }}>Crear Nuevo Envío</div>
            <div style={{ ...T.body, fontSize:10.5, color:'rgba(6,6,8,0.48)' }}>Asignación inmediata · Sin esperas</div>
          </div>
        </div>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M6.5 4.5l5 4.5-5 4.5" stroke="#060608" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
    </div>
  );
}

function DLActiveSection({ onRastrear }) {
  const C = useC();
  return (
    <div style={{ padding:'19px 14px 0' }}>
      <DLSectionTitle title="En Curso" badge="1 activo" badgeColor={C.green} badgeBg={C.greenDim} badgeBdr={C.greenBdr}/>
      <div style={{ background:C.bg1, border:`1px solid ${C.border}`, borderRadius:20, overflow:'hidden' }}>
        <div style={{ height:2.5, background:'rgba(255,255,255,0.04)' }}>
          <div className="dl-progress-bar" style={{ height:'100%', width:'62%', background:'linear-gradient(90deg,#E5A912,#FFC01E)', borderRadius:2 }}/>
        </div>
        <div style={{ padding:'14px 15px 15px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:5.5, marginBottom:3.5 }}>
                <div style={{ width:6.5, height:6.5, borderRadius:'50%', background:C.green, animation:'dl-pulse 1.9s ease-in-out infinite' }}/>
                <span style={{ ...T.semibold, fontSize:9.5, color:C.green, letterSpacing:'0.07em' }}>EN CAMINO</span>
              </div>
              <div style={{ ...T.subhead, fontSize:12.5, color:C.text1, letterSpacing:'-0.01em' }}>Envío #DL-2847</div>
            </div>
            <div style={{ background:C.goldDim, border:`1px solid ${C.goldBorder}`, borderRadius:11, padding:'6px 11px', textAlign:'center' }}>
              <div style={{ ...T.heading, fontSize:19, color:C.goldText, lineHeight:1, letterSpacing:'-0.02em' }}>18<span style={{ fontSize:11, fontWeight:600 }}>'</span></div>
              <div style={{ ...T.body, fontSize:8, color:'rgba(212,168,74,0.5)', marginTop:1.5, letterSpacing:'0.06em', textTransform:'uppercase' }}>ETA</div>
            </div>
          </div>
          <div style={{ marginBottom:12 }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0, paddingTop:3.5 }}>
                <div style={{ width:7.5, height:7.5, borderRadius:'50%', background:C.gold, border:'1.5px solid rgba(196,152,46,0.32)' }}/>
                <div style={{ width:1, height:20, background:'linear-gradient(180deg,rgba(196,152,46,0.28),rgba(255,255,255,0.05))' }}/>
              </div>
              <div style={{ paddingBottom:10 }}>
                <div style={{ ...T.body, fontSize:9.5, color:C.text3, marginBottom:1.5, letterSpacing:'0.03em' }}>ORIGEN</div>
                <div style={{ ...T.medium, fontSize:12.5, color:C.text1 }}>Edificio FOCSA</div>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
              <div style={{ flexShrink:0, paddingTop:3.5 }}><div style={{ width:7.5, height:7.5, borderRadius:2.2, background:C.green, border:'1.5px solid rgba(44,184,122,0.32)' }}/></div>
              <div>
                <div style={{ ...T.body, fontSize:9.5, color:C.text3, marginBottom:1.5, letterSpacing:'0.03em' }}>DESTINO</div>
                <div style={{ ...T.medium, fontSize:12.5, color:C.text1 }}>Calle 23, El Vedado</div>
              </div>
            </div>
          </div>
          <div style={{ height:1, background:C.border, marginBottom:11 }}/>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:31, height:31, borderRadius:9, background:C.blueDim, border:`1px solid ${C.blueBdr}`, display:'flex', alignItems:'center', justifyContent:'center', ...T.heading, fontSize:13, color:C.blue }}>A</div>
              <div>
                <div style={{ ...T.medium, fontSize:12, color:C.text1, marginBottom:1.5 }}>Alex Ramírez</div>
                <div style={{ display:'flex', alignItems:'center', gap:3 }}>
                  <svg width="10" height="10" viewBox="0 0 10 10"><path d="M5 1l1.2 2.5L9 3.8l-2.1 2 .5 2.8L5 7.3 2.6 8.6l.5-2.8L1 3.8l2.8-.3z" fill="#E5A912"/></svg>
                  <span style={{ ...T.semibold, fontSize:11, color:C.text2 }}>4.9</span>
                  <span style={{ ...T.body, fontSize:10.5, color:C.text3 }}> · 847 entregas</span>
                </div>
              </div>
            </div>
            <button className="dl-tap" onClick={onRastrear} style={{ height:31, borderRadius:9, padding:'0 11px', background:'rgba(255,255,255,0.06)', border:`1px solid ${C.border}`, ...T.medium, fontSize:11.5, color:C.text1, cursor:'pointer' }}>Rastrear</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DLStatsStrip() {
  const C = useC();
  return (
    <div style={{ padding:'17px 14px 0' }}>
      <DLSectionTitle title="Rendimiento"/>
      <div style={{ display:'flex', gap:7 }}>
        {[{icon:<DLLightningIcon/>,v:'22 min',l:'Entrega promedio',s:'Últimas 72h',g:true},{icon:<DLShieldIcon/>,v:'98.4%',l:'Tasa de éxito',s:'Este mes',g:false},{icon:<DLBoxIcon/>,v:'1,240',l:'Entregas totales',s:'Historial',g:false}].map(({icon,v,l,s,g})=>(
          <div key={l} style={{ flex:1, background:g?'rgba(196,152,46,0.065)':C.bg1, border:`1px solid ${g?C.goldBorder:C.border}`, borderRadius:17, padding:'13px 11px' }}>
            <div style={{ marginBottom:8, color:g?C.goldText:C.text2 }}>{icon}</div>
            <div style={{ ...T.heading, fontSize:17, letterSpacing:'-0.022em', lineHeight:1, color:g?C.goldText:C.text1, marginBottom:3.5 }}>{v}</div>
            <div style={{ ...T.medium, fontSize:10, color:C.text2, lineHeight:1.3, marginBottom:2.5 }}>{l}</div>
            <div style={{ ...T.body, fontSize:9, color:C.text3 }}>{s}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DLHistorySection() {
  const C = useC();
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('all'); // all | delivered | cancelled | failed
  const PER = 8;

  const real=[
    {id:'DL-2841',from:'Vedado',       to:'Centro Habana', date:'Ayer · 14:30',   price:'$350', status:'delivered'},
    {id:'DL-2830',from:'Miramar',      to:'Playa',         date:'Hace 2 días',    price:'$500', status:'delivered'},
    {id:'DL-2801',from:'La Habana Vieja',to:'Cerro',       date:'Hace 5 días',    price:'—',    status:'cancelled_client', reason:'Cancelado por el cliente'},
    {id:'DL-2788',from:'Marianao',     to:'Diez de Octubre',date:'Hace 1 semana',  price:'—',    status:'failed',           reason:'Destinatario no responde'},
    {id:'DL-2750',from:'Boyeros',      to:'Regla',         date:'Hace 9 días',    price:'—',    status:'cancelled_system', reason:'Sin mensajeros disponibles'},
  ];

  const full = Array.from({length:20},(_,i) =>
    i < real.length ? real[i]
    : { id:`DL-${2700-i*8}`, from:'—', to:'—', date:`Hace ${Math.floor(i*1.5)+10} días`, price:'—', status:'delivered', empty:true }
  );

  const filtered = filter==='all' ? full
    : filter==='delivered'  ? full.filter(e=>e.status==='delivered')
    : filter==='cancelled'  ? full.filter(e=>e.status?.startsWith('cancelled'))
    : full.filter(e=>e.status==='failed');

  const totalPages = Math.ceil(filtered.length/PER);
  const pageItems  = filtered.slice((page-1)*PER, page*PER);

  const FILTERS = [
    {k:'all',      l:'Todos'},
    {k:'delivered',l:'Entregados'},
    {k:'cancelled',l:'Cancelados'},
    {k:'failed',   l:'No completados'},
  ];

  if (!expanded) return (
    <div style={{ padding:'17px 14px 0' }}>
      <DLSectionTitle title="Historial" linkLabel="Ver todo" onLink={()=>setExpanded(true)}/>
      <div style={{ background:C.bg1, border:`1px solid ${C.border}`, borderRadius:20, overflow:'hidden' }}>
        {real.slice(0,3).map((e,i)=><div key={e.id}><DLHistoryRow e={e}/>{i<2&&<div style={{ height:1, background:C.border, margin:'0 13px' }}/>}</div>)}
        <div style={{ height:1, background:C.border }}/>
        <button className="dl-tap" onClick={()=>setExpanded(true)} style={{ width:'100%', border:'none', background:'transparent', cursor:'pointer', padding:'11px 13px', display:'flex', alignItems:'center', justifyContent:'center', gap:5, ...T.medium, fontSize:12.5, color:C.goldText }}>
          Ver historial completo
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M6.5 2.5l3.5 3.5-3.5 3.5" stroke={C.goldText} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ padding:'17px 14px 0' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ ...T.heading, fontSize:14.5, color:C.text1, letterSpacing:'-0.012em' }}>Historial</span>
          <span style={{ background:'rgba(255,255,255,0.06)', border:`1px solid ${C.border}`, borderRadius:20, padding:'2px 8px', ...T.semibold, fontSize:9.5, color:C.text2 }}>{filtered.length} envíos</span>
        </div>
        <button className="dl-tap" onClick={()=>{setExpanded(false);setPage(1);setFilter('all');}} style={{ background:'none', border:'none', cursor:'pointer', ...T.medium, fontSize:12, color:C.text3, fontFamily:"'Outfit',sans-serif" }}>Cerrar</button>
      </div>

      {/* Filter pills */}
      <div style={{ display:'flex', gap:6, marginBottom:12, overflowX:'auto', paddingBottom:2 }}>
        {FILTERS.map(({k,l})=>(
          <button key={k} className="dl-tap" onClick={()=>{setFilter(k);setPage(1);}} style={{ background:filter===k?C.goldDim2:'rgba(255,255,255,0.04)', border:`1px solid ${filter===k?C.goldBorder:C.border}`, borderRadius:20, padding:'4px 11px', cursor:'pointer', ...T.medium, fontSize:11, color:filter===k?C.goldText:C.text2, flexShrink:0, transition:'all .14s ease', whiteSpace:'nowrap' }}>{l}</button>
        ))}
      </div>

      <div style={{ background:C.bg1, border:`1px solid ${C.border}`, borderRadius:20, overflow:'hidden' }}>
        {pageItems.length===0
          ? <div style={{ padding:'24px 16px', textAlign:'center', ...T.body, fontSize:12, color:C.text3 }}>Sin envíos en esta categoría</div>
          : pageItems.map((e,i)=><div key={e.id}><DLHistoryRow e={e}/>{i<pageItems.length-1&&<div style={{ height:1, background:C.border, margin:'0 13px' }}/>}</div>)
        }
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:12 }}>
          <button className="dl-tap" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} style={{ width:32, height:32, borderRadius:10, background:page===1?'transparent':C.bg2, border:`1px solid ${page===1?'transparent':C.border}`, display:'flex', alignItems:'center', justifyContent:'center', opacity:page===1?.3:1 }}>
            <svg width="7" height="11" viewBox="0 0 7 11" fill="none"><path d="M5.5 1.5L1.5 5.5l4 4" stroke={C.text2} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          {Array.from({length:totalPages},(_,i)=>i+1).map(n=>(
            <button key={n} className="dl-tap" onClick={()=>setPage(n)} style={{ width:32, height:32, borderRadius:10, background:n===page?C.goldDim2:'transparent', border:`1px solid ${n===page?C.goldBorder:'transparent'}`, ...T.semibold, fontSize:12, color:n===page?C.goldText:C.text3 }}>{n}</button>
          ))}
          <button className="dl-tap" onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} style={{ width:32, height:32, borderRadius:10, background:page===totalPages?'transparent':C.bg2, border:`1px solid ${page===totalPages?'transparent':C.border}`, display:'flex', alignItems:'center', justifyContent:'center', opacity:page===totalPages?.3:1 }}>
            <svg width="7" height="11" viewBox="0 0 7 11" fill="none"><path d="M1.5 1.5l4 4-4 4" stroke={C.text2} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      )}
    </div>
  );
}

function DLHistoryRow({ e }) {
  const C = useC();
  /* skeleton row for padded entries */
  if (e.empty) return (
    <div style={{ display:'flex', alignItems:'center', padding:'11px 13px', gap:11 }}>
      <div style={{ width:34, height:34, borderRadius:11, background:'rgba(255,255,255,0.03)', border:`1px solid ${C.border}`, flexShrink:0 }}/>
      <div style={{ flex:1 }}>
        <div style={{ width:120, height:9, background:'rgba(255,255,255,0.05)', borderRadius:4, marginBottom:6 }}/>
        <div style={{ width:80, height:8, background:'rgba(255,255,255,0.03)', borderRadius:4 }}/>
      </div>
      <div style={{ width:28, height:9, background:'rgba(255,255,255,0.04)', borderRadius:4 }}/>
    </div>
  );

  const cfg = DL_STATUS_CFG[e.status] || DL_STATUS_CFG.delivered;

  const Icon = () => {
    if (cfg.icon==='check') return <svg width="12" height="11" viewBox="0 0 12 11" fill="none"><path d="M2 5.5l3 3 5-6" stroke={cfg.color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>;
    if (cfg.icon==='alert') return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1.5L1 10.5h10L6 1.5z" stroke={cfg.color} strokeWidth="1.4" strokeLinejoin="round"/><path d="M6 5v3M6 9.2v.3" stroke={cfg.color} strokeWidth="1.3" strokeLinecap="round"/></svg>;
    return <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2.5 2.5l6 6M8.5 2.5l-6 6" stroke={cfg.color} strokeWidth="1.6" strokeLinecap="round"/></svg>;
  };

  return (
    <div className="dl-tap" style={{ display:'flex', alignItems:'center', padding:'11px 13px', gap:11 }}>
      <div style={{ width:34, height:34, borderRadius:11, flexShrink:0, background:cfg.dim, border:`1px solid ${cfg.bdr}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Icon/>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2.5 }}>
          <div style={{ ...T.medium, fontSize:12, color:C.text1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:162 }}>{e.from} → {e.to}</div>
          <div style={{ ...T.heading, fontSize:12.5, color:C.text1, flexShrink:0, marginLeft:7 }}>{e.price}</div>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ ...T.body, fontSize:10.5, color:C.text3 }}>{e.id} · {e.date}</div>
          <div style={{ ...T.semibold, fontSize:10, color:cfg.color }}>{cfg.label}</div>
        </div>
        {e.reason && (
          <div style={{ ...T.body, fontSize:10, color:C.text3, marginTop:3, display:'flex', alignItems:'center', gap:4 }}>
            <div style={{ width:3, height:3, borderRadius:'50%', background:cfg.color, opacity:.6, flexShrink:0 }}/>
            {e.reason}
          </div>
        )}
      </div>
      <svg width="5.5" height="10" viewBox="0 0 6 10" fill="none" style={{ flexShrink:0 }}><path d="M1 1.5l3.5 3.5L1 8.5" stroke={C.text3} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </div>
  );
}

/* ── NUEVO ENVÍO ─────────────────────────────────────────────────── */
function DLNuevoEnvioScreen({ onBack }) {
  const C = useC();
  const [form,setForm]=useState({pickAddr:'',pickRef:'',pickName:'',pickPhone:'',dropAddr:'',dropRef:'',dropName:'',dropPhone:'',article:''});
  const [touched,setTouched]=useState({});
  const [submitted,setSubmitted]=useState(false);
  const [shakeTrg,setShakeTrg]=useState(false);
  const btnRef=useRef(null);
  const req=['pickAddr','pickPhone','dropAddr','dropPhone','article'];
  const isValid=req.every(k=>form[k].trim().length>0);
  const missing=req.filter(k=>!form[k].trim()).length;
  const upd=(k,v)=>setForm(p=>({...p,[k]:v}));
  const blr=(k)=>setTouched(p=>({...p,[k]:true}));
  const err=(k)=>touched[k]&&!form[k].trim();
  const hasBoth=form.pickAddr.trim()&&form.dropAddr.trim();
  const localRate=(()=>{ try{ const r=localStorage.getItem('retador_admincfg'); if(r){ const c=JSON.parse(r); return { base:c.localBase??150, perKm:c.localPerKm??25 }; } }catch{} return { base:150, perKm:25 }; })();
  const distKm=4.2; // distancia de ejemplo (sin GPS aún)
  const localPrice=Math.round(localRate.base+localRate.perKm*distKm);
  const summary=hasBoth?{dist:distKm+' km',time:'22 min',price:'$'+localPrice.toLocaleString()+' CUP'}:null;
  const submit=()=>{if(!isValid){const t={};req.forEach(k=>t[k]=true);setTouched(t);setShakeTrg(p=>!p);return;}setSubmitted(true);};

  return (
    <div className="screen-forward" style={{ height:'100%', display:'flex', flexDirection:'column' }}>
      <DLNavHeader title="Delivery Local" showBack onBack={onBack}/>
      <div className="ne-scroll" style={{ flex:1, overflowY:'auto', paddingBottom:28 }}>
        <div className="ne-s1" style={{ padding:'14px 18px 0' }}>
          <div style={{ ...T.heading, fontSize:20, color:C.text1, letterSpacing:'-0.024em', lineHeight:1.1, marginBottom:5 }}>Nuevo envío</div>
          <div style={{ ...T.body, fontSize:11.5, color:'rgba(152,152,166,0.65)', lineHeight:1.55 }}>Solicita un mensajero para recoger y entregar un artículo dentro de tu ciudad.</div>
        </div>
        <div className="ne-s2" style={{ padding:'11px 18px 0' }}><DLAvailabilityStrip/></div>
        <div className="ne-s3" style={{ padding:'11px 18px 0' }}>
          <DLSectionCard icon={<DLOriginDot/>} label="Recoger en" accentKey="gold">
            <DLFieldAddress placeholder="Dirección de recogida" value={form.pickAddr} onChange={v=>upd('pickAddr',v)} onBlur={()=>blr('pickAddr')} error={err('pickAddr')}/>
            <DLFieldRef hint="Casa verde frente al parque" value={form.pickRef} onChange={v=>upd('pickRef',v)}/>
            <div style={{ display:'flex', gap:7, marginTop:7 }}>
              <div style={{ flex:1 }}><DLFieldSmall placeholder="Nombre (opcional)" value={form.pickName} onChange={v=>upd('pickName',v)}/></div>
              <div style={{ flex:1 }}><DLFieldSmall placeholder="Teléfono *" type="tel" value={form.pickPhone} onChange={v=>upd('pickPhone',v)} onBlur={()=>blr('pickPhone')} error={err('pickPhone')}/></div>
            </div>
          </DLSectionCard>
        </div>
        <DLRouteConnector/>
        <div style={{ padding:'0 18px 0' }}>
          <DLSectionCard icon={<DLDestDot/>} label="Entregar en" accentKey="green">
            <DLFieldAddress placeholder="Dirección de entrega" value={form.dropAddr} onChange={v=>upd('dropAddr',v)} onBlur={()=>blr('dropAddr')} error={err('dropAddr')}/>
            <DLFieldRef hint="Edificio amarillo junto a la farmacia" value={form.dropRef} onChange={v=>upd('dropRef',v)}/>
            <div style={{ display:'flex', gap:7, marginTop:7 }}>
              <div style={{ flex:1 }}><DLFieldSmall placeholder="Nombre (opcional)" value={form.dropName} onChange={v=>upd('dropName',v)}/></div>
              <div style={{ flex:1 }}><DLFieldSmall placeholder="Teléfono *" type="tel" value={form.dropPhone} onChange={v=>upd('dropPhone',v)} onBlur={()=>blr('dropPhone')} error={err('dropPhone')}/></div>
            </div>
          </DLSectionCard>
        </div>
        <div className="ne-s4" style={{ padding:'10px 18px 0' }}>
          <DLSectionCard icon={<DLPkgIcon/>} label="¿Qué envías?" accentKey="blue">
            <DLArticleField value={form.article} onChange={v=>upd('article',v)} onBlur={()=>blr('article')} error={err('article')}/>
          </DLSectionCard>
        </div>
        {summary&&<div className="ne-s5 ne-summary" style={{ padding:'10px 18px 0' }}><DLSummaryCard summary={summary}/></div>}
        <div className="ne-s5" style={{ padding:'11px 18px 0' }}><DLValidationStatus isValid={isValid} missing={missing}/></div>
        <div className="ne-s6" style={{ padding:'9px 18px 0' }}><DLCTAButton enabled={isValid} submitted={submitted} onClick={submit} shakeTrg={shakeTrg} btnRef={btnRef}/></div>
      </div>
    </div>
  );
}

function DLAvailabilityStrip() {
  const C = useC();
  return (
    <div style={{ display:'flex', gap:7 }}>
      <div style={{ flex:1, display:'flex', alignItems:'center', gap:8, background:C.bg2, border:`1px solid ${C.border}`, borderRadius:13, padding:'9px 11px' }}>
        <div style={{ position:'relative', width:8, height:8, flexShrink:0 }}>
          <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:C.green, animation:'ne-ring 2.4s ease-out infinite' }}/>
          <div style={{ position:'relative', width:8, height:8, borderRadius:'50%', background:C.green, animation:'ne-pulse 2.2s ease-in-out infinite' }}/>
        </div>
        <div>
          <div style={{ ...T.heading, fontSize:15, color:C.text1, lineHeight:1, letterSpacing:'-0.015em' }}>8</div>
          <div style={{ ...T.body, fontSize:8.5, color:C.text3, marginTop:1.5, letterSpacing:'0.03em', textTransform:'uppercase' }}>Disponibles</div>
        </div>
      </div>
      <div style={{ flex:1, display:'flex', alignItems:'center', gap:8, background:C.goldDim, border:`1px solid ${C.goldBorder}`, borderRadius:13, padding:'9px 11px' }}>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink:0 }}><circle cx="6.5" cy="6.5" r="5" stroke={C.goldText} strokeWidth="1.2"/><path d="M6.5 4v2.5l1.7 1.7" stroke={C.goldText} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        <div>
          <div style={{ ...T.heading, fontSize:15, color:C.goldText, lineHeight:1, letterSpacing:'-0.015em' }}>~22<span style={{ fontSize:10.5, fontWeight:600 }}>'</span></div>
          <div style={{ ...T.body, fontSize:8.5, color:'rgba(196,152,46,0.46)', marginTop:1.5, letterSpacing:'0.03em', textTransform:'uppercase' }}>Respuesta</div>
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', background:C.greenDim, border:`1px solid ${C.greenBdr}`, borderRadius:13, padding:'9px 11px' }}>
        <div>
          <div style={{ ...T.semibold, fontSize:8.5, color:C.green, letterSpacing:'0.07em', textTransform:'uppercase', lineHeight:1.4 }}>SERVICIO</div>
          <div style={{ ...T.semibold, fontSize:8.5, color:C.green, letterSpacing:'0.07em', textTransform:'uppercase', lineHeight:1.4 }}>ACTIVO</div>
        </div>
      </div>
    </div>
  );
}

function DLSectionCard({ icon, label, accentKey, children }) {
  const C = useC();
  const a={gold:{bg:C.goldDim,border:C.goldBorder},green:{bg:C.greenDim,border:C.greenBdr},blue:{bg:C.blueDim,border:C.blueBdr}}[accentKey]||{bg:C.goldDim,border:C.goldBorder};
  return (
    <div style={{ background:C.bg1, border:`1px solid ${C.border}`, borderRadius:18, overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 13px 9px', borderBottom:`1px solid ${C.border}`, background:`linear-gradient(90deg,${a.bg} 0%,transparent 80%)` }}>
        {icon}<span style={{ ...T.subhead, fontSize:11.5, color:C.text1 }}>{label}</span>
      </div>
      <div style={{ padding:'11px 12px 12px', display:'flex', flexDirection:'column' }}>{children}</div>
    </div>
  );
}

function DLFieldAddress({ placeholder, value, onChange, onBlur, error }) {
  const C = useC();
  return (
    <div>
      <div style={{ position:'relative' }}>
        <div style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1A2.7 2.7 0 002.8 3.7c0 2.3 2.7 6.8 2.7 6.8S8.2 6 8.2 3.7A2.7 2.7 0 005.5 1z" stroke={error?C.red:'rgba(152,152,166,0.38)'} strokeWidth="1.1"/><circle cx="5.5" cy="3.7" r="1" fill={error?C.red:'rgba(152,152,166,0.38)'}/></svg>
        </div>
        <input className="ne-field" type="text" placeholder={placeholder} value={value} onChange={e=>onChange(e.target.value)} onBlur={onBlur} style={{ width:'100%', height:36, background:error?C.redDim:'rgba(255,255,255,0.034)', border:`1px solid ${error?C.redBdr:C.border}`, borderRadius:11, paddingLeft:27, paddingRight:10, ...T.medium, fontSize:12, color:C.text1 }}/>
      </div>
      {error&&<div style={{ ...T.body, fontSize:9.5, color:C.red, marginTop:3.5, paddingLeft:3.5, animation:'ne-slide-down .2s ease both' }}>Este campo es requerido</div>}
    </div>
  );
}

function DLFieldRef({ hint, value, onChange }) {
  const C = useC();
  const max=150;
  return (
    <div style={{ position:'relative', marginTop:5.5 }}>
      <input className="ne-field" type="text" placeholder={`Punto de referencia · ${hint}`} value={value} onChange={e=>{if(e.target.value.length<=max)onChange(e.target.value);}} style={{ width:'100%', height:34, background:'rgba(255,255,255,0.024)', border:`1px solid ${C.border}`, borderRadius:10, paddingLeft:10, paddingRight:value.length>0?33:10, ...T.body, fontSize:11.5, color:'rgba(240,240,242,0.7)' }}/>
      {value.length>0&&<div style={{ position:'absolute', right:9, top:'50%', transform:'translateY(-50%)', ...T.body, fontSize:8.5, color:C.text3 }}>{max-value.length}</div>}
    </div>
  );
}

function DLFieldSmall({ placeholder, value, onChange, onBlur, type='text', error }) {
  const C = useC();
  return (
    <div>
      <input className="ne-field" type={type} placeholder={placeholder} value={value} onChange={e=>onChange(e.target.value)} onBlur={onBlur} style={{ width:'100%', height:34, background:error?C.redDim:'rgba(255,255,255,0.034)', border:`1px solid ${error?C.redBdr:C.border}`, borderRadius:10, padding:'0 10px', ...T.medium, fontSize:11.5, color:C.text1 }}/>
      {error&&<div style={{ ...T.body, fontSize:9.5, color:C.red, marginTop:3, paddingLeft:3, animation:'ne-slide-down .2s ease both' }}>Requerido</div>}
    </div>
  );
}

function DLArticleField({ value, onChange, onBlur, error }) {
  const C = useC();
  const max=150;
  const hints=['Medicamentos para mi madre','Documentos para una oficina','Regalo de cumpleaños'];
  return (
    <div>
      <div style={{ position:'relative' }}>
        <input className="ne-field" type="text" placeholder={hints[0]} value={value} onChange={e=>{if(e.target.value.length<=max)onChange(e.target.value);}} onBlur={onBlur} style={{ width:'100%', height:36, background:error?C.redDim:'rgba(255,255,255,0.034)', border:`1px solid ${error?C.redBdr:C.border}`, borderRadius:11, padding:'0 36px 0 10px', ...T.medium, fontSize:12, color:C.text1 }}/>
        <div style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', ...T.body, fontSize:9, color:C.text3 }}>{max-value.length}</div>
      </div>
      {error&&<div style={{ ...T.body, fontSize:9.5, color:C.red, marginTop:3.5, paddingLeft:3.5, animation:'ne-slide-down .2s ease both' }}>Describe brevemente qué envías</div>}
      <div style={{ display:'flex', gap:5, marginTop:7, flexWrap:'wrap' }}>
        {hints.map(h=><button key={h} className="ne-tap" onClick={()=>onChange(h)} style={{ background:value===h?C.goldDim2:'rgba(255,255,255,0.036)', border:`1px solid ${value===h?C.goldBorder:C.border}`, borderRadius:20, padding:'3.5px 9px', cursor:'pointer', ...T.body, fontSize:10.5, color:value===h?C.goldText:C.text3, transition:'all .14s ease' }}>{h}</button>)}
      </div>
    </div>
  );
}

function DLRouteConnector() {
  const C = useC();
  return (
    <div style={{ display:'flex', alignItems:'center', padding:'0 28px', height:22 }}>
      <div style={{ width:1, height:22, background:'linear-gradient(180deg,rgba(196,152,46,0.3),rgba(44,184,122,0.3))', marginLeft:5 }}/>
      <div style={{ ...T.body, fontSize:9.5, color:C.text3, letterSpacing:'0.1em', textTransform:'uppercase', marginLeft:14 }}>ruta de entrega</div>
    </div>
  );
}

function DLSummaryCard({ summary }) {
  const C = useC();
  return (
    <div style={{ background:C.goldDim, border:`1px solid ${C.goldBorder}`, borderRadius:18, overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 13px 9px', borderBottom:`1px solid rgba(196,152,46,0.10)` }}>
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1 5.5h9M5.5 1l4.5 4.5-4.5 4.5" stroke={C.goldText} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        <span style={{ ...T.subhead, fontSize:11.5, color:C.goldText }}>Resumen del servicio</span>
        <div style={{ marginLeft:'auto', ...T.body, fontSize:9.5, color:'rgba(196,152,46,0.4)', letterSpacing:'0.06em', textTransform:'uppercase' }}>Estimado</div>
      </div>
      <div style={{ display:'flex', padding:'12px 13px' }}>
        {[{v:summary.dist,l:'Distancia',m:false},{v:summary.time,l:'Tiempo',m:false},{v:summary.price,l:'Precio',m:true}].map(({v,l,m},i,a)=>(
          <div key={l} style={{ flex:1, textAlign:'center', borderRight:i<a.length-1?'1px solid rgba(196,152,46,0.10)':'none' }}>
            <div style={{ ...T.heading, fontSize:m?18:15, color:m?C.goldText:C.text1, letterSpacing:'-0.02em', lineHeight:1, marginBottom:4 }}>{v}</div>
            <div style={{ ...T.body, fontSize:8.5, color:'rgba(196,152,46,0.42)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DLValidationStatus({ isValid, missing }) {
  const C = useC();
  if (isValid) return (
    <div className="ne-check-in" style={{ display:'flex', alignItems:'center', gap:9, background:C.greenDim, border:`1px solid ${C.greenBdr}`, borderRadius:13, padding:'9px 12px' }}>
      <div style={{ width:20, height:20, borderRadius:6.5, background:C.green, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1.5 4l2.5 2.5 4.5-5.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <div>
        <div style={{ ...T.semibold, fontSize:11.5, color:C.green, lineHeight:1.25 }}>Envío listo para solicitar</div>
        <div style={{ ...T.body, fontSize:10, color:'rgba(44,184,122,0.5)', marginTop:1 }}>Todos los datos completados</div>
      </div>
    </div>
  );
  return (
    <div style={{ display:'flex', alignItems:'center', gap:9, background:'rgba(255,255,255,0.024)', border:`1px solid ${C.border}`, borderRadius:13, padding:'9px 12px' }}>
      <div style={{ width:20, height:20, borderRadius:6.5, background:'rgba(255,255,255,0.055)', border:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><circle cx="4" cy="4" r="3" stroke={C.text3} strokeWidth="1.1"/><path d="M4 2.5v2M4 5.8v.3" stroke={C.text3} strokeWidth="1.1" strokeLinecap="round"/></svg>
      </div>
      <div>
        <div style={{ ...T.semibold, fontSize:11.5, color:C.text2, lineHeight:1.25 }}>{missing===1?'Falta 1 campo requerido':`Faltan ${missing} campos requeridos`}</div>
        <div style={{ ...T.body, fontSize:10, color:C.text3, marginTop:1 }}>Completa la información para continuar</div>
      </div>
    </div>
  );
}

function DLCTAButton({ enabled, submitted, onClick, shakeTrg, btnRef }) {
  const C = useC();
  const localRef=useRef(null);
  const ref=btnRef||localRef;
  useEffect(()=>{if(!enabled&&ref.current){ref.current.classList.remove('ne-shake');void ref.current.offsetWidth;ref.current.classList.add('ne-shake');}},[shakeTrg]);
  if (submitted) return (
    <div className="ne-check-in" style={{ borderRadius:18, padding:'13px 15px', background:'linear-gradient(135deg,#1E3A2E 0%,#152E22 100%)', border:`1px solid ${C.greenBdr}`, display:'flex', alignItems:'center', justifyContent:'center', gap:9 }}>
      <div style={{ width:26, height:26, borderRadius:8.5, background:C.green, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1.5 5l3.5 3.5 5.5-7" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <div>
        <div style={{ ...T.heading, fontSize:13.5, color:C.green }}>¡Mensajero solicitado!</div>
        <div style={{ ...T.body, fontSize:10.5, color:'rgba(44,184,122,0.56)', marginTop:1 }}>Asignación en curso · ~3 min</div>
      </div>
    </div>
  );
  return (
    <div ref={ref}>
      <button onClick={onClick} className={enabled?'ne-btn-glow ne-tap':'ne-tap'} style={{ width:'100%', border:'none', borderRadius:18, padding:'13px 15px', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:enabled?'pointer':'default', background:enabled?'linear-gradient(135deg,#E5A912 0%,#FFC01E 50%,#E5A912 100%)':C.bg3, borderTop:enabled?'1px solid rgba(196,152,46,0.26)':`1px solid ${C.border}`, opacity:enabled?1:.66, transition:'background .24s ease,opacity .24s ease' }}>
        <div style={{ display:'flex', alignItems:'center', gap:11 }}>
          <div style={{ width:35, height:35, borderRadius:11, flexShrink:0, background:enabled?'rgba(0,0,0,0.15)':'rgba(255,255,255,0.05)', border:enabled?'1px solid rgba(0,0,0,0.09)':`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5v11M3 6l4-4.5L11 6" stroke={enabled?'#060608':C.text3} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div>
            <div style={{ ...T.heading, fontSize:13.5, color:enabled?'#060608':C.text3, letterSpacing:'-0.012em' }}>Solicitar mensajero</div>
            <div style={{ ...T.body, fontSize:10.5, color:enabled?'rgba(6,6,8,0.46)':C.text3, marginTop:1 }}>{enabled?'Asignación inmediata · sin esperas':'Completa los campos para continuar'}</div>
          </div>
        </div>
        <svg width="17" height="17" viewBox="0 0 17 17" fill="none"><path d="M6 4l5 4.5-5 4.5" stroke={enabled?'#060608':C.text3} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
    </div>
  );
}

/* ── RASTREAR ────────────────────────────────────────────────────── */
function DLRastrearScreen({ onBack, onChat }) {
  const C = useC();
  const { isDark } = useAt();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [elapsed,     setElapsed]     = useState(3);
  const [reassigning, setReassigning] = useState(false); // demo reasignación
  useEffect(()=>{const t=setInterval(()=>setElapsed(p=>p+1),60000);return()=>clearInterval(t);},[]);

  /* Steps change when reassigning */
  const steps = reassigning ? [
    {id:'created',  label:'Solicitud creada',   done:true,  time:'09:38'},
    {id:'assigned', label:'Mensajero asignado',  done:true,  time:'09:41'},
    {id:'reassing', label:'Reasignando mensajero',done:false,time:null, current:true, accent:C.blue},
    {id:'picked',   label:'Artículo recogido',   done:false, time:null},
    {id:'delivered',label:'Entregado',           done:false, time:null},
  ] : [
    {id:'created',  label:'Solicitud creada',   done:true,  time:'09:38'},
    {id:'assigned', label:'Mensajero asignado',  done:true,  time:'09:41'},
    {id:'picked',   label:'Artículo recogido',   done:true,  time:'09:52'},
    {id:'route',    label:'En ruta',             done:false, time:null, current:true},
    {id:'delivered',label:'Entregado',           done:false, time:null},
  ];
  return (
    <div className="screen-forward" style={{ height:'100%', display:'flex', flexDirection:'column' }}>
      <DLNavHeader title="Rastrear envío" showBack onBack={onBack}/>
      <div className="rt-scroll" style={{ flex:1, overflowY:'auto', paddingBottom:32 }}>

        {/* STATUS HERO */}
        <div className="rt-s1" style={{ padding:'13px 14px 0' }}>
          <div className="rt-status-card" style={{ background: isDark ? 'linear-gradient(145deg,#101318 0%,#0E0E11 100%)' : 'linear-gradient(145deg,#FFFFFF 0%,#F2F2F8 100%)', border:`1px solid ${reassigning?C.blueBdr:C.greenBdr}`, borderRadius:22, overflow:'hidden', position:'relative' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent 0%,${reassigning?C.blue:C.green} 40%,${reassigning?C.blue:C.green} 60%,transparent 100%)`, opacity:.5 }}/>
            <div style={{ padding:'16px 17px 18px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:13 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, background:reassigning?C.blueDim:C.greenDim, border:`1px solid ${reassigning?C.blueBdr:C.greenBdr}`, borderRadius:20, padding:'4px 10px 4px 7px' }}>
                  <div style={{ position:'relative', width:7, height:7, flexShrink:0 }}>
                    <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:reassigning?C.blue:C.green, animation:'rt-ring 2.2s ease-out infinite' }}/>
                    <div style={{ position:'relative', width:7, height:7, borderRadius:'50%', background:reassigning?C.blue:C.green, animation:'rt-pulse 2.2s ease-in-out infinite' }}/>
                  </div>
                  <span style={{ ...T.semibold, fontSize:9.5, color:reassigning?C.blue:C.green, letterSpacing:'0.07em' }}>
                    {reassigning ? 'REASIGNANDO' : 'EN RUTA'}
                  </span>
                </div>
                {!reassigning && (
                  <div style={{ background:C.goldDim, border:`1px solid ${C.goldBorder}`, borderRadius:12, padding:'6px 11px', textAlign:'center' }}>
                    <div style={{ ...T.heading, fontSize:20, color:C.goldText, lineHeight:1, letterSpacing:'-0.02em' }}>18<span style={{ fontSize:12, fontWeight:600 }}>'</span></div>
                    <div style={{ ...T.body, fontSize:8, color: isDark ? 'rgba(212,168,74,0.5)' : 'rgba(168,122,14,0.6)', marginTop:1, letterSpacing:'0.07em', textTransform:'uppercase' }}>ETA</div>
                  </div>
                )}
              </div>

              <div style={{ marginBottom:9 }}>
                <div style={{ ...T.display, fontSize:24, color:C.text1, letterSpacing:'-0.028em', lineHeight:1.06, marginBottom:6 }}>
                  {reassigning ? <>Buscando<br/><span style={{ color:C.blue }}>nuevo mensajero</span></> : <>El mensajero<br/><span style={{ color:C.green }}>va en camino</span></>}
                </div>
                <div style={{ ...T.body, fontSize:11.5, color: isDark ? 'rgba(240,240,242,0.42)' : 'rgba(24,24,44,0.55)', lineHeight:1.55 }}>
                  {reassigning
                    ? 'El mensajero anterior canceló. El sistema está buscando uno nuevo automáticamente.'
                    : 'Alex ya recogió el paquete y se dirige al destino en El Vedado.'}
                </div>
              </div>

              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke={C.text3} strokeWidth="1"/><path d="M5 3v2l1.3 1.3" stroke={C.text3} strokeWidth="1" strokeLinecap="round"/></svg>
                  <span style={{ ...T.body, fontSize:10.5, color:C.text3 }}>Actualizado hace {elapsed} {elapsed===1?'minuto':'minutos'}</span>
                  <div style={{ width:2.5, height:2.5, borderRadius:'50%', background:C.text3, marginLeft:1 }}/>
                  <span style={{ ...T.body, fontSize:10.5, color:C.text3 }}>Envío #DL-2847</span>
                </div>
                {/* Demo toggle */}
                <button className="rt-tap" onClick={()=>setReassigning(p=>!p)} style={{ background:reassigning?C.blueDim:(isDark?'rgba(255,255,255,0.04)':'rgba(24,24,44,0.05)'), border:`1px solid ${reassigning?C.blueBdr:C.border}`, borderRadius:8, padding:'3px 8px', cursor:'pointer' }}>
                  <span style={{ ...T.body, fontSize:9, color:reassigning?C.blue:C.text3, letterSpacing:'0.04em', textTransform:'uppercase' }}>Demo</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* TIMELINE */}
        <div className="rt-s2" style={{ padding:'11px 14px 0' }}>
          <div style={{ background:C.bg1, border:`1px solid ${C.border}`, borderRadius:20, padding:'15px 15px 13px' }}>
            <div style={{ ...T.subhead, fontSize:10.5, color:C.text2, letterSpacing:'0.09em', textTransform:'uppercase', marginBottom:14 }}>Progreso del envío</div>
            {steps.map((step,i)=>{
              const isLast    = i===steps.length-1;
              const accentCol = step.accent || C.green;
              return (
                <div key={step.id} style={{ display:'flex', alignItems:'flex-start', gap:11 }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0, width:18 }}>
                    <div style={{ width:18, height:18, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:step.done?C.green:'transparent', border:step.done?'none':step.current?`2px solid ${accentCol}`:`2px solid ${C.text3}`, position:'relative' }}>
                      {step.done   && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5l2.5 2.5 4.5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      {step.current && <>
                        <div style={{ position:'absolute', inset:-3, borderRadius:'50%', border:`1.5px solid ${accentCol}44`, animation:'rt-ring 2.4s ease-out infinite' }}/>
                        <div style={{ width:7, height:7, borderRadius:'50%', background:accentCol, animation:'rt-pulse 1.9s ease-in-out infinite' }}/>
                      </>}
                      {!step.done && !step.current && <div style={{ width:5, height:5, borderRadius:'50%', background:C.text3, opacity:.32 }}/>}
                    </div>
                    {!isLast && <div style={{ width:1.5, height:28, marginTop:2.5, background:step.done?`linear-gradient(180deg,${C.green} 0%,rgba(44,184,122,.25) 100%)`:step.current?`linear-gradient(180deg,${accentCol}44 0%,${C.text3} 100%)`:C.bg3, borderRadius:1 }}/>}
                  </div>
                  <div style={{ paddingBottom:isLast?0:10, paddingTop:1, flex:1, display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <span style={{ ...T.medium, fontSize:12.5, color:step.done?C.text1:step.current?accentCol:C.text3 }}>{step.label}</span>
                    {step.time   && <span style={{ ...T.body, fontSize:10, color:C.text3, marginTop:1 }}>{step.time}</span>}
                    {step.current && <span style={{ ...T.semibold, fontSize:9.5, color:accentCol, letterSpacing:'0.05em' }}>AHORA</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MAP */}
        <div className="rt-s3" style={{ padding:'10px 14px 0' }}>
          <div style={{ background:C.bg1, border:`1px solid ${C.border}`, borderRadius:20, overflow:'hidden', position:'relative', height:172 }}>
            <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%' }} viewBox="0 0 347 172" preserveAspectRatio="xMidYMid slice">
              <defs>
                <radialGradient id="mg"><stop offset="0%" stopColor="#1A1A1E" stopOpacity="1"/><stop offset="100%" stopColor="#0A0A0D" stopOpacity="1"/></radialGradient>
                <radialGradient id="cg"><stop offset="0%" stopColor="#4A90D9" stopOpacity=".3"/><stop offset="100%" stopColor="#4A90D9" stopOpacity="0"/></radialGradient>
                <filter id="mf"><feGaussianBlur stdDeviation="2.2" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/></filter>
              </defs>
              <rect width="347" height="172" fill="url(#mg)"/>
              {[30,60,88,118,148].map(y=><line key={y} x1="0" y1={y} x2="347" y2={y} stroke="white" strokeWidth={y===88?.55:.32} opacity={y===88?.065:.04}/>)}
              {[48,96,144,190,240,290].map(x=><line key={x} x1={x} y1="0" x2={x} y2="172" stroke="white" strokeWidth={x===190?.55:.32} opacity={x===190?.065:.04}/>)}
              <path d="M 64 148 L 64 88 L 144 88 L 190 58 L 294 58" stroke="#E5A912" strokeWidth="1.8" fill="none" strokeDasharray="5.5,3.5" opacity=".6" filter="url(#mf)"/>
              <path d="M 64 148 L 64 88 L 144 88 L 170 76" stroke="#E5A912" strokeWidth="2" fill="none" opacity=".88"/>
              <circle cx="64"  cy="148" r="7"   fill="#E5A912" opacity=".14"/><circle cx="64"  cy="148" r="4.5" fill="#E5A912" opacity=".9"/><circle cx="64"  cy="148" r="2"   fill="white" opacity=".9"/>
              <circle cx="294" cy="58"  r="7"   fill="#2CB87A" opacity=".14"/><circle cx="294" cy="58"  r="4.5" fill="#2CB87A" opacity=".9"/><circle cx="294" cy="58"  r="2"   fill="white" opacity=".9"/>
              <circle cx="170" cy="76"  r="16"  fill="url(#cg)"/>
              <circle cx="170" cy="76"  r="9"   fill="#0E0E11" opacity=".9"/>
              <circle cx="170" cy="76"  r="6.5" fill="#4A90D9"/>
              <circle cx="170" cy="76"  r="2.5" fill="white" opacity=".9"/>
              <circle cx="170" cy="76"  r="12"  fill="none" stroke="#4A90D9" strokeWidth="1" opacity=".32" style={{ animation:'rt-map-shimmer 2s ease-in-out infinite' }}/>
            </svg>
            <div style={{ position:'absolute', bottom:0, left:0, right:0, height:44, background:'linear-gradient(to bottom,transparent,rgba(14,14,17,.88))' }}/>
            <div style={{ position:'absolute', top:10, left:10, right:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ background:'rgba(7,7,9,0.84)', border:`1px solid ${C.border}`, backdropFilter:'blur(8px)', borderRadius:9, padding:'4px 9px', display:'flex', alignItems:'center', gap:5 }}>
                <div style={{ width:5.5, height:5.5, borderRadius:'50%', background:C.gold, flexShrink:0 }}/><span style={{ ...T.medium, fontSize:10, color:'rgba(248,248,248,0.75)' }}>El Vedado</span>
              </div>
              <div style={{ background:'rgba(7,7,9,0.84)', border:`1px solid ${C.greenBdr}`, backdropFilter:'blur(8px)', borderRadius:9, padding:'4px 9px', display:'flex', alignItems:'center', gap:5 }}>
                <div style={{ width:5.5, height:5.5, borderRadius:1.5, background:C.green, flexShrink:0 }}/><span style={{ ...T.medium, fontSize:10, color:'rgba(248,248,248,0.75)' }}>El Vedado</span>
              </div>
            </div>
            <div style={{ position:'absolute', bottom:10, right:10, background:'rgba(7,7,9,0.86)', border:`1px solid ${C.border}`, backdropFilter:'blur(8px)', borderRadius:9, padding:'4px 10px' }}>
              <span style={{ ...T.semibold, fontSize:10.5, color:'#F8F8F8' }}>4.2 km</span><span style={{ ...T.body, fontSize:10, color:'rgba(248,248,248,0.4)' }}> · en ruta</span>
            </div>
          </div>
        </div>

        {/* COURIER */}
        <div className="rt-s4" style={{ padding:'10px 14px 0' }}>
          <div className="rt-courier-card" style={{ background:C.bg1, border:`1px solid ${C.border}`, borderRadius:20, padding:'13px 14px', display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ position:'relative', flexShrink:0 }}>
              <div style={{ width:46, height:46, borderRadius:15, background:'linear-gradient(135deg,#1E3248,#172840)', border:`1px solid ${C.blueBdr}`, display:'flex', alignItems:'center', justifyContent:'center', ...T.display, fontSize:18, color:C.blue }}>A</div>
              <div style={{ position:'absolute', bottom:1.5, right:1.5, width:10, height:10, borderRadius:'50%', background:C.green, border:`2px solid ${C.bg1}` }}/>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ ...T.subhead, fontSize:13.5, color:C.text1, letterSpacing:'-0.01em', marginBottom:4 }}>Alex Ramírez</div>
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <div style={{ display:'flex', alignItems:'center', gap:3 }}>
                  <svg width="10" height="10" viewBox="0 0 10 10"><path d="M5 1l1.2 2.5L9 3.8l-2.1 2 .5 2.8L5 7.3 2.6 8.6l.5-2.8L1 3.8l2.8-.3z" fill="#E5A912"/></svg>
                  <span style={{ ...T.semibold, fontSize:11, color:C.text2 }}>4.9</span>
                </div>
                <div style={{ width:2.5, height:2.5, borderRadius:'50%', background:C.text3 }}/>
                <span style={{ ...T.body, fontSize:10.5, color:C.text3 }}>847 entregas</span>
                <div style={{ width:2.5, height:2.5, borderRadius:'50%', background:C.text3 }}/>
                <div style={{ display:'flex', alignItems:'center', gap:3 }}>
                  <svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 7h10M2 7V5l1.8-2.5h4.4L10 5v2" stroke={C.text3} strokeWidth="1.1" strokeLinejoin="round"/><circle cx="3.2" cy="7.8" r="1.1" fill={C.text3}/><circle cx="8.8" cy="7.8" r="1.1" fill={C.text3}/></svg>
                  <span style={{ ...T.body, fontSize:10.5, color:C.text3 }}>Moto</span>
                </div>
              </div>
            </div>
            <div style={{ background:C.bg3, border:`1px solid ${C.border}`, borderRadius:9, padding:'5px 9px', textAlign:'center', flexShrink:0 }}>
              <div style={{ ...T.semibold, fontSize:11, color:C.text1, letterSpacing:'0.07em' }}>MX-2847</div>
              <div style={{ ...T.body, fontSize:8.5, color:C.text3, marginTop:1, textTransform:'uppercase', letterSpacing:'0.06em' }}>Placa</div>
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="rt-s5" style={{ padding:'9px 14px 0', display:'flex', gap:7 }}>
          <button className="rt-tap" onClick={onChat} style={{ flex:1, border:`1px solid ${C.border}`, background:C.bg1, borderRadius:17, padding:'12px 14px', display:'flex', alignItems:'center', gap:9, cursor:'pointer' }}>
            <div style={{ width:30, height:30, borderRadius:10, flexShrink:0, background:'rgba(255,255,255,0.05)', border:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
              <svg width="13" height="12" viewBox="0 0 13 12" fill="none"><path d="M1 9V2.5A1.5 1.5 0 012.5 1h8A1.5 1.5 0 0112 2.5v5A1.5 1.5 0 0110.5 9H5L1 12V9z" stroke={C.text2} strokeWidth="1.2" strokeLinejoin="round"/><path d="M4 4.5h5M4 6.5h3.5" stroke={C.text2} strokeWidth="1.1" strokeLinecap="round"/></svg>
              <div style={{ position:'absolute', top:-2, right:-2, width:7, height:7, borderRadius:'50%', background:C.green, border:`1.5px solid ${C.bg}` }}/>
            </div>
            <div style={{ textAlign:'left' }}>
              <div style={{ ...T.semibold, fontSize:12, color:C.text1, lineHeight:1.2 }}>Chat</div>
              <div style={{ ...T.body, fontSize:10, color:C.text3, marginTop:1 }}>con el mensajero</div>
            </div>
            <svg width="6" height="11" viewBox="0 0 6 11" fill="none" style={{ marginLeft:'auto', flexShrink:0 }}><path d="M1 1.5l3.5 4L1 9.5" stroke={C.text3} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button className="rt-tap" onClick={()=>setDetailsOpen(p=>!p)} style={{ flex:1, border:`1px solid ${detailsOpen?C.goldBorder:C.border}`, background:detailsOpen?C.goldDim:C.bg1, borderRadius:17, padding:'12px 14px', display:'flex', alignItems:'center', gap:9, cursor:'pointer' }}>
            <div style={{ width:30, height:30, borderRadius:10, flexShrink:0, background:detailsOpen?C.goldDim2:'rgba(255,255,255,0.05)', border:`1px solid ${detailsOpen?C.goldBorder:C.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="1" width="10" height="10" rx="2.5" stroke={detailsOpen?C.goldText:C.text2} strokeWidth="1.2"/><path d="M3.5 4.5h5M3.5 6.5h5M3.5 8.5h3" stroke={detailsOpen?C.goldText:C.text2} strokeWidth="1.1" strokeLinecap="round"/></svg>
            </div>
            <div style={{ textAlign:'left' }}>
              <div style={{ ...T.semibold, fontSize:12, color:detailsOpen?C.goldText:C.text1, lineHeight:1.2 }}>Detalles</div>
              <div style={{ ...T.body, fontSize:10, color:detailsOpen?'rgba(212,168,74,0.52)':C.text3, marginTop:1 }}>del envío</div>
            </div>
          </button>
        </div>

        {/* DETAILS */}
        {detailsOpen&&(
          <div className="rt-details-open" style={{ padding:'9px 14px 0' }}>
            <div style={{ background:C.bg1, border:`1px solid ${C.goldBorder}`, borderRadius:18, overflow:'hidden' }}>
              <div style={{ padding:'12px 14px 11px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ ...T.subhead, fontSize:12, color:C.goldText }}>Detalles del envío</span>
                <span style={{ ...T.body, fontSize:10, color:C.text3 }}>#DL-2847</span>
              </div>
              {[
                {label:'Origen',     val:'Edificio FOCSA, El Vedado'},
                {label:'Destino',    val:'Calle 23 e/ L y M, El Vedado'},
                {label:'Referencia', val:'Edificio de cristal, entrada principal'},
                {label:'Contacto',   val:'+52 55 1234 5678'},
                {label:'Artículo',   val:'Documentos para oficina'},
                {label:'Creado',     val:'Hoy 09:38 · hace 20 min'},
                {label:'Precio',     val:'$85 MXN'},
              ].map(({label,val},i,arr)=>(
                <div key={label}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 14px' }}>
                    <div style={{ flex:1 }}>
                      <div style={{ ...T.body, fontSize:9.5, color:C.text3, letterSpacing:'0.04em', textTransform:'uppercase', marginBottom:2.5 }}>{label}</div>
                      <div style={{ ...T.medium, fontSize:12, color:C.text1, lineHeight:1.4 }}>{val}</div>
                    </div>
                  </div>
                  {i<arr.length-1&&<div style={{ height:1, background:C.border, margin:'0 14px' }}/>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── CHAT ────────────────────────────────────────────────────────── */
/*
 * BITÁCORA AUTOMÁTICA — todos los eventos de sistema que pueden
 * aparecer como mensajes tipo 'system' en la conversación:
 *
 * color '#4A90D9' → eventos de asignación / reasignación
 * color '#E5A912' → eventos de recogida / en ruta
 * color '#2CB87A' → eventos positivos (entregado)
 * color '#E05555' → cancelaciones / errores
 * color '#F97316' → entrega no completada / alertas
 * color '#F59E0B' → cancelación por cliente
 */
const INITIAL_MSGS=[
  {id:1, type:'system', text:'Solicitud creada',                             time:'09:38', color:'#9898A6', date:'Hoy'},
  {id:2, type:'system', text:'Mensajero asignado · Rodrigo Pérez',           time:'09:41', color:'#4A90D9', date:'Hoy'},
  {id:3, type:'courier',text:'Hola, soy Rodrigo. Voy en camino a recoger tu paquete 🛵', time:'09:43', date:'Hoy'},
  {id:4, type:'client', text:'Perfecto, te espero. El portón es azul.',      time:'09:44', date:'Hoy'},
  {id:5, type:'system', text:'Mensajero reasignado · Rodrigo canceló antes de la recogida', time:'09:46', color:'#4A90D9', date:'Hoy'},
  {id:6, type:'system', text:'Nuevo mensajero asignado · Alex Ramírez',      time:'09:48', color:'#4A90D9', date:'Hoy'},
  {id:7, type:'courier',text:'Hola, soy Alex. Ya estoy en camino al punto de recogida.',  time:'09:49', date:'Hoy'},
  {id:8, type:'courier',text:'Entendido, ya estoy cerca del punto de recogida.',           time:'09:50', date:'Hoy'},
  {id:9, type:'system', text:'Artículo recogido',                            time:'09:52', color:'#E5A912', date:null},
  {id:10,type:'courier',text:'Ya recogí el paquete, voy para allá 🤝',       time:'09:53', date:null},
  {id:11,type:'client', text:'La casa tiene un portón azul.',                time:'09:54', date:null},
  {id:12,type:'courier',text:'Perfecto, ya estoy en camino.',                time:'09:55', date:null},
  {id:13,type:'client', text:'¿Cuánto tiempo aproximadamente?',              time:'09:56', date:null},
  {id:14,type:'courier',text:'Unos 15 minutos más o menos 🛵',               time:'09:57', date:null},
];

function DLChatScreen({ onBack }) {
  const C = useC();
  const [msg,setMsg]=useState('');
  const [messages,setMessages]=useState(INITIAL_MSGS);
  // finalState: null=active | 'delivered' | 'cancelled_client' | 'cancelled_system' | 'failed'
  const [finalState, setFinalState]=useState(null);
  const scrollRef=useRef(null);
  useEffect(()=>{if(scrollRef.current)scrollRef.current.scrollTop=scrollRef.current.scrollHeight;},[messages]);

  const archived = finalState !== null;

  /* simulate triggering a final state + auto system message */
  const triggerFinal = (state) => {
    const sysMsg = {
      delivered:        {text:'Entrega completada · El paquete fue entregado exitosamente', color:'#2CB87A'},
      cancelled_client: {text:'Envío cancelado por el cliente',                              color:'#F59E0B'},
      cancelled_system: {text:'Envío cancelado por el sistema · Sin mensajeros disponibles', color:'#E05555'},
      failed:           {text:'Entrega no completada · Destinatario no responde',            color:'#F97316'},
    }[state];
    setMessages(p=>[...p,{id:Date.now(),type:'system',text:sysMsg.text,time:'10:18',color:sysMsg.color,date:null}]);
    setFinalState(state);
  };

  const send=()=>{const t=msg.trim();if(!t)return;setMessages(p=>[...p,{id:Date.now(),type:'client',text:t,time:'10:02'}]);setMsg('');};

  const finalCfg = finalState ? DL_STATUS_CFG[finalState] : null;

  return (
    <div className="screen-forward" style={{ height:'100%', display:'flex', flexDirection:'column', background:C.bg }}>
      <div style={{ flexShrink:0 }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'0 14px', height:48, borderBottom:`1px solid ${C.border}` }}>
          <button className="ch-tap" onClick={onBack} style={{ background:'rgba(255,255,255,0.052)', border:`1px solid ${C.border}`, borderRadius:10, width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M6 1L1 6l5 5" stroke={C.text1} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div style={{ position:'relative', flexShrink:0 }}>
            <div style={{ width:34, height:34, borderRadius:11, background:'linear-gradient(135deg,#1E3248,#172840)', border:`1px solid ${C.blueBdr}`, display:'flex', alignItems:'center', justifyContent:'center', ...T.heading, fontSize:13, color:C.blue }}>A</div>
            <div style={{ position:'absolute', bottom:1, right:1, width:8, height:8, borderRadius:'50%', background:archived?C.text3:C.green, border:`1.5px solid ${C.bg}` }}/>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ ...T.heading, fontSize:13.5, color:C.text1, letterSpacing:'-0.014em', lineHeight:1.15 }}>Entrega #DL-45821</div>
            <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:2 }}>
              <span style={{ ...T.body, fontSize:10.5, color:C.text2 }}>Alex Ramírez</span>
              <div style={{ width:2.5, height:2.5, borderRadius:'50%', background:C.text3 }}/>
              {archived
                ? <span style={{ ...T.semibold, fontSize:10, color:finalCfg?.color, letterSpacing:'0.04em' }}>{finalCfg?.label}</span>
                : <div style={{ display:'flex', alignItems:'center', gap:3.5 }}>
                    <div style={{ width:5.5, height:5.5, borderRadius:'50%', background:C.green, animation:'ch-pulse 2.2s ease-in-out infinite' }}/>
                    <span style={{ ...T.semibold, fontSize:10, color:C.green, letterSpacing:'0.04em' }}>En ruta</span>
                  </div>
              }
            </div>
          </div>
          {/* Demo state selector */}
          {!archived
            ? <button className="ch-tap" onClick={()=>triggerFinal('delivered')} style={{ background:'rgba(255,255,255,0.05)', border:`1px solid ${C.border}`, borderRadius:9, padding:'5px 9px', flexShrink:0 }}>
                <span style={{ ...T.body, fontSize:9, color:C.text3, letterSpacing:'0.05em', textTransform:'uppercase' }}>Demo</span>
              </button>
            : <button className="ch-tap" onClick={()=>{setFinalState(null);setMessages(INITIAL_MSGS);}} style={{ background:'rgba(255,255,255,0.05)', border:`1px solid ${C.border}`, borderRadius:9, padding:'5px 9px', flexShrink:0 }}>
                <span style={{ ...T.body, fontSize:9, color:C.text3, letterSpacing:'0.05em', textTransform:'uppercase' }}>Reset</span>
              </button>
          }
        </div>

        {/* Demo final state pills — only visible when active */}
        {!archived && (
          <div style={{ display:'flex', gap:5, padding:'8px 14px', borderBottom:`1px solid ${C.border}`, overflowX:'auto' }}>
            <span style={{ ...T.body, fontSize:9.5, color:C.text3, flexShrink:0, alignSelf:'center', paddingRight:4 }}>Simular:</span>
            {Object.entries(DL_STATUS_CFG).map(([k,v])=>(
              <button key={k} className="ch-tap" onClick={()=>triggerFinal(k)} style={{ background:v.dim, border:`1px solid ${v.bdr}`, borderRadius:20, padding:'3px 9px', cursor:'pointer', ...T.medium, fontSize:9.5, color:v.color, flexShrink:0, whiteSpace:'nowrap' }}>{v.label}</button>
            ))}
          </div>
        )}

        {/* Status card */}
        <div className="ch-s1" style={{ margin:'11px 14px 0' }}>
          <div style={{ background:'linear-gradient(135deg,rgba(20,20,24,0.9),rgba(14,14,17,0.9))', border:`1px solid ${archived?finalCfg?.bdr||C.border:C.greenBdr}`, borderRadius:16, padding:'11px 14px', display:'flex', alignItems:'center', gap:12, backdropFilter:'blur(8px)' }}>
            <div style={{ position:'relative', width:32, height:32, flexShrink:0 }}>
              <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:archived?finalCfg?.dim||C.greenDim:C.greenDim, border:`1px solid ${archived?finalCfg?.bdr||C.border:C.greenBdr}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {archived
                  ?<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 5h8v4a1 1 0 01-1 1H3a1 1 0 01-1-1V5zM1 3h10v2H1V3z" stroke={finalCfg?.color||C.text3} strokeWidth="1.1" strokeLinejoin="round"/></svg>
                  :<><div style={{ position:'absolute', inset:-2, borderRadius:'50%', border:`1px solid rgba(44,184,122,0.2)`, animation:'ch-ring 2.4s ease-out infinite' }}/><div style={{ width:8, height:8, borderRadius:'50%', background:C.green, animation:'ch-pulse 1.9s ease-in-out infinite' }}/></>
                }
              </div>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ ...T.semibold, fontSize:11.5, color:archived?finalCfg?.color||C.text2:C.green, lineHeight:1.2, marginBottom:2 }}>
                {archived ? finalCfg?.label||'Finalizado' : 'En ruta · En camino'}
              </div>
              <div style={{ ...T.body, fontSize:10.5, color:C.text3, lineHeight:1.4 }}>
                {archived ? 'Conversación archivada · Solo lectura' : 'Artículo recogido · ETA 18 min'}
              </div>
            </div>
            {!archived&&<div style={{ background:C.goldDim, border:`1px solid ${C.goldBorder}`, borderRadius:9, padding:'5px 9px', textAlign:'center', flexShrink:0 }}>
              <div style={{ ...T.heading, fontSize:17, color:C.goldText, lineHeight:1, letterSpacing:'-0.02em' }}>18<span style={{ fontSize:10, fontWeight:600 }}>'</span></div>
              <div style={{ ...T.body, fontSize:7.5, color:'rgba(212,168,74,0.48)', marginTop:1, textTransform:'uppercase', letterSpacing:'0.07em' }}>ETA</div>
            </div>}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="ch-scroll ch-s2" style={{ flex:1, overflowY:'auto', padding:'12px 14px 0' }}>
        {messages.map((m,i)=><DLChatMessage key={m.id} m={m} prev={messages[i-1]}/>)}
        <div style={{ height:archived?16:80 }}/>
      </div>

      {/* Footer */}
      <div className="ch-s3" style={{ flexShrink:0, padding:'10px 14px 16px' }}>
        {archived ? (
          <div style={{ background:finalCfg?.dim||'rgba(255,255,255,0.028)', border:`1px solid ${finalCfg?.bdr||C.border}`, borderRadius:16, padding:'13px 15px', display:'flex', alignItems:'flex-start', gap:11 }}>
            <div style={{ width:28, height:28, borderRadius:9, background:'rgba(255,255,255,0.05)', border:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 5h8v4a1 1 0 01-1 1H3a1 1 0 01-1-1V5zM1 3h10v2H1V3z" stroke={finalCfg?.color||C.text3} strokeWidth="1.1" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <div style={{ ...T.semibold, fontSize:12, color:finalCfg?.color||C.text2, marginBottom:3 }}>Conversación archivada</div>
              <div style={{ ...T.body, fontSize:11, color:C.text3, lineHeight:1.5 }}>Esta entrega ha finalizado. Los mensajes permanecen disponibles como registro del servicio.</div>
            </div>
          </div>
        ):(
          <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
            <div style={{ flex:1, background:'rgba(255,255,255,0.038)', border:`1px solid ${C.border}`, borderRadius:14, display:'flex', alignItems:'center', padding:'0 12px', minHeight:42 }}>
              <input className="ch-field" placeholder="Escribe un mensaje…" value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')send();}} style={{ flex:1, background:'transparent', border:'none', ...T.medium, fontSize:12.5, color:C.text1, outline:'none', padding:'10px 0' }}/>
            </div>
            <button className="ch-send-btn ch-tap" onClick={send} style={{ width:42, height:42, borderRadius:13, flexShrink:0, background:msg.trim()?'linear-gradient(135deg,#E5A912,#FFC01E)':'rgba(255,255,255,0.06)', border:`1px solid ${msg.trim()?'rgba(196,152,46,0.3)':C.border}`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:msg.trim()?'0 4px 14px rgba(196,152,46,0.28)':'none', transition:'background .18s ease,box-shadow .18s ease,border .18s ease' }}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M1.5 13L13.5 7.5 1.5 2v4.5l9 1-9 1V13z" fill={msg.trim()?'#060608':C.text3}/></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function DLChatMessage({ m, prev }) {
  const C = useC();
  const showDate=!prev||prev.date!==m.date;
  const showSender=m.type==='courier'&&(!prev||prev.type!=='courier');
  return (
    <>
      {showDate&&m.date&&(
        <div style={{ display:'flex', alignItems:'center', gap:8, margin:'10px 0 8px' }}>
          <div style={{ flex:1, height:1, background:C.border }}/><span style={{ ...T.body, fontSize:9.5, color:C.text3, letterSpacing:'0.06em', textTransform:'uppercase' }}>{m.date}</span><div style={{ flex:1, height:1, background:C.border }}/>
        </div>
      )}
      {m.type==='system'&&(
        <div style={{ display:'flex', justifyContent:'center', margin:'6px 0' }}>
          <div style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${C.border}`, borderRadius:20, padding:'4px 12px', display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:5, height:5, borderRadius:'50%', background:m.color||C.green, flexShrink:0 }}/>
            <span style={{ ...T.medium, fontSize:10.5, color:C.text2 }}>{m.text}</span>
            <span style={{ ...T.body, fontSize:9.5, color:C.text3 }}>{m.time}</span>
          </div>
        </div>
      )}
      {m.type==='courier'&&(
        <div style={{ display:'flex', alignItems:'flex-end', gap:7, marginBottom:4, animation:'ch-msg-in .22s ease both' }}>
          <div style={{ width:26, height:26, borderRadius:9, background:'linear-gradient(135deg,#1E3248,#172840)', border:`1px solid ${C.blueBdr}`, display:'flex', alignItems:'center', justifyContent:'center', ...T.heading, fontSize:10, color:C.blue, flexShrink:0, opacity:showSender?1:0 }}>R</div>
          <div style={{ maxWidth:'72%' }}>
            {showSender&&<div style={{ ...T.body, fontSize:9.5, color:C.text3, marginBottom:4, paddingLeft:2 }}>Rodrigo · Mensajero</div>}
            <div style={{ background:C.bg2, border:`1px solid rgba(255,255,255,0.065)`, borderRadius:'14px 14px 14px 4px', padding:'9px 12px' }}>
              <div style={{ ...T.body, fontSize:12.5, color:C.text1, lineHeight:1.5 }}>{m.text}</div>
              <div style={{ ...T.body, fontSize:9, color:C.text3, marginTop:4, textAlign:'right' }}>{m.time}</div>
            </div>
          </div>
        </div>
      )}
      {m.type==='client'&&(
        <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:4, animation:'ch-send-in .2s ease both' }}>
          <div style={{ maxWidth:'72%', background:'linear-gradient(135deg,rgba(196,152,46,0.14),rgba(196,152,46,0.08))', border:`1px solid rgba(196,152,46,0.18)`, borderRadius:'14px 14px 4px 14px', padding:'9px 12px' }}>
            <div style={{ ...T.medium, fontSize:12.5, color:C.text1, lineHeight:1.5 }}>{m.text}</div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:4, marginTop:4 }}>
              <span style={{ ...T.body, fontSize:9, color:'rgba(196,152,46,0.45)' }}>{m.time}</span>
              <svg width="14" height="9" viewBox="0 0 14 9" fill="none"><path d="M1 4.5l2.5 3L8 1" stroke="rgba(196,152,46,0.55)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M5.5 4.5L8 7.5 12.5 1" stroke="rgba(196,152,46,0.55)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ── SHARED ──────────────────────────────────────────────────────── */
function DLSectionTitle({ title, badge, badgeColor, badgeBg, badgeBdr, linkLabel, onLink }) {
  const C = useC();
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
      <div style={{ display:'flex', alignItems:'center', gap:7 }}>
        <span style={{ ...T.heading, fontSize:14.5, color:C.text1, letterSpacing:'-0.012em' }}>{title}</span>
        {badge&&<span style={{ background:badgeBg, border:`1px solid ${badgeBdr}`, borderRadius:20, padding:'2px 8px', ...T.semibold, fontSize:9.5, color:badgeColor }}>{badge}</span>}
      </div>
      {linkLabel&&<button onClick={onLink} style={{ background:'none', border:'none', cursor:'pointer', ...T.medium, fontSize:12, color:C.goldText, fontFamily:"'Outfit',sans-serif" }}>{linkLabel}</button>}
    </div>
  );
}

const DLOriginDot=()=>(<div style={{ width:16,height:16,borderRadius:5,flexShrink:0,background:'rgba(196,152,46,0.11)',border:'1px solid rgba(196,152,46,0.26)',display:'flex',alignItems:'center',justifyContent:'center' }}><div style={{ width:5.5,height:5.5,borderRadius:'50%',background:C.gold }}/></div>);
const DLDestDot  =()=>(<div style={{ width:16,height:16,borderRadius:5,flexShrink:0,background:'rgba(44,184,122,0.09)',border:'1px solid rgba(44,184,122,0.26)',display:'flex',alignItems:'center',justifyContent:'center' }}><div style={{ width:5.5,height:5.5,borderRadius:1.8,background:C.green }}/></div>);
const DLPkgIcon  =()=>(<div style={{ width:16,height:16,borderRadius:5,flexShrink:0,background:'rgba(74,144,217,0.08)',border:'1px solid rgba(74,144,217,0.2)',display:'flex',alignItems:'center',justifyContent:'center' }}><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 3.2l3.5-1.7 3.5 1.7v3.6l-3.5 1.7-3.5-1.7V3.2z" stroke={C.blue} strokeWidth="1" strokeLinejoin="round"/><path d="M5 1.5v7M1.5 3.2L5 5l3.5-1.8" stroke={C.blue} strokeWidth="1" strokeLinecap="round"/></svg></div>);
const DLLightningIcon=()=>(<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M8 1.5L2.5 7.5h5l-.5 5L12 6.5H7L8 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>);
const DLShieldIcon   =()=>(<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5l4 1.6v3c0 2.6-1.6 4.6-4 5.5C4.6 10.7 3 8.7 3 6.1V3.1L7 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M4.8 7l1.7 1.7 2.7-2.7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const DLBoxIcon      =()=>(<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4l5-2.5L12 4v6l-5 2.5L2 10V4z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M7 1.5v11M2 4l5 2.5 5-2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>);

// ═══════════════════════════════════════════════════════════════════
//  ENVÍOS INTERNACIONALES — módulo integrado (encapsulado en closure
//  para que sus nombres internos no colisionen con el resto de la app)
// ═══════════════════════════════════════════════════════════════════

const IS_CSS = `
.isx{
  --is-bg:#F0F4F8; --is-card:#FFFFFF; --is-fill:#F1F5F9; --is-header:#0F172A;
  --is-border:#E2E8F0;
  --is-t1:#0F172A; --is-t2:#64748B; --is-t3:#94A3B8; --is-t4:#CBD5E1;
  --is-accentText:#1E3A8A;
}
.isx-dark{
  --is-bg:#0E0E11; --is-card:#17171B; --is-fill:#23232A; --is-header:#141418;
  --is-border:#2B2B33;
  --is-t1:#ECECF1; --is-t2:#A6A6B4; --is-t3:#7C7C8A; --is-t4:#55555F;
  --is-accentText:#9DB8FF;
}
.isx input::placeholder, .isx textarea::placeholder { color: var(--is-t3); opacity: 1; }
`;
export function IntlShipping({ onBack, flash, cfg, onNav }) {
  const { isDark } = useAt();
  return (
    <div className={isDark ? "isx isx-dark" : "isx"} style={{ flex:1, minHeight:0, display:"flex", flexDirection:"column" }}>
      <style>{IS_CSS}</style>
      <IntlShippingApp onBack={onBack} onNav={onNav} />
    </div>
  );
}
