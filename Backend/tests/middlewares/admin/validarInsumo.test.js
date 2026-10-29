const { validarInsumo } = require('../../../src/middleware/admin/validarInsumo');

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

function bodyValido(datos = {}) {
    return {
        nombre: 'Pan',
        unidadMedida: 'unidad',
        precioComercial: 50,
        ...datos,
    };
}

function codigoDe(res) {
    return res.json.mock.calls[0][0].code;
}

describe('validarInsumo', () => {
    test('deja pasar un insumo válido y limpia los datos', () => {
        const req = { body: bodyValido({ nombre: '  Pan  ', unidadMedida: ' unidad ', precioComercial: '50.5' }) };
        const next = jest.fn();

        validarInsumo(req, crearRes(), next);

        expect(next).toHaveBeenCalled();
        expect(req.body).toEqual({ nombre: 'Pan', unidadMedida: 'unidad', precioComercial: 50.5 });
    });

    test('acepta un precio nulo (no se cobra como extra)', () => {
        const next = jest.fn();

        validarInsumo({ body: bodyValido({ precioComercial: null }) }, crearRes(), next);

        expect(next).toHaveBeenCalled();
    });

    test('exige el nombre', () => {
        const { nombre, ...body } = bodyValido();
        const res = crearRes();

        validarInsumo({ body }, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(codigoDe(res)).toBe('El nombre del insumo es obligatorio');
    });

    test('rechaza un nombre demasiado corto', () => {
        const res = crearRes();

        validarInsumo({ body: bodyValido({ nombre: 'P' }) }, res, jest.fn());

        expect(codigoDe(res)).toBe('El nombre debe tener al menos 2 caracteres');
    });

    test('rechaza un nombre demasiado largo', () => {
        const res = crearRes();

        validarInsumo({ body: bodyValido({ nombre: 'a'.repeat(51) }) }, res, jest.fn());

        expect(codigoDe(res)).toBe('El nombre no puede superar los 50 caracteres');
    });

    test('exige la unidad de medida', () => {
        const { unidadMedida, ...body } = bodyValido();
        const res = crearRes();

        validarInsumo({ body }, res, jest.fn());

        expect(codigoDe(res)).toBe('La unidad de medida es obligatoria');
    });

    test('rechaza una unidad de medida demasiado larga', () => {
        const res = crearRes();

        validarInsumo({ body: bodyValido({ unidadMedida: 'a'.repeat(21) }) }, res, jest.fn());

        expect(codigoDe(res)).toBe('La unidad de medida no puede superar los 20 caracteres');
    });

    test('rechaza un precio negativo', () => {
        const res = crearRes();

        validarInsumo({ body: bodyValido({ precioComercial: -1 }) }, res, jest.fn());

        expect(codigoDe(res)).toBe('El precio del extra no puede ser negativo');
    });

    test('rechaza un precio demasiado alto', () => {
        const res = crearRes();

        validarInsumo({ body: bodyValido({ precioComercial: 1000000 }) }, res, jest.fn());

        expect(codigoDe(res)).toBe('El precio del extra no puede superar 999999');
    });

    test('rechaza campos desconocidos', () => {
        const res = crearRes();

        validarInsumo({ body: bodyValido({ stock: 10 }) }, res, jest.fn());

        expect(codigoDe(res)).toMatch(/not allowed/);
    });
});
