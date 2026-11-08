jest.mock('../../src/models', () => ({
    Pedido: { findOne: jest.fn() },
    DetallePedido: { findAll: jest.fn() },
    Producto: {},
    Categoria: {},
    Sucursal: { findByPk: jest.fn() },
    Calificacion: { findOne: jest.fn() },
    historialDeTiemposPedido: { findOne: jest.fn() },
}));

const { Pedido, DetallePedido, Sucursal, Calificacion, historialDeTiemposPedido } = require('../../src/models');
const { estaEntregado, entregadoEn, itemsCalificables, buscarPendiente } = require('../../src/utils/calificaciones');

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

// Una línea del pedido, como la devuelve DetallePedido.findAll con el producto y su categoría
const linea = (id, productoId, nombre, { precio = '1500', complemento = false, imagen = null } = {}) => ({
    id,
    precio,
    Producto: { id: productoId, nombre, imagen, categoria: { esComplemento: complemento } },
});

describe('itemsCalificables', () => {
    test('un item por producto, en el orden del pedido, aunque se haya pedido en dos líneas', async () => {
        DetallePedido.findAll.mockResolvedValue([
            linea(1, 7, 'Fast Classic', { imagen: '/img/fc.png' }),
            linea(2, 9, 'Sprite'),
            linea(3, 7, 'Fast Classic'),
        ]);

        expect(await itemsCalificables(12)).toEqual([
            { productoId: 7, nombre: 'Fast Classic', imagen: '/img/fc.png' },
            { productoId: 9, nombre: 'Sprite', imagen: null },
        ]);
        expect(DetallePedido.findAll.mock.calls[0][0].where).toEqual({ pedidoId: 12 });
    });

    test('las salsas gratuitas no se califican', async () => {
        DetallePedido.findAll.mockResolvedValue([
            linea(1, 7, 'Fast Classic'),
            linea(2, 20, 'Mayonesa', { precio: '0', complemento: true }),
        ]);

        expect((await itemsCalificables(12)).map((i) => i.nombre)).toEqual(['Fast Classic']);
    });

    test('una salsa que se cobra sí se califica; un producto gratis que no es complemento (promo) también', async () => {
        DetallePedido.findAll.mockResolvedValue([
            linea(1, 21, 'Cheddar Fundido', { precio: '700', complemento: true }),
            linea(2, 8, 'Papas promo', { precio: '0', complemento: false }),
        ]);

        expect((await itemsCalificables(12)).map((i) => i.nombre)).toEqual(['Cheddar Fundido', 'Papas promo']);
    });

    test('ignora las líneas cuyo producto no se pudo cargar', async () => {
        DetallePedido.findAll.mockResolvedValue([{ id: 1, precio: '10', Producto: null }]);
        expect(await itemsCalificables(12)).toEqual([]);
    });
});

describe('buscarPendiente', () => {
    function preparar({ estado = 'Entregado', entregado = hace(2 * HORA), calificado = false, detalle } = {}) {
        Pedido.findOne.mockResolvedValue({ id: 12, fecha: hace(3 * HORA), total: '5400', estado, sucursalId: 2 });
        historialDeTiemposPedido.findOne.mockResolvedValue(entregado ? { fecha: entregado } : null);
        Calificacion.findOne.mockResolvedValue(calificado ? { id: 1 } : null);
        DetallePedido.findAll.mockResolvedValue(detalle ?? [
            linea(1, 7, 'Fast Classic'),
            linea(2, 7, 'Fast Classic'),
            linea(3, 9, 'Sprite'),
            linea(4, 20, 'Mayonesa', { precio: '0', complemento: true }),
        ]);
        Sucursal.findByPk.mockResolvedValue({ id: 2, nombre: 'Hurlingham' });
    }

    test('ofrece el último pedido entregado, con los productos que se pueden calificar', async () => {
        preparar();

        const pendiente = await buscarPendiente(3, ahora);

        expect(pendiente).toMatchObject({
            pedidoId: 12,
            total: 5400,
            sucursal: { id: 2, nombre: 'Hurlingham' },
            items: [
                { productoId: 7, nombre: 'Fast Classic' },
                { productoId: 9, nombre: 'Sprite' },
            ],
        });
    });

    test('un pedido que solo tiene salsas gratuitas no se ofrece', async () => {
        preparar({ detalle: [linea(1, 20, 'Mayonesa', { precio: '0', complemento: true })] });
        expect(await buscarPendiente(3, ahora)).toBeNull();
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

    test('todavía es pronto: no pasó el tiempo mínimo desde la entrega', async () => {
        // Con MINUTOS_PARA_CALIFICAR en 0 (modo prueba) solo una entrega "a futuro" cuenta como pronto
        preparar({ entregado: hace(-30 * 60 * 1000) });
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
