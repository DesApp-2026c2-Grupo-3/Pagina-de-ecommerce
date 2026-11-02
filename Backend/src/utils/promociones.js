const { Promocion, PromocionItem, Producto } = require('../models');

// Qué traer de la base para armar una promo con sus productos.
// conEliminados: el panel también ve los productos con borrado lógico (para avisar que la promo quedó rota);
// el resto de la app no, y una promo con un producto eliminado no se ofrece.
function incluirItems({ conEliminados = false } = {}) {
  return [{
    model: PromocionItem,
    as: 'items',
    include: [{
      model: Producto,
      as: 'producto',
      attributes: ['id', 'nombre', 'precio', 'disponible', 'deletedAt'],
      required: false,
      paranoid: !conEliminados,
    }],
  }];
}

const productoVigente = (item) => Boolean(item.producto) && !item.producto.deletedAt;

/** La promo se puede ofrecer: tiene productos y ninguno fue eliminado */
const promoCompleta = (promo) => (promo.items ?? []).length > 0 && promo.items.every(productoVigente);

const itemsOrdenados = (promo) => [...(promo.items ?? [])].sort((a, b) => a.orden - b.orden);

/** La promo como la usa la app de clientes y el pedido (el mismo formato que tenía config/promociones.js) */
function aPromoPublica(promo) {
  return {
    // El front y el carrito guardan el id como texto
    id: String(promo.id),
    tipo: promo.tipo,
    titulo: promo.titulo,
    destacado: promo.destacado,
    detalle: promo.detalle,
    ...(promo.tipo === 'DIA' ? { dias: promo.dias ?? [] } : {}),
    ...(promo.maxPorPedido ? { maxPorPedido: promo.maxPorPedido } : {}),
    ...(promo.compraMinima ? { compraMinima: promo.compraMinima } : {}),
    items: itemsOrdenados(promo).map((i) => ({
      nombre: i.producto ? i.producto.nombre : null,
      productoId: i.productoId,
      cantidad: i.cantidad,
      descuento: Number(i.descuento),
    })),
  };
}

/** La promo como la necesita el panel: con su estado y los productos eliminados marcados */
function aPromoAdmin(promo) {
  return {
    id: promo.id,
    tipo: promo.tipo,
    titulo: promo.titulo,
    destacado: promo.destacado,
    detalle: promo.detalle,
    dias: promo.dias ?? [],
    maxPorPedido: promo.maxPorPedido ?? null,
    compraMinima: promo.compraMinima ?? null,
    activo: promo.activo,
    // false si algún producto fue eliminado: la promo no se muestra a los clientes hasta arreglarla
    completa: promoCompleta(promo),
    items: itemsOrdenados(promo).map((i) => ({
      productoId: i.productoId,
      nombre: i.producto ? i.producto.nombre : null,
      precio: i.producto ? Number(i.producto.precio) : null,
      cantidad: i.cantidad,
      descuento: Number(i.descuento),
      eliminado: !productoVigente(i),
    })),
  };
}

/**
 * Busca una promo ACTIVA y completa, en formato público (null si no existe, está apagada o le falta un producto).
 * La usa el pedido para validar lo que viene en el carrito.
 */
async function buscarPromo(id) {
  const numero = Number(id);
  if (!Number.isInteger(numero) || numero < 1) return null;
  const promo = await Promocion.findByPk(numero, { include: incluirItems() });
  if (!promo || !promo.activo || !promoCompleta(promo)) return null;
  return aPromoPublica(promo);
}

module.exports = { incluirItems, promoCompleta, aPromoPublica, aPromoAdmin, buscarPromo };
