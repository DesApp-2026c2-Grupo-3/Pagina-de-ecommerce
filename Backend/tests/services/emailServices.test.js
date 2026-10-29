process.env.EMAIL_USER = 'burgerfast@test.com';
process.env.FRONTEND_URL = 'http://localhost:5173';

const mockSendMail = jest.fn();

jest.mock('nodemailer', () => ({
    createTransport: jest.fn(() => ({ sendMail: mockSendMail })),
}));

const nodemailer = require('nodemailer');
const { enviarCorreoRecuperacion } = require('../../src/services/emailServices');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('enviarCorreoRecuperacion', () => {
    test('configura el transporte de Gmail con las credenciales del entorno', () => {
        jest.isolateModules(() => {
            require('../../src/services/emailServices');
        });

        expect(nodemailer.createTransport).toHaveBeenCalledWith({
            service: 'gmail',
            auth: {
                user: 'burgerfast@test.com',
                pass: process.env.EMAIL_APP_PASSWORD,
            },
        });
    });

    test('envía el enlace de recuperación con el token escapado', async () => {
        mockSendMail.mockResolvedValue({ accepted: ['juan@mail.com'] });

        await enviarCorreoRecuperacion('juan@mail.com', 'abc 123/xyz');

        const mensaje = mockSendMail.mock.calls[0][0];
        expect(mensaje.from).toBe('"BurgerFast" <burgerfast@test.com>');
        expect(mensaje.to).toBe('juan@mail.com');
        expect(mensaje.subject).toBe('Recuperación de contraseña - BurgerFast');
        expect(mensaje.text).toContain('http://localhost:5173/restablecer-password?token=abc%20123%2Fxyz');
        expect(mensaje.html).toContain('abc%20123%2Fxyz');
        expect(mensaje.text).toContain('vence en 15 minutos');
    });

    test('propaga el error si el envío falla', async () => {
        mockSendMail.mockRejectedValue(new Error('SMTP caído'));

        await expect(enviarCorreoRecuperacion('juan@mail.com', 'token'))
            .rejects.toThrow('SMTP caído');
    });
});
