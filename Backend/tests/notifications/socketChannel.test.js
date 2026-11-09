'use strict';

jest.mock('../../src/sockets', () => ({ getIo: jest.fn() }));

const { getIo } = require('../../src/sockets');
const { TIPOS } = require('../../src/notifications/events');
const { SocketChannel, salasDeNotificacion } = require('../../src/notifications/canales/socketChannel');

function crearIo() {
    const emit = jest.fn();
    const to = jest.fn(() => ({ emit }));
    return { to, emit };
}

beforeEach(() => {
    jest.clearAllMocks();
});

test('calcula todas las salas de destino sin duplicados', () => {
    expect(salasDeNotificacion({
        clientes: [8, 8],
        administradores: [3],
        administradoresSucursal: [2],
        clientesSucursal: [2],
        pedidos: [45],
        roles: ['admin'],
    })).toEqual([
        'user:cliente:8',
        'user:admin:3',
        'admin:sucursal:2',
        'sucursal:2',
        'pedido:45',
        'role:admin',
    ]);
});

test('los cambios de estado no emiten a salas de administradores', () => {
    expect(salasDeNotificacion({
        clientes: [8],
        administradores: [3],
        administradoresSucursal: [2],
        clientesSucursal: [2],
        pedidos: [45],
        roles: ['admin'],
    }, TIPOS.PEDIDO_ESTADO_CAMBIADO)).toEqual([
        'user:cliente:8',
        'sucursal:2',
        'pedido:45',
    ]);
});

test('emite notificacion a todas las salas', () => {
    const io = crearIo();
    getIo.mockReturnValue(io);
    const channel = new SocketChannel();

    const cantidad = channel.enviar({
        id: 1,
        destinos: { administradoresSucursal: [2], pedidos: [45] },
    });

    expect(io.to).toHaveBeenCalledWith(['admin:sucursal:2', 'pedido:45']);
    expect(io.emit).toHaveBeenCalledWith('notificacion', expect.objectContaining({ id: 1 }));
    expect(cantidad).toBe(2);
});

test('emite notificacion:leida al administrador', () => {
    const io = crearIo();
    getIo.mockReturnValue(io);
    const channel = new SocketChannel();

    channel.emitirLeida({
        destinatarioTipo: 'admin',
        destinatarioId: 3,
        notificacionId: '9',
        leidaEn: '2026-11-02T15:00:00.000Z',
    });

    expect(io.to).toHaveBeenCalledWith('user:admin:3');
    expect(io.emit).toHaveBeenCalledWith('notificacion:leida', {
        notificacionId: 9,
        leidaEn: '2026-11-02T15:00:00.000Z',
    });
});

test('emite lectura de todas las notificaciones', () => {
    const io = crearIo();
    getIo.mockReturnValue(io);
    const channel = new SocketChannel();

    channel.emitirLeida({
        destinatarioTipo: 'admin',
        destinatarioId: 3,
        leidaEn: '2026-11-02T15:00:00.000Z',
        todas: true,
    });

    expect(io.emit).toHaveBeenCalledWith('notificacion:leida', {
        todas: true,
        leidaEn: '2026-11-02T15:00:00.000Z',
    });
});

test('no falla si Socket.io todavía no está inicializado', () => {
    getIo.mockReturnValue(null);
    const channel = new SocketChannel();

    expect(channel.enviar({ destinos: { clientes: [1] } })).toBe(0);
    expect(channel.emitirLeida({ destinatarioTipo: 'admin', destinatarioId: 3 })).toBe(false);
});
