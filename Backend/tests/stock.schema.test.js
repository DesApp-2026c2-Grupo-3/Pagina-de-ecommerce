const { cargaStockSchema } = require('../src/schemas/admin/stock.schema');

// Devuelve el mensaje de error, o undefined si los datos son válidos
function mensajeDe(datos) {
    return cargaStockSchema.validate(datos).error?.details[0].message;
}

describe('cargaStockSchema', () => {
    describe('casos válidos', () => {
        test('acepta una cantidad entera', () => {
            expect(mensajeDe({ cantidad: 10 })).toBeUndefined();
        });

        test('acepta decimales (ej. 2.5 kg)', () => {
            expect(mensajeDe({ cantidad: 2.5 })).toBeUndefined();
        });

        test('convierte la cantidad de texto a número', () => {
            const { value } = cargaStockSchema.validate({ cantidad: '5' });
            expect(value.cantidad).toBe(5);
        });

        test('redondea a 2 decimales', () => {
            const { value } = cargaStockSchema.validate({ cantidad: 1.234 });
            expect(value.cantidad).toBe(1.23);
        });
        test('acepta exactamente la cantidad máxima', () => {
            expect(mensajeDe({ cantidad: 1000 })).toBeUndefined();
        });
    });

    describe('casos inválidos', () => {
        test('exige la cantidad', () => {
            expect(mensajeDe({})).toBe('La cantidad es obligatoria');
        });

        test('rechaza un texto que no es número', () => {
            expect(mensajeDe({ cantidad: 'mucho' })).toBe('La cantidad debe ser un número válido');
        });

        test.each([0, -3])('rechaza la cantidad %s', (cantidad) => {
            expect(mensajeDe({ cantidad })).toBe('La cantidad a cargar debe ser un valor positivo');
        });

        test('rechaza campos extra', () => {
            expect(mensajeDe({ cantidad: 5, sucursalId: 1 })).toMatch(/not allowed/);
        });
        test('rechaza una cantidad mayor al máximo (ej. un cero de más)', () => {
            expect(mensajeDe({ cantidad: 10000 })).toBe('La cantidad a cargar no puede superar 1000');
        });
        
    });
});