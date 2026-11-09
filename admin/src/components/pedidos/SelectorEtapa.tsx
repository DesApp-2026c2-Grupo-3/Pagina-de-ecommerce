import type { Etapa } from '../../types/pedido.types'
import { ETAPAS } from '../../types/pedido.types'
import { esRetornoAPendienteProhibido } from '../../utils/pedidoEstado'

interface SelectorEtapaProps {
  pedidoId: number
  valor: string | undefined
  estadoActual: string
  bloqueado: boolean
  onChange: (etapa: Etapa) => void
}

export default function SelectorEtapa({
  pedidoId,
  valor,
  estadoActual,
  bloqueado,
  onChange,
}: SelectorEtapaProps) {
  return (
    <div
      role="radiogroup"
      aria-label={`Elegir etapa del pedido ${pedidoId}`}
      className="grid grid-cols-2 gap-2 sm:grid-cols-4"
    >
      {ETAPAS.map((etapa) => {
        const activa = valor === etapa
        const retornoProhibido = esRetornoAPendienteProhibido(
          estadoActual,
          etapa,
        )
        const deshabilitada = bloqueado || retornoProhibido
        return (
          <label
            key={etapa}
            title={
              retornoProhibido
                ? 'Un pedido que salió de Pendiente no puede volver a Pendiente'
                : undefined
            }
            className={`flex min-h-[38px] cursor-pointer select-none items-center justify-center rounded-md border px-3 py-1.5 text-center text-xs font-medium transition-colors sm:text-sm peer-focus-visible:ring-2 peer-focus-visible:ring-action peer-focus-visible:ring-offset-2 ${
              activa
                ? 'border-orange-300 bg-action text-white'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            } ${deshabilitada ? 'cursor-not-allowed opacity-50 hover:bg-white' : ''}`}
          >
            <input
              type="radio"
              name={`etapa-${pedidoId}`}
              value={etapa}
              checked={activa}
              disabled={deshabilitada}
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
