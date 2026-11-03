import { describe, expect, it } from 'vitest'
import { armarGrupos } from '../../config/menuDinamico'
import { grupoDeCategoria, ubicarEnGrupo } from '../../config/gruposCatalogo'
import type { MenuApi } from '../../types/menu'
import type { Category, ProductoBackend } from '../../types/product'

const categorias: Category[] = [
  { id: 2, nombre: 'Hamburguesas' },
  { id: 6, nombre: 'Café' },
  { id: 9, nombre: 'Cafetería' },
]

const producto = (id: number, nombre: string, categoriaId: number) => ({ id, nombre, categoriaId }) as ProductoBackend
const productos = [producto(1, 'Fast Classic', 2), producto(2, 'Crispy Crack', 2), producto(3, 'Latte', 6)]

const menu: MenuApi = {
  grupos: [
    {
      id: 30, slug: 'hamburguesas', nombre: 'Hamburguesas', porSecciones: false, categoriaIds: [2],
      secciones: [
        { id: 31, slug: 'carne', nombre: 'Carne de Res', icono: 'hamburguesa', fondo: 'mostaza', categoriaId: 2, esPorDefecto: true, productoIds: [] },
        { id: 32, slug: 'pollo', nombre: 'Pollo', icono: null, fondo: null, categoriaId: null, esPorDefecto: false, productoIds: [2, 99] },
      ],
    },
    { id: 40, slug: 'cafeteria', nombre: 'Cafetería', porSecciones: true, categoriaIds: [9, 6], secciones: [] },
  ],
}

describe('armarGrupos', () => {
  const grupos = armarGrupos(menu, categorias, productos)

  it('arma un grupo por cada grupo del menú, con el mismo orden', () => {
    expect(grupos.map((g) => g.slug)).toEqual(['hamburguesas', 'cafeteria'])
    expect(grupos[0]).toMatchObject({ id: 30, nombre: 'Hamburguesas', porSecciones: false, subgrupoPorDefecto: 'carne' })
  })

  it('pasa las categorías del grupo de id a nombre', () => {
    expect(grupos[0].categorias).toEqual(['Hamburguesas'])
    expect(grupos[1].categorias).toEqual(['Cafetería', 'Café'])
  })

  it('una sección toma la categoría automática y los productos a mano por nombre', () => {
    const [carne, pollo] = grupos[0].subgrupos!
    expect(carne).toMatchObject({ slug: 'carne', nombre: 'Carne de Res', categorias: ['Hamburguesas'], icono: 'hamburguesa', fondo: 'mostaza' })
    expect(carne.productos).toBeUndefined()
    expect(pollo.productos).toEqual(['Crispy Crack'])
    expect(pollo.categorias).toBeUndefined()
  })

  it('omite los productos que no están en el catálogo (otra zona, eliminados)', () => {
    expect(grupos[0].subgrupos![1].productos).toEqual(['Crispy Crack'])
  })

  it('un grupo sin secciones queda sin subgrupos', () => {
    expect(grupos[1].subgrupos).toBeUndefined()
    expect(grupos[1].subgrupoPorDefecto).toBeUndefined()
  })

  it('funciona con las mismas funciones de siempre: lo manual gana, después la categoría', () => {
    expect(ubicarEnGrupo(grupos[0], 'Fast Classic', 'Hamburguesas').subgrupo?.slug).toBe('carne')
    expect(ubicarEnGrupo(grupos[0], 'Crispy Crack', 'Hamburguesas').subgrupo?.slug).toBe('pollo')
    expect(ubicarEnGrupo(grupos[0], 'Latte', 'Café').pertenece).toBe(false)
    expect(grupoDeCategoria('Cafetería', grupos)?.slug).toBe('cafeteria')
    expect(grupoDeCategoria('Café', grupos)?.slug).toBe('cafeteria')
  })

  it('una sección con una categoría que ya no existe queda sin categoría automática', () => {
    const roto: MenuApi = {
      grupos: [{ ...menu.grupos[0], secciones: [{ ...menu.grupos[0].secciones[0], categoriaId: 77 }] }],
    }
    const [seccion] = armarGrupos(roto, categorias, productos)[0].subgrupos!
    expect(seccion.categorias).toBeUndefined()
  })
})
