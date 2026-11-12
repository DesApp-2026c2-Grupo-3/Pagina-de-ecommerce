const { validarSucursal } = require('../../../src/middleware/admin/validarSucursal');
const { DIAS_SEMANA } = require('../../../src/utils/horarioSucursal');

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

function dia(apertura = '09:00', cierre = '23:00', extra = {}) {
    return { abierto: true, apertura, cierre, ...extra };
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
        radioEntregaKm: 5,
        ...datos,
    };
}

function codigoDe(res) {
    return res.json.mock.calls[0][0].code;
}

describe('validarSucursal', () => {
    test('deja pasar una sucursal válida y limpia los datos', () => {
        const req = { body: bodyValido({ nombre: '  Morón  ', latitud: '-34.65', radioEntregaKm: '5.5' }) };
        const next = jest.fn();

        validarSucursal(req, crearRes(), next);

        expect(next).toHaveBeenCalled();
        expect(req.body.nombre).toBe('Morón');
        expect(req.body.latitud).toBe(-34.65);
        expect(req.body.radioEntregaKm).toBe(5.5);
    });

    test('acepta un día con transnoche', () => {
        const req = {
            body: bodyValido({
                horario: { ...horarioValido, viernes: dia('18:00', '23:59', { transnocheMin: 150 }) },
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

    test('rechaza un radio de entrega inválido', () => {
        const resCero = crearRes();
        validarSucursal({ body: bodyValido({ radioEntregaKm: 0 }) }, resCero, jest.fn());
        expect(codigoDe(resCero)).toBe('El radio de entrega debe ser mayor a 0');

        const resAlto = crearRes();
        validarSucursal({ body: bodyValido({ radioEntregaKm: 31 }) }, resAlto, jest.fn());
        expect(codigoDe(resAlto)).toBe('El radio de entrega no puede superar los 30 km');
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

    test.each([
        ['la apertura', { abierto: true, cierre: '23:00' }, 'Cada día debe indicar la apertura'],
        ['el cierre', { abierto: true, apertura: '09:00' }, 'Cada día debe indicar el cierre'],
        ['si está abierto', { apertura: '09:00', cierre: '23:00' }, 'Cada día debe indicar si está abierto'],
    ])('exige que cada día indique %s', (_campo, config, mensaje) => {
        const res = crearRes();

        validarSucursal({ body: bodyValido({ horario: { ...horarioValido, lunes: config } }) }, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(codigoDe(res)).toBe(mensaje);
    });

    test.each([
        ['una hora fuera de rango', dia('25:00', '23:00'), 'Las horas del lunes van de 00:00 a 23:59 (formato HH:MM)'],
        ['un cierre igual a la apertura', dia('09:00', '09:00'), 'En el lunes, el cierre tiene que ser posterior a la apertura'],
        ['un cierre anterior a la apertura', dia('18:00', '02:00'), 'En el lunes, el cierre tiene que ser posterior a la apertura'],
        ['una transnoche sin cerrar a las 23:59', dia('18:00', '23:00', { transnocheMin: 60 }), 'La transnoche del lunes requiere cerrar a las 23:59'],
        ['una transnoche mayor al tope', dia('18:00', '23:59', { transnocheMin: 361 }), 'La transnoche del lunes puede llegar hasta +06:00'],
        ['una transnoche en un día cerrado', { abierto: false, apertura: '09:00', cierre: '23:59', transnocheMin: 60 }, 'El lunes está cerrado: no puede tener transnoche'],
    ])('rechaza %s', (_nombre, config, mensaje) => {
        const res = crearRes();

        validarSucursal({ body: bodyValido({ horario: { ...horarioValido, lunes: config } }) }, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(codigoDe(res)).toBe(mensaje);
    });

    test('la transnoche respeta la apertura del día siguiente', () => {
        const res = crearRes();

        validarSucursal({
            body: bodyValido({
                horario: {
                    ...horarioValido,
                    viernes: dia('18:00', '23:59', { transnocheMin: 241 }),
                    sabado: dia('05:00', '15:00'),
                },
            }),
        }, res, jest.fn());

        expect(codigoDe(res)).toBe('La transnoche del viernes puede llegar hasta +04:00');
    });

    test('rechaza el formato de turnos', () => {
        const res = crearRes();

        validarSucursal({
            body: bodyValido({
                horario: {
                    ...horarioValido,
                    lunes: { abierto: true, turnos: [{ apertura: '09:00', cierre: '23:00', cruzaMedianoche: false }] },
                },
            }),
        }, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(codigoDe(res)).toBe('Cada día debe indicar la apertura');
    });

    test('rechaza campos desconocidos', () => {
        const res = crearRes();

        validarSucursal({ body: bodyValido({ esAdmin: true }) }, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(codigoDe(res)).toMatch(/not allowed/);
    });
});
