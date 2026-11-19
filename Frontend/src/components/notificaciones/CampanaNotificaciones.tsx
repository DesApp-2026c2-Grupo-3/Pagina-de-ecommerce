import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  LoaderCircle,
  Package,
  RefreshCw,
  Store,
  Truck,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useNotificaciones, useAccionesNotificaciones } from '../../context/notificaciones/NotificacionContext'
import type {
  NotificacionCliente,
  TonoNotificacionCliente,
} from '../../types/notificacion.types'
import { fabricaNotificacionesCliente } from '../../utils/notificaciones/fabricaNotificaciones'

const ICONOS: Record<TonoNotificacionCliente, LucideIcon> = {
  pedido: Package,
  estado: Truck,
  sucursal: Store,
}

const TONOS: Record<TonoNotificacionCliente, string> = {
  pedido: 'bg-brand-mustard text-brand-dark',
  estado: 'bg-brand-green text-white',
  sucursal: 'bg-brand-red text-white',
}

const formatoFecha = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

function fechaLegible(iso: string): string {
  const fecha = new Date(iso)
  return Number.isNaN(fecha.getTime()) ? '' : formatoFecha.format(fecha)
}

interface Props {
  className?: string
}

interface AnclajePopover {
  top: number
  right: number
}

const BREAKPOINT_POPOVER = 640

function calcularAnclaje(boton: HTMLButtonElement | null): AnclajePopover | null {
  if (!boton || window.innerWidth < BREAKPOINT_POPOVER) return null

  const rect = boton.getBoundingClientRect()
  const ancho = document.documentElement.clientWidth

  return {
    top: rect.bottom + 12,
    right: Math.max(12, ancho - rect.right),
  }
}

function CampanaNotificaciones({ className = '' }: Props) {
  const estado = useNotificaciones()
  const acciones = useAccionesNotificaciones()
  const navigate = useNavigate()
  const [abierto, setAbierto] = useState(false)
  const [anclaje, setAnclaje] = useState<AnclajePopover | null>(null)
  const contenedorRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const botonRef = useRef<HTMLButtonElement>(null)
  const listaRef = useRef<HTMLDivElement>(null)
  const centinelaRef = useRef<HTMLDivElement>(null)
  const idPanel = `notificaciones-${useId().replace(/:/g, '')}`

  const cerrarPanel = useCallback(() => {
    setAbierto(false)
    window.requestAnimationFrame(() => botonRef.current?.focus())
  }, [])

  useEffect(() => {
    if (!abierto) return

    function clickAfuera(evento: MouseEvent) {
      if (
        contenedorRef.current &&
        !contenedorRef.current.contains(evento.target as Node)
      ) {
        cerrarPanel()
      }
    }

    function escape(evento: KeyboardEvent) {
      if (evento.key === 'Escape') cerrarPanel()
    }

    document.addEventListener('mousedown', clickAfuera)
    document.addEventListener('keydown', escape)

    return () => {
      document.removeEventListener('mousedown', clickAfuera)
      document.removeEventListener('keydown', escape)
    }
  }, [abierto, cerrarPanel])

  useEffect(() => {
    if (!abierto) return

    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = overflowAnterior
    }
  }, [abierto])

  useEffect(() => {
    if (!abierto) return

    const header = headerRef.current
    if (!header) return

    function bloquearTouch(evento: TouchEvent) {
      evento.preventDefault()
      evento.stopPropagation()
    }

    header.addEventListener('touchmove', bloquearTouch, { passive: false })
    return () => header.removeEventListener('touchmove', bloquearTouch)
  }, [abierto])

  useEffect(() => {
    if (!abierto || !anclaje) return

    const nodos = [backdropRef.current, panelRef.current].filter(
      (nodo): nodo is HTMLDivElement => nodo !== null,
    )
    if (nodos.length === 0) return

    function bloquearRueda(evento: WheelEvent) {
      if (listaRef.current?.contains(evento.target as Node)) return

      evento.preventDefault()
      evento.stopPropagation()
    }

    nodos.forEach((nodo) =>
      nodo.addEventListener('wheel', bloquearRueda, { passive: false }),
    )

    return () =>
      nodos.forEach((nodo) => nodo.removeEventListener('wheel', bloquearRueda))
  }, [abierto, anclaje])

  useEffect(() => {
    if (!abierto) return

    function recalcularAnclaje() {
      setAnclaje(calcularAnclaje(botonRef.current))
    }

    window.addEventListener('resize', recalcularAnclaje)
    return () => window.removeEventListener('resize', recalcularAnclaje)
  }, [abierto])

  useEffect(() => {
    if (
      !abierto ||
      estado.siguienteCursor === null ||
      estado.cargandoMas ||
      estado.error
    ) {
      return
    }

    const raiz = listaRef.current
    const centinela = centinelaRef.current
    if (!raiz || !centinela || typeof IntersectionObserver === 'undefined') {
      return
    }

    let solicitado = false

    const observador = new IntersectionObserver(
      (entradas) => {
        if (solicitado || !entradas.some((entrada) => entrada.isIntersecting)) {
          return
        }

        solicitado = true
        acciones.cargarMas()
      },
      { root: raiz, rootMargin: '0px 0px 160px 0px' },
    )

    observador.observe(centinela)
    return () => observador.disconnect()
  }, [
    abierto,
    acciones,
    estado.cargandoMas,
    estado.error,
    estado.siguienteCursor,
  ])

  function abrirPanel() {
    setAnclaje(calcularAnclaje(botonRef.current))
    setAbierto(true)
  }

  function abrirNotificacion(notificacion: NotificacionCliente) {
    if (!notificacion.leida) acciones.marcarLeida(notificacion.id)

    const destino = fabricaNotificacionesCliente.obtenerDestino(notificacion)
    setAbierto(false)

    if (destino) {
      navigate(destino)
    } else {
      window.requestAnimationFrame(() => botonRef.current?.focus())
    }
  }

  const noLeidas = estado.noLeidas
  const modoEscritorio = anclaje !== null
  const puedeMarcarTodas =
    !estado.marcandoTodas &&
    (noLeidas === null
      ? estado.items.some((notificacion) => !notificacion.leida)
      : noLeidas > 0)

  return (
    <div ref={contenedorRef} className={`relative ${className}`}>
      <button
        ref={botonRef}
        type="button"
        onClick={() => {
          if (abierto) cerrarPanel()
          else abrirPanel()
        }}
        aria-label={
          noLeidas === null
            ? 'Notificaciones'
            : `Notificaciones, ${noLeidas} sin leer`
        }
        aria-expanded={abierto}
        aria-controls={idPanel}
        aria-haspopup="dialog"
        className={`relative grid h-11 w-11 place-items-center rounded-2xl border transition ${
          abierto
            ? 'border-brand-cream bg-brand-cream text-brand-dark'
            : 'border-white/15 bg-white/5 text-white hover:bg-white/10'
        }`}
      >
        <Bell className="h-6 w-6" />
        {noLeidas !== null && noLeidas > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-1.5 -top-1.5 grid h-6 min-w-6 place-items-center rounded-full border-2 border-brand-dark bg-brand-mustard px-1 text-xs font-extrabold text-brand-dark"
          >
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <>
          {modoEscritorio && (
            <div
              ref={backdropRef}
              data-testid="backdrop-notificaciones"
              aria-hidden="true"
              onClick={cerrarPanel}
              className="fixed inset-0 z-40 touch-none overscroll-none bg-brand-dark/10"
            />
          )}

          <div
            ref={panelRef}
            id={idPanel}
            role="dialog"
            aria-modal={!modoEscritorio}
            aria-label="Notificaciones"
            style={
              anclaje ? { top: anclaje.top, right: anclaje.right } : undefined
            }
            className={`fixed z-50 flex flex-col ${
              modoEscritorio
                ? 'right-0 top-0 max-h-[70dvh] w-96 rounded-3xl border-2 border-brand-dark bg-brand-cream text-brand-dark shadow-sticker'
                : 'inset-0 overscroll-none bg-neutral-900 text-brand-cream'
            }`}
          >
          <div
            ref={headerRef}
            data-testid="header-notificaciones"
            className="flex h-16 shrink-0 touch-none items-center gap-2 border-b border-white/10 bg-neutral-900 px-3 text-brand-cream sm:h-12 sm:rounded-t-[1.35rem] sm:border-b-2 sm:border-brand-sand sm:bg-brand-dark"
          >
            <h2 className="min-w-0 whitespace-nowrap font-display text-base font-extrabold">
              Notificaciones
            </h2>

            {noLeidas !== null && noLeidas > 0 && (
              <span
                aria-live="polite"
                aria-label={`${noLeidas} sin leer`}
                className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-brand-mustard px-1.5 text-[10px] font-extrabold text-brand-dark"
              >
                <span aria-hidden="true">{noLeidas > 9 ? '9+' : noLeidas}</span>
              </span>
            )}

            <button
              type="button"
              onClick={acciones.marcarTodas}
              disabled={!puedeMarcarTodas}
              className="ml-auto flex min-h-11 shrink-0 items-center gap-1 rounded-full px-1.5 text-[11px] font-extrabold uppercase tracking-wide text-brand-mustard transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45 sm:min-h-9"
            >
              {estado.marcandoTodas && (
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
              )}
              Marcar todas
            </button>

            <button
              type="button"
              onClick={() => cerrarPanel()}
              aria-label="Cerrar notificaciones"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full hover:bg-white/10 sm:h-9 sm:w-9"
            >
              <X className="h-5 w-5 sm:h-4 sm:w-4" />
            </button>
          </div>

          {estado.error && (
            <div className="border-b border-white/10 px-3 py-2 sm:border-b-2 sm:border-brand-sand">
              <div
                role="alert"
                className="rounded-xl border-2 border-brand-dark bg-brand-red px-3 py-2 text-sm font-semibold text-white"
              >
                <p className="break-words [overflow-wrap:anywhere]">
                  {estado.error}
                </p>
                <button
                  type="button"
                  onClick={acciones.reintentar}
                  className="mt-2 inline-flex min-h-10 items-center gap-1.5 rounded-full border-2 border-current px-3 text-xs font-extrabold uppercase"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Reintentar
                </button>
              </div>
            </div>
          )}

          <div
            ref={listaRef}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5 pb-6 sm:max-h-[420px] sm:pb-1.5"
          >
            {estado.cargandoInicial && estado.items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-sm font-semibold text-brand-cream/70 sm:text-brand-muted">
                <LoaderCircle className="h-6 w-6 animate-spin" />
                Cargando notificaciones…
              </div>
            ) : estado.items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-mustard/40">
                  <Bell className="h-6 w-6" />
                </span>
                <p className="font-bold">No tenés notificaciones todavía</p>
                <p className="text-sm text-brand-cream/70 sm:text-brand-muted">
                  Acá van a aparecer las novedades de tus pedidos.
                </p>
              </div>
            ) : (
              <>
                <ul className="space-y-1">
                  {estado.items.map((notificacion) => {
                    const descripcion =
                      fabricaNotificacionesCliente.describir(notificacion)
                    const Icono = ICONOS[descripcion.tono]

                    return (
                      <li key={notificacion.id}>
                        <button
                          type="button"
                          onClick={() => abrirNotificacion(notificacion)}
                          className={`flex w-full items-start gap-2.5 rounded-xl border-2 px-2.5 py-2.5 text-left transition ${
                            notificacion.leida
                              ? 'border-transparent hover:bg-white/5 sm:hover:bg-white'
                              : 'border-brand-mustard bg-brand-mustard/15 hover:bg-brand-mustard/25'
                          }`}
                        >
                          <span
                            className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${TONOS[descripcion.tono]}`}
                          >
                            <Icono className="h-4.5 w-4.5" />
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="flex items-start justify-between gap-2">
                              <span className="break-words text-sm font-bold leading-snug [overflow-wrap:anywhere]">
                                {!notificacion.leida && (
                                  <span className="sr-only">Sin leer. </span>
                                )}
                                {descripcion.titulo}
                              </span>
                              {!notificacion.leida && (
                                <span
                                  aria-hidden="true"
                                  className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-red"
                                />
                              )}
                            </span>

                            {descripcion.detalle && (
                              <span className="mt-0.5 block text-xs text-brand-cream/65 [overflow-wrap:anywhere] sm:text-brand-muted">
                                {descripcion.detalle}
                              </span>
                            )}

                            <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-wide text-brand-cream/50 sm:text-brand-muted/80">
                              {fechaLegible(notificacion.ocurridoEn)}
                            </span>
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>

                {estado.siguienteCursor !== null && (
                  <div
                    ref={centinelaRef}
                    className="flex h-8 items-center justify-center"
                  >
                    {estado.cargandoMas && (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin text-brand-cream/60 sm:text-brand-muted" />
                        <span className="sr-only">
                          Cargando más notificaciones
                        </span>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
          </div>
        </>
      )}
    </div>
  )
}

export default CampanaNotificaciones
