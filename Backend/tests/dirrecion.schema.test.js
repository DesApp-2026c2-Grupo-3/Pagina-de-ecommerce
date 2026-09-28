const {
    crearDireccionSchema,
    actualizarDireccionSchema,
} = require('../src/schemas/direccion.schema');

// Una dirección válida de base. Cada test cambia solo lo que quiere probar.
const direccionValida = {
    alias: 'Casa',
    calle: 'Florida',
    numero: '2950',
    piso: '',
    localidad: 'Merlo',
    provincia: 'Buenos Aires',
    codigoPostal: 'B1722',
    entreCalles: '',
    observaciones: '',
    latitud: -34.714,
    longitud: -58.735,
    predeterminada: false,
};

const nuevaDireccionValida = { ...direccionValida, usuarioId: 1 };

// Devuelve el mensaje de error, o undefined si los datos son válidos
function mensajeDe(schema, datos) {
    return schema.validate(datos).error?.details[0].message;
}

describe('crearDireccionSchema', () => {
    describe('casos válidos', () => {
        test('acepta una dirección completa', () => {
            expect(mensajeDe(crearDireccionSchema, nuevaDireccionValida)).toBeUndefined();
        });

        test('acepta piso, entre calles y observaciones vacíos', () => {
            const datos = { ...nuevaDireccionValida, piso: '', entreCalles: '', observaciones: '' };
            expect(mensajeDe(crearDireccionSchema, datos)).toBeUndefined();
        });

        test('convierte las coordenadas de texto a número', () => {
            const { value } = crearDireccionSchema.validate({
                ...nuevaDireccionValida,
                latitud: '-34.714',
                longitud: '-58.735',
            });
            expect(value.latitud).toBe(-34.714);
            expect(value.longitud).toBe(-58.735);
        });

        test('quita los espacios de más en los textos', () => {
            const { value } = crearDireccionSchema.validate({ ...nuevaDireccionValida, alias: '  Casa  ' });
            expect(value.alias).toBe('Casa');
        });

        test('si no viene "predeterminada", la pone en false', () => {
            const { predeterminada, ...sinPredeterminada } = nuevaDireccionValida;
            const { value } = crearDireccionSchema.validate(sinPredeterminada);
            expect(value.predeterminada).toBe(false);
        });
    });

    describe('calle y altura', () => {
        test('rechaza una dirección sin calle', () => {
            const { calle, ...sinCalle } = nuevaDireccionValida;
            expect(mensajeDe(crearDireccionSchema, sinCalle)).toBe('La calle es obligatoria');
        });

        test('rechaza una altura vacía', () => {
            const datos = { ...nuevaDireccionValida, numero: '' };
            expect(mensajeDe(crearDireccionSchema, datos)).toBe('La altura es obligatoria');
        });

        test('rechaza una altura sin números', () => {
            const datos = { ...nuevaDireccionValida, numero: 'S/N' };
            expect(mensajeDe(crearDireccionSchema, datos)).toBe('La altura debe contener un número');
        });
    });

    describe('coordenadas', () => {
        test('rechaza una dirección sin ubicación en el mapa', () => {
            const datos = { ...nuevaDireccionValida, latitud: null, longitud: null };
            expect(mensajeDe(crearDireccionSchema, datos)).toBe('Marcá la ubicación en el mapa');
        });

        test('rechaza coordenadas fuera de Argentina (Madrid)', () => {
            const datos = { ...nuevaDireccionValida, latitud: 40.4168, longitud: -3.7038 };
            expect(mensajeDe(crearDireccionSchema, datos)).toBe('La ubicación debe estar dentro de Argentina');
        });
    });

    describe('observaciones', () => {
        test('acepta exactamente 140 caracteres', () => {
            const datos = { ...nuevaDireccionValida, observaciones: 'a'.repeat(140) };
            expect(mensajeDe(crearDireccionSchema, datos)).toBeUndefined();
        });

        test('rechaza más de 140 caracteres', () => {
            const datos = { ...nuevaDireccionValida, observaciones: 'a'.repeat(141) };
            expect(mensajeDe(crearDireccionSchema, datos)).toBe(
                'Las observaciones no pueden superar los 140 caracteres'
            );
        });
    });

    describe('seguridad', () => {
        test('exige el usuario al crear', () => {
            const { usuarioId, ...sinUsuario } = nuevaDireccionValida;
            expect(mensajeDe(crearDireccionSchema, sinUsuario)).toBe('El ID de usuario es obligatorio');
        });

        test('rechaza campos que no existen', () => {
            const datos = { ...nuevaDireccionValida, esAdmin: true };
            expect(mensajeDe(crearDireccionSchema, datos)).toMatch(/not allowed/);
        });
    });
});

describe('actualizarDireccionSchema', () => {
    test('acepta una dirección válida sin usuario', () => {
        expect(mensajeDe(actualizarDireccionSchema, direccionValida)).toBeUndefined();
    });

    test('no permite cambiar el usuario dueño de la dirección', () => {
        const datos = { ...direccionValida, usuarioId: 99 };
        expect(mensajeDe(actualizarDireccionSchema, datos)).toMatch(/not allowed/);
    });
});