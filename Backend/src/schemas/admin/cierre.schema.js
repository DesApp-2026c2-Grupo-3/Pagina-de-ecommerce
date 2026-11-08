const Joi = require('joi');

const cerrarSchema = Joi.object({
    motivo: Joi.string().trim().min(5).max(200).required().messages({
        'string.empty': 'Contá brevemente el motivo del cierre',
        'string.min': 'Contá brevemente el motivo del cierre (al menos 5 caracteres)',
        'string.max': 'El motivo no puede superar los 200 caracteres',
        'any.required': 'Contá brevemente el motivo del cierre'
    })
});

module.exports = { cerrarSchema };
