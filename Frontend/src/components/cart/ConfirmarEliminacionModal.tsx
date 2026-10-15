interface Props {
  nombreProducto: string
  onCancelar: () => void
  onConfirmar: () => void
}

function ConfirmarEliminarModal({
  nombreProducto,
  onCancelar,
  onConfirmar,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-eliminar"
        className="w-full max-w-md rounded-3xl border-2 border-brand-dark bg-white p-6 shadow-sticker"
      >
        <h2
          id="titulo-eliminar"
          className="font-display text-2xl font-extrabold text-brand-dark"
        >
          ¿Eliminar producto?
        </h2>

        <p className="mt-3 text-brand-muted">
          ¿Querés quitar <strong>{nombreProducto}</strong> del carrito?
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancelar}
            className="rounded-full border-2 border-brand-dark px-5 py-2 font-bold hover:bg-gray-100"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirmar}
            className="rounded-full bg-brand-red px-5 py-2 font-bold text-white"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmarEliminarModal