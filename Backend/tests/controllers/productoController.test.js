jest.mock('../../src/models', () => ({
    Producto: { findAll: jest.fn(), findByPk: jest.fn() },
    RecetaInsumo: { findAll: jest.fn() },
    Insumo: {},
    ProductoTamanio: {},
    Tamanio: {},
    ComboGrupo: {},
    StockSucursal: { findAll: jest.fn() },
    Sucursal: { findByPk: jest.fn() },
}));

const { Producto, RecetaInsumo, StockSucursal, Sucursal } = require('../../src/models');
const { obtenerProductos, obtenerProductoPorId } = require('../../src/controllers/productoController');

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

// Un producto como lo devuelve Sequelize: los datos se leen con toJSON()
function productoDeLaBase(datos) {
    return { toJSON: () => datos };
}

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('obtenerProductos', () => {
    test('sin sucursal, devuelve la lista de productos como siempre', async () => {
        const productos = [{ id: 1, nombre: 'Clásica' }];
        Producto.findAll.mockResolvedValue(productos);
        const res = crearRes();

        await obtenerProductos({ query: {} }, res);

        expect(res.json).toHaveBeenCalledWith(productos);
        expect(StockSucursal.findAll).not.toHaveBeenCalled();
    });

    test('responde 500 si falla la base de datos', async () => {
        Producto.findAll.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await obtenerProductos({ query: {} }, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });

    describe('con sucursal', () => {
        beforeEach(() => {
            Sucursal.findByPk.mockResolvedValue({ id: 2, activa: true });
            Producto.findAll.mockResolvedValue([
                { id: 1, nombre: 'Clásica', disponible: true, categoriaId: 1 },   // receta: pan y carne
                { id: 2, nombre: 'Agua', disponible: true, categoriaId: 5 },      // sin receta
                { id: 3, nombre: 'Veggie', disponible: false, categoriaId: 1 },   // pausada por el admin
                { id: 4, nombre: 'Combo', disponible: true, categoriaId: 2,       // receta: pan; elige una bebida
                    grupos: [{ categoriaId: 6, obligatorio: true, orden: 1 }] },
                { id: 5, nombre: 'Cola', disponible: true, categoriaId: 6 },      // receta: jarabe
            ]);
            RecetaInsumo.findAll.mockResolvedValue([
                { productoId: 1, insumoId: 10, cantidadBase: '1' },
                { productoId: 1, insumoId: 20, cantidadBase: '1' },
                { productoId: 4, insumoId: 10, cantidadBase: '1' },
                { productoId: 5, insumoId: 30, cantidadBase: '1' },
            ]);
        });

        test('calcula la disponibilidad con el stock de la sucursal', async () => {
            // Hay pan y jarabe, pero se terminó la carne
            StockSucursal.findAll.mockResolvedValue([
                { insumoId: 10, cantidad: '8' },
                { insumoId: 20, cantidad: '0' },
                { insumoId: 30, cantidad: '5' },
            ]);
            const res = crearRes();

            await obtenerProductos({ query: { sucursalId: '2' } }, res);

            const disponibilidad = Object.fromEntries(res.json.mock.calls[0][0].map((p) => [p.nombre, p.disponible]));
            expect(disponibilidad).toEqual({ Clásica: false, Agua: true, Veggie: false, Combo: true, Cola: true });
        });

        test('un combo no está disponible si ninguna opción de un lugar obligatorio lo está', async () => {
            // Hay pan para el combo, pero no hay jarabe para la única bebida
            StockSucursal.findAll.mockResolvedValue([{ insumoId: 10, cantidad: '8' }]);
            const res = crearRes();

            await obtenerProductos({ query: { sucursalId: '2' } }, res);

            const combo = res.json.mock.calls[0][0].find((p) => p.nombre === 'Combo');
            expect(combo.disponible).toBe(false);
        });

        test('consulta solo el stock de esa sucursal', async () => {
            StockSucursal.findAll.mockResolvedValue([]);

            await obtenerProductos({ query: { sucursalId: '2' } }, crearRes());

            expect(StockSucursal.findAll).toHaveBeenCalledWith(expect.objectContaining({ where: { sucursalId: 2 } }));
        });

        test('responde 400 si la sucursal no es un número', async () => {
            const res = crearRes();

            await obtenerProductos({ query: { sucursalId: 'centro' } }, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('responde 404 si la sucursal está inactiva', async () => {
            Sucursal.findByPk.mockResolvedValue({ id: 2, activa: false });
            const res = crearRes();

            await obtenerProductos({ query: { sucursalId: '2' } }, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });
});

describe('obtenerProductoPorId', () => {
    test('responde 404 si el producto no existe', async () => {
        Producto.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await obtenerProductoPorId({ params: { id: '99' }, query: {} }, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Producto no encontrado' });
    });

    test('devuelve el producto con su receta en formato "ingredientes"', async () => {
        Producto.findByPk.mockResolvedValue(productoDeLaBase({
            id: 10,
            nombre: 'Clásica',
            RecetaInsumos: [
                {
                    insumoId: 1, cantidadBase: '1', esRemovible: false, esAgregable: false,
                    Insumo: { nombre: 'Pan', unidadMedida: 'unidad', precioComercial: null },
                },
                {
                    insumoId: 3, cantidadBase: '2', esRemovible: true, esAgregable: true,
                    Insumo: { nombre: 'Cheddar', unidadMedida: 'unidad', precioComercial: '500' },
                },
            ],
        }));
        const res = crearRes();

        await obtenerProductoPorId({ params: { id: '10' }, query: {} }, res);

        const respuesta = res.json.mock.calls[0][0];
        expect(respuesta.nombre).toBe('Clásica');
        expect(respuesta).not.toHaveProperty('RecetaInsumos'); // el formato interno no se expone
        expect(respuesta.ingredientes).toEqual([
            {
                insumoId: 1, nombre: 'Pan', unidadMedida: 'unidad', cantidadBase: 1,
                esRemovible: false, esAgregable: false, precioComercial: 0, // null → 0
            },
            {
                insumoId: 3, nombre: 'Cheddar', unidadMedida: 'unidad', cantidadBase: 2, // texto → número
                esRemovible: true, esAgregable: true, precioComercial: 500,
            },
        ]);
    });

    test('tolera un insumo borrado de la receta', async () => {
        Producto.findByPk.mockResolvedValue(productoDeLaBase({
            id: 10,
            RecetaInsumos: [{ insumoId: 9, cantidadBase: '2', esRemovible: true, esAgregable: false, Insumo: null }],
        }));
        const res = crearRes();

        await obtenerProductoPorId({ params: { id: '10' }, query: {} }, res);

        expect(res.json.mock.calls[0][0].ingredientes[0]).toMatchObject({
            nombre: null,
            unidadMedida: null,
            precioComercial: 0,
        });
    });

    test('un producto sin receta devuelve ingredientes vacío', async () => {
        Producto.findByPk.mockResolvedValue(productoDeLaBase({ id: 10, nombre: 'Agua' }));
        const res = crearRes();

        await obtenerProductoPorId({ params: { id: '10' }, query: {} }, res);

        expect(res.json.mock.calls[0][0].ingredientes).toEqual([]);
    });

    test('con sucursal, informa si hay stock de cada ingrediente y para sus extras', async () => {
        Sucursal.findByPk.mockResolvedValue({ id: 2, activa: true });
        Producto.findByPk.mockResolvedValue(productoDeLaBase({
            id: 10,
            nombre: 'Clásica',
            disponible: true,
            RecetaInsumos: [{
                insumoId: 3, cantidadBase: '1', esRemovible: true, esAgregable: true,
                Insumo: { nombre: 'Cheddar', unidadMedida: 'unidad', precioComercial: '500' },
            }],
        }));
        // Queda 1 cheddar: alcanza para la receta, pero no para un extra
        StockSucursal.findAll.mockResolvedValue([{ insumoId: 3, cantidad: '1' }]);
        const res = crearRes();

        await obtenerProductoPorId({ params: { id: '10' }, query: { sucursalId: '2' } }, res);

        const respuesta = res.json.mock.calls[0][0];
        expect(respuesta.disponible).toBe(true);
        expect(respuesta.ingredientes[0]).toMatchObject({ hayStock: true, hayStockExtra: false });
    });

    test('responde 500 si falla la base de datos', async () => {
        Producto.findByPk.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await obtenerProductoPorId({ params: { id: '10' }, query: {} }, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});