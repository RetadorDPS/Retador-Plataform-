import { useState, useEffect, useRef } from "react";
import { CheckCircle2, XCircle, Clock3, ShoppingBag } from "lucide-react";
import { G, Spin, money, useAt, getOrderPaymentState } from "../shared/index.js";

// ═════════════════════════════════════════════════════════════════════════
// PANTALLA DE RETORNO DE STRIPE CHECKOUT
//
// A esta pantalla se llega SOLO por la URL de éxito/cancelado que arma
// stripe-create-checkout (?pago=exito|cancelado&pedido=<id>). Volver de ahí
// NO significa que el pedido esté pagado: el único que puede confirmarlo es
// el webhook de Stripe, que puede tardar unos segundos en llegar. Por eso
// esta pantalla nunca asume éxito — consulta el pedido REAL (held_amount /
// payment_status) y se queda mirando hasta que cambie de verdad.
// ═════════════════════════════════════════════════════════════════════════
const SONDEO_MS = 3000;
const SONDEOS_MAX = 20; // ~60s de espera activa antes de dejar de insistir solo

export function PagoStripeScreen({ orderId, resultado, onVerPedido, onIrAlInicio }) {
  const { BG, S, B, T1, T2, T3, isDark } = useAt();
  const [order, setOrder] = useState(null);
  const [buscando, setBuscando] = useState(true);
  const [intentos, setIntentos] = useState(0);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const timerRef = useRef(null);
  const cancelado = resultado === "cancelado";
  const pagado = !!order && (order.payment_status === "confirmado" || order.held_amount != null);
  const agotado = !pagado && !cancelado && intentos >= SONDEOS_MAX;

  const consultar = async () => {
    const o = await getOrderPaymentState(orderId);
    setOrder(o);
    setNoEncontrado(!o);
    setBuscando(false);
    setIntentos(n => n + 1);
    return o;
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      const o = await consultar();
      if (!alive) return;
      const yaResuelto = cancelado || (o && (o.payment_status === "confirmado" || o.held_amount != null));
      if (!yaResuelto) {
        timerRef.current = setInterval(() => { consultar(); }, SONDEO_MS);
      }
    })();
    return () => { alive = false; clearInterval(timerRef.current); };
  }, [orderId]);

  // En cuanto hay un resultado definitivo (pagado o se agotó el tiempo de
  // espera activa), se deja de sondear solo — el webhook, si llega después,
  // igual deja el pedido correcto; el comprador ya puede seguir usando la app.
  useEffect(() => {
    if (pagado || agotado) clearInterval(timerRef.current);
  }, [pagado, agotado]);

  const reintentar = async () => { setBuscando(true); await consultar(); };

  const card = isDark ? "#0f0f0f" : S;
  const soft = isDark ? "#111" : "#F5F6F7";

  let icono, titulo, detalle, extra = null;
  if (noEncontrado) {
    icono = <XCircle size={46} color="#ef4444" />;
    titulo = "No pudimos encontrar este pedido";
    detalle = "Puede que ya no tengas acceso a él. Revisa tus pedidos para ver su estado real.";
  } else if (cancelado) {
    icono = <XCircle size={46} color="#ef4444" />;
    titulo = "Pago cancelado";
    detalle = "No se realizó ningún cobro. Puedes intentarlo de nuevo cuando quieras, desde el mismo pedido.";
  } else if (pagado) {
    icono = <CheckCircle2 size={46} color="#22C55E" />;
    titulo = "¡Pago confirmado!";
    detalle = "Tu dinero quedó en custodia segura. El vendedor prepará tu pedido para el envío.";
    if (order?.amount != null) extra = money(order.amount, order.currency);
  } else if (agotado) {
    icono = <Clock3 size={46} color={G} />;
    titulo = "Esto está tardando más de lo normal";
    detalle = "Tu pago puede seguir procesándose. Te avisaremos en cuanto se confirme — también puedes revisar el pedido más tarde.";
  } else {
    icono = <Spin size={40} color={G} />;
    titulo = "Procesando tu pago…";
    detalle = "Esto puede tardar unos segundos. No cierres la app.";
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 5500, background: BG, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 380, background: card, border: `1px solid ${B}`, borderRadius: 20, padding: "34px 26px", textAlign: "center" }}>
        <div style={{ marginBottom: 18, display: "flex", justifyContent: "center" }}>{icono}</div>
        <p style={{ fontSize: 17, fontWeight: 900, color: T1, marginBottom: 8 }}>{titulo}</p>
        <p style={{ fontSize: 12.5, color: T2, lineHeight: 1.6, marginBottom: extra ? 10 : 22 }}>{detalle}</p>
        {extra && <p style={{ fontSize: 22, fontWeight: 900, color: G, marginBottom: 22 }}>{extra}</p>}

        {order?.title && !noEncontrado && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: soft, border: `1px solid ${B}`, borderRadius: 12, padding: "10px 13px", marginBottom: 20, textAlign: "left" }}>
            <ShoppingBag size={16} color={T2} style={{ flexShrink: 0 }} />
            <p style={{ fontSize: 11.5, color: T1, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{order.title}</p>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {agotado && (
            <button onClick={reintentar} disabled={buscando} style={{ width: "100%", background: isDark ? "#1a1a1a" : "#eee", color: T1, border: "none", borderRadius: 50, padding: "13px", fontSize: 12.5, fontWeight: 800, cursor: "pointer", opacity: buscando ? .6 : 1 }}>
            {buscando ? "Actualizando…" : "Actualizar ahora"}
          </button>
          )}
          {(pagado || cancelado || agotado || noEncontrado) && (
            <button onClick={() => onVerPedido?.(orderId)} style={{ width: "100%", background: G, color: "#000", border: "none", borderRadius: 50, padding: "14px", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
              {noEncontrado ? "Ver mis pedidos" : "Ver mi pedido"}
            </button>
          )}
          <button onClick={onIrAlInicio} style={{ width: "100%", background: "none", color: T2, border: "none", padding: "8px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
