'use strict';

const { getIo } = require('../../sockets');
const { SALAS } = require('../../sockets/salas');
const { TIPOS } = require('../events');

function salasDeNotificacion(destinos = {}, tipo = null) {
    const salas = new Set();
    const admiteAdministradores = tipo !== TIPOS.PEDIDO_ESTADO_CAMBIADO;

    (destinos.clientes ?? []).forEach((id) => salas.add(SALAS.usuario('cliente', id)));
    if (admiteAdministradores) {
        (destinos.administradores ?? []).forEach((id) => salas.add(SALAS.usuario('admin', id)));
        (destinos.administradoresSucursal ?? []).forEach((id) => salas.add(SALAS.adminSucursal(id)));
    }
    (destinos.clientesSucursal ?? []).forEach((id) => salas.add(SALAS.sucursal(id)));
    (destinos.pedidos ?? []).forEach((id) => salas.add(SALAS.pedido(id)));
    (destinos.roles ?? []).forEach((rol) => {
        if (admiteAdministradores || rol !== 'admin') salas.add(SALAS.rol(rol));
    });

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
