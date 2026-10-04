import Sheet from './Sheet'

export interface OpcionElegible {
  id: number
  nombre: string
  imagen?: string
  /** Cuánto cuesta de más respecto de la opción incluida (0 = sin recargo) */
  recargo: number
  icono: string
}

interface ChoiceSheetProps {
  title: string
  opciones: OpcionElegible[]
  seleccionadoId: number | null
  onElegir: (id: number) => void
  onClose: () => void
}

function ChoiceSheet({ title, opciones, seleccionadoId, onElegir, onClose }: ChoiceSheetProps) {
  return (
    <Sheet title={title} onClose={onClose}>
      {opciones.length === 0 ? (
        <p className="py-6 text-center text-gray-600">No hay opciones disponibles por el momento.</p>
      ) : (
        <ul className="flex flex-col">
          {opciones.map((o) => {
            const elegida = o.id === seleccionadoId
            return (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => onElegir(o.id)}
                  aria-pressed={elegida}
                  className="flex w-full items-center gap-3 rounded-2xl px-1 py-2 text-left transition-colors
                   hover:bg-gradient-to-r from-orange-300 via-orange-300 from-60%  to-yellow-100"
                >
                  {o.imagen ? (
                    <img src={o.imagen} alt="" className="h-14 w-14 shrink-0 rounded-full bg-orange-200 object-contain" />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand-cream text-2xl"
                    >
                      {o.icono}
                    </span>
                  )}
                  <span className="min-w-0 flex-1 font-bold text-brand-dark">{o.nombre}</span>
                  {o.recargo > 0 && (
                    <span className="shrink-0 text-sm font-semibold text-gray-700">
                      + ${o.recargo.toLocaleString('es-AR')}
                    </span>
                  )}
                  <span
                    aria-hidden="true"
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-sm font-bold ${
                      elegida ? 'bg-brand-red text-white' : 'border-2 border-brand-dark/20 text-transparent'
                    }`}
                  >
                    ✓
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Sheet>
  )
}

export default ChoiceSheet
