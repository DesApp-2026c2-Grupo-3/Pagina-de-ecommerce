const { adminSchema } = require('../../src/schemas/admin/admin.schema');
const { userSchema } = require('../../src/schemas/usuario.schema');

const mensajeDe = (schema, datos) => schema.validate(datos).error?.details[0].message;
const adminValido = { nombre: 'Lucía Fernández', email: 'lucia.fernandez@burgerfast.com', password: 'Burger1234', sucursalId: 1 };

describe('email del personal (adminSchema)', () => {
    it('acepta el mail laboral', () => {
        expect(adminSchema.validate(adminValido).error).toBeUndefined();
    });

    it('lo normaliza a minúsculas', () => {
        const { value } = adminSchema.validate({ ...adminValido, email: 'Lucia.Fernandez@BurgerFast.com' });
        expect(value.email).toBe('lucia.fernandez@burgerfast.com');
    });

    it.each(['lucia@gmail.com', 'lucia@burgerfast.com.ar', 'lucia@sub.burgerfast.com', 'lucia@burgerfast.co'])('rechaza "%s"', (email) => {
        expect(mensajeDe(adminSchema, { ...adminValido, email })).toBe('El email del personal debe ser @burgerfast.com');
    });
});

describe('nombre del personal (adminSchema)', () => {
    it('acepta nombre y apellido compuestos', () => {
        expect(adminSchema.validate({ ...adminValido, nombre: 'María Fernanda Rodríguez' }).error).toBeUndefined();
    });

    it('rechaza más de 40 caracteres', () => {
        expect(mensajeDe(adminSchema, { ...adminValido, nombre: 'A'.repeat(41) })).toBe('El nombre no puede superar los 40 caracteres');
    });
});

describe('clientes con el mail del personal (userSchema)', () => {
    const mensajes = (email) => (userSchema.validate({ email }, { abortEarly: false }).error?.details ?? []).map((d) => d.message);
    const RESERVADO = 'Ese email está reservado para el personal de BurgerFast';

    it('rechaza un email @burgerfast.com', () => {
        expect(mensajes('cliente@burgerfast.com')).toContain(RESERVADO);
    });

    it('no marca como reservado un email común', () => {
        expect(mensajes('cliente@gmail.com')).not.toContain(RESERVADO);
    });
});
