import { useEffect, useId, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ChevronDown, CircleAlert, MapPin, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useZona } from '../../context/ZonaContext'

// El globito se muestra una vez por visita, y no en las pantallas de sesión
const AVISO_ZONA_KEY = 'avisoZonaCerrado'
const SIN_AVISO = ['/login', '/registro']

type PopoverZona = 'sin-zona' | 'cerrada' | null

function avisoYaCerrado() {
  try {
    return sessionStorage.getItem(AVISO_ZONA_KEY) === 'si'
  } catch {
    return false
  }
}

function marcarAvisoVisto() {
  try {
    sessionStorage.setItem(AVISO_ZONA_KEY, 'si')
  } catch {
    // Sin almacenamiento, el globito puede volver a aparecer: no es grave
  }
}

// Dónde recibe el pedido: define la sucursal y su stock
function ZoneButton() {
  const { zona, sucursalCerrada, selectorAbierto, abrirSelector } = useZona()
  const { user } = useAuth()
  const { pathname } = useLocation()
  const [popover, setPopover] = useState<PopoverZona>(null)
  const [avisoCierreDescartado, setAvisoCierreDescartado] = useState(false)
  const popoverId = useId()
  const sucursalAnteriorRef = useRef(zona?.sucursalId)
  const estabaCerradaRef = useRef(sucursalCerrada)

  // Sin zona, a los 2 segundos aparece el globito invitando a elegirla
  useEffect(() => {
    if (zona || selectorAbierto || SIN_AVISO.includes(pathname) || avisoYaCerrado()) {
      setPopover((actual) => (actual === 'sin-zona' ? null : actual))
      return
    }
    const timer = setTimeout(() => setPopover('sin-zona'), 2000)
    return () => clearTimeout(timer)
  }, [zona, selectorAbierto, pathname])

  // El aviso de cierre vuelve a habilitarse al cambiar de sucursal
  useEffect(() => {
    if (sucursalAnteriorRef.current === zona?.sucursalId) return
    sucursalAnteriorRef.current = zona?.sucursalId
    setAvisoCierreDescartado(false)
  }, [zona?.sucursalId])

  // También al iniciar sesión: la próxima carga de la app debe avisar de nuevo
  useEffect(() => {
    setAvisoCierreDescartado(false)
  }, [user?.id])

  // Si la sucursal vuelve a cerrar, el descarte anterior ya no aplica
  useEffect(() => {
    if (sucursalCerrada && !estabaCerradaRef.current) {
      setAvisoCierreDescartado(false)
    }
    estabaCerradaRef.current = sucursalCerrada
  }, [sucursalCerrada])

  // Sucursal cerrada: el aviso se despliega solo, sin esperar un clic
  useEffect(() => {
    if (!sucursalCerrada || selectorAbierto || avisoCierreDescartado || SIN_AVISO.includes(pathname)) {
      setPopover((actual) => (actual === 'cerrada' ? null : actual))
      return
    }
    const timer = setTimeout(() => setPopover('cerrada'), 600)
    return () => clearTimeout(timer)
  }, [sucursalCerrada, selectorAbierto, avisoCierreDescartado, pathname, zona?.sucursalId, user?.id])

  // Al cambiar de pantalla, el aviso de falta de zona no debe quedar flotando.
  // El de sucursal cerrada se mantiene abierto hasta que la persona lo cierre.
  useEffect(() => {
    setPopover((actual) => {
      if (actual === 'sin-zona') return null
      if (actual === 'cerrada' && SIN_AVISO.includes(pathname)) return null
      return actual
    })
  }, [pathname])

  // Cerrar solo con Escape: el click afuera no descarta el aviso
  useEffect(() => {
    if (!popover) return

    function cerrar() {
      if (popover === 'sin-zona') marcarAvisoVisto()
      if (popover === 'cerrada') setAvisoCierreDescartado(true)
      setPopover(null)
    }

    function alPresionar(event: KeyboardEvent) {
      if (event.key === 'Escape') cerrar()
    }

    document.addEventListener('keydown', alPresionar)
    return () => document.removeEventListener('keydown', alPresionar)
  }, [popover])

  function cerrarAviso() {
    if (popover === 'sin-zona') marcarAvisoVisto()
    if (popover === 'cerrada') setAvisoCierreDescartado(true)
    setPopover(null)
  }

  function elegir() {
    cerrarAviso()
    if (!zona) marcarAvisoVisto()
    abrirSelector()
  }

  function cambiarDireccion() {
    cerrarAviso()
    abrirSelector()
  }

  function alClickZona() {
    if (sucursalCerrada) {
      if (popover !== 'cerrada') setPopover('cerrada')
      return
    }
    elegir()
  }

  return (
    <div className="relative min-w-0">
      <button
        type="button"
        onClick={alClickZona}
        aria-expanded={popover !== null}
        aria-controls={popover ? popoverId : undefined}
        title={
          zona
            ? sucursalCerrada
              ? `${zona.sucursalNombre} está cerrada ahora`
              : `Pedís desde ${zona.sucursalNombre}`
            : 'Elegí dónde recibir tu pedido'
        }
        aria-label={
          zona
            ? sucursalCerrada
              ? `${zona.sucursalNombre} está cerrada ahora. Ver opciones`
              : `Pedís desde ${zona.sucursalNombre}. Cambiar dirección`
            : 'Elegir dirección de entrega'
        }
        className={`flex min-h-11 min-w-0 items-center justify-center rounded-full border bg-white/5 p-0 text-left text-white transition-colors hover:bg-white/10 max-[360px]:h-11 max-[360px]:w-11 max-[360px]:shrink-0 min-[360px]:justify-start min-[360px]:gap-2 min-[360px]:py-1 min-[360px]:pl-2 min-[360px]:pr-3 ${
          zona ? 'border-white/15' : 'border-brand-red'
        }`}
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-red">
          <MapPin className="h-4 w-4" />
        </span>
        <span className="min-w-0 leading-tight max-[360px]:hidden">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-white/55">
            {zona ? 'Entregar en' : 'Tu ubicación'}
          </span>
          <span className="block max-w-[90px] truncate text-sm font-bold sm:max-w-[12rem]">
            {zona ? `${zona.calle} ${zona.numero}` : 'Ingresá tu dirección'}
          </span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-brand-mustard max-[360px]:hidden" />
      </button>

      {popover === 'sin-zona' && (
        <div
          id={popoverId}
          role="status"
          aria-live="polite"
          className="fixed left-4 right-4 top-20 z-40 rounded-2xl border-2 border-brand-dark bg-brand-cream p-3 text-brand-dark shadow-sticker sm:absolute sm:left-0 sm:right-auto sm:top-full sm:mt-3 sm:w-64"
        >
          <div className="flex items-start gap-2">
            <p className="text-sm font-medium">Ingresá tu dirección para ver qué hay disponible cerca tuyo.</p>
            <button
              type="button"
              onClick={cerrarAviso}
              aria-label="Cerrar aviso"
              className="shrink-0 text-brand-muted hover:text-brand-red"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={elegir}
            className="mt-3 w-full rounded-full bg-brand-red px-4 py-2 text-sm font-bold text-white transition-transform hover:translate-y-0.5"
          >
            Elegir dirección
          </button>
        </div>
      )}

      {popover === 'cerrada' && (
        <div
          id={popoverId}
          role="alert"
          className="fixed left-4 right-4 top-20 z-40 rounded-2xl border-2 border-brand-dark bg-brand-dark p-3 text-brand-cream shadow-[4px_4px_0_var(--color-brand-red)] sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-3 sm:w-80"
        >
          <div className="flex items-start gap-2.5">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-mustard text-brand-dark">
              <CircleAlert className="h-4 w-4" strokeWidth={2.8} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">{zona?.sucursalNombre ?? 'La sucursal'} está cerrada ahora</p>
              <p className="mt-1 text-xs font-semibold leading-snug text-brand-cream/80">
                Fuera de horario de atención. No se pueden generar pedidos por ahora.
              </p>
            </div>
            <button
              type="button"
              onClick={cerrarAviso}
              aria-label="Cerrar aviso"
              className="shrink-0 text-brand-cream/70 transition-colors hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={cambiarDireccion}
            className="mt-3 w-full rounded-full bg-brand-mustard px-4 py-2 text-sm font-bold text-brand-dark transition-transform hover:translate-y-0.5"
          >
            Cambiar dirección
          </button>
        </div>
      )}
    </div>
  )
}

export default ZoneButton
