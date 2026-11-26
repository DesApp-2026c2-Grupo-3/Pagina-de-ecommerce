import { useEffect, type RefObject } from 'react'
import { useLocation } from 'react-router-dom'

// Al cambiar de pantalla, un <dialog> abierto se cierra. Cierra el elemento nativo:
// su evento "close" es el que actualiza el estado de quien lo abrió.
export function useCerrarDialogoAlNavegar(dialogo: RefObject<HTMLDialogElement | null>) {
  const { key } = useLocation()

  useEffect(() => {
    const elemento = dialogo.current
    if (elemento?.open) elemento.close()
  }, [dialogo, key])
}
