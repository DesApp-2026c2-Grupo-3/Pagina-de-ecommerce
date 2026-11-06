import { Bike, ChefHat, ShoppingBag } from 'lucide-react'
import Carousel from './Carousel'

const PASOS = [
  {
    titulo: 'Elegí tu antojo',
    texto: 'Armá tu pedido y personalizá cada producto: sacá o sumá ingredientes y elegí el tamaño.',
    Icono: ShoppingBag,
  },
  {
    titulo: 'Lo preparamos al toque',
    texto: 'La sucursal más cercana con stock recibe tu pedido y arranca a cocinar.',
    Icono: ChefHat,
  },
  {
    titulo: 'Te lo llevamos',
    texto: 'Seguí el estado de tu pedido desde tu historial hasta que llegue a tu puerta.',
    Icono: Bike,
  },
]

function ComoFuncionaSection() {
  return (
    <section className="bg-brand-dark px-4 py-12 md:py-20 text-brand-cream relative">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-10 font-display text-3xl md:text-5xl font-extrabold tracking-tight">
          De la plancha <span className="text-brand-mustard">a tu puerta</span>
        </h2>

        {/* 
          VISTA EN MOBILE (menor a 768px):
          - Eliminamos max-w-xs para que la tarjeta se estire fluidamente.
          - Usamos w-full para ocupar todo el ancho del contenedor del carrusel.
        */}
        <div className="block md:hidden pb-8">
          <Carousel autoPlayMs={5000}>
            {PASOS.map(({ titulo, texto, Icono }, i) => (
              <div key={titulo} className="w-full px-1 animate-fade-in">
                <div className="flex flex-col gap-4 rounded-[1.75rem] border border-white/10 bg-white/5 p-7 min-h-[14rem] justify-between h-full w-full">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-5xl font-extrabold leading-none text-brand-mustard">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-red">
                      <Icono className="h-7 w-7 text-white" />
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col gap-1 mt-2">
                    <h3 className="font-display text-xl font-extrabold">{titulo}</h3>
                    <p className="leading-relaxed text-sm text-brand-cream/75">{texto}</p>
                  </div>
                </div>
              </div>
            ))}
          </Carousel>
        </div>

        {/* VISTA EN DESKTOP (a partir de 768px / md): Grilla original intacta */}
        <div className="hidden md:block">
          <ol className="grid grid-cols-3 gap-6">
            {PASOS.map(({ titulo, texto, Icono }, i) => (
              <li key={titulo} className="flex flex-col gap-4 rounded-[1.75rem] border border-white/10 bg-white/5 p-7 justify-between h-full">
                <div className="flex items-center justify-between">
                  <span className="font-display text-6xl font-extrabold leading-none text-brand-mustard">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-red">
                    <Icono className="h-7 w-7 text-white" />
                  </span>
                </div>
                <div className="flex-1 flex flex-col gap-1 mt-2">
                  <h3 className="font-display text-2xl font-extrabold">{titulo}</h3>
                  <p className="leading-relaxed text-brand-cream/75">{texto}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

export default ComoFuncionaSection
