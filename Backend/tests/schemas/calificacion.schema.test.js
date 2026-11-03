const { crearCalificacionSchema, editarCalificacionSchema } = require('../../src/schemas/calificacion.schema');
const { validarCrearCalificacion, validarEditarCalificacion } = require('../../src/middleware/validarCalificacion');

const mensajeDe = (schema, datos) => schema.validate(datos).error?.details[0].message;
const crear = (extra = {}) => ({ usuarioId: 3, pedidoId: 12, puntaje: 5, ...extra });

describe('crearCalificacionSchema', () => {
    test('acepta solo estrellas, con o sin comentario', () => {
        expect(mensajeDe(crearCalificacionSchema, crear())).toBeUndefined();
        expect(mensajeDe(crearCalificacionSchema, crear({ comentario: 'Todo rico' }))).toBeUndefined();
        expect(mensajeDe(crearCalificacionSchema, crear({ comentario: '' }))).toBeUndefined();
        expect(mensajeDe(crearCalificacionSchema, crear({ comentario: null }))).toBeUndefined();
    });

    test('las estrellas son obligatorias y van de 1 a 5', () => {
        expect(mensajeDe(crearCalificacionSchema, crear({ puntaje: undefined }))).toBe('Elegí de 1 a 5 estrellas');
        expect(mensajeDe(crearCalificacionSchema, crear({ puntaje: 0 }))).toBe('Elegí de 1 a 5 estrellas');
        expect(mensajeDe(crearCalificacionSchema, crear({ puntaje: 6 }))).toBe('Elegí de 1 a 5 estrellas');
        expect(mensajeDe(crearCalificacionSchema, crear({ puntaje: 3.5 }))).toBe('Elegí de 1 a 5 estrellas');
    });

    test('el comentario no puede superar los 300 caracteres', () => {
        expect(mensajeDe(crearCalificacionSchema, crear({ comentario: 'a'.repeat(301) })))
            .toBe('El comentario no puede superar los 300 caracteres');
        expect(mensajeDe(crearCalificacionSchema, crear({ comentario: 'a'.repeat(300) }))).toBeUndefined();
    });

    test('exige el usuario y el pedido', () => {
        expect(mensajeDe(crearCalificacionSchema, crear({ usuarioId: undefined }))).toBe('El usuario es obligatorio');
        expect(mensajeDe(crearCalificacionSchema, crear({ pedidoId: undefined }))).toBe('El pedido es obligatorio');
        expect(mensajeDe(crearCalificacionSchema, crear({ pedidoId: -1 }))).toBe('El pedido no es válido');
    });

    test('un comentario de solo espacios queda vacío', () => {
        const { value } = crearCalificacionSchema.validate(crear({ comentario: '   ' }));
        expect(value.comentario).toBe('');
    });
});

describe('editarCalificacionSchema', () => {
    test('no pide el pedido: la calificación ya está asociada', () => {
        expect(mensajeDe(editarCalificacionSchema, { usuarioId: 3, puntaje: 4 })).toBeUndefined();
    });
});

describe('middleware validarCalificacion', () => {
    function crearRes() {
        const res = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        return res;
    }

    test('deja pasar una calificación válida', () => {
        const next = jest.fn();
        validarCrearCalificacion({ body: crear() }, crearRes(), next);
        expect(next).toHaveBeenCalled();
    });

    test('responde 400 con el primer error', () => {
        const res = crearRes();
        const next = jest.fn();
        validarCrearCalificacion({ body: crear({ puntaje: 9 }) }, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ code: 'Elegí de 1 a 5 estrellas' });
        expect(next).not.toHaveBeenCalled();
    });

    test('la edición valida igual', () => {
        const res = crearRes();
        validarEditarCalificacion({ body: { usuarioId: 3 } }, res, jest.fn());
        expect(res.status).toHaveBeenCalledWith(400);
    });
});
