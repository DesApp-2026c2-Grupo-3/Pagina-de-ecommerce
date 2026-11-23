const { validarCrearCalificacion } = require('../../src/middleware/validarCalificacion');

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

function bodyValido(datos = {}) {
    return { usuarioId: 3, pedidoId: 15, puntaje: 5, comentario: 'Excelente', ...datos };
}

function codigoDe(res) {
    return res.json.mock.calls[0][0].code;
}

describe('validarCrearCalificacion', () => {
    test('deja pasar una calificación válida', () => {
        const res = crearRes();
        const next = jest.fn();

        validarCrearCalificacion({ body: bodyValido() }, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    test('limpia los datos antes de seguir (texto a número y comentario sin espacios)', () => {
        const req = { body: bodyValido({ pedidoId: '15', puntaje: '4', comentario: '  Rico  ' }) };

        validarCrearCalificacion(req, crearRes(), jest.fn());

        expect(req.body).toEqual({ usuarioId: 3, pedidoId: 15, puntaje: 4, comentario: 'Rico' });
    });

    test('responde 400 con un puntaje fuera de rango y no sigue', () => {
        const res = crearRes();
        const next = jest.fn();

        validarCrearCalificacion({ body: bodyValido({ puntaje: 7 }) }, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(codigoDe(res)).toBe('Elegí de 1 a 5 estrellas');
        expect(next).not.toHaveBeenCalled();
    });

    test('responde 400 si falta el pedido', () => {
        const { pedidoId, ...body } = bodyValido();
        const res = crearRes();

        validarCrearCalificacion({ body }, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(codigoDe(res)).toBe('El pedido es obligatorio');
    });

    test('responde 400 si el cliente intenta aprobar su propia calificación', () => {
        const res = crearRes();

        validarCrearCalificacion({ body: bodyValido({ estado: 'APROBADA' }) }, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(codigoDe(res)).toMatch(/not allowed/);
    });
});