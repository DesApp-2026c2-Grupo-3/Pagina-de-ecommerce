import { describe, expect, it } from 'vitest'
import {
  PASOS_SEGUIMIENTO,
  esEstadoInterno,
  estaEnCurso,
  normalizarEstado,
  pasoActual,
} from '../../config/pedidoEstados'

describe('pedidoEstados (vista del cliente)', () => {
  it('la barra de seguimiento tiene los 4 pasos del cliente', () => {
    expect(PASOS_SEGUIMIENTO).toEqual(['Pendiente', 'En proceso', 'En camino', 'Entregado'])
  })

  it('"Listo para retirar" es interno: el cliente lo ve como "En proceso"', () => {
    expect(esEstadoInterno('Listo para retirar')).toBe(true)
    expect(normalizarEstado('Listo para retirar')).toBe('En proceso')
    expect(normalizarEstado('listo para retirar')).toBe('En proceso')
    expect(pasoActual('Listo para retirar')).toBe(1)
    expect(estaEnCurso('Listo para retirar')).toBe(true)
  })

  it('los estados del cliente no son internos', () => {
    for (const paso of PASOS_SEGUIMIENTO) expect(esEstadoInterno(paso)).toBe(false)
    expect(esEstadoInterno('constructor')).toBe(false)
  })
})
