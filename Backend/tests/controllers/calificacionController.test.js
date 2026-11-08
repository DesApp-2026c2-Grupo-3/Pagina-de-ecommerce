jest.mock('../../src/models', () => ({
    Pedido: { findByPk: jest.fn() },
    Calificacion: { findOne: jest.fn(), findByPk: jest.fn(), bulkCreate: jest.fn() },
}));
jest.mock('../../src/utils/calificaciones', () => ({
    estaEntregado: jest.fn(),
    entregadoEn: jest.fn(),
    itemsCalificables: jest.fn(),
    buscarPendiente: jest.fn(),
}));

const { Pedido, Calificacion } = require('../../src/models');
const { estaEntregado, entregadoEn, itemsCalificables, buscarPendiente } = require('../../src/utils/calificaciones');
const { obtenerPendiente, crearCalificacion, editarCalificacion } = require('../../src/controllers/calificacionController');

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

const hace = (ms) => new Date(Date.now() - ms);
const HORA = 60 * 60 * 1000;
const DIA = 24 * HORA;

beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('obtenerPendiente', () => {
    test('exige un usuario válido', async () => {
        const res = crearRes();
        await obtenerPendiente({ query: { usuarioId: 'abc' } }, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(buscarPendiente).not.toHaveBeenCalled();
    });

    test('devuelve el pedido para calificar con sus productos', async () => {
        const pendiente = { pedidoId: 12, items: [{ productoId: 7, nombre: 'Fast Classic', imagen: null }] };
        buscarPendiente.mockResolvedValue(pendiente);
        const res = crearRes();

        await obtenerPendiente({ query: { usuarioId: '3' } }, res);

        expect(buscarPendiente).toHaveBeenCalledWith(3);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ pendiente });
    });

    test('sin nada para calificar devuelve pendiente null', async () => {
        buscarPendiente.mockResolvedValue(null);
        const res = crearRes();

        await obtenerPendiente({ query: { usuarioId: '3' } }, res);

        expect(res.json).toHaveBeenCalledWith({ pendiente: null });
    });

    test('responde 500 si falla la base de datos', async () => {
        buscarPendiente.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();
        await obtenerPendiente({ query: { usuarioId: '3' } }, res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('crearCalificacion', () => {
    const body = (items = [{ productoId: 7, puntaje: 4, comentario: 'Rico' }]) => ({ usuarioId: 3, pedidoId: 12, items });

    function pedidoEntregadoHace(ms) {
        Pedido.findByPk.mockResolvedValue({ id: 12, usuarioId: 3, sucursalId: 2, estado: 'Entregado' });
        estaEntregado.mockReturnValue(true);
        entregadoEn.mockResolvedValue(hace(ms));
        Calificacion.findOne.mockResolvedValue(null);
        itemsCalificables.mockResolvedValue([
            { productoId: 7, nombre: 'Fast Classic', imagen: null },
            { productoId: 9, nombre: 'Sprite', imagen: null },
        ]);
        Calificacion.bulkCreate.mockImplementation(async (filas) => filas.map((f, i) => ({ id: i + 1, ...f })));
    }

    test('guarda una calificación por producto con el cliente, el pedido y la sucursal', async () => {
        pedidoEntregadoHace(2 * HORA);
        const res = crearRes();

        await crearCalificacion({ body: body([
            { productoId: 7, puntaje: 4, comentario: 'Rico' },
            { productoId: 9, puntaje: 2, comentario: '' },
        ]) }, res);

        expect(Calificacion.bulkCreate).toHaveBeenCalledWith([
            { pedidoId: 12, productoId: 7, usuarioId: 3, sucursalId: 2, puntaje: 4, comentario: 'Rico' },
            { pedidoId: 12, productoId: 9, usuarioId: 3, sucursalId: 2, puntaje: 2, comentario: null },
        ]);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json.mock.calls[0][0].calificaciones).toHaveLength(2);
        expect(res.json.mock.calls[0][0].calificaciones[0]).toMatchObject({ id: 1, productoId: 7, puntaje: 4 });
    });

    test('los productos sin estrellas ni comentario no se guardan', async () => {
        pedidoEntregadoHace(2 * HORA);

        await crearCalificacion({ body: body([
            { productoId: 7, puntaje: 5, comentario: null },
            { productoId: 9, puntaje: null, comentario: '' },
        ]) }, crearRes());

        const filas = Calificacion.bulkCreate.mock.calls[0][0];
        expect(filas).toHaveLength(1);
        expect(filas[0].productoId).toBe(7);
    });

    test('un producto con solo comentario se guarda sin estrellas', async () => {
        pedidoEntregadoHace(2 * HORA);

        await crearCalificacion({ body: body([{ productoId: 7, puntaje: null, comentario: 'Llegó frío' }]) }, crearRes());

        expect(Calificacion.bulkCreate.mock.calls[0][0][0]).toMatchObject({ puntaje: null, comentario: 'Llegó frío' });
    });

    test('responde 400 si no hay ni estrellas ni comentario en ningún producto', async () => {
        pedidoEntregadoHace(2 * HORA);
        const res = crearRes();

        await crearCalificacion({ body: body([{ productoId: 7, puntaje: null, comentario: '' }]) }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(Calificacion.bulkCreate).not.toHaveBeenCalled();
    });

    test('responde 400 si un producto no se puede calificar (no es del pedido o es una salsa gratuita)', async () => {
        pedidoEntregadoHace(2 * HORA);
        const res = crearRes();

        await crearCalificacion({ body: body([{ productoId: 99, puntaje: 5 }]) }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json.mock.calls[0][0].mensaje).toMatch(/no se puede calificar/);
        expect(Calificacion.bulkCreate).not.toHaveBeenCalled();
    });

    test('responde 404 si el pedido no existe o es de otro cliente', async () => {
        pedidoEntregadoHace(2 * HORA);
        Pedido.findByPk.mockResolvedValue({ id: 12, usuarioId: 99, estado: 'Entregado' });
        const res = crearRes();

        await crearCalificacion({ body: body() }, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(Calificacion.bulkCreate).not.toHaveBeenCalled();

        Pedido.findByPk.mockResolvedValue(null);
        const res2 = crearRes();
        await crearCalificacion({ body: body() }, res2);
        expect(res2.status).toHaveBeenCalledWith(404);
    });

    test('responde 400 si el pedido todavía no fue entregado', async () => {
        pedidoEntregadoHace(2 * HORA);
        estaEntregado.mockReturnValue(false);
        const res = crearRes();

        await crearCalificacion({ body: body() }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(Calificacion.bulkCreate).not.toHaveBeenCalled();
    });

    test('responde 400 si todavía no pasó el tiempo mínimo desde la entrega', async () => {
        // Con MINUTOS_PARA_CALIFICAR en 0 (modo prueba) esto no se da: una entrega "en el futuro" sí
        pedidoEntregadoHace(-30 * 60 * 1000);
        const res = crearRes();

        await crearCalificacion({ body: body() }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json.mock.calls[0][0].mensaje).toMatch(/Todavía es pronto/);
    });

    test('responde 400 si venció el plazo de 7 días', async () => {
        pedidoEntregadoHace(8 * DIA);
        const res = crearRes();

        await crearCalificacion({ body: body() }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json.mock.calls[0][0].mensaje).toMatch(/venció/);
    });

    test('un pedido sin registro de entrega no se puede calificar', async () => {
        pedidoEntregadoHace(2 * HORA);
        entregadoEn.mockResolvedValue(null);
        const res = crearRes();

        await crearCalificacion({ body: body() }, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('responde 409 si el pedido ya fue calificado', async () => {
        pedidoEntregadoHace(2 * HORA);
        Calificacion.findOne.mockResolvedValue({ id: 5 });
        const res = crearRes();

        await crearCalificacion({ body: body() }, res);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(Calificacion.bulkCreate).not.toHaveBeenCalled();
    });

    test('responde 409 si dos envíos llegan a la vez', async () => {
        pedidoEntregadoHace(2 * HORA);
        Calificacion.bulkCreate.mockRejectedValue(Object.assign(new Error('dup'), { name: 'SequelizeUniqueConstraintError' }));
        const res = crearRes();

        await crearCalificacion({ body: body() }, res);

        expect(res.status).toHaveBeenCalledWith(409);
    });

    test('responde 500 si falla la base de datos', async () => {
        pedidoEntregadoHace(2 * HORA);
        Calificacion.bulkCreate.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await crearCalificacion({ body: body() }, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('editarCalificacion', () => {
    const peticion = (extra = {}) => ({ params: { id: '1' }, body: { usuarioId: 3, puntaje: 2, comentario: 'Tardó', ...extra } });
    const guardada = (extra = {}) => ({
        id: 1, pedidoId: 12, productoId: 7, usuarioId: 3, puntaje: 5, comentario: null,
        createdAt: hace(2 * HORA),
        update: jest.fn().mockResolvedValue(),
        ...extra,
    });

    test('responde 404 si no existe o es de otro cliente', async () => {
        Calificacion.findByPk.mockResolvedValue(guardada({ usuarioId: 99 }));
        const res = crearRes();
        await editarCalificacion(peticion(), res);
        expect(res.status).toHaveBeenCalledWith(404);

        Calificacion.findByPk.mockResolvedValue(null);
        const res2 = crearRes();
        await editarCalificacion(peticion(), res2);
        expect(res2.status).toHaveBeenCalledWith(404);
    });

    test('la corrige dentro de las 24 horas', async () => {
        const c = guardada();
        Calificacion.findByPk.mockResolvedValue(c);
        const res = crearRes();

        await editarCalificacion(peticion(), res);

        expect(c.update).toHaveBeenCalledWith({ puntaje: 2, comentario: 'Tardó' });
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('no deja la calificación sin estrellas y sin comentario', async () => {
        const c = guardada();
        Calificacion.findByPk.mockResolvedValue(c);
        const res = crearRes();

        await editarCalificacion(peticion({ puntaje: null, comentario: '' }), res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(c.update).not.toHaveBeenCalled();
    });

    test('responde 400 pasadas las 24 horas', async () => {
        const c = guardada({ createdAt: hace(25 * HORA) });
        Calificacion.findByPk.mockResolvedValue(c);
        const res = crearRes();

        await editarCalificacion(peticion(), res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(c.update).not.toHaveBeenCalled();
    });

    test('responde 500 si falla la base de datos', async () => {
        Calificacion.findByPk.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();
        await editarCalificacion(peticion(), res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});
