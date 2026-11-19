'use strict';

const { getIo } = require('../../sockets');
const { SALAS } = require('../../sockets/salas');
const registro = require('../registroEstrategias');

// Cada clave de `destinos` pertenece a una o más audiencias y se traduce a salas (D-05).
// Una notificación solo llega a las salas de las audiencias que declara su estrategia.
const DESTINOS = [
    { clave: 'clientes', audiencias: ['cliente'], sala: (id) => SALAS.usuario('cliente', id) },
    { clave: 'administradores', audiencias: ['admin'], sala: (id) => SALAS.usuario('admin', id) },
    { clave: 'administradoresSucursal', audiencias: ['admin'], sala: SALAS.adminSucursal },
    { clave: 'clientesSucursal', audiencias: ['cliente'], sala: SALAS.sucursal },
    // A la sala de un pedido se suscriben su cliente y los admins de la sucursal
    { clave: 'pedidos', audiencias: ['cliente', 'admin'], sala: SALAS.pedido },
    { clave: 'roles', audiencias: ['admin'], sala: SALAS.rol },
    { clave: 'repartidores', audiencias: ['repartidor'], sala: (id) => SALAS.usuario('repartidor', id) },
    { clave: 'repartidoresSucursal', audiencias: ['repartidor'], sala: SALAS.repartidorSucursal },
];

function salasDeNotificacion(destinos = {}, tipo) {
    const audiencias = new Set(registro.audienciasDe(tipo));
    const salas = new Set();

    for (const { clave, audiencias: delDestino, sala } of DESTINOS) {
        if (!delDestino.some((audiencia) => audiencias.has(audiencia))) continue;
        (destinos[clave] ?? []).forEach((valor) => salas.add(sala(valor)));
    }

    return [...salas];
}

class SocketChannel {
    constructor({ obtenerIo = getIo } = {}) {
        this.obtenerIo = obtenerIo;
    }

    enviar(notificacion) {
        const io = this.obtenerIo();
        if (!io) return 0;

        const salas = salasDeNotificacion(notificacion.destinos, notificacion.tipo);
        if (salas.length === 0) return 0;

        io.to(salas).emit('notificacion', notificacion);
        return salas.length;
    }

    emitirLeida({ destinatarioTipo, destinatarioId, notificacionId, leidaEn, todas = false }) {
        const io = this.obtenerIo();
        if (!io) return false;

        const sala = SALAS.usuario(destinatarioTipo, destinatarioId);
        const payload = todas
            ? { todas: true, leidaEn }
            : { notificacionId: Number(notificacionId), leidaEn };

        io.to(sala).emit('notificacion:leida', payload);
        return true;
    }
}

module.exports = { SocketChannel, salasDeNotificacion };
