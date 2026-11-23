jest.mock('../../src/models', () => ({
    Producto: { findAll: jest.fn() },
    ProductoTamanio: {},
}));

const { Producto } = require('../../src/models');
const { precioMasBarato } = require('../../src/utils/combo');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('precioMasBarato', () => {
    test('devuelve el menor precio de los productos de la categoría en ese tamaño', async () => {
        Producto.findAll.mockResolvedValue([
            { tamanios: [{ precio: '900' }, { precio: '1100' }] },
            { tamanios: [{ precio: '700' }] },
        ]);

        const precio = await precioMasBarato(3, 2);

        expect(Producto.findAll).toHaveBeenCalledWith({
            where: { categoriaId: 3 },
            include: [{
                model: expect.anything(),
                as: 'tamanios',
                where: { tamanioId: 2 },
                required: true,
            }],
            transaction: undefined,
        });
        expect(precio).toBe(700);
    });

    test('acepta una transacción', async () => {
        Producto.findAll.mockResolvedValue([]);
        const transaction = { id: 'tx' };

        await precioMasBarato(3, 2, transaction);

        expect(Producto.findAll.mock.calls[0][0].transaction).toBe(transaction);
    });

    test('devuelve null si no hay precios', async () => {
        Producto.findAll.mockResolvedValue([]);

        expect(await precioMasBarato(3, 2)).toBeNull();
    });

    test('ignora productos sin arreglo de tamaños', async () => {
        Producto.findAll.mockResolvedValue([{}]);

        expect(await precioMasBarato(3, 2)).toBeNull();
    });
});
