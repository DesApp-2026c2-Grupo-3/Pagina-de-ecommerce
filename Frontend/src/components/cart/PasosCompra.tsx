import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'

// "Carrito" tiene ruta: una vez pasado, se puede tocar para volver.
// "Entrega" y "Pago" están en la misma página (checkout): se vuelve con onIrA.
const PASOS = [
  { nombre: 'Carrito', to: '/carrito' },
  { nombre: 'Entrega', to: null },
  { nombre: 'Pago', to: null },
  { nombre: 'Confirmado', to: null },
]

interface Props {
  actual: number // 0 = carrito, 1 = entrega, 2 = pago, 3 = confirmado
  onIrA?: (paso: number) => void
}

// Indicador de en qué paso de la compra está el cliente
function PasosCompra({ actual, onIrA }: Props) {
  return (
    <ol aria-label="Pasos de la compra" className="flex flex-wrap items-center gap-1.5 text-sm font-bold sm:gap-2">
      {PASOS.map((paso, i) => {
        const hecho = i < actual
        const activo = i === actual
        const contenido = (
          <>
            <span
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full sm:h-8 sm:w-8 ${
                activo ? 'bg-brand-red text-white' : hecho ? 'bg-white/10 text-brand-mustard' : 'border-2 border-white/15 text-white/40'
              }`}
            >
              {hecho ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
            </span>
            {/* En celular solo se ve el nombre del paso actual */}
            <span className={activo ? 'text-brand-cream' : `hidden sm:inline ${hecho ? 'text-brand-cream/70' : 'text-white/40'}`}>
              {paso.nombre}
            </span>
          </>
        )

        return (
          <li key={paso.nombre} className="flex items-center gap-1.5 sm:gap-2" aria-current={activo ? 'step' : undefined}>
            {i > 0 && (
              <span aria-hidden="true" className={`h-0.5 w-3 rounded-full sm:w-6 ${hecho || activo ? 'bg-brand-red' : 'bg-white/15'}`} />
            )}
            {hecho && paso.to ? (
              <Link to={paso.to} className="flex items-center gap-1.5 rounded-full hover:opacity-80 sm:gap-2">
                {contenido}
              </Link>
            ) : hecho && onIrA ? (
              <button type="button" onClick={() => onIrA(i)} className="flex items-center gap-1.5 rounded-full hover:opacity-80 sm:gap-2">
                {contenido}
              </button>
            ) : (
              <span className="flex items-center gap-1.5 sm:gap-2">{contenido}</span>
            )}
          </li>
        )
      })}
    </ol>
  )
}

export default PasosCompra