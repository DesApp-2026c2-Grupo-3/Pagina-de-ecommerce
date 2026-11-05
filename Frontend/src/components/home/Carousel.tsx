import { useEffect, useRef, useState } from 'react'
import type { CarouselSlide } from '../../types/carousel'
import { ArrowBigLeft, ArrowBigRight } from 'lucide-react'
import SlideContent from './SlideContent'
import SlideBackdrop from './SlideBackdrop'

interface CarouselProps {
  slides: CarouselSlide[]
  autoPlayMs?: number

  transparentesEnMovil?: boolean
}

function Carousel({ slides, autoPlayMs = 6000, transparentesEnMovil = false }: CarouselProps) {
  const [index, setIndex] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setIndex(0)
  }, [slides.length])

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (slides.length <= 1) return

    timerRef.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length)
    }, autoPlayMs)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [slides.length, autoPlayMs, index])

  function goTo(next: number) {
    setIndex((next + slides.length) % slides.length)
  }

  const slide = slides[index]
  if (!slide) return null

  return (
    <section className="relative overflow-hidden border-b-4 border-brand-red bg-brand-dark text-white">
      <SlideBackdrop imagen={slide.backgroundImage} />

      {/* 
        🛠️ REDUCCIÓN DE ALTURA COMPACTA EN SM Y MÓVIL:
        - Mantenemos la compresión perfecta de altura (min-h-[17rem]) y el control de ancho responsivo.
      */}
      <div className="relative mx-auto flex min-h-[17rem] w-full max-w-[320px] items-center px-4 pb-16 pt-8 sm:max-w-md md:mx-auto md:min-h-[30rem] md:max-w-7xl md:py-12">
        {/* 
          🔑 PASES CLAVE: 
          Le inyectamos el nuevo parámetro al componente hijo para que se encargue de mutar las clases del botón.
        */}
        <SlideContent slide={slide} transparentesEnMovil={transparentesEnMovil} />
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Slide anterior"
            onClick={() => goTo(index - 1)}
            className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/20 p-2 text-2xl leading-none text-white transition-colors hover:bg-black/40 md:block"
          >
            <ArrowBigLeft size={18} />
          </button>

          <button
            type="button"
            aria-label="Slide siguiente"
            onClick={() => goTo(index + 1)}
            className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/20 p-2 text-2xl leading-none text-white transition-colors hover:bg-black/40 md:block"
          >
            <ArrowBigRight size={18} />
          </button>

          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={`Ir al slide ${i + 1}`}
                aria-current={i === index}
                onClick={() => goTo(i)}
                className={`h-2 rounded-full transition-all ${
                  i === index ? 'w-6 bg-brand-mustard' : 'w-2 bg-white/40'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}

export default Carousel;
