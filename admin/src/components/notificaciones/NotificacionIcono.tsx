import type { TipoNotificacion } from '../../types/notificacion.types'
import { obtenerEstrategia } from '../../notificaciones/registro'

export default function NotificacionIcono({ tipo }: { tipo: TipoNotificacion }) {
  const { icono: Icono, clasesIcono } = obtenerEstrategia(tipo)

  return (
    <span
      aria-hidden="true"
      className={`flex size-9 shrink-0 items-center justify-center rounded-full ${clasesIcono}`}
    >
      <Icono size={18} />
    </span>
  )
}
