const { categoriaSchema } = require('../../src/schemas/admin/adminCategoria.schema');
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

    describe('jerarquía, orden y complemento', () => {
        test('son opcionales: con solo el nombre alcanza', () => {
            expect(mensajeDe({ nombre: 'Postres' })).toBeUndefined();
        });

        test('acepta una categoría padre, un orden y la marca de complemento', () => {
            expect(mensajeDe({ nombre: 'Café', categoriaPadreId: 6, orden: 10, esComplemento: false })).toBeUndefined();
            expect(mensajeDe({ nombre: 'Salsas', categoriaPadreId: null, esComplemento: true })).toBeUndefined();
        });

        test.each([0, -1, 1.5, 'abc'])('rechaza %s como categoría padre', (categoriaPadreId) => {
            expect(mensajeDe({ nombre: 'Café', categoriaPadreId })).toBe('La categoría padre no es válida');
        });

        test('valida el orden', () => {
            expect(mensajeDe({ nombre: 'Café', orden: -1 })).toBe('El orden no puede ser negativo');
            expect(mensajeDe({ nombre: 'Café', orden: 1.5 })).toBe('El orden debe ser un número entero');
            expect(mensajeDe({ nombre: 'Café', orden: 'primero' })).toBe('El orden debe ser un número');
            expect(mensajeDe({ nombre: 'Café', orden: 100001 })).toBe('El orden no puede superar 100000');
        });

        test('acepta un ícono y un color de la lista, o null para el automático', () => {
            expect(mensajeDe({ nombre: 'Café', icono: 'desayuno', fondo: 'arena' })).toBeUndefined();
            expect(mensajeDe({ nombre: 'Café', icono: null, fondo: null })).toBeUndefined();
        });

        test('rechaza un ícono o un color que no existe', () => {
            expect(mensajeDe({ nombre: 'Café', icono: 'pizza' })).toBe('El ícono elegido no es válido');
            expect(mensajeDe({ nombre: 'Café', fondo: 'violeta' })).toBe('El color elegido no es válido');
        });

        test('el complemento es verdadero o falso', () => {
            expect(mensajeDe({ nombre: 'Salsas', esComplemento: 'quizás' })).toBe('La marca de complemento no es válida');
        });
    });
});