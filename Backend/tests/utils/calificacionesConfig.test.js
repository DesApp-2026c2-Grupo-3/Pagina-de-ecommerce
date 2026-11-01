const {
    MINUTOS_PARA_CALIFICAR, DIAS_PARA_CALIFICAR, HORAS_PARA_EDITAR,
    ventanaDeCalificacion, estadoDeLaVentana, sePuedeEditar,
} = require('../../src/config/calificaciones');

const entrega = new Date('2026-10-30T20:00:00Z');
const despues = (ms) => new Date(entrega.getTime() + ms);
const MIN = 60 * 1000;
const HORA = 60 * MIN;
const DIA = 24 * HORA;

test('las reglas acordadas: 1 hora para empezar, 7 días de plazo y 24 horas para corregir', () => {
    expect(MINUTOS_PARA_CALIFICAR).toBe(60);
    expect(DIAS_PARA_CALIFICAR).toBe(7);
    expect(HORAS_PARA_EDITAR).toBe(24);
});

describe('ventanaDeCalificacion', () => {
    test('abre 1 hora después de la entrega y cierra a los 7 días', () => {
        const { desde, hasta } = ventanaDeCalificacion(entrega);
        expect(desde).toEqual(despues(HORA));
        expect(hasta).toEqual(despues(7 * DIA));
    });
});

describe('estadoDeLaVentana', () => {
    test.each([
        [0, 'ANTES'],
        [59 * MIN, 'ANTES'],
        [60 * MIN, 'ABIERTA'],
        [3 * DIA, 'ABIERTA'],
        [7 * DIA, 'ABIERTA'],
        [7 * DIA + MIN, 'VENCIDA'],
    ])('a los %d ms de la entrega está %s', (ms, esperado) => {
        expect(estadoDeLaVentana(entrega, despues(ms))).toBe(esperado);
    });
});

describe('sePuedeEditar', () => {
    test('se puede corregir durante 24 horas', () => {
        expect(sePuedeEditar(entrega, despues(23 * HORA))).toBe(true);
        expect(sePuedeEditar(entrega, despues(24 * HORA))).toBe(true);
        expect(sePuedeEditar(entrega, despues(24 * HORA + MIN))).toBe(false);
    });
});
