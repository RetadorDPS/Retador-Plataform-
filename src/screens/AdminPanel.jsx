import { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo, memo } from "react";
import { G, systemRating, systemReviews, useCatalog, Avatar, avatarUrlOf, money, supabase, adminDashboardStats, adminListUsers, adminSetVerified, adminSetSuspended, getSellerProductCount, adminListProducts, adminModerateProduct, getProfilesByIds, adminListVerifications, adminReviewVerification, kycSignedUrl, adminListPlanRequests, adminReviewPlan, adminListPlanLimits, adminUpdatePlanLimit, adminListOrders, adminListAdmins, adminListLogs, getAuditLog, adminListPromoted, adminSetPromoted, listLedger, adminMarkCommissionPaid, adminListStaff, adminGrantStaff, adminRevokeStaff, staffPendingCounts, getMyVerification, adminGetProfileById, sendMessage, getOnboardingStats, adminCategoryImpact, adminSubcategoryImpact, adminUpsertCategory, adminDeleteCategory, adminUpsertSubcategory, adminDeleteSubcategory, adminReorderCategories, getPromoSettings, adminUpdatePromoSettings, CJ_COUNTRIES, catalogProSearch, catalogProQuotaStatus, catalogProPreview, catalogProImport, catalogProListStaging, catalogProUpdateVariantPricing, catalogProUpdateStagingRegions, catalogProPublish, catalogProListPublished, catalogProCalculateShipping, catalogProDeleteStaging, catalogProArchivePublished, catalogProPendingFulfillment, catalogProAdvanceFulfillment, getOrderStatusMap, pushBackHandler } from "../shared/index.js";
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

function CategoryManager({ toast }){
  // Ronda 6, punto G: esto ANTES solo tocaba estado local + localStorage
  // (useCatalog) — parecía funcionar pero nunca escribía en el backend real:
  // cada admin veía SU PROPIO catálogo inventado, nadie más lo veía, y se
  // perdía al borrar el caché. Ahora cada acción llama de verdad a Supabase
  // (admin_upsert_category / admin_delete_category / …) y refetch() trae el
  // dato real de vuelta — lo que se guarda aquí es lo que ve TODO el mundo.
  const {cats, subcats, refetch} = useCatalog();
  const [sel,setSel]=useState(null);
  const [newCat,setNewCat]=useState('');
  const [newColor,setNewColor]=useState('#A78BFA');
  const [newSub,setNewSub]=useState('');
  const [edit,setEdit]=useState(null);       // {kind:'cat'|'sub', id, sub, value}
  const [confirm,setConfirm]=useState(null); // {kind, id, sub, name, impact:null|n}
  const [busy,setBusy]=useState(false);
  const dragFrom=useRef(null);
  const [dragOver,setDragOver]=useState(null);
  const SW=['#A78BFA','#60A5FA','#E879F9','#4ADE80','#FBBF24','#F87171','#F472B6','#38BDF8','#2DD4BF','#FB7185','#22C55E','#F59E0B','#8B5CF6','#FB923C','#34D399','#94A3B8'];
  const inpStyle={background:'var(--bg)',border:'1px solid var(--bd)',borderRadius:8,padding:'9px 11px',color:'var(--tx)',fontSize:12.5,outline:'none',minWidth:0};
  const iconBtn={background:'none',border:'none',cursor:'pointer',fontSize:13,color:'var(--tx2)',flexShrink:0,padding:'0 2px'};
  const emsg = e => e?.message || 'No se pudo (sin mensaje del backend)';
  const startEdit=(kind,id,sub)=>setEdit({kind,id,sub,value:kind==='cat'?(cats.find(c=>c.id===id)?.name||''):sub});
  const commitEdit=async()=>{
    if(!edit)return; const v=(edit.value||'').trim(); const e=edit; setEdit(null);
    if(!v)return;
    try{
      if(e.kind==='cat') await adminUpsertCategory(e.id, v);
      else await adminUpsertSubcategory(e.id, v, e.sub);
      await refetch();
    }catch(err){ toast?.('⚠️ '+emsg(err)); }
  };
  const slugify = (name) => (name||'').toLowerCase().replace(/[^a-z0-9áéíóúñ]+/gi,'-').replace(/^-|-$/g,'') || ('cat'+Date.now());
  const doAddCat = async () => {
    const name = newCat.trim(); if(!name || busy) return;
    const id = slugify(name);
    if (cats.some(c=>c.id===id)) { toast?.('⚠️ Ya existe una categoría con ese nombre'); return; }
    setBusy(true);
    try { await adminUpsertCategory(id, name, newColor); await refetch(); setNewCat(''); }
    catch(err){ toast?.('⚠️ '+emsg(err)); }
    setBusy(false);
  };
  const doAddSub = async (catId) => {
    const name = newSub.trim(); if(!name || busy) return;
    setBusy(true);
    try { await adminUpsertSubcategory(catId, name); await refetch(); setNewSub(''); }
    catch(err){ toast?.('⚠️ '+emsg(err)); }
    setBusy(false);
  };
  // Antes de mostrar "¿eliminar?" pregunta al backend cuántos productos reales
  // usan esta categoría/subcategoría — si hay alguno, el diálogo pide elegir a
  // dónde reasignarlos (nunca borra a ciegas dejando productos huérfanos).
  const askDelete = async (kind, id, sub, name) => {
    setConfirm({ kind, id, sub, name, impact: null, reassignTo: '' });
    const n = kind==='cat' ? await adminCategoryImpact(id) : await adminSubcategoryImpact(id, sub);
    setConfirm(c => c && c.kind===kind && c.id===id && c.sub===sub ? { ...c, impact: n } : c);
  };
  const doDelete = async () => {
    if (!confirm || busy) return;
    const { kind, id, sub, impact, reassignTo } = confirm;
    if (impact > 0 && !reassignTo) return; // el botón ya queda deshabilitado, doble resguardo
    setBusy(true);
    try {
      if (kind==='cat') await adminDeleteCategory(id, impact>0 ? reassignTo : null);
      else await adminDeleteSubcategory(id, sub, impact>0 ? reassignTo : null);
      await refetch();
      if (kind==='cat' && sel===id) setSel(null);
      setConfirm(null);
    } catch(err){ toast?.('⚠️ '+emsg(err)); }
    setBusy(false);
  };
  const doReorder = async (from, to) => {
    if (from==null || to==null || from===to) return;
    const ids = cats.map(c=>c.id); const [m] = ids.splice(from,1); ids.splice(to,0,m);
    try { await adminReorderCategories(ids); await refetch(); }
    catch(err){ toast?.('⚠️ '+emsg(err)); }
  };
  return (
    <div style={{maxWidth:440,margin:'0 auto',width:'100%'}}>
      <div style={{fontSize:13,fontWeight:800,color:'var(--tx)',marginBottom:5}}>Categorías de la plataforma</div>
      <div style={{fontSize:11,color:'var(--tx2)',marginBottom:14,lineHeight:1.5}}>Arrastra (⠿) para ordenar. Toca una para editar sus subcategorías. Todo se refleja en la tienda, la búsqueda y al publicar — de verdad, para todo el mundo.</div>
      <div style={{background:'var(--bg2)',border:'1px solid var(--bd)',borderRadius:11,padding:12,marginBottom:14}}>
        <div style={{display:'flex',gap:8,marginBottom:9}}>
          <input value={newCat} onChange={e=>setNewCat(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')doAddCat();}} placeholder="Nueva categoría" style={{...inpStyle,flex:1}}/>
          <button className="btn btp sm" disabled={busy} onClick={doAddCat}>Agregar</button>
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
              onDrop={()=>{ doReorder(dragFrom.current, idx); dragFrom.current=null; setDragOver(null); }}
              onDragEnd={()=>{dragFrom.current=null;setDragOver(null);}}
              style={{background:'var(--bg2)',border:`1px solid ${dragOver===idx?'var(--ac)':'var(--bd)'}`,borderRadius:11,overflow:'hidden',transition:'border .15s'}}>
              <div style={{display:'flex',alignItems:'center',gap:9,padding:'10px 12px'}}>
                <span style={{cursor:'grab',color:'var(--tx3)',fontSize:15,flexShrink:0,lineHeight:1}} title="Arrastrar para ordenar">⠿</span>
                <div style={{width:13,height:13,borderRadius:'50%',background:c.color,flexShrink:0}}/>
                {isEditingCat
                  ? <input autoFocus value={edit.value} onChange={e=>setEdit({...edit,value:e.target.value})} onKeyDown={e=>{if(e.key==='Enter')commitEdit();if(e.key==='Escape')setEdit(null);}} onBlur={commitEdit} style={{...inpStyle,flex:1}}/>
                  : <span onClick={()=>setSel(isSel?null:c.id)} style={{flex:1,fontSize:13,fontWeight:600,color:'var(--tx)',cursor:'pointer',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',minWidth:0}}>{c.name} <span style={{fontSize:10,color:'var(--tx3)',fontWeight:500}}>· {subs.length} sub</span></span>}
                <button onClick={()=>startEdit('cat',c.id)} title="Renombrar" style={iconBtn}>✎</button>
                <button onClick={()=>askDelete('cat',c.id,null,c.name)} title="Eliminar" style={{...iconBtn,color:'var(--rd)'}}>✕</button>
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
                            <span onClick={()=>askDelete('sub',c.id,s,s)} style={{cursor:'pointer',color:'var(--rd)',fontWeight:800}}>×</span>
                          </span>;
                    })}
                  </div>
                  <div style={{display:'flex',gap:7}}>
                    <input value={isSel?newSub:''} onChange={e=>setNewSub(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')doAddSub(c.id);}} placeholder="+ subcategoría" style={{...inpStyle,flex:1,fontSize:11,padding:'7px 9px'}}/>
                    <button className="btn btg sm" disabled={busy} onClick={()=>doAddSub(c.id)}>Añadir</button>
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
            {confirm.impact===null ? (
              <div style={{fontSize:12,color:'var(--tx3)',marginBottom:16}}>Revisando productos reales…</div>
            ) : confirm.impact>0 ? (<>
              <div style={{fontSize:12,color:'var(--tx2)',lineHeight:1.5,marginBottom:10}}><b style={{color:'var(--tx)'}}>{confirm.name}</b> tiene <b style={{color:'var(--yw)'}}>{confirm.impact} producto{confirm.impact===1?'':'s'} real{confirm.impact===1?'':'es'}</b>. Elige a dónde se mueven antes de borrar:</div>
              <select value={confirm.reassignTo} onChange={e=>setConfirm(c=>({...c,reassignTo:e.target.value}))} style={{...inpStyle,width:'100%',marginBottom:16}}>
                <option value="">Elige {confirm.kind==='cat'?'categoría':'subcategoría'} destino…</option>
                {confirm.kind==='cat'
                  ? cats.filter(c=>c.id!==confirm.id).map(c=><option key={c.id} value={c.id}>{c.name}</option>)
                  : (subcats[confirm.id]||[]).filter(s=>s!==confirm.sub).map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </>) : (
              <div style={{fontSize:12,color:'var(--tx2)',lineHeight:1.5,marginBottom:16}}>Vas a eliminar <b style={{color:'var(--tx)'}}>{confirm.name}</b>{confirm.kind==='cat'?' y todas sus subcategorías':''}. Sin productos reales afectados.</div>
            )}
            <div style={{display:'flex',gap:9}}>
              <button className="btn btg" style={{flex:1,justifyContent:'center'}} onClick={()=>setConfirm(null)}>Cancelar</button>
              <button className="btn" disabled={busy || confirm.impact===null || (confirm.impact>0 && !confirm.reassignTo)} style={{flex:1,justifyContent:'center',background:'var(--rd)',color:'#fff',opacity:(busy||confirm.impact===null||(confirm.impact>0&&!confirm.reassignTo))?.5:1}} onClick={doDelete}>Eliminar</button>
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

function EditorVisual({ toast, cfg = {}, onCfg, onHomeCfg, roHome }) {
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
  // "bienvenida" es una pantalla especial (no lleva banners): edita config.home.
  const isWelcome = screen === "bienvenida";
  const isScreen = screen !== "library" && !isWelcome;
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
              <div className={`ve-area ${isWelcome ? "on" : ""}`} onClick={() => { setScreen("bienvenida"); setSel(null); }}>
                <span className="ve-ai">🏠</span>
                <span className="ve-al">Pantalla de bienvenida</span>
              </div>
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
                {isWelcome ? "🏠 Pantalla de bienvenida" : isScreen ? (SCREENS.find(s => s.id === screen) || {}).label : "📚 Contenido guardado"}
              </span>
              <span className="bdg bg" style={{ fontSize: 8, flexShrink: 0 }}>LIVE</span>
            </div>
            {screen === "busqueda" && <button className="btn btg sm" onClick={() => setShowCats(true)} style={{ flexShrink: 0, fontSize: 11, padding: "4px 9px" }}>◎ Categorías</button>}
            {isScreen && <button className="btn btp sm" onClick={() => setAddOpen(true)} style={{ flexShrink: 0, fontSize: 11, padding: "4px 11px" }}>+ Añadir</button>}
          </div>

          <div className="ve-canvas-scroll">
            <div className="ve-frame" style={{ maxWidth: 430 }}>
              {isWelcome ? (
                <HomeScreenEditor cfg={cfg} onCfg={onHomeCfg} ro={roHome} toast={toast} />
              ) : isScreen ? (
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
            <CategoryManager toast={toast} />
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
  const [obStats, setObStats] = useState(null);
  const load = useCallback(() => {
    setLoading(true);
    adminDashboardStats().then(s => { setStats(s); setLoading(false); }).catch(() => { setStats(null); setLoading(false); });
    getOnboardingStats().then(setObStats).catch(() => setObStats(null));
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

          <Head>📊 Onboarding <span style={{ fontWeight:500, fontSize:10, color:'var(--tx3)' }}>(solo lectura · no afecta la app)</span></Head>
          <div className="card cp mb16">
            {!obStats
              ? <div style={{ textAlign:'center', color:'var(--tx3)', fontSize:12, padding:'12px 0' }}>Cargando…</div>
              : (() => {
                  const total = n(obStats.total_completado);
                  // BUG REAL encontrado y corregido (reportado por el dueño: un 700% en
                  // "Sin decir"): cada grupo (por_pais/por_provincia/por_intencion) cuenta
                  // TODOS los perfiles con ese valor, no solo los que ya completaron el
                  // onboarding — dividir su cuenta entre total_completado inflaba el
                  // porcentaje muy por encima de 100%. El % correcto es la parte que
                  // representa dentro de SU PROPIO grupo (reparte 100% entre sus miembros).
                  const paisLabel = { cuba: "Cuba", espana: "España", eeuu: "Estados Unidos", sin_decir: "Sin decir" };
                  const Grupo = ({ titulo, datos, etiqueta }) => {
                    const entradas = Object.entries(datos || {}).sort((a, b) => n(b[1]) - n(a[1]));
                    if (!entradas.length) return null;
                    const grupoTotal = entradas.reduce((acc, [, v]) => acc + n(v), 0);
                    return (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontSize:10.5, fontWeight:800, color:'var(--tx2,#aaa)', marginBottom:6 }}>{titulo}</div>
                        <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                          {entradas.map(([k, v]) => {
                            const cnt = n(v);
                            const pct = grupoTotal > 0 ? Math.round((cnt / grupoTotal) * 100) : 0;
                            return (
                              <div key={k} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:11.5 }}>
                                <span style={{ color:'var(--tx1)', fontWeight:600 }}>{etiqueta ? etiqueta(k) : k}</span>
                                <span style={{ color:'var(--tx3)' }}>{num(cnt)} · {pct}%</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  };
                  return <>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{ fontSize:12, fontWeight:700, color:'var(--tx2,#aaa)' }}>Total completaron el onboarding</span>
                      <span style={{ fontSize:16, fontWeight:800, color:G }}>{num(total)}</span>
                    </div>
                    <Grupo titulo="Por país (todos los perfiles)" datos={obStats.por_pais} etiqueta={k => paisLabel[k] || k} />
                    <Grupo titulo="Por provincia (Cuba)" datos={obStats.por_provincia} />
                    <Grupo titulo="Por intención (quienes completaron)" datos={obStats.por_intencion} />
                  </>;
                })()}
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
  const [couZoom, setCouZoom] = useState(null);
  const [couRejectFor, setCouRejectFor] = useState(null);
  const [couReason, setCouReason] = useState("");
  const couAct = (id, status, reason) => { data.onCourierAction && data.onCourierAction(id, status, reason); onResolved && onResolved(); };
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
                <div style={{width:42,height:42,borderRadius:10,overflow:'hidden',background:'var(--bg2)',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>🛵</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,color:'var(--tx)',fontSize:13,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{c.fullName||c.nombre||c.userName}</div>
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
              <div style={{width:34,height:34,borderRadius:9,overflow:'hidden',background:'var(--bg2)',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15}}>🛵</div>
              <div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,color:'var(--tx)',fontSize:12.5}}>{c.fullName||c.nombre||c.userName}</div><div style={{fontSize:10,color:'var(--tx3)'}}>{c.vehiculo} · {c.zona||'—'}</div></div>
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
          <div style={{width:54,height:54,borderRadius:12,overflow:'hidden',background:'var(--bg2)',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>🛵</div>
          <div style={{flex:1,minWidth:0}}><div style={{fontWeight:800,color:'var(--tx)',fontSize:15}}>{couView.fullName||couView.nombre||couView.userName}</div><div style={{fontSize:11,color:'var(--tx3)'}}>{couView.telefono} · {couView.zona}</div></div>
          {data.onViewProfile && couView.userId && <button className="btn sm" onClick={()=>{ data.onViewProfile(couView.userId); setCouView(null); }}>Ver perfil completo</button>}
        </div>
        {(()=>{ const rows=[['Documento',`${couView.docType||'—'} · ${couView.docNumber||'—'}`],['Zona',couView.zona||'—'],['Transporte',couView.vehiculo||'—'],['Enviada',couView.createdAt?new Date(couView.createdAt).toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'}):'—']];
          return <div style={{background:'var(--bg)',borderRadius:10,border:'1px solid var(--bd)',padding:'4px 12px',marginBottom:12}}>
            {rows.map(([k,v])=><div key={k} style={{display:'flex',justifyContent:'space-between',gap:12,padding:'7px 0',borderBottom:'1px solid var(--bd)',fontSize:11.5}}><span style={{color:'var(--tx3)'}}>{k}</span><span style={{color:'var(--tx)',fontWeight:600,textAlign:'right'}}>{v}</span></div>)}
          </div>; })()}
        <div style={{fontSize:11,fontWeight:700,color:'var(--tx3)',marginBottom:7}}>Verificación de identidad — mismo nivel que verificar perfil</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:7,marginBottom:14}}>
          {[['Frente',couView.docFront],['Reverso',couView.docBack],['Selfie',couView.selfie]].map(([lbl,p])=>(
            <KycPhoto key={lbl} label={lbl} path={p} onZoom={setCouZoom} />
          ))}
        </div>
        <div style={{fontSize:10,color:'var(--tx3)',background:'var(--bg)',borderRadius:9,padding:'9px 11px',marginBottom:12,lineHeight:1.5}}>Compara la selfie con la foto del documento antes de decidir.</div>
        {ro
          ? <div style={{textAlign:'center',fontSize:11,color:'var(--tx3)'}}>👁 Solo lectura</div>
          : <div className="mact">
          <button className="btn btd sm" onClick={()=>{ setCouReason(''); setCouRejectFor(couView); setCouView(null); }}>Rechazar</button>
          <button className="btn btp sm" onClick={()=>{couAct(couView.id,'approved');toast('✅ Mensajero aprobado — su perfil también queda verificado');setCouView(null);}}>Aprobar mensajero</button>
        </div>}
      </div>
    </div>}
    {couZoom && <div className="mo" onClick={()=>setCouZoom(null)} style={{zIndex:6000}}>
      <img src={couZoom} alt="" onClick={e=>e.stopPropagation()} style={{maxWidth:'92vw',maxHeight:'88vh',borderRadius:10,objectFit:'contain'}}/>
    </div>}
    {couRejectFor && <div className="mo" onClick={()=>setCouRejectFor(null)}>
      <div className="mb" onClick={e=>e.stopPropagation()} style={{maxWidth:380}}>
        <div className="mt">Rechazar solicitud de mensajero</div>
        <textarea value={couReason} onChange={e=>setCouReason(e.target.value)} rows={3} placeholder="Motivo (opcional, se le muestra a la persona)…" style={{width:'100%',boxSizing:'border-box',background:'var(--bg3,#12151f)',border:'1px solid var(--bd2,#222)',borderRadius:10,padding:'10px 12px',color:'var(--tx)',fontSize:13,outline:'none',resize:'none',margin:'6px 0 12px'}}/>
        <div className="mact">
          <button className="btn btg sm" onClick={()=>setCouRejectFor(null)}>Cancelar</button>
          <button className="btn btd sm" onClick={()=>{ const c=couRejectFor; const why=couReason.trim(); setCouRejectFor(null); couAct(c.id,'rejected',why||null); toast('Solicitud rechazada'); }}>Rechazar</button>
        </div>
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
// ── USUARIOS (con pestañas) — UNA sola fuente, la ficha es el ÚNICO sitio de acción ──
// Pestañas: 👥 Todos · 🪪 Verificaciones pendientes · ⭐ Solicitudes de plan. Las filas
// abren la FICHA del usuario; ahí viven TODAS las acciones (verificar/plan/suspender).
function UsersHub({ toast, meId, access = {}, onResolved, onViewProfile, onOpenChat, initialTab = 'all' }){
  const PAGE = 20;
  const lvl = (k) => access[k] || 'none';
  const canUsers = lvl('users') !== 'none', canVerif = lvl('verif') !== 'none', canPlans = lvl('plans') !== 'none';
  const mngUsers = lvl('users') === 'manage', mngVerif = lvl('verif') === 'manage', mngPlans = lvl('plans') === 'manage';
  // "Compartir" (Pro gratis, via=compartir) vive en la MISMA tabla plan_requests
  // y se resuelve con el MISMO admin_review_plan — reutiliza el permiso 'plans'.
  const canShares = canPlans, mngShares = mngPlans;
  const TABS = [
    canUsers && { k:'all',   label:'👥 Todos' },
    canVerif && { k:'verif', label:'🪪 Verificaciones' },
    canPlans && { k:'plans', label:'⭐ Planes' },
    canShares && { k:'shares', label:'📤 Compartir' },
  ].filter(Boolean);
  const [tab, setTab] = useState((TABS.find(t=>t.k===initialTab)||TABS[0]||{k:'all'}).k);
  useEffect(()=>{ if(TABS.some(t=>t.k===initialTab)) setTab(initialTab); }, [initialTab]);

  // Directorio (Todos)
  const [q,setQ]=useState(""); const [dq,setDq]=useState(""); const [page,setPage]=useState(0);
  const [rows,setRows]=useState([]); const [loading,setLoading]=useState(true); const [hasMore,setHasMore]=useState(false);
  useEffect(()=>{ const t=setTimeout(()=>setDq(q),350); return ()=>clearTimeout(t); },[q]);
  useEffect(()=>{
    if(tab!=='all') return;
    let alive=true; setLoading(true); const from=page*PAGE;
    adminListUsers({query:dq,from,to:from+PAGE-1}).then(d=>{ if(!alive)return; setRows(d); setHasMore(d.length===PAGE); setLoading(false); }).catch(()=>{ if(alive){setRows([]);setLoading(false);} });
    return ()=>{ alive=false; };
  },[dq,page,tab]);

  // Colas pendientes (verificaciones y planes) + nombres/perfiles
  const [verifs,setVerifs]=useState(null);
  const [plans,setPlans]=useState(null);
  const [shares,setShares]=useState(null);
  const [names,setNames]=useState({});
  const loadVerifs=useCallback(()=>{ if(!canVerif){ setVerifs([]); return; } adminListVerifications({status:'pending',from:0,to:49}).then(async d=>{ setVerifs(d); const m=await getProfilesByIds(d.map(v=>v.user_id)).catch(()=>({})); setNames(p=>({...p,...m})); }).catch(()=>setVerifs([])); },[canVerif]);
  const loadPlans=useCallback(()=>{ if(!canPlans){ setPlans([]); return; } adminListPlanRequests({status:'pending',from:0,to:49}).then(async d=>{ setPlans(d); const m=await getProfilesByIds(d.map(r=>r.user_id)).catch(()=>({})); setNames(p=>({...p,...m})); }).catch(()=>setPlans([])); },[canPlans]);
  const loadShares=useCallback(()=>{ if(!canShares){ setShares([]); return; } adminListPlanRequests({status:'pending',from:0,to:49,via:'compartir'}).then(async d=>{ setShares(d); const m=await getProfilesByIds(d.map(r=>r.user_id)).catch(()=>({})); setNames(p=>({...p,...m})); }).catch(()=>setShares([])); },[canShares]);
  useEffect(()=>{ loadVerifs(); },[loadVerifs]);
  useEffect(()=>{ loadPlans(); },[loadPlans]);
  useEffect(()=>{ loadShares(); },[loadShares]);
  // Realtime: las colas se refrescan cuando alguien (del staff) resuelve algo.
  useEffect(()=>{
    const ch=supabase.channel(`usershub-${Date.now()}`)
      .on("postgres_changes",{event:"*",schema:"public",table:"verifications"},()=>loadVerifs())
      .on("postgres_changes",{event:"*",schema:"public",table:"plan_requests"},()=>{ loadPlans(); loadShares(); })
      .subscribe();
    return ()=>{ try{Promise.resolve(supabase.removeChannel(ch)).catch(()=>{});}catch(e){} };
  },[loadVerifs,loadPlans,loadShares]);

  // Chip 🛡️ Equipo
  const [staffIds,setStaffIds]=useState(()=>new Set());
  useEffect(()=>{ adminListStaff().then(list=>setStaffIds(new Set((list||[]).map(m=>m.user_id)))).catch(()=>{}); },[]);

  // ── Ficha (ÚNICO sitio de acción) ──
  const [sel,setSel]=useState(null);
  const [selVerif,setSelVerif]=useState(undefined); // undefined=cargando · null=ninguna · obj
  const [selPlan,setSelPlan]=useState(null);
  const [selCount,setSelCount]=useState(null);
  const [busy,setBusy]=useState(null);
  const [zoom,setZoom]=useState(null);
  const [rejectFor,setRejectFor]=useState(null);
  const [reason,setReason]=useState("");
  const [suspendFor,setSuspendFor]=useState(null);
  const [susReason,setSusReason]=useState("");

  const nmeOf = u => (u && (u.full_name || u.email)) || "Usuario";
  const emsg = e => e?.message || e?.details || e?.hint || "No se pudo (sin mensaje del backend)";
  const openSheet = async (u, plan=null) => {
    setSel(u); setSelVerif(undefined); setSelPlan(plan); setSelCount(null); setZoom(null);
    adminGetProfileById(u.id).then(p=>{ if(p) setSel(s=> s&&s.id===u.id ? {...s,...p} : s); }).catch(()=>{});
    getMyVerification(u.id).then(v=>setSelVerif(v||null)).catch(()=>setSelVerif(null));
    if(!plan && canPlans){ const pr=(plans||[]).find(r=>r.user_id===u.id) || (shares||[]).find(r=>r.user_id===u.id); if(pr) setSelPlan(pr); }
    const c=await getSellerProductCount(u.id).catch(()=>0); setSelCount(c);
  };
  const closeSheet = () => { setSel(null); setSelVerif(undefined); setSelPlan(null); };
  const afterChange = () => { loadVerifs(); loadPlans(); loadShares(); onResolved && onResolved(); };

  const approveVerif = async (v) => { setBusy('v'); try{ await adminReviewVerification(v.id,true); toast('✓ Perfil verificado'); setSel(s=>s?{...s,is_verified:true}:s); setSelVerif({...v,status:'approved'}); afterChange(); }catch(e){ toast('⚠️ '+emsg(e)); } setBusy(null); };
  const rejectVerif = async () => { const v=rejectFor; const why=reason.trim(); setRejectFor(null); setBusy('v'); try{ await adminReviewVerification(v.id,false,why||null); toast('🚫 Solicitud de verificación de perfil rechazada'); setSelVerif({...v,status:'rejected',reject_reason:why}); afterChange(); }catch(e){ toast('⚠️ '+emsg(e)); } setBusy(null); };
  const removeVerif = async () => { setBusy('v'); try{ await adminSetVerified(sel.id,false); toast('Verificación de perfil retirada'); setSel(s=>s?{...s,is_verified:false}:s); afterChange(); }catch(e){ toast('⚠️ '+emsg(e)); } setBusy(null); };
  const decidePlan = async (approve) => { const r=selPlan; setBusy('p'); try{ await adminReviewPlan(r.id,approve); toast(approve?`✅ Plan ${r.plan} aprobado`:'Solicitud de plan rechazada'); setSelPlan(null); afterChange(); }catch(e){ toast('⚠️ '+emsg(e)); } setBusy(null); };
  const doSuspend = async (u,suspended,why) => { setBusy('s'); try{ await adminSetSuspended(u.id,suspended,why||null); toast(suspended?`⛔ ${nmeOf(u)} suspendido`:`✅ ${nmeOf(u)} reactivado`); setSel(s=>s?{...s,is_suspended:suspended}:s); }catch(e){ toast('⚠️ '+emsg(e)); } setBusy(null); };
  const confirmSuspend = async () => { const u=suspendFor; setSuspendFor(null); await doSuspend(u,true,susReason.trim()); };

  // Mensaje directo desde la ficha (Planes/Verificaciones): abre el chat real y
  // deja el primer mensaje con una mini-tarjeta (messages.meta) indicando a qué
  // solicitud corresponde, para coordinar manualmente (pago, foto, motivo…).
  // Deja la estructura lista para cuando existan métodos de pago reales.
  const sendReqMessage = async (u, title, subtitle) => {
    if (!meId || !onOpenChat) return;
    setBusy('m');
    try {
      await sendMessage(meId, u.id, "Hola, te escribo por tu solicitud 👋", { type: "admin_request", title, subtitle });
      onOpenChat(u.id, nmeOf(u));
    } catch (e) { toast('⚠️ ' + emsg(e)); }
    setBusy(null);
  };

  const chips = (u) => (
    <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
      {u.role === 'admin'   && <span className="bdg by">👑 Administrador</span>}
      {u.role !== 'admin' && staffIds.has(u.id) && <span className="bdg bp">🛡️ Equipo</span>}
      {u.role === 'courier' && <span className="bdg bb">Mensajero</span>}
      {u.plan && u.plan !== 'gratis' && <span className="bdg bx">{u.plan}</span>}
      {u.is_verified && <span className="bdg" style={{ background:'rgba(255,192,30,.14)', color:G }}>✓ Perfil verificado</span>}
      {u.is_suspended && <span className="bdg br">⛔ Suspendido</span>}
    </div>
  );

  const fieldRow = (label, node) => (<div style={{display:'flex',justifyContent:'space-between',gap:12,padding:'6px 0',borderBottom:'1px solid var(--bd)'}}><span style={{fontSize:12,color:'var(--tx3)'}}>{label}</span><span style={{fontSize:12,fontWeight:600,textAlign:'right'}}>{node}</span></div>);

  return (
    <div className="card cp">
      <div className="ch"><span className="ct">Usuarios</span></div>
      <div className="tabs" style={{ maxWidth:360, marginBottom:10 }}>
        {TABS.map(t=>{
          const cnt = t.k==='verif' ? (verifs?verifs.length:null) : t.k==='plans' ? (plans?plans.length:null) : t.k==='shares' ? (shares?shares.length:null) : null;
          return <div key={t.k} className={`tab ${tab===t.k?'on':''}`} onClick={()=>setTab(t.k)} style={{display:'flex',alignItems:'center',gap:5,justifyContent:'center'}}>
            {t.label}{cnt>0 && <span style={{minWidth:16,height:16,borderRadius:999,background:G,color:'#000',fontSize:9.5,fontWeight:800,display:'inline-flex',alignItems:'center',justifyContent:'center',padding:'0 4px'}}>{cnt}</span>}
          </div>;
        })}
      </div>

      {/* ── Pestaña TODOS ── */}
      {tab==='all' && <>
        <div style={{ fontSize:11, color:'var(--tx3)', margin:'0 0 10px' }}>Perfiles reales de la plataforma. Toca una fila para su ficha (ahí verificas, apruebas planes o suspendes).</div>
        <input value={q} onChange={e => { setQ(e.target.value); setPage(0); }} placeholder="Buscar por nombre o email…"
          style={{ width:'100%', boxSizing:'border-box', background:'var(--bg3,#12151f)', border:'1px solid var(--bd2,#222)', borderRadius:10, padding:'10px 12px', color:'var(--tx)', fontSize:13, outline:'none', marginBottom:10 }} />
        {loading
          ? <div style={{ textAlign:'center', color:'var(--tx3)', fontSize:12, padding:'24px 6px' }}>Cargando usuarios…</div>
          : rows.length === 0
            ? <div style={{ textAlign:'center', color:'var(--tx3)', fontSize:12, padding:'24px 6px' }}>{dq ? 'Nadie coincide con la búsqueda.' : 'Aún no hay usuarios.'}</div>
            : rows.map(u => (
              <div key={u.id} onClick={() => openSheet(u)} className="reprow"
                style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 8px', margin:'0 -8px', borderRadius:9, cursor:'pointer', borderBottom:'1px solid rgba(128,128,128,.1)', background: u.is_suspended ? 'rgba(224,82,82,.05)' : undefined }}>
                <Avatar url={avatarUrlOf(u.avatar_url)} name={nmeOf(u)} size={38} verified={!!u.is_verified} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12.5, fontWeight:700, color:'var(--tx)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{nmeOf(u)}{u.id === meId && <span style={{ color:'var(--tx3)', fontWeight:500 }}> · tú</span>}</div>
                  <div style={{ fontSize:11, color:'var(--tx3)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{u.email || '—'}</div>
                  <div style={{ marginTop:4 }}>{chips(u)}</div>
                </div>
                <span style={{ fontSize:16, color:'var(--tx3)', flexShrink:0 }}>›</span>
              </div>
            ))}
        {!loading && (page > 0 || hasMore) && (
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10 }}>
            <button className="btn sm" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))} style={{ opacity: page === 0 ? .4 : 1 }}>‹ Anterior</button>
            <span style={{ fontSize:11, color:'var(--tx3)' }}>Página {page + 1}</span>
            <button className="btn sm" disabled={!hasMore} onClick={() => setPage(p => p + 1)} style={{ opacity: hasMore ? 1 : .4 }}>Siguiente ›</button>
          </div>
        )}
      </>}

      {/* ── Pestaña VERIFICACIONES pendientes ── */}
      {tab==='verif' && <>
        <div style={{ fontSize:11, color:'var(--tx3)', margin:'0 0 10px' }}>Solicitudes de verificación de perfil. Toca una para revisar documentos y decidir en su ficha.</div>
        {verifs===null ? <div style={{textAlign:'center',color:'var(--tx3)',fontSize:12,padding:'22px 6px'}}>Cargando…</div>
          : verifs.length===0 ? <div style={{textAlign:'center',color:'var(--tx3)',fontSize:12,padding:'22px 6px'}}>Sin solicitudes pendientes.</div>
          : verifs.map(v=>{ const pr=names[v.user_id]; return (
            <div key={v.id} onClick={()=>openSheet({ id:v.user_id, full_name:v.full_name||pr?.full_name, avatar_url:pr?.avatar_url })} className="reprow" style={{display:'flex',alignItems:'center',gap:10,padding:'10px 8px',margin:'0 -8px',borderRadius:9,cursor:'pointer',borderBottom:'1px solid rgba(128,128,128,.1)'}}>
              <Avatar url={avatarUrlOf(pr?.avatar_url)} name={v.full_name||pr?.full_name||'Usuario'} size={38} />
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12.5,fontWeight:700,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{v.full_name||pr?.full_name||'Usuario'}</div>
                <div style={{fontSize:11,color:'var(--tx3)'}}>{v.doc_type||'—'} · {v.doc_number||'—'} · {v.created_at?new Date(v.created_at).toLocaleDateString('es-ES',{day:'2-digit',month:'short'}):''}</div>
                <div style={{marginTop:4}}><span className="bdg by">🕐 Pendiente</span></div>
              </div>
              <span style={{fontSize:16,color:'var(--tx3)',flexShrink:0}}>›</span>
            </div>
          ); })}
      </>}

      {/* ── Pestaña PLANES pendientes ── */}
      {tab==='plans' && <>
        <div style={{ fontSize:11, color:'var(--tx3)', margin:'0 0 10px' }}>Solicitudes de plan. Toca una para aprobar o rechazar en la ficha del usuario.</div>
        {plans===null ? <div style={{textAlign:'center',color:'var(--tx3)',fontSize:12,padding:'22px 6px'}}>Cargando…</div>
          : plans.length===0 ? <div style={{textAlign:'center',color:'var(--tx3)',fontSize:12,padding:'22px 6px'}}>Sin solicitudes pendientes.</div>
          : plans.map(r=>{ const pr=names[r.user_id]; return (
            <div key={r.id} onClick={()=>openSheet({ id:r.user_id, full_name:pr?.full_name, avatar_url:pr?.avatar_url }, r)} className="reprow" style={{display:'flex',alignItems:'center',gap:10,padding:'10px 8px',margin:'0 -8px',borderRadius:9,cursor:'pointer',borderBottom:'1px solid rgba(128,128,128,.1)'}}>
              <Avatar url={avatarUrlOf(pr?.avatar_url)} name={pr?.full_name||'Usuario'} size={36} />
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12.5,fontWeight:700,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{pr?.full_name||'Usuario'}</div>
                <div style={{fontSize:11,color:'var(--tx3)'}}>quiere <b style={{color:'var(--ac)',textTransform:'capitalize'}}>{r.plan}</b> · {r.created_at?new Date(r.created_at).toLocaleDateString('es-ES',{day:'2-digit',month:'short'}):''}</div>
              </div>
              <span style={{fontSize:16,color:'var(--tx3)',flexShrink:0}}>›</span>
            </div>
          ); })}
      </>}

      {/* ── Pestaña COMPARTIR pendientes (Pro gratis, via=compartir) ── */}
      {tab==='shares' && <>
        <div style={{ fontSize:11, color:'var(--tx3)', margin:'0 0 10px' }}>Enlaces reales que la persona pegó para mantener su plan gratis. Toca una para revisarlos y aprobar o rechazar.</div>
        {shares===null ? <div style={{textAlign:'center',color:'var(--tx3)',fontSize:12,padding:'22px 6px'}}>Cargando…</div>
          : shares.length===0 ? <div style={{textAlign:'center',color:'var(--tx3)',fontSize:12,padding:'22px 6px'}}>Sin solicitudes pendientes.</div>
          : shares.map(r=>{ const pr=names[r.user_id]; const n=(r.evidence_urls||[]).length; return (
            <div key={r.id} onClick={()=>openSheet({ id:r.user_id, full_name:pr?.full_name, avatar_url:pr?.avatar_url }, r)} className="reprow" style={{display:'flex',alignItems:'center',gap:10,padding:'10px 8px',margin:'0 -8px',borderRadius:9,cursor:'pointer',borderBottom:'1px solid rgba(128,128,128,.1)'}}>
              <Avatar url={avatarUrlOf(pr?.avatar_url)} name={pr?.full_name||'Usuario'} size={36} />
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12.5,fontWeight:700,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{pr?.full_name||'Usuario'}</div>
                <div style={{fontSize:11,color:'var(--tx3)'}}>{n} enlace{n===1?'':'s'} · {r.created_at?new Date(r.created_at).toLocaleDateString('es-ES',{day:'2-digit',month:'short'}):''}</div>
              </div>
              <span style={{fontSize:16,color:'var(--tx3)',flexShrink:0}}>›</span>
            </div>
          ); })}
      </>}

      {/* Modal de motivo al suspender */}
      {suspendFor && <div className="mo" onClick={() => setSuspendFor(null)}>
        <div className="mb" onClick={e => e.stopPropagation()} style={{ maxWidth:360 }}>
          <div className="mt">Suspender a {nmeOf(suspendFor)}</div>
          <div className="ms">No podrá publicar, comprar ni chatear hasta reactivarlo. Recibirá una notificación.</div>
          <textarea value={susReason} onChange={e => setSusReason(e.target.value)} rows={3} placeholder="Motivo (opcional)…"
            style={{ width:'100%', boxSizing:'border-box', background:'var(--bg3,#12151f)', border:'1px solid var(--bd2,#222)', borderRadius:10, padding:'10px 12px', color:'var(--tx)', fontSize:13, outline:'none', resize:'none', margin:'6px 0 12px' }} />
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn" style={{ flex:1 }} onClick={() => setSuspendFor(null)}>Cancelar</button>
            <button className="btn btd" style={{ flex:1 }} onClick={confirmSuspend}>Suspender</button>
          </div>
        </div>
      </div>}

      {/* Motivo al rechazar verificación */}
      {rejectFor && <div className="mo" onClick={()=>setRejectFor(null)}>
        <div className="mb" onClick={e=>e.stopPropagation()} style={{maxWidth:360}}>
          <div className="mt">Rechazar solicitud de verificación de perfil</div>
          <div className="ms">El usuario verá el motivo y podrá reenviar su solicitud.</div>
          <textarea value={reason} onChange={e=>setReason(e.target.value)} rows={3} placeholder="Motivo (opcional)…" style={{width:'100%',boxSizing:'border-box',background:'var(--bg3,#12151f)',border:'1px solid var(--bd2,#222)',borderRadius:10,padding:'10px 12px',color:'var(--tx)',fontSize:13,outline:'none',resize:'none',margin:'6px 0 12px'}}/>
          <div style={{display:'flex',gap:8}}>
            <button className="btn" style={{flex:1}} onClick={()=>setRejectFor(null)}>Cancelar</button>
            <button className="btn btd" style={{flex:1}} onClick={rejectVerif}>Rechazar</button>
          </div>
        </div>
      </div>}

      {/* Visor grande de foto KYC */}
      {zoom && <div className="mo" onClick={()=>setZoom(null)} style={{zIndex:6000}}>
        <img src={zoom} alt="" onClick={e=>e.stopPropagation()} style={{maxWidth:'92vw',maxHeight:'88vh',borderRadius:12,objectFit:'contain'}}/>
      </div>}

      {/* ── FICHA del usuario: ÚNICO sitio de acción ── */}
      {sel && <div className="mo" onClick={closeSheet}>
        <div className="mb" onClick={e => e.stopPropagation()} style={{ maxWidth:400, maxHeight:'88vh', overflowY:'auto' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
            <Avatar url={avatarUrlOf(sel.avatar_url)} name={nmeOf(sel)} size={52} verified={!!sel.is_verified} />
            <div style={{ minWidth:0, flex:1 }}>
              <div style={{ fontSize:15, fontWeight:800, color:'var(--tx)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{nmeOf(sel)}</div>
              <div style={{ fontSize:12, color:'var(--tx3)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{sel.email || '—'}</div>
            </div>
            {onViewProfile && <button className="btn sm" onClick={()=>{ onViewProfile(sel.id); closeSheet(); }}>Ver perfil completo</button>}
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

          {/* Bloque VERIFICACIÓN — 3 casos. El ✓ SOLO se da a quien envió su solicitud. */}
          {canVerif && <div style={{ background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:12, padding:'12px', marginBottom:12 }}>
            <div style={{ fontSize:12, fontWeight:800, color:'var(--tx)', marginBottom:8 }}>🪪 Verificación de perfil</div>
            {sel.is_verified
              ? <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                  <span style={{ fontSize:12.5, fontWeight:700, color:G }}>✓ Perfil verificado</span>
                  {mngVerif && <button className="btn btd sm" style={{ marginLeft:'auto' }} disabled={busy==='v'} onClick={removeVerif}>Quitar verificación</button>}
                </div>
              : selVerif===undefined
                ? <div style={{ fontSize:12, color:'var(--tx3)' }}>Cargando solicitud…</div>
                : (selVerif && selVerif.status==='pending')
                  ? <>
                      {fieldRow('Nombre', selVerif.full_name || '—')}
                      {fieldRow('Documento', selVerif.doc_type || '—')}
                      {fieldRow('Número', selVerif.doc_number || '—')}
                      {fieldRow('Enviada', selVerif.created_at ? new Date(selVerif.created_at).toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'}) : '—')}
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, margin:'10px 0' }}>
                        {[['Frente',selVerif.doc_front],['Reverso',selVerif.doc_back],['Selfie',selVerif.selfie]].map(([lbl,p])=>(
                          <KycPhoto key={lbl} label={lbl} path={p} onZoom={setZoom} />
                        ))}
                      </div>
                      {mngVerif
                        ? <div style={{ display:'flex', gap:8 }}>
                            <button className="btn bts" style={{ flex:1 }} disabled={busy==='v'} onClick={()=>approveVerif(selVerif)}>✅ Aprobar</button>
                            <button className="btn btd" style={{ flex:1 }} disabled={busy==='v'} onClick={()=>{ setReason(''); setRejectFor(selVerif); }}>🚫 Rechazar</button>
                          </div>
                        : <div style={{ textAlign:'center', fontSize:11, color:'var(--tx3)' }}>👁 Solo lectura</div>}
                      {onOpenChat && <button className="btn sm" style={{ width:'100%', marginTop:8 }} disabled={busy==='m'} onClick={()=>sendReqMessage(sel, 'Verificación de perfil', 'Coordinemos tu solicitud por aquí')}>💬 Mensaje</button>}
                    </>
                  : <div style={{ fontSize:12, color:'var(--tx3)' }}>Sin solicitud de verificación de perfil. El ✓ se otorga solo cuando la persona envía sus documentos.</div>}
          </div>}

          {/* Bloque PLAN pendiente — vía pago (confirmar cobro) vs vía "compartir"
              (Pro gratis: no hay pago, hay que revisar los enlaces reales). */}
          {canPlans && selPlan && <div style={{ background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:12, padding:'12px', marginBottom:12 }}>
            {selPlan.via === 'compartir' ? (<>
              <div style={{ fontSize:12, fontWeight:800, color:'var(--tx)', marginBottom:8 }}>📤 Pro gratis — Compartir</div>
              <div style={{ fontSize:12, color:'var(--tx2)', marginBottom:10 }}>Pide mantener el plan <b style={{ color:'var(--ac)', textTransform:'capitalize' }}>{selPlan.plan}</b> gratis compartiendo. Revisa cada enlace real antes de decidir — nunca hay pago de por medio.</div>
              <div style={{ marginBottom:10 }}>
                {(selPlan.evidence_urls||[]).length === 0
                  ? <div style={{ fontSize:11.5, color:'var(--tx3)' }}>Sin enlaces adjuntos.</div>
                  : (selPlan.evidence_urls||[]).map((u,i) => (
                      <a key={i} href={u} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()}
                        style={{ display:'block', fontSize:11.5, color:'var(--ac)', wordBreak:'break-all', padding:'4px 0', borderBottom: i<selPlan.evidence_urls.length-1 ? '1px solid var(--bd)' : 'none' }}>{i+1}. {u}</a>
                    ))}
              </div>
            </>) : (<>
              <div style={{ fontSize:12, fontWeight:800, color:'var(--tx)', marginBottom:8 }}>⭐ Solicitud de plan</div>
              <div style={{ fontSize:12, color:'var(--tx2)', marginBottom:10 }}>Pide el plan <b style={{ color:'var(--ac)', textTransform:'capitalize' }}>{selPlan.plan}</b>. Confirma el pago y aprueba: el plan cambia de verdad.</div>
            </>)}
            {mngPlans
              ? <div style={{ display:'flex', gap:8 }}>
                  <button className="btn bts" style={{ flex:1 }} disabled={busy==='p'} onClick={()=>decidePlan(true)}>✅ Aprobar</button>
                  <button className="btn btd" style={{ flex:1 }} disabled={busy==='p'} onClick={()=>decidePlan(false)}>🚫 Rechazar</button>
                </div>
              : <div style={{ textAlign:'center', fontSize:11, color:'var(--tx3)' }}>👁 Solo lectura</div>}
            {onOpenChat && <button className="btn sm" style={{ width:'100%', marginTop:8 }} disabled={busy==='m'} onClick={()=>sendReqMessage(sel, `Solicitud de plan: ${selPlan.plan.charAt(0).toUpperCase()+selPlan.plan.slice(1)}`, selPlan.via==='compartir' ? 'Sobre tus enlaces compartidos' : 'Confirma el pago y coordinemos por aquí')}>💬 Mensaje</button>}
          </div>}

          {/* Acción de cuenta: suspender / reactivar */}
          {canUsers && (mngUsers
            ? <div style={{ display:'flex', gap:8 }}>
                {sel.is_suspended
                  ? <button className="btn btg" style={{ flex:1 }} disabled={busy==='s'} onClick={()=>doSuspend(sel,false)}>Reactivar</button>
                  : <button className="btn btd" style={{ flex:1 }} disabled={busy==='s' || sel.id===meId} onClick={()=>{ setSusReason(''); setSuspendFor(sel); }}>Suspender</button>}
              </div>
            : <div style={{ textAlign:'center', fontSize:11, color:'var(--tx3)' }}>👁 Solo lectura</div>)}
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

/* ── Economía ──────────────────────────────────────────────────────────────── */
function Economia({toast, data={}, ro}){
  const cfg = data.cfg || {};
  const [svcCatDraft, setSvcCatDraft] = useState(''); // borrador del input "Categorías de servicios"
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

  // ── "Pro gratis por compartir" (promo_settings, punto F) — interruptor real
  // + enlaces requeridos por mes. request_plan_promo (backend) ya lee esta
  // misma fila: lo que se guarda aquí tiene efecto real de inmediato, no es
  // solo cosmético.
  const [promoS, setPromoS] = useState(null);        // fila real de promo_settings
  const [promoReqDraft, setPromoReqDraft] = useState('12');
  const [savingPromoS, setSavingPromoS] = useState(false);
  const loadPromoS = useCallback(()=>{ getPromoSettings().then(s=>{ setPromoS(s); setPromoReqDraft(String(s.share_required ?? 12)); }); },[]);
  useEffect(()=>{ loadPromoS(); },[loadPromoS]);
  const togglePromoS = async () => {
    if (ro || !promoS) { if (ro) toast('Solo lectura — sin permiso para modificar'); return; }
    const next = !promoS.share_enabled;
    setSavingPromoS(true);
    try { await adminUpdatePromoSettings(next, Number(promoReqDraft)||12); setPromoS(s=>({...s, share_enabled: next})); toast(next ? 'Pro gratis por compartir: activado' : 'Pro gratis por compartir: desactivado'); }
    catch (e) { toast('⚠️ ' + (e?.message || 'No se pudo guardar')); }
    setSavingPromoS(false);
  };
  const savePromoRequired = async () => {
    if (ro || !promoS) { if (ro) toast('Solo lectura — sin permiso para modificar'); return; }
    const n = parseInt(promoReqDraft, 10);
    if (Number.isNaN(n) || n < 1) { toast('⚠️ Número de enlaces inválido'); return; }
    setSavingPromoS(true);
    try { await adminUpdatePromoSettings(promoS.share_enabled, n); setPromoS(s=>({...s, share_required:n})); toast('Enlaces requeridos por mes guardado'); }
    catch (e) { toast('⚠️ ' + (e?.message || 'No se pudo guardar')); }
    setSavingPromoS(false);
  };

  // ── Límite REAL de productos por plan (tabla plans, la que hace cumplir de
  // verdad el candado enforce_product_limit al publicar) — es un dato aparte
  // de cfg.plans de arriba (que es solo el texto/precio de marketing).
  const LIMIT_ORDER=[{id:'gratis',label:'Gratis'},{id:'pro',label:'Pro'},{id:'premium',label:'Premium'}];
  const [limits, setLimits] = useState(null);      // filas reales de la tabla plans
  const [limDraft, setLimDraft] = useState({});    // borrador { gratis:'10', pro:'50', premium:'500' }
  const [savingLim, setSavingLim] = useState(false);
  const loadLimits = useCallback(()=>{
    adminListPlanLimits().then(rows=>{
      setLimits(rows);
      const d={}; rows.forEach(r=>{ d[r.id]=String(r.max_products); }); setLimDraft(d);
    }).catch(()=>setLimits([]));
  },[]);
  useEffect(()=>{ loadLimits(); },[loadLimits]);
  const setLim=(id,v)=>setLimDraft(d=>({...d,[id]:v}));
  const saveLimits=async ()=>{
    if (ro) { toast('Solo lectura — sin permiso para modificar'); return; }
    setSavingLim(true);
    try {
      for (const p of LIMIT_ORDER) {
        const n = parseInt(limDraft[p.id], 10);
        if (Number.isNaN(n) || n < -1) throw new Error(`Límite inválido para ${p.label} (usa -1 para ilimitado)`);
        await adminUpdatePlanLimit(p.id, n);
      }
      toast('Límite de productos guardado');
      loadLimits();
    } catch (e) { toast('⚠️ ' + (e?.message || 'No se pudo guardar')); }
    setSavingLim(false);
  };
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
  // DEUDAS por vendedor Y mensajero: SOLO del LEDGER real del backend
  // (seller_commission_ledger). Los cargos de mensajero llegan solos al
  // completarse cada entrega, con kind='courier' — mismo ledger, etiqueta distinta.
  // Si el ledger no es legible (sin permiso) → lista vacía, nunca un estimado local.
  const debts = useMemo(() => {
    if (!Array.isArray(ledger)) return [];   // cargando o sin acceso → nada calculado
    const m = {};
    ledger.forEach(e => {
      const uid = e.seller_id; if (!uid) return;
      if (e.paid === true) return;
      const amt = Number(e.amount_owed) || 0; if (amt <= 0) return;
      const kind = String(e.kind || '').toLowerCase();
      if (!m[uid]) m[uid] = { uid, comm: 0, promo: 0, courier: 0 };
      if (kind === 'promotion') m[uid].promo += amt;
      else if (kind === 'courier') m[uid].courier += amt;
      else m[uid].comm += amt;
    });
    return Object.values(m).map(d => ({ ...d, total: d.comm + d.promo + d.courier })).filter(d => d.total > 0).sort((a, b) => b.total - a.total);
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
    if (d.courier > 0) parts.push(`${Math.round(d.courier)} por comisión de entrega`);
    if (d.promo > 0) parts.push(`${Math.round(d.promo)} por promociones`);
    return `Hola ${name} 👋. Tienes una deuda pendiente de ${Math.round(d.total)} CUP con RETADOR (${parts.join(' y ')}). ¡Gracias!`;
  };
  return <>
    <div className="stit">Economía</div>
    <div className="ssub">Tarifas, comisiones e ingresos · números del backend (fuente única)</div>

    {/* ── 🎛️ SECCIONES DE LA PLATAFORMA — encender/apagar (apagada = solo lectura) ──
        Un solo lugar para todas. Guarda en config.sectionsEnabled (global, EN VIVO
        para todos vía realtime). Nota: el "Servicio de delivery activo" de la página
        Delivery local es DISTINTO (es operativo: día de descanso / prelanzamiento del
        SERVICIO de pedidos), por eso se mantiene aparte y no se duplica aquí. */}
    {(() => {
      const secDefs = [
        ['marketplace',   '🏪 Marketplace',              'Explorar y comprar productos'],
        ['search',        '🔎 Búsqueda',                 'Buscador de productos'],
        ['deliveryLocal', '🛵 Delivery local',           'Pantalla de mensajería local'],
        ['intlShipping',  '✈️ Envíos internacionales',   'Cotizador de envíos al exterior'],
        ['auctions',      '🔨 Subastas',                 'Pujar y crear subastas'],
        ['wallet',        '👛 Billetera',                'Pagos y saldo'],
      ];
      const se = cfg.sectionsEnabled || {};
      const on = (k) => se[k] !== false;
      const toggle = (k) => {
        if (ro) { toast('Solo lectura — sin permiso para modificar'); return; }
        const wasOn = on(k);
        data.onCfg && data.onCfg({ sectionsEnabled: { ...se, [k]: !wasOn } });
        toast(wasOn ? 'Sección apagada — ahora es solo lectura para todos' : 'Sección encendida');
      };
      return (
        <div className="card cp" style={{marginBottom:16}}>
          <div style={{fontSize:15,fontWeight:800,color:'var(--tx)',marginBottom:3}}>🎛️ Secciones de la plataforma</div>
          <div style={{fontSize:11,color:'var(--tx3)',marginBottom:8}}>Apaga una sección para dejarla en <b>solo lectura</b>: se sigue viendo, pero nadie puede tocar nada. El cambio es EN VIVO para todos.</div>
          {secDefs.map(([k,label,desc],i)=>(
            <div key={k} style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,padding:'10px 0',borderTop:i>0?'1px solid var(--bd)':'none'}}>
              <div style={{minWidth:0}}>
                <div style={{fontSize:13,fontWeight:700,color:'var(--tx)'}}>{label}</div>
                <div style={{fontSize:10.5,color:'var(--tx3)',marginTop:2}}>{desc}</div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:9,flexShrink:0}}>
                <span style={{fontSize:11,fontWeight:800,color:on(k)?'var(--gn)':'var(--rd)'}}>{on(k)?'Encendida':'Apagada'}</span>
                {!ro && <button onClick={()=>toggle(k)} style={{fontWeight:800,fontSize:12,padding:'8px 14px',borderRadius:10,cursor:'pointer',border:`1px solid ${on(k)?'var(--rd)':'var(--gn)'}`,color:on(k)?'var(--rd)':'var(--gn)',background:'transparent'}}>{on(k)?'Apagar':'Encender'}</button>}
              </div>
            </div>
          ))}

          {/* GRUPO 1, punto 5 — Horario de Subastas: fuera de la franja, se muestra
              "abren a las HH:MM" en vez de la pantalla normal (independiente del
              interruptor de arriba, que es solo encendida/apagada). */}
          {(() => {
            const as = cfg.auctionSchedule || { enabled: false, start: '09:00', end: '21:00' };
            const setAs = (patch) => { if (ro) { toast('Solo lectura — sin permiso para modificar'); return; } data.onCfg && data.onCfg({ auctionSchedule: { ...as, ...patch } }); };
            const timeInp = {background:'var(--bg2)',border:'1px solid var(--bd2)',borderRadius:8,padding:'8px 10px',color:'var(--tx)',fontSize:13,outline:'none',width:'100%',boxSizing:'border-box'};
            return (
              <div style={{borderTop:'1px solid var(--bd)',marginTop:4,paddingTop:12}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}>
                  <div style={{minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,color:'var(--tx)'}}>🕐 Horario de Subastas</div>
                    <div style={{fontSize:10.5,color:'var(--tx3)',marginTop:2}}>Fuera de este horario, se muestra "abren a las HH:MM" en vez de la pantalla normal.</div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:9,flexShrink:0}}>
                    <span style={{fontSize:11,fontWeight:800,color:as.enabled?'var(--gn)':'var(--tx3)'}}>{as.enabled?'Activado':'Sin restricción'}</span>
                    {!ro && <button onClick={()=>setAs({enabled:!as.enabled})} style={{fontWeight:800,fontSize:12,padding:'8px 14px',borderRadius:10,cursor:'pointer',border:`1px solid ${as.enabled?'var(--rd)':'var(--gn)'}`,color:as.enabled?'var(--rd)':'var(--gn)',background:'transparent'}}>{as.enabled?'Quitar horario':'Configurar horario'}</button>}
                  </div>
                </div>
                {as.enabled && (
                  <div style={{display:'flex',gap:10,marginTop:10}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:10,color:'var(--tx3)',marginBottom:4}}>Abre</div>
                      <input type="time" value={as.start} disabled={ro} onChange={e=>setAs({start:e.target.value})} style={timeInp}/>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:10,color:'var(--tx3)',marginBottom:4}}>Cierra</div>
                      <input type="time" value={as.end} disabled={ro} onChange={e=>setAs({end:e.target.value})} style={timeInp}/>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      );
    })()}

    {/* GRUPO 1 — Categorías propias de SERVICIOS (config.serviceCats), distintas de
        las categorías de productos. Lista simple: añadir/quitar, guarda en vivo. */}
    {(() => {
      const list = Array.isArray(cfg.serviceCats) ? cfg.serviceCats : [];
      const addCat = () => {
        if (ro) { toast('Solo lectura — sin permiso para modificar'); return; }
        const v = svcCatDraft.trim(); if (!v || list.includes(v)) return;
        data.onCfg && data.onCfg({ serviceCats: [...list, v] });
        setSvcCatDraft('');
      };
      const removeCat = (c) => {
        if (ro) { toast('Solo lectura — sin permiso para modificar'); return; }
        data.onCfg && data.onCfg({ serviceCats: list.filter(x => x !== c) });
      };
      return (
        <div className="card cp" style={{marginBottom:16}}>
          <div style={{fontSize:15,fontWeight:800,color:'var(--tx)',marginBottom:3}}>🛠️ Categorías de servicios</div>
          <div style={{fontSize:11,color:'var(--tx3)',marginBottom:10}}>Las que ve el vendedor al publicar un SERVICIO (distintas de las categorías de productos).</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:7,marginBottom:12}}>
            {list.map(c => (
              <span key={c} style={{display:'inline-flex',alignItems:'center',gap:6,background:'var(--bg3)',border:'1px solid var(--bd)',borderRadius:50,padding:'6px 10px',fontSize:11.5,color:'var(--tx2)'}}>
                {c}
                {!ro && <span onClick={()=>removeCat(c)} style={{cursor:'pointer',color:'var(--rd)',fontWeight:800}}>×</span>}
              </span>
            ))}
            {list.length===0 && <span style={{fontSize:11,color:'var(--tx3)'}}>Ninguna todavía.</span>}
          </div>
          {!ro && (
            <div style={{display:'flex',gap:8}}>
              <input value={svcCatDraft} onChange={e=>setSvcCatDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')addCat();}} placeholder="Nueva categoría de servicio" style={{flex:1,background:'var(--bg2)',border:'1px solid var(--bd2)',borderRadius:8,padding:'9px 11px',color:'var(--tx)',fontSize:12.5,outline:'none',minWidth:0}}/>
              <button className="btn btp sm" onClick={addCat}>Agregar</button>
            </div>
          )}
        </div>
      );
    })()}

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

    {/* La cola "Solicitudes de promoción" que vivía aquí era enteramente local
        (localStorage, ligada a subastas que a su vez son datos de muestra, no
        reales) — nunca hubo nada real que aprobar, porque promote_product ya
        es autoservicio instantáneo (el vendedor destaca y se le cobra al
        momento, sin aprobación de nadie). Se quita: la sección real de abajo,
        "⭐ Promociones y Destacados", ya muestra con datos reales qué está
        destacado y su cargo en el libro mayor (seller_commission_ledger). */}

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

    {/* ── PRO GRATIS POR COMPARTIR (punto F) ── */}
    <div className="card cp mb16">
      <div className="ch" style={{marginBottom:6}}><span className="ct">🎁 Pro gratis por compartir</span></div>
      <div style={{fontSize:11,color:'var(--tx3)',marginBottom:14}}>Deja que cualquier usuario mantenga o consiga su plan de pago gratis compartiendo enlaces en vez de pagar — se revisa cada mes en la pestaña "📤 Compartir".</div>
      {promoS === null ? (
        <div style={{fontSize:12,color:'var(--tx3)'}}>Cargando…</div>
      ) : <>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,padding:'4px 0 14px'}}>
          <div style={{minWidth:0}}>
            <div style={{fontSize:13,fontWeight:700,color:'var(--tx)'}}>Activar Pro gratis por compartir</div>
            <div style={{fontSize:10.5,color:'var(--tx3)',marginTop:2}}>Apagado: nadie ve esta opción, solo los planes normales de pago.</div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:9,flexShrink:0}}>
            <span style={{fontSize:11,fontWeight:800,color:promoS.share_enabled?'var(--gn)':'var(--rd)'}}>{promoS.share_enabled?'Activado':'Desactivado'}</span>
            {!ro && <button disabled={savingPromoS} onClick={togglePromoS} style={{fontWeight:800,fontSize:12,padding:'8px 14px',borderRadius:10,cursor:savingPromoS?'default':'pointer',border:`1px solid ${promoS.share_enabled?'var(--rd)':'var(--gn)'}`,color:promoS.share_enabled?'var(--rd)':'var(--gn)',background:'transparent',opacity:savingPromoS?.6:1}}>{promoS.share_enabled?'Apagar':'Encender'}</button>}
          </div>
        </div>
        <div style={{borderTop:'1px solid var(--bd)',paddingTop:12,display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
          <div style={{minWidth:0,flex:1}}>
            <div style={{fontSize:13,fontWeight:700,color:'var(--tx)'}}>Enlaces requeridos por mes</div>
            <div style={{fontSize:10.5,color:'var(--tx3)',marginTop:2}}>Cuántos enlaces reales debe pegar cada mes quien elige esta opción.</div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
            <input type="number" min={1} value={promoReqDraft} disabled={ro} readOnly={ro} onChange={e=>setPromoReqDraft(e.target.value)} style={{width:64,background:'var(--bg2)',border:'1px solid var(--bd2)',borderRadius:8,padding:'8px 10px',color:'var(--tx)',fontSize:14,fontWeight:700,outline:'none',fontFamily:'var(--mo)',opacity:ro?.6:1}}/>
            {!ro && <button disabled={savingPromoS} onClick={savePromoRequired} className="btn btp" style={{fontWeight:800,padding:'8px 16px',opacity:savingPromoS?.6:1}}>Guardar</button>}
          </div>
        </div>
      </>}
    </div>

    {/* ── LÍMITE REAL DE PRODUCTOS POR PLAN ── */}
    <div className="card cp mb16">
      <div className="ch" style={{marginBottom:6}}><span className="ct">📦 Límite de productos por plan</span><span className="bdg bb">candado real</span></div>
      <div style={{fontSize:11,color:'var(--tx3)',marginBottom:14}}>Cuántos productos activos puede tener publicados un vendedor en cada plan. Esto es lo que de verdad bloquea al publicar (no solo texto informativo).</div>
      {limits===null
        ? <div style={{textAlign:'center',color:'var(--tx3)',fontSize:12,padding:'16px 6px'}}>Cargando…</div>
        : LIMIT_ORDER.map(p=><div key={p.id} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 0',borderBottom:'1px solid rgba(128,128,128,.1)'}}>
            <div style={{flex:1,fontSize:13,fontWeight:700,color:'var(--tx)'}}>{p.label}</div>
            <div style={{display:'flex',alignItems:'center',gap:6,background:'var(--bg2)',border:'1px solid var(--bd2)',borderRadius:8,padding:'7px 10px',opacity:ro?.6:1}}>
              <input type="number" value={limDraft[p.id] ?? ''} disabled={ro} readOnly={ro}
                onChange={e=>setLim(p.id,e.target.value)}
                style={{width:64,background:'none',border:'none',color:'var(--tx)',fontSize:13,fontWeight:700,outline:'none',fontFamily:'var(--mo)',cursor:ro?'not-allowed':'text'}}/>
              <span style={{fontSize:11,color:'var(--tx3)',whiteSpace:'nowrap'}}>productos</span>
            </div>
          </div>)}
      <div style={{fontSize:10,color:'var(--tx3)',marginTop:8}}>-1 significa ilimitado.</div>
      {!ro && <div style={{display:'flex',justifyContent:'flex-end',marginTop:12}}>
        <button className="btn btp" disabled={savingLim||limits===null} onClick={saveLimits} style={{fontWeight:800,padding:'9px 22px'}}>{savingLim?'Guardando…':'Guardar límites'}</button>
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
        <div className="ch"><span className="ct">Deudas pendientes</span><span className={`bdg ${debts.length?'by':'bx'}`}>{debts.length}</span></div>
        <div style={{fontSize:11,color:'var(--tx3)',margin:'2px 0 8px'}}>Comisión de venta, comisión de entrega y promociones sin saldar (vendedores y mensajeros). Toca el nombre para ver su ficha; "Cobrar" abre el chat con el mensaje listo.</div>
        {debts.length===0
          ? <div style={{textAlign:'center',color:'var(--tx3)',fontSize:12,padding:'22px 6px'}}>Nadie debe nada por ahora. Cada venta, entrega o destacado sumará aquí.</div>
          : debts.slice(0,12).map(d=>{
            const name = nameOf(d.uid) || (d.courier>0 && d.comm===0 && d.promo===0 ? 'Mensajero' : 'Vendedor');
            const parts = [d.comm>0?`${fmt(d.comm)} comisión de venta`:null, d.courier>0?`${fmt(d.courier)} comisión de entrega`:null, d.promo>0?`${fmt(d.promo)} promociones`:null].filter(Boolean).join(' · ');
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
// Cuenta rápida para el resumen de arriba de la parrilla ("3 de 10 con acceso").
const permAccessCount=(p)=>{
  const n=PERM_CATALOG.length;
  if(!p||typeof p!=='object') return { access:0, manage:0, total:n };
  const access=PERM_CATALOG.filter(s=>p[s.key]&&p[s.key]!=='none').length;
  const manage=PERM_CATALOG.filter(s=>p[s.key]==='manage').length;
  return { access, manage, total:n };
};

// Estilo de cada segmento de la pastilla, uno por nivel — así se distingue de un
// vistazo quién tiene acceso completo sin tener que leer cada palabra:
//   Administrar → dorado sólido y texto fuerte (el color de acción de la app).
//   Ver         → contorno dorado suave, sin relleno.
//   Sin acceso  → apagado/gris, igual que un segmento sin seleccionar.
const LEVEL_ON_STYLE={
  none:   { background:'var(--bg3)', border:'1px solid var(--bd2)', color:'var(--tx3)', fontWeight:700 },
  view:   { background:'transparent', border:'1px solid var(--ac2)', color:'var(--ac2)', fontWeight:700 },
  manage: { background:'var(--ac)',  border:'1px solid var(--ac)',  color:'#000',       fontWeight:800 },
};

function PermGrid({ value, onChange }){
  return <div style={{display:'flex',flexDirection:'column',gap:10}}>
    {PERM_CATALOG.map(s=>{
      const cur=value[s.key]||'none';
      return <div key={s.key} style={{background:'var(--bg2)',border:'1px solid var(--bd)',borderRadius:13,padding:'11px 12px'}}>
        <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:9}}>
          <span style={{fontSize:16,width:22,textAlign:'center'}}>{s.icon}</span>
          <span style={{fontSize:12.5,fontWeight:700,color:'var(--tx)',flex:1}}>{s.label}</span>
        </div>
        <div style={{display:'flex',gap:3,background:'var(--bg3)',border:'1px solid var(--bd)',borderRadius:10,padding:3}}>
          {LEVELS.map(l=>{
            const on=cur===l.v;
            const st=on?LEVEL_ON_STYLE[l.v]:{ background:'transparent', border:'1px solid transparent', color:'var(--tx3)', fontWeight:600 };
            return <button key={l.v} onClick={()=>onChange(s.key,l.v)}
              style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:4,padding:'7px 4px',borderRadius:8,cursor:'pointer',
                fontSize:10.5,transition:'all .14s',...st}}>
              <span style={{fontSize:13}}>{l.icon}</span>{l.label}
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
        <div className="ch">
          <span className="ct">Permisos por sección</span>
          <span className="bdg bb">{permAccessCount(perm).access} de {permAccessCount(perm).total} con acceso</span>
        </div>
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

// ── 📜 AUDITORÍA DEL EQUIPO — get_audit_log(p_actor_id, p_action, p_since, p_limit) ──
// Traducción de las acciones reales que el backend registra (public.audit_log, vía
// log_action) a texto legible. Lista sacada del código real (todas las llamadas a
// log_action del proyecto) — no es una lista inventada. Si alguna acción nueva no
// está aquí, se muestra su nombre crudo como respaldo (nunca se oculta la fila).
const AUDIT_ACTION_LABELS = {
  create_order: 'Creó un pedido',
  create_package_delivery: 'Creó un envío de paquete',
  confirm_order: 'Confirmó un pedido',
  order_advance: 'Avanzó el estado de un pedido',
  courier_accept: 'Aceptó una entrega',
  courier_stage: 'Avanzó una entrega',
  buyer_fee_response: 'Respondió una tarifa propuesta',
  confirm_payment: 'Confirmó un pago',
  pay_order_wallet: 'Pagó un pedido con billetera',
  release_funds: 'Liberó fondos retenidos',
  wallet_transfer: 'Transfirió dinero por billetera',
  topup_request: 'Solicitó una recarga',
  topup_review: 'Revisó una solicitud de recarga',
  place_bid: 'Hizo una puja',
  close_auction: 'Cerró una subasta',
  confirm_auction_payment: 'Confirmó el pago de una subasta',
  auction_default: 'Registró el incumplimiento de una subasta',
  auction_strike: 'Aplicó una amonestación de subasta',
  promote_product: 'Destacó un producto',
  admin_set_promoted: 'Cambió el destacado de un producto',
  admin_moderate_product: 'Moderó un producto',
  review_courier_application: 'Revisó una solicitud de mensajero',
  courier_review: 'Revisó a un mensajero',
  review_plan: 'Revisó una solicitud de plan',
  set_plan: 'Cambió el plan de un usuario',
  review_verification: 'Revisó una verificación de identidad',
  admin_set_verified: 'Cambió la verificación de un perfil',
  admin_set_role: 'Cambió el rol de un usuario',
  admin_set_suspended: 'Suspendió o reactivó una cuenta',
  admin_grant_staff: 'Otorgó permisos de staff',
  admin_revoke_staff: 'Retiró permisos de staff',
  set_team_member: 'Actualizó un miembro del equipo',
  resolve_report: 'Resolvió un reporte',
  set_rate: 'Actualizó una tasa de cambio',
  settle_commission: 'Saldó una deuda de comisión',
  admin_mark_commission_paid: 'Marcó una comisión como pagada',
};
// "Auditoría del equipo" es SOLO para lo que hace el equipo administrativo (staff
// con permiso), no un registro general de actividad de la plataforma — un pedido
// creado por un comprador, una puja o un mensajero avanzando su entrega NO
// pertenecen aquí. Clasificación verificada revisando el código real de cada
// función que llama a log_action (qué exige antes: is_admin() / can('...') =
// administrativa; nada de eso, la hace el propio usuario dueño de la acción =
// normal). Las automáticas del sistema (auction_default/auction_strike/
// close_auction, que se disparan solas al vencer un plazo, sin que nadie del
// equipo decida nada) tampoco cuentan como "administrativas".
const AUDIT_ADMIN_ACTIONS = new Set([
  'admin_grant_staff', 'admin_revoke_staff', 'admin_set_role', 'admin_set_verified',
  'admin_set_suspended', 'admin_set_promoted', 'admin_mark_commission_paid',
  'admin_moderate_product', 'courier_review', 'review_courier_application',
  'review_verification', 'review_plan', 'set_plan', 'resolve_report', 'topup_review',
  'set_rate', 'set_team_member', 'settle_commission',
]);
const AUDIT_TARGET_LABELS = { order:'Pedido', product:'Producto', profile:'Perfil', user:'Usuario', auction:'Subasta', courier:'Mensajero', exchange:'Tasa', wallet:'Billetera' };
const AUDIT_DETAIL_KEYS = { approved:'Aprobado', received:'Recibido', reason:'Motivo', rate:'Tasa', role:'Rol', decision:'Decisión', amount:'Monto', neto:'Neto', comision:'Comisión', pct:'Porcentaje', strikes:'Amonestaciones', winner:'Ganador', defaulter:'Incumplió', total:'Total', from:'Desde', to:'Hasta', stage:'Etapa', auto:'Automático', cerrado:'Cerrado', cost:'Costo', qty:'Cantidad', product:'Producto', who:'Quién', fee:'Tarifa', base:'Base', approved_at:'Fecha de aprobación' };
function describeAuditAction(action) { return AUDIT_ACTION_LABELS[action] || action; }
function describeAuditTarget(type, id) {
  const label = AUDIT_TARGET_LABELS[type] || (type || 'Elemento');
  if (!id) return label;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  return isUuid ? `${label} #${id.slice(-8).toUpperCase()}` : `${label} ${id}`;
}
const AUDIT_DETAIL_VALUES = { buyer:'Comprador', seller:'Vendedor', pending:'Pendiente', approved:'Aprobado', rejected:'Rechazado' };
function formatAuditDetailValue(v) {
  if (v === true) return 'Sí';
  if (v === false) return 'No';
  if (v === null || v === undefined || v === '') return '—';
  return AUDIT_DETAIL_VALUES[v] || String(v);
}

function TeamAuditScreen({ onBack }) {
  const DATE_RANGES = [['hoy','Hoy'], ['7d','Últimos 7 días'], ['30d','Últimos 30 días'], ['todo','Todo']];
  const [dateFilter, setDateFilter] = useState('7d');
  const [actorFilter, setActorFilter] = useState('');
  const [logs, setLogs] = useState(undefined); // undefined=cargando
  const [actorOptions, setActorOptions] = useState([]);
  const [expanded, setExpanded] = useState(null);

  const sinceFor = (k) => {
    if (k === 'todo') return null;
    const d = new Date();
    if (k === 'hoy') d.setHours(0, 0, 0, 0);
    else if (k === '7d') d.setDate(d.getDate() - 7);
    else if (k === '30d') d.setDate(d.getDate() - 30);
    return d.toISOString();
  };

  // get_audit_log no filtra por una LISTA de acciones (solo por una sola, p_action) —
  // el filtro de "solo administrativas" se aplica aquí, sobre las filas reales que
  // devuelve el backend, antes de mostrarlas o de armar el selector de miembro.
  const onlyAdmin = rows => rows.filter(r => AUDIT_ADMIN_ACTIONS.has(r.action));

  // Opciones del selector de miembro: SIEMPRE sin filtrar por miembro (solo por
  // fecha) — así la lista de nombres nunca se vacía al elegir uno. Se arma SOLO
  // con quienes tienen acciones administrativas reales (si alguien del equipo
  // también compró algo como usuario normal, eso no lo mete en esta lista).
  useEffect(() => {
    let alive = true;
    getAuditLog({ since: sinceFor(dateFilter), limit: 500 }).then(rows => {
      if (!alive) return;
      const seen = new Map();
      onlyAdmin(rows).forEach(r => { if (r.actor_id && !seen.has(r.actor_id)) seen.set(r.actor_id, r.actor_name); });
      setActorOptions([...seen.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name, 'es')));
    }).catch(() => {});
    return () => { alive = false; };
  }, [dateFilter]);

  // Lista real — se vuelve a pedir al backend cada vez que cambia CUALQUIER filtro.
  useEffect(() => {
    let alive = true;
    setLogs(undefined);
    getAuditLog({ actorId: actorFilter || null, since: sinceFor(dateFilter), limit: 500 })
      .then(rows => { if (alive) setLogs(onlyAdmin(rows)); })
      .catch(() => { if (alive) setLogs([]); });
    return () => { alive = false; };
  }, [actorFilter, dateFilter]);

  const when = ts => ts ? new Date(ts).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) + ' · ' + new Date(ts).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '—';

  return <>
    <button className="btn btg sm" onClick={onBack} style={{ marginBottom: 10 }}>← Volver a Sistema</button>
    <div className="stit">📜 Auditoría del equipo</div>
    <div className="ssub">Solo acciones administrativas de tu equipo (aprobaciones, moderación, permisos…) — quién, qué y cuándo. No incluye la actividad normal de los usuarios del marketplace.</div>

    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', margin: '14px 0 10px' }}>
      <select value={actorFilter} onChange={e => setActorFilter(e.target.value)}
        style={{ background: 'var(--bg2)', border: '1px solid var(--bd2)', borderRadius: 8, padding: '8px 11px', color: 'var(--tx)', fontSize: 12, fontWeight: 600, outline: 'none', cursor: 'pointer' }}>
        <option value="">Todo el equipo</option>
        {actorOptions.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
      </select>
    </div>
    <div className="tabs" style={{ maxWidth: 560, overflowX: 'auto', marginBottom: 14 }}>
      {DATE_RANGES.map(([k, l]) => <div key={k} className={`tab ${dateFilter === k ? 'on' : ''}`} onClick={() => setDateFilter(k)}>{l}</div>)}
    </div>

    <div className="card cp">
      {logs === undefined
        ? <div style={{ textAlign: 'center', color: 'var(--tx3)', fontSize: 12, padding: '26px 6px' }}>Cargando…</div>
        : logs.length === 0
          ? <div style={{ textAlign: 'center', color: 'var(--tx3)', fontSize: 12, padding: '26px 6px' }}>Sin acciones registradas en este rango.</div>
          : logs.map(l => {
            const hasDetail = l.detail && typeof l.detail === 'object' && Object.keys(l.detail).length > 0;
            const isOpen = expanded === l.id;
            return (
              <div key={l.id} style={{ borderBottom: '1px solid rgba(128,128,128,.1)' }}>
                <div onClick={() => hasDetail && setExpanded(isOpen ? null : l.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', cursor: hasDetail ? 'pointer' : 'default' }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>🧾</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--tx)' }}>{describeAuditAction(l.action)}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--tx3)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <span style={{ color: 'var(--ac)', fontWeight: 700 }}>{l.actor_name || 'Sistema'}</span> · {describeAuditTarget(l.target_type, l.target_id)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 10, color: 'var(--tx3)' }}>{when(l.created_at)}</div>
                    {hasDetail && <div style={{ fontSize: 9.5, color: 'var(--ac)', fontWeight: 700, marginTop: 2 }}>{isOpen ? 'Ocultar ▲' : 'Detalle ▼'}</div>}
                  </div>
                </div>
                {isOpen && hasDetail && (
                  <div style={{ background: 'var(--bg2)', border: '1px solid var(--bd2)', borderRadius: 10, padding: '10px 12px', marginBottom: 12 }}>
                    {Object.entries(l.detail).map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 11, padding: '3px 0' }}>
                        <span style={{ color: 'var(--tx3)', fontWeight: 600 }}>{AUDIT_DETAIL_KEYS[k] || k}</span>
                        <span style={{ color: 'var(--tx)', fontWeight: 600, textAlign: 'right' }}>{formatAuditDetailValue(v)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
    </div>
  </>;
}

function Sistema({toast, data={}}){
  // "📜 Auditoría del equipo" vive DENTRO de Sistema (no es una sección propia del
  // menú) — solo se llega aquí si ya se tiene acceso a Sistema (can('system','view')),
  // así que no hace falta una comprobación de permiso aparte para mostrar la tarjeta.
  // BUG REAL (pantalla en blanco, reproducido): el "return" condicional estaba
  // ANTES de los demás hooks de este componente (useState/useEffect/useMemo de
  // más abajo) — React exige que TODOS los hooks se llamen siempre, en el mismo
  // orden, en cada render. Al pasar de view="main" a view="audit", el segundo
  // render saltaba directo al "return" y dejaba de llamar los hooks de abajo:
  // React lo detecta y tira "Rendered fewer hooks than expected", sin capa que
  // lo atrape → pantalla completamente en blanco. El "if" ahora va DESPUÉS de
  // declarar todos los hooks (ver más abajo, justo antes del JSX final):
  // decide qué se DEVUELVE, nunca cuáles hooks se llaman.
  const [view, setView] = useState('main');
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
  if (view === 'audit') return <TeamAuditScreen onBack={() => setView('main')} />;
  return <>
    <div className="stit">Sistema</div>
    <div className="ssub">Actividad real de la plataforma e integraciones</div>
    {/* Resumen compacto: conteos REALES del backend (fuente única) */}
    <div className="g3 mb16">{[
      {l:'Órdenes',v:ordersCount,c:'var(--gn)'},
      {l:'Usuarios',v:usersCount,c:'var(--ac2)'},
      {l:'Eventos (registro)',v:eventsCount,c:'var(--yw)'}
    ].map(m=><div className="mc" key={m.l}><div className="ml">{m.l}</div><div className="mv" style={{color:m.c}}>{m.v}</div></div>)}</div>

    {/* 📜 AUDITORÍA DEL EQUIPO: pantalla propia, con filtros por persona y fecha —
        distinta de "Actividad" de abajo (esa es un vistazo rápido sin filtros). */}
    <div className="card cp mb16" onClick={() => setView('audit')} style={{cursor:'pointer',display:'flex',alignItems:'center',gap:10}}>
      <span style={{fontSize:15}}>📜</span>
      <div style={{flex:1,minWidth:0}}>
        <span className="ct">Auditoría del equipo</span>
        <div style={{fontSize:10.5,color:'var(--tx3)',marginTop:2}}>Quién hizo qué y cuándo, con filtros por persona y por fecha.</div>
      </div>
      <span style={{fontSize:12,color:'var(--tx3)',flexShrink:0}}>Ver →</span>
    </div>

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

/* ── 🏠 EDITOR DE LA PANTALLA PRINCIPAL (bienvenida) ─────────────────────────────
   Vive en la página del Editor Visual (permiso 'editor'). Guarda en config.home vía
   onCfg (config global) → persiste y se ve EN VIVO para todos por el realtime de
   platform_config. Los conteos (vendedores/productos) NO son editables: siempre reales. */
function HomeScreenEditor({ cfg = {}, onCfg, ro, toast }) {
  const h = cfg.home || {};
  const [subtitle, setSubtitle] = useState(h.subtitle ?? 'AHORA EN BETA PÚBLICA');
  const [enterLabel, setEnterLabel] = useState(h.enterLabel ?? 'Entrar a RETADOR');
  // El COLOR de acento (dorado #FFC01E) es FIJO en código, no editable — por eso el
  // guardado ya NO incluye 'accent'. Solo el subtítulo y el texto del botón se editan.
  const save = () => {
    if (ro) { toast('Solo lectura — sin permiso para modificar'); return; }
    onCfg && onCfg({ home: {
      subtitle: (subtitle.trim() || 'AHORA EN BETA PÚBLICA'),
      enterLabel: (enterLabel.trim() || 'Entrar a RETADOR'),
    } });
    toast('Pantalla de bienvenida guardada y publicada');
  };
  const inp = { width:'100%', background:'var(--bg2)', border:'1px solid var(--bd2)', borderRadius:8, padding:'9px 11px', color:'var(--tx)', fontSize:13, outline:'none', boxSizing:'border-box' };
  return (
    <div className="card cp" style={{marginBottom:16}}>
      <div style={{fontSize:15,fontWeight:800,color:'var(--tx)',marginBottom:3}}>🏠 Pantalla de bienvenida</div>
      <div style={{fontSize:11,color:'var(--tx3)',marginBottom:12}}>La bienvenida que ve todo el mundo al abrir. Sigue el tema (claro/oscuro) de cada usuario; el dorado y los conteos (vendedores/productos) son fijos/reales y no se editan.</div>
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        <div>
          <div style={{fontSize:11,fontWeight:600,color:'var(--tx2)',marginBottom:5}}>Subtítulo (insignia)</div>
          <input value={subtitle} disabled={ro} onChange={e=>setSubtitle(e.target.value)} style={inp} placeholder="AHORA EN BETA PÚBLICA"/>
        </div>
        <div>
          <div style={{fontSize:11,fontWeight:600,color:'var(--tx2)',marginBottom:5}}>Texto del botón (entrar)</div>
          <input value={enterLabel} disabled={ro} onChange={e=>setEnterLabel(e.target.value)} style={inp} placeholder="Entrar a RETADOR"/>
          <div style={{display:'flex',marginTop:8}}>
            <span style={{background:'#FFC01E',color:'#000',fontWeight:800,fontSize:12,padding:'8px 14px',borderRadius:10,whiteSpace:'nowrap'}}>{(enterLabel||'Entrar a RETADOR')} →</span>
          </div>
        </div>
        {!ro && <button onClick={save} style={{alignSelf:'flex-start',fontWeight:800,fontSize:13,padding:'10px 20px',borderRadius:10,border:'none',background:'var(--gn)',color:'#04120b',cursor:'pointer'}}>Guardar y publicar</button>}
      </div>
    </div>
  );
}

/* ── 🛒 CATÁLOGO PRO — catálogo interno de dropshipping (CJdropshipping) ─────
   Fase 1: fulfillment manual. El admin busca en CJ, revisa costo real/margen
   POR VARIANTE (catalog_pro_variant_pricing) y publica para que usuarios
   Pro/Premium agreguen productos a su tienda sin acceso directo a CJ. Las
   llamadas que hablan de verdad con CJ viven en Edge Functions (ver
   src/shared/backend.js); esta pantalla solo las invoca y muestra resultados
   reales — nunca datos simulados. */

// Texto del botón de publicar — una sola constante (el nombre definitivo del
// módulo todavía no está decidido; cambiarlo aquí basta para todo el panel).
const CATALOGO_PRO_PUBLISH_LABEL = 'Publicar en Catálogo Pro';

function CatalogQuotaBar() {
  const [quota, setQuota] = useState(undefined); // undefined=cargando · null=error
  useEffect(() => { catalogProQuotaStatus().then(setQuota).catch(e => { console.error('catalogProQuotaStatus:', e); setQuota(null); }); }, []);
  if (quota === undefined) return <div style={{ fontSize: 11, color: 'var(--tx3)', marginBottom: 12 }}>Cargando cuota de CJ…</div>;
  if (quota === null) return <div style={{ fontSize: 11, color: 'var(--rd)', marginBottom: 12 }}>No se pudo leer la cuota de CJ.</div>;
  const pct = Math.min(100, quota.percent_used || 0);
  const color = pct >= 90 ? 'var(--rd)' : pct >= 70 ? 'var(--yw)' : 'var(--gn)';
  return (
    <div className="card cp mb16">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
        <span className="ct">Cuota diaria de CJdropshipping</span>
        <span style={{ fontSize: 12, fontWeight: 800, color }}>{quota.used_today.toLocaleString('es-ES')} / {quota.total_daily.toLocaleString('es-ES')} puntos usados hoy</span>
      </div>
      <div style={{ height: 6, borderRadius: 6, background: 'var(--bg2)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, transition: 'width .3s' }} />
      </div>
      <div style={{ fontSize: 10.5, color: 'var(--tx3)', marginTop: 6 }}>{quota.remaining.toLocaleString('es-ES')} puntos restantes hoy ({pct}%)</div>
    </div>
  );
}

// Mercados de venta (sellable_regions) — manual y SIN relación con el país de
// stock de CJ: un producto verificado en US puede marcarse vendible en Cuba.
function RegionChecklist({ selected, onToggle, disabled }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {CJ_COUNTRIES.map(c => {
        const on = selected.includes(c.code);
        return (
          <button key={c.code} type="button" disabled={disabled} onClick={() => onToggle(c.code)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer',
              background: on ? 'var(--ag)' : 'var(--bg2)', border: `1px solid ${on ? 'var(--ac)' : 'var(--bd2)'}`, color: 'var(--tx)', fontSize: 11.5, fontWeight: 600, opacity: disabled ? .6 : 1 }}>
            <span style={{ width: 14, height: 14, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900,
              background: on ? 'var(--ac)' : 'transparent', border: `1.5px solid ${on ? 'var(--ac)' : 'var(--bd2)'}`, color: '#fff', flexShrink: 0 }}>{on ? '✓' : ''}</span>
            {c.code} · {c.label}
          </button>
        );
      })}
    </div>
  );
}

// Imagen con fallback real: si la URL falla en el navegador del que la ve
// (bloqueada por una extensión, un adblock, o simplemente caída), muestra un
// ícono visible en vez de desaparecer sin dejar rastro — así un problema de
// imagen se nota, no se confunde con "no hay imagen en los datos".
function CatalogImg({ src, width = 48, height = width, radius = 8, iconSize, style }) {
  const [broken, setBroken] = useState(false);
  const box = { width, height, borderRadius: radius, flexShrink: 0, ...style };
  if (!src || broken) {
    return <div style={{ ...box, background: 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: iconSize || 20 }}>📦</div>;
  }
  return <img src={src} alt="" referrerPolicy="no-referrer" style={{ ...box, objectFit: 'cover' }} onError={() => { console.error('CatalogImg: no cargó', src); setBroken(true); }} />;
}

// CJ usa MÁS de un formato real de enlace de producto — confirmados los dos:
//   · Escritorio: .../product/{slug}-p-{id}.html  (id = snowflake largo,
//     ej. 1446033730216005632 — el MISMO valor que usamos como pid)
//   · Móvil:      m.cjdropshipping.com/product/details/{id}  (sin "-p-" en
//     absoluto — este formato es el que rompía la extracción anterior)
// El pid de CJ NO siempre es numérico: también viene en formato UUID
// (ej. 85CFCA0F-94CD-4513-99D6-37B1DACC1290 — confirmado real contra
// /product/query y listV2, ambos lo aceptan igual que el numérico). El
// patrón anterior solo reconocía dígitos y fallaba en silencio con estos
// enlaces — ahora se reconoce el mismo formato UUID en TODOS los patrones
// (details/, respaldo suelto), no solo en ?pid=.
// "candidatos": el/los pid que el patrón -p-/details//?pid= identifica
// directo (se usan sin verificar, son patrones ya confirmados reales).
// "respaldo": cualquier otro número largo o UUID suelto en la URL — estos SÍ
// se validan de verdad contra cj-import-preview antes de usarse, uno por
// uno, para no mandar al admin a un preview con un pid inventado.
const CJ_PID_UUID_RE = '[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}';
function extractCjPidCandidates(raw) {
  const s = String(raw || '').trim();
  if (!s) return { candidatos: [], respaldo: [] };
  const candidatos = [];
  for (const m of s.matchAll(/-p-(\d{5,25})/gi)) candidatos.push(m[1]);
  for (const m of s.matchAll(new RegExp(`-p-(${CJ_PID_UUID_RE})`, 'gi'))) candidatos.push(m[1]);
  for (const m of s.matchAll(new RegExp(`/product/details/(${CJ_PID_UUID_RE})`, 'gi'))) candidatos.push(m[1]);
  for (const m of s.matchAll(/\/product\/details\/(\d{5,25})/gi)) candidatos.push(m[1]);
  for (const m of s.matchAll(/[?&]pid=([A-Za-z0-9-]{6,40})/gi)) candidatos.push(m[1]);
  const yaEncontrados = new Set(candidatos.map(c => c.toLowerCase()));
  const respaldoNumerico = s.match(/\d{9,25}/g) || [];
  const respaldoUuid = s.match(new RegExp(CJ_PID_UUID_RE, 'gi')) || [];
  const respaldo = [...new Set([...respaldoNumerico, ...respaldoUuid])]
    .filter(n => !yaEncontrados.has(n.toLowerCase()))
    .sort((a, b) => b.length - a.length);
  return { candidatos: [...new Set(candidatos)], respaldo };
}

// Confirmación simple reutilizable (Eliminar Staging / Despublicar) — mismo
// lenguaje visual que el modal de categorías, sin todo su estado extra.
function SimpleConfirm({ title, msg, confirmLabel = 'Eliminar', color = 'var(--rd)', busy, onCancel, onConfirm }) {
  return (
    <div onClick={onCancel} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 900, padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg1)', border: '1px solid var(--bd2)', borderRadius: 14, padding: 20, maxWidth: 320, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,.5)' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--tx)', marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--tx2)', lineHeight: 1.5, marginBottom: 16 }}>{msg}</div>
        <div style={{ display: 'flex', gap: 9 }}>
          <button className="btn btg" style={{ flex: 1, justifyContent: 'center' }} disabled={busy} onClick={onCancel}>Cancelar</button>
          <button className="btn" disabled={busy} style={{ flex: 1, justifyContent: 'center', background: color, color: '#fff', opacity: busy ? .5 : 1 }} onClick={onConfirm}>{busy ? <span className="spin">↻</span> : confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

function CatalogSearchTab({ toast, ro, onOpenPreview }) {
  const [keyWord, setKeyWord] = useState('');
  const [country, setCountry] = useState('US');
  const [page, setPage] = useState(1);
  const [results, setResults] = useState(null); // null = sin buscar todavía
  const [loading, setLoading] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [checkingLink, setCheckingLink] = useState(false);

  const doSearch = async (p = 1) => {
    if (!keyWord.trim()) { toast('Escribe algo para buscar'); return; }
    setLoading(true); setPage(p);
    try { setResults(await catalogProSearch(keyWord.trim(), p, country)); }
    catch (e) { console.error('catalogProSearch:', e); toast('⚠️ ' + (e.message || 'No se pudo buscar en CJ')); setResults(null); }
    setLoading(false);
  };

  const doImportFromLink = async () => {
    const { candidatos, respaldo } = extractCjPidCandidates(linkInput);
    if (candidatos.length > 0) { onOpenPreview(candidatos[0]); return; }
    if (respaldo.length === 0) { toast('⚠️ No se pudo identificar el producto en ese enlace'); return; }
    // Ningún patrón conocido (-p-, /product/details/, ?pid=) hizo match —
    // como último recurso, probamos los números largos sueltos de la URL
    // uno por uno contra cj-import-preview real, y usamos el primero que
    // de verdad exista como producto. Nunca se manda un pid sin confirmar.
    setCheckingLink(true);
    let encontrado = null;
    for (const candidato of respaldo.slice(0, 3)) {
      try {
        const data = await catalogProPreview(candidato);
        if (data && !data.error && data.pid) { encontrado = candidato; break; }
      } catch (_e) { /* seguir con el siguiente candidato */ }
    }
    setCheckingLink(false);
    if (encontrado) onOpenPreview(encontrado);
    else toast('⚠️ No se pudo identificar el producto en ese enlace');
  };

  return (
    <>
      <CatalogQuotaBar />
      <div className="card cp mb16">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input className="inp" style={{ flex: '2 1 220px' }} value={keyWord} disabled={ro} onChange={e => setKeyWord(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') doSearch(1); }} placeholder="Buscar producto en CJ (ej. phone case)…" />
          <select className="inp" style={{ flex: '1 1 160px' }} value={country} disabled={ro} onChange={e => setCountry(e.target.value)}>
            {CJ_COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.code} · {c.label}</option>)}
          </select>
          <button className="btn btp" disabled={ro || loading} onClick={() => doSearch(1)}>{loading ? <span className="spin">↻</span> : '🔎'} Buscar</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--bd)' }} />
          <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--tx3)' }}>O PEGAR ENLACE</span>
          <div style={{ flex: 1, height: 1, background: 'var(--bd)' }} />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input className="inp" style={{ flex: '1 1 260px' }} value={linkInput} disabled={ro} onChange={e => setLinkInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') doImportFromLink(); }} placeholder="Pegar enlace de producto CJ (cjdropshipping.com/product/... o m.cjdropshipping.com/...)…" />
          <button className="btn btg" disabled={ro || checkingLink || !linkInput.trim()} onClick={doImportFromLink}>{checkingLink ? <span className="spin">↻</span> : '🔗'} Ver producto</button>
        </div>
      </div>

      {loading && <div style={{ textAlign: 'center', color: 'var(--tx3)', fontSize: 12, padding: '24px 6px' }}>Buscando en CJ…</div>}

      {!loading && results && (
        <>
          <div className="ssub">{(results.totalRecords || 0).toLocaleString('es-ES')} resultados reales · página {page} de {results.totalPages || 1}{results.source === 'cache' ? ' · desde caché (20 min)' : ''}</div>
          <div className="g3">
            {(results.products || []).map(p => (
              <div key={p.id} className="mc" style={{ cursor: 'pointer', padding: 0, overflow: 'hidden' }} onClick={() => onOpenPreview(p.id)}>
                <CatalogImg src={p.bigImage} width="100%" height={120} radius={0} iconSize={32} />
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--tx2)', lineHeight: 1.4, marginBottom: 5 }}>{p.nameEn}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--tx)' }}>${p.sellPrice}</div>
                  <div style={{ display: 'flex', gap: 5, marginTop: 6, flexWrap: 'wrap' }}>
                    <span className="bdg bx">👁 {p.listedNum ?? 0} vendedor(es)</span>
                    {p.verifiedWarehouse
                      ? <span className="bdg bg">✅ Stock verificado en {CJ_COUNTRIES.find(c => c.code === country)?.label || country}</span>
                      : <span className="bdg bx">⏳ Stock sin verificar en {CJ_COUNTRIES.find(c => c.code === country)?.label || country}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {(results.products || []).length === 0 && <div style={{ textAlign: 'center', color: 'var(--tx3)', fontSize: 12, padding: '24px 6px' }}>Sin resultados para esa búsqueda en {country}.</div>}
          {results.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
              <button className="btn sm" disabled={page <= 1 || loading} onClick={() => doSearch(page - 1)} style={{ opacity: page <= 1 ? .4 : 1 }}>‹ Anterior</button>
              <span style={{ fontSize: 11, color: 'var(--tx3)' }}>Página {page} de {results.totalPages}</span>
              <button className="btn sm" disabled={page >= results.totalPages || loading} onClick={() => doSearch(page + 1)} style={{ opacity: page >= results.totalPages ? .4 : 1 }}>Siguiente ›</button>
            </div>
          )}
        </>
      )}
    </>
  );
}

// ── Selector de variantes agrupado (tipo tienda real) ────────────────────
// CJ no manda un nombre de tipo por atributo (confirmado con productos
// reales — ver comentario largo en cj-import-preview): lo único real que
// llega es variantKey partido en piezas. El backend ya infiere las
// etiquetas (color/talla/modelo/atributo_N) y las manda en `attributes`
// por variante — acá solo se agrupan para armar los chips.
const ATTR_LABEL_ES = { color: 'Color', talla: 'Talla', modelo: 'Modelo' };
function attrLabelText(label) {
  if (ATTR_LABEL_ES[label]) return ATTR_LABEL_ES[label];
  const m = /^atributo_(\d+)$/.exec(label || '');
  return m ? `Atributo ${m[1]}` : (label || '');
}
function groupVariantAttributes(variants) {
  const labels = [];
  const valuesByLabel = {};
  for (const v of variants || []) {
    for (const [label, value] of Object.entries(v.attributes || {})) {
      if (!valuesByLabel[label]) { valuesByLabel[label] = []; labels.push(label); }
      if (!valuesByLabel[label].includes(value)) valuesByLabel[label].push(value);
    }
  }
  return { labels, valuesByLabel };
}
function resolveVariant(variants, selectedAttrs) {
  const entries = Object.entries(selectedAttrs || {});
  return (variants || []).find(v => entries.every(([label, value]) => (v.attributes || {})[label] === value)) || null;
}
// HTML de CJ → texto plano, de forma segura (DOMParser nunca ejecuta
// scripts ni inserta nada en el documento real) — evita el riesgo de
// pintar HTML de un tercero sin sanear.
function htmlToPlainText(html) {
  if (!html) return '';
  try {
    const doc = new DOMParser().parseFromString(String(html), 'text/html');
    doc.querySelectorAll('script,style').forEach(el => el.remove());
    return (doc.body?.textContent || '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  } catch { return String(html).replace(/<[^>]*>/g, ' ').trim(); }
}

function VariantAttributeSelector({ variants, selectedAttrs, onChange, disabled }) {
  const { labels, valuesByLabel } = useMemo(() => groupVariantAttributes(variants), [variants]);
  if (labels.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {labels.map(label => (
        <div key={label}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--tx3)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: .5 }}>{attrLabelText(label)}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {valuesByLabel[label].map(value => {
              const isOn = selectedAttrs[label] === value;
              const candidate = { ...selectedAttrs, [label]: value };
              const exists = variants.some(v => Object.entries(candidate).every(([l, val]) => (v.attributes || {})[l] === val));
              return (
                <button key={value} type="button" disabled={disabled || !exists} onClick={() => onChange(candidate)}
                  style={{
                    padding: '7px 13px', borderRadius: 9, fontSize: 12, fontWeight: 700,
                    cursor: (disabled || !exists) ? 'not-allowed' : 'pointer',
                    background: isOn ? 'var(--ac)' : 'var(--bg2)',
                    color: isOn ? '#000' : (exists ? 'var(--tx)' : 'var(--tx3)'),
                    border: `1px solid ${isOn ? 'var(--ac)' : 'var(--bd2)'}`,
                    opacity: exists ? 1 : .4, textDecoration: exists ? 'none' : 'line-through',
                  }}>{value}</button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function CatalogPreviewScreen({ pid, toast, ro, onBack, onImported }) {
  const [data, setData] = useState(undefined); // undefined = cargando
  const [chosenSkus, setChosenSkus] = useState([]);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    setData(undefined); setChosenSkus([]);
    catalogProPreview(pid).then(setData)
      .catch(e => { toast('⚠️ ' + (e.message || 'No se pudo cargar el preview')); setData(null); });
  }, [pid]);

  const toggleChosen = sku => setChosenSkus(s => s.includes(sku) ? s.filter(x => x !== sku) : s.concat(sku));
  // "Con stock" = stock YA verificado contra CJ y mayor que 0 — nunca las
  // que quedaron sin verificar (null), para no incluir a ciegas algo que
  // pudiera estar agotado de verdad.
  const withStockSkus = useMemo(() => (data?.variants || []).filter(v => v.stock != null && v.stock > 0).map(v => v.sku), [data]);
  const selectAllWithStock = () => setChosenSkus(withStockSkus);
  const deselectAll = () => setChosenSkus([]);

  const doImport = async () => {
    if (chosenSkus.length === 0) { toast('Elige al menos una variante'); return; }
    setImporting(true);
    try {
      await catalogProImport(pid, chosenSkus);
      toast(`✅ Producto importado con ${chosenSkus.length} variante(s) — revísalo en Staging`);
      onImported();
    } catch (e) { toast('⚠️ ' + (e.message || 'No se pudo importar')); }
    setImporting(false);
  };

  if (data === undefined) return <div style={{ textAlign: 'center', color: 'var(--tx3)', fontSize: 12, padding: '40px 6px' }}>Cargando variantes reales de CJ (puede tardar ~20-30s con muchas variantes: se piden una por una para que CJ no falle)…</div>;
  if (data === null) return <div style={{ textAlign: 'center', padding: '40px 6px' }}><button className="btn btg" onClick={onBack}>‹ Volver a la búsqueda</button></div>;

  return (
    <>
      <button className="btn btg sm" style={{ marginBottom: 12 }} onClick={onBack}>‹ Volver a resultados</button>
      <div className="card cp mb16">
        <div style={{ display: 'flex', gap: 12 }}>
          <CatalogImg src={data.images?.[0]} width={64} height={64} radius={8} iconSize={26} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--tx)' }}>{data.title}</div>
            <div style={{ fontSize: 11, color: 'var(--tx3)', marginTop: 2 }}>{data.category} · {data.variants.length} variantes reales · {data.listedNum ?? 0} listados</div>
          </div>
        </div>
      </div>

      {!ro && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          <button className="btn btg sm" disabled={withStockSkus.length === 0} onClick={selectAllWithStock}>✓ Seleccionar todas (con stock) — {withStockSkus.length}</button>
          <button className="btn btg sm" disabled={chosenSkus.length === 0} onClick={deselectAll}>✕ Deseleccionar todas</button>
          <div style={{ fontSize: 11, color: 'var(--tx3)', marginLeft: 'auto' }}>{chosenSkus.length} de {data.variants.length} seleccionada(s)</div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="tw">
          <table>
            <thead><tr>{!ro && <th></th>}<th>Variante</th><th>Precio</th><th>Stock verificado</th><th>Peso</th></tr></thead>
            <tbody>
              {data.variants.map(v => {
                const checked = chosenSkus.includes(v.sku);
                const attrText = Object.values(v.attributes || {}).join(' · ') || v.sku;
                return (
                  <tr key={v.sku} style={{ cursor: ro ? 'default' : 'pointer', background: checked ? 'var(--bg2)' : 'transparent' }} onClick={() => !ro && toggleChosen(v.sku)}>
                    {!ro && <td onClick={e => e.stopPropagation()}><input type="checkbox" checked={checked} onChange={() => toggleChosen(v.sku)} /></td>}
                    <td style={{ color: 'var(--tx)', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CatalogImg src={v.image} width={28} height={28} radius={6} iconSize={12} />
                        <span>{attrText}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--tx2)', fontWeight: 700 }}>{money(v.price)}</td>
                    <td style={{ color: v.stock == null ? 'var(--tx3)' : v.stock > 0 ? 'var(--gn)' : 'var(--rd)', fontWeight: 700 }}>
                      {v.stock == null ? 'Sin verificar' : v.stock.toLocaleString('es-ES')}
                    </td>
                    <td style={{ color: 'var(--tx3)' }}>{v.weightGrams ? `${v.weightGrams} g` : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {!ro && <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btp" disabled={importing || chosenSkus.length === 0} onClick={doImport}>
          {importing ? <span className="spin">↻</span> : '📥'} Importar {chosenSkus.length ? `${chosenSkus.length} seleccionada(s)` : 'seleccionadas'}
        </button>
      </div>}
    </>
  );
}

// Traduce el flete crudo de CJ (ej. método "CJPacket CR", vigencia "25-30")
// a un texto legible y consistente con el resto del panel — nunca el
// nombre de fletera interno de CJ tal cual. El destino de este envío
// SIEMPRE es el centro logístico interno en EE.UU. (fijo, vía
// freightCalculate) sin importar qué país buscó el admin en CJ — ese país
// es solo dónde CJ tiene el stock de origen, son cosas distintas.
function humanizeShippingAging(raw) {
  const s = String(raw ?? '').trim();
  if (!s) return null;
  const range = s.match(/^(\d+)\s*[-~]\s*(\d+)$/);
  if (range) return `${range[1]} a ${range[2]} días hábiles`;
  if (/^\d+$/.test(s)) return `${s} días hábiles`;
  return s;
}
function humanizeShippingMethod(rawName) {
  const n = String(rawName || '').toLowerCase();
  if (/express|expedited|\bdhl\b|\bfedex\b|\bups\b|\btnt\b/.test(n)) return 'Envío exprés';
  return 'Envío estándar';
}
function humanizeShipping(name, aging) {
  const agingText = humanizeShippingAging(aging);
  return agingText ? `${humanizeShippingMethod(name)} — ${agingText}` : humanizeShippingMethod(name);
}

// La variante "vitrina" del resumen de ganancia: la más barata entre las
// elegidas (mismo criterio de "rango" usado en todo el módulo — CJ mismo
// muestra sus precios como rango, ej. "2.34 -- 2.70"). Si hay más de una
// variante, el resumen lo aclara.
function pickHeroVariant(pricing) {
  if (!Array.isArray(pricing) || pricing.length === 0) return null;
  return pricing.reduce((best, r) => {
    const cost = Number(r.cost_product) || 0;
    const bestCost = best ? (Number(best.cost_product) || 0) : Infinity;
    return cost < bestCost ? r : best;
  }, null);
}

// Tarjeta de presentación estilo Zendrop: imagen grande, chips de ganancia
// y margen, "por qué se vende" (si ya se generó), y el resumen de ganancia
// en cuadrícula. Se usa igual en Staging (arriba de la tabla editable) y en
// Publicado (arriba de la tabla de solo lectura) — mismos datos reales de
// catalog_pro_variant_pricing, ningún número inventado.
function CatalogProductHero({ title, images, category, whyItSells, pricing }) {
  const hero = pickHeroVariant(pricing);
  const costBase = hero ? (Number(hero.cost_base_total ?? hero.cost_product) || 0) : 0;
  const price = hero ? (Number(hero.recommended_price) || 0) : 0;
  const profit = hero ? (Number(hero.profit_estimate) || 0) : 0;
  const marginX = hero && costBase > 0 ? price / costBase : 0;
  const categoryChip = String(category || '').split(/[>/]/).map(s => s.trim()).filter(Boolean).pop() || null;
  const shippingKnown = hero && hero.shipping_status === 'ok' && hero.cost_shipping_to_hub != null;
  const shippingFailed = hero && hero.shipping_status === 'no_disponible';
  const whyLines = (whyItSells || '').split('\n').map(l => l.replace(/^[•\-\d.\s]+/, '').trim()).filter(Boolean);

  return (
    <div className="card mb16" style={{ overflow: 'hidden' }}>
      <CatalogImg src={images?.[0]} width="100%" height={200} radius={0} iconSize={44} />
      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--tx)', lineHeight: 1.35, marginBottom: 10 }}>{title}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {hero && <span className="bdg bg">💰 {money(profit)} ganancia por venta</span>}
          {hero && marginX > 0 && <span className="bdg bb">{marginX.toFixed(1)}x margen</span>}
          {categoryChip && <span className="bdg bx">{categoryChip}</span>}
        </div>

        {whyLines.length > 0 && (
          <div style={{ marginBottom: 14, padding: '10px 12px', background: 'var(--bg2)', borderRadius: 10, border: '1px solid var(--bd2)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--tx3)', letterSpacing: .5, textTransform: 'uppercase', marginBottom: 6 }}>🤖 Por qué se vende</div>
            {whyLines.map((line, i) => (
              <div key={i} style={{ fontSize: 12, color: 'var(--tx2)', marginBottom: 3, paddingLeft: 14, position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0 }}>•</span>{line}
              </div>
            ))}
          </div>
        )}

        <div className="ct" style={{ marginBottom: 8 }}>Resumen de ganancia{pricing?.length > 1 ? ' (variante más barata)' : ''}</div>
        <div className="g4" style={{ gap: 8 }}>
          <div style={{ background: 'var(--bg2)', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 9.5, color: 'var(--tx3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>Precio de venta</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--tx)' }}>{hero ? money(price) : '—'}</div>
          </div>
          <div style={{ background: 'var(--bg2)', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 9.5, color: 'var(--tx3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>Tu costo</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--tx)' }}>{hero ? money(hero.cost_product) : '—'}</div>
          </div>
          <div style={{ background: shippingFailed ? 'var(--rdb, rgba(239,68,68,.1))' : 'var(--bg2)', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 9.5, color: shippingFailed ? 'var(--rd)' : 'var(--tx3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>Envío al centro logístico</div>
            <div style={{ fontSize: shippingFailed ? 11.5 : 14, fontWeight: 800, color: shippingFailed ? 'var(--rd)' : 'var(--tx)' }}>
              {shippingKnown ? money(hero.cost_shipping_to_hub) : shippingFailed ? '⚠️ No disponible' : 'Calculando…'}
            </div>
            {hero?.shipping_method && shippingKnown && (
              <div style={{ fontSize: 9.5, color: 'var(--tx3)', marginTop: 2 }}>{humanizeShipping(hero.shipping_method, hero.shipping_aging)}</div>
            )}
          </div>
          <div style={{ background: 'var(--gnb)', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 9.5, color: 'var(--gn)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>Tu ganancia</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--gn)' }}>{hero ? money(profit) : '—'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CatalogStagingDetail({ product, toast, ro, onBack, onPublished }) {
  const [edits, setEdits] = useState({}); // { [pricingId]: {margin_pct, margin_fixed} }
  const [regions, setRegions] = useState(product.sellable_regions || []);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [recalcId, setRecalcId] = useState(null); // pricing_id en recálculo, o 'all'

  const rows = (product.pricing || []).map(p => {
    const draft = edits[p.id] || {};
    const marginPct = draft.margin_pct ?? p.margin_pct ?? 0;
    const marginFixed = draft.margin_fixed ?? p.margin_fixed ?? 0;
    const costBase = Number(p.cost_base_total ?? p.cost_product) || 0;
    const recommended = Math.round((costBase * (1 + Number(marginPct) / 100) + Number(marginFixed)) * 100) / 100;
    const profit = Math.round((recommended - costBase) * 100) / 100;
    return { ...p, marginPct, marginFixed, costBase, recommended, profit, dirty: draft.margin_pct !== undefined || draft.margin_fixed !== undefined };
  });
  const anyDirty = rows.some(r => r.dirty);
  const regionsDirty = JSON.stringify([...regions].sort()) !== JSON.stringify([...(product.sellable_regions || [])].sort());

  const setDraft = (id, patch) => setEdits(e => ({ ...e, [id]: { ...e[id], ...patch } }));
  const toggleRegion = code => setRegions(r => r.includes(code) ? r.filter(x => x !== code) : r.concat(code));

  const saveAll = async () => {
    setSaving(true);
    try {
      for (const r of rows) {
        if (!r.dirty) continue;
        await catalogProUpdateVariantPricing(r.id, { margin_pct: Number(r.marginPct), margin_fixed: Number(r.marginFixed), recommended_price: r.recommended, profit_estimate: r.profit });
      }
      if (regionsDirty) await catalogProUpdateStagingRegions(product.id, regions);
      toast('✅ Cambios guardados');
      setEdits({});
      onPublished();
    } catch (e) { toast('⚠️ ' + (e.message || 'No se pudo guardar')); }
    setSaving(false);
  };

  const doPublish = async () => {
    if (anyDirty || regionsDirty) { toast('Guarda los cambios antes de publicar'); return; }
    setPublishing(true);
    try {
      await catalogProPublish(product.id);
      toast(`✅ ${CATALOGO_PRO_PUBLISH_LABEL}: listo`);
      onPublished();
      onBack();
    } catch (e) { toast('⚠️ ' + (e.message || 'No se pudo publicar')); }
    setPublishing(false);
  };

  const shippingPendingRows = rows.filter(r => r.shipping_status !== 'ok');
  const shippingFailedRows = rows.filter(r => r.shipping_status === 'no_disponible');

  const recalcFreight = async (pricingIds, key) => {
    setRecalcId(key);
    try {
      await catalogProCalculateShipping(pricingIds);
      toast('✅ Flete recalculado');
      onPublished();
    } catch (e) { toast('⚠️ ' + (e.message || 'No se pudo calcular el flete')); }
    setRecalcId(null);
  };

  return (
    <>
      <button className="btn btg sm" style={{ marginBottom: 12 }} onClick={onBack}>‹ Volver a Staging</button>
      <CatalogProductHero title={product.title} images={product.images} category={product.category} whyItSells={product.why_it_sells} pricing={rows} />
      <div className="ssub" style={{ marginTop: -4 }}>{rows.length} variante(s) · {product.listed_num ?? 0} listados en CJ</div>

      {shippingPendingRows.length > 0 && (
        <div className="card cp mb16" style={{ borderColor: shippingFailedRows.length ? 'var(--rd)' : 'var(--bd2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 12, color: shippingFailedRows.length ? 'var(--rd)' : 'var(--tx2)' }}>
              {shippingFailedRows.length > 0
                ? `⚠️ Flete no disponible para ${shippingFailedRows.length} variante(s) — requiere revisión manual antes de publicar.`
                : `⏳ Calculando flete para ${shippingPendingRows.length} variante(s)…`}
            </div>
            <button className="btn btg sm" disabled={recalcId === 'all'} onClick={() => recalcFreight(shippingPendingRows.map(r => r.id), 'all')}>
              {recalcId === 'all' ? <span className="spin">↻</span> : '🔄'} Recalcular flete
            </button>
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="tw">
          <table>
            <thead><tr><th>Variante</th><th>Peso</th><th>Costo real</th><th>Envío</th><th>Margen %</th><th>Margen fijo</th><th>Precio recomendado</th><th>Ganancia</th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td style={{ color: 'var(--tx)', fontWeight: 600 }}>{Object.values(r.attributes || {}).join(' · ') || r.variant_sku}</td>
                  <td style={{ color: 'var(--tx3)' }}>{r.weight_grams ? `${r.weight_grams} g` : '—'}</td>
                  <td style={{ background: 'var(--bg2)', color: 'var(--tx2)', fontWeight: 700 }}>{money(r.costBase)}</td>
                  <td>
                    {r.shipping_status === 'ok'
                      ? (
                        <div>
                          <div style={{ fontWeight: 700 }}>{money(r.cost_shipping_to_hub)}</div>
                          <div style={{ fontSize: 9.5, color: 'var(--tx3)', marginTop: 2 }}>{humanizeShipping(r.shipping_method, r.shipping_aging)}</div>
                        </div>
                      )
                      : r.shipping_status === 'no_disponible'
                        ? (
                          <button className="btn bts sm" disabled={recalcId === r.id} onClick={() => recalcFreight([r.id], r.id)} title="Reintentar cálculo de flete">
                            {recalcId === r.id ? <span className="spin">↻</span> : '⚠️ No disponible'}
                          </button>
                        )
                        : <span style={{ color: 'var(--tx3)' }}>⏳ pendiente</span>}
                  </td>
                  <td><input type="number" className="inp" style={{ width: 70 }} value={r.marginPct} disabled={ro} onChange={e => setDraft(r.id, { margin_pct: e.target.value })} /></td>
                  <td><input type="number" className="inp" style={{ width: 70 }} value={r.marginFixed} disabled={ro} onChange={e => setDraft(r.id, { margin_fixed: e.target.value })} /></td>
                  <td style={{ color: 'var(--gn)', fontWeight: 800 }}>{money(r.recommended)}</td>
                  <td style={{ color: 'var(--gn)', fontWeight: 700 }}>{money(r.profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card cp mb16">
        <div className="ch"><span className="ct">Mercados de venta</span></div>
        <div style={{ fontSize: 11, color: 'var(--tx3)', marginBottom: 10 }}>Independiente del país donde CJ tiene el stock — decide tú en dónde se puede vender este producto.</div>
        <RegionChecklist selected={regions} onToggle={toggleRegion} disabled={ro} />
      </div>

      {!ro && <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button className="btn btg" disabled={saving || (!anyDirty && !regionsDirty)} onClick={saveAll}>{saving ? <span className="spin">↻</span> : '💾'} Guardar cambios</button>
        <button className="btn bts" disabled={publishing || rows.length === 0} onClick={doPublish}>{publishing ? <span className="spin">↻</span> : '🚀'} {CATALOGO_PRO_PUBLISH_LABEL}</button>
      </div>}
    </>
  );
}

function CatalogStagingTab({ toast, ro }) {
  const [rows, setRows] = useState(undefined); // undefined=cargando · null=error
  const [openId, setOpenId] = useState(null);
  const [toDelete, setToDelete] = useState(null); // producto a confirmar borrado
  const [deleting, setDeleting] = useState(false);
  const load = useCallback(() => {
    catalogProListStaging().then(setRows).catch(e => { console.error('catalogProListStaging:', e); setRows(null); });
  }, []);
  useEffect(() => { load(); }, [load]);

  // El atrás del sistema retrocede AL LISTADO (no cierra el panel completo) —
  // ver el mismo patrón ya usado para overlays (visor de fotos, perfil).
  useEffect(() => {
    if (!openId) return;
    return pushBackHandler(() => setOpenId(null));
  }, [openId]);

  const pending = (rows || []).filter(r => r.status !== 'publicado');
  const open = pending.find(r => r.id === openId);

  const doDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await catalogProDeleteStaging(toDelete.id);
      toast(`✅ Eliminado: ${toDelete.title}`);
      setToDelete(null);
      load();
    } catch (e) { toast('⚠️ ' + (e.message || 'No se pudo eliminar')); }
    setDeleting(false);
  };

  if (open) return <CatalogStagingDetail product={open} toast={toast} ro={ro} onBack={() => setOpenId(null)} onPublished={load} />;

  return (
    <>
      <div className="ssub">Productos importados pendientes de revisar y publicar.</div>
      {rows === undefined
        ? <div style={{ textAlign: 'center', color: 'var(--tx3)', fontSize: 12, padding: '24px 6px' }}>Cargando…</div>
        : rows === null
          ? <div style={{ textAlign: 'center', color: 'var(--rd)', fontSize: 12, padding: '24px 6px' }}>⚠️ No se pudo cargar staging — revisa la consola del navegador.</div>
          : pending.length === 0
            ? <div style={{ textAlign: 'center', color: 'var(--tx3)', fontSize: 12, padding: '24px 6px' }}>No hay productos pendientes — busca e importa alguno.</div>
            : pending.map(p => (
              <div key={p.id} className="mc" style={{ cursor: 'pointer', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }} onClick={() => setOpenId(p.id)}>
                <CatalogImg src={p.images?.[0]} width={48} height={48} radius={8} iconSize={20} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--tx)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{p.title}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--tx3)', marginTop: 2 }}>{(p.pricing || []).length} variante(s) · costo desde {money(p.cost_product)}</div>
                </div>
                {!ro && <button className="btn sm" style={{ background: 'transparent', color: 'var(--rd)', border: '1px solid var(--rd)' }} onClick={e => { e.stopPropagation(); setToDelete(p); }}>🗑</button>}
                <span style={{ fontSize: 12, color: 'var(--tx3)' }}>Revisar →</span>
              </div>
            ))}
      {toDelete && (
        <SimpleConfirm title="¿Eliminar de Staging?" busy={deleting} onCancel={() => setToDelete(null)} onConfirm={doDelete}
          msg={<>Vas a eliminar <b style={{ color: 'var(--tx)' }}>{toDelete.title}</b> y todo su costeo por variante. Esta acción no se puede deshacer.</>} />
      )}
    </>
  );
}

// La pantalla que vería un comprador real si un vendedor Pro hubiera
// agregado este producto a su tienda: galería completa, nombre, precio de
// VENTA (nunca el costo), selector de variantes agrupado, descripción
// completa. CERO datos de CJ, costos o márgenes visibles — a propósito.
function StorePreviewScreen({ product }) {
  const images = (product.images || []).filter(Boolean);
  const [mainIdx, setMainIdx] = useState(0);
  const pricing = product.pricing || [];
  const [selectedAttrs, setSelectedAttrs] = useState(() => pricing[0]?.attributes || {});
  const activeVariant = useMemo(() => resolveVariant(pricing, selectedAttrs), [pricing, selectedAttrs]);
  const descriptionText = useMemo(() => htmlToPlainText(product.description), [product.description]);
  const priceToShow = activeVariant?.recommended_price ?? product.recommended_price;
  const mainImage = images[mainIdx] || activeVariant?.image;

  return (
    <div style={{ maxWidth: 420, margin: '0 auto' }}>
      <CatalogImg src={mainImage} width="100%" height={320} radius={16} iconSize={54} />
      {images.length > 1 && (
        <div style={{ display: 'flex', gap: 6, marginTop: 8, overflowX: 'auto', paddingBottom: 2 }}>
          {images.map((url, i) => (
            <img key={i} src={url} alt="" referrerPolicy="no-referrer" onClick={() => setMainIdx(i)}
              style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 8, cursor: 'pointer', flexShrink: 0,
                border: i === mainIdx ? `2px solid ${G}` : '2px solid transparent' }}
              onError={e => { e.target.style.display = 'none'; }} />
          ))}
        </div>
      )}
      <div style={{ marginTop: 18 }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--tx)', lineHeight: 1.35 }}>{product.title}</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: G, margin: '8px 0 18px' }}>{money(priceToShow)}</div>
        <VariantAttributeSelector variants={pricing} selectedAttrs={selectedAttrs} onChange={setSelectedAttrs} disabled={false} />
        {descriptionText && (
          <div style={{ marginTop: 22 }}>
            <div className="ct" style={{ marginBottom: 8 }}>Descripción</div>
            <div style={{ fontSize: 12.5, color: 'var(--tx2)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{descriptionText}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// Mismo detalle que Staging, en solo lectura — para revisar el costeo por
// variante de un producto YA publicado, sin poder editarlo (eso solo se
// hace antes de publicar, en Staging). Trae una sub-pestaña "Vista de
// tienda" con exactamente lo que vería un comprador (StorePreviewScreen).
function CatalogPublishedDetail({ product, onBack }) {
  const [view, setView] = useState('costeo');
  const rows = (product.pricing || []).map(p => ({ ...p, costBase: Number(p.cost_base_total ?? p.cost_product) || 0 }));
  return (
    <>
      <button className="btn btg sm" style={{ marginBottom: 12 }} onClick={onBack}>‹ Volver a Publicado</button>
      <div className="tabs" style={{ maxWidth: 320 }}>
        {[['costeo', 'Costeo (interno)'], ['tienda', 'Vista de tienda']].map(([k, l]) =>
          <div key={k} className={`tab ${view === k ? 'on' : ''}`} onClick={() => setView(k)}>{l}</div>)}
      </div>

      {view === 'tienda' ? <StorePreviewScreen product={product} /> : (
        <>
          <CatalogProductHero title={product.title} images={product.images} category={product.category} whyItSells={product.why_it_sells} pricing={rows} />
          <div className="ssub" style={{ marginTop: -4 }}>{rows.length} variante(s) · {(product.sellable_regions || []).join(', ') || 'sin regiones marcadas'}</div>
          <div className="card">
            <div className="tw">
              <table>
                <thead><tr><th>Variante</th><th>Costo real</th><th>Margen</th><th>Precio recomendado</th><th>Ganancia</th></tr></thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.id}>
                      <td style={{ color: 'var(--tx)', fontWeight: 600 }}>{Object.values(r.attributes || {}).join(' · ') || r.variant_sku}</td>
                      <td style={{ background: 'var(--bg2)', color: 'var(--tx2)', fontWeight: 700 }}>{money(r.costBase)}</td>
                      <td>{r.margin_pct}% {Number(r.margin_fixed) ? `+ ${money(r.margin_fixed)}` : ''}</td>
                      <td style={{ color: 'var(--gn)', fontWeight: 800 }}>{money(r.recommended_price)}</td>
                      <td style={{ color: 'var(--gn)', fontWeight: 700 }}>{money(r.profit_estimate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function CatalogPublishedTab({ toast }) {
  const [rows, setRows] = useState(undefined); // undefined=cargando · null=error
  const [openId, setOpenId] = useState(null);
  const [toArchive, setToArchive] = useState(null);
  const [archiving, setArchiving] = useState(false);
  const load = useCallback(() => {
    catalogProListPublished().then(setRows).catch(e => { console.error('catalogProListPublished:', e); setRows(null); });
  }, []);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!openId) return;
    return pushBackHandler(() => setOpenId(null));
  }, [openId]);

  const open = (rows || []).find(r => r.id === openId);
  if (open) return <CatalogPublishedDetail product={open} onBack={() => setOpenId(null)} />;

  const doArchive = async () => {
    if (!toArchive) return;
    setArchiving(true);
    try {
      await catalogProArchivePublished(toArchive.id);
      toast(`✅ Despublicado: ${toArchive.title}`);
      setToArchive(null);
      load();
    } catch (e) { toast('⚠️ ' + (e.message || 'No se pudo despublicar')); }
    setArchiving(false);
  };

  return (
    <>
      <div className="ssub">Catálogo ya publicado — toca uno para ver su costeo por variante (solo lectura; se edita desde Staging antes de publicar).</div>
      {rows === undefined
        ? <div style={{ textAlign: 'center', color: 'var(--tx3)', fontSize: 12, padding: '24px 6px' }}>Cargando…</div>
        : rows === null
          ? <div style={{ textAlign: 'center', color: 'var(--rd)', fontSize: 12, padding: '24px 6px' }}>⚠️ No se pudo cargar el catálogo publicado — revisa la consola del navegador.</div>
          : rows.length === 0
            ? <div style={{ textAlign: 'center', color: 'var(--tx3)', fontSize: 12, padding: '24px 6px' }}>Todavía no hay nada publicado.</div>
            : rows.map(p => (
              <div key={p.id} className="mc" style={{ cursor: 'pointer', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12, opacity: p.status === 'archived' ? .55 : 1 }} onClick={() => setOpenId(p.id)}>
                <CatalogImg src={p.images?.[0]} width={48} height={48} radius={8} iconSize={20} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--tx)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{p.title}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--tx3)', marginTop: 2 }}>{(p.pricing || []).length} variante(s) · desde {money(p.recommended_price)} · {(p.sellable_regions || []).join(', ') || 'sin regiones marcadas'}</div>
                </div>
                {p.status !== 'archived' && <button className="btn sm" style={{ background: 'transparent', color: 'var(--rd)', border: '1px solid var(--rd)' }} onClick={e => { e.stopPropagation(); setToArchive(p); }}>Despublicar</button>}
                <span className="bdg bg">{p.status}</span>
              </div>
            ))}
      {toArchive && (
        <SimpleConfirm title="¿Despublicar producto?" confirmLabel="Despublicar" color="var(--rd)" busy={archiving} onCancel={() => setToArchive(null)} onConfirm={doArchive}
          msg={<>Vas a despublicar <b style={{ color: 'var(--tx)' }}>{toArchive.title}</b> — desaparece del catálogo de vendedores Pro/Premium. No se borra (por si algún vendedor ya lo agregó a su tienda) y lo puedes reactivar desde Supabase si hace falta.</>} />
      )}
    </>
  );
}

function CatalogoPro({ toast, ro }) {
  const [tab, setTab] = useState('buscar');
  const [previewPid, setPreviewPid] = useState(null);
  // Conteo real de pedidos pendientes de gestionar — vive aquí (no solo
  // dentro de la pestaña) para que se vea como badge en la pestaña misma
  // aunque el admin esté viendo otra sección del Catálogo Pro.
  const [pendingCount, setPendingCount] = useState(null);
  const refreshPendingCount = useCallback(() => {
    catalogProPendingFulfillment().then(rows => setPendingCount(rows.length)).catch(() => {});
  }, []);
  useEffect(() => { refreshPendingCount(); }, [refreshPendingCount]);

  useEffect(() => {
    if (!previewPid) return;
    return pushBackHandler(() => setPreviewPid(null));
  }, [previewPid]);

  return (
    <>
      <div className="stit">Catálogo Pro</div>
      <div className="ssub">Catálogo interno de dropshipping (CJdropshipping) para Pro/Premium — fase 1, fulfillment manual.</div>
      {ro && <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 10, background: 'var(--bg2)', border: '1px solid var(--bd2)', fontSize: 12, fontWeight: 700, color: 'var(--tx2)' }}>👁 Solo lectura — sin permiso para importar ni publicar.</div>}

      <div className="tabs" style={{ maxWidth: 420 }}>
        {[['buscar', 'Buscar'], ['staging', 'Staging'], ['publicado', 'Publicado'], ['pedidos', 'Pedidos por gestionar']].map(([k, l]) =>
          <div key={k} className={`tab ${tab === k ? 'on' : ''}`} onClick={() => { setTab(k); setPreviewPid(null); }}>
            {l}{k === 'pedidos' && pendingCount > 0 && <span className="bdg bg" style={{ marginLeft: 6 }}>{pendingCount}</span>}
          </div>)}
      </div>

      {tab === 'buscar' && (previewPid
        ? <CatalogPreviewScreen pid={previewPid} toast={toast} ro={ro} onBack={() => setPreviewPid(null)} onImported={() => { setPreviewPid(null); setTab('staging'); }} />
        : <CatalogSearchTab toast={toast} ro={ro} onOpenPreview={setPreviewPid} />)}
      {tab === 'staging' && <CatalogStagingTab toast={toast} ro={ro} />}
      {tab === 'publicado' && <CatalogPublishedTab toast={toast} />}
      {tab === 'pedidos' && <CatalogPendingOrdersTab toast={toast} ro={ro} onChange={refreshPendingCount} />}
    </>
  );
}

// "Pedidos por gestionar" — conecta cada pedido real de un producto del
// Catálogo Pro con lo que Daniel debe hacer a mano (pagar/pedir a CJ y
// seguir el envío hasta Cuba). La fila de catalog_pro_fulfillment nace sola
// (trigger en la base, ver create_order) — esta pantalla solo lee/avanza lo
// que ya existe. Nunca muestra el precio de venta del vendedor, solo el
// costo real que Daniel paga.
function CatalogPendingOrdersTab({ toast, ro, onChange }) {
  const [rows, setRows] = useState(undefined); // undefined=cargando · null=error
  const [statusMap, setStatusMap] = useState([]); // [{internal_status, public_label, sort_order}]
  const [advancing, setAdvancing] = useState(null); // order_id en curso

  const load = useCallback(() => {
    catalogProPendingFulfillment().then(setRows).catch(e => { console.error('catalogProPendingFulfillment:', e); setRows(null); });
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { getOrderStatusMap().then(setStatusMap); }, []);

  const nextStatusOf = (internalStatus) => {
    const i = statusMap.findIndex(s => s.internal_status === internalStatus);
    return (i >= 0 && i < statusMap.length - 1) ? statusMap[i + 1] : null;
  };

  const advance = async (row) => {
    const next = nextStatusOf(row.internal_status);
    if (!next) return;
    setAdvancing(row.order_id);
    try {
      await catalogProAdvanceFulfillment(row.order_id, next.internal_status);
      toast(`✅ Estado actualizado: ${next.public_label}`);
      load();
      onChange?.();
    } catch (e) { toast('⚠️ ' + (e.message || 'No se pudo actualizar el estado')); }
    setAdvancing(null);
  };

  return (
    <>
      <div className="ssub">Pedidos reales de productos del Catálogo Pro que debes gestionar (pagar/pedir a CJ y seguir el envío) — los más antiguos primero.</div>
      {rows === undefined
        ? <div style={{ textAlign: 'center', color: 'var(--tx3)', fontSize: 12, padding: '24px 6px' }}>Cargando…</div>
        : rows === null
          ? <div style={{ textAlign: 'center', color: 'var(--rd)', fontSize: 12, padding: '24px 6px' }}>⚠️ No se pudo cargar — revisa la consola del navegador.</div>
          : rows.length === 0
            ? <div style={{ textAlign: 'center', color: 'var(--tx3)', fontSize: 12, padding: '24px 6px' }}>No hay pedidos pendientes de gestionar ahora mismo.</div>
            : rows.map(r => {
              const next = nextStatusOf(r.internal_status);
              const attrs = r.variant_attributes && Object.keys(r.variant_attributes).length ? Object.values(r.variant_attributes).join(' / ') : null;
              return (
                <div key={r.order_id} className="mc" style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <CatalogImg src={r.product_image} width={48} height={48} radius={8} iconSize={20} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--tx)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{r.product_title}{attrs ? ` · ${attrs}` : ''}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--tx3)', marginTop: 2 }}>×{r.qty} · Pagar a CJ: <b style={{ color: 'var(--tx)' }}>{money(r.cost_to_pay, r.cost_currency)}</b> · Comprador: {r.buyer_name}</div>
                    </div>
                    <span className="bdg bg">{r.status_label}</span>
                  </div>
                  {!ro && next && (
                    <div style={{ marginTop: 10 }}>
                      <button className="btn sm btp" disabled={advancing === r.order_id} onClick={() => advance(r)}>
                        {advancing === r.order_id ? <span className="spin">↻</span> : `Avanzar a: ${next.public_label}`}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
    </>
  );
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
  { key:'users',         page:'users',    group:'Plataforma', icon:'👥', label:'Usuarios' },
  // Verificaciones y Planes ya no son entradas propias del menú: viven como pestañas
  // dentro de Usuarios (UsersHub). Se conservan como páginas/permisos para que
  // "Pendientes de ti" y los permisos por sección sigan funcionando (menuHidden).
  { key:'verifications', page:'verif',    group:'Plataforma', icon:'🪪', label:'Verificaciones', menuHidden:true },
  { key:'plans',         page:'plans',    group:'Plataforma', icon:'⭐', label:'Planes', menuHidden:true },
  { key:'editor',        page:'editor',   group:'Plataforma', icon:'◐', label:'Editor Visual' },
  { key:'catalogpro',    page:'catalogpro', group:'Plataforma', icon:'🛒', label:'Catálogo Pro' },
  { key:'economy',       page:'eco',      group:'Control',    icon:'◇', label:'Economía' },
  { key:'system',        page:'sys',      group:'Control',    icon:'◉', label:'Sistema' },
];
const PAGE_TO_PERM=Object.fromEntries(SECTIONS.map(s=>[s.page,s.key]));
const TITLES={overview:'Resumen General',ops:'Órdenes',modq:'Moderación',delivery:'Delivery local',users:'Usuarios',verif:'Verificaciones',plans:'Planes',editor:'Editor Visual de Plataforma',catalogpro:'Catálogo Pro',eco:'Economía',sys:'Sistema',team:'Equipo y permisos'};
// Catalogo para la pantalla de permisos del equipo (las 10 llaves).
const PERM_CATALOG=SECTIONS.map(s=>({key:s.key,label:s.label,icon:s.icon}));

function useToast(){
  const[ts,setTs]=useState([]);
  const add=msg=>{const id=Date.now();setTs(p=>[...p,{id,msg}]);setTimeout(()=>setTs(p=>p.filter(t=>t.id!==id)),3000);};
  return{ts,add};
}

function OmniRoot({ onClose, theme = {}, zoom = 1, data = {} }){
  const[col,setCol]=useState(false);
  // Al abrir desde una notificación de nueva solicitud, entra directo a su cola
  // (data.initialPage). El chequeo de permiso de más abajo (pageAllowed / el
  // useEffect que corrige la página) ya la redirige si no tiene acceso.
  const[page,setPage]=useState(data.initialPage || null);
  const[narrow,setNarrow]=useState(false);
  const[mnav,setMnav]=useState(false);
  const rootRef=useRef(null);
  useEffect(()=>{
    const el=rootRef.current; if(!el||typeof ResizeObserver==='undefined') return;
    const r=new ResizeObserver(es=>{ const w=es[0].contentRect.width; setNarrow(w<760); });
    r.observe(el); return ()=>r.disconnect();
  },[]);
  const{ts,add}=useToast();
  // ── Badges de pendientes COMPARTIDOS y EN VIVO entre todo el equipo ──────────
  // Los pendientes son de la PLATAFORMA, no de cada teléfono. El número SIEMPRE sale
  // de la RPC staff_pending_counts (nada cacheado localmente): resuelva quien resuelva,
  // todos los paneles abiertos actualizan sus badges en segundos gracias al realtime.
  const[pending,setPending]=useState({});
  // "Última vez que vi Órdenes" POR USUARIO (clave con su id: no se mezcla entre cuentas
  // del mismo teléfono). Es INFORMATIVO: cada quien marca lo suyo. Si nunca ha entrado,
  // se ancla a su PRIMERA apertura del panel (no cuenta el historial entero). Se pasa a
  // la RPC como p_orders_since → 'orders' cuenta solo los pedidos posteriores.
  const ordersSeenKey = `retador_orders_since_${data.meId||'anon'}`;
  const [ordersSince,setOrdersSince] = useState(()=>{
    try{ let v=localStorage.getItem(ordersSeenKey); if(!v){ v=new Date().toISOString(); localStorage.setItem(ordersSeenKey,v); } return v; }
    catch{ return new Date().toISOString(); }
  });
  const ordersSinceRef=useRef(ordersSince);
  useEffect(()=>{ ordersSinceRef.current=ordersSince; },[ordersSince]);
  const loadPending=useCallback(()=>{ staffPendingCounts(ordersSinceRef.current).then(c=>setPending(c||{})).catch(()=>setPending({})); },[]);
  useEffect(()=>{ loadPending(); },[loadPending]);
  useEffect(()=>{
    let tmr=null; const bump=()=>{ clearTimeout(tmr); tmr=setTimeout(loadPending,900); };
    // Ante CUALQUIER cambio en estas tablas de la plataforma → recarga la RPC.
    const ch=supabase.channel(`staff-pend-${Date.now()}`)
      .on("postgres_changes",{event:"*",schema:"public",table:"products"},bump)
      .on("postgres_changes",{event:"*",schema:"public",table:"courier_applications"},bump)
      .on("postgres_changes",{event:"*",schema:"public",table:"verifications"},bump)
      .on("postgres_changes",{event:"*",schema:"public",table:"plan_requests"},bump)
      .on("postgres_changes",{event:"*",schema:"public",table:"seller_commission_ledger"},bump)
      .on("postgres_changes",{event:"*",schema:"public",table:"orders"},bump)
      .subscribe();
    const onVis=()=>{ if(document.visibilityState==='visible') loadPending(); };
    document.addEventListener('visibilitychange',onVis); window.addEventListener('focus',loadPending);
    return ()=>{ clearTimeout(tmr); document.removeEventListener('visibilitychange',onVis); window.removeEventListener('focus',loadPending); try{Promise.resolve(supabase.removeChannel(ch)).catch(()=>{});}catch(e){} };
  },[loadPending]);
  // Badge = número de la RPC (acción = pendientes reales; órdenes = desde tu last-seen).
  const badgeFor = (key)=> Number(pending[key])||0;
  // Al ENTRAR a Órdenes: mueve el last-seen a ahora y recarga → su badge desaparece para
  // ESTE usuario (informativo), sin tocar el de nadie más.
  const markOrdersSeen = ()=>{
    const now=new Date().toISOString();
    try{ localStorage.setItem(ordersSeenKey,now); }catch{}
    ordersSinceRef.current=now; setOrdersSince(now); loadPending();
  };
  // ── Permisos a la carta: "ALL" (admin) o { seccion: none|view|manage } ──
  const perms=data.perms;
  const isAdmin=perms==='ALL';
  const levelOf=(key)=> isAdmin?'manage':((perms&&typeof perms==='object'&&perms[key])||'none');
  const allowed=(key)=>{ const l=levelOf(key); return l==='view'||l==='manage'; };
  // La entrada única "Usuarios" se ve si puede entrar a cualquiera de sus áreas
  // (usuarios, verificaciones o planes). Verificaciones/Planes ya no van en el menú.
  const usersEntryAllowed = allowed('users')||allowed('verifications')||allowed('plans');
  const inMenu = (s)=> s.menuHidden ? false : (s.key==='users' ? usersEntryAllowed : allowed(s.key));
  const visSecs=SECTIONS.filter(inMenu);
  const groups=[]; visSecs.forEach(s=>{ let g=groups.find(x=>x.sec===s.group); if(!g){g={sec:s.group,items:[]};groups.push(g);} g.items.push(s); });
  const visibleNav=groups.concat(isAdmin?[{sec:'Gestión',items:[{page:'team',icon:'◔',label:'Equipo y permisos'}]}]:[]);
  // Badge del menú: en "Usuarios" se suman verificaciones + planes pendientes.
  const menuBadge=(item)=> item.key==='users' ? ((Number(pending.verifications)||0)+(Number(pending.plans)||0)) : (item.key?badgeFor(item.key):0);
  // Primera página permitida al abrir (o si cambian los permisos y la actual ya no vale).
  useEffect(()=>{
    const okNow = page!=null && (page==='team'?isAdmin: page==='users'?usersEntryAllowed : (PAGE_TO_PERM[page]?allowed(PAGE_TO_PERM[page]):true));
    if(!okNow){ setPage(isAdmin?'overview':((visSecs[0]&&visSecs[0].page)||null)); }
  },[perms]);
  const nav=(pg)=>{
    setPage(pg); setMnav(false);
    if(pg==='ops') markOrdersSeen();            // informativo: se limpia al entrar (por usuario)
    data.onOpenQueue && data.onOpenQueue(pg);   // marca leídas las notifs de esa cola
  };
  const roFor=(pg)=>{ const k=PAGE_TO_PERM[pg]; return k?levelOf(k)==='view':false; }; // solo lectura
  const curRO=roFor(page);
  const pageAllowed = page==null ? true : page==='team' ? isAdmin : page==='users' ? usersEntryAllowed : (PAGE_TO_PERM[page] ? allowed(PAGE_TO_PERM[page]) : true);
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
              <div className={`sbi ${(page===item.page || (item.page==='users' && (page==='verif'||page==='plans')))?'on':''}`} onClick={()=>nav(item.page)}>
                <span className="sbic">{item.icon}</span>
                <span className="sbil">{item.label}</span>
                {menuBadge(item)>0 && <span style={{marginLeft:'auto',minWidth:18,height:18,borderRadius:999,background:G,color:'#000',fontSize:10.5,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',padding:'0 5px',flexShrink:0}}>{menuBadge(item)>99?'99+':menuBadge(item)}</span>}
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
              {(page==='users'||page==='verif'||page==='plans')&&<UsersHub toast={add} meId={data.meId} onViewProfile={data.onViewProfile} onOpenChat={data.onOpenChat} onResolved={loadPending}
                initialTab={page==='verif'?'verif':page==='plans'?'plans':'all'}
                access={{ users:levelOf('users'), verif:levelOf('verifications'), plans:levelOf('plans') }}/>}
              {page==='editor'&&(curRO
                ? <fieldset disabled style={{border:'none',padding:0,margin:0,minWidth:0}}>
                    <div style={{margin:'0 0 12px',padding:'10px 14px',borderRadius:10,background:'var(--bg2)',border:'1px solid var(--bd2)',fontSize:12,fontWeight:700,color:'var(--tx2)'}}>👁 Solo lectura — sin permiso para modificar ni publicar.</div>
                    {/* fieldset[disabled] deshabilita de forma nativa TODOS los inputs, selects y botones del editor. */}
                    <EditorVisual toast={add} cfg={data.cfg} onCfg={()=>add('👁 Solo lectura — no puedes publicar')} onHomeCfg={()=>add('👁 Solo lectura — no puedes publicar')} roHome={true}/>
                  </fieldset>
                : <EditorVisual toast={add} cfg={data.cfg} onCfg={data.onPublishBlocks} onHomeCfg={data.onCfg} roHome={false}/>)}
              {page==='catalogpro'&&<CatalogoPro toast={add} ro={curRO}/>}
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
