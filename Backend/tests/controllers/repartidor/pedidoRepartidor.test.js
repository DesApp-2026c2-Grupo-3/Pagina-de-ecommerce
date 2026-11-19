
jest.mock('../../../src/models', () => ({
    Pedido: {
        findAll: jest.fn(),
        findOne: jest.fn(),
        count: jest.fn(),
        sequelize: {
            transaction: jest.fn(),
        },
    },
    DetallePedido: {},
    Producto: {},
    Usuario: {},
    Direccion: {},
    Viaje: {
        findOne: jest.fn(),
    },
    historialDeTiemposPedido: {
        create: jest.fn(),
    },
}));

jest.mock('../../../src/notifications/handlers/viajeHandlers', () => ({
    notificarPedidoRetirado: jest.fn(),
    notificarPedidoEntregado: jest.fn(),
}));

const {
    Pedido,
    Viaje,
    historialDeTiemposPedido,
} = require('../../../src/models');

const {
    notificarPedidoRetirado,
    notificarPedidoEntregado,
} = require('../../../src/notifications/handlers/viajeHandlers');

const {
    obtenerPedidosDisponibles,
    retirarPedido,
    entregarPedido,
} = require('../../../src/controllers/repartidor/pedidoRepartidorController');

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

describe('Controlador de pedidos del repartidor', () => {
    let transaction;

    beforeEach(() => {
        jest.clearAllMocks();

        jest.spyOn(console, 'error').mockImplementation(() => {});

        transaction = {
            commit: jest.fn(),
            rollback: jest.fn(),
            LOCK: {
                UPDATE: 'UPDATE',
            },
        };

        Pedido.sequelize.transaction.mockResolvedValue(transaction);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // ==========================================
    // OBTENER PEDIDOS DISPONIBLES
    // ==========================================

    describe('obtenerPedidosDisponibles', () => {
        test('devuelve los pedidos disponibles de la sucursal', async () => {
            const req = {
                repartidor: {
                    sucursalId: 1,
                },
            };

            const res = crearRes();

            const pedidos = [
                { id: 1, estado: 'Listo para retirar' },
                { id: 2, estado: 'Listo para retirar' },
            ];

            Pedido.findAll.mockResolvedValue(pedidos);

            await obtenerPedidosDisponibles(req, res);

            expect(Pedido.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        sucursalId: 1,
                        estado: 'Listo para retirar',
                        viajeId: null,
                    },
                    order: [['fecha', 'ASC']],
                })
            );

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(pedidos);
        });

        test('devuelve 500 si ocurre un error', async () => {
            const req = {
                repartidor: {
                    sucursalId: 1,
                },
            };

            const res = crearRes();

            Pedido.findAll.mockRejectedValue(
                new Error('Error de base de datos')
            );

            await obtenerPedidosDisponibles(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                mensaje: 'Error al obtener los pedidos disponibles',
            });
        });
    });

    function crearPedido(datos = {}) {
        const pedido = {
            id: 10,
            sucursalId: 2,
            viajeId: 5,
            estado: 'Listo para retirar',
            retiradoEn: null,
            ...datos,
            update: jest.fn().mockImplementation(async (cambios) => {
                Object.assign(pedido, cambios);
            }),
        };
        return pedido;
    }

    function crearViaje(datos = {}) {
        const viaje = {
            id: 5,
            estado: 'preparando',
            recepcionConfirmada: true,
            ...datos,
            update: jest.fn().mockImplementation(async (cambios) => {
                Object.assign(viaje, cambios);
            }),
        };
        return viaje;
    }

    const crearReq = (pedidoId = '10') => ({
        params: { pedidoId },
        repartidor: { id: 3, sucursalId: 2 },
    });

    // ==========================================
    // RETIRAR (D-07)
    // ==========================================

    describe('retirarPedido', () => {
        test('registra el retiro sin cambiar el estado', async () => {
            const pedido = crearPedido();
            Viaje.findOne.mockResolvedValue(crearViaje());
            Pedido.findOne.mockResolvedValue(pedido);
            const res = crearRes();

            await retirarPedido(crearReq(), res);

            expect(Viaje.findOne).toHaveBeenCalledWith(expect.objectContaining({
                where: { repartidorId: 3, estado: 'preparando' },
            }));
            expect(pedido.update).toHaveBeenCalledWith(
                { retiradoEn: expect.any(Date) },
                { transaction }
            );
            expect(pedido.estado).toBe('Listo para retirar');
            expect(historialDeTiemposPedido.create).not.toHaveBeenCalled();
            expect(transaction.commit).toHaveBeenCalled();
            expect(notificarPedidoRetirado).toHaveBeenCalledWith({ pedido });
            expect(res.status).toHaveBeenCalledWith(200);
        });

        test('retirar dos veces responde 409', async () => {
            Viaje.findOne.mockResolvedValue(crearViaje());
            Pedido.findOne.mockResolvedValue(crearPedido({ retiradoEn: new Date() }));
            const res = crearRes();

            await retirarPedido(crearReq(), res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(transaction.rollback).toHaveBeenCalled();
            expect(notificarPedidoRetirado).not.toHaveBeenCalled();
        });

        test('sin un viaje en preparación responde 409', async () => {
            Viaje.findOne.mockResolvedValue(null);
            const res = crearRes();

            await retirarPedido(crearReq(), res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(Pedido.findOne).not.toHaveBeenCalled();
        });

        test('un pedido que no es de su viaje responde 404', async () => {
            Viaje.findOne.mockResolvedValue(crearViaje());
            Pedido.findOne.mockResolvedValue(null);
            const res = crearRes();

            await retirarPedido(crearReq(), res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        test('un pedido que ya no está "Listo para retirar" responde 409', async () => {
            Viaje.findOne.mockResolvedValue(crearViaje());
            Pedido.findOne.mockResolvedValue(crearPedido({ estado: 'Cancelado' }));
            const res = crearRes();

            await retirarPedido(crearReq(), res);

            expect(res.status).toHaveBeenCalledWith(409);
        });

        test('un id inválido responde 400 sin abrir transacción', async () => {
            const res = crearRes();

            await retirarPedido(crearReq('abc'), res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(Pedido.sequelize.transaction).not.toHaveBeenCalled();
        });

        test('un error inesperado responde 500 y deshace la transacción', async () => {
            Viaje.findOne.mockRejectedValue(new Error('Base caída'));
            const res = crearRes();

            await retirarPedido(crearReq(), res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ mensaje: 'Error al retirar el pedido' });
            expect(transaction.rollback).toHaveBeenCalled();
        });
    });

    // ==========================================
    // ENTREGAR
    // ==========================================

    describe('entregarPedido', () => {
        function prepararEntrega({ viaje = {}, pedido = {}, pendientes = 1 } = {}) {
            const v = crearViaje({ estado: 'activo', ...viaje });
            const p = crearPedido({ estado: 'En camino', retiradoEn: new Date(), ...pedido });
            Viaje.findOne.mockResolvedValue(v);
            Pedido.findOne.mockResolvedValue(p);
            Pedido.count.mockResolvedValue(pendientes);
            return { viaje: v, pedido: p };
        }

        test('entrega el pedido, registra el historial y avisa', async () => {
            const { viaje, pedido } = prepararEntrega();
            const res = crearRes();

            await entregarPedido(crearReq(), res);

            expect(pedido.update).toHaveBeenCalledWith({ estado: 'Entregado' }, { transaction });
            expect(historialDeTiemposPedido.create).toHaveBeenCalledWith(expect.objectContaining({
                pedidoId: 10,
                estadoAnterior: 'En camino',
                estado: 'Entregado',
            }), { transaction });
            expect(viaje.update).not.toHaveBeenCalled();
            expect(notificarPedidoEntregado).toHaveBeenCalledWith({ pedido, estadoAnterior: 'En camino' });
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ viajeFinalizado: false }));
        });

        test('cierra el viaje al entregar el último pedido', async () => {
            const { viaje } = prepararEntrega({ pendientes: 0 });
            const res = crearRes();

            await entregarPedido(crearReq(), res);

            expect(viaje.update).toHaveBeenCalledWith(
                { estado: 'finalizado', fechaFin: expect.any(Date) },
                { transaction }
            );
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ viajeFinalizado: true }));
        });

        test('sin recepción confirmada responde 409 (viaje reasignado)', async () => {
            prepararEntrega({ viaje: { recepcionConfirmada: false } });
            const res = crearRes();

            await entregarPedido(crearReq(), res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({
                mensaje: 'Primero tenés que confirmar que recibiste todos los pedidos',
            });
            expect(notificarPedidoEntregado).not.toHaveBeenCalled();
        });

        test.each(['preparando', 'requiere asistencia'])('con el viaje "%s" responde 409', async (estado) => {
            prepararEntrega({ viaje: { estado } });
            const res = crearRes();

            await entregarPedido(crearReq(), res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(Pedido.findOne).not.toHaveBeenCalled();
        });

        test('sin viaje en curso responde 404', async () => {
            Viaje.findOne.mockResolvedValue(null);
            const res = crearRes();

            await entregarPedido(crearReq(), res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        test('un pedido ya entregado responde 409', async () => {
            prepararEntrega({ pedido: { estado: 'Entregado' } });
            const res = crearRes();

            await entregarPedido(crearReq(), res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(historialDeTiemposPedido.create).not.toHaveBeenCalled();
        });

        test('un pedido que no es de su viaje responde 404', async () => {
            prepararEntrega();
            Pedido.findOne.mockResolvedValue(null);
            const res = crearRes();

            await entregarPedido(crearReq(), res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        test('un error inesperado responde 500 y deshace la transacción', async () => {
            prepararEntrega();
            historialDeTiemposPedido.create.mockRejectedValueOnce(new Error('Base caída'));
            const res = crearRes();

            await entregarPedido(crearReq(), res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(transaction.rollback).toHaveBeenCalled();
            expect(notificarPedidoEntregado).not.toHaveBeenCalled();
        });
    });
});
