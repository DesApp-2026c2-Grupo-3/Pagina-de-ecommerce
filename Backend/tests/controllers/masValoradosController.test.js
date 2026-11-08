jest.mock('../../src/models', () => ({
    sequelize: { query: jest.fn() },
}));

const { sequelize } = require('../../src/models');
const { obtenerMasValorados } = require('../../src/controllers/masValoradosController');
const { MIN_CALIFICACIONES_RANKING } = require('../../src/config/calificaciones');

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    sequelize.query.mockResolvedValue([]);
});

describe('obtenerMasValorados', () => {
    test('no cuenta los complementos (salsas) ni los comentarios sin estrellas', async () => {
        await obtenerMasValorados({ query: {} }, crearRes());

        const [sql] = sequelize.query.mock.calls[0];
        expect(sql).toMatch(/cat\."esComplemento" = false/);
        expect(sql).toMatch(/c\.puntaje IS NOT NULL/);
        expect(sql).toMatch(/p\."deletedAt" IS NULL/);
    });

    test('usa el límite por defecto, el mínimo de calificaciones y no filtra por sucursal', async () => {
        const res = crearRes();

        await obtenerMasValorados({ query: {} }, res);

        const [sql, opciones] = sequelize.query.mock.calls[0];
        expect(sql).not.toMatch(/:sucursalId/);
        expect(opciones.replacements).toMatchObject({ limite: 4, minimo: MIN_CALIFICACIONES_RANKING });
        expect(res.json).toHaveBeenCalledWith([]);
    });

    test('filtra por sucursal cuando viene el parámetro', async () => {
        await obtenerMasValorados({ query: { sucursalId: '2' } }, crearRes());

        const [sql, opciones] = sequelize.query.mock.calls[0];
        expect(sql).toMatch(/c\."sucursalId" = :sucursalId/);
        expect(opciones.replacements.sucursalId).toBe(2);
    });

    test('ordena por promedio y desempata por cantidad', async () => {
        await obtenerMasValorados({ query: {} }, crearRes());
        expect(sequelize.query.mock.calls[0][0]).toMatch(/ORDER BY promedio DESC, cantidad DESC/);
    });

    test('convierte el promedio y la cantidad a número', async () => {
        sequelize.query.mockResolvedValue([{ productoId: 12, promedio: '4.80', cantidad: '9' }]);
        const res = crearRes();

        await obtenerMasValorados({ query: {} }, res);

        expect(res.json).toHaveBeenCalledWith([{ productoId: 12, promedio: 4.8, cantidad: 9 }]);
    });

    test('limita el máximo a 12 e ignora un límite inválido', async () => {
        await obtenerMasValorados({ query: { limite: '50' } }, crearRes());
        expect(sequelize.query.mock.calls[0][1].replacements.limite).toBe(12);

        await obtenerMasValorados({ query: { limite: 'abc' } }, crearRes());
        expect(sequelize.query.mock.calls[1][1].replacements.limite).toBe(4);
    });

    test.each([
        ['texto', 'abc'],
        ['cero', '0'],
        ['negativo', '-1'],
    ])('rechaza una sucursal inválida (%s)', async (_caso, sucursalId) => {
        const res = crearRes();

        await obtenerMasValorados({ query: { sucursalId } }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(sequelize.query).not.toHaveBeenCalled();
    });

    test('responde 500 si falla la base de datos', async () => {
        sequelize.query.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await obtenerMasValorados({ query: {} }, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Error al obtener los productos más valorados' });
    });
});
