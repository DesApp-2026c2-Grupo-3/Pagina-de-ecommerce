import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Campanita from './Campanita'

const ROL_TEXTO = { MASTER: 'Administrador general', ADMIN: 'Encargado', EMPLEADO: 'Empleado' } as const

// Barra fina arriba del contenido: dónde estoy parado, la campanita y el acceso a mi perfil
export default function BarraSuperior() {
  const { administrador } = useAuth()

  if (!administrador) return null

  const contexto =
    administrador.rol === 'MASTER' ? 'Administración general' : `Sucursal ${administrador.sucursal?.nombre ?? 'sin asignar'}`

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b bg-white px-4 py-3 md:px-8">
      <p className="truncate font-semibold text-gray-800">{contexto}</p>

      <div className="flex shrink-0 items-center gap-2">
        <Campanita />

        <Link
          to="/admin/perfil"
          aria-label={`Mi perfil: ${administrador.nombre}`}
          title={`Mi perfil · ${ROL_TEXTO[administrador.rol]}`}
          className="flex items-center gap-2 rounded-full border bg-white py-1 pl-1 pr-3 hover:bg-gray-100"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-gray-800 text-sm font-semibold text-white">
            {administrador.nombre.charAt(0).toUpperCase()}
          </span>
          <span className="hidden max-w-40 truncate text-sm font-medium sm:block">{administrador.nombre}</span>
        </Link>
      </div>
    </header>
  )
}
