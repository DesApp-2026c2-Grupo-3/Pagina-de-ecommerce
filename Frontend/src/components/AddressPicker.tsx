import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { AdvancedMarker, APIProvider, Map, useMap } from '@vis.gl/react-google-maps'
import {
  autocompletarDireccion,
  detalleDireccion,
  direccionDesdeCoordenadas,
  type GeoResultado,
  type GeoSugerencia,
} from '../services/geoService'

// Datos de ubicación que maneja este componente.
// Es reutilizable: direcciones de clientes y, más adelante, sucursales.
export interface UbicacionValue {
  calle: string
  numero: string
  localidad: string
  provincia: string
  codigoPostal: string
  latitud: number | null
  longitud: number | null
}

interface AddressPickerProps {
  value: UbicacionValue
  onChange: (value: UbicacionValue) => void
}

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined
// Para desarrollo alcanza con el Map ID de demo de Google.
// Para producción se crea uno propio (gratis) en la consola.
const MAP_ID = 'DEMO_MAP_ID'

const CENTRO_POR_DEFECTO = { lat: -34.6037, lng: -58.3816 } // Obelisco
const ZOOM_GENERAL = 12
const ZOOM_DIRECCION = 17
const MIN_CARACTERES = 3
const ESPERA_MS = 400

function nuevoSessionToken() {
  return crypto.randomUUID()
}

// Centra el mapa cuando cambian las coordenadas
function CentrarMapa({ lat, lng }: { lat: number | null; lng: number | null }) {
  const map = useMap()
  useEffect(() => {
    if (!map || lat === null || lng === null) return
    map.panTo({ lat, lng })
    if ((map.getZoom() ?? 0) < ZOOM_DIRECCION) map.setZoom(ZOOM_DIRECCION)
  }, [map, lat, lng])
  return null
}

function AddressPicker({ value, onChange }: AddressPickerProps) {
  const [busqueda, setBusqueda] = useState('')
  const [sugerencias, setSugerencias] = useState<GeoSugerencia[]>([])
  const [buscando, setBuscando] = useState(false)
  const [usandoGps, setUsandoGps] = useState(false)
  const [mensaje, setMensaje] = useState('')

  // Google agrupa las sugerencias + la elección en una "sesión".
  // Se renueva cada vez que el usuario elige una dirección.
  const sessionTokenRef = useRef(nuevoSessionToken())

  const tieneUbicacion = value.latitud !== null && value.longitud !== null

  // Sugerencias mientras escribe, esperando a que haga una pausa
  useEffect(() => {
    const q = busqueda.trim()
    if (q.length < MIN_CARACTERES) {
      setSugerencias([])
      setBuscando(false)
      return
    }

    let cancelado = false
    const timer = setTimeout(async () => {
      setBuscando(true)
      try {
        const resultado = await autocompletarDireccion(q, sessionTokenRef.current)
        if (!cancelado) setSugerencias(resultado)
      } catch (err) {
        if (!cancelado) {
          setSugerencias([])
          setMensaje(err instanceof Error ? err.message : 'Error al buscar la dirección')
        }
      } finally {
        if (!cancelado) setBuscando(false)
      }
    }, ESPERA_MS)

    return () => {
      cancelado = true
      clearTimeout(timer)
    }
  }, [busqueda])

  function aplicarResultado(r: GeoResultado, lat = r.latitud, lng = r.longitud) {
    onChange({
      calle: r.calle ?? '',
      numero: r.altura != null ? String(r.altura) : '',
      localidad: r.localidad ?? r.departamento ?? '',
      provincia: r.provincia ?? '',
      codigoPostal: r.codigoPostal ?? '',
      latitud: lat,
      longitud: lng,
    })
  }

  function mensajeSegunResultado(r: GeoResultado) {
    if (!r.calle) return 'Elegí una dirección con calle y altura.'
    if (r.altura == null) return 'Falta la altura: completala abajo.'
    return 'Revisá que el marcador esté en tu puerta. Si no, arrastralo.'
  }

  async function elegirSugerencia(s: GeoSugerencia) {
    setSugerencias([])
    setBusqueda('')
    setUsandoGps(false)
    setMensaje('Cargando dirección...')
    try {
      const r = await detalleDireccion(s.placeId, sessionTokenRef.current)
      aplicarResultado(r)
      setMensaje(mensajeSegunResultado(r))
    } catch (err) {
      setMensaje(err instanceof Error ? err.message : 'No se pudo cargar la dirección')
    } finally {
      sessionTokenRef.current = nuevoSessionToken()
    }
  }

  // Enter elige la primera sugerencia, en lugar de enviar el formulario
  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (sugerencias.length > 0) elegirSugerencia(sugerencias[0])
    }
  }

  function moverMarcador(lat: number, lng: number) {
    onChange({ ...value, latitud: lat, longitud: lng })
  }

  function handleUbicacionActual(checked: boolean) {
    setUsandoGps(checked)
    if (!checked) return

    if (!navigator.geolocation) {
      setMensaje('Tu navegador no permite obtener la ubicación.')
      setUsandoGps(false)
      return
    }

    setSugerencias([])
    setBusqueda('')
    setMensaje('Obteniendo tu ubicación...')
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const r = await direccionDesdeCoordenadas(coords.latitude, coords.longitude)
          // Usamos las coordenadas del GPS, que son las reales del usuario
          aplicarResultado(r, coords.latitude, coords.longitude)
          setMensaje(
            coords.accuracy > 100
              ? `Tu ubicación es aproximada (margen de ${Math.round(coords.accuracy / 1000 * 10) / 10} km). Buscá la dirección o mové el marcador a tu puerta.`
              : mensajeSegunResultado(r),
          )
        } catch (err) {
          setUsandoGps(false)
          setMensaje(err instanceof Error ? err.message : 'No pudimos obtener la dirección.')
        }
      },
      (error) => {
        setUsandoGps(false)
        setMensaje(
          error.code === error.PERMISSION_DENIED
            ? 'No diste permiso para usar tu ubicación. Podés buscar la dirección a mano.'
            : 'No pudimos obtener tu ubicación. Probá buscando la dirección a mano.',
        )
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  if (!API_KEY) {
    return (
      <p className="rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-700">
        Falta configurar VITE_GOOGLE_MAPS_API_KEY en el .env del front.
      </p>
    )
  }

  return (
    <APIProvider apiKey={API_KEY} language="es" region="AR">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Dirección</span>
          <label className="flex items-center gap-2 text-sm font-semibold text-brand-dark">
            <input
              type="checkbox"
              checked={usandoGps}
              onChange={(e) => handleUbicacionActual(e.target.checked)}
              className="h-4 w-4 accent-brand-red"
            />
            Ubicación actual
          </label>
        </div>

        <div className="relative">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar y seleccionar dirección..."
            autoComplete="off"
            className="w-full rounded-lg border border-brand-dark/20 px-3 py-2 text-lg focus:border-brand-red focus:outline-none"
          />
          {buscando && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              Buscando...
            </span>
          )}

          {sugerencias.length > 0 && (
            <ul className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-brand-dark/10 bg-white shadow-lg">
              {sugerencias.map((s) => (
                <li key={s.placeId} className="border-b border-brand-dark/10 last:border-b-0">
                  <button
                    type="button"
                    onClick={() => elegirSugerencia(s)}
                    className="w-full px-3 py-2 text-left hover:bg-brand-cream"
                  >
                    <span className="block text-sm font-semibold text-brand-dark">{s.principal}</span>
                    {s.secundario && (
                      <span className="block text-xs text-gray-500">{s.secundario}</span>
                    )}
                  </button>
                </li>
              ))}
              <li className="px-3 py-1 text-right text-[10px] text-gray-400">Google Maps</li>
            </ul>
          )}
        </div>

        {mensaje && <p className="text-sm text-gray-600">{mensaje}</p>}

        {value.calle && (
          <div className="rounded-lg bg-brand-cream px-3 py-2">
            <p className="text-sm font-semibold text-brand-dark">
              📍 {value.calle} {value.numero}
              {value.localidad && `, ${value.localidad}`}
              {value.provincia && `, ${value.provincia}`}
            </p>
            {!value.numero && (
              <input
                type="text"
                inputMode="numeric"
                value={value.numero}
                onChange={(e) => onChange({ ...value, numero: e.target.value })}
                placeholder="Altura"
                className="mt-2 w-32 border-b border-brand-dark/20 bg-transparent py-1 focus:border-brand-red focus:outline-none"
              />
            )}
            {!tieneUbicacion && (
              <p className="mt-1 text-xs font-semibold text-amber-600">
                Marcá la ubicación tocando el mapa.
              </p>
            )}
          </div>
        )}

        <div>
          <p className="text-sm text-gray-500">Ubicación en el mapa:</p>
          <div className="mt-1 h-48 overflow-hidden rounded-lg border border-brand-dark/20 sm:h-64">            <Map
              mapId={MAP_ID}
              defaultCenter={
                tieneUbicacion ? { lat: value.latitud!, lng: value.longitud! } : CENTRO_POR_DEFECTO
              }
              defaultZoom={tieneUbicacion ? ZOOM_DIRECCION : ZOOM_GENERAL}
              disableDefaultUI
              zoomControl
              clickableIcons={false}
              style={{ width: '100%', height: '100%' }}
              onClick={(e) => {
                const p = e.detail.latLng
                if (p) moverMarcador(p.lat, p.lng)
              }}
            >
              <CentrarMapa lat={value.latitud} lng={value.longitud} />
              {tieneUbicacion && (
                <AdvancedMarker
                  position={{ lat: value.latitud!, lng: value.longitud! }}
                  draggable
                  onDragEnd={(e) => {
                    const p = e.latLng
                    if (p) moverMarcador(p.lat(), p.lng())
                  }}
                />
              )}
            </Map>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Si el marcador no quedó en tu puerta, arrastralo o tocá el mapa.
          </p>
        </div>
      </div>
    </APIProvider>
  )
}

export default AddressPicker
