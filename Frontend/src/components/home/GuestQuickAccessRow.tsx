import { Link } from 'react-router-dom'
import { UserPlus } from 'lucide-react'

const STYLES = {
  section: 'relative z-10 -mt-6 px-4 pb-6 sm:-mt-8 md:-mt-12 md:pb-10',
  card: 'mx-auto flex max-w-7xl flex-row items-center gap-2 rounded-[1.75rem] border-2 border-brand-dark bg-white px-3 py-3 shadow-sticker md:gap-6 md:p-6',
  iconBadge:
    'grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-brand-dark bg-brand-mustard shadow-sm md:h-14 md:w-14 md:border-2',
  icon: 'h-5 w-5 text-brand-dark md:h-7 md:w-7',
  content: 'min-w-0 flex-1',
  mobileTag: 'block truncate text-[10px] font-bold uppercase tracking-wider text-brand-muted md:hidden',
  desktopTag: 'hidden text-xs font-bold uppercase tracking-wider text-brand-muted md:block',
  title:
    'mt-0.5 truncate font-display text-xs font-extrabold leading-tight text-brand-dark min-[640px]:max-[860px]:text-sm md:mt-0 md:whitespace-normal md:text-2xl',
  description: 'mt-1 hidden text-sm text-brand-muted md:block',
  ctaWrapper: 'max-w-[125px] shrink-0 text-xs sm:max-w-[145px] md:max-w-none md:text-base',
  ctaLink:
    'inline-flex min-h-[2.25rem] items-center justify-center whitespace-nowrap rounded-full bg-brand-red px-3 !font-bold text-white transition-transform hover:translate-y-0.5 md:min-h-12 md:px-6',
} as const

function GuestQuickAccessRow() {
  return (
    <section className={STYLES.section}>
      <div className={STYLES.card}>
        <span className={STYLES.iconBadge}>
          <UserPlus className={STYLES.icon} />
        </span>

        <div className={STYLES.content}>
          <p className={STYLES.mobileTag}>¡Registrate gratis!</p>
          <p className={STYLES.desktopTag}>Creá tu cuenta</p>

          <p className={STYLES.title}>Pedí más fácil y seguí tu delivery</p>

          <p className={STYLES.description}>
            Guardá tus direcciones, seguí tus pedidos y repetilos con un toque.
          </p>
        </div>

        <div className={STYLES.ctaWrapper}>
          <Link to="/registro" className={STYLES.ctaLink}>
            Registrarme
          </Link>
        </div>
      </div>
    </section>
  )
}

export default GuestQuickAccessRow
