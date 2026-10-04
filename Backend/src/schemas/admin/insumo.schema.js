const Joi = require('joi');

const insumoSchema = Joi.object({
    nombre: Joi.string().trim().min(2).max(50).required().messages({
        'string.empty': 'El nombre del insumo es obligatorio',
        'string.min': 'El nombre debe tener al menos 2 caracteres',
        'string.max': 'El nombre no puede superar los 50 caracteres',
        'any.required': 'El nombre del insumo es obligatorio'
    }),

    // Ej: unidad, kg, g, litro, ml
    unidadMedida: Joi.string().trim().min(1).max(20).required().messages({
        'string.empty': 'La unidad de medida es obligatoria',
        'string.max': 'La unidad de medida no puede superar los 20 caracteres',
        'any.required': 'La unidad de medida es obligatoria'
    }),

    // Lo que se le cobra al cliente por cada unidad extra (vacío = no se cobra)
    precioComercial: Joi.number().min(0).max(999999).precision(2).allow(null).messages({
        'number.base': 'El precio del extra debe ser un número',
        'number.min': 'El precio del extra no puede ser negativo',
        'number.max': 'El precio del extra no puede superar 999999'
    })
});

module.exports = { insumoSchema };