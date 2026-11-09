'use strict';

const { cruzaMinimo, normalizarMinimo } = require('../../src/utils/stockMinimo');

describe('normalizarMinimo', () => {
    test('acepta cero y números positivos', () => {
        expect(normalizarMinimo(0)).toBe(0);
        expect(normalizarMinimo('12.5')).toBe(12.5);
    });

    test('descarta valores vacíos, negativos o no numéricos', () => {
        expect(normalizarMinimo(null)).toBeNull();
        expect(normalizarMinimo(undefined)).toBeNull();
        expect(normalizarMinimo('')).toBeNull();
        expect(normalizarMinimo(-1)).toBeNull();
        expect(normalizarMinimo('abc')).toBeNull();
        expect(normalizarMinimo(Infinity)).toBeNull();
    });
});

describe('cruzaMinimo', () => {
    test('detecta solo el cruce desde arriba hasta el mínimo o por debajo', () => {
        expect(cruzaMinimo(10, 5, 5)).toBe(true);
        expect(cruzaMinimo(10, 4, 5)).toBe(true);
        expect(cruzaMinimo(6, 5, 5)).toBe(true);
    });

    test('no alerta si ya estaba en el mínimo, seguía arriba o no hay mínimo', () => {
        expect(cruzaMinimo(5, 4, 5)).toBe(false);
        expect(cruzaMinimo(10, 6, 5)).toBe(false);
        expect(cruzaMinimo(10, 5, null)).toBe(false);
        expect(cruzaMinimo(10, 5, -1)).toBe(false);
    });
});
