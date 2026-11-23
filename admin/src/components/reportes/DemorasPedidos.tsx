import { Link } from "react-router-dom";
import { AlarmClock, ArrowRight, CheckCircle2, Flame } from "lucide-react";
import type { DemorasPedidos as Datos, EtapaDemora } from "../../types/reporte.types";

/* =========================================================
   ¿DÓNDE SE ATRASAN LOS PEDIDOS?
   1) Las etapas del pedido en fila, con su tiempo promedio contra
      el esperado. La que más se pasa queda marcada: ahí se traba.
   2) Con todas las sucursales: cuáles son las más lentas y en qué etapa.
   3) Los pedidos que ahora mismo llevan demasiado en su etapa,
      con un acceso para abrirlos en Pedidos.
   ========================================================= */

type Props = {
  datos: Datos;
};

const minutosTexto = (minutos: number) => {
  if (minutos < 60) return `${Math.round(minutos)} min`;
  if (minutos < 1440) return `${Math.floor(minutos / 60)} h ${Math.round(minutos % 60)} min`;
  const dias = Math.floor(minutos / 1440);
  return dias === 1 ? "1 día" : `${dias} días`;
};

const decimal = (valor: number) => valor.toLocaleString("es-AR", { maximumFractionDigits: 1 });
const exceso = (relacion: number) => Math.round((relacion - 1) * 100);

// Verde: en tiempo · ámbar: un poco pasado · rojo: el cuello de botella
function estiloEtapa(etapa: EtapaDemora, esCuello: boolean) {
  if (etapa.relacion === null) return "border-gray-200 bg-gray-50 text-gray-500";
  if (esCuello) return "border-red-300 bg-red-50 text-red-900 ring-2 ring-red-200";
  if (etapa.relacion > 1) return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-emerald-200 bg-emerald-50 text-emerald-900";
}

export default function DemorasPedidos({ datos }: Props) {
  const cuello = datos.etapas.find((e) => e.estado === datos.cuelloDeBotella) ?? null;

  return (
    <div className="space-y-6 p-4 sm:p-5">
      {/* La conclusión, en una línea */}
      {cuello && cuello.promedioMinutos !== null && cuello.relacion !== null ? (
        <p className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          <Flame size={18} className="mt-0.5 shrink-0" />
          <span>
            Los pedidos se atrasan en <strong>{cuello.nombre.toLowerCase()}</strong>:{" "}
            {decimal(cuello.promedioMinutos)} min en promedio, un <strong>{exceso(cuello.relacion)} % más</strong> de lo
            esperado ({cuello.esperadoMinutos} min).
          </span>
        </p>
      ) : (
        <p className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <span>
            {datos.sucursalesLentas.length > 0
              ? "En general, todas las etapas están dentro del tiempo esperado. Pero hay sucursales que se atrasan:"
              : "Todas las etapas están dentro del tiempo esperado."}
          </span>
        </p>
      )}

      {/* 1) Las etapas, en orden */}
      <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {datos.etapas.map((etapa, i) => {
          const esCuello = etapa.estado === datos.cuelloDeBotella;
          return (
            <li key={etapa.estado} className={`relative rounded-xl border p-3 ${estiloEtapa(etapa, esCuello)}`}>
              {esCuello && (
                <span className="absolute -top-2.5 right-3 rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white">
                  Acá se traba
                </span>
              )}
              <p className="text-xs font-semibold uppercase tracking-wide opacity-75">Paso {i + 1}</p>
              <p className="font-bold">{etapa.nombre}</p>
              {etapa.promedioMinutos === null ? (
                <p className="mt-1 text-sm">Sin datos en este período</p>
              ) : (
                <p className="mt-1 text-sm">
                  <strong className="text-lg">{decimal(etapa.promedioMinutos)} min</strong>{" "}
                  <span className="opacity-75">/ esperado {etapa.esperadoMinutos}</span>
                </p>
              )}
            </li>
          );
        })}
      </ol>

      {/* 2) Sucursales más lentas (solo con todas las sucursales) */}
      {datos.sucursalesLentas.length > 0 && (
        <div>
          <h4 className="mb-2 font-bold text-gray-900">Sucursales más lentas</h4>
          <ul className="divide-y rounded-xl border bg-white">
            {datos.sucursalesLentas.map((s) => (
              <li key={s.sucursalId} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm">
                  <strong>{s.nombre ?? `Sucursal ${s.sucursalId}`}</strong> se atrasa en{" "}
                  <strong>{s.peorEtapa.nombre.toLowerCase()}</strong>:{" "}
                  {decimal(s.peorEtapa.promedioMinutos ?? 0)} min{" "}
                  <span className="font-semibold text-red-700">(+{exceso(s.peorEtapa.relacion ?? 1)} %)</span>
                </p>
                <Link
                  to={`/admin/pedidos?sucursal=${s.sucursalId}`}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-orange-700 hover:underline"
                >
                  Ver sus pedidos <ArrowRight size={14} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 3) Demorados ahora */}
      <div>
        <h4 className="mb-2 flex items-center gap-2 font-bold text-gray-900">
          <AlarmClock size={18} className="text-red-600" />
          Demorados ahora
          {datos.demorados.length > 0 && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">{datos.demorados.length}</span>
          )}
        </h4>

        {datos.demorados.length === 0 ? (
          <p className="rounded-lg bg-gray-50 px-4 py-4 text-sm text-gray-600">Ningún pedido en curso está demorado.</p>
        ) : (
          <ul className="divide-y rounded-xl border bg-white">
            {datos.demorados.map((d) => (
              <li key={d.pedidoId} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 text-sm">
                  <p>
                    <strong>Pedido #{d.pedidoId}</strong>
                    {d.cliente && <span className="text-gray-600"> · {d.cliente}</span>}
                    {d.sucursalNombre && <span className="text-gray-600"> · {d.sucursalNombre}</span>}
                  </p>
                  <p className="text-gray-700">
                    {d.etapa} hace <strong className="text-red-700">{minutosTexto(d.minutos)}</strong>
                    <span className="text-gray-500"> (lo normal: hasta {d.limiteMinutos} min)</span>
                  </p>
                </div>
                <Link
                  to={`/admin/pedidos?pedido=${d.pedidoId}&sucursal=${d.sucursalId}`}
                  className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-orange-700 hover:underline"
                >
                  Ver pedido <ArrowRight size={14} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
