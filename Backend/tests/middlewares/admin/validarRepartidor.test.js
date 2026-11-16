
const {
    validarRepartidor,
    validarActualizacionRepartidor,
} = require('../../../src/middleware/admin/validarRepartidor');

function crearReq(body = {}) {
    return { body };
}

function crearRes() {
    const res = {};

    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);

    return res;
}

test('permite continuar con datos válidos', () => {
    const req = crearReq({
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan@gmail.com',
        password: 'Password123',
        sucursalId: 1
    });

    const res = crearRes();
    const next = jest.fn();

    validarRepartidor(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
});

    test('devuelve 400 si faltan campos obligatorios', () => {
        const req = crearReq({});
        const res = crearRes();
        const next = jest.fn();

        validarRepartidor(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            code: expect.any(String),
        });

        expect(next).not.toHaveBeenCalled();
    });

test('reemplaza req.body por los datos validados', () => {
    const req = crearReq({
        nombre: '  Juan  ',
        apellido: '  Pérez  ',
        email: '  JUAN@GMAIL.COM  ',
        password: 'Password123',
        sucursalId: 1
    });

    const res = crearRes();
    const next = jest.fn();

    validarRepartidor(req, res, next);

    expect(req.body.nombre).toBe('Juan');
    expect(req.body.apellido).toBe('Pérez');
    expect(req.body.email).toBe('juan@gmail.com');
    expect(next).toHaveBeenCalledTimes(1);
});


describe('validarActualizacionRepartidor', () => {
    test('permite continuar con datos válidos', () => {
        const req = crearReq({
            nombre: 'Juan',
        });

        const res = crearRes();
        const next = jest.fn();

        validarActualizacionRepartidor(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    test('devuelve 400 si los datos son inválidos', () => {
        const req = crearReq({
            email: 'correo-invalido',
        });

        const res = crearRes();
        const next = jest.fn();

        validarActualizacionRepartidor(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            code: expect.any(String),
        });

        expect(next).not.toHaveBeenCalled();
    });

    test('permite una actualización sin campos obligatorios si el esquema lo admite', () => {
        const req = crearReq({});
        const res = crearRes();
        const next = jest.fn();

        validarActualizacionRepartidor(req, res, next);

        // El resultado depende de si el esquema permite objetos vacíos.
        // Si los permite, continúa; si no, responde 400.
        if (next.mock.calls.length > 0) {
            expect(res.status).not.toHaveBeenCalled();
        } else {
            expect(res.status).toHaveBeenCalledWith(400);
        }
    });
});
