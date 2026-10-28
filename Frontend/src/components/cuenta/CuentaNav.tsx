import { NavLink } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { ACCOUNT_LINKS } from '../../config/navigation'
import { useCerrarSesion } from '../../hooks/useCerrarSesion'

const base = 'flex min-h-12 items-center gap-3 rounded-2xl px-4 font-bold transition-colors'

// Menú lateral de "Mi cuenta" (solo escritorio; en celular se usa la página /cuenta)
function CuentaNav() {
  const cerrarSesion = useCerrarSesion()

  return (
    <nav aria-label="Mi cuenta" className="flex flex-col gap-1 rounded-3xl border-2 border-brand-dark bg-white p-2.5">
      {ACCOUNT_LINKS.map(({ label, to, Icono }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `${base} ${isActive ? 'bg-brand-red text-white' : 'text-brand-dark hover:bg-brand-cream'}`
          }
        >
          <Icono className="h-5 w-5 shrink-0" />
          {label}
        </NavLink>
      ))}

      <hr className="my-2 border-t-2 border-dashed border-brand-sand" />

      <button type="button" onClick={cerrarSesion} className={`${base} text-brand-red hover:bg-brand-red/10`}>
        <LogOut className="h-5 w-5 shrink-0" />
        Cerrar sesión
      </button>
    </nav>
  )
}

export default CuentaNav