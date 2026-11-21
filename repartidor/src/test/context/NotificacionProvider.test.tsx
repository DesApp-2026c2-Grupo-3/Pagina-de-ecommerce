import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useAccionesNotificaciones, useNotificaciones } from '../../context/notificaciones/NotificacionContext'
import { viajeAsignado } from '../fixturesNotificaciones'

import { NotificacionProvider } from '../../context/notificaciones/NotificacionProvider'
import { ToastProvider } from '../../context/toasts/ToastProvider'
import ContenedorToasts from '../../components/toasts/ContenedorToasts'
import { AuthContext, type AuthContextType } from '../../context/AuthContext'
import { crearRealtimeDePrueba } from '../apoyoRealtime'
import {
  contarNotificacionesNoLeidas,
  listarNotificaciones,
  marcarNotificacionLeida,
  marcarTodasNotificacionesLeidas,
} from '../../services/notificacionService'

vi.mock('../../services/notificacionService', () => ({
  listarNotificaciones: vi.fn(),
  contarNotificacionesNoLeidas: vi.fn(),
  marcarNotificacionLeida: vi.fn(),
  marcarTodasNotificacionesLeidas: vi.fn(),
}))

const AUTH: AuthContextType = {
  repartidor: { id: 7, nombre: 'Ana', apellido: 'Pereyra', email: 'ana@x.com', sucursalId: 2 },
  token: 'token',
  cargando: false,
  motivoCierre: null,
  iniciarSesion: async () => {},
  cerrarSesion: () => {},
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.mocked(listarNotificaciones).mockResolvedValue({ items: [], siguienteCursor: null })
  vi.mocked(contarNotificacionesNoLeidas).mockResolvedValue(0)
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

// Muestra el contador y expone las acciones como botones
function Consumidor() {
  const { noLeidas } = useNotificaciones()
  const { marcarLeida, marcarTodas } = useAccionesNotificaciones()
  return (
    <>
      <p>sin leer: {noLeidas ?? '-'}</p>
      <button type="button" onClick={() => marcarLeida(1)}>leer 1</button>
      <button type="button" onClick={marcarTodas}>leer todas</button>
    </>
  )
}

function montar() {
  const { Proveedor, emitir } = crearRealtimeDePrueba()
  render(
    <AuthContext.Provider value={AUTH}>
      <Proveedor>
        <ToastProvider>
          <NotificacionProvider>
            <Consumidor />
          </NotificacionProvider>
          <ContenedorToasts />
        </ToastProvider>
      </Proveedor>
    </AuthContext.Provider>,
  )
  return { emitir }
}

describe('NotificacionProvider: recarga al volver (W-1)', () => {
  test('carga al iniciar', async () => {
    montar()
    await act(async () => {})

    expect(listarNotificaciones).toHaveBeenCalledTimes(1)
    expect(contarNotificacionesNoLeidas).toHaveBeenCalledTimes(1)
  })

  test('al volver a primer plano recarga lista y contador', async () => {
    const { emitir } = montar()
    await act(async () => {})

    act(() => emitir({ tipo: 'visible' }))
    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    expect(listarNotificaciones).toHaveBeenCalledTimes(2)
    expect(contarNotificacionesNoLeidas).toHaveBeenCalledTimes(2)
  })

  test('"visible" y "reconexion" juntos: una sola recarga', async () => {
    const { emitir } = montar()
    await act(async () => {})

    act(() => {
      emitir({ tipo: 'visible' })
      emitir({ tipo: 'reconexion' })
    })
    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    expect(listarNotificaciones).toHaveBeenCalledTimes(2)
  })
})

describe('NotificacionProvider: lecturas optimistas (UX-04)', () => {
  beforeEach(() => {
    vi.useRealTimers()
    vi.mocked(listarNotificaciones).mockResolvedValue({ items: [viajeAsignado(1, '2026-11-17T10:00:00.000Z')], siguienteCursor: null })
    vi.mocked(contarNotificacionesNoLeidas).mockResolvedValue(1)
  })

  test('marcar leída baja el contador al instante; si el servidor falla, vuelve y avisa', async () => {
    let fallar: (error: Error) => void = () => {}
    vi.mocked(marcarNotificacionLeida).mockReturnValue(new Promise((_, rechazar) => { fallar = rechazar }))
    montar()
    expect(await screen.findByText('sin leer: 1')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'leer 1' }))
    expect(screen.getByText('sin leer: 0')).toBeInTheDocument()

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    await act(async () => fallar(new Error('red')))
    expect(screen.getByText('sin leer: 1')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo marcar el aviso como leído')
  })

  test('marcar todas: si el servidor falla, vuelve el contador y aparece un solo toast', async () => {
    vi.mocked(marcarTodasNotificacionesLeidas).mockRejectedValue(new Error('red'))
    montar()
    expect(await screen.findByText('sin leer: 1')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'leer todas' }))
    expect(await screen.findByText('sin leer: 1')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'leer todas' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudieron marcar los avisos como leídos')
    // El mismo error dos veces no apila dos toasts
    expect(screen.getAllByRole('alert')).toHaveLength(1)
  })

  test('marcar todas: al instante, y una sola llamada aunque se toque dos veces', async () => {
    vi.mocked(marcarTodasNotificacionesLeidas).mockReturnValue(new Promise(() => {}))
    montar()
    expect(await screen.findByText('sin leer: 1')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'leer todas' }))
    await userEvent.click(screen.getByRole('button', { name: 'leer todas' }))

    expect(screen.getByText('sin leer: 0')).toBeInTheDocument()
    expect(marcarTodasNotificacionesLeidas).toHaveBeenCalledTimes(1)
  })
})
