import { Link } from 'react-router-dom'

function GuestQuickAccessRow() {
  return (
    <section className="border-b border-brand-dark/10 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Link
          to="/registro"
          className="flex flex-col items-center justify-between gap-4 rounded-2xl bg-brand-cream px-6 py-5 text-center transition-transform hover:-translate-y-0.5 sm:flex-row sm:text-left"
        >
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-red text-2xl text-white">
              🎁
            </span>
            <div>
              <p className="font-extrabold text-brand-dark">
                Creá tu cuenta y aprovechá los beneficios
              </p>
              <p className="text-sm text-gray-600">
                Guardá tus direcciones, seguí tus pedidos y agilizá tu próxima compra.
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-brand-red px-5 py-2 font-bold text-white">
            Registrarme
          </span>
        </Link>
      </div>
    </section>
  )
}

export default GuestQuickAccessRow
