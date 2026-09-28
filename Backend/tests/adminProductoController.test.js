jest.mock('../src/models', () => ({
    Producto: { findAll: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
}));

const { Producto } = require('../src/models');
const {
    obtenerProductos,
    obtenerProductoPorId,
    crearProducto,
    editarProductoPorId,
    eliminarProducto,
} = require('../src/controllers/admin/productoController');

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

const datosProducto = {
    nombre: 'Clásica',
    descripcion: 'Carne y queso',
    precio: 5000,
    imagen: '/img/clasica.png',
    disponible: true,
    categoriaId: 1,
};

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('obtenerProductos', () => {
    test('devuelve la lista de productos', async () => {
        const productos = [{ id: 1, ...datosProducto }];
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
    test('devuelve el producto', async () => {
        const producto = { id: 1, ...datosProducto };
        Producto.findByPk.mockResolvedValue(producto);
        const res = crearRes();

        await obtenerProductoPorId({ params: { id: '1' } }, res);

        expect(res.json).toHaveBeenCalledWith(producto);
    });

    test('responde 404 si no existe', async () => {
        Producto.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await obtenerProductoPorId({ params: { id: '99' } }, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('responde 500 si falla la base de datos', async () => {
        Producto.findByPk.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await obtenerProductoPorId({ params: { id: '1' } }, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('crearProducto', () => {
    test('crea el producto con sus datos y responde 201', async () => {
        Producto.create.mockResolvedValue({ id: 1, ...datosProducto });
        const res = crearRes();

        await crearProducto({ body: datosProducto }, res);

        expect(Producto.create).toHaveBeenCalledWith(datosProducto);
        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('responde 500 si falla la base de datos', async () => {
        Producto.create.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await crearProducto({ body: datosProducto }, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('editarProductoPorId', () => {
    test('responde 404 si no existe', async () => {
        Producto.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await editarProductoPorId({ params: { id: '99' }, body: datosProducto }, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('actualiza el producto y responde 200', async () => {
        const producto = { update: jest.fn().mockResolvedValue({ id: 1, ...datosProducto }) };
        Producto.findByPk.mockResolvedValue(producto);
        const res = crearRes();

        await editarProductoPorId({ params: { id: '1' }, body: { ...datosProducto, precio: 5500 } }, res);

        expect(producto.update).toHaveBeenCalledWith({ ...datosProducto, precio: 5500 });
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('responde 500 si falla la base de datos', async () => {
        Producto.findByPk.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await editarProductoPorId({ params: { id: '1' }, body: datosProducto }, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('eliminarProducto', () => {
    test('responde 404 si no existe', async () => {
        Producto.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await eliminarProducto({ params: { id: '99' } }, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('elimina el producto y responde 200', async () => {
        const producto = { destroy: jest.fn() };
        Producto.findByPk.mockResolvedValue(producto);
        const res = crearRes();

        await eliminarProducto({ params: { id: '1' } }, res);

        expect(producto.destroy).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('responde 500 si falla la base de datos', async () => {
        Producto.findByPk.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await eliminarProducto({ params: { id: '1' } }, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});