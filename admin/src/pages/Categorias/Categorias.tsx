import { useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import ConfirmarEliminacion from '../../components/ConfirmarEliminacion'
import MensajeVacio from '../../components/MensajeVacio'
import Paginacion from '../../components/Paginacion'
import CategoriaCard from '../../components/categorias/CategoriaCard'
import ContinuaCategoria from '../../components/categorias/ContinuaCategoria'
import FiltroSegmentado from '../../components/listas/FiltroSegmentado'
import { POR_PAGINA_CATEGORIAS } from '../../config/categorias'
import { useCategorias } from '../../hooks/categorias/useCategorias'
import { useFiltrosCategorias } from '../../hooks/categorias/useFiltrosCategorias'
import { useIrAlInicioLista } from '../../hooks/useIrAlInicioLista'
import type { CategoriaAdmin } from '../../types/categoria.types'
import {
  contarPorEstado,
  filtrarCategorias,
  resumenCategorias,
  type FiltroEstadoCategoria,
} from '../../utils/categorias/filtrarCategorias'
import { principalQueContinua } from '../../utils/categorias/contextoPagina'
import { enOrdenJerarquico, nombrePadre } from '../../utils/categorias/ordenCategorias'
import { paginar } from '../../utils/listas/paginar'

const OPCIONES_ESTADO: { valor: FiltroEstadoCategoria; etiqueta: string }[] = [
  { valor: 'habilitadas', etiqueta: 'Habilitadas' },
  { valor: 'deshabilitadas', etiqueta: 'Deshabilitadas' },
]

// Categorías del catálogo (solo MASTER), sin tabla ni sección plegable (plan responsivo de Categorías v2).
// Solo compone: datos y acciones (useCategorias), filtros en la URL, fila‑tarjetas, paginación de 10 y la confirmación.
export default function Categorias() {
  const navigate = useNavigate()
  const datos = useCategorias()
  const filtros = useFiltrosCategorias()
  const { refTitulo, irAlInicio } = useIrAlInicioLista()
  const [aEliminar, setAEliminar] = useState<CategoriaAdmin | null>(null)

  const ordenadas = enOrdenJerarquico(datos.categorias)
  const filtradas = filtrarCategorias(ordenadas, filtros)
  const { pagina, totalPaginas, items } = paginar(filtradas, filtros.pagina, POR_PAGINA_CATEGORIAS)
  const continua = principalQueContinua(filtradas, pagina, POR_PAGINA_CATEGORIAS)

  return (
    <main className="@container w-full max-w-full p-4 @3xl:p-8">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-700">Organización del catálogo</p>
          <h1 className="text-2xl font-bold @3xl:text-3xl">Categorías</h1>
          <p className="mt-2 text-gray-600">Gestión de categorías de productos.</p>
          {!datos.cargando && <p className="mt-1 text-sm text-gray-600">{resumenCategorias(datos.categorias)}</p>}
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/categorias/nueva')}
          aria-label="Nueva categoría"
          title="Nueva categoría"
          className="shrink-0 rounded-full border border-orange-400 bg-action p-4 text-white shadow-[0_0_10px_rgba(249,115,22,0.6)] transition-all hover:bg-action-hover hover:shadow-[0_0_16px_rgba(249,115,22,0.8)]"
        >
          <Plus size={22} aria-hidden="true" />
        </button>
      </div>

      {/* Móvil y tablet angosta: buscador arriba y los dos botones en mitades · desde 48 rem, uno al lado del otro */}
      <div className="mb-4 flex flex-col gap-3 @[48rem]:flex-row @[48rem]:items-center">
        <div className="relative w-full @[48rem]:w-96 @[48rem]:flex-none">
          <Search
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <label htmlFor="filtro-categorias-buscar" className="sr-only">
            Buscar categoría
          </label>
          <input
            id="filtro-categorias-buscar"
            type="search"
            value={filtros.busqueda}
            onChange={(e: ChangeEvent<HTMLInputElement>) => filtros.setBusqueda(e.target.value)}
            placeholder="Buscar categoría..."
            className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3"
          />
        </div>
        <FiltroSegmentado<FiltroEstadoCategoria>
          id="filtro-categorias"
          leyenda="Filtrar por estado"
          opciones={OPCIONES_ESTADO}
          valor={filtros.estado}
          contadores={contarPorEstado(ordenadas, filtros.busqueda)}
          onChange={filtros.setEstado}
          variante="botones"
          distribucion="mitades"
        />
      </div>

      <h2 ref={refTitulo} tabIndex={-1} className="sr-only">
        Categorías, página {pagina} de {totalPaginas}
      </h2>

      {datos.cargando ? (
        <p className="rounded-lg border border-gray-200 bg-white px-6 py-10 text-center text-gray-600">Cargando categorías...</p>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white px-6 py-10">
          <MensajeVacio
            mensaje={datos.categorias.length === 0 ? 'No hay categorías registradas.' : 'No hay categorías para este filtro.'}
          />
        </div>
      ) : (
        <ul aria-label="Categorías" className="flex flex-col gap-2.5">
          {continua && <ContinuaCategoria nombre={continua.nombre} pagina={continua.pagina} />}
          {items.map((c) => (
            <CategoriaCard
              key={c.id}
              categoria={c}
              padre={nombrePadre(c, datos.categorias)}
              onEditar={(x) => navigate(`/admin/categorias/editar/${x.id}`)}
              onCambiarEstado={(x) => void datos.cambiarEstado(x)}
              onEliminar={setAEliminar}
            />
          ))}
        </ul>
      )}

      <Paginacion
        paginaActual={pagina}
        totalElementos={filtradas.length}
        elementosPorPagina={POR_PAGINA_CATEGORIAS}
        cambiarPagina={(nueva) => {
          filtros.setPagina(nueva)
          irAlInicio()
        }}
      />

      <ConfirmarEliminacion
        abierto={aEliminar !== null}
        titulo="Eliminar categoría"
        textoConfirmar="Eliminar"
        mensaje={'¿Eliminar esta categoría? Deja de verse en la tienda y en este panel, y no se puede deshacer. Solo se puede si no tiene productos ni subcategorías. Los pedidos y reportes anteriores la siguen mostrando. Si solo querés ocultarla un tiempo, usá "Deshabilitar".'}
        onConfirmar={() => {
          if (aEliminar !== null) {
            void datos.eliminar(aEliminar.id)
            setAEliminar(null)
          }
        }}
        onCancelar={() => setAEliminar(null)}
      />
    </main>
  )
}
