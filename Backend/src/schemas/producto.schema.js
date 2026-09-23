const Joi = require('joi');

const productoSchema = Joi.object({
    nombre: Joi.string()
        .trim()
        .min(3)
        .max(50)
        .required()
        .messages({
            'string.empty': 'El nombre del producto es obligatorio',
            'string.min': 'El nombre debe tener al menos 3 caracteres',
            'string.max': 'El nombre no puede superar los 50 caracteres',
            'any.required': 'El nombre del producto es obligatorio'
        }),

    descripcion: Joi.string()
        .trim()
        .min(3)
        .max(300)
        .required()
        .messages({
            'string.empty': 'La descripción es obligatoria',
            'string.min': 'La descripción debe tener al menos 3 caracteres',
            'string.max': 'La descripción no puede superar los 300 caracteres',
            'any.required': 'La descripción es obligatoria'
        }),

    precio: Joi.number()
        .positive()
        .precision(2)
        .required()
        .messages({
            'number.base': 'El precio debe ser un número válido',
            'number.positive': 'El precio debe ser un valor positivo',
            'any.required': 'El precio es obligatorio'
        }),

    imagen: Joi.string().trim().allow('', null).messages({
        'string.base': 'La imagen debe ser un texto (ruta o URL)'
    }),

    disponible: Joi.boolean()
        .default(true)
        .messages({
            'boolean.base': 'El campo disponible debe ser verdadero o falso'
        }),

    categoriaId: Joi.number()
        .integer()
        .positive()
        .allow(null)
        .optional()
        .messages({
            'number.base': 'El ID de la categoría debe ser un número',
            'number.integer': 'El ID de la categoría debe ser un número entero',
            'number.positive': 'El ID de la categoría debe ser positivo'
        })
});


module.exports = {
    productoSchema
};


