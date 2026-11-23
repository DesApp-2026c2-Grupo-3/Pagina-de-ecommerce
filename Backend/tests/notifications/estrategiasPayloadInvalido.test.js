// Cada estrategia arma un aviso a partir de un payload. Si el payload no es un objeto
// (o le falta el pedido), tiene que rechazarlo con NOTIFICACION_INVALIDA en lugar de
// guardar un aviso incompleto (RN-40: nunca se avisa algo que no ocurrió).
const pedidoCreado = require('../../src/notifications/estrategias/pedidoCreado.strategy');
const pedidoEstadoCambiado = require('../../src/notifications/estrategias/pedidoEstadoCambiado.strategy');
const stockBajo = require('../../src/notifications/estrategias/stockBajo.strategy');
const sucursalCerrada = require('../../src/notifications/estrategias/sucursalCerrada.strategy');
const sucursalModificadaPorAdmin = require('../../src/notifications/estrategias/sucursalModificadaPorAdmin.strategy');
const viajeAsignado = require('../../src/notifications/estrategias/viajeAsignado.strategy');
const viajeReasignado = require('../../src/notifications/estrategias/viajeReasignado.strategy');
const viajeRequiereAsistencia = require('../../src/notifications/estrategias/viajeRequiereAsistencia.strategy');
const { texto, numero, fechaIso } = require('../../src/notifications/estrategias/comunes');

const ESTRATEGIAS = [
    pedidoCreado,
    pedidoEstadoCambiado,
    stockBajo,
    sucursalCerrada,
    sucursalModificadaPorAdmin,
    viajeAsignado,
    viajeReasignado,
    viajeRequiereAsistencia,
];

// Payloads que no son un objeto válido
const PAYLOADS_INVALIDOS = [
    ['null', null],
    ['undefined', undefined],
    ['un texto', 'pedido'],
    ['un número', 15],
    ['una lista', [{ id: 1 }]],
];

function errorDe(fn) {
    try {
        fn();
    } catch (error) {
        return error;
    }
    return null;
}

describe.each(ESTRATEGIAS.map((e) => [e.tipo, e]))('estrategia %s', (_, estrategia) => {
    test.each(PAYLOADS_INVALIDOS)('rechaza un payload que es %s', (__, payload) => {
        const error = errorDe(() => estrategia.construir(payload));

        expect(error).not.toBeNull();
        expect(error.code).toBe('NOTIFICACION_INVALIDA');
    });
});

describe.each([
    ['pedido.creado', pedidoCreado],
    ['pedido.estado_cambiado', pedidoEstadoCambiado],
])('estrategia %s sin pedido', (tipo, estrategia) => {
    test.each([
        ['sin la propiedad pedido', {}],
        ['con el pedido en null', { pedido: null }],
        ['con el pedido como texto', { pedido: '15' }],
    ])('rechaza un payload %s', (_, payload) => {
        const error = errorDe(() => estrategia.construir(payload));

        expect(error.code).toBe('NOTIFICACION_INVALIDA');
        expect(error.message).toBe(`${tipo} requiere un pedido`);
    });
});

describe('funciones comunes de las estrategias', () => {
    test.each([null, undefined])('texto convierte %s en un texto vacío', (valor) => {
        expect(texto(valor)).toBe('');
    });

    test('numero usa el valor por defecto si no es un número', () => {
        expect(numero('abc')).toBe(0);
        expect(numero(undefined, 5)).toBe(5);
        expect(numero('12.5')).toBe(12.5);
    });

    describe('fechaIso', () => {
        afterEach(() => jest.useRealTimers());

        test('convierte una fecha válida a formato ISO', () => {
            expect(fechaIso('2026-11-20T20:00:00Z')).toBe('2026-11-20T20:00:00.000Z');
        });

        test.each([['sin fecha', undefined], ['con una fecha inválida', 'no es una fecha']])(
            '%s usa la fecha actual',
            (_, valor) => {
                jest.useFakeTimers().setSystemTime(new Date('2026-11-20T21:30:00Z'));

                expect(fechaIso(valor)).toBe('2026-11-20T21:30:00.000Z');
            },
        );
    });
});