import { describe, expect, test } from 'vitest'
import { conDescuento, esPromoFija, promoDelProducto, resolverPromo, resumenLineas } from '../../utils/promosUtils'
import type { ComboGrupo, ProductoBackend, ProductoTamanio } from '../../types/product'
import type { ItemPromo, Promo, Promociones } from '../../types/promo'

const tam = (tamanioId: number, tamanio: string, precio: number): ProductoTamanio => ({
  tamanioId,
  tamanio,
  precio,
  etiqueta: null,
})

const producto = (datos: Partial<ProductoBackend> & Pick<ProductoBackend, 'id' | 'nombre' | 'categoriaId'>): ProductoBackend => ({
  descripcion: '',
  precio: 0,
  imagen: '',
  disponible: true,
  ...datos,
})

const ACOMPANIAMIENTO: ComboGrupo = {
  id: 1,
  nombre: 'Acompañamiento',
  categoriaId: 10,
  productoIncluidoId: 21,
  obligatorio: true,
  cobraDiferencia: true,
  orden: 1,
}

const CATALOGO: ProductoBackend[] = [
  producto({ id: 5, nombre: 'Fast Classic', categoriaId: 1, precio: 6000 }),
  // Combo con los tamaños desordenados: la promo tiene que usar el regular
  producto({
    id: 40,
    nombre: 'Combo Habemus Bacon',
    categoriaId: 2,
    tamanios: [tam(2, 'mediano', 10500), tam(1, 'regular', 9000)],
    grupos: [ACOMPANIAMIENTO],
  }),
  producto({ id: 21, nombre: 'Papas fritas', categoriaId: 10, tamanios: [tam(1, 'regular', 2000)] }),
  producto({ id: 22, nombre: 'Papas con cheddar', categoriaId: 10, tamanios: [tam(1, 'regular', 2800)] }),
  producto({ id: 31, nombre: 'Latte', categoriaId: 3, precio: 3000, disponible: false }),
]

const item = (productoId: number, cantidad: number, descuento: number): ItemPromo => ({
  nombre: `Producto ${productoId}`,
  productoId,
  cantidad,
  descuento,
})

const promo = (id: string, items: ItemPromo[], extra: Partial<Promo> = {}): Promo => ({
  id,
  titulo: id,
  destacado: '',
  detalle: '',
  items,
  ...extra,
})

describe('conDescuento', () => {
  test.each([
    [5000, 0.2, 4000],
    [6000, 0.5, 3000],
    [2800, 1, 0],
    [3000, 0, 3000],
    [1999, 0.5, 1000], // redondea al peso, igual que el backend
  ])('%s con %s de descuento → %s', (precio, descuento, esperado) => {
    expect(conDescuento(precio, descuento)).toBe(esperado)
  })
})

describe('esPromoFija', () => {
  test('una promo de un solo producto y una unidad se puede modificar', () => {
    expect(esPromoFija(promo('semana', [item(40, 1, 0.2)]))).toBe(false)
  })

  test.each([
    ['tiene más de un producto', promo('cafe', [item(31, 1, 0.3), item(5, 1, 0.3)])],
    ['es de varias unidades (2×1)', promo('2x1', [item(5, 2, 0.5)])],
    ['tiene un máximo por pedido', promo('regalo', [item(22, 1, 1)], { maxPorPedido: 1 })],
  ])('una promo que %s va cerrada', (_, p) => {
    expect(esPromoFija(p)).toBe(true)
  })
})

describe('resolverPromo', () => {
  test('arma las líneas con el precio de lista y el precio con descuento', () => {
    const r = resolverPromo(promo('2x1', [item(5, 2, 0.5)]), CATALOGO)

    expect(r.lineas).toHaveLength(1)
    expect(r.lineas[0]).toMatchObject({ cantidad: 2, precioLista: 6000, precio: 3000, tamanioId: null })
    expect(r.totalLista).toBe(12000)
    expect(r.total).toBe(6000)
    expect(r.disponible).toBe(true)
  })

  test('en un combo usa el tamaño más chico y la opción incluida de cada grupo', () => {
    const r = resolverPromo(promo('semana', [item(40, 1, 0.2)]), CATALOGO)

    expect(r.lineas[0]).toMatchObject({
      tamanioId: 1,
      precioLista: 9000,
      precio: 7200,
      combo: [{ grupoId: 1, productoId: 21 }],
    })
  })

  test('suma varios productos', () => {
    const r = resolverPromo(promo('combo', [item(5, 1, 0.25), item(22, 1, 0.25)]), CATALOGO)

    expect(r.totalLista).toBe(8800) // 6000 + 2800
    expect(r.total).toBe(6600) // 4500 + 2100
  })

  test('no está disponible si un producto no está disponible en la sucursal', () => {
    const r = resolverPromo(promo('cafe', [item(31, 1, 0.3), item(5, 1, 0.3)]), CATALOGO)

    expect(r.disponible).toBe(false)
    expect(r.lineas.map((l) => l.producto.id)).toEqual([5])
  })

  test('no está disponible si un producto ya no existe', () => {
    expect(resolverPromo(promo('vieja', [item(999, 1, 0.5)]), CATALOGO)).toMatchObject({
      lineas: [],
      total: 0,
      disponible: false,
    })
  })
})

describe('promoDelProducto', () => {
  const semana = promo('semana', [item(40, 1, 0.2)])
  const martes = promo('martes', [item(5, 2, 0.5), item(21, 1, 0)])
  const miercoles = promo('miercoles', [item(22, 1, 0.5)])
  const regalo = promo('regalo', [item(22, 1, 1)])

  const PROMOS: Promociones = {
    hoy: 2, // martes
    productoSemana: semana,
    regalo,
    dias: [
      { dia: 2, nombre: 'Martes', promos: [martes] },
      { dia: 3, nombre: 'Miércoles', promos: [miercoles] },
    ],
  }

  test('encuentra el producto de la semana', () => {
    expect(promoDelProducto(PROMOS, 40)).toBe(semana)
  })

  test('encuentra la promo del día de hoy', () => {
    expect(promoDelProducto(PROMOS, 5)).toBe(martes)
  })

  test('no muestra las promos de otro día', () => {
    expect(promoDelProducto(PROMOS, 22)).toBeNull()
  })

  test('no cuenta un producto de la promo que no tiene descuento', () => {
    expect(promoDelProducto(PROMOS, 21)).toBeNull()
  })

  test('sin promociones cargadas no hay promo', () => {
    expect(promoDelProducto(null, 5)).toBeNull()
  })
})

describe('resumenLineas', () => {
  test('arma el texto de la promo', () => {
    const { lineas } = resolverPromo(promo('combo', [item(5, 2, 0.5), item(22, 1, 0)]), CATALOGO)

    expect(resumenLineas(lineas)).toBe('2× Fast Classic · 1× Papas con cheddar')
  })
})