import { useState } from "react";
import { Link } from "react-router-dom";

/* =========================================================
   ORDEN DE REPOSICIÓN (Sin stock)
   Agrupa los faltantes por el insumo que falta: así se ve qué
   reponer primero. Cada palote es un producto frenado en una
   sucursal. Tocar un renglón lo tacha como "pedido" (es solo
   una ayuda visual: no se guarda en la base).
   ========================================================= */

export type Faltante = {
  productoId: number;
  nombre: string;
  sucursalId: number;
  sucursalNombre: string;
  insumoLimitante: string | null;
};

type Props = {
  faltantes: Faltante[];
  contexto: string; // "Todas las sucursales" o el nombre de una
};

/* Un insumo con todo lo que frena */
type Grupo = {
  insumo: string;
  faltantes: Faltante[];
  cantidadSucursales: number;
};

const SIN_INSUMO = "Sin insumo identificado";

/* Agrupa por insumo y ordena: primero el que más productos frena */
function agruparPorInsumo(faltantes: Faltante[]): Grupo[] {
  const porInsumo = new Map<string, Faltante[]>();

  for (const faltante of faltantes) {
    const insumo = faltante.insumoLimitante ?? SIN_INSUMO;
    porInsumo.set(insumo, [...(porInsumo.get(insumo) ?? []), faltante]);
  }

  return [...porInsumo.entries()]
    .map(([insumo, lista]) => ({
      insumo,
      faltantes: lista,
      cantidadSucursales: new Set(lista.map((f) => f.sucursalId)).size,
    }))
    .sort((a, b) => b.faltantes.length - a.faltantes.length);
}

const plural = (cantidad: number, singular: string, varios: string) =>
  `${cantidad} ${cantidad === 1 ? singular : varios}`;

/* Palotes: una raya por faltante, de a 5 con la diagonal cruzada */
function Palotes({ cantidad, renglon }: { cantidad: number; renglon: number }) {
  const grupos = Math.ceil(cantidad / 5);
  let raya = 0;

  return (
    <span className="inline-flex flex-wrap gap-2" aria-hidden="true">
      {Array.from({ length: grupos }, (_, g) => {
        const enEste = Math.min(5, cantidad - g * 5);

        return (
          <svg key={g} viewBox="0 0 46 30" width="46" height="30" className="overflow-visible">
            {Array.from({ length: Math.min(enEste, 4) }, (_, k) => {
              const x = 6 + k * 9;
              const tuerce = ((k + g + renglon) % 3) - 1; // cada rayita un poco torcida
              const retraso = 0.35 + renglon * 0.12 + raya++ * 0.09;
              return (
                <path
                  key={k}
                  className="rep-palote"
                  d={`M${x + tuerce} 3 L${x - tuerce} 27`}
                  fill="none"
                  stroke="#1e3a8a"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  style={{ animationDelay: `${retraso}s` }}
                />
              );
            })}
            {enEste === 5 && (
              <path
                className="rep-palote"
                d="M1 22 L43 7"
                fill="none"
                stroke="#1e3a8a"
                strokeWidth="2.4"
                strokeLinecap="round"
                style={{ animationDelay: `${0.35 + renglon * 0.12 + raya++ * 0.09}s` }}
              />
            )}
          </svg>
        );
      })}
    </span>
  );
}

/* =========================================================
   COMPONENTE PRINCIPAL
   ========================================================= */

export default function OrdenReposicion({ faltantes, contexto }: Props) {
  const grupos = agruparPorInsumo(faltantes);

  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [pedidos, setPedidos] = useState<Record<string, true>>({});
  const [impresion, setImpresion] = useState(0); // reimprime el remito

  const cantidadPedidos = grupos.filter((g) => pedidos[g.insumo]).length;
  const todoPedido = grupos.length > 0 && cantidadPedidos === grupos.length;
  const elegido = grupos.find((g) => g.insumo === seleccionado) ?? grupos[0];

  // Marca o desmarca un insumo como pedido
  const alternarPedido = (insumo: string) => {
    setSeleccionado(insumo);
    setImpresion((n) => n + 1);
    setPedidos((anteriores) => {
      const nuevos = { ...anteriores };
      if (nuevos[insumo]) delete nuevos[insumo];
      else nuevos[insumo] = true;
      return nuevos;
    });
  };

  if (!elegido) return null;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      {/* ===================== LA HOJA ===================== */}
      <div className="rep-hoja mt-3 min-w-0 rounded-b-2xl rounded-t-md border border-gray-200 py-5 pl-14 pr-3 shadow-[0_2px_4px_rgb(17_24_39/0.06),0_12px_28px_rgb(17_24_39/0.10)] sm:pr-4">
        {/* El clip */}
        <span aria-hidden="true" className="rep-clip absolute -top-[18px] left-[70px]">
          <svg viewBox="0 0 24 48" width="20" height="44">
            <path
              d="M8 40V10a4 4 0 0 1 8 0v26a6 6 0 0 1-12 0V14"
              fill="none"
              stroke="#9ca3af"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
        </span>

        {/* Sello final */}
        {todoPedido && (
          <span
            role="status"
            className="rep-sello-completo rep-manuscrita whitespace-nowrap rounded-lg border-4 border-green-600 bg-white/85 px-4 py-1 text-3xl font-bold text-green-700"
          >
            ¡Depósito completo!
          </span>
        )}

        {/* Título + progreso */}
        <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="rep-manuscrita text-3xl font-bold leading-none text-blue-900">
            Orden de reposición
          </h3>
          <span className="rep-manuscrita text-xl text-blue-900">
            {cantidadPedidos} de {grupos.length} pedidos
          </span>
        </div>
        <div className="mb-3.5 h-2 overflow-hidden rounded-full bg-indigo-100 ring-1 ring-indigo-200">
          <div
            className="h-full rounded-full bg-blue-600 transition-[width] duration-500"
            style={{ width: `${(cantidadPedidos / grupos.length) * 100}%` }}
          />
        </div>

        {/* Los renglones */}
        <ol className="flex flex-col gap-1">
          {grupos.map((grupo, indice) => {
            const pedido = Boolean(pedidos[grupo.insumo]);
            const elegida = grupo.insumo === elegido.insumo;
            const cantidadProductos = grupo.faltantes.length;
            const urgente = cantidadProductos >= 4 && !pedido;
            const importante = cantidadProductos >= 2 && cantidadProductos < 4 && !pedido;

            return (
              <li
                key={grupo.insumo}
                className="rep-subir"
                style={{ animationDelay: `${indice * 0.07}s` }}
              >
                <button
                  type="button"
                  onClick={() => alternarPedido(grupo.insumo)}
                  aria-pressed={pedido}
                  aria-label={`${grupo.insumo}: ${plural(cantidadProductos, "producto afectado", "productos afectados")} en ${plural(
                    grupo.cantidadSucursales,
                    "sucursal",
                    "sucursales",
                  )}. ${pedido ? "Marcado como pedido. Tocá para desmarcar." : "Tocá para marcarlo como pedido."}`}
                  className={`rep-fila-stock flex w-full items-start gap-3 rounded-lg px-2.5 py-2 text-left ${
                    elegida ? "bg-blue-50/90 ring-2 ring-inset ring-blue-300" : ""
                  }`}
                >
                  {/* Casillero con tilde */}
                  <span
                    className={`relative mt-0.5 h-[26px] w-[26px] shrink-0 rounded-md border-2 bg-white ${
                      pedido ? "border-blue-700" : "border-gray-400"
                    }`}
                  >
                    {pedido && (
                      <svg viewBox="0 0 26 26" width="22" height="22" className="absolute left-0 top-0" aria-hidden="true">
                        <path
                          className="rep-tilde"
                          d="M5 13 L11 19 L21 6"
                          fill="none"
                          stroke="#1d4ed8"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>

                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    {/* Insumo + sellos */}
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="relative inline-block">
                        <span
                          className={`rep-resaltar text-base font-bold transition-colors duration-300 ${
                            pedido ? "text-gray-500" : "text-gray-900"
                          }`}
                        >
                          {grupo.insumo}
                        </span>

                        {/* Tachón de birome */}
                        {pedido && (
                          <svg
                            viewBox="0 0 100 12"
                            preserveAspectRatio="none"
                            aria-hidden="true"
                            className="absolute -left-1 top-1/2 -mt-1.5 h-3 w-[calc(100%_+_8px)] overflow-visible"
                          >
                            <path
                              className="rep-tachon"
                              pathLength={100}
                              d="M0 7 Q 20 3 40 7 T 80 6 T 100 5"
                              fill="none"
                              stroke="#1d4ed8"
                              strokeWidth="2.6"
                              strokeLinecap="round"
                            />
                          </svg>
                        )}
                      </span>

                      {urgente && (
                        <span className="rep-urgente rounded border-2 border-red-600 px-1.5 text-[11px] font-extrabold tracking-wider text-red-700">
                          URGENTE
                        </span>
                      )}
                      {importante && (
                        <span className="inline-block -rotate-3 rounded border-2 border-orange-600 px-1.5 text-[11px] font-extrabold tracking-wider text-orange-700">
                          IMPORTANTE
                        </span>
                      )}
                      {pedido && (
                        <span className="rep-anotacion rep-manuscrita text-xl font-bold leading-none text-blue-700">
                          ¡pedido!
                        </span>
                      )}
                    </span>

                    {/* Palotes + qué significan */}
                    <span
                      className={`flex flex-wrap items-center gap-x-3.5 gap-y-1 transition-opacity duration-300 ${
                        pedido ? "opacity-50" : ""
                      }`}
                    >
                      <Palotes cantidad={cantidadProductos} renglon={indice} />
                      <span className="rep-manuscrita text-xl leading-none text-blue-900">
                        {plural(cantidadProductos, "producto afectado", "productos afectados")} en{" "}
                        {plural(grupo.cantidadSucursales, "sucursal", "sucursales")}
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {/* ===================== EL REMITO ===================== */}
      <aside aria-label="Remito de reposición" className="mx-auto w-full max-w-sm py-2.5 lg:max-w-none">
        <Remito
          key={`${elegido.insumo}-${impresion}`}
          grupo={elegido}
          contexto={contexto}
          pedido={Boolean(pedidos[elegido.insumo])}
          onAlternar={() => alternarPedido(elegido.insumo)}
        />
      </aside>
    </div>
  );
}

/* =========================================================
   REMITO DE REPOSICIÓN
   ========================================================= */

type RemitoProps = {
  grupo: Grupo;
  contexto: string;
  pedido: boolean;
  onAlternar: () => void;
};

function Remito({ grupo, contexto, pedido, onAlternar }: RemitoProps) {
  // Productos frenados, agrupados por sucursal
  const porSucursal = new Map<number, { nombre: string; productos: string[] }>();
  for (const faltante of grupo.faltantes) {
    const actual = porSucursal.get(faltante.sucursalId) ?? {
      nombre: faltante.sucursalNombre,
      productos: [],
    };
    actual.productos.push(faltante.nombre);
    porSucursal.set(faltante.sucursalId, actual);
  }

  return (
    <div
      aria-live="polite"
      className="rep-ticket-rosa min-h-[420px] border-x border-rose-300 px-5 py-6 font-mono text-gray-700 shadow-[0_2px_4px_rgb(190_18_60/0.12),0_14px_32px_rgb(190_18_60/0.16)]"
    >
      <div className="rep-imprimir flex flex-col gap-3">
        {/* Encabezado */}
        <div className="text-center">
          <p className="text-xs font-bold tracking-[0.2em] text-rose-800">BURGERFAST</p>
          <p className="text-[11px] tracking-[0.12em] text-rose-800">REMITO DE REPOSICIÓN</p>
          <p className="text-[11px] text-gray-500">{contexto}</p>
        </div>

        <div className="border-t-2 border-dashed border-rose-300" />

        <div>
          <p className="text-[11px] text-gray-500">INSUMO</p>
          <p className="font-sans text-xl font-extrabold leading-tight text-gray-900">
            {grupo.insumo}
          </p>
        </div>

        {/* Por sucursal: qué frena y acceso a cargar stock */}
        <div className="flex flex-col gap-3">
          {[...porSucursal.entries()].map(([sucursalId, sucursal]) => (
            <div key={sucursalId} className="flex flex-col gap-1">
              <div className="flex items-baseline gap-2 text-[13px]">
                <strong className="min-w-0">{sucursal.nombre}</strong>
                <span className="min-w-3 flex-1 border-b border-dotted border-rose-300" />
                <span className="shrink-0 whitespace-nowrap">
                  {plural(sucursal.productos.length, "producto", "productos")}
                </span>
              </div>
              <p className="pl-2.5 text-xs text-gray-600">{sucursal.productos.join(", ")}</p>
              <Link
                to={`/admin/sucursales/${sucursalId}/stock`}
                className="self-start pl-2.5 font-sans text-xs font-semibold text-rose-700 underline-offset-2 hover:underline"
              >
                Cargar stock →
              </Link>
            </div>
          ))}
        </div>

        <div className="border-t-2 border-dashed border-rose-300" />

        <div className="flex items-baseline gap-2 text-[13px]">
          <span>Total de productos frenados</span>
          <span className="min-w-3 flex-1 border-b border-dotted border-rose-300" />
          <strong className="text-gray-900">{grupo.faltantes.length}</strong>
        </div>

        {pedido ? (
          <div className="flex flex-col gap-2.5">
            <span className="rep-sello self-start border-2 border-blue-700 px-2 py-0.5 text-xs font-bold tracking-wider text-blue-800">
              PEDIDO
            </span>
            <button
              type="button"
              onClick={onAlternar}
              className="min-h-11 rounded-lg border border-blue-300 bg-white font-sans text-sm font-semibold text-blue-800 transition hover:bg-blue-50"
            >
              Desmarcar
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <span className="rep-sello self-start border-2 border-red-600 px-2 py-0.5 text-xs font-bold tracking-wider text-red-700">
              PENDIENTE
            </span>
            <button
              type="button"
              onClick={onAlternar}
              className="min-h-11 rounded-lg bg-blue-600 font-sans text-sm font-bold text-white shadow-[0_2px_6px_rgb(37_99_235/0.35)] transition hover:bg-blue-700"
            >
              Marcar como pedido
            </button>
          </div>
        )}

        {/* Código de barras decorativo */}
        <div
          aria-hidden="true"
          className="mt-1 h-8 bg-[repeating-linear-gradient(90deg,#1f2937_0_2px,transparent_2px_4px,#1f2937_4px_7px,transparent_7px_9px,#1f2937_9px_10px,transparent_10px_13px)]"
        />
      </div>
    </div>
  );
}