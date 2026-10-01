import { describe, expect, test } from 'vitest'
import { distanciaKm } from '../../utils/distancia'

describe('distanciaKm', () => {
  test('entre un punto y sí mismo es 0', () => {
    const obelisco = { lat: -34.6037, lng: -58.3816 }
    expect(distanciaKm(obelisco, obelisco)).toBe(0)
  })

  test('un grado de latitud mide unos 111 km', () => {
    expect(distanciaKm({ lat: 0, lng: 0 }, { lat: 1, lng: 0 })).toBeCloseTo(111.19, 1)
  })

  test('da lo mismo en los dos sentidos', () => {
    const a = { lat: -34.6037, lng: -58.3816 }
    const b = { lat: -34.9214, lng: -57.9544 }
    expect(distanciaKm(a, b)).toBeCloseTo(distanciaKm(b, a), 10)
  })

  test('del Obelisco a La Plata hay unos 53 km', () => {
    const obelisco = { lat: -34.6037, lng: -58.3816 }
    const laPlata = { lat: -34.9214, lng: -57.9544 }
    const distancia = distanciaKm(obelisco, laPlata)
    expect(distancia).toBeGreaterThan(50)
    expect(distancia).toBeLessThan(55)
  })
})