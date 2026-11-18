import { BriefcaseBusiness, GraduationCap, Sparkles, Users } from 'lucide-react'
import Carousel from '../home/Carousel'

const MOTIVOS = [
  { titulo: 'Sumate al equipo', texto: 'Formá parte de nuestro equipo en nuestras distintas sucursales.', Icono: Users },
  { titulo: 'Aprendé y crecé', texto: 'Buscamos personas comprometidas con ganas de seguir aprendiendo.', Icono: GraduationCap },
  { titulo: 'Sé parte de la experiencia', texto: 'Ayudanos a brindar una buena experiencia a cada cliente.', Icono: Sparkles },
] as const

const STYLES = {
  section: 'scroll-mt-24 bg-brand-red px-4 py-12 text-white md:py-20',
  container: 'mx-auto max-w-6xl',
  header: 'flex flex-wrap items-center gap-5',
  badge:
    'grid h-16 w-16 shrink-0 -rotate-6 place-items-center rounded-2xl border-[3px] border-brand-dark bg-brand-mustard text-brand-dark',
  badgeIcon: 'h-8 w-8',
  headerTextCol: 'min-w-0 flex-1 basis-72',
  title: 'font-display text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl',
  subtitle: 'mt-2 max-w-2xl text-white/85',
  mobileWrapper: 'mt-8 block pb-8 md:hidden',
  mobileSlide: 'w-full animate-fade-in px-1 pb-2',
  desktopWrapper: 'mt-10 hidden md:block',
  desktopGrid: 'grid grid-cols-3 gap-5',
  card: 'flex h-full min-h-[12rem] flex-col gap-3 rounded-3xl border-2 border-brand-dark bg-brand-cream p-6 text-brand-dark shadow-sticker',
  cardIcon: 'h-7 w-7 text-brand-red',
  cardTitle: 'font-display text-xl font-extrabold',
  cardText: 'text-brand-muted',
  closingText: 'mt-8 font-display text-xl font-extrabold sm:text-2xl md:mt-10',
} as const

function TrabajaConNosotros() {
  return (
    <section id="trabaja-con-nosotros" className={STYLES.section}>
      <div className={STYLES.container}>
        <div className={STYLES.header}>
          <span className={STYLES.badge}>
            <BriefcaseBusiness className={STYLES.badgeIcon} />
          </span>
          <div className={STYLES.headerTextCol}>
            <h2 className={STYLES.title}>Trabajá con nosotros</h2>
            <p className={STYLES.subtitle}>
              Buscamos personas con ganas de aprender, crecer y formar parte de un equipo dinámico.
            </p>
          </div>
        </div>

        <div className={STYLES.mobileWrapper}>
          <Carousel autoPlayMs={5000}>
            {MOTIVOS.map(({ titulo, texto, Icono }) => (
              <div key={titulo} className={STYLES.mobileSlide}>
                <article className={STYLES.card}>
                  <Icono className={STYLES.cardIcon} />
                  <h3 className={STYLES.cardTitle}>{titulo}</h3>
                  <p className={STYLES.cardText}>{texto}</p>
                </article>
              </div>
            ))}
          </Carousel>
        </div>

        <div className={STYLES.desktopWrapper}>
          <div className={STYLES.desktopGrid}>
            {MOTIVOS.map(({ titulo, texto, Icono }) => (
              <article key={titulo} className={STYLES.card}>
                <Icono className={STYLES.cardIcon} />
                <h3 className={STYLES.cardTitle}>{titulo}</h3>
                <p className={STYLES.cardText}>{texto}</p>
              </article>
            ))}
          </div>
        </div>

        <p className={STYLES.closingText}>
          Queremos crecer junto a las personas que forman parte de BurgerFast.
        </p>
      </div>
    </section>
  )
}

export default TrabajaConNosotros
