import { TAMANIOS_AUTO } from '../../config/tamanios'
import type {
  CatalogoPedido,
  DetalleLinea,
  EleccionCombo,
  Personalizacion,
  ProductoCatalogo,
} from '../../types/pedido.types'
import { formatearPrecio } from './resumenPedido'

// Las columnas JSON pueden llegar como texto según la base
export function comoJson<T>(valor: T | string | null | undefined): T | null {
  if (valor == null) return null
  if (typeof valor !== 'string') return valor
  try {
    return JSON.parse(valor) as T
  } catch {
    return null
  }
}

export interface TraductorLineas {
  nombreProducto: (linea: DetalleLinea) => string
  // "Tamaño grande", "Papas: Papas con cheddar (+$800)", "Sin Cebolla", "+1 Cheddar"
  extras: (linea: DetalleLinea) => string[]
}

// Con el `catalogo` que manda el detalle se traducen ids a nombres.
// Si no viene, el detalle se muestra igual, con ids en lugar de nombres.
export function crearTraductorLineas(catalogo?: CatalogoPedido): TraductorLineas {
  const productos = new Map<number, ProductoCatalogo>(
    (catalogo?.productos ?? []).map((p) => [p.id, p]),
  )
  const insumos = new Map<number, string>(
    (catalogo?.insumos ?? []).map((i) => [i.id, i.nombre]),
  )
  const nombrePorId = (id: number) => productos.get(id)?.nombre ?? `Producto #${id}`
  const nombreInsumo = (id: number) => insumos.get(id) ?? `Insumo #${id}`

  function textosPersonalizacion(linea: DetalleLinea): string[] {
    const receta = productos.get(linea.productoId)?.receta ?? []
    return (comoJson<Personalizacion[]>(linea.personalizaciones) ?? []).map((p) => {
      const nombre = nombreInsumo(Number(p.insumoId))
      const base = receta.find((r) => r.insumoId === Number(p.insumoId))?.cantidadBase
      if (Number(p.cantidad) === 0) return `Sin ${nombre}`
      if (base != null && p.cantidad > base) return `+${p.cantidad - base} ${nombre}`
      return `${nombre} x${p.cantidad}`
    })
  }

  function textosCombo(linea: DetalleLinea): string[] {
    const grupos = productos.get(linea.productoId)?.grupos ?? []
    const elecciones =
      comoJson<{ elecciones?: EleccionCombo[] }>(linea.combo)?.elecciones ?? []
    return elecciones.map((e) => {
      const lugar = grupos.find((g) => g.id === e.grupoId)?.nombre ?? 'Opción'
      const recargo = Number(e.recargo ?? 0)
      const extra = recargo > 0 ? ` (+${formatearPrecio(recargo)})` : ''
      return `${lugar}: ${nombrePorId(e.productoId)}${extra}`
    })
  }

  return {
    nombreProducto: (linea) => linea.Producto?.nombre ?? nombrePorId(linea.productoId),
    extras: (linea) => {
      const tamanio = linea.tamanioId ? TAMANIOS_AUTO[linea.tamanioId]?.nombre : null
      return [
        ...(tamanio ? [`Tamaño ${tamanio.toLowerCase()}`] : []),
        ...textosCombo(linea),
        ...textosPersonalizacion(linea),
      ]
    },
  }
}

// Precio de lista por encima del cobrado: hubo promoción (RN-18, RF-49)
export function tuvoPromocion(linea: DetalleLinea): boolean {
  const lista = Number(linea.precioLista ?? 0)
  return lista > Number(linea.precio ?? 0)
}
