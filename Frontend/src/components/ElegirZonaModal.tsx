import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, MapPin } from 'lucide-react'
import Modal from './Modal'
import AddressPicker from './AddressPicker'
import ErrorAlert from './ErrorAlert'
import { useZona, type UbicacionElegida } from '../context/ZonaContext'
import { useAuth } from '../context/AuthContext'
import { getDirecciones } from '../services/addressService'
import type { Address } from '../types/address'

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
  const { zona, selectorAbierto, cerrarSelector, elegirUbicacion } = useZona()
  const { user, isAuthenticated } = useAuth()

  const [ubicacion, setUbicacion] = useState<UbicacionEnCurso>(ubicacionVacia)
  const [direcciones, setDirecciones] = useState<Address[]>([])
  const [error, setError] = useState('')

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

  function confirmar(u: UbicacionEnCurso) {
    if (u.latitud === null || u.longitud === null) {
      setError('Elegí tu dirección o usá tu ubicación actual.')
      return
    }
    setError(elegirUbicacion({ ...u, latitud: u.latitud, longitud: u.longitud }))
  }

  // Solo sirven las direcciones guardadas que tienen ubicación en el mapa
  const guardadas = direcciones.filter((d) => d.latitud != null && d.longitud != null)

  return (
    <Modal
      isOpen={selectorAbierto}
      onClose={cerrarSelector}
      tamanio="lg"
      title="¿Dónde querés recibir tu pedido?"
      subtitle="Así te mostramos lo que tiene la sucursal más cercana."
    >
      <div className="flex flex-col gap-5">
        {guardadas.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-bold">Tus direcciones</p>
            <div className="flex flex-col gap-2">
              {guardadas.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() =>
                    confirmar({
                      calle: d.calle,
                      numero: d.numero,
                      localidad: d.localidad ?? '',
                      provincia: d.provincia ?? '',
                      codigoPostal: d.codigoPostal ?? '',
                      latitud: Number(d.latitud),
                      longitud: Number(d.longitud),
                    })
                  }
                  className="group flex items-center gap-3 rounded-2xl border-2 border-brand-dark bg-white p-3 text-left transition-transform hover:-translate-y-0.5"
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
              ))}
            </div>

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

        <ErrorAlert message={error} />

        <button
          type="button"
          onClick={() => confirmar(ubicacion)}
          disabled={ubicacion.latitud === null}
          className="min-h-12 rounded-full bg-brand-red px-6 font-bold text-white transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50"
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
  )
}

export default ElegirZonaModal