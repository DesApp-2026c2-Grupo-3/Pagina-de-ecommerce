// Modelos falsos. La transacción también es falsa: solo registra si se hizo commit o rollback.
jest.mock('../src/models', () => {
    const t = { commit: jest.fn(), rollback: jest.fn(), LOCK: { UPDATE: 'UPDATE' } };
    return {
        Pedido: { create: jest.fn(), findAll: jest.fn(), findByPk: jest.fn() },
        DetallePedido: { create: jest.fn() },
        Producto: { findByPk: jest.fn() },
        Usuario: { findByPk: jest.fn() },
        Direccion: { findOne: jest.fn() },
        Sucursal: { findByPk: jest.fn() },
        RecetaInsumo: { findAll: jest.fn() },
        ComboGrupo: { findAll: jest.fn() },
        Insumo: {},
        StockSucursal: { findOne: jest.fn() },
        sequelize: { transaction: jest.fn().mockResolvedValue(t) },
        __t: t, // para poder revisar la transacción desde los tests
    };
});

const models = require('../src/models');
const {
    crearPedido,
    obtenerPedidos,
    obtenerPedidosPorUsuario,
    obtenerPedidoId,
} = require('../src/controllers/pedidoController');

const {
    Pedido, DetallePedido, Producto, Usuario, Sucursal, RecetaInsumo, StockSucursal, Direccion, ComboGrupo,
} = models;
const t = models.__t;

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

// Un registro de stock falso que se actualiza de verdad cuando el controlador lo descuenta
function crearStock(cantidad) {
    const stock = {
        cantidad,
        update: jest.fn(({ cantidad: nueva }) => {
            stock.cantidad = nueva;
        }),
    };
    return stock;
}

function pedidoCon(productos) {
    return { body: { usuarioId: 1, direccionId: 3, sucursalId: 2, productos } };
}

let pedidoCreado;
let stocks;

// Escenario base: "Clásica" a $5000, con pan (fijo), cebolla (removible)
// y cheddar (removible y agregable, $500 cada extra). Hay 50 de cada insumo en la sucursal.
beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});

    Usuario.findByPk.mockResolvedValue({ id: 1 });
    Sucursal.findByPk.mockResolvedValue({ id: 2 });
    Direccion.findOne.mockResolvedValue({ id: 3, usuarioId: 1 });

    pedidoCreado = { id: 100, update: jest.fn() };
    Pedido.create.mockResolvedValue(pedidoCreado);

    Producto.findByPk.mockResolvedValue({ id: 10, nombre: 'Clásica', precio: '5000', disponible: true });

    RecetaInsumo.findAll.mockResolvedValue([
        { insumoId: 1, cantidadBase: '1', esRemovible: false, esAgregable: false, Insumo: { nombre: 'Pan', precioComercial: null } },
        { insumoId: 2, cantidadBase: '1', esRemovible: true, esAgregable: false, Insumo: { nombre: 'Cebolla', precioComercial: '0' } },
        { insumoId: 3, cantidadBase: '1', esRemovible: true, esAgregable: true, Insumo: { nombre: 'Cheddar', precioComercial: '500' } },
    ]);

    ComboGrupo.findAll.mockResolvedValue([]); // un producto común no es un combo

    stocks = { 1: crearStock(50), 2: crearStock(50), 3: crearStock(50) };
    StockSucursal.findOne.mockImplementation(({ where }) => Promise.resolve(stocks[where.insumoId] ?? null));
});

describe('crearPedido', () => {
    describe('pedido exitoso', () => {
        test('calcula el precio en el backend, con los extras', async () => {
            const res = crearRes();

            // 2 Clásicas, sin cebolla y con doble cheddar
            await crearPedido(pedidoCon([{
                productoId: 10,
                cantidad: 2,
                personalizaciones: [{ insumoId: 2, cantidad: 0 }, { insumoId: 3, cantidad: 2 }],
            }]), res);

            // $5000 + 1 cheddar extra ($500) = $5500 por unidad
            expect(DetallePedido.create).toHaveBeenCalledWith(
                expect.objectContaining({ productoId: 10, cantidad: 2, precio: 5500 }),
                expect.anything()
            );
            // 2 x $5500 = $11000
            expect(pedidoCreado.update).toHaveBeenCalledWith({ total: 11000 }, expect.anything());
            expect(t.commit).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
        });

        test('descuenta el stock según la personalización', async () => {
            await crearPedido(pedidoCon([{
                productoId: 10,
                cantidad: 2,
                personalizaciones: [{ insumoId: 2, cantidad: 0 }, { insumoId: 3, cantidad: 2 }],
            }]), crearRes());

            expect(stocks[1].cantidad).toBe(48); // pan: 1 x 2 unidades
            expect(stocks[2].cantidad).toBe(50); // cebolla: se quitó, no se descuenta
            expect(stocks[3].cantidad).toBe(46); // cheddar: 2 x 2 unidades
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

    describe('reglas del producto y la receta', () => {
        test('rechaza un producto no disponible', async () => {
            Producto.findByPk.mockResolvedValue({ id: 10, nombre: 'Clásica', precio: '5000', disponible: false });
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
            stocks[1] = crearStock(1); // queda 1 pan, y se piden 2 hamburguesas
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
            expect.objectContaining({ where: { usuarioId: '1' }, order: [['fecha', 'DESC']] })
        );
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

    test('si falla la base de datos, deshace todo y responde 500', async () => {
        Usuario.findByPk.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await crearPedido(pedidoCon([{ productoId: 10, cantidad: 1 }]), res);

        expect(t.rollback).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
    });
});