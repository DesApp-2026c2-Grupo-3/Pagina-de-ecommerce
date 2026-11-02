process.env.SECRET_JWT_TOKEN = 'secreto-de-prueba';

jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(),
    verify: jest.fn(),
}));

const jwt = require('jsonwebtoken');
const { firmarToken, verificarToken } = require('../../src/utils/jwt');

beforeEach(() => {
    jest.clearAllMocks();
    process.env.SECRET_JWT_TOKEN = 'secreto-de-prueba';
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

    test('falla al firmar si falta SECRET_JWT_TOKEN', () => {
        const secreto = process.env.SECRET_JWT_TOKEN;
        delete process.env.SECRET_JWT_TOKEN;

        expect(() => firmarToken({ id: 1 }, '1h'))
            .toThrow('Falta SECRET_JWT_TOKEN en el .env del backend');

        process.env.SECRET_JWT_TOKEN = secreto;
    });
});
