'use strict';

const { esObjeto, texto, enteroPositivo } = require('./comunes');

const BLOQUES_VALIDOS = new Set([
    'datos_generales',
    'horarios',
    'ubicacion',
    'entrega',
]);

function normalizarCambios(cambios) {
    if (!Array.isArray(cambios) || cambios.length === 0) {
        const error = new Error('sucursal.modificada_por_admin requiere al menos un bloque');
        error.code = 'NOTIFICACION_INVALIDA';
        throw error;
    }

    const vistos = new Set();
    const resultado = [];

    for (const bloque of cambios) {
        if (!BLOQUES_VALIDOS.has(bloque)) {
            const error = new Error(`Bloque de sucursal inválido: ${bloque}`);
            error.code = 'NOTIFICACION_INVALIDA';
            throw error;
        }

        if (!vistos.has(bloque)) {
            vistos.add(bloque);
            resultado.push(bloque);
        }
    }

    return resultado;
}

module.exports = Object.freeze({
    tipo: 'sucursal.modificada_por_admin',
    version: 1,
    audiencias: ['admin'],
    paraAdministradores: true,

    construir(payload) {
        if (!esObjeto(payload)) {
            const error = new Error('sucursal.modificada_por_admin requiere un payload');
            error.code = 'NOTIFICACION_INVALIDA';
            throw error;
        }

        return {
            datos: {
                sucursalId: enteroPositivo(payload.sucursalId, 'sucursalId'),
                sucursalNombre: texto(payload.sucursalNombre),
                adminId: enteroPositivo(payload.adminId, 'adminId'),
                adminNombre: texto(payload.adminNombre),
                cambios: normalizarCambios(payload.cambios),
            },
            destinos: { roles: ['MASTER'] },
        };
    },
});
