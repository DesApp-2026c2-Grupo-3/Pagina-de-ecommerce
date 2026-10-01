import { Link } from 'react-router-dom'
import { SendHorizonal } from 'lucide-react'
function GuestQuickAccessRow() {
  return (
    <section className="border-b-3 border-red-950 border-t-3 bg-gradient-to-t from-red-700 via-red-800 to-red-900">
       

      <div className="mx-auto max-w-7xl px-4 py-6">
        
        <div
          className="flex flex-col items-center justify-between gap-8 
          rounded-2xl bg-brand-cream px-6 py-5 text-center 
           sm:flex-row sm:text-left">

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex justify-center items-center shrink-0 h-12 w-12 rounded-full
             bg-red-800 text-2xl text-white">
              <SendHorizonal size={26} color='#fffdfd'  />
            </div>
            <div>
              <p className="font-extrabold text-brand-dark">
                Crea tu cuenta y pedi mas facil!
              </p>
              <p className="text-sm text-gray-600">
                Guarda tus datos, consulta tus pedidos y disfruta una experiencia de compra mas rapida.
              </p>
            </div>
          </div>
          <Link to='/registro' className='transition-transform hover:translate-y-0.5'>
          <span className="shrink-0 rounded-xl bg-red-800  hover:bg-red-900 
           px-5 py-4 font-bold text-white">
            Registrarse
          </span>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default GuestQuickAccessRow
