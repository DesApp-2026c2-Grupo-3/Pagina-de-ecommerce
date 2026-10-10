import { Link } from 'react-router-dom'
import { UserPlus } from 'lucide-react'

// Invitación a registrarse (solo para visitantes sin sesión). Mismo formato que la tarjeta de último pedido.
function GuestQuickAccessRow() {
  return (
    <section className="relative z-10 -mt-12 px-4 pb-10">      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-6 rounded-[1.75rem] border-2 border-brand-dark bg-white p-6 shadow-sticker">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-mustard">
          <UserPlus className="h-7 w-7 text-brand-dark" />
        </span>

        <div className="min-w-0 flex-1 basis-64">
          <p className="font-display text-2xl font-extrabold leading-tight text-brand-dark">Creá tu cuenta y pedí más fácil</p>
          <p className="mt-1 text-brand-muted">
            Guardá tus direcciones, seguí tus pedidos y repetilos con un toque.
          </p>
        </div>

        <Link
          to="/registro"
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-brand-red px-6 font-bold text-white transition-transform hover:-translate-y-0.5"
        >
          Registrarme
        </Link>
      </div>
    </section>
  )
}

export default GuestQuickAccessRow