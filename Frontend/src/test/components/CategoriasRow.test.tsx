import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CategoriasRow, { accesos } from '../../components/home/CategoriasRow'
import { getCategories } from '../../services/productService'
import type { Category } from '../../types/product'

vi.mock('../../services/productService', () => ({ getCategories: vi.fn() }))
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: null }) }))

// Como las manda el backend: ya ordenadas, con Cafetería como principal y Salsas al final
const categorias: Category[] = [
  { id: 1, nombre: 'Combos', categoriaPadreId: null, orden: 10 },
  { id: 2, nombre: 'Hamburguesas', categoriaPadreId: null, orden: 20 },
  { id: 3, nombre: 'Papas Fritas', categoriaPadreId: null, orden: 30 },
  { id: 9, nombre: 'Cafetería', categoriaPadreId: null, orden: 60 },
  { id: 6, nombre: 'Café', categoriaPadreId: 9, orden: 10 },
  { id: 7, nombre: 'Menú Café', categoriaPadreId: 9, orden: 20 },
  { id: 8, nombre: 'Postres', categoriaPadreId: null, orden: 80 },
  { id: 10, nombre: 'Salsas', categoriaPadreId: null, orden: 90, esComplemento: true },
]

beforeEach(() => vi.clearAllMocks())

describe('accesos (tarjetas del Home)', () => {
  test('una tarjeta por categoría principal, en el orden del backend', () => {
    expect(accesos(categorias).map((a) => a.nombre)).toEqual([
      'Combos', 'Hamburguesas', 'Papas Fritas', 'Cafetería', 'Postres', 'Salsas',
    ])
  })

  test('Café y Menú Café no tienen tarjeta propia: están dentro de Cafetería', () => {
    const nombres = accesos(categorias).map((a) => a.nombre)
    expect(nombres).not.toContain('Café')
    expect(nombres).not.toContain('Menú Café')
  })

  test('cada tarjeta abre el catálogo en su categoría', () => {
    const cafeteria = accesos(categorias).find((a) => a.nombre === 'Cafetería')
    expect(cafeteria?.to).toBe('/catalogo?categoria=9')
    expect(cafeteria?.icono).toBe('desayuno')
  })

  test('Salsas va al final con su ícono', () => {
    const lista = accesos(categorias)
    expect(lista[lista.length - 1]).toMatchObject({ nombre: 'Salsas', icono: 'salsa', to: '/catalogo?categoria=10' })
  })

  test('usa el ícono y el color que eligió el master, y si no eligió, los del nombre', () => {
    const lista = accesos([
      { id: 1, nombre: 'Combos', icono: 'bebida', fondo: 'arena' },
      { id: 2, nombre: 'Postres', icono: null, fondo: null },
      { id: 3, nombre: 'Brunch', icono: 'pizza-inexistente', fondo: 'violeta' },
    ])
    expect(lista[0]).toMatchObject({ icono: 'bebida', fondo: 'bg-brand-sand' })
    expect(lista[1]).toMatchObject({ icono: 'postre', fondo: 'bg-brand-mustard' })
    expect(lista[2]).toMatchObject({ icono: 'generico', fondo: 'bg-brand-sand' })
  })

  test('una categoría sin el campo de padre (backend viejo) se muestra igual', () => {
    expect(accesos([{ id: 1, nombre: 'Combos' }]).map((a) => a.nombre)).toEqual(['Combos'])
  })
})

describe('CategoriasRow', () => {
  test('muestra las tarjetas con sus enlaces', async () => {
    vi.mocked(getCategories).mockResolvedValue(categorias)
    render(
      <MemoryRouter>
        <CategoriasRow />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('link', { name: /Salsas/ })).toHaveAttribute('href', '/catalogo?categoria=10')
    expect(screen.getByRole('link', { name: /Cafetería/ })).toHaveAttribute('href', '/catalogo?categoria=9')
    expect(screen.queryByRole('link', { name: /Menú Café/ })).not.toBeInTheDocument()
  })

  test('sin categorías no muestra la sección', async () => {
    vi.mocked(getCategories).mockResolvedValue([])
    const { container } = render(
      <MemoryRouter>
        <CategoriasRow />
      </MemoryRouter>,
    )

    await vi.waitFor(() => expect(getCategories).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })
})
