import { useEffect, useId, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ChevronDown, CircleAlert, MapPin, X, Trash2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useZona } from '../../context/ZonaContext'



// El globito se muestra una vez por visita, y no en las pantallas de sesión
const AVISO_ZONA_KEY = 'avisoZonaCerrado'
const SIN_AVISO = ['/login', '/registro']

type PopoverZona = 'sin-zona' | 'cerrada' | null

const ESTILOS = {
  wrapper: 'relative min-w-0',
  botonBase:
    'flex min-h-11 min-w-0 items-center justify-center rounded-full border bg-white/5 p-0 text-left text-white transition-colors hover:bg-white/10 max-[380px]:h-11 max-[380px]:w-11 max-[380px]:shrink-0 min-[380px]:justify-start min-[380px]:gap-2 min-[380px]:py-1 min-[380px]:pl-2 min-[380px]:pr-3',
  botonConZona: 'border-white/15',
  botonSinZona: 'border-brand-red',
  pinCirculo: 'grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-red',
  textoCol: 'min-w-0 leading-tight max-[380px]:hidden',
  etiquetaSuperior: 'block whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider text-white/55',
  direccionTexto: 'block max-w-[7.5rem] truncate text-sm font-bold sm:max-w-[12rem]',
  chevronIcono: 'h-4 w-4 shrink-0 text-brand-mustard max-[380px]:hidden',

  // Popover: Sin zona (centrado con márgenes laterales en móvil, anclado en sm+)
  // Popover: Sin zona (centrado en <380px cuando es círculo; alineado a la derecha del botón desde 380px+)
  popoverSinZona:
    'fixed inset-x-4 top-20 z-40 mx-auto max-w-sm rounded-2xl border-2 border-brand-dark bg-brand-cream p-3 text-brand-dark shadow-sticker min-[380px]:absolute min-[380px]:inset-x-auto min-[380px]:right-0 min-[380px]:top-full min-[380px]:mx-0 min-[380px]:mt-3 min-[380px]:w-64',

  // Popover: Sucursal cerrada (mismo comportamiento desde 380px+)
  popoverCerrada:
    'fixed inset-x-4 top-20 z-40 mx-auto max-w-sm rounded-2xl border-2 border-brand-dark bg-brand-dark p-3 text-brand-cream shadow-[4px_4px_0_var(--color-brand-red)] min-[380px]:absolute min-[380px]:inset-x-auto min-[380px]:right-0 min-[380px]:top-full min-[380px]:mx-0 min-[380px]:mt-3 min-[380px]:w-72 sm:w-80',
  popoverCerrarClaro: 'shrink-0 text-brand-muted hover:text-brand-red',
  popoverBotonRojo:
    'mt-3 w-full rounded-full bg-brand-red px-4 py-2 text-sm font-bold text-white transition-transform hover:translate-y-0.5',

  // Popover: Sucursal cerrada (centrado con márgenes laterales en móvil, anclado en sm+)

  alertaIconoCirculo: 'grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-mustard text-brand-dark',
  popoverCerrarOscuro: 'shrink-0 text-brand-cream/70 transition-colors hover:text-white',
  popoverBotonMostaza:
    'mt-3 w-full rounded-full bg-brand-mustard px-4 py-2 text-sm font-bold text-brand-dark transition-transform hover:translate-y-0.5',
} as const



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
    <div className={ESTILOS.wrapper}>
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
        className={`${ESTILOS.botonBase} ${zona ? ESTILOS.botonConZona : ESTILOS.botonSinZona}`}
      >
        <span className={ESTILOS.pinCirculo}>
          <MapPin className="h-4 w-4" />
        </span>
        <span className={ESTILOS.textoCol}>
          <span className={ESTILOS.etiquetaSuperior}>{zona ? 'Entregar en' : 'Tu ubicación'}</span>
          <span className={ESTILOS.direccionTexto}>
            {zona ? `${zona.calle} ${zona.numero}` : 'Ingresá tu dirección'}
          </span>
        </span>
        <ChevronDown className={ESTILOS.chevronIcono} />
      </button>

      {popover === 'sin-zona' && (
        <div id={popoverId} role="status" aria-live="polite" className={ESTILOS.popoverSinZona}>
          <div className="flex items-start gap-2">
            <p className="text-sm font-medium">Ingresá tu dirección para ver qué hay disponible cerca tuyo.</p>
            <button type="button" onClick={cerrarAviso} aria-label="Cerrar aviso" className={ESTILOS.popoverCerrarClaro}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <button type="button" onClick={elegir} className={ESTILOS.popoverBotonRojo}>
            Elegir dirección
          </button>
        </div>
      )}

      {popover === 'cerrada' && (
        <div id={popoverId} role="alert" className={ESTILOS.popoverCerrada}>
          <div className="flex items-start gap-2.5">
            <span className={ESTILOS.alertaIconoCirculo}>
              <CircleAlert className="h-4 w-4" strokeWidth={2.8} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">{zona?.sucursalNombre ?? 'La sucursal'} está cerrada ahora</p>
              <p className="mt-1 text-xs font-semibold leading-snug text-brand-cream/80">
                Fuera de horario de atención. No se pueden generar pedidos por ahora.
              </p>
            </div>
            <button type="button" onClick={cerrarAviso} aria-label="Cerrar aviso" className={ESTILOS.popoverCerrarOscuro}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <button type="button" onClick={cambiarDireccion} className={ESTILOS.popoverBotonMostaza}>
            Cambiar dirección
          </button>
        </div>
      )}
    </div>
  )
}

export default ZoneButton
