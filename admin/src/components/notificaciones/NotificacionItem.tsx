import type { Notificacion } from '../../types/notificacion.types'
import { describirNotificacion } from '../../utils/notificaciones/describirNotificacion'
import { construirDestinoNotificacion } from '../../utils/notificaciones/destinoNotificacion'
import { useAbrirNotificacion } from '../../hooks/useAbrirNotificacion'
import NotificacionAccionLeida from './NotificacionAccionLeida'
import NotificacionContenido from './NotificacionContenido'

export default function NotificacionItem({
  notificacion,
}: {
  notificacion: Notificacion
}) {
  const abrir = useAbrirNotificacion()
  const descripcion = describirNotificacion(notificacion)
  const destino = construirDestinoNotificacion(notificacion)
  const noLeida = !notificacion.leida

  return (
    <li
      className={`flex flex-wrap items-start gap-3 border-l-4 px-4 py-3 ${
        noLeida
          ? 'border-action bg-orange-50/70'
          : 'border-transparent bg-white'
      }`}
    >
      {destino ? (
        <button
          type="button"
          onClick={() => abrir(notificacion)}
          className="min-w-0 flex-1 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2"
        >
          <NotificacionContenido
            notificacion={notificacion}
            descripcion={descripcion}
            noLeida={noLeida}
          />
        </button>
      ) : (
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <NotificacionContenido
            notificacion={notificacion}
            descripcion={descripcion}
            noLeida={noLeida}
          />
        </div>
      )}

      {noLeida && (
        <NotificacionAccionLeida
          notificacionId={notificacion.id}
          titulo={descripcion.titulo}
        />
      )}
    </li>
  )
}
