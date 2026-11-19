'use strict';

const { fabrica } = require('../index');

// Estados internos entre el local y el repartidor: el cliente no los ve.
// Clave: estado interno (minúscula) → estado que el cliente ve en su lugar.
// Espejo de ESTADOS_INTERNOS en Frontend/src/config/pedidoEstados.ts
const ESTADOS_INTERNOS_CLIENTE = new Map([
    ['listo para retirar', 'En proceso'],
]);

function estadoInterno(estado) {
    return ESTADOS_INTERNOS_CLIENTE.get(String(estado ?? '').trim().toLowerCase());
}

function notificarPedidoCreado(pedido) {
    return fabrica.publicarPorTipo('pedido.creado', { pedido });
}

// Avisa al cliente un cambio de estado de su pedido.
// - Pasar a un estado interno ("Listo para retirar") no se avisa: para el cliente sigue "En proceso".
// - Si el estado anterior era interno, se informa el que el cliente veía (p. ej. al cancelar).
function notificarEstadoPedido(pedido, estadoAnterior) {
    if (estadoInterno(pedido?.estado)) {
        return Promise.resolve(null);
    }

    return fabrica.publicarPorTipo('pedido.estado_cambiado', {
        pedido,
        estadoAnterior: estadoInterno(estadoAnterior) ?? estadoAnterior,
    });
}

module.exports = { notificarPedidoCreado, notificarEstadoPedido };
