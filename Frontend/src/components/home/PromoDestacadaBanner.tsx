import { Link } from 'react-router-dom'
import { PROMO_DESTACADA } from '../../config/home'

// Bloque rojo con la promo principal y el círculo mostaza del descuento
function PromoDestacadaBanner() {
  const promo = PROMO_DESTACADA

  return (
    <section className="px-4 pb-14">
      <div className="mx-auto flex max-w-7xl flex-wrap overflow-hidden rounded-[2.25rem] border-2 border-brand-dark bg-brand-red text-white">
        <div className="flex flex-1 basis-80 flex-col items-start gap-5 p-8 sm:p-12">
          <span className="rounded-full bg-brand-dark px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider text-brand-mustard">
            {promo.etiqueta}
          </span>
          <h2 className="font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl">{promo.titulo}</h2>
          <p className="max-w-md text-lg text-white/85">{promo.descripcion}</p>
          <Link
            to={promo.link}
            className="inline-flex min-h-12 items-center rounded-full bg-brand-cream px-6 font-bold text-brand-dark transition-transform hover:-translate-y-0.5"
          >
            {promo.boton}
          </Link>
        </div>

        <div className="relative grid min-h-64 flex-1 basis-72 place-items-center bg-black/15 p-8">
          <img src={promo.imagen} alt="" className="w-full max-w-[13rem] object-contain drop-shadow-2xl sm:max-w-xs" />
          <div className="absolute bottom-6 right-6 grid h-28 w-28 -rotate-12 place-items-center rounded-full border-[3px] border-brand-dark bg-brand-mustard text-center font-display font-extrabold leading-none text-brand-dark sm:h-32 sm:w-32">
            <span>
              <span className="block text-4xl">{promo.destacado}</span>
              {promo.bajada && <span className="block text-sm">{promo.bajada}</span>}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PromoDestacadaBanner