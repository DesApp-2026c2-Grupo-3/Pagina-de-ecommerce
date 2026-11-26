import { Info } from 'lucide-react'
import type { RefObject } from 'react'
import type { ProximoPaso } from '../../../utils/pedidos/proximoPaso'
import ConfirmarCancelacion from './ConfirmarCancelacion'
import { boton, primario, secundario } from './estilosPanel'

export type Confirmacion = 'avance' | 'cancelar' | null

interface Props {
  pedidoId: number
  avance: ProximoPaso | null
  // Explicación cuando no hay avance (esperando al repartidor, solo lectura…)
  info: string | null
  puedeCancelar: boolean
  textoCancelacion: string
  confirmacion: Confirmacion
  guardando: boolean
  refConfirmar: RefObject<HTMLButtonElement | null>
  onPedir: (confirmacion: Exclude<Confirmacion, null>) => void
  // Al cancelar llega el motivo; al avanzar, nada
  onConfirmar: (motivo?: string) => void
  onVolver: () => void
}

// «Próximo paso» del bloque de seguimiento (plan responsivo, 4.4.1):
// primero lo que hay que hacer, con un solo botón con el nombre de la etapa siguiente
// y «Cancelar pedido» justo debajo. Cada acción se confirma en el mismo lugar, sin modal.
// La cancelación pide el motivo (ConfirmarCancelacion, PR #78).
export default function PanelProximoPaso({
  pedidoId,
  avance,
  info,
  puedeCancelar,
  textoCancelacion,
  confirmacion,
  guardando,
  refConfirmar,
  onPedir,
  onConfirmar,
  onVolver,
}: Props) {
  if (confirmacion === 'avance' && avance) {
    return (
      <div
        role="alertdialog"
        aria-labelledby="confirmar-avance-titulo"
        aria-describedby="confirmar-avance-texto"
        className="flex flex-col gap-2.5 rounded-xl border border-orange-300 bg-orange-50 p-4"
      >
        <p id="confirmar-avance-titulo" className="font-extrabold text-orange-950">
          ¿Pasar el pedido a «{avance.destino}»?
        </p>
        <p id="confirmar-avance-texto" className="text-sm text-orange-950">{avance.efecto}</p>
        <button ref={refConfirmar} type="button" onClick={() => onConfirmar()} disabled={guardando} className={primario}>
          {guardando ? 'Guardando...' : `Sí, pasar a «${avance.destino}»`}
        </button>
        <button type="button" onClick={onVolver} disabled={guardando} className={secundario}>
          Volver
        </button>
      </div>
    )
  }

  if (confirmacion === 'cancelar' && puedeCancelar) {
    return (
      <ConfirmarCancelacion
        pedidoId={pedidoId}
        textoCancelacion={textoCancelacion}
        guardando={guardando}
        refInicial={refConfirmar}
        onConfirmar={onConfirmar}
        onVolver={onVolver}
      />
    )
  }

  if (!avance && !info && !puedeCancelar) return null

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border bg-gray-50 p-4">
      {avance && (
        <>
          <p className="text-xs font-extrabold uppercase tracking-wider text-gray-600">Próximo paso</p>
          {avance.pista && <p className="text-sm text-gray-700">{avance.pista}</p>}
          <button type="button" onClick={() => onPedir('avance')} className={primario}>
            Pasar a «{avance.destino}»
          </button>
        </>
      )}
      {!avance && info && (
        <p className="flex gap-2 text-sm leading-snug text-gray-700">
          <Info size={18} className="shrink-0 text-gray-600" aria-hidden="true" />
          <span>{info}</span>
        </p>
      )}
      {puedeCancelar && (
        <button
          type="button"
          onClick={() => onPedir('cancelar')}
          className={`${boton} border border-red-300 bg-white text-red-700 hover:bg-red-50`}
        >
          Cancelar pedido
        </button>
      )}
    </div>
  )
}
