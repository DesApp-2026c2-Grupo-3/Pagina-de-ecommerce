'use strict';

jest.mock('../../src/sockets', () => ({ getIo: jest.fn() }));

const { getIo } = require('../../src/sockets');
const registro = require('../../src/notifications/registroEstrategias');
const { SocketChannel, salasDeNotificacion } = require('../../src/notifications/canales/socketChannel');

function crearIo() {
    const emit = jest.fn();
    const to = jest.fn(() => ({ emit }));
    return { to, emit };
}

beforeEach(() => {
    jest.clearAllMocks();
});

afterEach(() => {
    jest.restoreAllMocks();
});

test('calcula todas las salas de destino sin duplicados para un tipo de admin y cliente', () => {
    expect(salasDeNotificacion({
        clientes: [8, 8],
        administradores: [3],
        administradoresSucursal: [2],
        clientesSucursal: [2],
        pedidos: [45],
        roles: ['admin'],
    }, 'pedido.creado')).toEqual([
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
    }, 'pedido.estado_cambiado')).toEqual([
        'user:cliente:8',
        'sucursal:2',
        'pedido:45',
    ]);
});

test('una notificación de admin y cliente no llega a salas de repartidores', () => {
    expect(salasDeNotificacion({
        clientes: [8],
        repartidores: [7],
        repartidoresSucursal: [2],
    }, 'pedido.creado')).toEqual(['user:cliente:8']);
});

test('una notificación de repartidor solo emite a salas de repartidores', () => {
    jest.spyOn(registro, 'audienciasDe').mockReturnValue(['repartidor']);

    expect(salasDeNotificacion({
        repartidores: [7, 7],
        repartidoresSucursal: [2],
        clientes: [8],
        clientesSucursal: [2],
        administradoresSucursal: [2],
        pedidos: [45],
        roles: ['MASTER'],
    }, 'viaje.asignado')).toEqual([
        'user:repartidor:7',
        'repartidor:sucursal:2',
    ]);
});

test('un tipo no registrado no emite a ninguna sala', () => {
    expect(salasDeNotificacion({ clientes: [8], roles: ['MASTER'] }, 'desconocido')).toEqual([]);
});

test('la modificación de sucursal emite a la sala del rol MASTER', () => {
    expect(salasDeNotificacion({
        roles: ['MASTER'],
    }, 'sucursal.modificada_por_admin')).toEqual([
        'role:MASTER',
    ]);
});

test('emite notificacion a todas las salas', () => {
    const io = crearIo();
    getIo.mockReturnValue(io);
    const channel = new SocketChannel();

    const cantidad = channel.enviar({
        id: 1,
        tipo: 'pedido.creado',
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

test('la notificación emitida no lleva los destinos (plan de clientes, C-6)', () => {
    const io = crearIo();
    const canal = new SocketChannel({ obtenerIo: () => io });

    canal.enviar({
        id: 1,
        tipo: 'pedido.estado_cambiado',
        datos: { pedidoId: 45 },
        destinos: { clientes: [8], pedidos: [45] },
    });

    const payload = io.emit.mock.calls[0][1];
    expect(payload).toEqual({ id: 1, tipo: 'pedido.estado_cambiado', datos: { pedidoId: 45 } });
    expect(payload).not.toHaveProperty('destinos');
});
