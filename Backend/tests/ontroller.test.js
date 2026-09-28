jest.mock('../src/models', () => ({
    StockSucursal: { findAll: jest.fn(), findByPk: jest.fn() },
    Insumo: {},
}));

const { StockSucursal } = require('../src/models');
const { obtenerStockPorSucursal, cargarAumento } = require('../src/controllers/admin/stockController');

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

function itemDeStock(id, nombre, cantidad, stockMinimo) {
    return {
        id, insumoId: id, sucursalId: '2', cantidad, stockMinimo,
        Insumo: { nombre, unidadMedida: 'unidad' },
    };
}

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('obtenerStockPorSucursal', () => {
    test('busca el stock de la sucursal pedida', async () => {
        StockSucursal.findAll.mockResolvedValue([]);

        await obtenerStockPorSucursal({ params: { id: '2' } }, crearRes());

        expect(StockSucursal.findAll).toHaveBeenCalledWith(
            expect.objectContaining({ where: { sucursalId: '2' } })
        );
    });

    test('marca los insumos que están por debajo del mínimo', async () => {
        StockSucursal.findAll.mockResolvedValue([
            itemDeStock(1, 'Pan', '3', '10'),      // debajo del mínimo
            itemDeStock(2, 'Carne', '10', '10'),   // justo en el mínimo: no es "bajo"
            itemDeStock(3, 'Cheddar', '50', '10'), // sobra
            itemDeStock(4, 'Tomate', '1', null),   // sin mínimo definido
        ]);
        const res = crearRes();

        await obtenerStockPorSucursal({ params: { id: '2' } }, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const grilla = res.json.mock.calls[0][0];
        expect(grilla.map((i) => i.bajoMinimo)).toEqual([true, false, false, false]);
        expect(grilla[0]).toMatchObject({ nombre: 'Pan', cantidad: 3, stockMinimo: 10 }); // texto → número
        expect(grilla[3].stockMinimo).toBeNull();
    });

    test('responde 500 si falla la base de datos', async () => {
        StockSucursal.findAll.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await obtenerStockPorSucursal({ params: { id: '2' } }, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('cargarAumento', () => {
    test('responde 404 si el registro de stock no existe', async () => {
        StockSucursal.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await cargarAumento({ params: { id: '99' }, body: { cantidad: 5 } }, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('suma la cantidad al stock actual (no la reemplaza)', async () => {
        const stock = { cantidad: '10', update: jest.fn() };
        StockSucursal.findByPk.mockResolvedValue(stock);
        const res = crearRes();

        await cargarAumento({ params: { id: '1' }, body: { cantidad: 2.5 } }, res);

        expect(stock.update).toHaveBeenCalledWith({ cantidad: 12.5 });
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('responde 500 si falla la base de datos', async () => {
        StockSucursal.findByPk.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await cargarAumento({ params: { id: '1' }, body: { cantidad: 5 } }, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});