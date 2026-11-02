import { describe, expect, it } from 'vitest'
import {
  GRUPOS_CATALOGO,
  grupoDeCategoria,
  subgrupoDeCategoria,
  ubicarEnGrupo,
} from '../../config/gruposCatalogo'

const grupo = (slug: string) => GRUPOS_CATALOGO.find((g) => g.slug === slug)!
const sub = (slug: string, producto: string, categoria: string) =>
  ubicarEnGrupo(grupo(slug), producto, categoria).subgrupo?.slug

describe('gruposCatalogo', () => {
  it('ordena los botones: Combos, Hamburguesas, Para acompañar, Bebidas, Cafetería, Postres y Salsas al final', () => {
    expect(GRUPOS_CATALOGO.map((g) => g.nombre)).toEqual([
      'Combos', 'Hamburguesas', 'Para acompañar', 'Bebidas', 'Cafetería', 'Postres', 'Salsas',
    ])
  })

  it('reparte las hamburguesas en carne vacuna, pollo y veggie', () => {
    expect(sub('hamburguesas', 'Fast Classic', 'Hamburguesas')).toBe('carne-vacuna')
    expect(sub('hamburguesas', 'Crispy Crack', 'Hamburguesas')).toBe('pollo')
    expect(sub('hamburguesas', 'Seed Vicious', 'Hamburguesas')).toBe('veggie')
  })

  it('las bebidas ya no son parte de Para acompañar', () => {
    expect(ubicarEnGrupo(grupo('para-acompanar'), 'Coca Cola', 'Bebidas').pertenece).toBe(false)
    expect(grupoDeCategoria('Bebidas')?.slug).toBe('bebidas')
  })

  it('Para acompañar: papas, nuggets, otros y ensaladas', () => {
    expect(sub('para-acompanar', 'Papas Cajún', 'Papas Fritas')).toBe('papas-fritas')
    expect(sub('para-acompanar', 'Nuggets de Pollo x10', 'Nuggets')).toBe('nuggets')
    expect(sub('para-acompanar', 'Aros de Cebolla x8', 'Nuggets')).toBe('otros')
    expect(ubicarEnGrupo(grupo('para-acompanar'), 'Cheddar Fundido', 'Salsas').pertenece).toBe(false)
    expect(sub('para-acompanar', 'Ensalada Mixta', 'Ensaladas')).toBe('ensaladas')
  })

  it('Cafetería y Postres comparten Brownie y Cheesecake sin duplicar productos', () => {
    expect(sub('cafeteria', 'Brownie con Helado', 'Postres')).toBe('pasteleria')
    expect(sub('postres', 'Brownie con Helado', 'Postres')).toBe('tortas')
    expect(sub('cafeteria', 'Donas Glaseadas x3', 'Menú Café')).toBe('pasteleria')
    expect(ubicarEnGrupo(grupo('postres'), 'Donas Glaseadas x3', 'Menú Café').pertenece).toBe(false)
    expect(sub('postres', 'Batido de Vainilla', 'Postres')).toBe('helados')
  })

  it('Cafetería: los productos sin botón propio caen en Clásicos', () => {
    expect(sub('cafeteria', 'Espresso', 'Café')).toBe('bebidas-calientes')
    expect(sub('cafeteria', 'Tostado de Jamón y Queso', 'Menú Café')).toBe('sandwiches')
    expect(sub('cafeteria', 'Hot Cakes', 'Menú Café')).toBe('clasicos')
  })

  it('las salsas tienen su grupo al final del menú, con el Cheddar Fundido incluido', () => {
    expect(GRUPOS_CATALOGO[GRUPOS_CATALOGO.length - 1].slug).toBe('salsas')
    expect(grupoDeCategoria('Salsas')?.slug).toBe('salsas')
    expect(ubicarEnGrupo(grupo('salsas'), 'Mayonesa', 'Salsas').pertenece).toBe(true)
    expect(ubicarEnGrupo(grupo('salsas'), 'Cheddar Fundido', 'Salsas').pertenece).toBe(true)
  })

  it('la categoría principal Cafetería abre el grupo Cafetería', () => {
    expect(grupoDeCategoria('Cafetería')?.slug).toBe('cafeteria')
    expect(grupoDeCategoria('Café')?.slug).toBe('cafeteria')
    expect(grupoDeCategoria('Menú Café')?.slug).toBe('cafeteria')
  })

  it('una categoría con botón propio abre ese botón', () => {
    const g = grupoDeCategoria('Nuggets')!
    expect(subgrupoDeCategoria(g, 'Nuggets')?.slug).toBe('nuggets')
    expect(subgrupoDeCategoria(grupoDeCategoria('Café')!, 'Café')?.slug).toBe('bebidas-calientes')
  })
})
