import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown, ShoppingCart } from 'lucide-react'
import { LogoConEco } from '../logoEcoMotion'

function getNavLinks(isAuthenticated: boolean) {
  const links = [
    { label: 'Home', to: '/' },
    { label: 'Catalogo', to: '/catalogo' },
    { label: 'Promociones', to: '/promociones' },
  ]

  if (!isAuthenticated) {
    links.push({ label: 'Trabajá acá', to: '/#trabaja-con-nosotros' })
    links.push({ label: 'Sobre nosotros', to: '/#sobre-nosotros' })
    links.push({ label: 'Contacto', to: '/#contacto' })
  }

  return links
}

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
  const navigate = useNavigate()
  const menuRef = useRef<HTMLLIElement>(null)
  const navLinks = getNavLinks(isAuthenticated)

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

  // Si el link es "Home" (to === '/') y ya estás en esa ruta, React Router no
  // navega (misma URL) y por lo tanto no hay ningún trigger que suba el scroll.
  // Forzamos el scroll arriba manualmente en ese caso.
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
         {/*
           <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-red text-white">
            B
          </span>
          <span>
            Burger<span className="text-brand-red">Fast</span>
          </span> 
         */}
        {/*<div className="flex-1 flex justify-center items-center">
          <a href="/" className="flex items-center">
            <img 
              src={logo} 
              alt="Logotipo de la empresa" 
              className="h-24 w-auto object-contain"
            />
          </a>
        </div>*/} 
        <LogoConEco isAuthenticated={isAuthenticated} />

        </Link>

        

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
                <div className="absolute right-0 mt-2 w-max overflow-hidden rounded-xl border border-white/10 bg-brand-dark shadow-xl">                    <Link
                      to="/perfil"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 whitespace-nowrap px-4 py-2 font-semibold text-white hover:bg-brand-red"                    >
                      <span>👤</span> Datos personales
                    </Link>
                    <Link
                      to="/direcciones"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 whitespace-nowrap px-4 py-2 font-semibold text-white hover:bg-brand-cream"
                    >
                      <span>📍</span> Direcciones guardadas
                    </Link>
                    <Link
                      to="/historial"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 whitespace-nowrap px-4 py-2 font-semibold text-white hover:bg-brand-cream"
                    >
                      <span>🧾</span> Historial de pedidos
                    </Link>
                    <Link
                      to="/seguridad"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 whitespace-nowrap px-4 py-2 font-semibold text-white hover:bg-brand-cream"
                    >
                      <span>🔒</span> Seguridad
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 whitespace-nowrap border-t border-white/10 px-4 py-2 text-left font-semibold text-brand-red hover:bg-brand-red hover:text-white"                    >
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
            <div className="mt-2 overflow-hidden rounded-xl border border-white/10 bg-brand-dark">              {profileLinks.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={closeMobileMenu}
                      className="flex items-center gap-2 px-4 py-2 font-semibold text-white hover:bg-brand-red"                >
                  <span>{item.icon}</span> {item.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 border-t border-white/10 px-4 py-2 text-left font-semibold text-brand-red hover:bg-brand-red hover:text-white"              >
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