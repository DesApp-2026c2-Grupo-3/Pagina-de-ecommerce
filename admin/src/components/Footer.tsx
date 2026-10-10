import { NavLink } from 'react-router-dom'
import type { AdministradorSesion } from '../App'
import { enlacesDe } from '../config/menu'

interface FooterProps {
  administrador: AdministradorSesion | null
}

export default function Footer({ administrador }: FooterProps) {
  // Los mismos links que el menú, según el rol (sin "Inicio")
  const enlaces = enlacesDe(administrador).filter((e) => e.to !== '/admin')

  return (
    <footer className="mt-auto bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-7xl px-8 py-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row">
          <div>
            <h2 className="text-lg font-semibold text-white">Panel Administrativo</h2>
            <p className="mt-2 text-sm">
              {administrador?.rol === 'MASTER'
                ? 'Gestión y administración del sistema.'
                : `Gestión de ${administrador?.sucursal?.nombre ?? 'tu sucursal'}.`}
            </p>
          </div>

          {enlaces.length > 0 && (
            <div>
              <h3 className="mb-2 font-medium text-white">Accesos</h3>
              <ul className="space-y-1 text-sm">
                {enlaces.map((e) => (
                  <li key={e.to}>
                    <NavLink to={e.to} className="hover:text-action">
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