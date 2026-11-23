const { obtenerParametros } = require('../../src/utils/parametros');
const { verParametrosPublicos } = require('../../src/controllers/parametroController');

jest.mock('../../src/utils/parametros', () => ({
    obtenerParametros: jest.fn(),
}));

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

// Todos los parámetros, como los devuelve obtenerParametros
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

describe('verParametrosPublicos', () => {
    test('devuelve solo los parámetros que necesita la tienda', async () => {
        obtenerParametros.mockResolvedValue(PARAMETROS);
        const res = crearRes();

        await verParametrosPublicos({}, res);

        expect(res.json).toHaveBeenCalledWith({
            radioEntregaKm: 10,
            diasParaCalificar: 7,
            maxPedidosEnCurso: 2,
        });
    });

    test('no expone los parámetros internos (envío, tiempos, promociones)', async () => {
        obtenerParametros.mockResolvedValue(PARAMETROS);
        const res = crearRes();

        await verParametrosPublicos({}, res);

        const enviado = res.json.mock.calls[0][0];
        expect(enviado).not.toHaveProperty('envioBase');
        expect(enviado).not.toHaveProperty('preparacionBaseMin');
        expect(enviado).not.toHaveProperty('maxPromosPorDia');
        expect(enviado).not.toHaveProperty('id');
    });

    test('responde 500 si falla la base de datos', async () => {
        obtenerParametros.mockRejectedValue(new Error('DB caída'));
        const res = crearRes();

        await verParametrosPublicos({}, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Error al obtener los parámetros' });
    });
});