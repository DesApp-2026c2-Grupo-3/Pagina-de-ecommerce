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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-900">
          Quitar pedido del viaje
        </h3>

        <p className="mt-2 text-sm text-gray-600">
          ¿Estás seguro de que querés quitar el pedido #{pedidoId}?
          Volverá a estar disponible para otros repartidores.
        </p>

        {error && (
          <p className="mt-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancelar}
            disabled={procesando}
            className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Volver
          </button>

          <button
            onClick={onConfirmar}
            disabled={procesando}
            className="flex-1 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {procesando ? 'Quitando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalQuitarPedido