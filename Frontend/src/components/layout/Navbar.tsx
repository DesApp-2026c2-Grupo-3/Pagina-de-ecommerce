import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown, MapPin, ShoppingCart } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useZona } from '../../context/ZonaContext'
import { LogoConEco } from '../logoEcoDestello'

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Catálogo', to: '/catalogo' },
  { label: 'Promociones', to: '/promociones' },
  { label: 'Conocenos', to: '/conocenos' },
]

const profileLinks = [
  { label: 'Datos personales', to: '/perfil', icon: '👤' },
  { label: 'Direcciones guardadas', to: '/direcciones', icon: '📍' },
  { label: 'Historial de pedidos', to: '/historial', icon: '🧾' },
  { label: 'Seguridad', to: '/seguridad', icon: '🔒' },
]

function Navbar() {
  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()
  const { totalItems, clearCart } = useCart()
  const { zona, abrirSelector } = useZona()
  const navigate = useNavigate()
  const menuRef = useRef<HTMLLIElement>(null)

  // Cierra el menú de perfil (escritorio) al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleLogout() {
    logout()
    clearCart()
    setMenuOpen(false)
    setMobileProfileOpen(false)
    setOpen(false)
    navigate('/')
  }

  // Si el link es "Home" y ya estás ahí, React Router no navega (misma URL),
  // así que se fuerza el scroll arriba a mano
  function handleNavLinkClick(to: string) {
    if (to === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function closeMobileMenu() {
    setOpen(false)
    setMobileProfileOpen(false)
  }

  return (
    <header className="sticky top-0 z-20 bg-brand-dark shadow-md" id="top">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-2xl font-extrabold text-white">
          <LogoConEco isAuthenticated={isAuthenticated} />
        </Link>

        {/* ---------- Escritorio ---------- */}
        <ul className="hidden items-center gap-0.5 lg:flex xl:gap-1">
          {navLinks.map((link) => (
            <li key={link.label}>
              <Link
                to={link.to}
                onClick={() => handleNavLinkClick(link.to)}
                className="whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-red xl:px-4 xl:text-base"
              >
                {link.label}
              </Link>
            </li>
          ))}

          {/* Dónde recibe el pedido: define la sucursal y su stock */}
          <li>
            <button
              type="button"
              onClick={abrirSelector}
              title="Cambiar dónde recibís tu pedido"
              className="flex items-center gap-1 rounded-lg px-2.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="max-w-[10rem] truncate">{zona ? zona.sucursalNombre : 'Elegí tu zona'}</span>
            </button>
          </li>

          <li>
            <Link
              to="/carrito"
              aria-label="Ver carrito"
              className="relative flex items-center rounded-lg p-2 text-white transition-colors hover:bg-brand-red"
            >
              <ShoppingCart className="h-6 w-6" />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-brand-red text-xs font-bold text-white">
                  {totalItems}
                </span>
              )}
            </Link>
          </li>

          <li className="relative ml-2" ref={menuRef}>
            {isAuthenticated ? (
              <>
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-expanded={menuOpen}
                  className="rounded-full bg-brand-red px-5 py-2 font-bold text-white transition-opacity hover:opacity-90"
                >
                  Hola, {user?.name}
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-max overflow-hidden rounded-xl border border-white/10 bg-brand-dark shadow-xl">
                    {profileLinks.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 whitespace-nowrap px-4 py-2 font-semibold text-white hover:bg-brand-red"
                      >
                        <span>{item.icon}</span> {item.label}
                      </Link>
                    ))}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 whitespace-nowrap border-t border-white/10 px-4 py-2 text-left font-semibold text-white hover:bg-brand-red"
                    >
                      <span>🚪</span> Cerrar sesión
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-full bg-brand-red px-5 py-2 font-bold text-white transition-opacity hover:opacity-90"
              >
                Iniciar Sesión
              </Link>
            )}
          </li>
        </ul>

        <button
          type="button"
          aria-label="Abrir menú"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="rounded-md p-2 text-2xl text-white focus:outline-none focus:ring-2 focus:ring-white lg:hidden"
        >
          {open ? '✕' : '☰'}
        </button>
      </nav>

      {/* ---------- Celular ---------- */}
      {open && (
        <ul className="flex flex-col gap-1 border-t border-white/10 bg-brand-dark px-4 pb-4 lg:hidden">
          {navLinks.map((link) => (
            <li key={link.label}>
              <Link
                to={link.to}
                onClick={() => {
                  handleNavLinkClick(link.to)
                  closeMobileMenu()
                }}
                className="block rounded-lg px-4 py-2 font-semibold text-white hover:bg-brand-red"
              >
                {link.label}
              </Link>
            </li>
          ))}

          <li>
            <button
              type="button"
              onClick={() => {
                abrirSelector()
                closeMobileMenu()
              }}
              className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-left font-semibold text-white hover:bg-brand-red"
            >
              <MapPin className="h-5 w-5 shrink-0" />
              {zona ? `Pedís desde ${zona.sucursalNombre}` : 'Elegí tu zona'}
            </button>
          </li>

          <li>
            <Link
              to="/carrito"
              onClick={closeMobileMenu}
              className="flex items-center gap-2 rounded-lg px-4 py-2 font-semibold text-white hover:bg-brand-red"
            >
              <ShoppingCart className="h-5 w-5" />
              Carrito
              {totalItems > 0 && (
                <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-xs font-bold text-brand-red">
                  {totalItems}
                </span>
              )}
            </Link>
          </li>

          <li className="mt-2">
            {isAuthenticated ? (
              <>
                <button
                  type="button"
                  onClick={() => setMobileProfileOpen((v) => !v)}
                  aria-expanded={mobileProfileOpen}
                  className="flex w-full items-center justify-between rounded-full bg-brand-red px-5 py-2 font-bold text-white"
                >
                  Hola, {user?.name}
                  <ChevronDown
                    className={`h-5 w-5 transition-transform ${mobileProfileOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {mobileProfileOpen && (
                  <div className="mt-2 overflow-hidden rounded-xl border border-white/10 bg-brand-dark">
                    {profileLinks.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={closeMobileMenu}
                        className="flex items-center gap-2 px-4 py-2 font-semibold text-white hover:bg-brand-red"
                      >
                        <span>{item.icon}</span> {item.label}
                      </Link>
                    ))}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 border-t border-white/10 px-4 py-2 text-left font-semibold text-white hover:bg-brand-red"
                    >
                      <span>🚪</span> Cerrar sesión
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Link
                to="/login"
                onClick={closeMobileMenu}
                className="block rounded-full bg-brand-red px-5 py-2 text-center font-bold text-white"
              >
                Iniciar Sesión
              </Link>
            )}
          </li>
        </ul>
      )}
    </header>
  )
}

export default Navbar