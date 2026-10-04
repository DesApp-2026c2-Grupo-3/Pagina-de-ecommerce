jest.mock('../../../src/models', () => {
    const t = { commit: jest.fn(), rollback: jest.fn(), LOCK: { UPDATE: 'UPDATE' } };
    return {
        StockSucursal: { findAll: jest.fn(), findByPk: jest.fn() },
        Insumo: { findByPk: jest.fn() },
        MovimientoStock: { create: jest.fn(), findAll: jest.fn() },
        Admin: { findByPk: jest.fn() },
        sequelize: { transaction: jest.fn().mockResolvedValue(t) },
        __t: t,
    };
});

const models = require('../../../src/models');
const {
    obtenerStockPorSucursal,
    cargarAumento,
    registrarBaja,
    definirMinimo,
    obtenerMovimientos,
} = require('../../../src/controllers/admin/stockController');

const { StockSucursal, Insumo, MovimientoStock, Admin } = models;
const t = models.__t;

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

// Una fila de stock como la devuelve la base (las cantidades llegan como texto)
const fila = (id, nombre, cantidad, stockMinimo) => ({
    id,
    insumoId: id,
    sucursalId: 2,
    cantidad: String(cantidad),
    stockMinimo: stockMinimo == null ? null : String(stockMinimo),
    Insumo: { nombre, unidadMedida: 'unidad' },
});

// Un registro de stock que se puede actualizar
const registro = (cantidad) => ({ sucursalId: 2, insumoId: 1, cantidad: String(cantidad), update: jest.fn() });

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    Admin.findByPk.mockResolvedValue({ id: 7 });
});

describe('obtenerStockPorSucursal', () => {
    test('marca los insumos que llegaron al mínimo o están por debajo', async () => {
        StockSucursal.findAll.mockResolvedValue([
            fila(1, 'Pan', 3, 10),     // por debajo
            fila(2, 'Carne', 10, 10),  // justo en el mínimo: también es alerta
            fila(3, 'Queso', 20, 10),  // por encima
            fila(4, 'Agua', 5, null),  // sin mínimo definido
        ]);
        const res = crearRes();

        await obtenerStockPorSucursal({ params: { id: '2' } }, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const grilla = res.json.mock.calls[0][0];
        expect(grilla.map((i) => i.bajoMinimo)).toEqual([true, true, false, false]);
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
    test('suma la cantidad (no la reemplaza) y lo registra en el historial', async () => {
        const stock = registro(40);
        StockSucursal.findByPk.mockResolvedValue(stock);
        const res = crearRes();

        await cargarAumento({ params: { id: '1' }, body: { cantidad: 10, adminId: 7 } }, res);

        expect(stock.update).toHaveBeenCalledWith({ cantidad: 50 }, { transaction: t });
        expect(MovimientoStock.create).toHaveBeenCalledWith(
            expect.objectContaining({ tipo: 'aumento', cantidad: 10, cantidadAnterior: 40, cantidadNueva: 50, adminId: 7 }),
            { transaction: t }
        );
        expect(t.commit).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('si el admin no existe, el movimiento queda sin admin', async () => {
        StockSucursal.findByPk.mockResolvedValue(registro(40));
        Admin.findByPk.mockResolvedValue(null);

        await cargarAumento({ params: { id: '1' }, body: { cantidad: 10, adminId: 999 } }, crearRes());

        expect(MovimientoStock.create).toHaveBeenCalledWith(expect.objectContaining({ adminId: null }), expect.anything());
    });

    test('responde 404 si el registro de stock no existe', async () => {
        StockSucursal.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await cargarAumento({ params: { id: '99' }, body: { cantidad: 10 } }, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(t.rollback).toHaveBeenCalled();
    });

    test('si falla la base de datos, deshace todo y responde 500', async () => {
        StockSucursal.findByPk.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await cargarAumento({ params: { id: '1' }, body: { cantidad: 10 } }, res);

        expect(t.rollback).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('registrarBaja', () => {
    test('resta la cantidad y la registra con su motivo', async () => {
        const stock = registro(20);
        StockSucursal.findByPk.mockResolvedValue(stock);
        const res = crearRes();

        await registrarBaja({ params: { id: '1' }, body: { cantidad: 5, motivo: 'vencimiento', detalle: '' } }, res);

        expect(stock.update).toHaveBeenCalledWith({ cantidad: 15 }, { transaction: t });
        expect(MovimientoStock.create).toHaveBeenCalledWith(
            expect.objectContaining({ tipo: 'baja', cantidad: 5, motivo: 'vencimiento', detalle: null, cantidadNueva: 15 }),
            { transaction: t }
        );
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('no deja bajar más de lo que hay (el stock nunca queda negativo)', async () => {
        const stock = registro(20);
        StockSucursal.findByPk.mockResolvedValue(stock);
        Insumo.findByPk.mockResolvedValue({ nombre: 'Pan' });
        const res = crearRes();

        await registrarBaja({ params: { id: '1' }, body: { cantidad: 30, motivo: 'merma' } }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json.mock.calls[0][0].code).toContain('No se puede bajar más de lo que hay');
        expect(stock.update).not.toHaveBeenCalled();
        expect(t.rollback).toHaveBeenCalled();
    });

    test('responde 404 si el registro de stock no existe', async () => {
        StockSucursal.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await registrarBaja({ params: { id: '99' }, body: { cantidad: 1, motivo: 'merma' } }, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('si falla la base de datos, deshace todo y responde 500', async () => {
        StockSucursal.findByPk.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await registrarBaja({ params: { id: '1' }, body: { cantidad: 1, motivo: 'merma' } }, res);

        expect(t.rollback).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('definirMinimo', () => {
    test('guarda el valor de alerta', async () => {
        const stock = { update: jest.fn() };
        StockSucursal.findByPk.mockResolvedValue(stock);
        const res = crearRes();

        await definirMinimo({ params: { id: '1' }, body: { stockMinimo: 10 } }, res);

        expect(stock.update).toHaveBeenCalledWith({ stockMinimo: 10 });
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('acepta null para quitar la alerta', async () => {
        const stock = { update: jest.fn() };
        StockSucursal.findByPk.mockResolvedValue(stock);

        await definirMinimo({ params: { id: '1' }, body: { stockMinimo: null } }, crearRes());

        expect(stock.update).toHaveBeenCalledWith({ stockMinimo: null });
    });

    test('responde 404 si el registro de stock no existe', async () => {
        StockSucursal.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await definirMinimo({ params: { id: '99' }, body: { stockMinimo: 10 } }, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('responde 500 si falla la base de datos', async () => {
        StockSucursal.findByPk.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await definirMinimo({ params: { id: '1' }, body: { stockMinimo: 10 } }, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('obtenerMovimientos', () => {
    test('devuelve el historial con el insumo, el pedido y quién lo hizo', async () => {
        const fecha = new Date('2026-10-04T13:00:00Z');
        MovimientoStock.findAll.mockResolvedValue([
            {
                id: 1, createdAt: fecha, tipo: 'venta', cantidad: '2', cantidadAnterior: '10', cantidadNueva: '8',
                motivo: null, detalle: null, pedidoId: 45, Insumo: { nombre: 'Pan', unidadMedida: 'unidad' }, Admin: null,
            },
            {
                id: 2, createdAt: fecha, tipo: 'baja', cantidad: '1', cantidadAnterior: '8', cantidadNueva: '7',
                motivo: 'merma', detalle: 'se cayó', pedidoId: null, Insumo: null, Admin: { nombre: 'Ana' },
            },
        ]);
        const res = crearRes();

        await obtenerMovimientos({ params: { id: '2' } }, res);

        const historial = res.json.mock.calls[0][0];
        expect(historial[0]).toMatchObject({ tipo: 'venta', insumo: 'Pan', cantidad: 2, pedidoId: 45, admin: null });
        expect(historial[1]).toMatchObject({ tipo: 'baja', insumo: 'Insumo eliminado', motivo: 'merma', admin: 'Ana' });
    });

    test('responde 500 si falla la base de datos', async () => {
        MovimientoStock.findAll.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await obtenerMovimientos({ params: { id: '2' } }, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});