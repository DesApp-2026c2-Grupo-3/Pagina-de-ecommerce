import { useEffect, useRef, useState } from 'react'
import type { CarouselSlide } from '../../types/carousel'
import { ArrowBigLeft, ArrowBigRight } from 'lucide-react'

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

  return (
   <section
      className="relative min-h-[26rem] overflow-hidden bg-cover bg-center text-white"
      style={{ backgroundImage: `url(${slide.backgroundImage})` }}
    >
      {/* Capa oscura para mejorar la lectura del texto */}
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative mx-auto flex min-h-[26rem] max-w-7xl items-center px-4 py-12 md:min-h-[22rem]">
        <div className="w-full max-w-2xl text-center md:text-left">
          {slide.eyebrow && (
            <span className="mb-2 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">
              {slide.eyebrow}
            </span>
          )}

          <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
            {slide.title}
          </h1>

          <p className="mt-4 text-lg text-white/90">
            {slide.description}
          </p>

          {/*<div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
            <Link
              to={slide.ctaTo}
              className={
                slide.ctaVariant === 'outline'
                  ? 'rounded-full border-2 border-white bg-transparent px-6 py-3 text-center font-bold text-white transition-colors hover:bg-white hover:text-brand-red'
                  : 'rounded-full bg-brand-dark px-6 py-3 text-center font-bold text-white transition-opacity hover:opacity-90'
              }
            >
              {slide.ctaLabel}
            </Link>
          </div>*/}
        </div>
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

          <div className="relative flex justify-center gap-2 pb-4">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={`Ir al slide ${i + 1}`}
                aria-current={i === index}
                onClick={() => goTo(i)}
                className={`h-2 rounded-full transition-all ${
                  i === index ? 'w-6 bg-white' : 'w-2 bg-white/40'
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
