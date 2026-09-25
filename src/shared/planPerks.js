// ═════════════════════════════════════════════════════════════════════════════
// Beneficios por plan — ÚNICO lugar donde se decide qué recibe cada plan en
// las herramientas (hoy: la marca de agua del Generador de Video; más adelante,
// los anuncios). Recibe la fila REAL de la tabla plans del usuario (o null).
//
// Regla: solo cuenta como plan pagado si plans.can_customize es exactamente
// true (la misma columna que abre la Tienda Pro). Sin sesión, plan gratis,
// planes todavía cargando o plan desconocido → se trata como gratis. Ante la
// duda, CON marca de agua.
// ═════════════════════════════════════════════════════════════════════════════
export function getPlanPerks(plan) {
  const esPago = plan?.can_customize === true;
  return {
    esPago,
    conMarcaDeAgua: !esPago,
  };
}
