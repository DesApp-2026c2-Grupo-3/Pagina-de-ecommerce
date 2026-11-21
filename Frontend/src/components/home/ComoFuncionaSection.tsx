import { Bike, ChefHat, ShoppingBag } from 'lucide-react'
import Carousel from './Carousel'

const PASOS = [
  {
    titulo: 'Elegí tu antojo',
    texto: 'Armá tu pedido y personalizá cada producto: sacá o sumá ingredientes y elegí el tamaño.',
    Icono: ShoppingBag,
  },
  {
    titulo: 'Lo preparamos al toque',
    texto: 'La sucursal más cercana con stock recibe tu pedido y arranca a cocinar.',
    Icono: ChefHat,
  },
  {
    titulo: 'Te lo llevamos',
    texto: 'Seguí el estado de tu pedido desde tu historial hasta que llegue a tu puerta.',
    Icono: Bike,
  },
] as const

const STYLES = {
  section: 'relative bg-brand-dark px-4 py-12 text-brand-cream md:py-20',
  container: 'mx-auto max-w-7xl',
  title: 'mb-10 font-display text-3xl font-extrabold tracking-tight md:text-5xl',
  mobileWrapper: 'block pb-8 md:hidden',
  mobileSlide: 'w-full animate-fade-in px-1',
  mobileCard:
    'flex h-full min-h-[14rem] w-full flex-col justify-between gap-4 rounded-[1.75rem] border border-white/10 bg-white/5 p-7',
  desktopWrapper: 'hidden md:block',
  desktopGrid: 'grid grid-cols-3 gap-6',
  desktopCard: 'flex h-full flex-col justify-between gap-4 rounded-[1.75rem] border border-white/10 bg-white/5 p-7',
  cardHeader: 'flex items-center justify-between',
  stepNumberMobile: 'font-display text-5xl font-extrabold leading-none text-brand-mustard',
  stepNumberDesktop: 'font-display text-6xl font-extrabold leading-none text-brand-mustard',
  iconBadge: 'grid h-14 w-14 place-items-center rounded-2xl bg-brand-red',
  icon: 'h-7 w-7 text-white',
  cardBody: 'mt-2 flex flex-1 flex-col gap-1',
  cardTitleMobile: 'font-display text-xl font-extrabold',
  cardTitleDesktop: 'font-display text-2xl font-extrabold',
  cardText: 'leading-relaxed text-brand-cream/75',
} as const

function ComoFuncionaSection() {
  return (
    <section className={STYLES.section}>
      <div className={STYLES.container}>
        <h2 className={STYLES.title}>
          De la plancha <span className="text-brand-mustard">a tu puerta</span>
        </h2>

        <div className={STYLES.mobileWrapper}>
          <Carousel autoPlayMs={5000}>
            {PASOS.map(({ titulo, texto, Icono }, i) => (
              <div key={titulo} className={STYLES.mobileSlide}>
                <div className={STYLES.mobileCard}>
                  <div className={STYLES.cardHeader}>
                    <span className={STYLES.stepNumberMobile}>{String(i + 1).padStart(2, '0')}</span>
                    <span className={STYLES.iconBadge}>
                      <Icono className={STYLES.icon} />
                    </span>
                  </div>
                  <div className={STYLES.cardBody}>
                    <h3 className={STYLES.cardTitleMobile}>{titulo}</h3>
                    <p className={`${STYLES.cardText} text-sm`}>{texto}</p>
                  </div>
                </div>
              </div>
            ))}
          </Carousel>
        </div>

        <div className={STYLES.desktopWrapper}>
          <ol className={STYLES.desktopGrid}>
            {PASOS.map(({ titulo, texto, Icono }, i) => (
              <li key={titulo} className={STYLES.desktopCard}>
                <div className={STYLES.cardHeader}>
                  <span className={STYLES.stepNumberDesktop}>{String(i + 1).padStart(2, '0')}</span>
                  <span className={STYLES.iconBadge}>
                    <Icono className={STYLES.icon} />
                  </span>
                </div>
                <div className={STYLES.cardBody}>
                  <h3 className={STYLES.cardTitleDesktop}>{titulo}</h3>
                  <p className={STYLES.cardText}>{texto}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

export default ComoFuncionaSection
