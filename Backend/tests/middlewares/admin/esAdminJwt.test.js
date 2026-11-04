jest.mock('jsonwebtoken', () => ({ verify: jest.fn() }));
jest.mock('../../../src/utils/sesionAdmin', () => ({ limpiarCookieSesion: jest.fn() }));
jest.mock('../../../src/models', () => ({ Admin: { findByPk: jest.fn() } }));

const jwt = require('jsonwebtoken');
const { limpiarCookieSesion } = require('../../../src/utils/sesionAdmin');
const { Admin } = require('../../../src/models');
const { esAdminJwt } = require('../../../src/middleware/admin/esAdminJwt');

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    process.env.SECRET_JWT_TOKEN = 'secreto';
});

describe('esAdminJwt', () => {
    test('responde 401 si no hay token', async () => {
        const res = crearRes();
        const next = jest.fn();

        await esAdminJwt({ cookies: {} }, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    test('responde 401 si el token es inválido', async () => {
        jwt.verify.mockImplementation(() => { throw new Error('inválido'); });
        const res = crearRes();

        await esAdminJwt({ cookies: { access_token: 'token' } }, res, jest.fn());

        expect(limpiarCookieSesion).toHaveBeenCalledWith(res);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ msj: 'Token inválido o expirado' });
    });

    test('responde 403 si el rol no es ADMIN ni MASTER', async () => {
        jwt.verify.mockReturnValue({ id: 1, rol: 'CLIENTE' });
        const res = crearRes();

        await esAdminJwt({ cookies: { access_token: 'token' } }, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(403);
    });

    test('responde 401 si el administrador no existe', async () => {
        jwt.verify.mockReturnValue({ id: 1, rol: 'ADMIN' });
        Admin.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await esAdminJwt({ cookies: { access_token: 'token' } }, res, jest.fn());

        expect(limpiarCookieSesion).toHaveBeenCalledWith(res);
        expect(res.status).toHaveBeenCalledWith(401);
    });

    test('responde 401 si el administrador está inactivo', async () => {
        jwt.verify.mockReturnValue({ id: 1, rol: 'ADMIN' });
        Admin.findByPk.mockResolvedValue({ id: 1, activo: false });
        const res = crearRes();

        await esAdminJwt({ cookies: { access_token: 'token' } }, res, jest.fn());

        expect(limpiarCookieSesion).toHaveBeenCalledWith(res);
        expect(res.status).toHaveBeenCalledWith(401);
    });

    test('deja pasar a un ADMIN activo y actualiza req.usuario', async () => {
        jwt.verify.mockReturnValue({ id: 1, rol: 'ADMIN' });
        Admin.findByPk.mockResolvedValue({ id: 1, nombre: 'Admin', rol: 'ADMIN', activo: true });
        const req = { cookies: { access_token: 'token' } };
        const next = jest.fn();

        await esAdminJwt(req, crearRes(), next);

        expect(req.usuario).toEqual({ id: 1, nombre: 'Admin', rol: 'ADMIN' });
        expect(next).toHaveBeenCalled();
    });

    test('deja pasar a un MASTER activo', async () => {
        jwt.verify.mockReturnValue({ id: 2, rol: 'MASTER' });
        Admin.findByPk.mockResolvedValue({ id: 2, nombre: 'Master', rol: 'MASTER', activo: true });
        const next = jest.fn();

        await esAdminJwt({ cookies: { access_token: 'token' } }, crearRes(), next);

        expect(next).toHaveBeenCalled();
    });
});
