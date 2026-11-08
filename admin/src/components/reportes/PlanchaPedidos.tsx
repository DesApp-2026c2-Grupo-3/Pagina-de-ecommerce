import { useState } from "react";
import type { ReactNode } from "react";
import type {
  CancelacionPorDia,
  PedidoPorDia,
} from "../../types/reporte.types";

/* =========================================================
   LA PLANCHA
   Calendario de las últimas 5 semanas. Cada día es una baldosa
   que se "calienta" según la cantidad de pedidos.
   Al tocar un día se imprime el ticket "Parte del día".
   Si la tarjeta es angosta (celular) las baldosas se achican
   y muestran solo el número del día: el valor queda en el ticket.
   ========================================================= */

type Props = {
  dias: PedidoPorDia[];
  cancelaciones: CancelacionPorDia[]; // cubre los últimos 30 días
};

type Baldosa = {
  clave: string;        // "2026-10-28"
  fecha: Date;
  pedidos: number;
  futuro: boolean;
};

const SEMANAS = 5;
const DIAS_CON_CANCELACIONES = 30;
const DIAS_CORTOS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const DIAS_LARGOS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

/* De fría a "al rojo vivo" */
const CALOR = [
  { fondo: "#fde68a", texto: "#7c2d12" },
  { fondo: "#fdba74", texto: "#7c2d12" },
  { fondo: "#fb923c", texto: "#7c2d12" },
  { fondo: "#f97316", texto: "#ffffff" },
  { fondo: "#ea580c", texto: "#ffffff" },
  { fondo: "#c2410c", texto: "#ffffff" },
];
const SIN_PEDIDOS = { fondo: "#4b5563", texto: "#d1d5db" };

const formatearNumero = (valor: number) => valor.toLocaleString("es-AR");

function claveDe(fecha: Date) {
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

function sumarDias(fecha: Date, dias: number) {
  const nueva = new Date(fecha);
  nueva.setDate(nueva.getDate() + dias);
  return nueva;
}

/* Lunes = 0 ... Domingo = 6 */
const diaDeLaSemana = (fecha: Date) => (fecha.getDay() + 6) % 7;

const diaYMes = (fecha: Date) => `${fecha.getDate()}/${fecha.getMonth() + 1}`;

function armarBaldosas(dias: PedidoPorDia[], hoy: Date): Baldosa[] {
  const cantidades = new Map(
    dias.map((dia) => [dia.fecha.slice(0, 10), dia.cantidad]),
  );

  /* Arranca el lunes de hace 4 semanas y termina el domingo de esta */
  const inicio = sumarDias(hoy, -diaDeLaSemana(hoy) - (SEMANAS - 1) * 7);

  return Array.from({ length: SEMANAS * 7 }, (_, indice) => {
    const fecha = sumarDias(inicio, indice);
    const clave = claveDe(fecha);
    return {
      clave,
      fecha,
      pedidos: cantidades.get(clave) ?? 0,
      futuro: fecha > hoy,
    };
  });
}

export default function PlanchaPedidos({ dias, cancelaciones }: Props) {
  /* "Hoy" se fija una sola vez al montar la tarjeta */
  const [hoy] = useState(() => {
    const fecha = new Date();
    fecha.setHours(0, 0, 0, 0);
    return fecha;
  });

  const baldosas = armarBaldosas(dias, hoy);
  const pasadas = baldosas.filter((baldosa) => !baldosa.futuro);

  const valores = pasadas.map((baldosa) => baldosa.pedidos);
  const maximo = Math.max(0, ...valores);
  const minimoConPedidos = Math.min(
    ...valores.filter((valor) => valor > 0),
    maximo,
  );
  const promedio =
    pasadas.length > 0
      ? valores.reduce((suma, valor) => suma + valor, 0) / pasadas.length
      : 0;

  const indiceRecord =
    maximo > 0 ? baldosas.findIndex((b) => !b.futuro && b.pedidos === maximo) : -1;

  const [seleccionada, setSeleccionada] = useState<number | null>(null);
  const indiceElegido =
    seleccionada ?? (indiceRecord >= 0 ? indiceRecord : pasadas.length - 1);
  const elegida = baldosas[indiceElegido];

  const colorDe = (pedidos: number) => {
    if (pedidos === 0) return SIN_PEDIDOS;
    const rango = maximo - minimoConPedidos + 1;
    const nivel = Math.floor(((pedidos - minimoConPedidos) / rango) * CALOR.length);
    return CALOR[Math.min(CALOR.length - 1, nivel)];
  };

  /* Cancelados del día elegido (el reporte cubre solo los últimos 30 días) */
  const cancelacionesPorDia = new Map(
    cancelaciones.map((item) => [item.fecha.slice(0, 10), item.cantidad]),
  );
  const limiteCancelaciones = sumarDias(hoy, -(DIAS_CON_CANCELACIONES - 1));
  const conDatoDeCancelaciones = elegida.fecha >= limiteCancelaciones;
  const canceladosElegida = conDatoDeCancelaciones
    ? (cancelacionesPorDia.get(elegida.clave) ?? 0)
    : null;

  const tasa =
    canceladosElegida !== null && elegida.pedidos > 0
      ? `${((canceladosElegida / elegida.pedidos) * 100).toLocaleString("es-AR", {
          maximumFractionDigits: 1,
        })}%`
      : "—";

  const diferencia =
    promedio > 0 ? Math.round((elegida.pedidos / promedio - 1) * 100) : 0;
  const esRecord = indiceElegido === indiceRecord;

  return (
    <div className="flex flex-wrap items-start gap-6 p-4 sm:p-6">
      {/* La plancha: se adapta al ancho de su propia columna */}
      <div className="@container flex min-w-0 flex-[999_1_300px] flex-col gap-3">
        <div className="rounded-2xl bg-gray-800 p-3 shadow-[inset_0_2px_8px_rgba(0,0,0,0.4),0_4px_0_#111827]">
          <div className="grid grid-cols-[54px_repeat(7,minmax(0,1fr))] gap-1.5 @max-md:grid-cols-7 @max-md:gap-1">
            <span className="@max-md:hidden" />
            {DIAS_CORTOS.map((dia) => (
              <span key={dia} className="text-center text-[11px] font-bold text-gray-300">
                {dia}
              </span>
            ))}

            {baldosas.map((baldosa, indice) => {
              const esLunes = indice % 7 === 0;
              const color = colorDe(baldosa.pedidos);
              const caliente = color === CALOR[4] || color === CALOR[5];

              return (
                <FilaOBaldosa key={baldosa.clave} etiquetaSemana={esLunes ? diaYMes(baldosa.fecha) : null}>
                  {baldosa.futuro ? (
                    <span
                      aria-hidden="true"
                      className="h-12 rounded-[9px] border border-dashed border-gray-600 @max-md:h-[38px]"
                    />
                  ) : (
                    <button
                      type="button"
                      aria-pressed={indice === indiceElegido}
                      aria-label={`${DIAS_CORTOS[indice % 7]} ${diaYMes(baldosa.fecha)}: ${formatearNumero(baldosa.pedidos)} pedidos`}
                      onClick={() => setSeleccionada(indice)}
                      className="rep-baldosa flex h-12 flex-col items-center justify-center rounded-[9px] outline-offset-2 @max-md:h-[38px] @max-md:rounded-[7px]"
                      style={{
                        backgroundColor: color.fondo,
                        color: color.texto,
                        outline: indice === indiceElegido ? "3px solid #fbbf24" : "none",
                        animationDelay: `${(Math.floor(indice / 7) + (indice % 7)) * 0.04}s`,
                      }}
                    >
                      {indice === indiceRecord && (
                        <span className="rep-corona absolute -top-3">
                          <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true">
                            <path
                              d="M3 18l-1-11 6 4 4-7 4 7 6-4-1 11z"
                              fill="#f59e0b"
                              stroke="#b45309"
                              strokeWidth="1"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                      )}
                      <span className="text-[10px] opacity-85 @max-md:text-xs @max-md:font-bold @max-md:opacity-100">
                        {baldosa.fecha.getDate()}
                      </span>
                      <strong className="text-sm leading-tight @max-md:hidden">
                        {formatearNumero(baldosa.pedidos)}
                      </strong>
                      {caliente && (
                        <>
                          <span className="rep-vapor left-[30%] @max-md:hidden" />
                          <span className="rep-vapor left-[55%] [animation-delay:0.3s] @max-md:hidden" />
                        </>
                      )}
                    </button>
                  )}
                </FilaOBaldosa>
              );
            })}
          </div>
        </div>

        {/* Referencia de colores */}
        <div className="flex items-center gap-2 text-xs text-gray-600" aria-hidden="true">
          <span>Fría</span>
          {CALOR.map((color) => (
            <span
              key={color.fondo}
              className="h-2.5 w-4 rounded-[3px] @md:w-6"
              style={{ backgroundColor: color.fondo }}
            />
          ))}
          <span>Al rojo vivo</span>
        </div>
      </div>

      {/* Ticket "Parte del día" */}
      <aside
        aria-label="Parte del día"
        aria-live="polite"
        className="min-w-0 flex-[1_1_240px] py-2.5"
      >
        <div className="rep-ticket border-x border-amber-300 px-5 py-6 font-mono text-gray-700 shadow-[0_2px_4px_rgba(146,64,14,0.12),0_14px_32px_rgba(146,64,14,0.18)]">
          <div key={elegida.clave} className="rep-imprimir flex flex-col gap-2.5">
            <div className="text-center">
              <p className="text-xs font-bold tracking-[0.2em] text-amber-800">BURGERFAST</p>
              <p className="text-[11px] tracking-[0.12em] text-amber-800">PARTE DEL DÍA</p>
            </div>

            <div className="border-t-2 border-dashed border-amber-300" />

            <p className="font-sans text-xl font-extrabold text-gray-900">
              {DIAS_LARGOS[diaDeLaSemana(elegida.fecha)]} {diaYMes(elegida.fecha)}
            </p>

            <Renglon concepto="Pedidos" valor={formatearNumero(elegida.pedidos)} />
            <Renglon
              concepto="Cancelados"
              valor={canceladosElegida !== null ? formatearNumero(canceladosElegida) : "—"}
            />
            <Renglon concepto="Tasa de cancelación" valor={tasa} />

            <div className="border-t-2 border-dashed border-amber-300" />

            <p
              className={`text-[13px] font-bold ${diferencia >= 0 ? "text-green-700" : "text-amber-700"}`}
            >
              {diferencia >= 0 ? "+" : ""}
              {diferencia}% {diferencia >= 0 ? "sobre" : "bajo"} el promedio diario (
              {formatearNumero(Math.round(promedio))})
            </p>

            {!conDatoDeCancelaciones && (
              <p className="text-[11px] text-gray-500">
                Las cancelaciones solo están para los últimos 30 días.
              </p>
            )}

            {esRecord && (
              <span className="rep-sello self-start border-2 border-amber-700 px-2 py-0.5 text-xs font-bold tracking-wider text-amber-800">
                DÍA RÉCORD
              </span>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

/* Una línea "concepto ........ valor" */
function Renglon({ concepto, valor }: { concepto: string; valor: string }) {
  return (
    <div className="flex items-baseline gap-2 text-[13px]">
      <span>{concepto}</span>
      <span className="flex-1 border-b border-dotted border-amber-300" />
      <strong className="text-gray-900">{valor}</strong>
    </div>
  );
}

/* Los lunes agregan antes la etiqueta de la semana (se oculta en celular) */
function FilaOBaldosa({
  etiquetaSemana,
  children,
}: {
  etiquetaSemana: string | null;
  children: ReactNode;
}) {
  return (
    <>
      {etiquetaSemana !== null && (
        <span className="self-center text-[11px] text-gray-400 @max-md:hidden">
          {etiquetaSemana}
        </span>
      )}
      {children}
    </>
  );
}