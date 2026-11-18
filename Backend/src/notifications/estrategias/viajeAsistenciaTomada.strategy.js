'use strict';

const { paraAsistencia } = require('../destinatarios');
const { esObjeto, texto, numero, enteroPositivo, fechaIso } = require('./comunes');

// D-19: el repartidor que va a asistir confirmó que recibió el viaje reasignado.
// La ven los mismos que vieron el pedido de ayuda: admins de la sucursal y el MASTER.
module.exports = Object.freeze({
    tipo: 'viaje.asistencia_tomada',
    version: 1,
    audiencias: ['admin'],

    construir(payload) {
        if (!esObjeto(payload)) {
            const error = new Error('viaje.asistencia_tomada requiere un payload');
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
                cantidadPedidos: Math.max(0, Math.trunc(numero(payload.cantidadPedidos))),
                tomadaEn: fechaIso(payload.tomadaEn),
            },
            destinos: paraAsistencia({ sucursalId }),
        };
    },
});
