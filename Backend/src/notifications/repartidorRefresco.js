'use strict';

const { randomUUID } = require('crypto');
const { getIo } = require('../sockets');
const { SALAS } = require('../sockets/salas');

// Refrescos efímeros para la app del repartidor: no se guardan, solo dicen "volvé a cargar X".
const DOMINIOS = new Set(['pedidos_disponibles', 'viaje']);
const ACCIONES = new Set(['creado', 'actualizado', 'eliminado', 'estado_cambiado']);

function enteroPositivo(valor) {
    const numero = Number(valor);
    return Number.isInteger(numero) && numero > 0 ? numero : null;
}

function normalizarRecursos(recursos) {
    if (!recursos || typeof recursos !== 'object' || Array.isArray(recursos)) return undefined;

    const normalizados = {};
    for (const clave of ['pedidoId', 'viajeId']) {
        const valor = enteroPositivo(recursos[clave]);
        if (valor) normalizados[clave] = valor;
    }

    return Object.keys(normalizados).length > 0 ? normalizados : undefined;
}

// Con repartidorId va solo a ese repartidor; si no, a todos los de la sucursal.
// origenRepartidorId (D-21) dice qué repartidor provocó el cambio: le llega igual (su lista y su
// contador se actualizan), pero su app no le muestra el aviso de algo que hizo él mismo.
// Nunca lanza: un refresco perdido no puede romper la operación que lo origina.
function emitirRefrescoRepartidor({ dominio, accion, sucursalId, repartidorId, origenRepartidorId, recursos } = {}) {
    try {
        if (!DOMINIOS.has(dominio) || !ACCIONES.has(accion)) return false;

        const sucursal = enteroPositivo(sucursalId);
        if (!sucursal) return false;

        const repartidor = enteroPositivo(repartidorId);

        const io = getIo();
        if (!io) return false;

        const sala = repartidor
            ? SALAS.usuario('repartidor', repartidor)
            : SALAS.repartidorSucursal(sucursal);

        const evento = {
            version: 1,
            eventoId: randomUUID(),
            dominio,
            accion,
            ocurridoEn: new Date().toISOString(),
            sucursalId: sucursal,
        };

        const origen = enteroPositivo(origenRepartidorId);
        if (origen) evento.origenRepartidorId = origen;

        const recursosNormalizados = normalizarRecursos(recursos);
        if (recursosNormalizados) evento.recursos = recursosNormalizados;

        io.to(sala).emit('repartidor:refresco', evento);
        return true;
    } catch (error) {
        console.error('No se pudo emitir el refresco del repartidor:', error.message);
        return false;
    }
}

module.exports = {
    ACCIONES,
    DOMINIOS,
    emitirRefrescoRepartidor,
};
