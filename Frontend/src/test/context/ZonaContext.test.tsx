import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { act, render, waitFor } from '@testing-library/react'
import { ZonaProvider, useZona } from '../../context/ZonaContext'
import { RealtimeContext } from '../../context/realtime/RealtimeContext'
import {
  limpiarBusRealtime,
  publicarEventoRealtime,
  suscribirEventoRealtime,
} from '../../realtime/realtimeBus'
import { getSucursales } from '../../services/sucursalService'
import { estadoSucursal } from '../../utils/horario'
import { DIAS_SEMANA, type HorarioSemana, type Sucursal } from '../../types/sucursal'
import type { Zona } from '../../types/zona'

vi.mock('../../services/sucursalService', () => ({ getSucursales: vi.fn() }))
const obtener = vi.mocked(getSucursales)

const zonaGuardada: Zona = {
  calle: 'Rivadavia',
  numero: '1234',
  localidad: 'Morón',
  provincia: 'Buenos Aires',
  codigoPostal: '1708',
  latitud: -34.65,
  longitud: -58.62,
  sucursalId: 2,
  sucursalNombre: 'Morón',
  distanciaKm: 0.4,
  sucursalAbierta: true,
  sucursalZonaHoraria: 'America/Argentina/Buenos_Aires',
}

// Abierta todo el día, todos los días
const siempreAbierta = Object.fromEntries(
  DIAS_SEMANA.map((dia) => [dia, { abierto: true, turnos: [{ apertura: '00:00', cierre: '23:59' }] }]),
) as HorarioSemana

// Otra sucursal activa que NO llega a la dirección de la zona (está a más de 30 km)
const lejana = {
  id: 3,
  nombre: 'La Plata',
  latitud: -34.92,
  longitud: -57.95,
  radioEntregaKm: 5,
  horario: siempreAbierta,
  zona_horaria: 'America/Argentina/Buenos_Aires',
} as unknown as Sucursal

const moron = { ...lejana, id: 2, nombre: 'Morón', latitud: -34.65, longitud: -58.62 } as Sucursal
// Dos sucursales activas que SÍ llegan a la dirección de la zona: Haedo más cerca que Castelar
const haedo = { ...lejana, id: 4, nombre: 'Haedo', latitud: -34.645, longitud: -58.6 } as Sucursal
const castelar = { ...lejana, id: 5, nombre: 'Castelar', latitud: -34.66, longitud: -58.65 } as Sucursal

let actual: ReturnType<typeof useZona>
function Espia() {
  actual = useZona()
  return null
}

function renderizar() {
  render(
    <RealtimeContext.Provider
      value={{
        estado: { conexion: 'conectado', ultimaConexionEn: null, ultimoError: null },
        suscribir: suscribirEventoRealtime,
      }}
    >
      <ZonaProvider>
        <Espia />
      </ZonaProvider>
    </RealtimeContext.Provider>,
  )
}

let numeroEvento = 0
const refrescoSucursal = () =>
  act(() =>
    publicarEventoRealtime({
      tipo: 'cliente:refresco',
      refresco: { eventoId: `e-${++numeroEvento}`, dominio: 'sucursal', accion: 'estado_cambiado', sucursalId: 2, pedidoId: null },
    }),
  )

beforeEach(() => {
  localStorage.setItem('zona', JSON.stringify(zonaGuardada))
})

afterEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  limpiarBusRealtime()
})

describe('ZonaContext: sucursal desactivada (RN-04, RN-46, DC-12)', () => {
  test('pasa sola a la sucursal activa más cercana que llega a la misma dirección, y avisa', async () => {
    obtener.mockResolvedValue([castelar, lejana, haedo])
    renderizar()

    await waitFor(() => expect(actual.zona?.sucursalId).toBe(4))
    expect(actual.zona).toMatchObject({
      sucursalNombre: 'Haedo',
      sucursalAnterior: 'Morón',
      calle: 'Rivadavia',
      latitud: -34.65,
    })
    expect(actual.sucursalDesactivada).toBe(false)

    act(() => actual.descartarAvisoReemplazo())
    expect(actual.zona?.sucursalAnterior).toBeUndefined()
    expect(JSON.parse(localStorage.getItem('zona')!).sucursalAnterior).toBeUndefined()
  })

  test('si ninguna llega a la dirección, la zona se conserva desactivada y no pasa a una fuera de rango', async () => {
    obtener.mockResolvedValue([lejana])
    renderizar()

    await waitFor(() => expect(actual.sucursalCerrada).toBe(true))
    expect(actual.sucursalDesactivada).toBe(true)
    expect(actual.zona).toMatchObject({ sucursalId: 2, sucursalNombre: 'Morón', calle: 'Rivadavia' })
    // La otra sucursal no llega a la dirección: no se ofrece como opción
    expect(actual.opcionesSucursal).toEqual([])
  })

  test('si la desactivan con la página abierta, se cierra con el refresco', async () => {
    obtener.mockResolvedValueOnce([moron, lejana])
    renderizar()
    await waitFor(() => expect(obtener).toHaveBeenCalledTimes(1))

    obtener.mockResolvedValueOnce([lejana])
    refrescoSucursal()

    await waitFor(() => expect(actual.sucursalCerrada).toBe(true), { timeout: 2000 })
    expect(actual.zona?.sucursalId).toBe(2)
  })

  test('si la reactivan, vuelve a usarse según su horario sin recargar la página', async () => {
    obtener.mockResolvedValueOnce([lejana])
    renderizar()
    await waitFor(() => expect(actual.sucursalCerrada).toBe(true))

    obtener.mockResolvedValueOnce([moron, lejana])
    refrescoSucursal()

    const abierta = estadoSucursal(moron.horario, moron.zona_horaria).abierta
    await waitFor(() => expect(actual.zona?.sucursalAbierta).toBe(abierta), { timeout: 2000 })
    expect(abierta).toBe(true)
    expect(actual.sucursalDesactivada).toBe(false)
    expect(actual.zona?.sucursalId).toBe(2)
  })

  test('si falla una recarga, la zona no cambia', async () => {
    obtener.mockResolvedValueOnce([moron])
    renderizar()
    await waitFor(() => expect(obtener).toHaveBeenCalledTimes(1))
    const antes = actual.zona

    obtener.mockRejectedValueOnce(new Error('Sin conexión'))
    refrescoSucursal()
    await waitFor(() => expect(obtener).toHaveBeenCalledTimes(2), { timeout: 2000 })

    expect(actual.zona).toEqual(antes)
  })
})
