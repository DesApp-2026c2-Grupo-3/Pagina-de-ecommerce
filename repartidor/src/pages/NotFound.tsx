
import { useNavigate } from 'react-router-dom'
import { Bike, Home } from 'lucide-react'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-orange-100 via-orange-50 to-white p-4">

    {/* Decoración de fondo */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-orange-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-amber-200/40 blur-3xl" />
    
        <section className="relative grid w-full max-w-3xl items-center 
        gap-6 rounded-3xl border border-orange-100 bg-white p-7 shadow-2xl
        shadow-orange-200/40 sm:p-10 md:grid-cols-[0.8fr_1.2fr] md:gap-10">

    {/* Código e ícono */}
        <div className="flex flex-col items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl
             bg-gradient-to-br from-orange-500 to-orange-600 text-white
             shadow-lg shadow-orange-200">
                <Bike size={34} strokeWidth={1.8} />
            </div>

            <p className="mt-4 text-7xl font-black tracking-tight text-orange-500 sm:text-8xl">
                404
            </p>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-orange-400">
                Página no encontrada
            </p>
        </div>

  {/* Mensaje y acciones */}
        <div className="text-center md:text-left">
            <h1 className="text-2xl font-extrabold text-slate-800 sm:text-3xl">
                ¡Ups! Te perdiste en el camino
            </h1>

            <p className="mt-3 text-sm leading-7 text-slate-500">
                Parece que esta página no existe o que la dirección que ingresaste
                no es correcta. ¡Volvamos a encontrar el camino!
            </p>

            <button onClick={() => navigate('/')}
            className="mt-6 inline-flex w-full items-center justify-center gap-2
             rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3.5 
             text-sm font-bold text-white shadow-lg shadow-orange-200 transition 
             hover:-translate-y-0.5 hover:from-orange-600 hover:to-orange-700 sm:w-auto">
                <Home size={18} />
                Volver al inicio
            </button>

            <p className="mt-5 border-t border-orange-100 pt-4 text-xs text-slate-400">
                Verificá la dirección e intentá nuevamente.
            </p>
        </div>
        </section>
    </main>
  )
}
