import { Link } from "react-router-dom";

export default function NotFound() {
  
  return (
    <main
    className="flex flex-col items-center justify-center min-h-screen bg-cover bg-center bg-no-repeat relative"
    style={{ backgroundImage: "url('/notfound.png')" }}
    >
      <div className='flex flex-col items-center justify-center
      p-8 mb-10 gap-4 rounded-xl bg-slate-200 border border-2 border-slate-300'>
      <h1 className="text-8xl font-bold">
        404
      </h1>

      <h2 className="text-4xl font-semibold mt-4">
        Página no encontrada
      </h2>

      <p className="text-gray-600 text-2xl mt-2">
        La página que estás buscando no existe.
      </p>

      <Link to='/admin'
      className='hover:bg-orange-700 text-white text-3xl font-bold
      bg-orange-500
      rounded p-2 transition-colors'>Volver</Link>
      </div>
    </main>
  )
}