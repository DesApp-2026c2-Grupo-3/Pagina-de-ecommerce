import { describe, expect, it } from 'vitest'
import {
  GRUPOS_CATALOGO,
  grupoDeCategoria,
  normalizarNombre,
  subgrupoDeCategoria,
  ubicarEnGrupo,
} from '../../config/gruposCatalogo'
import { estiloDeCategoria } from '../../config/categorias'

// Este es el menú de RESPALDO (el mismo que carga la semilla del menú); el que se ve en el sitio lo arma el master
const grupo = (slug: string) => GRUPOS_CATALOGO.find((g) => g.slug === slug)!
const sub = (slug: string, producto: string, categoria: string) =>
  ubicarEnGrupo(grupo(slug), producto, categoria).subgrupo?.slug

describe('menú de respaldo', () => {
  it('ordena los botones: Combos, Hamburguesas, Para acompañar, Bebidas, Cafetería, Postres y Salsas al final', () => {
    expect(GRUPOS_CATALOGO.map((g) => g.nombre)).toEqual([
      'Combos', 'Hamburguesas', 'Para acompañar', 'Bebidas', 'Cafetería', 'Postres', 'Salsas',
    ])
  })

  it('se muestran por secciones Para acompañar, Cafetería y Postres', () => {
    expect(GRUPOS_CATALOGO.filter((g) => g.porSecciones).map((g) => g.slug)).toEqual(['para-acompanar', 'cafeteria', 'postres'])
  })

  it('la sección por defecto de cada grupo existe (si no, un producto nuevo no se ubica)', () => {
    for (const g of GRUPOS_CATALOGO.filter((x) => x.subgrupos)) {
      expect(g.subgrupos!.some((s) => s.slug === g.subgrupoPorDefecto), g.slug).toBe(true)
    }
  })

  it('todas las secciones tienen un ícono propio, no el genérico', () => {
    for (const g of GRUPOS_CATALOGO) {
      for (const s of g.subgrupos ?? []) {
        expect(estiloDeCategoria({ nombre: s.estilo, icono: s.icono, fondo: s.fondo }).icono, `${g.slug}/${s.slug}`).not.toBe('generico')
      }
    }
  })

  it('los slugs no se repiten dentro del menú', () => {
    expect(new Set(GRUPOS_CATALOGO.map((g) => g.slug)).size).toBe(GRUPOS_CATALOGO.length)
    for (const g of GRUPOS_CATALOGO) {
      const slugs = (g.subgrupos ?? []).map((s) => s.slug)
      expect(new Set(slugs).size).toBe(slugs.length)
    }
  })
})

describe('Combos', () => {
  it('se reparten en carne de res, pollo y veggie', () => {
    expect(sub('combos', 'Combo Habemus Bacon', 'Combos')).toBe('combo-carne-vacuna')
    expect(sub('combos', 'Combo Crispy Crack', 'Combos')).toBe('combo-pollo')
    expect(sub('combos', 'Combo Seed Vicious', 'Combos')).toBe('combo-veggie')
  })
})

describe('Hamburguesas', () => {
  it('se reparten en carne de res, pollo y veggie', () => {
    expect(sub('hamburguesas', 'Fast Classic', 'Hamburguesas')).toBe('carne-vacuna')
    expect(sub('hamburguesas', 'Crispy Crack', 'Hamburguesas')).toBe('pollo')
    expect(sub('hamburguesas', 'Seed Vicious', 'Hamburguesas')).toBe('veggie')
  })

  it('una hamburguesa nueva cae en la sección por defecto', () => {
    expect(sub('hamburguesas', 'Hamburguesa Nueva', 'Hamburguesas')).toBe('carne-vacuna')
  })

  it('no incluye productos de otras categorías', () => {
    expect(ubicarEnGrupo(grupo('hamburguesas'), 'Coca Cola', 'Bebidas').pertenece).toBe(false)
  })
})

describe('Para acompañar', () => {
  it('reparte papas, nuggets, ensaladas y otros', () => {
    expect(sub('para-acompanar', 'Papas Cheddar', 'Papas Fritas')).toBe('papas-fritas')
    expect(sub('para-acompanar', 'Nuggets x6', 'Nuggets')).toBe('nuggets')
    expect(sub('para-acompanar', 'Ensalada César', 'Ensaladas')).toBe('ensaladas')
  })

  it('los Palitos, los Aros y el Cheddar Fundido van en Otros, vengan de la categoría que vengan', () => {
    expect(sub('para-acompanar', 'Palitos de Muzzarela', 'Nuggets')).toBe('otros')
    expect(sub('para-acompanar', 'Aros de Cebolla x8', 'Nuggets')).toBe('otros')
    expect(sub('para-acompanar', 'Cheddar Fundido', 'Salsas')).toBe('otros')
  })

  it('un producto nuevo de su categoría cae en Papas, la sección por defecto', () => {
    expect(grupo('para-acompanar').subgrupoPorDefecto).toBe('papas-fritas')
  })
})

describe('Bebidas', () => {
  it('separa gaseosas y agua', () => {
    expect(sub('bebidas', 'Coca Cola', 'Bebidas')).toBe('gaseosas')
    expect(sub('bebidas', 'Agua Mineral', 'Bebidas')).toBe('agua')
    expect(sub('bebidas', 'Bebida Nueva', 'Bebidas')).toBe('gaseosas')
  })
})

describe('Cafetería', () => {
  it('reparte cafés, clásicos, sandwiches y dulces', () => {
    expect(sub('cafeteria', 'Latte', 'Café')).toBe('cafes')
    expect(sub('cafeteria', 'Medialunas x2', 'Menú Café')).toBe('clasicos')
    expect(sub('cafeteria', 'Tostado de Jamón y Queso', 'Menú Café')).toBe('sandwiches')
    expect(sub('cafeteria', 'Hot Cakes', 'Menú Café')).toBe('dulces')
  })

  it('Brownie y Cheesecake se ven en Dulces y también en Postres → Tortas', () => {
    expect(sub('cafeteria', 'Brownie con Helado', 'Postres')).toBe('dulces')
    expect(sub('postres', 'Brownie con Helado', 'Postres')).toBe('tortas')
    expect(sub('cafeteria', 'Cheesecake de Frutos Rojos', 'Postres')).toBe('dulces')
    expect(sub('postres', 'Cheesecake de Frutos Rojos', 'Postres')).toBe('tortas')
  })

  it('un producto nuevo de Menú Café cae en Clásicos', () => {
    expect(sub('cafeteria', 'Producto Nuevo', 'Menú Café')).toBe('clasicos')
  })
})

describe('Postres', () => {
  it('separa helados y tortas', () => {
    expect(sub('postres', 'Helado Crunch', 'Postres')).toBe('helados')
    expect(sub('postres', 'Batido de Vainilla', 'Postres')).toBe('helados')
    expect(sub('postres', 'Postre Nuevo', 'Postres')).toBe('tortas')
  })
})

describe('Salsas', () => {
  it('es un grupo simple, al final del menú', () => {
    expect(grupo('salsas').subgrupos).toBeUndefined()
    expect(ubicarEnGrupo(grupo('salsas'), 'Ketchup', 'Salsas').pertenece).toBe(true)
    expect(ubicarEnGrupo(grupo('salsas'), 'Fast Classic', 'Hamburguesas').pertenece).toBe(false)
  })
})

describe('grupoDeCategoria y subgrupoDeCategoria', () => {
  it('encuentra el grupo de una categoría, sin importar tildes ni mayúsculas', () => {
    expect(grupoDeCategoria('Hamburguesas')?.slug).toBe('hamburguesas')
    expect(grupoDeCategoria('hamburguesa')?.slug).toBe('hamburguesas')
    expect(grupoDeCategoria('Papas Fritas')?.slug).toBe('para-acompanar')
    expect(grupoDeCategoria('Menu Cafe')?.slug).toBe('cafeteria')
  })

  it('Cafetería (la categoría principal) y sus hijas abren el grupo Cafetería', () => {
    expect(grupoDeCategoria('Cafetería')?.slug).toBe('cafeteria')
    expect(grupoDeCategoria('Café')?.slug).toBe('cafeteria')
    expect(grupoDeCategoria('Menú Café')?.slug).toBe('cafeteria')
  })

  it('Salsas abre su grupo, y una categoría desconocida no abre ninguno', () => {
    expect(grupoDeCategoria('Salsas')?.slug).toBe('salsas')
    expect(grupoDeCategoria('Inexistente')).toBeUndefined()
  })

  it('una categoría entera puede tener su propio botón dentro del grupo', () => {
    expect(subgrupoDeCategoria(grupo('para-acompanar'), 'Nuggets')?.slug).toBe('nuggets')
    expect(subgrupoDeCategoria(grupo('cafeteria'), 'Café')?.slug).toBe('cafes')
    expect(subgrupoDeCategoria(grupo('bebidas'), 'Bebidas')).toBeUndefined()
  })

  it('usa otro conjunto de grupos si se lo pasan (el menú del master)', () => {
    const grupos = [{ id: 9, slug: 'x', nombre: 'X', categorias: ['Rara'], porSecciones: false }]
    expect(grupoDeCategoria('Rara', grupos)?.slug).toBe('x')
    expect(grupoDeCategoria('Hamburguesas', grupos)).toBeUndefined()
  })
})

describe('normalizarNombre', () => {
  it('saca tildes y mayúsculas', () => {
    expect(normalizarNombre('  Menú Café ')).toBe('menu cafe')
  })
})
