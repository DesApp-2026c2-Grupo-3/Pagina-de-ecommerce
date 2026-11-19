
jest.mock('../../../src/models', () => ({
    Repartidor: {
        findOne: jest.fn(),
        findByPk: jest.fn(),
    },
}));

jest.mock('bcrypt', () => ({
    compare: jest.fn(),
}));

jest.mock('../../../src/services/authService', () => ({
    firmarTokenRepartidor: jest.fn(),
}));

const { Repartidor } = require('../../../src/models');
const bcrypt = require('bcrypt');
const { firmarTokenRepartidor } = require('../../../src/services/authService');

const {
    login,
    obtenerSesion,
} = require('../../../src/controllers/repartidor/authRepartidorController');

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.cookie = jest.fn().mockReturnValue(res);
    return res;
}

const repartidorBase = {
    id: 1,
    nombre: 'Juan',
    apellido: 'Pérez',
    email: 'juan@gmail.com',
    password: 'password-hasheada',
    activo: true,
    sucursalId: 2,
    Sucursal: {
        id: 2,
        nombre: 'Morón',
    },
};

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});

    firmarTokenRepartidor.mockReturnValue('token-falso');
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe('login', () => {
    test('inicia sesión y devuelve el token y el repartidor, sin cookie', async () => {
        Repartidor.findOne.mockResolvedValue(repartidorBase);
        bcrypt.compare.mockResolvedValue(true);

        const res = crearRes();

        await login({
            body: {
                email: 'juan@gmail.com',
                password: '123456',
            },
        }, res);

        expect(Repartidor.findOne).toHaveBeenCalledWith({
            where: { email: 'juan@gmail.com' },
            include: [{
                association: 'Sucursal',
                attributes: ['id', 'nombre'],
            }],
        });

        expect(bcrypt.compare).toHaveBeenCalledWith(
            '123456',
            'password-hasheada'
        );

        expect(firmarTokenRepartidor).toHaveBeenCalledWith(repartidorBase);
        expect(res.cookie).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);

        expect(res.json).toHaveBeenCalledWith({
            token: 'token-falso',
            repartidor: {
                id: 1,
                nombre: 'Juan',
                apellido: 'Pérez',
                email: 'juan@gmail.com',
                sucursalId: 2,
                Sucursal: repartidorBase.Sucursal,
            },
        });
    });

    test('normaliza el email antes de buscar al repartidor', async () => {
        Repartidor.findOne.mockResolvedValue(repartidorBase);
        bcrypt.compare.mockResolvedValue(true);

        await login({
            body: {
                email: '  JUAN@GMAIL.COM  ',
                password: '123456',
            },
        }, crearRes());

        expect(Repartidor.findOne).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { email: 'juan@gmail.com' },
            })
        );
    });

    test('responde 401 si el repartidor no existe', async () => {
        Repartidor.findOne.mockResolvedValue(null);

        const res = crearRes();

        await login({
            body: {
                email: 'inexistente@gmail.com',
                password: '123456',
            },
        }, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            code: 'email-password-incorrectos',
        });

        expect(bcrypt.compare).not.toHaveBeenCalled();
        expect(firmarTokenRepartidor).not.toHaveBeenCalled();
    });

    test('responde 401 si el repartidor está inactivo', async () => {
        Repartidor.findOne.mockResolvedValue({
            ...repartidorBase,
            activo: false,
        });

        const res = crearRes();

        await login({
            body: {
                email: 'juan@gmail.com',
                password: '123456',
            },
        }, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            code: 'email-password-incorrectos',
        });

        expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    test('responde 401 si la contraseña es incorrecta', async () => {
        Repartidor.findOne.mockResolvedValue(repartidorBase);
        bcrypt.compare.mockResolvedValue(false);

        const res = crearRes();

        await login({
            body: {
                email: 'juan@gmail.com',
                password: 'incorrecta',
            },
        }, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            code: 'email-password-incorrectos',
        });

        expect(firmarTokenRepartidor).not.toHaveBeenCalled();
    });

    test('responde 500 si ocurre un error en la consulta', async () => {
        Repartidor.findOne.mockRejectedValue(new Error('Base caída'));

        const res = crearRes();

        await login({
            body: {
                email: 'juan@gmail.com',
                password: '123456',
            },
        }, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            mensaje: 'Error al iniciar sesión',
        });
    });
});

describe('obtenerSesion', () => {
    test('devuelve los datos del repartidor autenticado sin contraseña', async () => {
        const repartidor = {
            id: 1,
            nombre: 'Juan',
            apellido: 'Pérez',
            email: 'juan@gmail.com',
            activo: true,
            sucursalId: 2,
            Sucursal: {
                id: 2,
                nombre: 'Morón',
            },
        };

        Repartidor.findByPk.mockResolvedValue(repartidor);

        const res = crearRes();

        await obtenerSesion({
            repartidor: { id: 1 },
        }, res);

        expect(Repartidor.findByPk).toHaveBeenCalledWith(
            1,
            expect.objectContaining({
                attributes: { exclude: ['password'] },
                include: [{
                    association: 'Sucursal',
                    attributes: ['id', 'nombre'],
                }],
            })
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(repartidor);
    });

    test('responde 401 si el repartidor no existe', async () => {
        Repartidor.findByPk.mockResolvedValue(null);

        const res = crearRes();

        await obtenerSesion({
            repartidor: { id: 99 },
        }, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            mensaje: 'La sesión no es válida',
        });
    });

    test('responde 401 si el repartidor está inactivo', async () => {
        Repartidor.findByPk.mockResolvedValue({
            ...repartidorBase,
            activo: false,
        });

        const res = crearRes();

        await obtenerSesion({
            repartidor: { id: 1 },
        }, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            mensaje: 'La sesión no es válida',
        });
    });

    test('responde 500 si ocurre un error en la consulta', async () => {
        Repartidor.findByPk.mockRejectedValue(new Error('Base caída'));

        const res = crearRes();

        await obtenerSesion({
            repartidor: { id: 1 },
        }, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            mensaje: 'Error al consultar la sesión',
        });
    });
});
