jest.mock('../../../src/models', () => {
    const t = { commit: jest.fn(), rollback: jest.fn() };
    return {
        Producto: { findAll: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
        RecetaInsumo: { destroy: jest.fn(), bulkCreate: jest.fn() },
        Insumo: { count: jest.fn() },
        ProductoTamanio: { destroy: jest.fn(), bulkCreate: jest.fn() },
        Tamanio: { count: jest.fn() },
        ComboGrupo: { destroy: jest.fn(), bulkCreate: jest.fn(), count: jest.fn() },
        Sucursal: { findAll: jest.fn() },
        StockSucursal: { findAll: jest.fn() },
        DetallePedido: {},
        sequelize: { transaction: jest.fn().mockResolvedValue(t) },
        __t: t,
    };
});

const models = require('../../../src/models');
const {
    obtenerProductos,
    obtenerProductoPorId,
    crearProducto,
    editarProductoPorId,
    eliminarProducto,
    verStockProducto,
} = require('../../../src/controllers/admin/productoController');

const { Producto, RecetaInsumo, Insumo, ComboGrupo, Sucursal, StockSucursal, sequelize } = models;
const t = models.__t;

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

// Un producto completo, como lo devuelve Sequelize con sus partes
const deLaBase = (datos) => ({ ...datos, toJSON: () => datos });
const completo = deLaBase({
    id: 1,
    ...datosProducto,
    RecetaInsumos: [
        { insumoId: 10, cantidadBase: '1', esRemovible: false, esAgregable: false, Insumo: { nombre: 'Pan', unidadMedida: 'unidad' } },
        { insumoId: 20, cantidadBase: '2', esRemovible: true, esAgregable: true, Insumo: { nombre: 'Cheddar', unidadMedida: 'unidad' } },
    ],
    tamanios: [],
    grupos: [],
});

const receta = [{ insumoId: 10, cantidadBase: 1, esRemovible: false, esAgregable: false }];

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('obtenerProductos', () => {
    test('devuelve los productos con su receta en el formato del panel', async () => {
        Producto.findAll.mockResolvedValue([completo]);
        const res = crearRes();

        await obtenerProductos({}, res);

        const producto = res.json.mock.calls[0][0][0];
        expect(producto).toMatchObject({ id: 1, nombre: 'Clásica', tamanios: [], grupos: [] });
        expect(producto.receta[1]).toEqual({
            insumoId: 20, nombre: 'Cheddar', unidadMedida: 'unidad', cantidadBase: 2, esRemovible: true, esAgregable: true,
        });
        expect(producto).not.toHaveProperty('RecetaInsumos');
    });

    test('responde 500 si falla la base de datos', async () => {
        Producto.findAll.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await obtenerProductos({}, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('obtenerProductoPorId', () => {
    test('devuelve el producto completo', async () => {
        Producto.findByPk.mockResolvedValue(completo);
        const res = crearRes();

        await obtenerProductoPorId({ params: { id: '1' } }, res);

        expect(res.json.mock.calls[0][0]).toMatchObject({ id: 1, nombre: 'Clásica' });
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
    test('crea el producto y su receta en una transacción, y responde 201', async () => {
        Insumo.count.mockResolvedValue(1);
        Producto.create.mockResolvedValue({ id: 1 });
        Producto.findByPk.mockResolvedValue(completo);
        const res = crearRes();

        await crearProducto({ body: { ...datosProducto, receta } }, res);

        expect(Producto.create).toHaveBeenCalledWith(datosProducto, { transaction: t });
        expect(RecetaInsumo.bulkCreate).toHaveBeenCalledWith([{ ...receta[0], productoId: 1 }], { transaction: t });
        expect(t.commit).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('rechaza una receta con un insumo que no existe, sin abrir la transacción', async () => {
        Insumo.count.mockResolvedValue(0);
        const res = crearRes();

        await crearProducto({ body: { ...datosProducto, receta } }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ code: 'Alguno de los insumos de la receta no existe' });
        expect(sequelize.transaction).not.toHaveBeenCalled();
    });

    test('rechaza un combo cuya opción incluida es de otra categoría', async () => {
        Producto.findByPk.mockResolvedValue({ id: 7, categoriaId: 3 });
        const res = crearRes();

        await crearProducto({
            body: { ...datosProducto, grupos: [{ nombre: 'Bebida', categoriaId: 5, productoIncluidoId: 7 }] },
        }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ code: 'La opción incluida de "Bebida" tiene que ser de la categoría del grupo' });
    });

    test('si falla al guardar, deshace todo y responde 500', async () => {
        Producto.create.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await crearProducto({ body: datosProducto }, res);

        expect(t.rollback).toHaveBeenCalled();
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

    test('si solo cambian los datos, la receta no se toca', async () => {
        const producto = { id: 1, update: jest.fn() };
        Producto.findByPk.mockResolvedValueOnce(producto).mockResolvedValueOnce(completo);
        const res = crearRes();

        await editarProductoPorId({ params: { id: '1' }, body: { ...datosProducto, precio: 5500 } }, res);

        expect(producto.update).toHaveBeenCalledWith({ ...datosProducto, precio: 5500 }, { transaction: t });
        expect(RecetaInsumo.destroy).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('si viene la receta, la reemplaza', async () => {
        Insumo.count.mockResolvedValue(1);
        const producto = { id: 1, update: jest.fn() };
        Producto.findByPk.mockResolvedValueOnce(producto).mockResolvedValueOnce(completo);
        const res = crearRes();

        await editarProductoPorId({ params: { id: '1' }, body: { ...datosProducto, receta } }, res);

        expect(RecetaInsumo.destroy).toHaveBeenCalledWith({ where: { productoId: 1 }, transaction: t });
        expect(RecetaInsumo.bulkCreate).toHaveBeenCalled();
    });

    test('un combo no puede incluirse a sí mismo', async () => {
        Producto.findByPk.mockResolvedValue({ id: 1, update: jest.fn() });
        const res = crearRes();

        await editarProductoPorId({
            params: { id: '1' },
            body: { ...datosProducto, grupos: [{ nombre: 'Combo', categoriaId: 1, productoIncluidoId: 1 }] },
        }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ code: 'Un combo no puede incluirse a sí mismo' });
    });

    test('responde 500 si falla la base de datos', async () => {
        Producto.findByPk.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await editarProductoPorId({ params: { id: '1' }, body: datosProducto }, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('eliminarProducto (borrado lógico)', () => {
    test('responde 404 si no existe', async () => {
        Producto.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await eliminarProducto({ params: { id: '99' } }, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('lo elimina (destroy marca la fecha, no borra la fila) y responde 200', async () => {
        const producto = { id: 1, destroy: jest.fn() };
        Producto.findByPk.mockResolvedValue(producto);
        ComboGrupo.count.mockResolvedValue(0);
        const res = crearRes();

        await eliminarProducto({ params: { id: '1' } }, res);

        expect(producto.destroy).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('no elimina la opción incluida de un combo a la venta', async () => {
        const producto = { id: 1, destroy: jest.fn() };
        Producto.findByPk.mockResolvedValue(producto);
        ComboGrupo.count.mockResolvedValue(1);
        const res = crearRes();

        await eliminarProducto({ params: { id: '1' } }, res);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(producto.destroy).not.toHaveBeenCalled();
    });

    test('responde 500 si falla la base de datos', async () => {
        Producto.findByPk.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await eliminarProducto({ params: { id: '1' } }, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('verStockProducto', () => {
    test('calcula, por sucursal, cuántas unidades se pueden preparar y qué insumo limita', async () => {
        Producto.findByPk.mockResolvedValue(completo); // 1 pan y 2 cheddar por unidad
        Sucursal.findAll.mockResolvedValue([{ id: 1, nombre: 'Centro' }, { id: 2, nombre: 'Morón' }]);
        StockSucursal.findAll.mockResolvedValue([
            { sucursalId: 1, insumoId: 10, cantidad: '10' }, // pan para 10
            { sucursalId: 1, insumoId: 20, cantidad: '7' },  // cheddar para 3
            { sucursalId: 2, insumoId: 10, cantidad: '0' },  // sin pan
            { sucursalId: 2, insumoId: 20, cantidad: '50' },
        ]);
        const res = crearRes();

        await verStockProducto({ params: { id: '1' } }, res);

        expect(res.json.mock.calls[0][0].sucursales).toEqual([
            { id: 1, nombre: 'Centro', unidades: 3, limitante: 'Cheddar' },
            { id: 2, nombre: 'Morón', unidades: 0, limitante: 'Pan' },
        ]);
    });

    test('un producto sin receta lo informa', async () => {
        Producto.findByPk.mockResolvedValue(deLaBase({ id: 2, nombre: 'Agua', RecetaInsumos: [], tamanios: [], grupos: [] }));
        Sucursal.findAll.mockResolvedValue([{ id: 1, nombre: 'Centro' }]);
        const res = crearRes();

        await verStockProducto({ params: { id: '2' } }, res);

        expect(res.json.mock.calls[0][0].sinReceta).toBe(true);
    });

    test('responde 404 si no existe', async () => {
        Producto.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await verStockProducto({ params: { id: '99' } }, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });
});