
import { useState } from "react";
import {
  ChartNoAxesCombined,
  Store,
  ShoppingCart,
  UserRoundGroupIcon,
  TicketPercent
} from "lucide-react";

import ReportesProductos from "../../components/reportes/ReportesProductos";

type SeccionReporte = "productos" | "sucursales" | "pedidos" | "clientes" | "promociones";

const secciones = [
  {
    id: "productos",
    nombre: "Productos",
    icono: ChartNoAxesCombined,
  },
  {
    id: "pedidos",
    nombre: "Pedidos",
    icono: ShoppingCart,
  },
  {
    id: "clientes",
    nombre: "Clientes",
    icono: UserRoundGroupIcon,
  },
  {
    id: "sucursales",
    nombre: "Sucursales",
    icono: Store,
  },
  {
    id: "promociones",
    nombre: "Promociones",
    icono: TicketPercent,
  },
] as const;

export default function Reportes() {
  const [seccionActiva, setSeccionActiva] =
    useState<SeccionReporte>("productos");

  return (
    <section className="space-y-6 p-4 sm:p-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
          Análisis del negocio
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
          Reportes
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Analizá el rendimiento de tus productos y del negocio.
        </p>
      </header>

      <nav
        aria-label="Secciones de reportes"
        className="flex flex-wrap gap-2 border-b border-gray-200 pb-3"
      >
        {secciones.map(({ id, nombre, icono: Icono }) => {
          const activa = seccionActiva === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => setSeccionActiva(id)}
              aria-pressed={activa}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                activa
                  ? "bg-orange-500 text-white shadow-sm"
                  : "text-gray-600 hover:bg-orange-50 hover:text-orange-700"
              }`}
            >
              <Icono size={18} />
              {nombre}
            </button>
          );
        })}
      </nav>

      {seccionActiva === "productos" && (
        <ReportesProductos />
      )}

      {seccionActiva === "sucursales" && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <Store className="mx-auto text-gray-400" size={32} />
          <h2 className="mt-3 font-semibold text-gray-900">
            Reportes de sucursales
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Esta sección estará disponible cuando implementemos sus reportes.
          </p>
        </div>
      )}

      {seccionActiva === "pedidos" && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <ShoppingCart className="mx-auto text-gray-400" size={32} />
          <h2 className="mt-3 font-semibold text-gray-900">
            Reportes de ventas
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Esta sección estará disponible cuando implementemos sus reportes.
          </p>
        </div>
      )}

      {seccionActiva === "clientes" && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <ShoppingCart className="mx-auto text-gray-400" size={32} />
          <h2 className="mt-3 font-semibold text-gray-900">
            Reportes de ventas
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Esta sección estará disponible cuando implementemos sus reportes.
          </p>
        </div>
      )}

      {seccionActiva === "promociones" && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <ShoppingCart className="mx-auto text-gray-400" size={32} />
          <h2 className="mt-3 font-semibold text-gray-900">
            Reportes de ventas
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Esta sección estará disponible cuando implementemos sus reportes.
          </p>
        </div>
      )}
    </section>
  );
}
