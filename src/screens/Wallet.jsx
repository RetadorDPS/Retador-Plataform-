import { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo } from "react";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Banknote, Fingerprint, History, Home, KeyRound, Landmark, Phone, PlusCircle, QrCode, Search, Send, ShieldCheck, ShoppingBag, UserCircle2, Users, Wallet, AlertCircle, ArrowLeft, BadgeCheck, Building2, Camera, Check, CheckCircle2, ChevronRight, Copy, CreditCard, Eye, EyeOff, Info, Loader2, Lock, Plus, Receipt, Share2, Trash2 } from "lucide-react";

const WalletApp = (() => {

/* ============================================================================
   OMEGA PAY — Billetera digital multi-moneda (USD / EUR / CUP)
   ----------------------------------------------------------------------------
   Single-file React module, listo para pegar en Blink.

   MÓDULOS simulados (en producción viven en Supabase / retador_backend.js):

     · Wallet            → useWallet()        → tabla wallet_balances
                            (un saldo INDEPENDIENTE por moneda, nunca se
                            mezclan ni se convierten automáticamente)
     · Exchange Rates     → useState(exchangeRates) → tabla exchange_rates,
                            actualizada A MANO cada día desde el panel de
                            administración (NO se consulta ningún mercado en
                            tiempo real — esto es clave para el CUP, que no
                            tiene una tasa oficial fiable). La app solo LEE
                            esta tabla para mostrar equivalencias informativas;
                            nunca la usa para mover saldo real entre monedas.
     · Transactions/Ledger → useState(transactions) → tabla wallet_ledger,
                            cada movimiento guarda su propia moneda (tx.currency)
     · Payment Engine    → SendMoneyOverlay / PayOverlay (RPC send_payment, pay_order)
     · Bank Accounts     → useState(bankAccounts), cada cuenta tiene su propia
                            moneda (linked_bank_accounts.currency)
     · QR Payments       → ReceiveMoneyScreen / modo "QR" en SendMoneyOverlay
     · Security          → useInactivityLock(), security state (PIN, biometría)

   REGLA DE ORO (la que pediste): una recarga, envío o pago SIEMPRE se guarda
   y se descuenta/abona en la moneda exacta en la que se hizo. 1.000 CUP
   nunca se convierten en 1.000 USD por error: cada moneda tiene su propio
   cajón de saldo (wallet.balances.USD / .EUR / .CUP) y las conversiones solo
   existen como referencia visual (con el símbolo ≈) en la tarjeta y en el
   Conversor — jamás mueven dinero real entre cajones.
============================================================================ */

/* --------------------------------- Monedas ----------------------------------- */

const CURRENCIES = {
  USD: { code: "USD", symbol: "$", position: "prefix", name: "Dólar estadounidense" },
  EUR: { code: "EUR", symbol: "€", position: "prefix", name: "Euro" },
  CUP: { code: "CUP", symbol: "CUP", position: "suffix", name: "Peso cubano" },
};
const CURRENCY_LIST = ["USD", "EUR", "CUP"];

/* ---------------------------------- Helpers ---------------------------------- */

const formatMoney = (value, currency = "USD", { sign = false } = {}) => {
  const cfg = CURRENCIES[currency] || CURRENCIES.USD;
  const abs = Math.abs(value || 0);
  const formatted = abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const signStr = sign ? (value < 0 ? "-" : "+") : "";
  return cfg.position === "prefix" ? `${signStr}${cfg.symbol}${formatted}` : `${signStr}${formatted} ${cfg.symbol}`;
};

const relativeTime = (date) => {
  date = date instanceof Date ? date : new Date(date);
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMin < 1) return "justo ahora";
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `hace ${diffH} h`;
  return `hace ${Math.floor(diffH / 24)} d`;
};

const sameDay = (a, b) => a.toDateString() === b.toDateString();

const formatDateLabel = (date) => {
  date = date instanceof Date ? date : new Date(date);
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  if (sameDay(date, today)) return "Hoy";
  if (sameDay(date, yest)) return "Ayer";
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
};

const formatTime = (date) => (date instanceof Date ? date : new Date(date)).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

const initials = (name) => name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

const AVATAR_PALETTE = [
  "bg-violet-100 text-violet-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
  "bg-sky-100 text-sky-700",
  "bg-rose-100 text-rose-700",
  "bg-indigo-100 text-indigo-700",
];
const colorForName = (name) => AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length];

const CATEGORY_LABELS = { ingreso: "Ingreso", gasto: "Envío", marketplace: "Marketplace", recarga: "Recarga", retiro: "Retiro" };
const labelForCategory = (cat) => CATEGORY_LABELS[cat] || cat;

// Convierte un importe entre monedas usando las tasas (solo para mostrar
// equivalencias, nunca para mover saldo real). rates.rates[X] = unidades de
// X que equivalen a 1 USD.
const convertAmount = (amount, from, to, rates) => {
  if (from === to) return amount;
  const usd = amount / rates.rates[from];
  return usd * rates.rates[to];
};

/* ------------------------------- Datos simulados ------------------------------ */

const SEED_USER = {
  name: "Daniel",
  username: "@daniel",
  omegaId: "OP-48213-7765",
  phone: "+34 612 345 678",
  verifiedSince: "12 de marzo de 2026",
};

const SEED_CONTACTS = [
  { id: "c1", name: "Marta Ruiz", username: "@martaruiz" },
  { id: "c2", name: "Carlos Peña", username: "@carlospena" },
  { id: "c3", name: "Lucía Gómez", username: "@luciagomez" },
  { id: "c4", name: "Javier Soto", username: "@javiersoto" },
  { id: "c5", name: "Aitana Vidal", username: "@aitanavidal" },
];

const SEED_ORDERS = [
  { id: "ORD-7741", vendor: "TecnoMarket", item: "Funda + protector de pantalla", amount: 18.9, currency: "USD" },
  { id: "ORD-7742", vendor: "Hogar Plus", item: "Set de toallas (3 uds.)", amount: 32.5, currency: "USD" },
  { id: "ORD-7743", vendor: "Mercado Local Habana", item: "Paquete de víveres", amount: 4200, currency: "CUP" },
];

const SEED_TRANSACTIONS = [
  { id: "t1", type: "receive", category: "ingreso", name: "Marta Ruiz", amount: 45, currency: "USD", date: new Date(Date.now() - 1000 * 60 * 25), status: "completado", note: "Cena del sábado" },
  { id: "t2", type: "payment", category: "marketplace", name: "TecnoMarket", amount: -24.99, currency: "USD", date: new Date(Date.now() - 1000 * 60 * 60 * 5), status: "completado", note: "Pedido #ORD-7711" },
  { id: "t3", type: "send", category: "gasto", name: "Carlos Peña", amount: -15, currency: "USD", date: new Date(Date.now() - 1000 * 60 * 60 * 9), status: "completado", note: "" },
  { id: "t4", type: "topup", category: "recarga", name: "Bankinter •••• 4521", amount: 150, currency: "EUR", date: new Date(Date.now() - 1000 * 60 * 60 * 30), status: "completado", note: "Recarga de saldo" },
  { id: "t5", type: "send", category: "gasto", name: "Lucía Gómez", amount: -8.5, currency: "USD", date: new Date(Date.now() - 1000 * 60 * 60 * 52), status: "pendiente", note: "Parte del taxi" },
  { id: "t6", type: "payment", category: "marketplace", name: "Hogar Plus", amount: -12.3, currency: "USD", date: new Date(Date.now() - 1000 * 60 * 60 * 80), status: "completado", note: "Pedido #ORD-7698" },
  { id: "t7", type: "receive", category: "ingreso", name: "Javier Soto", amount: 60, currency: "USD", date: new Date(Date.now() - 1000 * 60 * 60 * 100), status: "fallido", note: "Reembolso" },
  { id: "t8", type: "topup", category: "recarga", name: "Banco Metropolitano •••• 7790", amount: 5000, currency: "CUP", date: new Date(Date.now() - 1000 * 60 * 60 * 120), status: "completado", note: "Recarga de saldo" },
];

const SEED_BANK_ACCOUNTS = [
  { id: "b1", bank: "Bankinter", alias: "Cuenta principal", last4: "4521", currency: "EUR", isDefault: true },
  { id: "b2", bank: "Banco Metropolitano", alias: "Cuenta en Cuba", last4: "7790", currency: "CUP", isDefault: false },
];

const AVAILABLE_BANKS = ["BBVA", "Santander", "CaixaBank", "Bankinter", "ING", "Abanca", "BPA", "BANDEC", "Banco Metropolitano"];

// EJEMPLO de tasas — sustituir por las cifras reales que introduzca el equipo
// desde el panel de administración cada día. rates[X] = cuántas unidades de
// X equivalen a 1 USD. El CUP en particular fluctúa con tasas informales que
// no existen en ningún feed de mercado, por eso esto es siempre manual.
const SEED_EXCHANGE_RATES = {
  base: "USD",
  updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
  rates: { USD: 1, EUR: 0.93, CUP: 320 },
};

/* ------------------------------------ CSS ------------------------------------- */

const STYLE = `
  .op-card { position: relative; overflow: hidden; border-radius: 1.5rem; padding: 1.5rem;
    box-shadow: 0 20px 35px -18px rgba(30,20,70,0.55);
    background: linear-gradient(135deg, #020617 0%, #2e1065 55%, #1e1b4b 100%); }
  .op-watermark { position: absolute; right: -28px; top: -36px; font-size: 11rem; line-height: 1;
    color: rgba(255,255,255,0.05); font-family: Georgia, "Times New Roman", serif;
    transform: rotate(10deg); user-select: none; pointer-events: none; }
  .op-w-90 { color: rgba(255,255,255,0.9); }
  .op-w-65 { color: rgba(255,255,255,0.65); }
  .op-w-50 { color: rgba(255,255,255,0.5); }
  .op-w-35 { color: rgba(255,255,255,0.35); }
  .text-2xs { font-size: 11px; line-height: 1rem; }

  @keyframes opSheen { 0% { transform: translateX(-130%) skewX(-12deg); } 100% { transform: translateX(160%) skewX(-12deg); } }
  .op-sheen { position: absolute; inset: 0; pointer-events: none;
    background: linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.10) 50%, transparent 70%);
    animation: opSheen 3.2s ease-in-out 1; }

  @keyframes opShake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-6px); }
    40% { transform: translateX(6px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); } }
  .op-shake { animation: opShake 0.4s ease; }

  @keyframes opSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
  .op-slide-up { animation: opSlideUp 0.32s cubic-bezier(.32,.72,0,1); }

  @keyframes opSheetUp { from { transform: translateY(32px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  .op-sheet-up { animation: opSheetUp 0.28s cubic-bezier(.32,.72,0,1); }

  @keyframes opFadeIn { from { opacity: 0; } to { opacity: 1; } }
  .op-fade-in { animation: opFadeIn 0.25s ease; }

  @keyframes opPop { 0% { transform: scale(0.6); opacity: 0; } 70% { transform: scale(1.08); } 100% { transform: scale(1); opacity: 1; } }
  .op-pop { animation: opPop 0.4s cubic-bezier(.34,1.56,.64,1); }

  @media (prefers-reduced-motion: reduce) {
    .op-sheen, .op-shake, .op-slide-up, .op-sheet-up, .op-fade-in, .op-pop { animation: none !important; }
  }

  /* ── Tema oscuro: la billetera adopta el modo oscuro de RETADOR ── */
  .wallet-dark.bg-slate-100, .wallet-dark .bg-slate-100 { background-color:#0a0a0a !important; }
  .wallet-dark .bg-slate-50 { background-color:#111113 !important; }
  .wallet-dark .bg-white { background-color:#18181b !important; }
  .wallet-dark .bg-slate-200 { background-color:#26262b !important; }
  .wallet-dark .bg-slate-900 { background-color:#000 !important; }
  .wallet-dark .text-slate-900 { color:#f3f4f6 !important; }
  .wallet-dark .text-slate-800 { color:#e5e7eb !important; }
  .wallet-dark .text-slate-700 { color:#d1d5db !important; }
  .wallet-dark .text-slate-600 { color:#b6bcc6 !important; }
  .wallet-dark .text-slate-500 { color:#9aa1ad !important; }
  .wallet-dark .text-slate-400 { color:#7c828e !important; }
  .wallet-dark .text-slate-300 { color:#6b7280 !important; }
  .wallet-dark .border-slate-200 { border-color:#2a2a30 !important; }
  .wallet-dark .border-slate-100 { border-color:#222227 !important; }
  .wallet-dark .border-slate-300 { border-color:#33333a !important; }
  .wallet-dark .divide-slate-100 > * + * { border-color:#222227 !important; }
  .wallet-dark .bg-violet-50 { background-color:#1e1b3a !important; }
  .wallet-dark .bg-emerald-50 { background-color:#0c2a20 !important; }
  .wallet-dark .bg-amber-50 { background-color:#2a230c !important; }
  .wallet-dark .text-violet-600 { color:#a78bfa !important; }
  .wallet-dark .text-emerald-600 { color:#34d399 !important; }
  .wallet-dark .shadow-sm, .wallet-dark .shadow, .wallet-dark .shadow-md, .wallet-dark .shadow-lg { box-shadow:0 1px 3px rgba(0,0,0,.5) !important; }
  .wallet-dark input, .wallet-dark textarea { background-color:#18181b !important; color:#f3f4f6 !important; }
  .wallet-dark input::placeholder { color:#6b7280 !important; }
`;

/* ------------------------------------ Hooks ------------------------------------ */

// MODULE: Wallet — producción: lee de `wallet_balances` (una fila por
// usuario+moneda), se suscribe en tiempo real a `wallet_ledger` vía Supabase
// Realtime. adjustBalance SIEMPRE recibe la moneda exacta del movimiento.
function useWallet(rates) {
  const [state, setState] = useState(() => {
    try { const r = localStorage.getItem("retador_wallet"); if (r) { const w = JSON.parse(r); if (typeof w.baseUSD === "number") return { baseUSD: w.baseUSD, primaryCurrency: w.primaryCurrency || "USD", hidden: !!w.hidden }; } } catch {}
    return { baseUSD: 1248.5, primaryCurrency: "USD", hidden: false };
  });
  useEffect(() => { try { localStorage.setItem("retador_wallet", JSON.stringify(state)); } catch {} }, [state]);
  const r = (rates && rates.rates) || { USD: 1, EUR: 0.93, CUP: 320 };
  // Un solo dinero (base USD) mostrado en cada moneda según la tasa del panel → siempre equivalentes
  const wallet = {
    ...state,
    balances: {
      USD: +(state.baseUSD * (r.USD || 1)).toFixed(2),
      EUR: +(state.baseUSD * (r.EUR || 1)).toFixed(2),
      CUP: +(state.baseUSD * (r.CUP || 1)).toFixed(2),
    },
    updatedAt: (rates && rates.updatedAt) || new Date(),
  };
  const toggleHidden = () => setState((w) => ({ ...w, hidden: !w.hidden }));
  const setPrimaryCurrency = (currency) => setState((w) => ({ ...w, primaryCurrency: currency }));
  const adjustBalance = (currency, delta) => setState((w) => ({ ...w, baseUSD: +(w.baseUSD + delta / (r[currency] || 1)).toFixed(6) }));
  return { wallet, toggleHidden, adjustBalance, setPrimaryCurrency };
}

// MODULE: Security — cierre automático por inactividad.
function useInactivityLock(autoLockMinutes) {
  const [locked, setLocked] = useState(false);
  const lastActivity = useRef(Date.now());

  useEffect(() => {
    const bump = () => { lastActivity.current = Date.now(); };
    const events = ["pointerdown", "keydown", "touchstart", "wheel"];
    events.forEach((e) => window.addEventListener(e, bump));
    return () => events.forEach((e) => window.removeEventListener(e, bump));
  }, []);

  useEffect(() => {
    if (!autoLockMinutes) return;
    const id = setInterval(() => {
      if (Date.now() - lastActivity.current > autoLockMinutes * 60000) setLocked(true);
    }, 2000);
    return () => clearInterval(id);
  }, [autoLockMinutes]);

  const unlock = () => { setLocked(false); lastActivity.current = Date.now(); };
  return { locked, unlock, lock: () => setLocked(true) };
}

/* --------------------------------- Átomos UI ----------------------------------- */

function Avatar({ name, size = "md" }) {
  const sizes = { sm: "h-8 w-8 text-xs", md: "h-11 w-11 text-sm", lg: "h-16 w-16 text-lg" };
  return (
    <div className={`flex items-center justify-center rounded-full font-semibold shrink-0 ${colorForName(name)} ${sizes[size]}`}>
      {initials(name)}
    </div>
  );
}

function StatusChip({ status }) {
  const map = {
    completado: "bg-emerald-50 text-emerald-700",
    pendiente: "bg-amber-50 text-amber-700",
    fallido: "bg-rose-50 text-rose-600",
  };
  const label = { completado: "Completado", pendiente: "Pendiente", fallido: "Fallido" }[status];
  return <span className={`px-2 py-0.5 rounded-full text-2xs font-medium ${map[status]}`}>{label}</span>;
}

function CurrencyTag({ currency }) {
  return <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 text-2xs font-semibold">{currency}</span>;
}

// Selector de moneda en píldoras, reutilizado en varias pantallas claras.
function CurrencySegment({ value, onChange, options = CURRENCY_LIST }) {
  return (
    <div className="flex gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1">
      {options.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={`flex-1 h-8 rounded-lg text-xs font-semibold transition ${value === c ? "bg-violet-600 text-white" : "text-slate-500"}`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-8 py-14">
      <div className="h-16 w-16 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center mb-4">
        <Icon className="h-7 w-7 text-slate-300" strokeWidth={1.5} />
      </div>
      <p className="text-slate-700 font-medium text-sm">{title}</p>
      {subtitle && <p className="text-slate-400 text-xs mt-1.5">{subtitle}</p>}
      {action}
    </div>
  );
}

function ScreenHeader({ title, onBack, right }) {
  return (
    <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
      <button onClick={onBack} className="h-9 w-9 -ml-2 flex items-center justify-center rounded-full active:bg-slate-100 transition">
        <ArrowLeft className="h-5 w-5 text-slate-700" />
      </button>
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      <div className="h-9 w-9 flex items-center justify-center">{right}</div>
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className="text-xs text-slate-400 shrink-0">{label}</span>
      <span className={`text-right truncate ${bold ? "text-slate-900 font-mono font-semibold text-sm" : "text-xs text-slate-700 font-medium"}`}>
        {value}
      </span>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button onClick={() => onChange(!checked)} aria-pressed={checked}
      style={{ width: 44, height: 24, borderRadius: 999, position: "relative", flexShrink: 0, transition: "background .2s", background: checked ? "#7c3aed" : "#cbd5e1", border: "none", cursor: "pointer", padding: 0 }}>
      <span style={{ position: "absolute", top: 2, left: checked ? 22 : 2, height: 20, width: 20, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,.3)", transition: "left .2s" }} />
    </button>
  );
}

function SettingRow({ icon: Icon, title, desc, right }) {
  return (
    <div className="flex items-center gap-3 py-3.5 border-b border-slate-100 last:border-0">
      <div className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-slate-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900">{title}</p>
        <p className="text-xs text-slate-400">{desc}</p>
      </div>
      {right}
    </div>
  );
}

function LimitBar({ label, used, total, currency, className = "" }) {
  const pct = Math.min(100, (used / total) * 100);
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-slate-500">{label}</span>
        <span className="text-xs font-mono text-slate-700">{formatMoney(used, currency)} / {formatMoney(total, currency)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full bg-violet-500 rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, onClick }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2 flex-1 active:scale-95 transition">
      <div className="h-14 w-14 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
        <Icon className="h-5 w-5 text-slate-700" strokeWidth={1.75} />
      </div>
      <span className="text-xs font-medium text-slate-600">{label}</span>
    </button>
  );
}

function NumericKeypad({ onPress }) {
  return (
    <div className="grid grid-cols-3 gap-3 mb-5 shrink-0">
      {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "del"].map((k) => (
        <button
          key={k}
          onClick={() => onPress(k)}
          className="h-14 rounded-2xl bg-slate-50 active:bg-slate-100 active:scale-95 transition text-lg font-mono font-medium text-slate-800 flex items-center justify-center"
        >
          {k === "del" ? "⌫" : k}
        </button>
      ))}
    </div>
  );
}

function PinPad({ length = 4, onComplete, error, subtitle }) {
  const [digits, setDigits] = useState([]);
  useEffect(() => { setDigits([]); }, [error]);

  const press = (d) => {
    if (digits.length >= length) return;
    const next = [...digits, d];
    setDigits(next);
    if (next.length === length) {
      const pin = next.join("");
      setTimeout(() => onComplete(pin), 150);
      setTimeout(() => setDigits([]), 500);
    }
  };
  const del = () => setDigits((d) => d.slice(0, -1));

  return (
    <div className="flex flex-col items-center w-full">
      <div className={`flex gap-3.5 mb-7 ${error ? "op-shake" : ""}`}>
        {Array.from({ length }).map((_, i) => (
          <div key={i} className="rounded-full transition-all" style={{ height: 13, width: 13, background: i < digits.length ? "#7c3aed" : "transparent", border: i < digits.length ? "none" : "2px solid #cbd5e1" }} />
        ))}
      </div>
      {error ? (
        <p className="text-rose-500 text-xs mb-5">{error}</p>
      ) : subtitle ? (
        <p className="text-slate-400 text-xs mb-5 text-center">{subtitle}</p>
      ) : null}
      <div className="grid grid-cols-3 w-full" style={{ maxWidth: 286, gap: 14 }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button key={n} onClick={() => press(String(n))} className="rounded-2xl bg-slate-50 border border-slate-200 active:bg-slate-100 active:scale-95 transition font-mono font-medium text-slate-800 flex items-center justify-center" style={{ height: 62, fontSize: 22 }}>
            {n}
          </button>
        ))}
        <div />
        <button onClick={() => press("0")} className="rounded-2xl bg-slate-50 border border-slate-200 active:bg-slate-100 active:scale-95 transition font-mono font-medium text-slate-800 flex items-center justify-center" style={{ height: 62, fontSize: 22 }}>0</button>
        <button onClick={del} className="rounded-2xl flex items-center justify-center text-slate-400 active:bg-slate-50 transition" style={{ height: 62, fontSize: 20 }} aria-label="Borrar">⌫</button>
      </div>
    </div>
  );
}

function SuccessScreen({ title, subtitle, onDone }) {
  return (
    <div className="flex flex-col h-full items-center justify-center px-8 text-center op-fade-in">
      <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center mb-5 op-pop">
        <CheckCircle2 className="h-9 w-9 text-emerald-600" strokeWidth={1.75} />
      </div>
      <p className="font-semibold text-lg text-slate-900 mb-1.5">{title}</p>
      {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
      <button onClick={onDone} className="mt-10 h-12 px-8 rounded-2xl bg-slate-900 text-white font-semibold text-sm active:scale-[0.98] transition">
        Volver al inicio
      </button>
    </div>
  );
}

function ConfirmSheet({ title, subtitle, confirmLabel = "Confirmar", danger, onConfirm, onCancel }) {
  return (
    <div className="absolute inset-0 z-40 flex items-end">
      <div className="absolute inset-0 bg-slate-900 opacity-30" onClick={onCancel} />
      <div className="relative w-full bg-white rounded-t-3xl p-6 pb-8 op-sheet-up">
        <div className="h-1 w-9 bg-slate-200 rounded-full mx-auto mb-5" />
        <div className="flex items-start gap-3 mb-6">
          <AlertCircle className={`h-5 w-5 mt-0.5 shrink-0 ${danger ? "text-rose-500" : "text-amber-500"}`} />
          <div>
            <p className="font-semibold text-slate-900 text-sm">{title}</p>
            <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 h-11 rounded-2xl border border-slate-200 text-slate-700 font-medium text-sm active:bg-slate-50 transition">
            Cancelar
          </button>
          <button onClick={onConfirm} className={`flex-1 h-11 rounded-2xl text-white font-semibold text-sm active:scale-[0.98] transition ${danger ? "bg-rose-500" : "bg-violet-600"}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// Aviso reutilizable de saldo insuficiente EN UNA MONEDA CONCRETA — nunca
// ofrece "completar con otra moneda" automáticamente, solo dirige a Añadir
// fondos o al Conversor para que el usuario decida con información clara.
function InsufficientFunds({ currency, available, onAddFunds, onOpenConverter }) {
  return (
    <div className="w-full bg-rose-50 border border-rose-100 rounded-2xl p-4">
      <div className="flex items-start gap-3 mb-3">
        <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-rose-900">Saldo insuficiente en {currency}</p>
          <p className="text-xs text-rose-700 mt-0.5">Tu saldo disponible en {currency} es {formatMoney(available, currency)}.</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onOpenConverter} className="flex-1 h-9 rounded-xl bg-white border border-rose-200 text-rose-700 text-xs font-semibold active:bg-rose-50 transition">
          Ver conversor
        </button>
        <button onClick={onAddFunds} className="flex-1 h-9 rounded-xl bg-rose-600 text-white text-xs font-semibold active:scale-[0.98] transition">
          Añadir fondos
        </button>
      </div>
    </div>
  );
}

const TX_CONFIG = {
  receive: { icon: ArrowDownLeft, tone: "text-emerald-600 bg-emerald-50" },
  send: { icon: ArrowUpRight, tone: "text-rose-500 bg-rose-50" },
  payment: { icon: ShoppingBag, tone: "text-violet-600 bg-violet-50" },
  topup: { icon: PlusCircle, tone: "text-emerald-600 bg-emerald-50" },
  withdrawal: { icon: Banknote, tone: "text-slate-600 bg-slate-100" },
};

function TransactionRow({ tx, onClick }) {
  const cfg = TX_CONFIG[tx.type];
  const Icon = cfg.icon;
  const positive = tx.amount > 0;
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 py-3 active:bg-slate-50 rounded-xl px-2 -mx-2 transition text-left">
      <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${cfg.tone}`}>
        <Icon className="h-4 w-4" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900 truncate">{tx.name}</p>
        <p className="text-xs text-slate-400 truncate">{formatTime(tx.date)} · {tx.note || labelForCategory(tx.category)}</p>
      </div>
      <div className="text-right shrink-0">
        <div className="flex items-center justify-end gap-1.5">
          <p className={`text-sm font-mono font-semibold ${positive ? "text-emerald-600" : "text-slate-900"}`}>
            {formatMoney(tx.amount, tx.currency, { sign: true })}
          </p>
          <CurrencyTag currency={tx.currency} />
        </div>
        {tx.status !== "completado" && <div className="mt-0.5 flex justify-end"><StatusChip status={tx.status} /></div>}
      </div>
    </button>
  );
}

function BottomNav({ tab, setTab }) {
  const items = [
    { key: "home", label: "Inicio", icon: Home },
    { key: "history", label: "Historial", icon: History },
    { key: "profile", label: "Perfil", icon: UserCircle2 },
  ];
  return (
    <div className="bg-white border-t border-slate-100 px-6 py-2 flex justify-around">
      {items.map((it) => {
        const active = tab === it.key;
        return (
          <button key={it.key} onClick={() => setTab(it.key)} className="flex flex-col items-center gap-1 py-1.5 px-4 active:scale-95 transition">
            <it.icon className={`h-5 w-5 ${active ? "text-violet-600" : "text-slate-400"}`} strokeWidth={active ? 2.2 : 1.8} />
            <span className={`text-2xs font-medium ${active ? "text-violet-600" : "text-slate-400"}`}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------- Tarjeta de saldo ------------------------------- */

function BalanceCard({ wallet, rates, onToggleHidden, onSelectCurrency, onOpenConverter }) {
  const cur = wallet.primaryCurrency;
  const balance = wallet.balances[cur];
  const others = CURRENCY_LIST.filter((c) => c !== cur);

  return (
    <div className="op-card">
      <div className="op-watermark">Ω</div>
      <div className="op-sheen" />

      <div className="flex items-center justify-between mb-5">
        <span className="text-xs font-semibold tracking-widest op-w-65">OMEGA PAY</span>
        <ShieldCheck className="h-4 w-4" style={{ color: "#fbbf24" }} />
      </div>

      <div className="flex gap-1.5 mb-4">
        {CURRENCY_LIST.map((c) => (
          <button
            key={c}
            onClick={() => onSelectCurrency(c)}
            className="px-2.5 h-7 rounded-full text-2xs font-semibold transition"
            style={c === cur ? { background: "rgba(255,255,255,0.18)", color: "#fff" } : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}
          >
            {c}
          </button>
        ))}
      </div>

      <p className="text-xs mb-1.5 op-w-50">Saldo disponible</p>
      <div className="flex items-center gap-3 min-w-0">
        <p className="font-mono text-3xl font-semibold tracking-tight tabular-nums text-white truncate min-w-0">
          {wallet.hidden ? "••••••" : formatMoney(balance, cur)}
        </p>
        <button onClick={onToggleHidden} className="op-w-50 transition" aria-label={wallet.hidden ? "Mostrar saldo" : "Ocultar saldo"}>
          {wallet.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
      </div>

      {!wallet.hidden && (
        <button onClick={onOpenConverter} className="text-xs mt-2 op-w-35 text-left">
          ≈ {formatMoney(convertAmount(balance, cur, others[0], rates), others[0])} · ≈ {formatMoney(convertAmount(balance, cur, others[1], rates), others[1])}
        </button>
      )}

      <p className="text-xs mt-3 op-w-35">Actualizado {relativeTime(wallet.updatedAt)}</p>
    </div>
  );
}

/* ----------------------------------- Pantallas ---------------------------------- */

function HomeScreen({ user, wallet, rates, toggleHidden, setPrimaryCurrency, transactions, openOverlay, goHistory }) {
  const recent = transactions.slice(0, 5);
  return (
    <div className="px-5 pt-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xl font-semibold text-slate-900">Hola, {user.name}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-xs text-slate-500 font-medium">{user.verifiedSince === "Cuenta verificada" ? "Cuenta verificada" : "Cuenta sin verificar"}</span>
          </div>
        </div>
      </div>

      <BalanceCard
        wallet={wallet}
        rates={rates}
        onToggleHidden={toggleHidden}
        onSelectCurrency={setPrimaryCurrency}
        onOpenConverter={() => openOverlay("converter")}
      />

      <div className="flex gap-2 mt-5">
        <QuickAction icon={Send} label="Enviar" onClick={() => openOverlay("send")} />
        <QuickAction icon={ArrowDownLeft} label="Recibir" onClick={() => openOverlay("receive")} />
        <QuickAction icon={ShoppingBag} label="Pagar" onClick={() => openOverlay("pay")} />
        <QuickAction icon={PlusCircle} label="Añadir" onClick={() => openOverlay("addFunds")} />
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-900">Actividad reciente</h3>
          <button onClick={goHistory} className="text-xs font-medium text-violet-600 flex items-center gap-0.5">
            Ver todo <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        {recent.length === 0 ? (
          <EmptyState icon={Wallet} title="Aún no has realizado ningún movimiento." subtitle="Cuando envíes, recibas o pagues, tus movimientos aparecerán aquí." />
        ) : (
          <div className="divide-y divide-slate-100">
            {recent.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} onClick={() => openOverlay("txDetail", tx.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryScreen({ transactions, openOverlay }) {
  const [filter, setFilter] = useState("todos");
  const [query, setQuery] = useState("");
  const filters = [
    { key: "todos", label: "Todos" },
    { key: "ingreso", label: "Ingresos" },
    { key: "gasto", label: "Gastos" },
    { key: "marketplace", label: "Marketplace" },
    { key: "recarga", label: "Recargas" },
    { key: "retiro", label: "Retiros" },
  ];

  const filteredTx = transactions.filter((tx) => {
    const matchesFilter = filter === "todos" || tx.category === filter;
    const q = query.toLowerCase();
    const matchesQuery = tx.name.toLowerCase().includes(q) || (tx.note || "").toLowerCase().includes(q);
    return matchesFilter && matchesQuery;
  });

  const groups = {};
  filteredTx.forEach((tx) => {
    const label = formatDateLabel(tx.date);
    groups[label] = groups[label] || [];
    groups[label].push(tx);
  });

  return (
    <div className="px-5 pt-6">
      <h1 className="text-xl font-semibold text-slate-900 mb-4">Historial</h1>
      <div className="relative mb-4">
        <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar movimientos"
          className="w-full h-11 rounded-xl bg-slate-50 border border-slate-200 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 transition"
        />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 mb-5">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 px-3.5 h-8 rounded-full text-xs font-medium transition ${filter === f.key ? "bg-violet-600 text-white" : "bg-slate-50 text-slate-600 border border-slate-200"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {Object.keys(groups).length === 0 ? (
        <EmptyState icon={Search} title="No se encontraron movimientos." subtitle="Prueba a cambiar los filtros o el término de búsqueda." />
      ) : (
        Object.entries(groups).map(([label, txs]) => (
          <div key={label} className="mb-5">
            <p className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wide">{label}</p>
            <div className="divide-y divide-slate-100">
              {txs.map((tx) => (
                <TransactionRow key={tx.id} tx={tx} onClick={() => openOverlay("txDetail", tx.id)} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function ProfileScreen({ user, wallet, openOverlay }) {
  const items = [
    { icon: ShieldCheck, label: "Seguridad", desc: "PIN, biometría y bloqueo automático", action: () => openOverlay("security") },
    { icon: Landmark, label: "Cuentas bancarias", desc: "Gestiona tus cuentas vinculadas", action: () => openOverlay("bankAccounts") },
    { icon: Wallet, label: "Métodos de pago", desc: "Saldo por moneda, tarjetas y cuentas", action: () => openOverlay("paymentMethods") },
    { icon: ArrowLeftRight, label: "Conversor de moneda", desc: "Consulta el cambio entre USD, EUR y CUP", action: () => openOverlay("converter") },
  ];
  return (
    <div className="px-5 pt-6">
      <h1 className="text-xl font-semibold text-slate-900 mb-5">Perfil</h1>

      <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-2xl p-4 mb-3 shadow-sm">
        <Avatar name={user.name} size="lg" />
        <div className="min-w-0">
          <p className="font-semibold text-slate-900">{user.name}</p>
          <p className="text-xs text-slate-400">{user.username} · {user.omegaId}</p>
          <div className="flex items-center gap-1 mt-1.5">
            <BadgeCheck className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-2xs text-slate-500 font-medium">Verificado desde {user.verifiedSince}</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-5 shadow-sm">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Límites en {wallet.primaryCurrency}</p>
        <LimitBar label="Envío diario" used={185} total={2000} currency={wallet.primaryCurrency} />
        <LimitBar label="Envío mensual" used={1340} total={10000} currency={wallet.primaryCurrency} className="mt-3" />
        <p className="text-2xs text-slate-400 mt-3">Los límites se aplican de forma independiente para cada moneda.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 shadow-sm overflow-hidden">
        {items.map((it) => (
          <button key={it.label} onClick={it.action} className="w-full flex items-center gap-3 p-4 active:bg-slate-50 transition text-left">
            <div className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center">
              <it.icon className="h-4 w-4 text-slate-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900">{it.label}</p>
              <p className="text-xs text-slate-400">{it.desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300" />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ Conversor de moneda ------------------------------ */

function ConverterScreen({ rates, setRates, onClose }) {
  const [amount, setAmount] = useState("1000");
  const [from, setFrom] = useState("CUP");
  const [editingRates, setEditingRates] = useState(false);
  const numAmount = parseFloat(amount || "0");

  return (
    <div className="flex flex-col h-full">
      <ScreenHeader title="Conversor de moneda" onBack={onClose} />
      <div className="flex-1 overflow-y-auto px-5 pt-2 pb-8">
        <div className="bg-slate-50 rounded-2xl p-4 mb-3">
          <p className="text-xs text-slate-500 mb-2">Tengo</p>
          <div className="flex items-center gap-3">
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              inputMode="decimal"
              className="flex-1 min-w-0 bg-transparent text-3xl font-mono font-semibold text-slate-900 focus:outline-none"
            />
            <div style={{ width: 132 }}>
              <CurrencySegment value={from} onChange={setFrom} />
            </div>
          </div>
        </div>

        <div className="space-y-2 mt-4">
          {CURRENCY_LIST.filter((c) => c !== from).map((c) => (
            <div key={c} className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div>
                <p className="text-xs font-semibold text-slate-500">{c}</p>
                <p className="text-2xs text-slate-400">{CURRENCIES[c].name}</p>
              </div>
              <p className="font-mono text-lg font-semibold text-slate-900">{formatMoney(convertAmount(numAmount, from, c, rates), c)}</p>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-2 mt-6 px-1">
          <Info className="h-3.5 w-3.5 text-slate-300 shrink-0 mt-0.5" />
          <p className="text-2xs text-slate-400">
            Tasa oficial del día, establecida por RETADOR{rates.updatedAt ? ` · actualizada ${relativeTime(rates.updatedAt)}` : ""}. Se aplica igual en toda la plataforma.
          </p>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- Enviar dinero -------------------------------- */

function SendMoneyOverlay({ contacts, wallet, storedPin, onClose, onSent, onGoToAddFunds, onGoToConverter }) {
  const [step, setStep] = useState("recipient");
  const [mode, setMode] = useState("contacts");
  const [query, setQuery] = useState("");
  const [phone, setPhone] = useState("");
  const [recipient, setRecipient] = useState(null);
  const [currency, setCurrency] = useState(wallet.primaryCurrency);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [pinError, setPinError] = useState("");
  const [processing, setProcessing] = useState(false);

  const filtered = contacts.filter(
    (c) => c.name.toLowerCase().includes(query.toLowerCase()) || c.username.toLowerCase().includes(query.toLowerCase())
  );
  const numAmount = parseFloat(amount || "0");
  const available = wallet.balances[currency];
  const insufficientFunds = numAmount > available;

  const pickRecipient = (c) => { setRecipient(c); setStep("amount"); };
  const simulateScan = () => { pickRecipient(contacts[Math.floor(Math.random() * contacts.length)]); };

  const changeCurrency = (c) => { setCurrency(c); setAmount(""); };

  const keypadPress = (key) => {
    if (key === "del") { setAmount((a) => a.slice(0, -1)); return; }
    if (key === "." && amount.includes(".")) return;
    if (amount.includes(".") && amount.split(".")[1]?.length >= 2) return;
    setAmount((a) => (a === "0" ? key : a + key));
  };

  const handlePin = (pin) => {
    if (pin !== storedPin) { setPinError("PIN incorrecto. Inténtalo de nuevo."); return; }
    setPinError("");
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      onSent({
        id: "t" + Date.now(),
        type: "send",
        category: "gasto",
        name: recipient.name,
        amount: -numAmount,
        currency,
        date: new Date(),
        status: "completado",
        note,
      });
      setStep("success");
    }, 1100);
  };

  if (step === "success") {
    return <SuccessScreen title="¡Envío completado!" subtitle={`Has enviado ${formatMoney(numAmount, currency)} a ${recipient.name}`} onDone={onClose} />;
  }

  return (
    <div className="flex flex-col h-full">
      {step === "recipient" && (
        <>
          <ScreenHeader title="Enviar dinero" onBack={onClose} />
          <div className="px-5 shrink-0">
            <div className="flex gap-2 mb-4">
              {[
                { key: "contacts", label: "Contactos", icon: Users },
                { key: "phone", label: "Teléfono", icon: Phone },
                { key: "qr", label: "QR", icon: QrCode },
              ].map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMode(m.key)}
                  className={`flex-1 h-9 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition ${mode === m.key ? "bg-violet-600 text-white" : "bg-slate-50 text-slate-600 border border-slate-200"}`}
                >
                  <m.icon className="h-3.5 w-3.5" /> {m.label}
                </button>
              ))}
            </div>
          </div>

          {mode === "contacts" && (
            <div className="flex-1 overflow-y-auto px-5">
              <div className="relative mb-3">
                <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por nombre o @usuario"
                  className="w-full h-11 rounded-xl bg-slate-50 border border-slate-200 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 transition"
                />
              </div>
              <div className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <button key={c.id} onClick={() => pickRecipient(c)} className="w-full flex items-center gap-3 py-3 active:bg-slate-50 rounded-xl px-2 -mx-2 transition text-left">
                    <Avatar name={c.name} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900">{c.name}</p>
                      <p className="text-xs text-slate-400">{c.username}</p>
                    </div>
                  </button>
                ))}
                {filtered.length === 0 && <p className="text-xs text-slate-400 text-center py-10">No se encontraron contactos.</p>}
              </div>
            </div>
          )}

          {mode === "phone" && (
            <div className="flex-1 px-5">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+34 600 000 000"
                inputMode="tel"
                className="w-full h-12 rounded-xl bg-slate-50 border border-slate-200 px-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-200 transition mb-4"
              />
              <button
                disabled={phone.length < 9}
                onClick={() => pickRecipient({ name: "Contacto nuevo", username: phone })}
                className="w-full h-12 rounded-2xl bg-violet-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-sm active:scale-[0.98] transition"
              >
                Buscar
              </button>
            </div>
          )}

          {mode === "qr" && (
            <div className="flex-1 flex flex-col items-center justify-center px-8">
              <div className="h-56 w-56 rounded-3xl border-2 border-dashed border-slate-200 flex items-center justify-center mb-6">
                <QrCode className="h-10 w-10 text-slate-300" strokeWidth={1.25} />
              </div>
              <p className="text-xs text-slate-400 mb-6 text-center">Apunta la cámara al código QR de la persona que va a recibir el dinero.</p>
              <button onClick={simulateScan} className="h-11 px-6 rounded-2xl bg-slate-900 text-white font-medium text-sm active:scale-[0.98] transition flex items-center gap-2">
                <Camera className="h-4 w-4" /> Simular escaneo
              </button>
            </div>
          )}
        </>
      )}

      {step === "amount" && recipient && (
        <div className="flex flex-col h-full px-5 pb-6">
          <ScreenHeader title="Importe" onBack={() => setStep("recipient")} />
          <div className="flex items-center gap-2 px-1 mb-4 shrink-0">
            <Avatar name={recipient.name} size="sm" />
            <span className="text-sm text-slate-600">Para <span className="font-medium text-slate-900">{recipient.name}</span></span>
          </div>
          <div className="shrink-0 mb-2">
            <CurrencySegment value={currency} onChange={changeCurrency} />
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <p className={`font-mono text-5xl font-semibold tabular-nums ${insufficientFunds ? "text-rose-500" : "text-slate-900"}`}>
              {amount || "0"}<span className="text-2xl text-slate-400"> {CURRENCIES[currency].symbol}</span>
            </p>
            <p className="text-xs text-slate-400 mt-3">Saldo disponible en {currency}: {formatMoney(available, currency)}</p>
          </div>
          {insufficientFunds && amount ? (
            <div className="mb-4">
              <InsufficientFunds currency={currency} available={available} onAddFunds={onGoToAddFunds} onOpenConverter={onGoToConverter} />
            </div>
          ) : null}
          <NumericKeypad onPress={keypadPress} />
          <button
            disabled={!amount || numAmount <= 0 || insufficientFunds}
            onClick={() => setStep("note")}
            className="w-full h-12 rounded-2xl bg-violet-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-sm active:scale-[0.98] transition shrink-0"
          >
            Continuar
          </button>
        </div>
      )}

      {step === "note" && recipient && (
        <div className="flex flex-col h-full px-5 pb-6">
          <ScreenHeader title="Añadir nota" onBack={() => setStep("amount")} />
          <div className="flex items-center gap-3 bg-slate-50 rounded-2xl p-4 mb-6 shrink-0">
            <Avatar name={recipient.name} />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">{recipient.name}</p>
              <p className="text-xs text-slate-400">{recipient.username}</p>
            </div>
            <p className="font-mono font-semibold text-sm text-slate-900">{formatMoney(numAmount, currency)}</p>
          </div>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Para qué es este envío (opcional)"
            maxLength={60}
            className="w-full h-12 rounded-xl bg-slate-50 border border-slate-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 transition"
          />
          <div className="flex-1" />
          <button onClick={() => setStep("confirm")} className="w-full h-12 rounded-2xl bg-violet-600 text-white font-semibold text-sm active:scale-[0.98] transition shrink-0">
            Continuar
          </button>
        </div>
      )}

      {step === "confirm" && recipient && (
        <div className="flex flex-col h-full px-5 pb-6">
          <ScreenHeader title="Confirmar envío" onBack={() => setStep("note")} />
          <div className="bg-slate-50 rounded-2xl p-4 mb-6 shrink-0">
            <Row label="Destinatario" value={recipient.name} />
            <Row label="Importe" value={formatMoney(numAmount, currency)} />
            <Row label="Nota" value={note || "—"} />
            <Row label="Comisión" value="Sin comisión" />
            <div className="h-px bg-slate-200 my-2.5" />
            <Row label="Total" value={formatMoney(numAmount, currency)} bold />
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            {processing ? (
              <div className="flex flex-col items-center">
                <Loader2 className="h-7 w-7 text-violet-600 animate-spin mb-3" />
                <p className="text-sm text-slate-500">Procesando envío…</p>
              </div>
            ) : (
              <>
                <p className="text-sm font-medium text-slate-700 mb-5">Introduce tu PIN para confirmar</p>
                <PinPad onComplete={handlePin} error={pinError} />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------- Recibir dinero --------------------------------- */

function ReceiveMoneyScreen({ user, wallet, onClose }) {
  const [requestAmount, setRequestAmount] = useState("");
  const [requestCurrency, setRequestCurrency] = useState(wallet.primaryCurrency);
  const [copied, setCopied] = useState(false);

  const qrPayload = `omega-pay://pay?to=${user.omegaId}${requestAmount ? `&amount=${requestAmount}&currency=${requestCurrency}` : ""}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${encodeURIComponent(qrPayload)}`;

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(user.omegaId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) { /* clipboard no disponible */ }
  };

  const share = () => {
    try {
      if (navigator.share) {
        const amountText = requestAmount ? ` (${formatMoney(parseFloat(requestAmount), requestCurrency)})` : "";
        navigator.share({ title: "Omega Pay", text: `Envíame dinero a ${user.username} en Omega Pay${amountText}` });
      }
    } catch (e) { /* compartir no disponible */ }
  };

  return (
    <div className="flex flex-col h-full">
      <ScreenHeader title="Recibir dinero" onBack={onClose} />
      <div className="flex-1 overflow-y-auto px-5 flex flex-col items-center pt-2">
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
          <img src={qrUrl} alt="Código QR para recibir pagos" className="h-48 w-48 rounded-xl" />
        </div>
        <p className="font-semibold text-slate-900 mt-5">{user.username}</p>
        <p className="text-xs text-slate-400 font-mono mt-0.5">{user.omegaId}</p>

        <button onClick={copyId} className="flex items-center gap-1.5 text-xs font-medium text-violet-600 mt-3">
          <Copy className="h-3.5 w-3.5" /> {copied ? "Copiado" : "Copiar ID"}
        </button>

        <div className="w-full mt-7 bg-slate-50 rounded-2xl p-4">
          <p className="text-xs font-medium text-slate-500 mb-2">Solicitar una cantidad (opcional)</p>
          <div className="flex items-center gap-2 mb-3">
            <input
              inputMode="decimal"
              value={requestAmount}
              onChange={(e) => setRequestAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="0.00"
              className="flex-1 min-w-0 h-11 rounded-xl bg-white border border-slate-200 px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-200"
            />
            <div style={{ width: 132 }}>
              <CurrencySegment value={requestCurrency} onChange={setRequestCurrency} />
            </div>
          </div>
          {requestAmount && (
            <p className="text-xs text-slate-400">Quien escanee este código verá una solicitud de {formatMoney(parseFloat(requestAmount), requestCurrency)}.</p>
          )}
        </div>
      </div>
      <div className="p-5 shrink-0">
        <button onClick={share} className="w-full h-12 rounded-2xl bg-slate-900 text-white font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition">
          <Share2 className="h-4 w-4" /> Compartir
        </button>
      </div>
    </div>
  );
}

/* -------------------------- Pagar en el marketplace ------------------------------ */

function PayOverlay({ orders, wallet, storedPin, onClose, onPaid, onGoToAddFunds, onGoToConverter }) {
  const [step, setStep] = useState("list");
  const [selected, setSelected] = useState(null);
  const [pinError, setPinError] = useState("");
  const [processing, setProcessing] = useState(false);

  const select = (o) => { setSelected(o); setStep("confirm"); };
  const insufficientFunds = selected ? selected.amount > wallet.balances[selected.currency] : false;

  const handlePin = (pin) => {
    if (pin !== storedPin) { setPinError("PIN incorrecto. Inténtalo de nuevo."); return; }
    setPinError("");
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      onPaid(
        {
          id: "t" + Date.now(),
          type: "payment",
          category: "marketplace",
          name: selected.vendor,
          amount: -selected.amount,
          currency: selected.currency,
          date: new Date(),
          status: "completado",
          note: `Pedido #${selected.id}`,
        },
        selected.id
      );
      setStep("success");
    }, 1100);
  };

  if (step === "success") {
    return <SuccessScreen title="¡Pago realizado!" subtitle={`Has pagado ${formatMoney(selected.amount, selected.currency)} a ${selected.vendor}`} onDone={onClose} />;
  }

  return (
    <div className="flex flex-col h-full">
      <ScreenHeader title="Pagar en el marketplace" onBack={step === "confirm" ? () => setStep("list") : onClose} />

      {step === "list" && (
        <div className="flex-1 overflow-y-auto px-5">
          {orders.length === 0 ? (
            <EmptyState icon={ShoppingBag} title="No tienes pedidos pendientes." subtitle="Cuando tengas un pedido por pagar en el marketplace, aparecerá aquí." />
          ) : (
            <div className="space-y-3 pt-2">
              {orders.map((o) => (
                <button key={o.id} onClick={() => select(o)} className="w-full bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 active:bg-slate-50 transition text-left shadow-sm">
                  <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                    <ShoppingBag className="h-4 w-4 text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{o.vendor}</p>
                    <p className="text-xs text-slate-400 truncate">{o.item} · #{o.id}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono font-semibold text-sm text-slate-900">{formatMoney(o.amount, o.currency)}</p>
                    <div className="flex justify-end mt-0.5"><CurrencyTag currency={o.currency} /></div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {step === "confirm" && selected && (
        <div className="flex-1 overflow-y-auto px-5 flex flex-col items-center pt-4 pb-6">
          <div className="w-full bg-slate-50 rounded-2xl p-4 mb-6">
            <Row label="Comercio" value={selected.vendor} />
            <Row label="Artículo" value={selected.item} />
            <Row label="Pedido" value={`#${selected.id}`} />
            <Row label="Comisión" value="Sin comisión" />
            <div className="h-px bg-slate-200 my-2.5" />
            <Row label="Total a pagar" value={formatMoney(selected.amount, selected.currency)} bold />
          </div>

          {insufficientFunds ? (
            <InsufficientFunds
              currency={selected.currency}
              available={wallet.balances[selected.currency]}
              onAddFunds={onGoToAddFunds}
              onOpenConverter={onGoToConverter}
            />
          ) : processing ? (
            <div className="flex flex-col items-center pt-6">
              <Loader2 className="h-7 w-7 text-violet-600 animate-spin mb-3" />
              <p className="text-sm text-slate-500">Verificando pago…</p>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium text-slate-700 mb-5">Introduce tu PIN para confirmar</p>
              <PinPad onComplete={handlePin} error={pinError} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------- Añadir fondos ----------------------------------- */

function AddFundsOverlay({ bankAccounts, wallet, onClose, onAdded, onGoToBankAccounts }) {
  const [step, setStep] = useState(bankAccounts.length ? "method" : "noAccounts");
  const [account, setAccount] = useState(bankAccounts[0] || null);
  const [amount, setAmount] = useState("");
  const numAmount = parseFloat(amount || "0");

  const press = (k) => {
    if (k === "del") { setAmount((a) => a.slice(0, -1)); return; }
    if (k === "." && amount.includes(".")) return;
    setAmount((a) => (a === "0" ? k : a + k));
  };

  if (step === "success") {
    return <SuccessScreen title="¡Saldo añadido!" subtitle={`Se han añadido ${formatMoney(numAmount, account.currency)} a tu saldo en ${account.currency}`} onDone={onClose} />;
  }

  return (
    <div className="flex flex-col h-full">
      <ScreenHeader title="Añadir fondos" onBack={step === "amount" ? () => setStep("method") : onClose} />

      {step === "noAccounts" && (
        <div className="flex-1 flex flex-col">
          <EmptyState icon={Landmark} title="No tienes cuentas vinculadas." subtitle="Vincula una cuenta bancaria para poder añadir fondos a tu saldo." />
          <div className="p-5 mt-auto shrink-0">
            <button onClick={onGoToBankAccounts} className="w-full h-12 rounded-2xl bg-slate-900 text-white font-semibold text-sm active:scale-[0.98] transition">
              Vincular cuenta bancaria
            </button>
          </div>
        </div>
      )}

      {step === "method" && (
        <div className="flex-1 overflow-y-auto px-5 pt-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Origen de los fondos</p>
          <div className="space-y-2">
            {bankAccounts.map((b) => (
              <button
                key={b.id}
                onClick={() => setAccount(b)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border transition text-left ${account?.id === b.id ? "border-violet-400 bg-violet-50" : "border-slate-200 bg-white"}`}
              >
                <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-slate-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{b.bank} •••• {b.last4}</p>
                  <p className="text-xs text-slate-400">{b.alias}</p>
                </div>
                <CurrencyTag currency={b.currency} />
                {account?.id === b.id && <Check className="h-4 w-4 text-violet-600" />}
              </button>
            ))}
          </div>
          <p className="text-2xs text-slate-400 mt-3">El importe que añadas se sumará al saldo en {account ? account.currency : "la moneda"} de la cuenta elegida — no se convierte a ninguna otra moneda.</p>
          <button
            onClick={() => setStep("amount")}
            disabled={!account}
            className="w-full h-12 rounded-2xl bg-violet-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-sm mt-6 active:scale-[0.98] transition"
          >
            Continuar
          </button>
        </div>
      )}

      {step === "amount" && account && (
        <div className="flex flex-col flex-1 px-5 pb-6">
          <div className="flex-1 flex flex-col items-center justify-center">
            <p className="font-mono text-5xl font-semibold text-slate-900 tabular-nums">
              {amount || "0"}<span className="text-2xl text-slate-400"> {CURRENCIES[account.currency].symbol}</span>
            </p>
            <p className="text-xs text-slate-400 mt-3">Desde {account.bank} •••• {account.last4} · se abonará en {account.currency}</p>
          </div>
          <NumericKeypad onPress={press} />
          <button
            disabled={!amount || numAmount <= 0}
            onClick={() => {
              onAdded({
                id: "t" + Date.now(),
                type: "topup",
                category: "recarga",
                name: `${account.bank} •••• ${account.last4}`,
                amount: numAmount,
                currency: account.currency,
                date: new Date(),
                status: "completado",
                note: "Recarga de saldo",
              });
              setStep("success");
            }}
            className="w-full h-12 rounded-2xl bg-violet-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-sm active:scale-[0.98] transition shrink-0"
          >
            {amount ? `Añadir ${formatMoney(numAmount, account.currency)}` : "Añadir"}
          </button>
        </div>
      )}
    </div>
  );
}

/* --------------------------------- Retirar saldo ---------------------------------- */

function WithdrawOverlay({ bankAccounts, wallet, onClose, onWithdrawn }) {
  const [account, setAccount] = useState(bankAccounts[0] || null);
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState(bankAccounts.length ? "amount" : "noAccounts");
  const numAmount = parseFloat(amount || "0");
  const available = account ? wallet.balances[account.currency] : 0;
  const insufficientFunds = numAmount > available;

  const press = (k) => {
    if (k === "del") { setAmount((a) => a.slice(0, -1)); return; }
    if (k === "." && amount.includes(".")) return;
    setAmount((a) => (a === "0" ? k : a + k));
  };

  if (step === "success") {
    return (
      <SuccessScreen
        title="¡Retiro en proceso!"
        subtitle={`${formatMoney(numAmount, account.currency)} llegarán a ${account.bank} •••• ${account.last4} en 1-2 días hábiles.`}
        onDone={onClose}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ScreenHeader title="Retirar saldo" onBack={onClose} />

      {step === "noAccounts" && (
        <EmptyState icon={Landmark} title="No tienes cuentas vinculadas." subtitle="Vincula una cuenta bancaria para poder retirar tu saldo." />
      )}

      {step === "amount" && account && (
        <div className="flex flex-col flex-1 px-5 pb-6">
          {bankAccounts.length > 1 && (
            <div className="px-1 pb-4 shrink-0">
              <p className="text-xs text-slate-400 mb-2">Retirar a</p>
              <div className="flex gap-2 overflow-x-auto">
                {bankAccounts.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => { setAccount(b); setAmount(""); }}
                    className={`shrink-0 px-3 h-9 rounded-xl text-xs font-medium border transition ${account.id === b.id ? "bg-violet-600 text-white border-violet-600" : "bg-white text-slate-600 border-slate-200"}`}
                  >
                    {b.bank} · {b.currency}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex-1 flex flex-col items-center justify-center">
            <p className={`font-mono text-5xl font-semibold tabular-nums ${insufficientFunds ? "text-rose-500" : "text-slate-900"}`}>
              {amount || "0"}<span className="text-2xl text-slate-400"> {CURRENCIES[account.currency].symbol}</span>
            </p>
            <p className="text-xs text-slate-400 mt-3">Saldo disponible en {account.currency}: {formatMoney(available, account.currency)}</p>
            <p className="text-xs text-slate-400 mt-1">A {account.bank} •••• {account.last4}</p>
            {insufficientFunds && amount && <p className="text-xs text-rose-500 mt-1 font-medium">Saldo insuficiente</p>}
          </div>
          <NumericKeypad onPress={press} />
          <button
            disabled={!amount || numAmount <= 0 || insufficientFunds}
            onClick={() => {
              onWithdrawn({
                id: "t" + Date.now(),
                type: "withdrawal",
                category: "retiro",
                name: `${account.bank} •••• ${account.last4}`,
                amount: -numAmount,
                currency: account.currency,
                date: new Date(),
                status: "pendiente",
                note: "Retiro de saldo",
              });
              setStep("success");
            }}
            className="w-full h-12 rounded-2xl bg-violet-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-sm active:scale-[0.98] transition shrink-0"
          >
            {amount ? `Retirar ${formatMoney(numAmount, account.currency)}` : "Retirar"}
          </button>
        </div>
      )}
    </div>
  );
}

/* -------------------------------- Pantalla de seguridad --------------------------- */

function ChangePinSheet({ onClose, onSave }) {
  const [stage, setStage] = useState("new");
  const [firstPin, setFirstPin] = useState("");
  const [error, setError] = useState("");

  const handleNew = (pin) => { setFirstPin(pin); setStage("confirm"); };
  const handleConfirm = (pin) => {
    if (pin !== firstPin) { setError("Los PIN no coinciden"); setStage("new"); setFirstPin(""); return; }
    onSave(pin);
  };

  return (
    <div className="absolute inset-0 z-40 bg-white flex flex-col items-center overflow-y-auto px-8 pt-20 pb-12">
      <button onClick={onClose} className="absolute top-5 right-5 h-9 w-9 rounded-full flex items-center justify-center active:bg-slate-100">
        <ArrowLeft className="h-4 w-4 text-slate-500" />
      </button>
      <p className="font-semibold text-slate-900 mb-1">{stage === "new" ? "Crea un nuevo PIN" : "Confirma tu nuevo PIN"}</p>
      <p className="text-xs text-slate-400 mb-8 text-center">
        {stage === "new" ? "Elige 4 dígitos para autorizar tus pagos." : "Vuelve a introducirlo para confirmarlo."}
      </p>
      <PinPad key={stage} onComplete={stage === "new" ? handleNew : handleConfirm} error={error} />
    </div>
  );
}

function SecurityScreen({ security, setSecurity, onClose, onLock }) {
  const [changingPin, setChangingPin] = useState(false);
  const [confirmBiometric, setConfirmBiometric] = useState(false);

  const autoLockOptions = [
    { label: "30 seg", value: 0.5 },
    { label: "1 min", value: 1 },
    { label: "5 min", value: 5 },
    { label: "Nunca", value: null },
  ];

  return (
    <div className="flex flex-col h-full">
      <ScreenHeader title="Seguridad" onBack={onClose} />
      <div className="flex-1 overflow-y-auto px-5 pt-2 pb-8">
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3 mb-6">
          <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-emerald-900">Identidad verificada</p>
            <p className="text-xs text-emerald-700 mt-0.5">Verificación completada el 12 de marzo de 2026</p>
          </div>
        </div>

        <SettingRow
          icon={KeyRound}
          title="PIN de pagos"
          desc="Se solicita al confirmar envíos y pagos"
          right={<button onClick={() => setChangingPin(true)} className="text-xs font-semibold text-violet-600">Cambiar</button>}
        />
        <SettingRow
          icon={Fingerprint}
          title="Biometría"
          desc="Usa tu huella o Face ID para confirmar"
          right={<Toggle checked={security.biometric} onChange={(v) => (v ? setSecurity((s) => ({ ...s, biometric: true })) : setConfirmBiometric(true))} />}
        />

        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mt-6 mb-2">Bloqueo automático</p>
        <div className="flex gap-2 flex-wrap mb-2">
          {autoLockOptions.map((opt) => (
            <button
              key={opt.label}
              onClick={() => setSecurity((s) => ({ ...s, autoLockMinutes: opt.value }))}
              className={`px-3.5 h-8 rounded-full text-xs font-medium transition ${security.autoLockMinutes === opt.value ? "bg-violet-600 text-white" : "bg-slate-50 text-slate-600 border border-slate-200"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-400 mb-6">La app se bloqueará automáticamente tras este tiempo de inactividad.</p>

        <button onClick={onLock} className="w-full h-11 rounded-2xl border border-slate-200 text-slate-700 font-medium text-sm active:bg-slate-50 transition">
          Bloquear ahora
        </button>
      </div>

      {changingPin && (
        <ChangePinSheet
          onClose={() => setChangingPin(false)}
          onSave={(newPin) => { setSecurity((s) => ({ ...s, pin: newPin })); setChangingPin(false); }}
        />
      )}
      {confirmBiometric && (
        <ConfirmSheet
          title="¿Desactivar biometría?"
          subtitle="Tendrás que usar tu PIN para confirmar cada operación."
          confirmLabel="Desactivar"
          onConfirm={() => { setSecurity((s) => ({ ...s, biometric: false })); setConfirmBiometric(false); }}
          onCancel={() => setConfirmBiometric(false)}
        />
      )}
    </div>
  );
}

/* -------------------------------- Cuentas bancarias -------------------------------- */

function LinkBankSheet({ onClose, onLinked }) {
  const [stage, setStage] = useState("pick");
  const [bank, setBank] = useState(null);
  const [currency, setCurrency] = useState("USD");

  const confirmCurrency = () => {
    setStage("connecting");
    setTimeout(() => {
      onLinked({ id: "b" + Date.now(), bank, alias: "Cuenta vinculada", last4: String(Math.floor(1000 + Math.random() * 9000)), currency, isDefault: false });
    }, 1600);
  };

  return (
    <div className="absolute inset-0 z-40 bg-white flex flex-col">
      <ScreenHeader title="Vincular cuenta" onBack={stage === "currency" ? () => setStage("pick") : onClose} />
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {stage === "pick" && (
          <div className="w-full">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 text-center">Elige tu banco</p>
            <div className="grid grid-cols-2 gap-2.5">
              {AVAILABLE_BANKS.map((b) => (
                <button key={b} onClick={() => { setBank(b); setStage("currency"); }} className="h-14 rounded-2xl border border-slate-200 bg-white font-medium text-sm text-slate-700 active:bg-slate-50 transition">
                  {b}
                </button>
              ))}
            </div>
          </div>
        )}
        {stage === "currency" && (
          <div className="w-full">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 text-center">¿En qué moneda está esta cuenta?</p>
            <p className="text-xs text-slate-400 text-center mb-5">{bank}</p>
            <div className="grid grid-cols-3 gap-2.5 mb-8">
              {CURRENCY_LIST.map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`h-14 rounded-2xl border font-semibold text-sm transition ${currency === c ? "bg-violet-600 text-white border-violet-600" : "bg-white text-slate-700 border-slate-200"}`}
                >
                  {c}
                </button>
              ))}
            </div>
            <button onClick={confirmCurrency} className="w-full h-12 rounded-2xl bg-slate-900 text-white font-semibold text-sm active:scale-[0.98] transition">
              Vincular en {currency}
            </button>
          </div>
        )}
        {stage === "connecting" && (
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 text-violet-600 animate-spin mb-4" />
            <p className="text-sm font-medium text-slate-700">Conectando con {bank} de forma segura…</p>
            <p className="text-xs text-slate-400 mt-1">Esto puede tardar unos segundos</p>
          </div>
        )}
      </div>
    </div>
  );
}

function BankAccountsScreen({ bankAccounts, setBankAccounts, onClose }) {
  const [linking, setLinking] = useState(false);
  const [toRemove, setToRemove] = useState(null);

  const removeAccount = () => {
    setBankAccounts((accs) => accs.filter((a) => a.id !== toRemove.id));
    setToRemove(null);
  };

  return (
    <div className="flex flex-col h-full">
      <ScreenHeader title="Cuentas bancarias" onBack={onClose} />
      <div className="flex-1 overflow-y-auto px-5 pt-2 pb-6">
        {bankAccounts.length === 0 ? (
          <EmptyState icon={Landmark} title="Aún no tienes cuentas vinculadas." subtitle="Vincula una cuenta para añadir fondos y retirar tu saldo." />
        ) : (
          <div className="space-y-2 mb-6">
            {bankAccounts.map((b) => (
              <div key={b.id} className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-slate-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{b.bank} •••• {b.last4}</p>
                  <p className="text-xs text-slate-400">{b.alias}{b.isDefault ? " · Predeterminada" : ""}</p>
                </div>
                <CurrencyTag currency={b.currency} />
                <button onClick={() => setToRemove(b)} className="h-8 w-8 rounded-full flex items-center justify-center text-slate-300 active:text-rose-500 active:bg-rose-50 transition">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        <button onClick={() => setLinking(true)} className="w-full h-12 rounded-2xl border border-dashed border-slate-300 text-slate-600 font-medium text-sm flex items-center justify-center gap-2 active:bg-slate-50 transition">
          <Plus className="h-4 w-4" /> Vincular cuenta bancaria
        </button>
        <p className="text-xs text-slate-400 mt-4 leading-relaxed">
          Tus credenciales bancarias nunca se almacenan en Omega Pay. La conexión se realiza mediante un proveedor certificado de agregación bancaria. Cada cuenta opera en su propia moneda.
        </p>
      </div>

      {linking && <LinkBankSheet onClose={() => setLinking(false)} onLinked={(acc) => { setBankAccounts((a) => [...a, acc]); setLinking(false); }} />}
      {toRemove && (
        <ConfirmSheet
          title={`¿Eliminar ${toRemove.bank} •••• ${toRemove.last4}?`}
          subtitle="Dejarás de poder usar esta cuenta para añadir fondos o retirar saldo."
          confirmLabel="Eliminar"
          danger
          onConfirm={removeAccount}
          onCancel={() => setToRemove(null)}
        />
      )}
    </div>
  );
}

/* -------------------------------- Métodos de pago ---------------------------------- */

function PaymentMethodsScreen({ wallet, bankAccounts, onClose, onGoToBankAccounts, onWithdraw, onOpenConverter }) {
  return (
    <div className="flex flex-col h-full">
      <ScreenHeader title="Métodos de pago" onBack={onClose} />
      <div className="flex-1 overflow-y-auto px-5 pt-2 pb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Saldo por moneda</p>
          <button onClick={onOpenConverter} className="text-xs font-medium text-violet-600 flex items-center gap-1">
            <ArrowLeftRight className="h-3 w-3" /> Conversor
          </button>
        </div>
        <div className="space-y-2 mb-6">
          {CURRENCY_LIST.map((c) => (
            <div key={c} className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="h-9 w-9 rounded-xl bg-violet-50 flex items-center justify-center">
                <Wallet className="h-4 w-4 text-violet-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">Saldo en {c}</p>
                <p className="text-xs text-slate-400">{CURRENCIES[c].name}{c === wallet.primaryCurrency ? " · Predeterminada" : ""}</p>
              </div>
              <p className="font-mono text-sm font-semibold text-slate-900">{formatMoney(wallet.balances[c], c)}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Cuentas bancarias</p>
          <button onClick={onGoToBankAccounts} className="text-xs font-medium text-violet-600">Gestionar</button>
        </div>
        <div className="space-y-2 mb-6">
          {bankAccounts.length === 0 ? (
            <p className="text-xs text-slate-400 px-1">No tienes cuentas vinculadas todavía.</p>
          ) : (
            bankAccounts.map((b) => (
              <div key={b.id} className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-slate-600" />
                </div>
                <p className="text-sm font-medium text-slate-900 flex-1">{b.bank} •••• {b.last4}</p>
                <CurrencyTag currency={b.currency} />
              </div>
            ))
          )}
        </div>

        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Tarjetas</p>
        <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 mb-6">
          <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center">
            <CreditCard className="h-4 w-4 text-slate-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-500">Añadir tarjeta</p>
            <p className="text-xs text-slate-400">Próximamente</p>
          </div>
        </div>

        <button onClick={onWithdraw} className="w-full h-11 rounded-2xl border border-slate-200 text-slate-700 font-medium text-sm active:bg-slate-50 transition">
          Retirar saldo
        </button>
      </div>
    </div>
  );
}

/* ------------------------------- Detalle de movimiento ----------------------------- */

function TransactionDetailSheet({ tx, onClose }) {
  const [copied, setCopied] = useState(false);
  if (!tx) {
    return (
      <div className="flex flex-col h-full">
        <ScreenHeader title="Detalle" onBack={onClose} />
      </div>
    );
  }
  const positive = tx.amount > 0;

  const copyReceipt = async () => {
    const text = `RETADOR · ${tx.name} · ${formatMoney(tx.amount, tx.currency, { sign: true })} · ${tx.id}`;
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch (e) {}
    if (!ok) {
      try {
        const ta = document.createElement("textarea");
        ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0"; ta.style.left = "-9999px";
        document.body.appendChild(ta); ta.focus(); ta.select();
        document.execCommand("copy"); document.body.removeChild(ta);
      } catch (e) {}
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col h-full">
      <ScreenHeader title="Detalle del movimiento" onBack={onClose} />
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-6 flex flex-col items-center">
        <Avatar name={tx.name} size="lg" />
        <p className="font-semibold text-slate-900 mt-4">{tx.name}</p>
        <p className={`font-mono text-3xl font-semibold mt-2 ${positive ? "text-emerald-600" : "text-slate-900"}`}>
          {formatMoney(tx.amount, tx.currency, { sign: true })}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <StatusChip status={tx.status} />
          <CurrencyTag currency={tx.currency} />
        </div>

        <div className="w-full bg-slate-50 rounded-2xl p-4 mt-7">
          <Row label="Fecha" value={(tx.date instanceof Date ? tx.date : new Date(tx.date)).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })} />
          <Row label="Hora" value={formatTime(tx.date)} />
          <Row label="Moneda" value={`${tx.currency} · ${CURRENCIES[tx.currency].name}`} />
          <Row label="Categoría" value={labelForCategory(tx.category)} />
          {tx.note && <Row label="Concepto" value={tx.note} />}
          <Row label="ID de transacción" value={tx.id} />
        </div>
      </div>
      <div className="p-5 shrink-0">
        <button onClick={copyReceipt} className="w-full h-12 rounded-2xl border border-slate-200 text-slate-700 font-medium text-sm flex items-center justify-center gap-2 active:bg-slate-50 transition">
          <Receipt className="h-4 w-4" /> {copied ? "Comprobante copiado" : "Copiar comprobante"}
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------- Bloqueo de app ---------------------------------- */

function AppLockScreen({ storedPin, onUnlock, userName, onExit }) {
  const [error, setError] = useState("");
  const handlePin = (pin) => {
    if (pin === storedPin) onUnlock();
    else setError("PIN incorrecto");
  };
  return (
    <div className="absolute inset-0 z-50 bg-white flex flex-col items-center overflow-y-auto px-8 pt-24 pb-12">
      {onExit && (
        <button onClick={onExit} className="absolute top-4 left-4 inline-flex items-center gap-1 text-sm font-medium text-violet-600" aria-label="Volver a RETADOR">
          <ArrowLeft size={16} /> RETADOR
        </button>
      )}
      <div className="h-14 w-14 rounded-2xl bg-slate-900 flex items-center justify-center mb-5">
        <Lock className="h-6 w-6 text-white" />
      </div>
      <p className="font-semibold text-slate-900 mb-1">Sesión bloqueada</p>
      <p className="text-xs text-slate-400 mb-8 text-center">Introduce tu PIN para continuar, {userName}</p>
      <PinPad onComplete={handlePin} error={error} />
    </div>
  );
}

/* ------------------------------------- App raíz -------------------------------------- */

function WalletRoot(props) {
  const realUser = props.user || SEED_USER;
  const realContacts = (props.contacts && props.contacts.length) ? props.contacts : SEED_CONTACTS;
  // Tasas: vienen del panel de administración (única fuente). El usuario no las edita aquí.
  const rates = props.rates || SEED_EXCHANGE_RATES;
  const setRates = () => {};
  const { wallet, toggleHidden, adjustBalance, setPrimaryCurrency } = useWallet(rates);
  const [transactions, setTransactions] = useState(() => { try { const r = localStorage.getItem("retador_wallet_tx"); if (r) return JSON.parse(r).map((t) => ({ ...t, date: new Date(t.date) })); } catch {} return SEED_TRANSACTIONS; });
  useEffect(() => { try { localStorage.setItem("retador_wallet_tx", JSON.stringify(transactions)); } catch {} }, [transactions]);
  const [orders, setOrders] = useState(props.orders || SEED_ORDERS);
  useEffect(() => { if (props.orders) setOrders(props.orders); }, [props.orders]);
  const [bankAccounts, setBankAccounts] = useState(() => { try { const r = localStorage.getItem("retador_wallet_banks"); if (r) return JSON.parse(r); } catch {} return SEED_BANK_ACCOUNTS; });
  useEffect(() => { try { localStorage.setItem("retador_wallet_banks", JSON.stringify(bankAccounts)); } catch {} }, [bankAccounts]);
  const [tab, setTab] = useState("home");
  const [overlay, setOverlay] = useState(null); // { type, id }
  const [security, setSecurity] = useState(() => { try { const r = localStorage.getItem("retador_wallet_sec"); if (r) return JSON.parse(r); } catch {} return { pin: "1234", biometric: false, autoLockMinutes: null }; });
  useEffect(() => { try { localStorage.setItem("retador_wallet_sec", JSON.stringify(security)); } catch {} }, [security]);

  const { locked, unlock, lock } = useInactivityLock(security.autoLockMinutes);

  const openOverlay = (type, id) => setOverlay({ type, id });
  const closeOverlay = () => setOverlay(null);
  const addTransaction = (tx) => setTransactions((t) => [tx, ...t]);

  const handleSent = (tx) => { addTransaction(tx); adjustBalance(tx.currency, tx.amount); };
  const handleAdded = (tx) => { addTransaction(tx); adjustBalance(tx.currency, tx.amount); };
  const handleWithdrawn = (tx) => { addTransaction(tx); adjustBalance(tx.currency, tx.amount); };
  const handlePaid = (tx, orderId) => {
    addTransaction(tx);
    adjustBalance(tx.currency, tx.amount);
    setOrders((o) => o.filter((x) => x.id !== orderId));
    props.onOrderPaid && props.onOrderPaid(orderId, tx); // avisa a la plataforma: orden pagada
  };

  const selectedTx = overlay?.type === "txDetail" ? transactions.find((t) => t.id === overlay.id) : null;

  return (
    <div className={"h-full bg-slate-100" + (props.dark ? " wallet-dark" : "")}>
      <style>{STYLE}</style>
      <div className="w-full h-full bg-slate-50 relative flex flex-col">
        {!overlay && !locked && props.onClose && (
          <div className="px-5 pt-3 pb-1 flex-shrink-0">
            <button onClick={props.onClose} className="inline-flex items-center gap-1 text-sm font-medium text-violet-600" aria-label="Volver a RETADOR">
              <ArrowLeft size={16} /> Volver a RETADOR
            </button>
          </div>
        )}
        <div className="pb-28" style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", minHeight: 0 }}>
          {tab === "home" && (
            <HomeScreen
              user={realUser}
              wallet={wallet}
              rates={rates}
              toggleHidden={toggleHidden}
              setPrimaryCurrency={setPrimaryCurrency}
              transactions={transactions}
              openOverlay={openOverlay}
              goHistory={() => setTab("history")}
            />
          )}
          {tab === "history" && <HistoryScreen transactions={transactions} openOverlay={openOverlay} />}
          {tab === "profile" && <ProfileScreen user={realUser} wallet={wallet} openOverlay={openOverlay} />}
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-10">
          <BottomNav tab={tab} setTab={(t) => { setTab(t); closeOverlay(); }} />
        </div>

        {overlay && (
          <div className="absolute inset-0 z-20">
            <div className="w-full h-full bg-white flex flex-col op-slide-up">
              {overlay.type === "send" && (
                <SendMoneyOverlay
                  contacts={realContacts}
                  wallet={wallet}
                  storedPin={security.pin}
                  onClose={closeOverlay}
                  onSent={handleSent}
                  onGoToAddFunds={() => openOverlay("addFunds")}
                  onGoToConverter={() => openOverlay("converter")}
                />
              )}
              {overlay.type === "receive" && <ReceiveMoneyScreen user={realUser} wallet={wallet} onClose={closeOverlay} />}
              {overlay.type === "pay" && (
                <PayOverlay
                  orders={orders}
                  wallet={wallet}
                  storedPin={security.pin}
                  onClose={closeOverlay}
                  onPaid={handlePaid}
                  onGoToAddFunds={() => openOverlay("addFunds")}
                  onGoToConverter={() => openOverlay("converter")}
                />
              )}
              {overlay.type === "addFunds" && (
                <AddFundsOverlay
                  bankAccounts={bankAccounts}
                  wallet={wallet}
                  onClose={closeOverlay}
                  onAdded={handleAdded}
                  onGoToBankAccounts={() => openOverlay("bankAccounts")}
                />
              )}
              {overlay.type === "withdraw" && (
                <WithdrawOverlay bankAccounts={bankAccounts} wallet={wallet} onClose={closeOverlay} onWithdrawn={handleWithdrawn} />
              )}
              {overlay.type === "security" && (
                <SecurityScreen security={security} setSecurity={setSecurity} onClose={closeOverlay} onLock={() => { lock(); closeOverlay(); }} />
              )}
              {overlay.type === "bankAccounts" && (
                <BankAccountsScreen bankAccounts={bankAccounts} setBankAccounts={setBankAccounts} onClose={closeOverlay} />
              )}
              {overlay.type === "paymentMethods" && (
                <PaymentMethodsScreen
                  wallet={wallet}
                  bankAccounts={bankAccounts}
                  onClose={closeOverlay}
                  onGoToBankAccounts={() => openOverlay("bankAccounts")}
                  onWithdraw={() => openOverlay("withdraw")}
                  onOpenConverter={() => openOverlay("converter")}
                />
              )}
              {overlay.type === "converter" && <ConverterScreen rates={rates} setRates={setRates} onClose={closeOverlay} />}
              {overlay.type === "txDetail" && <TransactionDetailSheet tx={selectedTx} onClose={closeOverlay} />}
            </div>
          </div>
        )}

        {locked && (
          <div className="absolute inset-0 z-50">
            <div className="w-full h-full">
              <AppLockScreen storedPin={security.pin} onUnlock={unlock} userName={realUser.name} onExit={props.onClose} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

  return WalletRoot;
})();
export default WalletApp;
