import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'

function getNavLinks(isAuthenticated: boolean) {
  const links = [
    { label: 'Home', to: '/' },
    { label: 'Productos', to: '/productos' },
    { label: 'Promociones', to: '/promociones' },
  ]

  if (!isAuthenticated) {
    links.push({ label: 'Trabajá con nosotros', to: '/#trabaja-con-nosotros' })
  }

  links.push({ label: 'Carrito', to: '/carrito' })
  return links
}

function Navbar() {
  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()
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
    setMenuOpen(false)
    setOpen(false)
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-20 bg-brand-dark shadow-md" id="top">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-2xl font-extrabold text-white">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-red text-white">
            B
          </span>
          <span>
            Burger<span className="text-brand-red">Fast</span>
          </span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <li key={link.label}>
              <Link
                to={link.to}
                className="rounded-lg px-4 py-2 font-semibold text-white transition-colors hover:bg-brand-red"
              >
                {link.label}
              </Link>
            </li>
          ))}

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
                  <div className="absolute right-0 mt-2 w-max overflow-hidden rounded-xl bg-white shadow-xl">
                    <Link
                      to="/perfil"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 whitespace-nowrap px-4 py-2 font-semibold text-brand-dark hover:bg-brand-cream"
                    >
                      <span>👤</span> Datos personales
                    </Link>
                    <Link
                      to="/direcciones"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 whitespace-nowrap px-4 py-2 font-semibold text-brand-dark hover:bg-brand-cream"
                    >
                      <span>📍</span> Direcciones guardadas
                    </Link>
                    <Link
                      to="/historial"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 whitespace-nowrap px-4 py-2 font-semibold text-brand-dark hover:bg-brand-cream"
                    >
                      <span>🧾</span> Historial de pedidos
                    </Link>
                    <Link
                      to="/seguridad"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 whitespace-nowrap px-4 py-2 font-semibold text-brand-dark hover:bg-brand-cream"
                    >
                      <span>🔒</span> Seguridad
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 whitespace-nowrap px-4 py-2 text-left font-semibold text-brand-red hover:bg-brand-cream"
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
          className="rounded-md p-2 text-2xl text-white focus:outline-none focus:ring-2 focus:ring-white md:hidden"
        >
          {open ? '✕' : '☰'}
        </button>
      </nav>

      {open && (
        <ul className="flex flex-col gap-1 border-t border-white/10 bg-brand-dark px-4 pb-4 md:hidden">
          {navLinks.map((link) => (
            <li key={link.label}>
              <Link
                to={link.to}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-4 py-2 font-semibold text-white hover:bg-brand-red"
              >
                {link.label}
              </Link>
            </li>
          ))}

          <li className="mt-1">
            {isAuthenticated ? (
              <div className="flex flex-col gap-1">
                <span className="px-4 py-1 font-semibold text-white">Hola, {user?.name}</span>
                <Link
                  to="/perfil"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-4 py-2 font-semibold text-white hover:bg-brand-red"
                >
                  <span>👤</span> Datos personales
                </Link>
                <Link
                  to="/direcciones"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-4 py-2 font-semibold text-white hover:bg-brand-red"
                >
                  <span>📍</span> Direcciones guardadas
                </Link>
                <Link
                  to="/historial"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-4 py-2 font-semibold text-white hover:bg-brand-red"
                >
                  <span>🧾</span> Historial de pedidos
                </Link>
                <Link
                  to="/seguridad"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-4 py-2 font-semibold text-white hover:bg-brand-red"
                >
                  <span>🔒</span> Seguridad
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-1 flex items-center justify-center gap-2 rounded-full bg-brand-red px-5 py-2 text-center font-bold text-white"
                >
                  <span>🚪</span> Cerrar sesión
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
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