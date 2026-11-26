import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  PARAM_PEDIDO,
  PARAM_SUCURSAL,
} from '../utils/navegacion/parametros'
import { leerIdPositivo } from '../utils/navegacion/leerIdPositivo'
import { rutaDetallePedido } from '../utils/navegacion/rutasPedido'

// Enlaces con el formato viejo (/admin/pedidos?pedido=ID&sucursal=SID) llevan a la
// página de detalle nueva. `replace`: el botón atrás no vuelve a la URL vieja.
// Un `pedido` inválido se quita de la URL y la lista se muestra normal.
export function usePedidoDeepLink() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const valor = searchParams.get(PARAM_PEDIDO)
  const pedidoId = leerIdPositivo(valor)

  useEffect(() => {
    if (valor === null) return

    if (pedidoId !== null) {
      const sucursalId = leerIdPositivo(searchParams.get(PARAM_SUCURSAL))
      navigate(rutaDetallePedido(pedidoId, sucursalId), { replace: true })
      return
    }

    const siguientes = new URLSearchParams(searchParams)
    siguientes.delete(PARAM_PEDIDO)
    setSearchParams(siguientes, { replace: true })
  }, [navigate, pedidoId, searchParams, setSearchParams, valor])

  return { redirigiendo: pedidoId !== null }
}
