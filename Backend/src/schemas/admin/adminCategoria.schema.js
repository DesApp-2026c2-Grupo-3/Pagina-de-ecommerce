const Joi = require('joi');

const categoriaSchema = Joi.object({
    nombre: Joi.string()
        .trim()
        .empty('')
        .min(3)
        .max(20)
        .pattern(/^(?=.*\p{L})[\p{L}\p{N}\s]+$/u)
        .required()
        .messages({
            'string.base': 'El nombre de la categoría debe ser un texto',
            'string.empty': 'El nombre de la categoría no puede estar vacío',
            'string.min': 'El nombre debe tener al menos 3 caracteres',
            'string.max': 'El nombre no puede superar los 20 caracteres',
            'string.pattern.base': 'El nombre solo puede contener letras, números y espacios',
            'any.required': 'El nombre de la categoría es obligatorio'
        })
});

module.exports = {
    categoriaSchema
};