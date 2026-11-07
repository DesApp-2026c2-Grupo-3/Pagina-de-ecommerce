import { useState } from "react";
import type { ProductosDeSucursal } from "../../types/reporte.types";
import { IconoComida } from "./efectos/IconosComida";
import { iconoPorCategoria } from "./efectos/iconoPorCategoria";

/* =========================================================
   LA BANDEJA DE CADA SUCURSAL
   Se elige una sucursal y en la bandeja se "sirven" sus 5
   productos más vendidos: cada renglón apila iconitos del
   producto en proporción y muestra las unidades exactas.
   Al costado, el favorito de cada sucursal para compararlas.
   ========================================================= */

type Props = {
  sucursales: ProductosDeSucursal[];
};

const MAXIMO_ICONOS = 10; // el producto número 1 llena la fila
function Corona({ tamanio = 22 }: { tamanio?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={tamanio} height={tamanio} role="img" aria-label="El más vendido">
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

export default function BandejaSucursal({ sucursales }: Props) {
  const [elegidaId, setElegidaId] = useState<number | null>(null);

  const elegida =
    sucursales.find((sucursal) => sucursal.sucursalId === elegidaId) ?? sucursales[0];
  const productos = elegida.productos;
  const maximo = Math.max(1, ...productos.map((producto) => producto.unidades));

  /* Cuántas unidades vale cada icono, para que el primero llene la fila */
  const porIcono = Math.max(1, Math.ceil(maximo / MAXIMO_ICONOS));

  const variasSucursales = sucursales.length > 1;

  return (
    <div className="flex flex-wrap items-start justify-center gap-6 p-4 sm:p-6">
      {/* Selector: el favorito de cada sucursal (solo si hay varias).      
          En celular queda arriba de la bandeja; en escritorio, al costado. */}
      {variasSucursales && (
        <aside
          aria-label="Elegí una sucursal"
          className="w-full min-w-0 rounded-2xl bg-white p-2 shadow-[inset_0_0_0_1px_#e5e7eb,0_2px_6px_rgba(17,24,39,0.06)] sm:w-60 sm:flex-none"
        >
          <span className="block px-2.5 pt-1.5 pb-2 text-xs font-bold tracking-[0.08em] text-gray-500">
            FAVORITO POR SUCURSAL
          </span>

          <div className="flex flex-col gap-1">
            {sucursales.map((sucursal) => {
              const favorito = sucursal.productos[0];
              const activa = sucursal.sucursalId === elegida.sucursalId;

              return (
                <button
                  key={sucursal.sucursalId}
                  type="button"
                  aria-pressed={activa}
                  onClick={() => setElegidaId(sucursal.sucursalId)}
                  className={`flex w-full flex-col gap-0.5 rounded-xl px-2.5 py-2 text-left transition ${
                    activa
                      ? "bg-orange-50 shadow-[inset_0_0_0_2px_#fdba74]"
                      : "hover:bg-orange-50/60"
                  }`}
                >
                  <strong
                    className={`text-sm break-words ${activa ? "text-orange-700" : "text-gray-900"}`}
                  >
                    {sucursal.nombre}
                  </strong>
                  <span className="flex items-start gap-1.5 text-[13px] text-gray-600">
                    {favorito ? (
                      <>
                        <span className="mt-px shrink-0">
                          <Corona tamanio={15} />
                        </span>
                        <span className="min-w-0 break-words">
                          {favorito.nombre} ·{" "}
                          <strong className="whitespace-nowrap text-gray-800">
                            {favorito.unidades.toLocaleString("es-AR")} u.
                          </strong>
                        </span>
                      </>
                    ) : (
                      "Sin ventas en este período"
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>
      )}

      {/* La bandeja: ocupa el resto, con un ancho máximo para que no se estire de más */}
      <div className="flex min-w-0 max-w-[720px] flex-[1_1_380px] flex-col gap-5">

        <p className="text-xs text-gray-500">
          {porIcono === 1
            ? "Cada icono es 1 unidad vendida."
            : `Cada icono son ${porIcono} unidades vendidas.`}
        </p>

        {/* La bandeja */}
        <div className="relative rounded-[22px] bg-red-600 px-3 pt-4 pb-5 shadow-[inset_0_0_0_6px_#b91c1c,0_10px_22px_rgba(185,28,28,0.25)] sm:px-5 sm:pt-[18px] sm:pb-[22px]">
          {/* Manija */}
          <span
            aria-hidden="true"
            className="absolute -top-3 left-1/2 -ml-[34px] h-[18px] w-[68px] rounded-t-[10px] border-[5px] border-b-0 border-red-700"
          />

          {/* Papel de la bandeja. La "key" vuelve a servir todo al cambiar de sucursal. */}
          <div
            key={elegida.sucursalId}
            className="rounded-xl bg-amber-50 bg-[repeating-linear-gradient(45deg,transparent_0_14px,rgba(253,186,116,0.18)_14px_15px)] px-3 py-2.5 shadow-[inset_0_2px_6px_rgba(0,0,0,0.12)] sm:px-3.5"
          >
            {productos.map((producto, indice) => {
              const iconos = Math.max(1, Math.round(producto.unidades / porIcono));
              const tipo = iconoPorCategoria(producto.categoria);

              return (
                <div
                  key={producto.productoId}
                  className="rep-subir grid grid-cols-[26px_minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-1.5 border-b border-dashed border-amber-300 py-2 last:border-b-0 sm:grid-cols-[26px_minmax(100px,150px)_minmax(0,1fr)_64px]"
                  style={{ animationDelay: `${indice * 0.06}s` }}
                >
                  {/* Puesto */}
                  <span className="flex justify-center">
                    {indice === 0 ? (
                      <span className="rep-corona">
                        <Corona />
                      </span>
                    ) : (
                      <span className="text-[13px] font-bold text-orange-700">{indice + 1}</span>
                    )}
                  </span>

                  {/* Producto */}
                  <strong className="truncate text-sm text-gray-800">{producto.nombre}</strong>

                  {/* Iconos apilados: en celular bajan a una fila propia */}
                  <span
                    aria-hidden="true"
                    className="order-last col-span-full flex min-h-[22px] flex-wrap items-center gap-px pl-9 sm:order-none sm:col-span-1 sm:pl-0"
                  >
                    {Array.from({ length: iconos }, (_, posicion) => (
                      <span
                        key={posicion}
                        className="rep-servir"
                        style={{ animationDelay: `${0.1 + indice * 0.12 + posicion * 0.03}s` }}
                      >
                        <IconoComida tipo={tipo} tamanio={18} />
                      </span>
                    ))}
                  </span>

                  {/* Unidades */}
                  <strong className="text-right text-sm whitespace-nowrap text-orange-700">
                    {producto.unidades.toLocaleString("es-AR")} u.
                  </strong>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}