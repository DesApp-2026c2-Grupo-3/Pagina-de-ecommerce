jest.mock('jsonwebtoken', () => ({ verify: jest.fn() }));
jest.mock('../../../src/utils/sesionAdmin', () => ({ limpiarCookieSesion: jest.fn() }));
jest.mock('../../../src/models', () => ({ Admin: { findByPk: jest.fn() } }));

const jwt = require('jsonwebtoken');
const { limpiarCookieSesion } = require('../../../src/utils/sesionAdmin');
const { Admin } = require('../../../src/models');
const { esMasterJwt } = require('../../../src/middleware/admin/esMasterJwt');

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

describe('esMasterJwt', () => {
    test('responde 401 si no hay token', async () => {
        const res = crearRes();
        const next = jest.fn();

        await esMasterJwt({ cookies: {} }, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    test('responde 401 si el token es inválido', async () => {
        jwt.verify.mockImplementation(() => { throw new Error('inválido'); });
        const res = crearRes();

        await esMasterJwt({ cookies: { access_token: 'token' } }, res, jest.fn());

        expect(limpiarCookieSesion).toHaveBeenCalledWith(res);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ msj: 'Token inválido o expirado' });
    });

    test('responde 403 si el rol no es MASTER', async () => {
        jwt.verify.mockReturnValue({ id: 1, rol: 'ADMIN' });
        const res = crearRes();

        await esMasterJwt({ cookies: { access_token: 'token' } }, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(403);
    });

    test.each([
        ['inexistente', null],
        ['inactivo', { id: 1, activo: false, rol: 'MASTER' }],
        ['con rol distinto', { id: 1, activo: true, rol: 'ADMIN' }],
    ])('responde 401 si el administrador es %s', async (_caso, admin) => {
        jwt.verify.mockReturnValue({ id: 1, rol: 'MASTER' });
        Admin.findByPk.mockResolvedValue(admin);
        const res = crearRes();

        await esMasterJwt({ cookies: { access_token: 'token' } }, res, jest.fn());

        expect(limpiarCookieSesion).toHaveBeenCalledWith(res);
        expect(res.status).toHaveBeenCalledWith(401);
    });

    test('deja pasar a un MASTER activo y actualiza req.usuario', async () => {
        jwt.verify.mockReturnValue({ id: 2, rol: 'MASTER' });
        Admin.findByPk.mockResolvedValue({ id: 2, nombre: 'Master', rol: 'MASTER', activo: true });
        const req = { cookies: { access_token: 'token' } };
        const next = jest.fn();

        await esMasterJwt(req, crearRes(), next);

        expect(req.usuario).toEqual({ id: 2, nombre: 'Master', rol: 'MASTER' });
        expect(next).toHaveBeenCalled();
    });
});
