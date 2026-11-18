const { validarLoginRepartidor } = require('../../../src/middleware/repartidor/validarLoginRepartidor');

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

describe('validarLoginRepartidor', () => {
    test('deja pasar datos válidos y normaliza el email', () => {
        const req = { body: { email: '  JUAN@Gmail.com ', password: 'cualquiera' } };
        const next = jest.fn();

        validarLoginRepartidor(req, crearRes(), next);

        expect(next).toHaveBeenCalled();
        expect(req.body).toEqual({ email: 'juan@gmail.com', password: 'cualquiera' });
    });

    test('no exige las reglas de una contraseña nueva', () => {
        const req = { body: { email: 'juan@gmail.com', password: '1' } };
        const next = jest.fn();

        validarLoginRepartidor(req, crearRes(), next);

        expect(next).toHaveBeenCalled();
    });

    test.each([
        ['sin body', undefined, 'El email es obligatorio'],
        ['body vacío', {}, 'El email es obligatorio'],
        ['email inválido', { email: 'juan', password: 'x' }, 'El email no tiene un formato válido'],
        ['sin contraseña', { email: 'juan@gmail.com' }, 'La contraseña es obligatoria'],
        ['contraseña vacía', { email: 'juan@gmail.com', password: '' }, 'La contraseña es obligatoria'],
    ])('responde 400 con %s', (_, body, mensaje) => {
        const req = { body };
        const res = crearRes();
        const next = jest.fn();

        validarLoginRepartidor(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ code: mensaje });
        expect(next).not.toHaveBeenCalled();
    });
});
