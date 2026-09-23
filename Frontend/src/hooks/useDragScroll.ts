import { useCallback, useEffect, useRef } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'

/**
 * Permite arrastrar con el mouse un contenedor de scroll horizontal,
 * simulando el swipe táctil que ya funciona nativo en celulares.
 * El scroll táctil (mobile) no se toca: esto solo agrega listeners de mouse.
 *
 * Uso:
 *   const { ref, handlers } = useDragScroll<HTMLDivElement>()
 *   <div ref={ref} {...handlers} className={`overflow-x-auto scrollbar-hide ${handlers.className}`}>
 */
export function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const startScrollLeft = useRef(0)
  const moved = useRef(false)
  const prevSnapType = useRef('')

  // Escuchado en window (no en el div) para que el arrastre no se corte
  // si el mouse sale un instante del contenedor al moverse rápido.
  const onMouseMove = useCallback((e: MouseEvent) => {
    const el = ref.current
    if (!el || !isDragging.current) return
    e.preventDefault()
    const walk = e.pageX - startX.current
    // Umbral chico para distinguir "arrastre" de "click" y no romper los links/botones de las cards
    if (Math.abs(walk) > 5) moved.current = true
    el.scrollLeft = startScrollLeft.current - walk
  }, [])

  const stopDragging = useCallback(() => {
    if (!isDragging.current) return
    isDragging.current = false

    const el = ref.current
    if (el) {
      // Restaura el scroll-snap que se había pausado durante el arrastre
      el.style.scrollSnapType = prevSnapType.current
    }
    document.body.style.removeProperty('user-select')
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', stopDragging)
  }, [onMouseMove])

  function onMouseDown(e: ReactMouseEvent<T>) {
    const el = ref.current
    if (!el || e.button !== 0) return // solo botón izquierdo

    isDragging.current = true
    moved.current = false
    startX.current = e.pageX
    startScrollLeft.current = el.scrollLeft

    // Evita que el navegador arrastre la imagen de la card o seleccione texto
    // en paralelo al drag manual (eso era parte de la sensación "brusca")
    e.preventDefault()
    document.body.style.userSelect = 'none'

    // El scroll-snap del carrusel "pelea" contra el scrollLeft manual y genera
    // saltos: lo pausamos mientras se arrastra y se restaura al soltar.
    prevSnapType.current = el.style.scrollSnapType
    el.style.scrollSnapType = 'none'

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', stopDragging)
  }

  // Si hubo arrastre real, cancela el click que sigue (evita abrir el producto sin querer al soltar)
  function onClickCapture(e: ReactMouseEvent<T>) {
    if (moved.current) {
      e.preventDefault()
      e.stopPropagation()
      moved.current = false
    }
  }

  // Limpieza por si el componente se desmonta en medio de un arrastre
  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', stopDragging)
      document.body.style.removeProperty('user-select')
    }
  }, [onMouseMove, stopDragging])

  return {
    ref,
    handlers: {
      onMouseDown,
      onClickCapture,
      className: 'cursor-grab active:cursor-grabbing',
    },
  }
}
