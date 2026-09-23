interface ConfirmarEliminacionProps {
  abierto: boolean
  mensaje: string
  onConfirmar: () => void
  onCancelar: () => void
}

export default function ConfirmarEliminacion({
  abierto,
  mensaje,
  onConfirmar,
  onCancelar,
}: ConfirmarEliminacionProps) {

  if (!abierto) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg 
      border border-2 shadow-xl 
      p-6 w-full max-w-md mx-4">

        <h2 className="text-xl font-bold mb-3">
          Confirmar eliminación
        </h2>

        <p className="text-gray-600 mb-6">
          {mensaje}
        </p>

        <div className="flex justify-center items-center gap-8">
          <button
            onClick={onCancelar}
            className="bg-secondary hover:bg-secondary-hover
            border border-black
             text-white px-4 py-2 rounded-md"
          >
            Cancelar
          </button>

          <button
            onClick={onConfirmar}
            className="bg-danger hover:bg-danger-hover
            border border-black text-white px-4 py-2 rounded-md"
          >
            Eliminar
          </button>
        </div>

      </div>
    </div>
  )
}