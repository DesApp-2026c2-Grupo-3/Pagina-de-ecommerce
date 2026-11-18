import { afterEach, describe, expect, test, vi } from 'vitest'

import { escucharRegresoAPrimerPlano } from '../../realtime/visibilidad'

function cambiarVisibilidad(estado: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { value: estado, configurable: true })
  document.dispatchEvent(new Event('visibilitychange'))
}

afterEach(() => {
  cambiarVisibilidad('visible')
})

describe('escucharRegresoAPrimerPlano', () => {
  test('avisa al volver a primer plano, no al irse', () => {
    const alVolver = vi.fn()
    const dejar = escucharRegresoAPrimerPlano(alVolver)

    cambiarVisibilidad('hidden')
    expect(alVolver).not.toHaveBeenCalled()

    cambiarVisibilidad('visible')
    expect(alVolver).toHaveBeenCalledTimes(1)

    dejar()
  })

  test('después de dejar de escuchar no avisa más', () => {
    const alVolver = vi.fn()
    const dejar = escucharRegresoAPrimerPlano(alVolver)

    dejar()
    cambiarVisibilidad('hidden')
    cambiarVisibilidad('visible')

    expect(alVolver).not.toHaveBeenCalled()
  })
})
