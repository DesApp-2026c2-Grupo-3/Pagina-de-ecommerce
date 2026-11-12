'use strict';

const { fabrica } = require('../index');

function notificarPedidoCreado(pedido) {
    return fabrica.publicarPorTipo('pedido.creado', { pedido });
}

function notificarEstadoPedido(pedido, estadoAnterior) {
    return fabrica.publicarPorTipo('pedido.estado_cambiado', {
        pedido,
        estadoAnterior,
    });
}

module.exports = { notificarPedidoCreado, notificarEstadoPedido };
