jest.mock('../../src/models', () => ({
    Pedido: { findByPk: jest.fn() },
    DetallePedido: {},
    Producto: { findByPk: jest.fn() },
    ProductoTamanio: {},
    Tamanio: {},
    RecetaInsumo: {},
    Insumo: {},
    ComboGrupo: {},
    StockSucursal: { findAll: jest.fn() },
    Sucursal: { findByPk: jest.fn() },
}));

jest.mock('../../src/utils/combo', () => ({
    precioMasBarato: jest.fn(),
}));

const {
    Pedido,
    Producto,
    StockSucursal,
    Sucursal,
} = require('../../src/models');
const { precioMasBarato } = require('../../src/utils/combo');
const { repetirPedido } = require('../../src/controllers/repetirPedidoController');

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

function crearPedido(detalles = [detalle()], usuarioId = 1) {
    return { usuarioId, DetallePedidos: detalles };
}

function detalle(over = {}) {
    return {
        productoId: 1,
        cantidad: 2,
        tamanioId: null,
        personalizaciones: [],
        combo: { elecciones: [] },
        precio: '2000',
        ...over,
    };
}

function producto(over = {}) {
    return {
        id: 1,
        nombre: 'Clásica',
        disponible: true,
        precio: '1000',
        categoriaId: 1,
        tamanios: [],
        RecetaInsumos: [],
        grupos: [],
        ...over,
    };
}

function setProductos(lista) {
    const mapa = new Map(lista.map((p) => [p.id, p]));
    Producto.findByPk.mockImplementation((id) => Promise.resolve(mapa.get(id) ?? null));
}

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    Pedido.findByPk.mockResolvedValue(crearPedido());
    Sucursal.findByPk.mockResolvedValue(null);
    StockSucursal.findAll.mockResolvedValue([]);
    precioMasBarato.mockResolvedValue(null);
    setProductos([producto()]);
});

describe('repetirPedido', () => {
    test('responde 404 si el pedido no existe', async () => {
        Pedido.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await repetirPedido({ params: { id: 99 }, query: { usuarioId: '1' } }, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Pedido no encontrado' });
    });

    test('responde 404 si el pedido es de otro usuario', async () => {
        Pedido.findByPk.mockResolvedValue(crearPedido([detalle()], 2));
        const res = crearRes();

        await repetirPedido({ params: { id: 1 }, query: { usuarioId: '1' } }, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('reconstruye una línea simple con el precio actual', async () => {
        const res = crearRes();

        await repetirPedido({ params: { id: 1 }, query: { usuarioId: '1' } }, res);

        expect(res.json).toHaveBeenCalledWith({
            disponibles: [{
                productoId: 1,
                cantidad: 2,
                tamanioId: null,
                personalizaciones: [],
                combo: [],
                unitPrice: 1000,
                precioAnterior: 2000,
                selectedOptions: [],
                aviso: null,
            }],
            noDisponibles: [],
        });
    });

    test('tolera personalizaciones y combo ausentes', async () => {
        Pedido.findByPk.mockResolvedValue(crearPedido([
            detalle({ personalizaciones: undefined, combo: undefined }),
        ]));
        const res = crearRes();

        await repetirPedido({ params: { id: 1 }, query: { usuarioId: '1' } }, res);

        expect(res.json.mock.calls[0][0].disponibles[0].selectedOptions).toEqual([]);
    });

    test('informa el nombre del producto eliminado', async () => {
        Producto.findByPk
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({ nombre: 'Viejo Producto' });
        const res = crearRes();

        await repetirPedido({ params: { id: 1 }, query: { usuarioId: '1' } }, res);

        expect(res.json.mock.calls[0][0].noDisponibles).toEqual([{
            nombre: 'Viejo Producto',
            cantidad: 2,
            motivo: 'Ya no se vende',
        }]);
        expect(Producto.findByPk).toHaveBeenLastCalledWith(1, {
            paranoid: false,
            attributes: ['nombre'],
        });
    });

    test('usa un nombre genérico si tampoco existe el producto eliminado', async () => {
        Producto.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await repetirPedido({ params: { id: 1 }, query: { usuarioId: '1' } }, res);

        expect(res.json.mock.calls[0][0].noDisponibles[0].nombre).toBe('Un producto');
    });

    test('informa si el producto está pausado', async () => {
        setProductos([producto({ disponible: false })]);
        const res = crearRes();

        await repetirPedido({ params: { id: 1 }, query: { usuarioId: '1' } }, res);

        expect(res.json.mock.calls[0][0].noDisponibles[0].motivo)
            .toBe('No está disponible por el momento');
    });

    test('informa si el tamaño ya no existe', async () => {
        setProductos([producto({ tamanios: [{ tamanioId: 2, precio: '1500' }] })]);
        const res = crearRes();

        await repetirPedido({ params: { id: 1 }, query: { usuarioId: '1', } }, res);

        expect(res.json.mock.calls[0][0].noDisponibles[0].motivo)
            .toBe('Ya no se vende en ese tamaño');
    });

    test('usa el precio del tamaño elegido', async () => {
        setProductos([producto({ tamanios: [{ tamanioId: 2, precio: '1500', factorStock: 1 }] })]);
        Pedido.findByPk.mockResolvedValue(crearPedido([detalle({ tamanioId: 2 })]));
        const res = crearRes();

        await repetirPedido({ params: { id: 1 }, query: { usuarioId: '1' } }, res);

        const linea = res.json.mock.calls[0][0].disponibles[0];
        expect(linea.tamanioId).toBe(2);
        expect(linea.unitPrice).toBe(1500);
    });

    test('filtra personalizaciones inválidas y calcula los extras', async () => {
        setProductos([producto({
            RecetaInsumos: [
                {
                    insumoId: 10,
                    cantidadBase: '2',
                    esRemovible: true,
                    esAgregable: true,
                    Insumo: { nombre: 'Queso', precioComercial: '100' },
                },
                {
                    insumoId: 20,
                    cantidadBase: '1',
                    esRemovible: false,
                    esAgregable: false,
                    Insumo: { nombre: 'Cebolla', precioComercial: '50' },
                },
                {
                    insumoId: 30,
                    cantidadBase: '1',
                    esRemovible: true,
                    esAgregable: true,
                },
            ],
        })]);
        Pedido.findByPk.mockResolvedValue(crearPedido([detalle({
            personalizaciones: [
                { insumoId: 10, cantidad: 0 },
                { insumoId: 20, cantidad: 0 },
                { insumoId: 30, cantidad: 2 },
                { insumoId: 99, cantidad: 1 },
                { insumoId: 10, cantidad: 2 },
                { insumoId: 10, cantidad: 3 },
                { insumoId: 10, cantidad: 5 },
                { insumoId: 30, cantidad: 0 },
            ],
        })]));
        const res = crearRes();

        await repetirPedido({ params: { id: 1 }, query: { usuarioId: '1' } }, res);

        const linea = res.json.mock.calls[0][0].disponibles[0];
        expect(linea.personalizaciones).toEqual([
            { insumoId: 10, cantidad: 0 },
            { insumoId: 30, cantidad: 2 },
            { insumoId: 10, cantidad: 3 },
            { insumoId: 30, cantidad: 0 },
        ]);
        expect(linea.unitPrice).toBe(1100);
        expect(linea.selectedOptions).toEqual([
            'Sin Queso',
            '1 Ingrediente extra',
            '1 Queso extra',
            'Sin Ingrediente',
        ]);
        expect(linea.aviso).toBe('En Clásica, algunos cambios ya no se pueden pedir');
    });

    test('rechaza un combo si falta una elección obligatoria', async () => {
        setProductos([producto({
            grupos: [{ id: 5, orden: 1, obligatorio: true, categoriaId: 3 }],
        })]);
        const res = crearRes();

        await repetirPedido({ params: { id: 1 }, query: { usuarioId: '1' } }, res);

        expect(res.json.mock.calls[0][0].noDisponibles[0].motivo)
            .toBe('El combo cambió: armalo de nuevo');
    });

    test('ignora una elección opcional que ya no existe', async () => {
        setProductos([producto({
            grupos: [{ id: 5, orden: 1, obligatorio: false, categoriaId: 3 }],
        })]);
        const res = crearRes();

        await repetirPedido({ params: { id: 1 }, query: { usuarioId: '1' } }, res);

        const linea = res.json.mock.calls[0][0].disponibles[0];
        expect(linea.combo).toEqual([]);
        expect(linea.unitPrice).toBe(1000);
    });

    test('informa si la opción elegida ya no existe', async () => {
        setProductos([producto({
            grupos: [{ id: 5, orden: 1, obligatorio: true, categoriaId: 3 }],
        })]);
        Pedido.findByPk.mockResolvedValue(crearPedido([detalle({
            combo: { elecciones: [{ grupoId: 5, productoId: 2 }] },
        })]));
        const res = crearRes();

        await repetirPedido({ params: { id: 1 }, query: { usuarioId: '1' } }, res);

        expect(res.json.mock.calls[0][0].noDisponibles[0].motivo)
            .toBe('Una opción del combo ya no está disponible');
    });

    test('informa si la opción elegida está pausada o cambió de categoría', async () => {
        setProductos([
            producto({
                grupos: [{ id: 5, orden: 1, obligatorio: true, categoriaId: 3 }],
            }),
            { id: 2, nombre: 'Refresco', disponible: true, categoriaId: 9, tamanios: [] },
        ]);
        Pedido.findByPk.mockResolvedValue(crearPedido([detalle({
            combo: { elecciones: [{ grupoId: 5, productoId: 2 }] },
        })]));
        const res = crearRes();

        await repetirPedido({ params: { id: 1 }, query: { usuarioId: '1' } }, res);

        expect(res.json.mock.calls[0][0].noDisponibles[0].motivo)
            .toBe('Refresco ya no está disponible');
    });

    test('informa si la opción elegida ya no se vende en ese tamaño', async () => {
        setProductos([
            producto({
                grupos: [{ id: 5, orden: 1, obligatorio: true, categoriaId: 3 }],
            }),
            {
                id: 2,
                nombre: 'Refresco',
                disponible: true,
                categoriaId: 3,
                tamanios: [{ tamanioId: 2, precio: '300', factorStock: 1 }],
            },
        ]);
        Pedido.findByPk.mockResolvedValue(crearPedido([detalle({
            combo: { elecciones: [{ grupoId: 5, productoId: 2 }] },
        })]));
        const res = crearRes();

        await repetirPedido({ params: { id: 1 }, query: { usuarioId: '1' } }, res);

        expect(res.json.mock.calls[0][0].noDisponibles[0].motivo)
            .toBe('Refresco ya no se vende en ese tamaño');
    });

    test('informa si no hay stock de la opción del combo', async () => {
        setProductos([
            producto({
                grupos: [{ id: 5, orden: 1, obligatorio: true, categoriaId: 3 }],
            }),
            {
                id: 2,
                nombre: 'Refresco',
                disponible: true,
                categoriaId: 3,
                tamanios: [{ tamanioId: null, precio: '300', factorStock: 2 }],
                RecetaInsumos: [{ insumoId: 50, cantidadBase: '1' }],
            },
        ]);
        Sucursal.findByPk.mockResolvedValue({ activa: true });
        StockSucursal.findAll.mockResolvedValue([{ insumoId: 50, cantidad: '1' }]);
        Pedido.findByPk.mockResolvedValue(crearPedido([detalle({
            combo: { elecciones: [{ grupoId: 5, productoId: 2 }] },
        })]));
        const res = crearRes();

        await repetirPedido({ params: { id: 1 }, query: { usuarioId: '1', sucursalId: '3' } }, res);

        expect(res.json.mock.calls[0][0].noDisponibles[0].motivo)
            .toBe('No hay stock de Refresco en tu sucursal');
    });

    test('calcula el recargo del combo contra la opción más barata', async () => {
        setProductos([
            producto({
                grupos: [{ id: 5, orden: 1, obligatorio: true, categoriaId: 3, cobraDiferencia: true }],
            }),
            {
                id: 2,
                nombre: 'Refresco',
                disponible: true,
                categoriaId: 3,
                tamanios: [{ tamanioId: null, precio: '300', factorStock: 1 }],
            },
        ]);
        precioMasBarato.mockResolvedValue(100);
        Pedido.findByPk.mockResolvedValue(crearPedido([detalle({
            combo: { elecciones: [{ grupoId: 5, productoId: 2 }] },
        })]));
        const res = crearRes();

        await repetirPedido({ params: { id: 1 }, query: { usuarioId: '1' } }, res);

        const linea = res.json.mock.calls[0][0].disponibles[0];
        expect(precioMasBarato).toHaveBeenCalledWith(3, null);
        expect(linea.unitPrice).toBe(1200);
        expect(linea.combo).toEqual([{ grupoId: 5, productoId: 2 }]);
        expect(linea.selectedOptions).toEqual(['Refresco (+$200)']);
    });

    test('no cobra recargo si el grupo no cobra diferencia', async () => {
        setProductos([
            producto({
                grupos: [{ id: 5, orden: 1, obligatorio: true, categoriaId: 3, cobraDiferencia: false }],
            }),
            {
                id: 2,
                nombre: 'Refresco',
                disponible: true,
                categoriaId: 3,
                tamanios: [{ tamanioId: null, precio: '300', factorStock: 1 }],
            },
        ]);
        Pedido.findByPk.mockResolvedValue(crearPedido([detalle({
            combo: { elecciones: [{ grupoId: 5, productoId: 2 }] },
        })]));
        const res = crearRes();

        await repetirPedido({ params: { id: 1 }, query: { usuarioId: '1' } }, res);

        const linea = res.json.mock.calls[0][0].disponibles[0];
        expect(precioMasBarato).not.toHaveBeenCalled();
        expect(linea.unitPrice).toBe(1000);
        expect(linea.selectedOptions).toEqual(['Refresco']);
    });

    test('no cobra recargo si no hay precio de referencia', async () => {
        setProductos([
            producto({
                grupos: [{ id: 5, orden: 1, obligatorio: true, categoriaId: 3 }],
            }),
            {
                id: 2,
                nombre: 'Refresco',
                disponible: true,
                categoriaId: 3,
                tamanios: [{ tamanioId: null, precio: '300', factorStock: 1 }],
            },
        ]);
        precioMasBarato.mockResolvedValue(null);
        Pedido.findByPk.mockResolvedValue(crearPedido([detalle({
            combo: { elecciones: [{ grupoId: 5, productoId: 2 }] },
        })]));
        const res = crearRes();

        await repetirPedido({ params: { id: 1 }, query: { usuarioId: '1' } }, res);

        expect(res.json.mock.calls[0][0].disponibles[0].unitPrice).toBe(1000);
    });

    test('informa si no hay stock del producto en la sucursal', async () => {
        setProductos([producto({
            RecetaInsumos: [{ insumoId: 10, cantidadBase: '1' }],
        })]);
        Sucursal.findByPk.mockResolvedValue({ activa: true });
        StockSucursal.findAll.mockResolvedValue([{ insumoId: 10, cantidad: '0' }]);
        const res = crearRes();

        await repetirPedido({ params: { id: 1 }, query: { usuarioId: '1', sucursalId: '3' } }, res);

        expect(res.json.mock.calls[0][0].noDisponibles[0].motivo)
            .toBe('No hay stock en tu sucursal');
    });

    test('no consulta stock si la sucursal está inactiva', async () => {
        setProductos([producto({
            RecetaInsumos: [{ insumoId: 10, cantidadBase: '1' }],
        })]);
        Sucursal.findByPk.mockResolvedValue({ activa: false });
        const res = crearRes();

        await repetirPedido({ params: { id: 1 }, query: { usuarioId: '1', sucursalId: '3' } }, res);

        expect(StockSucursal.findAll).not.toHaveBeenCalled();
        expect(res.json.mock.calls[0][0].disponibles).toHaveLength(1);
    });

    test('aplica el factor de stock del tamaño', async () => {
        setProductos([producto({
            tamanios: [{ tamanioId: 2, precio: '1500', factorStock: 2 }],
            RecetaInsumos: [{ insumoId: 10, cantidadBase: '1' }],
        })]);
        Sucursal.findByPk.mockResolvedValue({ activa: true });
        StockSucursal.findAll.mockResolvedValue([{ insumoId: 10, cantidad: '1' }]);
        Pedido.findByPk.mockResolvedValue(crearPedido([detalle({ tamanioId: 2 })]));
        const res = crearRes();

        await repetirPedido({ params: { id: 1 }, query: { usuarioId: '1', sucursalId: '3' } }, res);

        expect(res.json.mock.calls[0][0].noDisponibles[0].motivo)
            .toBe('No hay stock en tu sucursal');
    });

    test('busca cada producto una sola vez aunque aparezca en varias líneas', async () => {
        Pedido.findByPk.mockResolvedValue(crearPedido([detalle(), detalle()]));
        const res = crearRes();

        await repetirPedido({ params: { id: 1 }, query: { usuarioId: '1' } }, res);

        expect(Producto.findByPk).toHaveBeenCalledTimes(1);
        expect(res.json.mock.calls[0][0].disponibles).toHaveLength(2);
    });

    test('responde 500 si falla la base de datos', async () => {
        Pedido.findByPk.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await repetirPedido({ params: { id: 1 }, query: { usuarioId: '1' } }, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'No se pudo repetir el pedido' });
    });
});
