
const {
    obtenerViajesPorSucursal,
    reasignarViaje,
} = require('../../../src/controllers/admin/viajeController');

const {
    Viaje,
    Pedido,
    Repartidor,
    Usuario,
    Admin,
    Sucursal,
} = require('../../../src/models');

const { Op } = require('sequelize');

jest.mock('../../../src/models', () => ({
    Viaje: {
        findAll: jest.fn(),
        findByPk: jest.fn(),
        findOne: jest.fn(),
        sequelize: {
            transaction: jest.fn(),
        },
    },
    Pedido: {},
    Repartidor: {
        findByPk: jest.fn(),
    },
    Usuario: {},
    Admin: {
        findByPk: jest.fn(),
    },
    Sucursal: {
        findByPk: jest.fn(),
    },
}));

function crearRes() {
    const res = {};

    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);

    return res;
}

function crearRequest({
    params = {},
    body = {},
    usuario = { id: 1, rol: 'MASTER', sucursalId: null },
} = {}) {
    return { params, body, usuario };
}

const adminMaster = { id: 1, sucursalId: null };

function configurarTransaccion() {
    const transaction = {
        LOCK: {
            UPDATE: 'UPDATE',
        },
    };

    Viaje.sequelize.transaction.mockImplementation(
        async (callback) => callback(transaction)
    );

    return transaction;
}


function crearViaje(overrides = {}) {
    const viaje = {
        id: 10,
        repartidorId: 3,
        estado: 'requiere asistencia',
        update: jest.fn(),
        ...overrides,
    };

    viaje.update.mockImplementation(async (datos) => {
        Object.assign(viaje, datos);
    });

    return viaje;
}

function crearRepartidor(overrides = {}) {
    return {
        id: 5,
        nombre: 'Juan',
        apellido: 'Pérez',
        sucursalId: 2,
        activo: true,
        ...overrides,
    };
}


beforeEach(() => {
    jest.clearAllMocks();
});

afterEach(() => {
    jest.restoreAllMocks();
});


describe('obtenerViajesPorSucursal', () => {
    test('debería devolver 401 si el administrador no existe', async () => {
        Admin.findByPk.mockResolvedValue(null);

        const req = crearRequest({
            params: { id: 1 },
        });
        const res = crearRes();

        await obtenerViajesPorSucursal(req, res);

        expect(Admin.findByPk).toHaveBeenCalledWith(1);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            mensaje: 'Iniciá sesión de nuevo',
        });

        expect(Sucursal.findByPk).not.toHaveBeenCalled();
        expect(Viaje.findAll).not.toHaveBeenCalled();
    });

    test('debería devolver 404 si la sucursal no existe', async () => {
        Admin.findByPk.mockResolvedValue({
            id: 1,
            sucursalId: null,
        });
        Sucursal.findByPk.mockResolvedValue(null);

        const req = crearRequest({
            params: { id: 99 },
        });
        const res = crearRes();

        await obtenerViajesPorSucursal(req, res);

        expect(Sucursal.findByPk).toHaveBeenCalledWith(99);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            mensaje: 'Sucursal no encontrada',
        });

        expect(Viaje.findAll).not.toHaveBeenCalled();
    });

    test('debería devolver 403 si el administrador intenta consultar otra sucursal', async () => {
        Admin.findByPk.mockResolvedValue({
            id: 2,
            sucursalId: 5,
        });
        Sucursal.findByPk.mockResolvedValue({
            id: 8,
        });

        const req = crearRequest({
            params: { id: 8 },
            usuario: { id: 2, rol: 'ADMIN', sucursalId: 5 },
        });
        const res = crearRes();

        await obtenerViajesPorSucursal(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            mensaje: 'No tienes permisos para acceder a esta sucursal',
        });

        expect(Viaje.findAll).not.toHaveBeenCalled();
    });

    test('MASTER debería poder consultar los viajes de cualquier sucursal', async () => {
        const viajes = [
            { id: 1, estado: 'activo' },
            { id: 2, estado: 'finalizado' },
        ];

        Admin.findByPk.mockResolvedValue({
            id: 1,
            sucursalId: null,
        });
        Sucursal.findByPk.mockResolvedValue({
            id: 8,
        });
        Viaje.findAll.mockResolvedValue(viajes);

        const req = crearRequest({
            params: { id: 8 },
        });
        const res = crearRes();

        await obtenerViajesPorSucursal(req, res);

        expect(Viaje.findAll).toHaveBeenCalledWith({
            include: [
                {
                    model: Repartidor,
                    attributes: ['id', 'nombre', 'apellido'],
                    where: { sucursalId: 8 },
                    required: true,
                },
                {
                    model: Pedido,
                    attributes: ['id', 'fecha', 'estado', 'total'],
                    include: [
                        {
                            model: Usuario,
                            attributes: ['id', 'nombre', 'apellido'],
                        },
                    ],
                },
            ],
            order: [['fechaInicio', 'DESC']],
        });

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(viajes);
    });

    test('administrador común debería poder consultar su propia sucursal', async () => {
        const viajes = [{ id: 3, estado: 'activo' }];

        Admin.findByPk.mockResolvedValue({
            id: 2,
            sucursalId: 5,
        });
        Sucursal.findByPk.mockResolvedValue({
            id: 5,
        });
        Viaje.findAll.mockResolvedValue(viajes);

        const req = crearRequest({
            params: { id: 5 },
            usuario: { id: 2, rol: 'ADMIN', sucursalId: 5 },
        });
        const res = crearRes();

        await obtenerViajesPorSucursal(req, res);

        expect(Viaje.findAll).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(viajes);
    });

    test('debería devolver 500 si ocurre un error al consultar los viajes', async () => {
        const error = new Error('Error de base de datos');

        Admin.findByPk.mockResolvedValue({
            id: 1,
            sucursalId: null,
        });
        Sucursal.findByPk.mockResolvedValue({
            id: 5,
        });
        Viaje.findAll.mockRejectedValue(error);

        const consoleSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => {});

        const req = crearRequest({
            params: { id: 5 },
        });
        const res = crearRes();

        await obtenerViajesPorSucursal(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            mensaje: 'Error al obtener los viajes',
        });

        expect(consoleSpy).toHaveBeenCalled();
    });
});


describe('reasignarViaje', () => {
    const reqValida = () => crearRequest({
        params: { id: 10 },
        body: { repartidorId: 5 },
    });

    function prepararBase() {
    configurarTransaccion();

    Admin.findByPk.mockResolvedValue(adminMaster);

    const viaje = crearViaje();
    Viaje.findByPk.mockResolvedValue(viaje);

    Repartidor.findByPk
        .mockResolvedValueOnce(crearRepartidor({
            id: 3,
            sucursalId: 2,
        }))
        .mockResolvedValueOnce(crearRepartidor({
            id: 5,
            sucursalId: 2,
        }));

    Viaje.findOne.mockResolvedValue(null);

    return viaje;
}

    test('devuelve 400 si el repartidorId no es válido', async () => {
        const req = crearRequest({
            params: { id: 10 },
            body: { repartidorId: 'abc' },
        });
        const res = crearRes();

        await reasignarViaje(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            mensaje: 'Seleccioná un repartidor válido',
        });

        expect(Viaje.sequelize.transaction).not.toHaveBeenCalled();
    });

    test('devuelve 400 si el repartidorId es cero o negativo', async () => {
        const req = crearRequest({
            params: { id: 10 },
            body: { repartidorId: -2 },
        });
        const res = crearRes();

        await reasignarViaje(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            mensaje: 'Seleccioná un repartidor válido',
        });
    });

    test('devuelve 401 si el administrador no existe', async () => {
        configurarTransaccion();
        Admin.findByPk.mockResolvedValue(null);

        const res = crearRes();

        await reasignarViaje(reqValida(), res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            status: 401,
            mensaje: 'Iniciá sesión de nuevo',
        });

        expect(Viaje.findByPk).not.toHaveBeenCalled();
    });

    test('devuelve 404 si el viaje no existe', async () => {
        configurarTransaccion();

        Admin.findByPk.mockResolvedValue(adminMaster);
        Viaje.findByPk.mockResolvedValue(null);

        const res = crearRes();

        await reasignarViaje(reqValida(), res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            status: 404,
            mensaje: 'Viaje no encontrado',
        });
    });

    test('devuelve 400 si el viaje ya no requiere asistencia', async () => {
        configurarTransaccion();

        Admin.findByPk.mockResolvedValue(adminMaster);
        Viaje.findByPk.mockResolvedValue(
            crearViaje({ estado: 'activo' })
        );

        const res = crearRes();

        await reasignarViaje(reqValida(), res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            status: 400,
            mensaje: 'El viaje ya no requiere asistencia',
        });

        expect(Repartidor.findByPk).not.toHaveBeenCalled();
    });

    test('devuelve 404 si no encuentra al repartidor actual', async () => {
        configurarTransaccion();

        Admin.findByPk.mockResolvedValue(adminMaster);
        Viaje.findByPk.mockResolvedValue(crearViaje());
        Repartidor.findByPk.mockResolvedValue(null);

        const res = crearRes();

        await reasignarViaje(reqValida(), res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            status: 404,
            mensaje: 'No se encontró el repartidor actual del viaje',
        });
    });

    test('devuelve 403 si el administrador intenta reasignar un viaje de otra sucursal', async () => {
        configurarTransaccion();

        Admin.findByPk.mockResolvedValue({
            id: 7,
            sucursalId: 8,
        });

        Viaje.findByPk.mockResolvedValue(crearViaje());

        Repartidor.findByPk.mockResolvedValue(
            crearRepartidor({
                id: 3,
                sucursalId: 2,
            })
        );

        const res = crearRes();

        await reasignarViaje(reqValida(), res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            status: 403,
            mensaje: 'No tenés permisos para reasignar este viaje',
        });

        // No debe buscar al nuevo repartidor.
        expect(Repartidor.findByPk).toHaveBeenCalledTimes(1);
    });

    test('devuelve 404 si el nuevo repartidor no existe', async () => {
        configurarTransaccion();

        Admin.findByPk.mockResolvedValue(adminMaster);
        Viaje.findByPk.mockResolvedValue(crearViaje());

        Repartidor.findByPk
            .mockResolvedValueOnce(crearRepartidor({
                id: 3,
                sucursalId: 2,
            }))
            .mockResolvedValueOnce(null);

        const res = crearRes();

        await reasignarViaje(reqValida(), res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            status: 404,
            mensaje: 'El repartidor seleccionado no existe',
        });
    });

    test('devuelve 400 si el nuevo repartidor está inactivo', async () => {
        configurarTransaccion();

        Admin.findByPk.mockResolvedValue(adminMaster);
        Viaje.findByPk.mockResolvedValue(crearViaje());

        Repartidor.findByPk
            .mockResolvedValueOnce(crearRepartidor({
                id: 3,
                sucursalId: 2,
            }))
            .mockResolvedValueOnce(crearRepartidor({
                id: 5,
                activo: false,
                sucursalId: 2,
            }));

        const res = crearRes();

        await reasignarViaje(reqValida(), res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            status: 400,
            mensaje: 'El repartidor seleccionado está inactivo',
        });

        expect(Viaje.findOne).not.toHaveBeenCalled();
    });

    test('devuelve 400 si el nuevo repartidor pertenece a otra sucursal', async () => {
        configurarTransaccion();

        Admin.findByPk.mockResolvedValue(adminMaster);
        Viaje.findByPk.mockResolvedValue(crearViaje());

        Repartidor.findByPk
            .mockResolvedValueOnce(crearRepartidor({
                id: 3,
                sucursalId: 2,
            }))
            .mockResolvedValueOnce(crearRepartidor({
                id: 5,
                sucursalId: 9,
            }));

        const res = crearRes();

        await reasignarViaje(reqValida(), res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            status: 400,
            mensaje: 'El repartidor pertenece a otra sucursal',
        });

        expect(Viaje.findOne).not.toHaveBeenCalled();
    });

    test('devuelve 409 si el nuevo repartidor ya tiene otro viaje en curso', async () => {
        prepararBase();

        Viaje.findOne.mockResolvedValue({
            id: 20,
            estado: 'activo',
        });

        const res = crearRes();

        await reasignarViaje(reqValida(), res);

        expect(Viaje.findOne).toHaveBeenCalledWith({
            where: {
                repartidorId: 5,
                estado: {
                    [Op.in]: [
                        'preparando',
                        'activo',
                        'requiere asistencia',
                    ],
                },
            },
            transaction: expect.anything(),
        });

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({
            status: 409,
            mensaje: 'El repartidor seleccionado ya tiene un viaje en curso',
        });
    });

    test('reasigna correctamente el viaje al nuevo repartidor', async () => {
    const viaje = prepararBase();

    const res = crearRes();

    await reasignarViaje(reqValida(), res);

    expect(viaje.update).toHaveBeenCalledWith(
        {
            repartidorId: 5,
            estado: 'activo',
            recepcionConfirmada: false,
        },
        {
            transaction: expect.anything(),
        }
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
        status: 200,
        mensaje: 'Viaje reasignado correctamente',
        viaje: {
            id: 10,
            repartidorId: 5,
            estado: 'activo',
            Repartidor: {
                id: 5,
                nombre: 'Juan',
                apellido: 'Pérez',
            },
        },
    });
});

    test('devuelve 500 si ocurre un error durante la transacción', async () => {
        Viaje.sequelize.transaction.mockRejectedValue(
            new Error('Error de base de datos')
        );

        const consoleSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => {});

        const res = crearRes();

        await reasignarViaje(reqValida(), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            mensaje: 'Error al reasignar el viaje',
        });

        expect(consoleSpy).toHaveBeenCalled();
    });
});
