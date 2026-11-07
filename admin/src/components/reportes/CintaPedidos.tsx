import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type {
  PedidoPorEstado,
  TiempoPromedioEntrega,
} from "../../types/reporte.types";

/* =========================================================
   LA CINTA DE PEDIDOS
   Estaciones por estado sobre una cinta transportadora.
   De cada 10 bolsitas, las canceladas caen al tacho y el resto
   se entrega (en la proporción real de los datos).
   Al costado, un cronómetro con el tiempo promedio de entrega.
   En celular la cinta se pone vertical.
   ========================================================= */

type Props = {
  pedidos: PedidoPorEstado[];
  tiempo: TiempoPromedioEntrega | null;
};

const ESTACIONES = [
  {
    estado: "pendiente",
    nombre: "Pendiente",
    detalle: "esperan que la sucursal los confirme.",
  },
  {
    estado: "en proceso",
    nombre: "En proceso",
    detalle: "se están preparando en la cocina.",
  },
  {
    estado: "en camino",
    nombre: "En camino",
    detalle: "ya salieron con el repartidor.",
  },
  {
    estado: "entregado",
    nombre: "Entregado",
    detalle: "llegaron a destino.",
  },
];

const BOLSAS_EN_LA_CINTA = 10;
const MINUTOS_MAXIMOS = 60;

const formatearNumero = (valor: number) => valor.toLocaleString("es-AR");

const normalizar = (estado: string) =>
  estado.toLocaleLowerCase("es-AR").replace(/[_-]/g, " ").trim();

function formatearMinutos(minutos: number) {
  if (minutos >= 60) {
    return `${Math.floor(minutos / 60)} h ${Math.round(minutos % 60)} min`;
  }
  return `${minutos.toLocaleString("es-AR", { maximumFractionDigits: 1 })} min`;
}

/* Cuántas bolsitas de cada 10 van al tacho. Si hubo al menos una
   cancelación, cae por lo menos una para que se note. */
function calcularCanceladas(entregados: number, cancelados: number) {
  const terminados = entregados + cancelados;
  if (terminados === 0 || cancelados === 0) return 0;
  const proporcion = Math.round((cancelados / terminados) * BOLSAS_EN_LA_CINTA);
  return Math.min(BOLSAS_EN_LA_CINTA, Math.max(1, proporcion));
}

/* Reparte las canceladas a lo largo de la cinta, no todas juntas */
function esCancelada(indice: number, canceladas: number) {
  return (indice * canceladas) % BOLSAS_EN_LA_CINTA < canceladas;
}

function Bolsa({ cancelada }: { cancelada: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width={26} height={26} aria-hidden="true">
      <path
        d="M5 9h14l-1 12H6z"
        fill={cancelada ? "#9ca3af" : "#f97316"}
        stroke={cancelada ? "#6b7280" : "#c2410c"}
        strokeWidth="1"
      />
      <path
        d="M9 9V7a3 3 0 0 1 6 0v2"
        fill="none"
        stroke={cancelada ? "#6b7280" : "#c2410c"}
        strokeWidth="1.6"
      />
      {cancelada ? (
        <path
          d="M9.5 12.5l5 5M14.5 12.5l-5 5"
          stroke="#dc2626"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ) : (
        <circle cx="12" cy="14.5" r="2" fill="#fde68a" />
      )}
    </svg>
  );
}

function Tilde({ tamanio }: { tamanio: number }) {
  return (
    <svg viewBox="0 0 24 24" width={tamanio} height={tamanio} aria-hidden="true">
      <path
        d="M5 12.5l4.5 4.5L19 7.5"
        fill="none"
        stroke="#ffffff"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Cronometro({ tiempo }: { tiempo: TiempoPromedioEntrega | null }) {
  /* La aguja arranca en 0 y gira hasta su valor al aparecer */
  const [listo, setListo] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setListo(true), 60);
    return () => window.clearTimeout(id);
  }, []);

  const minutos = tiempo?.promedioMinutos ?? null;

  if (minutos === null) {
    return (
      <p className="py-10 text-center text-sm font-semibold text-gray-600">
        Todavía no hay entregas para calcular el promedio.
      </p>
    );
  }

  const angulo = listo
    ? -90 + (Math.min(minutos, MINUTOS_MAXIMOS) / MINUTOS_MAXIMOS) * 180
    : -90;

  const estado =
    minutos <= 30
      ? { texto: "A tiempo", clase: "bg-green-50 text-green-700 ring-green-200" }
      : minutos <= 45
        ? { texto: "A tiempo, pero cerca del límite", clase: "bg-yellow-50 text-yellow-700 ring-yellow-200" }
        : { texto: "Demorado", clase: "bg-red-50 text-red-700 ring-red-200" };

  return (
    <>
      <svg
        viewBox="0 0 200 120"
        width={230}
        height={138}
        role="img"
        aria-label={`Tiempo promedio de entrega: ${formatearMinutos(minutos)}`}
        className="max-w-full"
      >
        <path d="M20 100 A80 80 0 0 1 100 20" fill="none" stroke="#bbf7d0" strokeWidth="16" />
        <path d="M100 20 A80 80 0 0 1 156.6 43.4" fill="none" stroke="#fde68a" strokeWidth="16" />
        <path d="M156.6 43.4 A80 80 0 0 1 180 100" fill="none" stroke="#fecaca" strokeWidth="16" />
        <text x="16" y="116" fontSize="10" fill="#6b7280">0</text>
        <text x="94" y="12" fontSize="10" fill="#6b7280">30</text>
        <text x="172" y="116" fontSize="10" fill="#6b7280">60</text>
        <g className="rep-aguja" style={{ transform: `rotate(${angulo}deg)` }}>
          <path d="M100 100 L100 30" stroke="#1f2937" strokeWidth="4" strokeLinecap="round" />
        </g>
        <circle cx="100" cy="100" r="8" fill="#1f2937" />
      </svg>

      <strong className="text-4xl leading-none text-gray-900">
        {formatearMinutos(minutos)}
      </strong>
      <span className={`rounded-full px-2.5 py-0.5 text-sm font-semibold ring-1 ${estado.clase}`}>
        {estado.texto}
      </span>
      <span className="text-center text-xs text-gray-500">
        De punta a punta · {formatearNumero(tiempo?.cantidadPedidos ?? 0)} pedidos
        entregados analizados
      </span>
    </>
  );
}

export default function CintaPedidos({ pedidos, tiempo }: Props) {
  const [seleccionada, setSeleccionada] = useState(0);

  const cantidades = new Map(
    pedidos.map((pedido) => [normalizar(pedido.estado), pedido.cantidad]),
  );
  const cantidadDe = (estado: string) => cantidades.get(estado) ?? 0;

  const total = pedidos.reduce((suma, pedido) => suma + pedido.cantidad, 0);
  const cancelados = cantidadDe("cancelado");
  const canceladas = calcularCanceladas(cantidadDe("entregado"), cancelados);

  const estacion = ESTACIONES[seleccionada];
  const cantidadSeleccionada = cantidadDe(estacion.estado);
  const porcentaje =
    total > 0
      ? ((cantidadSeleccionada / total) * 100).toLocaleString("es-AR", {
          maximumFractionDigits: 1,
        })
      : "0";

  return (
    <div className="flex flex-wrap items-start gap-6 p-4 sm:p-6">
      <div className="flex min-w-0 flex-[999_1_460px] flex-col gap-3.5">
        {/* Escenario: vertical en celular, horizontal desde sm */}
        <div className="relative h-[460px] overflow-hidden rounded-2xl bg-orange-50 shadow-[inset_0_0_0_1px_#fed7aa,inset_0_2px_10px_rgba(194,65,12,0.06)] sm:h-[300px]">
          {/* Cinta */}
          <div
            aria-hidden="true"
            className="absolute top-5 bottom-[110px] left-6 w-[34px] rounded-[17px] bg-gray-700 shadow-[0_4px_0_#1f2937,0_8px_14px_rgba(0,0,0,0.18)] sm:top-[196px] sm:right-[120px] sm:bottom-auto sm:left-5 sm:h-[34px] sm:w-auto"
          >
            <div className="rep-cinta absolute inset-x-1.5 inset-y-3.5 rounded-[10px] sm:inset-x-3.5 sm:inset-y-1.5" />
          </div>

          {/* Boca del tacho (queda detrás de la bolsita que cae) */}
          <span
            aria-hidden="true"
            className="absolute top-[384px] left-[9px] z-[1] h-3.5 w-16 rounded-[50%] bg-gray-600 shadow-[inset_0_3px_4px_rgba(0,0,0,0.45)] sm:top-[228px] sm:right-6 sm:left-auto sm:h-4 sm:w-[76px]"
          />

          {/* Bolsitas */}
          <div
            aria-hidden="true"
            className="absolute top-5 bottom-[110px] left-[30px] z-[3] w-7 [--fin-ok:45px] sm:top-[168px] sm:right-[120px] sm:bottom-auto sm:left-5 sm:h-7 sm:w-auto sm:[--fin-ok:61px]"
          >
            {Array.from({ length: BOLSAS_EN_LA_CINTA }, (_, indice) => {
              const cancelada = esCancelada(indice, canceladas);
              const demora: CSSProperties = { animationDelay: `${-indice}s` };

              return (
                <span
                  key={indice}
                  className={`rep-bolsa ${cancelada ? "rep-bolsa-cancelada" : ""}`}
                  style={demora}
                >
                  <Bolsa cancelada={cancelada} />
                  {!cancelada && (
                    <span
                      className="rep-tilde-entrega absolute -top-2 -right-2 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-green-600 shadow-[0_0_0_2px_#ffffff]"
                      style={demora}
                    >
                      <Tilde tamanio={12} />
                    </span>
                  )}
                </span>
              );
            })}
          </div>

          {/* Estaciones */}
          <div className="absolute top-5 right-4 bottom-[110px] left-[80px] z-[4] flex flex-col justify-between sm:top-3.5 sm:right-[120px] sm:bottom-auto sm:left-5 sm:flex-row">
            {ESTACIONES.map((item, indice) => {
              const activa = indice === seleccionada;
              const esFinal = item.estado === "entregado";
              const cantidad = cantidadDe(item.estado);

              const colores = activa
                ? "bg-orange-500 border-orange-300 text-white"
                : esFinal
                  ? "bg-green-50 border-green-300 text-green-700"
                  : "bg-white border-orange-200 text-gray-800";

              return (
                <button
                  key={item.estado}
                  type="button"
                  aria-pressed={activa}
                  aria-label={`${item.nombre}: ${formatearNumero(cantidad)} pedidos`}
                  onClick={() => setSeleccionada(indice)}
                  className="rep-estacion flex items-center gap-3 text-left sm:w-24 sm:flex-col sm:gap-1.5 sm:text-center"
                >
                  <span className="relative h-16 w-16 shrink-0 sm:h-[78px] sm:w-[78px]">
                    {activa && (
                      <span
                        aria-hidden="true"
                        className="rep-anillo absolute inset-0 rounded-full border-[3px] border-orange-400"
                      />
                    )}
                    <span
                      className={`absolute inset-0 flex flex-col items-center justify-center rounded-full border-[3px] shadow-[0_6px_14px_rgba(0,0,0,0.12)] transition-colors ${colores}`}
                    >
                      <strong className="text-lg leading-none sm:text-[22px]">
                        {formatearNumero(cantidad)}
                      </strong>
                      <span className="text-[10px] font-semibold">pedidos</span>
                    </span>
                  </span>
                  <span className="text-sm font-bold text-gray-800">{item.nombre}</span>
                  <span
                    aria-hidden="true"
                    className="hidden h-[22px] w-0.5 bg-[repeating-linear-gradient(180deg,#fdba74_0_4px,transparent_4px_8px)] sm:block"
                  />
                </button>
              );
            })}
          </div>

          {/* Frente del tacho (tapa a la bolsita que cayó) */}
          <div
            aria-hidden="true"
            className="absolute bottom-3 left-[9px] z-[5] flex h-[58px] w-16 flex-col items-center justify-center bg-[linear-gradient(90deg,#9ca3af,#d1d5db_40%,#9ca3af)] leading-tight [clip-path:polygon(0_0,100%_0,90%_100%,10%_100%)] sm:top-[236px] sm:right-6 sm:bottom-auto sm:left-auto sm:w-[76px]"
          >
            <strong className="text-base text-red-800 sm:text-lg">
              {formatearNumero(cancelados)}
            </strong>
            <span className="text-[9px] font-extrabold text-red-800 sm:text-[10px]">
              cancelados
            </span>
          </div>
        </div>

        {/* Detalle de la estación elegida */}
        <div
          aria-live="polite"
          className="rounded-xl bg-white px-4 py-3.5 shadow-[inset_0_0_0_1px_#e5e7eb,0_1px_3px_rgba(17,24,39,0.06)]"
        >
          <strong className="block text-base text-orange-700">{estacion.nombre}</strong>
          <span className="text-sm text-gray-700">
            {formatearNumero(cantidadSeleccionada)} pedidos ({porcentaje}% del total){" "}
            {estacion.detalle}
          </span>
          <span className="mt-1 block text-xs text-gray-500">
            En la cinta, de cada 10 bolsitas {10 - canceladas} se entregan y{" "}
            {canceladas} {canceladas === 1 ? "cae" : "caen"} al tacho de cancelados.
          </span>
        </div>
      </div>

      {/* Cronómetro */}
      <aside
        aria-label="Tiempo promedio de entrega"
        className="flex min-w-0 flex-[1_1_280px] flex-col items-center gap-2 rounded-2xl bg-white p-5 shadow-[inset_0_0_0_1px_#e5e7eb,0_2px_6px_rgba(17,24,39,0.08),0_14px_28px_rgba(17,24,39,0.08)]"
      >
        <span className="text-xs font-bold tracking-[0.08em] text-gray-500">
          TIEMPO PROMEDIO DE ENTREGA
        </span>
        <Cronometro tiempo={tiempo} />
      </aside>
    </div>
  );
}