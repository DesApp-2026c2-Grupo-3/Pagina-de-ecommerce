import { Link, NavLink, useLocation } from 'react-router-dom'
import { Home, Percent, ShoppingBag, Store, UtensilsCrossed, type LucideIcon } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { LogoConEco } from '../logoEcoDestello'
import { NAV_LINKS } from '../../config/navigation'
import { useCerrarSesion } from '../../hooks/useCerrarSesion'
import ZoneButton from './ZoneButton'
import AccountMenu from './AccountMenu'
import CampanaNotificaciones from '../notificaciones/CampanaNotificaciones'

const NAV_ICONS: Record<string, LucideIcon> = {
  '/': Home,
  '/catalogo': UtensilsCrossed,
  '/promociones': Percent,
  '/conocenos': Store,
}

const STYLES = {
  header: 'sticky top-0 z-40 border-b-4 border-brand-red bg-brand-dark',
  nav: 'mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:gap-3 sm:px-4 md:gap-3 lg:gap-4 min-[1224px]:gap-6',
  logoLink: 'flex shrink-0 items-center',
  zoneWrapper: 'flex min-w-0 items-center gap-1.5 sm:gap-3 md:flex-1 md:justify-center md:px-1 lg:px-2',
  mobileBell: 'shrink-0 md:hidden',
  desktopGroup: 'hidden shrink-0 items-center gap-1.5 md:flex min-[1224px]:gap-2',
  navList: 'flex shrink-0 items-center gap-1 md:gap-1.5 min-[1224px]:gap-2',
  navItem: 'shrink-0',
  linkBase:
    'inline-flex items-center justify-center whitespace-nowrap rounded-full p-2.5 text-base font-bold transition-colors min-[1224px]:px-4 min-[1224px]:py-2',
  linkActive: 'bg-brand-cream text-brand-dark',
  linkInactive: 'text-white hover:bg-white/10',
  linkIcon: 'h-5 w-5 shrink-0 min-[1224px]:hidden',
  linkLabel: 'hidden min-[1224px]:inline',
  cartBtnBase:
    'relative ml-1 grid h-11 w-11 shrink-0 place-items-center rounded-2xl transition hover:translate-y-0.5 min-[1224px]:ml-2',
  cartBtnActive: 'bg-brand-cream text-brand-dark',
  cartBtnInactive: 'bg-white/5 text-white hover:bg-white/10',
  cartBadge:
    'absolute -right-1.5 -top-1.5 grid h-6 min-w-6 place-items-center rounded-full border-2 border-brand-dark bg-brand-mustard px-1 text-xs font-extrabold text-brand-dark',
  desktopBell: 'shrink-0',
  accountWrapper: 'ml-1 shrink-0 min-[1224px]:ml-2',
  loginBtn:
    'ml-2 flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full bg-brand-red px-5 text-base font-bold text-white transition hover:brightness-110 lg:px-6 min-[1224px]:ml-4 min-[1224px]:px-8',
} as const

// Si ya estás en "Inicio", React Router no navega (misma URL): se fuerza el scroll arriba
function alNavegar(to: string) {
  if (to === '/') window.scrollTo({ top: 0, behavior: 'smooth' })
}

// En celular (< 768px) solo se ven el logo, la zona y la campana: la navegación está en BottomNav
function Navbar() {
  const { isAuthenticated } = useAuth()
  const { totalItems } = useCart()
  const { pathname } = useLocation()
  const cerrarSesion = useCerrarSesion()

  return (
    <header className={STYLES.header} id="top">
      <nav className={STYLES.nav}>
        {/* Logo y dónde se recibe el pedido */}
        <Link to="/" className={STYLES.logoLink} onClick={() => alNavegar('/')}>
          <LogoConEco isAuthenticated={isAuthenticated} />
        </Link>

        <div className={STYLES.zoneWrapper}>
          <ZoneButton />
          {isAuthenticated && <CampanaNotificaciones key={pathname} className={STYLES.mobileBell} />}
        </div>

        {/* ---------- Tablet (md+) y Escritorio ---------- */}
        <div className={STYLES.desktopGroup}>
          <ul className={STYLES.navList}>
            {NAV_LINKS.map((link) => {
              const Icono = NAV_ICONS[link.to]
              return (
                <li key={link.to} className={STYLES.navItem}>
                  <NavLink
                    to={link.to}
                    end={link.to === '/'}
                    onClick={() => alNavegar(link.to)}
                    aria-label={link.label}
                    title={link.label}
                    className={({ isActive }) =>
                      `${STYLES.linkBase} ${isActive ? STYLES.linkActive : STYLES.linkInactive}`
                    }
                  >
                    {Icono ? (
                      <>
                        <Icono className={STYLES.linkIcon} strokeWidth={2.3} />
                        <span className={STYLES.linkLabel}>{link.label}</span>
                      </>
                    ) : (
                      link.label
                    )}
                  </NavLink>
                </li>
              )
            })}
          </ul>

          <NavLink
            to="/carrito"
            aria-label={`Carrito, ${totalItems} productos`}
            onClick={() => alNavegar('/carrito')}
            className={({ isActive }) =>
              `${STYLES.cartBtnBase} ${isActive ? STYLES.cartBtnActive : STYLES.cartBtnInactive}`
            }
          >
            <ShoppingBag className="h-6.5 w-6.5" />
            {totalItems > 0 && <span className={STYLES.cartBadge}>{totalItems}</span>}
          </NavLink>

          {isAuthenticated ? (
            <>
              <CampanaNotificaciones key={pathname} className={STYLES.desktopBell} />
              <div className={STYLES.accountWrapper}>
                <AccountMenu onLogout={cerrarSesion} />
              </div>
            </>
          ) : (
            <Link to="/login" className={STYLES.loginBtn}>
              Ingresar
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}

export default Navbar
