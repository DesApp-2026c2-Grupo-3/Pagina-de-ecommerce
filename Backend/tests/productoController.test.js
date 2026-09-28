jest.mock('../src/models', () => ({
    Producto: { findAll: jest.fn(), findByPk: jest.fn() },
    RecetaInsumo: {},
    Insumo: {},
}));

const { Producto } = require('../src/models');
const { obtenerProductos, obtenerProductoPorId } = require('../src/controllers/productoController');

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
    test('devuelve la lista de productos', async () => {
        const productos = [{ id: 1, nombre: 'Clásica' }];
        Producto.findAll.mockResolvedValue(productos);
        const res = crearRes();

        await obtenerProductos({}, res);

        expect(res.json).toHaveBeenCalledWith(productos);
    });

    test('responde 500 si falla la base de datos', async () => {
        Producto.findAll.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await obtenerProductos({}, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('obtenerProductoPorId', () => {
    test('responde 404 si el producto no existe', async () => {
        Producto.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await obtenerProductoPorId({ params: { id: '99' } }, res);

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
                    insumoId: 3, cantidadBase: '0.5', esRemovible: true, esAgregable: true,
                    Insumo: { nombre: 'Cheddar', unidadMedida: 'feta', precioComercial: '500' },
                },
            ],
        }));
        const res = crearRes();

        await obtenerProductoPorId({ params: { id: '10' } }, res);

        const respuesta = res.json.mock.calls[0][0];
        expect(respuesta.nombre).toBe('Clásica');
        expect(respuesta).not.toHaveProperty('RecetaInsumos'); // el formato interno no se expone
        expect(respuesta.ingredientes).toEqual([
            {
                insumoId: 1, nombre: 'Pan', unidadMedida: 'unidad', cantidadBase: 1,
                esRemovible: false, esAgregable: false, precioComercial: 0, // null → 0
            },
            {
                insumoId: 3, nombre: 'Cheddar', unidadMedida: 'feta', cantidadBase: 0.5, // texto → número
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

        await obtenerProductoPorId({ params: { id: '10' } }, res);

        expect(res.json.mock.calls[0][0].ingredientes[0]).toMatchObject({
            nombre: null,
            unidadMedida: null,
            precioComercial: 0,
        });
    });

    test('un producto sin receta devuelve ingredientes vacío', async () => {
        Producto.findByPk.mockResolvedValue(productoDeLaBase({ id: 10, nombre: 'Agua' }));
        const res = crearRes();

        await obtenerProductoPorId({ params: { id: '10' } }, res);

        expect(res.json.mock.calls[0][0].ingredientes).toEqual([]);
    });

    test('responde 500 si falla la base de datos', async () => {
        Producto.findByPk.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await obtenerProductoPorId({ params: { id: '10' } }, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});