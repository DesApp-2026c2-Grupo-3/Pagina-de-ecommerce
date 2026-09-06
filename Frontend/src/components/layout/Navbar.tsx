import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const navLinks = [
  { label: 'Home', to: '/', active: true },
  { label: 'Productos', to: '/productos', active: false },
  { label: 'Promociones', to: '#', active: false },
  { label: 'Carrito', to: '/carrito', active: false }]

function Navbar() {
  const [open, setOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()

  function handleLogout() {
    logout()
    setOpen(false)
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
          <li>
            {isAuthenticated ? (
              <div className="ml-2 flex items-center gap-3">
                <span className="font-semibold text-white">Hola, {user?.name}</span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full bg-brand-red px-5 py-2 font-bold text-white transition-opacity hover:opacity-90"
                >
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="ml-2 rounded-full bg-brand-red px-5 py-2 font-bold text-white transition-opacity hover:opacity-90"
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
          <li>
            {isAuthenticated ? (
              <div className="mt-1 flex flex-col gap-2">
                <span className="px-4 font-semibold text-white">Hola, {user?.name}</span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="block rounded-full bg-brand-red px-5 py-2 text-center font-bold text-white"
                >
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="mt-1 block rounded-full bg-brand-red px-5 py-2 text-center font-bold text-white"
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