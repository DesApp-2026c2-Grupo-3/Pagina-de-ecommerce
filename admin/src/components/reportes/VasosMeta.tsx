import { useEffect, useState } from "react";
import type { VentaSucursal, VentasPorSucursal } from "../../types/reporte.types";

/* =========================================================
   LOS VASOS DE LA META
   Cada sucursal es un vaso de gaseosa con tapa y sorbete.
   La meta es vender lo mismo que el mes anterior: el vaso se
   llena según cuánto lleva de esa meta. Si la supera, la tapa
   se levanta, asoma la espuma y el vaso "transpira".
   En el mes en curso, una línea punteada marca por dónde
   debería ir hoy para llegar.
   Si hay una sola sucursal (admin de sucursal), se muestra un
   vaso grande con el detalle al costado.
   ========================================================= */

type Props = {
  datos: VentasPorSucursal;
};

const ALTURA_UTIL = 0.86; // lleno, el líquido queda justo debajo de la franja de la marca

const formatearDinero = (valor: number) =>
  valor.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });

/* "$1,24 M" o "$850 mil", para que entre debajo del vaso */
function formatearCorto(valor: number) {
  if (valor >= 1_000_000) {
    return `$${(valor / 1_000_000).toFixed(2).replace(".", ",")} M`;
  }
  return `$${Math.round(valor / 1000).toLocaleString("es-AR")} mil`;
}

const nombreDelMes = (mes: string) =>
  new Date(`${mes}-15T12:00:00`).toLocaleDateString("es-AR", { month: "long" });

/* Porcentaje de la meta (null si el mes anterior no tuvo ventas) */
const porcentajeDe = (sucursal: VentaSucursal) =>
  sucursal.meta > 0 ? Math.round((sucursal.ventas / sucursal.meta) * 100) : null;

function Corona() {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} role="img" aria-label="Superó la meta">
      <path
        d="M3 18l-1-11 6 4 4-7 4 7 6-4-1 11z"
        fill="#f59e0b"
        stroke="#b45309"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ---------- Un vaso (chico en la fila, grande si está solo) ---------- */

type VasoProps = {
  porcentaje: number | null;
  listo: boolean;
  activo: boolean;
  grande?: boolean;
  ritmo: number | null; // null = mes cerrado, sin línea de ritmo
  demora: number;
};

function Vaso({ porcentaje, listo, activo, grande = false, ritmo, demora }: VasoProps) {
  const rebalsa = listo && porcentaje !== null && porcentaje >= 100;
  const nivel = listo && porcentaje !== null ? Math.min(100, porcentaje) * ALTURA_UTIL : 0;
  const conHielo = porcentaje !== null && porcentaje >= 20;
  const borde = activo || grande ? "#ea580c" : "#d6a77a";

  return (
    <span
      className={`relative block ${
        grande ? "mt-20 h-[260px] w-[116px] sm:h-[300px] sm:w-[134px]" : "mt-10 h-[120px] w-[54px] sm:h-[140px] sm:w-[62px]"
      }`}
    >
      {/* Espuma que asoma por debajo de la tapa y gotea por afuera */}
      {rebalsa && (
        <>
          <span
            aria-hidden="true"
            className="rep-espuma absolute -inset-x-[5%] -top-[6%] z-[3] h-[9%] rounded-xl bg-orange-50 shadow-[0_0_0_2px_#fed7aa]"
          />
          <span aria-hidden="true" className="rep-gota-espuma left-0 [animation-delay:1.8s]" />
          <span aria-hidden="true" className="rep-gota-espuma -right-0.5 [animation-delay:2.7s]" />
        </>
      )}

      {/* Tapa abombada con el sorbete atravesándola */}
      <span
        aria-hidden="true"
        className={`rep-tapa absolute -inset-x-[8%] -top-[12%] z-[4] h-[13%] ${rebalsa ? "rep-tapa-arriba" : ""}`}
      >
        <span
          className="absolute bottom-[30%] left-[54%] h-[190%] w-[9%] rotate-[14deg] rounded-[3px] bg-[repeating-linear-gradient(180deg,#ef4444_0_6px,#ffffff_6px_12px)] shadow-[0_0_0_1px_rgba(185,28,28,0.25)]"
        />
        <span
          className="absolute inset-x-[16%] top-0 h-[62%] border-2 border-b-0 bg-[linear-gradient(180deg,#ffffff,#f3f4f6)]"
          style={{ borderColor: borde, borderRadius: "50% 50% 0 0 / 100% 100% 0 0" }}
        />
        <span
          className="absolute inset-x-0 bottom-0 h-[44%] rounded-[5px] border-2 bg-[linear-gradient(180deg,#ffffff,#e5e7eb)] shadow-[0_2px_0_rgba(17,24,39,0.06)]"
          style={{ borderColor: borde }}
        />
      </span>

      {/* Cuerpo del vaso, recortado con su forma */}
      <span className="absolute inset-0 overflow-hidden bg-[linear-gradient(90deg,#fff7ed,#ffffff_40%,#fff7ed)] [clip-path:polygon(0_0,100%_0,86%_100%,14%_100%)]">
        {/* La gaseosa */}
        <span
          className="rep-liquido absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,#fb923c,#ea580c)]"
          style={{ height: `${nivel}%`, transitionDelay: `${demora}s` }}
        >
          {/* Ola en la superficie */}
          <svg
            aria-hidden="true"
            viewBox="0 0 120 10"
            preserveAspectRatio="none"
            className="rep-ola-vaso absolute -top-[5px] left-0 h-[7px] w-[200%]"
          >
            <path d="M0 5 Q7.5 0 15 5 T30 5 T45 5 T60 5 T75 5 T90 5 T105 5 T120 5 V10 H0Z" fill="#fb923c" />
          </svg>

          {conHielo && (
            <>
              <span aria-hidden="true" className="rep-hielo top-[5%] left-[18%] w-[24%]" />
              <span aria-hidden="true" className="rep-hielo top-[9%] left-[50%] w-[20%] [animation-delay:-1.4s]" />
            </>
          )}

          <span className="rep-burbuja left-1/4" />
          <span className="rep-burbuja left-[55%] [animation-delay:0.8s]" />
          <span className="rep-burbuja left-[72%] [animation-delay:1.6s]" />
        </span>

        {/* Franja de la marca, arriba como el cuello impreso del vaso */}
        <span
          aria-hidden="true"
          className={`absolute inset-x-0 top-[3%] flex h-[9%] items-center justify-center bg-red-600 font-black tracking-[0.08em] text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.25),inset_0_-2px_0_rgba(0,0,0,0.12)] ${
            grande ? "text-sm" : "text-[9px]"
          }`}
        >
          BF
        </span>
      </span>

      {/* Gotitas de condensación cuando superó la meta */}
      {rebalsa && (
        <>
          <span aria-hidden="true" className="rep-condensa top-[22%] left-[16%] [animation-delay:2s]" />
          <span aria-hidden="true" className="rep-condensa top-[36%] right-[18%] [animation-delay:3.1s]" />
          <span aria-hidden="true" className="rep-condensa top-[50%] left-[24%] [animation-delay:4.2s]" />
        </>
      )}

      {/* Línea "por dónde debería ir hoy" */}
      {ritmo !== null && (
        <span
          aria-hidden="true"
          className="absolute -inset-x-2 z-[3] border-t-2 border-dashed border-gray-800"
          style={{ bottom: `${ritmo * 100 * ALTURA_UTIL}%` }}
        />
      )}

      {/* Contorno y brillo */}
      <svg
        aria-hidden="true"
        viewBox="0 0 64 140"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      >
        <polygon
          points="1,1 63,1 54,139 10,139"
          fill="none"
          stroke={borde}
          strokeWidth={activo || grande ? 3 : 2}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <path d="M9 20 L14 126" stroke="rgba(255,255,255,.75)" strokeWidth="3.5" strokeLinecap="round" />
      </svg>
    </span>
  );
}

/* ---------- Un renglón del detalle "concepto ........ valor" ---------- */

function Renglon({ concepto, valor }: { concepto: string; valor: string }) {
  return (
    <div className="flex items-baseline gap-2 text-sm">
      <span className="shrink-0 text-gray-600">{concepto}</span>
      <span className="flex-1 border-b border-dotted border-gray-300" />
      <strong className="text-right text-gray-900">{valor}</strong>
    </div>
  );
}

export default function VasosMeta({ datos }: Props) {
  /* El líquido arranca vacío y sube al aparecer */
  const [listo, setListo] = useState(false);
  const [elegidoId, setElegidoId] = useState<number | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => setListo(true), 80);
    return () => window.clearTimeout(id);
  }, []);

  const enCurso = datos.diaActual !== null;
  const ritmo = enCurso ? (datos.diaActual ?? 0) / datos.diasDelMes : 1;
  const mes = nombreDelMes(datos.mes);
  const unaSola = datos.sucursales.length === 1;

  // ¿Va bien? En un mes cerrado: superó la meta. En curso: va por arriba del ritmo.
  const vaBien = (sucursal: VentaSucursal) => {
    const porcentaje = porcentajeDe(sucursal);
    return porcentaje !== null && porcentaje / 100 >= ritmo;
  };

  const cumplen = datos.sucursales.filter(vaBien).length;

  const elegida =
    datos.sucursales.find((sucursal) => sucursal.sucursalId === elegidoId) ??
    datos.sucursales[0];
  const diferencia = elegida.ventas - elegida.meta;
  const diasRestantes = datos.diasDelMes - (datos.diaActual ?? datos.diasDelMes);
  const porcentajeElegida = porcentajeDe(elegida);

  let estado: string;
  if (elegida.meta === 0) {
    estado = "El mes anterior no tuvo ventas, así que no hay meta para comparar";
  } else if (enCurso) {
    estado = vaBien(elegida)
      ? "Va adelantada: a este ritmo supera la meta"
      : `Va atrasada: le faltan ${formatearDinero(-diferencia)} en ${diasRestantes} días`;
  } else {
    estado =
      diferencia >= 0
        ? `Superó la meta por ${formatearDinero(diferencia)}`
        : `Le faltaron ${formatearDinero(-diferencia)}`;
  }

  const leyendaRitmo = enCurso && (
    <p className="flex items-center gap-2 text-xs text-gray-600">
      <span aria-hidden="true" className="w-6 shrink-0 border-t-2 border-dashed border-gray-800" />
      Por dónde debería ir hoy (día {datos.diaActual} de {datos.diasDelMes}) para llegar a la meta.
    </p>
  );

  /* ---------- Admin de sucursal: un vaso grande con el detalle ---------- */
  if (unaSola) {
    return (
      <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 rounded-2xl bg-[linear-gradient(180deg,#ffffff,#fff7ed)] px-4 pt-6 pb-6 shadow-[inset_0_0_0_1px_#fed7aa]">
          <span className="relative flex flex-col items-center">
            {porcentajeElegida !== null && porcentajeElegida >= 100 && (
              <span className="rep-corona absolute -top-1 left-1/2 -ml-[11px]">
                <Corona />
              </span>
            )}
            <Vaso
              porcentaje={porcentajeElegida}
              listo={listo}
              activo
              grande
              ritmo={enCurso ? ritmo : null}
              demora={0}
            />
          </span>

          <div aria-live="polite" className="flex w-full max-w-[340px] flex-col gap-2.5">
            <p className="text-sm text-gray-600">
              <strong
                className={`block text-[40px] leading-none ${vaBien(elegida) ? "text-green-700" : "text-orange-700"}`}
              >
                {porcentajeElegida === null ? "—" : `${porcentajeElegida}%`}
              </strong>
              de la meta de {mes}
            </p>

            <Renglon concepto="Vendió" valor={formatearDinero(elegida.ventas)} />
            <Renglon concepto="Meta" valor={formatearDinero(elegida.meta)} />
            <Renglon concepto="Pedidos" valor={elegida.pedidos.toLocaleString("es-AR")} />
            {elegida.pedidos > 0 && (
              <Renglon
                concepto="Ticket promedio"
                valor={formatearDinero(elegida.ventas / elegida.pedidos)}
              />
            )}

            <p className={`text-sm font-bold ${vaBien(elegida) ? "text-green-700" : "text-amber-700"}`}>
              {estado}
            </p>
          </div>
        </div>

        {leyendaRitmo}
      </div>
    );
  }

  /* ---------- Master: un vaso por sucursal ---------- */
  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <p aria-live="polite" className="text-[15px] text-gray-700">
        <strong className="text-[22px] text-gray-900">{cumplen}</strong> de{" "}
        {datos.sucursales.length} sucursales{" "}
        {enCurso ? "van camino a superar" : "superaron"} la meta de {mes}.
      </p>

      {/* Los vasos: se acomodan solos en filas según el ancho */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(78px,1fr))] gap-x-2 gap-y-8 rounded-2xl bg-[linear-gradient(180deg,#ffffff,#fff7ed)] px-2.5 pt-5 pb-3.5 shadow-[inset_0_0_0_1px_#fed7aa]">
        {datos.sucursales.map((sucursal, indice) => {
          const porcentaje = porcentajeDe(sucursal);
          const activo = sucursal.sucursalId === elegida.sucursalId;

          return (
            <button
              key={sucursal.sucursalId}
              type="button"
              aria-pressed={activo}
              aria-label={`${sucursal.nombre}: ${porcentaje ?? 0}% de la meta`}
              onClick={() => setElegidoId(sucursal.sucursalId)}
              className="rep-vaso flex min-w-0 flex-col items-center gap-1.5"
            >
              {/* Porcentaje (y corona si superó la meta) */}
              <span className="relative flex h-6 items-center">
                {porcentaje !== null && porcentaje >= 100 && (
                  <span className="rep-corona absolute bottom-5 left-1/2 -ml-[11px]">
                    <Corona />
                  </span>
                )}
                <strong
                  className={`text-base ${vaBien(sucursal) ? "text-green-700" : "text-orange-700"}`}
                >
                  {porcentaje === null ? "—" : `${porcentaje}%`}
                </strong>
              </span>

              <Vaso
                porcentaje={porcentaje}
                listo={listo}
                activo={activo}
                ritmo={enCurso ? ritmo : null}
                demora={indice * 0.08}
              />

              {/* Sucursal y montos */}
              <span
                className={`mt-1 w-full truncate text-center text-xs leading-tight font-bold ${activo ? "text-orange-700" : "text-gray-700"}`}
              >
                {sucursal.nombre}
              </span>
              <span className="text-center text-[11px] leading-tight text-gray-500">
                {formatearCorto(sucursal.ventas)}
                <br />
                de {formatearCorto(sucursal.meta)}
              </span>
            </button>
          );
        })}
      </div>

      {leyendaRitmo}

      {/* Detalle de la sucursal elegida */}
      <div
        key={elegida.sucursalId}
        aria-live="polite"
        className="rep-subir flex flex-wrap items-baseline gap-x-5 gap-y-1.5 rounded-xl bg-white px-4 py-3.5 shadow-[inset_0_0_0_1px_#e5e7eb,0_1px_3px_rgba(17,24,39,0.06)]"
      >
        <strong className="text-base text-orange-700">{elegida.nombre}</strong>
        <span className="text-sm text-gray-700">
          Vendió <strong>{formatearDinero(elegida.ventas)}</strong> · Meta{" "}
          {formatearDinero(elegida.meta)}
        </span>
        <span className={`text-sm font-bold ${vaBien(elegida) ? "text-green-700" : "text-amber-700"}`}>
          {estado}
        </span>
        {elegida.pedidos > 0 && (
          <span className="text-[13px] text-gray-500">
            Ticket promedio {formatearDinero(elegida.ventas / elegida.pedidos)}
          </span>
        )}
      </div>
    </div>
  );
}