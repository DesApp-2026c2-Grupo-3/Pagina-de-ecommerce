const { distanciaKm } = require('../../src/utils/distancia');

describe('distanciaKm', () => {
    test('la distancia entre un punto y sí mismo es 0', () => {
        expect(distanciaKm({ lat: -34.65, lng: -58.62 }, { lat: -34.65, lng: -58.62 })).toBe(0);
    });

    test('un grado de latitud equivale a unos 111 km', () => {
        expect(distanciaKm({ lat: 0, lng: 0 }, { lat: 1, lng: 0 })).toBeCloseTo(111.19, 1);
    });

    test('calcula la distancia aproximada entre Buenos Aires y Córdoba', () => {
        const buenosAires = { lat: -34.6037, lng: -58.3816 };
        const cordoba = { lat: -31.4201, lng: -64.1888 };

        const distancia = distanciaKm(buenosAires, cordoba);

        expect(distancia).toBeGreaterThan(600);
        expect(distancia).toBeLessThan(700);
    });

    test('es simétrica', () => {
        const a = { lat: -34.65, lng: -58.62 };
        const b = { lat: -31.42, lng: -64.19 };

        expect(distanciaKm(a, b)).toBeCloseTo(distanciaKm(b, a), 10);
    });

    test('funciona cruzando el meridiano de 180°', () => {
        const distancia = distanciaKm({ lat: 0, lng: 179.9 }, { lat: 0, lng: -179.9 });

        expect(distancia).toBeGreaterThan(20);
        expect(distancia).toBeLessThan(25);
    });

    test('siempre devuelve un número finito y no negativo', () => {
        const distancia = distanciaKm({ lat: -90, lng: 0 }, { lat: 90, lng: 0 });

        expect(Number.isFinite(distancia)).toBe(true);
        expect(distancia).toBeGreaterThan(20000);
        expect(distancia).toBeLessThan(20030);
    });
});
