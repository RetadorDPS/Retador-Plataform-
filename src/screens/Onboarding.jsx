import { useState } from "react";
import { ChevronRight, MapPin, ShoppingBag, Store, Wrench, Compass, Check, ArrowLeft, Sparkles } from "lucide-react";
import { CUBA_PROVINCES, ONBOARDING_PAISES, saveOnboarding } from "../shared/index.js";

// ═════════════════════════════════════════════════════════════════════════════
// ONBOARDING — 3 pasos (idioma/región/intención), una sola vez tras el primer
// login. Diseño ya aprobado (prototipo RetadorOnboarding.jsx); esta versión
// llama de verdad a save_onboarding en cada paso (guardado incremental, así
// nada se pierde si alguien cierra la app a mitad del flujo) y a onDone() —
// real, del padre — al terminar, en vez de reiniciarse a sí mismo.
// ═════════════════════════════════════════════════════════════════════════════

const INTENCIONES = [
  { id: "comprar", label: "Comprar", desc: "Buscar productos y servicios", Icon: ShoppingBag },
  { id: "vender", label: "Vender", desc: "Publicar mis productos", Icon: Store },
  { id: "servicio", label: "Ofrecer un servicio", desc: "Trabajos, reparaciones, clases…", Icon: Wrench },
  { id: "explorar", label: "Solo estoy explorando", desc: "Todavía no lo sé", Icon: Compass },
];

const STEP_NAMES = ["idioma", "ubicacion", "intencion"];

function OmegaHero({ size = 116 }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <style>{`
        @property --p { syntax: '<percentage>'; inherits: false; initial-value: 0%; }
        @keyframes sweep { from { --p: 0%; } to { --p: 100%; } }
        @keyframes bloom { 0% {opacity:0; transform:scale(.6);} 55% {opacity:.55;} 100% {opacity:.26; transform:scale(1);} }
        @keyframes sheenBg { 0%,58% {background-position: 220% 0;} 100% {background-position: -100% 0;} }
      `}</style>
      <div
        className="absolute inset-0 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(255,192,30,.5) 0%, transparent 70%)", animation: "bloom 1.3s cubic-bezier(.16,1,.3,1) .1s both" }}
      />
      <div className="absolute inset-0 flex items-center justify-center font-black select-none" style={{ fontSize: size * 0.92, lineHeight: 1, color: "#FFC01E", opacity: 0.14 }}>Ω</div>
      <div
        className="absolute inset-0 flex items-center justify-center font-black select-none"
        style={{
          fontSize: size * 0.92, lineHeight: 1,
          backgroundImage: "linear-gradient(95deg, #FFC01E 38%, #fff3cf 50%, #FFC01E 62%)",
          backgroundSize: "320% 100%", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
          WebkitMaskImage: "conic-gradient(from -90deg, #000 var(--p), transparent var(--p))",
          maskImage: "conic-gradient(from -90deg, #000 var(--p), transparent var(--p))",
          animation: "sweep 1.3s cubic-bezier(.4,0,.2,1) .35s forwards, sheenBg 2.3s ease-in-out 2s infinite",
        }}
      >Ω</div>
    </div>
  );
}

function OmegaWatermark() {
  return (
    <div className="pointer-events-none absolute left-1/2 top-[2%] -translate-x-1/2 select-none" style={{ fontSize: "62vw", maxHeight: "56vh", lineHeight: 1, fontWeight: 900, color: "#FFC01E", opacity: 0.055 }}>Ω</div>
  );
}

function GridGlowBg() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden bg-[#080808]">
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,192,30,.09) 1px, transparent 1px), linear-gradient(90deg, rgba(255,192,30,.09) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(ellipse 75% 55% at 50% 15%, black 35%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 75% 55% at 50% 15%, black 35%, transparent 100%)",
        }}
      />
      <div className="absolute -top-[30%] left-1/2 -translate-x-1/2 w-[160%] aspect-square rounded-full" style={{ background: "radial-gradient(circle, rgba(255,192,30,.14) 0%, transparent 62%)" }} />
      <OmegaWatermark />
    </div>
  );
}

function Wordmark({ className = "text-[46px]" }) {
  return (
    <div className={`${className} font-black tracking-[-0.03em] leading-none`} style={{ backgroundImage: "linear-gradient(100deg, #7a7a72 0%, #FFC01E 60%, #ffe08a 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
      RETADOR
    </div>
  );
}

function ProgressBar({ step }) {
  if (step < 0) return null;
  const pct = ((step + 1) / STEP_NAMES.length) * 100;
  return (
    <div className="w-full h-[2px] bg-white/[0.07] rounded-full overflow-hidden">
      <div className="h-full bg-gradient-to-r from-[#c9a227] to-[#FFC01E] rounded-full transition-all duration-500 ease-out" style={{ width: `${pct}%` }} />
    </div>
  );
}

function Shell({ children, step, onBack, showBack }) {
  return (
    <div className="min-h-screen w-full text-[#F5F5F0] flex flex-col items-center justify-between relative">
      <GridGlowBg />
      <style>{`
        @keyframes riseIn { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .rise { animation: riseIn .5s cubic-bezier(.16,1,.3,1) both; }
        .rise-1 { animation-delay: .05s; } .rise-2 { animation-delay: .12s; }
        .rise-3 { animation-delay: .19s; } .rise-4 { animation-delay: .26s; }
        ::-webkit-scrollbar { display: none; }
      `}</style>
      <div className="relative w-full max-w-md px-6 pt-6 flex items-center gap-4 min-h-[28px]" style={{ paddingTop: "calc(1.5rem + env(safe-area-inset-top,0px))" }}>
        {showBack ? (
          <button onClick={onBack} className="text-[#8C8C86] hover:text-[#F5F5F0] transition-colors -ml-1 p-1"><ArrowLeft size={18} /></button>
        ) : <div className="w-5" />}
        <ProgressBar step={step} />
      </div>
      <div className="relative w-full max-w-md flex-1 flex flex-col justify-center px-6">{children}</div>
      <div className="h-10" />
    </div>
  );
}

function BigOption({ selected, onClick, children, className = "" }) {
  return (
    <button onClick={onClick} className={`w-full text-left rounded-2xl border transition-all duration-200 ${selected ? "border-[#FFC01E] bg-[#FFC01E]/[0.08]" : "border-white/10 bg-white/[0.02] hover:border-white/20"} ${className}`}>
      {children}
    </button>
  );
}

function PrimaryButton({ children, onClick, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-4 rounded-2xl font-black text-[15px] tracking-tight transition-all duration-200 flex items-center justify-center gap-1.5 ${disabled ? "bg-white/[0.06] text-[#5c5c58] cursor-not-allowed" : "bg-[#FFC01E] text-[#080808] hover:bg-[#ffcb42] active:scale-[0.98]"}`}
    >
      {children}
    </button>
  );
}

function SkipLink({ onClick, children }) {
  return <button onClick={onClick} className="w-full text-center text-[13px] text-[#6b6b66] hover:text-[#9a9a95] transition-colors py-3">{children}</button>;
}

export default function OnboardingScreen({ user, onDone }) {
  const [phase, setPhase] = useState("welcome");
  const [step, setStep] = useState(0);
  const [pais, setPais] = useState(null);
  const [provincia, setProvincia] = useState(null);
  const [intenciones, setIntenciones] = useState([]);
  const toggleIntencion = (id) => setIntenciones((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const nombreUsuario = (user?.name || "").split(" ")[0] || "";

  // Guardado incremental REAL — nunca bloquea la navegación si falla (se
  // reintenta solo, sin más, al reabrir la app: onboarding_done_at seguirá en
  // null hasta que el flujo se complete de verdad).
  const persist = (patch) => { saveOnboarding(patch).catch(() => {}); };

  const goNext = () => (step < STEP_NAMES.length - 1 ? setStep(step + 1) : (persist({ intent: intenciones, markDone: true }), setPhase("done")));
  const goBack = () => (step > 0 ? setStep(step - 1) : setPhase("welcome"));

  if (phase === "welcome") {
    return (
      <div className="min-h-screen w-full text-[#F5F5F0] flex flex-col items-center justify-center px-6 relative">
        <GridGlowBg />
        <style>{`
          @keyframes riseIn { from { opacity:0; transform:translateY(16px);} to {opacity:1; transform:translateY(0);} }
          .rise { animation: riseIn .6s cubic-bezier(.16,1,.3,1) both; }
        `}</style>
        <div className="relative flex flex-col items-center text-center max-w-xs w-full">
          <OmegaHero />
          <div className="rise mt-5" style={{ animationDelay: "1.85s" }}><Wordmark /></div>
          <div className="rise mt-1.5 text-[11px] font-bold tracking-[0.35em] text-[#6b6b66]" style={{ animationDelay: "1.95s" }}>BIENVENIDA</div>
          <p className="rise mt-6 text-[14.5px] leading-relaxed text-[#9a9a95]" style={{ animationDelay: "2.05s" }}>
            {nombreUsuario ? `Tres preguntas rápidas, ${nombreUsuario} — ` : "Tres preguntas rápidas — "}
            para que RETADOR se sienta hecho a tu medida desde el primer momento.
          </p>
          <div className="rise w-full mt-9" style={{ animationDelay: "2.17s" }}>
            <PrimaryButton onClick={() => setPhase("steps")}>Comenzar <ChevronRight size={17} strokeWidth={2.5} /></PrimaryButton>
          </div>
          <p className="rise mt-4 text-[12px] text-[#54544f]" style={{ animationDelay: "2.29s" }}>Toma menos de un minuto</p>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="min-h-screen w-full text-[#F5F5F0] flex flex-col items-center justify-center px-6 relative">
        <GridGlowBg />
        <style>{`
          @keyframes riseIn { from { opacity:0; transform:translateY(14px);} to {opacity:1; transform:translateY(0);} }
          @keyframes popIn { from {opacity:0; transform:scale(.7);} to {opacity:1; transform:scale(1);} }
          @keyframes pulseGlow { 0%,100% { box-shadow: 0 0 0 0 rgba(255,192,30,.45); } 50% { box-shadow: 0 0 0 10px rgba(255,192,30,0); } }
          .rise { animation: riseIn .5s cubic-bezier(.16,1,.3,1) both; }
        `}</style>
        <div className="relative flex flex-col items-center text-center max-w-xs w-full">
          <div className="w-16 h-16 rounded-full bg-[#FFC01E]/10 border border-[#FFC01E]/30 flex items-center justify-center" style={{ animation: "popIn .5s cubic-bezier(.34,1.56,.64,1) both" }}>
            <Check size={26} className="text-[#FFC01E]" strokeWidth={2.5} />
          </div>
          <h2 className="rise mt-6 text-[24px] font-black tracking-tight" style={{ animationDelay: ".15s" }}>Todo listo</h2>
          <p className="rise mt-2.5 text-[14px] leading-relaxed text-[#9a9a95]" style={{ animationDelay: ".25s" }}>
            {provincia ? `Vas a ver primero lo que hay cerca de ti, en ${provincia}. ` : ""}
            Coordina siempre dentro de RETADOR — así quedas respaldado en cada compra.
          </p>
          <div className="rise w-full mt-9" style={{ animationDelay: ".4s" }}>
            <button
              onClick={() => onDone && onDone()}
              className="w-full py-[18px] rounded-2xl font-black text-[16px] tracking-tight bg-[#FFC01E] text-[#080808] active:scale-[0.98] transition-transform"
              style={{ animation: "pulseGlow 2.2s ease-in-out 1.1s infinite" }}
            >
              Entrar a RETADOR →
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (STEP_NAMES[step] === "idioma") {
    return (
      <Shell step={step} onBack={goBack} showBack>
        <div className="rise rise-1">
          <p className="text-[13px] font-bold text-[#FFC01E] tracking-wide uppercase mb-2">Paso 1 de 3</p>
          <h2 className="text-[25px] font-black tracking-tight leading-tight">¿En qué idioma prefieres usar RETADOR?</h2>
        </div>
        <div className="mt-7 flex flex-col gap-2.5">
          <BigOption selected onClick={() => {}} className="rise rise-2 p-4 flex items-center justify-between">
            <span className="font-bold text-[15px]">Español</span>
            <Check size={18} className="text-[#FFC01E]" strokeWidth={2.5} />
          </BigOption>
          <div className="rise rise-3 w-full rounded-2xl border border-white/[0.06] bg-white/[0.015] p-4 flex items-center justify-between opacity-50">
            <span className="font-bold text-[15px] text-[#9a9a95]">English</span>
            <span className="text-[11px] font-semibold text-[#6b6b66] bg-white/[0.05] px-2.5 py-1 rounded-full">Muy pronto</span>
          </div>
        </div>
        <div className="rise rise-4 mt-9">
          <PrimaryButton onClick={() => { persist({ idioma: "es" }); goNext(); }}>Continuar <ChevronRight size={17} strokeWidth={2.5} /></PrimaryButton>
        </div>
      </Shell>
    );
  }

  if (STEP_NAMES[step] === "ubicacion") {
    return (
      <Shell step={step} onBack={goBack} showBack>
        <div className="rise rise-1">
          <p className="text-[13px] font-bold text-[#FFC01E] tracking-wide uppercase mb-2">Paso 2 de 3</p>
          <h2 className="text-[25px] font-black tracking-tight leading-tight">¿Desde dónde vas a usar RETADOR?</h2>
          <p className="mt-2 text-[13.5px] text-[#9a9a95] leading-relaxed">
            Elige tu provincia y te mostraremos primero lo que tienes cerca — sin dejar nunca de mostrarte el resto del país.
          </p>
        </div>
        <div className="rise rise-2 mt-6 flex gap-2">
          {ONBOARDING_PAISES.map((p) => (
            <button
              key={p.id}
              onClick={() => { setPais(p.id); setProvincia(null); }}
              className={`flex-1 py-3 rounded-full text-[13px] font-bold transition-all duration-200 border ${pais === p.id ? "bg-[#FFC01E] text-[#080808] border-[#FFC01E]" : "border-white/10 text-[#c8c8c2] hover:border-white/25"}`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {pais === "cuba" && (
          <div className="rise rise-3 mt-5">
            <div className="flex items-center gap-1.5 mb-3 text-[#9a9a95]"><MapPin size={13} /><span className="text-[12px] font-semibold tracking-wide uppercase">Elige tu provincia</span></div>
            <div className="max-h-[236px] overflow-y-auto grid grid-cols-2 gap-2 pr-1 pb-1">
              {CUBA_PROVINCES.map((prov) => (
                <button
                  key={prov}
                  onClick={() => setProvincia(prov)}
                  className={`text-left px-3.5 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-150 border flex items-center justify-between ${provincia === prov ? "bg-[#FFC01E] border-[#FFC01E] text-[#080808]" : "border-white/[0.07] bg-white/[0.02] text-[#c8c8c2] hover:border-white/20"}`}
                >
                  <span>{prov}</span>
                  {provincia === prov && <Check size={14} strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>
        )}
        {(pais === "espana" || pais === "eeuu") && (
          <div className="rise rise-3 mt-5 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 flex items-center gap-3">
            <Check size={16} className="text-[#FFC01E] shrink-0" strokeWidth={2.5} />
            <p className="text-[13px] text-[#c8c8c2]">Listo, ya sabemos dónde estás.</p>
          </div>
        )}
        <div className="rise rise-4 mt-8">
          <PrimaryButton
            onClick={() => { persist({ shopCountry: pais, shopProvince: pais === "cuba" ? provincia : null }); goNext(); }}
            disabled={!pais || (pais === "cuba" && !provincia)}
          >
            Continuar <ChevronRight size={17} strokeWidth={2.5} />
          </PrimaryButton>
          <SkipLink onClick={goNext}>Prefiero no decirlo ahora</SkipLink>
        </div>
      </Shell>
    );
  }

  if (STEP_NAMES[step] === "intencion") {
    return (
      <Shell step={step} onBack={goBack} showBack>
        <div className="rise rise-1">
          <p className="text-[13px] font-bold text-[#FFC01E] tracking-wide uppercase mb-2">Paso 3 de 3</p>
          <h2 className="text-[25px] font-black tracking-tight leading-tight">¿Qué te trae a RETADOR?</h2>
          <p className="mt-2 text-[13.5px] text-[#9a9a95] leading-relaxed">Elige todas las que apliquen.</p>
        </div>
        <div className="mt-6 flex flex-col gap-2.5">
          {INTENCIONES.map(({ id, label, desc, Icon }, i) => (
            <BigOption key={id} selected={intenciones.includes(id)} onClick={() => toggleIntencion(id)} className={`rise rise-${Math.min(i + 2, 4)} p-4 flex items-center gap-3.5`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${intenciones.includes(id) ? "bg-[#FFC01E] text-[#080808]" : "bg-white/[0.05] text-[#c8c8c2]"}`}>
                <Icon size={18} strokeWidth={2.2} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-[14.5px]">{label}</div>
                <div className="text-[12px] text-[#8c8c86] mt-0.5">{desc}</div>
              </div>
              {intenciones.includes(id) && (
                <div className="w-5 h-5 rounded-full bg-[#FFC01E] flex items-center justify-center shrink-0"><Check size={12} className="text-[#080808]" strokeWidth={3} /></div>
              )}
            </BigOption>
          ))}
        </div>
        <div className="rise rise-4 mt-8">
          <PrimaryButton onClick={goNext} disabled={intenciones.length === 0}>Continuar <ChevronRight size={17} strokeWidth={2.5} /></PrimaryButton>
        </div>
      </Shell>
    );
  }

  return null;
}
