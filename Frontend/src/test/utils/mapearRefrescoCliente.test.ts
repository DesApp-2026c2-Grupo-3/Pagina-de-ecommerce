import { describe, expect, test } from 'vitest'
import { mapearRefrescoCliente } from '../../utils/realtime/mapearRefrescoCliente'

const base = { version: 1, eventoId: 'e-1', accion: 'estado_cambiado', ocurridoEn: '2026-11-19T15:00:00.000Z' }

describe('mapearRefrescoCliente (C-6)', () => {
  test('lee el refresco de un pedido', () => {
    expect(mapearRefrescoCliente({ ...base, dominio: 'pedido', recursos: { pedidoId: 45 } })).toEqual({
      eventoId: 'e-1',
      dominio: 'pedido',
      accion: 'estado_cambiado',
      sucursalId: null,
      pedidoId: 45,
    })
  })

  test('lee el refresco de una sucursal', () => {
    expect(mapearRefrescoCliente({ ...base, dominio: 'sucursal', sucursalId: 2 })).toMatchObject({
      dominio: 'sucursal',
      sucursalId: 2,
      pedidoId: null,
    })
  })

  test.each([
    ['otra versión', { ...base, version: 2, dominio: 'sucursal', sucursalId: 2 }],
    ['dominio desconocido', { ...base, dominio: 'stock', sucursalId: 2 }],
    ['pedido sin id', { ...base, dominio: 'pedido' }],
    ['sucursal sin id', { ...base, dominio: 'sucursal' }],
    ['sin eventoId', { ...base, eventoId: '', dominio: 'sucursal', sucursalId: 2 }],
    ['algo que no es un objeto', 'refresco'],
  ])('descarta %s', (_, payload) => {
    expect(mapearRefrescoCliente(payload)).toBeNull()
  })
})
