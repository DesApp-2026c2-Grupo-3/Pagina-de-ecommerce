import { useEffect, useState } from "react";
import type { ImpactoPromociones } from "../../types/reporte.types";

/* =========================================================
   LA BALANZA
   Compara el ticket promedio de los pedidos con promo contra
   los que no usaron ninguna. Las bolsitas caen en cada platillo
   (en proporción al ticket) y la balanza se inclina hacia el
   lado que pesa más. Debajo, tres datos para leer el impacto.
   ========================================================= */

type Props = {
  datos: ImpactoPromociones;
};

const MAXIMO_BOLSAS = 10;
const INCLINACION_MAXIMA = 14; // grados

const formatearDinero = (valor: number) =>
  valor.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });

/* "$9,71 M" o "$850 mil" */
function formatearCorto(valor: number) {
  if (valor >= 1_000_000) {
    return `$${(valor / 1_000_000).toFixed(2).replace(".", ",")} M`;
  }
  if (valor >= 1000) {
    return `$${Math.round(valor / 1000).toLocaleString("es-AR")} mil`;
  }
  return formatearDinero(valor);
}

function Bolsa({ conPromo }: { conPromo: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true">
      <path
        d="M5 9h14l-1 12H6z"
        fill={conPromo ? "#f97316" : "#9ca3af"}
        stroke={conPromo ? "#c2410c" : "#6b7280"}
        strokeWidth="1"
      />
      <path
        d="M9 9V7a3 3 0 0 1 6 0v2"
        fill="none"
        stroke={conPromo ? "#c2410c" : "#6b7280"}
        strokeWidth="1.6"
      />
    </svg>
  );
}

function Platillo({
  lado,
  titulo,
  ticket,
  bolsas,
  conPromo,
  contragiro,
}: {
  lado: "izquierda" | "derecha";
  titulo: string;
  ticket: number | null;
  bolsas: number;
  conPromo: boolean;
  contragiro: number;
}) {
  return (
    <div
      className={`rep-platillo absolute top-1 w-[88px] sm:w-[120px] ${
        lado === "izquierda" ? "-left-11 sm:-left-10" : "-right-11 sm:-right-10"
      }`}
      style={{ transform: `rotate(${contragiro}deg)` }}
    >
      {/* Cuerdas */}
      <svg aria-hidden="true" viewBox="0 0 100 70" className="mx-auto block h-[60px] w-[76px] sm:h-[70px] sm:w-[100px]">
        <path d="M50 0 L6 70 M50 0 L94 70" stroke="#9ca3af" strokeWidth="2" />
      </svg>

      {/* Bolsitas sobre el platillo */}
      <div className="relative -mt-[26px] flex min-h-[22px] flex-wrap-reverse content-start justify-center gap-0.5 px-2 pb-1">
        {Array.from({ length: bolsas }, (_, indice) => (
          <span
            key={indice}
            className="rep-bolsa-plato"
            style={{ animationDelay: `${0.2 + indice * 0.08}s` }}
          >
            <Bolsa conPromo={conPromo} />
          </span>
        ))}
      </div>

      {/* Plato */}
      <span
        aria-hidden="true"
        className={`block h-3 rounded-b-[60px] shadow-[0_4px_8px_rgba(0,0,0,0.15)] ${
          conPromo
            ? "bg-[linear-gradient(180deg,#f59e0b,#d97706)]"
            : "bg-[linear-gradient(180deg,#9ca3af,#6b7280)]"
        }`}
      />

      {/* Etiqueta */}
      <span className="mt-2 block text-center leading-tight">
        <span className={`block text-xs font-bold ${conPromo ? "text-orange-700" : "text-gray-600"}`}>
          {titulo}
        </span>
        <strong className="text-base text-gray-900 sm:text-lg">
          {ticket === null ? "—" : formatearDinero(ticket)}
        </strong>
      </span>
    </div>
  );
}

export default function BalanzaPromo({ datos }: Props) {
  /* La balanza arranca derecha y se inclina al aparecer */
  const [listo, setListo] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setListo(true), 120);
    return () => window.clearTimeout(id);
  }, []);

  const conPromo = datos.ticketConPromo ?? 0;
  const sinPromo = datos.ticketSinPromo ?? 0;
  const mayor = Math.max(conPromo, sinPromo, 1);
  const hayComparacion = datos.ticketConPromo !== null && datos.ticketSinPromo !== null;

  // El lado "con promo" está a la izquierda: si pesa más, la cruz gira para ese lado (ángulo negativo)
  const inclinacion =
    listo && hayComparacion
      ? -Math.max(
          -INCLINACION_MAXIMA,
          Math.min(INCLINACION_MAXIMA, ((conPromo - sinPromo) / mayor) * 60),
        )
      : 0;

  const bolsasDe = (ticket: number) =>
    listo && ticket > 0 ? Math.max(1, Math.round((ticket / mayor) * MAXIMO_BOLSAS)) : 0;

  const diferencia = hayComparacion && sinPromo > 0 ? Math.round((conPromo / sinPromo - 1) * 100) : null;

  const totalPedidos = datos.pedidosConPromo + datos.pedidosSinPromo;
  const porcentajeConPromo =
    totalPedidos > 0 ? Math.round((datos.pedidosConPromo / totalPedidos) * 100) : 0;

  const desde = datos.desde
    ? new Date(datos.desde).toLocaleDateString("es-AR", { day: "numeric", month: "numeric", year: "numeric" })
    : null;

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      {/* La balanza */}
      <div className="relative h-[270px] overflow-hidden rounded-2xl bg-[linear-gradient(180deg,#ffffff,#fff7ed)] shadow-[inset_0_0_0_1px_#fed7aa] sm:h-[290px]">
        <div className="absolute bottom-5 left-1/2 w-0">
          {/* Base y columna */}
          <span aria-hidden="true" className="absolute bottom-0 -left-[60px] h-4 w-[120px] rounded-[8px_8px_4px_4px] bg-gray-500 shadow-[inset_0_3px_0_#9ca3af]" />
          <span aria-hidden="true" className="absolute bottom-3.5 -left-[7px] h-[170px] w-3.5 rounded-md bg-[linear-gradient(90deg,#9ca3af,#d1d5db_50%,#9ca3af)] sm:h-[190px]" />
          <span aria-hidden="true" className="absolute bottom-[176px] -left-3.5 z-[3] h-7 w-7 rounded-full bg-amber-500 shadow-[inset_0_-3px_0_#b45309] sm:bottom-[196px]" />

          {/* La cruz con los dos platillos */}
          <div
            className="rep-cruz absolute bottom-[186px] -left-[100px] z-[2] h-2 w-[200px] rounded bg-gray-600 sm:bottom-[206px] sm:-left-[170px] sm:w-[340px]"
            style={{ transform: `rotate(${inclinacion}deg)` }}
          >
            <Platillo
              lado="izquierda"
              titulo="CON PROMO"
              ticket={datos.ticketConPromo}
              bolsas={bolsasDe(conPromo)}
              conPromo
              contragiro={-inclinacion}
            />
            <Platillo
              lado="derecha"
              titulo="SIN PROMO"
              ticket={datos.ticketSinPromo}
              bolsas={bolsasDe(sinPromo)}
              conPromo={false}
              contragiro={-inclinacion}
            />
          </div>
        </div>
      </div>

      {/* La conclusión */}
      <p aria-live="polite" className="text-center text-base text-gray-700">
        {diferencia === null ? (
          "Todavía no hay pedidos de los dos tipos para comparar."
        ) : diferencia >= 0 ? (
          <>
            Los pedidos con promo gastan{" "}
            <strong className="text-xl text-green-700">{diferencia}%</strong> más en promedio.
          </>
        ) : (
          <>
            Los pedidos con promo gastan{" "}
            <strong className="text-xl text-amber-700">{Math.abs(diferencia)}%</strong> menos en
            promedio.
          </>
        )}
      </p>

      {/* Tres datos para leer el impacto */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3">
        <div className="rounded-xl bg-white px-4 py-3.5 shadow-[inset_0_0_0_1px_#e5e7eb,0_1px_3px_rgba(17,24,39,0.06)]">
          <strong className="block text-[26px] text-gray-900">{porcentajeConPromo}%</strong>
          <span className="text-[13px] text-gray-600">
            de los pedidos usó al menos una promo ({datos.pedidosConPromo.toLocaleString("es-AR")} de{" "}
            {totalPedidos.toLocaleString("es-AR")})
          </span>
        </div>
        <div className="rounded-xl bg-white px-4 py-3.5 shadow-[inset_0_0_0_1px_#e5e7eb,0_1px_3px_rgba(17,24,39,0.06)]">
          <strong className="block text-[26px] text-gray-900">{formatearCorto(datos.ventasConPromo)}</strong>
          <span className="text-[13px] text-gray-600">facturados en pedidos con promo</span>
        </div>
        <div className="rounded-xl bg-white px-4 py-3.5 shadow-[inset_0_0_0_1px_#e5e7eb,0_1px_3px_rgba(17,24,39,0.06)]">
          <strong className="block text-[26px] text-amber-700">{formatearCorto(datos.ahorroTotal)}</strong>
          <span className="text-[13px] text-gray-600">
            descontados a los clientes (lo que costaron las promos)
          </span>
        </div>
      </div>

      {desde && (
        <p className="text-xs text-gray-500">
          Se compara desde el {desde}, cuando se empezó a guardar qué promo usó cada pedido.
        </p>
      )}
    </div>
  );
}