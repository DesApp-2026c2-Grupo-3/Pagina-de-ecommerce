const { Parametro } = require('../../../src/models');
const { obtenerParametros } = require('../../../src/utils/parametros');
const { verParametros, guardarParametros } = require('../../../src/controllers/admin/parametroController');

jest.mock('../../../src/models', () => ({
    Parametro: {
        update: jest.fn(),
    },
}));

jest.mock('../../../src/utils/parametros', () => ({
    obtenerParametros: jest.fn(),
}));

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

const PARAMETROS = {
    id: 1,
    maxPedidosEnCurso: 2,
    radioEntregaKm: 10,
    envioBase: 1200,
    envioPorKm: 300,
    preparacionBaseMin: 10,
    preparacionPorProductoMin: 2,
    viajeMinPorKm: 4,
    margenDemoraMin: 5,
    diasParaCalificar: 7,
    opinionesEnInicio: 6,
    maxPromosPorDia: 3,
};

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    console.error.mockRestore();
});

describe('verParametros', () => {
    test('devuelve todos los parámetros', async () => {
        obtenerParametros.mockResolvedValue(PARAMETROS);
        const res = crearRes();

        await verParametros({}, res);

        expect(res.json).toHaveBeenCalledWith(PARAMETROS);
    });

    test('responde 500 si falla la base de datos', async () => {
        obtenerParametros.mockRejectedValue(new Error('DB caída'));
        const res = crearRes();

        await verParametros({}, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Error al obtener los parámetros' });
    });
});

describe('guardarParametros', () => {
    test('guarda los parámetros en la fila 1 y devuelve los actualizados', async () => {
        const nuevos = { ...PARAMETROS, radioEntregaKm: 15, envioBase: 1500 };
        delete nuevos.id;
        obtenerParametros
            .mockResolvedValueOnce(PARAMETROS) // asegura que exista la fila
            .mockResolvedValueOnce({ id: 1, ...nuevos }); // lee los valores guardados
        Parametro.update.mockResolvedValue([1]);
        const res = crearRes();

        await guardarParametros({ body: nuevos }, res);

        expect(Parametro.update).toHaveBeenCalledWith(nuevos, { where: { id: 1 } });
        expect(res.json).toHaveBeenCalledWith({
            mensaje: 'Parámetros guardados',
            parametros: { id: 1, ...nuevos },
        });
    });

    test('se asegura de que exista la fila antes de actualizar (base sin parámetros)', async () => {
        obtenerParametros.mockResolvedValue(PARAMETROS);
        Parametro.update.mockResolvedValue([1]);

        await guardarParametros({ body: { radioEntregaKm: 12 } }, crearRes());

        const ordenObtener = obtenerParametros.mock.invocationCallOrder[0];
        const ordenUpdate = Parametro.update.mock.invocationCallOrder[0];
        expect(ordenObtener).toBeLessThan(ordenUpdate);
    });

    test('responde 500 si falla al guardar', async () => {
        obtenerParametros.mockResolvedValue(PARAMETROS);
        Parametro.update.mockRejectedValue(new Error('DB caída'));
        const res = crearRes();

        await guardarParametros({ body: { radioEntregaKm: 12 } }, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Error al guardar los parámetros' });
    });

    test('responde 500 si no puede leer los parámetros', async () => {
        obtenerParametros.mockRejectedValue(new Error('DB caída'));
        const res = crearRes();

        await guardarParametros({ body: { radioEntregaKm: 12 } }, res);

        expect(Parametro.update).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
    });
});