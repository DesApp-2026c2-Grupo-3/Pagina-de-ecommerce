import type { Notificacion } from '../../notificaciones/catalogo'
import { apariencia, describirNotificacion } from '../../notificaciones/mapearNotificacion'
import { TONOS } from '../../notificaciones/tonos'
import { tiempoRelativo } from '../../utils/tiempoRelativo'

interface ItemNotificacionProps {
  notificacion: Notificacion
  ahora: number
  onAbrir: (notificacion: Notificacion) => void
}

// Una fila de la bandeja: el ítem entero es el botón (72 px de alto como mínimo)
export default function ItemNotificacion({ notificacion, ahora, onAbrir }: ItemNotificacionProps) {
  const { titulo, descripcion } = describirNotificacion(notificacion)
  const { icono: Icono, tono } = apariencia(notificacion)
  const sinLeer = !notificacion.leida

  return (
    <li>
      <button
        type="button"
        onClick={() => onAbrir(notificacion)}
        className={
          'flex min-h-18 w-full items-start gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50 active:bg-slate-100 ' +
          'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-orange-300 ' +
          (sinLeer ? 'bg-orange-50/70' : 'bg-white')
        }
      >
        <span
          aria-hidden="true"
          className={`flex size-10 shrink-0 items-center justify-center rounded-full ${TONOS[tono].circulo}`}
        >
          <Icono size={20} />
        </span>

        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className={`text-[15px] leading-snug text-slate-900 ${sinLeer ? 'font-bold' : 'font-semibold'}`}>
            {sinLeer && <span className="sr-only">Sin leer. </span>}
            {titulo}
          </span>
          <span className="text-sm leading-snug text-slate-600">{descripcion}</span>
          <time dateTime={notificacion.ocurridoEn} className="text-xs font-semibold text-slate-600">
            {tiempoRelativo(notificacion.ocurridoEn, ahora)}
          </time>
        </span>

        {sinLeer && <span aria-hidden="true" className="mt-1.5 size-2.5 shrink-0 rounded-full bg-orange-700" />}
      </button>
    </li>
  )
}
