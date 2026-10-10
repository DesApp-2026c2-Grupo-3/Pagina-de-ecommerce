import { Link } from 'react-router-dom'
import type { CarouselSlide } from '../../types/carousel'

// Resalta una palabra del título con la pastilla mostaza del diseño
function TituloConResaltado({ title, highlight }: { title: string; highlight?: string }) {
  if (!highlight || !title.includes(highlight)) return <>{title}</>

  const [antes, despues] = title.split(highlight)
  return (
    <>
      {antes}
      <span className="inline-block -rotate-2 rounded-xl bg-brand-mustard px-3 text-brand-dark">{highlight}</span>
      {despues}
    </>
  )
}
// Texto y botón de un slide, sobre la foto de fondo
function SlideContent({ slide }: { slide: CarouselSlide }) {
  return (
    <div className="w-full max-w-2xl text-center md:text-left">
      {slide.eyebrow && (
        <span className="mb-4 inline-block rounded-full bg-brand-mustard px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-dark">
          {slide.eyebrow}
        </span>
      )}

      <h1 className="font-display text-4xl font-extrabold leading-[0.95] tracking-tight drop-shadow-lg sm:text-6xl">
        <TituloConResaltado title={slide.title} highlight={slide.highlight} />
      </h1>

      <p className="mt-5 max-w-xl text-lg text-white/85">{slide.description}</p>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
        <Link
          to={slide.ctaTo}
          className={
            slide.ctaVariant === 'outline'
              ? 'rounded-full border-2 border-brand-cream px-6 py-3 text-center font-bold text-brand-cream transition-colors hover:bg-brand-cream hover:text-brand-dark'
              : 'rounded-full bg-brand-red px-6 py-3 text-center font-bold text-white transition-transform hover:-translate-y-0.5'
          }          
        >
          {slide.ctaLabel}
        </Link>
      </div>
    </div>
  )
}

export default SlideContent