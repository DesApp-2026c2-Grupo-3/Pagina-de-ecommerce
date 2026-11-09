'use strict';

const { randomUUID } = require('crypto');
const { getIo } = require('../sockets');
const { SALAS } = require('../sockets/salas');

const DOMINIOS = new Set(['stock', 'pedidos', 'productos', 'sucursales', 'reportes']);
const ACCIONES = new Set(['creado', 'actualizado', 'eliminado', 'estado_cambiado']);

function normalizarRecursos(recursos) {
    if (!recursos || typeof recursos !== 'object' || Array.isArray(recursos)) return undefined;

    const normalizados = {};
    for (const clave of ['insumoId', 'pedidoId', 'productoId']) {
        const valor = Number(recursos[clave]);
        if (Number.isInteger(valor) && valor > 0) normalizados[clave] = valor;
    }

    return Object.keys(normalizados).length > 0 ? normalizados : undefined;
}

async function emitirRefrescoAdmin({
    dominio = 'stock',
    accion = 'actualizado',
    sucursalId = null,
    recursos,
} = {}) {
    try {
        if (!DOMINIOS.has(dominio) || !ACCIONES.has(accion)) return false;

        const sucursal = Number(sucursalId);
        const sucursalValida = Number.isInteger(sucursal) && sucursal > 0;
        if (dominio === 'stock' && !sucursalValida) return false;

        const io = getIo();
        if (!io) return false;

        const salas = sucursalValida
            ? [SALAS.adminSucursal(sucursal), SALAS.adminGlobal()]
            : [SALAS.adminGlobal()];

        const evento = {
            version: 1,
            eventoId: randomUUID(),
            dominio,
            accion,
            ocurridoEn: new Date().toISOString(),
            sucursalId: sucursalValida ? sucursal : null,
        };

        const recursosNormalizados = normalizarRecursos(recursos);
        if (recursosNormalizados) evento.recursos = recursosNormalizados;

        io.to(salas).emit('admin:refresco', evento);
        return true;
    } catch (error) {
        console.error('No se pudo emitir el refresco administrativo:', error.message);
        return false;
    }
}

module.exports = {
    ACCIONES,
    DOMINIOS,
    emitirRefrescoAdmin,
    normalizarRecursos,
};
