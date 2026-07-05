import { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo } from "react";
import { LiveSlot, pushBackHandler, useAt, useScrollDir } from "../shared/index.js";

const VIP_ACCESS_MIN = 50;
const VIP_ACCESS_MAX = 500;

// ─── DATA ─────────────────────────────────────────────────────────────────────
const AUCTIONS = [
  {
    id: 1, vip: false,
    title: "Jordan 1 Retro High OG",
    subtitle: "Chicago · Talla 10US · Deadstock",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&q=90",
    currentBid: 4850, bidders: 38, endsIn: 247, status: "HOT", lastBid: "12s",
    seller: { name: "AlexKicks", rating: 4.9, sales: 312, verified: true },
    watching: 24, startPrice: 1200,
  },
  {
    id: 2, vip: true,
    title: "Patek Philippe Nautilus 5711",
    subtitle: "Blue Dial · Ref. 5711/1A-010",
    image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=900&q=90",
    currentBid: 280000, bidders: 9, endsIn: 10800, status: "VIP", lastBid: "4m",
    accessFee: 500,
    seller: { name: "Vault_MX", rating: 5.0, sales: 847, verified: true },
    watching: 61, startPrice: 200000,
  },
  {
    id: 3, vip: false,
    title: "Rolex Submariner 124060",
    subtitle: "No Date · Full set 2024",
    image: "https://images.unsplash.com/photo-1548171916-c8fd4f9a4f94?w=900&q=90",
    currentBid: 42000, bidders: 61, endsIn: 183, status: "TERMINANDO", lastBid: "8s",
    seller: { name: "WatchVault", rating: 4.8, sales: 521, verified: true },
    watching: 88, startPrice: 30000,
  },
  {
    id: 4, vip: false,
    title: "Supreme Box Logo Hoodie FW24",
    subtitle: "Black · Talla L · Nueva con etiqueta",
    image: "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=900&q=90",
    currentBid: 8500, bidders: 33, endsIn: 5400, status: "NUEVA", lastBid: "2m",
    seller: { name: "DropDealer", rating: 4.7, sales: 189, verified: true },
    watching: 17, startPrice: 3500,
  },
  {
    id: 5, vip: true,
    title: "Bugatti Chiron 1:18 Scale",
    subtitle: "Edición limitada · Numerada 007/200",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=900&q=90",
    currentBid: 45000, bidders: 4, endsIn: 86400, status: "VIP", lastBid: "18m",
    accessFee: 100,
    seller: { name: "CollectMX", rating: 4.9, sales: 233, verified: true },
    watching: 29, startPrice: 30000,
  },
  {
    id: 6, vip: false,
    title: "Off-White x Nike AF1 The Ten",
    subtitle: "DS · Talla 11US · Caja original",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&q=90",
    currentBid: 12800, bidders: 56, endsIn: 91, status: "TERMINANDO", lastBid: "5s",
    seller: { name: "SneakerMx", rating: 4.9, sales: 401, verified: true },
    watching: 112, startPrice: 5000,
  },
  {
    id: 7, vip: false,
    title: "MacBook Pro M4 Max 16\"",
    subtitle: "Space Black · 48GB · 1TB SSD",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=900&q=90",
    currentBid: 52000, bidders: 12, endsIn: 43200, status: "NUEVA", lastBid: "11m",
    seller: { name: "TechVault", rating: 4.6, sales: 97, verified: true },
    watching: 8, startPrice: 40000,
  },
];

const SAMPLE_HISTORY = [
  { user: "AlexM***", amount: 4850, time: "12s", top: true },
  { user: "Retador_9", amount: 4700, time: "41s", top: false },
  { user: "SneakKing", amount: 4550, time: "1m",  top: false },
  { user: "J.Prado",   amount: 4200, time: "2m",  top: false },
  { user: "MaxBid_01", amount: 3900, time: "3m",  top: false },
];

const HERO_IDS  = [1, 3, 6];
const FILTERS   = ["Todas", "🔥 Hot", "⏳ Finalizan", "✨ Nuevas", "🔒 VIP"];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const NF = (n) => n?.toLocaleString("es-MX") ?? "—";

function clock(s) {
  if (s <= 0) return "00:00";
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h > 0)
    return `${pad(h)}:${pad(m)}:${pad(sec)}`;
  return `${pad(m)}:${pad(sec)}`;
}
const pad = (n) => String(n).padStart(2, "0");

function heat(s) {
  if (s < 120)  return "critical";
  if (s < 600)  return "high";
  if (s < 3600) return "medium";
  return "low";
}

// ─── HOOKS ────────────────────────────────────────────────────────────────────
function useTimer(init) {
  const [s, set] = useState(init);
  useEffect(() => {
    const t = setInterval(() => set((p) => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  return s;
}


// ─── ATOMS ────────────────────────────────────────────────────────────────────
function CD({ seconds, size = "md" }) {
  const h = heat(seconds);
  return (
    <span className={`cd cd-${size} cd-${h}`}>
      {clock(seconds).split("").map((c, i) =>
        c === ":" ? <span key={i} className="cd-sep">:</span>
                  : <span key={i} className="cd-d">{c}</span>
      )}
    </span>
  );
}

function AucLive() {
  return (
    <span className="live">
      <span className="live-dot" />LIVE
    </span>
  );
}

function AucBadge({ status }) {
  const cls = {
    HOT: "b-hot", TERMINANDO: "b-end", NUEVA: "b-new", VIP: "b-vip",
  };
  const label = { HOT: "🔥 HOT", TERMINANDO: "⏳ Termina", NUEVA: "✨ Nueva", VIP: "VIP ACCESS" };
  return <span className={`badge ${cls[status] ?? ""}`}>{label[status] ?? status}</span>;
}

function AucBell({ id, set, onToggle }) {
  const on = set.has(id);
  const [pop, setPop] = useState(false);
  const tap = (e) => {
    e.stopPropagation();
    setPop(true);
    setTimeout(() => setPop(false), 500);
    onToggle(id);
  };
  return (
    <button className={`bell ${on ? "bell-on" : ""} ${pop ? "bell-pop" : ""}`} onClick={tap} aria-label="Seguir">
      <svg width="14" height="14" viewBox="0 0 24 24"
        fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    </button>
  );
}

function AucToast({ msg, show }) {
  return (
    <div className={`toast ${show ? "toast-on" : ""}`}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {msg}
    </div>
  );
}

function AucSkel({ w = "100%", h = 12, r = 6 }) {
  return <span className="skel" style={{ width: w, height: h, borderRadius: r, display: "block" }} />;
}

// ─── HERO CARD ────────────────────────────────────────────────────────────────
function HeroCard({ a, onClick, followed, onToggle }) {
  const s = useTimer(a.endsIn);
  return (
    <div className={`hc hc-${heat(s)}`} onClick={() => onClick(a)}>
      <img src={a.image} alt="" className="hc-img" />
      <div className="hc-grad" />
      <div className="hc-top">
        <AucBadge status={a.status} />
        <div className="hc-top-r">
          <AucLive />
          <AucBell id={a.id} set={followed} onToggle={onToggle} />
        </div>
      </div>
      <div className="hc-body">
        <p className="hc-seller">{a.seller.name}{a.seller.verified && " ✦"}</p>
        <h3 className="hc-title">{a.title}</h3>
        <div className="hc-stats">
          <div>
            <span className="lbl">Puja actual</span>
            <span className="hc-bid">{NF(a.currentBid)} <em>USD</em></span>
          </div>
          <div style={{ textAlign: "right" }}>
            <span className="lbl">Restante</span>
            <CD seconds={s} size="lg" />
          </div>
        </div>
        <div className="hc-foot">
          <span className="meta">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
            {a.watching}
          </span>
          <span className="meta">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
            {a.bidders}
          </span>
          <button className="hc-btn" onClick={(e) => { e.stopPropagation(); onClick(a); }}>
            {a.vip ? "VER" : "PUJAR"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── VIP CARD ─────────────────────────────────────────────────────────────────
function VipCard({ a, onClick, followed, onToggle }) {
  const s = useTimer(a.endsIn);
  return (
    <div className="vc" onClick={() => onClick(a)}>
      <div className="vc-img-wrap">
        <img src={a.image} alt="" className="vc-img" />
        <div className="vc-veil" />
        <div className="vc-lock">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#FFC01E" strokeWidth="1.8">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <span className="vip-pill">VIP ACCESS</span>
        <AucLive />
        <div className="vc-bell"><AucBell id={a.id} set={followed} onToggle={onToggle} /></div>
      </div>
      <div className="vc-body">
        <h3 className="vc-title">{a.title}</h3>
        <p className="vc-sub">{a.subtitle}</p>
        <div className="vc-row">
          <div>
            <span className="lbl">Part. VIP</span>
            <span className="vc-val">{a.bidders} activos</span>
          </div>
          <div style={{ textAlign: "right" }}>
            <span className="lbl">Cierra en</span>
            <CD seconds={s} size="sm" />
          </div>
        </div>
        <div className="vc-seller">
          <span className="vc-dot" />
          <span className="vc-sname">{a.seller.name}</span>
          <span className="vc-rating">★ {a.seller.rating}</span>
        </div>
        <div className="vc-access">
          <div className="vc-access-hint">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
            Ver gratis
            <span className="vc-sep">·</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FFC01E" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            <span className="vc-access-vip">Pujar requiere VIP</span>
          </div>
          <button className="vc-btn" onClick={(e) => { e.stopPropagation(); onClick(a); }}>
            Ver →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── FEED CARD ────────────────────────────────────────────────────────────────
function FeedCard({ a, onClick, followed, onToggle }) {
  const s  = useTimer(a.endsIn);
  const pct = a.startPrice
    ? Math.min(100, Math.round(((a.currentBid - a.startPrice) / a.startPrice) * 100))
    : 20;
  return (
    <div className={`fc fc-${heat(s)}`} onClick={() => onClick(a)}>
      <div className="fc-img-wrap">
        <img src={a.image} alt="" className="fc-img" />
        {a.status === "HOT" && <span className="hot-pip" />}
      </div>
      <div className="fc-body">
        <div className="fc-head">
          <AucBadge status={a.status} />
          <div className="fc-head-r">
            {a.seller.verified && (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="#FFC01E">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            )}
            <AucBell id={a.id} set={followed} onToggle={onToggle} />
          </div>
        </div>
        <h4 className="fc-title">{a.title}</h4>
        <p className="fc-sub">{a.subtitle}</p>
        <div className="prog"><div className="prog-fill" style={{ width: `${Math.max(8, pct)}%` }} /></div>
        <div className="fc-activity">
          <span className="act-pip" />
          <span className="act-txt">Última puja hace {a.lastBid} · {a.watching} observando</span>
        </div>
        <div className="fc-bottom">
          <div>
            <span className="fc-bid">{NF(a.currentBid)}<em> USD</em></span>
            <span className="fc-count">{a.bidders} pujas</span>
          </div>
          <div className="fc-right">
            <CD seconds={s} size="sm" />
            <button className="fc-btn" onClick={(e) => { e.stopPropagation(); onClick(a); }}>PUJAR</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── VIP ACTIVATE MODAL ───────────────────────────────────────────────────────
function VipActivateModal({ a, onClose, onActivate }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="vam" onClick={(e) => e.stopPropagation()}>
        {/* blurred image top */}
        <div className="vam-img-wrap">
          <img src={a.image} alt="" className="vam-img" />
          <div className="vam-img-grad" />
          <span className="vip-pill" style={{ position: "absolute", top: 14, left: 14 }}>VIP ACCESS</span>
        </div>

        <div className="vam-body">
          {/* lock icon */}
          <div className="vam-lock">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFC01E" strokeWidth="1.8">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <h2 className="vam-title">VIP ACCESS</h2>
          <p className="vam-sub">Participación exclusiva para compradores activos.</p>

          {/* fee */}
          <div className="vam-fee">
            <span className="vam-fee-amt">{NF(a.accessFee)} <em>USD</em></span>
            <span className="vam-fee-lbl">Acceso de participación</span>
          </div>

          <p className="vam-note">
            Activa tu acceso VIP para competir en esta subasta exclusiva.
            Una vez activado podrás realizar pujas libremente durante toda la subasta.
          </p>

          {/* stats */}
          <div className="vam-stats">
            <div className="vam-stat"><span className="vam-sv">{a.watching}</span><span className="vam-sl">Observando</span></div>
            <div className="vam-sdiv" />
            <div className="vam-stat"><span className="vam-sv">{a.bidders}</span><span className="vam-sl">Part. VIP</span></div>
            <div className="vam-sdiv" />
            <div className="vam-stat"><span className="vam-sv">{a.seller.rating}</span><span className="vam-sl">Rating</span></div>
          </div>

          <button className="vam-cta" onClick={onActivate}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Activar VIP Access
          </button>
          <button className="vam-cancel" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ─── SEARCH OVERLAY ───────────────────────────────────────────────────────────
function SearchOverlay({ onClose }) {
  const ref = useRef(null);
  useEffect(() => { setTimeout(() => ref.current?.focus(), 120); }, []);
  return (
    <div className="overlay search-overlay" onClick={onClose}>
      <div className="search-box" onClick={(e) => e.stopPropagation()}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(250,250,250,0.35)" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input ref={ref} className="search-inp" placeholder="Buscar subastas…" />
        <button className="search-x" onClick={onClose}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <p className="search-hint">Busca por nombre, categoría o vendedor</p>
    </div>
  );
}

// ─── SIGUIENDO VIEW ───────────────────────────────────────────────────────────
function SiguiendoView({ followed, onClose, onSelect, onToggle }) {
  const items = AUCTIONS.filter((a) => followed.has(a.id));
  return (
    <div className="sig-root">
      <div className="sig-header">
        <button className="round-btn" onClick={onClose}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div style={{ flex: 1 }}>
          <h2 className="sig-title">SIGUIENDO</h2>
          <p className="sig-platform">RETADOR <span>Marketplace</span></p>
        </div>
        {items.length > 0 && <span className="sig-count">{items.length}</span>}
      </div>

      <div className="sig-scroll">
        {items.length === 0 ? (
          <div className="sig-empty">
            <div className="sig-empty-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(248,248,248,0.18)" strokeWidth="1.5">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <p className="sig-empty-t">Sin subastas seguidas</p>
            <p className="sig-empty-s">Toca 🔔 en cualquier subasta para recibir avisos en tiempo real.</p>
          </div>
        ) : (
          <div className="sig-list">
            {items.map((a, i) => <SigCard key={a.id} a={a} onSelect={onSelect} onToggle={onToggle} i={i} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function SigCard({ a, onSelect, onToggle, i }) {
  const s = useTimer(a.endsIn);
  return (
    <div className={`sigc sigc-${heat(s)}`} style={{ animationDelay: `${i * 55}ms` }} onClick={() => onSelect(a)}>
      <div className="sigc-img">
        {a.vip && <div className="sigc-veil" />}
        <img src={a.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 10, filter: a.vip ? "blur(4px) brightness(.5)" : "none" }} />
        {a.vip && (
          <div className="sigc-lock">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FFC01E" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
        )}
      </div>
      <div className="sigc-body">
        <div className="sigc-top">
          <AucBadge status={a.status} />
          <AucBell id={a.id} set={new Set([a.id])} onToggle={onToggle} />
        </div>
        <p className="sigc-title">{a.title}</p>
        <div className="sigc-meta">
          <CD seconds={s} size="sm" />
          <span className="sigc-bid" style={{ color: a.vip ? "var(--gold)" : "var(--w70)" }}>
            {a.vip ? `${NF(a.accessFee)} USD acceso` : `${NF(a.currentBid)} USD`}
          </span>
        </div>
        <div className="fc-activity" style={{ marginTop: 4 }}>
          <span className="act-pip" />
          <span className="act-txt">Última puja hace {a.lastBid} · {a.watching} viendo</span>
        </div>
      </div>
    </div>
  );
}

// ─── DETAIL VIEW ──────────────────────────────────────────────────────────────
const INCREMENTS = [10, 50, 100, 500];

function DetailView({ a, onBack, followed, onToggle }) {
  const scrollRef  = useRef(null);
  const customRef  = useRef(null);
  const dir        = useScrollDir(scrollRef);
  const rawSeconds = useTimer(a.endsIn);

  const [currentBid,  setCurrentBid]  = useState(a.currentBid);
  const [bidCount,    setBidCount]    = useState(a.bidders);
  const [history,     setHistory]     = useState(
    SAMPLE_HISTORY.map((h, i) => ({ ...h, amount: a.currentBid - i * 150 }))
  );
  const [selectedInc, setSelectedInc] = useState(null);   // number | "custom" | null
  const [customAmt,   setCustomAmt]   = useState("");
  const [flash,       setFlash]       = useState(false);
  const [vipReady,    setVipReady]    = useState(false);
  const [showVipModal,setShowVipModal]= useState(false);

  const ended     = rawSeconds === 0;
  const increment = selectedInc === "custom" ? (parseInt(customAmt, 10) || 0) : (selectedInc ?? 0);
  const nextBid   = currentBid + increment;
  const canBid    = !ended && increment > 0 && (!a.vip || vipReady);

  const selectInc = (val) => {
    setSelectedInc((prev) => prev === val ? null : val);
    if (val === "custom") setTimeout(() => customRef.current?.focus(), 80);
  };

  const doBid = () => {
    if (!canBid) return;
    setFlash(true);
    setCurrentBid(nextBid);
    setBidCount((n) => n + 1);
    setHistory((prev) => [
      { user: "Tú", amount: nextBid, time: "ahora", top: true },
      ...prev.slice(0, 4).map((h) => ({ ...h, top: false })),
    ]);
    setSelectedInc(null);
    setCustomAmt("");
    setTimeout(() => setFlash(false), 1600);
  };

  const activateVip = () => { setShowVipModal(false); setTimeout(() => setVipReady(true), 300); };
  const hidden = dir === "down";

  return (
    <div className="dv-root">
      {showVipModal && (
        <VipActivateModal a={a} onClose={() => setShowVipModal(false)} onActivate={activateVip} />
      )}

      {/* floating back */}
      <button className={`float-btn float-back ${hidden ? "float-hidden" : ""}`} onClick={onBack} aria-label="Volver">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
      </button>

      {/* floating bell */}
      <div className={`float-btn float-bell ${hidden ? "float-hidden" : ""}`}>
        <AucBell id={a.id} set={followed} onToggle={onToggle} />
      </div>

      <div className="dv-scroll" ref={scrollRef}>

        {/* hero image */}
        <div className="dv-hero">
          <img src={a.image} alt="" className="dv-hero-img" />
          <div className="dv-hero-grad" />
          <div className="dv-hero-badges">
            <AucLive />
            {a.vip   && <AucBadge status="VIP" />}
            {!a.vip  && a.status === "TERMINANDO" && <AucBadge status="TERMINANDO" />}
          </div>
          <div className="dv-watching">
            <span className="w-dot" />{a.watching} viendo
          </div>
        </div>

        <div className="dv-body">

          {/* title */}
          <div className="dv-title-block">
            <span className="dv-seller-row">
              {a.seller.name}
              {a.seller.verified && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#FFC01E">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              )}
            </span>
            <h1 className="dv-title">{a.title}</h1>
            <p className="dv-sub">{a.subtitle}</p>
          </div>

          {/* VIP activity indicators — only for VIP auctions */}
          {a.vip && (
            <div className="vip-activity">
              <div className="vip-act-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                <span><b>{a.watching}</b> observando</span>
              </div>
              <div className="vip-act-div" />
              <div className="vip-act-item" style={{ color: "var(--gold)" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFC01E" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span><b>{a.bidders}</b> participantes VIP</span>
              </div>
            </div>
          )}

          {/* countdown */}
          <div className="dv-cd-block">
            <span className="dv-cd-lbl">{ended ? "SUBASTA FINALIZADA" : "TIEMPO RESTANTE"}</span>
            <CD seconds={rawSeconds} size="xl" />
          </div>

          {/* ended banner */}
          {ended && (
            <div className="ended-banner">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Esta subasta ha finalizado. No se aceptan más pujas.
            </div>
          )}

          {/* price row — updates live */}
          <div className="dv-price-row">
            <div>
              <span className="lbl">Puja actual</span>
              <span className={`dv-price ${flash ? "dv-price-flash" : ""}`}>
                {NF(currentBid)} <em>USD</em>
              </span>
            </div>
            <div className="dv-bidders">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFC01E" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              {bidCount} pujas
            </div>
          </div>

          {/* VIP activated badge */}
          {a.vip && vipReady && (
            <div className="vip-ready-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#30D158" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              VIP Access Activado · Pujas ilimitadas en esta subasta
            </div>
          )}

          {/* ── BID AREA ── */}
          {!ended && (
            a.vip && !vipReady ? (
              <button className="vip-locked-btn" onClick={() => setShowVipModal(true)}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Activar VIP Access para participar
                <span className="vip-locked-fee">{NF(a.accessFee)} USD</span>
              </button>
            ) : (
              <div className="bid-area">
                <div className="bid-area-header">
                  <span className="bid-area-lbl">Elige el incremento</span>
                  {selectedInc !== null && (
                    <button className="bid-clear" onClick={() => { setSelectedInc(null); setCustomAmt(""); }}>
                      Limpiar
                    </button>
                  )}
                </div>

                {/* increment chips */}
                <div className="inc-grid">
                  {INCREMENTS.map((n) => (
                    <button
                      key={n}
                      className={`inc-chip ${selectedInc === n ? "inc-chip-on" : ""}`}
                      onClick={() => selectInc(n)}
                    >+{NF(n)}</button>
                  ))}
                  <button
                    className={`inc-chip inc-chip-other ${selectedInc === "custom" ? "inc-chip-on" : ""}`}
                    onClick={() => selectInc("custom")}
                  >Otro</button>
                </div>

                {/* custom amount input */}
                {selectedInc === "custom" && (
                  <div className="custom-wrap">
                    <span className="custom-prefix">+</span>
                    <input
                      ref={customRef}
                      className="custom-inp"
                      type="number"
                      min="1"
                      placeholder="Escribe el importe"
                      value={customAmt}
                      onChange={(e) => setCustomAmt(e.target.value.replace(/\D/g, ""))}
                      onKeyDown={(e) => { if (e.key === "Enter" && canBid) doBid(); }}
                    />
                    <span className="custom-unit">USD</span>
                  </div>
                )}

                {/* preview — only when increment selected */}
                {increment > 0 && (
                  <div className="bid-preview">
                    <span className="bp-base">{NF(currentBid)}</span>
                    <span className="bp-op">+{NF(increment)}</span>
                    <span className="bp-eq">=</span>
                    <span className="bp-total">{NF(nextBid)} USD</span>
                  </div>
                )}

                {/* main action button */}
                <button
                  className={`bid-btn ${flash ? "bid-btn-ok" : ""} ${!canBid ? "bid-btn-off" : ""}`}
                  onClick={doBid}
                  disabled={!canBid}
                >
                  {flash ? (
                    <>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      PUJA ENVIADA — {NF(currentBid)} USD
                    </>
                  ) : canBid ? (
                    <>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                      PUJAR — {NF(nextBid)} USD
                    </>
                  ) : (
                    <>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="2 2"><circle cx="12" cy="12" r="10"/></svg>
                      Selecciona un incremento
                    </>
                  )}
                </button>
              </div>
            )
          )}

          {/* bid history */}
          <section className="dv-section">
            <h3 className="sec-title">Historial de pujas</h3>
            <div className="hist-list">
              {history.map((h, i) => (
                <div key={i} className={`hist-item ${h.top ? "hist-top" : ""}`}>
                  <div className="hist-av">{h.user[0]}</div>
                  <div className="hist-info">
                    <span className="hist-user">{h.user}</span>
                    <span className="hist-time">hace {h.time}</span>
                  </div>
                  <span className="hist-amt">{NF(h.amount)} USD</span>
                  {h.top && <span>👑</span>}
                </div>
              ))}
            </div>
          </section>

          {/* seller */}
          <section className="dv-section">
            <h3 className="sec-title">Vendedor</h3>
            <div className="seller-card">
              <div className="seller-av">{a.seller.name[0]}</div>
              <div style={{ flex: 1 }}>
                <span className="seller-name">{a.seller.name}</span>
                <span className="seller-rating">{"★".repeat(5)} <em>{a.seller.rating} · {a.seller.sales} ventas</em></span>
              </div>
              {a.seller.verified && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFC01E">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

// ─── CREATE AUCTION ───────────────────────────────────────────────────────────
const DURATIONS = [
  { label: "1 hora",   value: 3600 },
  { label: "3 horas",  value: 10800 },
  { label: "6 horas",  value: 21600 },
  { label: "12 horas", value: 43200 },
  { label: "24 horas", value: 86400 },
  { label: "48 horas", value: 172800 },
  { label: "7 días",   value: 604800 },
];

const STEPS = ["Producto", "Tipo", "Precio", "Publicar"];

function CreateAuction({ onClose, onPublish, isVerifiedSeller = true }) {
  const { S, B, CARD, T1, T2, T3, isDark } = useAt();
  const [step, setStep]     = useState(0);
  const [form, setForm]     = useState({
    title: "", subtitle: "", images: [],  // array of { url, name }
    type: null,
    accessFee: 100, accessFeeCustom: "", accessFeeMode: "preset",
    featured: false, promoFee: 250,
    startPrice: "", duration: null,
  });
  const [publishing, setPublishing] = useState(false);
  const [done, setDone]             = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const feeValid = form.type !== "vip" || (
    form.accessFeeMode === "preset"
      ? form.accessFee >= 50 && form.accessFee <= 500
      : parseInt(form.accessFeeCustom) >= 50 && parseInt(form.accessFeeCustom) <= 500
  );

  const stepValid = [
    form.title.trim().length >= 3 && form.images.length >= 1,
    form.type !== null && feeValid,
    form.startPrice !== "" && parseInt(form.startPrice) > 0 && form.duration !== null,
    true,
  ];

  const next = () => { if (stepValid[step]) setStep((s) => s + 1); };
  const back = () => setStep((s) => s - 1);

  const doPublish = () => {
    setPublishing(true);
    setTimeout(() => {
      setPublishing(false);
      setDone(true);
      setTimeout(() => {
        onPublish({
          id: Date.now(),
          vip: form.type === "vip",
          title: form.title.trim(),
          subtitle: form.subtitle.trim() || "Sin descripción",
          image: form.images.length > 0 ? form.images[0].url : "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&q=90",
          currentBid: parseInt(form.startPrice),
          bidders: 0,
          endsIn: form.duration,
          status: form.type === "vip" ? "VIP" : "NUEVA",
          lastBid: "—",
          accessFee: form.type === "vip" ? form.accessFee : undefined,
          featured: !!form.featured, promoFee: form.featured ? form.promoFee : undefined,
          seller: { name: "Tú", rating: 5.0, sales: 1, verified: true },
          watching: 0,
          startPrice: parseInt(form.startPrice),
        });
        onClose();
      }, 1200);
    }, 1400);
  };

  return (
    <div className="ca-root">
      {/* header */}
      <div className="ca-header">
        <button className="round-btn" onClick={onClose}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <div style={{ flex: 1 }}>
          <h2 className="ca-title">NUEVA SUBASTA</h2>
          <p className="ca-platform">RETADOR <span>Marketplace</span></p>
        </div>
        <span className="ca-step-lbl">{step + 1} / {STEPS.length}</span>
      </div>

      {/* step indicator */}
      <div className="ca-steps">
        {STEPS.map((s, i) => (
          <div key={s} className={`ca-step-item ${i === step ? "ca-step-active" : ""} ${i < step ? "ca-step-done" : ""}`}>
            <div className="ca-step-dot">
              {i < step ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg> : i + 1}
            </div>
            <span>{s}</span>
          </div>
        ))}
      </div>

      <div className="ca-body">

        {/* ── STEP 0: Producto ── */}
        {step === 0 && (
          <div className="ca-fields">

            {/* image upload */}
            <div className="ca-field">
              <div className="ca-img-header">
                <label className="ca-lbl">
                  Fotos del producto <span className="ca-req">*</span>
                </label>
                <span className="ca-img-counter">{form.images.length} / 5</span>
              </div>
              <p className="ca-hint" style={{ marginBottom: 10 }}>
                Mínimo 1 foto · Máximo 5 · La primera será la imagen principal
              </p>

              <div className="ca-img-grid">
                {/* existing image previews */}
                {form.images.map((img, i) => (
                  <div key={i} className={`ca-img-thumb ${i === 0 ? "ca-img-thumb-main" : ""}`}>
                    <img src={img.url} alt="" className="ca-img-preview" />
                    {i === 0 && <span className="ca-img-main-badge">Principal</span>}
                    <button className="ca-img-remove"
                      onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, j) => j !== i) }))}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                ))}

                {/* add photo slot */}
                {form.images.length < 5 && (
                  <label className="ca-img-add">
                    <input type="file" accept="image/*" multiple className="ca-file-inp"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        const remaining = 5 - form.images.length;
                        const toAdd = files.slice(0, remaining).map(f => ({
                          url: URL.createObjectURL(f),
                          name: f.name,
                        }));
                        setForm(f => ({ ...f, images: [...f.images, ...toAdd] }));
                        e.target.value = "";
                      }}
                    />
                    <div className="ca-img-add-inner">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <rect x="3" y="3" width="18" height="18" rx="3"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                        <line x1="12" y1="7" x2="12" y2="13" stroke="var(--gold)" strokeWidth="2"/>
                        <line x1="9" y1="10" x2="15" y2="10" stroke="var(--gold)" strokeWidth="2"/>
                      </svg>
                      <span>Añadir{form.images.length === 0 ? " foto" : ""}</span>
                    </div>
                  </label>
                )}
              </div>

              {form.images.length === 0 && (
                <p className="ca-img-required">Al menos una foto es obligatoria</p>
              )}
            </div>

            <div className="ca-field">
              <label className="ca-lbl">Nombre del producto <span className="ca-req">*</span></label>
              <input className="ca-inp" placeholder="Ej: Jordan 1 Retro High OG Chicago" maxLength={60}
                value={form.title} onChange={(e) => set("title", e.target.value)} />
              <span className="ca-char">{form.title.length}/60</span>
            </div>
            <div className="ca-field">
              <label className="ca-lbl">Descripción breve</label>
              <input className="ca-inp" placeholder="Ej: Talla 10US · Deadstock · Caja original" maxLength={80}
                value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
              <span className="ca-char">{form.subtitle.length}/80</span>
            </div>
            <p className="ca-hint">Esta información aparecerá en la card de tu subasta.</p>
          </div>
        )}

        {/* ── STEP 1: Tipo ── */}
        {step === 1 && (
          <div className="ca-fields">
            <p className="ca-section-lbl">Elige el tipo de subasta</p>

            <button className={`ca-type-card ${form.type === "normal" ? "ca-type-on" : ""}`}
              onClick={() => set("type", "normal")}>
              <div className="ca-type-icon ca-type-icon-normal">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                </svg>
              </div>
              <div className="ca-type-info">
                <span className="ca-type-name">Pública</span>
                <span className="ca-type-desc">Cualquier usuario puede ver y pujar libremente.</span>
              </div>
              {form.type === "normal" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFC01E" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
            </button>

            <button
              className={`ca-type-card ca-type-card-vip ${form.type === "vip" ? "ca-type-on ca-type-on-vip" : ""} ${!isVerifiedSeller ? "ca-type-disabled" : ""}`}
              onClick={() => isVerifiedSeller && set("type", "vip")}
            >
              <div className="ca-type-icon ca-type-icon-vip">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFC01E" strokeWidth="1.8">
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <div className="ca-type-info">
                <span className="ca-type-name">VIP ACCESS <span className="ca-type-badge">EXCLUSIVO</span></span>
                <span className="ca-type-desc">
                  {isVerifiedSeller
                    ? "Ver es gratis. Pujar requiere activar VIP Access."
                    : "Solo disponible para vendedores verificados con historial activo."}
                </span>
              </div>
              {form.type === "vip" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFC01E" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
              {!isVerifiedSeller && <div className="ca-type-lock"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>}
            </button>

            {form.type === "vip" && (
              <div className="ca-vip-fee-block">
                <label className="ca-lbl">Coste de acceso VIP <span className="ca-req">*</span></label>
                <p className="ca-hint" style={{ marginBottom: 10 }}>Mínimo 50 USD · Máximo 500 USD</p>

                <div className="ca-fee-chips">
                  {[50, 100, 200, 500].map((n) => (
                    <button key={n}
                      className={`ca-fee-chip ${form.accessFeeMode === "preset" && form.accessFee === n ? "ca-fee-chip-on" : ""}`}
                      onClick={() => set("accessFeeMode", "preset") || set("accessFee", n) || setForm(f => ({ ...f, accessFeeMode: "preset", accessFee: n, accessFeeCustom: "" }))}
                    >{NF(n)} USD</button>
                  ))}
                  <button
                    className={`ca-fee-chip ca-fee-chip-other ${form.accessFeeMode === "custom" ? "ca-fee-chip-on" : ""}`}
                    onClick={() => setForm(f => ({ ...f, accessFeeMode: "custom" }))}
                  >Otro</button>
                </div>

                {form.accessFeeMode === "custom" && (
                  <div className="ca-custom-fee-wrap">
                    <span className="ca-price-unit" style={{ padding: "0 4px 0 14px", fontSize: 13 }}>Fee</span>
                    <input
                      className="ca-inp-price"
                      type="number" min="50" max="500"
                      placeholder="50 – 500"
                      value={form.accessFeeCustom}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, "");
                        setForm(f => ({ ...f, accessFeeCustom: raw, accessFee: parseInt(raw) || 0 }));
                      }}
                      style={{ fontSize: 18, padding: "12px 8px" }}
                    />
                    <span className="ca-price-unit">USD</span>
                    {form.accessFeeCustom && (parseInt(form.accessFeeCustom) < 50 || parseInt(form.accessFeeCustom) > 500) && (
                      <span className="ca-fee-error">50–500</span>
                    )}
                  </div>
                )}

                <div className="ca-fee-note">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFC01E" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Este importe es el coste de participación. No se devuelve ni se descuenta del precio final.
                </div>
              </div>
            )}

            <button className={`ca-type-card ${form.featured ? "ca-type-on" : ""}`} onClick={() => set("featured", !form.featured)} style={{ marginTop: 6 }}>
              <div className="ca-type-icon" style={{ background: "rgba(245,166,35,.14)", color: "#F5A623" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
              <div className="ca-type-info">
                <span className="ca-type-name">Destacar (promoción)</span>
                <span className="ca-type-desc">Aparece arriba en "Destacadas". Es de pago: el dueño aprueba y cobra; la plataforma se queda un %.</span>
              </div>
              {form.featured && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
            </button>

            {form.featured && (
              <div className="ca-vip-fee-block" style={{ marginTop: 8 }}>
                <label className="ca-lbl">Pago por destacar <span className="ca-req">*</span></label>
                <div className="ca-fee-chips">
                  {[100, 250, 500, 1000].map((n) => (
                    <button key={n} className={`ca-fee-chip ${form.promoFee === n ? "ca-fee-chip-on" : ""}`} onClick={() => setForm(f => ({ ...f, promoFee: n }))}>{NF(n)} CUP</button>
                  ))}
                </div>
                <div className="ca-fee-note">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Se genera una solicitud; el pago se coordina con el dueño (transferencia/efectivo).
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: Precio y duración ── */}
        {step === 2 && (
          <div className="ca-fields">
            <div className="ca-field">
              <label className="ca-lbl">Precio de salida <span className="ca-req">*</span></label>
              <div className="ca-price-wrap">
                <input className="ca-inp ca-inp-price" type="number" min="1" placeholder="0"
                  value={form.startPrice}
                  onChange={(e) => set("startPrice", e.target.value.replace(/\D/g, ""))}
                />
                <span className="ca-price-unit">USD</span>
              </div>
              <p className="ca-hint">Las pujas comenzarán desde este precio.</p>
            </div>

            <div className="ca-field">
              <label className="ca-lbl">Duración de la subasta <span className="ca-req">*</span></label>
              <div className="ca-duration-grid">
                {DURATIONS.map((d) => (
                  <button key={d.value}
                    className={`ca-dur-chip ${form.duration === d.value ? "ca-dur-on" : ""}`}
                    onClick={() => set("duration", d.value)}
                  >{d.label}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: Preview y publicar ── */}
        {step === 3 && (
          <div className="ca-fields">
            {done ? (
              <div className="ca-done">
                <div className="ca-done-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#30D158" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <p className="ca-done-title">¡Subasta publicada!</p>
                <p className="ca-done-sub">Tu subasta ya está activa en RETADOR Marketplace.</p>
              </div>
            ) : (
              <>
                <p className="ca-section-lbl">Resumen antes de publicar</p>

                <div className="ca-preview-card">
                  <div className="ca-preview-row">
                    <span className="ca-preview-lbl">Producto</span>
                    <span className="ca-preview-val">{form.title}</span>
                  </div>
                  {form.subtitle && (
                    <div className="ca-preview-row">
                      <span className="ca-preview-lbl">Descripción</span>
                      <span className="ca-preview-val" style={{ color: "var(--w40)" }}>{form.subtitle}</span>
                    </div>
                  )}
                  <div className="ca-preview-divider" />
                  <div className="ca-preview-row">
                    <span className="ca-preview-lbl">Tipo</span>
                    <span className={`ca-preview-val ${form.type === "vip" ? "ca-preview-gold" : ""}`}>
                      {form.type === "vip" ? "🔒 VIP ACCESS" : "🌐 Pública"}
                    </span>
                  </div>
                  {form.type === "vip" && (
                    <div className="ca-preview-row">
                      <span className="ca-preview-lbl">Acceso VIP</span>
                      <span className="ca-preview-val ca-preview-gold">{NF(form.accessFee)} USD</span>
                    </div>
                  )}
                  <div className="ca-preview-divider" />
                  <div className="ca-preview-row">
                    <span className="ca-preview-lbl">Precio de salida</span>
                    <span className="ca-preview-val">{NF(parseInt(form.startPrice))} USD</span>
                  </div>
                  <div className="ca-preview-row">
                    <span className="ca-preview-lbl">Duración</span>
                    <span className="ca-preview-val">{DURATIONS.find(d => d.value === form.duration)?.label}</span>
                  </div>
                </div>

                <p className="ca-hint" style={{ marginBottom: 20 }}>
                  Una vez publicada, la subasta será visible para todos los usuarios de la plataforma.
                </p>

                <button className={`ca-publish-btn ${publishing ? "ca-publish-loading" : ""}`} onClick={doPublish} disabled={publishing}>
                  {publishing ? (
                    <><span className="ca-spinner" />Publicando…</>
                  ) : (
                    <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4 20-7z"/></svg>Publicar subasta</>
                  )}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* footer nav */}
      {!done && (
        <div className="ca-footer">
          {step > 0 ? (
            <button className="ca-back-btn" onClick={back}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              Atrás
            </button>
          ) : <div />}
          {step < STEPS.length - 1 && (
            <button className={`ca-next-btn ${!stepValid[step] ? "ca-next-off" : ""}`}
              onClick={next} disabled={!stepValid[step]}>
              Continuar
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export function SubastasScreen({ forceCreate = false, onForceCreateDone, onNav, onPromote, sellerName = "Usuario" }) {
  const { BG, T1, isDark } = useAt();
  const [filter,     setFilter]   = useState("Todas");
  const [selected,   setSelected] = useState(null);
  const [creating,   setCreating] = useState(false);
  const [loading,    setLoading]  = useState(true);
  const [searching,  setSearching]= useState(false);
  const [siguiendo,  setSiguiendo]= useState(false);
  const [followed,   setFollowed] = useState(new Set());
  const [toast,      setToast]    = useState({ msg: "", on: false });
  const [heroIdx,    setHeroIdx]  = useState(0);
  const [paused,     setPaused]   = useState(false);
  const [auctions,   setAuctions] = useState(() => { try { const r = localStorage.getItem("retador_auctions"); if (r) return JSON.parse(r); } catch {} return AUCTIONS; });
  useEffect(() => { try { localStorage.setItem("retador_auctions", JSON.stringify(auctions)); } catch {} }, [auctions]);

  // Abre CreateAuction directo si viene del botón + del menú
  useEffect(() => {
    if (forceCreate) { setCreating(true); onForceCreateDone?.(); }
  }, [forceCreate]);

  // Botón ATRÁS del teléfono: cierra primero la sub-pantalla interna que esté
  // abierta (detalle de subasta, crear, buscar, siguiendo) antes de salir de la
  // pestaña de Subastas.
  useEffect(() => { if (!selected)  return; return pushBackHandler(() => closeDetail()); }, [selected]);
  useEffect(() => { if (!creating)  return; return pushBackHandler(() => setCreating(false)); }, [creating]);
  useEffect(() => { if (!searching) return; return pushBackHandler(() => setSearching(false)); }, [searching]);
  useEffect(() => { if (!siguiendo) return; return pushBackHandler(() => setSiguiendo(false)); }, [siguiendo]);

  const heroRef    = useRef(null);
  const autoRef    = useRef(null);
  const toastRef   = useRef(null);
  const mainScrollRef = useRef(null);
  const savedScroll   = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1100);
    return () => clearTimeout(t);
  }, []);

  // hero autoplay 7s
  useEffect(() => {
    clearInterval(autoRef.current);
    if (!paused) {
      autoRef.current = setInterval(
        () => setHeroIdx((i) => (i + 1) % heroAuctions.length),
        7000
      );
    }
    return () => clearInterval(autoRef.current);
  }, [paused]);

  useEffect(() => {
    const el = heroRef.current;
    if (!el || !el.children[0]) return;
    const w = el.children[0].offsetWidth + 14;
    el.scrollTo({ left: heroIdx * w, behavior: "smooth" });
  }, [heroIdx]);

  const openDetail = (a) => {
    savedScroll.current = mainScrollRef.current?.scrollTop ?? 0;
    setSelected(a);
  };

  const closeDetail = () => {
    setSelected(null);
    // restore after React re-renders the main scroll
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (mainScrollRef.current) {
          mainScrollRef.current.scrollTop = savedScroll.current;
        }
      });
    });
  };

  const toggleFollow = useCallback((id) => {
    setFollowed((prev) => {
      const next = new Set(prev);
      const adding = !next.has(id);
      adding ? next.add(id) : next.delete(id);
      const msg = adding ? "Recibirás avisos sobre esta subasta" : "Seguimiento desactivado";
      clearTimeout(toastRef.current);
      setToast({ msg, on: true });
      toastRef.current = setTimeout(() => setToast((t) => ({ ...t, on: false })), 2600);
      return next;
    });
  }, []);

  const heroAuctions  = auctions.filter((a) => a.featured || HERO_IDS.includes(a.id));
  const vipAuctions   = auctions.filter((a) => a.vip);
  const activeCount   = auctions.length;
  const endingCount   = auctions.filter((a) => a.endsIn < 86400).length;

  const FMAP = {
    "Todas":       (a) => !a.vip,
    "🔥 Hot":      (a) => !a.vip && a.status === "HOT",
    "⏳ Finalizan": (a) => !a.vip && a.status === "TERMINANDO",
    "✨ Nuevas":   (a) => !a.vip && a.status === "NUEVA",
    "🔒 VIP":      (a) => a.vip,
  };

  const feedItems   = auctions.filter(FMAP[filter] ?? (() => true));
  const showVipBand = filter === "Todas";
  const fp = { followed, onToggle: toggleFollow };
  const handleOpen = openDetail;

  // ── sub-views ──
  if (creating) return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", fontFamily:"var(--f,Syne,sans-serif)", background: BG, color: T1 }}>
      {!isDark && <style>{SUBASTAS_LIGHT_CSS}</style>}
      <style>{SUBASTAS_CSS}</style>
      <CreateAuction
        onClose={() => setCreating(false)}
        onPublish={(newAuction) => {
          const au = { ...newAuction, id: newAuction.id || ("au_" + Date.now()) };
          setAuctions((prev) => [au, ...prev]);
          // Si pidió Destacada o VIP, genera solicitud de promoción para que el dueño apruebe y cobre
          if (onPromote && (au.featured || au.vip)) {
            onPromote({
              auctionId: au.id, auctionTitle: au.title, sellerName,
              kind: au.featured ? "featured" : "vip",
              amount: au.featured ? (Number(au.promoFee) || 0) : (Number(au.accessFee) || 0),
              note: au.featured ? "Destacar subasta" : "Subasta VIP (cuota de acceso)",
            });
          }
          setCreating(false);
        }}
        isVerifiedSeller={true}
      />
    </div>
  );

  if (siguiendo) return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", fontFamily:"var(--f,Syne,sans-serif)", background: BG, color: T1 }}>
      {!isDark && <style>{SUBASTAS_LIGHT_CSS}</style>}
      <style>{SUBASTAS_CSS}</style>
      <AucToast msg={toast.msg} show={toast.on} />
      <SiguiendoView
        followed={followed}
        onClose={() => setSiguiendo(false)}
        onSelect={(a) => { setSiguiendo(false); openDetail(a); }}
        onToggle={toggleFollow}
      />
    </div>
  );

  if (selected) return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", fontFamily:"var(--f,Syne,sans-serif)", background: BG, color: T1 }}>
      {!isDark && <style>{SUBASTAS_LIGHT_CSS}</style>}
      <style>{SUBASTAS_CSS}</style>
      <AucToast msg={toast.msg} show={toast.on} />
      <DetailView a={selected} onBack={closeDetail} {...fp} />
    </div>
  );

  // ── main view ──
  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", fontFamily:"var(--f,Syne,sans-serif)", background: BG, color: T1 }}>
      {!isDark && <style>{SUBASTAS_LIGHT_CSS}</style>}
      <style>{SUBASTAS_CSS}</style>
      <AucToast msg={toast.msg} show={toast.on} />
      {searching && <SearchOverlay onClose={() => setSearching(false)} />}

      {/* HEADER */}
      <header className="hdr">
        <div className="hdr-row">
          <div>
            <h1 className="hdr-title">SUBASTAS</h1>
            <p className="hdr-platform">RETADOR <span>Marketplace</span></p>
          </div>
          <div className="hdr-right">
            <div className="hdr-icons">
              <button className="icon-btn" onClick={() => setSiguiendo(true)} aria-label="Siguiendo">
                <svg width="17" height="17" viewBox="0 0 24 24"
                  fill={followed.size > 0 ? "#FFC01E" : "none"}
                  stroke={followed.size > 0 ? "#FFC01E" : "currentColor"}
                  strokeWidth="2" strokeLinecap="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {followed.size > 0 && <span className="icon-badge">{followed.size}</span>}
              </button>
              <button className="icon-btn" onClick={() => setSearching(true)} aria-label="Buscar">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
              </button>
            </div>
            <button className="hdr-publish-btn" onClick={() => setCreating(true)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Nueva
            </button>
          </div>
        </div>
        <div className="hdr-stats">
          <span className="stat-pip" />
          <span className="stat-hi">{activeCount} activas</span>
          <span className="stat-sep">·</span>
          <span className="stat-dim">{endingCount} finalizan hoy</span>
          <span className="stat-sep">·</span>
          <span className="stat-gold">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="#FFC01E">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#FFC01E" strokeWidth="2.5" fill="none" />
            </svg>
            {vipAuctions.length} VIP Access
          </span>
        </div>
      </header>

      <div className="main-scroll" ref={mainScrollRef}>

        {/* Tramo: anuncios antes de las destacadas */}
        <LiveSlot page="subastas" from={null} to="su_dest" onNav={onNav} />

        {/* HERO */}
        <section style={{ paddingTop: 22 }}>
          <div className="sec-lbl"><span className="sec-line" />DESTACADAS</div>
          {loading ? (
            <div style={{ display: "flex", gap: 14, padding: "4px 22px" }}>
              {[0, 1, 2].map((i) => <div key={i} className="skel" style={{ width: 270, height: 330, borderRadius: 20, flexShrink: 0 }} />)}
            </div>
          ) : (
            <>
              <div className="hero-track" ref={heroRef}
                onTouchStart={() => setPaused(true)} onMouseDown={() => setPaused(true)}>
                {heroAuctions.map((a) => <HeroCard key={a.id} a={a} onClick={handleOpen} {...fp} />)}
              </div>
              <div className="hero-dots">
                {heroAuctions.map((_, i) => (
                  <button key={i}
                    className={`hero-dot ${i === heroIdx ? "hero-dot-on" : ""}`}
                    onClick={() => { setHeroIdx(i); setPaused(true); }}
                  />
                ))}
              </div>
            </>
          )}
        </section>

        {/* Tramo: entre destacadas y VIP Access */}
        <LiveSlot page="subastas" from="su_dest" to="su_vip" onNav={onNav} />

        {/* VIP BAND */}
        {showVipBand && vipAuctions.length > 0 && (
          <section style={{ marginBottom: 4 }}>
            <div className="sec-lbl sec-lbl-vip">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#FFC01E">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#FFC01E" strokeWidth="2" fill="none" />
              </svg>
              VIP ACCESS
              <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--w40)", letterSpacing: 1 }}>Ver gratis · Pujar requiere acceso</span>
            </div>
            <div className="vip-track">
              {vipAuctions.map((a) => <VipCard key={a.id} a={a} onClick={handleOpen} {...fp} />)}
            </div>
          </section>
        )}

        {/* Tramo: entre VIP Access y filtros */}
        <LiveSlot page="subastas" from="su_vip" to="su_filt" onNav={onNav} />

        {/* FILTERS */}
        <div className="filters-wrap">
          <div className="filters">
            {FILTERS.map((f) => (
              <button key={f} className={`filter ${filter === f ? "filter-on" : ""}`} onClick={() => setFilter(f)}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Tramo: anuncios entre los filtros y el feed de subastas */}
        <LiveSlot page="subastas" from="su_filt" to="su_feed" onNav={onNav} />

        {/* FEED */}
        <section>
          <div className="sec-lbl">
            <span className="sec-line" />SUBASTAS
            <span className="feed-n">{feedItems.length}</span>
          </div>
          <div className="feed-list">
            {loading
              ? [0, 1, 2, 3].map((i) => (
                <div key={i} className="fc" style={{ height: 132, pointerEvents: "none" }}>
                  <div className="skel" style={{ width: 106, height: "100%", borderRadius: 0 }} />
                  <div className="fc-body" style={{ gap: 10 }}>
                    <AucSkel w="50%" /><AucSkel w="85%" h={14} /><AucSkel w="60%" />
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "auto" }}>
                      <AucSkel w="72px" h={20} /><AucSkel w="60px" h={28} r={8} />
                    </div>
                  </div>
                </div>
              ))
              : feedItems.map((a, i) => (
                <div key={a.id} style={{ animation: `riseIn .45s ${i * 65}ms both` }}>
                  {a.vip
                    ? <VipCard a={a} onClick={handleOpen} {...fp} />
                    : <FeedCard a={a} onClick={handleOpen} {...fp} />
                  }
                </div>
              ))
            }
          </div>
        </section>

        {/* Tramo: anuncios después del feed de subastas */}
        <LiveSlot page="subastas" from="su_feed" to={null} onNav={onNav} pad="4px 16px 24px" />

      </div>

    </div>
  );
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
// ─── Subastas light-mode CSS override ────────────────────────────────────────
// Header de navegación, filtros y tarjetas del feed pasan a tono claro.
// Hero/VIP carousels y vista de detalle se mantienen en su estilo "cine" oscuro
// (igual que las imágenes con overlay en el resto de la app).
const SUBASTAS_LIGHT_CSS = `
  :root {
    --bg:#FFFFFF !important; --s1:#FFFFFF !important; --s2:#FFFFFF !important; --s3:#F2F3F5 !important; --s4:#E4E6EB !important;
    --white:#050505 !important; --w70:rgba(5,5,5,.72) !important; --w40:rgba(5,5,5,.42) !important;
    --w15:rgba(5,5,5,.13) !important; --w08:rgba(5,5,5,.07) !important;
    --gold-glow:rgba(245,184,0,.10) !important;
  }
  html,body,#root { background:#FFFFFF !important; }
  .hdr { background: linear-gradient(180deg, #FFFFFF 72%, transparent) !important; }
  .hdr-title { background: none !important; color: #050505 !important; -webkit-text-fill-color: #050505 !important; }
  .hdr-platform { color: rgba(5,5,5,.45) !important; }
  .hdr-platform span { color: rgba(5,5,5,.65) !important; }
  .icon-btn { background: #FFFFFF !important; border-color: #E4E6EB !important; color: #050505 !important; }
  .hdr-publish-btn { border-color: #E4E6EB !important; color: #65676B !important; }
  .stat-hi { color: #050505 !important; }
  .stat-dim { color: #65676B !important; }
  .stat-sep { color: #E4E6EB !important; }
  .filter { background: #FFFFFF !important; border-color: #E4E6EB !important; color: #65676B !important; }
  .filter-on { background: #FFC01E !important; color: #050505 !important; border-color: #FFC01E !important; }
  .fc { background: #FFFFFF !important; border-color: #E4E6EB !important; }
  .fc-title { color: #050505 !important; }
  .fc-sub, .fc-count { color: #65676B !important; }
  .fc-bid { color: #050505 !important; }
  .fc-bid em { color: #965E00 !important; }
  .sec-lbl { color: #65676B !important; }
  .feed-n { background: #E4E6EB !important; color: #65676B !important; }
  .skel { background: linear-gradient(90deg,#F2F3F5 25%,#E4E6EB 50%,#F2F3F5 75%) !important; background-size: 200% 100% !important; }
  .ca-root, .sig-root { background: #FFFFFF !important; }
  .ca-header, .sig-header { background: rgba(255,255,255,.98) !important; border-bottom-color: #E4E6EB !important; }
  .ca-title { color: #050505 !important; -webkit-text-fill-color: #050505 !important; }
  .ca-platform { color: #65676B !important; }
  .ca-platform span { color: #050505 !important; }
  .round-btn { background: #FFFFFF !important; border-color: #E4E6EB !important; color: #050505 !important; }
  .ca-body, .sig-body { background: #FFFFFF !important; }
  .ca-card, .ca-field-box { background: #FFFFFF !important; border-color: #E4E6EB !important; }
  .ca-lbl { color: #65676B !important; }
  .ca-hint { color: #8A8D91 !important; }
  .ca-inp, .ca-textarea { background: #F2F3F5 !important; border-color: #E4E6EB !important; color: #050505 !important; }
  .ca-inp::placeholder, .ca-textarea::placeholder { color: #8A8D91 !important; }
  .ca-type-card { background: #FFFFFF !important; border-color: #E4E6EB !important; }
  .ca-type-title { color: #050505 !important; }
  .ca-type-desc { color: #65676B !important; }
  .sig-item { background: #FFFFFF !important; border-color: #E4E6EB !important; }
  .sig-item-title { color: #050505 !important; }
  .sig-item-sub { color: #65676B !important; }
  .vam { background: #FFFFFF !important; border-top-color: #E4E6EB !important; }
  .vam-title { color: #050505 !important; }
  .vam-sub { color: #65676B !important; }
  .vam-img-grad { background: linear-gradient(180deg,transparent 0%,#FFFFFF 100%) !important; }
  .vam-stat-box { background: #FFFFFF !important; border-color: #E4E6EB !important; }
  .vam-stat-val { color: #050505 !important; }
  .vam-stat-lbl { color: #65676B !important; }
  .search-box { background: #FFFFFF !important; border-color: #E4E6EB !important; }
  /* Upload zone & Nueva button */
  .ca-img-add { border-color: #8A8D91 !important; background: #F2F3F5 !important; }
  .ca-img-add:hover { border-color: #FFC01E !important; }
  .ca-img-add-inner { color: #050505 !important; }
  .ca-img-add:hover .ca-img-add-inner { color: #965E00 !important; }
  .hdr-publish-btn { background: #FFFFFF !important; border-color: #E4E6EB !important; color: #050505 !important; font-weight: 700 !important; box-shadow: none !important; }
  .hdr-publish-btn:hover { background: #F2F3F5 !important; border-color: #8A8D91 !important; }
  .round-btn svg path { stroke: #050505 !important; }
  /* ── Cobertura completa modo claro: campanas, overlays e iconos quemados ── */
  .bell { background: rgba(255,255,255,.92) !important; border-color: #E4E6EB !important; color: #65676B !important; }
  .bell-on { background: rgba(245,184,0,.16) !important; border-color: rgba(245,184,0,.5) !important; color: #965E00 !important; }
  .dv-watching { background: rgba(255,255,255,.92) !important; border-color: #E4E6EB !important; color: #65676B !important; }
  .search-box svg { stroke: rgba(5,5,5,.4) !important; }
  .search-inp { color: #050505 !important; }
  .search-inp::placeholder { color: #8A8D91 !important; }
  .sig-empty-icon { background: #FFFFFF !important; border-color: #E4E6EB !important; }
  .sig-empty-icon svg { stroke: rgba(5,5,5,.28) !important; }
  /* Badges sobre fotos: pastilla oscura con texto claro (legible sobre imagen) */
  .live { color: #F8F8F8 !important; }
  /* Botón flotante de regreso sobre el hero: oscuro y visible en cualquier imagen */
  .float-back { background: rgba(15,15,16,.62) !important; border-color: rgba(255,255,255,.18) !important; color: #fff !important; }
  /* Velo de modales en tono claro */
  .overlay { background: rgba(255,255,255,.86) !important; }
  /* Toast de seguimiento legible en claro */
  .toast { background: rgba(255,255,255,.98) !important; border-color: #E4E6EB !important; color: #050505 !important; box-shadow: 0 6px 24px rgba(0,0,0,.14) !important; }
  /* ── Hero cards: el texto va sobre la foto → claro siempre + datos visibles ── */
  .hc-grad { background: linear-gradient(180deg, rgba(8,8,8,0) 0%, rgba(8,8,8,.30) 46%, rgba(8,8,8,.85) 100%) !important; }
  .hc-title { color: #FFFFFF !important; -webkit-text-fill-color: #FFFFFF !important; }
  .hc-bid { color: #FFFFFF !important; }
  .hc-bid em { color: #FFC01E !important; }
  .hc-body .lbl { color: rgba(255,255,255,.8) !important; }
  .hc-foot .meta { color: rgba(255,255,255,.92) !important; font-weight: 600 !important; }
  .hc-stats .cd { background: rgba(255,255,255,.95) !important; box-shadow: 0 2px 8px rgba(0,0,0,.22) !important; }
  /* ── Etiquetas y stats finas más legibles en tarjetas claras ── */
  .vc-access-hint { color: #65676B !important; }
  .lbl { color: rgba(5,5,5,.5) !important; }
  .meta { color: #65676B !important; }
  /* ── Cronómetro: oro más oscuro en claro para que resalte ── */
  .cd-medium, .cd-low { color: #965E00 !important; }
  .cd-medium .cd-sep, .cd-low .cd-sep { color: #965E00 !important; }
`;



const SUBASTAS_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');

html,body,#root{width:100%;height:100%;margin:0;padding:0;overflow-x:hidden;background:#080808;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
button{cursor:pointer;border:none;background:none;font-family:inherit;}
img{display:block;object-fit:cover;}

:root{
  --bg:#080808;--s1:#0F0F10;--s2:#161618;--s3:#1E1E21;--s4:#252529;
  --gold:#FFC01E;--gold-lo:rgba(245,184,0,.12);--gold-glow:rgba(245,184,0,.05);
  --white:#F8F8F8;--w70:rgba(248,248,248,.7);--w40:rgba(248,248,248,.4);
  --w15:rgba(248,248,248,.15);--w08:rgba(248,248,248,.08);
  --red:#FF3B30;--orange:#FF8C00;--green:#30D158;
  --f:'Syne',sans-serif;--fm:'DM Mono',monospace;
}

.app{font-family:var(--f);background:var(--bg);color:var(--white);width:100%;max-width:430px;min-height:100dvh;margin:0 auto;overflow-x:hidden;-webkit-font-smoothing:antialiased;position:relative;}

/* HEADER */
.hdr{position:sticky;top:0;z-index:90;padding:28px 22px 14px;background:linear-gradient(180deg,var(--bg) 72%,transparent);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);}
.hdr-row{display:flex;justify-content:space-between;align-items:flex-start;}
.hdr-title{font-size:38px;font-weight:800;letter-spacing:-1px;line-height:1;background:linear-gradient(120deg,var(--white) 35%,var(--gold));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.hdr-platform{font-size:11px;font-weight:400;letter-spacing:3px;text-transform:uppercase;color:var(--w40);margin-top:5px;}
.hdr-platform span{color:var(--w70);font-weight:600;}
.icon-btn{width:34px;height:34px;border-radius:10px;background:transparent;border:1px solid var(--w08);color:var(--w40);display:flex;align-items:center;justify-content:center;position:relative;transition:border-color .2s,color .2s;}
.icon-btn:hover{border-color:var(--w15);color:var(--w70);}
.icon-badge{position:absolute;top:-4px;right:-4px;width:15px;height:15px;border-radius:50%;background:var(--gold);color:var(--bg);font-size:8px;font-weight:800;display:flex;align-items:center;justify-content:center;}
.hdr-stats{display:flex;align-items:center;gap:8px;margin-top:13px;padding-top:12px;border-top:1px solid var(--w08);}
.stat-pip{width:6px;height:6px;border-radius:50%;background:var(--green);flex-shrink:0;animation:gpulse 2.4s ease infinite;}
.stat-hi{font-size:11px;font-weight:600;color:var(--w70);}
.stat-dim{font-size:11px;color:var(--w40);}
.stat-sep{font-size:11px;color:var(--w15);}
.stat-gold{font-size:11px;color:var(--gold);display:flex;align-items:center;gap:4px;}

/* MAIN SCROLL */
.main-scroll{overflow-y:auto;overflow-x:hidden;flex:1;min-height:0;padding-bottom:32px;scrollbar-width:none;}
.main-scroll::-webkit-scrollbar{display:none;}

/* SECTION LABELS */
.sec-lbl{display:flex;align-items:center;gap:10px;font-size:10px;font-weight:700;letter-spacing:2.5px;color:var(--w40);text-transform:uppercase;padding:0 22px;margin-bottom:15px;}
.sec-lbl-vip{color:var(--gold);}
.sec-line{width:20px;height:2px;background:var(--gold);border-radius:2px;flex-shrink:0;}
.feed-n{margin-left:auto;background:var(--s3);color:var(--w40);font-size:10px;padding:3px 9px;border-radius:20px;}

/* UTILITY */
.lbl{display:block;font-size:9px;letter-spacing:2px;color:var(--w40);text-transform:uppercase;margin-bottom:3px;}
.meta{display:flex;align-items:center;gap:4px;font-size:11px;color:var(--w40);}
.prog{height:2px;background:var(--s4);border-radius:2px;margin:7px 0;overflow:hidden;}
.prog-fill{height:100%;background:linear-gradient(90deg,var(--gold),#FFD740);border-radius:2px;transition:width 1s ease;}
.act-pip{width:5px;height:5px;border-radius:50%;flex-shrink:0;background:var(--green);animation:gpulse 2.4s infinite;}
.act-txt{font-size:10px;color:var(--w40);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.fc-activity{display:flex;align-items:center;gap:5px;margin-bottom:6px;}

/* LIVE */
.live{display:inline-flex;align-items:center;gap:5px;background:rgba(8,8,8,.72);backdrop-filter:blur(8px);border:1px solid rgba(255,59,48,.3);color:var(--w70);font-size:9px;font-weight:700;letter-spacing:2px;padding:4px 9px;border-radius:20px;}
.live-dot{width:5px;height:5px;border-radius:50%;background:var(--red);animation:livepip 1.8s ease infinite;}

/* BADGES */
.badge{font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:3px 9px;border-radius:20px;line-height:1.6;}
.b-hot{background:rgba(255,59,48,.14);color:var(--red);border:1px solid rgba(255,59,48,.28);}
.b-end{background:rgba(255,140,0,.12);color:var(--orange);border:1px solid rgba(255,140,0,.28);}
.b-new{background:rgba(48,209,88,.1);color:var(--green);border:1px solid rgba(48,209,88,.24);}
.b-vip{background:rgba(245,184,0,.08);color:var(--gold);border:1px solid rgba(245,184,0,.2);}

/* VIP PILL */
.vip-pill{font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;background:rgba(245,184,0,.1);color:var(--gold);border:1px solid rgba(245,184,0,.28);padding:3px 9px;border-radius:20px;backdrop-filter:blur(8px);}

/* BELL */
.bell{display:flex;align-items:center;background:rgba(15,15,16,.72);backdrop-filter:blur(8px);border:1px solid var(--w08);border-radius:20px;color:var(--w40);padding:5px 8px;transition:all .25s cubic-bezier(.25,.46,.45,.94);}
.bell-on{background:rgba(245,184,0,.1);border-color:rgba(245,184,0,.3);color:var(--gold);}
.bell-pop{animation:bellpop .5s cubic-bezier(.34,1.56,.64,1);}

/* TOAST */
.toast{position:fixed;top:58px;left:50%;transform:translateX(-50%) translateY(-14px);z-index:999;pointer-events:none;display:flex;align-items:center;gap:8px;background:rgba(22,22,24,.95);backdrop-filter:blur(16px);border:1px solid var(--w15);border-radius:30px;color:var(--w70);font-size:12px;font-weight:600;padding:10px 18px;white-space:nowrap;opacity:0;transition:opacity .3s,transform .3s;}
.toast-on{opacity:1;transform:translateX(-50%) translateY(0);}

/* COUNTDOWN */
.cd{display:inline-flex;align-items:center;gap:0;font-family:var(--fm);font-weight:800;background:var(--s3);border:1px solid var(--w08);border-radius:9px;padding:3px 9px;letter-spacing:.5px;box-shadow:0 1px 3px rgba(0,0,0,.16);}
.cd-d{background:none;border-radius:0;line-height:1;padding:0;}
.cd-sep{opacity:.5;padding:0 1px;}
.cd-sm{font-size:13px;padding:3px 8px;border-radius:8px;}
.cd-md{font-size:16px;}
.cd-lg{font-size:19px;padding:5px 11px;border-radius:11px;}
.cd-xl{font-size:40px;letter-spacing:-1px;border-radius:16px;padding:10px 18px;background:var(--s2);box-shadow:0 4px 16px rgba(0,0,0,.2);}
.cd-critical{background:rgba(255,59,48,.18);border-color:rgba(255,59,48,.45);color:var(--red);}
.cd-critical .cd-sep{color:var(--red);opacity:.65;}
.cd-high{background:rgba(255,140,0,.15);border-color:rgba(255,140,0,.42);color:var(--orange);}
.cd-high .cd-sep{color:var(--orange);opacity:.65;}
.cd-medium,.cd-low{background:var(--gold-lo);border-color:rgba(245,184,0,.42);color:var(--gold);}
.cd-medium .cd-sep,.cd-low .cd-sep{color:var(--gold);opacity:.65;}

/* SKELETON */
.skel{background:linear-gradient(90deg,var(--s2) 25%,var(--s3) 50%,var(--s2) 75%);background-size:200% 100%;animation:shimmer 1.6s infinite;}

/* HERO */
.hero-track{display:flex;gap:14px;overflow-x:auto;scroll-snap-type:x mandatory;padding:4px 22px 6px;scrollbar-width:none;-webkit-overflow-scrolling:touch;}
.hero-track::-webkit-scrollbar{display:none;}
.hero-dots{display:flex;justify-content:center;gap:5px;padding:10px 0 20px;}
.hero-dot{width:5px;height:5px;border-radius:50%;background:var(--w15);transition:all .5s cubic-bezier(.4,0,.2,1);}
.hero-dot-on{width:22px;border-radius:3px;background:var(--gold);}

.hc{flex-shrink:0;width:270px;height:330px;border-radius:20px;overflow:hidden;border:1px solid var(--w08);cursor:pointer;scroll-snap-align:start;position:relative;transition:transform .5s cubic-bezier(.25,.46,.45,.94);animation:riseIn .8s both;}
.hc:hover{transform:translateY(-4px) scale(1.01);}
.hc-critical{border-color:rgba(255,59,48,.22);box-shadow:0 0 40px rgba(255,59,48,.05);animation:riseIn .8s both,breathe 4s ease-in-out 1s infinite;}
.hc-high{border-color:rgba(255,140,0,.18);}
.hc-medium,.hc-low{box-shadow:0 0 40px var(--gold-glow);}
.hc-img{position:absolute;inset:0;width:100%;height:100%;transition:transform 8s cubic-bezier(.25,.46,.45,.94);}
.hc:hover .hc-img{transform:scale(1.06);}
.hc-grad{position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,8,8,.08) 0%,rgba(8,8,8,.48) 50%,rgba(8,8,8,.94) 100%);}
.hc-top{position:absolute;top:14px;left:14px;right:14px;z-index:2;display:flex;justify-content:space-between;align-items:center;}
.hc-top-r{display:flex;align-items:center;gap:7px;}
.hc-body{position:absolute;bottom:0;left:0;right:0;z-index:2;padding:15px 16px 18px;}
.hc-seller{font-size:11px;color:var(--gold);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px;}
.hc-title{font-size:17px;font-weight:700;line-height:1.2;margin-bottom:14px;}
.hc-stats{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:14px;}
.hc-bid{font-size:20px;font-weight:700;font-family:var(--fm);}
.hc-bid em{font-size:12px;color:var(--gold);font-style:normal;}
.hc-foot{display:flex;align-items:center;gap:10px;}
.hc-btn{margin-left:auto;background:var(--gold);color:var(--bg);font-family:var(--f);font-weight:700;font-size:11px;letter-spacing:1.5px;padding:8px 18px;border-radius:8px;transition:background .2s,box-shadow .2s,transform .15s;}
.hc-btn:hover{background:#FFD740;box-shadow:0 0 20px rgba(245,184,0,.3);transform:scale(1.04);}

/* VIP CARD */
.vip-track{display:flex;gap:14px;overflow-x:auto;scroll-snap-type:x mandatory;padding:4px 22px 8px;scrollbar-width:none;}
.vip-track::-webkit-scrollbar{display:none;}
.vc{flex-shrink:0;width:258px;background:var(--s1);border-radius:18px;overflow:hidden;border:1px solid rgba(245,184,0,.14);box-shadow:0 0 40px var(--gold-glow),inset 0 1px 0 rgba(245,184,0,.06);cursor:pointer;scroll-snap-align:start;transition:transform .4s cubic-bezier(.25,.46,.45,.94),box-shadow .4s;animation:riseIn .7s both;}
.vc:hover{transform:translateY(-3px);box-shadow:0 8px 50px rgba(245,184,0,.1),inset 0 1px 0 rgba(245,184,0,.1);}
.vc-img-wrap{position:relative;height:145px;overflow:hidden;}
.vc-img{width:100%;height:100%;filter:blur(6px) brightness(.52);transform:scale(1.08);transition:filter .4s;}
.vc:hover .vc-img{filter:blur(4px) brightness(.62);}
.vc-veil{position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,8,8,.18) 0%,rgba(8,8,8,.78) 100%);}
.vc-lock{position:absolute;top:50%;left:50%;transform:translate(-50%,-60%);width:42px;height:42px;border-radius:50%;background:rgba(245,184,0,.1);border:1px solid rgba(245,184,0,.24);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;}
.vc-bell{position:absolute;bottom:10px;right:10px;z-index:3;}
.vc-img-wrap .vip-pill{position:absolute;top:12px;left:12px;}
.vc-img-wrap .live{position:absolute;top:12px;right:12px;}
.vc-body{padding:13px 14px 15px;}
.vc-title{font-size:14px;font-weight:700;line-height:1.2;margin-bottom:3px;}
.vc-sub{font-size:11px;color:var(--w40);margin-bottom:11px;}
.vc-row{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:10px;}
.vc-val{font-size:12px;font-weight:600;color:var(--w70);}
.vc-seller{display:flex;align-items:center;gap:7px;margin-bottom:12px;}
.vc-dot{width:5px;height:5px;border-radius:50%;background:var(--gold);flex-shrink:0;}
.vc-sname{font-size:12px;color:var(--w70);font-weight:600;}
.vc-rating{font-size:11px;color:var(--gold);margin-left:auto;}
.vc-access{display:flex;align-items:center;justify-content:space-between;gap:8px;}
.vc-access-hint{display:flex;align-items:center;gap:5px;font-size:10px;color:var(--w40);}
.vc-sep{color:var(--w15);}
.vc-access-vip{color:var(--gold);font-weight:600;}
.vc-btn{display:flex;align-items:center;gap:5px;background:linear-gradient(135deg,rgba(245,184,0,.1),rgba(245,184,0,.05));border:1px solid rgba(245,184,0,.22);border-radius:9px;padding:8px 13px;color:var(--gold);font-size:12px;font-weight:700;transition:all .2s;}
.vc-btn:hover{background:rgba(245,184,0,.16);border-color:rgba(245,184,0,.42);}

/* FEED */
.filters-wrap{overflow-x:auto;scrollbar-width:none;padding:0 0 20px;}
.filters-wrap::-webkit-scrollbar{display:none;}
.filters{display:flex;gap:8px;padding:0 22px;width:max-content;}
.filter{padding:8px 17px;border-radius:30px;font-family:var(--f);font-size:12px;font-weight:600;background:var(--s2);border:1px solid var(--w08);color:var(--w40);transition:all .2s;white-space:nowrap;}
.filter:hover{border-color:var(--w15);color:var(--w70);}
.filter-on{background:var(--gold);color:var(--bg);border-color:var(--gold);box-shadow:0 0 22px rgba(245,184,0,.2);}
.feed-list{display:flex;flex-direction:column;gap:10px;padding:0 16px;}
.fc{display:flex;background:var(--s1);border-radius:16px;overflow:hidden;border:1px solid var(--w08);cursor:pointer;transition:transform .3s cubic-bezier(.25,.46,.45,.94),border-color .3s;}
.fc:hover{transform:translateX(5px);border-color:var(--w15);}
.fc-critical{border-color:rgba(255,59,48,.2);}
.fc-high{border-color:rgba(255,140,0,.14);}
.fc-img-wrap{width:106px;flex-shrink:0;position:relative;}
.fc-img{width:100%;height:100%;min-height:146px;}
.hot-pip{position:absolute;top:10px;right:10px;width:8px;height:8px;border-radius:50%;background:var(--red);box-shadow:0 0 8px var(--red);animation:gpulse 2s infinite;}
.fc-body{flex:1;padding:12px 14px 12px 12px;display:flex;flex-direction:column;justify-content:space-between;min-width:0;}
.fc-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:5px;}
.fc-head-r{display:flex;align-items:center;gap:6px;}
.fc-title{font-size:14px;font-weight:700;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px;}
.fc-sub{font-size:11px;color:var(--w40);}
.fc-bottom{display:flex;justify-content:space-between;align-items:flex-end;}
.fc-bid{font-size:16px;font-weight:700;font-family:var(--fm);line-height:1;}
.fc-bid em{font-size:11px;color:var(--gold);font-style:normal;}
.fc-count{font-size:11px;color:var(--w40);margin-top:2px;}
.fc-right{display:flex;flex-direction:column;align-items:flex-end;gap:6px;}
.fc-btn{background:var(--gold);color:var(--bg);font-family:var(--f);font-weight:700;font-size:10px;letter-spacing:1.5px;padding:7px 13px;border-radius:7px;transition:background .15s,box-shadow .15s,transform .12s;}
.fc-btn:hover{background:#FFD740;box-shadow:0 0 14px rgba(245,184,0,.3);transform:scale(1.04);}

/* VIP ACTIVATE MODAL */
.overlay{position:fixed;inset:0;z-index:600;background:rgba(8,8,8,.88);backdrop-filter:blur(20px);display:flex;align-items:flex-end;animation:fadein .22s ease;}
.search-overlay{align-items:flex-start;padding-top:80px;flex-direction:column;}
.vam{width:100%;max-width:430px;margin:0 auto;background:var(--s1);border-radius:28px 28px 0 0;border-top:1px solid rgba(245,184,0,.14);overflow:hidden;max-height:92dvh;overflow-y:auto;scrollbar-width:none;animation:slideup .32s cubic-bezier(.25,.46,.45,.94);}
.vam::-webkit-scrollbar{display:none;}
.vam-img-wrap{position:relative;height:170px;flex-shrink:0;}
.vam-img{width:100%;height:100%;filter:blur(14px) brightness(.38);transform:scale(1.18);}
.vam-img-grad{position:absolute;inset:0;background:linear-gradient(180deg,transparent 0%,var(--s1) 100%);}
.vam-body{padding:0 24px 36px;}
.vam-lock{width:52px;height:52px;border-radius:50%;background:var(--gold-lo);border:1px solid rgba(245,184,0,.24);display:flex;align-items:center;justify-content:center;margin:-26px auto 18px;position:relative;z-index:1;box-shadow:0 0 30px rgba(245,184,0,.1);}
.vam-title{font-size:24px;font-weight:800;text-align:center;letter-spacing:-0.5px;margin-bottom:5px;}
.vam-sub{font-size:13px;color:var(--w40);text-align:center;margin-bottom:22px;}
.vam-fee{text-align:center;padding:20px 0;border-top:1px solid var(--w08);border-bottom:1px solid var(--w08);margin-bottom:18px;}
.vam-fee-amt{display:block;font-size:44px;font-weight:800;font-family:var(--fm);line-height:1;}
.vam-fee-amt em{font-size:18px;color:var(--gold);font-style:normal;}
.vam-fee-lbl{display:block;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:var(--w40);margin-top:7px;}
.vam-note{font-size:12px;color:var(--w70);line-height:1.65;text-align:center;margin-bottom:22px;max-width:300px;margin-left:auto;margin-right:auto;}
.vam-stats{display:flex;align-items:center;margin-bottom:24px;}
.vam-stat{flex:1;text-align:center;}
.vam-sv{display:block;font-size:22px;font-weight:800;font-family:var(--fm);}
.vam-sl{display:block;font-size:10px;color:var(--w40);letter-spacing:1px;text-transform:uppercase;margin-top:3px;}
.vam-sdiv{width:1px;height:36px;background:var(--w15);}
.vam-cta{width:100%;padding:18px;background:var(--gold);color:var(--bg);font-family:var(--f);font-weight:800;font-size:14px;letter-spacing:1px;border-radius:14px;margin-bottom:12px;display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 4px 28px rgba(245,184,0,.2);transition:background .2s,box-shadow .2s,transform .15s;}
.vam-cta:hover{background:#FFD740;box-shadow:0 6px 38px rgba(245,184,0,.34);transform:translateY(-1px);}
.vam-cancel{width:100%;padding:14px;color:var(--w40);font-size:14px;font-weight:600;transition:color .2s;}
.vam-cancel:hover{color:var(--w70);}

/* SEARCH */
.search-box{display:flex;align-items:center;gap:12px;background:var(--s2);border:1px solid var(--w15);border-radius:16px;padding:14px 16px;width:calc(100% - 44px);max-width:386px;}
.search-inp{flex:1;background:none;border:none;outline:none;font-family:var(--f);font-size:15px;color:var(--white);}
.search-inp::placeholder{color:var(--w40);}
.search-x{width:30px;height:30px;border-radius:8px;background:var(--s3);color:var(--w70);display:flex;align-items:center;justify-content:center;}
.search-hint{color:var(--w40);font-size:12px;margin-top:16px;letter-spacing:.5px;}

/* SIGUIENDO */
.sig-root{display:flex;flex-direction:column;flex:1;min-height:0;background:var(--bg);animation:slideright .3s cubic-bezier(.25,.46,.45,.94);}
.sig-header{display:flex;align-items:center;gap:14px;padding:50px 22px 18px;border-bottom:1px solid var(--w08);}
.round-btn{width:40px;height:40px;border-radius:50%;background:var(--s2);border:1px solid var(--w08);color:var(--w70);display:flex;align-items:center;justify-content:center;transition:border-color .2s;flex-shrink:0;}
.round-btn:hover{border-color:var(--gold);color:var(--gold);}
.sig-title{font-size:26px;font-weight:800;letter-spacing:-.5px;background:linear-gradient(120deg,var(--white) 30%,var(--gold));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;line-height:1;}
.sig-platform{font-size:10px;font-weight:400;letter-spacing:3px;text-transform:uppercase;color:var(--w40);margin-top:4px;}
.sig-platform span{color:var(--w70);font-weight:600;}
.sig-count{width:30px;height:30px;border-radius:50%;background:var(--gold);color:var(--bg);font-size:13px;font-weight:800;font-family:var(--fm);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.sig-scroll{flex:1;overflow-y:auto;scrollbar-width:none;padding:20px 16px 32px;}
.sig-scroll::-webkit-scrollbar{display:none;}
.sig-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:300px;gap:14px;padding:40px 24px;text-align:center;}
.sig-empty-icon{width:72px;height:72px;border-radius:50%;background:var(--s2);border:1px solid var(--w08);display:flex;align-items:center;justify-content:center;}
.sig-empty-t{font-size:16px;font-weight:700;color:var(--w70);}
.sig-empty-s{font-size:13px;color:var(--w40);line-height:1.6;max-width:260px;}
.sig-list{display:flex;flex-direction:column;gap:10px;}
.sigc{display:flex;gap:12px;align-items:center;background:var(--s1);border-radius:14px;border:1px solid var(--w08);padding:12px;cursor:pointer;transition:transform .3s,border-color .3s;animation:riseIn .45s both;opacity:0;}
.sigc:hover{transform:translateX(4px);border-color:var(--w15);}
.sigc-critical{border-color:rgba(255,59,48,.2);}
.sigc-high{border-color:rgba(255,140,0,.14);}
.sigc-img{width:60px;height:60px;border-radius:10px;overflow:hidden;flex-shrink:0;position:relative;}
.sigc-veil{position:absolute;inset:0;z-index:1;}
.sigc-lock{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:2;}
.sigc-body{flex:1;display:flex;flex-direction:column;gap:4px;min-width:0;}
.sigc-top{display:flex;align-items:center;justify-content:space-between;}
.sigc-title{font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sigc-meta{display:flex;align-items:center;gap:10px;}
.sigc-bid{font-family:var(--fm);font-size:13px;font-weight:600;}

/* DETAIL */
.dv-root{position:fixed;inset:0;background:var(--bg);z-index:400;overflow:hidden;animation:slideright .3s cubic-bezier(.25,.46,.45,.94);}
.float-btn{position:fixed;z-index:500;transition:opacity .3s,transform .3s;}
.float-hidden{opacity:0;transform:translateY(-12px);pointer-events:none;}
.float-back{top:44px;left:16px;width:38px;height:38px;border-radius:12px;background:rgba(15,15,16,.55);backdrop-filter:blur(16px);border:1px solid var(--w15);color:var(--white);display:flex;align-items:center;justify-content:center;}
.float-back:hover{border-color:var(--gold);color:var(--gold);}
.float-bell{top:44px;right:16px;display:flex;align-items:center;gap:8px;}
.float-bell-label{font-size:11px;font-weight:700;color:var(--gold);letter-spacing:.5px;}
.dv-scroll{height:100%;overflow-y:auto;overflow-x:hidden;scrollbar-width:none;}
.dv-scroll::-webkit-scrollbar{display:none;}
.dv-hero{position:relative;height:340px;flex-shrink:0;}
.dv-hero-img{width:100%;height:100%;object-fit:cover;}
.dv-hero-grad{position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,8,8,.12) 0%,rgba(8,8,8,.52) 55%,var(--bg) 100%);}
.dv-hero-badges{position:absolute;top:auto;bottom:18px;left:18px;z-index:2;display:flex;gap:8px;}
.dv-watching{position:absolute;bottom:22px;right:18px;z-index:2;display:flex;align-items:center;gap:6px;background:rgba(15,15,16,.75);backdrop-filter:blur(8px);border:1px solid var(--w08);color:var(--w40);font-size:11px;padding:5px 12px;border-radius:20px;}
.w-dot{width:6px;height:6px;border-radius:50%;background:var(--green);animation:gpulse 2.4s infinite;}
.dv-body{padding:0 20px 100px;}
.dv-title-block{padding-top:4px;margin-bottom:22px;}
.dv-seller-row{display:flex;align-items:center;gap:5px;font-size:11px;color:var(--gold);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;}
.dv-title{font-size:26px;font-weight:800;line-height:1.1;margin-bottom:5px;}
.dv-sub{font-size:13px;color:var(--w40);}

/* VIP activity row */
.vip-activity{display:flex;align-items:center;background:var(--s2);border:1px solid rgba(245,184,0,.12);border-radius:12px;padding:12px 16px;margin-bottom:22px;}
.vip-act-item{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--w70);flex:1;}
.vip-act-item b{font-weight:700;color:var(--white);}
.vip-act-item:last-child{justify-content:flex-end;}
.vip-act-item:last-child b{color:var(--gold);}
.vip-act-div{width:1px;height:24px;background:var(--w15);margin:0 14px;flex-shrink:0;}

.dv-cd-block{text-align:center;padding:22px 0;border-top:1px solid var(--w08);border-bottom:1px solid var(--w08);margin-bottom:22px;}
.dv-cd-lbl{display:block;font-size:9px;letter-spacing:3px;color:var(--w40);text-transform:uppercase;margin-bottom:14px;}
.dv-price-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:22px;}
.dv-price{font-size:28px;font-weight:800;font-family:var(--fm);}
.dv-price em{font-size:14px;color:var(--gold);font-style:normal;}
.dv-bidders{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--w40);}

/* VIP ready badge */
.vip-ready-badge{display:flex;align-items:center;gap:8px;background:rgba(48,209,88,.08);border:1px solid rgba(48,209,88,.2);border-radius:10px;padding:10px 14px;margin-bottom:16px;font-size:12px;color:var(--green);font-weight:600;}

/* BID AREA */
.bid-area{margin-bottom:28px;}
.bid-area-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
.bid-area-lbl{font-size:10px;font-weight:700;letter-spacing:2px;color:var(--w40);text-transform:uppercase;}
.bid-clear{font-size:11px;color:var(--w40);font-family:var(--f);font-weight:600;transition:color .2s;padding:0;}
.bid-clear:hover{color:var(--w70);}

/* increment chips */
.inc-grid{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;}
.inc-chip{flex:1;min-width:calc(25% - 8px);padding:11px 6px;background:var(--s2);border:1px solid var(--w08);border-radius:10px;color:var(--w40);font-family:var(--f);font-size:13px;font-weight:700;transition:all .18s;white-space:nowrap;text-align:center;}
.inc-chip:hover{border-color:var(--w15);color:var(--w70);}
.inc-chip-on{background:var(--gold-lo);border-color:rgba(245,184,0,.4);color:var(--gold);box-shadow:0 0 14px rgba(245,184,0,.08);}
.inc-chip-other{flex:0 0 auto;min-width:56px;}

/* custom input */
.custom-wrap{display:flex;align-items:center;gap:10px;background:var(--s2);border:1px solid rgba(245,184,0,.3);border-radius:12px;padding:12px 16px;margin-bottom:12px;animation:riseIn .25s both;}
.custom-prefix{font-size:22px;font-weight:700;font-family:var(--fm);color:var(--gold);flex-shrink:0;}
.custom-inp{flex:1;background:none;border:none;outline:none;font-size:22px;font-weight:700;font-family:var(--fm);color:var(--white);min-width:0;-moz-appearance:textfield;}
.custom-inp::-webkit-outer-spin-button,.custom-inp::-webkit-inner-spin-button{-webkit-appearance:none;margin:0;}
.custom-inp::placeholder{color:var(--w15);}
.custom-unit{font-size:14px;color:var(--gold);font-weight:600;flex-shrink:0;}

/* bid preview */
.bid-preview{display:flex;align-items:center;gap:8px;background:var(--s2);border:1px solid rgba(245,184,0,.15);border-radius:12px;padding:12px 16px;margin-bottom:14px;animation:riseIn .2s both;}
.bp-base{font-family:var(--fm);font-size:14px;color:var(--w40);}
.bp-op{font-family:var(--fm);font-size:14px;font-weight:700;color:var(--gold);}
.bp-eq{font-size:14px;color:var(--w15);}
.bp-total{font-family:var(--fm);font-size:18px;font-weight:800;color:var(--white);margin-left:auto;}

/* ended banner */
.ended-banner{display:flex;align-items:center;gap:10px;background:rgba(255,59,48,.07);border:1px solid rgba(255,59,48,.2);border-radius:12px;padding:13px 16px;margin-bottom:22px;font-size:12px;color:rgba(255,59,48,.9);font-weight:600;line-height:1.4;}
.ended-banner svg{flex-shrink:0;color:var(--red);}

/* price flash */
@keyframes priceFlash{0%{color:var(--white)}40%{color:var(--green)}100%{color:var(--white)}}
.dv-price-flash{animation:priceFlash 1.4s ease;}

/* VIP LOCKED BUTTON */
.vip-locked-btn{width:100%;padding:18px 20px;background:rgba(245,184,0,.07);border:1px solid rgba(245,184,0,.28);border-radius:16px;margin-bottom:30px;display:flex;align-items:center;gap:10px;font-family:var(--f);font-weight:700;font-size:14px;letter-spacing:.5px;color:var(--gold);transition:background .2s,border-color .2s,transform .15s;}
.vip-locked-btn:hover{background:rgba(245,184,0,.13);border-color:rgba(245,184,0,.48);transform:translateY(-1px);}
.vip-locked-fee{margin-left:auto;font-family:var(--fm);font-size:13px;font-weight:500;color:var(--w70);}

/* BID BUTTON */
.bid-btn{width:100%;padding:19px;background:var(--gold);color:var(--bg);font-family:var(--f);font-weight:800;font-size:15px;letter-spacing:1.5px;border-radius:16px;margin-bottom:30px;display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 4px 32px rgba(245,184,0,.2);transition:all .25s;}
.bid-btn:not(.bid-btn-off):not(.bid-btn-ok):hover{background:#FFD740;box-shadow:0 6px 44px rgba(245,184,0,.34);transform:translateY(-1px);}
.bid-btn-ok{background:var(--green);box-shadow:0 4px 32px rgba(48,209,88,.22);}
.bid-btn-off{background:var(--s3);color:var(--w40);box-shadow:none;cursor:default;letter-spacing:.5px;font-size:13px;}

/* HISTORY & SELLER */
.dv-section{margin-bottom:28px;}
.sec-title{font-size:11px;font-weight:700;letter-spacing:2.5px;color:var(--w40);text-transform:uppercase;margin-bottom:12px;}
.hist-list{display:flex;flex-direction:column;gap:2px;}
.hist-item{display:flex;align-items:center;gap:11px;padding:12px 14px;background:var(--s1);border-radius:12px;border:1px solid var(--w08);}
.hist-top{border-color:rgba(245,184,0,.18);background:var(--gold-glow);}
.hist-av{width:34px;height:34px;border-radius:50%;background:var(--s3);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:var(--w70);flex-shrink:0;}
.hist-top .hist-av{background:var(--gold-lo);color:var(--gold);}
.hist-info{flex:1;display:flex;flex-direction:column;min-width:0;}
.hist-user{font-size:13px;font-weight:600;}
.hist-time{font-size:11px;color:var(--w40);}
.hist-amt{font-family:var(--fm);font-size:14px;font-weight:600;}
.hist-top .hist-amt{color:var(--gold);}
.seller-card{display:flex;align-items:center;gap:14px;background:var(--s2);border:1px solid var(--w08);border-radius:14px;padding:15px;}
.seller-av{width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,var(--gold),#c8860a);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;color:var(--bg);flex-shrink:0;}
.seller-name{display:block;font-size:14px;font-weight:700;}
.seller-rating{display:block;font-size:11px;color:var(--gold);margin-top:2px;}
.seller-rating em{color:var(--w40);font-style:normal;}

/* GOLD GLOW */
.gold-glow{background:var(--gold-glow);}

/* KEYFRAMES */
@keyframes riseIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadein{from{opacity:0}to{opacity:1}}
@keyframes slideup{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes slideright{from{opacity:0;transform:translateX(28px)}to{opacity:1;transform:translateX(0)}}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
@keyframes gpulse{0%{box-shadow:0 0 0 0 rgba(48,209,88,.5)}70%{box-shadow:0 0 0 7px rgba(48,209,88,0)}100%{box-shadow:0 0 0 0 rgba(48,209,88,0)}}
@keyframes livepip{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.75)}}
@keyframes breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.007)}}
@keyframes bellpop{0%{transform:scale(1)}40%{transform:scale(1.3) rotate(-12deg)}70%{transform:scale(.9) rotate(6deg)}100%{transform:scale(1) rotate(0)}}

/* ── FAB removed — publish lives in header ── */
.hdr-right{display:flex;flex-direction:column;align-items:flex-end;gap:6px;margin-top:2px;}
.hdr-icons{display:flex;gap:6px;}
.hdr-publish-btn{
  display:flex;align-items:center;gap:6px;
  width:100%;justify-content:center;
  background:transparent;
  border:1px solid var(--w08);border-radius:8px;
  color:var(--w40);font-family:var(--f);font-size:11px;font-weight:700;
  letter-spacing:.5px;padding:6px 10px;
  transition:border-color .2s,color .2s,background .2s;
  white-space:nowrap;
}
.hdr-publish-btn:hover{border-color:var(--gold);color:var(--gold);background:var(--gold-lo);}

/* ── IMAGE UPLOAD ── */
.ca-img-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;}
.ca-img-counter{font-family:var(--fm);font-size:11px;color:var(--w40);}
.ca-img-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
.ca-img-thumb{position:relative;aspect-ratio:1;border-radius:10px;overflow:hidden;border:1px solid var(--w08);}
.ca-img-thumb-main{border-color:rgba(245,184,0,.35);box-shadow:0 0 16px rgba(245,184,0,.08);}
.ca-img-preview{width:100%;height:100%;object-fit:cover;display:block;}
.ca-img-main-badge{position:absolute;bottom:6px;left:6px;font-size:8px;font-weight:700;letter-spacing:1px;text-transform:uppercase;background:var(--gold);color:var(--bg);padding:2px 7px;border-radius:20px;}
.ca-img-remove{position:absolute;top:5px;right:5px;width:22px;height:22px;border-radius:50%;background:rgba(10,10,10,.75);backdrop-filter:blur(6px);border:1px solid var(--w15);color:var(--white);display:flex;align-items:center;justify-content:center;transition:background .15s;}
.ca-img-remove:hover{background:rgba(255,59,48,.8);}
.ca-img-add{aspect-ratio:1;border-radius:10px;border:1px dashed var(--w15);cursor:pointer;transition:border-color .2s,background .2s;display:block;}
.ca-img-add:hover{border-color:rgba(245,184,0,.35);background:var(--gold-lo);}
.ca-img-add-inner{width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;color:var(--w40);font-size:11px;font-weight:600;}
.ca-img-add:hover .ca-img-add-inner{color:var(--gold);}
.ca-file-inp{display:none;}
.ca-img-required{font-size:11px;color:var(--red);margin-top:4px;}
.ca-root{position:fixed;inset:0;z-index:500;display:flex;flex-direction:column;background:var(--bg);animation:slideright .3s cubic-bezier(.25,.46,.45,.94);}
.ca-header{display:flex;align-items:center;gap:14px;padding:18px 22px 16px;border-bottom:1px solid var(--w08);}
.ca-title{font-size:22px;font-weight:800;letter-spacing:-.5px;background:linear-gradient(120deg,var(--white) 30%,var(--gold));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;line-height:1;}
.ca-platform{font-size:10px;font-weight:400;letter-spacing:3px;text-transform:uppercase;color:var(--w40);margin-top:4px;}
.ca-platform span{color:var(--w70);font-weight:600;}
.ca-step-lbl{font-family:var(--fm);font-size:12px;color:var(--w40);flex-shrink:0;}

/* step indicator */
.ca-steps{display:flex;align-items:center;padding:16px 22px;gap:0;border-bottom:1px solid var(--w08);}
.ca-step-item{display:flex;align-items:center;gap:7px;flex:1;font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--w40);transition:color .3s;}
.ca-step-item:not(:last-child)::after{content:'';flex:1;height:1px;background:var(--w08);margin:0 8px;}
.ca-step-active{color:var(--gold);}
.ca-step-done{color:var(--green);}
.ca-step-dot{width:22px;height:22px;border-radius:50%;background:var(--s3);border:1px solid var(--w08);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0;transition:all .3s;}
.ca-step-active .ca-step-dot{background:var(--gold-lo);border-color:rgba(245,184,0,.4);color:var(--gold);}
.ca-step-done .ca-step-dot{background:rgba(48,209,88,.1);border-color:rgba(48,209,88,.3);color:var(--green);}

/* body */
.ca-body{flex:1;overflow-y:auto;scrollbar-width:none;padding:24px 22px 16px;}
.ca-body::-webkit-scrollbar{display:none;}
.ca-fields{display:flex;flex-direction:column;gap:20px;}
.ca-section-lbl{font-size:10px;font-weight:700;letter-spacing:2.5px;color:var(--w40);text-transform:uppercase;margin-bottom:-8px;}
.ca-field{display:flex;flex-direction:column;gap:6px;}
.ca-lbl{font-size:12px;font-weight:700;color:var(--w70);letter-spacing:.5px;}
.ca-req{color:var(--gold);}
.ca-inp{background:var(--s2);border:1px solid var(--w08);border-radius:12px;padding:14px 16px;font-family:var(--f);font-size:15px;color:var(--white);outline:none;transition:border-color .2s;width:100%;}
.ca-inp:focus{border-color:rgba(245,184,0,.4);}
.ca-inp::placeholder{color:var(--w15);}
.ca-char{font-size:10px;color:var(--w40);text-align:right;font-family:var(--fm);}
.ca-hint{font-size:11px;color:var(--w40);line-height:1.5;}

/* type cards */
.ca-type-card{display:flex;align-items:center;gap:14px;background:var(--s2);border:1px solid var(--w08);border-radius:14px;padding:16px;text-align:left;transition:all .2s;width:100%;}
.ca-type-card:hover:not(.ca-type-disabled){border-color:var(--w15);}
.ca-type-on{border-color:rgba(245,184,0,.35);background:var(--gold-lo);}
.ca-type-on-vip{border-color:rgba(245,184,0,.4);}
.ca-type-disabled{opacity:.4;cursor:not-allowed;}
.ca-type-icon{width:42px;height:42px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.ca-type-icon-normal{background:var(--s3);border:1px solid var(--w08);}
.ca-type-icon-vip{background:rgba(245,184,0,.08);border:1px solid rgba(245,184,0,.2);}
.ca-type-info{flex:1;display:flex;flex-direction:column;gap:3px;}
.ca-type-name{font-size:14px;font-weight:700;color:var(--white);display:flex;align-items:center;gap:8px;}
.ca-type-badge{font-size:8px;font-weight:700;letter-spacing:1.5px;background:var(--gold);color:var(--bg);padding:2px 6px;border-radius:20px;}
.ca-type-desc{font-size:11px;color:var(--w40);line-height:1.4;}
.ca-type-lock{color:var(--w40);}

/* VIP fee */
.ca-vip-fee-block{background:var(--s2);border:1px solid rgba(245,184,0,.15);border-radius:14px;padding:16px;display:flex;flex-direction:column;gap:10px;animation:riseIn .25s both;}
.ca-fee-chips{display:flex;gap:8px;flex-wrap:wrap;}
.ca-fee-chip{flex:1;min-width:calc(25% - 8px);padding:11px 6px;background:var(--s3);border:1px solid var(--w08);border-radius:9px;font-family:var(--f);font-size:12px;font-weight:700;color:var(--w40);transition:all .18s;text-align:center;}
.ca-fee-chip:hover{border-color:var(--w15);color:var(--w70);}
.ca-fee-chip-on{background:var(--gold-lo);border-color:rgba(245,184,0,.4);color:var(--gold);}
.ca-fee-chip-other{flex:0 0 auto;min-width:52px;}
.ca-custom-fee-wrap{display:flex;align-items:center;gap:6px;background:var(--s2);border:1px solid rgba(245,184,0,.3);border-radius:12px;overflow:hidden;animation:riseIn .2s both;}
.ca-custom-fee-wrap .ca-inp-price{border:none;border-radius:0;background:transparent;}
.ca-fee-error{font-size:10px;font-weight:700;color:var(--red);white-space:nowrap;padding-right:12px;}
.ca-fee-note{display:flex;align-items:flex-start;gap:7px;font-size:11px;color:var(--w70);line-height:1.5;}

/* price input */
.ca-price-wrap{display:flex;align-items:center;gap:0;background:var(--s2);border:1px solid var(--w08);border-radius:12px;overflow:hidden;transition:border-color .2s;}
.ca-price-wrap:focus-within{border-color:rgba(245,184,0,.4);}
.ca-inp-price{border:none;border-radius:0;background:transparent;font-size:22px;font-weight:800;font-family:var(--fm);padding:14px 16px;flex:1;-moz-appearance:textfield;}
.ca-inp-price::-webkit-outer-spin-button,.ca-inp-price::-webkit-inner-spin-button{-webkit-appearance:none;}
.ca-price-unit{padding:0 16px 0 4px;font-size:14px;font-weight:700;color:var(--gold);font-family:var(--fm);}

/* duration grid */
.ca-duration-grid{display:flex;flex-wrap:wrap;gap:8px;}
.ca-dur-chip{padding:10px 14px;background:var(--s2);border:1px solid var(--w08);border-radius:9px;font-family:var(--f);font-size:12px;font-weight:600;color:var(--w40);transition:all .18s;}
.ca-dur-chip:hover{border-color:var(--w15);color:var(--w70);}
.ca-dur-on{background:var(--gold-lo);border-color:rgba(245,184,0,.4);color:var(--gold);}

/* preview card */
.ca-preview-card{background:var(--s2);border:1px solid var(--w08);border-radius:14px;padding:18px;display:flex;flex-direction:column;gap:12px;}
.ca-preview-row{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;}
.ca-preview-lbl{font-size:11px;color:var(--w40);letter-spacing:.5px;flex-shrink:0;}
.ca-preview-val{font-size:13px;font-weight:600;color:var(--white);text-align:right;}
.ca-preview-gold{color:var(--gold);}
.ca-preview-divider{height:1px;background:var(--w08);}

/* publish button */
.ca-publish-btn{width:100%;padding:18px;background:var(--gold);color:var(--bg);font-family:var(--f);font-weight:800;font-size:15px;letter-spacing:1px;border-radius:14px;display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 4px 28px rgba(245,184,0,.2);transition:all .2s;}
.ca-publish-btn:hover:not(:disabled){background:#FFD740;box-shadow:0 6px 38px rgba(245,184,0,.34);transform:translateY(-1px);}
.ca-publish-loading{opacity:.7;cursor:wait;}
.ca-spinner{width:16px;height:16px;border:2px solid rgba(0,0,0,.2);border-top-color:var(--bg);border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0;}
@keyframes spin{to{transform:rotate(360deg)}}

/* done state */
.ca-done{display:flex;flex-direction:column;align-items:center;gap:14px;padding:40px 0;text-align:center;}
.ca-done-icon{width:72px;height:72px;border-radius:50%;background:rgba(48,209,88,.1);border:1px solid rgba(48,209,88,.3);display:flex;align-items:center;justify-content:center;}
.ca-done-title{font-size:22px;font-weight:800;}
.ca-done-sub{font-size:13px;color:var(--w40);line-height:1.6;}

/* footer nav */
.ca-footer{display:flex;justify-content:space-between;align-items:center;padding:16px 22px 32px;border-top:1px solid var(--w08);}
.ca-back-btn{display:flex;align-items:center;gap:7px;font-family:var(--f);font-size:14px;font-weight:600;color:var(--w40);padding:12px 0;transition:color .2s;}
.ca-back-btn:hover{color:var(--w70);}
.ca-next-btn{display:flex;align-items:center;gap:8px;background:var(--gold);color:var(--bg);font-family:var(--f);font-weight:800;font-size:14px;letter-spacing:.5px;padding:14px 24px;border-radius:50px;box-shadow:0 4px 20px rgba(245,184,0,.2);transition:all .2s;}
.ca-next-btn:hover:not(.ca-next-off){background:#FFD740;box-shadow:0 6px 28px rgba(245,184,0,.3);transform:translateY(-1px);}
.ca-next-off{background:var(--s3);color:var(--w40);box-shadow:none;cursor:not-allowed;}
`;
