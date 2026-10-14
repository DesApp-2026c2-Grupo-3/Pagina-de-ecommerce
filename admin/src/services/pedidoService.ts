import type { PedidoCompleto } from '../types/pedido'

const API_URL = 'http://localhost:3000/admin/pedidos'

// Usa el mensaje que manda el backend ({ code } de las validaciones,
// { mensaje } de negocio o { msj } de auth), o uno por defecto si no vino ninguno
async function errorDe(respuesta: Response, porDefecto: string) {
  try {
    const datos = await respuesta.json()
    return new Error(datos.code ?? datos.mensaje ?? datos.msj ?? porDefecto)
  } catch {
    return new Error(porDefecto)
  }
}

// Detalle completo del pedido: productos, cliente, dirección, sucursal
// y línea de tiempo de estados (historialDeTiemposPedidos)
export async function obtenerPedidoPorId(pedidoId: number): Promise<PedidoCompleto> {
  const respuesta = await fetch(`${API_URL}/${pedidoId}`, {
    credentials: 'include',
  })
  if (!respuesta.ok) throw await errorDe(respuesta, 'No se pudo cargar el pedido')
  return respuesta.json()
}
