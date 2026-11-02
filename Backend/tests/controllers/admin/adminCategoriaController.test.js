jest.mock('../../../src/models', () => ({
    Categoria: { findAll: jest.fn(), findByPk: jest.fn(), create: jest.fn(), max: jest.fn(), count: jest.fn(), update: jest.fn() },
    Producto: { count: jest.fn() },
    sequelize: { transaction: jest.fn() },
}));

const { Categoria, Producto, sequelize } = require('../../../src/models');
const {
    obtenerCategorias,
    crearCategoria,
    editarCategoriaPorId,
    eliminarCategorias,
    obtenerCategoriasCliente,
    ordenarCategorias,
} = require('../../../src/controllers/admin/categoriaController');

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    Categoria.max.mockResolvedValue(70);
    Categoria.count.mockResolvedValue(0);
    Producto.count.mockResolvedValue(0);
});

describe('obtenerCategorias', () => {
    test('devuelve la lista de categorías', async () => {
        const categorias = [{ id: 1, nombre: 'Hamburguesas' }];
        Categoria.findAll.mockResolvedValue(categorias);
        const res = crearRes();

        await obtenerCategorias({}, res);

        expect(res.json).toHaveBeenCalledWith(categorias);
    });

    test('responde 500 si falla la base de datos', async () => {
        Categoria.findAll.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await obtenerCategorias({}, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('crearCategoria', () => {
    test('crea la categoría y responde 201', async () => {
        Categoria.create.mockResolvedValue({ id: 3, nombre: 'Postres' });
        const res = crearRes();

        await crearCategoria({ body: { nombre: 'Postres' } }, res);

        expect(Categoria.create).toHaveBeenCalledWith({
            nombre: 'Postres', categoriaPadreId: null, orden: 80, esComplemento: false,
        });
        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('sin orden, la categoría nueva queda al final de sus hermanas', async () => {
        Categoria.create.mockResolvedValue({ id: 9 });
        Categoria.max.mockResolvedValue(null);

        await crearCategoria({ body: { nombre: 'Brunch' } }, crearRes());

        expect(Categoria.max).toHaveBeenCalledWith('orden', { where: { categoriaPadreId: null, esComplemento: false } });
        expect(Categoria.create.mock.calls[0][0].orden).toBe(10);
    });

    test('respeta el orden y la marca de complemento que llegan', async () => {
        Categoria.create.mockResolvedValue({ id: 9 });

        await crearCategoria({ body: { nombre: 'Salsas', orden: 5, esComplemento: true } }, crearRes());

        expect(Categoria.create).toHaveBeenCalledWith({ nombre: 'Salsas', categoriaPadreId: null, orden: 5, esComplemento: true });
        expect(Categoria.max).not.toHaveBeenCalled();
    });

    test('puede colgar de una categoría principal sin productos', async () => {
        Categoria.findByPk.mockResolvedValue({ id: 6, nombre: 'Cafetería', categoriaPadreId: null });
        Categoria.create.mockResolvedValue({ id: 9 });
        const res = crearRes();

        await crearCategoria({ body: { nombre: 'Brunch', categoriaPadreId: 6 } }, res);

        expect(Categoria.create.mock.calls[0][0].categoriaPadreId).toBe(6);
        expect(res.status).toHaveBeenCalledWith(201);
    });

    test.each([
        ['no existe', null, 0, /no existe/],
        ['ya depende de otra', { id: 6, nombre: 'Café', categoriaPadreId: 2 }, 0, /un solo nivel/],
        ['tiene productos propios', { id: 6, nombre: 'Postres', categoriaPadreId: null }, 4, /tiene productos/],
    ])('responde 400 si la categoría padre %s', async (_motivo, padre, productos, mensaje) => {
        Categoria.findByPk.mockResolvedValue(padre);
        Producto.count.mockResolvedValue(productos);
        const res = crearRes();

        await crearCategoria({ body: { nombre: 'Brunch', categoriaPadreId: 6 } }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json.mock.calls[0][0].mensaje).toMatch(mensaje);
        expect(Categoria.create).not.toHaveBeenCalled();
    });

    test('responde 500 si falla la base de datos', async () => {
        Categoria.create.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await crearCategoria({ body: { nombre: 'Postres' } }, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('editarCategoriaPorId', () => {
    test('responde 404 si la categoría no existe', async () => {
        Categoria.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await editarCategoriaPorId({ params: { id: '99' }, body: { nombre: 'Postres' } }, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('actualiza el nombre y responde 200', async () => {
        const categoria = { update: jest.fn().mockResolvedValue({ id: 3, nombre: 'Postres' }) };
        Categoria.findByPk.mockResolvedValue(categoria);
        const res = crearRes();

        await editarCategoriaPorId({ params: { id: '3' }, body: { nombre: 'Postres' } }, res);

        // Editar solo el nombre no mueve la categoría de lugar ni la cambia de padre
        expect(categoria.update).toHaveBeenCalledWith({ nombre: 'Postres' });
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('cambia el orden y la marca de complemento', async () => {
        const categoria = { id: 3, update: jest.fn().mockResolvedValue({ id: 3 }) };
        Categoria.findByPk.mockResolvedValue(categoria);

        await editarCategoriaPorId({ params: { id: '3' }, body: { nombre: 'Salsas', orden: 90, esComplemento: true } }, crearRes());

        expect(categoria.update).toHaveBeenCalledWith({ nombre: 'Salsas', orden: 90, esComplemento: true });
    });

    test('puede pasar a depender de una categoría principal, o dejar de depender de una', async () => {
        const categoria = { id: 3, update: jest.fn().mockResolvedValue({ id: 3 }) };
        Categoria.findByPk
            .mockResolvedValueOnce(categoria)
            .mockResolvedValueOnce({ id: 6, nombre: 'Cafetería', categoriaPadreId: null });

        await editarCategoriaPorId({ params: { id: '3' }, body: { nombre: 'Café', categoriaPadreId: 6 } }, crearRes());
        expect(categoria.update).toHaveBeenLastCalledWith({ nombre: 'Café', categoriaPadreId: 6 });

        Categoria.findByPk.mockResolvedValueOnce(categoria);
        await editarCategoriaPorId({ params: { id: '3' }, body: { nombre: 'Café', categoriaPadreId: null } }, crearRes());
        expect(categoria.update).toHaveBeenLastCalledWith({ nombre: 'Café', categoriaPadreId: null });
    });

    test('una categoría no puede ser su propio padre', async () => {
        Categoria.findByPk.mockResolvedValue({ id: 3, update: jest.fn() });
        const res = crearRes();

        await editarCategoriaPorId({ params: { id: '3' }, body: { nombre: 'Café', categoriaPadreId: 3 } }, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('una categoría con subcategorías no puede depender de otra', async () => {
        const categoria = { id: 3, update: jest.fn() };
        Categoria.findByPk
            .mockResolvedValueOnce(categoria)
            .mockResolvedValueOnce({ id: 6, nombre: 'Cafetería', categoriaPadreId: null });
        Categoria.count.mockResolvedValue(2);
        const res = crearRes();

        await editarCategoriaPorId({ params: { id: '3' }, body: { nombre: 'Café', categoriaPadreId: 6 } }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json.mock.calls[0][0].mensaje).toMatch(/tiene subcategorías/);
        expect(categoria.update).not.toHaveBeenCalled();
    });

    test('responde 500 si falla la base de datos', async () => {
        Categoria.findByPk.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await editarCategoriaPorId({ params: { id: '3' }, body: { nombre: 'Postres' } }, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('eliminarCategorias', () => {
    test('responde 400 si tiene subcategorías', async () => {
        const categoria = { id: 6, destroy: jest.fn() };
        Categoria.findByPk.mockResolvedValue(categoria);
        Categoria.count.mockResolvedValue(2);
        const res = crearRes();

        await eliminarCategorias({ params: { id: '6' } }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(categoria.destroy).not.toHaveBeenCalled();
    });

    test('responde 404 si la categoría no existe', async () => {
        Categoria.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await eliminarCategorias({ params: { id: '99' } }, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('elimina la categoría y responde 200', async () => {
        const categoria = { destroy: jest.fn() };
        Categoria.findByPk.mockResolvedValue(categoria);
        const res = crearRes();

        await eliminarCategorias({ params: { id: '3' } }, res);

        expect(categoria.destroy).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('responde 500 si falla la base de datos', async () => {
        Categoria.findByPk.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await eliminarCategorias({ params: { id: '3' } }, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});
describe('obtenerCategoriasCliente (Home y catálogo)', () => {
    const fila = (id, nombre, extra = {}) => ({
        id, nombre, activo: true, categoriaPadreId: null, orden: id * 10, esComplemento: false, cantidadProductos: '3', ...extra,
    });

    test('devuelve la lista plana, sin el conteo, con padre, orden y complemento', async () => {
        Categoria.findAll.mockResolvedValue([fila(1, 'Combos'), fila(8, 'Salsas', { esComplemento: true, orden: 90 })]);
        const res = crearRes();

        await obtenerCategoriasCliente({}, res);

        expect(res.json.mock.calls[0][0]).toEqual([
            { id: 1, nombre: 'Combos', activo: true, categoriaPadreId: null, orden: 10, esComplemento: false },
            { id: 8, nombre: 'Salsas', activo: true, categoriaPadreId: null, orden: 90, esComplemento: true },
        ]);
    });

    test('pide solo las activas, con los complementos al final y luego por orden', async () => {
        Categoria.findAll.mockResolvedValue([]);

        await obtenerCategoriasCliente({}, crearRes());

        const opciones = Categoria.findAll.mock.calls[0][0];
        expect(opciones.where).toEqual({ activo: true });
        expect(opciones.order).toEqual([['esComplemento', 'ASC'], ['orden', 'ASC'], ['id', 'ASC']]);
    });

    test('no devuelve las categorías sin productos', async () => {
        Categoria.findAll.mockResolvedValue([fila(1, 'Combos'), fila(2, 'Vacía', { cantidadProductos: '0' })]);
        const res = crearRes();

        await obtenerCategoriasCliente({}, res);

        expect(res.json.mock.calls[0][0].map((c) => c.nombre)).toEqual(['Combos']);
    });

    test('la categoría principal sin productos propios se muestra si alguna hija tiene', async () => {
        Categoria.findAll.mockResolvedValue([
            fila(9, 'Cafetería', { cantidadProductos: '0', orden: 60 }),
            fila(6, 'Café', { categoriaPadreId: 9, orden: 10 }),
            fila(7, 'Menú Café', { categoriaPadreId: 9, orden: 20 }),
            fila(10, 'Brunch', { cantidadProductos: '0' }),
        ]);
        const res = crearRes();

        await obtenerCategoriasCliente({}, res);

        expect(res.json.mock.calls[0][0].map((c) => c.nombre)).toEqual(['Cafetería', 'Café', 'Menú Café']);
    });

    test('responde 500 si falla la base de datos', async () => {
        Categoria.findAll.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await obtenerCategoriasCliente({}, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('ícono y color de la tarjeta', () => {
    test('al crear solo manda el ícono y el color si llegan', async () => {
        Categoria.create.mockResolvedValue({ id: 9 });

        await crearCategoria({ body: { nombre: 'Brunch', orden: 5, icono: 'cafe', fondo: 'rojo' } }, crearRes());

        expect(Categoria.create).toHaveBeenCalledWith({
            nombre: 'Brunch', categoriaPadreId: null, orden: 5, esComplemento: false, icono: 'cafe', fondo: 'rojo',
        });
    });

    test('al editar puede devolverlos al que corresponde por nombre (null)', async () => {
        const categoria = { id: 3, update: jest.fn().mockResolvedValue({ id: 3 }) };
        Categoria.findByPk.mockResolvedValue(categoria);

        await editarCategoriaPorId({ params: { id: '3' }, body: { nombre: 'Combos', icono: null, fondo: 'mostaza' } }, crearRes());

        expect(categoria.update).toHaveBeenCalledWith({ nombre: 'Combos', icono: null, fondo: 'mostaza' });
    });
});

describe('ordenarCategorias', () => {
    beforeEach(() => {
        sequelize.transaction.mockImplementation(async (trabajo) => trabajo('transaccion'));
    });

    test('deja las categorías en el orden recibido, de a 10', async () => {
        Categoria.findAll.mockResolvedValue([{ id: 3 }, { id: 1 }, { id: 2 }]);
        const res = crearRes();

        await ordenarCategorias({ body: { ids: [3, 1, 2] } }, res);

        expect(Categoria.update).toHaveBeenCalledTimes(3);
        expect(Categoria.update).toHaveBeenNthCalledWith(1, { orden: 10 }, { where: { id: 3 }, transaction: 'transaccion' });
        expect(Categoria.update).toHaveBeenNthCalledWith(3, { orden: 30 }, { where: { id: 2 }, transaction: 'transaccion' });
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test.each([
        ['sin lista', {}],
        ['lista vacía', { ids: [] }],
        ['ids repetidos', { ids: [1, 1] }],
        ['ids inválidos', { ids: [1, 'a'] }],
    ])('responde 400 con %s', async (_caso, body) => {
        const res = crearRes();

        await ordenarCategorias({ body }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(Categoria.update).not.toHaveBeenCalled();
    });

    test('responde 404 si alguna categoría no existe', async () => {
        Categoria.findAll.mockResolvedValue([{ id: 3 }]);
        const res = crearRes();

        await ordenarCategorias({ body: { ids: [3, 99] } }, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(Categoria.update).not.toHaveBeenCalled();
    });

    test('responde 500 si falla la base de datos', async () => {
        Categoria.findAll.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await ordenarCategorias({ body: { ids: [1] } }, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});
