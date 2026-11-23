import { describe, expect, test } from 'vitest'
import { eleccionPorDefecto, opcionesDeGrupo, precioEn, textoSin } from '../../utils/comboOpciones'
import type { ComboGrupo, ProductoBackend, ProductoTamanio } from '../../types/product'
import type { OpcionElegible } from '../../components/product/ChoiceSheet'

// Tamaños: 1 = regular, 2 = mediano
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

const PAPAS = 10
const BEBIDAS = 20

const CATALOGO: ProductoBackend[] = [
  producto({ id: 21, nombre: 'Papas fritas', categoriaId: PAPAS, tamanios: [tam(1, 'regular', 2000), tam(2, 'mediano', 2400)] }),
  producto({ id: 22, nombre: 'Papas con cheddar', categoriaId: PAPAS, tamanios: [tam(1, 'regular', 2800), tam(2, 'mediano', 3400)] }),
  producto({ id: 23, nombre: 'Papas rústicas', categoriaId: PAPAS, disponible: false, tamanios: [tam(1, 'regular', 2500)] }),
  producto({ id: 31, nombre: 'Coca Cola', categoriaId: BEBIDAS, tamanios: [tam(1, 'regular', 1500), tam(2, 'mediano', 1800)] }),
  producto({ id: 32, nombre: 'Agua', categoriaId: BEBIDAS, tamanios: [tam(1, 'regular', 1200), tam(2, 'mediano', 1400)] }),
  producto({ id: 5, nombre: 'Hamburguesa', categoriaId: 1, precio: 6000 }),
]

const ACOMPANIAMIENTO: ComboGrupo = {
  id: 1,
  nombre: 'Acompañamiento',
  categoriaId: PAPAS,
  productoIncluidoId: 21,
  obligatorio: true,
  cobraDiferencia: true,
  orden: 1,
  icono: '🍟',
}

const BEBIDA: ComboGrupo = {
  id: 2,
  nombre: 'Una bebida',
  categoriaId: BEBIDAS,
  productoIncluidoId: 32,
  obligatorio: false,
  cobraDiferencia: false,
  orden: 2,
  icono: null,
}

describe('precioEn', () => {
  test('un producto sin tamaños usa su precio único', () => {
    expect(precioEn(CATALOGO[5], null)).toBe(6000)
  })

  test('un producto con tamaños usa el precio del tamaño pedido', () => {
    expect(precioEn(CATALOGO[0], 2)).toBe(2400)
  })

  test('si el producto no se vende en ese tamaño, devuelve null', () => {
    expect(precioEn(CATALOGO[2], 2)).toBeNull()
  })
})

describe('opcionesDeGrupo (RN-15)', () => {
  test('la opción más barata va incluida y las demás pagan la diferencia', () => {
    const opciones = opcionesDeGrupo(ACOMPANIAMIENTO, CATALOGO, 1)

    expect(opciones.map((o) => [o.nombre, o.recargo])).toEqual([
      ['Papas fritas', 0],
      ['Papas con cheddar', 800],
    ])
  })

  test('la diferencia se calcula con los precios del tamaño elegido', () => {
    const opciones = opcionesDeGrupo(ACOMPANIAMIENTO, CATALOGO, 2)

    expect(opciones.find((o) => o.id === 22)?.recargo).toBe(1000) // 3400 − 2400
  })

  test('no ofrece productos no disponibles', () => {
    const ids = opcionesDeGrupo(ACOMPANIAMIENTO, CATALOGO, 1).map((o) => o.id)

    expect(ids).not.toContain(23)
  })

  test('solo ofrece productos de la categoría del grupo', () => {
    const ids = opcionesDeGrupo(ACOMPANIAMIENTO, CATALOGO, 1).map((o) => o.id)

    expect(ids).toEqual([21, 22])
  })

  test('en un grupo que no cobra diferencia (bebidas), todas las opciones cuestan lo mismo', () => {
    const opciones = opcionesDeGrupo(BEBIDA, CATALOGO, 1)

    expect(opciones.map((o) => o.recargo)).toEqual([0, 0])
  })

  test('usa el ícono del grupo o uno genérico', () => {
    expect(opcionesDeGrupo(ACOMPANIAMIENTO, CATALOGO, 1)[0].icono).toBe('🍟')
    expect(opcionesDeGrupo(BEBIDA, CATALOGO, 1)[0].icono).toBe('🍽️')
  })

  test('si ningún producto se vende en ese tamaño, no hay opciones', () => {
    expect(opcionesDeGrupo(ACOMPANIAMIENTO, CATALOGO, 3)).toEqual([])
  })
})

describe('eleccionPorDefecto', () => {
  const opcion = (id: number, recargo: number): OpcionElegible => ({ id, nombre: `P${id}`, recargo, icono: '🍽️' })

  test('elige la opción incluida en el combo', () => {
    expect(eleccionPorDefecto(ACOMPANIAMIENTO, [opcion(22, 800), opcion(21, 0)])).toBe(21)
  })

  test('si la incluida no está disponible, elige la primera sin recargo', () => {
    const grupo = { ...ACOMPANIAMIENTO, productoIncluidoId: 99 }

    expect(eleccionPorDefecto(grupo, [opcion(22, 800), opcion(24, 0)])).toBe(24)
  })

  test('si todas tienen recargo, elige la primera', () => {
    const grupo = { ...ACOMPANIAMIENTO, productoIncluidoId: 99 }

    expect(eleccionPorDefecto(grupo, [opcion(22, 800), opcion(24, 300)])).toBe(22)
  })

  test('sin opciones no hay elección', () => {
    expect(eleccionPorDefecto(ACOMPANIAMIENTO, [])).toBeUndefined()
  })
})

describe('textoSin', () => {
  test.each([
    ['Una bebida', 'Sin bebida'],
    ['Acompañamiento', 'Sin acompañamiento'],
    ['El postre', 'Sin postre'],
    ['La salsa', 'Sin salsa'],
    ['Un aderezo', 'Sin aderezo'],
  ])('"%s" → "%s"', (nombre, esperado) => {
    expect(textoSin({ ...ACOMPANIAMIENTO, nombre })).toBe(esperado)
  })
})