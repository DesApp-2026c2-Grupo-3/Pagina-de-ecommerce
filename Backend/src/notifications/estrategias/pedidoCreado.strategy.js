'use strict';

const { paraPedidoCreado } = require('../destinatarios');
const { pedidoADto, esObjeto } = require('./comunes');

module.exports = Object.freeze({
    tipo: 'pedido.creado',
    version: 1,
    audiencias: ['admin', 'cliente'],
    paraAdministradores: true,

    construir(payload) {
        if (!esObjeto(payload) || !esObjeto(payload.pedido)) {
            const error = new Error('pedido.creado requiere un pedido');
            error.code = 'NOTIFICACION_INVALIDA';
            throw error;
        }

        const datos = pedidoADto(payload.pedido);

        return {
            datos,
            destinos: paraPedidoCreado({
                pedidoId: datos.pedidoId,
                usuarioId: datos.usuarioId,
                sucursalId: datos.sucursalId,
            }),
        };
    },
});
