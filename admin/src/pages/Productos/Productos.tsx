import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Boxes, Eye, Plus, Trash2 } from 'lucide-react'
import Paginacion from '../../components/Paginacion'
import ConfirmarEliminacion from '../../components/ConfirmarEliminacion'
import MensajeVacio from '../../components/MensajeVacio'
import { BarraFiltros, Buscador, SelectFiltro } from '../../components/Filtros'
import { useToast } from '../../context/ToastContext'
import { obtenerCategorias } from '../../services/categoriaService'
import {
  obtenerProductos,
  eliminarProducto as eliminarProductoAPI,
  verStockProducto,
} from '../../services/productoService'

interface ProductoFila {
  id: number
  nombre: string
  disponible: boolean
  categoriaId: number | null
}

interface StockDeProducto {
  nombre: string
  sinReceta: boolean
  sucursales: { id: number; nombre: string; unidades: number | null; limitante: string | null }[]
}

const POR_PAGINA = 8

function Disponibilidad({ disponible }: { disponible: boolean }) {
  return disponible ? (
    <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">Disponible</span>
  ) : (
    <span className="rounded-full bg-gray-200 px-3 py-1 text-sm font-medium text-gray-600">Pausado</span>
  )
}

const botonIcono = 'rounded border p-2 transition-colors'

export default function Productos() {
  const navigate = useNavigate()
  const { mostrarToast } = useToast()

  const [productos, setProductos] = useState<ProductoFila[]>([])
  const [categorias, setCategorias] = useState<{ id: number; nombre: string }[]>([])
  const [paginaActual, setPaginaActual] = useState(1)
  const [aEliminar, setAEliminar] = useState<ProductoFila | null>(null)
  const [stockVisto, setStockVisto] = useState<StockDeProducto | null>(null)

  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('todas')
  const [filtroDisponibilidad, setFiltroDisponibilidad] = useState('todas')

  useEffect(() => {
    obtenerProductos()
      .then(setProductos)
      .catch((error) => console.error('Error al cargar productos:', error))
    obtenerCategorias()
      .then(setCategorias)
      .catch(() => setCategorias([]))
  }, [])

  // Al cambiar un filtro, se vuelve a la primera página
  const conReinicio = (cambiar: (valor: string) => void) => (valor: string) => {
    cambiar(valor)
    setPaginaActual(1)
  }

  const texto = busqueda.trim().toLowerCase()
  const filtrados = productos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(texto) &&
      (filtroCategoria === 'todas' || String(p.categoriaId) === filtroCategoria) &&
      (filtroDisponibilidad === 'todas' || (filtroDisponibilidad === 'disponibles') === p.disponible),
  )
  const pagina = filtrados.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA)
  const hayFiltros = busqueda !== '' || filtroCategoria !== 'todas' || filtroDisponibilidad !== 'todas'

  async function eliminar() {
    if (!aEliminar) return
    try {
      await eliminarProductoAPI(aEliminar.id)
      setProductos((prev) => prev.filter((p) => p.id !== aEliminar.id))
      mostrarToast('Producto eliminado!')
    } catch (error) {
      mostrarToast(error instanceof Error ? error.message : 'No se pudo eliminar el producto')
    } finally {
      setAEliminar(null)
    }
  }

  async function verStock(producto: ProductoFila) {
    try {
      setStockVisto(await verStockProducto(producto.id))
    } catch (error) {
      mostrarToast(error instanceof Error ? error.message : 'No se pudo cargar el stock')
    }
  }

  // Los tres botones, iguales en celular y escritorio
  const acciones = (p: ProductoFila) => (
    <div className="flex shrink-0 gap-2">
      <button
        type="button"
        onClick={() => navigate(`/admin/productos/editar/${p.id}`)}
        aria-label={`Ver detalles de ${p.nombre}`}
        title="Ver detalles"
        className={`${botonIcono} bg-emerald-200 text-success hover:text-success-hover`}
      >
        <Eye size={18} />
      </button>
      <button
        type="button"
        onClick={() => verStock(p)}
        aria-label={`Ver stock de ${p.nombre}`}
        title="Ver stock"
        className={`${botonIcono} bg-orange-100 text-action hover:text-action-hover`}
      >
        <Boxes size={18} />
      </button>
      <button
        type="button"
        onClick={() => setAEliminar(p)}
        aria-label={`Eliminar ${p.nombre}`}
        title="Eliminar"
        className={`${botonIcono} bg-red-200 text-danger hover:text-danger-hover`}
      >
        <Trash2 size={18} />
      </button>
    </div>
  )

  return (
    <main className="p-4 md:p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Productos</h1>
          <p className="mt-2 text-gray-600">Gestioná los productos de la tienda.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/productos/nuevo')}
          aria-label="Nuevo producto"
          title="Nuevo producto"
          className="shrink-0 rounded-full border border-orange-400 bg-action p-4 text-white shadow-[0_0_10px_rgba(249,115,22,0.6)] transition-all hover:bg-action-hover hover:shadow-[0_0_16px_rgba(249,115,22,0.8)]"
        >
          <Plus size={22} />
        </button>
      </div>

      <BarraFiltros>
        <Buscador valor={busqueda} onChange={conReinicio(setBusqueda)} placeholder="Buscar producto..." />
        <SelectFiltro
          valor={filtroCategoria}
          onChange={conReinicio(setFiltroCategoria)}
          etiqueta="Filtrar por categoría"
          opciones={[
            { valor: 'todas', etiqueta: 'Todas las categorías' },
            ...categorias.map((c) => ({ valor: String(c.id), etiqueta: c.nombre })),
          ]}
        />
        <SelectFiltro
          valor={filtroDisponibilidad}
          onChange={conReinicio(setFiltroDisponibilidad)}
          etiqueta="Filtrar por disponibilidad"
          opciones={[
            { valor: 'todas', etiqueta: 'Todos' },
            { valor: 'disponibles', etiqueta: 'Disponibles' },
            { valor: 'pausados', etiqueta: 'Pausados' },
          ]}
        />
      </BarraFiltros>

      {pagina.length === 0 ? (
        <div className="rounded-lg border bg-white px-6 py-10">
          <MensajeVacio mensaje={hayFiltros ? 'No hay productos con esos filtros.' : 'No hay productos registrados.'} />
        </div>
      ) : (
        <>
          {/* Celular: tarjetas */}
          <ul className="flex flex-col gap-3 md:hidden">
            {pagina.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 rounded-lg border bg-white p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.nombre}</p>
                  <div className="mt-2">
                    <Disponibilidad disponible={p.disponible} />
                  </div>
                </div>
                {acciones(p)}
              </li>
            ))}
          </ul>

          {/* Escritorio: tabla */}
          <div className="hidden rounded-lg border bg-white md:block">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left">Nombre</th>
                  <th className="px-6 py-3 text-left">Disponibilidad</th>
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pagina.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="px-6 py-4 font-medium">{p.nombre}</td>
                    <td className="px-6 py-4">
                      <Disponibilidad disponible={p.disponible} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end">{acciones(p)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Paginacion
        paginaActual={paginaActual}
        totalElementos={filtrados.length}
        elementosPorPagina={POR_PAGINA}
        cambiarPagina={setPaginaActual}
      />

      <ConfirmarEliminacion
        abierto={aEliminar !== null}
        mensaje={`¿Eliminar ${aEliminar?.nombre ?? 'este producto'}? Deja de verse en la tienda, pero los pedidos anteriores lo conservan.`}
        onConfirmar={eliminar}
        onCancelar={() => setAEliminar(null)}
      />

      {/* Modal: stock del producto por sucursal */}
      {stockVisto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold">Stock de {stockVisto.nombre}</h2>
            <p className="mt-1 text-sm text-gray-600">Cuántas unidades se pueden preparar con el stock de cada sucursal.</p>

            {stockVisto.sinReceta ? (
              <p className="mt-4 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                Este producto no tiene receta, así que no descuenta stock. Cargale una en "Ver detalles".
              </p>
            ) : (
              <ul className="mt-4 flex flex-col divide-y">
                {stockVisto.sucursales.map((s) => (
                  <li key={s.id} className="flex items-start justify-between gap-3 py-3">
                    <span className="font-medium">{s.nombre}</span>
                    {s.unidades && s.unidades > 0 ? (
                      <span className="shrink-0 font-bold text-green-700">{s.unidades} unidades</span>
                    ) : (
                      <span className="shrink-0 text-right text-sm font-semibold text-red-700">
                        Sin stock
                        {s.limitante && <span className="block font-normal text-gray-500">Falta {s.limitante}</span>}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setStockVisto(null)}
                className="rounded border px-4 py-2 font-semibold hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}