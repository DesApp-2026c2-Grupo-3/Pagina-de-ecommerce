import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { act, render, waitFor } from '@testing-library/react'
import { NotificacionProvider } from '../../context/notificaciones/NotificacionProvider'
import {
  useAccionesNotificaciones,
  useNotificaciones,
} from '../../context/notificaciones/NotificacionContext'
import { RealtimeContext } from '../../context/realtime/RealtimeContext'
import {
  limpiarBusRealtime,
  publicarEventoRealtime,
  suscribirEventoRealtime,
} from '../../realtime/realtimeBus'
import {
  contarNotificacionesNoLeidasCliente,
  listarNotificacionesCliente,
} from '../../services/notificacionService'
import type {
  AccionesNotificacionesCliente,
  EstadoNotificacionesCliente,
  NotificacionCliente,
} from '../../types/notificacion.types'

vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ token: 'token-1' }) }))

vi.mock('../../services/notificacionService', () => ({
  LIMITE_INICIAL: 8,
  LIMITE_VER_MAS: 5,
  listarNotificacionesCliente: vi.fn(),
  contarNotificacionesNoLeidasCliente: vi.fn(),
  marcarNotificacionLeidaCliente: vi.fn(),
  marcarTodasNotificacionesLeidasCliente: vi.fn(),
}))

const listar = vi.mocked(listarNotificacionesCliente)
const contar = vi.mocked(contarNotificacionesNoLeidasCliente)

const aviso = (id: number): NotificacionCliente => ({
  id,
  version: 1,
  tipo: 'pedido.creado',
  ocurridoEn: `2026-01-0${id}T10:00:00.000Z`,
  leida: false,
  leidaEn: null,
  datos: {
    pedidoId: id,
    usuarioId: 7,
    sucursalId: 2,
    estadoAnterior: null,
    estado: 'Pendiente',
    total: 5000,
    fecha: `2026-01-0${id}T10:00:00.000Z`,
  },
})

// Guarda lo que ve un consumidor en cada render
const vistos: { estado: EstadoNotificacionesCliente; acciones: AccionesNotificacionesCliente }[] = []

function Consumidor() {
  vistos.push({ estado: useNotificaciones(), acciones: useAccionesNotificaciones() })
  return null
}

const ultimo = () => vistos[vistos.length - 1]

function renderizar() {
  render(
    <RealtimeContext.Provider
      value={{
        estado: { conexion: 'conectado', ultimaConexionEn: null, ultimoError: null },
        suscribir: suscribirEventoRealtime,
      }}
    >
      <NotificacionProvider>
        <Consumidor />
      </NotificacionProvider>
    </RealtimeContext.Provider>,
  )
}

beforeEach(() => {
  vistos.length = 0
  contar.mockResolvedValue(1)
})

afterEach(() => {
  vi.clearAllMocks()
  limpiarBusRealtime()
})

describe('NotificacionProvider', () => {
  test('las acciones no cambian aunque cambie el estado (plan, E-6)', async () => {
    listar.mockResolvedValue({ items: [aviso(1)], siguienteCursor: null })
    renderizar()

    await waitFor(() => expect(ultimo().estado.items).toHaveLength(1))
    const primeras = vistos[0].acciones

    act(() => {
      publicarEventoRealtime({
        tipo: 'notificacion',
        payload: { ...aviso(2), datos: { ...aviso(2).datos } },
      })
    })

    expect(ultimo().estado.items).toHaveLength(2)
    expect(ultimo().estado.noLeidas).toBe(2)
    expect(vistos.every((visto) => visto.acciones === primeras)).toBe(true)
  })

  test('si falla la carga inicial, «Reintentar» repite la carga inicial (plan, B-6)', async () => {
    listar.mockRejectedValueOnce(new Error('Sin conexión'))
    renderizar()

    await waitFor(() =>
      expect(ultimo().estado.errorCarga).toEqual({ origen: 'inicial', mensaje: 'Sin conexión' }),
    )

    listar.mockResolvedValueOnce({ items: [aviso(1)], siguienteCursor: null })
    act(() => ultimo().acciones.reintentar())

    await waitFor(() => expect(ultimo().estado.items).toHaveLength(1))
    expect(listar).toHaveBeenLastCalledWith({ limite: 8 })
    expect(ultimo().estado.errorCarga).toBeNull()
  })

  test('si falla la página siguiente, «Reintentar» pide esa misma página', async () => {
    listar.mockResolvedValueOnce({ items: [aviso(2)], siguienteCursor: 'cursor-1' })
    renderizar()
    await waitFor(() => expect(ultimo().estado.siguienteCursor).toBe('cursor-1'))

    listar.mockRejectedValueOnce(new Error('Se cortó'))
    act(() => ultimo().acciones.cargarMas())
    await waitFor(() =>
      expect(ultimo().estado.errorCarga).toEqual({ origen: 'mas', mensaje: 'Se cortó' }),
    )

    listar.mockResolvedValueOnce({ items: [aviso(1)], siguienteCursor: null })
    act(() => ultimo().acciones.reintentar())

    await waitFor(() => expect(ultimo().estado.items).toHaveLength(2))
    expect(listar).toHaveBeenLastCalledWith({ limite: 5, antesDe: 'cursor-1' })
  })

  test('al volver a la pestaña revalida la primera página y el contador (C-6)', async () => {
    listar.mockResolvedValue({ items: [aviso(1)], siguienteCursor: null })
    renderizar()
    await waitFor(() => expect(ultimo().estado.items).toHaveLength(1))

    listar.mockResolvedValue({ items: [aviso(2), aviso(1)], siguienteCursor: null })
    contar.mockResolvedValue(2)
    act(() => {
      publicarEventoRealtime({ tipo: 'visible' })
      publicarEventoRealtime({ tipo: 'reconexion' })
    })

    await waitFor(() => expect(ultimo().estado.items).toHaveLength(2))
    expect(ultimo().estado.noLeidas).toBe(2)
    // Los dos eventos juntos revalidan una sola vez
    expect(listar).toHaveBeenCalledTimes(2)
  })
})
