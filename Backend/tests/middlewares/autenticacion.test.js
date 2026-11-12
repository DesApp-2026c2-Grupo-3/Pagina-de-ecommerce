jest.mock('../../src/services/authService', () => ({
    resolverIdentidad: jest.fn(),
}));

const { resolverIdentidad } = require('../../src/services/authService');
const {
    autenticarUsuario,
    autenticarAdmin,
    autenticarCualquiera,
    soloMaster,
    deSuSucursal,
} = require('../../src/middleware/autenticacion');

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

function crearReq(authorization, cookies = {}) {
    return {
        headers: authorization === undefined ? {} : { authorization },
        cookies,
    };
}

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('autenticarUsuario', () => {
    test('responde 401 si no viene el header de autorización', async () => {
        const res = crearRes();
        const next = jest.fn();

        await autenticarUsuario(crearReq(), res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Iniciá sesión para continuar' });
        expect(next).not.toHaveBeenCalled();
    });

    test('responde 401 si el header no es del tipo Bearer', async () => {
        const res = crearRes();
        const next = jest.fn();

        await autenticarUsuario(crearReq('Basic abc123'), res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Iniciá sesión para continuar' });
        expect(resolverIdentidad).not.toHaveBeenCalled();
    });

    test('responde 401 si el token viene vacío', async () => {
        const res = crearRes();
        const next = jest.fn();

        await autenticarUsuario(crearReq('Bearer '), res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Iniciá sesión para continuar' });
        expect(resolverIdentidad).not.toHaveBeenCalled();
    });

    test('deja pasar un cliente y guarda su identidad en req.usuario', async () => {
        resolverIdentidad.mockResolvedValue({
            tipo: 'cliente',
            id: 7,
            nombre: 'Juan',
            sucursalId: 2,
        });
        const req = crearReq('Bearer token-valido');
        const res = crearRes();
        const next = jest.fn();

        await autenticarUsuario(req, res, next);

        expect(resolverIdentidad).toHaveBeenCalledWith('token-valido');
        expect(req.usuario).toEqual({ id: 7, nombre: 'Juan', sucursalId: 2 });
        expect(req.identidad).toMatchObject({ tipo: 'cliente', id: 7 });
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    test('acepta el token desde la cookie access_token', async () => {
        resolverIdentidad.mockResolvedValue({
            tipo: 'cliente',
            id: 7,
            nombre: 'Juan',
            sucursalId: null,
        });
        const req = crearReq(undefined, { access_token: 'token-cookie' });
        const next = jest.fn();

        await autenticarUsuario(req, crearRes(), next);

        expect(resolverIdentidad).toHaveBeenCalledWith('token-cookie');
        expect(next).toHaveBeenCalled();
    });

    test('rechaza un token que pertenece a un administrador', async () => {
        resolverIdentidad.mockResolvedValue({
            tipo: 'admin',
            id: 1,
            rol: 'ADMIN',
            sucursalId: 2,
            nombre: 'Ana',
        });
        const res = crearRes();
        const next = jest.fn();

        await autenticarUsuario(crearReq('Bearer token-admin'), res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Tu sesión venció. Iniciá sesión de nuevo' });
        expect(next).not.toHaveBeenCalled();
    });

    test('responde 401 si el token venció o es inválido', async () => {
        resolverIdentidad.mockRejectedValue({ codigo: 'AUTH_EXPIRED' });
        const res = crearRes();
        const next = jest.fn();

        await autenticarUsuario(crearReq('Bearer token-vencido'), res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Tu sesión venció. Iniciá sesión de nuevo' });
        expect(next).not.toHaveBeenCalled();
    });
});

describe('autenticarAdmin', () => {
    test('responde 401 si no viene token', async () => {
        const res = crearRes();
        const next = jest.fn();

        await autenticarAdmin(crearReq(), res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Iniciá sesión para continuar' });
        expect(next).not.toHaveBeenCalled();
    });

    test('responde 401 si el token venció o es inválido', async () => {
        resolverIdentidad.mockRejectedValue({ codigo: 'AUTH_INVALID' });
        const res = crearRes();
        const next = jest.fn();

        await autenticarAdmin(crearReq('Bearer token-vencido'), res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Tu sesión venció. Iniciá sesión de nuevo' });
        expect(next).not.toHaveBeenCalled();
    });

    test('rechaza un token de cliente', async () => {
        resolverIdentidad.mockResolvedValue({
            tipo: 'cliente',
            id: 3,
            nombre: 'Juan',
            sucursalId: null,
        });
        const res = crearRes();
        const next = jest.fn();

        await autenticarAdmin(crearReq('Bearer token-cliente'), res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Iniciá sesión como administrador' });
        expect(next).not.toHaveBeenCalled();
    });

    test('responde 500 si falla la base al resolver la identidad', async () => {
        resolverIdentidad.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();
        const next = jest.fn();

        await autenticarAdmin(crearReq('Bearer token-admin'), res, next);

        expect(console.error).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Error del servidor' });
        expect(next).not.toHaveBeenCalled();
    });

    test('deja pasar un administrador y guarda req.admin y req.usuario', async () => {
        resolverIdentidad.mockResolvedValue({
            tipo: 'admin',
            id: 3,
            nombre: 'Ana',
            rol: 'ADMIN',
            sucursalId: 2,
        });
        const req = crearReq('Bearer token-admin');
        const res = crearRes();
        const next = jest.fn();

        await autenticarAdmin(req, res, next);

        expect(req.admin).toEqual({
            id: 3,
            nombre: 'Ana',
            rol: 'ADMIN',
            sucursalId: 2,
        });
        expect(req.usuario).toEqual({ id: 3, nombre: 'Ana', rol: 'ADMIN' });
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });
});

describe('autenticarCualquiera', () => {
    test('deja pasar un cliente o un admin y guarda req.identidad', async () => {
        resolverIdentidad.mockResolvedValue({ tipo: 'cliente', id: 7 });
        const req = crearReq('Bearer token');
        const next = jest.fn();

        await autenticarCualquiera(req, crearRes(), next);

        expect(req.identidad).toEqual({ tipo: 'cliente', id: 7 });
        expect(next).toHaveBeenCalled();
    });

    test('responde 401 sin token', async () => {
        const res = crearRes();

        await autenticarCualquiera(crearReq(), res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(401);
    });
});

describe('soloMaster', () => {
    test('deja pasar al administrador MASTER', () => {
        const req = { admin: { rol: 'MASTER' } };
        const res = crearRes();
        const next = jest.fn();

        soloMaster(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    test('responde 403 a un administrador que no es MASTER', () => {
        const req = { admin: { rol: 'ADMIN' } };
        const res = crearRes();
        const next = jest.fn();

        soloMaster(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'No tenés permiso para esta acción' });
        expect(next).not.toHaveBeenCalled();
    });

    test('responde 403 si no hay administrador autenticado', () => {
        const req = {};
        const res = crearRes();
        const next = jest.fn();

        soloMaster(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'No tenés permiso para esta acción' });
        expect(next).not.toHaveBeenCalled();
    });
});

describe('deSuSucursal', () => {
    test('deja pasar a MASTER sin consultar la sucursal', async () => {
        const obtenerSucursalId = jest.fn();
        const req = { admin: { rol: 'MASTER' } };
        const res = crearRes();
        const next = jest.fn();

        await deSuSucursal(obtenerSucursalId)(req, res, next);

        expect(obtenerSucursalId).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    test('responde 404 si no se encuentra la sucursal', async () => {
        const req = { admin: { rol: 'ADMIN', sucursalId: 2 } };
        const res = crearRes();
        const next = jest.fn();

        await deSuSucursal(() => Promise.resolve(null))(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'No encontrado' });
        expect(next).not.toHaveBeenCalled();
    });

    test('responde 403 si el administrador intenta gestionar otra sucursal', async () => {
        const req = { admin: { rol: 'ADMIN', sucursalId: 2 } };
        const res = crearRes();
        const next = jest.fn();

        await deSuSucursal(() => Promise.resolve(3))(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Solo podés gestionar tu sucursal' });
        expect(next).not.toHaveBeenCalled();
    });

    test('acepta la sucursal propia aunque el id venga como texto', async () => {
        const req = { admin: { rol: 'ADMIN', sucursalId: 2 } };
        const res = crearRes();
        const next = jest.fn();

        await deSuSucursal(() => Promise.resolve('2'))(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    test('responde 500 si falla la consulta de la sucursal', async () => {
        const req = { admin: { rol: 'ADMIN', sucursalId: 2 } };
        const res = crearRes();
        const next = jest.fn();

        await deSuSucursal(() => Promise.reject(new Error('Base caída')))(req, res, next);

        expect(console.error).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Error del servidor' });
        expect(next).not.toHaveBeenCalled();
    });
});
