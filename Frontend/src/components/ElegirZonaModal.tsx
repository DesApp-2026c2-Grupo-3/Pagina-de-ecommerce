import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronRight, MapPin } from 'lucide-react'
import Modal from './Modal'
import AddressPicker from './AddressPicker'
import ErrorAlert from './ErrorAlert'
import { useZona } from '../context/ZonaContext'
import type { UbicacionElegida } from '../types/zona'
import { useAuth } from '../context/AuthContext'
import { getDirecciones } from '../services/addressService'
import type { Address } from '../types/address'
import BuscandoSucursal from './BuscandoSucursal'
import ElegirSucursal from './sucursal/ElegirSucursal'

interface UbicacionEnCurso extends Omit<UbicacionElegida, 'latitud' | 'longitud'> {
  latitud: number | null
  longitud: number | null
}

const ubicacionVacia: UbicacionEnCurso = {
  calle: '',
  numero: '',
  localidad: '',
  provincia: '',
  codigoPostal: '',
  latitud: null,
  longitud: null,
}

// Se abre solo cuando la persona lo pide (desde el botón de dirección del Navbar)
function ElegirZonaModal() {
  const { zona, selectorAbierto, abrirSelector, cerrarSelector, elegirUbicacion, opcionesSucursal } = useZona()
  const { user, isAuthenticated } = useAuth()
  const [ubicacion, setUbicacion] = useState<UbicacionEnCurso>(ubicacionVacia)
  const [direcciones, setDirecciones] = useState<Address[]>([])
  const [error, setError] = useState('')
  // Dirección guardada que dio el error (para mostrarlo debajo de esa tarjeta)
  const [errorEnId, setErrorEnId] = useState<number | null>(null)
  // Pantalla "Buscando tu sucursal" después de elegir una dirección
  const [buscando, setBuscando] = useState(false)
  // Las direcciones guardadas que no son la predeterminada se despliegan con "Otras direcciones"
  const [verOtras, setVerOtras] = useState(false)

  useEffect(() => {
    if (!buscando) return
    const timer = setTimeout(() => setBuscando(false), 2800)
    return () => clearTimeout(timer)
  }, [buscando])

  // Al abrirse, arranca con la zona actual (si hay) y trae las direcciones guardadas
  useEffect(() => {
    if (!selectorAbierto) return
    setError('')
    setUbicacion(zona ? { ...zona } : ubicacionVacia)
    // Sin sesión no hay direcciones guardadas (y no quedan las del usuario anterior)
    if (!isAuthenticated || !user) {
      setDirecciones([])
      return
    }
    getDirecciones(user.id)
      .then(setDirecciones)
      .catch(() => setDirecciones([]))
  }, [selectorAbierto, user])

  function confirmar(u: UbicacionEnCurso, direccionId: number | null = null) {
    setErrorEnId(direccionId)
    if (u.latitud === null || u.longitud === null) {
      setError('Elegí tu dirección o usá tu ubicación actual.')
      return
    }
    const motivo = elegirUbicacion({ ...u, latitud: u.latitud, longitud: u.longitud })
    setError(motivo)
    // Sin motivo = la zona quedó elegida (y el modal se cierra): se muestra la búsqueda de la sucursal
    if (!motivo) setBuscando(true)
  }

  // Solo sirven las direcciones guardadas que tienen ubicación en el mapa
  const guardadas = direcciones.filter((d) => d.latitud != null && d.longitud != null)
  // A la vista, la predeterminada (o la primera); las demás se despliegan
  const principal = guardadas.find((d) => d.predeterminada) ?? guardadas[0]
  const otras = guardadas.filter((d) => d.id !== principal?.id)

  return (
    <>
      {buscando && zona && (
        <BuscandoSucursal
          sucursal={zona.sucursalNombre}
          distanciaKm={zona.distanciaKm}
          abierta={zona.sucursalAbierta !== false}
          onCambiarDireccion={() => {
            setBuscando(false)
            abrirSelector()
          }}
        />
      )}
      <Modal
        isOpen={selectorAbierto}
        onClose={cerrarSelector}
        tamanio="lg"
        title="¿Dónde querés recibir tu pedido?"
        subtitle="Así te mostramos lo que tiene la sucursal más cercana."
      >
        <div className="flex flex-col gap-5">
          {/* Si a la dirección le llegan varias sucursales, se elige desde cuál pedir */}
          {zona && opcionesSucursal.length > 1 && (
            <div>
              <p className="mb-2 text-sm font-bold">
                A tu dirección le llegan {opcionesSucursal.length} sucursales. Elegí desde cuál pedir:
              </p>
              <ElegirSucursal onElegida={cerrarSelector} />
            </div>
          )}

          {guardadas.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-bold">Tus direcciones</p>
              <div className="flex flex-col gap-2">
                {(verOtras ? [principal, ...otras] : [principal]).map((d) => (
                  <div key={d.id} className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        confirmar(
                          {
                            calle: d.calle,
                            numero: d.numero,
                            localidad: d.localidad ?? '',
                            provincia: d.provincia ?? '',
                            codigoPostal: d.codigoPostal ?? '',
                            latitud: Number(d.latitud),
                            longitud: Number(d.longitud),
                          },
                          d.id,
                        )
                      }
                      className="group flex items-center gap-3 rounded-2xl border-2 border-brand-dark bg-white p-3 text-left transition-transform hover:translate-y-0.5"
                    >
                      <span
                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                          d.predeterminada ? 'bg-brand-mustard' : 'bg-brand-cream'
                        }`}
                      >
                        <MapPin className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold">{d.alias}</span>
                        <span className="block truncate text-sm text-brand-muted">
                          {d.calle} {d.numero} — {d.localidad}
                        </span>
                      </span>
                      <ChevronRight className="h-5 w-5 shrink-0 text-brand-muted transition-transform group-hover:translate-x-1 group-hover:text-brand-red" />
                    </button>
                    {errorEnId === d.id && <ErrorAlert message={error} />}
                  </div>
                ))}
              </div>

              {otras.length > 0 && (
                <button
                  type="button"
                  onClick={() => setVerOtras((valor) => !valor)}
                  aria-expanded={verOtras}
                  className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-brand-dark transition-colors hover:text-brand-red"
                >
                  {verOtras ? 'Ver menos' : `Otras direcciones (${otras.length})`}
                  <ChevronDown className={`h-4 w-4 transition-transform ${verOtras ? 'rotate-180' : ''}`} />
                </button>
              )}

              <div className="mt-5 flex items-center gap-3 text-sm font-bold text-brand-muted">
                <span className="h-0 flex-1 border-t-2 border-dashed border-brand-sand" />
                u otra dirección
                <span className="h-0 flex-1 border-t-2 border-dashed border-brand-sand" />
              </div>
            </div>
          )}

          <AddressPicker
            value={ubicacion}
            onChange={(cambios) => {
              setUbicacion((prev) => ({ ...prev, ...cambios }))
              setError('')
            }}
          />

          {errorEnId === null && <ErrorAlert message={error} />}
          <button
            type="button"
            onClick={() => confirmar(ubicacion)}
            disabled={ubicacion.latitud === null}
            className="min-h-12 rounded-full bg-brand-red px-6 font-bold text-white transition-transform hover:translate-y-0.5 disabled:translate-y-0 disabled:opacity-50"
          >
            Ver el menú de mi zona
          </button>

          {!isAuthenticated && (
            <p className="text-center text-sm text-brand-muted">
              ¿Ya tenés cuenta?{' '}
              <Link to="/login" onClick={cerrarSelector} className="font-bold text-brand-red hover:underline">
                Iniciá sesión
              </Link>{' '}
              para usar tus direcciones guardadas.
            </p>
          )}
        </div>
      </Modal>
    </>
  )
}

export default ElegirZonaModal