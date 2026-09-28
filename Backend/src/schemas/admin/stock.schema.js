const Joi = require('joi');

// Máximo por cada carga, para evitar errores de tipeo (ej. un cero de más)
const CANTIDAD_MAXIMA = 1000;

const cargaStockSchema = Joi.object({
    cantidad: Joi.number()
        .positive()
        .max(CANTIDAD_MAXIMA)
        .precision(2)
        .required()
        .messages({
            'number.base': 'La cantidad debe ser un número válido',
            'number.positive': 'La cantidad a cargar debe ser un valor positivo',
            'number.max': `La cantidad a cargar no puede superar ${CANTIDAD_MAXIMA}`,
            'any.required': 'La cantidad es obligatoria'
        })
});

module.exports = {
    cargaStockSchema,
    CANTIDAD_MAXIMA
};