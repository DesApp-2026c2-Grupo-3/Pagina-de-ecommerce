import { describe, expect, it } from 'vitest'
import type { CategoriaAdmin } from '../../types/categoria.types'
import {
  contarPorEstado,
  esFiltroEstadoCategoria,
  filtrarCategorias,
  resumenCategorias,
} from '../../utils/categorias/filtrarCategorias'
import { principalQueContinua } from '../../utils/categorias/contextoPagina'
import { enOrdenJerarquico, nombrePadre } from '../../utils/categorias/ordenCategorias'

function cat(id: number, nombre: string, activo: boolean, categoriaPadreId: number | null = null): CategoriaAdmin {
  return { id, nombre, activo, categoriaPadreId, orden: id, icono: null, fondo: null, cantidadProductos: 0 }
}

const lista = [
  cat(1, 'Hamburguesas', true),
  cat(2, 'Bebidas', true),
  cat(3, 'Clásicas', true, 1),
  cat(4, 'Gaseosas', false, 2),
  cat(5, 'Especiales', false, 1),
  cat(6, 'Postres', false),
  cat(7, 'Huérfana', true, 99),
]

describe('enOrdenJerarquico', () => {
  it('pone cada principal seguida de sus subcategorías', () => {
    expect(enOrdenJerarquico(lista).map((c) => c.id)).toEqual([1, 3, 5, 2, 4, 6, 7])
  })
  it('deja como principal a la que cuelga de una categoría que no está', () => {
    expect(enOrdenJerarquico(lista).filter((c) => c.id === 7)).toHaveLength(1)
  })
})

describe('nombrePadre', () => {
  it('devuelve null para una principal', () => {
    expect(nombrePadre(lista[0], lista)).toBeNull()
  })
  it('devuelve el nombre de la principal', () => {
    expect(nombrePadre(lista[2], lista)).toBe('Hamburguesas')
  })
  it('usa «otra categoría» si la principal no está en la lista', () => {
    expect(nombrePadre(lista[6], lista)).toBe('otra categoría')
  })
})

describe('filtrarCategorias', () => {
  const ordenadas = enOrdenJerarquico(lista)
  it('Habilitadas: solo las activas, en orden jerárquico', () => {
    expect(filtrarCategorias(ordenadas, { busqueda: '', estado: 'habilitadas' }).map((c) => c.id)).toEqual([1, 3, 2, 7])
  })
  it('Deshabilitadas: solo las inactivas', () => {
    expect(filtrarCategorias(ordenadas, { busqueda: '', estado: 'deshabilitadas' }).map((c) => c.id)).toEqual([5, 4, 6])
  })
  it('busca por nombre sin distinguir mayúsculas y sin espacios de más', () => {
    expect(filtrarCategorias(ordenadas, { busqueda: '  CLÁS ', estado: 'habilitadas' }).map((c) => c.id)).toEqual([3])
  })
})

describe('contarPorEstado', () => {
  it('cuenta habilitadas y deshabilitadas', () => {
    expect(contarPorEstado(lista, '')).toEqual({ habilitadas: 4, deshabilitadas: 3 })
  })
  it('cuenta sobre la búsqueda', () => {
    expect(contarPorEstado(lista, 'es')).toEqual({ habilitadas: 1, deshabilitadas: 2 })
  })
})

describe('resumenCategorias y esFiltroEstadoCategoria', () => {
  it('arma el resumen con singular y plural', () => {
    expect(resumenCategorias(lista)).toBe('7 categorías · 3 deshabilitadas')
    expect(resumenCategorias([cat(1, 'A', false)])).toBe('1 categoría · 1 deshabilitada')
  })
  it('acepta solo los dos estados', () => {
    expect(esFiltroEstadoCategoria('habilitadas')).toBe(true)
    expect(esFiltroEstadoCategoria('todos')).toBe(false)
    expect(esFiltroEstadoCategoria(null)).toBe(false)
  })
})

describe('principalQueContinua', () => {
  // Página de 3: [Hamburguesas, Clásicas, Especiales] [Veggie, Bebidas, Gaseosas] [Postres]
  const lista = [
    cat(1, 'Hamburguesas', true),
    cat(2, 'Clásicas', true, 1),
    cat(3, 'Especiales', true, 1),
    cat(4, 'Veggie', true, 1),
    cat(5, 'Bebidas', true),
    cat(6, 'Gaseosas', true, 5),
    cat(7, 'Postres', true),
  ]
  it('la página empieza con una subcategoría cuya principal está en una página anterior', () => {
    expect(principalQueContinua(lista, 2, 3)).toEqual({ nombre: 'Hamburguesas', pagina: 1 })
  })
  it('dice la página correcta aunque la principal esté varias páginas antes', () => {
    expect(principalQueContinua(lista, 2, 1)).toEqual({ nombre: 'Hamburguesas', pagina: 1 })
    expect(principalQueContinua(lista, 4, 1)).toEqual({ nombre: 'Hamburguesas', pagina: 1 })
  })
  it('no aparece si la página empieza con una principal', () => {
    expect(principalQueContinua(lista, 3, 3)).toBeNull()
    expect(principalQueContinua(lista, 1, 3)).toBeNull()
  })
  it('no aparece si la principal no está en la lista (otro estado o la búsqueda)', () => {
    expect(principalQueContinua([cat(4, 'Veggie', false, 1), cat(9, 'Cafetería', false)], 1, 1)).toBeNull()
    expect(principalQueContinua([cat(9, 'Cafetería', false), cat(4, 'Veggie', false, 1)], 2, 1)).toBeNull()
  })
  it('no aparece si la página está fuera de la lista', () => {
    expect(principalQueContinua(lista, 9, 3)).toBeNull()
  })
})
