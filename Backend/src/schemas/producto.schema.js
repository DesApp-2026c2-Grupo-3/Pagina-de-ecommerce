const Joi = require('joi')

const productoSchema = Joi.object({
    nombre: Joi.string().trim().min(2).max(50).required().messages({
        'string.empty': 'El nombre del producto es obligatorio',
        'string.min': 'El nombre debe tener al menos 2 caracteres',
        'string.max': 'El nombre no puede superar los 50 caracteres',
        'any.required': 'El nombre del producto es obligatorio'
    }),

    descripcion: Joi.string().trim().min(5).max(300).required().messages({
        'string.empty': 'La descripción es obligatoria',
        'string.min': 'La descripción debe tener al menos 5 caracteres',
        'string.max': 'La descripción no puede superar los 300 caracteres',
        'any.required': 'La descripción es obligatoria'
    }),

    precio: Joi.number().positive().required().messages({
        'number.base': 'El precio debe ser un número',
        'number.positive': 'El precio debe ser mayor a 0',
        'any.required': 'El precio es obligatorio'
    }),

    imagen: Joi.string().trim().allow('', null).messages({
        'string.base': 'La imagen debe ser un texto (ruta o URL)'
    }),

    disponible: Joi.boolean().messages({
        'boolean.base': 'Disponible debe ser verdadero o falso'
    })
})

module.exports = { productoSchema }