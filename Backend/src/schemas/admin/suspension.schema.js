const Joi = require('joi');

const productoIds = Joi.array().items(Joi.number().integer().positive()).min(1).max(200).unique().required().messages({
    'array.base': 'Elegí los productos',
    'array.min': 'Elegí al menos un producto',
    'array.max': 'No se pueden elegir más de 200 productos a la vez',
    'array.unique': 'Hay productos repetidos',
    'number.base': 'Algún producto no es válido',
    'number.integer': 'Algún producto no es válido',
    'number.positive': 'Algún producto no es válido',
    'any.required': 'Elegí los productos'
});

// El motivo es obligatorio para el encargado (lo controla el controller según el rol);
// el master puede dejarlo vacío y queda uno por defecto.
const suspenderSchema = Joi.object({
    productoIds,
    motivo: Joi.string().trim().max(200).allow('', null).optional().messages({
        'string.max': 'El motivo no puede superar los 200 caracteres',
        'string.base': 'El motivo no es válido'
    })
});

const rehabilitarSchema = Joi.object({ productoIds });

module.exports = { suspenderSchema, rehabilitarSchema };
