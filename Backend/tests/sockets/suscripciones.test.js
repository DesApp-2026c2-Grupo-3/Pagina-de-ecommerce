'use strict';

jest.mock('../../src/models', () => ({
    Pedido: { findByPk: jest.fn() },
}));

const { Pedido } = require('../../src/models');
const {
    MAX_PEDIDOS,
    TTL_MS,
    puedeSeguirPedido,
    registrarSuscripciones,
} = require('../../src/sockets/suscripciones');

function crearSocket(identidad = { tipo: 'cliente', id: 8, sucursalId: 2 }) {
    const handlers = {};
    const socket = {
        data: { identidad },
        on: jest.fn((evento, handler) => {
            handlers[evento] = handler;
        }),
        join: jest.fn(),
        leave: jest.fn(),
        handlers,
    };
    registrarSuscripciones(socket);
    return socket;
}

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    console.error.mockRestore();
    jest.useRealTimers();
});

test('un cliente puede suscribirse solo a su propio pedido', async () => {
    Pedido.findByPk.mockResolvedValue({ id: 45, usuarioId: 8, sucursalId: 2 });
    const socket = crearSocket();
    const ack = jest.fn();

    await socket.handlers['pedido:suscribir'](45, ack);

    expect(socket.join).toHaveBeenCalledWith('pedido:45');
    expect(socket.data.pedidos.has(45)).toBe(true);
    expect(ack).toHaveBeenCalledWith({ ok: true });
});

test('un cliente no puede suscribirse al pedido de otro', async () => {
    Pedido.findByPk.mockResolvedValue({ id: 45, usuarioId: 9, sucursalId: 2 });
    const socket = crearSocket();
    const ack = jest.fn();

    await socket.handlers['pedido:suscribir'](45, ack);

    expect(socket.join).not.toHaveBeenCalled();
    expect(ack).toHaveBeenCalledWith({ ok: false, code: 'PEDIDO_NO_DISPONIBLE' });
});

test('un admin solo puede seguir pedidos de su sucursal', async () => {
    Pedido.findByPk.mockResolvedValue({ id: 45, usuarioId: 8, sucursalId: 2 });

    expect(await puedeSeguirPedido({ tipo: 'admin', id: 3, sucursalId: 2 }, 45)).toBe(true);
    expect(await puedeSeguirPedido({ tipo: 'admin', id: 3, sucursalId: 1 }, 45)).toBe(false);
    expect(await puedeSeguirPedido({ tipo: 'admin', id: 1, sucursalId: null }, 45)).toBe(true);
});

test('no duplica suscripciones ni consulta dos veces', async () => {
    Pedido.findByPk.mockResolvedValue({ id: 45, usuarioId: 8, sucursalId: 2 });
    const socket = crearSocket();
    const ack = jest.fn();

    await socket.handlers['pedido:suscribir'](45, ack);
    await socket.handlers['pedido:suscribir'](45, ack);

    expect(Pedido.findByPk).toHaveBeenCalledTimes(1);
    expect(socket.join).toHaveBeenCalledTimes(1);
});

test('rechaza un id inválido', async () => {
    const socket = crearSocket();
    const ack = jest.fn();

    await socket.handlers['pedido:suscribir']('abc', ack);

    expect(ack).toHaveBeenCalledWith({ ok: false, code: 'PEDIDO_INVALIDO' });
    expect(Pedido.findByPk).not.toHaveBeenCalled();
});

test('respeta el máximo de suscripciones', async () => {
    const socket = crearSocket();
    for (let id = 1; id <= MAX_PEDIDOS; id += 1) {
        socket.data.pedidos.set(id, null);
    }
    const ack = jest.fn();

    await socket.handlers['pedido:suscribir'](99, ack);

    expect(ack).toHaveBeenCalledWith({ ok: false, code: 'LIMITE_SUSCRIPCIONES' });
    expect(Pedido.findByPk).not.toHaveBeenCalled();
});

test('desuscribir es idempotente y limpia el timer', async () => {
    Pedido.findByPk.mockResolvedValue({ id: 45, usuarioId: 8, sucursalId: 2 });
    const socket = crearSocket();
    await socket.handlers['pedido:suscribir'](45, jest.fn());
    const ack = jest.fn();

    socket.handlers['pedido:desuscribir'](45, ack);
    socket.handlers['pedido:desuscribir'](45, ack);

    expect(socket.leave).toHaveBeenCalledWith('pedido:45');
    expect(socket.data.pedidos.size).toBe(0);
    expect(ack).toHaveBeenCalledWith({ ok: true });
});

test('la suscripción vence a las dos horas', async () => {
    jest.useFakeTimers();
    Pedido.findByPk.mockResolvedValue({ id: 45, usuarioId: 8, sucursalId: 2 });
    const socket = crearSocket();

    await socket.handlers['pedido:suscribir'](45, jest.fn());
    jest.advanceTimersByTime(TTL_MS);

    expect(socket.leave).toHaveBeenCalledWith('pedido:45');
    expect(socket.data.pedidos.has(45)).toBe(false);
});

test('limpia todas las suscripciones al desconectar', async () => {
    Pedido.findByPk.mockResolvedValue({ id: 45, usuarioId: 8, sucursalId: 2 });
    const socket = crearSocket();
    await socket.handlers['pedido:suscribir'](45, jest.fn());

    socket.handlers.disconnect();

    expect(socket.data.pedidos.size).toBe(0);
});
