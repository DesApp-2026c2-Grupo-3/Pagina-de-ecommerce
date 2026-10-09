import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { AdvancedMarker, APIProvider, Map, useMap } from '@vis.gl/react-google-maps'
import {
  autocompletarDireccion,
  detalleDireccion,
  direccionDesdeCoordenadas,
  type GeoResultado,
  type GeoSugerencia,
} from '../services/geoService'
import { LocateFixed } from 'lucide-react'

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
// Texto corto para mostrar en el buscador, ej: "Florida 2950, Merlo"
function armarTexto(calle: string, numero: string, localidad: string) {
  return [`${calle} ${numero}`.trim(), localidad].filter(Boolean).join(', ')
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
  const [busqueda, setBusqueda] = useState(() =>
    value.calle ? armarTexto(value.calle, value.numero, value.localidad) : '',
  )
  // Cuando escribimos en el buscador desde el código (no el usuario), no hay que pedir sugerencias
  const saltarBusquedaRef = useRef(Boolean(value.calle))  
  const [sugerencias, setSugerencias] = useState<GeoSugerencia[]>([])
  const [buscando, setBuscando] = useState(false)
  const [usandoGps, setUsandoGps] = useState(false)
  const [mensaje, setMensaje] = useState('')
  // Dirección elegida sin altura: se pide la altura y se vuelve a buscar en Google para ubicarla bien
  const [sinAltura, setSinAltura] = useState<GeoResultado | null>(null)
  const [altura, setAltura] = useState('')
  const [verificando, setVerificando] = useState(false)

  // Google agrupa las sugerencias + la elección en una "sesión".
  // Se renueva cada vez que el usuario elige una dirección.
  const sessionTokenRef = useRef(nuevoSessionToken())

  const tieneUbicacion = value.latitud !== null && value.longitud !== null

  function mostrarEnBuscador(texto: string) {
    if (texto === busqueda) return
    saltarBusquedaRef.current = true
    setBusqueda(texto)
  }
  // Sugerencias mientras escribe, esperando a que haga una pausa
  useEffect(() => {
      if (saltarBusquedaRef.current) {
        saltarBusquedaRef.current = false
        return
      }
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
    return ''
  }

  async function elegirSugerencia(s: GeoSugerencia) {
    setSugerencias([])
    setSinAltura(null)
    setMensaje('Cargando dirección...')
    try {
      const r = await detalleDireccion(s.placeId, sessionTokenRef.current)

      // Una localidad o un lugar no sirve: su ubicación es el centro de la zona, no una casa
      if (!r.calle) {
        setMensaje('Eso es una zona o un lugar, no una dirección. Escribí la calle y la altura (ej: Florida 2950).')
        return
      }

      // Calle sin altura: se pide la altura y se busca de nuevo, antes de aceptar la ubicación
      if (r.altura == null) {
        setSinAltura(r)
        setAltura('')
        setMensaje('')
        mostrarEnBuscador(armarTexto(r.calle, '', r.localidad ?? r.departamento ?? ''))
        return
      }

      aplicarResultado(r)
      mostrarEnBuscador(armarTexto(r.calle, String(r.altura), r.localidad ?? r.departamento ?? ''))
      setMensaje('')
    } catch (err) {
      setMensaje(err instanceof Error ? err.message : 'No se pudo cargar la dirección')
    } finally {
      sessionTokenRef.current = nuevoSessionToken()
    }
  }

  // Busca en Google "calle altura, localidad" y solo la acepta si existe
  async function confirmarAltura() {
    if (!sinAltura) return
    const numero = altura.trim()
    if (!/^\d{1,5}$/.test(numero)) {
      setMensaje('Ingresá una altura válida (solo números).')
      return
    }

    const localidad = sinAltura.localidad ?? sinAltura.departamento ?? ''
    setVerificando(true)
    setMensaje('Buscando la dirección...')
    try {
      const token = nuevoSessionToken()
      const opciones = await autocompletarDireccion(`${sinAltura.calle} ${numero}, ${localidad}`, token)
      const r = opciones[0] ? await detalleDireccion(opciones[0].placeId, token) : null

      if (!r || !r.calle || r.altura == null || String(r.altura) !== numero) {
        setMensaje(`No encontramos ${sinAltura.calle} ${numero}. Revisá la altura.`)
        return
      }

      aplicarResultado(r)
      mostrarEnBuscador(armarTexto(r.calle, String(r.altura), r.localidad ?? r.departamento ?? ''))
      setSinAltura(null)
      setMensaje('')
    } catch (err) {
      setMensaje(err instanceof Error ? err.message : 'No se pudo buscar la dirección')
    } finally {
      setVerificando(false)
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
    setMensaje('Obteniendo tu ubicación...')
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const r = await direccionDesdeCoordenadas(coords.latitude, coords.longitude)
          aplicarResultado(r, coords.latitude, coords.longitude)
          mostrarEnBuscador(
            armarTexto(r.calle ?? '', r.altura != null ? String(r.altura) : '', r.localidad ?? r.departamento ?? ''),
          )
          setMensaje(coords.accuracy > 100 ? 'Tu ubicación es aproximada' : mensajeSegunResultado(r))
          setUsandoGps(false)
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
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value)
                setSinAltura(null)
              }}              onKeyDown={handleKeyDown}
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

          <button
            type="button"
            onClick={() => handleUbicacionActual(true)}
            disabled={usandoGps}
            aria-label="Usar mi ubicación actual"
            title="Usar mi ubicación actual"
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-brand-dark/20 text-brand-dark transition-colors hover:border-brand-red hover:text-brand-red disabled:opacity-50 ${
              usandoGps ? 'animate-pulse' : ''
            }`}
          >
            <LocateFixed className="h-5 w-5" />
          </button>
        </div>
        {sinAltura && (
          <div className="flex flex-wrap items-center gap-2 rounded bg-orange-50 px-3 py-2">
            <span className="text-sm">
              ¿A qué altura de <strong>{sinAltura.calle}</strong>?
            </span>
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              value={altura}
              onChange={(e) => setAltura(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  confirmarAltura()
                }
              }}
              placeholder="Ej: 2950"
              className="w-28 rounded border px-2 py-1"
            />
            <button
              type="button"
              onClick={confirmarAltura}
              disabled={verificando}
              className="rounded border border-orange-400 px-3 py-1 text-sm font-semibold text-orange-700 hover:bg-orange-100 disabled:opacity-50"
            >
              {verificando ? 'Buscando...' : 'Confirmar'}
            </button>
          </div>
        )}        
        {mensaje && <p className="text-sm text-gray-600">{mensaje}</p>}

        {value.calle && (!value.numero || !tieneUbicacion) && (
          <div className="rounded-lg bg-brand-cream px-3 py-2">
            {!value.numero && (
              <input
                type="text"
                inputMode="numeric"
                value={value.numero}
                onChange={(e) => onChange({ ...value, numero: e.target.value })}
                placeholder="Altura"
                className="w-32 border-b border-brand-dark/20 bg-transparent py-1 focus:border-brand-red focus:outline-none"
              />
            )}
            {!tieneUbicacion && (
              <p className="mt-1 text-xs font-semibold text-amber-600">
                Marcá la ubicación tocando el mapa.
              </p>
            )}
          </div>
        )}
        <div className="relative h-[32vh] min-h-44 overflow-hidden rounded-lg border border-brand-dark/20">
          <Map
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

          {tieneUbicacion && (
            <p className="pointer-events-none absolute left-2 right-2 top-2 rounded-md bg-white/90 px-2 py-1 text-center text-xs text-gray-600 shadow">
              Arrastrá el marcador o tocá el mapa para ajustar
            </p>
          )}
        </div>

      </div>
    </APIProvider>
  )
}

export default AddressPicker
