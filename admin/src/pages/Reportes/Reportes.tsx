
import { Link } from "react-router-dom";

const reportes = [
  {
    titulo: "Productos más vendidos",
    descripcion: "Consultá qué productos lideran las ventas.",
    icono: "🏆",
    ruta: "/admin/reportes/productos-mas-vendidos",
    disponible: true,
  },
  {
    titulo: "Productos menos vendidos",
    descripcion: "Encontrá los productos con menor movimiento, incluidos los que no registran ventas.",
    icono: "📉",
    ruta: "/admin/reportes/productos-menos-vendidos",
    disponible: true,
  },
  {
    titulo: "Productos sin stock",
    descripcion: "Identificá los productos que no se pueden preparar por falta de insumos.",
    icono: "📦",
    ruta: "",
    disponible: false,
  },
  {
    titulo: "Productos con mayor facturación",
    descripcion: "Conocé qué productos generan más ingresos por ventas.",
    icono: "💰",
    ruta: "/admin/reportes/productos-mayor-facturacion",
    disponible: true,
  },
];

export default function Reportes() {
  return (
    <section className="space-y-6 p-2">
      <header>
        <p className="text-sm font-medium text-orange-600">
          ANÁLISIS DEL NEGOCIO
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
          Reportes
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Elegí un informe para analizar las ventas y el estado de los productos.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {reportes.map((reporte) => {
          const contenido = (
            <>
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-2xl">
                  {reporte.icono}
                </span>

                {reporte.disponible ? (
                  <span className="text-sm font-semibold text-orange-600">
                    Ver reporte →
                  </span>
                ) : (
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
                    Próximamente
                  </span>
                )}
              </div>

              <h2 className="mt-5 text-lg font-bold text-gray-900">
                {reporte.titulo}
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                {reporte.descripcion}
              </p>
            </>
          );

          return reporte.disponible ? (
            <Link
              key={reporte.titulo}
              to={reporte.ruta}
              className="block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
            >
              {contenido}
            </Link>
          ) : (
            <article
              key={reporte.titulo}
              className="rounded-xl border border-gray-200 bg-white p-5 opacity-75"
            >
              {contenido}
            </article>
          );
        })}
      </div>
    </section>
  );
}
