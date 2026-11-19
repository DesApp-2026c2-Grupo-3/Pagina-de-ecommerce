jest.mock('../../src/models', () => ({
    Promocion: { findByPk: jest.fn() },
    PromocionItem: {},
    Producto: {},
}));

const { Promocion } = require('../../src/models');
const { promoCompleta, aPromoPublica, aPromoAdmin, buscarPromo } = require('../../src/utils/promociones');

const item = (productoId, nombre, cantidad = 1, descuento = 0, orden = 1, deletedAt = null) => ({
    productoId,
    cantidad,
    descuento,
    orden,
    producto: nombre ? { id: productoId, nombre, precio: '1500', deletedAt } : null,
});

const promo = (extra = {}) => ({
    id: 7,
    tipo: 'DIA',
    titulo: 'Miércoles picante',
    destacado: '20%',
    detalle: 'El Combo Spicy Fast con 20 % menos.',
    dias: [3],
    maxPorPedido: null,
    compraMinima: null,
    activo: true,
    items: [item(5, 'Combo Spicy Fast', 1, 0.2)],
    ...extra,
});

beforeEach(() => jest.clearAllMocks());

describe('promoCompleta', () => {
    test('es completa si tiene productos y ninguno fue eliminado', () => {
        expect(promoCompleta(promo())).toBe(true);
    });

    test('no es completa sin productos', () => {
        expect(promoCompleta(promo({ items: [] }))).toBe(false);
    });

    test('no es completa si un producto no está (borrado lógico) o tiene fecha de baja', () => {
        expect(promoCompleta(promo({ items: [item(5, null)] }))).toBe(false);
        expect(promoCompleta(promo({ items: [item(5, 'Combo', 1, 0.2, 1, '2026-10-01')] }))).toBe(false);
    });
});

describe('aPromoPublica', () => {
    test('usa el mismo formato que tenía la configuración fija', () => {
        expect(aPromoPublica(promo())).toEqual({
            id: '7',
            tipo: 'DIA',
            titulo: 'Miércoles picante',
            destacado: '20%',
            detalle: 'El Combo Spicy Fast con 20 % menos.',
            dias: [3],
            items: [{ nombre: 'Combo Spicy Fast', productoId: 5, cantidad: 1, descuento: 0.2 }],
        });
    });

    test('solo agrega los límites que están cargados y los días solo en las promos del día', () => {
        const regalo = aPromoPublica(promo({ tipo: 'REGALO', dias: null, maxPorPedido: 1, compraMinima: 15000 }));
        expect(regalo.maxPorPedido).toBe(1);
        expect(regalo.compraMinima).toBe(15000);
        expect(regalo).not.toHaveProperty('dias');

        const semana = aPromoPublica(promo({ tipo: 'SEMANA', dias: null }));
        expect(semana).not.toHaveProperty('dias');
        expect(semana).not.toHaveProperty('maxPorPedido');
        expect(semana).not.toHaveProperty('compraMinima');
    });

    test('ordena los productos y convierte el descuento a número', () => {
        const resultado = aPromoPublica(promo({
            items: [item(2, 'Papas con cheddar', 1, '0.500', 2), item(1, 'Fast Cheese', 1, '0.000', 1)],
        }));
        expect(resultado.items.map((i) => i.productoId)).toEqual([1, 2]);
        expect(resultado.items[1].descuento).toBe(0.5);
    });
});

describe('aPromoAdmin', () => {
    test('trae el estado, el precio de los productos y marca los eliminados', () => {
        const resultado = aPromoAdmin(promo({
            activo: false,
            items: [item(5, 'Combo Spicy Fast', 1, 0.2), item(6, 'Sprite', 1, 1, 2, '2026-10-01')],
        }));

        expect(resultado).toMatchObject({ id: 7, activo: false, completa: false, dias: [3], maxPorPedido: null, compraMinima: null });
        expect(resultado.items[0]).toEqual({
            productoId: 5, nombre: 'Combo Spicy Fast', precio: 1500, cantidad: 1, descuento: 0.2, eliminado: false,
        });
        expect(resultado.items[1].eliminado).toBe(true);
    });

    test('las promos sin días devuelven una lista vacía', () => {
        expect(aPromoAdmin(promo({ tipo: 'SEMANA', dias: null })).dias).toEqual([]);
    });
});

describe('buscarPromo', () => {
    test('devuelve la promo activa y completa en formato público', async () => {
        Promocion.findByPk.mockResolvedValue(promo());

        const resultado = await buscarPromo('7');

        expect(Promocion.findByPk).toHaveBeenCalledWith(7, expect.any(Object));
        expect(resultado.id).toBe('7');
        expect(resultado.items[0].productoId).toBe(5);
    });

    test.each(['lun-clasico', '0', '-3', '2.5', undefined])('un id inválido (%s) no consulta la base', async (id) => {
        expect(await buscarPromo(id)).toBeNull();
        expect(Promocion.findByPk).not.toHaveBeenCalled();
    });

    test('devuelve null si no existe, está deshabilitada o le falta un producto', async () => {
        Promocion.findByPk.mockResolvedValueOnce(null);
        expect(await buscarPromo(7)).toBeNull();

        Promocion.findByPk.mockResolvedValueOnce(promo({ activo: false }));
        expect(await buscarPromo(7)).toBeNull();

        Promocion.findByPk.mockResolvedValueOnce(promo({ items: [item(5, null)] }));
        expect(await buscarPromo(7)).toBeNull();
    });
});
