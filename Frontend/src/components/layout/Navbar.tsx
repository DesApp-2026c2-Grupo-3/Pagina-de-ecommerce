import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { ChevronDown, ShoppingBag } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { LogoConEco } from '../logoEcoDestello'
import { NAV_LINKS } from '../../config/navigation'
import { useCerrarSesion } from '../../hooks/useCerrarSesion'
import ZoneButton from './ZoneButton'
import AccountMenu from './AccountMenu'

const linkBase = 'rounded-full px-4 py-2 text-sm font-bold transition-colors xl:text-base'

// Si ya estás en "Inicio", React Router no navega (misma URL): se fuerza el scroll arriba
function alNavegar(to: string) {
  if (to === '/') window.scrollTo({ top: 0, behavior: 'smooth' })
}

// En celular solo se ven el logo y la zona: la navegación está en la barra inferior (BottomNav)
function Navbar() {
  const { isAuthenticated } = useAuth()
  const { totalItems } = useCart()
  const cerrarSesion = useCerrarSesion()
  // Submenú cerrado a mano (por un clic): se queda cerrado aunque el mouse siga encima, hasta que sale y vuelve a entrar
  const [submenuCerrado, setSubmenuCerrado] = useState<string | null>(null)

  return (
    <header className="sticky top-0 z-30 border-b-4 border-brand-red bg-brand-dark" id="top">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        {/* Logo y dónde se recibe el pedido */}
        <Link to="/" className="flex shrink-0 items-center" onClick={() => alNavegar('/')}>
          <LogoConEco isAuthenticated={isAuthenticated} />
        </Link>
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">

          <ZoneButton />
        </div>

        {/* ---------- Escritorio ---------- */}
        <div className="hidden items-center gap-2 lg:flex">
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <li
                key={link.to}
                className="group relative"
                onMouseLeave={() => setSubmenuCerrado(null)}
                onFocus={() => setSubmenuCerrado(null)}
              >
                <NavLink
                  to={link.to}
                  end={link.to === '/'}
                  onClick={() => {
                    alNavegar(link.to)
                    if (link.submenu) setSubmenuCerrado(link.to)
                  }}
                  aria-haspopup={link.submenu ? 'menu' : undefined}
                  className={({ isActive }) =>
                    `${linkBase} ${isActive ? 'bg-brand-cream text-brand-dark' : 'text-white hover:bg-white/10'}`
                  }
                >
                  {link.submenu ? (
                    <span className="inline-flex items-center gap-1">
                      {link.label}
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${submenuCerrado === link.to ? '' : 'group-focus-within:rotate-180 group-hover:rotate-180'}`}
                      />
                    </span>
                  ) : (
                    link.label
                  )}
                </NavLink>

                {/* Menú vertical: aparece al pasar el mouse o al enfocar con el teclado.
                    El pt-3 hace de puente para que no se cierre al bajar el mouse hasta él. */}
                {link.submenu && (
                  <div
                    className={`invisible absolute left-0 top-full z-40 w-64 pt-3 opacity-0 transition duration-150 ${
                      submenuCerrado === link.to
                        ? ''
                        : 'group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100'
                    }`}
                  >
                    <ul
                      role="menu"
                      className="rounded-3xl border-2 border-brand-dark bg-brand-cream p-2 text-brand-dark shadow-[6px_6px_0_var(--color-brand-red)]"
                    >
                      {link.submenu.map((sub) => (
                        <li key={sub.to} role="none">
                          <Link
                            to={sub.to}
                            role="menuitem"
                            onClick={(e) => {
                              e.currentTarget.blur()
                              setSubmenuCerrado(link.to)
                            }}
                            className="flex items-center rounded-2xl px-3 py-2 font-bold transition-colors hover:bg-white"
                          >
                            {sub.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>

          {/* Cambiado de Link a NavLink para poder usar ({ isActive }) */}
          <NavLink
            to="/carrito"
            aria-label={`Carrito, ${totalItems} productos`}
            onClick={() => alNavegar('/carrito')} // Si necesitas que ejecute la misma lógica de navegación
            className={({ isActive }) =>
              `relative ml-2 grid h-11 w-11 place-items-center rounded-2xl transition hover:translate-y-0.5 ${isActive
                ? 'bg-brand-cream text-brand-dark'
                : 'bg-white/5 text-white hover:bg-white/10'
              }`
            }
          >
            <ShoppingBag className="h-6.5 w-6.5" />
            {totalItems > 0 && (
              <span className="absolute -right-1.5 -top-1.5 grid h-6 min-w-6 place-items-center rounded-full border-2 border-brand-dark bg-brand-mustard px-1 text-xs font-extrabold text-brand-dark">
                {totalItems}
              </span>
            )}
          </NavLink>


          {isAuthenticated ? (
            <div className="ml-2 "> <AccountMenu onLogout={cerrarSesion} /></div>

          ) : (


            <Link
              to="/login"
              className="ml-10 flex min-h-11 items-center rounded-full bg-brand-red px-10 font-bold text-white transition hover:brightness-110"
            >
              Ingresar
            </Link>
          )}
        </div>
      </nav>
    </header >
  )
}

export default Navbar