const { validarSucursal } = require('../../../src/middleware/admin/validarSucursal');
const { DIAS_SEMANA } = require('../../../src/utils/horarioSucursal');

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

function turno(apertura = '09:00', cierre = '23:00', cruzaMedianoche = false) {
    return { apertura, cierre, cruzaMedianoche };
}

function dia(turnos = [turno()], abierto = true) {
    return { abierto, turnos };
}

const horarioValido = Object.fromEntries(
    DIAS_SEMANA.map((nombre) => [nombre, dia()])
);

function bodyValido(datos = {}) {
    return {
        nombre: 'Morón',
        calle: 'Rivadavia',
        numero: '1234',
        localidad: 'Morón',
        provincia: 'Buenos Aires',
        codigoPostal: 'B1708',
        telefono: '11 1234-5678',
        horario: horarioValido,
        zona_horaria: 'America/Argentina/Buenos_Aires',
        latitud: -34.65,
        longitud: -58.62,
        ...datos,
    };
}

function codigoDe(res) {
    return res.json.mock.calls[0][0].code;
}

describe('validarSucursal', () => {
    test('deja pasar una sucursal válida y limpia los datos', () => {
        const req = { body: bodyValido({ nombre: '  Morón  ', latitud: '-34.65' }) };
        const next = jest.fn();

        validarSucursal(req, crearRes(), next);

        expect(next).toHaveBeenCalled();
        expect(req.body.nombre).toBe('Morón');
        expect(req.body.latitud).toBe(-34.65);
    });

    test('acepta dos turnos y un turno que cruza la medianoche', () => {
        const req = {
            body: bodyValido({
                horario: {
                    ...horarioValido,
                    lunes: dia([turno('09:00', '13:00'), turno('17:00', '01:00', true)]),
                },
            }),
        };
        const next = jest.fn();

        validarSucursal(req, crearRes(), next);

        expect(next).toHaveBeenCalled();
    });

    test('aplica la zona horaria por defecto', () => {
        const { zona_horaria, ...sinZona } = bodyValido();
        const req = { body: sinZona };

        validarSucursal(req, crearRes(), jest.fn());

        expect(req.body.zona_horaria).toBe('America/Argentina/Buenos_Aires');
    });

    test('rechaza un nombre faltante', () => {
        const { nombre, ...body } = bodyValido();
        const res = crearRes();

        validarSucursal({ body }, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(codigoDe(res)).toBe('El nombre es obligatorio');
    });

    test('rechaza un nombre demasiado corto', () => {
        const res = crearRes();

        validarSucursal({ body: bodyValido({ nombre: 'Ab' }) }, res, jest.fn());

        expect(codigoDe(res)).toBe('El nombre debe tener al menos 3 caracteres');
    });

    test('rechaza un nombre demasiado largo', () => {
        const res = crearRes();

        validarSucursal({ body: bodyValido({ nombre: 'a'.repeat(51) }) }, res, jest.fn());

        expect(codigoDe(res)).toBe('El nombre no puede superar los 50 caracteres');
    });

    test('rechaza una calle faltante', () => {
        const { calle, ...body } = bodyValido();
        const res = crearRes();

        validarSucursal({ body }, res, jest.fn());

        expect(codigoDe(res)).toBe('La calle es obligatoria');
    });

    test('rechaza una altura vacía', () => {
        const res = crearRes();

        validarSucursal({ body: bodyValido({ numero: '' }) }, res, jest.fn());

        expect(codigoDe(res)).toBe('La altura es obligatoria');
    });

    test('rechaza una altura sin números', () => {
        const res = crearRes();

        validarSucursal({ body: bodyValido({ numero: 'S/N' }) }, res, jest.fn());

        expect(codigoDe(res)).toBe('La altura debe contener un número');
    });

    test('rechaza localidad y provincia faltantes', () => {
        const { localidad, ...sinLocalidad } = bodyValido();
        const resLocalidad = crearRes();
        validarSucursal({ body: sinLocalidad }, resLocalidad, jest.fn());
        expect(codigoDe(resLocalidad)).toBe('La localidad es obligatoria');

        const { provincia, ...sinProvincia } = bodyValido();
        const resProvincia = crearRes();
        validarSucursal({ body: sinProvincia }, resProvincia, jest.fn());
        expect(codigoDe(resProvincia)).toBe('La provincia es obligatoria');
    });

    test('rechaza una ubicación fuera de Argentina', () => {
        const res = crearRes();

        validarSucursal({ body: bodyValido({ latitud: 40.4168, longitud: -3.7038 }) }, res, jest.fn());

        expect(codigoDe(res)).toBe('La ubicación debe estar dentro de Argentina');
    });

    test('exige la ubicación en el mapa', () => {
        const { latitud, ...body } = bodyValido();
        const res = crearRes();

        validarSucursal({ body }, res, jest.fn());

        expect(codigoDe(res)).toBe('Marcá la ubicación en el mapa');
    });

    test('no acepta un radio de entrega por sucursal (es un parámetro global)', () => {
        const res = crearRes();
        validarSucursal({ body: bodyValido({ radioEntregaKm: 5 }) }, res, jest.fn());
        expect(codigoDe(res)).toMatch(/not allowed/);
    });

    test('rechaza una zona horaria inválida', () => {
        const res = crearRes();

        validarSucursal({ body: bodyValido({ zona_horaria: 'Marte/Olympus' }) }, res, jest.fn());

        expect(codigoDe(res)).toBe(
            'La zona horaria no es válida (usá un identificador IANA, ej: "America/Argentina/Buenos_Aires")'
        );
    });

    test('rechaza un horario faltante', () => {
        const { horario, ...body } = bodyValido();
        const res = crearRes();

        validarSucursal({ body }, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(codigoDe(res)).toBeTruthy();
    });

    test('exige los siete días de la semana', () => {
        const { lunes, ...horarioSinLunes } = horarioValido;
        const res = crearRes();

        validarSucursal({ body: bodyValido({ horario: horarioSinLunes }) }, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(codigoDe(res)).toBe('Completá el horario del lunes');
    });

    test('exige que cada día indique sus turnos', () => {
        const res = crearRes();

        validarSucursal({
            body: bodyValido({ horario: { ...horarioValido, lunes: { abierto: true } } }),
        }, res, jest.fn());

        expect(codigoDe(res)).toBe('Cada día debe indicar sus turnos');
    });

    test('exige que cada turno indique el cierre', () => {
        const res = crearRes();

        validarSucursal({
            body: bodyValido({
                horario: { ...horarioValido, lunes: dia([{ apertura: '09:00', cruzaMedianoche: false }]) },
            }),
        }, res, jest.fn());

        expect(codigoDe(res)).toBe('Cada turno debe indicar el cierre');
    });

    test('rechaza una hora con formato inválido', () => {
        const res = crearRes();

        validarSucursal({
            body: bodyValido({ horario: { ...horarioValido, lunes: dia([turno('25:00', '23:00')]) } }),
        }, res, jest.fn());

        expect(codigoDe(res)).toBe('La apertura de cada turno debe tener formato HH:MM (ej: "09:00")');
    });

    test('exige el flag cruzaMedianoche', () => {
        const res = crearRes();

        validarSucursal({
            body: bodyValido({
                horario: { ...horarioValido, lunes: dia([{ apertura: '09:00', cierre: '23:00' }]) },
            }),
        }, res, jest.fn());

        expect(codigoDe(res)).toBe('Cada turno debe indicar si cruza la medianoche');
    });

    test('rechaza un día cerrado con turnos', () => {
        const res = crearRes();

        validarSucursal({
            body: bodyValido({ horario: { ...horarioValido, lunes: dia([turno()], false) } }),
        }, res, jest.fn());

        expect(codigoDe(res)).toBe('El lunes está cerrado y no puede tener turnos');
    });

    test('rechaza un día abierto sin turnos', () => {
        const res = crearRes();

        validarSucursal({
            body: bodyValido({ horario: { ...horarioValido, lunes: dia([], true) } }),
        }, res, jest.fn());

        expect(codigoDe(res)).toBe('El lunes está abierto y debe tener al menos un turno');
    });

    test('rechaza más de dos turnos', () => {
        const res = crearRes();

        validarSucursal({
            body: bodyValido({
                horario: {
                    ...horarioValido,
                    lunes: dia([turno('09:00', '10:00'), turno('11:00', '12:00'), turno('13:00', '14:00')]),
                },
            }),
        }, res, jest.fn());

        expect(codigoDe(res)).toBe('Cada día admite como máximo 2 turnos');
    });

    test('rechaza un cierre igual a la apertura', () => {
        const res = crearRes();

        validarSucursal({
            body: bodyValido({ horario: { ...horarioValido, lunes: dia([turno('09:00', '09:00')]) } }),
        }, res, jest.fn());

        expect(codigoDe(res)).toBe('El turno 1 del lunes: el cierre no puede ser igual a la apertura');
    });

    test('rechaza un cierre anterior sin flag de madrugada', () => {
        const res = crearRes();

        validarSucursal({
            body: bodyValido({ horario: { ...horarioValido, lunes: dia([turno('18:00', '02:00')]) } }),
        }, res, jest.fn());

        expect(codigoDe(res)).toBe(
            'El turno 1 del lunes: el cierre es anterior a la apertura: marcá "cruzaMedianoche" o corregí el horario'
        );
    });

    test('rechaza un flag de madrugada con cierre posterior', () => {
        const res = crearRes();

        validarSucursal({
            body: bodyValido({ horario: { ...horarioValido, lunes: dia([turno('09:00', '23:00', true)]) } }),
        }, res, jest.fn());

        expect(codigoDe(res)).toBe(
            'El turno 1 del lunes: está marcado como cruza medianoche pero el cierre no es anterior a la apertura'
        );
    });

    test('rechaza el solapamiento entre turnos del mismo día', () => {
        const res = crearRes();

        validarSucursal({
            body: bodyValido({
                horario: {
                    ...horarioValido,
                    lunes: dia([turno('09:00', '13:00'), turno('13:00', '18:00')]),
                },
            }),
        }, res, jest.fn());

        expect(codigoDe(res)).toBe('El turno 2 del lunes debe abrir después del cierre del turno 1 (09:00–13:00)');
    });

    test('rechaza el turno 2 si el turno 1 cruza la medianoche', () => {
        const res = crearRes();

        validarSucursal({
            body: bodyValido({
                horario: {
                    ...horarioValido,
                    lunes: dia([turno('22:00', '02:00', true), turno('03:00', '06:00')]),
                },
            }),
        }, res, jest.fn());

        expect(codigoDe(res)).toBe(
            'El turno 1 del lunes cruza la medianoche, así que no puede tener un turno 2 el mismo día'
        );
    });

    test('rechaza el solapamiento entre el cierre nocturno y el día siguiente', () => {
        const res = crearRes();

        validarSucursal({
            body: bodyValido({
                horario: {
                    ...horarioValido,
                    viernes: dia([turno('22:00', '03:00', true)]),
                    sabado: dia([turno('02:00', '09:00')]),
                },
            }),
        }, res, jest.fn());

        expect(codigoDe(res)).toBe(
            'El cierre del viernes a las 03:00 (+1) se superpone con la apertura del sábado a las 02:00. La apertura del sábado debe ser posterior a las 03:00.'
        );
    });

    test('rechaza el formato viejo del día', () => {
        const res = crearRes();

        validarSucursal({
            body: bodyValido({
                horario: {
                    ...horarioValido,
                    lunes: { apertura: '09:00', cierre: '23:00', abierto: true, turnos: [] },
                },
            }),
        }, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(codigoDe(res)).toContain('not allowed');
    });

    test('rechaza campos desconocidos', () => {
        const res = crearRes();

        validarSucursal({ body: bodyValido({ esAdmin: true }) }, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(codigoDe(res)).toMatch(/not allowed/);
    });
});
