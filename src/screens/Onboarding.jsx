import { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo } from "react";
import { B, BG, G, S, Spin, authSignIn, authSignUp, getUserById } from "../shared/index.js";

// NOTA: estas pantallas de inicio/registro (Splash, Landing, Auth) no están
// conectadas al flujo actual de la app (quedaron como versión previa). Se dejan
// aquí organizadas por si se quieren reconectar más adelante.

export function Splash() {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: `radial-gradient(ellipse at 50% 38%,#18100a 0%,${BG} 65%)` }}>
      <div style={{ position: "absolute", width: 340, height: 340, borderRadius: "50%", background: `radial-gradient(ellipse,rgba(245,184,0,.08) 0%,transparent 68%)` }} />
      <div className="glw" style={{ textAlign: "center", position: "relative" }}>
        <div style={{ lineHeight: .8 }}>
          <span style={{ fontFamily: "'Bebas Neue'", fontSize: 95, letterSpacing: 7, color: "#fff" }}>RETA</span>
          <span className="dor" style={{ fontFamily: "'Bebas Neue'", fontSize: 49, letterSpacing: 7 }}>DOR</span>
        </div>
        <div style={{ fontSize: 9, letterSpacing: 13, color: "#1e1e1e", fontWeight: 700, marginTop: 6 }}>MARKETPLACE</div>
      </div>
      <div style={{ position: "absolute", bottom: 54, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <Spin size={18} />
        <span style={{ fontSize: 8, color: "#1e1e1e", fontWeight: 700, letterSpacing: 2.5 }}>CARGANDO</span>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// LANDING
// ═════════════════════════════════════════════════════════════════════════════
export function Landing({ onEnter, onBrowse }) {
  const tk = ["AURICULARES BT", "SMARTWATCH PRO", "ZAPATILLAS", "CAFÉ CUBANO", "CHAQUETA BOMBER", "TECLADO RGB", "PERFUME IMPORTADO", "JOYERÍA"].map(t => `${t}  ◆  `).join("");
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      <div style={{ position: "absolute", top: "28%", left: "50%", transform: "translate(-50%,-50%)", width: 420, height: 300, background: `radial-gradient(ellipse,rgba(245,184,0,.08) 0%,transparent 64%)`, pointerEvents: "none" }} />
      <div style={{ padding: "16px 22px 0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 2 }}>
        <span style={{ fontFamily: "'Bebas Neue'", fontSize: 13, letterSpacing: 4, color: "#1e1e1e" }}>RETADOR</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div className="blk" style={{ width: 5, height: 5, borderRadius: "50%", background: G }} />
          <span style={{ fontSize: 9, color: "#1e1e1e" }}>Beta Pública</span>
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 26px 8px", textAlign: "center" }}>
        <div className="f0" style={{ border: `1.5px solid ${G}`, borderRadius: 100, padding: "6px 18px", fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: G, marginBottom: 26, background: `${G}09` }}>⚡ AHORA EN BETA PÚBLICA</div>
        <div className="f1 glw" style={{ lineHeight: .8, marginBottom: 10 }}>
          <span style={{ fontFamily: "'Bebas Neue'", fontSize: 49, letterSpacing: 5, color: "#fff" }}>RETA</span>
          <span className="dor" style={{ fontFamily: "'Bebas Neue'", fontSize: 49, letterSpacing: 5 }}>DOR</span>
        </div>
        <div className="f2" style={{ fontSize: 9, letterSpacing: 10, color: "#252525", fontWeight: 700, marginBottom: 20 }}>MARKETPLACE</div>
        <div className="f3" style={{ fontSize: 12, color: "#363636", marginBottom: 30 }}>
          Compra.&nbsp;<span style={{ color: G }}>•</span>&nbsp;Vende.&nbsp;<span style={{ color: G }}>•</span>&nbsp;Escala.
        </div>
        <div className="f5" style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
          <button className="p" onClick={onEnter} style={{ width: "100%", background: "#fff", color: "#000", border: "none", borderRadius: 50, padding: "15px", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            Crear cuenta o iniciar sesión →
          </button>
          <button className="p" onClick={onBrowse} style={{ width: "100%", background: "transparent", color: "#484848", border: `1.5px solid ${B}`, borderRadius: 50, padding: "14px", fontSize: 11, fontWeight: 600 }}>
            Explorar sin cuenta
          </button>
        </div>
      </div>
      <div style={{ padding: "12px 26px", borderTop: `1px solid #131313`, display: "flex", justifyContent: "space-around" }}>
        {[["1200+", "PRODUCTOS"], ["340+", "VENDEDORES"], ["98%", "SATISFACCIÓN"]].map(([n, l]) => (
          <div key={l} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 19, fontWeight: 900 }}>{n}</div>
            <div style={{ fontSize: 7.5, color: "#8a8a8a", fontWeight: 700, letterSpacing: 2, marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ background: "#0a0a0a", borderTop: `1px solid #141414`, padding: "7px 0", overflow: "hidden" }}>
        <div className="tkr" style={{ fontSize: 9, color: "#1e1e1e", fontWeight: 700, letterSpacing: 2 }}>{tk}{tk}</div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// AUTH — email + password
// ═════════════════════════════════════════════════════════════════════════════
export function Auth({ onDone, flash }) {
  const [mode,     setMode]     = useState("login");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [name,     setName]     = useState("");
  const [loading,  setLoading]  = useState(false);
  const inp = { width: "100%", background: S, border: `1px solid ${B}`, borderRadius: 14, padding: "14px 16px", color: "#fff", fontSize: 13, outline: "none" };

  const submit = async () => {
    if (!email.trim() || !password.trim()) { flash("⚠️ Completa todos los campos"); return; }
    if (mode === "signup" && !name.trim()) { flash("⚠️ Ingresa tu nombre"); return; }
    if (password.length < 6) { flash("⚠️ Contraseña mínimo 6 caracteres"); return; }
    setLoading(true);
    try {
      let authUser;
      if (mode === "signup") {
        authUser = await authSignUp(email.trim(), password, name.trim());
        if (!authUser) { flash("✅ Revisa tu email para confirmar"); setLoading(false); return; }
      } else {
        authUser = await authSignIn(email.trim(), password);
      }
      const ud = await getUserById(authUser.id);
      onDone(ud || { id: authUser.id, email: authUser.email, name: name || authUser.email?.split("@")[0] || "Usuario", points: 0 });
    } catch (e) {
      const m = e.message || "";
      if (m.includes("Invalid login"))       flash("❌ Email o contraseña incorrectos");
      else if (m.includes("already registered")) flash("❌ Email ya registrado — inicia sesión");
      else if (m.includes("Email not confirmed")) flash("⚠️ Confirma tu email primero");
      else flash("❌ " + m);
    } finally { setLoading(false); }
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 26px" }}>
      <div style={{ marginBottom: 30, textAlign: "center" }}>
        <div style={{ lineHeight: .8, marginBottom: 10 }}>
          <span style={{ fontFamily: "'Bebas Neue'", fontSize: 56, letterSpacing: 3 }}>RETA</span>
          <span className="dor" style={{ fontFamily: "'Bebas Neue'", fontSize: 56, letterSpacing: 3 }}>DOR</span>
        </div>
        <p style={{ color: "#3e3e3e", fontSize: 11 }}>{mode === "login" ? "Bienvenido de vuelta" : "Únete a RETADOR"}</p>
      </div>
      <div style={{ display: "flex", background: "#0e0e0e", border: `1px solid ${B}`, borderRadius: 50, padding: 4, marginBottom: 22, width: "100%" }}>
        {[["login", "Iniciar sesión"], ["signup", "Crear cuenta"]].map(([m, l]) => (
          <button key={m} onClick={() => setMode(m)} className="p" style={{ flex: 1, background: mode === m ? G : "transparent", color: mode === m ? "#000" : "#3e3e3e", border: "none", borderRadius: 50, padding: "10px", fontSize: 11, fontWeight: 700, transition: "all .2s" }}>{l}</button>
        ))}
      </div>
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
        {mode === "signup" && <input style={inp} placeholder="Tu nombre o nombre de tienda" value={name} onChange={e => setName(e.target.value)} />}
        <input style={inp} placeholder="tucorreo@email.com" value={email} onChange={e => setEmail(e.target.value)} type="email" autoCapitalize="none" />
        <input style={inp} placeholder="Contraseña (mín. 6 caracteres)" value={password} onChange={e => setPassword(e.target.value)} type="password" onKeyDown={e => { if (e.key === "Enter") submit(); }} />
      </div>
      <button className="p" onClick={submit} disabled={loading} style={{ width: "100%", background: G, color: "#000", border: "none", borderRadius: 50, padding: "15px", fontSize: 13, fontWeight: 800, marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        {loading ? <Spin size={18} color="#000" /> : mode === "login" ? "Entrar →" : "Crear cuenta 🚀"}
      </button>
      {mode === "login" && <p style={{ fontSize: 11, color: "#303030", marginTop: 12, textAlign: "center" }}>¿No tienes cuenta? <span onClick={() => setMode("signup")} style={{ color: G, cursor: "pointer", fontWeight: 700 }}>Regístrate</span></p>}
    </div>
  );
}
