import type { NotificacionCliente } from '../../types/notificacion.types'
import { fabricaNotificacionesCliente } from '../../utils/notificaciones/fabricaNotificaciones'
import { formatearDiaHora } from '../../utils/fechas'
import { tiempoRelativo } from '../../utils/tiempoRelativo'
import { APARIENCIA_TONO } from './tonos'

interface Props {
  notificacion: NotificacionCliente
  ahora: number
  onAbrir: (notificacion: NotificacionCliente) => void
}

function ItemNotificacion({ notificacion, ahora, onAbrir }: Props) {
  const { titulo, detalle, tono } = fabricaNotificacionesCliente.describir(notificacion)
  const { Icono, clase } = APARIENCIA_TONO[tono]
  // Sobre el fondo mostaza de las no leídas, el gris de la marca no llega a 4.5:1
  const textoSecundario = notificacion.leida ? 'text-brand-muted' : 'text-brand-dark/80'

  return (
    <li>
      <button
        type="button"
        onClick={() => onAbrir(notificacion)}
        className={`flex min-h-11 w-full items-start gap-3 rounded-2xl border-2 px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark ${
          notificacion.leida
            ? 'border-transparent hover:bg-white'
            : 'border-brand-mustard bg-brand-mustard/15 hover:bg-brand-mustard/25'
        }`}
      >
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${clase}`}>
          <Icono className="h-5 w-5" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-2">
            <span className="break-words text-sm font-bold leading-snug [overflow-wrap:anywhere]">
              {!notificacion.leida && <span className="sr-only">Sin leer. </span>}
              {titulo}
            </span>
            {!notificacion.leida && (
              <span aria-hidden="true" className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-red" />
            )}
          </span>

          {detalle && (
            <span className={`mt-0.5 block text-sm ${textoSecundario} [overflow-wrap:anywhere]`}>{detalle}</span>
          )}

          <time
            dateTime={notificacion.ocurridoEn}
            title={formatearDiaHora(notificacion.ocurridoEn)}
            className={`mt-1 block text-xs font-semibold ${textoSecundario}`}
          >
            {tiempoRelativo(notificacion.ocurridoEn, ahora)}
          </time>
        </span>
      </button>
    </li>
  )
}

export default ItemNotificacion
