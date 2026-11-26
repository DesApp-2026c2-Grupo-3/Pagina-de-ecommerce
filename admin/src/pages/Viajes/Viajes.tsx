import { useLocation } from 'react-router-dom'
import MensajeVacio from '../../components/MensajeVacio'
import BarraFiltrosLista from '../../components/listas/BarraFiltrosLista'
import ListaViajes from '../../components/viajes/ListaViajes'
import { POR_PAGINA_VIAJES } from '../../config/viajes'
import { useAuth } from '../../context/AuthContext'
import { useSucursalMaster } from '../../hooks/useSucursalMaster'
import { useViajesEnTiempoReal } from '../../hooks/useViajesEnTiempoReal'
import { useFiltrosViajesUrl } from '../../hooks/viajes/useFiltrosViajesUrl'
import { useResaltadoViajes } from '../../hooks/viajes/useResaltadoViajes'
import { useViajesSucursal } from '../../hooks/viajes/useViajesSucursal'
import type { FiltroEstadoViaje } from '../../types/viaje.types'
import { ESTADOS_VIAJE } from '../../utils/viajes/estadoViaje'
import { contarPorEstadoViaje, filtrarViajes } from '../../utils/viajes/filtrarViajes'

const OPCIONES_ESTADO: { valor: FiltroEstadoViaje; etiqueta: string }[] = [
  { valor: 'todos', etiqueta: 'Todos' },
  ...ESTADOS_VIAJE.map((e) => ({ valor: e.valor, etiqueta: e.plural ?? e.etiqueta })),
]

// Lista de viajes de una sucursal (plan responsivo de Viajes v2). Solo compone:
// datos + tiempo real, filtros en la URL, resaltado de lo nuevo y tarjetas.
// Sin cola (D-V3) y sin acciones de estado: el viaje lo mueve el repartidor (RN-31).
export default function Viajes() {
  const { administrador } = useAuth()
  const location = useLocation()
  const filtros = useFiltrosViajesUrl()
  // MASTER: URL > la que eligió en Pedidos o Viajes > la primera (D-V2, D-V4). Admin: la suya.
  const { esMaster, sucursales, sucursalesListas, errorSucursales, sucursalId, elegir } =
    useSucursalMaster(filtros.sucursal)

  const resaltado = useResaltadoViajes()
  const datos = useViajesSucursal(sucursalId, resaltado.marcar)

  useViajesEnTiempoReal({
    sucursalId,
    pausado: datos.cargando,
    onRefrescar: () => datos.recargar(),
  })

  const filtrados = filtrarViajes(datos.viajes, { busqueda: filtros.busqueda, estado: filtros.estado })
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA_VIAJES))
  const pagina = Math.min(filtros.pagina, totalPaginas)
  const paginaViajes = filtrados.slice((pagina - 1) * POR_PAGINA_VIAJES, pagina * POR_PAGINA_VIAJES)

  const nombreSucursal = esMaster
    ? sucursales?.find((s) => s.id === sucursalId)?.nombre
    : administrador?.sucursal?.nombre
  const error = errorSucursales || datos.errorCarga

  return (
    <main className="@container w-full max-w-full overflow-x-clip p-4 @3xl:p-8">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-orange-700">Gestión de viajes</p>
        <h1 className="text-2xl font-bold @3xl:text-3xl">Viajes</h1>
        <p className="mt-2 text-gray-600">
          {nombreSucursal
            ? `Seguimiento de los viajes de ${nombreSucursal}.`
            : 'Seguimiento de los viajes de la sucursal.'}
        </p>
      </div>

      {!esMaster && sucursalId === null ? (
        <div className="rounded-lg border bg-white px-6 py-10">
          <MensajeVacio mensaje="No tenés una sucursal asignada. Pedile al administrador general que te asigne una." />
        </div>
      ) : (
        <>
          <BarraFiltrosLista<FiltroEstadoViaje>
            sucursales={sucursales}
            sucursalId={sucursalId}
            onSucursal={(id) => {
              elegir(id)
              filtros.setSucursal(id)
            }}
            busqueda={filtros.busqueda}
            onBusqueda={filtros.setBusqueda}
            placeholder="Buscar por repartidor, viaje o pedido"
            filtro={{
              id: 'filtro-estado-viaje',
              leyenda: 'Filtrar por estado',
              opciones: OPCIONES_ESTADO,
              valor: filtros.estado,
              contadores: contarPorEstadoViaje(datos.viajes, filtros.busqueda),
              onChange: filtros.setEstado,
            }}
          />

          {error && (
            <div role="alert" className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <p className="sr-only" aria-live="polite">
            {resaltado.anuncio}
          </p>

          <ListaViajes
            cargando={datos.cargando || !sucursalesListas}
            viajes={paginaViajes}
            totalFiltrados={filtrados.length}
            hayFiltros={filtros.hayFiltros}
            pagina={pagina}
            porPagina={POR_PAGINA_VIAJES}
            onPagina={filtros.setPagina}
            resaltados={resaltado.resaltados}
            sucursalEnlace={esMaster ? sucursalId : null}
            estadoNavegacion={{ desde: `${location.pathname}${location.search}` }}
          />
        </>
      )}
    </main>
  )
}
