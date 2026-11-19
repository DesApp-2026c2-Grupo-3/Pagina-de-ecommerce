'use strict';

const { paraRepartidor } = require('../destinatarios');
const { esObjeto, enteroPositivo } = require('./comunes');

// El admin le quita a este repartidor su viaje (que pidió asistencia) y se lo da a otro
module.exports = Object.freeze({
    tipo: 'viaje.reasignado',
    version: 1,
    audiencias: ['repartidor'],

    construir(payload) {
        if (!esObjeto(payload)) {
            const error = new Error('viaje.reasignado requiere un payload');
            error.code = 'NOTIFICACION_INVALIDA';
            throw error;
        }

        const repartidorId = enteroPositivo(payload.repartidorId, 'repartidorId');

        return {
            datos: {
                viajeId: enteroPositivo(payload.viajeId, 'viajeId'),
            },
            destinos: paraRepartidor({ repartidorId }),
        };
    },
});
