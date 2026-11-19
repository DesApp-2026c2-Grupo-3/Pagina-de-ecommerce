import { Link } from 'react-router-dom'
import type { CarouselSlide } from '../../types/carousel'

interface SlideContentProps {
  slide: CarouselSlide
  transparentesEnMovil?: boolean
}

const STYLES = {
  wrapper: 'flex w-full max-w-2xl flex-col items-start justify-start pb-4 text-left sm:block sm:pb-0',
  inner: 'flex w-full flex-col items-start sm:block',
  eyebrowWrapper: 'mb-3 sm:mb-6',
  eyebrowBadge:
    'inline-block rounded-full bg-brand-mustard px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-dark',
  title:
    'w-full text-left font-display text-[2.5rem] font-extrabold leading-[1.05] tracking-tight drop-shadow-lg sm:max-w-md sm:text-5xl md:max-w-xl md:text-6xl',
  highlightBadge: 'inline-block -rotate-2 rounded-xl bg-brand-mustard px-3 text-brand-dark',
  description: 'mt-4 w-full max-w-sm text-left text-base leading-relaxed text-white/85 sm:mt-5 sm:text-lg md:max-w-xl md:text-xl',
  ctaWrapper: 'mt-6 flex w-full justify-start sm:mt-8 sm:block',
  ctaBase:
    'block w-full rounded-full px-6 py-3 text-center font-bold transition-all hover:translate-y-0.5 sm:inline-block sm:w-auto sm:min-w-[16rem]',
  ctaTransparentMobile:
    'border-2 border-brand-cream bg-transparent text-brand-cream sm:border-0 sm:bg-brand-red sm:text-white',
  ctaOutline:
    'border-2 border-brand-cream bg-transparent text-brand-cream sm:hover:bg-brand-cream sm:hover:text-brand-dark',
  ctaSolid: 'border-2 border-transparent bg-brand-red text-white',
} as const

function TituloConResaltado({ title, highlight }: { title: string; highlight?: string }) {
  if (!highlight || !title.includes(highlight)) return <>{title}</>

  const [antes, despues] = title.split(highlight)

  if (title.includes('Hola,')) {
    const [antesDelNombre, resto] = title.split(', ')
    const [userName, fraseFinal] = resto.split('. ')
    const [antesHighlight, despuesHighlight] = fraseFinal.split(highlight)

    return (
      <>
        {antesDelNombre}
        {', '}
        <span className="text-red-600">{userName}</span>. {antesHighlight}
        <span className={STYLES.highlightBadge}>{highlight}</span>
        {despuesHighlight}
      </>
    )
  }
  else if(title.includes('¿Qué se te antoja hoy?')){
    const [userName, fraseFinal] = title.split('. ')
    const [antesHighlight, despuesHighlight] = fraseFinal.split(highlight)

    return (
      <>
        <span className="text-red-600">{userName}</span>. {antesHighlight}
        <span className={STYLES.highlightBadge}>{highlight}</span>
        {despuesHighlight}
      </>
    )

  }

  return (
    <>
      {antes}
      <span className={STYLES.highlightBadge}>{highlight}</span>
      {despues}
    </>
  )
}

function SlideContent({ slide, transparentesEnMovil = false }: SlideContentProps) {
  const ctaVariantClass = transparentesEnMovil
    ? STYLES.ctaTransparentMobile
    : slide.ctaVariant === 'outline'
      ? STYLES.ctaOutline
      : STYLES.ctaSolid

  return (
    <div className={STYLES.wrapper}>
      <div className={STYLES.inner}>
        {slide.eyebrow && (
          <div className={STYLES.eyebrowWrapper}>
            <span className={STYLES.eyebrowBadge}>{slide.eyebrow}</span>
          </div>
        )}

        <h1 className={STYLES.title}>
          <TituloConResaltado title={slide.title} highlight={slide.highlight} />
        </h1>

        <p className={STYLES.description}>{slide.description}</p>
      </div>

      <div className={STYLES.ctaWrapper}>
        <Link to={slide.ctaTo} className={`${STYLES.ctaBase} ${ctaVariantClass}`}>
          {slide.ctaLabel}
        </Link>
      </div>
    </div>
  )
}

export default SlideContent
