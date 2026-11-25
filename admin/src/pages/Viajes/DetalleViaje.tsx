import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import EnlaceVolver from '../../components/navegacion/EnlaceVolver'
import AsistenciaViaje from '../../components/viajes/detalle/AsistenciaViaje'
import DatosViaje from '../../components/viajes/detalle/DatosViaje'
import EncabezadoViaje from '../../components/viajes/detalle/EncabezadoViaje'
import PedidosDelViaje from '../../components/viajes/detalle/PedidosDelViaje'
import { DURACION_CARTEL_REASIGNACION_MS } from '../../config/viajes'
import { useAuth } from '../../context/AuthContext'
import { useSucursalMaster } from '../../hooks/useSucursalMaster'
import { useViajesEnTiempoReal } from '../../hooks/useViajesEnTiempoReal'
import { useViajeDetalle } from '../../hooks/viajes/useViajeDetalle'
import type { RespuestaReasignacion } from '../../types/viaje.types'
import { leerIdPositivo } from '../../utils/navegacion/leerIdPositivo'
import { PARAM_SUCURSAL } from '../../utils/navegacion/parametros'
import { destinoVolverViaje } from '../../utils/navegacion/rutasViaje'
import { requiereAsistencia } from '../../utils/viajes/estadoViaje'
import { textoReasignacionHecha } from '../../utils/viajes/reasignacion'

// Página propia de un viaje (plan responsivo de Viajes v2). Sin modales.
// Solo lectura salvo la asistencia: ahí se reasigna en el lugar (RN-32, RN-55).
export default function DetalleViaje() {
  const { viajeId: parametro } = useParams()
  const viajeId = leerIdPositivo(parametro ?? null)
  const location = useLocation()
  const { administrador } = useAuth()
  const refTitulo = useRef<HTMLHeadingElement | null>(null)

  const sucursalUrl = leerIdPositivo(new URLSearchParams(location.search).get(PARAM_SUCURSAL))
  const { esMaster, sucursales, sucursalId } = useSucursalMaster(sucursalUrl)
  const { viaje, carga, error, recargar } = useViajeDetalle(viajeId, sucursalId)

  useViajesEnTiempoReal({ sucursalId, pausado: carga === 'cargando', onRefrescar: recargar })

  const volverA = destinoVolverViaje(location.state, esMaster ? sucursalId : null)
  const nombreSucursal = esMaster
    ? sucursales?.find((s) => s.id === sucursalId)?.nombre
    : administrador?.sucursal?.nombre

  // D-22: el cartel de la reasignación se cierra solo
  const [mensaje, setMensaje] = useState('')
  useEffect(() => {
    if (!mensaje) return
    const t = window.setTimeout(() => setMensaje(''), DURACION_CARTEL_REASIGNACION_MS)
    return () => window.clearTimeout(t)
  }, [mensaje])

  const onReasignado = useCallback(
    (r: RespuestaReasignacion) => {
      const nuevo = `${r.viaje.Repartidor.nombre} ${r.viaje.Repartidor.apellido}`
      const anterior = `${r.repartidorAnterior.nombre} ${r.repartidorAnterior.apellido}`
      setMensaje(textoReasignacionHecha(r.viaje.id, nuevo, anterior))
      void recargar()
    },
    [recargar],
  )

  // Al abrir: título de la pestaña y foco. Si vino por «Atender asistencia», va a esa sección.
  const cargado = carga === 'listo'
  useEffect(() => {
    if (!cargado || viajeId === null) return
    const anterior = document.title
    document.title = `Viaje #${viajeId} · Admin`
    const seccion = location.hash === '#asistencia' ? document.getElementById('asistencia') : null
    if (seccion) seccion.scrollIntoView({ block: 'start' })
    refTitulo.current?.focus({ preventScroll: Boolean(seccion) })
    return () => {
      document.title = anterior
    }
  }, [cargado, viajeId, location.hash])

  return (
    <main className="@container w-full max-w-full p-4 @3xl:p-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <EnlaceVolver to={volverA} texto="Volver a viajes" />

        {mensaje && (
          <div role="status" className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-800">
            {mensaje}
          </div>
        )}

        {carga === 'cargando' && <p className="text-gray-600">Cargando viaje...</p>}

        {carga === 'no-encontrado' && (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-10 text-center">
            <h1 className="text-xl font-bold text-gray-900">Viaje no encontrado</h1>
            <p className="mt-2 text-gray-600">Puede que no exista o que no corresponda a esta sucursal.</p>
          </div>
        )}

        {carga === 'error' && (
          <div role="alert" className="flex flex-wrap items-center gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">
            <span className="min-w-0 flex-1">{error}</span>
            <button
              type="button"
              onClick={() => void recargar()}
              className="min-h-11 rounded-lg border border-red-300 bg-white px-4 font-semibold hover:bg-red-100"
            >
              Reintentar
            </button>
          </div>
        )}

        {viaje && cargado && (
          <>
            <EncabezadoViaje viaje={viaje} nombreSucursal={nombreSucursal} refTitulo={refTitulo} />
            {error && (
              <p role="alert" className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                No se pudo actualizar el viaje: {error}
              </p>
            )}
            {/* Escritorio: pedidos a la izquierda, repartidor y asistencia a la derecha.
                Tablet y móvil: la asistencia primero, que es lo que hay que resolver. */}
            <div className="grid gap-4 @5xl:grid-cols-[minmax(0,1fr)_26rem] @5xl:items-start @5xl:gap-6">
              <div className="flex min-w-0 flex-col gap-4 @5xl:order-2">
                {requiereAsistencia(viaje) && (
                  <AsistenciaViaje viaje={viaje} onReasignado={onReasignado} onDesactualizado={() => void recargar()} />
                )}
                <DatosViaje viaje={viaje} />
              </div>
              <div className="min-w-0 @5xl:order-1">
                <PedidosDelViaje
                  pedidos={viaje.Pedidos ?? []}
                  sucursalEnlace={esMaster ? sucursalId : null}
                  desde={`${location.pathname}${location.search}`}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
