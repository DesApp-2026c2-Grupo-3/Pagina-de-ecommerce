import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-6 px-4 py-24 text-center">
      <p className="text-8xl font-extrabold text-brand-red">404</p>
      <h1 className="text-3xl font-extrabold text-brand-dark">Página no encontrada</h1>
      <p className="text-gray-600">La página que buscás no existe o fue movida.</p>
      <Link
        to="/"
        className="rounded-full bg-brand-red px-6 py-3 font-bold text-white transition-opacity hover:opacity-90"
      >
        Volver al inicio
      </Link>
    </div>
  )
}

export default NotFound
