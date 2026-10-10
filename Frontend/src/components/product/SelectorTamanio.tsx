import { etiquetaTamanio } from '../../config/combo'
import { formatearPrecio } from '../../utils/precio'
import type { ProductoTamanio } from '../../types/product'
import SeccionOpciones from './SeccionOpciones'

interface SelectorTamanioProps {
  tamanios: ProductoTamanio[]
  valor: number | null
  onChange: (tamanioId: number) => void
}

// Pastillas de tamaño. El primero es la base; los demás muestran cuánto suman ("+$400").
function SelectorTamanio({ tamanios, valor, onChange }: SelectorTamanioProps) {
  if (tamanios.length === 0) return null
  const base = Number(tamanios[0].precio)

  return (
    <SeccionOpciones titulo="Tamaño" etiqueta="Elegí 1">
      <div role="radiogroup" aria-label="Tamaño" className="flex flex-wrap gap-2">
        {tamanios.map((t) => {
          const activo = t.tamanioId === valor
          const diferencia = Number(t.precio) - base
          return (
            <button
              key={t.tamanioId}
              type="button"
              role="radio"
              aria-checked={activo}
              aria-label={etiquetaTamanio(t.tamanio, t.etiqueta)}
              onClick={() => onChange(t.tamanioId)}
              className={`min-h-13 rounded-2xl border-2 border-brand-dark px-5 font-bold transition ${
                activo ? 'bg-brand-dark text-brand-cream' : 'bg-white text-brand-dark hover:-translate-y-0.5'
              }`}
            >
              {etiquetaTamanio(t.tamanio)}
              {diferencia > 0 && (
                <span className={`ml-1.5 font-semibold ${activo ? 'text-brand-cream/70' : 'text-brand-muted'}`}>
                  +{formatearPrecio(diferencia)}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </SeccionOpciones>
  )
}

export default SelectorTamanio