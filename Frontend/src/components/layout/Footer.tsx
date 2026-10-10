import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ACCOUNT_LINKS, NAV_LINKS } from '../../config/navigation'

const tituloColumna = 'mb-3 text-xs font-extrabold uppercase tracking-widest text-brand-mustard'
const linkColumna = 'text-brand-cream/70 transition-colors hover:text-white'

function Footer() {
  const { isAuthenticated } = useAuth()

  return (
    <footer className="hidden border-t-4 border-brand-red bg-brand-dark text-brand-cream lg:block">      
    <div className="mx-auto grid max-w-7xl grid-cols-2 gap-10 px-4 py-14 md:grid-cols-[2fr_1fr_1fr]">
        <div className="col-span-2 flex flex-col gap-4 md:col-span-1">
          <Link to="/" className="w-fit font-display text-4xl font-extrabold tracking-tight">
            Burger<span className="text-brand-red">Fast</span>
          </Link>
          <p className="max-w-sm text-brand-cream/70">
            Hamburguesas hechas al momento en tu sucursal más cercana, listas para llegar a tu puerta.
          </p>
          <Link
            to="/catalogo"
            className="mt-2 inline-flex min-h-11 w-fit items-center rounded-full bg-brand-red px-5 font-bold text-white transition-transform hover:-translate-y-0.5"
          >
            Pedir ahora
          </Link>
        </div>

        <nav aria-label="Navegación del pie">
          <p className={tituloColumna}>Navegá</p>
          <ul className="flex flex-col gap-2">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className={linkColumna}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Tu cuenta">
          <p className={tituloColumna}>Tu cuenta</p>
          <ul className="flex flex-col gap-2">
            {isAuthenticated ? (
              ACCOUNT_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className={linkColumna}>
                    {link.label}
                  </Link>
                </li>
              ))
            ) : (
              <>
                <li>
                  <Link to="/login" className={linkColumna}>Ingresar</Link>
                </li>
                <li>
                  <Link to="/registro" className={linkColumna}>Crear cuenta</Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>

      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-5 text-sm text-brand-cream/50">
          © {new Date().getFullYear()} BurgerFast. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  )
}

export default Footer