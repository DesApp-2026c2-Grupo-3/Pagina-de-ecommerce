import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import CompanySection from '../components/conocenos/CompanySection'
import TrabajaConNosotros from '../components/conocenos/TrabajaConNosotros'
import SucursalesMap from '../components/home/SucursalesMap'

const STYLES = {
  main: 'overflow-x-hidden bg-brand-cream text-brand-dark',

  // Hero
  heroSection: 'relative overflow-hidden bg-brand-dark text-brand-cream',
  heroBg: 'absolute inset-0 h-full w-full object-cover opacity-100 grayscale',
  heroOverlay: 'absolute inset-0 bg-gradient-to-r from-brand-dark via-brand-dark/85 to-brand-dark/30 md:to-transparent',
  heroContainer: 'relative mx-auto max-w-7xl px-4 py-14 sm:py-20 md:py-28',
  heroKicker: 'text-xs font-extrabold uppercase tracking-widest text-brand-mustard sm:text-sm',
  heroTitle: 'mt-3 font-display text-4xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl md:text-7xl',
  heroHighlight: 'text-brand-red',
  heroSubtitle: 'mt-5 max-w-xl text-base text-brand-cream/85 sm:mt-6 sm:text-lg',
  heroQuote: 'italic text-brand-cream/95',
  heroLeerMasBtn:
    'mt-2 inline-flex items-center gap-1 text-sm font-extrabold text-brand-mustard transition-colors hover:text-white sm:hidden',

  // Quiénes somos
  quienesSection:
    'mx-auto grid max-w-7xl items-center gap-8 px-4 py-14 sm:gap-10 sm:py-16 md:grid-cols-2 md:gap-12 md:py-20',
  quienesKicker: 'text-xs font-extrabold uppercase tracking-widest text-brand-red sm:text-sm',
  quienesTitle: 'mt-2 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl',
  quienesText: 'mt-4 text-sm leading-relaxed text-brand-muted sm:mt-5 sm:line-clamp-none sm:text-base',
  quienesActionsRow: 'mt-3 flex flex-col items-center gap-4 sm:mt-8 sm:flex-row sm:justify-center md:justify-start',
  quienesLeerMasBtn:
    'inline-flex self-start items-center gap-1 text-sm font-extrabold text-brand-red transition-colors hover:text-brand-dark sm:hidden',
  quienesBtn:
    'inline-flex min-h-10 items-center rounded-full bg-brand-red px-5 text-sm font-bold text-white transition-transform hover:translate-y-0.5 sm:min-h-11 sm:px-6',
  leerMasIcon: 'h-4 w-4 transition-transform',
  quienesFrame:
    'mx-2 rotate-1 rounded-[2rem] border-2 border-brand-dark bg-brand-mustard p-2.5 shadow-sticker sm:mx-0 sm:rotate-2 sm:p-3',
  quienesImg: 'h-64 w-full -rotate-1 rounded-3xl object-cover sm:h-80 sm:-rotate-2',
} as const

function Conocenos() {
  const [heroExpandido, setHeroExpandido] = useState(false)
  const [quienesExpandido, setQuienesExpandido] = useState(false)

  return (
    <main className={STYLES.main}>
      {/* Hero: foto de fondo apagada, igual que el carrusel */}
      <section className={STYLES.heroSection}>
        <img src="/Nosotros/1.jpg" alt="" className={STYLES.heroBg} />
        <div className={STYLES.heroOverlay} />

        <div className={STYLES.heroContainer}>
          <p className={STYLES.heroKicker}>Conocenos</p>
          <h1 className={STYLES.heroTitle}>
            Más que una
            <br />
            <span className={STYLES.heroHighlight}>hamburguesa</span>
          </h1>

          {/* Móvil (< sm): cita resumida en itálica con botón Leer todo / Leer menos */}
          <div className="sm:hidden">
            <p className={STYLES.heroSubtitle}>
              {heroExpandido ? (
                <>
                  Somos una cadena de comida rápida enfocada en ofrecer hamburguesas de calidad, atención rápida y{' '}
                  <span className={STYLES.heroQuote}>
                    &ldquo;una experiencia simple desde el primer clic hasta el último bocado&rdquo;
                  </span>
                  .
                </>
              ) : (
                <span className={STYLES.heroQuote}>
                  &ldquo;Una experiencia simple desde el primer clic hasta el último bocado&rdquo;
                </span>
              )}
            </p>
            <button
              type="button"
              onClick={() => setHeroExpandido((prev) => !prev)}
              aria-expanded={heroExpandido}
              className={STYLES.heroLeerMasBtn}
            >
              {heroExpandido ? 'Leer menos' : 'Leer todo'}
              <ChevronDown className={`${STYLES.leerMasIcon} ${heroExpandido ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Desde sm en adelante: texto original completo */}
          <p className={`hidden sm:block ${STYLES.heroSubtitle}`}>
            Somos una cadena de comida rápida enfocada en ofrecer hamburguesas de calidad, atención rápida y una
            experiencia simple desde el primer clic hasta el último bocado.
          </p>
        </div>
      </section>

      {/* Quiénes somos */}
      <section className={STYLES.quienesSection}>
        <div>
          <p className={STYLES.quienesKicker}>Quiénes somos</p>
          <h2 className={STYLES.quienesTitle}>Una forma simple de disfrutar una buena hamburguesa</h2>
          <p className={`${STYLES.quienesText} ${quienesExpandido ? '' : 'line-clamp-2'}`}>
            Nuestro objetivo es hacer que pedir comida sea rápido, cómodo y accesible. Trabajamos para ofrecer productos
            preparados con ingredientes frescos y una experiencia de compra sencilla, tanto desde nuestras sucursales
            como a través de nuestra plataforma online.
          </p>
          <div className={STYLES.quienesActionsRow}>
            <button
              type="button"
              onClick={() => setQuienesExpandido((prev) => !prev)}
              aria-expanded={quienesExpandido}
              className={STYLES.quienesLeerMasBtn}
            >
              {quienesExpandido ? 'Leer menos' : 'Leer más'}
              <ChevronDown className={`${STYLES.leerMasIcon} ${quienesExpandido ? 'rotate-180' : ''}`} />
            </button>

            <Link to="/catalogo" className={STYLES.quienesBtn}>
              Ver el menú
            </Link>
          </div>


        </div>

        <div className={STYLES.quienesFrame}>
          <img
            src="/Nosotros/4.png"
            alt="Persona pidiendo en la web de BurgerFast"
            className={STYLES.quienesImg}
          />
        </div>
      </section>

      <CompanySection />
      <SucursalesMap />
      <TrabajaConNosotros />
    </main>
  )
}

export default Conocenos
