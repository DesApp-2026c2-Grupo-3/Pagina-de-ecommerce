import { etiquetaTamanio } from '../../config/combo'
import type { ProductoTamanio } from '../../types/product'

interface SelectorTamanioProps {
  tamanios: ProductoTamanio[]
  valor: number | null
  onChange: (tamanioId: number) => void
}

// Círculos R / M / G para elegir el tamaño
function SelectorTamanio({ tamanios, valor, onChange }: SelectorTamanioProps) {
  if (tamanios.length === 0) return null

  return (
    <section className="mt-6">
      <h2 className="text-lg font-extrabold text-brand-dark">Selecciona un tamaño</h2>
      <div role="radiogroup" aria-label="Tamaño" className="mt-3 flex flex-wrap gap-4">
        {tamanios.map((t) => {
          const activo = t.tamanioId === valor
          const nombre = etiquetaTamanio(t.tamanio)
          return (
            <button
              key={t.tamanioId}
              type="button"
              role="radio"
              aria-checked={activo}
              aria-label={etiquetaTamanio(t.tamanio, t.etiqueta)}
              onClick={() => onChange(t.tamanioId)}
              className="flex w-20 flex-col items-center gap-1"
            >
              <span
                className={`relative grid h-16 w-16 place-items-center rounded-full border-2 text-xl font-extrabold text-brand-dark transition-colors ${
                  activo ? 'border-brand-red' : 'border-brand-dark/20 hover:border-brand-red/50'
                }`}
              >
                {nombre.charAt(0)}
                {activo && (
                  <span
                    aria-hidden="true"
                    className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-brand-red text-xs text-white"
                  >
                    ✓
                  </span>
                )}
              </span>
              <span className="text-xs font-semibold text-gray-600">{nombre}</span>
              {t.etiqueta && <span className="text-xs text-gray-500">{t.etiqueta}</span>}
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default SelectorTamanio
