jest.mock('../../../src/utils/menu', () => ({
    cargarMenu: jest.fn(),
    aGrupoMenu: jest.requireActual('../../../src/utils/menu').aGrupoMenu,
}));
jest.mock('../../../src/models', () => ({
    MenuGrupo: { destroy: jest.fn(), create: jest.fn() },
    MenuGrupoCategoria: { bulkCreate: jest.fn() },
    MenuSeccion: { create: jest.fn() },
    MenuSeccionProducto: { bulkCreate: jest.fn() },
    Categoria: { findAll: jest.fn() },
    Producto: { findAll: jest.fn() },
    sequelize: { transaction: jest.fn() },
}));

const models = require('../../../src/models');
const { cargarMenu } = require('../../../src/utils/menu');
const { obtenerMenu, guardarMenu } = require('../../../src/controllers/admin/menuController');

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

const seccion = (extra = {}) => ({
    slug: 'carne-vacuna', nombre: 'Carne de Res', activo: true, icono: 'hamburguesa', fondo: 'mostaza',
    categoriaId: 2, esPorDefecto: false, productoIds: [], ...extra,
});
const grupo = (extra = {}) => ({
    slug: 'hamburguesas', nombre: 'Hamburguesas', activo: true, porSecciones: true, categoriaIds: [2], secciones: [seccion()], ...extra,
});

let t;

beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    t = { commit: jest.fn(), rollback: jest.fn() };
    models.sequelize.transaction.mockResolvedValue(t);
    models.Categoria.findAll.mockResolvedValue([{ id: 2 }]);
    models.Producto.findAll.mockResolvedValue([]);
    models.MenuGrupo.create.mockResolvedValue({ id: 1 });
    models.MenuSeccion.create.mockResolvedValue({ id: 10 });
    cargarMenu.mockResolvedValue([]);
});

describe('obtenerMenu (panel)', () => {
    test('pide todo el menú, también lo deshabilitado', async () => {
        cargarMenu.mockResolvedValue([]);
        const res = crearRes();

        await obtenerMenu({}, res);

        expect(cargarMenu).toHaveBeenCalledWith({ soloActivos: false });
        expect(res.json).toHaveBeenCalledWith({ grupos: [] });
    });

    test('responde 500 si falla la base de datos', async () => {
        cargarMenu.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();
        await obtenerMenu({}, res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('guardarMenu', () => {
    test('reemplaza el menú: borra lo anterior y crea grupos y secciones en el orden recibido', async () => {
        const res = crearRes();
        const body = { grupos: [grupo({ slug: 'a' }), grupo({ slug: 'b', secciones: [seccion({ slug: 'x' }), seccion({ slug: 'y' })] })] };

        await guardarMenu({ body }, res);

        expect(models.MenuGrupo.destroy).toHaveBeenCalledWith({ where: {}, transaction: t });
        expect(models.MenuGrupo.create.mock.calls.map((c) => [c[0].slug, c[0].orden])).toEqual([['a', 10], ['b', 20]]);
        expect(models.MenuSeccion.create.mock.calls.map((c) => [c[0].slug, c[0].orden])).toEqual([['carne-vacuna', 10], ['x', 10], ['y', 20]]);
        expect(models.MenuGrupoCategoria.bulkCreate).toHaveBeenCalledWith([{ grupoId: 1, categoriaId: 2 }], { transaction: t });
        expect(t.commit).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('cada grupo con secciones queda con una sola por defecto: la marcada, o la primera habilitada', async () => {
        await guardarMenu({ body: { grupos: [grupo({ secciones: [seccion({ slug: 'a', activo: false }), seccion({ slug: 'b' }), seccion({ slug: 'c' })] })] } }, crearRes());

        expect(models.MenuSeccion.create.mock.calls.map((c) => [c[0].slug, c[0].esPorDefecto])).toEqual([['a', false], ['b', true], ['c', false]]);
    });

    test('si hay varias marcadas por defecto, queda la primera', async () => {
        await guardarMenu({ body: { grupos: [grupo({ secciones: [seccion({ slug: 'a' }), seccion({ slug: 'b', esPorDefecto: true }), seccion({ slug: 'c', esPorDefecto: true })] })] } }, crearRes());

        expect(models.MenuSeccion.create.mock.calls.map((c) => c[0].esPorDefecto)).toEqual([false, true, false]);
    });

    test('guarda los productos a mano en el orden recibido, de a 10', async () => {
        models.Producto.findAll.mockResolvedValue([{ id: 7 }, { id: 5 }]);

        await guardarMenu({ body: { grupos: [grupo({ secciones: [seccion({ productoIds: [7, 5] })] })] } }, crearRes());

        expect(models.MenuSeccionProducto.bulkCreate).toHaveBeenCalledWith(
            [{ seccionId: 10, productoId: 7, orden: 10 }, { seccionId: 10, productoId: 5, orden: 20 }],
            { transaction: t }
        );
    });

    test('un producto puede estar en dos secciones', async () => {
        models.Producto.findAll.mockResolvedValue([{ id: 7 }]);
        const secciones = [seccion({ slug: 'a', productoIds: [7] }), seccion({ slug: 'b', productoIds: [7] })];

        const res = crearRes();
        await guardarMenu({ body: { grupos: [grupo({ secciones })] } }, res);

        expect(models.MenuSeccionProducto.bulkCreate).toHaveBeenCalledTimes(2);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('responde 400 y no toca nada si alguna categoría no existe', async () => {
        models.Categoria.findAll.mockResolvedValue([]);
        const res = crearRes();

        await guardarMenu({ body: { grupos: [grupo()] } }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(models.MenuGrupo.destroy).not.toHaveBeenCalled();
        expect(t.rollback).toHaveBeenCalled();
    });

    test('responde 400 si algún producto no existe o fue eliminado', async () => {
        models.Producto.findAll.mockResolvedValue([]);
        const res = crearRes();

        await guardarMenu({ body: { grupos: [grupo({ secciones: [seccion({ productoIds: [99] })] })] } }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json.mock.calls[0][0].mensaje).toMatch(/producto/);
        expect(models.MenuGrupo.destroy).not.toHaveBeenCalled();
    });

    test('responde 500 y deshace todo si falla la base de datos', async () => {
        models.MenuGrupo.create.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await guardarMenu({ body: { grupos: [grupo()] } }, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(t.rollback).toHaveBeenCalled();
        expect(t.commit).not.toHaveBeenCalled();
    });
});
