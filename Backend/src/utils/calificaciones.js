const { Op } = require('sequelize');
const { Pedido, DetallePedido, Producto, Categoria, Sucursal, Calificacion, historialDeTiemposPedido } = require('../models');
const { estadoDeLaVentana } = require('../config/calificaciones');

// Los pedidos viejos pueden tener el estado en minúscula: se compara sin importar mayúsculas
const estaEntregado = (pedido) => String(pedido?.estado ?? '').toLowerCase() === 'entregado';

/** Cuándo pasó el pedido a "Entregado" (según la línea de tiempo), o null si no hay registro */
async function entregadoEn(pedidoId) {
    const registro = await historialDeTiemposPedido.findOne({
        where: { pedidoId, estado: { [Op.iLike]: 'entregado' } },
        order: [['fecha', 'DESC']],
        attributes: ['fecha'],
    });
    return registro ? registro.fecha : null;
}

// Las salsas gratuitas (complementos de precio 0) no se califican
const esSalsaGratuita = (detalle) =>
    Boolean(detalle.Producto?.categoria?.esComplemento) && Number(detalle.precio) === 0;

/**
 * Los productos del pedido que el cliente puede calificar, uno por producto (aunque lo haya pedido en varias líneas)
 * y en el orden en que están en el pedido: [{ productoId, nombre, imagen }]
 */
async function itemsCalificables(pedidoId) {
    const detalle = await DetallePedido.findAll({
        where: { pedidoId },
        order: [['id', 'ASC']],
        include: [{
            model: Producto,
            attributes: ['id', 'nombre', 'imagen'],
            paranoid: false,
            include: [{ model: Categoria, as: 'categoria', attributes: ['esComplemento'] }],
        }],
    });

    const vistos = new Set();
    const items = [];
    for (const linea of detalle) {
        const producto = linea.Producto;
        if (!producto || vistos.has(producto.id) || esSalsaGratuita(linea)) continue;
        vistos.add(producto.id);
        items.push({ productoId: producto.id, nombre: producto.nombre, imagen: producto.imagen ?? null });
    }
    return items;
}

/**
 * La calificación que le toca ofrecer al cliente: su ÚLTIMO pedido, si está entregado, ya pasó el tiempo
 * mínimo, no venció el plazo y todavía no lo calificó (y tiene algún producto calificable). Si hizo un pedido nuevo, el anterior deja de ofrecerse.
 * Devuelve null si no hay nada para calificar.
 */
async function buscarPendiente(usuarioId, ahora = new Date()) {
    const ultimo = await Pedido.findOne({
        where: { usuarioId },
        order: [['fecha', 'DESC'], ['id', 'DESC']],
        attributes: ['id', 'fecha', 'total', 'estado', 'sucursalId'],
    });
    if (!ultimo || !estaEntregado(ultimo)) return null;

    const entregado = await entregadoEn(ultimo.id);
    if (!entregado || estadoDeLaVentana(entregado, ahora) !== 'ABIERTA') return null;

    const yaCalificado = await Calificacion.findOne({ where: { pedidoId: ultimo.id }, attributes: ['id'] });
    if (yaCalificado) return null;

    // Un pedido que solo tiene salsas gratuitas no tiene nada para calificar
    const items = await itemsCalificables(ultimo.id);
    if (items.length === 0) return null;

    const sucursal = ultimo.sucursalId
        ? await Sucursal.findByPk(ultimo.sucursalId, { attributes: ['id', 'nombre'] })
        : null;

    return {
        pedidoId: ultimo.id,
        fecha: ultimo.fecha,
        entregadoEn: entregado,
        total: Number(ultimo.total),
        sucursal: sucursal ? { id: sucursal.id, nombre: sucursal.nombre } : null,
        items,
    };
}

module.exports = { estaEntregado, entregadoEn, itemsCalificables, buscarPendiente };
