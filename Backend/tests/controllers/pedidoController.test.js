// Modelos falsos. La transacción también es falsa: solo registra si se hizo commit o rollback.
jest.mock('../../src/models', () => {
    const t = { commit: jest.fn(), rollback: jest.fn(), LOCK: { UPDATE: 'UPDATE' } };
    return {
        Pedido: { create: jest.fn(), findAll: jest.fn(), findByPk: jest.fn(), count: jest.fn().mockResolvedValue(0) },
        DetallePedido: { create: jest.fn() },
        Producto: { findByPk: jest.fn() },
        Usuario: { findByPk: jest.fn() },
        Direccion: { findOne: jest.fn() },
        Sucursal: { findByPk: jest.fn() },
        RecetaInsumo: { findAll: jest.fn() },
        ComboGrupo: { findAll: jest.fn() },
        Insumo: { findAll: jest.fn() },
        ProductoTamanio: {},
        StockSucursal: { findOne: jest.fn() },
        MovimientoStock: { create: jest.fn() },
        historialDeTiemposPedido: { create: jest.fn(), findAll: jest.fn() },
        sequelize: { transaction: jest.fn().mockResolvedValue(t) },
        __t: t,
    };
});

jest.mock('../../src/notifications/handlers/stockHandlers', () => ({
    notificarStockBajo: jest.fn(),
}));
jest.mock('../../src/notifications/adminRefresco', () => ({
    emitirRefrescoAdmin: jest.fn(),
}));

const models = require('../../src/models');
const { notificarStockBajo } = require('../../src/notifications/handlers/stockHandlers');
const { emitirRefrescoAdmin } = require('../../src/notifications/adminRefresco');
const {
    crearPedido,
    obtenerPedidos,
    obtenerPedidosPorUsuario,
    obtenerPedidoId,
} = require('../../src/controllers/pedidoController');

const {
    Pedido, DetallePedido, Producto, Usuario, Sucursal, RecetaInsumo, StockSucursal, Direccion, ComboGrupo, MovimientoStock,
} = models;
const t = models.__t;

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

// Un registro de stock falso que se actualiza de verdad cuando el controlador lo descuenta
function crearStock(cantidad, stockMinimo = null) {
    const stock = {
        cantidad,
        stockMinimo,
        update: jest.fn(({ cantidad: nueva }) => {
            stock.cantidad = nueva;
        }),
    };
    return stock;
}

function pedidoCon(productos) {
    return { body: { usuarioId: 1, direccionId: 3, sucursalId: 2, productos } };
}

// La sucursal y la dirección están en el mismo lugar: siempre dentro de la zona de entrega
const sucursalMoron = { id: 2, nombre: 'Morón', activa: true, latitud: -34.65, longitud: -58.62, radioEntregaKm: 5 };
const direccionCercana = { id: 3, usuarioId: 1, latitud: -34.65, longitud: -58.62 };

let pedidoCreado;
let stocks;

// Escenario base: "Clásica" a $5000, con pan (fijo), cebolla (removible)
// y cheddar (removible y agregable, $500 cada extra). Hay 50 de cada insumo en la sucursal.
beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});

    Usuario.findByPk.mockResolvedValue({ id: 1 });
    Sucursal.findByPk.mockResolvedValue(sucursalMoron);
    Direccion.findOne.mockResolvedValue(direccionCercana);

    pedidoCreado = { id: 100, update: jest.fn() };
    Pedido.create.mockResolvedValue(pedidoCreado);

    Producto.findByPk.mockResolvedValue({ id: 10, nombre: 'Clásica', precio: '5000', disponible: true, tamanios: [] });

    RecetaInsumo.findAll.mockResolvedValue([
        { insumoId: 1, cantidadBase: '1', esRemovible: false, esAgregable: false, Insumo: { nombre: 'Pan', precioComercial: null } },
        { insumoId: 2, cantidadBase: '1', esRemovible: true, esAgregable: false, Insumo: { nombre: 'Cebolla', precioComercial: '0' } },
        { insumoId: 3, cantidadBase: '1', esRemovible: true, esAgregable: true, Insumo: { nombre: 'Cheddar', precioComercial: '500' } },
    ]);

    ComboGrupo.findAll.mockResolvedValue([]);

    stocks = { 1: crearStock(50), 2: crearStock(50), 3: crearStock(50) };
    StockSucursal.findOne.mockImplementation(({ where }) => Promise.resolve(stocks[where.insumoId] ?? null));
});

describe('crearPedido', () => {
    describe('pedido exitoso', () => {
        test('calcula el precio en el backend, con los extras', async () => {
            const res = crearRes();

            await crearPedido(pedidoCon([{
                productoId: 10,
                cantidad: 2,
                personalizaciones: [{ insumoId: 2, cantidad: 0 }, { insumoId: 3, cantidad: 2 }],
            }]), res);

            expect(DetallePedido.create).toHaveBeenCalledWith(
                expect.objectContaining({ productoId: 10, cantidad: 2, precio: 5500 }),
                expect.anything()
            );
            expect(pedidoCreado.update).toHaveBeenCalledWith({ total: 11000 }, expect.anything());
            expect(t.commit).toHaveBeenCalled();
            expect(emitirRefrescoAdmin).toHaveBeenCalledWith({
                dominio: 'stock',
                accion: 'actualizado',
                sucursalId: 2,
                recursos: { pedidoId: 100 },
            });
            expect(emitirRefrescoAdmin).toHaveBeenCalledWith({
                dominio: 'pedidos',
                accion: 'creado',
                sucursalId: 2,
                recursos: { pedidoId: 100 },
            });
            expect(emitirRefrescoAdmin).toHaveBeenCalledTimes(2);
            expect(emitirRefrescoAdmin.mock.invocationCallOrder[0])
                .toBeLessThan(emitirRefrescoAdmin.mock.invocationCallOrder[1]);
            expect(res.status).toHaveBeenCalledWith(201);
        });

        test('emite el refresco de pedidos después del commit', async () => {
            emitirRefrescoAdmin.mockImplementation(() => {
                expect(t.commit).toHaveBeenCalled();
                return Promise.resolve(true);
            });

            await crearPedido(pedidoCon([{ productoId: 10, cantidad: 1 }]), crearRes());
        });

        test('un refresco no emitido no revierte el pedido', async () => {
            emitirRefrescoAdmin.mockResolvedValue(false);
            const res = crearRes();

            await crearPedido(pedidoCon([{ productoId: 10, cantidad: 1 }]), res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(t.rollback).not.toHaveBeenCalled();
        });

        test('descuenta el stock según la personalización', async () => {
            await crearPedido(pedidoCon([{
                productoId: 10,
                cantidad: 2,
                personalizaciones: [{ insumoId: 2, cantidad: 0 }, { insumoId: 3, cantidad: 2 }],
            }]), crearRes());

            expect(stocks[1].cantidad).toBe(48);
            expect(stocks[2].cantidad).toBe(50);
            expect(stocks[3].cantidad).toBe(46);
        });

        test('notifica stock bajo solo cuando la venta cruza el mínimo', async () => {
            stocks[1] = crearStock(50, 48);
            models.Insumo.findAll.mockResolvedValue([{ id: 1, nombre: 'Pan' }]);

            await crearPedido(pedidoCon([{ productoId: 10, cantidad: 2 }]), crearRes());

            expect(notificarStockBajo).toHaveBeenCalledWith({
                sucursalId: 2,
                insumoId: 1,
                cantidad: 48,
                stockMinimo: 48,
                sucursalNombre: 'Morón',
                insumoNombre: 'Pan',
            });
        });

        test('no repite la alerta si el stock ya estaba bajo el mínimo', async () => {
            stocks[1] = crearStock(48, 48);

            await crearPedido(pedidoCon([{ productoId: 10, cantidad: 1 }]), crearRes());

            expect(notificarStockBajo).not.toHaveBeenCalled();
        });

        test('registra cada descuento como venta del pedido en el historial de stock', async () => {
            await crearPedido(pedidoCon([{ productoId: 10, cantidad: 2 }]), crearRes());

            expect(MovimientoStock.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    tipo: 'venta', insumoId: 1, sucursalId: 2, cantidad: 2,
                    cantidadAnterior: 50, cantidadNueva: 48, pedidoId: 100,
                }),
                expect.anything()
            );
        });

        test('registra el estado inicial en la línea de tiempo del pedido', async () => {
            await crearPedido(pedidoCon([{ productoId: 10, cantidad: 1 }]), crearRes());

            expect(models.historialDeTiemposPedido.create).toHaveBeenCalledWith(
                expect.objectContaining({ pedidoId: 100, estadoAnterior: null }),
                expect.anything()
            );
        });

        test('sin personalizar, cobra el precio base', async () => {
            await crearPedido(pedidoCon([{ productoId: 10, cantidad: 1 }]), crearRes());

            expect(DetallePedido.create).toHaveBeenCalledWith(
                expect.objectContaining({ precio: 5000 }),
                expect.anything()
            );
        });
    });

    describe('datos que no existen', () => {
        test('responde 404 si el usuario no existe', async () => {
            Usuario.findByPk.mockResolvedValue(null);
            const res = crearRes();

            await crearPedido(pedidoCon([{ productoId: 10, cantidad: 1 }]), res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(t.rollback).toHaveBeenCalled();
        });

        test('responde 404 si la sucursal no existe', async () => {
            Sucursal.findByPk.mockResolvedValue(null);
            const res = crearRes();

            await crearPedido(pedidoCon([{ productoId: 10, cantidad: 1 }]), res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(t.rollback).toHaveBeenCalled();
        });

        test('responde 404 si el producto no existe', async () => {
            Producto.findByPk.mockResolvedValue(null);
            const res = crearRes();

            await crearPedido(pedidoCon([{ productoId: 99, cantidad: 1 }]), res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(t.rollback).toHaveBeenCalled();
        });

        test('busca la dirección del propio usuario', async () => {
            await crearPedido(pedidoCon([{ productoId: 10, cantidad: 1 }]), crearRes());

            expect(Direccion.findOne).toHaveBeenCalledWith({ where: { id: 3, usuarioId: 1 } });
        });

        test('rechaza una dirección que no es del usuario', async () => {
            Direccion.findOne.mockResolvedValue(null);
            const res = crearRes();

            await crearPedido(pedidoCon([{ productoId: 10, cantidad: 1 }]), res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ mensaje: 'Dirección no encontrada' });
            expect(t.rollback).toHaveBeenCalled();
            expect(Pedido.create).not.toHaveBeenCalled();
        });
    });

    describe('sucursal y zona de entrega', () => {
        test('rechaza una sucursal desactivada', async () => {
            Sucursal.findByPk.mockResolvedValue({ ...sucursalMoron, activa: false });
            const res = crearRes();

            await crearPedido(pedidoCon([{ productoId: 10, cantidad: 1 }]), res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ mensaje: 'Morón no está tomando pedidos en este momento' });
            expect(Pedido.create).not.toHaveBeenCalled();
        });

        test('rechaza una dirección sin ubicación en el mapa', async () => {
            Direccion.findOne.mockResolvedValue({ id: 3, usuarioId: 1, latitud: null, longitud: null });
            const res = crearRes();

            await crearPedido(pedidoCon([{ productoId: 10, cantidad: 1 }]), res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                mensaje: 'Tu dirección no tiene ubicación en el mapa. Editala para completarla.',
            });
        });

        test('rechaza una dirección fuera del radio de entrega', async () => {
            Direccion.findOne.mockResolvedValue({ id: 3, usuarioId: 1, latitud: -38.0, longitud: -57.55 });
            const res = crearRes();

            await crearPedido(pedidoCon([{ productoId: 10, cantidad: 1 }]), res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ mensaje: 'Tu dirección está fuera de la zona de entrega de Morón' });
            expect(t.rollback).toHaveBeenCalled();
        });
    });

    describe('reglas del producto y la receta', () => {
        test('rechaza un producto no disponible', async () => {
            Producto.findByPk.mockResolvedValue({ id: 10, nombre: 'Clásica', precio: '5000', disponible: false, tamanios: [] });
            const res = crearRes();

            await crearPedido(pedidoCon([{ productoId: 10, cantidad: 1 }]), res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ mensaje: 'El producto Clásica no está disponible' });
        });

        test('rechaza un insumo que no está en la receta', async () => {
            const res = crearRes();

            await crearPedido(pedidoCon([{
                productoId: 10, cantidad: 1, personalizaciones: [{ insumoId: 99, cantidad: 1 }],
            }]), res);

            expect(res.json).toHaveBeenCalledWith({ mensaje: 'El insumo 99 no pertenece a la receta de Clásica' });
        });

        test('no permite quitar un insumo que no es removible', async () => {
            const res = crearRes();

            await crearPedido(pedidoCon([{
                productoId: 10, cantidad: 1, personalizaciones: [{ insumoId: 1, cantidad: 0 }],
            }]), res);

            expect(res.json).toHaveBeenCalledWith({ mensaje: 'El insumo Pan no se puede sacar de Clásica' });
        });

        test('no permite aumentar un insumo que no es agregable', async () => {
            const res = crearRes();

            await crearPedido(pedidoCon([{
                productoId: 10, cantidad: 1, personalizaciones: [{ insumoId: 2, cantidad: 2 }],
            }]), res);

            expect(res.json).toHaveBeenCalledWith({ mensaje: 'El insumo Cebolla no se puede aumentar en Clásica' });
        });

        test('no permite más de 1 extra de un ingrediente', async () => {
            const res = crearRes();

            await crearPedido(pedidoCon([{
                productoId: 10, cantidad: 1, personalizaciones: [{ insumoId: 3, cantidad: 5 }],
            }]), res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ mensaje: 'Solo se puede agregar 1 porción extra de Cheddar' });
        });
    });

    describe('stock de la sucursal', () => {
        test('rechaza si la sucursal no tiene stock cargado de un insumo', async () => {
            delete stocks[1];
            const res = crearRes();

            await crearPedido(pedidoCon([{ productoId: 10, cantidad: 1 }]), res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                mensaje: 'No hay stock cargado para un insumo de Clásica en esta sucursal',
            });
        });

        test('rechaza si no alcanza el stock, y no guarda nada', async () => {
            stocks[1] = crearStock(1);
            const res = crearRes();

            await crearPedido(pedidoCon([{ productoId: 10, cantidad: 2 }]), res);

            expect(res.json).toHaveBeenCalledWith({
                mensaje: 'Stock insuficiente para preparar Clásica en esta sucursal',
            });
            expect(t.rollback).toHaveBeenCalled();
            expect(t.commit).not.toHaveBeenCalled();
            expect(DetallePedido.create).not.toHaveBeenCalled();
        });
    });

    test('si falla la base de datos, deshace todo y responde 500', async () => {
        Usuario.findByPk.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await crearPedido(pedidoCon([{ productoId: 10, cantidad: 1 }]), res);

        expect(t.rollback).toHaveBeenCalled();
        expect(emitirRefrescoAdmin).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('obtenerPedidos', () => {
    test('devuelve todos los pedidos', async () => {
        const pedidos = [{ id: 1 }, { id: 2 }];
        Pedido.findAll.mockResolvedValue(pedidos);
        const res = crearRes();

        await obtenerPedidos({}, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(pedidos);
    });

    test('responde 500 si falla la base de datos', async () => {
        Pedido.findAll.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await obtenerPedidos({}, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('obtenerPedidosPorUsuario', () => {
    test('devuelve los pedidos del usuario, del más nuevo al más viejo', async () => {
        Pedido.findAll.mockResolvedValue([{ id: 5 }]);
        const res = crearRes();

        await obtenerPedidosPorUsuario({ params: { usuarioId: '1' } }, res);

        expect(Pedido.findAll).toHaveBeenCalledWith(
            expect.objectContaining({ where: { usuarioId: '1' } })
        );
        // Del más nuevo al más viejo (el segundo criterio ordena el historial de cada pedido)
        expect(Pedido.findAll.mock.calls[0][0].order[0]).toEqual(['fecha', 'DESC']);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('responde 500 si falla la base de datos', async () => {
        Pedido.findAll.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await obtenerPedidosPorUsuario({ params: { usuarioId: '1' } }, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('obtenerPedidoId', () => {
    test('devuelve el pedido', async () => {
        const pedido = { id: 7 };
        Pedido.findByPk.mockResolvedValue(pedido);
        const res = crearRes();

        await obtenerPedidoId({ params: { id: '7' } }, res);

        expect(res.json).toHaveBeenCalledWith(pedido);
    });

    test('responde 404 si el pedido no existe', async () => {
        Pedido.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await obtenerPedidoId({ params: { id: '99' } }, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('responde 500 si falla la base de datos', async () => {
        Pedido.findByPk.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await obtenerPedidoId({ params: { id: '7' } }, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});