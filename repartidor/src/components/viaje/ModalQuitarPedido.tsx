import { AlertTriangle, PackageX } from 'lucide-react'

import Dialogo from '../ui/Dialogo'
import Boton from '../ui/Boton'

interface ModalQuitarPedidoProps {
  abierto: boolean
  pedidoId: number | null
  procesando: boolean
  error: string
  onCancelar: () => void
  onConfirmar: () => void
}

// Confirmación sobre Dialogo (plan UX, 7.5): Escape y fondo cierran salvo mientras se quita,
// el foco queda adentro y vuelve al botón que lo abrió. Mismos textos que antes, más compacto.
export default function ModalQuitarPedido({
  abierto,
  pedidoId,
  procesando,
  error,
  onCancelar,
  onConfirmar,
}: ModalQuitarPedidoProps) {
  return (
    <Dialogo
      abierto={abierto}
      titulo="Quitar pedido del viaje"
      onCerrar={onCancelar}
      bloquearCierre={procesando}
      icono={
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-700"
        >
          <PackageX size={20} />
        </span>
      }
    >
      <div className="space-y-1">
        <p className="text-base leading-relaxed text-slate-700">
          ¿Estás seguro de que querés quitar el pedido <strong className="text-slate-900">#{pedidoId}</strong>?
        </p>
        <p className="text-sm text-slate-600">El pedido volverá a estar disponible para otros repartidores.</p>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
        <AlertTriangle aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-amber-700" />
        <p className="text-sm leading-snug text-amber-900">
          Esta acción quitará el pedido de tu viaje actual. Asegurate de que todavía no haya sido retirado.
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <div className="sm:flex-1">
          <Boton variante="secundaria" anchoCompleto onClick={onCancelar} disabled={procesando}>
            Volver
          </Boton>
        </div>
        <div className="sm:flex-1">
          <Boton variante="peligro" anchoCompleto onClick={onConfirmar} cargando={procesando} textoCargando="Quitando…">
            Sí, quitar pedido
          </Boton>
        </div>
      </div>
    </Dialogo>
  )
}
