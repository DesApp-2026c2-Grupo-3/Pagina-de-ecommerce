import { describe, expect, it } from 'vitest'
import type { Insumo } from '../../types/insumo.types'
import {
  contarPorEstadoInsumo,
  esFiltroEstadoInsumo,
  filtrarInsumos,
  mensajeSinInsumos,
  textoPrecioExtra,
  textoStockMinimo,
} from '../../utils/insumos/filtrarInsumos'
import {
  FORMULARIO_INSUMO_VACIO,
  datosDesdeFormulario,
  formularioDesdeInsumo,
  validarFormularioInsumo,
} from '../../utils/insumos/formularioInsumo'
import { posicionEn, suavizado } from '../../utils/navegacion/desplazarSuave'

function ins(id: number, nombre: string, extra: Partial<Insumo> = {}): Insumo {
  return { id, nombre, unidadMedida: 'unidad', precioComercial: null, activo: true, stockMinimo: null, ...extra }
}

const lista = [
  ins(1, 'Pepinillos', { precioComercial: '500', stockMinimo: '20.000' }),
  ins(2, 'Cheddar en fetas', { precioComercial: 800 }),
  ins(3, 'Jalapeños', { activo: false, stockMinimo: 0 }),
  ins(4, 'Cebolla caramelizada', { precioComercial: '0' }),
]

describe('formulario de insumo (misma lógica que antes)', () => {
  it('valida nombre, precio y mínimo con los mensajes de siempre', () => {
    expect(validarFormularioInsumo({ ...FORMULARIO_INSUMO_VACIO, nombre: ' a ' })).toBe('El nombre debe tener al menos 2 caracteres.')
    expect(validarFormularioInsumo({ nombre: 'Ajo', precioComercial: '-1', stockMinimo: '' })).toBe('El precio del extra no puede ser negativo.')
    expect(validarFormularioInsumo({ nombre: 'Ajo', precioComercial: '', stockMinimo: '-2' })).toBe('El stock mínimo no puede ser negativo.')
    expect(validarFormularioInsumo({ nombre: 'Ajo', precioComercial: '', stockMinimo: '' })).toBeNull()
  })
  it('arma los datos para el backend (vacío = null, unidad)', () => {
    expect(datosDesdeFormulario({ nombre: ' Ajo ', precioComercial: '', stockMinimo: '5' })).toEqual({
      nombre: 'Ajo',
      unidadMedida: 'unidad',
      precioComercial: null,
      stockMinimo: 5,
    })
  })
  it('se autocompleta al editar', () => {
    expect(formularioDesdeInsumo(lista[0])).toEqual({ nombre: 'Pepinillos', precioComercial: '500', stockMinimo: '20' })
    expect(formularioDesdeInsumo(lista[1])).toEqual({ nombre: 'Cheddar en fetas', precioComercial: '800', stockMinimo: '' })
  })
})

describe('filtros y textos de la lista', () => {
  it('Habilitados y Deshabilitados, con búsqueda', () => {
    expect(filtrarInsumos(lista, { busqueda: '', estado: 'habilitados' }).map((i) => i.id)).toEqual([1, 2, 4])
    expect(filtrarInsumos(lista, { busqueda: '', estado: 'deshabilitados' }).map((i) => i.id)).toEqual([3])
    expect(filtrarInsumos(lista, { busqueda: ' CHED ', estado: 'habilitados' }).map((i) => i.id)).toEqual([2])
  })
  it('cuenta por estado sobre la búsqueda', () => {
    expect(contarPorEstadoInsumo(lista, '')).toEqual({ habilitados: 3, deshabilitados: 1 })
    expect(contarPorEstadoInsumo(lista, 'pe')).toEqual({ habilitados: 1, deshabilitados: 1 })
  })
  it('acepta solo los dos estados', () => {
    expect(esFiltroEstadoInsumo('deshabilitados')).toBe(true)
    expect(esFiltroEstadoInsumo('todos')).toBe(false)
  })
  it('precio del extra y stock mínimo', () => {
    expect(textoPrecioExtra(lista[0])).toBe('$500')
    expect(textoPrecioExtra(lista[3])).toBe('Sin cargo')
    expect(textoPrecioExtra(lista[2])).toBe('Sin cargo')
    expect(textoStockMinimo(lista[0])).toBe('20')
    expect(textoStockMinimo(lista[2])).toBe('0')
    expect(textoStockMinimo(lista[1])).toBe('—')
  })
  it('mensaje de lista vacía como hoy', () => {
    expect(mensajeSinInsumos(0, '')).toBe('No hay insumos registrados.')
    expect(mensajeSinInsumos(4, '')).toBe('No hay insumos para este filtro.')
    expect(mensajeSinInsumos(4, 'zzz')).toBe('No se encontraron insumos con los criterios seleccionados.')
  })
})

describe('desplazamiento lento', () => {
  it('arranca y termina en los extremos, y pasa por la mitad a mitad de tiempo', () => {
    expect(suavizado(0)).toBe(0)
    expect(suavizado(1)).toBe(1)
    expect(suavizado(0.5)).toBeCloseTo(0.5)
    expect(suavizado(-1)).toBe(0)
    expect(suavizado(2)).toBe(1)
  })
  it('acelera y frena suave (avanza poco al principio y al final)', () => {
    expect(suavizado(0.1)).toBeLessThan(0.1)
    expect(suavizado(0.9)).toBeGreaterThan(0.9)
  })
  it('calcula la posición entre el origen y el destino', () => {
    expect(posicionEn(1000, 200, 0)).toBe(1000)
    expect(posicionEn(1000, 200, 1)).toBe(200)
    expect(posicionEn(1000, 200, 0.5)).toBeCloseTo(600)
  })
})
