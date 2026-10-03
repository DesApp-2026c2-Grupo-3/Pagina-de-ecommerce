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

    sucursalId: Joi.number().integer().positive().required().messages({
        'number.base': 'El id de sucursal debe ser un número',
        'any.required': 'Tenés que seleccionar una sucursal'
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
            }),
            // Tamaño elegido (id de la tabla Tamanios), si el producto tiene tamaños
            tamanioId: Joi.number().integer().positive().optional().messages({
                'number.base': 'El id de tamaño debe ser un número'
            }),
            // Solo combos: qué producto eligió el cliente en cada grupo (acompañamiento, bebida, ...)
            elecciones: Joi.array().items(
                Joi.object({
                    grupoId: Joi.number().integer().positive().required().messages({
                        'number.base': 'El id del grupo debe ser un número',
                        'any.required': 'El id del grupo es obligatorio'
                    }),
                    productoId: Joi.number().integer().positive().required().messages({
                        'number.base': 'El id del producto elegido debe ser un número',
                        'any.required': 'El id del producto elegido es obligatorio'
                    })
                })
            ).optional(),
            personalizaciones: Joi.array().items(
                Joi.object({
                    insumoId: Joi.number().integer().positive().required().messages({
                        'number.base': 'El id de insumo debe ser un número',
                        'any.required': 'Cada personalización debe indicar el insumo'
                    }),
                    cantidad: Joi.number().min(0).required().messages({
                        'number.base': 'La cantidad del insumo debe ser un número',
                        'number.min': 'La cantidad del insumo no puede ser negativa',
                        'any.required': 'Cada personalización debe indicar la cantidad'
                    })
                })
            ).default([]).messages({
                'array.base': 'Las personalizaciones deben ser una lista'
            })
        })
    ).min(1).required().messages({
        'array.min': 'El pedido debe contener al menos un producto',
        'any.required': 'El pedido debe contener productos'
    })    
})

module.exports = { pedidoSchema }