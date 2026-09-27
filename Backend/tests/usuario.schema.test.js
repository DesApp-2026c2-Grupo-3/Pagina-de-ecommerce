const { userSchema, loginSchema, updateSchema } = require('../src/schemas/usuario.schema');

// Devuelve el mensaje de error, o undefined si los datos son válidos
function mensajeDe(schema, datos) {
    return schema.validate(datos).error?.details[0].message;
}

const usuarioValido = {
    nombre: 'Juan Pérez',
    email: 'juan@mail.com',
    password: 'secreto123',
};

describe('userSchema (registro)', () => {
    test('acepta un usuario válido', () => {
        expect(mensajeDe(userSchema, usuarioValido)).toBeUndefined();
    });

    describe('nombre', () => {
        test.each(['Iñaki Muñoz', 'José María', 'Juan 2'])('acepta "%s"', (nombre) => {
            expect(mensajeDe(userSchema, { ...usuarioValido, nombre })).toBeUndefined();
        });

        test.each(['12345', 'Juan_Pérez', 'Ana!'])('rechaza "%s"', (nombre) => {
            expect(mensajeDe(userSchema, { ...usuarioValido, nombre })).toBe(
                'El nombre solo puede contener letras, números y espacios'
            );
        });

        test('es obligatorio', () => {
            const { nombre, ...sinNombre } = usuarioValido;
            expect(mensajeDe(userSchema, sinNombre)).toBe('El nombre es obligatorio');
        });

        test('rechaza menos de 3 caracteres', () => {
            expect(mensajeDe(userSchema, { ...usuarioValido, nombre: 'Jo' })).toBe(
                'El nombre debe tener al menos 3 caracteres'
            );
        });

        test('acepta exactamente 20 caracteres', () => {
            expect(mensajeDe(userSchema, { ...usuarioValido, nombre: 'a'.repeat(20) })).toBeUndefined();
        });

        test('rechaza más de 20 caracteres', () => {
            expect(mensajeDe(userSchema, { ...usuarioValido, nombre: 'a'.repeat(21) })).toBe(
                'El nombre no puede superar los 20 caracteres'
            );
        });
    });

    describe('email', () => {
        test('es obligatorio', () => {
            const { email, ...sinEmail } = usuarioValido;
            expect(mensajeDe(userSchema, sinEmail)).toBe('El email es obligatorio');
        });

        test.each(['juan.mail.com', 'juan@mail', 'juan@', '@mail.com'])('rechaza "%s"', (email) => {
            expect(mensajeDe(userSchema, { ...usuarioValido, email })).toBe(
                'El email no tiene un formato válido'
            );
        });

        test('acepta un email con dominio argentino', () => {
            expect(mensajeDe(userSchema, { ...usuarioValido, email: 'juan@empresa.com.ar' })).toBeUndefined();
        });
    });

    describe('contraseña', () => {
        test('es obligatoria', () => {
            const { password, ...sinPassword } = usuarioValido;
            expect(mensajeDe(userSchema, sinPassword)).toBe('La contraseña es obligatoria');
        });

        test('rechaza menos de 6 caracteres', () => {
            expect(mensajeDe(userSchema, { ...usuarioValido, password: '12345' })).toBe(
                'La contraseña debe tener al menos 6 caracteres'
            );
        });

        test('acepta exactamente 6 caracteres', () => {
            expect(mensajeDe(userSchema, { ...usuarioValido, password: '123456' })).toBeUndefined();
        });

        test('rechaza más de 20 caracteres', () => {
            expect(mensajeDe(userSchema, { ...usuarioValido, password: 'a'.repeat(21) })).toBe(
                'La contraseña no puede superar los 20 caracteres'
            );
        });
    });
});

describe('loginSchema', () => {
    const loginValido = { email: 'juan@mail.com', password: 'secreto123' };

    test('acepta un login válido', () => {
        expect(mensajeDe(loginSchema, loginValido)).toBeUndefined();
    });

    test('rechaza un email inválido', () => {
        expect(mensajeDe(loginSchema, { ...loginValido, email: 'juan' })).toBe(
            'El email no tiene un formato válido'
        );
    });

    test('exige la contraseña', () => {
        expect(mensajeDe(loginSchema, { email: 'juan@mail.com' })).toBe('La contraseña es obligatoria');
    });

    test('rechaza campos extra', () => {
        expect(mensajeDe(loginSchema, { ...loginValido, esAdmin: true })).toMatch(/not allowed/);
    });
});

describe('updateSchema (perfil)', () => {
    const perfilValido = {
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan@mail.com',
        telefono: '+54 11 1234-5678',
        dni: '30123456',
        fechaNacimiento: '1995-05-20',
        password: '',
        passwordActual: '',
    };

    test('acepta un perfil completo', () => {
        expect(mensajeDe(updateSchema, perfilValido)).toBeUndefined();
    });

    test('acepta solo nombre y email (el resto es opcional)', () => {
        expect(mensajeDe(updateSchema, { nombre: 'Juan', email: 'juan@mail.com' })).toBeUndefined();
    });

    test('acepta los opcionales vacíos', () => {
        const datos = { ...perfilValido, apellido: '', telefono: '', dni: '', fechaNacimiento: null };
        expect(mensajeDe(updateSchema, datos)).toBeUndefined();
    });

    test('rechaza un teléfono con letras', () => {
        expect(mensajeDe(updateSchema, { ...perfilValido, telefono: '11-abcd' })).toBe(
            'El teléfono solo puede contener números, espacios, guiones y el signo +'
        );
    });

    test('rechaza un DNI con letras', () => {
        expect(mensajeDe(updateSchema, { ...perfilValido, dni: '30A12' })).toBe(
            'El DNI solo puede contener números'
        );
    });

    test('rechaza una fecha de nacimiento inválida', () => {
        expect(mensajeDe(updateSchema, { ...perfilValido, fechaNacimiento: 'ayer' })).toBe(
            'La fecha de nacimiento no es válida'
        );
    });

    test('mantiene la fecha de nacimiento como AAAA-MM-DD', () => {
        const { value } = updateSchema.validate(perfilValido);
        expect(value.fechaNacimiento).toBe('1995-05-20');
    });

    test('contraseña vacía significa "no cambiarla"', () => {
        expect(mensajeDe(updateSchema, { ...perfilValido, password: '' })).toBeUndefined();
    });

    test('si se cambia la contraseña, exige al menos 6 caracteres', () => {
        expect(mensajeDe(updateSchema, { ...perfilValido, password: '123' })).toBe(
            'La contraseña debe tener al menos 6 caracteres'
        );
    });
describe('mejoras de seguridad y datos', () => {
    test('normaliza el email a minúsculas y sin espacios al registrarse', () => {
        const { value, error } = userSchema.validate({ ...usuarioValido, email: '  Juan@Mail.COM ' });
        expect(error).toBeUndefined();
        expect(value.email).toBe('juan@mail.com');
    });

    test('también normaliza el email al iniciar sesión', () => {
        const { value } = loginSchema.validate({ email: 'JUAN@mail.com', password: 'secreto123' });
        expect(value.email).toBe('juan@mail.com');
    });

    test('rechaza una contraseña de solo espacios', () => {
        expect(mensajeDe(userSchema, { ...usuarioValido, password: '      ' })).toBe(
            'La contraseña no puede ser solo espacios'
        );
    });

    test('exige la contraseña actual para cambiar la contraseña', () => {
        const datos = { nombre: 'Juan', email: 'juan@mail.com', password: 'nueva123', passwordActual: '' };
        expect(mensajeDe(updateSchema, datos)).toBe('Ingresá tu contraseña actual para cambiarla');
    });

    test('exige la contraseña actual aunque no venga el campo', () => {
        const datos = { nombre: 'Juan', email: 'juan@mail.com', password: 'nueva123' };
        expect(mensajeDe(updateSchema, datos)).toBe('Ingresá tu contraseña actual para cambiarla');
    });

    test('no exige la contraseña actual si no se cambia la contraseña', () => {
        const datos = { nombre: 'Juan', email: 'juan@mail.com', password: '', passwordActual: '' };
        expect(mensajeDe(updateSchema, datos)).toBeUndefined();
    });

    test('rechaza una fecha de nacimiento en el futuro', () => {
        const datos = { nombre: 'Juan', email: 'juan@mail.com', fechaNacimiento: '2999-01-01' };
        expect(mensajeDe(updateSchema, datos)).toBe('La fecha de nacimiento no puede ser futura');
    });

    test('acepta el DNI con puntos y los quita', () => {
        const { value, error } = updateSchema.validate({ nombre: 'Juan', email: 'juan@mail.com', dni: '30.123.456' });
        expect(error).toBeUndefined();
        expect(value.dni).toBe('30123456');
    });
});
});