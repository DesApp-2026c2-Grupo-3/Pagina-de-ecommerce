const Joi = require('joi');

// Máximo por cada carga o baja, para evitar errores de tipeo (ej. un cero de más)
const CANTIDAD_MAXIMA = 1000;

const MOTIVOS_BAJA = ['merma', 'vencimiento', 'rotura', 'faltante', 'correccion', 'otro'];

const cantidad = Joi.number().positive().max(CANTIDAD_MAXIMA).precision(2).required().messages({
    'number.base': 'La cantidad debe ser un número válido',
    'number.positive': 'La cantidad debe ser un valor positivo',
    'number.max': `La cantidad no puede superar ${CANTIDAD_MAXIMA}`,
    'any.required': 'La cantidad es obligatoria'
});

// Quién hace el movimiento (queda en el historial)
const adminId = Joi.number().integer().positive().optional();

const cargaStockSchema = Joi.object({ cantidad, adminId });

const bajaStockSchema = Joi.object({
    cantidad,
    adminId,
    motivo: Joi.string().valid(...MOTIVOS_BAJA).required().messages({
        'any.only': 'Elegí un motivo válido',
        'any.required': 'Elegí el motivo de la baja'
    }),
    // Si el motivo es "otro", hay que explicarlo
    detalle: Joi.when('motivo', {
        is: 'otro',
        then: Joi.string().trim().min(5).max(200).required(),
        otherwise: Joi.string().trim().max(200).allow('', null),
    }).messages({
        'string.empty': 'Contá brevemente el motivo de la baja',
        'string.min': 'Contá brevemente el motivo (al menos 5 caracteres)',
        'string.max': 'El detalle no puede superar los 200 caracteres',
        'any.required': 'Contá brevemente el motivo de la baja'
    })
});

module.exports = {
    cargaStockSchema,
    bajaStockSchema,
    CANTIDAD_MAXIMA,
    MOTIVOS_BAJA
};