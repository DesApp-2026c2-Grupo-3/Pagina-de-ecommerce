import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

import { useViajeActivo } from '../../hooks/useViajeActivo'
import {
  confirmarRecepcion,
  iniciarViaje,
  obtenerViajeActivo,
  quitarPedidoDelViaje,
  solicitarAyuda,
} from '../../services/viajeService'
import { entregarPedido, retirarPedido } from '../../services/pedidoService'
import { obtenerUbicacionActual } from '../../utils/geolocalizacion'
import { useRefrescoRepartidor } from '../../hooks/useRefrescoRepartidor'
import type { ViajeActivo } from '../../types/viaje.types'

vi.mock('../../services/viajeService', () => ({
  obtenerViajeActivo: vi.fn(),
  iniciarViaje: vi.fn(),
  confirmarRecepcion: vi.fn(),
  quitarPedidoDelViaje: vi.fn(),
  solicitarAyuda: vi.fn(),
}))
vi.mock('../../services/pedidoService', () => ({ retirarPedido: vi.fn(), entregarPedido: vi.fn() }))
vi.mock('../../utils/geolocalizacion', () => ({ obtenerUbicacionActual: vi.fn() }))
// El refresco en vivo se prueba aparte: acá solo guardamos el callback para dispararlo a mano
vi.mock('../../hooks/useRefrescoRepartidor', () => ({ useRefrescoRepartidor: vi.fn() }))

const VIAJE: ViajeActivo = {
  id: 50,
  repartidorId: 7,
  fechaInicio: null,
  fechaFin: null,
  estado: 'preparando',
  motivoAsistencia: null,
  comentarioAsistencia: null,
  fechaSolicitudAsistencia: null,
  latitudAsistencia: null,
  longitudAsistencia: null,
  recepcionConfirmada: true,
  Pedidos: [],
}

// Monta el hook y espera la primera carga
async function montar() {
  const hook = renderHook(() => useViajeActivo())
  await waitFor(() => expect(hook.result.current.cargando).toBe(false))
  return hook
}

beforeEach(() => {
  vi.mocked(obtenerViajeActivo).mockResolvedValue(VIAJE)
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('carga del viaje', () => {
  test('arranca cargando y después trae el viaje en curso', async () => {
    const { result } = renderHook(() => useViajeActivo())

    expect(result.current.cargando).toBe(true)
    await waitFor(() => expect(result.current.cargando).toBe(false))
    expect(result.current.viaje).toEqual(VIAJE)
    expect(result.current.error).toBe('')
  })

  test('sin viaje en curso, el viaje queda en null', async () => {
    vi.mocked(obtenerViajeActivo).mockResolvedValue(null)

    const { result } = await montar()

    expect(result.current.viaje).toBeNull()
  })

  test('si falla, deja el mensaje de error', async () => {
    vi.mocked(obtenerViajeActivo).mockRejectedValue(new Error('red'))

    const { result } = await montar()

    expect(result.current.error).toBe('No se pudo obtener la información del viaje.')
  })

  test('al recargar bien después de un error, el error se borra', async () => {
    vi.mocked(obtenerViajeActivo).mockRejectedValueOnce(new Error('red'))
    const { result } = await montar()

    act(() => result.current.recargar())

    await waitFor(() => expect(result.current.error).toBe(''))
    expect(result.current.viaje).toEqual(VIAJE)
  })

  test('"Actualizar" muestra la carga mientras pide el viaje', async () => {
    const { result } = await montar()

    act(() => result.current.recargar())

    expect(result.current.cargando).toBe(true)
    await waitFor(() => expect(result.current.cargando).toBe(false))
    expect(obtenerViajeActivo).toHaveBeenCalledTimes(2)
  })

  test('se recarga solo cuando llega un refresco del viaje (reasignación o cancelación)', async () => {
    await montar()
    const [dominio, alRefrescar] = vi.mocked(useRefrescoRepartidor).mock.calls.at(-1)!

    expect(dominio).toBe('viaje')
    await act(async () => alRefrescar())

    expect(obtenerViajeActivo).toHaveBeenCalledTimes(2)
  })
})

describe('acciones sobre el viaje', () => {
  test.each([
    ['retirar', retirarPedido],
    ['entregar', entregarPedido],
    ['quitar', quitarPedidoDelViaje],
  ] as const)('%s llama al servidor con el pedido y vuelve a cargar el viaje', async (accion, servicio) => {
    vi.mocked(servicio).mockResolvedValue({} as never)
    const { result } = await montar()

    await act(() => result.current[accion](15))

    expect(servicio).toHaveBeenCalledWith(15)
    expect(obtenerViajeActivo).toHaveBeenCalledTimes(2)
  })

  test.each([
    ['iniciar', iniciarViaje],
    ['confirmarRecepcion', confirmarRecepcion],
  ] as const)('%s llama al servidor y vuelve a cargar el viaje', async (accion, servicio) => {
    vi.mocked(servicio).mockResolvedValue({} as never)
    const { result } = await montar()

    await act(() => result.current[accion]())

    expect(servicio).toHaveBeenCalled()
    expect(obtenerViajeActivo).toHaveBeenCalledTimes(2)
  })

  test('si la acción falla, rechaza con el error y no recarga', async () => {
    vi.mocked(iniciarViaje).mockRejectedValue(new Error('Faltan pedidos por retirar'))
    const { result } = await montar()

    await expect(act(() => result.current.iniciar())).rejects.toThrow('Faltan pedidos por retirar')
    expect(obtenerViajeActivo).toHaveBeenCalledTimes(1)
  })

  test('pedir ayuda envía el motivo, el comentario y la ubicación actual (RN-32)', async () => {
    vi.mocked(obtenerUbicacionActual).mockResolvedValue({ latitud: -34.6, longitud: -58.4 })
    vi.mocked(solicitarAyuda).mockResolvedValue({} as never)
    const { result } = await montar()

    await act(() => result.current.pedirAyuda({ motivo: 'Accidente', comentario: 'Choqué en la esquina' }))

    expect(solicitarAyuda).toHaveBeenCalledWith({
      motivo: 'Accidente',
      comentario: 'Choqué en la esquina',
      latitud: -34.6,
      longitud: -58.4,
    })
    expect(obtenerViajeActivo).toHaveBeenCalledTimes(2)
  })

  test('si no se puede obtener la ubicación, no pide ayuda y avisa el motivo', async () => {
    vi.mocked(obtenerUbicacionActual).mockRejectedValue(
      new Error('Debés permitir el acceso a tu ubicación para solicitar asistencia.'),
    )
    const { result } = await montar()

    await expect(act(() => result.current.pedirAyuda({ motivo: 'Accidente', comentario: '' }))).rejects.toThrow(
      'Debés permitir el acceso a tu ubicación',
    )
    expect(solicitarAyuda).not.toHaveBeenCalled()
  })
})