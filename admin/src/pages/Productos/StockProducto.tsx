import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import MensajeVacio from '../../components/MensajeVacio'
import Paginacion from '../../components/Paginacion'
import EstadoBadge from '../../components/listas/EstadoBadge'
import FiltroSegmentado from '../../components/listas/FiltroSegmentado'
import EnlaceVolver from '../../components/navegacion/EnlaceVolver'
import { POR_PAGINA_STOCK_PRODUCTO } from '../../config/productos'
import { useStockProducto } from '../../hooks/productos/useStockProducto'
import { paginar } from '../../utils/listas/paginar'
import { leerIdPositivo } from '../../utils/navegacion/leerIdPositivo'
import { destinoVolverProductos } from '../../utils/navegacion/rutasProducto'
import {
  contarStockProducto,
  filtrarStockProducto,
  tieneStock,
  type FiltroStockProducto,
} from '../../utils/productos/filtrarStockProducto'

const OPCIONES: { valor: FiltroStockProducto; etiqueta: string }[] = [
  { valor: 'todas', etiqueta: 'Todas' },
  { valor: 'con', etiqueta: 'Con stock' },
  { valor: 'sin', etiqueta: 'Sin stock' },
]

// «Ver stock» de un producto en página propia, sin modal (plan de Productos v2, D-P3).
// Mismo contenido que el modal anterior, con buscador de sucursal y filtro con o sin stock.
export default function StockProducto() {
  const { productoId: parametro } = useParams()
  const productoId = leerIdPositivo(parametro ?? null)
  const location = useLocation()
  const volverA = destinoVolverProductos(location.state)
  const { stock, cargando, error } = useStockProducto(productoId)
  const refTitulo = useRef<HTMLHeadingElement | null>(null)

  const [busqueda, setBusqueda] = useState('')
  const [estado, setEstado] = useState<FiltroStockProducto>('todas')
  const [paginaPedida, setPaginaPedida] = useState(1)

  useEffect(() => {
    if (stock) refTitulo.current?.focus()
  }, [stock])

  const sucursales = stock && !stock.sinReceta ? stock.sucursales : []
  const filtradas = filtrarStockProducto(sucursales, { busqueda, estado })
  const { pagina, items } = paginar(filtradas, paginaPedida, POR_PAGINA_STOCK_PRODUCTO)
  const filtro = {
    id: 'filtro-stock-producto',
    leyenda: 'Filtrar sucursales por stock',
    opciones: OPCIONES,
    valor: estado,
    contadores: contarStockProducto(sucursales, busqueda),
    onChange: (valor: FiltroStockProducto) => {
      setEstado(valor)
      setPaginaPedida(1)
    },
  }

  return (
    <main className="@container w-full max-w-full p-4 @3xl:p-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <EnlaceVolver to={volverA} texto="Volver a productos" />

        {cargando && <p className="text-gray-600">Cargando stock...</p>}
        {error && (
          <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">
            {error}
          </p>
        )}

        {stock && (
          <>
            <div>
              <h1 ref={refTitulo} tabIndex={-1} className="text-2xl font-extrabold text-gray-900 outline-none @3xl:text-3xl">
                Stock de {stock.nombre}
              </h1>
              <p className="mt-1 text-gray-600">Cuántas unidades se pueden preparar con el stock de cada sucursal.</p>
            </div>

            {stock.sinReceta ? (
              <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                Este producto no tiene receta, así que no descuenta stock. Cargale una en "Ver detalles".
              </p>
            ) : (
              <>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-3 @xl:flex-row @xl:items-center">
                    <div className="w-full @xl:flex-1">
                      <label htmlFor="buscar-sucursal-stock" className="sr-only">Buscar sucursal</label>
                      <input
                        id="buscar-sucursal-stock"
                        type="search"
                        value={busqueda}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                          setBusqueda(e.target.value)
                          setPaginaPedida(1)
                        }}
                        placeholder="Buscar sucursal..."
                        className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3"
                      />
                    </div>
                    <FiltroSegmentado {...filtro} variante="desplegable" className="@xl:w-48 @[48rem]:hidden" />
                  </div>
                  <FiltroSegmentado {...filtro} variante="botones" className="hidden @[48rem]:block" />
                </div>

                {items.length === 0 ? (
                  <div className="rounded-lg border border-gray-200 bg-white px-6 py-10">
                    <MensajeVacio mensaje="No hay sucursales con esos filtros." />
                  </div>
                ) : (
                  <ul aria-label="Stock por sucursal" className="flex flex-col gap-2.5">
                    {items.map((s) => (
                      <li key={s.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 rounded-lg border-2 border-gray-200 bg-white px-3 py-3 @xl:px-4">
                        <p className="min-w-0 font-bold text-gray-900">{s.nombre}</p>
                        {tieneStock(s) ? (
                          <p className="justify-self-end whitespace-nowrap">
                            <span className="text-xl font-extrabold text-gray-900">{s.unidades}</span>{' '}
                            <span className="text-sm text-gray-600">unidades</span>
                          </p>
                        ) : (
                          <>
                            <div className="justify-self-end">
                              <EstadoBadge texto="Sin stock" clases="bg-red-100 text-red-800" />
                            </div>
                            {s.limitante && <p className="col-span-full text-sm text-gray-600">Falta {s.limitante}</p>}
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                <Paginacion
                  paginaActual={pagina}
                  totalElementos={filtradas.length}
                  elementosPorPagina={POR_PAGINA_STOCK_PRODUCTO}
                  cambiarPagina={setPaginaPedida}
                />
              </>
            )}
          </>
        )}
      </div>
    </main>
  )
}
