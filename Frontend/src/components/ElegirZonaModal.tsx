import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Modal from './Modal'
import AddressPicker from './AddressPicker'
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
    if (isAuthenticated && user) {
      getDirecciones(user.id)
        .then(setDirecciones)
        .catch(() => setDirecciones([]))
    }
  }, [selectorAbierto])

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
            <p className="mb-2 text-sm font-bold text-brand-dark">Tus direcciones</p>
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
                  className="rounded-xl border border-brand-dark/10 bg-white p-3 text-left transition-colors hover:border-brand-dark/40"
                >
                  <span className="block font-bold text-brand-dark">{d.alias}</span>
                  <span className="block text-sm text-gray-600">
                    {d.calle} {d.numero} — {d.localidad}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-4 text-sm font-bold text-brand-dark">U otra dirección</p>
          </div>
        )}

        <AddressPicker
          value={ubicacion}
          onChange={(cambios) => {
            setUbicacion((prev) => ({ ...prev, ...cambios }))
            setError('')
          }}
        />

        {error && (
          <p className="rounded-xl border border-brand-red/20 bg-brand-red/10 p-3 text-sm font-semibold text-brand-red">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={() => confirmar(ubicacion)}
          disabled={ubicacion.latitud === null}
          className="rounded-full bg-brand-red px-6 py-3 font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          Ver el menú de mi zona
        </button>

        {!isAuthenticated && (
          <p className="text-center text-sm text-gray-600">
            ¿Ya tenés cuenta?{' '}
            <Link
              to="/login"
              onClick={cerrarSelector}
              className="font-bold text-brand-dark underline hover:text-brand-red"
            >
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