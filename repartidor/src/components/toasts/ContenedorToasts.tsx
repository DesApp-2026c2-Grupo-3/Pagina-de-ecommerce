import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

import Toast from './Toast'
import { useToast, useToasts } from '../../context/toasts/ToastContext'

// Pila de toasts arriba: debajo del encabezado en el celular y a la derecha en escritorio
// (UX-06). Usa popover="manual" para entrar en la capa superior del navegador, sin z-index.
export default function ContenedorToasts() {
  const { visibles, capa } = useToasts()
  const { cerrar, vaciar } = useToast()
  const referencia = useRef<HTMLDivElement>(null)
  // Elemento que ya se abrió como popover. Al cambiar de capa se dibuja uno nuevo, cerrado.
  const abierto = useRef<HTMLElement | null>(null)
  const masNuevo = visibles[0]?.id
  const hayToasts = visibles.length > 0

  // Se monta con la sesión: al salir, lo pendiente se descarta
  useEffect(() => vaciar, [vaciar])

  // Con cada aviso nuevo se vuelve a abrir, así queda por delante de lo que se abrió después
  useEffect(() => {
    const contenedor = referencia.current
    if (!contenedor) return

    // Cerrar y abrir saca el foco: si estaba en un toast, se devuelve
    const activo = document.activeElement
    const enfocado = activo instanceof HTMLElement && contenedor.contains(activo) ? activo : null

    if (abierto.current === contenedor) contenedor.hidePopover()
    contenedor.showPopover()
    abierto.current = contenedor
    enfocado?.focus()
  }, [capa, hayToasts, masNuevo])

  if (!hayToasts) return null

  return createPortal(
    <div
      ref={referencia}
      popover="manual"
      role="region"
      aria-label="Avisos en vivo"
      className={
        'pointer-events-none fixed inset-x-3 top-[calc(4.75rem+env(safe-area-inset-top))] bottom-auto m-0 h-auto w-auto ' +
        'overflow-visible border-0 bg-transparent p-0 md:inset-x-auto md:top-20 md:right-6 md:w-96'
      }
    >
      <ol className="flex flex-col gap-2">
        {visibles.map((toast) => (
          <li key={toast.id} className="pointer-events-auto">
            <Toast toast={toast} onCerrar={cerrar} />
          </li>
        ))}
      </ol>
    </div>,
    capa ?? document.body,
  )
}
