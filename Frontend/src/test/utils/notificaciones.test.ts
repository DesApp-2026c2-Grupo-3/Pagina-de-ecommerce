import { describe, expect, test } from 'vitest'
import { mapearNotificacion } from '../../utils/notificaciones/mapearNotificacion'
import { mapearEventoLeida } from '../../utils/notificaciones/mapearEventoLeida'
import { fabricaNotificacionesCliente } from '../../utils/notificaciones/fabricaNotificaciones'

function payload(overrides: Record<string, unknown> = {}) {
  return {
    id: 10,
    version: 1,
    tipo: 'pedido.estado_cambiado',
    ocurridoEn: '2026-01-01T10:00:00.000Z',
    leida: false,
    leidaEn: null,
    datos: {
      pedidoId: 50,
      usuarioId: 7,
      sucursalId: 2,
      estadoAnterior: 'pendiente',
      estado: 'en preparación',
      total: 5000,
      fecha: '2026-01-01T10:00:00.000Z',
    },
    ...overrides,
  }
}

describe('mapearNotificacion', () => {
  test('normaliza una notificación válida', () => {
    const notificacion = mapearNotificacion(payload())

    expect(notificacion?.tipo).toBe('pedido.estado_cambiado')
    if (!notificacion || notificacion.tipo === 'sucursal.cerrada') {
      throw new Error('Se esperaba una notificación de pedido')
    }

    expect(notificacion.datos.pedidoId).toBe(50)
    expect(
      fabricaNotificacionesCliente.describir(notificacion).titulo,
    ).toContain('Pedido #50')
    expect(
      fabricaNotificacionesCliente.obtenerDestino(notificacion),
    ).toBe('/pedidos/50')
  })

  test('descarta fechas de ocurrencia inválidas', () => {
    expect(
      mapearNotificacion(payload({ ocurridoEn: 'fecha-corrupta' })),
    ).toBeNull()
  })

  test('descarta una fecha de lectura inválida', () => {
    expect(
      mapearNotificacion(
        payload({
          leida: true,
          leidaEn: '2026-99-99T99:99:99.000Z',
        }),
      ),
    ).toBeNull()
  })

  test('mapea eventos de lectura individual y masiva', () => {
    expect(
      mapearEventoLeida({
        notificacionId: 10,
        leidaEn: '2026-01-02T10:00:00.000Z',
      }),
    ).toEqual({
      notificacionId: 10,
      leidaEn: '2026-01-02T10:00:00.000Z',
    })

    expect(
      mapearEventoLeida({
        todas: true,
        leidaEn: '2026-01-02T10:00:00.000Z',
      }),
    ).toEqual({
      todas: true,
      leidaEn: '2026-01-02T10:00:00.000Z',
    })
  })

  test('descarta eventos de lectura con fecha inválida', () => {
    expect(
      mapearEventoLeida({
        notificacionId: 10,
        leidaEn: 'invalida',
      }),
    ).toBeNull()
  })
})

describe('catálogo de notificaciones', () => {
  test('descarta un tipo que no está en el catálogo', () => {
    expect(mapearNotificacion(payload({ tipo: 'pedido.inventado' }))).toBeNull()
  })

  test('cada tipo del catálogo crea su aviso', () => {
    expect(mapearNotificacion(payload({ tipo: 'pedido.creado' }))?.tipo).toBe('pedido.creado')
    expect(
      mapearNotificacion(
        payload({ tipo: 'sucursal.cerrada', datos: { sucursalId: 2, sucursalNombre: 'Centro' } }),
      )?.tipo,
    ).toBe('sucursal.cerrada')
  })

  test('el detalle del cambio de estado muestra el estado anterior tal como llega', () => {
    const notificacion = mapearNotificacion(payload())
    if (!notificacion) throw new Error('Se esperaba una notificación')

    expect(fabricaNotificacionesCliente.describir(notificacion).detalle).toBe(
      'Antes estaba en pendiente',
    )
  })

  test('descarta datos de pedido incompletos', () => {
    expect(
      mapearNotificacion(payload({ datos: { pedidoId: 50, estado: 'En proceso' } })),
    ).toBeNull()
  })
})
