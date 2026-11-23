const {
    calcularEnvio,
    minutosPreparacion,
    minutosViaje,
    minutosEstimados,
    estimarLlegada,
} = require('../../src/utils/entrega');

// Los valores por defecto de los parámetros del sistema
const P = {
    envioBase: 1200,
    envioPorKm: 300,
    preparacionBaseMin: 10,
    preparacionPorProductoMin: 2,
    viajeMinPorKm: 4,
    margenDemoraMin: 5,
};

const MIN = 60 * 1000;
const T0 = new Date('2026-11-20T20:00:00Z'); // hora en que se hizo el pedido
const a = (minutos) => new Date(T0.getTime() + minutos * MIN); // T0 + n minutos

describe('calcularEnvio', () => {
    test('suma el envío base más los km por el precio por km', () => {
        expect(calcularEnvio(2.5, P)).toBe(1950); // 1200 + 2,5 × 300
    });

    test('redondea al peso', () => {
        expect(calcularEnvio(1.333, P)).toBe(1600); // 1200 + 399,9
    });

    test('a 0 km cobra solo el envío base', () => {
        expect(calcularEnvio(0, P)).toBe(1200);
    });

    test('con los parámetros en 0 el envío es gratis', () => {
        expect(calcularEnvio(5, { ...P, envioBase: 0, envioPorKm: 0 })).toBe(0);
    });
});

describe('tiempos', () => {
    test('la preparación es la base más un tiempo por cada unidad', () => {
        expect(minutosPreparacion(3, P)).toBe(16); // 10 + 3 × 2
    });

    test('el viaje se redondea hacia arriba al minuto', () => {
        expect(minutosViaje(2.5, P)).toBe(10);
        expect(minutosViaje(2.6, P)).toBe(11); // 10,4 → 11
    });

    test('el tiempo estimado es preparación + viaje', () => {
        expect(minutosEstimados(3, 2.5, P)).toBe(26); // 16 + 10
    });
});

describe('estimarLlegada', () => {
    // 3 unidades → 16 min de preparación; 2,5 km → 10 min de viaje
    const base = { fecha: T0, unidades: 3, distanciaKm: 2.5, parametros: P };

    describe('pedidos terminados', () => {
        test.each(['Entregado', 'entregado', 'Cancelado'])('devuelve null si el pedido está %s', (estado) => {
            expect(estimarLlegada({ ...base, estado, ahora: a(5) })).toBeNull();
        });
    });

    describe('Pendiente o En proceso', () => {
        test('a tiempo: llega al terminar la preparación más el viaje', () => {
            const r = estimarLlegada({ ...base, estado: 'Pendiente', ahora: a(5) });

            expect(r.llegaAprox).toEqual(a(26));
            expect(r.minutosRestantes).toBe(21);
            expect(r.demorado).toBe(false);
        });

        test('demorado: si la preparación se pasó, suma el margen y después el viaje', () => {
            const r = estimarLlegada({ ...base, estado: 'En proceso', ahora: a(20) });

            expect(r.demorado).toBe(true);
            expect(r.llegaAprox).toEqual(a(35)); // ahora (20) + margen (5) + viaje (10)
            expect(r.minutosRestantes).toBe(15);
        });

        test('el estado se compara sin importar mayúsculas', () => {
            const r = estimarLlegada({ ...base, estado: 'EN PROCESO', ahora: a(5) });

            expect(r.llegaAprox).toEqual(a(26));
        });
    });

    describe('En camino', () => {
        test('a tiempo: llega al salir más el viaje', () => {
            const historial = [{ estado: 'En camino', fecha: a(20) }];
            const r = estimarLlegada({ ...base, estado: 'En camino', historial, ahora: a(25) });

            expect(r.llegaAprox).toEqual(a(30)); // salió a los 20 + 10 de viaje
            expect(r.minutosRestantes).toBe(5);
            expect(r.demorado).toBe(false);
        });

        test('demorado: si el viaje se pasó, estima la llegada con el margen de demora', () => {
            const historial = [{ estado: 'En camino', fecha: a(20) }];
            const r = estimarLlegada({ ...base, estado: 'En camino', historial, ahora: a(40) });

            expect(r.demorado).toBe(true);
            expect(r.llegaAprox).toEqual(a(45)); // ahora (40) + margen (5)
            expect(r.minutosRestantes).toBe(5);
        });

        test('si no está registrada la salida, cuenta el viaje desde ahora', () => {
            const r = estimarLlegada({ ...base, estado: 'En camino', historial: [], ahora: a(30) });

            expect(r.llegaAprox).toEqual(a(40));
            expect(r.minutosRestantes).toBe(10);
            expect(r.demorado).toBe(false);
        });

        test('usa la última salida registrada (por ejemplo, después de una reasignación)', () => {
            const historial = [
                { estado: 'Pendiente', fecha: a(0) },
                { estado: 'En camino', fecha: a(10) },
                { estado: 'en camino', fecha: a(20) },
            ];
            const r = estimarLlegada({ ...base, estado: 'En camino', historial, ahora: a(25) });

            expect(r.llegaAprox).toEqual(a(30));
            expect(r.demorado).toBe(false);
        });
    });

    describe('valores por defecto', () => {
        afterEach(() => jest.useRealTimers());

        test('sin "ahora" ni historial, usa la hora actual', () => {
            jest.useFakeTimers().setSystemTime(a(30));

            const r = estimarLlegada({ ...base, estado: 'En camino' });

            expect(r.llegaAprox).toEqual(a(40));
            expect(r.minutosRestantes).toBe(10);
        });
    });
});