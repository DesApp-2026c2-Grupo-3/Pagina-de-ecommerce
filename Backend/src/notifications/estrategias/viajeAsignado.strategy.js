'use strict';

const { paraRepartidor } = require('../destinatarios');
const { esObjeto, enteroPositivo } = require('./comunes');

// El admin le reasigna a este repartidor un viaje que pidió asistencia
module.exports = Object.freeze({
    tipo: 'viaje.asignado',
    version: 1,
    audiencias: ['repartidor'],

    construir(payload) {
        if (!esObjeto(payload)) {
            const error = new Error('viaje.asignado requiere un payload');
            error.code = 'NOTIFICACION_INVALIDA';
            throw error;
        }

        const repartidorId = enteroPositivo(payload.repartidorId, 'repartidorId');

        return {
            datos: {
                viajeId: enteroPositivo(payload.viajeId, 'viajeId'),
                cantidadPedidos: Math.max(0, Number(payload.cantidadPedidos) || 0),
            },
            destinos: paraRepartidor({ repartidorId }),
        };
    },
});
