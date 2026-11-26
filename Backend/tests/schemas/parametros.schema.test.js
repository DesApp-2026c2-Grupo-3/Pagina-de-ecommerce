const { parametrosSchema } = require('../../src/schemas/admin/parametros.schema');

// Un juego de parámetros válido: son los valores por defecto del modelo Parametro
const VALIDOS = {
    maxPedidosEnCurso: 2,
    radioEntregaKm: 10,
    envioBase: 1200,
    envioPorKm: 300,
    preparacionBaseMin: 10,
    preparacionPorProductoMin: 2,
    viajeMinPorKm: 4,
    margenDemoraMin: 5,
    diasParaCalificar: 7,
    opinionesEnInicio: 6,
    maxPromosPorDia: 3,
};

// Devuelve el mensaje de error, o undefined si los datos son válidos
function mensajeDe(cambios) {
    return parametrosSchema.validate({ ...VALIDOS, ...cambios }).error?.details[0].message;
}

// Valida y devuelve los datos ya convertidos por Joi
function valorDe(cambios) {
    return parametrosSchema.validate({ ...VALIDOS, ...cambios }).value;
}

describe('parametrosSchema', () => {
    describe('casos válidos', () => {
        test('acepta los valores por defecto', () => {
            expect(mensajeDe({})).toBeUndefined();
        });

        test('acepta un radio con decimales', () => {
            expect(mensajeDe({ radioEntregaKm: 7.5 })).toBeUndefined();
        });

        test.each([1, 30])('acepta un radio de %s km (límite)', (radioEntregaKm) => {
            expect(mensajeDe({ radioEntregaKm })).toBeUndefined();
        });

        test.each([1, 10])('acepta %s promos por día (límite)', (maxPromosPorDia) => {
            expect(mensajeDe({ maxPromosPorDia })).toBeUndefined();
        });

        test.each([1, 10])('acepta %s pedidos en curso (límite)', (maxPedidosEnCurso) => {
            expect(mensajeDe({ maxPedidosEnCurso })).toBeUndefined();
        });

        test('acepta envío gratis (envío base y por km en 0)', () => {
            expect(mensajeDe({ envioBase: 0, envioPorKm: 0 })).toBeUndefined();
        });

        test('acepta no mostrar opiniones en el inicio (0)', () => {
            expect(mensajeDe({ opinionesEnInicio: 0 })).toBeUndefined();
        });

        test('acepta preparación sin tiempo extra por producto (0)', () => {
            expect(mensajeDe({ preparacionPorProductoMin: 0 })).toBeUndefined();
        });

        test('convierte los números que llegan como texto', () => {
            expect(valorDe({ radioEntregaKm: '12.5', diasParaCalificar: '10' })).toMatchObject({
                radioEntregaKm: 12.5,
                diasParaCalificar: 10,
            });
        });

        test('redondea los decimales a 2 cifras', () => {
            expect(valorDe({ envioPorKm: 300.456 }).envioPorKm).toBe(300.46);
        });
    });

    describe('casos inválidos', () => {
        test('exige todos los campos', () => {
            const { radioEntregaKm, ...sinRadio } = VALIDOS;
            expect(parametrosSchema.validate(sinRadio).error.details[0].message)
                .toBe('El radio de entrega es obligatorio');
        });

        test('rechaza un texto que no es número', () => {
            expect(mensajeDe({ envioBase: 'mucho' })).toBe('El envío base debe ser un número');
        });

        test('rechaza decimales en un campo entero', () => {
            expect(mensajeDe({ diasParaCalificar: 2.5 }))
                .toBe('Los días para calificar debe ser un número entero');
        });

        test('rechaza un radio mayor a 30 km', () => {
            expect(mensajeDe({ radioEntregaKm: 31 })).toBe('El radio de entrega no puede ser mayor a 30');
        });

        test('rechaza un radio menor a 1 km', () => {
            expect(mensajeDe({ radioEntregaKm: 0.5 })).toBe('El radio de entrega no puede ser menor a 1');
        });

        test('rechaza un margen de demora en 0', () => {
            expect(mensajeDe({ margenDemoraMin: 0 })).toBe('El margen por demora no puede ser menor a 1');
        });

        test('rechaza más de 10 promos por día', () => {
            expect(mensajeDe({ maxPromosPorDia: 11 })).toBe('El máximo de promos por día no puede ser mayor a 10');
        });

        test('rechaza 0 pedidos en curso (el cliente no podría comprar)', () => {
            expect(mensajeDe({ maxPedidosEnCurso: 0 }))
                .toBe('El máximo de pedidos en curso no puede ser menor a 1');
        });

        test('rechaza minutos de viaje por km por debajo de 0,5', () => {
            expect(mensajeDe({ viajeMinPorKm: 0.2 }))
                .toBe('Los minutos de viaje por km no puede ser menor a 0.5');
        });

        test('rechaza un envío negativo', () => {
            expect(mensajeDe({ envioBase: -100 })).toBe('El envío base no puede ser menor a 0');
        });

        test('rechaza campos que no existen', () => {
            expect(mensajeDe({ cupones: 1 })).toMatch(/not allowed/);
        });
    });
});