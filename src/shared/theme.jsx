import { useState, useEffect, createContext, useContext, useCallback, useMemo } from "react";

// ═════════════════════════════════════════════════════════════════════════════
// CONSTANTES DE DISEÑO
// ═════════════════════════════════════════════════════════════════════════════
export const G  = "#FFC01E";   // dorado RETADOR
export const BG = "#080808";   // negro profundo
export const S  = "#0f0f0f";   // superficies
export const B  = "#1a1a1a";   // bordes

// ─── Responsive hook ─────────────────────────────────────────────────────────
export const RCtx = createContext({ isMobile: true, isTablet: false, isDesktop: false, cols: 2 });
export const useR = () => useContext(RCtx);

export function useResponsive() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 390);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  const isMobile  = w < 768;
  const isTablet  = w >= 768 && w < 1200;
  const isDesktop = w >= 1200;
  const cols      = isDesktop ? 4 : isTablet ? 3 : 2;
  return { w, isMobile, isTablet, isDesktop, cols };
}

export const BC = {
  NUEVO:       { bg: "#2563EB", tx: "#fff" },
  RECOMENDADO: { bg: "#16A34A", tx: "#fff" },
  OFERTA:      { bg: G,         tx: "#000" },
};

// ─── Global theme tokens ─────────────────────────────────────────────────────
export const DARK_T  = { BG:"#080808", S:"#0f0f0f", B:"#1a1a1a", CARD:"#0d0d0d", T1:"#f0f0f0", T2:"#888888", T3:"#3a3a3a", isDark:true  };
export const LIGHT_T = { BG:"#FFFFFF", S:"#FFFFFF", B:"#E4E6EB", CARD:"#FFFFFF", T1:"#050505", T2:"#65676B", T3:"#8A8D91", isDark:false };
export const AppThCtx = createContext({ ...DARK_T, imgScale:1, ts:1 });
export const useAt = () => useContext(AppThCtx);

// ─── Configuración GLOBAL de la plataforma (fuente de verdad: backend) ─────────
// El admin la edita en su panel → se guarda en platform_config (RPC) → llega EN
// VIVO a todos por realtime. Cualquier pantalla lee de aquí (comisiones, tarifas,
// tasas fx, servicios on/off, planes…), NUNCA de localStorage directamente.
export const PlatformCfgContext = createContext(null);
export const usePlatformCfg = () => useContext(PlatformCfgContext) || {};

// ═══════════════════════════════════════════════════════════════════
//  UI DENSITY ENGINE — motor de densidad visual (núcleo reutilizable)
//  Reemplaza el antiguo sistema de escala de imágenes. Tokens + contexto
//  + provider + hooks. Persistencia adaptada a localStorage (igual que el
//  tema), tal como indica la guía de integración del motor.
// ═══════════════════════════════════════════════════════════════════
export const DENSITY_MODES = ['pequena', 'compacta', 'normal', 'comoda'];
// 4 niveles de densidad (slider). designW = ancho de diseño virtual (móvil): mayor =
// más zoom-out = todo más pequeño/elegante; menor = más grande. fixedZoom = tablet/PC.
export const DENSITY_TOKENS = {
  pequena:  { name:'pequena',  label:'Pequeña',  designW:470, fixedZoom:0.88, grid:{ gap:8  } },
  compacta: { name:'compacta', label:'Compacta', designW:438, fixedZoom:0.94, grid:{ gap:10 } },
  normal:   { name:'normal',   label:'Normal',   designW:408, fixedZoom:1.00, grid:{ gap:12 } },
  comoda:   { name:'comoda',   label:'Cómoda',   designW:380, fixedZoom:1.06, grid:{ gap:15 } },
};
export const DENSITY_STORAGE_KEY = 'retador_density';
export const DensityContext = createContext(null);
export function DensityProvider({ children, defaultMode = 'pequena' }) {
  const [mode, setModeState] = useState(() => {
    try { const v = localStorage.getItem(DENSITY_STORAGE_KEY); return v && DENSITY_MODES.includes(v) ? v : defaultMode; } catch { return defaultMode; }
  });
  const setMode = useCallback((next) => {
    if (!DENSITY_MODES.includes(next)) return;
    setModeState(next);
    try { localStorage.setItem(DENSITY_STORAGE_KEY, next); } catch {}
  }, []);
  const tokens = DENSITY_TOKENS[mode] || DENSITY_TOKENS.normal;
  const value = useMemo(() => ({ mode, setMode, tokens, modes: DENSITY_MODES, levelIndex: DENSITY_MODES.indexOf(mode) }), [mode, tokens]);
  return <DensityContext.Provider value={value}>{children}</DensityContext.Provider>;
}
export function useDensity() {
  const ctx = useContext(DensityContext);
  if (!ctx) throw new Error('useDensity debe usarse dentro de <DensityProvider>.');
  return ctx;
}
// Columnas por tipo de dispositivo. En teléfono: 2 bien espaciadas (no 3), como pediste.
// La densidad no cambia el nº de columnas, cambia la escala global de toda la app.
export function densityCols(mode, isDesktop, isTablet) {
  return isDesktop ? 5 : isTablet ? 3 : 2;
}
// Tamaño de texto: 4 pasos (Pequeño / Normal / Grande / Máx). El más pequeño se
// mantiene y crece de forma proporcionada hacia arriba, sin desbordar la interfaz.
export const TEXT_STEPS = [0.85, 1.0, 1.18, 1.4];
