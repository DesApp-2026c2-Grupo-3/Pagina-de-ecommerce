'use strict';

const { paraSucursal } = require('../destinatarios');
const { esObjeto, texto, enteroPositivo } = require('./comunes');

module.exports = Object.freeze({
    tipo: 'sucursal.cerrada',
    version: 1,
    audiencias: ['admin', 'cliente'],
    paraAdministradores: true,

    construir(payload) {
        if (!esObjeto(payload)) {
            const error = new Error('sucursal.cerrada requiere un payload');
            error.code = 'NOTIFICACION_INVALIDA';
            throw error;
        }

        const sucursalId = enteroPositivo(payload.sucursalId, 'sucursalId');

        return {
            datos: {
                sucursalId,
                sucursalNombre: texto(payload.sucursalNombre),
            },
            destinos: paraSucursal({ sucursalId }),
        };
    },
});
