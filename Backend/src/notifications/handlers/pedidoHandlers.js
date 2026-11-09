'use strict';

const { TIPOS } = require('../events');
const { paraEstadoPedido, paraPedidoCreado } = require('../destinatarios');
const { notificacionService } = require('../index');

function fechaIso(valor) {
    const fecha = valor ? new Date(valor) : new Date();
    return Number.isNaN(fecha.getTime()) ? new Date().toISOString() : fecha.toISOString();
}

function pedidoADto(pedido, estadoAnterior = null) {
    return {
        pedidoId: Number(pedido.id),
        usuarioId: Number(pedido.usuarioId),
        sucursalId: Number(pedido.sucursalId),
        estadoAnterior,
        estado: String(pedido.estado),
        total: Number(pedido.total),
        fecha: fechaIso(pedido.fecha),
    };
}

async function notificarPedidoCreado(pedido) {
    const datos = pedidoADto(pedido);
    const destinos = paraPedidoCreado({
        pedidoId: datos.pedidoId,
        usuarioId: datos.usuarioId,
        sucursalId: datos.sucursalId,
    });

    return notificacionService.publicar({
        tipo: TIPOS.PEDIDO_CREADO,
        datos,
        destinos,
    });
}

async function notificarEstadoPedido(pedido, estadoAnterior) {
    const datos = pedidoADto(pedido, estadoAnterior);
    const destinos = paraEstadoPedido({
        pedidoId: datos.pedidoId,
        usuarioId: datos.usuarioId,
    });

    return notificacionService.publicar({
        tipo: TIPOS.PEDIDO_ESTADO_CAMBIADO,
        datos,
        destinos,
    });
}

module.exports = { pedidoADto, notificarPedidoCreado, notificarEstadoPedido };
