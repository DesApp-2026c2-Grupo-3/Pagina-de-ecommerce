
const {
    verRepartidores,
    obtenerRepartidorPorId,
    crearRepartidor,
    actualizarRepartidor,
    desactivarRepartidor,
    reactivarRepartidor,
    obtenerRepartidoresDisponibles,
    darDeBajaRepartidor,
} = require('../../../src/controllers/admin/repartidorController');

const {
    Repartidor,
    Sucursal,
    Viaje,
    Admin,
} = require('../../../src/models');

const bcrypt = require('bcrypt');
const { revocarSesiones } = require('../../../src/sockets/revocacion');

jest.mock('../../../src/models', () => ({
    Repartidor: {
        findAll: jest.fn(),
        findByPk: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        associations: {
            Viajes: {},
        },
    },
    Sucursal: {
        findByPk: jest.fn(),
    },
    Viaje: {
        findOne: jest.fn(),
        findAll: jest.fn(),
        findByPk: jest.fn(),
    },
    Admin: {
        findByPk: jest.fn(),
    },
}));

jest.mock('bcrypt', () => ({
    hash: jest.fn(),
}));

jest.mock('../../../src/sockets/revocacion', () => ({
    revocarSesiones: jest.fn(),
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
    usuario = {
        id: 1,
        rol: 'MASTER',
        sucursalId: null,
    },
} = {}) {
    return {
        params,
        body,
        usuario,
    };
}

beforeEach(() => {
    jest.clearAllMocks();
});

afterEach(() => {
    jest.restoreAllMocks();
});



describe('Controlador de repartidores del admin', () => {
    describe('verRepartidores', () => {
        test('MASTER puede obtener todos los repartidores', async () => {
            const repartidores = [
                {
                    id: 1,
                    nombre: 'Juan',
                    apellido: 'Pérez',
                    email: 'juan@test.com',
                    sucursalId: 2,
                    activo: true,
                    createdAt: new Date(),
                    Sucursal: { id: 2, nombre: 'Centro' },
                    Viajes: [{ id: 10 }],
                },
            ];

            Repartidor.findAll.mockResolvedValue(repartidores);

            const req = crearRequest();
            const res = crearRes();

            await verRepartidores(req, res);

            expect(Repartidor.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {},
                    order: [['nombre', 'ASC']],
                })
            );

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([
                expect.objectContaining({
                    id: 1,
                    nombre: 'Juan',
                    sucursal: { id: 2, nombre: 'Centro' },
                    tieneViajeEnCurso: true,
                }),
            ]);
        });

        test('ADMIN solamente obtiene los repartidores de su sucursal', async () => {
            Repartidor.findAll.mockResolvedValue([]);

            const req = crearRequest({
                usuario: {
                    id: 2,
                    rol: 'ADMIN',
                    sucursalId: 5,
                },
            });
            const res = crearRes();

            await verRepartidores(req, res);

            expect(Repartidor.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { sucursalId: 5 },
                })
            );

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([]);
        });

        test('devuelve 500 si ocurre un error al obtener los repartidores', async () => {
            Repartidor.findAll.mockRejectedValue(new Error('Error de base de datos'));

            const req = crearRequest();
            const res = crearRes();

            await verRepartidores(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                mensaje: 'Error al obtener los repartidores',
            });
        });
    });

    describe('obtenerRepartidorPorId', () => {
        test('obtiene un repartidor existente', async () => {
            const repartidor = {
                id: 1,
                nombre: 'Juan',
                apellido: 'Pérez',
                email: 'juan@test.com',
                sucursalId: 2,
                activo: true,
                createdAt: new Date(),
                Sucursal: { id: 2, nombre: 'Centro' },
            };

            Repartidor.findByPk.mockResolvedValue(repartidor);
            Viaje.findOne.mockResolvedValue(null);

            const req = crearRequest({
                params: { id: 1 },
            });
            const res = crearRes();

            await obtenerRepartidorPorId(req, res);

            expect(Repartidor.findByPk).toHaveBeenCalledWith(
                1,
                expect.objectContaining({
                    include: expect.any(Array),
                })
            );

            expect(Viaje.findOne).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 1,
                    tieneViajeEnCurso: false,
                })
            );
        });

        test('devuelve 404 si el repartidor no existe', async () => {
            Repartidor.findByPk.mockResolvedValue(null);

            const req = crearRequest({
                params: { id: 99 },
            });
            const res = crearRes();

            await obtenerRepartidorPorId(req, res);

            expect(Viaje.findOne).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                mensaje: 'Repartidor no encontrado',
            });
        });

        test('ADMIN no puede consultar un repartidor de otra sucursal', async () => {
            Repartidor.findByPk.mockResolvedValue({
                id: 1,
                sucursalId: 8,
            });

            const req = crearRequest({
                params: { id: 1 },
                usuario: {
                    id: 2,
                    rol: 'ADMIN',
                    sucursalId: 5,
                },
            });
            const res = crearRes();

            await obtenerRepartidorPorId(req, res);

            expect(Viaje.findOne).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                mensaje: 'No tenés permisos para consultar este repartidor',
            });
        });

        test('indica si el repartidor tiene un viaje en curso', async () => {
            Repartidor.findByPk.mockResolvedValue({
                id: 1,
                nombre: 'Juan',
                apellido: 'Pérez',
                email: 'juan@test.com',
                sucursalId: 2,
                activo: true,
                createdAt: new Date(),
                Sucursal: null,
            });

            Viaje.findOne.mockResolvedValue({ id: 10 });

            const req = crearRequest({
                params: { id: 1 },
            });
            const res = crearRes();

            await obtenerRepartidorPorId(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    tieneViajeEnCurso: true,
                })
            );
        });

        test('devuelve 500 si ocurre un error', async () => {
            Repartidor.findByPk.mockRejectedValue(new Error('Error de base de datos'));

            const req = crearRequest({
                params: { id: 1 },
            });
            const res = crearRes();

            await obtenerRepartidorPorId(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                mensaje: 'Error al obtener el repartidor',
            });
        });
    });
});


describe('crearRepartidor', () => {
    const bodyValido = {
        nombre: '  Juan  ',
        apellido: '  Pérez  ',
        email: '  JUAN@TEST.COM ',
        password: '123456',
        sucursalId: 2,
    };

    test('crea un repartidor correctamente', async () => {
        const nuevoRepartidor = {
            id: 1,
            nombre: 'Juan',
            apellido: 'Pérez',
            email: 'juan@test.com',
            sucursalId: 2,
            activo: true,
            createdAt: new Date(),
            Sucursal: { id: 2, nombre: 'Centro' },
            reload: jest.fn(),
        };

        Sucursal.findByPk.mockResolvedValue({
            id: 2,
            activa: true,
        });
        Repartidor.findOne.mockResolvedValue(null);
        bcrypt.hash.mockResolvedValue('password-encriptada');
        Repartidor.create.mockResolvedValue(nuevoRepartidor);

        const req = crearRequest({ body: bodyValido });
        const res = crearRes();

        await crearRepartidor(req, res);

        expect(bcrypt.hash).toHaveBeenCalledWith('123456', 10);
        expect(Repartidor.create).toHaveBeenCalledWith({
            nombre: 'Juan',
            apellido: 'Pérez',
            email: 'juan@test.com',
            password: 'password-encriptada',
            sucursalId: 2,
        });
        expect(nuevoRepartidor.reload).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                id: 1,
                nombre: 'Juan',
                email: 'juan@test.com',
            })
        );
    });

    test('ADMIN no puede crear repartidores para otra sucursal', async () => {
        const req = crearRequest({
            body: { ...bodyValido, sucursalId: 3 },
            usuario: {
                id: 2,
                rol: 'ADMIN',
                sucursalId: 2,
            },
        });
        const res = crearRes();

        await crearRepartidor(req, res);

        expect(Sucursal.findByPk).not.toHaveBeenCalled();
        expect(Repartidor.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });

    test('rechaza una sucursal inexistente o inactiva', async () => {
        Sucursal.findByPk.mockResolvedValue(null);

        const req = crearRequest({ body: bodyValido });
        const res = crearRes();

        await crearRepartidor(req, res);

        expect(Repartidor.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            code: 'La sucursal elegida no existe o está inactiva',
        });
    });

    test('rechaza un email que ya está registrado', async () => {
        Sucursal.findByPk.mockResolvedValue({
            id: 2,
            activa: true,
        });
        Repartidor.findOne.mockResolvedValue({ id: 10 });

        const req = crearRequest({ body: bodyValido });
        const res = crearRes();

        await crearRepartidor(req, res);

        expect(Repartidor.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({
            code: 'email-en-uso',
        });
    });

    test('el email de un repartidor dado de baja queda reservado (R3)', async () => {
        Sucursal.findByPk.mockResolvedValue({ id: 2, activa: true });
        Repartidor.findOne.mockResolvedValue({ id: 10, deletedAt: new Date() });

        const res = crearRes();

        await crearRepartidor(crearRequest({ body: bodyValido }), res);

        // paranoid: false → la búsqueda incluye a los dados de baja
        expect(Repartidor.findOne).toHaveBeenCalledWith(expect.objectContaining({ paranoid: false }));
        expect(Repartidor.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(409);
    });

    test('devuelve 500 si ocurre un error al crear', async () => {
        Sucursal.findByPk.mockRejectedValue(new Error('Error de base de datos'));

        const req = crearRequest({ body: bodyValido });
        const res = crearRes();

        await crearRepartidor(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            mensaje: 'Error al crear el repartidor',
        });
    });
});


describe('actualizarRepartidor', () => {
    function prepararRepartidor() {
        const repartidor = {
            id: 1,
            nombre: 'Juan',
            apellido: 'Pérez',
            email: 'juan@test.com',
            sucursalId: 2,
            activo: true,
            update: jest.fn(),
            reload: jest.fn(),
        };

        Repartidor.findByPk.mockResolvedValue(repartidor);
        Viaje.findOne.mockResolvedValue(null);
        Repartidor.findOne.mockResolvedValue(null);

        return repartidor;
    }

    test('actualiza los datos del repartidor', async () => {
        const repartidor = prepararRepartidor();

        repartidor.update.mockResolvedValue();
        repartidor.reload.mockResolvedValue();

        const req = crearRequest({
            params: { id: 1 },
            body: {
                nombre: '  Pedro ',
                apellido: ' Gómez ',
                email: ' PEDRO@TEST.COM ',
            },
        });
        const res = crearRes();

        await actualizarRepartidor(req, res);

        expect(repartidor.update).toHaveBeenCalledWith({
            nombre: 'Pedro',
            apellido: 'Gómez',
            email: 'pedro@test.com',
        });
        expect(repartidor.reload).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('devuelve 404 si el repartidor no existe', async () => {
        Repartidor.findByPk.mockResolvedValue(null);

        const req = crearRequest({ params: { id: 99 } });
        const res = crearRes();

        await actualizarRepartidor(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            mensaje: 'Repartidor no encontrado',
        });
    });

    test('ADMIN no puede modificar repartidores de otra sucursal', async () => {
        Repartidor.findByPk.mockResolvedValue({
            id: 1,
            sucursalId: 8,
        });

        const req = crearRequest({
            params: { id: 1 },
            usuario: {
                id: 2,
                rol: 'ADMIN',
                sucursalId: 5,
            },
        });
        const res = crearRes();

        await actualizarRepartidor(req, res);

        expect(Viaje.findOne).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });

    test('no permite editar un repartidor con un viaje en curso', async () => {
        prepararRepartidor();
        Viaje.findOne.mockResolvedValue({ id: 10 });

        const req = crearRequest({ params: { id: 1 } });
        const res = crearRes();

        await actualizarRepartidor(req, res);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({
            code: 'repartidor-con-viaje-en-curso',
            mensaje: 'No se puede editar un repartidor que tiene un viaje en curso',
        });
    });

    test('rechaza un email que pertenece a otro repartidor', async () => {
        prepararRepartidor();
        Repartidor.findOne.mockResolvedValue({ id: 2 });

        const req = crearRequest({
            params: { id: 1 },
            body: { email: 'otro@test.com' },
        });
        const res = crearRes();

        await actualizarRepartidor(req, res);

        expect(Repartidor.findOne).toHaveBeenCalledWith(expect.objectContaining({ paranoid: false }));
        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({
            code: 'email-en-uso',
        });
    });

    test('ADMIN no puede cambiar la sucursal', async () => {
        const repartidor = prepararRepartidor();

        const req = crearRequest({
            params: { id: 1 },
            body: { sucursalId: 3 },
            usuario: {
                id: 2,
                rol: 'ADMIN',
                sucursalId: 2,
            },
        });
        const res = crearRes();

        await actualizarRepartidor(req, res);

        expect(repartidor.update).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });

    test('MASTER puede cambiar la sucursal si está activa', async () => {
        const repartidor = prepararRepartidor();
        Sucursal.findByPk.mockResolvedValue({
            id: 3,
            activa: true,
        });

        const req = crearRequest({
            params: { id: 1 },
            body: { sucursalId: '3' },
        });
        const res = crearRes();

        await actualizarRepartidor(req, res);

        expect(repartidor.update).toHaveBeenCalledWith(
            expect.objectContaining({ sucursalId: 3 })
        );
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('encripta una nueva contraseña', async () => {
        const repartidor = prepararRepartidor();
        bcrypt.hash.mockResolvedValue('nueva-password-encriptada');

        const req = crearRequest({
            params: { id: 1 },
            body: { password: 'nueva123' },
        });
        const res = crearRes();

        await actualizarRepartidor(req, res);

        expect(bcrypt.hash).toHaveBeenCalledWith('nueva123', 10);
        expect(repartidor.update).toHaveBeenCalledWith(
            expect.objectContaining({
                password: 'nueva-password-encriptada',
            })
        );
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('devuelve 500 si ocurre un error', async () => {
        Repartidor.findByPk.mockRejectedValue(new Error('Error de base de datos'));

        const req = crearRequest({ params: { id: 1 } });
        const res = crearRes();

        await actualizarRepartidor(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});


describe('desactivarRepartidor', () => {
    function prepararRepartidor(activo = true) {
        const repartidor = {
            id: 1,
            sucursalId: 2,
            activo,
            update: jest.fn(),
        };

        Repartidor.findByPk.mockResolvedValue(repartidor);
        Viaje.findOne.mockResolvedValue(null);

        return repartidor;
    }

    test('desactiva un repartidor correctamente', async () => {
        const repartidor = prepararRepartidor();

        const req = crearRequest({ params: { id: 1 } });
        const res = crearRes();

        await desactivarRepartidor(req, res);

        expect(repartidor.update).toHaveBeenCalledWith({ activo: false });
        expect(revocarSesiones).toHaveBeenCalledWith({
            tipo: 'repartidor',
            id: 1,
            motivo: 'desactivado',
        });
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('no corta la sesión si no se pudo guardar la desactivación', async () => {
        const repartidor = prepararRepartidor();
        repartidor.update.mockRejectedValue(new Error('Error de base de datos'));
        jest.spyOn(console, 'error').mockImplementation(() => {});

        const req = crearRequest({ params: { id: 1 } });
        const res = crearRes();

        await desactivarRepartidor(req, res);

        expect(revocarSesiones).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
    });

    test('devuelve 404 si no existe', async () => {
        Repartidor.findByPk.mockResolvedValue(null);

        const req = crearRequest({ params: { id: 99 } });
        const res = crearRes();

        await desactivarRepartidor(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('ADMIN no puede desactivar un repartidor de otra sucursal', async () => {
        Repartidor.findByPk.mockResolvedValue({
            id: 1,
            sucursalId: 8,
            activo: true,
        });

        const req = crearRequest({
            params: { id: 1 },
            usuario: {
                id: 2,
                rol: 'ADMIN',
                sucursalId: 5,
            },
        });
        const res = crearRes();

        await desactivarRepartidor(req, res);

        expect(Viaje.findOne).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });

    test('no permite desactivar un repartidor que ya está inactivo', async () => {
        prepararRepartidor(false);

        const req = crearRequest({ params: { id: 1 } });
        const res = crearRes();

        await desactivarRepartidor(req, res);

        expect(Viaje.findOne).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('no permite desactivar un repartidor con viaje activo', async () => {
        const repartidor = prepararRepartidor();
        Viaje.findOne.mockResolvedValue({ id: 10 });

        const req = crearRequest({ params: { id: 1 } });
        const res = crearRes();

        await desactivarRepartidor(req, res);

        expect(repartidor.update).not.toHaveBeenCalled();
        expect(revocarSesiones).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('devuelve 500 si ocurre un error', async () => {
        Repartidor.findByPk.mockRejectedValue(new Error('Error de base de datos'));

        const req = crearRequest({ params: { id: 1 } });
        const res = crearRes();

        await desactivarRepartidor(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('reactivarRepartidor', () => {
    function prepararRepartidor(activo = false) {
        const repartidor = {
            id: 1,
            sucursalId: 2,
            activo,
            update: jest.fn(),
        };

        Repartidor.findByPk.mockResolvedValue(repartidor);
        return repartidor;
    }

    test('reactiva un repartidor correctamente', async () => {
        const repartidor = prepararRepartidor();

        const req = crearRequest({ params: { id: 1 } });
        const res = crearRes();

        await reactivarRepartidor(req, res);

        expect(repartidor.update).toHaveBeenCalledWith({ activo: true });
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('devuelve 404 si no existe', async () => {
        Repartidor.findByPk.mockResolvedValue(null);

        const req = crearRequest({ params: { id: 99 } });
        const res = crearRes();

        await reactivarRepartidor(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('ADMIN no puede reactivar un repartidor de otra sucursal', async () => {
        Repartidor.findByPk.mockResolvedValue({
            id: 1,
            sucursalId: 8,
            activo: false,
        });

        const req = crearRequest({
            params: { id: 1 },
            usuario: {
                id: 2,
                rol: 'ADMIN',
                sucursalId: 5,
            },
        });
        const res = crearRes();

        await reactivarRepartidor(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
    });

    test('no permite reactivar un repartidor que ya está activo', async () => {
        prepararRepartidor(true);

        const req = crearRequest({ params: { id: 1 } });
        const res = crearRes();

        await reactivarRepartidor(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('devuelve 500 si ocurre un error', async () => {
        Repartidor.findByPk.mockRejectedValue(new Error('Error de base de datos'));

        const req = crearRequest({ params: { id: 1 } });
        const res = crearRes();

        await reactivarRepartidor(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});


describe('obtenerRepartidoresDisponibles', () => {
    function prepararViajeAsistencia() {
        Admin.findByPk.mockResolvedValue({
            id: 1,
            sucursalId: 2,
        });

        Viaje.findByPk.mockResolvedValue({
            id: 10,
            estado: 'requiere asistencia',
            Repartidor: {
                id: 5,
                sucursalId: 2,
            },
        });

        Viaje.findAll.mockResolvedValue([
            { repartidorId: 5 },
            { repartidorId: 6 },
        ]);
    }

    test('obtiene los repartidores disponibles de la sucursal', async () => {
        prepararViajeAsistencia();

        const repartidores = [
            { id: 7, nombre: 'Ana', apellido: 'López' },
        ];

        Repartidor.findAll.mockResolvedValue(repartidores);

        const req = crearRequest({
            params: { viajeId: 10 },
        });
        const res = crearRes();

        await obtenerRepartidoresDisponibles(req, res);

        expect(Repartidor.findAll).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    sucursalId: 2,
                    activo: true,
                }),
                attributes: ['id', 'nombre', 'apellido'],
                order: [['nombre', 'ASC']],
            })
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(repartidores);
    });

    test('devuelve 401 si el administrador no existe', async () => {
        Admin.findByPk.mockResolvedValue(null);

        const req = crearRequest({
            params: { viajeId: 10 },
        });
        const res = crearRes();

        await obtenerRepartidoresDisponibles(req, res);

        expect(Viaje.findByPk).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
    });

    test('devuelve 404 si el viaje no existe', async () => {
        Admin.findByPk.mockResolvedValue({
            id: 1,
            sucursalId: 2,
        });
        Viaje.findByPk.mockResolvedValue(null);

        const req = crearRequest({
            params: { viajeId: 10 },
        });
        const res = crearRes();

        await obtenerRepartidoresDisponibles(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('rechaza un viaje que no requiere asistencia', async () => {
        Admin.findByPk.mockResolvedValue({
            id: 1,
            sucursalId: 2,
        });
        Viaje.findByPk.mockResolvedValue({
            id: 10,
            estado: 'activo',
            Repartidor: { sucursalId: 2 },
        });

        const req = crearRequest({
            params: { viajeId: 10 },
        });
        const res = crearRes();

        await obtenerRepartidoresDisponibles(req, res);

        expect(Viaje.findAll).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('ADMIN no puede consultar viajes de otra sucursal', async () => {
        Admin.findByPk.mockResolvedValue({
            id: 1,
            sucursalId: 3,
        });
        Viaje.findByPk.mockResolvedValue({
            id: 10,
            estado: 'requiere asistencia',
            Repartidor: { sucursalId: 2 },
        });

        const req = crearRequest({
            params: { viajeId: 10 },
            usuario: {
                id: 1,
                rol: 'ADMIN',
                sucursalId: 3,
            },
        });
        const res = crearRes();

        await obtenerRepartidoresDisponibles(req, res);

        expect(Viaje.findAll).not.toHaveBeenCalled();
        expect(Repartidor.findAll).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });

    test('MASTER puede consultar sucursales distintas a la propia', async () => {
        Admin.findByPk.mockResolvedValue({
            id: 1,
            sucursalId: null,
        });
        Viaje.findByPk.mockResolvedValue({
            id: 10,
            estado: 'requiere asistencia',
            Repartidor: { sucursalId: 2 },
        });
        Viaje.findAll.mockResolvedValue([]);
        Repartidor.findAll.mockResolvedValue([]);

        const req = crearRequest({
            params: { viajeId: 10 },
        });
        const res = crearRes();

        await obtenerRepartidoresDisponibles(req, res);

        expect(Repartidor.findAll).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('devuelve 500 si ocurre un error', async () => {
        Admin.findByPk.mockRejectedValue(new Error('Error de base de datos'));

        const req = crearRequest({
            params: { viajeId: 10 },
        });
        const res = crearRes();

        await obtenerRepartidoresDisponibles(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});


describe('darDeBajaRepartidor', () => {
    function prepararRepartidor() {
        const repartidor = {
            id: 1,
            sucursalId: 2,
            update: jest.fn(),
            destroy: jest.fn(),
        };

        Repartidor.findByPk.mockResolvedValue(repartidor);
        Viaje.findOne.mockResolvedValue(null);

        return repartidor;
    }

    test('da de baja con borrado lógico: la fila queda con deletedAt y activo = false', async () => {
        const repartidor = prepararRepartidor();

        const req = crearRequest({ params: { id: 1 } });
        const res = crearRes();

        await darDeBajaRepartidor(req, res);

        expect(repartidor.update).toHaveBeenCalledWith({ activo: false });
        expect(repartidor.destroy).toHaveBeenCalled();
        expect(revocarSesiones).toHaveBeenCalledWith({
            tipo: 'repartidor',
            id: 1,
            motivo: 'baja',
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            mensaje: 'Repartidor dado de baja correctamente',
        });
    });

    test('devuelve 404 si el repartidor no existe', async () => {
        Repartidor.findByPk.mockResolvedValue(null);

        const req = crearRequest({ params: { id: 99 } });
        const res = crearRes();

        await darDeBajaRepartidor(req, res);

        expect(Viaje.findOne).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('ADMIN no puede dar de baja un repartidor de otra sucursal', async () => {
        Repartidor.findByPk.mockResolvedValue({
            id: 1,
            sucursalId: 8,
        });

        const req = crearRequest({
            params: { id: 1 },
            usuario: {
                id: 2,
                rol: 'ADMIN',
                sucursalId: 5,
            },
        });
        const res = crearRes();

        await darDeBajaRepartidor(req, res);

        expect(Viaje.findOne).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });

    test('no permite dar de baja un repartidor con un viaje en curso', async () => {
        const repartidor = prepararRepartidor();
        Viaje.findOne.mockResolvedValue({ id: 10 });

        const req = crearRequest({ params: { id: 1 } });
        const res = crearRes();

        await darDeBajaRepartidor(req, res);

        expect(repartidor.update).not.toHaveBeenCalled();
        expect(repartidor.destroy).not.toHaveBeenCalled();
        expect(revocarSesiones).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(409);
    });

    test('no corta la sesión si no se pudo guardar la baja', async () => {
        const repartidor = prepararRepartidor();
        repartidor.destroy.mockRejectedValue(new Error('Error de base de datos'));
        jest.spyOn(console, 'error').mockImplementation(() => {});

        const req = crearRequest({ params: { id: 1 } });
        const res = crearRes();

        await darDeBajaRepartidor(req, res);

        expect(revocarSesiones).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
    });

    test('devuelve 500 si ocurre un error', async () => {
        Repartidor.findByPk.mockRejectedValue(new Error('Error de base de datos'));

        const req = crearRequest({ params: { id: 1 } });
        const res = crearRes();

        await darDeBajaRepartidor(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});
