import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useZona } from '../context/ZonaContext'
import { getDirecciones } from '../services/addressService'

// Al iniciar sesión sin zona elegida, la zona pasa a ser la dirección predeterminada
function ZonaDesdeUsuario() {
  const { user } = useAuth()
  const { zona, sucursalesCargadas, elegirUbicacion } = useZona()

  useEffect(() => {
    if (!user || zona || !sucursalesCargadas) return
    getDirecciones(user.id)
      .then((direcciones) => {
        const conMapa = direcciones.filter((d) => d.latitud != null && d.longitud != null)
        const elegida = conMapa.find((d) => d.predeterminada) ?? conMapa[0]
        if (!elegida) return
        elegirUbicacion({
          calle: elegida.calle,
          numero: elegida.numero,
          localidad: elegida.localidad ?? '',
          provincia: elegida.provincia ?? '',
          codigoPostal: elegida.codigoPostal ?? '',
          latitud: Number(elegida.latitud),
          longitud: Number(elegida.longitud),
        })
      })
      .catch(() => {
        // Sin direcciones: el cliente elige la zona a mano
      })
  }, [user, zona, sucursalesCargadas])

  return null
}

export default ZonaDesdeUsuario