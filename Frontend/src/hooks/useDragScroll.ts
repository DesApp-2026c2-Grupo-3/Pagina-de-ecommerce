import { useRef } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'

/**
 * Permite arrastrar con el mouse un contenedor de scroll horizontal,
 * simulando el swipe táctil que ya funciona nativo en celulares.
 * El scroll táctil (mobile) no se toca: esto solo agrega listeners de mouse.
 *
 * Uso:
 *   const scrollRef = useDragScroll<HTMLDivElement>()
 *   <div ref={scrollRef} className="overflow-x-auto scrollbar-hide" {...scrollRef.handlers}>
 */
export function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const startScrollLeft = useRef(0)
  const moved = useRef(false)

  function onMouseDown(e: ReactMouseEvent<T>) {
    const el = ref.current
    if (!el) return
    isDragging.current = true
    moved.current = false
    startX.current = e.pageX - el.offsetLeft
    startScrollLeft.current = el.scrollLeft
  }

  function onMouseLeaveOrUp() {
    isDragging.current = false
  }

  function onMouseMove(e: ReactMouseEvent<T>) {
    const el = ref.current
    if (!el || !isDragging.current) return
    e.preventDefault()
    const x = e.pageX - el.offsetLeft
    const walk = x - startX.current
    // Umbral chico para distinguir "arrastre" de "click" y no romper los links/botones de las cards
    if (Math.abs(walk) > 5) moved.current = true
    el.scrollLeft = startScrollLeft.current - walk
  }

  // Si hubo arrastre real, cancela el click que sigue (evita abrir el producto sin querer al soltar)
  function onClickCapture(e: ReactMouseEvent<T>) {
    if (moved.current) {
      e.preventDefault()
      e.stopPropagation()
      moved.current = false
    }
  }

  return {
    ref,
    handlers: {
      onMouseDown,
      onMouseMove,
      onMouseUp: onMouseLeaveOrUp,
      onMouseLeave: onMouseLeaveOrUp,
      onClickCapture,
      className: 'cursor-grab active:cursor-grabbing',
    },
  }
}
