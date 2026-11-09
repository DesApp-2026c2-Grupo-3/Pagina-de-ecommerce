import type { RefObject } from 'react'
import {
  useAccionesNotificaciones,
  useNotificaciones,
} from '../../context/notificaciones/NotificacionContext'
import { useScrollNotificaciones } from '../../hooks/useScrollNotificaciones'
import NotificacionLista from './NotificacionLista'

interface NotificacionPanelProps {
  id: string
  panelRef: RefObject<HTMLDivElement | null>
}

export default function NotificacionPanel({
  id,
  panelRef,
}: NotificacionPanelProps) {
  const {
    items,
    noLeidas,
    cargandoInicial,
    cargandoMas,
    marcandoTodas,
    error,
    hayMas,
  } = useNotificaciones()
  const { cargarMas, marcarTodas, reintentar } = useAccionesNotificaciones()
  const { listaRef } = useScrollNotificaciones({
    cargandoMas,
    cantidadItems: items.length,
  })

  const resumen = noLeidas === null
    ? 'Sincronizando...'
    : noLeidas === 0
      ? 'Todo leído'
      : `${noLeidas} sin leer`

  const estadoAnunciado = cargandoInicial
    ? 'Cargando notificaciones'
    : cargandoMas
      ? 'Cargando más notificaciones'
      : `${items.length} notificaciones cargadas`

  return (
    <div
      id={id}
      ref={panelRef}
      tabIndex={-1}
      role="region"
      aria-labelledby={`${id}-titulo`}
      aria-busy={cargandoInicial || cargandoMas}
      className="z-50 mt-2 flex max-h-[380px] w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl outline-none md:absolute md:right-0 md:top-full md:mt-2 md:w-[26rem]"
    >
      <div className="flex shrink-0 flex-wrap items-start gap-3 border-b border-slate-200 px-4 py-3">
        <div className="min-w-0 flex-1">
          <h2
            id={`${id}-titulo`}
            className="whitespace-normal break-words text-base font-semibold text-slate-800 [overflow-wrap:anywhere]"
          >
            Notificaciones
          </h2>
          <p
            aria-live="polite"
            className="mt-0.5 text-xs text-slate-500"
          >
            {resumen}
          </p>
        </div>

        <button
          type="button"
          onClick={marcarTodas}
          disabled={marcandoTodas || noLeidas === 0}
          className="rounded-md px-2 py-1.5 text-xs font-semibold text-action hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {marcandoTodas ? 'Marcando...' : 'Marcar todas'}
        </button>
      </div>

      <span className="sr-only" aria-live="polite">
        {estadoAnunciado}
      </span>

      <NotificacionLista
        items={items}
        cargandoInicial={cargandoInicial}
        error={error}
        onReintentar={reintentar}
        listaRef={listaRef}
      />

      {hayMas && (
        <div className="shrink-0 border-t border-slate-200 p-3">
          <button
            type="button"
            onClick={cargarMas}
            disabled={cargandoMas}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-secondary hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cargandoMas ? 'Cargando...' : 'Ver más'}
          </button>
        </div>
      )}
    </div>
  )
}
