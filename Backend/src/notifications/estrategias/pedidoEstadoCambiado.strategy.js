'use strict';

const { paraEstadoPedido } = require('../destinatarios');
const { pedidoADto, esObjeto, texto } = require('./comunes');

module.exports = Object.freeze({
    tipo: 'pedido.estado_cambiado',
    version: 1,
    audiencias: ['cliente'],

    construir(payload) {
        if (!esObjeto(payload) || !esObjeto(payload.pedido)) {
            const error = new Error('pedido.estado_cambiado requiere un pedido');
            error.code = 'NOTIFICACION_INVALIDA';
            throw error;
        }

        const datos = pedidoADto(payload.pedido, payload.estadoAnterior ?? null);
        // Motivo de la cancelación (lo escribe el admin)
        if (payload.motivo) datos.motivo = texto(payload.motivo);
        
        return {
            datos,
            destinos: paraEstadoPedido({
                pedidoId: datos.pedidoId,
                usuarioId: datos.usuarioId,
            }),
        };
    },
});
