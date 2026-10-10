import { useEffect, useState } from 'react'
import { AdvancedMarker, APIProvider, InfoWindow, Map, useMap } from '@vis.gl/react-google-maps'
import { getSucursales } from '../../services/sucursalService'
import type { Sucursal } from '../../types/sucursal'
import { MapPin, Clock, Phone } from 'lucide-react'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined
const MAP_ID = 'DEMO_MAP_ID'
const CENTRO_POR_DEFECTO = { lat: -34.6037, lng: -58.3816 } // Obelisco
const ZOOM_SUCURSAL = 15

function direccionDe(s: Sucursal) {
  return `${s.calle}${s.numero ? ` ${s.numero}` : ''}, ${s.localidad}`
}

function linkComoLlegar(s: Sucursal) {
  return `https://www.google.com/maps/dir/?api=1&destination=${s.latitud},${s.longitud}`
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
    // El mismo fondo que las demás secciones del inicio, con espacio para que se vea el degradé
    <section id="sucursales" className="scroll-mt-24 bg-brand-cream px-4 py-20 text-brand-dark">      
    <div className="mx-auto max-w-7xl">        
        <h2 className="mb-8 flex items-center gap-3 font-display text-4xl font-extrabold tracking-tight">
          <MapPin size={34} className="text-brand-red" />
          Nuestras sucursales
        </h2>

        {loading ? (
          <p className="py-12 text-center text-brand-muted">Cargando sucursales...</p>        ) : (
          <APIProvider apiKey={API_KEY} language="es" region="AR">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="h-72 overflow-hidden rounded-[1.75rem] border-2 border-brand-dark md:order-2 md:col-span-2 md:h-[28rem]">                
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
                      <div className="max-w-56 text-brand-dark">
                        <p className="font-bold">{seleccionada.nombre}</p>
                        <p className="mt-1 text-sm">{direccionDe(seleccionada)}</p>
                        {seleccionada.horario && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-gray-600"><Clock size={12} /> {seleccionada.horario}</p>                        
                          )}
                        {seleccionada.telefono && (
                          <p className="flex items-center gap-1 text-xs text-gray-600"><Phone size={12} /> {seleccionada.telefono}</p>                        
                          )}
                        <a
                          href={linkComoLlegar(seleccionada)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-block text-sm font-bold text-brand-red hover:underline"
                        >
                          Cómo llegar →
                        </a>
                      </div>
                    </InfoWindow>
                  )}
                </Map>
              </div>

              <ul className="flex flex-col gap-3 md:order-1 md:max-h-[28rem] md:overflow-y-auto md:pr-1">
                {sucursales.map((s) => {
                  const activa = s.id === seleccionadaId
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => setSeleccionadaId(s.id)}
                        aria-pressed={activa}
                        className={`w-full rounded-3xl border-2 border-brand-dark p-4 text-left transition ${
                          activa
                            ? 'bg-brand-dark text-brand-cream shadow-[6px_6px_0_var(--color-brand-red)]'
                            : 'bg-white text-brand-dark hover:-translate-y-0.5'
                        }`}
                      >
                        <p className="font-display text-lg font-extrabold">{s.nombre}</p>                        
                        <p className="mt-1 text-sm opacity-80">{direccionDe(s)}</p>                        
                        {s.horario && (
                          <div className="mt-1 flex items-center gap-2 text-xs opacity-80">                            
                          <Clock size={16} className="shrink-0" />
                            <p>{s.horario}</p>
                          </div>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          </APIProvider>
        )}
      </div>
    </section>
  )
}

export default SucursalesMap