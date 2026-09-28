import { useEffect, useState } from 'react'
import BranchCard from '../contact/BranchCard'
import { getSucursales } from '../../services/sucursalService'
import type { Sucursal } from '../../types/sucursal'
import { Mail, MessageCircleMore, PhoneCall } from 'lucide-react'

function ContactSection() {
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSucursales()
      .then(setSucursales)
      .finally(() => setLoading(false))
  }, [])

  return (
    <section id="contacto" className=" flex items-center justify-center mx-auto 
    px-4 py-6 bg-gradient-to-l from-red-700 to-red-900 border-t-5 border-red-950">
      <div>
      <h2 className="text-2xl font-extrabold text-white sm:text-3xl">Contacto</h2>
      <p className="mt-2 text-gray-100">
        Encontrá la sucursal más cercana o escribinos por cualquiera de estos medios.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3 ">
        <a
          href="https://wa.me/5491122334455"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-2xl border px-5 py-4
          bg-white/10 border border-white/10 transition-transform hover:translate-y-0.5"
        >
          <MessageCircleMore size={30}/>
          <div>
            <p className="font-bold text-white">WhatsApp</p>
            <p className="text-sm text-gray-100">011 2233-4455</p>
          </div>
        </a>
        <a
          href="mailto:contacto@burgerfast.com"
          className="flex items-center gap-3 rounded-2xl bg-white/10 border border-white/10
           px-5 py-4 transition-transform hover:translate-y-0.5"
        >
          <Mail size={30} />
          <div>
            <p className="font-bold text-white">Email</p>
            <p className="text-sm text-gray-100">contacto@burgerfast.com</p>
          </div>
        </a>
        <a
          href="tel:08001234567"
          className="flex items-center gap-3 rounded-2xl bg-white/10 border border-white/10
          px-5 py-4 transition-transform hover:translate-y-0.5"
        >
          <PhoneCall size={30} />
          <div>
            <p className="font-bold text-white">Línea gratuita</p>
            <p className="text-sm text-gray-100">0800-123-4567</p>
          </div>
        </a>
      </div>

      {/*<h3 className="mt-12 text-xl font-extrabold text-brand-dark">Nuestras sucursales</h3>

      {loading ? (
        <p className="mt-6 text-gray-600">Cargando sucursales...</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sucursales.map((sucursal) => (
            <BranchCard key={sucursal.id} sucursal={sucursal} />
          ))}
        </div>
      )}*/}
      </div>
    </section>
  )
}

export default ContactSection
