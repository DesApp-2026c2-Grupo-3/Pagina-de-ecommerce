'use strict';

const { TIPOS } = require('../events');
const { paraStock } = require('../destinatarios');
const { notificacionService } = require('../index');
const { normalizarMinimo } = require('../../utils/stockMinimo');

function numero(valor, defecto = 0) {
    const n = Number(valor);
    return Number.isFinite(n) ? n : defecto;
}

async function notificarStockBajo({
    sucursalId,
    sucursalNombre,
    insumoId,
    insumoNombre,
    cantidad,
    stockMinimo,
}) {
    const id = Number(sucursalId);

    return notificacionService.publicar({
        tipo: TIPOS.STOCK_BAJO,
        datos: {
            sucursalId: id,
            sucursalNombre: String(sucursalNombre ?? ''),
            insumoId: Number(insumoId),
            insumoNombre: String(insumoNombre ?? ''),
            cantidad: numero(cantidad),
            stockMinimo: normalizarMinimo(stockMinimo),
        },
        destinos: paraStock({ sucursalId: id }),
    });
}

module.exports = { notificarStockBajo };
