
import { useCallback, useEffect, useState } from "react";
import type { ProductoMenosVendido } from "../../types/reporte.types";
import { obtenerProductosMenosVendidos } from "../../services/reporteService";
import Paginacion from "../Paginacion";

const API_BASE = import.meta.env?.VITE_API_URL ?? "http://localhost:3000";

export default function ProductosMenosVendidos() {
  const [productos, setProductos] = useState<ProductoMenosVendido[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const productosPorPagina = 5;

  const cargarReporte = useCallback(async () => {
    setCargando(true);
    setError("");

    try {
      const datos = await obtenerProductosMenosVendidos();
      setProductos(datos);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo cargar el reporte",
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarReporte();
  }, [cargarReporte]);

  const totalUnidades = productos.reduce(
    (total, producto) => total + Number(producto.unidadesVendidas),
    0,
  );

    const indiceUltimoProducto = paginaActual * productosPorPagina;
  const indicePrimerProducto = indiceUltimoProducto - productosPorPagina;

  const productosPagina = productos.slice(
  indicePrimerProducto,
  indiceUltimoProducto
); 

  return (
    <section className="space-y-6 p-3">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-orange-600">
            ANÁLISIS DEL NEGOCIO
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
            Productos menos vendidos
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Identificá los productos con menor movimiento de ventas.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void cargarReporte()}
          disabled={cargando}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-60"
        >
          {cargando ? "Actualizando..." : "↻ Actualizar"}
        </button>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Unidades vendidas
          </p>
          <p className="mt-3 text-3xl font-bold text-gray-900">
            {cargando ? "—" : totalUnidades.toLocaleString("es-AR")}
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Entre los productos del reporte
          </p>
        </article>

        <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Productos sin ventas
          </p>
          <p className="mt-3 text-3xl font-bold text-gray-900">
            {cargando
              ? "—"
              : productos
                  .filter((producto) => Number(producto.unidadesVendidas) === 0)
                  .length.toLocaleString("es-AR")}
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Sin pedidos entregados registrados
          </p>
        </article>
      </div>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4 sm:px-6">
          <h2 className="text-lg font-bold text-gray-900">
            Ranking de menor a mayor
          </h2>
        </div>

        {cargando ? (
          <div className="p-10 text-center text-sm text-gray-500">
            Cargando datos del reporte...
          </div>
        ) : error ? (
          <div className="p-6">
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
            </div>
            <button
              type="button"
              onClick={() => void cargarReporte()}
              className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
            >
              Reintentar
            </button>
          </div>
        ) : productos.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500">
            No hay productos para mostrar en este reporte.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-3 font-semibold sm:px-6">Producto</th>
                  <th className="px-5 py-3 text-right font-semibold sm:px-6">
                    Unidades vendidas
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {productosPagina.map((producto, indice) => (
                  <tr key={producto.productoId} className="hover:bg-gray-50">
                    <td className="px-5 py-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <span className="w-6 shrink-0 font-semibold text-gray-400">
                          {indice + 1}.
                        </span>

                        {producto.imagen ? (
                          <img
                            src={
                              producto.imagen.startsWith("http")
                                ? producto.imagen
                                : `${API_BASE}${producto.imagen.startsWith("/") ? "" : "/"}${producto.imagen}`
                            }
                            alt={producto.nombre}
                            className="h-12 w-12 rounded-lg border border-gray-100 object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-xl">
                            🍔
                          </div>
                        )}

                        <span className="font-semibold text-gray-800">
                          {producto.nombre}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right sm:px-6">
                      <span
                        className={`inline-flex min-w-12 justify-center rounded-full px-3 py-1.5 font-bold ${
                          Number(producto.unidadesVendidas) === 0
                            ? "bg-gray-100 text-gray-600"
                            : "bg-orange-50 text-orange-700"
                        }`}
                      >
                        {Number(producto.unidadesVendidas).toLocaleString("es-AR")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
          </div>
        )}
        
      </section>
      <Paginacion
              paginaActual={paginaActual}
              totalElementos={productos.length}
              elementosPorPagina={productosPorPagina}
              cambiarPagina={setPaginaActual}
            />
    </section>
  );
}
