import { useEffect, useRef, useState } from 'react'
import type { CarouselSlide } from '../../types/carousel'
import { ArrowBigLeft, ArrowBigRight } from 'lucide-react'
import SlideContent from './SlideContent'
import SlideBackdrop from './SlideBackdrop'

interface CarouselProps {
  slides?: CarouselSlide[]
  autoPlayMs?: number
  transparentesEnMovil?: boolean
  children?: React.ReactNode[]
}

const STYLES = {
  section: 'relative overflow-hidden border-b-4 border-brand-red bg-brand-dark text-white',
  // Mantenemos el padding original para que la altura de la imagen del Hero no cambie
  slideContainer:
    'relative flex min-h-[17rem] w-full items-center px-4 pb-16 pt-8 md:mx-auto md:min-h-[30rem] md:max-w-7xl md:py-12',
  navBtnBase:
    'absolute top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/20 p-2 text-2xl leading-none text-white transition-colors hover:bg-black/40',
  heroNavBtn: 'hidden md:block',
  // Solo movemos la posición absoluta de los puntitos (cero impacto en la altura del Hero)
  heroDotsWrapper: 'absolute bottom-8 min-[430px]:bottom-6 left-0 right-0 z-20 flex justify-center sm:bottom-8 md:bottom-12',
  // Área táctil de 24 × 24 px alrededor del puntito (Lighthouse, tamaño de objetivos táctiles)
  dotTarget: 'grid h-6 min-w-6 place-items-center',
  dotBase: 'h-2 rounded-full transition-all',
  dotActive: 'w-6 bg-brand-mustard',
  dotInactive: 'w-2 bg-white/40',
} as const



function Carousel({
  slides = [],
  autoPlayMs = 6000,
  transparentesEnMovil = false,
  children,
}: CarouselProps) {
  const [index, setIndex] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const totalItems = children ? children.length : slides.length

  useEffect(() => {
    setIndex(0)
  }, [totalItems])

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (totalItems <= 1) return

    timerRef.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % totalItems)
    }, autoPlayMs)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [totalItems, autoPlayMs, index])

  function goTo(next: number) {
    setIndex((next + totalItems) % totalItems)
  }

  if (children) {
    return (
      <div className="relative w-full">
        <div className="flex w-full justify-center transition-all duration-300">
          {children[index]}
        </div>

        {totalItems > 1 && (
          <>
            <button
              type="button"
              aria-label="Anterior"
              onClick={() => goTo(index - 1)}
              className={`${STYLES.navBtnBase} left-[-8px]`}
            >
              <ArrowBigLeft size={18} />
            </button>

            <button
              type="button"
              aria-label="Siguiente"
              onClick={() => goTo(index + 1)}
              className={`${STYLES.navBtnBase} right-[-8px]`}
            >
              <ArrowBigRight size={18} />
            </button>

            <div className="absolute -bottom-10 left-0 right-0 flex justify-center">
              {children.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Ir al slide ${i + 1}`}
                  aria-current={i === index}
                  onClick={() => goTo(i)}
                  className={STYLES.dotTarget}
                >
                  <span className={`${STYLES.dotBase} ${i === index ? STYLES.dotActive : STYLES.dotInactive}`} />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  const slide = slides[index]
  if (!slide) return null

  return (
    <section className={STYLES.section}>
      <SlideBackdrop imagen={slide.backgroundImage} />

      <div className={STYLES.slideContainer}>
        <SlideContent slide={slide} transparentesEnMovil={transparentesEnMovil} />
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Slide anterior"
            onClick={() => goTo(index - 1)}
            className={`${STYLES.navBtnBase} ${STYLES.heroNavBtn} left-2`}
          >
            <ArrowBigLeft size={18} />
          </button>

          <button
            type="button"
            aria-label="Slide siguiente"
            onClick={() => goTo(index + 1)}
            className={`${STYLES.navBtnBase} ${STYLES.heroNavBtn} right-2`}
          >
            <ArrowBigRight size={18} />
          </button>

                    <div className={STYLES.heroDotsWrapper}>
            {slides.map((s, i) => (
              <button
                key={s.id || i}
                type="button"
                aria-label={`Ir al slide ${i + 1}`}
                aria-current={i === index}
                onClick={() => goTo(i)}
                className={STYLES.dotTarget}
              >
                <span className={`${STYLES.dotBase} ${i === index ? STYLES.dotActive : STYLES.dotInactive}`} />
              </button>
            ))}
          </div>

        </>
      )}
    </section>
  )
}

export default Carousel
