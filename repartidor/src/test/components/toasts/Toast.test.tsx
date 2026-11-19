import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { Truck } from 'lucide-react'

import Toast from '../../../components/toasts/Toast'
import { DURACION_MS, DURACION_SALIDA_MS } from '../../../components/toasts/tiempos'
import type { DatosToast } from '../../../types/toast.types'

const BASE: DatosToast = {
  id: 'notificacion-12',
  tono: 'marca',
  icono: Truck,
  titulo: 'Te asignaron el viaje #87',
  descripcion: 'Tiene 3 pedidos.',
  prioridad: 'alta',
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

function dibujar(cambios: Partial<DatosToast> = {}) {
  const onCerrar = vi.fn()
  render(<Toast toast={{ ...BASE, ...cambios }} onCerrar={onCerrar} />)
  return { onCerrar }
}

const avanzar = (ms: number) => act(() => vi.advanceTimersByTime(ms))

// Al cumplirse el tiempo empieza el fundido: React agenda ese temporizador recién al volver
// a dibujar, así que se avanza en dos tramos (primero vence, después termina el fundido)
function vencerYSalir() {
  avanzar(1)
  avanzar(DURACION_SALIDA_MS)
}

describe('Toast', () => {
  test('prioridad alta: se anuncia como alerta, con título y descripción', () => {
    dibujar()

    const alerta = screen.getByRole('alert')
    expect(alerta).toHaveTextContent('Te asignaron el viaje #87')
    expect(alerta).toHaveTextContent('Tiene 3 pedidos.')
    // Los botones no forman parte del anuncio
    expect(alerta).not.toHaveTextContent('Cerrar')
  })

  test('prioridad normal: se anuncia como estado', () => {
    dibujar({ prioridad: 'normal' })

    expect(screen.getByRole('status')).toHaveTextContent('Te asignaron el viaje #87')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  test('la acción hace lo suyo y cierra el toast enseguida', () => {
    const alTocar = vi.fn()
    const { onCerrar } = dibujar({ accion: { texto: 'Ver viaje', alTocar } })

    fireEvent.click(screen.getByRole('button', { name: 'Ver viaje' }))

    expect(alTocar).toHaveBeenCalledTimes(1)
    expect(onCerrar).toHaveBeenCalledWith('notificacion-12')
  })

  test('sin acción no hay botón de acción, solo el de cerrar', () => {
    dibujar()

    expect(screen.getAllByRole('button')).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Cerrar aviso' })).toBeInTheDocument()
  })

  test('la X cierra después del fundido de salida', () => {
    const { onCerrar } = dibujar()

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar aviso' }))
    expect(onCerrar).not.toHaveBeenCalled()

    avanzar(DURACION_SALIDA_MS)
    expect(onCerrar).toHaveBeenCalledWith('notificacion-12')
  })

  test.each([
    ['alta', DURACION_MS.alta],
    ['normal', DURACION_MS.normal],
  ] as const)('prioridad %s: se cierra sola a los %i ms', (prioridad, duracion) => {
    const { onCerrar } = dibujar({ prioridad })

    avanzar(duracion - 1)
    expect(onCerrar).not.toHaveBeenCalled()

    vencerYSalir()
    expect(onCerrar).toHaveBeenCalledTimes(1)
  })

  test('con el dedo o el mouse encima se pausa y después sigue con el tiempo que le quedaba', () => {
    const { onCerrar } = dibujar()
    // React arma "enter/leave" desde pointerover/pointerout, que suben desde cualquier hijo
    const tarjeta = screen.getByRole('alert')

    avanzar(5000)
    fireEvent.pointerEnter(tarjeta)
    avanzar(20_000)
    expect(onCerrar).not.toHaveBeenCalled()

    fireEvent.pointerLeave(tarjeta)
    avanzar(DURACION_MS.alta - 5000 - 1)
    expect(onCerrar).not.toHaveBeenCalled()

    vencerYSalir()
    expect(onCerrar).toHaveBeenCalledTimes(1)
  })

  test('con el foco adentro también se pausa', () => {
    const { onCerrar } = dibujar()

    act(() => screen.getByRole('button', { name: 'Cerrar aviso' }).focus())
    avanzar(20_000)
    expect(onCerrar).not.toHaveBeenCalled()

    act(() => screen.getByRole('button', { name: 'Cerrar aviso' }).blur())
    avanzar(DURACION_MS.alta - 1)
    expect(onCerrar).not.toHaveBeenCalled()

    vencerYSalir()
    expect(onCerrar).toHaveBeenCalledTimes(1)
  })
})

describe('Toast en segundo plano (UX-6)', () => {
  const ponerVisibilidad = (estado: 'visible' | 'hidden') => {
    Object.defineProperty(document, 'visibilityState', { value: estado, configurable: true })
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
  }

  afterEach(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
  })

  test('con la app en segundo plano el tiempo no corre: al volver sigue con lo que le quedaba', () => {
    const { onCerrar } = dibujar()

    avanzar(3000)
    ponerVisibilidad('hidden')
    avanzar(60_000)
    expect(onCerrar).not.toHaveBeenCalled()

    ponerVisibilidad('visible')
    avanzar(DURACION_MS.alta - 3000 - 1)
    expect(onCerrar).not.toHaveBeenCalled()

    vencerYSalir()
    expect(onCerrar).toHaveBeenCalledTimes(1)
  })

  test('si llega con la app en segundo plano, empieza a contar recién al volver', () => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
    const { onCerrar } = dibujar()

    avanzar(60_000)
    expect(onCerrar).not.toHaveBeenCalled()

    ponerVisibilidad('visible')
    avanzar(DURACION_MS.alta - 1)
    expect(onCerrar).not.toHaveBeenCalled()

    vencerYSalir()
    expect(onCerrar).toHaveBeenCalledTimes(1)
  })
})
