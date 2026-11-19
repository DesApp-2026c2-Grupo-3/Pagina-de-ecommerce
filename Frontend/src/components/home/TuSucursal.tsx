import { useEffect, useState } from 'react'
import { AdvancedMarker, APIProvider, Map } from '@vis.gl/react-google-maps'
import { Clock, MapPin, Navigation, Phone, Store, ChevronDown, ChevronUp, Map as MapIcon } from 'lucide-react'
import { useZona } from '../../context/ZonaContext'
import { getSucursales } from '../../services/sucursalService'
import { estadoSucursal, formatearHorario } from '../../utils/horario'
import AvisoCierreSucursal from '../sucursal/AvisoCierreSucursal'
import type { Sucursal } from '../../types/sucursal'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined
const MAP_ID = 'DEMO_MAP_ID'

const STYLES = {
  section: 'scroll-mt-24 px-4 py-8 md:py-16',
  emptyCard:
    'mx-auto flex max-w-7xl flex-wrap items-center gap-6 rounded-[1.75rem] border-2 border-brand-dark bg-white p-5 sm:p-8',
  emptyIconBadge: 'grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-mustard',
  emptyBtn:
    'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-red px-6 font-bold text-white transition-transform hover:translate-y-0.5 sm:w-auto',
  grid: 'mx-auto grid max-w-7xl gap-6 md:grid-cols-2 lg:grid-cols-[2fr_1fr]',
  mapWrapperBase:
    'overflow-hidden rounded-[1.75rem] border-2 border-brand-dark bg-brand-sand transition-all duration-300 md:block md:h-full md:min-h-80',
  mapWrapperOpen: 'mb-4 h-64 border-opacity-100 md:mb-0',
  mapWrapperClosed: 'h-0 border-opacity-0 md:border-opacity-100',
  infoCard:
    'flex flex-col gap-3 rounded-[1.75rem] border-2 border-brand-dark bg-white p-4 shadow-sticker md:gap-4 md:p-6 lg:p-7',
  headerRow: 'flex flex-row items-center justify-between gap-2',
  tagGroup: 'flex items-center gap-2',
  eyebrow: 'text-[10px] font-bold uppercase tracking-wider text-brand-muted sm:text-xs',
  statusBadgeBase: 'rounded-full px-2 py-0.5 text-[10px] font-extrabold sm:px-2.5 sm:text-xs',
  statusClosed: 'bg-brand-red text-white',
  statusOpen: 'bg-brand-mustard text-brand-dark',
  toggleMapBtn:
    'inline-flex items-center gap-1 rounded-full border border-brand-dark/20 bg-brand-cream px-2.5 py-1 text-[10px] font-bold uppercase text-brand-dark transition active:scale-95 md:hidden',
  title: 'font-display text-2xl font-extrabold leading-tight tracking-tight text-brand-dark md:text-3xl',
  address: 'flex items-start gap-2 text-xs text-brand-muted sm:text-sm',
  addressIcon: 'mt-0.5 h-4 w-4 shrink-0 text-brand-red sm:h-5 sm:w-5',
  detailsList: 'flex flex-col gap-1.5 border-t-2 border-dashed border-brand-sand pt-3.5 text-xs sm:text-sm',
  detailRow: 'flex items-center gap-2 text-brand-dark',
  distanceText: 'mt-0.5 text-[11px] font-medium text-brand-muted sm:text-xs',
  actionsRow: 'mt-2 flex flex-row gap-2 pt-1 max-[400px]:flex-col md:mt-auto md:flex-col',
  directionsBtn:
    'inline-flex min-h-[2.5rem] flex-1 items-center justify-center gap-2 rounded-full bg-brand-red px-4 text-xs font-bold text-white transition-transform hover:translate-y-0.5 sm:text-sm md:min-h-11 lg:min-h-12 lg:px-6 lg:text-base',
  changeAddressBtn:
    'inline-flex min-h-[2.5rem] flex-1 items-center justify-center rounded-full bg-brand-dark px-4 text-xs font-bold text-brand-cream transition-transform hover:translate-y-0.5 sm:text-sm md:min-h-11 lg:min-h-12 lg:px-6 lg:text-base',
} as const

function direccionDe(s: Sucursal) {
  return `${s.calle}${s.numero ? ` ${s.numero}` : ''}, ${s.localidad}`
}

function linkComoLlegar(s: Sucursal) {
  return `https://google.com{s.latitud},${s.longitud}`
}

function TuSucursal() {
  const { zona, abrirSelector } = useZona()
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [mostrarMapa, setMostrarMapa] = useState(false)

  useEffect(() => {
    getSucursales()
      .then(setSucursales)
      .catch(() => setSucursales([]))
  }, [])

  const sucursal = sucursales.find((s) => s.id === zona?.sucursalId)

  if (!zona) {
    return (
      <section id="sucursales" className={STYLES.section}>
        <div className={STYLES.emptyCard}>
          <span className={STYLES.emptyIconBadge}>
            <Store className="h-7 w-7" />
          </span>
          <div className="min-w-0 flex-1 basis-64">
            <p className="font-display text-2xl font-extrabold">¿Qué sucursal te atiende?</p>
            <p className="text-brand-muted">Elegí tu dirección y te mostramos la sucursal más cercana.</p>
          </div>
          <button type="button" onClick={abrirSelector} className={STYLES.emptyBtn}>
            <MapPin className="h-5 w-5" /> Elegir dirección
          </button>
        </div>
      </section>
    )
  }

  if (!sucursal) return null

  const estado = estadoSucursal(sucursal.horario, sucursal.zona_horaria)
  const sucursalCerrada = !estado.abierta
  const posicion = { lat: sucursal.latitud, lng: sucursal.longitud }

  return (
    <section id="sucursales" className={STYLES.section}>
      <div className={STYLES.grid}>
        <div
          className={`${STYLES.mapWrapperBase} ${
            mostrarMapa ? STYLES.mapWrapperOpen : STYLES.mapWrapperClosed
          }`}
        >
          <div className="h-full w-full">
            {API_KEY && (
              <APIProvider apiKey={API_KEY} language="es" region="AR">
                <Map
                  mapId={MAP_ID}
                  defaultCenter={posicion}
                  defaultZoom={15}
                  gestureHandling="cooperative"
                  disableDefaultUI
                  zoomControl
                  clickableIcons={false}
                  style={{ width: '100%', height: '100%' }}
                >
                  <AdvancedMarker position={posicion} title={sucursal.nombre} />
                </Map>
              </APIProvider>
            )}
          </div>
        </div>

        <div className={STYLES.infoCard}>
          <div className={STYLES.headerRow}>
            <div className={STYLES.tagGroup}>
              <p className={STYLES.eyebrow}>Tu sucursal</p>
              <span
                className={`${STYLES.statusBadgeBase} ${
                  sucursalCerrada ? STYLES.statusClosed : STYLES.statusOpen
                }`}
              >
                {sucursalCerrada ? 'Cerrada ahora' : 'Abierta ahora'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setMostrarMapa(!mostrarMapa)}
              className={STYLES.toggleMapBtn}
            >
              <MapIcon size={12} className="text-brand-red" />
              {mostrarMapa ? 'Ocultar mapa' : 'Ver mapa'}
              {mostrarMapa ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>

          <h2 className={STYLES.title}>{sucursal.nombre}</h2>

          <p className={STYLES.address}>
            <MapPin className={STYLES.addressIcon} />
            {direccionDe(sucursal)}
          </p>

          <div className={STYLES.detailsList}>
            {sucursal.horario && (
              <p className={STYLES.detailRow}>
                <Clock className="h-4 w-4 shrink-0 text-brand-muted" />
                <span className="font-bold">{formatearHorario(sucursal.horario)}</span>
              </p>
            )}
            {sucursal.telefono && (
              <a href={`tel:${sucursal.telefono}`} className={`${STYLES.detailRow} hover:text-brand-red`}>
                <Phone className="h-4 w-4 shrink-0 text-brand-muted" />
                <span className="font-bold">{sucursal.telefono}</span>
              </a>
            )}
            <p className={STYLES.distanceText}>
              A {zona.distanciaKm.toLocaleString('es-AR', { maximumFractionDigits: 1 })} km de tu dirección
            </p>
          </div>

          {sucursalCerrada && <AvisoCierreSucursal sucursal={sucursal.nombre} motivo={estado.motivo} conBoton={false}/>}

          <div className={STYLES.actionsRow}>
            <a
              href={linkComoLlegar(sucursal)}
              target="_blank"
              rel="noopener noreferrer"
              className={STYLES.directionsBtn}
            >
              <Navigation className="h-4 w-4" /> Cómo llegar
            </a>
            <button type="button" onClick={abrirSelector} className={STYLES.changeAddressBtn}>
              Cambiar dirección
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default TuSucursal

