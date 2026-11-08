
import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, Truck, ClipboardList, AlertTriangle } from 'lucide-react'

import { obtenerViajeActivo, solicitarAyuda, iniciarViaje, quitarPedidoDelViaje } from '../../services/viajeService'
import type { ViajeActivo, SolicitudAsistencia, SolicitudAsistenciaPayload } from '../../types/viaje.types'
import TarjetaPedidoViaje from '../../components/viaje/TarjetaPedidoViaje'
import { actualizarEstadoPedido } from '../../services/pedidoService'
import ModalQuitarPedido from '../../components/viaje/ModalQuitarPedido'

import  ModalSolicitudAyuda  from '../../components/viaje/ModalSolicitudAyuda'

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

  const cambiarEstadoPedido = async ( pedidoId: number, estado: 'En camino' | 'Entregado') => {
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

  useEffect(() => {
    cargarViaje()
  }, [cargarViaje])

  if (cargando) {
    return (
      <div className="py-16 text-center text-sm text-slate-500">
        Cargando viaje...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={cargarViaje}
          className="mt-3 text-sm font-semibold text-red-700 underline"
        >
          Intentar nuevamente
        </button>
      </div>
    )
  }

  if (!viaje) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <ClipboardList className="mx-auto text-slate-300" size={42} />
        <h2 className="mt-4 font-bold text-slate-800">
          No tenés un viaje en curso
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Cuando inicies un viaje, sus pedidos aparecerán acá.
        </p>
      </div>
    )
  }

  const obtenerUbicacionActual = (): Promise<{latitud: number,longitud: number}> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Tu navegador no permite obtener la ubicación.'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitud: position.coords.latitude,
            longitud: position.coords.longitude,
          })
        },
        (error) => {
          let mensaje = 'No se pudo obtener tu ubicación.'

          if (error.code === error.PERMISSION_DENIED) {
            mensaje = 'Debés permitir el acceso a tu ubicación para solicitar asistencia.'
          } else if (error.code === error.TIMEOUT) {
            mensaje = 'Se agotó el tiempo de espera al obtener tu ubicación.'
          }

          reject(new Error(mensaje))
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      )
    })
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

const todosRetirados = viaje?.Pedidos.every(
  (pedido) => pedido.estado === 'En camino'
) ?? false

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Mi viaje
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Seguimiento de tus pedidos asignados.
          </p>
        </div>

        <button
          onClick={cargarViaje}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <RefreshCw size={17} />
          Actualizar
        </button>
      </section>

      <section className="rounded-2xl border border-orange-200 bg-orange-50 p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-orange-100 p-3">
            <Truck className="text-orange-600" size={24} />
          </div>

          <div>
            <p className="text-sm font-medium text-orange-700">
              {viaje.estado === 'preparando' ? 'Preparando viaje' 
              : viaje.estado === 'activo'
              ? 'Viaje activo' : 'Requiere asistencia'}
            </p>
            <h3 className="text-xl font-bold text-slate-900">
              Viaje #{viaje.id}
            </h3>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-6 text-sm text-slate-600">
          {viaje.fechaInicio && (
          <p>
            Inicio:{' '}
            <strong>
              {new Date(viaje.fechaInicio).toLocaleString('es-AR')}
            </strong>
          </p>
          )}
          <p>
            Pedidos: <strong>{viaje.Pedidos.length}</strong>
          </p>
        </div>

        {viaje.estado === 'preparando' && (
          <div className="mt-5 space-y-3">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="font-semibold text-blue-900">
                Preparando tu viaje
              </p>
              <p className="mt-1 text-sm text-blue-800">
                Retirá todos los pedidos de la sucursal. Cuando los tengas,
                podrás iniciar el recorrido.
              </p>
            </div>
            
            {errorInicio && (
              <p className="text-sm text-red-600">{errorInicio}</p>
              )
            }

            <button onClick={manejarInicioViaje} disabled={!todosRetirados || iniciandoViaje}
              className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5
              text-sm font-semibold text-white transition hover:bg-orange-600
              disabled:cursor-not-allowed disabled:opacity-50">
              <Truck size={18} /> 
              {iniciandoViaje
                ? 'Iniciando...'
                : 'Iniciar viaje'}
            </button>


            {!todosRetirados && (
              <p className="text-xs text-slate-500">
                Tenés que retirar todos los pedidos antes de iniciar.
              </p>
              )
            }
          </div>
        )}

{/*Boton de auxilio(/*\-/*\) */}

        {viaje.estado === 'activo' && (
          <button onClick={() => {
            setErrorAyuda('')
            setModalAyuda(true)
          }}
          className="mt-5 flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold
          text-white transition hover:bg-red-700">
            <AlertTriangle size={18} /> Solicitar ayuda
          </button>
        )}
        

        {viaje.estado === 'requiere asistencia' && (
          <div className="mt-5 rounded-xl border border-amber-300 bg-amber-100 p-4">
            <p className="font-semibold text-amber-900">
              Solicitud de asistencia enviada
            </p>

            <p className="mt-1 text-sm text-amber-800">
              Motivo: {viaje.motivoAsistencia}
            </p>

            {viaje.comentarioAsistencia && (
              <p className="mt-1 text-sm text-amber-800">
                Comentario: {viaje.comentarioAsistencia}
              </p>
            )}

            <p className="mt-2 text-xs text-amber-700">
              Esperá a que administración revise tu solicitud.
            </p>
          </div>
          )}
        
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900">
          Pedidos del viaje
        </h3>
        
        {errorAccion && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-600">{errorAccion}</p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {viaje.Pedidos.map((pedido) => (
            <TarjetaPedidoViaje key={pedido.id} pedido={pedido}
              onActualizarEstado={cambiarEstadoPedido}
              procesando={pedidoProcesando === pedido.id}
              puedeRetirar={viaje.estado === 'preparando'}
              puedeEntregar={viaje.estado === 'activo'}
              puedeQuitar={viaje.estado === 'preparando'}
              onQuitarPedido={manejarQuitarPedido}
            />
            ))
          }
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
