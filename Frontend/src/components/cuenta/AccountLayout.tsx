import type { ReactNode } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import CuentaNav from './CuentaNav'

interface Props {
  titulo: string
  subtitulo?: string
  /** Mientras carga se muestra un aviso en lugar del contenido */
  cargando?: boolean
  children: ReactNode
}

// Estructura común de las páginas de "Mi cuenta": banda con el usuario, menú lateral (escritorio) y contenido
function AccountLayout({ titulo, subtitulo, cargando = false, children }: Props) {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated || !user) return <Navigate to="/login" replace />

  const nombreCompleto = [user.name, user.apellido].filter(Boolean).join(' ')

  return (
    <div className="min-h-screen bg-brand-cream text-brand-dark">
      <section className="bg-brand-dark px-4 pb-10 pt-6 text-brand-cream sm:pb-12 sm:pt-10">
        <div className="mx-auto max-w-6xl">
          <Link
            to="/cuenta"
            className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-brand-cream/70 hover:text-brand-cream lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" /> Mi cuenta
          </Link>

          <div className="flex items-center gap-5">
            <span className="grid h-16 w-16 shrink-0 -rotate-6 place-items-center rounded-3xl border-[3px] border-brand-cream bg-brand-mustard font-display text-3xl font-extrabold text-brand-dark sm:h-24 sm:w-24 sm:text-5xl">
              {user.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-3xl font-extrabold capitalize leading-none tracking-tight sm:text-5xl">
                {nombreCompleto}
              </p>
              <p className="mt-2 truncate text-brand-cream/70">{user.email}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-16 pt-8 lg:grid-cols-[17rem_1fr] lg:items-start lg:pt-10">
        <aside className="hidden lg:sticky lg:top-28 lg:block">
          <CuentaNav />
        </aside>

        <main className="flex min-w-0 flex-col gap-5">
          <div>
            <h1 className="font-display text-4xl font-extrabold leading-none tracking-tight">{titulo}</h1>
            {subtitulo && <p className="mt-2 text-brand-muted">{subtitulo}</p>}
          </div>

          {cargando ? (
            <div className="rounded-3xl border-2 border-brand-dark bg-white p-10 text-center font-bold text-brand-muted">
              Cargando...
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  )
}

export default AccountLayout