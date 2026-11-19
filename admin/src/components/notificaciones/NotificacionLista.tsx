import type { RefObject } from 'react'
import type { Notificacion } from '../../types/notificacion.types'
import NotificacionEstado from './NotificacionEstado'
import NotificacionItem from './NotificacionItem'

interface NotificacionListaProps {
  items: Notificacion[]
  cargandoInicial: boolean
  error: string | null
  onReintentar: () => void
  listaRef: RefObject<HTMLDivElement | null>
}

export default function NotificacionLista({
  items,
  cargandoInicial,
  error,
  onReintentar,
  listaRef,
}: NotificacionListaProps) {
  return (
    <div
      ref={listaRef}
      tabIndex={0}
      role="region"
      aria-label="Lista de notificaciones"
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-action"
    >
      {error && (
        <div className="p-3">
          <NotificacionEstado
            variante="error"
            mensaje={error}
            onReintentar={onReintentar}
          />
        </div>
      )}

      {cargandoInicial && items.length === 0 && (
        <NotificacionEstado variante="cargando" />
      )}

      {!cargandoInicial && items.length === 0 && !error && (
        <NotificacionEstado variante="vacio" />
      )}

      {items.length > 0 && (
        <ul className="divide-y divide-slate-100">
          {items.map((notificacion) => (
            <NotificacionItem
              key={notificacion.id}
              notificacion={notificacion}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
