
import { useCallback, useEffect, useState } from 'react'
import {
  RefreshCw,
  Truck,
  ClipboardList,
  AlertTriangle,
  PackageCheck,
  Clock3,
  CheckCircle2,
  MapPinned,
  Bike,
} from 'lucide-react'

import {
  obtenerViajeActivo,
  solicitarAyuda,
  iniciarViaje,
  quitarPedidoDelViaje,
  confirmarRecepcion
} from '../../services/viajeService'

import type {
  ViajeActivo,
  SolicitudAsistencia,
  SolicitudAsistenciaPayload,
} from '../../types/viaje.types'

import TarjetaPedidoViaje from '../../components/viaje/TarjetaPedidoViaje'
import { actualizarEstadoPedido } from '../../services/pedidoService'
import ModalQuitarPedido from '../../components/viaje/ModalQuitarPedido'
import ModalSolicitudAyuda from '../../components/viaje/ModalSolicitudAyuda'

const obtenerUbicacionActual = (): Promise<{
  latitud: number
  longitud: number
}> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Tu navegador no permite obtener la ubicación.'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        resolve({
          latitud: posicion.coords.latitude,
          longitud: posicion.coords.longitude,
        })
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('Debés permitir el acceso a tu ubicación para solicitar asistencia.'))
            break
          case error.POSITION_UNAVAILABLE:
            reject(new Error('No se pudo determinar tu ubicación actual.'))
            break
          case error.TIMEOUT:
            reject(new Error('Se agotó el tiempo para obtener tu ubicación. Intentá nuevamente.'))
            break
          default:
            reject(new Error('Ocurrió un error al obtener tu ubicación.'))
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  })
}

export default function Viaje() {
  const [viaje, setViaje] = useState<ViajeActivo | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [pedidoProcesando, setPedidoProcesando] = useState<number | null>(null)
  const [errorAccion, setErrorAccion] = useState('')

  const [modalAyuda, setModalAyuda] = useState(false)
  const [enviandoAyuda, setEnviandoAyuda] = useState(false)
  const [errorAyuda, setErrorAyuda] = useState('')

  const [iniciandoViaje, setIniciandoViaje] = useState(false)
  const [errorInicio, setErrorInicio] = useState('')

  const [pedidoAQuitar, setPedidoAQuitar] = useState<number | null>(null)
  const [quitandoPedido, setQuitandoPedido] = useState(false)
  const [errorQuitar, setErrorQuitar] = useState('')

  const [confirmandoRecepcion, setConfirmandoRecepcion] = useState(false)
  const [errorRecepcion, setErrorRecepcion] = useState('')

  const cargarViaje = useCallback(async () => {
    try {
      setCargando(true)
      setError('')

      const datos = await obtenerViajeActivo()
      setViaje(datos)
    } catch {
      setError('No se pudo obtener la información del viaje.')
    } finally {
      setCargando(false)
    }
  }, [])

  const cambiarEstadoPedido = async (
    pedidoId: number,
    estado: 'En camino' | 'Entregado'
  ) => {
    try {
      setPedidoProcesando(pedidoId)
      setErrorAccion('')

      await actualizarEstadoPedido(pedidoId, estado)

      const datos = await obtenerViajeActivo()
      setViaje(datos)
    } catch (error) {
      setErrorAccion(
        error instanceof Error
          ? error.message
          : 'No se pudo actualizar el estado del pedido.'
      )
    } finally {
      setPedidoProcesando(null)
    }
  }

  const manejarConfirmarRecepcion = async () => {
    try {
      setConfirmandoRecepcion(true)
      setErrorRecepcion('')

      const respuesta = await confirmarRecepcion()

      setViaje((actual) =>
        actual
          ? {
              ...actual,
             recepcionConfirmada: respuesta.recepcionConfirmada,
            }
          : actual
      )
    } catch (error) {
      setErrorRecepcion(
        error instanceof Error
          ? error.message
          : 'No se pudo confirmar la recepción de los pedidos.'
      )
    } finally {
      setConfirmandoRecepcion(false)
    }
  }

  const manejarQuitarPedido = (pedidoId: number) => {
    setErrorQuitar('')
    setPedidoAQuitar(pedidoId)
  }

  const confirmarQuitarPedido = async () => {
    if (pedidoAQuitar === null) return

    try {
      setQuitandoPedido(true)
      setErrorQuitar('')

      await quitarPedidoDelViaje(pedidoAQuitar)

      setPedidoAQuitar(null)
      await cargarViaje()
    } catch (error) {
      setErrorQuitar(
        error instanceof Error
          ? error.message
          : 'No se pudo quitar el pedido del viaje.'
      )
    } finally {
      setQuitandoPedido(false)
    }
  }

  const manejarInicioViaje = async () => {
    try {
      setIniciandoViaje(true)
      setErrorInicio('')

      await iniciarViaje()

      await cargarViaje()
    } catch (error) {
      setErrorInicio(
        error instanceof Error
          ? error.message
          : 'No se pudo iniciar el viaje.'
      )
    } finally {
      setIniciandoViaje(false)
    }
  }

  const enviarSolicitudAyuda = async (datos: SolicitudAsistencia) => {
    try {
      setEnviandoAyuda(true)
      setErrorAyuda('')

      const ubicacion = await obtenerUbicacionActual()

      const payload: SolicitudAsistenciaPayload = {
        ...datos,
        ...ubicacion,
      }

      const respuesta = await solicitarAyuda(payload)

      setViaje((actual) =>
        actual ? { ...actual, ...respuesta.viaje } : actual
      )

      setModalAyuda(false)
    } catch (error) {
      setErrorAyuda(
        error instanceof Error
          ? error.message
          : 'No se pudo enviar la solicitud de asistencia.'
      )
    } finally {
      setEnviandoAyuda(false)
    }
  }

  const todosRetirados =
    viaje?.Pedidos.every((pedido) => pedido.estado === 'En camino') ?? false

  const tieneUbicacionAsistencia =
    viaje?.latitudAsistencia != null &&
    viaje?.longitudAsistencia != null &&
    viaje.latitudAsistencia !== '' &&
    viaje.longitudAsistencia !== '' &&
    Number.isFinite(Number(viaje.latitudAsistencia)) &&
    Number.isFinite(Number(viaje.longitudAsistencia))

  const urlUbicacionAsistencia = tieneUbicacionAsistencia
    ? `https://www.google.com/maps?q=${viaje.latitudAsistencia},${viaje.longitudAsistencia}`
    : null

  useEffect(() => {
    cargarViaje()
  }, [cargarViaje])

  if (cargando) {
    return (
      <div className="flex min-h-[350px] flex-col items-center justify-center gap-4">
        <div className="rounded-2xl bg-orange-100 p-4">
          <Truck className="animate-pulse text-orange-500" size={32} />
        </div>
        <p className="text-sm font-medium text-slate-500">
          Cargando información de tu viaje...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100">
          <AlertTriangle className="text-red-600" size={27} />
        </div>

        <h3 className="mt-4 text-lg font-bold text-slate-900">
          No pudimos cargar tu viaje
        </h3>

        <p className="mt-2 text-sm text-red-600">{error}</p>

        <button
          onClick={cargarViaje}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <RefreshCw size={16} />
          Intentar nuevamente
        </button>
      </div>
    )
  }

  if (!viaje) {
    return (
      
<div className="relative overflow-hidden rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-100 via-orange-50 to-amber-100 px-6 py-16 text-center shadow-lg">

  {/* Decoración */}
  <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-orange-400/20 blur-3xl" />
  <div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-amber-400/20 blur-3xl" />

  <div className="relative">
    {/* Icono */}
    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-orange-200 bg-white/70 shadow-md">
      <Bike className="text-orange-600" size={40} />
    </div>

    {/* Estado */}
    <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/60 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-orange-700">
      <span className="h-2 w-2 rounded-full bg-orange-500" />
      Sin actividad
    </span>

    {/* Título */}
    <h2 className="mt-4 text-2xl font-extrabold text-slate-800">
      No tenés un viaje en curso
    </h2>

    {/* Descripción */}
    <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600">
      Cuando tomes pedidos disponibles, tu viaje aparecerá acá para que puedas organizar y seguir tus entregas.
    </p>

    {/* Información inferior */}
    <div className="mt-8 flex justify-center">
      <div className="flex items-center gap-2 rounded-xl border border-orange-200 bg-white/70 px-4 py-3 text-sm text-slate-600 shadow-sm">
        <ClipboardList size={18} className="text-orange-600" />
        Tus próximos pedidos aparecerán aquí
      </div>
    </div>
  </div>
</div>

    )
  }

  const estadoVisual = {
    preparando: {
      titulo: 'Preparando viaje',
      descripcion: 'Retirá todos tus pedidos para comenzar el recorrido.',
      etiqueta: 'En preparación',
      icono: <Clock3 size={20} />,
      color: 'text-blue-600',
      fondo: 'bg-blue-500/10',
      punto: 'bg-blue-400',
    },
    activo: {
      titulo: '¡Estás en camino!',
      descripcion: 'Tu recorrido está activo. Completá las entregas pendientes.',
      etiqueta: 'En curso',
      icono: <Truck size={20} />,
      color: 'text-emerald-700',
      fondo: 'bg-emerald-600/10',
      punto: 'bg-emerald-400',
    },
    'requiere asistencia': {
      titulo: 'Asistencia solicitada',
      descripcion: 'Administración está revisando tu solicitud.',
      etiqueta: 'Requiere asistencia',
      icono: <AlertTriangle size={20} />,
      color: 'text-amber-500',
      fondo: 'bg-amber-500/10',
      punto: 'bg-amber-400',
    },
    cancelado: {
      titulo: 'Viaje cancelado',
      descripcion: 'Este viaje fue cancelado por administración.',
      etiqueta: 'Cancelado',
      icono: <AlertTriangle size={20} />,
      color: 'text-red-500',
      fondo: 'bg-red-500/10',
      punto: 'bg-red-400',
    },
    finalizado: {
      titulo: '¡Viaje finalizado!',
      descripcion: 'Completaste todas las entregas de este recorrido.',
      etiqueta: 'Finalizado',
      icono: <CheckCircle2 size={20} />,
      color: 'text-emerald-600',
      fondo: 'bg-emerald-700/10',
      punto: 'bg-emerald-600',
  },
  }[viaje.estado] ?? {
    titulo: 'Mi viaje',
    descripcion: 'Información de tu recorrido.',
    etiqueta: viaje.estado,
    icono: <Truck size={20} />,
    color: 'text-orange-300',
    fondo: 'bg-orange-500/10',
    punto: 'bg-orange-400',
  }

  return (
    <div className="space-y-7">

      {/* Encabezado */}
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            <p className="text-xs font-bold uppercase tracking-widest text-orange-600">
              Panel de repartidor
            </p>
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Mi viaje
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Seguimiento y administración de tus pedidos asignados.
          </p>
        </div>

        <button
          onClick={cargarViaje}
          className="group flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"
        >
          <RefreshCw
            size={17}
            className="transition-transform group-hover:rotate-180"
          />
          Actualizar
        </button>
      </section>

      
{/* Banner principal */}
  <section className="relative overflow-hidden rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-100 via-orange-50 to-amber-100 p-6 shadow-lg sm:p-8">

{/* Decoración */}
  <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full bg-orange-400/20 blur-3xl" />
  <div className="absolute -bottom-28 right-1/3 h-56 w-56 rounded-full bg-amber-400/20 blur-3xl" />

  <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-orange-200 bg-white/70 px-3 py-1 text-xs font-bold text-slate-700">
          VIAJE #{viaje.id}
        </span>

        <span className={`inline-flex items-center gap-2 rounded-full ${estadoVisual.fondo} px-3 py-1 text-xs font-bold ${estadoVisual.color}`}>
          <span className={`h-2 w-2 rounded-full ${estadoVisual.punto}`} />
          {estadoVisual.etiqueta}
        </span>
      </div>

      <h3 className="mt-5 text-2xl font-extrabold text-slate-800 sm:text-3xl">
        {estadoVisual.titulo}
      </h3>

      <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-600">
        {estadoVisual.descripcion}
      </p>

      <div className="mt-6 flex flex-wrap gap-5">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <PackageCheck size={18} className="text-orange-600" />
          <span>
            <strong className="text-slate-800">{viaje.Pedidos.length}</strong>{' '}
            {viaje.Pedidos.length === 1 ? 'pedido' : 'pedidos'}
          </span>
        </div>

        {viaje.fechaInicio && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Clock3 size={18} className="text-orange-600" />
            <span>
              Inicio:{' '}
              <strong className="text-slate-800">
                {new Date(viaje.fechaInicio).toLocaleString('es-AR')}
              </strong>
            </span>
          </div>
        )}
      </div>
    </div>

    <div className="hidden shrink-0 items-center justify-center sm:flex">
      <div className="flex h-28 w-28 items-center justify-center rounded-full border border-orange-400/30 bg-white/40">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/30">
          {estadoVisual.icono}
          <span className="sr-only">{estadoVisual.etiqueta}</span>
        </div>
      </div>
    </div>
  </div>
</section>


      {/* Pedidos del viaje */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">
              Pedidos del viaje
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Gestioná cada pedido de forma individual.
            </p>
          </div>

          <span className="rounded-xl bg-orange-50 px-3 py-2 text-sm font-bold text-orange-600">
            {viaje.Pedidos.length} en total
          </span>
        </div>

        {errorAccion && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <AlertTriangle className="mt-0.5 shrink-0 text-red-500" size={18} />
            <p className="text-sm text-red-600">{errorAccion}</p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {viaje.Pedidos.map((pedido) => (
            <TarjetaPedidoViaje
              key={pedido.id}
              pedido={pedido}
              onActualizarEstado={cambiarEstadoPedido}
              procesando={pedidoProcesando === pedido.id}
              puedeRetirar={viaje.estado === 'preparando'}
              puedeEntregar={viaje.estado === 'activo' && viaje.recepcionConfirmada}
              puedeQuitar={viaje.estado === 'preparando'}
              onQuitarPedido={manejarQuitarPedido}
            />
          ))}
        </div>

        {pedidoAQuitar !== null && (
          <ModalQuitarPedido
            pedidoId={pedidoAQuitar}
            procesando={quitandoPedido}
            error={errorQuitar}
            onCancelar={() => {
              setPedidoAQuitar(null)
              setErrorQuitar('')
            }}
            onConfirmar={confirmarQuitarPedido}
          />
        )}
      </section>

      {/* Acciones e información */}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-orange-100 p-3">
              <MapPinned className="text-orange-600" size={23} />
            </div>

            <div>
              <h3 className="font-extrabold text-slate-900">
                Información del recorrido
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Estado actual y acciones disponibles.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-5 sm:p-6">

          {/* Preparando */}
          {viaje.estado === 'preparando' && (
            <>
              
            <div className="rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-orange-100 p-2.5">
                  <PackageCheck className="text-orange-600" size={22} />
                </div>

                <div>
                  <h4 className="font-bold text-slate-800">
                    Prepará tus pedidos
                  </h4>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    Retirá todos los pedidos de la sucursal. Una vez que
                    estén en camino, vas a poder iniciar tu recorrido.
                  </p>
                </div>
              </div>
            </div>


              {errorInicio && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {errorInicio}
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-sm">
                  {todosRetirados ? (
                    <>
                      <CheckCircle2 className="text-emerald-500" size={19} />
                      <span className="font-medium text-emerald-700">
                        Todos los pedidos fueron retirados.
                      </span>
                    </>
                  ) : (
                    <>
                      <Clock3 className="text-amber-500" size={19} />
                      <span className="text-slate-500">
                        Todavía tenés pedidos por retirar.
                      </span>
                    </>
                  )}
                </div>

                <button
                  onClick={manejarInicioViaje}
                  disabled={!todosRetirados || iniciandoViaje}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:-translate-y-0.5 hover:from-orange-600 hover:to-orange-700 hover:shadow-orange-500/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  <Truck size={18} />
                  {iniciandoViaje ? 'Iniciando...' : 'Iniciar viaje'}
                </button>
              </div>
            </>
          )}

          {/* Activo */}
          {viaje.estado === 'activo' && (
            <>

            {!viaje.recepcionConfirmada && (
              <div className="rounded-2xl border border-amber-300 bg-gradient-to-r
               from-amber-50 to-orange-50 p-5">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 rounded-xl bg-amber-100 p-2.5">
                    <PackageCheck className="text-amber-700" size={23} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-amber-950">
                      Recepción de pedidos pendiente
                    </h4>

                    <p className="mt-1 text-sm leading-relaxed text-amber-900">
                    Este viaje fue reasignado por asistencia. Dirigite al punto donde
                    se encuentra el repartidor anterior para recoger los pedidos y
                    verificar que recibiste todos correctamente.
                    </p>

                    <p className="mt-2 text-xs text-amber-700">
                    La ubicación corresponde al momento en que se solicitó asistencia.
                    Debés confirmar la recepción antes de continuar con las entregas.
                    </p>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    {urlUbicacionAsistencia && (
                    <a href={urlUbicacionAsistencia}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2
                    rounded-xl border border-amber-300 bg-white px-5 py-3 text-sm
                    font-bold text-amber-800 transition hover:bg-amber-100">
                      <MapPinned size={17} />
                      Cómo llegar
                    </a>
                  )}

                  <button onClick={manejarConfirmarRecepcion}
                  disabled={confirmandoRecepcion}
                  className="inline-flex items-center justify-center gap-2
                  rounded-xl bg-amber-600 px-5 py-3 text-sm font-bold text-white
                  shadow-sm transition hover:bg-amber-700 disabled:cursor-not-allowed
                  disabled:opacity-50">
                    <CheckCircle2 size={18} />
                    {confirmandoRecepcion
                      ? 'Confirmando recepción...'
                      : 'Confirmar recepción'}
                  </button>
                </div>

                {errorRecepcion && (
                  <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 
                  text-sm text-red-600">
                    {errorRecepcion}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

              <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-emerald-100 p-2.5">
                    <Truck className="text-emerald-600" size={22} />
                  </div>

                  <div>
                    <h4 className="font-bold text-emerald-950">
                      ¡Tu viaje está en marcha!
                    </h4>
                    <p className="mt-1 text-sm leading-relaxed text-emerald-800">
                      Gestioná las entregas pendientes y actualizá cada pedido
                      cuando llegue a destino.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  ¿Tuviste algún inconveniente durante el recorrido?
                </p>

                <button
                  onClick={() => {
                    setErrorAyuda('')
                    setModalAyuda(true)
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-red-600/15 transition hover:-translate-y-0.5 hover:bg-red-700"
                >
                  <AlertTriangle size={18} />
                  Solicitar asistencia
                </button>
              </div>
            </>
          )}

          {/* Requiere asistencia */}
          {viaje.estado === 'requiere asistencia' && (
            <div className="rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-amber-100 p-2.5">
                  <AlertTriangle className="text-amber-600" size={22} />
                </div>

                <div className="min-w-0">
                  <h4 className="font-bold text-amber-950">
                    Solicitud de asistencia enviada
                  </h4>

                  <p className="mt-2 text-sm text-amber-900">
                    <strong>Motivo:</strong> {viaje.motivoAsistencia}
                  </p>

                  {viaje.comentarioAsistencia && (
                    <p className="mt-2 text-sm leading-relaxed text-amber-800">
                      <strong>Comentario:</strong>{' '}
                      {viaje.comentarioAsistencia}
                    </p>
                  )}

                  <div className="mt-4 flex items-center gap-2 border-t border-amber-200 pt-3 text-xs font-medium text-amber-700">
                    <Clock3 size={15} />
                    Esperá a que administración revise tu solicitud.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Modal de asistencia */}
      {modalAyuda && (
        <ModalSolicitudAyuda
          enviando={enviandoAyuda}
          error={errorAyuda}
          onCerrar={() => setModalAyuda(false)}
          onConfirmar={enviarSolicitudAyuda}
        />
      )}
    </div>
  )
}
