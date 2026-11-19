import { AlertTriangle, RotateCcw } from 'lucide-react'

import Boton from './Boton'

interface EstadoErrorProps {
  mensaje: string
  titulo?: string
  // Sin esta función no se muestra el botón (el error no se puede reintentar desde acá)
  onReintentar?: () => void
  reintentando?: boolean
}

export default function EstadoError({
  mensaje,
  titulo = 'No se pudo cargar',
  onReintentar,
  reintentando = false,
}: EstadoErrorProps) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      <span
        aria-hidden="true"
        className="flex size-14 items-center justify-center rounded-full bg-red-100 text-red-700"
      >
        <AlertTriangle size={28} />
      </span>

      <p className="text-base font-bold text-slate-900">{titulo}</p>
      <p className="max-w-xs text-sm leading-6 text-slate-600">{mensaje}</p>

      {onReintentar && (
        <Boton
          variante="secundaria"
          icono={RotateCcw}
          onClick={onReintentar}
          cargando={reintentando}
          textoCargando="Reintentando…"
        >
          Reintentar
        </Boton>
      )}
    </div>
  )
}
