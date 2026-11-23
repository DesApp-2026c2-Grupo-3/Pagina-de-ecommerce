import { useEffect, useState } from 'react'
import { Quote, Star } from 'lucide-react'
import { getCalificacionesRecientes } from '../../services/calificacionService'
import { formatearFechaHora } from '../../utils/fechas'
import CarruselFlechas from '../ui/CarruselFlechas'
import type { CalificacionPublica } from '../../types/calificacion'

const ESTRELLAS = [1, 2, 3, 4, 5] as const

const STYLES = {
  section: 'overflow-hidden bg-brand-sand/50 px-4 py-12 text-brand-dark sm:py-16 md:py-20',
  container: 'mx-auto max-w-7xl',
  header: 'mb-8 text-center sm:mb-12',
  eyebrow: 'text-xs font-bold uppercase tracking-wider text-brand-muted sm:text-sm',
  title: 'mt-1 font-display text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl',
  carouselList:
    'gap-4 pb-4 pt-6 snap-x snap-mandatory sm:gap-6 lg:flex lg:flex-wrap lg:justify-center lg:gap-8 lg:overflow-visible',
  slideWrapper:
    'flex min-w-full w-full shrink-0 snap-center justify-center px-2 sm:min-w-0 sm:w-[calc((100%-1.5rem)/2)] sm:px-0 lg:w-[calc(33.333%-1.5rem)] lg:shrink',
  cardBase:
    'relative flex w-full max-w-md flex-col gap-3.5 rounded-[1.75rem] border-2 border-brand-dark bg-white p-6 pt-8 shadow-sticker transition-transform duration-300 hover:rotate-0 sm:max-w-sm sm:gap-4 sm:p-7 sm:pt-9 lg:max-w-none',
  quoteBadge:
    'absolute -top-5 left-6 grid h-10 w-10 place-items-center rounded-full border-2 border-brand-dark bg-brand-mustard',
  quoteIcon: 'h-5 w-5 fill-brand-dark text-brand-dark',
  starsRow: 'flex gap-0.5',
  starBase: 'h-4 w-4 sm:h-5 sm:w-5',
  starFilled: 'fill-brand-mustard text-brand-dark',
  starEmpty: 'fill-white text-brand-dark/30',
  comment: 'flex-1 break-words text-base leading-relaxed sm:text-lg',
  authorRow: 'flex items-center gap-3 border-t-2 border-dashed border-brand-sand pt-3.5 sm:pt-4',
  avatar:
    'grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-red font-display text-base font-extrabold text-white sm:h-11 sm:w-11 sm:text-lg',
  authorName: 'truncate font-display text-base font-extrabold leading-tight sm:text-lg',
  authorDate: 'text-xs text-brand-muted',
} as const

function OpinionesSection() {
  const [opiniones, setOpiniones] = useState<CalificacionPublica[]>([])

  useEffect(() => {
    getCalificacionesRecientes()
      .then(setOpiniones)
      .catch(() => setOpiniones([]))
  }, [])

  if (opiniones.length === 0) return null

  return (
    <section className={STYLES.section}>
      <div className={STYLES.container}>
        <div className={STYLES.header}>
          <p className={STYLES.eyebrow}>Opiniones reales</p>
          <h2 className={STYLES.title}>
            Lo que dicen <span className="text-brand-red">nuestros clientes</span>
          </h2>
        </div>

        <CarruselFlechas etiqueta="Opiniones de nuestros clientes" claseLista={STYLES.carouselList}>
          {opiniones.map((o, i) => (
            <div key={o.id} className={STYLES.slideWrapper}>
              <article className={`${STYLES.cardBase} ${i % 2 === 0 ? 'lg:-rotate-1' : 'lg:rotate-1'}`}>
                <span className={STYLES.quoteBadge}>
                  <Quote className={STYLES.quoteIcon} />
                </span>

                <div className={STYLES.starsRow} aria-label={`${o.puntaje} de 5 estrellas`}>
                  {ESTRELLAS.map((n) => (
                    <Star
                      key={n}
                      className={`${STYLES.starBase} ${n <= o.puntaje ? STYLES.starFilled : STYLES.starEmpty}`}
                      strokeWidth={1.75}
                    />
                  ))}
                </div>

                <p className={STYLES.comment}>{o.comentario}</p>

                <div className={STYLES.authorRow}>
                  <span className={STYLES.avatar}>{o.nombre.charAt(0).toUpperCase()}</span>
                  <div className="min-w-0">
                    <p className={STYLES.authorName}>{o.nombre}</p>
                    <p className={STYLES.authorDate}>{formatearFechaHora(o.fecha)}</p>
                  </div>
                </div>
              </article>
            </div>
          ))}
        </CarruselFlechas>
      </div>
    </section>
  )
}

export default OpinionesSection
