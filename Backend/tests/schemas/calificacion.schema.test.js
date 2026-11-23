const { crearCalificacionSchema } = require('../../src/schemas/calificacion.schema');
const { MAX_COMENTARIO } = require('../../src/config/calificaciones');

// Una calificación válida, con los cambios que pida cada test
const VALIDA = { usuarioId: 3, pedidoId: 15, puntaje: 5, comentario: 'Llegó caliente y rápido' };

// Devuelve el mensaje de error, o undefined si los datos son válidos
function mensajeDe(cambios) {
    return crearCalificacionSchema.validate({ ...VALIDA, ...cambios }).error?.details[0].message;
}

function valorDe(cambios) {
    return crearCalificacionSchema.validate({ ...VALIDA, ...cambios }).value;
}

describe('crearCalificacionSchema', () => {
    describe('casos válidos', () => {
        test('acepta una calificación completa', () => {
            expect(mensajeDe({})).toBeUndefined();
        });

        test.each([1, 2, 3, 4, 5])('acepta un puntaje de %s estrellas', (puntaje) => {
            expect(mensajeDe({ puntaje })).toBeUndefined();
        });

        test('el comentario es opcional', () => {
            const { comentario, ...sinComentario } = VALIDA;
            expect(crearCalificacionSchema.validate(sinComentario).error).toBeUndefined();
        });

        test.each([['vacío', ''], ['nulo', null]])('acepta un comentario %s', (_, comentario) => {
            expect(mensajeDe({ comentario })).toBeUndefined();
        });

        test('quita los espacios de más del comentario', () => {
            expect(valorDe({ comentario: '   Muy rico   ' }).comentario).toBe('Muy rico');
        });

        test(`acepta un comentario de exactamente ${MAX_COMENTARIO} caracteres`, () => {
            expect(mensajeDe({ comentario: 'a'.repeat(MAX_COMENTARIO) })).toBeUndefined();
        });

        test('convierte los ids y el puntaje que llegan como texto', () => {
            expect(valorDe({ usuarioId: '3', pedidoId: '15', puntaje: '4' })).toMatchObject({
                usuarioId: 3,
                pedidoId: 15,
                puntaje: 4,
            });
        });
    });

    describe('casos inválidos', () => {
        test.each([0, 6, -1])('rechaza un puntaje de %s', (puntaje) => {
            expect(mensajeDe({ puntaje })).toBe('Elegí de 1 a 5 estrellas');
        });

        test('rechaza medio punto (3.5)', () => {
            expect(mensajeDe({ puntaje: 3.5 })).toBe('Elegí de 1 a 5 estrellas');
        });

        test('rechaza un puntaje que no es número', () => {
            expect(mensajeDe({ puntaje: 'excelente' })).toBe('Elegí de 1 a 5 estrellas');
        });

        test('exige el puntaje', () => {
            const { puntaje, ...sinPuntaje } = VALIDA;
            expect(crearCalificacionSchema.validate(sinPuntaje).error.details[0].message)
                .toBe('Elegí de 1 a 5 estrellas');
        });

        test(`rechaza un comentario de más de ${MAX_COMENTARIO} caracteres`, () => {
            expect(mensajeDe({ comentario: 'a'.repeat(MAX_COMENTARIO + 1) }))
                .toBe(`El comentario no puede superar los ${MAX_COMENTARIO} caracteres`);
        });

        test('rechaza un comentario que no es texto', () => {
            expect(mensajeDe({ comentario: 123 })).toBe('El comentario debe ser un texto');
        });

        test('exige el pedido', () => {
            const { pedidoId, ...sinPedido } = VALIDA;
            expect(crearCalificacionSchema.validate(sinPedido).error.details[0].message)
                .toBe('El pedido es obligatorio');
        });

        test('exige el usuario', () => {
            const { usuarioId, ...sinUsuario } = VALIDA;
            expect(crearCalificacionSchema.validate(sinUsuario).error.details[0].message)
                .toBe('El usuario es obligatorio');
        });

        test.each([0, -5, 1.5, 'abc'])('rechaza un id de pedido inválido (%s)', (pedidoId) => {
            expect(mensajeDe({ pedidoId })).toBe('El pedido no es válido');
        });

        test('rechaza campos que no existen', () => {
            expect(mensajeDe({ estado: 'APROBADA' })).toMatch(/not allowed/);
        });
    });
});