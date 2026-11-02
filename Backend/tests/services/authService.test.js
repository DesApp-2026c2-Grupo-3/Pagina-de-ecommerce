jest.mock('../../src/utils/jwt', () => ({
    firmarToken: jest.fn(),
    verificarToken: jest.fn(),
}));

jest.mock('../../src/models', () => ({
    Usuario: { findByPk: jest.fn() },
    Admin: { findByPk: jest.fn() },
}));

const { firmarToken, verificarToken } = require('../../src/utils/jwt');
const { Usuario, Admin } = require('../../src/models');
const {
    firmarTokenCliente,
    firmarTokenAdmin,
    resolverIdentidad,
} = require('../../src/services/authService');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('firmarTokenCliente', () => {
    test('firma un token de usuario con duración de 7 días', () => {
        firmarToken.mockReturnValue('token-cliente');

        const token = firmarTokenCliente({ id: 7 });

        expect(firmarToken).toHaveBeenCalledWith(
            { sub: 7, tipo: 'usuario' },
            '7d'
        );
        expect(token).toBe('token-cliente');
    });
});

describe('firmarTokenAdmin', () => {
    test('firma un token de admin con rol y duración de 4 horas', () => {
        firmarToken.mockReturnValue('token-admin');

        const token = firmarTokenAdmin({ id: 3, rol: 'ADMIN' });

        expect(firmarToken).toHaveBeenCalledWith(
            { sub: 3, tipo: 'admin', rol: 'ADMIN' },
            '4h'
        );
        expect(token).toBe('token-admin');
    });
});

describe('resolverIdentidad', () => {
    test('resuelve un cliente desde la base', async () => {
        verificarToken.mockReturnValue({ sub: 7, tipo: 'usuario' });
        Usuario.findByPk.mockResolvedValue({
            id: 7,
            nombre: 'Juan',
            sucursalId: 2,
        });

        const identidad = await resolverIdentidad('token');

        expect(Usuario.findByPk).toHaveBeenCalledWith(7, {
            attributes: ['id', 'nombre', 'sucursalId'],
        });
        expect(identidad).toEqual({
            tipo: 'cliente',
            id: 7,
            rol: 'cliente',
            sucursalId: 2,
            nombre: 'Juan',
        });
    });

    test('resuelve un admin activo desde la base', async () => {
        verificarToken.mockReturnValue({ sub: 3, tipo: 'admin', rol: 'ADMIN' });
        Admin.findByPk.mockResolvedValue({
            id: 3,
            nombre: 'Ana',
            rol: 'ADMIN',
            sucursalId: 2,
            activo: true,
        });

        const identidad = await resolverIdentidad('token');

        expect(Admin.findByPk).toHaveBeenCalledWith(3, {
            attributes: ['id', 'nombre', 'rol', 'sucursalId', 'activo'],
        });
        expect(identidad).toEqual({
            tipo: 'admin',
            id: 3,
            rol: 'ADMIN',
            sucursalId: 2,
            nombre: 'Ana',
        });
    });

    test('rechaza un admin inexistente o inactivo', async () => {
        verificarToken.mockReturnValue({ sub: 3, tipo: 'admin' });
        Admin.findByPk.mockResolvedValue(null);

        await expect(resolverIdentidad('token'))
            .rejects.toMatchObject({ codigo: 'AUTH_INVALID' });

        Admin.findByPk.mockResolvedValue({ id: 3, activo: false });

        await expect(resolverIdentidad('token'))
            .rejects.toMatchObject({ codigo: 'AUTH_INVALID' });
    });

    test('rechaza un cliente inexistente', async () => {
        verificarToken.mockReturnValue({ sub: 7, tipo: 'usuario' });
        Usuario.findByPk.mockResolvedValue(null);

        await expect(resolverIdentidad('token'))
            .rejects.toMatchObject({ codigo: 'AUTH_INVALID' });
    });

    test('rechaza un tipo de token desconocido', async () => {
        verificarToken.mockReturnValue({ sub: 1, tipo: 'repartidor' });

        await expect(resolverIdentidad('token'))
            .rejects.toMatchObject({ codigo: 'AUTH_INVALID' });

        expect(Usuario.findByPk).not.toHaveBeenCalled();
        expect(Admin.findByPk).not.toHaveBeenCalled();
    });

    test('distingue un token vencido', async () => {
        const error = new Error('jwt expired');
        error.name = 'TokenExpiredError';
        verificarToken.mockImplementation(() => { throw error; });

        await expect(resolverIdentidad('token'))
            .rejects.toMatchObject({ codigo: 'AUTH_EXPIRED' });
    });

    test('propaga los errores de base de datos al resolver la identidad', async () => {
        verificarToken.mockReturnValue({ sub: 7, tipo: 'usuario' });
        Usuario.findByPk.mockRejectedValue(new Error('Base caída'));

        await expect(resolverIdentidad('token')).rejects.toThrow('Base caída');
    });

    test('rechaza un token inválido o sin datos mínimos', async () => {
        verificarToken.mockImplementation(() => { throw new Error('jwt malformed'); });

        await expect(resolverIdentidad('token'))
            .rejects.toMatchObject({ codigo: 'AUTH_INVALID' });

        verificarToken.mockReturnValue({ tipo: 'usuario' });

        await expect(resolverIdentidad('token'))
            .rejects.toMatchObject({ codigo: 'AUTH_INVALID' });
    });
});
