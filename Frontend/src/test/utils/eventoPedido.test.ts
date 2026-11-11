import { describe, expect, test } from 'vitest'
import type { Order } from '../../types/order'
import {
  aplicarEventoPedido,
  leerEventoPedido,
  type EventoPedidoCliente,
} from '../../utils/notificaciones/eventoPedido'

function payload(tipo: string, usuarioId = 7) {
  return {
    id: 20,
    version: 1,
    tipo,
    ocurridoEn: '2026-01-02T10:05:00.000Z',
    leida: false,
    leidaEn: null,
    datos: {
      pedidoId: 50,
      usuarioId,
      sucursalId: 2,
      estadoAnterior: 'Pendiente',
      estado: 'En proceso',
      total: 5000,
      fecha: '2026-01-01T10:00:00.000Z',
    },
  }
}

const pedido: Order = {
  id: 50,
  usuarioId: 7,
  direccionId: 3,
  fecha: '2026-01-01T10:00:00.000Z',
  total: '5000',
  estado: 'Pendiente',
  DetallePedidos: [],
  Sucursal: { id: 2, nombre: 'Centro' },
  historialDeTiemposPedidos: [
    { estado: 'Pendiente', fecha: '2026-01-01T10:00:00.000Z' },
  ],
}

describe('eventoPedido', () => {
  test('extrae solo eventos de pedido del usuario actual', () => {
    const evento = leerEventoPedido(
      payload('pedido.estado_cambiado'),
      7,
    )

    expect(evento).toMatchObject({
      pedidoId: 50,
      estado: 'En proceso',
      estadoAnterior: 'Pendiente',
    })
    expect(
      leerEventoPedido(payload('pedido.estado_cambiado'), 8),
    ).toBeNull()
    expect(leerEventoPedido(payload('sucursal.cerrada'), 7)).toBeNull()
  })

  test('actualiza estado e historial sin duplicar el mismo evento', () => {
    const evento: EventoPedidoCliente = {
      tipo: 'pedido.estado_cambiado',
      pedidoId: 50,
      estado: 'En proceso',
      estadoAnterior: 'Pendiente',
      ocurridoEn: '2026-01-02T10:05:00.000Z',
    }

    const actualizado = aplicarEventoPedido(pedido, evento)
    expect(actualizado.estado).toBe('En proceso')
    expect(actualizado.historialDeTiemposPedidos).toHaveLength(2)

    const repetido = aplicarEventoPedido(actualizado, evento)
    expect(repetido.historialDeTiemposPedidos).toHaveLength(2)
  })

  test('ignora eventos anteriores al último registro del historial', () => {
    const actualizado = aplicarEventoPedido(pedido, {
      tipo: 'pedido.estado_cambiado',
      pedidoId: 50,
      estado: 'Entregado',
      estadoAnterior: 'En camino',
      ocurridoEn: '2025-12-31T10:00:00.000Z',
    })

    expect(actualizado).toBe(pedido)
  })
})
