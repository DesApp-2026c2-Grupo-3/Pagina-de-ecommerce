
import { PackageX, AlertTriangle, X } from 'lucide-react'

interface ModalQuitarPedidoProps {
  pedidoId: number
  procesando: boolean
  error: string
  onCancelar: () => void
  onConfirmar: () => void
}

const ModalQuitarPedido = ({
  pedidoId,
  procesando,
  error,
  onCancelar,
  onConfirmar,
}: ModalQuitarPedidoProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-2xl">

        {/* Encabezado visual */}
        <div className="relative flex justify-center bg-gradient-to-br from-orange-100 via-orange-50 to-amber-100 px-6 py-7">
          <button
            type="button"
            onClick={onCancelar}
            disabled={procesando}
            className="absolute right-4 top-4 rounded-lg p-2 text-slate-500 transition hover:bg-white/70 hover:text-slate-800 disabled:opacity-50"
          >
            <X size={18} />
          </button>

          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-orange-200 bg-white shadow-sm">
            <PackageX size={30} className="text-orange-600" />
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6">
          <div className="text-center">
            <h3 className="text-xl font-extrabold text-slate-800">
              Quitar pedido del viaje
            </h3>

            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              ¿Estás seguro de que querés quitar el pedido{' '}
              <span className="font-bold text-slate-800">
                #{pedidoId}
              </span>
              ?
            </p>

            <p className="mt-2 text-sm text-slate-500">
              El pedido volverá a estar disponible para otros repartidores.
            </p>
          </div>

          {/* Advertencia */}
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />

            <p className="text-xs leading-relaxed text-amber-800">
              Esta acción quitará el pedido de tu viaje actual. Asegurate de que todavía no haya sido retirado.
            </p>
          </div>

          {/* Error */}
          {error && (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          {/* Acciones */}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onCancelar}
              disabled={procesando}
              className="flex-1 rounded-xl border border-orange-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Volver
            </button>

            <button
              type="button"
              onClick={onConfirmar}
              disabled={procesando}
              className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-red-500/20 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {procesando ? 'Quitando...' : 'Sí, quitar pedido'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModalQuitarPedido
