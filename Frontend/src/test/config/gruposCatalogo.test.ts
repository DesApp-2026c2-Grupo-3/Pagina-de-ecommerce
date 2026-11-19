import { describe, expect, it } from 'vitest'
import type { Category, ProductoBackend } from '../../types/product'
import {
  aSlug,
  armarGrupos,
  perteneceAlGrupo,
  ubicarCategoria,
} from '../../config/gruposCatalogo'

const categorias: Category[] = [
  { id: 1, nombre: 'Hamburguesas', categoriaPadreId: null },
  { id: 2, nombre: 'Carne vacuna', categoriaPadreId: 1 },
  { id: 3, nombre: 'Bebidas', categoriaPadreId: null },
  { id: 4, nombre: 'Menú Café', categoriaPadreId: null },
  { id: 5, nombre: 'Cafés', categoriaPadreId: 4 },
]

const grupos = armarGrupos(categorias)

const productoDe = (categoriaId: number) => ({ categoriaId } as ProductoBackend)

describe('gruposCatalogo', () => {
  it('arma un grupo por categoría principal, en el orden que llega', () => {
    expect(grupos.map((grupo) => grupo.slug)).toEqual([
      'hamburguesas', 'bebidas', 'menu-cafe',
    ])
    expect(grupos[0].subgrupos.map((subgrupo) => subgrupo.slug)).toEqual(['carne-vacuna'])
    expect(grupos[1].subgrupos).toEqual([])
    expect(grupos[2].subgrupos.map((subgrupo) => subgrupo.slug)).toEqual(['cafes'])
  })

  it('normaliza tildes, espacios y mayúsculas para los slugs', () => {
    expect(aSlug('Menú Café')).toBe('menu-cafe')
    expect(aSlug('  Hamburguesas de pollo  ')).toBe('hamburguesas-de-pollo')
  })

  it('considera que un producto pertenece al grupo si está en la principal o en una hija', () => {
    expect(perteneceAlGrupo(grupos[0], productoDe(1))).toBe(true)
    expect(perteneceAlGrupo(grupos[0], productoDe(2))).toBe(true)
    expect(perteneceAlGrupo(grupos[0], productoDe(3))).toBe(false)
  })

  it('ubica una categoría principal o una subcategoría', () => {
    expect(ubicarCategoria(grupos, 1)?.grupo.slug).toBe('hamburguesas')
    expect(ubicarCategoria(grupos, 1)?.subgrupo).toBeUndefined()
    expect(ubicarCategoria(grupos, 2)?.subgrupo?.slug).toBe('carne-vacuna')
    expect(ubicarCategoria(grupos, 3)?.grupo.slug).toBe('bebidas')
    expect(ubicarCategoria(grupos, 99)).toBeUndefined()
  })
})
