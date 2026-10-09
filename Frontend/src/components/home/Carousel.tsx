import { useEffect, useRef, useState } from 'react'
import type { CarouselSlide } from '../../types/carousel'
import { ArrowBigLeft, ArrowBigRight } from 'lucide-react'
import SlideContent from './SlideContent'
import SlideSplitMedia from './SlideSplitMedia'
import SlideBackdrop from './SlideBackdrop'

interface CarouselProps {
  slides: CarouselSlide[]
  autoPlayMs?: number
}

function Carousel({ slides, autoPlayMs = 6000 }: CarouselProps) {
  const [index, setIndex] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Si cambia la cantidad de slides (ej. al loguearse), volvemos al primero.
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
    // Reiniciamos el timer también cuando el usuario navega manualmente,
    // así no "salta" un slide extra apenas después de un click.
  }, [slides.length, autoPlayMs, index])

  function goTo(next: number) {
    setIndex((next + slides.length) % slides.length)
  }

  const slide = slides[index]
  if (!slide) return null

  const esSplit = slide.layout === 'split'

  return (
    <section
      className={`relative overflow-hidden border-b-4 border-brand-red text-white ${
        slide.tone === 'red' ? 'bg-brand-red' : 'bg-brand-dark'
      }`}
    >
      <SlideBackdrop slide={slide} />

      <div className="relative mx-auto flex min-h-[22rem] max-w-7xl flex-col items-center gap-8 px-4 py-10 md:min-h-[26rem] md:flex-row">        
        <SlideContent slide={slide} />
        {esSplit && <SlideSplitMedia slide={slide} />}
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

          <div className="relative flex justify-center gap-2 pb-14">            
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

export default Carousel