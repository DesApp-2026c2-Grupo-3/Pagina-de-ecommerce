import { describe, expect, it } from 'vitest'
import { POR_PAGINA_PROMOCIONES } from '../../config/promociones'
import type { ItemPromoAdmin, PromocionAdmin } from '../../types/promocion.types'
import {
  contarPorEstadoPromo,
  contarPorTipo,
  esFiltroEstadoPromo,
  esFiltroTipoPromo,
  filtrarPromociones,
} from '../../utils/promociones/filtrarPromociones'
import { filaNuevoEnLaCarta } from '../../utils/promociones/nuevoEnLaCarta'
import { cuando, porcentaje, resumen } from '../../utils/promociones/textosPromocion'

function item(nombre: string | null, cantidad: number, descuento: number): ItemPromoAdmin {
  return { productoId: 1, nombre, precio: 1000, cantidad, descuento, eliminado: nombre === null }
}

function promo(id: number, tipo: PromocionAdmin['tipo'], titulo: string, extra: Partial<PromocionAdmin> = {}): PromocionAdmin {
  return {
    id, tipo, titulo, destacado: '20%', detalle: '', dias: [], maxPorPedido: null, compraMinima: null,
    activo: true, completa: true, items: [item('Fast Cheese', 1, 0.2)], ...extra,
  }
}

const lista = [
  promo(5, 'DIA', 'Domingo familiar', { dias: [0] }),
  promo(4, 'DIA', 'Martes doble', { dias: [4, 2], items: [item('Hamburguesa Bacon', 2, 0), item('Hamburguesa Bacon', 1, 1)] }),
  promo(3, 'REGALO', 'Papas de regalo', { activo: false }),
  promo(2, 'SEMANA', 'Fast Cheese de la semana'),
  promo(6, 'DIA', 'Lunes de helado', { dias: [1], completa: false, items: [item(null, 1, 0.5)] }),
]

describe('textos de la promoción (misma lógica que antes)', () => {
  it('cuándo: días en orden lunes→domingo, o toda la semana', () => {
    expect(cuando(lista[1])).toBe('Mar · Jue')
    expect(cuando(lista[0])).toBe('Dom')
    expect(cuando(lista[3])).toBe('Toda la semana')
  })
  it('incluye: gratis, porcentaje y producto eliminado', () => {
    expect(resumen(lista[1])).toBe('2× Hamburguesa Bacon · 1× Hamburguesa Bacon gratis')
    expect(resumen(lista[3])).toBe('1× Fast Cheese (20% menos)')
    expect(resumen(lista[4])).toBe('1× Producto eliminado (50% menos)')
    expect(porcentaje(0.125)).toBe('12.5%')
  })
})

describe('filtro y orden de la lista', () => {
  const todos = { busqueda: '', tipo: 'todos' as const, estado: 'todos' as const }
  it('ordena por tipo, primer día (lunes primero) e id', () => {
    expect(filtrarPromociones(lista, todos).map((p) => p.id)).toEqual([2, 3, 6, 4, 5])
  })
  it('filtra por tipo y por estado («Activas» incluye las ocultas, como hoy)', () => {
    expect(filtrarPromociones(lista, { ...todos, tipo: 'DIA' }).map((p) => p.id)).toEqual([6, 4, 5])
    expect(filtrarPromociones(lista, { ...todos, estado: 'activas' }).map((p) => p.id)).toEqual([2, 6, 4, 5])
    expect(filtrarPromociones(lista, { ...todos, estado: 'deshabilitadas' }).map((p) => p.id)).toEqual([3])
  })
  it('busca por título o por producto', () => {
    expect(filtrarPromociones(lista, { ...todos, busqueda: ' bacon ' }).map((p) => p.id)).toEqual([4])
    expect(filtrarPromociones(lista, { ...todos, busqueda: 'REGALO' }).map((p) => p.id)).toEqual([3])
  })
  it('no modifica la lista original', () => {
    filtrarPromociones(lista, todos)
    expect(lista[0].id).toBe(5)
  })
})

describe('contadores de los menús', () => {
  it('por tipo, sobre el estado elegido', () => {
    expect(contarPorTipo(lista, { busqueda: '', estado: 'todos' })).toEqual({ todos: 5, SEMANA: 1, REGALO: 1, NUEVO: 0, DIA: 3 })
    expect(contarPorTipo(lista, { busqueda: '', estado: 'activas' })).toEqual({ todos: 4, SEMANA: 1, REGALO: 0, NUEVO: 0, DIA: 3 })
  })
  it('por estado, sobre el tipo y la búsqueda elegidos', () => {
    expect(contarPorEstadoPromo(lista, { busqueda: '', tipo: 'REGALO' })).toEqual({ todos: 1, activas: 0, deshabilitadas: 1 })
    expect(contarPorEstadoPromo(lista, { busqueda: 'helado', tipo: 'todos' })).toEqual({ todos: 1, activas: 1, deshabilitadas: 0 })
  })
  it('valores válidos de la URL y 10 por página', () => {
    expect(esFiltroTipoPromo('DIA')).toBe(true)
    expect(esFiltroTipoPromo('dia')).toBe(false)
    expect(esFiltroEstadoPromo('activas')).toBe(true)
    expect(esFiltroEstadoPromo('todas')).toBe(false)
    expect(POR_PAGINA_PROMOCIONES).toBe(10)
  })
})

describe('«Nuevo en la carta» (PR #78)', () => {
  const productos = [{ id: 9, nombre: 'Doble Cheddar', precio: '5200' }]
  const nuevo = filaNuevoEnLaCarta(9, productos)!
  it('arma la fila con el producto elegido, activa y sin descuento', () => {
    expect(nuevo).toMatchObject({ id: -1, tipo: 'NUEVO', titulo: 'Doble Cheddar', destacado: 'Nuevo', activo: true })
    expect(resumen(nuevo)).toBe('Doble Cheddar (sin descuento)')
    expect(cuando(nuevo)).toBe('Toda la semana')
  })
  it('no hay fila sin producto elegido o si el producto ya no está', () => {
    expect(filaNuevoEnLaCarta(null, productos)).toBe(null)
    expect(filaNuevoEnLaCarta(3, productos)).toBe(null)
  })
  it('va entre el regalo y las promos del día, y se cuenta en su tipo y en «Activas»', () => {
    const conNuevo = [...lista, nuevo]
    expect(filtrarPromociones(conNuevo, { busqueda: '', tipo: 'todos', estado: 'todos' }).map((p) => p.id)).toEqual([2, 3, -1, 6, 4, 5])
    expect(contarPorTipo(conNuevo, { busqueda: '', estado: 'todos' }).NUEVO).toBe(1)
    expect(contarPorEstadoPromo(conNuevo, { busqueda: '', tipo: 'NUEVO' })).toEqual({ todos: 1, activas: 1, deshabilitadas: 0 })
    expect(esFiltroTipoPromo('NUEVO')).toBe(true)
  })
})

describe('«Nuevo en la carta»: lo que ve el cliente según su producto', () => {
  const categorias = [{ id: 1, activo: true }, { id: 2, activo: false }]
  it('producto deshabilitado: se ve en la tienda, pero no se puede comprar', () => {
    const fila = filaNuevoEnLaCarta(9, [{ id: 9, nombre: 'X', precio: 1, disponible: false, categoriaId: 1 }], categorias)!
    expect(fila.aviso).toBe('producto-deshabilitado')
    expect(fila.completa).toBe(true)
  })
  it('categoría deshabilitada: el bloque no se muestra (gana sobre el producto deshabilitado)', () => {
    const fila = filaNuevoEnLaCarta(9, [{ id: 9, nombre: 'X', precio: 1, disponible: false, categoriaId: 2 }], categorias)!
    expect(fila.aviso).toBe('categoria-deshabilitada')
    expect(fila.completa).toBe(false)
  })
  it('todo habilitado: sin aviso', () => {
    expect(filaNuevoEnLaCarta(9, [{ id: 9, nombre: 'X', precio: 1, disponible: true, categoriaId: 1 }], categorias)!.aviso).toBe(undefined)
  })
})
