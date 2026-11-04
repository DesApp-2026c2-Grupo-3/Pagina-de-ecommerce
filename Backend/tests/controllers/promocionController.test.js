jest.mock('../../src/models', () => ({
    Promocion: { findAll: jest.fn() },
    PromocionItem: {},
    Producto: {},
}));

const { Promocion } = require('../../src/models');
const { obtenerPromociones } = require('../../src/controllers/promocionController');

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

// Una promo como la devuelve Sequelize (con sus items y productos)
const item = (productoId, nombre, cantidad = 1, descuento = 0, orden = 1, deletedAt = null) => ({
    productoId,
    cantidad,
    descuento,
    orden,
    producto: nombre ? { id: productoId, nombre, precio: 1000, deletedAt } : null,
});

const promo = (id, tipo, items, extra = {}) => ({
    id,
    tipo,
    titulo: `Promo ${id}`,
    destacado: '20%',
    detalle: 'Detalle de la promo',
    dias: null,
    maxPorPedido: null,
    compraMinima: null,
    activo: true,
    items,
    ...extra,
});

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('obtenerPromociones (público)', () => {
    test('sin promociones cargadas devuelve la semana vacía', async () => {
        Promocion.findAll.mockResolvedValue([]);
        const res = crearRes();

        await obtenerPromociones({}, res);

        const respuesta = res.json.mock.calls[0][0];
        expect(respuesta.hoy).toBeGreaterThanOrEqual(0);
        expect(respuesta.hoy).toBeLessThanOrEqual(6);
        expect(respuesta.productoSemana).toBeNull();
        expect(respuesta.regalo).toBeNull();
        expect(respuesta.dias).toHaveLength(7);
        respuesta.dias.forEach((dia) => expect(dia.promos).toEqual([]));
    });

    test('pide solo las promociones activas', async () => {
        Promocion.findAll.mockResolvedValue([]);

        await obtenerPromociones({}, crearRes());

        expect(Promocion.findAll.mock.calls[0][0].where).toEqual({ activo: true });
    });

    test('arma el producto de la semana, el regalo y las promos de cada día', async () => {
        Promocion.findAll.mockResolvedValue([
            promo(1, 'SEMANA', [item(10, 'Combo Habemus Bacon', 1, 0.2)]),
            promo(2, 'REGALO', [item(11, 'Papas con cheddar', 1, 1)], { maxPorPedido: 1, compraMinima: 15000 }),
            promo(3, 'DIA', [item(12, 'Fast Classic', 2, 0.5)], { dias: [2] }),
            promo(4, 'DIA', [item(13, 'Fast Cheese', 1, 0, 1), item(11, 'Papas con cheddar', 1, 0.5, 2)], { dias: [3, 6] }),
        ]);
        const res = crearRes();

        await obtenerPromociones({}, res);

        const respuesta = res.json.mock.calls[0][0];
        // El id viaja como texto: así lo guarda el carrito y lo manda el pedido
        expect(respuesta.productoSemana).toMatchObject({
            id: '1',
            titulo: 'Promo 1',
            items: [{ nombre: 'Combo Habemus Bacon', productoId: 10, cantidad: 1, descuento: 0.2 }],
        });
        expect(respuesta.regalo).toMatchObject({ id: '2', maxPorPedido: 1, compraMinima: 15000 });

        const idsDelDia = (dia) => respuesta.dias.find((d) => d.dia === dia).promos.map((p) => p.id);
        expect(respuesta.dias.map((d) => d.dia)).toEqual([1, 2, 3, 4, 5, 6, 0]);
        expect(idsDelDia(1)).toEqual([]);
        expect(idsDelDia(2)).toEqual(['3']);
        // Una promo de varios días aparece en cada uno, con sus productos en el orden cargado
        expect(idsDelDia(3)).toEqual(['4']);
        expect(idsDelDia(6)).toEqual(['4']);
        const promoDeDosProductos = respuesta.dias.find((d) => d.dia === 3).promos[0];
        expect(promoDeDosProductos.items.map((i) => i.productoId)).toEqual([13, 11]);
    });

    test('no muestra el producto o el regalo de la semana entre las promos del día', async () => {
        Promocion.findAll.mockResolvedValue([
            promo(1, 'SEMANA', [item(10, 'Combo Habemus Bacon', 1, 0.2)]),
            promo(2, 'REGALO', [item(11, 'Papas con cheddar', 1, 1)]),
        ]);
        const res = crearRes();

        await obtenerPromociones({}, res);

        res.json.mock.calls[0][0].dias.forEach((dia) => expect(dia.promos).toEqual([]));
    });

    test('oculta las promociones con un producto eliminado', async () => {
        Promocion.findAll.mockResolvedValue([
            promo(1, 'SEMANA', [item(10, null, 1, 0.2)]),
            promo(2, 'DIA', [item(12, 'Latte', 1, 0.3), item(13, 'Medialunas x2', 1, 0.3, 2, '2026-10-01')], { dias: [1] }),
            promo(3, 'DIA', [item(14, 'Fast Green', 1, 0.25)], { dias: [1] }),
        ]);
        const res = crearRes();

        await obtenerPromociones({}, res);

        const respuesta = res.json.mock.calls[0][0];
        expect(respuesta.productoSemana).toBeNull();
        const lunes = respuesta.dias.find((d) => d.dia === 1);
        expect(lunes.promos.map((p) => p.id)).toEqual(['3']);
    });

    test('responde 500 si falla la base de datos', async () => {
        Promocion.findAll.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await obtenerPromociones({}, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Error al obtener las promociones' });
    });
});
