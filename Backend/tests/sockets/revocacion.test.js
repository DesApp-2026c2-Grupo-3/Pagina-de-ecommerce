'use strict';

jest.mock('../../src/sockets/index', () => ({ getIo: jest.fn() }));

const { getIo } = require('../../src/sockets/index');
const { revocarSesiones } = require('../../src/sockets/revocacion');

function crearIo() {
    const orden = [];
    const emit = jest.fn(() => orden.push('emit'));
    const disconnectSockets = jest.fn(() => orden.push('disconnect'));
    return {
        orden,
        emit,
        disconnectSockets,
        to: jest.fn(() => ({ emit })),
        in: jest.fn(() => ({ disconnectSockets })),
    };
}

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    jest.restoreAllMocks();
});

test.each(['desactivado', 'baja', 'asistencia'])('avisa el motivo "%s" y después desconecta la sala del repartidor', (motivo) => {
    const io = crearIo();
    getIo.mockReturnValue(io);

    const revocado = revocarSesiones({ tipo: 'repartidor', id: 7, motivo });

    expect(revocado).toBe(true);
    expect(io.to).toHaveBeenCalledWith('user:repartidor:7');
    expect(io.emit).toHaveBeenCalledWith('sesion:revocada', { motivo });
    expect(io.in).toHaveBeenCalledWith('user:repartidor:7');
    expect(io.disconnectSockets).toHaveBeenCalledWith(true);
    expect(io.orden).toEqual(['emit', 'disconnect']);
});

test('no hace nada si Socket.io todavía no está inicializado', () => {
    getIo.mockReturnValue(null);

    expect(revocarSesiones({ tipo: 'repartidor', id: 7, motivo: 'baja' })).toBe(false);
});

test('ignora un motivo desconocido', () => {
    const io = crearIo();
    getIo.mockReturnValue(io);

    expect(revocarSesiones({ tipo: 'repartidor', id: 7, motivo: 'otro' })).toBe(false);
    expect(io.emit).not.toHaveBeenCalled();
    expect(io.disconnectSockets).not.toHaveBeenCalled();
});

test('no lanza si falla la desconexión', () => {
    const io = crearIo();
    io.disconnectSockets.mockImplementation(() => { throw new Error('socket roto'); });
    getIo.mockReturnValue(io);

    expect(revocarSesiones({ tipo: 'repartidor', id: 7, motivo: 'desactivado' })).toBe(false);
    expect(console.error).toHaveBeenCalled();
});
