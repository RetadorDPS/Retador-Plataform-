// ═════════════════════════════════════════════════════════════════════════════
// RETADOR MARKETPLACE — Demo Version
// Versión de demostración con datos simulados para visualización
// ═════════════════════════════════════════════════════════════════════════════
import { useState, useEffect, useRef, createContext, useContext, useCallback } from "react";
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
  getUserById, getUserName, updateUserName,
  mapProduct, loadProducts, getFeed, saveProduct, deleteProduct, getProductsBySeller, uploadImage,
  sendMessage, loadMessages, markRead, getMyConversations,
  addFavorite, removeFavorite, getFavorites,
  getLedgerEntries, createEscrow, releaseEscrow, getSystemStatus,
  CURRENCIES, CURRENCY_CODES, DEFAULT_CURRENCY, money,
  createOrder, estimateDeliveryFee,
  readRatings, aggRating, systemRating, serviceRating, serviceReviews, ratingForName, systemReviews,
  getUserOrders, updateOrderStatus, getUnreadCount, getProductById,
  getPendingCourierApplications, reviewCourierApplication,
  ORDER_FLOW, SHIP_LABELS, MODALIDAD_LABELS,
  CONTACT_PATTERNS, maskContacts, CUBA_PROVINCES,
  getUserTrustStats, trackEvent, blockUser, isBlocked, getSB, convKey,
  G, BG, S, B, RCtx, useR, useResponsive, BC,
  DARK_T, LIGHT_T, AppThCtx, useAt,
  DENSITY_MODES, DENSITY_TOKENS, DENSITY_STORAGE_KEY, DensityContext, DensityProvider, useDensity, densityCols, TEXT_STEPS,
  CATS, SUBCATS, CatalogContext, CatalogProvider, useCatalog, CatIcon,
  useCSS, Ic, Spin, Logo,
  getPageLayout, liveSlot, LiveBlock, LiveSlot,
  useScrollDir, consumeBack, pushBackHandler, shouldIgnorePop,
} from "./shared/index.js";
import WalletApp from "./screens/Wallet.jsx";
import ProductToolsApp from "./screens/ProductTools.jsx";
import { LocalDelivery, IntlShipping } from "./screens/Delivery.jsx";
import { CourierFlow } from "./screens/Courier.jsx";
import { CatModal, NotifPanel, BuyModal, AdvancedSearch, MarketHome, EditProductModal, ProductDetail, PubSheet, EnviosMenu, BottomNav } from "./screens/Marketplace.jsx";
import OmniPanel from "./screens/AdminPanel.jsx";
import { SubastasScreen } from "./screens/Auctions.jsx";
import { SettingsScreen } from "./screens/Settings.jsx";
import { ProfileMain, FreeProfileScreen } from "./screens/Profile.jsx";
import { MessagesScreen, ChatScreen } from "./screens/Messages.jsx";
import { OrderDetailScreen, OrdersScreen } from "./screens/Orders.jsx";
import { RetadorInicio, PantallaCargando } from "./screens/Inicio.jsx";
import InstallPrompt from "./pwa/InstallPrompt.jsx";
import { setThemeColor } from "./pwa/themeColor.js";


// OMNIPANEL — panel admin integrado (CSS aislado bajo .omni)

// ═════════════════════════════════════════════════════════════════════════════
// APP ROOT
// ═════════════════════════════════════════════════════════════════════════════
export default function App() {
  // Control de sesión: undefined = comprobando, null = sin sesión, objeto = logueado.
  const [sessionUser, setSessionUser] = useState(undefined);

  useEffect(() => {
    let alive = true;
    loadSessionUser().then(u => { if (alive) setSessionUser(u); });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) { setSessionUser(null); return; }
      loadSessionUser().then(u => { if (alive) setSessionUser(u); });
    });
    return () => { alive = false; sub?.subscription?.unsubscribe?.(); };
  }, []);

  // Pantalla de inicio y de carga son SIEMPRE oscuras: cuando no hay sesión,
  // las barras del sistema se ponen del mismo tono (#080808). Al entrar, AppShell
  // toma el control y las sincroniza con el tema elegido (claro/oscuro).
  useEffect(() => { if (!sessionUser) setThemeColor("#080808"); }, [sessionUser]);

  return (
    <>
      {sessionUser === undefined
        ? <PantallaCargando />
        : (
          <DensityProvider defaultMode="pequena">
            <CatalogProvider>
              {sessionUser
                ? <AppShell sessionUser={sessionUser} />
                : <RetadorInicio onGoogle={signInWithGoogle} />}
            </CatalogProvider>
          </DensityProvider>
        )}
      {/* Cartel de instalación PWA propio — montado siempre, decide solo si se muestra */}
      <InstallPrompt />
    </>
  );
}

function AppShell({ sessionUser }) {
  useCSS();
  const rsp = useResponsive();

  // Estado inicial configurado directamente - sin login, solo visual
  const [scr,       setScr]       = useState("main");
  const [tab,       setTab]       = useState("market");
  const [user,      setUser]      = useState(sessionUser); // usuario REAL logueado (Supabase)
  const [toast,     setToast]     = useState(null);
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
  const askConfirm = (msg, onYes) => setConfirmCfg({ msg, onYes });
  const updateProduct = async (id, changes) => {
    const upd = {};
    if (changes.title       !== undefined) upd.title       = changes.title;
    if (changes.price       !== undefined) upd.price       = Number(changes.price) || 0;
    if (changes.description !== undefined) upd.description = changes.description;
    if (changes.cat         !== undefined) upd.cat         = changes.cat || null;
    if (changes.subcat      !== undefined) upd.subcat      = changes.subcat || null;
    if (changes.images      !== undefined) upd.images      = Array.isArray(changes.images) ? changes.images : [];
    const { data, error } = await supabase.from("products").update(upd).eq("id", id).select().single();
    if (error) { flash("⚠️ " + (error.message || "No se pudo editar")); return; }
    setProducts(prev => prev.map(p => p.id === id ? mapProduct(data) : p));
    flash("✏️ Producto actualizado");
  };
  const [selChat,   setSelChat]   = useState(null);
  const [selSeller, setSelSeller] = useState(null);
  // Perfil PÚBLICO flotante: se abre al tocar el nombre/avatar de cualquiera desde
  // el pool del mensajero, el detalle del pedido, el chat o el detalle de producto.
  // Solo muestra reputación pública (nombre, foto, verificado, productos): nunca el
  // historial privado ni los números de negocio de esa persona.
  const [viewProfileId, setViewProfileId] = useState(null);
  const openPublicProfile = (id) => { if (id) setViewProfileId(id); };
  // El perfil flotante es una capa: el botón ATRÁS del teléfono la cierra (vuelve
  // al chat/pantalla de abajo), nunca cierra la app. Una capa = un atrás.
  useEffect(() => {
    if (!viewProfileId) return;
    return pushBackHandler(() => setViewProfileId(null));
  }, [viewProfileId]);

  // Overlays
  const [showCats,   setShowCats]   = useState(false);
  const [pubOpen,    setPubOpen]    = useState(false);
  const [showNotif,  setShowNotif]  = useState(false);
  const [chatOpen,   setChatOpen]   = useState(false);
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
  // Solicitudes REALES de mensajero (courier_applications) para el panel admin.
  const [courierApps, setCourierApps] = useState([]);
  const reloadCourierApps = useCallback(() => {
    getPendingCourierApplications().then(setCourierApps).catch(() => {});
  }, []);
  useEffect(() => { if (showAdmin && user?.role === "admin") reloadCourierApps(); }, [showAdmin, user?.role, reloadCourierApps]);
  const [showWallet, setShowWallet] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [toolApp, setToolApp] = useState(false);
  const [showCourier, setShowCourier] = useState(false);
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
  // El mensajero avanza su etapa. El backend SOLO acepta "recogido" y "entregado"
  // ("recogido" auto-avanza a en_ruta; "entregado" cierra el pedido). RPC segura.
  const courierStage = async (orderId, stage) => {
    const p_stage = (stage === "recogido") ? "recogido" : "entregado";
    const { error } = await supabase.rpc("courier_advance_stage", { p_order_id: orderId, p_stage });
    if (error) { console.error("courier_advance_stage:", error.message); flash("⚠️ No se pudo avanzar: " + error.message); return; }
    await loadOrders();
    flash(p_stage === "recogido" ? "✅ Producto recogido — en ruta" : "✅ Entregado — pedido cerrado");
  };
  // Panel de administración: SOLO para cuentas con rol real de admin en el backend
  // (el dueño ya tiene role='admin' en profiles). Ya no está abierto para todos.
  const isOwner = user?.role === "admin";
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
    };
    try { const r = localStorage.getItem("retador_admincfg"); if (r) return { ...defaults, ...JSON.parse(r) }; } catch {}
    return defaults;
  });
  useEffect(() => { try { localStorage.setItem("retador_admincfg", JSON.stringify(adminCfg)); } catch {} }, [adminCfg]);
  const [buyModal,   setBuyModal]   = useState(null);
  const [plusMenu,   setPlusMenu]   = useState(null); // { top, right } posición del dropdown
  const [subOpenCreate, setSubOpenCreate] = useState(false); // abre CreateAuction directo
  const [profileData, setProfileData] = useState({
    // Foto real del usuario (Google/Supabase) si la hay; si no, null → inicial.
    // Ya NO se usa emoji como avatar por defecto.
    avatar: sessionUser?.avatar ? { type: "image", value: sessionUser.avatar } : null,
    name: sessionUser?.name || "Usuario",
    username: (sessionUser?.email ? sessionUser.email.split("@")[0] : (sessionUser?.name || "usuario")).toLowerCase().replace(/[^a-z0-9._]/g, ""),
    email: sessionUser?.email || "",
    rating: 0,
    sales: 0,
  });

  // Productos y búsqueda - Productos ya cargados
  const [products,  setProducts]  = useState([]); // productos REALES del backend
  const [loading,   setLoading]   = useState(true);
  // Cargar productos reales al iniciar (sin login: política pública active+approved).
  useEffect(() => {
    let alive = true;
    setLoading(true);
    loadProducts()
      .then(list => { if (alive) setProducts(list); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);
  // Cargar TASAS DE CAMBIO reales del backend (lectura pública, sin login) y
  // volcarlas en la config (usdToCup / eurToCup) para que toda la app las use.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("exchange_rates")
          .select("from_currency,to_currency,rate");
        if (error) throw error;
        if (!alive || !data) return;
        const find = (f, t) => data.find(r => r.from_currency === f && r.to_currency === t)?.rate;
        const usdToCup = Number(find("USD", "CUP"));
        const eurToCup = Number(find("EUR", "CUP"));
        if (usdToCup > 0 || eurToCup > 0) {
          setAdminCfg(prev => ({
            ...prev,
            fx: {
              usdToCup: usdToCup > 0 ? usdToCup : (prev.fx?.usdToCup ?? 400),
              eurToCup: eurToCup > 0 ? eurToCup : (prev.fx?.eurToCup ?? 430),
            },
          }));
        }
      } catch (err) {
        console.error("Tasas de cambio:", err?.message || err);
      }
    })();
    return () => { alive = false; };
  }, []);
  const [search,    setSearch]    = useState("");
  const [filter,    setFilter]    = useState("TODOS");
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
  useEffect(() => { try { localStorage.setItem("retador_favs", JSON.stringify([...favorites])); } catch {} }, [favorites]);

  // App-level appearance — persiste en localStorage
  const [appTheme, setAppTheme] = useState(() => {
    try { return localStorage.getItem("retador_theme") || "auto"; } catch { return "auto"; }
  });
  const [appTextScale, setAppTextScale] = useState(() => {
    try { const v = localStorage.getItem("retador_txt_scale"); return v ? parseFloat(v) : 1; } catch { return 1; }
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
    setAppTheme(t);
    try { localStorage.setItem("retador_theme", t); } catch {}
    if (effOf(t) !== before) {
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
  
  // Banners state
  const [banners, setBanners] = useState([
    // { id: 1, title: "Banner ejemplo", image: "url", active: false }
  ]);

  const flash = (msg, dur = 3200) => { setToast(msg); setTimeout(() => setToast(null), dur); };
  const saveCfg = nc => { setCfg(nc); };
  const requireAuth = action => { action(); return true; }; // Siempre autorizado - solo visual
  const refreshUser = () => {}; // No-op en versión visual

  const handleSignOut = () => {
    // En versión visual, solo resetea a la pantalla principal
    flash("👋 Sesión cerrada (demo)");
  };

  const handlePublish = async d => {
    if (!user?.id) { flash("⚠️ Debes iniciar sesión para publicar"); return; }
    const row = {
      seller_id: user.id,
      title: d.title,
      description: d.desc || null,
      price: Number(d.price) || 0,
      orig_price: (d.orig_price ?? d.orig) ? Number(d.orig_price ?? d.orig) : null,
      currency: d.currency || "USD",
      cat: d.cat || null,
      subcat: d.subcat || null,
      images: Array.isArray(d.images) ? d.images : [],
      badge: d.badge || null,
      ship_modes: d.shipModes || { local: true, intl: false, persona: false },
      ship_price: Number(d.shippingPrice) || 0,
      location: d.location || null,
      // Dirección/teléfono de recogida (los usa el mensajero al aceptar la entrega).
      pickup_address: d.pickupAddress || null,
      pickup_phone: d.pickupPhone || null,
    };
    const { data, error } = await supabase.from("products").insert(row).select().single();
    if (error) { flash("⚠️ " + (error.message || "No se pudo publicar")); return; }
    setProducts(prev => [mapProduct(data), ...prev]);
    flash("✅ Producto publicado — visible para todos");
  };

  const handleDelete = async id => {
    const { error } = await supabase.from("products").update({ status: "deleted" }).eq("id", id);
    if (error) { flash("⚠️ " + (error.message || "No se pudo eliminar")); return; }
    setProducts(prev => prev.filter(p => p.id !== id));
    flash("🗑️ Eliminado");
  };

  // Abre el chat CONECTADO (realtime) con la otra persona. La identidad SIEMPRE es
  // el uuid real del usuario: así "mensaje" con la misma persona abre SIEMPRE la
  // misma conversación (nunca duplica ni cae a "Vendedor"). El nombre/foto se
  // derivan del id dentro del chat.
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  // context opcional {type:'product'|'order', id, title, image}: el chat muestra
  // la franja "estás consultando sobre esto" y el primer mensaje lleva la referencia.
  const openChat = (otherId, otherName, context = null) => {
    const id = typeof otherId === "string" && UUID_RE.test(otherId) ? otherId : null;
    if (!id) { flash("No se pudo abrir el chat: usuario no identificado"); return; }
    setSelChat({ otherId: id, otherName, context });
    setChatOpen(true);
  };
  // Abrir el DETALLE de un pedido/producto desde una tarjeta del chat.
  const openOrderFromChat = (orderId) => {
    if (!orderId) return;
    setChatOpen(false); setSelOrderId(orderId); setTab("perfil"); setPScr("order-detail");
  };
  const openProductFromChat = (productId) => {
    if (!productId) return;
    const go = (p) => { setChatOpen(false); setSelProd(p); setTab("market"); setMScr("product"); };
    const local = products.find(x => x.id === productId);
    if (local) go(local);
    else getProductById(productId).then(p => { if (p) go(p); else flash("Ese producto ya no está disponible"); }).catch(() => {});
  };
  const openMessages = () => { setSelChat(null); setChatOpen(false); setTab("perfil"); setPScr("messages"); };

  // Chat libre: cualquiera puede escribir desde cualquier lugar. Capturamos la información igual.
  const [orders, setOrders] = useState(() => { try { return JSON.parse(localStorage.getItem('retador_orders') || '[]'); } catch { return []; } });
  useEffect(() => { try { localStorage.setItem('retador_orders', JSON.stringify(orders)); } catch {} }, [orders]);
  const [verifications, setVerifications] = useState(() => { try { return JSON.parse(localStorage.getItem('retador_verifs') || '[]'); } catch { return []; } });
  useEffect(() => { try { localStorage.setItem('retador_verifs', JSON.stringify(verifications)); } catch {} }, [verifications]);
  const addVerification = (v) => setVerifications(prev => [{ id: 'ver_' + Date.now(), state: 'pending', at: Date.now(), ...v }, ...prev.filter(x => x.userName !== v.userName || x.state !== 'pending')]);
  const [payments, setPayments] = useState(() => { try { return JSON.parse(localStorage.getItem('retador_payments') || '[]'); } catch { return []; } });
  useEffect(() => { try { localStorage.setItem('retador_payments', JSON.stringify(payments)); } catch {} }, [payments]);
  const [verifiedUsers, setVerifiedUsers] = useState(() => { try { return JSON.parse(localStorage.getItem('retador_verified') || '[]'); } catch { return []; } });
  const [accountPassword, setAccountPassword] = useState(() => { try { return localStorage.getItem('retador_password') || ''; } catch { return ''; } });
  useEffect(() => { try { if (accountPassword) localStorage.setItem('retador_password', accountPassword); } catch {} }, [accountPassword]);
  // Equipo y permisos: miembros con secciones delegadas
  const [teamMembers, setTeamMembers] = useState(() => { try { return JSON.parse(localStorage.getItem('retador_team') || '[]'); } catch { return []; } });
  useEffect(() => { try { localStorage.setItem('retador_team', JSON.stringify(teamMembers)); } catch {} }, [teamMembers]);
  useEffect(() => { try { localStorage.setItem('retador_verified', JSON.stringify(verifiedUsers)); } catch {} }, [verifiedUsers]);
  const [userPlans, setUserPlans] = useState(() => { try { return JSON.parse(localStorage.getItem('retador_userplans') || '{}'); } catch { return {}; } });
  useEffect(() => { try { localStorage.setItem('retador_userplans', JSON.stringify(userPlans)); } catch {} }, [userPlans]);
  const [reports, setReports] = useState(() => { try { return JSON.parse(localStorage.getItem('retador_reports') || '[]'); } catch { return []; } });
  useEffect(() => { try { localStorage.setItem('retador_reports', JSON.stringify(reports)); } catch {} }, [reports]);
  const addReport = (rep) => setReports(prev => [{ id: 'rep_' + Date.now(), state: 'pending', at: Date.now(), ...rep }, ...prev]);
  const [planRequests, setPlanRequests] = useState(() => { try { return JSON.parse(localStorage.getItem('retador_planreq') || '[]'); } catch { return []; } });
  useEffect(() => { try { localStorage.setItem('retador_planreq', JSON.stringify(planRequests)); } catch {} }, [planRequests]);
  const addPlanRequest = (req) => setPlanRequests(prev => [{ id: 'plq_' + Date.now(), state: 'pending', at: Date.now(), ...req }, ...prev]);
  // Solicitudes de promoción (destacar subasta / acceso VIP) que el dueño aprueba y cobra manual
  const [promoRequests, setPromoRequests] = useState(() => { try { return JSON.parse(localStorage.getItem('retador_promoreq') || '[]'); } catch { return []; } });
  useEffect(() => { try { localStorage.setItem('retador_promoreq', JSON.stringify(promoRequests)); } catch {} }, [promoRequests]);
  const addPromoRequest = (req) => setPromoRequests(prev => [{ id: 'prm_' + Date.now(), state: 'pending', at: Date.now(), ...req }, ...prev]);
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
    plusMenu, showCourier, toolApp, showTools, showAdmin, showWallet, chatOpen, showNotif, showCats, pubOpen, buyModal, confirmCfg, editProd };
  const navSig = [tab, mScr, pScr, eScr, (selProd && selProd.id) || selProd || 0, selSeller || 0, selOrderId || 0, prodBackTo || 0,
    !!plusMenu, !!showCourier, !!toolApp, !!showTools, !!showAdmin, !!showWallet, !!chatOpen, !!showNotif, !!showCats, !!pubOpen, !!buyModal, !!confirmCfg, !!editProd].join("|");

  const stackRef = useRef([]);      // [{sig, snap}] una entrada por cada paso hacia adelante
  const lastRef = useRef(null);     // {sig, snap} del estado actual
  const ignorePopRef = useRef(0);   // popstate que debemos ignorar (los que provocamos nosotros)
  const restoringRef = useRef(false);

  const applySnap = (sn) => {
    setTab(sn.tab); setMScr(sn.mScr); setPScr(sn.pScr); setEScr(sn.eScr);
    setSelProd(sn.selProd); setSelSeller(sn.selSeller); setSelOrderId(sn.selOrderId); setProdBackTo(sn.prodBackTo);
    setPlusMenu(sn.plusMenu); setShowCourier(sn.showCourier); setToolApp(sn.toolApp); setShowTools(sn.showTools);
    setShowAdmin(sn.showAdmin); setShowWallet(sn.showWallet); setChatOpen(sn.chatOpen); setShowNotif(sn.showNotif);
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
  const myNotifs = notifs.filter(n => n.to != null && myIds.includes(n.to));
  const unreadNotif = myNotifs.filter(n => !n.read).length;
  // Barra inferior OCULTA en pantallas de "detalle" (a las que se ENTRA y se sale
  // con "atrás"): detalle de producto, perfil del vendedor, subastas, y todo el
  // tab de perfil salvo su raíz (mensajes, chat, pedidos, ajustes, perfil completo).
  // VISIBLE en las raíces de pestaña: feed de Tienda, Búsqueda, Envíos, Perfil-main.
  const hideNav = tab === "subastas"
    || (tab === "market" && (mScr === "product" || mScr === "sellerProfile"))
    || (tab === "perfil" && pScr !== "main");
  const markNotifRead = id => setNotifs(prev => prev.map(n => id == null ? { ...n, read: true } : (n.id === id ? { ...n, read: true } : n)));

  // ── PEDIDOS REALES (Compras/Ventas) — el BACKEND es la ÚNICA fuente ─────────
  // loadOrders recarga desde Supabase y reemplaza el estado local, para que las
  // dos partes (comprador/vendedor/mensajero) vean SIEMPRE lo mismo, sin duplicar.
  const loadOrders = useCallback(async () => {
    if (!user?.id) return;
    try { const real = await getUserOrders(user.id); setOrders(real || []); } catch (e) {}
  }, [user?.id]);
  useEffect(() => { loadOrders(); }, [loadOrders]);
  useEffect(() => { if (pScr === "orders" || pScr === "order-detail") loadOrders(); }, [pScr, loadOrders]);

  // ── CANAL REALTIME GLOBAL (UNO solo por usuario: rt-global-<uid>) ────────────
  // · messages → refresca el contador de mensajes sin leer (RPC oficial).
  // · orders   → recarga los pedidos EN VIVO: el vendedor ve llegar la venta al
  //   instante (badge de Ventas incluido) y el comprador ve avanzar su pedido
  //   (confirmado→asignado→recogido→en ruta→entregado) sin recargar.
  // Se limpia al cerrar sesión o cambiar de usuario (removeChannel).
  useEffect(() => {
    if (!user?.id) return;
    const ch = supabase.channel(`rt-global-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => reloadChatUnread())
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => loadOrders())
      .subscribe();
    return () => { try { supabase.removeChannel(ch); } catch (e) {} };
  }, [user?.id, reloadChatUnread, loadOrders]);

  const roleOf = (o) => (((o.buyerId ?? o.buyer_id) === user?.id) ? "compra" : "venta");
  const mergedOrders = orders;

  // Marcas de "visto" por pestaña (para los avisos de nuevo).
  const [ordersSeen, setOrdersSeen] = useState(() => { try { return JSON.parse(localStorage.getItem("retador_orders_seen") || "{}"); } catch { return {}; } });
  useEffect(() => { try { localStorage.setItem("retador_orders_seen", JSON.stringify(ordersSeen)); } catch (e) {} }, [ordersSeen]);
  const markOrdersSeen = (tabKey) => setOrdersSeen(prev => ({ ...prev, [tabKey]: Date.now() }));
  const comprasUnseen = mergedOrders.filter(o => roleOf(o) === "compra" && (o.createdAt || 0) > (ordersSeen.compras || 0)).length;
  const ventasUnseen  = mergedOrders.filter(o => roleOf(o) === "venta"  && (o.createdAt || 0) > (ordersSeen.ventas  || 0)).length;
  const ordersUnseen  = comprasUnseen + ventasUnseen;

  // Notifica cada VENTA nueva (más reciente que lastSeenVentas) una sola vez,
  // usando el sistema de avisos local ya existente (pushNotif).
  const notifiedSalesRef = useRef(new Set());
  useEffect(() => {
    const seenV = ordersSeen.ventas || 0;
    mergedOrders.forEach(o => {
      if (roleOf(o) !== "venta" || (o.createdAt || 0) <= seenV) return;
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
    if (o && o.courierName) pushNotif(o.courierName, ok ? "El vendedor confirmó el pago. Entrega cerrada ✅" : "El vendedor reportó que no hubo pago. Devuelve el producto.", orderId);
    flash(ok ? "✅ Pago confirmado — entrega cerrada" : "⚠️ Marcado como sin pago");
  };
  const requestChat = (sellerId, sellerName, context) => openChat(sellerId, sellerName, context); // sin bloqueo

  // Usuarios bloqueados (persistentes) — los usa Ajustes. El chat en sí ya va por
  // el backend (conversations/messages con realtime); no hay chat local.
  const [blockedUsers, setBlockedUsers] = useState(() => { try { return JSON.parse(localStorage.getItem("retador_blocked") || "[]"); } catch { return []; } });
  useEffect(() => { try { localStorage.setItem("retador_blocked", JSON.stringify(blockedUsers)); } catch {} }, [blockedUsers]);
  const toggleBlock = (key, name) => setBlockedUsers(prev => prev.some(b => b.key === String(key)) ? prev.filter(b => b.key !== String(key)) : [...prev, { key: String(key), name: name || "Usuario" }]);

  const toggleFav = (productId) => {
    const isFav = favorites.has(productId);
    const next = new Set(favorites);
    if (isFav) {
      next.delete(productId);
      flash("💔 Eliminado de favoritos");
    } else {
      next.add(productId);
      flash("❤️ Añadido a favoritos");
    }
    setFavorites(next);
  };

  const handleBuy = (product) => {
    setBuyModal(product);
  };

  const marketVisible = products.filter(p => {
    const q = search.toLowerCase();
    const ms = !q || p.title?.toLowerCase().includes(q) || p.cat?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q);
    const mf = filter === "TODOS"
      || (filter === "OFERTAS"      && p.orig_price)
      || (filter === "NUEVO"        && p.badge === "NUEVO")
      || (filter === "RECOMENDADO"  && p.badge === "RECOMENDADO")
      || (filter === "FAVORITOS"    && favorites.has(p.id));
    return ms && mf;
  });

  return (
    <AppThCtx.Provider value={appTk}>
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
        <div style={{ position: "fixed", bottom: rsp.isDesktop ? 30 : 90, left: "50%", transform: "translateX(-50%)", background: effectiveTheme === "dark" ? "#191919" : "#ffffff", color: effectiveTheme === "dark" ? "#fff" : "#161616", border: `1px solid ${effectiveTheme === "dark" ? B : "rgba(0,0,0,.08)"}`, borderRadius: 50, padding: "10px 20px", fontSize: 11, fontWeight: 600, zIndex: 800, whiteSpace: "nowrap", boxShadow: effectiveTheme === "dark" ? "0 8px 28px rgba(0,0,0,.9)" : "0 8px 28px rgba(0,0,0,.18)", animation: "tst .26s ease both", maxWidth: "90vw" }}>
          {toast}
        </div>
      )}

      {editProd && <EditProductModal product={editProd} onClose={() => setEditProd(null)} onSave={(changes) => { updateProduct(editProd.id, changes); setEditProd(null); }} flash={flash} />}
      {confirmCfg && (
        <div onClick={() => setConfirmCfg(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 5300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: effectiveTheme === "dark" ? "#161618" : "#fff", borderRadius: 18, padding: "22px 20px", maxWidth: 340, width: "100%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,.4)" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: effectiveTheme === "dark" ? "#f0f0f2" : "#1a1a1a", marginBottom: 18, lineHeight: 1.4 }}>{confirmCfg.msg}</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmCfg(null)} style={{ flex: 1, height: 44, borderRadius: 11, border: `1px solid ${effectiveTheme === "dark" ? "#333" : "#e0e0e0"}`, background: "transparent", color: effectiveTheme === "dark" ? "#f0f0f2" : "#1a1a1a", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Cancelar</button>
              <button onClick={() => { confirmCfg.onYes && confirmCfg.onYes(); setConfirmCfg(null); }} style={{ flex: 1, height: 44, borderRadius: 11, border: "none", background: "#ef4444", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Overlays */}
      {showCats   && <CatModal onClose={() => setShowCats(false)} onSelect={cat => { setActiveCat(cat); setShowCats(false); }} active={activeCat} />}
      {pubOpen    && <PubSheet onClose={() => setPubOpen(false)} onPublish={async d => { setPubOpen(false); await handlePublish(d); }} user={user} flash={flash} />}
      {showNotif  && <NotifPanel onClose={() => { markNotifRead(null); setShowNotif(false); }} notifs={myNotifs} onRead={markNotifRead} onOpenOrder={(oid) => { setShowNotif(false); markNotifRead(null); setSelOrderId(oid); setTab("perfil"); setPScr("order-detail"); }} />}
      {/* Chat: capa OPACA a pantalla completa (inset 0 cubre TODO el viewport,
          estándar) — nada del producto/pantalla de atrás puede asomar. */}
      {chatOpen && selChat && (
        <div style={{ position: "fixed", inset: 0, zIndex: 5100, background: effectiveTheme === "dark" ? "#080808" : "#ffffff", display: "flex", flexDirection: "column", overflow: "hidden", paddingTop: "env(safe-area-inset-top, 0px)" }}>
          <ChatScreen key={selChat.id || selChat.otherId} chat={selChat} user={user} onBack={() => setChatOpen(false)} flash={flash} onViewProfile={openPublicProfile} orders={mergedOrders} onOpenOrder={openOrderFromChat} onOpenProduct={openProductFromChat} />
        </div>
      )}
      {showWallet && (() => {
        const meName = profileData?.name || user?.name || "Usuario";
        const meUser = { name: meName, username: "@" + meName.toLowerCase().replace(/[^a-z0-9]/g, ""), omegaId: "RT-" + String(Math.abs([...meName].reduce((a, c) => a + c.charCodeAt(0), 0)) * 7).padStart(6, "0"), phone: profileData?.phone || "—", verifiedSince: verifiedUsers.includes(meName) ? "Cuenta verificada" : "Sin verificar" };
        // Contactos = otros usuarios conocidos (vendedores de productos)
        const seen = new Set([meName]);
        const contacts = [];
        products.forEach(p => { const n = p.seller_name; if (n && !seen.has(n)) { seen.add(n); contacts.push({ id: "u_" + n, name: n, username: "@" + String(n).toLowerCase().replace(/[^a-z0-9]/g, "") }); } });
        // Órdenes por pagar = las mías aún no pagadas por billetera
        const payable = orders.filter(o => !o.paidViaWallet).map(o => ({ id: o.id, vendor: o.sellerName || "Vendedor", item: o.title || "Pedido", amount: (Number(o.amount) || 0) + (Number(o.shipPrice) || 0), currency: o.currency || "CUP" }));
        // Tasas desde el panel de admin (Economía → FX): única fuente de verdad
        const fx = adminCfg.fx || { usdToCup: 400, eurToCup: 430 };
        const usdCup = Number(fx.usdToCup) || 400, eurCup = Number(fx.eurToCup) || 430;
        const walletRates = { base: "USD", updatedAt: Date.now(), rates: { USD: 1, EUR: +(usdCup / eurCup).toFixed(4), CUP: usdCup } };
        return <div style={{ position: "fixed", inset: 0, zIndex: 4000, overflow: "hidden", background: effectiveTheme === "dark" ? "#0a0a0a" : "#f1f5f9" }}>
          <WalletApp user={meUser} contacts={contacts} orders={payable} rates={walletRates} dark={effectiveTheme === "dark"} onClose={() => setShowWallet(false)}
            onOrderPaid={(orderId) => setOrders(prev => prev.map(o => o.id === orderId ? { ...o, paidViaWallet: true, status: o.status === "pendiente" || o.stepIdx === 0 ? (o.flow?.[1]?.key || o.status) : o.status } : o))} />
        </div>;
      })()}
      {showTools && (() => {
        const meName = profileData?.name || user?.name || "Usuario";
        const myPlan = (userPlans || {})[meName];
        const isPremium = isOwner || (myPlan && /prem|pro|vip|plus/i.test(String(myPlan)));
        const dark = effectiveTheme === "dark";
        const onPublish = (prod) => {
          if (!prod) return;
          const parts = String(prod.category || "").split("/").map(s => s.trim());
          const catName = parts[0] || "", subName = parts[1] || "";
          let realCats = []; try { realCats = JSON.parse(localStorage.getItem("retador_cats") || "[]"); } catch {}
          const found = realCats.find(c => (c.name || "").toLowerCase() === catName.toLowerCase());
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
            <ProductToolsApp onClose={() => setToolApp(false)} onPublish={onPublish} canUse={isPremium} />
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
        return <CourierFlow myRecord={myRecord} user={user} flash={flash} dark={effectiveTheme === "dark"} onClose={() => setShowCourier(false)}
          meName={meName} meId={user?.id} orders={orders} localBase={adminCfg.localBase || 150}
          onAccept={(id, fee) => { acceptDelivery(id, fee); }}
          onStage={(id, st) => { courierStage(id, st); }}
          onViewProfile={openPublicProfile}
          onChat={openChat}
          onCancel={(id) => { cancelDelivery(id); flash("Entrega liberada · disponible de nuevo"); }}
          onReport={(rep) => { addReport(rep); flash("Reporte enviado al equipo de RETADOR"); }} />;
      })()}
      {viewProfileId && (
        <div style={{ position: "fixed", inset: 0, zIndex: 5200, background: effectiveTheme === "dark" ? "#080808" : "#ffffff", display: "flex", flexDirection: "column", overflow: "hidden", paddingTop: "env(safe-area-inset-top, 0px)" }}>
          <FreeProfileScreen
            onBack={() => setViewProfileId(null)}
            user={user}
            sellerId={viewProfileId}
            initialProfile={{}}
            onProfileUpdate={() => {}}
            isOwner={false}
            onChat={(id, name) => { setViewProfileId(null); requestChat(id, name); }}
            isVerified={verifiedUsers.includes(viewProfileId)}
            onReport={(p) => addReport({ targetName: p.targetName, reason: p.reason, detail: p.detail, reporterName: user?.name || "Usuario" })}
            userProducts={products.filter(p => p.seller_id === viewProfileId)}
            onProduct={p => { setViewProfileId(null); setSelProd(p); setTab("market"); setMScr("product"); }}
          />
        </div>
      )}
      {showAdmin  && <OmniPanel onClose={() => setShowAdmin(false)} theme={appTk} zoom={densZoom} data={{
        orders, cfg: adminCfg,
        onCfg: (patch) => setAdminCfg(c => ({ ...c, ...patch })),
        onOrderAction: (id, action) => setOrders(prev => prev.map(o => o.id === id ? { ...o, status: action === 'cancel' ? 'cancelado' : action === 'approve' ? 'confirmado' : o.status, flagged: action === 'flag' ? true : (action === 'cancel' || action === 'approve' ? false : o.flagged) } : o)),
        onDisputeAction: (id, action) => setOrders(prev => prev.map(o => o.id === id ? { ...o, status: action === 'resolve' ? 'confirmado' : action === 'freeze' ? 'congelado' : action === 'escalate' ? 'escalado' : o.status, disputeState: action } : o)),
        reports, onReportAction: (id, action) => setReports(prev => prev.map(r => r.id === id ? { ...r, state: action } : r)),
        planRequests, onPlanAction: (id, action) => { setPlanRequests(prev => prev.map(r => { if (r.id === id) { if (action === 'approved') setUserPlans(p => ({ ...p, [r.userName]: r.plan })); return { ...r, state: action }; } return r; })); },
        promoRequests, onPromoAction: (id, action) => setPromoRequests(prev => prev.map(r => r.id === id ? { ...r, state: action } : r)),
        teamMembers, onSaveTeam: setTeamMembers,
        // Solicitudes REALES de mensajero: aprobar/rechazar vía la función oficial
        // review_courier_application (al aprobar pone role='courier' y notifica).
        couriers: courierApps.map(a => ({ id: a.id, status: a.status || "pending", nombre: a.name, userName: a.name, telefono: a.phone, zona: a.zone, vehiculo: a.vehicle, createdAt: a.created_at })),
        onCourierAction: async (id, status) => {
          try {
            await reviewCourierApplication(id, status === "approved");
            flash(status === "approved" ? "✅ Mensajero aprobado" : "Solicitud rechazada");
          } catch (e) { flash("⚠️ No se pudo revisar: " + (e?.message || "error")); }
          reloadCourierApps();
        },
        knownUsers: [...new Set(products.map(pr => pr.seller_name).filter(Boolean))].filter(n => n !== (profileData?.name || user?.name)),
        verifications, onVerifyAction: (id, action) => { setVerifications(prev => prev.map(v => { if (v.id === id) { if (action === 'approved' && v.userName) setVerifiedUsers(u => u.includes(v.userName) ? u : [...u, v.userName]); return { ...v, state: action }; } return v; })); },
        payments, onMarkPaid: (sellerName, amount) => setPayments(prev => [{ id: 'pay_' + Date.now(), sellerName, amount, at: Date.now() }, ...prev]),
        plans: adminCfg.plans, verifiedUsers, userPlans,
      }} />}
      {buyModal   && <BuyModal product={buyModal} user={user} onClose={() => setBuyModal(null)} flash={flash} onSuccess={(order) => { setBuyModal(null); const eo = addOrder(order); if (eo) { setSelOrderId(eo.id); setTab("perfil"); setPScr("order-detail"); } }} />}

      {/* Pantallas */}
      {/* El contenido usa TODO el alto: la barra inferior flota encima (translúcida
          con blur), así al esconderse no queda ninguna franja vacía debajo. */}
      <div onScrollCapture={handleNavScroll} style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <>
          {tab === "market" && <>
            {mScr === "home" && (
              <MarketHome
                hidden={navHidden}
                loading={loading} products={marketVisible} filter={filter} setFilter={setFilter}
                search={search} setSearch={setSearch} activeCat={activeCat} setActiveCat={cat => { setActiveCat(cat); }}
                onCats={() => setShowCats(true)}
                onProduct={p => { setSelProd(p); setMScr("product"); }}
                user={user} favorites={favorites} onFav={toggleFav}
                notifCount={unreadNotif} onNotif={() => setShowNotif(true)}
                onPublish={() => setPubOpen(true)}
                onPlusMenu={rect => setPlusMenu(rect)}
                onOpenChats={openMessages}
                banners={banners}
                onNav={navTo}
              />
            )}
            {mScr === "product" && selProd && (
              <ProductDetail
                product={selProd} onBack={() => {
                  if (prodBackTo === "profile-full") { setProdBackTo(null); setMScr("home"); setTab("perfil"); setPScr("profile-full"); }
                  else if (prodBackTo === "sellerProfile") { setProdBackTo(null); setMScr("sellerProfile"); }
                  else setMScr("home");
                }}
                onDelivery={() => { setTab("envios"); setEScr("local"); }}
                onChat={requestChat} onViewProfile={id => { setSelSeller(id); setMScr("sellerProfile"); }}
                onBuy={handleBuy} onFav={toggleFav} isFav={favorites.has(selProd.id)} canChat={hasOrderWith(selProd.seller_id)}
                onDelete={(selProd.seller_id === user?.id) ? (() => askConfirm("¿Eliminar este producto? No se puede deshacer.", () => { handleDelete(selProd.id); if (prodBackTo === "profile-full") { setProdBackTo(null); setMScr("home"); setTab("perfil"); setPScr("profile-full"); } else setMScr("home"); })) : null}
                onEdit={(selProd.seller_id === user?.id) ? (() => setEditProd(selProd)) : null}
                flash={flash} requireAuth={requireAuth} user={user}
              />
            )}
            {mScr === "sellerProfile" && selSeller && (
              <FreeProfileScreen
                onBack={() => setMScr(selProd ? "product" : "home")}
                user={user}
                sellerId={selSeller}
                initialProfile={{}}
                onProfileUpdate={() => {}}
                isOwner={false}
                onChat={requestChat}
                isVerified={verifiedUsers.includes(selSeller)}
                onReport={(p) => addReport({ targetName: p.targetName, reason: p.reason, detail: p.detail, reporterName: user?.name || "Usuario" })}
                userProducts={products.filter(p => p.seller_name === selSeller || p.seller_id === selSeller)}
                onProduct={p => { setSelProd(p); setProdBackTo("sellerProfile"); setMScr("product"); }}
              />
            )}
          </>}

          {tab === "search" && (
            <AdvancedSearch
              products={products}
              onProduct={p => {
                setSelProd(p);
                setTab("market");
                setMScr("product");
              }}
              favorites={favorites}
              onFav={toggleFav}
              onNav={navTo}
            />
          )}

          {tab === "envios" && <>
            {eScr === "menu"  && <EnviosMenu onLocal={() => setEScr("local")} onIntl={() => setEScr("intl")} user={user} requireAuth={requireAuth} />}
            {eScr === "local" && <LocalDelivery onBack={() => setEScr("menu")} flash={flash} cfg={adminCfg} user={user} onNav={navTo} onChat={openMessages} />}
            {eScr === "intl"  && <IntlShipping  onBack={() => setEScr("menu")} flash={flash} cfg={cfg} onNav={navTo} />}
          </>}

          {tab === "subastas" && (
            <SubastasScreen forceCreate={subOpenCreate} onForceCreateDone={() => setSubOpenCreate(false)} onNav={navTo} onPromote={addPromoRequest} sellerName={profileData?.name || user?.name || "Usuario"} />
          )}

          {tab === "perfil" && <>
            {pScr === "main"         && <ProfileMain user={user} onMessages={openMessages} onSettings={() => setPScr("settings")} onOrders={() => setPScr("orders")} onViewProfile={() => setPScr("profile-full")} onAdmin={() => setShowAdmin(true)} onWallet={() => setShowWallet(true)} onTools={() => setShowTools(true)} onCourier={() => setShowCourier(true)} isOwner={isOwner} profileData={profileData} ordersBadge={ordersUnseen} messagesBadge={chatUnread} />}
            {pScr === "profile-full" && (() => {
              const me = profileData?.name || user?.name;
              const accrued = orders.filter(o => (o.sellerName || o.sellerId) === me).reduce((a, o) => a + (o.amount || 0) * ((o.commissionPct ?? adminCfg.commissionPct ?? 10) / 100), 0);
              const paid = payments.filter(p => p.sellerName === me).reduce((a, p) => a + (p.amount || 0), 0);
              const myDebt = Math.max(0, accrued - paid);
              return <FreeProfileScreen onBack={() => setPScr("main")} user={user} initialProfile={profileData} onProfileUpdate={setProfileData} onVerify={(p) => addVerification({ userName: me || "Usuario", ...p })} isVerified={verifiedUsers.includes(me)} onRequestPlan={(plan) => addPlanRequest({ userName: me || "Usuario", plan })} currentPlan={userPlans[me] || "Básico"} plans={adminCfg.plans} myDebt={myDebt} commissionActive={adminCfg.commissionActive !== false} userProducts={products.filter(p => p.seller_id === user?.id)} onProduct={p => { setSelProd(p); setProdBackTo("profile-full"); setTab("market"); setMScr("product"); }} onDeleteProduct={(id) => askConfirm("¿Eliminar este producto? No se puede deshacer.", () => handleDelete(id))} onEditProduct={(p) => setEditProd(p)} />;
            })()}
            {pScr === "messages" && <MessagesScreen user={user} chatOpen={chatOpen} onBack={() => setPScr("main")} onChat={c => { setSelChat(c); setChatOpen(true); }} />}
            {pScr === "settings" && <SettingsScreen user={user} onBack={() => setPScr("main")} onSignOut={handleSignOut} onUpdate={u => setUser(prev => ({ ...prev, ...u }))} flash={flash} appTheme={appTheme} onThemeChange={changeTheme} appTextScale={appTextScale} onTextScaleChange={changeTextScale}
              profileData={profileData} onProfileUpdate={setProfileData}
              isVerified={verifiedUsers.includes(profileData?.name || user?.name)}
              onRequestVerification={() => setPScr("profile-full")}
              accountPassword={accountPassword} onSetPassword={setAccountPassword}
              blockedUsers={blockedUsers} onToggleBlock={toggleBlock}
              onOpenWallet={() => setShowWallet(true)} orders={orders.filter(o => (o.buyerId ? o.buyerId === user?.id : true))} />}
            {pScr === "orders"   && <OrdersScreen user={user} me={profileData?.name || user?.name} orders={mergedOrders} lastSeen={ordersSeen} onSeen={markOrdersSeen} onBack={() => setPScr("main")} flash={flash} onOpen={(o) => { setSelOrderId(o.id); setPScr("order-detail"); }} />}
            {pScr === "order-detail" && (() => { const o = mergedOrders.find(x => x.id === selOrderId); const meName = profileData?.name || user?.name; return o ? <OrderDetailScreen order={o} user={user} me={meName} onBack={() => setPScr("orders")} onChat={() => { const meSeller = (o.seller_id || o.sellerId) === user?.id; requestChat(meSeller ? (o.buyer_id || o.buyerId) : (o.seller_id || o.sellerId), meSeller ? (o.buyerName || "Comprador") : (o.sellerName || "Vendedor"), { type: "order", id: o.id, title: o.title || "Pedido", image: o.image || null }); }} onViewProfile={openPublicProfile} onSellerConfirm={() => sellerConfirmOrder(o.id)} onBuyerConfirm={() => buyerConfirmReceipt(o.id)} onSellerPayment={(ok) => sellerConfirmPayment(o.id, ok)} onApproveFee={(ok) => buyerApproveFee(o.id, ok)} flash={flash} /> : <OrdersScreen user={user} me={profileData?.name || user?.name} orders={mergedOrders} lastSeen={ordersSeen} onSeen={markOrdersSeen} onBack={() => setPScr("main")} flash={flash} onOpen={(x) => { setSelOrderId(x.id); setPScr("order-detail"); }} />; })()}
          </>}
        </>
      </div>

      {/* Nav inferior – solo móvil/tablet */}
      {!rsp.isDesktop && (
        <BottomNav tab={tab} unread={chatUnread + ordersUnseen} hidden={navHidden || hideNav} onTab={t => {
          setTab(t);
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
    </RCtx.Provider>
    </AppThCtx.Provider>
  );
}

