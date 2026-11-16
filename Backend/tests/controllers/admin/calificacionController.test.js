
jest.mock('../../../src/models', () => ({
    Admin: {
        findByPk: jest.fn(),
    },
    Calificacion: {
        findAll: jest.fn(),
        findOne: jest.fn(),
    },
    Usuario: {},
    Sucursal: {},
}));

const {
    Admin,
    Calificacion,
} = require('../../../src/models');

const {
    obtenerCalificaciones,
    cambiarEstado,
} = require('../../../src/controllers/admin/calificacionController');

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

const adminDeSucursal = { id: 7, sucursalId: 2 };
const adminMaster = { id: 1, sucursalId: null };

function pedidoAdmin(query = {}, body = {}, params = {}) {
    return {
        usuario: { id: 7 },
        query,
        body,
        params,
    };
}

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

// ==========================================
// obtenerCalificaciones
// ==========================================

describe('obtenerCalificaciones', () => {

    test('devuelve 401 si el administrador no existe', async () => {
        Admin.findByPk.mockResolvedValue(null);

        const res = crearRes();

        await obtenerCalificaciones(pedidoAdmin(), res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            mensaje: 'Iniciá sesión de nuevo',
        });

        expect(Calificacion.findAll).not.toHaveBeenCalled();
    });

    test('devuelve 400 si el estado no es válido', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);

        const res = crearRes();

        await obtenerCalificaciones(
            pedidoAdmin({ estado: 'INVALIDO' }),
            res
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            mensaje: 'El estado no es válido',
        });

        expect(Calificacion.findAll).not.toHaveBeenCalled();
    });

    test('el administrador master puede consultar todas las calificaciones', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);

        Calificacion.findAll.mockResolvedValue([]);

        const res = crearRes();

        await obtenerCalificaciones(pedidoAdmin(), res);

        expect(Calificacion.findAll).toHaveBeenCalledWith({
            where: {},
            include: [
                {
                    model: expect.anything(),
                    as: 'usuario',
                    attributes: ['nombre'],
                },
                {
                    model: expect.anything(),
                    as: 'sucursal',
                    attributes: ['nombre'],
                },
            ],
            order: [['createdAt', 'DESC']],
        });

        expect(res.json).toHaveBeenCalledWith([]);
    });

    test('el administrador de sucursal solo consulta sus calificaciones', async () => {
        Admin.findByPk.mockResolvedValue(adminDeSucursal);

        Calificacion.findAll.mockResolvedValue([]);

        const res = crearRes();

        await obtenerCalificaciones(pedidoAdmin(), res);

        const consulta = Calificacion.findAll.mock.calls[0][0];

        expect(consulta.where).toEqual({
            sucursalId: 2,
        });

        expect(res.json).toHaveBeenCalledWith([]);
    });

    test('filtra las calificaciones por estado', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);

        Calificacion.findAll.mockResolvedValue([]);

        const res = crearRes();

        await obtenerCalificaciones(
            pedidoAdmin({ estado: 'PENDIENTE' }),
            res
        );

        const consulta = Calificacion.findAll.mock.calls[0][0];

        expect(consulta.where).toEqual({
            estado: 'PENDIENTE',
        });
    });

    test('combina el filtro de sucursal con el estado', async () => {
        Admin.findByPk.mockResolvedValue(adminDeSucursal);

        Calificacion.findAll.mockResolvedValue([]);

        const res = crearRes();

        await obtenerCalificaciones(
            pedidoAdmin({ estado: 'APROBADA' }),
            res
        );

        const consulta = Calificacion.findAll.mock.calls[0][0];

        expect(consulta.where).toEqual({
            sucursalId: 2,
            estado: 'APROBADA',
        });
    });

    test('devuelve las calificaciones con los datos del usuario y sucursal', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);

        const fecha = new Date();

        Calificacion.findAll.mockResolvedValue([
            {
                id: 10,
                puntaje: 5,
                comentario: 'Excelente atención',
                createdAt: fecha,
                estado: 'APROBADA',
                usuario: { nombre: 'Juan' },
                sucursal: { nombre: 'Centro' },
            },
        ]);

        const res = crearRes();

        await obtenerCalificaciones(pedidoAdmin(), res);

        expect(res.json).toHaveBeenCalledWith([
            {
                id: 10,
                nombre: 'Juan',
                puntaje: 5,
                comentario: 'Excelente atención',
                fecha,
                estado: 'APROBADA',
                sucursal: 'Centro',
            },
        ]);
    });

    test('utiliza valores por defecto si no existen usuario o sucursal', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);

        Calificacion.findAll.mockResolvedValue([
            {
                id: 11,
                puntaje: 4,
                comentario: 'Buena experiencia',
                createdAt: new Date(),
                estado: 'PENDIENTE',
                usuario: null,
                sucursal: null,
            },
        ]);

        const res = crearRes();

        await obtenerCalificaciones(pedidoAdmin(), res);

        const resultado = res.json.mock.calls[0][0];

        expect(resultado[0].nombre).toBe('Cliente');
        expect(resultado[0].sucursal).toBe('Sin sucursal');
    });

    test('devuelve 500 si ocurre un error al consultar las calificaciones', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);

        Calificacion.findAll.mockRejectedValue(
            new Error('Error de base de datos')
        );

        const res = crearRes();

        await obtenerCalificaciones(pedidoAdmin(), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            mensaje: 'Error al obtener las calificaciones',
        });
    });

    test('devuelve 500 si falla la consulta del administrador', async () => {
        Admin.findByPk.mockRejectedValue(
            new Error('Error de base de datos')
        );

        const res = crearRes();

        await obtenerCalificaciones(pedidoAdmin(), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            mensaje: 'Error al obtener las calificaciones',
        });
    });
});

// ==========================================
// cambiarEstado
// ==========================================

describe('cambiarEstado', () => {

    test('devuelve 401 si el administrador no existe', async () => {
        Admin.findByPk.mockResolvedValue(null);

        const res = crearRes();

        await cambiarEstado(
            pedidoAdmin({}, { estado: 'APROBADA' }, { id: 10 }),
            res
        );

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            mensaje: 'Iniciá sesión de nuevo',
        });

        expect(Calificacion.findOne).not.toHaveBeenCalled();
    });

    test('devuelve 400 si el estado no es APROBADA ni OCULTA', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);

        const res = crearRes();

        await cambiarEstado(
            pedidoAdmin({}, { estado: 'PENDIENTE' }, { id: 10 }),
            res
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            mensaje: 'El estado debe ser APROBADA u OCULTA',
        });

        expect(Calificacion.findOne).not.toHaveBeenCalled();
    });

    test('aprueba una calificación correctamente', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);

        const calificacion = {
            id: 10,
            update: jest.fn().mockResolvedValue(),
        };

        Calificacion.findOne.mockResolvedValue(calificacion);

        const res = crearRes();

        await cambiarEstado(
            pedidoAdmin({}, { estado: 'APROBADA' }, { id: 10 }),
            res
        );

        expect(Calificacion.findOne).toHaveBeenCalledWith({
            where: { id: 10 },
        });

        expect(calificacion.update).toHaveBeenCalledWith({
            estado: 'APROBADA',
        });

        expect(res.json).toHaveBeenCalledWith({
            mensaje: 'Calificación aprobada',
            id: 10,
            estado: 'APROBADA',
        });
    });

    test('oculta una calificación correctamente', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);

        const calificacion = {
            id: 15,
            update: jest.fn().mockResolvedValue(),
        };

        Calificacion.findOne.mockResolvedValue(calificacion);

        const res = crearRes();

        await cambiarEstado(
            pedidoAdmin({}, { estado: 'OCULTA' }, { id: 15 }),
            res
        );

        expect(calificacion.update).toHaveBeenCalledWith({
            estado: 'OCULTA',
        });

        expect(res.json).toHaveBeenCalledWith({
            mensaje: 'Calificación oculta',
            id: 15,
            estado: 'OCULTA',
        });
    });

    test('el administrador de sucursal solo puede modificar calificaciones de su sucursal', async () => {
        Admin.findByPk.mockResolvedValue(adminDeSucursal);

        Calificacion.findOne.mockResolvedValue(null);

        const res = crearRes();

        await cambiarEstado(
            pedidoAdmin({}, { estado: 'APROBADA' }, { id: 20 }),
            res
        );

        expect(Calificacion.findOne).toHaveBeenCalledWith({
            where: {
                sucursalId: 2,
                id: 20,
            },
        });

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            mensaje: 'Calificación no encontrada',
        });
    });

    test('devuelve 404 si la calificación no existe', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);

        Calificacion.findOne.mockResolvedValue(null);

        const res = crearRes();

        await cambiarEstado(
            pedidoAdmin({}, { estado: 'APROBADA' }, { id: 999 }),
            res
        );

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            mensaje: 'Calificación no encontrada',
        });
    });

    test('devuelve 500 si falla la búsqueda de la calificación', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);

        Calificacion.findOne.mockRejectedValue(
            new Error('Error de base de datos')
        );

        const res = crearRes();

        await cambiarEstado(
            pedidoAdmin({}, { estado: 'APROBADA' }, { id: 10 }),
            res
        );

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            mensaje: 'Error al cambiar el estado',
        });
    });

    test('devuelve 500 si falla la actualización de la calificación', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);

        const calificacion = {
            id: 10,
            update: jest.fn().mockRejectedValue(
                new Error('Error al actualizar')
            ),
        };

        Calificacion.findOne.mockResolvedValue(calificacion);

        const res = crearRes();

        await cambiarEstado(
            pedidoAdmin({}, { estado: 'APROBADA' }, { id: 10 }),
            res
        );

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            mensaje: 'Error al cambiar el estado',
        });
    });

    test('devuelve 500 si falla la consulta del administrador', async () => {
        Admin.findByPk.mockRejectedValue(
            new Error('Error de base de datos')
        );

        const res = crearRes();

        await cambiarEstado(
            pedidoAdmin({}, { estado: 'APROBADA' }, { id: 10 }),
            res
        );

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            mensaje: 'Error al cambiar el estado',
        });
    });
});
