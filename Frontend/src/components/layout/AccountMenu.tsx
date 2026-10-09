import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { ACCOUNT_LINKS } from '../../config/navigation'

interface Props {
  onLogout: () => void
}

// Botón "Hola, Juan" con el menú desplegable de la cuenta (escritorio)
function AccountMenu({ onLogout }: Props) {
  const { user } = useAuth()
  const [abierto, setAbierto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Se cierra al hacer clic afuera o con Escape
  useEffect(() => {
    if (!abierto) return
    function clickAfuera(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false)
    }
    function escape(e: KeyboardEvent) {
      if (e.key === 'Escape') setAbierto(false)
    }
    document.addEventListener('mousedown', clickAfuera)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('mousedown', clickAfuera)
      document.removeEventListener('keydown', escape)
    }
  }, [abierto])

  const primerNombre = user?.name?.split(' ')[0] ?? ''
  const inicial = primerNombre.charAt(0).toUpperCase()

  function salir() {
    setAbierto(false)
    onLogout()
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-haspopup="menu"
        className="flex min-h-11 items-center gap-2 rounded-full bg-brand-red py-1.5 pl-1.5 pr-4 font-bold text-white transition hover:brightness-110"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-mustard font-display font-extrabold text-brand-dark">
          {inicial}
        </span>
        <span className="capitalize">Hola, {primerNombre}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${abierto ? 'rotate-180' : ''}`} />
      </button>

      {abierto && (
        <div
          role="menu"
          className="absolute right-0 top-full z-40 mt-3 w-72 rounded-3xl border-2 border-brand-dark bg-brand-cream p-2 text-brand-dark shadow-[6px_6px_0_var(--color-brand-red)]"
        >
          <div className="mb-1 border-b-2 border-dashed border-brand-sand px-3 pb-3 pt-2">
            <p className="font-display text-lg font-extrabold capitalize">{user?.name}</p>
            <p className="truncate text-sm text-brand-muted">{user?.email}</p>
          </div>

          {ACCOUNT_LINKS.map(({ label, to, Icono }) => (
            <Link
              key={to}
              to={to}
              role="menuitem"
              onClick={() => setAbierto(false)}
              className="group flex items-center gap-3 rounded-2xl px-2 py-2 font-bold transition-colors hover:bg-white"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white transition-colors group-hover:bg-brand-mustard">
                <Icono className="h-5 w-5" />
              </span>
              {label}
            </Link>
          ))}

          <button
            type="button"
            role="menuitem"
            onClick={salir}
            className="mt-1 flex w-full items-center gap-3 rounded-2xl border-t-2 border-dashed border-brand-sand px-2 py-2 text-left font-bold text-brand-red transition-colors hover:bg-white"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-red/10">
              <LogOut className="h-5 w-5" />
            </span>
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}

export default AccountMenu