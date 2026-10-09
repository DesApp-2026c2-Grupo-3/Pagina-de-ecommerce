import { etiquetaTamanio } from '../../config/combo'
import { formatearPrecio } from '../../utils/precio'
import type { ProductoTamanio } from '../../types/product'

interface SelectorTamanioProps {
  tamanios: ProductoTamanio[]
  valor: number | null
  onChange: (tamanioId: number) => void
}

// Botones de tamaño con su precio; el elegido va en oscuro
function SelectorTamanio({ tamanios, valor, onChange }: SelectorTamanioProps) {
  if (tamanios.length === 0) return null

  return (
    <section className="mt-6">
      <h2 className="font-display text-xl font-extrabold text-brand-dark">Elegí el tamaño</h2>
      <div role="radiogroup" aria-label="Tamaño" className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(6.5rem,1fr))] gap-2">
        {tamanios.map((t) => {
          const activo = t.tamanioId === valor
          return (
            <button
              key={t.tamanioId}
              type="button"
              role="radio"
              aria-checked={activo}
              aria-label={etiquetaTamanio(t.tamanio, t.etiqueta)}
              onClick={() => onChange(t.tamanioId)}
              className={`flex min-h-16 flex-col items-center justify-center rounded-2xl border-2 border-brand-dark px-3 py-2 transition ${
                activo ? 'bg-brand-dark text-brand-cream' : 'bg-white text-brand-dark hover:-translate-y-0.5'
              }`}
            >
              <span className="font-extrabold">{etiquetaTamanio(t.tamanio)}</span>
              <span className={`text-xs font-semibold ${activo ? 'text-brand-mustard' : 'text-brand-muted'}`}>
                {t.etiqueta ?? formatearPrecio(Number(t.precio))}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default SelectorTamanio