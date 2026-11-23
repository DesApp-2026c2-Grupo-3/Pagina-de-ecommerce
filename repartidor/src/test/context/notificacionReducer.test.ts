import { describe, expect, test } from 'vitest'

import { notificacionReducer } from '../../context/notificaciones/notificacionReducer'
import { estadoCon, viajeAsignado } from '../fixturesNotificaciones'

const A = viajeAsignado(1, '2026-11-17T10:00:00.000Z')
const B = viajeAsignado(2, '2026-11-17T10:05:00.000Z')
const MARCA = '2026-11-17T10:10:00.000Z'

describe('notificacionReducer: lectura optimista (UX-04)', () => {
  test('marca al instante y descuenta', () => {
    const estado = notificacionReducer(estadoCon({ items: [B, A], noLeidas: 2 }), { type: 'LECTURA_OPTIMISTA', id: 1, marca: MARCA })

    expect(estado.items.find((n) => n.id === 1)).toMatchObject({ leida: true, leidaEn: MARCA })
    expect(estado.noLeidas).toBe(1)
  })

  test('si falla, se revierte', () => {
    let estado = notificacionReducer(estadoCon({ items: [B, A], noLeidas: 2 }), { type: 'LECTURA_OPTIMISTA', id: 1, marca: MARCA })
    estado = notificacionReducer(estado, { type: 'LECTURA_REVERTIR', id: 1, marca: MARCA })

    expect(estado.items.find((n) => n.id === 1)).toMatchObject({ leida: false, leidaEn: null })
    expect(estado.noLeidas).toBe(2)
  })

  test('no revierte una lectura que no es la suya (llegó otra del servidor)', () => {
    const leidaRemota = { ...A, leida: true, leidaEn: '2026-11-17T10:09:00.000Z' }
    const estado = notificacionReducer(estadoCon({ items: [leidaRemota], noLeidas: 0 }), { type: 'LECTURA_REVERTIR', id: 1, marca: MARCA })

    expect(estado.items[0].leida).toBe(true)
    expect(estado.noLeidas).toBe(0)
  })
})

describe('notificacionReducer: marcar todas', () => {
  test('inicio: marca todo al instante y queda "marcando"', () => {
    const estado = notificacionReducer(estadoCon({ items: [B, A], noLeidas: 2 }), { type: 'MARCAR_TODAS_INICIO', marca: MARCA })

    expect(estado.items.every((n) => n.leida)).toBe(true)
    expect(estado.noLeidas).toBe(0)
    expect(estado.marcandoTodas).toBe(true)
  })

  test('ok: deja de marcar', () => {
    let estado = notificacionReducer(estadoCon({ items: [B, A], noLeidas: 2 }), { type: 'MARCAR_TODAS_INICIO', marca: MARCA })
    estado = notificacionReducer(estado, { type: 'MARCAR_TODAS_OK', leidaEn: MARCA })

    expect(estado.marcandoTodas).toBe(false)
    expect(estado.respaldoMarcarTodas).toBeNull()
    expect(estado.noLeidas).toBe(0)
  })

  test('error: vuelve todo como estaba', () => {
    const yaLeida = viajeAsignado(3, '2026-11-17T09:00:00.000Z', true)
    let estado = notificacionReducer(estadoCon({ items: [B, A, yaLeida], noLeidas: 5 }), { type: 'MARCAR_TODAS_INICIO', marca: MARCA })
    estado = notificacionReducer(estado, { type: 'MARCAR_TODAS_ERROR' })

    expect(estado.items.map((n) => [n.id, n.leida])).toEqual([[2, false], [1, false], [3, true]])
    expect(estado.noLeidas).toBe(5)
    expect(estado.marcandoTodas).toBe(false)
  })

  test('un aviso que llega después de la marca no se marca', () => {
    const nueva = viajeAsignado(4, '2026-11-17T10:20:00.000Z')
    const estado = notificacionReducer(estadoCon({ items: [nueva, A], noLeidas: 2 }), { type: 'MARCAR_TODAS_INICIO', marca: MARCA })

    expect(estado.items.find((n) => n.id === 4)?.leida).toBe(false)
    expect(estado.noLeidas).toBe(1)
  })
})

describe('notificacionReducer: errores separados', () => {
  test('fallar al pedir anteriores no toca el error de la carga inicial', () => {
    let estado = notificacionReducer(estadoCon({ items: [A] }), { type: 'CARGA_MAS_INICIO' })
    estado = notificacionReducer(estado, { type: 'CARGA_MAS_ERROR', mensaje: 'Sin red' })

    expect(estado.errorCargaMas).toBe('Sin red')
    expect(estado.error).toBeNull()
    expect(estado.items).toHaveLength(1)

    estado = notificacionReducer(estado, { type: 'CARGA_MAS_INICIO' })
    expect(estado.errorCargaMas).toBeNull()
  })
})
