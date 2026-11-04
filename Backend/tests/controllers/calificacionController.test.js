jest.mock('../../src/models', () => ({
    Pedido: { findByPk: jest.fn() },
    Calificacion: { findOne: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
}));
jest.mock('../../src/utils/calificaciones', () => ({
    estaEntregado: jest.fn(),
    entregadoEn: jest.fn(),
    buscarPendiente: jest.fn(),
}));

const { Pedido, Calificacion } = require('../../src/models');
const { estaEntregado, entregadoEn, buscarPendiente } = require('../../src/utils/calificaciones');
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

    test('devuelve el pedido para calificar', async () => {
        buscarPendiente.mockResolvedValue({ pedidoId: 12, productos: ['Fast Classic'] });
        const res = crearRes();

        await obtenerPendiente({ query: { usuarioId: '3' } }, res);

        expect(buscarPendiente).toHaveBeenCalledWith(3);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ pendiente: { pedidoId: 12, productos: ['Fast Classic'] } });
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
    const body = (extra = {}) => ({ usuarioId: 3, pedidoId: 12, puntaje: 4, comentario: 'Rico', ...extra });

    function pedidoEntregadoHace(ms) {
        Pedido.findByPk.mockResolvedValue({ id: 12, usuarioId: 3, sucursalId: 2, estado: 'Entregado' });
        estaEntregado.mockReturnValue(true);
        entregadoEn.mockResolvedValue(hace(ms));
        Calificacion.findOne.mockResolvedValue(null);
        Calificacion.create.mockImplementation(async (d) => ({ id: 1, ...d }));
    }

    test('guarda la calificación con el cliente, el pedido y la sucursal', async () => {
        pedidoEntregadoHace(2 * HORA);
        const res = crearRes();

        await crearCalificacion({ body: body() }, res);

        expect(Calificacion.create).toHaveBeenCalledWith({
            pedidoId: 12, usuarioId: 3, sucursalId: 2, puntaje: 4, comentario: 'Rico',
        });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json.mock.calls[0][0].calificacion).toMatchObject({ id: 1, puntaje: 4 });
    });

    test('sin comentario guarda null', async () => {
        pedidoEntregadoHace(2 * HORA);
        await crearCalificacion({ body: body({ comentario: '' }) }, crearRes());
        expect(Calificacion.create.mock.calls[0][0].comentario).toBeNull();
    });

    test('responde 404 si el pedido no existe o es de otro cliente', async () => {
        pedidoEntregadoHace(2 * HORA);
        Pedido.findByPk.mockResolvedValue({ id: 12, usuarioId: 99, estado: 'Entregado' });
        const res = crearRes();

        await crearCalificacion({ body: body() }, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(Calificacion.create).not.toHaveBeenCalled();

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
        expect(Calificacion.create).not.toHaveBeenCalled();
    });

    test('responde 400 si pasó menos de 1 hora desde la entrega', async () => {
        pedidoEntregadoHace(30 * 60 * 1000);
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
        expect(Calificacion.create).not.toHaveBeenCalled();
    });

    test('responde 409 si dos envíos llegan a la vez', async () => {
        pedidoEntregadoHace(2 * HORA);
        Calificacion.create.mockRejectedValue(Object.assign(new Error('dup'), { name: 'SequelizeUniqueConstraintError' }));
        const res = crearRes();

        await crearCalificacion({ body: body() }, res);

        expect(res.status).toHaveBeenCalledWith(409);
    });

    test('responde 500 si falla la base de datos', async () => {
        pedidoEntregadoHace(2 * HORA);
        Calificacion.create.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await crearCalificacion({ body: body() }, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('editarCalificacion', () => {
    const peticion = (extra = {}) => ({ params: { id: '1' }, body: { usuarioId: 3, puntaje: 2, comentario: 'Tardó', ...extra } });
    const guardada = (extra = {}) => ({
        id: 1, pedidoId: 12, usuarioId: 3, puntaje: 5, comentario: null,
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
