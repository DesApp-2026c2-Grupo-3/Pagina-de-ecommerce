'use strict';

jest.mock('../../src/sockets', () => ({ getIo: jest.fn() }));

const { getIo } = require('../../src/sockets');
const {
    emitirRefrescoAdmin,
    normalizarRecursos,
} = require('../../src/notifications/adminRefresco');

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
    console.error.mockRestore();
});

test('emite el refresco a la sucursal y a los administradores globales', async () => {
    const io = crearIo();
    getIo.mockReturnValue(io);

    const emitido = await emitirRefrescoAdmin({
        dominio: 'stock',
        accion: 'actualizado',
        sucursalId: 2,
        recursos: { insumoId: 1 },
    });

    expect(emitido).toBe(true);
    expect(io.to).toHaveBeenCalledWith(['admin:sucursal:2', 'admin:global']);
    expect(io.emit).toHaveBeenCalledWith('admin:refresco', expect.objectContaining({
        version: 1,
        eventoId: expect.any(String),
        dominio: 'stock',
        accion: 'actualizado',
        ocurridoEn: expect.any(String),
        sucursalId: 2,
        recursos: { insumoId: 1 },
    }));
});

test('emite a la sala global cuando el refresco no es de sucursal', async () => {
    const io = crearIo();
    getIo.mockReturnValue(io);

    await emitirRefrescoAdmin({
        dominio: 'productos',
        accion: 'creado',
    });

    expect(io.to).toHaveBeenCalledWith(['admin:global']);
    expect(io.emit).toHaveBeenCalledWith('admin:refresco', expect.objectContaining({
        sucursalId: null,
        dominio: 'productos',
        accion: 'creado',
    }));
});

test('ignora dominios, acciones y sucursales inválidas', async () => {
    const io = crearIo();
    getIo.mockReturnValue(io);

    expect(await emitirRefrescoAdmin({ dominio: 'otro' })).toBe(false);
    expect(await emitirRefrescoAdmin({ accion: 'otra' })).toBe(false);
    expect(await emitirRefrescoAdmin({ dominio: 'stock', sucursalId: 0 })).toBe(false);
    expect(io.emit).not.toHaveBeenCalled();
});

test('no falla si Socket.io todavía no está inicializado', async () => {
    getIo.mockReturnValue(null);

    expect(await emitirRefrescoAdmin({ dominio: 'stock', sucursalId: 2 })).toBe(false);
});

test('normaliza solo recursos enteros positivos', () => {
    expect(normalizarRecursos({
        insumoId: '2',
        pedidoId: 0,
        productoId: -1,
        otro: 5,
    })).toEqual({ insumoId: 2 });
    expect(normalizarRecursos({})).toBeUndefined();
    expect(normalizarRecursos(null)).toBeUndefined();
});
