jest.mock('../../../src/models', () => {
    const t = { commit: jest.fn(), rollback: jest.fn(), LOCK: { UPDATE: 'UPDATE' } };
    return {
        Pedido: { findAll: jest.fn(), findByPk: jest.fn(), count: jest.fn() },
        Viaje: { findByPk: jest.fn() },
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
jest.mock('../../../src/notifications/adminRefresco', () => ({
    emitirRefrescoAdmin: jest.fn(),
}));
jest.mock('../../../src/notifications/handlers/pedidoHandlers', () => ({
    notificarEstadoPedido: jest.fn(),
}));
jest.mock('../../../src/utils/catalogoPedido', () => ({
    catalogoDelPedido: jest.fn(),
}));
jest.mock('../../../src/notifications/handlers/viajeHandlers', () => ({
    notificarPedidoCanceladoEnViaje: jest.fn(),
    notificarDisponibilidad: jest.fn(),
}));

const models = require('../../../src/models');
const { devolverStockPedido } = require('../../../src/utils/stockPedido');
const { emitirRefrescoAdmin } = require('../../../src/notifications/adminRefresco');
const { notificarEstadoPedido } = require('../../../src/notifications/handlers/pedidoHandlers');
const { catalogoDelPedido } = require('../../../src/utils/catalogoPedido');
const {
    notificarPedidoCanceladoEnViaje,
    notificarDisponibilidad,
} = require('../../../src/notifications/handlers/viajeHandlers');
const CATALOGO_VACIO = { productos: [], insumos: [] };
const {
    obtenerPedidosPorSucursal,
    obtenerPedidoPorId,
    cambiarEstadoPedidoPorId,
} = require('../../../src/controllers/admin/pedidoController');

const { Pedido, Viaje, Admin, Sucursal, historialDeTiemposPedido } = models;
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
        viajeId: null,
        retiradoEn: null,
        update: jest.fn(),
        reload: jest.fn(),
        ...datos,
    };
}

beforeEach(() => {
    jest.clearAllMocks();
    catalogoDelPedido.mockResolvedValue(CATALOGO_VACIO);
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
        expect(res.json).toHaveBeenCalledWith({ ...pedido, catalogo: CATALOGO_VACIO });
    });

    test('agrega el catálogo de los productos del pedido (sirve al admin de sucursal)', async () => {
        const detalles = [{ id: 1, productoId: 5, personalizaciones: [{ insumoId: 3, cantidad: 0 }] }];
        const pedido = pedidoDeLaBase({ DetallePedidos: detalles });
        Pedido.findByPk.mockResolvedValue(pedido);
        const catalogo = {
            productos: [{ id: 5, nombre: 'Clásica', receta: [{ insumoId: 3, cantidadBase: 1 }], grupos: [] }],
            insumos: [{ id: 3, nombre: 'Cebolla' }],
        };
        catalogoDelPedido.mockResolvedValue(catalogo);
        const res = crearRes();

        await obtenerPedidoPorId({ usuario: { id: 7 }, params: { id: '100' } }, res);

        expect(catalogoDelPedido).toHaveBeenCalledWith(detalles);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json.mock.calls[0][0].catalogo).toEqual(catalogo);
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

        await cambiarEstadoPedidoPorId(req('Listo para retirar'), res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            mensaje: 'No se puede pasar de "Pendiente" a "Listo para retirar"',
        });
    });

    test('rechaza que el admin marque "Entregado" (lo marca el repartidor)', async () => {
        Pedido.findByPk.mockResolvedValue(pedidoDeLaBase({ estado: 'Pendiente' }));
        const res = crearRes();

        await cambiarEstadoPedidoPorId(req('Entregado'), res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            mensaje: '"Entregado" lo marca el repartidor desde su app',
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

    test('al devolver stock al cancelar avisa a la sucursal para refrescar', async () => {
        const pedido = pedidoDeLaBase({ estado: 'Pendiente' });
        Pedido.findByPk.mockResolvedValue(pedido);
        devolverStockPedido.mockResolvedValue(2);

        await cambiarEstadoPedidoPorId(req('Cancelado'), crearRes());

        expect(emitirRefrescoAdmin).toHaveBeenCalledWith({
            dominio: 'stock',
            accion: 'actualizado',
            sucursalId: 2,
            recursos: { pedidoId: 100 },
        });
    });

    test('al cancelar desde En proceso no devuelve el stock automáticamente', async () => {
        const pedido = pedidoDeLaBase({ estado: 'En proceso' });
        Pedido.findByPk.mockResolvedValue(pedido);

        await cambiarEstadoPedidoPorId(req('Cancelado'), crearRes());

        expect(devolverStockPedido).not.toHaveBeenCalled();
        expect(t.commit).toHaveBeenCalled();
    });

    test('el admin no puede despachar: "En camino" lo marca el repartidor', async () => {
        const pedido = pedidoDeLaBase({ estado: 'Listo para retirar' });
        Pedido.findByPk.mockResolvedValue(pedido);
        const res = crearRes();

        await cambiarEstadoPedidoPorId(req('En camino'), res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            mensaje: '"En camino" lo marca el repartidor desde su app',
        });
        expect(pedido.update).not.toHaveBeenCalled();
        expect(notificarEstadoPedido).not.toHaveBeenCalled();
    });

    test('un pedido "En camino" no se modifica desde el panel', async () => {
        const pedido = pedidoDeLaBase({ estado: 'En camino' });
        Pedido.findByPk.mockResolvedValue(pedido);
        const res = crearRes();

        await cambiarEstadoPedidoPorId(req('Entregado'), res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            mensaje: 'El pedido está "En camino": lo gestiona el repartidor desde su app',
        });
        expect(pedido.update).not.toHaveBeenCalled();
    });

    test('desde "Listo para retirar" el admin solo puede cancelar', async () => {
        const pedido = pedidoDeLaBase({ estado: 'Listo para retirar' });
        Pedido.findByPk.mockResolvedValue(pedido);
        const res = crearRes();

        await cambiarEstadoPedidoPorId(req('Cancelado'), res);

        // Se relee bloqueado para no pisarse con un retiro simultáneo del repartidor
        expect(pedido.reload).toHaveBeenCalledWith({ transaction: t, lock: 'UPDATE' });
        expect(pedido.update).toHaveBeenCalledWith({ estado: 'Cancelado' }, { transaction: t });
        // Estaba disponible (sin viaje): deja de ofrecerse a los repartidores
        expect(notificarDisponibilidad).toHaveBeenCalledWith({ pedido, accion: 'eliminado' });
        expect(notificarPedidoCanceladoEnViaje).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    describe('D-08: cancelar un pedido que está en un viaje', () => {
        function prepararPedidoEnViaje({ retiradoEn = null, restantes = 1 } = {}) {
            const pedido = pedidoDeLaBase({ estado: 'Listo para retirar', viajeId: 5, retiradoEn });
            const viaje = { id: 5, repartidorId: 9, estado: 'preparando', destroy: jest.fn() };
            Pedido.findByPk.mockResolvedValue(pedido);
            Viaje.findByPk.mockResolvedValue(viaje);
            Pedido.count.mockResolvedValue(restantes);
            return { pedido, viaje };
        }

        test('si el repartidor ya lo retiró responde 409 y no cambia nada', async () => {
            const { pedido } = prepararPedidoEnViaje({ retiradoEn: new Date() });
            const res = crearRes();

            await cambiarEstadoPedidoPorId(req('Cancelado'), res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({
                mensaje: 'El repartidor ya retiró el pedido: no se puede cancelar',
            });
            expect(pedido.update).not.toHaveBeenCalled();
            expect(t.rollback).toHaveBeenCalled();
            expect(t.commit).not.toHaveBeenCalled();
            expect(notificarPedidoCanceladoEnViaje).not.toHaveBeenCalled();
            expect(notificarEstadoPedido).not.toHaveBeenCalled();
        });

        test('si no lo retiró, lo saca del viaje y avisa al repartidor', async () => {
            const { pedido, viaje } = prepararPedidoEnViaje({ restantes: 2 });
            const res = crearRes();

            await cambiarEstadoPedidoPorId(req('Cancelado'), res);

            expect(Viaje.findByPk).toHaveBeenCalledWith(5, { transaction: t, lock: 'UPDATE' });
            expect(pedido.update).toHaveBeenCalledWith(
                { estado: 'Cancelado', viajeId: null },
                { transaction: t }
            );
            expect(viaje.destroy).not.toHaveBeenCalled();
            expect(t.commit).toHaveBeenCalled();
            expect(notificarPedidoCanceladoEnViaje).toHaveBeenCalledWith({
                pedido, viaje, viajeEliminado: false,
            });
            expect(notificarDisponibilidad).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        test('si era el último pedido del viaje, elimina el viaje vacío', async () => {
            const { pedido, viaje } = prepararPedidoEnViaje({ restantes: 0 });

            await cambiarEstadoPedidoPorId(req('Cancelado'), crearRes());

            expect(viaje.destroy).toHaveBeenCalledWith({ transaction: t });
            expect(notificarPedidoCanceladoEnViaje).toHaveBeenCalledWith({
                pedido, viaje, viajeEliminado: true,
            });
        });
    });

    test('cancelar desde "En proceso" no toca la lista de disponibles', async () => {
        const pedido = pedidoDeLaBase({ estado: 'En proceso' });
        Pedido.findByPk.mockResolvedValue(pedido);

        await cambiarEstadoPedidoPorId(req('Cancelado'), crearRes());

        expect(pedido.reload).not.toHaveBeenCalled();
        expect(notificarDisponibilidad).not.toHaveBeenCalled();
        expect(notificarPedidoCanceladoEnViaje).not.toHaveBeenCalled();
    });

    // El handler decide qué ve el cliente: "Listo para retirar" es interno y no se le avisa
    // (ver tests/notifications/handlers.test.js)
    test('pasar a "Listo para retirar" delega en el handler con el estado anterior', async () => {
        const pedido = pedidoDeLaBase({ estado: 'En proceso' });
        Pedido.findByPk.mockResolvedValue(pedido);
        const res = crearRes();

        await cambiarEstadoPedidoPorId(req('Listo para retirar'), res);

        expect(pedido.update).toHaveBeenCalledWith({ estado: 'Listo para retirar' }, { transaction: t });
        expect(t.commit).toHaveBeenCalled();
        expect(notificarEstadoPedido).toHaveBeenCalledWith(pedido, 'En proceso');
        // Aparece en la lista de pedidos disponibles de los repartidores
        expect(notificarDisponibilidad).toHaveBeenCalledWith({ pedido, accion: 'creado' });
        expect(res.status).toHaveBeenCalledWith(200);
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
