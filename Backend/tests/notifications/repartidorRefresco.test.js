'use strict';

jest.mock('../../src/sockets', () => ({ getIo: jest.fn() }));

const { getIo } = require('../../src/sockets');
const { emitirRefrescoRepartidor } = require('../../src/notifications/repartidorRefresco');

function crearIo() {
    const emit = jest.fn();
    const to = jest.fn(() => ({ emit }));
    return { to, emit };
}

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    jest.restoreAllMocks();
});

test('emite a todos los repartidores de la sucursal', () => {
    const io = crearIo();
    getIo.mockReturnValue(io);

    const emitido = emitirRefrescoRepartidor({
        dominio: 'pedidos_disponibles',
        accion: 'creado',
        sucursalId: 2,
        recursos: { pedidoId: 45 },
    });

    expect(emitido).toBe(true);
    expect(io.to).toHaveBeenCalledWith('repartidor:sucursal:2');
    expect(io.emit).toHaveBeenCalledWith('repartidor:refresco', {
        version: 1,
        eventoId: expect.any(String),
        dominio: 'pedidos_disponibles',
        accion: 'creado',
        ocurridoEn: expect.any(String),
        sucursalId: 2,
        recursos: { pedidoId: 45 },
    });
});

test('con origenRepartidorId va igual a toda la sucursal e indica quién lo provocó (D-21)', () => {
    const io = crearIo();
    getIo.mockReturnValue(io);

    emitirRefrescoRepartidor({
        dominio: 'pedidos_disponibles',
        accion: 'creado',
        sucursalId: 2,
        origenRepartidorId: 3,
        recursos: { pedidoId: 45 },
    });

    expect(io.to).toHaveBeenCalledWith('repartidor:sucursal:2');
    expect(io.emit).toHaveBeenCalledWith('repartidor:refresco', expect.objectContaining({
        origenRepartidorId: 3,
        recursos: { pedidoId: 45 },
    }));
});

test('un origenRepartidorId inválido no se manda', () => {
    const io = crearIo();
    getIo.mockReturnValue(io);

    emitirRefrescoRepartidor({ dominio: 'pedidos_disponibles', accion: 'creado', sucursalId: 2, origenRepartidorId: 'x' });

    expect(io.emit.mock.calls[0][1]).not.toHaveProperty('origenRepartidorId');
});

test('con repartidorId emite solo a ese repartidor', () => {
    const io = crearIo();
    getIo.mockReturnValue(io);

    emitirRefrescoRepartidor({
        dominio: 'viaje',
        accion: 'actualizado',
        sucursalId: 2,
        repartidorId: 7,
        recursos: { viajeId: 4 },
    });

    expect(io.to).toHaveBeenCalledWith('user:repartidor:7');
});

test('descarta recursos inválidos', () => {
    const io = crearIo();
    getIo.mockReturnValue(io);

    emitirRefrescoRepartidor({
        dominio: 'viaje',
        accion: 'actualizado',
        sucursalId: 2,
        recursos: { viajeId: -1, otro: 3 },
    });

    expect(io.emit.mock.calls[0][1]).not.toHaveProperty('recursos');
});

test.each([
    ['un dominio desconocido', { dominio: 'stock', accion: 'creado', sucursalId: 2 }],
    ['una acción desconocida', { dominio: 'viaje', accion: 'borrado', sucursalId: 2 }],
    ['una sucursal inválida', { dominio: 'viaje', accion: 'creado', sucursalId: 0 }],
])('ignora %s', (_, evento) => {
    const io = crearIo();
    getIo.mockReturnValue(io);

    expect(emitirRefrescoRepartidor(evento)).toBe(false);
    expect(io.to).not.toHaveBeenCalled();
});

test('no falla si Socket.io todavía no está inicializado', () => {
    getIo.mockReturnValue(null);

    expect(emitirRefrescoRepartidor({ dominio: 'viaje', accion: 'creado', sucursalId: 2 })).toBe(false);
});

test('no lanza si falla la emisión', () => {
    getIo.mockReturnValue({ to: () => { throw new Error('socket roto'); } });

    expect(emitirRefrescoRepartidor({ dominio: 'viaje', accion: 'creado', sucursalId: 2 })).toBe(false);
});
