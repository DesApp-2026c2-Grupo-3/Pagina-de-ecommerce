jest.mock('../../src/models', () => ({
    Producto: { findAll: jest.fn() },
}));

const { Producto } = require('../../src/models');
const { TODAS } = require('../../src/config/promociones');
const { obtenerPromociones } = require('../../src/controllers/promocionController');

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

const nombresUnicos = [...new Set(TODAS.flatMap((promo) => promo.items.map((item) => item.nombre)))];

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('obtenerPromociones', () => {
    test('oculta las promociones cuyos productos ya no existen', async () => {
        Producto.findAll.mockResolvedValue([]);
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

    test('resuelve los productos de todas las promociones', async () => {
        Producto.findAll.mockResolvedValue(nombresUnicos.map((nombre, indice) => ({
            id: indice + 1,
            nombre,
        })));
        const res = crearRes();

        await obtenerPromociones({}, res);

        const respuesta = res.json.mock.calls[0][0];
        expect(respuesta.productoSemana.items[0].productoId).toBe(1);
        expect(respuesta.regalo.items[0].productoId).toBe(2);
        expect(respuesta.dias).toHaveLength(7);
        respuesta.dias.forEach((dia) => {
            expect(dia.nombre).toEqual(expect.any(String));
            expect(dia.promos).toHaveLength(3);
            dia.promos.forEach((promo) => {
                expect(promo.items.length).toBeGreaterThan(0);
                promo.items.forEach((item) => expect(item.productoId).toEqual(expect.any(Number)));
            });
        });
    });

    test('una promoción con un producto faltante también se oculta', async () => {
        Producto.findAll.mockResolvedValue(
            nombresUnicos
                .filter((nombre) => nombre !== 'Medialunas x2')
                .map((nombre, indice) => ({ id: indice + 1, nombre })),
        );
        const res = crearRes();

        await obtenerPromociones({}, res);

        const respuesta = res.json.mock.calls[0][0];
        const lunes = respuesta.dias.find((dia) => dia.dia === 1);
        expect(lunes.promos.map((promo) => promo.id)).not.toContain('lun-cafe');
        expect(lunes.promos).toHaveLength(2);
    });

    test('responde 500 si falla la base de datos', async () => {
        Producto.findAll.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await obtenerPromociones({}, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Error al obtener las promociones' });
    });
});
