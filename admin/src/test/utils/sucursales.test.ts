import { describe, expect, it } from 'vitest'
import { POR_PAGINA_SUCURSALES } from '../../config/sucursales'
import type { Sucursal } from '../../types/sucursal.types'
import {
  contarPorEstadoSucursal,
  esFiltroEstadoSucursal,
  filtrarSucursales,
  textoDireccion,
} from '../../utils/sucursales/filtrarSucursales'

function suc(id: number, nombre: string, extra: Partial<Sucursal> = {}): Sucursal {
  return { id, nombre, activa: true, ...extra }
}

const lista = [
  suc(1, 'Sucursal Centro', { calle: 'Av. Corrientes', numero: '1234', localidad: 'CABA' }),
  suc(2, 'Sucursal Palermo', { calle: 'Honduras', numero: null, localidad: ' CABA ' }),
  suc(3, 'Sucursal La Plata', { activa: false, localidad: 'La Plata' }),
  suc(4, 'Sucursal Rosario', { activa: false }),
]

describe('filtros de sucursales', () => {
  it('Activas e Inactivas, sin «Todas»', () => {
    expect(filtrarSucursales(lista, { busqueda: '', estado: 'activas' }).map((s) => s.id)).toEqual([1, 2])
    expect(filtrarSucursales(lista, { busqueda: '', estado: 'inactivas' }).map((s) => s.id)).toEqual([3, 4])
  })
  it('busca por nombre, sin distinguir mayúsculas ni espacios de más', () => {
    expect(filtrarSucursales(lista, { busqueda: '  CENTRO ', estado: 'activas' }).map((s) => s.id)).toEqual([1])
    expect(filtrarSucursales(lista, { busqueda: 'centro', estado: 'inactivas' })).toEqual([])
  })
  it('cuenta activas e inactivas sobre la búsqueda', () => {
    expect(contarPorEstadoSucursal(lista, '')).toEqual({ activas: 2, inactivas: 2 })
    expect(contarPorEstadoSucursal(lista, 'la plata')).toEqual({ activas: 0, inactivas: 1 })
  })
  it('acepta solo los dos estados en la URL y pagina de a 10', () => {
    expect(esFiltroEstadoSucursal('inactivas')).toBe(true)
    expect(esFiltroEstadoSucursal('todas')).toBe(false)
    expect(POR_PAGINA_SUCURSALES).toBe(10)
  })
})

describe('dirección de la tarjeta', () => {
  it('arma «Calle Número · Localidad» con lo que haya', () => {
    expect(textoDireccion(lista[0])).toBe('Av. Corrientes 1234 · CABA')
    expect(textoDireccion(lista[1])).toBe('Honduras · CABA')
    expect(textoDireccion(lista[2])).toBe('La Plata')
  })
  it('sin datos de dirección, no muestra la línea', () => {
    expect(textoDireccion(lista[3])).toBeNull()
  })
})
