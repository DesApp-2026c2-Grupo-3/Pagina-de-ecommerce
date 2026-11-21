jest.mock('../../src/models', () => ({
    Producto: { findAll: jest.fn() },
    RecetaInsumo: {},
    ComboGrupo: {},
    Insumo: { findAll: jest.fn() },
}));

const { Producto, Insumo } = require('../../src/models');
const { catalogoDelPedido } = require('../../src/utils/catalogoPedido');

function producto(datos) {
    return { RecetaInsumos: [], grupos: [], productoPrincipalId: null, ...datos };
}

beforeEach(() => {
    jest.clearAllMocks();
    Insumo.findAll.mockResolvedValue([]);
});

describe('catalogoDelPedido', () => {
    test('sin productos ni personalizaciones no consulta la base', async () => {
        const catalogo = await catalogoDelPedido([]);

        expect(catalogo).toEqual({ productos: [], insumos: [] });
        expect(Producto.findAll).not.toHaveBeenCalled();
        expect(Insumo.findAll).not.toHaveBeenCalled();
    });

    test('busca solo lo del pedido, incluidos eliminados, y acepta JSON como texto', async () => {
        Producto.findAll.mockResolvedValue([
            producto({ id: 5, nombre: 'Clásica', RecetaInsumos: [{ insumoId: 3, cantidadBase: '1.00' }] }),
        ]);
        Insumo.findAll.mockResolvedValue([{ id: 3, nombre: 'Cebolla' }]);

        const catalogo = await catalogoDelPedido([
            { productoId: 5, personalizaciones: JSON.stringify([{ insumoId: 3, cantidad: 0 }]), combo: null },
        ]);

        const opciones = Producto.findAll.mock.calls[0][0];
        expect(opciones.where).toEqual({ id: [5] });
        expect(opciones.paranoid).toBe(false);
        expect(Insumo.findAll.mock.calls[0][0]).toMatchObject({ where: { id: [3] }, paranoid: false });
        expect(catalogo).toEqual({
            productos: [{ id: 5, nombre: 'Clásica', receta: [{ insumoId: 3, cantidadBase: 1 }], grupos: [] }],
            insumos: [{ id: 3, nombre: 'Cebolla' }],
        });
    });

    test('un combo usa la receta de su principal y trae sus grupos y las elecciones', async () => {
        Producto.findAll
            .mockResolvedValueOnce([
                producto({
                    id: 20,
                    nombre: 'Combo Clásica',
                    productoPrincipalId: 5,
                    grupos: [{ id: 2, nombre: 'Bebida', orden: 2 }, { id: 1, nombre: 'Papas', orden: 1 }],
                }),
                producto({ id: 31, nombre: 'Papas con cheddar' }),
            ])
            .mockResolvedValueOnce([
                producto({ id: 5, nombre: 'Clásica', RecetaInsumos: [{ insumoId: 9, cantidadBase: 1 }] }),
            ]);

        const catalogo = await catalogoDelPedido([
            {
                productoId: 20,
                personalizaciones: [{ insumoId: 9, cantidad: 2 }],
                combo: { elecciones: [{ grupoId: 1, productoId: 31, recargo: 800 }] },
            },
        ]);

        expect(Producto.findAll.mock.calls[0][0].where).toEqual({ id: [20, 31] });
        expect(Producto.findAll.mock.calls[1][0].where).toEqual({ id: [5] });
        const combo = catalogo.productos.find((p) => p.id === 20);
        expect(combo.receta).toEqual([{ insumoId: 9, cantidadBase: 1 }]);
        expect(combo.grupos).toEqual([{ id: 1, nombre: 'Papas' }, { id: 2, nombre: 'Bebida' }]);
        expect(catalogo.productos.find((p) => p.id === 31).nombre).toBe('Papas con cheddar');
    });
});
