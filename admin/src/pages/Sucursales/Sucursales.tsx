import type { ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import MensajeVacio from '../../components/MensajeVacio'
import Paginacion from '../../components/Paginacion'
import FiltroSegmentado from '../../components/listas/FiltroSegmentado'
import SucursalCard from '../../components/sucursales/SucursalCard'
import { POR_PAGINA_SUCURSALES } from '../../config/sucursales'
import { useFiltrosSucursales } from '../../hooks/sucursales/useFiltrosSucursales'
import { useSucursales } from '../../hooks/sucursales/useSucursales'
import { useIrAlInicioLista } from '../../hooks/useIrAlInicioLista'
import { paginar } from '../../utils/listas/paginar'
import {
  contarPorEstadoSucursal,
  filtrarSucursales,
  type FiltroEstadoSucursal,
} from '../../utils/sucursales/filtrarSucursales'

const OPCIONES_ESTADO: { valor: FiltroEstadoSucursal; etiqueta: string }[] = [
  { valor: 'activas', etiqueta: 'Activas' },
  { valor: 'inactivas', etiqueta: 'Inactivas' },
]

// Sucursales (solo MASTER), con tarjetas individuales y sin tabla (plan responsivo de Sucursales v3).
// Solo compone: datos y acción (useSucursales), buscador + dos filtros directos con contador, tarjetas y paginación de 10.
export default function Sucursales() {
  const navigate = useNavigate()
  const datos = useSucursales()
  const filtros = useFiltrosSucursales()
  const { refTitulo, irAlInicio } = useIrAlInicioLista()

  const filtradas = filtrarSucursales(datos.sucursales, filtros)
  const { pagina, totalPaginas, items } = paginar(filtradas, filtros.pagina, POR_PAGINA_SUCURSALES)

  return (
    <main className="@container w-full max-w-full p-4 @3xl:p-8">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-700">Administración de sucursales</p>
          <h1 className="text-2xl font-bold @3xl:text-3xl">Sucursales</h1>
          <p className="mt-2 text-gray-600">Gestioná las sucursales y su estado.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/sucursales/nueva')}
          aria-label="Nueva sucursal"
          title="Nueva sucursal"
          className="shrink-0 rounded-full border border-orange-400 bg-action p-4 text-white shadow-[0_0_10px_rgba(249,115,22,0.6)] transition-all hover:bg-action-hover hover:shadow-[0_0_16px_rgba(249,115,22,0.8)]"
        >
          <Plus size={22} aria-hidden="true" />
        </button>
      </div>

      {/* Buscador y dos filtros directos con contador, del mismo tamaño (sin desplegable) */}
      <div className="mb-4 flex flex-col gap-3 @[48rem]:flex-row @[48rem]:items-center">
        <div className="relative w-full @[48rem]:w-96 @[48rem]:flex-none">
          <Search
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <label htmlFor="filtro-sucursales-buscar" className="sr-only">
            Buscar sucursal
          </label>
          <input
            id="filtro-sucursales-buscar"
            type="search"
            value={filtros.busqueda}
            onChange={(e: ChangeEvent<HTMLInputElement>) => filtros.setBusqueda(e.target.value)}
            placeholder="Buscar sucursal..."
            className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3"
          />
        </div>
        <FiltroSegmentado<FiltroEstadoSucursal>
          id="filtro-sucursales"
          leyenda="Filtrar por estado"
          opciones={OPCIONES_ESTADO}
          valor={filtros.estado}
          contadores={contarPorEstadoSucursal(datos.sucursales, filtros.busqueda)}
          onChange={filtros.setEstado}
          variante="botones"
          distribucion="iguales"
        />
      </div>

      <h2 ref={refTitulo} tabIndex={-1} className="sr-only">
        Sucursales, página {pagina} de {totalPaginas}
      </h2>

      {datos.cargando ? (
        <p className="rounded-lg border border-gray-200 bg-white px-6 py-10 text-center text-gray-600">Cargando sucursales...</p>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white px-6 py-10">
          {/* Mismos mensajes de hoy: siempre hay un filtro de estado elegido */}
          <MensajeVacio
            mensaje={datos.sucursales.length === 0 ? 'No hay sucursales registradas.' : 'No hay sucursales con esos filtros.'}
          />
        </div>
      ) : (
        <ul aria-label="Sucursales" className="flex flex-col gap-2.5">
          {items.map((s) => (
            <SucursalCard
              key={s.id}
              sucursal={s}
              onVerDetalles={(x) => navigate(`/admin/sucursales/editar/${x.id}`)}
              onVerStock={(x) => navigate(`/admin/sucursales/${x.id}/stock`)}
              onCambiarEstado={(x) => void datos.cambiarEstado(x)}
            />
          ))}
        </ul>
      )}

      <Paginacion
        paginaActual={pagina}
        totalElementos={filtradas.length}
        elementosPorPagina={POR_PAGINA_SUCURSALES}
        cambiarPagina={(nueva) => {
          filtros.setPagina(nueva)
          irAlInicio()
        }}
      />
    </main>
  )
}
