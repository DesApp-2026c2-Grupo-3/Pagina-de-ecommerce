import { Check } from 'lucide-react'

const PASOS = ['Carrito', 'Confirmar', 'En camino']

// Indicador de en qué paso de la compra está el cliente (0 = carrito, 1 = confirmar, 2 = en camino)
function PasosCompra({ actual }: { actual: number }) {
  return (
    <ol aria-label="Pasos de la compra" className="flex flex-wrap items-center gap-2 text-sm font-bold">
      {PASOS.map((paso, i) => {
        const hecho = i < actual
        const activo = i === actual
        return (
          <li key={paso} className="flex items-center gap-2" aria-current={activo ? 'step' : undefined}>
            {i > 0 && <span aria-hidden="true" className={`h-0.5 w-6 rounded-full ${hecho || activo ? 'bg-brand-red' : 'bg-white/15'}`} />}
            <span
              className={`grid h-8 w-8 place-items-center rounded-full ${
                activo ? 'bg-brand-red text-white' : hecho ? 'bg-white/10 text-brand-mustard' : 'border-2 border-white/15 text-white/40'
              }`}
            >
              {hecho ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
            </span>
            <span className={activo ? 'text-brand-cream' : `hidden sm:inline ${hecho ? 'text-brand-cream/70' : 'text-white/40'}`}>{paso}</span>
          </li>
        )
      })}
    </ol>
  )
}

export default PasosCompra