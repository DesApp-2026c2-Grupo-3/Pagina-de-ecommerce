import { useState } from "react";
import type { PeriodoReporte } from "../../types/reporte.types";

/* =========================================================
   BOTONES DE PERÍODO
   "7 días · 30 días · 12 meses · Histórico", con una línea
   abajo que dice qué fechas se están viendo.
   Se usa en el encabezado de las tarjetas que lo necesitan.
   ========================================================= */

type Props = {
  valor: PeriodoReporte;
  onCambiar: (valor: PeriodoReporte) => void;
};

const OPCIONES_PERIODO: { valor: PeriodoReporte; nombre: string }[] = [
  { valor: 7, nombre: "7 días" },
  { valor: 30, nombre: "30 días" },
  { valor: 365, nombre: "12 meses" },
  { valor: null, nombre: "Histórico" },
];

const diaYMes = (fecha: Date) =>
  fecha.toLocaleDateString("es-AR", { day: "numeric", month: "numeric", year: "2-digit" });

export default function BotonesPeriodo({ valor, onCambiar }: Props) {
  /* "Hoy" se fija una vez, para calcular desde qué día se ve */
  const [hoy] = useState(() => new Date());

  let detalle = "Todo el historial";
  if (valor !== null) {
    const desde = new Date(hoy);
    desde.setDate(desde.getDate() - (valor - 1));
    detalle = `Del ${diaYMes(desde)} al ${diaYMes(hoy)}`;
  }

  return (
    <div className="flex flex-col gap-1 sm:items-end">
      <div
        role="group"
        aria-label="Período"
        className="flex gap-1 rounded-xl bg-gray-100 p-1 ring-1 ring-gray-300"
      >
        {OPCIONES_PERIODO.map((opcion) => {
          const activa = opcion.valor === valor;

          return (
            <button
              key={opcion.nombre}
              type="button"
              aria-pressed={activa}
              onClick={() => onCambiar(opcion.valor)}
              className={`min-h-9 flex-1 rounded-lg px-2.5 text-[13px] font-semibold whitespace-nowrap transition sm:flex-none sm:px-3 ${
                activa
                  ? "bg-white text-orange-700 shadow-[0_1px_4px_rgba(17,24,39,0.15)]"
                  : "text-gray-600 hover:text-orange-700"
              }`}
            >
              {opcion.nombre}
            </button>
          );
        })}
      </div>
      <span className="text-xs text-gray-500">{detalle}</span>
    </div>
  );
}