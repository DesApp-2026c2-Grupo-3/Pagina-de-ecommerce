import { useState } from 'react'
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

import type { SolicitudAsistencia } from '../../types/viaje.types'

import TarjetaPedidoViaje from '../../components/viaje/TarjetaPedidoViaje'
import ModalQuitarPedido from '../../components/viaje/ModalQuitarPedido'
import ModalSolicitudAyuda from '../../components/viaje/ModalSolicitudAyuda'
import Boton from '../../components/ui/Boton'
import BarraAccionFija from '../../components/ui/BarraAccionFija'
import { useViajeActivo } from '../../hooks/useViajeActivo'
import { useAvisoAccion } from '../../hooks/useAvisoAccion'

const mensajeDe = (error: unknown, porDefecto: string) =>
  error instanceof Error ? error.message : porDefecto

export default function Viaje() {
  const {
    viaje,
    cargando,
    error,
    recargar: cargarViaje,
    retirar,
    entregar,
    quitar,
    iniciar,
    confirmarRecepcion,
    pedirAyuda,
  } = useViajeActivo()
  const aviso = useAvisoAccion()

  const [pedidoProcesando, setPedidoProcesando] = useState<number | null>(null)

  const [modalAyuda, setModalAyuda] = useState(false)
  const [enviandoAyuda, setEnviandoAyuda] = useState(false)
  const [errorAyuda, setErrorAyuda] = useState('')

  const [iniciandoViaje, setIniciandoViaje] = useState(false)

  const [pedidoAQuitar, setPedidoAQuitar] = useState<number | null>(null)
  const [quitandoPedido, setQuitandoPedido] = useState(false)
  const [errorQuitar, setErrorQuitar] = useState('')

  const [confirmandoRecepcion, setConfirmandoRecepcion] = useState(false)

  // Plan UX, v1.6: las acciones que salen bien no se anuncian (la pantalla ya cambia);
  // los errores sí, con un toast. Los de los modales se muestran dentro del modal.
  const accionSobrePedido = async (pedidoId: number, ejecutar: (id: number) => Promise<void>, fallo: string) => {
    try {
      setPedidoProcesando(pedidoId)
      await ejecutar(pedidoId)
    } catch (error) {
      aviso.error(fallo, error)
    } finally {
      setPedidoProcesando(null)
    }
  }

  const manejarRetirar = (pedidoId: number) => accionSobrePedido(pedidoId, retirar, 'No se pudo retirar el pedido')
  const manejarEntregar = (pedidoId: number) =>
    accionSobrePedido(pedidoId, entregar, 'No se pudo registrar la entrega')

  const manejarConfirmarRecepcion = async () => {
    try {
      setConfirmandoRecepcion(true)
      await confirmarRecepcion()
    } catch (error) {
      aviso.error('No se pudo confirmar la recepción', error)
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
      await quitar(pedidoAQuitar)
      setPedidoAQuitar(null)
    } catch (error) {
      setErrorQuitar(mensajeDe(error, 'No se pudo quitar el pedido del viaje.'))
    } finally {
      setQuitandoPedido(false)
    }
  }

  const manejarInicioViaje = async () => {
    try {
      setIniciandoViaje(true)
      await iniciar()
    } catch (error) {
      aviso.error('No se pudo iniciar el viaje', error)
    } finally {
      setIniciandoViaje(false)
    }
  }

  const enviarSolicitudAyuda = async (datos: SolicitudAsistencia) => {
    try {
      setEnviandoAyuda(true)
      setErrorAyuda('')
      await pedirAyuda(datos)
      setModalAyuda(false)
    } catch (error) {
      setErrorAyuda(mensajeDe(error, 'No se pudo enviar la solicitud de asistencia.'))
    } finally {
      setEnviandoAyuda(false)
    }
  }

  // D-07: se puede salir cuando todos los pedidos fueron retirados del local
  const todosRetirados =
    viaje?.Pedidos.every((pedido) => pedido.retiradoEn !== null) ?? false

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

  if (cargando) {
    return (
      <div className="flex min-h-[350px] flex-col items-center justify-center gap-4">
        <div className="rounded-2xl bg-orange-100 p-4">
          <Truck className="animate-pulse text-orange-500" size={32} />
        </div>
        <p className="text-sm font-medium text-slate-600">
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

        <div className="mt-5 flex justify-center">
          <Boton icono={RefreshCw} onClick={cargarViaje}>
            Intentar nuevamente
          </Boton>
        </div>
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
      color: 'text-blue-700',
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
      color: 'text-amber-800',
      fondo: 'bg-amber-500/10',
      punto: 'bg-amber-400',
    },
    cancelado: {
      titulo: 'Viaje cancelado',
      descripcion: 'Este viaje fue cancelado por administración.',
      etiqueta: 'Cancelado',
      icono: <AlertTriangle size={20} />,
      color: 'text-red-700',
      fondo: 'bg-red-500/10',
      punto: 'bg-red-400',
    },
    finalizado: {
      titulo: '¡Viaje finalizado!',
      descripcion: 'Completaste todas las entregas de este recorrido.',
      etiqueta: 'Finalizado',
      icono: <CheckCircle2 size={20} />,
      color: 'text-emerald-700',
      fondo: 'bg-emerald-700/10',
      punto: 'bg-emerald-600',
  },
  }[viaje.estado] ?? {
    titulo: 'Mi viaje',
    descripcion: 'Información de tu recorrido.',
    etiqueta: viaje.estado,
    icono: <Truck size={20} />,
    color: 'text-orange-700',
    fondo: 'bg-orange-500/10',
    punto: 'bg-orange-400',
  }

  // Una sola línea que resume el viaje y lo que hay que hacer ahora
  const ayudaDelEstado =
    viaje.estado === 'preparando'
      ? todosRetirados
        ? 'Ya retiraste todo: podés iniciar el viaje.'
        : 'Retirá todos los pedidos para iniciar el viaje.'
      : viaje.estado === 'requiere asistencia'
        ? `Asistencia solicitada: ${viaje.motivoAsistencia ?? 'en revisión'}`
        : estadoVisual.descripcion

  // Barra del viaje: flota pegada arriba en el celular (abajo está el menú) y abajo en escritorio.
  // Tiene que ser hija directa de la página para que "sticky" la acompañe al desplazarse.
  const barraViaje = (lugar: 'arriba' | 'abajo') => (
    <section
      aria-label={`Viaje #${viaje.id}`}
      className={
        lugar === 'arriba'
          ? 'sticky top-[var(--alto-encabezado,4.5rem)] z-20 -mx-4 border-b border-orange-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:-mx-6 sm:px-6 md:hidden'
          : 'sticky bottom-4 z-20 mx-auto hidden max-w-4xl rounded-2xl border border-orange-200 bg-white/95 px-5 py-3 shadow-xl shadow-slate-900/10 backdrop-blur md:block'
      }
    >
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${estadoVisual.fondo} ${estadoVisual.color}`}>
          {estadoVisual.icono}
        </span>

        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-bold">
            <span className="text-slate-500">VIAJE #{viaje.id}</span>
            <span className={`inline-flex items-center gap-1 ${estadoVisual.color}`}>
              <span className={`h-2 w-2 rounded-full ${estadoVisual.punto}`} />
              {estadoVisual.etiqueta}
            </span>
            <span className="font-medium text-slate-500">
              · {viaje.Pedidos.length} {viaje.Pedidos.length === 1 ? 'pedido' : 'pedidos'}
              {viaje.fechaInicio &&
                ` · desde las ${new Date(viaje.fechaInicio).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`}
            </span>
          </p>
          <p className="truncate font-extrabold text-slate-900">{estadoVisual.titulo}</p>
          <p className="truncate text-sm text-slate-600" title={ayudaDelEstado}>{ayudaDelEstado}</p>
        </div>

        {/* Acciones: en el celular, "Iniciar viaje" y "Confirmar recepción" están en la barra de abajo */}
        {viaje.estado === 'preparando' && lugar === 'abajo' && (
          <Boton icono={Truck} onClick={manejarInicioViaje} disabled={!todosRetirados} cargando={iniciandoViaje} textoCargando="Iniciando…">
            Iniciar viaje
          </Boton>
        )}
        {viaje.estado === 'activo' && (
          <button
            type="button"
            onClick={() => {
              setErrorAyuda('')
              setModalAyuda(true)
            }}
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl bg-red-600 px-3 text-sm font-bold text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-300"
          >
            <AlertTriangle size={17} aria-hidden="true" />
            <span className={lugar === 'arriba' ? 'sr-only' : ''}>Solicitar asistencia</span>
            {lugar === 'arriba' && <span aria-hidden="true">Ayuda</span>}
          </button>
        )}
      </div>
    </section>
  )

  return (
    <div className="space-y-7">

      {/* Encabezado */}
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            <p className="text-xs font-bold uppercase tracking-widest text-orange-700">
              Panel de repartidor
            </p>
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Mi viaje
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Seguimiento y administración de tus pedidos asignados.
          </p>
        </div>

        <Boton variante="secundaria" icono={RefreshCw} onClick={cargarViaje}>
          Actualizar
        </Boton>
      </section>

      
{/* Celular: la barra del viaje queda pegada arriba (abajo está el menú) */}
      {barraViaje('arriba')}

      {/* Recepción pendiente (viaje reasignado por asistencia): instrucciones para buscar los pedidos */}
      {viaje.estado === 'activo' && !viaje.recepcionConfirmada && (
        <section className="rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 p-5">
          <div className="flex items-start gap-3">
            <div className="shrink-0 rounded-xl bg-amber-100 p-2.5">
              <PackageCheck className="text-amber-700" size={23} />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-amber-950">Recepción de pedidos pendiente</h4>
              <p className="mt-1 text-sm leading-relaxed text-amber-900">
                Este viaje fue reasignado por asistencia. Dirigite al punto donde se encuentra el repartidor anterior
                para recoger los pedidos y verificá que recibiste todos correctamente antes de continuar.
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                {urlUbicacionAsistencia && (
                  <a
                    href={urlUbicacionAsistencia}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-300 bg-white px-5 py-3 text-sm font-bold text-amber-800 transition hover:bg-amber-100"
                  >
                    <MapPinned size={17} />
                    Cómo llegar
                  </a>
                )}
                {/* En el celular este botón vive en la barra fija de abajo */}
                <div className="hidden md:block">
                  <Boton icono={CheckCircle2} onClick={manejarConfirmarRecepcion} cargando={confirmandoRecepcion} textoCargando="Confirmando…">
                    Confirmar recepción
                  </Boton>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}


      {/* Pedidos del viaje */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">
              Pedidos del viaje
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Gestioná cada pedido de forma individual.
            </p>
          </div>

          <span className="rounded-xl bg-orange-50 px-3 py-2 text-sm font-bold text-orange-700">
            {viaje.Pedidos.length} en total
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {viaje.Pedidos.map((pedido) => (
            <TarjetaPedidoViaje
              key={pedido.id}
              pedido={pedido}
              onRetirar={manejarRetirar}
              onEntregar={manejarEntregar}
              procesando={pedidoProcesando === pedido.id}
              puedeRetirar={viaje.estado === 'preparando'}
              puedeEntregar={viaje.estado === 'activo' && viaje.recepcionConfirmada}
              puedeQuitar={viaje.estado === 'preparando'}
              onQuitarPedido={manejarQuitarPedido}
            />
          ))}
        </div>

        {/* Siempre montado: al cerrarse, el navegador devuelve el foco al botón que lo abrió */}
        <ModalQuitarPedido
          abierto={pedidoAQuitar !== null}
          pedidoId={pedidoAQuitar}
          procesando={quitandoPedido}
          error={errorQuitar}
          onCancelar={() => {
            setPedidoAQuitar(null)
            setErrorQuitar('')
          }}
          onConfirmar={confirmarQuitarPedido}
        />
      </section>

      {/* Modal de asistencia (siempre montado, igual que el de quitar) */}
      <ModalSolicitudAyuda
        abierto={modalAyuda}
        enviando={enviandoAyuda}
        error={errorAyuda}
        onCerrar={() => setModalAyuda(false)}
        onConfirmar={enviarSolicitudAyuda}
      />

      {/* Escritorio: la barra del viaje flota abajo, angosta y centrada */}
      {barraViaje('abajo')}

      {/* Acción principal en el celular: barra fija encima de la navegación (plan UX, 7.5).
          Hija directa de la página para que "sticky" la acompañe al desplazarse. */}
      {viaje.estado === 'preparando' && (
        <BarraAccionFija
          enEscritorio="oculta"
          ayuda={todosRetirados ? undefined : 'Retirá todos los pedidos para poder iniciar el viaje.'}
        >
          <Boton
            tamano="lg"
            anchoCompleto
            icono={Truck}
            onClick={manejarInicioViaje}
            disabled={!todosRetirados}
            cargando={iniciandoViaje}
            textoCargando="Iniciando…"
          >
            Iniciar viaje
          </Boton>
        </BarraAccionFija>
      )}

      {viaje.estado === 'activo' && !viaje.recepcionConfirmada && (
        <BarraAccionFija enEscritorio="oculta">
          <Boton
            tamano="lg"
            anchoCompleto
            icono={CheckCircle2}
            onClick={manejarConfirmarRecepcion}
            cargando={confirmandoRecepcion}
            textoCargando="Confirmando…"
          >
            Confirmar recepción
          </Boton>
        </BarraAccionFija>
      )}
    </div>
  )
}