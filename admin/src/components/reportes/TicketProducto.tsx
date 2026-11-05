import { Check } from "lucide-react";
import { Corona } from "./efectos/IconosComida";

/* =========================================================
   TICKET DE PRODUCTO
   Panel "de papel" al costado del ranking con el detalle
   del producto seleccionado. Se reimprime al cambiar de producto.
   ========================================================= */

export type DatosTicket = {
  id: number | string;
  nombre: string;
  categoria: string | null;
  puesto: number;
  totalPuestos: number;
  unidades: number;
  facturacion: number | null;   // null si todavía no cargó
  participacion: number;        // porcentaje de 0 a 100
  agotadoEn: string[];          // nombres de sucursales sin stock
  contexto: string;             // "Todas las sucursales" o el nombre de una
  esPrimero: boolean;
};

const formatearNumero = (valor: number) => valor.toLocaleString("es-AR");

const formatearDinero = (valor: number) =>
  valor.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });

/* Una línea "concepto ........ valor" */
function Renglon({ concepto, valor }: { concepto: string; valor: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span>{concepto}</span>
      <span className="flex-1 border-b border-dotted border-amber-300" />
      <strong className="text-gray-900">{valor}</strong>
    </div>
  );
}

export default function TicketProducto({ datos }: { datos: DatosTicket }) {
  const precioPromedio =
    datos.facturacion !== null && datos.unidades > 0
      ? datos.facturacion / datos.unidades
      : null;

  return (
    <div
      aria-live="polite"
      className="rep-ticket min-h-[440px] border-x border-amber-300 px-5 py-6 font-mono text-gray-700 shadow-[0_2px_4px_rgba(146,64,14,0.12),0_14px_32px_rgba(146,64,14,0.18)]"
    >
      {/* La key hace que el ticket se "reimprima" al cambiar de producto */}
      <div key={datos.id} className="rep-imprimir flex flex-col gap-3">
        {/* Encabezado */}
        <div className="text-center">
          <p className="text-xs font-bold tracking-[0.2em] text-amber-800">
            BURGERFAST
          </p>
          <p className="text-[11px] tracking-[0.15em] text-amber-800">
            TICKET DE PRODUCTO
          </p>
          <p className="text-[11px] text-gray-500">
            {datos.contexto} · Pedidos entregados
          </p>
        </div>

        <div className="border-t-2 border-dashed border-amber-300" />

        {/* Producto */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-sans text-xl font-extrabold leading-tight text-gray-900">
              {datos.nombre}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {datos.categoria ?? "Sin categoría"} · Puesto {datos.puesto} de{" "}
              {datos.totalPuestos}
            </p>
          </div>

          {datos.esPrimero && (
            <span className="rep-corona shrink-0">
              <Corona tamanio={36} titulo="Más vendido" />
            </span>
          )}
        </div>

        {/* Números */}
        <div className="flex flex-col gap-1.5 text-[13px]">
          <Renglon concepto="Unidades vendidas" valor={formatearNumero(datos.unidades)} />
          <Renglon
            concepto="Facturación"
            valor={datos.facturacion !== null ? formatearDinero(datos.facturacion) : "—"}
          />
          <Renglon
            concepto="Precio promedio"
            valor={precioPromedio !== null ? formatearDinero(precioPromedio) : "—"}
          />
        </div>

        {/* Participación */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs">
            <span>Participación en unidades</span>
            <strong className="text-gray-900">
              {datos.participacion.toLocaleString("es-AR", { maximumFractionDigits: 1 })}%
            </strong>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-amber-100 ring-1 ring-amber-200">
            <div
              className="rep-barra h-full rounded-full bg-amber-500"
              style={{ width: `${Math.min(datos.participacion, 100)}%` }}
            />
          </div>
        </div>

        <div className="border-t-2 border-dashed border-amber-300" />

        {/* Stock */}
        {datos.agotadoEn.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="rep-sello border-2 border-red-600 px-2 py-0.5 text-xs font-bold tracking-wider text-red-700">
              AGOTADO
            </span>
            <span className="text-xs text-gray-700">
              en {datos.agotadoEn.join(", ")}
            </span>
          </div>
        ) : (
          <p className="flex items-center gap-1.5 text-xs font-semibold text-green-700">
            <Check size={16} strokeWidth={2.5} aria-hidden="true" />
            Con stock en todas las sucursales
          </p>
        )}

        {/* Código de barras decorativo */}
        <div
          aria-hidden="true"
          className="mt-1 h-8 bg-[repeating-linear-gradient(90deg,#1f2937_0_2px,transparent_2px_4px,#1f2937_4px_7px,transparent_7px_9px,#1f2937_9px_10px,transparent_10px_13px)]"
        />
        <p className="text-center text-[11px] text-gray-500">
          ¡Gracias por su reporte!
        </p>
      </div>
    </div>
  );
}