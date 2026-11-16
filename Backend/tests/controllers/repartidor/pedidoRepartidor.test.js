
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

const {
    Pedido,
    Viaje,
    historialDeTiemposPedido,
} = require('../../../src/models');

const {
    obtenerPedidosDisponibles,
    actualizarEstadoPedido,
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

    // ==========================================
    // ACTUALIZAR ESTADO DEL PEDIDO
    // ==========================================

    describe('actualizarEstadoPedido', () => {
        function prepararActualizacion({
            estadoPedido = 'Listo para retirar',
            estadoViaje = 'preparando',
            recepcionConfirmada = true,
        } = {}) {
            const pedido = {
                id: 10,
                estado: estadoPedido,
                update: jest.fn().mockImplementation(async ({ estado }) => {
                    pedido.estado = estado;
                }),
            };

            const viaje = {
                id: 5,
                estado: estadoViaje,
                recepcionConfirmada,
                update: jest.fn(),
            };

            Viaje.findOne.mockResolvedValue(viaje);
            Pedido.findOne.mockResolvedValue(pedido);
            Pedido.count.mockResolvedValue(1);

            return { pedido, viaje };
        }

        function crearRequest(estado = 'En camino') {
            return {
                params: {
                    pedidoId: 10,
                },
                body: {
                    estado,
                },
                repartidor: {
                    id: 3,
                },
            };
        }

        test('devuelve 404 si el repartidor no tiene un viaje activo', async () => {
            const req = crearRequest();
            const res = crearRes();

            Viaje.findOne.mockResolvedValue(null);

            await actualizarEstadoPedido(req, res);

            expect(transaction.rollback).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                mensaje: 'No tenés un viaje activo',
            });
        });

        test('devuelve 404 si el pedido no pertenece al viaje', async () => {
            const req = crearRequest();
            const res = crearRes();

            Viaje.findOne.mockResolvedValue({
                id: 5,
                estado: 'preparando',
            });

            Pedido.findOne.mockResolvedValue(null);

            await actualizarEstadoPedido(req, res);

            expect(transaction.rollback).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                mensaje: 'El pedido no pertenece a tu viaje activo',
            });
        });

        test('no permite retirar pedidos si el viaje ya está activo', async () => {
            prepararActualizacion({
                estadoPedido: 'Listo para retirar',
                estadoViaje: 'activo',
            });

            const req = crearRequest('En camino');
            const res = crearRes();

            await actualizarEstadoPedido(req, res);

            expect(transaction.rollback).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({
                mensaje: 'Solo podés retirar pedidos mientras preparás el viaje',
            });
        });

        test('no permite entregar pedidos si el viaje todavía está preparando', async () => {
            prepararActualizacion({
                estadoPedido: 'En camino',
                estadoViaje: 'preparando',
            });

            const req = crearRequest('Entregado');
            const res = crearRes();

            await actualizarEstadoPedido(req, res);

            expect(transaction.rollback).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({
                mensaje: 'Primero debés iniciar el viaje para entregar pedidos',
            });
        });

        test('no permite entregar si no se confirmó la recepción', async () => {
            prepararActualizacion({
                estadoPedido: 'En camino',
                estadoViaje: 'activo',
                recepcionConfirmada: false,
            });

            const req = crearRequest('Entregado');
            const res = crearRes();

            await actualizarEstadoPedido(req, res);

            expect(transaction.rollback).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                mensaje: 'Primero tenés que confirmar que recibiste todos los pedidos',
            });
        });

        test('rechaza una transición de estado inválida', async () => {
            prepararActualizacion({
                estadoPedido: 'Listo para retirar',
                estadoViaje: 'preparando',
            });

            const req = crearRequest('Entregado');
            const res = crearRes();

            await actualizarEstadoPedido(req, res);

            expect(transaction.rollback).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                mensaje: 'No se puede cambiar el pedido de "Listo para retirar" a "Entregado"',
            });
        });

        test('actualiza el pedido y registra el cambio en el historial', async () => {
            const { pedido } = prepararActualizacion();

            const req = crearRequest('En camino');
            const res = crearRes();

            await actualizarEstadoPedido(req, res);

            expect(pedido.update).toHaveBeenCalledWith(
                { estado: 'En camino' },
                { transaction }
            );

            expect(historialDeTiemposPedido.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    pedidoId: 10,
                    estadoAnterior: 'Listo para retirar',
                    estado: 'En camino',
                }),
                { transaction }
            );

            expect(transaction.commit).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                mensaje: 'Estado del pedido actualizado correctamente',
                pedido: {
                    id: 10,
                    estado: 'En camino',
                },
                viajeFinalizado: false,
            });
        });

        test('finaliza el viaje cuando todos los pedidos están terminados', async () => {
            const { pedido, viaje } = prepararActualizacion({
                estadoPedido: 'En camino',
                estadoViaje: 'activo',
            });

            Pedido.count.mockResolvedValue(0);

            const req = crearRequest('Entregado');
            const res = crearRes();

            await actualizarEstadoPedido(req, res);

            expect(pedido.update).toHaveBeenCalled();
            expect(viaje.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    estado: 'finalizado',
                    fechaFin: expect.any(Date),
                }),
                { transaction }
            );

            expect(transaction.commit).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                mensaje: 'Estado del pedido actualizado correctamente',
                pedido: {
                    id: 10,
                    estado: 'Entregado',
                },
                viajeFinalizado: true,
            });
        });
    });
});
