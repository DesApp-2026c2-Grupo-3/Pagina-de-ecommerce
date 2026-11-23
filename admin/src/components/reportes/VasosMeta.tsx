import { useEffect, useState, type CSSProperties } from "react";
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
   Cuando un vaso llega a la meta salta confeti (de todos los
   vasos llenos a la vez). Con la barrita de prueba se llena a
   mano el vaso elegido, para la demostración.
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

/* ---------- Confeti que salta desde la boca del vaso ---------- */

const COLORES_CONFETI = ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#ec4899", "#ea580c"];

/* Posiciones "pseudoaleatorias" pero fijas: se calculan una sola vez */
const PAPELITOS = Array.from({ length: 30 }, (_, i) => ({
  dx: ((i * 47) % 200) - 100,           // hacia los costados, entre -100 y 99 px
  alto: -(70 + ((i * 23) % 90)),        // cuánto sube, entre 70 y 159 px
  caida: 150 + ((i * 31) % 130),        // dónde termina, entre 150 y 279 px
  giro: (i % 2 ? 1 : -1) * (180 + ((i * 53) % 360)),
  color: COLORES_CONFETI[i % COLORES_CONFETI.length],
  ancho: 6 + (i % 3) * 2,
  retraso: (i % 7) * 0.03,
  redondo: i % 5 === 0,
}));

const DURACION_CONFETI_MS = 2200;

function Confeti() {
  return (
    <span aria-hidden="true" className="rep-confeti">
      {PAPELITOS.map((papelito, i) => (
        <span
          key={i}
          className="rep-papelito"
          style={
            {
              width: papelito.ancho,
              height: papelito.redondo ? papelito.ancho : papelito.ancho * 1.6,
              borderRadius: papelito.redondo ? "50%" : 2,
              backgroundColor: papelito.color,
              animationDelay: `${papelito.retraso}s`,
              "--dx": `${papelito.dx}px`,
              "--alto": `${papelito.alto}px`,
              "--caida": `${papelito.caida}px`,
              "--giro": `${papelito.giro}deg`,
            } as CSSProperties
          }
        />
      ))}
    </span>
  );
}

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
  rapido?: boolean; // en la demostración el líquido sigue a la barra sin demora
  festejo?: number; // cambia cada vez que hay que tirar confeti (0 = nada)
};

function Vaso({
  porcentaje,
  listo,
  activo,
  grande = false,
  ritmo,
  demora,
  rapido = false,
  festejo = 0,
}: VasoProps) {
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
          style={{
            height: `${nivel}%`,
            transitionDelay: rapido ? "0s" : `${demora}s`,
            ...(rapido ? { transitionDuration: "0.25s" } : {}),
          }}
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

      {festejo > 0 && <Confeti key={festejo} />}
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
  /* Demostración: null = datos reales; un número = porcentaje elegido con la barra */
  const [demo, setDemo] = useState<number | null>(null);
  /* Confeti: id del festejo (cambia para reiniciarlo) y qué vasos lo tiran */
  const [festejo, setFestejo] = useState<{ id: number; sucursales: number[] } | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => setListo(true), 80);
    return () => window.clearTimeout(id);
  }, []);

  const enCurso = datos.diaActual !== null;
  const ritmo = enCurso ? (datos.diaActual ?? 0) / datos.diasDelMes : 1;
  const mes = nombreDelMes(datos.mes);
  const unaSola = datos.sucursales.length === 1;

  // ¿Va bien? En un mes cerrado: superó la meta. En curso: va por arriba del ritmo.
  const vaBienCon = (porcentaje: number | null) => porcentaje !== null && porcentaje / 100 >= ritmo;
  const vaBien = (sucursal: VentaSucursal) => vaBienCon(porcentajeDe(sucursal));

  const cumplen = datos.sucursales.filter(vaBien).length;

  const elegida =
    datos.sucursales.find((sucursal) => sucursal.sucursalId === elegidoId) ??
    datos.sucursales[0];
  const diferencia = elegida.ventas - elegida.meta;
  const diasRestantes = datos.diasDelMes - (datos.diaActual ?? datos.diasDelMes);
  /* Lo que muestra el vaso: en la demostración manda la barra (solo en la elegida) */
  const porcentajeMostrado = (sucursal: VentaSucursal) =>
    demo !== null && sucursal.sucursalId === elegida.sucursalId ? demo : porcentajeDe(sucursal);
  const mostradoElegida = porcentajeMostrado(elegida);

  /* Los vasos que están llenos (100% o más), como texto para usarlo de dependencia */
  const llenos = datos.sucursales
    .filter((sucursal) => (porcentajeMostrado(sucursal) ?? 0) >= 100)
    .map((sucursal) => sucursal.sucursalId)
    .join(",");

  /* La barrita cruzó el 100%: pasó de no llenar a llenar el vaso elegido */
  const demoLlena = demo !== null && demo >= 100;

  /* Confeti de todos los vasos llenos: al cargar (cuando termina de subir
     la gaseosa) y cada vez que la barrita de prueba llega al 100% */
  useEffect(() => {
    if (!listo || llenos === "" || (demo !== null && !demoLlena)) return;

    const espera = demo !== null ? 150 : 1500;
    const sucursales = llenos.split(",").map(Number);
    const empezar = window.setTimeout(() => setFestejo({ id: Date.now(), sucursales }), espera);
    const terminar = window.setTimeout(() => setFestejo(null), espera + DURACION_CONFETI_MS);
    return () => {
      window.clearTimeout(empezar);
      window.clearTimeout(terminar);
    };
    // Solo se dispara al cargar y cuando la barrita cruza el 100%, no en cada movimiento
  }, [listo, demoLlena]);

  const festejoDe = (sucursal: VentaSucursal) =>
    festejo?.sucursales.includes(sucursal.sucursalId) ? festejo.id : 0;

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

  /* Barrita de prueba: chica, llena a mano el vaso elegido */
  const barraDemo = (
    <div className="flex items-center gap-2 self-end text-xs text-gray-600">
      <label htmlFor="demo-vaso" className="shrink-0">
        Prueba
      </label>
      <input
        id="demo-vaso"
        type="range"
        min={0}
        max={120}
        step={1}
        value={demo ?? Math.min(120, porcentajeDe(elegida) ?? 0)}
        onChange={(evento) => setDemo(Number(evento.target.value))}
        aria-label={`Llenar a mano el vaso de ${elegida.nombre}`}
        className="h-1.5 w-28 cursor-pointer accent-orange-600 sm:w-36"
      />
      {demo !== null && (
        <button
          type="button"
          onClick={() => setDemo(null)}
          className="rounded-full px-1.5 font-bold text-orange-700 hover:bg-orange-50"
          aria-label="Volver a los datos reales"
          title="Volver a los datos reales"
        >
          ↺
        </button>
      )}
    </div>
  );

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
            {mostradoElegida !== null && mostradoElegida >= 100 && (
              <span className="rep-corona absolute -top-1 left-1/2 -ml-[11px]">
                <Corona />
              </span>
            )}
            <Vaso
              porcentaje={mostradoElegida}
              listo={listo}
              activo
              grande
              ritmo={enCurso ? ritmo : null}
              demora={0}
              rapido={demo !== null}
              festejo={festejoDe(elegida)}
            />
          </span>

          <div aria-live="polite" className="flex w-full max-w-[340px] flex-col gap-2.5">
            <p className="text-sm text-gray-600">
              <strong
                className={`block text-[40px] leading-none ${vaBienCon(mostradoElegida) ? "text-green-700" : "text-orange-700"}`}
              >
                {mostradoElegida === null ? "—" : `${mostradoElegida}%`}
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

        {barraDemo}
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
          const porcentaje = porcentajeMostrado(sucursal);
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
                  className={`text-base ${vaBienCon(porcentaje) ? "text-green-700" : "text-orange-700"}`}
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
                rapido={activo && demo !== null}
                festejo={festejoDe(sucursal)}
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

      {barraDemo}
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