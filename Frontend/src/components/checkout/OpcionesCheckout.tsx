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

// Tarjetas para elegir una opción (cómo lo recibís, forma de pago).
// La elegida va en oscuro; las no disponibles dicen "Próximamente".
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
            className={`relative flex flex-col rounded-[1.75rem] border-2 px-6 py-4 text-left ${
              activa
                ? 'border-brand-dark bg-brand-dark text-brand-cream'
                : op.disponible
                  ? 'border-brand-dark bg-white text-brand-dark hover:bg-brand-cream'
                  : 'cursor-not-allowed border-dashed border-brand-dark/30 bg-white opacity-60'
            }`}
          >
            <span className="text-lg font-extrabold">{op.titulo}</span>
            <span className={`text-sm ${activa ? 'text-brand-cream/80' : 'text-brand-muted'}`}>{op.detalle}</span>
            {!op.disponible && (
              <span className="absolute -top-2.5 right-4 rounded-full bg-brand-mustard px-2 py-0.5 text-[11px] font-extrabold text-brand-dark">
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