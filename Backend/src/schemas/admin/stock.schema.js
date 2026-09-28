const Joi = require('joi');

const cargaStockSchema = Joi.object({
    cantidad: Joi.number()
        .positive()
        .precision(2)
        .required()
        .messages({
            'number.base': 'La cantidad debe ser un número válido',
            'number.positive': 'La cantidad a cargar debe ser un valor positivo',
            'any.required': 'La cantidad es obligatoria'
        })
});

module.exports = {
    cargaStockSchema
};