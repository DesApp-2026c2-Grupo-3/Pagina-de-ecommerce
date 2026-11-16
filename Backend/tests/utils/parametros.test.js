
const { Parametro } = require('../../src/models');
const { obtenerParametros } = require('../../src/utils/parametros');

jest.mock('../../src/models', () => ({
    Parametro: {
        findOrCreate: jest.fn(),
    },
}));

describe('obtenerParametros', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const crearFila = (datos) => ({
        get: jest.fn().mockReturnValue(datos),
    });

    test('obtiene los parámetros y convierte los decimales a números', async () => {
        const transaction = { id: 'transaction-1' };

        const datos = {
            id: 1,
            radioEntregaKm: '10.00',
            envioBase: '500.50',
            envioPorKm: '25.75',
            viajeMinPorKm: '2.50',
            activo: true,
        };

        Parametro.findOrCreate.mockResolvedValue([
            crearFila(datos),
            false,
        ]);

        const resultado = await obtenerParametros(transaction);

        expect(Parametro.findOrCreate).toHaveBeenCalledWith({
            where: { id: 1 },
            defaults: { id: 1 },
            transaction,
        });

        expect(resultado).toEqual({
            id: 1,
            radioEntregaKm: 10,
            envioBase: 500.5,
            envioPorKm: 25.75,
            viajeMinPorKm: 2.5,
            activo: true,
        });

        expect(typeof resultado.radioEntregaKm).toBe('number');
        expect(typeof resultado.envioBase).toBe('number');
        expect(typeof resultado.envioPorKm).toBe('number');
        expect(typeof resultado.viajeMinPorKm).toBe('number');
    });

    test('crea los parámetros por defecto si no existen', async () => {
        const transaction = { id: 'transaction-2' };

        const datos = {
            id: 1,
            radioEntregaKm: '5.00',
            envioBase: '100.00',
            envioPorKm: '20.00',
            viajeMinPorKm: '3.00',
        };

        Parametro.findOrCreate.mockResolvedValue([
            crearFila(datos),
            true,
        ]);

        const resultado = await obtenerParametros(transaction);

        expect(Parametro.findOrCreate).toHaveBeenCalledWith({
            where: { id: 1 },
            defaults: { id: 1 },
            transaction,
        });

        expect(resultado.radioEntregaKm).toBe(5);
        expect(resultado.envioBase).toBe(100);
        expect(resultado.envioPorKm).toBe(20);
        expect(resultado.viajeMinPorKm).toBe(3);
    });

    test('devuelve los demás campos sin modificarlos', async () => {
        const datos = {
            id: 1,
            radioEntregaKm: '10.00',
            envioBase: '500.00',
            envioPorKm: '25.00',
            viajeMinPorKm: '2.00',
            moneda: 'ARS',
            activo: true,
        };

        Parametro.findOrCreate.mockResolvedValue([
            crearFila(datos),
            false,
        ]);

        const resultado = await obtenerParametros();

        expect(resultado.moneda).toBe('ARS');
        expect(resultado.activo).toBe(true);
    });
});
