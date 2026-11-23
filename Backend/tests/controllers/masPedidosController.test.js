jest.mock('../../src/models', () => ({
    DetallePedido: { findAll: jest.fn() },
    Pedido: {},
}));

const models = require('../../src/models');
const { obtenerMasPedidos } = require('../../src/controllers/masPedidosController');

const { DetallePedido } = models;

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    DetallePedido.findAll.mockResolvedValue([]);
});

describe('obtenerMasPedidos', () => {
    test('usa el límite por defecto y no filtra por sucursal', async () => {
        const res = crearRes();

        await obtenerMasPedidos({ query: {} }, res);

        const opciones = DetallePedido.findAll.mock.calls[0][0];
        expect(opciones.limit).toBe(4);
        expect(opciones.include[0].where.sucursalId).toBeUndefined();
        expect(res.json).toHaveBeenCalledWith([]);
    });

    test('filtra por sucursal cuando viene el parámetro', async () => {
        await obtenerMasPedidos({ query: { sucursalId: '2' } }, crearRes());

        const opciones = DetallePedido.findAll.mock.calls[0][0];
        expect(opciones.include[0].where.sucursalId).toBe(2);
    });

    test('convierte los vendidos a número', async () => {
        DetallePedido.findAll.mockResolvedValue([
            { productoId: 12, vendidos: '37' },
        ]);
        const res = crearRes();

        await obtenerMasPedidos({ query: {} }, res);

        expect(res.json).toHaveBeenCalledWith([{ productoId: 12, vendidos: 37 }]);
    });

    test('limita el máximo a 12', async () => {
        await obtenerMasPedidos({ query: { limite: '50' } }, crearRes());

        expect(DetallePedido.findAll.mock.calls[0][0].limit).toBe(12);
    });

    test('ignora un límite inválido', async () => {
        await obtenerMasPedidos({ query: { limite: 'abc' } }, crearRes());

        expect(DetallePedido.findAll.mock.calls[0][0].limit).toBe(4);
    });

    test.each([
        ['texto', 'abc'],
        ['cero', '0'],
        ['negativo', '-1'],
    ])('rechaza una sucursal inválida (%s)', async (_caso, sucursalId) => {
        const res = crearRes();

        await obtenerMasPedidos({ query: { sucursalId } }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(DetallePedido.findAll).not.toHaveBeenCalled();
    });

    test('responde 500 si falla la base de datos', async () => {
        DetallePedido.findAll.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await obtenerMasPedidos({ query: {} }, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Error al obtener los productos más pedidos' });
    });
});
