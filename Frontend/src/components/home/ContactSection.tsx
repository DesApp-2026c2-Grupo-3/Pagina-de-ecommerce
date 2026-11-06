import { Mail, MessageCircleMore, PhoneCall } from 'lucide-react'

const CANALES = [
  {
    titulo: 'WhatsApp',
    dato: '011 2233-4455',
    href: 'https://wa.me/5491122334455',
    externo: true,
    Icono: MessageCircleMore,
  },
  {
    titulo: 'Email',
    dato: 'contacto@burgerfast.com',
    href: 'mailto:contacto@burgerfast.com',
    externo: false,
    Icono: Mail,
  },
  {
    titulo: 'Línea gratuita',
    dato: '0800-123-4567',
    href: 'tel:08001234567',
    externo: false,
    Icono: PhoneCall,
  },
]

function ContactSection() {
  return (
    /* py-12 en mobile para pegarlo con más armonía tipográfica al footer */
    <section id="contacto" className="bg-brand-red px-4 py-12 md:py-16 text-white">
      <div className="mx-auto max-w-7xl">
        <h2 className="font-display text-4xl font-extrabold tracking-tight">Hablemos</h2>
        <p className="mt-2 text-white/85">Escribinos por cualquiera de estos medios.</p>

        {/* 
          Grilla Responsiva Definitiva:
          - grid-cols-1: Apilado vertical en mobile, pero súper comprimido.
          - sm:grid-cols-1 y md:grid-cols-3: Restablece tu grilla de 3 columnas fijas a los 768px.
        */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {CANALES.map(({ titulo, dato, href, externo, Icono }) => (
            <a
              key={titulo}
              href={href}
              {...(externo ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              /* 
                Compactación de la Tarjeta en Mobile:
                - px-4 py-3: Reducimos el aire interno en pantallas chicas para aplanar los bloques.
                - md:px-5 md:py-4: Recupera tus dimensiones e interlineados originales en PC.
              */
              className="flex items-center gap-3 md:gap-4 rounded-3xl border-2 border-brand-dark bg-brand-cream px-4 py-3 md:px-5 md:py-4 text-brand-dark shadow-sticker transition-transform hover:translate-y-0.5 w-full"
            >
              {/* 
                Ícono Compacto Responsivo:
                - h-10 w-10 en mobile para achicar el círculo de fondo.
                - md:h-12 md:w-12 original de tu diseño en desktop.
              */}
              <span className="grid h-10 w-10 md:h-12 md:w-12 shrink-0 place-items-center rounded-2xl bg-brand-mustard">
                <Icono className="h-5 w-5 md:h-6 md:w-6" />
              </span>
              
              <span className="min-w-0 flex-1">
                {/* Agregamos text-sm en mobile para que el título no compita */}
                <span className="block font-bold text-sm md:text-base leading-tight">{titulo}</span>
                <span className="block truncate text-xs md:text-sm text-brand-muted mt-0.5 font-medium">{dato}</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ContactSection
