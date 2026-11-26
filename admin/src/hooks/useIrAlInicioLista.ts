import { useCallback, useRef } from 'react'

// Al cambiar de página: si el inicio de la lista quedó fuera de la vista, se vuelve ahí
// al instante (sin desplazamiento animado) y el foco pasa al título de la lista.
export function useIrAlInicioLista() {
  const refTitulo = useRef<HTMLHeadingElement | null>(null)

  const irAlInicio = useCallback(() => {
    // Después del render de la página nueva
    window.requestAnimationFrame(() => {
      const titulo = refTitulo.current
      if (!titulo) return
      if (titulo.getBoundingClientRect().top < 0) titulo.scrollIntoView({ behavior: 'auto', block: 'start' })
      titulo.focus({ preventScroll: true })
    })
  }, [])

  return { refTitulo, irAlInicio }
}
