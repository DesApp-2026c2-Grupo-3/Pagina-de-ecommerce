import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import ConfirmarEliminacion from '../../components/ConfirmarEliminacion'
import MensajeVacio from '../../components/MensajeVacio'
import Paginacion from '../../components/Paginacion'
import BarraFiltrosLista from '../../components/listas/BarraFiltrosLista'
import MenuCategorias from '../../components/productos/MenuCategorias'
import ProductoCard from '../../components/productos/ProductoCard'
import { POR_PAGINA_PRODUCTOS } from '../../config/productos'
import { useFiltrosProductos } from '../../hooks/productos/useFiltrosProductos'
import { useProductos } from '../../hooks/productos/useProductos'
import { useIrAlInicioLista } from '../../hooks/useIrAlInicioLista'
import type { ProductoFila } from '../../types/producto.types'
import { paginar } from '../../utils/listas/paginar'
import { rutaStockProducto } from '../../utils/navegacion/rutasProducto'
import {
  contarPorDisponibilidad,
  filtrarProductos,
  type FiltroDisponibilidad,
} from '../../utils/productos/filtrarProductos'

const OPCIONES_DISPONIBILIDAD: { valor: FiltroDisponibilidad; etiqueta: string }[] = [
  { valor: 'todas', etiqueta: 'Todos' },
  { valor: 'habilitados', etiqueta: 'Habilitados' },
  { valor: 'inhabilitados', etiqueta: 'Inhabilitados' },
]

// Productos del catálogo (solo MASTER), sin tabla (plan responsivo de Productos v2). Solo compone:
// datos y acciones (useProductos), filtros en la URL, fila‑tarjetas, paginación de 10 y la confirmación de baja.
export default function Productos() {
  const navigate = useNavigate()
  const location = useLocation()
  const datos = useProductos()
  const filtros = useFiltrosProductos()
  const { refTitulo, irAlInicio } = useIrAlInicioLista()
  const [aEliminar, setAEliminar] = useState<ProductoFila | null>(null)

  const nombreCategoria = new Map(datos.categorias.map((c) => [c.id, c.nombre]))
  const filtrados = filtrarProductos(datos.productos, filtros)
  const { pagina, totalPaginas, items } = paginar(filtrados, filtros.pagina, POR_PAGINA_PRODUCTOS)

  async function confirmarEliminar() {
    if (aEliminar) await datos.eliminar(aEliminar)
    setAEliminar(null)
  }

  return (
    <main className="@container w-full max-w-full p-4 @3xl:p-8">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-700">Catálogo de productos</p>
          <h1 className="text-2xl font-bold @3xl:text-3xl">Productos</h1>
          <p className="mt-2 text-gray-600">Gestioná los productos de la tienda.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/productos/nuevo')}
          aria-label="Nuevo producto"
          title="Nuevo producto"
          className="shrink-0 rounded-full border border-orange-400 bg-action p-4 text-white shadow-[0_0_10px_rgba(249,115,22,0.6)] transition-all hover:bg-action-hover hover:shadow-[0_0_16px_rgba(249,115,22,0.8)]"
        >
          <Plus size={22} aria-hidden="true" />
        </button>
      </div>

      <BarraFiltrosLista<FiltroDisponibilidad>
        sucursales={null}
        sucursalId={null}
        onSucursal={() => {}}
        filtroExtra={<MenuCategorias categorias={datos.categorias} valor={filtros.categoria} onChange={filtros.setCategoria} />}
        busqueda={filtros.busqueda}
        onBusqueda={filtros.setBusqueda}
        placeholder="Buscar producto"
        filtro={{
          id: 'filtro-disponibilidad',
          leyenda: 'Filtrar por disponibilidad',
          opciones: OPCIONES_DISPONIBILIDAD,
          valor: filtros.disponibilidad,
          contadores: contarPorDisponibilidad(datos.productos, filtros),
          onChange: filtros.setDisponibilidad,
        }}
      />

      <h2 ref={refTitulo} tabIndex={-1} className="sr-only">
        Productos, página {pagina} de {totalPaginas}
      </h2>

      {datos.cargando ? (
        <p className="rounded-lg border border-gray-200 bg-white px-6 py-10 text-center text-gray-600">Cargando productos...</p>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white px-6 py-10">
          <MensajeVacio mensaje={filtros.hayFiltros ? 'No hay productos con esos filtros.' : 'No hay productos registrados.'} />
        </div>
      ) : (
        <ul aria-label="Productos" className="flex flex-col gap-2.5">
          {items.map((p) => (
            <ProductoCard
              key={p.id}
              producto={p}
              categoria={p.categoriaId !== null ? (nombreCategoria.get(p.categoriaId) ?? null) : null}
              onVerDetalles={(x) => navigate(`/admin/productos/editar/${x.id}`)}
              onVerStock={(x) =>
                navigate(rutaStockProducto(x.id), { state: { desde: `${location.pathname}${location.search}` } })
              }
              onAlternarDisponibilidad={(x) => void datos.alternarDisponibilidad(x)}
              onEliminar={setAEliminar}
            />
          ))}
        </ul>
      )}

      <Paginacion
        paginaActual={pagina}
        totalElementos={filtrados.length}
        elementosPorPagina={POR_PAGINA_PRODUCTOS}
        cambiarPagina={(nueva) => {
          filtros.setPagina(nueva)
          irAlInicio()
        }}
      />

      <ConfirmarEliminacion
        abierto={aEliminar !== null}
        titulo="Eliminar producto"
        textoConfirmar="Eliminar"
        mensaje={`¿Eliminar ${aEliminar?.nombre ?? 'este producto'}? Deja de verse en la tienda y en este panel, y no se puede deshacer. Los pedidos y reportes anteriores lo siguen mostrando. Si solo querés sacarlo de la venta por un tiempo, usá "Inhabilitar".`}
        onConfirmar={() => void confirmarEliminar()}
        onCancelar={() => setAEliminar(null)}
      />
    </main>
  )
}
