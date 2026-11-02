const { Server } = require('socket.io');
const { origenesPermitidos } = require('../config/cors');

let io = null;

function inicializarSockets(httpServer) {
    if (io) return io;

    io = new Server(httpServer, {
        cors: {
            origin: origenesPermitidos,
            credentials: true,
        },
    });

    io.on('connection', (socket) => {
        console.log(`Socket conectado: ${socket.id}`);

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
