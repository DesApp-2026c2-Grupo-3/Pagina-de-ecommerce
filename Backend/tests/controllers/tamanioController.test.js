jest.mock('../../src/models', () => ({
    Tamanio: { findAll: jest.fn() },
}));

const { Tamanio } = require('../../src/models');
const { obtenerTamanios } = require('../../src/controllers/tamanioController');

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

describe('obtenerTamanios', () => {
    test('devuelve los tamaños ordenados', async () => {
        Tamanio.findAll.mockResolvedValue([
            { id: 1, nombre: 'Regular', orden: 1, imagen: 'regular.png' },
            { id: 2, nombre: 'Mediano', orden: 2, imagen: 'mediano.png' },
        ]);
        const res = crearRes();

        await obtenerTamanios({}, res);

        expect(Tamanio.findAll).toHaveBeenCalledWith({
            attributes: ['id', 'nombre', 'orden', 'imagen'],
            order: [['orden', 'ASC']],
        });
        expect(res.json).toHaveBeenCalledWith([
            { id: 1, nombre: 'Regular', orden: 1, imagen: 'regular.png' },
            { id: 2, nombre: 'Mediano', orden: 2, imagen: 'mediano.png' },
        ]);
    });

    test('responde 500 si falla la base de datos', async () => {
        Tamanio.findAll.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await obtenerTamanios({}, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Error al obtener los tamaños' });
    });
});
