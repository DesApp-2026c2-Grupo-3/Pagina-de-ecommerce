import { useEffect, useState } from 'react'
import { AdvancedMarker, APIProvider, InfoWindow, Map, useMap } from '@vis.gl/react-google-maps'
import { getSucursales } from '../../services/sucursalService'
import { formatearHorario } from '../../utils/horario'
import type { Sucursal } from '../../types/sucursal'
import { MapPin, Clock, Phone } from 'lucide-react'
import CarruselFlechas from '../ui/CarruselFlechas'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined
const MAP_ID = 'DEMO_MAP_ID'
const CENTRO_POR_DEFECTO = { lat: -34.6037, lng: -58.3816 } // Obelisco
const ZOOM_SUCURSAL = 15

const ESTILOS = {
  seccion: 'scroll-mt-24 bg-brand-cream px-4 py-20 text-brand-dark',
  contenedor: 'mx-auto max-w-7xl',
  titulo: 'mb-8 flex items-center gap-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl',
  cargando: 'py-12 text-center text-brand-muted',
  grid: 'grid grid-cols-1 gap-4 md:grid-cols-3',
  mapaWrapper: 'h-72 overflow-hidden rounded-[1.75rem] border-2 border-brand-dark md:order-2 md:col-span-2 md:h-[28rem]',
  infoWindow: 'max-w-56 text-brand-dark',
  infoMeta: 'mt-1 flex items-center gap-1 text-xs text-gray-600',
  infoMetaSinMargen: 'flex items-center gap-1 text-xs text-gray-600',
  infoLink: 'mt-2 inline-block text-sm font-bold text-brand-red hover:underline',

  // Carrusel con el mismo patrón de RankingProductosRow en móvil/intermedio, y lista vertical en md+
  carruselCol: 'min-w-0 md:order-1',
  carruselLista:'gap-4 snap-x snap-mandatory sm:gap-5 md:max-h-[28rem] md:flex-col md:overflow-y-auto md:overflow-x-visible md:py-0 md:pr-1 md:[scrollbar-width:auto] md:[&::-webkit-scrollbar]:block',
    cardBase:
    'mx-auto min-w-full w-full shrink-0 snap-center rounded-3xl border-2 border-brand-dark px-14 py-4 text-left transition sm:min-w-0 sm:w-[calc((100%-1.25rem)/2)] md:w-full md:shrink md:px-4',
cardActiva: 'bg-brand-dark text-brand-cream shadow-[6px_6px_0_var(--color-brand-red)]',
  cardInactiva: 'bg-white text-brand-dark hover:translate-y-0.5',
  cardHorario: 'mt-1 flex items-center gap-2 text-xs opacity-80',
} as const

function direccionDe(s: Sucursal) {
  return `${s.calle}${s.numero ? ` ${s.numero}` : ''}, ${s.localidad}`
}

function linkComoLlegar(s: Sucursal) {
  return `https://google.com{s.latitud},${s.longitud}`
}

// Ajusta el mapa para que se vean todas las sucursales
function EncuadrarSucursales({ sucursales }: { sucursales: Sucursal[] }) {
  const map = useMap()
  useEffect(() => {
    if (!map || sucursales.length === 0) return
    if (sucursales.length === 1) {
      map.setCenter({ lat: sucursales[0].latitud, lng: sucursales[0].longitud })
      map.setZoom(ZOOM_SUCURSAL)
      return
    }
    const lats = sucursales.map((s) => s.latitud)
    const lngs = sucursales.map((s) => s.longitud)
    map.fitBounds(
      {
        north: Math.max(...lats),
        south: Math.min(...lats),
        east: Math.max(...lngs),
        west: Math.min(...lngs),
      },
      48,
    )
  }, [map, sucursales])
  return null
}

// Centra el mapa en la sucursal elegida desde la lista
function CentrarEnSeleccionada({ sucursal }: { sucursal: Sucursal | undefined }) {
  const map = useMap()
  useEffect(() => {
    if (!map || !sucursal) return
    map.panTo({ lat: sucursal.latitud, lng: sucursal.longitud })
    if ((map.getZoom() ?? 0) < ZOOM_SUCURSAL) map.setZoom(ZOOM_SUCURSAL)
  }, [map, sucursal])
  return null
}

function SucursalesMap() {
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [loading, setLoading] = useState(true)
  const [seleccionadaId, setSeleccionadaId] = useState<number | null>(null)

  useEffect(() => {
    getSucursales()
      .then(setSucursales)
      .catch(() => setSucursales([]))
      .finally(() => setLoading(false))
  }, [])

  // Si no hay sucursales (o falta la key), la sección no se muestra
  if (!API_KEY || (!loading && sucursales.length === 0)) return null

  const seleccionada = sucursales.find((s) => s.id === seleccionadaId)

  return (
    <section id="sucursales" className={ESTILOS.seccion}>
      <div className={ESTILOS.contenedor}>
        <h2 className={ESTILOS.titulo}>
          <MapPin size={34} className="shrink-0 text-brand-red" />
          Nuestras sucursales
        </h2>

        {loading ? (
          <p className={ESTILOS.cargando}>Cargando sucursales...</p>
        ) : (
          <APIProvider apiKey={API_KEY} language="es" region="AR">
            <div className={ESTILOS.grid}>
              <div className={ESTILOS.mapaWrapper}>
                <Map
                  mapId={MAP_ID}
                  defaultCenter={CENTRO_POR_DEFECTO}
                  defaultZoom={11}
                  gestureHandling="cooperative"
                  disableDefaultUI
                  zoomControl
                  clickableIcons={false}
                  style={{ width: '100%', height: '100%' }}
                  onClick={() => setSeleccionadaId(null)}
                >
                  <EncuadrarSucursales sucursales={sucursales} />
                  <CentrarEnSeleccionada sucursal={seleccionada} />

                  {sucursales.map((s) => (
                    <AdvancedMarker
                      key={s.id}
                      position={{ lat: s.latitud, lng: s.longitud }}
                      title={s.nombre}
                      onClick={() => setSeleccionadaId(s.id)}
                    />
                  ))}

                  {seleccionada && (
                    <InfoWindow
                      position={{ lat: seleccionada.latitud, lng: seleccionada.longitud }}
                      pixelOffset={[0, -40]}
                      onCloseClick={() => setSeleccionadaId(null)}
                    >
                      <div className={ESTILOS.infoWindow}>
                        <p className="font-bold">{seleccionada.nombre}</p>
                        <p className="mt-1 text-sm">{direccionDe(seleccionada)}</p>
                        <p className={ESTILOS.infoMeta}>
                          <Clock size={12} /> {formatearHorario(seleccionada.horario)}
                        </p>
                        {seleccionada.telefono && (
                          <p className={ESTILOS.infoMetaSinMargen}>
                            <Phone size={12} /> {seleccionada.telefono}
                          </p>
                        )}
                        <a
                          href={linkComoLlegar(seleccionada)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={ESTILOS.infoLink}
                        >
                          Cómo llegar →
                        </a>
                      </div>
                    </InfoWindow>
                  )}
                </Map>
              </div>

              <div className={ESTILOS.carruselCol}>
                <CarruselFlechas
                  etiqueta="Nuestras sucursales"
                  claseOcultarFlechas="md:hidden"
                  claseLista={ESTILOS.carruselLista}
                >
                  {sucursales.map((s) => {
                    const activa = s.id === seleccionadaId
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSeleccionadaId(s.id)}
                        aria-pressed={activa}
                        className={`${ESTILOS.cardBase} ${activa ? ESTILOS.cardActiva : ESTILOS.cardInactiva}`}
                      >
                        <p className="font-display text-lg font-extrabold">{s.nombre}</p>
                        <p className="mt-1 text-sm opacity-80">{direccionDe(s)}</p>
                        <div className={ESTILOS.cardHorario}>
                          <Clock size={16} className="shrink-0" />
                          <p>{formatearHorario(s.horario)}</p>
                        </div>
                      </button>
                    )
                  })}
                </CarruselFlechas>
              </div>
            </div>
          </APIProvider>
        )}
      </div>
    </section>
  )
}

export default SucursalesMap
