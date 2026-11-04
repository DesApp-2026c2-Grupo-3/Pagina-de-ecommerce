const { diaDeHoy, vigenteHoy, aplicarDescuento, MAX_PROMOS_POR_DIA } = require('../../src/config/promociones');

describe('diaDeHoy', () => {
    test('usa el día de Argentina, no el de UTC', () => {
        // Viernes 30/10/2026, 12:00 en Argentina
        expect(diaDeHoy(new Date('2026-10-30T15:00:00Z'))).toBe(5);
        // Sábado 01:00 UTC todavía es viernes a la noche en Argentina
        expect(diaDeHoy(new Date('2026-10-31T01:00:00Z'))).toBe(5);
        // Domingo
        expect(diaDeHoy(new Date('2026-11-01T15:00:00Z'))).toBe(0);
    });
});

describe('vigenteHoy', () => {
    const viernes = new Date('2026-10-30T15:00:00Z');

    test('una promo sin días (o con la lista vacía) vale toda la semana', () => {
        expect(vigenteHoy({}, viernes)).toBe(true);
        expect(vigenteHoy({ dias: [] }, viernes)).toBe(true);
    });

    test('una promo del día solo vale en sus días', () => {
        expect(vigenteHoy({ dias: [5] }, viernes)).toBe(true);
        expect(vigenteHoy({ dias: [1, 2] }, viernes)).toBe(false);
    });
});

describe('aplicarDescuento', () => {
    test.each([
        [1000, 0.2, 800],
        [1000, 0.5, 500],
        [1000, 1, 0],
        [1000, 0, 1000],
        [1999, 0.25, 1499],
    ])('precio %d con descuento %d da %d', (precio, descuento, esperado) => {
        expect(aplicarDescuento(precio, descuento)).toBe(esperado);
    });
});

test('hay un máximo de 3 promos activas por día', () => {
    expect(MAX_PROMOS_POR_DIA).toBe(3);
});
