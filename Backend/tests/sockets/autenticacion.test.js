'use strict';

jest.mock('../../src/services/authService', () => ({
    resolverIdentidad: jest.fn(),
}));

const { resolverIdentidad } = require('../../src/services/authService');
const { autenticarSocket } = require('../../src/sockets/autenticacion');

function crearSocket(auth) {
    return {
        handshake: { auth },
        data: {},
    };
}

beforeEach(() => {
    jest.clearAllMocks();
});

test('rechaza la conexión sin token', async () => {
    const next = jest.fn();

    await autenticarSocket(crearSocket({}), next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: 'AUTH_REQUIRED',
        data: { code: 'AUTH_REQUIRED' },
    }));
    expect(resolverIdentidad).not.toHaveBeenCalled();
});

test('rechaza un token vacío', async () => {
    const next = jest.fn();

    await autenticarSocket(crearSocket({ token: '   ' }), next);

    expect(next.mock.calls[0][0].message).toBe('AUTH_REQUIRED');
});

test('autentica un administrador y guarda su identidad', async () => {
    const identidad = { tipo: 'admin', id: 3, rol: 'ADMIN', sucursalId: 2 };
    resolverIdentidad.mockResolvedValue(identidad);
    const socket = crearSocket({ token: 'token-valido' });
    const next = jest.fn();

    await autenticarSocket(socket, next);

    expect(resolverIdentidad).toHaveBeenCalledWith('token-valido');
    expect(socket.data.identidad).toEqual(identidad);
    expect(next).toHaveBeenCalledWith();
});

test('rechaza identidades que no son de cliente o admin', async () => {
    resolverIdentidad.mockResolvedValue({ tipo: 'repartidor', id: 9 });
    const next = jest.fn();

    await autenticarSocket(crearSocket({ token: 'token-valido' }), next);

    expect(next.mock.calls[0][0].message).toBe('AUTH_INVALID');
});

test('propaga el token expirado', async () => {
    const error = new Error('vencido');
    error.codigo = 'AUTH_EXPIRED';
    resolverIdentidad.mockRejectedValue(error);
    const next = jest.fn();

    await autenticarSocket(crearSocket({ token: 'token-vencido' }), next);

    expect(next.mock.calls[0][0].message).toBe('AUTH_EXPIRED');
    expect(next.mock.calls[0][0].data).toEqual({ code: 'AUTH_EXPIRED' });
});

test('rechaza un token inválido', async () => {
    resolverIdentidad.mockRejectedValue(new Error('inválido'));
    const next = jest.fn();

    await autenticarSocket(crearSocket({ token: 'token-invalido' }), next);

    expect(next.mock.calls[0][0].message).toBe('AUTH_INVALID');
});
