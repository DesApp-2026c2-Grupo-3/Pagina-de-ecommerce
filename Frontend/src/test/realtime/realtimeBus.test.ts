import { afterEach, describe, expect, test, vi } from 'vitest'
import {
  limpiarBusRealtime,
  publicarEventoRealtime,
  suscribirEventoRealtime,
} from '../../realtime/realtimeBus'

afterEach(() => {
  limpiarBusRealtime()
  vi.restoreAllMocks()
})

describe('realtimeBus', () => {
  test('un suscriptor que falla no bloquea a los siguientes', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const recibidos: number[] = []

    suscribirEventoRealtime(() => {
      throw new Error('fallo aislado')
    })
    suscribirEventoRealtime((evento) => {
      if (evento.tipo === 'reconexion') recibidos.push(1)
    })

    publicarEventoRealtime({ tipo: 'reconexion' })

    expect(recibidos).toEqual([1])
    expect(error).toHaveBeenCalledTimes(1)
  })

  test('el cleanup deja de recibir eventos', () => {
    const recibidos: number[] = []
    const desuscribir = suscribirEventoRealtime((evento) => {
      if (evento.tipo === 'reconexion') recibidos.push(1)
    })

    desuscribir()
    publicarEventoRealtime({ tipo: 'reconexion' })

    expect(recibidos).toEqual([])
  })
})
