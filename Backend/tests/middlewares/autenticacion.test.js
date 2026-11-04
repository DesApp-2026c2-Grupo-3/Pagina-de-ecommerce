jest.mock('../../src/utils/jwt', () => ({
    verificarToken: jest.fn(),
}));

jest.mock('../../src/models', () => ({
    Admin: { findByPk: jest.fn() },
}));

const { verificarToken } = require('../../src/utils/jwt');
const { Admin } = require('../../src/models');
const {
    autenticarUsuario,
    autenticarAdmin,
    soloMaster,
    deSuSucursal,
} = require('../../src/middleware/autenticacion');

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

function crearReq(authorization) {
    return {
        headers: authorization === undefined ? {} : { authorization },
    };
}

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('autenticarUsuario', () => {
    test('responde 401 si no viene el header de autorización', () => {
        const req = crearReq();
        const res = crearRes();
        const next = jest.fn();

        autenticarUsuario(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Iniciá sesión para continuar' });
        expect(next).not.toHaveBeenCalled();
    });

    test('responde 401 si el header no es del tipo Bearer', () => {
        const req = crearReq('Basic abc123');
        const res = crearRes();
        const next = jest.fn();

        autenticarUsuario(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Iniciá sesión para continuar' });
        expect(verificarToken).not.toHaveBeenCalled();
    });

    test('responde 401 si el token viene vacío', () => {
        const req = crearReq('Bearer ');
        const res = crearRes();
        const next = jest.fn();

        autenticarUsuario(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Iniciá sesión para continuar' });
        expect(verificarToken).not.toHaveBeenCalled();
    });

    test('deja pasar un token válido de usuario y guarda su id en req.usuario', () => {
        verificarToken.mockReturnValue({ id: 7, tipo: 'usuario' });
        const req = crearReq('Bearer token-valido');
        const res = crearRes();
        const next = jest.fn();

        autenticarUsuario(req, res, next);

        expect(verificarToken).toHaveBeenCalledWith('token-valido');
        expect(req.usuario).toEqual({ id: 7 });
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    test('rechaza un token que pertenece a un administrador', () => {
        verificarToken.mockReturnValue({ id: 1, tipo: 'admin' });
        const req = crearReq('Bearer token-admin');
        const res = crearRes();
        const next = jest.fn();

        autenticarUsuario(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Tu sesión venció. Iniciá sesión de nuevo' });
        expect(next).not.toHaveBeenCalled();
    });

    test('responde 401 si el token venció o es inválido', () => {
        verificarToken.mockImplementation(() => {
            throw new Error('jwt expired');
        });
        const req = crearReq('Bearer token-vencido');
        const res = crearRes();
        const next = jest.fn();

        autenticarUsuario(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Tu sesión venció. Iniciá sesión de nuevo' });
        expect(next).not.toHaveBeenCalled();
    });
});

describe('autenticarAdmin', () => {
    test('responde 401 si no viene el header de autorización', async () => {
        const req = crearReq();
        const res = crearRes();
        const next = jest.fn();

        await autenticarAdmin(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Iniciá sesión para continuar' });
        expect(Admin.findByPk).not.toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
    });

    test('responde 401 si el token venció o es inválido', async () => {
        verificarToken.mockImplementation(() => {
            throw new Error('jwt expired');
        });
        const req = crearReq('Bearer token-vencido');
        const res = crearRes();
        const next = jest.fn();

        await autenticarAdmin(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Tu sesión venció. Iniciá sesión de nuevo' });
        expect(Admin.findByPk).not.toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
    });

    test('rechaza un token de cliente', async () => {
        verificarToken.mockReturnValue({ id: 3, tipo: 'usuario' });
        const req = crearReq('Bearer token-cliente');
        const res = crearRes();
        const next = jest.fn();

        await autenticarAdmin(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Iniciá sesión como administrador' });
        expect(Admin.findByPk).not.toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
    });

    test('responde 401 si el administrador ya no existe', async () => {
        verificarToken.mockReturnValue({ id: 3, tipo: 'admin' });
        Admin.findByPk.mockResolvedValue(null);
        const req = crearReq('Bearer token-admin');
        const res = crearRes();
        const next = jest.fn();

        await autenticarAdmin(req, res, next);

        expect(Admin.findByPk).toHaveBeenCalledWith(3, { attributes: ['id', 'rol', 'sucursalId'] });
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Iniciá sesión de nuevo' });
        expect(next).not.toHaveBeenCalled();
    });

    test('responde 500 si falla la base de datos al buscar el administrador', async () => {
        verificarToken.mockReturnValue({ id: 3, tipo: 'admin' });
        Admin.findByPk.mockRejectedValue(new Error('Base caída'));
        const req = crearReq('Bearer token-admin');
        const res = crearRes();
        const next = jest.fn();

        await autenticarAdmin(req, res, next);

        expect(console.error).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Error del servidor' });
        expect(next).not.toHaveBeenCalled();
    });

    test('deja pasar un administrador válido y guarda sus datos en req.admin', async () => {
        verificarToken.mockReturnValue({ id: 3, tipo: 'admin' });
        Admin.findByPk.mockResolvedValue({ id: 3, rol: 'ADMIN', sucursalId: 2 });
        const req = crearReq('Bearer token-admin');
        const res = crearRes();
        const next = jest.fn();

        await autenticarAdmin(req, res, next);

        expect(Admin.findByPk).toHaveBeenCalledWith(3, { attributes: ['id', 'rol', 'sucursalId'] });
        expect(req.admin).toEqual({ id: 3, rol: 'ADMIN', sucursalId: 2 });
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
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
