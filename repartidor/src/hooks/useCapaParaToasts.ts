import { useEffect, type RefObject } from 'react'

import { useToast } from '../context/toasts/ToastContext'

// Mientras un diálogo modal está abierto, el resto de la página queda inerte (no se puede
// tocar ni lo anuncia el lector de pantalla). Anotarlo como capa hace que los toasts se
// dibujen dentro de él y sigan funcionando.
export function useCapaParaToasts(referencia: RefObject<HTMLElement | null>, activa: boolean) {
  const { registrarCapa } = useToast()

  useEffect(() => {
    const elemento = referencia.current
    if (!activa || !elemento) return

    return registrarCapa(elemento)
  }, [activa, referencia, registrarCapa])
}
