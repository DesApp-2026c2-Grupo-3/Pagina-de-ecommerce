import { useEffect, useId, useRef, type MouseEvent, type ReactNode, type SyntheticEvent } from 'react'
import { X } from 'lucide-react'

import BotonIcono from './BotonIcono'
import { useCapaParaToasts } from '../../hooks/useCapaParaToasts'

interface DialogoProps {
  abierto: boolean
  titulo: string
  onCerrar: () => void
  children: ReactNode
  // Elemento decorativo junto al título (por ejemplo, un ícono en un círculo)
  icono?: ReactNode
  // Mientras se procesa una acción no se cierra con Escape, el fondo ni la X
  bloquearCierre?: boolean
  // Botones extra en el encabezado, antes de la X (por ejemplo, "Marcar todas")
  acciones?: ReactNode
  // Hoja alta (85 % de la pantalla) con el encabezado fijo: el contenido decide su propia
  // zona desplazable. Solo para listas (la bandeja de avisos, excepción declarada a W-7).
  ocuparAlto?: boolean
}

// Diálogo modal sobre <dialog> nativo (plan UX, UX-09): el navegador da la capa superior,
// el fondo inerte, el foco atrapado y Escape. En el celular se ve como hoja inferior y en
// pantallas grandes, centrado. Regla W-7: sin scroll interno, el contenido tiene que entrar.
export default function Dialogo({
  abierto,
  titulo,
  onCerrar,
  children,
  icono,
  bloquearCierre = false,
  acciones,
  ocuparAlto = false,
}: DialogoProps) {
  const referencia = useRef<HTMLDialogElement>(null)
  const idTitulo = useId()

  // Abierto, todo lo de afuera queda inerte: los toasts pasan a dibujarse adentro
  useCapaParaToasts(referencia, abierto)

  useEffect(() => {
    const dialogo = referencia.current
    if (!dialogo) return

    if (abierto && !dialogo.open) dialogo.showModal()
    if (!abierto && dialogo.open) dialogo.close()
  }, [abierto])

  // Escape dispara "cancel": se frena el cierre nativo y decide el padre
  const manejarCancelar = (evento: SyntheticEvent<HTMLDialogElement>) => {
    evento.preventDefault()
    if (!bloquearCierre) onCerrar()
  }

  // El navegador puede cerrarlo igual (por ejemplo, con un segundo Escape seguido):
  // se avisa al padre para que su estado no quede desfasado
  const manejarCierreNativo = () => {
    if (abierto) onCerrar()
  }

  // Un toque en el fondo llega al propio <dialog>; uno en el contenido, a sus hijos
  const manejarClic = (evento: MouseEvent<HTMLDialogElement>) => {
    if (evento.target === evento.currentTarget && !bloquearCierre) onCerrar()
  }

  return (
    <dialog
      ref={referencia}
      aria-labelledby={idTitulo}
      onCancel={manejarCancelar}
      onClose={manejarCierreNativo}
      onClick={manejarClic}
      className={
        'm-0 mt-auto max-h-dvh w-full max-w-none rounded-t-3xl border-0 bg-white p-0 text-slate-900 ' +
        'shadow-2xl backdrop:bg-slate-950/50 sm:m-auto sm:w-[calc(100%-2rem)] sm:max-w-md sm:rounded-3xl ' +
        (ocuparAlto ? 'h-[85dvh] overflow-hidden' : 'overflow-visible')
      }
    >
      <div
        className={
          ocuparAlto
            ? 'flex h-full flex-col'
            : 'flex flex-col gap-4 px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-4 sm:pb-6'
        }
      >
        <div
          className={
            'flex items-center justify-between gap-3' +
            (ocuparAlto ? ' shrink-0 border-b border-slate-200 py-2 pr-2 pl-5' : '')
          }
        >
          <div className="flex min-w-0 items-center gap-3">
            {icono}
            <h2 id={idTitulo} className="text-xl font-black tracking-tight text-slate-900">
              {titulo}
            </h2>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {acciones}
            <BotonIcono icono={X} etiqueta="Cerrar" onClick={onCerrar} disabled={bloquearCierre} />
          </div>
        </div>

        {ocuparAlto ? (
          <div className="flex min-h-0 flex-1 flex-col pb-[env(safe-area-inset-bottom)]">{children}</div>
        ) : (
          children
        )}
      </div>
    </dialog>
  )
}
