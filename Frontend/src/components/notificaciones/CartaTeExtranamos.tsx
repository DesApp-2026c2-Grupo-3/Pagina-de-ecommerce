import { useRef, type MouseEvent, type SyntheticEvent } from 'react'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import type { DatosCartaTeExtranamos } from '../../types/notificacion.types'
import { useBloquearScroll } from '../../hooks/useBloquearScroll'
import { useDialogoModal } from '../../hooks/useDialogoModal'

interface Props {
  // La carta que se está leyendo (null = cerrada)
  carta: DatosCartaTeExtranamos | null
  onCerrar: () => void
}

// La carta "Te extrañamos": la misma que el local ve en la vista previa del reporte.
// Se abre al tocar el aviso "Tenés un mensaje de BurgerFast" y se cierra con la X,
// tocando afuera o con Escape.
function CartaTeExtranamos({ carta, onCerrar }: Props) {
  const dialogoRef = useRef<HTMLDialogElement>(null)
  const cerrarRef = useRef<HTMLButtonElement>(null)
  const abierta = carta !== null

  useBloquearScroll(abierta)
  useDialogoModal(dialogoRef, abierta, cerrarRef)

  // Escape dispara "cancel": se frena el cierre nativo para que decida el estado
  function alCancelar(evento: SyntheticEvent<HTMLDialogElement>) {
    evento.preventDefault()
    onCerrar()
  }

  // Un toque en el fondo llega al propio <dialog>: cierra
  function alTocar(evento: MouseEvent<HTMLDialogElement>) {
    if (evento.target === evento.currentTarget) onCerrar()
  }

  return (
    <dialog
      ref={dialogoRef}
      aria-label="Mensaje de BurgerFast"
      onCancel={alCancelar}
      onClick={alTocar}
      className="m-auto w-[min(92vw,28rem)] bg-transparent p-0 backdrop:bg-brand-dark/60"
    >
      {carta && (
        <div
          className="relative rounded bg-[#fffdf7] bg-[repeating-linear-gradient(180deg,transparent_0_29px,#dbeafe_29px_30px)] py-6 pr-6 pl-[38px] shadow-[0_2px_4px_rgba(0,0,0,0.08),0_16px_34px_rgba(0,0,0,0.25)]"
        >
          {/* Margen rojo del cuaderno */}
          <span aria-hidden="true" className="absolute inset-y-0 left-[24px] w-0.5 bg-red-200" />

          <button
            ref={cerrarRef}
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar el mensaje"
            className="absolute top-2 right-2 grid h-9 w-9 place-items-center rounded-full text-brand-dark/60 transition hover:bg-black/5 hover:text-brand-dark"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="text-[24px] leading-[30px] text-blue-900" style={{ fontFamily: '"Caveat", cursive' }}>
            <p>¡Hola, {carta.nombre}!</p>
            <p>Hace un tiempito que no te vemos por BurgerFast y te extrañamos.</p>
            {carta.productoFavorito ? (
              <p>¿Se te antoja tu {carta.productoFavorito} de siempre? Te esperamos con todo recién hecho.</p>
            ) : (
              <p>Te esperamos con todo recién hecho.</p>
            )}
            <p className="text-right">¡Volvé cuando quieras!</p>
          </div>

          <Link
            to="/catalogo"
            onClick={onCerrar}
            className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-brand-red px-5 text-sm font-bold text-white transition hover:brightness-110"
          >
            Ver el menú
          </Link>
        </div>
      )}
    </dialog>
  )
}

export default CartaTeExtranamos
