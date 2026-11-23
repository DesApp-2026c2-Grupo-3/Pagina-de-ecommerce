import { useCallback, useEffect, useId, useRef, type RefObject } from 'react'

import { useAccionesNotificaciones, useNotificaciones } from '../../context/notificaciones/NotificacionContext'
import { useAbrirNotificacion } from '../../hooks/useAbrirNotificacion'
import { useAhora } from '../../hooks/useAhora'
import { useCerrarAlTocarFuera } from '../../hooks/useCerrarAlTocarFuera'
import { useEsPantallaChica } from '../../hooks/useEsPantallaChica'
import Dialogo from '../ui/Dialogo'
import ListaNotificaciones from './ListaNotificaciones'

interface BandejaNotificacionesProps {
  abierta: boolean
  onCerrar: () => void
  // Id del panel de escritorio (lo referencia la campana con aria-controls)
  idPanel: string
  // La campana: el foco vuelve a ella al cerrar el panel de escritorio
  idDisparador: string
  // Contenedor de la campana y el panel: tocar dentro no cierra
  ancla: RefObject<HTMLElement | null>
}

// Bandeja de avisos. En el celular, hoja inferior (diálogo modal); en escritorio, panel
// debajo de la campana. El contenido es el mismo (plan UX, UX-02).
export default function BandejaNotificaciones({ abierta, onCerrar, idPanel, idDisparador, ancla }: BandejaNotificacionesProps) {
  const chica = useEsPantallaChica()
  const estado = useNotificaciones()
  const { marcarTodas, cargarMas, reintentar } = useAccionesNotificaciones()
  const abrir = useAbrirNotificacion(onCerrar)
  const ahora = useAhora()
  const idTitulo = useId()
  const panel = useRef<HTMLDivElement>(null)

  const cerrarPanel = useCallback(() => {
    onCerrar()
    document.getElementById(idDisparador)?.focus()
  }, [idDisparador, onCerrar])

  useCerrarAlTocarFuera(ancla, abierta && !chica, cerrarPanel)

  // Al abrir el panel de escritorio, el foco entra en él
  useEffect(() => {
    if (abierta && !chica) panel.current?.focus()
  }, [abierta, chica])

  const sinLeer = estado.noLeidas ?? 0

  const marcarTodasBoton = (
    <button
      type="button"
      onClick={marcarTodas}
      disabled={sinLeer === 0 || estado.marcandoTodas}
      className="min-h-11 rounded-xl px-3 text-sm font-bold text-orange-800 transition enabled:hover:bg-orange-50 disabled:text-slate-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-300"
    >
      {estado.marcandoTodas ? 'Marcando…' : 'Marcar todas'}
    </button>
  )

  const lista = (
    <ListaNotificaciones
      estado={estado}
      ahora={ahora}
      onAbrir={abrir}
      onReintentar={reintentar}
      onCargarMas={cargarMas}
    />
  )

  if (chica) {
    return (
      <Dialogo abierto={abierta} titulo="Avisos" onCerrar={onCerrar} ocuparAlto acciones={marcarTodasBoton}>
        {lista}
      </Dialogo>
    )
  }

  if (!abierta) return null

  return (
    <div
      id={idPanel}
      ref={panel}
      role="dialog"
      aria-labelledby={idTitulo}
      tabIndex={-1}
      className="absolute top-full right-0 z-40 mt-3 flex max-h-[min(36rem,calc(100dvh-7rem))] w-96 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl focus:outline-none"
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200 py-2 pr-2 pl-4">
        <div className="flex items-center gap-2">
          <h2 id={idTitulo} className="text-lg font-black text-slate-900">
            Avisos
          </h2>
          {sinLeer > 0 && (
            <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-800">
              {sinLeer} sin leer
            </span>
          )}
        </div>
        {marcarTodasBoton}
      </div>

      {lista}
    </div>
  )
}
