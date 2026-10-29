const { validarSucursal } = require('../../../src/middleware/admin/validarSucursal');
const { DIAS_SEMANA } = require('../../../src/utils/horarioSucursal');

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

const horarioValido = Object.fromEntries(
    DIAS_SEMANA.map((dia) => [dia, { apertura: '09:00', cierre: '23:00', abierto: true }])
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
        expect(codigoDe(res)).toMatch(/lunes/);
    });

    test('exige que cada día indique el cierre', () => {
        const res = crearRes();

        validarSucursal({
            body: bodyValido({ horario: { ...horarioValido, lunes: { apertura: '09:00', abierto: true } } }),
        }, res, jest.fn());

        expect(codigoDe(res)).toBe('Cada día debe indicar el cierre');
    });

    test('rechaza una hora con formato inválido', () => {
        const res = crearRes();

        validarSucursal({
            body: bodyValido({ horario: { ...horarioValido, lunes: { apertura: '25:00', cierre: '23:00', abierto: true } } }),
        }, res, jest.fn());

        expect(codigoDe(res)).toBe('La apertura debe tener formato HH:MM (ej: "09:00")');
    });

    test('rechaza campos desconocidos', () => {
        const res = crearRes();

        validarSucursal({ body: bodyValido({ esAdmin: true }) }, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(codigoDe(res)).toMatch(/not allowed/);
    });
});
