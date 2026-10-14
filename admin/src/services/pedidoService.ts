import type { Etapa, PedidoCompleto, PedidoFila } from '../types/pedido'

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

// Cambio de estado (PATCH /editar/estado/:id).
// El backend valida: bloquea volver a Pendiente y solo devuelve stock si se cancela desde Pendiente.
export async function actualizarEstadoPedido(
  pedidoId: number,
  estado: Etapa,
): Promise<{ estado?: string }> {
  const respuesta = await fetch(`${API_URL}/editar/estado/${pedidoId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ estado }),
  })
  if (!respuesta.ok) throw await errorDe(respuesta, 'No se pudo actualizar el estado')
  return respuesta.json()
}

// Pedidos de una sucursal (GET /sucursal/:id), del más nuevo al más viejo
export async function obtenerPedidosPorSucursal(sucursalId: number): Promise<PedidoFila[]> {
  const respuesta = await fetch(`${API_URL}/sucursal/${sucursalId}`, {
    credentials: 'include',
  })
  if (!respuesta.ok) throw await errorDe(respuesta, 'Error al cargar los pedidos')
  return respuesta.json()
}
