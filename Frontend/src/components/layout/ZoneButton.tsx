import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ChevronDown, MapPin, X } from 'lucide-react'
import { useZona } from '../../context/ZonaContext'

// El globito se muestra una vez por visita, y no en las pantallas de sesión
const AVISO_ZONA_KEY = 'avisoZonaCerrado'
const SIN_AVISO = ['/login', '/registro']

function avisoYaCerrado() {
  try {
    return sessionStorage.getItem(AVISO_ZONA_KEY) === 'si'
  } catch {
    return false
  }
}

// Dónde recibe el pedido: define la sucursal y su stock
function ZoneButton() {
  const { zona, abrirSelector } = useZona()
  const { pathname } = useLocation()
  const [aviso, setAviso] = useState(false)

  // Si no hay zona, a los 2 segundos aparece el globito invitando a elegirla
  useEffect(() => {
    if (zona || SIN_AVISO.includes(pathname) || avisoYaCerrado()) {
      setAviso(false)
      return
    }
    const timer = setTimeout(() => setAviso(true), 2000)
    return () => clearTimeout(timer)
  }, [zona, pathname])

  function cerrarAviso() {
    setAviso(false)
    try {
      sessionStorage.setItem(AVISO_ZONA_KEY, 'si')
    } catch {
      // Sin almacenamiento, el globito puede volver a aparecer: no es grave
    }
  }

  function elegir() {
    cerrarAviso()
    abrirSelector()
  }

  return (
    <div className="relative min-w-0">
      <button
        type="button"
        onClick={elegir}
        title={zona ? `Pedís desde ${zona.sucursalNombre}` : 'Elegí dónde recibir tu pedido'}
        className={`flex min-h-11 min-w-0 items-center gap-2 rounded-full border bg-white/5 py-1 pl-2 pr-3 text-left text-white transition-colors hover:bg-white/10 ${
          zona ? 'border-white/15' : 'border-brand-red'
        }`}
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-red">
          <MapPin className="h-4 w-4" />
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-white/55">
            {zona ? 'Entregar en' : 'Tu ubicación'}
          </span>
          <span className="block max-w-[7rem] truncate text-sm font-bold sm:max-w-[12rem]">
            {zona ? `${zona.calle} ${zona.numero}` : 'Ingresá tu dirección'}
          </span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-brand-mustard" />
      </button>

      {aviso && (
        <div
          role="status"
          className="absolute left-0 top-full z-40 mt-3 w-64 rounded-2xl border-2 border-brand-dark bg-brand-cream p-3 text-brand-dark shadow-sticker"
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
            className="mt-3 w-full rounded-full bg-brand-red px-4 py-2 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
          >
            Elegir dirección
          </button>
        </div>
      )}
    </div>
  )
}

export default ZoneButton