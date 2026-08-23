// Gráficas de Mi Panel (Resumen/Estadísticas), separadas de Store.jsx para que
// recharts (bastante pesada) se descargue SOLO cuando un vendedor Pro abre de
// verdad su panel — nunca de entrada para todos los usuarios (la mayoría son
// compradores que nunca ven estas gráficas). Se carga con React.lazy() desde
// Store.jsx, mismo patrón ya usado para AdminPanel/Wallet/ProductTools/
// Courier/Auctions. Componentes puramente de presentación: reciben los datos
// ya calculados, sin lógica propia.
import { AreaChart, Area, BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { money } from "../shared/index.js";

export function RevenueAreaChart({ data, ac, C, gradientId, height = 140 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 0, left: -30, bottom: 0 }}>
        <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={ac} stopOpacity={.25} /><stop offset="100%" stopColor={ac} stopOpacity={0} /></linearGradient></defs>
        <XAxis dataKey="d" tick={{ fill: C.m, fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ background: C.s3, border: `1px solid ${C.b}`, borderRadius: 8, color: C.t, fontSize: 11 }} formatter={v => [money(v, "USD"), "Ingresos"]} labelStyle={{ color: C.m }} />
        <Area type="monotone" dataKey="v" stroke={ac} strokeWidth={2} fill={`url(#${gradientId})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CategoryBarChart({ data, colors, C, height = 150 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 30 }}>
        <XAxis dataKey="name" tick={{ fill: C.m, fontSize: 9 }} axisLine={false} tickLine={false} interval={0} angle={-15} textAnchor="end" />
        <Tooltip contentStyle={{ background: C.s3, border: `1px solid ${C.b}`, borderRadius: 8, color: C.t, fontSize: 11 }} formatter={v => [money(v, "USD"), "Ingresos"]} labelStyle={{ color: C.m }} />
        <Bar dataKey="v" radius={[4, 4, 0, 0]}>{data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} opacity={0.85} />)}</Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
