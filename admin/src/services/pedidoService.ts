import type { Etapa, PedidoCompleto, PedidoFila } from '../types/pedido.types'
import { apiFetch, API_URL } from './httpClient'

const API = `${API_URL}/admin/pedidos`

// Detalle completo del pedido: productos, cliente, dirección, sucursal
// y línea de tiempo de estados (historialDeTiemposPedidos)
export async function obtenerPedidoPorId(pedidoId: number): Promise<PedidoCompleto> {
  return apiFetch(`${API}/${pedidoId}`, {
    mensajePorDefecto: 'No se pudo cargar el pedido',
  })
}

// Cambio de estado (PATCH /editar/estado/:id).
// El backend valida: bloquea volver a Pendiente y solo devuelve stock si se cancela desde Pendiente.
export async function actualizarEstadoPedido(
  pedidoId: number,
  estado: Etapa,
): Promise<{ estado?: string }> {
  return apiFetch(`${API}/editar/estado/${pedidoId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado }),
    mensajePorDefecto: 'No se pudo actualizar el estado',
  })
}

// Pedidos de una sucursal (GET /sucursal/:id), del más nuevo al más viejo
export async function obtenerPedidosPorSucursal(sucursalId: number): Promise<PedidoFila[]> {
  return apiFetch(`${API}/sucursal/${sucursalId}`, {
    mensajePorDefecto: 'Error al cargar los pedidos',
  })
}
