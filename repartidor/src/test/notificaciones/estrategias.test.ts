import { describe, expect, test } from 'vitest'

import { obtenerEstrategia } from '../../notificaciones/registro'
import { TONOS } from '../../notificaciones/tonos'
import type { TipoNotificacion } from '../../notificaciones/catalogo'
import { pedidoCancelado, viajeAsignado } from '../fixturesNotificaciones'

const TIPOS: TipoNotificacion[] = ['viaje.asignado', 'viaje.reasignado', 'pedido.cancelado_en_viaje']

describe('estrategias: tono y aviso (plan UX, sección 6)', () => {
  test.each(TIPOS)('%s tiene un tono con clases', (tipo) => {
    expect(TONOS[obtenerEstrategia(tipo).tono]).toBeDefined()
  })

  test('cada tipo con su color semántico', () => {
    expect(TIPOS.map((tipo) => obtenerEstrategia(tipo).tono)).toEqual(['marca', 'alerta', 'peligro'])
  })

  test('los tres avisan en vivo con prioridad alta', () => {
    for (const tipo of TIPOS) expect(obtenerEstrategia(tipo).aviso?.prioridad).toBe('alta')
  })

  test('el texto de la acción acompaña al destino', () => {
    const asignado = obtenerEstrategia('viaje.asignado')
    expect(asignado.aviso?.textoAccion(viajeAsignado(1, '2026-11-17T10:00:00.000Z') as never)).toBe('Ver viaje')

    const cancelado = obtenerEstrategia('pedido.cancelado_en_viaje')
    expect(cancelado.aviso?.textoAccion(pedidoCancelado(2, '2026-11-17T10:00:00.000Z', true) as never)).toBe('Ver pedidos')
    expect(cancelado.aviso?.textoAccion(pedidoCancelado(3, '2026-11-17T10:00:00.000Z', false) as never)).toBe('Ver viaje')
  })
})
