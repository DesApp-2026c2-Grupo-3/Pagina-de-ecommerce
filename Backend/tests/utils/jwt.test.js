process.env.JWT_SECRET = 'secreto-de-prueba';

jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(),
    verify: jest.fn(),
}));

const jwt = require('jsonwebtoken');
const { firmarToken, verificarToken } = require('../../src/utils/jwt');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('jwt', () => {
    test('firma un token con el secreto y la duración indicada', () => {
        jwt.sign.mockReturnValue('token-firmado');

        const token = firmarToken({ id: 1 }, '8h');

        expect(jwt.sign).toHaveBeenCalledWith({ id: 1 }, 'secreto-de-prueba', { expiresIn: '8h' });
        expect(token).toBe('token-firmado');
    });

    test('verifica un token con el secreto', () => {
        jwt.verify.mockReturnValue({ id: 1 });

        const datos = verificarToken('token');

        expect(jwt.verify).toHaveBeenCalledWith('token', 'secreto-de-prueba');
        expect(datos).toEqual({ id: 1 });
    });

    test('propaga el error si el token es inválido', () => {
        jwt.verify.mockImplementation(() => { throw new Error('jwt malformed'); });

        expect(() => verificarToken('malo')).toThrow('jwt malformed');
    });

    test('falla al cargar si falta JWT_SECRET', () => {
        const secreto = process.env.JWT_SECRET;
        delete process.env.JWT_SECRET;

        expect(() => {
            jest.isolateModules(() => {
                require('../../src/utils/jwt');
            });
        }).toThrow('Falta JWT_SECRET en el .env del backend');

        process.env.JWT_SECRET = secreto;
    });
});
