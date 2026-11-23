import { useId, useRef, type MouseEvent, type SyntheticEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { LoaderCircle, RefreshCw, X } from 'lucide-react'
import {
  useAccionesNotificaciones,
  useNotificaciones,
} from '../../context/notificaciones/NotificacionContext'
import type { NotificacionCliente } from '../../types/notificacion.types'
import type { Anclaje } from '../../utils/anclaje'
import { fabricaNotificacionesCliente } from '../../utils/notificaciones/fabricaNotificaciones'
import { useBloquearScroll } from '../../hooks/useBloquearScroll'
import { useCerrarDialogoAlNavegar } from '../../hooks/useCerrarDialogoAlNavegar'
import { useDialogoModal } from '../../hooks/useDialogoModal'
import ListaNotificaciones from './ListaNotificaciones'

interface Props {
  id: string
  abierto: boolean
  esCelular: boolean
  // Escritorio: posición debajo de la campana (plan, DC-1)
  anclaje: Anclaje | null
  onCerrar: () => void
  // Los avisos que son una carta (no llevan a otra pantalla): se abren en una ventana
  onAbrirCarta: (notificacion: Extract<NotificacionCliente, { tipo: 'cliente.te_extranamos' }>) => void
}

const CLASE_ALERTA =
  'rounded-xl border-2 border-brand-dark bg-brand-red px-3 py-2 text-sm font-semibold text-white'

// La bandeja: <dialog> modal con encabezado, errores y lista
function BandejaNotificaciones({ id, abierto, esCelular, anclaje, onCerrar, onAbrirCarta }: Props) {  
  const estado = useNotificaciones()
  const acciones = useAccionesNotificaciones()
  const navigate = useNavigate()
  const dialogoRef = useRef<HTMLDialogElement>(null)
  const cerrarRef = useRef<HTMLButtonElement>(null)
  const idTitulo = useId()

  // Mientras está abierta, la página de atrás no se mueve (plan, 36.2)
  useBloquearScroll(abierto)
  useDialogoModal(dialogoRef, abierto, cerrarRef)
  useCerrarDialogoAlNavegar(dialogoRef)

  // Escape dispara "cancel": se frena el cierre nativo para que decida el estado
  function alCancelar(evento: SyntheticEvent<HTMLDialogElement>) {
    evento.preventDefault()
    onCerrar()
  }

  // El navegador o la navegación (useCerrarDialogoAlNavegar) pueden cerrarlo: se sincroniza el estado
  function alCerrarNativo() {
    if (abierto) onCerrar()
  }

  // Un toque en el fondo llega al propio <dialog>; uno en el contenido, a sus hijos
  function alTocar(evento: MouseEvent<HTMLDialogElement>) {
    if (evento.target === evento.currentTarget) onCerrar()
  }

  function abrirNotificacion(notificacion: NotificacionCliente) {
    if (!notificacion.leida) acciones.marcarLeida(notificacion.id)

    const destino = fabricaNotificacionesCliente.obtenerDestino(notificacion)
    onCerrar()
    if (notificacion.tipo === 'cliente.te_extranamos') onAbrirCarta(notificacion)
    else if (destino) navigate(destino)  
  }

  const { noLeidas, errorCarga, errorAccion } = estado
  const puedeMarcarTodas =
    !estado.marcandoTodas &&
    (noLeidas === null ? estado.items.some((notificacion) => !notificacion.leida) : noLeidas > 0)

  return (
    // Celular: hoja inferior. Escritorio: panel anclado debajo de la campana. Mismo contenido.
    <dialog
      ref={dialogoRef}
      id={id}
      aria-labelledby={idTitulo}
      onCancel={alCancelar}
      onClose={alCerrarNativo}
      onClick={alTocar}
      style={!esCelular && anclaje ? { top: anclaje.top, right: anclaje.right } : undefined}
      className={`m-0 overflow-hidden border-2 border-brand-dark bg-brand-cream p-0 text-brand-dark ${
        esCelular
          ? 'fixed inset-x-0 bottom-0 top-auto h-[85dvh] max-h-none w-full max-w-none rounded-t-3xl border-b-0 backdrop:bg-brand-dark/40'
          : 'fixed bottom-auto left-auto max-h-[70dvh] w-96 max-w-[calc(100vw-1.5rem)] rounded-3xl shadow-sticker backdrop:bg-brand-dark/10'
      }`}
    >
      <div className={`flex flex-col ${esCelular ? 'h-full' : 'max-h-[70dvh]'}`}>
        <div className="flex h-14 shrink-0 items-center gap-1 bg-brand-dark pl-4 pr-1.5 text-brand-cream">
          <h2 id={idTitulo} className="min-w-0 truncate font-display text-base font-extrabold">
            Notificaciones
          </h2>

          {/* En pantallas de menos de 360 px no entra: el número sigue en la campana */}
          {noLeidas !== null && noLeidas > 0 && (
            <span
              aria-label={`${noLeidas} sin leer`}
              className="ml-1 hidden h-5 min-w-5 shrink-0 min-[360px]:grid place-items-center rounded-full bg-brand-mustard px-1.5 text-[11px] font-extrabold text-brand-dark"
            >
              <span aria-hidden="true">{noLeidas > 9 ? '9+' : noLeidas}</span>
            </span>
          )}

          <button
            type="button"
            onClick={acciones.marcarTodas}
            disabled={!puedeMarcarTodas}
            className="ml-auto flex min-h-11 shrink-0 items-center gap-1 rounded-full px-2 text-xs font-extrabold uppercase text-brand-mustard transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-mustard disabled:cursor-not-allowed disabled:opacity-45"
          >
            {estado.marcandoTodas && <LoaderCircle aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />}
            Marcar todas
          </button>

          <button
            ref={cerrarRef}
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar notificaciones"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-mustard"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        {(errorCarga || errorAccion) && (
          <div className="space-y-2 border-b-2 border-brand-sand px-3 py-2">
            {errorAccion && (
              <p role="alert" className={`${CLASE_ALERTA} break-words [overflow-wrap:anywhere]`}>
                {errorAccion}
              </p>
            )}
            {errorCarga && (
              <div role="alert" className={CLASE_ALERTA}>
                <p className="break-words [overflow-wrap:anywhere]">{errorCarga.mensaje}</p>
                <button
                  type="button"
                  onClick={acciones.reintentar}
                  className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 border-current px-4 text-xs font-extrabold uppercase"
                >
                  <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
                  Reintentar
                </button>
              </div>
            )}
          </div>
        )}

        <div
          className={`min-h-0 flex-1 overflow-y-auto overscroll-contain ${
            esCelular ? 'pb-[env(safe-area-inset-bottom)]' : ''
          }`}
        >
          <ListaNotificaciones
            items={estado.items}
            cargandoInicial={estado.cargandoInicial}
            cargandoMas={estado.cargandoMas}
            hayMas={estado.siguienteCursor !== null}
            onCargarMas={acciones.cargarMas}
            onAbrir={abrirNotificacion}
          />
        </div>
      </div>
    </dialog>
  )
}

export default BandejaNotificaciones
