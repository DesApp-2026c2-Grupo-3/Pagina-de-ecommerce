const { opcionesCookie, limpiarCookieSesion } = require('../../src/utils/sesionAdmin');

describe('sesionAdmin', () => {
    const entornoOriginal = process.env.NODE_ENV;

    afterEach(() => {
        process.env.NODE_ENV = entornoOriginal;
    });

    test('la cookie no es segura fuera de producción', () => {
        process.env.NODE_ENV = 'development';

        expect(opcionesCookie()).toEqual({
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
            secure: false,
        });
    });

    test('la cookie es segura en producción', () => {
        process.env.NODE_ENV = 'production';

        expect(opcionesCookie().secure).toBe(true);
    });

    test('limpiarCookieSesion borra la cookie con las mismas opciones', () => {
        process.env.NODE_ENV = 'development';
        const res = { clearCookie: jest.fn() };

        limpiarCookieSesion(res);

        expect(res.clearCookie).toHaveBeenCalledWith('access_token', {
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
            secure: false,
        });
    });
});
