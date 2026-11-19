'use strict';

const { randomUUID } = require('crypto');
const { getIo } = require('../sockets');
const { SALAS } = require('../sockets/salas');

// Refrescos efímeros para la tienda (plan de clientes, C-6): no se guardan ni ocupan la campana,
// solo dicen "volvé a cargar X". La pantalla recarga por REST (DC-9).
//  - pedido: al cliente dueño del pedido (sala user:cliente:<id>).
//  - sucursal: a todos los clientes conectados. La sucursal de cada cliente es la de la zona que
//    eligió en el navegador, que el servidor no conoce: cada cliente compara con la suya.
const DOMINIOS = new Set(['pedido', 'sucursal']);
const ACCIONES = new Set(['creado', 'actualizado', 'estado_cambiado']);

function enteroPositivo(valor) {
    const numero = Number(valor);
    return Number.isInteger(numero) && numero > 0 ? numero : null;
}

// Nunca lanza: un refresco perdido no puede romper la operación que lo origina.
function emitirRefrescoCliente({ dominio, accion, usuarioId, sucursalId, pedidoId } = {}) {
    try {
        if (!DOMINIOS.has(dominio) || !ACCIONES.has(accion)) return false;

        const evento = {
            version: 1,
            eventoId: randomUUID(),
            dominio,
            accion,
            ocurridoEn: new Date().toISOString(),
        };

        let sala;
        if (dominio === 'pedido') {
            const usuario = enteroPositivo(usuarioId);
            const pedido = enteroPositivo(pedidoId);
            if (!usuario || !pedido) return false;
            sala = SALAS.usuario('cliente', usuario);
            evento.recursos = { pedidoId: pedido };
        } else {
            const sucursal = enteroPositivo(sucursalId);
            if (!sucursal) return false;
            sala = SALAS.rol('cliente');
            evento.sucursalId = sucursal;
        }

        const io = getIo();
        if (!io) return false;

        io.to(sala).emit('cliente:refresco', evento);
        return true;
    } catch (error) {
        console.error('No se pudo emitir el refresco del cliente:', error.message);
        return false;
    }
}

module.exports = {
    ACCIONES,
    DOMINIOS,
    emitirRefrescoCliente,
};
