import { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo, memo } from "react";
import { G, systemRating, systemReviews, useCatalog, Avatar, avatarUrlOf, money, supabase, adminDashboardStats, adminListUsers, adminSetVerified, adminSetSuspended, getSellerProductCount, adminListProducts, adminModerateProduct, getProfilesByIds, adminListVerifications, adminReviewVerification, kycSignedUrl, adminListPlanRequests, adminReviewPlan, adminListOrders, adminListAdmins, adminListLogs, adminListPromoted, adminSetPromoted, listLedger, adminMarkCommissionPaid, adminListStaff, adminGrantStaff, adminRevokeStaff, staffPendingCounts } from "../shared/index.js";
// Editor Visual (renovación): modelo maestros+referencias y render compartido.
import { SCREENS, FORMATS, CTA_POS, RET_BGS, SCREEN_ANCHORS, mkId, blankMaster, isAnchor, ratioOf, BlockView } from "../shared/index.js";

const OmniPanel = (() => {

const CSS=`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');


.omni *,.omni *::before,.omni *::after{box-sizing:border-box;margin:0;padding:0}
.omni{
  --bg:#07080d;--bg1:#0d0f18;--bg2:#111525;--bg3:#171b2e;
  --bd:rgba(255,255,255,0.06);--bd2:rgba(255,255,255,0.10);
  --tx:#e8eaf2;--tx2:#8890aa;--tx3:#4a5070;
  --ac:#4f72ff;--ac2:#6b8fff;--ag:rgba(79,114,255,0.12);
  --gn:#22d3a0;--gnb:rgba(34,211,160,0.08);
  --rd:#f05a5a;--rdb:rgba(240,90,90,0.08);
  --yw:#f5a623;--ywb:rgba(245,166,35,0.08);
  --pp:#a78bfa;--ppb:rgba(167,139,250,0.08);
  --fn:'Sora',sans-serif;--mo:'JetBrains Mono',monospace;
}
.omni{height:100%;background:var(--bg);color:var(--tx);font-family:var(--fn);font-size:14px;overflow:hidden}
.omni ::-webkit-scrollbar{width:4px;height:4px}
.omni ::-webkit-scrollbar-thumb{background:var(--bg3);border-radius:4px}
.omni ::-webkit-scrollbar-track{background:transparent}


.omni .shell{display:flex;height:100%;overflow:hidden}

.omni .sb{width:220px;min-width:220px;background:var(--bg1);border-right:1px solid var(--bd);display:flex;flex-direction:column;transition:width .18s,min-width .18s;z-index:50;overflow:hidden}
.omni .sb.col{width:54px;min-width:54px}
.omni.nar .sb{position:absolute;left:0;top:0;bottom:0;width:236px;min-width:236px;transform:translateX(-100%);z-index:70;transition:transform .22s ease}
.omni.nar .sb.open{transform:translateX(0);box-shadow:6px 0 44px rgba(0,0,0,.5)}
.omni .sb-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.5);z-index:65}
.omni .sbl{height:56px;display:flex;align-items:center;padding:0 13px;border-bottom:1px solid var(--bd);gap:9px;flex-shrink:0}
.omni .sbm{width:27px;height:27px;border-radius:8px;flex-shrink:0;background:linear-gradient(135deg,var(--ac),#7c3aed);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#fff}
.omni .sbback{display:flex;align-items:center;gap:5px;height:30px;padding:0 12px 0 9px;border-radius:9px;flex-shrink:0;background:var(--bg2);border:1px solid var(--bd2);color:var(--tx2);font-size:12px;font-weight:700;cursor:pointer;transition:all .16s}
.omni .sbback:hover{background:var(--bg3);color:var(--tx);border-color:var(--ac)}
.omni .sbn{font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;transition:opacity .18s}
.omni .sb.col .sbn{opacity:0;pointer-events:none}
.omni .sbnav{flex:1;overflow-y:auto;padding:5px 0}
.omni .sbg{padding:9px 13px 3px;font-size:9px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--tx3);white-space:nowrap;transition:opacity .18s}
.omni .sb.col .sbg{opacity:0}
.omni .sbi{display:flex;align-items:center;gap:9px;padding:8px 13px;margin:1px 5px;border-radius:8px;cursor:pointer;transition:all .18s;position:relative;white-space:nowrap}
.omni .sbi:hover{background:var(--bg3)}
.omni .sbi.on{background:var(--ag)}
.omni .sbi.on::before{content:'';position:absolute;left:-5px;top:50%;transform:translateY(-50%);width:3px;height:17px;background:var(--ac);border-radius:0 3px 3px 0}
.omni .sbic{font-size:15px;width:18px;text-align:center;flex-shrink:0;color:var(--tx3)}
.omni .sbi.on .sbic{color:var(--ac2)}
.omni .sbil{font-size:12px;font-weight:500;color:var(--tx2);overflow:hidden;transition:opacity .18s}
.omni .sbi.on .sbil{color:var(--tx)}
.omni .sb.col .sbil{opacity:0;width:0}
.omni .sbbdg{margin-left:auto;background:var(--rd);color:#fff;font-size:9px;font-weight:700;padding:1px 6px;border-radius:20px;flex-shrink:0;transition:opacity .18s}
.omni .sb.col .sbbdg{opacity:0}
.omni .sbsub{background:var(--bg);margin:0 5px 2px;border-radius:7px;overflow:hidden}
.omni .sbsi{padding:6px 10px 6px 30px;font-size:11px;font-weight:500;color:var(--tx3);cursor:pointer;transition:all .18s}
.omni .sbsi:hover{color:var(--tx);background:var(--bg3)}
.omni .sbsi.on{color:var(--ac2)}
.omni .sb.col .sbsub{display:none}
.omni .sbf{padding:10px;border-top:1px solid var(--bd);display:flex;align-items:center;gap:9px;flex-shrink:0}
.omni .sbu{overflow:hidden;transition:opacity .18s}
.omni .sb.col .sbu{opacity:0}

.omni .av{width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,var(--ac),#7c3aed);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#fff;flex-shrink:0}
.omni .avxs{width:24px;height:24px;font-size:9px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;background:linear-gradient(135deg,var(--ac),#7c3aed);flex-shrink:0}

.omni .main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}
.omni .hdr{height:56px;background:var(--bg1);border-bottom:1px solid var(--bd);display:flex;align-items:center;padding:0 18px;gap:12px;flex-shrink:0;z-index:10}
.omni .htog{width:30px;height:30px;border-radius:7px;border:1px solid var(--bd2);background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--tx2);transition:all .18s;flex-shrink:0}
.omni .htog:hover{background:var(--bg3);color:var(--tx)}
.omni .htit{font-size:14px;font-weight:700;flex:1}
.omni .hsrch{display:flex;align-items:center;gap:7px;background:var(--bg2);border:1px solid var(--bd);border-radius:8px;padding:5px 11px;width:230px}
.omni .hsrch:focus-within{border-color:var(--ac);background:var(--bg3)}
.omni .hsrch input{background:transparent;border:none;outline:none;color:var(--tx);font-family:var(--fn);font-size:12px;width:100%}
.omni .hsrch input::placeholder{color:var(--tx3)}
.omni .hacts{display:flex;align-items:center;gap:7px}
.omni .ibtn{width:34px;height:34px;border-radius:8px;background:var(--bg2);border:1px solid var(--bd);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:15px;transition:all .18s;position:relative;color:var(--tx2)}
.omni .ibtn:hover{background:var(--bg3);color:var(--tx)}
.omni .ndot{position:absolute;top:6px;right:6px;width:5px;height:5px;background:var(--rd);border-radius:50%;border:1.5px solid var(--bg1)}
.omni .lpill{display:flex;align-items:center;gap:5px;background:var(--gnb);border:1px solid rgba(34,211,160,.2);border-radius:20px;padding:4px 9px}
.omni .ldot{width:5px;height:5px;background:var(--gn);border-radius:50%;animation:pls 2s infinite}
@keyframes pls{0%,100%{opacity:1}50%{opacity:.3}}
.omni .llbl{font-size:10px;font-weight:700;color:var(--gn);letter-spacing:.5px}

.omni .cnt{flex:1;overflow-y:auto;padding:22px;overflow-x:hidden}
.omni .cnt.nop{padding:0;overflow:hidden;display:flex;flex-direction:column;min-height:0;flex:1}
.omni .stit{font-size:19px;font-weight:700;letter-spacing:-.3px;margin-bottom:3px}
.omni .ssub{font-size:11px;color:var(--tx3);margin-bottom:18px}

.omni .g2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.omni .g3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.omni .g4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.omni.nar .g2,.omni.nar .g3,.omni.nar .g4{grid-template-columns:1fr;gap:11px}
.omni.nar .tabs{overflow-x:auto;scrollbar-width:none}
.omni.nar .cnt{padding:14px}
.omni.nar .hsrch{display:none}
.omni .mb12{margin-bottom:12px}.omni .mb16{margin-bottom:16px}.omni .mb20{margin-bottom:20px}

.omni .card{background:var(--bg1);border:1px solid var(--bd);border-radius:14px;overflow:hidden;transition:border-color .18s}
.omni .card:hover{border-color:var(--bd2)}
.omni .cp{padding:18px}
.omni .ch{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.omni .ct{font-size:12px;font-weight:600;color:var(--tx2);letter-spacing:.3px}

.omni .mc{background:var(--bg1);border:1px solid var(--bd);border-radius:14px;padding:16px 18px;transition:all .18s;position:relative;overflow:hidden;cursor:default}
.omni .mc::after{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--ac),transparent);opacity:0;transition:opacity .18s}
.omni .mc:hover::after{opacity:1}
.omni .mc:hover{border-color:var(--bd2);box-shadow:0 4px 24px rgba(0,0,0,.4)}
.omni .ml{font-size:10px;font-weight:600;letter-spacing:.8px;text-transform:uppercase;color:var(--tx3);margin-bottom:8px}
.omni .mv{font-size:24px;font-weight:700;letter-spacing:-.5px;margin-bottom:5px}
.omni .up{color:var(--gn);font-size:11px;font-weight:600}
.omni .dn{color:var(--rd);font-size:11px;font-weight:600}

.omni .bdg{display:inline-flex;align-items:center;font-size:9px;font-weight:700;padding:2px 7px;border-radius:20px;letter-spacing:.3px}
.omni .bg{background:var(--gnb);color:var(--gn);border:1px solid rgba(34,211,160,.2)}
.omni .br{background:var(--rdb);color:var(--rd);border:1px solid rgba(240,90,90,.2)}
.omni .by{background:var(--ywb);color:var(--yw);border:1px solid rgba(245,166,35,.2)}
.omni .bp{background:var(--ppb);color:var(--pp);border:1px solid rgba(167,139,250,.2)}
.omni .bb{background:var(--ag);color:var(--ac2);border:1px solid rgba(79,114,255,.2)}
.omni .bx{background:rgba(255,255,255,.05);color:var(--tx3);border:1px solid var(--bd)}

.omni .btn{display:inline-flex;align-items:center;gap:5px;padding:6px 13px;border-radius:8px;font-family:var(--fn);font-size:12px;font-weight:600;cursor:pointer;border:none;transition:all .18s;white-space:nowrap}
.omni .btp{background:var(--ac);color:#fff}
.omni .btp:hover{background:var(--ac2);transform:translateY(-1px);box-shadow:0 4px 14px rgba(79,114,255,.35)}
.omni .btg{background:transparent;color:var(--tx2);border:1px solid var(--bd2)}
.omni .btg:hover{background:var(--bg3);color:var(--tx)}
.omni .btd{background:var(--rdb);color:var(--rd);border:1px solid rgba(240,90,90,.2)}
.omni .btd:hover{background:rgba(240,90,90,.15)}
.omni .bts{background:var(--gnb);color:var(--gn);border:1px solid rgba(34,211,160,.2)}
.omni .bts:hover{background:rgba(34,211,160,.15)}
.omni .sm{padding:3px 9px;font-size:11px}

.omni .tw{overflow-x:auto}
.omni table{width:100%;border-collapse:collapse}
.omni th{text-align:left;padding:9px 13px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--tx3);border-bottom:1px solid var(--bd);white-space:nowrap}
.omni td{padding:12px 13px;font-size:12px;color:var(--tx2);border-bottom:1px solid rgba(255,255,255,.03);white-space:nowrap}
.omni tr:last-child td{border-bottom:none}
.omni tr:hover td{background:rgba(255,255,255,.015)}

.omni .tbar{width:54px;height:3px;background:var(--bg3);border-radius:3px;overflow:hidden;display:inline-block}
.omni .tfill{height:100%;border-radius:3px}
.omni .tog{width:32px;height:17px;border-radius:17px;cursor:pointer;transition:background .18s;position:relative;flex-shrink:0}
.omni .ton{background:var(--ac)}.omni .tof{background:var(--bg3)}
.omni .togth{position:absolute;top:2px;width:13px;height:13px;background:#fff;border-radius:50%;transition:left .18s}
.omni .ton .togth{left:17px}.omni .tof .togth{left:2px}
.omni .fi{display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.03);animation:fd .4s ease}
.omni .fi:last-child{border-bottom:none}
@keyframes fd{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:none}}
.omni .fic{width:30px;height:30px;border-radius:7px;background:var(--bg3);display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0}
.omni .fm{font-size:12px;font-weight:500;color:var(--tx);margin-bottom:2px}
.omni .fmeta{font-size:10px;color:var(--tx3);display:flex;gap:6px}
.omni .famt{margin-left:auto;font-size:12px;font-weight:700;color:var(--ac2);flex-shrink:0}
.omni .prog{height:3px;background:var(--bg3);border-radius:3px;overflow:hidden;margin-top:6px}
.omni .progf{height:100%;background:var(--ac);border-radius:3px}
.omni .alert{background:rgba(240,90,90,.07);border:1px solid rgba(240,90,90,.2);border-radius:10px;padding:9px 14px;margin-bottom:18px;display:flex;align-items:center;gap:9px}
.omni .mbox{background:linear-gradient(135deg,#0d1526,#111d3a);border-radius:10px;height:190px;position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden}
.omni .mgrid{position:absolute;inset:0;opacity:.06;background-image:linear-gradient(var(--ac) 1px,transparent 1px),linear-gradient(90deg,var(--ac) 1px,transparent 1px);background-size:27px 27px}
.omni .mdot{position:absolute;width:9px;height:9px;border-radius:50%;animation:mp 2.5s infinite}
@keyframes mp{0%{box-shadow:0 0 0 0 currentColor;opacity:1}100%{box-shadow:0 0 0 10px transparent;opacity:.5}}
.omni .srow{display:flex;align-items:center;padding:11px 0;border-bottom:1px solid rgba(255,255,255,.03);gap:10px}
.omni .srow:last-child{border-bottom:none}
.omni .sdot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.omni .sok{background:var(--gn);box-shadow:0 0 6px var(--gn)}.omni .sdeg{background:var(--yw);box-shadow:0 0 6px var(--yw)}
.omni .mono{font-family:var(--mo)}
.omni .tabs{display:flex;gap:2px;background:var(--bg2);border-radius:9px;padding:3px;margin-bottom:18px}
.omni .tab{flex:1;text-align:center;padding:6px 8px;border-radius:7px;font-size:11px;font-weight:600;cursor:pointer;transition:all .18s;color:var(--tx3)}
.omni.nar .tab{flex:0 0 auto;white-space:nowrap;padding:6px 13px}
.omni .tab.on{background:var(--bg3);color:var(--tx)}
.omni .inp{background:var(--bg2);border:1px solid var(--bd2);border-radius:7px;padding:7px 10px;font-family:var(--fn);font-size:12px;color:var(--tx);outline:none;width:100%;transition:border-color .18s}
.omni .inp:focus{border-color:var(--ac)}
.omni .lbl{font-size:9px;font-weight:700;color:var(--tx3);margin-bottom:4px;display:block;letter-spacing:.7px;text-transform:uppercase}

.omni .mo{position:fixed;inset:0;background:rgba(0,0,0,.72);backdrop-filter:blur(4px);z-index:500;display:flex;align-items:center;justify-content:center;animation:fd .2s ease}
.omni .mb{background:var(--bg1);border:1px solid var(--bd2);border-radius:14px;padding:22px;width:460px;max-width:92vw;box-shadow:0 8px 48px rgba(0,0,0,.7);animation:mi .22s ease}
@keyframes mi{from{opacity:0;transform:scale(.96) translateY(6px)}to{opacity:1;transform:none}}
.omni .mt{font-size:15px;font-weight:700;margin-bottom:5px}
.omni .ms{font-size:11px;color:var(--tx3);margin-bottom:18px}
.omni .mact{display:flex;gap:7px;justify-content:flex-end;margin-top:18px}

.omni .twrap{position:fixed;bottom:22px;right:22px;z-index:999;display:flex;flex-direction:column;gap:7px;pointer-events:none}
.omni .reprow{transition:background .15s}
.omni .reprow:hover{background:var(--bg2)}
.omni .tst{background:#1b1f2a;border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:13px 18px;min-width:240px;max-width:90vw;display:flex;align-items:center;gap:10px;color:#fff;box-shadow:0 12px 40px rgba(0,0,0,.45);animation:fd .25s ease}


.omni .ve-root{
  display:flex;
  flex-direction:column;
  flex:1;
  min-height:0;
  height:100%;
  overflow:hidden;
}


.omni .ve-tb{
  height:48px;
  background:var(--bg1);
  border-bottom:1px solid var(--bd);
  display:flex;
  align-items:center;
  padding:0 12px;
  gap:6px;
  flex-shrink:0;
  overflow-x:auto;
  overflow-y:hidden;
}
.omni .ve-tb::-webkit-scrollbar{height:0}
.omni .ve-sep{width:1px;height:22px;background:var(--bd2);flex-shrink:0}
.omni .ve-unsv{font-size:9px;font-weight:700;color:var(--yw);background:var(--ywb);padding:2px 6px;border-radius:20px;border:1px solid rgba(245,166,35,.2);white-space:nowrap}
.omni .vp-btn{padding:5px 10px;border-radius:6px;font-size:10px;font-weight:600;border:1px solid var(--bd);background:transparent;color:var(--tx3);cursor:pointer;display:flex;align-items:center;gap:4px;transition:all .15s;font-family:var(--fn);white-space:nowrap;flex-shrink:0}
.omni .vp-btn:hover{background:var(--bg3);color:var(--tx);border-color:var(--bd2)}
.omni .vp-btn.on{background:var(--bg3);border-color:var(--ac);color:var(--ac2)}
.omni .vp-btn:disabled{opacity:.4;cursor:default}
.omni .rng-wrap{position:relative}
.omni .rng-btn{display:flex;align-items:center;gap:5px;background:var(--bg3);border:1px solid var(--bd2);color:var(--tx2);font-size:10px;font-weight:600;padding:4px 9px;border-radius:7px;cursor:pointer;font-family:var(--fn);transition:all .15s;white-space:nowrap}
.omni .rng-btn:hover{color:var(--tx);border-color:var(--ac)}
.omni .rng-menu{position:absolute;top:calc(100% + 5px);right:0;background:var(--bg2);border:1px solid var(--bd2);border-radius:9px;padding:4px;z-index:60;box-shadow:0 8px 24px rgba(0,0,0,.4);min-width:118px}
.omni .rng-item{padding:7px 10px;font-size:11px;color:var(--tx2);border-radius:6px;cursor:pointer;white-space:nowrap;transition:all .12s}
.omni .rng-item:hover{background:var(--bg3);color:var(--tx)}
.omni .rng-item.on{background:var(--ag);color:var(--ac2);font-weight:700}


.omni .ve-body{
  display:flex;
  flex:1;
  min-height:0;
  overflow:hidden;
}


.omni .ve-left{
  width:180px;
  min-width:180px;
  max-width:180px;
  background:var(--bg1);
  border-right:1px solid var(--bd);
  display:flex;
  flex-direction:column;
  overflow:hidden;
  transition:width .2s,min-width .2s,max-width .2s;
  flex-shrink:0;
  position:relative;
}
.omni .ve-left.collapsed{
  width:0;
  min-width:0;
  max-width:0;
}
.omni .ve-left-inner{
  display:flex;
  flex-direction:column;
  flex:1;
  min-height:0;
  overflow:hidden;
  width:180px;
}
.omni .ve-left-scroll{
  flex:1;
  overflow-y:auto;
  padding:4px 0;
}
.omni .ve-grp{
  padding:10px 12px 3px;
  font-size:9px;
  font-weight:700;
  letter-spacing:1.1px;
  text-transform:uppercase;
  color:var(--tx3);
  white-space:nowrap;
}
.omni .ve-area{
  display:flex;
  align-items:center;
  gap:8px;
  padding:8px 12px;
  margin:1px 6px;
  border-radius:7px;
  cursor:pointer;
  transition:all .18s;
  position:relative;
}
.omni .ve-area:hover{background:var(--bg3)}
.omni .ve-area.on{background:var(--ag)}
.omni .ve-area.on::before{
  content:'';
  position:absolute;
  left:-6px;top:50%;
  transform:translateY(-50%);
  width:3px;height:16px;
  background:var(--ac);
  border-radius:0 3px 3px 0;
}
.omni .ve-ai{font-size:13px;color:var(--tx3);width:16px;text-align:center;flex-shrink:0}
.omni .ve-area.on .ve-ai{color:var(--ac2)}
.omni .ve-al{font-size:11px;font-weight:500;color:var(--tx3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.omni .ve-area.on .ve-al{color:var(--tx)}


.omni .ve-toggle{
  position:absolute;
  right:-13px;
  top:50%;
  transform:translateY(-50%);
  width:26px;
  height:26px;
  border-radius:50%;
  background:var(--ac);
  border:none;
  display:flex;
  align-items:center;
  justify-content:center;
  cursor:pointer;
  z-index:60;
  font-size:12px;
  font-weight:800;
  color:#000;
  box-shadow:0 2px 10px rgba(0,0,0,.45);
  border:2px solid var(--bg1);
  transition:all .15s;
  flex-shrink:0;
}
.omni .ve-toggle:hover{filter:brightness(1.08);transform:translateY(-50%) scale(1.08)}


.omni .ve-canvas{
  flex:1;
  min-width:0;
  min-height:0;
  display:flex;
  flex-direction:column;
  background:var(--bg);
  overflow:hidden;
}
.omni .ve-canvas-bar{
  height:38px;
  background:var(--bg1);
  border-bottom:1px solid var(--bd);
  display:flex;
  align-items:center;
  padding:0 10px;
  gap:6px;
  flex-shrink:0;
  overflow:hidden;
}
.omni .ve-canvas-scroll{
  flex:1;
  min-height:0;
  overflow-y:scroll;
  overflow-x:hidden;
  padding:16px 16px 40px;
  background:var(--bg);
  -webkit-overflow-scrolling:touch;
}

.omni .ve-hdl{cursor:grab;touch-action:none}
.omni .ve-blk{touch-action:pan-y}
.omni .ve-blk.sys-blk{cursor:default;opacity:.93}
.omni .ve-blk.sys-blk:hover{transform:none;box-shadow:none}
.omni .ve-frame{
  width:100%;
  margin:0 auto 24px;
  background:var(--bg1);
  border:1px solid var(--bd2);
  border-radius:12px;
  overflow:visible;
  box-shadow:0 0 0 1px rgba(79,114,255,.06),0 20px 60px rgba(0,0,0,.6);
  transition:max-width .3s ease;
}


.omni .ve-blk{
  position:relative;
  cursor:pointer;
  border:2px solid transparent;
  transition:border-color .15s,box-shadow .15s;
  overflow:hidden;
}
.omni .ve-blk:hover{
  border-color:rgba(79,114,255,.5);
  box-shadow:inset 0 0 0 1px rgba(79,114,255,.15);
}
.omni .ve-blk.selected,.omni .ve-blk.sel{
  border-color:var(--ac) !important;
  box-shadow:inset 0 0 0 1px rgba(79,114,255,.2) !important;
}
.omni .ve-blk.hidden-blk{
  opacity:.4;
}
.omni .ve-blk.dragging{
  opacity:.3;
}
.omni .ve-blk.dragover{
  border-color:var(--gn) !important;
  background:rgba(34,211,160,.03);
}


.omni .ve-blk-lbl{
  position:absolute;
  bottom:0;left:0;
  z-index:25;
  display:none;
  font-size:8px;font-weight:700;
  background:var(--ac);color:#fff;
  padding:3px 8px;
  border-radius:0 6px 0 0;
  letter-spacing:.5px;
}
.omni .ve-blk:hover .ve-blk-lbl,.omni .ve-blk.sel .ve-blk-lbl{display:block}


.omni .ve-handle{
  position:absolute;
  left:6px;top:50%;
  transform:translateY(-50%);
  z-index:25;
  display:none;
  flex-direction:column;
  gap:3px;
  cursor:grab;
  padding:6px 3px;
}
.omni .ve-blk:hover .ve-handle{display:flex}
.omni .ve-hdot{width:3px;height:3px;background:rgba(255,255,255,.5);border-radius:50%}


.omni .ve-blk-bar{
  position:absolute;
  top:0;right:0;
  z-index:25;
  display:none;
  align-items:center;
  background:var(--ac);
  border-radius:0 0 0 8px;
  overflow:hidden;
}
.omni .ve-blk:hover .ve-blk-bar,.omni .ve-blk.sel .ve-blk-bar{display:flex}
.omni .ve-blk-btn{
  padding:5px 9px;
  font-size:9px;font-weight:700;
  cursor:pointer;color:#fff;
  font-family:var(--fn);
  border:none;background:transparent;
  transition:background .12s;
  white-space:nowrap;
}
.omni .ve-blk-btn:hover{background:rgba(255,255,255,.2)}
.omni .ve-blk-btn.del:hover{background:rgba(240,90,90,.5)}


.omni .ve-add-btn{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:8px;
  padding:12px;
  margin:8px 0;
  border:1.5px dashed rgba(79,114,255,.25);
  border-radius:10px;
  cursor:pointer;
  transition:all .2s;
  color:var(--tx3);
  font-size:12px;font-weight:600;
  font-family:var(--fn);
}
.omni .ve-add-btn.dragover{border-color:var(--gn);background:rgba(34,211,160,.06);color:var(--gn)}
.omni .ve-add-btn:hover{
  border-color:var(--ac);
  color:var(--ac2);
  background:var(--ag);
}


.omni .ve-right{
  width:260px;
  min-width:260px;
  max-width:260px;
  background:var(--bg1);
  border-left:1px solid var(--bd);
  display:flex;
  flex-direction:column;
  overflow:hidden;
  transition:width .2s,min-width .2s,max-width .2s;
  flex-shrink:0;
  position:relative;
}
.omni .ve-right.collapsed{
  width:0;
  min-width:0;
  max-width:0;
}
.omni .ve-right-toggle{
  position:absolute;
  left:-13px;
  top:50%;
  transform:translateY(-50%);
  width:26px;height:26px;
  border-radius:50%;
  background:var(--ac);
  border:none;
  display:flex;align-items:center;justify-content:center;
  cursor:pointer;z-index:60;
  font-size:12px;font-weight:800;color:#000;
  box-shadow:0 2px 10px rgba(0,0,0,.45);
  border:2px solid var(--bg1);
  transition:all .15s;
}
.omni .ve-right-toggle:hover{filter:brightness(1.08);transform:translateY(-50%) scale(1.08)}
.omni .ve-right-inner{
  display:flex;
  flex-direction:column;
  flex:1;
  min-height:0;
  overflow:hidden;
  width:260px;
}
.omni .ve-ph{
  padding:14px 16px;
  border-bottom:1px solid var(--bd);
  flex-shrink:0;
}
.omni .ve-pt{font-size:12px;font-weight:700;margin-bottom:2px}
.omni .ve-ps{font-size:9px;color:var(--tx3);font-family:var(--mo)}
.omni .ve-pb{
  flex:1;
  min-height:0;
  overflow-y:auto;
  padding:14px;
}
.omni .ve-sec{
  font-size:9px;font-weight:700;
  color:var(--tx3);
  letter-spacing:.9px;text-transform:uppercase;
  margin-bottom:10px;
}
.omni .ve-field{margin-bottom:14px}
.omni .ve-lbl{
  font-size:9px;font-weight:700;
  color:var(--tx3);letter-spacing:.7px;text-transform:uppercase;
  margin-bottom:5px;display:block;
}
.omni .ve-inp{
  width:100%;
  background:var(--bg2);
  border:1px solid var(--bd2);
  border-radius:7px;
  padding:7px 10px;
  font-family:var(--fn);font-size:12px;
  color:var(--tx);outline:none;
  transition:border-color .15s;
  resize:vertical;
}
.omni .ve-inp:focus{border-color:var(--ac)}
.omni .ve-div{height:1px;background:var(--bd);margin:14px 0}
.omni .ve-empty{
  flex:1;
  display:flex;flex-direction:column;
  align-items:center;justify-content:center;
  color:var(--tx3);text-align:center;
  padding:24px 20px;
}
.omni .ve-empty-hint{
  font-size:10px;line-height:1.7;
  color:var(--tx3);
  margin-top:8px;
}


.omni .sw-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-bottom:14px}
.omni .sw{height:28px;border-radius:6px;cursor:pointer;transition:all .12s;border:2px solid transparent}
.omni .sw.active{border-color:var(--ac);box-shadow:0 0 0 2px rgba(79,114,255,.3)}
.omni .sw:hover{transform:scale(1.05)}


.omni .amgrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;max-height:360px;overflow-y:auto}
.omni .amcard{background:var(--bg2);border:1px solid var(--bd);border-radius:9px;overflow:hidden;cursor:pointer;transition:all .15s}
.omni .amcard:hover{border-color:var(--ac);transform:translateY(-1px);box-shadow:0 4px 14px rgba(79,114,255,.15)}
.omni .amprev{height:44px;display:flex;align-items:center;justify-content:center;font-size:16px}
.omni .aminfo{padding:8px}
.omni .amname{font-size:11px;font-weight:700;color:var(--tx);margin-bottom:2px}
.omni .amdesc{font-size:9px;color:var(--tx3)}
.omni .histitem{padding:11px 13px;background:var(--bg2);border:1px solid var(--bd);border-radius:9px;margin-bottom:7px;display:flex;align-items:center;gap:10px}
.omni .histcur{border-color:var(--ac);background:var(--ag)}
@keyframes spin{to{transform:rotate(360deg)}}
.omni .spin{animation:spin .7s linear infinite;display:inline-block}
@media(max-width:900px){.omni .g4{grid-template-columns:repeat(2,1fr)}.omni .hsrch{display:none}}
@media(max-width:640px){.omni .g2{grid-template-columns:1fr}.omni .g3{grid-template-columns:1fr}.omni .cnt{padding:14px}}

.omni .item-row{display:flex;align-items:center;gap:5px;margin-bottom:5px;padding:5px 7px;background:var(--bg2);border:1px solid var(--bd);border-radius:7px;transition:border-color .15s}
.omni .item-row:hover{border-color:var(--bd2)}
.omni .emoji-btn{background:var(--bg3);border:1px solid var(--bd2);border-radius:5px;padding:3px 6px;font-size:14px;cursor:pointer;flex-shrink:0;min-width:32px;text-align:center;outline:none;color:var(--tx);transition:background .12s;position:relative;overflow:hidden}
.omni .emoji-btn:hover{background:var(--bg4,#1e2340)}
.omni .upload-btn{background:var(--bg3);border:1px solid var(--bd2);border-radius:5px;padding:0 5px;height:26px;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;color:var(--tx3);transition:all .12s;font-size:11px}
.omni .upload-btn:hover{background:var(--bg4,#1e2340);color:var(--ac2);border-color:var(--ac)}
.omni .icon-img{width:22px;height:22px;border-radius:4px;object-fit:cover;display:block}
.omni .item-inp{flex:1;background:transparent;border:none;outline:none;font-family:var(--fn);font-size:11px;color:var(--tx);min-width:0}
.omni .price-inp{width:58px;background:transparent;border:none;outline:none;font-family:var(--mo);font-size:10px;color:var(--ac2);text-align:right}
.omni .item-del{background:none;border:none;color:var(--tx3);cursor:pointer;font-size:13px;padding:0 3px;line-height:1;transition:color .12s;flex-shrink:0}
.omni .item-del:hover{color:var(--rd)}
.omni .epick{position:fixed;z-index:700;background:var(--bg1);border:1px solid var(--bd2);border-radius:10px;padding:9px;box-shadow:0 8px 40px rgba(0,0,0,.7);width:230px;max-height:210px;overflow-y:auto;animation:fd .15s ease}
.omni .epick-g{display:grid;grid-template-columns:repeat(8,1fr);gap:2px}
.omni .ep{padding:4px;border-radius:5px;cursor:pointer;font-size:14px;text-align:center;transition:background .1s}
.omni .ep:hover{background:var(--bg3)}

.omni .prev-modal{position:fixed;inset:0;background:rgba(0,0,0,.9);backdrop-filter:blur(8px);z-index:600;display:flex;flex-direction:column;animation:fd .2s ease;overflow:hidden}
.omni .prev-hdr{height:54px;background:var(--bg1);border-bottom:1px solid var(--bd);display:flex;align-items:center;padding:0 18px;gap:10px;flex-shrink:0}
.omni .prev-body{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;display:flex;justify-content:center;align-items:flex-start;padding:20px;background:var(--bg);-webkit-overflow-scrolling:touch}
.omni .prev-frame{background:var(--bg1);border:1px solid var(--bd2);border-radius:12px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.8);width:100%;transition:max-width .3s;flex-shrink:0}
`;

/* ── Helpers generales ─────────────────────────────────────────────────────── */
/* ── EDITOR VISUAL REAL — banners de la tienda, guardado GLOBAL (config) ────── */
// Edita adminCfg.blocks → set_platform_config (Fase 1, con debounce) → realtime:
// lo que guardes aparece/cambia en la tienda de TODOS los teléfonos al instante.
// Solo ofrece las páginas que de verdad se renderizan: Marketplace y Delivery.
/* ══ EDITOR VISUAL ORIGINAL (restaurado de v55) — conectado al guardado GLOBAL ══ */
// ── Editor viejo ELIMINADO (ED_AREAS/BLK_TYPES/PAGE_DEFAULTS/VERSIONS/BlockPreview).
//    El Editor Visual se renovó: modelo maestros+referencias, carrusel como TIPO,
//    formato/posición-CTA, multi-pantalla y biblioteca. Anclas y render compartido
//    viven en src/shared/liveBlocks.jsx. CategoryManager (Búsqueda) se conserva.

function CategoryManager(){
  const {cats, subcats, addCat, removeCat, renameCat, addSub, removeSub, renameSub, reorderCats} = useCatalog();
  const [sel,setSel]=useState(null);
  const [newCat,setNewCat]=useState('');
  const [newColor,setNewColor]=useState('#A78BFA');
  const [newSub,setNewSub]=useState('');
  const [edit,setEdit]=useState(null);       // {kind:'cat'|'sub', id, sub, value}
  const [confirm,setConfirm]=useState(null);  // {kind, id, sub, name}
  const dragFrom=useRef(null);
  const [dragOver,setDragOver]=useState(null);
  const SW=['#A78BFA','#60A5FA','#E879F9','#4ADE80','#FBBF24','#F87171','#F472B6','#38BDF8','#2DD4BF','#FB7185','#22C55E','#F59E0B','#8B5CF6','#FB923C','#34D399','#94A3B8'];
  const inpStyle={background:'var(--bg)',border:'1px solid var(--bd)',borderRadius:8,padding:'9px 11px',color:'var(--tx)',fontSize:12.5,outline:'none',minWidth:0};
  const iconBtn={background:'none',border:'none',cursor:'pointer',fontSize:13,color:'var(--tx2)',flexShrink:0,padding:'0 2px'};
  const moveBtn={background:'none',border:'none',cursor:'pointer',color:'var(--tx2)',fontSize:9,lineHeight:1,padding:0};
  const startEdit=(kind,id,sub)=>setEdit({kind,id,sub,value:kind==='cat'?(cats.find(c=>c.id===id)?.name||''):sub});
  const commitEdit=()=>{ if(!edit)return; const v=(edit.value||'').trim(); if(v){ if(edit.kind==='cat')renameCat(edit.id,v); else renameSub(edit.id,edit.sub,v);} setEdit(null); };
  return (
    <div style={{maxWidth:440,margin:'0 auto',width:'100%'}}>
      <div style={{fontSize:13,fontWeight:800,color:'var(--tx)',marginBottom:5}}>Categorías de la plataforma</div>
      <div style={{fontSize:11,color:'var(--tx2)',marginBottom:14,lineHeight:1.5}}>Arrastra (⠿) para ordenar. Toca una para editar sus subcategorías. Todo se refleja en la tienda, la búsqueda y al publicar.</div>
      <div style={{background:'var(--bg2)',border:'1px solid var(--bd)',borderRadius:11,padding:12,marginBottom:14}}>
        <div style={{display:'flex',gap:8,marginBottom:9}}>
          <input value={newCat} onChange={e=>setNewCat(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&newCat.trim()){addCat(newCat.trim(),newColor);setNewCat('');}}} placeholder="Nueva categoría" style={{...inpStyle,flex:1}}/>
          <button className="btn btp sm" onClick={()=>{if(newCat.trim()){addCat(newCat.trim(),newColor);setNewCat('');}}}>Agregar</button>
        </div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{SW.map(c=><div key={c} onClick={()=>setNewColor(c)} style={{width:20,height:20,borderRadius:'50%',background:c,cursor:'pointer',border:newColor===c?'2px solid var(--tx)':'2px solid transparent'}}/>)}</div>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {cats.map((c,idx)=>{
          const isSel=sel===c.id, subs=subcats[c.id]||[];
          const isEditingCat=edit&&edit.kind==='cat'&&edit.id===c.id;
          return (
            <div key={c.id} draggable={!edit}
              onDragStart={()=>{dragFrom.current=idx;}}
              onDragOver={e=>{e.preventDefault();setDragOver(idx);}}
              onDrop={()=>{ if(dragFrom.current!=null)reorderCats(dragFrom.current,idx); dragFrom.current=null; setDragOver(null); }}
              onDragEnd={()=>{dragFrom.current=null;setDragOver(null);}}
              style={{background:'var(--bg2)',border:`1px solid ${dragOver===idx?'var(--ac)':'var(--bd)'}`,borderRadius:11,overflow:'hidden',transition:'border .15s'}}>
              <div style={{display:'flex',alignItems:'center',gap:9,padding:'10px 12px'}}>
                <span style={{cursor:'grab',color:'var(--tx3)',fontSize:15,flexShrink:0,lineHeight:1}} title="Arrastrar para ordenar">⠿</span>
                <div style={{width:13,height:13,borderRadius:'50%',background:c.color,flexShrink:0}}/>
                {isEditingCat
                  ? <input autoFocus value={edit.value} onChange={e=>setEdit({...edit,value:e.target.value})} onKeyDown={e=>{if(e.key==='Enter')commitEdit();if(e.key==='Escape')setEdit(null);}} onBlur={commitEdit} style={{...inpStyle,flex:1}}/>
                  : <span onClick={()=>setSel(isSel?null:c.id)} style={{flex:1,fontSize:13,fontWeight:600,color:'var(--tx)',cursor:'pointer',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',minWidth:0}}>{c.name} <span style={{fontSize:10,color:'var(--tx3)',fontWeight:500}}>· {subs.length} sub</span></span>}
                <button onClick={()=>startEdit('cat',c.id)} title="Renombrar" style={iconBtn}>✎</button>
                <button onClick={()=>setConfirm({kind:'cat',id:c.id,name:c.name})} title="Eliminar" style={{...iconBtn,color:'var(--rd)'}}>✕</button>
                <span onClick={()=>setSel(isSel?null:c.id)} style={{cursor:'pointer',color:'var(--tx3)',fontSize:13,flexShrink:0,transform:isSel?'rotate(90deg)':'none',transition:'transform .2s'}}>›</span>
              </div>
              {isSel&&(
                <div style={{padding:'0 12px 12px',borderTop:'1px solid var(--bd)'}}>
                  <div style={{fontSize:9,color:'var(--tx3)',fontWeight:700,letterSpacing:.3,margin:'10px 0 7px'}}>SUBCATEGORÍAS</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:8}}>
                    {subs.length===0&&<span style={{fontSize:11,color:'var(--tx3)'}}>Ninguna todavía.</span>}
                    {subs.map(s=>{
                      const isEdS=edit&&edit.kind==='sub'&&edit.id===c.id&&edit.sub===s;
                      return isEdS
                        ? <input key={s} autoFocus value={edit.value} onChange={e=>setEdit({...edit,value:e.target.value})} onKeyDown={e=>{if(e.key==='Enter')commitEdit();if(e.key==='Escape')setEdit(null);}} onBlur={commitEdit} style={{...inpStyle,width:130,fontSize:11,padding:'5px 8px'}}/>
                        : <span key={s} style={{display:'inline-flex',alignItems:'center',gap:6,background:'var(--bg3)',border:'1px solid var(--bd)',borderRadius:50,padding:'5px 10px',fontSize:11,color:'var(--tx2)'}}>
                            {s}
                            <span onClick={()=>startEdit('sub',c.id,s)} style={{cursor:'pointer',color:'var(--tx3)'}}>✎</span>
                            <span onClick={()=>setConfirm({kind:'sub',id:c.id,sub:s,name:s})} style={{cursor:'pointer',color:'var(--rd)',fontWeight:800}}>×</span>
                          </span>;
                    })}
                  </div>
                  <div style={{display:'flex',gap:7}}>
                    <input value={isSel?newSub:''} onChange={e=>setNewSub(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&newSub.trim()){addSub(c.id,newSub.trim());setNewSub('');}}} placeholder="+ subcategoría" style={{...inpStyle,flex:1,fontSize:11,padding:'7px 9px'}}/>
                    <button className="btn btg sm" onClick={()=>{if(newSub.trim()){addSub(c.id,newSub.trim());setNewSub('');}}}>Añadir</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {confirm&&(
        <div onClick={()=>setConfirm(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:900,padding:20}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'var(--bg1)',border:'1px solid var(--bd2)',borderRadius:14,padding:20,maxWidth:320,width:'100%',boxShadow:'0 20px 60px rgba(0,0,0,.5)'}}>
            <div style={{fontSize:14,fontWeight:800,color:'var(--tx)',marginBottom:8}}>¿Eliminar {confirm.kind==='cat'?'categoría':'subcategoría'}?</div>
            <div style={{fontSize:12,color:'var(--tx2)',lineHeight:1.5,marginBottom:16}}>Vas a eliminar <b style={{color:'var(--tx)'}}>{confirm.name}</b>{confirm.kind==='cat'?' y todas sus subcategorías':''}. Esto se quita de toda la plataforma.</div>
            <div style={{display:'flex',gap:9}}>
              <button className="btn btg" style={{flex:1,justifyContent:'center'}} onClick={()=>setConfirm(null)}>Cancelar</button>
              <button className="btn" style={{flex:1,justifyContent:'center',background:'var(--rd)',color:'#fff'}} onClick={()=>{ if(confirm.kind==='cat'){removeCat(confirm.id); if(sel===confirm.id)setSel(null);} else removeSub(confirm.id,confirm.sub); setConfirm(null); }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Destinos a los que puede llevar un botón de un bloque (se conectarán a la navegación real) */
const DESTINOS=[
  {v:'',l:'Sin acción (no lleva a ningún lado)'},
  {v:'inicio',l:'Inicio / Tienda'},
  {v:'busqueda',l:'Búsqueda'},
  {v:'delivery_local',l:'Delivery local'},
  {v:'delivery_intl',l:'Envíos internacionales'},
  {v:'subastas',l:'Subastas'},
  {v:'ofertas',l:'Ver ofertas'},
  {v:'mas_vendidos',l:'Más vendidos'},
  {v:'nuevos',l:'Productos nuevos'},
];
// Interruptor Visible/Oculto del bloque seleccionado (usado en el panel derecho).
const Tog=({on,ch})=><div className={`tog ${on?'ton':'tof'}`} onClick={()=>ch&&ch(!on)}><div className="togth"/></div>;

// ═══════════════ EDITOR VISUAL (renovado) ═══════════════
// Modelo: masters (contenido, fuente única) + layout por pantalla (anclas + refs,
// posición local). Carrusel = tipo. Formato (aspect-ratio), posición del CTA,
// publicar en varias pantallas, biblioteca de contenido. Fluido (inputs con commit
// al soltar; previews memoizados). Sin "Vista previa" ni "Versiones".

// Input con estado local: hace commit al soltar (no re-renderiza el lienzo por tecla).
const CommitInput = memo(function CommitInput({ value, onCommit, textarea, ...rest }) {
  const [v, setV] = useState(value ?? "");
  const dirty = useRef(false);
  useEffect(() => { if (!dirty.current) setV(value ?? ""); }, [value]);
  const commit = () => { dirty.current = false; if ((v ?? "") !== (value ?? "")) onCommit(v); };
  const props = { className: "ve-inp", value: v,
    onChange: e => { dirty.current = true; setV(e.target.value); },
    onBlur: commit,
    onKeyDown: e => { if (!textarea && e.key === "Enter") e.currentTarget.blur(); }, ...rest };
  return textarea ? <textarea rows={2} {...props} /> : <input {...props} />;
});

// Preview de un master en el lienzo (memoizado, sin navegación ni auto-avance molesto).
const PreviewBlock = memo(function PreviewBlock({ m }) {
  return <div style={{ pointerEvents: "none" }}><BlockView m={{ ...m, active: true }} onNav={null} /></div>;
});

// Chips de opción (formato / posición del botón).
function Chips({ options, value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {options.map(o => (
        <button key={o.v} onClick={() => onChange(o.v)}
          style={{ flex: "1 1 auto", minWidth: 0, fontSize: 11, fontWeight: 700, padding: "7px 9px", borderRadius: 9, cursor: "pointer", whiteSpace: "nowrap",
            background: value === o.v ? "var(--ac)" : "var(--bg2)", color: value === o.v ? "#fff" : "var(--tx2)", border: `1px solid ${value === o.v ? "var(--ac)" : "var(--bd2)"}` }}>
          {o.l}
        </button>
      ))}
    </div>
  );
}

// Selector de pantallas (casillas) reutilizable.
function ScreenChecks({ selected, onToggle }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {SCREENS.map(sc => {
        const on = selected.includes(sc.id);
        return (
          <button key={sc.id} onClick={() => onToggle(sc.id)}
            style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 9, cursor: "pointer", textAlign: "left",
              background: on ? "var(--ag)" : "var(--bg2)", border: `1px solid ${on ? "var(--ac)" : "var(--bd2)"}`, color: "var(--tx)" }}>
            <span style={{ width: 17, height: 17, borderRadius: 5, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900,
              background: on ? "var(--ac)" : "transparent", border: `1.5px solid ${on ? "var(--ac)" : "var(--bd2)"}`, color: "#fff" }}>{on ? "✓" : ""}</span>
            <span style={{ fontSize: 12 }}>{sc.icon} {sc.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function normalizeCfg(cfg) {
  const masters = {};
  Object.entries((cfg && cfg.masters) || {}).forEach(([id, m]) => { if (m && typeof m === "object") masters[id] = { ...m }; });
  const legacyBanner = (e, lib) => {
    const mid = mkId("m");
    masters[mid] = { id: mid, kind: "banner", active: lib ? false : (e.active !== false), format: e.format || "3:1", ctaPos: e.ctaPos || "left", lib: !!lib,
      title: e.title || "", sub: e.sub || "", badge: e.badge || "", bg: e.bg || RET_BGS[0], image: e.image || "",
      cta: e.cta || "", ctaAction: e.ctaAction || "", cta2: e.cta2 || "", cta2Action: e.cta2Action || "" };
    return mid;
  };
  const layout = {};
  SCREENS.forEach(sc => {
    const canon = SCREEN_ANCHORS[sc.id];
    const canonIds = new Set(canon.map(a => a.id));
    const existing = Array.isArray(cfg && cfg.blocks && cfg.blocks[sc.id]) ? cfg.blocks[sc.id] : [];
    const out = []; const seen = new Set();
    existing.forEach(e => {
      if (!e) return;
      if (isAnchor(e)) { if (canonIds.has(e.id) && !seen.has(e.id)) { out.push({ ...canon.find(a => a.id === e.id) }); seen.add(e.id); } return; }
      if (e.ref) { if (masters[e.ref]) out.push({ id: e.id || mkId("e"), ref: e.ref }); return; }
      if ((e.title || e.image) && ["hero", "promo", "slider", "cta"].includes(e.type)) out.push({ id: mkId("e"), ref: legacyBanner(e, false) });
    });
    canon.forEach((a, ai) => {
      if (seen.has(a.id)) return;
      let at = out.length;
      for (let j = ai + 1; j < canon.length; j++) { const k = out.findIndex(x => x.id === canon[j].id); if (k >= 0) { at = k; break; } }
      out.splice(at, 0, { ...a }); seen.add(a.id);
    });
    layout[sc.id] = out;
  });
  // Migra páginas viejas "Banners"/"Promociones" a la biblioteca (apagadas).
  ["banners", "promotions"].forEach(pg => {
    (Array.isArray(cfg && cfg.blocks && cfg.blocks[pg]) ? cfg.blocks[pg] : []).forEach(e => {
      if (e && (e.title || e.image) && !e.ref) legacyBanner(e, true);
    });
  });
  return { masters, layout };
}

function EditorVisual({ toast, cfg = {}, onCfg }) {
  const initRef = useRef(null);
  if (!initRef.current) initRef.current = normalizeCfg(cfg);
  const [masters, setMasters] = useState(initRef.current.masters);
  const [layout, setLayout] = useState(initRef.current.layout);
  const [screen, setScreen] = useState("inicio"); // id de pantalla o 'library'
  const [sel, setSel] = useState(null);           // master id seleccionado
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showLeft, setShowLeft] = useState(true);
  const [showRight, setShowRight] = useState(false); // el panel de edición abre SOLO con "Editar"
  const [showCats, setShowCats] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [useLib, setUseLib] = useState(null);      // {mid} → modal "Usar en"
  const [slide, setSlide] = useState(0);           // slide seleccionado del carrusel
  const [dIdx, setDIdx] = useState(null);
  const [dOv, setDOv] = useState(null);
  const uploadRef = useRef(null);
  const uploadTgt = useRef(null);                  // {mid, field} | {mid, slide, field}

  const touch = () => setDirty(true);
  const selM = sel ? masters[sel] : null;
  useEffect(() => { setSlide(0); }, [sel]);

  // ── Mutaciones de contenido (masters) ──
  const patchMaster = (id, patch) => { setMasters(m => ({ ...m, [id]: { ...m[id], ...patch } })); touch(); };
  const patchSlide = (id, i, patch) => setMasters(m => {
    const mm = m[id]; const sl = [...(mm.slides || [])]; sl[i] = { ...sl[i], ...patch };
    return { ...m, [id]: { ...mm, slides: sl } };
  });
  const slideMut = (id, fn) => { setMasters(m => { const mm = m[id]; return { ...m, [id]: { ...mm, slides: fn([...(mm.slides || [])]) } }; }); touch(); };
  const addSlide = id => slideMut(id, sl => [...sl, { id: mkId("s"), bg: RET_BGS[sl.length % RET_BGS.length], title: "Nuevo slide", sub: "", badge: "", cta: "Ver más", ctaAction: "busqueda", image: "" }]);
  const delSlide = (id, i) => slideMut(id, sl => sl.filter((_, k) => k !== i));
  const moveSlide = (id, i, dir) => slideMut(id, sl => { const j = i + dir; if (j < 0 || j >= sl.length) return sl; const n = [...sl]; const [x] = n.splice(i, 1); n.splice(j, 0, x); return n; });

  // ── Pantallas donde está publicado un master ──
  const screensOf = id => SCREENS.filter(sc => (layout[sc.id] || []).some(e => e.ref === id)).map(sc => sc.id);
  const setScreensFor = (id, wanted) => {
    setLayout(prev => {
      const next = { ...prev };
      SCREENS.forEach(sc => {
        const has = (next[sc.id] || []).some(e => e.ref === id);
        const want = wanted.includes(sc.id);
        if (want && !has) next[sc.id] = [...next[sc.id], { id: mkId("e"), ref: id }];
        else if (!want && has) next[sc.id] = next[sc.id].filter(e => e.ref !== id);
      });
      return next;
    });
    touch();
  };

  // ── Añadir / quitar / duplicar bloques en la pantalla actual ──
  const isScreen = screen !== "library";
  const entries = isScreen ? (layout[screen] || []) : [];
  const addBlock = kind => {
    const m = blankMaster(kind);
    setMasters(mm => ({ ...mm, [m.id]: m }));
    setLayout(prev => ({ ...prev, [screen]: [...(prev[screen] || []), { id: mkId("e"), ref: m.id }] }));
    setSel(m.id); setAddOpen(false); touch();
    toast(kind === "carousel" ? "🎠 Carrusel añadido" : "🖼️ Banner añadido");
  };
  const removeRef = (entryId, mid) => {
    setLayout(prev => ({ ...prev, [screen]: prev[screen].filter(e => e.id !== entryId) }));
    // si el master no queda referenciado en ninguna pantalla y no es de biblioteca → bórralo
    setTimeout(() => setMasters(prev => {
      const used = SCREENS.some(sc => (layout[sc.id] || []).some(e => e.ref === mid && e.id !== entryId));
      if (!used && prev[mid] && !prev[mid].lib) { const n = { ...prev }; delete n[mid]; return n; }
      return prev;
    }), 0);
    if (sel === mid) setSel(null);
    touch(); toast("Bloque quitado de esta pantalla");
  };
  const dupBlock = mid => {
    const src = masters[mid]; if (!src) return;
    const nid = mkId("m"); const copy = { ...JSON.parse(JSON.stringify(src)), id: nid, lib: false };
    setMasters(mm => ({ ...mm, [nid]: copy }));
    setLayout(prev => ({ ...prev, [screen]: [...prev[screen], { id: mkId("e"), ref: nid }] }));
    setSel(nid); touch(); toast("Bloque duplicado");
  };

  // ── Biblioteca de contenido ──
  const libItems = Object.values(masters).filter(m => m && m.lib);
  const saveToLibrary = mid => {
    const src = masters[mid]; if (!src) return;
    const nid = mkId("m"); setMasters(mm => ({ ...mm, [nid]: { ...JSON.parse(JSON.stringify(src)), id: nid, lib: true, active: false } }));
    touch(); toast("📚 Guardado en Contenido");
  };
  const useFromLibrary = (mid, wanted) => {
    const src = masters[mid]; if (!src || !wanted.length) return;
    const nid = mkId("m"); const copy = { ...JSON.parse(JSON.stringify(src)), id: nid, lib: false, active: true };
    setMasters(mm => ({ ...mm, [nid]: copy }));
    setLayout(prev => { const next = { ...prev }; wanted.forEach(s => { next[s] = [...(next[s] || []), { id: mkId("e"), ref: nid }]; }); return next; });
    setUseLib(null); touch(); toast("Insertado en las pantallas elegidas");
  };
  const delLibItem = mid => { setMasters(prev => { const n = { ...prev }; delete n[mid]; return n; }); if (sel === mid) setSel(null); touch(); toast("Eliminado de Contenido"); };

  // ── Drag & drop (reordenar refs en la pantalla; anclas fijas) ──
  const onDrop = i => {
    if (dIdx === null || dIdx === i) { setDIdx(null); setDOv(null); return; }
    setLayout(prev => { const arr = [...prev[screen]]; const [m] = arr.splice(dIdx, 1); arr.splice(i, 0, m); return { ...prev, [screen]: arr }; });
    setDIdx(null); setDOv(null); touch(); toast("Posición actualizada");
  };

  // ── Imagen ──
  const pickImage = tgt => { uploadTgt.current = tgt; uploadRef.current && uploadRef.current.click(); };
  const onImage = e => {
    const f = e.target.files && e.target.files[0]; const t = uploadTgt.current;
    if (!f || !t) return;
    const r = new FileReader();
    r.onload = ev => {
      if (t.slide != null) patchSlide(t.mid, t.slide, { image: ev.target.result });
      else patchMaster(t.mid, { image: ev.target.result });
      touch(); toast("🖼 Imagen aplicada"); uploadTgt.current = null;
    };
    r.readAsDataURL(f); e.target.value = "";
  };

  // ── Guardar y publicar ──
  const save = () => {
    if (!onCfg) { toast("⚠️ No se pudo guardar"); return; }
    setSaving(true);
    try { onCfg({ blocks: layout, masters }); } catch (e) {}
    setTimeout(() => { setSaving(false); setDirty(false); toast("🚀 Guardado y publicado — en vivo para todos"); }, 550);
  };

  const DEST = DESTINOS;

  return (
    <div className="ve-root">
      {/* TOOLBAR */}
      <div className="ve-tb">
        {dirty && <span className="ve-unsv">SIN GUARDAR</span>}
        <div style={{ flex: 1 }} />
        <button className="btn btp sm" onClick={save} disabled={saving} style={{ flexShrink: 0 }}>
          {saving ? <span className="spin">↻</span> : "🚀"} {saving ? "Guardando…" : "Guardar y Publicar"}
        </button>
      </div>

      <div className="ve-body">
        {/* IZQUIERDA: pantallas + biblioteca */}
        <div className={`ve-left ${showLeft ? "" : "collapsed"}`}>
          <div className="ve-left-inner">
            <div className="ve-left-scroll" style={{ paddingTop: 6 }}>
              <div className="ve-grp">Pantallas de la plataforma</div>
              {SCREENS.map(sc => (
                <div key={sc.id} className={`ve-area ${screen === sc.id ? "on" : ""}`} onClick={() => { setScreen(sc.id); setSel(null); }}>
                  <span className="ve-ai">{sc.icon}</span>
                  <span className="ve-al">{sc.label}</span>
                  <span style={{ marginLeft: "auto", fontSize: 9, color: "var(--tx3)", flexShrink: 0 }}>{(layout[sc.id] || []).filter(e => e.ref).length}</span>
                </div>
              ))}
              <div className="ve-grp">Contenido</div>
              <div className={`ve-area ${screen === "library" ? "on" : ""}`} onClick={() => { setScreen("library"); setSel(null); }}>
                <span className="ve-ai">📚</span>
                <span className="ve-al">Contenido guardado</span>
                <span style={{ marginLeft: "auto", fontSize: 9, color: "var(--tx3)", flexShrink: 0 }}>{libItems.length}</span>
              </div>
              <div style={{ height: 12 }} />
            </div>
          </div>
        </div>

        {/* CANVAS */}
        <div className="ve-canvas">
          <div className="ve-canvas-bar">
            <button className="vp-btn" style={{ flexShrink: 0, padding: "5px 10px", fontSize: 13, fontWeight: 800 }} onClick={() => setShowLeft(v => !v)}>{showLeft ? "◀" : "☰"}</button>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0, overflow: "hidden" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--tx)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {isScreen ? (SCREENS.find(s => s.id === screen) || {}).label : "📚 Contenido guardado"}
              </span>
              <span className="bdg bg" style={{ fontSize: 8, flexShrink: 0 }}>LIVE</span>
            </div>
            {screen === "busqueda" && <button className="btn btg sm" onClick={() => setShowCats(true)} style={{ flexShrink: 0, fontSize: 11, padding: "4px 9px" }}>◎ Categorías</button>}
            {isScreen && <button className="btn btp sm" onClick={() => setAddOpen(true)} style={{ flexShrink: 0, fontSize: 11, padding: "4px 11px" }}>+ Añadir</button>}
          </div>

          <div className="ve-canvas-scroll">
            <div className="ve-frame" style={{ maxWidth: 430 }}>
              {isScreen ? (
                <>
                  {entries.map((e, i) => {
                    if (isAnchor(e)) return (
                      <div key={e.id} className={["ve-blk sys-blk", dOv === i && dIdx !== null ? "dragover" : ""].filter(Boolean).join(" ")} style={{ opacity: .96 }}
                        onDragOver={ev => { ev.preventDefault(); setDOv(i); }} onDrop={ev => { ev.preventDefault(); onDrop(i); }} onDragEnd={() => { setDIdx(null); setDOv(null); }}>
                        <div className="ve-blk-lbl">{e.title} · fijo</div>
                        <div style={{ padding: "12px 14px", background: "var(--bg2)", borderLeft: "3px solid var(--ac)", display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 15, opacity: .85 }}>{e.icon || "▦"}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--tx)" }}>{e.title}</div>
                            <div style={{ fontSize: 9, color: "var(--tx3)", marginTop: 2 }}>Parte fija de la app · ancla de posición: suelta tus banners antes o después de aquí</div>
                          </div>
                          <span style={{ fontSize: 8, fontWeight: 800, color: "var(--tx3)", background: "var(--bg3)", padding: "3px 7px", borderRadius: 20 }}>SISTEMA</span>
                        </div>
                      </div>
                    );
                    const m = masters[e.ref]; if (!m) return null;
                    const pubs = screensOf(m.id);
                    return (
                      <div key={e.id} draggable className={["ve-blk", sel === m.id ? "sel" : "", !m.active ? "hidden-blk" : "", dOv === i && dIdx !== i ? "dragover" : ""].filter(Boolean).join(" ")}
                        onClick={() => setSel(m.id)}
                        onDragStart={() => setDIdx(i)} onDragOver={ev => { ev.preventDefault(); setDOv(i); }} onDrop={ev => { ev.preventDefault(); onDrop(i); }} onDragEnd={() => { setDIdx(null); setDOv(null); }}>
                        <div className="ve-handle">{[0, 1, 2, 3, 4, 5].map(k => <div key={k} className="ve-hdot" />)}</div>
                        <div className="ve-blk-lbl">
                          {m.kind === "carousel" ? "🎠 Carrusel" : "🖼️ Banner"}{Number(m.everyN) > 0 ? ` · 📢 anuncio cada ${m.everyN}` : ""}{!m.active ? " · oculto" : ""}{pubs.length > 1 ? ` · en ${pubs.length} pantallas` : ""}
                        </div>
                        <div className="ve-blk-bar" onClick={ev => ev.stopPropagation()}>
                          <button className="ve-blk-btn" onClick={() => { setSel(m.id); setShowRight(true); }}>Editar</button>
                          <button className="ve-blk-btn" onClick={() => { patchMaster(m.id, { active: !m.active }); }}>{m.active ? "Ocultar" : "Mostrar"}</button>
                          <button className="ve-blk-btn" onClick={() => dupBlock(m.id)}>Duplicar</button>
                          <button className="ve-blk-btn" onClick={() => saveToLibrary(m.id)}>Guardar en Contenido</button>
                          <button className="ve-blk-btn del" onClick={ev => { ev.stopPropagation(); removeRef(e.id, m.id); }}>✕</button>
                        </div>
                        <div style={{ padding: "8px 8px 10px" }}><PreviewBlock m={m} /></div>
                      </div>
                    );
                  })}
                  <div className={["ve-add-btn", dOv === entries.length && dIdx !== null ? "dragover" : ""].filter(Boolean).join(" ")} onClick={() => setAddOpen(true)}
                    onDragOver={ev => { ev.preventDefault(); setDOv(entries.length); }} onDrop={ev => { ev.preventDefault(); onDrop(entries.length); }} onDragEnd={() => { setDIdx(null); setDOv(null); }}>
                    <span style={{ fontSize: 16 }}>+</span> Añadir banner o carrusel <span style={{ fontSize: 10, opacity: .7 }}>· o suelta aquí un banner para ponerlo al final</span></div>
                </>
              ) : (
                // BIBLIOTECA
                <div>
                  <div style={{ fontSize: 11, color: "var(--tx2)", lineHeight: 1.5, padding: "4px 4px 12px" }}>
                    Bloques reutilizables. No se pintan en ninguna pantalla por sí mismos. Usa “Usar en…” para insertarlos como copia independiente.
                  </div>
                  {libItems.length === 0 && <div className="ve-empty"><div style={{ fontSize: 32, marginBottom: 10, opacity: .2 }}>📚</div><div style={{ fontSize: 12, color: "var(--tx)" }}>Biblioteca vacía</div><div className="ve-empty-hint">Desde cualquier bloque, toca “Guardar en Contenido”.</div></div>}
                  {libItems.map(m => (
                    <div key={m.id} className={`ve-blk ${sel === m.id ? "sel" : ""}`} onClick={() => setSel(m.id)}>
                      <div className="ve-blk-lbl">{m.kind === "carousel" ? "🎠 Carrusel" : "🖼️ Banner"} · en biblioteca</div>
                      <div className="ve-blk-bar" onClick={ev => ev.stopPropagation()}>
                        <button className="ve-blk-btn" onClick={() => { setSel(m.id); setShowRight(true); }}>Editar</button>
                        <button className="ve-blk-btn" onClick={() => setUseLib({ mid: m.id })}>Usar en…</button>
                        <button className="ve-blk-btn del" onClick={ev => { ev.stopPropagation(); delLibItem(m.id); }}>✕</button>
                      </div>
                      <div style={{ padding: "8px 8px 10px" }}><PreviewBlock m={m} /></div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ height: 40 }} />
            </div>
          </div>
        </div>

        {/* DERECHA: propiedades */}
        <div className={`ve-right ${showRight ? "" : "collapsed"}`}>
          <div className="ve-right-toggle" onClick={() => setShowRight(v => !v)}>{showRight ? "›" : "‹"}</div>
          <div className="ve-right-inner">
            {!selM ? (
              <>
                <div className="ve-ph"><div className="ve-pt">Propiedades</div><div className="ve-ps">Sin bloque seleccionado</div></div>
                <div className="ve-empty"><div style={{ fontSize: 32, marginBottom: 10, opacity: .2 }}>◫</div><div style={{ fontSize: 12, fontWeight: 600, color: "var(--tx)", marginBottom: 6 }}>Sin selección</div><div className="ve-empty-hint">Toca un bloque del lienzo para editarlo aquí.</div></div>
              </>
            ) : (
              <>
                <div className="ve-ph">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <div className="ve-pt">{selM.kind === "carousel" ? "🎠 Carrusel" : "🖼️ Banner"}</div>
                    <button style={{ background: "none", border: "none", color: "var(--tx3)", cursor: "pointer", fontSize: 18, lineHeight: 1 }} onClick={() => setShowRight(false)}>×</button>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Tog on={selM.active} ch={() => patchMaster(selM.id, { active: !selM.active })} />
                    <span style={{ fontSize: 11, color: selM.active ? "var(--gn)" : "var(--tx3)" }}>{selM.active ? "Visible" : "Oculto"}</span>
                  </div>
                </div>
                <div className="ve-pb">
                  {selM.kind === "carousel" ? (
                    <>
                      <div className="ve-sec">Slides del carrusel</div>
                      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, marginBottom: 8 }}>
                        {(selM.slides || []).map((s, i) => (
                          <div key={s.id} onClick={() => setSlide(i)} style={{ flex: "0 0 auto", cursor: "pointer", width: i === slide ? 92 : 58 }}>
                            <div style={{ width: "100%", aspectRatio: "16 / 9", borderRadius: 8, overflow: "hidden", border: `2px solid ${i === slide ? "var(--ac)" : "var(--bd2)"}`, background: s.image ? `center/cover url(${s.image})` : (s.bg || RET_BGS[0]), display: "flex", alignItems: "flex-end", padding: 4 }}>
                              <span style={{ fontSize: 8, fontWeight: 800, color: "#fff", textShadow: "0 1px 3px #000", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", maxWidth: "100%" }}>{s.title || `Slide ${i + 1}`}</span>
                            </div>
                          </div>
                        ))}
                        <button onClick={() => addSlide(selM.id)} style={{ flex: "0 0 auto", width: 40, aspectRatio: "16 / 9", borderRadius: 8, border: "1.5px dashed var(--bd2)", background: "var(--bg2)", color: "var(--ac2)", fontSize: 18, cursor: "pointer" }}>+</button>
                      </div>
                      {selM.slides && selM.slides[slide] && (() => { const s = selM.slides[slide]; const i = slide; return (
                        <div style={{ background: "var(--bg2)", border: "1px solid var(--bd)", borderRadius: 10, padding: 10, marginBottom: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: "var(--tx)" }}>Slide {i + 1} de {selM.slides.length}</span>
                            <div style={{ display: "flex", gap: 4 }}>
                              <button className="ve-blk-btn" onClick={() => moveSlide(selM.id, i, -1)} disabled={i === 0}>↑</button>
                              <button className="ve-blk-btn" onClick={() => moveSlide(selM.id, i, 1)} disabled={i === selM.slides.length - 1}>↓</button>
                              <button className="ve-blk-btn del" onClick={() => { delSlide(selM.id, i); setSlide(Math.max(0, i - 1)); }} disabled={selM.slides.length <= 1}>✕</button>
                            </div>
                          </div>
                          <div className="ve-field"><label className="ve-lbl">Imagen del slide</label>
                            {s.image && <div style={{ position: "relative", marginBottom: 6 }}><img src={s.image} alt="" style={{ width: "100%", height: 70, objectFit: "cover", borderRadius: 6 }} /><button onClick={() => patchSlide(selM.id, i, { image: "" })} style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,.6)", color: "#fff", border: "none", borderRadius: 5, fontSize: 10, padding: "2px 6px", cursor: "pointer" }}>Quitar</button></div>}
                            <button className="btn btg sm" style={{ width: "100%", justifyContent: "center" }} onClick={() => pickImage({ mid: selM.id, slide: i, field: "image" })}>↑ {s.image ? "Cambiar" : "Subir imagen"}</button>
                          </div>
                          {!s.image && <div className="ve-field"><label className="ve-lbl">Fondo (sin imagen)</label>
                            <div className="sw-grid">{RET_BGS.concat(["transparent"]).map((g, k) => <div key={k} className={`sw ${s.bg === g ? "active" : ""}`} style={{ background: g === "transparent" ? "var(--bg3)" : g }} onClick={() => patchSlide(selM.id, i, { bg: g })} />)}</div>
                          </div>}
                          <div className="ve-field"><label className="ve-lbl">Título</label><CommitInput value={s.title} onCommit={v => patchSlide(selM.id, i, { title: v })} /></div>
                          <div className="ve-field"><label className="ve-lbl">Subtítulo</label><CommitInput textarea value={s.sub} onCommit={v => patchSlide(selM.id, i, { sub: v })} /></div>
                          <div className="ve-field"><label className="ve-lbl">Badge</label><CommitInput value={s.badge} onCommit={v => patchSlide(selM.id, i, { badge: v })} /></div>
                          <div className="ve-field"><label className="ve-lbl">Botón (texto)</label><CommitInput value={s.cta} onCommit={v => patchSlide(selM.id, i, { cta: v })} /></div>
                          <div className="ve-field"><label className="ve-lbl">Botón — a dónde lleva</label>
                            <select className="ve-inp" value={s.ctaAction || ""} onChange={ev => patchSlide(selM.id, i, { ctaAction: ev.target.value })}>{DEST.map(d => <option key={d.v} value={d.v}>{d.l}</option>)}</select>
                          </div>
                        </div>
                      ); })()}
                    </>
                  ) : (
                    <>
                      <div className="ve-sec">Contenido</div>
                      <div className="ve-field"><label className="ve-lbl">Imagen</label>
                        {selM.image && <div style={{ position: "relative", marginBottom: 6 }}><img src={selM.image} alt="" style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 6 }} /><button onClick={() => patchMaster(selM.id, { image: "" })} style={{ position: "absolute", top: 5, right: 5, background: "rgba(0,0,0,.6)", color: "#fff", border: "none", borderRadius: 5, fontSize: 10, padding: "2px 6px", cursor: "pointer" }}>Quitar</button></div>}
                        <button className="btn btg sm" style={{ width: "100%", justifyContent: "center" }} onClick={() => pickImage({ mid: selM.id, field: "image" })}>↑ {selM.image ? "Cambiar imagen" : "Subir imagen"}</button>
                      </div>
                      {!selM.image && <div className="ve-field"><label className="ve-lbl">Fondo (sin imagen)</label>
                        <div className="sw-grid">{RET_BGS.concat(["transparent"]).map((g, k) => <div key={k} className={`sw ${selM.bg === g ? "active" : ""}`} style={{ background: g === "transparent" ? "var(--bg3)" : g }} onClick={() => patchMaster(selM.id, { bg: g })} />)}</div>
                      </div>}
                      <div className="ve-field"><label className="ve-lbl">Título</label><CommitInput value={selM.title} onCommit={v => patchMaster(selM.id, { title: v })} /></div>
                      <div className="ve-field"><label className="ve-lbl">Subtítulo</label><CommitInput textarea value={selM.sub} onCommit={v => patchMaster(selM.id, { sub: v })} /></div>
                      <div className="ve-field"><label className="ve-lbl">Badge / Etiqueta</label><CommitInput value={selM.badge} onCommit={v => patchMaster(selM.id, { badge: v })} placeholder="Ej: NUEVO, HOY" /></div>
                      <div className="ve-div" />
                      <div className="ve-sec">Botón principal</div>
                      <div className="ve-field"><label className="ve-lbl">Texto</label><CommitInput value={selM.cta} onCommit={v => patchMaster(selM.id, { cta: v })} placeholder="Ej: Ver más" /></div>
                      <div className="ve-field"><label className="ve-lbl">A dónde lleva</label>
                        <select className="ve-inp" value={selM.ctaAction || ""} onChange={ev => patchMaster(selM.id, { ctaAction: ev.target.value })}>{DEST.map(d => <option key={d.v} value={d.v}>{d.l}</option>)}</select>
                      </div>
                      <div className="ve-field"><label className="ve-lbl">Segundo botón (opcional)</label><CommitInput value={selM.cta2} onCommit={v => patchMaster(selM.id, { cta2: v })} placeholder="Vacío = sin segundo botón" /></div>
                      {selM.cta2 ? <div className="ve-field"><label className="ve-lbl">Segundo botón — a dónde lleva</label>
                        <select className="ve-inp" value={selM.cta2Action || ""} onChange={ev => patchMaster(selM.id, { cta2Action: ev.target.value })}>{DEST.map(d => <option key={d.v} value={d.v}>{d.l}</option>)}</select>
                      </div> : null}
                    </>
                  )}

                  <div className="ve-div" />
                  <div className="ve-sec">Formato (forma)</div>
                  <Chips options={FORMATS} value={selM.format || "3:1"} onChange={v => patchMaster(selM.id, { format: v })} />
                  <div className="ve-div" />
                  <div className="ve-sec">Posición del botón</div>
                  <Chips options={CTA_POS} value={selM.ctaPos || "left"} onChange={v => patchMaster(selM.id, { ctaPos: v })} />

                  <div className="ve-div" />
                  <div className="ve-sec">📢 Anuncio en el feed</div>
                  <div className="ve-field">
                    <label className="ve-lbl">Repetir cada N productos (0 = no; sale en su posición)</label>
                    <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                      {[0, 20, 40, 80].map(n => (
                        <button key={n} onClick={() => patchMaster(selM.id, { everyN: n })}
                          style={{ flex: 1, fontSize: 11, fontWeight: 800, padding: "7px 4px", borderRadius: 8, cursor: "pointer",
                            background: (Number(selM.everyN) || 0) === n ? "var(--ac)" : "var(--bg2)", color: (Number(selM.everyN) || 0) === n ? "#fff" : "var(--tx2)", border: `1px solid ${(Number(selM.everyN) || 0) === n ? "var(--ac)" : "var(--bd2)"}` }}>
                          {n === 0 ? "No" : n}
                        </button>
                      ))}
                    </div>
                    <input className="ve-inp" type="number" min="0" value={Number(selM.everyN) || 0}
                      onChange={ev => { const n = Math.max(0, parseInt(ev.target.value, 10) || 0); patchMaster(selM.id, { everyN: n }); }} placeholder="Número libre" />
                    <div style={{ fontSize: 10, color: "var(--tx3)", marginTop: 5, lineHeight: 1.4 }}>Se intercala dentro del feed de <b>Inicio</b> y <b>Búsqueda</b> (posición 20, 40, 60…). Con 0 sale una sola vez, donde lo pongas.</div>
                  </div>

                  {!selM.lib && (<>
                    <div className="ve-div" />
                    <div className="ve-sec">📍 Publicar en</div>
                    <ScreenChecks selected={screensOf(selM.id)} onToggle={id => { const cur = screensOf(selM.id); setScreensFor(selM.id, cur.includes(id) ? cur.filter(x => x !== id) : cur.concat(id)); }} />
                    <div style={{ fontSize: 10, color: "var(--tx3)", marginTop: 6, lineHeight: 1.4 }}>El contenido es uno solo; la posición es propia de cada pantalla (entra a esa pantalla y arrástralo).</div>
                  </>)}

                  <div className="ve-div" />
                  <div className="ve-sec">Acciones</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {!selM.lib && <button className="btn btg sm" style={{ justifyContent: "flex-start", width: "100%" }} onClick={() => saveToLibrary(selM.id)}>📚 Guardar en Contenido</button>}
                    {selM.lib && <button className="btn btg sm" style={{ justifyContent: "flex-start", width: "100%" }} onClick={() => setUseLib({ mid: selM.id })}>➕ Usar en pantalla(s)…</button>}
                    <button className="btn btd sm" style={{ justifyContent: "flex-start", width: "100%" }} onClick={() => { if (selM.lib) delLibItem(selM.id); else { const e = (layout[screen] || []).find(x => x.ref === selM.id); if (e) removeRef(e.id, selM.id); else setSel(null); } }}>✕ Eliminar</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: Añadir */}
      {addOpen && (
        <div className="mo" onClick={() => setAddOpen(false)}>
          <div className="mb" style={{ width: 460 }} onClick={e => e.stopPropagation()}>
            <div className="mt">Añadir a esta pantalla</div>
            <div className="ms">Elige qué insertar</div>
            <div className="amgrid">
              <div className="amcard" onClick={() => addBlock("banner")}>
                <div className="amprev" style={{ background: RET_BGS[0] }}><span style={{ fontSize: 16 }}>🖼️</span></div>
                <div className="aminfo"><div className="amname">Banner</div><div className="amdesc">Imagen o color, título, botón. Se pinta individual.</div></div>
              </div>
              <div className="amcard" onClick={() => addBlock("carousel")}>
                <div className="amprev" style={{ background: RET_BGS[2] }}><span style={{ fontSize: 16 }}>🎠</span></div>
                <div className="aminfo"><div className="amname">Carrusel deslizable</div><div className="amdesc">Varios slides, cada uno con su imagen y su botón.</div></div>
              </div>
            </div>
            <div className="mact"><button className="btn btg sm" onClick={() => setAddOpen(false)}>Cancelar</button></div>
          </div>
        </div>
      )}

      {/* MODAL: Usar en (biblioteca) */}
      {useLib && (
        <div className="mo" onClick={() => setUseLib(null)}>
          <div className="mb" style={{ width: 380 }} onClick={e => e.stopPropagation()}>
            <div className="mt">Usar en pantalla(s)</div>
            <div className="ms">Se inserta una copia independiente en las pantallas marcadas.</div>
            <UseInPicker onConfirm={ids => useFromLibrary(useLib.mid, ids)} onCancel={() => setUseLib(null)} />
          </div>
        </div>
      )}

      {/* OVERLAY: Categorías (Búsqueda) */}
      {showCats && (
        <div className="mo" onClick={() => setShowCats(false)} style={{ alignItems: "flex-start" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "var(--bg1)", border: "1px solid var(--bd2)", borderRadius: 16, padding: "16px 16px 20px", maxWidth: 480, width: "100%", margin: "36px auto 20px", position: "relative", maxHeight: "calc(100% - 56px)", overflowY: "auto" }}>
            <button onClick={() => setShowCats(false)} style={{ position: "absolute", top: 12, right: 14, background: "none", border: "none", color: "var(--tx2)", fontSize: 20, cursor: "pointer", zIndex: 2 }}>×</button>
            <CategoryManager />
          </div>
        </div>
      )}

      <input ref={uploadRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onImage} />
    </div>
  );
}

// Picker de pantallas para "Usar en…"
function UseInPicker({ onConfirm, onCancel }) {
  const [sel, setSel] = useState(["inicio"]);
  return (
    <div>
      <div style={{ margin: "10px 0" }}>
        <ScreenChecks selected={sel} onToggle={id => setSel(s => s.includes(id) ? s.filter(x => x !== id) : s.concat(id))} />
      </div>
      <div className="mact">
        <button className="btn btg sm" onClick={onCancel}>Cancelar</button>
        <button className="btn btp sm" disabled={!sel.length} onClick={() => onConfirm(sel)}>Insertar</button>
      </div>
    </div>
  );
}


function Overview({toast, data={}, go}){
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => {
    setLoading(true);
    adminDashboardStats().then(s => { setStats(s); setLoading(false); }).catch(() => { setStats(null); setLoading(false); });
  }, []);
  useEffect(() => { load(); }, [load]);
  // Refresco EN VIVO: cuando cambian solicitudes o pedidos, recalcula (debounce).
  useEffect(() => {
    let t = null; const bump = () => { clearTimeout(t); t = setTimeout(load, 1500); };
    const ch = supabase.channel(`admin-dash-${Date.now()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "verifications" }, bump)
      .on("postgres_changes", { event: "*", schema: "public", table: "plan_requests" }, bump)
      .on("postgres_changes", { event: "*", schema: "public", table: "courier_applications" }, bump)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, bump)
      .subscribe();
    return () => { clearTimeout(t); try { Promise.resolve(supabase.removeChannel(ch)).catch(()=>{}); } catch(e){} };
  }, [load]);

  const s = stats || {};
  const n = v => Number(v) || 0;
  const num = v => n(v).toLocaleString('es-ES');
  const cash = v => '$' + Math.round(n(v)).toLocaleString('es-ES');

  // Tarjeta reutilizable. Si `onClick`, es tocable (navega). `gold` = acento dorado.
  const Card = ({ icon, label, value, sub, gold, onClick, badge }) => (
    <div className="mc" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default', position:'relative', border: gold ? `1px solid ${G}55` : undefined }}>
      {badge > 0 && <span style={{ position:'absolute', top:8, right:8, minWidth:18, height:18, borderRadius:999, background:G, color:'#000', fontSize:10.5, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 5px' }}>{badge}</span>}
      <div style={{ fontSize:20, marginBottom:7 }}>{icon}</div>
      <div className="ml">{label}</div>
      <div className="mv" style={{ color: gold ? G : undefined }}>{value}</div>
      {sub && <div style={{ fontSize:10, color:'var(--tx3)', marginTop:3, fontWeight:500 }}>{sub}</div>}
    </div>
  );
  const Head = ({ children }) => <div style={{ fontSize:12, fontWeight:800, color:'var(--tx2,#aaa)', letterSpacing:'.03em', margin:'6px 0 9px' }}>{children}</div>;

  const pendV = n(s.pending_verifications), pendP = n(s.pending_plans), pendC = n(s.pending_couriers);

  return <>
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
      <div>
        <div className="stit">Resumen General</div>
        <div className="ssub">Números reales de tu plataforma · RETADOR</div>
      </div>
      <button className="btn sm" onClick={load} disabled={loading}>{loading ? '…' : '↻ Actualizar'}</button>
    </div>

    {loading && !stats
      ? <div style={{ textAlign:'center', color:'var(--tx3)', fontSize:13, padding:'40px 0' }}>Cargando métricas…</div>
      : stats === null
        ? <div className="card cp" style={{ textAlign:'center', color:'var(--tx3)', fontSize:12, padding:'28px 12px' }}>No se pudieron cargar las métricas. Toca ↻ Actualizar para reintentar.</div>
        : <>
          <Head>💰 Negocio</Head>
          <div className="g4 mb16">
            <Card icon="💵" label="Ventas completadas" value={cash(s.gmv_completed)} sub="pedidos entregados" />
            <Card icon="📈" label="Comisiones acumuladas" value={cash(s.commission_total)} sub="ganado hasta hoy" />
            <Card icon="🪙" label="Comisiones por cobrar" value={cash(s.commission_pending)} sub="tu dinero pendiente" gold />
          </div>

          <Head>📦 Actividad</Head>
          <div className="g4 mb16">
            <Card icon="🛒" label="Pedidos activos" value={num(s.orders_active)} sub="en curso ahora" />
            <Card icon="✅" label="Pedidos completados" value={num(s.orders_completed)} />
            <Card icon="🗓️" label="Pedidos esta semana" value={num(s.orders_week)} />
            <Card icon="💬" label="Mensajes esta semana" value={num(s.messages_week)} />
          </div>

          <Head>👥 Comunidad</Head>
          <div className="g4 mb16">
            <Card icon="👤" label="Usuarios" value={num(s.users_total)} sub={n(s.users_week) > 0 ? `+${num(s.users_week)} esta semana` : 'sin altas esta semana'} />
            <Card icon="🏪" label="Vendedores" value={num(s.sellers)} />
            <Card icon="🛵" label="Mensajeros" value={num(s.couriers)} />
            <Card icon="✓" label="Verificados" value={num(s.verified_users)} />
            <Card icon="⛔" label="Suspendidos" value={num(s.suspended_users)} />
          </div>

          <Head>🛍️ Catálogo</Head>
          <div className="g4 mb16">
            <Card icon="📦" label="Productos activos" value={num(s.products_active)} />
            <Card icon="🛠️" label="Servicios activos" value={num(s.services_active)} />
            <Card icon="🚫" label="Retirados" value={num(s.products_rejected)} />
          </div>

          <Head>⏳ Pendientes de ti</Head>
          <div className="g4 mb16">
            <Card icon="🪪" label="Verificaciones" value={num(pendV)} sub={pendV ? 'toca para revisar' : 'todo al día'} gold={pendV > 0} badge={pendV} onClick={() => go && go('verif')} />
            <Card icon="⭐" label="Planes" value={num(pendP)} sub={pendP ? 'toca para revisar' : 'todo al día'} gold={pendP > 0} badge={pendP} onClick={() => go && go('plans')} />
            <Card icon="🛵" label="Mensajeros" value={num(pendC)} sub={pendC ? 'toca para revisar' : 'todo al día'} gold={pendC > 0} badge={pendC} onClick={() => go && go('delivery')} />
          </div>

          <div className="card cp">
            <div className="ch"><span className="ct">Acciones rápidas</span></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:7 }}>
              <button className="btn btg" style={{ justifyContent:'flex-start', width:'100%', fontSize:11 }} onClick={()=>go&&go('ops')}><span>📦</span>Ver Órdenes</button>
              <button className="btn btg" style={{ justifyContent:'flex-start', width:'100%', fontSize:11 }} onClick={()=>go&&go('modq')}><span>🛡️</span>Moderación</button>
              <button className="btn btg" style={{ justifyContent:'flex-start', width:'100%', fontSize:11 }} onClick={()=>go&&go('users','Usuarios')}><span>👥</span>Usuarios</button>
              <button className="btn btg" style={{ justifyContent:'flex-start', width:'100%', fontSize:11 }} onClick={()=>go&&go('eco')}><span>📊</span>Economía</button>
            </div>
          </div>
        </>}
  </>;
}

/* ── Operaciones ────────────────────────────────────────────────────────────── */
// Hoy solo se usa para DELIVERY LOCAL (solo='Delivery'): interruptor real del
// servicio, surge, valoraciones y el registro de mensajeros. Las antiguas
// sub-pestañas (Órdenes/Disputas/Moderación demo) se eliminaron en el cierre.
function Operaciones({toast,data={},solo,ro,onResolved}){
  const sub2 = solo;
  const[confirm,setConfirm]=useState(null);    // diálogo de confirmación {title,msg,danger,yes,onYes}
  const couriers = data.couriers || [];
  const [couView, setCouView] = useState(null);
  const couAct = (id, status) => { data.onCourierAction && data.onCourierAction(id, status); onResolved && onResolved(); };
  const fmt = n=>'$'+Math.round(n||0).toLocaleString();
  const ago = ts=>{ if(!ts) return '—'; const s=Math.floor((Date.now()-ts)/1000); if(s<60) return `${s}s`; const m=Math.floor(s/60); if(m<60) return `${m}m`; const h=Math.floor(m/60); if(h<24) return `${h}h`; return `${Math.floor(h/24)}d`; };
  const ask = (cfg)=>setConfirm(cfg);
  const run = ()=>{ if(confirm?.onYes) confirm.onYes(); if(confirm?.msg2) toast(confirm.msg2); setConfirm(null); };
  return <>
    <div className="stit">Delivery local</div>
    <div className="ssub">Servicio, tarifas dinámicas y mensajeros · control real</div>

    {sub2==='Delivery'&&<>
      {(()=>{ const on = data.cfg?.deliveryServiceActive !== false; return (
        <div className="card cp" style={{marginBottom:12,border:`1px solid ${on?'var(--gn)':'var(--rd)'}`}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}>
            <div style={{minWidth:0}}>
              <div style={{display:'flex',alignItems:'center',gap:7}}>
                <span style={{width:9,height:9,borderRadius:'50%',background:on?'var(--gn)':'var(--rd)',display:'inline-block',flexShrink:0}}/>
                <span style={{fontWeight:800,color:'var(--tx)',fontSize:14}}>{on?'Servicio activo · Operativo':'Servicio inactivo · No operativo'}</span>
              </div>
              <div style={{fontSize:11,color:'var(--tx3)',marginTop:4}}>{on?'Los clientes ven el delivery local disponible y pueden pedir.':'Los clientes lo ven como no disponible. Útil antes del lanzamiento o en días de descanso.'}</div>
            </div>
            {!ro && <button className="btn" onClick={()=>{ data.onCfg&&data.onCfg({deliveryServiceActive:!on}); toast(on?'Servicio puesto INACTIVO':'Servicio puesto ACTIVO'); }} style={{fontWeight:800,padding:'10px 18px',flexShrink:0,border:`1px solid ${on?'var(--rd)':'var(--gn)'}`,color:on?'var(--rd)':'var(--gn)',background:'transparent',borderRadius:10,cursor:'pointer'}}>{on?'Desactivar':'Activar'}</button>}
          </div>
        </div>
      ); })()}
      {(()=>{ const sg = data.cfg?.surgeActive === true; const every=data.cfg?.surgeIntervalMin||30, step=data.cfg?.surgeStepPct||15, cap=data.cfg?.surgeCapPct||60;
        const numRow=(label,val,keyName,suffix,min,max)=>(
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,padding:'9px 0',borderTop:'1px solid var(--bd)'}}>
            <span style={{fontSize:12,color:'var(--tx2)',flex:1}}>{label}</span>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              {!ro && <button onClick={()=>{ const nv=Math.max(min,(Number(val)||min)-(keyName==='surgeIntervalMin'?5:5)); data.onCfg&&data.onCfg({[keyName]:nv}); }} style={{width:30,height:30,borderRadius:8,border:'1px solid var(--bd)',background:'transparent',color:'var(--tx)',fontSize:16,fontWeight:800,cursor:'pointer'}}>−</button>}
              <span style={{minWidth:54,textAlign:'center',fontSize:13,fontWeight:800,color:'var(--tx)'}}>{val}{suffix}</span>
              {!ro && <button onClick={()=>{ const nv=Math.min(max,(Number(val)||min)+5); data.onCfg&&data.onCfg({[keyName]:nv}); }} style={{width:30,height:30,borderRadius:8,border:'1px solid var(--bd)',background:'transparent',color:'var(--tx)',fontSize:16,fontWeight:800,cursor:'pointer'}}>+</button>}
            </div>
          </div>
        );
        return (
        <div className="card cp" style={{marginBottom:12}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}>
            <div style={{minWidth:0}}>
              <div style={{fontWeight:800,color:'var(--tx)',fontSize:13.5}}>🔥 Tarifa dinámica (surge) {sg?'· ON':'· OFF'}</div>
              <div style={{fontSize:11,color:'var(--tx3)',marginTop:4,lineHeight:1.4}}>Si un pedido lleva rato sin que ningún mensajero lo acepte, la tarifa sube sola. Déjalo OFF hasta tener red de mensajeros.</div>
            </div>
            {!ro && <button className="btn" onClick={()=>{ data.onCfg&&data.onCfg({surgeActive:!sg}); toast(sg?'Surge desactivado':'Surge activado'); }} style={{fontWeight:800,padding:'10px 18px',flexShrink:0,border:`1px solid ${sg?'var(--rd)':'var(--gn)'}`,color:sg?'var(--rd)':'var(--gn)',background:'transparent',borderRadius:10,cursor:'pointer'}}>{sg?'Desactivar':'Activar'}</button>}
          </div>
          <div style={{marginTop:10}}>
            {numRow('Sube cada cuánto tiempo',every,'surgeIntervalMin',' min',5,120)}
            {numRow('Cuánto sube cada vez',step,'surgeStepPct','%',5,100)}
            {numRow('Tope máximo de subida',cap,'surgeCapPct','%',10,200)}
          </div>
          <div style={{fontSize:10.5,color:'var(--tx3)',marginTop:8,lineHeight:1.4,fontStyle:'italic'}}>Ejemplo actual: cada {every} min sin aceptar, +{step}% (hasta +{cap}% máximo).</div>
        </div>
      ); })()}
      {(()=>{ const sr=systemRating(); const withMsg=(typeof systemReviews==='function')?systemReviews().slice(0,5):[]; return (
        <div className="card cp" style={{marginBottom:12}}>
          <div className="ch"><span className="ct">Valoración del servicio (RETADOR)</span><span className={`bdg ${sr.count?'by':'bx'}`}>{sr.count?('⭐ '+sr.avg+' · '+sr.count):'Sin reseñas'}</span></div>
          <div style={{fontSize:11,color:'var(--tx3)',margin:'2px 0 8px'}}>Lo que los compradores califican del servicio de entregas, en vivo.</div>
          {withMsg.length>0 && withMsg.map((r,i)=><div key={i} style={{fontSize:11.5,color:'var(--tx)',padding:'7px 0',borderTop:'1px solid var(--bd)'}}>{'⭐'.repeat(Math.max(1,r.stars))} <span style={{color:'var(--tx2)'}}>"{r.msg}"</span></div>)}
        </div>
      ); })()}
      {(()=>{ const pend=couriers.filter(c=>c.status==='pending'); const appr=couriers.filter(c=>c.status==='approved'); return <>
        <div className="card cp" style={{marginBottom:12}}>
          <div className="ch"><span className="ct">Solicitudes de mensajero</span><span className={`bdg ${pend.length?'by':'bx'}`}>{pend.length} PENDIENTES</span></div>
          <div style={{fontSize:11,color:'var(--tx3)',margin:'2px 0 10px'}}>Revisa la identidad de cada persona y decide quién entra al equipo de mensajeros.</div>
          {pend.length===0
            ? <div style={{textAlign:'center',color:'var(--tx3)',fontSize:12,padding:'22px 6px',background:'var(--bg)',borderRadius:10,border:'1px dashed var(--bd2)'}}>No hay solicitudes pendientes.</div>
            : pend.map(c=>(
              <div key={c.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px',background:'var(--bg)',borderRadius:10,border:'1px solid var(--bd)',marginBottom:8}}>
                <div style={{width:42,height:42,borderRadius:10,overflow:'hidden',background:'var(--bg2)',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>
                  {c.selfie? <img src={c.selfie} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : '🛵'}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,color:'var(--tx)',fontSize:13,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{c.nombre||c.userName}</div>
                  <div style={{fontSize:10,color:'var(--tx3)'}}>{c.vehiculo} · {c.zona||'—'} · {c.telefono||'—'}</div>
                </div>
                <button className="btn bts sm" onClick={()=>setCouView(c)}>{ro?'Ver':'Revisar'}</button>
              </div>
            ))}
        </div>
        {appr.length>0&&<div className="card cp" style={{marginBottom:12}}>
          <div className="ch"><span className="ct">Mensajeros activos</span><span className="bdg bb">{appr.length}</span></div>
          {appr.map(c=>(
            <div key={c.id} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 2px',borderBottom:'1px solid var(--bd)'}}>
              <div style={{width:34,height:34,borderRadius:9,overflow:'hidden',background:'var(--bg2)',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15}}>{c.selfie?<img src={c.selfie} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:'🛵'}</div>
              <div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,color:'var(--tx)',fontSize:12.5}}>{c.nombre||c.userName}</div><div style={{fontSize:10,color:'var(--tx3)'}}>{c.vehiculo} · {c.zona||'—'}</div></div>
              {!ro && <button className="btn btd sm" onClick={()=>ask({title:'Quitar mensajero',msg:`Se le retira el acceso de mensajero a ${c.nombre||c.userName}. ¿Continuar?`,danger:true,yes:'Quitar',onYes:()=>couAct(c.id,'rejected'),msg2:'Mensajero retirado'})}>Quitar</button>}
            </div>
          ))}
        </div>}
      </>; })()}
      <div className="card cp">
        <div className="ch"><span className="ct">Entregas en curso</span><span className="bdg bx">monitoreo</span></div>
        <div style={{fontSize:11,color:'var(--tx3)',margin:'2px 0 10px'}}>Los repartidores aceptan y gestionan sus entregas de forma autónoma. Aquí solo monitoreas.</div>
        <div style={{textAlign:'center',color:'var(--tx3)',fontSize:12,padding:'30px 6px',background:'var(--bg)',borderRadius:10,border:'1px dashed var(--bd2)'}}>
          <div style={{fontSize:26,marginBottom:8,opacity:.6}}>🛵</div>
          No hay entregas en curso ahora mismo.<br/>Aparecerán aquí cuando haya envíos activos.
        </div>
      </div>
    </>}
    {couView&&<div className="mo" onClick={()=>setCouView(null)}>
      <div className="mb" onClick={e=>e.stopPropagation()} style={{maxWidth:420,maxHeight:'88vh',overflowY:'auto'}}>
        <div className="mt">Revisar mensajero</div>
        <div style={{display:'flex',gap:11,alignItems:'center',margin:'4px 0 14px'}}>
          <div style={{width:54,height:54,borderRadius:12,overflow:'hidden',background:'var(--bg2)',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>{couView.selfie?<img src={couView.selfie} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:'🛵'}</div>
          <div><div style={{fontWeight:800,color:'var(--tx)',fontSize:15}}>{couView.nombre||couView.userName}</div><div style={{fontSize:11,color:'var(--tx3)'}}>{couView.telefono} · {couView.zona}</div></div>
        </div>
        {(()=>{ const rows=[['Documento',`${couView.docTipo||'—'} · ${couView.docNumero||'—'}`],['Dirección',couView.direccion||'—'],['Zona',couView.zona||'—'],['Transporte',couView.vehiculo||'—'],...(couView.licNumero?[['Licencia',couView.licNumero]]:[]),...(couView.chapa?[['Chapa',couView.chapa]]:[]),['Experiencia',couView.experiencia||'—']];
          return <div style={{background:'var(--bg)',borderRadius:10,border:'1px solid var(--bd)',padding:'4px 12px',marginBottom:12}}>
            {rows.map(([k,v])=><div key={k} style={{display:'flex',justifyContent:'space-between',gap:12,padding:'7px 0',borderBottom:'1px solid var(--bd)',fontSize:11.5}}><span style={{color:'var(--tx3)'}}>{k}</span><span style={{color:'var(--tx)',fontWeight:600,textAlign:'right'}}>{v}</span></div>)}
          </div>; })()}
        <div style={{fontSize:11,fontWeight:700,color:'var(--tx3)',marginBottom:7}}>Verificación de identidad</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:7,marginBottom:14}}>
          {[['Frente',couView.docFront],['Reverso',couView.docBack],['Selfie',couView.selfie],...(couView.licFoto?[['Licencia',couView.licFoto]]:[])].map(([lb,src])=>(
            <div key={lb}>
              <div style={{aspectRatio:'1/1',borderRadius:9,overflow:'hidden',background:'var(--bg2)',border:'1px solid var(--bd)',display:'flex',alignItems:'center',justifyContent:'center'}}>{src?<img src={src} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<span style={{fontSize:9,color:'var(--tx3)'}}>—</span>}</div>
              <div style={{fontSize:9,color:'var(--tx3)',textAlign:'center',marginTop:3}}>{lb}</div>
            </div>
          ))}
        </div>
        <div style={{fontSize:10,color:'var(--tx3)',background:'var(--bg)',borderRadius:9,padding:'9px 11px',marginBottom:12,lineHeight:1.5}}>Compara la selfie con la foto del documento. La comparación facial automática llegará con el backend; por ahora la confirmas tú.</div>
        {ro
          ? <div style={{textAlign:'center',fontSize:11,color:'var(--tx3)'}}>👁 Solo lectura</div>
          : <div className="mact">
          <button className="btn btd sm" onClick={()=>{couAct(couView.id,'rejected');toast('Solicitud rechazada');setCouView(null);}}>Rechazar</button>
          <button className="btn btp sm" onClick={()=>{couAct(couView.id,'approved');toast('✅ Mensajero aprobado');setCouView(null);}}>Aprobar mensajero</button>
        </div>}
      </div>
    </div>}





    {confirm&&<div className="mo" onClick={()=>setConfirm(null)}>
      <div className="mb" onClick={e=>e.stopPropagation()} style={{maxWidth:340}}>
        <div className="mt">{confirm.title}</div>
        <div className="ms" style={{lineHeight:1.55}}>{confirm.msg}</div>
        <div className="mact">
          <button className="btn btg sm" onClick={()=>setConfirm(null)}>Cancelar</button>
          <button className={`btn ${confirm.danger?'btd':'btp'} sm`} onClick={run}>{confirm.yes||'Confirmar'}</button>
        </div>
      </div>
    </div>}
  </>;
}

/* ── Próximamente (pantalla honesta: una línea, sin fingir funcionalidad) ────── */
function ComingSoon({ icon, title, note }){
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'70px 24px' }}>
      <div style={{ fontSize:44, marginBottom:14, opacity:.7 }}>{icon}</div>
      <div style={{ fontSize:17, fontWeight:800, color:'var(--tx)' }}>🔜 {title} · Próximamente</div>
      <p style={{ fontSize:12.5, color:'var(--tx3)', marginTop:8, maxWidth:420, lineHeight:1.55 }}>{note}</p>
    </div>
  );
}

/* ── Órdenes REALES de la plataforma (solo lectura: el admin observa) ─────────── */
function AdminOrders({ toast, onViewProfile }){
  const PAGE = 20;
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState([]);
  const [names, setNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [sel, setSel] = useState(null);   // detalle de pedido
  useEffect(() => { setPage(0); }, [filter]);
  const load = useCallback(() => {
    let alive = true; setLoading(true);
    const from = page * PAGE;
    adminListOrders({ status: filter, from, to: from + PAGE - 1 })
      .then(async d => {
        if (!alive) return;
        setRows(d); setHasMore(d.length === PAGE); setLoading(false);
        const map = await getProfilesByIds([...d.map(o => o.buyer_id), ...d.map(o => o.seller_id), ...d.map(o => o.courier_id)]).catch(() => ({}));
        if (alive) setNames(map);
      })
      .catch(() => { if (alive) { setRows([]); setLoading(false); } });
    return () => { alive = false; };
  }, [filter, page]);
  useEffect(() => { const c = load(); return c; }, [load]);
  // En vivo: cualquier cambio en orders refresca la lista (debounce ligero).
  useEffect(() => {
    let t = null; const bump = () => { clearTimeout(t); t = setTimeout(load, 1200); };
    const ch = supabase.channel(`admin-orders-${Date.now()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, bump)
      .subscribe();
    return () => { clearTimeout(t); try { Promise.resolve(supabase.removeChannel(ch)).catch(()=>{}); } catch(e){} };
  }, [load]);

  const nm = id => names[id]?.full_name || null;
  const fmt = n => '$' + Math.round(Number(n) || 0).toLocaleString('es-ES');
  const when = ts => ts ? new Date(ts).toLocaleDateString('es-ES', { day:'2-digit', month:'short' }) + ' · ' + new Date(ts).toLocaleTimeString('es-ES', { hour:'2-digit', minute:'2-digit' }) : '—';
  const TERMINAL = ['entregado','completado','cancelado','fallido'];
  const stChip = s => {
    const done = TERMINAL.includes(s);
    const cls = s === 'cancelado' || s === 'fallido' ? 'br' : done ? 'bg' : 'by';
    return <span className={`bdg ${cls}`}>{s || '—'}</span>;
  };
  const person = (id, fallback) => id
    ? <span onClick={e => { e.stopPropagation(); onViewProfile && onViewProfile(id); }} style={{ color:'var(--ac)', fontWeight:700, cursor:'pointer' }}>{nm(id) || fallback}</span>
    : <span style={{ color:'var(--tx3)' }}>{fallback}</span>;

  const FILTERS = [["all","Todos"],["pendiente","Pendientes"],["confirmado","Confirmados"],["entregado","Entregados"],["completado","Completados"],["cancelado","Cancelados"]];

  return <>
    <div className="stit">Órdenes</div>
    <div className="ssub">Todos los pedidos reales de la plataforma · solo lectura (los mueven sus dueños)</div>
    <div className="tabs" style={{ maxWidth:560, overflowX:'auto' }}>
      {FILTERS.map(([k,l]) => <div key={k} className={`tab ${filter===k?'on':''}`} onClick={()=>setFilter(k)}>{l}</div>)}
    </div>
    <div className="card cp">
      {loading
        ? <div style={{ textAlign:'center', color:'var(--tx3)', fontSize:12, padding:'26px 6px' }}>Cargando pedidos…</div>
        : rows.length === 0
          ? <div style={{ textAlign:'center', color:'var(--tx3)', fontSize:12, padding:'26px 6px' }}>{filter==='all' ? 'Aún no hay pedidos en la plataforma.' : 'No hay pedidos con este estado.'}</div>
          : rows.map(o => (
            <div key={o.id} onClick={()=>setSel(o)} className="reprow" style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 8px', margin:'0 -8px', borderRadius:9, cursor:'pointer', borderBottom:'1px solid rgba(128,128,128,.1)' }}>
              <div style={{ width:42, height:42, borderRadius:8, overflow:'hidden', background:'#161616', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>
                {o.image ? <img src={o.image} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>{e.target.style.display='none';}}/> : '📦'}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12.5, fontWeight:700, color:'var(--tx)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{o.title || 'Pedido'}</div>
                <div style={{ fontSize:11, color:'var(--tx3)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                  {person(o.buyer_id, 'Comprador')} <span style={{ color:'var(--tx3)' }}>compra a</span> {person(o.seller_id, 'Vendedor')} · {when(o.created_at)}
                </div>
                <div style={{ marginTop:4, display:'flex', gap:6, alignItems:'center' }}>{stChip(o.status)}<span style={{ fontSize:12, fontWeight:800, fontFamily:'var(--mo)', color:'var(--tx)' }}>{fmt(o.amount)}</span></div>
              </div>
              <span style={{ fontSize:16, color:'var(--tx3)', flexShrink:0 }}>›</span>
            </div>
          ))}
      {!loading && (page > 0 || hasMore) && (
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10 }}>
          <button className="btn sm" disabled={page===0} onClick={()=>setPage(p=>Math.max(0,p-1))} style={{ opacity:page===0?.4:1 }}>‹ Anterior</button>
          <span style={{ fontSize:11, color:'var(--tx3)' }}>Página {page+1}</span>
          <button className="btn sm" disabled={!hasMore} onClick={()=>setPage(p=>p+1)} style={{ opacity:hasMore?1:.4 }}>Siguiente ›</button>
        </div>
      )}
    </div>

    {/* Detalle del pedido (solo lectura) */}
    {sel && <div className="mo" onClick={()=>setSel(null)}>
      <div className="mb" onClick={e=>e.stopPropagation()} style={{ maxWidth:400 }}>
        <div className="mt">📦 {sel.title || 'Pedido'}</div>
        <div className="ms">Detalle del pedido · solo lectura</div>
        {sel.image && <img src={sel.image} alt="" style={{ width:'100%', maxHeight:160, objectFit:'cover', borderRadius:10, marginBottom:10 }} onError={e=>{e.target.style.display='none';}}/>}
        {[['Estado', sel.status || '—'],
          ['Monto', fmt(sel.amount) + (sel.currency ? ` ${sel.currency}` : '')],
          ['Envío', sel.ship_mode || sel.shipMode || '—'],
          ['Costo de entrega', sel.delivery_cost != null ? fmt(sel.delivery_cost) : '—'],
          ['Creado', when(sel.created_at)]].map(([k,v]) => (
          <div key={k} style={{ display:'flex', justifyContent:'space-between', gap:12, padding:'7px 0', borderBottom:'1px solid var(--bd)' }}>
            <span style={{ fontSize:12, color:'var(--tx3)' }}>{k}</span><span style={{ fontSize:12, fontWeight:600, textAlign:'right' }}>{String(v)}</span>
          </div>
        ))}
        <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:10 }}>
          {[[sel.buyer_id,'Comprador'],[sel.seller_id,'Vendedor'],[sel.courier_id,'Mensajero']].filter(([id])=>id).map(([id,role]) => (
            <button key={role} className="btn sm" style={{ justifyContent:'space-between', width:'100%' }} onClick={()=>{ onViewProfile && onViewProfile(id); setSel(null); }}>
              <span style={{ color:'var(--tx3)' }}>{role}</span><span style={{ fontWeight:700 }}>{nm(id) || 'Ver perfil'} ›</span>
            </button>
          ))}
        </div>
        <button className="btn" style={{ width:'100%', marginTop:12 }} onClick={()=>setSel(null)}>Cerrar</button>
      </div>
    </div>}
  </>;
}

/* ── Moderación de publicaciones (a posteriori) — aprobar / retirar de verdad ── */
function ModeracionPublicaciones({ toast, onViewProfile, ro, onResolved }){
  const PAGE = 20;
  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");
  const [filter, setFilter] = useState("all"); // all | approved | rejected (retiradas)
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState([]);
  const [names, setNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [busy, setBusy] = useState(null);
  const [rejectFor, setRejectFor] = useState(null);
  const [reason, setReason] = useState("");
  const [view, setView] = useState(null);     // detalle del producto (capa)
  const [viewImg, setViewImg] = useState(0);  // índice de la foto grande

  useEffect(() => { const t = setTimeout(() => setDq(q), 350); return () => clearTimeout(t); }, [q]);
  useEffect(() => { setPage(0); }, [filter]);
  useEffect(() => {
    let alive = true; setLoading(true);
    const from = page * PAGE;
    adminListProducts({ query: dq, filter, from, to: from + PAGE - 1 })
      .then(async d => {
        if (!alive) return;
        setRows(d); setHasMore(d.length === PAGE); setLoading(false);
        const map = await getProfilesByIds(d.map(p => p.seller_id)).catch(() => ({}));
        if (alive) setNames(map);
      })
      .catch(() => { if (alive) { setRows([]); setLoading(false); } });
    return () => { alive = false; };
  }, [dq, filter, page]);

  const patch = (id, p) => setRows(rs => rs.map(r => r.id === id ? { ...r, ...p } : r));
  const emsg = (e) => e?.message || e?.details || e?.hint || "No se pudo (sin mensaje del backend)";
  const doApprove = async (p) => {
    setBusy(p.id);
    try { await adminModerateProduct(p.id, true); patch(p.id, { moderation_status: "approved" }); toast(`✅ «${p.title}» aprobada`); onResolved && onResolved(); }
    catch (e) { toast("⚠️ " + emsg(e)); }
    setBusy(null);
  };
  const doReject = async () => {
    const p = rejectFor; const why = reason.trim(); setRejectFor(null);
    setBusy(p.id);
    try { await adminModerateProduct(p.id, false, why || null); patch(p.id, { moderation_status: "rejected", moderation_reason: why }); toast(`🚫 «${p.title}» retirada`); onResolved && onResolved(); }
    catch (e) { toast("⚠️ " + emsg(e)); }
    setBusy(null);
  };

  const statusChip = (s) => s === "rejected"
    ? <span className="bdg br">🚫 Retirada</span>
    : s === "pending"
      ? <span className="bdg by">⏳ Pendiente</span>
      : <span className="bdg bg">✅ Aprobada</span>;

  return (
    <>
      <div className="stit">Moderación de publicaciones</div>
      <div className="ssub">Publicación libre; tú retiras a posteriori lo que no va. El vendedor recibe aviso.</div>

      <div className="tabs" style={{ maxWidth: 320 }}>
        {[["all","Todas"],["approved","Aprobadas"],["rejected","Retiradas"]].map(([k,l]) =>
          <div key={k} className={`tab ${filter===k?'on':''}`} onClick={()=>setFilter(k)}>{l}</div>)}
      </div>

      <div className="card cp">
        <input value={q} onChange={e => { setQ(e.target.value); setPage(0); }} placeholder="Buscar por título…"
          style={{ width:'100%', boxSizing:'border-box', background:'var(--bg3,#12151f)', border:'1px solid var(--bd2,#222)', borderRadius:10, padding:'10px 12px', color:'var(--tx)', fontSize:13, outline:'none', marginBottom:10 }} />
        {loading
          ? <div style={{ textAlign:'center', color:'var(--tx3)', fontSize:12, padding:'24px 6px' }}>Cargando publicaciones…</div>
          : rows.length === 0
            ? <div style={{ textAlign:'center', color:'var(--tx3)', fontSize:12, padding:'24px 6px' }}>Nada por aquí.</div>
            : rows.map(p => {
              const img = Array.isArray(p.images) ? p.images[0] : (p.images || null);
              const seller = names[p.seller_id];
              return (
                <div key={p.id} onClick={()=>{ setView(p); setViewImg(0); }} className="reprow" style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 8px', margin:'0 -8px', borderRadius:9, cursor:'pointer', borderBottom:'1px solid rgba(128,128,128,.1)' }}>
                  <div style={{ width:46, height:46, borderRadius:8, overflow:'hidden', background:'#161616', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>
                    {img ? <img src={img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>{e.target.style.display='none';}} /> : (p.kind === 'service' ? '🛠️' : '📦')}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12.5, fontWeight:700, color:'var(--tx)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.title}</div>
                    <div style={{ fontSize:11, color:'var(--tx3)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      <span onClick={e=>{ e.stopPropagation(); onViewProfile && onViewProfile(p.seller_id); }} style={{ color:'var(--ac)', fontWeight:700, cursor:'pointer' }}>{seller?.full_name || 'Vendedor'}</span>
                      {' '}· {p.kind === 'service' ? '🛠️ Servicio' : '📦 Producto'} · {p.created_at ? new Date(p.created_at).toLocaleDateString('es-ES',{day:'2-digit',month:'short'}) : ''}
                    </div>
                    <div style={{ marginTop:4, display:'flex', gap:5, alignItems:'center' }}>
                      {statusChip(p.moderation_status)}
                      {p.moderation_status === 'rejected' && p.moderation_reason && <span style={{ fontSize:10, color:'var(--tx3)' }}>· {p.moderation_reason}</span>}
                    </div>
                  </div>
                  {!ro && <div style={{ display:'flex', gap:4, flexShrink:0 }} onClick={e=>e.stopPropagation()}>
                    {p.moderation_status !== 'approved' && <button className="btn bts sm" disabled={busy===p.id} onClick={()=>doApprove(p)}>✅ Aprobar</button>}
                    {p.moderation_status !== 'rejected' && <button className="btn btd sm" disabled={busy===p.id} onClick={()=>{ setReason(''); setRejectFor(p); }}>🚫 Retirar</button>}
                  </div>}
                </div>
              );
            })}
        {!loading && (page > 0 || hasMore) && (
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10 }}>
            <button className="btn sm" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))} style={{ opacity: page === 0 ? .4 : 1 }}>‹ Anterior</button>
            <span style={{ fontSize:11, color:'var(--tx3)' }}>Página {page + 1}</span>
            <button className="btn sm" disabled={!hasMore} onClick={() => setPage(p => p + 1)} style={{ opacity: hasMore ? 1 : .4 }}>Siguiente ›</button>
          </div>
        )}
      </div>

      {/* DETALLE del producto (capa): fotos, descripción y precio, como lo ve un comprador */}
      {view && (() => {
        const imgs = (Array.isArray(view.images) ? view.images : (view.images ? [view.images] : [])).filter(Boolean);
        const seller = names[view.seller_id];
        const price = Number(view.price) || 0;
        return <div className="mo" onClick={()=>setView(null)}>
          <div className="mb" onClick={e=>e.stopPropagation()} style={{ maxWidth:420, maxHeight:'88vh', overflowY:'auto' }}>
            <div style={{ position:'relative', borderRadius:12, overflow:'hidden', background:'#111', marginBottom:8 }}>
              {imgs.length
                ? <img src={imgs[Math.min(viewImg, imgs.length-1)]} alt="" style={{ width:'100%', maxHeight:260, objectFit:'cover', display:'block' }} onError={e=>{e.target.style.display='none';}}/>
                : <div style={{ height:140, display:'flex', alignItems:'center', justifyContent:'center', fontSize:40 }}>{view.kind==='service'?'🛠️':'📦'}</div>}
              {imgs.length > 1 && (
                <div style={{ position:'absolute', bottom:8, left:0, right:0, display:'flex', justifyContent:'center', gap:6 }}>
                  {imgs.map((_,i) => <span key={i} onClick={()=>setViewImg(i)} style={{ width:8, height:8, borderRadius:'50%', cursor:'pointer', background: i===Math.min(viewImg, imgs.length-1) ? G : 'rgba(255,255,255,.4)' }}/>)}
                </div>
              )}
            </div>
            {imgs.length > 1 && (
              <div style={{ display:'flex', gap:6, marginBottom:10, overflowX:'auto' }}>
                {imgs.map((u,i) => <img key={i} src={u} alt="" onClick={()=>setViewImg(i)} style={{ width:44, height:44, objectFit:'cover', borderRadius:8, cursor:'pointer', border: i===viewImg ? `2px solid ${G}` : '2px solid transparent' }} onError={e=>{e.target.style.display='none';}}/>)}
              </div>
            )}
            <div style={{ fontSize:15, fontWeight:800, color:'var(--tx)', lineHeight:1.3 }}>{view.title}</div>
            <div style={{ fontSize:18, fontWeight:900, color:G, margin:'6px 0' }}>{price > 0 ? money(price, view.currency) : 'Precio a consultar'}</div>
            <div style={{ fontSize:11, color:'var(--tx3)', marginBottom:8 }}>
              <span onClick={()=>{ onViewProfile && onViewProfile(view.seller_id); setView(null); }} style={{ color:'var(--ac)', fontWeight:700, cursor:'pointer' }}>{seller?.full_name || 'Ver vendedor'}</span>
              {' '}· {view.kind==='service' ? '🛠️ Servicio' : '📦 Producto'}{view.location ? ` · 📍 ${view.location}` : ''}
            </div>
            <div style={{ marginBottom:8 }}>{statusChip(view.moderation_status)}{view.moderation_status==='rejected' && view.moderation_reason && <span style={{ fontSize:11, color:'var(--tx3)', marginLeft:6 }}>{view.moderation_reason}</span>}</div>
            {view.description
              ? <p style={{ fontSize:12.5, color:'var(--tx2,#aaa)', lineHeight:1.55, whiteSpace:'pre-wrap', margin:'0 0 12px' }}>{view.description}</p>
              : <p style={{ fontSize:11, color:'var(--tx3)', margin:'0 0 12px' }}>Sin descripción.</p>}
            <div style={{ display:'flex', gap:8 }}>
              {!ro && view.moderation_status !== 'approved' && <button className="btn bts" style={{ flex:1 }} disabled={busy===view.id} onClick={async()=>{ await doApprove(view); setView(v=>v?{...v,moderation_status:'approved'}:v); }}>✅ Aprobar</button>}
              {!ro && view.moderation_status !== 'rejected' && <button className="btn btd" style={{ flex:1 }} disabled={busy===view.id} onClick={()=>{ setReason(''); setRejectFor(view); setView(null); }}>🚫 Retirar</button>}
              <button className="btn" onClick={()=>setView(null)}>Cerrar</button>
            </div>
          </div>
        </div>;
      })()}

      {rejectFor && <div className="mo" onClick={() => setRejectFor(null)}>
        <div className="mb" onClick={e => e.stopPropagation()} style={{ maxWidth:360 }}>
          <div className="mt">Retirar «{rejectFor.title}»</div>
          <div className="ms">Desaparece del feed y la búsqueda. El vendedor recibe el aviso y la ve marcada; al editarla vuelve a publicarse.</div>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Motivo (opcional, se le muestra al vendedor)…"
            style={{ width:'100%', boxSizing:'border-box', background:'var(--bg3,#12151f)', border:'1px solid var(--bd2,#222)', borderRadius:10, padding:'10px 12px', color:'var(--tx)', fontSize:13, outline:'none', resize:'none', margin:'6px 0 12px' }} />
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn" style={{ flex:1 }} onClick={() => setRejectFor(null)}>Cancelar</button>
            <button className="btn btd" style={{ flex:1 }} onClick={doReject}>Retirar</button>
          </div>
        </div>
      </div>}
    </>
  );
}

/* ── Directorio REAL de usuarios (profiles) — verificar/suspender de verdad ──── */
function RealUsersDirectory({ toast, meId, ro }){
  const PAGE = 20;
  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");           // query con debounce
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [busy, setBusy] = useState(null);      // id en proceso
  const [sel, setSel] = useState(null);        // ficha rápida
  const [selCount, setSelCount] = useState(null);
  const [suspendFor, setSuspendFor] = useState(null); // { u } → modal de motivo
  const [reason, setReason] = useState("");

  useEffect(() => { const t = setTimeout(() => setDq(q), 350); return () => clearTimeout(t); }, [q]);
  useEffect(() => {
    let alive = true; setLoading(true);
    const from = page * PAGE;
    adminListUsers({ query: dq, from, to: from + PAGE - 1 })
      .then(d => { if (!alive) return; setRows(d); setHasMore(d.length === PAGE); setLoading(false); })
      .catch(() => { if (alive) { setRows([]); setLoading(false); } });
    return () => { alive = false; };
  }, [dq, page]);

  const nmeOf = u => u.full_name || u.email || "Usuario";
  const patch = (id, p) => { setRows(rs => rs.map(r => r.id === id ? { ...r, ...p } : r)); setSel(s => s && s.id === id ? { ...s, ...p } : s); };
  // Miembros del equipo (staff_permissions) para el chip 🛡️ Equipo. Best-effort:
  // si no hay permiso para leer la tabla, el set queda vacío (solo se ve 👑 por rol).
  const [staffIds, setStaffIds] = useState(() => new Set());
  useEffect(() => { adminListStaff().then(list => setStaffIds(new Set((list || []).map(m => m.user_id)))).catch(() => {}); }, []);

  const doVerify = async (u, verified) => {
    setBusy(u.id);
    try { await adminSetVerified(u.id, verified); patch(u.id, { is_verified: verified }); toast(verified ? `✓ ${nmeOf(u)} verificado` : `Verificación retirada a ${nmeOf(u)}`); }
    catch (e) { toast("⚠️ " + (e?.message || "No se pudo")); }
    setBusy(null);
  };
  const doSuspend = async (u, suspended, why) => {
    setBusy(u.id);
    try { await adminSetSuspended(u.id, suspended, why || null); patch(u.id, { is_suspended: suspended }); toast(suspended ? `⛔ ${nmeOf(u)} suspendido` : `✅ ${nmeOf(u)} reactivado`); }
    catch (e) { toast("⚠️ " + (e?.message || "No se pudo")); }
    setBusy(null);
  };
  const openSuspend = (u) => { setReason(""); setSuspendFor(u); };
  const confirmSuspend = async () => { const u = suspendFor; setSuspendFor(null); await doSuspend(u, true, reason.trim()); };

  const openSheet = async (u) => { setSel(u); setSelCount(null); const c = await getSellerProductCount(u.id).catch(() => 0); setSelCount(c); };

  const chips = (u) => (
    <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
      {u.role === 'admin'   && <span className="bdg by">👑 Administrador</span>}
      {u.role !== 'admin' && staffIds.has(u.id) && <span className="bdg bp">🛡️ Equipo</span>}
      {u.role === 'courier' && <span className="bdg bb">Mensajero</span>}
      {u.plan && u.plan !== 'gratis' && <span className="bdg bx">{u.plan}</span>}
      {u.is_verified && <span className="bdg" style={{ background:'rgba(255,192,30,.14)', color:G }}>✓ Verificado</span>}
      {u.is_suspended && <span className="bdg br">⛔ Suspendido</span>}
    </div>
  );

  return (
    <div className="card cp">
      <div className="ch"><span className="ct">Directorio de usuarios</span><span className="bdg bx">{rows.length}{hasMore ? '+' : ''}</span></div>
      <div style={{ fontSize:11, color:'var(--tx3)', margin:'2px 0 10px' }}>Perfiles reales de la plataforma. Busca, verifica o suspende. Toca una fila para su ficha.</div>
      <input value={q} onChange={e => { setQ(e.target.value); setPage(0); }} placeholder="Buscar por nombre o email…"
        style={{ width:'100%', boxSizing:'border-box', background:'var(--bg3,#12151f)', border:'1px solid var(--bd2,#222)', borderRadius:10, padding:'10px 12px', color:'var(--tx)', fontSize:13, outline:'none', marginBottom:10 }} />
      {loading
        ? <div style={{ textAlign:'center', color:'var(--tx3)', fontSize:12, padding:'24px 6px' }}>Cargando usuarios…</div>
        : rows.length === 0
          ? <div style={{ textAlign:'center', color:'var(--tx3)', fontSize:12, padding:'24px 6px' }}>{dq ? 'Nadie coincide con la búsqueda.' : 'Aún no hay usuarios.'}</div>
          : rows.map(u => (
            <div key={u.id} onClick={() => openSheet(u)} className="reprow"
              style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 8px', margin:'0 -8px', borderRadius:9, cursor:'pointer', borderBottom:'1px solid rgba(128,128,128,.1)', background: u.is_suspended ? 'rgba(224,82,82,.05)' : undefined }}>
              <Avatar url={avatarUrlOf(u.avatar_url)} name={nmeOf(u)} size={38} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12.5, fontWeight:700, color:'var(--tx)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{nmeOf(u)}{u.id === meId && <span style={{ color:'var(--tx3)', fontWeight:500 }}> · tú</span>}</div>
                <div style={{ fontSize:11, color:'var(--tx3)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{u.email || '—'}</div>
                <div style={{ marginTop:4 }}>{chips(u)}</div>
              </div>
              {!ro && <div style={{ display:'flex', gap:4, flexShrink:0 }} onClick={e => e.stopPropagation()}>
                <button className="btn bts sm" disabled={busy === u.id} onClick={() => doVerify(u, !u.is_verified)}>{u.is_verified ? 'Quitar ✓' : '✓ Verificar'}</button>
                {u.is_suspended
                  ? <button className="btn btg sm" disabled={busy === u.id} onClick={() => doSuspend(u, false)}>Reactivar</button>
                  : <button className="btn btd sm" disabled={busy === u.id || u.id === meId} onClick={() => openSuspend(u)}>Suspender</button>}
              </div>}
            </div>
          ))}
      {!loading && (page > 0 || hasMore) && (
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10 }}>
          <button className="btn sm" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))} style={{ opacity: page === 0 ? .4 : 1 }}>‹ Anterior</button>
          <span style={{ fontSize:11, color:'var(--tx3)' }}>Página {page + 1}</span>
          <button className="btn sm" disabled={!hasMore} onClick={() => setPage(p => p + 1)} style={{ opacity: hasMore ? 1 : .4 }}>Siguiente ›</button>
        </div>
      )}

      {/* Modal de motivo al suspender */}
      {suspendFor && <div className="mo" onClick={() => setSuspendFor(null)}>
        <div className="mb" onClick={e => e.stopPropagation()} style={{ maxWidth:360 }}>
          <div className="mt">Suspender a {nmeOf(suspendFor)}</div>
          <div className="ms">No podrá publicar, comprar ni chatear hasta reactivarlo. Recibirá una notificación.</div>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Motivo (opcional)…"
            style={{ width:'100%', boxSizing:'border-box', background:'var(--bg3,#12151f)', border:'1px solid var(--bd2,#222)', borderRadius:10, padding:'10px 12px', color:'var(--tx)', fontSize:13, outline:'none', resize:'none', margin:'6px 0 12px' }} />
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn" style={{ flex:1 }} onClick={() => setSuspendFor(null)}>Cancelar</button>
            <button className="btn btd" style={{ flex:1 }} onClick={confirmSuspend}>Suspender</button>
          </div>
        </div>
      </div>}

      {/* Ficha rápida del usuario */}
      {sel && <div className="mo" onClick={() => setSel(null)}>
        <div className="mb" onClick={e => e.stopPropagation()} style={{ maxWidth:380 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
            <Avatar url={avatarUrlOf(sel.avatar_url)} name={nmeOf(sel)} size={52} />
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:15, fontWeight:800, color:'var(--tx)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{nmeOf(sel)}</div>
              <div style={{ fontSize:12, color:'var(--tx3)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{sel.email || '—'}</div>
            </div>
          </div>
          <div style={{ marginBottom:12 }}>{chips(sel)}</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
            {[['Registrado', sel.created_at ? new Date(sel.created_at).toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' }) : '—'],
              ['Plan', sel.plan || 'gratis'],
              ['Rol', sel.role || 'user'],
              ['Productos', selCount == null ? '…' : String(selCount)]].map(([k,v]) => (
              <div key={k} style={{ background:'var(--bg3,#12151f)', border:'1px solid var(--bd2,#222)', borderRadius:10, padding:'8px 10px' }}>
                <div style={{ fontSize:10, color:'var(--tx3)' }}>{k}</div>
                <div style={{ fontSize:12.5, fontWeight:700, color:'var(--tx)' }}>{v}</div>
              </div>
            ))}
          </div>
          {ro
            ? <div style={{ textAlign:'center', fontSize:11, color:'var(--tx3)' }}>👁 Solo lectura</div>
            : <div style={{ display:'flex', gap:8 }}>
            <button className="btn bts" style={{ flex:1 }} disabled={busy === sel.id} onClick={() => doVerify(sel, !sel.is_verified)}>{sel.is_verified ? 'Quitar verificación' : '✓ Verificar'}</button>
            {sel.is_suspended
              ? <button className="btn btg" style={{ flex:1 }} disabled={busy === sel.id} onClick={() => doSuspend(sel, false)}>Reactivar</button>
              : <button className="btn btd" style={{ flex:1 }} disabled={busy === sel.id || sel.id === meId} onClick={() => { const u = sel; setSel(null); openSuspend(u); }}>Suspender</button>}
          </div>}
        </div>
      </div>}
    </div>
  );
}

/* ── Foto KYC con enlace firmado + reintento (nunca un recuadro negro mudo) ──── */
function KycPhoto({ path, label, onZoom }){
  const [state, setState] = useState('loading'); // loading | ok | error
  const [url, setUrl] = useState(null);
  const fetchUrl = useCallback(() => {
    if (!path) { setState('error'); return; }
    setState('loading');
    kycSignedUrl(path).then(u => { if (u) { setUrl(u); setState('ok'); } else { setState('error'); } }).catch(() => setState('error'));
  }, [path]);
  useEffect(() => { fetchUrl(); }, [fetchUrl]);
  return (
    <div style={{borderRadius:10,overflow:'hidden',border:'1px solid var(--bd2,#222)',background:'#111',height:110,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:5,cursor:state==='ok'?'pointer':'default',padding:6,textAlign:'center'}}
      onClick={()=>{ if(state==='ok'&&url) onZoom(url); }}>
      {state==='loading' && <span style={{fontSize:11,color:'var(--tx3)'}}>{label}…</span>}
      {state==='error' && <>
        <span style={{fontSize:10.5,color:'var(--tx3)',lineHeight:1.35}}>No se pudo cargar la imagen</span>
        <button className="btn btg sm" onClick={(e)=>{ e.stopPropagation(); fetchUrl(); }}>↻ Reintentar</button>
      </>}
      {state==='ok' && <img src={url} alt={label} onError={()=>setState('error')} style={{width:'100%',height:'100%',objectFit:'cover'}}/>}
    </div>
  );
}

/* ── Cola REAL de verificaciones (KYC) ──────────────────────────────────────── */
function VerificationQueue({ toast, onViewProfile, ro, onResolved }){
  const [filter, setFilter] = useState("pending"); // pending|approved|rejected
  const [rows, setRows] = useState([]);
  const [names, setNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [sel, setSel] = useState(null);            // ficha con fotos
  const [zoom, setZoom] = useState(null);          // foto ampliada
  const [rejectFor, setRejectFor] = useState(null);
  const [reason, setReason] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    adminListVerifications({ status: filter, from: 0, to: 49 })
      .then(async d => {
        setRows(d); setLoading(false);
        const map = await getProfilesByIds(d.map(v => v.user_id)).catch(() => ({}));
        setNames(map);
      })
      .catch(() => { setRows([]); setLoading(false); });
  }, [filter]);
  useEffect(() => { load(); }, [load]);
  // Realtime: la cola se actualiza sola cuando llega/cambia una verificación.
  useEffect(() => {
    const ch = supabase.channel(`admin-verifs-${Date.now()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "verifications" }, () => load())
      .subscribe();
    return () => { try { Promise.resolve(supabase.removeChannel(ch)).catch(()=>{}); } catch(e){} };
  }, [load]);

  const openSheet = (v) => { setSel(v); };  // cada foto (KycPhoto) carga su propio signed url con reintento
  const patch = (id, p) => { setRows(rs => rs.map(r => r.id === id ? { ...r, ...p } : r)); setSel(s => s && s.id === id ? { ...s, ...p } : s); };
  // Muestra el mensaje EXACTO del backend (message/details/hint), nunca un genérico a secas.
  const errMsg = (e) => e?.message || e?.details || e?.hint || e?.error_description || "No se pudo (sin mensaje del backend)";
  const approve = async (v) => {
    setBusy(v.id);
    try { await adminReviewVerification(v.id, true); patch(v.id, { status: "approved" }); toast(`✓ ${v.full_name || 'Usuario'} verificado`); if (filter === "pending") setRows(rs => rs.filter(r => r.id !== v.id)); setSel(null); onResolved && onResolved(); }
    catch (e) { toast("⚠️ " + errMsg(e)); }
    setBusy(null);
  };
  const doReject = async () => {
    const v = rejectFor; const why = reason.trim(); setRejectFor(null);
    setBusy(v.id);
    try { await adminReviewVerification(v.id, false, why || null); patch(v.id, { status: "rejected", reject_reason: why }); toast(`🚫 Verificación de ${v.full_name || 'usuario'} rechazada`); if (filter === "pending") setRows(rs => rs.filter(r => r.id !== v.id)); setSel(null); onResolved && onResolved(); }
    catch (e) { toast("⚠️ " + errMsg(e)); }
    setBusy(null);
  };
  const chip = (s) => s === "approved" ? <span className="bdg bg">✓ Aprobada</span> : s === "rejected" ? <span className="bdg br">🚫 Rechazada</span> : <span className="bdg by">🕐 Pendiente</span>;
  const pending = rows.filter(r => r.status === "pending").length;

  return (
    <div className="card cp mb16">
      <div className="ch"><span className="ct">Verificación de identidad</span><span className={`bdg ${filter==='pending'&&pending?'by':'bx'}`}>{filter==='pending'? `${pending} pendientes` : `${rows.length}`}</span></div>
      <div style={{fontSize:11,color:'var(--tx3)',margin:'2px 0 10px'}}>Revisa el documento y la selfie. Al aprobar, el usuario queda verificado (insignia real) y recibe aviso.</div>
      <div className="tabs" style={{maxWidth:320,marginBottom:10}}>
        {[["pending","Pendientes"],["approved","Aprobadas"],["rejected","Rechazadas"]].map(([k,l])=><div key={k} className={`tab ${filter===k?'on':''}`} onClick={()=>setFilter(k)}>{l}</div>)}
      </div>
      {loading ? <div style={{textAlign:'center',color:'var(--tx3)',fontSize:12,padding:'18px 6px'}}>Cargando…</div>
        : rows.length===0 ? <div style={{textAlign:'center',color:'var(--tx3)',fontSize:12,padding:'18px 6px'}}>Sin solicitudes.</div>
        : rows.map(v => { const pr = names[v.user_id]; return (
          <div key={v.id} onClick={()=>openSheet(v)} className="reprow" style={{display:'flex',alignItems:'center',gap:10,padding:'10px 8px',margin:'0 -8px',borderRadius:9,cursor:'pointer',borderBottom:'1px solid rgba(128,128,128,.1)'}}>
            <Avatar url={avatarUrlOf(pr?.avatar_url)} name={v.full_name||pr?.full_name||'Usuario'} size={38} />
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12.5,fontWeight:700,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{v.full_name||pr?.full_name||'Usuario'}</div>
              <div style={{fontSize:11,color:'var(--tx3)'}}>{v.doc_type||'—'} · {v.doc_number||'—'} · {v.created_at?new Date(v.created_at).toLocaleDateString('es-ES',{day:'2-digit',month:'short'}):''}</div>
              <div style={{marginTop:4}}>{chip(v.status)}</div>
            </div>
            <span style={{fontSize:16,color:'var(--tx3)',flexShrink:0}}>›</span>
          </div>
        ); })}

      {/* Ficha de la verificación con las 3 fotos (signed urls) */}
      {sel && <div className="mo" onClick={()=>setSel(null)}>
        <div className="mb" onClick={e=>e.stopPropagation()} style={{maxWidth:400}}>
          <div className="mt">🪪 Verificación de {sel.full_name||'usuario'}</div>
          <div className="ms">Documento y selfie. Toca una foto para ampliarla.</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
            {[["Frente",sel.doc_front],["Reverso",sel.doc_back],["Selfie",sel.selfie]].map(([lbl,p])=>(
              <KycPhoto key={lbl} label={lbl} path={p} onZoom={setZoom} />
            ))}
          </div>
          {[['Nombre',sel.full_name||'—'],['Documento',sel.doc_type||'—'],['Número',sel.doc_number||'—'],['Estado',sel.status||'—']].map(([k,v])=>(
            <div key={k} style={{display:'flex',justifyContent:'space-between',gap:12,padding:'6px 0',borderBottom:'1px solid var(--bd)'}}>
              <span style={{fontSize:12,color:'var(--tx3)'}}>{k}</span><span style={{fontSize:12,fontWeight:600,textAlign:'right'}}>{v}</span>
            </div>
          ))}
          {sel.status==='rejected'&&sel.reject_reason&&<div style={{fontSize:11,color:'var(--rd,#e05252)',marginTop:8}}>Motivo: {sel.reject_reason}</div>}
          <div style={{display:'flex',gap:8,marginTop:14}}>
            {onViewProfile && <button className="btn sm" onClick={()=>{ onViewProfile(sel.user_id); setSel(null); }}>Ver perfil</button>}
            {!ro && sel.status!=='approved' && <button className="btn bts" style={{flex:1}} disabled={busy===sel.id} onClick={()=>approve(sel)}>✅ Aprobar</button>}
            {!ro && sel.status!=='rejected' && <button className="btn btd" style={{flex:1}} disabled={busy===sel.id} onClick={()=>{ setReason(''); setRejectFor(sel); }}>🚫 Rechazar</button>}
          </div>
        </div>
      </div>}

      {zoom && <div className="mo" onClick={()=>setZoom(null)} style={{zIndex:6000}}>
        <img src={zoom} alt="" onClick={e=>e.stopPropagation()} style={{maxWidth:'92vw',maxHeight:'88vh',borderRadius:12,objectFit:'contain'}}/>
      </div>}

      {rejectFor && <div className="mo" onClick={()=>setRejectFor(null)}>
        <div className="mb" onClick={e=>e.stopPropagation()} style={{maxWidth:360}}>
          <div className="mt">Rechazar verificación</div>
          <div className="ms">El usuario verá el motivo y podrá reenviar.</div>
          <textarea value={reason} onChange={e=>setReason(e.target.value)} rows={3} placeholder="Motivo (opcional)…" style={{width:'100%',boxSizing:'border-box',background:'var(--bg3,#12151f)',border:'1px solid var(--bd2,#222)',borderRadius:10,padding:'10px 12px',color:'var(--tx)',fontSize:13,outline:'none',resize:'none',margin:'6px 0 12px'}}/>
          <div style={{display:'flex',gap:8}}>
            <button className="btn" style={{flex:1}} onClick={()=>setRejectFor(null)}>Cancelar</button>
            <button className="btn btd" style={{flex:1}} onClick={doReject}>Rechazar</button>
          </div>
        </div>
      </div>}
    </div>
  );
}

/* ── Cola REAL de solicitudes de plan ───────────────────────────────────────── */
function PlanQueue({ toast, onViewProfile, ro, onResolved }){
  const [filter, setFilter] = useState("pending");
  const [rows, setRows] = useState([]);
  const [names, setNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [confirmFor, setConfirmFor] = useState(null); // { req, approve }

  const load = useCallback(() => {
    setLoading(true);
    adminListPlanRequests({ status: filter, from: 0, to: 49 })
      .then(async d => { setRows(d); setLoading(false); const map = await getProfilesByIds(d.map(r => r.user_id)).catch(()=>({})); setNames(map); })
      .catch(() => { setRows([]); setLoading(false); });
  }, [filter]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const ch = supabase.channel(`admin-plans-${Date.now()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "plan_requests" }, () => load())
      .subscribe();
    return () => { try { Promise.resolve(supabase.removeChannel(ch)).catch(()=>{}); } catch(e){} };
  }, [load]);

  const decide = async () => {
    const { req, approve } = confirmFor; setConfirmFor(null);
    setBusy(req.id);
    try {
      await adminReviewPlan(req.id, approve);
      setRows(rs => filter === "pending" ? rs.filter(r => r.id !== req.id) : rs.map(r => r.id === req.id ? { ...r, status: approve ? "approved" : "rejected" } : r));
      toast(approve ? `✅ Plan ${req.plan} aprobado` : "Solicitud de plan rechazada");
      onResolved && onResolved();
    } catch (e) { toast("⚠️ " + (e?.message || e?.details || e?.hint || "No se pudo (sin mensaje del backend)")); }
    setBusy(null);
  };
  const chip = (s) => s === "approved" ? <span className="bdg bg">✅ Aprobada</span> : s === "rejected" ? <span className="bdg br">🚫 Rechazada</span> : <span className="bdg by">🕐 Pendiente</span>;
  const pending = rows.filter(r => r.status === "pending").length;

  return (
    <div className="card cp mb16">
      <div className="ch"><span className="ct">Solicitudes de plan</span><span className={`bdg ${filter==='pending'&&pending?'by':'bx'}`}>{filter==='pending'?`${pending} pendientes`:`${rows.length}`}</span></div>
      <div style={{fontSize:11,color:'var(--tx3)',margin:'2px 0 10px'}}>Cuando un usuario pide Pro o Premium, aparece aquí. Confirmas el pago (manual) y apruebas: el plan cambia de verdad.</div>
      <div className="tabs" style={{maxWidth:320,marginBottom:10}}>
        {[["pending","Pendientes"],["approved","Aprobadas"],["rejected","Rechazadas"]].map(([k,l])=><div key={k} className={`tab ${filter===k?'on':''}`} onClick={()=>setFilter(k)}>{l}</div>)}
      </div>
      {loading ? <div style={{textAlign:'center',color:'var(--tx3)',fontSize:12,padding:'18px 6px'}}>Cargando…</div>
        : rows.length===0 ? <div style={{textAlign:'center',color:'var(--tx3)',fontSize:12,padding:'18px 6px'}}>Sin solicitudes.</div>
        : rows.map(r => { const pr = names[r.user_id]; return (
          <div key={r.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:'1px solid rgba(128,128,128,.1)'}}>
            <Avatar url={avatarUrlOf(pr?.avatar_url)} name={pr?.full_name||'Usuario'} size={36} />
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12.5,fontWeight:700,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{pr?.full_name||'Usuario'}</div>
              <div style={{fontSize:11,color:'var(--tx3)'}}>quiere <b style={{color:'var(--ac)',textTransform:'capitalize'}}>{r.plan}</b> · {r.created_at?new Date(r.created_at).toLocaleDateString('es-ES',{day:'2-digit',month:'short'}):''}</div>
              <div style={{marginTop:4}}>{chip(r.status)}</div>
            </div>
            <div style={{display:'flex',gap:4,flexShrink:0}}>
              {onViewProfile && <button className="btn sm" onClick={()=>onViewProfile(r.user_id)}>Perfil</button>}
              {!ro && r.status!=='approved' && <button className="btn bts sm" disabled={busy===r.id} onClick={()=>setConfirmFor({req:r,approve:true})}>✅ Aprobar</button>}
              {!ro && r.status!=='rejected' && <button className="btn btd sm" disabled={busy===r.id} onClick={()=>setConfirmFor({req:r,approve:false})}>🚫 Rechazar</button>}
            </div>
          </div>
        ); })}

      {confirmFor && <div className="mo" onClick={()=>setConfirmFor(null)}>
        <div className="mb" onClick={e=>e.stopPropagation()} style={{maxWidth:340}}>
          <div className="mt">{confirmFor.approve ? `Aprobar plan ${confirmFor.req.plan}` : 'Rechazar solicitud'}</div>
          <div className="ms">{confirmFor.approve ? `Confirma que el usuario ya pagó. Se activará su plan ${confirmFor.req.plan} de verdad.` : 'Se rechaza la solicitud de plan.'}</div>
          <div style={{display:'flex',gap:8,marginTop:12}}>
            <button className="btn" style={{flex:1}} onClick={()=>setConfirmFor(null)}>Cancelar</button>
            <button className={`btn ${confirmFor.approve?'bts':'btd'}`} style={{flex:1}} onClick={decide}>{confirmFor.approve?'Aprobar':'Rechazar'}</button>
          </div>
        </div>
      </div>}
    </div>
  );
}

/* ── Usuarios ──────────────────────────────────────────────────────────────── */
function Usuarios({toast,data={}}){
  // Una sola pantalla, todo REAL: colas de verificación/planes + directorio de perfiles.
  // (La sub-pestaña "Negocios" se eliminó: era una tabla derivada de datos parciales
  // con botones sin conectar. El control real de cada vendedor vive en el directorio.)
  return <>
    <div className="stit">Usuarios</div>
    <div className="ssub">Cuentas reales, verificaciones y planes · conectado a la plataforma</div>

    {/* Cola REAL de verificaciones (KYC) y de planes */}
    <VerificationQueue toast={toast} onViewProfile={data.onViewProfile} />
    <PlanQueue toast={toast} onViewProfile={data.onViewProfile} />

    {/* Directorio REAL de usuarios (profiles) con buscador, verificar/suspender y ficha */}
    <RealUsersDirectory toast={toast} meId={data.meId} />
  </>;
}

/* ── Economía ──────────────────────────────────────────────────────────────── */
function Economia({toast, data={}, ro}){
  const cfg = data.cfg || {};
  const fmt = n => (n==null || n==='' || Number.isNaN(Number(n))) ? '—' : '$'+Math.round(Number(n)).toLocaleString('es-ES');
  // ── FUENTE ÚNICA: TODOS los importes vienen SOLO del backend (admin_dashboard_stats).
  // No se calcula NADA desde arrays locales (data.orders venía de localStorage del
  // propio usuario → por eso a cada persona le salían cifras distintas). Si la RPC
  // falla o no hay permiso → se muestra "—" o "Sin acceso", NUNCA un estimado. ──────
  const [stats, setStats] = useState(undefined); // undefined=cargando · null=sin acceso
  const loadStats = useCallback(() => { adminDashboardStats().then(s => setStats(s)).catch(() => setStats(null)); }, []);
  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => {
    let tmr=null; const bump=()=>{ clearTimeout(tmr); tmr=setTimeout(loadStats,1500); };
    const ch = supabase.channel(`eco-stats-${Date.now()}`)
      .on("postgres_changes",{event:"*",schema:"public",table:"orders"},bump)
      .subscribe();
    return ()=>{ clearTimeout(tmr); try{Promise.resolve(supabase.removeChannel(ch)).catch(()=>{});}catch(e){} };
  }, [loadStats]);
  const S = stats || {};
  const statLoading = stats === undefined;
  const statVal = (v) => statLoading ? '…' : (stats === null ? '—' : fmt(v));
  // ── tarifas editables (config de la plataforma, consistente para todos) ──
  const [t,setT] = useState({
    commissionPct: cfg.commissionPct ?? 10,
    commissionActive: cfg.commissionActive !== false,
    commDeliveryPct: cfg.commDeliveryPct ?? 15,
    commIntlPct: cfg.commIntlPct ?? 10,
    commServicePct: cfg.commServicePct ?? 12,
    commVipPct: cfg.commVipPct ?? 10,
    localBase: cfg.localBase ?? 150,
    localPerKm: cfg.localPerKm ?? 25,
    esAereo: cfg.rates?.['España']?.aereo ?? 12,
    esMar: cfg.rates?.['España']?.maritimo ?? 5,
    usAereo: cfg.rates?.['Estados Unidos']?.aereo ?? 14,
    usMar: cfg.rates?.['Estados Unidos']?.maritimo ?? 6,
    usdCup: cfg.fx?.usdToCup ?? 400,
    eurCup: cfg.fx?.eurToCup ?? 430,
    promoActive: cfg.promoActive === true,
    promoCost: cfg.promoCost ?? 100,
  });
  const set=(k,v)=>setT(s=>({...s,[k]:v}));
  const saveTarifas=(override={})=>{
    if (ro) { toast('Solo lectura — sin permiso para modificar'); return; }
    const active = override.commissionActive !== undefined ? override.commissionActive : t.commissionActive;
    if (override.commissionActive !== undefined) set('commissionActive', active);
    data.onCfg && data.onCfg({
      commissionPct: Number(t.commissionPct)||0,
      commissionActive: active,
      commDeliveryPct: Number(t.commDeliveryPct)||0,
      commIntlPct: Number(t.commIntlPct)||0,
      commServicePct: Number(t.commServicePct)||0,
      commVipPct: Number(t.commVipPct)||0,
      localBase: Number(t.localBase)||0,
      localPerKm: Number(t.localPerKm)||0,
      rates: { 'España':{aereo:Number(t.esAereo)||0,maritimo:Number(t.esMar)||0}, 'Estados Unidos':{aereo:Number(t.usAereo)||0,maritimo:Number(t.usMar)||0} },
      promoActive: t.promoActive === true,
      promoCost: Number(t.promoCost)||0,
    });
    toast(override.commissionActive===true ? 'Tarifas activadas y aplicadas en la plataforma' : override.commissionActive===false ? 'Tarifas desactivadas' : 'Tarifas guardadas y aplicadas en la plataforma');
  };
  const saveFx=()=>{
    if (ro) { toast('Solo lectura — sin permiso para modificar'); return; }
    data.onCfg && data.onCfg({ fx: { usdToCup:Number(t.usdCup)||0, eurToCup:Number(t.eurCup)||0 } });
    toast('Tasa de cambio guardada');
  };
  const usdEur = (Number(t.eurCup)>0) ? (Number(t.usdCup)/Number(t.eurCup)) : 0;
  const [pl, setPl] = useState(()=> (cfg.plans||[]).map(p=>({...p})));
  const setPlan=(i,k,v)=>setPl(arr=>arr.map((p,j)=>j===i?{...p,[k]:v}:p));
  const savePlans=()=>{ if (ro) { toast('Solo lectura — sin permiso para modificar'); return; } data.onCfg && data.onCfg({ plans: pl.map(p=>({...p, price:Number(p.price)||0, promoPrice:Number(p.promoPrice)||0})) }); toast('Planes guardados'); };
  // En solo lectura (nivel "view") TODOS los campos van deshabilitados: no se puede escribir.
  const numInput=(k,suf,pre)=>(<div style={{display:'flex',alignItems:'center',gap:6,background:'var(--bg2)',border:'1px solid var(--bd2)',borderRadius:8,padding:'7px 10px',opacity:ro?.6:1}}>
    {pre&&<span style={{fontSize:12,color:'var(--tx3)',flexShrink:0}}>{pre}</span>}
    <input type="number" inputMode="decimal" value={t[k]} disabled={ro} readOnly={ro} onChange={e=>set(k,e.target.value)} style={{width:'100%',minWidth:0,background:'none',border:'none',color:'var(--tx)',fontSize:14,fontWeight:700,outline:'none',fontFamily:'var(--mo)',cursor:ro?'not-allowed':'text'}}/>
    {suf&&<span style={{fontSize:11,color:'var(--tx3)',whiteSpace:'nowrap',flexShrink:0}}>{suf}</span>}
  </div>);
  const field=(label,node,hint)=>(<div><div style={{fontSize:11,fontWeight:600,color:'var(--tx2)',marginBottom:5}}>{label}</div>{node}{hint&&<div style={{fontSize:10,color:'var(--tx3)',marginTop:4}}>{hint}</div>}</div>);

  // ── ⭐ Destacados reales + ledger (cargos) + nombres de vendedores ──────────
  const [promoted, setPromoted] = useState(null);
  const [ledger, setLedgerRows] = useState(undefined);   // undefined=cargando · null=no legible
  const [pNames, setPNames] = useState({});
  const [busyP, setBusyP] = useState(null);
  const [debtConfirm, setDebtConfirm] = useState(null);  // { uid, name, total }
  const reloadPromo = useCallback(() => { adminListPromoted().then(setPromoted).catch(() => setPromoted([])); }, []);
  useEffect(() => { reloadPromo(); }, [reloadPromo]);
  useEffect(() => { listLedger().then(setLedgerRows).catch(() => setLedgerRows(null)); }, []);
  // Nombres/avatares para destacados, deudas y lo que venga del ledger.
  useEffect(() => {
    const ids = [
      ...(promoted || []).map(p => p.seller_id),
      ...((Array.isArray(ledger) ? ledger : []).map(e => e.seller_id)),
    ].filter(Boolean);
    if (!ids.length) return;
    getProfilesByIds(ids).then(m => setPNames(prev => ({ ...prev, ...m }))).catch(() => {});
  }, [promoted, ledger]);
  const nameOf = uid => pNames[uid]?.full_name || null;
  // DEUDAS por vendedor: SOLO del LEDGER real del backend (seller_commission_ledger).
  // Si el ledger no es legible (sin permiso) → lista vacía, nunca un estimado local.
  const debts = useMemo(() => {
    if (!Array.isArray(ledger)) return [];   // cargando o sin acceso → nada calculado
    const m = {};
    ledger.forEach(e => {
      const uid = e.seller_id; if (!uid) return;
      if (e.paid === true) return;
      const amt = Number(e.amount_owed) || 0; if (amt <= 0) return;
      const kind = String(e.kind || '').toLowerCase();
      if (!m[uid]) m[uid] = { uid, comm: 0, promo: 0 };
      if (kind === 'promotion') m[uid].promo += amt; else m[uid].comm += amt;
    });
    return Object.values(m).map(d => ({ ...d, total: d.comm + d.promo })).filter(d => d.total > 0).sort((a, b) => b.total - a.total);
  }, [ledger]);
  const promoCharges = (Array.isArray(ledger) ? ledger : []).filter(e => String(e.kind || '').toLowerCase() === 'promotion').slice(0, 20);
  const unpromote = async (p) => {
    setBusyP(p.id);
    try { await adminSetPromoted(p.id, false); setPromoted(rows => (rows || []).filter(r => r.id !== p.id)); toast(`Destacado retirado a «${p.title}»`); }
    catch (e) { toast('⚠️ ' + (e?.message || 'No se pudo')); }
    setBusyP(null);
  };
  const markPaid = async () => {
    const { uid, name } = debtConfirm; setDebtConfirm(null);
    try {
      await adminMarkCommissionPaid(uid);
      setLedgerRows(rows => Array.isArray(rows) ? rows.map(e => (e.seller_id === uid ? { ...e, paid: true } : e)) : rows);
      toast(`✔ Deuda de ${name || 'vendedor'} saldada — se le notificó`);
    } catch (e) { toast('⚠️ ' + (e?.message || 'No se pudo saldar')); }
  };
  const collectMsg = (d) => {
    const name = nameOf(d.uid) || 'vendedor';
    const parts = [];
    if (d.comm > 0) parts.push(`${Math.round(d.comm)} por comisiones`);
    if (d.promo > 0) parts.push(`${Math.round(d.promo)} por promociones`);
    return `Hola ${name} 👋. Tienes una deuda pendiente de ${Math.round(d.total)} CUP con RETADOR (${parts.join(' y ')}). ¡Gracias!`;
  };
  return <>
    <div className="stit">Economía</div>
    <div className="ssub">Tarifas, comisiones e ingresos · números del backend (fuente única)</div>
    {stats === null && <div className="card cp mb16" style={{border:'1px solid var(--yw)',background:'var(--ywb)'}}>
      <div style={{fontSize:12,fontWeight:700,color:'var(--yw)'}}>Sin acceso a las métricas</div>
      <div style={{fontSize:11,color:'var(--tx3)',marginTop:3}}>El backend no te dio los números de esta sección. Se muestran como “—”.</div>
    </div>}
    <div className="g4 mb16">
      {[{l:'Ingresos por comisión',v:statVal(S.commission_total),c:'var(--gn)',d:'acumulado'},
        {l:'Ventas totales (GMV)',v:statVal(S.gmv_completed),c:'var(--ac2)',d:'pedidos completados'},
        {l:'Comisión por cobrar',v:statVal(S.commission_pending),c:'var(--yw)',d:'tu dinero pendiente'},
        {l:'Comisión activa',v:(cfg.commissionActive!==false)?`${cfg.commissionPct??10}%`:'OFF',c:(cfg.commissionActive!==false)?'var(--gn)':'var(--rd)',d:(cfg.commissionActive!==false)?'cobrando':'desactivada'}
      ].map(m=><div className="mc" key={m.l}><div className="ml">{m.l}</div><div className="mv" style={{fontSize:20,color:m.c}}>{m.v}</div><div style={{fontSize:11,color:'var(--tx3)',marginTop:4}}>{m.d}</div></div>)}
    </div>

    {/* ── SOLICITUDES DE PROMOCIÓN ── */}
    {(() => { const promoReqs = data.promoRequests || []; const pend=promoReqs.filter(r=>r.state==='pending'); return (
      <div className="card cp mb16">
        <div className="ch"><span className="ct">⭐ Solicitudes de promoción</span><span className={`bdg ${pend.length?'by':'bx'}`}>{pend.length} pendientes</span></div>
        <div style={{fontSize:11,color:'var(--tx3)',margin:'2px 0 12px'}}>Solicitudes de SUBASTAS (destacar/VIP): apruebas al recibir el pago. Los PRODUCTOS ya no piden permiso: se destacan directo con ⭐ y el cargo va a la deuda del vendedor.</div>
        {pend.length===0
          ? <div style={{textAlign:'center',color:'var(--tx3)',fontSize:12,padding:'18px 6px'}}>Sin solicitudes pendientes.</div>
          : pend.map(r=><div key={r.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:'1px solid rgba(128,128,128,.12)'}}>
              <span className={`bdg ${r.kind==='vip'?'bp':'by'}`} style={{fontSize:9}}>{r.kind==='vip'?'VIP':'DESTACAR'}</span>
              <div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:600,color:'var(--tx)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.auctionTitle||'Subasta'}</div><div style={{fontSize:10,color:'var(--tx3)'}}>{r.sellerName} · cobra {fmt(r.amount||0)}</div></div>
              {!ro && <button className="btn bts sm" onClick={()=>{ data.onPromoAction&&data.onPromoAction(r.id,'rejected'); toast('Solicitud rechazada'); }}>Rechazar</button>}
              {!ro && <button className="btn btp sm" onClick={()=>{ data.onPromoAction&&data.onPromoAction(r.id,'approved'); toast('Aprobada · cobro registrado'); }}>Aprobar</button>}
            </div>)}
      </div>
    ); })()}

    {/* ── TARIFAS EDITABLES ── */}
    <div className="card cp mb16">
      <div className="ch" style={{marginBottom:6}}><span className="ct">⚙️ Tarifas y Comisiones</span><span className="bdg bp">control del dueño</span></div>
      <div style={{fontSize:11,color:'var(--tx3)',marginBottom:16}}>Lo que edites aquí es lo que verán y pagarán los usuarios en la plataforma.</div>

      <div style={{fontSize:12,fontWeight:700,color:'var(--tx)',margin:'4px 0 10px'}}>Comisión por venta de productos</div>
      <div className="g2" style={{marginBottom:18}}>
        {field('Porcentaje por venta', numInput('commissionPct','%'), 'Se cobra al vendedor sobre cada venta. En 0% no cobra.')}
      </div>

      <div style={{fontSize:12,fontWeight:700,color:'var(--tx)',margin:'4px 0 10px'}}>⭐ Función Destacar (productos)</div>
      <div className="g2" style={{marginBottom:18}}>
        <div>
          <div style={{fontSize:11,fontWeight:600,color:'var(--tx2)',marginBottom:5}}>Interruptor</div>
          <button disabled={ro} onClick={()=>{ if(ro)return; set('promoActive', !t.promoActive); }} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,background:'var(--bg2)',border:`1px solid ${t.promoActive?'var(--gn)':'var(--bd2)'}`,borderRadius:8,padding:'8px 10px',cursor:ro?'not-allowed':'pointer',opacity:ro?.6:1,color:t.promoActive?'var(--gn)':'var(--tx3)',fontSize:13,fontWeight:800}}>
            {t.promoActive ? '⭐ ENCENDIDA' : 'APAGADA'}
            <span style={{width:38,height:20,borderRadius:12,background:t.promoActive?'var(--gn)':'var(--bd2)',position:'relative',flexShrink:0}}><span style={{position:'absolute',top:2,left:t.promoActive?20:2,width:16,height:16,borderRadius:'50%',background:'#fff',transition:'left .15s'}}/></span>
          </button>
          <div style={{fontSize:10,color:'var(--tx3)',marginTop:4}}>Apagada: los vendedores NO ven la opción ⭐ en ningún lado.</div>
        </div>
        {field('Costo de destacar', numInput('promoCost','CUP','$'), 'Se suma a la deuda del vendedor al destacar.')}
      </div>

      <div style={{fontSize:12,fontWeight:700,color:'var(--tx)',margin:'4px 0 4px'}}>Tu ganancia por usar la plataforma</div>
      <div style={{fontSize:10,color:'var(--tx3)',marginBottom:10}}>El % que ganas tú de quienes trabajan en la plataforma (mensajeros, transportistas, servicios).</div>
      <div className="g3" style={{marginBottom:18}}>
        {field('Comisión delivery local', numInput('commDeliveryPct','%'), 'Sobre lo que cobra cada mensajero.')}
        {field('Comisión envíos internacionales', numInput('commIntlPct','%'), 'Sobre cada envío que haga un socio/transportista.')}
        {field('Comisión servicios', numInput('commServicePct','%'), 'Sobre lo que cobre quien preste un servicio.')}
        {field('Comisión subastas VIP', numInput('commVipPct','%'), 'Sobre la cuota de acceso que paga cada participante VIP.')}
      </div>

      <div style={{fontSize:12,fontWeight:700,color:'var(--tx)',margin:'4px 0 10px'}}>Delivery local</div>
      <div className="g2" style={{marginBottom:18}}>
        {field('Tarifa base', numInput('localBase','CUP','$'), 'Costo fijo de salida del envío local.')}
        {field('Precio por km', numInput('localPerKm','CUP/km','$'), 'Se suma según la distancia recorrida.')}
      </div>

      <div style={{fontSize:12,fontWeight:700,color:'var(--tx)',margin:'4px 0 10px'}}>Envíos internacionales (por libra)</div>
      <div className="g2" style={{marginBottom:8}}>
        {field('España → Cuba · Aéreo', numInput('esAereo','USD/lb','$'))}
        {field('España → Cuba · Marítimo', numInput('esMar','USD/lb','$'))}
        {field('EE.UU. → Cuba · Aéreo', numInput('usAereo','USD/lb','$'))}
        {field('EE.UU. → Cuba · Marítimo', numInput('usMar','USD/lb','$'))}
      </div>

      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,marginTop:16,flexWrap:'wrap'}}>
        <span style={{fontSize:11,color:'var(--tx3)'}}>Estado del cobro: <b style={{color:t.commissionActive?'var(--gn)':'var(--rd)'}}>{t.commissionActive?'activo (cobrando)':'desactivado'}</b></span>
        {ro
          ? <span style={{fontSize:11,fontWeight:800,color:'var(--tx3)'}}>👁 Solo lectura</span>
          : <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          <button className="btn btd" onClick={()=>saveTarifas({commissionActive:!t.commissionActive})} style={{fontWeight:800,padding:'9px 18px',border:`1px solid ${t.commissionActive?'var(--rd)':'var(--gn)'}`,color:t.commissionActive?'var(--rd)':'var(--gn)'}}>{t.commissionActive?'○ Desactivar tarifas':'● Activar tarifas'}</button>
          <button className="btn btp" onClick={()=>saveTarifas()} style={{fontWeight:800,padding:'9px 22px'}}>Guardar tarifas</button>
        </div>}
      </div>
    </div>

    {/* ── CAMBIO DE MONEDA (conectado a la billetera) ── */}
    <div className="card cp mb16">
      <div className="ch" style={{marginBottom:6}}><span className="ct">💱 Cambio de moneda</span><span className="bdg bg">activa · en la billetera</span></div>
      <div style={{fontSize:11,color:'var(--tx3)',marginBottom:16}}>Define la tasa del día. Se aplica ya en la billetera (USD, EUR, CUP): saldos y conversor usan esta tasa. CUP = peso cubano.</div>
      <div className="g2" style={{marginBottom:8}}>
        {field('1 USD en CUP', numInput('usdCup','CUP','$'), 'Cuántos pesos cubanos vale 1 dólar.')}
        {field('1 EUR en CUP', numInput('eurCup','CUP','€'), 'Cuántos pesos cubanos vale 1 euro.')}
      </div>
      <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center',background:'var(--bg2)',border:'1px solid var(--bd2)',borderRadius:9,padding:'10px 13px',marginTop:6}}>
        <span style={{fontSize:11,color:'var(--tx3)',fontWeight:600}}>Cruces automáticos:</span>
        <span style={{fontSize:12,fontWeight:700,color:'var(--tx)'}}>1 USD ≈ {usdEur.toFixed(2)} EUR</span>
        <span style={{fontSize:12,fontWeight:700,color:'var(--tx)'}}>1 EUR ≈ {(usdEur>0?1/usdEur:0).toFixed(2)} USD</span>
      </div>
      {!ro && <div style={{display:'flex',justifyContent:'flex-end',marginTop:16}}>
        <button className="btn btp" onClick={saveFx} style={{fontWeight:800,padding:'9px 22px'}}>Guardar cambio</button>
      </div>}
    </div>

    {/* ── PLANES ── */}
    <div className="card cp mb16">
      <div className="ch" style={{marginBottom:6}}><span className="ct">⭐ Planes</span><span className="bdg bp">precios e info</span></div>
      <div style={{fontSize:11,color:'var(--tx3)',marginBottom:14}}>Define cada plan: precio, promoción y qué incluye. Es lo que verá el usuario al pedir mejorar su plan.</div>
      {pl.map((p,i)=><div key={p.id||i} style={{border:'1px solid var(--bd2)',borderRadius:11,padding:'13px',marginBottom:11,background:'var(--bg2)'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
          <input value={p.name} disabled={ro} readOnly={ro} onChange={e=>setPlan(i,'name',e.target.value)} style={{flex:1,minWidth:0,background:'var(--bg)',border:'1px solid var(--bd2)',borderRadius:8,padding:'7px 10px',color:'var(--tx)',fontSize:13,fontWeight:800,outline:'none',opacity:ro?.6:1}}/>
          <div style={{display:'flex',alignItems:'center',gap:5,background:'var(--bg)',border:'1px solid var(--bd2)',borderRadius:8,padding:'7px 10px',opacity:ro?.6:1}}>
            <span style={{fontSize:12,color:'var(--tx3)'}}>$</span>
            <input type="number" value={p.price} disabled={ro} readOnly={ro} onChange={e=>setPlan(i,'price',e.target.value)} style={{width:54,background:'none',border:'none',color:'var(--tx)',fontSize:13,fontWeight:700,outline:'none',fontFamily:'var(--mo)'}}/>
            <span style={{fontSize:10,color:'var(--tx3)'}}>/mes</span>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10,flexWrap:'wrap'}}>
          <button disabled={ro} onClick={()=>{ if(ro)return; setPlan(i,'promo',!p.promo); }} style={{height:32,padding:'0 12px',borderRadius:7,border:`1px solid ${p.promo?'var(--yw)':'var(--bd2)'}`,background:p.promo?'rgba(245,166,35,.12)':'var(--bg)',color:p.promo?'var(--yw)':'var(--tx3)',fontSize:11,fontWeight:700,cursor:ro?'not-allowed':'pointer',opacity:ro?.6:1}}>{p.promo?'● En promoción':'○ Sin promo'}</button>
          {p.promo&&<div style={{display:'flex',alignItems:'center',gap:5,background:'var(--bg)',border:'1px solid var(--bd2)',borderRadius:7,padding:'6px 10px',opacity:ro?.6:1}}>
            <span style={{fontSize:11,color:'var(--tx3)'}}>Precio promo $</span>
            <input type="number" value={p.promoPrice} disabled={ro} readOnly={ro} onChange={e=>setPlan(i,'promoPrice',e.target.value)} style={{width:48,background:'none',border:'none',color:'var(--tx)',fontSize:12,fontWeight:700,outline:'none',fontFamily:'var(--mo)'}}/>
          </div>}
        </div>
        <div style={{fontSize:10,color:'var(--tx3)',marginBottom:4,fontWeight:600}}>QUÉ INCLUYE (una línea por beneficio)</div>
        <textarea value={(p.features||[]).join('\n')} disabled={ro} readOnly={ro} onChange={e=>setPlan(i,'features',e.target.value.split('\n'))} rows={3} style={{width:'100%',background:'var(--bg)',border:'1px solid var(--bd2)',borderRadius:8,padding:'8px 10px',color:'var(--tx)',fontSize:12,outline:'none',resize:'vertical',fontFamily:'inherit',lineHeight:1.5,opacity:ro?.6:1}}/>
      </div>)}
      {!ro && <div style={{display:'flex',justifyContent:'flex-end',marginTop:4}}>
        <button className="btn btp" onClick={savePlans} style={{fontWeight:800,padding:'9px 22px'}}>Guardar planes</button>
      </div>}
    </div>

    <div className="g2 mb16">
      <div className="card cp" style={{display:'flex',flexDirection:'column',justifyContent:'center'}}>
        <div className="ch"><span className="ct">Comisiones (real)</span></div>
        <div style={{display:'flex',gap:18,flexWrap:'wrap',marginTop:8}}>
          <div><div style={{fontSize:10,color:'var(--tx3)'}}>Acumuladas</div><div style={{fontSize:24,fontWeight:800,color:'var(--gn)',fontFamily:'var(--mo)'}}>{statVal(S.commission_total)}</div></div>
          <div><div style={{fontSize:10,color:'var(--tx3)'}}>Por cobrar</div><div style={{fontSize:24,fontWeight:800,color:'var(--yw)',fontFamily:'var(--mo)'}}>{statVal(S.commission_pending)}</div></div>
        </div>
        <div style={{fontSize:10,color:'var(--tx3)',marginTop:8}}>Cifras del backend (fuente única), iguales para todo el equipo.</div>
      </div>
      <div className="card cp">
        <div className="ch"><span className="ct">Deudas por vendedor</span><span className={`bdg ${debts.length?'by':'bx'}`}>{debts.length}</span></div>
        <div style={{fontSize:11,color:'var(--tx3)',margin:'2px 0 8px'}}>Comisiones y promociones sin saldar. Toca el nombre para ver su ficha; "Cobrar" abre el chat con el mensaje listo.</div>
        {debts.length===0
          ? <div style={{textAlign:'center',color:'var(--tx3)',fontSize:12,padding:'22px 6px'}}>Nadie debe nada por ahora. Cada venta o destacado sumará aquí.</div>
          : debts.slice(0,12).map(d=>{
            const name = nameOf(d.uid) || 'Vendedor';
            const parts = [d.comm>0?`${fmt(d.comm)} comisiones`:null, d.promo>0?`${fmt(d.promo)} promociones`:null].filter(Boolean).join(' · ');
            return <div key={d.uid} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:'1px solid rgba(128,128,128,.1)'}}>
              <div onClick={()=>data.onViewProfile&&data.onViewProfile(d.uid)} style={{display:'flex',alignItems:'center',gap:8,flex:1,minWidth:0,cursor:'pointer'}}>
                <Avatar url={avatarUrlOf(pNames[d.uid]?.avatar_url)} name={name} size={34} />
                <div style={{minWidth:0}}>
                  <div style={{fontSize:12.5,fontWeight:700,color:'var(--ac)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{name}</div>
                  <div style={{fontSize:10,color:'var(--tx3)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{parts}</div>
                </div>
              </div>
              <span style={{fontSize:12.5,fontWeight:800,color:'var(--yw)',fontFamily:'var(--mo)',flexShrink:0}}>{fmt(d.total)}</span>
              {!ro && <div style={{display:'flex',gap:4,flexShrink:0}}>
                <button className="btn btg sm" onClick={()=>data.onCollectDebt&&data.onCollectDebt(d.uid, name, collectMsg(d))}>💬 Cobrar</button>
                <button className="btn bts sm" onClick={()=>setDebtConfirm({ uid:d.uid, name, total:d.total })}>✔ Pagado</button>
              </div>}
            </div>;
          })}
      </div>
    </div>

    {/* ── ⭐ PROMOCIONES Y DESTACADOS (reales) ── */}
    <div className="card cp mb16">
      <div className="ch"><span className="ct">⭐ Promociones y Destacados</span><span className="bdg bx">{promoted ? promoted.length : '…'} activos</span></div>
      <div style={{fontSize:11,color:'var(--tx3)',margin:'2px 0 10px'}}>Productos destacados ahora mismo. Puedes quitar el destacado cuando quieras.</div>
      {promoted === null
        ? <div style={{textAlign:'center',color:'var(--tx3)',fontSize:12,padding:'18px 6px'}}>Cargando…</div>
        : promoted.length === 0
          ? <div style={{textAlign:'center',color:'var(--tx3)',fontSize:12,padding:'18px 6px'}}>No hay productos destacados.</div>
          : promoted.map(p=>{
            const img = Array.isArray(p.images) ? p.images[0] : p.images;
            const owner = nameOf(p.seller_id) || 'Vendedor';
            return <div key={p.id} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 0',borderBottom:'1px solid rgba(128,128,128,.1)'}}>
              <div style={{width:40,height:40,borderRadius:8,overflow:'hidden',background:'#161616',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>
                {img ? <img src={img} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>{e.target.style.display='none';}}/> : '📦'}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:700,color:'var(--tx)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.title}</div>
                <div style={{fontSize:10.5,color:'var(--tx3)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                  <span onClick={()=>data.onViewProfile&&data.onViewProfile(p.seller_id)} style={{color:'var(--ac)',fontWeight:700,cursor:'pointer'}}>{owner}</span>
                  {' '}· {p.created_at ? new Date(p.created_at).toLocaleDateString('es-ES',{day:'2-digit',month:'short'}) : ''}
                </div>
              </div>
              {!ro && <button className="btn btd sm" disabled={busyP===p.id} onClick={()=>unpromote(p)} style={{flexShrink:0}}>Quitar destacado</button>}
            </div>;
          })}
      {promoCharges.length > 0 && <>
        <div style={{fontSize:11,fontWeight:700,color:'var(--tx2)',margin:'14px 0 6px'}}>Cargos de promoción (ledger)</div>
        {promoCharges.map((e,i)=>(
          <div key={e.id||i} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0',borderBottom:'1px solid rgba(128,128,128,.08)'}}>
            <span style={{fontSize:12}}>🪙</span>
            <span style={{flex:1,fontSize:11.5,color:'var(--tx)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{nameOf(e.seller_id)||'Vendedor'}</span>
            <span style={{fontSize:10,color:'var(--tx3)'}}>{e.created_at?new Date(e.created_at).toLocaleDateString('es-ES',{day:'2-digit',month:'short'}):''}</span>
            <span style={{fontSize:12,fontWeight:800,color:'var(--yw)',fontFamily:'var(--mo)'}}>{fmt(e.amount_owed)}{e.paid?' · ✓ pagado':''}</span>
          </div>
        ))}
      </>}
    </div>

    {/* Confirmación de "Marcar pagado" */}
    {debtConfirm && <div className="mo" onClick={()=>setDebtConfirm(null)}>
      <div className="mb" onClick={e=>e.stopPropagation()} style={{maxWidth:340}}>
        <div className="mt">✔ Saldar deuda</div>
        <div className="ms">Se marca como pagada la deuda de <b>{debtConfirm.name}</b> ({fmt(debtConfirm.total)}). Recibirá la notificación de deuda saldada. ¿Confirmas?</div>
        <div style={{display:'flex',gap:8,marginTop:12}}>
          <button className="btn" style={{flex:1}} onClick={()=>setDebtConfirm(null)}>Cancelar</button>
          <button className="btn bts" style={{flex:1}} onClick={markPaid}>Marcar pagado</button>
        </div>
      </div>
    </div>}

  </>;
}

/* ── Sistema ────────────────────────────────────────────────────────────────── */
function IntlRoute({country, toast, data={}}){
  const cfg = data.cfg || {};
  const orders = data.orders || [];
  const rate = (cfg.rates && cfg.rates[country]) || { aereo:0, maritimo:0 };
  const [aereo,setAereo] = useState(rate.aereo ?? 0);
  const [mar,setMar] = useState(rate.maritimo ?? 0);
  const fmt = n=>'$'+Math.round(n||0).toLocaleString();
  const saveRate = ()=>{
    data.onCfg && data.onCfg({ rates: { ...(cfg.rates||{}), [country]: { aereo:Number(aereo)||0, maritimo:Number(mar)||0 } } });
    toast('Tarifa de tu ruta guardada');
  };
  // Envíos de esta ruta (mejor esfuerzo por origen; el backend lo etiquetará con precisión)
  const mine = orders.filter(o=> o.shipMode==='intl' && String(o.origin||o.delivery?.origin||o.delivery?.recipient?.country||'').toLowerCase().includes(country.toLowerCase().split(' ')[0]));
  const pendientes = mine.filter(o=> (o.stepIdx||0) < ((o.flow?.length||1)-1));
  const ganancia = (cfg.commissionActive===false?0:1) * mine.reduce((a,o)=> a + (parseFloat(o.shipPrice)||0)*((cfg.commIntlPct??10)/100), 0);
  return <div className="mc">
    <div className="g3 mb16">
      <div className="card cp"><div className="ct" style={{fontSize:11}}>Envíos de tu ruta</div><div style={{fontSize:24,fontWeight:800,color:'var(--tx)',marginTop:4}}>{mine.length}</div></div>
      <div className="card cp"><div className="ct" style={{fontSize:11}}>En curso</div><div style={{fontSize:24,fontWeight:800,color:'var(--yw)',marginTop:4}}>{pendientes.length}</div></div>
      <div className="card cp"><div className="ct" style={{fontSize:11}}>Tu ganancia</div><div style={{fontSize:24,fontWeight:800,color:'var(--gn)',marginTop:4}}>{fmt(ganancia)}</div></div>
    </div>

    <div className="card cp mb16">
      <div className="ch"><span className="ct">Tu tarifa · {country} → Cuba</span><span className="bdg bx">USD por libra</span></div>
      <div style={{fontSize:11,color:'var(--tx3)',margin:'2px 0 12px'}}>Pones el precio por libra de tu ruta. Solo afecta a {country} → Cuba; la otra ruta es independiente.</div>
      <div className="g2">
        <div>
          <div style={{fontSize:11,fontWeight:700,color:'var(--tx2)',marginBottom:5}}>Aéreo (USD/lb)</div>
          <input type="number" value={aereo} onChange={e=>setAereo(e.target.value)} style={{width:'100%',height:38,borderRadius:8,border:'1px solid var(--bd2)',background:'var(--bg2)',color:'var(--tx)',fontSize:14,padding:'0 11px',outline:'none'}}/>
        </div>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:'var(--tx2)',marginBottom:5}}>Marítimo (USD/lb)</div>
          <input type="number" value={mar} onChange={e=>setMar(e.target.value)} style={{width:'100%',height:38,borderRadius:8,border:'1px solid var(--bd2)',background:'var(--bg2)',color:'var(--tx)',fontSize:14,padding:'0 11px',outline:'none'}}/>
        </div>
      </div>
      <button className="btn btp" style={{marginTop:14}} onClick={saveRate}>Guardar tarifa</button>
    </div>

    <div className="card cp">
      <div className="ch"><span className="ct">Solicitudes y envíos</span><span className={`bdg ${pendientes.length?'by':'bx'}`}>{pendientes.length} por atender</span></div>
      <div style={{fontSize:11,color:'var(--tx3)',margin:'2px 0 12px'}}>Aquí recibes y gestionas los envíos de tu ruta. Las notificaciones de esta sección son solo de {country} → Cuba.</div>
      {mine.length===0
        ? <div style={{textAlign:'center',color:'var(--tx3)',fontSize:12,padding:'26px 6px',background:'var(--bg)',borderRadius:10,border:'1px dashed var(--bd2)'}}><div style={{fontSize:24,marginBottom:6,opacity:.6}}>✈️</div>Sin envíos en esta ruta por ahora.</div>
        : mine.map(o=><div key={o.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:'1px solid rgba(128,128,128,.12)'}}>
            <div style={{flex:1,minWidth:0}}><div style={{fontSize:12.5,fontWeight:600,color:'var(--tx)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{o.title||'Envío'}</div><div style={{fontSize:10,color:'var(--tx3)'}}>{o.sellerName||'—'} · {fmt(o.shipPrice)} envío</div></div>
            <span className="bdg bb" style={{fontSize:9}}>{(o.status||'').replace(/_/g,' ')||'pendiente'}</span>
          </div>)}
    </div>
  </div>;
}

// ── EQUIPO con PERMISOS A LA CARTA ─────────────────────────────────────────────
// El dueño elige, sección por sección, qué puede hacer cada miembro:
//   🚫 Sin acceso (none) · 👁️ Ver (view) · ✏️ Administrar (manage).
const LEVELS=[
  { v:'none',   icon:'🚫', label:'Sin acceso' },
  { v:'view',   icon:'👁️', label:'Ver' },
  { v:'manage', icon:'✏️', label:'Administrar' },
];
const LVL_TXT={ view:'ver', manage:'administrar' };
const permSummary=(p)=>{
  if(!p||typeof p!=='object') return 'Sin permisos';
  const parts=PERM_CATALOG.filter(s=>p[s.key]&&p[s.key]!=='none').map(s=>`${s.label}: ${LVL_TXT[p[s.key]]||p[s.key]}`);
  return parts.length?parts.join(' · '):'Sin permisos';
};

function PermGrid({ value, onChange }){
  return <div style={{display:'flex',flexDirection:'column',gap:8}}>
    {PERM_CATALOG.map(s=>{
      const cur=value[s.key]||'none';
      return <div key={s.key} style={{background:'var(--bg2)',border:'1px solid var(--bd)',borderRadius:12,padding:'10px 12px'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
          <span style={{fontSize:15,width:20,textAlign:'center'}}>{s.icon}</span>
          <span style={{fontSize:12.5,fontWeight:700,color:'var(--tx)'}}>{s.label}</span>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6}}>
          {LEVELS.map(l=>{
            const on=cur===l.v;
            return <button key={l.v} onClick={()=>onChange(s.key,l.v)}
              style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,padding:'7px 4px',borderRadius:9,cursor:'pointer',
                border:on?'1px solid var(--ac)':'1px solid var(--bd2)',
                background:on?'var(--ag)':'transparent',
                color:on?'var(--tx)':'var(--tx2)',fontWeight:on?700:600,fontSize:10.5,transition:'all .14s'}}>
              <span style={{fontSize:15}}>{l.icon}</span>{l.label}
            </button>;
          })}
        </div>
      </div>;
    })}
  </div>;
}

function TeamScreen({ toast, meId }){
  const [view, setView] = useState('list');       // list | search | perms
  const [staff, setStaff] = useState(null);
  const [target, setTarget] = useState(null);      // { user_id, profile } al editar/añadir
  const [perm, setPerm] = useState({});            // borrador de permisos
  const [busy, setBusy] = useState(false);
  const [remFor, setRemFor] = useState(null);      // miembro a quitar (confirmación)
  // Buscador de usuarios
  const [q, setQ] = useState(""); const [dq, setDq] = useState("");
  const [results, setResults] = useState([]); const [searching, setSearching] = useState(false);

  const load = () => { setStaff(null); adminListStaff().then(setStaff).catch(() => setStaff([])); };
  useEffect(() => { load(); }, []);
  useEffect(() => { const t = setTimeout(() => setDq(q), 350); return () => clearTimeout(t); }, [q]);
  useEffect(() => {
    if (view !== 'search') return;
    let alive = true; setSearching(true);
    adminListUsers({ query: dq, from: 0, to: 19 })
      .then(d => { if (alive) { setResults(d); setSearching(false); } })
      .catch(() => { if (alive) { setResults([]); setSearching(false); } });
    return () => { alive = false; };
  }, [dq, view]);

  const nmeOf = u => (u && (u.full_name || u.email)) || 'Usuario';
  const staffIds = new Set((staff || []).map(m => m.user_id));

  const openAdd = () => { setQ(""); setDq(""); setResults([]); setView('search'); };
  const pickUser = (u) => { setTarget({ user_id: u.id, profile: u }); setPerm({}); setView('perms'); };
  const openEdit = (m) => { setTarget({ user_id: m.user_id, profile: m.profile }); setPerm({ ...(m.permissions || {}) }); setView('perms'); };
  const setLvl = (key, v) => setPerm(p => ({ ...p, [key]: v }));

  const save = async () => {
    setBusy(true);
    const clean = {}; PERM_CATALOG.forEach(s => { if (perm[s.key] && perm[s.key] !== 'none') clean[s.key] = perm[s.key]; });
    try {
      await adminGrantStaff(target.user_id, clean);
      toast(`✓ Permisos guardados · ${nmeOf(target.profile)}`);
      setView('list'); setTarget(null); load();
    } catch (e) { toast("⚠️ " + (e?.message || "No se pudo guardar")); }
    setBusy(false);
  };
  const confirmRemove = async () => {
    const m = remFor; setRemFor(null); setBusy(true);
    try { await adminRevokeStaff(m.user_id); toast(`Quitado del equipo · ${nmeOf(m.profile)}`); load(); }
    catch (e) { toast("⚠️ " + (e?.message || "No se pudo")); }
    setBusy(false);
  };

  // ── Pantalla de PERMISOS (añadir o editar) ──
  if (view === 'perms' && target) {
    const p = target.profile;
    return <div className="mc">
      <div className="card cp mb16">
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <Avatar url={avatarUrlOf(p?.avatar_url)} name={nmeOf(p)} size={46} />
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:14,fontWeight:800,color:'var(--tx)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{nmeOf(p)}</div>
            <div style={{fontSize:11.5,color:'var(--tx3)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p?.email||'—'}</div>
          </div>
        </div>
      </div>
      <div className="card cp mb16">
        <div className="ch"><span className="ct">Permisos por sección</span></div>
        <div style={{fontSize:11,color:'var(--tx3)',margin:'2px 0 12px'}}>Elige, sección por sección, qué puede hacer este miembro. Por defecto, todo en <b>Sin acceso</b>.</div>
        <PermGrid value={perm} onChange={setLvl} />
      </div>
      <div style={{display:'flex',gap:8,marginBottom:20}}>
        <button className="btn btg" style={{flex:1}} disabled={busy} onClick={() => { setView(staffIds.has(target.user_id) ? 'list' : 'search'); setTarget(null); }}>Cancelar</button>
        <button className="btn btp" style={{flex:2}} disabled={busy} onClick={save}>{busy ? 'Guardando…' : 'Guardar permisos'}</button>
      </div>
    </div>;
  }

  // ── Buscador de usuarios para añadir ──
  if (view === 'search') {
    return <div className="mc">
      <div className="card cp">
        <div className="ch"><span className="ct">Añadir al equipo</span></div>
        <div style={{fontSize:11,color:'var(--tx3)',margin:'2px 0 10px'}}>Busca un usuario por nombre o email y asígnale permisos.</div>
        <input value={q} onChange={e => setQ(e.target.value)} autoFocus placeholder="Buscar por nombre o email…"
          style={{ width:'100%', boxSizing:'border-box', background:'var(--bg3)', border:'1px solid var(--bd2)', borderRadius:10, padding:'10px 12px', color:'var(--tx)', fontSize:13, outline:'none', marginBottom:10 }} />
        {searching
          ? <div style={{textAlign:'center',color:'var(--tx3)',fontSize:12,padding:'22px 6px'}}>Buscando…</div>
          : results.length === 0
            ? <div style={{textAlign:'center',color:'var(--tx3)',fontSize:12,padding:'22px 6px'}}>{dq ? 'Nadie coincide con la búsqueda.' : 'Escribe para buscar usuarios.'}</div>
            : results.map(u => {
                const already = staffIds.has(u.id);
                return <div key={u.id} className="reprow" onClick={() => !already && pickUser(u)}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 8px', margin:'0 -8px', borderRadius:9, cursor: already?'default':'pointer', borderBottom:'1px solid rgba(128,128,128,.1)', opacity: already?.55:1 }}>
                  <Avatar url={avatarUrlOf(u.avatar_url)} name={nmeOf(u)} size={38} />
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12.5,fontWeight:700,color:'var(--tx)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{nmeOf(u)}</div>
                    <div style={{fontSize:11,color:'var(--tx3)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{u.email||'—'}</div>
                  </div>
                  {already ? <span className="bdg bx">En el equipo</span> : <button className="btn btp sm" onClick={e => { e.stopPropagation(); pickUser(u); }}>Asignar</button>}
                </div>;
              })}
      </div>
      <div style={{marginTop:14,marginBottom:20}}>
        <button className="btn btg" style={{width:'100%'}} onClick={() => setView('list')}>‹ Volver al equipo</button>
      </div>
    </div>;
  }

  // ── Lista del equipo ──
  return <div className="mc">
    <div className="card cp mb16">
      <div className="ch"><span className="ct">Equipo</span><span className="bdg bx">{staff ? staff.length : '…'}</span></div>
      <div style={{fontSize:11,color:'var(--tx3)',margin:'2px 0 12px'}}>Miembros con acceso al panel y sus permisos por sección.</div>
      {staff === null
        ? <div style={{textAlign:'center',color:'var(--tx3)',fontSize:12,padding:'18px 6px'}}>Cargando…</div>
        : staff.length === 0
          ? <div style={{textAlign:'center',color:'var(--tx3)',fontSize:12,padding:'18px 6px'}}>Aún no has añadido a nadie al equipo.</div>
          : staff.map(m => {
              const p = m.profile; const isMe = m.user_id === meId;
              return <div key={m.user_id} style={{display:'flex',alignItems:'center',gap:10,padding:'11px 0',borderBottom:'1px solid rgba(128,128,128,.1)'}}>
                <Avatar url={avatarUrlOf(p?.avatar_url)} name={nmeOf(p)} size={40} />
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12.5,fontWeight:700,color:'var(--tx)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{nmeOf(p)}{isMe && <span style={{color:'var(--tx3)',fontWeight:500}}> · tú</span>}</div>
                  <div style={{fontSize:11,color:'var(--tx3)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p?.email||'—'}</div>
                  <div style={{fontSize:10.5,color:'var(--tx2)',marginTop:3,lineHeight:1.4,whiteSpace:'normal'}}>{permSummary(m.permissions)}</div>
                </div>
                {!isMe && <div style={{display:'flex',flexDirection:'column',gap:4,flexShrink:0}}>
                  <button className="btn btg sm" disabled={busy} onClick={() => openEdit(m)}>Editar</button>
                  <button className="btn btd sm" disabled={busy} onClick={() => setRemFor(m)}>Quitar</button>
                </div>}
              </div>;
            })}
    </div>
    <button className="btn btp" style={{width:'100%',justifyContent:'center',padding:'11px',marginBottom:20}} onClick={openAdd}>➕ Añadir al equipo</button>

    {remFor && <div className="mo" onClick={() => setRemFor(null)}>
      <div className="mb" onClick={e => e.stopPropagation()} style={{maxWidth:340}}>
        <div className="mt">Quitar del equipo</div>
        <div className="ms">{nmeOf(remFor.profile)} perderá el acceso al panel de administración. Podrás volver a añadirlo cuando quieras.</div>
        <div style={{display:'flex',gap:8,marginTop:14}}>
          <button className="btn btg" style={{flex:1}} onClick={() => setRemFor(null)}>Cancelar</button>
          <button className="btn btd" style={{flex:1}} onClick={confirmRemove}>Quitar</button>
        </div>
      </div>
    </div>}
  </div>;
}

function Sistema({toast, data={}}){
  const hhmm = ts=>{ const d=new Date(ts); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; };
  const dmy = ts=>new Date(ts).toLocaleDateString('es-ES',{day:'2-digit',month:'short'});
  const num = v => (v==null||v===''||Number.isNaN(Number(v))) ? '—' : Number(v).toLocaleString('es-ES');
  // ── FUENTE ÚNICA: contadores del backend (admin_dashboard_stats) y actividad del
  // audit_log (adminListLogs). Cero conteo desde arrays locales — antes se mezclaban
  // los pedidos/reportes en localStorage del propio usuario y salían cifras dispares.
  const [stats, setStats] = useState(undefined);
  useEffect(() => { adminDashboardStats().then(setStats).catch(() => setStats(null)); }, []);
  const [logs, setLogs] = useState(undefined); // undefined=cargando · null=sin acceso
  useEffect(() => { adminListLogs(50).then(setLogs).catch(() => setLogs(null)); }, []);
  const activity = useMemo(() => (Array.isArray(logs)?logs:[]).map(l=>({
    at: l.created_at ? new Date(l.created_at).getTime() : 0,
    msg: l.action || l.event || l.message || l.description || 'Acción',
    svc: 'sistema',
  })).filter(e=>e.at).sort((a,b)=>b.at-a.at), [logs]);
  const S = stats || {};
  const statLoading = stats === undefined;
  const ordersCount = statLoading ? '…' : (stats===null ? '—' : num((Number(S.orders_active)||0)+(Number(S.orders_completed)||0)));
  const usersCount  = statLoading ? '…' : (stats===null ? '—' : num(S.users_total));
  const eventsCount = logs===undefined ? '…' : (logs===null ? '—' : num(activity.length));
  const [actOpen, setActOpen] = useState(false);
  const [actShow, setActShow] = useState(20);
  // "N nuevas" desde la última vez que el admin abrió la actividad (last-seen local).
  const [lastSeen, setLastSeen] = useState(() => { try { return Number(localStorage.getItem('retador_adminact_seen')) || 0; } catch { return 0; } });
  const newCount = activity.filter(e => e.at > lastSeen).length;
  const toggleAct = () => {
    setActOpen(o => {
      const next = !o;
      if (next) { const now = Date.now(); setLastSeen(now); try { localStorage.setItem('retador_adminact_seen', String(now)); } catch {} }
      return next;
    });
  };
  const services = [
    {name:'App RETADOR', state:'ok', note:'Operativo'},
    {name:'Backend (Supabase)', state:'ok', note:'Conectado'},
    {name:'Pasarela de pagos exterior', state:'off', note:'Sin integrar'},
    {name:'GPS / Rastreo de envíos', state:'off', note:'Sin integrar'},
    {name:'Notificaciones push', state:'off', note:'Sin integrar'},
  ];
  return <>
    <div className="stit">Sistema</div>
    <div className="ssub">Actividad real de la plataforma e integraciones</div>
    {/* Resumen compacto: conteos REALES del backend (fuente única) */}
    <div className="g3 mb16">{[
      {l:'Órdenes',v:ordersCount,c:'var(--gn)'},
      {l:'Usuarios',v:usersCount,c:'var(--ac2)'},
      {l:'Eventos (registro)',v:eventsCount,c:'var(--yw)'}
    ].map(m=><div className="mc" key={m.l}><div className="ml">{m.l}</div><div className="mv" style={{color:m.c}}>{m.v}</div></div>)}</div>

    {/* 📜 ACTIVIDAD (consolidada): plegada por defecto, con contador de nuevas */}
    <div className="card cp mb16">
      <div onClick={toggleAct} style={{display:'flex',alignItems:'center',gap:9,cursor:'pointer'}}>
        <span style={{fontSize:15}}>📜</span>
        <span className="ct" style={{flex:1}}>Actividad</span>
        {newCount > 0 && !actOpen && <span style={{display:'flex',alignItems:'center',gap:5,color:'var(--ac)',fontSize:11,fontWeight:800}}><span style={{width:8,height:8,borderRadius:'50%',background:'var(--ac)',boxShadow:'0 0 6px var(--ac)'}}/>{newCount} nuevas</span>}
        <span className="bdg bx">{eventsCount}</span>
        <span style={{fontSize:12,color:'var(--tx3)'}}>{actOpen?'Plegar ▲':'Desplegar ▼'}</span>
      </div>
      {actOpen && (
        logs===null
          ? <div style={{textAlign:'center',color:'var(--tx3)',fontSize:12,padding:'20px 6px'}}>Sin acceso al registro de actividad.</div>
          : activity.length===0
          ? <div style={{textAlign:'center',color:'var(--tx3)',fontSize:12,padding:'20px 6px'}}>Sin actividad en el registro todavía. Cada acción del backend quedará aquí.</div>
          : <div style={{marginTop:12}}>
            {activity.slice(0,actShow).map((l,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:9,padding:'7px 0',borderBottom:'1px solid rgba(128,128,128,.08)'}}>
                <span style={{fontSize:12,flexShrink:0}}>{l.svc==='sistema'?'🧾':l.svc==='órdenes'?'📦':l.svc==='moderación'?'⚠️':'⭐'}</span>
                <span style={{flex:1,minWidth:0,fontSize:11.5,color:'var(--tx)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{l.msg}</span>
                <span style={{fontSize:9.5,color:'var(--tx3)',flexShrink:0}}>{dmy(l.at)} {hhmm(l.at)}</span>
              </div>
            ))}
            {activity.length > actShow && <button className="btn btg" style={{width:'100%',marginTop:10}} onClick={()=>setActShow(n=>n+20)}>Ver más ({activity.length-actShow} restantes)</button>}
          </div>
      )}
    </div>

    <div className="card cp">
      <div className="ch"><span className="ct">Estado de servicios</span></div>
      <div style={{fontSize:11,color:'var(--tx3)',margin:'2px 0 10px'}}>Cuando integres servicios externos (pagos, GPS, push), su estado real aparecerá aquí.</div>
      {services.map(s=><div key={s.name} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:'1px solid rgba(128,128,128,.1)'}}>
        <span style={{width:9,height:9,borderRadius:'50%',flexShrink:0,background:s.state==='ok'?'var(--gn)':'var(--tx3)',boxShadow:s.state==='ok'?'0 0 8px var(--gn)':'none'}}/>
        <span style={{flex:1,fontSize:12,fontWeight:600,color:s.state==='ok'?'var(--tx)':'var(--tx2)'}}>{s.name}</span>
        <span className={`bdg ${s.state==='ok'?'bg':'bx'}`}>{s.note}</span>
      </div>)}
    </div>
  </>;
}

/* ── NAV + APP ──────────────────────────────────────────────────────────────── */
// CIERRE DEL PANEL: solo secciones REALES arriba; lo que aún no existe va en
// "Próximamente" con pantalla honesta (sin fingir tablas ni datos).
// Secciones del panel con su LLAVE de permiso. El admin (perms="ALL") ve todas; un
// miembro del equipo ve SOLO las que tenga en "view" o "manage".
const SECTIONS=[
  { key:'dashboard',     page:'overview', group:'Principal',  icon:'◈', label:'Resumen General' },
  { key:'orders',        page:'ops',      group:'Plataforma', icon:'📦', label:'Órdenes' },
  { key:'moderation',    page:'modq',     group:'Plataforma', icon:'🛡', label:'Moderación' },
  { key:'couriers',      page:'delivery', group:'Plataforma', icon:'🛵', label:'Delivery local' },
  { key:'users',         page:'users',    group:'Plataforma', icon:'◎', label:'Usuarios' },
  { key:'verifications', page:'verif',    group:'Plataforma', icon:'🪪', label:'Verificaciones' },
  { key:'plans',         page:'plans',    group:'Plataforma', icon:'⭐', label:'Planes' },
  { key:'editor',        page:'editor',   group:'Plataforma', icon:'◐', label:'Editor Visual' },
  { key:'economy',       page:'eco',      group:'Control',    icon:'◇', label:'Economía' },
  { key:'system',        page:'sys',      group:'Control',    icon:'◉', label:'Sistema' },
];
const PAGE_TO_PERM=Object.fromEntries(SECTIONS.map(s=>[s.page,s.key]));
const TITLES={overview:'Resumen General',ops:'Órdenes',modq:'Moderación',delivery:'Delivery local',users:'Usuarios',verif:'Verificaciones',plans:'Planes',editor:'Editor Visual de Plataforma',eco:'Economía',sys:'Sistema',team:'Equipo y permisos'};
// Catalogo para la pantalla de permisos del equipo (las 10 llaves).
const PERM_CATALOG=SECTIONS.map(s=>({key:s.key,label:s.label,icon:s.icon}));

function useToast(){
  const[ts,setTs]=useState([]);
  const add=msg=>{const id=Date.now();setTs(p=>[...p,{id,msg}]);setTimeout(()=>setTs(p=>p.filter(t=>t.id!==id)),3000);};
  return{ts,add};
}

function OmniRoot({ onClose, theme = {}, zoom = 1, data = {} }){
  const[col,setCol]=useState(false);
  const[page,setPage]=useState(null);
  const[narrow,setNarrow]=useState(false);
  const[mnav,setMnav]=useState(false);
  const rootRef=useRef(null);
  useEffect(()=>{
    const el=rootRef.current; if(!el||typeof ResizeObserver==='undefined') return;
    const r=new ResizeObserver(es=>{ const w=es[0].contentRect.width; setNarrow(w<760); });
    r.observe(el); return ()=>r.disconnect();
  },[]);
  const{ts,add}=useToast();
  // ── Badges de pendientes por sección (staff_pending_counts, ya filtrado por
  // permisos en el backend). Se recarga con el realtime y al volver a la app. ──
  const[pending,setPending]=useState({});
  const loadPending=useCallback(()=>{ staffPendingCounts().then(c=>setPending(c||{})).catch(()=>setPending({})); },[]);
  useEffect(()=>{ loadPending(); },[loadPending]);
  useEffect(()=>{
    let tmr=null; const bump=()=>{ clearTimeout(tmr); tmr=setTimeout(loadPending,1200); };
    const ch=supabase.channel(`staff-pend-${Date.now()}`)
      .on("postgres_changes",{event:"*",schema:"public",table:"products"},bump)
      .on("postgres_changes",{event:"*",schema:"public",table:"courier_applications"},bump)
      .on("postgres_changes",{event:"*",schema:"public",table:"verifications"},bump)
      .on("postgres_changes",{event:"*",schema:"public",table:"plan_requests"},bump)
      .on("postgres_changes",{event:"*",schema:"public",table:"orders"},bump)
      .subscribe();
    const onVis=()=>{ if(document.visibilityState==='visible') loadPending(); };
    document.addEventListener('visibilitychange',onVis); window.addEventListener('focus',loadPending);
    return ()=>{ clearTimeout(tmr); document.removeEventListener('visibilitychange',onVis); window.removeEventListener('focus',loadPending); try{Promise.resolve(supabase.removeChannel(ch)).catch(()=>{});}catch(e){} };
  },[loadPending]);
  // ── Avisos INTELIGENTES: dos tipos, trato distinto ──────────────────────────
  // ACCIÓN REQUERIDA (moderación, verificaciones, planes, mensajeros, economía):
  //   el badge = pendientes REALES; NO baja por mirar, solo al RESOLVER.
  // INFORMATIVO (órdenes): se marca visto AL ENTRAR (last-seen por sección/usuario)
  //   y solo cuenta lo posterior.
  const INFO_SECS = { orders:1 };
  const seenKey = `retador_secseen_${data.meId||'anon'}`;
  const [seen,setSeen] = useState(()=>{ try{ return JSON.parse(localStorage.getItem(seenKey)||'{}'); }catch{ return {}; } });
  const badgeFor = (key)=>{ const c=Number(pending[key])||0; if(INFO_SECS[key]) return Math.max(0,c-(Number(seen[key])||0)); return c; };
  const markSectionSeen = (key)=>{ if(!INFO_SECS[key]) return; setSeen(prev=>{ const next={...prev,[key]:Number(pending[key])||0}; try{localStorage.setItem(seenKey,JSON.stringify(next));}catch{} return next; }); };
  // ── Permisos a la carta: "ALL" (admin) o { seccion: none|view|manage } ──
  const perms=data.perms;
  const isAdmin=perms==='ALL';
  const levelOf=(key)=> isAdmin?'manage':((perms&&typeof perms==='object'&&perms[key])||'none');
  const allowed=(key)=>{ const l=levelOf(key); return l==='view'||l==='manage'; };
  const visSecs=SECTIONS.filter(s=>allowed(s.key));
  const groups=[]; visSecs.forEach(s=>{ let g=groups.find(x=>x.sec===s.group); if(!g){g={sec:s.group,items:[]};groups.push(g);} g.items.push(s); });
  const visibleNav=groups.concat(isAdmin?[{sec:'Gestión',items:[{page:'team',icon:'◔',label:'Equipo y permisos'}]}]:[]);
  // Primera página permitida al abrir (o si cambian los permisos y la actual ya no vale).
  useEffect(()=>{
    const okNow = page!=null && (page==='team'?isAdmin:(PAGE_TO_PERM[page]?allowed(PAGE_TO_PERM[page]):true));
    if(!okNow){ setPage(isAdmin?'overview':((visSecs[0]&&visSecs[0].page)||null)); }
  },[perms]);
  const nav=(pg)=>{
    setPage(pg); setMnav(false);
    const key = PAGE_TO_PERM[pg];
    if(key) markSectionSeen(key);               // informativos (órdenes): visto al entrar
    data.onOpenQueue && data.onOpenQueue(pg);   // marca leídas las notifs de esa cola
  };
  const roFor=(pg)=>{ const k=PAGE_TO_PERM[pg]; return k?levelOf(k)==='view':false; }; // solo lectura
  const curRO=roFor(page);
  const pageAllowed = page==null ? true : (page==='team' ? isAdmin : (PAGE_TO_PERM[page] ? allowed(PAGE_TO_PERM[page]) : true));
  const dk = theme.isDark !== false;
  // Variables del panel mapeadas al tema real de la plataforma (claro/oscuro)
  const omniVars = dk
    ? { "--bg":"#080808","--bg1":"#0f0f0f","--bg2":"#141414","--bg3":"#1e1e1e","--bd":"rgba(255,255,255,0.07)","--bd2":"rgba(255,255,255,0.12)","--tx":"#f0f0f0","--tx2":"#8b8b8b","--tx3":"#5a5a5a" }
    : { "--bg":"#F0F2F5","--bg1":"#FFFFFF","--bg2":"#FFFFFF","--bg3":"#F4F5F7","--bd":"#E4E6EB","--bd2":"#D7DAE0","--tx":"#0a0a0a","--tx2":"#65676B","--tx3":"#9aa0a8" };
  const omniStyle = {
    position:"absolute", top:0, left:0, right:0, bottom:0,
    zIndex:800, overflow:"hidden", isolation:"isolate",
    "--ac":G, "--ac2":G, "--ag":"rgba(212,175,55,0.13)",
    ...omniVars,
  };
  return <div className={`omni ${narrow?'nar':''}`} ref={rootRef} style={omniStyle}>
    <style>{CSS}</style>
    <div className="shell">
      {narrow && mnav && <div className="sb-backdrop" onClick={()=>setMnav(false)}/>}
      <aside className={`sb ${!narrow&&col?'col':''} ${narrow&&mnav?'open':''}`}>
        <div className="sbl"><button className="sbback" onClick={onClose} title="Volver a la app"><span style={{fontSize:15,lineHeight:1,marginTop:-1}}>‹</span>Volver</button><span className="sbn">Panel admin</span></div>
        <nav className="sbnav">
          {visibleNav.map(g=><div key={g.sec}>
            <div className="sbg">{g.sec}</div>
            {g.items.map(item=><div key={item.page}>
              <div className={`sbi ${page===item.page?'on':''}`} onClick={()=>nav(item.page)}>
                <span className="sbic">{item.icon}</span>
                <span className="sbil">{item.label}</span>
                {item.key && badgeFor(item.key)>0 && <span style={{marginLeft:'auto',minWidth:18,height:18,borderRadius:999,background:G,color:'#000',fontSize:10.5,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',padding:'0 5px',flexShrink:0}}>{badgeFor(item.key)>99?'99+':badgeFor(item.key)}</span>}
              </div>
            </div>)}
          </div>)}
        </nav>
      </aside>
      <div className="main">
        <header className="hdr">
          <button className="htog" onClick={()=>narrow?setMnav(m=>!m):setCol(c=>!c)}>{narrow?'☰':(col?'▶':'◀')}</button>
          <div className="htit">{TITLES[page]||'Panel de administración'}</div>
          <div className="hacts">
            {curRO && <span style={{fontSize:11,fontWeight:800,color:'var(--tx2)',background:'var(--bg2)',border:'1px solid var(--bd2)',borderRadius:8,padding:'4px 10px'}}>👁 Solo lectura</span>}
          </div>
        </header>
        <div className="cnt">
          {!pageAllowed
            ? <div style={{padding:'44px 20px',textAlign:'center'}}>
                <div style={{fontSize:34,marginBottom:10,opacity:.3}}>🔒</div>
                <div className="stit">Sin acceso</div>
                <div className="ssub">No tienes acceso a esta sección.</div>
              </div>
            : <>
              {page==='overview'&&<Overview toast={add} data={data} go={nav}/>}
              {page==='ops'&&<AdminOrders toast={add} onViewProfile={data.onViewProfile}/>}
              {page==='modq'&&<ModeracionPublicaciones toast={add} onViewProfile={data.onViewProfile} ro={curRO} onResolved={loadPending}/>}
              {page==='delivery'&&<Operaciones solo="Delivery" toast={add} data={data} ro={curRO} onResolved={loadPending}/>}
              {page==='users'&&<RealUsersDirectory toast={add} meId={data.meId} ro={curRO}/>}
              {page==='verif'&&<VerificationQueue toast={add} onViewProfile={data.onViewProfile} ro={curRO} onResolved={loadPending}/>}
              {page==='plans'&&<PlanQueue toast={add} onViewProfile={data.onViewProfile} ro={curRO} onResolved={loadPending}/>}
              {page==='editor'&&(curRO
                ? <fieldset disabled style={{border:'none',padding:0,margin:0,minWidth:0}}>
                    <div style={{margin:'0 0 12px',padding:'10px 14px',borderRadius:10,background:'var(--bg2)',border:'1px solid var(--bd2)',fontSize:12,fontWeight:700,color:'var(--tx2)'}}>👁 Solo lectura — sin permiso para modificar ni publicar.</div>
                    {/* fieldset[disabled] deshabilita de forma nativa TODOS los inputs, selects y botones del editor. */}
                    <EditorVisual toast={add} cfg={data.cfg} onCfg={()=>add('👁 Solo lectura — no puedes publicar')}/>
                  </fieldset>
                : <EditorVisual toast={add} cfg={data.cfg} onCfg={data.onPublishBlocks}/>)}
              {page==='eco'&&<Economia toast={add} data={data} ro={curRO}/>}
              {page==='sys'&&<Sistema toast={add} data={data}/>}
              {page==='team'&&<TeamScreen toast={add} meId={data.meId} onViewProfile={data.onViewProfile}/>}
            </>}
        </div>
      </div>
    </div>
    <div className="twrap">
      {ts.map(t=><div className="tst" key={t.id}><span style={{fontSize:15,color:'#19C37D'}}>✓</span><span style={{fontSize:12.5,fontWeight:600}}>{t.msg}</span></div>)}
    </div>
  </div>;
}

  return OmniRoot;
})();
export default OmniPanel;
