jest.mock('../../../src/services/authService', () => ({
    resolverIdentidad: jest.fn(),
}));

const { resolverIdentidad } = require('../../../src/services/authService');
const { esRepartidorJwt } = require('../../../src/middleware/repartidor/esRepartidorJwt');

function crearReq(headers = {}) {
    return { headers };
}

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

function errorAuth(codigo) {
    const error = new Error(codigo);
    error.codigo = codigo;
    return error;
}

const identidadRepartidor = {
    tipo: 'repartidor',
    id: 9,
    rol: 'REPARTIDOR',
    sucursalId: 2,
    nombre: 'Juan Pérez',
};

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe('esRepartidorJwt', () => {
    test('responde 401 si no viene el header de autorización', async () => {
        const res = crearRes();
        const next = jest.fn();

        await esRepartidorJwt(crearReq(), res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Iniciá sesión para continuar' });
        expect(resolverIdentidad).not.toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
    });

    test('responde 401 si el header no es del tipo Bearer', async () => {
        const res = crearRes();
        const next = jest.fn();

        await esRepartidorJwt(crearReq({ authorization: 'Basic abc123' }), res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(resolverIdentidad).not.toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
    });

    test('responde 401 si el token viene vacío', async () => {
        const res = crearRes();
        const next = jest.fn();

        await esRepartidorJwt(crearReq({ authorization: 'Bearer    ' }), res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(resolverIdentidad).not.toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
    });

    test('no lee la cookie repartidor_token', async () => {
        const req = { headers: {}, cookies: { repartidor_token: 'token-viejo' } };
        const res = crearRes();
        const next = jest.fn();

        await esRepartidorJwt(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(resolverIdentidad).not.toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
    });

    test('responde 401 si el token venció o es inválido', async () => {
        resolverIdentidad.mockRejectedValue(errorAuth('AUTH_EXPIRED'));
        const res = crearRes();
        const next = jest.fn();

        await esRepartidorJwt(crearReq({ authorization: 'Bearer token-vencido' }), res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            mensaje: 'Tu sesión venció. Iniciá sesión de nuevo',
        });
        expect(next).not.toHaveBeenCalled();
    });

    test('responde 401 si el repartidor está inactivo o fue dado de baja', async () => {
        resolverIdentidad.mockRejectedValue(errorAuth('AUTH_INVALID'));
        const res = crearRes();
        const next = jest.fn();

        await esRepartidorJwt(crearReq({ authorization: 'Bearer token-valido' }), res, next);

        expect(resolverIdentidad).toHaveBeenCalledWith('token-valido');
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    test('responde 500 si falla la base al resolver la identidad', async () => {
        resolverIdentidad.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();
        const next = jest.fn();

        await esRepartidorJwt(crearReq({ authorization: 'Bearer token-valido' }), res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Error del servidor' });
        expect(next).not.toHaveBeenCalled();
    });

    test.each([
        ['un cliente', { tipo: 'cliente', id: 7, rol: 'cliente', sucursalId: 2 }],
        ['un administrador', { tipo: 'admin', id: 3, rol: 'ADMIN', sucursalId: 2 }],
    ])('responde 403 si el token es de %s', async (_, identidad) => {
        resolverIdentidad.mockResolvedValue(identidad);
        const res = crearRes();
        const next = jest.fn();

        await esRepartidorJwt(crearReq({ authorization: 'Bearer token-ajeno' }), res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Acceso no autorizado' });
        expect(next).not.toHaveBeenCalled();
    });

    test('deja pasar a un repartidor activo y guarda req.identidad y req.repartidor', async () => {
        resolverIdentidad.mockResolvedValue(identidadRepartidor);
        const req = crearReq({ authorization: 'Bearer token-valido' });
        const res = crearRes();
        const next = jest.fn();

        await esRepartidorJwt(req, res, next);

        expect(resolverIdentidad).toHaveBeenCalledWith('token-valido');
        expect(req.identidad).toEqual(identidadRepartidor);
        expect(req.repartidor).toEqual({ id: 9, sucursalId: 2 });
        expect(res.status).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith();
    });
});
