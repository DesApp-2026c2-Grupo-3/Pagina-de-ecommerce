const { adminSchema, loginSchema, updateSchema } = require('../../src/schemas/admin/admin.schema');
function mensajeDe(schema, datos) {
    return schema.validate(datos).error?.details[0].message;
}

const adminValido = {
    nombre: 'Admin Central',
    email: 'admin@burger.com',
    password: 'Segura123',
    sucursalId: 1,
};

describe('adminSchema (alta de administrador)', () => {
    test('acepta un administrador válido', () => {
        expect(mensajeDe(adminSchema, adminValido)).toBeUndefined();
    });

    test('rechaza un nombre con símbolos', () => {
        expect(mensajeDe(adminSchema, { ...adminValido, nombre: 'Admin_1' })).toBe(
            'El nombre solo puede contener letras, números y espacios'
        );
    });

    test('rechaza un email inválido', () => {
        expect(mensajeDe(adminSchema, { ...adminValido, email: 'admin@' })).toBe(
            'El email no tiene un formato válido'
        );
    });

    describe('contraseña (más exigente que la de un cliente)', () => {
        test('rechaza menos de 8 caracteres', () => {
            expect(mensajeDe(adminSchema, { ...adminValido, password: 'Corta1' })).toBe(
                'La contraseña debe tener al menos 8 caracteres'
            );
        });

        test.each(['sinmayuscula1', 'SinNumeros'])('rechaza "%s"', (password) => {
            expect(mensajeDe(adminSchema, { ...adminValido, password })).toBe(
                'La contraseña debe tener al menos una mayúscula y un número'
            );
        });

        test('rechaza más de 20 caracteres', () => {
            expect(mensajeDe(adminSchema, { ...adminValido, password: 'A1' + 'a'.repeat(19) })).toBe(
                'La contraseña no puede superar los 20 caracteres'
            );
        });
    });
});

describe('loginSchema (admin)', () => {
    test('acepta un login válido', () => {
        const datos = { email: 'admin@burger.com', password: 'Segura123' };
        expect(mensajeDe(loginSchema, datos)).toBeUndefined();
    });

    test('exige la contraseña', () => {
        expect(mensajeDe(loginSchema, { email: 'admin@burger.com' })).toBe('La contraseña es obligatoria');
    });
});

describe('updateSchema (admin)', () => {
    const edicionValida = { nombre: 'Admin Central', email: 'admin@burger.com' };

    test('acepta editar sin cambiar la contraseña', () => {
        expect(mensajeDe(updateSchema, edicionValida)).toBeUndefined();
    });

    test.each(['', null])('acepta la contraseña vacía (%s) como "no cambiarla"', (password) => {
        expect(mensajeDe(updateSchema, { ...edicionValida, password })).toBeUndefined();
    });

    test('si se cambia la contraseña, exige las mismas reglas', () => {
        expect(mensajeDe(updateSchema, { ...edicionValida, password: 'debil' })).toBe(
            'La contraseña debe tener al menos 8 caracteres'
        );
    });
});