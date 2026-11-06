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

function Carousel({ slides = [], autoPlayMs = 6000, transparentesEnMovil = false, children }: CarouselProps) {
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
  }, [totalItems, autoPlayMs])

  function goTo(next: number) {
    if (timerRef.current) clearInterval(timerRef.current)
    setIndex((next + totalItems) % totalItems)
    
    if (totalItems > 1) {
      timerRef.current = setInterval(() => {
        setIndex((prev) => (prev + 1) % totalItems)
      }, autoPlayMs)
    }
  }

  if (children) {
    return (
      <div className="relative w-full">
        <div className="w-full flex justify-center transition-all duration-300">
          {children[index]}
        </div>

        {totalItems > 1 && (
          <>
            <button
              type="button"
              aria-label="Anterior"
              onClick={() => goTo(index - 1)}
              className="absolute left-[-8px] top-1/2 -translate-y-1/2 rounded-full bg-black/20 p-2 text-2xl text-white hover:bg-black/40"
            >
              <ArrowBigLeft size={18} />
            </button>

            <button
              type="button"
              aria-label="Siguiente"
              onClick={() => goTo(index + 1)}
              className="absolute right-[-8px] top-1/2 -translate-y-1/2 rounded-full bg-black/20 p-2 text-2xl text-white hover:bg-black/40"
            >
              <ArrowBigRight size={18} />
            </button>

            <div className="absolute -bottom-8 left-0 right-0 flex justify-center gap-2">
              {children.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Ir al slide ${i + 1}`}
                  onClick={() => goTo(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === index ? 'w-6 bg-brand-mustard' : 'w-2 bg-white/40'
                  }`}
                />
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
    <section className="relative overflow-hidden border-b-4 border-brand-red bg-brand-dark text-white">
      <SlideBackdrop imagen={slide.backgroundImage} />
      
      {/* 
        🛠️ CORRECCIÓN AQUÍ: 
        Cambiamos 'max-w-[320px] sm:max-w-md' por 'w-full' para que en móviles use todo el ancho real de la pantalla.
        Mantenemos intacto el max-w-7xl y el md:mx-auto para proteger el modo escritorio.
      */}
      <div className="relative flex min-h-[17rem] w-full items-center px-4 pb-16 pt-8 md:mx-auto md:min-h-[30rem] md:max-w-7xl md:py-12">
        <SlideContent slide={slide} transparentesEnMovil={transparentesEnMovil} />
      </div>
      
      {slides.length > 1 && (
        <>
          <button type="button" onClick={() => goTo(index - 1)} className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/20 p-2 text-white hover:bg-black/40 md:block">
            <ArrowBigLeft size={18} />
          </button>
          <button type="button" onClick={() => goTo(index + 1)} className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/20 p-2 text-white hover:bg-black/40 md:block">
            <ArrowBigRight size={18} />
          </button>
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            {slides.map((s, i) => (
              <button key={s.id || i} type="button" onClick={() => goTo(i)} className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-brand-mustard' : 'w-2 bg-white/40'}`} />
            ))}
          </div>
        </>
      )}
    </section>
  )
}

export default Carousel
