const Joi = require('joi')

const pedidoSchema = Joi.object({
    usuarioId: Joi.number().integer().positive().required().messages({
        'number.base': 'El id de usuario debe ser un número',
        'any.required': 'El id de usuario es obligatorio'
    }),

    direccionId: Joi.number().integer().positive().required().messages({
        'number.base': 'El id de dirección debe ser un número',
        'any.required': 'Tenés que seleccionar una dirección de entrega'
    }),

    productos: Joi.array().items(
        Joi.object({
            productoId: Joi.number().integer().positive().required().messages({
                'number.base': 'El id de producto debe ser un número',
                'any.required': 'El id de producto es obligatorio'
            }),
            cantidad: Joi.number().integer().min(1).required().messages({
                'number.base': 'La cantidad debe ser un número',
                'number.min': 'La cantidad debe ser al menos 1',
                'any.required': 'La cantidad es obligatoria'
            })
        })
    ).min(1).required().messages({
        'array.min': 'El pedido debe contener al menos un producto',
        'any.required': 'El pedido debe contener productos'
    })
})

module.exports = { pedidoSchema }