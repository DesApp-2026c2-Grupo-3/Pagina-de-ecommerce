
jest.mock('../../../src/models', () => ({
    Viaje: {
        findOne: jest.fn(),
        findAll: jest.fn(),
        create: jest.fn(),
        destroy: jest.fn(),
        sequelize: {
            transaction: jest.fn(),
        },
    },
    Pedido: {
        findAll: jest.fn(),
        findOne: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        sequelize: {
            transaction: jest.fn(),
        },
    },
    Usuario: {},
    Direccion: {},
    DetallePedido: {},
    Producto: {},
}));

const {
    Viaje,
    Pedido,
} = require('../../../src/models');

const {
    tomarPedidos,
    iniciarViaje,
    quitarPedidoDelViaje,
    obtenerViajeActivo,
    confirmarRecepcion,
    obtenerHistorialViajes,
    solicitarAyuda,
} = require('../../../src/controllers/repartidor/viajeRepartidorController');

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

describe('Controlador de viajes del repartidor', () => {
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

        Viaje.sequelize.transaction.mockResolvedValue(transaction);
        Pedido.sequelize.transaction.mockResolvedValue(transaction);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // ==========================================
    // TOMAR PEDIDOS
    // ==========================================

    describe('tomarPedidos', () => {
        const crearRequest = (pedidoIds = [1, 2]) => ({
            body: { pedidoIds },
            repartidor: {
                id: 3,
                sucursalId: 1,
            },
        });

        test('devuelve 400 si no se envían pedidos', async () => {
            const req = crearRequest([]);
            const res = crearRes();

            await tomarPedidos(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            
        });

        test('rechaza IDs de pedidos duplicados', async () => {
            const req = crearRequest([1, 1]);
            const res = crearRes();

            await tomarPedidos(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            
        });

        test('rechaza IDs que no sean enteros positivos', async () => {
            const req = crearRequest([1, -2]);
            const res = crearRes();

            await tomarPedidos(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            
        });

        test('devuelve 409 si el repartidor ya tiene un viaje en curso', async () => {
            const req = crearRequest();
            const res = crearRes();

            Viaje.findOne.mockResolvedValue({ id: 5 });

            await tomarPedidos(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(transaction.rollback).toHaveBeenCalled();
        });

        test('devuelve 409 si no encuentra todos los pedidos solicitados', async () => {
            const req = crearRequest([1, 2]);
            const res = crearRes();

            Viaje.findOne.mockResolvedValue(null);
            Pedido.findAll.mockResolvedValue([{ id: 1 }]);

            await tomarPedidos(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(transaction.rollback).toHaveBeenCalled();
        });

        test('crea un viaje y asocia los pedidos correctamente', async () => {
            const req = crearRequest([1, 2]);
            const res = crearRes();

            const viajeCreado = {
                id: 10,
                estado: 'preparando',
            };

            Viaje.findOne.mockResolvedValue(null);
            Pedido.findAll.mockResolvedValue([
                { id: 1 },
                { id: 2 },
            ]);
            Viaje.create.mockResolvedValue(viajeCreado);
            Pedido.update.mockResolvedValue([2]);

            await tomarPedidos(req, res);

            expect(Viaje.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    repartidorId: 3,
                    estado: 'preparando',
                    fechaInicio: null,
                }),
                expect.objectContaining({ transaction })
            );

            expect(Pedido.update).toHaveBeenCalledWith(
                { viajeId: 10 },
                expect.objectContaining({ transaction })
            );

            expect(transaction.commit).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
        });
    });

    // ==========================================
    // INICIAR VIAJE
    // ==========================================

    describe('iniciarViaje', () => {
        function prepararViaje({
            cantidadPedidos = 2,
            pendientes = 0,
        } = {}) {
            Pedido.count.mockReset();
            
            const viaje = {
                id: 10,
                estado: 'preparando',
                update: jest.fn(),
            };

            Viaje.findOne.mockResolvedValue(viaje);
            Pedido.count
                .mockResolvedValueOnce(cantidadPedidos)
                .mockResolvedValueOnce(pendientes);

            return viaje;
        }

        const crearRequest = () => ({
            repartidor: { id: 3 },
        });

        test('devuelve 404 si no encuentra un viaje preparando', async () => {
            const req = crearRequest();
            const res = crearRes();

            Viaje.findOne.mockResolvedValue(null);

            await iniciarViaje(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(transaction.rollback).toHaveBeenCalled();
        });

        test('no permite iniciar un viaje sin pedidos', async () => {
            prepararViaje({ cantidadPedidos: 0 });

            const req = crearRequest();
            const res = crearRes();

            await iniciarViaje(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(transaction.rollback).toHaveBeenCalled();
        });

        test('no permite iniciar si quedan pedidos listos para retirar', async () => {
            prepararViaje({
                cantidadPedidos: 2,
                pendientes: 1,
            });

            const req = crearRequest();
            const res = crearRes();

            await iniciarViaje(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(transaction.rollback).toHaveBeenCalled();
        });

        test('inicia el viaje cuando todos los pedidos fueron retirados', async () => {
            const viaje = prepararViaje({
                cantidadPedidos: 2,
                pendientes: 0,
            });

            const req = crearRequest();
            const res = crearRes();

            await iniciarViaje(req, res);

            expect(viaje.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    estado: 'activo',
                    fechaInicio: expect.any(Date),
                }),
                { transaction }
            );

            expect(transaction.commit).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    // ==========================================
    // QUITAR PEDIDO DEL VIAJE
    // ==========================================

    describe('quitarPedidoDelViaje', () => {
        function prepararViajeYPedido(estadoPedido = 'Listo para retirar') {
            const viaje = {
                id: 10,
                destroy: jest.fn(),
            };

            const pedido = {
                id: 1,
                estado: estadoPedido,
                update: jest.fn(),
            };

            Viaje.findOne.mockResolvedValue(viaje);
            Pedido.findOne.mockResolvedValue(pedido);

            return { viaje, pedido };
        }

        const crearRequest = (pedidoId = 1) => ({
            params: { pedidoId },
            repartidor: { id: 3 },
        });

        test('rechaza un ID inválido', async () => {
            const req = crearRequest('abc');
            const res = crearRes();

            await quitarPedidoDelViaje(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('devuelve 404 si no hay un viaje preparando', async () => {
            const req = crearRequest();
            const res = crearRes();

            Viaje.findOne.mockResolvedValue(null);

            await quitarPedidoDelViaje(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(transaction.rollback).toHaveBeenCalled();
        });

        test('devuelve 404 si el pedido no pertenece al viaje', async () => {
            const req = crearRequest();
            const res = crearRes();

            Viaje.findOne.mockResolvedValue({ id: 10 });
            Pedido.findOne.mockResolvedValue(null);

            await quitarPedidoDelViaje(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(transaction.rollback).toHaveBeenCalled();
        });

        test('no permite quitar un pedido que ya fue retirado', async () => {
            prepararViajeYPedido('En camino');

            const req = crearRequest();
            const res = crearRes();

            await quitarPedidoDelViaje(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(transaction.rollback).toHaveBeenCalled();
        });

        test('desvincula el pedido y conserva el viaje si quedan otros pedidos', async () => {
            const { pedido } = prepararViajeYPedido();

            Pedido.count.mockResolvedValue(1);

            const req = crearRequest();
            const res = crearRes();

            await quitarPedidoDelViaje(req, res);

            expect(pedido.update).toHaveBeenCalledWith(
                { viajeId: null },
                { transaction }
            );

            expect(transaction.commit).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        test('elimina el viaje cuando se quita el último pedido', async () => {
            prepararViajeYPedido();

            Pedido.count.mockResolvedValue(0);
            Viaje.destroy = jest.fn();

            const req = crearRequest();
            const res = crearRes();
            const { viaje } = prepararViajeYPedido();

            await quitarPedidoDelViaje(req, res);

            expect(viaje.destroy).toHaveBeenCalledWith({ transaction });
            expect(transaction.commit).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    // ==========================================
    // OBTENER VIAJE ACTIVO
    // ==========================================

    describe('obtenerViajeActivo', () => {
        test('devuelve el viaje activo del repartidor', async () => {
            const req = {
                repartidor: { id: 3 },
            };

            const res = crearRes();

            const viaje = {
                id: 10,
                estado: 'activo',
            };

            Viaje.findOne.mockResolvedValue(viaje);

            await obtenerViajeActivo(req, res);

            expect(Viaje.findOne).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(viaje);
        });

        test('devuelve null si el repartidor no tiene un viaje activo', async () => {
            const req = {
                repartidor: { id: 3 },
            };

            const res = crearRes();

            Viaje.findOne.mockResolvedValue(null);

            await obtenerViajeActivo(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(null);
        });

        test('devuelve 500 si ocurre un error', async () => {
            const req = {
                repartidor: { id: 3 },
            };

            const res = crearRes();

            Viaje.findOne.mockRejectedValue(new Error('Error de base de datos'));

            await obtenerViajeActivo(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    // ==========================================
    // CONFIRMAR RECEPCIÓN
    // ==========================================

    describe('confirmarRecepcion', () => {
        test('devuelve 404 si no encuentra un viaje activo', async () => {
            const req = {
                repartidor: { id: 3 },
            };

            const res = crearRes();

            Viaje.findOne.mockResolvedValue(null);

            await confirmarRecepcion(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(transaction.rollback).toHaveBeenCalled();
        });

        test('informa si la recepción ya estaba confirmada', async () => {
            const req = {
                repartidor: { id: 3 },
            };

            const res = crearRes();

            const viaje = {
                id: 10,
                recepcionConfirmada: true,
                update: jest.fn(),
            };

            Viaje.findOne.mockResolvedValue(viaje);

            await confirmarRecepcion(req, res);

            expect(viaje.update).not.toHaveBeenCalled();
            expect(transaction.commit).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        test('confirma la recepción del viaje', async () => {
            const req = {
                repartidor: { id: 3 },
            };

            const res = crearRes();

            const viaje = {
                id: 10,
                recepcionConfirmada: false,
                update: jest.fn(),
            };

            Viaje.findOne.mockResolvedValue(viaje);

            await confirmarRecepcion(req, res);

            expect(viaje.update).toHaveBeenCalledWith(
                { recepcionConfirmada: true },
                { transaction }
            );

            expect(transaction.commit).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    // ==========================================
    // HISTORIAL DE VIAJES
    // ==========================================

    describe('obtenerHistorialViajes', () => {
        test('devuelve el historial del repartidor', async () => {
            const req = {
                repartidor: { id: 3 },
            };

            const res = crearRes();

            const historial = [
                { id: 1, estado: 'finalizado' },
                { id: 2, estado: 'cancelado' },
            ];

            Viaje.findAll.mockResolvedValue(historial);

            await obtenerHistorialViajes(req, res);

            expect(Viaje.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        repartidorId: 3,
                    }),
                    order: [['fechaInicio', 'DESC']],
                })
            );

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(historial);
        });

        test('devuelve 500 si ocurre un error', async () => {
            const req = {
                repartidor: { id: 3 },
            };

            const res = crearRes();

            Viaje.findAll.mockRejectedValue(new Error('Error de base de datos'));

            await obtenerHistorialViajes(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    // ==========================================
    // SOLICITAR AYUDA
    // ==========================================

    describe('solicitarAyuda', () => {
        const crearRequest = (body = {}) => ({
            repartidor: { id: 3 },
            body: {
                motivo: 'Problema con el vehículo',
                comentario: 'Tuve un inconveniente',
                latitud: -34.6,
                longitud: -58.5,
                ...body,
            },
        });

        test('rechaza un motivo de asistencia inválido', async () => {
            const req = crearRequest({
                motivo: 'Motivo incorrecto',
            });

            const res = crearRes();

            await solicitarAyuda(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('rechaza coordenadas fuera de rango', async () => {
            const req = crearRequest({
                latitud: 120,
            });

            const res = crearRes();

            await solicitarAyuda(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('devuelve 404 si el repartidor no tiene un viaje activo', async () => {
            const req = crearRequest();
            const res = crearRes();

            Viaje.findOne.mockResolvedValue(null);

            await solicitarAyuda(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(transaction.rollback).toHaveBeenCalled();
        });

        test('registra la solicitud de asistencia correctamente', async () => {
            const req = crearRequest();
            const res = crearRes();

            const viaje = {
                id: 10,
                update: jest.fn(),
            };

            Viaje.findOne.mockResolvedValue(viaje);

            await solicitarAyuda(req, res);

            expect(viaje.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    estado: 'requiere asistencia',
                    motivoAsistencia: 'Problema con el vehículo',
                    comentarioAsistencia: 'Tuve un inconveniente',
                    latitudAsistencia: -34.6,
                    longitudAsistencia: -58.5,
                    fechaSolicitudAsistencia: expect.any(Date),
                }),
                { transaction }
            );

            expect(transaction.commit).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });
});
