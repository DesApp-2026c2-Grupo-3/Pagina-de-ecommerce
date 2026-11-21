'use strict';

const { paraRepartidor } = require('../destinatarios');
const { esObjeto, enteroPositivo } = require('./comunes');

// D-08: el admin canceló un pedido que este repartidor tenía en su viaje en preparación
module.exports = Object.freeze({
    tipo: 'pedido.cancelado_en_viaje',
    version: 1,
    audiencias: ['repartidor'],

    construir(payload) {
        if (!esObjeto(payload)) {
            const error = new Error('pedido.cancelado_en_viaje requiere un payload');
            error.code = 'NOTIFICACION_INVALIDA';
            throw error;
        }

        const repartidorId = enteroPositivo(payload.repartidorId, 'repartidorId');

        return {
            datos: {
                pedidoId: enteroPositivo(payload.pedidoId, 'pedidoId'),
                viajeId: enteroPositivo(payload.viajeId, 'viajeId'),
                viajeEliminado: payload.viajeEliminado === true,
            },
            destinos: paraRepartidor({ repartidorId }),
        };
    },
});
