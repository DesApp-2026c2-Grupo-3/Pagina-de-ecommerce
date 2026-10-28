
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    }
});

const enviarCorreoRecuperacion = async (email, token) => {
    const enlace = `${process.env.FRONTEND_URL}/restablecer-password?token=${encodeURIComponent(token)}`;

    await transporter.sendMail({
        from: `"BurgerFast" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Recuperación de contraseña - BurgerFast',
        text: `Recibimos una solicitud para restablecer tu contraseña de BurgerFast.

Para crear una nueva contraseña, abrí este enlace:
${enlace}

El enlace vence en 15 minutos. Si no solicitaste esta recuperación, podés ignorar este correo.`,
        html: `
            <h2>Recuperación de contraseña</h2>
            <p>Recibimos una solicitud para restablecer tu contraseña de BurgerFast.</p>
            <p><a href="${enlace}">Crear una nueva contraseña</a></p>
            <p>El enlace vence en 15 minutos. Si no solicitaste esta recuperación, podés ignorar este correo.</p>
        `
    });
};

module.exports = { enviarCorreoRecuperacion };
