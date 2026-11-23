jest.mock('../../src/models', () => ({
    MovimientoStock: { count: jest.fn(), findAll: jest.fn(), create: jest.fn() },
    StockSucursal: { findOne: jest.fn() },
}));

const { MovimientoStock, StockSucursal } = require('../../src/models');
const { devolverStockPedido } = require('../../src/utils/stockPedido');

function crearStock(cantidad) {
    const stock = {
        cantidad: String(cantidad),
        update: jest.fn(({ cantidad: nueva }) => {
            stock.cantidad = String(nueva);
        }),
    };
    return stock;
}

const t = { LOCK: { UPDATE: 'UPDATE' } };

beforeEach(() => {
    jest.clearAllMocks();
    MovimientoStock.count.mockResolvedValue(0);
    MovimientoStock.findAll.mockResolvedValue([]);
});

describe('devolverStockPedido', () => {
    test('no hace nada si el pedido ya se había devuelto', async () => {
        MovimientoStock.count.mockResolvedValue(1);

        const resultado = await devolverStockPedido(100, { transaction: t, adminId: 7 });

        expect(resultado).toBe(0);
        expect(MovimientoStock.findAll).not.toHaveBeenCalled();
        expect(StockSucursal.findOne).not.toHaveBeenCalled();
        expect(MovimientoStock.create).not.toHaveBeenCalled();
    });

    test('no hace nada si el pedido no tiene ventas registradas', async () => {
        const resultado = await devolverStockPedido(100, { transaction: t });

        expect(resultado).toBe(0);
        expect(MovimientoStock.findAll).toHaveBeenCalledWith({
            where: { pedidoId: 100, tipo: 'venta' },
            transaction: t,
        });
        expect(MovimientoStock.create).not.toHaveBeenCalled();
    });

    test('devuelve al stock lo vendido y lo registra en el historial', async () => {
        MovimientoStock.findAll.mockResolvedValue([
            { sucursalId: 2, insumoId: 10, cantidad: '2' },
        ]);
        const stock = crearStock(10);
        StockSucursal.findOne.mockResolvedValue(stock);

        const resultado = await devolverStockPedido(100, { transaction: t, adminId: 7 });

        expect(resultado).toBe(1);
        expect(StockSucursal.findOne).toHaveBeenCalledWith({
            where: { sucursalId: 2, insumoId: 10 },
            transaction: t,
            lock: 'UPDATE',
        });
        expect(stock.update).toHaveBeenCalledWith({ cantidad: 12 }, { transaction: t });
        expect(MovimientoStock.create).toHaveBeenCalledWith({
            sucursalId: 2,
            insumoId: 10,
            tipo: 'devolucion',
            cantidad: 2,
            cantidadAnterior: 10,
            cantidadNueva: 12,
            motivo: 'cancelacion',
            pedidoId: 100,
            adminId: 7,
        }, { transaction: t });
    });

    test('suma las ventas repetidas del mismo insumo en la misma sucursal', async () => {
        MovimientoStock.findAll.mockResolvedValue([
            { sucursalId: 2, insumoId: 10, cantidad: '2' },
            { sucursalId: 2, insumoId: 10, cantidad: '0.5' },
        ]);
        const stock = crearStock(5);
        StockSucursal.findOne.mockResolvedValue(stock);

        const resultado = await devolverStockPedido(100, { transaction: t });

        expect(resultado).toBe(1);
        expect(StockSucursal.findOne).toHaveBeenCalledTimes(1);
        expect(stock.update).toHaveBeenCalledWith({ cantidad: 7.5 }, { transaction: t });
        expect(MovimientoStock.create).toHaveBeenCalledWith(
            expect.objectContaining({ cantidad: 2.5, cantidadNueva: 7.5 }),
            { transaction: t }
        );
    });

    test('agrupa por sucursal e insumo', async () => {
        MovimientoStock.findAll.mockResolvedValue([
            { sucursalId: 2, insumoId: 10, cantidad: '1' },
            { sucursalId: 2, insumoId: 20, cantidad: '2' },
            { sucursalId: 3, insumoId: 10, cantidad: '3' },
        ]);
        StockSucursal.findOne.mockImplementation(({ where }) => Promise.resolve(crearStock(10)));

        const resultado = await devolverStockPedido(100, { transaction: t });

        expect(resultado).toBe(3);
        expect(StockSucursal.findOne).toHaveBeenCalledTimes(3);
        expect(MovimientoStock.create).toHaveBeenCalledTimes(3);
    });

    test('redondea a 3 decimales para evitar errores de coma flotante', async () => {
        MovimientoStock.findAll.mockResolvedValue([
            { sucursalId: 2, insumoId: 10, cantidad: '0.1' },
            { sucursalId: 2, insumoId: 10, cantidad: '0.2' },
        ]);
        const stock = crearStock(0);
        StockSucursal.findOne.mockResolvedValue(stock);

        await devolverStockPedido(100, { transaction: t });

        expect(stock.update).toHaveBeenCalledWith({ cantidad: 0.3 }, { transaction: t });
        expect(MovimientoStock.create).toHaveBeenCalledWith(
            expect.objectContaining({ cantidad: 0.3, cantidadNueva: 0.3 }),
            { transaction: t }
        );
    });

    test('si no existe el registro de stock, lo omite', async () => {
        MovimientoStock.findAll.mockResolvedValue([
            { sucursalId: 2, insumoId: 10, cantidad: '1' },
        ]);
        StockSucursal.findOne.mockResolvedValue(null);

        const resultado = await devolverStockPedido(100, { transaction: t });

        expect(resultado).toBe(1);
        expect(MovimientoStock.create).not.toHaveBeenCalled();
    });

    test('sin transacción no bloquea ni filtra por transacción', async () => {
        MovimientoStock.findAll.mockResolvedValue([
            { sucursalId: 2, insumoId: 10, cantidad: '1' },
        ]);
        const stock = crearStock(3);
        StockSucursal.findOne.mockResolvedValue(stock);

        await devolverStockPedido(100);

        expect(MovimientoStock.findAll).toHaveBeenCalledWith({
            where: { pedidoId: 100, tipo: 'venta' },
            transaction: undefined,
        });
        expect(StockSucursal.findOne).toHaveBeenCalledWith({
            where: { sucursalId: 2, insumoId: 10 },
            transaction: undefined,
            lock: undefined,
        });
        expect(MovimientoStock.create).toHaveBeenCalledWith(
            expect.objectContaining({ adminId: null }),
            { transaction: undefined }
        );
    });
});
