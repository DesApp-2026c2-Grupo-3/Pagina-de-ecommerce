const { DOMINIO_PERSONAL, esEmailDePersonal } = require('../../src/utils/emailPersonal');

describe('esEmailDePersonal', () => {
    it('el dominio del personal es @burgerfast.com', () => expect(DOMINIO_PERSONAL).toBe('@burgerfast.com'));

    it.each(['lucia.fernandez@burgerfast.com', 'ADMIN@BURGERFAST.COM', '  ana@burgerfast.com  '])('acepta "%s"', (email) => {
        expect(esEmailDePersonal(email)).toBe(true);
    });

    it.each(['juan@gmail.com', 'juan@burgerfast.com.ar', 'juan@sub.burgerfast.com', 'juan@burgerfast.co', 'burgerfast.com', '', null, undefined])(
        'rechaza %p',
        (email) => {
            expect(esEmailDePersonal(email)).toBe(false);
        }
    );
});
