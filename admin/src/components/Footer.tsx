import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { enlacesDe } from '../config/menu'

export default function Footer() {
  const { administrador } = useAuth()
  // Los mismos links que el menú, según el rol (sin "Inicio")
  const enlaces = enlacesDe(administrador)

  return (
    <footer className="mt-auto bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-7xl px-8 py-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row">
          <div>
            <h2 className="text-lg font-semibold text-white">Panel Administrativo</h2>
            <p className="mt-2 text-sm">
              {administrador?.rol === 'MASTER'
                ? 'Gestión y administración del sistema.'
                : `Gestión de ${administrador?.sucursal?.nombre ?? 'tu sucursal'}.`}
            </p>
          </div>

          {enlaces.length > 0 && (
            <div className="min-w-0">
              <h3 className="mb-2 font-medium text-white">Accesos</h3>
              <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                {enlaces.map((e) => (
                  <li key={e.to}>
                    <NavLink to={e.to} className="whitespace-nowrap hover:text-action">
                      {e.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-6 border-t border-gray-700 pt-4 text-sm text-gray-500">
          © 2026 Plataforma de pedidos. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  )
}
