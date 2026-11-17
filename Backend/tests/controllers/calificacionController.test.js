
const { Pedido, Calificacion } = require('../../src/models');
const { obtenerParametros } = require('../../src/utils/parametros');
const { dentroDelPlazo } = require('../../src/config/calificaciones');

const {
    crearCalificacion,
    obtenerRecientes,
} = require('../../src/controllers/calificacionController');

jest.mock('../../src/models', () => ({
    Pedido: {
        findByPk: jest.fn(),
    },
    Calificacion: {
        create: jest.fn(),
        findAll: jest.fn(),
    },
    Usuario: {},
}));

jest.mock('../../src/utils/parametros', () => ({
    obtenerParametros: jest.fn(),
}));

jest.mock('../../src/config/calificaciones', () => ({
    dentroDelPlazo: jest.fn(),
}));

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

function crearReq(body = {}) {
    return { body };
}

const pedidoValido = {
    id: 10,
    usuarioId: 5,
    sucursalId: 2,
    estado: 'Entregado',
    fecha: new Date('2026-11-10'),
};

beforeEach(() => {
    jest.clearAllMocks();

    obtenerParametros.mockResolvedValue({
        diasParaCalificar: 30,
        opinionesEnInicio: 5,
    });

    dentroDelPlazo.mockReturnValue(true);
});

describe('crearCalificacion', () => {
    const reqValida = () => crearReq({
        usuarioId: 5,
        pedidoId: 10,
        puntaje: 5,
        comentario: 'Excelente servicio',
    });

    test('devuelve 404 si el pedido no existe', async () => {
        Pedido.findByPk.mockResolvedValue(null);

        const res = crearRes();

        await crearCalificacion(reqValida(), res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            mensaje: 'Pedido no encontrado',
        });
        expect(Calificacion.create).not.toHaveBeenCalled();
    });

    test('devuelve 404 si el pedido pertenece a otro usuario', async () => {
        Pedido.findByPk.mockResolvedValue({
            ...pedidoValido,
            usuarioId: 99,
        });

        const res = crearRes();

        await crearCalificacion(reqValida(), res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(Calificacion.create).not.toHaveBeenCalled();
    });

    test('devuelve 400 si el pedido no está entregado', async () => {
        Pedido.findByPk.mockResolvedValue({
            ...pedidoValido,
            estado: 'En camino',
        });

        const res = crearRes();

        await crearCalificacion(reqValida(), res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            mensaje: 'Solo podés calificar pedidos que ya recibiste',
        });
        expect(obtenerParametros).not.toHaveBeenCalled();
    });

    test('acepta el estado entregado sin importar mayúsculas', async () => {
        Pedido.findByPk.mockResolvedValue({
            ...pedidoValido,
            estado: 'ENTREGADO',
        });

        Calificacion.create.mockResolvedValue({});

        const res = crearRes();

        await crearCalificacion(reqValida(), res);

        expect(Calificacion.create).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('devuelve 400 si venció el plazo para calificar', async () => {
        Pedido.findByPk.mockResolvedValue(pedidoValido);
        dentroDelPlazo.mockReturnValue(false);

        const res = crearRes();

        await crearCalificacion(reqValida(), res);

        expect(dentroDelPlazo).toHaveBeenCalledWith(
            pedidoValido.fecha,
            30
        );
        expect(res.status).toHaveBeenCalledWith(400);
        expect(Calificacion.create).not.toHaveBeenCalled();
    });

    test('crea la calificación correctamente', async () => {
        Pedido.findByPk.mockResolvedValue(pedidoValido);
        Calificacion.create.mockResolvedValue({});

        const res = crearRes();

        await crearCalificacion(reqValida(), res);

        expect(Calificacion.create).toHaveBeenCalledWith({
            pedidoId: 10,
            usuarioId: 5,
            sucursalId: 2,
            puntaje: 5,
            comentario: 'Excelente servicio',
        });

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            mensaje: '¡Gracias por tu calificación!',
        });
    });

    test('guarda comentario null si no se envía comentario', async () => {
        Pedido.findByPk.mockResolvedValue(pedidoValido);
        Calificacion.create.mockResolvedValue({});

        const req = reqValida();
        req.body.comentario = '';

        const res = crearRes();

        await crearCalificacion(req, res);

        expect(Calificacion.create).toHaveBeenCalledWith(
            expect.objectContaining({
                comentario: null,
            })
        );

        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('devuelve 409 si el pedido ya fue calificado', async () => {
        Pedido.findByPk.mockResolvedValue(pedidoValido);

        const error = new Error('Duplicado');
        error.name = 'SequelizeUniqueConstraintError';

        Calificacion.create.mockRejectedValue(error);

        const res = crearRes();

        await crearCalificacion(reqValida(), res);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({
            mensaje: 'Ya calificaste este pedido',
        });
    });

    test('devuelve 500 si ocurre un error inesperado', async () => {
        Pedido.findByPk.mockRejectedValue(new Error('Error de base de datos'));

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const res = crearRes();

        await crearCalificacion(reqValida(), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            mensaje: 'Error al guardar la calificación',
        });

        consoleSpy.mockRestore();
    });

    test('guarda sucursalId null si el pedido no tiene sucursal', async () => {
        Pedido.findByPk.mockResolvedValue({
            ...pedidoValido,
            sucursalId: null,
        });

        Calificacion.create.mockResolvedValue({});

        const res = crearRes();

        await crearCalificacion(reqValida(), res);

        expect(Calificacion.create).toHaveBeenCalledWith(
            expect.objectContaining({
                sucursalId: null,
            })
        );
    });
});

describe('obtenerRecientes', () => {
    test('devuelve las calificaciones recientes aprobadas', async () => {
        const fecha = new Date('2026-11-15');

        Calificacion.findAll.mockResolvedValue([
            {
                id: 1,
                usuario: { nombre: 'Juan' },
                puntaje: 5,
                comentario: 'Muy rico',
                createdAt: fecha,
            },
        ]);

        const res = crearRes();

        await obtenerRecientes({}, res);

        expect(Calificacion.findAll).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    estado: 'APROBADA',
                }),
                order: [['createdAt', 'DESC']],
                limit: 5,
            })
        );

        expect(res.json).toHaveBeenCalledWith([
            {
                id: 1,
                nombre: 'Juan',
                puntaje: 5,
                comentario: 'Muy rico',
                fecha,
            },
        ]);
    });

    test('utiliza Cliente si no hay usuario asociado', async () => {
        Calificacion.findAll.mockResolvedValue([
            {
                id: 2,
                usuario: null,
                puntaje: 4,
                comentario: 'Buena experiencia',
                createdAt: new Date(),
            },
        ]);

        const res = crearRes();

        await obtenerRecientes({}, res);

        expect(res.json).toHaveBeenCalledWith([
            expect.objectContaining({
                id: 2,
                nombre: 'Cliente',
            }),
        ]);
    });

    test('devuelve una lista vacía si no hay calificaciones', async () => {
        Calificacion.findAll.mockResolvedValue([]);

        const res = crearRes();

        await obtenerRecientes({}, res);

        expect(res.json).toHaveBeenCalledWith([]);
    });

    test('devuelve 500 si ocurre un error al consultar', async () => {
        Calificacion.findAll.mockRejectedValue(
            new Error('Error de base de datos')
        );

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const res = crearRes();

        await obtenerRecientes({}, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            mensaje: 'Error al obtener las calificaciones',
        });

        consoleSpy.mockRestore();
    });
});
