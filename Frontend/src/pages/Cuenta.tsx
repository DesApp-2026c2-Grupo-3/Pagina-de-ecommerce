import { Link, Navigate } from 'react-router-dom'
import { ChevronRight, LogOut, Store } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ACCOUNT_LINKS } from '../config/navigation'
import { useCerrarSesion } from '../hooks/useCerrarSesion'

const filaLink = 'flex min-h-16 items-center gap-4 border-b-2 border-dashed border-brand-sand px-4 font-bold last:border-b-0'

// "Mi cuenta" en celular: los accesos que en escritorio están en el menú desplegable
function Cuenta() {
  const { user, isAuthenticated } = useAuth()
  const cerrarSesion = useCerrarSesion()

  if (!isAuthenticated || !user) return <Navigate to="/login" replace />

  const inicial = user.name.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-brand-cream text-brand-dark">
      <section className="bg-brand-dark px-4 pb-16 pt-8 text-brand-cream">
        <div className="mx-auto flex max-w-2xl items-center gap-4">
          <span className="grid h-16 w-16 shrink-0 -rotate-6 place-items-center rounded-2xl border-[3px] border-brand-cream bg-brand-mustard font-display text-3xl font-extrabold text-brand-dark">
            {inicial}
          </span>
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-extrabold capitalize leading-tight">{user.name}</h1>
            <p className="truncate text-brand-cream/70">{user.email}</p>
          </div>
        </div>
      </section>

      <div className="mx-auto -mt-8 flex max-w-2xl flex-col gap-4 px-4 pb-10">
        <nav aria-label="Mi cuenta" className="overflow-hidden rounded-3xl border-2 border-brand-dark bg-white shadow-sticker">
          {ACCOUNT_LINKS.map(({ label, to, Icono }, i) => (
            <Link key={to} to={to} className={filaLink}>
              <span className={`grid h-10 w-10 place-items-center rounded-xl ${i % 2 === 0 ? 'bg-brand-mustard' : 'bg-brand-cream'}`}>
                <Icono className="h-5 w-5" />
              </span>
              <span className="flex-1">{label}</span>
              <ChevronRight className="h-5 w-5 text-brand-muted" />
            </Link>
          ))}
        </nav>

        <nav aria-label="Más" className="overflow-hidden rounded-3xl border-2 border-brand-dark bg-white">
          <Link to="/conocenos" className={filaLink}>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-cream">
              <Store className="h-5 w-5" />
            </span>
            <span className="flex-1">Nosotros y sucursales</span>
            <ChevronRight className="h-5 w-5 text-brand-muted" />
          </Link>
        </nav>

        <button
          type="button"
          onClick={cerrarSesion}
          className="flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-brand-red font-bold text-brand-red transition-colors hover:bg-brand-red hover:text-white"
        >
          <LogOut className="h-5 w-5" /> Cerrar sesión
        </button>
      </div>
    </div>
  )
}

export default Cuenta