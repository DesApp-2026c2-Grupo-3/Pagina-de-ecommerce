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
] as const

const STYLES = {
  section: 'bg-brand-red px-4 py-12 text-white md:py-16',
  container: 'mx-auto max-w-7xl',
  title: 'font-display text-4xl font-extrabold tracking-tight',
  subtitle: 'mt-2 text-white',
  grid: 'mt-8 grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4',
  card: 'flex w-full items-center gap-3 rounded-3xl border-2 border-brand-dark bg-brand-cream px-4 py-3 text-brand-dark shadow-sticker transition-transform hover:translate-y-0.5 md:gap-4 md:px-5 md:py-4',
  iconBadge: 'grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand-mustard md:h-12 md:w-12',
  icon: 'h-5 w-5 md:h-6 md:w-6',
  cardTitle: 'block text-sm font-bold leading-tight md:text-base',
  cardDetail: 'mt-0.5 block truncate text-xs font-medium text-brand-muted md:text-sm',
} as const

function ContactSection() {
  return (
    <section id="contacto" className={STYLES.section}>
      <div className={STYLES.container}>
        <h2 className={STYLES.title}>Hablemos</h2>
        <p className={STYLES.subtitle}>Escribinos por cualquiera de estos medios.</p>

        <div className={STYLES.grid}>
          {CANALES.map(({ titulo, dato, href, externo, Icono }) => (
            <a
              key={titulo}
              href={href}
              {...(externo ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className={STYLES.card}
            >
              <span className={STYLES.iconBadge}>
                <Icono className={STYLES.icon} />
              </span>

              <span className="min-w-0 flex-1">
                <span className={STYLES.cardTitle}>{titulo}</span>
                <span className={STYLES.cardDetail}>{dato}</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ContactSection
