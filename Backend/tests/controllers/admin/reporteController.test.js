jest.mock('../../../src/models', () => ({
    Pedido: { findAll: jest.fn() },
    DetallePedido: { findAll: jest.fn() },
    Producto: { findAll: jest.fn() },
    Admin: { findByPk: jest.fn() },
    Sucursal: { findAll: jest.fn() },
    StockSucursal: { findAll: jest.fn() },
    RecetaInsumo: { findAll: jest.fn() },
    ProductoTamanio: { findAll: jest.fn() },
    ComboGrupo: { findAll: jest.fn() },
    Insumo: { findAll: jest.fn() },
    sequelize: {
        fn: jest.fn((...args) => ({ fn: args })),
        col: jest.fn((nombre) => ({ col: nombre })),
        literal: jest.fn((texto) => ({ literal: texto })),
    },
    historialDeTiemposPedido: { findAll: jest.fn() },
}));

const models = require('../../../src/models');
const {
    obtenerProductosMasVendidos,
    obtenerProductosMenosVendidos,
    obtenerProductosMayorFacturacion,
    obtenerProductosSinStock,
    obtenerPedidosPorEstado,
    obtenerPedidosPorDia,
    obtenerPedidosPorSucursal,
    obtenerCancelacionesPorDia,
    obtenerTiempoPromedioEntrega,
} = require('../../../src/controllers/admin/reporteController');

const {
    Pedido,
    DetallePedido,
    Producto,
    Admin,
    Sucursal,
    StockSucursal,
    RecetaInsumo,
    ProductoTamanio,
    ComboGrupo,
    Insumo,
    historialDeTiemposPedido,
} = models;

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

const adminDeSucursal = { id: 7, sucursalId: 2 };
const adminMaster = { id: 1, sucursalId: null };

function pedidoAdmin(query = {}) {
    return { usuario: { id: 7 }, query };
}

function fila(datos) {
    return { ...datos, get: (clave) => datos[clave] };
}

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('obtenerProductosMasVendidos', () => {
    test('responde 401 si el administrador no existe', async () => {
        Admin.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await obtenerProductosMasVendidos(pedidoAdmin(), res);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    test('rechaza una sucursal inválida para el MASTER', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);
        const res = crearRes();

        await obtenerProductosMasVendidos(pedidoAdmin({ sucursalId: 'abc' }), res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'La sucursal no es válida' });
    });

    test('el administrador de sucursal solo consulta la suya', async () => {
        Admin.findByPk.mockResolvedValue(adminDeSucursal);
        DetallePedido.findAll.mockResolvedValue([]);
        const res = crearRes();

        await obtenerProductosMasVendidos(pedidoAdmin(), res);

        const { include } = DetallePedido.findAll.mock.calls[0][0];
        expect(include[0].where).toMatchObject({ sucursalId: 2 });
        expect(res.json).toHaveBeenCalledWith([]);
    });

    test('el MASTER puede filtrar por sucursal', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);
        DetallePedido.findAll.mockResolvedValue([]);

        await obtenerProductosMasVendidos(pedidoAdmin({ sucursalId: '3' }), crearRes());

        const { include } = DetallePedido.findAll.mock.calls[0][0];
        expect(include[0].where).toMatchObject({ sucursalId: 3 });
    });

    test('responde 500 si falla la base de datos', async () => {
        Admin.findByPk.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await obtenerProductosMasVendidos(pedidoAdmin(), res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('obtenerProductosMenosVendidos', () => {
    test('responde 401 si el administrador no existe', async () => {
        Admin.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await obtenerProductosMenosVendidos(pedidoAdmin(), res);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    test('rechaza una sucursal inválida para el MASTER', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);
        const res = crearRes();

        await obtenerProductosMenosVendidos(pedidoAdmin({ sucursalId: 0 }), res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('devuelve los productos con sus unidades vendidas', async () => {
        Admin.findByPk.mockResolvedValue(adminDeSucursal);
        Producto.findAll.mockResolvedValue([
            fila({ id: 1, nombre: 'Agua', imagen: 'agua.png', unidadesVendidas: '0' }),
        ]);
        const res = crearRes();

        await obtenerProductosMenosVendidos(pedidoAdmin(), res);

        expect(res.json).toHaveBeenCalledWith([
            { productoId: 1, nombre: 'Agua', imagen: 'agua.png', unidadesVendidas: '0' },
        ]);
    });

    test('responde 500 si falla la base de datos', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);
        Producto.findAll.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await obtenerProductosMenosVendidos(pedidoAdmin(), res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('obtenerProductosMayorFacturacion', () => {
    test('responde 401 si el administrador no existe', async () => {
        Admin.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await obtenerProductosMayorFacturacion(pedidoAdmin(), res);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    test('rechaza una sucursal inválida para el MASTER', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);
        const res = crearRes();

        await obtenerProductosMayorFacturacion(pedidoAdmin({ sucursalId: -2 }), res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('devuelve la facturación por producto', async () => {
        Admin.findByPk.mockResolvedValue(adminDeSucursal);
        DetallePedido.findAll.mockResolvedValue([
            {
                productoId: 1,
                Producto: { nombre: 'Clásica', imagen: 'clasica.png' },
                get: () => '25000',
            },
        ]);
        const res = crearRes();

        await obtenerProductosMayorFacturacion(pedidoAdmin(), res);

        expect(res.json).toHaveBeenCalledWith([
            { productoId: 1, nombre: 'Clásica', imagen: 'clasica.png', facturacion: '25000' },
        ]);
    });

    test('responde 500 si falla la base de datos', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);
        DetallePedido.findAll.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await obtenerProductosMayorFacturacion(pedidoAdmin(), res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('obtenerProductosSinStock', () => {
    beforeEach(() => {
        Sucursal.findAll.mockResolvedValue([{ id: 2, nombre: 'Morón' }]);
        ProductoTamanio.findAll.mockResolvedValue([]);
        ComboGrupo.findAll.mockResolvedValue([]);
        Insumo.findAll.mockResolvedValue([
            { id: 10, nombre: 'Pan' },
            { id: 20, nombre: 'Papas' },
        ]);
    });

    test('responde 401 si el administrador no existe', async () => {
        Admin.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await obtenerProductosSinStock(pedidoAdmin(), res);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    test('rechaza una sucursal inválida para el MASTER', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);
        const res = crearRes();

        await obtenerProductosSinStock(pedidoAdmin({ sucursalId: 'x' }), res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('reporta productos sin stock, combos sin ingredientes y productos sin receta', async () => {
        Admin.findByPk.mockResolvedValue(adminDeSucursal);
        Producto.findAll.mockResolvedValue([
            { id: 1, nombre: 'Clásica', imagen: 'a.png', categoriaId: 1 },
            { id: 2, nombre: 'Combo', imagen: 'b.png', categoriaId: 2 },
            { id: 3, nombre: 'Papas', imagen: 'c.png', categoriaId: 3 },
            { id: 4, nombre: 'Agua', imagen: 'd.png', categoriaId: 5 },
        ]);
        RecetaInsumo.findAll.mockResolvedValue([
            { productoId: 1, insumoId: 10, cantidadBase: '1' },
            { productoId: 2, insumoId: 10, cantidadBase: '1' },
            { productoId: 3, insumoId: 20, cantidadBase: '1' },
            { productoId: 3, insumoId: 99, cantidadBase: '0' },
        ]);
        ProductoTamanio.findAll.mockResolvedValue([
            { productoId: 2, tamanioId: 1, factorStock: 1 },
            { productoId: 3, tamanioId: 1, factorStock: 1 },
        ]);
        ComboGrupo.findAll.mockResolvedValue([
            { productoId: 2, categoriaId: 3, obligatorio: true, nombre: 'Acompañamiento' },
        ]);
        StockSucursal.findAll.mockResolvedValue([
            { sucursalId: 2, insumoId: 10, cantidad: '0' },
        ]);
        const res = crearRes();

        await obtenerProductosSinStock(pedidoAdmin(), res);

        const reporte = res.json.mock.calls[0][0];
        expect(reporte).toHaveLength(3);
        expect(reporte).toEqual(expect.arrayContaining([
            expect.objectContaining({ productoId: 1, insumoLimitante: 'Pan' }),
            expect.objectContaining({ productoId: 2, insumoLimitante: 'Pan' }),
            expect.objectContaining({ productoId: 3, insumoLimitante: 'Papas' }),
        ]));
    });

    test('reporta un combo sin opciones para un grupo obligatorio', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);
        Sucursal.findAll.mockResolvedValue([{ id: 1, nombre: 'Centro' }]);
        Producto.findAll.mockResolvedValue([
            { id: 2, nombre: 'Combo', imagen: 'b.png', categoriaId: 2 },
            { id: 3, nombre: 'Papas', imagen: 'c.png', categoriaId: 3 },
        ]);
        RecetaInsumo.findAll.mockResolvedValue([
            { productoId: 2, insumoId: 10, cantidadBase: '1' },
            { productoId: 3, insumoId: 20, cantidadBase: '1' },
        ]);
        ComboGrupo.findAll.mockResolvedValue([
            { productoId: 2, categoriaId: 3, obligatorio: true, nombre: 'Bebida' },
        ]);
        StockSucursal.findAll.mockResolvedValue([
            { sucursalId: 1, insumoId: 10, cantidad: '5' },
            { sucursalId: 1, insumoId: 20, cantidad: '5' },
        ]);
        const res = crearRes();

        await obtenerProductosSinStock(pedidoAdmin(), res);

        expect(res.json.mock.calls[0][0]).toEqual([
            expect.objectContaining({
                productoId: 2,
                insumoLimitante: 'Sin opciones disponibles: Bebida',
            }),
        ]);
    });

    test('evalúa las opciones del combo con el tamaño y el stock', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);
        Sucursal.findAll.mockResolvedValue([{ id: 1, nombre: 'Centro' }]);
        Producto.findAll.mockResolvedValue([
            { id: 2, nombre: 'Combo', imagen: 'b.png', categoriaId: 2 },
            { id: 3, nombre: 'Papas', imagen: 'c.png', categoriaId: 3 },
        ]);
        RecetaInsumo.findAll.mockResolvedValue([
            { productoId: 2, insumoId: 10, cantidadBase: '1' },
            { productoId: 3, insumoId: 20, cantidadBase: '1' },
        ]);
        ProductoTamanio.findAll.mockResolvedValue([
            { productoId: 2, tamanioId: 1, factorStock: 1 },
            { productoId: 3, tamanioId: 1, factorStock: 1 },
        ]);
        ComboGrupo.findAll.mockResolvedValue([
            { productoId: 2, categoriaId: 3, obligatorio: true, nombre: 'Bebida' },
        ]);
        StockSucursal.findAll.mockResolvedValue([
            { sucursalId: 1, insumoId: 10, cantidad: '5' },
            { sucursalId: 1, insumoId: 20, cantidad: '0' },
        ]);
        const res = crearRes();

        await obtenerProductosSinStock(pedidoAdmin(), res);

        expect(res.json.mock.calls[0][0]).toEqual(expect.arrayContaining([
            expect.objectContaining({
                productoId: 2,
                insumoLimitante: 'Sin opciones disponibles: Bebida',
            }),
        ]));
    });

    test('responde 500 si falla la base de datos', async () => {
        Admin.findByPk.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await obtenerProductosSinStock(pedidoAdmin(), res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('obtenerPedidosPorEstado', () => {
    test('responde 401 si el administrador no existe', async () => {
        Admin.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await obtenerPedidosPorEstado(pedidoAdmin(), res);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    test('rechaza una sucursal inválida para el MASTER', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);
        const res = crearRes();

        await obtenerPedidosPorEstado(pedidoAdmin({ sucursalId: 'x' }), res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('devuelve los cinco estados, incluso los que no tienen pedidos', async () => {
        Admin.findByPk.mockResolvedValue(adminDeSucursal);
        Pedido.findAll.mockResolvedValue([
            fila({ estado: 'pendiente', cantidad: '3' }),
            fila({ estado: 'entregado', cantidad: '2' }),
        ]);
        const res = crearRes();

        await obtenerPedidosPorEstado(pedidoAdmin(), res);

        expect(res.json).toHaveBeenCalledWith([
            { estado: 'pendiente', cantidad: 3 },
            { estado: 'en proceso', cantidad: 0 },
            { estado: 'en camino', cantidad: 0 },
            { estado: 'entregado', cantidad: 2 },
            { estado: 'cancelado', cantidad: 0 },
        ]);
    });

    test('responde 500 si falla la base de datos', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);
        Pedido.findAll.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await obtenerPedidosPorEstado(pedidoAdmin(), res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('obtenerPedidosPorDia', () => {
    test('responde 401 si el administrador no existe', async () => {
        Admin.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await obtenerPedidosPorDia(pedidoAdmin(), res);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    test('rechaza una sucursal inválida para el MASTER', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);
        const res = crearRes();

        await obtenerPedidosPorDia(pedidoAdmin({ sucursalId: 'x' }), res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('devuelve la cantidad de pedidos por día', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);
        Pedido.findAll.mockResolvedValue([
            fila({ fecha: '2026-10-01', cantidad: '4' }),
        ]);
        const res = crearRes();

        await obtenerPedidosPorDia(pedidoAdmin(), res);

        expect(res.json).toHaveBeenCalledWith([{ fecha: '2026-10-01', cantidad: 4 }]);
    });

    test('responde 500 si falla la base de datos', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);
        Pedido.findAll.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await obtenerPedidosPorDia(pedidoAdmin(), res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('obtenerPedidosPorSucursal', () => {
    test('responde 401 si el administrador no existe', async () => {
        Admin.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await obtenerPedidosPorSucursal(pedidoAdmin(), res);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    test('devuelve la cantidad de pedidos por sucursal', async () => {
        Admin.findByPk.mockResolvedValue(adminDeSucursal);
        Pedido.findAll.mockResolvedValue([
            { sucursalId: 2, Sucursal: { nombre: 'Morón' }, get: () => '5' },
        ]);
        const res = crearRes();

        await obtenerPedidosPorSucursal(pedidoAdmin(), res);

        expect(Pedido.findAll).toHaveBeenCalledWith(expect.objectContaining({
            where: { sucursalId: 2 },
        }));
        expect(res.json).toHaveBeenCalledWith([
            { sucursalId: 2, nombre: 'Morón', cantidad: 5 },
        ]);
    });

    test('el MASTER consulta todas las sucursales sin filtro', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);
        Pedido.findAll.mockResolvedValue([]);

        await obtenerPedidosPorSucursal(pedidoAdmin(), crearRes());

        expect(Pedido.findAll).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
    });

    test('responde 500 si falla la base de datos', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);
        Pedido.findAll.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await obtenerPedidosPorSucursal(pedidoAdmin(), res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('obtenerCancelacionesPorDia', () => {
    test('responde 401 si el administrador no existe', async () => {
        Admin.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await obtenerCancelacionesPorDia(pedidoAdmin(), res);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    test('rechaza una sucursal inválida para el MASTER', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);
        const res = crearRes();

        await obtenerCancelacionesPorDia(pedidoAdmin({ sucursalId: 'x' }), res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('devuelve las cancelaciones por día', async () => {
        Admin.findByPk.mockResolvedValue(adminDeSucursal);
        historialDeTiemposPedido.findAll.mockResolvedValue([
            fila({ fecha: '2026-10-01', cantidad: '2' }),
        ]);
        const res = crearRes();

        await obtenerCancelacionesPorDia(pedidoAdmin(), res);

        expect(res.json).toHaveBeenCalledWith([{ fecha: '2026-10-01', cantidad: 2 }]);
    });

    test('responde 500 si falla la base de datos', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);
        historialDeTiemposPedido.findAll.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await obtenerCancelacionesPorDia(pedidoAdmin(), res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('obtenerTiempoPromedioEntrega', () => {
    test('responde 401 si el administrador no existe', async () => {
        Admin.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await obtenerTiempoPromedioEntrega(pedidoAdmin(), res);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    test('rechaza una sucursal inválida para el MASTER', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);
        const res = crearRes();

        await obtenerTiempoPromedioEntrega(pedidoAdmin({ sucursalId: 'x' }), res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('calcula el promedio de minutos entre la creación y la entrega', async () => {
        Admin.findByPk.mockResolvedValue(adminDeSucursal);
        historialDeTiemposPedido.findAll.mockResolvedValue([
            { fechaCreacion: '2026-10-01T10:00:00Z', fecha: '2026-10-01T10:30:00Z' },
            { fechaCreacion: '2026-10-01T11:00:00Z', fecha: '2026-10-01T11:20:00Z' },
        ]);
        const res = crearRes();

        await obtenerTiempoPromedioEntrega(pedidoAdmin(), res);

        expect(res.json).toHaveBeenCalledWith({ cantidadPedidos: 2, promedioMinutos: 25 });
    });

    test('sin entregas devuelve promedio null', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);
        historialDeTiemposPedido.findAll.mockResolvedValue([]);
        const res = crearRes();

        await obtenerTiempoPromedioEntrega(pedidoAdmin(), res);

        expect(res.json).toHaveBeenCalledWith({ cantidadPedidos: 0, promedioMinutos: null });
    });

    test('ignora fechas inválidas o negativas', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);
        historialDeTiemposPedido.findAll.mockResolvedValue([
            { fechaCreacion: 'ayer', fecha: 'hoy' },
            { fechaCreacion: '2026-10-01T11:00:00Z', fecha: '2026-10-01T10:00:00Z' },
        ]);
        const res = crearRes();

        await obtenerTiempoPromedioEntrega(pedidoAdmin(), res);

        expect(res.json).toHaveBeenCalledWith({ cantidadPedidos: 0, promedioMinutos: null });
    });

    test('responde 500 si falla la base de datos', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);
        historialDeTiemposPedido.findAll.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await obtenerTiempoPromedioEntrega(pedidoAdmin(), res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});
