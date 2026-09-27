// 1. Reemplazamos los modelos por versiones falsas ANTES de importar el controlador
jest.mock('../src/models', () => ({
    Direccion: {
        findAll: jest.fn(),
        findByPk: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
    },
}));

const { Direccion } = require('../src/models');
const {
    obtenerDireccionesPorUsuario,
    crearDireccion,
    actualizarDireccion,
    eliminarDireccion,
} = require('../src/controllers/direccionController');

// Un "res" falso: guarda con qué se llamó a status() y a json()
function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

const datosDireccion = {
    alias: 'Casa',
    calle: 'Florida',
    numero: '2950',
    localidad: 'Merlo',
    provincia: 'Buenos Aires',
    latitud: -34.714,
    longitud: -58.735,
};

beforeEach(() => {
    // Limpia lo que recordaron los mocks en el test anterior
    jest.clearAllMocks();
    // Evita que los console.error de los casos de error ensucien la salida
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('obtenerDireccionesPorUsuario', () => {
    test('responde 200 con las direcciones del usuario', async () => {
        const direcciones = [{ id: 1, alias: 'Casa' }];
        Direccion.findAll.mockResolvedValue(direcciones);
        const res = crearRes();

        await obtenerDireccionesPorUsuario({ params: { usuarioId: '1' } }, res);

        expect(Direccion.findAll).toHaveBeenCalledWith(
            expect.objectContaining({ where: { usuarioId: '1' } })
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(direcciones);
    });

    test('responde 500 si falla la base de datos', async () => {
        Direccion.findAll.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await obtenerDireccionesPorUsuario({ params: { usuarioId: '1' } }, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('crearDireccion', () => {
    test('crea la dirección y responde 201', async () => {
        Direccion.create.mockResolvedValue({ id: 10, ...datosDireccion });
        const res = crearRes();

        await crearDireccion({ body: { ...datosDireccion, usuarioId: 1 } }, res);

        expect(Direccion.create).toHaveBeenCalledWith(
            expect.objectContaining({ ...datosDireccion, usuarioId: 1, predeterminada: false })
        );
        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('ignora campos que no están permitidos', async () => {
        Direccion.create.mockResolvedValue({ id: 10 });
        const res = crearRes();

        await crearDireccion({ body: { ...datosDireccion, usuarioId: 1, esAdmin: true } }, res);

        const loQueSeGuardo = Direccion.create.mock.calls[0][0];
        expect(loQueSeGuardo).not.toHaveProperty('esAdmin');
    });

    test('si es predeterminada, desmarca las otras direcciones del usuario', async () => {
        Direccion.create.mockResolvedValue({ id: 10 });
        const res = crearRes();

        await crearDireccion({ body: { ...datosDireccion, usuarioId: 1, predeterminada: true } }, res);

        expect(Direccion.update).toHaveBeenCalledWith(
            { predeterminada: false },
            { where: { usuarioId: 1 } }
        );
    });

    test('si no es predeterminada, no toca las otras direcciones', async () => {
        Direccion.create.mockResolvedValue({ id: 10 });
        const res = crearRes();

        await crearDireccion({ body: { ...datosDireccion, usuarioId: 1, predeterminada: false } }, res);

        expect(Direccion.update).not.toHaveBeenCalled();
    });
});

describe('actualizarDireccion', () => {
    test('responde 404 si la dirección no existe', async () => {
        Direccion.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await actualizarDireccion({ params: { id: '99' }, body: {} }, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('actualiza lo que llega y conserva el resto', async () => {
        const direccionExistente = {
            ...datosDireccion,
            usuarioId: 1,
            predeterminada: false,
            update: jest.fn(),
        };
        Direccion.findByPk.mockResolvedValue(direccionExistente);
        const res = crearRes();

        await actualizarDireccion({ params: { id: '1' }, body: { alias: 'Trabajo' } }, res);

        expect(direccionExistente.update).toHaveBeenCalledWith(
            expect.objectContaining({ alias: 'Trabajo', calle: 'Florida', numero: '2950' })
        );
        expect(res.status).toHaveBeenCalledWith(200);
    });
});

describe('eliminarDireccion', () => {
    test('responde 404 si la dirección no existe', async () => {
        Direccion.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await eliminarDireccion({ params: { id: '99' } }, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('elimina la dirección y responde 200', async () => {
        const direccionExistente = { destroy: jest.fn() };
        Direccion.findByPk.mockResolvedValue(direccionExistente);
        const res = crearRes();

        await eliminarDireccion({ params: { id: '1' } }, res);

        expect(direccionExistente.destroy).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });
});