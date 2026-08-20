// ═════════════════════════════════════════════════════════════════════════════
// RETADOR MARKETPLACE — Demo Version
// Versión de demostración con datos simulados para visualización
// ═════════════════════════════════════════════════════════════════════════════
import { useState, useEffect, useRef, useMemo, createContext, useContext, useCallback, lazy, Suspense } from "react";
import { User, Palette, Bell, Shield, MessageCircle, Truck, Gavel, CreditCard, BarChart2, Globe, HardDrive, HelpCircle, Info, ChevronRight, ArrowLeft, Check, Plus, Edit2, Camera, Lock, LogOut, MapPin, Clock, Download, FileText, Award, ShoppingBag, Package, AlertCircle, CheckCircle2, Zap, TrendingUp, Database, Mail, Phone, Fingerprint, Star, Volume2, Smartphone, Calendar, Activity, Send, ArrowDownLeft, ArrowUpRight, PlusCircle, Eye, EyeOff, ShieldCheck, Search, X, Users, QrCode, Landmark, Wallet, Home, History, UserCircle2, Copy, Share2, Loader2, Banknote, Building2, Trash2, KeyRound, BadgeCheck, Receipt, ArrowLeftRight } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// ═════════════════════════════════════════════════════════════════════════════
// CIMIENTOS COMPARTIDOS — conexión Supabase, backend, tema, catálogo y UI base.
// Viven en src/shared/ para poder reutilizarlos desde cada pantalla/sección.
// (La configuración de Supabase "EDITAR AQUÍ" está en src/shared/supabase.js)
// ═════════════════════════════════════════════════════════════════════════════
import {
  supabase,
  signInWithGoogle, signOutUser, loadSessionUser,
  MOCK_PRODUCTS, MOCK_USER,
  authSignUp, authSignIn, authSignOut, authGetSession,
  getUserById, getUserName, updateUserName, getSellerPlan,
  mapProduct, loadProducts, loadServices, getFeed, saveProduct, deleteProduct, getProductsBySeller, uploadImage,
  archiveProduct, unarchiveProduct, deleteProductHard, sweepExpiredArchives,
  sendMessage, loadMessages, markRead, markDelivered, getMyConversations,
  toggleFavorite, getMyFavorites, getPlatformStats, getPlatformConfig, setPlatformConfig, setPlatformBlocks, myPermissions, promoteProduct,
  getLedgerEntries, createEscrow, releaseEscrow, getSystemStatus,
  CURRENCIES, CURRENCY_CODES, DEFAULT_CURRENCY, money,
  createOrder, estimateDeliveryFee, getAvailableStock, writeProductRow,
  readRatings, aggRating, systemRating, serviceRating, serviceReviews, ratingForName, systemReviews,
  getUserOrders, updateOrderStatus, getUnreadCount, getProductById, getConversationById,
  getPendingCourierApplications, reviewCourierApplication,
  getNotifications, markNotificationsRead, markNotificationsReadByKind, refreshSessionProfile, isSuspendedUser,
  getPlans, getStoreConfig, upsertMyStoreConfig, getProfileHeaderStats, getSellerRatingInfo, getSellerReviews,
  ORDER_FLOW, SHIP_LABELS, MODALIDAD_LABELS,
  CONTACT_PATTERNS, maskContacts, CUBA_PROVINCES,
  trackEvent, blockUser, isBlocked, getBlockedUsers, getSB, convKey,
  G, BG, S, B, RCtx, useR, useResponsive, BC,
  DARK_T, LIGHT_T, AppThCtx, useAt, PlatformCfgContext,
  DENSITY_MODES, DENSITY_TOKENS, DENSITY_STORAGE_KEY, DensityContext, DensityProvider, useDensity, densityCols, TEXT_STEPS, DEFAULT_BLOCKS,
  CATS, SUBCATS, CatalogContext, CatalogProvider, useCatalog, CatIcon,
  useCSS, Ic, Spin, Logo,
  getPageLayout, liveSlot, LiveBlock, LiveSlot,
  useScrollDir, consumeBack, pushBackHandler, shouldIgnorePop, ErrorBoundary, ProfileSkeleton } from "./shared/index.js";
import { LocalDelivery, IntlShipping } from "./screens/Delivery.jsx";
import { CatModal, NotifPanel, BuyModal, AdvancedSearch, MarketHome, EditProductModal, ProductDetail, PubSheet, EnviosMenu, BottomNav, ServicesScreen } from "./screens/Marketplace.jsx";
// Carga bajo demanda (code splitting real) — estas pantallas son grandes y
// SOLO se montan detrás de un interruptor/pestaña que casi nadie toca en los
// primeros segundos (Billetera, Herramientas, Modo Mensajero, Subastas, y el
// Panel de administración, el más grande de todos) — que ya no viajen dentro
// del paquete inicial que descarga TODO el mundo solo para ver la Tienda es
// el cambio de más impacto sobre CUÁNTO hay que descargar. Cada una se usa
// exactamente igual que antes; solo cambia CUÁNDO se descarga su código.
const OmniPanel = lazy(() => import("./screens/AdminPanel.jsx"));
const WalletApp = lazy(() => import("./screens/Wallet.jsx"));
const ProductToolsApp = lazy(() => import("./screens/ProductTools.jsx"));
const CourierFlow = lazy(() => import("./screens/Courier.jsx").then(m => ({ default: m.CourierFlow })));
const SubastasScreen = lazy(() => import("./screens/Auctions.jsx").then(m => ({ default: m.SubastasScreen })));
// Relleno neutro mientras se descarga el código de una pantalla cargada bajo
// demanda (solo la primera vez que se abre en la sesión — después ya está en
// caché). Nunca pantalla en blanco/negra sin explicación.
const LazyFallback = () => <div style={{ position: "fixed", inset: 0, zIndex: 4000, background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}><Spin size={32} /></div>;
import { SettingsScreen } from "./screens/Settings.jsx";
import { FreeProfileScreen, ProfileMenuDrawer, FollowingListScreen } from "./screens/Profile.jsx";
import { MessagesScreen, ChatScreen } from "./screens/Messages.jsx";
import { OrderDetailScreen, OrdersScreen } from "./screens/Orders.jsx";
import { RetadorInicio, PantallaCargando } from "./screens/Inicio.jsx";
import { StoreFront, StoreDashboard } from "./screens/Store.jsx";
import OnboardingScreen from "./screens/Onboarding.jsx";
import InstallPrompt from "./pwa/InstallPrompt.jsx";
import PushPrompt from "./pwa/PushPrompt.jsx";
import { ensurePushSubscription } from "./pwa/push.js";

// Envuelve una sección de la plataforma: si está APAGADA (sectionsEnabled.X === false)
// la deja VISIBLE pero en SOLO LECTURA — un aviso discreto arriba y todo lo interactivo
// desactivado. fieldset[disabled] desactiva de forma nativa inputs/botones/selects; el
// onClickCapture con preventDefault+stopPropagation bloquea también los taps sobre
// tarjetas/enlaces (entrar a un detalle con acción) SIN impedir el scroll (un tap no es
// un scroll). onClose (opcional) da una salida SIEMPRE activa, fuera del fieldset, para
// overlays como la Billetera cuyo botón de cerrar quedaría atrapado si no.
function SectionGate({ enabled, children, onClose, dark = true }) {
  if (enabled !== false) return children;
  const bd = dark ? "#3a2e00" : "#FDE68A";
  const fg = dark ? "#FDE68A" : "#92400E";
  return (
    <div style={{ position: "relative", minHeight: "100%" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 70, display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", background: dark ? "#1a1400" : "#FFFBEB", borderBottom: `1px solid ${bd}`, color: fg, fontSize: 12.5, fontWeight: 700 }}>
        <span>🔜 Esta sección estará disponible pronto.</span>
        {onClose && <button onClick={onClose} style={{ marginLeft: "auto", background: "transparent", border: `1px solid ${bd}`, color: fg, borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Cerrar ✕</button>}
      </div>
      <fieldset disabled style={{ border: "none", padding: 0, margin: 0, minWidth: 0 }} onClickCapture={(e) => { e.preventDefault(); e.stopPropagation(); }}>
        {children}
      </fieldset>
    </div>
  );
}

// GRUPO 1, punto 5 — franja horaria de Subastas: si hay horario configurado y
// aún no ha empezado (o ya cerró), reemplaza la pantalla normal por un aviso
// claro con cuenta regresiva en vez de mostrarla vacía o inerte. Independiente
// del interruptor on/off de SectionGate (ese es "encendida/apagada"; esto es
// "dentro/fuera de horario").
function AuctionScheduleGate({ schedule, dark = true, children }) {
  const enabled = !!schedule?.enabled && schedule?.start && schedule?.end;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [enabled]);
  if (!enabled) return children;
  const toMin = (hhmm) => { const [h, m] = String(hhmm).split(":").map(Number); return (h || 0) * 60 + (m || 0); };
  const d = new Date(now);
  const curMin = d.getHours() * 60 + d.getMinutes();
  const startMin = toMin(schedule.start), endMin = toMin(schedule.end);
  const open = startMin === endMin ? true
    : startMin < endMin ? (curMin >= startMin && curMin < endMin)
    : (curMin >= startMin || curMin < endMin); // franja que cruza medianoche
  if (open) return children;
  const startToday = new Date(d); startToday.setHours(Math.floor(startMin / 60), startMin % 60, 0, 0);
  const startAt = startToday.getTime() > now ? startToday.getTime() : startToday.getTime() + 86400000;
  const totalSec = Math.max(0, Math.floor((startAt - now) / 1000));
  const hh = String(Math.floor(totalSec / 3600)).padStart(2, "0");
  const mm = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
  const ss = String(totalSec % 60).padStart(2, "0");
  const bg = dark ? "#0a0a0a" : "#f8fafc", fg = dark ? "#f0f0f0" : "#0f172a", sub = dark ? "#888" : "#64748b";
  return (
    <div style={{ flex: 1, minHeight: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center", background: bg }}>
      <div style={{ fontSize: 44, marginBottom: 14 }}>🕐</div>
      <div style={{ fontSize: 17, fontWeight: 800, color: fg, marginBottom: 6 }}>Las subastas abren a las {schedule.start}</div>
      <div style={{ fontSize: 13, color: sub, marginBottom: 20 }}>Vuelve más tarde para pujar y crear subastas.</div>
      <div style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 26, fontWeight: 800, color: "#FFC01E", letterSpacing: 2 }}>{hh}:{mm}:{ss}</div>
    </div>
  );
}
import { setThemeColor } from "./pwa/themeColor.js";


// OMNIPANEL — panel admin integrado (CSS aislado bajo .omni)

// Vista de productos por defecto de la plataforma (hasta que el admin la controle).
// "grid" = cuadrícula pareja; "muro" = masonry con alturas reales.
const PLATFORM_DEFAULT_VIEW = "grid";

// ═════════════════════════════════════════════════════════════════════════════
// APP ROOT
// ═════════════════════════════════════════════════════════════════════════════
export default function App() {
  // Control de sesión: undefined = comprobando, null = sin sesión, objeto = logueado.
  const [sessionUser, setSessionUser] = useState(undefined);
  // Estadísticas REALES de la plataforma para el login (get_platform_stats). null = no cargó.
  const [platformStats, setPlatformStats] = useState(null);
  useEffect(() => { getPlatformStats().then(s => setPlatformStats(s)).catch(() => {}); }, []);

  // ── ENLACE COMPARTIDO ("?openProduct="/"?openProfile=") ─────────────────────
  // Quien toca un enlace compartido (share-preview) MUCHAS veces NO tiene
  // cuenta todavía — viene de Facebook/Instagram viendo el producto por
  // primera vez. Antes esto solo se leía DENTRO de AppShell (requiere sesión
  // real), así que sin cuenta el enlace no llevaba a ningún lado: se veía la
  // bienvenida genérica y ahí se quedaba. Ahora se detecta aquí, ANTES de
  // exigir sesión, para poder mostrar el producto/perfil en modo invitado.
  const [deepLink, setDeepLink] = useState(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      const pid = q.get("openProduct"); const prid = q.get("openProfile");
      if (pid) return { type: "product", id: pid };
      if (prid) return { type: "profile", id: prid };
    } catch (e) {}
    return null;
  });

  // PANTALLA PRINCIPAL: SIEMPRE se muestra la bienvenida al abrir. Con sesión, el
  // botón entra al marketplace (no vuelve a mostrarse hasta reabrir / re-loguear).
  const [entered, setEntered] = useState(false);
  useEffect(() => { if (!sessionUser) setEntered(false); }, [sessionUser]);
  // ONBOARDING (idioma/región/intención) — se muestra UNA sola vez, justo tras
  // entrar, mientras profiles.onboarding_done_at siga en null (el backend es
  // la única fuente de verdad: nunca se vuelve a mostrar completo después de
  // terminarlo). onboardingComplete es un cerrojo LOCAL para esta sesión —
  // evita tener que releer sessionUser tras cada paso solo para saber si ya
  // se puede pasar a AppShell.
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const needsOnboarding = !!sessionUser && !onboardingComplete && !sessionUser?.profile?.onboarding_done_at;
  // Si YA hay sesión (p.ej. el propio dueño probando el enlace) y viene de un
  // enlace compartido, nos saltamos el toque manual de "Entrar a RETADOR" —
  // AppShell ya sabe abrir directo el producto/perfil (App.jsx lee
  // "?openProduct="/"?openProfile=" al montar).
  useEffect(() => { if (sessionUser && deepLink) setEntered(true); }, [sessionUser, deepLink]);
  // Sin sesión, viendo un producto/perfil en modo invitado: si toca "Iniciar
  // sesión", NO se dispara Google directo desde ahí — se muestra la MISMA
  // bienvenida de siempre (stats reales, botón "Entrar a RETADOR"), un solo
  // punto de entrada a toda la app. deepLink se conserva (no se limpia) para
  // que, si inicia sesión de verdad, caiga derecho de vuelta al producto.
  const [guestWantsAuth, setGuestWantsAuth] = useState(false);
  // Config editable de la bienvenida (subtítulo, texto del botón, color de acento),
  // en config.home. Se carga aquí (fuera de AppShell) y se mantiene EN VIVO con el
  // realtime de platform_config, para que un cambio del editor se vea al instante
  // aunque el usuario esté todavía en la pantalla de bienvenida. Los conteos de
  // stats son SIEMPRE reales (get_platform_stats), nunca editables.
  const [homeCfg, setHomeCfg] = useState({});
  useEffect(() => {
    let alive = true;
    getPlatformConfig().then(res => { if (alive && res?.config?.home) setHomeCfg(res.config.home); }).catch(() => {});
    const ch = supabase.channel("rt-home-cfg")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "platform_config" }, (payload) => {
        const cfg = payload?.new?.config;
        if (cfg && typeof cfg === "object" && cfg.home) setHomeCfg(cfg.home);
      })
      .subscribe();
    return () => { alive = false; try { supabase.removeChannel(ch); } catch (e) {} };
  }, []);

  useEffect(() => {
    let alive = true;
    loadSessionUser().then(u => { if (alive) setSessionUser(u); });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) { setSessionUser(null); return; }
      loadSessionUser().then(u => { if (alive) setSessionUser(u); });
    });
    return () => { alive = false; sub?.subscription?.unsubscribe?.(); };
  }, []);

  // La bienvenida SIGUE el mismo tema que el resto de la app (retador_theme, con
  // "auto" resuelto por el sistema) — nunca un tema fijo.
  let welcomeDark = true;
  try {
    const savedTheme = localStorage.getItem("retador_theme") || "auto";
    const prefersDark = typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    welcomeDark = savedTheme === "auto" ? !!prefersDark : savedTheme === "dark";
  } catch (e) {}

  // BUG REAL encontrado y corregido: esto forzaba las barras del sistema a
  // "#080808" fijo mientras no hay sesión (bienvenida/carga), SIN IMPORTAR que
  // la bienvenida de verdad se pinte clara cuando welcomeDark es false — así,
  // con el sistema en tema claro, la barra de estado/inferior quedaban oscuras
  // contra una pantalla clara: exactamente la franja sin cubrir/mal pintada que
  // se reportó (visible sobre todo en la captura de "apps recientes", que
  // congela el último frame real). Ahora las barras siguen SIEMPRE el mismo
  // tono que la pantalla que de verdad se está pintando, también antes de
  // iniciar sesión.
  useEffect(() => { if (!sessionUser) setThemeColor(welcomeDark ? "#080808" : "#FFFFFF"); }, [sessionUser, welcomeDark]);
  return (
    <>
      {sessionUser === undefined
        ? <PantallaCargando dark={welcomeDark} />
        : (
          <DensityProvider defaultMode="pequena">
            <CatalogProvider>
              {sessionUser
                ? (entered
                    ? (needsOnboarding
                        ? <OnboardingScreen user={sessionUser} onDone={() => {
                            // BUG REAL encontrado y corregido: antes esto ponía
                            // setOnboardingComplete(true) YA, en el mismo tick — eso
                            // revela <AppShell> de inmediato, que arranca su propio
                            // estado "user" leyendo sessionUser UNA sola vez al montar
                            // (useState(sessionUser)). Como loadSessionUser() es
                            // asíncrono, AppShell casi siempre alcanzaba a montar ANTES
                            // de que llegara el perfil fresco, y se quedaba pegado para
                            // siempre con profile.shop_province/onboarding_done_at
                            // viejos (aunque save_onboarding ya hubiera guardado bien en
                            // la base) — de ahí que el recordatorio de región siguiera
                            // apareciendo después de completar el onboarding. Ahora se
                            // espera a tener el perfil fresco ANTES de dejar pasar a
                            // AppShell, para que arranque ya con los datos reales.
                            loadSessionUser().then(u => { if (u) setSessionUser(u); setOnboardingComplete(true); });
                          }} />
                        : <AppShell sessionUser={sessionUser} />)
                    : <RetadorInicio onEnter={() => setEntered(true)} subtitle={homeCfg.subtitle} enterLabel={homeCfg.enterLabel} stats={platformStats} dark={welcomeDark} />)
                : (deepLink && !guestWantsAuth
                    ? <GuestDeepLinkPreview deepLink={deepLink} onChangeDeepLink={setDeepLink} onExit={() => setDeepLink(null)} onRequestAuth={() => setGuestWantsAuth(true)} />
                    : <RetadorInicio onGoogle={signInWithGoogle} subtitle={homeCfg.subtitle} stats={platformStats} dark={welcomeDark} />)}
            </CatalogProvider>
          </DensityProvider>
        )}
      {/* Cartel de instalación PWA propio — montado siempre, decide solo si se muestra */}
      <InstallPrompt />
    </>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// VISTA DE INVITADO — producto/perfil abierto desde un enlace compartido SIN
// sesión iniciada. Es el caso real de marketing (Facebook/Instagram): alguien
// que nunca ha usado RETADOR toca el enlace y tiene que poder ver la foto, el
// precio, la descripción y toda la tienda del vendedor — sin que le pidan
// cuenta solo para MIRAR. Comprar/chatear/valorar sí piden iniciar sesión
// (Google), igual que en toda la app.
// Reutiliza ProductDetail/FreeProfileScreen tal cual (los contextos de tema/
// densidad/config que usan ya tienen valores por defecto sensatos sin
// Provider, así que funcionan aquí afuera de AppShell sin problema).
function GuestDeepLinkPreview({ deepLink, onChangeDeepLink, onExit, onRequestAuth }) {
  const [product, setProduct] = useState(undefined);   // undefined=cargando, null=no existe
  const [profile, setProfile] = useState(undefined);
  const [sellerProducts, setSellerProducts] = useState([]);
  const [toast, setToast] = useState(null);
  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3200); };
  // NO dispara Google directo desde acá — manda a la MISMA bienvenida de
  // siempre (App.jsx conserva deepLink, así que si de verdad inicia sesión
  // cae derecho de vuelta a este producto/perfil). Un solo punto de entrada.
  const requireAuth = () => { onRequestAuth(); return false; };

  useEffect(() => {
    let alive = true;
    if (deepLink.type === "product") {
      setProduct(undefined);
      getProductById(deepLink.id).then(p => { if (alive) setProduct(p || null); }).catch(() => { if (alive) setProduct(null); });
    } else {
      setProfile(undefined);
      getUserById(deepLink.id).then(u => { if (alive) setProfile(u || null); }).catch(() => { if (alive) setProfile(null); });
      getProductsBySeller(deepLink.id, { publicView: true }).then(list => { if (alive) setSellerProducts(list); }).catch(() => {});
    }
    return () => { alive = false; };
  }, [deepLink.type, deepLink.id]);

  const signInBar = (
    <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 70, background: "rgba(8,8,8,.94)", backdropFilter: "blur(14px)", borderTop: "1px solid #222", padding: "11px 16px calc(11px + env(safe-area-inset-bottom,0px))", display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ flex: 1, fontSize: 11.5, color: "#ccc", fontWeight: 600, lineHeight: 1.35 }}>🔑 Inicia sesión para comprar, chatear o valorar</span>
      <button onClick={onRequestAuth} style={{ background: "#FFC01E", color: "#000", border: "none", borderRadius: 999, padding: "9px 16px", fontSize: 12, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" }}>Iniciar sesión</button>
    </div>
  );
  const toastEl = toast && (
    <div style={{ position: "fixed", left: "50%", bottom: 74, transform: "translateX(-50%)", zIndex: 80, background: "rgba(28,28,30,.96)", color: "#fff", padding: "10px 16px", borderRadius: 12, fontSize: 12.5, fontWeight: 600, maxWidth: "88vw", textAlign: "center" }}>{toast}</div>
  );
  const notFound = (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "#080808", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: 24, textAlign: "center" }}>
      <div style={{ fontSize: 44 }}>🔍</div>
      <p style={{ color: "#fff", fontSize: 15, fontWeight: 700 }}>Esto ya no está disponible</p>
      <button onClick={onExit} style={{ background: "#FFC01E", color: "#000", border: "none", borderRadius: 999, padding: "12px 22px", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Ver RETADOR</button>
    </div>
  );

  if (deepLink.type === "product") {
    if (product === undefined) return <PantallaCargando />;
    if (product === null) return notFound;
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "#080808", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", paddingBottom: 56 }}>
          <ProductDetail product={product} onBack={onExit}
            onDelivery={() => {}} onChat={() => {}} onViewProfile={(id) => onChangeDeepLink({ type: "profile", id })}
            onBuy={() => {}} onFav={() => {}} isFav={false} flash={flash} requireAuth={requireAuth}
            user={null} canChat={false} onDelete={null} onEdit={null} />
        </div>
        {signInBar}{toastEl}
      </div>
    );
  }

  if (profile === undefined) return <PantallaCargando />;
  if (profile === null) return notFound;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "#080808", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", paddingBottom: 56 }}>
        <FreeProfileScreen onBack={onExit} user={null} sellerId={deepLink.id} initialProfile={{}}
          onProfileUpdate={() => {}} isOwner={false} onChat={requireAuth} isVerified={!!profile.verified}
          onReport={() => {}} userProducts={sellerProducts} onProduct={(p) => onChangeDeepLink({ type: "product", id: p.id })} />
      </div>
      {signInBar}{toastEl}
    </div>
  );
}

function AppShell({ sessionUser }) {
  useCSS();
  const rsp = useResponsive();
  // Categorías reales (backend, vía CatalogProvider) — para hacer coincidir la
  // categoría de un producto importado (Herramientas → Importador) con una
  // categoría real de verdad, sin localStorage (retador_cats ya no existe: ver
  // Ronda 6, categorías de productos reales).
  const { cats: realCatsList } = useCatalog();

  // Estado inicial configurado directamente - sin login, solo visual
  const [scr,       setScr]       = useState("main");
  const [tab,       setTab]       = useState("market");
  const [user,      setUser]      = useState(sessionUser); // usuario REAL logueado (Supabase)
  // ¿Cuenta SUSPENDIDA? Bloquea toda la app. Se confirma con el backend al entrar y
  // se actualiza EN VIVO por realtime (perfil/notificación kind='account').
  const [suspended, setSuspended] = useState(!!sessionUser?.suspended);
  const [toast,     setToast]     = useState(null);
  const flashTmrRef = useRef(null);
  const [unread,    setUnread]    = useState(0); // contador de no leídos (real)
  // (el contador real de notificaciones es unreadNotif, calculado más abajo)

  // Sub-pantallas
  const [mScr,      setMScr]      = useState("home");
  const [pScr,      setPScr]      = useState("main");
  const [eScr,      setEScr]      = useState("menu");

  // Selección activa
  const [selProd,   setSelProd]   = useState(null);
  const [prodBackTo, setProdBackTo] = useState(null);
  const [editProd,  setEditProd]  = useState(null);
  const [confirmCfg, setConfirmCfg] = useState(null);
  const askConfirm = (msg, onYes, opts = {}) => setConfirmCfg({ msg, onYes, label: opts.label || "Eliminar", color: opts.color || "#ef4444" });
  const updateProduct = async (id, changes) => {
    const upd = {};
    if (changes.title       !== undefined) upd.title       = changes.title;
    if (changes.price       !== undefined) upd.price       = Number(changes.price) || 0;
    if (changes.origPrice   !== undefined) upd.orig_price  = changes.origPrice == null ? null : (Number(changes.origPrice) || null);
    if (changes.description !== undefined) upd.description = changes.description;
    if (changes.cat         !== undefined) upd.cat         = changes.cat || null;
    if (changes.subcat      !== undefined) upd.subcat      = changes.subcat || null;
    if (changes.images      !== undefined) upd.images      = Array.isArray(changes.images) ? changes.images : [];
    // Formas de entrega y sus datos (mismas columnas que usa handlePublish).
    if (changes.shipModes     !== undefined) upd.ship_modes     = changes.shipModes;
    if (changes.shippingPrice !== undefined) upd.ship_price     = Number(changes.shippingPrice) || 0;
    if (changes.pickupAddress !== undefined) upd.pickup_address = changes.pickupAddress || null;
    if (changes.pickupPhone   !== undefined) upd.pickup_phone   = changes.pickupPhone || null;
    if (changes.location      !== undefined) upd.location       = changes.location || null;
    if (changes.currency      !== undefined) upd.currency       = changes.currency || "USD";
    // GRUPO 1 — cantidad disponible, descuentos por cantidad, monedas aceptadas.
    if (changes.stock              !== undefined) upd.stock               = Number(changes.stock) || 0;
    if (changes.bulkDiscounts      !== undefined) upd.bulk_discounts      = Array.isArray(changes.bulkDiscounts) ? changes.bulkDiscounts : [];
    if (changes.acceptedCurrencies !== undefined) upd.accepted_currencies = Array.isArray(changes.acceptedCurrencies) ? changes.acceptedCurrencies : [];
    // "Destacado" (gratis, del propio vendedor) — se ve en el carrusel de
    // Destacados de Inicio de su Tienda. Se cambia con un toque, sin abrir el
    // formulario de edición completo (ver interruptor en Mi Panel → Productos).
    if (changes.storeFeatured   !== undefined) upd.store_featured   = !!changes.storeFeatured;
    // Al editar, una publicación RETIRADA vuelve a quedar visible (approved).
    upd.moderation_status = "approved";
    let data, missing;
    try {
      const res = await writeProductRow((r) => supabase.from("products").update(r).eq("id", id).select().single(), upd);
      data = res.data; missing = res.missing;
    } catch (error) { flash("⚠️ " + (error.message || "No se pudo editar")); return; }
    const mapped = mapProduct(data);
    setProducts(prev => { const exists = prev.some(p => p.id === id); return exists ? prev.map(p => p.id === id ? mapped : p) : (mapped.kind === "service" ? prev : [mapped, ...prev]); });
    setServices(prev => prev.map(p => p.id === id ? mapped : p));
    reloadOwn();
    flash(missing?.length ? `✏️ Actualizado, pero el backend aún no guarda: ${missing.join(", ")}` : "✏️ Publicación actualizada");
  };
  const [selChat,   setSelChat]   = useState(null);
  const [selSeller, setSelSeller] = useState(null);
  // Perfil PÚBLICO flotante: se abre al tocar el nombre/avatar de cualquiera desde
  // el pool del mensajero, el detalle del pedido, el chat o el detalle de producto.
  // Solo muestra reputación pública (nombre, foto, verificado, productos): nunca el
  // historial privado ni los números de negocio de esa persona.
  const [viewProfileId, setViewProfileId] = useState(null);
  const openPublicProfile = (id) => { if (id) setViewProfileId(id); };
  // Producto abierto como CAPA (desde un perfil público, incluido el modo
  // mensajero): se muestra encima de todo y el atrás lo cierra por capas.
  const [viewProdOverlay, setViewProdOverlay] = useState(null);
  const marketScrollRef = useRef(0); // posición del feed (se restaura al volver de un producto)
  useEffect(() => {
    if (!viewProdOverlay) return;
    return pushBackHandler(() => setViewProdOverlay(null));
  }, [viewProdOverlay]);
  // El perfil flotante es una capa: el botón ATRÁS del teléfono la cierra (vuelve
  // al chat/pantalla de abajo), nunca cierra la app. Una capa = un atrás.
  useEffect(() => {
    if (!viewProfileId) return;
    return pushBackHandler(() => setViewProfileId(null));
  }, [viewProfileId]);

  // Overlays
  const [showCats,   setShowCats]   = useState(false);
  const [pubOpen,    setPubOpen]    = useState(false);
  // Categoría precargada al publicar desde el atajo "Publicar en [categoría]"
  // de Búsqueda — se limpia al cerrar el formulario para no arrastrarla a la
  // próxima publicación normal (+ Publicar).
  const [pubPrefillCat, setPubPrefillCat] = useState(null);
  const [showNotif,  setShowNotif]  = useState(false);
  const [chatOpen,   setChatOpen]   = useState(false);
  // Conversación EN PANTALLA ahora mismo (la resuelve ChatScreen vía onConvId). Sirve
  // para no sumar ruido (toast/badge) a un mensaje de la MISMA conversación que ya se
  // está viendo. Se usa por ref dentro del canal realtime para no reconectarlo.
  const [openConvId, setOpenConvId] = useState(null);
  useEffect(() => { if (!chatOpen) setOpenConvId(null); }, [chatOpen]);
  const chatOpenRef = useRef(chatOpen); useEffect(() => { chatOpenRef.current = chatOpen; }, [chatOpen]);
  const openConvIdRef = useRef(openConvId); useEffect(() => { openConvIdRef.current = openConvId; }, [openConvId]);
  // ── Aviso de MENSAJES NUEVOS en tiempo real (global) ────────────────────────
  // Cuenta los mensajes sin leer y se actualiza al instante con el realtime de
  // `messages` (cualquier INSERT/UPDATE de mis conversaciones refresca el número).
  // Alimenta el badge del botón "Mensajes" del perfil y el de la barra inferior.
  const [chatUnread, setChatUnread] = useState(0);
  const reloadChatUnread = useCallback(() => {
    if (!user?.id) { setChatUnread(0); return; }
    getUnreadCount(user.id).then(setChatUnread).catch(() => {});
  }, [user?.id]);
  useEffect(() => { reloadChatUnread(); }, [reloadChatUnread]);
  // Al cerrar el chat (volver a la lista), refresca al instante: lo leído deja de contar.
  useEffect(() => { if (!chatOpen) reloadChatUnread(); }, [chatOpen, reloadChatUnread]);
  // (La suscripción realtime vive más abajo, en el CANAL GLOBAL único rt-global-<uid>,
  //  junto con la de pedidos — después de declarar loadOrders.)
  const [showAdmin,  setShowAdmin]  = useState(false);
  // Página con la que abre el panel la PRÓXIMA vez que se monte (p.ej. al tocar
  // una notificación de nueva solicitud). null = abre donde siempre (resumen).
  const [adminOpenPage, setAdminOpenPage] = useState(null);
  // Solicitudes REALES de mensajero (courier_applications) para el panel admin.
  const [courierApps, setCourierApps] = useState([]);
  const reloadCourierApps = useCallback(() => {
    getPendingCourierApplications().then(setCourierApps).catch(() => {});
  }, []);
  useEffect(() => { if (user?.role === "admin") reloadCourierApps(); }, [user?.role, reloadCourierApps]);
  useEffect(() => { if (showAdmin && user?.role === "admin") reloadCourierApps(); }, [showAdmin, user?.role, reloadCourierApps]);
  const [showWallet, setShowWallet] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [toolApp, setToolApp] = useState(false);
  const [showCourier, setShowCourier] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false); // pantalla "Siguiendo" (☰ → Siguiendo)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false); // panel lateral del Perfil (☰)
  // RETIRADO: el registro local de mensajeros (retador_couriers en localStorage)
  // ya NO es vía de aprobación. La única vía real es courier_applications en el
  // backend + review_courier_application del admin (que pone role='courier').
  // El mensajero acepta una entrega disponible — se registra en el backend con RPC
  // segura. Si propone una tarifa mayor a la base, el backend deja el pedido a la
  // espera de que el comprador la apruebe. Nunca tocamos el status a mano.
  const acceptDelivery = async (orderId, fee) => {
    const o = mergedOrders.find(x => x.id === orderId);
    const baseFee = (o?.deliveryCost) || (o?.shipPrice) || o?.shipCost || 0;
    const newFee = (fee != null && fee > 0) ? Math.round(fee) : baseFee;
    const { error } = await supabase.rpc("courier_accept_delivery", { p_order_id: orderId, p_fee: newFee, p_base_fee: baseFee });
    if (error) { console.error("courier_accept_delivery:", error.message); flash("⚠️ No se pudo aceptar: " + error.message); return; }
    await loadOrders();
    flash(newFee > baseFee ? "✅ Aceptada · tarifa propuesta enviada al comprador" : "✅ Entrega aceptada");
  };
  // El mensajero libera una entrega → vuelve a estar disponible para otro.
  const cancelDelivery = (orderId) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const idx = (o.flow || []).findIndex(s => s.key === "confirmado");
      return { ...o, courierName: null, courierStage: null, proposedFee: null, baseFee: null, feeApproval: null, stepIdx: idx >= 0 ? Math.min(o.stepIdx || 0, idx) : (o.stepIdx || 0), history: [...(o.history || []), { key: "liberado", label: "Entrega liberada", at: Date.now(), note: "El mensajero liberó la entrega. Disponible de nuevo." }] };
    }));
  };
  // El comprador aprueba o rechaza la tarifa propuesta por el mensajero — vía RPC
  // segura en el backend. Recarga desde el backend para que todos vean lo mismo.
  const buyerApproveFee = async (orderId, ok) => {
    const { error } = await supabase.rpc("buyer_respond_fee", { p_order_id: orderId, p_approve: !!ok });
    if (error) { console.error("buyer_respond_fee:", error.message); flash("⚠️ No se pudo responder: " + error.message); return; }
    await loadOrders();
    flash(ok ? "✅ Tarifa aprobada — el mensajero ya puede recoger" : "Tarifa rechazada · disponible de nuevo");
  };
  // Panel de administración: SOLO para cuentas con rol real de admin en el backend
  // (el dueño ya tiene role='admin' en profiles). Ya no está abierto para todos.
  const isOwner = user?.role === "admin";
  // Permisos A LA CARTA del panel: "ALL" (admin) o { seccion: none|view|manage }.
  // null = aún cargando. Se refresca en vivo con notificaciones kind='account'.
  const [adminPerms, setAdminPerms] = useState(null);
  const loadPerms = useCallback(() => {
    if (!user?.id) { setAdminPerms(null); return; }
    myPermissions().then(p => setAdminPerms(p)).catch(() => setAdminPerms({}));
  }, [user?.id]);
  useEffect(() => { loadPerms(); }, [loadPerms]);
  // ¿Puede abrir el panel? Admin (ALL) o al menos una sección distinta de "none".
  const hasPanel = adminPerms === "ALL" || (adminPerms && typeof adminPerms === "object" && Object.values(adminPerms).some(v => v && v !== "none"));
  // Notificaciones PUSH: en CADA carga, si el permiso ya está concedido, auto-renueva
  // la suscripción EN SILENCIO — la reasocia a ESTE usuario (evita que, con varias
  // cuentas en el mismo teléfono, los avisos vayan a la cuenta anterior) y, si no
  // existe o expiró, la recrea sin volver a pedir permiso. El usuario nunca lo nota.
  useEffect(() => { if (user?.id) ensurePushSubscription(user.id); }, [user?.id]);
  // Configuración editable de la plataforma (controlada desde el panel admin, persiste)
  const [adminCfg, setAdminCfg] = useState(() => {
    const defaults = {
      commissionPct: 10, commissionActive: true,
      commDeliveryPct: 15, commIntlPct: 10, commServicePct: 12, commVipPct: 10,
      localBase: 150, localPerKm: 25,
      deliveryServiceActive: true,
      deliveryCurrency: "CUP", deliveryMinKm: 1,
      courierAdjustMaxPct: 30,
      surgeActive: false, surgeIntervalMin: 30, surgeStepPct: 15, surgeCapPct: 60,
      rates: { "España": { aereo: 12, maritimo: 5 }, "Estados Unidos": { aereo: 14, maritimo: 6 } },
      fx: { usdToCup: 400, eurToCup: 430 },
      promos: [{ id: 1, text: "Envío gratis en tu primer pedido", active: true }],
      plans: [
        { id: 'basico', name: 'Básico', price: 0, promo: false, promoPrice: 0, features: ['Publicar productos', 'Vender con comisión estándar', 'Chat con compradores'] },
        { id: 'pro', name: 'Pro', price: 5, promo: false, promoPrice: 0, features: ['Todo lo del Básico', 'Menos comisión por venta', 'Insignia Pro', 'Estadísticas de ventas'] },
        { id: 'premium', name: 'Premium', price: 12, promo: false, promoPrice: 0, features: ['Todo lo del Pro', 'Aparecer en Tiendas Premium', 'Soporte prioritario', 'Destacar productos'] },
      ],
      team: [],
      // Pantalla principal (bienvenida) — editable desde el Editor Visual.
      home: { subtitle: "AHORA EN BETA PÚBLICA", enterLabel: "Entrar a RETADOR" },
      // Secciones de la plataforma encendidas/apagadas (apagada = solo lectura).
      // El backend siembra los valores reales; estos son el respaldo local.
      sectionsEnabled: { marketplace: true, search: true, deliveryLocal: true, intlShipping: false, auctions: true, wallet: false },
      // Categorías propias de SERVICIOS (no las de productos), editables por el admin.
      serviceCats: ["Diseño", "Reparaciones", "Transporte", "Clases", "Belleza", "Tecnología", "Construcción", "Limpieza", "Fotografía", "Otro"],
      // Franja horaria de Subastas (opcional): si enabled=true y estamos fuera de
      // [start,end), se muestra "abren a las HH:MM" en vez de la pantalla normal.
      auctionSchedule: { enabled: false, start: "09:00", end: "21:00" },
      // Editor Visual: layout por pantalla (anclas + refs) y masters (contenido).
      blocks: DEFAULT_BLOCKS,
      masters: {},
    };
    // BANNER FANTASMA: blocks/masters (contenido visual del Editor) NUNCA salen del
    // caché local — solo del backend fresco. Así el primer render no pinta banners
    // viejos guardados localmente antes de que llegue la config real.
    try { const r = localStorage.getItem("retador_admincfg"); if (r) { const p = JSON.parse(r); delete p.blocks; delete p.masters; return { ...defaults, ...p }; } } catch {}
    return defaults;
  });
  useEffect(() => { try { const { blocks, masters, ...rest } = adminCfg; localStorage.setItem("retador_admincfg", JSON.stringify(rest)); } catch {} }, [adminCfg]);
  // Fecha de última actualización de la config (para la tirita de tasas del perfil).
  const [cfgUpdatedAt, setCfgUpdatedAt] = useState(null);
  // Espejo del adminCfg más reciente (para guardar el objeto COMPLETO sin depender del render).
  const latestCfgRef = useRef(adminCfg);
  useEffect(() => { latestCfgRef.current = adminCfg; }, [adminCfg]);
  const cfgSaveTimer = useRef(null);
  // Marca si ya llegó la config del backend: mientras no llegue, exchange_rates puede
  // rellenar fx; cuando llega platform_config, ESA manda (fuente de verdad única).
  const cfgFromBackend = useRef(false);
  // 1) CARGAR LA CONFIG DEL BACKEND al arrancar — ÚNICA fuente de verdad para TODO
  //    (incluida fx, la tirita de tasas). localStorage queda solo como caché de
  //    respaldo hasta que llega la del backend. Con reintento: en redes
  //    intermitentes, si el primer intento falla, la tasa se quedaría pegada al
  //    valor cacheado sin corregirse nunca — este es el bug real que hacía que la
  //    tirita a veces mostrara un valor viejo/incorrecto.
  useEffect(() => {
    let alive = true, retry = 0, timer = null;
    const load = () => {
      getPlatformConfig().then(res => {
        if (!alive) return;
        if (!res) { if (retry < 6) { retry++; timer = setTimeout(load, Math.min(1500 * 2 ** retry, 20000)); } return; }
        cfgFromBackend.current = true;
        setAdminCfg(prev => ({ ...prev, ...res.config }));
        if (res.updatedAt) setCfgUpdatedAt(res.updatedAt);
      }).catch(() => { if (alive && retry < 6) { retry++; timer = setTimeout(load, Math.min(1500 * 2 ** retry, 20000)); } });
    };
    load();
    return () => { alive = false; if (timer) clearTimeout(timer); };
  }, []);
  const [buyModal,   setBuyModal]   = useState(null);
  const [plusMenu,   setPlusMenu]   = useState(null); // { top, right } posición del dropdown
  // BUG REAL encontrado: el fondo invisible que cierra este dropdown usa zIndex:9000
  // (más alto que CUALQUIER otro overlay de la app: chat/admin/billetera llegan a
  // 5100-5300, el modo mensajero a 4000). Si el "+" queda abierto y el usuario cambia
  // de pestaña por un camino que no pasa por onTab (p.ej. openMessages hace
  // setTab("perfil") directo), ese fondo transparente queda flotando SOBRE TODO,
  // tragándose el primer toque en cualquier pantalla sin ningún indicio visual — así
  // se veía un botón "pintado" (p.ej. "Entregué" del mensajero) que no reaccionaba al
  // tocarlo. Cerrarlo en CADA cambio de pestaña, sin importar el camino, lo evita de raíz.
  useEffect(() => { setPlusMenu(null); }, [tab]);
  const [subOpenCreate, setSubOpenCreate] = useState(false); // abre CreateAuction directo
  const [profileData, setProfileData] = useState({
    // Foto real del usuario (Google/Supabase) si la hay; si no, null → inicial.
    // Ya NO se usa emoji como avatar por defecto.
    avatar: sessionUser?.avatar ? { type: "image", value: sessionUser.avatar } : null,
    name: sessionUser?.name || "Usuario",
    email: sessionUser?.email || "",
    bio: "",
    rating: 0,
    sales: 0,
  });
  // Carga la BIOGRAFÍA (y refresca rol/nombre/foto) reales del perfil al iniciar.
  useEffect(() => {
    if (!sessionUser?.id) return;
    refreshSessionProfile(sessionUser.id).then(p => {
      if (!p) return;
      setProfileData(prev => ({ ...prev, bio: p.bio || prev.bio || "", name: p.name || prev.name, avatar: p.avatar ? { type: "image", value: p.avatar } : prev.avatar }));
      if (typeof p.suspended === "boolean") setSuspended(p.suspended);
    }).catch(() => {});
    // Confirmación autoritativa con el backend (por si el perfil de sesión venía cacheado).
    isSuspendedUser().then(s => setSuspended(!!s)).catch(() => {});
  }, [sessionUser?.id]);

  // Productos y búsqueda - Productos ya cargados
  const [products,  setProducts]  = useState([]); // productos REALES del backend (kind='product')
  const [services,  setServices]  = useState([]); // SERVICIOS (kind='service') — mundo aparte
  const [loading,   setLoading]   = useState(true);
  // Cargar productos reales (sin login: política pública active+approved). Se
  // extrae a una función reutilizable para el pull-to-refresh de la Tienda —
  // recarga los datos SIN navegar/recargar la página (así el scroll no salta).
  const reloadFeed = useCallback(async () => {
    setLoading(true);
    // Productos y servicios son dos peticiones independientes (no una depende
    // de la otra) — antes se esperaban una detrás de la otra sin necesidad;
    // ahora salen juntas, así que servicios ya no le agrega tiempo de espera
    // extra a ver los productos (que sigue resolviendo primero de todas formas).
    const [list, svcs] = await Promise.all([
      loadProducts().catch(() => []),
      loadServices().catch(() => []),
    ]);
    setProducts(list);
    setLoading(false);
    setServices(svcs);
  }, []);
  useEffect(() => { reloadFeed(); }, []);
  // MIS publicaciones (productos + servicios, INCLUIDAS las retiradas): el dueño las
  // ve todas en su perfil, marcando las retiradas. Fuente: getProductsBySeller (sin filtrar).
  const [ownListings, setOwnListings] = useState([]);
  // Archivados (SOLO el dueño los ve — nunca públicos): pestaña aparte en "Mis
  // productos". Antes de cada carga se barre lo vencido de forma silenciosa
  // (sweep_expired_archives) — mientras no exista un cron real, el uso normal
  // de la pantalla lo hace por su cuenta.
  const [ownArchived, setOwnArchived] = useState([]);
  const reloadOwn = useCallback(() => {
    if (!sessionUser?.id) return;
    sweepExpiredArchives().finally(() => {
      getProductsBySeller(sessionUser.id).then(setOwnListings).catch(() => {});
      getProductsBySeller(sessionUser.id, { archived: true }).then(setOwnArchived).catch(() => {});
    });
  }, [sessionUser?.id]);
  useEffect(() => { reloadOwn(); }, [reloadOwn]);
  // NOTA: antes había aquí una segunda consulta a la tabla `exchange_rates` como
  // "respaldo" de las tasas mientras platform_config cargaba. Se quita: era una
  // SEGUNDA fuente de verdad compitiendo con config.fx (el admin solo edita
  // platform_config, nunca esa tabla), y si platform_config tardaba o fallaba,
  // la tirita podía quedarse mostrando un valor de esa tabla distinto/desactualizado.
  // Ahora fx sale SIEMPRE de config.fx (con reintento arriba, ver punto 9).
  const [search,    setSearch]    = useState("");
  const [filter,    setFilter]    = useState("TODOS");
  // Región real del usuario (profiles.shop_province, elegida en el onboarding
  // o en Configuración → Región) — SOLO reordena en silencio "Todos los
  // productos" (los de su región primero, el resto después, nunca vacío). Sin
  // ningún filtro/interruptor visible: el dueño decidió que sea lógica interna.
  const myProvince = user?.profile?.shop_province || null;
  // VISTA de productos (Cuadrícula / Muro). Preferencia del usuario, persistente.
  // Si no hay preferencia, se usa el default de plataforma (luego lo pondrá el admin).
  const [productView, setProductView] = useState(() => { try { return localStorage.getItem("retador_prodview") || PLATFORM_DEFAULT_VIEW; } catch { return PLATFORM_DEFAULT_VIEW; } });
  useEffect(() => { try { localStorage.setItem("retador_prodview", productView); } catch (e) {} }, [productView]);
  // Navegación desde botones de bloques publicados en el Editor Visual
  const navTo = (dest) => {
    if (!dest) return;
    if (dest === "inicio") { setTab("market"); setMScr("home"); }
    else if (dest === "busqueda") { setTab("search"); }
    else if (dest === "delivery_local") { setTab("envios"); setEScr("local"); }
    else if (dest === "delivery_intl") { setTab("envios"); setEScr("intl"); }
    else if (dest === "subastas") { setTab("subastas"); }
    else if (dest === "ofertas") { setTab("market"); setMScr("home"); setFilter("OFERTAS"); }
    else if (dest === "mas_vendidos") { setTab("market"); setMScr("home"); setFilter("RECOMENDADO"); }
    else if (dest === "nuevos") { setTab("market"); setMScr("home"); setFilter("NUEVO"); }
  };
  const [activeCat, setActiveCat] = useState(null);
  const [favorites, setFavorites] = useState(() => { try { const r = localStorage.getItem("retador_favs"); if (r) return new Set(JSON.parse(r)); } catch {} return new Set(); });
  const [favProducts, setFavProducts] = useState([]); // productos favoritos (get_my_favorites) para la pantalla de Favoritos
  useEffect(() => { try { localStorage.setItem("retador_favs", JSON.stringify([...favorites])); } catch {} }, [favorites]);
  // Cargar favoritos REALES del backend al entrar (get_my_favorites). El localStorage
  // es solo caché offline; la verdad la manda el backend.
  useEffect(() => {
    let alive = true;
    if (!user?.id) return;
    getMyFavorites()
      .then(({ products: favs, ids }) => { if (!alive) return; setFavProducts(favs); if (ids.length || favs.length) setFavorites(new Set(ids.length ? ids : favs.map(p => p.id))); })
      .catch(() => {});
    return () => { alive = false; };
  }, [user?.id]);

  // App-level appearance — persiste en localStorage
  const [appTheme, setAppTheme] = useState(() => {
    try { return localStorage.getItem("retador_theme") || "auto"; } catch { return "auto"; }
  });
  const [appTextScale, setAppTextScale] = useState(() => {
    // Si había guardado el 5º nivel (1.62, ya eliminado), cae al mayor válido (1.4).
    try { const v = parseFloat(localStorage.getItem("retador_txt_scale")); if (!v) return 1; return TEXT_STEPS.reduce((best, s) => Math.abs(s - v) < Math.abs(best - v) ? s : best, TEXT_STEPS[1]); } catch { return 1; }
  });

  // Densidad visual → normalización por ANCHO DE DISEÑO.
  // En móvil la app se maqueta SIEMPRE a un ancho virtual fijo por modo y se escala
  // para caber en cada pantalla, de modo que todo teléfono renderiza el MISMO layout.
  // Esto resuelve que el POCO F7 (menos px CSS) se viera apretado y rectangular,
  // mientras el Note 11 se veía aireado: ahora ambos rinden idéntico.
  const { mode: densMode, tokens: densTok } = useDensity();
  let densZoom = rsp.isMobile
    ? (rsp.w / (densTok.designW || 408))
    : (densTok.fixedZoom || 1);
  // Tamaño del texto: magnifica TODA la app proporcionalmente. Como el 96% de los
  // tamaños de fuente son fijos, escalarlo aquí (sobre el zoom global) es lo que hace
  // que el ajuste de texto funcione en cada pantalla sin romper ningún layout.
  densZoom = densZoom * (appTextScale || 1);
  densZoom = Math.max(0.5, Math.min(2.0, densZoom));

  // Nav inferior estilo Facebook: se oculta al hacer scroll hacia abajo y reaparece
  // al subir. Detecta el scroll de cualquier pantalla via captura.
  const [navHidden, setNavHidden] = useState(false);
  const navScrollRef = useRef(0);
  const handleNavScroll = useCallback((e) => {
    const el = e.target;
    if (!el || typeof el.scrollTop !== "number") return;
    const st = el.scrollTop;
    const last = navScrollRef.current;
    if (st > last + 8 && st > 56) setNavHidden(true);          // bajando → ocultar
    else if (st < last - 8 || st <= 4) setNavHidden(false);    // subiendo → mostrar
    navScrollRef.current = st < 0 ? 0 : st;
  }, []);
  useEffect(() => { setNavHidden(false); navScrollRef.current = 0; }, [tab, mScr, pScr, eScr]);


  const effectiveTheme = appTheme === "auto"
    ? (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : appTheme;
  // ts queda en 1: el escalado de texto se aplica de forma global (arriba), evitando
  // doble escala en los pocos componentes que multiplicaban por ts.
  const appTk = { ...(effectiveTheme === "light" ? LIGHT_T : DARK_T), imgScale: densZoom, ts: 1 };

  // Aviso al cambiar de tema: en algunos teléfonos (Xiaomi/MIUI) la barra de
  // estado no toma bien el color nuevo hasta reabrir la app, así que avisamos con
  // un cartel claro, pintado ya con el tema NUEVO. Inteligente: solo aparece si
  // el aspecto realmente cambió (p. ej. auto→oscuro con el teléfono ya en oscuro
  // no muestra nada) y se cierra solo o al tocarlo.
  const [themeNotice, setThemeNotice] = useState(false);
  const themeNoticeTimer = useRef(null);
  const changeTheme = (t) => {
    const effOf = (x) => x === "auto"
      ? (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : x;
    const before = effOf(appTheme);
    const after = effOf(t);
    setAppTheme(t);
    try { localStorage.setItem("retador_theme", t); } catch {}
    // Repinta las barras YA MISMO, en el mismo instante del toque — no espera
    // al próximo render (el efecto de abajo, atado a appTk.BG, solo corre DESPUÉS
    // de que React confirme el nuevo render; ese frame de por medio era la
    // ventana real donde un redimensionado del sistema podía tomar el color
    // viejo). Sincrónico e inmediato, sin transición.
    setThemeColor(after === "dark" ? DARK_T.BG : LIGHT_T.BG);
    if (after !== before) {
      setThemeNotice(true);
      clearTimeout(themeNoticeTimer.current);
      themeNoticeTimer.current = setTimeout(() => setThemeNotice(false), 8000);
    }
  };
  useEffect(() => () => clearTimeout(themeNoticeTimer.current), []);

  // Barras del sistema = tono exacto del tema actual. Al cambiar de tema (claro/
  // oscuro) cambia appTk.BG y este efecto vuelve a pintar la meta theme-color al
  // instante, para que NUNCA se note un corte entre las barras y el fondo.
  useEffect(() => { setThemeColor(appTk.BG); }, [appTk.BG]);
  // Repintado de refuerzo en los momentos REALES donde Android redimensiona o
  // recompone la ventana — resize (incluido el que dispara al armar la vista de
  // "apps recientes"), visibilitychange (al pasar a segundo plano) y
  // orientationchange — para que, si algo llegó a quedar desincronizado, se
  // corrija en el instante exacto del evento del sistema, no en el próximo
  // render de React. Usa appTkRef para no tener que reinstalar los listeners
  // en cada cambio de tema.
  const appTkBgRef = useRef(appTk.BG);
  appTkBgRef.current = appTk.BG;
  useEffect(() => {
    const repaint = () => setThemeColor(appTkBgRef.current);
    window.addEventListener("resize", repaint);
    document.addEventListener("visibilitychange", repaint);
    window.addEventListener("orientationchange", repaint);
    return () => {
      window.removeEventListener("resize", repaint);
      document.removeEventListener("visibilitychange", repaint);
      window.removeEventListener("orientationchange", repaint);
    };
  }, []);
  const changeTextScale = (s) => {
    setAppTextScale(s);
    try { localStorage.setItem("retador_txt_scale", String(s)); } catch {}
  };

  // Aplica el zoom de densidad a toda la plataforma y lo actualiza al cambiar de modo
  useEffect(() => {
    document.documentElement.style.zoom = String(densZoom);
    document.documentElement.style.setProperty("--img-s", String(densZoom));
    return () => {
      document.documentElement.style.zoom = "1";
      document.documentElement.style.removeProperty("--img-s");
    };
  }, [densZoom]);

  // Config local
  const [cfg, setCfg] = useState({ priceKm: 50, priceKg: 15, adminPass: "", espanaAereo: 15, espanaMaritimo: 10, usaAereo: 18, usaMaritimo: 12 });
  
  // (Los banners de la tienda ya no viven aquí: son bloques de adminCfg.blocks,
  //  editados en el Editor Visual y renderizados por MarketBanners.)

  const flash = (msg, dur = null) => {
    // El tiempo en pantalla crece con el largo del mensaje: un error de varias
    // líneas no se puede leer en los 3,2 s de un aviso corto.
    const txt = String(msg ?? "");
    const ms = dur != null ? dur : Math.min(14000, Math.max(3200, txt.length * 85));
    setToast(msg);
    clearTimeout(flashTmrRef.current);
    flashTmrRef.current = setTimeout(() => setToast(null), ms);
  };
  // 2) GUARDAR desde el panel (solo admin): aplica el cambio en caliente y persiste
  //    el objeto COMPLETO en el backend vía RPC (con debounce, no en cada tecla).
  //    El localStorage sigue siendo caché; el guardado REAL es la RPC.
  const handleCfgChange = useCallback((patch) => {
    const next = { ...latestCfgRef.current, ...patch };
    latestCfgRef.current = next;
    setAdminCfg(next);
    if (!isOwner) return; // solo el admin escribe; la RPC igual rechaza a los demás
    if (cfgSaveTimer.current) clearTimeout(cfgSaveTimer.current);
    cfgSaveTimer.current = setTimeout(async () => {
      try { await setPlatformConfig(latestCfgRef.current); setCfgUpdatedAt(new Date().toISOString()); flash("Guardado ✓"); }
      catch (e) { flash("⚠️ " + (e?.message || "No se pudo guardar la configuración")); }
    }, 800);
  }, [isOwner]);
  const saveCfg = nc => { setCfg(nc); };
  const requireAuth = action => { action(); return true; }; // Siempre autorizado - solo visual
  const refreshUser = () => {}; // No-op en versión visual

  // BUG REAL corregido (regresión): esto era un resto de una versión de
  // demostración — solo mostraba un aviso y nunca cerraba la sesión de
  // verdad. Por eso "Cerrar sesión" dejó de funcionar en la Configuración
  // consolidada: el botón llamaba a esto en vez de a signOutUser(). Ahora
  // cierra la sesión real de Supabase Auth; el listener de onAuthStateChange
  // (arriba, en el componente padre) detecta el cierre y vuelve solo a la
  // pantalla de bienvenida.
  const handleSignOut = async () => {
    try { await signOutUser(); }
    catch (e) { flash("⚠️ No se pudo cerrar sesión — intenta de nuevo"); }
  };

  const handlePublish = async d => {
    if (suspended) { flash("⛔ Tu cuenta está suspendida"); return; }
    if (!user?.id) { flash("⚠️ Debes iniciar sesión para publicar"); return; }
    const isService = d.kind === "service";
    if (!isService && !(Number(d.stock) > 0)) { flash("⚠️ Indica la cantidad disponible (mínimo 1)"); return; }
    const row = {
      seller_id: user.id,
      kind: isService ? "service" : "product",   // FASE 3: separa origen (obligatorio)
      title: d.title,
      description: d.desc || null,
      price: Number(d.price) || 0,
      orig_price: (!isService && (d.orig_price ?? d.orig)) ? Number(d.orig_price ?? d.orig) : null,
      currency: d.currency || "USD",
      // products.cat tiene FK a categories(id) (categorías de PRODUCTO, ids fijos
      // como "hogar"). Las categorías de SERVICIO (config.serviceCats) son texto
      // libre y NO existen en esa tabla — guardarlas en `cat` rompe el insert por
      // violación de llave foránea. Para servicios van en `subcat` (texto libre,
      // sin restricción) y `cat` queda null.
      cat: isService ? null : (d.cat || null),
      subcat: isService ? (d.cat || null) : (d.subcat || null),
      images: Array.isArray(d.images) ? d.images : [],
      badge: isService ? null : (d.badge || null),
      // Un servicio no tiene formas de entrega/envío, stock, ni métodos de pago.
      ship_modes: isService ? null : (d.shipModes || { local: true, intl: false, persona: false }),
      ship_price: isService ? 0 : (Number(d.shippingPrice) || 0),
      location: d.location || null,   // zona (donde ofrece el servicio / ubicación del producto)
      province: d.province || null,   // provincia estructurada (Cuba) — prioriza en la Tienda
      pickup_address: isService ? null : (d.pickupAddress || null),
      pickup_phone: isService ? null : (d.pickupPhone || null),
      // GRUPO 1 — cantidad disponible, descuentos por cantidad y monedas que el
      // vendedor acepta cobrar (solo productos; NO es método de pago). stock/
      // accepted_currencies son escritura resiliente: si el backend aún no
      // tiene esas columnas, se reintenta sin ellas.
      ...(isService ? {} : {
        stock: Number(d.stock) || 0,
        bulk_discounts: Array.isArray(d.bulkDiscounts) ? d.bulkDiscounts : [],
        accepted_currencies: Array.isArray(d.acceptedCurrencies) ? d.acceptedCurrencies : [],
      }),
    };
    let data, missing;
    try {
      const res = await writeProductRow((r) => supabase.from("products").insert(r).select().single(), row);
      data = res.data; missing = res.missing;
    } catch (error) {
      // Índice único anti-duplicados: mismo vendedor + mismo título activo.
      if (error.code === "23505" || /duplicate|unique|ya existe/i.test(error.message || "")) {
        flash("⚠️ Ya tienes una publicación activa con este nombre. Edítala o usa otro título.");
      } else { flash("⚠️ " + (error.message || "No se pudo publicar")); }
      return;
    }
    if (isService) { setServices(prev => [mapProduct(data), ...prev]); flash("✅ Servicio publicado — visible en la sección Servicios"); }
    else { setProducts(prev => [mapProduct(data), ...prev]); flash(missing?.length ? `✅ Publicado, pero el backend aún no guarda: ${missing.join(", ")}` : "✅ Producto publicado — visible para todos"); }
    reloadOwn();
    // ⭐ Marcó "Destacar" al publicar (ya confirmó la tarifa en el formulario).
    if (d.promote && adminCfg.promoActive === true) promoteFlow(data.id, { skipConfirm: true });
  };

  // Borrado REAL — delete_product_hard: fotos de Storage + fila para siempre.
  // Antes esto solo ponía status='deleted' (nunca desaparecía de verdad), de ahí
  // las tarjetas fantasma en el chat con fotos de productos que el dueño creía
  // borrados. Ya no queda ningún rastro después de esto.
  const handleDelete = async id => {
    try { await deleteProductHard(id); }
    catch (e) { flash("⚠️ " + (e?.message || "No se pudo eliminar")); return; }
    setProducts(prev => prev.filter(p => p.id !== id));
    setServices(prev => prev.filter(p => p.id !== id));
    setOwnArchived(prev => prev.filter(p => p.id !== id));
    reloadOwn();
    flash("🗑️ Eliminado para siempre");
  };
  // Archivar: esconde el producto (no cuenta para el límite del plan) y guarda
  // 30 días fijos (archive_product ya no depende de ninguna preferencia) —
  // recuperable mientras haya cupo.
  const handleArchive = async (id) => {
    let vence = null;
    try { vence = await archiveProduct(id); }
    catch (e) { flash("⚠️ " + (e?.message || "No se pudo archivar")); return; }
    setProducts(prev => prev.filter(p => p.id !== id));
    setServices(prev => prev.filter(p => p.id !== id));
    reloadOwn();
    const d = vence ? new Date(vence).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }) : null;
    flash(`🗄️ Archivado${d ? " · vence el " + d : ""} — puedes recuperarlo cuando quieras si tienes cupo en tu plan`);
  };
  // Recuperar: si no hay cupo en el plan actual, el backend rechaza con SU
  // mensaje real (ej. "Ya tienes 10 de 10 productos activos...") — se muestra tal cual.
  const handleUnarchive = async (id) => {
    try { await unarchiveProduct(id); }
    catch (e) { flash("⚠️ " + (e?.message || "No se pudo recuperar")); return; }
    reloadOwn();
    flash("♻️ Recuperado — ya está de vuelta en tus productos");
  };
  // Textos de confirmación reales — la de Borrar es explícita a propósito
  // (fotos y reseñas se pierden para siempre); la de Archivar no da miedo,
  // solo informa dónde queda y por cuánto tiempo.
  const confirmDeleteProduct = (id) => askConfirm("Se elimina para siempre. Perderás las fotos y las reseñas de este producto. Esta acción no se puede deshacer.", () => handleDelete(id));
  const confirmArchiveProduct = (id) => askConfirm("Se guarda oculto por 30 días. Puedes recuperarlo cuando quieras si tienes cupo en tu plan.", () => handleArchive(id), { label: "Archivar", color: "#2563EB" });

  // Abre el chat CONECTADO (realtime) con la otra persona. La identidad SIEMPRE es
  // el uuid real del usuario: así "mensaje" con la misma persona abre SIEMPRE la
  // misma conversación (nunca duplica ni cae a "Vendedor"). El nombre/foto se
  // derivan del id dentro del chat.
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  // context opcional {type:'product'|'order', id, title, image}: el chat muestra
  // la franja "estás consultando sobre esto" y el primer mensaje lleva la referencia.
  const openChat = (otherId, otherName, context = null, draft = null) => {
    const id = typeof otherId === "string" && UUID_RE.test(otherId) ? otherId : null;
    if (!id) { flash("No se pudo abrir el chat: usuario no identificado"); return; }
    setSelChat({ otherId: id, otherName, context, draft });
    setChatOpen(true);
  };
  // Abrir el DETALLE de un pedido/producto desde una tarjeta del chat.
  const openOrderFromChat = (orderId) => {
    if (!orderId) return;
    setChatOpen(false); setSelOrderId(orderId); setTab("perfil"); setPScr("order-detail");
  };
  // Abrir el DETALLE de un pedido desde un aviso PUSH tocado (kind === "order").
  const openOrderById = (orderId) => {
    if (!orderId) return;
    setShowNotif(false); setChatOpen(false); setSelOrderId(orderId); setTab("perfil"); setPScr("order-detail");
  };
  const openProductFromChat = (productId) => {
    if (!productId) return;
    // prodBackTo="chat": la flechita propia del producto ("‹", distinta del botón
    // físico atrás — ese ya funciona bien con su propio historial) no sabía que
    // este producto se abrió desde un chat y caía siempre al inicio.
    const go = (p) => { setChatOpen(false); setSelProd(p); setProdBackTo("chat"); setTab("market"); setMScr("product"); };
    const local = products.find(x => x.id === productId);
    if (local) go(local);
    else getProductById(productId).then(p => { if (p) go(p); else flash("Ese producto ya no está disponible"); }).catch(() => {});
  };
  // "Iniciar pedido" desde el panel fijo de producto en el chat: mismo flujo de
  // compra real de siempre (handleBuy → modal de pedido), nada nuevo inventado.
  const startOrderFromChat = (productId) => {
    if (!productId) return;
    const go = (p) => { if (!p) { flash("Ese producto ya no está disponible"); return; } setChatOpen(false); handleBuy(p); };
    const local = products.find(x => x.id === productId);
    if (local) go(local);
    else getProductById(productId).then(go).catch(() => flash("Ese producto ya no está disponible"));
  };
  const openMessages = () => { setSelChat(null); setChatOpen(false); setTab("perfil"); setPScr("messages"); };
  // Abre el chat DIRECTO por conversation_id (notificación kind='message', o el aviso
  // push tocado fuera de la app): resuelve quién es la otra persona y abre su chat.
  const openConversationById = async (convId, focusLatest = false) => {
    if (!convId || !user?.id) return;
    try {
      const c = await getConversationById(convId, user.id);
      if (!c) { flash("Esa conversación ya no está disponible"); return; }
      // focusLatest: se abrió desde un aviso de mensaje — no hay id de mensaje
      // exacto en la notificación (solo el de la conversación), así que ChatScreen
      // salta y resalta el ÚLTIMO mensaje, que en la práctica es el que avisó.
      setSelChat({ id: c.id, otherId: c.otherId, otherName: c.otherName, otherAvatar: c.otherAvatar, focusLatest });
      setChatOpen(true);
    } catch (e) { flash("No se pudo abrir la conversación"); }
  };
  // Aviso PUSH de un mensaje tocado FUERA de la app: si abrió una ventana nueva, el
  // service worker deja "?openConv=<id>" en la URL (ver sw.js); la leemos una vez y
  // limpiamos la URL para que no se repita al recargar.
  // "?openProduct=<id>" / "?openProfile=<id>": mismo mecanismo, para los enlaces que
  // arma la Edge Function share-preview (compartir producto/perfil) — ES LA app real
  // NO usa HashRouter (no hay rutas tipo /#/producto/:id en ningún lado), así que el
  // deep link tiene que ser un query param leído aquí, igual que openConv/openOrder.
  useEffect(() => {
    if (!user?.id) return;
    let convId = null, orderId = null, productId = null, profileId = null;
    try {
      const q = new URLSearchParams(window.location.search);
      convId = q.get("openConv"); orderId = q.get("openOrder");
      productId = q.get("openProduct"); profileId = q.get("openProfile");
    } catch (e) {}
    if (!convId && !orderId && !productId && !profileId) return;
    try { window.history.replaceState({}, "", window.location.pathname); } catch (e) {}
    if (convId) openConversationById(convId, true);
    else if (orderId) openOrderById(orderId);
    else if (productId) openProductFromChat(productId);
    else if (profileId) openPublicProfile(profileId);
  }, [user?.id]);
  // Aviso PUSH tocado con la app YA abierta: el service worker enfoca esta ventana y
  // le manda un postMessage (sin recargar la SPA) con el destino a abrir.
  useEffect(() => {
    if (!user?.id || !("serviceWorker" in navigator)) return;
    const onMsg = (event) => {
      const msg = event.data || {};
      if (msg.type !== "retador-notification-click" || !msg.data?.ref_id) return;
      if (msg.data.kind === "message") openConversationById(msg.data.ref_id, true);
      else if (msg.data.kind === "order") openOrderById(msg.data.ref_id);
    };
    navigator.serviceWorker.addEventListener("message", onMsg);
    return () => navigator.serviceWorker.removeEventListener("message", onMsg);
  }, [user?.id]);

  // Chat libre: cualquiera puede escribir desde cualquier lugar. Capturamos la información igual.
  const [orders, setOrders] = useState(() => { try { return JSON.parse(localStorage.getItem('retador_orders') || '[]'); } catch { return []; } });
  useEffect(() => { try { localStorage.setItem('retador_orders', JSON.stringify(orders)); } catch {} }, [orders]);
  const [verifications, setVerifications] = useState(() => { try { return JSON.parse(localStorage.getItem('retador_verifs') || '[]'); } catch { return []; } });
  useEffect(() => { try { localStorage.setItem('retador_verifs', JSON.stringify(verifications)); } catch {} }, [verifications]);
  const addVerification = (v) => setVerifications(prev => [{ id: 'ver_' + Date.now(), state: 'pending', at: Date.now(), ...v }, ...prev.filter(x => x.userName !== v.userName || x.state !== 'pending')]);
  const [payments, setPayments] = useState(() => { try { return JSON.parse(localStorage.getItem('retador_payments') || '[]'); } catch { return []; } });
  useEffect(() => { try { localStorage.setItem('retador_payments', JSON.stringify(payments)); } catch {} }, [payments]);
  const [verifiedUsers, setVerifiedUsers] = useState(() => { try { return JSON.parse(localStorage.getItem('retador_verified') || '[]'); } catch { return []; } });
  // Señales de "abrir directo" para Perfil, disparadas desde Configuración —
  // así "Solicitar verificación" y "Editar nombre/foto" no duplican esos
  // flujos: enlazan al único lugar real donde ya existen (Perfil).
  const [autoOpenVerify, setAutoOpenVerify] = useState(false);
  const [autoOpenEdit, setAutoOpenEdit] = useState(false);
  // "?openProPromo=1": enlace real de la página de vista previa "hazte Pro
  // gratis" (public/share/hazte-pro.html) — mismo mecanismo de query param
  // que openConv/openProduct/openProfile, ver el efecto de abajo.
  const [autoOpenPlans, setAutoOpenPlans] = useState(false);
  useEffect(() => {
    if (!user?.id) return;
    let wantsPlans = false;
    try { wantsPlans = new URLSearchParams(window.location.search).get("openProPromo") === "1"; } catch (e) {}
    if (!wantsPlans) return;
    try { window.history.replaceState({}, "", window.location.pathname); } catch (e) {}
    setTab("perfil"); setPScr("profile-full"); setAutoOpenPlans(true);
  }, [user?.id]);
  // Equipo y permisos: miembros con secciones delegadas
  const [teamMembers, setTeamMembers] = useState(() => { try { return JSON.parse(localStorage.getItem('retador_team') || '[]'); } catch { return []; } });
  useEffect(() => { try { localStorage.setItem('retador_team', JSON.stringify(teamMembers)); } catch {} }, [teamMembers]);
  useEffect(() => { try { localStorage.setItem('retador_verified', JSON.stringify(verifiedUsers)); } catch {} }, [verifiedUsers]);
  const [userPlans, setUserPlans] = useState(() => { try { return JSON.parse(localStorage.getItem('retador_userplans') || '{}'); } catch { return {}; } });
  useEffect(() => { try { localStorage.setItem('retador_userplans', JSON.stringify(userPlans)); } catch {} }, [userPlans]);
  // Planes REALES (tabla plans, RLS pública) — única fuente para nombre, precio,
  // límite de productos y comisión en toda la pantalla de perfil/planes. Se
  // cargan una sola vez; el plan vigente de cada quien vive en profiles.plan
  // (ya sincronizado en user.plan por refreshSessionProfile).
  const [realPlans, setRealPlans] = useState([]);
  useEffect(() => { getPlans().then(setRealPlans).catch(() => {}); }, []);
  const myRealPlan = realPlans.find(p => p.id === user?.plan) || realPlans.find(p => p.id === "gratis") || null;
  const currentPlanName = myRealPlan?.name || "Gratis";
  // ── TIENDA PRO (integración definitiva) ──────────────────────────────────
  // Gate real: plans.can_customize (columna real ya existente, la misma que
  // separa "Free" de "Pro/Premium" en la tabla de planes) — no un id de plan
  // a mano, así cualquier plan pagado que el admin marque can_customize=true
  // obtiene la tienda, sin tener que tocar código si el admin agrega otro.
  const isProStore = !!myRealPlan?.can_customize;
  const [storeCfg, setStoreCfg] = useState(null);
  const [storeMode, setStoreMode] = useState("store");
  const [myStoreStats, setMyStoreStats] = useState({ ventas: 0, compras: 0, envios: 0, seguidores: 0 });
  const [myStoreRating, setMyStoreRating] = useState(null);
  const [myStoreReviews, setMyStoreReviews] = useState([]);
  useEffect(() => {
    if (!isProStore || !user?.id) return;
    let alive = true;
    getStoreConfig(user.id).then(c => { if (alive) setStoreCfg(c || {}); }).catch(() => { if (alive) setStoreCfg({}); });
    getProfileHeaderStats(user.id).then(s => { if (alive) setMyStoreStats(s); }).catch(() => {});
    getSellerRatingInfo(user.id).then(r => { if (alive) setMyStoreRating(r); }).catch(() => {});
    getSellerReviews(user.id).then(r => { if (alive) setMyStoreReviews(r || []); }).catch(() => {});
    return () => { alive = false; };
  }, [isProStore, user?.id]);
  const myStoreProducts = useMemo(() => [...ownListings, ...ownArchived].filter(p => p.kind !== "service"), [ownListings, ownArchived]);
  const myStoreOrders = useMemo(() => orders.filter(o => o.sellerId === user?.id), [orders, user?.id]);
  const storeApi = {
    onNewProduct: () => setPubOpen("product"),
    onEditProduct: (p) => setEditProd(p),
    onArchiveProduct: (id) => confirmArchiveProduct(id),
    onUnarchiveProduct: (id) => handleUnarchive(id),
    onDeleteProduct: (id) => confirmDeleteProduct(id),
    onUpdateProduct: (id, changes) => updateProduct(id, changes),
    onToggleFeatured: (p) => updateProduct(p.id, { storeFeatured: !p.storeFeatured }),
    onUpdateConfig: async (draft) => { const saved = await upsertMyStoreConfig(draft); setStoreCfg(saved); },
    onPlanRequested: () => reloadOwn(),
  };
  // Perfiles de OTROS vendedores: si su plan real tiene can_customize, se les
  // muestra su Tienda en vez del perfil simple — mismo gate que para mí mismo.
  // null = todavía no se sabe quién es este vendedor (cargando) — NUNCA se usa
  // "false" como valor por defecto, porque eso renderizaría el perfil Free como
  // si ya fuera un dato confirmado. Ver limpieza síncrona dentro del efecto.
  const [viewedStoreEligible, setViewedStoreEligible] = useState(null);
  const [viewedStoreCfg, setViewedStoreCfg] = useState(null);
  const [viewedStoreStats, setViewedStoreStats] = useState({ ventas: 0, compras: 0, envios: 0, seguidores: 0 });
  const [viewedStoreRating, setViewedStoreRating] = useState(null);
  const [viewedStoreReviews, setViewedStoreReviews] = useState([]);
  const [viewedStoreProducts, setViewedStoreProducts] = useState([]);
  const [viewedStoreName, setViewedStoreName] = useState("");
  const [viewedStoreVerified, setViewedStoreVerified] = useState(false);
  useEffect(() => {
    // Limpieza SÍNCRONA antes de pedir cualquier dato nuevo: mientras no se
    // confirme quién es este vendedor, no debe quedar visible ni un rastro del
    // vendedor anterior (nombre, insignia, tienda) — así se evita el "Perfil B
    // muestra por un instante los datos del Perfil A" reportado.
    setViewedStoreEligible(null);
    setViewedStoreCfg(null);
    setViewedStoreName("");
    setViewedStoreVerified(false);
    setViewedStoreProducts([]);
    setViewedStoreReviews([]);
    setViewedStoreRating(null);
    setViewedStoreStats({ ventas: 0, compras: 0, envios: 0, seguidores: 0 });
    if (!viewProfileId) { setViewedStoreEligible(false); return; }
    let alive = true;
    // getSellerPlan (SIN caché) decide el plan real EN ESTE INSTANTE — activar
    // o bajar el plan de otra cuenta debe reflejarse ya mismo, nunca depender
    // del caché de sesión de getUserById (root cause real de "activé Pro y
    // sigue viéndose Free desde otra cuenta").
    Promise.all([getUserById(viewProfileId), getSellerPlan(viewProfileId)]).then(async ([u, planId]) => {
      if (!alive) return;
      const plan = realPlans.find(p => p.id === planId);
      const eligible = !!plan?.can_customize;
      // getUserById devuelve { name, ... } (no "full_name") — antes esto
      // siempre quedaba vacío y la Tienda de otro vendedor caía siempre al
      // "Vendedor" genérico de respaldo en vez de su nombre real.
      setViewedStoreName(u?.name || "");
      setViewedStoreVerified(!!u?.verified);
      if (!eligible) { setViewedStoreEligible(false); return; }
      const [c, s, r, prods, revs] = await Promise.all([
        getStoreConfig(viewProfileId), getProfileHeaderStats(viewProfileId), getSellerRatingInfo(viewProfileId), getProductsBySeller(viewProfileId), getSellerReviews(viewProfileId),
      ]);
      if (!alive) return;
      setViewedStoreCfg(c || {}); setViewedStoreStats(s); setViewedStoreRating(r); setViewedStoreProducts((prods || []).filter(p => p.kind !== "service")); setViewedStoreReviews(revs || []);
      // Recién AHORA hay datos reales completos de la Tienda — antes de esto
      // "eligible" se queda en null (neutro), nunca en true con datos a medias.
      setViewedStoreEligible(true);
    }).catch(() => { if (alive) setViewedStoreEligible(false); });
    return () => { alive = false; };
  }, [viewProfileId, realPlans]);
  // Tras dejar/editar/borrar MI reseña sobre este vendedor, recarga la lista
  // y el promedio reales (el mismo dato que ya vieron todos al entrar).
  const reloadViewedReviews = useCallback(() => {
    if (!viewProfileId) return;
    Promise.all([getSellerRatingInfo(viewProfileId), getSellerReviews(viewProfileId)]).then(([r, revs]) => {
      setViewedStoreRating(r); setViewedStoreReviews(revs || []);
    }).catch(() => {});
  }, [viewProfileId]);
  // Mismo gate, para la OTRA vía real de "ver perfil de vendedor" (desde el
  // detalle de un producto en la Tienda/mercado, tab="market" → mScr=
  // "sellerProfile") — antes solo la vía de viewProfileId mostraba la Tienda
  // Pro; esta se había quedado mostrando siempre el perfil Free plano, sin
  // insignias de confianza ni el resto de la cabecera de Tienda.
  // null = todavía no se sabe (cargando), mismo criterio que viewedStoreEligible.
  const [sellerStoreEligible, setSellerStoreEligible] = useState(null);
  const [sellerStoreCfg, setSellerStoreCfg] = useState(null);
  const [sellerStoreStats, setSellerStoreStats] = useState({ ventas: 0, compras: 0, envios: 0, seguidores: 0 });
  const [sellerStoreRating, setSellerStoreRating] = useState(null);
  const [sellerStoreReviews, setSellerStoreReviews] = useState([]);
  const [sellerStoreProducts, setSellerStoreProducts] = useState([]);
  const [sellerStoreName, setSellerStoreName] = useState("");
  const [sellerStoreVerified, setSellerStoreVerified] = useState(false);
  useEffect(() => {
    // Misma limpieza síncrona que en el efecto de viewProfileId — evita que al
    // pasar de un vendedor a otro por esta vía (desde el detalle de un producto)
    // se vea un instante los datos del vendedor anterior.
    setSellerStoreEligible(null);
    setSellerStoreCfg(null);
    setSellerStoreName("");
    setSellerStoreVerified(false);
    setSellerStoreProducts([]);
    setSellerStoreReviews([]);
    setSellerStoreRating(null);
    setSellerStoreStats({ ventas: 0, compras: 0, envios: 0, seguidores: 0 });
    if (!selSeller) { setSellerStoreEligible(false); return; }
    let alive = true;
    Promise.all([getUserById(selSeller), getSellerPlan(selSeller)]).then(async ([u, planId]) => {
      if (!alive) return;
      const plan = realPlans.find(p => p.id === planId);
      const eligible = !!plan?.can_customize;
      setSellerStoreName(u?.name || "");
      setSellerStoreVerified(!!u?.verified);
      if (!eligible) { setSellerStoreEligible(false); return; }
      const [c, s, r, prods, revs] = await Promise.all([
        getStoreConfig(selSeller), getProfileHeaderStats(selSeller), getSellerRatingInfo(selSeller), getProductsBySeller(selSeller), getSellerReviews(selSeller),
      ]);
      if (!alive) return;
      setSellerStoreCfg(c || {}); setSellerStoreStats(s); setSellerStoreRating(r); setSellerStoreProducts((prods || []).filter(p => p.kind !== "service")); setSellerStoreReviews(revs || []);
      setSellerStoreEligible(true);
    }).catch(() => { if (alive) setSellerStoreEligible(false); });
    return () => { alive = false; };
  }, [selSeller, realPlans]);
  const reloadSellerReviews = useCallback(() => {
    if (!selSeller) return;
    Promise.all([getSellerRatingInfo(selSeller), getSellerReviews(selSeller)]).then(([r, revs]) => {
      setSellerStoreRating(r); setSellerStoreReviews(revs || []);
    }).catch(() => {});
  }, [selSeller]);
  const [reports, setReports] = useState(() => { try { return JSON.parse(localStorage.getItem('retador_reports') || '[]'); } catch { return []; } });
  useEffect(() => { try { localStorage.setItem('retador_reports', JSON.stringify(reports)); } catch {} }, [reports]);
  const addReport = (rep) => setReports(prev => [{ id: 'rep_' + Date.now(), state: 'pending', at: Date.now(), ...rep }, ...prev]);
  const [planRequests, setPlanRequests] = useState(() => { try { return JSON.parse(localStorage.getItem('retador_planreq') || '[]'); } catch { return []; } });
  useEffect(() => { try { localStorage.setItem('retador_planreq', JSON.stringify(planRequests)); } catch {} }, [planRequests]);
  const addPlanRequest = (req) => setPlanRequests(prev => [{ id: 'plq_' + Date.now(), state: 'pending', at: Date.now(), ...req }, ...prev]);
  const [selOrderId, setSelOrderId] = useState(null);

  // ── Botón ATRÁS del teléfono: retrocede UN paso dentro de la app en vez de
  // cerrarla, siguiendo el CAMINO REAL que hizo el usuario (no reglas fijas).
  //   1) Overlay anidado registrado (visor de fotos, detalle de subasta…) → cerrar.
  //   2) Modal de App abierto → cerrarlo (del más reciente al más viejo).
  //   3) Si no, deshace la ÚLTIMA navegación de pantalla/pestaña con un HISTORIAL real.
  //   4) En el inicio de Tienda, sin nada que deshacer → salir de la app.
  // (Va DESPUÉS de declarar todos los estados de navegación que lee, incl. selOrderId.)
  // Estado de navegación actual (pantallas + modales) y su "firma" para comparar.
  const navSnap = { tab, mScr, pScr, eScr, selProd, selSeller, selOrderId, prodBackTo,
    plusMenu, showCourier, toolApp, showTools, showAdmin, showWallet, showFollowing, chatOpen, showNotif, showCats, pubOpen, buyModal, confirmCfg, editProd };
  const navSig = [tab, mScr, pScr, eScr, (selProd && selProd.id) || selProd || 0, selSeller || 0, selOrderId || 0, prodBackTo || 0,
    !!plusMenu, !!showCourier, !!toolApp, !!showTools, !!showAdmin, !!showWallet, !!showFollowing, !!chatOpen, !!showNotif, !!showCats, !!pubOpen, !!buyModal, !!confirmCfg, !!editProd].join("|");

  const stackRef = useRef([]);      // [{sig, snap}] una entrada por cada paso hacia adelante
  const lastRef = useRef(null);     // {sig, snap} del estado actual
  const ignorePopRef = useRef(0);   // popstate que debemos ignorar (los que provocamos nosotros)
  const restoringRef = useRef(false);

  const applySnap = (sn) => {
    setTab(sn.tab); setMScr(sn.mScr); setPScr(sn.pScr); setEScr(sn.eScr);
    setSelProd(sn.selProd); setSelSeller(sn.selSeller); setSelOrderId(sn.selOrderId); setProdBackTo(sn.prodBackTo);
    setPlusMenu(sn.plusMenu); setShowCourier(sn.showCourier); setToolApp(sn.toolApp); setShowTools(sn.showTools);
    setShowAdmin(sn.showAdmin); setShowWallet(sn.showWallet); setShowFollowing(sn.showFollowing); setChatOpen(sn.chatOpen); setShowNotif(sn.showNotif);
    setShowCats(sn.showCats); setPubOpen(sn.pubOpen); setBuyModal(sn.buyModal); setConfirmCfg(sn.confirmCfg); setEditProd(sn.editProd);
  };

  // Detecta la navegación del USUARIO y mantiene el historial del navegador con la
  // MISMA profundidad que la app: una entrada real por cada paso hacia adelante.
  // Así el atrás del sistema retrocede paso a paso con entradas reales (no hay que
  // "re-armar" nada, no se escapa por rápido que se pulse) y en el inicio de Tienda
  // el usuario ya está en la primera entrada → un solo atrás cierra la app.
  useEffect(() => {
    const cur = { sig: navSig, snap: navSnap };
    if (lastRef.current === null) { lastRef.current = cur; return; }  // primer render
    if (navSig === lastRef.current.sig) return;                       // sin cambio
    if (restoringRef.current) { restoringRef.current = false; lastRef.current = cur; return; } // cambio por atrás del sistema
    const stack = stackRef.current;
    if (stack.length && stack[stack.length - 1].sig === navSig) {
      // el usuario volvió a un estado anterior con un botón DENTRO de la app
      // (cerrar modal, botón atrás propio) → quitamos la entrada del navegador.
      stack.pop();
      ignorePopRef.current++;
      try { window.history.back(); } catch (e) { ignorePopRef.current = Math.max(0, ignorePopRef.current - 1); }
    } else {
      // navegación hacia adelante → nueva entrada de historial.
      stack.push(lastRef.current);
      try { window.history.pushState({ rt: stack.length }, ""); } catch (e) {}
    }
    lastRef.current = cur;
  }, [navSig]);

  // Botón ATRÁS del sistema (teléfono/navegador).
  useEffect(() => {
    if (typeof window === "undefined" || !window.history) return;
    const onPop = () => {
      if (ignorePopRef.current > 0) { ignorePopRef.current--; return; } // fue un history.back() nuestro (sync)
      if (shouldIgnorePop()) return;           // 0) retiro de la entrada de una capa cerrada en pantalla
      if (consumeBack()) return;               // 1) capa abierta (visor, perfil, subasta): este pop consumió
                                               //    SU PROPIA entrada de historial → solo hay que cerrarla.
      if (stackRef.current.length) {           // 2) deshacer el último paso (pantalla o modal)
        restoringRef.current = true;
        applySnap(stackRef.current.pop().snap);
      }
      // 3) pila vacía = inicio de Tienda: el navegador ya salió de la app (no llega aquí).
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const addOrder = (order) => {
    if (!order) return null;
    const flow = ORDER_FLOW[order.shipMode] || ORDER_FLOW.local;
    const enriched = {
      ...order,
      shipType: order.shipMode || "local",
      flow,
      stepIdx: 0,
      status: flow[0].key,
      commissionPct: (adminCfg.commissionActive === false ? 0 : (order.cat === "servicios" ? (adminCfg.commServicePct ?? 12) : (adminCfg.commissionPct ?? 10))), // productos vs servicios, configurable y activable desde el panel
      history: [{ key: flow[0].key, label: flow[0].label, at: order.createdAt || Date.now(), note: "Pedido creado correctamente." }],
    };
    setOrders(prev => [enriched, ...prev]);
    return enriched;
  };
  const hasOrderWith = (sellerKey) => !!sellerKey && orders.some(o => o.sellerId === sellerKey || o.sellerName === sellerKey);
  // Avisos/notificaciones (persistentes)
  const [notifs, setNotifs] = useState(() => { try { return JSON.parse(localStorage.getItem("retador_notifs") || "[]"); } catch { return []; } });
  useEffect(() => { try { localStorage.setItem("retador_notifs", JSON.stringify(notifs)); } catch {} }, [notifs]);
  const pushNotif = (to, text, orderId) => setNotifs(prev => [{ id: "n" + Date.now() + Math.random().toString(36).slice(2, 6), to, text, orderId, at: Date.now(), read: false }, ...prev].slice(0, 120));
  useEffect(() => { try { localStorage.setItem("retador_notifs", JSON.stringify(notifs)); } catch (e) {} }, [notifs]);
  const myIds = [user?.id, user?.name, profileData?.name].filter(Boolean);
  const myLocalNotifs = notifs.filter(n => n.to != null && myIds.includes(n.to));
  // ── NOTIFICACIONES REALES del backend (tabla notifications) ────────────────
  // Se cargan al abrir y llegan EN VIVO por el canal realtime global. Se mezclan
  // con las locales en el mismo panel de la campanita.
  const [bkNotifs, setBkNotifs] = useState([]);
  const reloadBkNotifs = useCallback(() => {
    if (!user?.id) { setBkNotifs([]); return; }
    getNotifications(user.id).then(setBkNotifs).catch(() => {});
  }, [user?.id]);
  useEffect(() => { reloadBkNotifs(); }, [reloadBkNotifs]);
  // Notificaciones de "nueva solicitud" al staff (verification_app/plan_app/
  // courier_app): tocarlas lleva directo a su cola real en el panel, igual que
  // los mensajes llevan directo al chat.
  const QUEUE_PAGE_BY_KIND = { verification_app: "verif", plan_app: "plans", courier_app: "delivery" };
  // Los avisos de MENSAJE nunca entran a la campanita: ya suman al contador del
  // botón "Mensajes" (chatUnread, independiente) — contarlos aquí también los
  // duplicaría.
  const myNotifs = [
    ...bkNotifs.filter(n => n.kind !== "message").map(n => ({ id: "bk" + n.id, text: n.text, orderId: n.kind === "order" ? n.ref_id : null, queuePage: QUEUE_PAGE_BY_KIND[n.kind] || null, read: !!n.read, at: n.created_at ? new Date(n.created_at).getTime() : Date.now(), _bk: n.id })),
    ...myLocalNotifs,
  ].sort((a, b) => (b.at || 0) - (a.at || 0));
  const unreadNotif = myNotifs.filter(n => !n.read).length;
  // Barra inferior OCULTA en pantallas de "detalle" (a las que se ENTRA y se sale
  // con "atrás"): detalle de producto, perfil del vendedor, subastas, y todo el
  // tab de perfil salvo su raíz (mensajes, chat, pedidos, ajustes, perfil completo).
  // VISIBLE en las raíces de pestaña: feed de Tienda, Búsqueda, Envíos, Perfil-main.
  const hideNav = tab === "subastas"
    || (tab === "market" && (mScr === "product" || mScr === "sellerProfile"))
    || (tab === "perfil" && pScr !== "main");
  // Marca leídas las locales Y las del backend (read=true en la tabla).
  const markNotifRead = (id) => {
    setNotifs(prev => prev.map(n => id == null ? { ...n, read: true } : (n.id === id ? { ...n, read: true } : n)));
    if (id == null) {
      setBkNotifs(prev => prev.map(n => ({ ...n, read: true })));
      if (user?.id) markNotificationsRead(user.id).catch(() => {});
    } else if (String(id).startsWith("bk")) {
      const raw = myNotifs.find(n => n.id === id)?._bk;
      setBkNotifs(prev => prev.map(n => ("bk" + n.id) === id ? { ...n, read: true } : n));
      if (user?.id && raw != null) markNotificationsRead(user.id, raw).catch(() => {});
    }
  };

  // ── PEDIDOS REALES (Compras/Ventas) — el BACKEND es la ÚNICA fuente ─────────
  // loadOrders recarga desde Supabase y reemplaza el estado local, para que las
  // dos partes (comprador/vendedor/mensajero) vean SIEMPRE lo mismo, sin duplicar.
  const loadOrders = useCallback(async () => {
    if (!user?.id) return;
    try { const real = await getUserOrders(user.id); setOrders(real || []); } catch (e) {}
  }, [user?.id]);
  useEffect(() => { loadOrders(); }, [loadOrders]);
  useEffect(() => { if (pScr === "orders" || pScr === "order-detail") loadOrders(); }, [pScr, loadOrders]);

  // El mensajero avanza su etapa. El backend SOLO acepta "recogido" y "entregado"
  // ("recogido" auto-avanza a en_ruta; "entregado" cierra el pedido). RPC segura.
  // Identidad estable (useCallback) para que el botón "Entregué"/"Recogí" en
  // Courier.jsx, aislado con React.memo, no se re-renderice por cambios ajenos
  // (ej. el pool de entregas refrescándose en vivo) mientras el usuario lo toca.
  const courierStage = useCallback(async (orderId, stage) => {
    const p_stage = (stage === "recogido") ? "recogido" : "entregado";
    try {
      const { error } = await supabase.rpc("courier_advance_stage", { p_order_id: orderId, p_stage });
      if (error) {
        console.error("courier_advance_stage:", error.message);
        flash("⚠️ No se pudo avanzar: " + error.message);
        return;
      }
    } catch (e) {
      flash("⚠️ Error de red al avanzar: " + (e?.message || String(e)));
      return;
    }
    await loadOrders();
    flash(p_stage === "recogido" ? "✅ Producto recogido — en ruta" : "✅ Entregado — pedido cerrado");
  }, [loadOrders]);

  // ── CANAL REALTIME GLOBAL (UNO solo por usuario: rt-global-<uid>) ────────────
  // · messages → refresca el contador de mensajes sin leer (RPC oficial).
  // · orders   → recarga los pedidos EN VIVO: el vendedor ve llegar la venta al
  //   instante (badge de Ventas incluido) y el comprador ve avanzar su pedido
  //   (confirmado→asignado→recogido→en ruta→entregado) sin recargar.
  // Se limpia al cerrar sesión o cambiar de usuario (removeChannel).
  // Red de seguridad: recarga TODO lo vivo de una (pedidos, notifs, no leídos).
  const refreshAllLive = useCallback(() => {
    loadOrders(); reloadBkNotifs(); reloadChatUnread();
    if (user?.role === "admin") reloadCourierApps();
  }, [loadOrders, reloadBkNotifs, reloadChatUnread, user?.role, reloadCourierApps]);

  useEffect(() => {
    if (!user?.id) return;
    let chan = null, retry = 0, retryTimer = null, cancelled = false, notifTmr = null;
    // Campanita COMPARTIDA: cuando una cola se resuelve (verificación/plan/mensajero
    // aprobado, deuda cobrada), recargamos la lista de notificaciones para que los
    // avisos *_app ya atendidos por otro del staff dejen de figurar como pendientes.
    const bumpNotifs = () => { clearTimeout(notifTmr); notifTmr = setTimeout(() => reloadBkNotifs(), 800); };
    const connect = () => {
      if (cancelled) return;
      // Nombre ÚNICO por intento: supabase.channel() reutiliza el canal si el
      // nombre se repite (y al re-suscribir revienta). Un sufijo distinto por
      // intento garantiza un canal nuevo y limpio en cada reconexión.
      chan = supabase.channel(`rt-global-${user.id}-${Date.now()}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, (payload) => {
          reloadChatUnread();
          // "Entregado" (✓✓ gris) REAL: este canal está vivo con solo tener la
          // app conectada — sesión abierta, en cualquier pantalla — no hace
          // falta tener ESA conversación en pantalla. Antes mark_delivered solo
          // se llamaba desde el listener del chat abierto, así que si el
          // receptor no tenía esa conversación abierta en ese instante, la
          // palomita se quedaba en "enviado" y saltaba directo a "leído" recién
          // al abrir el chat — nunca pasaba por "entregado" de verdad.
          if (payload.eventType === "INSERT" && payload.new && payload.new.sender_id !== user.id) {
            markDelivered(payload.new.id).catch(() => {});
          }
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => loadOrders())
        // NOTIFICACIONES del backend EN VIVO: toast + campanita + reacciones por tipo.
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, (payload) => {
          const n = payload.new || {};
          // Mensaje de la conversación que YA está en pantalla: no hace falta sumarle
          // badge/toast extra (el usuario ya lo está viendo, el burbujeo del chat
          // basta). Se guarda ya leída, sin toast.
          const alreadyViewingThisChat = n.kind === "message" && chatOpenRef.current && n.ref_id && openConvIdRef.current === n.ref_id;
          if (alreadyViewingThisChat) {
            setBkNotifs(prev => prev.find(x => x.id === n.id) ? prev.map(x => x.id === n.id ? { ...x, read: true } : x) : [{ ...n, read: true }, ...prev]);
            markNotificationsRead(user.id, n.id).catch(() => {});
            return;
          }
          setBkNotifs(prev => prev.find(x => x.id === n.id) ? prev : [n, ...prev]);
          if (n.text) flash("🔔 " + n.text);
          if (n.kind === "courier") {
            refreshSessionProfile(user.id).then(p => { if (p) setUser(prev => prev ? { ...prev, role: p.role } : prev); }).catch(() => {});
          }
          // Suspensión/reactivación EN VIVO: al llegar una notificación de cuenta,
          // re-consultamos el backend y bloqueamos/liberamos sin reinstalar.
          if (n.kind === "account") {
            isSuspendedUser().then(s => setSuspended(!!s)).catch(() => {});
            refreshSessionProfile(user.id).then(p => { if (p) setUser(prev => prev ? { ...prev, verified: p.verified, suspended: p.suspended, role: p.role } : prev); }).catch(() => {});
            loadPerms(); // permisos del panel EN VIVO: aparece/cambia/desaparece sin reinstalar
          }
          // Verificación aprobada/rechazada o PLAN cambiado: refresca el perfil en vivo
          // (insignia verificada real, plan real) — igual que con 'courier'.
          if (n.kind === "plan" || n.kind === "verification") {
            refreshSessionProfile(user.id).then(p => { if (p) setUser(prev => prev ? { ...prev, verified: p.verified, plan: p.plan, role: p.role } : prev); }).catch(() => {});
          }
          if ((n.kind === "verification_app" || n.kind === "plan_app") && user.role === "admin") { /* la cola se refresca sola por realtime de sus tablas */ }
          if (n.kind === "courier_app" && user.role === "admin") reloadCourierApps();
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "courier_applications" }, () => {
          if (user.role === "admin") reloadCourierApps();
          bumpNotifs();
        })
        // Colas de la plataforma: cuando cambian (alguien resuelve), refresca la
        // campanita para TODO el staff → nadie persigue un aviso ya atendido.
        .on("postgres_changes", { event: "*", schema: "public", table: "verifications" }, bumpNotifs)
        .on("postgres_changes", { event: "*", schema: "public", table: "plan_requests" }, bumpNotifs)
        .on("postgres_changes", { event: "*", schema: "public", table: "seller_commission_ledger" }, bumpNotifs)
        // 3) CONFIG GLOBAL EN VIVO: si el admin cambia una tasa fx, la comisión o apaga
        //    un servicio, TODOS los teléfonos lo aplican al instante, sin recargar.
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "platform_config" }, (payload) => {
          const cfg = payload.new?.config;
          if (cfg && typeof cfg === "object") { cfgFromBackend.current = true; latestCfgRef.current = { ...latestCfgRef.current, ...cfg }; setAdminCfg(prev => ({ ...prev, ...cfg })); }
          if (payload.new?.updated_at) setCfgUpdatedAt(payload.new.updated_at);
        })
        // RESILIENCIA: si el canal se cae (red intermitente tipo Cuba), reintenta
        // suscribirse con backoff y, al reconectar, recarga todo por si perdimos algo.
        .subscribe((status) => {
          if (status === "SUBSCRIBED") { retry = 0; refreshAllLive(); return; }
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            if (cancelled || retry >= 8) return;   // tope: los listeners de foco/online son la otra red de seguridad
            const dead = chan; chan = null;
            try { Promise.resolve(supabase.removeChannel(dead)).catch(() => {}); } catch (e) {}
            const wait = Math.min(2000 * 2 ** retry, 30000); retry++;
            if (retryTimer) clearTimeout(retryTimer);
            retryTimer = setTimeout(connect, wait);
          }
        });
    };
    connect();
    return () => { cancelled = true; if (retryTimer) clearTimeout(retryTimer); if (notifTmr) clearTimeout(notifTmr); try { if (chan) Promise.resolve(supabase.removeChannel(chan)).catch(() => {}); } catch (e) {} };
  }, [user?.id, user?.role, reloadChatUnread, loadOrders, reloadCourierApps, refreshAllLive, reloadBkNotifs]);

  // Red de seguridad para redes intermitentes: al VOLVER a la app (foco/visible)
  // o al RECUPERAR internet, recarga todo lo vivo — nadie se queda atascado.
  useEffect(() => {
    if (!user?.id) return;
    const onWake = () => { if (document.visibilityState !== "hidden") refreshAllLive(); };
    window.addEventListener("focus", onWake);
    window.addEventListener("online", onWake);
    document.addEventListener("visibilitychange", onWake);
    return () => { window.removeEventListener("focus", onWake); window.removeEventListener("online", onWake); document.removeEventListener("visibilitychange", onWake); };
  }, [user?.id, refreshAllLive]);

  // Polling SUAVE: solo mientras hay un pedido activo abierto (detalle de pedido o
  // modo mensajero). Refuerzo para redes muy lentas, además del realtime.
  useEffect(() => {
    if (!user?.id) return;
    const activoAbierto = pScr === "order-detail" || showCourier;
    if (!activoAbierto) return;
    const iv = setInterval(() => { if (document.visibilityState !== "hidden") loadOrders(); }, 15000);
    return () => clearInterval(iv);
  }, [user?.id, pScr, showCourier, loadOrders]);

  const roleOf = (o) => (((o.buyerId ?? o.buyer_id) === user?.id) ? "compra" : "venta");
  const mergedOrders = orders;

  // Pedidos ya VISTOS, guardados POR ID y por usuario. Antes se guardaba una
  // marca de tiempo por pestaña, así que con solo entrar a "Mis pedidos" se daba
  // por visto TODO — el aviso desaparecía sin que el usuario llegara a ver de qué
  // pedido se trataba. Ahora un pedido solo cuenta como visto cuando se ABRE.
  const seenIdsKey = user?.id ? `retador_orders_seen_ids_${user.id}` : null;
  const [seenOrderIds, setSeenOrderIds] = useState({});
  const seededSeenRef = useRef(false);
  useEffect(() => {
    seededSeenRef.current = false;
    if (!seenIdsKey) { setSeenOrderIds({}); return; }
    try { setSeenOrderIds(JSON.parse(localStorage.getItem(seenIdsKey) || "{}")); } catch (e) { setSeenOrderIds({}); }
  }, [seenIdsKey]);
  // Primer arranque de este usuario: damos por vistos los pedidos que YA existían,
  // para no estrenar la función con un badge enorme de pedidos viejos. A partir de
  // ahí, cada pedido nuevo se avisa hasta que se abra.
  useEffect(() => {
    if (!seenIdsKey || seededSeenRef.current || !mergedOrders.length) return;
    seededSeenRef.current = true;
    if (localStorage.getItem(seenIdsKey) != null) return;   // ya hay historial: respetarlo
    const all = {};
    mergedOrders.forEach(o => { if (o?.id) all[o.id] = 1; });
    setSeenOrderIds(all);
    try { localStorage.setItem(seenIdsKey, JSON.stringify(all)); } catch (e) {}
  }, [seenIdsKey, mergedOrders]);
  const markOrderSeen = useCallback((orderId) => {
    if (!orderId || !seenIdsKey) return;
    setSeenOrderIds(prev => {
      if (prev[orderId]) return prev;
      const next = { ...prev, [orderId]: 1 };
      try { localStorage.setItem(seenIdsKey, JSON.stringify(next)); } catch (e) {}
      return next;
    });
  }, [seenIdsKey]);
  const ordersUnseen = mergedOrders.filter(o => o?.id && !seenOrderIds[o.id]).length;
  // Abrir el detalle de un pedido lo marca como visto, venga de donde venga (la
  // lista, un chat, un aviso push, o recién creado). Un solo sitio en vez de
  // recordarlo en cada punto de entrada.
  useEffect(() => {
    if (pScr === "order-detail" && selOrderId) markOrderSeen(selOrderId);
  }, [pScr, selOrderId, markOrderSeen]);

  // Notifica cada VENTA nueva una sola vez, usando el sistema de avisos local ya
  // existente (pushNotif). El PRIMER barrido solo toma nota de lo que ya había
  // (sin avisar): así al abrir la app no llega una ráfaga de ventas viejas.
  const notifiedSalesRef = useRef(new Set());
  const salesBaselineRef = useRef(false);
  useEffect(() => {
    if (!mergedOrders.length) return;
    if (!salesBaselineRef.current) {
      mergedOrders.forEach(o => { if (o?.id) notifiedSalesRef.current.add(o.id); });
      salesBaselineRef.current = true;
      return;
    }
    mergedOrders.forEach(o => {
      if (roleOf(o) !== "venta") return;
      if (notifiedSalesRef.current.has(o.id)) return;
      notifiedSalesRef.current.add(o.id);
      if (notifs.some(n => n.orderId === o.id && (n.text || "").includes("Nueva venta"))) return; // ya avisado antes
      pushNotif(user?.id, "🛒 ¡Nueva venta! " + (o.title || "Producto"), o.id);
    });
  }, [mergedOrders]);

  // Coreografía de 3 partes — sincronizada al backend con RPCs seguras.
  // NUNCA hacemos UPDATE directo del status: usamos advance_order / confirm_order,
  // que aplican el candado de seguridad del servidor. Así ambas partes ven lo mismo.
  const sellerConfirmOrder = async (orderId) => {
    const o = mergedOrders.find(x => x.id === orderId);
    const { error } = await supabase.rpc("advance_order", { p_order_id: orderId, p_new_status: "confirmado" });
    if (error) { console.error("advance_order:", error.message); flash("⚠️ No se pudo confirmar: " + error.message); return; }
    setOrders(prev => prev.map(x => { if (x.id !== orderId) return x; const idx = (x.flow || []).findIndex(s => s.key === "confirmado"); return { ...x, sellerConfirmed: true, stepIdx: idx >= 0 ? Math.max(x.stepIdx || 0, idx) : (x.stepIdx || 0), status: "confirmado", history: [...(x.history || []), { key: "confirmado", label: "Confirmado por el vendedor", at: Date.now() }] }; }));
    loadOrders();
    // Aviso y mensaje según el TIPO de envío (persona/intl no hablan de mensajero).
    const m = (o?.shipMode || o?.ship_mode || o?.shipType) || "local";
    const buyerMsg = m === "persona" ? "Tu pedido fue confirmado por el vendedor. Coordinen la entrega por el chat."
      : m === "intl" ? "Tu pedido fue confirmado. El envío internacional está en proceso."
      : "Tu pedido fue confirmado por el vendedor. Buscando mensajero.";
    if (o) pushNotif(o.buyer_id || o.buyerId || o.delivery?.name || o.buyerName, buyerMsg, orderId);
    flash(m === "persona" ? "✅ Pedido confirmado — coordinen por el chat" : m === "intl" ? "✅ Pedido confirmado" : "✅ Pedido confirmado — disponible para mensajeros");
  };
  const buyerConfirmReceipt = async (orderId) => {
    const o = mergedOrders.find(x => x.id === orderId);
    const { error } = await supabase.rpc("confirm_order", { p_order_id: orderId, p_who: "buyer" });
    if (error) { console.error("confirm_order buyer:", error.message); flash("⚠️ No se pudo confirmar: " + error.message); return; }
    setOrders(prev => prev.map(x => x.id === orderId ? { ...x, buyerConfirmed: true, history: [...(x.history || []), { key: "recibido", label: "Comprador confirmó recepción", at: Date.now() }] } : x));
    loadOrders();
    if (o) { pushNotif(o.seller_id || o.sellerId || o.sellerName, "El comprador confirmó que recibió el producto.", orderId); if (o.courierName) pushNotif(o.courierName, "El comprador confirmó la recepción.", orderId); }
    flash("✅ Confirmaste la recepción");
  };
  const sellerConfirmPayment = async (orderId, ok) => {
    const o = mergedOrders.find(x => x.id === orderId);
    if (ok) {
      const { error } = await supabase.rpc("confirm_order", { p_order_id: orderId, p_who: "seller" });
      if (error) { console.error("confirm_order seller:", error.message); flash("⚠️ No se pudo confirmar: " + error.message); return; }
    }
    setOrders(prev => prev.map(x => {
      if (x.id !== orderId) return x;
      if (!ok) return { ...x, courierStage: "fallido", status: "fallido", history: [...(x.history || []), { key: "fallido", label: "Sin pago — entrega fallida", at: Date.now() }] };
      const idx = (x.flow || []).findIndex(s => s.key === "entregado");
      return { ...x, courierStage: "completado", sellerPaid: true, stepIdx: idx >= 0 ? Math.max(x.stepIdx || 0, idx) : (x.stepIdx || 0), status: "entregado", history: [...(x.history || []), { key: "pago_ok", label: "Vendedor confirmó el pago", at: Date.now() }] };
    }));
    loadOrders();
    // FALTABA: el comprador nunca se enteraba cuando el vendedor confirmaba el
    // pago — en pedidos en persona (sin mensajero) esta es a menudo la acción
    // que CIERRA el pedido de verdad, y antes solo se avisaba al mensajero
    // (que en 'persona' ni siquiera existe).
    if (o) pushNotif(o.buyer_id || o.buyerId || o.buyerName, ok ? "El vendedor confirmó el pago. Tu pedido quedó cerrado ✅" : "El vendedor reportó que no recibió el pago.", orderId);
    if (o && o.courierName) pushNotif(o.courierName, ok ? "El vendedor confirmó el pago. Entrega cerrada ✅" : "El vendedor reportó que no hubo pago. Devuelve el producto.", orderId);
    flash(ok ? "✅ Pago confirmado — entrega cerrada" : "⚠️ Marcado como sin pago");
  };
  const requestChat = (sellerId, sellerName, context) => { if (suspended) { flash("⛔ Tu cuenta está suspendida"); return; } openChat(sellerId, sellerName, context); };

  // ── CHAT DE UN PEDIDO — SISTEMA DE DOS MODALES ───────────────────────────────
  // Antes el botón de chat de un pedido siempre apuntaba a "la otra parte según mi
  // rol" con un nombre genérico ("Vendedor"/"Comprador") — y para un envío de
  // paquete (sin vendedor) mandaba un id nulo → "usuario no identificado".
  // Ahora: si YO soy vendedor o mensajero, hablo con el comprador (nunca conmigo
  // mismo). Si YO soy el comprador: con vendedor Y mensajero asignados, pregunta
  // con quién (hoja con el NOMBRE REAL de cada uno); un paquete suelto (sin
  // vendedor) va DIRECTO al mensajero; sin mensajero todavía, solo al vendedor.
  const [chatPicker, setChatPicker] = useState(null); // { sellerId, sellerName, courierId, courierName, context }
  const openOrderChat = async (o) => {
    const sellerId = o.seller_id || o.sellerId || null;
    const courierId = o.courier_id || o.courierId || null;
    const buyerId = o.buyer_id || o.buyerId || null;
    const context = { type: "order", id: o.id, title: o.title || "Pedido", image: o.image || null };
    const meIsSeller = !!sellerId && sellerId === user?.id;
    const meIsCourier = !!courierId && courierId === user?.id;

    if (meIsSeller || meIsCourier) {
      const name = buyerId ? await getUserName(buyerId) : null;
      requestChat(buyerId, name || "Comprador", context);
      return;
    }
    if (sellerId && courierId) {
      const [sName, cName] = await Promise.all([getUserName(sellerId), getUserName(courierId)]);
      setChatPicker({ sellerId, sellerName: sName || "Vendedor", courierId, courierName: cName || "Mensajero", context });
      return;
    }
    if (courierId) { const name = await getUserName(courierId); requestChat(courierId, name || "Mensajero", context); return; }
    if (sellerId) { const name = await getUserName(sellerId); requestChat(sellerId, name || "Vendedor", context); return; }
    flash("No se pudo abrir el chat: usuario no identificado");
  };

  // Usuarios bloqueados REALES (blocked_users + toggle_block RPC) — los usa
  // Ajustes → Privacidad. ANTES esta lista vivía solo en localStorage, sin
  // relación con el bloqueo real que usa el chat: bloquear desde el chat no
  // aparecía aquí, y "desbloquear" aquí no tocaba el bloqueo real (seguía
  // activo en la base, el chat seguía rechazando los mensajes). Ahora ambas
  // pantallas leen y escriben la MISMA fuente de verdad (blocked_users).
  const [blockedUsers, setBlockedUsers] = useState([]);
  const reloadBlockedUsers = useCallback(() => {
    if (!user?.id) { setBlockedUsers([]); return; }
    getBlockedUsers(user.id).then(setBlockedUsers).catch(() => {});
  }, [user?.id]);
  useEffect(() => { reloadBlockedUsers(); }, [reloadBlockedUsers]);
  const toggleBlock = async (key) => {
    try { await blockUser(key); reloadBlockedUsers(); }
    catch (e) { flash("❌ No se pudo actualizar el bloqueo"); }
  };

  // Favorito REAL: toggle_favorite en el backend. Actualiza el corazón al instante
  // (optimista) y luego reconcilia con la verdad del backend; si falla, revierte.
  const toggleFav = async (productId) => {
    const wasFav = favorites.has(productId);
    const addLocal = (id) => { const prod = [...products, ...favProducts].find(p => p.id === id); setFavProducts(prev => prod && !prev.some(p => p.id === id) ? [prod, ...prev] : prev); };
    // Optimista
    setFavorites(prev => { const n = new Set(prev); wasFav ? n.delete(productId) : n.add(productId); return n; });
    if (wasFav) setFavProducts(prev => prev.filter(p => p.id !== productId)); else addLocal(productId);
    flash(wasFav ? "💔 Eliminado de favoritos" : "❤️ Añadido a favoritos");
    // El producto demo no vive en el backend: solo toggle local, sin RPC.
    if (!UUID_RE.test(String(productId))) return;
    try {
      const nowFav = await toggleFavorite(productId);
      setFavorites(prev => { const n = new Set(prev); nowFav ? n.add(productId) : n.delete(productId); return n; });
      if (!nowFav) setFavProducts(prev => prev.filter(p => p.id !== productId));
    } catch {
      // Revertir
      setFavorites(prev => { const n = new Set(prev); wasFav ? n.add(productId) : n.delete(productId); return n; });
      if (wasFav) addLocal(productId); else setFavProducts(prev => prev.filter(p => p.id !== productId));
      flash("⚠️ No se pudo actualizar el favorito");
    }
  };

  // ⭐ DESTACAR un producto (el vendedor). Confirmación con la tarifa REAL de la
  // config en vivo → RPC promote_product (cobra a la deuda) → estado al instante.
  const promoteFlow = (productId, { skipConfirm = false } = {}) => {
    if (suspended) { flash("⛔ Tu cuenta está suspendida"); return; }
    const cost = Number(adminCfg.promoCost) || 0;
    const doIt = async () => {
      try {
        const charged = await promoteProduct(productId);
        const mark = p => p.id === productId ? { ...p, promoted: true } : p;
        setProducts(prev => prev.map(mark)); setServices(prev => prev.map(mark)); reloadOwn();
        flash(`⭐ Producto destacado — ${Number(charged) || cost} CUP sumados a tu deuda`);
      } catch (e) { flash("⚠️ " + (e?.message || "Destacar no está disponible por ahora")); }
    };
    if (skipConfirm) { doIt(); return; }
    askConfirm(`Destacar cuesta ${cost} CUP. Se suma a tu deuda con RETADOR y se cobra después. El impago puede llevar a sanciones. ¿Confirmas?`, doIt);
  };

  const handleBuy = (product) => {
    if (suspended) { flash("⛔ Tu cuenta está suspendida"); return; }
    setBuyModal(product);
  };

  // Filtros que FILTRAN/ORDENAN de verdad, con columnas reales del backend.
  const marketVisible = (() => {
    const q = search.toLowerCase();
    const disc = p => p.orig_price && parseFloat(p.orig_price) > parseFloat(p.price || 0);
    const isNew = p => p.badge === "NUEVO" || !!p.created_at;
    const sold = p => Number(p.sold_count ?? p.soldCount) || 0;
    const created = p => p.created_at ? new Date(p.created_at).getTime() : 0;
    // Favoritos: la lista sale de get_my_favorites (favProducts). Si la RPC solo
    // devolvió ids, se cae a filtrar el feed por esos ids (sin inventar nada).
    const favSource = favProducts.length ? favProducts : products.filter(p => favorites.has(p.id));
    const source = filter === "FAVORITOS" ? favSource : products;
    let list = source.filter(p => {
      const ms = !q || p.title?.toLowerCase().includes(q) || p.cat?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q);
      const mf = filter === "TODOS"
        || (filter === "OFERTAS"     && disc(p))
        || (filter === "NUEVO"       && isNew(p))
        || (filter === "RECOMENDADO" && (p.promoted || p.featured || p.badge === "RECOMENDADO"))
        || (filter === "MAS_VENDIDO" && sold(p) > 0)
        || (filter === "FAVORITOS");
      return ms && mf;
    });
    // Ordenamientos por defecto de cada filtro.
    if (filter === "NUEVO")            list = [...list].sort((a, b) => created(b) - created(a));
    else if (filter === "MAS_VENDIDO") list = [...list].sort((a, b) => sold(b) - sold(a));
    else if (filter === "OFERTAS")     list = [...list].sort((a, b) => (parseFloat(b.orig_price || 0) - parseFloat(b.price || 0)) - (parseFloat(a.orig_price || 0) - parseFloat(a.price || 0)));
    // "Todos los productos" PRIORIZA (nunca excluye) lo de mi región: los
    // productos con province=myProvince van primero, el resto queda justo
    // debajo — reordenamiento silencioso, sin ningún filtro visible; la
    // pantalla nunca se queda vacía por esto.
    else if (filter === "TODOS" && myProvince) {
      const mine = list.filter(p => p.province === myProvince);
      const rest = list.filter(p => p.province !== myProvince);
      list = [...mine, ...rest];
    }
    return list;
  })();

  // Config global expuesta a toda la app + la fecha de última actualización (para la
  // tirita de tasas del perfil). __updatedAt no se guarda en el backend (es de UI).
  const cfgCtxValue = useMemo(() => ({ ...adminCfg, __updatedAt: cfgUpdatedAt }), [adminCfg, cfgUpdatedAt]);
  // Secciones encendidas/apagadas (en vivo: adminCfg se actualiza por el realtime de
  // platform_config). undefined = encendida; solo `false` apaga (→ solo lectura).
  const sections = adminCfg.sectionsEnabled || {};
  const isDarkTheme = effectiveTheme === "dark";
  return (
    <AppThCtx.Provider value={appTk}>
    <PlatformCfgContext.Provider value={cfgCtxValue}>
    <RCtx.Provider value={rsp}>
    <div style={{ fontFamily: "'Barlow',sans-serif", background: appTk.BG, color: appTk.T1, height: `calc(100dvh / ${densZoom})`, width: `calc(100vw / ${densZoom})`, overflow: "hidden", position: "relative", display: "flex", flexDirection: rsp.isDesktop ? "row" : "column", paddingTop: "calc(env(safe-area-inset-top, 0px) / var(--img-s, 1))" }}>

      {/* Aviso de cambio de tema: pintado con el tema NUEVO (appTk ya es el nuevo).
          Toca en cualquier parte del cartel para cerrarlo; se cierra solo a los 8 s. */}
      {themeNotice && (
        <div onClick={() => { clearTimeout(themeNoticeTimer.current); setThemeNotice(false); }}
          style={{ position: "fixed", top: "calc(env(safe-area-inset-top, 0px) / var(--img-s, 1) + 12px)", left: "50%", transform: "translateX(-50%)",
            width: "min(92vw, 400px)", zIndex: 6000, cursor: "pointer",
            background: appTk.isDark ? "#141414" : "#fff", color: appTk.T1,
            border: `1px solid ${appTk.isDark ? "#2a2a2a" : "#E4E6EB"}`, borderRadius: 14,
            padding: "12px 14px", display: "flex", alignItems: "flex-start", gap: 11,
            boxShadow: appTk.isDark ? "0 10px 30px rgba(0,0,0,.6)" : "0 10px 30px rgba(0,0,0,.16)" }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: "rgba(245,179,1,.14)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>
            {appTk.isDark ? "🌙" : "☀️"}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 800 }}>Tema {appTk.isDark ? "oscuro" : "claro"} activado</div>
            <div style={{ fontSize: 12, marginTop: 2, lineHeight: 1.45, color: appTk.T2 }}>
              Para que la app se vea perfecta de arriba a abajo, ciérrala y vuelve a abrirla.
            </div>
          </div>
          <div style={{ marginLeft: "auto", flexShrink: 0, fontSize: 12, fontWeight: 700, color: "#F5B301", padding: "2px 2px 0 4px" }}>OK</div>
        </div>
      )}

      {/* Sidebar nav – solo desktop */}
      {rsp.isDesktop && (
        <div style={{ width: 220, flexShrink: 0, background: appTk.isDark ? "#060606" : appTk.CARD, borderRight: `1px solid ${appTk.B}`, display: "flex", flexDirection: "column", padding: "28px 0 20px" }}>
          <div style={{ padding: "0 24px 28px" }}><Logo size={20} /></div>
          {[
            { id: "market", ic: "store",  label: "Tienda" },
            { id: "search", ic: "search", label: "Buscar" },
            { id: "envios", ic: "truck",  label: "Envíos" },
            { id: "perfil", ic: "user",   label: "Perfil" },
          ].map(it => {
            const active = tab === it.id;
            return (
              <button key={it.id} onClick={() => { setTab(it.id); if (it.id === "market") setMScr("home"); if (it.id === "envios") setEScr("menu"); if (it.id === "perfil") setPScr("main"); }} className="p"
                style={{ background: active ? `${G}12` : "none", border: "none", borderLeft: `3px solid ${active ? G : "transparent"}`, display: "flex", alignItems: "center", gap: 13, padding: "13px 22px", transition: "all 0.18s", cursor: "pointer" }}>
                {it.ic === "search" ? (
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" style={{ color: active ? G : appTk.T3, flexShrink: 0 }}>
                    <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <line x1="15.5" y1="15.5" x2="20" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="8" y1="9" x2="14" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="8" y1="11" x2="14" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="8" y1="13" x2="14" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <Ic n={it.ic} c={active ? G : appTk.T3} s={19} />
                )}
                <span style={{ fontSize: 8, fontWeight: active ? 700 : 600, color: active ? G : appTk.T3 }}>{it.label}</span>
                {it.id === "perfil" && (chatUnread + ordersUnseen) > 0 && (
                  <div style={{ marginLeft: "auto", width: 18, height: 18, borderRadius: "50%", background: G, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#000" }}>{(chatUnread + ordersUnseen) > 9 ? "9+" : (chatUnread + ordersUnseen)}</div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Contenido principal */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", position: "relative", maxWidth: rsp.isDesktop ? "none" : rsp.isTablet ? "none" : "100%" }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: rsp.isDesktop ? 30 : 90, left: "50%", transform: "translateX(-50%)", background: effectiveTheme === "dark" ? "#191919" : "#ffffff", color: effectiveTheme === "dark" ? "#fff" : "#161616", border: `1px solid ${effectiveTheme === "dark" ? B : "rgba(0,0,0,.08)"}`, borderRadius: 16, padding: "12px 18px", fontSize: 12, fontWeight: 600, zIndex: 800, whiteSpace: "pre-wrap", overflowWrap: "anywhere", wordBreak: "break-word", lineHeight: 1.45, textAlign: "center", boxShadow: effectiveTheme === "dark" ? "0 8px 28px rgba(0,0,0,.9)" : "0 8px 28px rgba(0,0,0,.18)", animation: "tst .26s ease both", width: "max-content", maxWidth: "min(92vw, 420px)", maxHeight: "60vh", overflowY: "auto" }}>
          {toast}
        </div>
      )}

      {/* Tarjeta discreta "Activar avisos" — Web Push real, con la app cerrada */}
      <PushPrompt userId={user?.id} flash={flash} />

      {editProd && <EditProductModal product={editProd} onClose={() => setEditProd(null)} onSave={(changes) => { updateProduct(editProd.id, changes); setEditProd(null); }} flash={flash} onPromote={() => { setEditProd(null); promoteFlow(editProd.id); }} />}
      {confirmCfg && (
        <div onClick={() => setConfirmCfg(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 5300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: effectiveTheme === "dark" ? "#161618" : "#fff", borderRadius: 18, padding: "22px 20px", maxWidth: 340, width: "100%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,.4)" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: effectiveTheme === "dark" ? "#f0f0f2" : "#1a1a1a", marginBottom: 18, lineHeight: 1.4 }}>{confirmCfg.msg}</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmCfg(null)} style={{ flex: 1, height: 44, borderRadius: 11, border: `1px solid ${effectiveTheme === "dark" ? "#333" : "#e0e0e0"}`, background: "transparent", color: effectiveTheme === "dark" ? "#f0f0f2" : "#1a1a1a", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Cancelar</button>
              <button onClick={() => { confirmCfg.onYes && confirmCfg.onYes(); setConfirmCfg(null); }} style={{ flex: 1, height: 44, borderRadius: 11, border: "none", background: confirmCfg.color, color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>{confirmCfg.label}</button>
            </div>
          </div>
        </div>
      )}

      {/* Overlays */}
      {showCats   && <CatModal onClose={() => setShowCats(false)} onSelect={cat => { setActiveCat(cat); setShowCats(false); }} active={activeCat} />}
      {/* z-index propio (5400) POR ENCIMA de "Mi Panel" (zIndex:800, capa a
          pantalla completa aparte) — antes PubSheet usaba su zIndex interno
          (400, pensado para el contexto normal del mercado) y el formulario
          se abría de verdad, pero TAPADO detrás de Mi Panel: se podía
          publicar a ciegas sin ver nada hasta salir de Mi Panel. */}
      {pubOpen    && (
        <div style={{ position: "fixed", inset: 0, zIndex: 5400 }}>
          <PubSheet onClose={() => { setPubOpen(false); setPubPrefillCat(null); }} onPublish={async d => { setPubOpen(false); setPubPrefillCat(null); await handlePublish(d); }} user={user} flash={flash} initialKind={pubOpen === "service" ? "service" : (pubPrefillCat ? "product" : "")} initialCat={pubPrefillCat} />
        </div>
      )}
      {showNotif  && <NotifPanel onClose={() => { markNotifRead(null); setShowNotif(false); }} notifs={myNotifs} onRead={markNotifRead} onOpenOrder={(oid) => { setShowNotif(false); markNotifRead(null); setSelOrderId(oid); setTab("perfil"); setPScr("order-detail"); }} onOpenConversation={(cid) => { setShowNotif(false); markNotifRead(null); openConversationById(cid); }}
        onOpenQueue={(page) => {
          // Si no tiene ningún acceso al panel, no intenta navegar ahí (el panel
          // mismo bloquea además páginas puntuales sin permiso, como ya hace).
          if (!hasPanel) return;
          setShowNotif(false); markNotifRead(null);
          setAdminOpenPage(page); setShowAdmin(true);
        }} />}
      {/* Chat: capa OPACA a pantalla completa (inset 0 cubre TODO el viewport,
          estándar) — nada del producto/pantalla de atrás puede asomar. */}
      {chatOpen && selChat && (
        <div style={{ position: "fixed", inset: 0, zIndex: 5100, background: effectiveTheme === "dark" ? "#080808" : "#ffffff", display: "flex", flexDirection: "column", overflow: "hidden", paddingTop: "env(safe-area-inset-top, 0px)" }}>
          <ChatScreen key={selChat.id || selChat.otherId} chat={selChat} user={user} onBack={() => setChatOpen(false)} onConvId={setOpenConvId} flash={flash} onViewProfile={openPublicProfile} orders={mergedOrders} onOpenOrder={openOrderFromChat} onOpenProduct={openProductFromChat} onStartOrder={startOrderFromChat}
            /* BUG REAL corregido: chat.context (el producto pendiente de
               adjuntar) vivía en selChat, que NUNCA se limpiaba tras enviarlo
               — así que si el chat se desmontaba y volvía a montar (p.ej. al
               ir a "Ver ficha completa"/"Iniciar pedido" y volver, que ponen
               chatOpen=false para navegar), la tarjeta "revivía" como
               pendiente sin que nadie la pidiera. Ahora, en cuanto deja de
               ser relevante (se envía o se cancela), se limpia también aquí. */
            onAttachmentCleared={() => setSelChat(prev => prev ? { ...prev, context: null } : prev)} />
        </div>
      )}
      {/* Hoja "¿con quién quieres chatear?" — pedidos con vendedor Y mensajero a la vez. */}
      {chatPicker && (
        <div onClick={() => setChatPicker(null)} style={{ position: "fixed", inset: 0, zIndex: 5150, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "flex-end" }}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, margin: "0 auto", background: effectiveTheme === "dark" ? "#141417" : "#fff", borderRadius: "20px 20px 0 0", padding: "18px 16px calc(18px + env(safe-area-inset-bottom, 0px))" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: effectiveTheme === "dark" ? "#f0f0f2" : "#0f172a", marginBottom: 12, textAlign: "center" }}>¿Con quién quieres chatear?</div>
            <button onClick={() => { requestChat(chatPicker.sellerId, chatPicker.sellerName, chatPicker.context); setChatPicker(null); }} style={{ width: "100%", textAlign: "left", background: "transparent", border: `1px solid ${effectiveTheme === "dark" ? "rgba(255,255,255,.1)" : "rgba(0,0,0,.1)"}`, borderRadius: 13, padding: "13px 15px", marginBottom: 8, cursor: "pointer", fontSize: 13.5, fontWeight: 700, color: effectiveTheme === "dark" ? "#f0f0f2" : "#0f172a" }}>💬 Chatear con {chatPicker.sellerName}</button>
            <button onClick={() => { requestChat(chatPicker.courierId, chatPicker.courierName, chatPicker.context); setChatPicker(null); }} style={{ width: "100%", textAlign: "left", background: "transparent", border: `1px solid ${effectiveTheme === "dark" ? "rgba(255,255,255,.1)" : "rgba(0,0,0,.1)"}`, borderRadius: 13, padding: "13px 15px", marginBottom: 8, cursor: "pointer", fontSize: 13.5, fontWeight: 700, color: effectiveTheme === "dark" ? "#f0f0f2" : "#0f172a" }}>🛵 Chatear con {chatPicker.courierName}</button>
            <button onClick={() => setChatPicker(null)} style={{ width: "100%", background: "transparent", border: "none", color: "#888", fontSize: 12.5, fontWeight: 700, padding: "8px", cursor: "pointer" }}>Cancelar</button>
          </div>
        </div>
      )}
      {showWallet && (() => {
        const meName = profileData?.name || user?.name || "Usuario";
        const meUser = { name: meName, omegaId: "RT-" + String(Math.abs([...meName].reduce((a, c) => a + c.charCodeAt(0), 0)) * 7).padStart(6, "0"), phone: profileData?.phone || "—", verifiedSince: user?.verified ? "Cuenta verificada" : "Sin verificar" };
        // Contactos = otros usuarios conocidos (vendedores de productos)
        const seen = new Set([meName]);
        const contacts = [];
        products.forEach(p => { const n = p.seller_name; if (n && !seen.has(n)) { seen.add(n); contacts.push({ id: "u_" + n, name: n }); } });
        // Órdenes por pagar = las mías aún no pagadas por billetera
        const payable = orders.filter(o => !o.paidViaWallet).map(o => ({ id: o.id, vendor: o.sellerName || "Vendedor", item: o.title || "Pedido", amount: (Number(o.amount) || 0) + (Number(o.shipPrice) || 0), currency: o.currency || "CUP" }));
        // Tasas desde el panel de admin (Economía → FX): única fuente de verdad
        const fx = adminCfg.fx || { usdToCup: 400, eurToCup: 430 };
        const usdCup = Number(fx.usdToCup) || 400, eurCup = Number(fx.eurToCup) || 430;
        const walletRates = { base: "USD", updatedAt: Date.now(), rates: { USD: 1, EUR: +(usdCup / eurCup).toFixed(4), CUP: usdCup } };
        return <div style={{ position: "fixed", inset: 0, zIndex: 4000, overflow: "hidden", background: effectiveTheme === "dark" ? "#0a0a0a" : "#f1f5f9" }}>
          <SectionGate enabled={sections.wallet} dark={effectiveTheme === "dark"} onClose={() => setShowWallet(false)}>
            <Suspense fallback={<LazyFallback />}>
              <WalletApp user={meUser} contacts={contacts} orders={payable} rates={walletRates} dark={effectiveTheme === "dark"} onClose={() => setShowWallet(false)}
                onOrderPaid={(orderId) => setOrders(prev => prev.map(o => o.id === orderId ? { ...o, paidViaWallet: true, status: o.status === "pendiente" || o.stepIdx === 0 ? (o.flow?.[1]?.key || o.status) : o.status } : o))} />
            </Suspense>
          </SectionGate>
        </div>;
      })()}
      {showFollowing && (
        <div style={{ position: "fixed", inset: 0, zIndex: 4000, background: effectiveTheme === "dark" ? "#080808" : "#ffffff", display: "flex", flexDirection: "column", overflow: "hidden", paddingTop: "env(safe-area-inset-top, 0px)" }}>
          <FollowingListScreen user={user} onBack={() => setShowFollowing(false)} onViewProfile={(id) => { setShowFollowing(false); openPublicProfile(id); }} />
        </div>
      )}
      {showTools && (() => {
        const isPremium = isOwner || ["pro", "premium"].includes(user?.plan);
        const dark = effectiveTheme === "dark";
        const onPublish = (prod) => {
          if (!prod) return;
          const parts = String(prod.category || "").split("/").map(s => s.trim());
          const catName = parts[0] || "", subName = parts[1] || "";
          const found = realCatsList.find(c => (c.name || "").toLowerCase() === catName.toLowerCase());
          const imgs = (prod.userImages && prod.userImages.length) ? prod.userImages : (prod.images || []);
          handlePublish({
            title: prod.title || "Producto importado",
            price: Math.round(prod.suggestedPrice || prod.originPrice || 0),
            description: prod.description || "",
            cat: found ? found.id : "electronica", subcat: subName || undefined,
            image: imgs[0] || undefined, images: imgs,
            cost_price: prod.costPrice ?? prod.originPrice, currency: prod.currency || "EUR",
          });
          setToolApp(false); setShowTools(false);
        };
        if (toolApp) {
          return <div style={{ position: "fixed", top: 0, left: 0, zIndex: 4000, width: `calc(100vw / ${densZoom})`, height: `calc(100dvh / ${densZoom})`, overflowY: "auto", WebkitOverflowScrolling: "touch", background: "#07070A" }}>
            <Suspense fallback={<LazyFallback />}><ProductToolsApp onClose={() => setToolApp(false)} onPublish={onPublish} canUse={isPremium} /></Suspense>
          </div>;
        }
        const bg = dark ? "#0a0a0a" : "#f1f5f9", card = dark ? "#141417" : "#ffffff", t1 = dark ? "#f0f0f2" : "#0f172a", t2 = dark ? "#9494a0" : "#64748b", bd = dark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.08)";
        return <div style={{ position: "fixed", top: 0, left: 0, zIndex: 4000, width: `calc(100vw / ${densZoom})`, height: `calc(100dvh / ${densZoom})`, overflowY: "auto", WebkitOverflowScrolling: "touch", background: bg, padding: "18px 16px 40px" }}>
          <div style={{ maxWidth: 560, margin: "0 auto" }}>
            <button onClick={() => setShowTools(false)} style={{ background: "transparent", border: `1px solid ${bd}`, color: t2, borderRadius: 9, padding: "7px 13px", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 16 }}>‹ Volver a RETADOR</button>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <h1 style={{ fontSize: 23, fontWeight: 800, color: t1, letterSpacing: "-.02em" }}>Herramientas</h1>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#6EE7B7", background: "rgba(110,231,183,.13)", border: "1px solid rgba(110,231,183,.3)", borderRadius: 100, padding: "3px 9px" }}>PLATAFORMA</span>
            </div>
            <p style={{ fontSize: 13, color: t2, marginBottom: 20 }}>Herramientas creadas por RETADOR para impulsar tu negocio.</p>

            <div style={{ background: card, border: `1px solid ${bd}`, borderRadius: 18, overflow: "hidden" }}>
              <div style={{ height: 90, background: "linear-gradient(135deg,#6EE7B7,#67E8F9)", position: "relative", display: "flex", alignItems: "center", padding: "0 18px", overflow: "hidden" }}>
                <span style={{ position: "absolute", right: 2, bottom: -26, fontSize: 104, fontWeight: 800, color: "rgba(4,35,26,.16)", lineHeight: 1, pointerEvents: "none", fontFamily: "Georgia, serif" }}>Ω</span>
                <span style={{ fontSize: 38, position: "relative" }}>🔗</span>
                <span style={{ position: "absolute", top: 12, right: 12, fontSize: 10, fontWeight: 800, color: "#064e3b", background: "rgba(255,255,255,.85)", borderRadius: 100, padding: "3px 9px" }}>⚡ PREMIUM</span>
              </div>
              <div style={{ padding: "16px 18px 18px" }}>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: t1, marginBottom: 6 }}>Importador Inteligente</h2>
                <p style={{ fontSize: 13, lineHeight: 1.55, color: t2, marginBottom: 14 }}>
                  Llena tu tienda en segundos. Pega el enlace de un producto de <b style={{ color: t1 }}>AliExpress</b> y se importa solo con fotos, precio y características — o describe tu producto y la <b style={{ color: t1 }}>IA</b> te arma una publicación elegante, lista para vender, con tu margen de ganancia ya calculado.
                </p>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 16 }}>
                  {["Importa por URL", "Crea con IA", "Calcula tu ganancia"].map(f => (
                    <span key={f} style={{ fontSize: 11, fontWeight: 600, color: t2, background: dark ? "#1c1c22" : "#f1f5f9", borderRadius: 8, padding: "5px 10px" }}>✓ {f}</span>
                  ))}
                </div>
                {isPremium ? (
                  <button onClick={() => setToolApp(true)} style={{ width: "100%", height: 46, borderRadius: 12, border: "none", background: "#6EE7B7", color: "#04231a", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>Abrir herramienta →</button>
                ) : (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 9, background: dark ? "#1a1410" : "#fff7ed", border: "1px solid rgba(245,182,0,.3)", borderRadius: 12, padding: "11px 13px", marginBottom: 11 }}>
                      <span style={{ fontSize: 18 }}>🔒</span>
                      <span style={{ fontSize: 12, color: dark ? "#fcd34d" : "#92400e", lineHeight: 1.4 }}>Esta herramienta es del <b>Plan Premium</b>. Suscríbete para usarla sin límites.</span>
                    </div>
                    <button onClick={() => setToolApp(true)} style={{ width: "100%", height: 46, borderRadius: 12, border: `1.5px solid ${bd}`, background: "transparent", color: t1, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Probar ahora (demo) →</button>
                    <p style={{ fontSize: 10.5, color: t2, textAlign: "center", marginTop: 8 }}>Modo de prueba mientras se habilitan los planes.</p>
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: 14, background: card, border: `1px dashed ${bd}`, borderRadius: 16, padding: "18px", textAlign: "center" }}>
              <span style={{ fontSize: 22, opacity: .5 }}>🧩</span>
              <p style={{ fontSize: 12.5, color: t2, marginTop: 6 }}>Más herramientas en camino.</p>
            </div>
          </div>
        </div>;
      })()}
      {showCourier && (() => {
        const meName = profileData?.name || user?.name || "Usuario";
        // Acceso por ROL real ÚNICAMENTE: role="courier" (lo pone el admin al
        // aprobar la solicitud en courier_applications). El registro local de
        // mensajeros quedó RETIRADO como vía de aprobación.
        const myRecord = (user?.role === "courier")
          ? { userName: meName, name: meName, status: "approved" }
          : null;
        return <Suspense fallback={<LazyFallback />}><CourierFlow myRecord={myRecord} user={user} flash={flash} dark={effectiveTheme === "dark"} onClose={() => setShowCourier(false)}
          meName={meName} meId={user?.id} orders={orders} localBase={adminCfg.localBase || 150}
          onAccept={(id, fee) => { acceptDelivery(id, fee); }}
          onStage={courierStage}
          onViewProfile={openPublicProfile}
          onChat={openChat}
          onCancel={(id) => { cancelDelivery(id); flash("Entrega liberada · disponible de nuevo"); }}
          onReport={(rep) => { addReport(rep); flash("Reporte enviado al equipo de RETADOR"); }} /></Suspense>;
      })()}
      {viewProfileId && (
        <div style={{ position: "fixed", inset: 0, zIndex: 5200, background: effectiveTheme === "dark" ? "#080808" : "#ffffff", display: "flex", flexDirection: "column", overflow: "hidden", paddingTop: "env(safe-area-inset-top, 0px)" }}>
          {/* Una excepción en el perfil ya no puede dejar la pantalla EN BLANCO:
              queda acotada aquí, con el error visible y opción de volver. */}
          <ErrorBoundary title="No se pudo mostrar este perfil" onClose={() => setViewProfileId(null)}>
          {viewedStoreEligible === null ? (
            // Mientras se confirma el vendedor real: NUNCA datos de relleno ni
            // del perfil anterior, pero TAMPOCO pantalla en blanco/negra sin
            // explicación — un esqueleto neutro (gris, con pulso) dice "cargando"
            // sin fingir ser un dato real. Decisión de esta ronda: aceptar 1-2s
            // de esqueleto en vez de medio segundo en blanco.
            <ProfileSkeleton />
          ) : viewedStoreEligible ? (
            <StoreFront
              cfg={viewedStoreCfg || {}}
              products={viewedStoreProducts.filter(p => !p.archived_at)}
              headerStats={viewedStoreStats}
              ratingInfo={viewedStoreRating}
              reviews={viewedStoreReviews}
              profileRealName={viewedStoreName}
              isVerified={viewedStoreVerified}
              sellerId={viewProfileId}
              viewerId={user?.id}
              onReviewChanged={reloadViewedReviews}
              isOwner={false}
              onBack={() => setViewProfileId(null)}
              onChat={() => { const id = viewProfileId; setViewProfileId(null); requestChat(id, viewedStoreName || "Vendedor"); }}
              onProduct={p => setViewProdOverlay(p)}
              flash={flash}
            />
          ) : (
          <FreeProfileScreen
            onBack={() => setViewProfileId(null)}
            user={user}
            sellerId={viewProfileId}
            initialProfile={{}}
            onProfileUpdate={() => {}}
            isOwner={false}
            onChat={(id, name) => { setViewProfileId(null); requestChat(id, name); }}
            isVerified={false}
            onReport={(p) => addReport({ targetName: p.targetName, reason: p.reason, detail: p.detail, reporterName: user?.name || "Usuario" })}
            userProducts={products.filter(p => p.seller_id === viewProfileId)}
            onProduct={p => setViewProdOverlay(p)}
          />
          )}
          </ErrorBoundary>
        </div>
      )}
      {/* Producto como CAPA (desde perfil público / modo mensajero): encima de todo,
          con su entrada de historial — atrás lo cierra y vuelve a la capa anterior. */}
      {viewProdOverlay && (
        <div style={{ position: "fixed", inset: 0, zIndex: 5300, background: effectiveTheme === "dark" ? "#080808" : "#ffffff", display: "flex", flexDirection: "column", overflow: "hidden", paddingTop: "env(safe-area-inset-top, 0px)" }}>
          <ProductDetail
            product={viewProdOverlay}
            onBack={() => setViewProdOverlay(null)}
            onDelivery={() => { setViewProdOverlay(null); setViewProfileId(null); setChatOpen(false); setShowCourier(false); setTab("envios"); setEScr("local"); }}
            onChat={requestChat} onViewProfile={openPublicProfile}
            onBuy={(p) => { setViewProdOverlay(null); setViewProfileId(null); setChatOpen(false); setShowCourier(false); handleBuy(p); }}
            onFav={toggleFav} isFav={favorites.has(viewProdOverlay.id)} canChat={hasOrderWith(viewProdOverlay.seller_id)}
            onDelete={null} onEdit={null}
            flash={flash} requireAuth={requireAuth} user={user}
          />
        </div>
      )}
      {/* "Mi Panel" (Tienda Pro) — capa a pantalla completa, EXACTAMENTE igual
          que el Panel de Administración (misma técnica: position absolute
          inset:0 por encima de toda la app, con su propia barra lateral
          interna). Así la barra inferior general nunca coexiste con "Mi
          Panel" ni le roba espacio real: no está "oculta", está fuera del
          árbol que se ve. La Tienda (StoreFront) sigue intacta, con su barra
          inferior general de siempre — esto no la toca. */}
      {isProStore && storeMode === "dash" && (
        <div style={{ position:"absolute", top:0, left:0, right:0, bottom:0, zIndex:800, overflow:"hidden", isolation:"isolate" }}>
          <StoreDashboard user={user} cfg={storeCfg || {}} products={myStoreProducts} orders={myStoreOrders} plans={realPlans} myPlan={myRealPlan} api={storeApi} onStore={() => setStoreMode("store")} onMenu={() => setProfileMenuOpen(true)} profileRealName={profileData?.name || user?.name} flash={flash} />
        </div>
      )}
      {/* OmniPanel (Panel de administración) se carga bajo demanda (React.lazy) —
          es, con enorme diferencia, el archivo más grande de toda la app
          (~3600 líneas) y NUNCA lo necesita nadie que no sea admin/staff, así
          que ya no viaja dentro del paquete inicial que descarga TODO el
          mundo solo para ver la Tienda. Mientras se descarga (solo la
          primera vez que alguien abre el panel), un spinner simple. */}
      {showAdmin  && <Suspense fallback={<LazyFallback />}><OmniPanel onClose={() => setShowAdmin(false)} theme={appTk} zoom={densZoom} data={{
        meId: user?.id,
        // Página con la que abrir esta vez (p.ej. al tocar una notificación de
        // nueva solicitud de plan/verificación/mensajero). null = la de siempre.
        initialPage: adminOpenPage,
        // Mensaje directo desde las colas del panel (Planes/Verificaciones): abre
        // el chat real con esa persona (se usa junto con sendMessage + meta para
        // dejar la mini-tarjeta de "a qué solicitud corresponde").
        onOpenChat: (otherId, otherName) => { setShowAdmin(false); openChat(otherId, otherName); },
        // Al abrir una cola, marca LEÍDAS sus notificaciones de campanita (para que no
        // se acumulen). El badge de pendientes sigue su propia lógica (staff_pending_counts).
        onOpenQueue: (page) => {
          const kindByPage = { verif: "verification_app", plans: "plan_app", delivery: "courier_app" };
          const kind = kindByPage[page];
          if (!kind || !user?.id) return;
          setBkNotifs(prev => prev.map(n => n.kind === kind ? { ...n, read: true } : n));
          markNotificationsReadByKind(user.id, kind).catch(() => {});
        },
        // CAPA ENCIMA del panel: la ficha se abre por encima (zIndex 5200 + backstack);
        // atrás la cierra y el panel sigue EXACTAMENTE donde estaba. No cerrar el panel.
        onViewProfile: (id) => openPublicProfile(id),
        // 💬 Cobrar deuda: abre el chat (capa encima del panel) con el mensaje
        // predefinido EDITABLE ya escrito en el input.
        onCollectDebt: (sellerId, sellerName, message) => { openChat(sellerId, sellerName, null, message); },
        orders, cfg: adminCfg,
        onCfg: handleCfgChange,
        // Permisos a la carta del usuario actual (ALL o {seccion:nivel}).
        perms: adminPerms,
        // Editor Visual: publica SOLO bloques/masters (no tarifas) vía set_platform_blocks.
        // Además refleja el cambio en la config local para que la tienda lo muestre en vivo.
        onPublishBlocks: (payload) => { setAdminCfg(prev => ({ ...prev, ...payload })); return setPlatformBlocks(payload); },
        onOrderAction: (id, action) => setOrders(prev => prev.map(o => o.id === id ? { ...o, status: action === 'cancel' ? 'cancelado' : action === 'approve' ? 'confirmado' : o.status, flagged: action === 'flag' ? true : (action === 'cancel' || action === 'approve' ? false : o.flagged) } : o)),
        onDisputeAction: (id, action) => setOrders(prev => prev.map(o => o.id === id ? { ...o, status: action === 'resolve' ? 'confirmado' : action === 'freeze' ? 'congelado' : action === 'escalate' ? 'escalado' : o.status, disputeState: action } : o)),
        reports, onReportAction: (id, action) => setReports(prev => prev.map(r => r.id === id ? { ...r, state: action } : r)),
        planRequests, onPlanAction: (id, action) => { setPlanRequests(prev => prev.map(r => { if (r.id === id) { if (action === 'approved') setUserPlans(p => ({ ...p, [r.userName]: r.plan })); return { ...r, state: action }; } return r; })); },
        teamMembers, onSaveTeam: setTeamMembers,
        // Solicitudes REALES de mensajero: aprobar/rechazar vía la función oficial
        // review_courier_application (al aprobar pone role='courier' Y is_verified=true,
        // y notifica). KYC completo: incluye nombre legal, documento y las 3 fotos.
        couriers: courierApps.map(a => ({
          id: a.id, userId: a.user_id, status: a.status || "pending",
          nombre: a.name, userName: a.name, telefono: a.phone, zona: a.zone, vehiculo: a.vehicle, createdAt: a.created_at,
          fullName: a.full_name, docType: a.doc_type, docNumber: a.doc_number, docFront: a.doc_front, docBack: a.doc_back, selfie: a.selfie, rejectReason: a.reject_reason,
        })),
        onCourierAction: async (id, status, reason) => {
          try {
            await reviewCourierApplication(id, status === "approved", reason || null);
            flash(status === "approved" ? "✅ Mensajero aprobado — su perfil también queda verificado" : "Solicitud rechazada");
          } catch (e) { flash("⚠️ No se pudo revisar: " + (e?.message || "error")); }
          reloadCourierApps();
        },
        knownUsers: [...new Set(products.map(pr => pr.seller_name).filter(Boolean))].filter(n => n !== (profileData?.name || user?.name)),
        verifications, onVerifyAction: (id, action) => { setVerifications(prev => prev.map(v => { if (v.id === id) { if (action === 'approved' && v.userName) setVerifiedUsers(u => u.includes(v.userName) ? u : [...u, v.userName]); return { ...v, state: action }; } return v; })); },
        payments, onMarkPaid: (sellerName, amount) => setPayments(prev => [{ id: 'pay_' + Date.now(), sellerName, amount, at: Date.now() }, ...prev]),
        plans: adminCfg.plans, verifiedUsers, userPlans,
      }} /></Suspense>}
      {buyModal   && <BuyModal product={buyModal} user={user} onClose={() => setBuyModal(null)} flash={flash} onSuccess={(order) => { setBuyModal(null); const eo = addOrder(order); if (eo) { setSelOrderId(eo.id); setTab("perfil"); setPScr("order-detail"); } }} />}

      {/* Pantallas */}
      {/* El contenido usa TODO el alto: la barra inferior flota encima (translúcida
          con blur), así al esconderse no queda ninguna franja vacía debajo. */}
      <div onScrollCapture={handleNavScroll} style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <>
          {tab === "market" && <SectionGate enabled={sections.marketplace} dark={isDarkTheme}>
            {mScr === "home" && (
              <MarketHome
                hidden={navHidden}
                scrollKeeper={marketScrollRef}
                view={productView}
                loading={loading} products={marketVisible} filter={filter} setFilter={setFilter}
                myProvince={myProvince}
                onGoToRegion={() => { setTab("perfil"); setPScr("settings"); }}
                search={search} setSearch={setSearch} activeCat={activeCat} setActiveCat={cat => { setActiveCat(cat); }}
                onCats={() => setShowCats(true)}
                onProduct={p => { setSelProd(p); setMScr("product"); }}
                user={user} favorites={favorites} onFav={toggleFav}
                notifCount={unreadNotif} onNotif={() => setShowNotif(true)}
                onPublish={() => setPubOpen(true)}
                onPlusMenu={rect => setPlusMenu(rect)}
                onOpenChats={openMessages}
                messagesBadge={chatUnread}
                onServices={() => setMScr("services")}
                onNav={navTo}
                onRefresh={reloadFeed}
              />
            )}
            {mScr === "services" && (
              <ServicesScreen
                services={services}
                loading={loading}
                onBack={() => setMScr("home")}
                onContact={(s) => requestChat(s.seller_id, s.seller_name, { type: "service", id: s.id, title: s.title, image: s.image || s.img })}
                onOpen={(s) => { setSelProd(s); setProdBackTo("services"); setMScr("product"); }}
                onPublish={() => setPubOpen("service")}
              />
            )}
            {mScr === "product" && selProd && (
              <ProductDetail
                product={selProd} onBack={() => {
                  if (prodBackTo === "profile-full") { setProdBackTo(null); setMScr("home"); setTab("perfil"); setPScr("profile-full"); }
                  else if (prodBackTo === "store-main") { setProdBackTo(null); setMScr("home"); setTab("perfil"); setPScr("main"); }
                  else if (prodBackTo === "sellerProfile") { setProdBackTo(null); setMScr("sellerProfile"); }
                  else if (prodBackTo === "services") { setProdBackTo(null); setMScr("services"); }
                  else if (prodBackTo === "chat") { setProdBackTo(null); setMScr("home"); setChatOpen(true); }
                  else setMScr("home");
                }}
                onDelivery={() => { setTab("envios"); setEScr("local"); }}
                onChat={requestChat} onViewProfile={id => { setSelSeller(id); setMScr("sellerProfile"); }}
                onBuy={handleBuy} onFav={toggleFav} isFav={favorites.has(selProd.id)} canChat={hasOrderWith(selProd.seller_id)}
                onDelete={(selProd.seller_id === user?.id) ? (() => askConfirm("Se elimina para siempre. Perderás las fotos y las reseñas de este producto. Esta acción no se puede deshacer.", () => { handleDelete(selProd.id); if (prodBackTo === "profile-full") { setProdBackTo(null); setMScr("home"); setTab("perfil"); setPScr("profile-full"); } else if (prodBackTo === "store-main") { setProdBackTo(null); setMScr("home"); setTab("perfil"); setPScr("main"); } else setMScr("home"); })) : null}
                onEdit={(selProd.seller_id === user?.id) ? (() => setEditProd(selProd)) : null}
                flash={flash} requireAuth={requireAuth} user={user}
              />
            )}
            {mScr === "sellerProfile" && selSeller && (
              sellerStoreEligible === null ? <ProfileSkeleton /> : sellerStoreEligible ? (
                <StoreFront
                  cfg={sellerStoreCfg || {}}
                  products={sellerStoreProducts.filter(p => !p.archived_at)}
                  headerStats={sellerStoreStats}
                  ratingInfo={sellerStoreRating}
                  reviews={sellerStoreReviews}
                  profileRealName={sellerStoreName}
                  isVerified={sellerStoreVerified}
                  sellerId={selSeller}
                  viewerId={user?.id}
                  onReviewChanged={reloadSellerReviews}
                  isOwner={false}
                  onBack={() => setMScr(selProd ? "product" : "home")}
                  onChat={() => requestChat(selSeller, sellerStoreName || "Vendedor")}
                  onProduct={p => { setSelProd(p); setProdBackTo("sellerProfile"); setMScr("product"); }}
                  flash={flash}
                />
              ) : (
                <FreeProfileScreen
                  onBack={() => setMScr(selProd ? "product" : "home")}
                  user={user}
                  sellerId={selSeller}
                  initialProfile={{}}
                  onProfileUpdate={() => {}}
                  isOwner={false}
                  onChat={requestChat}
                  isVerified={false}
                  onReport={(p) => addReport({ targetName: p.targetName, reason: p.reason, detail: p.detail, reporterName: user?.name || "Usuario" })}
                  userProducts={products.filter(p => p.seller_name === selSeller || p.seller_id === selSeller)}
                  onProduct={p => { setSelProd(p); setProdBackTo("sellerProfile"); setMScr("product"); }}
                />
              )
            )}
          </SectionGate>}

          {tab === "search" && (
            <SectionGate enabled={sections.search} dark={isDarkTheme}>
              <AdvancedSearch
                view={productView}
                products={products}
                services={services}
                onProduct={p => {
                  setSelProd(p);
                  setTab("market");
                  setMScr("product");
                }}
                favorites={favorites}
                onFav={toggleFav}
                onNav={navTo}
                onPublishInCat={(catId) => {
                  // La categoría "Servicios" (id fijo del catálogo de PRODUCTOS) no
                  // tiene relación con las categorías de servicios (config.serviceCats,
                  // texto libre, taxonomía totalmente aparte) — abrir ahí el formulario
                  // de PRODUCTO era el bug real: "publica en categoría" desde Servicios
                  // debe abrir el formulario de SERVICIO, no el de producto.
                  if (catId === "servicios") { setPubOpen("service"); return; }
                  setPubPrefillCat(catId); setPubOpen("product");
                }}
              />
            </SectionGate>
          )}

          {tab === "envios" && <>
            {eScr === "menu"  && <EnviosMenu onLocal={() => setEScr("local")} onIntl={() => setEScr("intl")} user={user} requireAuth={requireAuth} />}
            {eScr === "local" && <SectionGate enabled={sections.deliveryLocal} dark={isDarkTheme} onClose={() => setEScr("menu")}><LocalDelivery onBack={() => setEScr("menu")} flash={flash} cfg={adminCfg} user={user} onNav={navTo} onChat={openMessages} onTrackOrder={openOrderById} onPackageCreated={(order) => { const eo = addOrder(order); if (eo) openOrderById(eo.id); }} /></SectionGate>}
            {eScr === "intl"  && <SectionGate enabled={sections.intlShipping} dark={isDarkTheme} onClose={() => setEScr("menu")}><IntlShipping  onBack={() => setEScr("menu")} flash={flash} cfg={cfg} onNav={navTo} /></SectionGate>}
          </>}

          {tab === "subastas" && (
            <SectionGate enabled={sections.auctions} dark={isDarkTheme}>
              <AuctionScheduleGate schedule={adminCfg.auctionSchedule} dark={isDarkTheme}>
                <Suspense fallback={<LazyFallback />}>
                  <SubastasScreen forceCreate={subOpenCreate} onForceCreateDone={() => setSubOpenCreate(false)} onNav={navTo} sellerName={profileData?.name || user?.name || "Usuario"} />
                </Suspense>
              </AuctionScheduleGate>
            </SectionGate>
          )}

          {tab === "perfil" && <>
            {pScr === "main" && (() => {
              // Perfil DIRECTO: al tocar "Perfil" se ve el perfil propio (no un menú
              // apilado). El menú vive en el panel lateral (☰ → ProfileMenuDrawer).
              const me = profileData?.name || user?.name;
              const accrued = orders.filter(o => (o.sellerName || o.sellerId) === me).reduce((a, o) => a + (o.amount || 0) * ((o.commissionPct ?? adminCfg.commissionPct ?? 10) / 100), 0);
              const paid = payments.filter(p => p.sellerName === me).reduce((a, p) => a + (p.amount || 0), 0);
              const myDebt = Math.max(0, accrued - paid);
              // TIENDA PRO: reemplaza el perfil normal para vendedores con
              // plan real can_customize=true — el menú ☰, chat, pedidos,
              // verificación siguen accesibles igual (ver onMenu/onSettings).
              if (isProStore) {
                // "Mi Panel" (Resumen/Pedidos/Productos/…) ya NO se anida aquí — es
                // una capa a pantalla completa propia (ver overlay junto a OmniPanel
                // más abajo), igual que el Panel de Administración. Aquí SIEMPRE se ve
                // la Tienda (StoreFront); "⚡ Mi Panel" solo cambia storeMode a "dash".
                return <StoreFront embedded cfg={storeCfg || {}} products={myStoreProducts.filter(p => !p.archived_at)} headerStats={myStoreStats} ratingInfo={myStoreRating} reviews={myStoreReviews} profileRealName={me} isVerified={!!user?.verified} sellerId={user?.id} isOwner onDash={() => setStoreMode("dash")} onMenu={() => setProfileMenuOpen(true)} onSettings={() => setPScr("settings")} onChat={() => {}} onProduct={p => { setSelProd(p); setProdBackTo("store-main"); setTab("market"); setMScr("product"); }} />;
              }
              return <FreeProfileScreen embedded onMenu={() => setProfileMenuOpen(true)} onSettings={() => setPScr("settings")} user={user} initialProfile={profileData} onProfileUpdate={setProfileData} onVerify={() => reloadOwn()} isVerified={!!user?.verified || verifiedUsers.includes(me)} currentPlan={currentPlanName} currentPlanId={user?.plan || "gratis"} plans={realPlans} maxProducts={myRealPlan?.max_products ?? null} onPlanChanged={(planId) => setUser(prev => prev ? { ...prev, plan: planId } : prev)} myDebt={myDebt} commissionActive={adminCfg.commissionActive !== false} userProducts={ownListings} archivedProducts={ownArchived} onProduct={p => { setSelProd(p); setProdBackTo("profile-full"); setTab("market"); setMScr("product"); }} onDeleteProduct={confirmDeleteProduct} onArchiveProduct={confirmArchiveProduct} onUnarchiveProduct={handleUnarchive} onDeleteArchivedProduct={confirmDeleteProduct} onEditProduct={(p) => setEditProd(p)} onPromoteProduct={(p) => promoteFlow(p.id)} />;
            })()}
            {pScr === "profile-full" && (() => {
              const me = profileData?.name || user?.name;
              const accrued = orders.filter(o => (o.sellerName || o.sellerId) === me).reduce((a, o) => a + (o.amount || 0) * ((o.commissionPct ?? adminCfg.commissionPct ?? 10) / 100), 0);
              const paid = payments.filter(p => p.sellerName === me).reduce((a, p) => a + (p.amount || 0), 0);
              const myDebt = Math.max(0, accrued - paid);
              if (isProStore) {
                // Mismo criterio que en pScr="main": "Mi Panel" es la capa a
                // pantalla completa de más abajo, aquí siempre se ve la Tienda.
                return <StoreFront cfg={storeCfg || {}} products={myStoreProducts.filter(p => !p.archived_at)} headerStats={myStoreStats} ratingInfo={myStoreRating} reviews={myStoreReviews} profileRealName={me} isVerified={!!user?.verified} sellerId={user?.id} isOwner onDash={() => setStoreMode("dash")} onBack={() => setPScr("main")} onSettings={() => setPScr("settings")} onChat={() => {}} onProduct={p => { setSelProd(p); setProdBackTo("profile-full"); setTab("market"); setMScr("product"); }} />;
              }
              return <FreeProfileScreen onBack={() => setPScr("main")} onSettings={() => setPScr("settings")} user={user} initialProfile={profileData} onProfileUpdate={setProfileData} onVerify={() => reloadOwn()} isVerified={!!user?.verified || verifiedUsers.includes(me)} currentPlan={currentPlanName} currentPlanId={user?.plan || "gratis"} plans={realPlans} maxProducts={myRealPlan?.max_products ?? null} onPlanChanged={(planId) => setUser(prev => prev ? { ...prev, plan: planId } : prev)} myDebt={myDebt} commissionActive={adminCfg.commissionActive !== false} userProducts={ownListings} archivedProducts={ownArchived} onProduct={p => { setSelProd(p); setProdBackTo("profile-full"); setTab("market"); setMScr("product"); }} onDeleteProduct={confirmDeleteProduct} onArchiveProduct={confirmArchiveProduct} onUnarchiveProduct={handleUnarchive} onDeleteArchivedProduct={confirmDeleteProduct} onEditProduct={(p) => setEditProd(p)} onPromoteProduct={(p) => promoteFlow(p.id)}
                autoOpenVerify={autoOpenVerify} onAutoOpenVerifyDone={() => setAutoOpenVerify(false)}
                autoOpenEdit={autoOpenEdit} onAutoOpenEditDone={() => setAutoOpenEdit(false)}
                autoOpenPlans={autoOpenPlans} onAutoOpenPlansDone={() => setAutoOpenPlans(false)} />;
            })()}
            {pScr === "messages" && <MessagesScreen user={user} chatOpen={chatOpen} onBack={() => setPScr("main")} onChat={c => { setSelChat(c); setChatOpen(true); }} />}
            {pScr === "settings" && <SettingsScreen user={user} onBack={() => setPScr("main")} onSignOut={handleSignOut} onUpdate={u => setUser(prev => ({ ...prev, ...u }))} flash={flash} appTheme={appTheme} onThemeChange={changeTheme} appTextScale={appTextScale} onTextScaleChange={changeTextScale}
              productView={productView} onProductViewChange={setProductView}
              profileData={profileData} onProfileUpdate={setProfileData}
              isVerified={!!user?.verified}
              onRequestVerification={() => { setAutoOpenVerify(true); setPScr("profile-full"); }}
              onEditProfile={() => { setAutoOpenEdit(true); setPScr("profile-full"); }}
              blockedUsers={blockedUsers} onToggleBlock={toggleBlock}
              walletOn={sections.wallet !== false}
              onOpenWallet={() => setShowWallet(true)} orders={orders.filter(o => (o.buyerId ? o.buyerId === user?.id : true))} />}
            {pScr === "orders"   && <OrdersScreen user={user} me={profileData?.name || user?.name} orders={mergedOrders} seenIds={seenOrderIds} onBack={() => setPScr("main")} flash={flash} onOpen={(o) => { markOrderSeen(o.id); setSelOrderId(o.id); setPScr("order-detail"); }} onRefresh={loadOrders} />}
            {pScr === "order-detail" && (() => { const o = mergedOrders.find(x => x.id === selOrderId); const meName = profileData?.name || user?.name; return o ? <OrderDetailScreen order={o} user={user} me={meName} onBack={() => setPScr("orders")} onChat={() => openOrderChat(o)} onViewProfile={openPublicProfile} onSellerConfirm={() => sellerConfirmOrder(o.id)} onBuyerConfirm={() => buyerConfirmReceipt(o.id)} onSellerPayment={(ok) => sellerConfirmPayment(o.id, ok)} onApproveFee={(ok) => buyerApproveFee(o.id, ok)} flash={flash} /> : <OrdersScreen user={user} me={profileData?.name || user?.name} orders={mergedOrders} seenIds={seenOrderIds} onBack={() => setPScr("main")} flash={flash} onOpen={(x) => { markOrderSeen(x.id); setSelOrderId(x.id); setPScr("order-detail"); }} />; })()}
            {/* Panel lateral del Perfil (☰): todo el menú que antes estaba apilado */}
            <ProfileMenuDrawer open={profileMenuOpen} onClose={() => setProfileMenuOpen(false)} user={user} isOwner={hasPanel}
              onMessages={openMessages} onOrders={() => setPScr("orders")} onWallet={() => setShowWallet(true)}
              onTools={() => setShowTools(true)} onCourier={() => setShowCourier(true)} onFollowing={() => setShowFollowing(true)}
              onAdmin={() => { setAdminOpenPage(null); setShowAdmin(true); }} messagesBadge={chatUnread} ordersBadge={ordersUnseen} adminBadge={courierApps.length} />
          </>}
        </>
      </div>

      {/* Nav inferior – solo móvil/tablet */}
      {!rsp.isDesktop && (
        <BottomNav tab={tab} unread={chatUnread + ordersUnseen} hidden={navHidden || hideNav} onTab={t => {
          setTab(t);
          setProfileMenuOpen(false);
          if (t === "market") setMScr("home");
          if (t === "envios") setEScr("menu");
          if (t === "perfil") setPScr("main");
        }} />
      )}
      </div>

      {/* ── Dropdown del + — renderizado en la raíz, fuera de todo overflow ── */}
      {plusMenu && (
        <>
          <div onClick={() => setPlusMenu(null)}
            style={{ position: "fixed", inset: 0, zIndex: 9000 }} />
          <div style={{
            position: "fixed",
            top: plusMenu.top,
            right: plusMenu.right,
            zIndex: 9001,
            background: appTk.isDark ? "#0e0e0e" : appTk.S,
            border: appTk.isDark ? "1px solid #2a1f00" : `1px solid ${appTk.B}`,
            borderRadius: 14,
            minWidth: 206,
            boxShadow: appTk.isDark ? `0 20px 60px rgba(0,0,0,.98), 0 0 0 1px ${G}18` : `0 12px 40px rgba(24,24,44,.18), 0 0 0 1px ${G}28`,
            overflow: "hidden",
            animation: "dropIn .2s cubic-bezier(.22,.68,0,1.2) both",
          }}>
            <div style={{ padding: "11px 14px 8px", borderBottom: appTk.isDark ? "1px solid #181400" : `1px solid ${appTk.B}` }}>
              <p style={{ fontSize: 8, fontWeight: 800, color: appTk.isDark ? "#4a3800" : appTk.T3, letterSpacing: 1, textTransform: "uppercase" }}>Crear nuevo</p>
            </div>
            <button
              onClick={() => { setPlusMenu(null); setPubOpen(true); }}
              className="p"
              style={{ width: "100%", background: "none", border: "none", padding: "11px 14px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", borderBottom: appTk.isDark ? "1px solid #141400" : `1px solid ${appTk.B}` }}
              onMouseEnter={e => e.currentTarget.style.background = appTk.isDark ? "#1a1500" : `${G}14`}
              onMouseLeave={e => e.currentTarget.style.background = "none"}>
              <div style={{ width: 29, height: 29, borderRadius: 10, background: `${G}18`, border: `1px solid ${G}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
              </div>
              <div style={{ textAlign: "left" }}>
                <p style={{ fontSize: 8, fontWeight: 700, color: appTk.isDark ? "#e8e8e8" : appTk.T1 }}>Publicar</p>
                <p style={{ fontSize: 8, color: appTk.isDark ? "#3a3a3a" : appTk.T2, marginTop: 1 }}>Vender un producto</p>
              </div>
            </button>
            <button className="p" style={{ width: "100%", background: "none", border: "none", padding: "11px 14px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
              onClick={() => { setPlusMenu(null); setTab("subastas"); setSubOpenCreate(true); }}
              onMouseEnter={e => e.currentTarget.style.background = appTk.isDark ? "#140a1a" : "#E879F914"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}>
              <div style={{ width: 29, height: 29, borderRadius: 10, background: "#E879F918", border: "1px solid #E879F930", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E879F9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
                </svg>
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <p style={{ fontSize: 8, fontWeight: 700, color: appTk.isDark ? "#e8e8e8" : appTk.T1 }}>Subastar</p>
                  </div>
                <p style={{ fontSize: 8, color: appTk.isDark ? "#3a3a3a" : appTk.T2, marginTop: 1 }}>Subasta en vivo</p>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
    {/* ⛔ CUENTA SUSPENDIDA: candado a pantalla completa. Bloquea toda interacción
        (no publicar, comprar ni chatear). Si el admin reactiva, desaparece EN VIVO. */}
    {suspended && (
      <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: "#080808", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "32px 26px" }}>
        <div style={{ fontSize: 56, marginBottom: 18 }}>⛔</div>
        <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 800, margin: 0 }}>Tu cuenta está suspendida</h1>
        <p style={{ color: "rgba(255,255,255,.55)", fontSize: 14, lineHeight: 1.5, marginTop: 12, maxWidth: 320 }}>
          No puedes publicar, comprar ni enviar mensajes por ahora. Si crees que es un error, contacta con soporte.
        </p>
        <a href="mailto:retadormarketplace@gmail.com" style={{ marginTop: 22, background: G, color: "#000", fontWeight: 800, fontSize: 14, padding: "12px 22px", borderRadius: 12, textDecoration: "none" }}>Contactar con soporte</a>
        <button onClick={handleSignOut} style={{ marginTop: 14, background: "none", border: "none", color: "rgba(255,255,255,.4)", fontSize: 13, textDecoration: "underline", cursor: "pointer" }}>Cerrar sesión</button>
      </div>
    )}
    </RCtx.Provider>
    </PlatformCfgContext.Provider>
    </AppThCtx.Provider>
  );
}

