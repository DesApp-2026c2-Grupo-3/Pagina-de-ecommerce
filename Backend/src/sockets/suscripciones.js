'use strict';

const { Pedido } = require('../models');
const { SALAS } = require('./salas');

const MAX_PEDIDOS = 20;
const TTL_MS = 2 * 60 * 60 * 1000;

function normalizarPedidoId(valor) {
    const id = Number(valor);
    return Number.isInteger(id) && id > 0 ? id : null;
}

async function puedeSeguirPedido(identidad, pedidoId) {
    if (!identidad) return false;

    const pedido = await Pedido.findByPk(pedidoId, {
        attributes: ['id', 'usuarioId', 'sucursalId'],
    });

    if (!pedido) return false;

    if (identidad.tipo === 'cliente') {
        return Number(pedido.usuarioId) === Number(identidad.id);
    }

    if (identidad.tipo === 'admin') {
        return identidad.sucursalId === null
            || Number(pedido.sucursalId) === Number(identidad.sucursalId);
    }

    return false;
}

function registrarSuscripciones(socket) {
    if (!(socket.data.pedidos instanceof Map)) {
        socket.data.pedidos = new Map();
    }

    const pedidos = socket.data.pedidos;

    function desuscribir(pedidoId) {
        const id = normalizarPedidoId(pedidoId);
        if (id === null) return false;

        const timeout = pedidos.get(id);
        if (timeout) clearTimeout(timeout);

        socket.leave(SALAS.pedido(id));
        pedidos.delete(id);
        return true;
    }

    socket.on('pedido:suscribir', async (pedidoId, ack) => {
        const id = normalizarPedidoId(pedidoId);

        if (id === null) {
            ack?.({ ok: false, code: 'PEDIDO_INVALIDO' });
            return;
        }

        if (pedidos.has(id)) {
            ack?.({ ok: true });
            return;
        }

        if (pedidos.size >= MAX_PEDIDOS) {
            ack?.({ ok: false, code: 'LIMITE_SUSCRIPCIONES' });
            return;
        }

        try {
            const permitido = await puedeSeguirPedido(socket.data.identidad, id);

            if (!permitido) {
                ack?.({ ok: false, code: 'PEDIDO_NO_DISPONIBLE' });
                return;
            }

            const timeout = setTimeout(() => desuscribir(id), TTL_MS);
            timeout.unref?.();

            pedidos.set(id, timeout);
            socket.join(SALAS.pedido(id));
            ack?.({ ok: true });
        } catch (error) {
            console.error('No se pudo suscribir al pedido:', error.message);
            ack?.({ ok: false, code: 'ERROR_SUSCRIPCION' });
        }
    });

    socket.on('pedido:desuscribir', (pedidoId, ack) => {
        const ok = desuscribir(pedidoId);
        ack?.(ok ? { ok: true } : { ok: false, code: 'PEDIDO_INVALIDO' });
    });

    socket.on('disconnect', () => {
        for (const timeout of pedidos.values()) {
            clearTimeout(timeout);
        }
        pedidos.clear();
    });
}

module.exports = {
    MAX_PEDIDOS,
    TTL_MS,
    puedeSeguirPedido,
    registrarSuscripciones,
};
