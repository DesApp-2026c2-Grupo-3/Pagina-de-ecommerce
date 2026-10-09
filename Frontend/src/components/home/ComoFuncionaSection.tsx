import { Bike, ChefHat, ShoppingBag } from 'lucide-react'

// "De la plancha a tu puerta": cómo funciona un pedido, en 3 pasos
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
    <section className="bg-brand-dark px-4 py-20 text-brand-cream">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-10 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          De la plancha <span className="text-brand-mustard">a tu puerta</span>
        </h2>

        <ol className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PASOS.map(({ titulo, texto, Icono }, i) => (
            <li key={titulo} className="flex flex-col gap-4 rounded-[1.75rem] border border-white/10 bg-white/5 p-7">
              <div className="flex items-center justify-between">
                <span className="font-display text-6xl font-extrabold leading-none text-brand-mustard">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-red">
                  <Icono className="h-7 w-7 text-white" />
                </span>
              </div>
              <h3 className="font-display text-2xl font-extrabold">{titulo}</h3>
              <p className="leading-relaxed text-brand-cream/75">{texto}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export default ComoFuncionaSection