import { useEffect } from 'react'

const TITULO = 'Repartidor'

// "(3) Repartidor" en la pestaña mientras haya avisos sin leer (plan UX, UX-13)
export function useTituloNoLeidas(noLeidas: number | null) {
  useEffect(() => {
    document.title = noLeidas && noLeidas > 0 ? `(${noLeidas > 99 ? '99+' : noLeidas}) ${TITULO}` : TITULO
  }, [noLeidas])

  useEffect(() => () => {
    document.title = TITULO
  }, [])
}
