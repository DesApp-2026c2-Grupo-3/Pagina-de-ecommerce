jest.mock('bcrypt', () => ({
    hash: jest.fn(),
    compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(() => 'token-falso'),
}));

jest.mock('../../../src/models', () => ({
    Admin: { findAll: jest.fn(), findOne: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
    Sucursal: { findByPk: jest.fn() },
}));

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { Admin, Sucursal } = require('../../../src/models');
const {
    verAdmins,
    crearAdmin,
    login,
    logout,
    obtenerAdminPorId,
    actualizarAdmin,
    eliminarAdmin,
    reactivarAdmin,
} = require('../../../src/controllers/admin/adminController');

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.cookie = jest.fn().mockReturnValue(res);
    res.clearCookie = jest.fn().mockReturnValue(res);
    return res;
}

function adminDeLaBase(datos = {}) {
    return {
        id: 3,
        nombre: 'Ana',
        email: 'ana@burger.com',
        rol: 'ADMIN',
        sucursalId: 2,
        activo: true,
        password: 'hash-viejo',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        Sucursal: { id: 2, nombre: 'Morón' },
        update: jest.fn(),
        save: jest.fn(),
        reload: jest.fn(),
        ...datos,
    };
}

function bodyAdmin(datos = {}) {
    return { nombre: 'Ana', email: 'ana@burger.com', password: 'Segura123', sucursalId: 2, ...datos };
}

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    process.env.NODE_ENV = 'test';
    process.env.SECRET_JWT_TOKEN = 'secreto-test';
});

describe('verAdmins', () => {
    test('devuelve los administradores sin la contraseña', async () => {
        Admin.findAll.mockResolvedValue([adminDeLaBase()]);
        const res = crearRes();

        await verAdmins({}, res);

        expect(Admin.findAll).toHaveBeenCalledWith(expect.objectContaining({
            where: { rol: { [Op.ne]: 'MASTER' } },
            order: [['nombre', 'ASC']],
        }));
        expect(res.status).toHaveBeenCalledWith(200);
        const admins = res.json.mock.calls[0][0];
        expect(admins[0]).toMatchObject({
            id: 3,
            nombre: 'Ana',
            email: 'ana@burger.com',
            rol: 'ADMIN',
            sucursalId: 2,
            activo: true,
            sucursal: { id: 2, nombre: 'Morón' },
        });
        expect(admins[0]).not.toHaveProperty('password');
    });

    test('responde 500 si falla la base de datos', async () => {
        Admin.findAll.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await verAdmins({}, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Error del servidor' });
    });
});

describe('crearAdmin', () => {
    test('exige la sucursal a gestionar', async () => {
        const res = crearRes();

        await crearAdmin({ body: bodyAdmin({ sucursalId: null }) }, res);

        expect(Sucursal.findByPk).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ code: 'Elegí la sucursal que va a gestionar' });
    });

    test('rechaza una sucursal inexistente o inactiva', async () => {
        Sucursal.findByPk.mockResolvedValue({ id: 2, activa: false });
        const res = crearRes();

        await crearAdmin({ body: bodyAdmin() }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ code: 'La sucursal elegida no existe o está inactiva' });
    });

    test('responde 409 si el email ya está en uso', async () => {
        Sucursal.findByPk.mockResolvedValue({ id: 2, activa: true });
        Admin.findOne.mockResolvedValue({ id: 9 });
        const res = crearRes();

        await crearAdmin({ body: bodyAdmin() }, res);

        expect(bcrypt.hash).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({ code: 'email-en-uso' });
    });

    test('crea el administrador con la contraseña encriptada y el email normalizado', async () => {
        Sucursal.findByPk.mockResolvedValue({ id: 2, activa: true });
        Admin.findOne.mockResolvedValue(null);
        bcrypt.hash.mockResolvedValue('hash-seguro');
        const creado = adminDeLaBase({ id: 8, nombre: 'Ana', email: 'ana@burger.com' });
        Admin.create.mockResolvedValue(creado);
        const res = crearRes();

        await crearAdmin({
            body: bodyAdmin({ nombre: '  Ana  ', email: ' ANA@Burger.com ', sucursalId: 2 }),
        }, res);

        expect(bcrypt.hash).toHaveBeenCalledWith('Segura123', 10);
        expect(Admin.create).toHaveBeenCalledWith({
            nombre: 'Ana',
            email: 'ana@burger.com',
            password: 'hash-seguro',
            rol: 'ADMIN',
            sucursalId: 2,
        });
        expect(creado.reload).toHaveBeenCalledWith({ include: expect.anything() });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json.mock.calls[0][0]).not.toHaveProperty('password');
    });

    test('responde 500 si falla la base de datos', async () => {
        Sucursal.findByPk.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await crearAdmin({ body: bodyAdmin() }, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Error del servidor' });
    });
});

describe('login', () => {
    const body = { email: ' ANA@Burger.com ', password: 'Segura123' };

    test('responde 401 si el email no existe', async () => {
        Admin.findOne.mockResolvedValue(null);
        const res = crearRes();

        await login({ body }, res);

        expect(Admin.findOne).toHaveBeenCalledWith(expect.objectContaining({
            where: { email: 'ana@burger.com' },
        }));
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ code: 'email-password-incorrectos' });
    });

    test('responde 401 si el administrador está inactivo', async () => {
        Admin.findOne.mockResolvedValue(adminDeLaBase({ activo: false }));
        const res = crearRes();

        await login({ body }, res);

        expect(bcrypt.compare).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ code: 'email-password-incorrectos' });
    });

    test('responde 401 si la contraseña es incorrecta', async () => {
        Admin.findOne.mockResolvedValue(adminDeLaBase());
        bcrypt.compare.mockResolvedValue(false);
        const res = crearRes();

        await login({ body }, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ code: 'email-password-incorrectos' });
    });

    test('con datos correctos firma el token, deja la cookie y devuelve el admin sin contraseña', async () => {
        Admin.findOne.mockResolvedValue(adminDeLaBase());
        bcrypt.compare.mockResolvedValue(true);
        const res = crearRes();

        await login({ body }, res);

        expect(bcrypt.compare).toHaveBeenCalledWith('Segura123', 'hash-viejo');
        expect(jwt.sign).toHaveBeenCalledWith(
            { id: 3, nombre: 'Ana', rol: 'ADMIN' },
            'secreto-test',
            { expiresIn: '4h' }
        );
        expect(res.cookie).toHaveBeenCalledWith('access_token', 'token-falso', expect.objectContaining({
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
            secure: false,
            maxAge: 4 * 60 * 60 * 1000,
        }));
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json.mock.calls[0][0]).not.toHaveProperty('password');
    });

    test('en producción marca la cookie como secure', async () => {
        process.env.NODE_ENV = 'production';
        Admin.findOne.mockResolvedValue(adminDeLaBase());
        bcrypt.compare.mockResolvedValue(true);
        const res = crearRes();

        await login({ body }, res);

        expect(res.cookie).toHaveBeenCalledWith('access_token', 'token-falso', expect.objectContaining({
            secure: true,
        }));
    });

    test('responde 500 si falla la base de datos', async () => {
        Admin.findOne.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await login({ body }, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Error al loguear' });
    });
});

describe('logout', () => {
    test('borra la cookie con las mismas opciones del login', async () => {
        const res = crearRes();

        await logout({}, res);

        expect(res.clearCookie).toHaveBeenCalledWith('access_token', expect.objectContaining({
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
            secure: false,
        }));
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Sesión cerrada' });
    });

    test('responde 500 si falla al cerrar la sesión', async () => {
        const res = crearRes();
        res.clearCookie.mockImplementation(() => {
            throw new Error('No se pudo');
        });

        await logout({}, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Error al cerrar sesión' });
    });
});

describe('obtenerAdminPorId', () => {
    test('devuelve el administrador con su sucursal', async () => {
        Admin.findByPk.mockResolvedValue(adminDeLaBase());
        const res = crearRes();

        await obtenerAdminPorId({ params: { id: '3' } }, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json.mock.calls[0][0]).toMatchObject({
            id: 3,
            nombre: 'Ana',
            sucursal: { id: 2, nombre: 'Morón' },
        });
    });

    test('responde 404 si no existe', async () => {
        Admin.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await obtenerAdminPorId({ params: { id: '99' } }, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Administrador no encontrado' });
    });

    test('responde 500 si falla la base de datos', async () => {
        Admin.findByPk.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await obtenerAdminPorId({ params: { id: '3' } }, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('actualizarAdmin', () => {
    test('responde 404 si no existe', async () => {
        Admin.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await actualizarAdmin({ params: { id: '99' }, body: {} }, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('responde 409 si el email pertenece a otra cuenta', async () => {
        Admin.findByPk.mockResolvedValue(adminDeLaBase());
        Admin.findOne.mockResolvedValue({ id: 9 });
        const res = crearRes();

        await actualizarAdmin({
            params: { id: '3' },
            body: { email: 'otro@burger.com' },
        }, res);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({ code: 'email-en-uso' });
    });

    test('actualiza nombre y email, y permite conservar el propio email', async () => {
        const admin = adminDeLaBase();
        Admin.findByPk.mockResolvedValue(admin);
        Admin.findOne.mockResolvedValue({ id: 3 });
        Sucursal.findByPk.mockResolvedValue({ id: 2, activa: true });
        const res = crearRes();

        await actualizarAdmin({
            params: { id: '3' },
            body: { nombre: '  Ana María  ', email: ' ANA@Burger.com ', sucursalId: 2 },
        }, res);

        expect(admin.update).toHaveBeenCalledWith({
            nombre: 'Ana María',
            email: 'ana@burger.com',
            sucursalId: 2,
        });
        expect(admin.reload).toHaveBeenCalledWith({ include: expect.anything() });
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('un MASTER no cambia de sucursal', async () => {
        const admin = adminDeLaBase({ rol: 'MASTER', sucursalId: null });
        Admin.findByPk.mockResolvedValue(admin);
        Admin.findOne.mockResolvedValue(null);

        await actualizarAdmin({
            params: { id: '3' },
            body: { sucursalId: 99 },
        }, crearRes());

        expect(Sucursal.findByPk).not.toHaveBeenCalled();
        expect(admin.update).toHaveBeenCalledWith(expect.not.objectContaining({ sucursalId: 99 }));
    });

    test('rechaza una sucursal inválida para un ADMIN', async () => {
        Admin.findByPk.mockResolvedValue(adminDeLaBase());
        Admin.findOne.mockResolvedValue(null);
        Sucursal.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await actualizarAdmin({
            params: { id: '3' },
            body: { sucursalId: 99 },
        }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ code: 'La sucursal elegida no existe o está inactiva' });
    });

    test('encripta la contraseña si viene una nueva', async () => {
        const admin = adminDeLaBase();
        Admin.findByPk.mockResolvedValue(admin);
        Admin.findOne.mockResolvedValue(null);
        bcrypt.hash.mockResolvedValue('hash-nuevo');

        await actualizarAdmin({
            params: { id: '3' },
            body: { password: 'Nueva123' },
        }, crearRes());

        expect(bcrypt.hash).toHaveBeenCalledWith('Nueva123', 10);
        expect(admin.update).toHaveBeenCalledWith(expect.objectContaining({ password: 'hash-nuevo' }));
    });

    test('responde 500 si falla la base de datos', async () => {
        Admin.findByPk.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await actualizarAdmin({ params: { id: '3' }, body: {} }, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('eliminarAdmin', () => {
    test('responde 404 si no existe', async () => {
        Admin.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await eliminarAdmin({ params: { id: '99' } }, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('no permite eliminar a un MASTER', async () => {
        Admin.findByPk.mockResolvedValue(adminDeLaBase({ rol: 'MASTER' }));
        const res = crearRes();

        await eliminarAdmin({ params: { id: '1' } }, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Error al intentar eliminar el administrador' });
    });

    test('desactiva el administrador (borrado lógico)', async () => {
        const admin = adminDeLaBase();
        Admin.findByPk.mockResolvedValue(admin);
        const res = crearRes();

        await eliminarAdmin({ params: { id: '3' } }, res);

        expect(admin.activo).toBe(false);
        expect(admin.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Administrador eliminado con éxito' });
    });

    test('responde 500 si falla al guardar', async () => {
        const admin = adminDeLaBase();
        admin.save.mockRejectedValue(new Error('Base caída'));
        Admin.findByPk.mockResolvedValue(admin);
        const res = crearRes();

        await eliminarAdmin({ params: { id: '3' } }, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Error al eliminar el Administrador' });
    });
});

describe('reactivarAdmin', () => {
    test('responde 404 si no existe', async () => {
        Admin.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await reactivarAdmin({ params: { id: '99' } }, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('no permite reactivar a un MASTER', async () => {
        Admin.findByPk.mockResolvedValue(adminDeLaBase({ rol: 'MASTER', activo: false }));
        const res = crearRes();

        await reactivarAdmin({ params: { id: '1' } }, res);

        expect(res.status).toHaveBeenCalledWith(403);
    });

    test('responde 400 si el administrador ya está activo', async () => {
        Admin.findByPk.mockResolvedValue(adminDeLaBase({ activo: true }));
        const res = crearRes();

        await reactivarAdmin({ params: { id: '3' } }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'El administrador ya está activo' });
    });

    test('reactiva el administrador', async () => {
        const admin = adminDeLaBase({ activo: false });
        Admin.findByPk.mockResolvedValue(admin);
        const res = crearRes();

        await reactivarAdmin({ params: { id: '3' } }, res);

        expect(admin.activo).toBe(true);
        expect(admin.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Administrador reactivado con éxito' });
    });

    test('responde 500 si falla al guardar', async () => {
        const admin = adminDeLaBase({ activo: false });
        admin.save.mockRejectedValue(new Error('Base caída'));
        Admin.findByPk.mockResolvedValue(admin);
        const res = crearRes();

        await reactivarAdmin({ params: { id: '3' } }, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Error al reactivar el administrador' });
    });
});
