const Joi = require('joi');
const { passwordSegura, mensajesPassword } = require('./admin.schema');

const cambiarPasswordSchema = Joi.object({
    passwordActual: Joi.string().required().messages({
        'string.empty': 'Ingresá tu contraseña actual',
        'any.required': 'Ingresá tu contraseña actual'
    }),
    passwordNueva: passwordSegura.required().messages(mensajesPassword)
});

module.exports = { cambiarPasswordSchema };
