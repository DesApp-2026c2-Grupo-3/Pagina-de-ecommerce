import { Link } from 'react-router-dom'
import type { CarouselSlide } from '../../types/carousel'

// Resalta una palabra del título con la pastilla mostaza del diseño
function TituloConResaltado({ title, highlight }: { title: string; highlight?: string }) {
  if (!highlight || !title.includes(highlight)) return <>{title}</>

  const [antes, despues] = title.split(highlight)

  if (title.includes("Hola,")) {
    const [antesDelNombre, resto] = title.split(", ")
    const [userName, fraseFinal] = resto.split(". ")
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
function SlideContent({ 
  slide, 
  transparentesEnMovil = false 
}: { 
  slide: CarouselSlide; 
  transparentesEnMovil?: boolean; 
}) {
  return (
    /* 
      ✨ ALTURA AUTO-ADAPTABLE SIN ESPACIO OCIOSO:
      Eliminamos por completo las alturas fijas rígidas (min-h). Dejamos que sea un contenedor flexible 
      que respire usando un padding inferior constante (pb-4) para que el botón no quede flotando abajo.
    */
    <div className="w-full max-w-2xl text-left flex flex-col items-start justify-start pb-4 sm:block sm:pb-0">
      
      <div className="w-full flex flex-col items-start sm:block">
        
        {/* El eyebrow se renderiza de forma orgánica sin dejar cajas vacías artificiales */}
        {slide.eyebrow && (
          <div className="mb-3 sm:mb-6">
            <span className="inline-block rounded-full bg-brand-mustard px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-dark">
              {slide.eyebrow}
            </span>
          </div>
        )}

        {/* 
          🎨 TEXTO AMPLIADO Y COMPACTO:
          Usamos 'text-[2.5rem]' en móviles para que las letras llenen horizontalmente la pantalla 
          en lugar de dejar huecos. Con 'leading-[1.05]' evitamos saltos de línea exagerados.
        */}
        <h1 className="font-display text-[2.5rem] font-extrabold leading-[1.05] tracking-tight drop-shadow-lg sm:text-5xl md:text-6xl w-full text-left sm:max-w-md md:max-w-xl">
          <TituloConResaltado title={slide.title} highlight={slide.highlight} /> 
        </h1>

        {/* La descripción gana un interlineado más alto (leading-relaxed) para rellenar el espacio de forma elegante */}
        <p className="mt-4 sm:mt-5 text-base sm:text-lg md:text-xl leading-relaxed text-white/85 w-full text-left max-w-sm md:max-w-xl">
          {slide.description}
        </p>
      </div>

       {/* El botón se acopla inmediatamente abajo del texto, eliminando el aire muerto */}
       <div className="mt-6 sm:mt-8 w-full flex justify-start sm:block">
        <Link
          to={slide.ctaTo}
          className={`rounded-full px-6 py-3 text-center font-bold transition-all hover:translate-y-0.5
            w-full block md:inline-block md:w-auto md:min-w-[16rem]
            ${
              transparentesEnMovil
                ? 'border-2 border-brand-cream bg-transparent text-brand-cream md:border-0 md:bg-brand-red md:text-white' 
                : slide.ctaVariant === 'outline'
                  ? 'border-2 border-brand-cream bg-transparent text-brand-cream md:hover:bg-brand-cream md:hover:text-brand-dark'
                  : 'bg-brand-red text-white border-2 border-transparent'
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
