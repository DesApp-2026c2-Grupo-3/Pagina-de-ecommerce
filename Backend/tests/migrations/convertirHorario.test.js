const { convertirHorario } = require('../../src/utils/convertirHorario');
const { validarHorarioSucursal } = require('../../src/utils/horarioSucursal');

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
const semana = (dia) => Object.fromEntries(DIAS.map((d) => [d, typeof dia === 'function' ? dia(d) : { ...dia }]));

describe('convertirHorario', () => {
    test('el formato original no cambia, salvo el orden de las claves', () => {
        const nuevo = convertirHorario(semana({ apertura: '09:00', cierre: '23:00', abierto: true }));
        expect(nuevo.lunes).toEqual({ abierto: true, apertura: '09:00', cierre: '23:00' });
        expect(validarHorarioSucursal(nuevo)).toBeNull();
    });

    test('un cierre menor que la apertura pasa a cerrar a las 23:59 con transnoche', () => {
        const nuevo = convertirHorario(semana({ apertura: '18:00', cierre: '02:00', abierto: true }));
        expect(nuevo.viernes).toEqual({ abierto: true, apertura: '18:00', cierre: '23:59', transnocheMin: 120 });
        expect(validarHorarioSucursal(nuevo)).toBeNull();
    });

    test('el cierre "00:00" era el final del día: pasa a 23:59', () => {
        const nuevo = convertirHorario(semana({ apertura: '10:00', cierre: '00:00', abierto: true }));
        expect(nuevo.martes).toEqual({ abierto: true, apertura: '10:00', cierre: '23:59' });
    });

    test('un día cerrado conserva sus horas', () => {
        const nuevo = convertirHorario(semana({ apertura: '08:00', cierre: '20:00', abierto: false }));
        expect(nuevo.domingo).toEqual({ abierto: false, apertura: '08:00', cierre: '20:00' });
    });

    test('el formato de turnos queda en una franja, del primer turno al último', () => {
        const turnos = [
            { apertura: '12:00', cierre: '15:00', cruzaMedianoche: false },
            { apertura: '19:00', cierre: '02:00', cruzaMedianoche: true },
        ];
        const nuevo = convertirHorario(semana({ abierto: true, turnos }));
        expect(nuevo.lunes).toEqual({ abierto: true, apertura: '12:00', cierre: '23:59', transnocheMin: 120 });
        expect(validarHorarioSucursal(nuevo)).toBeNull();
    });

    test('recorta la transnoche al tope que deja el día siguiente', () => {
        const nuevo = convertirHorario(semana((dia) => (
            dia === 'martes'
                ? { apertura: '03:00', cierre: '10:00', abierto: true }
                : { apertura: '19:00', cierre: '05:00', abierto: true }
        )));
        expect(nuevo.lunes.transnocheMin).toBe(120); // el martes abre a las 03:00: tope 02:00
        expect(validarHorarioSucursal(nuevo)).toBeNull();
    });

    test('es idempotente', () => {
        const una = convertirHorario(semana({ apertura: '19:00', cierre: '05:00', abierto: true }));
        expect(convertirHorario(una)).toEqual(una);
    });

    test('un valor que no es un horario cae al horario por defecto, que es válido', () => {
        for (const raro of [null, 'Lun a Vie 9 a 18', [], 42, '{"lunes":1}']) {
            const nuevo = convertirHorario(raro);
            expect(Object.keys(nuevo)).toEqual(DIAS);
            expect(validarHorarioSucursal(nuevo)).toBeNull();
        }
    });

    test('un texto JSON se interpreta', () => {
        const texto = JSON.stringify(semana({ apertura: '09:00', cierre: '23:00', abierto: true }));
        expect(convertirHorario(texto).lunes).toEqual({ abierto: true, apertura: '09:00', cierre: '23:00' });
    });
});
