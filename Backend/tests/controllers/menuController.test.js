jest.mock('../../src/utils/menu', () => ({
    cargarMenu: jest.fn(),
    aGrupoMenu: jest.requireActual('../../src/utils/menu').aGrupoMenu,
}));
jest.mock('../../src/models', () => ({
    MenuGrupo: {}, MenuGrupoCategoria: {}, MenuSeccion: {}, MenuSeccionProducto: {},
}));

const { cargarMenu } = require('../../src/utils/menu');
const { obtenerMenu } = require('../../src/controllers/menuController');

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

// Un grupo como lo devuelve Sequelize
const grupoGuardado = {
    id: 1, slug: 'hamburguesas', nombre: 'Hamburguesas', porSecciones: false, activo: true,
    categorias: [{ categoriaId: 2 }],
    secciones: [
        { id: 12, slug: 'pollo', nombre: 'Carne de Pollo', activo: true, icono: 'hamburguesa', fondo: 'mostaza', categoriaId: null, esPorDefecto: false, orden: 20,
            productos: [{ productoId: 9, orden: 20 }, { productoId: 8, orden: 10 }] },
        { id: 11, slug: 'carne-vacuna', nombre: 'Carne de Res', activo: true, icono: null, fondo: null, categoriaId: 2, esPorDefecto: true, orden: 10, productos: [] },
    ],
};

beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('obtenerMenu (público)', () => {
    test('pide solo lo habilitado', async () => {
        cargarMenu.mockResolvedValue([]);
        await obtenerMenu({}, crearRes());
        expect(cargarMenu).toHaveBeenCalledWith({ soloActivos: true });
    });

    test('devuelve los grupos con ids de categorías, secciones en orden y productos a mano en orden', async () => {
        cargarMenu.mockResolvedValue([grupoGuardado]);
        const res = crearRes();

        await obtenerMenu({}, res);

        const { grupos } = res.json.mock.calls[0][0];
        expect(grupos).toHaveLength(1);
        expect(grupos[0]).toMatchObject({ id: 1, slug: 'hamburguesas', nombre: 'Hamburguesas', categoriaIds: [2] });
        expect(grupos[0].secciones.map((s) => s.slug)).toEqual(['carne-vacuna', 'pollo']);
        expect(grupos[0].secciones[1].productoIds).toEqual([8, 9]);
        expect(grupos[0].secciones[0]).toMatchObject({ categoriaId: 2, esPorDefecto: true, icono: null });
    });

    test('responde 500 si falla la base de datos', async () => {
        cargarMenu.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();
        await obtenerMenu({}, res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});
