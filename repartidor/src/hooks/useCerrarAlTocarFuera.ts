import { useEffect, type RefObject } from 'react'

// Panel no modal (bandeja de escritorio): se cierra al tocar fuera del contenedor o con Escape
export function useCerrarAlTocarFuera(
  contenedor: RefObject<HTMLElement | null>,
  activo: boolean,
  alCerrar: () => void,
) {
  useEffect(() => {
    if (!activo) return

    const alTocar = (evento: PointerEvent) => {
      if (evento.target instanceof Node && !contenedor.current?.contains(evento.target)) alCerrar()
    }

    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') alCerrar()
    }

    document.addEventListener('pointerdown', alTocar)
    document.addEventListener('keydown', alTeclear)
    return () => {
      document.removeEventListener('pointerdown', alTocar)
      document.removeEventListener('keydown', alTeclear)
    }
  }, [activo, alCerrar, contenedor])
}
