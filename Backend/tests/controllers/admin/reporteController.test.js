jest.mock('../../../src/models', () => ({
    Pedido: { findAll: jest.fn() },
    DetallePedido: { findAll: jest.fn() },
    Producto: { findAll: jest.fn() },
    Categoria: { findAll: jest.fn() },
    Admin: { findByPk: jest.fn() },
    Sucursal: { findAll: jest.fn() },
    StockSucursal: { findAll: jest.fn() },
    RecetaInsumo: { findAll: jest.fn() },
    ProductoTamanio: { findAll: jest.fn() },
    ComboGrupo: { findAll: jest.fn() },
    Insumo: { findAll: jest.fn() },
    Usuario: { findAll: jest.fn() },
    Promocion: { findAll: jest.fn() },
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
    obtenerClientesMasPedidos,
    obtenerClientesNuevos,
    obtenerClientesInactivos,
    obtenerVentasPorSucursal,
    obtenerProductosPorSucursal,
    obtenerPedidosAtendidosPorSucursal,
    obtenerPromocionesMasUtilizadas,
    obtenerImpactoPromociones,
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
    Usuario,
    Promocion,
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
            { productoId: 1, nombre: 'Agua', imagen: 'agua.png', categoria: null, unidadesVendidas: '0' },
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
            { productoId: 1, nombre: 'Clásica', imagen: 'clasica.png', categoria: null, facturacion: '25000' },
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

test('rechaza un período que no está permitido', async () => {
    Admin.findByPk.mockResolvedValue(adminMaster);
    const res = crearRes();

    await obtenerProductosMasVendidos(
        pedidoAdmin({ ultimos: '15' }),
        res
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
        mensaje: 'El período no es válido',
    });
});

test('aplica el filtro de fecha cuando se solicita un período válido', async () => {
    Admin.findByPk.mockResolvedValue(adminMaster);
    DetallePedido.findAll.mockResolvedValue([]);
    const res = crearRes();

    await obtenerProductosMasVendidos(
        pedidoAdmin({ ultimos: '7' }),
        res
    );

    const { include } = DetallePedido.findAll.mock.calls[0][0];
    const fecha = include[0].where.fecha;

    expect(fecha).toBeDefined();

    const operadorFecha = Reflect.ownKeys(fecha)[0];

    expect(fecha[operadorFecha]).toBeInstanceOf(Date);
});

test('el administrador de sucursal no puede cambiar su sucursal mediante el filtro', async () => {
    Admin.findByPk.mockResolvedValue(adminDeSucursal);
    DetallePedido.findAll.mockResolvedValue([]);

    await obtenerProductosMasVendidos(
        pedidoAdmin({ sucursalId: '99' }),
        crearRes()
    );

    const { include } = DetallePedido.findAll.mock.calls[0][0];

    expect(include[0].where.sucursalId).toBe(2);
});

test('rechaza un período inválido', async () => {
    Admin.findByPk.mockResolvedValue(adminMaster);
    const res = crearRes();

    await obtenerProductosMenosVendidos(
        pedidoAdmin({ ultimos: '90' }),
        res
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
        mensaje: 'El período no es válido',
    });
});

test('el administrador de sucursal solo consulta sus productos', async () => {
    Admin.findByPk.mockResolvedValue(adminDeSucursal);
    Producto.findAll.mockResolvedValue([]);

    await obtenerProductosMenosVendidos(
        pedidoAdmin({ sucursalId: '99' }),
        crearRes()
    );

    const { include } = Producto.findAll.mock.calls[0][0];
    const includePedido = include[1].include[0];

    expect(includePedido.where.sucursalId).toBe(2);
});

test('devuelve también la categoría cuando el producto tiene una', async () => {
    Admin.findByPk.mockResolvedValue(adminDeSucursal);
    Producto.findAll.mockResolvedValue([
        fila({
            id: 5,
            nombre: 'Hamburguesa',
            imagen: 'hamburguesa.png',
            categoria: { nombre: 'Hamburguesas' },
            unidadesVendidas: '12',
        }),
    ]);

    const res = crearRes();

    await obtenerProductosMenosVendidos(pedidoAdmin(), res);

    expect(res.json).toHaveBeenCalledWith([
        {
            productoId: 5,
            nombre: 'Hamburguesa',
            imagen: 'hamburguesa.png',
            categoria: { nombre: 'Hamburguesas' },
            unidadesVendidas: '12',
        },
    ]);
});

test('rechaza un período inválido', async () => {
    Admin.findByPk.mockResolvedValue(adminMaster);
    const res = crearRes();

    await obtenerProductosMayorFacturacion(
        pedidoAdmin({ ultimos: '20' }),
        res
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
        mensaje: 'El período no es válido',
    });
});

test('el administrador de sucursal solo consulta su facturación', async () => {
    Admin.findByPk.mockResolvedValue(adminDeSucursal);
    DetallePedido.findAll.mockResolvedValue([]);

    await obtenerProductosMayorFacturacion(
        pedidoAdmin({ sucursalId: '99' }),
        crearRes()
    );

    const { include } = DetallePedido.findAll.mock.calls[0][0];

    expect(include[0].where.sucursalId).toBe(2);
});

test('devuelve la facturación junto con la categoría del producto', async () => {
    Admin.findByPk.mockResolvedValue(adminDeSucursal);
    DetallePedido.findAll.mockResolvedValue([
        {
            productoId: 3,
            Producto: {
                nombre: 'Papas grandes',
                imagen: 'papas.png',
                categoria: { nombre: 'Acompañamientos' },
            },
            get: () => '18000',
        },
    ]);

    const res = crearRes();

    await obtenerProductosMayorFacturacion(pedidoAdmin(), res);

    expect(res.json).toHaveBeenCalledWith([
        {
            productoId: 3,
            nombre: 'Papas grandes',
            imagen: 'papas.png',
            categoria: { nombre: 'Acompañamientos' },
            facturacion: '18000',
        },
    ]);
});

// =========================================================
// REPORTES DE CLIENTES
// =========================================================

describe('obtenerClientesMasPedidos', () => {
    test('responde 401 si el administrador no existe', async () => {
        Admin.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await obtenerClientesMasPedidos(pedidoAdmin(), res);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    test('rechaza una sucursal inválida para el MASTER', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);
        const res = crearRes();

        await obtenerClientesMasPedidos(pedidoAdmin({ sucursalId: 'abc' }), res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(Pedido.findAll).not.toHaveBeenCalled();
    });

    test('agrupa clientes, calcula gastos y favoritos, y ordena el ranking', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);

        Pedido.findAll.mockResolvedValue([
            {
                id: 1,
                usuarioId: 10,
                fecha: '2026-10-01T10:00:00',
                total: '1000',
                Usuario: {
                    id: 10,
                    nombre: 'Ana',
                    apellido: 'Gómez',
                    email: 'ana@test.com',
                    createdAt: '2026-01-01',
                },
                Sucursal: { nombre: 'Morón' },
            },
            {
                id: 2,
                usuarioId: 10,
                fecha: '2026-10-02T10:00:00',
                total: '2000',
                Usuario: {
                    id: 10,
                    nombre: 'Ana',
                    apellido: 'Gómez',
                    email: 'ana@test.com',
                    createdAt: '2026-01-01',
                },
                Sucursal: { nombre: 'Morón' },
            },
            {
                id: 3,
                usuarioId: 20,
                fecha: '2026-10-03T10:00:00',
                total: '5000',
                Usuario: {
                    id: 20,
                    nombre: 'Luis',
                    apellido: 'Pérez',
                    email: 'luis@test.com',
                    createdAt: '2026-02-01',
                },
                Sucursal: { nombre: 'Centro' },
            },
        ]);

        DetallePedido.findAll.mockResolvedValue([
            { pedidoId: 1, cantidad: 2, Producto: { nombre: 'Hamburguesa' } },
            { pedidoId: 2, cantidad: 3, Producto: { nombre: 'Hamburguesa' } },
            { pedidoId: 2, cantidad: 1, Producto: { nombre: 'Papas' } },
            { pedidoId: 3, cantidad: 4, Producto: { nombre: 'Pizza' } },
        ]);

        const res = crearRes();

        await obtenerClientesMasPedidos(pedidoAdmin(), res);

        expect(res.json).toHaveBeenCalledWith([
            expect.objectContaining({
                usuarioId: 10,
                nombre: 'Ana',
                cantidadPedidos: 2,
                totalGastado: 3000,
                sucursalFavorita: 'Morón',
                productoFavorito: 'Hamburguesa',
                ultimoPedido: '2026-10-02T10:00:00',
            }),
            expect.objectContaining({
                usuarioId: 20,
                nombre: 'Luis',
                cantidadPedidos: 1,
                totalGastado: 5000,
                sucursalFavorita: 'Centro',
                productoFavorito: 'Pizza',
            }),
        ]);

        expect(DetallePedido.findAll).toHaveBeenCalled();
    });

    test('el administrador de sucursal solo consulta sus pedidos', async () => {
        Admin.findByPk.mockResolvedValue(adminDeSucursal);
        Pedido.findAll.mockResolvedValue([]);

        const res = crearRes();

        await obtenerClientesMasPedidos(pedidoAdmin({ sucursalId: '99' }), res);

        expect(Pedido.findAll).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({ sucursalId: 2 }),
            }),
        );
        expect(res.json).toHaveBeenCalledWith([]);
        expect(DetallePedido.findAll).not.toHaveBeenCalled();
    });

    test('rechaza un período inválido', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);
        const res = crearRes();

        await obtenerClientesMasPedidos(pedidoAdmin({ ultimos: '15' }), res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('responde 500 si falla la consulta de pedidos', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);
        Pedido.findAll.mockRejectedValue(new Error('Base caída'));

        const res = crearRes();

        await obtenerClientesMasPedidos(pedidoAdmin(), res);

        expect(res.status).toHaveBeenCalledWith(500);
    });

    test('responde 500 si falla la consulta de productos favoritos', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);
        Pedido.findAll.mockResolvedValue([
            {
                id: 1,
                usuarioId: 10,
                fecha: '2026-10-01',
                total: 1000,
                Usuario: { id: 10, nombre: 'Ana' },
                Sucursal: { nombre: 'Morón' },
            },
        ]);
        DetallePedido.findAll.mockRejectedValue(new Error('Base caída'));

        const res = crearRes();

        await obtenerClientesMasPedidos(pedidoAdmin(), res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('obtenerClientesNuevos', () => {
    test('responde 401 si el administrador no existe', async () => {
        Admin.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await obtenerClientesNuevos(pedidoAdmin(), res);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    test('rechaza un período no permitido', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);
        const res = crearRes();

        await obtenerClientesNuevos(pedidoAdmin({ periodo: 'año' }), res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(Pedido.findAll).not.toHaveBeenCalled();
    });

    test('devuelve seis períodos mensuales y cuenta clientes por su primer pedido', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);

        const hoy = new Date();
        const inicioMesActual = new Date(
            hoy.getFullYear(),
            hoy.getMonth(),
            1,
            12,
        );
        const inicioMesAnterior = new Date(
            hoy.getFullYear(),
            hoy.getMonth() - 1,
            15,
            12,
        );

        Pedido.findAll.mockResolvedValue([
            {
                id: 1,
                usuarioId: 10,
                fecha: inicioMesActual,
                total: 1000,
                Usuario: { id: 10 },
                Sucursal: { nombre: 'Morón' },
            },
            {
                id: 2,
                usuarioId: 10,
                fecha: new Date(inicioMesActual.getTime() + 86400000),
                total: 2000,
                Usuario: { id: 10 },
                Sucursal: { nombre: 'Morón' },
            },
            {
                id: 3,
                usuarioId: 20,
                fecha: inicioMesAnterior,
                total: 3000,
                Usuario: { id: 20 },
                Sucursal: { nombre: 'Centro' },
            },
        ]);

        const res = crearRes();

        await obtenerClientesNuevos(pedidoAdmin(), res);

        const resultado = res.json.mock.calls[0][0];

        expect(resultado).toHaveLength(6);
        expect(resultado.reduce((total, item) => total + item.cantidad, 0)).toBe(2);
        expect(resultado[5].cantidad).toBe(1);
        expect(resultado[4].cantidad).toBe(1);
    });

    test('el administrador de sucursal solo consulta los pedidos de su sucursal', async () => {
        Admin.findByPk.mockResolvedValue(adminDeSucursal);
        Pedido.findAll.mockResolvedValue([]);

        await obtenerClientesNuevos(pedidoAdmin({ sucursalId: '99' }), crearRes());

        expect(Pedido.findAll).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({ sucursalId: 2 }),
            }),
        );
    });

    test('responde 500 si falla la consulta', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);
        Pedido.findAll.mockRejectedValue(new Error('Base caída'));

        const res = crearRes();

        await obtenerClientesNuevos(pedidoAdmin(), res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('obtenerClientesInactivos', () => {
    test('responde 401 si el administrador no existe', async () => {
        Admin.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await obtenerClientesInactivos(pedidoAdmin(), res);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    test.each(['0', '-1', '366', 'abc'])(
        'rechaza una cantidad de días inválida: %s',
        async (dias) => {
            Admin.findByPk.mockResolvedValue(adminMaster);
            const res = crearRes();

            await obtenerClientesInactivos(pedidoAdmin({ dias }), res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(Pedido.findAll).not.toHaveBeenCalled();
        },
    );

    test('devuelve solamente clientes que superan el límite de inactividad', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);

        const haceDias = (dias) => new Date(Date.now() - dias * 86400000);

        Pedido.findAll.mockResolvedValue([
            {
                id: 1,
                usuarioId: 10,
                fecha: haceDias(100),
                total: 1000,
                Usuario: {
                    id: 10,
                    nombre: 'Ana',
                    apellido: 'Gómez',
                    email: 'ana@test.com',
                },
                Sucursal: { nombre: 'Morón' },
            },
            {
                id: 2,
                usuarioId: 20,
                fecha: haceDias(10),
                total: 2000,
                Usuario: {
                    id: 20,
                    nombre: 'Luis',
                    apellido: 'Pérez',
                    email: 'luis@test.com',
                },
                Sucursal: { nombre: 'Centro' },
            },
        ]);

        DetallePedido.findAll.mockResolvedValue([
            { pedidoId: 1, cantidad: 2, Producto: { nombre: 'Hamburguesa' } },
        ]);

        const res = crearRes();

        await obtenerClientesInactivos(pedidoAdmin({ dias: '60' }), res);

        const resultado = res.json.mock.calls[0][0];

        expect(resultado).toHaveLength(1);
        expect(resultado[0]).toEqual(expect.objectContaining({
            usuarioId: 10,
            nombre: 'Ana',
            sucursal: 'Morón',
            productoFavorito: 'Hamburguesa',
        }));
        expect(resultado[0].diasSinPedir).toBeGreaterThanOrEqual(99);
    });

    test('devuelve una lista vacía si ningún cliente está inactivo', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);
        Pedido.findAll.mockResolvedValue([
            {
                id: 1,
                usuarioId: 10,
                fecha: new Date(),
                total: 1000,
                Usuario: { id: 10 },
                Sucursal: { nombre: 'Morón' },
            },
        ]);

        const res = crearRes();

        await obtenerClientesInactivos(pedidoAdmin(), res);

        expect(res.json).toHaveBeenCalledWith([]);
        expect(DetallePedido.findAll).not.toHaveBeenCalled();
    });

    test('responde 500 si falla la consulta', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);
        Pedido.findAll.mockRejectedValue(new Error('Base caída'));

        const res = crearRes();

        await obtenerClientesInactivos(pedidoAdmin(), res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});


// =========================================================
// REPORTES DE SUCURSALES
// =========================================================

describe('obtenerVentasPorSucursal', () => {
    test('responde 401 si el administrador no existe', async () => {
        Admin.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await obtenerVentasPorSucursal(pedidoAdmin(), res);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    test('rechaza un valor de mes inválido', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);
        const res = crearRes();

        await obtenerVentasPorSucursal(pedidoAdmin({ mes: 'enero' }), res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(Pedido.findAll).not.toHaveBeenCalled();
    });

    test('calcula ventas, meta y cantidad de pedidos del mes anterior', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);

        const hoy = new Date();
        const mesAnterior = new Date(
            hoy.getFullYear(),
            hoy.getMonth() - 1,
            10,
            12,
        );
        const mesAnteriorAlAnterior = new Date(
            hoy.getFullYear(),
            hoy.getMonth() - 2,
            10,
            12,
        );

        Pedido.findAll.mockResolvedValue([
            {
                fecha: mesAnterior,
                total: '15000',
                Sucursal: { id: 2, nombre: 'Morón' },
            },
            {
                fecha: mesAnterior,
                total: '5000',
                Sucursal: { id: 2, nombre: 'Morón' },
            },
            {
                fecha: mesAnteriorAlAnterior,
                total: '10000',
                Sucursal: { id: 2, nombre: 'Morón' },
            },
        ]);

        const res = crearRes();

        await obtenerVentasPorSucursal(pedidoAdmin(), res);

        const resultado = res.json.mock.calls[0][0];

        expect(resultado.sucursales).toEqual([
            {
                sucursalId: 2,
                nombre: 'Morón',
                ventas: 20000,
                meta: 10000,
                pedidos: 2,
            },
        ]);
        expect(resultado.diaActual).toBeNull();
        expect(resultado.diasDelMes).toBeGreaterThanOrEqual(28);
    });

    test('el mes actual filtra la sucursal del administrador y devuelve el día actual', async () => {
        Admin.findByPk.mockResolvedValue(adminDeSucursal);
        Pedido.findAll.mockResolvedValue([]);

        const res = crearRes();

        await obtenerVentasPorSucursal(pedidoAdmin({ mes: 'actual' }), res);

        const consulta = Pedido.findAll.mock.calls[0][0];

        expect(consulta.where.sucursalId).toBe(2);
        expect(res.json.mock.calls[0][0].diaActual).toBe(new Date().getDate());
    });

    test('responde 500 si falla la consulta', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);
        Pedido.findAll.mockRejectedValue(new Error('Base caída'));

        const res = crearRes();

        await obtenerVentasPorSucursal(pedidoAdmin(), res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('obtenerProductosPorSucursal', () => {
    test('responde 401 si el administrador no existe', async () => {
        Admin.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await obtenerProductosPorSucursal(pedidoAdmin(), res);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    test('agrupa productos por sucursal y ordena por unidades vendidas', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);

        DetallePedido.findAll.mockResolvedValue([
            {
                cantidad: '2',
                Pedido: { Sucursal: { id: 2, nombre: 'Morón' } },
                Producto: {
                    id: 1,
                    nombre: 'Hamburguesa',
                    categoria: { nombre: 'Hamburguesas' },
                },
            },
            {
                cantidad: '5',
                Pedido: { Sucursal: { id: 2, nombre: 'Morón' } },
                Producto: {
                    id: 2,
                    nombre: 'Papas',
                    categoria: { nombre: 'Acompañamientos' },
                },
            },
            {
                cantidad: '3',
                Pedido: { Sucursal: { id: 2, nombre: 'Morón' } },
                Producto: {
                    id: 1,
                    nombre: 'Hamburguesa',
                    categoria: { nombre: 'Hamburguesas' },
                },
            },
            {
                cantidad: '4',
                Pedido: { Sucursal: { id: 1, nombre: 'Centro' } },
                Producto: {
                    id: 3,
                    nombre: 'Gaseosa',
                    categoria: null,
                },
            },
            {
                cantidad: '10',
                Pedido: null,
                Producto: { id: 4, nombre: 'Producto sin pedido' },
            },
        ]);

        const res = crearRes();

        await obtenerProductosPorSucursal(pedidoAdmin(), res);

        expect(res.json).toHaveBeenCalledWith([
            {
                sucursalId: 1,
                nombre: 'Centro',
                productos: [
                    {
                        productoId: 3,
                        nombre: 'Gaseosa',
                        categoria: null,
                        unidades: 4,
                    },
                ],
            },
            {
                sucursalId: 2,
                nombre: 'Morón',
                productos: [
                    {
                        productoId: 1,
                        nombre: 'Hamburguesa',
                        categoria: 'Hamburguesas',
                        unidades: 5,
                    },
                    {
                        productoId: 2,
                        nombre: 'Papas',
                        categoria: 'Acompañamientos',
                        unidades: 5,
                    },
                    
                ],
            },
        ]);
    });

    test('el administrador de sucursal solo consulta sus productos', async () => {
        Admin.findByPk.mockResolvedValue(adminDeSucursal);
        DetallePedido.findAll.mockResolvedValue([]);

        await obtenerProductosPorSucursal(pedidoAdmin(), crearRes());

        const { include } = DetallePedido.findAll.mock.calls[0][0];

        expect(include[0].where.sucursalId).toBe(2);
    });

    test('rechaza un período inválido', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);
        const res = crearRes();

        await obtenerProductosPorSucursal(pedidoAdmin({ ultimos: '15' }), res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(DetallePedido.findAll).not.toHaveBeenCalled();
    });

    test('responde 500 si falla la consulta', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);
        DetallePedido.findAll.mockRejectedValue(new Error('Base caída'));

        const res = crearRes();

        await obtenerProductosPorSucursal(pedidoAdmin(), res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('obtenerPedidosAtendidosPorSucursal', () => {
    test('responde 401 si el administrador no existe', async () => {
        Admin.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await obtenerPedidosAtendidosPorSucursal(pedidoAdmin(), res);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    test('calcula entregas, promedio, demora y porcentaje a tiempo', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);

        const ahora = Date.now();

        historialDeTiemposPedido.findAll.mockResolvedValue([
            {
                fecha: new Date(ahora),
                Pedido: {
                    fecha: new Date(ahora - 30 * 60000),
                    minutosEstimados: 40,
                    Sucursal: { id: 2, nombre: 'Morón' },
                },
            },
            {
                fecha: new Date(ahora),
                Pedido: {
                    fecha: new Date(ahora - 50 * 60000),
                    minutosEstimados: 40,
                    Sucursal: { id: 2, nombre: 'Morón' },
                },
            },
            {
                fecha: new Date(ahora),
                Pedido: {
                    fecha: new Date(ahora - 20 * 60000),
                    minutosEstimados: null,
                    Sucursal: { id: 2, nombre: 'Morón' },
                },
            },
        ]);

        const res = crearRes();

        await obtenerPedidosAtendidosPorSucursal(pedidoAdmin(), res);

        expect(res.json).toHaveBeenCalledWith([
            {
                sucursalId: 2,
                nombre: 'Morón',
                entregados: 3,
                promedioMinutos: 33,
                conEstimado: 2,
                demoraPromedioMinutos: 0,
                porcentajeATiempo: 50,
            },
        ]);
    });

    test('ignora duraciones negativas o inválidas para los promedios', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);

        historialDeTiemposPedido.findAll.mockResolvedValue([
            {
                fecha: new Date('2026-10-01T10:00:00'),
                Pedido: {
                    fecha: new Date('2026-10-01T11:00:00'),
                    minutosEstimados: 30,
                    Sucursal: { id: 2, nombre: 'Morón' },
                },
            },
        ]);

        const res = crearRes();

        await obtenerPedidosAtendidosPorSucursal(pedidoAdmin(), res);

        expect(res.json).toHaveBeenCalledWith([
            {
                sucursalId: 2,
                nombre: 'Morón',
                entregados: 1,
                promedioMinutos: null,
                conEstimado: 0,
                demoraPromedioMinutos: null,
                porcentajeATiempo: null,
            },
        ]);
    });

    test('el administrador de sucursal solo consulta sus entregas', async () => {
        Admin.findByPk.mockResolvedValue(adminDeSucursal);
        historialDeTiemposPedido.findAll.mockResolvedValue([]);

        await obtenerPedidosAtendidosPorSucursal(pedidoAdmin(), crearRes());

        const { include } = historialDeTiemposPedido.findAll.mock.calls[0][0];

        expect(include[0].where.sucursalId).toBe(2);
    });

    test('responde 500 si falla la consulta', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);
        historialDeTiemposPedido.findAll.mockRejectedValue(new Error('Base caída'));

        const res = crearRes();

        await obtenerPedidosAtendidosPorSucursal(pedidoAdmin(), res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

// =========================================================
// REPORTES DE PROMOCIONES
// =========================================================

describe('obtenerPromocionesMasUtilizadas', () => {
    test('responde 401 si el administrador no existe', async () => {
        Admin.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await obtenerPromocionesMasUtilizadas(pedidoAdmin(), res);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    test('rechaza una sucursal inválida para el MASTER', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);
        const res = crearRes();

        await obtenerPromocionesMasUtilizadas(
            pedidoAdmin({ sucursalId: 'abc' }),
            res,
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(DetallePedido.findAll).not.toHaveBeenCalled();
    });

    test('agrupa los usos por pedido y calcula unidades, facturación y ahorro', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);

        DetallePedido.findAll.mockResolvedValue([
            {
                pedidoId: 1,
                cantidad: 2,
                precio: 80,
                precioLista: 100,
                promocion: {
                    id: 5,
                    titulo: 'Combo especial',
                    destacado: true,
                    tipo: 'porcentaje',
                    activo: true,
                },
                Pedido: { fecha: new Date(2026, 10, 15, 12) },
            },
            {
                pedidoId: 1,
                cantidad: 1,
                precio: 150,
                precioLista: 200,
                promocion: {
                    id: 5,
                    titulo: 'Combo especial',
                    destacado: true,
                    tipo: 'porcentaje',
                    activo: true,
                },
                Pedido: { fecha: new Date(2026, 10, 15, 12) },
            },
            {
                pedidoId: 2,
                cantidad: 1,
                precio: 50,
                precioLista: 50,
                promocion: {
                    id: 8,
                    titulo: 'Descuento bebida',
                    destacado: false,
                    tipo: 'fijo',
                    activo: false,
                },
                Pedido: { fecha: new Date(2026, 10, 16, 12) },
            },
        ]);

        const res = crearRes();

        await obtenerPromocionesMasUtilizadas(pedidoAdmin(), res);

        expect(res.json).toHaveBeenCalledWith([
            {
                promocionId: 5,
                titulo: 'Combo especial',
                destacado: true,
                tipo: 'porcentaje',
                activa: true,
                veces: 1,
                unidades: 3,
                facturacion: 310,
                ahorro: 90,
                diaMasUsado: 'domingos',
            },
            {
                promocionId: 8,
                titulo: 'Descuento bebida',
                destacado: false,
                tipo: 'fijo',
                activa: false,
                veces: 1,
                unidades: 1,
                facturacion: 50,
                ahorro: 0,
                diaMasUsado: 'lunes',
            },
        ]);
    });

    test('devuelve una lista vacía si no hay líneas con promociones', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);
        DetallePedido.findAll.mockResolvedValue([]);

        const res = crearRes();

        await obtenerPromocionesMasUtilizadas(pedidoAdmin(), res);

        expect(res.json).toHaveBeenCalledWith([]);
    });

    test('el administrador de sucursal solo consulta sus promociones', async () => {
        Admin.findByPk.mockResolvedValue(adminDeSucursal);
        DetallePedido.findAll.mockResolvedValue([]);

        await obtenerPromocionesMasUtilizadas(
            pedidoAdmin({ sucursalId: '99' }),
            crearRes(),
        );

        const consulta = DetallePedido.findAll.mock.calls[0][0];
        const includePedido = consulta.include[0];

        expect(includePedido.where.sucursalId).toBe(2);
    });

    test('rechaza un período inválido', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);
        const res = crearRes();

        await obtenerPromocionesMasUtilizadas(
            pedidoAdmin({ ultimos: '15' }),
            res,
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(DetallePedido.findAll).not.toHaveBeenCalled();
    });

    test('responde 500 si falla la consulta', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);
        DetallePedido.findAll.mockRejectedValue(new Error('Base caída'));

        const res = crearRes();

        await obtenerPromocionesMasUtilizadas(pedidoAdmin(), res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('obtenerImpactoPromociones', () => {
    test('responde 401 si el administrador no existe', async () => {
        Admin.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await obtenerImpactoPromociones(pedidoAdmin(), res);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    test('rechaza una sucursal inválida para el MASTER', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);
        const res = crearRes();

        await obtenerImpactoPromociones(
            pedidoAdmin({ sucursalId: 'abc' }),
            res,
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(DetallePedido.findAll).not.toHaveBeenCalled();
    });

    test('devuelve valores vacíos si todavía no hay promociones utilizadas', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);
        DetallePedido.findAll.mockResolvedValue([]);

        const res = crearRes();

        await obtenerImpactoPromociones(pedidoAdmin(), res);

        expect(res.json).toHaveBeenCalledWith({
            desde: null,
            pedidosConPromo: 0,
            pedidosSinPromo: 0,
            ventasConPromo: 0,
            ventasSinPromo: 0,
            ticketConPromo: null,
            ticketSinPromo: null,
            ahorroTotal: 0,
        });

        expect(Pedido.findAll).not.toHaveBeenCalled();
    });

    test('compara ventas con y sin promoción y calcula los tickets promedio', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);

        const fechaPromo = new Date(2026, 9, 10, 12);

        DetallePedido.findAll.mockResolvedValue([
            {
                pedidoId: 1,
                cantidad: 2,
                precio: 80,
                precioLista: 100,
                Pedido: { fecha: fechaPromo },
            },
            {
                pedidoId: 1,
                cantidad: 1,
                precio: 50,
                precioLista: 70,
                Pedido: { fecha: fechaPromo },
            },
        ]);

        Pedido.findAll.mockResolvedValue([
            { id: 1, total: '210' },
            { id: 2, total: '300' },
            { id: 3, total: '500' },
        ]);

        const res = crearRes();

        await obtenerImpactoPromociones(pedidoAdmin(), res);

        const consulta = Pedido.findAll.mock.calls[0][0];
        const operadorFecha = Reflect.ownKeys(consulta.where.fecha)[0];

        expect(consulta.where.fecha[operadorFecha]).toEqual(fechaPromo);

        expect(res.json).toHaveBeenCalledWith({
            desde: fechaPromo,
            pedidosConPromo: 1,
            pedidosSinPromo: 2,
            ventasConPromo: 210,
            ventasSinPromo: 800,
            ticketConPromo: 210,
            ticketSinPromo: 400,
            ahorroTotal: 60,
        });
    });

    test('el administrador de sucursal limita la consulta a su sucursal', async () => {
        Admin.findByPk.mockResolvedValue(adminDeSucursal);
        DetallePedido.findAll.mockResolvedValue([
            {
                pedidoId: 1,
                cantidad: 1,
                precio: 80,
                precioLista: 100,
                Pedido: { fecha: new Date(2026, 9, 10) },
            },
        ]);
        Pedido.findAll.mockResolvedValue([]);

        await obtenerImpactoPromociones(
            pedidoAdmin({ sucursalId: '99' }),
            crearRes(),
        );

        const consultaLineas = DetallePedido.findAll.mock.calls[0][0];
        const consultaPedidos = Pedido.findAll.mock.calls[0][0];

        expect(consultaLineas.include[0].where.sucursalId).toBe(2);
        expect(consultaPedidos.where.sucursalId).toBe(2);
    });

    test('responde 500 si falla la consulta de líneas con promociones', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);
        DetallePedido.findAll.mockRejectedValue(new Error('Base caída'));

        const res = crearRes();

        await obtenerImpactoPromociones(pedidoAdmin(), res);

        expect(res.status).toHaveBeenCalledWith(500);
    });

    test('responde 500 si falla la consulta de pedidos', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);
        DetallePedido.findAll.mockResolvedValue([
            {
                pedidoId: 1,
                cantidad: 1,
                precio: 80,
                precioLista: 100,
                Pedido: { fecha: new Date(2026, 9, 10) },
            },
        ]);
        Pedido.findAll.mockRejectedValue(new Error('Base caída'));

        const res = crearRes();

        await obtenerImpactoPromociones(pedidoAdmin(), res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});