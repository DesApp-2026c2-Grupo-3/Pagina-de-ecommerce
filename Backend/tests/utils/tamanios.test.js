const {
    TAMANIOS,
    MEDIDAS_ESTANDAR,
    tamaniosDesdePrecio,
    medidasDe,
} = require('../../src/utils/tamanios');

describe('tamanios', () => {
    test('define los tres tamaños estándar', () => {
        expect(TAMANIOS).toEqual([
            { tamanioId: 1, factorPrecio: 1, factorStock: 1 },
            { tamanioId: 2, factorPrecio: 1.2, factorStock: 1.5 },
            { tamanioId: 3, factorPrecio: 1.4, factorStock: 2 },
        ]);
    });

    test('calcula los precios y redondea a 100', () => {
        expect(tamaniosDesdePrecio(1000)).toEqual([
            { tamanioId: 1, precio: 1000, factorStock: 1, etiqueta: null },
            { tamanioId: 2, precio: 1200, factorStock: 1.5, etiqueta: null },
            { tamanioId: 3, precio: 1400, factorStock: 2, etiqueta: null },
        ]);
    });

    test('redondea los precios con centavos', () => {
        const [, mediano, grande] = tamaniosDesdePrecio('999');
        expect(mediano.precio).toBe(1200);
        expect(grande.precio).toBe(1400);
    });

    test('agrega las medidas de bebidas', () => {
        const tamanios = tamaniosDesdePrecio(1000, 'Bebidas');
        expect(tamanios.map((t) => t.etiqueta)).toEqual(['354 ml', '500 ml', '750 ml']);
    });

    test('medidasDe ignora mayúsculas y espacios', () => {
        expect(medidasDe('  BEBIDAS ')).toBe(MEDIDAS_ESTANDAR.bebidas);
    });

    test('medidasDe devuelve un objeto vacío para categorías desconocidas o vacías', () => {
        expect(medidasDe('Postres')).toEqual({});
        expect(medidasDe(null)).toEqual({});
        expect(medidasDe(undefined)).toEqual({});
    });
});
