'use strict';

const { paraAsistencia } = require('../destinatarios');
const { esObjeto, texto, enteroPositivo, fechaIso } = require('./comunes');

// Un repartidor pidió ayuda: lo ven los admins de su sucursal y el MASTER
module.exports = Object.freeze({
    tipo: 'viaje.requiere_asistencia',
    version: 1,
    audiencias: ['admin'],

    construir(payload) {
        if (!esObjeto(payload)) {
            const error = new Error('viaje.requiere_asistencia requiere un payload');
            error.code = 'NOTIFICACION_INVALIDA';
            throw error;
        }

        const sucursalId = enteroPositivo(payload.sucursalId, 'sucursalId');

        return {
            datos: {
                viajeId: enteroPositivo(payload.viajeId, 'viajeId'),
                repartidorId: enteroPositivo(payload.repartidorId, 'repartidorId'),
                repartidorNombre: texto(payload.repartidorNombre),
                sucursalId,
                motivo: texto(payload.motivo),
                comentario: payload.comentario ? texto(payload.comentario) : null,
                solicitadaEn: fechaIso(payload.solicitadaEn),
            },
            destinos: paraAsistencia({ sucursalId }),
        };
    },
});
