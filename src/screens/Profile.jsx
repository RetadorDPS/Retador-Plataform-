import { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo } from "react";
import { Edit2, Trash2 } from "lucide-react";
import { G, Ic, Avatar, avatarUrlOf, uploadAvatar, supabase, getUserById, ratingForName, useAt, useR, usePlatformCfg, signOutUser, uploadKyc, submitVerification, getMyVerification, submitPlanRequest, getMyPlanRequest, KycSelfieSample, getSellerAbout, saveProfileAll, getSellerReviews, getSellerRatingInfo, getProfileHeaderStats } from "../shared/index.js";

// Formato de números grandes del encabezado del perfil: "1K", "2,3K"… (coma
// decimal, como en la captura de referencia). Nunca se abrevia por debajo de 1000.
function fmtBig(n) {
  n = Number(n) || 0;
  if (n < 1000) return String(n);
  const v = Math.round((n / 1000) * 10) / 10;
  const s = Number.isInteger(v) ? String(v) : String(v).replace(".", ",");
  return s + "K";
}

// ─── TIRITA DE TASAS DEL DÍA ──────────────────────────────────────────────────
// Franja discreta con las tasas del día que controla el admin (adminCfg.fx del
// backend). Llega EN VIVO por realtime: si el admin cambia una tasa, esto se
// actualiza solo en todos los teléfonos. Tocable → despliega el detalle.
function FxTirita() {
  const { CARD, B, T1, T2, T3, isDark, ts } = useAt();
  const cfg = usePlatformCfg();
  const fx = cfg.fx || {};
  const [open, setOpen] = useState(false);
  const usd = Number(fx.usdToCup) || 0;
  const eur = Number(fx.eurToCup) || 0;
  if (!usd && !eur) return null; // sin tasas reales → no mostramos nada inventado
  const fmt = n => Math.round(n).toLocaleString("es-ES");
  const rows = [
    usd ? { code: "USD", flag: "🇺🇸", label: "Dólar", val: usd } : null,
    eur ? { code: "EUR", flag: "🇪🇺", label: "Euro",  val: eur } : null,
  ].filter(Boolean);
  const up = cfg.__updatedAt ? new Date(cfg.__updatedAt) : null;
  const updatedTxt = up && !isNaN(up.getTime())
    ? `Actualizado ${up.toLocaleDateString("es-ES", { day: "2-digit", month: "short" })} · ${up.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`
    : "Actualizado por RETADOR";
  const bg = isDark ? "#0d0d0d" : CARD, bd = isDark ? "#1a1a1a" : B;
  return (
    <div onClick={() => setOpen(o => !o)} style={{ background: bg, border: `1px solid ${bd}`, borderRadius: 12, padding: "9px 12px", marginBottom: 14, cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <span style={{ fontSize: 13 * ts, flexShrink: 0 }}>💱</span>
        <span style={{ fontSize: 10.5 * ts, color: T2, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1, minWidth: 0 }}>
          <span style={{ color: T3 }}>Tasas de hoy: </span>
          {rows.map((r, i) => (
            <span key={r.code}>{i > 0 && <span style={{ color: T3 }}> · </span>}1 {r.code} = <span style={{ color: G, fontWeight: 800 }}>{fmt(r.val)}</span> CUP</span>
          ))}
        </span>
        <span style={{ color: T3, fontSize: 11 * ts, flexShrink: 0, transform: open ? "rotate(90deg)" : "none", transition: "transform .15s" }}>›</span>
      </div>
      {open && (
        <div style={{ marginTop: 9, paddingTop: 9, borderTop: `1px solid ${bd}` }}>
          {rows.map(r => (
            <div key={r.code} style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0" }}>
              <span style={{ fontSize: 13 * ts }}>{r.flag}</span>
              <span style={{ fontSize: 11 * ts, color: T1, fontWeight: 700, flex: 1 }}>{r.label} <span style={{ color: T3, fontWeight: 500 }}>(1 {r.code})</span></span>
              <span style={{ fontSize: 12 * ts, color: G, fontWeight: 800 }}>{fmt(r.val)} CUP</span>
            </div>
          ))}
          <p style={{ fontSize: 8.5 * ts, color: T3, marginTop: 6, marginBottom: 0 }}>{updatedTxt}</p>
        </div>
      )}
    </div>
  );
}

export function ProfileMain({ user, onMessages, onSettings, onOrders, onViewProfile, onAdmin, onWallet, onTools, onCourier, isOwner, profileData = {}, ordersBadge = 0, messagesBadge = 0, adminBadge = 0 }) {
  const { cols, isMobile, isTablet, isDesktop } = useR();
  const { BG, S, B, CARD, T1, T2, T3, isDark, ts } = useAt();
  const name     = profileData.name || user?.name || "Usuario";
  // Datos REALES: nada inventado. Sin reputación aún → "Nuevo", 0 ventas.
  const rating   = Number(profileData.rating) || 0;
  const sales    = Number(profileData.sales) || 0;
  // Foto de perfil real: del avatar guardado (objeto) o de user.avatar (URL de
  // Google/Supabase). Si no hay, la inicial del nombre. Nunca emoji.
  const avatarSrc = avatarUrlOf(profileData.avatar) || avatarUrlOf(user?.avatar);

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ padding: "22px 18px 110px" }}>

        {/* Avatar/nombre — toca para ver perfil completo */}
        <div onClick={onViewProfile} className="cd" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, background: CARD, border: `1px solid ${B}`, borderRadius: 16, padding: "14px 14px", cursor: "pointer" }}>
          <Avatar url={avatarSrc} name={name} size={56} verified={!!user?.verified} style={{ boxShadow: `0 0 18px ${G}35` }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 15 * ts, fontWeight: 800, color: T1 }}>{name}</p>
            <p style={{ fontSize: 10 * ts, color: T2, marginTop: 2 }}>{user?.email || "Ver perfil completo"}</p>
            <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 9 * ts, fontWeight: 700, color: "#9A7C2A", background: "#9A7C2A18", border: "1px solid #9A7C2A30", borderRadius: 4, padding: "2px 7px" }}>FREE</span>
              {/* Condición del staff: el usuario debe saber que es admin o equipo. */}
              {user?.role === "admin"
                ? <span style={{ fontSize: 9 * ts, fontWeight: 800, color: G, background: `${G}1c`, border: `1px solid ${G}40`, borderRadius: 4, padding: "2px 7px" }}>👑 Administrador</span>
                : isOwner
                  ? <span style={{ fontSize: 9 * ts, fontWeight: 800, color: "#A78BFA", background: "#A78BFA1c", border: "1px solid #A78BFA40", borderRadius: 4, padding: "2px 7px" }}>🛡️ Equipo RETADOR</span>
                  : null}
              <span style={{ fontSize: 9 * ts, color: T3 }}>{rating > 0 ? `⭐ ${rating}` : "⭐ Nuevo"} · {sales} {sales === 1 ? "venta" : "ventas"}</span>
            </div>
          </div>
          <span style={{ color: T3, fontSize: 18 }}>›</span>
        </div>

        {/* Tirita de tasas del día (discreta, en vivo, controlada por el admin) */}
        <FxTirita />

        {[
          { ic: "msg",  label: "Mensajes",       sub: "Chats y conversaciones",     action: onMessages, color: G, badge: messagesBadge },
          { ic: "pkg",  label: "Mis pedidos",     sub: "Compras y ventas",           action: onOrders,   color: "#60A5FA", badge: ordersBadge },
          { ic: "wallet", label: "Mi billetera",  sub: "Enviar, recibir, pagar y convertir", action: onWallet, color: "#22C55E" },
          { ic: "tools", label: "Herramientas",  sub: "Importador inteligente y más", action: onTools, color: "#6EE7B7" },
          { ic: "moto", label: "Modo Mensajero",  sub: "Gana dinero repartiendo pedidos", action: onCourier, color: "#6366F1" },
          { ic: "cog",  label: "Configuración",   sub: "Cuenta, privacidad, nombre", action: onSettings, color: "#94A3B8" },
          ...(isOwner ? [{ ic: "shield", label: "Panel de administración", sub: "Control total de la plataforma", action: onAdmin, color: "#F5A623", badge: adminBadge }] : []),
        ].map((it, i) => (
          <div key={i} className={it.action ? "cd" : ""} onClick={it.action || undefined}
            style={{ display: "flex", alignItems: "center", gap: 13, padding: "12px 14px", marginBottom: 7,
              background: isDark ? "#0d0d0d" : S, border: `1px solid ${B}`, borderRadius: 14,
              opacity: it.action ? 1 : 0.6 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12,
              background: isDark ? it.color + "22" : it.color + "18",
              border: `1.5px solid ${it.color}55`,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Ic n={it.ic} c={it.color} s={19} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13 * ts, fontWeight: 700, color: T1 }}>{it.label}</p>
              <p style={{ fontSize: 9 * ts, color: T2, marginTop: 1 }}>{it.sub}</p>
            </div>
            {it.badge > 0 && (
              <span style={{ minWidth: 18, height: 18, borderRadius: 999, background: "#EF4444", color: "#fff", fontSize: 10.5 * ts, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px", marginRight: 2 }}>
                {it.badge > 99 ? "99+" : it.badge}
              </span>
            )}
            {it.action
              ? <span style={{ color: T3, fontSize: 18, fontWeight: 300 }}>›</span>
              : <span style={{ fontSize: 8 * ts, color: T2, fontWeight: 700, background: isDark ? "#141414" : B, borderRadius: 6, padding: "3px 7px" }}>PRONTO</span>
            }
          </div>
        ))}
      </div>
    </div>
  );
}

// PANEL LATERAL del Perfil: se abre con ☰ desde la vista principal del perfil y
// contiene TODO lo que antes estaba apilado (Mensajes, Pedidos, Billetera,
// Herramientas, Modo mensajero, Configuración, Panel admin). Respeta permisos:
// el Panel de administración solo aparece si isOwner.
export function ProfileMenuDrawer({ open, onClose, user, isOwner, onMessages, onOrders, onWallet, onTools, onCourier, onSettings, onAdmin, messagesBadge = 0, ordersBadge = 0, adminBadge = 0 }) {
  const { BG, S, B, T1, T2, T3, isDark } = useAt();
  const items = [
    { ic: "msg",    label: "Mensajes",                sub: "Chats y conversaciones",              action: onMessages, color: G,         badge: messagesBadge },
    { ic: "pkg",    label: "Mis pedidos",             sub: "Compras y ventas",                    action: onOrders,   color: "#60A5FA",  badge: ordersBadge },
    { ic: "wallet", label: "Mi billetera",            sub: "Enviar, recibir, pagar y convertir",  action: onWallet,   color: "#22C55E" },
    { ic: "tools",  label: "Herramientas",            sub: "Importador inteligente y más",        action: onTools,    color: "#6EE7B7" },
    { ic: "moto",   label: "Modo Mensajero",          sub: "Gana dinero repartiendo pedidos",     action: onCourier,  color: "#6366F1" },
    { ic: "cog",    label: "Configuración",           sub: "Cuenta, privacidad, nombre",          action: onSettings, color: "#94A3B8" },
    ...(isOwner ? [{ ic: "shield", label: "Panel de administración", sub: "Control total de la plataforma", action: onAdmin, color: "#F5A623", badge: adminBadge }] : []),
  ];
  const go = (a) => { onClose && onClose(); if (a) a(); };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 4600, pointerEvents: open ? "auto" : "none" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.5)", opacity: open ? 1 : 0, transition: "opacity .25s" }} />
      <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: "82%", maxWidth: 330, background: BG, borderRight: `1px solid ${B}`, transform: open ? "translateX(0)" : "translateX(-100%)", transition: "transform .28s cubic-bezier(.4,0,.2,1)", display: "flex", flexDirection: "column", paddingTop: "env(safe-area-inset-top,0px)", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 16px 10px" }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: T1 }}>Menú</span>
          <button onClick={onClose} style={{ background: "transparent", border: `1px solid ${B}`, color: T2, width: 30, height: 30, borderRadius: "50%", cursor: "pointer", fontSize: 15 }}>×</button>
        </div>
        <div style={{ padding: "0 12px 24px" }}>
          {items.map((it, i) => (
            <div key={i} onClick={() => go(it.action)} style={{ display: "flex", alignItems: "center", gap: 13, padding: "12px 12px", marginBottom: 7, background: isDark ? "#0d0d0d" : S, border: `1px solid ${B}`, borderRadius: 14, cursor: "pointer" }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: isDark ? it.color + "22" : it.color + "18", border: `1.5px solid ${it.color}55`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Ic n={it.ic} c={it.color} s={19} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: T1 }}>{it.label}</p>
                <p style={{ fontSize: 9.5, color: T2, marginTop: 1 }}>{it.sub}</p>
              </div>
              {it.badge > 0 && <span style={{ minWidth: 18, height: 18, borderRadius: 999, background: "#EF4444", color: "#fff", fontSize: 10.5, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>{it.badge > 99 ? "99+" : it.badge}</span>}
              <span style={{ color: T3, fontSize: 18, fontWeight: 300 }}>›</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MENSAJES — usa RPC get_my_conversations (1 sola query)
// ═════════════════════════════════════════════════════════════════════════════
// ═════════════════════════════════════════════════════════════════════════════
// FREE PROFILE — Perfil completo del usuario (Motor de Arranque)
// ═════════════════════════════════════════════════════════════════════════════
// ─────────────────────────────────────────────────────────────────
//  INTEGRATION POINT — auth
//  const isOwner = useAuth().currentUser?.id === profile.ownerId
// ─────────────────────────────────────────────────────────────────
const FP_MOCK_IS_OWNER = true;

// ── DESIGN TOKENS — MISMA base neutra que el resto de la app (DARK_T/LIGHT_T) +
// acento dorado de la identidad (nada de tono azulado propio). ─────────────────
const FP_DARK = {
  bg:          "#080808",
  surface:     "#0f0f0f",
  surfaceHigh: "#141414",
  surfaceTop:  "#1a1a1a",
  border:      "#1a1a1a",
  borderMid:   "#262626",
  borderHigh:  "#333333",
  accent:      "#FFC01E",
  accentSoft:  "#2A2100",
  accentText:  "#FFC01E",
  // Color dedicado del sello "Pro" — en oscuro el dorado de siempre luce bien,
  // así que se mantiene igual al accent general.
  pro:      "#FFC01E",
  proSoft:  "#2A2100",
  proText:  "#FFC01E",
  textPrimary:   "#f0f0f0",
  textSecondary: "#888888",
  textMuted:     "#3a3a3a",
  positive: "#19C37D", positiveDim: "#0D2218",
  warning:  "#D4982A", warningDim:  "#261C08",
  danger:   "#E05252", dangerDim:   "#280E0E",
};
const FP_LIGHT = {
  bg:          "#FFFFFF",
  surface:     "#FFFFFF",
  surfaceHigh: "#F2F3F5",
  surfaceTop:  "#F2F3F5",
  border:      "#E4E6EB",
  borderMid:   "#D9DBDF",
  borderHigh:  "#BCC0C4",
  accent:      "#B8860B",
  accentSoft:  "#FFF6DF",
  accentText:  "#8A6D00",
  // El dorado del sello "Pro" choca sobre fondo blanco — en tema claro usa un
  // morado elegante propio (no reutiliza el accent general de botones/inputs).
  pro:      "#7C3AED",
  proSoft:  "#F3E8FF",
  proText:  "#6D28D9",
  textPrimary:   "#050505",
  textSecondary: "#65676B",
  textMuted:     "#8A8D91",
  positive: "#19C37D", positiveDim: "#E6FAF3",
  warning:  "#D4982A", warningDim:  "#FFF8E6",
  danger:   "#E05252", dangerDim:   "#FFF0F0",
};
const useFP_C = () => { const { isDark } = useAt(); return isDark ? FP_DARK : FP_LIGHT; };
const FP_C = FP_DARK; // backwards compat for module-level use
const FP_FH = "'Outfit', sans-serif";
const FP_FB = "'DM Sans', sans-serif";

// ── SVG ICON SYSTEM ───────────────────────────────────────────────
const FP_Icon = ({ d, size=16, color="currentColor", strokeWidth=1.6, fill="none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
    fill={fill} stroke={color} strokeWidth={strokeWidth}
    strokeLinecap="round" strokeLinejoin="round">
    <path d={d}/>
  </svg>
);

const FP_Icons = {
  back:     "M19 12H5M5 12l7 7M5 12l7-7",
  edit:     "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  settings: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
  star:     "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  heart:    "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
  message:  "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
  plus:     "M12 5v14M5 12h14",
  check:    "M20 6L9 17l-5-5",
  x:        "M18 6L6 18M6 6l12 12",
  chevronR: "M9 18l6-6-6-6",
  chevronD: "M6 9l6 6 6-6",
  camera:   "M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2zM12 17a4 4 0 100-8 4 4 0 000 8z",
  user:     "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  package:  "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12",
  zap:      "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  shield:   "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  bell:     "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0",
  lock:     "M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4",
  logout:   "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  trash:    "M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6",
  mail:     "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
  key:      "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4",
  file:     "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  instagram:"M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zM17.5 6.5h.01M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5z",
  facebook: "M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z",
  music:    "M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zM21 16a3 3 0 11-6 0 3 3 0 016 0z",
  globe:    "M12 22a10 10 0 110-20 10 10 0 010 20zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z",
  truck:    "M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 21a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM18.5 21a1.5 1.5 0 100-3 1.5 1.5 0 000 3z",
  calendar: "M3 4h18v18H3zM16 2v4M8 2v4M3 10h18",
  eye:      "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 100-6 3 3 0 000 6z",
  handshake:"M18 11V6l-3 3M6 11V6l3 3M2 12h20M6 13v5M18 13v5M10 12v6M14 12v6",
  radio:    "M12 22a10 10 0 110-20 10 10 0 010 20zM12 6a6 6 0 110 12A6 6 0 0112 6zM12 10a2 2 0 110 4 2 2 0 010-4z",
};

// Star with fill support
const FP_StarIcon = ({ filled, size=14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
    fill={filled ? FP_C.warning : "none"}
    stroke={filled ? FP_C.warning : FP_C.borderMid}
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

function FP_StarRow({ count, size=14, interactive=false, onSet }) {
  const FP_C = useFP_C();
  const [hov, setHov] = useState(0);
  return (
    <span style={{ display:"inline-flex", gap:3 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ cursor: interactive ? "pointer" : "default" }}
          onMouseEnter={() => interactive && setHov(i)}
          onMouseLeave={() => interactive && setHov(0)}
          onClick={() => interactive && onSet && onSet(i)}>
          <FP_StarIcon filled={(interactive ? (hov || count) : count) >= i} size={size}/>
        </span>
      ))}
    </span>
  );
}

// ── MOCK DATA ─────────────────────────────────────────────────────
const FP_INITIAL_REVIEWS = [
  { id:1, user:"María G.",  stars:5, text:"Llegó rápido, exactamente como en la foto. Muy recomendado.", date:"hace 2 días" },
  { id:2, user:"Carlos R.", stars:4, text:"Muy buena calidad, responde rápido. Sin problemas.",          date:"hace 1 semana" },
  { id:3, user:"Sofía M.",  stars:5, text:"Vendedor confiable, volvería a comprar sin duda.",            date:"hace 2 semanas" },
  { id:4, user:"Andrés P.", stars:5, text:"Todo perfecto, llegó antes de lo esperado.",                  date:"hace 1 mes" },
];

const FP_PRODUCTS = [
  { id:1, name:"Tenis Nike Air Max",  price:"$1,200", emoji:"👟", sales:14, tag:"Popular"    },
  { id:2, name:"Mochila Urbana",      price:"$580",   emoji:"🎒", sales:7,  tag:null          },
  { id:3, name:"Audífonos Bluetooth", price:"$890",   emoji:"🎧", sales:22, tag:"Más vendido" },
  { id:4, name:"Gorra Streetwear",    price:"$320",   emoji:"🧢", sales:3,  tag:null          },
  { id:5, name:"Camisa Casual",       price:"$450",   emoji:"👕", sales:9,  tag:null          },
  { id:6, name:"Reloj Vintage",       price:"$1,650", emoji:"⌚", sales:5,  tag:"Nuevo"       },
];


const FP_SHIPPING_OPTS = ["Mismo día","1–2 días hábiles","1–3 días hábiles","3–5 días hábiles","Con el comprador"];
const FP_RESPONSE_OPTS = ["Menos de 1 hora","Aprox. 2 horas","Aprox. 4 horas","Mismo día","1–2 días"];

// ── BASE UI COMPONENTS ────────────────────────────────────────────
const fpInputStyle = (FP_C) => ({
  width:"100%", background:FP_C.surfaceTop, border:`1px solid ${FP_C.border}`,
  borderRadius:8, padding:"10px 12px", fontSize:13, color:FP_C.textPrimary,
  fontFamily:FP_FB, outline:"none", boxSizing:"border-box",
  transition:"border-color 0.15s",
});

function FP_Label({ children }) {
  const FP_C = useFP_C();
  return <div style={{ fontSize:10, fontWeight:700, color:FP_C.textSecondary, fontFamily:FP_FH,
    letterSpacing:"0.7px", textTransform:"uppercase", marginBottom:6 }}>{children}</div>;
}
function FP_Field({ label, children }) {
  const FP_C = useFP_C();
  return <div style={{ marginBottom:14 }}><FP_Label>{label}</FP_Label>{children}</div>;
}
function FP_SectionHead({ children }) {
  const FP_C = useFP_C();
  return <div style={{ fontSize:10, fontWeight:700, color:FP_C.textMuted, fontFamily:FP_FH,
    letterSpacing:"0.7px", textTransform:"uppercase", marginBottom:10 }}>{children}</div>;
}
function FP_Divider() {
  const FP_C = useFP_C();
  return <div style={{ height:1, background:FP_C.border }}/>;
}
function FP_Toggle({ on, onChange }) {
  const FP_C = useFP_C();
  return (
    <div onClick={onChange} style={{ width:38, height:20, borderRadius:10, flexShrink:0,
      background: on ? FP_C.accent : FP_C.borderMid,
      position:"relative", transition:"background 0.2s", cursor:"pointer" }}>
      <div style={{ width:14, height:14, borderRadius:"50%", background:"#fff",
        position:"absolute", top:3, left: on ? 21 : 3,
        transition:"left 0.2s", boxShadow:"0 1px 3px rgba(0,0,0,0.5)" }}/>
    </div>
  );
}
function FP_Btn({ children, variant="primary", onClick, disabled=false, style={} }) {
  const FP_C = useFP_C();
  const styles = {
    primary:   { background: FP_C.accent,       border:"none",                         color:"#fff" },
    secondary: { background: FP_C.surfaceTop,   border:`1px solid ${FP_C.borderMid}`,     color:FP_C.textSecondary },
    ghost:     { background: "transparent",  border:`1px solid ${FP_C.border}`,        color:FP_C.textSecondary },
    danger:    { background: FP_C.dangerDim,    border:`1px solid ${FP_C.danger}33`,      color:FP_C.danger },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...styles[variant], borderRadius:8, padding:"10px 16px",
      fontSize:13, fontWeight:600, fontFamily:FP_FH, cursor:disabled?"not-allowed":"pointer",
      opacity:disabled?0.4:1, transition:"opacity 0.15s, background 0.15s",
      ...style,
    }}>{children}</button>
  );
}
function FP_Row({ children, border=false, onClick, style={} }) {
  const FP_C = useFP_C();
  return (
    <div onClick={onClick} style={{ display:"flex", alignItems:"center",
      justifyContent:"space-between", padding:"12px 16px",
      borderBottom: border ? `1px solid ${FP_C.border}` : "none",
      cursor: onClick ? "pointer" : "default", ...style }}>
      {children}
    </div>
  );
}

// ── AVATAR ────────────────────────────────────────────────────────
// Reutiliza el Avatar único de la app: foto si hay; si no, inicial en círculo de
// color. Nunca emoji.
function FP_Avatar({ avatar, name, size=72, verified=false }) {
  return <Avatar avatar={avatar} name={name} size={size} verified={verified} />;
}

// ── AVATAR PICKER (SOLO FOTO) ─────────────────────────────────────
// Ya no hay emojis: el avatar SOLO puede ser una foto. Se sube de verdad al
// bucket 'avatars' (uploadAvatar) y se guarda su URL pública.
function FP_AvatarPicker({ current, onSelect, onClose, userId, name }) {
  const FP_C = useFP_C();
  const [fileErr, setFileErr] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setFileErr("La imagen supera los 5 MB. Elige una más liviana."); return; }
    setFileErr(""); setUploading(true);
    try {
      const url = await uploadAvatar(file, userId);
      onSelect({ type: "image", value: url });
    } catch (err) {
      setFileErr("No se pudo subir la foto: " + (err?.message || "intenta de nuevo"));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const hasPhoto = avatarUrlOf(current);
  return (
    <div style={{ position:"fixed", inset:0, zIndex:600,
      background:FP_C.bg, display:"flex", flexDirection:"column" }}>
      {/* Top bar */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 20px", height:50, flexShrink:0,
        borderBottom:`1px solid ${FP_C.border}` }}>
        <button onClick={onClose} style={{ background:"none", border:"none",
          cursor:"pointer", display:"flex", alignItems:"center", gap:8,
          color:FP_C.textSecondary, padding:0 }}>
          <FP_Icon d={FP_Icons.back} size={18} color={FP_C.textSecondary}/>
          <span style={{ fontSize:13, fontWeight:600, fontFamily:FP_FB }}>Cancelar</span>
        </button>
        <span style={{ fontFamily:FP_FH, fontWeight:700, fontSize:14, color:FP_C.textPrimary }}>
          Foto de perfil
        </span>
        <div style={{ width:80 }}/>
      </div>

      <div style={{ flex:1, display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", gap:20, padding:32 }}>
        <input ref={fileRef} type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display:"none" }} onChange={handleFile}/>

        <div onClick={() => !uploading && fileRef.current.click()} style={{
          width:120, height:120, borderRadius:"50%",
          background:FP_C.surfaceTop, border:`2px dashed ${FP_C.borderMid}`,
          display:"flex", alignItems:"center", justifyContent:"center",
          overflow:"hidden", cursor: uploading ? "default" : "pointer", position:"relative",
        }}>
          {hasPhoto
            ? <img src={hasPhoto} alt="preview" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
            : <Avatar name={name} size={116} />}
          {uploading && <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:12, fontWeight:700 }}>Subiendo…</div>}
        </div>

        <div style={{ textAlign:"center" }}>
          <FP_Btn onClick={() => !uploading && fileRef.current.click()} style={{ marginBottom:10 }}>
            {uploading ? "Subiendo…" : (hasPhoto ? "Cambiar foto" : "Seleccionar imagen")}
          </FP_Btn>
          <div style={{ fontSize:11, color:FP_C.textMuted }}>JPG, PNG o WEBP · Máx. 5 MB</div>
          {fileErr && <div style={{ fontSize:11.5, color:"#ef4444", marginTop:8, fontWeight:600 }}>{fileErr}</div>}
        </div>

        {hasPhoto && !uploading && (
          <FP_Btn variant="ghost" onClick={() => onSelect(null)}>
            Quitar foto
          </FP_Btn>
        )}
      </div>
    </div>
  );
}

// ── PRODUCT CARD ──────────────────────────────────────────────────
const FP_TAG_STYLE = {
  "Más vendido": { bg:FP_C.warningDim,  color:FP_C.warning,  border:"#3D2D0A" },
  "Popular":     { bg:FP_C.positiveDim, color:FP_C.positive, border:"#0D2218" },
  "Nuevo":       { bg:FP_C.accentSoft,  color:FP_C.accentText, border:"#1A2550" },
};

function FP_ProductCard({ product, onClick, onDelete, onEdit, onPromote }) {
  const FP_C = useFP_C();
  const [liked, setLiked] = useState(false);
  const tc = FP_TAG_STYLE[product.tag] || {};
  const own = !!(onDelete || onEdit);
  const rejected = product.moderation_status === "rejected";
  const rejectReason = product.moderation_reason || product.rejection_reason || product.rejected_reason || "";
  const isService = product.kind === "service";
  const ownBtn = { background:"rgba(0,0,0,.35)", backdropFilter:"blur(6px)", WebkitBackdropFilter:"blur(6px)", borderRadius:8, width:28, height:28, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" };
  return (
    <div onClick={onClick} style={{ background:FP_C.surface, borderRadius:10, overflow:"hidden",
      border:`1px solid ${FP_C.border}`, cursor:"pointer", position:"relative",
      transition:"border-color 0.15s, transform 0.15s" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor=FP_C.borderMid; e.currentTarget.style.transform="translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor=FP_C.border; e.currentTarget.style.transform="none"; }}>

      {(product.tag || product.badge) && (
        <div style={{ position:"absolute", top:8, left:8, zIndex:2,
          background:tc.bg || "rgba(245,166,35,.9)", border:`1px solid ${tc.border || "transparent"}`,
          color:tc.color || "#111", borderRadius:4, padding:"2px 7px",
          fontSize:9, fontWeight:700, fontFamily:FP_FH, letterSpacing:"0.4px" }}>
          {(product.tag || product.badge).toUpperCase()}
        </div>
      )}

      {own ? (
        <div style={{ position:"absolute", top:8, right:8, zIndex:2, display:"flex", gap:6 }}>
          {onPromote && !product.promoted && (
            <button title="Destacar" onClick={e => { e.stopPropagation(); onPromote(); }} style={{ ...ownBtn, border:`1px solid rgba(255,192,30,.6)`, background:"rgba(255,192,30,.16)" }}>
              <span style={{ fontSize:13, lineHeight:1 }}>⭐</span>
            </button>
          )}
          {onEdit && (
            <button onClick={e => { e.stopPropagation(); onEdit(); }} style={{ ...ownBtn, border:`1px solid rgba(255,255,255,.28)` }}>
              <Edit2 size={13} color="#fff" />
            </button>
          )}
          {onDelete && (
            <button onClick={e => { e.stopPropagation(); onDelete(); }} style={{ ...ownBtn, border:`1px solid rgba(239,68,68,.55)`, background:"rgba(239,68,68,.12)" }}>
              <Trash2 size={13} color="#ef4444" />
            </button>
          )}
        </div>
      ) : (
      <button onClick={e => { e.stopPropagation(); setLiked(!liked); }} style={{
        position:"absolute", top:8, right:8, zIndex:2,
        background:"rgba(8,10,16,0.7)", backdropFilter:"blur(6px)",
        border:`1px solid ${FP_C.border}`, borderRadius:6,
        width:28, height:28, cursor:"pointer", display:"flex",
        alignItems:"center", justifyContent:"center",
      }}>
        <FP_Icon d={FP_Icons.heart} size={14}
          color={liked ? FP_C.danger : FP_C.textSecondary}
          fill={liked ? FP_C.danger : "none"}/>
      </button>
      )}

      {isService && (
        <div style={{ position:"absolute", top:8, left:8, zIndex:2, background:"rgba(255,192,30,.9)", color:"#111", borderRadius:4, padding:"2px 7px", fontSize:9, fontWeight:800, fontFamily:FP_FH }}>🛠️ SERVICIO</div>
      )}
      <div style={{ height:110, background:FP_C.surfaceHigh, position:"relative",
        display:"flex", alignItems:"center", justifyContent:"center", fontSize:44, overflow:"hidden" }}>
        {product.image ? <img src={product.image} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", filter: rejected ? "grayscale(1) brightness(.5)" : "none" }} onError={e => e.target.style.display="none"}/> : (product.emoji || (isService ? "🛠️" : "📦"))}
        {rejected && (
          <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.45)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"0 10px", textAlign:"center" }}>
            <span style={{ fontSize:11, fontWeight:800, color:"#ff6b6b" }}>🚫 Retirado</span>
            {rejectReason && <span style={{ fontSize:9, color:"#fff", marginTop:2, lineHeight:1.3, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{rejectReason}</span>}
            <span style={{ fontSize:8, color:"rgba(255,255,255,.7)", marginTop:3 }}>Edítalo para volver a publicarlo</span>
          </div>
        )}
      </div>

      <div style={{ padding:"10px 12px 13px" }}>
        <div style={{ fontSize:12, fontWeight:500, color:FP_C.textSecondary,
          fontFamily:FP_FB, lineHeight:1.3, marginBottom:4, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
          {product.name || product.title}
        </div>
        <div style={{ fontSize:16, fontWeight:700, color:FP_C.textPrimary, fontFamily:FP_FH }}>
          {typeof product.price === "number" ? "$" + product.price.toLocaleString() : product.price}
        </div>
        {product.sales != null && <div style={{ fontSize:10, color:FP_C.textMuted, marginTop:3 }}>
          {product.sales} vendidos
        </div>}
      </div>
    </div>
  );
}

// NOTA: el viejo formulario de reseñas de esta pantalla (con un campo libre
// "Tu nombre" y que nunca guardaba nada en ningún backend) se quitó de aquí.
// Las reseñas ahora son reales (tabla reviews: product_id/user_id/rating/
// comment) y se escriben desde la ficha del producto reseñado —ver
// ProductReviews en Marketplace.jsx—, nunca desde el perfil del vendedor en
// general (un perfil no tiene un solo product_id al que atribuir la reseña).
// Esta pestaña ahora solo MUESTRA, en modo lectura, las reseñas reales de
// todos los productos de este vendedor (con nombre/avatar reales).

// ── PRO MODAL ─────────────────────────────────────────────────────
function FP_ProModal({ onClose, onSeePlans }) {
  const FP_C = useFP_C();
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0,
      background:"rgba(0,0,0,0.85)", backdropFilter:"blur(16px)",
      zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:"#0A0B14", border:"1px solid #1E1A40",
        borderRadius:16, width:"100%", maxWidth:400,
        overflow:"hidden", boxShadow:"0 40px 100px rgba(0,0,0,0.8)",
      }}>
        <div style={{ background:"linear-gradient(160deg,#0A0A18,#12103A)",
          padding:"28px 24px 24px", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:-60, right:-30, width:220, height:220,
            borderRadius:"50%", background:"rgba(80,60,200,0.08)", filter:"blur(40px)" }}/>
          <div style={{ position:"relative" }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:6,
              background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.2)",
              borderRadius:6, padding:"4px 10px", marginBottom:14 }}>
              <span style={{ fontSize:10, fontWeight:700, color:"#A78BFA",
                fontFamily:FP_FH, letterSpacing:"0.8px" }}>PRO PLAN</span>
            </div>
            <div style={{ fontSize:22, fontWeight:800, color:"#fff",
              fontFamily:FP_FH, marginBottom:4 }}>
              Tienda profesional
            </div>
            <div style={{ fontSize:13, color:"#4A5270", marginBottom:20, fontFamily:FP_FB }}>
              Todo lo que necesitas para escalar tus ventas.
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {[
                [FP_Icons.package,  "Página de tienda"],
                [FP_Icons.eye,      "Tema de marca"],
                [FP_Icons.zap,      "Analytics en vivo"],
                [FP_Icons.shield,   "Badge verificado"],
                [FP_Icons.plus,     "Productos ilimitados"],
                [FP_Icons.star,     "IA asistente"],
              ].map(([icon, label]) => (
                <div key={label} style={{ background:"rgba(255,255,255,0.03)",
                  border:"1px solid rgba(255,255,255,0.05)",
                  borderRadius:8, padding:"9px 12px",
                  display:"flex", alignItems:"center", gap:8 }}>
                  <FP_Icon d={icon} size={14} color="#5A6480"/>
                  <span style={{ fontSize:12, color:"#5A6480", fontFamily:FP_FB }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ padding:"20px 24px 24px" }}>
          <FP_Btn onClick={onSeePlans} style={{ width:"100%", marginBottom:8,
            background:"linear-gradient(135deg,#5B45D4,#7C3AED)",
            boxShadow:"0 4px 20px rgba(91,69,212,0.3)" }}>
            Ver planes Pro
          </FP_Btn>
          <FP_Btn variant="secondary" onClick={onClose} style={{ width:"100%" }}>
            Ahora no
          </FP_Btn>
        </div>
      </div>
    </div>
  );
}

// ── CHANGE PASSWORD SCREEN ────────────────────────────────────────
function FP_ChangePasswordScreen({ hasPassword, onBack }) {
  const FP_C = useFP_C();
  // hasPassword: false = usuario aún no tiene contraseña configurada (entra directo a la app)
  //              true  = tiene contraseña y quiere cambiarla
  // INTEGRATION POINT: GET /api/user → { hasPassword: boolean }

  const [currentPw,  setCurrentPw]  = useState("");
  const [newPw,      setNewPw]      = useState("");
  const [confirmPw,  setConfirmPw]  = useState("");
  const [showCur,    setShowCur]    = useState(false);
  const [showNew,    setShowNew]    = useState(false);
  const [showConf,   setShowConf]   = useState(false);
  const [error,      setError]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [done,       setDone]       = useState(false);

  // Password strength
  function strength(pw) {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 8)         s++;
    if (/[A-Z]/.test(pw))       s++;
    if (/[0-9]/.test(pw))       s++;
    if (/[^A-Za-z0-9]/.test(pw))s++;
    return s;
  }
  const str = strength(newPw);
  const strLabel = ["","Débil","Regular","Buena","Fuerte"][str];
  const strColor = [FP_C.textMuted, FP_C.danger, FP_C.warning, FP_C.accentText, FP_C.positive][str];

  const mismatch = confirmPw && newPw !== confirmPw;
  const canSubmit =
    (!hasPassword || currentPw.length >= 1) &&
    newPw.length >= 8 && str >= 2 && !mismatch && !loading;

  function handleSubmit() {
    if (!canSubmit) return;
    setError("");
    setLoading(true);
    // INTEGRATION POINT:
    // Si hasPassword:   POST /api/user/change-password  { currentPassword, newPassword }
    // Si !hasPassword:  POST /api/user/set-password     { newPassword }
    // On error: setError("Contraseña actual incorrecta")
    setTimeout(() => { setLoading(false); setDone(true); }, 1200);
  }

  const eyeBtn = (show, setShow) => (
    <button onClick={() => setShow(!show)} style={{
      position:"absolute", right:12, top:"50%",
      transform:"translateY(-50%)",
      background:"none", border:"none", cursor:"pointer", padding:2,
    }}>
      <FP_Icon d={show ? FP_Icons.eye : FP_Icons.lock} size={16} color={FP_C.textMuted}/>
    </button>
  );

  return (
    <div style={{ position:"fixed", inset:0, zIndex:600,
      background:FP_C.bg, display:"flex", flexDirection:"column" }}>

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 20px", height:50, flexShrink:0, background:FP_C.bg,
        borderBottom:`1px solid ${FP_C.border}`, position:"sticky", top:0 }}>
        <button onClick={onBack} style={{ background:"none", border:"none",
          cursor:"pointer", display:"flex", alignItems:"center", gap:8, padding:0 }}>
          <FP_Icon d={FP_Icons.back} size={18} color={FP_C.textSecondary}/>
          <span style={{ fontSize:13, fontWeight:600, fontFamily:FP_FB, color:FP_C.textSecondary }}>
            Atrás
          </span>
        </button>
        <span style={{ fontFamily:FP_FH, fontWeight:700, fontSize:14, color:FP_C.textPrimary }}>
          {hasPassword ? "Cambiar contraseña" : "Crear contraseña"}
        </span>
        <div style={{ width:60 }}/>
      </div>

      <div style={{ flex:1, padding:"32px 24px", display:"flex", flexDirection:"column",
        overflowY:"auto" }}>
        {!done ? (
          <>
            <div style={{ marginBottom:28 }}>
              <div style={{ fontSize:16, fontWeight:700, color:FP_C.textPrimary,
                fontFamily:FP_FH, marginBottom:6 }}>
                {hasPassword ? "Actualiza tu contraseña" : "Protege tu cuenta"}
              </div>
              <div style={{ fontSize:13, color:FP_C.textSecondary, lineHeight:1.6 }}>
                {hasPassword
                  ? "Ingresa tu contraseña actual y luego la nueva."
                  : "Si creas una contraseña, se te pedirá cada vez que abras la app."
                }
              </div>
            </div>

            {/* Contraseña actual — solo si ya tiene una */}
            {hasPassword && (
              <FP_Field label="Contraseña actual">
                <div style={{ position:"relative" }}>
                  <input type={showCur ? "text" : "password"}
                    value={currentPw} placeholder="Tu contraseña actual"
                    onChange={e => { setCurrentPw(e.target.value); setError(""); }}
                    onFocus={e => e.target.style.borderColor = FP_C.accent}
                    onBlur={e => e.target.style.borderColor = FP_C.border}
                    style={{ ...fpInputStyle(FP_C), paddingRight:44 }}/>
                  {eyeBtn(showCur, setShowCur)}
                </div>
              </FP_Field>
            )}

            {/* Nueva contraseña */}
            <FP_Field label={hasPassword ? "Nueva contraseña" : "Contraseña"}>
              <div style={{ position:"relative" }}>
                <input type={showNew ? "text" : "password"}
                  value={newPw} placeholder="Mínimo 8 caracteres"
                  onChange={e => { setNewPw(e.target.value); setError(""); }}
                  onFocus={e => e.target.style.borderColor = FP_C.accent}
                  onBlur={e => e.target.style.borderColor = FP_C.border}
                  style={{ ...fpInputStyle(FP_C), paddingRight:44 }}/>
                {eyeBtn(showNew, setShowNew)}
              </div>
              {/* Strength bar */}
              {newPw.length > 0 && (
                <div style={{ marginTop:8 }}>
                  <div style={{ display:"flex", gap:4, marginBottom:5 }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{ flex:1, height:3, borderRadius:2,
                        background: str >= i ? strColor : FP_C.borderMid,
                        transition:"background 0.2s" }}/>
                    ))}
                  </div>
                  <div style={{ fontSize:11, color:strColor, fontWeight:600 }}>
                    {strLabel}
                    {str < 2 && " · Agrega mayúsculas, números o símbolos"}
                  </div>
                </div>
              )}
            </FP_Field>

            {/* Confirmar contraseña */}
            <FP_Field label="Confirmar contraseña">
              <div style={{ position:"relative" }}>
                <input type={showConf ? "text" : "password"}
                  value={confirmPw} placeholder="Repite la contraseña"
                  onChange={e => setConfirmPw(e.target.value)}
                  onFocus={e => e.target.style.borderColor = FP_C.accent}
                  onBlur={e => e.target.style.borderColor =
                    mismatch ? FP_C.danger : FP_C.border}
                  style={{ ...fpInputStyle(FP_C), paddingRight:44,
                    borderColor: mismatch ? FP_C.danger : FP_C.border }}/>
                {eyeBtn(showConf, setShowConf)}
              </div>
              {mismatch && (
                <div style={{ fontSize:11, color:FP_C.danger, marginTop:5 }}>
                  Las contraseñas no coinciden
                </div>
              )}
            </FP_Field>

            {/* Requisitos */}
            <div style={{ background:FP_C.surfaceHigh, border:`1px solid ${FP_C.border}`,
              borderRadius:8, padding:"12px 14px", marginBottom:16 }}>
              <div style={{ fontSize:10, fontWeight:700, color:FP_C.textMuted,
                fontFamily:FP_FH, letterSpacing:"0.5px", textTransform:"uppercase",
                marginBottom:8 }}>
                Requisitos
              </div>
              {[
                { ok: newPw.length >= 8,          text:"Mínimo 8 caracteres" },
                { ok: /[A-Z]/.test(newPw),         text:"Al menos una mayúscula" },
                { ok: /[0-9]/.test(newPw),         text:"Al menos un número" },
                { ok: /[^A-Za-z0-9]/.test(newPw), text:"Al menos un símbolo (!@#…)" },
              ].map((r, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:8,
                  marginBottom:i<3?6:0 }}>
                  <FP_Icon d={r.ok ? FP_Icons.check : FP_Icons.x} size={13}
                    color={r.ok ? FP_C.positive : FP_C.textMuted}/>
                  <span style={{ fontSize:12,
                    color: r.ok ? FP_C.textPrimary : FP_C.textSecondary }}>
                    {r.text}
                  </span>
                </div>
              ))}
            </div>

            {error && (
              <div style={{ background:FP_C.dangerDim, border:`1px solid ${FP_C.danger}33`,
                borderRadius:8, padding:"10px 12px", marginBottom:16,
                fontSize:12, color:FP_C.danger, display:"flex", alignItems:"center", gap:8 }}>
                <FP_Icon d={FP_Icons.x} size={14} color={FP_C.danger}/>
                {error}
              </div>
            )}

            <div style={{ marginTop:"auto", paddingTop:8 }}>
              <FP_Btn onClick={handleSubmit} disabled={!canSubmit}
                style={{ width:"100%", padding:"13px",
                  opacity: loading ? 0.7 : 1 }}>
                {loading
                  ? "Guardando…"
                  : hasPassword ? "Actualizar contraseña" : "Crear contraseña"
                }
              </FP_Btn>
            </div>
          </>
        ) : (
          /* ── SUCCESS ── */
          <div style={{ flex:1, display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center",
            textAlign:"center", gap:16 }}>
            <div style={{ width:64, height:64, borderRadius:"50%",
              background:FP_C.positiveDim, border:`1px solid #0D2218`,
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              <FP_Icon d={FP_Icons.check} size={28} color={FP_C.positive}/>
            </div>
            <div>
              <div style={{ fontSize:17, fontWeight:700, color:FP_C.textPrimary,
                fontFamily:FP_FH, marginBottom:8 }}>
                {hasPassword ? "Contraseña actualizada" : "Contraseña creada"}
              </div>
              <div style={{ fontSize:13, color:FP_C.textSecondary, lineHeight:1.7 }}>
                {hasPassword
                  ? "Tu contraseña fue cambiada correctamente."
                  : "A partir de ahora se te pedirá tu contraseña al abrir la app."
                }
              </div>
            </div>
            <FP_Btn variant="secondary" onClick={onBack} style={{ marginTop:8 }}>
              Volver a configuración
            </FP_Btn>
          </div>
        )}
      </div>
    </div>
  );
}

// ── SETTINGS SCREEN ───────────────────────────────────────────────
function FP_SettingsScreen({ onClose }) {
  const FP_C = useFP_C();
  const [notif,      setNotif]      = useState({ ventas:true, mensajes:true, reseñas:true, promo:false });
  const [privacy,    setPrivacy]    = useState("public");
  const [subScreen,  setSubScreen]  = useState(null); // null | "password"
  const [toast,      setToast]      = useState(null);
  function toast_(msg) { setToast(msg); setTimeout(() => setToast(null), 2500); }

  // INTEGRATION POINT:
  // const { settings, save } = useSettings()   → GET/POST /api/user/settings
  // const { hasPassword }    = useAuth()        → GET /api/user → { hasPassword: bool }
  // onLogout()  → auth.signOut()
  // onDelete()  → DELETE /api/user (con confirmación)
  const hasPassword = false; // INTEGRATION POINT: reemplazar con dato real del backend

  if (subScreen === "password") return <FP_ChangePasswordScreen hasPassword={hasPassword} onBack={() => setSubScreen(null)}/>;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:500,
      background:FP_C.bg, overflowY:"auto", display:"flex", flexDirection:"column" }}>

      {/* Top bar */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 20px", height:50, flexShrink:0, background:FP_C.bg,
        borderBottom:`1px solid ${FP_C.border}`, position:"sticky", top:0, zIndex:10 }}>
        <button onClick={onClose} style={{ background:"none", border:"none",
          cursor:"pointer", display:"flex", alignItems:"center", gap:8,
          color:FP_C.textSecondary, padding:0 }}>
          <FP_Icon d={FP_Icons.back} size={18} color={FP_C.textSecondary}/>
          <span style={{ fontSize:13, fontWeight:600, fontFamily:FP_FB, color:FP_C.textSecondary }}>
            Atrás
          </span>
        </button>
        <span style={{ fontFamily:FP_FH, fontWeight:700, fontSize:14, color:FP_C.textPrimary }}>
          Configuración
        </span>
        <div style={{ width:70 }}/>
      </div>

      <div style={{ padding:"20px 20px 60px" }}>

        {/* Plan banner */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          background:FP_C.accentSoft, border:`1px solid ${FP_C.accent}22`,
          borderRadius:10, padding:"12px 14px", marginBottom:20 }}>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:FP_C.accentText, fontFamily:FP_FH }}>
              Motor de Arranque
            </div>
            <div style={{ fontSize:11, color:FP_C.textSecondary, marginTop:1 }}>
              Plan gratuito activo
            </div>
          </div>
          <div style={{ fontSize:10, fontWeight:700, color:FP_C.accentText, fontFamily:FP_FH,
            background:FP_C.bg, border:`1px solid ${FP_C.accent}33`,
            borderRadius:4, padding:"3px 8px", letterSpacing:"0.5px" }}>
            FREE
          </div>
        </div>

        {/* Privacidad */}
        <div style={{ marginBottom:6 }}><FP_SectionHead>Privacidad</FP_SectionHead></div>
        <div style={{ background:FP_C.surface, border:`1px solid ${FP_C.border}`,
          borderRadius:10, overflow:"hidden", marginBottom:16 }}>
          {[
            { v:"public",  l:"Perfil público",  d:"Cualquiera puede ver tu perfil" },
            { v:"private", l:"Perfil privado",  d:"Solo tus seguidores te ven" },
          ].map((opt, i, arr) => (
            <FP_Row key={opt.v} border={i < arr.length-1} onClick={() => setPrivacy(opt.v)}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <FP_Icon d={FP_Icons.lock} size={15} color={FP_C.textSecondary}/>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:FP_C.textPrimary }}>{opt.l}</div>
                  <div style={{ fontSize:11, color:FP_C.textSecondary, marginTop:1 }}>{opt.d}</div>
                </div>
              </div>
              <div style={{ width:18, height:18, borderRadius:"50%", flexShrink:0,
                border:`2px solid ${privacy===opt.v ? FP_C.accent : FP_C.borderMid}`,
                background: privacy===opt.v ? FP_C.accent : "none",
                display:"flex", alignItems:"center", justifyContent:"center" }}>
                {privacy===opt.v && <div style={{ width:6, height:6, borderRadius:"50%", background:"#fff" }}/>}
              </div>
            </FP_Row>
          ))}
        </div>

        {/* Notificaciones */}
        <div style={{ marginBottom:6 }}><FP_SectionHead>Notificaciones</FP_SectionHead></div>
        <div style={{ background:FP_C.surface, border:`1px solid ${FP_C.border}`,
          borderRadius:10, overflow:"hidden", marginBottom:16 }}>
          {[
            { k:"ventas",   l:"Nuevas ventas",       icon:FP_Icons.package },
            { k:"mensajes", l:"Mensajes recibidos",  icon:FP_Icons.message },
            { k:"reseñas",  l:"Nuevas reseñas",      icon:FP_Icons.star    },
            { k:"promo",    l:"Ofertas y novedades", icon:FP_Icons.bell    },
          ].map((n, i, arr) => (
            <FP_Row key={n.k} border={i < arr.length-1}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <FP_Icon d={n.icon} size={15} color={FP_C.textSecondary}/>
                <span style={{ fontSize:13, color:FP_C.textPrimary }}>{n.l}</span>
              </div>
              <FP_Toggle on={notif[n.k]} onChange={() => setNotif(p => ({...p,[n.k]:!p[n.k]}))}/>
            </FP_Row>
          ))}
        </div>

        {/* Cuenta */}
        <div style={{ marginBottom:6 }}><FP_SectionHead>Cuenta</FP_SectionHead></div>
        <div style={{ background:FP_C.surface, border:`1px solid ${FP_C.border}`,
          borderRadius:10, overflow:"hidden", marginBottom:16 }}>
          <FP_Row border onClick={() => setSubScreen("password")}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <FP_Icon d={FP_Icons.key} size={15} color={FP_C.textSecondary}/>
              <div>
                <div style={{ fontSize:13, color:FP_C.textPrimary }}>
                  {hasPassword ? "Cambiar contraseña" : "Crear contraseña"}
                </div>
                {!hasPassword && (
                  <div style={{ fontSize:10, color:FP_C.textMuted, marginTop:1 }}>
                    Sin contraseña — acceso directo a la app
                  </div>
                )}
              </div>
            </div>
            <FP_Icon d={FP_Icons.chevronR} size={15} color={FP_C.textMuted}/>
          </FP_Row>
          <FP_Row onClick={() => toast_("Términos y privacidad — el texto legal se enlazará aquí antes del lanzamiento")}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <FP_Icon d={FP_Icons.file} size={15} color={FP_C.textSecondary}/>
              <span style={{ fontSize:13, color:FP_C.textPrimary }}>Términos y privacidad</span>
            </div>
            <FP_Icon d={FP_Icons.chevronR} size={15} color={FP_C.textMuted}/>
          </FP_Row>
        </div>

        {/* Zona peligro */}
        <div style={{ background:FP_C.surface, border:`1px solid ${FP_C.border}`,
          borderRadius:10, overflow:"hidden", marginBottom:24 }}>
          <FP_Row border onClick={() => signOutUser()}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <FP_Icon d={FP_Icons.logout} size={15} color={FP_C.warning}/>
              <span style={{ fontSize:13, fontWeight:600, color:FP_C.warning }}>Cerrar sesión</span>
            </div>
          </FP_Row>
          <FP_Row onClick={() => { /* INTEGRATION POINT: DELETE /api/user */ }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <FP_Icon d={FP_Icons.trash} size={15} color={FP_C.danger}/>
              <span style={{ fontSize:13, fontWeight:600, color:FP_C.danger }}>Eliminar cuenta</span>
            </div>
          </FP_Row>
        </div>

        <div style={{ textAlign:"center", fontSize:11, color:FP_C.textMuted, fontFamily:FP_FH }}>
          Motor de Arranque · v1.0.0
        </div>
      </div>

      {/* TOAST */}
      {toast && (
        <div style={{ position:"fixed", top:16, left:"50%", transform:"translateX(-50%)",
          background:FP_C.surfaceTop, color:FP_C.positive,
          border:`1px solid ${FP_C.positiveDim}`,
          borderRadius:8, padding:"9px 16px", fontSize:12, fontWeight:600,
          fontFamily:FP_FH, zIndex:700, boxShadow:"0 8px 24px rgba(0,0,0,0.6)",
          display:"flex", alignItems:"center", gap:8, whiteSpace:"nowrap",
          letterSpacing:"0.2px" }}>
          <FP_Icon d={FP_Icons.check} size={14} color={FP_C.positive}/>
          {toast}
        </div>
      )}
    </div>
  );
}

// ── VERIFICAR MI CUENTA (KYC real) ─────────────────────────────────
function FP_VerifyModal({ user, isVerified, onClose, onSubmit, C, flash }) {
  const TYPES = ["Carnet de identidad", "Pasaporte", "Licencia de conducir"];
  const [loading, setLoading] = useState(true);
  const [myVerif, setMyVerif] = useState(null);
  const [docType, setDocType] = useState("Carnet de identidad");
  // Siempre vacío al abrir: nunca se pre-llena con el nombre de usuario/display,
  // para que la persona escriba a propósito el nombre legal de su documento.
  const [fullName, setFullName] = useState("");
  const [docNum, setDocNum] = useState("");
  const [front, setFront] = useState(null);   // { file, url }
  const [back, setBack]   = useState(null);
  const [selfie, setSelfie] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  // Nunca se abre la cámara directo: siempre se elige "Tomar foto" o "Elegir de
  // galería" en una pequeña hoja de acción, por cada una de las 3 fotos.
  const [pickerFor, setPickerFor] = useState(null); // 'front' | 'back' | 'selfie' | null
  const camRef = useRef(null), libRef = useRef(null);

  useEffect(() => {
    let alive = true;
    if (!user?.id) { setLoading(false); return; }
    getMyVerification(user.id).then(v => { if (alive) { setMyVerif(v); setLoading(false); } }).catch(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [user?.id]);

  const setterFor = (slot) => (slot === "front" ? setFront : slot === "back" ? setBack : setSelfie);
  const photoFor  = (slot) => (slot === "front" ? front : slot === "back" ? back : selfie);
  const onPicked = (e) => {
    const f = e.target.files?.[0];
    const slot = pickerFor;
    e.target.value = ""; // permite re-elegir el mismo archivo más tarde
    setPickerFor(null);
    if (!f || !slot) return;
    setterFor(slot)({ file: f, url: URL.createObjectURL(f) });
  };

  const missingSlots = [!front && "delantera", !back && "trasera", !selfie && "selfie con tu cara"].filter(Boolean);
  const valid = fullName.trim() && docNum.trim() && front && back && selfie;
  const flash_ = flash || (() => {});

  const doSubmit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    // Rutas: ${user.id}/front.jpg, ${user.id}/back.jpg, ${user.id}/selfie.jpg
    // (bucket privado 'kyc', vía uploadKyc) — mismo formato que exige la
    // política del bucket (carpeta = uid del propio usuario).
    let pf, pb, ps;
    try {
      [pf, pb, ps] = await Promise.all([
        uploadKyc(front.file, user.id, "front"),
        uploadKyc(back.file, user.id, "back"),
        uploadKyc(selfie.file, user.id, "selfie"),
      ]);
    } catch (e) {
      flash_("⚠️ No se pudo subir una foto: " + (e?.message || "intenta de nuevo"));
      setSubmitting(false);
      return;
    }
    try {
      // La RPC identifica al usuario con auth.uid() por dentro — elimina el
      // camino de RLS en el INSERT directo (causa real del error reportado).
      await submitVerification({ full_name: fullName.trim(), doc_type: docType, doc_number: docNum.trim(), doc_front: pf, doc_back: pb, selfie: ps });
      onSubmit?.();
      flash_("✅ Solicitud de verificación de perfil enviada — la revisaremos pronto");
      onClose();
    } catch (e) {
      flash_("⚠️ No se pudo enviar la solicitud: " + (e?.message || "intenta de nuevo"));
    }
    setSubmitting(false);
  };

  // Ilustración de muestra compartida (misma que usa el KYC de mensajero) — NO
  // es una foto real de nadie, solo para entender la postura de la selfie.
  const SelfieSample = () => <KycSelfieSample accent={C.accent} surface={C.surface}/>;

  const upBox = (label, slot, hint) => {
    const photo = photoFor(slot);
    return (
      <button onClick={() => setPickerFor(slot)} style={{ flex:1, height: photo ? 128 : 112, borderRadius:10, border:`1.5px dashed ${photo ? C.positive : C.border}`, background:C.surfaceTop, cursor:"pointer", overflow:"hidden", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:5, color:C.textSecondary, fontSize:10.5, fontWeight:700, textAlign:"center", padding:"6px 6px" }}>
        {photo
          ? <img src={photo.url} alt={label} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
          : <><span style={{fontSize:22}}>{hint}</span><span style={{ lineHeight:1.3 }}>{label}</span></>}
      </button>
    );
  };

  const banner = (bg, color, txt) => <div style={{ background:bg, border:`1px solid ${color}44`, borderRadius:12, padding:"14px 14px", color, fontSize:13, fontWeight:700, textAlign:"center", lineHeight:1.5 }}>{txt}</div>;
  const status = myVerif?.status;
  // Puede enviar SIEMPRE que no esté verificado y no tenga una solicitud 'pending'.
  // Da igual si antes fue rechazada o revocada (el backend permite re-solicitar).
  const showForm = !isVerified && status !== "pending";

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:2000, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:C.surface, width:"100%", maxWidth:440, borderRadius:"18px 18px 0 0", padding:"20px 18px 26px", border:`1px solid ${C.border}`, maxHeight:"88vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
          <div style={{ fontSize:16, fontWeight:800, color:C.textPrimary }}>Verificar mi perfil</div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:C.textSecondary, fontSize:22, cursor:"pointer" }}>×</button>
        </div>

        {loading ? <div style={{ textAlign:"center", color:C.textSecondary, fontSize:13, padding:"30px 0" }}>Cargando…</div> : <>
          {isVerified && banner(`${C.positive}14`, C.positive, "✓ Tu perfil ya está verificado")}
          {!isVerified && status === "pending" && banner(`${C.warning}14`, C.warning, "🕐 En revisión. Te avisamos cuando la revisemos.")}
          {!isVerified && status === "rejected" && (
            <div style={{ marginBottom:14 }}>{banner(`${C.danger}14`, C.danger, `🚫 Rechazada${myVerif?.reject_reason ? `: ${myVerif.reject_reason}` : ""} — puedes enviarla de nuevo`)}</div>
          )}
          {!isVerified && status === "revoked" && (
            <div style={{ marginBottom:14 }}>{banner(`${C.warning}14`, C.warning, "Tu verificación fue retirada — puedes volver a solicitarla")}</div>
          )}

          {showForm && <>
            <div style={{ fontSize:12, color:C.textSecondary, margin:"12px 0 16px", lineHeight:1.5 }}>Sube tu documento (frente y reverso) y una selfie sosteniéndolo. Tus documentos son privados: solo el equipo de RETADOR los ve para confirmar tu perfil.</div>
            <div style={{ fontSize:11, fontWeight:700, color:C.textSecondary, marginBottom:6 }}>Tipo de documento</div>
            <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
              {TYPES.map(t => <button key={t} onClick={()=>setDocType(t)} style={{ padding:"8px 12px", borderRadius:8, cursor:"pointer", fontSize:11.5, fontWeight:600, background: docType===t ? `${C.accent}1a` : C.surfaceTop, border:`1.5px solid ${docType===t ? C.accent : C.border}`, color: docType===t ? C.accent : C.textPrimary }}>{t}</button>)}
            </div>
            <div style={{ fontSize:11, fontWeight:700, color:C.textSecondary, marginBottom:6 }}>Nombre completo</div>
            <input value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Nombre completo, como en tu documento" style={{ width:"100%", boxSizing:"border-box", background:C.surfaceTop, border:`1px solid ${C.border}`, borderRadius:9, padding:"11px 12px", color:C.textPrimary, fontSize:13, outline:"none" }}/>
            <div style={{ fontSize:10.5, color:C.warning, fontWeight:700, margin:"6px 0 13px", lineHeight:1.4 }}>
              ⚠️ Nombre completo, exactamente como aparece en tu documento de identidad.
            </div>
            <div style={{ fontSize:11, fontWeight:700, color:C.textSecondary, marginBottom:6 }}>Número de documento</div>
            <input value={docNum} onChange={e=>setDocNum(e.target.value)} placeholder="Ej. 95010112345" style={{ width:"100%", boxSizing:"border-box", background:C.surfaceTop, border:`1px solid ${C.border}`, borderRadius:9, padding:"11px 12px", color:C.textPrimary, fontSize:13, marginBottom:13, outline:"none" }}/>

            <div style={{ fontSize:11, fontWeight:700, color:C.textSecondary, marginBottom:6 }}>Fotos <span style={{ color:C.danger, fontWeight:800 }}>· las 3 son obligatorias</span></div>
            {/* input de cámara: el atributo "capture" se ajusta al slot activo justo
                antes de mostrarse la hoja de acción, así siempre abre la cámara
                correcta (trasera para el documento, frontal para la selfie). */}
            <input ref={camRef} type="file" accept="image/*" capture={pickerFor === "selfie" ? "user" : "environment"} onChange={onPicked} style={{ display:"none" }}/>
            <input ref={libRef} type="file" accept="image/*" onChange={onPicked} style={{ display:"none" }}/>
            <div style={{ display:"flex", gap:9, marginBottom:9 }}>
              {upBox("Documento por DELANTE", "front", "📄")}
              {upBox("Documento por DETRÁS", "back", "📄")}
            </div>
            <div style={{ display:"flex", gap:9, alignItems:"stretch", marginBottom:8 }}>
              {upBox("Tú sosteniendo el documento junto a tu cara", "selfie", "🤳")}
              {!selfie && (
                <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4, background:`${C.accent}0a`, border:`1px dashed ${C.accent}44`, borderRadius:10, padding:"8px 6px" }}>
                  <SelfieSample/>
                  <span style={{ fontSize:9, color:C.textSecondary, fontWeight:600, textAlign:"center", lineHeight:1.3 }}>Así, con el documento a un lado de tu cara</span>
                </div>
              )}
            </div>
            {missingSlots.length > 0 && (
              <div style={{ fontSize:11, color:C.warning, fontWeight:700, marginBottom:14 }}>Falta: {missingSlots.join(", ")}</div>
            )}
            {missingSlots.length === 0 && <div style={{ marginBottom:14 }}/>}

            <div style={{ display:"flex", gap:9 }}>
              <button onClick={onClose} style={{ flex:1, height:44, borderRadius:10, background:C.surfaceTop, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, fontWeight:700, cursor:"pointer" }}>Cancelar</button>
              <button disabled={!valid || submitting} onClick={doSubmit} style={{ flex:1, height:44, borderRadius:10, background: (valid && !submitting) ? C.positive : C.surfaceTop, border:"none", color: (valid && !submitting) ? "#fff" : C.textSecondary, fontSize:13, fontWeight:800, cursor: (valid && !submitting) ? "pointer" : "default", opacity: (valid && !submitting) ? 1 : .6 }}>{submitting ? "Enviando…" : "Enviar solicitud"}</button>
            </div>
          </>}
        </>}
      </div>

      {/* Hoja de acción: nunca se abre la cámara directo — siempre a elegir. */}
      {pickerFor && (
        <div onClick={() => setPickerFor(null)} style={{ position:"fixed", inset:0, zIndex:2100, background:"rgba(0,0,0,.55)", display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:C.surface, width:"100%", maxWidth:440, borderRadius:"16px 16px 0 0", padding:"10px 16px 24px", border:`1px solid ${C.border}` }}>
            <div style={{ textAlign:"center", fontSize:11.5, fontWeight:700, color:C.textSecondary, padding:"8px 0 14px" }}>Añadir foto</div>
            <button onClick={() => camRef.current?.click()} style={{ width:"100%", height:48, borderRadius:10, background:C.accent, border:"none", color:"#fff", fontSize:13.5, fontWeight:800, cursor:"pointer", marginBottom:9, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>📷 Tomar foto</button>
            <button onClick={() => libRef.current?.click()} style={{ width:"100%", height:48, borderRadius:10, background:C.surfaceTop, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13.5, fontWeight:800, cursor:"pointer", marginBottom:9, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>🖼️ Elegir de galería</button>
            <button onClick={() => setPickerFor(null)} style={{ width:"100%", height:44, borderRadius:10, background:"none", border:"none", color:C.textSecondary, fontSize:13, fontWeight:700, cursor:"pointer" }}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
// Mapea el nombre del plan (Pro/Premium) al valor del backend (pro/premium).
const PLAN_KEY = (nameOrId) => { const s = String(nameOrId || "").toLowerCase(); if (s.includes("premium")) return "premium"; if (s.includes("pro")) return "pro"; return null; };
function FP_PlansModal({ user, plans = [], current, onClose, C, flash }) {
  const price = p => p.promo && p.promoPrice >= 0 ? p.promoPrice : p.price;
  const [pending, setPending] = useState(null);   // { plan } de la solicitud pendiente
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const flash_ = flash || (() => {});
  useEffect(() => {
    let alive = true;
    if (!user?.id) { setLoading(false); return; }
    getMyPlanRequest(user.id).then(r => { if (alive) { setPending(r && r.status === "pending" ? r : null); setLoading(false); } }).catch(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [user?.id]);

  const request = async (p) => {
    const key = PLAN_KEY(p.id || p.name);
    if (!key) { flash_("Ese plan no se puede solicitar"); return; }
    if (pending || busy) return;
    setBusy(true);
    try { const r = await submitPlanRequest(user.id, key); setPending(r); flash_(`🕐 Solicitud enviada: plan ${p.name}. Pendiente de aprobación.`); }
    catch (e) { flash_("⚠️ " + (e?.message || "No se pudo enviar la solicitud")); }
    setBusy(false);
  };

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:2000, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:C.surface, width:"100%", maxWidth:460, borderRadius:"18px 18px 0 0", padding:"20px 18px 26px", border:`1px solid ${C.border}`, maxHeight:"88vh", overflowY:"auto" }}>
        <div style={{ fontSize:16, fontWeight:800, color:C.textPrimary, marginBottom:4 }}>Planes</div>
        <div style={{ fontSize:12, color:C.textSecondary, marginBottom:16 }}>Elige un plan. El pago se coordina manualmente; cuando se confirme, se activa.</div>
        {pending && <div style={{ background:`${C.warning}14`, border:`1px solid ${C.warning}44`, borderRadius:10, padding:"11px 12px", color:C.warning, fontSize:12.5, fontWeight:700, marginBottom:14, textAlign:"center" }}>🕐 Solicitud enviada (plan {pending.plan}), pendiente de aprobación</div>}
        <div style={{ display:"flex", flexDirection:"column", gap:11 }}>
          {plans.map(p => {
            const isCur = current === p.name;
            const requestable = !isCur && !!PLAN_KEY(p.id || p.name);
            const isPendingThis = pending && PLAN_KEY(pending.plan) === PLAN_KEY(p.id || p.name);
            return <div key={p.id} style={{ border:`1.5px solid ${isCur ? C.accent : C.border}`, borderRadius:12, padding:"14px 14px 16px", background: isCur ? `${C.accent}0d` : C.surfaceTop }}>
              <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ fontSize:15, fontWeight:800, color:C.textPrimary }}>{p.name}{isCur && <span style={{ fontSize:10, fontWeight:700, color:C.accent, marginLeft:7 }}>· actual</span>}</span>
                <span style={{ fontSize:14, fontWeight:800, color:C.textPrimary }}>{price(p) === 0 ? "Gratis" : `$${price(p)}/mes`}{p.promo && p.price !== price(p) && <span style={{ fontSize:11, color:C.textSecondary, textDecoration:"line-through", marginLeft:6 }}>${p.price}</span>}</span>
              </div>
              {(p.features||[]).map((f,i)=><div key={i} style={{ display:"flex", gap:7, alignItems:"flex-start", marginBottom:5 }}><span style={{ color:C.positive, fontSize:12, flexShrink:0 }}>✓</span><span style={{ fontSize:12, color:C.textPrimary }}>{f}</span></div>)}
              {requestable && (
                isPendingThis
                  ? <button disabled style={{ width:"100%", height:38, marginTop:11, borderRadius:9, background:C.surfaceTop, border:`1px solid ${C.border}`, color:C.textSecondary, fontSize:12.5, fontWeight:700, cursor:"default" }}>🕐 Solicitud enviada</button>
                  : <button disabled={!!pending || busy || loading} onClick={()=>request(p)} style={{ width:"100%", height:38, marginTop:11, borderRadius:9, background: (pending || busy) ? C.surfaceTop : C.accent, border:"none", color: (pending || busy) ? C.textSecondary : "#fff", fontSize:12.5, fontWeight:800, cursor: (pending || busy) ? "default" : "pointer", opacity: (pending || busy) ? .7 : 1 }}>{busy ? "Enviando…" : `Solicitar plan ${p.name}`}</button>
              )}
            </div>;
          })}
        </div>
        <button onClick={onClose} style={{ width:"100%", height:42, marginTop:14, borderRadius:10, background:C.surfaceTop, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, fontWeight:700, cursor:"pointer" }}>Cerrar</button>
      </div>
    </div>
  );
}
function FP_ReportModal({ targetName, onClose, onSubmit, C }) {
  const REASONS = ["Posible estafa", "No entregó el producto", "Perfil falso o suplantación", "Contenido inapropiado", "Otro"];
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:2000, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:C.surface, width:"100%", maxWidth:440, borderRadius:"18px 18px 0 0", padding:"20px 18px 26px", border:`1px solid ${C.border}` }}>
        <div style={{ fontSize:16, fontWeight:800, color:C.textPrimary, marginBottom:4 }}>Reportar a {targetName}</div>
        <div style={{ fontSize:12, color:C.textSecondary, marginBottom:16 }}>Tu reporte es confidencial y lo revisa el equipo de RETADOR.</div>
        <div style={{ display:"flex", flexDirection:"column", gap:7, marginBottom:14 }}>
          {REASONS.map(r => (
            <button key={r} onClick={()=>setReason(r)} style={{
              textAlign:"left", padding:"11px 13px", borderRadius:10, cursor:"pointer",
              background: reason===r ? `${C.accent}1a` : C.surfaceTop,
              border:`1.5px solid ${reason===r ? C.accent : C.border}`,
              color:C.textPrimary, fontSize:13, fontWeight:600 }}>
              {r}
            </button>
          ))}
        </div>
        <textarea value={detail} onChange={e=>setDetail(e.target.value)} placeholder="Cuéntanos qué pasó (opcional)…" rows={3} style={{
          width:"100%", background:C.surfaceTop, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 12px",
          color:C.textPrimary, fontSize:13, resize:"none", marginBottom:16, outline:"none", fontFamily:"inherit" }}/>
        <div style={{ display:"flex", gap:9 }}>
          <button onClick={onClose} style={{ flex:1, height:44, borderRadius:10, background:C.surfaceTop, border:`1px solid ${C.border}`, color:C.textPrimary, fontSize:13, fontWeight:700, cursor:"pointer" }}>Cancelar</button>
          <button disabled={!reason} onClick={()=>onSubmit({ targetName, reason, detail })} style={{ flex:1, height:44, borderRadius:10, background: reason?"#E5484D":C.surfaceTop, border:"none", color: reason?"#fff":C.textSecondary, fontSize:13, fontWeight:800, cursor: reason?"pointer":"default", opacity: reason?1:.6 }}>Enviar reporte</button>
        </div>
      </div>
    </div>
  );
}
export function FreeProfileScreen({ onBack, onMenu = null, embedded = false, user, initialProfile = {}, sellerId = null, onProfileUpdate, isOwner: isOwnerProp, onChat, onReport, onVerify, isVerified, onRequestPlan, currentPlan = "Básico", plans = [], myDebt = 0, commissionActive = true, userProducts = [], onProduct, onDeleteProduct, onEditProduct, onPromoteProduct }) {
  // ⭐ Destacar: visible solo si el admin tiene la función encendida (config en vivo).
  const promoOn = usePlatformCfg().promoActive === true;
  const { BG, S, B, CARD, T1, T2, T3, isDark } = useAt();
  const FP_C = useFP_C();
  const isOwner = isOwnerProp !== undefined ? isOwnerProp : FP_MOCK_IS_OWNER;

  const [tab,          setTab]          = useState("productos");
  const [following,    setFollowing]    = useState(false);
  const [showPro,      setShowPro]      = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPicker,   setShowPicker]   = useState(false);
  // Editor UNIFICADO: "Editar perfil" y "Acerca de" ya no son dos flujos
  // separados — un solo booleano abre UN panel con ambas secciones dentro.
  const [editing,      setEditing]      = useState(false);
  const [showReport,   setShowReport]   = useState(false);
  const [showVerify,   setShowVerify]   = useState(false);
  const [showPlans,    setShowPlans]    = useState(false);
  const [toast,        setToast]        = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  // El botón "Editar" de Acerca de es un atajo DENTRO del mismo editor unificado:
  // abre el mismo panel y baja hasta esta sección (no es un flujo aparte).
  const aboutEditRef = useRef(null);

  // ÚNICA identidad pública: el nombre real (profiles.full_name). Ya no existe
  // "usuario"/@handle — era un valor inventado en el frontend (pedazo del correo)
  // sin columna real detrás. El correo es un dato aparte, de solo lectura, que
  // se muestra igual (mismo valor) tanto en el perfil propio como en el ajeno.
  // TODO (Pro): "nombre de marca destacado" — beneficio de pago, aún no construido.
  const defaultProfile = {
    avatar: initialProfile.avatar || (isOwner && user?.avatar ? { type:"image", value: avatarUrlOf(user.avatar) } : null),
    name:   initialProfile.name   || (isOwner ? (user?.name || "Usuario") : "Vendedor"),
    email:  initialProfile.email  || (isOwner ? (user?.email || "") : ""),
    bio:    "",
    isVerified: false,
  };

  const [profile, setProfile] = useState(defaultProfile);
  const [pd, setPd] = useState({ ...defaultProfile });

  // Perfil de OTRO usuario: trae su nombre/avatar reales desde la tabla profiles
  // del backend (por su id). Mientras carga se muestra "Vendedor", nunca el id.
  useEffect(() => {
    if (!sellerId || isOwner) return;
    let alive = true;
    getUserById(sellerId).then(p => {
      if (!alive || !p?.name) return;
      // El ✓ de "otro" usuario NUNCA sale del prop isVerified (ese es del dueño de
      // la sesión) — se trae en vivo del backend (profiles.is_verified) aquí.
      // El correo también viene de aquí: mismo profiles.email que ve el dueño y
      // el panel de admin, nunca un valor distinto.
      setProfile(prev => ({ ...prev, name: p.name, email: p.email || "", bio: p.bio || "", avatar: p.avatar ? { type: "photo", url: p.avatar } : prev.avatar, isVerified: !!p.verified }));
      setPd(prev => ({ ...prev, name: p.name, bio: p.bio || "" }));
    }).catch(() => {});
    return () => { alive = false; };
  }, [sellerId, isOwner]);

  // Sin datos inventados: todo vacío hasta que la persona lo llene de verdad.
  const [about, setAbout] = useState({
    city:"", state:"", country:"",
    responseTime:"", shipping:"",
    instagram:"", facebook:"", tiktok:"",
    emailPublic:false,
  });
  const [ad, setAd] = useState({ ...about });

  // Carga REAL "Acerca de" del backend (profiles.city/country + seller_info) —
  // antes no había ninguna columna para esto, por eso nunca persistía. Se trae
  // tanto para el dueño (su propia info) como para quien visita OTRO perfil.
  const aboutTargetId = isOwner ? user?.id : sellerId;
  useEffect(() => {
    if (!aboutTargetId) return;
    let alive = true;
    getSellerAbout(aboutTargetId).then(a => {
      if (!alive || !a) return;
      setAbout(a); setAd(a);
    }).catch(() => {});
    return () => { alive = false; };
  }, [aboutTargetId]);

  // Reseñas REALES de todos los productos de este vendedor (tabla reviews),
  // nombre y avatar reales (profiles.full_name/avatar_url) — nunca inventados.
  const [reviews, setReviews] = useState([]);
  useEffect(() => {
    if (!aboutTargetId) { setReviews([]); return; }
    let alive = true;
    getSellerReviews(aboutTargetId).then(list => {
      if (!alive) return;
      setReviews(list.map(r => ({
        id: r.id, user: r.name, avatar: r.avatar, stars: r.rating, text: r.comment,
        date: new Date(r.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short" }),
      })));
    }).catch(() => {});
    return () => { alive = false; };
  }, [aboutTargetId]);

  // Encabezado: calificación real del vendedor (profiles.seller_rating/
  // seller_reviews_count) + estadísticas reales (get_profile_header_stats).
  const [sellerRatingInfo, setSellerRatingInfo] = useState(null); // { rating, count } | null mientras carga
  const [headerStats, setHeaderStats] = useState({ ventas: 0, compras: 0, envios: 0, seguidores: 0 });
  useEffect(() => {
    if (!aboutTargetId) return;
    let alive = true;
    getSellerRatingInfo(aboutTargetId).then(r => { if (alive) setSellerRatingInfo(r); }).catch(() => {});
    getProfileHeaderStats(aboutTargetId).then(s => { if (alive) setHeaderStats(s); }).catch(() => {});
    return () => { alive = false; };
  }, [aboutTargetId]);

  function toast_(msg, isError = false) { setToast({ msg, isError }); setTimeout(() => setToast(null), isError ? 4000 : 2500); }
  // Editor unificado: UN solo botón "Guardar" persiste datos básicos (perfil) y
  // "Acerca de" a la vez, en UNA sola llamada real: save_profile_all (RPC).
  // ANTES esto eran dos UPDATE directos a `profiles` — sujetos a RLS, y con un
  // fallo real (evidencia dura: updated_at idéntico al microsegundo antes y
  // después de "guardar") que quedaba en un console.error invisible mientras
  // el editor cerraba mostrando éxito igual. Ahora: la RPC devuelve la fila
  // YA guardada — el estado local se arma SIEMPRE con esa respuesta (nunca
  // con lo que había en pantalla), y "Guardado ✓" solo aparece si la RPC
  // respondió bien. Si falla, se muestra el error tal cual, sin cerrar nada.
  async function saveAll() {
    const updatedProfile = {...pd};
    const updatedAbout = {...ad};
    if (!isOwner || !user?.id) {
      setProfile(updatedProfile); setAbout(updatedAbout); setEditing(false);
      return;
    }
    setSavingProfile(true);
    try {
      const photoUrl = (updatedProfile.avatar?.type === "image" && avatarUrlOf(updatedProfile.avatar)) || null;
      const saved = await saveProfileAll({
        fullName: updatedProfile.name || "",
        bio: updatedProfile.bio || "",
        avatarUrl: photoUrl,
        city: updatedAbout.city || "",
        country: updatedAbout.country || "",
        sellerInfo: {
          state: updatedAbout.state || "", responseTime: updatedAbout.responseTime || "", shipping: updatedAbout.shipping || "",
          instagram: updatedAbout.instagram || "", facebook: updatedAbout.facebook || "", tiktok: updatedAbout.tiktok || "",
        },
        emailPublic: !!updatedAbout.emailPublic,
      });
      // El estado local sale SIEMPRE de lo que la RPC devolvió, no de `updatedProfile`/`updatedAbout`.
      const si = (saved?.seller_info && typeof saved.seller_info === "object") ? saved.seller_info : {};
      const newProfile = {
        ...profile,
        name: saved?.full_name || updatedProfile.name,
        bio: saved?.bio || "",
        avatar: saved?.avatar_url ? { type: "image", value: saved.avatar_url } : updatedProfile.avatar,
      };
      const newAbout = {
        city: saved?.city || "", country: saved?.country || "",
        state: si.state || "", responseTime: si.responseTime || "", shipping: si.shipping || "",
        instagram: si.instagram || "", facebook: si.facebook || "", tiktok: si.tiktok || "",
        emailPublic: !!saved?.email_public,
      };
      setProfile(newProfile);
      setAbout(newAbout);
      setAd(newAbout);
      setEditing(false);
      onProfileUpdate?.({ avatar: newProfile.avatar, name: newProfile.name, email: newProfile.email, bio: newProfile.bio });
      toast_("Guardado ✓");
    } catch (e) {
      // Prohibido fingir éxito: se muestra el error real del backend tal cual.
      toast_(e?.message || "No se pudo guardar.", true);
    } finally {
      setSavingProfile(false);
    }
  }
  function cancelAll() { setPd({...profile}); setAd({...about}); setEditing(false); }

  // Sin reseñas no hay promedio (evita NaN): avgRating queda null y se muestra "Nuevo".
  const avgRating = reviews.length ? (reviews.reduce((a,r) => a + r.stars, 0) / reviews.length).toFixed(1) : null;
  const ratingDist = [5,4,3,2,1].map(s => ({
    stars:s,
    pct: reviews.length ? Math.round(reviews.filter(r => r.stars===s).length / reviews.length * 100) : 0,
  }));

  return (
    // embedded (pestaña Perfil): contenedor EN FLUJO (no fixed), para que la barra
    // inferior de la app quede visible y se comporte igual que en las demás pantallas.
    // padding-bottom deja hueco para la barra. Sin embedded (overlay): fixed a pantalla.
    <div style={embedded
      ? { position:"relative", flex:1, minHeight:0, overflowY:"auto", WebkitOverflowScrolling:"touch", background:FP_C.bg, fontFamily:FP_FB, color:FP_C.textPrimary, paddingBottom:"calc(78px + env(safe-area-inset-bottom, 0px))" }
      : { position:"fixed", inset:0, zIndex:300, overflowY:"auto", background:FP_C.bg, fontFamily:FP_FB, color:FP_C.textPrimary }}>
      {/* fonts loaded via @import in useCSS */}

      {/* OVERLAYS */}
      {showPicker   && <FP_AvatarPicker current={pd.avatar} name={pd.name} userId={user?.id} onSelect={a=>{ setPd(d=>({...d,avatar:a})); setShowPicker(false); }} onClose={() => setShowPicker(false)}/>}
      {showPro      && isOwner && <FP_ProModal onClose={() => setShowPro(false)} onSeePlans={() => { setShowPro(false); setShowPlans(true); }}/>}
      {showSettings && isOwner && <FP_SettingsScreen onClose={() => setShowSettings(false)}/>}
      {showReport && !isOwner && <FP_ReportModal targetName={profile.name} onClose={() => setShowReport(false)} onSubmit={(payload) => { onReport?.(payload); setShowReport(false); toast_("Reporte enviado. Gracias por avisar."); }} C={FP_C}/>}
      {showVerify && isOwner && <FP_VerifyModal user={user} isVerified={isVerified} onClose={() => setShowVerify(false)} onSubmit={() => onVerify?.()} C={FP_C} flash={toast_}/>}
      {showPlans && isOwner && <FP_PlansModal user={user} plans={plans} current={currentPlan} onClose={() => setShowPlans(false)} C={FP_C} flash={toast_}/>}

      {/* TOAST — rojo/⚠ si es un error real (nunca se finge éxito con un ✓ verde) */}
      {toast && (
        <div style={{ position:"fixed", top:16, left:"50%", transform:"translateX(-50%)",
          background:FP_C.surfaceTop, color: toast.isError ? FP_C.danger : FP_C.positive,
          border:`1px solid ${toast.isError ? FP_C.danger + "55" : FP_C.positiveDim}`,
          borderRadius:8, padding:"9px 16px", fontSize:12, fontWeight:600,
          fontFamily:FP_FH, zIndex:700, boxShadow:"0 8px 24px rgba(0,0,0,0.6)",
          display:"flex", alignItems:"center", gap:8, maxWidth:"88vw",
          letterSpacing:"0.2px" }}>
          {toast.isError
            ? <FP_Icon d={FP_Icons.x} size={14} color={FP_C.danger}/>
            : <FP_Icon d={FP_Icons.check} size={14} color={FP_C.positive}/>}
          <span style={{ whiteSpace: toast.isError ? "normal" : "nowrap" }}>{toast.msg}</span>
        </div>
      )}

      {/* TOP BAR */}
      <div style={{ background:FP_C.bg, borderBottom:`1px solid ${FP_C.border}`,
        padding:"0 20px", height:50,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        position:"sticky", top:0, zIndex:100 }}>

        {onMenu ? (
          <button onClick={onMenu} aria-label="Menú" style={{ background:"none", border:`1px solid ${FP_C.border}`, borderRadius:6, height:32, padding:"0 12px", cursor:"pointer",
            display:"flex", alignItems:"center", gap:8, color:FP_C.textPrimary, fontSize:13, fontWeight:700, fontFamily:FP_FB }}>
            <span style={{ fontSize:17, lineHeight:1 }}>☰</span> Menú
          </button>
        ) : (
          <button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer", padding:0,
            display:"flex", alignItems:"center", gap:8 }}>
            <FP_Icon d={FP_Icons.back} size={18} color={FP_C.textSecondary}/>
            <span style={{ fontSize:13, fontWeight:500, color:FP_C.textSecondary, fontFamily:FP_FB }}>
              Atrás
            </span>
          </button>
        )}

        {isOwner ? (
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {/* Seguidores — discreto, cerca de los íconos del dueño (el propio
                dueño también quiere ver cuántos seguidores tiene). */}
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", lineHeight:1.1 }}>
              <span style={{ fontSize:12, fontWeight:800, color:FP_C.textPrimary, fontFamily:FP_FH }}>{fmtBig(headerStats.seguidores)}</span>
              <span style={{ fontSize:7.5, color:FP_C.textMuted, letterSpacing:"0.3px" }}>SEGUIDORES</span>
            </div>
            <button onClick={() => setShowSettings(true)} style={{
              background:"none", border:`1px solid ${FP_C.border}`,
              borderRadius:6, width:32, height:32, cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <FP_Icon d={FP_Icons.settings} size={15} color={FP_C.textSecondary}/>
            </button>
            <button onClick={() => setShowPro(true)} style={{
              background:FP_C.proSoft, border:`1px solid ${FP_C.pro}33`,
              borderRadius:6, padding:"0 12px", height:32, cursor:"pointer",
              color:FP_C.proText, fontSize:11, fontWeight:700, fontFamily:FP_FH,
              display:"flex", alignItems:"center", gap:5, letterSpacing:"0.3px",
            }}>
              <FP_Icon d={FP_Icons.zap} size={12} color={FP_C.proText}/>
              Pro
            </button>
          </div>
        ) : (
          /* Seguir vuelve a su posición original, en pareja con Mensaje, más
             abajo cerca del nombre/avatar — aquí solo queda el espaciador. */
          <div style={{ width:80 }}/>
        )}
      </div>

      {/* Tirita de tasas del día — visible en la vista principal del perfil (informativa) */}
      {onMenu && <div style={{ padding:"12px 20px 0" }}><FxTirita /></div>}

      {/* ── PROFILE HEADER ── */}
      {!editing ? (
        <div style={{ padding:"24px 20px 0" }}>

          {/* Nombre a la izquierda, avatar a la derecha. El nombre queda un poco
              POR ENCIMA del centro vertical del avatar (alignItems:flex-start),
              no centrado con él — se ve menos "vacío", más como la referencia. */}
          <div style={{ display:"flex", justifyContent:"space-between",
            alignItems:"flex-start", gap:14, marginBottom:10 }}>
            <div style={{ flex:1, minWidth:0 }}>
              {/* Nombre — ÚNICA identidad pública. Sin @handle: nunca se muestra un
                  valor inventado del correo, y el correo en sí va solo en "Acerca de". */}
              <div style={{ fontSize:23, fontWeight:800, color:FP_C.textPrimary,
                fontFamily:FP_FH, lineHeight:1.2 }}>
                {profile.name}
              </div>
              {/* "✓ Perfil verificado" — SOLO si is_verified es real. Nunca fingido. */}
              {(isVerified || profile.isVerified) && (
                <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:6 }}>
                  <FP_Icon d={FP_Icons.check} size={13} color={FP_C.positive}/>
                  <span style={{ fontSize:12.5, color:FP_C.positive, fontWeight:600, fontFamily:FP_FH }}>
                    Perfil verificado
                  </span>
                </div>
              )}
            </div>
            <div style={{ position:"relative", flexShrink:0, display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
              <div style={{ position:"relative" }}>
                <FP_Avatar avatar={profile.avatar} name={profile.name} size={64}/>
                {isOwner && (
                  <button onClick={() => { setPd({...profile}); setAd({...about}); setEditing(true); }}
                    aria-label="Editar perfil"
                    style={{ position:"absolute", bottom:-2, right:-2, width:24, height:24,
                      borderRadius:"50%", background:FP_C.accent, border:`2px solid ${FP_C.bg}`,
                      display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                    <FP_Icon d={FP_Icons.edit} size={11} color="#fff"/>
                  </button>
                )}
              </div>
              {/* Chip de plan — SOLO lo ve el dueño de la cuenta, nunca un visitante
                  (el plan no es información pública). */}
              {isOwner && (
                <div style={{ background:FP_C.surfaceTop, border:`1px solid ${FP_C.borderMid}`,
                  borderRadius:4, padding:"1px 6px",
                  fontSize:8, fontWeight:800, color:FP_C.textMuted,
                  fontFamily:FP_FH, letterSpacing:"0.8px", whiteSpace:"nowrap" }}>
                  {String(currentPlan || "Básico").toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Estrellas + calificación real (profiles.seller_rating/seller_reviews_count).
              SIEMPRE 5 estrellas — vacías/outline si aún no hay calificación (el
              propio FP_StarRow ya las dibuja así con count=0), llenas según el
              promedio si lo hay. El conteo real va entre paréntesis, "(0)" incluido. */}
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
            <FP_StarRow count={sellerRatingInfo ? Math.round(sellerRatingInfo.rating || 0) : 0} size={14}/>
            {sellerRatingInfo && sellerRatingInfo.rating != null && (
              <span style={{ fontSize:14, fontWeight:700, color:FP_C.textPrimary, fontFamily:FP_FH }}>
                {sellerRatingInfo.rating.toFixed(1).replace(".", ",")}
              </span>
            )}
            <span style={{ fontSize:12.5, color:FP_C.textSecondary }}>
              ({fmtBig(sellerRatingInfo?.count || 0)})
            </span>
          </div>

          {/* Estadísticas reales (get_profile_header_stats) — sin distancia/ubicación. */}
          <div style={{ marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"baseline", gap:6, marginBottom:7, flexWrap:"wrap" }}>
              <span style={{ fontSize:14 }}>📊</span>
              <span style={{ fontSize:13.5, color:FP_C.textPrimary }}>
                <b style={{ fontFamily:FP_FH, fontWeight:800 }}>{fmtBig(headerStats.ventas)}</b> Ventas
              </span>
              <span style={{ color:FP_C.textMuted }}>·</span>
              <span style={{ fontSize:13.5, color:FP_C.textPrimary }}>
                <b style={{ fontFamily:FP_FH, fontWeight:800 }}>{fmtBig(headerStats.compras)}</b> Compras
              </span>
            </div>
            <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
              <span style={{ fontSize:14 }}>📦</span>
              <span style={{ fontSize:13.5, color:FP_C.textPrimary }}>
                <b style={{ fontFamily:FP_FH, fontWeight:800 }}>{fmtBig(headerStats.envios)}</b> Envíos
              </span>
            </div>
          </div>

          {/* Bio (solo si hay; para el dueño, invita a escribirla) */}
          {(profile.bio || isOwner) && (
            <div style={{ fontSize:13, color:FP_C.textSecondary, lineHeight:1.6, marginBottom:16, fontStyle: profile.bio ? "normal" : "italic", opacity: profile.bio ? 1 : .7 }}>
              {profile.bio || (isOwner ? "Añade una biografía para que los compradores te conozcan." : "")}
            </div>
          )}

          {/* Seguir + Mensaje en pareja, en su posición original (no arriba en
              la barra superior) — con el conteo de seguidores discreto junto
              a Seguir. */}
          {!isOwner && (
            <div style={{ marginBottom:12 }}>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={() => setFollowing(!following)} style={{
                  flex:1, background: following ? FP_C.surfaceTop : FP_C.accent,
                  border:`1px solid ${following ? FP_C.border : FP_C.accent}`,
                  borderRadius:8, height:38, cursor:"pointer",
                  color: following ? FP_C.textPrimary : "#fff",
                  fontSize:13, fontWeight:700, fontFamily:FP_FH,
                  display:"flex", alignItems:"center", justifyContent:"center", gap:6, transition:"all 0.2s",
                }}>
                  {following
                    ? <><FP_Icon d={FP_Icons.check} size={14} color={FP_C.textPrimary}/> Siguiendo</>
                    : <><FP_Icon d={FP_Icons.plus}  size={14} color="#fff"/> Seguir</>
                  }
                </button>
                <button onClick={() => onChat?.(sellerId, profile.name)} style={{
                  flex:1, background:FP_C.surfaceTop, border:`1px solid ${FP_C.border}`,
                  borderRadius:8, height:38, cursor:"pointer",
                  color:FP_C.textPrimary, fontSize:13, fontWeight:700, fontFamily:FP_FH,
                  display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                  <FP_Icon d={FP_Icons.message} size={15} color={FP_C.textPrimary}/> Mensaje
                </button>
              </div>
              <div style={{ textAlign:"center", fontSize:10.5, color:FP_C.textMuted, fontWeight:600, marginTop:5 }}>
                {fmtBig(headerStats.seguidores)} seguidores
              </div>
            </div>
          )}
          {!isOwner && (
            <button onClick={() => setShowReport(true)} style={{
              width:"100%", background: isDark ? "rgba(224,82,82,.08)" : "#FFF0F0",
              border:`1px solid ${isDark ? "rgba(224,82,82,.3)" : "#F5C6C6"}`, color:"#E05252",
              borderRadius:8, height:36, cursor:"pointer", marginBottom:14, fontSize:12.5, fontWeight:700,
              display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              🚩 Reportar usuario
            </button>
          )}
          {isOwner && commissionActive && myDebt > 0 && (
            <div style={{ background: isDark ? "rgba(212,152,42,.1)" : "#FFF8E6", border:`1px solid ${isDark ? "rgba(212,152,42,.35)" : "#F0D98A"}`, borderRadius:10, padding:"12px 14px", marginBottom:14, display:"flex", alignItems:"center", gap:11 }}>
              <span style={{ fontSize:20 }}>💳</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12.5, fontWeight:800, color:FP_C.textPrimary }}>Comisión por pagar: ${Math.round(myDebt).toLocaleString()} CUP</div>
                <div style={{ fontSize:11, color:FP_C.textSecondary, marginTop:1 }}>Es la comisión de tus ventas. Págala para mantener tu cuenta activa.</div>
              </div>
            </div>
          )}
          {isOwner && (
            <div style={{ display:"flex", gap:8, marginBottom:14 }}>
              {!isVerified && (
                <button onClick={() => setShowVerify(true)} style={{
                  flex:1, background: isDark ? "rgba(25,195,125,.1)" : "#E6FAF3",
                  border:`1px solid ${isDark ? "rgba(25,195,125,.35)" : "#9DE9CC"}`, color:FP_C.positive,
                  borderRadius:8, height:38, cursor:"pointer", fontSize:12.5, fontWeight:700,
                  display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                  <FP_Icon d={FP_Icons.shield} size={14} color={FP_C.positive}/> Verificar mi perfil
                </button>
              )}
              <button onClick={() => setShowPlans(true)} style={{
                flex:1, background:FP_C.surfaceTop, border:`1px solid ${FP_C.border}`, color:FP_C.textPrimary,
                borderRadius:8, height:38, cursor:"pointer", fontSize:12.5, fontWeight:700,
                display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                ⭐ {currentPlan === "Básico" ? "Mejorar mi plan" : `Plan ${currentPlan}`}
              </button>
            </div>
          )}

          {(()=>{
            const isCourier=(()=>{ try { const cs=JSON.parse(localStorage.getItem("retador_couriers")||"[]"); return cs.some(c=>c.status==="approved"&&(c.nombre===profile.name||c.name===profile.name)); } catch(e){ return false; } })();
            if(!isCourier) return null;
            const cr=(typeof ratingForName==="function")?ratingForName(profile.name,"courier"):{avg:0,count:0,reviews:[]};
            return <div style={{ background:FP_C.surface, border:`1px solid ${FP_C.border}`, borderRadius:14, padding:"14px", marginBottom:14 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:cr.reviews.length?10:2 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:17 }}>🛵</span>
                  <span style={{ fontFamily:FP_FH, fontWeight:700, fontSize:13.5, color:FP_C.textPrimary }}>Reputación como mensajero</span>
                </div>
                <span style={{ fontSize:12.5, fontWeight:800, color: cr.count?FP_C.textPrimary:FP_C.textSecondary }}>{cr.count?`⭐ ${cr.avg} · ${cr.count}`:"Sin reseñas aún"}</span>
              </div>
              {cr.reviews.length>0 && cr.reviews.slice(0,3).sort((a,b)=>b.at-a.at).map((r,i)=>(
                <div key={i} style={{ padding:"9px 0", borderTop:`1px solid ${FP_C.border}` }}>
                  <div style={{ fontSize:11, color:G, marginBottom:2 }}>{"⭐".repeat(Math.max(1,r.stars))}</div>
                  <div style={{ fontSize:12, color:FP_C.textSecondary, lineHeight:1.45 }}>"{r.msg}"</div>
                </div>
              ))}
            </div>;
          })()}
        </div>
      ) : (
        /* ── EDITOR UNIFICADO: datos básicos + Acerca de, un solo Guardar ── */
        <div style={{ padding:"20px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
            <div style={{ fontSize:16, fontWeight:700, color:FP_C.textPrimary, fontFamily:FP_FH }}>
              Editar perfil
            </div>
            <button onClick={cancelAll} style={{ background:"none", border:"none",
              cursor:"pointer", display:"flex" }}>
              <FP_Icon d={FP_Icons.x} size={20} color={FP_C.textSecondary}/>
            </button>
          </div>

          {/* Avatar edit */}
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:22 }}>
            <div style={{ position:"relative", cursor:"pointer" }} onClick={() => setShowPicker(true)}>
              <FP_Avatar avatar={pd.avatar} name={pd.name} size={92}/>
              <div style={{ position:"absolute", bottom:0, right:-4,
                background:FP_C.accent, borderRadius:"50%", width:24, height:24,
                display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow:"0 2px 8px rgba(0,0,0,0.5)", cursor:"pointer" }}>
                <FP_Icon d={FP_Icons.camera} size={12} color="#fff"/>
              </div>
            </div>
            <button onClick={() => setShowPicker(true)} style={{ marginTop:10,
              background:"none", border:`1px solid ${FP_C.border}`,
              borderRadius:6, padding:"5px 14px", cursor:"pointer",
              color:FP_C.accentText, fontSize:11, fontWeight:600, fontFamily:FP_FH }}>
              Cambiar foto
            </button>
          </div>

          <FP_Field label="Nombre">
            <input value={pd.name} placeholder="Tu nombre"
              onChange={e => setPd(d => ({...d,name:e.target.value}))}
              onFocus={e => e.target.style.borderColor = FP_C.accent}
              onBlur={e => e.target.style.borderColor = FP_C.border}
              style={fpInputStyle(FP_C)}/>
          </FP_Field>
          <FP_Field label="Bio">
            <textarea value={pd.bio} placeholder="Cuéntale a los compradores quién eres…"
              onChange={e => setPd(d => ({...d,bio:e.target.value}))}
              onFocus={e => e.target.style.borderColor = FP_C.accent}
              onBlur={e => e.target.style.borderColor = FP_C.border}
              rows={3} maxLength={160}
              style={{...fpInputStyle(FP_C), resize:"none", lineHeight:1.55}}/>
            <div style={{ fontSize:10, color:FP_C.textMuted, textAlign:"right", marginTop:3 }}>
              {pd.bio.length}/160
            </div>
          </FP_Field>

          {/* ── Acerca de (mismo editor, no un flujo aparte) ── */}
          <div ref={aboutEditRef} style={{ marginTop:8, paddingTop:18, borderTop:`1px solid ${FP_C.border}` }}>
            <div style={{ fontSize:14, fontWeight:700, color:FP_C.textPrimary, fontFamily:FP_FH, marginBottom:14 }}>
              Acerca de
            </div>

            <div style={{ background:FP_C.surfaceTop, borderRadius:8,
              padding:"14px", marginBottom:14, border:`1px solid ${FP_C.border}` }}>
              <FP_SectionHead>Ubicación</FP_SectionHead>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr",
                gap:10, marginBottom:10 }}>
                <FP_Field label="Ciudad">
                  <input value={ad.city} placeholder="Ciudad"
                    onChange={e => setAd(d => ({...d,city:e.target.value}))}
                    onFocus={e => e.target.style.borderColor = FP_C.accent}
                    onBlur={e => e.target.style.borderColor = FP_C.border}
                    style={{...fpInputStyle(FP_C), padding:"9px 11px",fontSize:13}}/>
                </FP_Field>
                <FP_Field label="Estado">
                  <input value={ad.state} placeholder="Estado"
                    onChange={e => setAd(d => ({...d,state:e.target.value}))}
                    onFocus={e => e.target.style.borderColor = FP_C.accent}
                    onBlur={e => e.target.style.borderColor = FP_C.border}
                    style={{...fpInputStyle(FP_C), padding:"9px 11px",fontSize:13}}/>
                </FP_Field>
              </div>
              <FP_Field label="País">
                <input value={ad.country} placeholder="País"
                  onChange={e => setAd(d => ({...d,country:e.target.value}))}
                  onFocus={e => e.target.style.borderColor = FP_C.accent}
                  onBlur={e => e.target.style.borderColor = FP_C.border}
                  style={{...fpInputStyle(FP_C), padding:"9px 11px",fontSize:13}}/>
              </FP_Field>
            </div>

            <div style={{ background:FP_C.surfaceTop, borderRadius:8,
              padding:"14px", marginBottom:14, border:`1px solid ${FP_C.border}` }}>
              <FP_SectionHead>Tiempos</FP_SectionHead>
              <FP_Field label="Tiempo de respuesta">
                <select value={ad.responseTime}
                  onChange={e => setAd(d => ({...d,responseTime:e.target.value}))}
                  style={{...fpInputStyle(FP_C), appearance:"none", cursor:"pointer"}}>
                  {FP_RESPONSE_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </FP_Field>
              <FP_Field label="Tiempo de envío">
                <select value={ad.shipping}
                  onChange={e => setAd(d => ({...d,shipping:e.target.value}))}
                  style={{...fpInputStyle(FP_C), appearance:"none", cursor:"pointer"}}>
                  {FP_SHIPPING_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </FP_Field>
            </div>

            <div style={{ background:FP_C.surfaceTop, borderRadius:8,
              padding:"14px", marginBottom:4, border:`1px solid ${FP_C.border}` }}>
              <FP_SectionHead>Redes sociales</FP_SectionHead>
              {[
                { k:"instagram", label:"Instagram", icon:FP_Icons.instagram, ph:"usuario" },
                { k:"facebook",  label:"Facebook",  icon:FP_Icons.facebook,  ph:"tu.perfil" },
                { k:"tiktok",    label:"TikTok",    icon:FP_Icons.music,     ph:"usuario" },
              ].map(s => (
                <FP_Field key={s.k} label={s.label}>
                  <div style={{ position:"relative" }}>
                    <span style={{ position:"absolute", left:11, top:"50%",
                      transform:"translateY(-50%)" }}>
                      <FP_Icon d={s.icon} size={14} color={FP_C.textMuted}/>
                    </span>
                    <input value={ad[s.k]} placeholder={s.ph}
                      onChange={e => setAd(d => ({...d,[s.k]:e.target.value.replace("@","")}))}
                      onFocus={e => e.target.style.borderColor = FP_C.accent}
                      onBlur={e => e.target.style.borderColor = FP_C.border}
                      style={{...fpInputStyle(FP_C), paddingLeft:34}}/>
                  </div>
                </FP_Field>
              ))}
            </div>

            <div style={{ background:FP_C.surfaceTop, borderRadius:8,
              padding:"14px", marginBottom:4, border:`1px solid ${FP_C.border}` }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <FP_Icon d={FP_Icons.mail} size={15} color={FP_C.textSecondary}/>
                  <span style={{ fontSize:13, color:FP_C.textSecondary }}>Mostrar mi correo en mi perfil público</span>
                </div>
                <FP_Toggle on={ad.emailPublic}
                  onChange={() => setAd(d => ({...d, emailPublic:!d.emailPublic}))}/>
              </div>
            </div>
          </div>

          <div style={{ display:"flex", gap:8, marginTop:4 }}>
            <FP_Btn onClick={saveAll} disabled={savingProfile} style={{ flex:1 }}>
              {savingProfile ? "Guardando…" : "Guardar"}
            </FP_Btn>
            <FP_Btn variant="secondary" onClick={cancelAll} disabled={savingProfile} style={{ flex:1 }}>Cancelar</FP_Btn>
          </div>
        </div>
      )}

      <FP_Divider/>

      {/* ── TABS: número/símbolo arriba, palabra abajo, la activa subrayada ── */}
      <div style={{ display:"flex", background:FP_C.bg,
        borderBottom:`1px solid ${FP_C.border}`,
        position:"sticky", top:50, zIndex:90 }}>
        {[
          { k:"productos", top:fmtBig(userProducts.length), l:"En venta" },
          { k:"reseñas",   top:fmtBig(sellerRatingInfo?.count || 0), l:"Valoraciones" },
          { k:"acerca",    top:"+", l:"Info" },
        ].map(t => (
          <button key={t.k} onClick={() => setTab(t.k)} style={{
            flex:1, background:"none", border:"none", cursor:"pointer",
            padding:"11px 8px 12px", fontFamily:FP_FB,
            borderBottom: tab===t.k ? `2px solid ${FP_C.accent}` : "2px solid transparent",
            transition:"all 0.15s",
            display:"flex", flexDirection:"column", alignItems:"center", gap:3,
          }}>
            <span style={{ fontSize:15, fontWeight:800, fontFamily:FP_FH,
              color: tab===t.k ? FP_C.textPrimary : FP_C.textSecondary }}>
              {t.top}
            </span>
            <span style={{ fontSize:10.5, fontWeight: tab===t.k ? 700 : 500,
              color: tab===t.k ? FP_C.textPrimary : FP_C.textSecondary }}>
              {t.l}
            </span>
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT ── */}
      <div style={{ padding:"16px 20px 60px" }}>

        {/* PRODUCTOS */}
        {tab === "productos" && (
          <>
            {userProducts.length === 0 ? (
              <div style={{ textAlign:"center", color:FP_C.textSecondary, fontSize:12.5, padding:"28px 10px" }}>
                {isOwner ? "Aún no has publicado productos." : "Este usuario no tiene productos publicados."}
              </div>
            ) : (
              <div style={{ display:"grid",
                gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",
                gap:10, marginBottom:12 }}>
                {userProducts.map(p => <FP_ProductCard key={p.id} product={p} onClick={() => onProduct && onProduct(p)} onDelete={onDeleteProduct ? (() => onDeleteProduct(p.id)) : null} onEdit={onEditProduct ? (() => onEditProduct(p)) : null} onPromote={(promoOn && onPromoteProduct && !p.promoted && p.kind !== "service") ? (() => onPromoteProduct(p)) : null}/>)}
              </div>
            )}
            {isOwner && (
              <div onClick={() => setShowPro(true)} style={{
                display:"flex", alignItems:"center", justifyContent:"space-between",
                background:FP_C.surface, border:`1px dashed ${FP_C.border}`,
                borderRadius:8, padding:"12px 14px", cursor:"pointer",
                transition:"border-color 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = FP_C.borderMid}
                onMouseLeave={e => e.currentTarget.style.borderColor = FP_C.border}>
                <span style={{ fontSize:12, color:FP_C.textSecondary }}>
                  Límite de <strong style={{ color:FP_C.textPrimary }}>10 productos</strong> en plan Free
                </span>
                <div style={{ display:"flex", alignItems:"center", gap:5,
                  color:FP_C.accentText, fontSize:12, fontWeight:600, fontFamily:FP_FH }}>
                  Ver Pro
                  <FP_Icon d={FP_Icons.chevronR} size={14} color={FP_C.accentText}/>
                </div>
              </div>
            )}
          </>
        )}

        {/* RESEÑAS */}
        {tab === "reseñas" && (
          <>
            {/* Summary */}
            <div style={{ background:FP_C.surface, border:`1px solid ${FP_C.border}`,
              borderRadius:10, padding:"16px 18px", marginBottom:12 }}>
              <div style={{ display:"flex", gap:20, alignItems:"center" }}>
                <div style={{ textAlign:"center", minWidth:60 }}>
                  <div style={{ fontFamily:FP_FH, fontWeight:800, fontSize:40,
                    color:FP_C.textPrimary, lineHeight:1 }}>
                    {avgRating}
                  </div>
                  <FP_StarRow count={Math.round(parseFloat(avgRating))} size={13}/>
                  <div style={{ fontSize:10, color:FP_C.textSecondary, marginTop:4 }}>
                    {reviews.length} reseñas
                  </div>
                </div>
                <div style={{ flex:1 }}>
                  {ratingDist.map(({ stars:s, pct }) => (
                    <div key={s} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                      <span style={{ fontSize:11, color:FP_C.textSecondary, width:8 }}>{s}</span>
                      <div style={{ flex:1, height:4, background:FP_C.surfaceTop,
                        borderRadius:4, overflow:"hidden" }}>
                        <div style={{ width:`${pct}%`, height:"100%",
                          background:FP_C.warning, borderRadius:4 }}/>
                      </div>
                      <span style={{ fontSize:10, color:FP_C.textMuted, width:22 }}>
                        {pct}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Para escribir una reseña real hace falta un producto concreto
                (product_id): se hace desde la ficha del producto que compraste,
                no desde el perfil general del vendedor. */}

            {/* Reviews list */}
            {reviews.length === 0 && (
              <p style={{ fontSize:12, color:FP_C.textMuted, textAlign:"center", padding:"18px 0" }}>
                Todavía no hay reseñas para los productos de este vendedor.
              </p>
            )}
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {reviews.map(r => (
                <div key={r.id} style={{ background:FP_C.surface,
                  border:`1px solid ${FP_C.border}`, borderRadius:10, padding:"14px 16px" }}>
                  <div style={{ display:"flex", alignItems:"center",
                    justifyContent:"space-between", marginBottom:8 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <Avatar name={r.user} url={r.avatar} size={34}/>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600,
                          color:FP_C.textPrimary, fontFamily:FP_FH }}>{r.user}</div>
                        <FP_StarRow count={r.stars} size={11}/>
                      </div>
                    </div>
                    <span style={{ fontSize:10, color:FP_C.textMuted }}>{r.date}</span>
                  </div>
                  {r.text && (
                    <div style={{ fontSize:13, color:FP_C.textSecondary, lineHeight:1.6 }}>
                      {r.text}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ACERCA DE */}
        {tab === "acerca" && (
          <>
                <div style={{ background:FP_C.surface, border:`1px solid ${FP_C.border}`,
                  borderRadius:10, overflow:"hidden", marginBottom:10 }}>
                  <FP_Row style={{ borderBottom:`1px solid ${FP_C.border}` }}>
                    <span style={{ fontSize:13, fontWeight:600,
                      color:FP_C.textPrimary, fontFamily:FP_FH }}>
                      Información del vendedor
                    </span>
                    {isOwner && (
                      <button onClick={() => { setPd({...profile}); setAd({...about}); setEditing(true); setTimeout(() => aboutEditRef.current?.scrollIntoView({ behavior:"smooth", block:"start" }), 60); }}
                        style={{ background:"none", border:`1px solid ${FP_C.border}`,
                          borderRadius:6, padding:"5px 10px", cursor:"pointer",
                          display:"flex", alignItems:"center", gap:5 }}>
                        <FP_Icon d={FP_Icons.edit} size={12} color={FP_C.textSecondary}/>
                        <span style={{ fontSize:11, color:FP_C.textSecondary,
                          fontWeight:600, fontFamily:FP_FH }}>Editar</span>
                      </button>
                    )}
                  </FP_Row>

                  {/* Correo de la cuenta — siempre de solo lectura y siempre profiles.email
                      (mismo valor que ve el dueño y el panel de admin; nunca un dato distinto
                      o inventado). El DUEÑO lo ve siempre; a un visitante solo se le muestra
                      si el dueño activó "Mostrar mi correo en mi perfil público" (privado
                      por defecto). */}
                  {(isOwner || about.emailPublic) && (
                    <FP_Row border style={{ gap:12 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                        <FP_Icon d={FP_Icons.mail} size={15} color={FP_C.textSecondary}/>
                        <div>
                          <div style={{ fontSize:10, color:FP_C.textMuted, fontWeight:700, letterSpacing:"0.3px" }}>CORREO DE LA CUENTA</div>
                          <div style={{ fontSize:13, color:FP_C.textSecondary }}>{profile.email || "—"}</div>
                        </div>
                      </div>
                    </FP_Row>
                  )}

                  {[
                    (about.city || about.country) && { icon:FP_Icons.globe, text:[about.city, about.state, about.country].filter(Boolean).join(", ") },
                    about.responseTime && { icon:FP_Icons.zap,   text:`Respuesta: ${about.responseTime}` },
                    about.shipping     && { icon:FP_Icons.truck, text:`Envío en ${about.shipping}` },
                  ].filter(Boolean).map((row, i, arr) => (
                    <FP_Row key={i} border={i < arr.length-1} style={{ gap:12 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                        <FP_Icon d={row.icon} size={15} color={FP_C.textSecondary}/>
                        <span style={{ fontSize:13, color:FP_C.textSecondary }}>{row.text}</span>
                      </div>
                    </FP_Row>
                  ))}
                </div>

                {/* Social links */}
                {(about.instagram || about.facebook || about.tiktok) && (
                  <div style={{ background:FP_C.surface, border:`1px solid ${FP_C.border}`,
                    borderRadius:10, padding:"14px 16px", marginBottom:10 }}>
                    <FP_SectionHead>Redes</FP_SectionHead>
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                      {about.instagram && (
                        <div style={{ display:"flex", alignItems:"center", gap:7,
                          background:FP_C.surfaceTop, border:`1px solid ${FP_C.border}`,
                          borderRadius:6, padding:"7px 12px" }}>
                          <FP_Icon d={FP_Icons.instagram} size={14} color={FP_C.textSecondary}/>
                          <span style={{ fontSize:12, color:FP_C.textPrimary, fontWeight:500 }}>
                            @{about.instagram}
                          </span>
                        </div>
                      )}
                      {about.facebook && (
                        <div style={{ display:"flex", alignItems:"center", gap:7,
                          background:FP_C.surfaceTop, border:`1px solid ${FP_C.border}`,
                          borderRadius:6, padding:"7px 12px" }}>
                          <FP_Icon d={FP_Icons.facebook} size={14} color={FP_C.textSecondary}/>
                          <span style={{ fontSize:12, color:FP_C.textPrimary, fontWeight:500 }}>
                            {about.facebook}
                          </span>
                        </div>
                      )}
                      {about.tiktok && (
                        <div style={{ display:"flex", alignItems:"center", gap:7,
                          background:FP_C.surfaceTop, border:`1px solid ${FP_C.border}`,
                          borderRadius:6, padding:"7px 12px" }}>
                          <FP_Icon d={FP_Icons.music} size={14} color={FP_C.textSecondary}/>
                          <span style={{ fontSize:12, color:FP_C.textPrimary, fontWeight:500 }}>
                            @{about.tiktok}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Pro nudge — owner only */}
                {isOwner && (
                  <div onClick={() => setShowPro(true)} style={{
                    background:FP_C.surface, border:`1px solid ${FP_C.border}`,
                    borderRadius:10, padding:"13px 16px", cursor:"pointer",
                    display:"flex", alignItems:"center", justifyContent:"space-between",
                    transition:"border-color 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = FP_C.borderMid}
                    onMouseLeave={e => e.currentTarget.style.borderColor = FP_C.border}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600,
                        color:FP_C.proText, fontFamily:FP_FH, marginBottom:2 }}>
                        ¿Vendes con frecuencia?
                      </div>
                      <div style={{ fontSize:11, color:FP_C.textSecondary }}>
                        Actualiza a Pro y crea tu tienda profesional
                      </div>
                    </div>
                    <FP_Icon d={FP_Icons.chevronR} size={16} color={FP_C.textMuted}/>
                  </div>
                )}
          </>
        )}
      </div>
    </div>
  );
}
