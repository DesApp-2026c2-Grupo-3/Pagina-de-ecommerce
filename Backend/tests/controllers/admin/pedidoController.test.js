jest.mock('../../../src/models', () => {
    const t = { commit: jest.fn(), rollback: jest.fn(), LOCK: { UPDATE: 'UPDATE' } };
    return {
        Pedido: { findAll: jest.fn(), findByPk: jest.fn() },
        DetallePedido: {},
        Producto: {},
        Admin: { findByPk: jest.fn() },
        Usuario: {},
        Direccion: {},
        Sucursal: { findByPk: jest.fn() },
        historialDeTiemposPedido: { create: jest.fn() },
        sequelize: { transaction: jest.fn().mockResolvedValue(t) },
        __t: t,
    };
});

jest.mock('../../../src/utils/stockPedido', () => ({
    devolverStockPedido: jest.fn(),
}));

const models = require('../../../src/models');
const { devolverStockPedido } = require('../../../src/utils/stockPedido');
const {
    obtenerPedidosPorSucursal,
    obtenerPedidoPorId,
    cambiarEstadoPedidoPorId,
} = require('../../../src/controllers/admin/pedidoController');

const { Pedido, Admin, Sucursal, historialDeTiemposPedido } = models;
const t = models.__t;

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

const adminDeSucursal = { id: 7, sucursalId: 2 };
const adminMaster = { id: 1, sucursalId: null };
const sucursal = { id: 2, nombre: 'Morón' };

function pedidoDeLaBase(datos = {}) {
    return {
        id: 100,
        sucursalId: 2,
        estado: 'Pendiente',
        update: jest.fn(),
        ...datos,
    };
}

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});

    Admin.findByPk.mockResolvedValue(adminDeSucursal);
    Sucursal.findByPk.mockResolvedValue(sucursal);
    Pedido.findAll.mockResolvedValue([]);
    devolverStockPedido.mockResolvedValue(0);
});

describe('obtenerPedidosPorSucursal', () => {
    test('responde 401 si el administrador ya no existe', async () => {
        Admin.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await obtenerPedidosPorSucursal({ usuario: { id: 7 }, params: { id: '2' }, query: {} }, res);

        expect(Sucursal.findByPk).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Iniciá sesión de nuevo' });
    });

    test('responde 404 si la sucursal no existe', async () => {
        Sucursal.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await obtenerPedidosPorSucursal({ usuario: { id: 7 }, params: { id: '99' }, query: {} }, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Sucursal no encontrada' });
    });

    test('responde 403 si el administrador es de otra sucursal', async () => {
        Admin.findByPk.mockResolvedValue({ id: 8, sucursalId: 3 });
        const res = crearRes();

        await obtenerPedidosPorSucursal({ usuario: { id: 8 }, params: { id: '2' }, query: {} }, res);

        expect(Pedido.findAll).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'No tienes permisos para acceder a esta sucursal' });
    });

    test('deja pasar al MASTER (sin sucursal)', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);
        const res = crearRes();

        await obtenerPedidosPorSucursal({ usuario: { id: 1 }, params: { id: '2' }, query: {} }, res);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('devuelve los pedidos de la sucursal, del más nuevo al más viejo', async () => {
        const pedidos = [{ id: 1 }, { id: 2 }];
        Pedido.findAll.mockResolvedValue(pedidos);
        const res = crearRes();

        await obtenerPedidosPorSucursal({ usuario: { id: 7 }, params: { id: '2' }, query: {} }, res);

        expect(Pedido.findAll).toHaveBeenCalledWith(expect.objectContaining({
            where: { sucursalId: 2 },
            order: [['fecha', 'DESC']],
        }));
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(pedidos);
    });

    test('filtra por estado cuando viene en la query', async () => {
        await obtenerPedidosPorSucursal({
            usuario: { id: 7 },
            params: { id: '2' },
            query: { estado: 'En proceso' },
        }, crearRes());

        expect(Pedido.findAll).toHaveBeenCalledWith(expect.objectContaining({
            where: { sucursalId: 2, estado: 'En proceso' },
        }));
    });

    test('responde 500 si falla la base de datos', async () => {
        Admin.findByPk.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await obtenerPedidosPorSucursal({ usuario: { id: 7 }, params: { id: '2' }, query: {} }, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Error al obtener los pedidos' });
    });
});

describe('obtenerPedidoPorId', () => {
    test('responde 401 si el administrador ya no existe', async () => {
        Admin.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await obtenerPedidoPorId({ usuario: { id: 7 }, params: { id: '100' } }, res);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    test('responde 404 si el pedido no existe', async () => {
        Pedido.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await obtenerPedidoPorId({ usuario: { id: 7 }, params: { id: '99' } }, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Pedido no encontrado' });
    });

    test('responde 404 (no 403) si el pedido es de otra sucursal', async () => {
        Pedido.findByPk.mockResolvedValue(pedidoDeLaBase({ sucursalId: 3 }));
        const res = crearRes();

        await obtenerPedidoPorId({ usuario: { id: 7 }, params: { id: '100' } }, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Pedido no encontrado' });
    });

    test('el MASTER puede ver cualquier pedido', async () => {
        Admin.findByPk.mockResolvedValue(adminMaster);
        const pedido = pedidoDeLaBase({ sucursalId: 3 });
        Pedido.findByPk.mockResolvedValue(pedido);
        const res = crearRes();

        await obtenerPedidoPorId({ usuario: { id: 1 }, params: { id: '100' } }, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(pedido);
    });

    test('devuelve el pedido con su historial ordenado', async () => {
        const pedido = pedidoDeLaBase();
        Pedido.findByPk.mockResolvedValue(pedido);
        const res = crearRes();

        await obtenerPedidoPorId({ usuario: { id: 7 }, params: { id: '100' } }, res);

        const { order } = Pedido.findByPk.mock.calls[0][1];
        expect(order[0]).toEqual([{ model: historialDeTiemposPedido, as: 'historialDeTiemposPedidos' }, 'fecha', 'ASC']);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('responde 500 si falla la base de datos', async () => {
        Pedido.findByPk.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await obtenerPedidoPorId({ usuario: { id: 7 }, params: { id: '100' } }, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('cambiarEstadoPedidoPorId', () => {
    function req(estado, datos = {}) {
        return {
            usuario: { id: 7 },
            params: { id: '100' },
            body: { estado },
            ...datos,
        };
    }

    test('responde 401 si el administrador ya no existe', async () => {
        Admin.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await cambiarEstadoPedidoPorId(req('En proceso'), res);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    test('responde 404 si el pedido no existe', async () => {
        Pedido.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await cambiarEstadoPedidoPorId(req('En proceso'), res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('responde 404 si el pedido es de otra sucursal', async () => {
        Pedido.findByPk.mockResolvedValue(pedidoDeLaBase({ sucursalId: 3 }));
        const res = crearRes();

        await cambiarEstadoPedidoPorId(req('En proceso'), res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Pedido no encontrado' });
    });

    test.each(['Entregado', 'Cancelado'])('no modifica un pedido ya %s', async (estado) => {
        Pedido.findByPk.mockResolvedValue(pedidoDeLaBase({ estado }));
        const res = crearRes();

        await cambiarEstadoPedidoPorId(req('En proceso'), res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json.mock.calls[0][0].mensaje).toContain('no se puede modificar');
    });

    test('rechaza cambiar al mismo estado sin importar mayúsculas', async () => {
        Pedido.findByPk.mockResolvedValue(pedidoDeLaBase({ estado: 'Pendiente' }));
        const res = crearRes();

        await cambiarEstadoPedidoPorId(req('pendiente'), res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json.mock.calls[0][0].mensaje).toContain('ya se encuentra en el estado');
    });

    test('rechaza una transición no permitida', async () => {
        Pedido.findByPk.mockResolvedValue(pedidoDeLaBase({ estado: 'Pendiente' }));
        const res = crearRes();

        await cambiarEstadoPedidoPorId(req('Entregado'), res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            mensaje: 'No se puede pasar de "Pendiente" a "Entregado"',
        });
    });

    test('cambia el estado, registra el historial y hace commit', async () => {
        const pedido = pedidoDeLaBase();
        Pedido.findByPk.mockResolvedValue(pedido);
        const res = crearRes();

        await cambiarEstadoPedidoPorId(req('En proceso'), res);

        expect(pedido.update).toHaveBeenCalledWith({ estado: 'En proceso' }, { transaction: t });
        expect(historialDeTiemposPedido.create).toHaveBeenCalledWith(
            expect.objectContaining({
                pedidoId: 100,
                estadoAnterior: 'Pendiente',
                estado: 'En proceso',
                fecha: expect.any(Date),
            }),
            { transaction: t }
        );
        expect(t.commit).toHaveBeenCalled();
        expect(t.rollback).not.toHaveBeenCalled();
        expect(devolverStockPedido).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('al cancelar desde Pendiente devuelve el stock dentro de la transacción', async () => {
        const pedido = pedidoDeLaBase({ estado: 'Pendiente' });
        Pedido.findByPk.mockResolvedValue(pedido);

        await cambiarEstadoPedidoPorId(req('Cancelado'), crearRes());

        expect(devolverStockPedido).toHaveBeenCalledWith(100, { transaction: t, adminId: 7 });
        expect(t.commit).toHaveBeenCalled();
    });

    test('al cancelar desde En proceso no devuelve el stock automáticamente', async () => {
        const pedido = pedidoDeLaBase({ estado: 'En proceso' });
        Pedido.findByPk.mockResolvedValue(pedido);

        await cambiarEstadoPedidoPorId(req('Cancelado'), crearRes());

        expect(devolverStockPedido).not.toHaveBeenCalled();
        expect(t.commit).toHaveBeenCalled();
    });

    test('acepta un estado viejo en minúsculas', async () => {
        const pedido = pedidoDeLaBase({ estado: 'pendiente' });
        Pedido.findByPk.mockResolvedValue(pedido);

        await cambiarEstadoPedidoPorId(req('Cancelado'), crearRes());

        expect(pedido.update).toHaveBeenCalledWith({ estado: 'Cancelado' }, { transaction: t });
    });

    test('si falla la transacción, deshace todo y responde 500', async () => {
        const pedido = pedidoDeLaBase();
        pedido.update.mockRejectedValue(new Error('Base caída'));
        Pedido.findByPk.mockResolvedValue(pedido);
        const res = crearRes();

        await cambiarEstadoPedidoPorId(req('En proceso'), res);

        expect(t.rollback).toHaveBeenCalled();
        expect(t.commit).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Error al cambiar el estado del pedido' });
    });
});
