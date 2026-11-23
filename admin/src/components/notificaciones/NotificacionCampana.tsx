import { useId } from 'react'
import { Bell } from 'lucide-react'
import { useNotificaciones } from '../../context/notificaciones/NotificacionContext'
import { useDesplegableNotificaciones } from '../../hooks/useDesplegableNotificaciones'
import NotificacionBadge from './NotificacionBadge'
import NotificacionPanel from './NotificacionPanel'

export default function NotificacionCampana() {
  const { noLeidas } = useNotificaciones()
  const {
    abierto,
    alternar,
    contenedorRef,
    botonRef,
    panelRef,
  } = useDesplegableNotificaciones()
  const idPanel = useId()

  const etiqueta = noLeidas !== null && noLeidas > 0
    ? `Notificaciones, ${noLeidas} sin leer`
    : 'Notificaciones'

  return (
    <div
      ref={contenedorRef}
      className="relative flex w-full flex-col items-stretch md:w-auto md:items-end"
    >
      <div className="flex justify-end">
        <button
          ref={botonRef}
          type="button"
          onClick={alternar}
          aria-label={etiqueta}
          aria-expanded={abierto}
          aria-controls={idPanel}
          className="relative flex size-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <Bell aria-hidden="true" size={20} />
          <NotificacionBadge cantidad={noLeidas} />
        </button>
      </div>

      {abierto && (
        <NotificacionPanel id={idPanel} panelRef={panelRef} />
      )}
    </div>
  )
}
