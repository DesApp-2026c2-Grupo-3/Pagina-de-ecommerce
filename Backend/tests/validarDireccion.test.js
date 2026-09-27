const {
    validarCrearDireccion,
    validarActualizarDireccion,
} = require('../src/middleware/validarDireccion');

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

const direccionValida = {
    alias: 'Casa',
    calle: 'Florida',
    numero: '2950',
    localidad: 'Merlo',
    provincia: 'Buenos Aires',
    latitud: -34.714,
    longitud: -58.735,
};

describe('validarCrearDireccion', () => {
    test('deja pasar una dirección válida y limpia los datos', () => {
        const req = {
            body: { ...direccionValida, usuarioId: 1, alias: '  Casa  ', latitud: '-34.714' },
        };
        const res = crearRes();
        const next = jest.fn();

        validarCrearDireccion(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.body.alias).toBe('Casa');       // sin espacios
        expect(req.body.latitud).toBe(-34.714);    // convertida a número
    });

    test('responde 400 con el mensaje del error', () => {
        const { calle, ...sinCalle } = direccionValida;
        const req = { body: { ...sinCalle, usuarioId: 1 } };
        const res = crearRes();
        const next = jest.fn();

        validarCrearDireccion(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ code: 'La calle es obligatoria' });
        expect(next).not.toHaveBeenCalled();
    });
});

describe('validarActualizarDireccion', () => {
    test('deja pasar una edición válida', () => {
        const req = { body: { ...direccionValida } };
        const next = jest.fn();

        validarActualizarDireccion(req, crearRes(), next);

        expect(next).toHaveBeenCalled();
    });

    test('no permite cambiar el usuario dueño', () => {
        const req = { body: { ...direccionValida, usuarioId: 99 } };
        const res = crearRes();
        const next = jest.fn();

        validarActualizarDireccion(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(next).not.toHaveBeenCalled();
    });
});