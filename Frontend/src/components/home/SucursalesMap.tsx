import { useEffect, useState } from 'react'
import { AdvancedMarker, APIProvider, InfoWindow, Map, useMap } from '@vis.gl/react-google-maps'
import { getSucursales } from '../../services/sucursalService'
import type { Sucursal } from '../../types/sucursal'
import { MapPin, Clock} from 'lucide-react'

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
    <div className='bg-radial from-stone-500  to-stone-900 p-2'>
    <section id="sucursales" className="mx-auto max-w-7xl scroll-mt-32 px-4 py-8 
    bg-gradient-to-br from-red-900 via-red-800 to-red-950
    border-6 border-red-950">
      <h2 className="mb-4 flex items-center gap-3 text-2xl font-extrabold text-white">
        < MapPin size={30}/>
        Nuestras sucursales
      </h2>

      {loading ? (
        <p className="py-12 text-center text-gray-600">Cargando sucursales...</p>
      ) : (
        <APIProvider apiKey={API_KEY} language="es" region="AR">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="h-72 overflow-hidden rounded-2xl shadow-md md:order-2 md:col-span-2 md:h-[28rem]">
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
                        <p className="mt-1 text-xs text-gray-600">🕒 {seleccionada.horario}</p>
                      )}
                      {seleccionada.telefono && (
                        <p className="text-xs text-gray-600">📞 {seleccionada.telefono}</p>
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
                      className={`w-full rounded-2xl border p-4 text-left shadow-sm transition-colors
                        bg-white/20 border border-white/10 ${
                        activa
                          ? 'border-brand-red'
                          : 'border-transparent hover:border-brand-red/40'
                      }`}
                    >
                      <p className="font-bold text-white">{s.nombre}</p>
                      <p className="mt-1 text-sm text-gray-100">{direccionDe(s)}</p>
                      {s.horario && 
                        <div className="mt-1 text-xs text-gray-100
                        flex gap-2 items-center">
                        <Clock size={20}/>
                        <p >
                         {s.horario}</p>
                         </div>
                      }
                        
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </APIProvider>
      )}
    </section>
    </div>
  )
}

export default SucursalesMap
