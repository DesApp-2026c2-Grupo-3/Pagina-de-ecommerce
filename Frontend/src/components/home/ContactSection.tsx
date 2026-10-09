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
    <section id="contacto" className="bg-brand-red px-4 py-16 text-white">
      <div className="mx-auto max-w-7xl">
        <h2 className="font-display text-4xl font-extrabold tracking-tight">Hablemos</h2>
        <p className="mt-2 text-white/85">Escribinos por cualquiera de estos medios.</p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {CANALES.map(({ titulo, dato, href, externo, Icono }) => (
            <a
              key={titulo}
              href={href}
              {...(externo ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="flex items-center gap-4 rounded-3xl border-2 border-brand-dark bg-brand-cream px-5 py-4 text-brand-dark shadow-sticker transition-transform hover:-translate-y-0.5"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-mustard">
                <Icono size={24} />
              </span>
              <span className="min-w-0">
                <span className="block font-bold">{titulo}</span>
                <span className="block truncate text-sm text-brand-muted">{dato}</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ContactSection