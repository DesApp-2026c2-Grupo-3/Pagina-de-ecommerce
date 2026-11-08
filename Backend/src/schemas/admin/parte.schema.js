const Joi = require('joi');

const TIPOS = ['EQUIPO', 'INSUMO', 'PEDIDO', 'OTRO'];

const parteSchema = Joi.object({
    tipo: Joi.string().valid(...TIPOS).required().messages({
        'any.only': 'Elegí el tipo de parte',
        'any.required': 'Elegí el tipo de parte',
        'string.empty': 'Elegí el tipo de parte'
    }),
    descripcion: Joi.string().trim().min(5).max(300).required().messages({
        'string.empty': 'Contá qué pasó',
        'string.min': 'Contá qué pasó (al menos 5 caracteres)',
        'string.max': 'La descripción no puede superar los 300 caracteres',
        'any.required': 'Contá qué pasó'
    }),
    urgencia: Joi.string().valid('NORMAL', 'URGENTE').default('NORMAL').messages({
        'any.only': 'La urgencia no es válida'
    }),
    // Productos afectados (por ejemplo, los que se hacen con la máquina rota)
    productoIds: Joi.array().items(Joi.number().integer().positive()).max(50).unique().default([]).messages({
        'array.max': 'No se pueden elegir más de 50 productos',
        'array.unique': 'Hay productos repetidos',
        'number.base': 'Algún producto no es válido'
    }),
    pedidoId: Joi.number().integer().positive().allow(null).optional().messages({
        'number.base': 'El pedido no es válido'
    })
});

const resolverSchema = Joi.object({
    nota: Joi.string().trim().max(200).allow('', null).optional().messages({
        'string.max': 'La nota no puede superar los 200 caracteres'
    })
});

module.exports = { parteSchema, resolverSchema };
