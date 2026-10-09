import type { CarouselSlide } from '../../types/carousel'


const FONDO_RECUADRO = {
  red: 'bg-brand-red',
  mustard: 'bg-brand-mustard',
  dark: 'bg-brand-dark',
}

// Lado derecho del layout 'split': imagen sobre un recuadro rojo inclinado, con sticker y badge opcionales
function SlideSplitMedia({ slide }: { slide: CarouselSlide }) {
  if (!slide.image) return null

  return (
    <div className="relative mx-auto w-full max-w-[15rem] sm:max-w-xs md:max-w-sm">      
    <div className={`relative grid aspect-square rotate-3 place-items-center rounded-[2.5rem] ${FONDO_RECUADRO[slide.accent ?? 'red']}`}>        
        <div className="absolute inset-[7%] rounded-full bg-black/15" />
        <img src={slide.image} alt="" className="relative w-[85%] -rotate-3 object-contain drop-shadow-2xl" />
      </div>

      {slide.sticker && (
        <div className="absolute -left-3 bottom-6 -rotate-6 rounded-2xl border-2 border-brand-dark bg-brand-cream px-4 py-3 text-brand-dark shadow-sticker sm:-left-6">
          <p className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">{slide.sticker.eyebrow}</p>
          <p className="font-display text-xl font-extrabold leading-tight">{slide.sticker.title}</p>
        </div>
      )}

      {slide.badge && (
        <div className="absolute -right-2 -top-3 grid h-20 w-20 rotate-12 place-items-center rounded-full border-[3px] border-brand-dark bg-brand-mustard p-2 text-center font-display text-sm font-extrabold leading-none text-brand-dark sm:h-24 sm:w-24 sm:text-base">
          {slide.badge}
        </div>
      )}
    </div>
  )
}

export default SlideSplitMedia