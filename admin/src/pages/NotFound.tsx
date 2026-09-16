import { Link } from "react-router-dom";

export default function NotFound() {
  
  return (
    <main className="flex flex-col items-center justify-center
    min-h-screen ">
      <div className='flex flex-col items-center justify-center
      p-8 gap-4 rounded
      bg-slate-200 border border-2 border-slate-300'>
      <h1 className="text-6xl font-bold">
        404
      </h1>

      <h2 className="text-2xl font-semibold mt-4">
        Página no encontrada
      </h2>

      <p className="text-gray-600 mt-2">
        La página que estás buscando no existe.
      </p>

      <Link to='/admin'
      className='hover:bg-secondary text-secondary text-xl font-bold
      hover:text-white rounded p-2 transition-colors'>Volver</Link>
      </div>
    </main>
  )
}