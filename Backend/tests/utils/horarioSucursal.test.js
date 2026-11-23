const {
    ZONA_HORARIA_POR_DEFECTO,
    HORARIO_POR_DEFECTO,
    DIAS_SEMANA,
    esZonaHorariaValida,
    obtenerHoraLocal,
    validarHorarioSucursal,
    estadoSucursal,
    estaSucursalAbierta,
} = require('../../src/utils/horarioSucursal');

function turno(apertura = '09:00', cierre = '23:00', cruzaMedianoche = false) {
    return { apertura, cierre, cruzaMedianoche };
}

function dia(turnos = [turno()], abierto = true) {
    return { abierto, turnos };
}

function horarioCon(config = {}) {
    return Object.fromEntries(
        DIAS_SEMANA.map((nombre) => [nombre, config[nombre] ?? dia()])
    );
}

function horarioDe(nombre, config) {
    return horarioCon({ [nombre]: config });
}

const lunes = new Date('2026-10-05T12:00:00Z'); // lunes 09:00 en Buenos Aires
const lunesMadrugada = new Date('2026-10-05T04:00:00Z'); // lunes 01:00
const lunesNoche = new Date('2026-10-06T02:30:00Z'); // lunes 23:30
const martesMadrugada = new Date('2026-10-06T04:00:00Z'); // martes 01:00
const martesMediodia = new Date('2026-10-06T15:00:00Z'); // martes 12:00
const martesTarde = new Date('2026-10-06T17:00:00Z'); // martes 14:00

describe('constantes de horario', () => {
    test('define los siete días y el horario por defecto con un turno', () => {
        expect(DIAS_SEMANA).toEqual([
            'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo',
        ]);
        DIAS_SEMANA.forEach((nombre) => {
            expect(HORARIO_POR_DEFECTO[nombre]).toEqual({
                abierto: true,
                turnos: [{ apertura: '09:00', cierre: '23:00', cruzaMedianoche: false }],
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

    test('usa la fecha y la zona actuales si no se indican', () => {
        const { dia, minutos } = obtenerHoraLocal();

        expect(DIAS_SEMANA).toContain(dia);
        expect(Number.isFinite(minutos)).toBe(true);
    });

    test('la zona por defecto es Buenos Aires', () => {
        expect(ZONA_HORARIA_POR_DEFECTO).toBe('America/Argentina/Buenos_Aires');
    });
});

describe('validarHorarioSucursal', () => {
    test('acepta un día abierto con un turno', () => {
        expect(validarHorarioSucursal(horarioCon())).toBeNull();
    });

    test('acepta dos turnos sin solapamiento', () => {
        const horario = horarioDe('lunes', dia([turno('09:00', '13:00'), turno('17:00', '23:00')]));

        expect(validarHorarioSucursal(horario)).toBeNull();
    });

    test('acepta un turno que cruza la medianoche', () => {
        const horario = horarioDe('lunes', dia([turno('22:00', '02:00', true)]));

        expect(validarHorarioSucursal(horario)).toBeNull();
    });

    test('acepta un día cerrado sin turnos', () => {
        const horario = horarioDe('lunes', dia([], false));

        expect(validarHorarioSucursal(horario)).toBeNull();
    });

    test('acepta el cierre 00:00 como fin del día', () => {
        const horario = horarioDe('lunes', dia([turno('18:00', '00:00')]));

        expect(validarHorarioSucursal(horario)).toBeNull();
    });

    test('rechaza un horario que no es objeto', () => {
        expect(validarHorarioSucursal(null)).toBe('El horario debe ser un objeto con los días de la semana');
        expect(validarHorarioSucursal('texto')).toBe('El horario debe ser un objeto con los días de la semana');
        expect(validarHorarioSucursal([])).toBe('El horario debe ser un objeto con los días de la semana');
    });

    test('rechaza un día desconocido', () => {
        const horario = { ...horarioCon(), feriado: dia() };

        expect(validarHorarioSucursal(horario)).toBe('El día "feriado" no es válido');
    });

    test('exige los siete días', () => {
        const horario = horarioCon();
        delete horario.lunes;

        expect(validarHorarioSucursal(horario)).toBe('Completá el horario del lunes');
    });

    test('rechaza un día que no es objeto', () => {
        expect(validarHorarioSucursal(horarioDe('lunes', 'abierto'))).toBe('Completá el horario del lunes');
    });

    test('exige el booleano abierto', () => {
        expect(validarHorarioSucursal(horarioDe('lunes', { turnos: [] })))
            .toBe('El estado "abierto" del lunes debe ser true o false');
    });

    test('exige que los turnos sean una lista', () => {
        expect(validarHorarioSucursal(horarioDe('lunes', { abierto: true })))
            .toBe('El lunes debe indicar sus turnos');
    });

    test('admite como máximo dos turnos', () => {
        const horario = horarioDe('lunes', dia([
            turno('09:00', '10:00'),
            turno('11:00', '12:00'),
            turno('13:00', '14:00'),
        ]));

        expect(validarHorarioSucursal(horario)).toBe('El lunes admite como máximo 2 turnos');
    });

    test('un día cerrado no puede tener turnos', () => {
        expect(validarHorarioSucursal(horarioDe('lunes', dia([turno()], false))))
            .toBe('El lunes está cerrado y no puede tener turnos');
    });

    test('un día abierto debe tener al menos un turno', () => {
        expect(validarHorarioSucursal(horarioDe('lunes', dia([], true))))
            .toBe('El lunes está abierto y debe tener al menos un turno');
    });

    test('rechaza un turno que no es objeto', () => {
        expect(validarHorarioSucursal(horarioDe('lunes', dia([null]))))
            .toBe('El turno 1 del lunes: el turno debe ser un objeto');
    });

    test('rechaza un turno sin apertura', () => {
        expect(validarHorarioSucursal(horarioDe('lunes', dia([{ cierre: '23:00', cruzaMedianoche: false }]))))
            .toBe('El turno 1 del lunes: la apertura debe tener formato HH:MM (ej: "09:00")');
    });

    test('rechaza una apertura con formato inválido', () => {
        expect(validarHorarioSucursal(horarioDe('lunes', dia([turno('25:00', '23:00')]))))
            .toBe('El turno 1 del lunes: la apertura debe tener formato HH:MM (ej: "09:00")');
    });

    test('rechaza un cierre con formato inválido', () => {
        expect(validarHorarioSucursal(horarioDe('lunes', dia([turno('09:00', '24:00')]))))
            .toBe('El turno 1 del lunes: el cierre debe tener formato HH:MM (ej: "23:00")');
    });

    test('exige el flag cruzaMedianoche', () => {
        expect(validarHorarioSucursal(horarioDe('lunes', dia([{ apertura: '09:00', cierre: '23:00' }]))))
            .toBe('El turno 1 del lunes: debe indicar si cruza la medianoche');
    });

    test('rechaza cierre igual a apertura', () => {
        expect(validarHorarioSucursal(horarioDe('lunes', dia([turno('09:00', '09:00')]))))
            .toBe('El turno 1 del lunes: el cierre no puede ser igual a la apertura');
    });

    test('rechaza un cierre anterior sin flag de madrugada', () => {
        expect(validarHorarioSucursal(horarioDe('lunes', dia([turno('18:00', '02:00')]))))
            .toBe('El turno 1 del lunes: el cierre es anterior a la apertura: marcá "cruzaMedianoche" o corregí el horario');
    });

    test('rechaza un flag de madrugada con cierre posterior', () => {
        expect(validarHorarioSucursal(horarioDe('lunes', dia([turno('09:00', '23:00', true)]))))
            .toBe('El turno 1 del lunes: está marcado como cruza medianoche pero el cierre no es anterior a la apertura');
    });

    test('rechaza el cierre 00:00 marcado como madrugada', () => {
        expect(validarHorarioSucursal(horarioDe('lunes', dia([turno('18:00', '00:00', true)]))))
            .toBe('El turno 1 del lunes: el cierre "00:00" no puede estar marcado como cruza medianoche; usalo como fin del día');
    });

    test('rechaza el solapamiento entre turnos del mismo día', () => {
        expect(validarHorarioSucursal(horarioDe('lunes', dia([
            turno('09:00', '13:00'),
            turno('13:00', '18:00'),
        ])))).toBe('El turno 2 del lunes debe abrir después del cierre del turno 1 (09:00–13:00)');

        expect(validarHorarioSucursal(horarioDe('lunes', dia([
            turno('09:00', '13:00'),
            turno('12:00', '18:00'),
        ])))).toBe('El turno 2 del lunes debe abrir después del cierre del turno 1 (09:00–13:00)');
    });

    test('rechaza un turno 2 después de un cierre 00:00', () => {
        expect(validarHorarioSucursal(horarioDe('lunes', dia([
            turno('18:00', '00:00'),
            turno('01:00', '02:00'),
        ])))).toBe('El turno 2 del lunes debe abrir después del cierre del turno 1 (18:00–00:00)');
    });

    test('rechaza el turno 2 si el turno 1 cruza la medianoche', () => {
        expect(validarHorarioSucursal(horarioDe('lunes', dia([
            turno('22:00', '02:00', true),
            turno('03:00', '06:00'),
        ])))).toBe('El turno 1 del lunes cruza la medianoche, así que no puede tener un turno 2 el mismo día');
    });

    test('rechaza el solapamiento entre el cierre nocturno y el día siguiente', () => {
        const horario = horarioCon({
            viernes: dia([turno('22:00', '03:00', true)]),
            sabado: dia([turno('02:00', '09:00')]),
        });

        expect(validarHorarioSucursal(horario)).toBe(
            'El cierre del viernes a las 03:00 (+1) se superpone con la apertura del sábado a las 02:00. La apertura del sábado debe ser posterior a las 03:00.'
        );
    });

    test('rechaza el límite exacto entre el cierre nocturno y el día siguiente', () => {
        const horario = horarioCon({
            viernes: dia([turno('22:00', '03:00', true)]),
            sabado: dia([turno('03:00', '09:00')]),
        });

        expect(validarHorarioSucursal(horario)).toBe(
            'El cierre del viernes a las 03:00 (+1) se superpone con la apertura del sábado a las 03:00. La apertura del sábado debe ser posterior a las 03:00.'
        );
    });

    test('acepta que el día siguiente abra después del cierre nocturno', () => {
        const horario = horarioCon({
            viernes: dia([turno('22:00', '03:00', true)]),
            sabado: dia([turno('09:00', '18:00')]),
        });

        expect(validarHorarioSucursal(horario)).toBeNull();
    });

    test('acepta el cierre nocturno si el día siguiente está cerrado', () => {
        const horario = horarioCon({
            viernes: dia([turno('22:00', '03:00', true)]),
            sabado: dia([], false),
        });

        expect(validarHorarioSucursal(horario)).toBeNull();
    });

    test('valida el cruce domingo -> lunes', () => {
        const horario = horarioCon({
            domingo: dia([turno('22:00', '02:00', true)]),
            lunes: dia([turno('01:00', '09:00')]),
        });

        expect(validarHorarioSucursal(horario)).toBe(
            'El cierre del domingo a las 02:00 (+1) se superpone con la apertura del lunes a las 01:00. La apertura del lunes debe ser posterior a las 02:00.'
        );
    });

    test('valida el cruce lunes -> martes', () => {
        const horario = horarioCon({
            lunes: dia([turno('22:00', '02:00', true)]),
            martes: dia([turno('01:00', '09:00')]),
        });

        expect(validarHorarioSucursal(horario)).toBe(
            'El cierre del lunes a las 02:00 (+1) se superpone con la apertura del martes a las 01:00. La apertura del martes debe ser posterior a las 02:00.'
        );
    });

    test('no hay conflicto entre días si no hay turno nocturno', () => {
        expect(validarHorarioSucursal(horarioCon())).toBeNull();
    });

    test('valida contra el primer turno cuando el día siguiente tiene dos', () => {
        const horario = horarioCon({
            viernes: dia([turno('22:00', '03:00', true)]),
            sabado: dia([turno('02:00', '04:00'), turno('09:00', '18:00')]),
        });

        expect(validarHorarioSucursal(horario)).toBe(
            'El cierre del viernes a las 03:00 (+1) se superpone con la apertura del sábado a las 02:00. La apertura del sábado debe ser posterior a las 03:00.'
        );
    });

    test('valida el turno nocturno cuando es el segundo del día', () => {
        const horario = horarioCon({
            viernes: dia([turno('09:00', '13:00'), turno('22:00', '03:00', true)]),
            sabado: dia([turno('02:00', '09:00')]),
        });

        expect(validarHorarioSucursal(horario)).toBe(
            'El cierre del viernes a las 03:00 (+1) se superpone con la apertura del sábado a las 02:00. La apertura del sábado debe ser posterior a las 03:00.'
        );
    });

    test('rechaza el cruce cuando el día siguiente abre a las 00:00', () => {
        const horario = horarioCon({
            domingo: dia([turno('23:00', '00:30', true)]),
            lunes: dia([turno('00:00', '06:00')]),
        });

        expect(validarHorarioSucursal(horario)).toBe(
            'El cierre del domingo a las 00:30 (+1) se superpone con la apertura del lunes a las 00:00. La apertura del lunes debe ser posterior a las 00:30.'
        );
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
        expect(estadoSucursal(horarioDe('lunes', 'abierto'), undefined, lunes))
            .toEqual({ abierta: true, motivo: null });
    });

    test('una configuración incompleta no bloquea', () => {
        expect(estadoSucursal(horarioDe('lunes', { abierto: true }), undefined, lunes))
            .toEqual({ abierta: true, motivo: null });
        expect(estadoSucursal(horarioDe('lunes', { abierto: 'si', turnos: [] }), undefined, lunes))
            .toEqual({ abierta: true, motivo: null });
    });

    test('abre dentro del horario', () => {
        const horario = horarioDe('lunes', dia([turno('09:00', '23:00')]));

        expect(estadoSucursal(horario, undefined, lunes)).toEqual({ abierta: true, motivo: null });
    });

    test('cierra antes de la apertura', () => {
        const horario = horarioDe('lunes', dia([turno('10:00', '23:00')]));

        expect(estadoSucursal(horario, undefined, lunes)).toEqual({
            abierta: false,
            motivo: 'La sucursal se encuentra cerrada en este horario. Atiende de 10:00 a 23:00',
        });
    });

    test('cierra después del cierre', () => {
        const horario = horarioDe('lunes', dia([turno('09:00', '23:00')]));

        expect(estadoSucursal(horario, undefined, lunesNoche).abierta).toBe(false);
    });

    test('informa cuando el día está marcado como cerrado', () => {
        const horario = horarioDe('lunes', dia([], false));

        expect(estadoSucursal(horario, undefined, lunes)).toEqual({
            abierta: false,
            motivo: 'La sucursal no atiende los lunes',
        });
    });

    test('evalúa dos turnos del mismo día', () => {
        const horario = horarioDe('martes', dia([
            turno('09:00', '13:00'),
            turno('17:00', '23:00'),
        ]));

        expect(estadoSucursal(horario, undefined, martesMediodia).abierta).toBe(true);
        expect(estadoSucursal(horario, undefined, martesTarde).abierta).toBe(false);
        expect(estadoSucursal(horario, undefined, new Date('2026-10-06T22:00:00Z')).abierta).toBe(true);
    });

    test('informa todos los turnos cuando está cerrada', () => {
        const horario = horarioDe('martes', dia([
            turno('09:00', '13:00'),
            turno('17:00', '01:00', true),
        ]));

        expect(estadoSucursal(horario, undefined, martesTarde)).toEqual({
            abierta: false,
            motivo: 'La sucursal se encuentra cerrada en este horario. Atiende de 09:00 a 13:00 y de 17:00 a 01:00 (+1)',
        });
    });

    test('interpreta el cierre 00:00 como medianoche', () => {
        const horario = horarioDe('lunes', dia([turno('18:00', '00:00')]));

        expect(estadoSucursal(horario, undefined, lunesNoche).abierta).toBe(true);
    });

    test('soporta horarios que cruzan la medianoche', () => {
        const horario = horarioCon({
            lunes: dia([turno('22:00', '02:00', true)]),
            martes: dia([turno('09:00', '13:00')]),
        });

        expect(estadoSucursal(horario, undefined, martesMadrugada).abierta).toBe(true);
        expect(estadoSucursal(horario, undefined, martesMediodia).abierta).toBe(true);
        expect(estadoSucursal(horario, undefined, martesTarde).abierta).toBe(false);
    });

    test('la madrugada del lunes sigue abierta por el turno nocturno del domingo', () => {
        const horario = horarioCon({
            domingo: dia([turno('22:00', '02:00', true)]),
            lunes: dia([], false),
        });

        expect(estadoSucursal(horario, undefined, lunesMadrugada)).toEqual({ abierta: true, motivo: null });
        expect(estadoSucursal(horario, undefined, lunes).abierta).toBe(false);
    });

    test('no bloquea si los turnos son inválidos', () => {
        const horario = horarioDe('lunes', dia([
            turno('9:00', '23:00'),
            turno('09:00', '24:00'),
            turno('09:00', '23:00', true),
            turno('10:00', '09:00'),
        ]));

        expect(estadoSucursal(horario, undefined, lunes).abierta).toBe(true);
    });

    test('no bloquea si un turno no es objeto o no tiene flag', () => {
        const horario = horarioDe('lunes', dia([null, { apertura: '09:00', cierre: '23:00' }]));

        expect(estadoSucursal(horario, undefined, lunes).abierta).toBe(true);
    });

    test('ignora el turno nocturno inválido del día anterior', () => {
        const horario = horarioCon({
            domingo: dia([turno('22:00', '00:00', true)]),
            lunes: dia([turno('09:00', '23:00')]),
        });

        expect(estadoSucursal(horario, undefined, lunesMadrugada).abierta).toBe(false);
    });

    test('estaSucursalAbierta devuelve el booleano', () => {
        const horario = horarioDe('lunes', dia([turno('09:00', '23:00')]));

        expect(estaSucursalAbierta(horario, undefined, lunes)).toBe(true);
        expect(estaSucursalAbierta(null, undefined, lunes)).toBe(true);
        expect(estaSucursalAbierta(horario, undefined, lunesNoche)).toBe(false);
        expect(typeof estaSucursalAbierta()).toBe('boolean');
    });
});
