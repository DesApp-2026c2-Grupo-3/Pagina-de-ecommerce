import { useState } from "react";
import type { CSSProperties } from "react";
import type { ClienteMasPedidos, PeriodoReporte } from "../../types/reporte.types";

/* =========================================================
   LA TARJETA DE SELLOS
   Cada cliente tiene una tarjeta de fidelidad de 10 casilleros.
   Los sellos (hamburguesas) se reparten en proporción: la tarjeta
   del primero queda llena y lleva el sello dorado.
   Al tocar un cliente se imprime su ficha al costado.
   ========================================================= */

type Props = {
  clientes: ClienteMasPedidos[];
  periodo: PeriodoReporte;
};

const CASILLEROS = 10;
const LIMITE = 6;
const DIA_EN_MS = 24 * 60 * 60 * 1000;

/* El sello dorado del primero, según el período elegido */
function selloDorado(periodo: PeriodoReporte): [string, string] {
  if (periodo === 7) return ["CLIENTE", "DE LA SEMANA"];
  if (periodo === 30) return ["CLIENTE", "DEL MES"];
  if (periodo === 365) return ["CLIENTE", "DEL AÑO"];
  return ["CLIENTE", "DE ORO"];
}

const formatearNumero = (valor: number) => valor.toLocaleString("es-AR");

const formatearDinero = (valor: number) =>
  valor.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });

const nombreCompleto = (cliente: ClienteMasPedidos) =>
  [cliente.nombre, cliente.apellido].filter(Boolean).join(" ");

function haceCuanto(fecha: string, ahora: number) {
  const dias = Math.floor((ahora - new Date(fecha).getTime()) / DIA_EN_MS);
  if (dias <= 0) return "hoy";
  if (dias === 1) return "ayer";
  return `hace ${dias} días`;
}

function SelloHamburguesa() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#fff7ed" stroke="#ea580c" strokeWidth="1.6" />
      <path d="M6 11a6 4.5 0 0 1 12 0z" fill="#f59e0b" />
      <rect x="5.5" y="11.6" width="13" height="2" rx="1" fill="#7c2d12" />
      <path d="M6 15h12a1 1 0 0 1 0 1.4c-1 1.6-11 1.6-12 0a1 1 0 0 1 0-1.4z" fill="#f59e0b" />
    </svg>
  );
}

function Corona() {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} role="img" aria-label="Primer puesto">
      <path
        d="M3 18l-1-11 6 4 4-7 4 7 6-4-1 11z"
        fill="#f59e0b"
        stroke="#b45309"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <rect x="3" y="18.5" width="18" height="2.6" rx="1" fill="#d97706" />
    </svg>
  );
}

/* Una línea "concepto ........ valor" */
function Renglon({ concepto, valor }: { concepto: string; valor: string }) {
  return (
    <div className="flex items-baseline gap-2 text-[13px]">
      <span className="shrink-0">{concepto}</span>
      <span className="flex-1 border-b border-dotted border-amber-300" />
      <strong className="text-right text-gray-900">{valor}</strong>
    </div>
  );
}

export default function TarjetaSellos({ clientes, periodo }: Props) {
  const [ahora] = useState(() => Date.now());
  const [elegidoId, setElegidoId] = useState<number | null>(null);

  const ranking = clientes.slice(0, LIMITE);
  const maximo = Math.max(1, ...ranking.map((cliente) => cliente.cantidadPedidos));

  /* Cuántos pedidos vale cada sello, para que el primero llene la tarjeta */
  const porSello = Math.max(1, Math.ceil(maximo / CASILLEROS));

  const indiceElegido = Math.max(
    0,
    ranking.findIndex((cliente) => cliente.usuarioId === elegidoId),
  );
  const elegido = ranking[indiceElegido];
  const [selloArriba, selloAbajo] = selloDorado(periodo);

  return (
    <div className="flex flex-wrap items-start gap-6 p-4 sm:p-6">
      <div className="flex min-w-0 flex-[999_1_460px] flex-col gap-2">
        <p className="text-xs text-gray-500">
          {porSello === 1
            ? "Cada sello es 1 pedido."
            : `Cada sello son ${porSello} pedidos.`}
        </p>

        {ranking.map((cliente, indice) => {
          const lider = indice === 0;
          const activo = indice === indiceElegido;
          const sellos =
            cliente.cantidadPedidos > 0
              ? Math.max(1, Math.min(CASILLEROS, Math.round(cliente.cantidadPedidos / porSello)))
              : 0;

          const estiloFila = activo
            ? "bg-orange-50 shadow-[inset_0_0_0_2px_#fdba74,0_4px_12px_rgba(234,88,12,0.12)]"
            : lider
              ? "bg-amber-50 shadow-[inset_0_0_0_1px_#fcd34d]"
              : "bg-white shadow-[inset_0_0_0_1px_#e5e7eb]";

          return (
            <button
              key={cliente.usuarioId}
              type="button"
              aria-pressed={activo}
              aria-label={`${nombreCompleto(cliente)}: ${formatearNumero(cliente.cantidadPedidos)} pedidos, puesto ${indice + 1}`}
              onClick={() => setElegidoId(cliente.usuarioId)}
              className={`rep-fila-cliente rep-subir grid w-full grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2.5 rounded-2xl px-3 py-3 text-left sm:grid-cols-[28px_minmax(120px,1fr)_auto_90px] sm:px-3.5 ${estiloFila}`}
              style={{ animationDelay: `${indice * 0.05}s` }}
            >
              {/* Puesto */}
              <span className="flex justify-center">
                {lider ? (
                  <span className="rep-corona">
                    <Corona />
                  </span>
                ) : (
                  <span className="text-sm font-bold text-orange-700">{indice + 1}</span>
                )}
              </span>

              {/* Cliente */}
              <span className="min-w-0">
                <strong className="block truncate text-[15px] text-gray-900">
                  {nombreCompleto(cliente)}
                </strong>
                <span className="block truncate text-xs text-gray-500">{cliente.email}</span>
              </span>

              {/* Tarjeta de sellos: en celular baja a una fila propia, a todo el ancho */}
              <span className="relative order-last col-span-full grid grid-cols-10 gap-1 rounded-[10px] border-[1.5px] border-dashed border-orange-300 bg-amber-50 p-1.5 sm:order-none sm:col-span-1 sm:flex sm:gap-[5px] sm:px-2 sm:py-[7px]">
                {Array.from({ length: CASILLEROS }, (_, casillero) => (
                  <span
                    key={casillero}
                    className="flex aspect-square items-center justify-center rounded-full border-[1.5px] border-dashed border-amber-300 sm:h-[22px] sm:w-[22px]"
                  >
                    {casillero < sellos && (
                      <span
                        className="rep-sello-cliente h-full w-full"
                        style={
                          {
                            animationDelay: `${0.15 + indice * 0.12 + casillero * 0.07}s`,
                            "--giro": `${((casillero * 37 + indice * 11) % 30) - 15}deg`,
                          } as CSSProperties
                        }
                      >
                        <SelloHamburguesa />
                      </span>
                    )}
                  </span>
                ))}

                {lider && (
                  <span
                    className="rep-sello-oro absolute -top-4 -right-3 flex h-[50px] w-[50px] flex-col items-center justify-center rounded-full border-2 border-amber-700 bg-[radial-gradient(circle_at_35%_30%,#fde68a,#f59e0b_70%)] text-center text-[8px] leading-[1.05] font-black text-amber-900 shadow-[0_3px_8px_rgba(180,83,9,0.35)]"
                    style={{ animationDelay: "1s" }}
                  >
                    <span>{selloArriba}</span>
                    <span>{selloAbajo}</span>
                  </span>
                )}
              </span>

              {/* Pedidos */}
              <strong className="text-right text-sm whitespace-nowrap text-orange-700">
                {formatearNumero(cliente.cantidadPedidos)} pedidos
              </strong>
            </button>
          );
        })}
      </div>

      {/* Ficha del cliente */}
      <aside
        aria-label="Ficha del cliente"
        aria-live="polite"
        className="min-w-0 flex-[1_1_260px] py-2.5"
      >
        <div className="rep-ticket border-x border-amber-300 px-5 py-6 font-mono text-gray-700 shadow-[0_2px_4px_rgba(146,64,14,0.12),0_14px_32px_rgba(146,64,14,0.18)]">
          <div key={`${elegido.usuarioId}-${periodo}`} className="rep-imprimir flex flex-col gap-2.5">
            <div className="text-center">
              <p className="text-xs font-bold tracking-[0.2em] text-amber-800">BURGERFAST</p>
              <p className="text-[11px] tracking-[0.12em] text-amber-800">FICHA DEL CLIENTE</p>
            </div>

            <div className="border-t-2 border-dashed border-amber-300" />

            <div>
              <p className="font-sans text-xl font-extrabold break-words text-gray-900">
                {nombreCompleto(elegido)}
              </p>
              <p className="text-[11px] text-gray-500">
                Cliente desde{" "}
                {new Date(elegido.clienteDesde).toLocaleDateString("es-AR", {
                  month: "long",
                  year: "numeric",
                })}{" "}
                · Puesto {indiceElegido + 1}
              </p>
            </div>

            <Renglon concepto="Pedidos" valor={formatearNumero(elegido.cantidadPedidos)} />
            <Renglon concepto="Gasto total" valor={formatearDinero(elegido.totalGastado)} />
            <Renglon
              concepto="Ticket promedio"
              valor={formatearDinero(elegido.totalGastado / Math.max(1, elegido.cantidadPedidos))}
            />
            <Renglon concepto="Último pedido" valor={haceCuanto(elegido.ultimoPedido, ahora)} />
            <Renglon concepto="Pide en" valor={elegido.sucursalFavorita ?? "—"} />

            <div className="border-t-2 border-dashed border-amber-300" />

            <p className="text-xs">
              Lo que más pide:{" "}
              <strong className="text-gray-900">{elegido.productoFavorito ?? "—"}</strong>
            </p>

            <div
              aria-hidden="true"
              className="h-8 bg-[repeating-linear-gradient(90deg,#1f2937_0_2px,transparent_2px_4px,#1f2937_4px_7px,transparent_7px_9px,#1f2937_9px_10px,transparent_10px_13px)]"
            />
          </div>
        </div>
      </aside>
    </div>
  );
}