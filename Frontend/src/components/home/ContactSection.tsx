import { useEffect, useState } from 'react'
import BranchCard from '../contact/BranchCard'
import { getSucursales } from '../../services/sucursalService'
import type { Sucursal } from '../../types/sucursal'

function ContactSection() {
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSucursales()
      .then(setSucursales)
      .finally(() => setLoading(false))
  }, [])

  return (
    <section id="contacto" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16">
      <h2 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">Contacto</h2>
      <p className="mt-2 text-gray-600">
        Encontrá la sucursal más cercana o escribinos por cualquiera de estos medios.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <a
          href="https://wa.me/5491122334455"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-2xl border border-brand-dark/10 bg-white px-5 py-4 transition-transform hover:-translate-y-0.5"
        >
          <span className="text-2xl" aria-hidden="true">
            💬
          </span>
          <div>
            <p className="font-bold text-brand-dark">WhatsApp</p>
            <p className="text-sm text-gray-600">011 2233-4455</p>
          </div>
        </a>
        <a
          href="mailto:contacto@burgerfast.com"
          className="flex items-center gap-3 rounded-2xl border border-brand-dark/10 bg-white px-5 py-4 transition-transform hover:-translate-y-0.5"
        >
          <span className="text-2xl" aria-hidden="true">
            ✉️
          </span>
          <div>
            <p className="font-bold text-brand-dark">Email</p>
            <p className="text-sm text-gray-600">contacto@burgerfast.com</p>
          </div>
        </a>
        <a
          href="tel:08001234567"
          className="flex items-center gap-3 rounded-2xl border border-brand-dark/10 bg-white px-5 py-4 transition-transform hover:-translate-y-0.5"
        >
          <span className="text-2xl" aria-hidden="true">
            📞
          </span>
          <div>
            <p className="font-bold text-brand-dark">Línea gratuita</p>
            <p className="text-sm text-gray-600">0800-123-4567</p>
          </div>
        </a>
      </div>

      <h3 className="mt-12 text-xl font-extrabold text-brand-dark">Nuestras sucursales</h3>

      {loading ? (
        <p className="mt-6 text-gray-600">Cargando sucursales...</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sucursales.map((sucursal) => (
            <BranchCard key={sucursal.id} sucursal={sucursal} />
          ))}
        </div>
      )}
    </section>
  )
}

export default ContactSection
