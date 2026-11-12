import type { Etapa } from '../../types/pedido.types'
import {
  admiteCambiosDelAdmin,
  normalizarEstado,
  opcionesDeEtapa,
} from '../../utils/pedidoEstado'

interface SelectorEtapaProps {
  pedidoId: number
  valor: string | undefined
  estadoActual: string
  bloqueado: boolean
  onChange: (etapa: Etapa) => void
}

// Selector accesible (radio buttons) que muestra SOLO la etapa actual y las que el
// admin puede pedir desde ella (TRANSICIONES_ADMIN en utils/pedidoEstado.ts).
// "En camino" y "Entregado" nunca se ofrecen: los marca el repartidor desde su app.
export default function SelectorEtapa({
  pedidoId,
  valor,
  estadoActual,
  bloqueado,
  onChange,
}: SelectorEtapaProps) {
  const actual = normalizarEstado(estadoActual)
  const elegida = valor ? normalizarEstado(valor) : actual

  // En camino / Entregado / Cancelado: el panel ya no cambia nada
  if (!admiteCambiosDelAdmin(estadoActual)) {
    if (actual !== 'En camino') return null
    return (
      <p className="rounded-md border border-purple-200 bg-purple-50 px-3 py-2 text-xs text-purple-800 sm:text-sm">
        El pedido salió con el repartidor: la entrega la marca él desde su app.
      </p>
    )
  }

  return (
    <div
      role="radiogroup"
      aria-label={`Elegir etapa del pedido ${pedidoId}`}
      className="grid grid-cols-2 gap-2 sm:grid-cols-3"
    >
      {opcionesDeEtapa(estadoActual).map((etapa) => {
        const activa = elegida === etapa
        return (
          <label
            key={etapa}
            title={etapa === actual ? 'Estado actual del pedido' : undefined}
            className={`flex min-h-[38px] cursor-pointer select-none items-center justify-center rounded-md border px-3 py-1.5 text-center text-xs font-medium transition-colors sm:text-sm peer-focus-visible:ring-2 peer-focus-visible:ring-action peer-focus-visible:ring-offset-2 ${
              activa
                ? 'border-orange-300 bg-action text-white'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            } ${bloqueado ? 'cursor-not-allowed opacity-50 hover:bg-white' : ''}`}
          >
            <input
              type="radio"
              name={`etapa-${pedidoId}`}
              value={etapa}
              checked={activa}
              disabled={bloqueado}
              onChange={() => onChange(etapa)}
              className="peer sr-only"
            />
            {etapa}
          </label>
        )
      })}
    </div>
  )
}
