const {
    ZONA_HORARIA_POR_DEFECTO,
    HORARIO_POR_DEFECTO,
    DIAS_SEMANA,
    esZonaHorariaValida,
    obtenerHoraLocal,
    topeTransnoche,
    formatearExceso,
    validarHorarioSucursal,
    estadoSucursal,
    estaSucursalAbierta,
} = require('../../src/utils/horarioSucursal');

const dia = (apertura = '09:00', cierre = '23:00', extra = {}) => ({ abierto: true, apertura, cierre, ...extra });
const cerrado = () => ({ abierto: false, apertura: '09:00', cierre: '23:00' });

// Una semana con el horario por defecto, pisando los días indicados
const semana = (config = {}) => Object.fromEntries(DIAS_SEMANA.map((d) => [d, config[d] ?? dia()]));

// Instantes en Buenos Aires (UTC-3)
const lunes0900 = new Date('2026-10-05T12:00:00Z');
const lunes0800 = new Date('2026-10-05T11:00:00Z');
const lunes2330 = new Date('2026-10-06T02:30:00Z');
const martes0100 = new Date('2026-10-06T04:00:00Z');
const martes0230 = new Date('2026-10-06T05:30:00Z');

describe('constantes', () => {
    test('los siete días y un horario por defecto válido', () => {
        expect(DIAS_SEMANA).toHaveLength(7);
        expect(HORARIO_POR_DEFECTO.lunes).toEqual({ apertura: '09:00', cierre: '23:00', abierto: true });
        expect(validarHorarioSucursal(HORARIO_POR_DEFECTO)).toBeNull();
    });

    test('valida zonas horarias IANA', () => {
        expect(esZonaHorariaValida(ZONA_HORARIA_POR_DEFECTO)).toBe(true);
        for (const mala of ['Marte/Olympus', '   ', null, 123]) expect(esZonaHorariaValida(mala)).toBe(false);
    });

    test('obtenerHoraLocal usa la zona de la sucursal', () => {
        expect(obtenerHoraLocal(lunes0900, ZONA_HORARIA_POR_DEFECTO)).toEqual({ dia: 'lunes', minutos: 540 });
        expect(obtenerHoraLocal(lunes0900, 'zona-mala')).toEqual({ dia: 'lunes', minutos: 540 });
    });
});

describe('validarHorarioSucursal', () => {
    test('acepta un día abierto, uno cerrado y uno que cierra a las 23:59', () => {
        expect(validarHorarioSucursal(semana())).toBeNull();
        expect(validarHorarioSucursal(semana({ domingo: cerrado() }))).toBeNull();
        expect(validarHorarioSucursal(semana({ lunes: dia('00:00', '23:59') }))).toBeNull();
    });

    test.each([
        ['cierre igual a la apertura', dia('09:00', '09:00'), 'En el lunes, el cierre tiene que ser posterior a la apertura'],
        ['cierre anterior a la apertura', dia('18:00', '02:00'), 'En el lunes, el cierre tiene que ser posterior a la apertura'],
        ['una hora fuera de rango', dia('09:00', '24:00'), 'Las horas del lunes van de 00:00 a 23:59 (formato HH:MM)'],
        ['una hora con formato inválido', dia('9am', '23:00'), 'Las horas del lunes van de 00:00 a 23:59 (formato HH:MM)'],
        ['un día sin indicar si está abierto', { apertura: '09:00', cierre: '23:00' }, 'Indicá si la sucursal atiende el lunes'],
    ])('rechaza %s', (_nombre, config, mensaje) => {
        expect(validarHorarioSucursal(semana({ lunes: config }))).toBe(mensaje);
    });

    test('rechaza lo que no es un horario', () => {
        for (const malo of [null, [], 'texto', 42]) expect(validarHorarioSucursal(malo)).not.toBeNull();
        const incompleto = semana();
        delete incompleto.martes;
        expect(validarHorarioSucursal(incompleto)).toBe('Completá el horario del martes');
    });
});

describe('transnoche', () => {
    const conTransnoche = (min, extra = {}) => semana({ lunes: dia('18:00', '23:59', { transnocheMin: min }), ...extra });

    test('hasta las 06:00 si el día siguiente abre tarde', () => {
        expect(validarHorarioSucursal(conTransnoche(360))).toBeNull();
        expect(validarHorarioSucursal(conTransnoche(361))).toBe('La transnoche del lunes puede llegar hasta +06:00');
    });

    test('termina una hora antes de que abra el día siguiente', () => {
        const abreTemprano = { martes: dia('05:00', '15:00') };
        expect(validarHorarioSucursal(conTransnoche(240, abreTemprano))).toBeNull();
        expect(validarHorarioSucursal(conTransnoche(241, abreTemprano))).toBe('La transnoche del lunes puede llegar hasta +04:00');
    });

    test('si el día siguiente abre antes de la 01:00 no hay transnoche', () => {
        expect(validarHorarioSucursal(conTransnoche(30, { martes: dia('00:30', '15:00') }))).toBe(
            'El día siguiente abre muy temprano: el lunes no admite transnoche',
        );
    });

    test('si el día siguiente está cerrado, vale hasta las 06:00', () => {
        expect(validarHorarioSucursal(conTransnoche(360, { martes: cerrado() }))).toBeNull();
    });

    test('el domingo mira al lunes', () => {
        const horario = semana({ domingo: dia('18:00', '23:59', { transnocheMin: 300 }), lunes: dia('05:00', '15:00') });
        expect(validarHorarioSucursal(horario)).toBe('La transnoche del domingo puede llegar hasta +04:00');
    });

    test('solo si el día cierra a las 23:59', () => {
        expect(validarHorarioSucursal(semana({ lunes: dia('18:00', '23:00', { transnocheMin: 60 }) }))).toBe(
            'La transnoche del lunes requiere cerrar a las 23:59',
        );
    });

    test('un día cerrado no admite transnoche', () => {
        expect(validarHorarioSucursal(semana({ lunes: { ...cerrado(), cierre: '23:59', transnocheMin: 60 } }))).toBe(
            'El lunes está cerrado: no puede tener transnoche',
        );
    });

    test.each([0, -5, 1.5, '60'])('rechaza %p minutos', (min) => {
        expect(validarHorarioSucursal(conTransnoche(min))).toBe('La transnoche del lunes tiene que ser de al menos 1 minuto');
    });

    test('topeTransnoche y el formato del exceso', () => {
        expect(topeTransnoche(semana(), 'lunes')).toBe(360); // el martes abre a las 09:00: 480 - 60 > 360
        expect(topeTransnoche(semana({ martes: dia('05:00', '15:00') }), 'lunes')).toBe(240);
        expect(formatearExceso(150)).toBe('+02:30');
        expect(formatearExceso(360)).toBe('+06:00');
        expect(formatearExceso(5)).toBe('+00:05');
    });
});

describe('estadoSucursal', () => {
    test('sin horario no bloquea', () => {
        for (const sin of [undefined, null, [], 'x']) expect(estadoSucursal(sin).abierta).toBe(true);
    });

    test('abierta dentro del horario y cerrada fuera, con el motivo', () => {
        expect(estadoSucursal(semana(), ZONA_HORARIA_POR_DEFECTO, lunes0900)).toEqual({ abierta: true, motivo: null });
        expect(estadoSucursal(semana(), ZONA_HORARIA_POR_DEFECTO, lunes0800)).toEqual({
            abierta: false,
            motivo: 'La sucursal se encuentra cerrada en este horario. Atiende de 09:00 a 23:00',
        });
    });

    test('un día cerrado informa que no atiende', () => {
        expect(estadoSucursal(semana({ lunes: cerrado() }), ZONA_HORARIA_POR_DEFECTO, lunes0900)).toEqual({
            abierta: false,
            motivo: 'La sucursal no atiende los lunes',
        });
    });

    test('23:59 llega hasta el final del día', () => {
        const horario = semana({ lunes: dia('18:00', '23:59') });
        expect(estadoSucursal(horario, ZONA_HORARIA_POR_DEFECTO, lunes2330).abierta).toBe(true);
    });

    test('la transnoche mantiene abierta la madrugada siguiente', () => {
        const horario = semana({ lunes: dia('18:00', '23:59', { transnocheMin: 120 }), martes: dia('12:00', '20:00') });
        expect(estadoSucursal(horario, ZONA_HORARIA_POR_DEFECTO, martes0100).abierta).toBe(true); // 01:00
        const pasada = estadoSucursal(horario, ZONA_HORARIA_POR_DEFECTO, martes0230); // 02:30
        expect(pasada.abierta).toBe(false);
        expect(pasada.motivo).toBe('La sucursal se encuentra cerrada en este horario. Atiende de 12:00 a 20:00');
    });

    test('la transnoche vale aunque el día siguiente esté cerrado', () => {
        const horario = semana({ lunes: dia('18:00', '23:59', { transnocheMin: 120 }), martes: cerrado() });
        expect(estadoSucursal(horario, ZONA_HORARIA_POR_DEFECTO, martes0100).abierta).toBe(true);
        expect(estadoSucursal(horario, ZONA_HORARIA_POR_DEFECTO, martes0230).abierta).toBe(false);
    });

    test('el motivo muestra la transnoche con su exceso', () => {
        const horario = semana({ lunes: dia('18:00', '23:59', { transnocheMin: 150 }) });
        expect(estadoSucursal(horario, ZONA_HORARIA_POR_DEFECTO, lunes0900).motivo).toBe(
            'La sucursal se encuentra cerrada en este horario. Atiende de 18:00 a 23:59 +02:30',
        );
    });

    test('usa la zona horaria de la sucursal', () => {
        // Mismo instante: lunes 09:00 en Buenos Aires, lunes 21:00 en Tokio
        const horario = semana({ lunes: dia('08:00', '10:00') });
        expect(estadoSucursal(horario, ZONA_HORARIA_POR_DEFECTO, lunes0900).abierta).toBe(true);
        expect(estadoSucursal(horario, 'Asia/Tokyo', lunes0900).abierta).toBe(false);
    });

    test('un horario con datos incoherentes no bloquea la sucursal', () => {
        expect(estadoSucursal(semana({ lunes: dia('18:00', '02:00') }), ZONA_HORARIA_POR_DEFECTO, lunes0900).abierta).toBe(true);
        expect(estadoSucursal(semana({ lunes: { abierto: true } }), ZONA_HORARIA_POR_DEFECTO, lunes0900).abierta).toBe(true);
    });

    test('estaSucursalAbierta es la versión booleana', () => {
        expect(estaSucursalAbierta(semana(), ZONA_HORARIA_POR_DEFECTO, lunes0900)).toBe(true);
        expect(estaSucursalAbierta(semana(), ZONA_HORARIA_POR_DEFECTO, lunes0800)).toBe(false);
    });
});
