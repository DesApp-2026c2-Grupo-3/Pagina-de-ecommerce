import { Check } from 'lucide-react'

interface Opcion<T extends string> {
  id: T
  titulo: string
  detalle: string
  disponible: boolean
}

interface Props<T extends string> {
  nombre: string
  opciones: readonly Opcion<T>[]
  elegida: T
  onElegir: (id: T) => void
}

// Tarjetas para elegir una opción (cómo lo recibís, forma de pago). Las no disponibles dicen "Próximamente".
function OpcionesCheckout<T extends string>({ nombre, opciones, elegida, onElegir }: Props<T>) {
  return (
    <div role="radiogroup" aria-label={nombre} className="grid gap-3 sm:grid-cols-2">
      {opciones.map((op) => {
        const activa = op.id === elegida
        return (
          <button
            key={op.id}
            type="button"
            role="radio"
            aria-checked={activa}
            disabled={!op.disponible}
            onClick={() => onElegir(op.id)}
            className={`relative flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition ${
              activa
                ? 'border-brand-dark bg-brand-cream shadow-[4px_4px_0_var(--color-brand-red)]'
                : op.disponible
                  ? 'border-brand-dark/15 hover:border-brand-dark'
                  : 'cursor-not-allowed border-dashed border-brand-dark/20 opacity-60'
            }`}
          >
            <span
              className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
                activa ? 'border-brand-red bg-brand-red text-white' : 'border-brand-dark/30'
              }`}
            >
              {activa && <Check className="h-3 w-3" strokeWidth={4} />}
            </span>
            <span className="min-w-0">
              <span className="block font-bold">{op.titulo}</span>
              <span className="block text-sm text-brand-muted">{op.detalle}</span>
            </span>
            {!op.disponible && (
              <span className="absolute -top-2.5 right-3 rounded-full bg-brand-mustard px-2 py-0.5 text-[11px] font-extrabold">
                Próximamente
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default OpcionesCheckout