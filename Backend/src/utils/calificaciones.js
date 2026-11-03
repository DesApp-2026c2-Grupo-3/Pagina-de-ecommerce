const { Op } = require('sequelize');
const { Pedido, DetallePedido, Producto, Sucursal, Calificacion, historialDeTiemposPedido } = require('../models');
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

/**
 * La calificación que le toca ofrecer al cliente: su ÚLTIMO pedido, si está entregado, ya pasó el tiempo
 * mínimo, no venció el plazo y todavía no lo calificó. Si hizo un pedido nuevo, el anterior deja de ofrecerse.
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

    const detalle = await DetallePedido.findAll({
        where: { pedidoId: ultimo.id },
        include: [{ model: Producto, attributes: ['id', 'nombre'], paranoid: false }],
    });
    const sucursal = ultimo.sucursalId
        ? await Sucursal.findByPk(ultimo.sucursalId, { attributes: ['id', 'nombre'] })
        : null;

    return {
        pedidoId: ultimo.id,
        fecha: ultimo.fecha,
        entregadoEn: entregado,
        total: Number(ultimo.total),
        sucursal: sucursal ? { id: sucursal.id, nombre: sucursal.nombre } : null,
        productos: [...new Set(detalle.map((d) => d.Producto?.nombre).filter(Boolean))],
    };
}

module.exports = { estaEntregado, entregadoEn, buscarPendiente };
