import ImagenProducto from '../ui/ImagenProducto'
import { Check } from 'lucide-react'
import Sheet from './Sheet'
import { formatearPrecio } from '../../utils/precio'

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
  /** Si viene, se ofrece primero la opción de no llevarlo (ej: "Sin bebida"), con id 0 */
  textoSin?: string
}

// Lista de opciones de un lugar del combo (acompañamiento, bebida...): se elige una
function ChoiceSheet({ title, opciones, seleccionadoId, onElegir, onClose, textoSin }: ChoiceSheetProps) {
  // La opción "Sin ..." va primera, con el mismo formato que las demás
  const lista: OpcionElegible[] = textoSin
    ? [{ id: 0, nombre: textoSin, recargo: 0, icono: '—' }, ...opciones]
    : opciones

  return (
    <Sheet title={title} onClose={onClose}>
      {lista.length === 0 ? (
        <p className="py-6 text-center text-brand-muted">No hay opciones disponibles por el momento.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {lista.map((o) => {
            const elegida = o.id === seleccionadoId
            return (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => onElegir(o.id)}
                  aria-pressed={elegida}
                  className={`flex w-full items-center gap-3 rounded-2xl border-2 p-2 text-left transition ${
                    elegida
                      ? 'border-brand-dark bg-white shadow-[4px_4px_0_var(--color-brand-dark)]'
                      : 'border-transparent hover:border-brand-dark/20 hover:bg-white'
                  }`}
                >
                  {o.imagen ? (
                    <ImagenProducto
                      src={o.imagen}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-2xl bg-brand-mustard object-contain p-1"
                      claseIcono="h-14 w-14 shrink-0 rounded-2xl bg-brand-sand p-2 text-brand-dark"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-sand text-2xl"
                    >
                      {o.icono}
                    </span>
                  )}

                  <span className="min-w-0 flex-1 font-bold text-brand-dark">{o.nombre}</span>

                  {o.recargo > 0 && (
                    <span className="shrink-0 rounded-full bg-brand-cream px-2.5 py-1 text-sm font-bold text-brand-dark">
                      +{formatearPrecio(o.recargo)}
                    </span>
                  )}

                  <span
                    aria-hidden="true"
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 transition-colors ${
                      elegida ? 'border-brand-red bg-brand-red text-white' : 'border-brand-dark/25 text-transparent'
                    }`}
                  >
                    <Check className="h-4 w-4" strokeWidth={3} />
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