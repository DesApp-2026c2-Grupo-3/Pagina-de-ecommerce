import type { ProductoBackend } from '../types/product'
import { etiquetaTamanio, ordenarVariantes } from '../config/combo'
import { formatearPrecio } from '../utils/precio'

interface SelectorTamanioProps {
  producto: ProductoBackend
  valor: string | null
  onChange: (tamanio: string) => void
}

function SelectorTamanio({ producto, valor, onChange }: SelectorTamanioProps) {
  const variantes = ordenarVariantes(producto.variantes)
  if (variantes.length === 0) return null

  return (
    <div>
      <p className="text-sm font-bold text-brand-dark">Tamaño</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {variantes.map((v) => (
          <button
            key={v.tamanio}
            type="button"
            onClick={() => onChange(v.tamanio)}
            aria-pressed={valor === v.tamanio}
            className={`rounded-xl border-2 px-2 py-2 text-center transition-colors ${
              valor === v.tamanio ? 'border-brand-red bg-brand-red/5' : 'border-brand-dark/10 hover:border-brand-red/40'
            }`}
          >
            <span className="block text-sm font-bold text-brand-dark">{etiquetaTamanio(v.tamanio)}</span>
            {v.etiqueta && <span className="block text-xs text-gray-100">{v.etiqueta}</span>}
            <span className="block text-sm font-semibold text-brand-red 
            ">
              {formatearPrecio(Number(v.precio))}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default SelectorTamanio