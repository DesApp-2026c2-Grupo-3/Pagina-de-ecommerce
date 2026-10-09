import type { CarouselSlide } from '../../types/carousel'

// Foto de fondo del slide: a pleno en layout 'photo', tenue (como textura) en layout 'split'
function SlideBackdrop({ slide }: { slide: CarouselSlide }) {
  if (!slide.backgroundImage) return null

  const esSplit = slide.layout === 'split'
  const degrade = !esSplit
    ? 'from-brand-dark/90 via-brand-dark/60 to-brand-dark/10'
    : slide.tone === 'red'
      ? 'from-brand-red via-brand-red/90 to-brand-red/60'
      : 'from-brand-dark via-brand-dark/90 to-brand-dark/60'

  return (
    <>
      <img
        src={slide.backgroundImage}
        alt=""
        className={`absolute inset-0 h-full w-full object-cover ${esSplit ? 'opacity-100 grayscale' : ''}`}
      />
      <div className={`absolute inset-0 bg-gradient-to-r ${degrade}`} />
    </>
  )
}

export default SlideBackdrop