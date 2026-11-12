'use strict';

const { paraStock } = require('../destinatarios');
const { normalizarMinimo } = require('../../utils/stockMinimo');
const { esObjeto, texto, numero, enteroPositivo } = require('./comunes');

module.exports = Object.freeze({
    tipo: 'stock.bajo',
    version: 1,
    audiencias: ['admin'],
    paraAdministradores: true,

    construir(payload) {
        if (!esObjeto(payload)) {
            const error = new Error('stock.bajo requiere un payload');
            error.code = 'NOTIFICACION_INVALIDA';
            throw error;
        }

        const sucursalId = enteroPositivo(payload.sucursalId, 'sucursalId');

        return {
            datos: {
                sucursalId,
                sucursalNombre: texto(payload.sucursalNombre),
                insumoId: enteroPositivo(payload.insumoId, 'insumoId'),
                insumoNombre: texto(payload.insumoNombre),
                cantidad: numero(payload.cantidad),
                stockMinimo: normalizarMinimo(payload.stockMinimo),
            },
            destinos: paraStock({ sucursalId }),
        };
    },
});
