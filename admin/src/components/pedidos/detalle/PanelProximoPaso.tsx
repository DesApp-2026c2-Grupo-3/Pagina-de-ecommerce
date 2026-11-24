import { Info } from 'lucide-react'
import type { RefObject } from 'react'
import type { ProximoPaso } from '../../../utils/pedidos/proximoPaso'

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
  onConfirmar: () => void
  onVolver: () => void
}

const boton = 'min-h-11 w-full rounded-lg px-4 font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60'
const primario = `${boton} bg-action text-white hover:bg-action-hover`
const secundario = `${boton} border border-gray-300 bg-white text-gray-700 hover:bg-gray-50`

// «Próximo paso» del bloque de seguimiento (plan responsivo, 4.4.1):
// primero lo que hay que hacer, con un solo botón con el nombre de la etapa siguiente
// y «Cancelar pedido» justo debajo. Cada acción se confirma en el mismo lugar, sin modal.
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
        <button ref={refConfirmar} type="button" onClick={onConfirmar} disabled={guardando} className={primario}>
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
      <div
        role="alertdialog"
        aria-labelledby="confirmar-cancelacion-titulo"
        aria-describedby="confirmar-cancelacion-texto"
        className="flex flex-col gap-2.5 rounded-xl border border-red-300 bg-red-50 p-4"
      >
        <p id="confirmar-cancelacion-titulo" className="font-extrabold text-red-800">
          ¿Cancelar el pedido #{pedidoId}?
        </p>
        <p id="confirmar-cancelacion-texto" className="text-sm text-red-900">
          {textoCancelacion} No se puede deshacer.
        </p>
        <button
          ref={refConfirmar}
          type="button"
          onClick={onConfirmar}
          disabled={guardando}
          className={`${boton} bg-red-700 text-white hover:bg-red-800`}
        >
          {guardando ? 'Cancelando...' : 'Sí, cancelar pedido'}
        </button>
        <button type="button" onClick={onVolver} disabled={guardando} className={secundario}>
          Volver
        </button>
      </div>
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
