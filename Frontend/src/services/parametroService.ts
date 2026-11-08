import { httpClient } from './httpClient'

// Los parámetros del negocio que necesita la tienda (se editan desde el admin)
export interface ParametrosTienda {
  radioEntregaKm: number
  diasParaCalificar: number
  maxPedidosEnCurso: number
}

// Se piden una sola vez por visita: varias pantallas los usan y casi nunca cambian
let pedido: Promise<ParametrosTienda> | null = null

export function getParametros(): Promise<ParametrosTienda> {
  if (!pedido) {
    pedido = httpClient<ParametrosTienda>('/parametros').catch((error) => {
      pedido = null // si falló, la próxima vez se vuelve a intentar
      throw error
    })
  }
  return pedido
}