import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type {
  CancelacionPorDia,
  PedidoPorEstado,
} from "../../types/reporte.types";

/* =========================================================
   EL TACHO DE CANCELADOS
   Un tacho con bollitos de papel (cada uno representa varios
   pedidos cancelados). Al tocarlo se sacude y vuelven a caer.
   Al costado: medidor con la tasa de cancelación y un cuadrado
   con las últimas dos semanas (de lunes a domingo).
   ========================================================= */

type Props = {
  pedidos: PedidoPorEstado[];          // para el total y los cancelados
  cancelaciones: CancelacionPorDia[];  // últimos 30 días
};

const MAXIMO_BOLLOS = 12;
const TASA_MAXIMA = 6;       // el medidor va de 0% a 6%
const TASA_BUENA = 4;        // hasta acá, verde
const TASA_ATENCION = 5;     // hasta acá, amarillo

const LETRAS = ["L", "M", "M", "J", "V", "S", "D"];
const DIAS_LARGOS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

/* Lugar de cada bollito dentro del tacho (de abajo hacia arriba) */
const POSICIONES = [
  [46, 214], [70, 216], [94, 213], [118, 215],
  [52, 192], [76, 190], [100, 193], [122, 190],
  [60, 168], [84, 166], [108, 169], [86, 144],
];

/* Tonos para el cuadrado de días, de 0 al peor día */
const ROJOS = ["#fef2f2", "#fee2e2", "#fecaca", "#fca5a5", "#f87171", "#dc2626"];

const formatearNumero = (valor: number) => valor.toLocaleString("es-AR");

const formatearPorcentaje = (valor: number) =>
  `${valor.toLocaleString("es-AR", { maximumFractionDigits: 1 })}%`;

const normalizar = (estado: string) =>
  estado.toLocaleLowerCase("es-AR").replace(/[_-]/g, " ").trim();

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

const diaYMes = (fecha: Date) => `${fecha.getDate()}/${fecha.getMonth() + 1}`;

export default function TachoCancelados({ pedidos, cancelaciones }: Props) {
  const [hoy] = useState(() => {
    const fecha = new Date();
    fecha.setHours(0, 0, 0, 0);
    return fecha;
  });

  /* La aguja arranca en 0 y gira hasta su valor */
  const [listo, setListo] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setListo(true), 60);
    return () => window.clearTimeout(id);
  }, []);

  /* Cada vez que se toca el tacho cambia "vuelta": se sacude y caen de nuevo */
  const [vuelta, setVuelta] = useState(0);
  const [diaElegido, setDiaElegido] = useState<number | null>(null);

  /* Totales */
  const total = pedidos.reduce((suma, pedido) => suma + pedido.cantidad, 0);
  const cancelados =
    pedidos.find((pedido) => normalizar(pedido.estado) === "cancelado")?.cantidad ?? 0;
  const tasa = total > 0 ? (cancelados / total) * 100 : 0;

  /* Bollitos: como máximo 12, cada uno vale "porBollo" cancelados */
  const porBollo = Math.max(1, Math.ceil(cancelados / MAXIMO_BOLLOS));
  const cantidadBollos = Math.ceil(cancelados / porBollo);

  /* Medidor */
  const angulo = listo ? -90 + (Math.min(tasa, TASA_MAXIMA) / TASA_MAXIMA) * 180 : -90;
  const veredicto =
    tasa <= TASA_BUENA
      ? { texto: `Por debajo del ${TASA_BUENA}%: está bien`, clase: "text-green-700" }
      : tasa <= TASA_ATENCION
        ? { texto: `Entre ${TASA_BUENA}% y ${TASA_ATENCION}%: hay que mirarlo`, clase: "text-yellow-700" }
        : { texto: `Más del ${TASA_ATENCION}%: está alta`, clase: "text-red-700" };

  /* Las dos últimas semanas, de lunes a domingo */
  const porFecha = new Map(
    cancelaciones.map((item) => [item.fecha.slice(0, 10), item.cantidad]),
  );
  const lunes = sumarDias(hoy, -((hoy.getDay() + 6) % 7) - 7);
  const dias = Array.from({ length: 14 }, (_, indice) => {
    const fecha = sumarDias(lunes, indice);
    return {
      fecha,
      cantidad: porFecha.get(claveDe(fecha)) ?? 0,
      futuro: fecha > hoy,
    };
  });
  const peor = Math.max(0, ...dias.map((dia) => dia.cantidad));
  const indicePeor = peor > 0 ? dias.findIndex((dia) => dia.cantidad === peor) : -1;
  const indiceElegido =
    diaElegido ?? (indicePeor >= 0 ? indicePeor : dias.filter((d) => !d.futuro).length - 1);
  const elegido = dias[indiceElegido];

  return (
    <div className="flex flex-wrap items-end gap-7 p-4 sm:p-6">
      {/* El tacho */}
      <div className="flex flex-[1_1_220px] justify-center">
        <button
          type="button"
          onClick={() => setVuelta((anterior) => anterior + 1)}
          aria-label={`${formatearNumero(cancelados)} pedidos cancelados. Tocá para sacudir el tacho.`}
          className="rep-tacho relative h-[270px] w-[190px]"
        >
          <span
            key={vuelta}
            className={`absolute inset-x-0 top-0 h-[250px] ${vuelta > 0 ? "rep-sacudir-tacho" : ""}`}
          >
            {/* Tapa */}
            <span
              aria-hidden="true"
              className="rep-tapa absolute top-[52px] left-[22px] z-[3] h-3.5 w-[146px] rounded-md bg-gray-500 shadow-[0_3px_0_#4b5563]"
            >
              <span className="absolute -top-2 left-[58px] h-[9px] w-[30px] rounded-t bg-gray-500" />
            </span>

            {/* Cuerpo */}
            <span
              aria-hidden="true"
              className="absolute top-[66px] left-[30px] z-[1] h-[176px] w-[130px] bg-gray-300 shadow-[inset_0_0_0_2px_#9ca3af] [clip-path:polygon(0_0,100%_0,90%_100%,10%_100%)]"
            />
            <span
              aria-hidden="true"
              className="absolute top-[66px] left-[30px] z-[2] h-[176px] w-[130px] bg-[repeating-linear-gradient(90deg,transparent_0_22px,rgba(107,114,128,0.25)_22px_25px)] [clip-path:polygon(0_0,100%_0,90%_100%,10%_100%)]"
            />

            {/* Bollitos */}
            {POSICIONES.slice(0, cantidadBollos).map(([x, y], indice) => {
              const tamanio = 22 + (indice % 3) * 2;
              const estilo = {
                left: x,
                top: y,
                width: tamanio,
                height: tamanio,
                animationDelay: `${0.2 + indice * 0.11}s`,
                "--sx": `${((indice * 47) % 140) - 70}px`,
                "--rot": `${(indice * 67) % 360}deg`,
              } as CSSProperties;

              return <span key={indice} aria-hidden="true" className="rep-bollo z-[2]" style={estilo} />;
            })}
          </span>

          <strong className="absolute inset-x-0 bottom-0 z-[4] text-xl font-extrabold text-red-700">
            {formatearNumero(cancelados)} cancelados
          </strong>
        </button>
      </div>

      <div className="flex min-w-0 flex-[999_1_380px] flex-col gap-4">
        {/* Medidor de la tasa */}
        <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-white px-4 py-3.5 shadow-[inset_0_0_0_1px_#e5e7eb,0_2px_6px_rgba(17,24,39,0.06)]">
          <svg
            viewBox="0 0 200 112"
            width={180}
            height={101}
            role="img"
            aria-label={`Tasa de cancelación: ${formatearPorcentaje(tasa)}`}
          >
            <path d="M20 100 A80 80 0 0 1 140 30.7" fill="none" stroke="#bbf7d0" strokeWidth="16" />
            <path d="M140 30.7 A80 80 0 0 1 169.3 60" fill="none" stroke="#fde68a" strokeWidth="16" />
            <path d="M169.3 60 A80 80 0 0 1 180 100" fill="none" stroke="#fecaca" strokeWidth="16" />
            <text x="14" y="112" fontSize="10" fill="#6b7280">0%</text>
            <text x="93" y="12" fontSize="10" fill="#6b7280">3%</text>
            <text x="170" y="112" fontSize="10" fill="#6b7280">6%</text>
            <g className="rep-aguja" style={{ transform: `rotate(${angulo}deg)` }}>
              <path d="M100 100 L100 30" stroke="#1f2937" strokeWidth="4" strokeLinecap="round" />
            </g>
            <circle cx="100" cy="100" r="8" fill="#1f2937" />
          </svg>

          <div className="flex flex-col gap-0.5">
            <strong className="text-3xl leading-none text-gray-900">{formatearPorcentaje(tasa)}</strong>
            <span className="text-sm text-gray-700">de los pedidos se cancelan</span>
            <span className={`text-xs font-semibold ${veredicto.clase}`}>{veredicto.texto}</span>
            {cancelados > 0 && (
              <span className="text-xs text-gray-500">
                Cada bollito de papel {porBollo === 1 ? "es 1 pedido cancelado" : `son ${porBollo} pedidos cancelados`}.
              </span>
            )}
          </div>
        </div>

        {/* Las últimas dos semanas */}
        <div>
          <span className="mb-2 block text-sm font-bold text-gray-700">Últimas dos semanas</span>

          <div className="grid max-w-[360px] grid-cols-7 gap-1.5">
            {LETRAS.map((letra, indice) => (
              <span key={indice} className="text-center text-[11px] font-bold text-gray-500">
                {letra}
              </span>
            ))}

            {dias.map((dia, indice) => {
              if (dia.futuro) {
                return (
                  <span
                    key={indice}
                    aria-hidden="true"
                    className="aspect-square rounded-[10px] border border-dashed border-gray-300"
                  />
                );
              }

              const nivel = peor > 0 ? Math.min(5, Math.round((dia.cantidad / peor) * 5)) : 0;
              const activo = indice === indiceElegido;

              return (
                <button
                  key={indice}
                  type="button"
                  aria-pressed={activo}
                  aria-label={`${diaYMes(dia.fecha)}: ${dia.cantidad} cancelados`}
                  onClick={() => setDiaElegido(indice)}
                  className="rep-dia-canc flex aspect-square flex-col items-center justify-center gap-px rounded-[10px] shadow-[inset_0_0_0_1px_rgba(127,29,29,0.12)] outline-offset-2"
                  style={{
                    backgroundColor: ROJOS[nivel],
                    color: nivel >= 4 ? "#ffffff" : "#7f1d1d",
                    outline: activo ? "3px solid #1f2937" : "none",
                  }}
                >
                  <strong className="text-base leading-none">{dia.cantidad}</strong>
                  <span className="text-[10px] opacity-85">{diaYMes(dia.fecha)}</span>
                </button>
              );
            })}
          </div>

          <p aria-live="polite" className="mt-2.5 text-sm text-gray-700">
            {DIAS_LARGOS[indiceElegido % 7]} {diaYMes(elegido.fecha)}:{" "}
            {elegido.cantidad === 0
              ? "sin cancelaciones."
              : `${elegido.cantidad} ${elegido.cantidad === 1 ? "cancelado" : "cancelados"}.`}
            {indiceElegido === indicePeor && " Fue el peor día de las dos semanas."}
          </p>
        </div>
      </div>
    </div>
  );
}