import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-brand-dark px-4 py-20 text-brand-cream">
      <div className="flex max-w-xl flex-col items-center gap-6 text-center">
        <div className="relative">
          <p className="font-display text-[9rem] font-extrabold leading-none tracking-tighter text-brand-red sm:text-[12rem]">
            404
          </p>
          <span className="absolute -right-4 top-4 rotate-12 rounded-full border-2 border-brand-dark bg-brand-mustard px-3 py-1 text-sm font-extrabold text-brand-dark">
            ¡Ups!
          </span>
        </div>
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Esta página se la comieron</h1>
        <p className="text-brand-cream/70">La página que buscás no existe o fue movida.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="inline-flex min-h-12 items-center rounded-full bg-brand-red px-6 font-bold text-white transition-transform hover:-translate-y-0.5"
          >
            Volver al inicio
          </Link>
          <Link
            to="/catalogo"
            className="inline-flex min-h-12 items-center rounded-full border-2 border-brand-cream px-6 font-bold transition-colors hover:bg-brand-cream hover:text-brand-dark"
          >
            Ver el menú
          </Link>
        </div>
      </div>
    </div>
  )
}

export default NotFound