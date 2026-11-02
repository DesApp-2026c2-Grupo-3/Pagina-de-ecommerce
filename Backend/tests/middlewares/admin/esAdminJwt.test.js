jest.mock('../../../src/services/authService', () => ({
    resolverIdentidad: jest.fn(),
}));

jest.mock('../../../src/utils/sesionAdmin', () => ({
    limpiarCookieSesion: jest.fn(),
}));

const { resolverIdentidad } = require('../../../src/services/authService');
const { limpiarCookieSesion } = require('../../../src/utils/sesionAdmin');
const { esAdminJwt } = require('../../../src/middleware/admin/esAdminJwt');

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

beforeEach(() => {
    jest.clearAllMocks();
});

describe('esAdminJwt', () => {
    test('responde 401 si no hay token', async () => {
        const res = crearRes();
        const next = jest.fn();

        await esAdminJwt({ cookies: {}, headers: {} }, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    test('responde 401 y limpia la cookie si el token es inválido', async () => {
        resolverIdentidad.mockRejectedValue({ codigo: 'AUTH_INVALID' });
        const res = crearRes();

        await esAdminJwt(
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

        await esAdminJwt(
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

        await esAdminJwt(
            { cookies: { access_token: 'token' }, headers: {} },
            res,
            jest.fn()
        );

        expect(res.status).toHaveBeenCalledWith(403);
    });

    test('deja pasar a un ADMIN activo y actualiza req.usuario', async () => {
        resolverIdentidad.mockResolvedValue({
            tipo: 'admin',
            id: 1,
            nombre: 'Admin',
            rol: 'ADMIN',
            sucursalId: 2,
        });
        const req = { cookies: { access_token: 'token' }, headers: {} };
        const next = jest.fn();

        await esAdminJwt(req, crearRes(), next);

        expect(req.usuario).toEqual({ id: 1, nombre: 'Admin', rol: 'ADMIN' });
        expect(req.admin).toMatchObject({ id: 1, rol: 'ADMIN', sucursalId: 2 });
        expect(next).toHaveBeenCalled();
    });

    test('acepta el token por Authorization Bearer', async () => {
        resolverIdentidad.mockResolvedValue({
            tipo: 'admin',
            id: 2,
            nombre: 'Master',
            rol: 'MASTER',
            sucursalId: null,
        });
        const req = {
            cookies: {},
            headers: { authorization: 'Bearer token-bearer' },
        };
        const next = jest.fn();

        await esAdminJwt(req, crearRes(), next);

        expect(resolverIdentidad).toHaveBeenCalledWith('token-bearer');
        expect(next).toHaveBeenCalled();
    });

    test('deja pasar a un MASTER activo', async () => {
        resolverIdentidad.mockResolvedValue({
            tipo: 'admin',
            id: 2,
            nombre: 'Master',
            rol: 'MASTER',
            sucursalId: null,
        });
        const next = jest.fn();

        await esAdminJwt(
            { cookies: { access_token: 'token' }, headers: {} },
            crearRes(),
            next
        );

        expect(next).toHaveBeenCalled();
    });
});
