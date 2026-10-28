import { Check } from 'lucide-react'

interface Props {
  texto: string
  marcada: boolean
  onCambiar: () => void
  /** Texto a la derecha, ej: "+$300" */
  detalle?: string
  deshabilitada?: boolean
}

// Fila con casilla roja: se usa para sacar o sumar ingredientes
function CasillaOpcion({ texto, marcada, onCambiar, detalle, deshabilitada = false }: Props) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={marcada}
      disabled={deshabilitada}
      onClick={onCambiar}
      className="flex w-full items-center gap-3 rounded-xl py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span
        className={`grid h-7 w-7 shrink-0 place-items-center rounded-md border-2 transition-colors ${
          marcada ? 'border-brand-red bg-brand-red text-white' : 'border-brand-dark/30 bg-white'
        }`}
      >
        {marcada && <Check className="h-5 w-5" strokeWidth={3.5} />}
      </span>
      <span className={`min-w-0 flex-1 font-semibold ${marcada ? 'text-brand-dark' : 'text-brand-muted'}`}>{texto}</span>
      {detalle && <span className="shrink-0 font-bold text-brand-muted">{detalle}</span>}
    </button>
  )
}

export default CasillaOpcion