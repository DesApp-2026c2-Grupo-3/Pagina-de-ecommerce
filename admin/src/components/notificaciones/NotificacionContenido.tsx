import type { Notificacion } from '../../types/notificacion.types'
import type { DescripcionNotificacion } from '../../utils/notificaciones/describirNotificacion'
import { formatearFecha } from '../../utils/notificaciones/formatoNotificacion'
import NotificacionIcono from './NotificacionIcono'

interface NotificacionContenidoProps {
  notificacion: Notificacion
  descripcion: DescripcionNotificacion
  noLeida: boolean
}

export default function NotificacionContenido({
  notificacion,
  descripcion,
  noLeida,
}: NotificacionContenidoProps) {
  return (
    <span className="flex min-w-0 flex-1 items-start gap-3">
      <NotificacionIcono tipo={notificacion.tipo} />

      <span className="min-w-0 flex-1 basis-52">
        <span className="block whitespace-normal break-words text-sm font-semibold text-slate-800 [overflow-wrap:anywhere]">
          {descripcion.titulo}
        </span>

        <span className="mt-1 block whitespace-normal break-words text-sm text-slate-600 [overflow-wrap:anywhere]">
          {descripcion.descripcion}
        </span>

        <span className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
          <time dateTime={notificacion.ocurridoEn}>
            {formatearFecha(notificacion.ocurridoEn)}
          </time>
          <span aria-hidden="true">·</span>
          <span className="whitespace-normal break-words [overflow-wrap:anywhere]">
            {descripcion.detalle}
          </span>
          {!noLeida && (
            <>
              <span aria-hidden="true">·</span>
              <span>Leída</span>
            </>
          )}
        </span>
      </span>
    </span>
  )
}
