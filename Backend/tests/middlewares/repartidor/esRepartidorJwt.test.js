
const { esRepartidorJwt } = require('../../../src/middleware/repartidor/esRepartidorJwt');

const jwt = require('jsonwebtoken');
const { Repartidor } = require('../../../src/models');

jest.mock('jsonwebtoken', () => ({
    verify: jest.fn(),
}));

jest.mock('../../../src/models', () => ({
    Repartidor: {
        findByPk: jest.fn(),
    },
}));

function crearReq(token = 'token-valido') {
    return {
        cookies: token ? { repartidor_token: token } : {},
    };
}

function crearRes() {
    const res = {};

    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.clearCookie = jest.fn().mockReturnValue(res);

    return res;
}

const SECRET_ORIGINAL = process.env.SECRET_JWT_REPARTIDOR;

beforeEach(() => {
    jest.clearAllMocks();
    process.env.SECRET_JWT_REPARTIDOR = 'secreto-de-prueba';
});

afterEach(() => {
    jest.restoreAllMocks();

    if (SECRET_ORIGINAL === undefined) {
        delete process.env.SECRET_JWT_REPARTIDOR;
    } else {
        process.env.SECRET_JWT_REPARTIDOR = SECRET_ORIGINAL;
    }
});


describe('esRepartidorJwt', () => {
    test('debería devolver 401 si no hay token', async () => {
        const req = crearReq(null);
        const res = crearRes();
        const next = jest.fn();

        await esRepartidorJwt(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            mensaje: 'No hay una sesión de repartidor activa',
        });

        expect(jwt.verify).not.toHaveBeenCalled();
        expect(Repartidor.findByPk).not.toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
    });

    test('debería devolver 500 si no está configurado el secreto JWT', async () => {
        delete process.env.SECRET_JWT_REPARTIDOR;

        const consoleSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => {});

        const req = crearReq();
        const res = crearRes();
        const next = jest.fn();

        await esRepartidorJwt(req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            mensaje: 'Error de configuración del servidor',
        });

        expect(consoleSpy).toHaveBeenCalledWith(
            'Falta configurar SECRET_JWT_REPARTIDOR'
        );

        expect(jwt.verify).not.toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
    });

    test('debería devolver 401 y limpiar la cookie si el token es inválido', async () => {
        jwt.verify.mockImplementation(() => {
            throw new Error('Token inválido');
        });

        const req = crearReq();
        const res = crearRes();
        const next = jest.fn();

        await esRepartidorJwt(req, res, next);

        expect(jwt.verify).toHaveBeenCalledWith(
            'token-valido',
            'secreto-de-prueba'
        );

        expect(res.clearCookie).toHaveBeenCalledWith(
            'repartidor_token',
            expect.objectContaining({
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
            })
        );

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            mensaje: 'La sesión es inválida o expiró',
        });

        expect(Repartidor.findByPk).not.toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
    });

    test('debería devolver 401 y limpiar la cookie si el repartidor no existe', async () => {
        jwt.verify.mockReturnValue({ id: 10 });
        Repartidor.findByPk.mockResolvedValue(null);

        const req = crearReq();
        const res = crearRes();
        const next = jest.fn();

        await esRepartidorJwt(req, res, next);

        expect(Repartidor.findByPk).toHaveBeenCalledWith(10);
        expect(res.clearCookie).toHaveBeenCalledWith(
            'repartidor_token',
            expect.any(Object)
        );

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            mensaje: 'La sesión no es válida o el repartidor está inactivo',
        });

        expect(next).not.toHaveBeenCalled();
    });

    test('debería devolver 401 y limpiar la cookie si el repartidor está inactivo', async () => {
        jwt.verify.mockReturnValue({ id: 10 });
        Repartidor.findByPk.mockResolvedValue({
            id: 10,
            sucursalId: 2,
            activo: false,
        });

        const req = crearReq();
        const res = crearRes();
        const next = jest.fn();

        await esRepartidorJwt(req, res, next);

        expect(res.clearCookie).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            mensaje: 'La sesión no es válida o el repartidor está inactivo',
        });

        expect(next).not.toHaveBeenCalled();
    });

    test('debería autenticar al repartidor y ejecutar next si la sesión es válida', async () => {
        jwt.verify.mockReturnValue({ id: 10 });

        Repartidor.findByPk.mockResolvedValue({
            id: 10,
            sucursalId: 3,
            activo: true,
        });

        const req = crearReq();
        const res = crearRes();
        const next = jest.fn();

        await esRepartidorJwt(req, res, next);

        expect(req.repartidor).toEqual({
            id: 10,
            sucursalId: 3,
        });

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
        expect(res.clearCookie).not.toHaveBeenCalled();
    });

    test('debería devolver 500 si ocurre un error al buscar al repartidor', async () => {
        jwt.verify.mockReturnValue({ id: 10 });

        Repartidor.findByPk.mockRejectedValue(
            new Error('Error de base de datos')
        );

        const consoleSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => {});

        const req = crearReq();
        const res = crearRes();
        const next = jest.fn();

        await esRepartidorJwt(req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            mensaje: 'Error al verificar la sesión',
        });

        expect(consoleSpy).toHaveBeenCalledWith(
            'Error al autenticar repartidor:',
            'Error de base de datos'
        );

        expect(next).not.toHaveBeenCalled();
    });
});
