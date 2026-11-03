jest.mock('../../src/models', () => ({
    Pedido: { findOne: jest.fn() },
    DetallePedido: { findAll: jest.fn() },
    Producto: {},
    Sucursal: { findByPk: jest.fn() },
    Calificacion: { findOne: jest.fn() },
    historialDeTiemposPedido: { findOne: jest.fn() },
}));

const { Pedido, DetallePedido, Sucursal, Calificacion, historialDeTiemposPedido } = require('../../src/models');
const { estaEntregado, entregadoEn, buscarPendiente } = require('../../src/utils/calificaciones');

const HORA = 60 * 60 * 1000;
const DIA = 24 * HORA;
const ahora = new Date('2026-10-31T15:00:00Z');
const hace = (ms) => new Date(ahora.getTime() - ms);

beforeEach(() => jest.resetAllMocks());

describe('estaEntregado', () => {
    test('no distingue mayúsculas', () => {
        expect(estaEntregado({ estado: 'Entregado' })).toBe(true);
        expect(estaEntregado({ estado: 'entregado' })).toBe(true);
        expect(estaEntregado({ estado: 'En camino' })).toBe(false);
        expect(estaEntregado(null)).toBe(false);
    });
});

describe('entregadoEn', () => {
    test('devuelve la fecha del registro de entrega', async () => {
        historialDeTiemposPedido.findOne.mockResolvedValue({ fecha: hace(2 * HORA) });
        expect(await entregadoEn(12)).toEqual(hace(2 * HORA));
    });

    test('devuelve null si no hay registro', async () => {
        historialDeTiemposPedido.findOne.mockResolvedValue(null);
        expect(await entregadoEn(12)).toBeNull();
    });
});

describe('buscarPendiente', () => {
    function preparar({ estado = 'Entregado', entregado = hace(2 * HORA), calificado = false } = {}) {
        Pedido.findOne.mockResolvedValue({ id: 12, fecha: hace(3 * HORA), total: '5400', estado, sucursalId: 2 });
        historialDeTiemposPedido.findOne.mockResolvedValue(entregado ? { fecha: entregado } : null);
        Calificacion.findOne.mockResolvedValue(calificado ? { id: 1 } : null);
        DetallePedido.findAll.mockResolvedValue([
            { Producto: { nombre: 'Fast Classic' } },
            { Producto: { nombre: 'Fast Classic' } },
            { Producto: { nombre: 'Sprite' } },
        ]);
        Sucursal.findByPk.mockResolvedValue({ id: 2, nombre: 'Hurlingham' });
    }

    test('ofrece el último pedido entregado hace más de 1 hora', async () => {
        preparar();

        const pendiente = await buscarPendiente(3, ahora);

        expect(pendiente).toMatchObject({
            pedidoId: 12,
            total: 5400,
            sucursal: { id: 2, nombre: 'Hurlingham' },
            productos: ['Fast Classic', 'Sprite'],
        });
    });

    test('busca siempre el pedido más reciente del cliente', async () => {
        preparar();
        await buscarPendiente(3, ahora);
        expect(Pedido.findOne.mock.calls[0][0].where).toEqual({ usuarioId: 3 });
        expect(Pedido.findOne.mock.calls[0][0].order[0]).toEqual(['fecha', 'DESC']);
    });

    test('sin pedidos no hay nada para calificar', async () => {
        Pedido.findOne.mockResolvedValue(null);
        expect(await buscarPendiente(3, ahora)).toBeNull();
    });

    test('si el último pedido no está entregado (hizo uno nuevo), el anterior deja de ofrecerse', async () => {
        preparar({ estado: 'En camino' });
        expect(await buscarPendiente(3, ahora)).toBeNull();
        expect(historialDeTiemposPedido.findOne).not.toHaveBeenCalled();
    });

    test('todavía es pronto: pasó menos de 1 hora', async () => {
        preparar({ entregado: hace(30 * 60 * 1000) });
        expect(await buscarPendiente(3, ahora)).toBeNull();
    });

    test('pasaron más de 7 días', async () => {
        preparar({ entregado: hace(8 * DIA) });
        expect(await buscarPendiente(3, ahora)).toBeNull();
    });

    test('sin registro de entrega no se ofrece', async () => {
        preparar({ entregado: null });
        expect(await buscarPendiente(3, ahora)).toBeNull();
    });

    test('ya calificado no se ofrece', async () => {
        preparar({ calificado: true });
        expect(await buscarPendiente(3, ahora)).toBeNull();
    });
});
