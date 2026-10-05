jest.mock('../../../src/models', () => ({
    Categoria: { findAll: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
}));

const { Categoria } = require('../../../src/models');
const {
    obtenerCategorias,
    crearCategoria,
    editarCategoriaPorId,
    eliminarCategorias,
} = require('../../../src/controllers/admin/categoriaController');

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
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

        expect(Categoria.create).toHaveBeenCalledWith({ nombre: 'Postres' });
        expect(res.status).toHaveBeenCalledWith(201);
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

        expect(categoria.update).toHaveBeenCalledWith({ nombre: 'Postres' });
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('responde 500 si falla la base de datos', async () => {
        Categoria.findByPk.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await editarCategoriaPorId({ params: { id: '3' }, body: { nombre: 'Postres' } }, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('eliminarCategorias', () => {
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