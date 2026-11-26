import type { AvisoNuevo, FilaPromocion } from '../../types/promocion.types'

// Lo mínimo que se usa de GET /admin/productos y GET /admin/categorias
interface ProductoCatalogo {
  id: number
  nombre: string
  precio: number | string
  disponible?: boolean
  categoriaId?: number | null
}
interface CategoriaCatalogo {
  id: number
  activo: boolean
}

// Id fijo de la fila: las promociones reales siempre tienen id positivo
export const ID_NUEVO_EN_LA_CARTA = -1

// Lo que ve el cliente, con la misma lógica que la tienda (GET /productos):
// sin la categoría activa el producto no llega al catálogo y el bloque no se muestra;
// deshabilitado sí llega, pero no se puede comprar
function avisoDe(producto: ProductoCatalogo, categorias: CategoriaCatalogo[]): AvisoNuevo | undefined {
  const categoria = categorias.find((c) => c.id === producto.categoriaId)
  if (categoria && !categoria.activo) return 'categoria-deshabilitada'
  if (producto.disponible === false) return 'producto-deshabilitado'
  return undefined
}

// Arma la fila «Nuevo en la carta» (PR #78) con el producto elegido.
// Sin producto elegido, o si fue eliminado (ya no viene en la lista), la fila no se muestra.
export function filaNuevoEnLaCarta(
  productoId: number | null,
  productos: ProductoCatalogo[],
  categorias: CategoriaCatalogo[] = [],
): FilaPromocion | null {
  if (productoId === null) return null
  const producto = productos.find((p) => p.id === productoId)
  if (!producto) return null
  const aviso = avisoDe(producto, categorias)
  return {
    id: ID_NUEVO_EN_LA_CARTA,
    tipo: 'NUEVO',
    titulo: producto.nombre,
    destacado: 'Nuevo',
    detalle: '',
    dias: [],
    maxPorPedido: null,
    compraMinima: null,
    activo: true,
    // Igual que una promo con un producto eliminado: el cliente no la ve
    completa: aviso !== 'categoria-deshabilitada',
    aviso,
    items: [
      { productoId: producto.id, nombre: producto.nombre, precio: Number(producto.precio), cantidad: 1, descuento: 0, eliminado: false },
    ],
  }
}
