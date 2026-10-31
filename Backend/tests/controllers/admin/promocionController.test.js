jest.mock('../../../src/models', () => ({
    Promocion: { findAll: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
    PromocionItem: { bulkCreate: jest.fn(), destroy: jest.fn() },
    Producto: { findAll: jest.fn() },
    sequelize: { transaction: jest.fn() },
}));

const { Promocion, PromocionItem, Producto, sequelize } = require('../../../src/models');
const {
    obtenerPromociones,
    obtenerPromocionPorId,
    crearPromocion,
    editarPromocionPorId,
    deshabilitarPromocion,
    habilitarPromocion,
    eliminarPromocion,
} = require('../../../src/controllers/admin/promocionController');

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

const item = (productoId, nombre, cantidad = 1, descuento = 0, orden = 1) => ({
    productoId,
    cantidad,
    descuento,
    orden,
    producto: { id: productoId, nombre, precio: 1000, deletedAt: null },
});

// Una promo como la devuelve Sequelize
const promoGuardada = (extra = {}) => ({
    id: 9,
    tipo: 'DIA',
    titulo: 'Lunes clásico',
    destacado: '25%',
    detalle: 'El Combo Fast Classic con 25 % menos.',
    dias: [1],
    maxPorPedido: null,
    compraMinima: null,
    activo: true,
    items: [item(4, 'Combo Fast Classic', 1, 0.25)],
    update: jest.fn().mockResolvedValue(),
    destroy: jest.fn().mockResolvedValue(),
    ...extra,
});

// Lo que llega del formulario, ya validado
const datosDia = (extra = {}) => ({
    tipo: 'DIA',
    titulo: 'Lunes clásico',
    destacado: '25%',
    detalle: 'El Combo Fast Classic con 25 % menos.',
    dias: [1],
    maxPorPedido: null,
    compraMinima: null,
    activo: true,
    items: [{ productoId: 4, cantidad: 1, descuento: 0.25 }],
    ...extra,
});

let t;

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    t = { commit: jest.fn(), rollback: jest.fn() };
    sequelize.transaction.mockResolvedValue(t);
    Producto.findAll.mockResolvedValue([{ id: 4 }]);
    Promocion.findAll.mockResolvedValue([]);
    Promocion.create.mockResolvedValue({ id: 9 });
    Promocion.findByPk.mockResolvedValue(promoGuardada());
});

describe('obtenerPromociones (panel)', () => {
    test('devuelve todas las promos, también las deshabilitadas', async () => {
        Promocion.findAll.mockResolvedValue([promoGuardada(), promoGuardada({ id: 10, activo: false })]);
        const res = crearRes();

        await obtenerPromociones({}, res);

        const lista = res.json.mock.calls[0][0];
        expect(lista.map((p) => [p.id, p.activo])).toEqual([[9, true], [10, false]]);
        expect(Promocion.findAll.mock.calls[0][0].where).toBeUndefined();
    });

    test('responde 500 si falla la base de datos', async () => {
        Promocion.findAll.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await obtenerPromociones({}, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('obtenerPromocionPorId', () => {
    test('responde 404 si no existe', async () => {
        Promocion.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await obtenerPromocionPorId({ params: { id: '99' } }, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('devuelve la promo con sus productos', async () => {
        const res = crearRes();

        await obtenerPromocionPorId({ params: { id: '9' } }, res);

        expect(res.json.mock.calls[0][0]).toMatchObject({ id: 9, titulo: 'Lunes clásico' });
        expect(res.json.mock.calls[0][0].items[0]).toMatchObject({ productoId: 4, nombre: 'Combo Fast Classic' });
    });

    test('responde 500 si falla la base de datos', async () => {
        Promocion.findByPk.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await obtenerPromocionPorId({ params: { id: '9' } }, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('crearPromocion', () => {
    test('crea la promo con los días ordenados y responde 201', async () => {
        const res = crearRes();

        await crearPromocion({ body: datosDia({ dias: [3, 1] }) }, res);

        expect(Promocion.create).toHaveBeenCalledWith(
            expect.objectContaining({ tipo: 'DIA', titulo: 'Lunes clásico', dias: [1, 3], activo: true }),
            { transaction: t }
        );
        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('guarda los productos en el orden en que vienen', async () => {
        Producto.findAll.mockResolvedValue([{ id: 4 }, { id: 5 }]);
        const res = crearRes();

        await crearPromocion({ body: datosDia({ items: [
            { productoId: 4, cantidad: 1, descuento: 0 },
            { productoId: 5, cantidad: 2, descuento: 0.5 },
        ] }) }, res);

        expect(PromocionItem.bulkCreate).toHaveBeenCalledWith([
            { promocionId: 9, productoId: 4, cantidad: 1, descuento: 0, orden: 1 },
            { promocionId: 9, productoId: 5, cantidad: 2, descuento: 0.5, orden: 2 },
        ], { transaction: t });
        expect(t.commit).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json.mock.calls[0][0].promocion.id).toBe(9);
    });

    test('las promos que no son del día no guardan días', async () => {
        const res = crearRes();

        await crearPromocion({ body: datosDia({ tipo: 'SEMANA', dias: null }) }, res);

        expect(Promocion.create.mock.calls[0][0].dias).toBeNull();
    });

    test('responde 400 si algún producto no existe o fue eliminado', async () => {
        Producto.findAll.mockResolvedValue([]);
        const res = crearRes();

        await crearPromocion({ body: datosDia() }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(Promocion.create).not.toHaveBeenCalled();
        expect(t.rollback).toHaveBeenCalled();
    });

    test('responde 409 si ya hay un producto de la semana activo', async () => {
        Promocion.findAll.mockResolvedValue([{ id: 1, tipo: 'SEMANA', titulo: 'Combo Habemus Bacon', dias: null }]);
        const res = crearRes();

        await crearPromocion({ body: datosDia({ tipo: 'SEMANA', dias: null }) }, res);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json.mock.calls[0][0].mensaje).toMatch(/producto de la semana activo \("Combo Habemus Bacon"\)/);
        expect(Promocion.create).not.toHaveBeenCalled();
    });

    test('responde 409 si ya hay un regalo de la semana activo', async () => {
        Promocion.findAll.mockResolvedValue([{ id: 2, tipo: 'REGALO', titulo: 'Papas con cheddar gratis', dias: null }]);
        const res = crearRes();

        await crearPromocion({ body: datosDia({ tipo: 'REGALO', dias: null }) }, res);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json.mock.calls[0][0].mensaje).toMatch(/regalo de la semana activo/);
    });

    test('responde 409 si el día ya tiene 3 promos activas', async () => {
        Promocion.findAll.mockResolvedValue([1, 2, 3].map((id) => ({ id, tipo: 'DIA', titulo: `Promo ${id}`, dias: [1] })));
        const res = crearRes();

        await crearPromocion({ body: datosDia({ dias: [1] }) }, res);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json.mock.calls[0][0].mensaje).toMatch(/lunes ya tiene 3 promos activas/);
        expect(t.rollback).toHaveBeenCalled();
    });

    test('con 2 promos en el día todavía entra otra', async () => {
        Promocion.findAll.mockResolvedValue([1, 2].map((id) => ({ id, tipo: 'DIA', titulo: `Promo ${id}`, dias: [1] })));
        const res = crearRes();

        await crearPromocion({ body: datosDia() }, res);

        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('las promos de otros días o de otro tipo no cuentan para el límite', async () => {
        Promocion.findAll.mockResolvedValue([
            { id: 1, tipo: 'DIA', titulo: 'Martes', dias: [2] },
            { id: 2, tipo: 'DIA', titulo: 'Martes', dias: [2] },
            { id: 3, tipo: 'DIA', titulo: 'Martes', dias: [2] },
            { id: 4, tipo: 'SEMANA', titulo: 'Semana', dias: null },
        ]);
        const res = crearRes();

        await crearPromocion({ body: datosDia() }, res);

        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('una promo deshabilitada no controla los límites', async () => {
        const res = crearRes();

        await crearPromocion({ body: datosDia({ activo: false }) }, res);

        expect(Promocion.findAll).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('responde 500 y deshace todo si falla la base de datos', async () => {
        Promocion.create.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await crearPromocion({ body: datosDia() }, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(t.rollback).toHaveBeenCalled();
        expect(t.commit).not.toHaveBeenCalled();
    });
});

describe('editarPromocionPorId', () => {
    test('responde 404 si la promo no existe', async () => {
        Promocion.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await editarPromocionPorId({ params: { id: '99' }, body: datosDia() }, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(t.rollback).toHaveBeenCalled();
    });

    test('actualiza la promo y reemplaza sus productos', async () => {
        const guardada = promoGuardada();
        Promocion.findByPk.mockResolvedValue(guardada);
        const res = crearRes();

        await editarPromocionPorId({ params: { id: '9' }, body: datosDia({ titulo: 'Lunes de clásicos' }) }, res);

        expect(guardada.update).toHaveBeenCalledWith(expect.objectContaining({ titulo: 'Lunes de clásicos' }), { transaction: t });
        expect(PromocionItem.destroy).toHaveBeenCalledWith({ where: { promocionId: 9 }, transaction: t });
        expect(PromocionItem.bulkCreate).toHaveBeenCalledWith(
            [{ promocionId: 9, productoId: 4, cantidad: 1, descuento: 0.25, orden: 1 }],
            { transaction: t }
        );
        expect(t.commit).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('la promo que se edita no cuenta contra sí misma en el límite del día', async () => {
        Promocion.findAll.mockResolvedValue([]);
        const res = crearRes();

        await editarPromocionPorId({ params: { id: '9' }, body: datosDia() }, res);

        // El where excluye a la propia promo (id distinto de la que se edita)
        expect(Promocion.findAll.mock.calls[0][0].where.id).toBeDefined();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('responde 409 si al editar el día supera el límite', async () => {
        Promocion.findAll.mockResolvedValue([1, 2, 3].map((id) => ({ id, tipo: 'DIA', titulo: `Promo ${id}`, dias: [1, 2] })));
        const res = crearRes();

        await editarPromocionPorId({ params: { id: '9' }, body: datosDia({ dias: [2] }) }, res);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json.mock.calls[0][0].mensaje).toMatch(/martes ya tiene 3 promos activas/);
        expect(PromocionItem.destroy).not.toHaveBeenCalled();
    });

    test('responde 500 y deshace todo si falla la base de datos', async () => {
        PromocionItem.bulkCreate.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await editarPromocionPorId({ params: { id: '9' }, body: datosDia() }, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(t.rollback).toHaveBeenCalled();
    });
});

describe('deshabilitarPromocion', () => {
    test('responde 404 si no existe', async () => {
        Promocion.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await deshabilitarPromocion({ params: { id: '99' } }, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('responde 400 si ya estaba deshabilitada', async () => {
        Promocion.findByPk.mockResolvedValue(promoGuardada({ activo: false }));
        const res = crearRes();

        await deshabilitarPromocion({ params: { id: '9' } }, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('la deshabilita', async () => {
        const guardada = promoGuardada();
        Promocion.findByPk.mockResolvedValue(guardada);
        const res = crearRes();

        await deshabilitarPromocion({ params: { id: '9' } }, res);

        expect(guardada.update).toHaveBeenCalledWith({ activo: false });
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('responde 500 si falla la base de datos', async () => {
        Promocion.findByPk.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await deshabilitarPromocion({ params: { id: '9' } }, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('habilitarPromocion', () => {
    test('responde 404 si no existe', async () => {
        Promocion.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await habilitarPromocion({ params: { id: '99' } }, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('responde 400 si ya estaba habilitada', async () => {
        const res = crearRes();

        await habilitarPromocion({ params: { id: '9' } }, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('la habilita si respeta las reglas', async () => {
        const guardada = promoGuardada({ activo: false });
        Promocion.findByPk.mockResolvedValue(guardada);
        const res = crearRes();

        await habilitarPromocion({ params: { id: '9' } }, res);

        expect(guardada.update).toHaveBeenCalledWith({ activo: true });
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('responde 409 si habilitarla supera el límite del día', async () => {
        const guardada = promoGuardada({ activo: false });
        Promocion.findByPk.mockResolvedValue(guardada);
        Promocion.findAll.mockResolvedValue([1, 2, 3].map((id) => ({ id, tipo: 'DIA', titulo: `Promo ${id}`, dias: [1] })));
        const res = crearRes();

        await habilitarPromocion({ params: { id: '9' } }, res);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(guardada.update).not.toHaveBeenCalled();
    });

    test('responde 400 si algún producto de la promo fue eliminado', async () => {
        Promocion.findByPk.mockResolvedValue(promoGuardada({ activo: false }));
        Producto.findAll.mockResolvedValue([]);
        const res = crearRes();

        await habilitarPromocion({ params: { id: '9' } }, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });
});

describe('eliminarPromocion', () => {
    test('responde 404 si no existe', async () => {
        Promocion.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await eliminarPromocion({ params: { id: '99' } }, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('la elimina', async () => {
        const guardada = promoGuardada();
        Promocion.findByPk.mockResolvedValue(guardada);
        const res = crearRes();

        await eliminarPromocion({ params: { id: '9' } }, res);

        expect(guardada.destroy).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('responde 500 si falla la base de datos', async () => {
        Promocion.findByPk.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await eliminarPromocion({ params: { id: '9' } }, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});
