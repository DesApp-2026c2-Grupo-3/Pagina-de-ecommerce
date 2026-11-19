import { useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  PARAM_PEDIDO,
  PARAM_SUCURSAL,
} from '../utils/navegacion/parametros'
import { leerIdPositivo } from '../utils/navegacion/leerIdPositivo'

export function usePedidoDeepLink() {
  const [searchParams, setSearchParams] = useSearchParams()
  const pedidoId = leerIdPositivo(searchParams.get(PARAM_PEDIDO))
  const sucursalId = leerIdPositivo(searchParams.get(PARAM_SUCURSAL))
  const pedidoInvalido =
    searchParams.has(PARAM_PEDIDO) && pedidoId === null

  useEffect(() => {
    if (!pedidoInvalido) return

    const siguientes = new URLSearchParams(searchParams)
    siguientes.delete(PARAM_PEDIDO)
    setSearchParams(siguientes, { replace: true })
  }, [pedidoInvalido, searchParams, setSearchParams])

  const limpiarPedido = useCallback(() => {
    if (!searchParams.has(PARAM_PEDIDO)) return

    const siguientes = new URLSearchParams(searchParams)
    siguientes.delete(PARAM_PEDIDO)
    setSearchParams(siguientes, { replace: true })
  }, [searchParams, setSearchParams])

  return { pedidoId, sucursalId, limpiarPedido }
}
