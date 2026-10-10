import { Link, NavLink } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
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

  return (
    <header className="sticky top-0 z-30 border-b-4 border-brand-red bg-brand-dark" id="top">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        {/* Logo y dónde se recibe el pedido */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <Link to="/" className="flex shrink-0 items-center" onClick={() => alNavegar('/')}>
            <LogoConEco isAuthenticated={isAuthenticated} />
          </Link>
          <ZoneButton />
        </div>

        {/* ---------- Escritorio ---------- */}
        <div className="hidden items-center gap-2 lg:flex">
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.to === '/'}
                  onClick={() => alNavegar(link.to)}
                  className={({ isActive }) =>
                    `${linkBase} ${isActive ? 'bg-brand-cream text-brand-dark' : 'text-white hover:bg-white/10'}`
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <Link
            to="/carrito"
            aria-label={`Carrito, ${totalItems} productos`}
            className="relative ml-2 grid h-11 w-11 place-items-center rounded-2xl bg-white/5 text-white transition hover:-translate-y-0.5 hover:bg-white/10"
          >
            <ShoppingBag className="h-6 w-6" />
            {totalItems > 0 && (
              <span className="absolute -right-1.5 -top-1.5 grid h-6 min-w-6 place-items-center rounded-full border-2 border-brand-dark bg-brand-mustard px-1 text-xs font-extrabold text-brand-dark">
                {totalItems}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <AccountMenu onLogout={cerrarSesion} />
          ) : (
            <Link
              to="/login"
              className="flex min-h-11 items-center rounded-full bg-brand-red px-5 font-bold text-white transition hover:brightness-110"
            >
              Ingresar
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}

export default Navbar