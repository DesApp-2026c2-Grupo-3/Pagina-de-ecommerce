import { Check } from 'lucide-react'
import { useAccionesNotificaciones } from '../../context/notificaciones/NotificacionContext'

interface NotificacionAccionLeidaProps {
  notificacionId: number
  titulo: string
}

export default function NotificacionAccionLeida({
  notificacionId,
  titulo,
}: NotificacionAccionLeidaProps) {
  const { marcarLeida } = useAccionesNotificaciones()

  return (
    <button
      type="button"
      onClick={(evento) => {
        evento.stopPropagation()
        marcarLeida(notificacionId)
      }}
      aria-label={`Marcar como leída: ${titulo}`}
      className="ml-auto flex shrink-0 items-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold text-action hover:bg-orange-100"
    >
      <Check aria-hidden="true" size={14} />
      Marcar leída
    </button>
  )
}
