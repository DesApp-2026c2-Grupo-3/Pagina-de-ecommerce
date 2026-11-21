// Mecánicas de las promos del día: cómo las piensa el encargado ("2×1", "combo familiar"...)
// y cómo las guarda el backend (filas { productoId, cantidad, descuento } con descuento por unidad, 0 a 1).
// Todo el armado de títulos, círculo ("2×1", "20%") y detalle sale de acá, así el panel y la tienda dicen lo mismo.

import type { PromocionAdmin } from '../types/promocion.types'

export interface ProductoOpcion {
  id: number
  nombre: string
  precio: number
}

export type TipoMecanica = 'descuento' | 'llevaMas' | 'conOtro' | 'combo'

export const MECANICAS: { valor: TipoMecanica; titulo: string; ayuda: string }[] = [
  { valor: 'descuento', titulo: 'Descuento', ayuda: 'Un producto con % off' },
  { valor: 'llevaMas', titulo: 'Llevá más', ayuda: '2×1, 3×2, 2da al 50%' },
  { valor: 'conOtro', titulo: 'Con otro producto', ayuda: 'Comprás uno y el otro va gratis o con %' },
  { valor: 'combo', titulo: 'Combo', ayuda: 'Varios productos, un precio' },
]

// Ofertas predeterminadas de "Llevá más": n unidades del mismo producto y cuánto se paga
export const OFERTAS = {
  '2x1': { unidades: 2, paga: 1, etiqueta: '2×1', circulo: '2×1' },
  '3x2': { unidades: 3, paga: 2, etiqueta: '3×2', circulo: '3×2' },
  '4x3': { unidades: 4, paga: 3, etiqueta: '4×3', circulo: '4×3' },
  '2da50': { unidades: 2, paga: 1.5, etiqueta: '2da al 50%', circulo: '2da 50%' },
  '2da70': { unidades: 2, paga: 1.3, etiqueta: '2da al 70%', circulo: '2da 70%' },
} as const
export type Oferta = keyof typeof OFERTAS

export interface FilaCombo {
  productoId: number | null
  cantidad: number
}

/** El estado del editor de una promo del día */
export interface MecanicaPromo {
  tipo: TipoMecanica
  // descuento / llevaMas / conOtro: el producto principal
  productoId: number | null
  cantidad: number
  /** % de 1 a 100 (descuento: sobre el producto; conOtro: sobre el segundo; combo: sobre el total) */
  porcentaje: number
  oferta: Oferta
  // conOtro: el segundo producto
  otroId: number | null
  otroCantidad: number
  // combo
  filas: FilaCombo[]
  modoPrecio: 'porcentaje' | 'precioFinal'
  precioFinal: number | null
}

export const mecanicaVacia = (): MecanicaPromo => ({
  tipo: 'descuento',
  productoId: null,
  cantidad: 1,
  porcentaje: 20,
  oferta: '2x1',
  otroId: null,
  otroCantidad: 1,
  filas: [
    { productoId: null, cantidad: 1 },
    { productoId: null, cantidad: 1 },
  ],
  modoPrecio: 'porcentaje',
  precioFinal: null,
})

export interface ItemPedido {
  productoId: number
  cantidad: number
  descuento: number
}

const redondear3 = (n: number) => Math.round(n * 1000) / 1000
const cerca = (a: number, b: number) => Math.abs(a - b) < 0.006

// ---------- Del editor al backend ----------

/** Las filas que se guardan. null si falta algún dato (el editor valida antes) */
export function aItems(m: MecanicaPromo, productos: ProductoOpcion[]): ItemPedido[] | null {
  if (m.tipo === 'descuento') {
    if (m.productoId == null) return null
    return [{ productoId: m.productoId, cantidad: m.cantidad, descuento: m.porcentaje / 100 }]
  }
  if (m.tipo === 'llevaMas') {
    if (m.productoId == null) return null
    const o = OFERTAS[m.oferta]
    return [{ productoId: m.productoId, cantidad: o.unidades, descuento: redondear3(1 - o.paga / o.unidades) }]
  }
  if (m.tipo === 'conOtro') {
    if (m.productoId == null || m.otroId == null) return null
    return [
      { productoId: m.productoId, cantidad: m.cantidad, descuento: 0 },
      { productoId: m.otroId, cantidad: m.otroCantidad, descuento: m.porcentaje / 100 },
    ]
  }
  // combo: el mismo descuento para todo (si se puso precio final, se pasa a %)
  const filas = m.filas.filter((f): f is { productoId: number; cantidad: number } => f.productoId != null)
  if (filas.length === 0) return null
  const descuento = descuentoCombo(m, productos)
  return filas.map((f) => ({ productoId: f.productoId, cantidad: f.cantidad, descuento }))
}

function descuentoCombo(m: MecanicaPromo, productos: ProductoOpcion[]) {
  if (m.modoPrecio === 'porcentaje') return m.porcentaje / 100
  const lista = precioListaCombo(m, productos)
  if (!lista || !m.precioFinal) return 0
  return redondear3(Math.min(1, Math.max(0, 1 - m.precioFinal / lista)))
}

const precioDe = (productos: ProductoOpcion[], id: number | null) => productos.find((p) => p.id === id)?.precio ?? 0
const nombreDe = (productos: ProductoOpcion[], id: number | null) => productos.find((p) => p.id === id)?.nombre ?? ''

function precioListaCombo(m: MecanicaPromo, productos: ProductoOpcion[]) {
  return m.filas.reduce((s, f) => s + precioDe(productos, f.productoId) * f.cantidad, 0)
}

// ---------- Precios (para la vista previa) ----------

export function precios(m: MecanicaPromo, productos: ProductoOpcion[]) {
  const items = aItems(m, productos)
  if (!items) return null
  const lista = items.reduce((s, i) => s + precioDe(productos, i.productoId) * i.cantidad, 0)
  const conPromo = items.reduce((s, i) => s + Math.round(precioDe(productos, i.productoId) * (1 - i.descuento)) * i.cantidad, 0)
  return { lista, conPromo, ahorro: lista > 0 ? Math.round((1 - conPromo / lista) * 100) : 0 }
}

// ---------- Textos automáticos ----------

const conCantidad = (cantidad: number, nombre: string) => (cantidad > 1 ? `${cantidad} ${nombre}` : nombre)

/** Lo que va en el círculo (el backend acepta hasta 10 caracteres) */
export function circulo(m: MecanicaPromo, productos: ProductoOpcion[]): string {
  if (m.tipo === 'descuento') return `${m.porcentaje}%`
  if (m.tipo === 'llevaMas') return OFERTAS[m.oferta].circulo
  if (m.tipo === 'conOtro') {
    if (m.porcentaje < 100) return `${m.porcentaje}%`
    const palabra = nombreDe(productos, m.otroId).split(' ')[0]?.toLowerCase() ?? ''
    return palabra ? `+${palabra}`.slice(0, 10) : 'Gratis'
  }
  const p = precios(m, productos)
  return p && p.ahorro > 0 ? `${p.ahorro}%` : 'Combo'
}

export function tituloSugerido(m: MecanicaPromo, productos: ProductoOpcion[]): string {
  const a = nombreDe(productos, m.productoId)
  const b = nombreDe(productos, m.otroId)
  let texto = ''
  if (m.tipo === 'descuento' && a) texto = `${conCantidad(m.cantidad, a)} al ${m.porcentaje}% off`
  if (m.tipo === 'llevaMas' && a) {
    texto = m.oferta.startsWith('2da')
      ? `2da unidad de ${a} al ${m.oferta === '2da50' ? 50 : 70}% off`
      : `${OFERTAS[m.oferta].etiqueta} en ${a}`
  }
  if (m.tipo === 'conOtro' && a && b) {
    texto =
      m.porcentaje >= 100
        ? `${conCantidad(m.cantidad, a)} + ${conCantidad(m.otroCantidad, b)} de regalo`
        : `${conCantidad(m.cantidad, a)} + ${conCantidad(m.otroCantidad, b)} al ${m.porcentaje}% off`
  }
  if (m.tipo === 'combo') {
    const filas = m.filas.filter((f) => f.productoId != null)
    if (filas.length > 0) {
      texto = 'Combo: ' + filas.map((f) => conCantidad(f.cantidad, nombreDe(productos, f.productoId))).join(' + ')
      if (texto.length > 60) texto = `Combo de ${filas.reduce((s, f) => s + f.cantidad, 0)} productos`
    }
  }
  return texto.slice(0, 60)
}

/** El texto chico de la tarjeta (el backend pide entre 5 y 200 caracteres) */
export function detalleSugerido(m: MecanicaPromo, productos: ProductoOpcion[]): string {
  const a = nombreDe(productos, m.productoId)
  const b = nombreDe(productos, m.otroId)
  let texto = ''
  if (m.tipo === 'descuento') texto = `${conCantidad(m.cantidad, a)} con ${m.porcentaje}% de descuento.`
  if (m.tipo === 'llevaMas') {
    const o = OFERTAS[m.oferta]
    texto = m.oferta.startsWith('2da')
      ? `Llevás 2 ${a} y la segunda sale ${m.oferta === '2da50' ? 50 : 70}% menos.`
      : `Llevás ${o.unidades} ${a} y pagás ${o.paga}.`
  }
  if (m.tipo === 'conOtro') {
    texto =
      m.porcentaje >= 100
        ? `Pedí ${conCantidad(m.cantidad, a)} y te regalamos ${conCantidad(m.otroCantidad, b)}.`
        : `Pedí ${conCantidad(m.cantidad, a)} y ${conCantidad(m.otroCantidad, b)} sale ${m.porcentaje}% menos.`
  }
  if (m.tipo === 'combo') {
    const incluye = m.filas
      .filter((f) => f.productoId != null)
      .map((f) => `${f.cantidad} ${nombreDe(productos, f.productoId)}`)
      .join(', ')
    texto = `Incluye ${incluye}.`
  }
  return texto.length >= 5 ? texto.slice(0, 200) : 'Promo del día.'
}

// ---------- Del backend al editor (para editar una promo que ya existe) ----------

/**
 * Reconoce la mecánica de una promo guardada. Las promos viejas que no encajan en ninguna
 * (descuentos distintos en cada producto) se abren como combo con el descuento promedio.
 */
export function desdePromo(p: PromocionAdmin): { mecanica: MecanicaPromo; aproximada: boolean } {
  const m = mecanicaVacia()
  const items = p.items
  const [uno, dos] = items

  if (items.length === 1) {
    for (const [clave, o] of Object.entries(OFERTAS) as [Oferta, (typeof OFERTAS)[Oferta]][]) {
      if (uno.cantidad === o.unidades && cerca(uno.descuento, 1 - o.paga / o.unidades)) {
        return { mecanica: { ...m, tipo: 'llevaMas', productoId: uno.productoId, oferta: clave }, aproximada: false }
      }
    }
    return {
      mecanica: { ...m, tipo: 'descuento', productoId: uno.productoId, cantidad: uno.cantidad, porcentaje: Math.round(uno.descuento * 100) },
      aproximada: false,
    }
  }

  if (items.length === 2 && uno.descuento === 0 && dos.descuento > 0) {
    return {
      mecanica: {
        ...m,
        tipo: 'conOtro',
        productoId: uno.productoId,
        cantidad: uno.cantidad,
        otroId: dos.productoId,
        otroCantidad: dos.cantidad,
        porcentaje: Math.round(dos.descuento * 100),
      },
      aproximada: false,
    }
  }

  // Combo: el mismo descuento para todos (si no, el promedio ponderado por precio)
  const iguales = items.every((i) => cerca(i.descuento, uno.descuento))
  const lista = items.reduce((s, i) => s + (i.precio ?? 0) * i.cantidad, 0)
  const promedio = iguales || lista === 0
    ? uno.descuento
    : items.reduce((s, i) => s + (i.precio ?? 0) * i.cantidad * i.descuento, 0) / lista
  return {
    mecanica: {
      ...m,
      tipo: 'combo',
      filas: items.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad })),
      modoPrecio: 'porcentaje',
      porcentaje: Math.max(1, Math.round(promedio * 100)),
    },
    aproximada: !iguales,
  }
}

// ---------- Validación (los mismos límites que el backend) ----------

export type ErroresMecanica = Partial<Record<'producto' | 'otro' | 'porcentaje' | 'filas' | 'precio', string>>

export function validarMecanica(m: MecanicaPromo, productos: ProductoOpcion[]): ErroresMecanica {
  const e: ErroresMecanica = {}
  if (m.tipo !== 'combo' && m.productoId == null) e.producto = 'Elegí un producto'
  if (m.tipo === 'descuento' && !(m.porcentaje >= 1 && m.porcentaje <= 90)) e.porcentaje = 'Poné un descuento entre 1 y 90 %'
  if (m.tipo === 'conOtro') {
    if (m.otroId == null) e.otro = 'Elegí el otro producto'
    else if (m.otroId === m.productoId) e.otro = 'Es el mismo producto: para eso usá "Llevá más"'
    if (!(m.porcentaje >= 1 && m.porcentaje <= 100)) e.porcentaje = 'Entre 1 y 100 % (100 = gratis)'
  }
  if (m.tipo === 'combo') {
    const elegidas = m.filas.filter((f) => f.productoId != null)
    if (elegidas.length < 2) e.filas = 'Un combo lleva al menos 2 productos distintos'
    else if (new Set(elegidas.map((f) => f.productoId)).size !== elegidas.length) {
      e.filas = 'Hay un producto repetido: subile la cantidad en vez de repetirlo'
    } else if (m.modoPrecio === 'porcentaje' && !(m.porcentaje >= 1 && m.porcentaje <= 90)) {
      e.precio = 'Poné un descuento entre 1 y 90 %'
    } else if (m.modoPrecio === 'precioFinal') {
      const lista = precioListaCombo(m, productos)
      if (!m.precioFinal || m.precioFinal <= 0) e.precio = 'Poné el precio final del combo'
      else if (m.precioFinal >= lista) e.precio = `Tiene que ser menor a lo que sale separado ($${lista.toLocaleString('es-AR')})`
    }
  }
  return e
}
