import { Inbox, LoaderCircle, TriangleAlert } from 'lucide-react'

interface NotificacionEstadoProps {
  variante: 'cargando' | 'vacio' | 'error'
  mensaje?: string
  onReintentar?: () => void
}

export default function NotificacionEstado({
  variante,
  mensaje,
  onReintentar,
}: NotificacionEstadoProps) {
  if (variante === 'cargando') {
    return (
      <div
        aria-busy="true"
        className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-slate-500"
      >
        <LoaderCircle aria-hidden="true" className="animate-spin" size={18} />
        <span>Cargando notificaciones...</span>
      </div>
    )
  }

  if (variante === 'vacio') {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-slate-500">
        <Inbox aria-hidden="true" size={24} />
        <p className="whitespace-normal break-words [overflow-wrap:anywhere]">
          No tenés notificaciones por ahora.
        </p>
      </div>
    )
  }

  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger"
    >
      <div className="flex items-start gap-2">
        <TriangleAlert aria-hidden="true" className="mt-0.5 shrink-0" size={18} />
        <p className="min-w-0 whitespace-normal break-words [overflow-wrap:anywhere]">
          {mensaje ?? 'No se pudieron cargar las notificaciones.'}
        </p>
      </div>

      {onReintentar && (
        <button
          type="button"
          onClick={onReintentar}
          className="rounded-md border border-danger/30 px-3 py-1.5 text-xs font-semibold text-danger hover:bg-red-100"
        >
          Reintentar
        </button>
      )}
    </div>
  )
}
