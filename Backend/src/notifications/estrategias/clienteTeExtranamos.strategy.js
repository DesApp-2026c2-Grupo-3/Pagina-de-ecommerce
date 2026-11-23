'use strict';

const { esObjeto, texto, enteroPositivo } = require('./comunes');

// "Te extrañamos": carta para un cliente que hace tiempo que no pide.
// La manda el admin desde Reportes > Clientes inactivos. En la tienda llega como
// "Tenés un mensaje de BurgerFast" y al tocarlo se abre la carta.
module.exports = Object.freeze({
    tipo: 'cliente.te_extranamos',
    version: 1,
    audiencias: ['cliente'],

    construir(payload) {
        if (!esObjeto(payload)) {
            const error = new Error('cliente.te_extranamos requiere un payload');
            error.code = 'NOTIFICACION_INVALIDA';
            throw error;
        }

        const usuarioId = enteroPositivo(payload.usuarioId, 'usuarioId');

        return {
            datos: {
                usuarioId,
                nombre: texto(payload.nombre),
                productoFavorito: payload.productoFavorito ? texto(payload.productoFavorito) : null,
            },
            destinos: { clientes: [usuarioId] },
        };
    },
});
