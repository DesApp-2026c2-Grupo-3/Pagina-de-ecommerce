import { describe, expect, test } from 'vitest'
import {
  estadoInicial,
  notificacionReducer,
} from '../../context/notificaciones/notificacionReducer'
import type {
  EstadoNotificacionesCliente,
  NotificacionCliente,
} from '../../types/notificacion.types'

function pedido(
  id: number,
  ocurridoEn: string,
  leida = false,
): NotificacionCliente {
  return {
    id,
    tipo: 'pedido.creado',
    version: 1,
    ocurridoEn,
    leida,
    leidaEn: leida ? ocurridoEn : null,
    datos: {
      pedidoId: id,
      usuarioId: 7,
      sucursalId: 2,
      estadoAnterior: null,
      estado: 'pendiente',
      total: 5000,
      fecha: ocurridoEn,
    },
  }
}

function conItems(
  items: NotificacionCliente[],
  noLeidas: number | null,
): EstadoNotificacionesCliente {
  return {
    ...estadoInicial,
    items,
    noLeidas,
    cargandoInicial: false,
    siguienteCursor: 'cursor',
  }
}

describe('notificacionReducer', () => {
  test('ordena la carga inicial y actualiza contador y cursor', () => {
    const anterior = pedido(1, '2026-01-01T10:00:00.000Z')
    const nuevo = pedido(2, '2026-01-02T10:00:00.000Z')

    const estado = notificacionReducer(estadoInicial, {
      type: 'CARGA_INICIAL_OK',
      items: [anterior, nuevo],
      siguienteCursor: 'siguiente',
      noLeidas: 2,
    })

    expect(estado.items.map((item) => item.id)).toEqual([2, 1])
    expect(estado.noLeidas).toBe(2)
    expect(estado.siguienteCursor).toBe('siguiente')
    expect(estado.cargandoInicial).toBe(false)
  })

  test('deduplica notificaciones y solo incrementa si es nueva', () => {
    const existente = pedido(1, '2026-01-01T10:00:00.000Z')
    const estado = conItems([existente], 1)

    const duplicada = notificacionReducer(estado, {
      type: 'NUEVA_NOTIFICACION',
      notificacion: existente,
    })
    expect(duplicada.items).toHaveLength(1)
    expect(duplicada.noLeidas).toBe(1)

    const nueva = pedido(2, '2026-01-02T10:00:00.000Z')
    const conNueva = notificacionReducer(duplicada, {
      type: 'NUEVA_NOTIFICACION',
      notificacion: nueva,
    })
    expect(conNueva.items).toHaveLength(2)
    expect(conNueva.noLeidas).toBe(2)
  })

  test('marca leída de forma optimista y revierte solo la misma marca', () => {
    const item = pedido(1, '2026-01-01T10:00:00.000Z')
    const estado = conItems([item], 1)
    const marca = '2026-01-03T10:00:00.000Z'

    const leida = notificacionReducer(estado, {
      type: 'LECTURA_LOCAL_OPTIMISTA',
      id: item.id,
      marca,
    })
    expect(leida.items[0].leida).toBe(true)
    expect(leida.items[0].leidaEn).toBe(marca)
    expect(leida.noLeidas).toBe(0)

    const revertida = notificacionReducer(leida, {
      type: 'LECTURA_LOCAL_REVERTIR',
      id: item.id,
      marca,
      mensaje: 'Falló',
    })
    expect(revertida.items[0].leida).toBe(false)
    expect(revertida.noLeidas).toBe(1)
    expect(revertida.errorAccion).toBe('Falló')
    expect(revertida.errorCarga).toBeNull()

    // Con otra marca (ya la leyó el servidor) no se revierte, pero el error se informa igual
    const sinRevertir = notificacionReducer(leida, {
      type: 'LECTURA_LOCAL_REVERTIR',
      id: item.id,
      marca: '2026-01-04T10:00:00.000Z',
      mensaje: 'Falló',
    })
    expect(sinRevertir.items).toBe(leida.items)
    expect(sinRevertir.errorAccion).toBe('Falló')
  })

  test('aplica lectura remota individual y masiva', () => {
    const uno = pedido(1, '2026-01-01T10:00:00.000Z')
    const dos = pedido(2, '2026-01-02T10:00:00.000Z')
    const estado = conItems([uno, dos], 2)

    const individual = notificacionReducer(estado, {
      type: 'LECTURA_REMOTA',
      evento: {
        notificacionId: 1,
        leidaEn: '2026-01-03T10:00:00.000Z',
      },
    })
    expect(individual.noLeidas).toBe(1)
    expect(individual.items.find((item) => item.id === 1)?.leida).toBe(true)

    const todas = notificacionReducer(individual, {
      type: 'LECTURA_REMOTA',
      evento: {
        todas: true,
        leidaEn: '2026-01-04T10:00:00.000Z',
      },
    })
    expect(todas.noLeidas).toBe(0)
    expect(todas.items.every((item) => item.leida)).toBe(true)
  })

  test('marcar todas usa el leidaEn del servidor: lo que llegó después sigue sin leer (plan, E-3)', () => {
    const anterior = pedido(1, '2026-01-01T10:00:00.000Z')
    const posterior = pedido(2, '2026-01-05T10:00:00.000Z')
    const estado = conItems([posterior, anterior], 2)

    const inicio = notificacionReducer(estado, { type: 'MARCAR_TODAS_INICIO' })
    expect(inicio.marcandoTodas).toBe(true)

    const fin = notificacionReducer(inicio, {
      type: 'MARCAR_TODAS_OK',
      leidaEn: '2026-01-03T10:00:00.000Z',
    })

    expect(fin.items.find((item) => item.id === 1)).toMatchObject({
      leida: true,
      leidaEn: '2026-01-03T10:00:00.000Z',
    })
    expect(fin.items.find((item) => item.id === 2)?.leida).toBe(false)
    expect(fin.noLeidas).toBe(1)
    expect(fin.marcandoTodas).toBe(false)
  })

  test('cada carga que falla recuerda su origen; empezar otra lo limpia (plan, B-6)', () => {
    const estado = conItems([pedido(1, '2026-01-01T10:00:00.000Z')], 1)

    const falloInicial = notificacionReducer(estado, { type: 'CARGA_INICIAL_ERROR', mensaje: 'A' })
    expect(falloInicial.errorCarga).toEqual({ origen: 'inicial', mensaje: 'A' })

    const falloMas = notificacionReducer(estado, { type: 'CARGA_MAS_ERROR', mensaje: 'B' })
    expect(falloMas.errorCarga).toEqual({ origen: 'mas', mensaje: 'B' })

    expect(notificacionReducer(falloMas, { type: 'CARGA_MAS_INICIO' }).errorCarga).toBeNull()
  })

  test('el error de marcar todas va a errorAccion y no toca la carga', () => {
    const estado = conItems([pedido(1, '2026-01-01T10:00:00.000Z')], 1)
    const fallo = notificacionReducer(
      notificacionReducer(estado, { type: 'MARCAR_TODAS_INICIO' }),
      { type: 'MARCAR_TODAS_ERROR', mensaje: 'Sin conexión' },
    )

    expect(fallo.errorAccion).toBe('Sin conexión')
    expect(fallo.errorCarga).toBeNull()
    expect(fallo.marcandoTodas).toBe(false)
  })

  test('reinicia todo el estado al cerrar sesión', () => {
    const estado = conItems([pedido(1, '2026-01-01T10:00:00.000Z')], 1)
    const reiniciado = notificacionReducer(estado, { type: 'REINICIAR' })

    expect(reiniciado.items).toEqual([])
    expect(reiniciado.noLeidas).toBeNull()
    expect(reiniciado.siguienteCursor).toBeNull()
    expect(reiniciado.cargandoInicial).toBe(false)
  })
})
