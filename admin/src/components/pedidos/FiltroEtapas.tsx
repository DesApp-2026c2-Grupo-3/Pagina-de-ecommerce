import type { ContadoresEtapa, FiltroEtapa } from '../../types/pedido.types'
import { ETAPAS } from '../../types/pedido.types'
import { esFiltroEtapa } from '../../utils/pedidos/filtrarPedidos'

interface Props {
  valor: FiltroEtapa
  contadores: ContadoresEtapa
  onChange: (valor: FiltroEtapa) => void
  // 'botones': lado a lado (solo escritorio) · 'desplegable': tablet y móvil
  variante: 'botones' | 'desplegable'
  className?: string
}

const OPCIONES: { valor: FiltroEtapa; etiqueta: string }[] = [
  { valor: 'todas', etiqueta: 'Todas' },
  ...ETAPAS.map((etapa) => ({ valor: etapa, etiqueta: etapa })),
]

// Filtro por etapa (plan responsivo, 4.3). La página dibuja las dos variantes y el CSS
// (container query de 60 rem) muestra una sola: la oculta queda con display:none,
// así el lector de pantalla no la anuncia dos veces. Nunca hay scroll horizontal.
export default function FiltroEtapas({ valor, contadores, onChange, variante, className = '' }: Props) {
  if (variante === 'desplegable') {
    return (
      <div className={className}>
        <label htmlFor="filtro-etapa" className="sr-only">
          Filtrar por etapa
        </label>
        <select
          id="filtro-etapa"
          value={valor}
          onChange={(e) => {
            if (esFiltroEtapa(e.target.value)) onChange(e.target.value)
          }}
          className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3"
        >
          {OPCIONES.map((opcion) => (
            <option key={opcion.valor} value={opcion.valor}>
              {opcion.etiqueta} ({contadores[opcion.valor]})
            </option>
          ))}
        </select>
      </div>
    )
  }

  return (
    <fieldset className={className}>
      <legend className="sr-only">Filtrar por etapa</legend>
      <div className="flex flex-nowrap gap-2">
        {OPCIONES.map((opcion) => {
          const activa = opcion.valor === valor
          return (
            <label
              key={opcion.valor}
              className={`relative inline-flex min-h-10 shrink-0 cursor-pointer items-center whitespace-nowrap rounded-full border px-3.5 text-sm font-semibold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-action has-[:focus-visible]:ring-offset-2 ${
                activa
                  ? 'border-action bg-action text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="filtro-etapa-botones"
                value={opcion.valor}
                checked={activa}
                onChange={() => onChange(opcion.valor)}
                className="sr-only"
              />
              {opcion.etiqueta} ({contadores[opcion.valor]})
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
