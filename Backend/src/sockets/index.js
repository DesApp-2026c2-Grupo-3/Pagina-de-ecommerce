const { Server } = require('socket.io');
const { origenesPermitidos } = require('../config/cors');
const { autenticarSocket } = require('./autenticacion');
const { salasDeIdentidad } = require('./salas');
const { registrarSuscripciones } = require('./suscripciones');

let io = null;

function inicializarSockets(httpServer) {
    if (io) return io;

    io = new Server(httpServer, {
        cors: {
            origin: origenesPermitidos,
            credentials: true,
        },
    });

    io.use(autenticarSocket);

    io.on('connection', (socket) => {
        const identidad = socket.data.identidad;
        const salas = salasDeIdentidad(identidad);

        socket.join(salas);
        registrarSuscripciones(socket);

        console.log(`Socket conectado: ${socket.id} (${identidad.tipo} ${identidad.id})`);

        socket.on('disconnect', (motivo) => {
            console.log(`Socket desconectado: ${socket.id} (${motivo})`);
        });
    });

    return io;
}

function getIo() {
    return io;
}

module.exports = { inicializarSockets, getIo };
