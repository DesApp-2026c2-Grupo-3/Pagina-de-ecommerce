import { formatearContador } from '../../utils/notificaciones/formatoNotificacion'

export default function NotificacionBadge({ cantidad }: { cantidad: number | null }) {
  if (cantidad === null || cantidad <= 0) return null

  return (
    <span
      aria-hidden="true"
      className="absolute -right-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold leading-none text-white"
    >
      {formatearContador(cantidad)}
    </span>
  )
}
