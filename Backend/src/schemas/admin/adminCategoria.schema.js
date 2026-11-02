const Joi = require('joi');
const { ICONOS_CATEGORIA, FONDOS_CATEGORIA } = require('../../config/categoriasEstilo');

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
        }),
    // null o sin enviar = categoría principal; un solo nivel de anidación
    categoriaPadreId: Joi.number().integer().positive().allow(null).messages({
        'number.base': 'La categoría padre no es válida',
        'number.integer': 'La categoría padre no es válida',
        'number.positive': 'La categoría padre no es válida'
    }),
    // Orden en que se muestra (de menor a mayor); sin enviar queda al final
    orden: Joi.number().integer().min(0).max(100000).messages({
        'number.base': 'El orden debe ser un número',
        'number.integer': 'El orden debe ser un número entero',
        'number.min': 'El orden no puede ser negativo',
        'number.max': 'El orden no puede superar 100000'
    }),
    // Ícono y color de la tarjeta del Home; null = el que corresponde al nombre
    icono: Joi.string().valid(...ICONOS_CATEGORIA).allow(null).messages({
        'any.only': 'El ícono elegido no es válido',
        'string.base': 'El ícono elegido no es válido'
    }),
    fondo: Joi.string().valid(...FONDOS_CATEGORIA).allow(null).messages({
        'any.only': 'El color elegido no es válido',
        'string.base': 'El color elegido no es válido'
    }),
    // Salsas y similares: tope por pedido y fuera del ranking de más pedidos
    esComplemento: Joi.boolean().messages({
        'boolean.base': 'La marca de complemento no es válida'
    })
});

module.exports = {
    categoriaSchema
};