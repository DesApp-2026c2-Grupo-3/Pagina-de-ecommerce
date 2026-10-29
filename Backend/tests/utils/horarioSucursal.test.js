const {
    ZONA_HORARIA_POR_DEFECTO,
    HORARIO_POR_DEFECTO,
    DIAS_SEMANA,
    esZonaHorariaValida,
    obtenerHoraLocal,
    estadoSucursal,
    estaSucursalAbierta,
} = require('../../src/utils/horarioSucursal');

function horarioDe(dia, config) {
    return { [dia]: config };
}

const lunes = new Date('2026-10-05T12:00:00Z');
const lunesNoche = new Date('2026-10-06T02:30:00Z');
const martesMadrugada = new Date('2026-10-06T04:00:00Z');
const martesMediodia = new Date('2026-10-06T15:00:00Z');

describe('constantes de horario', () => {
    test('define los siete días y el horario por defecto', () => {
        expect(DIAS_SEMANA).toEqual([
            'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo',
        ]);
        DIAS_SEMANA.forEach((dia) => {
            expect(HORARIO_POR_DEFECTO[dia]).toEqual({
                apertura: '09:00',
                cierre: '23:00',
                abierto: true,
            });
        });
    });
});

describe('esZonaHorariaValida', () => {
    test('acepta una zona IANA válida', () => {
        expect(esZonaHorariaValida('America/Argentina/Buenos_Aires')).toBe(true);
    });

    test('rechaza zonas inválidas, vacías o que no son texto', () => {
        expect(esZonaHorariaValida('Marte/Olympus')).toBe(false);
        expect(esZonaHorariaValida('   ')).toBe(false);
        expect(esZonaHorariaValida(null)).toBe(false);
        expect(esZonaHorariaValida(123)).toBe(false);
    });
});

describe('obtenerHoraLocal', () => {
    test('devuelve el día y los minutos en la zona indicada', () => {
        expect(obtenerHoraLocal(lunes)).toEqual({ dia: 'lunes', minutos: 9 * 60 });
    });

    test('usa la zona por defecto si la zona es inválida', () => {
        expect(obtenerHoraLocal(lunes, 'Zona/Invalida')).toEqual({ dia: 'lunes', minutos: 9 * 60 });
    });

    test('la zona por defecto es Buenos Aires', () => {
        expect(ZONA_HORARIA_POR_DEFECTO).toBe('America/Argentina/Buenos_Aires');
    });
});

describe('estadoSucursal', () => {
    test('un horario ausente o inválido no bloquea', () => {
        expect(estadoSucursal(null)).toEqual({ abierta: true, motivo: null });
        expect(estadoSucursal('texto')).toEqual({ abierta: true, motivo: null });
        expect(estadoSucursal([])).toEqual({ abierta: true, motivo: null });
    });

    test('un día sin configuración no bloquea', () => {
        expect(estadoSucursal({}, 'America/Argentina/Buenos_Aires', lunes))
            .toEqual({ abierta: true, motivo: null });
    });

    test('una configuración que no es objeto no bloquea', () => {
        expect(estadoSucursal(horarioDe('lunes', 'abierto')))
            .toEqual({ abierta: true, motivo: null });
    });

    test('abre dentro del horario', () => {
        const horario = horarioDe('lunes', { apertura: '09:00', cierre: '23:00', abierto: true });

        expect(estadoSucursal(horario, undefined, lunes)).toEqual({ abierta: true, motivo: null });
    });

    test('cierra antes de la apertura', () => {
        const horario = horarioDe('lunes', { apertura: '10:00', cierre: '23:00', abierto: true });

        expect(estadoSucursal(horario, undefined, lunes)).toEqual({
            abierta: false,
            motivo: 'La sucursal se encuentra cerrada en este horario. Atiende de 10:00 a 23:00',
        });
    });

    test('cierra después del cierre', () => {
        const horario = horarioDe('lunes', { apertura: '09:00', cierre: '23:00', abierto: true });

        expect(estadoSucursal(horario, undefined, lunesNoche).abierta).toBe(false);
    });

    test('informa cuando el día está marcado como cerrado', () => {
        const horario = horarioDe('lunes', { apertura: '09:00', cierre: '23:00', abierto: false });

        expect(estadoSucursal(horario, undefined, lunes)).toEqual({
            abierta: false,
            motivo: 'La sucursal no atiende los lunes',
        });
    });

    test('no bloquea si las horas son inválidas o falta el booleano', () => {
        expect(estadoSucursal(horarioDe('lunes', { apertura: '9:00', cierre: '23:00', abierto: true }), undefined, lunes).abierta).toBe(true);
        expect(estadoSucursal(horarioDe('lunes', { apertura: '09:00', cierre: '24:00', abierto: true }), undefined, lunes).abierta).toBe(true);
        expect(estadoSucursal(horarioDe('lunes', { apertura: '09:00', cierre: '23:00', abierto: 'si' }), undefined, lunes).abierta).toBe(true);
    });

    test('interpreta el cierre 00:00 como medianoche', () => {
        const horario = horarioDe('lunes', { apertura: '18:00', cierre: '00:00', abierto: true });

        expect(estadoSucursal(horario, undefined, lunesNoche).abierta).toBe(true);
    });

    test('soporta horarios que cruzan la medianoche', () => {
        const horario = horarioDe('martes', { apertura: '22:00', cierre: '02:00', abierto: true });

        expect(estadoSucursal(horario, undefined, martesMadrugada).abierta).toBe(true);
        expect(estadoSucursal(horario, undefined, martesMediodia).abierta).toBe(false);
    });

    test('estaSucursalAbierta devuelve el booleano', () => {
        const horario = horarioDe('lunes', { apertura: '09:00', cierre: '23:00', abierto: true });

        expect(estaSucursalAbierta(horario, undefined, lunes)).toBe(true);
        expect(estaSucursalAbierta(null, undefined, lunes)).toBe(true);
    });
});
