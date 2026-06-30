import { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo } from "react";

const ProductToolsApp = (() => {

const PLATFORMS = [
  { id: "aliexpress", name: "AliExpress", emoji: "🛒", available: true },
  { id: "temu",       name: "Temu",       emoji: "🏷️", available: false },
  { id: "alibaba",    name: "Alibaba",    emoji: "🏢", available: false },
  { id: "amazon",     name: "Amazon",     emoji: "📦", available: false },
  { id: "shein",      name: "Shein",      emoji: "👗", available: false },
];
const detectPlatform = (url = "") => {
  const u = url.toLowerCase();
  if (u.includes("aliexpress")) return PLATFORMS[0];
  if (u.includes("temu"))       return PLATFORMS[1];
  if (u.includes("alibaba"))    return PLATFORMS[2];
  if (u.includes("amazon"))     return PLATFORMS[3];
  if (u.includes("shein"))      return PLATFORMS[4];
  return null;
};
const IMP_STEPS = [
  "Resolviendo enlace",
  "Leyendo página del producto",
  "Extrayendo datos reales",
  "Procesando variantes",
  "Organizando especificaciones",
  "Generando borrador",
];
const CRE_STEPS = [
  "Analizando producto con IA",
  "Buscando datos reales del mercado",
  "Construyendo título de alto impacto",
  "Redactando copy de venta persuasivo",
  "Generando atributos y etiquetas",
  "Publicación lista",
];
// Categorías reales (con subcategorías) leídas de la plataforma; reflejan lo que el dueño edite.
const getRealCategories = () => {
  try {
    const cats = JSON.parse(localStorage.getItem("retador_cats") || "[]");
    const subs = JSON.parse(localStorage.getItem("retador_subcats") || "{}");
    const out = [];
    cats.forEach(c => {
      const sc = subs[c.id] || [];
      if (sc.length) sc.forEach(s => out.push(`${c.name} / ${s}`));
      else out.push(c.name);
    });
    return out.length ? out : ["General"];
  } catch { return ["General"]; }
};
const EXAMPLES = [
  "Gafas de sol polarizadas negras unisex, costaron $8",
  "Auriculares TWS blancos, cancelación de ruido, 20h batería, $15 USD",
  "Balón fútbol tamaño 5 azul/negro, cuero sintético, $6",
  "Mochila impermeable gris 30L con USB, $22 USD",
];
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ─── STYLES ─────────────────────────────────────────────────── */
const STYLE = `@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

.ptwrap *,.ptwrap *::before,.ptwrap *::after{box-sizing:border-box;margin:0;padding:0;}
.ptwrap,.ptwrap{overflow-x:hidden;max-width:100vw;}
.ptwrap{
  --bg:#07070A;--s1:#101013;--s2:#16161A;--s3:#1C1C22;
  --bd:rgba(255,255,255,0.07);--bdh:rgba(255,255,255,0.13);--bda:rgba(110,231,183,0.22);
  --tx:#F0F0F2;--tx2:#9494A0;--tx3:#484855;
  --ac:#6EE7B7;--ac2:#67E8F9;--acd:rgba(110,231,183,0.09);
  --warn:#FCD34D;--r:12px;--rs:8px;
  --f:'Sora',sans-serif;--m:'JetBrains Mono',monospace;
}
.ptwrap{background:var(--bg);color:var(--tx);font-family:var(--f);min-height:100%;}
.ptwrap .rt{
  width:100%;max-width:100%;overflow:visible;min-height:100%;
  background:var(--bg);
  background-image:radial-gradient(ellipse 80% 40% at 50% 0%,rgba(110,231,183,0.04) 0%,transparent 60%);
  padding:24px 16px 80px;
}
.ptwrap .inner{max-width:860px;margin:0 auto;width:100%;}
.ptwrap /* HEADER */
.hdr{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:20px;flex-wrap:wrap;}
.ptwrap .hdr-left{}
.ptwrap .hdr-badge{display:inline-flex;align-items:center;gap:5px;background:var(--acd);border:1px solid var(--bda);color:var(--ac);font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:3px 9px;border-radius:100px;}
.ptwrap .hdr-badge::before{content:'';width:5px;height:5px;background:var(--ac);border-radius:50%;animation:blink 2s infinite;}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.35}}
.ptwrap .hdr-title{font-size:20px;font-weight:800;letter-spacing:-.025em;margin-top:6px;}
.ptwrap .hdr-title em{color:var(--ac);font-style:normal;}
.ptwrap .hdr-sub{font-size:11px;color:var(--tx2);margin-top:3px;line-height:1.5;}
.ptwrap .hdr-pills{display:flex;gap:7px;flex-shrink:0;}
.ptwrap .pill{background:var(--s2);border:1px solid var(--bd);border-radius:var(--rs);padding:7px 11px;text-align:center;min-width:58px;}
.ptwrap .pill-v{font-size:14px;font-weight:700;color:var(--ac);font-family:var(--m);}
.ptwrap .pill-l{font-size:9px;color:var(--tx3);text-transform:uppercase;letter-spacing:.05em;margin-top:1px;}
.ptwrap /* TABS — fixed,.ptwrap no overflow */
.tabs{display:flex;flex-wrap:wrap;background:var(--s1);border:1px solid var(--bd);border-radius:var(--r);padding:3px;margin-bottom:20px;width:100%;}
.ptwrap .tab{
  flex:1 1 auto;min-width:max-content;display:flex;align-items:center;justify-content:center;gap:6px;
  padding:9px 8px;border-radius:9px;
  font-size:12px;font-weight:600;color:var(--tx2);
  cursor:pointer;transition:all .2s;border:none;background:transparent;font-family:var(--f);
  white-space:nowrap;overflow:visible;
}
.ptwrap .tab:hover{color:var(--tx);}
.ptwrap .tab.on{background:var(--s3);color:var(--tx);box-shadow:0 2px 10px rgba(0,0,0,.4);}
.ptwrap .tab-dot{width:6px;height:6px;border-radius:50%;background:var(--tx3);flex-shrink:0;transition:background .2s;}
.ptwrap .tab.on .tab-dot{background:var(--ac);}
.ptwrap .tab-badge{background:var(--acd);border:1px solid var(--bda);color:var(--ac);font-size:9px;font-weight:700;padding:1px 5px;border-radius:100px;flex-shrink:0;}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.35}}
.ptwrap /* CARDS */
.card{background:var(--s1);border:1px solid var(--bd);border-radius:var(--r);padding:16px 18px;width:100%;}
.ptwrap .card-ttl{font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--tx3);margin-bottom:12px;}
.ptwrap /* FORM */
.flbl{font-size:10px;color:var(--tx3);text-transform:uppercase;letter-spacing:.06em;font-weight:600;margin-bottom:5px;}
.ptwrap .frow{margin-bottom:11px;}
.ptwrap .frow:last-child{margin-bottom:0;}
.ptwrap .fin{width:100%;background:var(--s2);border:1px solid var(--bd);border-radius:var(--rs);padding:9px 11px;color:var(--tx);font-family:var(--f);font-size:13px;outline:none;transition:border-color .2s;resize:none;}
.ptwrap .fin:focus{border-color:var(--bda);}
.ptwrap .fin.ttl{font-weight:600;min-height:58px;font-size:13px;}
.ptwrap .fin.dsc{min-height:76px;font-size:12px;line-height:1.6;}
.ptwrap .twin{display:grid;grid-template-columns:1fr 1fr;gap:9px;}
.ptwrap /* STACK = vertical layout */
.stack{display:flex;flex-direction:column;gap:11px;}
.ptwrap /* ANALYSIS */
.anl-wrap{animation:fu .4s ease;}
@keyframes fu{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.ptwrap .anl-card{background:var(--s1);border:1px solid var(--bd);border-radius:var(--r);padding:36px 28px;text-align:center;max-width:440px;margin:0 auto;}
.ptwrap .anl-icon{width:54px;height:54px;background:var(--acd);border:1px solid var(--bda);border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:24px;margin:0 auto 14px;animation:bob 3s ease-in-out infinite;}
@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
.ptwrap .anl-title{font-size:16px;font-weight:700;margin-bottom:4px;}
.ptwrap .anl-sub{font-size:11px;color:var(--tx2);margin-bottom:22px;line-height:1.6;}
.ptwrap .step-list{display:flex;flex-direction:column;gap:6px;text-align:left;margin-bottom:18px;}
.ptwrap .step{display:flex;align-items:center;gap:9px;padding:8px 12px;border-radius:var(--rs);background:var(--s2);border:1px solid var(--bd);transition:all .25s;}
.ptwrap .step.on{border-color:var(--bda);background:var(--s3);}
.ptwrap .sico{width:17px;height:17px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;flex-shrink:0;}
.ptwrap .sico.pend{background:var(--s3);border:1px solid var(--bd);color:var(--tx3);}
.ptwrap .sico.run{background:var(--acd);border:1px solid var(--ac);animation:spin .9s linear infinite;}
@keyframes spin{to{transform:rotate(360deg)}}
.ptwrap .sico.done{background:var(--acd);border:1px solid var(--bda);color:var(--ac);animation:none;}
.ptwrap .slbl{font-size:11px;color:var(--tx2);flex:1;}
.ptwrap .step.on .slbl{color:var(--tx);font-weight:500;}
.ptwrap .prog{background:var(--s2);border-radius:100px;height:3px;overflow:hidden;}
.ptwrap .prog-fill{height:100%;background:linear-gradient(90deg,var(--ac),var(--ac2));border-radius:100px;transition:width .5s ease;}
.ptwrap .prog-pct{font-size:10px;color:var(--tx3);margin-top:6px;}
.ptwrap /* PREVIEW */
.prev-wrap{animation:fu .4s ease;width:100%;}
.ptwrap .prev-topbar{display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap;}
.ptwrap .back-btn{display:flex;align-items:center;gap:4px;background:var(--s2);border:1px solid var(--bd);border-radius:var(--rs);padding:6px 11px;font-size:11px;color:var(--tx2);cursor:pointer;font-family:var(--f);transition:all .2s;white-space:nowrap;}
.ptwrap .back-btn:hover{border-color:var(--bdh);color:var(--tx);}
.ptwrap .q-badge{display:flex;align-items:center;gap:4px;background:var(--acd);border:1px solid var(--bda);border-radius:100px;padding:3px 8px;font-size:10px;color:var(--ac);font-weight:600;white-space:nowrap;}
.ptwrap .q-dot{width:4px;height:4px;background:var(--ac);border-radius:50%;}
.ptwrap .mchips{display:flex;gap:5px;flex-wrap:wrap;}
.ptwrap .mchip{background:var(--s2);border:1px solid var(--bd);border-radius:100px;padding:2px 8px;font-size:10px;color:var(--tx3);white-space:nowrap;}
.ptwrap .src-note{font-size:11px;color:var(--tx3);background:var(--s2);border:1px solid var(--bd);border-radius:var(--rs);padding:7px 11px;margin-bottom:10px;line-height:1.6;}
.ptwrap .src-note em{color:var(--ac);font-style:normal;}
.ptwrap /* GALLERY */
.gal{background:var(--s1);border:1px solid var(--bd);border-radius:var(--r);overflow:hidden;margin-bottom:11px;}
.ptwrap .gal-main{aspect-ratio:1;background:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden;max-height:300px;}
.ptwrap .gal-main img{width:100%;height:100%;object-fit:contain;padding:14px;transition:transform .4s;}
.ptwrap .gal-main:hover img{transform:scale(1.04);}
.ptwrap .gal-no{width:100%;height:220px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--s2);color:var(--tx3);font-size:11px;gap:6px;}
.ptwrap .gal-thumbs{display:flex;gap:5px;padding:8px;overflow-x:auto;scrollbar-width:none;background:rgba(255,255,255,.02);}
.ptwrap .gal-thumbs::-webkit-scrollbar{display:none;}
.ptwrap .thumb{width:46px;height:46px;border-radius:5px;border:2px solid transparent;overflow:hidden;cursor:pointer;flex-shrink:0;background:#fff;}
.ptwrap .thumb.on{border-color:var(--ac);}
.ptwrap .thumb img{width:100%;height:100%;object-fit:contain;padding:2px;}
.ptwrap .gal-foot{padding:8px 11px;border-top:1px solid var(--bd);display:flex;justify-content:space-between;}
.ptwrap .gal-foot span{font-size:10px;color:var(--tx3);}
.ptwrap .gal-foot em{color:var(--ac);font-style:normal;font-weight:600;}
.ptwrap /* PRICES */
.price-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;}
.ptwrap .pbox{background:var(--s2);border:1px solid var(--bd);border-radius:var(--rs);padding:10px 12px;}
.ptwrap .pbox.hi{border-color:rgba(110,231,183,.2);}
.ptwrap .pbox-lbl{font-size:9px;text-transform:uppercase;letter-spacing:.07em;color:var(--tx3);margin-bottom:3px;}
.ptwrap .pbox-val{font-size:18px;font-weight:700;font-family:var(--m);line-height:1.2;}
.ptwrap .pbox-val.dim{color:var(--tx2);}
.ptwrap .pbox-val.bright{color:var(--ac);}
.ptwrap .pbox-cur{font-size:10px;font-weight:400;}
.ptwrap .pmeta{font-size:10px;color:var(--tx3);margin-top:2px;}
.ptwrap .pmeta em{color:var(--warn);font-style:normal;font-weight:600;}
.ptwrap /* VARIANTS */
.vgroup{margin-bottom:12px;}
.ptwrap .vgroup:last-child{margin-bottom:0;}
.ptwrap .vg-lbl{font-size:11px;font-weight:600;color:var(--tx2);margin-bottom:7px;}
.ptwrap .vopts{display:flex;flex-wrap:wrap;gap:5px;}
.ptwrap .vbtn{background:var(--s2);border:1px solid var(--bd);border-radius:var(--rs);padding:5px 10px;font-family:var(--f);font-size:11px;color:var(--tx2);cursor:pointer;transition:all .18s;display:flex;align-items:center;gap:4px;}
.ptwrap .vbtn.on{border-color:var(--ac);color:var(--ac);background:var(--acd);}
.ptwrap .cdot{width:9px;height:9px;border-radius:50%;flex-shrink:0;}
.ptwrap /* ATTRS */
.attrs-grid{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--bd);border-radius:var(--rs);overflow:hidden;}
.ptwrap .attr{background:var(--s2);padding:8px 10px;}
.ptwrap .attr-k{font-size:10px;color:var(--tx3);margin-bottom:1px;}
.ptwrap .attr-v{font-size:11px;font-weight:500;}
.ptwrap /* TAGS */
.tags{display:flex;flex-wrap:wrap;gap:5px;}
.ptwrap .tag{background:var(--s2);border:1px solid var(--bd);border-radius:100px;padding:3px 8px;font-size:11px;color:var(--tx2);display:flex;align-items:center;gap:3px;}
.ptwrap .tag-x{color:var(--tx3);cursor:pointer;font-size:12px;line-height:1;}
.ptwrap .tag-in{background:var(--s2);border:1px solid var(--bd);border-radius:100px;padding:3px 9px;font-size:11px;color:var(--tx2);font-family:var(--f);outline:none;width:80px;}
.ptwrap .tag-in:focus{border-color:var(--bda);}
.ptwrap /* ACTIONS */
.act-bar{margin-top:12px;display:flex;align-items:center;justify-content:flex-end;gap:7px;padding:12px 15px;background:var(--s1);border:1px solid var(--bd);border-radius:var(--r);flex-wrap:wrap;}
.ptwrap .act-info{font-size:10px;color:var(--tx3);margin-right:auto;}
.ptwrap .btn-g{background:transparent;border:1px solid var(--bd);color:var(--tx2);border-radius:var(--rs);padding:8px 13px;font-family:var(--f);font-size:12px;cursor:pointer;transition:all .2s;}
.ptwrap .btn-g:hover{border-color:var(--bdh);color:var(--tx);}
.ptwrap .btn-s{background:var(--s2);border:1px solid var(--bd);color:var(--tx);border-radius:var(--rs);padding:8px 13px;font-family:var(--f);font-size:12px;font-weight:500;cursor:pointer;transition:all .2s;}
.ptwrap .btn-p{background:var(--ac);color:#000;border:none;border-radius:var(--rs);padding:8px 16px;font-family:var(--f);font-size:12px;font-weight:700;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:6px;}
.ptwrap .btn-p:hover{background:#a7f3d0;transform:translateY(-1px);}
.ptwrap .btn-p:disabled{opacity:.4;cursor:not-allowed;transform:none;}
.ptwrap /* TOASTS */
.toasts{position:fixed;top:14px;right:14px;display:flex;flex-direction:column;gap:6px;z-index:999;pointer-events:none;}
.ptwrap .toast{background:var(--s1);border:1px solid var(--bd);border-radius:var(--rs);padding:10px 13px;font-size:11px;display:flex;align-items:center;gap:7px;pointer-events:all;max-width:260px;animation:si .3s ease;}
.ptwrap .toast.ok{border-color:var(--bda);}
@keyframes si{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:none}}
.ptwrap .spin-sm{width:12px;height:12px;border:2px solid var(--bd);border-top-color:var(--ac);border-radius:50%;animation:spin .8s linear infinite;flex-shrink:0;}
.ptwrap /* ── IMPORTADOR ── */
.plat-strip{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:12px;align-items:center;}
.ptwrap .plat-lbl{font-size:10px;color:var(--tx3);white-space:nowrap;}
.ptwrap .plat-chip{display:flex;align-items:center;gap:4px;background:var(--s2);border:1px solid var(--bd);border-radius:100px;padding:3px 8px;font-size:10px;color:var(--tx2);white-space:nowrap;}
.ptwrap .plat-chip.hit{border-color:var(--ac);color:var(--ac);background:var(--acd);}
.ptwrap .irow{display:flex;gap:7px;align-items:stretch;flex-wrap:wrap;}
.ptwrap .url-in{flex:1;min-width:0;background:var(--s2);border:1px solid var(--bd);border-radius:var(--rs);padding:10px 12px;color:var(--tx);font-family:var(--m);font-size:11px;outline:none;transition:border-color .2s;}
.ptwrap .url-in::placeholder{color:var(--tx3);font-family:var(--f);font-size:12px;}
.ptwrap .url-in:focus{border-color:var(--bda);}
.ptwrap .det{display:flex;align-items:center;gap:4px;white-space:nowrap;background:var(--s2);border:1px solid var(--bd);border-radius:var(--rs);padding:9px 10px;font-size:10px;color:var(--tx2);}
.ptwrap .det.hit{border-color:var(--ac);color:var(--ac);background:var(--acd);}
.ptwrap .anl-btn{background:var(--ac);color:#000;border:none;border-radius:var(--rs);padding:10px 18px;font-family:var(--f);font-weight:700;font-size:12px;cursor:pointer;white-space:nowrap;transition:all .2s;}
.ptwrap .anl-btn:hover{background:#a7f3d0;transform:translateY(-1px);}
.ptwrap .anl-btn:disabled{opacity:.35;cursor:not-allowed;transform:none;}
.ptwrap .hint{font-size:10px;color:var(--tx3);margin-top:7px;line-height:1.6;}
.ptwrap .feat-row{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:12px;}
@keyframes fu{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.ptwrap .feat-card{background:var(--s1);border:1px solid var(--bd);border-radius:var(--r);padding:13px;}
.ptwrap .feat-ic{font-size:17px;margin-bottom:6px;}
.ptwrap .feat-tt{font-size:12px;font-weight:600;margin-bottom:3px;}
.ptwrap .feat-ds{font-size:10px;color:var(--tx2);line-height:1.5;}
.ptwrap /* ── CREADOR ── */
.chat-box{background:var(--s1);border:1px solid var(--bd);border-radius:var(--r);padding:16px 18px;margin-bottom:11px;transition:border-color .3s;}
.ptwrap .chat-box:focus-within{border-color:var(--bda);}
.ptwrap .chat-lbl{font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--tx3);margin-bottom:6px;}
.ptwrap .chat-hint{font-size:11px;color:var(--tx2);margin-bottom:12px;line-height:1.6;padding:9px 11px;background:var(--s2);border:1px solid var(--bd);border-radius:var(--rs);}
.ptwrap .chat-hint strong{color:var(--tx);}
.ptwrap .ex-row{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:12px;}
.ptwrap .ex-chip{background:var(--s2);border:1px solid var(--bd);border-radius:var(--rs);padding:5px 10px;font-size:10px;color:var(--tx2);cursor:pointer;transition:all .18s;line-height:1.4;}
.ptwrap .ex-chip:hover{border-color:var(--bdh);color:var(--tx);}
.ptwrap .chat-row{display:flex;gap:7px;align-items:flex-end;}
.ptwrap .chat-in{flex:1;background:var(--s2);border:1px solid var(--bd);border-radius:var(--rs);padding:10px 12px;color:var(--tx);font-family:var(--f);font-size:12px;outline:none;resize:none;min-height:72px;line-height:1.6;transition:border-color .2s;}
.ptwrap .chat-in::placeholder{color:var(--tx3);}
.ptwrap .chat-in:focus{border-color:var(--bda);}
.ptwrap .chat-send{background:var(--ac);color:#000;border:none;border-radius:var(--rs);padding:10px 16px;font-family:var(--f);font-weight:700;font-size:12px;cursor:pointer;white-space:nowrap;transition:all .2s;align-self:flex-end;}
.ptwrap .chat-send:hover{background:#a7f3d0;transform:translateY(-1px);}
.ptwrap .chat-send:disabled{opacity:.35;cursor:not-allowed;transform:none;}
.ptwrap /* ── MARGIN CALCULATOR — single row,.ptwrap no overflow ── */
.margin-calc{background:var(--s1);border:1px solid var(--bd);border-radius:var(--r);padding:16px 18px;margin-bottom:11px;}
.ptwrap .mc-top{display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap;}
.ptwrap .mc-cost-lbl{font-size:11px;color:var(--tx2);white-space:nowrap;}
.ptwrap .mc-cost-in{background:var(--s2);border:1px solid var(--bd);border-radius:var(--rs);padding:7px 10px;color:var(--tx);font-family:var(--m);font-size:14px;font-weight:600;outline:none;width:100px;transition:border-color .2s;}
.ptwrap .mc-cost-in:focus{border-color:var(--bda);}
.ptwrap .mc-cur{background:var(--s2);border:1px solid var(--bd);border-radius:var(--rs);padding:7px 8px;color:var(--tx2);font-family:var(--f);font-size:11px;outline:none;cursor:pointer;}
.ptwrap /* single margin row — all in one block,.ptwrap stacked inside */
.mc-body{background:var(--s2);border:1px solid rgba(110,231,183,.2);border-radius:var(--rs);padding:14px 14px 12px;display:flex;flex-direction:column;gap:10px;}
.ptwrap /* top line: label + pct display + +/- buttons */
.mc-pct-row{display:flex;align-items:center;gap:8px;}
.ptwrap .mc-pct-lbl{font-size:11px;color:var(--tx2);flex:1;}
.ptwrap .mc-pct-val{font-family:var(--m);font-size:22px;font-weight:700;color:var(--ac);min-width:52px;text-align:center;}
.ptwrap .mc-pct-sym{font-size:13px;color:var(--tx3);}
.ptwrap .mc-stepper{display:flex;align-items:center;gap:4px;}
.ptwrap .mc-btn{width:28px;height:28px;border-radius:6px;background:var(--s3);border:1px solid var(--bd);color:var(--tx2);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .18s;flex-shrink:0;font-family:var(--f);}
.ptwrap .mc-btn:hover{border-color:var(--ac);color:var(--ac);}
.ptwrap /* slider */
.mc-slider{width:100%;-webkit-appearance:none;appearance:none;height:4px;background:var(--s3);border-radius:100px;outline:none;cursor:pointer;}
.ptwrap .mc-slider::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:var(--ac);cursor:pointer;border:2px solid var(--bg);box-shadow:0 0 0 2px rgba(110,231,183,.3);transition:transform .18s;}
.ptwrap .mc-slider::-webkit-slider-thumb:hover{transform:scale(1.2);}
.ptwrap .mc-slider::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:var(--ac);cursor:pointer;border:2px solid var(--bg);}
.ptwrap /* results row */
.mc-results{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.ptwrap .mc-res-box{background:var(--s1);border:1px solid var(--bd);border-radius:var(--rs);padding:9px 11px;}
.ptwrap .mc-res-box.hi{border-color:rgba(110,231,183,.2);}
.ptwrap .mc-res-lbl{font-size:9px;text-transform:uppercase;letter-spacing:.07em;color:var(--tx3);margin-bottom:3px;}
.ptwrap .mc-res-val{font-size:18px;font-weight:700;font-family:var(--m);color:var(--tx2);line-height:1.2;}
.ptwrap .mc-res-val.ac{color:var(--ac);}
.ptwrap .mc-res-sub{font-size:10px;color:var(--tx3);margin-top:2px;}
.ptwrap .mc-res-sub em{color:var(--warn);font-style:normal;font-weight:600;}
.ptwrap .mc-use-btn{background:var(--ac);color:#000;border:none;border-radius:var(--rs);padding:8px 14px;font-family:var(--f);font-weight:700;font-size:11px;cursor:pointer;transition:all .2s;width:100%;margin-top:2px;}
.ptwrap .mc-use-btn:hover{background:#a7f3d0;}
.ptwrap .mc-use-btn:disabled{opacity:.35;cursor:not-allowed;}
`;

/* ─── MARGIN CALCULATOR ─────────────────────────────────────── */
function MarginCalc({ initCost, initCurrency, onUse }) {
  const [cost, setCost] = useState(initCost != null ? String(initCost) : "");
  const [cur,  setCur]  = useState(initCurrency || "USD");
  const [pct,  setPct]  = useState(35);

  const c    = parseFloat(cost) || 0;
  const sell = c > 0 ? parseFloat((c / (1 - pct / 100)).toFixed(2)) : 0;
  const earn = c > 0 ? parseFloat((sell - c).toFixed(2)) : 0;

  const step = delta => setPct(p => Math.min(99, Math.max(1, parseFloat((p + delta).toFixed(1)))));

  return (
    <div className="margin-calc">
      <div className="card-ttl">Calculadora de margen de ganancia</div>

      {/* Cost input row */}
      <div className="mc-top">
        <span className="mc-cost-lbl">Precio de costo:</span>
        <input className="mc-cost-in" type="number" value={cost} min="0" step="0.01"
          placeholder="0.00" onChange={e => setCost(e.target.value)}/>
        <select className="mc-cur" value={cur} onChange={e => setCur(e.target.value)}>
          {["USD","EUR","MXN","COP","ARS","GBP"].map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Single margin control block */}
      <div className="mc-body">
        {/* Percent display + steppers */}
        <div className="mc-pct-row">
          <span className="mc-pct-lbl">Margen de ganancia</span>
          <div className="mc-stepper">
            <button className="mc-btn" onClick={() => step(-1)}>−</button>
            <div style={{textAlign:"center",minWidth:64}}>
              <span className="mc-pct-val">{pct % 1 === 0 ? pct : pct.toFixed(1)}</span>
              <span className="mc-pct-sym">%</span>
            </div>
            <button className="mc-btn" onClick={() => step(+1)}>+</button>
          </div>
        </div>

        {/* Slider */}
        <input className="mc-slider" type="range" min="1" max="90" step="0.5"
          value={pct} onChange={e => setPct(parseFloat(e.target.value))}/>

        {/* Results */}
        <div className="mc-results">
          <div className="mc-res-box">
            <div className="mc-res-lbl">Precio de venta</div>
            <div className={`mc-res-val ${c > 0 ? "ac" : ""}`}>
              {c > 0 ? sell.toFixed(2) : "—"}
              {c > 0 && <span style={{fontSize:10,fontWeight:400}}> {cur}</span>}
            </div>
            <div className="mc-res-sub">
              {c > 0
                ? <>Ganancia: <em>{earn.toFixed(2)} {cur}</em></>
                : "Ingresa tu costo arriba"}
            </div>
          </div>
          <div className="mc-res-box hi">
            <div className="mc-res-lbl">Costo del producto</div>
            <div className="mc-res-val">
              {c > 0 ? c.toFixed(2) : "—"}
              {c > 0 && <span style={{fontSize:10,fontWeight:400}}> {cur}</span>}
            </div>
            <div className="mc-res-sub">
              {c > 0 ? <>= {((c / sell) * 100).toFixed(1)}% del precio final</> : "sin costo"}
            </div>
          </div>
        </div>

        {onUse && (
          <button className="mc-use-btn" disabled={c === 0}
            onClick={() => onUse(sell, cur, pct)}>
            Usar este precio → {c > 0 ? `${sell.toFixed(2)} ${cur}` : ""}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── IMPORTADOR ────────────────────────────────────────────── */
function Importador({ onPublish }) {
  const [phase, setPhase]     = useState("input");
  const [url, setUrl]         = useState("");
  const [stepIdx, setStepIdx] = useState(-1);
  const [done, setDone]       = useState([]);
  const [product, setProduct] = useState(null);
  const [edited, setEdited]   = useState(null);
  const [imgIdx, setImgIdx]   = useState(0);
  const [selVar, setSelVar]   = useState({});
  const [newTag, setNewTag]   = useState("");
  const [err, setErr]         = useState(null);

  const detPlat = detectPlatform(url);
  const pct = Math.round((done.length / IMP_STEPS.length) * 100);
  const adv = i => setStepIdx(i);
  const comp = i => setDone(d => [...d, i]);

  const analyse = async () => {
    if (!url.trim()) return;
    const plat = detectPlatform(url);
    if (!plat || !plat.available) { setErr({ kind: "unsupported", name: plat?.name }); setPhase("error"); return; }
    setErr(null); setPhase("analysis"); setDone([]);
    // Motor real: extraer el ID del producto de AliExpress
    const idMatch = url.match(/\/item\/(\d+)/) || url.match(/(\d{8,})/);
    const productId = idMatch ? idMatch[1] : null;
    for (let i = 0; i < IMP_STEPS.length; i++) {
      adv(i); await sleep([500,900,700,500,500,400][i]); comp(i);
    }
    // Llamada al backend de importación (AliExpress Dropshipping API).
    // Cuando el backend exista, devuelve el producto real y entra al preview.
    try {
      const res = await fetch("/api/import/aliexpress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, productId }),
      });
      if (!res.ok) throw new Error("backend-" + res.status);
      const data = await res.json();
      setProduct(data); setEdited({ ...data });
      setSelVar({}); setImgIdx(0); setPhase("preview");
    } catch (e) {
      // El motor está listo; falta conectar el backend de importación.
      setErr({ kind: "backend", productId }); setPhase("error");
    }
  };

  const field = (k,v) => setEdited(p=>({...p,[k]:v}));
  const rmTag = t => setEdited(p=>({...p,tags:p.tags.filter(x=>x!==t)}));
  const addTag = () => { if(!newTag.trim()) return; setEdited(p=>({...p,tags:[...p.tags,newTag.trim()]})); setNewTag(""); };
  const reset = () => { setPhase("input"); setUrl(""); setProduct(null); setEdited(null); setDone([]); };
  const p = edited || product;
  const margin = p?.suggestedPrice && p?.originPrice
    ? (((p.suggestedPrice-p.originPrice)/p.suggestedPrice)*100).toFixed(0) : 0;

  if (phase === "analysis") return (
    <div className="anl-wrap">
      <div className="anl-card">
        <div className="anl-icon">🔗</div>
        <h2 className="anl-title">Analizando enlace</h2>
        <p className="anl-sub">Extrayendo datos de <strong style={{color:"var(--ac)"}}>{detPlat?.name||"la tienda"}</strong></p>
        <div className="step-list">
          {IMP_STEPS.map((s,i)=>{
            const isDone=done.includes(i); const isOn=stepIdx===i&&!isDone;
            return (
              <div key={i} className={`step ${isOn?"on":""}`}>
                <div className={`sico ${isDone?"done":isOn?"run":"pend"}`}>{isDone?"✓":isOn?"◌":"·"}</div>
                <div className="slbl">{s}</div>
              </div>
            );
          })}
        </div>
        <div className="prog"><div className="prog-fill" style={{width:`${pct}%`}}/></div>
        <div className="prog-pct">{pct}% completado</div>
      </div>
    </div>
  );

  if (phase === "error") return (
    <div className="anl-wrap">
      <div className="anl-card">
        <div className="anl-icon">{err?.kind === "unsupported" ? "🚫" : "🔌"}</div>
        <h2 className="anl-title">{err?.kind === "unsupported" ? "Tienda no disponible" : "Motor listo · falta el servidor"}</h2>
        <p className="anl-sub">
          {err?.kind === "unsupported"
            ? <>Por ahora solo se importa desde <strong style={{color:"var(--ac)"}}>AliExpress</strong>.{err?.name ? ` ${err.name} todavía no está disponible.` : ""}</>
            : <>El importador leyó el enlace{err?.productId ? <> (producto <strong style={{color:"var(--ac)"}}>#{err.productId}</strong>)</> : ""} y quedó listo para traer los datos reales. Falta conectar el backend de AliExpress, que se construye en la siguiente fase.</>}
        </p>
        <button className="anl-btn" style={{marginTop:18}} onClick={reset}>← Volver</button>
      </div>
    </div>
  );

  if (phase === "preview" && p) return (
    <>
      <div className="prev-wrap">
        <div className="prev-topbar">
          <button className="back-btn" onClick={reset}>← Nuevo enlace</button>
          <div className="q-badge"><div className="q-dot"/>{p.importQuality}% calidad</div>
          <div className="mchips">
            <div className="mchip">📸 {p.images.length} imgs</div>
            <div className="mchip">🎨 {p.variants.reduce((a,v)=>a+v.options.length,0)} vars</div>
            <div className="mchip">⚙️ {p.attributes.length} attrs</div>
          </div>
        </div>
        {p.sourceNote && <div className="src-note">🔍 <em>Fuente:</em> {p.sourceNote}</div>}
        <div className="stack">
          <div className="gal">
            <div className="gal-main">
              <img src={p.images[imgIdx]} alt="product"
                onError={e=>{e.target.src="https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&q=80";}}/>
            </div>
            {p.images.length>1&&<div className="gal-thumbs">
              {p.images.map((img,i)=>(
                <div key={i} className={`thumb ${i===imgIdx?"on":""}`} onClick={()=>setImgIdx(i)}>
                  <img src={img} alt="" onError={e=>{e.target.style.display="none"}}/>
                </div>
              ))}
            </div>}
            <div className="gal-foot"><span><em>{p.images.length}</em> imágenes</span><span>hover=zoom</span></div>
          </div>
          <div className="card">
            <div className="card-ttl">Información del producto</div>
            <div className="frow"><div className="flbl">Título</div><textarea className="fin ttl" value={p.title} onChange={e=>field("title",e.target.value)}/></div>
            <div className="frow"><div className="flbl">Descripción</div><textarea className="fin dsc" value={p.description} onChange={e=>field("description",e.target.value)}/></div>
            <div className="twin">
              <div className="frow" style={{marginBottom:0}}><div className="flbl">Marca</div><input className="fin" value={p.brand||""} onChange={e=>field("brand",e.target.value)}/></div>
              <div className="frow" style={{marginBottom:0}}><div className="flbl">SKU</div><input className="fin" style={{fontFamily:"var(--m)",fontSize:11}} value={p.sku||""} onChange={e=>field("sku",e.target.value)}/></div>
            </div>
            <div className="frow" style={{marginTop:10}}><div className="flbl">Categoría</div><input className="fin" value={p.category||""} onChange={e=>field("category",e.target.value)}/></div>
          </div>
          <div className="card">
            <div className="card-ttl">Precios</div>
            <div className="price-grid">
              <div className="pbox"><div className="pbox-lbl">Precio origen</div><div className="pbox-val dim">{p.originPrice?.toFixed(2)}<span className="pbox-cur"> {p.currency}</span></div><div className="pmeta">{p.platform}</div></div>
              <div className="pbox hi"><div className="pbox-lbl">Precio sugerido</div><div className="pbox-val bright">{p.suggestedPrice?.toFixed(2)}<span className="pbox-cur"> {p.currency}</span></div><div className="pmeta">Margen: <em>{margin}%</em></div></div>
            </div>
            <div className="twin">
              <div><div className="flbl">Precio venta</div><input className="fin" type="number" defaultValue={p.suggestedPrice} step="0.01"/></div>
              <div><div className="flbl">Inventario</div><input className="fin" type="number" defaultValue={10}/></div>
            </div>
          </div>
          {p.variants.length>0&&<div className="card">
            <div className="card-ttl">Variantes</div>
            {p.variants.map(g=>(
              <div key={g.type} className="vgroup">
                <div className="vg-lbl">{g.type}</div>
                <div className="vopts">
                  {g.options.map(o=>(
                    <button key={o.value} className={`vbtn ${selVar[g.type]===o.value?"on":""}`}
                      onClick={()=>setSelVar(s=>({...s,[g.type]:o.value}))}>
                      {o.color&&<div className="cdot" style={{background:o.color}}/>}{o.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>}
          <div className="card">
            <div className="card-ttl">Especificaciones</div>
            <div className="attrs-grid">
              {p.attributes.map(a=><div key={a.key} className="attr"><div className="attr-k">{a.key}</div><div className="attr-v">{a.val}</div></div>)}
            </div>
          </div>
          <div className="card">
            <div className="card-ttl">Etiquetas</div>
            <div className="tags">
              {p.tags.map(t=><div key={t} className="tag">#{t}<span className="tag-x" onClick={()=>rmTag(t)}>×</span></div>)}
              <input className="tag-in" placeholder="+ agregar" value={newTag} onChange={e=>setNewTag(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addTag()}/>
            </div>
          </div>
        </div>
      </div>
      <div className="act-bar">
        <span className="act-info">Listo · {new Date().toLocaleDateString("es-MX",{day:"numeric",month:"long"})}</span>
        <button className="btn-g" onClick={reset}>Cancelar</button>
        <button className="btn-s">Guardar borrador</button>
        <button className="btn-p" onClick={() => onPublish && onPublish(p)}>⚡ Importar</button>
      </div>
    </>
  );

  return (
    <>
      <div className="plat-strip">
        <span className="plat-lbl">Compatible:</span>
        {PLATFORMS.map(pl=>(
          <div key={pl.id} className={`plat-chip ${pl.available?(detPlat?.id===pl.id?"hit":""):"soon"}`}><span>{pl.emoji}</span>{pl.name}{!pl.available&&<span style={{opacity:.7,marginLeft:2}}>· pronto</span>}</div>
        ))}
        <div className="plat-chip">🔮 +más</div>
      </div>
      <div className="card" style={{marginBottom:11}}>
        <div className="card-ttl">Enlace del producto</div>
        <div className="irow">
          <input className="url-in" value={url} onChange={e=>setUrl(e.target.value)}
            placeholder="https://www.amazon.es/dp/... · aliexpress.com/item/..."
            onKeyDown={e=>e.key==="Enter"&&url.trim()&&analyse()}/>
          <div className={`det ${detPlat?"hit":""}`}>{detPlat?<><span>{detPlat.emoji}</span>{detPlat.name}</>:"⬅ enlace"}</div>
          <button className="anl-btn" onClick={analyse} disabled={!url.trim()}>Analizar →</button>
        </div>
        <div className="hint">💡 Pega la URL completa desde la barra del navegador.</div>
      </div>
      <div className="feat-row">
        {[["🔗","Cualquier enlace","URLs directas y enlaces cortos de todas las plataformas."],
          ["⚙️","Variantes auto","Colores, tallas y capacidades detectados."],
          ["✏️","Editor inline","Ajusta todo antes de publicar."]].map(([ic,tt,ds])=>(
          <div key={tt} className="feat-card"><div className="feat-ic">{ic}</div><div className="feat-tt">{tt}</div><div className="feat-ds">{ds}</div></div>
        ))}
      </div>
    </>
  );
}

/* ─── CREADOR ───────────────────────────────────────────────── */
function Creador({ onPublish }) {
  const [phase, setPhase]     = useState("input");
  const [input, setInput]     = useState("");
  const [stepIdx, setStepIdx] = useState(-1);
  const [done, setDone]       = useState([]);
  const [product, setProduct] = useState(null);
  const [edited, setEdited]   = useState(null);
  const [newTag, setNewTag]   = useState("");
  const [imgs, setImgs]       = useState([]);
  const addImgs = (files) => {
    Array.from(files || []).slice(0, 6).forEach(f => {
      const r = new FileReader();
      r.onload = () => setImgs(prev => prev.length >= 6 ? prev : [...prev, r.result]);
      r.readAsDataURL(f);
    });
  };

  const pct = Math.round((done.length / CRE_STEPS.length) * 100);
  const adv = i => setStepIdx(i);
  const comp = i => setDone(d => [...d, i]);

  const generate = async () => {
    if (!input.trim()) return;
    setPhase("analysis"); setDone([]);

    // Animation and API in parallel
    const animPromise = (async () => {
      const timings = [300, 350, 350, 380, 280, 240];
      for (let i = 0; i < CRE_STEPS.length; i++) {
        adv(i); await sleep(timings[i]); comp(i);
      }
    })();

    const apiPromise = (async () => {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1400,
          system: `Eres el mejor redactor de fichas de producto para un marketplace premium. Conviertes notas informales de un vendedor en una publicación ELEGANTE y orientada a vender, con TODOS los datos técnicos bien ordenados.

CÓMO ESCRIBES (calidad innegociable):
- Título: limpio y profesional, marca + modelo + 2-3 specs que más venden (ej. almacenamiento, pantalla, cámara o batería). Máx 90 caracteres. Nada de precio.
- Descripción: 2-3 oraciones con gancho real, que transmitan la experiencia y el beneficio para el comprador, fluidas y elegantes — no robóticas. Prohibido el relleno vacío tipo "excelente calidad", "el mejor del mercado", "no te lo pierdas". Si el vendedor da muchos datos, la descripción debe sonar a ficha premium, no a lista seca.
- Atributos: EXTRAE CON PRECISIÓN cada dato técnico que aparezca (RAM, almacenamiento, pantalla, procesador, cámara, batería, carga, color, conectividad, material, accesorios incluidos como el cargador, etc.). No inventes datos que no estén; no omitas datos que sí estén.
- Variantes: si menciona color/capacidad/talla, créalas con su #hex si es color.
- Highlights: 3 beneficios concretos basados en los datos reales (ej. "Carga del 0 al 100% en minutos con 90W"), nunca genéricos.

REGLA DE ORO DEL PRECIO (la más importante):
- El precio de costo es información PRIVADA del vendedor. JAMÁS, bajo ninguna circunstancia, aparece en title, description, hook, highlights, attributes ni tags.
- El número que el vendedor diga que le costó va ÚNICAMENTE en el campo "costPrice". Punto.
- Si dudas, NO escribas ninguna cifra de dinero en ningún texto visible.

SALIDA: SOLO JSON válido, sin backticks, sin texto antes ni después.`,
          messages: [{
            role: "user",
            content: `Descripción del vendedor: "${input}"

Genera la publicación. Recuerda: el precio de costo va SOLO en "costPrice", NUNCA en título, descripción ni highlights.

Para "category" elige la opción que MEJOR encaje EXACTAMENTE de esta lista (cópiala tal cual, formato "Categoría / Subcategoría"):
${getRealCategories().join(" · ")}

Devuelve ÚNICAMENTE este JSON:
{
  "title": "nombre + características principales, máx 90 chars, sin precio",
  "description": "2 oraciones directas con beneficios concretos para el comprador, sin mencionar precio",
  "hook": "frase gancho impactante máx 10 palabras, sin precio",
  "brand": "marca si se menciona, sino null",
  "category": "una opción EXACTA de la lista de arriba",
  "costPrice": número puro extraído del texto o null,
  "currency": "moneda mencionada o USD",
  "sku": null,
  "importQuality": número 82-97 según info disponible,
  "attributes": [{"key": "atributo", "val": "valor específico"}],
  "variants": [{"type": "tipo", "options": [{"label": "nombre", "value": "val", "color": "#hex_si_color"}]}],
  "tags": ["tag1","tag2","tag3","tag4","tag5"],
  "highlights": ["beneficio concreto 1", "beneficio concreto 2", "beneficio concreto 3"],
  "logistic": {"weight": null, "dimensions": null}
}`
          }],
        }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
      const m = text.match(/\{[\s\S]*\}/);
      return m ? JSON.parse(m[0]) : null;
    })();

    const results = await Promise.allSettled([animPromise, apiPromise]);
    const apiResult = results[1];
    const prod = apiResult.status === "fulfilled" ? apiResult.value : null;

    const final = prod || {
      title: input.replace(/\$?\d+(\.\d+)?\s*(usd|eur|dólares?|euros?)?/gi, "").trim().slice(0, 80),
      description: "Descubre este producto diseñado para facilitar tu día a día.",
      hook: null, brand: null, category: "General",
      costPrice: null, currency: "USD", sku: null,
      importQuality: 78, attributes: [], variants: [],
      tags: [], highlights: [], logistic: {},
    };

    // Safety net: strip any price leak from title/description/hook
    const pricePattern = /\$\s*\d+(\.\d+)?|\d+(\.\d+)?\s*(usd|eur|dólares?|euros?|pesos?)/gi;
    if (final.title)       final.title       = final.title.replace(pricePattern, "").replace(/\s+/g," ").trim();
    if (final.description) final.description = final.description.replace(pricePattern, "").replace(/\s+/g," ").trim();
    if (final.hook)        final.hook        = final.hook.replace(pricePattern, "").replace(/\s+/g," ").trim();
    if (Array.isArray(final.highlights)) {
      final.highlights = final.highlights.map(h => h.replace(pricePattern, "").trim());
    }

    final.variants   = final.variants   || [];
    final.attributes = final.attributes || [];
    final.tags       = final.tags       || [];
    final.highlights = final.highlights || [];

    if (final.costPrice) {
      // margen por defecto 35% → el vendedor lo ajusta con la calculadora
      final.suggestedPrice = parseFloat((final.costPrice / (1 - 0.35)).toFixed(2));
    }

    setProduct(final);
    setEdited({ ...final });
    setPhase("preview");
  };

  const field = (k,v) => setEdited(p=>({...p,[k]:v}));
  const rmTag = t => setEdited(p=>({...p,tags:p.tags.filter(x=>x!==t)}));
  const addTag = () => { if(!newTag.trim()) return; setEdited(p=>({...p,tags:[...p.tags,newTag.trim()]})); setNewTag(""); };
  const reset = () => { setPhase("input"); setInput(""); setProduct(null); setEdited(null); setDone([]); };
  const p = edited || product;

  if (phase === "analysis") return (
    <div className="anl-wrap">
      <div className="anl-card">
        <div className="anl-icon">⚡</div>
        <h2 className="anl-title">Generando publicación</h2>
        <p className="anl-sub">Buscando datos reales y construyendo<br/>tu listado de alto impacto…</p>
        <div className="step-list">
          {CRE_STEPS.map((s,i)=>{
            const isDone=done.includes(i); const isOn=stepIdx===i&&!isDone;
            return (
              <div key={i} className={`step ${isOn?"on":""}`}>
                <div className={`sico ${isDone?"done":isOn?"run":"pend"}`}>{isDone?"✓":isOn?"◌":"·"}</div>
                <div className="slbl">{s}</div>
              </div>
            );
          })}
        </div>
        <div className="prog"><div className="prog-fill" style={{width:`${pct}%`}}/></div>
        <div className="prog-pct">{pct}% completado</div>
      </div>
    </div>
  );

  if (phase === "preview" && p) return (
    <>
      <div className="prev-wrap">
        <div className="prev-topbar">
          <button className="back-btn" onClick={reset}>← Nueva descripción</button>
          <div className="q-badge"><div className="q-dot"/>{p.importQuality||88}% calidad</div>
          <div className="mchips">
            {p.category && <div className="mchip">📂 {p.category}</div>}
            {p.brand    && <div className="mchip">🏷️ {p.brand}</div>}
            {p.highlights?.length > 0 && <div className="mchip">✅ {p.highlights.length} highlights</div>}
          </div>
        </div>

        {/* Hook banner */}
        {p.hook && (
          <div style={{background:"var(--acd)",border:"1px solid var(--bda)",borderRadius:"var(--rs)",padding:"10px 14px",marginBottom:11,display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:16}}>⚡</span>
            <span style={{fontSize:13,fontWeight:600,color:"var(--ac)"}}>{p.hook}</span>
          </div>
        )}

        <div className="stack">
          {/* Subir imágenes (el Creador no trae fotos: las pone el vendedor) */}
          <div className="card">
            <div className="card-ttl">Imágenes del producto</div>
            <div style={{fontSize:11,color:"var(--tx3)",marginBottom:10}}>Agrega tus fotos para que el producto se vea profesional y venda más. Sin imágenes no luce igual.</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {imgs.map((src,i)=>(
                <div key={i} style={{position:"relative",width:72,height:72,borderRadius:10,overflow:"hidden",border:"1px solid var(--bd)"}}>
                  <img src={src} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  <button onClick={()=>setImgs(prev=>prev.filter((_,j)=>j!==i))} style={{position:"absolute",top:2,right:2,width:18,height:18,borderRadius:"50%",border:"none",background:"rgba(0,0,0,.65)",color:"#fff",fontSize:11,cursor:"pointer",lineHeight:1}}>×</button>
                </div>
              ))}
              {imgs.length < 6 && (
                <label style={{width:72,height:72,borderRadius:10,border:"1.5px dashed var(--bd2)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,cursor:"pointer",color:"var(--tx2)",fontSize:10}}>
                  <span style={{fontSize:20,lineHeight:1}}>+</span>Foto
                  <input type="file" accept="image/*" multiple style={{display:"none"}} onChange={e=>addImgs(e.target.files)}/>
                </label>
              )}
            </div>
          </div>

          {p.highlights?.length > 0 && (
            <div className="card">
              <div className="card-ttl">Puntos clave de venta</div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {p.highlights.map((h,i) => (
                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,padding:"7px 10px",background:"var(--s2)",borderRadius:"var(--rs)",border:"1px solid var(--bd)"}}>
                    <span style={{color:"var(--ac)",fontSize:12,marginTop:1,flexShrink:0}}>✓</span>
                    <span style={{fontSize:12,color:"var(--tx2)",lineHeight:1.5}}>{h}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <MarginCalc
            initCost={p.costPrice} initCurrency={p.currency||"USD"}
            onUse={(sell,cur,mPct)=>setEdited(prev=>({...prev,suggestedPrice:sell,currency:cur}))}
          />
          <div className="card">
            <div className="card-ttl">Publicación generada</div>
            <div className="frow"><div className="flbl">Título</div><textarea className="fin ttl" value={p.title||""} onChange={e=>field("title",e.target.value)}/></div>
            <div className="frow"><div className="flbl">Descripción</div><textarea className="fin dsc" value={p.description||""} onChange={e=>field("description",e.target.value)}/></div>
            <div className="twin">
              <div className="frow" style={{marginBottom:0}}><div className="flbl">Marca</div><input className="fin" value={p.brand||""} onChange={e=>field("brand",e.target.value)} placeholder="Detectada por IA"/></div>
              <div className="frow" style={{marginBottom:0}}><div className="flbl">SKU</div><input className="fin" style={{fontFamily:"var(--m)",fontSize:11}} value={p.sku||""} onChange={e=>field("sku",e.target.value)} placeholder="Opcional"/></div>
            </div>
            <div className="frow" style={{marginTop:10}}><div className="flbl">Categoría</div>
              <select className="fin" value={p.category||""} onChange={e=>field("category",e.target.value)}>
                {getRealCategories().map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="card">
            <div className="card-ttl">Precio seleccionado</div>
            <div className="price-grid">
              <div className="pbox"><div className="pbox-lbl">Costo</div><div className="pbox-val dim">{p.costPrice?`${Number(p.costPrice).toFixed(2)}`:"—"}<span className="pbox-cur"> {p.currency||"USD"}</span></div></div>
              <div className="pbox hi"><div className="pbox-lbl">Precio de venta</div><div className="pbox-val bright">{p.suggestedPrice?`${Number(p.suggestedPrice).toFixed(2)}`:"—"}<span className="pbox-cur"> {p.currency||"USD"}</span></div></div>
            </div>
            <div className="twin">
              <div><div className="flbl">Ajustar precio</div><input className="fin" type="number" value={p.suggestedPrice||""} step="0.01" onChange={e=>field("suggestedPrice",parseFloat(e.target.value))}/></div>
              <div><div className="flbl">Inventario</div><input className="fin" type="number" defaultValue={10}/></div>
            </div>
          </div>
          {p.attributes.length>0&&<div className="card">
            <div className="card-ttl">Atributos detectados</div>
            <div className="attrs-grid">
              {p.attributes.map(a=><div key={a.key} className="attr"><div className="attr-k">{a.key}</div><div className="attr-v">{a.val}</div></div>)}
            </div>
          </div>}
          <div className="card">
            <div className="card-ttl">Etiquetas</div>
            <div className="tags">
              {p.tags.map(t=><div key={t} className="tag">#{t}<span className="tag-x" onClick={()=>rmTag(t)}>×</span></div>)}
              <input className="tag-in" placeholder="+ agregar" value={newTag} onChange={e=>setNewTag(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addTag()}/>
            </div>
          </div>
        </div>
      </div>
      <div className="act-bar">
        <span className="act-info">Listo · {new Date().toLocaleDateString("es-MX",{day:"numeric",month:"long"})}</span>
        <button className="btn-g" onClick={reset}>Cancelar</button>
        <button className="btn-s">Guardar borrador</button>
        <button className="btn-p" onClick={() => onPublish && onPublish({...p, userImages: imgs})}>✨ Publicar</button>
      </div>
    </>
  );

  return (
    <>
      <div className="chat-box">
        <div className="chat-lbl">Describe tu producto</div>
        <div className="chat-hint">
          Escribe en lenguaje natural: <strong>nombre, color, material, precio de costo, marca si la sabes</strong>. La IA busca datos reales y genera un listado listo para vender.
        </div>
        <div className="chat-row">
          <textarea className="chat-in" value={input} onChange={e=>setInput(e.target.value)}
            placeholder="Ej: Auriculares TWS negros, cancelación de ruido, 30h batería, $12 USD, marca Baseus…"
            onKeyDown={e=>{ if(e.key==="Enter"&&e.ctrlKey&&input.trim()) generate(); }}/>
          <button className="chat-send" onClick={generate} disabled={!input.trim()}>Generar →</button>
        </div>
        <div className="hint">💡 Ctrl+Enter para enviar · La IA busca specs reales del producto si lo reconoce.</div>
      </div>
      <MarginCalc initCost={null} initCurrency="USD" onUse={null}/>
      <div className="feat-row">
        {[["🔍","Busca datos reales","Si reconoce el producto, busca en internet sus especificaciones técnicas reales."],
          ["💥","Copy de alto impacto","Títulos y descripciones orientados a vender, no a describir."],
          ["⚡","Generación rápida","Animación y API en paralelo para resultados en segundos."]].map(([ic,tt,ds])=>(
          <div key={tt} className="feat-card"><div className="feat-ic">{ic}</div><div className="feat-tt">{tt}</div><div className="feat-ds">{ds}</div></div>
        ))}
      </div>
    </>
  );
}

/* ─── ROOT ──────────────────────────────────────────────────── */
function PT_Root({ onPublish, onClose, canUse }) {
  const [tab, setTab] = useState("importador");
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = STYLE;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  return (
    <div className="ptwrap">
    <div className="rt">
      <div className="toasts">
        {toasts.map(t=>(
          <div key={t.id} className={`toast ${t.type}`}>
            {t.type==="info"?<div className="spin-sm"/>:<span style={{color:"var(--ac)"}}>✓</span>}
            {t.msg}
          </div>
        ))}
      </div>

      <div className="inner">
        {/* Header */}
        <div className="hdr">
          <div className="hdr-left">
            <button onClick={onClose} style={{background:'transparent',border:'1px solid var(--bd)',color:'var(--tx2)',borderRadius:8,padding:'6px 12px',fontSize:12,fontWeight:600,cursor:'pointer',marginBottom:10,fontFamily:'var(--f)'}}>‹ Volver a RETADOR</button>
            <div className="hdr-badge">⚡ Plan Premium</div>
            <h1 className="hdr-title">Importador <em>Inteligente</em></h1>
            <p className="hdr-sub">Importa desde AliExpress o crea publicaciones desde cero con IA.</p>
          </div>
          <div className="hdr-pills" style={{display:'none'}}>
            <div className="pill"><div className="pill-v">2</div><div className="pill-l">Tools</div></div>
            <div className="pill"><div className="pill-v">∞</div><div className="pill-l">Productos</div></div>
          </div>
        </div>

        {/* Tabs — full width, no overflow */}
        <div className="tabs">
          <button className={`tab ${tab==="importador"?"on":""}`} onClick={()=>setTab("importador")}>
            <div className="tab-dot"/>
            🔗 Importador Inteligente
            <span className="tab-badge">URL</span>
          </button>
          <button className={`tab ${tab==="creador"?"on":""}`} onClick={()=>setTab("creador")}>
            <div className="tab-dot"/>
            ✨ Creador Inteligente
            <span className="tab-badge">IA</span>
          </button>
        </div>

        {/* Content */}
        {tab === "importador" && <Importador onPublish={onPublish}/>}
        {tab === "creador"    && <Creador onPublish={onPublish}/>}
      </div>
    </div>
    </div>
  );
}

return PT_Root;
})();
export default ProductToolsApp;
