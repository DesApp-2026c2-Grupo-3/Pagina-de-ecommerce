const { crearCalificacionSchema, editarCalificacionSchema } = require('../../src/schemas/calificacion.schema');
const { validarCrearCalificacion, validarEditarCalificacion } = require('../../src/middleware/validarCalificacion');

const mensajeDe = (schema, datos) => schema.validate(datos).error?.details[0].message;
const item = (extra = {}) => ({ productoId: 7, puntaje: 5, ...extra });
const crear = (extra = {}) => ({ usuarioId: 3, pedidoId: 12, items: [item()], ...extra });
const SIN_NADA = 'Calificá al menos un producto o dejá un comentario';

describe('crearCalificacionSchema', () => {
    test('acepta un producto con solo estrellas, con o sin comentario', () => {
        expect(mensajeDe(crearCalificacionSchema, crear())).toBeUndefined();
        expect(mensajeDe(crearCalificacionSchema, crear({ items: [item({ comentario: 'Todo rico' })] }))).toBeUndefined();
        expect(mensajeDe(crearCalificacionSchema, crear({ items: [item({ comentario: '' })] }))).toBeUndefined();
        expect(mensajeDe(crearCalificacionSchema, crear({ items: [item({ comentario: null })] }))).toBeUndefined();
    });

    test('acepta un producto con solo comentario (sin estrellas)', () => {
        expect(mensajeDe(crearCalificacionSchema, crear({ items: [item({ puntaje: null, comentario: 'Llegó frío' })] }))).toBeUndefined();
        expect(mensajeDe(crearCalificacionSchema, crear({ items: [{ productoId: 7, comentario: 'Llegó frío' }] }))).toBeUndefined();
    });

    test('cada producto se califica por separado y alcanza con que uno tenga algo', () => {
        const items = [item({ productoId: 7, puntaje: 4 }), item({ productoId: 9, puntaje: null, comentario: '' })];
        expect(mensajeDe(crearCalificacionSchema, crear({ items }))).toBeUndefined();
    });

    test('no deja enviar si ningún producto tiene estrellas ni comentario', () => {
        expect(mensajeDe(crearCalificacionSchema, crear({ items: [item({ puntaje: null })] }))).toBe(SIN_NADA);
        expect(mensajeDe(crearCalificacionSchema, crear({
            items: [item({ puntaje: null, comentario: '   ' }), item({ productoId: 9, puntaje: null })],
        }))).toBe(SIN_NADA);
        expect(mensajeDe(crearCalificacionSchema, crear({ items: [] }))).toBe(SIN_NADA);
        expect(mensajeDe(crearCalificacionSchema, crear({ items: undefined }))).toBe(SIN_NADA);
    });

    test('las estrellas van de 1 a 5', () => {
        expect(mensajeDe(crearCalificacionSchema, crear({ items: [item({ puntaje: 0 })] }))).toBe('Elegí de 1 a 5 estrellas');
        expect(mensajeDe(crearCalificacionSchema, crear({ items: [item({ puntaje: 6 })] }))).toBe('Elegí de 1 a 5 estrellas');
        expect(mensajeDe(crearCalificacionSchema, crear({ items: [item({ puntaje: 3.5 })] }))).toBe('Elegí de 1 a 5 estrellas');
    });

    test('el comentario no puede superar los 300 caracteres', () => {
        expect(mensajeDe(crearCalificacionSchema, crear({ items: [item({ comentario: 'a'.repeat(301) })] })))
            .toBe('El comentario no puede superar los 300 caracteres');
        expect(mensajeDe(crearCalificacionSchema, crear({ items: [item({ comentario: 'a'.repeat(300) })] }))).toBeUndefined();
    });

    test('exige el usuario, el pedido y que cada producto sea válido', () => {
        expect(mensajeDe(crearCalificacionSchema, crear({ usuarioId: undefined }))).toBe('El usuario es obligatorio');
        expect(mensajeDe(crearCalificacionSchema, crear({ pedidoId: undefined }))).toBe('El pedido es obligatorio');
        expect(mensajeDe(crearCalificacionSchema, crear({ pedidoId: -1 }))).toBe('El pedido no es válido');
        expect(mensajeDe(crearCalificacionSchema, crear({ items: [item({ productoId: undefined })] }))).toBe('El producto es obligatorio');
        expect(mensajeDe(crearCalificacionSchema, crear({ items: [item({ productoId: -4 })] }))).toBe('El producto no es válido');
    });

    test('un producto no se puede calificar dos veces', () => {
        expect(mensajeDe(crearCalificacionSchema, crear({ items: [item(), item({ puntaje: 2 })] })))
            .toBe('Un producto no se puede calificar dos veces');
    });

    test('un comentario de solo espacios queda vacío', () => {
        const { value } = crearCalificacionSchema.validate(crear({ items: [item({ comentario: '   ' })] }));
        expect(value.items[0].comentario).toBe('');
    });
});

describe('editarCalificacionSchema', () => {
    test('no pide el pedido ni el producto: la calificación ya está asociada', () => {
        expect(mensajeDe(editarCalificacionSchema, { usuarioId: 3, puntaje: 4 })).toBeUndefined();
        expect(mensajeDe(editarCalificacionSchema, { usuarioId: 3, comentario: 'Mejoró' })).toBeUndefined();
    });

    test('necesita estrellas o comentario', () => {
        expect(mensajeDe(editarCalificacionSchema, { usuarioId: 3 })).toBe('Elegí de 1 a 5 estrellas o dejá un comentario');
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
        validarCrearCalificacion({ body: crear({ items: [item({ puntaje: 9 })] }) }, res, next);
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
