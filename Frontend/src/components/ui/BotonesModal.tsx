interface Props {
  saving: boolean
  onCancelar?: () => void
  textoGuardar?: string
}

// Botonera de los formularios dentro de un Modal: Cancelar (opcional) + Guardar
function BotonesModal({ saving, onCancelar, textoGuardar = 'Guardar' }: Props) {
  return (
    <div className="mt-2 flex justify-end gap-3">
      {onCancelar && (
        <button
          type="button"
          onClick={onCancelar}
          className="min-h-11 rounded-full border-2 border-brand-dark px-5 font-bold text-brand-dark transition-colors hover:bg-brand-dark hover:text-brand-cream"
        >
          Cancelar
        </button>
      )}
      <button
        type="submit"
        disabled={saving}
        className="min-h-11 rounded-full bg-brand-red px-6 font-bold text-white transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50"
      >
        {saving ? 'Guardando...' : textoGuardar}
      </button>
    </div>
  )
}

export default BotonesModal