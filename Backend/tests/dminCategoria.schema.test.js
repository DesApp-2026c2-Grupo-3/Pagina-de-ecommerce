const { categoriaSchema } = require('../src/schemas/admin/adminCategoria.schema');

function mensajeDe(datos) {
    return categoriaSchema.validate(datos).error?.details[0].message;
}

describe('categoriaSchema', () => {
    test.each(['Hamburguesas', 'Sin TACC', 'Ñoquis'])('acepta "%s"', (nombre) => {
        expect(mensajeDe({ nombre })).toBeUndefined();
    });

    test('quita los espacios de más', () => {
        const { value } = categoriaSchema.validate({ nombre: '  Postres  ' });
        expect(value.nombre).toBe('Postres');
    });

    test.each(['', '   '])('trata "%s" como si no viniera', (nombre) => {
        expect(mensajeDe({ nombre })).toBe('El nombre de la categoría es obligatorio');
    });

    test('exige el nombre', () => {
        expect(mensajeDe({})).toBe('El nombre de la categoría es obligatorio');
    });

    test('rechaza un número en lugar de texto', () => {
        expect(mensajeDe({ nombre: 123 })).toBe('El nombre de la categoría debe ser un texto');
    });

    test('rechaza menos de 3 caracteres', () => {
        expect(mensajeDe({ nombre: 'Ab' })).toBe('El nombre debe tener al menos 3 caracteres');
    });

    test('rechaza más de 20 caracteres', () => {
        expect(mensajeDe({ nombre: 'a'.repeat(21) })).toBe('El nombre no puede superar los 20 caracteres');
    });

    test.each(['123', 'Café & Té'])('rechaza "%s"', (nombre) => {
        expect(mensajeDe({ nombre })).toBe('El nombre solo puede contener letras, números y espacios');
    });
});