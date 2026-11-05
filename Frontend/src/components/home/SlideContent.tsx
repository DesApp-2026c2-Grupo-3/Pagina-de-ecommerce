import { Link } from 'react-router-dom'
import type { CarouselSlide } from '../../types/carousel'

// Resalta una palabra del título con la pastilla mostaza del diseño
function TituloConResaltado({ title, highlight }: { title: string; highlight?: string }) {
  if (!highlight || !title.includes(highlight)) return <>{title}</>

  const [antes, despues] = title.split(highlight)

  if (title.includes("Hola,")) {
    // 1. Separamos el "Hola, " del resto de la frase
    const [antesDelNombre, resto] = title.split(", ")
    // 2. Del resto, separamos el nombre usando el punto como límite ("Juan. ¿Qué se te...")
    const [userName, fraseFinal] = resto.split(". ")

    // 3. De la frase final, hacemos el split del highlight ("antoja")
    const [antesHighlight, despuesHighlight] = fraseFinal.split(highlight)
    
    return (
      <>
        {antesDelNombre}{", "} <span className="text-red-600">{userName}</span>.{" "}
        {antesHighlight}
        <span className="inline-block -rotate-2 rounded-xl bg-brand-mustard px-3 text-brand-dark">
          {highlight}
        </span>
        {despuesHighlight}
      </>
    )
  } else {
    return (
      <>
        {antes}
        <span className="inline-block -rotate-2 rounded-xl bg-brand-mustard px-3 text-brand-dark">{highlight}</span>
        {despues}
      </>
    )
  }
}

// Texto y botón de un slide, sobre la foto de fondo
function SlideContent({ slide }: { slide: CarouselSlide }) {
  return (
    /* Cambiamos a text-left para acompañar el nuevo diseño de cinta baja que elegiste en el carrusel */
    <div className="w-full max-w-2xl text-left">
      {slide.eyebrow && (
        <span className="mb-4 inline-block rounded-full bg-brand-mustard px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-dark">
          {slide.eyebrow}
        </span>
      )}

      <h1 className="font-display text-4xl font-extrabold leading-[0.95] tracking-tight drop-shadow-lg sm:text-6xl">
        <TituloConResaltado title={slide.title} highlight={slide.highlight} /> 
      </h1>

      <p className="mt-5 max-w-xl text-lg text-white/85">{slide.description}</p>

      {/* Ajustamos el flex a justify-start para mantener la coherencia hacia la izquierda */}
       <div className="mt-7 flex flex-col gap-3 sm:flex-row justify-center md:justify-start">
        <Link
          to={slide.ctaTo}
          className={`rounded-full px-6 py-3 text-center font-bold min-w-[14rem] sm:min-w-[16rem] transition-all hover:translate-y-0.5
            border-2 border-brand-cream bg-transparent text-brand-cream
            ${
              slide.ctaVariant === 'outline'
                ? 'md:border-2 md:border-brand-cream md:bg-transparent md:text-brand-cream md:hover:bg-brand-cream md:hover:text-brand-dark'
                : 'md:border-0 md:bg-brand-red md:text-white md:hover:translate-y-0.5'
            }
          `}
        >
          {slide.ctaLabel}
        </Link>
      </div>
    </div>
  )
}

export default SlideContent
