import { useEffect } from "react";
import { G, useAt } from "./theme.jsx";

// ═════════════════════════════════════════════════════════════════════════════
// CSS GLOBAL
// ═════════════════════════════════════════════════════════════════════════════
export function useCSS() {
  useEffect(() => {
    if (document.getElementById("rtd-css")) return;
    const s = document.createElement("style"); s.id = "rtd-css";
    s.textContent = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
html,body{height:100%;overflow:hidden;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility}
*{letter-spacing:-0.012em}
::-webkit-scrollbar{width:0;height:0}
input,textarea,select,button{font-family:'Barlow',sans-serif}
input,textarea{font-size:16px!important}
input::placeholder,textarea::placeholder{color:#2a2a2a}
select option{background:#161616;color:#fff}
.dx{transition:gap .28s cubic-bezier(.4,0,.2,1),padding .28s cubic-bezier(.4,0,.2,1),grid-template-columns .28s cubic-bezier(.4,0,.2,1),font-size .28s cubic-bezier(.4,0,.2,1),height .28s cubic-bezier(.4,0,.2,1),border-radius .28s cubic-bezier(.4,0,.2,1)}
.dslider{-webkit-appearance:none;appearance:none;height:24px;background:transparent;cursor:pointer}
.dslider::-webkit-slider-runnable-track{height:6px;border-radius:99px;background:rgba(245,184,0,.2)}
.dslider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:22px;height:22px;border-radius:50%;background:#FFC01E;border:3px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.35);margin-top:-8px}
.dslider::-moz-range-track{height:6px;border-radius:99px;background:rgba(245,184,0,.2)}
.dslider::-moz-range-thumb{width:22px;height:22px;border-radius:50%;background:#FFC01E;border:3px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.35)}
@keyframes dsh{0%{background-position:-300% center}100%{background-position:300% center}}
@keyframes blk{0%,100%{opacity:1}50%{opacity:.06}}
@keyframes tkr{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@keyframes glw{0%,100%{filter:drop-shadow(0 0 6px rgba(245,184,0,.1))}50%{filter:drop-shadow(0 0 24px rgba(245,184,0,.38))}}
@keyframes fup{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes fin{from{opacity:0}to{opacity:1}}
@keyframes sup{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes srt{from{transform:translateX(108%);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes tst{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
@keyframes spn{to{transform:rotate(360deg)}}
@keyframes neon{0%,100%{opacity:.65}50%{opacity:1}}
@keyframes pls{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
@keyframes sld{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
@keyframes dropIn{from{opacity:0;transform:translateY(-6px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
.dor{background:linear-gradient(90deg,#FFC01E 0%,#FFC01E 22%,#fff8d6 38%,#fff 50%,#fff8d6 62%,#FFC01E 78%,#FFC01E 100%);background-size:280% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:dsh 3s linear infinite}
.blk{animation:blk 2.2s ease-in-out infinite}
.glw{animation:glw 3.5s ease-in-out infinite}
.tkr{white-space:nowrap;display:inline-block;animation:tkr 32s linear infinite}
.f0{animation:fup .42s 0s ease both}.f1{animation:fup .42s .06s ease both}.f2{animation:fup .42s .12s ease both}
.f3{animation:fup .42s .18s ease both}.f4{animation:fup .42s .26s ease both}.f5{animation:fup .42s .36s ease both}
.ns{animation:srt .22s ease both}.bs{animation:sup .26s ease both}.fi{animation:fin .16s ease both}.sld{animation:sld .22s ease both}
.p{transition:transform .1s,opacity .1s,box-shadow .1s;cursor:pointer;-webkit-user-select:none;user-select:none}
.p:active{transform:scale(.93);opacity:.72}
.cd{cursor:pointer;transition:transform .13s,box-shadow .13s;box-shadow:0 1px 3px rgba(0,0,0,.22),0 1px 1px rgba(0,0,0,.15)}
.cd:hover{box-shadow:0 3px 10px rgba(0,0,0,.28),0 1px 3px rgba(0,0,0,.18)}
.cd:active{transform:scale(.97);box-shadow:0 1px 2px rgba(0,0,0,.18)}
.btn{display:inline-flex;align-items:center;justify-content:center;cursor:pointer;border-radius:10px;font-weight:700;letter-spacing:.01em;transition:transform .1s,box-shadow .12s,opacity .1s;-webkit-user-select:none;user-select:none}
.btn:active{transform:scale(.95);opacity:.88}
.btn-dark{background:#1a1a1a;border:1px solid #2a2a2a;color:#e8e8e8;box-shadow:0 2px 0 #000,0 4px 12px rgba(0,0,0,.55)}
.btn-dark:hover{box-shadow:0 3px 0 #000,0 6px 18px rgba(0,0,0,.65);transform:translateY(-1px)}
.btn-dark:active{box-shadow:0 1px 0 #000,0 2px 6px rgba(0,0,0,.4);transform:translateY(1px)}
.btn-light{background:#fff;border:1px solid #D0D0DE;color:#18182C;box-shadow:0 2px 0 rgba(24,24,44,.18),0 4px 10px rgba(24,24,44,.1)}
.btn-light:hover{box-shadow:0 3px 0 rgba(24,24,44,.2),0 6px 14px rgba(24,24,44,.14);transform:translateY(-1px)}
.btn-light:active{box-shadow:0 1px 0 rgba(24,24,44,.12);transform:translateY(1px)}
.btn-gold{background:#FFC01E;border:1px solid #d4a000;color:#000;box-shadow:0 2px 0 rgba(180,130,0,.6),0 4px 14px rgba(245,184,0,.3)}
.btn-gold:hover{box-shadow:0 3px 0 rgba(180,130,0,.7),0 6px 18px rgba(245,184,0,.38);transform:translateY(-1px)}
.btn-gold:active{box-shadow:0 1px 0 rgba(180,130,0,.5);transform:translateY(1px)}
.chip{display:inline-flex;align-items:center;cursor:pointer;border-radius:100px;font-weight:700;transition:transform .1s,box-shadow .12s;-webkit-user-select:none;user-select:none;box-shadow:0 1px 0 rgba(0,0,0,.25),0 2px 6px rgba(0,0,0,.2)}
.chip:hover{box-shadow:0 2px 0 rgba(0,0,0,.3),0 4px 10px rgba(0,0,0,.25);transform:translateY(-1px)}
.chip:active{box-shadow:0 0px 0 rgba(0,0,0,.15);transform:translateY(1px) scale(.97)}
.chip-light{box-shadow:none}
.chip-light:hover{box-shadow:none;transform:none;border-color:#8A8D91}
.chip-light:active{box-shadow:none;transform:scale(.97)}
.spn{animation:spn .65s linear infinite}
.neon{animation:neon 2.2s ease-in-out infinite}
.pls{animation:pls 2s ease-in-out infinite}
`;
    document.head.appendChild(s);
  }, []);
}

// ═════════════════════════════════════════════════════════════════════════════
// ICONOS UI
// ═════════════════════════════════════════════════════════════════════════════
export const Ic = ({ n, c = "#fff", s = 22 }) => {
  const p = { width: s, height: s, fill: "none", stroke: c, strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round" };
  const M = {
    store:  <svg {...p} viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    truck:  <svg {...p} viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
    coin:   <svg {...p} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M9 9h4.5a2.5 2.5 0 010 5H9"/></svg>,
    user:   <svg {...p} viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    search: <svg {...p} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    back:   <svg {...p} viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>,
    close:  <svg {...p} viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    msg:    <svg {...p} viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
    send:   <svg width={s} height={s} viewBox="0 0 24 24" fill={c}><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    award:  <svg {...p} viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>,
    moto:   <svg {...p} viewBox="0 0 24 24"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6h1l2 5m-7 6.5h7l2-5H9"/></svg>,
    cog:    <svg {...p} viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
    shield: <svg {...p} viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    trash:  <svg {...p} viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>,
    edit:   <svg {...p} viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    bell:   <svg {...p} viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
    lock:   <svg {...p} viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
    chart:  <svg {...p} viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    wallet: <svg {...p} viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="16" cy="12" r="1" fill={c} stroke="none"/></svg>,
    tools:  <svg {...p} viewBox="0 0 24 24"><path d="M12 3l1.9 4.4L18 9l-4.1 1.6L12 15l-1.9-4.4L6 9l4.1-1.6z"/><path d="M18.5 14.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z"/></svg>,
    heart:  <svg {...p} viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
    share:  <svg {...p} viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
    star:   <svg {...p} viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    check:  <svg {...p} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
    map:    <svg {...p} viewBox="0 0 24 24"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
    pkg:    <svg {...p} viewBox="0 0 24 24"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  };
  return M[n] || null;
};

export const Spin = ({ size = 20, color = G }) => (
  <div className="spn" style={{ width: size, height: size, border: `2px solid #181818`, borderTopColor: color, borderRadius: "50%", flexShrink: 0 }} />
);

export const Logo = ({ size = 21, sub = null }) => {
  const { isDark } = useAt();
  const ink = isDark ? "#F0F0F2" : "#18182C";
  return (
  <div style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: sub ? 8 : 0 }}>
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.34 }}>
      {/* Símbolo Omega — grueso, orientado a la izquierda */}
      <span style={{
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: size * 1.62,
        fontWeight: 700,
        color: ink,
        WebkitTextStroke: `0.5px ${ink}`,
        lineHeight: 1,
        letterSpacing: 0,
        filter: `drop-shadow(0 0 5px ${G}35)`,
      }}>Ω</span>
      {/* Divisor dorado — acento de marca */}
      <span style={{ width: 1.5, height: size * 0.78, background: `linear-gradient(180deg, transparent, ${G}80, transparent)`, borderRadius: 1, flexShrink: 0 }} />
      {/* Iniciales */}
      <span style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: size * 0.88,
        fontWeight: 700,
        letterSpacing: 4,
        color: ink,
        lineHeight: 1,
      }}>HUB</span>
    </div>
    {sub && <span style={{ fontSize: 8, color: isDark ? "#383838" : "#ABABBE", fontWeight: 600, position: "relative" }}>{sub}</span>}
  </div>
  );
};
