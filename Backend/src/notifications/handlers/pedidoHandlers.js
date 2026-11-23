'use strict';

const { fabrica } = require('../index');
const { emitirRefrescoCliente } = require('../clienteRefresco');

// Estados internos entre el local y el repartidor: el cliente no los ve.
// Clave: estado interno (minúscula) → estado que el cliente ve en su lugar.
// Espejo de ESTADOS_INTERNOS en Frontend/src/config/pedidoEstados.ts
const ESTADOS_INTERNOS_CLIENTE = new Map([
    ['listo para retirar', 'En proceso'],
]);

function estadoInterno(estado) {
    return ESTADOS_INTERNOS_CLIENTE.get(String(estado ?? '').trim().toLowerCase());
}

// El refresco (C-6) va antes del aviso: las pantallas del cliente recargan aunque el aviso falle
function refrescarPedido(pedido, accion) {
    emitirRefrescoCliente({ dominio: 'pedido', accion, usuarioId: pedido?.usuarioId, pedidoId: pedido?.id });
}

function notificarPedidoCreado(pedido) {
    refrescarPedido(pedido, 'creado');
    return fabrica.publicarPorTipo('pedido.creado', { pedido });
}

// Avisa al cliente un cambio de estado de su pedido y le pide recargarlo (estado, línea de tiempo y hora estimada).
// - Pasar a un estado interno ("Listo para retirar") no se avisa: para el cliente sigue "En proceso".
// - Si el estado anterior era interno, se informa el que el cliente veía (p. ej. al cancelar).
// - Al cancelar se manda el motivo que escribió el admin.
function notificarEstadoPedido(pedido, estadoAnterior, motivo = null) {    
    if (estadoInterno(pedido?.estado)) {
        return Promise.resolve(null);
    }

    refrescarPedido(pedido, 'estado_cambiado');
    return fabrica.publicarPorTipo('pedido.estado_cambiado', {
        pedido,
        estadoAnterior: estadoInterno(estadoAnterior) ?? estadoAnterior,
        ...(motivo ? { motivo } : {}),
    });
}

module.exports = { notificarPedidoCreado, notificarEstadoPedido };
