'use strict';

const { getIo } = require('./index');
const { SALAS } = require('./salas');

// asistencia (D-24): quedó inactivo porque se reasignó el viaje en el que pidió ayuda
const MOTIVOS = new Set(['desactivado', 'baja', 'asistencia']);

// Corta en vivo la sesión de una identidad (D-18). Se llama después del commit:
// primero avisa el motivo y después desconecta todos sus sockets.
// Nunca lanza: si falla, el próximo handshake o request REST igual la rechaza.
function revocarSesiones({ tipo, id, motivo }) {
    try {
        const io = getIo();
        if (!io || !MOTIVOS.has(motivo)) return false;

        const sala = SALAS.usuario(tipo, id);
        io.to(sala).emit('sesion:revocada', { motivo });
        io.in(sala).disconnectSockets(true);
        return true;
    } catch (error) {
        console.error('No se pudo revocar la sesión en vivo:', error.message);
        return false;
    }
}

module.exports = { MOTIVOS, revocarSesiones };
