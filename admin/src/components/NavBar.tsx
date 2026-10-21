import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Menu, LogOut, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { cerrarSesionService } from '../services/authService'
import { enlacesDe } from '../config/menu'

const claseEnlace = ({ isActive }: { isActive: boolean }) =>
  isActive
    ? 'font-bold text-action drop-shadow-[0_0_6px_rgba(249,115,22,0.8)]'
    : 'hover:text-action-hover'

export default function Navbar() {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const navigate = useNavigate()
  const { administrador, cerrarSesion } = useAuth()

  const enlaces = enlacesDe(administrador)
  const rolTexto =
    administrador?.rol === 'MASTER'
      ? 'Administrador general'
      : `Sucursal ${administrador?.sucursal?.nombre ?? 'sin asignar'}`

  const salir = async () => {
    try {
      await cerrarSesionService()
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
    cerrarSesion()
    navigate('/')
  }

  // Nombre, rol y botón de salir (se repite en escritorio y celular)
  const usuario = (
    <div className="flex items-center gap-4">
      <div className="text-right">
        <p className="font-medium">{administrador?.nombre}</p>
        <p className="text-sm text-gray-400">{rolTexto}</p>
      </div>
      <button
        type="button"
        onClick={salir}
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
        className="rounded border bg-danger px-3 py-2 hover:bg-danger-hover"
      >
        <LogOut size={18} />
      </button>
    </div>
  )

  return (
    <nav className="bg-gray-900 text-white">
      {/* Barra superior */}
      <div className="flex items-center justify-between px-6 py-4">
        <h1 className="text-xl font-bold">Administración</h1>

        {/* Botón móvil */}
        <button
          type="button"
          onClick={() => setMenuAbierto(!menuAbierto)}
          className="text-2xl md:hidden"
          aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuAbierto}
        >
          {menuAbierto ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Usuario en escritorio */}
        <div className="hidden md:block">{usuario}</div>
      </div>

      {/* Enlaces en un segundo renglón */}
      <div className="hidden border-t border-gray-700 px-6 py-3 md:flex md:items-center md:gap-6">
        {enlaces.map((e) => (
          <NavLink
            key={e.to}
            to={e.to}
            end={e.end}
            className={claseEnlace}
          >
            {e.label}
          </NavLink>
        ))}
      </div>

      {/* Menú móvil */}
      {menuAbierto && (
        <div className="flex flex-col gap-4 px-6 pb-4 md:hidden">
          {enlaces.map((e) => (
            <NavLink
              key={e.to}
              to={e.to}
              end={e.end}
              onClick={() => setMenuAbierto(false)}
              className={claseEnlace}
            >
              {e.label}
            </NavLink>
          ))}
          <div className="w-fit rounded bg-gray-700 p-2">{usuario}</div>
        </div>
      )}
    </nav>
  )
}
