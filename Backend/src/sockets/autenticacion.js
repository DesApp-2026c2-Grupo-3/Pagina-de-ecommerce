'use strict';

const { resolverIdentidad } = require('../services/authService');

// Única validación: la misma de REST (resolverIdentidad). Acá solo se filtra el tipo.
const TIPOS_PERMITIDOS = new Set(['admin', 'cliente', 'repartidor']);

function errorSocket(code) {
    const error = new Error(code);
    error.data = { code };
    return error;
}

async function autenticarSocket(socket, next) {
    const token = socket.handshake?.auth?.token;

    if (typeof token !== 'string' || token.trim() === '') {
        return next(errorSocket('AUTH_REQUIRED'));
    }

    try {
        const identidad = await resolverIdentidad(token);

        if (!identidad || !TIPOS_PERMITIDOS.has(identidad.tipo)) {
            return next(errorSocket('AUTH_INVALID'));
        }

        socket.data.identidad = identidad;
        return next();
    } catch (error) {
        return next(errorSocket(error?.codigo === 'AUTH_EXPIRED' ? 'AUTH_EXPIRED' : 'AUTH_INVALID'));
    }
}

module.exports = { autenticarSocket };
