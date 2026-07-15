import { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo } from "react";
import { Activity, AlertCircle, ArrowLeft, Award, BarChart2, Bell, Calendar, Camera, Check, CheckCircle2, ChevronRight, Clock, CreditCard, Database, Download, Edit2, FileText, Fingerprint, Gavel, Globe, HardDrive, HelpCircle, Info, Lock, LogOut, Mail, MapPin, MessageCircle, Package, Palette, Phone, Plus, Shield, ShoppingBag, Smartphone, Star, TrendingUp, Truck, User, Volume2, Wallet, Zap } from "lucide-react";
import { DENSITY_TOKENS, TEXT_STEPS, money, useDensity, signOutUser } from "../shared/index.js";

const CFG_DARK = {
  P:"#FFC01E", PL:"#FFC01E18",
  BG:"#080808",       // fondo app — muy oscuro
  CARD:"#0d0d0d",     // contenedor del grupo (gap entre botones)
  ROW:"#141414",      // superficie de cada botón/fila ← profundidad
  CARD2:"#1a1a1a",    // inputs y superficies elevadas
  CARD_BD:"#1a1a1a",  // borde sutil del card
  T1:"#f0f0f0", T2:"#666666", T3:"#333333",
  SW_OFF:"#2a2a2a",
  OK_BG:"#0A2218",  OK_T:"#4ADE80",
  ERR_BG:"#28090A", ERR_T:"#FF5F5F",
  WRN_BG:"#2A1C00", WRN_T:"#FBBF24",
};
const CFG_LIGHT = {
  P:"#FFC01E", PL:"#FFC01E18",
  BG:"#FFFFFF",       // fondo app — blanco puro
  CARD:"#FFFFFF",     // contenedor del grupo
  ROW:"#FFFFFF",      // superficie de cada botón/fila
  CARD2:"#F2F3F5",    // inputs
  CARD_BD:"#E4E6EB",  // borde sutil / divisores
  T1:"#050505", T2:"#65676B", T3:"#8A8D91",
  SW_OFF:"#D4D7DC",
  OK_BG:"#E6FAF0",  OK_T:"#16A34A",
  ERR_BG:"#FEE2E2", ERR_T:"#DC2626",
  WRN_BG:"#FEF6E0", WRN_T:"#D97706",
};

const CFG_ThemeCtx = createContext(CFG_DARK);
const CFG_useTk = () => useContext(CFG_ThemeCtx);

/* ── DATA ─────────────────────────────────────────────────────── */
const CFG_INIT_PROFILE = {
  name:"Carlos Rivera", email:"carlos.rivera@gmail.com",
  phone:"+52 999 123 4567", verified:true, initials:"CR", memberSince:"2023",
};
const CFG_INIT = {
  appearance:{ theme:"auto", density:"standard", textSize:"normal", reduceAnimations:false },
  notifications:{
    chat:       { newMessages:true,  sounds:true,  vibration:true  },
    marketplace:{ newSales:true,     newOrders:true                },
    deliveries: { orderStatus:true,  delivered:true, shippingUpdate:false },
    auctions:   { newBid:true,       endingSoon:true, won:true     },
    promotions: { offers:false,      events:false,  news:false     },
  },
  privacy:{
    twoFactor:false, fingerprint:true, publicProfile:true,
    showLastSeen:false, showOnlineStatus:true,
    blockedUsers:[
      { id:1, name:"Miguel Torres", username:"@miguel_t" },
      { id:2, name:"Ana González",  username:"@ana_g"    },
    ],
  },
  chat:{ readReceipts:true, autoDownloadImages:false, autoDownloadVideos:false },
  deliveries:{
    addresses:[
      { id:1, label:"Casa",    address:"Av. Paseo de Montejo 120, Mérida, Yucatán", main:true  },
      { id:2, label:"Trabajo", address:"Calle 62 #456, Centro Histórico, Mérida",   main:false },
    ],
    instructions:"Dejar en la puerta principal. Llamar antes de entregar.",
    searchRadius:15, internationalShipping:false,
  },
  auctions:{ confirmBeforeBid:true, closingReminders:true },
  language:"es",
  payments:{
    methods:[
      { id:1, type:"card",   last4:"4532", brand:"Visa", expires:"12/26", main:true  },
      { id:2, type:"paypal", email:"carlos@paypal.com",                    main:false },
    ],
    transactions:[
      { id:1, desc:"Compra · Nike Air Max",  date:"8 Jun",  amount:"$2,450",  status:"completed", credit:false },
      { id:2, desc:"Venta · Canon EOS R50",  date:"5 Jun",  amount:"+$3,800", status:"completed", credit:true  },
      { id:3, desc:"Subasta · Reloj Seiko",  date:"1 Jun",  amount:"$980",    status:"pending",   credit:false },
      { id:4, desc:"Envío · Paquete #4521",  date:"28 May", amount:"$120",    status:"completed", credit:false },
    ],
  },
  activity:{
    purchases:{ total:24, amount:"$18,450" },
    sales:    { total:12, amount:"$31,200" },
    orders:   { made:24,  completed:22     },
    auctions: { participated:18, won:7, lost:11 },
    history:[
      { label:"Jun", purchases:4, sales:2 },
      { label:"May", purchases:3, sales:1 },
      { label:"Abr", purchases:5, sales:3 },
      { label:"Mar", purchases:2, sales:2 },
      { label:"Feb", purchases:6, sales:1 },
      { label:"Ene", purchases:4, sales:3 },
    ],
  },
  storage:{ cache:47.3, temp:23.1, downloads:128.4 },
};

/* ── ÁTOMOS ───────────────────────────────────────────────────── */
function CFG_Sw({ on, change }) {
  const tk = CFG_useTk();
  return (
    <button onClick={() => change(!on)}
      style={{ background: on ? tk.P : tk.SW_OFF, transition:"background .15s" }}
      className="relative w-11 h-6 rounded-full flex-shrink-0 focus:outline-none">
      <span style={{ transform: on ? "translateX(21px)" : "translateX(2px)", transition:"transform .15s" }}
        className="absolute top-0.5 w-5 h-5 bg-white rounded-full block" />
    </button>
  );
}

function CFG_Hdr({ title, onBack }) {
  const tk = CFG_useTk();
  return (
    <div style={{ background:tk.CARD, borderBottomColor:tk.CARD_BD }}
      className="flex items-center gap-2.5 px-4 py-3 border-b sticky top-0 z-10">
      {onBack && (
        <button onClick={onBack} style={{ background:tk.ROW, borderColor:tk.CARD_BD }}
          className="w-7 h-7 flex items-center justify-center rounded-lg border">
          <ArrowLeft size={15} style={{ color:tk.T2 }} />
        </button>
      )}
      <h1 style={{ color:tk.T1 }} className="text-[15px] font-semibold flex-1">{title}</h1>
    </div>
  );
}

function CFG_Lbl({ children }) {
  const tk = CFG_useTk();
  return (
    <div className="px-4 pt-3.5 pb-1">
      <span style={{ color:tk.T3 }} className="text-[10px] font-bold uppercase tracking-widest">{children}</span>
    </div>
  );
}

/* Card = contenedor oscuro; los ROW dentro flotan sobre él */
function CFG_Crd({ children }) {
  const tk = CFG_useTk();
  return (
    <div style={{ background:tk.CARD, borderColor:tk.CARD_BD }}
      className="rounded-xl mx-4 overflow-hidden border">
      {children}
    </div>
  );
}

/* Separador = muestra CARD entre los ROW → gap de profundidad */
function CFG_Hr() {
  const tk = CFG_useTk();
  return <div style={{ background:tk.CARD }} className="h-px" />;
}

/* Fila navegable — tiene su propio fondo ROW */
function CFG_Row({ icon:Icon, bg, label, sub, value, onClick, danger }) {
  const tk = CFG_useTk();
  return (
    <button onClick={onClick} style={{ background:tk.ROW }}
      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left active:opacity-60">
      {Icon && (
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${bg||"bg-zinc-700"}`}>
          <Icon size={15} className="text-white" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div style={{ color: danger ? tk.ERR_T : tk.T1 }} className="text-[14px] font-medium leading-tight truncate">{label}</div>
        {sub && <div style={{ color:tk.T2 }} className="text-[11px] mt-0.5 truncate">{sub}</div>}
      </div>
      {value && <span style={{ color:tk.T2, maxWidth:"45%" }} className="text-[12px] flex-shrink-0 mr-0.5 truncate">{value}</span>}
      <ChevronRight size={13} style={{ color: danger ? tk.ERR_T+"66" : tk.T3 }} className="flex-shrink-0" />
    </button>
  );
}

/* Fila toggle — tiene su propio fondo ROW */
function CFG_TRow({ icon:Icon, bg, label, sub, on, change }) {
  const tk = CFG_useTk();
  return (
    <div style={{ background:tk.ROW }} className="flex items-center gap-2.5 px-3.5 py-2.5">
      {Icon && (
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${bg||"bg-zinc-700"}`}>
          <Icon size={15} className="text-white" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div style={{ color:tk.T1 }} className="text-[14px] font-medium leading-tight">{label}</div>
        {sub && <div style={{ color:tk.T2 }} className="text-[11px] mt-0.5">{sub}</div>}
      </div>
      <CFG_Sw on={on} change={change} />
    </div>
  );
}

function CFG_Radio({ opts, val, change }) {
  const tk = CFG_useTk();
  return (
    <div>
      {opts.map((o, i) => (
        <div key={o.value}>
          {i > 0 && <CFG_Hr />}
          <button onClick={() => change(o.value)} style={{ background:tk.ROW }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left active:opacity-60">
            <div style={{ borderColor: val === o.value ? tk.P : tk.T3 }}
              className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0">
              {val === o.value && <div style={{ background:tk.P }} className="w-2 h-2 rounded-full" />}
            </div>
            <div className="flex-1">
              <div style={{ color:tk.T1 }} className="text-[14px] font-medium">{o.label}</div>
              {o.sub && <div style={{ color:tk.T2 }} className="text-[11px]">{o.sub}</div>}
            </div>
          </button>
        </div>
      ))}
    </div>
  );
}

function CFG_Bdg({ s }) {
  const tk = CFG_useTk();
  const m = {
    completed:["Completado",{ background:tk.OK_BG,  color:tk.OK_T  }],
    pending:  ["Pendiente", { background:tk.WRN_BG, color:tk.WRN_T }],
    failed:   ["Fallido",   { background:tk.ERR_BG, color:tk.ERR_T }],
  };
  const [l, st] = m[s] || m.pending;
  return <span style={st} className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full">{l}</span>;
}

/* ── HOME ─────────────────────────────────────────────────────── */
function CFG_HomeScreen({ profile, settings, nav, onBack }) {
  const tk = CFG_useTk();
  const storMB = Math.round(Object.values(settings.storage).reduce((a,b)=>a+b,0));
  const themeLabel = { auto:"Auto", light:"Claro", dark:"Oscuro" };
  const langLabel  = { es:"Español", en:"English", pt:"Português", fr:"Français" };
  const sections = [
    { title:"Cuenta", items:[
      { id:"account",       Icon:User,         label:"Cuenta",              value:profile.name, bg:"bg-violet-600" },
    ]},
    { title:"Personalización", items:[
      { id:"appearance",    Icon:Palette,       label:"Apariencia",          value:themeLabel[settings.appearance.theme]||"Auto", bg:"bg-indigo-600" },
      { id:"language",      Icon:Globe,         label:"Idioma",              value:langLabel[settings.language]||"Español",        bg:"bg-sky-600"    },
    ]},
    { title:"Comunicación", items:[
      { id:"notifications", Icon:Bell,          label:"Notificaciones",      bg:"bg-orange-600" },
      { id:"chat",          Icon:MessageCircle, label:"Chat",                bg:"bg-teal-600"   },
    ]},
    { title:"Marketplace", items:[
      { id:"deliveries",    Icon:Truck,         label:"Entregas y Envíos",   value:`${settings.deliveries.addresses.length} dirs.`,  bg:"bg-blue-600"    },
      { id:"auctions",      Icon:Gavel,         label:"Subastas",            value:`${settings.activity.auctions.won}/${settings.activity.auctions.participated}`, bg:"bg-amber-600" },
      { id:"payments",      Icon:CreditCard,    label:"Pagos",               value:`${settings.payments.methods.length} métodos`,    bg:"bg-emerald-600" },
    ]},
    { title:"Datos y Privacidad", items:[
      { id:"activity",      Icon:BarChart2,     label:"Actividad",           bg:"bg-pink-600"  },
      { id:"privacy",       Icon:Shield,        label:"Privacidad",          value:settings.privacy.twoFactor?"2FA ✓":"2FA", bg:"bg-red-600" },
      { id:"storage",       Icon:HardDrive,     label:"Almacenamiento",      value:`${storMB} MB`, bg:"bg-zinc-600" },
    ]},
    { title:"Soporte", items:[
      { id:"help",          Icon:HelpCircle,    label:"Ayuda",               bg:"bg-cyan-700"  },
      { id:"about",         Icon:Info,          label:"Acerca de",           value:"3.2.1",    bg:"bg-zinc-600" },
    ]},
  ];
  return (
    <div style={{ background:tk.BG }} className="">
      <CFG_Hdr title="Configuración" onBack={onBack} />
      {sections.map(sec => (
        <div key={sec.title}>
          <CFG_Lbl>{sec.title}</CFG_Lbl>
          <CFG_Crd>
            {sec.items.map((item, i) => (
              <div key={item.id}>
                {i > 0 && <CFG_Hr />}
                <CFG_Row icon={item.Icon} bg={item.bg} label={item.label} value={item.value} onClick={() => nav(item.id)} />
              </div>
            ))}
          </CFG_Crd>
        </div>
      ))}
      <div className="h-8" />
    </div>
  );
}

/* ── ACCOUNT ──────────────────────────────────────────────────── */
function CFG_AccountScreen({ profile, setProfile, nav, onSignOut, isVerified=false, onRequestVerification, accountPassword="", onSetPassword, flash }) {
  const tk = CFG_useTk();
  const [editing, setEditing] = useState(null);
  const [val, setVal] = useState("");
  const [pwSheet, setPwSheet] = useState(false);
  const hasPw = !!accountPassword;
  function startEdit(f, v) { setEditing(f); setVal(v); }
  function save() {
    if (editing==="name") { const ini=val.trim().split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase(); setProfile(p=>({...p,name:val.trim(),initials:ini})); }
    else if (editing==="email") setProfile(p=>({...p,email:val.trim()}));
    else if (editing==="phone") setProfile(p=>({...p,phone:val.trim()}));
    setEditing(null);
  }
  const fields = [
    { field:"name",  label:"Nombre",  value:profile.name,  Icon:User  },
    { field:"email", label:"Correo",  value:profile.email, Icon:Mail  },
    { field:"phone", label:"Teléfono", value:profile.phone, Icon:Phone },
  ];
  return (
    <div style={{ background:tk.BG }} className="">
      <CFG_Hdr title="Cuenta" onBack={() => nav("home")} />
      <div className="flex flex-col items-center py-5">
        <div className="relative">
          <div style={{ background:"linear-gradient(135deg,#b8860b,#FFC01E)" }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center">
            <span className="text-white text-xl font-black">{profile.initials}</span>
          </div>
          {profile.verified && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2" style={{ borderColor:tk.BG }}>
              <Check size={10} className="text-white" strokeWidth={3} />
            </div>
          )}
        </div>
        <button style={{ color:tk.P }} className="mt-2.5 flex items-center gap-1 text-[12px] font-medium">
          <Camera size={12} /> Cambiar foto
        </button>
      </div>
      <CFG_Lbl>Información personal</CFG_Lbl>
      <CFG_Crd>
        {fields.map(({ field, label, value, Icon }, i) => (
          <div key={field}>
            {i > 0 && <CFG_Hr />}
            <div style={{ background:tk.ROW }} className="px-3.5 py-2.5">
              <div className="flex items-center gap-2.5">
                <div style={{ background:tk.CARD2 }} className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon size={14} style={{ color:tk.T2 }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div style={{ color:tk.T3 }} className="text-[10px] font-bold uppercase tracking-wide">{label}</div>
                  {editing===field
                    ? <input autoFocus value={val} onChange={e=>setVal(e.target.value)}
                        style={{ borderColor:tk.P, color:tk.T1, background:"transparent" }}
                        className="text-[14px] font-medium border-b-2 outline-none w-full" />
                    : <div style={{ color:tk.T1 }} className="text-[14px] font-medium">{value}</div>}
                </div>
                {editing===field ? (
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <button onClick={() => setEditing(null)} style={{ color:tk.T2 }} className="text-[12px]">Cancelar</button>
                    <button onClick={save} style={{ color:tk.P }} className="text-[12px] font-bold">OK</button>
                  </div>
                ) : (
                  <button onClick={() => startEdit(field, value)} style={{ color:tk.T3 }} className="flex-shrink-0"><Edit2 size={14} /></button>
                )}
              </div>
            </div>
          </div>
        ))}
      </CFG_Crd>
      <CFG_Lbl>Estado</CFG_Lbl>
      <CFG_Crd>
        {isVerified ? (
          <div style={{ background:tk.ROW }} className="flex items-center gap-2.5 px-3.5 py-2.5">
            <div style={{ background:tk.OK_BG }} className="w-8 h-8 rounded-lg flex items-center justify-center">
              <CheckCircle2 size={15} style={{ color:tk.OK_T }} />
            </div>
            <div>
              <div style={{ color:tk.T1 }} className="text-[14px] font-medium">Cuenta verificada</div>
              <div style={{ color:tk.T2 }} className="text-[11px]">Miembro desde {profile.memberSince}</div>
            </div>
          </div>
        ) : (
          <CFG_Row icon={Shield} bg="bg-violet-600" label="Solicitar verificación" sub="Sube tu documento y obtén el sello" onClick={() => onRequestVerification && onRequestVerification()} />
        )}
      </CFG_Crd>
      <CFG_Lbl>Seguridad</CFG_Lbl>
      <CFG_Crd>
        <CFG_Row icon={Lock} bg="bg-zinc-600" label={hasPw ? "Cambiar contraseña" : "Crear contraseña"} sub={hasPw ? "Actualiza tu contraseña" : "Aún no tienes contraseña"} onClick={() => setPwSheet(true)} />
      </CFG_Crd>
      <CFG_Lbl>Sesión</CFG_Lbl>
      <CFG_Crd><CFG_Row icon={LogOut} bg="bg-red-700" label="Cerrar sesión" danger onClick={onSignOut || (() => signOutUser())} /></CFG_Crd>
      <div className="h-8" />
      {pwSheet && <CFG_PasswordSheet hasPw={hasPw} current={accountPassword} onClose={() => setPwSheet(false)} onSave={(pw) => { onSetPassword && onSetPassword(pw); setPwSheet(false); flash && flash(hasPw ? "🔒 Contraseña actualizada" : "🔒 Contraseña creada"); }} />}
    </div>
  );
}

function CFG_PasswordSheet({ hasPw, current, onClose, onSave }) {
  const tk = CFG_useTk();
  const [cur, setCur] = useState("");
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");
  const submit = () => {
    if (hasPw && cur !== current) { setErr("La contraseña actual no es correcta"); return; }
    if (pw1.length < 4) { setErr("Mínimo 4 caracteres"); return; }
    if (pw1 !== pw2) { setErr("Las contraseñas no coinciden"); return; }
    onSave(pw1);
  };
  const inp = { background:tk.CARD2, color:tk.T1, borderColor:"rgba(128,128,128,.25)" };
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", zIndex:5000, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:tk.BG, width:"100%", maxWidth:440, borderRadius:"18px 18px 0 0", padding:"20px 18px 26px", maxHeight:"88vh", overflowY:"auto" }}>
        <div style={{ color:tk.T1 }} className="text-[16px] font-bold mb-1">{hasPw ? "Cambiar contraseña" : "Crear contraseña"}</div>
        <div style={{ color:tk.T2 }} className="text-[12px] mb-4">{hasPw ? "Introduce tu contraseña actual y la nueva." : "Crea una contraseña para proteger tu cuenta."}</div>
        {hasPw && <input type="password" value={cur} onChange={e=>{setCur(e.target.value);setErr("");}} placeholder="Contraseña actual" style={inp} className="w-full h-11 rounded-xl px-3 text-[14px] border outline-none mb-2.5" />}
        <input type="password" value={pw1} onChange={e=>{setPw1(e.target.value);setErr("");}} placeholder="Nueva contraseña" style={inp} className="w-full h-11 rounded-xl px-3 text-[14px] border outline-none mb-2.5" />
        <input type="password" value={pw2} onChange={e=>{setPw2(e.target.value);setErr("");}} placeholder="Repite la nueva contraseña" style={inp} className="w-full h-11 rounded-xl px-3 text-[14px] border outline-none mb-2.5" />
        {err && <div className="text-[12px] mb-2" style={{ color:"#ef4444" }}>{err}</div>}
        <div className="flex gap-2.5 mt-2">
          <button onClick={onClose} style={{ background:tk.CARD2, color:tk.T1 }} className="flex-1 h-11 rounded-xl text-[13px] font-semibold">Cancelar</button>
          <button onClick={submit} style={{ background:"#FFC01E", color:"#000" }} className="flex-1 h-11 rounded-xl text-[13px] font-bold">{hasPw ? "Actualizar" : "Crear"}</button>
        </div>
      </div>
    </div>
  );
}

/* ── APPEARANCE ───────────────────────────────────────────────── */
// Barrita deslizable con puntos (estilo ajustes de teléfono). Se arrastra y los
// puntos/etiquetas también son tocables. Reutilizable para densidad y tamaño de texto.
function CFG_StepSlider({ index, count, labels, onChange, hint }) {
  const tk = CFG_useTk();
  const safe = Math.max(0, Math.min(count - 1, index));
  return (
    <div style={{ background: tk.ROW }} className="px-4 pt-4 pb-3">
      <input type="range" min={0} max={count - 1} step={1} value={safe}
        onChange={e => onChange(parseInt(e.target.value, 10))}
        className="dslider" style={{ width: "100%", accentColor: "#FFC01E" }} />
      <div className="flex" style={{ marginTop: 10, gap: 2 }}>
        {labels.map((l, i) => (
          <button key={i} onClick={() => onChange(i)}
            style={{ flex: 1, textAlign: "center", fontSize: 9.5, lineHeight: 1.2,
              fontWeight: i === safe ? 800 : 600, color: i === safe ? "#FFC01E" : tk.T3,
              background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            {l}
          </button>
        ))}
      </div>
      {hint && <p style={{ color: tk.T3, fontSize: 9, textAlign: "center", marginTop: 8 }}>{hint}</p>}
    </div>
  );
}

function CFG_DensitySelector() {
  const { mode, setMode, modes } = useDensity();
  const idx = modes.indexOf(mode);
  return (
    <CFG_StepSlider
      index={idx < 0 ? 2 : idx}
      count={modes.length}
      labels={modes.map(m => DENSITY_TOKENS[m].label)}
      onChange={i => setMode(modes[i])}
      hint="Ajusta el tamaño y el aire de toda la app · 2 productos por fila"
    />
  );
}

function CFG_AppearanceScreen({ settings, upd, nav, appScale = 1, onScale, onThemeChange, appTheme="auto", appTextScale=1, onTextScaleChange, productView="grid", onProductViewChange }) {
  const tk = CFG_useTk();
  const ap = settings.appearance;
  function set(k, v) { upd("appearance", { ...ap, [k]:v }); }
  const sizes = { small:12, normal:14, large:16 };
  return (
    <div style={{ background:tk.BG }} className="">
      <CFG_Hdr title="Apariencia" onBack={() => nav("home")} />
      <CFG_Lbl>Tema</CFG_Lbl>
      <CFG_Crd>
        <CFG_Radio val={appTheme} change={v => { upd("appearance", { ...ap, theme:v }); onThemeChange?.(v); }} opts={[
          { value:"light", label:"Claro",      sub:"Fondo blanco"     },
          { value:"dark",  label:"Oscuro",     sub:"Fondo negro"      },
          { value:"auto",  label:"Automático", sub:"Sigue el sistema" },
        ]} />
      </CFG_Crd>
      <CFG_Lbl>Vista de productos</CFG_Lbl>
      <CFG_Crd>
        <CFG_Radio val={productView} change={v => onProductViewChange?.(v)} opts={[
          { value:"grid", label:"Cuadrícula", sub:"Dos columnas parejas, foto cuadrada" },
          { value:"muro", label:"Muro",       sub:"Estilo Pinterest: fotos en su tamaño real" },
        ]} />
      </CFG_Crd>
      <CFG_Lbl>Densidad visual</CFG_Lbl>
      <CFG_Crd>
        <CFG_DensitySelector />
      </CFG_Crd>
      <CFG_Lbl>Tamaño del texto</CFG_Lbl>
      <CFG_Crd>
        <CFG_StepSlider
          index={(() => { let bi = 0, bd = 9; TEXT_STEPS.forEach((s, i) => { const d = Math.abs(s - (appTextScale || 1)); if (d < bd) { bd = d; bi = i; } }); return bi; })()}
          count={TEXT_STEPS.length}
          labels={["Pequeño", "Normal", "Grande", "Mayor", "Máx"]}
          onChange={i => onTextScaleChange?.(TEXT_STEPS[i])}
          hint="Aplica a todo el texto de la app"
        />
        <CFG_Hr />
        <div style={{ background:tk.ROW }} className="px-3.5 py-3">
          <div style={{ fontSize: 13 * (appTextScale || 1), background:tk.PL, borderRadius:8, color:tk.P }}
            className="px-3 py-2 leading-relaxed">
            Vista previa del tamaño de texto seleccionado.
          </div>
        </div>
      </CFG_Crd>
      <CFG_Lbl>Accesibilidad</CFG_Lbl>
      <CFG_Crd>
        <CFG_TRow icon={Zap} bg="bg-amber-600" label="Reducir animaciones" sub="Mejora el rendimiento"
          on={ap.reduceAnimations} change={v => set("reduceAnimations", v)} />
      </CFG_Crd>
      <div className="h-8" />
    </div>
  );
}

/* ── NOTIFICATIONS ─────────────────────────────────────────────── */
function CFG_NotificationsScreen({ settings, upd, nav }) {
  const tk = CFG_useTk();
  const n = settings.notifications;
  function set(g, k, v) { upd("notifications", { ...n, [g]:{ ...n[g], [k]:v } }); }
  const groups = [
    { id:"chat", label:"Chat", items:[
      { k:"newMessages", l:"Mensajes nuevos", Icon:MessageCircle, bg:"bg-teal-600"   },
      { k:"sounds",      l:"Sonidos",         Icon:Volume2,       bg:"bg-sky-700"    },
      { k:"vibration",   l:"Vibración",       Icon:Smartphone,    bg:"bg-blue-700"   },
    ]},
    { id:"marketplace", label:"Marketplace", items:[
      { k:"newSales",  l:"Nuevas ventas",  Icon:ShoppingBag, bg:"bg-violet-600" },
      { k:"newOrders", l:"Nuevos pedidos", Icon:Package,     bg:"bg-indigo-600" },
    ]},
    { id:"deliveries", label:"Entregas y Envíos", items:[
      { k:"orderStatus",    l:"Estado del pedido",     Icon:Truck,        bg:"bg-blue-600"    },
      { k:"delivered",      l:"Pedido entregado",      Icon:CheckCircle2, bg:"bg-emerald-600" },
      { k:"shippingUpdate", l:"Actualización de envío", Icon:MapPin,      bg:"bg-cyan-700"    },
    ]},
    { id:"auctions", label:"Subastas", items:[
      { k:"newBid",     l:"Nueva oferta",     Icon:Gavel, bg:"bg-amber-600"  },
      { k:"endingSoon", l:"Próxima a cerrar", Icon:Clock, bg:"bg-orange-600" },
      { k:"won",        l:"Subasta ganada",   Icon:Award, bg:"bg-yellow-600" },
    ]},
    { id:"promotions", label:"Promociones", items:[
      { k:"offers", l:"Ofertas",   Icon:Star,     bg:"bg-pink-600"   },
      { k:"events", l:"Eventos",   Icon:Calendar, bg:"bg-purple-600" },
      { k:"news",   l:"Novedades", Icon:Zap,      bg:"bg-rose-600"   },
    ]},
  ];
  return (
    <div style={{ background:tk.BG }} className="">
      <CFG_Hdr title="Notificaciones" onBack={() => nav("home")} />
      {groups.map(gr => (
        <div key={gr.id}>
          <CFG_Lbl>{gr.label}</CFG_Lbl>
          <CFG_Crd>
            {gr.items.map((item, i) => (
              <div key={item.k}>
                {i > 0 && <CFG_Hr />}
                <div style={{ background:tk.ROW }} className="flex items-center gap-2.5 px-3.5 py-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.bg}`}>
                    <item.Icon size={15} className="text-white" />
                  </div>
                  <div style={{ color:tk.T1 }} className="flex-1 text-[14px] font-medium">{item.l}</div>
                  <CFG_Sw on={n[gr.id][item.k]} change={v => set(gr.id, item.k, v)} />
                </div>
              </div>
            ))}
          </CFG_Crd>
        </div>
      ))}
      <div className="h-8" />
    </div>
  );
}

/* ── PRIVACY ──────────────────────────────────────────────────── */
function CFG_PrivacyScreen({ settings, upd, nav, blockedUsers=[], onToggleBlock }) {
  const tk = CFG_useTk();
  const pv = settings.privacy;
  function set(k, v) { upd("privacy", { ...pv, [k]:v }); }
  function unblock(key, name) { onToggleBlock && onToggleBlock(key, name); }
  return (
    <div style={{ background:tk.BG }} className="">
      <CFG_Hdr title="Privacidad y Seguridad" onBack={() => nav("home")} />
      <CFG_Lbl>Seguridad</CFG_Lbl>
      <CFG_Crd>
        <CFG_TRow icon={Shield}      bg="bg-red-700"    label="Verificación en dos pasos" sub="Capa extra de protección" on={pv.twoFactor}       change={v=>set("twoFactor",v)} />
        <CFG_Hr />
        <CFG_TRow icon={Fingerprint} bg="bg-violet-600" label="Huella digital"            sub="Autenticación biométrica"  on={pv.fingerprint}     change={v=>set("fingerprint",v)} />
      </CFG_Crd>
      <CFG_Lbl>Visibilidad</CFG_Lbl>
      <CFG_Crd>
        <CFG_TRow icon={Globe}    bg="bg-sky-600"     label="Perfil público"  sub="Otros pueden ver tu perfil"  on={pv.publicProfile}    change={v=>set("publicProfile",v)} />
        <CFG_Hr />
        <CFG_TRow icon={Clock}    bg="bg-zinc-600"    label="Última conexión" sub="Visible para contactos"       on={pv.showLastSeen}     change={v=>set("showLastSeen",v)} />
        <CFG_Hr />
        <CFG_TRow icon={Activity} bg="bg-emerald-600" label="Estado en línea" sub="Punto verde cuando activo"    on={pv.showOnlineStatus} change={v=>set("showOnlineStatus",v)} />
      </CFG_Crd>
      <CFG_Lbl>Bloqueados · {blockedUsers.length}</CFG_Lbl>
      <CFG_Crd>
        {blockedUsers.length === 0 ? (
          <div style={{ background:tk.ROW }} className="px-3.5 py-5 text-center">
            <p style={{ color:tk.T2 }} className="text-[13px]">Sin usuarios bloqueados</p>
          </div>
        ) : blockedUsers.map((u, i) => (
          <div key={u.key}>
            {i > 0 && <CFG_Hr />}
            <div style={{ background:tk.ROW }} className="flex items-center gap-2.5 px-3.5 py-2.5">
              <div style={{ background:tk.CARD2 }} className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
                <User size={14} style={{ color:tk.T2 }} />
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ color:tk.T1 }} className="text-[14px] font-medium">{u.name}</div>
                <div style={{ color:tk.T2 }} className="text-[11px]">Bloqueado</div>
              </div>
              <button onClick={() => unblock(u.key, u.name)} style={{ background:tk.ERR_BG, color:tk.ERR_T }}
                className="text-[11px] font-bold px-2.5 py-1 rounded-full">Desbloquear</button>
            </div>
          </div>
        ))}
      </CFG_Crd>
      <div className="h-8" />
    </div>
  );
}

/* ── CHAT ─────────────────────────────────────────────────────── */
function CFG_ChatScreen({ settings, upd, nav }) {
  const tk = CFG_useTk();
  const { chat } = settings;
  const [done, setDone] = useState({ conv:false, temp:false });
  function set(k, v) { upd("chat", { ...chat, [k]:v }); }
  return (
    <div style={{ background:tk.BG }} className="">
      <CFG_Hdr title="Chat" onBack={() => nav("home")} />
      <CFG_Lbl>Preferencias</CFG_Lbl>
      <CFG_Crd>
        <CFG_TRow icon={CheckCircle2} bg="bg-teal-600"   label="Confirmación de lectura"  sub="Muestra cuando lees"   on={chat.readReceipts}       change={v=>set("readReceipts",v)} />
        <CFG_Hr />
        <CFG_TRow icon={Download}     bg="bg-sky-600"    label="Descargar imágenes auto." sub="Solo en Wi-Fi"          on={chat.autoDownloadImages} change={v=>set("autoDownloadImages",v)} />
        <CFG_Hr />
        <CFG_TRow icon={Download}     bg="bg-indigo-600" label="Descargar videos auto."   sub="Consume datos móviles"  on={chat.autoDownloadVideos} change={v=>set("autoDownloadVideos",v)} />
      </CFG_Crd>
      <CFG_Lbl>Limpieza</CFG_Lbl>
      <CFG_Crd>
        {[
          { id:"conv", Icon:MessageCircle, bg:"bg-orange-600", label:"Limpiar conversaciones",  sub:"Mensajes y medios locales" },
          { id:"temp", Icon:Database,      bg:"bg-zinc-600",   label:"Eliminar archivos temp.", sub:"Libera ~23 MB" },
        ].map((item, i) => (
          <div key={item.id}>
            {i > 0 && <CFG_Hr />}
            <button onClick={() => setDone(d=>({...d,[item.id]:true}))} style={{ background:tk.ROW }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left active:opacity-60">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.bg}`}>
                <item.Icon size={15} className="text-white" />
              </div>
              <div className="flex-1">
                <div style={{ color:tk.T1 }} className="text-[14px] font-medium">{item.label}</div>
                <div style={{ color:tk.T2 }} className="text-[11px]">{item.sub}</div>
              </div>
              {done[item.id]
                ? <span style={{ color:tk.OK_T }} className="text-[11px] font-semibold flex items-center gap-1"><Check size={12} /> Listo</span>
                : <ChevronRight size={13} style={{ color:tk.T3 }} />}
            </button>
          </div>
        ))}
      </CFG_Crd>
      <div className="h-8" />
    </div>
  );
}

/* ── DELIVERIES ───────────────────────────────────────────────── */
function CFG_DeliveriesScreen({ settings, upd, nav }) {
  const tk = CFG_useTk();
  const del = settings.deliveries;
  const [editInstr, setEditInstr] = useState(false);
  const [instr, setInstr] = useState(del.instructions);
  const [adding, setAdding] = useState(false);
  const [newA, setNewA] = useState({ label:"", address:"" });
  function set(k, v) { upd("deliveries", { ...del, [k]:v }); }
  function addAddr() {
    if (!newA.label || !newA.address) return;
    set("addresses", [...del.addresses, { id:Date.now(), ...newA, main:false }]);
    setAdding(false); setNewA({ label:"", address:"" });
  }
  return (
    <div style={{ background:tk.BG }} className="">
      <CFG_Hdr title="Entregas y Envíos" onBack={() => nav("home")} />
      <CFG_Lbl>Direcciones</CFG_Lbl>
      <CFG_Crd>
        {del.addresses.map((a, i) => (
          <div key={a.id}>
            {i > 0 && <CFG_Hr />}
            <div style={{ background:tk.ROW }} className="flex items-start gap-2.5 px-3.5 py-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <MapPin size={14} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span style={{ color:tk.T1 }} className="text-[14px] font-medium">{a.label}</span>
                  {a.main && <span style={{ background:tk.PL, color:tk.P }} className="text-[10px] font-bold px-1.5 py-0.5 rounded-full">Principal</span>}
                </div>
                <p style={{ color:tk.T2 }} className="text-[11px] mt-0.5 leading-snug">{a.address}</p>
                <div className="flex gap-3 mt-1.5">
                  {!a.main && <button onClick={() => set("addresses",del.addresses.map(x=>({...x,main:x.id===a.id})))} style={{ color:tk.P }} className="text-[11px] font-semibold">Principal</button>}
                  <button onClick={() => set("addresses",del.addresses.filter(x=>x.id!==a.id))} style={{ color:tk.ERR_T }} className="text-[11px] font-semibold">Eliminar</button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {adding ? (
          <div><CFG_Hr />
            <div style={{ background:tk.ROW }} className="px-3.5 py-3">
              <input placeholder="Etiqueta" value={newA.label} onChange={e=>setNewA(n=>({...n,label:e.target.value}))}
                style={{ background:tk.CARD2, borderColor:tk.CARD_BD, color:tk.T1 }} className="w-full text-[13px] border rounded-lg px-2.5 py-2 mb-2 outline-none" />
              <input placeholder="Dirección completa" value={newA.address} onChange={e=>setNewA(n=>({...n,address:e.target.value}))}
                style={{ background:tk.CARD2, borderColor:tk.CARD_BD, color:tk.T1 }} className="w-full text-[13px] border rounded-lg px-2.5 py-2 outline-none" />
              <div className="flex gap-2 mt-2.5">
                <button onClick={() => setAdding(false)} style={{ borderColor:tk.CARD_BD, color:tk.T2 }} className="flex-1 py-2 text-[13px] border rounded-lg">Cancelar</button>
                <button onClick={addAddr} style={{ background:tk.P }} className="flex-1 py-2 text-[13px] text-white rounded-lg font-semibold">Agregar</button>
              </div>
            </div>
          </div>
        ) : (
          <div><CFG_Hr />
            <button onClick={() => setAdding(true)} style={{ background:tk.ROW, color:tk.P }} className="w-full flex items-center gap-1.5 px-3.5 py-2.5 text-[13px] font-semibold">
              <Plus size={14} /> Agregar dirección
            </button>
          </div>
        )}
      </CFG_Crd>
      <CFG_Lbl>Instrucciones</CFG_Lbl>
      <CFG_Crd>
        <div style={{ background:tk.ROW }} className="px-3.5 py-2.5">
          {editInstr ? (
            <div>
              <textarea value={instr} onChange={e=>setInstr(e.target.value)} rows={3}
                style={{ background:tk.CARD2, borderColor:tk.P, color:tk.T1 }}
                className="w-full text-[13px] border-2 rounded-lg px-2.5 py-2 outline-none resize-none" />
              <div className="flex gap-2 mt-2">
                <button onClick={() => setEditInstr(false)} style={{ borderColor:tk.CARD_BD, color:tk.T2 }} className="flex-1 py-1.5 text-[13px] border rounded-lg">Cancelar</button>
                <button onClick={() => { set("instructions",instr); setEditInstr(false); }} style={{ background:tk.P }} className="flex-1 py-1.5 text-[13px] text-white rounded-lg font-semibold">Guardar</button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2.5">
              <p style={{ color:tk.T2 }} className="flex-1 text-[13px] leading-snug">{del.instructions||"Sin instrucciones."}</p>
              <button onClick={() => setEditInstr(true)} style={{ color:tk.T3 }}><Edit2 size={14} /></button>
            </div>
          )}
        </div>
      </CFG_Crd>
      <div className="h-8" />
    </div>
  );
}

/* ── AUCTIONS ─────────────────────────────────────────────────── */
function CFG_AuctionsScreen({ settings, upd, nav }) {
  const tk = CFG_useTk();
  const { auctions:au, activity } = settings;
  function set(k, v) { upd("auctions", { ...au, [k]:v }); }
  const history = [
    { id:1, title:"Reloj Seiko Presage SARX057",     date:"5 Jun",  bid:"$1,200", won:true  },
    { id:2, title:"Cámara Fujifilm X100VI",           date:"2 Jun",  bid:"$9,500", won:false },
    { id:3, title:"Guitarra Fender Stratocaster '65", date:"28 May", bid:"$4,300", won:true  },
    { id:4, title:"Sneakers Nike SB Dunk Low",        date:"20 May", bid:"$2,100", won:false },
    { id:5, title:"Consola PS5 Edición Specials",     date:"15 May", bid:"$6,800", won:true  },
  ];
  return (
    <div style={{ background:tk.BG }} className="">
      <CFG_Hdr title="Subastas" onBack={() => nav("home")} />
      <CFG_Lbl>Preferencias</CFG_Lbl>
      <CFG_Crd>
        <CFG_TRow icon={AlertCircle} bg="bg-amber-600"  label="Confirmar antes de pujar" sub="Confirmación en cada oferta" on={au.confirmBeforeBid}  change={v=>set("confirmBeforeBid",v)} />
        <CFG_Hr />
        <CFG_TRow icon={Clock}       bg="bg-orange-600" label="Recordatorios de cierre"  sub="15 min antes del cierre"    on={au.closingReminders}  change={v=>set("closingReminders",v)} />
      </CFG_Crd>
      <CFG_Lbl>Resumen</CFG_Lbl>
      <div className="mx-4 grid grid-cols-3 gap-2">
        {[
          { l:"Participadas", v:activity.auctions.participated, c:tk.T1   },
          { l:"Ganadas",      v:activity.auctions.won,          c:tk.OK_T },
          { l:"Perdidas",     v:activity.auctions.lost,         c:tk.T3   },
        ].map(s => (
          <div key={s.l} style={{ background:tk.ROW, borderColor:tk.CARD_BD }} className="rounded-xl p-2.5 text-center border">
            <div style={{ color:s.c }} className="text-xl font-black">{s.v}</div>
            <div style={{ color:tk.T2 }} className="text-[10px] mt-0.5">{s.l}</div>
          </div>
        ))}
      </div>
      <CFG_Lbl>Historial</CFG_Lbl>
      <CFG_Crd>
        {history.map((item, i) => (
          <div key={item.id}>
            {i > 0 && <CFG_Hr />}
            <div style={{ background:tk.ROW }} className="flex items-center gap-2.5 px-3.5 py-2.5">
              <div style={{ background: item.won ? tk.OK_BG : tk.CARD2 }}
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
                <Award size={14} style={{ color: item.won ? tk.OK_T : tk.T3 }} />
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ color:tk.T1 }} className="text-[13px] font-medium truncate">{item.title}</div>
                <div style={{ color:tk.T2 }} className="text-[11px]">{item.date} · {item.bid}</div>
              </div>
              <span style={item.won ? { background:tk.OK_BG, color:tk.OK_T } : { background:tk.CARD2, color:tk.T3 }}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                {item.won ? "Ganada" : "Perdida"}
              </span>
            </div>
          </div>
        ))}
      </CFG_Crd>
      <div className="h-8" />
    </div>
  );
}

/* ── PAYMENTS ─────────────────────────────────────────────────── */
function CFG_PaymentsScreen({ settings, upd, nav, onOpenWallet, orders = [], flash }) {
  const tk = CFG_useTk();
  const [showInvoices, setShowInvoices] = useState(false);

  const downloadInvoice = (o) => {
    const lines = [
      "RETADOR — Factura",
      "================================",
      `Nº de pedido: ${o.id}`,
      `Fecha: ${new Date(o.createdAt || Date.now()).toLocaleDateString("es-ES")}`,
      `Vendedor: ${o.sellerName || "—"}`,
      `Artículo: ${o.title || "—"}`,
      `Cantidad: ${o.qty || 1}`,
      "--------------------------------",
      `Producto: ${money(o.amount || 0, o.currency || "CUP")}`,
      o.shipPrice ? `Envío (${o.shipTo || "envío"}): ${money(o.shipPrice, o.currency || "CUP")}` : "",
      `TOTAL: ${money((Number(o.amount) || 0) + (Number(o.shipPrice) || 0), o.currency || "CUP")}`,
      "================================",
      "Gracias por usar RETADOR.",
    ].filter(Boolean).join("\n");
    try {
      const blob = new Blob([lines], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `factura-${o.id}.txt`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      flash && flash("📄 Factura descargada");
    } catch (e) { flash && flash("No se pudo descargar"); }
  };

  return (
    <div style={{ background:tk.BG }} className="">
      <CFG_Hdr title="Pagos" onBack={() => nav("home")} />

      <CFG_Lbl>Tu dinero</CFG_Lbl>
      <CFG_Crd>
        <div style={{ background:tk.ROW }} className="px-3.5 py-3.5">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0">
              <Wallet size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <div style={{ color:tk.T1 }} className="text-[14px] font-bold">Billetera RETADOR</div>
              <div style={{ color:tk.T2 }} className="text-[11px]">Saldo, métodos de pago, recargas y conversión de monedas</div>
            </div>
          </div>
          <button onClick={() => onOpenWallet && onOpenWallet()} style={{ background:"#FFC01E", color:"#000" }} className="w-full h-10 rounded-xl text-[13px] font-bold">Abrir billetera</button>
        </div>
      </CFG_Crd>

      <CFG_Lbl>Métodos de pago</CFG_Lbl>
      <CFG_Crd>
        <CFG_Row icon={CreditCard} bg="bg-violet-600" label="Gestionar métodos de pago" sub="Cuentas bancarias y recargas (en la billetera)" onClick={() => onOpenWallet && onOpenWallet()} />
        <CFG_Hr />
        <div style={{ background:tk.ROW }} className="px-3.5 py-2.5">
          <div style={{ color:tk.T3 }} className="text-[11px]">Próximamente: PayPal, Visa y tarjetas internacionales.</div>
        </div>
      </CFG_Crd>

      <CFG_Lbl>Transacciones</CFG_Lbl>
      <CFG_Crd>
        <CFG_Row icon={FileText} bg="bg-blue-600" label="Ver mis transacciones" sub="Historial completo en la billetera" onClick={() => onOpenWallet && onOpenWallet()} />
      </CFG_Crd>

      <CFG_Lbl>Documentos</CFG_Lbl>
      <CFG_Crd>
        <CFG_Row icon={FileText} bg="bg-zinc-600" label="Ver facturas" sub={`${orders.length} pedido${orders.length === 1 ? "" : "s"}`} onClick={() => setShowInvoices(true)} />
      </CFG_Crd>
      <div className="h-8" />

      {showInvoices && (
        <div onClick={() => setShowInvoices(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", zIndex:5000, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:tk.BG, width:"100%", maxWidth:440, borderRadius:"18px 18px 0 0", padding:"18px 16px 26px", maxHeight:"82vh", overflowY:"auto" }}>
            <div style={{ color:tk.T1 }} className="text-[16px] font-bold mb-1">Facturas</div>
            <div style={{ color:tk.T2 }} className="text-[12px] mb-4">Cada pedido genera su factura descargable.</div>
            {orders.length === 0 ? (
              <div style={{ color:tk.T2 }} className="text-[13px] text-center py-8">Aún no tienes pedidos.</div>
            ) : orders.map(o => (
              <div key={o.id} style={{ background:tk.ROW }} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-2">
                <div className="flex-1 min-w-0">
                  <div style={{ color:tk.T1 }} className="text-[13px] font-semibold truncate">{o.title || "Pedido"}</div>
                  <div style={{ color:tk.T2 }} className="text-[11px]">{o.id} · {money((Number(o.amount)||0)+(Number(o.shipPrice)||0), o.currency||"CUP")}</div>
                </div>
                <button onClick={() => downloadInvoice(o)} style={{ background:tk.CARD2, color:tk.T1 }} className="flex items-center gap-1 text-[12px] font-semibold px-3 py-1.5 rounded-full flex-shrink-0">
                  <Download size={13} /> Descargar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── ACTIVITY ─────────────────────────────────────────────────── */
function CFG_ActivityScreen({ settings, nav }) {
  const tk = CFG_useTk();
  const ac = settings.activity;
  const maxH = Math.max(...ac.history.map(h => h.purchases + h.sales));
  return (
    <div style={{ background:tk.BG }} className="">
      <CFG_Hdr title="Actividad" onBack={() => nav("home")} />
      <CFG_Lbl>Resumen</CFG_Lbl>
      <div className="mx-4 grid grid-cols-2 gap-2">
        {[
          { label:"Compras",  value:ac.purchases.total, sub:ac.purchases.amount, Icon:ShoppingBag, bg:"bg-violet-600" },
          { label:"Ventas",   value:ac.sales.total,     sub:ac.sales.amount,     Icon:TrendingUp,  bg:"bg-emerald-600" },
          { label:"Pedidos",  value:`${ac.orders.completed}/${ac.orders.made}`, sub:"completados", Icon:Package, bg:"bg-blue-600" },
          { label:"Subastas", value:`${ac.auctions.won}/${ac.auctions.participated}`, sub:"ganadas", Icon:Award, bg:"bg-amber-600" },
        ].map(s => (
          <div key={s.label} style={{ background:tk.ROW, borderColor:tk.CARD_BD }} className="rounded-xl p-3 border">
            <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
              <s.Icon size={14} className="text-white" />
            </div>
            <div style={{ color:tk.T1 }} className="text-[22px] font-black leading-none">{s.value}</div>
            <div style={{ color:tk.T2 }} className="text-[10px] mt-1">{s.label}</div>
            <div style={{ color:tk.P  }} className="text-[10px] font-bold">{s.sub}</div>
          </div>
        ))}
      </div>
      <CFG_Lbl>Historial mensual</CFG_Lbl>
      <CFG_Crd>
        <div style={{ background:tk.ROW }} className="px-3.5 pt-3 pb-2.5">
          <div className="flex items-end gap-1.5 h-20 mb-2">
            {ac.history.map(m => {
              const total = m.purchases + m.sales;
              return (
                <div key={m.label} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col justify-end gap-px" style={{ height:`${(total/maxH)*100}%` }}>
                    <div style={{ height:`${(m.purchases/total)*100}%`, background:tk.P  }} className="w-full rounded-t min-h-px" />
                    <div style={{ height:`${(m.sales/total)*100}%`, background:"#22C55E" }} className="w-full rounded-b min-h-px" />
                  </div>
                  <div style={{ color:tk.T3 }} className="text-[9px] mt-1">{m.label}</div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-3">
            <div className="flex items-center gap-1"><div style={{ background:tk.P      }} className="w-2 h-2 rounded-sm" /><span style={{ color:tk.T2 }} className="text-[10px]">Compras</span></div>
            <div className="flex items-center gap-1"><div style={{ background:"#22C55E" }} className="w-2 h-2 rounded-sm" /><span style={{ color:tk.T2 }} className="text-[10px]">Ventas</span></div>
          </div>
        </div>
      </CFG_Crd>
      <div className="h-8" />
    </div>
  );
}

/* ── LANGUAGE ─────────────────────────────────────────────────── */
function CFG_LanguageScreen({ settings, upd, nav }) {
  const tk = CFG_useTk();
  const { language } = settings;
  const langs = [
    { code:"es", label:"Español",   flag:"🇪🇸", sub:"España"        },
    { code:"en", label:"English",   flag:"🇺🇸", sub:"United States" },
    { code:"pt", label:"Português", flag:"🇧🇷", sub:"Brasil"        },
    { code:"fr", label:"Français",  flag:"🇫🇷", sub:"France"        },
    { code:"de", label:"Deutsch",   flag:"🇩🇪", sub:"Deutschland"   },
    { code:"it", label:"Italiano",  flag:"🇮🇹", sub:"Italia"        },
  ];
  return (
    <div style={{ background:tk.BG }} className="">
      <CFG_Hdr title="Idioma" onBack={() => nav("home")} />
      <CFG_Lbl>Seleccionar idioma</CFG_Lbl>
      <CFG_Crd>
        {langs.map((l, i) => (
          <div key={l.code}>
            {i > 0 && <CFG_Hr />}
            <button onClick={() => upd("language", l.code)} style={{ background:tk.ROW }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left active:opacity-60">
              <span className="text-xl w-8 text-center flex-shrink-0">{l.flag}</span>
              <div className="flex-1">
                <div style={{ color:tk.T1 }} className="text-[14px] font-medium">{l.label}</div>
                <div style={{ color:tk.T2 }} className="text-[11px]">{l.sub}</div>
              </div>
              {language === l.code && (
                <div style={{ background:tk.P }} className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check size={10} className="text-white" strokeWidth={3} />
                </div>
              )}
            </button>
          </div>
        ))}
      </CFG_Crd>
      <div className="h-8" />
    </div>
  );
}

/* ── STORAGE ──────────────────────────────────────────────────── */
function CFG_StorageScreen({ settings, upd, nav, flash }) {
  const tk = CFG_useTk();
  const CATS = {
    conversaciones: ["retador_chatmsgs", "retador_chatpeople", "retador_delconvs", "retador_blocked"],
    contenido: ["retador_products", "retador_orders", "retador_auctions", "retador_reports", "retador_verifs", "retador_promoreq", "retador_planreq", "retador_payments", "retador_cats", "retador_subcats"],
    billetera: ["retador_wallet", "retador_wallet_banks", "retador_wallet_sec", "retador_wallet_tx"],
    ajustes: ["retador_settings", "retador_admincfg", "retador_theme", "retador_txt_scale", "retador_favs", "retador_verified", "retador_userplans", "retador_editor"],
  };
  const measure = () => {
    const out = {};
    Object.entries(CATS).forEach(([cat, keys]) => {
      let b = 0;
      keys.forEach(k => { try { const v = localStorage.getItem(k); if (v) b += (k.length + v.length) * 2; } catch {} });
      out[cat] = b;
    });
    return out;
  };
  const [usage, setUsage] = useState(measure);
  const fmtSize = (b) => b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1024 / 1024).toFixed(2)} MB`;
  const total = Object.values(usage).reduce((a, b) => a + b, 0);

  const clearCat = (cat) => {
    CATS[cat].forEach(k => { try { localStorage.removeItem(k); } catch {} });
    setUsage(measure());
    flash && flash("🧹 Espacio liberado");
  };

  const META = {
    conversaciones: { label: "Conversaciones", sub: "Mensajes y contactos del chat", color: "#F59E0B", Icon: MessageCircle, clearable: true },
    contenido: { label: "Contenido", sub: "Productos, pedidos y subastas", color: tk.P, Icon: Package, clearable: false },
    billetera: { label: "Billetera", sub: "Saldo, movimientos y cuentas", color: "#22C55E", Icon: Wallet, clearable: false },
    ajustes: { label: "Ajustes y diseño", sub: "Preferencias y configuración", color: "#60A5FA", Icon: HardDrive, clearable: false },
  };

  return (
    <div style={{ background:tk.BG }} className="">
      <CFG_Hdr title="Almacenamiento" onBack={() => nav("home")} />
      <CFG_Lbl>Uso real en este dispositivo</CFG_Lbl>
      <CFG_Crd>
        <div style={{ background:tk.ROW }} className="px-3.5 py-3.5">
          <div className="flex items-baseline gap-1 mb-2.5">
            <span style={{ color:tk.T1 }} className="text-[26px] font-black leading-none">{fmtSize(total).split(" ")[0]}</span>
            <span style={{ color:tk.T2 }} className="text-[12px]">{fmtSize(total).split(" ")[1]}</span>
          </div>
          <div style={{ background:tk.CARD2 }} className="h-2 rounded-full overflow-hidden flex">
            {Object.entries(usage).filter(([, b]) => b > 0).map(([cat, b]) => (
              <div key={cat} style={{ width:`${(b/total)*100}%`, background:META[cat].color }} className="h-full" />
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            {Object.entries(usage).map(([cat, b]) => (
              <div key={cat} className="flex items-center gap-1">
                <div style={{ background:META[cat].color }} className="w-1.5 h-1.5 rounded-full" />
                <span style={{ color:tk.T2 }} className="text-[10px]">{META[cat].label} {fmtSize(b)}</span>
              </div>
            ))}
          </div>
        </div>
      </CFG_Crd>

      <CFG_Lbl>Gestionar</CFG_Lbl>
      <CFG_Crd>
        {Object.entries(META).map(([cat, m], i) => (
          <div key={cat}>
            {i > 0 && <CFG_Hr />}
            <div style={{ background:tk.ROW }} className="flex items-center gap-2.5 px-3.5 py-2.5">
              <div style={{ background:m.color+"22" }} className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
                <m.Icon size={14} style={{ color:m.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ color:tk.T1 }} className="text-[14px] font-medium">{m.label}</div>
                <div style={{ color:tk.T2 }} className="text-[11px]">{fmtSize(usage[cat])} · {m.sub}</div>
              </div>
              {m.clearable
                ? <button onClick={() => clearCat(cat)} style={{ background:tk.ERR_BG, color:tk.ERR_T }} className="text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0">Limpiar</button>
                : <span style={{ color:tk.T3 }} className="text-[10px] flex-shrink-0">Tus datos</span>}
            </div>
          </div>
        ))}
      </CFG_Crd>

      <div style={{ background:tk.OK_BG, borderColor:tk.OK_T+"44" }} className="mx-4 mt-2.5 rounded-xl px-3.5 py-2.5 border">
        <div className="flex items-start gap-2">
          <Info size={13} style={{ color:tk.OK_T, marginTop:1, flexShrink:0 }} />
          <p style={{ color:tk.OK_T }} className="text-[11px] leading-snug">Las fotos de productos y subastas se ven directamente sin descargarse, así que casi no ocupan espacio. Solo se guarda lo que descargas a propósito.</p>
        </div>
      </div>
      <div className="h-8" />
    </div>
  );
}

/* ── HELP ─────────────────────────────────────────────────────── */
function CFG_HelpScreen({ nav, flash }) {
  const tk = CFG_useTk();
  const [open, setOpen] = useState(null);
  const [report, setReport] = useState(false);
  const [rtext, setRtext] = useState("");
  const FAQ = [
    { q: "¿Cómo publico un producto?", a: "Ve a tu perfil o al botón de publicar, sube al menos una foto, pon título, precio y categoría, y listo: queda visible para todos al instante." },
    { q: "¿Cómo funciona el pago?", a: "Pagas desde tu Billetera. El dinero del producto va al vendedor y, si hay envío, esa parte va al mensajero o a la empresa de envíos, todo desglosado antes de confirmar." },
    { q: "¿Cómo verifico mi cuenta?", a: "En Configuración → Cuenta → Solicitar verificación. Subes tu documento por delante y por detrás; al aprobarse, tu cuenta queda verificada." },
    { q: "¿Cómo participo en una subasta?", a: "Entra a Subastas, abre la que te interese y puja. En las subastas VIP se paga una cuota de acceso que el organizador aprueba." },
    { q: "¿Cómo cambio el idioma o el tema?", a: "En Configuración → Apariencia (tema claro/oscuro y tamaño de texto) y en Idioma. Se aplica a toda la app al instante." },
  ];
  return (
    <div style={{ background:tk.BG }} className="">
      <CFG_Hdr title="Ayuda" onBack={() => nav("home")} />
      <CFG_Lbl>Preguntas frecuentes</CFG_Lbl>
      <CFG_Crd>
        {FAQ.map((f, i) => (
          <div key={i}>
            {i > 0 && <CFG_Hr />}
            <button onClick={() => setOpen(open === i ? null : i)} style={{ background:tk.ROW }} className="w-full text-left px-3.5 py-3 active:opacity-70">
              <div className="flex items-center justify-between gap-2">
                <span style={{ color:tk.T1 }} className="text-[13.5px] font-medium">{f.q}</span>
                <ChevronRight size={14} style={{ color:tk.T3, transform: open===i ? "rotate(90deg)" : "none", transition:"transform .2s", flexShrink:0 }} />
              </div>
              {open === i && <p style={{ color:tk.T2 }} className="text-[12px] mt-2 leading-relaxed">{f.a}</p>}
            </button>
          </div>
        ))}
      </CFG_Crd>
      <CFG_Lbl>Soporte</CFG_Lbl>
      <CFG_Crd>
        <CFG_Row icon={MessageCircle} bg="bg-teal-600" label="Contactar soporte" sub="Te respondemos por correo"
          onClick={() => { try { window.location.href = "mailto:soporte@retador.app?subject=Soporte%20RETADOR"; } catch(e){} flash && flash("📧 Abriendo tu correo…"); }} />
        <CFG_Hr />
        <CFG_Row icon={AlertCircle} bg="bg-orange-600" label="Reportar un problema" sub="Cuéntanos qué pasó" onClick={() => setReport(true)} />
      </CFG_Crd>
      <div className="h-8" />

      {report && (
        <div onClick={() => setReport(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", zIndex:5000, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:tk.BG, width:"100%", maxWidth:440, borderRadius:"18px 18px 0 0", padding:"18px 16px 26px" }}>
            <div style={{ color:tk.T1 }} className="text-[16px] font-bold mb-1">Reportar un problema</div>
            <div style={{ color:tk.T2 }} className="text-[12px] mb-3">Describe el problema y lo revisamos.</div>
            <textarea value={rtext} onChange={e=>setRtext(e.target.value)} rows={4} placeholder="¿Qué pasó?"
              style={{ background:tk.CARD2, color:tk.T1, borderColor:"rgba(128,128,128,.25)" }} className="w-full rounded-xl px-3 py-2.5 text-[14px] border outline-none resize-none mb-3" />
            <div className="flex gap-2.5">
              <button onClick={() => setReport(false)} style={{ background:tk.CARD2, color:tk.T1 }} className="flex-1 h-11 rounded-xl text-[13px] font-semibold">Cancelar</button>
              <button onClick={() => { setReport(false); setRtext(""); flash && flash("✅ Reporte enviado. ¡Gracias!"); }} disabled={!rtext.trim()}
                style={{ background: rtext.trim() ? "#FFC01E" : tk.CARD2, color: rtext.trim() ? "#000" : tk.T3 }} className="flex-1 h-11 rounded-xl text-[13px] font-bold">Enviar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── ABOUT ────────────────────────────────────────────────────── */
function CFG_AboutScreen({ nav }) {
  const tk = CFG_useTk();
  return (
    <div style={{ background:tk.BG }} className="">
      <CFG_Hdr title="Acerca de" onBack={() => nav("home")} />
      <div className="flex flex-col items-center py-6">
        <div style={{ background:"linear-gradient(135deg,#b8860b,#FFC01E)" }}
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2.5">
          <Gavel size={26} className="text-white" />
        </div>
        <h2 style={{ color:tk.T1 }} className="text-[18px] font-black tracking-tight">RETADOR</h2>
        <div style={{ color:tk.T2 }} className="text-[11px] mt-0.5">Marketplace · Cuba</div>
        <div style={{ background:tk.PL, color:tk.P }} className="mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
          v1.0.0 · Beta
        </div>
      </div>
      <CFG_Lbl>Legal</CFG_Lbl>
      <CFG_Crd>
        <div style={{ background:tk.ROW }} className="px-3.5 py-3 text-center">
          <p style={{ color:tk.T2 }} className="text-[12px]">Política de privacidad, términos y licencias estarán disponibles próximamente.</p>
        </div>
      </CFG_Crd>
      <CFG_Lbl>Información</CFG_Lbl>
      <CFG_Crd>
        {[["Versión","1.0.0"],["Estado","Beta"],["Plataforma","React / Web"],["© 2026","RETADOR"]].map(([k,v],i) => (
          <div key={k}>
            {i > 0 && <CFG_Hr />}
            <div style={{ background:tk.ROW }} className="flex items-center justify-between px-3.5 py-2.5">
              <span style={{ color:tk.T2 }} className="text-[13px]">{k}</span>
              <span style={{ color:tk.T1 }} className="text-[13px] font-medium">{v}</span>
            </div>
          </div>
        ))}
      </CFG_Crd>
      <div className="h-8" />
    </div>
  );
}

/* ── APP ──────────────────────────────────────────────────────── */
export function SettingsScreen({ user, onBack, onSignOut, onUpdate, flash, appTheme="auto", onThemeChange, imgScale=1, onImgScaleChange, appTextScale=1, onTextScaleChange, profileData={}, onProfileUpdate, isVerified=false, onRequestVerification, accountPassword="", onSetPassword, blockedUsers=[], onToggleBlock, onOpenWallet, orders=[], productView="grid", onProductViewChange }) {
  const [screen, setScreen]     = useState("home");
  const me0 = profileData?.name || user?.name || "Usuario";
  const [profile, setProfile]   = useState({
    name: me0,
    email: profileData?.email || user?.email || "",
    phone: profileData?.phone || "",
    verified: isVerified,
    initials: me0.trim().split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase(),
    memberSince: profileData?.memberSince || "2026",
  });
  // refleja cambios externos de verificación
  useEffect(() => { setProfile(p => ({ ...p, verified: isVerified })); }, [isVerified]);
  const [settings, setSettings] = useState(() => {
    try { const r = localStorage.getItem("retador_settings"); if (r) return { ...CFG_INIT, ...JSON.parse(r) }; } catch {}
    return CFG_INIT;
  });
  useEffect(() => { try { localStorage.setItem("retador_settings", JSON.stringify(settings)); } catch {} }, [settings]);
  function nav(s) { setScreen(s); try { window.scrollTo(0,0); } catch(e){} }
  function upd(key, val) { setSettings(prev => ({ ...prev, [key]:val })); }

  const tk = appTheme==="light" ? CFG_LIGHT
           : appTheme==="dark"  ? CFG_DARK
           : (typeof window!=="undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches ? CFG_DARK : CFG_LIGHT);

  const saveProfile = (updater) => setProfile(prev => {
    const next = typeof updater === "function" ? updater(prev) : updater;
    onProfileUpdate && onProfileUpdate(pd => ({ ...(pd || {}), name: next.name, email: next.email, phone: next.phone, initials: next.initials }));
    return next;
  });

  const p = { profile, setProfile: saveProfile, settings, upd, nav, appScale:imgScale, onScale:onImgScaleChange, onBack, onSignOut, onThemeChange, appTheme, appTextScale, onTextScaleChange, flash, isVerified, onRequestVerification, accountPassword, onSetPassword, blockedUsers, onToggleBlock, onOpenWallet, orders, productView, onProductViewChange };
  const map = {
    home:          <CFG_HomeScreen          {...p} />,
    account:       <CFG_AccountScreen       {...p} />,
    appearance:    <CFG_AppearanceScreen    {...p} />,
    notifications: <CFG_NotificationsScreen {...p} />,
    privacy:       <CFG_PrivacyScreen       {...p} />,
    chat:          <CFG_ChatScreen          {...p} />,
    deliveries:    <CFG_DeliveriesScreen    {...p} />,
    auctions:      <CFG_AuctionsScreen      {...p} />,
    payments:      <CFG_PaymentsScreen      {...p} />,
    activity:      <CFG_ActivityScreen      {...p} />,
    language:      <CFG_LanguageScreen      {...p} />,
    storage:       <CFG_StorageScreen       {...p} />,
    help:          <CFG_HelpScreen          {...p} />,
    about:         <CFG_AboutScreen         {...p} />,
  };
  return (
    <CFG_ThemeCtx.Provider value={tk}>
      <div style={{
        fontFamily:"-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
        position:"fixed", inset:0, zIndex:300, overflowY:"auto", background:tk.BG,
      }}>
        {map[screen] ?? map.home}
      </div>
    </CFG_ThemeCtx.Provider>
  );
}
