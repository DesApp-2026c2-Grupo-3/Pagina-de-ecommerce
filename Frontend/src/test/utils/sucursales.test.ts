import { describe, expect, test } from 'vitest'
import { buscarSucursalCercana, sucursalesEnRango, sucursalParaEntrega } from '../../utils/sucursales'
import type { Sucursal } from '../../types/sucursal'

// Solo importan la ubicación y el radio; el resto de los datos no se usa en estos cálculos
const sucursal = (id: number, latitud: number, longitud: number, radioEntregaKm = 10) =>
  ({ id, nombre: `Sucursal ${id}`, latitud, longitud, radioEntregaKm }) as unknown as Sucursal

const CLIENTE = { lat: -34.6, lng: -58.4 }

// Distancias aproximadas al cliente (0,01° de latitud ≈ 1,1 km)
const CENTRO = sucursal(1, -34.6, -58.4) // 0 km
const SUR = sucursal(2, -34.65, -58.4) // ≈ 5,6 km
const LEJOS = sucursal(3, -34.8, -58.4) // ≈ 22 km: fuera del radio de 10 km
const CHICA = sucursal(4, -34.62, -58.4, 1) // ≈ 2,2 km, pero su radio es de 1 km

describe('buscarSucursalCercana', () => {
  test('devuelve la más cercana, aunque vengan desordenadas', () => {
    const r = buscarSucursalCercana(CLIENTE, [SUR, LEJOS, CENTRO])

    expect(r?.sucursal.id).toBe(1)
    expect(r?.distancia).toBeCloseTo(0)
    expect(r?.dentroDeZona).toBe(true)
  })

  test('informa si la más cercana no llega a la dirección', () => {
    const r = buscarSucursalCercana(CLIENTE, [LEJOS])

    expect(r?.sucursal.id).toBe(3)
    expect(r?.distancia).toBeGreaterThan(20)
    expect(r?.dentroDeZona).toBe(false)
  })

  test('sin ubicación o sin sucursales no hay resultado', () => {
    expect(buscarSucursalCercana(null, [CENTRO])).toBeNull()
    expect(buscarSucursalCercana(CLIENTE, [])).toBeNull()
  })
})

describe('sucursalesEnRango (RN-01: el cliente elige si hay más de una)', () => {
  test('devuelve solo las que llegan, de la más cercana a la más lejana', () => {
    const ids = sucursalesEnRango(CLIENTE, [LEJOS, SUR, CHICA, CENTRO]).map((o) => o.sucursal.id)

    expect(ids).toEqual([1, 2])
  })

  test('respeta el radio de cada sucursal', () => {
    const ids = sucursalesEnRango(CLIENTE, [CHICA]).map((o) => o.sucursal.id)

    expect(ids).toEqual([])
  })

  test('sin ubicación no hay sucursales en rango', () => {
    expect(sucursalesEnRango(null, [CENTRO, SUR])).toEqual([])
  })
})

describe('sucursalParaEntrega', () => {
  test('usa la sucursal que eligió el cliente si le llega', () => {
    expect(sucursalParaEntrega(CLIENTE, [CENTRO, SUR], 2)?.sucursal.id).toBe(2)
  })

  test('si la elegida no le llega, usa la más cercana', () => {
    expect(sucursalParaEntrega(CLIENTE, [CENTRO, SUR, LEJOS], 3)?.sucursal.id).toBe(1)
  })

  test('sin una sucursal elegida, usa la más cercana', () => {
    expect(sucursalParaEntrega(CLIENTE, [SUR, CENTRO])?.sucursal.id).toBe(1)
  })

  test('si ninguna llega, devuelve la más cercana marcada fuera de zona', () => {
    const r = sucursalParaEntrega({ lat: -35.5, lng: -58.4 }, [CENTRO, SUR])

    expect(r?.sucursal.id).toBe(2)
    expect(r?.dentroDeZona).toBe(false)
  })
})