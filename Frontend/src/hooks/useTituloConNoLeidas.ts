import { useEffect } from 'react'
import { NOMBRE_TIENDA } from '../config/marca'

// «(2) BurgerFast» mientras haya avisos sin leer; sin número, solo el nombre
export function useTituloConNoLeidas(noLeidas: number | null) {
  useEffect(() => {
    document.title =
      noLeidas && noLeidas > 0 ? `(${noLeidas > 99 ? '99+' : noLeidas}) ${NOMBRE_TIENDA}` : NOMBRE_TIENDA
  }, [noLeidas])
}
