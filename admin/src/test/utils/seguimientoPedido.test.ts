import { describe, expect, test } from 'vitest'

import { armarRecorrido, etapaAntesDeCancelar } from '../../utils/pedidos/recorridoPedido'
import {
  puedeCancelarDesdePanel,
  textoConfirmacionCancelacion,
} from '../../utils/pedidos/reglasCancelacion'
import { proximoPaso, textoSinAvance } from '../../utils/pedidos/proximoPaso'
import { siguienteEtapaRapida } from '../../utils/pedidos/resumenPedido'
import type { RegistroTiempoPedido } from '../../types/pedido.types'

function registro(id: number, estado: string, estadoAnterior: string | null, minuto: number): RegistroTiempoPedido {
  return { id, estado, estadoAnterior, fecha: `2026-11-24T14:${String(minuto).padStart(2, '0')}:00.000Z` }
}

const historial = [
  registro(1, 'Pendiente', null, 32),
  registro(2, 'En proceso', 'Pendiente', 41),
]

describe('armarRecorrido', () => {
  test('marca cumplido, actual y pendiente con quién lo marca', () => {
    const pasos = armarRecorrido('En proceso', historial)
    expect(pasos.map((p) => p.tipo)).toEqual(['hecho', 'actual', 'pendiente', 'pendiente', 'pendiente'])
    expect(pasos[0].fecha).toBe(historial[0].fecha)
    expect(pasos[1].fecha).toBe(historial[1].fecha)
    expect(pasos[2].quien).toBe('Lo marca la sucursal')
    expect(pasos[3].quien).toBe('Lo marca el repartidor al salir')
    expect(pasos[2].fecha).toBeNull()
  })

  test('un pedido entregado tiene todo cumplido', () => {
    expect(armarRecorrido('entregado', []).every((p) => p.tipo === 'hecho')).toBe(true)
  })

  test('un pedido cancelado termina en el paso rojo y no dibuja lo posterior', () => {
    const cancelado = [...historial, registro(3, 'Cancelado', 'En proceso', 50)]
    const pasos = armarRecorrido('Cancelado', cancelado)
    expect(pasos.map((p) => `${p.estado}:${p.tipo}`)).toEqual([
      'Pendiente:hecho',
      'En proceso:hecho',
      'Cancelado:cancelado',
    ])
    expect(pasos[2].fecha).toBe(cancelado[2].fecha)
  })

  test('sin estadoAnterior, se cancela desde el último paso del historial', () => {
    expect(etapaAntesDeCancelar([registro(1, 'Pendiente', null, 1), registro(2, 'cancelado', null, 2)])).toBe('Pendiente')
  })
})

describe('reglas de cancelación (RN-09, RN-23)', () => {
  test.each([
    ['Pendiente', null, true],
    ['En proceso', null, true],
    ['Listo para retirar', null, true],
    ['Listo para retirar', '2026-11-24T15:02:00.000Z', false],
    ['En camino', null, false],
    ['Entregado', null, false],
    ['Cancelado', null, false],
  ])('%s (retirado: %s) → %s', (estado, retiradoEn, esperado) => {
    expect(puedeCancelarDesdePanel(estado, retiradoEn)).toBe(esperado)
  })

  test('solo desde Pendiente se devuelve el stock', () => {
    expect(textoConfirmacionCancelacion('Pendiente')).toMatch(/Se devuelve/)
    expect(textoConfirmacionCancelacion('En proceso')).toMatch(/no se devuelve/)
  })

  test('en un viaje en preparación, avisa al repartidor', () => {
    expect(textoConfirmacionCancelacion('Listo para retirar', true)).toMatch(/avisa al repartidor/)
    expect(textoConfirmacionCancelacion('Listo para retirar', false)).not.toMatch(/repartidor/)
  })
})

describe('próximo paso', () => {
  test.each([
    ['Pendiente', 'En proceso'],
    ['En proceso', 'Listo para retirar'],
    ['Listo para retirar', null],
    ['En camino', null],
    ['Cancelado', null],
  ])('%s → %s (nunca Cancelado)', (estado, esperado) => {
    expect(siguienteEtapaRapida(estado)).toBe(esperado)
    expect(proximoPaso(estado)?.destino ?? null).toBe(esperado)
  })

  test('pasar a Listo para retirar advierte el aviso a repartidores', () => {
    expect(proximoPaso('En proceso')?.efecto).toMatch(/repartidores/)
  })

  test('sin avance, explica por qué', () => {
    expect(textoSinAvance('Listo para retirar', { retirado: true, enViaje: true })).toMatch(/ya retiró/)
    expect(textoSinAvance('Listo para retirar', { retirado: false, enViaje: true })).toMatch(/viaje en preparación/)
    expect(textoSinAvance('En camino', { retirado: false, enViaje: false })).toMatch(/repartidor/)
    expect(textoSinAvance('Pendiente', { retirado: false, enViaje: false })).toBeNull()
  })
})
