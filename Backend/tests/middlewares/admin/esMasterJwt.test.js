jest.mock('../../../src/services/authService', () => ({
    resolverIdentidad: jest.fn(),
}));

jest.mock('../../../src/utils/sesionAdmin', () => ({
    limpiarCookieSesion: jest.fn(),
}));

const { resolverIdentidad } = require('../../../src/services/authService');
const { limpiarCookieSesion } = require('../../../src/utils/sesionAdmin');
const { esMasterJwt } = require('../../../src/middleware/admin/esMasterJwt');

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

beforeEach(() => {
    jest.clearAllMocks();
});

describe('esMasterJwt', () => {
    test('responde 401 si no hay token', async () => {
        const res = crearRes();
        const next = jest.fn();

        await esMasterJwt({ cookies: {}, headers: {} }, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    test('responde 401 y limpia la cookie si el token es inválido', async () => {
        resolverIdentidad.mockRejectedValue({ codigo: 'AUTH_EXPIRED' });
        const res = crearRes();

        await esMasterJwt(
            { cookies: { access_token: 'token' }, headers: {} },
            res,
            jest.fn()
        );

        expect(limpiarCookieSesion).toHaveBeenCalledWith(res);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ msj: 'Token inválido o expirado' });
    });

    test('responde 500 si falla la base al resolver la identidad', async () => {
        resolverIdentidad.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await esMasterJwt(
            { cookies: { access_token: 'token' }, headers: {} },
            res,
            jest.fn()
        );

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ msj: 'Error del servidor' });
        expect(limpiarCookieSesion).not.toHaveBeenCalled();
    });

    test('responde 403 si el token no es de un administrador', async () => {
        resolverIdentidad.mockResolvedValue({
            tipo: 'cliente',
            id: 1,
            nombre: 'Juan',
        });
        const res = crearRes();

        await esMasterJwt(
            { cookies: { access_token: 'token' }, headers: {} },
            res,
            jest.fn()
        );

        expect(res.status).toHaveBeenCalledWith(403);
    });

    test('responde 403 si el administrador no es MASTER', async () => {
        resolverIdentidad.mockResolvedValue({
            tipo: 'admin',
            id: 1,
            nombre: 'Admin',
            rol: 'ADMIN',
            sucursalId: 2,
        });
        const res = crearRes();

        await esMasterJwt(
            { cookies: { access_token: 'token' }, headers: {} },
            res,
            jest.fn()
        );

        expect(res.status).toHaveBeenCalledWith(403);
    });

    test('deja pasar a un MASTER activo y actualiza req.usuario', async () => {
        resolverIdentidad.mockResolvedValue({
            tipo: 'admin',
            id: 2,
            nombre: 'Master',
            rol: 'MASTER',
            sucursalId: null,
        });
        const req = { cookies: { access_token: 'token' }, headers: {} };
        const next = jest.fn();

        await esMasterJwt(req, crearRes(), next);

        expect(req.usuario).toEqual({ id: 2, nombre: 'Master', rol: 'MASTER' });
        expect(next).toHaveBeenCalled();
    });
});
