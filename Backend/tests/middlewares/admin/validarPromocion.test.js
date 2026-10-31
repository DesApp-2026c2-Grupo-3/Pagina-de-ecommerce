const { validarPromocion } = require('../../../src/middleware/admin/validarPromocion');

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

const valida = () => ({
    tipo: 'DIA',
    titulo: '  Lunes clásico ',
    destacado: '25%',
    detalle: 'El Combo Fast Classic con 25 % menos.',
    dias: [1],
    items: [{ productoId: 4, cantidad: 1, descuento: 0.25 }],
});

describe('validarPromocion', () => {
    test('deja pasar una promo válida con los datos ya limpios', () => {
        const req = { body: valida() };
        const res = crearRes();
        const next = jest.fn();

        validarPromocion(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.body.titulo).toBe('Lunes clásico');
        expect(req.body.activo).toBe(true);
        expect(res.status).not.toHaveBeenCalled();
    });

    test('responde 400 con el primer error si la promo no es válida', () => {
        const req = { body: { ...valida(), dias: [] } };
        const res = crearRes();
        const next = jest.fn();

        validarPromocion(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ code: 'Elegí al menos un día para la promo' });
        expect(next).not.toHaveBeenCalled();
    });
});
