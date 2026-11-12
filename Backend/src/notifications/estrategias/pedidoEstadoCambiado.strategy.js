'use strict';

const { paraEstadoPedido } = require('../destinatarios');
const { pedidoADto, esObjeto } = require('./comunes');

module.exports = Object.freeze({
    tipo: 'pedido.estado_cambiado',
    version: 1,
    audiencias: ['cliente'],
    paraAdministradores: false,

    construir(payload) {
        if (!esObjeto(payload) || !esObjeto(payload.pedido)) {
            const error = new Error('pedido.estado_cambiado requiere un pedido');
            error.code = 'NOTIFICACION_INVALIDA';
            throw error;
        }

        const datos = pedidoADto(payload.pedido, payload.estadoAnterior ?? null);

        return {
            datos,
            destinos: paraEstadoPedido({
                pedidoId: datos.pedidoId,
                usuarioId: datos.usuarioId,
            }),
        };
    },
});
