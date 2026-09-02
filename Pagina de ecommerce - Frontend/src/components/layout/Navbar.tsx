import { useState } from 'react'

const navLinks = [
  { label: 'Home', href: '#top', active: true },
  { label: 'Productos', href: '#' },
  { label: 'Promociones', href: '#' },
  { label: 'Carrito', href: '#' },
]

function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-20 bg-brand-dark shadow-md" id="top">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <a href="#top" className="flex items-center gap-2 text-2xl font-extrabold text-white">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-red text-white">
            B
          </span>
          <span>
            Burger<span className="text-brand-red">Fast</span>
          </span>
        </a>

        <ul className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="rounded-lg px-4 py-2 font-semibold text-white transition-colors hover:bg-brand-red"
              >
                {link.label}
              </a>
            </li>
          ))}
          <li>
            <a
              href="#"
              className="ml-2 rounded-full bg-brand-red px-5 py-2 font-bold text-white transition-opacity hover:opacity-90"
            >
              Iniciar Sesión
            </a>
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
              <a
                href={link.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-4 py-2 font-semibold text-white hover:bg-brand-red"
              >
                {link.label}
              </a>
            </li>
          ))}
          <li>
            <a
              href="#"
              onClick={() => setOpen(false)}
              className="mt-1 block rounded-full bg-brand-red px-5 py-2 text-center font-bold text-white"
            >
              Iniciar Sesión
            </a>
          </li>
        </ul>
      )}
    </header>
  )
}

export default Navbar
